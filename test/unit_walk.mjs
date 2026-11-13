// Bewegung – Laufzyklus ohne Browser (VM wie tools/balance.mjs + echtes three.js r128 aus public/three.min.js):  node test/unit_walk.mjs
// Prüft: Rig (1 SkinnedMesh + Umriss), Fußplanting ohne Gleiten (< 0,02 Einheiten/Frame, gemessen an den Knochen), Schrittlänge × Frequenz = Weg,
// Knie-Knick, gegengleicher Armschwung, Lean beim Rennen, weicher Übergang Stehen→Gehen→Rennen, Idle-Atmen, Posen (Sitzen), Wurf.
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync } from 'fs';
import vm from 'vm';
const { ctx, run } = loadVeyra();
vm.runInContext(readFileSync(new URL('../public/three.min.js', import.meta.url), 'utf8'), ctx);
run(`window={THREE};terrainY=()=>0;`);
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
// Simulation: Figur läuft mit Geschwindigkeitsprofil, misst Kontaktpunkte aus den Knochen (Fußknochen-Matrix · Ballen/Ferse)
run(String.raw`globalThis.SIM=function(o){o=o||{};const f=person3d('#e8623a','#1f8a7a');const dt=o.dt||1/60,N=o.n||600,prof=o.v||(()=>1);let x=0,z=0,yaw=o.yaw||0,maxSlip=0,maxPen=0,maxFloat=0,prev=[null,null],dist=0,steps=0,lastOn=[1,1],kneeMin=0,armCorr=0,armN=0,leanMax=0,yawRate=o.turn||0;
 const tmp=new THREE.Vector3(),rec=[];
 for(let k=0;k<N;k++){const tt=k*dt,v=prof(tt);yaw+=yawRate*dt;x+=-Math.sin(yaw)*v*dt;z+=-Math.cos(yaw)*v*dt;dist+=v*dt;f.position.set(x,0,z);f.rotation.y=yaw;
  const G_=gaitTick(f,dt,{mode:o.mode||'ground'});f.updateMatrixWorld(true);const B=f.userData.rig.b;
  // Kontaktpunkt = Drehpunkt (Ferse bei Spitze hoch, sonst Ballen), verglichen mit DEMSELBEN Punkt im Vorframe (Bewegungsdynamik 12.11.: der Fuß rollt jetzt
  // wirklich von der Ferse über den flachen Fuß auf den Ballen ab – der Wechsel des Drehpunkts bei flachem Fuß ist kein Gleiten)
  for(let i=0;i<2;i++){const L=G_.legs[i],ft=B[i?9:6],th=L.thc||0,hl=new THREE.Vector3(0,-RIG.HA,RIG.HEEL).applyMatrix4(ft.matrixWorld),bl=new THREE.Vector3(0,-RIG.HA,-RIG.BALL).applyMatrix4(ft.matrixWorld),pt=th>0?hl:bl,j=th>0?0:1;tmp.copy(pt);
   if(L.on&&k>o.skip){if(prev[i]){const q=prev[i][j],d=Math.hypot(tmp.x-q[0],tmp.z-q[1]);if(d>maxSlip)maxSlip=d;}maxPen=Math.max(maxPen,-tmp.y);maxFloat=Math.max(maxFloat,tmp.y);prev[i]=[[hl.x,hl.z],[bl.x,bl.z]];}else prev[i]=null;
   if(L.on&&!lastOn[i]&&k>o.skip)steps++;lastOn[i]=L.on;}
  if(k>o.skip){kneeMin=Math.min(kneeMin,B[5].rotation.x,B[8].rotation.x);leanMax=Math.max(leanMax,-B[2].rotation.x);armCorr+=B[10].rotation.x*B[4].rotation.x;armN++;}
  if(o.rec&&k%(o.rec)===0)rec.push([+B[1].position.y.toFixed(4),+B[4].rotation.x.toFixed(3),+B[10].rotation.x.toFixed(3)]);}
 const G_=f.userData.gait;return{maxSlip,maxPen,maxFloat,steps,dist,kneeMin,lean:leanMax,armCorr:armCorr/Math.max(1,armN),S:G_.S,beta:G_.beta,w:G_.w,rec,meshes:(()=>{let n=0;f.traverse(q=>{if(q.isMesh)n++;});return n})(),skinned:(()=>{let n=0;f.traverse(q=>{if(q.isSkinnedMesh)n++;});return n})()};};`);
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
const R = {};
t('Rig: Figur = 1 SkinnedMesh + 1 Umriss-Hülle (2 Draw-Calls statt 4), 14 Knochen, legs-Kompatibilität', () => {
  const r = J(`(()=>{const f=person3d('#e8623a','#1f8a7a');let mesh=0,sk=0;f.traverse(q=>{if(q.isMesh)mesh++;if(q.isSkinnedMesh)sk++;});return[mesh,sk,f.userData.rig.b.length,f.userData.legs.length,!!f.userData.legs[0].isBone]})()`);
  if (r[0] !== 2 || r[1] !== 2 || r[2] !== 14 || r[3] !== 2 || !r[4]) throw new Error(JSON.stringify(r)); });
t('Rig: Outfit-Varianten (Haar lang/zopf/dutt/wuschel, Mütze) bauen ohne Fehler, Geometrie gecacht', () => run(`(()=>{for(const h of ['lang','zopf','dutt','wuschel','kurz'])person3d('#3a6','#2a4',{skin:'#f0c8a0',pants:'#334',hairCol:'#5a3a24',hair:h,cap:false,capCol:'#38f',top:'#3a6'});const a=person3d('#e8623a','#1f8a7a'),b=person3d('#e8623a','#1f8a7a');return a.children[0].geometry===b.children[0].geometry&&a.children[0].skeleton!==b.children[0].skeleton})()`));
// Tempi wie im Spiel seit Bewegungsdynamik 12.11. (17-move MOVE_PARAMS: Gehen-Taste 2,8, Rennen 5; Stick halb ≈ 1,4) – vorher 3,75/7,5
for (const [name, v] of [['Gehen langsam', .9], ['Gehen (Stick halb)', 1.4], ['Laufen 2,8', 2.8], ['Rennen 5', 5]]) {
  t(`Kein Gleiten – ${name} (${v} Felder/s): Standfuß < 0,02/Frame, Boden ±0,02`, () => { const r = J(`SIM({v:()=>${v},n:540,skip:120})`); R[name] = r;
    if (!(r.maxSlip < .02)) throw new Error('Gleiten ' + r.maxSlip.toFixed(4)); if (r.maxPen > .02 || r.maxFloat > .02) throw new Error('Kontakt nicht am Boden: ' + r.maxPen.toFixed(3) + '/' + r.maxFloat.toFixed(3));
    console.log(`   Gleiten max ${r.maxSlip.toFixed(4)} · Schrittlänge ${r.S.toFixed(2)} · Stand ${r.beta.toFixed(2)} · Schritte ${r.steps}`); });
}
t('Schrittlänge × Frequenz = Weg (Schritte ≈ 2·Weg/Schrittlänge)', () => { for (const k in R) { const r = R[k], exp = 2 * (r.dist * (420 / 540)) / r.S; if (Math.abs(r.steps - exp) > Math.max(2, exp * .12)) throw new Error(k + ': ' + r.steps + ' statt ≈' + exp.toFixed(1)); } });
t('Kein Gleiten beim Anlaufen/Abbremsen und in Kurven (Stick-Profil 0 → 2,8 → 5 → 0, Drehung 1,2 rad/s)', () => {
  const r = J(`SIM({v:tt=>tt<.5?0:tt<1.5?2.8*(tt-.5):tt<3?2.8:tt<4?2.8+2.2*(tt-3):tt<5.5?5:tt<6?5*(1-(tt-5.5)*2):0,turn:1.2,n:480,skip:10})`);
  if (!(r.maxSlip < .02)) throw new Error('Gleiten ' + r.maxSlip.toFixed(4)); console.log('   Gleiten max ' + r.maxSlip.toFixed(4)); });
t('Knie-Knick: Unterschenkel beugt deutlich (Gehen > 35°, Rennen > 70°)', () => { const w = R['Gehen (Stick halb)'].kneeMin, r = R['Rennen 5'].kneeMin; if (!(w < -.6 && r < -1.2)) throw new Error(w.toFixed(2) + ' / ' + r.toFixed(2)); });
t('Gegengleicher Armschwung: linker Arm vorn, wenn linkes Bein hinten (Korrelation < 0)', () => { for (const k in R) if (!(R[k].armCorr < 0)) throw new Error(k + ' ' + R[k].armCorr); });
t('Oberkörper-Neigung beim Rennen größer als beim Gehen', () => { if (!(R['Rennen 5'].lean > R['Gehen langsam'].lean + .08)) throw new Error(R['Rennen 5'].lean + ' / ' + R['Gehen langsam'].lean); });
t('Übergang Stehen → Gehen weich (Bewegungsgewicht nach 0,1 s < 0,6, nach 0,5 s > 0,9)', () => { const a = J(`SIM({v:()=>1.5,n:6}).w`), b = J(`SIM({v:()=>1.5,n:30}).w`); if (!(a < .6 && b > .9)) throw new Error(a + ' / ' + b); });
t('Idle: Atmen + Gewichtsverlagerung bewegt Hüfte, Füße bleiben stehen', () => { const r = J(`SIM({v:()=>0,n:400,skip:5,rec:20})`); const hy = r.rec.map(q => q[0]); if (Math.max(...hy) - Math.min(...hy) < .002) throw new Error('Hüfte starr'); if (r.maxSlip > .001) throw new Error('Füße gleiten im Stand ' + r.maxSlip); });
t('Stehenbleiben: Ausgleichsschritt zur Grundstellung, danach Füße neben der Hüfte (Laufen 2,8 und Rennen 5)', () => run(`[2.8,5].every(V=>{const f=person3d('#e8623a','#1f8a7a');let z=0,v=V;for(let k=0;k<300;k++){if(k>=120)v*=Math.exp(-7/60);if(v<.08)v=0;z-=v/60;f.position.set(0,0,z);gaitTick(f,1/60);}const L=f.userData.gait.legs;return L.every((l,i)=>l.st==='plant'&&Math.abs(l.p[1]-z)<.07&&Math.abs(Math.abs(l.p[0])-.09)<.04)})`));
t('Sitz-Pose (Schwimmen auf dem Partner; Reiten entfernt): Oberschenkel nach vorn, Knie gebeugt; zurück auf den Boden ohne Fehler', () => run(`(()=>{const f=person3d('#e8623a','#1f8a7a');for(let k=0;k<60;k++)gaitTick(f,1/60,{mode:'sit',state:'swim'});const B=f.userData.rig.b,ok=B[4].rotation.x>1&&B[5].rotation.x<-1;for(let k=0;k<30;k++)gaitTick(f,1/60);return ok&&Math.abs(B[4].rotation.x)<.6})()`));
t('Wurf (36-input figAnim): rechter Arm holt aus', () => run(`(()=>{const f=person3d('#e8623a','#1f8a7a');gaitTick(f,1/60);figAnim(f,'wurf');for(let k=0;k<12;k++)gaitTick(f,1/60);return f.userData.rig.b[12].rotation.x<-1})()`));
// QA Mechanik L1: Knie springt beim Abheben nicht mehr (Stand → Schwung), Gehen insgesamt ohne Zucken
// Bewegungsdynamik 12.11.: Laufen/Rennen haben jetzt eine echte Streckung beim Abstoß (Standbein exakt, Standphase 5–8 Frames) – Grenze dort 0,4 (Schwungbein-Ratengrenze 21 rad/s ≈ 0,35/Frame)
t('Abheben ohne Knie-Sprung (QA L1): Stand→Schwung < 0,3 rad/Frame im Gehen 1,4, ≤ 0,4 bei Laufen 2,8/Rennen 5; Gehen gesamt < 0,4, Laufen/Rennen gesamt ≤ 0,6 rad/Frame', () => {
  const r = J(`[1.4,2.8,5].map(V=>{const f=person3d('#e8623a','#1f8a7a');let x=0;const B=f.userData.rig.b;let pv=null,pst=null,lift=0,all=0;
   for(let k=0;k<400;k++){const v=k<20?0:V;x-=v/60;f.position.set(x,0,0);f.rotation.y=Math.PI/2;const G_=gaitTick(f,1/60,{});const c=[4,5,6,7,8,9].map(i=>B[i].rotation.x),st=G_.legs.map(L=>L.st+(L.st==='swing'&&(L.s||0)<.2?'0':''));
    if(pv&&k>150)for(let l=0;l<2;l++){let m=0;for(let j=0;j<3;j++)m=Math.max(m,Math.abs(c[l*3+j]-pv[l*3+j]));if(pst[l]==='plant'&&st[l]==='swing0'||pst[l]==='swing0')lift=Math.max(lift,m);all=Math.max(all,m);}
    pv=c;pst=st;}return[lift,all];})`);
  console.log('   Abheben max ' + r.map(q => q[0].toFixed(3)).join(' / ') + ' · gesamt ' + r.map(q => q[1].toFixed(3)).join(' / '));
  if (!(r[0][0] < .3) || r[0][1] >= .4 || !(r[1][0] <= .4 && r[2][0] <= .4) || !(r[1][1] <= .6 && r[2][1] <= .6)) throw new Error(JSON.stringify(r)); });
console.log(`\n${ok} ✓ / ${bad} ✗`); process.exit(bad ? 1 : 0);
