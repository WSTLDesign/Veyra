// Vergleichs-Sheet Konzeptkunst ↔ 3D-Nachbau → test/art_vs_3d.png
// Spalten je Art: Illustration · 3D (Heldenpose) · Illustration Glanzform · 3D Glanzform. Aufruf: node test/art_vs_3d.mjs [ids,komma-getrennt] [ausgabe.png]
import { chromium } from 'playwright';import { writeFileSync, readFileSync } from 'fs';import { createServer } from 'http';
// kleiner Server statt file:// (sonst sind Canvas mit Bildern „tainted“)
const srv=createServer((q,r)=>{try{const f=new URL('../dist'+decodeURIComponent(q.url.split('?')[0]).replace(/\/$/,'/index.html'),import.meta.url);const d=readFileSync(f);r.writeHead(200,{'Content-Type':/\.webp$/.test(f.pathname)?'image/webp':/\.js$/.test(f.pathname)?'text/javascript':'text/html'});r.end(d);}catch(e){r.writeHead(404);r.end();}}).listen(0);const port=srv.address().port;
const ids=(process.argv[2]||'1,2,3,4,5,6,7,8,9,10,11,16,17,20,21,41,22,23').split(',').map(Number);
const out=process.argv[3]||new URL('./art_vs_3d.png',import.meta.url).pathname;
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:420,height:860},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log(m.type(),m.text());});
await p.route(/fonts\.googleapis|fonts\.gstatic/,r=>r.fulfill({body:'',contentType:'text/css'}));
await p.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
await p.evaluate(()=>preloadArt());
const url=await p.evaluate(async(ids)=>{const cell=230,cols=4,grp=ids.length>9?2:1,rows=Math.ceil(ids.length/grp),W=cell*cols*grp+(grp-1)*16,H=rows*(cell+22)+40;
 const o=document.createElement('canvas');o.width=W;o.height=H;const x=o.getContext('2d');x.fillStyle='#f3f0ea';x.fillRect(0,0,W,H);
 x.font='600 15px sans-serif';x.fillStyle='#333';for(let g=0;g<grp;g++)['Illustration','3D-Nachbau','Illustr. Glanz','3D Glanz'].forEach((t,i)=>x.fillText(t,g*(cell*cols+16)+i*cell+8,24));
 const field=(id,X,Y)=>{const t=MONS[id].t,c=TYPES[t[0]].c,gr=x.createRadialGradient(X+cell/2,Y+cell*.62,4,X+cell/2,Y+cell*.6,cell*.55);gr.addColorStop(0,c+'55');gr.addColorStop(1,c+'00');x.fillStyle='#fff';x.fillRect(X+4,Y+4,cell-8,cell-8);x.fillStyle=gr;x.fillRect(X+4,Y+4,cell-8,cell-8);};
 ids.forEach((id,n)=>{const g=n/rows|0,r=n%rows,X0=g*(cell*cols+16),Y=40+r*(cell+22);
  for(let i=0;i<4;i++){const X=X0+i*cell;field(id,X,Y);const sh=i>=2;
   if(i%2===0){if(hasArt(id))drawArt(x,id,X+14,Y+14,cell-28,cell-28,false,{shiny:sh,valign:.5});else{x.fillStyle='#999';x.font='13px sans-serif';x.fillText('(keine Illustration)',X+40,Y+cell/2);}}
   else{const c=monPortrait(id,cell-8,{aura:false,shiny:sh});x.drawImage(c,X+4,Y+4);}}
  x.fillStyle='#222';x.font='600 14px sans-serif';let n3=0;const m=buildMon3D(id,1,{});m.traverse(q=>{if(q.isMesh)n3++;});
  x.fillText(`#${id} ${MONS[id].n} · ${MONS[id].t.join('/')} · ${n3} Meshes`,X0+8,Y+cell+14);});
 return o.toDataURL('image/png');},ids);
writeFileSync(out,Buffer.from(url.split(',')[1],'base64'));console.log('ok',out);await b.close();srv.close();
