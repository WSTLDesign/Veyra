import {boot} from './qa_p1_lib.mjs';
const {b,p,errs}=await boot();
const out={};
out.nat=await p.evaluate(()=>MONS.slice(1).map((m,i)=>monNature(i+1)).reduce((a,n,i)=>{(a[n]=a[n]||[]).push(i+1);return a;},{}));
// aggro am Tag
out.aggro=await p.evaluate(async()=>{const n=performance.now.bind(performance);window.__off=0;performance.now=()=>n()+window.__off;
  G.time=11*60;loadMap('route1',9,18);mode='world';setView('2d',true);const ag=monNature(14)==='aggro'?14:[...Array(40)].map((_,i)=>i+1).find(s=>monNature(s)==='aggro');
  spawnRoam();ROAM.list=[];for(let k=0;k<20&&!ROAM.list.length;k++)addRoamer();const r=ROAM.list[0];r.s=ag;r.nat='aggro';r.st='idle';r.next=0;
  const c=[[r.x+3,r.y],[r.x-3,r.y],[r.x,r.y+3],[r.x,r.y-3]].find(([x,y])=>!blocked(x,y));P.x=P.px=c[0];P.y=P.py=c[1];let ch=0,bt=0,ld=0;
  for(let f=0;f<200;f++){window.__off+=33;roamTick(33);if(r.st==='charge')ch++;if(mode!=='world'){bt=1;break;}}
  if(B){B=null;}mode='world';return {ag,ch,bt};});
// 3D: Begleiter folgt, Sprünge messen
out.follow=await p.evaluate(async()=>{loadMap('route1',9,18);mode='world';setView('third',true);compReset();
  const jumps=[];let last=null;const _rt=roamTick;roamTick=function(dt){_rt(dt);if(COMP){if(last){const j=Math.hypot(COMP.px-last[0],COMP.py-last[1]);jumps.push(j);}last=[COMP.px,COMP.py];}};
  window.__jumps=jumps;return 1;});
await p.waitForTimeout(500);
await p.evaluate(()=>{STICK.y=-1;STICK.x=0;});await p.waitForTimeout(3000);
await p.evaluate(()=>{STICK.x=1;STICK.y=0;});await p.waitForTimeout(2000);await p.evaluate(()=>{P.run=true;STICK.x=0;STICK.y=-1;});await p.waitForTimeout(2500);
await p.evaluate(()=>{STICK.x=0;STICK.y=0;P.run=false;});await p.waitForTimeout(500);
out.jump3d=await p.evaluate(()=>({n:__jumps.length,max:Math.max(...__jumps).toFixed(2),dist:Math.hypot(COMP.px-P.px,COMP.py-P.py).toFixed(2)}));
// 2D
await p.evaluate(()=>{setView('2d',true);__jumps.length=0;loadMap('route1',9,18);compReset();mode='world';});
for(const d of ['up','up','up','right','right','up','left']){await p.evaluate(d=>{P.dir=d;tryMove(d);},d);await p.waitForTimeout(450);}
out.jump2d=await p.evaluate(()=>({n:__jumps.length,max:Math.max(...__jumps).toFixed(2),dist:Math.hypot(COMP.px-P.px,COMP.py-P.py).toFixed(2)}));
// compTap via interact
out.tap=await p.evaluate(async()=>{loadMap('route1',9,18);mode='world';compReset();const[dx,dy]=DIRV[P.dir];COMP.x=P.x+dx;COMP.y=P.y+dy;COMP.px=COMP.x;COMP.py=COMP.y;const f0=G.team[0].friendship;interact();await new Promise(r=>setTimeout(r,200));return {mode,react:COMP.react&&COMP.react.k,f:[f0,G.team[0].friendship]};});
out.react=await p.evaluate(()=>{const r={};for(const k of ['heal','storm','shiny','pet','x'])try{compReact(k);r[k]='ok';}catch(e){r[k]=e.message;}return r;});
await p.waitForTimeout(300);
// 3: Mimik alle Arten x 5 Ausdruecke
out.expr=await p.evaluate(()=>{const E=['neutral','freudig','verletzt','wuetend','muede'],bad=[];let n=0,noface=[];for(let id=1;id<=40;id++){let o;try{o=buildMon3D(id,1);}catch(e){bad.push(id+' build '+e.message);continue;}if(!o.userData.face)noface.push(id);for(const e of E){try{setExpression(o,e);setExpression(o,e,500);animMon(o,performance.now(),{});n++;}catch(er){bad.push(id+' '+e+' '+er.message);}}}return {n,bad,noface};});
// Kampf: Treffer->verletzt, Sieg->freudig
out.battle=await p.evaluate(async()=>{SET.btl='runde';startBattle({wild:mk(10,3)});await new Promise(r=>setTimeout(r,2500));return {B:!!B,bt:!!BT};});
console.log(JSON.stringify(out));
console.log('errs',errs.length,errs.slice(0,5));
await b.close();
