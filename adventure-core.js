(function(root,factory){const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; else root.AdventureCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TERRAIN={grass:1,dirt:1,rock:1.25,sand:1.25,snow:1.5,swamp:1.75};
  const ROAD={dirt:.75,stone:.65,paved:.55};
  function idx(x,y,w){return y*w+x;}
  function inside(x,y,w,h){return x>=0&&y>=0&&x<w&&y<h;}
  function tileAt(map,x,y){return map.tiles[idx(x,y,map.width)];}
  function stepCost(from,to,tile){
    const diagonal=from.x!==to.x&&from.y!==to.y;
    const base=diagonal?141:100;
    const mult=tile?.road?ROAD[tile.road]??1:TERRAIN[tile?.terrain]??1;
    return Math.round(base*mult);
  }
  function neighbors(x,y,w,h){
    const out=[]; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; const nx=x+dx,ny=y+dy; if(inside(nx,ny,w,h)) out.push({x:nx,y:ny}); }
    return out;
  }
  function blockedSet(blockers){return new Set((blockers||[]).map(p=>`${p.x},${p.y}`));}
  function passable(map,x,y,blocked){const t=tileAt(map,x,y); return !!t&&!t.blocked&&!blocked.has(`${x},${y}`);}
  function findPath(map,start,goal,blockers=[]){
    const blocked=blockedSet(blockers); blocked.delete(`${goal.x},${goal.y}`);
    const open=[{...start,g:0,f:0}], came=new Map(), g=new Map([[`${start.x},${start.y}`,0]]), closed=new Set();
    const heuristic=(a,b)=>{const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y); return 100*(dx+dy)+(141-200)*Math.min(dx,dy);};
    while(open.length){
      open.sort((a,b)=>a.f-b.f||a.g-b.g); const cur=open.shift(),ck=`${cur.x},${cur.y}`; if(closed.has(ck)) continue; closed.add(ck);
      if(cur.x===goal.x&&cur.y===goal.y){ const path=[]; let k=ck,p={x:cur.x,y:cur.y}; while(!(p.x===start.x&&p.y===start.y)){path.push(p); const prev=came.get(k); if(!prev) break; p=prev; k=`${p.x},${p.y}`;} return path.reverse(); }
      for(const n of neighbors(cur.x,cur.y,map.width,map.height)){
        if(!passable(map,n.x,n.y,blocked)) continue;
        const dx=n.x-cur.x,dy=n.y-cur.y;
        if(dx&&dy){ if(!passable(map,cur.x+dx,cur.y,blocked)&&!passable(map,cur.x,cur.y+dy,blocked)) continue; }
        const ng=cur.g+stepCost(cur,n,tileAt(map,n.x,n.y)), nk=`${n.x},${n.y}`;
        if(ng<(g.get(nk)??Infinity)){g.set(nk,ng);came.set(nk,{x:cur.x,y:cur.y});open.push({...n,g:ng,f:ng+heuristic(n,goal)});}
      }
    }
    return null;
  }
  function splitPathByMovement(path,map,movement,start){let remain=movement,from={...start},cut=0; for(;cut<path.length;cut++){const c=stepCost(from,path[cut],tileAt(map,path[cut].x,path[cut].y)); if(c>remain) break; remain-=c; from=path[cut];} return {today:path.slice(0,cut),later:path.slice(cut),remaining:remain};}
  function advanceCalendar(c){let day=c.day+1,week=c.week,month=c.month,newWeek=false,newMonth=false; if(day>7){day=1;week++;newWeek=true;} if(week>4){week=1;month++;newMonth=true;} return {day,week,month,newWeek,newMonth};}
  function visibleTiles(x,y,w,h,radius=5){const out=[]; for(let yy=Math.max(0,y-radius);yy<=Math.min(h-1,y+radius);yy++) for(let xx=Math.max(0,x-radius);xx<=Math.min(w-1,x+radius);xx++) if(Math.max(Math.abs(xx-x),Math.abs(yy-y))<=radius) out.push({x:xx,y:yy}); return out;}
  return {TERRAIN,ROAD,stepCost,neighbors,findPath,splitPathByMovement,advanceCalendar,visibleTiles,tileAt};
});
