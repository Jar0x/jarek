const BF = document.getElementById('battlefield');
const statusText = document.getElementById('statusText');
const turnLabel = document.getElementById('turnLabel');
const playerCount = document.getElementById('playerCount');
const aiCount = document.getElementById('aiCount');
const restartBtn = document.getElementById('restartBtn');

// Pole bitwy Heroes III ma 15 × 11 heksów. Współrzędne są w układzie odd-r.
const COLS = 15, ROWS = 11;
const X0 = 76, Y0 = 76, DX = 61, DY = 49;
const cells = [];
const kfDone = new Set();
let game;
let hoverAttack = null;

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

function cube(c,r){
  const x = c - (r - (r&1))/2, z=r, y=-x-z;
  return {x,y,z};
}
function hexDist(a,b){
  const A=cube(a.c,a.r), B=cube(b.c,b.r);
  return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z));
}

function buildBoard(){
  BF.innerHTML=''; cells.length=0;
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const d=document.createElement('div'); d.className='cell'; d.dataset.c=c; d.dataset.r=r;
    const p=pos(c,r); d.style.left=p.x+'px'; d.style.top=p.y+'px';
    d.onclick=()=>handleCell(c,r); BF.appendChild(d); cells.push(d);
  }
}

function mk(id,name,team,type,c,r,count,hpPer,minDmg,maxDmg,speed,variant=''){
  return {id,name,team,type,c,r,count,hpPer,totalHp:count*hpPer,minDmg,maxDmg,speed,variant,anim:'idle',dead:false};
}

function reset(){
  buildBoard(); hoverAttack=null;
  game={over:false,busy:false,round:1,turnIndex:0,order:[],units:[
    mk('p1','Szkielet','player','skeleton',2,3,14,10,2,4,5,''),
    mk('p2','Kościany Strażnik','player','skeleton',2,6,9,14,3,5,4,'guard'),
    mk('p3','Szlam Sprzymierzeniec','player','blob',3,8,11,12,2,3,4,''),
    mk('a1','Szlam','ai','blob',12,3,16,11,2,4,4,''),
    mk('a2','Jadowity Szlam','ai','blob',12,7,10,14,3,5,5,'poison'),
    mk('a3','Kościany Najeźdźca','ai','skeleton',11,5,12,10,2,4,5,'guard')
  ]};
  startRound();
}

function alive(team){ return game.units.filter(u=>!u.dead && u.totalHp>0 && (!team || u.team===team)); }
function unitAt(c,r,ignore=null){ return game.units.find(u=>u!==ignore && !u.dead && u.totalHp>0 && u.c===c && u.r===r); }
function active(){ return game.order[game.turnIndex]; }
function enemiesOf(u){ return alive(u.team==='player'?'ai':'player'); }

function startRound(){
  game.order = alive().sort((a,b)=>b.speed-a.speed || a.id.localeCompare(b.id));
  game.turnIndex=0;
  beginTurn();
}

async function beginTurn(){
  hoverAttack=null;
  while(game.turnIndex < game.order.length && (game.order[game.turnIndex].dead || game.order[game.turnIndex].totalHp<=0)) game.turnIndex++;
  if(checkEnd()) return;
  if(game.turnIndex>=game.order.length){ game.round++; startRound(); return; }
  const u=active();
  u.anim='idle'; render();
  if(u.team==='ai'){
    game.busy=true; statusText.textContent=`SI planuje ruch: ${u.name}…`;
    await sleep(420); await aiTurn(u); game.busy=false;
  } else {
    game.busy=false; statusText.textContent=`${u.name}: wybierz pole ruchu albo stronę ataku.`;
  }
}

function endTurn(){
  if(checkEnd()) return;
  game.turnIndex++;
  beginTurn();
}

function checkEnd(){
  const p=alive('player').length, a=alive('ai').length;
  if(!p || !a){
    game.over=true; game.busy=true;
    statusText.textContent = p ? 'Zwycięstwo! Armia przeciwnika została pokonana.' : 'Porażka. SI rozbiło Twoją armię.';
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
      const occ=unitAt(n.c,n.r,mover); if(occ && !(n.c===goal.c&&n.r===goal.r)) continue;
      if(occ) continue;
      prev.set(k,cur); depth.set(k,d+1); q.push(n);
    }
  }
  const gk=key(goal.c,goal.r); if(!prev.has(gk)) return null;
  const path=[]; let cur=goal;
  while(cur && !(cur.c===start.c&&cur.r===start.r)){ path.push(cur); cur=prev.get(key(cur.c,cur.r)); }
  return path.reverse();
}

function reachable(u){
  const out=new Map();
  const q=[{c:u.c,r:u.r,d:0}]; out.set(key(u.c,u.r),0);
  while(q.length){
    const cur=q.shift(); if(cur.d>=u.speed) continue;
    for(const n of neighbors(cur.c,cur.r)){
      const k=key(n.c,n.r); if(out.has(k) || unitAt(n.c,n.r,u)) continue;
      out.set(k,cur.d+1); q.push({c:n.c,r:n.r,d:cur.d+1});
    }
  }
  return out;
}

async function moveAlong(u,path){
  if(!path || !path.length) return;
  u.anim='move';
  for(const step of path){ u.c=step.c; u.r=step.r; render(); await sleep(115); }
  u.anim='idle'; render();
}

function handleCell(c,r){
  if(game.over || game.busy) return;
  const u=active(); if(!u || u.team!=='player') return;
  if(unitAt(c,r)) return;
  const path=pathfind({c:u.c,r:u.r},{c,r},u,u.speed);
  if(path && path.length<=u.speed){
    game.busy=true; moveAlong(u,path).then(()=>{ game.busy=false; endTurn(); });
  }
}

function bestSideFromPointer(target, clientX, clientY){
  const rect=BF.getBoundingClientRect();
  const center=pos(target.c,target.r);
  const mx=clientX-rect.left+BF.scrollLeft, my=clientY-rect.top+BF.scrollTop;
  const ang=Math.atan2(my-center.y,mx-center.x);
  const ns=neighbors(target.c,target.r);
  let best=null,bestScore=1e9;
  for(const n of ns){
    const p=pos(n.c,n.r), a=Math.atan2(p.y-center.y,p.x-center.x);
    let diff=Math.abs(Math.atan2(Math.sin(ang-a),Math.cos(ang-a)));
    if(diff<bestScore){bestScore=diff;best=n;}
  }
  return best;
}

function cursorForSide(target,side){
  const a=pos(target.c,target.r), b=pos(side.c,side.r);
  const deg=Math.atan2(a.y-b.y,a.x-b.x)*180/Math.PI;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><g transform="rotate(${deg} 18 18)"><path d="M4 18h19" stroke="#fff4ba" stroke-width="7" stroke-linecap="round"/><path d="M4 18h19" stroke="#7b170f" stroke-width="3" stroke-linecap="round"/><path d="M22 8l10 10-10 10" fill="#d23a2d" stroke="#fff4ba" stroke-width="2"/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 18 18, crosshair`;
}

function addHitbox(u){
  const p=pos(u.c,u.r); const hb=document.createElement('div');
  hb.className=`unit-hitbox ${u.type}`; hb.style.left=p.x+'px'; hb.style.top=p.y+'px'; hb.dataset.id=u.id;
  if(!game.over && !game.busy && active()?.team==='player' && u.team==='ai'){
    hb.onmousemove=(ev)=>{
      const side=bestSideFromPointer(u,ev.clientX,ev.clientY);
      hoverAttack={target:u,side}; hb.style.cursor=cursorForSide(u,side); render(false);
    };
    hb.onmouseleave=()=>{hoverAttack=null; render(false);};
    hb.onclick=()=>attemptPlayerAttack(u, hoverAttack?.target===u?hoverAttack.side:null);
  }
  BF.appendChild(hb);
}

async function attemptPlayerAttack(target,side){
  if(game.busy || game.over) return;
  const u=active(); if(!u || u.team!=='player' || target.dead) return;
  side ||= neighbors(target.c,target.r).find(n=>!unitAt(n.c,n.r,u));
  if(!side || unitAt(side.c,side.r,u)){ statusText.textContent='Z tej strony nie ma miejsca na atak.'; return; }
  const path=pathfind({c:u.c,r:u.r},side,u,u.speed);
  if(!path || path.length>u.speed){ statusText.textContent='Wybrana strona przeciwnika jest poza zasięgiem ruchu.'; return; }
  game.busy=true; hoverAttack=null;
  await moveAlong(u,path);
  await attack(u,target);
  game.busy=false;
  endTurn();
}

async function attack(a,d){
  a.anim='attack'; render();
  await sleep(a.type==='skeleton'?250:300);
  const perCreature=rand(a.minDmg,a.maxDmg);
  const dmg=Math.max(1, perCreature*a.count);
  applyDamage(d,dmg); showDamage(d,dmg); render();
  await sleep(a.type==='skeleton'?300:360);
  a.anim='idle';
  if(d.totalHp<=0){ d.dead=true; d.anim='death'; }
  render();
  if(d.dead){ await sleep(d.type==='blob'?600:260); d.anim='gone'; render(); }
}

function applyDamage(u,dmg){
  u.totalHp=Math.max(0,u.totalHp-dmg);
  u.count=u.totalHp<=0?0:Math.ceil(u.totalHp/u.hpPer);
}

async function aiTurn(u){
  if(u.dead) return endTurn();
  const enemies=enemiesOf(u); if(!enemies.length) return checkEnd();
  let choices=[];
  for(const e of enemies){
    for(const side of neighbors(e.c,e.r)){
      if(unitAt(side.c,side.r,u)) continue;
      const path=pathfind({c:u.c,r:u.r},side,u,u.speed);
      if(path) choices.push({e,side,path,score:path.length + e.count*0.03});
    }
  }
  choices.sort((a,b)=>a.score-b.score);
  const attackChoice=choices.find(x=>x.path.length<=u.speed);
  if(attackChoice){
    await moveAlong(u,attackChoice.path); await attack(u,attackChoice.e); endTurn(); return;
  }
  // Brak ataku w tej turze: idź maksymalnie w stronę najbliższego wroga.
  let best=null;
  for(const e of enemies){
    const frontier=neighbors(e.c,e.r).filter(s=>!unitAt(s.c,s.r,u));
    for(const side of frontier){
      const full=pathfind({c:u.c,r:u.r},side,u,99);
      if(full && (!best || full.length<best.path.length)) best={e,path:full};
    }
  }
  if(best){ await moveAlong(u,best.path.slice(0,u.speed)); }
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
  const p=pos(u.c,u.r), spec=spriteSpec(u);
  const el=document.createElement('div');
  el.className=`unit ${u.type} team-${u.team} ${u.variant?'variant-'+u.variant:''} ${hoverAttack?.target===u?'target-hover':''}`;
  el.style.left=p.x+'px'; el.style.top=p.y+'px'; el.style.backgroundImage=`url('${spec.url}')`;
  const name=`anim_${u.type}_${u.anim}`; ensureKeyframes(name,spec);
  el.style.animation=`${name} ${spec.dur}s steps(${spec.frames}) ${spec.once?'1 forwards':'infinite'}`;
  BF.appendChild(el);

  const hp=document.createElement('div'); hp.className='hpbar'; hp.style.left=p.x+'px'; hp.style.top=(p.y+5)+'px';
  const max=Math.max(1,u.count*u.hpPer); // pasek pokazuje stan ostatniego żywego modelu
  const lastHp=u.totalHp<=0?0:((u.totalHp-1)%u.hpPer)+1;
  hp.innerHTML=`<i style="width:${u.totalHp<=0?0:100*lastHp/u.hpPer}%"></i>`; BF.appendChild(hp);

  const badge=document.createElement('div'); badge.className='badge'; badge.style.left=p.x+'px'; badge.style.top=(p.y+8)+'px';
  badge.innerHTML=`${u.name}<span class="stack-count">${u.count}</span>`; BF.appendChild(badge);
  if(!u.dead) addHitbox(u);
}

function render(rebuild=true){
  BF.querySelectorAll('.unit,.unit-hitbox,.hpbar,.badge,.active-ring,.side-marker').forEach(n=>n.remove());
  cells.forEach(c=>c.className='cell');
  const u=active();
  if(!game.over && u && u.team==='player' && !game.busy){
    const reach=reachable(u);
    cells.forEach(c=>{ const k=key(+c.dataset.c,+c.dataset.r); if(reach.has(k) && k!==key(u.c,u.r)) c.classList.add('valid'); });
  }
  if(hoverAttack?.target && !hoverAttack.target.dead){
    const s=hoverAttack.side;
    const cell=cells.find(c=>+c.dataset.c===s.c && +c.dataset.r===s.r);
    if(cell) cell.classList.add(unitAt(s.c,s.r,active())?'blocked-side':'attack-origin');
    const p=pos(s.c,s.r); const m=document.createElement('div'); m.className='side-marker'; m.style.left=p.x+'px'; m.style.top=p.y+'px'; BF.appendChild(m);
  }
  game.units.filter(x=>!x.dead || x.anim==='death').forEach(makeUnit);
  if(!game.over && u && !u.dead){ const p=pos(u.c,u.r); const ring=document.createElement('div'); ring.className='active-ring'; ring.style.left=p.x+'px'; ring.style.top=(p.y+5)+'px'; BF.appendChild(ring); }

  turnLabel.textContent=game.over?'Koniec':`${u?.name||'—'} (${u?.team==='ai'?'SI':'Gracz'})`;
  playerCount.textContent=`${alive('player').length} oddziały`;
  aiCount.textContent=`${alive('ai').length} oddziały`;
}

function showDamage(u,dmg){
  const p=pos(u.c,u.r); const el=document.createElement('div'); el.className='damage'; el.style.left=p.x+'px'; el.style.top=(p.y-24)+'px'; el.textContent=`-${dmg}`; BF.appendChild(el); setTimeout(()=>el.remove(),900);
}

restartBtn.onclick=reset;
reset();
