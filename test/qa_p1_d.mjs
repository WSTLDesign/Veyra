import {boot} from './qa_p1_lib.mjs';
const {b,p,errs}=await boot();
const out={};
out.shinyBuild=await p.evaluate(()=>{const bad=[];let n=0;for(let id=1;id<=40;id++){try{const o=buildMon3D(id,1,{shiny:true}),o2=buildMon3D(id,1,{shiny:true,gender:'w',form:'alt'});let meshes=0;o.traverse(c=>{if(c.isMesh)meshes++;});if(meshes>60)bad.push(id+' meshes '+meshes);n++;}catch(e){bad.push(id+' '+e.message);}}return {n,bad};});
out.cries=await p.evaluate(async()=>{initAudio();await new Promise(r=>setTimeout(r,300));const st=typeof AC!=='undefined'&&AC?AC.state:'none';const bad=[];for(let id=0;id<=45;id++){try{playCry(id);CRY.last={};}catch(e){bad.push(id+' '+e.message);}}
  // erzwingen: Pfad auch bei laufendem Context
  let forced='n/a';try{if(AC){SET.sfx=true;SET.vol=SET.vol||70;if(AC.state!=='running'){await AC.resume().catch(()=>{});}for(let id=1;id<=40;id++){playCry(id);CRY.last={};}forced=AC.state;}}catch(e){bad.push('forced '+e.message);}
  return {st,forced,bad};});
// Glanz-Roamer in 3D
out.shiny=await p.evaluate(async()=>{G.time=11*60;loadMap('route1',9,18);mode='world';setView('third',true);spawnRoam();await new Promise(r=>setTimeout(r,600));const r=ROAM.list[0];r.shiny=true;r.o={shiny:true};r.px=r.x=Math.round(P.px+2);r.py=r.y=Math.round(P.py);
  let called=0;const o=SEQ.shinyAppear;SEQ.shinyAppear=async(a)=>{called++;return o(a);};window.__sc=()=>called;return 1;});
await p.waitForTimeout(3000);
out.shinySeq=await p.evaluate(()=>({called:__sc(),seen:ROAM.list[0]&&ROAM.list[0].shinySeen}));
// Kampf mit glanz, Fang uebernimmt
out.catch=await p.evaluate(async()=>{const m=mk(10,3);m.shiny=true;m.gender='m';SET.btl='runde';G.bag.meister=5;let called=0;const o=SEQ.shinyAppear;SEQ.shinyAppear=async(a)=>{called++;return o(a);};startBattle({wild:m});
 await new Promise(r=>setTimeout(r,3500));const seq=called;for(let i=0;i<8;i++){TW&&TW.finish&&TW.finish();}
 const w=G.team.length;try{B.busy=false;B.g=B.g||{};await Promise.race([tryCatch('meister'),new Promise(r=>setTimeout(r,15000))]);}catch(e){return {err:e.message};}
 const got=G.team.concat(G.box.flat?G.box.flat():[]).find(x=>x===m||(x.s===10&&x.shiny));return {seq,inTeam:G.team.includes(m),shiny:!!(got&&got.shiny),gender:got&&got.gender};});
await p.evaluate(()=>{for(let i=0;i<30&&B;i++){mode==='dialog'&&advDlg();}});
console.log(JSON.stringify(out));
console.log('errs',errs.length,errs.slice(0,5));
await b.close();
