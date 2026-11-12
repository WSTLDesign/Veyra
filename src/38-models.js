// ===== VEYRA – GLB-Modelle (Loop A2): public/models/<Kanon-Nr.>_<name>.glb → Kreatur in Welt, Kampf und 3D-Ansicht =====
// Aktiv mit window.MON_RENDER='model' (Kette model → sprite → proc). Quelle: window.MODEL_SRC[id] (build.mjs: App 'models/…', Artifact data-URI bei kleinen Dateien).
// Loader = three r128 examples/js (global THREE): lokal vendor/loaders|utils|libs (App) bzw. CDN (Artifact: cdnjs r128/examples, Ausweichpfad jsDelivr three@0.128.0).
// Sie werden erst nachgeladen, wenn ein Modell gebraucht wird. Ohne GLB passiert nichts (Fallback Sprite/prozedural).
// API: hasModel(id) · modelReady(id) · loadModel(id)→Promise · getModelOverride(id,{h,opts})→Object3D|null (lädt bei Bedarf) · animModel(o,t,st) · MODEL_FIX[id]={ry,y,s}
const MODEL={src:window.MODEL_SRC||{},st:{},gltf:{},wait:{},lp:null,loader:null};
const MODEL_FIX={};// Korrekturen je Modell: ry Drehung (Standard π: glTF schaut nach +Z, Kreaturen nach −Z), y Bodenversatz, s Zusatzskalierung
function hasModel(id){return!!MODEL.src[id]&&MODEL.st[id]!=='err';}
function modelReady(id){return MODEL.st[id]==='ok'&&!!MODEL.gltf[id];}
function modelBases(){const b=window.VENDOR_JS;return Array.isArray(b)&&b.length?b:['vendor/'];}
function modelScript(path){const bases=modelBases();return new Promise((res,rej)=>{let i=0;const next=()=>{if(i>=bases.length)return rej(new Error('Loader fehlt: '+path));const s=document.createElement('script');s.src=bases[i++]+path;s.async=true;
  s.onload=()=>res(bases[i-1]);s.onerror=()=>{s.remove();next();};document.head.appendChild(s);};next();});}
function modelLoaders(){if(MODEL.lp)return MODEL.lp;return MODEL.lp=(async()=>{let base=null;
 if(!THREE.GLTFLoader)base=await modelScript('loaders/GLTFLoader.js');
 if(!THREE.DRACOLoader)try{base=await modelScript('loaders/DRACOLoader.js')||base;}catch(e){}
 if(!THREE.SkeletonUtils)try{await modelScript('utils/SkeletonUtils.js');}catch(e){}
 const L=new THREE.GLTFLoader();if(THREE.DRACOLoader)try{const d=new THREE.DRACOLoader();d.setDecoderPath((base||modelBases()[0])+'libs/draco/gltf/');L.setDRACOLoader(d);}catch(e){}
 return MODEL.loader=L;})();}
function loadModel(id){if(MODEL.wait[id])return MODEL.wait[id];const src=MODEL.src[id];if(!src||!window.THREE)return Promise.resolve(null);MODEL.st[id]='load';
 return MODEL.wait[id]=modelLoaders().then(L=>new Promise((res,rej)=>L.load(src,res,undefined,rej))).then(g=>{MODEL.gltf[id]=g;MODEL.st[id]='ok';return g;})
  .catch(e=>{console.warn('GLB-Modell '+id+' nicht geladen:',e&&e.message||e);MODEL.st[id]='err';return null;});}
function getModelOverride(id,o){o=o||{};if(!window.THREE||!hasModel(id))return null;if(!modelReady(id)){loadModel(id);return null;}
 try{return modelPrep(id,MODEL.gltf[id],o.h||1,o.opts||{});}catch(e){console.warn('GLB-Modell '+id+':',e);MODEL.st[id]='err';return null;}}
// Umriss-Hülle (Rückseiten, entlang der Normalen, Breite im Weltmaß unabhängig von der Skalierung; auch für Skinning)
const MOL={};function modelOl(skin,col){const k=(skin?'s':'m')+col;if(MOL[k])return MOL[k];const m=new THREE.MeshBasicMaterial({color:col,side:THREE.BackSide,skinning:!!skin});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{float sc=length(modelMatrix[0].xyz);transformed+=normalize(normal)*.014/max(sc,.0001);}');};m.customProgramCacheKey=()=>'mol'+k;return MOL[k]=m;}
// Aufbereiten: klonen (mit Skelett), Toon-Material (2 Stufen) + Umriss, Glanz-Tönung, Skalierung auf Zielhöhe, auf den Boden setzen, Animationen
function modelPrep(id,g,h,opts){const F=MODEL_FIX[id]||{},M=MONS[id],root=new THREE.Group(),body=new THREE.Group(),inner=THREE.SkeletonUtils?THREE.SkeletonUtils.clone(g.scene):g.scene.clone(true);
 root.add(body);body.add(inner);inner.rotation.y=F.ry??Math.PI;
 const tint=opts.shiny&&M&&M.shinyCols?new THREE.Color('#ffffff').lerp(new THREE.Color(M.shinyCols[0]),.45):null,mats=[],ols=[],oc=M&&M.sp?mixC(shade(M.sp[1],.22),'#1a1420',.45):'#2b2433';
 const meshes=[];inner.traverse(m=>{if(m.isMesh)meshes.push(m);});meshes.forEach(m=>{const mk=x=>{x=x||{};const t=new THREE.MeshToonMaterial({color:x.color?x.color.clone():new THREE.Color('#ffffff'),map:x.map||null,gradientMap:monGrad(),skinning:!!m.isSkinnedMesh,
   vertexColors:!!(m.geometry&&m.geometry.attributes.color),transparent:!!x.transparent,opacity:x.opacity??1,alphaTest:x.alphaTest||0,side:x.side??THREE.FrontSide});
   if(x.emissive)t.emissive.copy(x.emissive);if(x.emissiveMap)t.emissiveMap=x.emissiveMap;if(tint)t.color.multiply(tint);t.userData.e0=t.emissive.clone();mats.push(t);return t;};
  m.material=Array.isArray(m.material)?m.material.map(mk):mk(m.material);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;
  const ol=m.isSkinnedMesh?new THREE.SkinnedMesh(m.geometry,modelOl(true,oc)):new THREE.Mesh(m.geometry,modelOl(false,oc));if(m.isSkinnedMesh)ol.bind(m.skeleton,m.bindMatrix);ol.userData.ol=1;ol.frustumCulled=false;m.add(ol);ols.push(ol);});
 inner.updateMatrixWorld(true);const box=new THREE.Box3();inner.traverse(m=>{if(m.isMesh&&!m.userData.ol){m.geometry.boundingBox||m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));}});
 const sz=box.getSize(new THREE.Vector3()),ct=box.getCenter(new THREE.Vector3()),k=h/Math.max(.001,sz.y)*(F.s||1);inner.position.set(-ct.x,-box.min.y+(F.y||0),-ct.z);body.scale.setScalar(k);
 const U={model:1,id,act:{},baseH:h,ols,lod1:[],lod2:[],fx:{},mats,seed:id*1.3,shiny:!!opts.shiny,body,inner,mixer:null,clips:{},cur:null};
 if(g.animations&&g.animations.length){U.mixer=new THREE.AnimationMixer(inner);const pick=re=>g.animations.find(c=>re.test(c.name));
  const C={idle:pick(/idle|stand|breath|ruhe/i)||g.animations[0],walk:pick(/walk|run|move|lauf/i),attack:pick(/attack|atk|bite|strike|angriff/i),hit:pick(/hit|hurt|damage|treffer/i)};
  for(const n in C)if(C[n])U.clips[n]=U.mixer.clipAction(C[n]);if(U.clips.attack){U.clips.attack.setLoop(THREE.LoopOnce,1);U.clips.attack.clampWhenFinished=false;}if(U.clips.hit){U.clips.hit.setLoop(THREE.LoopOnce,1);}
  if(U.clips.idle){U.clips.idle.play();U.cur='idle';}}
 if(opts.shiny){const n=10,pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));const pt=new THREE.Points(pg,new THREE.PointsMaterial({color:'#fff3b0',size:.11,map:typeof dotTex==='function'?dotTex():null,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));pt.frustumCulled=false;root.add(pt);U.fx.spark=pt;}
 root.userData=U;return root;}
// Animation: Mixer (Idle/Walk/Attack/Hit, weich überblendet); fehlende Clips → prozedurales Wippen/Hüpfen/Ausfallschritt; Treffer-Blitz, K.O., Fang
function animModel(o,t,st){const U=o.userData;st=st||{};const now=performance.now(),A=U.act,ph=t*.001,ez=k=>k<=0?0:k>=1?1:k*k*(3-2*k);let dt=U.lt==null?0:(t-U.lt)*.001;U.lt=t;dt=Math.max(0,Math.min(.1,dt));
 const C=U.clips,play=(n,f)=>{const a=C[n];if(!a||U.cur===n)return!!a;const b=C[U.cur];a.reset().play();if(b)a.crossFadeFrom(b,f||.25,false);U.cur=n;return true;};
 const wantMove=!!st.moving;if(A.atk&&A.atk!==U.atk0){U.atk0=A.atk;if(C.attack){C.attack.reset();play('attack',.12);U.oneT=now+C.attack.getClip().duration*1000;}}
 if(A.hit&&A.hit!==U.hit0){U.hit0=A.hit;if(C.hit){C.hit.reset();play('hit',.08);U.oneT=now+C.hit.getClip().duration*1000;}}
 if(!(U.oneT&&now<U.oneT))play(wantMove&&C.walk?'walk':'idle',.3);if(U.mixer&&!st.still)U.mixer.update(dt);
 const proc=!C.idle||(wantMove&&!C.walk),h=U.baseH,pxw=st.pxw||h*.006;let py=0,pz=0,rz=0,sy=1,cs=1,fl=0;
 if(proc&&!st.still){py+=(.5+.5*Math.sin(ph*2.1+U.seed))*Math.min(.008*h,1.5*pxw)*(wantMove?0:1);if(wantMove)py+=Math.abs(Math.sin(ph*11))*.05*h;}
 const ta=A.atk?(now-A.atk)/560:9;if(!C.attack&&ta>=0&&ta<1){const lu=ta<.3?0:ta<.5?ez((ta-.3)/.2):1-ez((ta-.5)/.5);pz-=lu*.45;}
 const th=A.hit?(now-A.hit)/480:9;if(th>=0&&th<1){const r=(1-th)*(1-th);fl=r*.75;if(!C.hit)pz+=Math.sin(Math.min(1,th*3)*Math.PI/2)*.25*(1-th);}
 if(A.ko){const e=ez(Math.min(1,(now-A.ko)/900));rz=1.3*e;py-=.05*h*e;}
 if(A.catch&&now>A.catch){const k=Math.min(1,(now-A.catch)/380),e=ez(k);cs=1-e;py+=e*.3;fl=Math.max(fl,Math.min(1,k*3));}
 if(A.pop){const k=(now-A.pop)/450;if(k<1){cs=k<.5?ez(k/.5)*1.15:1.15-.15*ez((k-.5)/.5);fl=Math.max(fl,1-k);}else A.pop=0;}
 if(A.hop){const k=(now-A.hop)/900;if(k<1)py+=Math.abs(Math.sin(k*Math.PI*2))*.16*h*(1-k*.4);else A.hop=0;}
 const fe=U.exT&&now<U.exT.until?U.exT.e:(U.expr||'neutral');if(fe==='freudig'&&!st.still)py+=Math.max(0,Math.sin(ph*7.5))*.03*h;
 const b=U.body,s0=b.userData.s0||(b.userData.s0=b.scale.x);b.position.set(0,py,pz);b.rotation.set(0,0,rz);b.scale.set(s0*cs,s0*sy*cs,s0*cs);
 U.mats.forEach(m=>{m.emissive.copy(m.userData.e0).addScalar(fl);});
 if(U.fx.spark){const pa=U.fx.spark.geometry.attributes.position,bu=U.sparkBurst&&now-U.sparkBurst<1800?1-(now-U.sparkBurst)/1800:0;for(let i=0;i<pa.count;i++){const a=ph*(.6+i*.07)+i*2.4,r=h*.4*(.55+.35*Math.sin(ph*.9+i)+bu*1.4);pa.setXYZ(i,Math.cos(a)*r,h*(.2+((i*.37+ph*.18)%1)*.85),Math.sin(a)*r);}pa.needsUpdate=true;}}
// Drehbare 3D-Ansicht (Dex/Team): mit GLB, sobald MON_RENDER='model' und das Modell geladen ist
viewer3d=(o=>function(id,size,opts){const v=o.apply(this,arguments);try{if(v&&window.MON_RENDER==='model'&&modelReady(id)&&VR&&VR.m&&!VR.m.userData.model){const g=getModelOverride(id,{h:1,opts:opts||{}});if(g){VR.s.remove(VR.m);VR.m=g;VR.s.add(g);}}}catch(e){}return v;})(viewer3d);
// Modelle der Team-Spitze früh laden (nur im Modell-Modus)
setTimeout(()=>{try{if(window.MON_RENDER==='model'&&typeof G!=='undefined'&&G&&G.team)G.team.forEach(m=>hasModel(m.s)&&loadModel(m.s));}catch(e){}},1500);

// ===== Figuren-Rig & Laufzyklus (Agent „Bewegung“) =====
// Spielfigur, NPC, Rivalen, Bewohner: EIN SkinnedMesh mit 14 Knochen + Umriss-Hülle = 2 Draw-Calls (vorher 4: zwei Beine, Körper, Umriss).
// gaitTick(o,dt,opt) – Bewegungsdynamik 12.11. (Neubau Boden-Gang): Phase wächst mit dem gelaufenen Weg (Doppelschritt S × Frequenz = Tempo → kein Gleiten);
// Standfuß in der Welt gepflanzt (Ferse → flach → Ballen), Schwungfuß auf einer Hermite-Bahn im Körperrahmen (Anfersen, Kniehub, leichtes Zurückziehen vor dem
// Aufsetzen); Gehen (Stand 60 %, Hüfte oben in der Standmitte) ↔ Laufen/Rennen (Flugphase, Einfedern, lange Schritte) weich über das Tempo überblendet;
// Becken dreht mit dem vorderen Bein, Schultern gegen, Arme gegengleich (Ellbogen ~90° beim Laufen), Vorneigung ab den Knöcheln (Becken + Wirbelsäule), Kopf hält
// Blick und Horizont und schaut in Kurven; Bremsen = Ausfallschritt + Einfedern; Kurvenneigung über o.rotation.z (17-move P.lean) mit IK-Ausgleich; Idle (Atmen,
// Gewichtsverlagerung, Umschauen), Posen sit|climb|air. Figuren sind prozedural (kein GLB): Hüfte/Knie/Fuß/Schulter/Ellbogen-Knochen werden direkt gesetzt.
// Geometrie: Teile [geo, farbe, matrix, knochen | (x,y,z)=>[i,j,w]] → eine Geometrie mit skinIndex/skinWeight (Farben als Vertexfarben)
// 5. Element (optional): Materialart für den Oberflächen-Shader (Charaktere: 0 glatt · 1 Haut · 2 Haar/Fell · 3 Leder/Holz · 4 Stoff · 5 Metall/Glas) → Attribut aKind
function rigMerge(parts){let n=0;const gs=parts.map(([g0,c,m,b,k])=>{const g=g0.index?g0.toNonIndexed():g0.clone();if(m)g.applyMatrix4(m);n+=g.attributes.position.count;return[g,new THREE.Color(c),b,k||0];});
 const P_=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3),SI=new Uint16Array(n*4),SW=new Float32Array(n*4),K=new Float32Array(n);let o=0;
 for(const[g,c,b,kd]of gs){const pa=g.attributes.position.array,cnt=g.attributes.position.count;P_.set(pa,o*3);N.set(g.attributes.normal.array,o*3);K.fill(kd,o,o+cnt);
  for(let i=0;i<cnt;i++){const j=o+i;C[j*3]=c.r;C[j*3+1]=c.g;C[j*3+2]=c.b;let r=typeof b==='function'?b(pa[i*3],pa[i*3+1],pa[i*3+2]):[b,b,0];SI[j*4]=r[0];SI[j*4+1]=r[1];SW[j*4]=1-r[2];SW[j*4+1]=r[2];}o+=cnt;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(P_,3));r.setAttribute('normal',new THREE.BufferAttribute(N,3));r.setAttribute('color',new THREE.BufferAttribute(C,3));r.setAttribute('aKind',new THREE.BufferAttribute(K,1));
 r.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));r.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));r.computeBoundingSphere();r.boundingSphere.radius*=1.15;return r;}
// ===== Charaktere „echt“ (Agent Charaktere 12.11.): Figurenbaukasten – realistische Proportionen im Cel-Look =====
// Beine (Rig-Einheiten) sind für alle Figuren gleich (Hüftgelenk 0,431, Oberschenkel 0,185, Unterschenkel 0,18, Knöchel 0,065) – der Gang rechnet nur damit.
// Körperbau (CHAR_BUILD) bestimmt Oberkörper, Kopf, Arme und den Weltmaßstab k (SkinnedMesh.scale) → Kind ≈ 5,3 Kopfhöhen, Erwachsene ≈ 7, ohne den Gang umzubauen.
// gaitTick rechnet mit sc = o.scale.x · rig.k (Füße bleiben in Weltkoordinaten gepflanzt). SX 0,09 → 0,062: Hüftgelenke anatomisch enger (Beine nicht mehr „gespreizt“).
const RIG={L1:.185,L2:.18,HA:.065,BALL:.07,HEEL:.06,SX:.062,AX:.225};
const RIG_P=[-1,0,1,2,1,4,5,1,7,8,2,10,2,12];// root hips spine head | thL shL ftL | thR shR ftR | arL faL arR faR
const gL=(a,b,t)=>a+(b-a)*t,gC=(x,a,b)=>x<a?a:x>b?b:x,gS=(a,b,x)=>{const t=gC((x-a)/(b-a),0,1);return t*t*(3-2*t);};
// heads Kopfhöhen · hipF Hüftgelenk/Gesamthöhe · wH Höhe in der Welt (1 Feld = 1) · Breiten (halbe) als Anteil der Höhe: sh Schultergelenk, ch/wa/hp Brust/Taille/Hüfte [breit, tief]
// arm [Oberarm, Unterarm, Hand] · th Oberschenkel-Radius · nk Hals-Radius (Anteil Kopfbreite) · hw Kopf Breite/Höhe · shD Schulter unter dem Kinn (Kopfhöhen) · stoop Rundrücken (rad)
const CHAR_BUILD={
 kind:{heads:5.3,hipF:.47,wH:1.32,sh:.1,ch:[.096,.07],wa:[.086,.064],hp:[.094,.07],arm:[.172,.142,.098],th:.052,nk:.3,hw:.8,shD:.3,eye:1.12},
 klein:{heads:4.8,hipF:.45,wH:1.1,sh:.098,ch:[.098,.074],wa:[.094,.072],hp:[.096,.074],arm:[.165,.135,.096],th:.054,nk:.3,hw:.82,shD:.26,eye:1.18},
 teen:{heads:6.2,hipF:.51,wH:1.52,sh:.104,ch:[.1,.07],wa:[.084,.06],hp:[.094,.068],arm:[.182,.145,.104],th:.05,nk:.3,hw:.77,shD:.42,eye:1.05},
 adult:{heads:7,hipF:.53,wH:1.66,sh:.108,ch:[.104,.074],wa:[.086,.064],hp:[.096,.07],arm:[.186,.146,.108],th:.05,nk:.32,hw:.74,shD:.5,eye:1},
 alt:{heads:6.6,hipF:.515,wH:1.55,sh:.104,ch:[.104,.078],wa:[.096,.074],hp:[.098,.074],arm:[.184,.145,.108],th:.048,nk:.32,hw:.76,shD:.44,eye:.96,stoop:.15},
 kraeftig:{heads:7,hipF:.53,wH:1.72,sh:.122,ch:[.126,.09],wa:[.112,.088],hp:[.106,.08],arm:[.186,.146,.11],th:.058,nk:.38,hw:.76,shD:.48,eye:.95}};
// Maße einer Figur (Rig-Einheiten) aus Körperbau + Geschlecht
function charDims(L){const B=CHAR_BUILD[L&&L.build]||CHAR_BUILD.adult,w=L&&L.sex==='w',H=.431/B.hipF,h=H/B.heads,hh=h/2,hw=hh*B.hw*(w?.97:1),hd=hh*.9,chin=H-h,hc=H-hh;
 const shY=chin-h*B.shD,sw=H*B.sh*(w?.9:1),D={B,w,H,h,hh,hw,hd,hc,chin,shY,sw,k:B.wH*(w&&B!==CHAR_BUILD.kind&&B!==CHAR_BUILD.klein?.95:1)/H,
  nkY:shY+.035*H,hdY:chin+.12*h,spY:.431+(shY-.431)*.42,elY:shY-B.arm[0]*H,wrY:shY-(B.arm[0]+B.arm[1])*H,hand:B.arm[2]*H,
  ch:[B.ch[0]*H*(w?.94:1),B.ch[1]*H],wa:[B.wa[0]*H*(w?.9:1),B.wa[1]*H*(w?.94:1)],hp:[B.hp[0]*H*(w?1.07:1),B.hp[1]*H],th:B.th*H*(w?1.04:1),eye:B.eye,stoop:B.stoop||0};
 D.ar=.032*H*(B===CHAR_BUILD.kraeftig?1.25:w?.88:1);return D;}
// ---------- Grundformen ----------
// Röhre aus Ringen [y, halbe Breite, halbe Tiefe, z-Versatz, x-Versatz] von oben nach unten; a=0 vorn (−z); o:{a0,a1 Bogen, top/bot Deckel, inv Innenseite}
function chTube(R,seg,o){o=o||{};const a0=o.a0||0,a1=o.a1??Math.PI*2,full=a1-a0>=Math.PI*2-1e-6,ns=full?seg:seg+1,P=[],I=[];
 for(const r of R)for(let j=0;j<ns;j++){const a=a0+(a1-a0)*j/seg;P.push((r[4]||0)+r[1]*Math.sin(a),r[0],(r[3]||0)-r[2]*Math.cos(a));}
 const n=R.length,q=(a,b,c)=>o.inv?I.push(a,c,b):I.push(a,b,c);
 for(let i=0;i<n-1;i++)for(let j=0;j<seg;j++){const j1=full?(j+1)%seg:j+1,A=i*ns+j,B=i*ns+j1,C=(i+1)*ns+j,D=(i+1)*ns+j1;q(A,B,C);q(B,D,C);}
 if(o.top&&full){const c=P.length/3,r=R[0];P.push(r[4]||0,r[0]+(+o.top||0),r[3]||0);for(let j=0;j<seg;j++)q(c,(j+1)%seg,j);}
 if(o.bot&&full){const c=P.length/3,r=R[n-1],b=(n-1)*ns;P.push(r[4]||0,r[0]-(+o.bot||0),r[3]||0);for(let j=0;j<seg;j++)q(c,b+j,b+(j+1)%seg);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g;}
// Verformte Kugel: fn(ux,uy,uz,x,y,z) → [x,y,z]
function chBlob(w,h,d,ws,hs,fn){const g=new THREE.SphereGeometry(1,ws||8,hs||6),p=g.attributes.position,v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);let x=v.x*w,y=v.y*h,z=v.z*d;if(fn){const r=fn(v.x,v.y,v.z,x,y,z);x=r[0];y=r[1];z=r[2];}p.setXYZ(i,x,y,z);}g.computeVertexNormals();return g;}
const chM=(x,y,z,sx,sy,sz,rx,ry,rz)=>w3M(x,y,z,sx,sy,sz,rx,ry,rz);
// wie chM, aber Drehreihenfolge Z·Y·X (erst um x kippen, dann schräg stellen)
const chMo=(x,y,z,sx,sy,sz,rx,ry,rz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'ZYX')),new THREE.Vector3(sx??1,sy??sx??1,sz??sx??1));
// Medaillen-Farben je Element (Plaketten am Helden, 53-charaktere)
const CHAR_EL_COL={flora:'#5fbf4a',flut:'#3a8ad8',boe:'#7fd6c8',frost:'#a8e4f6',glut:'#f0703a',fels:'#b08a5a',schatten:'#8a5ad8',lumen:'#ffd24a'};
// ---------- Figur bauen: Teile [geo, farbe, matrix, knochen|fn, umriss?] ----------
function charGeo(L){L=L||{};return g3('chr|'+JSON.stringify(L),()=>{const D=charDims(L),{H,hh,hw,hd,hc,chin,shY,sw,nkY,spY,elY,wrY}=D,P=[],O=[],TAU=Math.PI*2;
 let KD=1;const add=(g,c,m,b,ol)=>{P.push([g,c,m,b,KD]);if(ol)O.push([ol.isBufferGeometry?ol:g,c,m,b]);};// ol: true = gleiche Form im Umriss, Geometrie = gröbere Umriss-Form
 const addK=(k,...a)=>{const o=KD;KD=k;add(...a);KD=o;};// KD = Materialart (rigMerge)
 const tubeO=(R,seg,o)=>chTube(R,Math.max(5,Math.round(seg*.56)),o);// Umriss gröber (Dreiecke sparen)
 const sk=L.skin||'#f3cfae',hcol=L.hairCol||'#5a3a24',top=L.top||'#4c9a5c',top2=L.top2||'#f4efe2',trim=L.trim||shade(top,.72),legC=L.legCol||'#4a4a5a',boot=L.boots||'#4a3426';
 const coat=L.coat,coatC=L.coatCol||top,coatT=L.coatTrim||shade(coatC,.72),legs=L.legs||'hose',hats=Array.isArray(L.hat)?L.hat:L.hat?[L.hat]:[],acc=Array.isArray(L.acc)?L.acc:L.acc?[L.acc]:[];
 const longCoat=coat==='mantel'||coat==='kittel',kidB=D.B===CHAR_BUILD.kind||D.B===CHAR_BUILD.klein;
 // Gewichte
 const Wt=(x,y)=>[1,2,gS(spY-.03,spY+.05,y)],Wn=(x,y)=>[2,3,gS(nkY+.005,D.hdY,y)],
  Wa=s=>{const u=s<0?10:12,f=u+1;return(x,y)=>y>shY-.015?[2,u,gS(shY+.05,shY-.005,y)]:[u,f,gS(elY+.025,elY-.02,y)];},
  Wl=s=>{const t=s<0?4:7,h=t+1,f=t+2;return(x,y)=>y>.4?[1,t,gS(.475,.4,y)]:y>.2?[t,h,gS(.272,.218,y)]:[h,f,gS(.11,.075,y)];},
  Wsk=(x,y)=>y>spY-.03?Wt(x,y):[1,x<0?4:7,.62*gS(.45,.27,y)*gS(.004,.045,Math.abs(x))];
 // ---- Kopf: Schädel mit schmalerem Kiefer, Kinn, Hinterkopf
 const headFn=(ux,uy,uz)=>{const jaw=gS(-.05,-.92,uy);let X=ux*hw*(1-.25*jaw),Y=uy*hh,Z=uz*hd;if(uz>0)Z*=1+.07*(1-jaw);else{Z*=1-.06*gS(-.3,.5,uy);Z-=.05*hd*gS(-.45,-.95,uy)*gS(.4,.95,-uz);}
  if(uy>.55)X*=1-.06*gS(.55,1,uy);return[X,Y+hc,Z];};
 const surf=(ux,uy)=>headFn(ux,uy,-Math.sqrt(Math.max(0,1-ux*ux-uy*uy)));
 add(chBlob(1,1,1,14,11,(ux,uy,uz)=>headFn(ux,uy,uz)),sk,null,3,chBlob(1,1,1,10,7,(ux,uy,uz)=>headFn(ux,uy,uz)));
 // Hals
 add(chTube([[D.hdY+.01,hw*D.B.nk,hw*D.B.nk*1.05,hd*.08],[nkY-.012,hw*D.B.nk*1.12,hw*D.B.nk*1.12]],8),sk,null,Wn);
 // ---- Gesicht (Formen, kein Umriss)
 KD=0;
 const ex=.225*hw*D.eye,ey=ex*.7,eyY=hc-hh*(kidB?.12:.04),eX=hw*.355,eyeC=L.eye||'#5a4a3a',lid='#2b1f22',sexW=D.w;
 for(const s of[-1,1]){const p=surf(s*eX/hw,(eyY-hc)/hh),z=p[2]+ex*.28;
  add(chBlob(ex,ey,ex*.45,8,5),'#fbfaf6',chM(s*eX,eyY,z),3);// Augapfel
  add(chBlob(ey*.86,ey*.86,ey*.25,8,4),eyeC,chM(s*eX,eyY-ey*.05,z-ex*.4),3);// Iris
  add(chBlob(ey*.38,ey*.38,ey*.12,5,3),'#151018',chM(s*eX,eyY-ey*.05,z-ex*.53),3);// Pupille
  add(chBlob(ey*.17,ey*.17,ey*.08,4,3),'#ffffff',chM(s*eX-ey*.26,eyY+ey*.24,z-ex*.6),3);// Glanzpunkt
  add(new THREE.TorusGeometry(ex*1.02,ey*(sexW?.2:.16),3,9,Math.PI),lid,chM(s*eX,eyY-ey*.08,z-ex*.5,1,ey/ex*1.25,1,0,0,s*.07),3);// Oberlid
  add(chBlob(ex*.28,ey*(sexW?.16:.12),ey*.1,5,3),lid,chM(s*(eX+ex*1.02),eyY+ey*.12,z-ex*.38,1,1,1,0,s*.3,s*.35),3);// Lidschwung außen
  add(new THREE.TorusGeometry(ex*.92,ey*.05,2,6,Math.PI),shade(sk,.78),chM(s*eX,eyY+ey*.05,z-ex*.45,1,ey/ex*1.1,1,0,0,Math.PI+s*.05),3);// Unterlid
  const bp=surf(s*eX*.98/hw,(eyY+ey*2.1-hc)/hh);add(chBlob(ex*1.05,ey*.2,ey*.25,5,3),L.browCol||shade(hcol,.7),chM(s*eX*.98,eyY+ey*2.15,bp[2]-ey*.08,1,1,1,0,s*.12,s*-.1),3);// Braue
  const ep=headFn(s*.97,(eyY-hh*.22-hc)/hh,.12);addK(1,chBlob(hw*.065,hh*.27,hd*.16,6,5),shade(sk,.9),chM(ep[0]+s*hw*.015,ep[1],ep[2]+hd*.05,1,1,1,0,s*.18,0),3);// Ohr
  if(kidB||L.face==='sommersprossen'){const cp=surf(s*.47,(eyY-hh*.3-hc)/hh);addK(1,chBlob(ex*.75,ey*.45,ey*.15,5,3),figMix(sk,'#f39a8a',.22),chM(s*hw*.47,eyY-hh*.3,cp[2]+ey*.12),3);}}
 const nY=eyY-hh*(kidB?.3:.36),np=surf(0,(nY-hc)/hh);addK(1,chBlob(hw*.075,hh*.17,hd*.1,5,5),shade(sk,.97),chM(0,nY+hh*.06,np[2]+hd*.02,1,1,1,-.3,0,0),3);// Nase
 addK(1,chBlob(hw*.1,hh*.06,hd*.08,5,3),shade(sk,.95),chM(0,nY-hh*.06,np[2]-hd*.035),3);// Nasenspitze
 const mY=nY-hh*(kidB?.24:.28),mp=surf(0,(mY-hc)/hh);add(new THREE.TorusGeometry(hw*.17,hh*.028,3,7,Math.PI),sexW?'#c0605e':figMix(sk,'#8a3a32',.6),chM(0,mY+hh*.07,mp[2]-hd*.005,1,.55,1,0,0,Math.PI),3);// Mund (Lächeln)
 const fc=Array.isArray(L.face)?L.face:L.face?[L.face]:[];
 if(fc.includes('sommersprossen'))for(let i=0;i<6;i++){const s=i<3?-1:1,j=i%3,ux=s*(.3+j*.09),uy=(eyY-hh*.24-hc)/hh-(j%2)*.06,p=surf(ux,uy);add(chBlob(hh*.014,hh*.014,hh*.006,4,2),shade(sk,.72),chM(p[0],p[1],p[2]-.001),3);}
 if(fc.includes('narbe')){const p=surf(.4,(eyY-hh*.05-hc)/hh);addK(1,chBlob(hh*.012,hh*.14,hh*.01,4,4),shade(sk,.78),chM(p[0],p[1],p[2]-.002,1,1,1,0,0,.25),3);}
 if(fc.includes('ohrringe'))for(const s of[-1,1]){const p=headFn(s*.98,(eyY-hh*.5-hc)/hh,.12);addK(5,chBlob(hh*.04,hh*.04,hh*.04,6,4),'#e6c35c',chM(p[0]+s*hw*.04,p[1],p[2]),3);}
 if(L.glasses==='rund'){KD=5;for(const s of[-1,1]){const p=surf(s*eX/hw,(eyY-hc)/hh);add(new THREE.TorusGeometry(ex*1.3,ex*.12,3,9),'#3a3036',chM(s*eX,eyY,p[2]-ex*.25),3);}
  add(new THREE.CylinderGeometry(ex*.1,ex*.1,eX*2-ex*2.6,4),'#3a3036',chM(0,eyY+ex*.2,surf(0,(eyY-hc)/hh)[2]-ex*.35,1,1,1,0,0,Math.PI/2),3);}
 KD=2;
 // ---- Haare: Kappe mit Haaransatz (θ-Grenze je Richtung), Volumen, Pony-Strähnen; Zusatzformen je Frisur
 const hair=L.hair||'kurz',hcap=hats.includes('cap')||hats.includes('kapuze')||hats.includes('federhut');
 const cap=(o,col,bone,ol,lo)=>{const U=lo?4:o.U||6,V=lo?13:o.V||18,Pp=[],I=[];for(let i=0;i<=U;i++)for(let j=0;j<V;j++){const ph=j/V*TAU,c=Math.cos(ph),u=Math.max(.04,i/U);
   let tm=c>=0?gL(o.ts,o.tf,c*c):gL(o.ts,o.tb,c*c);if(o.fr&&c>.15)tm+=o.fr*gS(.15,.85,c)*(.5+.5*Math.cos(ph*(o.frN||9)));
   const th=u*tm,r=1+(o.th-1)*(1-Math.pow(u,o.pw||2.4))+(o.edge??.025)+(o.bump?o.bump(ph,th,u):0),dx=Math.sin(th)*Math.sin(ph),dy=Math.cos(th),dz=-Math.sin(th)*c,q=headFn(dx*r,dy*r,dz*r);Pp.push(q[0],q[1],q[2]);}
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){const j1=(j+1)%V,A=i*V+j,B=i*V+j1,C=(i+1)*V+j,Dd=(i+1)*V+j1;I.push(A,B,C,B,Dd,C);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));g.setIndex(I);g.computeVertexNormals();if(lo)return g;add(g,col,null,bone||3,ol!==false?cap(o,col,bone,ol,1):0);};
 const nz=(a,b)=>Math.sin(a*3.1+b*5.3)*Math.sin(a*1.7-b*4.1);
 const HS={kurz:{tf:.95,ts:1.42,tb:1.95,th:1.07},wuschel:{tf:1.0,ts:1.5,tb:2.0,th:1.16,fr:.22,frN:7,bump:(p,t)=>.045*nz(p,t)},schopf:{tf:.9,ts:1.4,tb:1.9,th:1.08},
  stachel:{tf:1.0,ts:1.45,tb:1.95,th:1.1,fr:.14,frN:6},wild:{tf:1.0,ts:1.55,tb:2.05,th:1.14,fr:.2,frN:5,bump:(p,t)=>.05*nz(p,t)},glatt:{tf:1.05,ts:1.9,tb:2.2,th:1.08,fr:.08,frN:4},
  lang:{tf:1.08,ts:2.05,tb:2.3,th:1.09,fr:.1,frN:5},pferd:{tf:1.05,ts:1.62,tb:2.0,th:1.05,fr:.1,frN:6},zopf:{tf:1.05,ts:1.62,tb:2.0,th:1.05,fr:.08,frN:6},geflochten:{tf:1.0,ts:1.6,tb:2.0,th:1.05},
  dutt:{tf:.98,ts:1.62,tb:2.0,th:1.05},wolke:{tf:1.25,ts:1.55,tb:2.05,th:1.12,bump:(p,t)=>.07*Math.max(0,Math.sin(t*2.2))+.03*nz(p,t)}}[hair]||{tf:.95,ts:1.42,tb:1.95,th:1.07};
 if(!hats.includes('kapuze'))cap(hcap?Object.assign({},HS,{th:Math.min(HS.th,1.06),fr:0,bump:null}):HS,hcol);
 const back=(a,b)=>headFn(0,a,b);
 if(!hcap&&(hair==='stachel'||hair==='wild'||hair==='schopf')){const N=hair==='schopf'?3:hair==='wild'?9:8;for(let i=0;i<N;i++){const th=hair==='schopf'?.15+i*.12:.25+(i%3)*.42,ph=hair==='schopf'?(i-1)*.5:Math.PI+(i-N/2)*.55+(i%2)*.2,dv=new THREE.Vector3(Math.sin(th)*Math.sin(ph),Math.cos(th),-Math.sin(th)*Math.cos(ph)).normalize();
  const q=headFn(dv.x*1.05,dv.y*1.05,dv.z*1.05),len=hh*(hair==='schopf'?.35:hair==='wild'?.55:.5),m=new THREE.Matrix4().compose(new THREE.Vector3(q[0]+dv.x*len*.4,q[1]+dv.y*len*.4,q[2]+dv.z*len*.4),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dv),new THREE.Vector3(1,1,1));
  add(new THREE.ConeGeometry(hw*.22,len*(hair==='stachel'?.78:1),6),hcol,m,3,1);}
  if(L.hairHi)for(const s of[-1,1]){const q=headFn(s*.32,.62,-.72);add(chBlob(hw*.07,hh*.32,hw*.05,5,4),L.hairHi,chM(q[0],q[1]-hh*.05,q[2]-hd*.08,1,1,1,-.4,0,s*.25),3);}}
 if(!hcap&&(hair==='lang'||hair==='glatt'&&D.w)){const yb=hair==='lang'?shY-.06*H:chin-.01;add(chTube([[hc+hh*.2,hw*.95,hd*.6,hd*.55],[hc-hh*.4,hw*1.02,hd*.62,hd*.5],[yb,hw*.9,hd*.35,hd*.72]],10,{a0:Math.PI/2-.2,a1:Math.PI*1.5+.2,bot:.001}),hcol,null,(x,y)=>[3,2,gS(chin,yb,y)],1);
  add(chTube([[hc+hh*.2,hw*.93,hd*.58,hd*.55],[hc-hh*.4,hw*1.0,hd*.6,hd*.5],[yb,hw*.88,hd*.33,hd*.72]],10,{a0:Math.PI/2-.2,a1:Math.PI*1.5+.2,inv:1}),shade(hcol,.7),null,(x,y)=>[3,2,gS(chin,yb,y)]);}
 if((hair==='pferd'||hair==='zopf'||hair==='geflochten')&&!hats.includes('kapuze')){const b0=back(.35,.94),len=hair==='pferd'?.95*hh*2:1.1*hh*2,ty=b0[1]-len;
  add(chBlob(hw*.2,hw*.2,hw*.2,8,6),L.tieCol||shade(hcol,.6),chM(0,b0[1],b0[2]+hd*.08),3);
  if(hair==='geflochten')for(let i=0;i<5;i++)add(chBlob(hw*.17*(1-i*.07),hh*.2,hw*.15,7,4),i%2?shade(hcol,.9):hcol,chM(0,b0[1]-hh*.22-i*hh*.32,b0[2]+hd*.18+i*.004),(x,y)=>[3,2,gS(chin,ty,y)],1);
  else add(chTube([[b0[1]+hh*.05,hw*.18,hw*.2,b0[2]+hd*.12],[b0[1]-len*.3,hw*.27,hw*.24,b0[2]+hd*.3],[b0[1]-len*.75,hw*.18,hw*.17,b0[2]+hd*.34],[ty,hw*.03,hw*.03,b0[2]+hd*.3]],8,{top:.001}),hcol,null,(x,y)=>[3,2,gS(chin,ty,y)*.7],1);}
 if(hair==='dutt'){const b=back(.62,.78);add(chBlob(hw*.36,hw*.32,hw*.34,10,8,(ux,uy,uz,x,y,z)=>[x,y,z+.012*nz(ux*3,uy*3)]),hcol,chM(0,b[1]+hh*.08,b[2]),3,1);}
 if(hair==='wolke'&&!hcap)for(const s of[-1,1])add(chBlob(hw*.32,hh*.36,hd*.5,6,5,(ux,uy,uz,x,y,z)=>[x,y+.006*nz(ux*4,uz*4),z]),hcol,chM(s*hw*.85,hc-hh*.02,hd*.25),3,1);
 // Bärte
 const bc=L.beardCol||hcol;
 if(L.beard==='vollbart'||L.beard==='kurzbart'){const t=L.beard==='vollbart'?1.12:1.05;add(chBlob(1,1,1,10,7,(ux,uy,uz)=>{const inB=uy<-.1&&uz<.35;const r=inB?t+(L.beard==='vollbart'?.1*gS(-.4,-1,uy):0):.9;const q=headFn(ux*r,uy*r-(inB&&L.beard==='vollbart'?.08*gS(-.6,-1,uy):0),uz*r);return q;}),bc,null,3);}
 if(L.beard==='kinnbart'){const p=surf(0,-.86);add(chBlob(hw*.24,hh*.2,hd*.16,8,6),bc,chM(0,p[1]-hh*.04,p[2]+hd*.08),3,1);}
 if(L.beard==='schnurr'||L.beard==='kinnbart'||L.beard==='vollbart')for(const s of[-1,1]){const p=surf(s*.12,(nY-hh*.15-hc)/hh);add(chBlob(hw*.17,hh*.055,hd*.07,6,4),bc,chM(s*hw*.13,p[1],p[2]-hd*.02,1,1,1,0,0,s*.25),3);}
 // ---- Kopfbedeckungen
 KD=4;
 const hatC=L.hatCol||'#3d8fe0';
 if(hats.includes('cap')){cap({tf:.92,ts:1.32,tb:1.5,th:1.13,edge:.03,pw:3,U:5,V:20},hatC);const p=surf(0,.42);add(chBlob(hw*.82,hh*.035,hd*.55,12,4,(ux,uy,uz,x,y,z)=>[x,y,z>0?z*.2:z]),L.brimCol||shade(hatC,.8),chM(0,p[1]-hh*.02,p[2]+hd*.1,1,1,1,.22,0,0),3,1);
  if(L.capSym){const q=surf(0,.62);addK(0,new THREE.CylinderGeometry(hh*.11,hh*.11,hh*.02,10),L.capSymBg||'#ffffff',chM(0,q[1],q[2]-hd*.1,1,1,1,Math.PI/2-.45,0,0),3);}}
 if(hats.includes('kapuze')){cap({tf:.88,ts:2.0,tb:2.55,th:1.2,edge:.04,pw:3,U:7,V:22},L.hoodCol||coatC);}
 if(hats.includes('federhut')){add(chTube([[hc+hh*1.25,hw*.82,hd*.8],[hc+hh*.6,hw*1.08,hd*1.0]],12,{top:.001}),hatC,null,3,1);add(chBlob(hw*1.75,hh*.05,hd*1.6,14,4),shade(hatC,.85),chM(0,hc+hh*.6,0,1,1,1,-.08,0,0),3,1);
  addK(2,chBlob(hw*.12,hh*.6,hw*.03,6,6),L.featherCol||'#4cb85c',chM(hw*.85,hc+hh*1.15,hd*.3,1,1,1,-.3,0,-.5),3);}
 if(hats.includes('brille')){const y=hc+hh*.42;addK(3,new THREE.TorusGeometry(1,.055,3,16),'#3a3030',chM(0,y,hd*.06,hw*1.06,hd*1.06,hw,Math.PI/2+.12,0,0),3);for(const s of[-1,1]){const p=surf(s*.33,.42);addK(5,new THREE.CylinderGeometry(hh*.16,hh*.17,hh*.13,10),L.gogCol||'#57c2dc',chM(s*hw*.33,p[1],p[2]-hh*.05,1,1,1,Math.PI/2-.35,0,0),3,1);}}
 if(hats.includes('stirnreif')){addK(5,new THREE.TorusGeometry(1,.07,4,20),L.circCol||'#e6c35c',chM(0,hc+hh*.38,hd*.05,hw*1.06,hd*1.06,hw,Math.PI/2+.15,0,0),3);const p=surf(0,.4);addK(5,new THREE.OctahedronGeometry(hh*.09),hatC,chM(0,p[1],p[2]-hh*.05),3);}
 for(const k of['blume','muschel','feder','mondsichel','sonnenkristall','blattschmuck'])if(hats.includes(k)){const p=headFn(.72,.55,-.1);addK(5,k==='sonnenkristall'||k==='mondsichel'?new THREE.OctahedronGeometry(hh*.14):chBlob(hh*.13,hh*.13,hh*.07,8,6),L.flowerCol||hatC,chM(p[0],p[1]+hh*.04,p[2]),3);}
 KD=4;
 // ---- Rumpf-Kleidung: Ringe [y, w, d] von Hals bis Saum
 const tuck=!!L.belt||legs==='rock'&&!kidB,hemY=tuck?spY-.015:.442-(kidB?.004:.012),cw=D.ch[0],cd=D.ch[1],ww=D.wa[0],wd=D.wa[1],hpw=D.hp[0],hpd=D.hp[1],nr=hw*D.B.nk;
 const torso=(e,yb,fl)=>{const R=[[nkY+.012,nr*1.18+e,nr*1.2+e],[nkY-.004,nr*1.5+e,nr*1.45+e],[shY+.03,sw*.6+e,cd*.72+e],[shY+.021,sw*.84+e,cd*.8+e],[shY+.008,sw+.01+e,cd*.86+e],[shY-.012,sw+.016+e,cd*.9+e],[shY-.05*H,cw+e,cd+e,D.w&&!kidB?-.006:0],[spY+.04,(cw+ww)/2+e,(cd+wd)/2+e],[spY,ww+e,wd+e]];
  if(yb<spY-.005){const t=gC((spY-yb)/(spY-.43),0,1.4);R.push([Math.max(yb,spY-.03),gL(ww,hpw,.4)+e,gL(wd,hpd,.4)+e]);if(yb<spY-.035)R.push([yb,gL(ww,hpw,Math.min(1,t))*(fl||1)+e,gL(wd,hpd,Math.min(1,t))*(fl||1)+e]);}
  return R;};
 const shirt=torso(0,hemY),open=!L.closed&&!longCoat&&L.top2,shellE=.006;
 if(open){add(chTube(torso(-.002,hemY+.004).slice(0,7),6,{top:.001,a0:-.6,a1:.6}),top2,null,Wt,0);add(chTube(torso(-.002,hemY+.004).slice(6),6,{a0:-.6,a1:.6}),top2,null,Wt,0);const jt=torso(shellE,hemY-.006);add(chTube(jt,12,{a0:.4,a1:TAU-.4}),top,null,Wt,tubeO(jt,12,{a0:.4,a1:TAU-.4}));add(chTube(torso(shellE-.003,hemY-.006),6,{a0:.4,a1:TAU-.4,inv:1}),shade(top,.6),null,Wt);
  for(const s of[-1,1])add(chTube(torso(shellE+.002,hemY-.006).slice(2),3,{a0:s<0?TAU-.46:.34,a1:s<0?TAU-.34:.46}),trim,null,Wt,0);}
 else{const sg=longCoat?9:12;add(chTube(shirt,sg,{top:.001}),top,null,Wt,longCoat?0:tubeO(shirt,sg,{top:.001}));if(!longCoat)add(chTube(torso(.002,hemY).slice(4),2,{a0:-.05,a1:.05}),shade(top,.82),null,Wt);}
 // Saum + Falten (Bänder, leicht dunkler)
 {const r=open?torso(shellE,hemY-.006):shirt,l=r[r.length-1];add(chTube([[l[0]+.012,l[1]+.004,l[2]+.004],[l[0],l[1]+.006,l[2]+.006]],12,open?{a0:.4,a1:TAU-.4}:{}),open?trim:shade(top,.82),null,Wt);
  for(const fy of[spY+.025,spY-.01])if(fy>hemY+.01){const q=r.find(x=>x[0]<=fy)||l;add(chTube([[fy+.003,q[1]+.006,q[2]+.006],[fy-.003,q[1]+.006,q[2]+.006]],6,{a0:-.9,a1:.9}),shade(open?top:top,.86),null,Wt);}}
 if(L.vest){add(chTube(torso(.01,spY-.02),12,{a0:.3,a1:TAU-.3}),L.vest,null,Wt,1);}
 // ---- Arme: Ärmel (lang/kurz), Hände mit Fingern
 const sleeveC=longCoat?coatC:top,short=L.sleeve==='kurz'&&!longCoat,ar=D.ar,glove=L.gloves;
 for(const s of[-1,1]){const x=s*sw,W=Wa(s);
  const armR=e=>[[shY+.05,ar*.55+e,ar*.6+e,0,x],[shY+.03,ar*1.08+e,ar*1.1+e,0,x],[shY-.04,ar*1.02+e,ar*1.02+e,0,x],[elY+.02,ar*.86+e,ar*.9+e,0,x],[elY-.02,ar*.84+e,ar*.88+e,0,x],[wrY+.03,ar*.66+e,ar*.66+e,0,x],[wrY+.01,ar*.6+e,ar*.62+e,0,x]];
  const sk1=armR(-.004);addK(1,chTube(sk1.slice(short?2:5),7,{bot:.001}),sk,null,W,short?1:0);
  const sl=short?armR(.004).slice(0,3).concat([[shY-.1*H,ar*1.02+.005,ar*1.04+.005,0,x]]):armR(.004).slice(0,6);
  add(chTube(sl,8,{top:.001}),sleeveC,null,W,tubeO(sl,8,{top:.001}));const lc=sl[sl.length-1];add(chTube([[lc[0]+.008,lc[1]+.004,lc[2]+.004,0,x],[lc[0]-.004,lc[1]+.004,lc[2]+.004,0,x]],8),longCoat?coatT:short?shade(sleeveC,.8):(open?trim:shade(sleeveC,.82)),null,W);
  if(!short)add(chTube([[elY+.008,ar*.95,ar*.98,0,x],[elY+.002,ar*.95,ar*.98,0,x]],4,{a0:Math.PI-1,a1:Math.PI+1}),shade(sleeveC,.82),null,W);// Ellbogen-Falte
  // Hand: Ballen + vier Finger (leicht gekrümmt) + Daumen
  const hc0=glove||sk,hL=D.hand,hy0=wrY,pw=hL*.36,pt=hL*.15,fy=hy0-hL*.44;
  const hk=glove?3:1;addK(hk,chBlob(pt,hL*.26,pw*.56,6,4,(ux,uy,uz,X,Y,Z)=>[X*(uy<0?1:.85),Y,Z]),hc0,chM(x+s*.002,hy0-hL*.22,0),W,1);
  for(let f=0;f<4;f++){const z=(f-1.5)*pw*.27,len=hL*(.5-Math.abs(f-1.2)*.07),r=hL*.07*(f===3?.85:1);addK(hk,chTube([[fy+hL*.04,r,r*1.05,z,x],[fy-len*.45,r*.95,r,z-len*.1,x-s*.002],[fy-len*.85,r*.8,r*.85,z-len*.3,x-s*.004]],4,{bot:r*.7}),hc0,null,W);}
  addK(hk,chTube([[hy0-hL*.18,hL*.08,hL*.08,-pw*.38,x-s*pt*.3],[hy0-hL*.38,hL*.07,hL*.07,-pw*.62,x-s*pt*.55],[hy0-hL*.5,hL*.055,hL*.055,-pw*.7,x-s*pt*.6]],4,{bot:hL*.04}),hc0,null,W);}
 // ---- Kragen, Schal
 const col=L.collar,neckC=longCoat?coatC:top;
 if(col==='kragen'||longCoat&&!col||open&&!col)add(chTube([[nkY+.03,nr*1.35,nr*1.4,.004],[nkY+.006,nr*1.65,nr*1.7,.006],[nkY-.012,nr*2.2,nr*2.0,.006]],12,{a0:.35,a1:TAU-.35}),col==='kragen'&&longCoat?coatT:open?trim:shade(neckC,.9),null,Wt,1);
 if(col==='fell')addK(2,new THREE.TorusGeometry(nr*1.6,nr*.55,5,12),L.furCol||'#f2ece2',chM(0,nkY-.004,0,1,1,1.05,Math.PI/2,0,0),Wt,1);
 if(col==='kapuze'&&!hats.includes('kapuze'))add(chBlob(sw*.8,hh*.45,hd*.6,10,6),shade(L.hoodCol||neckC,.9),chM(0,nkY+.01,cd*.7+hd*.25),Wt,1);
 if(L.scarf){add(new THREE.TorusGeometry(nr*1.45,nr*.42,6,14),L.scarf,chM(0,nkY+.008,0,1,1,1.05,Math.PI/2-.12,0,0),Wt,1);add(chBlob(nr*.5,.045*H,nr*.25,6,4),shade(L.scarf,.9),chM(-nr*.9,nkY-.04*H,-cd-.004,1,1,1,-.12,0,.1),Wt);}
 // ---- Mantel / Kittel / Umhang
 if(longCoat){const yb=kidB?.27:.235,R=torso(.012,spY-.04).concat([[.42,hpw*1.12+.012,hpd*1.12+.012],[yb,hpw*1.32+.012,hpd*1.35+.012]]);
  add(chTube(R,12,{a0:.32,a1:TAU-.32}),coatC,null,Wsk,tubeO(R,12,{a0:.32,a1:TAU-.32}));add(chTube(R.map(r=>[r[0],r[1]-.004,r[2]-.004,r[3]]),6,{a0:.32,a1:TAU-.32,inv:1}),shade(coatC,.62),null,Wsk);
  for(const s of[-1,1])add(chTube(R.slice(2).map(r=>[r[0],r[1]+.003,r[2]+.003,r[3]]),2,{a0:s<0?TAU-.42:.32,a1:s<0?TAU-.32:.42}),coatT,null,Wsk);
  add(chTube([[yb+.012,hpw*1.31+.016,hpd*1.34+.016],[yb,hpw*1.33+.016,hpd*1.36+.016]],12,{a0:.32,a1:TAU-.32}),coatT,null,Wsk);
  add(chTube([[spY+.004,ww+.016,wd+.016],[spY-.006,ww+.016,wd+.016]],8,{a0:Math.PI-1.2,a1:Math.PI+1.2}),shade(coatC,.82),null,Wt);}
 if(coat==='umhang'){const yb=kidB?.2:.16,R=[[shY+.04,sw*.75,cd*.9+.01],[shY+.005,sw+.03,cd+.025],[spY,sw+.04,cd*1.45],[yb,sw*1.35,cd*2.1]],Wc=(x,y)=>[2,1,gS(spY+.06,.42,y)];
  add(chTube(R,10,{a0:Math.PI/2-.15,a1:Math.PI*1.5+.15}),coatC,null,Wc,1);add(chTube(R.map(r=>[r[0],r[1]-.004,r[2]-.004]),7,{a0:Math.PI/2-.15,a1:Math.PI*1.5+.15,inv:1}),L.coatIn||shade(coatC,.6),null,Wc);
  add(chTube([[yb+.012,sw*1.35+.003,cd*2.1+.003],[yb,sw*1.36+.003,cd*2.11+.003]],10,{a0:Math.PI/2-.15,a1:Math.PI*1.5+.15}),coatT,null,Wc);
  for(const s of[-1,1])addK(5,chBlob(.013*H,.013*H,.01*H,6,4),L.claspCol||'#e6c35c',chM(s*sw*.62,shY+.03,-cd*.72),Wt);}
 // ---- Hose / Rock / Gewand, Becken
 const pant=legs==='robe'?shade(legC,.85):legC,shorts=legs==='shorts',skirt=legs==='rock',robe=legs==='robe';
 add(chTube([[spY+.012,ww+.002,wd+.002],[.47,hpw,hpd],[.432,hpw*1.0,hpd*1.04,.004],[.402,hpw*.72,hpd*.8,.004]],10,{bot:.012}),pant,null,(x,y)=>[1,2,gS(spY-.01,spY+.03,y)*.5],1);
 const legR=(x,e,yb)=>{const t=D.th;return[[.47,t*1.05+e,t*1.08+e,0,x],[.43,t+e,t*1.02+e,0,x],[.34,t*.86+e,t*.9+e,0,x],[.272,t*.66+e,t*.7+e,0,x],[.218,t*.64+e,t*.7+e,.004,x],[.17,t*.68+e,t*.74+e,.006,x],[.11,t*.5+e,t*.52+e,0,x],[yb,t*.5+e,t*.52+e,0,x]].filter(r=>r[0]>=yb);};
 const shoeTop=L.bootHigh?.19:kidB?.1:.105;
 for(const s of[-1,1]){const x=s*RIG.SX,Wg=Wl(s);
  if(shorts||skirt||robe){// Haut/Strumpf unter Shorts/Rock
   addK(robe||L.tights?4:1,chTube(legR(x,-.003,shoeTop-.01).filter(r=>r[0]<(shorts?.36:.48)),8),robe?pant:L.tights||sk,null,Wg,1);
   if(L.socks&&!robe)add(chTube(legR(x,-.001,shoeTop-.005).filter(r=>r[0]<.18),8),L.socks,null,Wg);}
  if(!skirt&&!robe){const yb=shorts?.3:L.bootHigh?shoeTop-.01:.09,R=legR(x,0,yb);if(R[R.length-1][0]>yb)R.push([yb,D.th*(shorts?.92:.56),D.th*(shorts?.95:.58),0,x]);
   add(chTube(R,9),pant,null,Wg,tubeO(R,9));const l=R[R.length-1];add(chTube([[l[0]+.01,l[1]+.003,l[2]+.003,0,x],[l[0],l[1]+.004,l[2]+.004,0,x]],9),shade(pant,.82),null,Wg);
   addK(4,chTube(R.map(r=>[r[0],r[1]+.0025,r[2]+.0025,r[3],r[4]]),1,{a0:(s>0?Math.PI/2:Math.PI*1.5)-.07,a1:(s>0?Math.PI/2:Math.PI*1.5)+.07}),shade(pant,.74),null,Wg);// Seitennaht
   if(!shorts)for(const fy of[.25,.232])add(chTube([[fy+.002,D.th*.7,D.th*.76,.004,x],[fy-.002,D.th*.7,D.th*.76,.004,x]],4,{a0:-1,a1:1}),shade(pant,.8),null,Wg);// Knie-Falten
   if(legs==='cargo')add(chBlob(.012,.032,.03,5,3),shade(pant,.88),chM(x+s*D.th*.98,.33,0),Wg);}
  // Schuh: flache Sohle, Kappe, Schaft, Schnürung
  KD=3;const Wf=s<0?6:9,bt=L.bootTrim||shade(boot,.75),sl=kidB?.037:.032,sL=.081;
  add(chBlob(sl,.04,sL,10,6,(ux,uy,uz,X,Y,Z)=>[X*(uz<0?1-.18*gS(-.5,-1,uz):.86),Math.max(.012,Y*(uz<0?.55+.35*gS(.2,-.9,uz):1)+.038),Z-.014]),boot,chM(x,0,0),Wf,1);
  add(chBlob(sl*1.06,.02,sL*1.03,10,3,(ux,uy,uz,X,Y,Z)=>[X*(uz<0?1-.18*gS(-.5,-1,uz):.9),gC(Y+.01,0,.014),Z-.014]),L.sole||'#2a2226',chM(x,0,0),Wf);
  add(chTube([[shoeTop,D.th*.52,D.th*.54,0,x],[.06,sl*.9,sl*1.05,.004,x]],8),boot,null,(X,Y)=>Y>.1?Wg(X,Y):[Wf,Wf,0]);
  addK(4,chTube([[shoeTop+.004,D.th*.54,D.th*.56,0,x],[shoeTop-.008,D.th*.54,D.th*.56,0,x]],8),bt,null,Wg);
  for(let i=0;i<2;i++)addK(4,chBlob(sl*.42,.0035,.005,4,2),L.laces||'#efe6d2',chM(x,.068-i*.01,-.042-i*.018,1,1,1,-.55,0,0),Wf);}
 KD=4;if(skirt||robe){const yb=robe?.075:kidB?.27:.24,R=[[spY+.014,ww+.008,wd+.008],[.44,hpw*1.08,hpd*1.12],[yb,hpw*(robe?1.5:1.45),hpd*(robe?1.5:1.45)]];
  add(chTube(R,12),legC,null,Wsk,1);add(chTube(R.map(r=>[r[0],r[1]-.004,r[2]-.004]),7,{inv:1}),shade(legC,.6),null,Wsk);add(chTube([[yb+.012,R[2][1]+.003,R[2][2]+.003],[yb,R[2][1]+.004,R[2][2]+.004]],12),shade(legC,.78),null,Wsk);}
 // Gürtel
 if(L.belt){addK(3,chTube([[spY+.012,ww+.009,wd+.009],[spY-.006,ww+.009,wd+.009]],14),L.belt,null,Wt,1);addK(5,chBlob(.014,.012,.004,6,4),L.buckle||'#e6c35c',chM(0,spY+.003,-wd-.012),Wt);}
 // ---- Requisiten
 const accC=L.accCol||'#8a5a32';KD=4;
 if(acc.includes('rucksack')){const by=gL(spY,shY,.45);add(chBlob(sw*.82,(shY-spY)*.62,cd*.55,10,6,(ux,uy,uz,X,Y,Z)=>[X*(1+.15*Math.abs(uy)),Y,Z*(uz<0?.4:1)]),accC,chM(0,by,cd+cd*.32),Wt,1);
  add(chBlob(sw*.5,(shY-spY)*.25,cd*.3,8,4),shade(accC,.82),chM(0,by-(shY-spY)*.28,cd*1.75),Wt,1);
  add(new THREE.CylinderGeometry(cd*.32,cd*.32,sw*1.7,10),L.rollCol||'#e2d6b8',chM(0,by+(shY-spY)*.66,cd*1.25,1,1,1,0,0,Math.PI/2),Wt,1);
  for(const s of[-1,1])addK(3,chTube([[shY+.04,.01,.012,-cd*.2,s*sw*.42],[shY+.012,.009,.009,-cd*.9,s*sw*.44],[spY+.01,.008,.008,-wd-.004,s*sw*.4]],4),shade(accC,.7),null,Wt);}
 if(acc.includes('tasche')){KD=3;add(new THREE.TorusGeometry(1,.07,4,22),shade(accC,.75),chMo(0,gL(spY,shY,.42),-.004,cw*1.42,cd*1.22,cw,Math.PI/2,0,.62),Wt);
  add(chBlob(.05*H,.042*H,.02*H,8,6,(ux,uy,uz,X,Y,Z)=>[X,Y*(uy>0?.9:1),Z]),accC,chM(hpw+.012,.45,-.004,1,1,1,0,-.2,0),(x,y)=>[1,1,0],1);
  if(L.bagSym)add(new THREE.CylinderGeometry(.012*H,.012*H,.004,8),L.bagSymCol||'#ffe08a',chM(hpw+.01,.452,-.024*H-.004,1,1,1,Math.PI/2,0,0),(x,y)=>[1,1,0]);}
 if(acc.includes('stab')){KD=3;const x=sw+.005;add(new THREE.CylinderGeometry(.008*H,.01*H,H*1.02,6),'#7a5032',chM(x,H*.47,-.02),13,1);addK(5,new THREE.OctahedronGeometry(.04*H),L.crystalCol||'#9fe4ff',chM(x,H*.98+.03,-.02,1,1.4,1),13,1);}
 if(acc.includes('laterne')){KD=5;const x=-sw-.004,y=wrY-D.hand*.6;add(new THREE.CylinderGeometry(.03*H,.034*H,.07*H,6),'#3a3030',chM(x,y-.05*H,-.02),11,1);add(chBlob(.024*H,.03*H,.024*H,6,4),'#ffd27a',chM(x,y-.05*H,-.02),11);}
 if(acc.includes('buch'))addK(3,new THREE.BoxGeometry(.03*H,.13*H,.1*H),accC,chM(-sw+.01,elY-.02,-.02,1,1,1,0,0,.1),11,1);
 KD=5;
 // ---- Wappen (Brust) und Medaillen-Plaketten
 const chestF=(x,y,e)=>{const r=(open?torso(shellE,hemY):shirt);let a=r[0],b=r[r.length-1];for(let i=0;i<r.length-1;i++)if(r[i][0]>=y&&r[i+1][0]<=y){a=r[i];b=r[i+1];break;}const t=a[0]===b[0]?0:(a[0]-y)/(a[0]-b[0]),w=gL(a[1],b[1],t),d=gL(a[2],b[2],t),z0=gL(a[3]||0,b[3]||0,t);return(z0-d*Math.sqrt(Math.max(0,1-(x/w)*(x/w))))-(e||0);};
 if(L.emblem&&!L.medals){const x=sw*.42,y=shY-.08*H;add(new THREE.CylinderGeometry(.02*H,.02*H,.004,10),L.emblemCol||'#e9d27a',chM(x,y,chestF(x,y,.003),1,1,1,Math.PI/2+.12,-.35,0),Wt);}
 const med=L.medals||[];if(med.length){const onBelt=!!L.medalBelt,r=.0135*H;
  med.slice(0,8).forEach((c,i)=>{let x,y;if(onBelt){const a=(i-(Math.min(8,med.length)-1)/2)*.3;x=Math.sin(a)*(ww+.012);y=spY+.003;const z=-Math.cos(a)*(wd+.012)-.004;add(new THREE.CylinderGeometry(r,r,.005,10),'#e6c35c',chM(x,y,z,1,1,1,Math.PI/2,-a,0),Wt);add(new THREE.CylinderGeometry(r*.66,r*.66,.006,8),c,chM(x,y,z-.002,1,1,1,Math.PI/2,-a,0),Wt);return;}
   const row=Math.floor(i/4),j=i%4;x=-sw*.18-j*r*2.3;y=shY-.075*H-row*r*2.4;const z=chestF(x,y,.004),ry=Math.atan2(-x,cw)*.8;
   add(new THREE.CylinderGeometry(r,r,.005,10),'#e6c35c',chM(x,y,z,1,1,1,Math.PI/2+.1,ry,0),Wt);add(new THREE.CylinderGeometry(r*.66,r*.66,.006,8),c,chM(x,y,z-.002,1,1,1,Math.PI/2+.1,ry,0),Wt);});
  if(onBelt&&!L.belt){addK(3,chTube([[spY+.013,ww+.01,wd+.01],[spY-.007,ww+.01,wd+.01]],14),'#8a5a32',null,Wt,1);}}
 if(L.crest){const x=-sw*.38,y=shY-.07*H,z=chestF(x,y,.006);add(new THREE.OctahedronGeometry(.026*H),L.crest,chM(x,y,z,1,1.35,.5),Wt);add(new THREE.TorusGeometry(.028*H,.004*H,4,12),'#e6c35c',chM(x,y,z+.003),Wt);}
 // ---- Knöpfe, Taschen (Detail, Qualitätsanspruch 15:17): Hemd/Kittel/Mantel geknöpft, offene Jacke mit Pattentaschen
 {const adultB=!kidB,bc0=L.btnCol;
  if(L.closed&&!longCoat&&!L.vest&&adultB&&L.sleeve!=='kurz')for(let i=0;i<3;i++){const y=shY-.07*H-i*(shY-.07*H-spY-.02)/2.4;addK(5,chBlob(.0085*H,.0085*H,.004*H,5,3),bc0||shade(top,.6),chM(0,y,chestF(0,y,.001)),Wt);}
  if(L.vest)for(let i=0;i<3;i++){const y=shY-.1*H-i*.05*H;addK(5,chBlob(.008*H,.008*H,.004*H,6,3),bc0||'#e6c35c',chM(0,y,chestF(0,y,.012)),Wt);}
  if(longCoat){const a=.44;for(let i=0;i<4;i++){const y=shY-.09*H-i*.075*H;if(y<.36)break;const r=torso(.016,spY-.04),q=r.find(z=>z[0]<=y)||r[r.length-1],x=Math.sin(a)*q[1],z=-Math.cos(a)*q[2]+(q[3]||0)-.003;
    addK(5,chBlob(.0095*H,.0095*H,.0045*H,5,3),bc0||coatT,chM(x,y,z,1,1,1,0,-a,0),y<spY?Wsk:Wt);}}
  if(open)for(const s of[-1,1]){const x=s*ww*.6,y=Math.max(hemY+.03,spY-.012),z=chestF(x,y,.006);// Tasche + Patte
   addK(4,chBlob(.04*H,.022*H,.003*H,6,3),shade(top,.9),chM(x,y-.016*H,z,1,1,1,.05,-s*.45,0),Wt);
   addK(4,chBlob(.045*H,.011*H,.006*H,6,3,(ux,uy,uz,X,Y,Z)=>[X,Y*(uy<0?1.2:1),Z-.002]),shade(top,.78),chM(x,y,z,1,1,1,.1,-s*.45,0),Wt);}}
 const geo=rigMerge(P),ol=rigMerge(O);new Set(P.map(p=>p[0])).forEach(g=>g.dispose());return{geo,ol,D,hem:longCoat?null:hemY,tris:geo.attributes.position.count/3,olTris:ol.attributes.position.count/3};});}
function figMix(a,b,t){return typeof figLerp==='function'?figLerp(a,b,t):a;}
// Aussehen für person3d: NPC-Figur (oe.look), Spielerfigur (oe.body → heroLook inkl. Ausrüstungsstufe), altes Outfit-Objekt, Standard-Held, sonst Bewohner aus der Farbe
function charGeneric(col){let h=7;for(const ch of String(col))h=(h*31+ch.charCodeAt(0))>>>0;h=(h^(h>>>13))*2654435761>>>0;const p=(a,i)=>a[(h>>>i)%a.length];
 const b=p(['adult','adult','teen','alt','adult','kraeftig','teen','adult'],0),w=(h>>>4)&1,sk=p(['#f3cfae','#f1c8a0','#e2b48c','#c98f62','#9a6440','#f6dccb','#ecc8b0'],7);
 const hc=b==='alt'?p(['#d8d4cc','#c9c4bc','#eeeae4'],11):p(['#2a1d16','#5a3a24','#8a5a2a','#c8a050','#1e1a22','#a4532a','#6a4024'],11);
 return{build:b,sex:w?'w':'m',skin:sk,eye:p(['#4a6a3a','#3a6aa8','#6a4a2a','#5a5a5a'],14),hair:w?p(['lang','dutt','pferd','glatt','zopf'],17):p(['kurz','glatt','wuschel','kurz','schopf'],17),hairCol:hc,
  beard:!w&&b!=='teen'&&((h>>>20)&3)===0?p(['kurzbart','schnurr','vollbart'],22):null,top:col,top2:'#efe6d2',closed:!!((h>>>24)&1),legs:w&&((h>>>25)&1)?'rock':'hose',legCol:p(['#3a4258','#4a3a2a','#2e3440','#5a5a62','#6a5a44'],26),
  boots:p(['#4a3426','#2e2a2a','#6a4a30'],28),belt:(h>>>29)&1?'#4a3426':null,glasses:b==='alt'&&((h>>>30)&1)?'rund':null};}
function charLook(col,hat,oe){
 if(oe&&oe.look)return oe.look;
 if(oe&&oe.body&&typeof heroLook==='function')return heroLook(oe);
 if(!oe&&col==='#e8623a'&&hat==='#1f8a7a')return typeof heroLook==='function'&&typeof defaultOutfit==='function'?heroLook(defaultOutfit()):{build:'kind'};
 if(oe)return{build:'kind',skin:oe.skin,hair:oe.hair,hairCol:oe.hairCol,top:col||oe.top,top2:'#efe6d2',closed:true,legs:'hose',legCol:oe.pants,hat:oe.cap?'cap':null,hatCol:oe.capCol};
 return charGeneric(col||'#4c9a5c');}
// Oberflächen-Shader der Figuren (Charaktere 12.11., Qualitätsanspruch 15:17): Details prozedural im Shader statt Textur → keine Pixel aus der Nähe,
// Muster haften an der Ruhepose (rutschen beim Laufen nicht), feine Muster blenden mit dem Bildschirm-Maßstab aus (fwidth → kein Flimmern in der Ferne).
// Haut: weicher Verlauf (unten/Schattenseite wärmer, leicht rosig), feine Tönung · Haar/Fell: Strähnen + Glanzband (Cel, hart) · Stoff: Webstruktur, Fadenlauf,
// leichte Fleckigkeit · Leder: Narbung + matter Glanz · Metall/Glas: harter Glanzpunkt.
const CHAR_GLSL_V='attribute float aKind;\nvarying vec3 vRest;\nvarying vec3 vRN;\nvarying float vKind;\n';
const CHAR_GLSL_F=`varying vec3 vRest;varying vec3 vRN;varying float vKind;
float chH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float chN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(chH(i),chH(i+vec3(1,0,0)),f.x),mix(chH(i+vec3(0,1,0)),chH(i+vec3(1,1,0)),f.x),f.y),mix(mix(chH(i+vec3(0,0,1)),chH(i+vec3(1,0,1)),f.x),mix(chH(i+vec3(0,1,1)),chH(i+vec3(1,1,1)),f.x),f.y),f.z);}
float chAA(vec3 p,float fq){return 1.-smoothstep(.25,.75,length(fwidth(p))*fq);}
`;
const CHAR_GLSL_SURF=`{float k=vKind;vec3 p=vRest;vec3 rn=normalize(vRN);vec3 vd=normalize(vViewPosition);float fr=1.-clamp(dot(normal,vd),0.,1.);
 if(k>.5&&k<1.5){float n=chN(p*55.);float lo=smoothstep(.2,-.9,rn.y);vec3 c0=diffuseColor.rgb;diffuseColor.rgb=mix(vec3(dot(c0,vec3(.3333))),c0,1.35)*vec3(1.,.975,.955);
  diffuseColor.rgb*=mix(vec3(1.),vec3(.95,.86,.83),lo*.55);diffuseColor.rgb*=1.+(n-.5)*.035;
  diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.06,.93,.9),smoothstep(.45,.95,fr)*.35);}
 else if(k>1.5&&k<2.5){float a=atan(p.x,p.z);float w=chN(vec3(p.x*30.,p.y*9.,p.z*30.));float st=sin(a*46.+w*7.+p.y*18.);float aa=chAA(vec3(a*46./6.283,p.y*18.,0.),.9);
  float cl=chN(vec3(a*7.,p.y*6.,0.));float gr=mix(1.,.9+.1*smoothstep(-.6,.8,st),aa)*(.93+.1*cl);diffuseColor.rgb*=gr;
  float b=normal.y*.75+vd.y*.15;float band=smoothstep(.34,.4,b)*(1.-smoothstep(.62,.68,b));diffuseColor.rgb+=diffuseColor.rgb*.42*band*(.55+.45*smoothstep(-.2,.8,st));}
 else if(k>2.5&&k<3.5){float n=chN(p*190.)*.6+chN(p*48.)*.4;diffuseColor.rgb*=1.+(n-.5)*.16*chAA(p,190.);
  diffuseColor.rgb+=vec3(.06)*smoothstep(.93,.97,dot(normal,normalize(vd+vec3(.3,.6,0.))));}
 else if(k>3.5&&k<4.5){vec3 q=p*300.;float aa=chAA(p,300.);vec3 an=abs(rn);an/=an.x+an.y+an.z;
  float wx=sin(q.y)*sin(q.z),wy=sin(q.x)*sin(q.z),wz=sin(q.x)*sin(q.y);float wv=(wx*an.x+wy*an.y+wz*an.z);
  float th=chN(vec3(p.x*400.,p.y*28.,p.z*400.));float mo=chN(p*22.);
  diffuseColor.rgb*=1.+(wv*.045+(th-.5)*.06)*aa+(mo-.5)*.06;
  diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.08+.02,smoothstep(.55,1.,fr)*.3);}
 else if(k>4.5){float h=dot(normal,normalize(vd+vec3(.35,.7,.2)));diffuseColor.rgb+=vec3(.32)*smoothstep(.9,.94,h);diffuseColor.rgb*=.92+.08*smoothstep(.2,.6,h);}}
`;
const RIGM={};function rigMat(){if(RIGM.m)return RIGM.m;const m=mat('#ffffff',{vertexColors:true,skinning:true}).clone();
 if(typeof toonFx==='function')toonFx(m);const ob=m.onBeforeCompile,ck=m.customProgramCacheKey;m.extensions=Object.assign({},m.extensions,{derivatives:true});
 m.onBeforeCompile=(sh,r)=>{if(ob)ob(sh,r);sh.vertexShader=CHAR_GLSL_V+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRest=position;vRN=normal;vKind=aKind;');
  sh.fragmentShader=CHAR_GLSL_F+sh.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+CHAR_GLSL_SURF);};
 m.customProgramCacheKey=()=>(ck?ck():'')+'chr2';return RIGM.m=m;}
function rigOl(){if(RIGM.o)return RIGM.o;const m=new THREE.MeshBasicMaterial({color:'#2b3040',side:THREE.BackSide,skinning:true});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{float sc=length(modelMatrix[0].xyz);vec4 wpO=modelMatrix*vec4(transformed,1.);float dO=length(cameraPosition-wpO.xyz);transformed+=normalize(normal)*.012*clamp(dO/4.5,.28,1.)/max(sc,.001);}');};m.customProgramCacheKey=()=>'olrig';return RIGM.o=m;}
function personRig(col,hat,oe){const L=charLook(col,hat,oe),C=charGeo(L),D=C.D,bones=RIG_P.map(()=>new THREE.Bone());
 const W=[[0,0,0],[0,.43,0],[0,D.spY,0],[0,D.hdY,0],[-RIG.SX,.43,0],[-RIG.SX,.245,0],[-RIG.SX,.065,0],[RIG.SX,.43,0],[RIG.SX,.245,0],[RIG.SX,.065,0],[-D.sw,D.shY,0],[-D.sw,D.elY,0],[D.sw,D.shY,0],[D.sw,D.elY,0]];
 bones.forEach((b,i)=>{const p=RIG_P[i],w=W[i],pw=p<0?[0,0,0]:W[p];b.position.set(w[0]-pw[0],w[1]-pw[1],w[2]-pw[2]);if(p>=0)bones[p].add(b);});
 [4,7,10,12].forEach(i=>bones[i].rotation.order='ZXY');[6,9].forEach(i=>bones[i].rotation.order='YXZ');bones[10].rotation.z=-.1;bones[12].rotation.z=.1;
 const m=new THREE.SkinnedMesh(C.geo,rigMat());m.scale.setScalar(D.k);m.add(bones[0]);m.updateMatrixWorld(true);const sk=new THREE.Skeleton(bones);m.bind(sk);m.castShadow=true;
 const ol=new THREE.SkinnedMesh(C.ol,rigOl());ol.bind(sk,m.bindMatrix);ol.frustumCulled=false;ol.castShadow=ol.receiveShadow=false;ol.userData.outline=1;m.add(ol);m.userData.outline=ol;
 const g=new THREE.Group();g.add(m);g.userData.rig={b:bones,m,ol,k:D.k,stoop:D.stoop,sitY:.43/D.k+.01};g.userData.legs=[bones[4],bones[7]];
 g.userData.char={look:L,hem:C.hem,heads:D.H/D.h,H:D.H*D.k,head:D.h*D.k,hip:.431*D.k,k:D.k,build:L.build||'adult',tris:C.tris,olTris:C.olTris};blobShadow(g,.14+.14*D.H*D.k);return g;}
if(typeof person3d==='function'){const _person3dOld=person3d;person3d=function(col,hat,oe){try{if(window.THREE&&THREE.SkinnedMesh&&THREE.Bone)return personRig(col,hat,oe);}catch(e){console.warn('Figuren-Rig',e);}return _person3dOld(col,hat,oe);};}
// Fuß-Geometrie (Rig-Einheiten): Knöchel HA über dem Boden; Ballen BALL vor, Ferse HEEL hinter dem Knöchel. θ > 0 Spitze hoch (Drehpunkt Ferse), θ < 0 Ferse hoch (Drehpunkt Ballen)
function gaitAnkle(px,py,pz,fx,fz,th,k){k=k||1;const H=RIG.HA*k,HE=RIG.HEEL*k,BA=RIG.BALL*k;if(th>0){const hx=px-fx*HE,hz=pz-fz*HE,c=Math.cos(th),s=Math.sin(th),ly=H*c+HE*s,lb=-H*s+HE*c;return[hx+fx*lb,py+ly,hz+fz*lb];}
 const bx=px+fx*BA,bz=pz+fz*BA,c=Math.cos(th),s=Math.sin(th),ly=H*c-BA*s,lb=H*s+BA*c;return[bx-fx*lb,py+ly,bz-fz*lb];}
let _gQs=null;// Hilfsobjekte (erst bei Bedarf: THREE kann beim Laden fehlen)
function gaitNew(o){return{x:o.position.x,z:o.position.z,v:0,vs:0,a:0,ph:0,w:0,rw:0,sp:0,yr:0,psi:null,lean:0,t:Math.random()*20,mode:'ground',gb:1,reset:true,legs:[{},{}],act:null,mv:0};}
// Gegenstück zu 36-input.js: figAnim(o,'wurf') – Wurf mit dem rechten Arm
function figAnim(o,k){if(!o||!o.userData.rig)return;const G_=o.userData.gait||(o.userData.gait=gaitNew(o));G_.act={k,t:0};}
// Haupt-Tick. opt: {mode:'ground'|'sit'|'climb'|'air', moving (für Posen), state (P.state), still}
function gaitTick(o,dt,opt){const R=o&&o.userData.rig;if(!R)return null;opt=opt||{};const B=R.b,G_=o.userData.gait||(o.userData.gait=gaitNew(o));
 dt=gC(dt||.016,.0005,.1);G_.t+=dt;const sc=(o.scale.x||1)*(R.k||1),yaw=o.rotation.y,roll=o.rotation.z||0,cy=Math.cos(yaw),sy=Math.sin(yaw),fwX=-sy,fwZ=-cy;// Blickrichtung Welt; roll = Kurvenneigung (17-move P.lean)
 const x=o.position.x,z=o.position.z;let dx=x-G_.x,dz=z-G_.z;const dist=Math.hypot(dx,dz);G_.x=x;G_.z=z;
 const mode=opt.mode||'ground';if(dist>1.2*sc||mode!==G_.mode){if(mode!==G_.mode&&G_.mode!=='ground'&&mode==='ground')G_.gb=0;G_.mode=mode;G_.reset=true;if(dist>1.2*sc){dx=dz=0;G_.v=0;}}
 const vr=(dist>1.2*sc?0:dist)/dt/sc,v0=G_.v;G_.v+=(vr-G_.v)*(1-Math.exp(-dt/.08));G_.a+=((G_.v-v0)/dt-G_.a)*(1-Math.exp(-dt/.12));
 // Gewichte: w Bewegung (τ 0,15 s), rw Gehen→Laufen, sp Laufen→Rennen (τ 0,2 s) – weiche Übergänge statt Umschalten; yr Drehrate (Kopf schaut in die Kurve)
 const v=G_.v,vk=v*(R.k||1),mov=vk>.1&&dist>1e-6||(vk>.25);/* bewegt? Schwellen in Welt-Einheiten (Rig-Maßstab k) */G_.w+=((mov?1:0)-G_.w)*(1-Math.exp(-dt/.15));const kr=1-Math.exp(-dt/.2);G_.rw+=(gS(GAIT.wr[0],GAIT.wr[1],v)-G_.rw)*kr;G_.sp=(G_.sp||0)+(gS(GAIT.sp[0],GAIT.sp[1],v)-(G_.sp||0))*kr;const w=G_.w,rw=G_.rw;
 {const y0=G_.yaw0??yaw,d=Math.atan2(Math.sin(yaw-y0),Math.cos(yaw-y0));G_.yaw0=yaw;G_.yr=(G_.yr||0)+((Math.abs(d)>1?0:d/dt)-(G_.yr||0))*(1-Math.exp(-dt/.12));}
 if(dist>1e-6){G_.mdx=dx/dist;G_.mdz=dz/dist;}const mdx=G_.mdx??fwX,mdz=G_.mdz??fwZ;
 const hips=B[1],spine=B[2],head=B[3],gtL=(i,j)=>B[4+i*3+j],arm=(i,j)=>B[10+i*2+j],t=G_.t;
 // Aktion (Wurf) – überlagert den rechten Arm
 let act=null;if(G_.act){G_.act.t+=dt;if(G_.act.t>.6)G_.act=null;else act=G_.act;}
 if(mode!=='ground'){// Posen: weich überblenden
  const e=1-Math.exp(-dt/.12),S=(b,ax,v)=>{b.rotation[ax]+=(v-b.rotation[ax])*e;},mv=!!opt.moving;let ph=(G_.ph=(G_.ph+dt*(mv?1.6:0))%1);const sn=Math.sin(ph*Math.PI*2);
  hips.position.x+=(0-hips.position.x)*e;hips.position.z+=(0-hips.position.z)*e;S(hips,'y',0);S(hips,'z',0);
  if(mode==='sit'){const st=opt.state;// Schwimmen/Gleiten auf dem Partner (Hüfte in der Welt wie früher 0,43 über dem Sitz – Charaktere: Rig-Maßstab k)
   hips.position.y+=((R.sitY||.43)-hips.position.y)*e;S(spine,'x',st==='glide'?-.25:mv?-.14:-.04);S(spine,'y',0);S(head,'x',st==='glide'?.18:mv?.1:0);S(head,'y',0);
   for(let i=0;i<2;i++){const s=i?1:-1;S(gtL(i,0),'x',1.25);S(gtL(i,0),'z',s*.32);S(gtL(i,1),'x',-1.4);S(gtL(i,2),'x',.25);
    if(st==='glide'){S(arm(i,0),'x',.15);S(arm(i,0),'z',s*1.25);S(arm(i,1),'x',.15);}else{S(arm(i,0),'x',.62);S(arm(i,0),'z',s*.16);S(arm(i,1),'x',.85);}}}
  else if(mode==='climb'){hips.position.y+=(.43-hips.position.y)*e;S(spine,'x',.05);S(head,'x',-.25);S(spine,'y',0);S(head,'y',0);
   for(let i=0;i<2;i++){const s=i?1:-1,q=i?-sn:sn;S(arm(i,0),'x',2.55+q*.35);S(arm(i,0),'z',s*.25);S(arm(i,1),'x',.5-q*.35);S(gtL(i,0),'x',.55-q*.45);S(gtL(i,0),'z',s*.08);S(gtL(i,1),'x',-.9+q*.3);S(gtL(i,2),'x',.2);}}
  else{// air: Sprung/Kante – Knie angezogen, Arme zur Balance
   hips.position.y+=(.43-hips.position.y)*e;S(spine,'x',-.1);S(head,'x',.05);S(spine,'y',0);S(head,'y',0);
   for(let i=0;i<2;i++){const s=i?1:-1;S(gtL(i,0),'x',i?.35:.85);S(gtL(i,0),'z',s*.05);S(gtL(i,1),'x',i?-.6:-1.25);S(gtL(i,2),'x',.15);S(arm(i,0),'x',i?.55:-.3);S(arm(i,0),'z',s*.55);S(arm(i,1),'x',.6);}}
  G_.reset=true;return G_;}
 // ---------- Boden (Agent Bewegungsdynamik 12.11.): Gang/Lauf mit Fußkontakt, Flugphase, Gegendrehung, Lean ----------
 const sp=G_.sp,X=GAIT,TAU=Math.PI*2;
 // Doppelschritt S und Stand-Anteil β: Gehen kurze Schritte (Bein 0,365), Laufen/Rennen lange Schritte mit Flugphase (Kontaktweg Dc begrenzt durch die Beinlänge)
 const Sw=Math.min(X.sw[2],X.sw[0]+X.sw[1]*v),Sr=X.sr[0]+X.sr[1]*v,S=Math.max(.3,gL(Sw,Sr,rw)),Dc=gL(X.dc[0],X.dc[1],sp),beta=gL(X.bw,gC(Dc/S,.22,.5),rw),Ssc=S*sc;
 if(mov&&dist>0)G_.ph=(G_.ph+dist/Ssc)%1;const ph=G_.ph;
 // Bremsen (Verzögerung) → Ausfallschritt: Fuß setzt weiter vorn auf, Hüfte federt ein, Oberkörper richtet sich auf
 const brake=gC((-G_.a-2.5)/8,0,1)*w,acc=gC((G_.a-1)/6,0,1)*w;
 // Bewegungsrichtung im Körperrahmen (vorwärts f, rechts l)
 const mf=mdx*fwX+mdz*fwZ,ml=mdx*cy-mdz*sy,lat=gL(RIG.SX,RIG.SX*.72,rw),x1=beta*S*gL(.52,.42,rw)+brake*.07;
 const toL=(px,pz)=>{const ax=px-x,az=pz-z;return[(ax*fwX+az*fwZ)/sc,(ax*cy-az*sy)/sc];},toW=(f,l)=>[x+(fwX*f+cy*l)*sc,z+(fwZ*f-sy*l)*sc];
 const gy0=o.position.y,ty=typeof terrainY==='function'?(px,pz)=>terrainY(px,pz):()=>gy0;
 // Gelände unter der Hüfte geglättet (QA L-T: kein Kniesprung an Bodenwellen)
 const gyT=mov?gy0+.5*w*(ty(x+mdx*X.ahead*sc,z+mdz*X.ahead*sc)-gy0):gy0;// Gelände vorausschauend (bergab senkt sich die Hüfte rechtzeitig)
 if(G_.gyS==null||G_.reset||Math.abs(gy0-G_.gyS)>.6*sc)G_.gyS=gy0;else G_.gyS+=(gyT-G_.gyS)*(1-Math.exp(-dt/X.tau));const gyH=G_.gyS;
 if(G_.reset){for(let i=0;i<2;i++){const L=G_.legs[i],n=toW(.01,(i?1:-1)*lat);L.st='plant';L.p=n;L.fy=yaw;L.t=1;L.th0=0;L.thc=0;L.s=1;L.set=0;}G_.reset=false;G_.hy=null;}
 // Hüfthöhe: Gehen höchster Punkt in der Standmitte (umgekehrtes Pendel), Laufen tiefster (Einfedern) + Flugphase
 const bc=Math.cos(2*TAU*(ph-beta/2)),br=Math.sin(t*1.75);
 let hy=X.h0-w*(gL(.007,.03,rw)+.008*sp)-brake*.022+w*gL(.007,-(.011+.008*sp),rw)*bc+(1-w)*(.002*br-.0055);/* Stand: Knie locker (Charaktere: sonst begrenzt die Beinlänge das Atmen) */
 // ---------- Beine: Fußziele (Stand = in der Welt gepflanzt, Schwung = Bahn im Körperrahmen) ----------
 const FT=G_.ft||(G_.ft=[{},{}]);let swingN=0;for(const L of G_.legs)if(L.st==='swing')swingN++;
 const Tsw=(1-beta)*S,H=gL(X.lw,gL(X.lr[0],X.lr[1],sp),rw),ka=gL(1,.8,rw);
 for(let i=0;i<2;i++){const L=G_.legs[i],sd=i?1:-1,phi=(ph+(i?.5:0))%1,inSt=phi<beta,u=inSt?1:(phi-beta)/(1-beta),q=FT[i];
  const nf=.01,nl=sd*lat;// Grundstellung
  if(mov){if(L.hold&&inSt)L.hold=0;// früh aufgesetzt (Bremsen): erst nach der nächsten Standphase wieder abheben
   if(L.st==='plant'&&!inSt&&!L.hold&&(1-u)*Tsw>.04){const r=toL(L.p[0],L.p[1]);L.st='swing';L.r0=r;L.u0=u>.97?0:u;L.s=0;L.th1=L.thc||0;L.set=0;L.hh0=0;L.g0=ty(L.p[0],L.p[1]);}
   else if(L.st==='swing'){const s1=(u-L.u0)/Math.max(.03,1-L.u0);L.s=L.set?Math.min(1,L.s+dt/.16):inSt?Math.min(1,L.s+dt/.07):Math.min(1,L.s+dt/.14,Math.max(L.s+dt/X.tsw,gC(s1,0,1)));}}// Mindesttempo des Schwungs: beim Abbremsen hängt kein Fuß in der Luft
  else{if(L.st==='swing'&&!L.set&&L.cur){L.r0=L.cur.slice();L.hh0=L.cur[2];L.s=0;L.th1=L.thc||0;L.set=1;L.g0=FT[i].py!=null?FT[i].py-L.cur[2]*sc:null;}
   if(L.st==='swing')L.s=Math.min(1,L.s+dt/(L.set?.2:.16));
   else if(swingN===0&&w<.6){const r=toL(L.p[0],L.p[1]),e=Math.hypot(r[0]-nf,r[1]-nl),o_=G_.legs[1-i],r2=toL(o_.p[0],o_.p[1]),e2=Math.hypot(r2[0]-nf,r2[1]+nl),yd=Math.abs(Math.atan2(Math.sin(L.fy-yaw),Math.cos(L.fy-yaw)));
    if((e>.05||yd>.5)&&e>=e2-1e-4){L.st='swing';L.r0=r;L.u0=0;L.s=0;L.th1=L.thc||0;L.set=1;L.g0=ty(L.p[0],L.p[1]);swingN++;}}}
  let px,pz,py,ffx=fwX,ffz=fwZ,thv;
  if(L.st==='swing'){const s=L.s,r0=L.r0;let f,l,hh;
   if(mov&&!L.set){// Vorschwung: Hermite-Bahn vom Abheben (Fuß wandert zunächst weiter nach hinten oben – Ferse zum Gesäß) bis zum Aufsetzpunkt vor der Hüfte
    const f1=mf*x1+nf,l1=nl+ml*x1,m0=-Tsw*gL(.35,.55,rw),m1=-Tsw*gL(.12,.3,rw),s2=s*s,s3=s2*s,h00=2*s3-3*s2+1,h10=s3-2*s2+s,h01=-2*s3+3*s2,h11=s3-s2;
    f=h00*r0[0]+h10*m0*mf+h01*f1+h11*m1*mf;l=h00*r0[1]+h10*m0*ml+h01*l1+h11*m1*ml;
    hh=H*Math.pow(Math.sin(Math.PI*Math.pow(s,ka)),gL(1.1,1.5,rw))*gC(v/.6,.35,1);}
   else{const e=s*s*(3-2*s);f=r0[0]+(nf-r0[0])*e;l=r0[1]+(nl-r0[1])*e;hh=.035*Math.sin(Math.PI*s)+(L.hh0||0)*(1-e);}
   // Reichweite (Laufen): Schwungfuß setzt nie weiter vor der Hüfte auf, als das Bein leicht gebeugt reicht → kein durchgestrecktes Aufsetzen, kein Kniesprung
   {const cw=mov&&!L.set?rw*gS(.55,.85,s):0;if(cw>0&&f>0){const vy=Math.min(hy,G_.hy??hy)-RIG.HA-hh,Lr=(RIG.L1+RIG.L2)*X.reach,hm=vy<Lr?Math.sqrt(Lr*Lr-vy*vy):0;if(f>hm)f+=(hm-f)*cw;}}
   // Boden unter dem Schwungfuß: weich vom Abhebe- zum Aufsetzpunkt überblendet (kein Zucken über Bodenwellen), Aufsetzpunkt vorausberechnet
   const rem=mov&&!L.set?(1-s)*Tsw:0,td=toW(f+mf*rem,l+ml*rem),gE=ty(td[0],td[1]);if(L.g0==null)L.g0=gE;const gq=gL(L.g0,gE,s*s*(3-2*s));
   L.cur=[f,l,hh];const wq=toW(f,l);px=wq[0];pz=wq[1];py=gq+hh*sc;q.gE=gE;
   // Fußneigung im Schwung: Gehen Spitze hoch vor dem Fersenaufsatz, Laufen Spitze nach unten beim Anfersen, flach (Mittelfuß) beim Aufsetzen
   if(mov&&!L.set){const mid=gL(-.12,gL(-.6,-.95,sp),rw),land=gL(.26,.07,rw);thv=s<.35?gL(L.th1,mid,gS(0,.35,s)):gL(mid,land,gS(.4,.92,s));}else thv=L.th1*(1-gS(0,.5,s));
   if(s>=1){L.st='plant';L.p=[px,pz];L.fy=yaw;L.t=0;L.th0=Math.max(0,thv);L.hold=mov&&!L.set&&!inSt?1:0;L.set=0;L.hh0=0;L.cur=null;swingN=Math.max(0,swingN-1);py=ty(px,pz);}}
  if(L.st==='plant'){px=L.p[0];pz=L.p[1];py=ty(px,pz);ffx=-Math.sin(L.fy);ffz=-Math.cos(L.fy);L.t+=dt;const strike=L.th0>0?L.th0*Math.exp(-L.t/gL(.06,.028,rw)):0;
   const push=inSt?-gL(.42,gL(.62,.8,sp),rw)*gS(gL(.55,.3,rw),1,phi/beta)*w:0;thv=strike+push;}
  q.px=px;q.py=py;q.pz=pz;q.gy=L.st==='swing'&&q.gE!=null?q.gE:ty(px,pz);q.gE=null;q.ffx=ffx;q.ffz=ffz;q.thv=thv;q.u=u;q.sd=sd;}
 // Becken: Seitschwung über das Standbein, Absenken auf der Schwungseite (Drehung mit dem vorderen Bein s. u.)
 const sc2=Math.cos(TAU*(ph-beta/2)),sway=-w*gL(.013,.004,rw)*sc2+(1-w)*.014*Math.sin(t*.55),kap=-w*gL(.045,.03,rw)*sc2+(1-w)*.03*Math.sin(t*.55),ps0=G_.psi||0;
 // Hüfte nie höher, als die Standbeine reichen (Hüftgelenk inkl. Seitschwung/Kippung/Drehung; das abhebende Bein gibt die Höhe weich frei) → Standfuß bleibt exakt stehen
 {const Lc=(RIG.L1+RIG.L2)*gL(.993,gL(.99,.98,rw),w);let cap=9;for(let i=0;i<2;i++){const q=FT[i],Lg=G_.legs[i],sw=Lg.st==='swing'&&!Lg.set&&mov,early=sw?1-gS(0,.3,Lg.s||0):0,late=sw?gS(.55,1,Lg.s||0)*X.pre:0,wq=Lg.st==='plant'?1:Math.max(early,late);if(wq<=0)continue;
   // spätes Schwingen: Hüfte senkt sich schon vor dem Aufsetzen (als stünde der Fuß bereits) → kein durchgestrecktes Knie, kein Einknicken beim Aufsetzen
   const a=gaitAnkle(q.px,late>early?q.gy:q.py,q.pz,q.ffx,q.ffz,q.thv,sc),r=toL(a[0],a[2]),jx=q.sd*RIG.SX,hl=r[1]-sway-jx*Math.cos(kap),hf=r[0]-jx*Math.sin(ps0),hz=Math.hypot(hf,hl);
   const Lq=late>early?(RIG.L1+RIG.L2)*gL(.98,X.land,rw):Lc;// Laufen: Knie beim Aufsetzen schon gebeugt (weiche Landung)
   if(hz<Lq){const c=(a[1]-gyH)/sc+Math.sqrt(Lq*Lq-hz*hz)-jx*Math.sin(kap);if(c<hy)cap=Math.min(cap,hy+(c-hy)*wq);}}
  hy=Math.min(hy,cap);}
 // Ratengrenze der Hüfthöhe (60-fps-Frames): hoch langsam, runter etwas schneller; was dann fehlt, holt die Ferse (Ballen bleibt stehen)
 if(G_.hy!=null){const f60=dt*60;hy=gC(hy,G_.hy-X.hdn*f60,G_.hy+X.hup*f60);}G_.hy=hy;
 // Becken-Drehung mit dem vorderen Bein; Schultern drehen gegen
 const lz=[0,0];for(let i=0;i<2;i++)lz[i]=toL(FT[i].px,FT[i].pz)[0];
 const zN=gC((lz[0]-lz[1])/(beta*S+.04),-1,1),psiT=zN*gL(.11,.13,rw)*w;G_.psi=G_.psi==null?psiT:G_.psi+(psiT-G_.psi)*(1-Math.exp(-dt/.03));const psi=G_.psi;
 // Oberkörper-Neigung: Tempo + Sprint + Anlaufen (vor) / Bremsen (zurück); Becken kippt mit, Kopf bleibt waagerecht
 G_.lean+=((w*(gL(.035,.11,rw)+.13*sp)+acc*.1-brake*.17)-G_.lean)*(1-Math.exp(-dt/.16));const lean=G_.lean,hp=-lean*.4;
 hips.position.set(sway,hy+(gyH-gy0)/sc,0);hips.rotation.set(hp,psi,kap);
 // ---------- IK je Bein (Hüftraum inkl. Becken-Neigung/-Drehung/-Kippung und Kurvenneigung der Figur) ----------
 const cr=Math.cos(roll),sr=Math.sin(roll),cx=Math.cos(hp),sx=Math.sin(hp),cps=Math.cos(psi),sps=Math.sin(psi),ck=Math.cos(kap),sk_=Math.sin(kap),L1=RIG.L1,L2=RIG.L2,gb=G_.gb=Math.min(1,G_.gb+dt/.22);
 for(let i=0;i<2;i++){const q=FT[i],L=G_.legs[i];let thv=q.thv,a=gaitAnkle(q.px,q.py,q.pz,q.ffx,q.ffz,thv,sc);
  const loc=a=>{const ox=a[0]-x,oy=a[1]-gy0,oz=a[2]-z;let lx=(ox*cy-oz*sy)/sc,ly=oy/sc,lz=(ox*sy+oz*cy)/sc;const rx=lx*cr+ly*sr,ry=-lx*sr+ly*cr;lx=rx-sway;ly=ry-(hy+(gyH-gy0)/sc);
   const y1=ly*cx+lz*sx,z1=-ly*sx+lz*cx,x2=lx*cps-z1*sps,z2=lx*sps+z1*cps,x3=x2*ck+y1*sk_,y3=-x2*sk_+y1*ck;return[x3-q.sd*RIG.SX,y3,z2];};
  // Standbein: reicht es nicht, hebt sich die Ferse (Ballen bleibt stehen); reicht es dann noch nicht, hebt der Fuß ab
  const Lmax=(L1+L2)*.995,len=d=>Math.hypot(d[0],d[1],d[2]);let d=loc(a);
  // Charaktere: hängt ein Standfuß weit hinten (Bremsen, Phase steht), hebt er ab, statt die Hüfte tief einknicken zu lassen
  if(L.st==='plant'&&swingN===0&&toL(q.px,q.pz)[0]*mf<-.24&&G_.legs[1-i].st==='plant'){L.st='swing';L.r0=toL(L.p[0],L.p[1]);L.u0=0;L.s=0;L.th1=thv;L.set=1;L.hh0=0;L.g0=ty(L.p[0],L.p[1]);swingN++;}
  if(L.st==='plant'&&len(d)>Lmax&&thv<=.02){let lo=-1.3,hi=Math.min(0,thv);if(len(loc(gaitAnkle(q.px,q.py,q.pz,q.ffx,q.ffz,lo,sc)))<=Lmax){for(let n=0;n<10;n++){const m=(lo+hi)/2;if(len(loc(gaitAnkle(q.px,q.py,q.pz,q.ffx,q.ffz,m,sc)))>Lmax)hi=m;else lo=m;}thv=lo;a=gaitAnkle(q.px,q.py,q.pz,q.ffx,q.ffz,thv,sc);d=loc(a);}
   else if(mov&&toL(q.px,q.pz)[0]*mf<0){L.st='swing';L.r0=toL(L.p[0],L.p[1]);L.u0=gC(q.u,0,.9);L.s=0;L.th1=thv;L.set=0;L.hh0=0;L.g0=ty(L.p[0],L.p[1]);}
   else if(!mov&&swingN===0){L.st='swing';L.r0=toL(L.p[0],L.p[1]);L.u0=0;L.s=0;L.th1=thv;L.set=1;L.hh0=0;L.g0=ty(L.p[0],L.p[1]);swingN++;}}// Charaktere: im Stand unerreichbarer Fuß → Ausgleichsschritt statt Rutschen// nur ein hinterer Fuß hebt vorzeitig ab
  L.thc=thv;L.piv=[thv>0?q.px-q.ffx*RIG.HEEL*sc:q.px+q.ffx*RIG.BALL*sc,q.py,thv>0?q.pz-q.ffz*RIG.HEEL*sc:q.pz+q.ffz*RIG.BALL*sc];L.on=L.st==='plant';
  const ddx=d[0],ddy=d[1],ddz=d[2],r=Math.hypot(ddx,ddy),dd=gC(Math.hypot(r,ddz),.08,(L1+L2)*.9995),rl=Math.atan2(ddx,Math.max(.14,-ddy)),pT=Math.atan2(-ddz,r);
  const ak=Math.acos(gC((L1*L1+dd*dd-L2*L2)/(2*L1*dd),-1,1)),kn=Math.acos(gC((L1*L1+L2*L2-dd*dd)/(2*L1*L2),-1,1));
  let thx=pT+ak,shx=-(Math.PI-kn),ftx=thv-hp-(thx+shx);const T=gtL(i,0),Sh=gtL(i,1),F=gtL(i,2);
  // Schwungbein: Ratengrenze je Frame im frühen Schwung (Abstoß-Streckung wird weich), zum Aufsetzen hin frei; Standbein nie – sonst gleitet der Fuß
  if(L.st==='swing'&&L.kp!=null&&gb>=1){const m=X.rate*dt*(1+1.6*gS(.6,.95,L.s||0));thx=gC(thx,L.tp-m,L.tp+m);shx=gC(shx,L.kp-m,L.kp+m);ftx=gC(ftx,L.fp-m*1.4,L.fp+m*1.4);}
  if(gb<1){thx=gL(T.rotation.x,thx,gb);shx=gL(Sh.rotation.x,shx,gb);ftx=gL(F.rotation.x,ftx,gb);}
  T.rotation.set(thx,0,gb<1?gL(T.rotation.z,rl,gb):rl);Sh.rotation.x=shx;F.rotation.x=ftx;L.tp=thx;L.kp=shx;L.fp=ftx;
  // Fuß-Gierwinkel: Standfuß behält die Richtung vom Aufsetzen, Schwungfuß zeigt nach vorn
  let fy=L.st==='plant'?L.fy-yaw:0;fy=Math.atan2(Math.sin(fy),Math.cos(fy));F.rotation.y=gC(fy,-.6,.6)-psi;F.rotation.z=0;
  // Charaktere 12.11.: Standfuß exakt ausrichten (Gier/Neigung in der Welt statt Näherung) – mit längeren Beinen (Maßstab k) wuchs sonst der Querversatz des Ballens beim Abrollen
  if(L.st==='plant'&&-ddy>=.14&&Math.hypot(r,ddz)<=(L1+L2)*.9995){const[_gQ,_gQ2,_gE]=_gQs||(_gQs=[new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Euler()]);_gQ.copy(o.quaternion).multiply(hips.quaternion).multiply(T.quaternion).multiply(Sh.quaternion).invert();
   F.quaternion.copy(_gQ.multiply(_gQ2.setFromEuler(_gE.set(thv,L.fy,0,'YXZ'))));L.fp=F.rotation.x;}}
 // Oberkörper: Gegendrehung der Schultern, Neigung, Atmen; Kopf hält Blick und Horizont, schaut leicht in die Kurve
 const yr=G_.yr||0,stp=R.stoop||0;spine.rotation.set(-lean*.75+(1-w)*.014*br-stp,-psi*1.7,-kap*.7);
 head.rotation.set(lean*1.1-(1-w)*.01*br+stp*.85,psi*.7+gC(yr*.12,-.35,.35)+(1-w)*.12*Math.sin(t*.37)*Math.sin(t*.23),-kap*.25);
 // Arme: gegengleich zum Bein derselben Seite (vorn, wenn das Bein hinten abdrückt), Ellbogen beim Laufen ~90°, vorn stärker gebeugt
 const A=w*gL(gL(.14,.42,gC(v/1.4,0,1)),.5+.42*sp,rw),el=gL(.22,1.18+.32*sp,rw);
 for(let i=0;i<2;i++){const s=i?1:-1,phi=(ph+(i?.5:0))%1,c=Math.cos(TAU*(phi-beta)),U=arm(i,0),Fa=arm(i,1),fw=Math.max(0,c);
  U.rotation.x=A*c*(c>0?1:gL(.8,.68,rw))+(1-w)*.03*br-lean*.5*w;U.rotation.z=s*(.09+.05*rw*w-.07*rw*w*fw+(1-w)*.015*br);U.rotation.y=0;
  Fa.rotation.x=w*(el+fw*A*gL(.4,.35,rw)-(1-fw)*gL(0,.12,rw))+(1-w)*(.14+.02*br);}
 if(act&&act.k==='wurf'){const p=act.t/.6,U=arm(1,0),Fa=arm(1,1),wb=p<.45?gS(0,.45,p):1-gS(.45,1,p),fw=gS(.4,.6,p)*(1-gS(.75,1,p));U.rotation.x=gL(U.rotation.x,-2.5,wb)+fw*3.2;U.rotation.z=gL(U.rotation.z,.35,wb);Fa.rotation.x=gL(Fa.rotation.x,1.1,wb)-fw*.6;}
 G_.S=Ssc;G_.Sr=S;G_.beta=beta;return G_;}// S = Doppelschritt in der Welt (Tests), Sr in Rig-Einheiten
// Gangparameter (Rig-Einheiten; Bein Hüfte–Knöchel 0,365; Welt = Rig · k, Held k≈1,44). wr/sp: Übergänge Gehen→Laufen→Rennen über das Tempo v in Rig-Einheiten/s
// (Charaktere 12.11.: längere Beine in der Welt → Schwellen 1,45–2,3 / 3,2–5,2 auf 1,0–1,6 / 2,2–3,5 gesenkt, damit Spieltempo 2,8 Laufen und 5 Rennen bleibt)
// sw: Doppelschritt Gehen a+b·v (≤ c) · sr: Laufen a+b·v · dc: Kontaktweg Laufen/Rennen · bw: Stand-Anteil Gehen · lw/lr: Fußhub Gehen/Laufen–Rennen
// h0 Hüfthöhe Stand · hup/hdn Hüft-Ratengrenze je Frame · rate Schwungbein rad/s (früher Schwung) · reach Reichweite Schwungfuß (Anteil Beinlänge) · tau Geländeglättung (s)
// pre Hüfte senkt sich vor dem Aufsetzen · land Beinstreckung beim Aufsetzen (Laufen) · tsw längste Schwungdauer (s; beim Bremsen)
const GAIT={wr:[1.0,1.6],sp:[2.2,3.5],sw:[.32,.24,.6],sr:[.4,.32],dc:[.34,.36],bw:.6,lw:.05,lr:[.07,.15],h0:.431,hup:.012,hdn:.028,rate:21,reach:.985,tau:.035,pre:1,tsw:.36,land:.95,ahead:.35};
// Messhilfe/Tests: Kontaktpunkte der Füße (Welt) – nur Standfüße haben on=true
function gaitFeet(o){const G_=o&&o.userData.gait;return G_?G_.legs.map(L=>({on:!!L.on,piv:L.piv?L.piv.slice():null,th:L.thc||0})):[];}
