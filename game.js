const BF = document.getElementById('battlefield');
const statusText = document.getElementById('statusText');
const turnLabel = document.getElementById('turnLabel');
const playerCount = document.getElementById('playerCount');
const aiCount = document.getElementById('aiCount');
const restartBtn = document.getElementById('restartBtn');
const unitCard = document.getElementById('unitCard');
const initiativeQueue = document.getElementById('initiativeQueue');

const COLS = 15, ROWS = 11;
const X0 = 76, Y0 = 76, DX = 61, DY = 49;
const cells = [];
const kfDone = new Set();
let game;
let hoverAttack = null;
let inspectedUnitId = null;

const DIRS_EVEN = [[1,0],[-1,0],[0,-1],[-1,-1],[0,1],[-1,1]];
const DIRS_ODD  = [[1,0],[-1,0],[1,-1],[0,-1],[1,1],[0,1]];

function pos(c,r){ return {x:X0+c*DX+(r%2?DX/2:0), y:Y0+r*DY}; }
function key(c,r){ return `${c},${r}`; }
function inBoard(c,r){ return c>=0 && c<COLS && r>=0 && r<ROWS; }
function neighbors(c,r){
  const dirs = r%2 ? DIRS_ODD : DIRS_EVEN;
  return dirs.map(([dc,dr])=>({c:c+dc,r:r+dr})).filter(p=>inBoard(p.c,p.r));
}
function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function cube(c,r){ const x=c-(r-(r&1))/2,z=r,y=-x-z; return {x,y,z}; }
function hexDist(a,b){ const A=cube(a.c,a.r),B=cube(b.c,b.r); return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z)); }

function buildBoard(){
  BF.innerHTML=''; cells.length=0;
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const d=document.createElement('div');
    d.className='cell'; d.dataset.c=c; d.dataset.r=r;
    const p=pos(c,r); d.style.left=p.x+'px'; d.style.top=p.y+'px';
    d.onclick=()=>handleCell(c,r); BF.appendChild(d); cells.push(d);
  }
}

function mk(id,name,team,type,c,r,count,hpPer,minDmg,maxDmg,speed,attack,defense,variant='',ranged=false,shots=0){
  return {id,name,team,type,c,r,count,hpPer,totalHp:count*hpPer,minDmg,maxDmg,speed,attack,defense,variant,ranged,shots,maxShots:shots,retaliatedRound:0,anim:'idle',dead:false};
}

function reset(){
  buildBoard(); hoverAttack=null; inspectedUnitId=null;
  game={over:false,busy:false,round:1,turnIndex:0,order:[],units:[
    mk('p1','Szkielet','player','skeleton',2,3,14,10,2,4,5,5,4,''),
    mk('p2','Kościany Strażnik','player','skeleton',2,6,9,14,3,5,4,6,7,'guard'),
    mk('p3','Kościany Łucznik','player','skeleton',2,8,10,8,2,3,6,6,3,'archer',true,8),
    mk('a1','Szlam','ai','blob',12,3,16,11,2,4,4,4,4,''),
    mk('a2','Jadowity Szlam','ai','blob',12,7,10,14,3,5,5,7,5,'poison'),
    mk('a3','Kościany Łucznik SI','ai','skeleton',12,5,9,8,2,3,6,6,3,'archer',true,8)
  ]};
  startRound();
}

function alive(team){ return game.units.filter(u=>CombatCore.isAlive(u) && (!team || u.team===team)); }
function unitAt(c,r,ignore=null){ return game.units.find(u=>u!==ignore && CombatCore.isAlive(u) && u.c===c && u.r===r); }
function active(){ return game.order[game.turnIndex]; }
function enemiesOf(u){ return alive(u.team==='player'?'ai':'player'); }
function isAdjacent(a,b){ return hexDist(a,b)===1; }
function hasAdjacentEnemy(u){ return enemiesOf(u).some(e=>isAdjacent(u,e)); }
function canShoot(u){ return u.ranged && u.shots>0 && !hasAdjacentEnemy(u); }

function startRound(){
  game.order = CombatCore.buildInitiativeOrder(game.units);
  game.turnIndex=0;
  beginTurn();
}

async function beginTurn(){
  hoverAttack=null; inspectedUnitId=null;
  while(game.turnIndex < game.order.length && !CombatCore.isAlive(game.order[game.turnIndex])) game.turnIndex++;
  if(checkEnd()) return;
  if(game.turnIndex>=game.order.length){ game.round++; startRound(); return; }
  const u=active();
  u.anim='idle'; render();
  if(u.team==='ai'){
    game.busy=true; statusText.textContent=`SI planuje ruch: ${u.name}…`;
    await sleep(420); await aiTurn(u); game.busy=false;
  } else {
    game.busy=false;
    statusText.textContent=canShoot(u)
      ? `${u.name}: strzel do przeciwnika albo kliknij żółty heks, aby się ruszyć.`
      : `${u.name}: wybierz pole ruchu albo stronę ataku.`;
    renderInfo();
  }
}

function endTurn(){ if(checkEnd()) return; game.turnIndex++; beginTurn(); }

function checkEnd(){
  const p=alive('player').length, a=alive('ai').length;
  if(!p || !a){
    game.over=true; game.busy=true;
    statusText.textContent=p?'Zwycięstwo! Armia przeciwnika została pokonana.':'Porażka. SI rozbiło Twoją armię.';
    render(); return true;
  }
  return false;
}

function pathfind(start,goal,mover,maxSteps=99){
  const q=[start], prev=new Map([[key(start.c,start.r),null]]), depth=new Map([[key(start.c,start.r),0]]);
  while(q.length){
    const cur=q.shift(), d=depth.get(key(cur.c,cur.r));
    if(cur.c===goal.c && cur.r===goal.r) break;
    if(d>=maxSteps) continue;
    for(const n of neighbors(cur.c,cur.r)){
      const k=key(n.c,n.r); if(prev.has(k)) continue;
      if(unitAt(n.c,n.r,mover)) continue;
      prev.set(k,cur); depth.set(k,d+1); q.push(n);
    }
  }
  const gk=key(goal.c,goal.r); if(!prev.has(gk)) return null;
  const path=[]; let cur=goal;
  while(cur && !(cur.c===start.c&&cur.r===start.r)){ path.push(cur); cur=prev.get(key(cur.c,cur.r)); }
  return path.reverse();
}

function reachable(u){
  const out=new Map(), q=[{c:u.c,r:u.r,d:0}]; out.set(key(u.c,u.r),0);
  while(q.length){
    const cur=q.shift(); if(cur.d>=u.speed) continue;
    for(const n of neighbors(cur.c,cur.r)){
      const k=key(n.c,n.r); if(out.has(k)||unitAt(n.c,n.r,u)) continue;
      out.set(k,cur.d+1); q.push({c:n.c,r:n.r,d:cur.d+1});
    }
  }
  return out;
}

async function moveAlong(u,path){
  if(!path||!path.length) return;
  u.anim='move';
  for(const step of path){ u.c=step.c; u.r=step.r; render(); await sleep(115); }
  u.anim='idle'; render();
}

function handleCell(c,r){
  if(game.over||game.busy) return;
  const u=active(); if(!u||u.team!=='player'||unitAt(c,r)) return;
  const path=pathfind({c:u.c,r:u.r},{c,r},u,u.speed);
  if(path&&path.length<=u.speed){
    game.busy=true; moveAlong(u,path).then(()=>{ game.busy=false; endTurn(); });
  }
}

function bestSideFromPointer(target,clientX,clientY){
  const rect=BF.getBoundingClientRect(), center=pos(target.c,target.r);
  const mx=clientX-rect.left+BF.scrollLeft, my=clientY-rect.top+BF.scrollTop;
  const ang=Math.atan2(my-center.y,mx-center.x), ns=neighbors(target.c,target.r);
  let best=null,bestScore=1e9;
  for(const n of ns){
    const p=pos(n.c,n.r), a=Math.atan2(p.y-center.y,p.x-center.x);
    const diff=Math.abs(Math.atan2(Math.sin(ang-a),Math.cos(ang-a)));
    if(diff<bestScore){ bestScore=diff; best=n; }
  }
  return best;
}

function cursorForSide(target,side){
  const a=pos(target.c,target.r), b=pos(side.c,side.r), deg=Math.atan2(a.y-b.y,a.x-b.x)*180/Math.PI;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><g transform="rotate(${deg} 18 18)"><path d="M4 18h19" stroke="#fff4ba" stroke-width="7" stroke-linecap="round"/><path d="M4 18h19" stroke="#7b170f" stroke-width="3" stroke-linecap="round"/><path d="M22 8l10 10-10 10" fill="#d23a2d" stroke="#fff4ba" stroke-width="2"/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 18 18, crosshair`;
}

function addHitbox(u){
  const p=pos(u.c,u.r), hb=document.createElement('div');
  hb.className=`unit-hitbox ${u.type}`; hb.style.left=p.x+'px'; hb.style.top=p.y+'px'; hb.dataset.id=u.id;
  hb.onmouseenter=()=>{ inspectedUnitId=u.id; renderInfo(); };
  hb.onmouseleave=()=>{ inspectedUnitId=null; renderInfo(); };

  if(!game.over&&!game.busy&&active()?.team==='player'&&u.team==='ai'){
    if(canShoot(active())){
      hb.classList.add('shootable'); hb.style.cursor='crosshair';
      hb.onmousemove=()=>{ hoverAttack={target:u,side:null,ranged:true}; render(false); };
      hb.onclick=()=>attemptPlayerAttack(u,null);
    } else {
      hb.onmousemove=(ev)=>{
        const side=bestSideFromPointer(u,ev.clientX,ev.clientY);
        hoverAttack={target:u,side,ranged:false}; hb.style.cursor=cursorForSide(u,side); render(false);
      };
      hb.onclick=()=>attemptPlayerAttack(u,hoverAttack?.target===u?hoverAttack.side:null);
    }
    const oldLeave=hb.onmouseleave;
    hb.onmouseleave=()=>{ hoverAttack=null; oldLeave(); render(false); };
  }
  BF.appendChild(hb);
}

async function attemptPlayerAttack(target,side){
  if(game.busy||game.over) return;
  const u=active(); if(!u||u.team!=='player'||target.dead) return;
  game.busy=true; hoverAttack=null;

  if(canShoot(u)){
    await attack(u,target,'ranged');
    game.busy=false; endTurn(); return;
  }

  side ||= neighbors(target.c,target.r).find(n=>!unitAt(n.c,n.r,u));
  if(!side||unitAt(side.c,side.r,u)){ game.busy=false; statusText.textContent='Z tej strony nie ma miejsca na atak.'; return; }
  const path=pathfind({c:u.c,r:u.r},side,u,u.speed);
  if(!path||path.length>u.speed){ game.busy=false; statusText.textContent='Wybrana strona przeciwnika jest poza zasięgiem ruchu.'; return; }
  await moveAlong(u,path);
  await attack(u,target,'melee');
  game.busy=false; endTurn();
}

function rangedPenalty(a,d){ return hexDist(a,d)>6?0.5:1; }
function rollDamage(a,d,mode){
  const base=rand(a.minDmg,a.maxDmg)*a.count;
  const rangeFactor=mode==='ranged'?rangedPenalty(a,d):1;
  return Math.max(1,Math.round(base*CombatCore.damageMultiplier(a.attack,d.defense)*rangeFactor));
}
function estimateDamage(a,d,mode){
  return CombatCore.expectedDamage(a,d,mode==='ranged'?rangedPenalty(a,d):1);
}

async function strike(a,d,mode,isRetaliation=false){
  a.anim='attack'; render();
  await sleep(a.type==='skeleton'?250:300);
  const dmg=rollDamage(a,d,mode);
  if(mode==='ranged'&&!isRetaliation) a.shots=Math.max(0,a.shots-1);
  applyDamage(d,dmg); showDamage(d,dmg,isRetaliation?'Kontra':''); render();
  await sleep(a.type==='skeleton'?300:360);
  a.anim='idle';
  if(d.totalHp<=0){ d.dead=true; d.anim='death'; }
  render();
  if(d.dead){ await sleep(d.type==='blob'?600:260); d.anim='gone'; render(); }
  return dmg;
}

async function attack(a,d,mode='melee'){
  await strike(a,d,mode,false);
  if(mode==='melee'&&CombatCore.canRetaliate(d,game.round,isAdjacent(a,d))){
    d.retaliatedRound=game.round;
    statusText.textContent=`${d.name} kontratakuje!`;
    await sleep(220);
    await strike(d,a,'melee',true);
  }
}

function applyDamage(u,dmg){
  u.totalHp=Math.max(0,u.totalHp-dmg);
  u.count=u.totalHp<=0?0:Math.ceil(u.totalHp/u.hpPer);
}

function bestRangedTarget(u,enemies){
  return enemies.map(e=>({e,score:CombatCore.aiTargetScore(e,estimateDamage(u,e,'ranged'),hexDist(u,e))}))
    .sort((a,b)=>b.score-a.score)[0]?.e||null;
}

async function aiTurn(u){
  if(u.dead) return endTurn();
  const enemies=enemiesOf(u); if(!enemies.length) return checkEnd();

  if(canShoot(u)){
    const target=bestRangedTarget(u,enemies);
    if(target){ statusText.textContent=`${u.name} wybiera cel: ${target.name}.`; await attack(u,target,'ranged'); endTurn(); return; }
  }

  const choices=[];
  for(const e of enemies){
    for(const side of neighbors(e.c,e.r)){
      if(unitAt(side.c,side.r,u)) continue;
      const path=pathfind({c:u.c,r:u.r},side,u,99);
      if(!path) continue;
      const expected=estimateDamage(u,e,'melee');
      choices.push({e,side,path,score:CombatCore.aiTargetScore(e,expected,path.length)});
    }
  }
  choices.sort((a,b)=>b.score-a.score);
  const attackChoice=choices.filter(x=>x.path.length<=u.speed).sort((a,b)=>b.score-a.score)[0];
  if(attackChoice){
    await moveAlong(u,attackChoice.path); await attack(u,attackChoice.e,'melee'); endTurn(); return;
  }

  const approach=choices.sort((a,b)=>a.path.length-b.path.length||b.score-a.score)[0];
  if(approach) await moveAlong(u,approach.path.slice(0,u.speed));
  endTurn();
}

function spriteSpec(u){
  if(u.type==='skeleton'){
    if(u.anim==='attack') return {url:'assets/skeleton_attack.png',frames:5,w:75,h:50,dur:.52,once:true};
    return {url:'assets/skeleton_idle.png',frames:4,w:75,h:50,dur:.72};
  }
  if(u.anim==='attack') return {url:'assets/blob_attack.png',frames:10,w:80,h:80,dur:.62,once:true};
  if(u.anim==='move') return {url:'assets/blob_move.png',frames:8,w:80,h:80,dur:.46};
  if(u.anim==='death') return {url:'assets/blob_death.png',frames:8,w:80,h:80,dur:.75,once:true};
  return {url:'assets/blob_idle.png',frames:8,w:80,h:80,dur:.8};
}

function ensureKeyframes(name,s){
  if(kfDone.has(name)) return; kfDone.add(name);
  const st=document.createElement('style');
  st.textContent=`@keyframes ${name}{from{background-position:0 0}to{background-position:-${s.w*s.frames}px 0}}`;
  document.head.appendChild(st);
}

function makeUnit(u){
  const p=pos(u.c,u.r), spec=spriteSpec(u), el=document.createElement('div');
  el.className=`unit ${u.type} team-${u.team} ${u.variant?'variant-'+u.variant:''} ${hoverAttack?.target===u?'target-hover':''}`;
  el.style.left=p.x+'px'; el.style.top=p.y+'px'; el.style.backgroundImage=`url('${spec.url}')`;
  const name=`anim_${u.type}_${u.anim}`; ensureKeyframes(name,spec);
  el.style.animation=`${name} ${spec.dur}s steps(${spec.frames}) ${spec.once?'1 forwards':'infinite'}`;
  BF.appendChild(el);

  const hp=document.createElement('div'); hp.className='hpbar'; hp.style.left=p.x+'px'; hp.style.top=(p.y+5)+'px';
  const lastHp=u.totalHp<=0?0:((u.totalHp-1)%u.hpPer)+1;
  hp.innerHTML=`<i style="width:${u.totalHp<=0?0:100*lastHp/u.hpPer}%"></i>`; BF.appendChild(hp);

  const badge=document.createElement('div'); badge.className='badge'; badge.style.left=p.x+'px'; badge.style.top=(p.y+8)+'px';
  badge.innerHTML=`${u.ranged?'🏹 ':''}${u.name}<span class="stack-count">${u.count}</span>`; BF.appendChild(badge);
  if(!u.dead) addHitbox(u);
}

function render(rebuild=true){
  BF.querySelectorAll('.unit,.unit-hitbox,.hpbar,.badge,.active-ring,.side-marker').forEach(n=>n.remove());
  cells.forEach(c=>c.className='cell');
  const u=active();
  if(!game.over&&u&&u.team==='player'&&!game.busy){
    const reach=reachable(u);
    cells.forEach(c=>{ const k=key(+c.dataset.c,+c.dataset.r); if(reach.has(k)&&k!==key(u.c,u.r)) c.classList.add('valid'); });
  }
  if(hoverAttack?.target&&!hoverAttack.target.dead&&hoverAttack.side){
    const s=hoverAttack.side, cell=cells.find(c=>+c.dataset.c===s.c&&+c.dataset.r===s.r);
    if(cell) cell.classList.add(unitAt(s.c,s.r,active())?'blocked-side':'attack-origin');
    const p=pos(s.c,s.r),m=document.createElement('div'); m.className='side-marker'; m.style.left=p.x+'px'; m.style.top=p.y+'px'; BF.appendChild(m);
  }
  game.units.filter(x=>!x.dead||x.anim==='death').forEach(makeUnit);
  if(!game.over&&u&&!u.dead){ const p=pos(u.c,u.r),ring=document.createElement('div'); ring.className='active-ring'; ring.style.left=p.x+'px'; ring.style.top=(p.y+5)+'px'; BF.appendChild(ring); }
  turnLabel.textContent=game.over?'Koniec':`${u?.name||'—'} (${u?.team==='ai'?'SI':'Gracz'})`;
  playerCount.textContent=`${alive('player').length} oddziały`;
  aiCount.textContent=`${alive('ai').length} oddziały`;
  renderInfo();
}

function renderInfo(){
  if(!game||!unitCard||!initiativeQueue) return;
  const shown=game.units.find(u=>u.id===inspectedUnitId)||active();
  if(shown){
    const retaliation=shown.retaliatedRound===game.round?'zużyty':'gotowy';
    unitCard.innerHTML=`
      <div class="unit-card-title"><strong>${shown.name}</strong><span>${shown.team==='ai'?'SI':'Gracz'}</span></div>
      <div class="stats-grid">
        <span>Atak <b>${shown.attack}</b></span><span>Obrona <b>${shown.defense}</b></span>
        <span>Obrażenia <b>${shown.minDmg}–${shown.maxDmg}</b></span><span>Szybkość <b>${shown.speed}</b></span>
        <span>HP jednostki <b>${shown.hpPer}</b></span><span>Stos <b>${shown.count}</b></span>
        <span>HP stosu <b>${shown.totalHp}</b></span><span>Kontra <b>${retaliation}</b></span>
        ${shown.ranged?`<span>Strzały <b>${shown.shots}/${shown.maxShots}</b></span><span>Typ <b>dystans</b></span>`:`<span>Typ <b>wręcz</b></span>`}
      </div>`;
  } else unitCard.textContent='Brak aktywnej jednostki.';

  initiativeQueue.innerHTML=game.order.map((u,i)=>{
    const cls=[i===game.turnIndex?'current':'',i<game.turnIndex?'done':'',u.dead?'dead':''].filter(Boolean).join(' ');
    return `<div class="queue-unit ${cls}" title="${u.name}: szybkość ${u.speed}"><span>${u.ranged?'🏹':'⚔'}</span><b>${u.name}</b><em>${u.speed}</em></div>`;
  }).join('');
}

function showDamage(u,dmg,label=''){
  const p=pos(u.c,u.r),el=document.createElement('div'); el.className='damage'; el.style.left=p.x+'px'; el.style.top=(p.y-24)+'px';
  el.textContent=label?`${label} -${dmg}`:`-${dmg}`; BF.appendChild(el); setTimeout(()=>el.remove(),900);
}

restartBtn.onclick=reset;
reset();
