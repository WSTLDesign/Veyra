// ===== VEYRA – Hybrid H1: gerenderter Himmel (Skybox), Umgebungslicht aus dem Bild, Horizont-Kulisse, Wolkenmeer, Sonnenstrahlen – siehe docs/hybrid-sky.md =====
// Bilder: tools/render_assets.mjs → public/art/sky_<region>_<zeit>.webp (2048×1024 equirect, _lo 1024×512), horizon_<region>.webp (2048×512, transparent),
// bg_battle_<region>_<zeit>.webp (1280×720); Metadaten public/art/sky_meta.json → window.SKY_META (build.mjs). Quellen über window.ART_SRC[key].
// Schnittstelle (auch für H2/Kampf): skyRegion(map|id), skyTime(h), skyFor(region,time), envFor(region,time), battleBgFor(region,time), skyActive().
// 09-three3d.js ruft skyAttach(scene,map) beim Kartenwechsel, skyFrame(scene,O,ctx) nach dem Licht, skyCam(cam) vor render(); ohne Bilder bleibt der prozedurale Himmel.
const SKY_REGIONS=['lichtlande','smaragdwald','flutkueste','glutlande','kristallgebirge','frosttundra','himmelsweiten','schattenmoor'],SKY_TIMES=['tag','abend','nacht'];
// Karte → Region (+ Drehung der Kulisse in Grad, damit das Wahrzeichen in Blickrichtung der Ankunft liegt); fehlt eine Karte → Thema → 'lichtlande'
const SKY_MAPREG={morgenau:['lichtlande',0],route1:['lichtlande',0],route3:['lichtlande',40],siegesstrasse:['lichtlande',0],kupferhain:['smaragdwald',0],route2:['smaragdwald',30],fluestertal:['smaragdwald',0],
 brisenhafen:['flutkueste',180],windkueste:['flutkueste',150],moewenbucht:['flutkueste',180],glutschlucht:['glutlande',0],nebelgrotte:['kristallgebirge',0],frostheim:['frosttundra',0],route4:['schattenmoor',0],schattmoor:['schattenmoor',0]};
const SKY_THEMEREG={beach:'flutkueste',sea:'flutkueste',coast:'flutkueste',islands:'flutkueste',ember:'glutlande',volcano:'glutlande',desert:'glutlande',snow:'frosttundra',ice:'frosttundra',mountain:'kristallgebirge',cave:'kristallgebirge',crystal:'kristallgebirge',
 forest:'smaragdwald',whisper:'smaragdwald',swamp:'schattenmoor',shadow:'schattenmoor',sky:'himmelsweiten',cloud:'himmelsweiten',float:'himmelsweiten'};
// Fallback-Metadaten (falls sky_meta.json fehlt): Sonne/Mond je Tageszeit wie im Render-Werkzeug, Umgebungsfarben aus PALETTE-nahen Werten
const SKY_FB={tag:{sun:{az:-30,el:40,col:'#fff0d8',i:1},moon:null,stats:{top:'#7f9fcf',zenith:'#6286c0',hor:'#e4dccf',below:'#d8d6d6'},haze:'#eee4d8'},
 abend:{sun:{az:-70,el:6.5,col:'#ffb46c',i:1.1},moon:null,stats:{top:'#6a6a9a',zenith:'#44508a',hor:'#f2b88e',below:'#c49690'},haze:'#f2bf98'},
 nacht:{sun:{az:60,el:-30,col:'#000000',i:0},moon:{az:-112,el:22,col:'#e6ecff',i:1,phase:0},stats:{top:'#0e1834',zenith:'#070c20',hor:'#27365c',below:'#1c2442'},haze:'#2a3a64'}};
function skyMeta(){return window.SKY_META||null;}
function skyRegion(m){try{if(typeof m==='string')m=Object.assign({id:m},(typeof MAPS!=='undefined'&&MAPS[m])||{});/* Loop C: id mitgeben (MAPS-Einträge haben kein .id → sonst immer Lichtlande) */if(!m)return'lichtlande';if(m.region&&SKY_REGIONS.includes(m.region))return m.region;
 const e=SKY_MAPREG[m.id];if(e)return e[0];return SKY_THEMEREG[m.theme]||(m.float?'himmelsweiten':'lichtlande');}catch(e){return'lichtlande';}}
function skyRingYaw(m){const e=m&&SKY_MAPREG[m.id];return(m&&m.skyYaw!=null?m.skyYaw:e?e[1]:0)*Math.PI/180;}
// Tageszeit-Plan (Stunde → Bild): Übergänge weich über die Stunden dazwischen; Morgen nutzt das Abendbild (nach Osten gedreht)
const SKY_PLAN=[[0,'nacht'],[4.75,'nacht'],[5.75,'abend'],[6.75,'abend'],[8,'tag'],[16.75,'tag'],[18,'abend'],[19.5,'abend'],[20.75,'nacht'],[24,'nacht']];
function skyBlend(h){h=((h%24)+24)%24;let i=0;while(i<SKY_PLAN.length-2&&SKY_PLAN[i+1][0]<=h)i++;const a=SKY_PLAN[i],b=SKY_PLAN[i+1];let k=a[1]===b[1]?0:(h-a[0])/(b[0]-a[0]);k=k*k*(3-2*k);return{a:a[1],b:b[1],k};}
function skyTime(h){if(h==null)h=(typeof G!=='undefined'&&G?G.time:720)/60;const B=skyBlend(h);return B.k<.5?B.a:B.b;}
function skyNorm(region,time){return[SKY_REGIONS.includes(region)?region:'lichtlande',SKY_TIMES.includes(time)?time:'tag'];}
function skySrcOf(key){const S=window.ART_SRC||{};return S[key]||null;}
function skyDir(az,el){const a=az*Math.PI/180,e=el*Math.PI/180;return[Math.cos(e)*Math.cos(a),Math.sin(e),Math.cos(e)*Math.sin(a)];}
// ---------- Öffentliche Abfragen ----------
// skyFor → {key,region,time,src,lo,w,h,sun{az,el,dir,col,i},moon|null,haze,stats,ok}; ok=false: kein Bild (prozeduraler Himmel)
const SKY_MEMO=new Map();// Ergebnisse je Key (keine Allokation je Frame); neu berechnet, wenn sich Quelle/Metadaten ändern
function skyFor(region,time){if(!SKY_REGIONS.includes(region)||!SKY_TIMES.includes(time))[region,time]=skyNorm(region,time);const key='sky_'+region+'_'+time,M=skyMeta(),m=(M&&M.sky&&M.sky[key])||SKY_FB[time];
 const src=skySrcOf(key),lo=skySrcOf(key+'_lo'),mo=SKY_MEMO.get(key);if(mo&&mo.src===src&&mo.lo===lo&&mo._m===m)return mo;const sun=Object.assign({},m.sun);sun.dir=skyDir(sun.az,sun.el);const moon=m.moon?Object.assign({},m.moon,{dir:skyDir(m.moon.az,m.moon.el)}):null;
 const o={key,region,time,src,lo,w:m.w||2048,h:m.h||1024,sun,moon,haze:m.haze||SKY_FB[time].haze,stats:Object.assign({},SKY_FB[time].stats,m.stats||{}),ok:!!(src||lo),_m:m};SKY_MEMO.set(key,o);return o;}
// envFor → Licht aus dem Bild: Sonne (bzw. Mond nachts) als Richtung (Bildraum, vor Drehung), Farbe, Stärke; Hemisphäre oben/unten; Nebel/Horizont; night 0|1
function envFor(region,time){const s=skyFor(region,time);if(s._env)return s._env;const night=s.time==='nacht',L=night&&s.moon?s.moon:s.sun,st=s.stats;
 const mix=(a,b,t)=>{const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),f=x=>Math.round(((A>>x)&255)*(1-t)+((B>>x)&255)*t);return'#'+((f(16)<<16)|(f(8)<<8)|f(0)).toString(16).padStart(6,'0');};
 const sunCol=night?mix(L.col||'#c8d6ff','#8fa6ff',.55):mix(L.col,'#ffffff',s.time==='tag'?.25:.1);
 return s._env={region:s.region,time:s.time,night:night?1:0,sunDir:L.dir.slice(),sunAz:L.az,sunEl:L.el,sunCol,sunI:night?.34:s.time==='abend'?1.05:1.15,
  hemiTop:mix(st.top,'#ffffff',night?0:.18),hemiBot:mix(st.below,night?'#101420':'#6a6450',night?.4:.55),hemiI:night?.5:s.time==='abend'?.78:.82,
  fog:st.hor,horizon:st.hor,top:st.top,zenith:st.zenith,haze:s.haze,exposure:night?.92:1};}
// battleBgFor → {key,src,lo,w,h,horizonY (0 oben … 1 unten),fov,sunScreen[x,y],cam,env,ok}
function battleBgFor(region,time){[region,time]=skyNorm(region,time);const key='bg_battle_'+region+'_'+time,M=skyMeta(),m=(M&&M.battle&&M.battle[key])||{};
 const src=skySrcOf(key),lo=skySrcOf(key+'_lo');return{key,region,time,src,lo,w:m.w||1280,h:m.h||720,horizonY:m.horizonY??.6,fov:m.fov??38,sunScreen:m.sunScreen||[.5,.2],cam:m.cam||{fov:38,h:1.7,az:-90,pitch:3.5},env:envFor(region,time),ok:!!(src||lo)};}
function horizonFor(region){region=SKY_REGIONS.includes(region)?region:'lichtlande';const key='horizon_'+region,M=skyMeta(),m=(M&&M.horizon&&M.horizon[key])||{},src=skySrcOf(key),lo=skySrcOf(key+'_lo'),mo=SKY_MEMO.get(key);
 if(mo&&mo.src===src&&mo.lo===lo&&mo._m===m)return mo;const o={key,region,src,lo,tan:m.tan||[-.05,.45],haze:m.haze||'#c6d0dc',ok:!!(src||lo),_m:m};SKY_MEMO.set(key,o);return o;}

// ---------- Laufzeit (3D-Welt) ----------
const SKY3={on:false,region:null,map:null,fade:0,a:null,b:null,k:0,cache:new Map(),domes:null,ring:null,sea:null,rays:null,envDome:null,sd:null,sdOn:false,pm:null,pmKey:null,pmRT:null,envT:0,envK:-1,hz:null,hzKey:null,ringYaw:0,lastUse:0};
function skyLow(){try{return typeof perfTier==='function'&&perfTier().name==='low';}catch(e){return false;}}
// Textur laden (Bild → THREE.Texture, ohne Mipmaps; 'low' → _lo-Variante). Rückgabe: Cache-Eintrag {tex,state:'load'|'ok'|'bad'}
function skyTex(key){const lowQ=skyLow(),ck=key+(lowQ?'@lo':'');let E=SKY3.cache.get(ck);if(E){E.t=performance.now();return E;}
 const S=window.ART_SRC||{},src=lowQ?(S[key+'_lo']||S[key]):(S[key]||S[key+'_lo']);E={key,ck,tex:null,state:src?'load':'bad',t:performance.now()};SKY3.cache.set(ck,E);if(!src||!window.THREE)return E;
 const im=new Image();im.decoding='async';im.onload=()=>{// file:// o. ä. → Bild „verunreinigt“ (WebGL-Upload würde scheitern) → prozeduraler Himmel
  try{const cv=document.createElement('canvas');cv.width=cv.height=1;const x=cv.getContext('2d');x.drawImage(im,0,0,1,1);x.getImageData(0,0,1,1);}catch(e){E.state='bad';return;}
  try{const t=new THREE.Texture(im);t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;
  t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;E.tex=t;
  // QA N4: dekodieren + GPU-Upload im Leerlauf direkt nach dem Laden (vor dem Einblenden), nicht erst im ersten Render-Frame
  const up=()=>{try{const r=typeof R3!=='undefined'&&R3&&R3.r;if(r&&r.initTexture&&E.tex===t)r.initTexture(t);}catch(e){}if(E.state==='load')E.state='ok';};
  const idle=f=>{try{if(window.requestIdleCallback)return requestIdleCallback(f,{timeout:250});}catch(e){}setTimeout(f,0);};
  (im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(()=>idle(up));}catch(e){E.state='bad';}};im.onerror=()=>{E.state='bad';};im.src=src;return E;}
// Für andere Module (H2 Kampf): geteilte Textur aus dem Cache → Promise<THREE.Texture|null>; pin=true schützt vor Freigabe bis skyTextureRelease(key)
function skyTexture(key,pin){const E=skyTex(key);if(pin)E.pin=(E.pin||0)+1;return new Promise(res=>{const chk=()=>{if(E.state==='ok')res(E.tex);else if(E.state==='bad')res(null);else setTimeout(chk,40);};chk();});}
function skyTextureRelease(key){for(const E of SKY3.cache.values())if(E.key===key&&E.pin)E.pin--;}
// Nur benutzte Texturen behalten (aktuell A/B, vorgeladen, Kulisse) – Rest nach 3 s freigeben
function skyGC(keep){const nw=performance.now();for(const[k,E]of SKY3.cache){if(keep.has(E.key)||E.pin)continue;if(nw-E.t<3000)continue;if(E.tex)E.tex.dispose();SKY3.cache.delete(k);}}
const HSKY_VS='varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}';
const HSKY_FS='uniform sampler2D uTex;uniform float uOp;uniform float uYaw;uniform vec3 uTint;uniform float uGray;uniform vec3 uGrayC;uniform float uFlash;varying vec3 vD;'+
 'void main(){vec3 d=normalize(vD);float c=cos(uYaw),s=sin(uYaw);d=vec3(c*d.x+s*d.z,d.y,-s*d.x+c*d.z);'+
 'vec2 uv=vec2(atan(d.z,d.x)*.15915494+.5,asin(clamp(d.y,-1.,1.))*.31830989+.5);vec3 col=texture2D(uTex,uv).rgb*uTint;'+
 'float l=dot(col,vec3(.3,.55,.15));col=mix(col,uGrayC*(.55+.6*l),uGray);col+=vec3(.85,.9,1.)*uFlash;gl_FragColor=vec4(col,uOp);}';
function skyDomeMat(order){const m=new THREE.ShaderMaterial({uniforms:{uTex:{value:null},uOp:{value:1},uYaw:{value:0},uTint:{value:new THREE.Color(1,1,1)},uGray:{value:0},uGrayC:{value:new THREE.Color('#8a94a0')},uFlash:{value:0}},
 vertexShader:HSKY_VS,fragmentShader:HSKY_FS,side:THREE.BackSide,depthWrite:false,depthTest:true,transparent:order>0,fog:false});return m;}
// Horizont-Ring (Zylinder um die Kamera, Abbildung tan(Höhe) wie im Render), weit hinten (xyww) → jede Geometrie verdeckt ihn
const HRING_FS='uniform sampler2D uTex;uniform float uOp;uniform float uYaw;uniform vec2 uTan;uniform vec3 uTint;uniform vec3 uFog;uniform float uFogK;varying vec3 vD;'+
 'void main(){vec3 d=vD;float r=length(d.xz);float t=d.y/max(r,1e-4);float v=(t-uTan.x)/(uTan.y-uTan.x);if(v<0.||v>1.)discard;'+
 'float u=atan(d.z,d.x)*.15915494+.5+uYaw*.15915494;vec4 c=texture2D(uTex,vec2(u,v));if(c.a<.01)discard;vec3 col=mix(c.rgb*uTint,uFog,clamp(uFogK+(1.-smoothstep(.04,.3,v))*.35,0.,1.));gl_FragColor=vec4(col,c.a*uOp);}';
// Wolkenmeer / Dunstteppich: große Ebene, Weltkoordinaten-Wolkentextur (driftet), außerhalb der Karte eingeblendet, unter schwebenden Karten überall
const HSEA_VS='varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const HSEA_FS='uniform sampler2D uTex;uniform float uT;uniform vec4 uBox;uniform float uAll;uniform float uOp;uniform vec3 uLit;uniform vec3 uShd;uniform vec3 uFog;uniform vec2 uSun;varying vec3 vW;'+
 'void main(){vec2 p=vW.xz;vec2 q=p*.018+vec2(uT*.004,uT*.0017);float n=texture2D(uTex,q).r*.62+texture2D(uTex,q*2.7+vec2(.31,-uT*.003)).g*.38;'+
 'float n2=texture2D(uTex,q+uSun*.012).r*.62+texture2D(uTex,(q+uSun*.012)*2.7+vec2(.31,-uT*.003)).g*.38;'+
 'vec2 o=max(abs(p-uBox.xy)-uBox.zw,0.);float od=length(o);float a=max(uAll,smoothstep(1.5,7.,od));'+
 'float dc=length(vW-cameraPosition);a*=smoothstep(.36,.62,n)*(1.-smoothstep(70.,104.,dc))*uOp;if(a<.004)discard;'+
 'float lit=clamp(.55+(n-n2)*5.+(n-.5)*.6,0.,1.);vec3 c=mix(uShd,uLit,lit);c=mix(c,uFog,smoothstep(25.,95.,dc)*.7);gl_FragColor=vec4(c,a);}';
// Sonnenstrahlen: N lange Fächer-Quads um die Sonne (Bildschirm-Ebene), additiv, nur am Himmel
const HRAY_VS='attribute vec4 aR;uniform vec3 uSun;uniform float uT;varying float vA;varying vec2 vQ;'+
 'void main(){vec3 C=cameraPosition+uSun*60.;vec3 R=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),U=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);'+
 'float a=aR.x+sin(uT*.07+aR.w*6.)*.05;vec3 dir=R*cos(a)+U*sin(a),per=R*-sin(a)+U*cos(a);float L=aR.y;vec3 P=C+dir*(position.y*L)+per*(position.x*aR.z*(.3+position.y));'+
 'vQ=position.xy;vA=.55+.45*sin(uT*.31+aR.w*17.);vec4 p=projectionMatrix*viewMatrix*vec4(P,1.);gl_Position=p.xyww;}';
const HRAY_FS='uniform float uOp;uniform vec3 uCol;varying float vA;varying vec2 vQ;void main(){float f=(1.-vQ.y);f*=f;float e=1.-abs(vQ.x)*2.;e=e*e;gl_FragColor=vec4(uCol*f*e*vA*uOp,1.);}';
// Dunstteppich-Geometrie: Rahmen um die Karte (innen frei → keine Pixelkosten über der Spielfläche); ix=iz=0 → volle Ebene (schwebende Karten)
function skySeaGeo(ix,iz){const O=130,g=new THREE.BufferGeometry();if(!ix){const p=new THREE.PlaneGeometry(O*2,O*2,1,1);p.rotateX(-Math.PI/2);return p;}
 const v=[-O,-O,O,-O,O,O,-O,O,-ix,-iz,ix,-iz,ix,iz,-ix,iz],P=[];for(let i=0;i<8;i++)P.push(v[i*2],0,v[i*2+1]);g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 g.setIndex([0,4,1,1,4,5,1,5,2,2,5,6,2,6,3,3,6,7,3,7,0,0,7,4]);return g;}
function skyBuild(){if(SKY3.domes||!window.THREE)return;const g=new THREE.SphereGeometry(70,48,24);
 SKY3.domes=[0,1].map(i=>{const m=new THREE.Mesh(g,skyDomeMat(i));m.renderOrder=-12+i;m.frustumCulled=false;m.visible=false;m.name='skyDome'+i;return m;});
 SKY3.envDome=new THREE.Mesh(g,SKY3.domes[0].material);SKY3.envDome.frustumCulled=false;
 const rg=new THREE.CylinderGeometry(60,60,40,64,1,true);rg.translate(0,13,0);
 SKY3.ring=new THREE.Mesh(rg,new THREE.ShaderMaterial({uniforms:{uTex:{value:null},uOp:{value:0},uYaw:{value:0},uTan:{value:new THREE.Vector2(-.05,.45)},uTint:{value:new THREE.Color(1,1,1)},uFog:{value:new THREE.Color()},uFogK:{value:.2}},
  vertexShader:HSKY_VS,fragmentShader:HRING_FS,side:THREE.BackSide,depthWrite:false,transparent:true,fog:false}));SKY3.ring.renderOrder=-10;SKY3.ring.frustumCulled=false;SKY3.ring.visible=false;SKY3.ring.name='skyRing';
 const sg=new THREE.PlaneGeometry(260,260,1,1);sg.rotateX(-Math.PI/2);
 SKY3.sea=new THREE.Mesh(sg,new THREE.ShaderMaterial({uniforms:{uTex:{value:typeof w3texCloud==='function'?w3texCloud():null},uT:{value:0},uBox:{value:new THREE.Vector4()},uAll:{value:0},uOp:{value:0},uLit:{value:new THREE.Color('#ffffff')},uShd:{value:new THREE.Color('#b0b4c8')},uFog:{value:new THREE.Color()},uSun:{value:new THREE.Vector2(1,0)}},
  vertexShader:HSEA_VS,fragmentShader:HSEA_FS,depthWrite:false,transparent:true,fog:false,side:THREE.DoubleSide}));SKY3.sea.renderOrder=2;SKY3.sea.frustumCulled=false;SKY3.sea.visible=false;SKY3.sea.name='skySea';
 {const N=12,pos=[],ar=[],idx=[];for(let i=0;i<N;i++){const b=i*4;pos.push(-.5,0,0,.5,0,0,.5,1,0,-.5,1,0);const a=i/N*Math.PI*2+Math.sin(i*7.3)*.2,L=26+((i*37)%11)*2.6,w=1.2+((i*13)%5)*.5,s=(i*.618)%1;for(let k=0;k<4;k++)ar.push(a,L,w,s);idx.push(b,b+1,b+2,b,b+2,b+3);}
  const rgeo=new THREE.BufferGeometry();rgeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));rgeo.setAttribute('aR',new THREE.Float32BufferAttribute(ar,4));rgeo.setIndex(idx);
  SKY3.rays=new THREE.Mesh(rgeo,new THREE.ShaderMaterial({uniforms:{uSun:{value:new THREE.Vector3(0,1,0)},uT:{value:0},uOp:{value:0},uCol:{value:new THREE.Color('#fff0d0')}},vertexShader:HRAY_VS,fragmentShader:HRAY_FS,
   depthWrite:false,transparent:true,blending:THREE.AdditiveBlending,fog:false,side:THREE.DoubleSide}));SKY3.rays.renderOrder=-9;SKY3.rays.frustumCulled=false;SKY3.rays.visible=false;SKY3.rays.name='skyRays';SKY3.rayN=N;}
 SKY3.sd=new THREE.Vector3(0,1,0);SKY3.c1=new THREE.Color();SKY3.c2=new THREE.Color();SKY3.c3=new THREE.Color();SKY3.v1=new THREE.Vector3();SKY3.v2=new THREE.Vector3();}
// Beim Kartenwechsel: Objekte in die Szene hängen, Region bestimmen, ggf. Überblendung neu starten
function skyAttach(S,m){if(!window.THREE)return;skyBuild();if(!SKY3.domes)return;const reg=skyRegion(m);
 [...SKY3.domes,SKY3.ring,SKY3.sea,SKY3.rays].forEach(o=>S.add(o));
 if(reg!==SKY3.region){SKY3.region=reg;SKY3.fade=0;SKY3.fT0=0;SKY3.a=SKY3.b=null;SKY3.pmKey=null;}SKY3.map=m;SKY3.ringYaw=skyRingYaw(m);
 const out=!m.inside;const fl=m.float||m.theme==='sky'||m.theme==='cloud'||reg==='himmelsweiten';SKY3.seaAll=fl?1:0;SKY3.seaY=fl?-7:m.theme==='beach'?.9:.62;
 SKY3.sea.geometry.dispose();SKY3.sea.geometry=skySeaGeo(fl?0:m.w/2+1,fl?0:m.h/2+1);SKY3.sea.position.set(m.w/2,SKY3.seaY,m.h/2);SKY3.sea.material.uniforms.uBox.value.set(m.w/2,m.h/2,m.w/2,m.h/2);SKY3.sea.material.uniforms.uAll.value=SKY3.seaAll;
 const E=typeof R3!=='undefined'&&R3&&R3.env;if(E&&E.scene&&!E.scene.children.includes(SKY3.envDome)){E.scene.add(SKY3.envDome);}
 if(S.environment&&SKY3.pmRT&&S.environment!==SKY3.pmRT.texture)S.environment=null;SKY3.envK=-1;
 // prozedurale Fernberge (09, Material userData.mtn): bei sichtbarer Kulisse ausblenden – die gerenderte Kulisse ersetzt sie (sonst „blasse Kuppeln“ vor den Silhouetten)
 if(!S.userData.skyMtn){S.userData.skyMtn=[];const mm=S.userData.mtn;if(mm)S.traverse(o=>{if(o.isMesh&&o.material===mm)S.userData.skyMtn.push(o);});}}
function skyMtnShow(S){const mt=S&&S.userData&&S.userData.skyMtn;if(mt)for(const o of mt)o.visible=true;}
function skyEnvShow(on){const E=typeof R3!=='undefined'&&R3&&R3.env;if(SKY3.envDome)SKY3.envDome.visible=on;if(E&&E.scene&&E.scene.children[0]&&E.scene.children[0]!==SKY3.envDome)E.scene.children[0].visible=!on;}
function skyActive(){return!!(SKY3.on&&SKY3.fade>=1);}
// Spiel-Sonne/-Mond (wie 09): Azimut für die Drehung der Skybox
function skyGameAz(h,moon){const ang=Math.PI*((h-6)/12);const x=(moon?-1:1)*Math.cos(ang)*11,z=5.5;return Math.atan2(z,x);}
// Drehung, damit die Bild-Sonne (bzw. nachts der Mond) im Azimut der Spiel-Sonne steht: Welt-Azimut = Bild-Azimut + yaw
function skyYawFor(info,h){const night=info.time==='nacht'&&info.moon,b=night?info.moon:info.sun;const want=skyGameAz(h,!!night);return want-b.az*Math.PI/180;}
function skyRot(v,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);return[c*v[0]-s*v[2],v[1],s*v[0]+c*v[2]];}
// Pro Frame (nach dem Licht in draw3d): Überblendung, Licht aus dem Bild, Kulisse, Wolkenmeer, Strahlen
function skyFrame(S,O,c){if(!SKY3.domes)return;const D=SKY3.domes,out=!c.inside&&!c.encl,h=c.h,dt=c.dt||.016,T=typeof perfTier==='function'?perfTier():{name:'high',part:1};
 if(!out){SKY3.on=false;D[0].visible=D[1].visible=SKY3.ring.visible=SKY3.sea.visible=SKY3.rays.visible=false;SKY3.sdOn=false;skyEnvShow(false);skyMtnShow(S);return;}
 const reg=SKY3.region||'lichtlande',B=skyBlend(h),ia=skyFor(reg,B.a),ib=skyFor(reg,B.b);
 const ea=skyTex(ia.key),eb=B.k>0?skyTex(ib.key):null,keep=SKY3.keep||(SKY3.keep=new Set());keep.clear();keep.add(ia.key);keep.add(ib.key);
 // Vorladen: nächstes Bild im Plan, sobald es in ≤ 1 Spielstunde gebraucht wird
 {const nx=skyBlend(h+1);if(nx.b!==B.b||nx.a!==B.a){const kn=skyFor(reg,nx.k>0?nx.b:nx.a).key;keep.add(kn);skyTex(kn);}}
 const hz=horizonFor(reg);keep.add(hz.key);const eh=hz.ok?skyTex(hz.key):null;
 if((SKY3.gcT=(SKY3.gcT||0)+dt)>2){SKY3.gcT=0;skyGC(keep);}
 if(ea.state!=='ok'||!ia.ok){SKY3.on=false;D[0].visible=D[1].visible=SKY3.ring.visible=SKY3.rays.visible=false;SKY3.sdOn=false;skyEnvShow(false);skyMtnShow(S);skySea(S,O,c,null,T);return;}
 SKY3.on=true;const nw0=performance.now();if(!SKY3.fade||!SKY3.fT0)SKY3.fT0=nw0-SKY3.fade*800;SKY3.fade=Math.min(1,Math.max(SKY3.fade,(nw0-SKY3.fT0)/800,.001));const bOk=eb&&eb.state==='ok',k=bOk?B.k:0,f=SKY3.fade;
 // Kuppel A (deckend; während des Einblendens transparent über dem prozeduralen Himmel) und B (Überblendung)
 const yA=skyYawFor(ia,h),yB=skyYawFor(ib,h),gray=c.gray||0,ua=D[0].material.uniforms,ub=D[1].material.uniforms;
 D[0].material.transparent=f<1;ua.uTex.value=ea.tex;ua.uOp.value=f;ua.uYaw.value=yA;D[0].visible=true;
 D[1].visible=k>.002;if(D[1].visible){ub.uTex.value=eb.tex;ub.uOp.value=k*f;ub.uYaw.value=yB;}
 for(const u of[ua,ub]){u.uGray.value=gray*.85;u.uGrayC.value.copy(c.col||SKY3.c1.set('#8a94a0'));u.uFlash.value=(c.fl||0)*.5;}
 {const E=R3&&R3.env;if(E&&E.scene&&!E.scene.children.includes(SKY3.envDome))E.scene.add(SKY3.envDome);}skyEnvShow(true);
 // Licht aus dem Bild: Umgebung A/B mischen (Toon: Hemisphäre; Standard: PMREM-envMap)
 const A=envFor(reg,B.a),Bn=envFor(reg,B.b),C1=SKY3.c1,C2=SKY3.c2,lw=(c.lset?.3:.75)*f*(1-gray*.5);
 const mixC=(ka,kb,dst)=>dst.set(A[ka]).lerp(C2.set(Bn[kb]),k);
 R3.hemi.color.lerp(mixC('hemiTop','hemiTop',C1),lw);R3.hemi.groundColor.lerp(mixC('hemiBot','hemiBot',C1),lw*.8);
 R3.hemi.intensity+=((A.hemiI+(Bn.hemiI-A.hemiI)*k)*(1-gray*.3)-R3.hemi.intensity)*lw*.6;
 R3.sun.color.lerp(mixC('sunCol','sunCol',C1),lw*.8);
 if(!c.lset)R3.sun.intensity+=((A.sunI+(Bn.sunI-A.sunI)*k)*(1-gray*.6)*(O.sunI>0?1:0)+(c.fl||0)*.8-R3.sun.intensity)*.5*f;
 if(S.fog){mixC('fog','fog',C1);if(gray)C1.lerp(SKY3.c3.copy(c.col),gray*.7);S.fog.color.lerp(C1,lw*.8);if(S.background&&S.background.isColor)S.background.copy(S.fog.color);}
 // Sonnenrichtung (Schatten) aus dem Bild: Bildrichtung gedreht, A/B gemischt
 {const da=skyRot(A.sunDir,yA),db=skyRot(Bn.sunDir,yB),v=SKY3.v1.set(da[0],da[1],da[2]).lerp(SKY3.v2.set(db[0],db[1],db[2]),k).normalize();
  // Licht nie flacher als ≈ 14° (Lesbarkeit: Abendsonne im Bild 6,5° würde den Boden fast nur streifen)
  if(v.y<.24){const q=Math.sqrt((1-.24*.24)/Math.max(1e-6,v.x*v.x+v.z*v.z));v.x*=q;v.z*=q;v.y=.24;}SKY3.sd.copy(v);SKY3.sdOn=!c.lset;}
 // envMap (nur mid/high, nur bei Wechsel des dominanten Bildes)
 const dom=k<.5?ea:eb;if(T.name!=='low'&&dom&&dom.tex&&SKY3.pmKey!==dom.ck&&R3&&R3.r){try{if(!SKY3.pm)SKY3.pm=new THREE.PMREMGenerator(R3.r);const rt=SKY3.pm.fromEquirectangular(dom.tex);if(SKY3.pmRT)SKY3.pmRT.dispose();SKY3.pmRT=rt;SKY3.pmKey=dom.ck;}catch(e){SKY3.pmKey=dom.ck;SKY3.pmRT=null;}}
 if(SKY3.pmRT&&T.name!=='low')S.environment=SKY3.pmRT.texture;else if(S.environment)S.environment=null;
 // Spiegel-Cubemap (09 w3Env) bei Bildwechsel/Überblendung nachziehen (gedrosselt)
 {const nw=performance.now(),key=ia.key+'|'+(D[1].visible?ib.key:'')+'|'+Math.round(k*8)+'|'+(f>=1?1:0);if(key!==SKY3.envK&&nw-SKY3.envT>1200&&typeof w3Env==='function'){SKY3.envK=key;SKY3.envT=nw;try{w3Env(1);}catch(e){}}}
 // Horizont-Kulisse: Tönung nach Tageszeit (Tag neutral, Abend warm, Nacht dunkel), Nebelanteil = atmosphärische Perspektive
 {const R=SKY3.ring,u=R.material.uniforms;const mt=S.userData.skyMtn;if(mt)for(const o of mt)o.visible=!(eh&&eh.state==='ok'&&f>=1);if(eh&&eh.state==='ok'){R.visible=true;u.uTex.value=eh.tex;u.uTan.value.set(hz.tan[0],hz.tan[1]);u.uYaw.value=SKY3.ringYaw;u.uOp.value=f;
   const tint=t=>t==='nacht'?'#3a4466':t==='abend'?'#f2c8a8':'#ffffff';u.uTint.value.set(tint(B.a)).lerp(C2.set(tint(B.b)),k).lerp(SKY3.c3.copy(c.col||C2),gray*.6);
   u.uFog.value.copy(S.fog?S.fog.color:C1);const fk=t=>t==='nacht'?.42:t==='abend'?.3:.2;u.uFogK.value=fk(B.a)+(fk(B.b)-fk(B.a))*k+gray*.3;}else R.visible=false;}
 // Sonnenstrahlen (Menge nach Stufe), nur bei sichtbarer Sonne über dem Horizont
 {const Rm=SKY3.rays,u=Rm.material.uniforms,n=T.name==='high'?SKY3.rayN:T.name==='mid'?7:0,sv=Math.max(0,Math.min(1,SKY3.sd.y*5-.1))*(1-k*(B.b==='nacht'?1:0))*(B.a==='nacht'?k*(B.b!=='nacht'?1:0):1)*(1-gray);
  Rm.visible=n>0&&sv>.02&&f>0;if(Rm.visible){Rm.geometry.setDrawRange(0,n*6);u.uSun.value.copy(SKY3.sd);u.uT.value=(c.now||0)/1000;u.uOp.value=sv*f*(B.a==='abend'||B.b==='abend'?.2:.12)*(T.part||1);u.uCol.value.copy(R3.sun.color);}}
 skySea(S,O,c,{A,Bn,k,f},T);}
function skySea(S,O,c,L,T){const M=SKY3.sea;if(!M)return;const u=M.material.uniforms,m=SKY3.map;if(!m||m.inside){M.visible=false;return;}
 const op=(SKY3.seaAll?.95:m.theme==='beach'?.4:.62)*(1-(c.gray||0)*.4)*(T&&T.name==='low'&&!SKY3.seaAll?0:1);M.visible=op>.01;if(!M.visible)return;
 u.uT.value=(c.now||0)/1000;u.uOp.value=op*(L?Math.max(.4,L.f):.7);const fc=S.fog?S.fog.color:SKY3.c1.set('#dde4ea');u.uFog.value.copy(fc);
 if(L){const C=SKY3.c3;u.uLit.value.set(L.A.top).lerp(C.set(L.Bn.top),L.k).lerp(C.set('#ffffff'),L.A.night?.15:.62).lerp(fc,.25);u.uShd.value.copy(u.uLit.value).multiplyScalar(.72).lerp(fc,.3);}
 else{u.uLit.value.copy(fc).lerp(SKY3.c3.set('#ffffff'),.4);u.uShd.value.copy(fc).multiplyScalar(.8);}
 if(SKY3.sd)u.uSun.value.set(SKY3.sd.x,SKY3.sd.z).normalize();}
// Vor dem Rendern: alles kamerazentriert (Unendlich-Wirkung)
function skyCam(cam){if(!SKY3.domes||!cam)return;for(const d of SKY3.domes)d.position.copy(cam.position);SKY3.ring.position.copy(cam.position);SKY3.rays.position.copy(cam.position);}
