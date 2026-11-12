// Oberwelt mit Begleiter & Roamern (3. Person) → test/p1_world_mon.png (+ _2d, _night)
import { chromium } from 'playwright';
const W=process.argv[2]==='land'?{width:860,height:420}:{width:420,height:860};const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:W,deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('ERR',m.text());});
await p.route(/fonts\.googleapis|fonts\.gstatic/,r=>r.fulfill({body:'',contentType:'text/css'}));
await p.goto(new URL('../dist/index.html',import.meta.url).href,{waitUntil:'load'});
await p.click('#iPrompt');await p.waitForTimeout(500);await p.click('#iSkip');await p.waitForTimeout(900);await p.click('#tNew');await p.waitForTimeout(300);await p.evaluate(()=>{SET.res='720';});
const setup=async(night)=>{await p.evaluate((night)=>{for(let i=0;i<8&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}G.team=[mk(2,18)];G.team[0].friendship=200;G.time=night?22*60:10*60;loadMap('route1',9,12);P.dir='up';mode='world';},night);await p.waitForTimeout(400);
 await p.evaluate(()=>{const spots=[];for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++){const t=cur.rows[y][x];if((t==='"')&&Math.abs(x-P.x)+Math.abs(y-P.y)>=2&&Math.abs(x-P.x)<=4&&y<=P.y&&y>=P.y-6&&!blocked(x,y))spots.push([x,y]);}
  spots.sort((a,b)=>(Math.abs(a[0]-P.x)+Math.abs(a[1]-P.y))-(Math.abs(b[0]-P.x)+Math.abs(b[1]-P.y)));const sp=[[14,'graze'],[1,'sleep'],[33,null],[10,'hide'],[12,'sniff'],[3,null]];ROAM.list=[];ROAM.want=0;
  sp.forEach(([s,pose],i)=>{const q=spots[(i*3)%spots.length];if(!q)return;ROAM.list.push({s,l:5,x:q[0],y:q[1],px:q[0],py:q[1],fx:q[0],fy:q[1],t:1,dir:'down',next:performance.now()+1e9,st:pose==='sleep'?'sleep':pose||'idle',stT:performance.now()+1e9,pose,nat:'neutral',owl:false,shiny:i===2,o:{shiny:i===2}});});});}
await setup(false);await p.evaluate(()=>setView('third',true));await p.waitForTimeout(2500);await p.screenshot({path:'test/p1_world_mon.png'});
await p.evaluate(()=>setView('2d',true));await p.waitForTimeout(800);await p.screenshot({path:'test/p1_world_2d.png'});
await setup(true);await p.evaluate(()=>setView('third',true));await p.waitForTimeout(2000);await p.screenshot({path:'test/p1_world_night.png'});
console.log(await p.evaluate(()=>{const S=scenes&&R3?R3:null;return 'calls '+(R3&&R3.r.info.render.calls)+' comp '+JSON.stringify(COMP&&[COMP.px.toFixed(2),COMP.py.toFixed(2),COMP.expr])+' P '+P.px+','+P.py;}));
await b.close();
