// ===== VEYRA – 3D-Modelle: Pilot (12.11.) + Figuren Runde 2 (Held Noa, NPCs) als gebaute GLB-Modelle – NUR hinter dem Schalter =====
// Schalter: SET.modelle3d (Standard false/aus; zum Testen auch ?modelle3d=1). Aus ⇒ das Spiel bleibt unverändert (keine Ladevorgänge, keine Hooks aktiv).
// An ⇒ lädt models/figuren/<id>.glb bzw. models/pilot/<id>.glb (Draco, three r128 GLTFLoader aus 38-models), Darstellung mit 56-toonpro; scheitert das Laden → bisheriges Prozedural.
// Figuren-Zuordnung (figModelFor): Spielerfigur 'held' → fig_noa, 'heldin' → fig_heldin · Figuren-NPCs nach FIGURES-Id (veyran, rayan, mama, mirael) · Laden (t:'shop') → fig_haendler ·
//   übrige Bewohner/Wanderer ohne eigene Figur → fig_buerger_a…d (stabil aus der Farbe). Alle anderen benannten Figuren bleiben prozedural.
// Laufzeit: Gang ohne Gleiten (gemeinsame Phase für walk/jog/run, Schrittlänge je Clip), Blinzeln, Blicksprünge der Augen, NPC schaut zum Spieler,
//   spricht im Dialog (Mund A/O), Ausdruck aus dem Dialogtext, Einmal-Clips winken/jubeln/werfen, LOD (Körper 50 %) ab 9 Feldern.
// API: pilotOn() · pilotLoad(k)→Promise · pilotMake(k,h,opts)→Group|null · pilotExpr(o,name) · pilotTick(o,dt,opt) · pilotOnce(o,clip) · figModelFor(col,hat,oe) · PILOT_EXPR · FIG_MODELS
// window.PILOT_SRC (optional, Werkstatt-Build: data-URIs aus spiel/models/<bereich>/<id>.js) ersetzt die Pfade
// Figuren: H = Modellhöhe (Scheitel, Blender-m), h = Spielhöhe (Felder, wie CHAR_BUILD), s = Doppelschritt (m) für walk/jog/run
const FIG_MODELS={fig_noa:{H:1.45,h:1.32,s:[1.6,2.05,3.0],held:1},fig_heldin:{H:1.45,h:1.32,s:[1.6,2.05,3.0],held:1},fig_rayan:{H:1.45,h:1.32,s:[1.6,2.05,3.0]},fig_veyran:{H:1.68,h:1.55,s:[1.32,2.4,3.3]},
 fig_mama:{H:1.68,h:1.58,s:[1.32,2.4,3.3]},fig_mirael:{H:1.68,h:1.58,s:[1.32,2.4,3.3]},fig_haendler:{H:1.76,h:1.7,s:[1.32,2.4,3.3]},
 fig_buerger_a:{H:1.68,h:1.58,s:[1.32,2.4,3.3]},fig_buerger_b:{H:1.6,h:1.47,s:[1.32,2.4,3.3]},fig_buerger_c:{H:1.8,h:1.68,s:[1.32,2.4,3.3]},fig_buerger_d:{H:1.6,h:1.52,s:[1.2,2.25,3.2]}};
const FIG_BY_ID={veyran:'fig_veyran',prof:'fig_veyran',professor:'fig_veyran',rayan:'fig_rayan',mama:'fig_mama',mirael:'fig_mirael'};
const FIG_BUERGER=['fig_buerger_a','fig_buerger_b','fig_buerger_c','fig_buerger_d'];
const PILOT={src:Object.assign({noa:'models/pilot/noa.glb',funki:'models/pilot/funki.glb'},...Object.keys(FIG_MODELS).map(k=>({[k]:'models/figuren/'+k+'.glb'})),window.PILOT_SRC||{}),gltf:{},st:{},wait:{},
 // ry: Drehung, damit das Modell wie die bisherigen Objekte schaut · walk/run: Schrittlänge (Modellmaß) je Clip-Durchlauf und Dauer (s) – nur Pilot
 fix:{noa:{ry:Math.PI,walk:[.9,1],run:[1.7,.667]},funki:{ry:Math.PI,walk:[.42,.8],run:[.8,.5]}},outline:'duenn',hOld:{},lodD:9,talk:null,lookSign:1};
for(const k in FIG_MODELS)PILOT.fix[k]={ry:Math.PI,H:FIG_MODELS[k].H,fig:1};
const PILOT_EXPR={neutral:{},laecheln:{Laecheln:1,Augen_froh:.2},laechelnd:{Laecheln:1,Augen_froh:.2},freudig:{Laecheln:1,Mund_A:.4,Augen_froh:.4},zaertlich:{Laecheln:.7,Augen_froh:.5},
 stolz:{Laecheln:.6,Aerger:.25},staunen:{Staunen:1,Mund_O:.7},ueberrascht:{Staunen:1,Mund_O:.7},blinzeln:{Blinzeln_L:1,Blinzeln_R:1},aerger:{Aerger:1},
 entschlossen:{Aerger:.55,Laecheln:.25},ernst:{Aerger:.35},nachdenklich:{Traurig:.3,Blinzeln_L:.25,Blinzeln_R:.25},traurig:{Traurig:1},
 maul:{Maul_auf:1},froh:{Augen_froh:1,Maul_auf:.5}};
function pilotOn(){try{return SET.modelle3d===true||/[?&]modelle3d=1/.test(location.search);}catch(e){return false;}}
function pilotLoad(k){if(PILOT.wait[k])return PILOT.wait[k];if(window.PILOT_SRC&&window.PILOT_SRC[k])PILOT.src[k]=window.PILOT_SRC[k];if(!window.THREE||typeof modelLoaders!=='function'||!PILOT.src[k])return Promise.resolve(null);PILOT.st[k]='load';
 const t0=performance.now();
 return PILOT.wait[k]=modelLoaders().then(L=>new Promise((res,rej)=>L.load(PILOT.src[k],res,undefined,rej))).then(g=>{PILOT.gltf[k]=g;PILOT.st[k]='ok';PILOT['ms_'+k]=Math.round(performance.now()-t0);return g;})
  .catch(e=>{console.warn('3D-Modell '+k+' nicht geladen – Rückfall prozedural:',e&&e.message||e);PILOT.st[k]='err';return null;});}
function pilotReady(k){return PILOT.st[k]==='ok'&&!!PILOT.gltf[k];}
// Instanz: Klon mit Skelett, Toon-Pro + Umriss, auf Zielhöhe h (Figuren: Scheitelhöhe H → h), Füße auf y=0, Mixer mit allen Clips
const PILOT_ONCE=['attack','hit','joy','winken','jubeln','werfen'];
function pilotMake(k,h,opts){opts=opts||{};const g=PILOT.gltf[k];if(!g||!THREE.SkeletonUtils)return null;const F=PILOT.fix[k]||{};
 const root=new THREE.Group(),body=new THREE.Group(),inner=THREE.SkeletonUtils.clone(g.scene);root.add(body);body.add(inner);inner.rotation.y=F.ry||0;
 toonProApply(inner,{outline:opts.outline||PILOT.outline,mat:Object.assign(F.fig?{fig:1}:{},opts.mat||{})});
 // Gesichtsteile (Lider/Brauen/Mund) brauchen keinen Umriss und werfen keinen Schatten → −1–2 Draw-Calls je Figur (auch im Schattenpass)
 if(F.fig){const rm=[];inner.traverse(m=>{if(m.isMesh&&/Gesicht|Augen|LOD1/.test(m.name)){m.castShadow=false;for(const c of m.children)if(c.userData&&c.userData.outline)rm.push(c);}});rm.forEach(c=>c.parent.remove(c));}
 inner.updateMatrixWorld(true);const box=new THREE.Box3();let lod1=null,lod0=null;inner.traverse(m=>{if(m.isMesh&&!m.userData.outline){if(/LOD1/.test(m.name)){lod1=m;return;}if(/^Koerper/.test(m.name))lod0=m;m.geometry.boundingBox||m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));}});
 const sz=box.getSize(new THREE.Vector3()),sc=h/Math.max(.001,F.H||sz.y);body.scale.setScalar(sc);inner.position.y=-box.min.y;if(lod1)lod1.visible=false;
 const mixer=new THREE.AnimationMixer(inner),acts={};for(const c of g.animations){const a=mixer.clipAction(c);a.enabled=true;a.setEffectiveWeight(0);a.play();acts[c.name]=a;}
 if(acts.idle)acts.idle.setEffectiveWeight(1);for(const n of PILOT_ONCE)if(acts[n]){acts[n].setLoop(THREE.LoopOnce,1);acts[n].clampWhenFinished=false;acts[n].stop();}
 const faces=[];inner.traverse(m=>{if(m.isMesh&&m.morphTargetDictionary&&!m.userData.outline)faces.push(m);});
 const bone={};inner.traverse(b=>{if(b.isBone&&/^(eyeL|eyeR|head|neck)$/.test(b.name))bone[b.name]=b;});
 const U={pilot:k,fig:!!F.fig,mixer,acts,faces,sc,h,w:{idle:1,walk:0,jog:0,run:0},spd:0,lp:null,ph:0,blink:{next:performance.now()+1500,t:-1,dbl:false},expr:'neutral',exW:{},body,inner,
  lod:lod1?[lod0,lod1]:null,lodOn:0,bone,eye:{x:0,y:0,tx:0,ty:0,next:0},look:0,once:null,talk:0};
 root.userData=U;if(typeof blobShadow==='function')blobShadow(root,k==='noa'||k==='fig_noa'||k==='fig_heldin'?.28:k==='funki'?.3:.3);return root;}
// Ausdruck (weich überblendet in pilotFace); Blinzeln läuft immer zusätzlich (2–6 s, 150 ms, manchmal doppelt); im Gespräch Mundbewegung A/O
function pilotExpr(o,name){if(o&&o.userData.pilot)o.userData.expr=name||'neutral';}
function pilotFace(U,dt){const now=performance.now(),B=U.blink,tgt=Object.assign({},PILOT_EXPR[U.expr]||{});
 if(B.t<0&&now>B.next){B.t=now;B.dbl=Math.random()<.2;}let bl=0;if(B.t>=0){const e=(now-B.t)/150;bl=e<1?Math.sin(e*Math.PI):0;if(e>=1){if(B.dbl){B.dbl=false;B.t=now+60;}else{B.t=-1;B.next=now+2000+Math.random()*4000;}}}
 if(U.talk>0){const q=now/1000;tgt.Mund_A=Math.max(tgt.Mund_A||0,.55*Math.max(0,Math.sin(q*13.1))*(.6+.4*Math.sin(q*3.7)));tgt.Mund_O=Math.max(tgt.Mund_O||0,.35*Math.max(0,Math.sin(q*7.3+1)));}
 const k=1-Math.exp(-dt*(U.talk>0?22:12));for(const m of U.faces){const D=m.morphTargetDictionary,I=m.morphTargetInfluences;for(const n in D){const want=(tgt[n]||0);let v=U.exW[n]??0;v+=(want-v)*k;U.exW[n]=v;
  I[D[n]]=Math.min(1,n.startsWith('Blinzeln')?Math.max(v,bl*(1-(tgt.Augen_froh||0)*.6)):v);}}}
// Augen: kleine Blicksprünge (Sakkaden) alle 1–3,5 s; Kopf: NPC schaut zum Spieler, wenn er nah ist
const _pq=window.THREE?new THREE.Quaternion():null,_pe=window.THREE?new THREE.Euler():null;
function pilotLookTick(o,U,dt){const now=performance.now(),E=U.eye,b=U.bone;if(!b.eyeL)return;
 if(now>E.next){E.tx=(Math.random()-.5)*.16;E.ty=(Math.random()-.5)*.08;if(Math.random()<.35){E.tx=0;E.ty=0;}E.next=now+1000+Math.random()*2500;}
 const k=1-Math.exp(-dt*28);E.x+=(E.tx-E.x)*k;E.y+=(E.ty-E.y)*k;_pe.set(E.y,0,E.x);_pq.setFromEuler(_pe);for(const n of['eyeL','eyeR'])if(b[n]){const q0=b[n].userData.q0||(b[n].userData.q0=b[n].quaternion.clone());_pe.set(E.y,0,n==='eyeR'?-E.x:E.x);_pq.setFromEuler(_pe);b[n].quaternion.copy(q0).multiply(_pq);}
 if(U.npc&&b.head&&typeof P!=='undefined'&&P&&typeof R3!=='undefined'&&R3&&R3.player&&R3.player!==o){const wp=o.getWorldPosition(new THREE.Vector3()),pp=R3.player.position,dx=pp.x-wp.x,dz=pp.z-wp.z,dd=Math.hypot(dx,dz);
  let want=0;if(dd<3.2&&dd>.2){const fy=o.rotation.y;let a=Math.atan2(dx,dz)-fy;while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;if(Math.abs(a)<1.9)want=Math.max(-.75,Math.min(.75,a));}
  U.look+=(want-U.look)*(1-Math.exp(-dt*4));if(Math.abs(U.look)>.002){_pe.set(0,U.look*.6*PILOT.lookSign,0);_pq.setFromEuler(_pe);b.head.quaternion.multiply(_pq);if(b.neck){_pe.set(0,U.look*.35*PILOT.lookSign,0);_pq.setFromEuler(_pe);b.neck.quaternion.multiply(_pq);}}}}
// Figur/Terra: Tempo aus der Bewegung in der Welt → Idle/Gehen/Joggen/Rennen gewichtet. Figuren: gemeinsame Gangphase (Clip-Zeit gesetzt, kein Gleiten),
// Pilot: Abspieltempo = Tempo/Schrittlänge. Einmal-Clips (winken/jubeln/werfen) blenden die Schleifen aus.
function pilotTick(o,dt,opt){const U=o.userData;if(!U||!U.pilot)return;opt=opt||{};dt=Math.max(0,Math.min(.1,dt||.016));const F=PILOT.fix[U.pilot]||{},A=U.acts;
 const p=o.getWorldPosition(new THREE.Vector3());let v=0;if(U.lp&&dt>0){const dx=p.x-U.lp.x,dz=p.z-U.lp.z;v=Math.hypot(dx,dz)/dt;if(v>30)v=0;}U.lp=p;
 U.spd+=(v-U.spd)*(1-Math.exp(-dt*8));const ws=o.scale.x*U.sc,s=opt.moving===false&&U.spd<.05?0:U.spd;
 let oe=0;if(U.once){const a=A[U.once],d=a?a.getClip().duration:0,t=(performance.now()-U.onceT)/1000;if(!a||t>=d){if(a){a.stop();a.setEffectiveWeight(0);}U.once=null;}else{oe=Math.min(1,t/.15,(d-t)/.25);a.setEffectiveWeight(Math.max(0,oe));}}
 const k=1-Math.exp(-dt*10);
 if(U.fig&&A.jog){const M=FIG_MODELS[U.pilot],du={walk:A.walk.getClip().duration,jog:A.jog.getClip().duration,run:A.run.getClip().duration},
   vv={walk:M.s[0]/du.walk*ws,jog:M.s[1]/du.jog*ws,run:M.s[2]/du.run*ws},want={idle:0,walk:0,jog:0,run:0};
  if(s<.04)want.idle=1;else if(s<vv.walk*.85){const f=s/(vv.walk*.85);want.idle=1-f;want.walk=f;}else if(s<vv.jog){const f=Math.max(0,Math.min(1,(s-vv.walk*1.15)/(vv.jog-vv.walk*1.15)));want.walk=1-f;want.jog=f;}
  else if(s<vv.run){const f=(s-vv.jog)/(vv.run-vv.jog);want.jog=1-f;want.run=f;}else want.run=1;
  let str=0,wl=0;for(const n of['walk','jog','run']){U.w[n]+=(want[n]-U.w[n])*k;str+=U.w[n]*M.s[n==='walk'?0:n==='jog'?1:2]*ws;wl+=U.w[n];}U.w.idle+=(want.idle-U.w.idle)*k;
  str=wl>.01?str/wl:M.s[0]*ws;U.ph=(U.ph+dt*s/Math.max(.05,str))%1;
  for(const n of['walk','jog','run']){const a=A[n];a.setEffectiveTimeScale(0);a.time=U.ph*du[n];a.setEffectiveWeight(U.w[n]*(1-oe));}A.idle.setEffectiveWeight(U.w.idle*(1-oe));}
 else{const wv=(F.walk[0]/F.walk[1])*ws,rv=(F.run[0]/F.run[1])*ws;
  const tR=Math.max(0,Math.min(1,(s-wv*1.5)/(wv*.9))),tM=Math.max(0,Math.min(1,s/(wv*.3))),want={idle:1-tM,walk:tM*(1-tR),run:tM*tR};
  for(const n in want){U.w[n]+=(want[n]-U.w[n])*k;if(A[n])A[n].setEffectiveWeight(U.w[n]*(1-oe));}
  if(A.walk)A.walk.setEffectiveTimeScale(Math.max(.4,Math.min(2.6,s/Math.max(.01,wv))));if(A.run)A.run.setEffectiveTimeScale(Math.max(.6,Math.min(2.2,s/Math.max(.01,rv))));}
 U.mixer.update(dt);
 // Gespräch: Mund bewegt sich, solange der Dialogtext tippt
 U.talk=U.npc&&PILOT.talk&&PILOT.talk.n===U.npc&&typeof mode!=='undefined'&&mode==='dialog'&&typeof TW!=='undefined'&&TW&&TW.done&&!TW.done()?1:0;
 if(U.fig)pilotLookTick(o,U,dt);pilotFace(U,dt);
 if(U.lod&&typeof R3!=='undefined'&&R3){const c=R3.activeCam||R3.cam;if(c){const d=c.position.distanceTo(p),on=U.lodOn?d>PILOT.lodD-1:d>PILOT.lodD;if(on!==!!U.lodOn){U.lodOn=on?1:0;U.lod[0].visible=!on;U.lod[1].visible=on;}}}}
// Einmal-Clip über die Schleifen legen (Figuren: winken/jubeln/werfen; Pilot-Terra: attack/hit/joy)
function pilotOnce(o,n){const U=o&&o.userData,a=U&&U.acts&&U.acts[n];if(!a)return;a.reset();a.setEffectiveWeight(U.fig?0:1);if(!U.fig)a.fadeIn(.12);a.play();if(U.fig){U.once=n;U.onceT=performance.now();}}
// ---------- Zuordnung Figur → Modell ----------
let _figLookMap=null;function figIdByLook(L){if(!L||typeof FIGURES==='undefined')return null;if(!_figLookMap){_figLookMap=new Map();for(const id in FIGURES){const F=FIGURES[id];if(F&&F.look)_figLookMap.set(F.look,id);}}
 const id=_figLookMap.get(L);if(id)return id;for(const k in FIGURES){const F=FIGURES[k];if(F&&F.look&&F.look.hair===L.hair&&F.look.hairCol===L.hairCol&&F.look.top===L.top&&F.look.build===L.build)return k;}return null;}
function figModelFor(col,hat,oe){if(oe&&oe.body)return oe.body==='held'?'fig_noa':oe.body==='heldin'?'fig_heldin':null;
 if(oe&&oe.look){const id=figIdByLook(oe.look);return id&&FIG_BY_ID[id]||null;}
 if(oe)return null;if(col==='#e8623a'&&hat==='#1f8a7a')return null;// Platzhalter der Spielfigur vor dem Outfit
 if(col==='#6aa0e0')return 'fig_haendler';// Laden (02-world: t:'shop')
 let h=7;for(const ch of String(col))h=(h*31+ch.charCodeAt(0))>>>0;h=(h^(h>>>13))*2654435761>>>0;return FIG_BUERGER[h%FIG_BUERGER.length];}
function figMake(id,oe){const M=FIG_MODELS[id],o=pilotMake(id,M.h);if(!o)return null;const d=new THREE.Object3D(),d2=new THREE.Object3D();o.add(d);o.add(d2);o.userData.legs=[d,d2];o.userData.rig={pilot:1};
 o.userData.char={heads:M.H/(M.h>1.4?.24:.25),H:M.h,head:M.h/(M.h>1.4?7:5.75),hip:M.h*.5,k:1,build:'model',look:oe&&oe.look||null,model:id};return o;}
// Szene ersetzt nachträglich geladene Figuren (Modell kam nach dem Bau der Szene an)
function figSwapScene(){try{if(typeof R3==='undefined'||!R3||!R3.scene||!R3.scene.userData.npcs)return;const S=R3.scene;
 for(const e of S.userData.npcs){const a=e.o&&e.o.userData&&e.o.userData.p3;if(!a||e.o.userData.pilot)continue;const id=figModelFor(a[0],a[1],a[2]);if(!id||!pilotReady(id))continue;
  const o=figMake(id,a[2]);if(!o)continue;o.position.copy(e.o.position);o.rotation.copy(e.o.rotation);const ud=Object.assign({},e.o.userData);delete ud.rig;delete ud.legs;delete ud.char;delete ud.gait;delete ud.p3;
  Object.assign(o.userData,ud,{npc:e.n});if(e.o.parent)e.o.parent.remove(e.o);S.add(o);e.o=o;}}catch(err){console.warn('Figuren-Tausch',err);}}
// ---------- Anbindung (nur bei Schalter an) ----------
setTimeout(()=>{try{if(pilotOn()){{const hb=(typeof G!=='undefined'&&G&&G.outfit&&G.outfit.body==='heldin')?'fig_heldin':'fig_noa';pilotLoad(hb).then(g=>{if(g&&typeof R3!=='undefined'&&R3)R3.ofk=null;});}pilotLoad('funki');}}catch(e){}},0);
if(typeof person3d==='function'){const _person3d57=person3d;person3d=function(col,hat,oe){
 try{if(pilotOn()){const id=figModelFor(col,hat,oe);if(id){if(pilotReady(id)){const o=figMake(id,oe);if(o)return o;}
   else if(PILOT.st[id]!=='err')pilotLoad(id).then(g=>{if(!g)return;if(FIG_MODELS[id].held&&typeof R3!=='undefined'&&R3)R3.ofk=null;else figSwapScene();});}}}catch(e){console.warn('3D-Figur',e);}
 const o=_person3d57.apply(this,arguments);try{if(pilotOn()&&o&&o.userData)o.userData.p3=[col,hat,oe];}catch(e){}return o;};}
if(typeof build3d==='function'){const _build3d57=build3d;build3d=function(){const S=_build3d57.apply(this,arguments);try{if(pilotOn()&&S&&S.userData&&S.userData.npcs)for(const e of S.userData.npcs)if(e.o&&e.o.userData)e.o.userData.npc=e.n;}catch(err){}return S;};}
if(typeof talk==='function'){const _talk57=talk;talk=function(n){try{if(pilotOn()&&n){PILOT.talk={n,t:performance.now()};const o=figObjOf(n);if(o&&o.userData.fig&&(!n._gw||performance.now()-n._gw>60000)){n._gw=performance.now();pilotOnce(o,'winken');}}}catch(e){}return _talk57.apply(this,arguments);};}
function figObjOf(n){try{const S=R3&&R3.scene;if(!S||!S.userData.npcs)return null;for(const e of S.userData.npcs)if(e.n===n)return e.o;}catch(e){}return null;}
if(typeof setDlg==='function'){const _setDlg57=setDlg;setDlg=function(s){const r=_setDlg57.apply(this,arguments);try{if(pilotOn()&&PILOT.talk){const o=figObjOf(PILOT.talk.n);
  if(o&&o.userData.fig){const n=PILOT.talk.n;o.userData.expr=(n&&n.expr)||(typeof figExprFor==='function'?figExprFor(String(s)):'laechelnd')||'neutral';}}}catch(e){}return r;};}
if(typeof gaitTick==='function'){const _gaitTick57=gaitTick;gaitTick=function(o,dt,opt){if(o&&o.userData&&o.userData.pilot){pilotTick(o,dt,opt);return null;}return _gaitTick57.apply(this,arguments);};}
if(typeof figAnim==='function'){const _figAnim57=figAnim;figAnim=function(o,k){if(o&&o.userData&&o.userData.pilot){const U=o.userData;
  if(/wurf|werf|throw/i.test(k||'')){pilotOnce(o,'werfen');pilotExpr(o,'entschlossen');setTimeout(()=>{if(U.expr==='entschlossen')U.expr='neutral';},1400);}
  else if(/jubel|cheer|sieg/i.test(k||'')){pilotOnce(o,'jubeln');pilotExpr(o,'freudig');setTimeout(()=>{if(U.expr==='freudig')U.expr='neutral';},2200);}
  else if(/wink|gruss|hallo/i.test(k||''))pilotOnce(o,'winken');return;}return _figAnim57.apply(this,arguments);};}
if(typeof buildTerra==='function'){const _buildTerra57=buildTerra;buildTerra=function(id,h,opts){
 if(id===1&&pilotOn()){try{if(pilotReady('funki')){const key=h+'|'+!!(opts&&opts.shiny);let H=PILOT.hOld[key];if(H==null){const old=_buildTerra57.apply(this,arguments),b=new THREE.Box3().setFromObject(old);H=PILOT.hOld[key]=b.max.y-b.min.y;}
   const o=pilotMake('funki',H*1.0);if(o){o.userData.model=1;o.userData.act={};o.userData.baseH=H;return o;}}else pilotLoad('funki');}catch(e){console.warn('Pilot Funki',e);}}
 return _buildTerra57.apply(this,arguments);};}
if(typeof animModel==='function'){const _animModel57=animModel;animModel=function(o,t,st){const U=o&&o.userData;if(U&&U.pilot){st=st||{};const A=U.act||{},dt=U.lt==null?.016:Math.max(0,Math.min(.1,(t-U.lt)*.001));U.lt=t;
  if(A.atk&&A.atk!==U.atk0){U.atk0=A.atk;pilotOnce(o,'attack');}if(A.hit&&A.hit!==U.hit0){U.hit0=A.hit;pilotOnce(o,'hit');}if(A.hop&&A.hop!==U.hop0){U.hop0=A.hop;pilotOnce(o,'joy');}
  if(U.exT&&performance.now()<U.exT.until)U.expr=U.exT.e==='freudig'?'froh':U.exT.e;else if(U.expr==='froh'&&!(U.exT&&performance.now()<U.exT.until))U.expr='neutral';
  if(!st.still)pilotTick(o,dt,{moving:!!st.moving});return;}return _animModel57.apply(this,arguments);};}
