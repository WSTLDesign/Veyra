import {boot} from './qa_p1_lib.mjs';
const {b,p,errs}=await boot();const out={};
for(const id of (process.argv[2]||'route1,nebelgrotte,brisenhafen,frostheim,fluestertal').split(',')){
  for(const night of [false,true]){
  await p.evaluate(([id,night])=>{G.time=night?23*60:11*60;G.ret={map:'morgenau',x:7,y:11};loadMap(id);mode='world';setView('third',true);},[id,night]);
  await p.waitForTimeout(1500);
  const r=await p.evaluate(async()=>{ // Roamer auf want auffüllen, nahe Spieler setzen
    let k=0;while(ROAM.list.length<ROAM.want&&k++<50)addRoamer();
    ROAM.list.forEach((r,i)=>{if(i<ROAM.want&&ROAM.tiles.length){/* nah ans Gras? nicht verschieben, nur zählen */}});
    const mx=[];for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,500));mx.push(R3.r.info.render.calls);}
    let near=0;for(const r of ROAM.list)if(Math.hypot(r.px-P.px,r.py-P.py)<20)near++;
    return {calls:Math.max(...mx),min:Math.min(...mx),want:ROAM.want,n:ROAM.list.length,near,tris:R3.r.info.render.triangles};});
  out[id+(night?'_n':'_t')]=r;}
}
console.log(JSON.stringify(out,null,0));console.log('errs',errs.length,errs.slice(0,5));await b.close();
