// ===== VEYRA – Terra-Modelle (Serie, 12.11. ab 22:20): gebaute GLB-Terras in Welt UND Kampf – NUR hinter dem Schalter =====
// Schalter wie Pilot: SET.modelle3d (Standard aus) bzw. ?modelle3d=1. Aus ⇒ nichts wird geladen, keine Hooks aktiv, Spiel unverändert.
// An ⇒ lädt public/models/terras/t<NNN>.glb (Werkstatt: window.PILOT_SRC['t<NNN>'] als data-URI), Darstellung mit 56-toonpro;
// scheitert das Laden → bisheriges Prozedural/Bild. Ersetzt den Pilot-Funki (57) ohne doppeltes Laden.
// Hooks: buildTerra (Welt, Entwicklung), monRender (Kampf: Modell statt flachem Bild), animModel (Clips + Mimik + Sekundärbewegung),
// render3DBattle (Toon-Auflösung des Kampf-Renderers), loadMap (Vorladen der Arten des Gebiets). Dex/Team-Karten und Porträts bleiben unverändert.
// API: tmOn() · tmLoad(id)→Promise · tmReady(id) · tmMake(id,h,opts) · tmClip(o,name) · TMOD
const TMOD={ids:{1:'t001',2:'t002',3:'t003',4:'t004',5:'t005',6:'t006',7:'t007',8:'t008',9:'t009',59:'t059',61:'t061',112:'t112'},gltf:{},st:{},wait:{},ms:{},hOld:{},
 // Schrittlänge (Modellmaß) und Clip-Dauer (s) aus dem Bau (tools/modelle/terras/build/*.json) · glow = Leuchtstärke · fx = Leuchtpunkte (Knochen, Farbe, Größe)
 fix:{t001:{walk:[.11,.867],run:[.2,.5],glow:1.25,fx:[['fx_flamme','#ff9a30',.55],['fx_stirn','#ffc050',.16]]},
  t002:{walk:[.17,.867],run:[.32,.5],glow:1.35,fx:[['fx_flamme','#ff9a30',.65],['fx_kragen','#ff9030',.6]]},
  t003:{walk:[.26,.867],run:[.5,.5],glow:1.4,fx:[['fx_flamme','#ff9a30',.75],['fx_kragen','#ff8020',.85]]},
  t004:{walk:[.125,1],run:[.2,.6],glow:1.2,fx:[['fx_krone','#9fe8ff',.35]]},t005:{walk:[.155,1],run:[.248,.6],glow:1.2,fx:[['fx_krone','#9fe8ff',.4]]},
  t006:{walk:[.2,1],run:[.32,.6],glow:1.4,fx:[['fx_krone','#7ff6ff',.5]]},
  t007:{walk:[.09,.8],run:[.16,.5]},t008:{walk:[.12,.8],run:[.22,.5]},t009:{walk:[.3,.867],run:[.5,.5]},t112:{walk:[.07,.867],run:[.13,.5]},t059:{walk:[.06,.6],run:[.11,.4]},t061:{walk:[.165,1],run:[.275,.667],glow:1.3,fx:[['fx_laterne','#ffe070',.5],['fx_fuehlerL','#ffeaa0',.18],['fx_fuehlerR','#ffeaa0',.18]]}},
 tint:{1:'#9ad8ff',2:'#9ad8ff',3:'#9ad8ff',4:'#c8ffb0',5:'#c8ffb0',6:'#c8ffb0',7:'#ffd0f0',8:'#ffd0f0',9:'#ffd0f0',59:'#ffe0a0',61:'#b0ffe8',112:'#e8d0a0'},lodD:7};
const TM_EXPR={neutral:{},freudig:{Augen_froh:1,Maul_auf:.75},froh:{Augen_froh:1,Maul_auf:.75},wuetend:{Augen_wach:1,Maul_auf:.35},entschlossen:{Augen_wach:.7},
 verletzt:{Augen_muede:.7,Maul_weit:.35,Ohren_an:1},muede:{Augen_muede:1,Ohren_an:.5},ueberrascht:{Staunen:1,Maul_auf:.55},staunen:{Staunen:1,Maul_auf:.55},schlaf:{Blinzeln:1,Ohren_an:.4},traurig:{Augen_muede:.8,Ohren_an:1}};
try{if(typeof TOONPRO!=='undefined'&&!TOONPRO.variants.terra)TOONPRO.variants.terra={px:.7,dark:.09};}catch(e){}
function tmOn(){try{return typeof pilotOn==='function'?pilotOn():(SET.modelle3d===true||/[?&]modelle3d=1/.test(location.search));}catch(e){return false;}}
function tmKey(id){return TMOD.ids[id]||null;}
function tmSrc(k){const P=window.PILOT_SRC||{};return P[k]||('models/terras/'+k+'.glb');}
function tmReady(id){const k=tmKey(id);return!!(k&&TMOD.st[k]==='ok'&&TMOD.gltf[k]);}
function tmLoad(id){const k=typeof id==='string'?id:tmKey(id);if(!k)return Promise.resolve(null);if(TMOD.wait[k])return TMOD.wait[k];
 if(!window.THREE||typeof modelLoaders!=='function')return Promise.resolve(null);TMOD.st[k]='load';const t0=performance.now();
 return TMOD.wait[k]=modelLoaders().then(L=>new Promise((res,rej)=>L.load(tmSrc(k),res,undefined,rej))).then(g=>{TMOD.gltf[k]=g;TMOD.st[k]='ok';TMOD.ms[k]=Math.round(performance.now()-t0);tmRefresh(k);return g;})
  .catch(e=>{console.warn('Terra-Modell '+k+' nicht geladen – Rückfall Bild/prozedural:',e&&e.message||e);TMOD.st[k]='err';return null;});}
// Nach dem Laden: vorhandene Objekte dieser Art neu bauen lassen (Welt-Cache, Kampf)
function tmRefresh(k){try{const ids=Object.keys(TMOD.ids).filter(i=>TMOD.ids[i]===k).map(Number);
 const S=typeof R3!=='undefined'&&R3&&R3.scene,mm=S&&S.userData.mm;if(mm)for(const[r,o]of[...mm])if(ids.includes(r.s)&&!(o.userData&&o.userData.tm)){mm.delete(r);if(typeof monDrop==='function')monDrop(S,o);}
 if(typeof BT!=='undefined'&&BT){if(BT.fm&&ids.includes(BT.fm.s)&&BT.foe&&!BT.foe.userData.tm)BT.fm=null;if(BT.mm&&ids.includes(BT.mm.s)&&BT.me&&!BT.me.userData.tm)BT.mm=null;}}catch(e){}}
// Ein Satz Knochen-Namen wie im GLTFLoader (Punkte entfernt)
const tmBN=n=>THREE.PropertyBinding?THREE.PropertyBinding.sanitizeNodeName(n):n.replace(/[\[\]\.:\/]/g,'');
let TM_GLOWT=null;function tmGlowTex(){if(TM_GLOWT)return TM_GLOWT;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,1,32,32,31);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(.6,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return TM_GLOWT=new THREE.CanvasTexture(c);}
// Instanz: Klon mit Skelett, Toon-Pro + Umriss, Höhe h, Füße auf y=0, Mixer mit allen Clips, LOD-Netze, Leuchtpunkte
function tmMake(id,h,opts){opts=opts||{};const k=tmKey(id),g=TMOD.gltf[k];if(!g||!THREE.SkeletonUtils)return null;const F=TMOD.fix[k]||{};
 const root=new THREE.Group(),body=new THREE.Group(),inner=THREE.SkeletonUtils.clone(g.scene);root.add(body);body.add(inner);inner.rotation.y=Math.PI;
 toonProApply(inner,{outline:opts.outline||'terra',mat:Object.assign({glow:F.glow||1.4},opts.mat||{})});
 const lod0=[],lod1=[],mats=[];inner.traverse(m=>{if(m.isMesh&&!m.userData.outline){(/LOD1/.test(m.name)?lod1:lod0).push(m);if(m.material&&m.material.uniforms)mats.push(m.material);}});
 lod1.forEach(m=>m.visible=false);
 if(opts.shiny&&TMOD.tint[id])mats.forEach(m=>{if(!m.uniforms.uEye.value)m.uniforms.uTint.value.set(TMOD.tint[id]);});
 inner.updateMatrixWorld(true);const box=new THREE.Box3();for(const m of lod0){m.geometry.boundingBox||m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));}
 const sz=box.getSize(new THREE.Vector3()),sc=h/Math.max(.001,sz.y);body.scale.setScalar(sc);inner.position.y=-box.min.y;
 const mixer=new THREE.AnimationMixer(inner),acts={};for(const c of g.animations){const a=mixer.clipAction(c);a.enabled=true;a.setEffectiveWeight(0);a.play();acts[c.name]=a;}
 if(acts.idle)acts.idle.setEffectiveWeight(1);for(const n of['attack','hit','joy','catch','faint'])if(acts[n]){acts[n].setLoop(THREE.LoopOnce,1);acts[n].clampWhenFinished=true;acts[n].stop();}
 const faces=[];inner.traverse(m=>{if(m.isMesh&&m.morphTargetDictionary&&!m.userData.outline)faces.push(m);});
 const bones={};inner.traverse(b=>{if(b.isBone)bones[b.name]=b;});const B=n=>bones[tmBN(n)]||bones[n]||null;
 const tail=[1,2,3,4,5].map(i=>B('tail'+i)).filter(Boolean),ears=['ear1.L','ear1.R'].map(B).filter(Boolean);
 // Leuchtpunkte (additive Sprites an Effekt-Knochen; flackern zur Laufzeit)
 const fx=[];for(const[bn,col,size]of F.fx||[]){const b=B(bn);if(!b)continue;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tmGlowTex(),color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  sp.userData.s0=size*.42;sp.scale.setScalar(sp.userData.s0);sp.renderOrder=3;b.add(sp);fx.push(sp);}
 const U={tm:k,id,model:1,mixer,acts,faces,mats,lod0,lod1,lod:0,sc,h,baseH:h,body,inner,bones,B,tail,ears,fx,w:{idle:1,walk:0,run:0},spd:0,lp:null,
  blink:{next:performance.now()+1200+Math.random()*2000,t:-1,dbl:false},expr:'neutral',exW:{},act:{},face:{glow:1},once:null,spr:{x:0,v:0,y0:null,yaw:null},glow:F.glow||1.4,seed:Math.random()*9};
 root.userData=U;if(typeof blobShadow==='function')blobShadow(root,Math.max(.18,h*.42));return root;}
// Einmal-Clip über die Schleifen legen (attack/hit/joy/catch/faint)
function tmClip(o,n,fade){const U=o&&o.userData,a=U&&U.acts&&U.acts[n];if(!a)return;if(U.once&&U.once!==a)U.once.fadeOut(.15);a.reset();a.setEffectiveWeight(1);a.fadeIn(fade||.12);a.play();U.once=a;U.onceN=n;U.onceEnd=performance.now()+a.getClip().duration*1000;}
function tmFace(U,dt,sleep){const now=performance.now(),Bk=U.blink,tgt=Object.assign({},TM_EXPR[U.fe]||{});if(sleep)Object.assign(tgt,TM_EXPR.schlaf);
 if(Bk.t<0&&now>Bk.next){Bk.t=now;Bk.dbl=Math.random()<.2;}let bl=0;if(Bk.t>=0){const e=(now-Bk.t)/150;bl=e<1?Math.sin(e*Math.PI):0;if(e>=1){if(Bk.dbl){Bk.dbl=false;Bk.t=now+60;}else{Bk.t=-1;Bk.next=now+2000+Math.random()*4000;}}}
 const k=1-Math.exp(-dt*12);for(const m of U.faces){const D=m.morphTargetDictionary,I=m.morphTargetInfluences;for(const n in D){let v=U.exW[n]??0;v+=((tgt[n]||0)-v)*k;U.exW[n]=v;
  I[D[n]]=Math.min(1,n==='Blinzeln'?Math.max(v,bl*(1-(tgt.Augen_froh||0)*.7)):v);}}}
const TM_Q=new THREE.Quaternion(),TM_E=new THREE.Euler();
function tmAdd(b,x,y,z){if(!b)return;TM_E.set(x,y,z);TM_Q.setFromEuler(TM_E);b.quaternion.multiply(TM_Q);}
// Bewegung + Mimik + Kampf-Reaktionen + Sekundärbewegung je Bild
function tmAnim(o,t,st){const U=o.userData;st=st||{};const now=performance.now(),A=U.act||(U.act={}),Ac=U.acts,F=TMOD.fix[U.tm]||{};
 let dt=U.lt==null?.016:(t-U.lt)*.001;U.lt=t;dt=Math.max(0,Math.min(.1,dt));
 // Tempo aus der Weltbewegung → idle/walk/run weich gewichtet, Abspieltempo = Tempo/Schrittlänge (kein Gleiten)
 const p=o.getWorldPosition(new THREE.Vector3());let v=0;if(U.lp&&dt>0){v=Math.hypot(p.x-U.lp.x,p.z-U.lp.z)/dt;if(v>30)v=0;}U.lp=p;
 const yaw=o.rotation.y;let yr=0;if(U.spr.yaw!=null&&dt>0){let d=yaw-U.spr.yaw;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;yr=d/dt;}U.spr.yaw=yaw;
 U.spd+=(v-U.spd)*(1-Math.exp(-dt*8));const ws=o.scale.x*U.sc,wl=F.walk||[.4*U.h/ws,.87],rl=F.run||[.75*U.h/ws,.5],wv=wl[0]/wl[1]*ws,rv=rl[0]/rl[1]*ws;
 const s=st.moving===false&&U.spd<.05?0:U.spd,tR=Math.max(0,Math.min(1,(s-wv*1.6)/(wv*.9))),tM=Math.max(0,Math.min(1,s/(wv*.3))),want={idle:1-tM,walk:tM*(1-tR),run:tM*tR};
 const kw=1-Math.exp(-dt*10);for(const n in want){U.w[n]+=(want[n]-U.w[n])*kw;if(Ac[n])Ac[n].setEffectiveWeight(U.w[n]*(U.once&&now<U.onceEnd-150?.15:1));}
 if(Ac.walk)Ac.walk.setEffectiveTimeScale(Math.max(.4,Math.min(2.6,s/Math.max(.01,wv))));if(Ac.run)Ac.run.setEffectiveTimeScale(Math.max(.6,Math.min(2.2,s/Math.max(.01,rv))));
 // Kampf-/Weltereignisse → Clips
 if(A.atk&&A.atk!==U.atk0){U.atk0=A.atk;tmClip(o,'attack');}
 if(A.hit&&A.hit!==U.hit0){U.hit0=A.hit;tmClip(o,'hit',.06);}
 if(A.hop&&A.hop!==U.hop0){U.hop0=A.hop;tmClip(o,'joy');}
 if(A.catch&&A.catch!==U.ca0){U.ca0=A.catch;tmClip(o,'catch',.08);}
 if(A.ko&&!U.ko0){U.ko0=A.ko;tmClip(o,'faint',.15);}else if(!A.ko&&U.ko0){U.ko0=0;if(U.onceN==='faint'){U.once.fadeOut(.3);U.once=null;}}
 const pose=st.pose||null;if(pose!==U.pose0){U.pose0=pose;if(pose==='sleep'){tmClip(o,'faint',.4);U.onceEnd=Infinity;}else if(U.onceN==='faint'&&!A.ko){U.once&&U.once.fadeOut(.4);U.once=null;}}
 if(U.once&&now>U.onceEnd+60&&U.onceN!=='faint'){U.once.fadeOut(.2);U.once=null;}
 const fe=U.exT&&now<U.exT.until?U.exT.e:(U.expr||'neutral');U.fe=fe;
 if(st.still){tmFace(U,dt,false);return;}U.mixer.update(dt);
 // Zusatz nach dem Mixer: Blick, Grasen/Schnuppern, Feder-Nachschwingen von Rute und Ohren, Atmen
 const head=U.B('head'),neck=U.B('neck1');
 if(pose==='graze'||pose==='sniff'){const k=pose==='graze'?1:.55;tmAdd(neck,.45*k,0,0);tmAdd(head,.35*k+.08*Math.sin(now*.004)*k,0,0);}
 else if(st.lookAt&&head&&!A.ko){const lx=st.lookAt.x-p.x,lz=st.lookAt.z-p.z;let a=Math.atan2(-lx,-lz)-yaw;while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;
  const tgt=Math.max(-.7,Math.min(.7,a));U.look=(U.look||0)+(tgt-(U.look||0))*(1-Math.exp(-dt*5));tmAdd(neck,0,U.look*.35,0);tmAdd(head,0,U.look*.55,-U.look*.12);}
 else U.look=(U.look||0)*.9;
 const Sp=U.spr,kSp=60,dSp=9;Sp.v+=(-yr*.06-Sp.x*kSp-Sp.v*dSp)*dt;Sp.x+=Sp.v*dt;Sp.x=Math.max(-.5,Math.min(.5,Sp.x));
 U.tail.forEach((b,i)=>tmAdd(b,0,0,Sp.x*(.4+.3*i)));const bob=Math.sin(now*.0021+U.seed);const eb={verletzt:1,muede:.5,traurig:1,wuetend:.35}[fe]||(pose==='sleep'?.6:0);U.eb=(U.eb||0)+(eb-(U.eb||0))*(1-Math.exp(-dt*8));U.ears.forEach((b,i)=>tmAdd(b,Sp.x*.3*(i?-1:1)+.03*bob*(pose==='sleep'?0:1)+.7*U.eb,0,0));
 if(pose==='hide'){tmAdd(neck,.3,0,0);tmAdd(head,.2,0,0);U.ears.forEach(b=>tmAdd(b,.5,0,0));}
 // Fangen: Einsaugen (weiß + schrumpfen), Befreien (Ploppen) · Treffer-Blitz · Leuchten flackert
 let cs=1,py=0,fl=0;
 if(A.catch&&now>A.catch){const k=Math.min(1,(now-A.catch)/380),e=k*k*(3-2*k);cs=1-e;py=e*.3*U.h;fl=Math.min(1,k*3);}
 if(A.pop){const k=(now-A.pop)/450;if(k<1){cs=k<.5?(k/.5)*1.15:1.15-.15*(k-.5)/.5;fl=Math.max(fl,1-k);}else{A.pop=0;}}
 if(A.hit){const th=(now-A.hit)/480;if(th>=0&&th<1)fl=Math.max(fl,(1-th)*(1-th)*.6);}
 if(fe==='freudig'&&!st.still&&!U.once)py+=Math.max(0,Math.sin(now*.0075))*.02*U.h;
 U.body.scale.setScalar(U.sc*cs);U.body.position.y=py;
 const fk=.82+.18*Math.sin(now*.019+U.seed)*Math.sin(now*.007),gl=U.glow*fk;for(const m of U.mats){m.uniforms.uFlash.value=fl*.8;if(!m.uniforms.uEye.value)m.uniforms.uGlow.value=gl;}
 const night=typeof isNight==='function'&&isNight();U.fx.forEach((sp,i)=>{const f2=.85+.25*Math.sin(now*.023+i*2.1)*Math.sin(now*.011+i);sp.scale.setScalar(sp.userData.s0*f2*(night?1.35:1));sp.material.opacity=night?1:.8;});
 // LOD: ab TMOD.lodD Weltmaß zur Kamera halbe Dreiecke, ohne Umriss
 if(st.cam){const d=st.cam.position.distanceTo(p),l=d>TMOD.lodD*(U.lod?.9:1)?1:0;if(l!==U.lod&&U.lod1.length){U.lod=l;U.lod0.forEach(m=>{m.visible=!l||/Augen/.test(m.name);});U.lod1.forEach(m=>m.visible=!!l);}}
 tmFace(U,dt,pose==='sleep'||(A.ko&&now-A.ko>600));}
// ---------- Anbindung (greift nur bei Schalter an) ----------
// Pilot-Funki (57) abgelöst: kein zweites Laden von models/pilot/funki.glb, solange die Serie Funki liefert
try{if(typeof PILOT!=='undefined'&&TMOD.ids[1]){PILOT.wait.funki=Promise.resolve(null);PILOT.st.funki='serie';}}catch(e){}
if(typeof buildTerra==='function'){const _buildTerra58=buildTerra;buildTerra=function(id,h,opts){
 try{if(tmOn()&&tmKey(id)&&!(typeof TA_HQ!=='undefined'&&TA_HQ)&&!(opts&&opts.pose==='hero')){if(tmReady(id)){const key=id+'|'+h;let H=TMOD.hOld[key];
   if(H==null){const old=_buildTerra58.apply(this,arguments),b=new THREE.Box3().setFromObject(old);H=TMOD.hOld[key]=b.max.y-b.min.y;}
   const o=tmMake(id,H,opts);if(o)return o;}else tmLoad(id);}}catch(e){console.warn('Terra-Modell',id,e);}
 return _buildTerra58.apply(this,arguments);};}
// Kampf: Modell statt flachem Bild (Kette monObj → buildMon3D → buildTerra → Modell), sobald geladen
if(typeof monRender==='function'){const _monRender58=monRender;monRender=function(id){try{if(tmOn()&&tmKey(id)){if(tmReady(id)&&typeof terraOf==='function'&&terraOf(id))return'proc';tmLoad(id);}}catch(e){}return _monRender58.apply(this,arguments);};}
if(typeof animModel==='function'){const _animModel58=animModel;animModel=function(o,t,st){if(o&&o.userData&&o.userData.tm)return tmAnim(o,t,st);return _animModel58.apply(this,arguments);};}
if(typeof render3DBattle==='function'){const _r3b58=render3DBattle;render3DBattle=function(){let sync=false;try{if(tmOn()&&BT&&BT.r&&typeof toonProSync==='function'){toonProSync(BT.r);sync=true;}}catch(e){}
 try{return _r3b58.apply(this,arguments);}finally{if(sync)try{if(typeof R3!=='undefined'&&R3&&R3.r)toonProSync(R3.r);}catch(e){}}};}
// Vorladen: Team + Arten des aktuellen Gebiets (nach jedem Kartenwechsel)
function tmPreload(){if(!tmOn())return;try{const ids=new Set();(G&&G.team||[]).forEach(m=>ids.add(m.s));const e=cur&&cur.enc;if(e)[...(e.day||[]),...(e.night||[])].forEach(x=>ids.add(x[0]));
 for(const i of ids)if(tmKey(i))tmLoad(i);}catch(e){}}
if(typeof loadMap==='function'){const _loadMap58=loadMap;loadMap=function(){const r=_loadMap58.apply(this,arguments);try{setTimeout(tmPreload,50);}catch(e){}return r;};}
setTimeout(()=>{try{tmPreload();}catch(e){}},0);

// ---------- Kampfarena (nur mit Schalter): weiches Gras wie in der Welt statt Kegel-Halmen, runde Steine statt Kristall-Kieseln, Kampfkreis + Pfad ----------
function tmArenaBlade(){if(typeof W3GEO!=='undefined'&&W3GEO.blade5b)return W3GEO.blade5b;if(TMOD.blade)return TMOD.blade;
 const pos=[],col=[],nor=[];for(let b=0;b<5;b++){const a=b*1.26+.3,ox=Math.cos(a)*.06,oz=Math.sin(a)*.06,ca=Math.cos(a+1.4),sa=Math.sin(a+1.4),hh=[.42,.34,.4,.3,.37][b];
  const ring=[0,.5,1].map(t=>{const w=.03*Math.pow(1-t,.8)+.002,bz=t*t*.1;return[[ox-ca*w+Math.cos(a)*bz,t*hh,oz-sa*w+Math.sin(a)*bz],[ox+ca*w+Math.cos(a)*bz,t*hh,oz+sa*w+Math.sin(a)*bz],.55+t*.6];});
  for(let i=0;i<ring.length-1;i++){const A=ring[i],B=ring[i+1];[[A[0],A[2]],[A[1],A[2]],[B[0],B[2]],[A[1],A[2]],[B[1],B[2]],[B[0],B[2]]].forEach(([v,c])=>{pos.push(...v);col.push(c,c,c*.9);nor.push(0,1,0);});}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return TMOD.blade=g;}
function tmArena(){if(!BT||BT.tmArena)return;BT.tmArena=1;const s=BT.s,P1=[2.4,-2.7],P2=[-2.2,1.6];
 let rs=12345;const rn=()=>(rs=(rs*16807)%2147483647)/2147483647;
 // Gras: viele Büschel, dicht um die Arena, frei auf den Plattformen und dem Pfad dazwischen
 const pts=[];const segD=(x,z)=>{const ax=P2[0]-P1[0],az=P2[1]-P1[1],t=Math.max(0,Math.min(1,((x-P1[0])*ax+(z-P1[1])*az)/(ax*ax+az*az)));return Math.hypot(x-(P1[0]+ax*t),z-(P1[1]+az*t));};
 for(let i=0;i<5200&&pts.length<1400;i++){const a=rn()*Math.PI*2,r=1.2+Math.pow(rn(),.7)*12,x=Math.cos(a)*r*.9,z=Math.sin(a)*r-.5;const dm=Math.min(Math.hypot(x-P1[0],z-P1[1]),Math.hypot(x-P2[0],z-P2[1]));if(dm<1.9||segD(x,z)<1.0)continue;pts.push([x,z,(.55+rn()*.5)*Math.min(1,.55+(dm-1.9)*.25),rn()*6.3]);}
 let mat;try{mat=typeof toonFx==='function'?toonFx(new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,gradientMap:toonGrad()}),{grass:1,rim:false,nf:1}):null;}catch(e){mat=null;}
 mat=mat||new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,gradientMap:toonGrad()});
 const gm=new THREE.InstancedMesh(tmArenaBlade(),mat,pts.length),d=new THREE.Object3D(),c=new THREE.Color('#ffffff');
 pts.forEach(([x,z,k,a],i)=>{d.position.set(x,0,z);d.rotation.set(0,a,0);d.scale.set(k*1.5,k*1.05,k*1.5);d.updateMatrix();gm.setMatrixAt(i,d.matrix);gm.setColorAt(i,c);});
 gm.receiveShadow=true;gm.castShadow=false;s.remove(BT.tuftM);s.add(gm);BT.tuftM=gm;
 // Blumen: weiche, flache Blüten statt Ikosaeder; Steine: runde, flache Kiesel
 BT.flM.geometry=new THREE.SphereGeometry(.07,8,5);BT.flM.geometry.scale(1,.45,1);BT.flM.castShadow=false;
 BT.rockM.geometry=new THREE.SphereGeometry(1,16,10);BT.rockM.geometry.scale(1,.75,1);
 // Kampfkreis + Pfad als weicher Bodenaufkleber
 const cv=document.createElement('canvas');cv.width=cv.height=512;const x=cv.getContext('2d');const toU=(wx,wz)=>[256+wx*28,256+wz*28];
 x.lineCap='round';x.strokeStyle='rgba(120,92,60,.32)';x.lineWidth=46;x.beginPath();x.moveTo(...toU(...P1));x.lineTo(...toU(...P2));x.stroke();
 x.strokeStyle='rgba(150,118,80,.25)';x.lineWidth=28;x.beginPath();x.moveTo(...toU(...P1));x.lineTo(...toU(...P2));x.stroke();
 for(const P of[P1,P2]){const[u,v]=toU(...P),g=x.createRadialGradient(u,v,30,u,v,58);g.addColorStop(0,'rgba(120,92,60,0)');g.addColorStop(.7,'rgba(110,86,56,.28)');g.addColorStop(1,'rgba(110,86,56,0)');x.fillStyle=g;x.beginPath();x.arc(u,v,60,0,7);x.fill();
  x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=3;x.setLineDash([10,9]);x.beginPath();x.arc(u,v,44,0,7);x.stroke();x.setLineDash([]);}
 const tex=new THREE.CanvasTexture(cv),dm=new THREE.Mesh(new THREE.PlaneGeometry(512/28,512/28),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
 dm.rotation.x=-Math.PI/2;dm.position.set(0,.012,0);dm.renderOrder=1;s.add(dm);BT.tmDecal=dm;
 BT.th=null;}  // Thema neu anwenden (Farben je Instanz)
if(typeof battle3d==='function'){const _b3d58=battle3d;battle3d=function(){const r=_b3d58.apply(this,arguments);try{if(r&&tmOn()&&BT&&!BT.tmArena)tmArena();}catch(e){console.warn('Arena',e);}return r;};}
