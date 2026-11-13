// Welt-Grafik: Dreiecke/Draw-Calls je Kategorie (Schalter 3D-Modelle an), node test/welt2/_budget.mjs <karte> <x> <y> <dir>
import { chromium } from 'playwright';
import { serve } from '../art_serve.mjs';
const [map='kupferhain',X='4',Y='11',DIR='up']=process.argv.slice(2);
const S=await serve();const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:800,height:450}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await p.addInitScript(n=>{window.__NOLOD=n;},!!process.env.NOLOD);
await p.addInitScript(()=>localStorage.setItem('veyra_set',JSON.stringify({modelle3d:true,quality:'hoch',gfx:'high',res:'native',shadows:1})));
await p.goto(S.url+'index.html',{waitUntil:'load'});await p.waitForTimeout(1500);
await p.evaluate(()=>{const i=document.querySelector('#iSkip');if(i)i.click();});await p.waitForTimeout(800);await p.evaluate(()=>document.querySelector('#tNew').click());
await p.waitForFunction(()=>typeof G!=='undefined'&&G,null,{timeout:30000});
await p.evaluate(([m,x,y,d])=>{for(let i=0;i<30&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}G.flags.starter=1;if(!G.team.length)G.team.push(mk(1,12));mode='world';setView('third',1);gfxForce('high');if(window.__NOLOD)for(const k in GFX.mlod)GFX.mlod[k]={sh:999,ol:999,hide:999};loadMap(m,+x,+y);P.dir=d;P.ang=YAW[d];R3.yaw=P.ang;R3.snap=1;if(window.INP&&INP.camReset)INP.camReset();},[map,X,Y,DIR]);
await p.waitForTimeout(12000);
console.log(await p.evaluate(()=>{const cat=o=>{for(let q=o;q;q=q.parent){const U=q.userData||{};if(U.pilot)return 'figur:'+U.pilot;if(U.lod1)return 'terra';if(U.haus)return 'haus';if(q.parent===R3.scene)return (q.isInstancedMesh?'inst ':'')+(q.material&&q.material.type||q.type);}return '?';};
 const out={},cam=R3.activeCam||R3.cam;R3.scene.traverse(o=>{if(!o.isMesh)return;let vis=true;for(let q=o;q;q=q.parent)if(!q.visible)vis=false;if(!vis)return;const g=o.geometry;const t=(g.index?g.index.count:g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);const k=cat(o);const e=out[k]||(out[k]={tris:0,meshes:0,shadow:0});e.tris+=t;e.meshes++;if(o.castShadow)e.shadow+=t;});
 return Object.entries(out).sort((a,b)=>b[1].tris-a[1].tris).slice(0,18).map(([k,v])=>k+' tris '+Math.round(v.tris)+' sh '+Math.round(v.shadow)+' meshes '+v.meshes).join('\n')+'\nGFX '+JSON.stringify(gfxStats());}));
await b.close();S.close();
