// ===== VEYRA – Pilot 3D-Modelle (12.11.): gebaute GLB-Modelle für Held Noa und Terra 001 Funki – NUR hinter dem Schalter =====
// Schalter: SET.modelle3d (Standard false/aus; zum Testen auch ?modelle3d=1). Aus ⇒ das Spiel bleibt unverändert (keine Ladevorgänge, keine Hooks aktiv).
// An ⇒ lädt public/models/pilot/<id>.glb (Draco, three r128 GLTFLoader aus 38-models), Darstellung mit 56-toonpro; scheitert das Laden → bisheriges Prozedural.
// Eingriffe (nur bei Schalter an und geladenem Modell): person3d (nur Spielerfigur 'held'), buildTerra (nur Art 1), gaitTick/figAnim (Pilot-Figur), animModel (Pilot-Terra).
// API: pilotOn() · pilotLoad(k)→Promise · pilotMake(k,h,opts)→Group|null · pilotExpr(o,name) · pilotTick(o,dt,opt) · PILOT_EXPR
// window.PILOT_SRC (optional, z. B. Werkstatt-Build: data-URIs aus spiel/models/pilot/*.js) ersetzt die Pfade
const PILOT={src:Object.assign({noa:'models/pilot/noa.glb',funki:'models/pilot/funki.glb'},window.PILOT_SRC||{}),gltf:{},st:{},wait:{},
 // ry: Drehung, damit das Modell wie die bisherigen Objekte schaut · walk/run: Schrittlänge (Modellmaß) je Clip-Durchlauf und Dauer (s)
 fix:{noa:{ry:Math.PI,walk:[.9,1],run:[1.7,.667]},funki:{ry:Math.PI,walk:[.42,.8],run:[.8,.5]}},outline:'duenn',hOld:{}};
const PILOT_EXPR={neutral:{},laecheln:{Laecheln:1,Mund_A:.3,Augen_froh:.25},freudig:{Laecheln:1,Mund_A:.45,Augen_froh:.35},staunen:{Staunen:1,Mund_O:.85},
 ueberrascht:{Staunen:1,Mund_O:.85},blinzeln:{Blinzeln_L:1,Blinzeln_R:1},aerger:{Aerger:1},entschlossen:{Aerger:.6,Laecheln:.2},traurig:{Traurig:1},
 maul:{Maul_auf:1},froh:{Augen_froh:1,Maul_auf:.5}};
function pilotOn(){try{return SET.modelle3d===true||/[?&]modelle3d=1/.test(location.search);}catch(e){return false;}}
function pilotLoad(k){if(PILOT.wait[k])return PILOT.wait[k];if(!window.THREE||typeof modelLoaders!=='function')return Promise.resolve(null);PILOT.st[k]='load';
 const t0=performance.now();
 return PILOT.wait[k]=modelLoaders().then(L=>new Promise((res,rej)=>L.load(PILOT.src[k],res,undefined,rej))).then(g=>{PILOT.gltf[k]=g;PILOT.st[k]='ok';PILOT['ms_'+k]=Math.round(performance.now()-t0);return g;})
  .catch(e=>{console.warn('Pilot-Modell '+k+' nicht geladen – Rückfall prozedural:',e&&e.message||e);PILOT.st[k]='err';return null;});}
function pilotReady(k){return PILOT.st[k]==='ok'&&!!PILOT.gltf[k];}
// Instanz: Klon mit Skelett, Toon-Pro + Umriss, auf Zielhöhe h, Füße auf y=0, Mixer mit allen Clips
function pilotMake(k,h,opts){opts=opts||{};const g=PILOT.gltf[k];if(!g||!THREE.SkeletonUtils)return null;const F=PILOT.fix[k]||{};
 const root=new THREE.Group(),body=new THREE.Group(),inner=THREE.SkeletonUtils.clone(g.scene);root.add(body);body.add(inner);inner.rotation.y=F.ry||0;
 toonProApply(inner,{outline:opts.outline||PILOT.outline,mat:opts.mat});
 inner.updateMatrixWorld(true);const box=new THREE.Box3();inner.traverse(m=>{if(m.isMesh&&!m.userData.outline){m.geometry.boundingBox||m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));}});
 const sz=box.getSize(new THREE.Vector3()),sc=h/Math.max(.001,sz.y);body.scale.setScalar(sc);inner.position.y=-box.min.y;
 const mixer=new THREE.AnimationMixer(inner),acts={};for(const c of g.animations){const a=mixer.clipAction(c);a.enabled=true;a.setEffectiveWeight(0);a.play();acts[c.name]=a;}
 if(acts.idle)acts.idle.setEffectiveWeight(1);for(const n of['attack','hit','joy'])if(acts[n]){acts[n].setLoop(THREE.LoopOnce,1);acts[n].clampWhenFinished=false;acts[n].stop();}
 const faces=[];inner.traverse(m=>{if(m.isMesh&&m.morphTargetDictionary&&!m.userData.outline)faces.push(m);});
 const U={pilot:k,mixer,acts,faces,sc,h,w:{idle:1,walk:0,run:0},spd:0,lp:null,blink:{next:performance.now()+1500,t:-1,dbl:false},expr:'neutral',exW:{},ph:{walk:0,run:0},body,inner};
 root.userData=U;if(typeof blobShadow==='function')blobShadow(root,k==='noa'?.28:.3);return root;}
// Ausdruck (weich überblendet in pilotFace); Blinzeln läuft immer zusätzlich (2–6 s, 150 ms, manchmal doppelt)
function pilotExpr(o,name){if(o&&o.userData.pilot)o.userData.expr=name||'neutral';}
function pilotFace(U,dt){const now=performance.now(),B=U.blink,tgt=Object.assign({},PILOT_EXPR[U.expr]||{});
 if(B.t<0&&now>B.next){B.t=now;B.dbl=Math.random()<.2;}let bl=0;if(B.t>=0){const e=(now-B.t)/150;bl=e<1?Math.sin(e*Math.PI):0;if(e>=1){if(B.dbl){B.dbl=false;B.t=now+60;}else{B.t=-1;B.next=now+2000+Math.random()*4000;}}}
 const k=1-Math.exp(-dt*12);for(const m of U.faces){const D=m.morphTargetDictionary,I=m.morphTargetInfluences;for(const n in D){const want=(tgt[n]||0);let v=U.exW[n]??0;v+=(want-v)*k;U.exW[n]=v;
  I[D[n]]=Math.min(1,n.startsWith('Blinzeln')?Math.max(v,bl*(1-(tgt.Augen_froh||0)*.6)):v);}}}
// Figur/Terra: Tempo aus der Bewegung in der Welt → Idle/Gehen/Rennen gewichtet, Abspieltempo passt zur Schrittlänge (kein Gleiten)
function pilotTick(o,dt,opt){const U=o.userData;if(!U||!U.pilot)return;opt=opt||{};dt=Math.max(0,Math.min(.1,dt||.016));const F=PILOT.fix[U.pilot]||{},A=U.acts;
 const p=o.getWorldPosition(new THREE.Vector3());let v=0;if(U.lp&&dt>0){const dx=p.x-U.lp.x,dz=p.z-U.lp.z;v=Math.hypot(dx,dz)/dt;if(v>30)v=0;}U.lp=p;
 U.spd+=(v-U.spd)*(1-Math.exp(-dt*8));const ws=o.scale.x*U.sc,wv=(F.walk[0]/F.walk[1])*ws,rv=(F.run[0]/F.run[1])*ws,s=opt.moving===false&&U.spd<.05?0:U.spd;
 const tR=Math.max(0,Math.min(1,(s-wv*1.5)/(wv*.9))),tM=Math.max(0,Math.min(1,s/(wv*.3))),want={idle:1-tM,walk:tM*(1-tR),run:tM*tR};
 const k=1-Math.exp(-dt*10);for(const n in want){U.w[n]+=(want[n]-U.w[n])*k;if(A[n])A[n].setEffectiveWeight(U.w[n]);}
 if(A.walk)A.walk.setEffectiveTimeScale(Math.max(.4,Math.min(2.6,s/Math.max(.01,wv))));if(A.run)A.run.setEffectiveTimeScale(Math.max(.6,Math.min(2.2,s/Math.max(.01,rv))));
 U.mixer.update(dt);pilotFace(U,dt);}
// Einmal-Clip (attack/hit/joy) über die Schleifen legen
function pilotOnce(o,n){const U=o&&o.userData,a=U&&U.acts&&U.acts[n];if(!a)return;a.reset();a.setEffectiveWeight(1);a.fadeIn(.12);a.play();}
// ---------- Anbindung (nur bei Schalter an) ----------
setTimeout(()=>{try{if(pilotOn()){pilotLoad('noa').then(g=>{if(g&&typeof R3!=='undefined'&&R3)R3.ofk=null;});pilotLoad('funki');}}catch(e){}},0);
if(typeof person3d==='function'){const _person3d57=person3d;person3d=function(col,hat,oe){
 try{if(pilotOn()&&oe&&oe.body==='held'){if(pilotReady('noa')){const h=(typeof CHAR_BUILD!=='undefined'&&CHAR_BUILD.kind?CHAR_BUILD.kind.wH:1.32),o=pilotMake('noa',h);
   if(o){const d=new THREE.Object3D();o.add(d);const d2=new THREE.Object3D();o.add(d2);o.userData.legs=[d,d2];o.userData.rig={pilot:1};o.userData.char={heads:5.3,H:h,head:h/5.3,hip:h*.48,k:1,build:'kind',look:oe.look||null};return o;}}
  else pilotLoad('noa');}}catch(e){console.warn('Pilot Noa',e);}
 return _person3d57.apply(this,arguments);};}
if(typeof gaitTick==='function'){const _gaitTick57=gaitTick;gaitTick=function(o,dt,opt){if(o&&o.userData&&o.userData.pilot){pilotTick(o,dt,opt);return null;}return _gaitTick57.apply(this,arguments);};}
if(typeof figAnim==='function'){const _figAnim57=figAnim;figAnim=function(o,k){if(o&&o.userData&&o.userData.pilot){if(/jubel|cheer|sieg/i.test(k||''))pilotExpr(o,'freudig');return;}return _figAnim57.apply(this,arguments);};}
if(typeof buildTerra==='function'){const _buildTerra57=buildTerra;buildTerra=function(id,h,opts){
 if(id===1&&pilotOn()){try{if(pilotReady('funki')){const key=h+'|'+!!(opts&&opts.shiny);let H=PILOT.hOld[key];if(H==null){const old=_buildTerra57.apply(this,arguments),b=new THREE.Box3().setFromObject(old);H=PILOT.hOld[key]=b.max.y-b.min.y;}
   const o=pilotMake('funki',H*1.0);if(o){o.userData.model=1;o.userData.act={};o.userData.baseH=H;return o;}}else pilotLoad('funki');}catch(e){console.warn('Pilot Funki',e);}}
 return _buildTerra57.apply(this,arguments);};}
if(typeof animModel==='function'){const _animModel57=animModel;animModel=function(o,t,st){const U=o&&o.userData;if(U&&U.pilot){st=st||{};const A=U.act||{},dt=U.lt==null?.016:Math.max(0,Math.min(.1,(t-U.lt)*.001));U.lt=t;
  if(A.atk&&A.atk!==U.atk0){U.atk0=A.atk;pilotOnce(o,'attack');}if(A.hit&&A.hit!==U.hit0){U.hit0=A.hit;pilotOnce(o,'hit');}if(A.hop&&A.hop!==U.hop0){U.hop0=A.hop;pilotOnce(o,'joy');}
  if(U.exT&&performance.now()<U.exT.until)U.expr=U.exT.e==='freudig'?'froh':U.exT.e;else if(U.expr==='froh'&&!(U.exT&&performance.now()<U.exT.until))U.expr='neutral';
  if(!st.still)pilotTick(o,dt,{moving:!!st.moving});return;}return _animModel57.apply(this,arguments);};}
