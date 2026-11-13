// Bewegungsdynamik – gemeinsame Gang-Simulation ohne Browser (VM wie unit_walk + echtes three.js r128)
// SIMG({v:prof(t)|zahl, n, dt, turn, skip}) → Messwerte: Gleiten Standfuß (Kontaktpunkt aus Knochen), Gelenkänderung je Frame (Knie/alle), Bodenkontakt, Hüft-Bob, Schritte
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync } from 'fs';
import vm from 'vm';
export function gaitVM() {
  const { ctx, run } = loadVeyra();
  vm.runInContext(readFileSync(new URL('../public/three.min.js', import.meta.url), 'utf8'), ctx);
  run(`window={THREE};terrainY=()=>0;`);
  run(String.raw`globalThis.SIMG=function(o){o=o||{};const ty0=globalThis.terrainY;if(o.ty)globalThis.terrainY=o.ty;try{return SIMG0(o);}finally{globalThis.terrainY=ty0;}};globalThis.SIMG0=function(o){const f=person3d('#e8623a','#1f8a7a');const dt=o.dt||1/60,N=o.n||600,prof=typeof o.v==='function'?o.v:(()=>o.v||0);let x=0,z=0,yaw=o.yaw||0,slip=0,pen=0,flo=0,prev=[null,null],dist=0,steps=0,lastOn=[1,1];
   const tmp=new THREE.Vector3(),B=f.userData.rig.b,pv=[];let knee=0,all=0,worst=null,hipMin=9,hipMax=-9,air=0,kneeMin=0,leanMax=0,armC=0,armN=0,rec=[];const rot=b=>[b.rotation.x,b.rotation.y,b.rotation.z];
   for(let k=0;k<N;k++){const tt=k*dt,v=prof(tt);yaw+=(typeof o.turn==='function'?o.turn(tt):(o.turn||0))*dt;x+=-Math.sin(yaw)*v*dt;z+=-Math.cos(yaw)*v*dt;dist+=v*dt;f.position.set(x,o.ty?o.ty(x,z):0,z);f.rotation.y=yaw;f.rotation.z=o.roll?o.roll(tt):0;
    const G_=gaitTick(f,dt,{mode:'ground'});f.updateMatrixWorld(true);let on=0;
    // Kontaktpunkt = Drehpunkt des Standfußes (Ferse bei Spitze hoch, sonst Ballen); Vergleich mit DEMSELBEN Punkt im Vorframe (Wechsel Ferse→Ballen bei flachem Fuß ist kein Gleiten)
    for(let i=0;i<2;i++){const L=G_.legs[i],ft=B[i?9:6],th=L.thc||0,hl=tmp.set(0,-RIG.HA,RIG.HEEL).applyMatrix4(ft.matrixWorld).clone(),bl=tmp.set(0,-RIG.HA,-RIG.BALL).applyMatrix4(ft.matrixWorld).clone(),pt=th>0?hl:bl,j=th>0?0:1;const gy=o.ty?o.ty(pt.x,pt.z):0;
     if(L.on){on++;if(k>o.skip){if(prev[i]){const q=prev[i][j],d=Math.hypot(pt.x-q[0],pt.z-q[1]);if(d>slip)slip=d;}pen=Math.max(pen,gy-pt.y);flo=Math.max(flo,pt.y-gy);}prev[i]=[[hl.x,hl.z],[bl.x,bl.z]];}else prev[i]=null;
     if(L.on&&!lastOn[i]&&k>o.skip)steps++;lastOn[i]=L.on;}
    const cur=B.map(rot);if(k>o.skip&&pv.length){for(let b=1;b<B.length;b++)for(let a=0;a<3;a++){const d=Math.abs(cur[b][a]-pv[b][a]);if((b===5||b===8)&&a===0&&d>knee)knee=d;if(d>all){all=d;worst=[k,b,a,+d.toFixed(3)];}}}
    pv.length=0;cur.forEach(c=>pv.push(c));
    if(k>o.skip){hipMin=Math.min(hipMin,B[1].position.y);hipMax=Math.max(hipMax,B[1].position.y);if(!on)air++;kneeMin=Math.min(kneeMin,B[5].rotation.x,B[8].rotation.x);leanMax=Math.max(leanMax,-B[2].rotation.x-B[1].rotation.x);armC+=B[10].rotation.x*B[4].rotation.x;armN++;}
    if(o.rec&&k%o.rec===0)rec.push({k,hy:+B[1].position.y.toFixed(3),th:[+B[4].rotation.x.toFixed(2),+B[7].rotation.x.toFixed(2)],kn:[+B[5].rotation.x.toFixed(2),+B[8].rotation.x.toFixed(2)],st:G_.legs.map(L=>L.st[0]+(L.set?'s':'')).join(''),ph:+G_.ph.toFixed(2)});}
   const G_=f.userData.gait;const M=N-(o.skip||0);return{slip:+slip.toFixed(4),pen:+pen.toFixed(3),flo:+flo.toFixed(3),knee:+knee.toFixed(3),all:+all.toFixed(3),worst,steps,dist:+dist.toFixed(2),S:+G_.S.toFixed(3),beta:+G_.beta.toFixed(3),bob:+(hipMax-hipMin).toFixed(3),air:+(air/M).toFixed(2),kneeMin:+kneeMin.toFixed(2),lean:+leanMax.toFixed(3),armC:+(armC/Math.max(1,armN)).toFixed(3),cad:+(steps/((M)*dt)).toFixed(2),w:+G_.w.toFixed(3),rec};};`);
  return { run, J: c => JSON.parse(run('JSON.stringify(' + c + ')')) };
}
