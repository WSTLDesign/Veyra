// QA Phase 1 – gemeinsame Hilfen
import { chromium } from 'playwright';
export async function boot(W={width:420,height:860}){
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:W,deviceScaleFactor:1});const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/THREE/.test(m.text()))errs.push(m.type()+': '+m.text());});
  await p.route(/fonts\.googleapis|fonts\.gstatic/,r=>r.fulfill({body:'',contentType:'text/css'}));
  await p.goto(new URL('../dist/index.html',import.meta.url).href,{waitUntil:'load'});
  await p.click('#iPrompt');await p.waitForTimeout(500);await p.click('#iSkip');await p.waitForTimeout(900);await p.click('#tNew');await p.waitForTimeout(300);
  await p.evaluate(()=>{SET.res='720';for(let i=0;i<8&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}G.team=[mk(2,18)];G.team[0].friendship=200;mode='world';});
  return {b,p,errs};
}
