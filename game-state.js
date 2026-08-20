(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./adventure-core.js'):root.AdventureCore); if(typeof module==='object'&&module.exports) module.exports=api; else root.GameState=api;})(typeof globalThis!=='undefined'?globalThis:this,function(AdventureCore){
  const STORAGE_KEY='kingdoms-borderlands-adventure-v1';
  const RESOURCE_KEYS=['stone','wood','mercury','sulfur','gems','gold','soulMushrooms'];
  function defaultArmy(){return [
    {unitId:'skeleton',id:'hero-skeleton',name:'Szkielet',type:'skeleton',count:14,hpPer:10,totalHp:140,minDmg:2,maxDmg:4,speed:5,attack:5,defense:4,size:1,ranged:false,shots:0},
    {unitId:'bone-archer',id:'hero-bone-archer',name:'Kościany Łucznik',type:'skeleton',variant:'archer',count:10,hpPer:8,totalHp:80,minDmg:2,maxDmg:3,speed:6,attack:6,defense:3,size:1,ranged:true,shots:8,maxShots:8}
  ];}
  function createDefaultState(){return {
    version:1,
    calendar:{day:1,week:1,month:1},
    resources:{stone:10,wood:10,mercury:0,sulfur:0,gems:0,gold:2500,soulMushrooms:0},
    hero:{id:'aldren',name:'Aldren',faction:'castle',level:1,xp:0,attack:2,defense:1,power:3,knowledge:3,movement:1800,maxMovement:1800,x:4,y:24,army:defaultArmy(),temporaryBonuses:{}},
    map:{scenarioId:'abandoned-gold-mine',collectedObjectIds:[],defeatedArmyIds:[],ownedStructureIds:[],ownedMineIds:[],discoveredTiles:[],capturedTownIds:['castle-haven','necropolis-morrow']},
    towns:{},
    pendingBattle:null,lastBattleResult:null,scenarioStatus:'playing',lastProcessedDayKey:'1:1:1',lastProcessedWeekKey:'1:1'
  };}
  function normalizeResources(r={}){const out={}; for(const k of RESOURCE_KEYS) out[k]=Number.isFinite(+r[k])?+r[k]:0; return out;}
  function normalizeState(state){
    const base=createDefaultState(), s=state&&typeof state==='object'?state:{};
    const out={...base,...s}; out.calendar={...base.calendar,...(s.calendar||{})}; out.resources=normalizeResources({...base.resources,...(s.resources||{})});
    out.hero={...base.hero,...(s.hero||{}),army:Array.isArray(s.hero?.army)?s.hero.army.map(x=>({...x})):base.hero.army.map(x=>({...x})),temporaryBonuses:{...base.hero.temporaryBonuses,...(s.hero?.temporaryBonuses||{})}};
    out.map={...base.map,...(s.map||{})}; for(const k of ['collectedObjectIds','defeatedArmyIds','ownedStructureIds','ownedMineIds','discoveredTiles','capturedTownIds']) if(!Array.isArray(out.map[k])) out.map[k]=[];
    out.towns=s.towns&&typeof s.towns==='object'?JSON.parse(JSON.stringify(s.towns)):{};
    return out;
  }
  function dailyIncome(state,mapObjects=[]){
    state.resources=normalizeResources(state.resources||{}); state.map=state.map||{}; const owned=new Set([...(state.map.ownedStructureIds||[]),...(state.map.ownedMineIds||[])]);
    for(const o of mapObjects){if(!owned.has(o.id)||!o.produces) continue; const {resource,amount}=o.produces; if(RESOURCE_KEYS.includes(resource)) state.resources[resource]+=amount||0;}
    return state.resources;
  }
  function endDay(state,mapObjects=[],townCore=null){
    dailyIncome(state,mapObjects);
    if(townCore){for(const town of Object.values(state.towns||{})) townCore.dailyTownIncome(town,state.resources);}
    const next=AdventureCore.advanceCalendar(state.calendar); state.calendar={day:next.day,week:next.week,month:next.month}; state.hero.movement=state.hero.maxMovement;
    if(next.newWeek&&townCore){for(const town of Object.values(state.towns||{})) townCore.applyWeeklyGrowth(town);}
    return {newWeek:next.newWeek,newMonth:next.newMonth,calendar:{...state.calendar}};
  }
  function save(state,storage){storage=storage||(typeof localStorage!=='undefined'?localStorage:null); if(!storage) return state; const s=normalizeState(state); storage.setItem(STORAGE_KEY,JSON.stringify(s)); return s;}
  function load(storage){storage=storage||(typeof localStorage!=='undefined'?localStorage:null); if(!storage) return createDefaultState(); try{const raw=storage.getItem(STORAGE_KEY); return raw?normalizeState(JSON.parse(raw)):createDefaultState();}catch{return createDefaultState();}}
  function reset(storage){storage=storage||(typeof localStorage!=='undefined'?localStorage:null); if(storage) storage.removeItem(STORAGE_KEY); const s=createDefaultState(); if(storage) save(s,storage); return s;}
  function dayKey(c){return `${c.month}:${c.week}:${c.day}`;} function weekKey(c){return `${c.month}:${c.week}`;}
  return {STORAGE_KEY,RESOURCE_KEYS,createDefaultState,normalizeState,dailyIncome,endDay,save,load,reset,dayKey,weekKey};
});
