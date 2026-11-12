// Silhouetten-Test: alle Arten als schwarze Flächen im Raster → test/agent_silhouettes.png
import { chromium } from 'playwright';import { writeFileSync } from 'fs';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:420,height:860},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));await p.route(/fonts\.googleapis|fonts\.gstatic/,r=>r.fulfill({body:'',contentType:'text/css'}));
await p.goto(new URL('../dist/index.html',import.meta.url).href,{waitUntil:'load'});
const url=await p.evaluate(()=>{const N=MONS.length-1,C=8,cell=150,rows=Math.ceil(N/C),out=document.createElement('canvas');out.width=C*cell;out.height=rows*cell;const o=out.getContext('2d');o.fillStyle='#f4f1ea';o.fillRect(0,0,out.width,out.height);
 const r=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(cell,cell,false);r.setClearColor(0,0);const s=new THREE.Scene();s.overrideMaterial=new THREE.MeshBasicMaterial({color:'#111'});const cam=new THREE.PerspectiveCamera(28,1,.1,50);
 for(let i=1;i<=N;i++){const m=buildMon3D(i,1);m.rotation.y=-Math.PI/2-.45;m.traverse(q=>{if(q.isPoints||q.isSprite)q.visible=false;});s.add(m);m.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(m),z=bx.getSize(new THREE.Vector3()),c=bx.getCenter(new THREE.Vector3()),fit=Math.max(z.y,z.x,z.z)*1.25;
  cam.position.set(c.x,c.y+z.y*.1,c.z+fit/(2*Math.tan(14*Math.PI/180)));cam.lookAt(c);r.render(s,cam);s.remove(m);const x=((i-1)%C)*cell,y=((i-1)/C|0)*cell;o.drawImage(r.domElement,x,y);
  o.fillStyle='#333';o.font='11px sans-serif';o.fillText(i+' '+MONS[i].n+' · '+MONS[i].t.join('/'),x+4,y+cell-5);}
 return out.toDataURL('image/png');});
writeFileSync(new URL('./agent_silhouettes.png',import.meta.url),Buffer.from(url.split(',')[1],'base64'));console.log('ok');await b.close();
