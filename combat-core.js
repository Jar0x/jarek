(function(root, factory){
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CombatCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  function isAlive(u){ return !!u && !u.dead && u.totalHp > 0; }
  function effect(u,id){ return (u.effects||[]).find(e=>e.id===id && e.rounds>0); }
  function effectiveSpeed(u){ return Math.max(1,(u.speed||0)+((effect(u,'haste')||effect(u,'slow'))?.amount||0)); }
  function buildInitiativeOrder(units){
    return units.filter(isAlive).slice().sort((a,b) => b.speed - a.speed || a.id.localeCompare(b.id));
  }
  function canRetaliate(defender, round, adjacent){
    return isAlive(defender) && adjacent && defender.retaliatedRound !== round;
  }
  function effectiveDefense(u){ return (u.defense||0)+(u.defending?2:0); }
  function applyDefend(u){ u.defending=true; return u; }
  function clearTurnStance(u){ if(u) u.defending=false; return u; }
  function damageMultiplier(attack, defense){
    const diff = Math.max(-20, Math.min(20, (attack || 0) - (defense || 0)));
    if (diff >= 0) return 1 + diff * 0.05;
    return 1 / (1 + Math.abs(diff) * 0.05);
  }
  function creatureDamageRoll(attacker, rng=Math.random){
    if(effect(attacker,'bless')) return attacker.maxDmg||0;
    const min=attacker.minDmg||0, max=attacker.maxDmg||min;
    return Math.floor(rng()*(max-min+1))+min;
  }
  function expectedDamage(attacker, defender, rangedPenalty = 1){
    if (!isAlive(attacker) || !isAlive(defender)) return 0;
    const avg = effect(attacker,'bless') ? (attacker.maxDmg||0) : (((attacker.minDmg||0)+(attacker.maxDmg||0))/2);
    return Math.max(1, Math.round(avg * attacker.count * damageMultiplier(attacker.attack, effectiveDefense(defender)) * rangedPenalty));
  }
  function magicArrowDamage(hero){ return 25+(hero.power||0)*10; }
  function spendMana(hero,cost){ if(!hero || hero.mana<cost) return false; hero.mana-=cost; return true; }
  function upsertEffect(u,e){
    u.effects=u.effects||[];
    const old=u.effects.find(x=>x.id===e.id);
    if(old) Object.assign(old,e); else u.effects.push({...e});
    return u;
  }
  function tickEffects(u){
    u.effects=(u.effects||[]).map(e=>({...e,rounds:e.rounds-1})).filter(e=>e.rounds>0);
    return u.effects;
  }
  function aiTargetScore(target, expectedHit, distance){
    if (!isAlive(target)) return -Infinity;
    const threat = target.count * (((target.minDmg || 0) + (target.maxDmg || 0)) / 2) * (1 + (target.attack || 0) * 0.04);
    const killBonus = expectedHit >= target.totalHp ? 90 : Math.min(45, (expectedHit / Math.max(1,target.totalHp)) * 45);
    const rangedBonus = target.ranged ? 18 : 0;
    return threat + killBonus + rangedBonus - Math.max(0, distance || 0) * 4;
  }
  return { isAlive, effect, effectiveSpeed, buildInitiativeOrder, canRetaliate, effectiveDefense, applyDefend, clearTurnStance, damageMultiplier, creatureDamageRoll, expectedDamage, magicArrowDamage, spendMana, upsertEffect, tickEffects, aiTargetScore };
});
