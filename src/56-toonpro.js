// ===== VEYRA – Toon-Pro-Shader (Pilot 3D-Modelle, 12.11.) =====
// Weicher Toon für gebaute GLB-Modelle (three r128, keine Bibliothek): Wrap-Licht → 2 weiche Stufen, farbige Schatten, Hautstreuung an der
// Schattenkante, Randlicht, Glanz (Haar/Metall/Glas), Leuchtteile, Augen mit wanderndem Glanzpunkt; Inverted-Hull-Umriss mit geglätteten
// Normalen (Breite in Pixeln, Maske je Ecke, Farbe aus der Textur). Farben: Textur sRGB → linear rechnen → Tonemapping → sRGB-Ausgabe
// (bei renderer.outputEncoding=Linear im Shader, sonst über die three-Kodierung) – im Spiel (Linear) und in sRGB-Szenen gleich.
// Masken (COLOR_0 aus dem Bauskript): r = Umrissbreite, g = Hautstreuung, b = Glanz, a = Leuchten.
// API: toonProMat(map,{normalMap,eye,alphaTest,...}) · toonProOutline(mesh,variante) · toonProApply(root,{outline:'duenn'|'fast_keine'|'aus'}) · toonProSync(renderer)
const TOONPRO={mats:new Set(),ol:new Set(),res:new THREE.Vector2(1600,900),variants:{duenn:{px:1.35,dark:.32},fast_keine:{px:.55,dark:.55},aus:{px:0,dark:1}}};
const TP_VS=`
attribute vec4 color;varying vec2 vUv;varying vec3 vN;varying vec3 vV;varying vec4 vMask;uniform float uHasMask;
#include <common>
#include <skinning_pars_vertex>
#include <morphtarget_pars_vertex>
#include <fog_pars_vertex>
void main(){
 #include <beginnormal_vertex>
 #include <morphnormal_vertex>
 #include <skinbase_vertex>
 #include <skinnormal_vertex>
 #include <defaultnormal_vertex>
 #include <begin_vertex>
 #include <morphtarget_vertex>
 #include <skinning_vertex>
 #include <project_vertex>
 #include <fog_vertex>
 vUv=uv;vN=normalize(transformedNormal);vV=-mvPosition.xyz;vMask=uHasMask>.5?color:vec4(1.,.3,0.,0.);
}`;
const TP_FS=`
uniform sampler2D map;uniform sampler2D normalMap;uniform float uNrm;uniform float uEye;uniform float uAlphaTest;uniform float uSrgb;uniform float uVtm;
uniform vec3 uTint;uniform vec3 uShade;uniform float uShadowLv;uniform float uBright;uniform float uWrap;uniform float uT1;uniform float uT2;uniform float uSoft;
uniform vec3 uSSS;uniform vec3 uRim;uniform float uRimStr;uniform float uGlow;uniform float uFlash;uniform float uRef;uniform float uFig;
varying vec2 vUv;varying vec3 vN;varying vec3 vV;varying vec4 vMask;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
vec3 tpLin(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));}
vec3 tpSrgb(vec3 c){c=max(c,0.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
float tpLum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 tpPerturb(vec3 N,vec3 p,vec2 uv){vec3 q0=dFdx(p),q1=dFdy(p);vec2 s0=dFdx(uv),s1=dFdy(uv);vec3 S=q0*s1.t-q1*s0.t,T=-q0*s1.s+q1*s0.s;
 float l=max(length(S),length(T));if(l<1e-8)return N;S=normalize(S);T=normalize(T);vec3 m=texture2D(normalMap,uv).xyz*2.-1.;m.xy*=uNrm;return normalize(mat3(S,T,N)*m);}
void main(){
 vec4 tx=texture2D(map,vUv);if(tx.a<uAlphaTest)discard;
 vec3 alb=tpLin(tx.rgb)*uTint;vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(vV);
 if(uNrm>0.)N=tpPerturb(N,-vV,vUv);
 vec3 hemi=ambientLightColor;
 #if NUM_HEMI_LIGHTS>0
 for(int i=0;i<NUM_HEMI_LIGHTS;i++){float h=.5*dot(N,hemisphereLights[i].direction)+.5;hemi+=mix(hemisphereLights[i].groundColor,hemisphereLights[i].skyColor,h);}
 #endif
 vec3 dirC=vec3(0.);float ramp=0.,sss=0.,spec=0.,lit=0.;vec3 L0=vec3(.3,.8,.5);
 #if NUM_DIR_LIGHTS>0
 for(int i=0;i<NUM_DIR_LIGHTS;i++){vec3 L=directionalLights[i].direction;vec3 c=directionalLights[i].color;float k=tpLum(c);
  float w=(dot(N,L)+uWrap)/(1.+uWrap);float r=.62*smoothstep(uT1-uSoft,uT1+uSoft,w)+.38*smoothstep(uT2-uSoft,uT2+uSoft,w);
  ramp+=r*k;lit+=k;dirC+=c;sss+=exp(-pow((w-uT1)/.1,2.))*k;vec3 H=normalize(L+V);spec+=smoothstep(.55,.62,pow(max(dot(N,H),0.),48.))*k;if(i==0)L0=L;}
 #endif
 float hl=tpLum(hemi);ramp=lit>0.?ramp/lit:1.;sss=lit>0.?sss/lit:0.;spec=lit>0.?spec/lit:0.;
 float tot=hl+lit;vec3 tint=(hemi+dirC)/max(tpLum(hemi+dirC),1e-4);float lvl=uBright*min(1.25,tot/uRef);
 vec3 shTint=(hemi/max(hl,1e-4))*uShade;
 vec3 shadowC=alb*mix(vec3(1.),alb/max(max(alb.r,max(alb.g,alb.b)),1e-3),.35)*shTint*uShadowLv;
 vec3 col=mix(shadowC,alb*tint,ramp)*lvl;
 col+=uSSS*alb*sss*vMask.g*.55*lvl;
 float fr=pow(1.-max(dot(N,V),0.),3.2);col+=uRim*fr*uRimStr*(.35+.65*smoothstep(-.3,.5,dot(N,L0)))*lvl*(1.-uEye)*(1.-uFig*.65*vMask.g);
 // Figuren (uFig=1): Haar (Glanz-Maske 0,25–0,45) mit weichem anisotropem Glanzband statt Punktglanz
 float hairM=uFig*step(.25,vMask.b)*step(vMask.b,.45)*(1.-uEye);
 col+=tint*spec*vMask.b*.32*lvl*(1.-hairM);
 if(hairM>.5){float hb=N.y*.78+V.y*.12+.04*sin(vUv.x*900.+vUv.y*700.);float band=smoothstep(.36,.44,hb)*(1.-smoothstep(.6,.7,hb));col+=alb*tint*band*.55*lvl*(.45+.55*ramp);}
 if(uEye>.5){col=alb*mix(.8,1.,ramp)*tint*lvl*1.05;vec3 R=reflect(-V,N);
  float g1=pow(max(dot(R,normalize(vec3(-.35,.55,.76))),0.),90.),g2=pow(max(dot(R,normalize(vec3(.4,-.3,.87))),0.),260.);col+=vec3(1.)*(smoothstep(.45,.6,g1)*.9+smoothstep(.4,.55,g2)*.5)*vMask.b;}
 col+=alb*vMask.a*uGlow+vec3(uFlash);
 gl_FragColor=vec4(col,1.);
 if(uVtm>.5)gl_FragColor.rgb=pow(max(gl_FragColor.rgb,0.),vec3(1./2.2));
 #include <tonemapping_fragment>
 if(uSrgb>.5&&uVtm<.5)gl_FragColor.rgb=tpSrgb(gl_FragColor.rgb);
 #include <encodings_fragment>
 #include <fog_fragment>
}`;
// Umriss: Hülle entlang geglätteter Normalen (Attribut aSmooth), Breite in Bildpunkten × Maske r, Farbe = dunkle Texturfarbe
const TP_OVS=`
attribute vec4 color;attribute vec3 aSmooth;uniform float uPx;uniform vec2 uRes;uniform float uHasMask;varying vec2 vUv;
#include <common>
#include <skinning_pars_vertex>
#include <morphtarget_pars_vertex>
#include <fog_pars_vertex>
void main(){
 vec3 objectNormal=aSmooth;
 #include <skinbase_vertex>
 #include <skinnormal_vertex>
 #include <begin_vertex>
 #include <morphtarget_vertex>
 #include <skinning_vertex>
 #include <project_vertex>
 #include <fog_vertex>
 vec3 nv=normalize(normalMatrix*objectNormal);vec2 nc=(projectionMatrix*vec4(nv,0.)).xy;float l=length(nc);
 float w=uPx*(uHasMask>.5?color.r:1.);if(l>1e-5)gl_Position.xy+=nc/l*w*2./uRes*gl_Position.w;gl_Position.z+=.00002*gl_Position.w;vUv=uv;
}`;
const TP_OFS=`uniform sampler2D map;uniform float uDark;uniform float uSrgb;uniform float uVtm;varying vec2 vUv;
#include <common>
#include <fog_pars_fragment>
vec3 tpLin(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));}
void main(){vec3 c=tpLin(texture2D(map,vUv).rgb);c=c*c*uDark*1.6+c*uDark*.2;gl_FragColor=vec4(c,1.);
 if(uVtm>.5)gl_FragColor.rgb=pow(max(gl_FragColor.rgb,0.),vec3(1./2.2));
 #include <tonemapping_fragment>
 if(uSrgb>.5&&uVtm<.5)gl_FragColor.rgb=pow(max(gl_FragColor.rgb,0.),vec3(1./2.2));
 #include <encodings_fragment>
 #include <fog_fragment>
}`;
function toonProMat(map,o){o=o||{};const U=THREE.UniformsUtils.merge([THREE.UniformsLib.lights,THREE.UniformsLib.fog,{
  map:{value:null},normalMap:{value:null},uNrm:{value:0},uEye:{value:o.eye?1:0},uAlphaTest:{value:o.alphaTest||0},uSrgb:{value:1},uVtm:{value:0},uHasMask:{value:1},
  uTint:{value:new THREE.Color(1,1,1)},uShade:{value:new THREE.Color(o.shade||'#b9a6d6')},uShadowLv:{value:o.shadowLv??.62},uBright:{value:o.bright??1.08},
  uWrap:{value:.4},uT1:{value:.4},uT2:{value:.72},uSoft:{value:o.soft??.1},uSSS:{value:new THREE.Color(o.sss||'#ff6a48')},uRim:{value:new THREE.Color(o.rim||'#cfe6ff')},
  uRimStr:{value:o.rimStr??.32},uGlow:{value:o.glow??1.2},uFlash:{value:0},uRef:{value:o.ref??1.5},uFig:{value:o.fig?1:0}}]);
 U.map.value=map;if(o.normalMap){U.normalMap.value=o.normalMap;U.uNrm.value=o.nrm??1;}
 const m=new THREE.ShaderMaterial({uniforms:U,vertexShader:TP_VS,fragmentShader:TP_FS,lights:true,fog:true,skinning:!!o.skinning,morphTargets:!!o.morph});
 m.extensions.derivatives=true;if(o.decal){m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-2;}m.userData.toonPro=1;TOONPRO.mats.add(m);return m;}
// Geglättete Normalen: gleiche Position (gerundet) → gemittelte Normale (Nähte der UV-Inseln reißen die Hülle nicht auf)
function toonProSmooth(g){if(g.attributes.aSmooth)return;const p=g.attributes.position,n=g.attributes.normal,cnt=p.count,map=new Map(),key=i=>Math.round(p.getX(i)*1e4)+'_'+Math.round(p.getY(i)*1e4)+'_'+Math.round(p.getZ(i)*1e4);
 const ks=new Array(cnt);for(let i=0;i<cnt;i++){const k=ks[i]=key(i);let a=map.get(k);if(!a)map.set(k,a=[0,0,0]);a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);}
 const o=new Float32Array(cnt*3);for(let i=0;i<cnt;i++){const a=map.get(ks[i]),l=Math.hypot(a[0],a[1],a[2])||1;o[i*3]=a[0]/l;o[i*3+1]=a[1]/l;o[i*3+2]=a[2]/l;}g.setAttribute('aSmooth',new THREE.BufferAttribute(o,3));}
function toonProOutline(mesh,variant){const V=TOONPRO.variants[variant||'duenn']||TOONPRO.variants.duenn;if(!V.px)return null;const g=mesh.geometry;toonProSmooth(g);
 const mat=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:mesh.material.uniforms?mesh.material.uniforms.map.value:mesh.material.map},uPx:{value:V.px},uRes:{value:TOONPRO.res},uDark:{value:V.dark},uSrgb:{value:1},uVtm:{value:0},uHasMask:{value:g.attributes.color?1:0}}]),
  vertexShader:TP_OVS,fragmentShader:TP_OFS,side:THREE.BackSide,fog:true,skinning:!!mesh.isSkinnedMesh,morphTargets:!!(g.morphAttributes&&g.morphAttributes.position)});
 mat.userData.toonPro=1;mat.userData.px=V.px;TOONPRO.ol.add(mat);
 const o=mesh.isSkinnedMesh?new THREE.SkinnedMesh(g,mat):new THREE.Mesh(g,mat);if(mesh.isSkinnedMesh)o.bind(mesh.skeleton,mesh.bindMatrix);
 if(mesh.morphTargetInfluences){o.morphTargetInfluences=mesh.morphTargetInfluences;o.morphTargetDictionary=mesh.morphTargetDictionary;}
 o.frustumCulled=false;o.userData.outline=1;o.castShadow=false;o.renderOrder=mesh.renderOrder;mesh.add(o);o.position.set(0,0,0);o.quaternion.identity();o.scale.set(1,1,1);
 // Hülle sitzt als Kind im Raum des Netzes – SkinnedMesh rechnet in Knochen-Weltkoordinaten (bindMode attached → Matrix des Netzes), daher keine eigene Verschiebung
 return o;}
// GLB-Materialien → Toon-Pro; Augenmaterial (Name enthält „Augen“) mit Glanz/Alpha-Test, ohne Umriss
function toonProApply(root,opts){opts=opts||{};const list=[];root.traverse(m=>{if(m.isMesh&&!m.userData.outline)list.push(m);});
 for(const m of list){const src=m.material,eye=/augen/i.test(src.name||''),map=src.map;if(map){map.encoding=THREE.LinearEncoding;map.anisotropy=4;map.needsUpdate=true;}
  const nm=src.normalMap||null;if(nm)nm.encoding=THREE.LinearEncoding;
  m.material=toonProMat(map,Object.assign({normalMap:eye?null:nm,eye,alphaTest:eye?.5:0,decal:eye,skinning:!!m.isSkinnedMesh,morph:!!(m.geometry.morphAttributes&&m.geometry.morphAttributes.position)},opts.mat||{}));
  m.material.uniforms.uHasMask.value=m.geometry.attributes.color?1:0;m.castShadow=!eye;m.receiveShadow=false;m.frustumCulled=false;
  if(!eye&&opts.outline!=='aus')toonProOutline(m,opts.outline||'duenn');}
 return root;}
// Je Bild: Ausgabekodierung + Auflösung für Umrissbreite übernehmen (Umriss skaliert mit der Bildhöhe, Bezug 900 Zeilen)
function toonProSync(r){if(!r)return;const s=r.getDrawingBufferSize?r.getDrawingBufferSize(new THREE.Vector2()):TOONPRO.res;TOONPRO.res.set(s.x,s.y);
 const srgb=r.outputEncoding===THREE.sRGBEncoding?0:1,vtm=r.toneMapping===THREE.CustomToneMapping?1:0,k=Math.max(.6,s.y/900);for(const m of TOONPRO.mats){m.uniforms.uSrgb.value=srgb;m.uniforms.uVtm.value=vtm;}
 for(const m of TOONPRO.ol){m.uniforms.uSrgb.value=srgb;m.uniforms.uVtm.value=vtm;m.uniforms.uPx.value=m.userData.px*k;}}
function toonProVariant(root,variant){const V=TOONPRO.variants[variant]||TOONPRO.variants.duenn;root.traverse(o=>{if(o.userData.outline&&o.material&&o.material.userData.toonPro){o.visible=V.px>0;o.material.userData.px=V.px;o.material.uniforms.uDark.value=V.dark;}});}
