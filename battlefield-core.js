(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BattlefieldCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const EVEN=[[1,0],[-1,0],[0,-1],[-1,-1],[0,1],[-1,1]];
  const ODD=[[1,0],[-1,0],[1,-1],[0,-1],[1,1],[0,1]];
  const key=(c,r)=>`${c},${r}`;
  function inBoard(c,r,cols=15,rows=11){ return c>=0&&c<cols&&r>=0&&r<rows; }
  function neighbors(c,r){ return (r%2?ODD:EVEN).map(([dc,dr])=>({c:c+dc,r:r+dr})); }
  function footprint(unit,state=unit){
    const c=state.c,r=state.r,size=unit.size||state.size||1,facing=state.facing||unit.facing||'right';
    const out=[{c,r}];
    if(size===2) out.push({c:c+(facing==='right'?-1:1),r});
    return out;
  }
  function occupiedKeys(unit,state=unit){ return footprint(unit,state).map(p=>key(p.c,p.r)); }
  function stateKey(s){ return `${s.c},${s.r},${s.facing||'right'}`; }
  function alive(u){ return u&&!u.dead&&(u.totalHp==null||u.totalHp>0); }
  function isObstacleAt(obstacles,c,r){ return (obstacles||[]).some(o=>o.c===c&&o.r===r); }
  function unitAtHex(units,c,r,ignoreUnit=null){ return (units||[]).find(u=>u!==ignoreUnit&&alive(u)&&footprint(u).some(p=>p.c===c&&p.r===r)); }
  function canPlace(unit,state,context={}){
    const cols=context.cols??15,rows=context.rows??11,ignore=context.ignoreUnit??unit;
    for(const p of footprint(unit,state)){
      if(!inBoard(p.c,p.r,cols,rows)) return false;
      if(isObstacleAt(context.obstacles,p.c,p.r)) return false;
      if(unitAtHex(context.units,p.c,p.r,ignore)) return false;
    }
    return true;
  }
  function hexAdjacent(a,b){ return neighbors(a.c,a.r).some(n=>n.c===b.c&&n.r===b.r); }
  function footprintsAdjacent(a,b,aState=a,bState=b){ const A=footprint(a,aState),B=footprint(b,bState); return A.some(x=>B.some(y=>hexAdjacent(x,y))); }
  function orientations(unit,current){ return (unit.size||1)===2?['left','right']:[current||unit.facing||'right']; }
  function successors(unit,state,context){
    const out=[];
    for(const n of neighbors(state.c,state.r)){
      if(!inBoard(n.c,n.r,context.cols??15,context.rows??11)) continue;
      for(const facing of orientations(unit,state.facing)){
        const next={c:n.c,r:n.r,facing};
        if(canPlace(unit,next,context)) out.push(next);
      }
    }
    return out;
  }
  function reachableStates(unit,start,context={},maxSteps=99){
    const s={c:start.c,r:start.r,facing:start.facing||unit.facing||'right'};
    const q=[s],depth=new Map([[stateKey(s),0]]),states=new Map([[stateKey(s),s]]);
    while(q.length){
      const cur=q.shift(),d=depth.get(stateKey(cur));
      if(d>=maxSteps) continue;
      for(const next of successors(unit,cur,{...context,ignoreUnit:unit})){
        const k=stateKey(next); if(depth.has(k)) continue;
        depth.set(k,d+1);states.set(k,next);q.push(next);
      }
    }
    states.depth=depth;
    return states;
  }
  function findPath(unit,start,goal,context={},maxSteps=99){
    const s={c:start.c,r:start.r,facing:start.facing||unit.facing||'right'};
    const q=[s],prev=new Map([[stateKey(s),null]]),depth=new Map([[stateKey(s),0]]),byKey=new Map([[stateKey(s),s]]);
    let found=null;
    while(q.length){
      const cur=q.shift(),ck=stateKey(cur),d=depth.get(ck);
      if(cur.c===goal.c&&cur.r===goal.r&&(goal.facing==null||cur.facing===goal.facing)){found=cur;break;}
      if(d>=maxSteps) continue;
      for(const next of successors(unit,cur,{...context,ignoreUnit:unit})){
        const nk=stateKey(next); if(prev.has(nk)) continue;
        prev.set(nk,ck);depth.set(nk,d+1);byKey.set(nk,next);q.push(next);
      }
    }
    if(!found) return null;
    const path=[];let k=stateKey(found);
    while(prev.get(k)!==null){ path.push(byKey.get(k)); k=prev.get(k); }
    return path.reverse();
  }
  return {key,inBoard,neighbors,footprint,occupiedKeys,stateKey,isObstacleAt,unitAtHex,canPlace,footprintsAdjacent,reachableStates,findPath};
});
