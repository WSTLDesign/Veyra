// Gegenprüfung Runde 1 – Punkt 7: Gelenk-Amplituden des Laufzyklus (ohne Browser, VM wie unit_walk). Prüft, dass die Glättung (GAIT_X) das Rennen nicht versteift.
//   node test/qa_gp1_gait.mjs
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync } from 'fs';
import vm from 'vm';
const { ctx, run } = loadVeyra();
vm.runInContext(readFileSync(new URL('../public/three.min.js', import.meta.url), 'utf8'), ctx);
run(`window={THREE};terrainY=()=>0;`);
run(String.raw`globalThis.AMP=function(v,gx){const f=person3d('#e8623a','#1f8a7a');if(gx)Object.assign(GAIT_X,gx);const dt=1/60;let x=0,z=0,yaw=0;const mn={},mx={};const keys=['th','sh','ar','fa','sp','hy'];
 const upd=(k,val)=>{mn[k]=Math.min(mn[k]??9,val);mx[k]=Math.max(mx[k]??-9,val);};let steps=0,lastOn=[1,1];
 for(let k=0;k<600;k++){x+=-Math.sin(yaw)*v*dt;z+=-Math.cos(yaw)*v*dt;f.position.set(x,0,z);f.rotation.y=yaw;const G_=gaitTick(f,dt,{mode:'ground'});f.updateMatrixWorld(true);const B=f.userData.rig.b;
  for(let i=0;i<2;i++){if(G_.legs[i].on&&!lastOn[i]&&k>200)steps++;lastOn[i]=G_.legs[i].on;}
  if(k>200){upd('th',B[4].rotation.x);upd('sh',B[5].rotation.x);upd('ar',B[10].rotation.x);upd('fa',B[11].rotation.x);upd('sp',B[2].rotation.x);upd('hy',B[1].position.y);}}
 const r=o=>+o.toFixed(3);const out={S:r(f.userData.gait.S)};for(const k of keys)out[k]=[r(mn[k]),r(mx[k]),'ptp '+r(mx[k]-mn[k])];out.stepsPerS=r(steps/(400/60));return out;};`);
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
for (const v of [1.8, 3.75, 7.5]) console.log('v=' + v, JSON.stringify(J(`AMP(${v})`)));
// Vergleich: ohne die Nachbesserungs-Begrenzung (GAIT_X.kon=0, rf=0) – zeigt, was die Glättung an Amplitude kostet
console.log('--- GAIT_X aus (kon:0, rf:0, all:0) ---');
for (const v of [3.75, 7.5]) console.log('v=' + v, JSON.stringify(J(`AMP(${v},{kon:0,rf:0,all:0})`)));
