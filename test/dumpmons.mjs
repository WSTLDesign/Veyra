import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:420,height:860},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.goto(new URL('../dist/index.html',import.meta.url).href,{waitUntil:'load'});
const out=await p.evaluate(()=>{const R=[];for(let i=1;i<MONS.length;i++){const M=MONS[i],o=buildMon3D(i,1);let n=0;o.traverse(q=>{if(q.isMesh)n++;});
 const pre=MONS.findIndex(m=>m&&m.ev&&m.ev.to===i);R.push([i,M.n,M.t.join('/'),M.sp[0],M.sp[1],M.sp[2],M.sp[3].join(','),M.sp[4],'cr'+M.cr,M.ev?('->'+M.ev.to):'',pre>0?'<-'+pre:'',M.legend?'LEG':'',n].join(' '));}return R.join('\n');});
console.log(out);await b.close();
