import { chromium } from 'playwright';
import { serve } from '../art_serve.mjs';
const S=await serve();const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(/Haus|rror/.test(m.text()))console.log('C',m.text().slice(0,200))});
await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await p.addInitScript(()=>localStorage.setItem('veyra_set',JSON.stringify({modelle3d:true,quality:'hoch',gfx:'high'})));
await p.goto(S.url+'index.html',{waitUntil:'load'});await p.waitForTimeout(1500);
await p.evaluate(()=>{const i=document.querySelector('#iSkip');if(i)i.click();});await p.waitForTimeout(800);await p.evaluate(()=>document.querySelector('#tNew').click());
await p.waitForFunction(()=>typeof G!=='undefined'&&G,null,{timeout:30000});
const f=()=>p.evaluate(()=>({st:W3HAUS.st,map:R3&&R3.mapId,haus:R3&&R3.scene?R3.scene.children.filter(o=>o.userData.haus).length:-1,miss:R3&&R3.scene&&R3.scene.userData.hausMiss}));
await p.evaluate(()=>{for(let i=0;i<30&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}mode='world';setView('third',1);loadMap('morgenau',12,9);});
for(let i=0;i<6;i++){await p.waitForTimeout(2000);console.log(JSON.stringify(await f()));}
await b.close();S.close();
