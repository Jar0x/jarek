const V5_ARENAS=[
  [{id:'r1',c:7,r:2,kind:'ruin'},{id:'r2',c:7,r:8,kind:'ruin'},{id:'s1',c:9,r:5,kind:'stone'}],
  [{id:'t1',c:6,r:3,kind:'trunk'},{id:'t2',c:8,r:7,kind:'trunk'},{id:'s2',c:8,r:3,kind:'stone'}],
  [{id:'s3',c:6,r:7,kind:'stone'},{id:'r3',c:8,r:2,kind:'ruin'},{id:'t3',c:9,r:8,kind:'trunk'}]
];
const V5_OBSTACLE_ICON={stone:'🪨',trunk:'🪵',ruin:'🏚️'};
const v5={arenaIndex:0};
function v5Context(ignoreUnit=null){return {cols:COLS,rows:ROWS,units:game.units,obstacles:game.obstacles||[],ignoreUnit};}
function v5Footprint(u,state=u){return BattlefieldCore.footprint(u,state);}
function v5InitUnit(u){u.size=u.size||1;u.facing=u.facing||(u.team==='player'?'right':'left');u.morale=Number.isFinite(u.morale)?u.morale:0;u.luck=Number.isFinite(u.luck)?u.luck:0;u.positiveMoraleRound=u.positiveMoraleRound||0;u.moraleCheckedRound=u.moraleCheckedRound||0;}
function v5Large(id,name,team,type,c,r,count,hpPer,minDmg,maxDmg,speed,attack,defense,variant){const u=mk(id,name,team,type,c,r,count,hpPer,minDmg,maxDmg,speed,attack,defense,variant,false,0);u.size=2;u.facing=team==='player'?'right':'left';u.morale=team==='player'?2:1;u.luck=team==='player'?1:2;return u;}
function v5ChooseArena(){v5.arenaIndex=(v5.arenaIndex+1)%V5_ARENAS.length;return V5_ARENAS[v5.arenaIndex].map(o=>({...o}));}
function v5InitBattle(){
  game.units.forEach(v5InitUnit);
  if(!game.units.some(u=>u.id==='p4')) game.units.push(v5Large('p4','Kościany Behemot','player','skeleton',2,1,6,24,5,8,5,9,8,'guard'));
  if(!game.units.some(u=>u.id==='a4')) game.units.push(v5Large('a4','Bagienny Kolos','ai','blob',12,9,7,22,4,7,4,8,9,'poison'));
  game.units.forEach(v5InitUnit);
  game.obstacles=v5ChooseArena().filter(o=>!BattlefieldCore.unitAtHex(game.units,o.c,o.r));
}
const v5PrevReset=reset;
reset=function(){v5PrevReset();v5InitBattle();game.order=CombatCore.buildInitiativeOrder(game.units);game.turnIndex=0;v4Log('Combat v5: przeszkody, jednostki 2-hex, morale i szczęście.');beginTurn();render();};
restartBtn.onclick=()=>reset();
unitAt=function(c,r,ignore=null){return BattlefieldCore.unitAtHex(game.units,c,r,ignore)||null;};
isAdjacent=function(a,b){return BattlefieldCore.footprintsAdjacent(a,b);};
pathfind=function(start,goal,mover,maxSteps=99){return BattlefieldCore.findPath(mover,{c:start.c,r:start.r,facing:mover.facing},{c:goal.c,r:goal.r,facing:goal.facing},v5Context(mover),maxSteps);};
reachable=function(u){const states=BattlefieldCore.reachableStates(u,{c:u.c,r:u.r,facing:u.facing},v5Context(u),u.speed),out=new Map();for(const [sk,s] of states){const d=states.depth.get(sk),k=key(s.c,s.r);if(!out.has(k)||d<out.get(k))out.set(k,d);}return out;};
moveAlong=async function(u,path){if(!path||!path.length)return;u.anim='move';for(const step of path){u.c=step.c;u.r=step.r;if(step.facing)u.facing=step.facing;render();await sleep(115);}u.anim='idle';render();};
function v5LegalAttackStates(attacker,target,maxSteps=attacker.speed){const states=BattlefieldCore.reachableStates(attacker,{c:attacker.c,r:attacker.r,facing:attacker.facing},v5Context(attacker),maxSteps),out=[];for(const [sk,state] of states){if(BattlefieldCore.footprintsAdjacent(attacker,target,state,target))out.push({state,distance:states.depth.get(sk)});}return out.sort((a,b)=>a.distance-b.distance);}
function v5BestAttackState(attacker,target,preferred){const candidates=v5LegalAttackStates(attacker,target,attacker.speed);if(!candidates.length)return null;if(!preferred)return candidates[0];candidates.sort((a,b)=>hexDist(a.state,preferred)-hexDist(b.state,preferred)||a.distance-b.distance);return candidates[0];}
const v5PrevAttemptPlayerAttack=attemptPlayerAttack;
attemptPlayerAttack=async function(target,side){if(game.busy||game.over)return;const u=active();if(!u||u.team!=='player'||target.dead)return;if(canShoot(u))return v5PrevAttemptPlayerAttack(target,side);const choice=v5BestAttackState(u,target,side);if(!choice){statusText.textContent='Brak legalnego ustawienia całej jednostki do ataku.';return;}const path=BattlefieldCore.findPath(u,{c:u.c,r:u.r,facing:u.facing},choice.state,v5Context(u),u.speed);if(!path){statusText.textContent='Wybrane ustawienie jest poza zasięgiem.';return;}game.busy=true;hoverAttack=null;await moveAlong(u,path);await attack(u,target,'melee');game.busy=false;endTurn();};
function v5FullAttackRoute(attacker,target){const states=BattlefieldCore.reachableStates(attacker,{c:attacker.c,r:attacker.r,facing:attacker.facing},v5Context(attacker),99),candidates=[];for(const [sk,state] of states){if(BattlefieldCore.footprintsAdjacent(attacker,target,state,target))candidates.push({state,distance:states.depth.get(sk)});}candidates.sort((a,b)=>a.distance-b.distance);if(!candidates.length)return null;const c=candidates[0],path=BattlefieldCore.findPath(attacker,{c:attacker.c,r:attacker.r,facing:attacker.facing},c.state,v5Context(attacker),99);return path?{...c,path}:null;}
const v5PrevAiTurn=aiTurn;
aiTurn=async function(u){if(u.dead)return endTurn();const enemies=enemiesOf(u);if(!enemies.length)return checkEnd();if(canShoot(u))return v5PrevAiTurn(u);const choices=enemies.map(e=>{const route=v5FullAttackRoute(u,e);return route?{e,...route,score:CombatCore.aiTargetScore(e,estimateDamage(u,e,'melee'),route.distance)}:null;}).filter(Boolean);const now=choices.filter(x=>x.distance<=u.speed).sort((a,b)=>b.score-a.score)[0];if(now){await moveAlong(u,now.path.slice(0,u.speed));await attack(u,now.e,'melee');endTurn();return;}const approach=choices.sort((a,b)=>a.distance-b.distance||b.score-a.score)[0];if(approach)await moveAlong(u,approach.path.slice(0,u.speed));endTurn();};
const v5PrevMakeUnit=makeUnit;
makeUnit=function(u){v5PrevMakeUnit(u);if(u.size===2){const el=[...BF.querySelectorAll('.unit')].at(-1);if(el)el.classList.add('size-2',`facing-${u.facing}`);const rear=v5Footprint(u)[1],p=pos(rear.c,rear.r),ring=document.createElement('div');ring.className='large-tail-ring';ring.style.left=p.x+'px';ring.style.top=(p.y+5)+'px';BF.appendChild(ring);}};
const v5PrevAddHitbox=addHitbox;
addHitbox=function(u){v5PrevAddHitbox(u);if(u.size!==2)return;const head=BF.querySelector(`.unit-hitbox[data-id="${u.id}"]`),rear=v5Footprint(u)[1];if(!head||!rear)return;const p=pos(rear.c,rear.r),tail=document.createElement('div');tail.className=`unit-hitbox ${u.type} tail-hitbox`;tail.style.left=p.x+'px';tail.style.top=p.y+'px';tail.dataset.id=u.id;tail.onmouseenter=()=>head.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));tail.onmouseleave=()=>head.dispatchEvent(new MouseEvent('mouseleave',{bubbles:false}));tail.onmousemove=ev=>head.dispatchEvent(new MouseEvent('mousemove',{clientX:ev.clientX,clientY:ev.clientY,bubbles:false}));tail.onclick=()=>head.click();BF.appendChild(tail);};
function v5Fx(u,icon){if(!u)return;const p=pos(u.c,u.r),el=document.createElement('div');el.className='v5-fx';el.style.left=p.x+'px';el.style.top=(p.y-42)+'px';el.textContent=icon;BF.appendChild(el);setTimeout(()=>el.remove(),850);}
function v5CheckMorale(u){if(!u||u.moraleCheckedRound===game.round)return 'none';u.moraleCheckedRound=game.round;const result=CombatCore.rollMorale(u,game.round);if(result==='positive'){u.v5ExtraAction=true;v4Log(`${u.name}: wysokie morale! Oddział otrzyma dodatkową akcję.`,'morale');v5Fx(u,'😃');}else if(result==='negative'){v4Log(`${u.name}: niskie morale — oddział traci turę.`,'morale-bad');v5Fx(u,'☹️');}return result;}
const v5PrevBeginTurn=beginTurn;
beginTurn=async function(){const candidate=active();if(candidate?.team==='player'&&CombatCore.isAlive(candidate)&&candidate.moraleCheckedRound!==game.round){const morale=v5CheckMorale(candidate);if(morale==='negative'){render();game.turnIndex++;return beginTurn();}}return v5PrevBeginTurn();};
const v5PrevEndTurn=endTurn;
endTurn=function(){const u=active();if(u?.v5ExtraAction&&CombatCore.isAlive(u)){u.v5ExtraAction=false;CombatCore.consumePositiveMorale(u,game.round);v4Log(`${u.name} korzysta z dodatkowej akcji morale.`,'morale');return beginTurn();}return v5PrevEndTurn();};
const v5AiWithGeometry=aiTurn;
aiTurn=async function(u){if(u.moraleCheckedRound!==game.round){const morale=v5CheckMorale(u);if(morale==='negative'){endTurn();return;}}return v5AiWithGeometry(u);};
const v5PrevRollDamage=rollDamage;
rollDamage=function(a,d,mode){const base=v5PrevRollDamage(a,d,mode),lucky=CombatCore.rollLuck(a);a.v5Lucky=lucky;return CombatCore.applyLuckDamage(base,lucky,false);};
const v5PrevStrike=strike;
strike=async function(a,d,mode,isRetaliation=false){const result=await v5PrevStrike(a,d,mode,isRetaliation);if(a.v5Lucky){v4Log(`${a.name}: szczęście! Obrażenia zostały podwojone.`,'luck');v5Fx(a,'🍀');a.v5Lucky=false;}return result;};
function v5RenderObstacles(){BF.querySelectorAll('.battle-obstacle').forEach(n=>n.remove());for(const o of game.obstacles||[]){const p=pos(o.c,o.r),el=document.createElement('div');el.className=`battle-obstacle obstacle-${o.kind}`;el.style.left=p.x+'px';el.style.top=p.y+'px';el.textContent=V5_OBSTACLE_ICON[o.kind]||'◆';el.title=o.kind;BF.appendChild(el);}}
function v5EnhanceCard(){const shown=game.units.find(u=>u.id===inspectedUnitId)||active();if(!shown||!unitCard)return;unitCard.querySelector('.v5-stats')?.remove();const d=document.createElement('div');d.className='v5-stats';d.innerHTML=`<span>Rozmiar <b>${shown.size===2?'2 heksy':'1 heks'}</b></span><span>Kierunek <b>${shown.facing==='left'?'←':'→'}</b></span><span>Morale <b>${shown.morale>=0?'+':''}${shown.morale}</b></span><span>Szczęście <b>+${shown.luck}</b></span>`;unitCard.appendChild(d);}
const v5PrevRender=render;
render=function(rebuild=true){BF.querySelectorAll('.large-tail-ring').forEach(n=>n.remove());v5PrevRender(rebuild);v5RenderObstacles();v5EnhanceCard();if(initiativeQueue)initiativeQueue.querySelectorAll('.queue-unit').forEach((el,i)=>{const u=game.order[i];if(u?.size===2)el.classList.add('large');if(u?.morale)el.title+=` · morale ${u.morale}`;if(u?.luck)el.title+=` · szczęście ${u.luck}`;});};
v5InitBattle();game.order=CombatCore.buildInitiativeOrder(game.units);game.turnIndex=0;v4Log('Combat v5 aktywny.');beginTurn();render();restartBtn.onclick=()=>reset();
