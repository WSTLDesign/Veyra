// Hilfsskript Welt-Grafik: Dreiecke je Netz in der aktuellen Szene (Route 1)
import { chromium } from 'playwright';
import { serve } from '../art_serve.mjs';
const S=await serve();const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:800,height:450}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.route(/sw\.js$/, r => r.fulfill({ status: 404, body: '' }));
await p.addInitScript(()=>localStorage.setItem('veyra_set',JSON.stringify({quality:'hoch',gfx:'high',res:'native'})));
await p.goto(S.url+'index.html',{waitUntil:'load'});
try { await p.click('#iPrompt', { timeout: 4000 }); } catch (e) {}
await p.waitForTimeout(400); try { await p.click('#iSkip', { timeout: 4000 }); } catch (e) {}
await p.waitForTimeout(800); await p.click('#tNew'); await p.waitForFunction(()=>typeof G!=='undefined'&&G);
const map=process.argv[2]||'route1';
console.log(await p.evaluate(async(map)=>{for(let i=0;i<30&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}G.flags.starter=1;mode='world';setView('third',1);loadMap(map,9,15);await new Promise(r=>setTimeout(r,4000));
 const out={};R3.scene.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry;const t=(g.index?g.index.count:g.attributes.position.count)/3;const n=o.isInstancedMesh?o.count:1;const k=(o.material&&o.material.type)+(o.isInstancedMesh?'#I':'')+(o.castShadow?'+S':'')+' '+t;out[k]=(out[k]||0)+t*n;});
 return Object.entries(out).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>k+' = '+Math.round(v)).join('\n')+'\nGFX '+JSON.stringify(gfxStats());},map));
await b.close();S.close();
