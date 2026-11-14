// ===== VEYRA – Welt-Grafik 2: Bildschärfe, Farbraum/Tonemapping, Qualitätsstufen, Schatten, Bloom (Agent „Welt-Grafik“, Opus hoch, 12.11.) =====
// Doku: docs/welt-grafik.md · Vorschauen: test/welt2/shots.mjs
// Bausteine:
//  1) Bildtransformation „Veyra-Neutral“ (CustomToneMapping, global für die Weltszene): Farben der Welt sind in sRGB angelegt → je Pixel linearisieren,
//     leichte Farbkorrektur (Sättigung, kühle Schatten/warme Lichter), weiches Tonemapping (Khronos-PBR-Neutral-Kurve: Grundfarben bleiben treu,
//     nur Lichter werden sanft gestaucht), zurück nach sRGB. Ersetzt ACES (dunkle, entsättigte Mitten, graue Lichter). Toon-Pro (56) nutzt dieselbe Kurve.
//  2) Qualitätsstufen hoch/mittel/niedrig: Schattenkarte, Schattenausschnitt, Pflanzen-/Partikeldichte, Pixelverhältnis-Deckel, Mindest-Renderskala,
//     Bloom, anisotrope Filterung. Auto-Wahl nach GPU (stark/mittel/schwach) und danach Bildrate (43-perf regelt; erst Effekte, dann Auflösung).
//  3) Schatten: Ausschnitt folgt Figur UND Blickrichtung (mehr Auflösung, wo man hinschaut), Raster gegen Flimmern.
//  4) Bloom (nur „hoch“): Bildkopie → ¼-Auflösung Schwelle + Weichzeichnen → additiv zurück, dazu dezente Vignette. Ohne Zusatz-Render der Szene.
// Schnittstellen: GFX (Zustand) · gfxTier() → Stufenobjekt · gfxForce(t) (Test/Staging, ?gfx=hoch|mittel|niedrig) · gfxStats() → {calls,tris,ms,px,tier}
const GFX={tm:{exp:1.06,sat:.95,split:.035,ds:.04},strong:false,force:null,bloom:null,post:true,stat:{ms:0}};
// ---------- 1) Bildtransformation ----------
(function(){const C=THREE.ShaderChunk,k=GFX.tm,f=v=>(+v).toFixed(4);
 const VTM=`vec3 vtmNeutral(vec3 c){const float sc=.76;const float ds=${f(k.ds)};float x=min(c.r,min(c.g,c.b));float off=x<.08?x-6.25*x*x:.04;c-=off;
 float pk=max(c.r,max(c.g,c.b));if(pk<sc)return c;const float d=1.-sc;float np=1.-d*d/(pk+d-sc);c*=np/pk;float g=1.-1./(ds*(pk-np)+1.);return mix(c,vec3(np),g);}
vec3 CustomToneMapping( vec3 color ){vec3 l=pow(max(color,vec3(0.)),vec3(2.2))*toneMappingExposure*${f(k.exp)};float y=dot(l,vec3(.2126,.7152,.0722));
 l=max(mix(vec3(y),l,${f(k.sat)}),vec3(0.));l*=mix(vec3(1.-${f(k.split)},1.,1.+${f(k.split*1.3)}),vec3(1.+${f(k.split)},1.,1.-${f(k.split*1.1)}),smoothstep(.02,.45,y));
 return pow(vtmNeutral(l),vec3(1./2.2));}`;
 if(C.tonemapping_pars_fragment.includes('CustomToneMapping( vec3 color ) { return color; }'))C.tonemapping_pars_fragment=C.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',VTM);
})();
// ---------- 2) Qualitätsstufen ----------
// shadow = Schattenkarte (0 = nur Kontaktschatten), sExt = halbe Breite des Schattenausschnitts, sFwd = Verschiebung in Blickrichtung,
// dpr = Deckel Pixelverhältnis, smin = kleinste dynamische Renderskala (darunter wird erst die Stufe gesenkt), bloom, aniso, grass = Halmdichte-Faktor
Object.assign(PERF.TIERS.high,{shadow:2048,shadowEvery:1,part:1,veg:.9,fog:1,leaves:34,sExt:12.5,sFwd:5,dpr:2,smin:.85,bloom:1,aniso:8,grass:1});
Object.assign(PERF.TIERS.mid,{shadow:1024,shadowEvery:1,part:.65,veg:.78,fog:.92,leaves:18,sExt:11,sFwd:4.5,dpr:1.75,smin:.75,bloom:0,aniso:4,grass:.8});
Object.assign(PERF.TIERS.low,{shadow:0,shadowEvery:0,part:.3,veg:.5,fog:.78,leaves:0,sExt:10,sFwd:4,dpr:1.5,smin:.7,bloom:0,aniso:2,grass:.55});
// Stabilität R2: Handy/Tablet – Laub/Gras-Instanzen sind der größte Posten (60–90 k Dreiecke auf Route 1) → Dichte je Stufe auf Touch geringer
if(typeof PERF==='object'&&PERF.touch){Object.assign(PERF.TIERS.high,{veg:.7,grass:.8,part:.8});Object.assign(PERF.TIERS.mid,{veg:.55,grass:.65,part:.5,leaves:10});Object.assign(PERF.TIERS.low,{veg:.35,grass:.45,part:.25});}
function gfxTier(){return perfTier();}
// Starke Mobil-GPUs (aktuelle iPhones/iPads, Adreno ≥ 640, Mali-G7x/G6xx-Oberklasse, Immortalis, Xclipse) dürfen auf „hoch“ starten
(function(){try{const c=document.createElement('canvas'),g=c.getContext('webgl');if(!g)return;const e=g.getExtension('WEBGL_debug_renderer_info'),r=e?String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)):'';GFX.gpu=r;
 GFX.strong=/Apple (M\d|GPU)|Adreno \(TM\) (6[4-9]\d|[7-9]\d\d)|Mali-G(7[1-9]|7\d\d|6[1-9]\d|9\d\d)|Immortalis|Xclipse|NVIDIA|GeForce|Radeon (RX|Pro)|Intel\(R\) (Iris|Arc)/i.test(r)&&!/SwiftShader|llvmpipe/i.test(r);
 const lc=g.getExtension('WEBGL_lose_context');if(lc)lc.loseContext();}catch(e){}})();
try{const q=/[?&]gfx=(\w+)/.exec(location.search);if(q){const m={hoch:'high',high:'high',mittel:'mid',mid:'mid',niedrig:'low',low:'low'}[q[1]];if(m)GFX.force=m;}}catch(e){}
function gfxForce(t){GFX.force=t||null;perfStart();if(typeof w3Quality==='function')w3Quality();if(R3&&R3.fit)R3.fit();}
if(typeof perfStart==='function'&&!perfStart._gfx){const _ps=perfStart;perfStart=function(){_ps();
  if(GFX.force&&PERF.TIERS[GFX.force])PERF.tier=GFX.force;else if(SET.gfx==='auto'&&!PERF.weak&&GFX.strong)PERF.tier='high';
  PERF.scale=Math.max(perfTier().smin||.6,PERF.scale);};perfStart._gfx=1;perfStart();}
// Dynamische Auflösung: nie unter die Mindestskala der Stufe – stattdessen (bei Auto) die Stufe senken (Effekte zuerst, Schärfe zuletzt)
if(typeof perfScale==='function'&&!perfScale._gfx){const _sc=perfScale;perfScale=function(k){const mn=perfTier().smin||.6;
  if(k<mn-.001){if(SET.gfx==='auto'&&!GFX.force&&PERF.tier!=='low'){perfSet(PERF.tier==='high'?'mid':'low');_sc(Math.max(perfTier().smin||.6,PERF.scale));return;}k=mn;}_sc(k);};perfScale._gfx=1;}
if(typeof dprCap==='function'&&!dprCap._gfx){const _dc=dprCap;dprCap=function(){const t=perfTier();return Math.min(_dc(),t.dpr||2);};dprCap._gfx=1;}
// Voreinstellungen (Optionen › Qualitätsstufe): Mittel jetzt mit Schatten, Niedrig mit Geräteauflösung (Deckel über dprCap) statt fester 720 Zeilen
try{Object.assign(PRESET.mittel,{res:'auto',fps:30,shadows:1,light:1,particles:1,gfx:'mid'});Object.assign(PRESET.niedrig,{res:'auto',fps:30,shadows:0,light:1,particles:1,gfx:'low'});Object.assign(PRESET.hoch,{res:'auto',fps:60,shadows:1,gfx:'high'});}catch(e){}
// Stufe auf die Welt anwenden (09 w3Quality: Schattenkarte, Pflanzen, Partikel) + Anisotropie, Schattenausschnitt, Bloom
if(typeof w3Quality==='function'&&!w3Quality._gfx){const _wq=w3Quality;w3Quality=function(T){T=T||perfTier();_wq(T);if(!R3||!window.THREE)return;gfxApply(T);};w3Quality._gfx=1;}
function gfxApply(T){try{_gC.t=0;}catch(e){}const sun=R3.sun,cam=sun.shadow.camera,e=T.sExt||13;if(cam.right!==e){cam.left=-e;cam.right=e;cam.top=e;cam.bottom=-e;cam.updateProjectionMatrix();}
 sun.shadow.bias=T.shadow>=2048?-.0005:-.0006;sun.shadow.normalBias=T.shadow>=2048?.03:.035;
 // Baumkronen: Detailstufe der Geometrie je Qualitätsstufe (gleiche Instanzen, nur andere Büschelzahl)
 const ck=typeof crownK==='function'?crownK():null;if(ck)for(const S of Object.values(scenes))S.traverse(o=>{if(o.userData&&o.userData.crown&&o.userData.crownK!==ck){const g=crownGeo(ck);for(const a in g.attributes)o.geometry.setAttribute(a,g.attributes[a]);o.userData.crownK=ck;}});
 const an=Math.min(T.aniso||4,R3.r.capabilities.getMaxAnisotropy()||1);for(const k in W3T){const t=W3T[k];if(t&&t.isTexture&&!t._rt&&t.anisotropy!==an){t.anisotropy=an;t.needsUpdate=true;}}}
// ---------- Renderer einrichten (nach init3d) ----------
if(typeof init3d==='function'&&!init3d._gfx){const _i3=init3d;init3d=function(){const had=!!R3;_i3();if(!had&&R3)gfxSetup();};init3d._gfx=1;}
function gfxSetup(){const r=R3.r;r.toneMapping=THREE.CustomToneMapping;r.shadowMap.type=THREE.PCFSoftShadowMap;
 const r0=r.render.bind(r);GFX.r0=r0;r.info.autoReset=false;// Zähler je Bild (inkl. Schatten- und Bloom-Pässe) statt je render()-Aufruf
 r.render=function(s,c){const scr=r.getRenderTarget()===null,world=s===R3.scene&&scr;if(scr&&(!GFX.bloom||s!==GFX.bloom.scene))r.info.reset();if(world)try{gfxShadowPre(c);}catch(e){}
  const t0=performance.now();r0(s,c);if(world){if(perfTier().bloom&&GFX.post)try{gfxBloom(r);}catch(e){GFX.post=false;console.warn('Bloom aus',e);}GFX.stat.ms=performance.now()-t0;GFX.stat.calls=r.info.render.calls;GFX.stat.tris=r.info.render.triangles;}};
 gfxApply(perfTier());}
// ---------- 3) Schattenausschnitt: Figur + Blickrichtung, auf Texel gerastert ----------
const _gq=new THREE.Vector3();
function gfxShadowPre(c){const sun=R3.sun;if(!sun.castShadow||!c)return;const T=perfTier(),fw=T.sFwd||0;if(!fw)return;
 c.getWorldDirection(_gq);const l=Math.hypot(_gq.x,_gq.z);if(l<1e-3)return;const dx=_gq.x/l*fw,dz=_gq.z/l*fw,q=2*(T.sExt||13)/(T.shadow||1024);
 const tx=sun.target.position.x+dx,tz=sun.target.position.z+dz,sx=Math.round(tx/q)*q-sun.target.position.x,sz=Math.round(tz/q)*q-sun.target.position.z;
 sun.position.x+=sx;sun.position.z+=sz;sun.target.position.x+=sx;sun.target.position.z+=sz;sun.updateMatrixWorld();sun.target.updateMatrixWorld();}
// ---------- 4) Bloom + Vignette (nur „hoch“) ----------
const GFX_QVS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
function gfxBloomInit(){const mk=(fs,u,o)=>new THREE.ShaderMaterial(Object.assign({uniforms:u,vertexShader:GFX_QVS,fragmentShader:fs,depthTest:false,depthWrite:false},o||{}));
 const B={scene:new THREE.Scene(),cam:new THREE.OrthographicCamera(-1,1,1,-1,0,1),w:0,h:0};B.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null);B.quad.frustumCulled=false;B.scene.add(B.quad);
 const rt=()=>new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false});B.a=rt();B.b=rt();
 // Schwelle mit weichem Knie auf ¼ Auflösung (4 bilineare Abgriffe = 16 Bildpunkte)
 B.mPre=mk('uniform sampler2D tSrc;uniform vec2 uPx;uniform float uThr;varying vec2 vUv;vec3 tp(vec2 o){vec3 c=texture2D(tSrc,vUv+o*uPx).rgb;float l=max(c.r,max(c.g,c.b));float k=clamp((l-uThr)/(1.-uThr),0.,1.);return c*k*k;}'+
  'void main(){gl_FragColor=vec4((tp(vec2(-1.,-1.))+tp(vec2(1.,-1.))+tp(vec2(-1.,1.))+tp(vec2(1.,1.)))*.25,1.);}',{tSrc:{value:null},uPx:{value:new THREE.Vector2()},uThr:{value:.8}});
 B.mBlur=mk('uniform sampler2D tSrc;uniform vec2 uDir;varying vec2 vUv;void main(){vec3 c=texture2D(tSrc,vUv).rgb*.227;c+=(texture2D(tSrc,vUv+uDir*1.385).rgb+texture2D(tSrc,vUv-uDir*1.385).rgb)*.316;c+=(texture2D(tSrc,vUv+uDir*3.231).rgb+texture2D(tSrc,vUv-uDir*3.231).rgb)*.07;gl_FragColor=vec4(c,1.);}',{tSrc:{value:null},uDir:{value:new THREE.Vector2()}});
 // Zusammensetzen: Ziel·Vignette + Bloom (Mischung One/SrcAlpha → kein zweites Bild nötig)
 B.mOut=mk('uniform sampler2D tSrc;uniform float uStr;uniform float uVig;uniform vec2 uAsp;varying vec2 vUv;void main(){vec2 d=(vUv-.5)*uAsp;float v=1.-uVig*smoothstep(.35,1.05,dot(d,d)*2.2);gl_FragColor=vec4(texture2D(tSrc,vUv).rgb*uStr,v);}',
  {tSrc:{value:null},uStr:{value:.42},uVig:{value:.16},uAsp:{value:new THREE.Vector2(1,1)}},{blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.SrcAlphaFactor,transparent:true});
 return B;}
const _gv=new THREE.Vector2();
function gfxBloom(r){let B=GFX.bloom;if(!B)B=GFX.bloom=gfxBloomInit();r.getDrawingBufferSize(_gv);const W=_gv.x|0,H=_gv.y|0;if(W<8||H<8)return;
 if(B.w!==W||B.h!==H){B.w=W;B.h=H;if(B.full)B.full.dispose();B.full=new THREE.DataTexture(null,W,H,THREE.RGBAFormat);B.full.minFilter=B.full.magFilter=THREE.LinearFilter;B.full.generateMipmaps=false;B.full.needsUpdate=true;
  const w4=Math.max(2,W>>2),h4=Math.max(2,H>>2);B.a.setSize(w4,h4);B.b.setSize(w4,h4);B.mOut.uniforms.uAsp.value.set(Math.max(1,W/H),Math.max(1,H/W));}
 const ac=r.autoClear,tm=r.toneMapping;r.autoClear=false;
 r.copyFramebufferToTexture(_gv.set(0,0),B.full);
 const pass=(m,tgt)=>{B.quad.material=m;r.setRenderTarget(tgt);if(tgt)r.clear(true,false,false);GFX.r0(B.scene,B.cam);};
 B.mPre.uniforms.tSrc.value=B.full;B.mPre.uniforms.uPx.value.set(1/W,1/H);pass(B.mPre,B.a);
 B.mBlur.uniforms.tSrc.value=B.a.texture;B.mBlur.uniforms.uDir.value.set(1/B.a.width,0);pass(B.mBlur,B.b);
 B.mBlur.uniforms.tSrc.value=B.b.texture;B.mBlur.uniforms.uDir.value.set(0,1/B.a.height);pass(B.mBlur,B.a);
 B.mOut.uniforms.tSrc.value=B.a.texture;pass(B.mOut,null);
 r.autoClear=ac;r.toneMapping=tm;}
// Messwerte für Tests/Staging-Vergleich
function gfxStats(){if(!R3||!R3.r)return null;const cv=R3.r.domElement;return{calls:GFX.stat.calls,tris:GFX.stat.tris,ms:+(PERF.ft||0).toFixed(1),gpu:+GFX.stat.ms.toFixed(1),px:cv.width+'×'+cv.height,tier:PERF.tier,scale:PERF.scale};}
// ---------- Licht-Balance draußen: etwas mehr Sonne, etwas weniger Himmelslicht → klarere Schatten und Formen (nach dem Bild-Licht aus 44-sky) ----------
GFX.lit={sun:1.12,amb:.9};
if(typeof skyFrame==='function'&&!skyFrame._gfx){const _sf=skyFrame;skyFrame=function(S,O,c){_sf(S,O,c);try{if(c&&!c.inside&&!c.encl&&R3){R3.sun.intensity*=GFX.lit.sun;R3.hemi.intensity*=GFX.lit.amb;}}catch(e){}};skyFrame._gfx=1;}
// ---------- Luftperspektive (Runde 2): Weitsicht-Dunst, Bodendunst in der Ferne, Blaustich mit der Entfernung ----------
// Ersetzt die three-Nebel-Chunks global (gilt für alle Materialien mit Nebel). Welthöhe im Vertex-Shader aus mvPosition (starre Kameramatrix).
(function(){const C=THREE.ShaderChunk;if(C.fog_vertex.includes('vFogY'))return;
 C.fog_pars_vertex='#ifdef USE_FOG\n varying float fogDepth;\n varying float vFogY;\n#endif\n';
 C.fog_vertex='#ifdef USE_FOG\n fogDepth = - mvPosition.z;\n vFogY = ( transpose( mat3( viewMatrix ) ) * ( mvPosition.xyz - viewMatrix[ 3 ].xyz ) ).y;\n#endif\n';
 C.fog_pars_fragment='#ifdef USE_FOG\n uniform vec3 fogColor;\n varying float fogDepth;\n varying float vFogY;\n #ifdef FOG_EXP2\n  uniform float fogDensity;\n #else\n  uniform float fogNear;\n  uniform float fogFar;\n #endif\n#endif\n';
 C.fog_fragment='#ifdef USE_FOG\n #ifdef FOG_EXP2\n  float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );\n  float vgF = fogFactor;\n #else\n'+
  '  float fogFactor = smoothstep( fogNear, fogFar, fogDepth );\n  float vgF = smoothstep( fogNear * .5, fogFar * 1.3, fogDepth );\n'+
  '  float vgH = ( 1.0 - exp( - max( fogDepth - fogNear * .25, 0.0 ) / ( fogFar * 1.4 ) ) ) * .36;\n'+
  '  float vgL = exp( - max( vFogY + .2, 0.0 ) * .6 ) * smoothstep( fogNear * .3, fogFar * .9, fogDepth ) * .28;\n'+
  '  fogFactor = 1.0 - ( 1.0 - fogFactor ) * ( 1.0 - vgH ) * ( 1.0 - vgL );\n #endif\n'+
  ' vec3 vgC = mix( fogColor, fogColor * vec3( .88, .96, 1.1 ) + vec3( 0.0, .01, .035 ), vgF * .8 );\n gl_FragColor.rgb = mix( gl_FragColor.rgb, vgC, fogFactor );\n#endif\n';})();
// ---------- Runde 5: Entfernungs-Budget für Figuren-/Terra-Modelle (57/58, nur Schalter an) ----------
// Je Bild vor dem Zeichnen (und danach zurückgesetzt, damit 57/58/09 ihre eigenen Zustände behalten):
//  ab sh Feldern kein Schattenwurf · ab ol Feldern kein Umriss · ab hide Feldern ausgeblendet (Spielfigur nie). Die LOD-Stufen von 57/58 bleiben aktiv.
GFX.mlod={high:{sh:4.5,ol:7,hide:24,lod:5,max:14,nsh:3},mid:{sh:3.5,ol:5,hide:18,lod:4,max:10,nsh:2},low:{sh:0,ol:4,hide:14,lod:3,max:6,nsh:0}};
// Stabilität R2: Handy/Tablet (Touch) strenger – Budget ≈ 80–100 k Dreiecke: Umriss nur nah, LOD1 früh, höchstens 4–8 Modelle, Schatten nur Spielfigur + nächste
GFX.mlodT={high:{sh:5,ol:3,hide:16,lod:3.5,max:8,nsh:2},mid:{sh:4.5,ol:2.2,hide:14,lod:2.8,max:6,nsh:2},low:{sh:0,ol:1.8,hide:12,lod:2.5,max:4,nsh:0}};
const _gM={roots:[],t:0,undo:[],v:new THREE.Vector3()};
function gfxModelRoots(S){const out=[];for(const o of S.children){const U=o.userData||{};if(U.pilot||U.lod0||U.lod1){out.push(o);continue;}for(const c of o.children){const V=c.userData||{};if(V.pilot||V.lod0||V.lod1)out.push(c);}}return out;}
function gfxModelPre(S,c){const now=performance.now();if(now-_gM.t>500||_gM.S!==S){_gM.t=now;_gM.S=S;_gM.roots=gfxModelRoots(S);const w=_gM.wol=[];for(const o of S.children){if(o.isMesh&&o.userData&&o.userData.outline)w.push(o);else for(const q of o.children)if(q.isMesh&&q.userData&&q.userData.outline)w.push(q);}}if(!c)return;
 const tn=perfTier().name,touch=typeof PERF==='object'&&PERF.touch,L=gfxBudL(touch,tn),cp=c.getWorldPosition(_gM.v),u=_gM.undo;gfxBudPre(S,u,c);
 // Umrisshüllen der Welt (Häuser, Bäume): auf „niedrig“ und am Handy unter „hoch“ aus (≈ 25 k Dreiecke in Morgenau)
 if(tn==='low'||(touch&&tn!=='high'))for(const m of _gM.wol)if(m.visible){m.visible=false;u.push([m,'visible',true]);}
 if(!_gM.roots.length)return;
 // Entfernung zur Spielfigur (nicht zur Kamera: die Kamera steht 2–4 Felder dahinter); nach Entfernung sortiert → Budget (max. Modelle, Schatten nur die nächsten)
 const pp=R3.player?R3.player.position:cp,list=_gM.list||(_gM.list=[]);list.length=0;
 for(const r of _gM.roots){if(!r.visible||r===R3.player||r.parent===R3.player)continue;// Heldin zählt nicht zum Budget-Kontingent (immer Schatten, nie ausgeblendet)
 const p=r.userData._gp||(r.userData._gp=new THREE.Vector3());r.getWorldPosition(p);r.userData._gd=Math.hypot(p.x-pp.x,p.z-pp.z);list.push(r);}
 list.sort((a,b)=>a.userData._gd-b.userData._gd);let ni=0,si=0;
 for(const r of list){const d=r.userData._gd;ni++;
  if((d>L.hide||ni>(L.max||99))&&!r.userData.held){r.visible=false;u.push([r,'visible',true]);continue;}
  const shOk=si<(L.nsh??9)&&d<=L.sh;if(shOk)si++;
  {const lo=r.userData.lod;if(lo&&lo[0]&&lo[1]&&d>L.lod&&lo[0].visible){lo[0].visible=false;u.push([lo[0],'visible',true]);if(!lo[1].visible){lo[1].visible=true;u.push([lo[1],'visible',false]);}}}// Figuren-LOD1 (57) schon ab lod Feldern
  if(!shOk||d>L.ol){let ms=r.userData._gm;if(!ms){ms=[];r.traverse(m=>{if(m.isMesh)ms.push(m);});r.userData._gm=ms;}
   for(const m of ms){if(!shOk&&m.castShadow){m.castShadow=false;u.push([m,'castShadow',true]);}if(d>L.ol&&m.userData.outline&&m.visible){m.visible=false;u.push([m,'visible',true]);}}}}}
function gfxModelPost(){const u=_gM.undo;for(let i=u.length-1;i>=0;i--){const[o,k,v]=u[i];o[k]=v;}u.length=0;}
if(typeof gfxSetup==='function'&&!gfxSetup._m){const _gs=gfxSetup;gfxSetup=function(){_gs();const r=R3.r,rr=r.render;r.render=function(s,c){const w=s===R3.scene&&r.getRenderTarget()===null;if(w)try{gfxModelPre(s,c);}catch(e){}try{rr.call(r,s,c);}finally{if(w){gfxModelPost();try{gfxBudTick();}catch(e){}}}};};gfxSetup._m=1;}
// ---------- Stabilität R2: Budget DURCHSETZEN (Dreiecke + Draw-Calls je Bild inkl. Schattenpass) ----------
// Budget je Gerät: Handy/Tablet ≤ 100 k / ≤ 60 · PC integriert (Iris Xe u. ä.) ≤ 150 k / ≤ 110 · PC dediziert ≤ 250 k / ≤ 150 (GFX.budget, überschreibbar).
// Stellstufe GFX.bud.lvl 0–5 wirkt je Bild (vor dem Zeichnen gesetzt, danach zurückgesetzt wie gfxModelPre): Modell-Anzahl/-Entfernungen, Schattenwurf, Umriss,
// Laub-/Gras-Dichte (Instanzzahl, zufällige Reihenfolge → gleichmäßig ausgedünnt) und Laub-Schatten. Keine Shader-/Szenen-Neubauten.
// Strenger wird es sofort (4 von 6 Bildern über Budget; weit drüber → 2–3 Stufen auf einmal); lockerer NUR beim Kartenwechsel (Start eine Stufe unter der, die diese Karte zuletzt brauchte) → kein Pendeln.
GFX.budget={touch:[100000,60],igpu:[150000,110],dgpu:[250000,150]};
// je Stufe: m = Anteil Modelle, d = Entfernungen, v = Laub-/Gras-Dichte, vsh = Laub wirft Schatten, nsh = max. Figuren mit Schatten (außer Heldin)
// wsh0 = Welt wirft keinen Sonnenschatten, ol0 = kein Umriss an Figuren/Terras, po = kein Umriss an der Heldin (die Hülle kostet so viel wie der Körper), pl = Heldin als LOD1 (50 %, derzeit keine Stufe)
const GFX_BL=[{m:1,d:1,v:1,vsh:1},{m:.75,d:.85,v:.8,vsh:1},{m:.6,d:.72,v:.62,vsh:1},{m:.5,d:.62,v:.5,vsh:0,nsh:2,ol0:1,wsh0:1},{m:.38,d:.52,v:.4,vsh:0,nsh:1,ol0:1,po:1,wsh0:1},{m:.25,d:.42,v:.3,vsh:0,nsh:0,ol0:1,po:1,wsh0:1}];
GFX.bud={lvl:0,map:null,memo:{},hist:[],cool:0,ups:0,dev:null,t:0,c:0};
function gfxBudDev(){const B=GFX.bud;if(B.dev)return B.dev;let d='igpu';try{if(typeof PERF==='object'&&PERF.touch)d='touch';else if(typeof STAB==='object'&&STAB.cls==='dgpu')d='dgpu';}catch(e){}return B.dev=d;}
function gfxBudL(touch,tn){const L0=((touch?GFX.mlodT:GFX.mlod)[tn])||GFX.mlod.high,b=GFX_BL[GFX.bud.lvl]||GFX_BL[0];if(!GFX.bud.lvl)return L0;
 const K=GFX.bud.L||(GFX.bud.L={});K.sh=L0.sh*b.d;K.ol=b.ol0?-1:L0.ol*b.d;K.hide=Math.max(6,L0.hide*b.d);K.lod=L0.lod*b.d;K.max=Math.max(1,Math.round((L0.max||8)*b.m));K.nsh=Math.min(L0.nsh??9,b.nsh??9);return K;}
// Instanzen (Bäume/Kronen/Büsche/Felsen/Blumen/Gras aus 09 inst(), erkannt an userData.n0) je Instanz ausdünnen: hinter der Kamera (4 Felder Rand für Schatten)
// und jenseits der Budget-Entfernung fallen weg. Die Instanzen werden nach vorn umsortiert (Original bleibt in _M0), count = sichtbare – nur Matrizen, kein Neubau.
// Nur Meshes ohne eigene Instanz-Attribute (Wasser u. ä. bleiben unberührt). Neu berechnet bei 0,4 Feld Weg, 6° Drehung oder alle 0,5 s.
GFX.cullR={touch:[40,30,24,18,13,10],igpu:[60,42,32,26,20,16],dgpu:[1e9,60,42,32,26,20]};
const _gC={S:null,L:[],t:0,x:1e9,z:1e9,a:0,f:new THREE.Vector3(),n:0};
function gfxCullList(S){const L=[];S.traverse(o=>{if(!o.isInstancedMesh||o.userData.n0==null)return;const g=o.geometry;for(const k in g.attributes)if(g.attributes[k].isInstancedBufferAttribute)return;
  const n0=o.userData.n0,M=o.instanceMatrix.array,P=new Float32Array(n0*2);for(let i=0;i<n0;i++){P[i*2]=M[i*16+12];P[i*2+1]=M[i*16+14];}
  L.push({o,n0,M0:M.slice(0,n0*16),C0:o.instanceColor?o.instanceColor.array.slice(0,n0*3):null,P,veg:!!o.userData.veg});});return L;}
function gfxCullTick(S,c){const now=performance.now();if(_gC.S!==S){_gC.S=S;_gC.L=gfxCullList(S);_gC.t=0;}if(!_gC.L.length||!R3.player)return;
 const pp=R3.player.position,f=c.getWorldDirection(_gC.f),a=Math.atan2(f.x,f.z);let da=Math.abs(a-_gC.a);if(da>Math.PI)da=2*Math.PI-da;
 if(now-_gC.t<500&&Math.hypot(pp.x-_gC.x,pp.z-_gC.z)<.4&&da<.1)return;_gC.t=now;_gC.x=pp.x;_gC.z=pp.z;_gC.a=a;
 const R=(GFX.cullR[gfxBudDev()]||GFX.cullR.igpu)[GFX.bud.lvl]||40,R2=R*R,fl=Math.hypot(f.x,f.z)||1,fx=f.x/fl,fz=f.z/fl,cx=c.position.x,cz=c.position.z,veg=perfTier().veg??1;let tot=0;
 for(const E of _gC.L){const o=E.o,M=o.instanceMatrix.array,C=o.instanceColor?o.instanceColor.array:null,lim=E.veg?Math.max(1,Math.round(E.n0*veg)):E.n0;let k=0;
  for(let i=0;i<lim;i++){const x=E.P[i*2],z=E.P[i*2+1],dx=x-pp.x,dz=z-pp.z;if(dx*dx+dz*dz>R2)continue;if((x-cx)*fx+(z-cz)*fz<-4)continue;
   M.set(E.M0.subarray(i*16,i*16+16),k*16);if(C&&E.C0)C.set(E.C0.subarray(i*3,i*3+3),k*3);k++;}
  o.count=Math.max(0,k);o.instanceMatrix.needsUpdate=true;if(C)o.instanceColor.needsUpdate=true;tot+=k;}_gC.n=tot;}
function gfxBudPre(S,u,c){const b=GFX_BL[GFX.bud.lvl]||GFX_BL[0];try{if(c)gfxCullTick(S,c);}catch(e){}
 for(const E of _gC.L)if(E.o.count===0&&E.o.visible){E.o.visible=false;u.push([E.o,'visible',true]);}// leere Instanz-Meshes: kein Draw-Call (auch nicht im Schattenpass)
 // Sonnenschatten nur von Heldin + nächsten Figuren (Budget aus gfxModelPre): Welt-Meshes (Bäume, Häuser, Zäune …) werfen am Handy keinen Schatten
 // (spart den halben Schattenpass – Dreiecke UND Draw-Calls), am PC erst ab Stufe 3. Kontaktschatten/AO bleiben. Je Bild gesetzt und zurückgesetzt → kein Shader-Neubau.
 if(b.wsh0||gfxBudDev()==='touch'){const now=performance.now();let W=_gC.wc;if(!W||W.S!==S||now-W.t>2000){W=_gC.wc={S,t:now,l:[]};const skip=o=>{for(let q=o;q&&q!==S;q=q.parent){const U=q.userData||{};if(q===R3.player||U.pilot||U.tm||U.lod0||U.lod1||U.held)return true;}return false;};
   S.traverse(o=>{if(o.isMesh&&o.castShadow&&!skip(o))W.l.push(o);});}
  for(const m of W.l)if(m.castShadow){m.castShadow=false;u.push([m,'castShadow',true]);}}
 if((b.po||b.pl)&&R3.player){const pl=R3.player,now=performance.now();let C=_gM.pc;if(!C||C.o!==pl||now-C.t>500){C=_gM.pc={o:pl,t:now,ms:[],lod:null};pl.traverse(m=>{if(m.isMesh)C.ms.push(m);if(!C.lod&&m.userData&&m.userData.lod)C.lod=m.userData.lod;});}
  if(b.po)for(const m of C.ms)if(m.userData.outline&&m.visible){m.visible=false;u.push([m,'visible',true]);}
  const lo=b.pl&&C.lod;if(lo&&lo[0]&&lo[1]&&lo[0].visible){lo[0].visible=false;u.push([lo[0],'visible',true]);if(!lo[1].visible){lo[1].visible=true;u.push([lo[1],'visible',false]);}}}
 if(b.v>=1&&b.vsh)return;const V=S.userData&&S.userData.veg;if(!V)return;
 for(const im of V){if(b.v<1){const n=Math.max(1,Math.round(im.count*b.v));if(n<im.count){u.push([im,'count',im.count]);im.count=n;}}if(!b.vsh&&im.castShadow){im.castShadow=false;u.push([im,'castShadow',true]);}}}
function gfxBudTick(){const B=GFX.bud,st=GFX.stat;if(!R3||typeof mode!=='undefined'&&mode!=='world')return;
 if(B.map!==R3.mapId){if(B.map)B.memo[B.map]=B.lvl;B.map=R3.mapId;B.lvl=Math.max(0,(B.memo[B.map]||0)-1);B.hist.length=0;B.cool=3;return;}
 const lim=GFX.budget[gfxBudDev()]||GFX.budget.igpu,q=Math.max(st.tris/lim[0],st.calls/lim[1]);B.t=st.tris;B.c=st.calls;
 if(B.cool>0){B.cool--;return;}B.hist.push(q);if(B.hist.length>6)B.hist.shift();
 if(B.hist.length>=6&&B.hist.filter(x=>x>1).length>=4&&B.lvl<GFX_BL.length-1){const m=B.hist.slice().sort((a,b)=>a-b)[3];B.lvl=Math.min(GFX_BL.length-1,B.lvl+(m>1.6?3:m>1.3?2:1));B.ups++;B.hist.length=0;B.cool=2;}}
