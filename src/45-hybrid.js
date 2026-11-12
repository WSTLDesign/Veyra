// ===== VEYRA – Hybrid H2 (Opus hoch): Kampf vor gerendertem Regions-Panorama, Kreaturen-Licht aus dem Bild, Ortsansichten, Kapitel-Standbilder =====
// Doku: docs/hybrid-h2.md · nutzt H1 (44-sky.js): skyRegion, skyTime, battleBgFor, envFor · Tests: test/unit_hybrid.mjs, test/hybrid_shots.mjs
// Kampf (3D-Sprite-Modus): Vollbild-Viereck mit dem Kampfbild ganz hinten (ersetzt Kuppel, Bäume, Hügel, Wolken → weniger Draw-Calls),
//  Abbildung exakt aus der Kampfkamera: Horizont des Bildes (horizonY) = Horizont der Szene bei jeder Neigung/FOV, Maßstab = Brennweite, Gierwinkel gedämpft.
//  Boden-Patch und Deko blenden nach außen in genau das Bildpixel dahinter über (gleiche Abbildung im Shader) → weiche Hinterkante ohne Transparenz.
//  Licht/Schatten/Nebel aus envFor (Sonne/Mond des Bildes), Kreaturen-Tönung + Randlicht + Entfernungs-Dunst über hySprPost (Hook in 10-mon3d sprTick).
// Ortsansicht: beim Betreten eines Ortes (loadMap) 1,5 s Standbild ort_/stadt_/place_<karte> mit Name + Untertitel, weich in die Echtzeitszene.
// Kapitel: Hook in 27-story storyTick → hyChapterShow(n,{then}) zeigt chapter_<n> einmal je Kapitel (G.story.pics[n]).
// Tests/Demo: navigator.webdriver oder window.VEYRA_DEMO → Standbilder enden sofort (window.VEYRA_HY=1 erzwingt die Anzeige, z. B. für Screenshots).
// Test-Hook: window.HY_REGION erzwingt eine Region (Kampfbild/Licht), sonst skyRegion(cur).
const HY_REGN={lichtlande:['Lichtlande','Das goldene Herz von Veyra'],smaragdwald:['Smaragdwald','Königreich des ewigen Lebens'],flutkueste:['Flutküste','Königreich der sieben Meere'],
 glutlande:['Glutlande','Königreich der ewigen Glut'],kristallgebirge:['Kristallgebirge','Königreich der Kristalle'],frosttundra:['Frosttundra','Königreich des ewigen Eises'],
 himmelsweiten:['Himmelsweiten','Königreich über den Wolken'],schattenmoor:['Schattenmoor','Königreich der Dämmerung']};
// Boden-Patch je Region (Farben wie der Boden im Kampfbild, tools/render_assets.mjs GROUND): Boden, Plattform, Halme[3], Blüten[3], Stein, Busch
const HY_GROUND={lichtlande:['#79a85a','#94bd6c',['#5f9446','#7cae58','#93c06a'],['#ffe08a','#ffb0c8','#ffffff'],'#b4b2a8','#5a8a44'],
 smaragdwald:['#5a9446','#76ac58',['#3f7a34','#5a9644','#74ac52'],['#ffe07a','#f4f0d0','#c8a8ff'],'#9aa294','#3f6e34'],
 flutkueste:['#dcc898','#ecdcb2',['#a8c070','#bcd080','#94b060'],['#ffd0d8','#ffffff','#ffc8a0'],'#d0c2a4','#78a858'],
 glutlande:['#6a4e44','#80604e',['#7a5444','#8a5a40','#5e4034'],['#ff9a3a','#ffd166','#ff6a3a'],'#5a4a44','#4a3430'],
 kristallgebirge:['#7e8c70','#97a284',['#66745a','#7e8a6a','#94a07e'],['#e6f0ff','#b8d8ff','#ffffff'],'#a8b0b8','#56604e'],
 frosttundra:['#e6eef4','#f4f8fb',['#cfdde8','#dce8f0','#c0d2e2'],['#ffffff','#d8e8f8','#b8d4f0'],'#c4ccd6','#b8c8d6'],
 himmelsweiten:['#6ea04e','#8ab862',['#5a9040','#76aa52','#8cbc64'],['#fff0a0','#ffffff','#bfe0ff'],'#b8bcc0','#4e8a3c'],
 schattenmoor:['#4e4a60','#625c76',['#4a4660','#5a5070','#6a5a80'],['#c8a8ff','#e6d8ff','#8a6ad8'],'#5e5a6a','#3a3650']};
function hyAuto(){try{return!!((navigator.webdriver||window.VEYRA_DEMO)&&!window.VEYRA_HY);}catch(e){return false;}}
function hyLow(){try{return typeof perfTier==='function'&&perfTier().name==='low';}catch(e){return false;}}
function hyRed(){try{return!!RED||matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
// Bildquelle eines Keys: volle Datei, auf Stufe low (und im Artifact ohne volle Datei) die _lo-Variante
function hyArt(key){const S=window.ART_SRC||{};if(!key)return null;return(hyLow()?(S[key+'_lo']||S[key]):(S[key]||S[key+'_lo']))||null;}
function hyRegion(m){if(window.HY_REGION)return window.HY_REGION;try{return typeof skyRegion==='function'?skyRegion(m||cur):'lichtlande';}catch(e){return'lichtlande';}}
function hyTime(){try{return typeof skyTime==='function'?skyTime():(isNight()?'nacht':'tag');}catch(e){return'tag';}}

// ---------- Bilder laden + dekodieren (vor dem Einblenden, kein synchrones Dekodieren im Frame) ----------
const HYI=new Map();// src → {img,state,p,t}
function hyImg(src){if(!src)return Promise.resolve(null);let E=HYI.get(src);if(E){E.t=performance.now();return E.p;}
 const im=new Image();im.decoding='async';E={img:im,state:'load',t:performance.now()};HYI.set(src,E);
 const ok=()=>{E.state='ok';return im;},bad=()=>{if(im.complete&&im.naturalWidth)return ok();E.state='bad';return null;};
 E.p=new Promise(res=>{im.onload=()=>res(im.decode?im.decode().then(ok,bad):ok());im.onerror=()=>res(bad());});im.src=src;
 if(HYI.size>10){let old=null;for(const[k,e]of HYI)if(e!==E&&e.state!=='load'&&(!old||e.t<old[1].t))old=[k,e];if(old)HYI.delete(old[0]);}return E.p;}
function hyImgReady(src){const E=src&&HYI.get(src);return E&&E.state==='ok'?E.img:null;}

// ===================== 1) Kampf vor dem Regions-Panorama =====================
const HYB={on:false,cur:null,bt:null,decided:false,U:null,mesh:null,mats:[],texs:new Map(),refYaw:-.42,dbg:null,ready:false,off:false,key:null,stats:{calls0:0}};
// Kampfbild für die aktuelle Karte (Innenräume/Höhlen: kein Panorama → bisheriger Hintergrund)
function hyBattleInfo(){try{if(!cur||cur.inside||cur.theme==='cave'||cur.theme==='inside'||typeof battleBgFor!=='function')return null;const i=battleBgFor(hyRegion(cur),hyTime());return i&&i.ok?i:null;}catch(e){return null;}}
function hyBgSrc(i){return i?(hyLow()?(i.lo||i.src):(i.src||i.lo)):null;}
// Vorladen (Kartenwechsel, Kampfbeginn): Bild dekodieren und – wenn die Kampfszene schon existiert – Textur hochladen
function hyBattlePrep(){const i=hyBattleInfo();if(!i)return null;const src=hyBgSrc(i);hyImg(src).then(()=>{try{hyBattleTex(i,true);}catch(e){}});return src;}
// Textur je Quelle (höchstens 2 behalten); file:// o. ä. „verunreinigt“ → null (bisheriger Hintergrund)
function hyBattleTex(i,upload){const src=hyBgSrc(i),img=hyImgReady(src);if(!img||!window.THREE)return null;let T=HYB.texs.get(src);
 if(!T){try{const cv=document.createElement('canvas');cv.width=cv.height=1;const x=cv.getContext('2d');x.drawImage(img,0,0,1,1);x.getImageData(0,0,1,1);}catch(e){HYB.texs.set(src,T={tex:null,bad:1});return null;}
  const t=new THREE.Texture(img);t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;
  T={tex:t,t:performance.now(),up:0};HYB.texs.set(src,T);
  if(HYB.texs.size>2)for(const[k,e]of HYB.texs){if(k===src||(HYB.cur&&HYB.cur.src===k))continue;if(e.tex)e.tex.dispose();HYB.texs.delete(k);if(HYB.texs.size<=2)break;}}
 if(T.bad)return null;T.t=performance.now();if(upload&&!T.up&&typeof BT!=='undefined'&&BT&&BT.r&&BT.r.initTexture){try{BT.r.initTexture(T.tex);T.up=1;}catch(e){}}return T.tex;}
// Shader-Baustein: Bildschirm-NDC → Kampfbild (gleiche Abbildung für Hintergrund und Boden-Überblendung)
const HY_BGFN='vec3 hyBg(vec2 n){vec2 q=hyB.xy+(n-hyA.zw)*hyA.xy/hyB.z;vec2 uv=q*.5+.5;vec3 c=texture2D(hyTex,clamp(uv,vec2(.002),vec2(.998))).rgb;return mix(c,hyZen,smoothstep(1.,1.14,uv.y));}';
const HY_UNI='uniform sampler2D hyTex;uniform vec4 hyA;uniform vec4 hyB;uniform vec3 hyZen;uniform vec4 hyFade;uniform float hyOn;uniform vec2 hyRes;uniform float hyK0;\n';
function hyUniforms(){if(HYB.U)return HYB.U;return HYB.U={hyTex:{value:null},hyA:{value:new THREE.Vector4(1,1,0,-.178)},hyB:{value:new THREE.Vector4(0,-.178,1,0)},hyZen:{value:new THREE.Color('#7f9fcf')},
 hyFade:{value:new THREE.Vector4(.1,-.55,11,30)},hyOn:{value:0},hyRes:{value:new THREE.Vector2(1,1)},hyK0:{value:0}};}
// Toon-Materialien der Kampfszene: nach außen in das Bildpixel dahinter überblenden (nach Nebel/Tonemapping, wie das Bild selbst)
function hyInject(mat){if(!mat||mat.userData.hy)return;const U=hyUniforms();mat.userData.hy=1;const prev=mat.onBeforeCompile;
 mat.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHyW;').replace('#include <project_vertex>','#include <project_vertex>\n{vec4 hp=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nhp=instanceMatrix*hp;\n#endif\nvHyW=(modelMatrix*hp).xyz;}');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vHyW;'+HY_UNI+HY_BGFN).replace('#include <fog_fragment>','#include <fog_fragment>\nif(hyOn>0.){float hk=max(hyK0,smoothstep(hyFade.z,hyFade.w,length(vHyW.xz-hyFade.xy)))*hyOn;if(hk>.001)gl_FragColor.rgb=mix(gl_FragColor.rgb,hyBg(gl_FragCoord.xy/hyRes*2.-1.),hk);}');};
 mat.customProgramCacheKey=()=>'hyb1|'+(prev?String(prev):'');mat.needsUpdate=true;HYB.mats.push(mat);}
function hyBattleSetup(){if(!BT||BT._hy||!window.THREE)return;BT._hy=1;const U=hyUniforms();
 const m=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,fog:false,
  vertexShader:'varying vec2 vS;void main(){vS=position.xy;gl_Position=vec4(position.xy,1.,1.);}',fragmentShader:HY_UNI+'varying vec2 vS;'+HY_BGFN+'void main(){gl_FragColor=vec4(hyBg(vS),1.);}'}));
 m.frustumCulled=false;m.renderOrder=-100;m.visible=false;m.name='hyBattleBg';m.onBeforeRender=(r,s,cam)=>{try{hyBgCam(cam,r);}catch(e){}};BT.s.add(m);HYB.mesh=m;
 [BT.gmat,BT.pm,BT.tuftM&&BT.tuftM.material,BT.flM&&BT.flM.material,BT.bushM&&BT.bushM.material,BT.rockM&&BT.rockM.material].forEach(hyInject);
 if(HYB.cur)hyBattleTex(HYB.cur.info,true);else hyBattlePrep();}
if(typeof battle3d==='function'){const _b3H2=battle3d;battle3d=function(){const r=_b3H2.apply(this,arguments);try{if(r&&typeof BT!=='undefined'&&BT&&!BT._hy)hyBattleSetup();}catch(e){console.error('Hybrid H2',e);}return r;};}
// Bezugs-Gierwinkel = Kamera „beide im Bild“ (35 CAMPOSE.both) auf den Standardplätzen; ohne CAM die Kamera aus 10
function hyRefYaw(){const dx=2.4+2.2,dz=-2.7-1.6,l=Math.hypot(dx,dz);let yo=.4;try{if(typeof CAMPOSE!=='undefined'&&CAMPOSE.both)yo=CAMPOSE.both.yo;else return Math.atan2(-5.25,7.1);}catch(e){}return Math.atan2(-dx/l,-dz/l)+yo;}
// Bildraum (Kamera des Renders blickt nach −z) → Kampfszene (gedreht um den Bezugs-Gierwinkel)
function hyRot(v,yaw,o){const c=Math.cos(yaw),s=Math.sin(yaw);o[0]=v[0]*c+v[2]*s;o[1]=v[1];o[2]=-v[0]*s+v[2]*c;return o;}
const _hyV=[0,0,0],_hyD=[0,0,0];let _hyP=null,_hyC=null,_hyC2=null,_hyR=null;
// Je Bild (aus render3DBattle, nach Licht/Kamera, vor sprTick): Panorama an/aus, Licht/Schatten/Nebel aus dem Bild
function hyBattleFrame(bt,now){if(!bt||!window.THREE)return;if(!bt._hy)hyBattleSetup();const live=typeof B!=='undefined'&&B&&!B2D;
 if(live&&HYB.bt!==B.t0){HYB.bt=B.t0;HYB.decided=false;HYB.cur=null;HYB.refYaw=hyRefYaw();}
 if(live&&!HYB.decided){const i=hyBattleInfo();if(!i)HYB.decided=true;else{const tex=hyBattleTex(i,false);
   if(tex){HYB.cur={info:i,tex,src:hyBgSrc(i),reg:i.region,time:i.time};HYB.decided=true;HYB.key=i.key;}
   // spätestens 0,9 s nach Kampfbeginn entscheiden (danach kein Wechsel mitten im Kampf)
   else if(now-(B.t0||now)>900||(HYI.get(hyBgSrc(i))||{}).state==='bad')HYB.decided=true;else hyImg(hyBgSrc(i));}}
 const on=!!(live&&HYB.cur&&!HYB.off);if(!on){if(HYB.on){HYB.on=false;hyBattleScene(bt,false);}HYB.ready=false;return;}
 const U=HYB.U,I=HYB.cur.info,E=I.env,s=bt.s;U.hyTex.value=HYB.cur.tex;U.hyOn.value=1;U.hyZen.value.set(E.zenith||E.top);
 if(!_hyC){_hyC=new THREE.Color();_hyC2=new THREE.Color();_hyP=new THREE.Vector3();_hyR=new THREE.Vector2();}
 const night=E.night,eve=E.time==='abend';
 // Licht: Hemisphäre aus den Himmels-/Bodenfarben des Bildes, Sonne (nachts Mond) in Farbe/Stärke des Bildes; nachts etwas heller (Lesbarkeit für Kinder)
 bt.hemi.color.set(E.hemiTop);bt.hemi.groundColor.set(E.hemiBot);bt.hemi.intensity=E.hemiI*(night?1.35:1.04);
 bt.sun.color.set(E.sunCol);bt.sun.intensity=E.sunI*(night?1.6:eve?.95:.92);
 // Richtung = Bild-Sonne (gedreht auf den Bezugs-Blick), nie flacher als ≈ 14° (Lesbarkeit, wie H1)
 const d=hyRot(E.sunDir,HYB.refYaw,_hyD);if(d[1]<.24){const q=Math.sqrt((1-.24*.24)/Math.max(1e-6,d[0]*d[0]+d[2]*d[2]));d[0]*=q;d[2]*=q;d[1]=.24;}
 const cx=.1,cz=-.55;bt.sun.position.set(cx+d[0]*12,d[1]*12,cz+d[2]*12);bt.sun.target.position.set(cx,0,cz);bt.sun.target.updateMatrixWorld();
 // Randlicht von hinten in Horizontfarbe (abends warm, nachts kühl)
 bt.rim.color.set(E.horizon).lerp(_hyC.set(E.sunCol),eve?.55:.25);bt.rim.intensity=night?.42:eve?.75:.5;
 // Nebel = Horizontfarbe (atmosphärische Perspektive wie im Bild), weit draußen – die Hinterkante übernimmt die Bild-Überblendung
 s.fog.color.set(E.fog);s.fog.near=22;s.fog.far=90;bt.r.toneMappingExposure=1.08*(E.exposure||1);
 if(!HYB.on){HYB.on=true;hyBattleScene(bt,true,d);}HYB.ready=true;
 // ferne Kulisse der alten Szene bleibt aus (themeBattle könnte sie bei Themenwechsel wieder zeigen)
 bt.dome.visible=bt.trunk.visible=bt.crown.visible=bt.hillM.visible=bt.cloudM.visible=false;HYB.mesh.visible=true;
 // Bodenschatten: Ellipse weg von der Sonne, länger/heller bei tiefer Sonne, kräftiger bei hoher
 const el=Math.asin(Math.min(1,d[1])),Lk=Math.min(2.6,1/Math.tan(el)),sx=-d[0],sz=-d[2],sl=Math.hypot(sx,sz)||1,ang=Math.atan2(-sz/sl,sx/sl),op=night?.42:Math.min(.95,.55+.5*Math.sin(el));
 bt.cs.forEach((c,i)=>{const o=i?bt.me:bt.foe;if(!o)return;const r=c.scale.y/.8;c.rotation.set(-Math.PI/2,0,ang);c.scale.set(r*(1+.22*(Lk-1)),r*.78,1);c.position.x+=sx/sl*r*.12*(Lk-1);c.position.z+=sz/sl*r*.12*(Lk-1);});
 if(bt.cs[0])bt.cs[0].material.opacity=op;hyRockCam(bt,true);
 HYB.dbg=HYB.dbg||{};HYB.dbg.sun=[+d[0].toFixed(3),+d[1].toFixed(3),+d[2].toFixed(3)];HYB.dbg.reg=I.region;HYB.dbg.time=I.time;}
// Steine (10: rockM, Radius 4,5–14) dicht vor der Kampfkamera füllen sonst als großer heller/violetter Keil die Ecke unten rechts (QA M2) → ausblenden, solange die Kamera nah ist
const _hyM4=[];function hyRockCam(bt,on){const R=bt.rockM;if(!R||!R.isInstancedMesh||!window.THREE)return;const im=R.instanceMatrix,a=im.array;if(!R.userData.hyM0)R.userData.hyM0=a.slice();const o=R.userData.hyM0;
 const cp=bt.cam.position;let key='',ch=false;for(let i=0;i<R.count;i++){const j=i*16,dx=o[j+12]-cp.x,dz=o[j+14]-cp.z,sc=Math.hypot(o[j],o[j+1],o[j+2]),hide=on&&Math.hypot(dx,dz)<2.4+sc*2.2;key+=hide?1:0;}
 if(key===R.userData.hyKey)return;R.userData.hyKey=key;for(let i=0;i<R.count;i++){const j=i*16;for(let k=0;k<16;k++)a[j+k]=key[i]==='1'&&k<12?0:o[j+k];}im.needsUpdate=true;}
const HY_GRASS={tag:[.635,.757,.471],abend:[.478,.412,.188],nacht:[.059,.114,.118]};
// ACES (three r128, tonemapping_pars) und Umkehrung: welche Szenen-Helligkeit ergibt nach dem Tonemapping die Bildfarbe?
function hyAces(x,e,o){const k=e/.6,r=x[0]*k,g=x[1]*k,b=x[2]*k,f=v=>(v*(v+.0245786)-.000090537)/(v*(.983729*v+.432951)+.238081);
 const a=f(.59719*r+.35458*g+.04823*b),bb=f(.076*r+.90834*g+.01566*b),c=f(.0284*r+.13383*g+.83777*b);
 o[0]=Math.min(1,Math.max(0,1.60475*a-.53108*bb-.07367*c));o[1]=Math.min(1,Math.max(0,-.10208*a+1.10813*bb-.00605*c));o[2]=Math.min(1,Math.max(0,-.00327*a-.07276*bb+1.07602*c));return o;}
function hyAcesInv(T,e){const y=T.slice(),f=[0,0,0];for(let n=0;n<24;n++){hyAces(y,e,f);for(let i=0;i<3;i++)y[i]=Math.max(0,y[i]*(T[i]+.004)/(f[i]+.004));}return y;}
// Toon-Verlauf (09 toonGrad: 84,118,178,232,255 bei 5 Texeln, linear gefiltert) für Boden mit Normale nach oben
function hyToonG(nl){const D=[84,118,178,232,255],u=Math.min(1,Math.max(0,nl*.5+.5))*5-.5,i=Math.max(0,Math.min(3,Math.floor(u))),t=Math.min(1,Math.max(0,u-i));return(D[i]+(D[i+1]-D[i])*t)/255;}
// Mittelfarbe des nahen Bodens im Kampfbild (untere Bildzeilen) – einmal je Bild
function hyImgGround(img){if(img._hyG)return img._hyG;let o=null;try{const cv=document.createElement('canvas');cv.width=64;cv.height=36;const x=cv.getContext('2d');x.drawImage(img,0,0,64,36);const D=x.getImageData(0,29,64,6).data;let r=0,g=0,b=0,n=0;
 for(let i=0;i<D.length;i+=4){r+=D[i];g+=D[i+1];b+=D[i+2];n++;}o=[r/n/255,g/n/255,b/n/255];}catch(e){}return img._hyG=o;}
// Szene umschalten: ferne Kulisse aus, Boden in Regionsfarben (auf das Bild abgestimmt) ↔ bisheriger Hintergrund (Thema aus 10)
// Plattform (10: LatheGeometry, Profil außen→innen) hat Normalen nach unten → Oberseite bekäme nur das Hemisphären-Bodenlicht (heller/violetter Keil, QA M2).
// Mit Panorama: Normalen nach oben (wie der Boden), ohne Panorama: Ausgangszustand (bisheriger Look unverändert)
function hyPlatN(bt,up){try{const seen=new Set();bt.s.traverse(m=>{if(m.material!==bt.pm||!m.geometry||seen.has(m.geometry))return;const g=m.geometry;seen.add(g);
 if(!g.userData.hyN0)g.userData.hyN0=g.attributes.normal.array.slice();const n=g.attributes.normal,a=n.array,o=g.userData.hyN0;
 if(up){for(let i=0;i<a.length;i+=3){a[i]=-o[i];a[i+1]=-o[i+1];a[i+2]=-o[i+2];}}else a.set(o);n.needsUpdate=true;g.userData.hyUp=!!up;});}catch(e){}}
function hyBattleScene(bt,on,d){const U=hyUniforms();U.hyOn.value=on?1:0;if(HYB.mesh)HYB.mesh.visible=on;hyPlatN(bt,on);
 if(!on){hyRockCam(bt,false);bt.dome.visible=true;if(bt.flM&&bt.flM.material.emissive)bt.flM.material.emissive.set(0);bt.cs.forEach(c=>{c.rotation.set(-Math.PI/2,0,0);});if(bt.cs[0])bt.cs[0].material.opacity=1;bt.r.toneMappingExposure=1.1;
  // Ausgangswerte aus battle3d (10) zurück
  bt.hemi.color.set(0xffffff);bt.hemi.groundColor.set(0x5a6650);bt.rim.color.set(0xdff0ff);bt.sun.position.set(-4,9,6);bt.sun.target.position.set(0,0,0);bt.sun.target.updateMatrixWorld();bt.s.fog.near=18;bt.s.fog.far=55;bt.th=null;try{if(typeof cur!=='undefined'&&cur){bt.th=cur.theme;themeBattle(cur.theme);}}catch(e){}return;}
 const T=HY_GROUND[HYB.cur.reg]||HY_GROUND.lichtlande,E=HYB.cur.info.env,tm=E.time,col=(m,arr)=>{if(!m||!m.instanceColor)return;for(let i=0;i<m.count;i++)m.setColorAt(i,arr[i%arr.length]);m.instanceColor.needsUpdate=true;};
 // Bodenfarbe so wählen, dass der beleuchtete, getonte Boden die Farbe des Bild-Bodens trifft: Albedo = ACES⁻¹(Bildfarbe) / (Hemisphäre + Sonne·Toon(N·L))
 const base=new THREE.Color(T[0]);let A=null;const img=hyImgReady(HYB.cur.src);
 // Himmelsweiten: im Bild liegt unten das Wolkenmeer → Grasinsel wie der Wiesenboden der Lichtlande (gemessen) zur selben Tageszeit
 const tg=HYB.cur.reg==='himmelsweiten'?HY_GRASS[tm]||HY_GRASS.tag:img&&hyImgGround(img);
 if(tg){const y=hyAcesInv(tg,bt.r.toneMappingExposure),g=hyToonG(d?d[1]:.6),h=bt.hemi.color,hi=bt.hemi.intensity,sc=bt.sun.color,si=bt.sun.intensity;
  const Lr=h.r*hi+sc.r*si*g,Lg=h.g*hi+sc.g*si*g,Lb=h.b*hi+sc.b*si*g;A=new THREE.Color(Math.min(1.6,y[0]/Math.max(.02,Lr)),Math.min(1.6,y[1]/Math.max(.02,Lg)),Math.min(1.6,y[2]/Math.max(.02,Lb)));HYB.dbg=HYB.dbg||{};HYB.dbg.gt=tg.map(v=>+v.toFixed(3));}
 // ohne Messung: Regionsfarbe, abends/nachts Richtung Bild-Bodenlicht
 if(!A)A=base.clone().lerp(new THREE.Color(E.hemiBot),tm==='nacht'?.55:tm==='abend'?.22:0);
 const rel=v=>{const c=new THREE.Color(v);return c.setRGB(A.r*c.r/Math.max(.02,base.r),A.g*c.g/Math.max(.02,base.g),A.b*c.b/Math.max(.02,base.b));};
 bt.gmat.color.copy(A).multiplyScalar(1/.92);/* Bodentextur ≈ 92 % hell *//* Himmelsweiten: Plattform = Gras-Albedo ×1,05 (kein Kanalverhältnis → kein heller Keil) */bt.pm.color.copy(HYB.cur.reg==='himmelsweiten'?A.clone().multiplyScalar(1.05):rel(T[1]));col(bt.tuftM,T[2].map(rel));col(bt.flM,T[3].map(v=>new THREE.Color(v)));bt.rockM.material.color.copy(rel(T[4]));bt.bushM.material.color.copy(rel(T[5]));
 const sea=HYB.cur.reg==='himmelsweiten';bt.bushM.visible=['lichtlande','smaragdwald'].includes(HYB.cur.reg);bt.tuftM.visible=!['frosttundra','glutlande'].includes(HYB.cur.reg);bt.flM.visible=bt.rockM.visible=true;
 // Lava-Kruste: Glutbrocken leuchten leicht (nur Glutlande)
 const fm=bt.flM.material;if(fm.emissive){if(HYB.cur.reg==='glutlande'){fm.emissive.set('#ff5a1a');fm.emissiveIntensity=tm==='nacht'?.9:.45;}else{fm.emissive.set(0);fm.emissiveIntensity=1;}}
 U.hyK0.value=tm==='nacht'?.3:tm==='abend'?.2:.14;
 // Himmelsweiten: Insel endet früher (Wolkenmeer im Bild), sonst weiter Übergang
 U.hyFade.value.set(.1,-.55,sea?(tm==='nacht'?7.5:9):11,sea?(tm==='nacht'?19:17):30);try{bt.th=cur.theme;}catch(e){}/* 10 färbt nur bei Themenwechsel neu → Regionsfarben bleiben */}
// Kamera → Abbildung Bildschirm ↔ Kampfbild (aufgerufen direkt vor dem Zeichnen des Hintergrunds, Kamera ist dann endgültig)
function hyBgCam(cam,r){const U=HYB.U,C=HYB.cur;if(!U||!C)return;const I=C.info,e=cam.matrixWorld.elements;let fx=-e[8],fz=-e[10];const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l;
 const P=_hyP.set(cam.position.x+fx*1000,cam.position.y,cam.position.z+fz*1000).project(cam),pe=cam.projectionMatrix.elements;
 const fyI=1/Math.tan(I.fov*Math.PI/360),fxI=fyI*I.h/I.w,Ky=fyI/pe[5],Kx=fxI/pe[0],hiy=1-2*I.horizonY;
 let dy=Math.atan2(-fx,-fz)-HYB.refYaw;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;const hix=Math.max(-.6,Math.min(.6,-Math.tan(dy*.35)*fxI));
 // Abdeckung: breitere Bildschirme / Blick nach oben → Bild um den Horizontpunkt vergrößern (höchstens 1,6×, darüber Zenit-Farbe)
 let s=Math.max(1,Math.max(Math.abs(-1-P.x),Math.abs(1-P.x))*Kx/(1-Math.abs(hix)),(1-P.y)*Ky/(1-hiy));s=Math.min(1.6,s);
 U.hyA.value.set(Kx,Ky,P.x,P.y);U.hyB.value.set(hix,hiy,s,0);r.getDrawingBufferSize(_hyR);U.hyRes.value.copy(_hyR);
 const D=HYB.dbg||(HYB.dbg={});D.hx=+P.x.toFixed(3);D.hy=+P.y.toFixed(3);D.hyTop=+((1-P.y)/2).toFixed(3);D.s=+s.toFixed(3);D.K=[+Kx.toFixed(3),+Ky.toFixed(3)];D.fov=+cam.fov.toFixed(1);}
// Kampfbeginn: Bild schon während des Auftakts (Bemerken-Icon, Wischblende) dekodieren und hochladen
if(typeof startBattle==='function'){const _sbH2=startBattle;startBattle=function(o){try{hyBattlePrep();}catch(e){}return _sbH2.apply(this,arguments);};}

// ===================== 2) Kreaturen-Render-Behandlung (Kampf + Welt) =====================
// Aufruf aus sprTick (10) nach Tönung/Randlicht: Farbstich nach Tageszeit, Randlicht abends warm/kräftiger, nachts kühl; Entfernungs-Dunst der hinteren Kreatur (Kampf)
function hyGradeOf(E,k){// k = Stärke 0..1
 if(!_hyC)return null;if(E.night)return _hyC2.setRGB(1-.13*k,1-.07*k,1+.07*k);if(E.time==='abend')return _hyC2.setRGB(1+.05*k,1-.02*k,1-.09*k);return _hyC2.setRGB(1,1,1);}
function hySprPost(S,L,cam){if(!L||!L.mat||!window.THREE)return;const u=L.mat.uniforms;if(!_hyC){_hyC=new THREE.Color();_hyC2=new THREE.Color();_hyP=new THREE.Vector3();_hyR=new THREE.Vector2();}
 let E=null,battle=false;
 if(typeof BT!=='undefined'&&BT&&S===BT.s){if(!HYB.on||!HYB.cur)return hyHaze(u,null);E=HYB.cur.info.env;battle=true;}
 else if(typeof R3!=='undefined'&&R3&&S===R3.scene&&typeof skyActive==='function'&&skyActive()&&typeof SKY3!=='undefined'){const Bl=skyBlend((G?G.time:720)/60);E=envFor(SKY3.region||'lichtlande',Bl.k<.5?Bl.a:Bl.b);}
 if(!E)return hyHaze(u,null);
 const g=hyGradeOf(E,battle?1:.7);if(g)u.uTint.value.multiply(g);
 if(E.time==='abend')u.uRim.value.multiplyScalar(battle?1.7:1.35).lerp(_hyC.set(E.sunCol),.35);else if(E.night)u.uRim.value.lerp(_hyC.set('#9fb4ff'),.4).multiplyScalar(1.15);
 if(!battle)return hyHaze(u,null);
 // Kampf: hintere Kreatur leicht in Horizontfarbe (Abstand zur Kamera), vordere klar
 let dn=1e9,df=0;for(const o of[BT.me,BT.foe]){if(!o)continue;const dd=cam.position.distanceTo(o.position);dn=Math.min(dn,dd);df=Math.max(df,dd);}
 if(!(df>0))return hyHaze(u,null);const k=E.night?.22:E.time==='abend'?.2:.16;hyHaze(u,[E.horizon,dn+.6,Math.max(dn+2.5,df+1.5),df-dn>1.2?k:0]);}
// Welt: Kontaktschatten (09 blobSync) als Ellipse weg von der Bild-Sonne (SKY3.sd), länger bei tiefer Sonne, Deckkraft nach Sonnenhöhe
function hyBlob(d,s,bm){const on=typeof SKY3!=='undefined'&&SKY3.sdOn&&SKY3.sd&&typeof skyActive==='function'&&skyActive();if(!on){d.rotation.y=0;if(bm&&bm.material.userData.hy0!=null)bm.material.opacity=bm.material.userData.hy0;return;}
 const v=SKY3.sd,el=Math.asin(Math.max(.05,Math.min(1,v.y))),L=Math.min(2.4,1/Math.tan(el)),hl=Math.hypot(v.x,v.z)||1,dx=-v.x/hl,dz=-v.z/hl;
 d.rotation.y=Math.atan2(-dz,dx);d.scale.x=s*(1+.2*(L-1));d.scale.z=s*.86;d.position.x+=dx*s*.1*(L-1);d.position.z+=dz*s*.1*(L-1);
 if(bm){const m=bm.material;if(m.userData.hy0==null)m.userData.hy0=m.opacity;const night=typeof isNight==='function'&&isNight();m.opacity=m.userData.hy0*(night?.7:.78+.3*Math.sin(el));}}
// Welt abends/nachts (QA N6): Vordergrund nicht tagesgrün gegen violetten Himmel – Boden-/Himmelslicht der Hemisphäre stärker aus envFor (Horizont/Boden des Bildes),
// Grünanteil des Lichts leicht gedämpft (wirkt v. a. auf Gras/Bäume; Kreaturen-Sprites haben eigenes Licht über hySprPost)
function hyWorldGrade(S,c){if(!c||c.inside||c.encl||c.lset||typeof skyActive!=='function'||!skyActive()||typeof R3==='undefined'||!R3||!R3.hemi)return;
 const B=skyBlend(c.h),reg=SKY3.region||'lichtlande',w=t=>t==='nacht'?1:t==='abend'?.8:0,k=(w(B.a)*(1-B.k)+w(B.b)*B.k)*(1-(c.gray||0));if(k<.01)return;
 const A=envFor(reg,B.k<.5?B.a:B.b),C=SKY3.c3,night=A.night;if(!_hyC){_hyC=new THREE.Color();_hyC2=new THREE.Color();_hyP=new THREE.Vector3();_hyR=new THREE.Vector2();}
 C.set(A.horizon).lerp(_hyC.set(A.hemiBot),.4);R3.hemi.groundColor.lerp(C,(night?.28:.3)*k);R3.hemi.color.lerp(_hyC.set(A.horizon),(night?.14:.15)*k);
 const gd=1-(night?.14:.1)*k;R3.hemi.color.g*=gd;R3.hemi.groundColor.g*=gd;R3.sun.color.g*=1-(night?.08:.05)*k;}
if(typeof skyFrame==='function'){const _sfH2=skyFrame;skyFrame=function(S,O,c){const r=_sfH2.apply(this,arguments);try{hyWorldGrade(S,c);}catch(e){}return r;};}
function hyHaze(u,h){if(!u.uHzK)return;if(!h){u.uHzK.value.set(0,1,0);return;}u.uHzC.value.set(h[0]);u.uHzK.value.set(h[1],h[2],h[3]);}

// ===================== 3) Ortsansichten beim Betreten eines Ortes =====================
const HYP={cur:null,last:{},shownAt:0,el:null,shown:false,hold:0,lastKey:null,count:0,token:0,wasWorld:false};
const HY_PLACE_MS=1500,HY_SAME_MS=5*60e3,HY_GAP_MS=20e3;
function hyIsRoute(id){return/^route/.test(id)||id==='windkueste';}
// Bild des Ortes: vorhandene Ortsbilder (ort_/stadt_<karte>) → offline gerendertes place_<karte>
function hyPlaceKey(id){for(const k of['ort_'+id,'stadt_'+id,'place_'+id])if(hyArt(k))return k;return null;}
// wie storyTick (27): im automatisierten Lauf (SEQ_AUTO) kommt kein Kapitelbild → Ortsbild bleibt
function hyChapterDue(){try{if(HYC.pend||HYC.shown)return true;if(typeof SEQ_AUTO==='function'&&SEQ_AUTO())return false;const S=G&&G.story;if(!S||typeof storyStep!=='function'||typeof storyChapter!=='function')return false;const s=storyStep();if(!s||s.ch===S.ch)return false;
 const c=storyChapter(s.ch);return!!(c&&!(S.pics&&S.pics[c.n])&&hyArt('chapter_'+c.n));}catch(e){return false;}}
function hyPlaceBusy(){try{if(typeof mode!=='undefined'&&mode==='title')return true;if(hyChapterDue())return true;const L=document.getElementById('seqL');if(L&&!L.hidden)return true;const t=document.getElementById('title');if(t&&!t.hidden)return true;
 if(document.querySelector('.ivFilm,#introFilm'))return true;if(HYC.shown)return true;}catch(e){}return false;}
function hyMapEntered(id){if(typeof G==='undefined'||!G||!cur)return;try{hyBattlePrep();}catch(e){}
 if(cur.inside)return;const reg=hyRegion(cur),prev=HYP.cur;HYP.cur={id,reg};if(prev&&prev.id===id)return;
 // Routen nur beim Wechsel der Region; Orte immer (außer kurz zuvor schon gezeigt)
 if(prev&&hyIsRoute(id)&&prev.reg===reg)return;hyPlacePreload();
 const key=hyPlaceKey(id);if(!key)return;const now=performance.now();
 if(HYP.last[id]&&now-HYP.last[id]<HY_SAME_MS)return;if(HYP.shownAt&&now-HYP.shownAt<HY_GAP_MS&&!HYP.hold)return;if(HYC.at&&now-HYC.at<60e3&&!HYP.hold)return;
 if(hyPlaceBusy())return;HYP.last[id]=now;hyPlaceShow({key,id,name:cur.name,reg});}
// Nachbarorte vorladen (Bild ist beim Betreten schon dekodiert)
function hyPlacePreload(){try{const L=(cur&&cur.links)||{};for(const d in L){const k=hyPlaceKey(L[d]);if(k)hyImg(hyArt(k));}}catch(e){}}
function hyPlaceShow(o){const src=hyArt(o.key);HYP.lastKey=o.key;HYP.count++;HYP.shownAt=performance.now();if(hyAuto()||!src)return;const tok=++HYP.token;
 // schon dekodiert (Nachbarort vorgeladen) → sofort, noch vor dem ersten Bild der neuen Karte; sonst nur, solange höchstens ≈ 10 Bilder der Karte gezeigt wurden (kein spätes Aufploppen)
 const rd=hyImgReady(src);if(rd){hyPlaceOpen(o,rd,tok);return;}let fr=0;const tick=()=>{if(++fr<10&&tok===HYP.token&&!HYP.el)requestAnimationFrame(tick);};requestAnimationFrame(tick);
 hyImg(src).then(img=>{if(!img||tok!==HYP.token)return;if(fr>=10&&!HYP.hold)return;if(cur&&cur.id!==o.id)return;hyPlaceOpen(o,img,tok);});}
function hyPlaceOpen(o,img,tok){hyPlaceClose(true);const R=HY_REGN[o.reg]||HY_REGN.lichtlande,tm=hyTime(),el=document.createElement('div');el.id='hyPlace';el.className='hyPl t-'+tm;
 el.innerHTML=`<div class="hyPlImg"></div><div class="hyPlT"><small>${R[0]} · ${R[1]}</small><b></b><i></i></div>`;el.querySelector('b').textContent=o.name||'';
 const im=img.cloneNode();im.alt='';im.decoding='sync';el.querySelector('.hyPlImg').appendChild(im);el.setAttribute('role','img');el.setAttribute('aria-label',o.name||'Ort');
 document.body.appendChild(el);HYP.el=el;HYP.shown=true;document.body.classList.add('hy-pl');held=null;
 const skip=e=>{if(e)e.preventDefault();hyPlaceClose();};el.addEventListener('pointerdown',skip);
 el._key=e=>{if(HYP.el!==el)return;if(['Enter','Space','Escape','KeyX','KeyE','KeyM'].includes(e.code)){e.stopImmediatePropagation();skip(e);}};window.addEventListener('keydown',el._key,true);
 requestAnimationFrame(()=>{el.classList.add('on');});
 // Spielsteuerung ruht, solange das Bild deckt (Tür-Blende setzt mode danach selbst zurück → je Bild prüfen)
 const guard=()=>{if(HYP.el!==el)return;if(typeof mode!=='undefined'){if(mode==='world'){mode='wait';HYP.wasWorld=true;}else if(mode==='dialog'||mode==='battle'){hyPlaceClose();return;}}requestAnimationFrame(guard);};guard();
 el._to=setTimeout(()=>{if(!HYP.hold)hyPlaceClose();},hyRed()?900:HY_PLACE_MS);}
function hyPlaceClose(now){const el=HYP.el;if(!el)return;HYP.el=null;HYP.shown=false;HYP.closedAt=performance.now();clearTimeout(el._to);if(el._key)window.removeEventListener('keydown',el._key,true);document.body.classList.remove('hy-pl');
 try{const mc=document.getElementById('mapCard');if(mc)mc.classList.remove('on');}catch(e){}
 if(HYP.wasWorld&&typeof mode!=='undefined'&&mode==='wait')mode='world';HYP.wasWorld=false;
 if(now){el.remove();return;}el.classList.add('out');el.classList.remove('on');setTimeout(()=>el.remove(),hyRed()?150:700);}
if(typeof loadMap==='function'){const _lmH2=loadMap;loadMap=function(id,x,y){const r=_lmH2.apply(this,arguments);try{hyMapEntered(id);}catch(e){console.error('Hybrid H2',e);}return r;};}

// ===================== 4) Kapitel-Standbilder =====================
// Standbild aus dem Intro-Film (Nutzermaterial, public/art/chapter_<n>.webp) + Kapitelnummer, Titel, ein kurzer Satz
const HY_CHAP={1:'Heute beginnt dein großes Abenteuer.',2:'Im grünen Wald wartet ein Kristall auf Hilfe.',3:'Am Meer zeigt sich, wie stark Freunde sind.',4:'Hoch über den Wolken weht ein wilder Wind.',
 5:'Im ewigen Eis schläft ein altes Geheimnis.',6:'Am Vulkan hilfst du einem Freund in Not.',7:'Tief im Berg leuchten die Kristalle.',8:'Auch im Dunkeln gibt es ein Licht.',
 9:'Jetzt sollen alle Kristalle wieder zusammen singen.',10:'Ganz Veyra feiert mit dir.'};
const HYC={shown:false,el:null,hold:0,at:0,lastN:null,count:0,pend:false};
function hyChapterSeen(n){try{const S=G&&G.story;return!!(S&&S.pics&&S.pics[n]);}catch(e){return false;}}
// n = Kapitel (1–8, 9 Finale, 10 Epilog); o.then = danach (Kapitelkarte), o.force = auch wenn schon gezeigt
function hyChapterShow(n,o){o=o||{};const then=typeof o.then==='function'?o.then:null,done=()=>{if(then)try{then();}catch(e){console.error(e);}};
 const c=typeof storyChapter==='function'?storyChapter(n):null,key='chapter_'+n,src=hyArt(key);if(!c||!src||!G){done();return false;}
 const S=G.story=G.story||{ch:0,help:{},seen:{}};S.pics=S.pics||{};if(S.pics[n]&&!o.force){done();return false;}
 S.pics[n]=1;HYC.lastN=n;HYC.count++;HYC.at=performance.now();if(hyAuto()){done();return true;}
 const go=()=>hyImg(src).then(img=>{HYC.pend=false;if(!img){done();return;}hyChapterOpen(c,img,done);});
 const wait=()=>{const nw=performance.now(),rest=Math.max(HYP.shownAt?HYP.shownAt+3000-nw:0,HYP.closedAt?HYP.closedAt+600-nw:0);if(HYP.shown||rest>0){setTimeout(wait,HYP.shown?200:Math.max(40,rest));return;}go();};
 HYC.pend=true;hyImg(src);wait();return true;}
function hyChapterOpen(c,img,done){hyChapterClose(true);if(HYP.el)hyPlaceClose(true);const lab=c.finale?'Finale':c.epilog?'Epilog':'Kapitel '+c.n,el=document.createElement('div');el.id='hyChap';el.className='hyCh';
 const col=(typeof PALETTE!=='undefined'&&PALETTE.el&&PALETTE.el[c.el]&&PALETTE.el[c.el].c)||'#d81b72';el.style.setProperty('--hyc',col);
 el.innerHTML='<div class="hyChImg"></div><div class="hyChT"><small></small><b></b><p></p><i></i></div><span class="hyChSkip" aria-hidden="true">Tippen zum Weiterspielen</span>';
 el.querySelector('small').textContent=lab+' · '+c.reg;el.querySelector('b').textContent=typeof kanonText==='function'?kanonText(c.title):c.title;el.querySelector('p').textContent=HY_CHAP[c.n]||'';
 const im=img.cloneNode();im.alt='';el.querySelector('.hyChImg').appendChild(im);el.setAttribute('role','dialog');el.setAttribute('aria-label',lab+': '+(el.querySelector('b').textContent));
 document.body.appendChild(el);HYC.el=el;HYC.shown=true;HYC.done=done;held=null;const pm=typeof mode!=='undefined'?mode:null;if(pm==='world')mode='wait';HYC.pm=pm;
 const t0=performance.now(),skip=e=>{if(e)e.preventDefault();if(performance.now()-t0<1000)return;hyChapterClose();};el.addEventListener('pointerdown',skip);HYC.key=e=>{if(e.code==='Enter'||e.code==='Space'||e.code==='Escape'||e.code==='KeyX'||e.code==='KeyE'||e.code==='KeyM'){e.stopImmediatePropagation();if(!e.repeat)skip(e);else e.preventDefault();}};window.addEventListener('keydown',HYC.key,true);
 try{sfx('lvl');}catch(e){}requestAnimationFrame(()=>el.classList.add('on'));setTimeout(()=>el.classList.add('can'),1000);el._to=setTimeout(()=>{if(!HYC.hold)hyChapterClose();},hyRed()?3200:4800);}
function hyChapterClose(now){const el=HYC.el;if(!el)return;HYC.el=null;HYC.shown=false;clearTimeout(el._to);if(HYC.key)window.removeEventListener('keydown',HYC.key,true);HYC.key=null;
 if(HYC.pm==='world'&&typeof mode!=='undefined'&&mode==='wait')mode='world';HYC.pm=null;const d=HYC.done;HYC.done=null;
 if(now){el.remove();if(d)d();return;}el.classList.remove('on');el.classList.add('out');setTimeout(()=>{el.remove();if(d)d();},hyRed()?150:650);}
