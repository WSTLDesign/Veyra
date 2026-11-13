// ===== VEYRA – 3D-Ansichten (3. Person & Ego) · Welt-Grafik & Look =====
/* ---------------------------------------------------------------------------
 WELT-BAUSTEINE (für Agent H, Phase 4) – alles optional, Unbekanntes fällt auf 'default' zurück.
 MAPS[id].theme:
   default  Wiese/Laubwald, Hügel + Berge am Horizont        forest   dichte Bäume (Laub+Nadel), gedämpftes Licht, Nebel näher
   snow     Nadelbäume mit Schnee, helle Hügel                mountain hohes Relief, Nadelbäume, Gipfel mit Schneekappe, Dunst
   beach    Palmen, Meer am Kartenrand (wo Wasser am Rand)    sea|islands  Palmen, offenes Meer rundum, Sandbänke
   ship     Schiffsdeck: Planken, Rumpf, Meer rundum; mit inside:1 = Kabine (Holzwände, Bullaugen)
   swamp    trüb, grünlicher Dunst                            whisper  mystisch, Irrlichter
   cave     Fels, Kristall-Leuchten, Fackeln, Felsbrocken     ruin|tower  Steinplatten, (zerbrochene) Säulen statt Bäume
   volcano  Lava statt Wasser, Glut-Funken, Vulkan am Horizont, Hitzeflimmern   ember  warme Schlucht, Funken
   desert   Kakteen, Dünen, Hitzedunst                        plant    Kraftwerk: Metallboden, Masten mit Leuchtstreifen
   base     Bösewicht-Basis: dunkel, geschlossen, rotes Akzentlicht      league  hell, Marmor, Säulen, Banner, Goldfunken
   inside   Innenraum (automatisch für Gebäude)
 Kachelzeichen: . Boden  , Weg  " hohes Gras (Instanzen, Wind, Wegdrücken)  F Blumen  T Baum/Variante je Theme  R Fels
   X Klippe/Wand (Höhle, Metall, Holz je Theme)  ~ Q Wasser (Lava bei volcano)  = Steg  I Eis (glänzend)  c : Höhlenboden
   D G (Feldhindernisse, 05-field)  0-9 Türen  h P M A L Gebäude (Haus, Kreaturenstation, Laden, Arena, Labor)
   innen: W Wand  B Regal  C Theke  K Kiste  R Pflanze
 MAPS[id].landmarks=[{type,x,y,r?}] type: turm|tower, bruecke|bridge, kran|crane, leuchtturm|lighthouse, brunnen|fountain, mast
   (x,y in Kacheln; r = Drehung in Rad). Rein dekorativ – Kollision über Kacheln regeln (z. B. X darunter).
 Wetter: G.weather[mapId] ∈ klar|regen|schnee|sand|nebel|gewitter; setWeatherVisual(state|null) überschreibt (null = Spielstand).
 Look-Helfer: toonMat(color,opts) addOutline(mesh,width,color) addRim(mat,color,strength) blobShadow(obj,radius) spawnFx(kind,x,y,z)
   spawnFx-kinds: dust splash wake wind land rustle sparkle
--------------------------------------------------------------------------- */
let view='2d',R3=null,turnT=0;const scenes={};
const VIEWS=['2d','third','ego'],VNAME={'2d':'Draufsicht','third':'3. Person','ego':'Ego'};
const YAW={up:0,left:Math.PI/2,down:Math.PI,right:-Math.PI/2};
function setView(v,quiet){if(v!=='2d'&&!window.THREE){toast('3D konnte nicht geladen werden');v='2d';}
 view=v;if(G)G.view=v;if(v==='2d'){P.px=P.fx=P.x;P.py=P.fy=P.y;P.walk=false;}else P.ang=YAW[P.dir];$('#world').hidden=v!=='2d';$('#world3d').hidden=v==='2d';$('#viewBtn').textContent=VNAME[v];
 if(v!=='2d')init3d();if(!quiet)toast(VNAME[v]+'-Ansicht'+(v==='2d'?'':' · Joystick: vor, drehen, umdrehen'));}
function stepInput(h){if(view==='2d')return tryMove(h);if(h==='up')return tryMove(P.dir);
 const now=performance.now();if(now<turnT)return;turnT=now+240;const o=['up','right','down','left'],i=o.indexOf(P.dir);
 P.dir=o[(i+(h==='right'?1:h==='left'?3:2))%4];}
// Look L1: weicher 5-Stufen-Verlauf mit linearer Filterung – Formen bleiben klar, Flächen wirken weich statt Comic-flach
let TOON=null;function toonGrad(){if(TOON)return TOON;TOON=new THREE.DataTexture(new Uint8Array([98,98,98,255,128,128,128,255,184,184,184,255,236,236,236,255,255,255,255,255]),5,1,THREE.RGBAFormat);TOON.minFilter=TOON.magFilter=THREE.LinearFilter;TOON.needsUpdate=true;return TOON;}
// ---------- Toon-Rezept ----------
// Gemeinsame Uniforms: Zeit, Windstärke, bis zu 8 Wegdrück-Positionen (x,z,Radius,Stärke)
const RIM={value:null};
const W3U={uTime:{value:0},uWind:{value:1},uPush:{value:null},uNF:{value:null}};
// Nachbesserung 1 (QA Loop C W-1): Welt-Teile nahe der Verfolgerkamera im unteren Bilddrittel (HUD-Zone: Rennen/Chronik/Fang/Stick) gerastert ausblenden.
// uNF = (Bildtiefe voll weg, Bildtiefe voll da, Pufferhöhe px, Pufferbreite px; 0 = aus). Seitliche HUD-Zonen (Stick links, Knöpfe rechts) reichen 45 % tiefer in den Raum.
// Rasterschwelle = Interleaved Gradient Noise → weiches Ausdünnen ohne Transparenz-Sortierung
const NF_GLSL=d=>`if(uNF.w>.5){vec2 nfq=gl_FragCoord.xy/uNF.wz;float nfe=1.+.45*smoothstep(.36,.6,abs(nfq.x-.5)*2.);float nfk=(1.-smoothstep(uNF.x*nfe,uNF.y*nfe,${d}))*(1.-smoothstep(.36,.5,nfq.y));if(nfk>.01&&nfk>fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))))discard;}`;
function nfU(){if(!W3U.uNF.value)W3U.uNF.value=new THREE.Vector4(0,0,1,0);return W3U.uNF;}
const f3=v=>(+v).toFixed(3);
function projGLSL(w,gr){return `vec4 wp=vec4(transformed,1.0);
#ifdef USE_INSTANCING
wp=instanceMatrix*wp;
#endif
wp=modelMatrix*wp;
${w?`{float wy=clamp((transformed.y+${f3(w[1])})*1.6,0.0,1.0)*uWind;wp.x+=sin(uTime*1.7+wp.x*.9+wp.z*.7)*${f3(w[0])}*wy;wp.z+=cos(uTime*1.2+wp.x*.6+wp.z*.4)*${f3(w[0]*.5)}*wy;}`:''}
${gr?`{float hk=clamp(transformed.y*2.3,0.0,1.0);hk*=hk;float gs=sin(uTime*1.1+wp.x*.35+wp.z*.22)*.5+.5;
wp.x+=(sin(uTime*2.3+wp.x*1.7+wp.z*1.3)*.035+gs*.08)*hk*uWind;wp.z+=(cos(uTime*1.9+wp.x*1.1+wp.z*1.6)*.03+gs*.035)*hk*uWind;
for(int i=0;i<8;i++){vec4 q=uPush[i];if(q.z>0.0){vec2 dd=wp.xz-q.xy;float dl=length(dd)+.0001;float k=(1.0-smoothstep(q.z*.2,q.z,dl))*hk*q.w;wp.xz+=dd/dl*k*.34;wp.y-=k*.17;}}}`:''}
vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;`;}
function toonFx(mt,o){o=o||{};if(!RIM.value)RIM.value=new THREE.Color(0);if(!W3U.uPush.value)W3U.uPush.value=Array.from({length:8},()=>new THREE.Vector4());const w=o.wind,gr=o.grass,nf=o.nf;if(nf){nfU();mt.userData.nf=1;}
 mt.onBeforeCompile=sh=>{if(w||gr){sh.uniforms.uTime=W3U.uTime;sh.uniforms.uWind=W3U.uWind;if(gr)sh.uniforms.uPush=W3U.uPush;
   sh.vertexShader='uniform float uTime;uniform float uWind;\n'+(gr?'uniform vec4 uPush[8];\n':'')+sh.vertexShader.replace('#include <project_vertex>',projGLSL(w,gr));}
  if(o.tintWhite)sh.vertexShader=sh.vertexShader.replace('#include <color_vertex>','vColor=vec3(1.0);\n#ifdef USE_COLOR\nvColor*=color;\n#endif\n#ifdef USE_INSTANCING_COLOR\nvColor=mix(vColor,vColor*instanceColor,step(2.9,color.r+color.g+color.b));\n#endif');
  if(nf){sh.uniforms.uNF=W3U.uNF;sh.fragmentShader='uniform vec4 uNF;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+NF_GLSL('vViewPosition.z'));}
  if(o.rim!==false){sh.uniforms.uRim=RIM;sh.fragmentShader='uniform vec3 uRim;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float rf=1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);gl_FragColor.rgb+=uRim*smoothstep(.6,.88,rf);}');}};
 mt.customProgramCacheKey=()=>'fx'+(w?w.join('_'):'')+(gr?'g':'')+(o.tintWhite?'t':'')+(o.rim===false?'n':'r')+(nf?'f':'');if(w||gr)mt.userData.wind=1;return mt;}
const MAT={};
// toonMat(color,{rim,rimColor,rimStr,wind:[amp,fromY],emissive,emissiveIntensity,side,vertexColors,fog,transparent,opacity})
function toonMat(c,o){o=o||{};const k='t'+c+JSON.stringify(o);if(MAT[k])return MAT[k];const{rim,rimColor,rimStr,wind,grass,tintWhite,nf,...rest}=o;
 const m=toonFx(new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:toonGrad()},rest)),{rim,wind,grass,tintWhite,nf});if(wind)m.userData.windP=wind;
 if(rimColor)addRim(m,rimColor,rimStr??.45);return MAT[k]=m;}
function mat(c,o){const k=c+JSON.stringify(o||{});return MAT[k]||(MAT[k]=toonFx(new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:toonGrad()},o||{}))));}
// Fresnel-Randlicht je Material (zusätzlich zum globalen RIM)
function addRim(mt,color,strength){mt.userData.rimC={value:new THREE.Color(color||'#ffffff')};mt.userData.rimS={value:strength??.45};const prev=mt.onBeforeCompile,pk=mt.customProgramCacheKey;
 mt.onBeforeCompile=(sh,r)=>{if(prev)prev.call(mt,sh,r);sh.uniforms.uRimC=mt.userData.rimC;sh.uniforms.uRimS=mt.userData.rimS;
  sh.fragmentShader='uniform vec3 uRimC;uniform float uRimS;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float rf2=1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0);gl_FragColor.rgb+=uRimC*uRimS*smoothstep(.55,.92,rf2);}');};
 const base=pk?pk.call(mt):'';mt.customProgramCacheKey=()=>base+'|rim';mt.needsUpdate=true;return mt;}
// Dünne Outline: Rückseiten-Hülle entlang der Normalen (skalierungskompensiert, auch InstancedMesh)
const OLM={};
function olMat(width,color,wind,nf){const k=width+'|'+color+'|'+(wind||'')+(nf?'|nf':'');if(OLM[k])return OLM[k];const m=new THREE.MeshBasicMaterial({color:color||'#2b3040',side:THREE.BackSide});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{float sc=length(modelMatrix[0].xyz);\n#ifdef USE_INSTANCING\nsc*=length(instanceMatrix[0].xyz);\n#endif\ntransformed+=normalize(normal)*'+f3(width)+'/max(sc,.001);}');
  if(wind){sh.uniforms.uTime=W3U.uTime;sh.uniforms.uWind=W3U.uWind;sh.vertexShader='uniform float uTime;uniform float uWind;\n'+sh.vertexShader.replace('#include <project_vertex>',projGLSL(wind,0));}
  if(nf){sh.uniforms.uNF=nfU();sh.vertexShader='varying float vNFd;\n'+sh.vertexShader.replace('#include <fog_vertex>','vNFd=-mvPosition.z;\n#include <fog_vertex>');sh.fragmentShader='uniform vec4 uNF;varying float vNFd;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+NF_GLSL('vNFd*.55'));}};
 m.customProgramCacheKey=()=>'ol'+k;return OLM[k]=m;}
function addOutline(mesh,width,color){if(!mesh||!mesh.geometry)return null;width=width??.022;const wind=mesh.material&&mesh.material.userData&&mesh.material.userData.windP,nf=mesh.material&&mesh.material.userData&&mesh.material.userData.nf;const m=olMat(width,color,wind,nf);let o;
 if(mesh.isInstancedMesh){o=new THREE.InstancedMesh(mesh.geometry,m,mesh.count);o.instanceMatrix=mesh.instanceMatrix;}else o=new THREE.Mesh(mesh.geometry,m);
 o.frustumCulled=false;o.castShadow=o.receiveShadow=false;o.userData.outline=1;mesh.add(o);mesh.userData.outline=o;return o;}
// Weicher Kontaktschatten: Registry, alle Schatten einer Szene in EINER Instanz-Mesh
const BLOB=new Set();
function blobShadow(obj,radius){if(!obj)return obj;obj.userData.blob=radius||.35;BLOB.add(obj);return obj;}
let BLOBT=null;function blobTex(){if(BLOBT)return BLOBT;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,31);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.55,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return BLOBT=new THREE.CanvasTexture(c);}
// ---------- Geometrie-Helfer ----------
const w3vc=()=>mat('#ffffff',{vertexColors:true});
function w3M(x,y,z,sx,sy,sz,rx,ry,rz){return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx??1,sy??sx??1,sz??sx??1));}
// Teile [geo, farbe, matrix, nachtfarbe?] zu einer Geometrie verschmelzen (ein Draw-Call)
function w3merge(parts){let n=0,night=parts.some(q=>q[3]),hasK=parts.some(q=>q[4]);const gs=parts.map(([g0,c,m,c2,k])=>{const g=g0.index?g0.toNonIndexed():g0.clone();if(m)g.applyMatrix4(m);n+=g.attributes.position.count;return[g,new THREE.Color(c),c2?new THREE.Color(c2):null,k||0];});
 const P_=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3),C2=night?new Float32Array(n*3):null,KM=hasK?new Float32Array(n):null;let o=0;
 for(const[g,c,c2,km]of gs){const cnt=g.attributes.position.count;P_.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);const cc=c2||c;if(KM)KM.fill(km,o,o+cnt);
  const gc=g.attributes.color&&g.attributes.color.array;for(let i=0;i<cnt;i++){const j=(o+i)*3,k=i*3,r0=gc?gc[k]:1,g0=gc?gc[k+1]:1,b0=gc?gc[k+2]:1;C[j]=c.r*r0;C[j+1]=c.g*g0;C[j+2]=c.b*b0;if(C2){C2[j]=cc.r*r0;C2[j+1]=cc.g*g0;C2[j+2]=cc.b*b0;}}o+=cnt;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(P_,3));r.setAttribute('normal',new THREE.BufferAttribute(N,3));r.setAttribute('color',new THREE.BufferAttribute(C,3));if(C2)r.setAttribute('aNight',new THREE.BufferAttribute(C2,3));if(KM)r.setAttribute('aMat',new THREE.BufferAttribute(KM,1));return r;}
const W3GEO={};function g3(k,f){return W3GEO[k]||(W3GEO[k]=f());}
const w3sph=(w,h)=>g3('s'+w+'_'+h,()=>new THREE.SphereGeometry(1,w,h));
// Weicher Fels: Kugel mit sanfter radialer Verformung, glatte Normalen
// Welt-Grafik 2: Fels = Ikosaeder (Stufe 2) mit zwei Rauschlagen und abgeflachter Unterseite; Normalen halb flach/halb glatt (weich facettiert wie gemeißelt),
// Vertexfarbe = Kontakt-Verdunklung unten + helle Oberkante (wirkt mit Instanzfarbe und Detailmuster)
function rockGeo(){return g3('rock2',()=>{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position,v=new THREE.Vector3(),n=p.count,col=new Float32Array(n*3);
 const nz=(x,y,z)=>Math.sin(x*4.1+1.3)*Math.sin(y*3.7+.4)*Math.sin(z*4.6+2.1)*.2+Math.sin(x*9.3+.2)*Math.sin(y*8.1+1.7)*Math.sin(z*8.7+.9)*.06;
 for(let i=0;i<n;i++){v.fromBufferAttribute(p,i).normalize();const f=1+nz(v.x,v.y,v.z);let y=v.y*f*.92;if(y<-.42)y=-.42+(y+.42)*.25;p.setXYZ(i,v.x*f,y,v.z*f);
  const k=.62+.38*sst(-.5,.55,y),h=.04*sst(.35,.8,y);col[i*3]=k+h;col[i*3+1]=k+h;col[i*3+2]=k*.98+h;}
 g.computeVertexNormals();const fn=g.attributes.normal,key=i=>Math.round(p.getX(i)*1e3)+'_'+Math.round(p.getY(i)*1e3)+'_'+Math.round(p.getZ(i)*1e3),acc=new Map();
 for(let i=0;i<n;i++){const k=key(i);let a=acc.get(k);if(!a)acc.set(k,a=[0,0,0]);a[0]+=fn.getX(i);a[1]+=fn.getY(i);a[2]+=fn.getZ(i);}
 for(let i=0;i<n;i++){const a=acc.get(key(i)),l=Math.hypot(a[0],a[1],a[2])||1;v.set(fn.getX(i)*.24+a[0]/l*.76,fn.getY(i)*.24+a[1]/l*.76,fn.getZ(i)*.24+a[2]/l*.76).normalize();fn.setXYZ(i,v.x,v.y,v.z);}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;});}
// Welt-Grafik 2: Baumkrone aus Laub-Büscheln (Ikosaeder-Kugeln, je Baum EINE Instanz) mit Kugel-Normalen der Gesamtkrone → weiche, malerische
// Licht- und Schattenseite statt Einzelkugel-Flecken; Vertexfarbe = Höhenverlauf (oben warm/hell, unten/innen dunkel = Eigenschatten/AO)
function crownGeo(k){return g3('crown_'+k,()=>{const bush=k[0]==='b',r=prng(91+(bush?7+(+k[1]||0)*13:0)),C=bush?[0,.3,0]:[0,1.2,0],R=bush?[.42,.3,.42]:[.66,.58,.66],cl=[];
 // k: 'h' hoch (9 Büschel) · 'm' mittel (6) · 'l' fern/niedrig (4) · 'p' Schatten-Stellvertreter (3) · 'b0'/'b1' Busch
 if(bush){cl.push([0,.3,0,.3]);for(let i=0;i<5;i++){const a=i/5*6.283+r()*.6;cl.push([Math.cos(a)*.26,.2+r()*.08,Math.sin(a)*.26,.2+r()*.06]);}cl.push([.04,.46,-.03,.2]);}
 else if(k==='p')cl.push([0,1.2,0,.7],[.08,1.55,-.04,.42]);
 else if(k==='l')cl.push([0,1.16,0,.6],[.24,1.32,.12,.4],[-.22,1.34,-.14,.4],[0,1.6,0,.34]);
 else if(k==='m'){cl.push([0,1.18,0,.52]);for(let i=0;i<4;i++){const a=i/4*6.283+.4;cl.push([Math.cos(a)*.38,1.02+(i%2)*.1,Math.sin(a)*.38,.36]);}cl.push([0,1.6,0,.32]);}
 else{cl.push([0,1.16,0,.52]);for(let i=0;i<5;i++){const a=i/5*6.283+r()*.5;cl.push([Math.cos(a)*(.41+r()*.06),.98+r()*.14,Math.sin(a)*(.41+r()*.06),.33+r()*.05]);}
  cl.push([(r()-.5)*.1,1.56,(r()-.5)*.1,.36]);}
 const pos=[],nor=[],col=[],n3=new THREE.Vector3(),e3=new THREE.Vector3();
 for(const[x,y,z,rad]of cl){const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){n3.fromBufferAttribute(p,i).normalize();const wob=1+.12*Math.sin(n3.x*5.1+x*7)*Math.sin(n3.y*4.3+z*5)*Math.sin(n3.z*4.7+y*3);
   const X=x+n3.x*rad*wob,Y=y+n3.y*rad*wob*.92,Z=z+n3.z*rad*wob;e3.set((X-C[0])/(R[0]*R[0]),(Y-C[1])/(R[1]*R[1]),(Z-C[2])/(R[2]*R[2])).normalize();
   n3.multiplyScalar(.28).addScaledVector(e3,.72).normalize();pos.push(X,Y,Z);nor.push(n3.x,n3.y,n3.z);
   const hy=(Y-C[1])/R[1],rr=Math.hypot((X-C[0])/R[0],hy,(Z-C[2])/R[2]),kk=(.5+.52*sst(-1.05,.95,hy))*(.7+.3*sst(.45,1,rr)),top=sst(.1,1,hy);
   col.push(kk*(1+.08*top),kk*(1+.04*top),kk*(1-.07*top));}g.dispose();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g;});}
// Kronen-Detailstufe je Qualitätsstufe (59-grafik tauscht die Geometrie beim Stufenwechsel)
function crownK(){const t=typeof perfTier==='function'?perfTier().name:'high';return t==='high'?'h':t==='mid'?'m':'l';}
// Look L1: Baumkrone – sanft verbeulte Kugel, unten dunkler (Eigenschatten/Volumen), oben heller; Materialien mit Detailmuster
function canopyGeo(w,h){return g3('can'+w+'_'+h,()=>{const g=new THREE.SphereGeometry(1,w,h),p=g.attributes.position,v=new THREE.Vector3(),col=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const f=1+Math.sin(v.x*5.3+.7)*Math.sin(v.y*4.1+1.1)*Math.sin(v.z*4.9+.3)*.13;p.setXYZ(i,v.x*f,v.y*f,v.z*f);const k=.56+.5*sst(-1,.9,v.y);col[i*3]=col[i*3+1]=col[i*3+2]=k;}
 g.computeVertexNormals();g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;});}
function barkMat(){return MAT.bark||(MAT.bark=addDetail(toonFx(new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,gradientMap:toonGrad()}),{nf:1}),'bark',1.7));}
function rockMat(){return MAT.rock||(MAT.rock=addDetail(toonFx(new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,gradientMap:toonGrad()}),{nf:1}),'rock',.8));}
function townMat(nf){const k=nf?'townNF':'town';return MAT[k]||(MAT[k]=addDetail(toonFx(new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,gradientMap:toonGrad()}),{nf:nf?1:0}),'town',.9));}
function person3d(col,hat,oe){const g=new THREE.Group(),sk=oe?oe.skin:'#f3cfae',pc=oe?oe.pants:'#26304a',hatC=oe&&!oe.cap?oe.hairCol:hat,dk=shade(hatC,.75);
 const legG=g3('leg'+pc,()=>w3merge([[new THREE.CylinderGeometry(.062,.07,.36,8),pc,w3M(0,-.18,0)],[new THREE.SphereGeometry(.08,8,6),'#3a2a22',w3M(0,-.39,-.025,1,.6,1.35)]]));
 const l1=new THREE.Mesh(legG,w3vc()),l2=new THREE.Mesh(legG,w3vc());l1.position.set(-.09,.42,0);l2.position.set(.09,.42,0);
 const body=w3merge([[new THREE.CylinderGeometry(.18,.23,.46,12),col,w3M(0,.65,0)],[new THREE.SphereGeometry(.18,12,8),col,w3M(0,.87,0,1,.45,1)],
  [new THREE.SphereGeometry(.15,10,8),dk,w3M(0,.7,.17,1,1.05,.6)],[new THREE.SphereGeometry(.068,8,6),sk,w3M(-.25,.6,0)],[new THREE.SphereGeometry(.068,8,6),sk,w3M(.25,.6,0)],
  [new THREE.CylinderGeometry(.06,.07,.08,8),sk,w3M(0,.9,0)],[new THREE.SphereGeometry(.21,16,12),sk,w3M(0,1.07,0)],
  [new THREE.SphereGeometry(.228,16,8,0,Math.PI*2,0,Math.PI/2),hatC,w3M(0,1.09,0)],...(oe&&!oe.cap?(oe.hair==='lang'?[[new THREE.SphereGeometry(.2,10,8),hatC,w3M(0,.98,.1,1.05,1.5,.7)]]:oe.hair==='zopf'?[[new THREE.SphereGeometry(.07,8,6),hatC,w3M(.04,.9,.2,1,2.4,1)]]:oe.hair==='dutt'?[[new THREE.SphereGeometry(.09,8,6),hatC,w3M(0,1.33,.02)]]:oe.hair==='wuschel'?[[new THREE.SphereGeometry(.13,8,6),hatC,w3M(-.14,1.24,0)],[new THREE.SphereGeometry(.13,8,6),hatC,w3M(.14,1.24,0)]]:[]):[[new THREE.SphereGeometry(.19,12,6),dk,w3M(0,1.095,-.15,.95,.1,.75)]]),
  [new THREE.SphereGeometry(.032,8,6),'#1d1a24',w3M(-.075,1.06,-.19,1,1.2,.6)],[new THREE.SphereGeometry(.032,8,6),'#1d1a24',w3M(.075,1.06,-.19,1,1.2,.6)],
  [new THREE.SphereGeometry(.04,8,6),'#f2a3a0',w3M(-.13,1.0,-.165,1,.6,.5)],[new THREE.SphereGeometry(.04,8,6),'#f2a3a0',w3M(.13,1.0,-.165,1,.6,.5)]]);
 const b=new THREE.Mesh(body,w3vc());[l1,l2,b].forEach(m=>{m.castShadow=true;g.add(m);});addOutline(b,.016);g.userData.legs=[l1,l2];blobShadow(g,.32);return g;}
function monSprite(id,size){const c=document.createElement('canvas');c.width=c.height=256;drawMon(c.getContext('2d'),id,128,140,200,false,0);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));s.scale.set(size,size,1);return s;}
let DOT=null;function dotTex(){if(DOT)return DOT;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.65)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return DOT=new THREE.CanvasTexture(c);}
// ---------- Look L1: prozedurale, kachelbare Detailtexturen (einmal erzeugt, gecacht) ----------
// Jede Textur trägt vier Graustufen-Muster in R/G/B/A (DataTexture, kein Canvas-Alpha-Verlust); die Farbe kommt aus PALETTE/PAL.
// W3T.ground  R Gras · G Erde · B Pflaster (Steine hell, Fugen dunkel) · A Sand
// W3T.ground2 R Fels · G Schnee · B Holzplanken · A großflächige Variation
// W3T.build   R Putz · G Dachschindeln · B Holzbretter · A Steinquader       W3T.cloud R Wolken grob · G Wolken fein
const W3T={};
function w3noise(N,cells,seed){const g=new Float32Array(cells*cells),r=prng(seed);for(let i=0;i<g.length;i++)g[i]=r();
 return(x,y)=>{const u=x/N*cells,v=y/N*cells,i=Math.floor(u),j=Math.floor(v);let fx=u-i,fy=v-j;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  const I=((i%cells)+cells)%cells,J=((j%cells)+cells)%cells,I1=(I+1)%cells,J1=(J+1)%cells,a=g[J*cells+I],b=g[J*cells+I1],c=g[J1*cells+I],d=g[J1*cells+I1];return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;};}
function w3fbm(N,c0,oct,seed){const L=[];for(let o=0;o<oct;o++)L.push(w3noise(N,c0<<o,seed+o*17));return(x,y)=>{let s=0,a=.5,t=0;for(const f of L){s+=f(x,y)*a;t+=a;a*=.5;}return s/t;};}
// Kachelbares Voronoi: liefert [F1, F2] (Abstände in Pixeln) und Zellwert
function w3voro(N,cells,seed){const r=prng(seed),pt=[];for(let j=0;j<cells;j++)for(let i=0;i<cells;i++)pt.push([(i+.15+r()*.7)*N/cells,(j+.15+r()*.7)*N/cells,r()]);
 return(x,y)=>{let f1=1e9,f2=1e9,v=0;const ci=Math.floor(x/N*cells),cj=Math.floor(y/N*cells);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const I=((ci+di)%cells+cells)%cells,J=((cj+dj)%cells+cells)%cells,p=pt[J*cells+I];
  let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,N-dx);dy=Math.min(dy,N-dy);const d=Math.hypot(dx,dy);if(d<f1){f2=f1;f1=d;v=p[2];}else if(d<f2)f2=d;}return[f1,f2,v];};}
function w3dataTex(N,fn){const a=new Uint8Array(N*N*4),o=[0,0,0,0];for(let y=0;y<N;y++)for(let x=0;x<N;x++){fn(x,y,o);const k=(y*N+x)*4;for(let c=0;c<4;c++)a[k+c]=Math.max(0,Math.min(255,o[c]*255|0));}
 const t=new THREE.DataTexture(a,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;}
const sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// Welt-Grafik 2: Bodentextur auf der GPU backen (einmalig, 1024² auf „hoch“, sonst 512²; kachelbar, mit Mipmaps) – weiche Grasbüschel + Halmstriche statt Pixelrauschen
const W3BAKE_LIB='float hh(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}vec2 hh2(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.103,.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}'+
 'float vn(vec2 p,float per,float s){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hh(mod(i,per)+s),b=hh(mod(i+vec2(1.,0.),per)+s),c=hh(mod(i+vec2(0.,1.),per)+s),d=hh(mod(i+1.,per)+s);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}'+
 'float fbm(vec2 uv,float c,float s){float t=0.,a=.5,n=0.;for(int o=0;o<4;o++){t+=a*vn(uv*c,c,s+float(o)*17.);n+=a;a*=.5;c*=2.;}return t/n;}'+
 'float fbm2(vec2 uv,float c,float s){float t=0.,a=.5,n=0.;for(int o=0;o<2;o++){t+=a*vn(uv*c,c,s+float(o)*17.);n+=a;a*=.5;c*=2.;}return t/n;}'+
 'vec3 vor(vec2 uv,float c,float s){vec2 p=uv*c,i=floor(p),f=fract(p);float f1=9.,f2=9.,v=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y)),cl=mod(i+g,c);vec2 o=.15+.7*hh2(cl+s);float d=length(g+o-f);if(d<f1){f2=f1;f1=d;v=hh(cl+s+7.);}else if(d<f2)f2=d;}return vec3(f1,f2,v);}'+
 'float strk(vec2 uv,float c,float s,float w0){vec2 p=uv*c,i=floor(p),f=fract(p);float acc=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y)),cl=mod(i+g,c);for(int k=0;k<2;k++){float sk=s+float(k)*31.;vec2 a=g+hh2(cl+sk);float an=-1.5708+(hh(cl+sk+3.)-.5)*1.3,L=.55+.6*hh(cl+sk+5.);vec2 b=a+vec2(cos(an),sin(an))*L,pa=f-a,ba=b-a;float t=clamp(dot(pa,ba)/dot(ba,ba),0.,1.),d=length(pa-ba*t),w=w0*(1.-t*.65);acc+=(hh(cl+sk+9.)<.55?1.:-1.)*smoothstep(w,w*.25,d)*(.4+.6*t);}}return clamp(acc,-1.,1.);}';
const W3BAKE_GROUND='void main(){vec2 uv=vUv;vec3 c1=vor(uv,18.,1.),c2=vor(uv,34.,2.);float tu=pow(max(0.,1.-c1.x/.62),1.3)*(.55+.45*c1.z),tu2=pow(max(0.,1.-c2.x/.62),1.2)*(.5+.5*c2.z);'+
 'float g=.4+.2*(fbm(uv,4.,3.)-.5)+.24*tu+.14*tu2+.08*(fbm2(uv,16.,4.)-.5)+.22*strk(uv,40.,5.,.1)+.1*strk(uv,72.,15.,.08);'+
 'vec3 pb=vor(uv,26.,6.);float peb=pb.z>.7?smoothstep(.34,.12,pb.x)*(.5+.5*hh(vec2(pb.z*91.,3.))):0.,rim=pb.z>.7?smoothstep(.42,.32,pb.x)*(1.-smoothstep(.34,.12,pb.x)):0.;float e=.5+.3*(fbm(uv,6.,7.)-.5)+.14*(fbm2(uv,32.,8.)-.5)+.03*peb+.06*strk(uv,64.,13.,.06);'+
 'vec3 cb=vor(uv,7.,9.);float cob=smoothstep(.03,.12,cb.y-cb.x)*(.55+.3*cb.z+.25*fbm2(uv,16.,10.))*(1.-.25*smoothstep(.2,.5,cb.x))+.08;'+
 'float sa=fbm2(uv,32.,11.)*.55+.25+.12*sin((uv.y*6.+fbm2(uv,4.,12.)*1.6)*6.2832);gl_FragColor=vec4(g,e,cob,sa);}';
function w3bake(N,fs){const r=R3&&R3.r;if(!r)return null;try{const T=typeof perfTier==='function'?perfTier():{};
 const rt=new THREE.WebGLRenderTarget(N,N,{wrapS:THREE.RepeatWrapping,wrapT:THREE.RepeatWrapping,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true,depthBuffer:false,stencilBuffer:false,anisotropy:Math.min(T.aniso||4,r.capabilities.getMaxAnisotropy()||1)});
 const sc=new THREE.Scene(),q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'precision highp float;varying vec2 vUv;\n'+W3BAKE_LIB+fs,depthTest:false,depthWrite:false}));q.frustumCulled=false;sc.add(q);
 const prev=r.getRenderTarget(),ac=r.autoClear;r.autoClear=true;r.setRenderTarget(rt);r.render(sc,new THREE.Camera());r.setRenderTarget(prev);r.autoClear=ac;q.geometry.dispose();q.material.dispose();
 rt.texture._rt=1;rt.texture._bakeN=N;return rt.texture;}catch(e){console.warn('Textur-Backen fehlgeschlagen',e);return null;}}
function w3texGround(){if(W3T.ground)return W3T.ground;{const T=typeof perfTier==='function'?perfTier():{},t=w3bake(T.name==='high'?1024:512,W3BAKE_GROUND);if(t)return W3T.ground=t;}const N=256,gr=w3fbm(N,16,3,11),gr2=w3noise(N,64,12),di=w3fbm(N,8,4,21),pb=w3voro(N,10,23),cb=w3voro(N,7,31),cn=w3fbm(N,16,2,33),sa=w3fbm(N,32,2,41),sr=w3fbm(N,4,2,43);
 return W3T.ground=w3dataTex(N,(x,y,o)=>{o[0]=gr(x,y)*.62+gr2(x,y)*.38;o[0]=sst(.18,.85,o[0]);
  const p=pb(x,y);o[1]=di(x,y)*.85+(p[0]<4.2?(.32-p[0]*.06)*(p[2]>.55?1:0):0);
  const c=cb(x,y),e=c[1]-c[0];o[2]=sst(1,4.5,e)*(.55+.3*c[2]+.25*cn(x,y))*(1-.25*sst(7,19,c[0]))+.08;
  o[3]=sa(x,y)*.55+.25+.12*Math.sin((y/N*6+sr(x,y)*1.6)*Math.PI*2);});}
function w3texGround2(){if(W3T.ground2)return W3T.ground2;const N=256,rk=w3fbm(N,8,4,51),rv=w3voro(N,6,53),sn=w3fbm(N,4,3,61),sp=w3noise(N,128,62),pl=w3fbm(N,4,3,71),pg=w3noise(N,64,72),mc=w3fbm(N,2,3,81);
 return W3T.ground2=w3dataTex(N,(x,y,o)=>{const v=rv(x,y);o[0]=rk(x,y)*.8+.2-(.2*(1-sst(.5,2.5,v[1]-v[0])));
  o[1]=.7+sn(x,y)*.3+(sp(x,y)>.93?.15:0);
  const R=N/8,row=Math.floor(y/R),fy=y%R,off=Math.floor(hs(row,7)*N),fx=(x+off)%(N/2);
  o[2]=(.6+.26*pl(x,y*4)+.08*pg(x,y)+.08*(hs(row,3)-.5))*sst(0,1.5,fy)*sst(R,R-1.5,fy)*sst(0,1.5,fx)*sst(N/2,N/2-1.5,fx)+.05;
  o[3]=mc(x,y);});}
// Welt-Grafik 3: Gebäude-Detailtextur auf der GPU (Putz mit Kellenstrichen, gerundete Schindeln mit Schattenkante, Bretter mit Maserung, Quader mit Fase)
const W3BAKE_BUILD='float vnp(vec2 p,vec2 per,float s){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hh(mod(i,per)+s),b=hh(mod(i+vec2(1.,0.),per)+s),c=hh(mod(i+vec2(0.,1.),per)+s),d=hh(mod(i+1.,per)+s);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}'+
 'void main(){vec2 uv=vUv;float pl=.68+.32*(fbm(uv,8.,1.)-.5)+.1*(fbm2(uv,48.,2.)-.5)+.1*strk(uv,20.,3.,.06);'+
 'float row=floor(uv.y*8.),fy=fract(uv.y*8.),sx=uv.x*8.+mod(row,2.)*.5,cx=floor(sx),fx=fract(sx),jt=hh(vec2(mod(cx,8.),row)+.5);'+
 'float rnd=length(vec2((fx-.5)*1.6,max(0.,.35-fy)*2.2));float shg=(.52+.36*fy+.14*(jt-.5)+.06*(fbm2(uv,32.,4.)-.5))*smoothstep(1.,.86,rnd)*smoothstep(0.,.06,fx)*smoothstep(1.,.94,fx)*(1.-.32*smoothstep(.88,1.,fy))+.06;'+
 'float bx=fract(uv.x*6.),bj=hh(vec2(floor(uv.x*6.),3.));float brd=(.62+.24*vnp(vec2(uv.x*96.,uv.y*6.),vec2(96.,6.),5.)+.1*(bj-.5)+.06*sin(uv.x*600.+vnp(vec2(uv.x*24.,uv.y*3.),vec2(24.,3.),6.)*8.))*smoothstep(0.,.05,bx)*smoothstep(1.,.95,bx)+.05;'+
 'float qr=floor(uv.y*4.),qx=fract(uv.x*2.+mod(qr,2.)*.5),qy=fract(uv.y*4.),qj=hh(vec2(mod(floor(uv.x*2.+mod(qr,2.)*.5),2.),qr)+9.);float e=min(min(qx,1.-qx)*.5,min(qy,1.-qy)*.25);'+
 'float stn=(.6+.2*(qj-.5)+.18*(fbm(uv,16.,7.)-.5))*(.55+.45*smoothstep(0.,.02,e))*(1.+.12*smoothstep(.02,0.,abs(e-.012)))+.08;gl_FragColor=vec4(pl,shg,brd,stn);}';
function w3texBuild(){if(W3T.build)return W3T.build;{const T=typeof perfTier==='function'?perfTier():{},t=w3bake(T.name==='high'?1024:512,W3BAKE_BUILD);if(t)return W3T.build=t;}const N=256,pa=w3fbm(N,16,3,91),pa2=w3noise(N,64,92),wo=w3fbm(N,4,3,101),wg=w3noise(N,64,102),st=w3fbm(N,8,2,111);
 return W3T.build=w3dataTex(N,(x,y,o)=>{o[0]=.6+pa(x,y)*.3+pa2(x,y)*.1;
  // Schindeln: 8 Reihen, versetzt, unten dunkler
  const R=N/8,row=Math.floor(y/R),fy=(y%R)/R,sh=(x+(row%2)*N/16)%(N/8),fx=sh/(N/8);o[1]=(.5+.35*fy+.12*hs(row*31+Math.floor((x+(row%2)*N/16)/(N/8)),5))*sst(0,.06,fx)*sst(1,.94,fx)*sst(0,.08,fy)+.08;
  // Bretter senkrecht
  const bw=N/6,bx=x%bw;o[2]=(.6+.28*wo(x*4,y)+.1*wg(x,y))*sst(0,2,bx)*sst(bw,bw-2,bx)+.06;
  // Quader 4 Reihen
  const QR=N/4,qr=Math.floor(y/QR),qx=(x+(qr%2)*N/4)%(N/2),qy=y%QR;o[3]=(.6+.3*st(x,y)+.1*hs(qr,Math.floor((x+(qr%2)*N/4)/(N/2))))*sst(0,3,qx)*sst(N/2,N/2-3,qx)*sst(0,3,qy)*sst(QR,QR-3,qy)+.1;});}
function w3texCloud(){if(W3T.cloud)return W3T.cloud;const N=256,a=w3fbm(N,4,5,121),b=w3fbm(N,8,4,131);
 return W3T.cloud=w3dataTex(N,(x,y,o)=>{o[0]=a(x,y);o[1]=b(x,y);o[2]=o[3]=1;});}
// ---------- Look L1: Detail-Muster auf Toon-Materialien (Weltprojektion nach Hauptachse der Normalen) ----------
// kind 'town' → Muster je Fläche aus Attribut aMat (1 Putz, 2 Schindeln, 3 Holz, 4 Stein); 'rock' Fels; 'bark' Holz; 'leaf' Blattwerk
function addDetail(mt,kind,scale){const prev=mt.onBeforeCompile,pk=mt.customProgramCacheKey,sc=f3(scale||.9);mt.userData.detail=kind;
 mt.onBeforeCompile=(sh,r)=>{if(prev)prev.call(mt,sh,r);const town=kind==='town';sh.uniforms.uTD={value:town||kind==='bark'?w3texBuild():kind==='rock'?w3texGround2():w3texGround()};
  sh.vertexShader='varying vec3 vDW;varying vec3 vDN;'+(town?'attribute float aMat;varying float vDM;':'')+'\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{vec4 dw=vec4(transformed,1.);vec3 dn=objectNormal;\n#ifdef USE_INSTANCING\ndw=instanceMatrix*dw;dn=mat3(instanceMatrix)*dn;\n#endif\nvDW=(modelMatrix*dw).xyz;vDN=normalize(mat3(modelMatrix)*dn);'+(town?'vDM=aMat;':'')+'}');
  const pick=town?'float dmK=vDM>9.5?vDM-10.:vDM;float k=dmK<.5?.8:dmK<1.5?dt.r:dmK<2.5?dt.g:dmK<3.5?dt.b:dt.a;float s=dmK<.5?0.:1.;':kind==='rock'?'float k=dt.r;float s=1.;':kind==='bark'?'float k=dt.b;float s=.8;':'float k=dt.r;float s=.7;';
  sh.fragmentShader='uniform sampler2D uTD;varying vec3 vDW;varying vec3 vDN;'+(town?'varying float vDM;':'')+'\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n{vec3 an=abs(vDN);vec2 tp=an.y>max(an.x,an.z)?vDW.xz:(an.x>an.z?vDW.zy:vDW.xy);vec4 dt=texture2D(uTD,tp*'+sc+');'+pick+'diffuseColor.rgb*=mix(1.,.7+.52*k,s);'+(town?'diffuseColor.rgb*=.74+.26*smoothstep(.02,.55,vDW.y);':'')+'}');
  // Nachbesserung 1 (W-2/W-3): ferne Wahrzeichen (aMat ≥ 10) bekommen nur gut halb so viel Dunst → bleiben vor dem Horizont lesbar (kein „Zuckerhut“)
  if(town)sh.fragmentShader=sh.fragmentShader.replace('#include <fog_fragment>','#ifdef USE_FOG\nfloat fogFactor=smoothstep(fogNear,fogFar,fogDepth)*(vDM>9.5?.55:1.);gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogFactor);\n#endif');};
 const base=pk?pk.call(mt):'';mt.customProgramCacheKey=()=>base+'|d'+kind+sc+(kind==='town'?'w':'');mt.needsUpdate=true;return mt;}
// ---------- Look L1: Boden als weiche Material-Mischung ----------
// Typkarte (1 Texel je Kachel, bilinear + Rauschverzerrung = organische Kanten): R Erde/Weg · G Pflaster · B Sand/Ufer · A Waldboden/hohes Gras
// Zusatzkarte: R Kontaktschatten (Bäume, Felsen, Wände, Gebäude) · G Holzsteg · B Eis
function groundMaps(m,th){const W=m.w,H=m.h,A=new Uint8Array(W*H*4),X=new Uint8Array(W*H*4),cave=m.theme==='cave',town=m.rows.some(r=>/[hPMAL]/.test(r)),T=(x,y)=>tileAt(m,x,y);
 const occ=t=>t==='T'?1:t==='R'?.7:t==='X'?(cave?.55:.8):BUILD.includes(t)?.9:0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=m.rows[y][x],k=(y*W+x)*4;let r=0,g=0,b=0,a=0,ao=0,wd=0,ic=0;
  if(t===',')(town||th.slabs?g=1:r=1);else if(t==='"'||(cave&&t===':'))a=1;else if(t==='~'||t==='Q')b=1;else if(t==='=')wd=1;else if(t==='I')ic=1;
  else if(BUILD.includes(t)||/[0-9]/.test(t)){g=1;}else if(t==='X'){if(!cave)r=.55;}else if(t==='T')a=.55;else if(t==='R')r=.35;else if(t==='E')g=.6;
  let o=occ(t)*.85;for(const[dx,dy,w]of GM_N){const q=T(x+dx,y+dy);if(q)o=Math.max(o,occ(q)*w);}ao=Math.min(1,o);
  // Ufer: Sand am Wasserrand (nicht bei Lava)
  if(!th.lava&&!b&&!wd&&!g)for(const[dx,dy]of GM_N4){const q=T(x+dx,y+dy);if(q==='~'||q==='Q'){b=Math.max(b,th.outer==='coast'||m.theme==='beach'?.85:.45);}}
  A.set([r*255,g*255,b*255,a*255],k);X.set([ao*255,wd*255,ic*255,0],k);}
 const mk=a=>{const t=new THREE.DataTexture(a,W,H,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;return t;};return[mk(A),mk(X)];}
const GM_N=[[1,0,.5],[-1,0,.5],[0,1,.55],[0,-1,.4],[1,1,.3],[-1,1,.3],[1,-1,.22],[-1,-1,.22]],GM_N4=[[1,0],[-1,0],[0,1],[0,-1]];
const GROUND_FS=`{vec2 wp=vGW.xz;vec4 dA=texture2D(uGA,wp*.42);vec4 dB=texture2D(uGB,wp*.23);float mac=texture2D(uGB,wp*.043).a;
 vec2 tu=(wp+(vec2(dB.a,mac)-.5)*.62)/uMapS;float inM=smoothstep(-.04,.0,min(min(tu.x,tu.y),min(1.-tu.x,1.-tu.y)));
 vec4 ty=texture2D(uTy,tu)*inM;vec4 ax=texture2D(uAx,tu)*inM;
 ty=smoothstep(.14,.86,clamp(ty+(vec4(dA.g,dA.b,dA.a,dA.r)-.5)*.5*step(.02,ty)+(mac-.5)*.12*step(.02,ty),0.,1.));float wd=smoothstep(.35,.65,ax.g);
 vec3 c=uC0*(.74+.5*dot(vec4(dA.r,dA.a,dB.g,dB.r),uBaseK))*mix(vec3(.76,.88,.84),vec3(1.16,1.09,.86),smoothstep(.2,.8,mac));
 float hu=texture2D(uGB,wp*.017+.31).a,kf=smoothstep(.6,.74,texture2D(uGB,wp*.071+vec2(.7,.2)).a);c*=mix(vec3(1.08,1.03,.78),vec3(.86,1.,1.07),smoothstep(.25,.75,hu))*mix(vec3(1.),vec3(.8,.96,.9),kf*uBaseK.x*.7);
 c=mix(c,uC4*(.72+.5*dA.r)*(.9+.2*mac),ty.a);c=mix(c,uC3*(.82+.32*dA.a),ty.b);c=mix(c,uC1*(.74+.5*dA.g),ty.r);
 c=mix(c,uC2*(.6+.5*dA.b),ty.g);c=mix(c,uC5*(.6+.55*dB.b),wd);c=mix(c,uC6*(.92+.12*dB.g),smoothstep(.3,.7,ax.b));
 vec4 dS=texture2D(uGA,wp*.42+uSunXZ*.006);float rel=dot(dA-dS,vec4((1.-ty.r-ty.g-ty.b-ty.a)*.6,ty.r*.9,ty.g*1.6,ty.b*.5));
 c*=(1.+clamp(rel,-.25,.25)*.9)*(1.-ax.r*.36);diffuseColor.rgb*=c;}`;
function groundMat(m,th,p,lead){const[ty,ax]=groundMaps(m,th),C=c=>new THREE.Color(c),theme=m.theme,sandy=/beach|desert|sea|islands/.test(theme),snowy=theme==='snow',rocky=theme==='cave'||theme==='volcano';
 const V=(c,k)=>C(c).lerp(lead,.06).multiplyScalar((k||1)*.8),g0=th.dim?shade(p.g,th.dim):p.g;
 const U={uGA:{value:w3texGround()},uGB:{value:w3texGround2()},uTy:{value:ty},uAx:{value:ax},uMapS:{value:new THREE.Vector2(m.w,m.h)},uSunXZ:{value:new THREE.Vector2(.6,.4)},
  uBaseK:{value:new THREE.Vector4(sandy||snowy||rocky?0:1,sandy?1:0,snowy?1:0,rocky?1:0)},
  uC0:{value:V(g0,sandy||snowy?1:.92)},uC1:{value:V(p.p,.92)},uC2:{value:C(PALETTE.mat?PALETTE.mat.cobble:'#bdb3a2').lerp(C(p.p),.25).multiplyScalar(.82)},uC3:{value:C(sandy?shade(p.p,1.02):PALETTE.mat?PALETTE.mat.sand:'#d9c7a0').multiplyScalar(.84)},
  uC4:{value:V(theme==='cave'?shade(p.g,.8):shade(p.tg,.82))},uC5:{value:C(PALETTE.mat?PALETTE.mat.wood:'#a5774a').multiplyScalar(.85)},uC6:{value:C('#c6e4f0')}};
 const mt=new THREE.MeshLambertMaterial({color:'#ffffff'});mt.userData.ground=U;
 mt.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader='varying vec3 vGW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvGW=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader='uniform sampler2D uGA;uniform sampler2D uGB;uniform sampler2D uTy;uniform sampler2D uAx;uniform vec2 uMapS;uniform vec2 uSunXZ;uniform vec4 uBaseK;uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;uniform vec3 uC4;uniform vec3 uC5;uniform vec3 uC6;varying vec3 vGW;\n'+
   sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+GROUND_FS);};
 mt.customProgramCacheKey=()=>'ground1';return mt;}
// ---------- Look L1: kritisch gedämpfte Glättung (ruhige Kamera ohne Anfahr-Ruck) ----------
function sdamp(cur,tgt,V,k,smooth,dt){const o=2/Math.max(.001,smooth),x=o*dt,e=1/(1+x+.48*x*x+.235*x*x*x),ch=cur-tgt,tmp=((V[k]||0)+o*ch)*dt;V[k]=((V[k]||0)-o*tmp)*e;const out=tgt+(ch+tmp)*e;return out;}
function sdampV(v,t,V,k,smooth,dt){v.x=sdamp(v.x,t.x,V,k+'x',smooth,dt);v.y=sdamp(v.y,t.y,V,k+'y',smooth,dt);v.z=sdamp(v.z,t.z,V,k+'z',smooth,dt);return v;}
// ---------- Look L1: Licht-Sets aus PALETTE (weich überblendet) ----------
// setLightSet(name, ms) → 'explore'|'dusk'|'night'|'special'|'battle-<element>'|…; null/'' = zurück zur Tageszeit. ms Standard PALETTE.motion.lightBlend (600).
// Jeder Wechsel startet beim gerade sichtbaren Licht (kein Springen, auch bei Wechsel mitten in einer Blende).
const LSET={name:null,L:null,k:1,ms:600,prev:null,shown:null};
function lsetPrep(L){const C=c=>new THREE.Color(c);return{top:C(L.skyTop),hor:C(L.skyBot),sunC:C(L.sun),sunI:.16+.9*Math.min(1.4,L.sunI),sunEl:L.sunEl,fog:C(L.fog),fogN:L.fogNear,fogF:L.fogFar,rim:C(L.rim).multiplyScalar(.12*L.rimI),hs:C(L.amb),hg:C(L.ambGround),hI:L.ambI*1.25,expo:L.exposure||1};}
function lsetBlank(){const C=()=>new THREE.Color();return{top:C(),hor:C(),sunC:C(),sunI:1,sunEl:45,fog:C(),fogN:9,fogF:30,rim:C(),hs:C(),hg:C(),hI:1,expo:1,sd:new THREE.Vector3(0,1,0)};}
function lsetCopy(d,s){for(const k in s){const v=s[k];if(v&&v.isColor||v&&v.isVector3)d[k].copy(v);else d[k]=v;}return d;}
function setLightSet(name,ms){const L=name&&typeof PALETTE!=='undefined'&&PALETTE.light[name];LSET.ms=Math.max(1,ms??((typeof PALETTE!=='undefined'&&PALETTE.motion&&PALETTE.motion.lightBlend)||600));
 if(LSET.shown){LSET.prev=lsetCopy(LSET.prev||lsetBlank(),LSET.shown);LSET.k=RED?1:0;}if(!L){LSET.name=null;LSET.L=null;return;}
 LSET.name=name;LSET.L=lsetPrep(L);const a=Math.PI*.5-.6,el=L.sunEl*Math.PI/180;LSET.L.sd=new THREE.Vector3(Math.cos(a)*Math.cos(el),Math.sin(el),Math.sin(a)*Math.cos(el)+.25).normalize();}
// ---------- Themes ----------
// Paletten für neue Theme-Namen (2D-Kacheln brauchen PAL[theme]); vorhandene bleiben unangetastet
[['forest',{g:'#6aa85a',g2:'#64a055',p:'#c9b483',tg:'#2f7a3c',tr:'#2a5e36',tr2:'#1e4a2a',w:'#357fbd',w2:'#5fa2da',r:'#7f8079',f:'#e8f0a0'}],
 ['mountain',{g:'#93b07a',g2:'#8aa872',p:'#c4b496',tg:'#5f8a52',tr:'#3b6650',tr2:'#2c5040',w:'#4a90c8',w2:'#86bfe6',r:'#8f8a86',f:'#d8e8ff'}],
 ['sea',{g:'#f0dca8',g2:'#e9d39c',p:'#dcc082',tg:'#62ad5e',tr:'#3f8044',tr2:'#2f6634',w:'#2a92d2',w2:'#78cdf2',r:'#a69d8a',f:'#ff9e8a'}],
 ['ship',{g:'#b98a5a',g2:'#b08254',p:'#d2a571',tg:'#8a6a44',tr:'#7a5434',tr2:'#5a3c24',w:'#2a7fc0',w2:'#6ab8ea',r:'#8a7a6a',f:'#ffffff'}],
 ['ruin',{g:'#a8b48a',g2:'#a0ac82',p:'#cfc6ac',tg:'#6f8a5a',tr:'#4d6a48',tr2:'#3a5236',w:'#4a88b8',w2:'#7ab0d8',r:'#a8a296',f:'#e8d8ff'}],
 ['volcano',{g:'#5a4a44',g2:'#54443e',p:'#7a645a',tg:'#6a5a3e',tr:'#3a2a26',tr2:'#261a18',w:'#ff6a1a',w2:'#ffc24a',r:'#4a3e3a',f:'#ff9a3a'}],
 ['desert',{g:'#ead2a0',g2:'#e3ca96',p:'#d6b880',tg:'#9aa85a',tr:'#5f8a4a',tr2:'#4a7038',w:'#3aa0c8',w2:'#86d0e8',r:'#c09a72',f:'#ff7aa8'}],
 ['plant',{g:'#9aa4ac',g2:'#929ca4',p:'#c8ced2',tg:'#6a8a6a',tr:'#4a5a66',tr2:'#38444e',w:'#3a7ab0',w2:'#6aaad8',r:'#7a8288',f:'#ffe14a'}],
 ['base',{g:'#4a4656',g2:'#45414f',p:'#5e5a6a',tg:'#3e4a44',tr:'#2e2a36',tr2:'#221f28',w:'#3a3a6a',w2:'#5a5a9a',r:'#5a5664',f:'#ff3a5a'}],
 ['league',{g:'#e8e2d4',g2:'#e2dccc',p:'#f4efe4',tg:'#6aa85a',tr:'#3f7a4a',tr2:'#2e6038',w:'#3a90d8',w2:'#7ac0f0',r:'#cfc8b8',f:'#ffd24a'}]
].forEach(([k,v])=>{if(!PAL[k])PAL[k]=v;});PAL.islands=PAL.islands||PAL.sea;PAL.tower=PAL.tower||PAL.ruin;
const TH3={
 default:{amp:.48,tree:'round',outer:'hills'},
 forest:{amp:.55,tree:'forest',outer:'hills',dense:1,fogK:.72,fogTint:['#6f9a6a',.25],dim:.88},
 snow:{amp:.5,tree:'pine',outer:'hills',snowy:1,lf:.74,mt:['#a9bccd','#bccbd9','#e3ebf2']},
 mountain:{amp:.9,lf:.92,tree:'pine',outer:'peaks',snowy:.4,fogK:.85,mt:['#6e7f92','#8696a8','#f2f6fa']},
 beach:{amp:.3,lf:.92,tree:'palm',outer:'coast',mt:['#7f9fb6','#93b0c4','#a9c2d2']},
 sea:{amp:.25,tree:'palm',outer:'ocean'},
 ship:{amp:0,tree:'crate',outer:'ocean',deck:1},
 swamp:{amp:.3,tree:'round',outer:'hills',fogK:.7,fogTint:['#7c9478',.35],mt:['#5f7a7a','#708a8a','#84a0a0'],dim:.9},
 whisper:{amp:.5,tree:'round',outer:'hills',amb:'wisp',fogTint:['#8a86c0',.2],mt:['#5a5a98','#6e6eaa','#8c8cc0']},
 cave:{amp:.2,tree:'stalag',enclosed:1,crystal:1},
 ruin:{amp:.35,tree:'column',outer:'hills',slabs:1},
 volcano:{amp:.5,tree:'dead',outer:'volcano',lava:1,amb:'ember',fogTint:['#c8785a',.3],mt:['#4a3a3a','#5a4644','#6a504c']},
 ember:{amp:.45,tree:'round',outer:'hills',amb:'ember',fogTint:['#e0a070',.15],mt:['#8a5a44','#9a6a50','#b07e60']},
 desert:{amp:.6,lf:.84,tree:'cactus',outer:'dunes',amb:'dust',fogTint:['#f0d8a8',.35],mt:['#d9b07a','#e3be8a','#edcc9c']},
 plant:{amp:0,tree:'pillar',outer:'hills',metal:1,amb:'spark',mt:['#6a7a8a','#7a8a9a','#8a9aaa']},
 base:{amp:0,tree:'pillar',enclosed:1,metal:1,dark:1,accent:'#ff3a5a'},
 league:{amp:.1,lf:.84,tree:'column',outer:'hills',marble:1,amb:'gold'},
 inside:{amp:0,enclosed:1}
};
const TH3A={islands:'sea',tower:'ruin',wald:'forest',berg:'mountain',meer:'sea',schiff:'ship',vulkan:'volcano',wueste:'desert',kraftwerk:'plant',basis:'base',liga:'league'};
function th3(m){const t=m&&m.theme;return TH3[t]||TH3[TH3A[t]]||TH3.default;}
function palOf(m){const b=PAL[m.theme]||PAL[TH3A[m.theme]]||PAL.default,a=typeof PALETTE!=='undefined'&&PALETTE.themeAccent&&PALETTE.themeAccent[m.theme];return a?Object.assign({},b,a):b;}
function leadOf(m){try{return new THREE.Color(regionOf(m.id)[1]);}catch(e){return new THREE.Color('#4cb85c');}}
// ---------- Himmel: Tageszeit-Schlüssel ----------
// [stunde, himmel oben, horizont, sonnenlicht, sonnenstärke, hemi oben, hemi boden, hemi-stärke, tag(0..1)]
const SKYK=[[0,'#070b26','#1b2752','#8ea6ff',.3,'#5d6fb0','#1c2240',.5,0],[4.8,'#0b1236','#2a2f63','#8ea6ff',.3,'#5d6fb0','#1c2240',.5,0],
 [6,'#3a4c94','#f08a78','#ff9a70',.55,'#c9a8c8','#4a3a48',.6,.4],[7.3,'#4c8fe0','#ffd2a8','#ffd6a8',.85,'#eee6f0','#5a5a48',.72,.85],
 [9,'#3a86e2','#b2d9ef','#fff3dc',1,'#f4f8ff','#5a6a48',.85,1],[16,'#3a84de','#bcdcef','#fff0d4',1,'#f4f8ff','#5a6a48',.85,1],
 [18,'#5470c0','#ffb070','#ffa860',.85,'#ffe2c4','#5a4a40',.76,.8],[19.3,'#33356f','#e0705a','#ff7a50',.5,'#c08a98','#3a3048',.62,.4],
 [20.6,'#0e1438','#3a3266','#8ea6ff',.32,'#6a70b0','#1e2244',.52,.05],[24,'#070b26','#1b2752','#8ea6ff',.3,'#5d6fb0','#1c2240',.5,0]];
const SKYC=SKYK.map(k=>k.map(v=>typeof v==='string'?new THREE.Color(v):v));
const SK={top:new THREE.Color(),hor:new THREE.Color(),sunC:new THREE.Color(),hs:new THREE.Color(),hg:new THREE.Color(),sunI:1,hI:1,day:1};
function skyAt(h){h=((h%24)+24)%24;let i=0;while(i<SKYC.length-2&&SKYC[i+1][0]<=h)i++;const a=SKYC[i],b=SKYC[i+1];let t=(h-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);
 SK.top.copy(a[1]).lerp(b[1],t);SK.hor.copy(a[2]).lerp(b[2],t);SK.sunC.copy(a[3]).lerp(b[3],t);SK.sunI=a[4]+(b[4]-a[4])*t;SK.hs.copy(a[5]).lerp(b[5],t);SK.hg.copy(a[6]).lerp(b[6],t);SK.hI=a[7]+(b[7]-a[7])*t;SK.day=a[8]+(b[8]-a[8])*t;return SK;}
// Wetter-Parameter: Himmel-Grau, Grau-Farbe, Sonne, Nebel-Faktor, Wind
const WXP={klar:[0,'#ffffff',1,1,1,1],regen:[.6,'#6f7c8c',.5,.72,1.5,.82],gewitter:[.86,'#363e4e',.28,.58,2.2,.62],schnee:[.45,'#b8c6d6',.7,.66,.8,.96],sand:[.78,'#c8924a',.6,.4,2.6,.88],nebel:[.6,'#d4dce2',.6,.28,.6,.96]};
const W3W={over:null,cur:'klar',k:{gray:0,col:new THREE.Color('#ffffff'),sun:1,fog:1,wind:1,lt:1},flash:0,nextFlash:0};
function setWeatherVisual(s){W3W.over=s&&WXP[s]?s:null;}
function weatherNow(){if(W3W.over)return W3W.over;const s=G&&G.weather&&cur&&G.weather[cur.id];return WXP[s]?s:'klar';}
const SKY_VS='varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const SKY_FS='uniform sampler2D uCloud;uniform float uCov;uniform vec2 uCO;uniform vec3 uCloudC;uniform vec3 uCloudS;uniform vec3 top;uniform vec3 hor;uniform vec3 gnd;uniform vec3 sunD;uniform vec3 moonD;uniform vec3 sunC;uniform float star;uniform float sunV;uniform float moonV;uniform float uT;uniform float uFlash;varying vec3 vP;'+
 'float h21(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec3 d=normalize(vP);float y=d.y;'+
 'vec3 c=y>0.?mix(hor,top,pow(clamp(y*1.3,0.,1.),.62)):mix(hor,gnd,clamp(-y*4.,0.,1.));'+
 'float sd=dot(d,sunD);c+=sunC*pow(max(sd,0.),5.)*.28*sunV*(1.-clamp(y,0.,1.)*.5);c+=sunC*smoothstep(.985,.9984,sd)*.3*sunV;c=mix(c,vec3(1.,.98,.9),smoothstep(.9984,.9988,sd)*sunV);c+=sunC*pow(max(sd,0.),48.)*.3*sunV;'+
 'vec2 g=floor(d.xz*360.0/max(y+.25,.25));float n=h21(g);float tw=.55+.45*sin(uT*2.3+n*60.);c+=vec3(step(.9968,n)*smoothstep(.03,.3,y)*star*tw*(.6+.4*fract(n*91.7)));'+
 'float md=dot(d,moonD);float m=smoothstep(.9991,.99935,md);float cut=smoothstep(.9991,.99935,dot(d,normalize(moonD+vec3(.022,.014,-.01))));'+
 'c=mix(c,vec3(1.,.97,.86),m*(1.-cut*.88)*moonV);c+=vec3(.6,.7,1.)*pow(max(md,0.),90.)*.22*moonV;'+
 // Look L1: prozedurale Wolkendecke (driftet langsam, von der Sonne angestrahlt, verdeckt Sterne/Sonne teilweise)
 'if(y>-.02){vec2 cu=d.xz/(max(y,0.)+.1)*.42+uCO;float n=texture2D(uCloud,cu).r*.6+texture2D(uCloud,cu*2.6+vec2(.37,.11)).g*.4;float cv=smoothstep(uCov,uCov+.26,n)*smoothstep(-.02,.16,y);'+
 'float lit=clamp((n-uCov)*2.4,0.,1.);vec3 cc=mix(uCloudS,uCloudC,.3+.7*lit)+sunC*pow(max(sd,0.),6.)*.3*sunV;c=mix(c,cc,cv*.92);}'+
 'c+=vec3(.85,.9,1.)*uFlash;gl_FragColor=vec4(c,1.);}';
function init3d(){if(R3||!window.THREE)return;const cvs=$('#world3d'),r=new THREE.WebGLRenderer({canvas:cvs,antialias:true});
 r.setPixelRatio(Math.min(devicePixelRatio,2));r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
 const cam=new THREE.PerspectiveCamera(62,15/11,.05,120),hemi=new THREE.HemisphereLight(0xffffff,0x445544,.8),sun=new THREE.DirectionalLight(0xffffff,.9);
 {const T=perfTier(),ms=T.shadow||512;sun.castShadow=!!T.shadow;sun.shadow.mapSize.set(ms,ms);}Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:.5,far:42});sun.shadow.bias=-.0006;sun.shadow.normalBias=.035;
 const lamp=new THREE.PointLight(0xffd59a,0,7,2),pl=[0,1].map(()=>new THREE.PointLight(0xffb85c,0,5.5,2));
 const dome=new THREE.Mesh(new THREE.SphereGeometry(80,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uCloud:{value:w3texCloud()},uCov:{value:.5},uCO:{value:new THREE.Vector2()},uCloudC:{value:new THREE.Color('#ffffff')},uCloudS:{value:new THREE.Color('#c8d4e0')},top:{value:new THREE.Color()},hor:{value:new THREE.Color()},gnd:{value:new THREE.Color()},star:{value:0},sunD:{value:new THREE.Vector3(0,1,0)},moonD:{value:new THREE.Vector3(0,-1,0)},sunC:{value:new THREE.Color('#fff2c8')},sunV:{value:1},moonV:{value:0},uT:{value:0},uFlash:{value:0}},vertexShader:SKY_VS,fragmentShader:SKY_FS}));
 dome.renderOrder=-10;dome.frustumCulled=false;
 R3={dome,r,cam,hemi,sun,lamp,pl,player:person3d('#e8623a','#1f8a7a'),yaw:0,mapId:null,scene:null,cd:3.4,bg:new THREE.Color(),vel:{},camC:new THREE.PerspectiveCamera(55,15/11,.05,140),shown:new THREE.PerspectiveCamera(60,15/11,.05,120)};R3.activeCam=cam;
 const fit=()=>{const s=$('#screen');if(!s.clientWidth)return;r.setPixelRatio(Math.min(4,resH3()/s.clientHeight));r.setSize(s.clientWidth,s.clientHeight,false);cam.aspect=s.clientWidth/s.clientHeight;cam.updateProjectionMatrix();R3.camC.aspect=cam.aspect;R3.camC.updateProjectionMatrix();};
 R3.fit=fit;new ResizeObserver(fit).observe($('#screen'));fit();}
// ---------- Terrain: sanft gewellt, Wege/Gebäude flach, Wasser als Senke ----------
const TER={};
function softT(t,th){return t==='.'||t==='"'||t==='F'||t==='T'||t==='R'||(th==='cave'&&(t==='c'||t===':'));}
function wetT(t){return t==='~'||t==='Q'||t==='='||t==='I';}
function vnoise(x,z){const ix=Math.floor(x),iz=Math.floor(z);let fx=x-ix,fz=z-iz;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);const a=hs(ix,iz),b=hs(ix+1,iz),c=hs(ix,iz+1),d=hs(ix+1,iz+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;}
function terrBuild(m){const W=m.w,H=m.h,s=new Float32Array(W*H),wt=new Uint8Array(W*H),amp=m.inside?0:th3(m).amp;
 const raw=(x,y)=>{const t=tileAt(m,x,y);return t===null||softT(t,m.theme)?1:0;};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=m.rows[y][x];wt[y*W+x]=t==='~'||t==='Q'?1:0;if(!softT(t,m.theme))continue;let a=0;for(let j=-1;j<2;j++)for(let i=-1;i<2;i++)a+=raw(x+i,y+j);s[y*W+x]=Math.pow(a/9,1.6);}
 return TER[m.id]={W,H,s,wt,amp,m,seed:hs(W,H*3)*40};}
function terrH(T,x,z){const{W,H,s}=T;let h=0;
 if(T.amp){const S=(i,j)=>s[Math.min(H-1,Math.max(0,j))*W+Math.min(W-1,Math.max(0,i))];
  const gx=x-.5,gz=z-.5,ix=Math.floor(gx),iz=Math.floor(gz);let fx=gx-ix,fz=gz-iz;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);
  const a=S(ix,iz),b=S(ix+1,iz),c=S(ix,iz+1),d=S(ix+1,iz+1),sv=a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;
  h=sv*T.amp*(vnoise(x*.42+T.seed,z*.42)*.72+vnoise(x*1.1,z*1.1+T.seed)*.28);}
 const tx=Math.floor(x),tz=Math.floor(z);if(tx>=0&&tz>=0&&tx<W&&tz<H&&T.wt[tz*W+tx]&&!T.m.inside){const ux=x-tx,uz=z-tz,land=(i,j)=>{const t=tileAt(T.m,i,j);return t!==null&&!wetT(t);};let e=1;
  if(land(tx,tz-1))e=Math.min(e,uz);if(land(tx,tz+1))e=Math.min(e,1-uz);if(land(tx-1,tz))e=Math.min(e,ux);if(land(tx+1,tz))e=Math.min(e,1-ux);
  if(land(tx-1,tz-1))e=Math.min(e,Math.hypot(ux,uz));if(land(tx+1,tz-1))e=Math.min(e,Math.hypot(1-ux,uz));if(land(tx-1,tz+1))e=Math.min(e,Math.hypot(ux,1-uz));if(land(tx+1,tz+1))e=Math.min(e,Math.hypot(1-ux,1-uz));
  const k=Math.min(1,e/.45);h-=.2*k*k*(3-2*k);}
 return h;}
function terrainY(x,z){const T=cur&&TER[cur.id];return T?terrH(T,x,z):0;}
// Welt-Grafik 2: Palmwedel – gebogener, gezackter Streifen mit Mittelrippe (Ober- und Unterseite), Vertexfarbe dunkel am Stamm → hell an der Spitze
function frondGeo(lod){return g3('frond'+(lod?'l':''),()=>{const N=lod?5:9,P=[],Cc=[],pt=(t,s)=>{const w=.2*Math.sin(Math.PI*Math.pow(t,.75))*(1+(lod?0:.35*((Math.round(t*N*2))%2))),y=.12*t-.62*t*t;return[t*1.05,y-Math.abs(s)*w*.35,s*w];};
 for(let i=0;i<N;i++){const t0=i/N,t1=(i+1)/N,k0=.55+.5*t0,k1=.55+.5*t1;for(const s of[-1,1]){const a=pt(t0,0),b=pt(t1,0),c=pt(t1,s),d=pt(t0,s),q=s>0?[a,b,c,a,c,d]:[a,c,b,a,d,c],kk=[k0,k1,k1,k0,k1,k0];
  q.forEach((v,j)=>{P.push(...v);Cc.push(kk[s>0?j:[0,2,1,3,5,4][j]]);});const r=q.slice().reverse(),rk=(s>0?kk:[0,2,1,3,5,4].map(j=>kk[j])).slice().reverse();r.forEach((v,j)=>{P.push(v[0],v[1]-.006,v[2]);Cc.push(rk[j]*.8);});}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc.flatMap(k=>[k,k,k*.95]),3));g.computeVertexNormals();return g;});}
// ---------- Baum-Varianten (verschmolzene Geometrien mit Vertex-Farben) ----------
function treeGeo(kind,snowy,lod){return g3('tree_'+kind+(snowy?'s':'')+(lod?'_l':''),()=>{const P=[],C=(g,c,m)=>P.push([g,c,m]);const q=lod?.6:1,sg=n=>Math.max(3,Math.round(n*q));
 if(kind==='pine'){C(new THREE.CylinderGeometry(.07,.12,.7,sg(7),1,true),'#6b4a2e',w3M(0,.35,0));[[.62,.75,.55],[.5,.7,1.0],[.36,.6,1.42],[.2,.42,1.78]].forEach(([r,h,y],i)=>{C(new THREE.ConeGeometry(r,h,sg(9)),i%2?'#2f6b48':'#357a50',w3M(0,y,0));if(snowy)C(new THREE.ConeGeometry(r*.72,h*.42,sg(9),1,true),'#f2f7fb',w3M(0,y+h*.3,0));});}
 else if(kind==='palm'){// Nachbesserung 1 (P-2): Stammteile ohne Zwischendeckel, Wedel mit weniger Segmenten (1180 → ≈ 600 Dreiecke; ferne LOD ≈ 250)
  const nT=lod?3:5;for(let i=0;i<nT;i++){const j=i*5/nT;C(new THREE.CylinderGeometry(.075-j*.008,.09-j*.008,.42*5/nT,sg(7),1,i<nT-1),i%2?'#9a7448':'#b08656',w3M(j*j*.018,.21*5/nT+i*.4*5/nT,0,1,1,1,0,0,-j*.06));}
  const tx=.29,ty=2.05,nF=lod?6:8;for(let i=0;i<nF;i++){const a=i/nF*Math.PI*2+(i%2)*.2;C(frondGeo(lod),i%2?'#3f9a48':'#4fae52',w3M(tx,ty-.02,0,1.05-(i%3)*.08,1,1,0,-a,(i%2?.12:-.05)));}
  (lod?[[.03,0]]:[[.06,0],[-.05,.07],[0,-.07]]).forEach(([a,b])=>C(new THREE.SphereGeometry(.07,5,4),'#6a4a2a',w3M(tx+a,ty-.12,b)));}
 else if(kind==='cactus'){C(new THREE.CylinderGeometry(.17,.19,1.3,10),'#5f9a4a',w3M(0,.65,0));C(new THREE.SphereGeometry(.17,10,6),'#6aa852',w3M(0,1.3,0));
  [[-1,.55,.45],[1,.75,.35]].forEach(([s,y,h])=>{C(new THREE.CylinderGeometry(.09,.09,.28,8),'#5f9a4a',w3M(s*.24,y,0,1,1,1,0,0,s*Math.PI/2));C(new THREE.CylinderGeometry(.09,.09,h,8),'#5f9a4a',w3M(s*.36,y+h/2,0));C(new THREE.SphereGeometry(.09,8,5),'#6aa852',w3M(s*.36,y+h,0));});
  C(new THREE.SphereGeometry(.07,6,4),'#ff7aa8',w3M(0,1.46,0,1,.6,1));}
 else if(kind==='dead'){C(new THREE.CylinderGeometry(.06,.13,1.4,6),'#3e302a',w3M(0,.7,0,1,1,1,.05,0,.08));[[.3,1.0,.6],[-.25,1.2,-.7],[.1,1.35,2.2]].forEach(([x,y,a])=>C(new THREE.CylinderGeometry(.025,.05,.6,5),'#46362e',w3M(x,y,0,1,1,1,0,a,x>0?-.8:.8)));}
 else if(kind==='stalag'){C(new THREE.ConeGeometry(.32,1.5,7),'#5a4a40',w3M(0,.75,0));C(new THREE.ConeGeometry(.18,.8,6),'#6a584c',w3M(.22,.4,.1));C(new THREE.OctahedronGeometry(.13),'#9fe4f2',w3M(-.16,.3,.18,1,2.2,1,0,0,.3));}
 else if(kind==='column'){C(new THREE.CylinderGeometry(.34,.38,.18,12),'#cfc8b8',w3M(0,.09,0));C(new THREE.CylinderGeometry(.24,.27,1.9,12),'#e6e0d2',w3M(0,1.13,0));C(new THREE.CylinderGeometry(.36,.3,.16,12),'#d8d2c2',w3M(0,2.14,0));
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;C(new THREE.BoxGeometry(.03,1.8,.04),'#c8c0ae',w3M(Math.cos(a)*.255,1.12,Math.sin(a)*.255,1,1,1,0,-a,0));}}
 else if(kind==='pillar'){C(new THREE.CylinderGeometry(.22,.26,2.2,10),'#6a7480',w3M(0,1.1,0));[.6,1.5].forEach(y=>C(new THREE.CylinderGeometry(.235,.235,.1,10),'#7ff0ff',w3M(0,y,0)));C(new THREE.BoxGeometry(.6,.12,.6),'#4a525c',w3M(0,2.2,0));}
 else if(kind==='crate'){C(new THREE.BoxGeometry(.7,.6,.7),'#a8743e',w3M(0,.3,0));C(new THREE.BoxGeometry(.5,.45,.5),'#c08a50',w3M(.05,.82,-.02,1,1,1,0,.4,0));C(new THREE.CylinderGeometry(.2,.2,.5,10),'#7a5434',w3M(-.42,.25,.3));}
 return w3merge(P);});}
// ---------- Wasser-Shader: Wellen, Uferschaum, Himmels-Spiegelung, Tiefe; Lava-Variante ----------
const WATER_VS='attribute vec4 aEdge;attribute float aDeep;varying vec4 vE;varying vec2 vUv;varying vec3 vW;varying float vD;\n#include <fog_pars_vertex>\nvoid main(){vUv=uv;vE=aEdge;vD=aDeep;vec4 wp=vec4(position,1.0);\n#ifdef USE_INSTANCING\nwp=instanceMatrix*wp;\n#endif\nwp=modelMatrix*wp;vW=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}';
// Welt-Grafik 2: Wellen-Normale aus zwei driftenden Rauschlagen (+ feine Sinuswellen), Fresnel (Schlick) mit Himmels-Cubemap, Sonnenglitzern,
// heller Sandgrund im Flachen (Uferübergang), weiche Lichtflecken, aufgelockerter Uferschaum; Lava wie bisher (Krusten-Muster, deckend)
const WATER_FS='uniform float uTime;uniform float uDay;uniform float uLava;uniform vec3 uCol;uniform vec3 uDeepC;uniform vec3 uHi;uniform vec3 uSkyT;uniform vec3 uSkyH;uniform vec3 uSunD;uniform vec3 uSunC;uniform samplerCube uEnv;uniform float uEnvOn;uniform sampler2D uNz;uniform vec3 uSand;varying vec4 vE;varying vec2 vUv;varying vec3 vW;varying float vD;\n#include <fog_pars_fragment>\n'+
 'void main(){float t=uTime*(1.-uLava*.75);float w=sin(vW.x*5.0+t*1.6)+sin(vW.z*4.2-t*1.1)+sin((vW.x+vW.z)*7.0+t*2.3)*.6;'+
 'vec2 q1=vW.xz*.21+vec2(t*.019,t*.012),q2=vW.zx*.37-vec2(t*.015,-t*.022);float e=.012,a1=texture2D(uNz,q1).r,a2=texture2D(uNz,q2).g;'+
 'float gx=texture2D(uNz,q1+vec2(e,0.)).r-a1+texture2D(uNz,q2+vec2(0.,e)).g-a2,gz=texture2D(uNz,q1+vec2(0.,e)).r-a1+texture2D(uNz,q2+vec2(e,0.)).g-a2;'+
 'vec3 n=normalize(vec3(-gx*6.+cos(vW.x*5.+t*1.6)*.035,1.,-gz*6.-cos(vW.z*4.2-t*1.1)*.03));'+
 'float d=9.;if(vE.x>.5)d=min(d,1.-vUv.y);if(vE.y>.5)d=min(d,1.-vUv.x);if(vE.z>.5)d=min(d,vUv.y);if(vE.w>.5)d=min(d,vUv.x);'+
 'float shore=min(d,1.)+max(vD-1.,0.);float deep=smoothstep(.25,2.6,shore);'+
 'float wob=(a1-.5)*.12+sin(vW.x*9.+t*1.8)*.02;float pulse=.5+.5*sin(t*1.4+vW.x*2.3+vW.z*1.7);float foam=smoothstep(.12+pulse*.05,.03,d+wob)+smoothstep(.035,0.,abs(d-.2-pulse*.06+wob))*.45*smoothstep(.35,.6,a2);'+
 'vec3 V=normalize(cameraPosition-vW);float nv=max(dot(V,n),0.);float fr=.035+.965*pow(1.-nv,5.);vec3 R=reflect(-V,n);'+
 'vec3 sky=mix(mix(uSkyH,uSkyT,clamp(R.y*1.6,0.,1.)),textureCube(uEnv,vec3(R.x,max(R.y,.03),R.z)).rgb,uEnvOn);'+
 'vec3 base=mix(uCol,uDeepC,deep);base=mix(base,uSand,(1.-smoothstep(0.,.5,shore))*.38*(1.-uLava));'+
 'base+=uHi*smoothstep(1.02,1.18,a1+a2)*(1.-deep*.7)*.22*(1.-uLava);'+
 'vec3 c=mix(base,sky,clamp(fr*1.15+.1,0.,.88)*(1.-uLava));'+
 'float sd=max(dot(R,uSunD),0.);c+=uSunC*(smoothstep(.9965,.9995,sd)*1.6*smoothstep(.45,.7,a1)+pow(sd,40.)*.22)*(1.-uLava);'+
 'c=mix(c,mix(vec3(1.),vec3(1.,.95,.6),uLava),clamp(foam,0.,1.)*.85);c*=mix(mix(.34,1.,uDay),1.,uLava);'+
 'if(uLava>.5){float hi=step(1.5,w)*.6+step(1.85,w)*.4;c=mix(c,uHi,hi*(.45-deep*.2));float cr=smoothstep(.8,1.2,abs(sin(vW.x*3.1+t*.7)*sin(vW.z*2.7-t*.5))*1.6);c=mix(c,uHi*1.35,cr*.6);}'+
 'gl_FragColor=vec4(c,mix(mix(.72,.96,deep),1.,uLava)+foam*.2);\n#include <fog_fragment>\n}';
function waterMat(p,lava){return new THREE.ShaderMaterial({uniforms:Object.assign({uTime:{value:0},uDay:{value:1},uLava:{value:lava?1:0},uCol:{value:new THREE.Color(lava?'#ff6a1a':p.w2).lerp(new THREE.Color(p.w),lava?0:.35)},uDeepC:{value:new THREE.Color(lava?'#c8320e':shade(p.w,.62))},uHi:{value:new THREE.Color(lava?'#ffd24a':p.w2).lerp(new THREE.Color('#ffffff'),lava?0:.55)},
 uSkyT:{value:new THREE.Color('#4f8fe0')},uSkyH:{value:new THREE.Color('#cfeaf6')},uSunD:{value:new THREE.Vector3(0,1,0)},uSunC:{value:new THREE.Color('#fff4d0')},uEnv:{value:null},uEnvOn:{value:0},uNz:{value:w3texCloud()},uSand:{value:new THREE.Color(typeof PALETTE!=='undefined'&&PALETTE.mat&&PALETTE.mat.sand||'#d9c7a0').multiplyScalar(.92)}},THREE.UniformsUtils.clone(THREE.UniformsLib.fog)),vertexShader:WATER_VS,fragmentShader:WATER_FS,transparent:!lava,depthWrite:!!lava,fog:true});}
function waterMesh(list,p,m,lava){if(!list.length)return null;const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);const mt=waterMat(p,lava);
 const E=new Float32Array(list.length*4),Dp=new Float32Array(list.length),land=(x,y)=>{const t=m?tileAt(m,x,y):null;return t!==null&&!wetT(t);};
 const im=new THREE.InstancedMesh(g,mt,list.length),d=new THREE.Object3D();
 list.forEach(([x,y],i)=>{d.position.set(x+.5,.03,y+.5);d.updateMatrix();im.setMatrixAt(i,d.matrix);E.set([land(x,y-1),land(x+1,y),land(x,y+1),land(x-1,y)].map(Number),i*4);
  let k=4;for(let r=1;r<4&&k===4;r++)for(let j=-r;j<=r&&k===4;j++)for(let q=-r;q<=r;q++)if(land(x+q,y+j)){k=r;break;}Dp[i]=k;});
 g.setAttribute('aEdge',new THREE.InstancedBufferAttribute(E,4));g.setAttribute('aDeep',new THREE.InstancedBufferAttribute(Dp,1));im.renderOrder=1;im.frustumCulled=false;return im;}
function oceanMesh(p,cx,cz,y){const g=new THREE.PlaneGeometry(220,220,1,1);g.rotateX(-Math.PI/2);const n=g.attributes.position.count;g.setAttribute('aEdge',new THREE.BufferAttribute(new Float32Array(n*4),4));g.setAttribute('aDeep',new THREE.BufferAttribute(new Float32Array(n).fill(5),1));
 const o=new THREE.Mesh(g,waterMat(p,0));o.position.set(cx,y,cz);o.renderOrder=0;o.frustumCulled=false;return o;}
// ---------- Glüh-Mesh: Fenster, Laternen, Kristalle (Tag-/Nachtfarbe je Vertex) ----------
const GLOW_VS='attribute vec3 aNight;attribute float aMat;uniform float uN;varying vec3 vC;varying float vG;varying vec3 vWN;varying vec3 vWP;varying float vNFd;\n#include <fog_pars_vertex>\nvoid main(){vC=mix(color,aNight,uN);vG=aMat;vWN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;vec4 mvPosition=viewMatrix*w;vNFd=-mvPosition.z;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}';
// Glas (aMat 1): Himmelsspiegelung mit Fresnel + Glanzpunkt am Tag, nachts warmes Fensterlicht
const GLOW_FS='uniform samplerCube uEnv;uniform float uEnvOn;uniform float uN;uniform vec4 uNF;varying vec3 vC;varying float vG;varying vec3 vWN;varying vec3 vWP;varying float vNFd;\n#include <fog_pars_fragment>\nvoid main(){'+NF_GLSL('vNFd')+'vec3 c=vC;if(vG<.5)c*=.78+.34*max(dot(normalize(vWN),normalize(vec3(.35,.8,.45))),0.)+.12*pow(1.-abs(dot(normalize(vWP-cameraPosition),normalize(vWN))),2.);if(vG>.5&&vG<9.5){vec3 I=normalize(vWP-cameraPosition),N=normalize(vWN),Rf=reflect(I,N);float fr=.3+.7*pow(1.-abs(dot(I,N)),3.);'+
 'c=mix(c,textureCube(uEnv,Rf).rgb*1.08+.05,fr*.72*(1.-uN*.8)*uEnvOn);c+=vec3(pow(max(dot(Rf,vec3(.55,.62,.55)),0.),36.)*.35*(1.-uN));}gl_FragColor=vec4(c,1.);\n#ifdef USE_FOG\nfloat fogFactor=smoothstep(fogNear,fogFar,fogDepth)*(vG>9.5?.5:1.);gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogFactor);\n#endif\n}';
function glowMesh(parts){if(!parts.length)return null;const m=new THREE.Mesh(w3merge(parts),new THREE.ShaderMaterial({uniforms:Object.assign({uN:{value:0},uEnv:{value:null},uEnvOn:{value:0},uNF:nfU()},THREE.UniformsUtils.clone(THREE.UniformsLib.fog)),vertexShader:GLOW_VS,fragmentShader:GLOW_FS,vertexColors:true,fog:true}));m.frustumCulled=false;return m;}
// ---------- Bodentextur-Zusätze je Theme ----------
function groundPaint(tx,m,th,p){const T=(x,y)=>m.rows[y][x];
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=T(x,y),sx=x*16,sy=y*16,n=hs(x*3,y*7);tx.save();tx.translate(sx,sy);
  if(th.deck&&(t==='.'||t===','||t==='"'||t==='o')){tx.fillStyle=t===','?'#c8955e':'#b98a5a';tx.fillRect(-.05,-.05,16.1,16.1);tx.fillStyle='rgba(70,40,20,.35)';for(let i=0;i<16;i+=4)tx.fillRect(0,i,16,.5);tx.fillRect(((y*5)%4)*4+2,0,.5,4);tx.fillRect(((y*3+2)%4)*4,8,.5,4);}
  else if((th.metal)&&(t==='.'||t===',')){tx.fillStyle=t===','?(th.dark?'#5e5a6a':'#b8c0c6'):(th.dark?'#46424f':'#98a2aa');tx.fillRect(-.05,-.05,16.1,16.1);tx.strokeStyle='rgba(0,0,0,.25)';tx.lineWidth=.5;tx.strokeRect(.5,.5,15,15);tx.fillStyle='rgba(255,255,255,.25)';[[2,2],[13,2],[2,13],[13,13]].forEach(([a,b])=>tx.fillRect(a,b,1,1));
   if(t===','&&n<.5){tx.fillStyle=th.dark?'rgba(255,58,90,.6)':'rgba(255,214,74,.7)';tx.fillRect(0,7.3,16,1.4);}}
  else if(th.marble&&(t===','||t==='.')){tx.fillStyle=t===','?'#f6f1e6':'#e9e2d2';tx.fillRect(-.05,-.05,16.1,16.1);tx.strokeStyle='rgba(160,140,100,.35)';tx.lineWidth=.5;tx.strokeRect(0,0,8,8);tx.strokeRect(8,8,8,8);if(t===','&&x%3===0){tx.fillStyle='rgba(212,170,60,.5)';tx.fillRect(7,0,2,16);}}
  else if(th.slabs&&t===','){tx.fillStyle='#cfc6ac';tx.fillRect(-.05,-.05,16.1,16.1);tx.strokeStyle='rgba(90,80,60,.35)';tx.lineWidth=.6;tx.strokeRect(.5,.5,7,7.5);tx.strokeRect(8,1,7.5,6.5);tx.strokeRect(.5,8.5,9,7);tx.strokeRect(10,8,5.5,7.5);if(n<.4){tx.fillStyle='rgba(90,130,70,.45)';tx.fillRect(9,0,1.2,16);}}
  // Kontaktschatten unter Bäumen, Felsen, an Klippen- und Gebäudefüßen
  if(!m.inside){tx.fillStyle='rgba(20,40,30,.22)';if(t==='T'){tx.beginPath();tx.ellipse(8,9,9,7,0,0,7);tx.fill();}else if(t==='R'){tx.beginPath();tx.ellipse(8,9,7,5,0,0,7);tx.fill();}
   else if(!BUILD.includes(t)&&t!=='X'){const up=y>0?T(x,y-1):'';if(BUILD.includes(up)||up==='X'){const g=tx.createLinearGradient(0,0,0,6);g.addColorStop(0,'rgba(20,30,40,.3)');g.addColorStop(1,'rgba(20,30,40,0)');tx.fillStyle=g;tx.fillRect(0,0,16,6);}}}
  tx.restore();}}
function build3d(){if(!PAL[cur.theme])PAL[cur.theme]=palOf(cur);const m=cur,p=palOf(m),th=th3(m),S=new THREE.Scene(),k=4,T=terrBuild(m),ty=(x,z)=>terrH(T,x,z),out=!m.inside&&!th.enclosed;S.userData={wins:[],npcs:[],lan:[],th,fount:[],ice:[],crys:[],torch:[]};
 const lead=leadOf(m),C=c=>new THREE.Color(c),veg=c=>C(c).lerp(lead,.1),snowy=th.snowy||m.theme==='snow',inside=!!m.inside,ik=inside&&typeof INTERIORS!=='undefined'&&INTERIORS[m.id]?INTERIORS[m.id].k:'';
 // Boden (Look L1): draußen weiche Material-Mischung aus Typkarte + kachelbaren Detailtexturen (groundMat); Innenräume/Deck/Metall/Marmor weiter als gemalte Kacheltextur
 const cave=m.theme==='cave',splat=!inside&&!th.deck&&!th.metal&&!th.marble;let grMat;
 if(splat)grMat=S.userData.gmat=groundMat(m,th,p,lead);
 else{const tc=document.createElement('canvas');tc.width=m.w*16*k;tc.height=m.h*16*k;const tx=tc.getContext('2d');tx.scale(k,k);DC=tx;
  const sub=t=>{if(m.theme==='inside')return 'WBCKR'.includes(t)?'o':t;if(t==='D'||t==='G')return '.';if(t==='Q')return '~';if(t==='T'||t==='R')return cave?'c':'.';if(BUILD.includes(t)||/[0-9]/.test(t))return cave?'c':',';if(t==='X')return 'c';return t;};
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)drawTile(sub(m.rows[y][x]),x,y,x*16,y*16);DC=null;groundPaint(tx,m,th,p);
  const tex=new THREE.CanvasTexture(tc);tex.anisotropy=R3.r.capabilities.getMaxAnisotropy();grMat=new THREE.MeshLambertMaterial({map:tex});}
 const gg=new THREE.PlaneGeometry(m.w,m.h,inside?1:m.w*4,inside?1:m.h*4);gg.rotateX(-Math.PI/2);gg.translate(m.w/2,0,m.h/2);
 {const gp=gg.attributes.position;for(let i=0;i<gp.count;i++)gp.setY(i,ty(gp.getX(i),gp.getZ(i)));gg.computeVertexNormals();}
 const gm=new THREE.Mesh(gg,grMat);gm.receiveShadow=true;S.add(gm);
 const rn=prng(m.w*m.h+7),cx0=m.w/2,cz0=m.h/2,dOut=(x,z)=>Math.hypot(Math.max(0,Math.abs(x-cx0)-m.w/2),Math.max(0,Math.abs(z-cz0)-m.h/2));
 const nearExit=(x,z)=>{const ex=Math.min(m.w-1,Math.max(0,Math.floor(x))),ez=Math.min(m.h-1,Math.max(0,Math.floor(z)));for(let i=-3;i<=3;i++){const a=Math.abs(x-cx0)-m.w/2>Math.abs(z-cz0)-m.h/2;const t=a?tileAt(m,ex,ez+i):tileAt(m,ex+i,ez);if(t&&isPathT(t))return true;}return false;};
 // Meer am Rand: wo nahe der Kante Wasser liegt (beach) bzw. überall (sea/ship)
 const seaAll=th.outer==='ocean',seaEdge=th.outer==='coast'||th.outer==='hills';
 const seaAt=(x,z)=>{if(seaAll)return 1;if(!seaEdge)return 0;const ex=Math.min(m.w-1,Math.max(0,Math.floor(x))),ez=Math.min(m.h-1,Math.max(0,Math.floor(z)));let n=0;for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const t=tileAt(m,ex+i,ez+j);if(t==='~'||t==='Q')n++;}return n>=6?1:0;};
 const hasSea=out&&(seaAll||(()=>{for(let i=0;i<m.w;i++)if(seaAt(i,-1)||seaAt(i,m.h+1))return 1;for(let j=0;j<m.h;j++)if(seaAt(-1,j)||seaAt(m.w+1,j))return 1;return 0;})());
 const OCY=th.deck?-1.6:-.24;
 const outerY=(x,z)=>{const d=dOut(x,z);if(d<.01)return -.4;if(hasSea&&seaAt(x,z))return th.deck?-3:(d<1.2?-.1:-.24-Math.min(1,(d-1.2)/3)*.9+vnoise(x*.2,z*.2)*(seaAll?.5:0));
  const pk=th.outer==='peaks'?2.2:th.outer==='dunes'?1.4:1;return .06+Math.min(1,d/4)*.3+vnoise(x*.13+3,z*.13)*Math.min(1,Math.max(0,(d-1.5)/10))*3.2*pk*(nearExit(x,z)?.25:1);};
 if(!inside){const og=new THREE.PlaneGeometry(170,170,60,60);og.rotateX(-Math.PI/2);{const op=og.attributes.position,fq=u=>Math.sign(u)*85*Math.pow(Math.abs(u)/85,1.55);for(let i=0;i<op.count;i++)op.setXYZ(i,fq(op.getX(i)),0,fq(op.getZ(i)));}og.translate(cx0,0,cz0);if(out){const op=og.attributes.position;for(let i=0;i<op.count;i++)op.setY(i,outerY(op.getX(i),op.getZ(i)));og.computeVertexNormals();}else og.translate(0,-.02,0);
  const oc=C(shade(cave||th.enclosed?p.tr:p.g,.88)).lerp(lead,out?.06:0),om=new THREE.Mesh(og,out&&splat?grMat:mat('#'+oc.getHexString()));om.receiveShadow=true;S.add(om);
  if(hasSea){const oc2=oceanMesh(p,cx0,cz0,OCY);S.add(oc2);S.userData.ocean=oc2;}}
 const L={T:[],R:[],G:[],g:[],X:[],W:[],B:[],C:[],K:[],P:[]},tuft=out&&!snowy&&m.theme!=='beach'&&!th.deck&&!th.metal&&!th.marble;
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];
  if(inside){if(t==='W')L.W.push([x,y]);else if(t==='B')L.B.push([x,y]);else if(t==='C')L.C.push([x,y]);else if(t==='K')L.K.push([x,y]);else if(t==='R')L.P.push([x,y]);continue;}
  if(t==='T')L.T.push([x,y]);else if(t==='R')L.R.push([x,y]);else if(t==='"')for(let i=0;i<10;i++)L.G.push([x+.06+hs(x*3+i,y)*.88,y+.06+hs(y*5+i,x)*.88]);else if(t==='X')L.X.push([x,y]);
  else if(tuft&&(t==='.'||t==='F')&&hs(x*5,y*9)<.85)for(let i=0;i<3;i++)L.g.push([x+.08+hs(x+i*7,y*3)*.84,y+.08+hs(y+i*5,x*3)*.84]);}
 // inst(geo,mat,liste,fn,schatten,o): o.chunk = in Pakete (Raster CH) mit eigener Hüllkugel teilen → Frustum-Culling (Kamera + Schatten); o.veg = Dichte je Qualitätsstufe (zufällige Reihenfolge)
 const d=new THREE.Object3D(),CH=Math.max(10,Math.ceil(Math.max(m.w,m.h)/2)+1),inst=(geo,mt,list,fn,sh,o)=>{if(!list.length)return;o=o||{};const n=list.length,M=new Float32Array(n*16),PS=new Float32Array(n*4),CC=new Array(n);
  list.forEach((it,i)=>{d.position.set(0,0,0);d.rotation.set(0,0,0);d.scale.set(1,1,1);const c=fn(it,i);d.updateMatrix();d.matrix.toArray(M,i*16);PS[i*4]=d.position.x;PS[i*4+1]=d.position.y;PS[i*4+2]=d.position.z;PS[i*4+3]=Math.max(d.scale.x,d.scale.y,d.scale.z);CC[i]=c&&c.isColor?c:null;});
  const groups=new Map();for(let i=0;i<n;i++){const key=o.chunk?Math.floor(PS[i*4]/CH)+','+Math.floor(PS[i*4+2]/CH):'a';let g=groups.get(key);if(!g)groups.set(key,g=[]);g.push(i);}
  if(o.chunk&&!geo.boundingSphere)geo.computeBoundingSphere();const gr=o.chunk?geo.boundingSphere.radius+geo.boundingSphere.center.length():0,out=[];
  for(const idx of groups.values()){if(o.veg)idx.sort((a,b)=>hs(a,77)-hs(b,77));let g2=geo;
   if(o.chunk){g2=new THREE.BufferGeometry();g2.index=geo.index;for(const k in geo.attributes)g2.setAttribute(k,geo.attributes[k]);let cx=0,cy=0,cz=0;for(const i of idx){cx+=PS[i*4];cy+=PS[i*4+1];cz+=PS[i*4+2];}cx/=idx.length;cy/=idx.length;cz/=idx.length;
    let rr=0;for(const i of idx)rr=Math.max(rr,Math.hypot(PS[i*4]-cx,PS[i*4+1]-cy,PS[i*4+2]-cz)+gr*PS[i*4+3]);g2.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,cy,cz),rr+.5);}
   const im=new THREE.InstancedMesh(g2,mt,idx.length);idx.forEach((i,j)=>{im.instanceMatrix.array.set(M.subarray(i*16,i*16+16),j*16);if(CC[i])im.setColorAt(j,CC[i]);});im.instanceMatrix.needsUpdate=true;
   im.castShadow=sh!==false;im.receiveShadow=true;im.frustumCulled=!!o.chunk;im.userData.n0=idx.length;if(o.veg){im.userData.veg=1;S.userData.veg=S.userData.veg||[];S.userData.veg.push(im);}S.add(im);out.push(im);}
  return o.chunk?out:out[0];};
 // Bäume: Theme-Variante; 'round' = Stamm + weiche, überlappende Kronen-Kugeln
 const TR=L.T.map(([x,y])=>[x+.5+(hs(x,y*7)-.5)*.18,y+.5+(hs(y,x*7)-.5)*.18,.85+hs(x,y)*.35]);
 if(out){const n=th.dense?90:48;for(let i=0;i<n;i++){const a=rn()*Math.PI*2,r=Math.max(m.w,m.h)*.5+2+rn()*(th.dense?14:9),x=cx0+Math.cos(a)*r*(m.w/Math.max(m.w,m.h))*1.15,z=cz0+Math.sin(a)*r*(m.h/Math.max(m.w,m.h))*1.15;const dd=dOut(x,z);if(dd<1.2||nearExit(x,z)||hasSea&&seaAt(x,z))continue;TR.push([x,z,.9+rn()*.5,outerY(x,z)]);}}
 const tk=th.tree||'round',kindOf=(x,z)=>{const r=hs(x*13|0,z*17|0);if(tk==='forest')return r<.35?'pine':'round';if(tk==='palm')return r<.7?'palm':'round';if(cave)return 'stalag';return tk;};
 const byK={};TR.forEach(q=>{const kk=kindOf(q[0],q[1]);(byK[kk]=byK[kk]||[]).push(q);});
 // Nachbesserung 1 (P-2): ferne Bäume (Außenring, y0 gesetzt) als LOD-Geometrie mit weniger Segmenten
 for(const kk in byK){if(kk==='round')continue;for(const far of[0,1]){const list=byK[kk].filter(q=>(q[3]!=null)===!!far);if(!list.length)continue;const geo=treeGeo(kk,snowy&&kk==='pine',far),im=inst(geo,kk==='palm'?toonMat('#ffffff',{vertexColors:true,wind:[.05,-1.4],nf:1}):toonMat('#ffffff',{vertexColors:true,nf:1}),list,([x,z,s,y0])=>{d.position.set(x,(y0??ty(x,z))-.03,z);const sc=kk==='column'&&hs(x*7|0,z*3|0)<.3?.55:1;d.scale.set(s,s*(kk==='pine'?1.15:1)*sc,s);d.rotation.y=hs(x*9|0,z*9|0)*6;return C('#ffffff').lerp(lead,.06).multiplyScalar(.92+hs(x*3|0,z*5|0)*.12);},true,{chunk:1});
  if(im&&(kk==='column'||kk==='pillar'||kk==='crate'||kk==='stalag'))im.forEach(q=>addOutline(q,.02));}}
 const RT=byK.round||[];
 const trunk=g3('trunk2',()=>{const pts=[[.19,0],[.13,.1],[.1,.4],[.085,.8],[.06,1]].map(([a,b])=>new THREE.Vector2(a,b));const parts=[[new THREE.LatheGeometry(pts,6),'#6b4a2e']];
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.4;parts.push([new THREE.SphereGeometry(.07,4,3),'#5e4128',w3M(Math.cos(a)*.14,.02,Math.sin(a)*.14,1.8,.6,1,0,-a,0)]);}return w3merge(parts);});
 {const ft=([x,z,s,y0])=>{d.position.set(x,(y0??ty(x,z))-.03,z);d.scale.set(s,s*.95,s);d.rotation.y=hs(x*9|0,z*9|0)*6;};inst(trunk,barkMat(),RT.filter(q=>q[3]==null),ft,true,{chunk:1});inst(trunk,barkMat(),RT.filter(q=>q[3]!=null),ft,false);}
 // Welt-Grafik 2: je Baum EINE Kronen-Instanz (3 Formen nah, 1 ferne LOD-Form), Büsche als eigene Büschel-Form; Farbe je Baum (Loop C: w1TreeTint)
 const CR=[],BU=[],trc=th.dim?shade(p.tr,th.dim):p.tr,cBase=veg(trc),cHi=veg(shade(trc,1.3)),cWarm=C(m.theme==='swamp'?'#4d5a2a':m.theme==='ember'?'#d9783a':p.warm||(m.theme==='whisper'?'#7a6ad0':'#6fa64a')),cSnow=C('#f2f7fb');
 RT.forEach(([x,z,s,y0])=>{const b=y0??ty(x,z),far=y0!=null,W1T=typeof w1TreeTint==='function'?w1TreeTint(m,x,z,far):null;
  const tint=W1T?W1T[0].clone().lerp(W1T[1],.22):cBase.clone().lerp(cWarm,hs(x*3|0,z*3|0)*.35).lerp(cHi,.12);{const hj=hs(x*5|0,z*11|0),lj=hs(z*7|0,x*5|0);tint.offsetHSL((hj-.5)*(W1T?.02:.06),(hj-.5)*.12,(lj-.5)*.1);}if(snowy)tint.lerp(cSnow,.4);CR.push([x,b,z,s,tint,far,Math.floor(hs(x*7|0,z*3|0)*3)]);});
 if(out&&!th.metal&&!th.marble&&!th.deck){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='.'&&hs(x*3,y*11)<.045){const b=ty(x+.5,y+.5);BU.push([x+.5,b,y+.5,1+hs(x,y*5)*.25,veg(shade(p.tr,1.3)).lerp(cWarm,.3),0,Math.floor(hs(y,x*7)*2)]);}}
 {const cm=addDetail(windify(mat('#ffffff',{vertexColors:true}).clone(),.06,.3,1),'leaf',2.6);cm.userData.windP=[.06,.3];const fc=([x,b,z,s,c])=>{const h1=hs(x*31|0,z*17|0),h2=hs(z*29|0,x*13|0);d.position.set(x,b-.03,z);d.scale.set(s*(.9+.2*h1),s*(.88+.2*h2),s*(1.1-.2*h1));d.rotation.y=x*3+z+h2*2;return c;};
  {const cn=inst(crownGeo(crownK()),cm,CR.filter(q=>!q[5]),fc,false,{chunk:1});if(cn)for(const q of cn)q.userData.crown=1;}inst(crownGeo('p'),cm,CR.filter(q=>q[5]),fc,false);
  {const sp=inst(crownGeo('p'),MAT.shOnly||(MAT.shOnly=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false})),CR.filter(q=>!q[5]),fc,true,{chunk:1});if(sp)for(const q of sp){q.receiveShadow=false;q.renderOrder=-5;}}// Schatten-Stellvertreter (LOD-Krone, unsichtbar im Bild) → Schattenpass ⅓ der Dreiecke
  for(let v=0;v<2;v++)inst(crownGeo('b'+v),cm,BU.filter(q=>q[6]===v),fc,true,{chunk:1});}
 // Felsen weich
 {const ri=inst(rockGeo(),rockMat(),L.R,([x,y])=>{d.position.set(x+.5,ty(x+.5,y+.5)+.12,y+.5);d.scale.set(.46,.36,.42);d.rotation.y=hs(x,y)*6;return C(p.r).lerp(C('#ffffff'),hs(y,x)*.12);});if(ri)addOutline(ri,.02);}
 // Gras: hohes Gras (") = dichte, hohe, satte Halme mit hellen Spitzen; Boden-Büschel = kurz, bodenfarben. Wind + Wegdrücken im Shader
 const blade=g3('blade5b',()=>{// Nachbesserung 1 (P-2): 2 statt 3 Segmente je Halm
 const pos=[],col=[],nor=[];for(let b=0;b<5;b++){const a=b*1.26+.3,ox=Math.cos(a)*.06,oz=Math.sin(a)*.06,ca=Math.cos(a+1.4),sa=Math.sin(a+1.4),hh=[.42,.34,.4,.3,.37][b];
   const ring=[0,.5,1].map(t=>{const w=.03*Math.pow(1-t,.8)+.002,bz=t*t*.1;return[[ox-ca*w+Math.cos(a)*bz,t*hh,oz-sa*w+Math.sin(a)*bz],[ox+ca*w+Math.cos(a)*bz,t*hh,oz+sa*w+Math.sin(a)*bz],.55+t*.6];});
   for(let i=0;i<ring.length-1;i++){const A=ring[i],B=ring[i+1];[[A[0],A[2]],[A[1],A[2]],[B[0],B[2]],[A[1],A[2]],[B[1],B[2]],[B[0],B[2]]].forEach(([v,c])=>{pos.push(...v);col.push(c,c,c*.9);nor.push(0,1,0);});}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g;});
 const gmat=toonFx(new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,gradientMap:toonGrad()}),{grass:1,rim:false,nf:1});// Welt-Grafik 2: Halme direkt vor der Kamera weich ausblenden
 {const cA=veg(p.tg),cB=veg(shade(p.tg,1.35)),tA=veg(shade(p.g,.8)),tB=veg(shade(p.g,1.04)),GL=L.G.map(q=>[q[0],q[1],1]).concat(L.g.map(q=>[q[0],q[1],0]));S.userData.grassC=veg(shade(p.tg,1.2));
  const gDry=C('#c8c45e').lerp(lead,.08),gCool=C('#3f9c72'),gv=(c,x,z)=>{const n=vnoise(x*.16+7,z*.16);return c.lerp(n>.5?gDry:gCool,sst(.56,.86,n)*.42+sst(.44,.14,n)*.3);};inst(blade,gmat,GL,([x,z,tall],i)=>{d.position.set(x,ty(x,z)-.01,z);d.rotation.set(0,hs(i,7)*6.3,0);if(tall){const s=1.15+hs(i,9)*.55;d.scale.set(s,s*1.12,s);return gv(cA.clone().lerp(cB,hs(i,11)),x,z);}
   const s=.45+hs(i,3)*.3;d.scale.set(s,s*.7,s);return gv(tA.clone().lerp(tB,hs(i,13)),x,z);},false,{chunk:1,veg:1});}
 if(out){const FL=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const tt=m.rows[y][x];const meadow=tt==='.'&&!snowy&&!th.metal&&!th.deck&&vnoise(x*.3+5,y*.3+2)>.68;if((tt==='F'||tt==='.'&&!snowy&&!th.metal&&!th.deck)&&(meadow||hs(x*7,y*3)<(tt==='F'?.95:.16))){const ci=meadow?Math.floor(vnoise(x*.09+1,y*.09)*5.99):-1;for(let i=0;i<(tt==='F'?7:meadow?6:3);i++)FL.push([x+.1+hs(x+i,y)*.8,y+.1+hs(y+i,x)*.8,ci]);}}
  const fc=['#ffd84a','#ff7aa8','#ffffff','#9fb8ff','#ff9a4a','#c79bff'];
  // Blume = Stiel + Blatt + Blütenkopf (weiße Blütenblätter werden je Instanz eingefärbt)
  const flower=g3('flower2',()=>{const pg=new THREE.SphereGeometry(.075,10,3),pp=pg.attributes.position;for(let i=0;i<pp.count;i++){const x=pp.getX(i),z=pp.getZ(i),k=1+.3*Math.cos(5*Math.atan2(z,x));pp.setXYZ(i,x*k,pp.getY(i)*.35,z*k);}pg.computeVertexNormals();
   return w3merge([[new THREE.CylinderGeometry(.008,.012,.16,3,1,true),'#3f8f46',w3M(0,.08,0)],[new THREE.SphereGeometry(.03,4,2),'#3f8f46',w3M(.03,.05,0,1.4,.35,.7,0,0,.5)],[pg,'#ffffff',w3M(0,.165,0)],[new THREE.SphereGeometry(.03,5,3),'#ffd23a',w3M(0,.18,0,1,.6,1)]]);});
  inst(flower,toonMat('#ffffff',{vertexColors:true,wind:[.03,.4],tintWhite:true}),FL,(it,i)=>{const[x,z]=it;const s=.8+hs(i,4)*.5;d.position.set(x,ty(x,z),z);d.scale.set(s,s,s);d.rotation.set((hs(i,2)-.5)*.3,hs(i,6)*6,0);return C(fc[it[2]>=0&&hs(i,5)<.8?it[2]:Math.floor(hs(i,13)*fc.length)]);},false,{chunk:1,veg:1});
  // Horizont: Hügel/Dünen, Berge/Gipfel/Vulkan, Wolken
  const HL=[];for(let i=0;i<70&&HL.length<24;i++){const x=cx0+(rn()-.5)*(m.w+44),z=cz0+(rn()-.5)*(m.h+44),dd=dOut(x,z);if(dd<4||dd>22||nearExit(x,z)||hasSea&&seaAt(x,z))continue;const r=3+rn()*5;HL.push([x,z,r,r*(.3+rn()*.3)*(th.outer==='peaks'?1.5:1)]);}
  const hA=C(shade(p.g,.82)).lerp(lead,.08),hB=C(snowy?'#cfdde8':shade(p.tg,1.15));
  inst(g3('dome',()=>new THREE.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI/2)),mat('#ffffff'),HL,([x,z,r,h],i)=>{d.position.set(x,outerY(x,z)-.25,z);d.scale.set(r*(th.outer==='dunes'?1.6:1),h,r*.85);d.rotation.y=rn()*3;return hA.clone().lerp(hB,hs(i,21));},false);
  if(hasSea&&seaAll){const SB=[];for(let i=0;i<14;i++){const a=rn()*Math.PI*2,R=Math.max(m.w,m.h)*.6+4+rn()*18;SB.push([cx0+Math.cos(a)*R,cz0+Math.sin(a)*R,1.5+rn()*3]);}
   inst(g3('dome'),mat('#ffffff'),SB,([x,z,r],i)=>{d.position.set(x,OCY-.12,z);d.scale.set(r*1.6,.35,r);d.rotation.y=i;return C(i%3?'#f0dca8':'#7fbf6a');},false);}
  // Wolken: prozedurale Wolkendecke im Himmel-Shader (SKY_FS) statt Kugel-Wolken (spart Dreiecke und einen Draw-Call)
  if(!seaAll){const MB=[],mt=toonFx(new THREE.MeshToonMaterial({color:'#ffffff',fog:false,gradientMap:toonGrad()})),mcol=th.mt||['#5f7f9c','#6f8eaa','#88a3bb'],pk=th.outer==='peaks'?1.5:th.outer==='dunes'?.6:1;
   for(let i=0;i<16;i++){const a=i/16*Math.PI*2+rn()*.25,R=(th.outer==='peaks'?40:48)+rn()*8,x=cx0+Math.cos(a)*R,z=cz0+Math.sin(a)*R,r=5+rn()*4,hh=(.8+rn()*.6)*pk;
    if(hasSea&&seaAt(x,z))continue;
    MB.push([x,-1.5,z,r*1.4,r*.42*hh,mcol[0]],[x+rn()*2-1,r*.22*hh,z+rn()*2-1,r*.85,r*.5*hh,mcol[1]],[x,r*.6*hh,z,r*.46,r*.36*hh,mcol[2]]);
    if(snowy||hh>1.1||th.outer==='peaks')MB.push([x,r*.6*hh+r*.09*hh,z,r*.48,r*.29*hh,'#eef4f8']);}
   if(th.outer==='volcano'){const a=rn()*Math.PI*2,x=cx0+Math.cos(a)*44,z=cz0+Math.sin(a)*44;S.userData.volc=[x,z];MB.push([x,-2,z,16,14,'#4a3632'],[x,9,z,7,6,'#5a403a']);const cr=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),new THREE.MeshBasicMaterial({color:'#ff7a2a',fog:false}));cr.position.set(x,14.6,z);cr.scale.set(4.2,.7,4.2);S.add(cr);}
   S.userData.mtn=mt;inst(w3sph(10,7),mt,MB,([x,y,z,r,h,c])=>{d.position.set(x,y,z);d.scale.set(r,h,r);return C(c);},false);}}
 // Klippen/Wände: weiche Felsblöcke (Metall-Paneele bei plant/base, Holz bei ship)
 {const door=(x,y)=>/[0-9]/.test(tileAt(m,x,y+1)||''),XL=[];
  if(th.metal||th.deck){L.X.forEach(([x,y])=>XL.push([x+.5,1,y+.5,1,2,1]));const cA=C(th.deck?'#8a5a34':th.dark?'#3a3644':'#7a8692');inst(g3('wallBox',()=>new THREE.BoxGeometry(1,1,1)),mat('#ffffff'),XL,([x,y,z,sx,sy,sz],i)=>{d.position.set(x,y,z);d.scale.set(sx,sy,sz);return cA.clone().multiplyScalar(.92+hs(i,5)*.14);});}
  else{L.X.forEach(([x,y])=>{const h=1.6+hs(x,y)*.6,dr=door(x,y);XL.push([x+.5,.55,y+(dr?.22:.5),.8,h*.72,dr?.7:.8]);XL.push([x+.5+(hs(x,y*3)-.5)*.4,h*.72+.25,y+.5+(hs(y,x*3)-.5)*.3,.5,.42,.5]);});
   const cA=C(cave?p.tr:p.r),cB=C(cave?shade(p.tr,1.35):shade(p.r,1.2));const xi=inst(rockGeo(),rockMat(),XL,([x,y,z,sx,sy,sz],i)=>{d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.rotation.y=hs(i,3)*6;return cA.clone().lerp(cB,hs(i,17));});if(xi&&!cave)addOutline(xi,.02);}}
 // Innenräume
 const wallC=m.theme==='ship'?'#8a5a34':ik==='heal'?'#cfe9e2':ik==='shop'?'#e8d6b8':'#7c6658';
 {const wi=inst(g3('wallI',()=>new THREE.BoxGeometry(1,2.2,1)),mat(wallC),L.W,([x,y])=>d.position.set(x+.5,1.1,y+.5));}
 inst(g3('shelf',()=>w3merge([[new THREE.BoxGeometry(.9,1.7,.5),'#6a4630',w3M(0,.85,0)],[new THREE.BoxGeometry(.8,.04,.42),'#a6764e',w3M(0,.6,.05)],[new THREE.BoxGeometry(.8,.04,.42),'#a6764e',w3M(0,1.15,.05)],[new THREE.BoxGeometry(.7,.3,.3),'#c0584a',w3M(0,.78,.05)],[new THREE.BoxGeometry(.7,.3,.3),'#3f7fb8',w3M(0,1.32,.05)]])),w3vc(),L.B,([x,y])=>d.position.set(x+.5,0,y+.3));
 inst(g3('counter',()=>w3merge([[new THREE.BoxGeometry(1,.85,.9),'#a8744a',w3M(0,.425,0)],[new THREE.BoxGeometry(1.04,.1,.96),'#d9b07a',w3M(0,.9,0)]])),w3vc(),L.C,([x,y])=>d.position.set(x+.5,0,y+.5));
 inst(g3('box',()=>new THREE.BoxGeometry(.95,.7,.9)),mat('#c48a52'),L.K,([x,y])=>d.position.set(x+.5,.35,y+.5));
 inst(g3('plant',()=>w3merge([[new THREE.CylinderGeometry(.2,.15,.35,10),'#c46a4a',w3M(0,.18,0)],[new THREE.SphereGeometry(.3,12,9),'#4cb85c',w3M(0,.6,0)],[new THREE.SphereGeometry(.2,10,8),'#66cc6e',w3M(.12,.82,-.05)]])),w3vc(),L.P,([x,y])=>d.position.set(x+.5,0,y+.5));
 // ---------- Stadt: alle Gebäude, Fenster, Türen, Laternen, Wahrzeichen in EINER Geometrie ----------
 const TOWN=[],GLOW=[],LAN=[],add=(g,c,mm,k)=>TOWN.push([g,c,mm,null,k]),glow=(g,c,c2,mm,k)=>GLOW.push([g,c,mm,c2,k]);
 // Nachbesserung 1 (W-1): freistehende Requisiten (Wahrzeichen, Torpfosten, Straßenlaternen, Fackeln, Welt-I-Deko) in eigenem Mesh mit Nahbereich-Ausblendung; Gebäude bleiben fest (kein Durchblick ins Hausinnere)
 const PROP=[],addP=(g,c,mm,k)=>PROP.push([g,c,mm,null,k]);
 const WIN_D='#9fcbe8',WIN_N='#ffcf7a';
 const B=m.rows.map((r,y)=>[...r].map((t,x)=>/[0-9]/.test(t)&&y>0&&BUILD.includes(m.rows[y-1][x])?m.rows[y-1][x]:t)),seen=new Set(),WALLC=snowy?['#e2b88a','#d49a6a','#c9a27c','#e8c9a0']:th.outer==='coast'||th.outer==='ocean'?['#f6f0e4','#dbeef4','#f4e2cc','#e4f0e0']:['#f2e8d8','#f5dfc8','#e9eef0','#f3e5c6'];
 const rrect=(w,h,r)=>{const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;};
 const arch=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.closePath();return s;};
 const WH=1.7,M4=(x,y,z,sx,sy,sz,rx,ry,rz)=>w3M(x,y,z,sx,sy,sz,rx,ry,rz);
 const wframe=g3('wframe',()=>w3merge([[new THREE.BoxGeometry(.56,.06,.08),'#ffffff',w3M(0,.24,0)],[new THREE.BoxGeometry(.56,.06,.08),'#ffffff',w3M(0,-.24,0)],[new THREE.BoxGeometry(.06,.5,.08),'#ffffff',w3M(-.25,0,0)],[new THREE.BoxGeometry(.06,.5,.08),'#ffffff',w3M(.25,0,0)],
  [new THREE.BoxGeometry(.03,.44,.04),'#ffffff',w3M(0,0,.01)],[new THREE.BoxGeometry(.44,.03,.04),'#ffffff',w3M(0,0,.01)],[new THREE.BoxGeometry(.66,.05,.16),'#e2d6c4',w3M(0,-.28,.04)]]));
 const glassG=g3('glass',()=>new THREE.PlaneGeometry(.46,.44));
 const winAt=(px,py,pz,ry,rc,box)=>{const mm=M4(px+Math.sin(ry)*.02,py,pz+Math.cos(ry)*.02,1,1,1,0,ry,0);add(wframe,'#ffffff',mm);glow(glassG,WIN_D,WIN_N,M4(px+Math.sin(ry)*.012,py,pz+Math.cos(ry)*.012,1,1,1,0,ry,0),1);
  add(g3('shutter',()=>w3merge([[new THREE.BoxGeometry(.16,.52,.04),'#ffffff',w3M(-.37,0,0)],[new THREE.BoxGeometry(.16,.52,.04),'#ffffff',w3M(.37,0,0)]])),shade(rc,1.05),mm,3);
  if(box)add(g3('fbox',()=>w3merge([[new THREE.BoxGeometry(.5,.08,.1),'#a86a4a',w3M(0,-.31,.1)],[new THREE.SphereGeometry(.05,5,4),'#ff7aa8',w3M(-.15,-.25,.12)],[new THREE.SphereGeometry(.05,5,4),'#ffd84a',w3M(0,-.25,.12)],[new THREE.SphereGeometry(.05,5,4),'#ff7aa8',w3M(.15,-.25,.12)]])),'#ffffff',mm);};
 const dframe=g3('dframe',()=>{const g=new THREE.ExtrudeGeometry(arch(.78,1.12),{depth:.05,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1,curveSegments:8});return w3merge([[g,'#d8cbb6'],[new THREE.BoxGeometry(.9,.06,.3),'#b5a28c',w3M(0,.03,.12)]]);});
 const doorG=g3('door',()=>new THREE.ExtrudeGeometry(arch(.58,.98),{depth:.06,bevelEnabled:false,curveSegments:8}));
 const lanB=g3('lanB',()=>w3merge([[new THREE.BoxGeometry(.04,.04,.16),'#2d2a30',w3M(0,.12,-.06)],[new THREE.ConeGeometry(.1,.08,6),'#2d2a30',w3M(0,.11,0)],[new THREE.CylinderGeometry(.075,.06,.02,6),'#2d2a30',w3M(0,-.1,0)],[new THREE.SphereGeometry(.02,5,4),'#2d2a30',w3M(0,.16,0)]]));
 const lanG=g3('lanG',()=>new THREE.CylinderGeometry(.065,.055,.16,6));
 const lantern=(x,y,z)=>{add(lanB,'#ffffff',M4(x,y,z));glow(lanG,'#e8dcc0','#ffe6a8',M4(x,y,z));LAN.push([x,y,z]);};
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=B[y][x];if(!BUILD.includes(t)||seen.has(x+','+y))continue;
  let w=1,h=1;while(x+w<m.w&&B[y][x+w]===t)w++;while(y+h<m.h&&B[y+h].slice(x,x+w).every(c=>c===t))h++;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)seen.add((x+i)+','+(y+j));
  const bx=x+w/2,bz=y+h/2,T0=M4(bx,0,bz),at=(g,c,mm,k)=>add(g,c,mm?new THREE.Matrix4().multiplyMatrices(T0,mm):T0,k);
  const roofC={h:ROOF.h,P:'#2fb5a0',M:'#e8913a',A:ROOF.A,L:ROOF.L}[t]||ROOF[t]||'#a0583a';
  const wc=t==='h'?WALLC[Math.floor(hs(x,y)*4)]:t==='P'?'#f4fbf8':t==='M'?'#f6ead4':'#f4efe6',rc=shade(roofC,.92+hs(y,x)*.16);
  const wall=new THREE.ExtrudeGeometry(rrect(w-.02,h-.02,.16),{depth:WH,bevelEnabled:false,curveSegments:3});wall.rotateX(-Math.PI/2);
  const plinth=new THREE.ExtrudeGeometry(rrect(w+.1,h+.1,.2),{depth:.3,bevelEnabled:false,curveSegments:3});plinth.rotateX(-Math.PI/2);
  at(wall,wc,null,1);at(plinth,t==='P'?'#9fd8cc':'#b5a28c',null,4);at(new THREE.BoxGeometry(w+.04,.1,h+.04),shade(wc,.86),M4(0,WH-.05,0));
  if(t==='P'){// Heilstation: Tonnendach (türkis) mit Rippen, Lichtkristall-Schild mit Lebenstropfen, breite Glastür mit Vordach
   const vault=new THREE.CylinderGeometry(h/2+.22,h/2+.22,w+.3,20,1,false,0,Math.PI);vault.rotateZ(Math.PI/2);at(vault,rc,M4(0,WH,0,1,.78,1),2);
   for(let i=0;i<=Math.max(2,w);i++){const tor=new THREE.TorusGeometry(h/2+.24,.045,6,20,Math.PI);at(tor,shade(rc,1.25),M4(-w/2-.1+i*(w+.2)/Math.max(2,w),WH,0,1,.78,1,0,Math.PI/2,0));}
   const sy=WH+.5,sz=h/2+.24;at(new THREE.CylinderGeometry(.44,.44,.08,6),'#ffffff',M4(0,sy,sz,1,1,1,Math.PI/2,0,Math.PI/6));
   glow(new THREE.CylinderGeometry(.35,.35,.06,6),'#e6fff8','#e6fff8',new THREE.Matrix4().multiplyMatrices(T0,M4(0,sy,sz+.03,1,1,1,Math.PI/2,0,Math.PI/6)));
   const drop=w3merge([[new THREE.SphereGeometry(.13,12,9),'#3fd9a6',w3M(0,-.04,0)],[new THREE.ConeGeometry(.115,.2,12),'#3fd9a6',w3M(0,.12,0)],[new THREE.SphereGeometry(.05,8,6),'#c9fff0',w3M(-.04,-.02,.09)]]);
   glow(drop,'#36cf9a','#7affd0',new THREE.Matrix4().multiplyMatrices(T0,M4(0,sy,sz+.1)));
   at(new THREE.BoxGeometry(Math.min(w-.3,1.8),.08,.55),shade(rc,1.1),M4(0,1.32,h/2+.24));[-1,1].forEach(s=>at(new THREE.CylinderGeometry(.035,.035,1.32,6),'#e8f4f0',M4(s*Math.min(w-.3,1.8)/2*.9,.66,h/2+.46)));}
  else if(t==='M'){// Laden: Sägezahndach (amber), gestreifte Markise, Hängeschild mit Juwel-Münze, Schaufenster mit Kisten
   const n2=Math.max(2,Math.round(w/1.5)),sw=(w+.3)/n2;for(let i=0;i<n2;i++){const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(h+.3,0);sh.lineTo(h+.3,.62);sh.closePath();
    const rg=new THREE.ExtrudeGeometry(sh,{depth:sw-.04,bevelEnabled:false});rg.rotateY(Math.PI/2);at(rg,i%2?rc:shade(rc,1.08),M4(-w/2-.15+i*sw+.02,WH,h/2+.15),2);}
   for(let i=0;i<8;i++){const aw=new THREE.BoxGeometry((w-.1)/8,.04,.6);at(aw,i%2?'#fff4e0':'#e8713a',M4(-w/2+.05+(i+.5)*(w-.1)/8,1.36,h/2+.27,1,1,1,.35,0,0));}
   at(new THREE.CylinderGeometry(.02,.02,.5,5),'#3a2a22',M4(w/2-.25,1.75,h/2+.28,1,1,1,0,0,Math.PI/2));
   at(new THREE.BoxGeometry(.5,.36,.05),'#5a3a2a',M4(w/2-.3,1.5,h/2+.28));glow(new THREE.OctahedronGeometry(.11),'#ffc84a','#ffe08a',new THREE.Matrix4().multiplyMatrices(T0,M4(w/2-.3,1.5,h/2+.33,1,1.3,.5)));
   [-1,1].forEach(s=>{if(w>2){glow(new THREE.PlaneGeometry(.7,.55),WIN_D,WIN_N,new THREE.Matrix4().multiplyMatrices(T0,M4(s*(w/2-.55),.85,h/2+.012)),1);at(new THREE.BoxGeometry(.8,.06,.1),'#ffffff',M4(s*(w/2-.55),.56,h/2+.03));at(new THREE.BoxGeometry(.22,.18,.1),'#c08a50',M4(s*(w/2-.55)-.15,.68,h/2+.05));}});}
  else{// Satteldach mit First, Schindelkanten, Kamin
   const rh=Math.min(1.25,h*.48+.25);
   // Giebel in Wandfarbe, Dach aus zwei Schrägen mit Überstand
   const at2=new THREE.Shape();at2.moveTo(-h/2+.01,0);at2.lineTo(h/2-.01,0);at2.lineTo(0,rh*.94);at2.closePath();const ag=new THREE.ExtrudeGeometry(at2,{depth:w-.02,bevelEnabled:false});ag.rotateY(Math.PI/2);ag.translate(-w/2+.01,WH,0);at(ag,wc,null,1);
   const sa=h/2+.28,Ls=Math.hypot(sa,rh)+.04,th_=Math.atan2(rh,sa);for(const sg of[-1,1])at(g3('rslab',()=>new THREE.BoxGeometry(1,1,1)),rc,M4(0,WH+rh/2+.05*Math.cos(th_),sg*(sa/2+.05*Math.sin(th_)),w+.36,.1,Ls,sg*th_,0,0),2);
   at(new THREE.BoxGeometry(.06,.06,.01),rc,M4(0,0,0));at(new THREE.CylinderGeometry(.08,.08,w+.5,10),shade(rc,.75),M4(0,WH+rh+.02,0,1,1,1,0,0,Math.PI/2));
   for(const f of[.28,.55,.8])for(const sg of[-1,1])at(g3('shg',()=>new THREE.CylinderGeometry(.03,.03,1,6)),shade(rc,.82),M4(0,WH+rh*f+.04,sg*(h/2+.3)*(1-f),1,w+.42,1,0,0,Math.PI/2));
   if(t==='h'&&w>1){at(new THREE.CylinderGeometry(.13,.15,.7,10),'#a07a60',M4(w*.25,WH+rh*.55+.25,-h*.15),4);at(new THREE.CylinderGeometry(.16,.16,.08,10),'#7c5c48',M4(w*.25,WH+rh*.55+.62,-h*.15));}
   if(t==='A'){const lc='#'+lead.getHexString();at(new THREE.BoxGeometry(Math.min(w-.6,2.4),.36,.06),shade(roofC,1.1),M4(0,WH+.02,h/2+.06));at(new THREE.CylinderGeometry(.34,.34,.06,20),lc,M4(0,WH+rh*.45,h/2+.1,1,1,1,Math.PI/2,0,0));
    at(new THREE.CylinderGeometry(.2,.2,.07,5),'#ffffff',M4(0,WH+rh*.45,h/2+.12,1,1,1,Math.PI/2,0,0));[-1,1].forEach(s=>{at(new THREE.CylinderGeometry(.04,.04,1.0,6),'#6a5a4a',M4(s*(w/2-.3),WH-.05,h/2+.1,1,1,1,0,0,Math.PI/2));at(new THREE.BoxGeometry(.36,.95,.03),lc,M4(s*(w/2-.3),WH-.55,h/2+.08));at(new THREE.ConeGeometry(.18,.2,3),lc,M4(s*(w/2-.3),WH-1.1,h/2+.08,1,1,.15,0,0,Math.PI));});}
   if(t==='L'){at(new THREE.SphereGeometry(.42,14,8,0,Math.PI*2,0,Math.PI/2),'#cfe6ee',M4(-w*.22,WH+rh*.5,0));at(new THREE.CylinderGeometry(.02,.02,.7,5),'#4a5560',M4(w*.3,WH+rh+.35,0));at(new THREE.SphereGeometry(.18,10,6,0,Math.PI*2,0,Math.PI/2),'#dfe6ea',M4(w*.3,WH+rh+.7,0,1,.4,1,.6,0,0));
    at(new THREE.BoxGeometry(Math.min(w-.6,2.2),.32,.06),shade(roofC,1.1),M4(0,WH+.02,h/2+.06));}}
  const fz=y+h;
  for(let i=0;i<w;i++){const tt=m.rows[y+h-1][x+i],px=x+i+.5;
   if(/[0-9]/.test(tt)){const dc=t==='P'?'#bfeee4':shade(roofC,.7);add(dframe,'#ffffff',M4(px,0,fz-.02),4);
    if(t==='P'){glow(new THREE.PlaneGeometry(.56,.92),'#bfe6f2','#ffe6b0',M4(px,.5,fz+.035),1);add(new THREE.BoxGeometry(.04,.94,.05),'#e8f4f0',M4(px,.5,fz+.04));}else add(doorG,dc,M4(px,0,fz),3);
    lantern(px+.46,1.28,fz+.1);}
   else if(hs(x+i,y)>.3&&t!=='M')winAt(px,1.0,fz,0,rc,t==='h'&&hs(y,x+i)>.5);}
  if(h>=2&&t!=='M'){const wy=y+h/2;winAt(x,1.0,wy,-Math.PI/2,rc);winAt(x+w,1.0,wy,Math.PI/2,rc);}}
 // Höhleneingänge: dunkler Bogen mit Felsrahmen, Fackeln daneben
 for(let y=1;y<m.h;y++)for(let x=0;x<m.w;x++)if(/[0-9]/.test(m.rows[y][x])&&m.rows[y-1][x]==='X'){add(g3('cavearch',()=>new THREE.ShapeGeometry(arch(.86,1.3),10)),'#0b0806',M4(x+.5,0,y+.02));
  add(g3('cavering',()=>new THREE.TorusGeometry(.5,.14,8,14,Math.PI)),shade(p.r,.85),M4(x+.5,.86,y+.02,1,.9,.8));}
 // Fackeln in Höhlen/Basis: an Ausgängen und verstreut an Wänden
 if(cave||th.enclosed&&!inside){const TO=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(/[0-9]/.test(t)){[-1,1].forEach(s=>{if(tileAt(m,x+s,y)==='X')TO.push([x+.5+s*.62,y+.5]);});}
   else if(t==='X'&&hs(x*7,y*13)<.07&&[[0,1],[0,-1],[1,0],[-1,0]].some(([a,b])=>{const u=tileAt(m,x+a,y+b);return u&&u!=='X';}))TO.push([x+.5,y+.5]);}
  TO.forEach(([x,z])=>{const fc=th.dark?'#ff4a6a':'#ffb04a';addP(g3('torch',()=>w3merge([[new THREE.CylinderGeometry(.04,.05,1.3,6),'#4a3426',w3M(0,.65,0)],[new THREE.CylinderGeometry(.09,.06,.14,8),'#2d2a30',w3M(0,1.32,0)]])),'#ffffff',M4(x,ty(x,z),z));
   glow(g3('flame',()=>new THREE.ConeGeometry(.08,.24,7)),fc,fc,M4(x,ty(x,z)+1.5,z));S.userData.torch.push([x,ty(x,z)+1.5,z,fc]);});}
 // Kristalle (Höhle): Cluster an Wandfüßen und auf Leuchtmoos, leuchtend
 if(th.crystal){const crG=g3('crys',()=>w3merge([[new THREE.OctahedronGeometry(.16),'#ffffff',w3M(0,.22,0,1,2.4,1)],[new THREE.OctahedronGeometry(.1),'#ffffff',w3M(.14,.12,.05,1,2,1,0,0,-.5)],[new THREE.OctahedronGeometry(.09),'#ffffff',w3M(-.12,.1,-.04,1,1.8,1,0,0,.6)]]));
  const fc=C(p.f||'#9fe4f2');for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(((t===':'&&hs(x*5,y*3)<.1)||(t==='X'&&hs(x*3,y*5)<.12&&tileAt(m,x,y+1)&&tileAt(m,x,y+1)!=='X'))&&!(typeof w1CrysSkip==='function'&&w1CrysSkip(m,x,y))){const cx=x+.5+(hs(x,y)-.5)*.4,cz=y+(t==='X'?1.0:.5),s=.8+hs(y,x)*.7,col=fc.clone().lerp(C(hs(x,y*2)<.3?'#c79bff':'#ffffff'),.25);
   glow(crG,'#'+col.clone().multiplyScalar(.85).getHexString(),'#'+col.getHexString(),M4(cx,ty(cx,cz)-.02,cz,s,s,s,0,hs(x,y)*6,(hs(y,x)-.5)*.5));S.userData.crys.push([cx,ty(cx,cz)+.4,cz]);}}
  // Felsbrocken verstreut
  const BR=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]===':'&&hs(x*11,y*7)<.08)BR.push([x+.5+(hs(x,y*9)-.5)*.5,y+.5+(hs(y,x*9)-.5)*.5,.12+hs(x,y)*.12]);
  inst(rockGeo(),mat('#ffffff'),BR,([x,z,s],i)=>{d.position.set(x,ty(x,z)+s*.4,z);d.scale.set(s*1.3,s,s*1.1);d.rotation.y=i;return C(p.r).lerp(C(p.tr),hs(i,3));});}
 // Straßenlaternen in Städten (Wegrand, nachts warm)
 if(out&&TOWN.length>8){for(let y=1;y<m.h-1;y++)for(let x=1;x<m.w-1;x++){if(m.rows[y][x]!==','||(x*7+y*3)%9)continue;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const t=m.rows[y+b][x+a];if(t!=='.')continue;const lx=x+.5+a*.92,lz=y+.5+b*.92,ly=ty(lx,lz);
   addP(g3('lpost',()=>w3merge([[new THREE.CylinderGeometry(.035,.05,1.9,6),'#2d2a30',w3M(0,.95,0)],[new THREE.CylinderGeometry(.09,.11,.1,8),'#2d2a30',w3M(0,.05,0)],[new THREE.ConeGeometry(.15,.1,6),'#2d2a30',w3M(0,2.08,0)]])),'#ffffff',M4(lx,ly,lz));glow(g3('lhead',()=>new THREE.CylinderGeometry(.1,.08,.2,6)),'#e8dcc0','#ffe6a8',M4(lx,ly+1.95,lz));LAN.push([lx,ly+1.95,lz]);break;}}}
 // Wahrzeichen
 landmarks3d(m,th,addP,glow,ty,S,lead);
 // Schiff: Rumpf unter dem Deck, Reling
 if(th.deck&&!inside){const hull=new THREE.ExtrudeGeometry(rrect(m.w+.6,m.h+.6,Math.min(m.w,m.h)*.35),{depth:1.6,bevelEnabled:false,curveSegments:8});hull.rotateX(-Math.PI/2);add(hull,'#6a4226',M4(cx0,-1.62,cz0),3);
  add(new THREE.ExtrudeGeometry(rrect(m.w+.7,m.h+.7,Math.min(m.w,m.h)*.35),{depth:.12,bevelEnabled:false,curveSegments:8}).rotateX(-Math.PI/2),'#f2ead8',M4(cx0,-.6,cz0));
  for(let i=0;i<=m.w;i+=1)[-.15,m.h+.15].forEach(z=>add(g3('rail',()=>new THREE.CylinderGeometry(.03,.03,.7,5)),'#8a5a34',M4(i,.35,z)));for(let j=0;j<=m.h;j+=1)[-.15,m.w+.15].forEach(x=>add(g3('rail'),'#8a5a34',M4(x,.35,j)));
  [[cx0,-.15,m.w+.3,0],[cx0,m.h+.15,m.w+.3,0]].forEach(([x,z,l])=>add(new THREE.BoxGeometry(l,.06,.1),'#b07a48',M4(x,.72,z)));[[-.15,cz0],[m.w+.15,cz0]].forEach(([x,z])=>add(new THREE.BoxGeometry(.1,.06,m.h+.3),'#b07a48',M4(x,.72,z)));}
 // Schiffskabine (inside+ship): Bullaugen
 if(inside&&m.theme==='ship'){for(let x=2;x<m.w-1;x+=3){glow(g3('port',()=>new THREE.CircleGeometry(.2,14)),'#9fd0f0','#2a3a6a',M4(x+.5,1.3,1.01));add(g3('portR',()=>new THREE.TorusGeometry(.22,.04,6,16)),'#c8a050',M4(x+.5,1.3,1.02));}}
 if(TOWN.length){const tm=new THREE.Mesh(w3merge(TOWN),townMat());tm.castShadow=tm.receiveShadow=true;tm.frustumCulled=false;S.add(tm);if(!inside)addOutline(tm,.011,'#4a4048');S.userData.town=tm;}
 if(PROP.length){const pm=new THREE.Mesh(w3merge(PROP),townMat(1));pm.castShadow=pm.receiveShadow=true;pm.frustumCulled=false;S.add(pm);if(!inside)addOutline(pm,.011,'#4a4048');S.userData.prop=pm;}
 const gw=glowMesh(GLOW);if(gw){S.add(gw);S.userData.glow=gw;}
 if(LAN.length){const hp=new Float32Array(LAN.length*3);LAN.forEach(([x,y,z],i)=>hp.set([x,y,z+.02],i*3));const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.BufferAttribute(hp,3));
  const halo=new THREE.Points(hg,new THREE.PointsMaterial({color:'#ffc068',size:1.1,map:dotTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));halo.frustumCulled=false;S.add(halo);S.userData.halo=halo;S.userData.lan=LAN;}
 // Leucht-Halos für Kristalle/Fackeln
 {const HL=S.userData.crys.concat(S.userData.torch.map(q=>[q[0],q[1],q[2]]));if(HL.length){const hp=new Float32Array(HL.length*3);HL.forEach((q,i)=>hp.set(q,i*3));const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.BufferAttribute(hp,3));
  const ch=new THREE.Points(hg,new THREE.PointsMaterial({color:th.dark?'#ff5070':cave?(p.f||'#9fe4f2'):'#ffb04a',size:1.3,map:dotTex(),transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));ch.frustumCulled=false;S.add(ch);S.userData.chalo=ch;}}
 // Figuren
 for(const n of NPCS[m.id]||[]){let o;
  if(n.t==='item'||n.t==='starter'){if(n.t==='item'){o=new THREE.Group();const cr=new THREE.Mesh(g3('capC',()=>new THREE.OctahedronGeometry(.15,0)),toonMat('#f2c94c',{emissive:'#f2a03a',emissiveIntensity:.45}));cr.scale.set(1,1.35,1);
    const ring=new THREE.Mesh(g3('capR',()=>new THREE.TorusGeometry(.2,.022,6,20)),toonMat('#ffffff',{emissive:'#ffe6a0',emissiveIntensity:.5}));ring.rotation.x=Math.PI/2.4;o.add(cr,ring);o.userData.spin=cr;cr.castShadow=true;}
   else{o=new THREE.Mesh(new THREE.SphereGeometry(.17,14,10),new THREE.MeshStandardMaterial({color:n.c,emissive:n.c,emissiveIntensity:.5}));o.castShadow=true;}blobShadow(o,.2);o.userData.blobY=1;}
  else if(n.t==='legend'){o=new THREE.Group();let lk=typeof monRender==='function'?monRender(n.mon):'proc';if(lk==='proc'&&typeof procSpriteOK==='function'&&(procSpriteOK(n.mon)||window.PROC_SPRITE!==false&&typeof artFramed==='function'&&artFramed(n.mon)))lk='sprite';// Nachbesserung 1 (P-1): Sprite statt ≈ 35–40 Draw-Calls
   o.add(lk==='sprite'&&typeof monObj==='function'?monObj(n.mon,1.4*(MONS[n.mon].sp[4]||1),{},S,'sprite'):buildMon3D(n.mon,1.4));const orb=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color:'#fff0b4'}));o.add(orb);o.userData.orb=orb;}
  else if(n.t==='sign'){o=new THREE.Group();const post=new THREE.Mesh(g3('signP',()=>new THREE.CylinderGeometry(.04,.05,.62,6)),toonMat('#6e4626')),bd=new THREE.Mesh(g3('signB',()=>new THREE.BoxGeometry(.5,.32,.05)),toonMat('#c9985c'));post.position.y=.31;bd.position.y=.66;post.castShadow=bd.castShadow=true;o.add(post,bd);blobShadow(o,.22);}
  else o=person3d(n.c,shade(n.c,.62));
  S.add(o);S.userData.npcs.push({n,o});}
 // Feld-Hindernisse (05-field) erzeugen, danach zu einem Mesh verschmelzen
 {const before=new Set(S.children);fieldDecor(S,m);mergeDecor(S,before);}
 // Eis-Glanz (vorgetäuscht): additive Streifen über Eiskacheln
 {const IL=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='I')IL.push([x,y]);if(IL.length){const im=new THREE.InstancedMesh(g3('iceG',()=>new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2)),new THREE.ShaderMaterial({uniforms:{uTime:W3U.uTime},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'varying vec3 vW;varying vec2 vU;void main(){vU=uv;vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.);vW=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}',
   fragmentShader:'uniform float uTime;varying vec3 vW;varying vec2 vU;void main(){float s=fract((vW.x+vW.z)*.25-uTime*.18);float b=smoothstep(.0,.04,s)*smoothstep(.12,.06,s);float b2=smoothstep(.2,.22,s)*smoothstep(.27,.25,s)*.6;float e=smoothstep(0.,.12,min(min(vU.x,1.-vU.x),min(vU.y,1.-vU.y)));gl_FragColor=vec4(vec3(.85,.97,1.)*(b+b2)*.55*e,1.);}'}),IL.length);
  IL.forEach(([x,y],i)=>{d.position.set(x+.5,.112,y+.5);d.rotation.set(0,0,0);d.scale.set(1,1,1);d.updateMatrix();im.setMatrixAt(i,d.matrix);});im.frustumCulled=false;im.renderOrder=2;S.add(im);}}
 // Hitzeflimmern (vorgetäuscht): additive, wabernde Schlieren über Lava
 if(th.lava){const HL=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if((t==='~'||t==='Q')&&hs(x*3,y*5)<.35)HL.push([x+.5,y+.5]);}
  if(HL.length){const im=new THREE.InstancedMesh(g3('heatQ',()=>new THREE.PlaneGeometry(1.2,1.6)),new THREE.ShaderMaterial({uniforms:{uTime:W3U.uTime},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vU;varying float vS;void main(){vU=uv;vec4 c=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);vS=c.x*1.7+c.z;vec4 mv=viewMatrix*c;mv.xy+=position.xy;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uTime;varying vec2 vU;varying float vS;void main(){float w=sin(vU.y*14.-uTime*3.+vS+sin(vU.x*9.+uTime*2.)*1.4);float a=smoothstep(.6,1.,w)*(1.-vU.y)*smoothstep(0.,.25,vU.y)*smoothstep(0.,.3,vU.x)*smoothstep(1.,.7,vU.x)*.16;gl_FragColor=vec4(1.,.6,.25,1.)*a;}'}),HL.length);
   HL.forEach(([x,z],i)=>{d.position.set(x,.85,z);d.rotation.set(0,0,0);d.scale.set(1,1,1);d.updateMatrix();im.setMatrixAt(i,d.matrix);});im.frustumCulled=false;im.renderOrder=4;S.add(im);}}
 // Wasser / Lava
 if(!inside){const WL=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='~'||m.rows[y][x]==='Q')WL.push([x,y]);const wm=waterMesh(WL,p,m,th.lava);if(wm){S.add(wm);S.userData.water=wm;}}
 return S;}
// Statische Feld-Deko (viele Einzel-Meshes) zu einem vertex-gefärbten Mesh zusammenführen
function mergeDecor(S,before){const parts=[],kill=[];S.updateMatrixWorld(true);
 for(const o of S.children.slice()){if(before.has(o))continue;let ok=true;const mine=[];o.traverse(q=>{if(!q.isMesh)return;const mt=q.material;if(q.isInstancedMesh||!mt||!mt.isMeshToonMaterial||mt.map||mt.transparent||!q.geometry.attributes.normal){ok=false;return;}mine.push([q.geometry,'#'+mt.color.getHexString(),q.matrixWorld.clone()]);});
  if(ok&&mine.length){parts.push(...mine);kill.push(o);}}
 if(parts.length<2)return;kill.forEach(o=>S.remove(o));const mm=new THREE.Mesh(w3merge(parts),w3vc());mm.castShadow=mm.receiveShadow=true;mm.frustumCulled=false;S.add(mm);addOutline(mm,.016);}
// ---------- Wahrzeichen ----------
const LM_DEF={brisenhafen:[{type:'leuchtturm',x:21.5,y:13.5},{type:'kran',x:2,y:17.2}],frostheim:[{type:'turm',x:15,y:-3.5}],kupferhain:[{type:'turm',x:-3,y:3}],moewenbucht:[{type:'leuchtturm',x:-2.5,y:16}]};
const LM_ALIAS={tower:'turm',bridge:'bruecke',crane:'kran',lighthouse:'leuchtturm',fountain:'brunnen'};
function landmarks3d(m,th,add,glow,ty,S,lead){if(m.inside)return;const L=MAPS[m.id]&&MAPS[m.id].landmarks||LM_DEF[m.id]||[];const lc='#'+lead.getHexString();
 for(const q of L){const type=LM_ALIAS[q.type]||q.type,x=q.x+.5,z=q.y+.5,r=q.r||0,inMap=q.x>=0&&q.y>=0&&q.x<m.w&&q.y<m.h,y0=inMap?ty(x,z):Math.max(-.2,terrainOuter(m,x,z)),R=new THREE.Matrix4().makeRotationY(r),at=(g,c,mm,k)=>add(g,c,new THREE.Matrix4().multiplyMatrices(w3M(x,y0,z),new THREE.Matrix4().multiplyMatrices(R,mm||new THREE.Matrix4())),k),
  gl=(g,c,c2,mm,k)=>glow(g,c,c2,new THREE.Matrix4().multiplyMatrices(w3M(x,y0,z),new THREE.Matrix4().multiplyMatrices(R,mm||new THREE.Matrix4())),k);
  if(type==='turm'){at(new THREE.CylinderGeometry(1,1.15,5,16),'#d8d0c0',w3M(0,2.5,0),4);at(new THREE.CylinderGeometry(1.25,1.1,.4,16),'#c8bfae',w3M(0,5.1,0));for(let i=0;i<10;i++){const a=i/10*Math.PI*2;at(new THREE.BoxGeometry(.3,.35,.3),'#c8bfae',w3M(Math.cos(a)*1.1,5.45,Math.sin(a)*1.1,1,1,1,0,-a,0));}
   at(new THREE.ConeGeometry(1.05,1.8,16),lc,w3M(0,6.3,0));at(new THREE.CylinderGeometry(.02,.02,.8,4),'#4a4a4a',w3M(0,7.5,0));at(new THREE.BoxGeometry(.5,.3,.02),lc,w3M(.25,7.7,0));[1.4,2.8,4.1].forEach((h,i)=>gl(new THREE.PlaneGeometry(.3,.5),WIN_D2,'#ffcf7a',w3M(Math.sin(i*2)*1.01,h,Math.cos(i*2)*1.01,1,1,1,0,i*2,0),1));}
  else if(type==='leuchtturm'){at(rockGeo(),'#8a8478',w3M(0,-.3,0,2.2,.9,2));for(let i=0;i<5;i++)at(new THREE.CylinderGeometry(.62-i*.07-.07,.62-i*.07,1,14),i%2?'#ff7a6a':'#f6f2ea',w3M(0,.5+i,0));
   at(new THREE.CylinderGeometry(.6,.6,.12,14),'#3a3a44',w3M(0,5.05,0));gl(new THREE.CylinderGeometry(.34,.34,.6,10),'#dfe8ea','#fff2b0',w3M(0,5.4,0));at(new THREE.ConeGeometry(.48,.6,12),'#ff7a6a',w3M(0,6.0,0));
   for(let i=0;i<6;i++){const a=i/6*Math.PI*2;at(new THREE.CylinderGeometry(.02,.02,.62,4),'#3a3a44',w3M(Math.cos(a)*.42,5.4,Math.sin(a)*.42));}
   // Strahl: additiver Kegel mit Helligkeitsverlauf entlang der Länge (0 an Lampe und Spitze → keine harte Kante), ohne Tiefenschreiben
   const bg=new THREE.ConeGeometry(1.4,14,16,6,true);bg.translate(0,-7,0);{const P_=bg.attributes.position,C_=new Float32Array(P_.count*3);for(let i=0;i<P_.count;i++){const t=-P_.getY(i)/14,k=Math.min(1,t/.12)*(1-Math.max(0,(t-.45)/.55))**1.6;C_[i*3]=C_[i*3+1]=C_[i*3+2]=Math.max(0,k);}bg.setAttribute('color',new THREE.BufferAttribute(C_,3));}
   const beam=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:'#fff2b0',vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));beam.rotation.z=Math.PI/2;
   const bp=new THREE.Group();bp.position.set(x,y0+5.4,z);bp.add(beam);S.add(bp);(S.userData.beams=S.userData.beams||[]).push(bp);}
  else if(type==='kran'){const o='#e8913a';for(const[a,b]of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]])at(new THREE.BoxGeometry(.12,4.2,.12),o,w3M(a,2.1,b));for(let h=.6;h<4;h+=.9){at(new THREE.BoxGeometry(1.1,.08,.08),o,w3M(0,h,-.5));at(new THREE.BoxGeometry(1.1,.08,.08),o,w3M(0,h,.5));at(new THREE.BoxGeometry(.08,.08,1.1),o,w3M(-.5,h,0));at(new THREE.BoxGeometry(.08,.08,1.1),o,w3M(.5,h,0));}
   at(new THREE.BoxGeometry(1.2,.6,1.2),'#4a5a6a',w3M(0,4.5,0));at(new THREE.BoxGeometry(4.2,.18,.24),o,w3M(1.4,4.95,0,1,1,1,0,0,.12));at(new THREE.CylinderGeometry(.015,.015,2.4,4),'#2a2a2a',w3M(3.2,3.9,0));at(new THREE.BoxGeometry(.2,.25,.12),'#3a3a3a',w3M(3.2,2.65,0));gl(new THREE.SphereGeometry(.08,6,5),'#ff5a4a','#ff5a4a',w3M(-.4,4.85,0));}
  else if(type==='brunnen'){at(new THREE.CylinderGeometry(1.2,1.3,.45,20),'#cfc6b4',w3M(0,.22,0));at(new THREE.TorusGeometry(1.15,.12,8,24),'#e2dac8',w3M(0,.46,0,1,1,1,Math.PI/2,0,0));at(new THREE.CylinderGeometry(1.05,1.05,.06,20),'#5fb0e0',w3M(0,.4,0));
   at(new THREE.CylinderGeometry(.14,.2,1.1,10),'#d8d0be',w3M(0,.9,0));at(new THREE.CylinderGeometry(.5,.18,.22,14),'#e2dac8',w3M(0,1.45,0));at(new THREE.CylinderGeometry(.42,.42,.04,14),'#6ac0ea',w3M(0,1.55,0));at(new THREE.SphereGeometry(.14,10,8),lc,w3M(0,1.7,0));S.userData.fount.push([x,y0+1.6,z]);}
  else if(type==='bruecke'){const len=q.len||4;for(let i=0;i<len*3;i++){const u=(i+.5)/(len*3)-.5,hh=Math.cos(u*Math.PI)*.35;at(new THREE.BoxGeometry(1/3-.02,.1,1.3),i%2?'#b07a48':'#c08a54',w3M(u*len,.35+hh,0,1,1,1,0,0,-Math.sin(u*Math.PI)*.35),3);}
   at(new THREE.TorusGeometry(len*.42,.12,8,20,Math.PI),'#9a8a78',w3M(0,-.9,.55,1,.55,1));at(new THREE.TorusGeometry(len*.42,.12,8,20,Math.PI),'#9a8a78',w3M(0,-.9,-.55,1,.55,1));
   for(let i=0;i<=len;i++){const u=i/len-.5,hh=Math.cos(u*Math.PI)*.35;[-.62,.62].forEach(s=>at(new THREE.CylinderGeometry(.04,.04,.55,5),'#6a4a2e',w3M(u*len,.65+hh,s)));}}
  else if(type==='mast'){at(new THREE.CylinderGeometry(.1,.14,6,8),'#7a5434',w3M(0,3,0));at(new THREE.CylinderGeometry(.05,.05,3,6),'#7a5434',w3M(0,4.4,0,1,1,1,0,0,Math.PI/2));
   const sail=new THREE.PlaneGeometry(2.8,2.4,6,4),sp=sail.attributes.position;for(let i=0;i<sp.count;i++)sp.setZ(i,Math.cos(sp.getX(i)/2.8*Math.PI)*.35);sail.computeVertexNormals();at(sail,'#f6f0e2',w3M(0,3.1,.1));at(new THREE.BoxGeometry(.6,.35,.02),lc,w3M(.3,6.15,0));}}}
const WIN_D2='#9fcbe8';
function terrainOuter(m,x,z){const cx=m.w/2,cz=m.h/2,d=Math.hypot(Math.max(0,Math.abs(x-cx)-m.w/2),Math.max(0,Math.abs(z-cz)-m.h/2));return d<.01?-.4:.06+Math.min(1,d/4)*.3;}
function lerpC(a,b,t){return new THREE.Color(a).lerp(new THREE.Color(b),t);}
// Kamera-Hindernisse (Wände, Gebäude, Klippen)
function camBlock(x,z,y){let r=0;for(const[a,b]of CB_OFF){const k=camB1(x+a,z+b,y);if(k===1)return 1;if(k)r=k;}return r;}
function camB1(x,z,y){const t=tileAt(cur,Math.floor(x),Math.floor(z));if(t===null){if(cur.inside||th3(cur).enclosed)return 1;
  // Nachbesserung 1 (W-1/W-2): hinter einer offenen Ausgangskante (Nachbarkarte) ist frei → Kamera bleibt nach der Ankunft auf Augenhöhe, Horizont/Wahrzeichen im Bild
  const L=cur.links||{},ex=Math.min(cur.w-1,Math.max(0,Math.floor(x))),ez=Math.min(cur.h-1,Math.max(0,Math.floor(z))),side=x<0?'w':x>=cur.w?'e':z<0?'n':'s',et=tileAt(cur,ex,ez);
  if(L[side]&&et&&!SOLID.has(et)&&et!=='T')return 0;return y<2.7?2:0;}if(t==='T')return y<2.35?2:0;if(t==='R')return y<1.5?2:0;if(t==='W'||t==='X')return y<2.35?1:0;if(BUILD.includes(t))return y<3?1:0;
 if(/[0-9]/.test(t)){const u=tileAt(cur,Math.floor(x),Math.floor(z)-1);return u&&BUILD.includes(u)&&y<3&&z-Math.floor(z)<.85?1:0;}return 0;}
// ---------- Bildaufbau je Frame ----------
const _c1=new THREE.Color(),_c2=new THREE.Color(),_v=new THREE.Vector3(),_sd=new THREE.Vector3(),_md=new THREE.Vector3(),_cf=new THREE.Vector3(),_cr=new THREE.Vector3(),_cw=new THREE.Vector3(),_lt=new THREE.Vector3();
const C_IN_RIM=new THREE.Color('#ffd9a0').multiplyScalar(.12),C_MOONRIM=new THREE.Color('#7d93ff'),C_WHITE=new THREE.Color('#ffffff'),C_INSUN=new THREE.Color('#fff3dc'),CB_OFF=[[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]];
// Spielfigur neu bauen, wenn sich G.outfit ändert (Prüfung höchstens 2× je Sekunde)
function outfitSync(){const nw=performance.now();if(R3.ofT&&nw-R3.ofT<500&&R3.ofk!=null)return;R3.ofT=nw;const o=G&&G.outfit&&typeof defaultOutfit==='function'?Object.assign(defaultOutfit(),G.outfit):null,k=o?JSON.stringify(o):'';if(R3.ofk===k)return;R3.ofk=k;
 const old=R3.player,np=o?person3d(o.top,o.capCol,o):person3d('#e8623a','#1f8a7a');np.visible=old.visible;if(old.parent){old.parent.add(np);old.parent.remove(old);}R3.player=np;PLH=0;w3dropRig(old);}
// Kamera-Schnittstelle (Look L1): CAM.mode 'explore' = Verfolgerkamera (09, Wischen/Orbit über 36-input.js);
// 'battle'|'dialog'|'cinematic' = 09 fährt gedämpft zu CAM.target + (sin yaw·dist, height, cos yaw·dist), Blick auf CAM.lookAt, CAM.fov, CAM.roll; CAM.snap=true springt.
// Gerendert wird dann mit R3.camC (eigene Kamera, damit die Hooks aus 17/36/42 die Einstellung nicht verändern). R3.shown = Kopie der zuletzt tatsächlich gezeigten Kamera (für Projektionen, z. B. KP-Leisten über Köpfen).
function camMode(){try{const C=typeof CAM!=='undefined'?CAM:null;if(!C||!C.mode||C.mode==='explore')return'explore';if(C.mode==='battle'&&!C.world)return'explore';return C.mode;}catch(e){return'explore';}}// 'battle' gilt der Kampfszene BT (35-transitions), außer CAM.world=true
const LV=lsetBlank();
// Kampf mit deckendem Kampfbild (#battle): Welt nicht mitrendern (spart den ganzen Welt-Frame); geprüft höchstens 2× je Sekunde
function worldCovered(){if(mode!=='battle')return false;const n=performance.now();if(n-(worldCovered.t||0)<500)return worldCovered.v;worldCovered.t=n;let v=false;
 try{const b=document.getElementById('battle');if(b&&!b.hidden){const cs=getComputedStyle(b),m=cs.backgroundColor.match(/rgba?\(([^)]+)\)/),a=m?m[1].split(',')[3]:null;v=(a==null||+a>=.99)&&+cs.opacity>=.99&&cs.visibility!=='hidden'&&cs.display!=='none';}}catch(e){}return worldCovered.v=v;}
function draw3d(){if(!R3)init3d();if(!R3)return draw();if(worldCovered())return;outfitSync();const{r,cam,hemi,sun,lamp,player,pl}=R3;
 if(R3.mapId!==cur.id){R3.scene=scenes[cur.id]||(scenes[cur.id]=build3d());if(!TER[cur.id])terrBuild(cur);R3.mapId=cur.id;fxAttach(R3.scene);[hemi,sun,sun.target,lamp,...pl,player,R3.dome].forEach(o=>R3.scene.add(o));P.ang=YAW[P.dir];R3.yaw=P.ang;R3.snap=1;R3.vel={};R3.sp=R3.sh=R3.ch=null;
  R3.scene.onBeforeRender=(rr,sc,c)=>{if(c&&c.isPerspectiveCamera){const s=R3.shown;s.position.copy(c.position);s.quaternion.copy(c.quaternion);s.fov=c.fov;s.aspect=c.aspect;s.near=c.near;s.far=c.far;s.projectionMatrix.copy(c.projectionMatrix);s.updateMatrixWorld(true);}};
  w3Quality();w3Env(1);if(typeof skyAttach==='function')try{skyAttach(R3.scene,cur);}catch(e){console.error(e);}}
 const now=performance.now(),dt=Math.min(.1,Math.max(.001,(now-(R3.lt||now-16))/1000));R3.lt=now;const ez=rate=>R3.snap?1:1-Math.exp(-rate*dt);const T=perfTier();
 const S=R3.scene,U_=S.userData,th=U_.th||TH3.default,h=G.time/60,cave=cur.theme==='cave',inside=!!cur.inside,encl=cave||th.enclosed&&!inside;
 // Wetter weich überblenden
 const ws=inside||encl?'klar':weatherNow(),wp=WXP[ws],wk=W3W.k,wb=ez(1.2);W3W.cur=ws;wk.gray+=(wp[0]-wk.gray)*wb;wk.col.lerp(_c1.set(wp[1]),wb);wk.sun+=(wp[2]-wk.sun)*wb;wk.fog+=(wp[3]-wk.fog)*wb;wk.wind+=(wp[4]-wk.wind)*wb;wk.lt+=(wp[5]-wk.lt)*wb;
 const K=skyAt(h),lead=U_.lead||(U_.lead=leadOf(cur));let day=K.day;const night=1-day;
 // Gewitter-Blitz
 let fl=0;if(ws==='gewitter'){if(now>W3W.nextFlash){W3W.flash=now;W3W.nextFlash=now+3500+Math.random()*7000;}const e=(now-W3W.flash)/1000;fl=e<.5?Math.max(0,1-e*7)+(e>.12?Math.max(0,1-(e-.12)*5)*.7:0):0;}
 const gray=wk.gray,D=DIST(),dusk=Math.max(0,1-Math.abs(h-18.7)/1.6)+Math.max(0,1-Math.abs(h-6.3)/1.2)*.7;
 // 1) Tageszeit-Licht (LV): Himmel, Horizont/Nebel, Hemisphäre, Sonne/Mond, Randlicht, Belichtung
 LV.top.copy(K.top).lerp(wk.col,gray*.8);LV.hor.copy(K.hor).lerp(wk.col,gray);if(th.fogTint)LV.hor.lerp(th._ft||(th._ft=new THREE.Color(th.fogTint[0])),th.fogTint[1]*(.4+.6*day));LV.hor.lerp(lead,.06);
 const ang=Math.PI*((h-6)/12);_sd.set(Math.cos(ang)*11,Math.sin(ang)*8.5,5.5).normalize();_md.set(-Math.cos(ang)*11,-Math.sin(ang)*8.5,5.5).normalize();// Mittagssonne ≈ 57° hoch: längere, plastischere SchattenLV.sd.copy(_sd.y>-.05?_sd:_md);
 if(inside){LV.hs.set('#fff2dc');LV.hg.set('#5a4030');LV.hI=.85;day=1;}
 else if(encl){const CV=typeof PALETTE!=='undefined'&&PALETTE.light.cave;LV.hs.set(th.dark?'#8a7ab0':CV?CV.amb:'#b0a0d8').lerp(lead,.3);LV.hg.set(th.dark?'#4a3a40':'#5a4a52').lerp(lead,.25);LV.hI=th.dark?.6:(CV?CV.ambI:.8)*1.15;day=.25;}
 else{LV.hs.copy(K.hs).lerp(lead,.05).lerp(wk.col,gray*.5);LV.hg.copy(K.hg).lerp(lead,.28);LV.hI=K.hI*wk.lt*(th.dim||1)*(th.lf||1)*.56+fl*1.4;}
 LV.sunI=inside?.45:encl?.18:(.12+1.1*K.sunI)*wk.sun*(th.dim||1)*(th.lf||1)+fl*.8;LV.sunC.copy(inside?C_INSUN:K.sunC);
 // Randlicht/Belichtung aus den PALETTE-Licht-Sets (explore/dusk/night) nach Tageszeit gewichtet
 {const PL=typeof PALETTE!=='undefined'&&PALETTE.light,ex=PL?PL.explore:null,du=PL?PL.dusk:null,ni=PL?PL.night:null;
  if(inside)LV.rim.copy(C_IN_RIM);else{LV.rim.copy(K.sunC).lerp(C_MOONRIM,night*.7);if(ex){_c1.set(ex.rim).lerp(_c2.set(du.rim),Math.min(1,dusk));LV.rim.lerp(_c1,.5*day);}LV.rim.multiplyScalar(.07+.12*dusk+.07*night);}
  LV.expo=ex&&!inside?(ex.exposure+(ni.exposure-ex.exposure)*night*(encl?0:1)):1;if(cave&&!th.dark&&PL&&PL.cave)LV.expo=PL.cave.exposure;}
 if(encl){const lit=cave&&hasField('lumen'),CV=typeof PALETTE!=='undefined'&&PALETTE.light.cave;LV.fog.set(th.dark?'#120c16':'#221a24').lerp(lead,.1);LV.fogN=lit?5:th.dark?3:CV?CV.fogNear:3;LV.fogF=(lit?22:th.dark?14:CV?CV.fogFar:14)*D;}
 else if(inside){LV.fog.set(th.deck||cur.theme==='ship'?'#2a1a10':'#2a2018');LV.fogN=30;LV.fogF=60;}
 else{const fk=wk.fog*(th.fogK||1);LV.fog.copy(LV.hor);LV.fogN=Math.max(.8,14*fk-(1-fk)*2);LV.fogF=Math.max(7,44*D*fk*T.fog);}
 // 2) Licht-Set (setLightSet) und weiche Überblendung vom zuletzt gezeigten Zustand
 const Lt=LSET.L&&!inside&&!encl?LSET.L:LV;let O=Lt;
 if(LSET.prev&&LSET.k<1){LSET.k=Math.min(1,LSET.k+dt*1000/LSET.ms);const e=LSET.k*LSET.k*(3-2*LSET.k),Q=LSET.shown||(LSET.shown=lsetBlank()),A=LSET.prev;
  for(const k of['top','hor','sunC','fog','rim','hs','hg'])Q[k].copy(A[k]).lerp(Lt[k],e);for(const k of['sunI','fogN','fogF','hI','expo'])Q[k]=A[k]+(Lt[k]-A[k])*e;Q.sd.copy(A.sd).lerp(Lt.sd,e).normalize();O=Q;}
 else{LSET.shown=lsetCopy(LSET.shown||lsetBlank(),Lt);}
 if(O!==LSET.shown)lsetCopy(LSET.shown,O);
 // 3) Anwenden
 const Ud=R3.dome.material.uniforms;Ud.top.value.copy(O.top);Ud.hor.value.copy(O.hor);Ud.gnd.value.copy(O.hor).multiplyScalar(.82);Ud.star.value=Math.max(0,1-day*1.6)*(1-gray);Ud.uT.value=now/1000;Ud.uFlash.value=fl*.5;
 Ud.sunD.value.copy(_sd);Ud.moonD.value.copy(_md);Ud.sunV.value=Math.max(0,Math.min(1,_sd.y*6+.4))*(1-gray*.9);Ud.moonV.value=Math.max(0,Math.min(1,_md.y*5))*night*(1-gray*.9);Ud.sunC.value.copy(O.sunC);
 Ud.uCov.value=.5-gray*.36;Ud.uCO.value.set(now*.0000045,now*.0000018);Ud.uCloudC.value.copy(C_WHITE).lerp(O.sunC,.25+.35*dusk).multiplyScalar(.35+.65*Math.max(day,.12)).lerp(wk.col,gray*.6);Ud.uCloudS.value.copy(O.hor).lerp(O.top,.35).multiplyScalar(.72+.1*day).lerp(wk.col,gray*.5);
 const bg=R3.bg;bg.copy(O.hor);if(inside||encl)bg.copy(O.fog);S.background=bg;if(!S.fog)S.fog=new THREE.Fog(bg,9,26);S.fog.color.copy(O.fog);S.fog.near=O.fogN;S.fog.far=O.fogF;
 hemi.color.copy(O.hs);hemi.groundColor.copy(O.hg);hemi.intensity=O.hI;sun.intensity=O.sunI;sun.color.copy(O.sunC);RIM.value.copy(O.rim);r.toneMappingExposure=1.02*O.expo;
 // Hybrid H1 (44-sky.js): gerenderte Skybox + Licht/Nebel aus dem Bild, Kulisse, Wolkenmeer, Strahlen (ohne Bilder: prozeduraler Himmel bleibt)
 if(typeof skyFrame==='function')try{skyFrame(S,O,{h,day,night,gray,col:wk.col,inside,encl,cave,fl,dt,now,lset:!!(LSET.L&&!inside&&!encl)});}catch(e){console.error(e);}
 lamp.intensity=inside?0:night*1.3+(encl?.9:0);lamp.color.set(encl&&th.dark?'#ff8aa0':'#ffd59a');
 if(U_.glow){const gu=U_.glow.material.uniforms;gu.uN.value=Math.min(1,Math.max(night*1.15,gray*.6,encl?1:0));gu.uEnv.value=R3.env&&R3.env.ok?R3.env.rt.texture:null;gu.uEnvOn.value=R3.env&&R3.env.ok&&!encl&&!inside?1:0;}
 if(U_.mtn)U_.mtn.emissive.copy(S.fog.color).multiplyScalar(.42);
 if(U_.halo)U_.halo.material.opacity=Math.max(night,gray*.5)*.85;
 if(U_.beams){const cp=(R3.activeCam||R3.cam).position;for(const b of U_.beams){b.rotation.y=now/1600;
  // Kameranähe: Abstand der Kamera zur Strahlachse (Lampe → +x lokal); unter 8 ausblenden, damit kein Kegelschnitt das Bild füllt
  const dx=Math.cos(b.rotation.y),dz=-Math.sin(b.rotation.y),vx=cp.x-b.position.x,vy=cp.y-b.position.y,vz=cp.z-b.position.z,tt=Math.max(0,Math.min(14,vx*dx+vz*dz)),ex=vx-dx*tt,ez_=vz-dz*tt,dc=Math.sqrt(ex*ex+vy*vy+ez_*ez_),fc=Math.max(0,Math.min(1,(dc-4)/6));
  b.children[0].material.opacity=Math.max(night,gray*.6)*.2*fc*fc*(3-2*fc);b.children[0].visible=b.children[0].material.opacity>.002;}}
 if(U_.chalo)U_.chalo.material.opacity=(cave?.62:.45)+.15*Math.sin(now/300);
 if(U_.gmat){const gu=U_.gmat.userData.ground,sd=(typeof SKY3!=='undefined'&&SKY3.sdOn)?SKY3.sd:O.sd;gu.uSunXZ.value.set(sd.x,sd.z);}
 w3Env();
 for(const wm of[U_.water,U_.ocean]){if(!wm)continue;const u=wm.material.uniforms;u.uTime.value=now/1000;u.uDay.value=encl?.6:Math.max(day,.18)*(1-gray*.3);u.uSkyT.value.copy(O.top);u.uSkyH.value.copy(O.hor);u.uSunD.value.copy(_sd.y>0?_sd:_md);u.uSunC.value.copy(O.sunC).multiplyScalar(_sd.y>0?wk.sun:.4*night);
  u.uEnv.value=R3.env&&R3.env.ok?R3.env.rt.texture:null;u.uEnvOn.value=R3.env&&R3.env.ok&&!encl?1:0;}
 const px=P.px+.5,pz=P.py+.5,t=anim,gy=terrainY(px,pz);R3.gy=R3.snap||R3.gy==null?gy:R3.gy+(gy-R3.gy)*ez(10);
 // Laternen-/Fackel-/Kristalllichter: die zwei nächsten zur Spielfigur (ohne Hilfs-Arrays)
 {let b0=null,b1=null,d0=1e9,d1=1e9;const scan=L=>{if(L)for(const q of L){const dd=(q[0]-px)*(q[0]-px)+(q[2]-pz)*(q[2]-pz);if(dd<d0){b1=b0;d1=d0;b0=q;d0=dd;}else if(dd<d1){b1=q;d1=dd;}}};scan(U_.lan);scan(U_.torch);scan(U_.crys);
  for(let i=0;i<pl.length;i++){const l=pl[i],q=i?b1:b0;if(!q||inside||!SET.light){l.intensity=0;continue;}const tq=q[3],isT=!!tq,isC=!isT&&U_.crys&&U_.crys.includes(q);l.color.set(isT?tq:isC?(PAL.cave.f):'#ffb85c');
   l.intensity=isT?1.2+Math.sin(now/90+i)*.18+Math.sin(now/53)*.1:isC?.8:Math.max(night,gray*.5)*1.1;l.position.set(q[0],q[1]+(isT||isC?.3:-.1),q[2]+(isT||isC?0:.7));}}
 player.position.set(px,0,pz);
 // Blickrichtung kritisch gedämpft: weiches Anfahren und Auslaufen, kein Ruck bei Richtungswechsel
 const V=R3.vel||(R3.vel={}),ty0=P.ang??YAW[P.dir];let df=ty0-R3.yaw;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;
 if(R3.snap){R3.yaw=ty0;V.yaw=0;}else R3.yaw=sdamp(R3.yaw,R3.yaw+df,V,'yaw',Math.abs(df)>1.2?.3:.2,dt);
 const mv=P.moving||P.walk;player.rotation.y=R3.yaw;
 // Laufzyklus (38-models.js gaitTick): Fußplanting, Knie-IK, Armschwung – Phase aus dem tatsächlich gelaufenen Weg
 if(player.userData.rig&&typeof gaitTick==='function'){player.position.y=gy;gaitTick(player,dt,{mode:typeof gaitModeP==='function'?gaitModeP():'ground',moving:mv,state:P.state});}
 else{const ph=t/(P.run?60:85),sw=mv?Math.sin(ph)*.6:0;player.userData.legs[0].rotation.x=sw;player.userData.legs[1].rotation.x=-sw;player.position.y=gy+(mv?Math.abs(Math.sin(ph))*.04:0);}
 // Sonne: eine Schattenquelle, Schattenkamera folgt der Figur (gerastert gegen Flimmern)
 const shOn=!!SET.shadows&&!!T.shadow;sun.castShadow=shOn;if(shOn&&T.shadowEvery>1){R3.shN=(R3.shN||0)+1;r.shadowMap.autoUpdate=false;if(R3.shN%T.shadowEvery===0||R3.snap)r.shadowMap.needsUpdate=true;}else r.shadowMap.autoUpdate=true;
 {const L=(typeof SKY3!=='undefined'&&SKY3.sdOn&&!inside)?SKY3.sd:O.sd,up=inside?1:Math.max(.25,L.y),q=26/(T.shadow||1024),sx=Math.round(px/q)*q,sz=Math.round(pz/q)*q;sun.position.set(sx+(inside?5:L.x*14),up*14,sz+(inside?4:L.z*14)+(1-up)*3);sun.target.position.set(sx,0,sz);}lamp.position.set(px,gy+1.6,pz);
 for(const{n,o}of U_.npcs){o.visible=!npcHidden(n);if(!o.visible)continue;const oy=terrainY(n.x+.5,n.y+.5);o.position.set(n.x+.5,oy,n.y+.5);
  if(n.t==='item'||n.t==='starter'){o.position.y=oy+.3+Math.sin(t/350+n.x)*.06+(n.t==='starter'?.7:0);if(o.userData.spin){o.userData.spin.rotation.y=t/600;o.children[1].rotation.z=t/900;if(SET.particles&&Math.random()<dt*.8)spawnFx('sparkle',o.position.x,o.position.y+.1,o.position.z);}}
  else if(n.t==='legend'){const ok=G.flags[n.req]&&!(n.day&&isNight())&&!(n.night&&!isNight());o.children[0].visible=ok;o.userData.orb.visible=!ok;
   o.children[0].position.y=.05+Math.sin(t/500)*.05;animMon(o.children[0],t,{cam:R3.activeCam||R3.cam});o.userData.orb.position.y=.4+Math.sin(t/300)*.08;}
  else{o.rotation.y=YAW[n.face||n.d||'down'];if(o.userData.rig&&Math.abs(o.position.x-px)+Math.abs(o.position.z-pz)<16)gaitTick(o,dt);}}
 syncW3(S,t);syncPeople(S,t,dt);guide3d(S,t);
 if(U_.mm)for(const o of U_.mm.values()){o.position.y=terrainY(o.position.x,o.position.z);if(!o.userData.blob)blobShadow(o,.42);}
 if(U_.guide&&U_.guide.visible){const g=U_.guide;g.position.y=terrainY(g.position.x,g.position.z);}
 const turn=R3.yaw-(R3.pyaw??R3.yaw);R3.pyaw=R3.yaw;R3.roll=(R3.roll||0)*.85+turn*.45;
 atmo3d(S,t,px,pz,day,cave,inside,dt);
 // Kamera
 const f=_cf.set(-Math.sin(R3.yaw),0,-Math.cos(R3.yaw)),rt=_cr.set(-f.z,0,f.x),base=R3.gy,cm=camMode();let rc=cam;
 if(cm==='explore'&&R3.cmPrev&&R3.cmPrev!=='explore'){cam.position.copy(R3.camC.position);if(R3.lk&&R3.lkC)R3.lk.copy(R3.lkC);V.cpx=V.cpy=V.cpz=V.lkx=V.lky=V.lkz=0;}
 if(view==='ego'&&cm==='explore'){player.visible=false;const gt=player.userData.gait,amt=mv?(P.run?.9:.6):0;R3.bob=(R3.bob||0)+(amt-(R3.bob||0))*ez(5);
  // Ego-Bob an die Schrittfrequenz gekoppelt: höchster Punkt in der Standmitte, Seitschwung einmal je Doppelschritt
  const gq=gt&&gt.ph!=null?gt.ph-(gt.beta||.5)/2:t/(P.run?78:110)/(Math.PI*2),bob=Math.cos(gq*Math.PI*4)*.014*R3.bob,swy=Math.sin(gq*Math.PI*2)*.009*R3.bob;
  cam.fov+=((P.run&&mv?76:72)-cam.fov)*ez(3);cam.position.set(px-f.x*.2+rt.x*swy,base+1.22+bob,pz-f.z*.2+rt.z*swy);cam.lookAt(px+f.x*4,base+1.1+bob*.4,pz+f.z*4);cam.rotateZ(-R3.roll*.25);}
 else if(cm==='explore'){player.visible=true;cam.fov+=((P.run&&mv?64:59)-cam.fov)*ez(3);const dist=inside?2.4:3.6,hgt=inside?2.2:1.85;
  // Schulter-Seite: dorthin, wo mehr Platz ist (weich umschalten)
  {const fr=sg=>{let n=0;for(let s=1.2;s<3.3;s+=1)if(!camBlock(px-f.x*s+rt.x*sg*.9,pz-f.z*s+rt.z*sg*.9,base+1.8))n++;return n;},a=fr(1),b=fr(-1);R3.side=R3.side||1;if(b>a)R3.side=-1;else if(a>b)R3.side=1;R3.sh=R3.sh==null||R3.snap?.3*R3.side:sdamp(R3.sh,.3*R3.side,V,'sh',.45,dt);}
  const sh=R3.sh;
  // Wandkollision: Strecke Kopf→Wunschposition abtasten, bei Hindernis näher heran (schnell rein, langsam raus)
  let kind=0;const scan=hg=>{for(let s=.35;s<=dist;s+=.12){const q=s/dist,k=camBlock(px-f.x*s+rt.x*sh*q,pz-f.z*s+rt.z*sh*q,base+1.3+(hg-1.3)*q);if(k){kind=k;return Math.max(.3,s-.28);}}return dist;};
  let lim=scan(hgt),hw=hgt;// Nachbesserung 1 (W-1/W-2): niedrige Hindernisse (Bäume/Felsen) erst unter 1,7 Abstand mit Draufsicht umgehen – darüber Augenhöhe halten (Horizont bleibt im Bild; Laub nahe der Kamera blendet NF_GLSL aus)
  if(kind===2&&lim<1.7&&!inside){lim=Math.max(lim,2.2);hw=4;}
  // Nachbesserung: Haus/Mauer direkt hinter der Figur (z. B. Spawn Morgenau 9,7) – nicht auf 0,3 heranziehen, sondern Mindestabstand 2,2 und von oben über das Dach schauen (Wand 1,7 + Dach ≤ 1,25 < 3,6)
  else if(kind===1&&lim<2.2&&!inside&&!encl){lim=2.2;hw=4.4;}
  // Nachbesserung 1 (QA Loop C W-3): Höhle (kein Dach) – Felswand hinter der Figur: Abstand ≥ 2,8 und von oben schauen statt Kopf im unteren Bilddrittel
  else if(kind===1&&lim<2.8&&encl&&!inside){lim=2.8;hw=3.9;}
  // Seitenfreiheit (QA L3, I2): (1) Kamera weicht seitlich von Wänden/Gebäuden (Art 1) aus, wenn die freie Seite Platz hat (bis 1,0, gedämpft R3.sp);
  // (2) Randstrahlen des Sichtfelds (±48°) von der Kamera: trifft einer innerhalb 2,0 ein Gebäude, wird der Abstand in 0,2-Schritten verkürzt (min. 2,2). Kosten: ≈ 30 Kachelabfragen/Frame, nur draußen.
  let spT=0;if(!inside){const yy=base+1.8,wd=(g,s,o)=>{const q2=s/dist,cx=px-f.x*s+rt.x*(sh+o)*q2,cz=pz-f.z*s+rt.z*(sh+o)*q2;for(let e=.2;e<=1.5;e+=.15)if(camB1(cx+rt.x*g*e,cz+rt.z*g*e,yy)===1)return e;return 9;};
   const wl=wd(-1,lim,0),wr=wd(1,lim,0),wm=Math.min(wl,wr);if(wm<1.3){const g=wl<wr?1:-1,oth=g>0?wr:wl;spT=g*Math.max(0,Math.min(1,1.3-wm,oth-.9));}
   if(lim>2.25){const ca=Math.cos(.85),sa=Math.sin(.85),edge=s=>{const q2=s/dist,cx=px-f.x*s+rt.x*(sh+spT)*q2,cz=pz-f.z*s+rt.z*(sh+spT)*q2;for(let g=-1;g<=1;g+=2){const dx=f.x*ca+rt.x*g*sa,dz=f.z*ca+rt.z*g*sa;for(let e=.45;e<=2;e+=.4)if(camB1(cx+dx*e,cz+dz*e,yy)===1)return true;}return false;};
    let s2=lim;while(s2>2.2&&edge(s2))s2-=.2;if(s2<lim)lim=Math.max(2.2,s2);}}
  R3.sp=R3.snap||R3.sp==null?spT:sdamp(R3.sp,spT,V,'sp',.5,dt);
  R3.ch=R3.snap||R3.ch==null?hw:sdamp(R3.ch,hw,V,'ch',.4,dt);
  R3.cd=R3.snap?lim:lim<R3.cd?R3.cd+(lim-R3.cd)*ez(16):sdamp(R3.cd,lim,V,'cd',.55,dt);const q=R3.cd/dist;
  const shp=sh+R3.sp,want=_cw.set(px-f.x*R3.cd+rt.x*shp*q,base+1.3+(R3.ch-1.3)*(.35+.65*Math.max(q,Math.min(1,(R3.ch-hgt)/(4-hgt)))),pz-f.z*R3.cd+rt.z*shp*q);
  if(R3.snap){cam.position.copy(want);V.cpx=V.cpy=V.cpz=0;}else sdampV(cam.position,want,V,'cp',.16,dt);
  const la=P.walk&&P.run?2:1.3;R3.lk=R3.lk||new THREE.Vector3();const lt=_lt.set(px+f.x*la+rt.x*.15,base+1.12,pz+f.z*la+rt.z*.15);if(R3.snap){R3.lk.copy(lt);V.lkx=V.lky=V.lkz=0;}else sdampV(R3.lk,lt,V,'lk',.12,dt);
  cam.lookAt(R3.lk);cam.rotateZ(-R3.roll*.4);player.visible=R3.cd>.75;
  // CAM spiegeln (für Übergänge/Abfragen anderer Module); yaw/pitch gehören in diesem Modus 36-input.js
  try{if(typeof CAM!=='undefined'&&CAM){CAM.target.x=px;CAM.target.y=base;CAM.target.z=pz;CAM.dist=R3.cd;CAM.height=cam.position.y-base;CAM.fov=cam.fov;if(CAM.lookAt){CAM.lookAt.x=R3.lk.x;CAM.lookAt.y=R3.lk.y;CAM.lookAt.z=R3.lk.z;}}}catch(e){}}
 else{// CAM-gesteuert (Kampf-Nähe, Dialog, Kamerafahrt): eigene Kamera, gedämpft
  player.visible=true;const C=CAM,cc=R3.camC,tg=C.target||{x:px,y:base,z:pz},la=C.lookAt||tg,yw=C.yaw||0,ds=C.dist??3.6,hg=C.height??1.8;
  if(R3.cmPrev!==cm||C.snap){if(R3.cmPrev==='explore'||!R3.cmPrev){cc.position.copy(R3.shown.position);cc.quaternion.copy(R3.shown.quaternion);cc.fov=R3.shown.fov||cam.fov;R3.lkC=(R3.lkC||new THREE.Vector3()).copy(R3.lk||_lt.set(px,base+1,pz));}V.ccx=V.ccy=V.ccz=V.clx=V.cly=V.clz=V.cfv=0;}
  const want=_cw.set(tg.x+Math.sin(yw)*ds,tg.y+hg,tg.z+Math.cos(yw)*ds);if(C.snap){cc.position.copy(want);R3.lkC.set(la.x,la.y,la.z);cc.fov=C.fov||cc.fov;C.snap=false;}
  else{const sm=C.smooth??.35;sdampV(cc.position,want,V,'cc',sm,dt);sdampV(R3.lkC,_lt.set(la.x,la.y,la.z),V,'cl',sm*.8,dt);cc.fov=sdamp(cc.fov,C.fov||cam.fov,V,'cfv',sm,dt);}
  cc.aspect=cam.aspect;cc.lookAt(R3.lkC);if(C.roll)cc.rotateZ(C.roll);cc.updateProjectionMatrix();rc=cc;}
 // Nachbesserung 1 (W-1): Nahbereich-Ausblendung nur in der Verfolgerkamera draußen; Schwellen relativ zum Kameraabstand (Figur selbst bleibt unberührt)
 if(W3U.uNF.value)W3U.uNF.value.set(R3.cd*.5,R3.cd*.9,r.domElement.height||1,cm==='explore'&&view==='third'&&!inside?r.domElement.width||1:0);
 R3.cmPrev=cm;R3.activeCam=rc;
 blobSync(S);
 R3.dome.visible=!inside&&!encl&&!(typeof skyActive==='function'&&skyActive());R3.dome.position.copy(rc.position);if(typeof skyCam==='function')skyCam(rc);R3.snap=0;rc.updateProjectionMatrix();r.render(S,rc);}
// ---------- Freies Laufen in 3D ----------
const STICK={x:0,y:0};
function freeMove(dt){if(mode!=='world'){P.walk=false;return;}let sx=STICK.x,sy=STICK.y;
 if(!sx&&!sy&&held){sx=held==='left'?-1:held==='right'?1:0;sy=held==='up'?-1:held==='down'?1:0;}
 if(P.ang==null)P.ang=YAW[P.dir];const s=Math.min(dt,120)/1000;const dz=v=>Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;sx=dz(sx);sy=dz(sy);
 P.tv=(P.tv||0)+((-sx*1.7*(Math.abs(sy)>.3?.65:1))-(P.tv||0))*Math.min(1,s*9);P.ang+=P.tv*s;
 const a=((P.ang%(2*Math.PI))+2*Math.PI)%(2*Math.PI);P.dir=['up','left','down','right'][Math.round(a/(Math.PI/2))%4];
 const want=-sy*(P.run?2.6:1.5);P.v=(P.v||0)+(want-(P.v||0))*Math.min(1,s*(Math.abs(want)>Math.abs(P.v||0)?6:10));const sp=P.v*s;P.walk=Math.abs(P.v)>.08;if(!P.walk){P.v=0;return;}
 const fx=-Math.sin(P.ang),fy=-Math.cos(P.ang),nx=P.px+fx*sp,ny=P.py+fy*sp;
 if(nx<-.45||ny<-.45||nx>cur.w-.55||ny>cur.h-.55){const d=nx<-.45?'left':nx>cur.w-.55?'right':ny<-.45?'up':'down';P.x=Math.round(P.px);P.y=Math.round(P.py);P.walk=false;tryMove(d);P.moving=false;P.px=P.x;P.py=P.y;return;}
 const free=(x,y)=>{for(const[ox,oy]of[[-.27,-.27],[.27,-.27],[-.27,.27],[.27,.27]]){const tx=Math.round(x+ox),ty=Math.round(y+oy);if(tx===P.x&&ty===P.y)continue;if(blocked(tx,ty))return false;}return true;};
 const rr=roamAt(Math.round(P.px+fx*.65),Math.round(P.py+fy*.65));if(rr&&G.team.some(m=>m.hp>0)){P.walk=false;return startWild(rr);}
 if(free(nx,P.py))P.px=nx;else bump();if(free(P.px,ny))P.py=ny;
 const tx=Math.round(P.px),ty=Math.round(P.py);if(tx!==P.x||ty!==P.y){const ox=P.x,oy=P.y;P.x=tx;P.y=ty;G.px=tx;G.py=ty;compFollow(ox,oy);onStep();}}
// Nachbesserung 1 (QA Loop C P-3): entfernte Figuren geben ihre Knochen-Textur frei (Skeleton.boneTexture, 8×8 je Figur – wuchs sonst mit jedem Kartenwechsel)
function w3dropRig(o){if(o)o.traverse(q=>{if(q.isSkinnedMesh&&q.skeleton&&q.skeleton.dispose&&q.userData.outline!==1)q.skeleton.dispose();});}
function syncPeople(S,t,dt){const pm=S.userData.pm||(S.userData.pm=new Map());for(const[k,o]of pm)if(!VILL.list.includes(k)){S.remove(o);BLOB.delete(o);pm.delete(k);w3dropRig(o);}
 for(const v of VILL.list){let o=pm.get(v);if(!o){o=person3d(v.c,shade(v.c,.6));S.add(o);pm.set(v,o);}o.position.set(v.px+.5,terrainY(v.px+.5,v.py+.5),v.py+.5);o.rotation.y=YAW[v.dir];
  if(o.userData.rig&&typeof gaitTick==='function')gaitTick(o,dt||.016);else{const sw=v.t<1?Math.sin(t/90)*.6:0;o.userData.legs[0].rotation.x=sw;o.userData.legs[1].rotation.x=-sw;}}}
// ---------- Effekte: Partikel-Pools, Ringe, Kontaktschatten, Wetter ----------
function windify(mt,amp,fromY,nf){mt.userData.windP=[amp,fromY];return toonFx(mt,{wind:[amp,fromY],nf});}
function makeParticles(n,col,size,additive){const pos=new Float32Array(n*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const pt=new THREE.Points(geo,new THREE.PointsMaterial({color:col,size,map:dotTex(),transparent:true,opacity:.85,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,sizeAttenuation:true}));pt.frustumCulled=false;pt.userData.seed=Array.from({length:n},(_,i)=>[hs(i,1),hs(i,2),hs(i,3)]);return pt;}
const FXP_VS='attribute vec3 aCol;attribute float aSize;attribute float aAlpha;uniform float uScale;varying vec3 vC;varying float vA;void main(){vC=aCol;vA=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uScale/max(-mv.z,.1);gl_Position=projectionMatrix*mv;}';
const FXP_FS='varying vec3 vC;varying float vA;uniform float uSoft;void main(){float d=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,uSoft,d)*vA;if(a<.01)discard;gl_FragColor=vec4(vC,a);}';
function fxPool(n,add,soft){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3).fill(-999),3));g.setAttribute('aCol',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('aSize',new THREE.BufferAttribute(new Float32Array(n),1));g.setAttribute('aAlpha',new THREE.BufferAttribute(new Float32Array(n),1));
 const pt=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:{uScale:{value:300},uSoft:{value:soft}},vertexShader:FXP_VS,fragmentShader:FXP_FS,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}));pt.frustumCulled=false;pt.renderOrder=3;
 return{pt,n,i:0,v:new Float32Array(n*3),life:new Float32Array(n),age:new Float32Array(n).fill(9),gr:new Float32Array(n),sz0:new Float32Array(n),grow:new Float32Array(n),a0:new Float32Array(n),drag:new Float32Array(n)};}
// Partikel-Arten: Anzahl, Farbe, Geschwindigkeit, Schwerkraft, Lebensdauer, Größe, Wachstum, Alpha, additiv, Ring
const FXK={dust:{n:5,c:'#dccaa6',v:[.5,.35,.5],up:.25,g:-.15,l:[.5,.8],s:[.22,.4],gw:1.8,a:.5,dr:2},
 land:{n:12,c:'#e0cfae',rad:1.7,up:.25,g:.5,l:[.4,.6],s:[.18,.32],gw:1.6,a:.6,dr:3,ring:[.9,.5]},
 splash:{n:10,c:'#eaf6ff',v:[.9,2.4,.9],up:1.2,g:6,l:[.45,.7],s:[.07,.13],gw:0,a:.9,dr:.5,ring:[.8,.7]},
 wake:{n:3,c:'#f2fbff',v:[.4,.8,.4],up:.6,g:5,l:[.3,.5],s:[.05,.09],gw:0,a:.8,dr:.5,ring:[1.3,1.1]},
 wind:{n:2,c:'#ffffff',v:[.2,.1,.2],wind:2.6,g:0,l:[1,1.6],s:[.05,.08],gw:0,a:.55,dr:0},
 rustle:{n:5,c:null,v:[.7,1.1,.7],up:1,g:3.4,l:[.4,.65],s:[.07,.11],gw:0,a:.95,dr:1},
 sparkle:{n:4,c:'#fff2b0',v:[.35,.5,.35],up:.3,g:-.3,l:[.5,.9],s:[.1,.2],gw:-.6,a:1,dr:1,add:1}};
const W3FX={};
function fxInit(){if(W3FX.a)return;W3FX.a=fxPool(220,0,.55);W3FX.b=fxPool(90,1,.15);
 // Ringe: Pool aus Quads, Ring im Shader (Alter je Instanz)
 const n=40,g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);const age=new Float32Array(n).fill(2);g.setAttribute('aAge',new THREE.InstancedBufferAttribute(age,1));
 const rm=new THREE.InstancedMesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'attribute float aAge;varying float vA;varying vec2 vU;void main(){vA=aAge;vU=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
  fragmentShader:'varying float vA;varying vec2 vU;void main(){if(vA>=1.)discard;float d=length(vU-.5)*2.;float r=.25+vA*.75;float a=smoothstep(.09,.0,abs(d-r))*(1.-vA)*.85;if(a<.01)discard;gl_FragColor=vec4(.95,.99,1.,a);}'}),n);
 rm.frustumCulled=false;rm.renderOrder=2;const dd=new THREE.Object3D();dd.scale.set(0,0,0);dd.updateMatrix();for(let i=0;i<n;i++)rm.setMatrixAt(i,dd.matrix);W3FX.ring={m:rm,n,i:0,t0:new Float32Array(n).fill(-9),dur:new Float32Array(n).fill(1),pos:new Float32Array(n*4)};
 // Kontaktschatten
 const bm=new THREE.InstancedMesh(g3('blobQ',()=>new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2)),new THREE.MeshBasicMaterial({map:blobTex(),color:'#1e2a34',transparent:true,opacity:.42,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),64);bm.count=0;bm.frustumCulled=false;bm.renderOrder=1;W3FX.blob=bm;
 // Wetter: Regen (Linien), Schnee, Sand, Nebelbänke
 const RN=520,rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(RN*6),3));W3FX.rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:'#d6e4f2',transparent:true,opacity:.5,depthWrite:false}));W3FX.rain.frustumCulled=false;W3FX.rain.userData.d=Array.from({length:RN},()=>[Math.random(),Math.random(),Math.random()]);
 W3FX.snow=makeParticles(520,'#ffffff',.13,false);W3FX.sand=makeParticles(420,'#c8945a',.2,false);W3FX.sand.material.opacity=.7;W3FX.mist=makeParticles(36,'#eef2f4',4.2,false);W3FX.mist.material.opacity=.14;
 W3FX.amb=makeParticles(70,'#ffffff',.12,true);W3FX.dust=null;W3FX.leaf=leafInit();}
function fxAttach(S){fxInit();[W3FX.a.pt,W3FX.b.pt,W3FX.ring.m,W3FX.blob,W3FX.rain,W3FX.snow,W3FX.sand,W3FX.mist,W3FX.amb,W3FX.leaf.m].forEach(o=>S.add(o));}
// ---------- Look L1: fallende Blätter / Blüten / Asche als EIN InstancedMesh (Menge je Qualitätsstufe) ----------
const LEAF_MAX=40;
function leafTex(){return W3T.leafT||(W3T.leafT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#ffffff';x.beginPath();x.moveTo(32,4);x.bezierCurveTo(54,16,52,44,32,60);x.bezierCurveTo(12,44,10,16,32,4);x.fill();
 x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=2;x.beginPath();x.moveTo(32,8);x.lineTo(32,56);x.stroke();const t=new THREE.CanvasTexture(c);return t;})());}
function leafInit(){const m=new THREE.InstancedMesh(new THREE.PlaneGeometry(.13,.15),new THREE.MeshBasicMaterial({map:leafTex(),alphaTest:.5,side:THREE.DoubleSide,transparent:false}),LEAF_MAX);m.frustumCulled=false;m.count=0;m.castShadow=false;
 const st=new Float32Array(LEAF_MAX*8);m.count=LEAF_MAX;for(let i=0;i<LEAF_MAX;i++){st[i*8+7]=-1;m.setColorAt(i,_c1.set('#ffffff'));}m.count=0;return{m,st,kind:'',d:new THREE.Object3D()};}
const LEAF_COL={leaf:['#7fb04a','#c9b23a','#e08a3a','#a8c25a'],petal:['#ffc2d6','#ffe0ea','#ffffff'],ash:['#6a5a54','#8a7a70','#ff9a4a'],wisp:['#b9a8ff','#e0d8ff']};
function leafStep(L,dt,px,pz,gy,kind,n,wind,sec){const m=L.m;if(!kind||!n){m.visible=false;return;}m.visible=true;
 if(L.kind!==kind){L.kind=kind;const cs=LEAF_COL[kind]||LEAF_COL.leaf;for(let i=0;i<LEAF_MAX;i++){m.setColorAt(i,_c1.set(cs[i%cs.length]));L.st[i*8+7]=-1;}m.instanceColor.needsUpdate=true;}
 m.count=n;const st=L.st,d=L.d,wd=W3FX.wdir||[1,0],fall=kind==='ash'?.25:kind==='wisp'?.05:.45;
 for(let i=0;i<n;i++){const k=i*8;if(st[k+7]<0||st[k+1]<gy-.2||Math.abs(st[k]-px)>9||Math.abs(st[k+2]-pz)>9){const a=Math.random()*6.283,r=1.5+Math.random()*7;st[k]=px+Math.cos(a)*r;st[k+2]=pz+Math.sin(a)*r;st[k+1]=gy+(st[k+7]<0?Math.random()*2.6:2.2+Math.random()*1.2);st[k+3]=Math.random()*6.283;st[k+4]=.6+Math.random()*.8;st[k+5]=Math.random()*6.283;st[k+6]=.7+Math.random()*.6;st[k+7]=1;}
  const ph=sec*st[k+4]+st[k+3];st[k]+=(wd[0]*.35*wind+Math.sin(ph)*.25)*dt;st[k+2]+=(wd[1]*.35*wind+Math.cos(ph*.8)*.2)*dt;st[k+1]-=fall*st[k+6]*dt*(kind==='wisp'?Math.sin(ph)*2:1);
  d.position.set(st[k],st[k+1],st[k+2]);d.rotation.set(Math.sin(ph)*1.2,st[k+5]+sec*.6,Math.cos(ph*1.3)*1.1);const sc=kind==='ash'?.6:1;d.scale.set(sc,sc,sc);d.updateMatrix();m.setMatrixAt(i,d.matrix);}
 m.instanceMatrix.needsUpdate=true;}
// ---------- Look L1: Qualitätsstufe anwenden (43-perf.js ruft w3Quality bei Wechsel; draw3d beim Kartenwechsel) ----------
function w3Quality(T){T=T||perfTier();if(!R3||!window.THREE)return;const sun=R3.sun,ms=T.shadow||512;
 if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
 for(const S of Object.values(scenes)){const V=S.userData&&S.userData.veg;if(V)for(const im of V)im.count=Math.max(1,Math.round(im.userData.n0*T.veg));}
 if(W3FX.amb){const k=T.part;W3FX.amb.geometry.setDrawRange(0,Math.round(70*k));W3FX.snow.geometry.setDrawRange(0,Math.round(520*k));W3FX.sand.geometry.setDrawRange(0,Math.round(420*k));W3FX.rain.geometry.setDrawRange(0,Math.round(520*k)*2);}}
// ---------- Look L1: Himmels-Cubemap für Spiegelungen (Wasser, Glas) – selten aktualisiert (Tageszeit/Wetter), 6 × 64 px ----------
function w3Env(force){if(!R3||!window.THREE)return;let E=R3.env;const nw=performance.now(),h=G?G.time/60:12,wk=W3W.k;
 if(!E){try{const rt=new THREE.WebGLCubeRenderTarget(64,{format:THREE.RGBFormat,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});E=R3.env={rt,cam:new THREE.CubeCamera(.1,200,rt),scene:new THREE.Scene(),h:-99,g:-1,t:0,ok:false};
   E.scene.add(new THREE.Mesh(R3.dome.geometry,R3.dome.material));}catch(e){R3.env={ok:false,dead:1};return;}}
 if(E.dead)return;if(!force&&(nw-E.t<1800||(Math.abs(h-E.h)<.12&&Math.abs(wk.gray-E.g)<.05)))return;
 E.t=nw;E.h=h;E.g=wk.gray;try{const dv=R3.dome.visible;R3.dome.visible=true;E.cam.update(R3.r,E.scene);R3.dome.visible=dv;E.ok=true;}catch(e){E.ok=false;E.dead=1;}}
function spawnFx(kind,x,y,z){if(!window.THREE||!SET.particles)return;fxInit();const K=FXK[kind];if(!K)return;const P_=K.add?W3FX.b:W3FX.a,g=P_.pt.geometry,pos=g.attributes.position.array,col=g.attributes.aCol.array;
 const c=new THREE.Color(K.c||(R3&&R3.scene&&R3.scene.userData.grassC)||'#6fbf5a'),wd=W3FX.wdir||[1,0];
 for(let k=0;k<K.n;k++){const i=P_.i=(P_.i+1)%P_.n,j=i*3;let vx,vy,vz;
  if(K.rad){const a=k/K.n*Math.PI*2+Math.random()*.4;vx=Math.cos(a)*K.rad*(.7+Math.random()*.5);vz=Math.sin(a)*K.rad*(.7+Math.random()*.5);vy=K.up*Math.random();}
  else if(K.wind){vx=wd[0]*K.wind*(.8+Math.random()*.4);vz=wd[1]*K.wind*(.8+Math.random()*.4);vy=(Math.random()-.5)*.2;}
  else{vx=(Math.random()*2-1)*K.v[0];vy=K.up+Math.random()*K.v[1];vz=(Math.random()*2-1)*K.v[2];}
  pos[j]=x+(Math.random()-.5)*(K.wind?3:.25);pos[j+1]=y+(K.wind?Math.random()*1.2:0);pos[j+2]=z+(Math.random()-.5)*(K.wind?3:.25);P_.v[j]=vx;P_.v[j+1]=vy;P_.v[j+2]=vz;
  const cc=c.clone().multiplyScalar(.9+Math.random()*.2);col[j]=cc.r;col[j+1]=cc.g;col[j+2]=cc.b;P_.age[i]=0;P_.life[i]=K.l[0]+Math.random()*(K.l[1]-K.l[0]);P_.gr[i]=K.g;P_.sz0[i]=K.s[0]+Math.random()*(K.s[1]-K.s[0]);P_.grow[i]=K.gw;P_.a0[i]=K.a;P_.drag[i]=K.dr;}
 g.attributes.aCol.needsUpdate=true;
 if(K.ring){const R=W3FX.ring,i=R.i=(R.i+1)%R.n;R.t0[i]=performance.now();R.dur[i]=K.ring[1];R.pos.set([x,y+.02,z,K.ring[0]],i*4);}}
function fxStep(P_,dt){const g=P_.pt.geometry,pos=g.attributes.position.array,sz=g.attributes.aSize.array,al=g.attributes.aAlpha.array;let live=0;
 for(let i=0;i<P_.n;i++){if(P_.age[i]>=P_.life[i]){if(al[i]){al[i]=0;pos[i*3+1]=-999;}continue;}live++;P_.age[i]+=dt;const k=Math.min(1,P_.age[i]/P_.life[i]),j=i*3,dr=Math.exp(-P_.drag[i]*dt);
  P_.v[j]*=dr;P_.v[j+2]*=dr;P_.v[j+1]=P_.v[j+1]*dr-P_.gr[i]*dt;pos[j]+=P_.v[j]*dt;pos[j+1]+=P_.v[j+1]*dt;pos[j+2]+=P_.v[j+2]*dt;
  sz[i]=Math.max(.01,P_.sz0[i]*(1+P_.grow[i]*k));al[i]=P_.a0[i]*(k<.15?k/.15:1-(k-.15)/.85);}
 g.attributes.position.needsUpdate=g.attributes.aSize.needsUpdate=g.attributes.aAlpha.needsUpdate=true;return live;}
function blobSync(S){const bm=W3FX.blob;if(!bm)return;const d=blobSync.d||(blobSync.d=new THREE.Object3D());let n=0;
 let live=blobSync.live;if(!live||blobSync.n!==Object.keys(scenes).length){live=blobSync.live=new Set(Object.values(scenes));blobSync.n=live.size;}for(const o of BLOB){let r=o,vis=true;while(r.parent){if(!r.visible)vis=false;r=r.parent;}if(r!==S){if(o!==R3.player&&(r===o||r.isScene&&!live.has(r)))BLOB.delete(o);continue;}if(!vis||!o.visible)continue;if(n>=64)break;o.getWorldPosition(_v);const gy=terrainY(_v.x,_v.z),hgt=Math.max(0,_v.y-gy),s=o.userData.blob*2.2/(1+hgt*.9);
  d.position.set(_v.x,gy+.035,_v.z);d.scale.set(s,1,s);if(typeof hyBlob==='function')hyBlob(d,s,bm);/* Hybrid H2: Ellipse nach Bild-Sonne */d.updateMatrix();bm.setMatrixAt(n++,d.matrix);}
 bm.count=n;bm.instanceMatrix.needsUpdate=true;bm.visible=!!n;}
// ---------- Echtzeit-Atmosphäre: Wind, Gras-Wegdrücken, Partikel, Wetter ----------
const AMBK={cave:['#9fe4f2',.12,.55],fly:['#e6ff8a',.16,.7],pollen:['#fff3c0',.1,.5],ember:['#ff9a3a',.13,.85],wisp:['#c8b8ff',.18,.7],dust:['#f0dcb0',.09,.45],spark:['#ffe14a',.08,.8],red:['#ff5a7a',.1,.6],gold:['#ffd86a',.12,.8]};
function atmo3d(S,t,px,pz,day,cave,inside,dt){const U=S.userData,sec=t/1000,th=U.th||TH3.default,encl=cave||th.enclosed&&!inside;dt=dt||.016;fxInit();
 W3U.uTime.value=sec;W3U.uWind.value=W3W.k.wind;const wa=sec*.05;W3FX.wdir=[Math.cos(wa)*.9+.3,Math.sin(wa)*.5];
 // Gras-Wegdrücken: Spieler, Begleiter, Wildkreaturen
 {const Pu=W3U.uPush.value;let i=0;const put=(x,z,r,s)=>{if(i<8)Pu[i++].set(x,z,r,s);};put(px,pz,.62,1);if(typeof encFx3d==='function')encFx3d(put,t);if(COMP&&COMP.s)put(COMP.px+.5,COMP.py+.5,.5,.9);for(const r of ROAM.list)put(r.px+.5,r.py+.5,.55,1);while(i<8)Pu[i++].set(0,0,0,0);}
 const cvh=R3.r.domElement.height||600,us=cvh*.5/Math.tan(R3.cam.fov*Math.PI/360);W3FX.a.pt.material.uniforms.uScale.value=us;W3FX.b.pt.material.uniforms.uScale.value=us;
 const on=!!SET.particles;
 // Bewegungs-Effekte: Rascheln im hohen Gras, Staub beim Rennen, Ringe im Wasser
 if(on&&!inside){const tile=(x,z)=>tileAt(cur,Math.floor(x),Math.floor(z)),gy=R3.gy||0;U.fxT=U.fxT||{};
  const every=(k,ms)=>{if(t-(U.fxT[k]||0)>ms){U.fxT[k]=t;return true;}return false;};
  if(P.walk||P.moving){const tt=tile(px,pz);if(tt==='"'&&every('rp',P.run?110:170))spawnFx('rustle',px,gy+.25,pz);
   else if((tt==='~'||tt==='Q')&&every('wk',260))spawnFx('wake',px,.04,pz);else if(P.run&&tt!=='"'&&every('du',120))spawnFx('dust',px,gy+.04,pz);}
  for(const r of ROAM.list){if(r.t<1){const tt=tile(r.px+.5,r.py+.5);if(tt==='"'&&Math.random()<dt*5)spawnFx('rustle',r.px+.5,terrainY(r.px+.5,r.py+.5)+.2,r.py+.5);else if((tt==='~'||tt==='Q')&&Math.random()<dt*3)spawnFx('wake',r.px+.5,.04,r.py+.5);}}
  if(COMP&&COMP.t<1){const tt=tile(COMP.px+.5,COMP.py+.5);if(tt==='"'&&Math.random()<dt*5)spawnFx('rustle',COMP.px+.5,terrainY(COMP.px+.5,COMP.py+.5)+.2,COMP.py+.5);}
  if(U.fount)U.fount.forEach(q=>{if(every('fo'+q[0],140))spawnFx('splash',q[0],q[1],q[2]);});
  if(!encl&&W3W.k.wind>1.3&&every('wi',260))spawnFx('wind',px+(Math.random()-.5)*6,gy+.5,pz+(Math.random()-.5)*6);}
 fxStep(W3FX.a,dt);fxStep(W3FX.b,dt);W3FX.a.pt.visible=W3FX.b.pt.visible=on;
 {const R=W3FX.ring,ag=R.m.geometry.attributes.aAge,d=atmo3d.d||(atmo3d.d=new THREE.Object3D()),now=performance.now();
  for(let i=0;i<R.n;i++){const k=(now-R.t0[i])/1000/R.dur[i];if(k>=1&&ag.array[i]>=1)continue;ag.array[i]=Math.min(1,k);const s=R.pos[i*4+3]*(.5+k*.8);d.position.set(R.pos[i*4],R.pos[i*4+1],R.pos[i*4+2]);d.scale.set(k>=1?0:s,1,k>=1?0:s);d.updateMatrix();R.m.setMatrixAt(i,d.matrix);}
  ag.needsUpdate=true;R.m.instanceMatrix.needsUpdate=true;R.m.visible=on;}
 // Wetter-Partikel um die Kamera
 const ws=encl||inside?'klar':W3W.cur,cp=R3.cam.position,rainy=ws==='regen'||ws==='gewitter';
 {const rn=W3FX.rain;rn.visible=on&&rainy;if(rn.visible){const a=rn.geometry.attributes.position.array,wx=W3FX.wdir[0]*.12*W3W.k.wind,wz=W3FX.wdir[1]*.12*W3W.k.wind;rn.material.opacity=ws==='gewitter'?.6:.45;
   rn.userData.d.forEach((q,i)=>{q[1]-=dt*(1.5+q[2]*.4);if(q[1]<0){q[1]+=1;q[0]=Math.random();q[2]=Math.random();}const ang=q[0]*Math.PI*2,rr=1+Math.sqrt(q[2])*9,x=cp.x+Math.cos(ang)*rr,z=cp.z+Math.sin(ang)*rr,y=cp.y-3+q[1]*11,j=i*6;
    a[j]=x;a[j+1]=y;a[j+2]=z;a[j+3]=x-wx*3;a[j+4]=y+.5;a[j+5]=z-wz*3;});rn.geometry.attributes.position.needsUpdate=true;
   const U2=U.fxT=U.fxT||{};if(t-(U2.pd||0)>90){U2.pd=t;for(let k=0;k<2;k++){const x=px+(Math.random()-.5)*10,z=pz+(Math.random()-.5)*10,tt=tileAt(cur,Math.floor(x),Math.floor(z));if(tt&&tt!=='X'&&!BUILD.includes(tt)&&tt!=='T'){const R=W3FX.ring,i=R.i=(R.i+1)%R.n;R.t0[i]=performance.now();R.dur[i]=.55;R.pos.set([x,(tt==='~'||tt==='Q'?.05:terrainY(x,z)+.03),z,.38],i*4);}}}}}
 {const sn=W3FX.snow;sn.visible=on&&ws==='schnee';if(sn.visible){const a=sn.geometry.attributes.position;sn.userData.seed.forEach(([u,v,w],i)=>{const y=((v*10-sec*(.6+w*.5))%10+10)%10,x=cp.x+(u-.5)*20+Math.sin(sec*.8+i)*.4,z=cp.z+(w-.5)*20+Math.cos(sec*.6+i)*.4;a.setXYZ(i,x,cp.y-3.5+y,z);});a.needsUpdate=true;}}
 {const sa=W3FX.sand;sa.visible=on&&ws==='sand';if(sa.visible){const a=sa.geometry.attributes.position;sa.userData.seed.forEach(([u,v,w],i)=>{const x=cp.x+(((u*24+sec*(5+w*3))%24+24)%24-12),z=cp.z+(w-.5)*24+Math.sin(sec+i)*.3,y=(R3.gy||0)+.1+v*3+Math.sin(sec*3+i)*.2;a.setXYZ(i,x,y,z);});a.needsUpdate=true;}}
 {const mi=W3FX.mist;mi.visible=ws==='nebel'||(!encl&&!inside&&th.fogK&&th.fogK<.8);if(mi.visible){mi.material.color.copy(S.fog.color).lerp(C_WHITE,.3);const a=mi.geometry.attributes.position;mi.userData.seed.forEach(([u,v,w],i)=>{const an=u*6.283+sec*.02*(w-.5),r=3+v*9;a.setXYZ(i,px+Math.cos(an)*r,(R3.gy||0)+.6+w*.8,pz+Math.sin(an)*r);});a.needsUpdate=true;}}
 // Umgebungs-Partikel je Theme/Tageszeit: Pollen, Glühwürmchen, Funken, Irrlichter, Staub
 // Fallende Blätter/Blüten/Asche (nicht drinnen, nicht bei Niederschlag)
 {const tm=cur.theme,lk=!on||inside||encl||(ws!=='klar'&&ws!=='nebel')?'':th.amb==='ember'||th.lava?'ash':th.amb==='wisp'?'wisp':tm==='league'?'petal':/^(default|forest|wald|swamp|mountain|berg|ruin|tower)$/.test(tm||'default')?'leaf':'';
  leafStep(W3FX.leaf,dt,px,pz,R3.gy||0,lk,Math.round(perfTier().leaves*(day<.35?.5:1)),W3W.k.wind,sec);W3FX.leaf.m.material.color.copy(R3.sun.color).multiplyScalar(.25+.55*Math.max(day,.2)).add(_c1.copy(R3.hemi.color).multiplyScalar(.3));}
 const amb=W3FX.amb;if(!on){amb.visible=false;return;}
 const night=day<.35,pa=amb.geometry.attributes.position,gy=R3.gy||0,kind=th.amb||(cave?'cave':th.dark?'red':night?'fly':'pollen');amb.visible=!inside&&ws!=='sand';
 const AC=AMBK[kind]||AMBK.pollen;
 amb.material.color.set(AC[0]);amb.material.size=AC[1];amb.material.opacity=kind==='fly'?.5+.4*Math.sin(sec*3):AC[2];
 amb.userData.seed.forEach(([a,b,c],i)=>{const r=5+a*7,an=b*6.283+sec*(.05+c*.08);let y;
  if(kind==='ember'||kind==='spark')y=gy+((c*5+sec*(.25+a*.3))%4);else if(kind==='cave'||kind==='red')y=gy+.3+((c*4+sec*.08)%1.6);else if(kind==='fly'||kind==='wisp')y=gy+.4+Math.sin(sec*.9+i)*.5+c*1.2;else y=gy+1.4+Math.sin(sec*.5+i)*.8+c*1.5;
  pa.setXYZ(i,px+Math.cos(an)*r+Math.sin(sec*.7+i)*.4,y,pz+Math.sin(an)*r+Math.cos(sec*.6+i)*.4);});pa.needsUpdate=true;}
