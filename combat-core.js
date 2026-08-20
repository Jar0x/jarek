(function(root, factory){
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CombatCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  function isAlive(u){ return !!u && !u.dead && u.totalHp > 0; }

  function buildInitiativeOrder(units){
    return units.filter(isAlive).slice().sort((a,b) => b.speed - a.speed || a.id.localeCompare(b.id));
  }

  function canRetaliate(defender, round, adjacent){
    return isAlive(defender) && adjacent && defender.retaliatedRound !== round;
  }

  function damageMultiplier(attack, defense){
    const diff = Math.max(-20, Math.min(20, (attack || 0) - (defense || 0)));
    if (diff >= 0) return 1 + diff * 0.05;
    return 1 / (1 + Math.abs(diff) * 0.05);
  }

  function expectedDamage(attacker, defender, rangedPenalty = 1){
    if (!isAlive(attacker) || !isAlive(defender)) return 0;
    const avg = ((attacker.minDmg || 0) + (attacker.maxDmg || 0)) / 2;
    return Math.max(1, Math.round(avg * attacker.count * damageMultiplier(attacker.attack, defender.defense) * rangedPenalty));
  }

  function aiTargetScore(target, expectedHit, distance){
    if (!isAlive(target)) return -Infinity;
    const threat = target.count * (((target.minDmg || 0) + (target.maxDmg || 0)) / 2) * (1 + (target.attack || 0) * 0.04);
    const killBonus = expectedHit >= target.totalHp ? 90 : Math.min(45, (expectedHit / Math.max(1,target.totalHp)) * 45);
    const rangedBonus = target.ranged ? 18 : 0;
    return threat + killBonus + rangedBonus - Math.max(0, distance || 0) * 4;
  }

  return { isAlive, buildInitiativeOrder, canRetaliate, damageMultiplier, expectedDamage, aiTargetScore };
});
