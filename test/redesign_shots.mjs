// Kreaturen-Neuentwurf: Kontaktbogen (Hero-Porträts aller Arten), Welt- und Kampf-Screenshot
// Aufruf: node test/redesign_shots.mjs [sheet|world|battle|all] [Präfix]
import { chromium } from 'playwright';import { writeFileSync } from 'fs';
const what=process.argv[2]||'all',pre=process.argv[3]||'redesign';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errs=[];const page=async(vp)=>{const p=await b.newPage({viewport:vp,deviceScaleFactor:1});p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERROR',e.message);});p.on('console',m=>{if(m.type()==='error'){errs.push(m.text());console.log('ERR',m.text());}});
 await p.route(/fonts\.googleapis|fonts\.gstatic/,r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(new URL('../dist/index.html',import.meta.url).href,{waitUntil:'load'});return p;};
const start=async p=>{await p.click('#iPrompt');await p.waitForTimeout(500);await p.click('#iSkip');await p.waitForTimeout(900);await p.click('#tNew');await p.waitForTimeout(300);
 await p.evaluate(()=>{SET.res='720';for(let i=0;i<8&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}});};
if(what==='sheet'||what==='all'){const p=await page({width:900,height:900});
 const out=await p.evaluate(({shiny})=>{const N=Math.min(40,MONS.length-1),C=8,cw=190,ch=220,rows=Math.ceil(N/C),o=document.createElement('canvas');o.width=C*cw;o.height=rows*ch;const x=o.getContext('2d');
  const bg=x.createLinearGradient(0,0,0,o.height);bg.addColorStop(0,'#eef3f7');bg.addColorStop(1,'#dfe7ee');x.fillStyle=bg;x.fillRect(0,0,o.width,o.height);const info=[];
  for(let i=1;i<=N;i++){const c=monPortrait(i,cw,{shiny});const X=((i-1)%C)*cw,Y=((i-1)/C|0)*ch;x.drawImage(c,X,Y);x.fillStyle='#1d2430';x.font='bold 15px sans-serif';x.textAlign='center';x.fillText(i+' '+MONS[i].n,X+cw/2,Y+cw+8);
   x.fillStyle='#5a6475';x.font='11px sans-serif';x.fillText(MONS[i].t.join('/')+' · '+(MONS[i].sp[6]||MONS[i].sp[0]),X+cw/2,Y+cw+22);const m=buildMon3D(i,1);let n=0;m.traverse(q=>{if(q.isMesh||q.isPoints||q.isSprite)n++;});info.push(i+':'+n);}
  return{url:o.toDataURL('image/png'),info:info.join(' ')};},{shiny:pre.includes('shiny')});
 writeFileSync(new URL('./'+pre+'_sheet.png',import.meta.url),Buffer.from(out.url.split(',')[1],'base64'));console.log('meshes',out.info);await p.close();}
if(what==='world'||what==='all'){const p=await page({width:420,height:860});await start(p);
 await p.evaluate(()=>{G.team=[mk(2,18)];G.team[0].friendship=200;G.time=10*60;loadMap('route1',9,12);P.dir='up';mode='world';});await p.waitForTimeout(400);
 await p.evaluate(()=>{const spots=[];for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++){if(Math.abs(x-P.x)+Math.abs(y-P.y)>=2&&Math.abs(x-P.x)<=4&&y<=P.y&&y>=P.y-6&&!blocked(x,y))spots.push([x,y]);}
  spots.sort((a,b)=>(Math.abs(a[0]-P.x)+Math.abs(a[1]-P.y))-(Math.abs(b[0]-P.x)+Math.abs(b[1]-P.y)));const sp=[[14,'graze'],[7,'sleep'],[31,null],[20,'hide'],[12,'sniff'],[22,null],[26,null]];ROAM.list=[];ROAM.want=0;
  sp.forEach(([s,pose],i)=>{const q=spots[(i*3)%spots.length];if(!q)return;ROAM.list.push({s,l:5,x:q[0],y:q[1],px:q[0],py:q[1],fx:q[0],fy:q[1],t:1,dir:'down',next:performance.now()+1e9,st:pose==='sleep'?'sleep':pose||'idle',stT:performance.now()+1e9,pose,nat:'neutral',owl:false,shiny:false,o:{}});});setView('third',true);});
 await p.waitForTimeout(2600);await p.screenshot({path:'test/'+pre+'_world.png'});console.log('world calls',await p.evaluate(()=>R3&&R3.r.info.render.calls));await p.close();}
if(what==='battle'||what==='all'){const p=await page({width:420,height:860});await start(p);
 await p.evaluate(()=>{G.team=[mk(3,40)];G.time=11*60;loadMap('route1',9,12);SET.btl='runde';const w=mk(9,38);startBattle({wild:w});});await p.waitForTimeout(2400);
 for(let i=0;i<6;i++){await p.mouse.click(200,300);await p.waitForTimeout(300);}await p.waitForTimeout(500);await p.screenshot({path:'test/'+pre+'_battle.png'});
 console.log('battle',await p.evaluate(()=>{const c=o=>{let n=0;o&&o.traverse(q=>{if(q.isMesh)n++;});return n;};return BT?'calls '+BT.r.info.render.calls+' foe '+c(BT.foe)+' me '+c(BT.me):'2d';}));await p.close();}
await b.close();console.log(errs.length?'FEHLER '+errs.length:'ok');
