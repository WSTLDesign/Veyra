import {boot} from './qa_p1_lib.mjs';
const {b,p,errs}=await boot();const out={};
await p.evaluate(()=>{loadMap('route1',9,18);mode='world';window.__sc=0;const o=SEQ.shinyAppear;SEQ.shinyAppear=async(a)=>{window.__sc++;return o(a);};
 const m=mk(10,3);m.shiny=true;m.gender='m';window.__m=m;SET.btl='runde';G.bag.meister=5;startBattle({wild:m});});
await p.waitForTimeout(2500);for(let i=0;i<6;i++){await p.mouse.click(200,300);await p.waitForTimeout(250);}
await p.waitForFunction(()=>document.querySelector('#bMenu').children.length>0,null,{timeout:20000});
out.seq=await p.evaluate(()=>window.__sc);
// Treffer -> verletzt (Foe), Sieg -> freudig (me)
out.hit=await p.evaluate(async()=>{B.fx={who:'foe',t:performance.now(),dmg:1};await new Promise(r=>setTimeout(r,1500));const U=BT.foe.userData;return {exT:U.exT&&U.exT.e,hitSet:U.act.hit!=null};});
out.win=await p.evaluate(async()=>{const f=B.foe[B.fi];const h=f.hp;f.hp=0;await new Promise(r=>setTimeout(r,1500));const e=BT.me.userData.expr;f.hp=h;return e;});
await p.evaluate(()=>{B.g.me=1;B.busy=false;showRT&&showRT();turn({k:'ball',item:'meister'})});
for(let i=0;i<60&&await p.evaluate('!!B');i++){await p.waitForTimeout(400);await p.mouse.click(200,300);}
out.catch=await p.evaluate(()=>{const m=window.__m;return {B:!!B,inTeam:G.team.includes(m),inBox:G.box.flat().includes(m),shiny:m.shiny,gender:m.gender,mode,json:JSON.parse(JSON.stringify(G.team.concat(G.box.flat()).find(x=>x.s===10&&x.shiny)||{})).shiny};});
console.log(JSON.stringify(out));console.log('errs',errs.length,errs.slice(0,5));await b.close();
