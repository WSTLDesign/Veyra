import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:420,height:900},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto(new URL('../dist/index.html',import.meta.url).href,{waitUntil:'load'});
await p.route(/fonts\.googleapis|fonts\.gstatic/,r=>r.fulfill({body:'',contentType:'text/css'}));await p.click('#iPrompt');await p.waitForTimeout(400);await p.click('#iSkip');await p.waitForTimeout(900);await p.click('#tNew');await p.waitForTimeout(300);
await p.evaluate(()=>{advDlg();advDlg();G.team.push(mk(2,20));for(let i=1;i<=40;i++){G.dex.caught[i]=G.dex.seen[i]=1;}openMenu('dex');});await p.waitForTimeout(4000);
await p.screenshot({path:'test/p1_dex.png',clip:{x:0,y:120,width:420,height:780}});await b.close();
