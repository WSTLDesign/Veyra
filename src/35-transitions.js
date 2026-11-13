// ===== VEYRA – Kampf-Inszenierung (Look L2): Kamera-Regie über CAM, diegetische KP-Leisten =====
// Kampf bleibt rundenbasiert; hier nur Bild: Kamera-Fahrten (CAM-Wechsel statt Szenenwechsel) und Position der KP-Leisten über den Köpfen.
// CAM-Schnittstelle (Details: docs/look-ui.md):
//  CAM.mode 'battle' ab startBattleNow, zurück auf 'explore' in endBattle (oder automatisch, wenn B verschwindet).
//  Im Kampf (Koordinaten der 3D-Kampfszene BT.s): target{x,y,z} Bodenpunkt · height Blickpunkt über target · dist Abstand Auge↔Blickpunkt ·
//  yaw Blickrichtung (vorwärts = (-sin yaw, -cos yaw), wie 36) · pitch Höhenwinkel des Auges (rad, < 0 = Untersicht) · fov vertikal (Grad, Referenz 16:9) ·
//  focus 'intro'|'both'|'me'|'foe' · lookAt/eye fertig berechnet. Wendet 10-mon3d CAM selbst an, setzt L1 CAM.battleApplied=true → Fallback in 42 aus.
// Globale Funktionen: camBattleStart(o), camBattleEnd(), camFocus(f,ms), battleHudPlace(cam,canvas)
const CAMB={on:false,t0:0,focus:'both',until:0,last:0,cur:null,explore:null,fxT:0,lungeT:0,hp:{},placed:false};
function camGet(){let C=null;try{if(typeof CAM!=='undefined'&&CAM)C=CAM;}catch(e){}if(!C)C=window.CAM=window.CAM||{};
 if(!C.target)C.target={x:0,y:0,z:0};if(!C.lookAt)C.lookAt={x:0,y:0,z:0};if(!C.mode)C.mode='explore';return C;}
const camRed=()=>{try{return !!RED||matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
// Posen relativ zur Achse eigene Kreatur → Gegner: a = Anteil auf der Achse, yo = Drehung gegen die Achse, d/h/p/f = Abstand/Blickhöhe/Höhenwinkel/FOV
const CAMPOSE={
 intro:{a:.62,yo:-.05,d:12.5,h:1.3,p:.30,f:38},
 both: {a:.5,yo:.40,d:8.0,h:1.05,p:-.055,f:34},// Hybrid H2: leichte Untersicht → Horizont ≈ 0,58 (= horizonY des Kampfbildes)
 me:   {a:.24,yo:.50,d:5.8,h:.8,p:.15,f:34},
 foe:  {a:.82,yo:.40,d:6.4,h:1.0,p:.04,f:30}};
function camFocus(f,ms){CAMB.focus=f;CAMB.until=ms?performance.now()+ms:0;}
function camBattleStart(o){const C=camGet();
 if(!CAMB.on)CAMB.explore={dist:C.dist,height:C.height,pitch:C.pitch,fov:C.fov,yaw:C.yaw};
 CAMB.on=true;CAMB.t0=performance.now();CAMB.cur=Object.assign({},CAMPOSE.intro);CAMB.focus='both';CAMB.until=0;CAMB.fxT=0;CAMB.lungeT=0;CAMB.hp={};CAMB.placed=false;
 C.mode='battle';C.focus='intro';document.body.classList.add('cam-battle');
 const bt=document.getElementById('battle');if(bt){bt.classList.remove('hud-in');bt.querySelectorAll('.ibox').forEach(b=>{b.style.transform='';b.classList.remove('placed','off');});}}
function camBattleEnd(){if(!CAMB.on)return;CAMB.on=false;const C=camGet(),E=CAMB.explore||{};C.mode='explore';C.focus=null;
 for(const k of['dist','height','pitch','fov','yaw'])if(E[k]!=null)C[k]=E[k];C.eye=null;document.body.classList.remove('cam-battle');
 const bt=document.getElementById('battle');if(bt){bt.classList.remove('dieg','hud-in');bt.querySelectorAll('.ibox').forEach(b=>{b.style.transform='';b.classList.remove('placed','off');});}}
// Kreaturen-Positionen in der Kampfszene (Fallback = Standardplätze aus 10-mon3d)
function camPts(){let M={x:-2.2,y:.16,z:1.6},F={x:2.4,y:.16,z:-2.7};try{if(BT&&BT.me)M=BT.me.position;if(BT&&BT.foe)F=BT.foe.position;}catch(e){}return[M,F];}
function camWant(now){let f=CAMB.focus;if(CAMB.until&&now>CAMB.until){CAMB.until=0;f=CAMB.focus='both';}
 if(!CAMB.until){const bm=document.getElementById('bMenu');f=bm&&bm.classList.contains('rmoves')?'me':'both';CAMB.focus=f;}
 return CAMPOSE[f]||CAMPOSE.both;}
// Ereignisse lesen (rein visuell): Treffer → kurz zum Getroffenen, Fangkapsel → Gegner
function camEvents(now){if(!B)return;const fx=B.fx;
 if(fx&&fx.t!==CAMB.fxT){CAMB.fxT=fx.t;if(fx.who==='ball')camFocus('foe',2200);else if(!fx.buff&&(fx.who==='foe'||fx.who==='me'))camFocus(fx.who,950);}}
function camTick(now,dt){const C=camGet();
 if(CAMB.on&&!B&&typeof mode!=='undefined'&&mode!=='battle'){camBattleEnd();return;}
 if(!CAMB.on||!B)return;camEvents(now);
 const W=camWant(now),red=camRed(),intro=now-CAMB.t0<1600,lam=red?1e3:intro?2.1:2.8,k=1-Math.exp(-lam*Math.min(.1,dt/1000)),P=CAMB.cur||(CAMB.cur=Object.assign({},W));
 for(const key of['a','yo','d','h','p','f'])P[key]+=(W[key]-P[key])*k;
 const[M,F]=camPts(),dx=F.x-M.x,dz=F.z-M.z,len=Math.hypot(dx,dz)||1,yaw0=Math.atan2(-dx/len,-dz/len);
 // Seitenverhältnis: schmale Szenen (Hochformat) brauchen etwas mehr Abstand
 let asp=1.78;try{const cv=BT&&BT.r&&BT.r.domElement;if(cv&&cv.clientHeight)asp=cv.clientWidth/cv.clientHeight;}catch(e){}
 // Hochformat: Kamera eher hinter der eigenen Kreatur (Tiefe statt Breite), etwas höher; kein zusätzlicher Abstand (FOV in 42)
 const port=asp<1.2,dk=port?1:asp<1.5?Math.pow(1.5/asp,.4):1,yo=port?P.yo*.8:P.yo,pp=port?P.p+.07:P.p,sway=red?0:Math.sin(now/5200)*.07+Math.sin(now/2900)*.02;
 const yaw=yaw0+yo+sway,tx=M.x+dx*P.a,tz=M.z+dz*P.a,dist=P.d*dk,cp=Math.cos(pp);
 C.mode='battle';C.focus=CAMB.focus;C.target.x=tx;C.target.y=0;C.target.z=tz;C.dist=dist;C.height=P.h;C.yaw=yaw;C.pitch=pp;C.fov=P.f;
 C.lookAt.x=tx;C.lookAt.y=P.h;C.lookAt.z=tz;
 const E=C.eye||(C.eye={x:0,y:0,z:0});E.x=tx+Math.sin(yaw)*cp*dist;E.y=Math.max(.35,P.h+Math.sin(pp)*dist);E.z=tz+Math.cos(yaw)*cp*dist;
 if(now-CAMB.t0>700){const bt=document.getElementById('battle');if(bt&&!bt.classList.contains('hud-in'))bt.classList.add('hud-in');}}
(function(){let last=performance.now();const f=()=>{requestAnimationFrame(f);const t=performance.now(),dt=Math.min(100,t-last);last=t;try{camTick(t,dt);}catch(e){if(!CAMB._err){CAMB._err=1;console.error('Kampfkamera',e);}}};requestAnimationFrame(f);})();
// ---------- KP-Leisten über den Köpfen (Projektion 3D → DOM, Koordinaten relativ zu .scene) ----------
let _hpV=null;
function battleHudPlace(cam,cv){if(!B||!BT||!window.THREE)return;const bt=document.getElementById('battle');if(!bt)return;
 if(!bt.classList.contains('dieg'))bt.classList.add('dieg');
 const W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;_hpV=_hpV||new THREE.Vector3();
 const gx=Math.max(10,W*.012),gy=Math.max(8,H*.02),R={},cr=cv.getBoundingClientRect(),lg=document.getElementById('bLog');
 let gt=gy;if(lg&&lg.textContent){const lr=lg.getBoundingClientRect();if(lr.height)gt=Math.max(gy,lr.bottom-cr.top+6);}
 for(const[w,id]of[['foe','bFoeBox'],['me','bMeBox']]){const o=BT[w],el=document.getElementById(id);if(!o||!el)continue;const U=o.userData||{};
  _hpV.set(o.position.x,o.position.y+(U.baseH||1)*o.scale.y*1.04+.18,o.position.z).project(cam);
  const off=_hpV.z>1||_hpV.x<-1.08||_hpV.x>1.08||!o.visible;el.classList.toggle('off',off);if(off)continue;const bw=el.offsetWidth||180,bh=el.offsetHeight||40;
  let x=(_hpV.x+1)/2*W-bw/2,y=(1-_hpV.y)/2*H-bh-4;
  x=Math.max(gx,Math.min(W-bw-gx,x));y=Math.max(gt,Math.min(H-bh-gy,y));R[w]={x,y,w:bw,h:bh,el};}
 // Überlappung vermeiden: Gegner-Leiste weicht nach oben/rechts aus
 if(R.foe&&R.me){const a=R.foe,b=R.me;if(a.x<b.x+b.w+6&&b.x<a.x+a.w+6&&a.y<b.y+b.h+6&&b.y<a.y+a.h+6){a.y=Math.max(gt,b.y-a.h-8);if(a.y+a.h>b.y-4)a.x=Math.min(W-a.w-gx,b.x+b.w+10);}}
 const sm=CAMB.placed&&!camRed()?.35:1;
 for(const w in R){const r=R[w],p=CAMB.hp[w]||(CAMB.hp[w]={x:r.x,y:r.y});p.x+=(r.x-p.x)*sm;p.y+=(r.y-p.y)*sm;
  r.el.style.transform=`translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;if(!r.el.classList.contains('placed'))r.el.classList.add('placed');}
 if(R.foe||R.me)CAMB.placed=true;}
