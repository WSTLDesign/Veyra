// Kampfszene → test/p1_battle.png (Treffer-Moment) 
import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:420,height:860},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('ERR',m.text());});
await p.route(/fonts\.googleapis|fonts\.gstatic/,r=>r.fulfill({body:'',contentType:'text/css'}));
await p.goto(new URL('../dist/index.html',import.meta.url).href,{waitUntil:'load'});
await p.click('#iPrompt');await p.waitForTimeout(500);await p.click('#iSkip');await p.waitForTimeout(900);await p.click('#tNew');await p.waitForTimeout(300);
await p.evaluate(()=>{SET.res='720';advDlg();G.team=[mk(2,18)];G.time=11*60;loadMap('route1',9,12);SET.btl='runde';const w=mk(13,15);w.shiny=true;startBattle({wild:w});});await p.waitForTimeout(2200);
for(let i=0;i<6;i++){await p.mouse.click(200,300);await p.waitForTimeout(300);}await p.waitForFunction(()=>document.querySelector('#bMenu').children.length>0);
await p.screenshot({path:'test/p1_battle.png'});
await p.evaluate(()=>{B.fx={who:'foe',t:performance.now(),col:'#ff8a3a'};B.lunge={who:'me',t:performance.now()-250};});await p.waitForTimeout(350);await p.screenshot({path:'test/p1_battle_hit.png'});
console.log(await p.evaluate(()=>'calls '+BT.r.info.render.calls+' foe meshes '+(()=>{let n=0;BT.foe.traverse(q=>{if(q.isMesh)n++;});return n;})()));
await b.close();
