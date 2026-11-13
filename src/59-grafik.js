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
function gfxApply(T){const sun=R3.sun,cam=sun.shadow.camera,e=T.sExt||13;if(cam.right!==e){cam.left=-e;cam.right=e;cam.top=e;cam.bottom=-e;cam.updateProjectionMatrix();}
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
GFX.mlod={high:{sh:4.5,ol:7,hide:24,lod:5},mid:{sh:3.5,ol:5,hide:18,lod:4},low:{sh:0,ol:4,hide:14,lod:3}};
const _gM={roots:[],t:0,undo:[],v:new THREE.Vector3()};
function gfxModelRoots(S){const out=[];for(const o of S.children){const U=o.userData||{};if(U.pilot||U.lod0||U.lod1){out.push(o);continue;}for(const c of o.children){const V=c.userData||{};if(V.pilot||V.lod0||V.lod1)out.push(c);}}return out;}
function gfxModelPre(S,c){const now=performance.now();if(now-_gM.t>500||_gM.S!==S){_gM.t=now;_gM.S=S;_gM.roots=gfxModelRoots(S);}if(!_gM.roots.length||!c)return;
 const L=GFX.mlod[perfTier().name]||GFX.mlod.high,cp=c.getWorldPosition(_gM.v),u=_gM.undo;
 for(const r of _gM.roots){if(!r.visible||r===R3.player)continue;let p=r.userData._gp||(r.userData._gp=new THREE.Vector3());r.getWorldPosition(p);const d=p.distanceTo(cp);
  if(d>L.hide&&!r.userData.held){r.visible=false;u.push([r,'visible',true]);continue;}
  {const lo=r.userData.lod;if(lo&&lo[0]&&lo[1]&&d>L.lod&&lo[0].visible){lo[0].visible=false;u.push([lo[0],'visible',true]);if(!lo[1].visible){lo[1].visible=true;u.push([lo[1],'visible',false]);}}}// Figuren-LOD1 (57) schon ab lod Feldern
  if(d>L.sh||d>L.ol){let ms=r.userData._gm;if(!ms){ms=[];r.traverse(m=>{if(m.isMesh)ms.push(m);});r.userData._gm=ms;}
   for(const m of ms){if(d>L.sh&&m.castShadow){m.castShadow=false;u.push([m,'castShadow',true]);}if(d>L.ol&&m.userData.outline&&m.visible){m.visible=false;u.push([m,'visible',true]);}}}}}
function gfxModelPost(){const u=_gM.undo;for(let i=u.length-1;i>=0;i--){const[o,k,v]=u[i];o[k]=v;}u.length=0;}
if(typeof gfxSetup==='function'&&!gfxSetup._m){const _gs=gfxSetup;gfxSetup=function(){_gs();const r=R3.r,rr=r.render;r.render=function(s,c){const w=s===R3.scene&&r.getRenderTarget()===null;if(w)try{gfxModelPre(s,c);}catch(e){}try{rr.call(r,s,c);}finally{if(w)gfxModelPost();}};};gfxSetup._m=1;}
