// ===== VEYRA – 3D-Kreaturen: Neuentwurf im Anime-Monster-Illustrationsstil (prozedural, Cel-Shading 2 Stufen) =====
// Datenformat MONS[id].sp = [Altform (2D/Rufe), Farbe 1, Farbe 2, Merkmale[], Größe, Signaturfarbe, Körpertyp, Feinmaße{v,h,l,w,len,n,t,hk,bk,rise}]
// Körpertypen (16): hound cat hoof rodent turtle · blob plant pebble · ghost lantern jelly seahorse · serpent golem biped bird
// DESIGN[Kanon-ID] = Konzept · Silhouette · Farben · Signaturmerkmal · Pose – nur für Arten OHNE verbindliche Illustration (Fallback-Nachbau) und Legenden-Nachbauten in 3D;
// Arten mit Bild (public/art) richten sich nach dem Bild (Sprite-Modus, s. Ende der Datei). Alles eigene Entwürfe.
const DESIGN={
 2:{konzept:'Jungwolf + Blasebalg',silhouette:'Hund gestreckt, Wolfsschnauze',farben:'Orange/Creme + Gelb',merkmal:'Flammenkragen um den Hals, Kerzenschweif größer',pose:'Gewicht vorn, Ohren gespitzt, frech'},
 3:{konzept:'Vulkanwolf + Basaltsäulen',silhouette:'großer Hund, breite Brust, Hörner nach hinten',farben:'Rotorange/Creme + Lavagelb (Basalt dunkel)',merkmal:'Basaltplatten mit glühenden Fugen, Flammenmähne',pose:'stolz, Kinn hoch, ruhig gefährlich'},
 5:{konzept:'Molch + Strudel',silhouette:'flache Schlange mit Rückenkamm',farben:'Blau/Weißblau + Rosa-Kiemen',merkmal:'rosa Kiemenwedel, Wasserring um den Schweif',pose:'aufgerichtet, Kopf schief, verspielt'},
 6:{konzept:'Tiefseedrache + Anglerlaterne',silhouette:'hoch aufgerichteter Seedrache mit Kiefer',farben:'Nachtblau/Eisblau + Leuchtcyan',merkmal:'Laternen-Köder an der Stirn, Kiemenkranz',pose:'drohend gebogen, Blick von oben'},
 60:{konzept:'Adler + Wetterfahne',silhouette:'Greifvogel mit langem Schwanz und Federpfeil',farben:'Braun/Creme + Orange',merkmal:'Wetterfahnen-Federkamm',pose:'Brust raus, Flügel halb offen'},
 112:{konzept:'Biber + Holzhobel',silhouette:'rundlicher Nager, flacher Kellenschwanz',farben:'Nussbraun/Creme + Weiß',merkmal:'große Nagezähne, Kellenschwanz',pose:'sitzt rund, Pfoten vor der Brust'},
 113:{konzept:'Nachtratte + Dietrich',silhouette:'schlanker Nager, Schlüsselschweif',farben:'Pflaumengrau/Flieder + Gold',merkmal:'Schweif endet in Schlüsselbart',pose:'geduckt, verschlagenes Grinsen'},
 58:{konzept:'Gürteltier + Felsbrocken',silhouette:'Felsgolem mit Panzerbändern',farben:'Erdbraun/Sand + Bernstein',merkmal:'Panzerbänder auf dem Rücken',pose:'breitbeinig, Fäuste unten'},
 62:{konzept:'Paradiesvogel + Kronleuchter',silhouette:'Greifvogel mit Strahlenkrone und Laternenfedern',farben:'Gold/Creme + Licht',merkmal:'Schweiffedern mit Laternen',pose:'Flügel offen, strahlend'},
 142:{konzept:'Phönix + Sonnenuhr',silhouette:'Riesenvogel mit Strahlenscheibe',farben:'Sonnengold/Hellgelb + Glutrot',merkmal:'Sonnenscheibe im Rücken, Flammenfedern',pose:'Flügel weit, majestätisch'},
 147:{konzept:'Noctyra – Mondfuchs, Hüterin der Nacht (Key-Art)',silhouette:'schlanker Fuchs mit mehreren schwebenden Schweifen',farben:'Nachtviolett/Lavendel + Mondsilber',merkmal:'Mondsichel, Sternenschleier-Schweife',pose:'aufrecht auf dem Fels, Blick zum Mond'},
 144:{konzept:'Aetherion – Himmelsgreif (Key-Art)',silhouette:'Greif mit riesigen kristallschimmernden Schwingen',farben:'Himmelblau/Weiß + Gold',merkmal:'Kristallfedern, Sturmkrone',pose:'Flügel weit, auf dem Gipfel'},
 115:{konzept:'Fink + Glühbirne',silhouette:'kleiner Rundvogel mit Birnenkamm',farben:'Gelb/Anthrazit + Glühweiß',merkmal:'Glühbirnen-Kamm',pose:'hüpfbereit, Kopf schief'},
 117:{konzept:'Eule + Taschenuhr',silhouette:'runde Eule mit Federohren',farben:'Dämmerviolett/Flieder + Gelb',merkmal:'Zifferblatt-Gesicht',pose:'Kopf stark geneigt, wachsam'},
 122:{konzept:'Himmelsdrache + Papierdrachen',silhouette:'langer schwebender Drache mit Schleifenschweif',farben:'Wolkenweiß/Gold + Himmelblau',merkmal:'Drachenschnur-Schleifen, Wolkenmähne',pose:'schwebt in S-Kurve, freundlich'}};
const M3={mats:{},tex:{}},G3={};
const LOC={hound:'quad',cat:'quad',hoof:'quad',rodent:'quad',turtle:'quad',bear:'quad',dillo:'quad',seal:'blob',bearsit:'blob',bunny:'float',blob:'blob',plant:'blob',pebble:'blob',ghost:'float',lantern:'float',jelly:'float',seahorse:'float',serpent:'serpent',golem:'golem',biped:'biped',bird:'bird'};
const BASEH={quad:1.25,blob:1.0,bird:1.36,biped:1.7,serpent:1.25,golem:1.42,float:1.1};
function prng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function bodyOf(M){return M.sp[6]||({quad:'hound',blob:'blob',bird:'bird',biped:'biped',serpent:'serpent',golem:'golem'})[M.sp[0]]||'blob';}
// ---------- Cel-Look: 2-stufige Verlaufskarte, Rim-Light, harter Glanzfleck ----------
let MGRAD=null;function monGrad(){if(MGRAD)return MGRAD;MGRAD=new THREE.DataTexture(new Uint8Array([108,108,108,255,212,212,212,255]),2,1,THREE.RGBAFormat);MGRAD.minFilter=MGRAD.magFilter=THREE.NearestFilter;MGRAD.generateMipmaps=false;MGRAD.needsUpdate=true;return MGRAD;}
const MRIM={value:new THREE.Color('#fff4e0')},MRIMK={value:.15};
function celMat(hl,em,ei){const m=new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,gradientMap:monGrad()});if(em){m.emissive.set(em).multiplyScalar(ei||.4);}m.userData.e0=m.emissive.clone();
 const U={uMR:MRIM,uMK:MRIMK,uHL:{value:hl}};m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.fragmentShader='uniform vec3 uMR;uniform float uMK;uniform float uHL;\n'+sh.fragmentShader.replace('#include <dithering_fragment>',
  '#include <dithering_fragment>\n{vec3 V=normalize(vViewPosition);float rf=1.0-clamp(dot(normal,V),0.0,1.0);float rd=clamp(dot(normal,normalize(vec3(.75,.45,-.1)))+.25,0.0,1.0);gl_FragColor.rgb+=uMR*uMK*smoothstep(.56,.66,rf)*rd;\nfloat sp=dot(normal,normalize(normalize(vec3(-.4,.62,.68))+V));\n#if NUM_DIR_LIGHTS > 0\nfloat dl=dot(normal,directionalLights[0].direction);gl_FragColor.rgb*=mix(vec3(.84,.84,.97),vec3(1.0),step(0.0,dl));\n#endif\nfloat lu=dot(gl_FragColor.rgb,vec3(.299,.587,.114));gl_FragColor.rgb=mix(vec3(lu),gl_FragColor.rgb,1.32);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.0),uHL*smoothstep(.982,.987,sp));}');};
 m.customProgramCacheKey=()=>'cel2';return m;}
function bmat(col,o){const k='b'+col+JSON.stringify(o||{});return M3.mats[k]||(M3.mats[k]=new THREE.MeshBasicMaterial(Object.assign({color:col},o||{})));}
function mixC(a,b,t){return'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();}
// Flamme: zweistufig (Kern hell, Rand kräftig), ohne weichen Verlauf
function flameMat(a,b){const k='fl'+a+b;return M3.mats[k]||(M3.mats[k]=new THREE.ShaderMaterial({uniforms:{a:{value:new THREE.Color(a)},b:{value:new THREE.Color(b)}},
 vertexShader:'varying float vY;varying vec3 vN;varying vec3 vV;void main(){vY=position.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 a;uniform vec3 b;varying float vY;varying vec3 vN;varying vec3 vV;void main(){float f=dot(normalize(vN),vV);float c=step(.55,f)*step(vY,.62);gl_FragColor=vec4(mix(a,b,c),1.);}'}));}
// Outline (Altbestand, wird auch von 09 genutzt – unverändert lassen)
function olMat(col){const k='ol'+col;return M3.mats[k]||(M3.mats[k]=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{c:{value:new THREE.Color(col)}},
 vertexShader:'void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);mv.xyz+=n*clamp(-mv.z*.0032,.0025,.035);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 c;void main(){gl_FragColor=vec4(c,1.);}'}));}
// Kreaturen-Outline: ≈1,6× kräftiger, gleichmäßig im Bildraum
function monOl(col){const k='mol'+col;return M3.mats[k]||(M3.mats[k]=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{c:{value:new THREE.Color(col)}},
 vertexShader:'void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);mv.xyz+=n*clamp(-mv.z*.0052,.004,.056);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 c;void main(){gl_FragColor=vec4(c,1.);}'}));}
// ---------- Geometrie-Werkzeuge (alle gecacht) ----------
function gc(k,f){return G3[k]||(G3[k]=f());}
function sph(){return gc('s',()=>new THREE.SphereGeometry(1,22,16));}
function sphLo(){return gc('slo',()=>{const g=new THREE.IcosahedronGeometry(1,1);g.computeVertexNormals();return g;});}
function hemi(){return gc('hm',()=>new THREE.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2));}
function coneG(n){return gc('cn'+n,()=>{const g=new THREE.ConeGeometry(1,1,n||10);g.translate(0,.5,0);return g;});}
function cylG(n){return gc('cy'+n,()=>{const g=new THREE.CylinderGeometry(1,1,1,n||14);g.translate(0,.5,0);return g;});}
function torG(t,arc){return gc('to'+t+'_'+(arc||7),()=>new THREE.TorusGeometry(1,t,8,36,arc||Math.PI*2));}
function crystalG(){return gc('cry',()=>{const a=new THREE.CylinderGeometry(.42,.5,.75,6),b=new THREE.ConeGeometry(.42,.5,6);a.translate(0,.375,0);b.translate(0,1,0);const g=mergeG([[a,I4],[b,I4]]).toNonIndexed();g.computeVertexNormals();return g;});}
const I4=new THREE.Matrix4();
function mtx(p,r,s){const sc=s===undefined?[1,1,1]:typeof s==='number'?[s,s,s]:s;return new THREE.Matrix4().compose(new THREE.Vector3(p[0],p[1],p[2]),new THREE.Quaternion().setFromEuler(new THREE.Euler(r?r[0]:0,r?r[1]:0,r?r[2]:0)),new THREE.Vector3(sc[0],sc[1],sc[2]));}
// Weiche, verjüngte Röhre entlang Stützpunkten (Hals, Glieder, Hörner, Strähnen, Schwanz)
function tubeG(pts,rad,rs){const key='t'+JSON.stringify([pts,rad,rs]).replace(/(\.\d{4})\d+/g,'$1');if(G3[key])return G3[key];
 const cv=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2]))),N=Math.max(6,pts.length*4),seg=rs||10,fr=cv.computeFrenetFrames(N,false);
 const R=u=>{const f=u*(rad.length-1),i=Math.min(rad.length-2,Math.floor(f)),t=f-i;return rad[i]+(rad[i+1]-rad[i])*t;},rings=[],r0=R(0),r1=R(1);
 const P0=cv.getPointAt(0),P1=cv.getPointAt(1);
 for(let k=3;k>=1;k--){const f=k/3*Math.PI/2;rings.push([P0.clone().addScaledVector(fr.tangents[0],-r0*Math.sin(f)),r0*Math.cos(f),0,Math.cos(f),-Math.sin(f)]);}
 for(let i=0;i<=N;i++)rings.push([cv.getPointAt(i/N),R(i/N),i,1,0]);
 if(r1>.002)for(let k=1;k<=3;k++){const f=k/3*Math.PI/2;rings.push([P1.clone().addScaledVector(fr.tangents[N],r1*Math.sin(f)),r1*Math.cos(f),N,Math.cos(f),Math.sin(f)]);}
 const pos=[],nor=[],uv=[],idx=[],v=new THREE.Vector3(),q=new THREE.Vector3();
 rings.forEach(([c,r,i,nc,ns],ri)=>{const n=fr.normals[i],b=fr.binormals[i],T=fr.tangents[i];
  for(let j=0;j<=seg;j++){const a=j/seg*Math.PI*2;v.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(b,Math.sin(a));pos.push(c.x+v.x*r,c.y+v.y*r,c.z+v.z*r);
   q.copy(v).multiplyScalar(nc).addScaledVector(T,ns).normalize();nor.push(q.x,q.y,q.z);uv.push(j/seg,ri/(rings.length-1));}});
 for(let ri=0;ri<rings.length-1;ri++)for(let j=0;j<seg;j++){const a=ri*(seg+1)+j,b2=a+seg+1;idx.push(a,a+1,b2,b2,a+1,b2+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return G3[key]=g;}
// Mehrere Teile zu einer Geometrie verschmelzen (spart Draw-Calls); Vertex-Farben je Teil
function mergeG(parts){const P=[],N=[],T=[],C=[],I=[],v=new THREE.Vector3(),nm=new THREE.Matrix3(),hc=parts.some(p=>p[2]);let o=0;
 for(const[g,m,col]of parts){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,cc=new THREE.Color(col||'#ffffff');nm.getNormalMatrix(m);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);T.push(uv?uv.getX(i):0,uv?uv.getY(i):0);if(hc)C.push(cc.r,cc.g,cc.b);}
  if(g.index)for(let i=0;i<g.index.count;i++)I.push(g.index.getX(i)+o);else for(let i=0;i<p.count;i++)I.push(i+o);o+=p.count;}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));G.setAttribute('uv',new THREE.Float32BufferAttribute(T,2));
 if(hc)G.setAttribute('color',new THREE.Float32BufferAttribute(C,3));G.setIndex(I);return G;}
function blobG(n){n=n||28;return gc('blob'+n,()=>{const p=[];for(let i=0;i<=20;i++){const f=-Math.PI/2+i/20*Math.PI,s=Math.sin(f),x=.5*Math.cos(f)*(1+.07*Math.max(0,-s)+.04*Math.cos(f));p.push(new THREE.Vector2(Math.max(.0001,x),.3+(s<0?.3:.56)*s));}return new THREE.LatheGeometry(n<20?p.filter((q,i)=>i%2===0):p,n);});}
function flameG(){return gc('flame4',()=>{const one=()=>{const p=[];for(let i=0;i<=8;i++){const t=i/8;p.push(new THREE.Vector2(Math.max(.0001,.5*Math.sin(Math.PI*Math.pow(t,.55))*(1-t*.3)),t));}return new THREE.LatheGeometry(p,9);},a=one();
 return mergeG([[a,I4],[a,mtx([.2,.02,.05],[0,0,-.5],[.55,.62,.55])],[a,mtx([-.18,.02,-.06],[0,0,.55],[.5,.55,.5])]]);});}
function ext(shape,d){const g=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:d*.6,bevelSize:d*.6,bevelSegments:1,curveSegments:6});g.translate(0,0,-d/2);g.computeVertexNormals();return g;}
// Blatt: gewölbte Fläche mit Mittelrippe, sparsam (≈20 Dreiecke)
function leafG(){return gc('leaf2',()=>{const P=[[0,0],[.3,.18],[.42,.45],[.32,.75],[0,1],[-.32,.75],[-.42,.45],[-.3,.18]],pos=[0,.5,.05,0,.5,-.05],idx=[];P.forEach(([x,y])=>pos.push(x,y,-Math.abs(x)*.12));
 for(let i=0;i<8;i++){const a=2+i,b=2+(i+1)%8;idx.push(0,a,b,1,b,a);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;});}
function finG(){return gc('fin',()=>{const s=new THREE.Shape();s.moveTo(-.5,0);s.quadraticCurveTo(-.15,.62,.5,1);s.quadraticCurveTo(.3,.5,.55,.04);s.quadraticCurveTo(0,-.08,-.5,0);return ext(s,.05);});}
function boltG(){return gc('bolt',()=>{const s=new THREE.Shape();[[0,0],[.5,.9],[.2,.95],[.6,1.8],[-.2,.8],[.12,.75],[-.3,0]].forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();return ext(s,.08);});}
function capeG(){return gc('cape',()=>{const s=new THREE.Shape();s.moveTo(-.32,0);s.lineTo(.32,0);s.lineTo(.5,-.62);s.lineTo(.36,-.52);s.lineTo(.26,-.78);s.lineTo(.1,-.6);s.lineTo(0,-.86);s.lineTo(-.1,-.6);s.lineTo(-.26,-.78);s.lineTo(-.36,-.52);s.lineTo(-.5,-.62);s.closePath();return ext(s,.025);});}
// Pfote/Fuß mit Zehen: w Breite, l Länge, h Höhe, n Zehen
function pawG(w,l,h,n){return gc('paw'+[w,l,h,n].map(v=>(+v).toFixed(3)),()=>{const P=[[sph(),mtx([0,0,0],0,[w,h,l])]];for(let i=0;i<n;i++){const x=(n>1?(i/(n-1)-.5):0)*w*1.1;P.push([sph(),mtx([x,-h*.12,-l*.8],0,[w*.36,h*.62,w*.42])]);}return mergeG(P);});}
function birdFootG(){return gc('bfoot',()=>{const P=[];[-.5,0,.5].forEach(a=>P.push([tubeG([[0,0,0],[Math.sin(a)*.07,-.008,-Math.cos(a)*.07],[Math.sin(a)*.11,-.012,-Math.cos(a)*.11]],[.022,.018,.01],6),I4]));P.push([tubeG([[0,0,0],[0,-.01,.07]],[.02,.01],6),I4]);return mergeG(P);});}
function fistG(r){return gc('fist'+r.toFixed(3),()=>{const P=[[sph(),mtx([0,0,0],0,[r,r*.9,r])]];for(let i=0;i<3;i++)P.push([sph(),mtx([(i-1)*r*.55,-r*.25,-r*.72],0,r*.36)]);P.push([sph(),mtx([0,r*.15,-r*.6],0,[r*.5,r*.3,r*.3])]);return mergeG(P);});}
function handG(r){return gc('hand'+r.toFixed(3),()=>{const P=[[sph(),mtx([0,0,0],0,[r,r*.95,r*.85])]];for(let i=0;i<3;i++)P.push([sph(),mtx([(i-1)*r*.5,-r*.75,-r*.25],0,[r*.3,r*.42,r*.3])]);P.push([sph(),mtx([r*.75,-r*.1,-r*.45],0,r*.32)]);return mergeG(P);});}
function mesh(geo,mat,par,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy??sx,sz??sx);par.add(m);return m;}
function grp(par,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g;}
// Teile-Liste (wird je Gruppe zu EINEM Mesh mit Vertex-Farben verschmolzen)
function PL(){const L=[];L.s=(p,s,c,r,lo)=>{L.push([lo?sphLo():sph(),mtx(p,r,s),c]);return L;};L.t=(pts,rad,c,rs)=>{L.push([tubeG(pts,rad,rs||10),I4,c]);return L;};L.g=(g,m,c)=>{L.push([g,m||I4,c]);return L;};return L;}
// ---------- Gliedmaßen mit Gelenken ----------
function mkLeg(X,par,p,o,i){const{C}=X,u=grp(par,p[0],p[1],p[2]),r=o.r,bk=!!o.bk,a=o.col||C.a,z=bk?r*.55:-r*.12;
 X.L('lu'+i,u).t([[0,r*.4,0],[0,-o.l1*.5,z],[0,-o.l1,z*.4]],[r*(bk?1.5:1.25),r*1.08,r*.84],a,10);
 const l=grp(u,0,-o.l1,z*.4),Ll=X.L('ll'+i,l),pc=o.pc||a;Ll.t([[0,0,0],[0,-o.l2*.55,-z*.5],[0,-o.l2,0]],[r*.84,r*.72,r*.68],a,10);
 if(o.paw==='hoof'){Ll.t([[0,-o.l2+r*.2,0],[0,-o.l2-r*.55,-r*.06]],[r*.74,r*.96],pc,10);Ll.s([0,-o.l2-r*.55,-r*.06],[r*.95,r*.18,r*.95],pc);}
 else if(o.paw==='stub')Ll.s([0,-o.l2-r*.2,-r*.25],[r*1.1,r*.65,r*1.25],pc);
 else Ll.g(pawG(r*1.2,r*1.45,r*.72,3),mtx([0,-o.l2-r*.12,-r*.42]),pc);
 return{u,l,front:!bk,s:o.s,foot:[0,-o.l2-r*.3,-r*.7]};}
function mkArm(X,par,p,o,i){const{C}=X,s=o.s,a=grp(par,p[0],p[1],p[2]),r=o.r,col=o.col||C.a;a.userData.rz0=s*(o.rz??.12);a.rotation.z=a.userData.rz0;
 X.L('au'+i,a).t([[0,r*.3,0],[s*r*.2,-o.l1*.5,0],[s*r*.3,-o.l1,0]],[r*1.15,r*.95,r*.82],col,10);
 const al=grp(a,s*r*.3,-o.l1,0),L=X.L('al'+i,al);L.t([[0,0,0],[0,-o.l2*.5,-r*.25],[0,-o.l2,-r*.4]],[r*.82,r*.78,r*.74],col,10);
 if(o.hand==='fist')L.g(fistG(r*1.5),mtx([0,-o.l2-r*.9,-r*.5]),o.hc||C.b);else L.g(handG(r*1.05),mtx([0,-o.l2-r*.75,-r*.45]),o.hc||col);
 return{u:a,l:al,s,tip:[0,-o.l2-r*.9,-r*.5]};}
// Flügel-Rig: wR (Faltung um y) → wF (Schlag um z) → wP (Neigung um x) → Segmente (je Segment 1 Mesh)
function wingRig(X,par,s,pos,o){const{C}=X,wR=grp(par,pos[0],pos[1],pos[2]),wF=grp(wR,0,0,0),wP=grp(wF,0,0,0),segs=[];let p=wP;const ca=o.ca||C.a,cb=o.cb||shade(C.a,.84),ct=o.ct||cb;
 o.L.forEach((l,i)=>{const g=grp(p,i?s*o.L[i-1]:0,0,0);segs.push(g);p=g;const last=i===o.L.length-1,W=X.L('w'+(o.k||'')+s+i,g,o.glow?'MG':0);
  if(o.mem){W.t([[0,0,0],[s*l*.5,.01,0],[s*l*1.08,0,0]],[o.br,o.br*.8,o.br*.5],ca,6);const h0=o.F[i],h1=last?o.F[i]*.35:o.F[i+1];
   W.g(gc('wm'+[s,l,h0,h1].map(v=>(+v).toFixed(3)).join('_'),()=>{const sh=new THREE.Shape();sh.moveTo(0,.01);sh.lineTo(s*l*1.05,.01);sh.quadraticCurveTo(s*l*1.1,-h1*.5,s*l*1.0,-h1);sh.quadraticCurveTo(s*l*.55,-Math.min(h0,h1)*.55,0,-h0);sh.lineTo(0,.01);return ext(sh,.012);}),I4,o.cm||C.d);}
  else{W.t([[0,0,0],[s*l*.5,.008,0],[s*l*1.06,0,0]],[o.br,o.br*.9,o.br*.75],ca,8);const n=o.N[i],fl=o.F[i];
   for(let j=0;j<n;j++){const x=s*l*(j+.5)/n,phi=s*(last?.1+j*.2:i*.06+j*.04),L2=fl*(last?1+j*.1:1),col=o.segCols?o.segCols[Math.min(i,o.segCols.length-1)]:last&&j>=n-2?ct:cb;
    if(o.ice)W.g(crystalG(),mtx([x,0,.004],[0,0,Math.PI+phi],[o.fw*1.6,L2*.8,o.fw*.9]),col);
    else if(o.pt)W.g(coneG(4),mtx([x,.01,.004],[0,0,Math.PI+phi],[o.fw*1.1,L2*1.05,o.fw*.35]),col);
    else W.s([x+Math.sin(phi)*L2/2,-Math.cos(phi)*L2/2,.004],[o.fw,L2/2,o.fw*.3],col,[0,0,phi]);
    W.s([x,-fl*.2,-.008],[o.fw*1.2,fl*.3,o.fw*.42],ca,[0,0,phi*.5]);}}});
 return{wR,wF,wP,segs,s,rest:o.rest,bird:o.bird};}
// Schwanz als Kette einzelner Glieder; liefert Spitze {par,pos}
function tailChain(X,par,pos,c,key){const{U,C}=X;let prev=grp(par,pos[0],pos[1],pos[2]);key=key||'tl';
 for(let i=0;i<c.n;i++){const g=i?grp(prev,0,c.L,0):prev,col=c.cols?c.cols[Math.min(i,c.cols.length-1)]:c.tipB&&i===c.n-1?C.b:C.a;g.userData.rx0=i?c.curl:c.rx;g.rotation.x=g.userData.rx0;
  X.L(key+i,g).t([[0,0,0],[0,c.L*.6,0],[0,c.L*1.15,0]],[c.rad[i],(c.rad[i]+c.rad[i+1])/2,Math.max(.004,c.rad[i+1])],col,10);if(!c.noAnim)U.tail.push(g);prev=g;}
 return{par:prev,pos:[0,c.L*1.1,0]};}
function flame(X,par,p,s,cols){const g=grp(par,p[0],p[1],p[2]),m=mesh(flameG(),flameMat(cols?cols[0]:'#ff7a1f',cols?cols[1]:'#fff2a8'),g,0,0,0,s*.36,s*.62,s*.36);m.userData.noOL=1;X.U.flames.push(g);return g;}
// ---------- Köpfe: Schnauze / Schnabel / Maul-Varianten ----------
function mkHead(X,par,pos,hr,kind){const{U,C}=X,H=grp(par,pos[0],pos[1],pos[2]),L=X.L('head',H),a=C.a,b=C.b,k=C.k,R=v=>v*hr,lo=X.lo;
 let eye=[.42,.1,.8,.26,.45],mo=[0,-.46,-.92,.5,'w',.19],mz=[0,-.3,-.9];X.H=H;X.hr=hr;X.top=[0,R(.88),0];
 const cheeks=(w)=>[-1,1].forEach(s=>L.t([[s*R(.45),R(-.2),R(-.05)],[s*R(.84),R(-.4),R(.06)],[s*R(1.04*w),R(-.52),R(.16)]],[R(.3),R(.18),R(.02)],b,8));
 switch(kind){
 case'fox':L.s([0,0,0],[R(1),R(.9),R(.92)],a);cheeks(1);L.s([0,R(-.3),R(-.7)],[R(.36),R(.26),R(.44)],b);L.s([0,R(-.18),R(-1.1)],[R(.13),R(.1),R(.09)],k);mo=[0,-.5,-.98,.55,'w',.2];eye=[.42,.1,.8,.28,.45];mz=[0,-.3,-1.05];break;
 case'wolf':L.s([0,0,0],[R(1),R(.88),R(.98)],a);cheeks(1.1);L.s([0,R(-.26),R(-.8)],[R(.38),R(.28),R(.58)],b);L.s([0,R(-.1),R(-.6)],[R(.32),R(.2),R(.4)],a);L.s([0,R(-.14),R(-1.36)],[R(.14),R(.1),R(.1)],k);mo=[0,-.5,-1.16,.62,'w',.22];eye=[.42,.16,.8,.25,.48];mz=[0,-.32,-1.3];break;
 case'cat':L.s([0,0,0],[R(1),R(.88),R(.9)],a);cheeks(.85);[-1,1].forEach(s=>L.s([s*R(.17),R(-.3),R(-.8)],[R(.22),R(.17),R(.17)],b));L.s([0,R(-.16),R(-.92)],[R(.09),R(.065),R(.05)],k);mo=[0,-.42,-.86,.4,'w',.15];eye=[.44,.06,.8,.29,.4];mz=[0,-.3,-.92];break;
 case'rodent':L.s([0,0,0],[R(1),R(.95),R(1)],a);L.s([0,R(-.3),R(-.74)],[R(.44),R(.33),R(.36)],b);L.s([0,R(-.14),R(-1.07)],[R(.11),R(.08),R(.07)],k);mo=[0,-.5,-.95,.6,'u',.14];eye=[.42,.16,.78,.27,.42];mz=[0,-.45,-.98];break;
 case'horse':L.s([0,0,0],[R(.86),R(.92),R(1)],a);L.t([[0,R(-.1),R(-.4)],[0,R(-.42),R(-.95)]],[R(.52),R(.42)],a);L.s([0,R(-.5),R(-1.02)],[R(.42),R(.35),R(.38)],C.m);[-1,1].forEach(s=>L.s([s*R(.17),R(-.4),R(-1.4)],[R(.07),R(.06),R(.04)],k));mo=[0,-.74,-1.1,.9,'line',.18];eye=[.6,.18,.62,.25,.85];mz=[0,-.6,-1.3];break;
 case'deer':L.s([0,0,0],[R(.92),R(.9),R(.95)],a);L.s([0,R(-.35),R(-.75)],[R(.4),R(.3),R(.45)],b);L.s([0,R(-.25),R(-1.15)],[R(.12),R(.09),R(.08)],k);mo=[0,-.56,-.98,.6,'u',.16];eye=[.46,.12,.78,.27,.5];mz=[0,-.4,-1.1];break;
 case'biped':L.s([0,0,0],[R(1),R(.95),R(.95)],a);L.s([0,R(-.32),R(-.7)],[R(.38),R(.26),R(.34)],b);L.s([0,R(-.2),R(-1.0)],[R(.1),R(.07),R(.06)],k);mo=[0,-.47,-.9,.5,'u',.2];eye=[.4,.12,.8,.27,.42];break;
 case'imp':L.s([0,0,0],[R(.95),R(.95),R(.92)],a);L.t([[0,R(-.5),R(-.5)],[0,R(-.85),R(-.62)]],[R(.42),R(.04)],a);L.s([0,R(-.3),R(-.72)],[R(.5),R(.36),R(.32)],b);mo=[0,-.4,-.86,.4,'line',.22];eye=[.42,.1,.82,.31,.42];break;
 case'beak':case'owl':{const ow=kind==='owl';L.s([0,0,0],ow?[R(1.05),R(.9),R(.92)]:[R(1),R(.95),R(1)],a);if(ow)L.s([0,R(-.04),R(-.52)],[R(.88),R(.8),R(.42)],b);else L.s([0,R(-.42),R(-.42)],[R(.62),R(.42),R(.52)],b);
  const bk=X.bk||'short',bc=C.bk;let up,lw;
  if(bk==='hook'){up=[[[0,R(.02),R(-.76)],[0,R(-.02),R(-1.08)],[0,R(-.2),R(-1.32)],[0,R(-.4),R(-1.3)]],[R(.25),R(.17),R(.08),R(.01)]];lw=[[0,0,0],[0,R(-.02),R(-.24)],[0,R(-.04),R(-.36)]];}
  else if(bk==='spear'){up=[[[0,R(-.02),R(-.74)],[0,R(-.08),R(-1.3)],[0,R(-.14),R(-1.95)]],[R(.2),R(.1),R(.01)]];lw=[[0,0,0],[0,R(-.03),R(-.6)],[0,R(-.05),R(-1.1)]];}
  else{up=[[[0,R(-.02),R(-.76)],[0,R(-.08),R(-1.04)],[0,R(-.16),R(-1.24)]],[R(.24),R(.14),R(.01)]];lw=[[0,0,0],[0,R(-.03),R(-.22)],[0,R(-.04),R(-.36)]];}
  if(ow)up=[up[0].map(q=>[q[0],q[1]-R(.12),q[2]*.82]),up[1].map(q=>q*.75)];
  L.g(tubeG(up[0],up[1],10),mtx([0,0,0],0,[1.3,.85,1]),bc);const jw=grp(H,0,R(ow?-.3:-.16),R(ow?-.62:-.74));X.L('jaw',jw).g(tubeG(lw,[R(.16),R(.1),R(.01)],8),mtx([0,0,0],0,[1.2,.7,1]),bc);U.beak=jw;
  mo=null;eye=ow?[.38,.08,.86,.33,.36]:[.5,.14,.72,.27,.62];break;}
 case'maw':L.s([0,0,0],[R(.9),R(.78),R(.9)],a);L.s([0,R(-.12),R(-.72)],[R(.6),R(.4),R(.72)],a);[-1,1].forEach(s=>{L.s([s*R(.4),R(.3),R(-.3)],[R(.32),R(.16),R(.4)],a,[0,0,s*.3]);L.s([s*R(.17),R(-.02),R(-1.32)],[R(.06),R(.05),R(.05)],k);});
  {const jw=grp(H,0,R(-.36),R(-.2)),J=X.L('jaw',jw);J.s([0,R(-.02),R(-.62)],[R(.52),R(.18),R(.72)],b);[-1,1].forEach(s=>[.35,.7].forEach(z=>J.g(coneG(5),mtx([s*R(.3+(.7-z)*.2),R(.1),R(-.4-z*.75)],0,[R(.06),R(.16),R(.06)]),'#ffffff')));U.beak=jw;}mo=null;eye=[.48,.24,.62,.25,.62];mz=[0,-.3,-1.3];break;
 case'newt':L.s([0,0,0],[R(1.15),R(.72),R(1)],a);L.s([0,R(-.26),R(-.42)],[R(.98),R(.42),R(.62)],b);mo=[0,-.22,-.98,.15,'w',.3];eye=[.55,.4,.62,.27,.55];X.top=[0,R(.66),0];break;
 case'seahorse':L.s([0,0,0],[R(.85),R(.92),R(.95)],a);L.t([[0,R(-.2),R(-.5)],[0,R(-.5),R(-.95)],[0,R(-.72),R(-1.15)]],[R(.36),R(.26),R(.22)],a);L.s([0,R(-.74),R(-1.17)],[R(.22),R(.2),R(.2)],b);mo=[0,-.62,-1.08,.9,'u',.14];eye=[.56,.2,.66,.3,.8];mz=[0,-.7,-1.15];break;
 case'turtle':L.s([0,0,0],[R(1),R(.85),R(1.05)],a);L.s([0,R(-.24),R(-.72)],[R(.62),R(.36),R(.44)],b);mo=[0,-.44,-.92,.7,'line',.26];eye=[.48,.2,.74,.27,.55];break;
 case'golem':L.s([0,0,0],[R(1),R(.85),R(.9)],a,0,lo);L.s([0,R(.34),R(-.6)],[R(.86),R(.24),R(.32)],a,0,lo);L.s([0,R(-.48),R(-.38)],[R(.76),R(.32),R(.5)],b,0,lo);mo=[0,-.52,-.86,.4,'line',.28];eye=[.36,.06,.86,.23,.3];break;
 // Konzeptkunst-Köpfe: Bär (runde Schnauze), Robbe (weiße Schnauze, Schnurrhaarpolster), Hase (Flauschwangen)
 case'bear':L.s([0,0,0],[R(1),R(.92),R(.92)],a);L.s([0,R(-.3),R(-.7)],[R(.44),R(.33),R(.36)],b);L.s([0,R(-.17),R(-1.04)],[R(.14),R(.1),R(.09)],k);[-1,1].forEach(s=>L.s([s*R(.6),R(-.22),R(-.42)],[R(.34),R(.3),R(.3)],a));mo=[0,-.52,-.95,.55,'w',.17];eye=[.38,.1,.85,.27,.4];mz=[0,-.3,-1.02];break;
 case'seal':L.s([0,0,0],[R(1),R(.9),R(.95)],a);L.s([0,R(-.32),R(-.36)],[R(.84),R(.58),R(.66)],b);[-1,1].forEach(s=>L.s([s*R(.19),R(-.3),R(-.84)],[R(.26),R(.2),R(.18)],b));L.s([0,R(-.12),R(-.98)],[R(.15),R(.1),R(.09)],'#23304f');mo=[0,-.5,-.86,.42,'w',.22];eye=[.44,.14,.8,.31,.44];mz=[0,-.3,-.98];break;
 case'bunny':L.s([0,0,0],[R(1),R(.94),R(.95)],a);cheeks(.95);L.s([0,R(-.28),R(-.66)],[R(.4),R(.3),R(.3)],b);L.s([0,R(-.13),R(-.96)],[R(.08),R(.055),R(.05)],'#9a6060');mo=[0,-.4,-.9,.45,'w',.15];eye=[.42,.06,.82,.31,.42];break;
 default:break;}
 X.eye=eye;X.mo=mo;X.mz=mz;return H;}
// ---------- Körperbau ----------
const QD={hound:{len:.6,r:.24,h:.56,neck:[.24,.12],nr:.15,head:.3,hk:'fox',paw:'paw',lr:.085,tail:{n:4,L:.14,rad:[.06,.09,.105,.095,.05],rx:.78,curl:-.12},chest:1.15,hip:.92},
 cat:{len:.76,r:.19,h:.42,neck:[.2,.1],nr:.12,head:.28,hk:'cat',paw:'paw',lr:.065,tail:{n:5,L:.13,rad:[.055,.05,.045,.04,.035,.03],rx:1.1,curl:-.3},chest:1.0,hip:1.06},
 hoof:{len:.62,r:.24,h:.74,neck:[.36,.2],nr:.15,head:.31,hk:'horse',paw:'hoof',lr:.055,tail:{n:3,L:.16,rad:[.05,.06,.07,.03],rx:.5,curl:.3},chest:1.18,hip:1.0},
 rodent:{len:.46,r:.27,h:.38,neck:[.12,.08],nr:.17,head:.31,hk:'rodent',paw:'paw',lr:.07,tail:{n:3,L:.12,rad:[.06,.05,.04,.02],rx:1.6,curl:-.3},chest:.95,hip:1.18},
 turtle:{len:.58,r:.27,h:.34,neck:[.06,.2],nr:.11,head:.23,hk:'turtle',paw:'stub',lr:.1,tail:{n:2,L:.09,rad:[.06,.04,.01],rx:1.9,curl:0},chest:1,hip:1,splay:1.5}};
function bQuad(X){const{U,C,K}=X,Q=QD[X.body],r=Q.r*K.w,len=Q.len*K.len,lr=Q.lr*Math.sqrt(K.w),legL=(Q.h-r*.3)*K.l,h=legL+r*.3,B=X.L('body',X.bd);
 B.t([[0,h+r*.05,len*.52],[0,h,len*.12],[0,h+r*.08,-len*.28],[0,h+r*.16,-len*.48]],[r*Q.hip*.92,r*.98,r*Q.chest,r*Q.chest*.9],C.a,14);
 B.s([0,h+r*.12,-len*.36],[r*Q.chest*1.02,r*Q.chest*1.08,r*Q.chest],C.a);B.s([0,h,len*.4],[r*Q.hip,r*Q.hip*.96,r*Q.hip],C.a);
 B.s([0,h-r*.12,-len*.5-r*.15],[r*.7*Q.chest,r*.85,r*.55],C.b);B.s([0,h-r*.42,-len*.08],[r*.62,r*.42,len*.42],C.b);
 const nb=[0,h+r*.4,-len*.42],nt=[0,h+r*.4+Q.neck[0]*K.n,-len*.5-Q.neck[1]],nr=Q.nr*K.w;B.t([nb,[0,(nb[1]+nt[1])/2,(nb[2]+nt[2])/2-.02],nt],[nr*1.5,nr*1.2,nr],C.a,12);
 B.s([0,nt[1]-nr*.6,nt[2]-nr*.5],[nr*.9,nr*1.2,nr*.7],C.b);
 const hr=Q.head*K.h;mkHead(X,X.bd,[0,nt[1]+hr*.3,nt[2]-hr*.25],hr,K.hk||Q.hk);
 const sp=Q.splay||1;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([s,f],i)=>{const bk=f>0,z=f*len*.36,ry=bk?h:h+r*.05;B.s([s*r*.55*sp,ry,z],[r*.48,r*.5,r*.5],C.a);
  const l1=legL*.5,l2=legL-l1-lr*.6;U.legs.push(mkLeg(X,X.bd,[s*r*.58*sp,ry,z],{r:lr*(bk?1.05:1),l1,l2,bk,s,paw:Q.paw,pc:X.paw||C.a},i));});
 const tc=Object.assign({},Q.tail,K.tail||{});tc.L*=K.t;if(tc.yaw){const tb=grp(X.bd,0,h+r*.3,len*.55);tb.rotation.y=tc.yaw;X.tip=tailChain(X,tb,[0,0,0],tc);}else X.tip=tailChain(X,X.bd,[0,h+r*.3,len*.55],tc);
 X.back=[[0,h+r*1.0,-len*.28],[0,h+r*.98,len*.04],[0,h+r*.9,len*.34]];X.sho=[0,h+r*.85,-len*.3];X.neck=[0,(nb[1]+nt[1])/2,(nb[2]+nt[2])/2];X.nr=nr;X.r=r;X.h=h;X.len=len;}
function bBlob(X){const{U,C,K}=X,B=X.L('body',X.bd),v=X.body;let hr=.46;
 if(v==='pebble'){B.s([0,.32,0],[.5*K.w,.36,.46],C.a,0,1);B.s([0,.2,-.24],[.34,.18,.24],C.b,0,1);X.lo=1;}
 else{B.g(blobG(28),mtx([0,0,0],0,[K.w,v==='plant'?1.08:1,K.w]),C.a);B.s([0,.3,-.3],[.3,.27,.17],C.b);}
 const H=grp(X.bd,0,.5,0);X.H=H;X.hr=hr;X.L('head',H);X.top=[0,v==='pebble'?.22:.38,0];X.earP=[.42,.62,.08];
 X.eye=v==='pebble'?[.36,-.12,.96,.2,.34]:[.34,.24,.88,.21,.32];X.mo=v==='pebble'?[0,-.36,-.95,.2,'u',.13]:[0,-.13,-1.1,.2,'u',.15];
 [-1,1].forEach((s,i)=>{const u=grp(X.bd,s*.2,.06,-.14);X.L('ft'+i,u).g(pawG(.13,.15,.065,2),I4,X.paw||shade(C.a,.9));U.legs.push({u,l:null,front:true,s});
  const a=grp(X.bd,s*.43*K.w,.38,-.04);X.L('arm'+i,a).s([s*.04,-.06,0],[.09,.13,.09],C.a);U.arms.push({u:a,l:null,s});});
 X.back=[[0,.8,.1],[0,.72,.28],[0,.55,.4]];X.sho=[0,.6,.36];X.neck=[0,.5,0];X.nr=.4;X.tip={par:X.bd,pos:[0,.25,.42]};}
function bFloat(X){const{U,C,K}=X,B=X.L('body',X.bd),v=X.body;let hr;
 if(v==='ghost'){B.s([0,.62,0],[.36*K.w,.37,.34],C.a);B.t([[0,.5,.02],[0,.36,.1],[0,.27,.2]],[.33,.24,.14],C.a);B.s([0,.5,-.22],[.22,.2,.12],C.b);
  hr=.36;X.H=grp(X.bd,0,.64,0);X.eye=[.4,.04,.9,.3,.42];X.mo=[0,-.4,-.9,.3,'w',.18];X.earP=[.5,.78,.05];X.top=[0,hr*.95,0];
  X.tip=tailChain(X,X.bd,[0,.3,.2],{n:4,L:.11,rad:[.13,.1,.07,.045,.012],rx:2.25,curl:-.5,cols:[C.a,C.a,C.a,C.b]});U.hover=.2;
  [-1,1].forEach((s,i)=>{const a=grp(X.bd,s*.34,.5,-.04);X.L('arm'+i,a).s([s*.04,-.05,0],[.08,.12,.08],C.a);U.arms.push({u:a,l:null,s});});}
 else if(v==='lantern'){const G=X.L('bodyG',X.bd,'MG');G.s([0,.55,0],[.34*K.w,.4,.34*K.w],C.a);
  [.36,.55,.74].forEach(y=>{const q=1-Math.pow((y-.55)/.4,2),rr=.34*K.w*Math.sqrt(q)*1.01;B.g(torG(.07),mtx([0,y,0],[Math.PI/2,0,0],[rr,rr,.6]),C.b);});
  B.g(cylG(16),mtx([0,.9,0],0,[.17,.08,.17]),C.b);B.g(torG(.18,Math.PI),mtx([0,.98,0],0,[.08,.08,.5]),C.b);B.g(cylG(16),mtx([0,.12,0],0,[.15,.07,.15]),C.b);B.t([[0,.12,0],[0,.03,0],[0,-.06,.02]],[.035,.03,.05],C.s);
  hr=.34;X.H=grp(X.bd,0,.55,0);X.eye=[.4,-.02,.92,.3,.42];X.mo=[0,-.34,-.94,.3,'u',.16];X.top=[0,.36,0];U.hover=.24;X.tip={par:X.bd,pos:[0,.05,.0]};}
 else if(v==='jelly'){const p=[];for(let i=0;i<=12;i++){const t=i/12,a=t*Math.PI/2;p.push(new THREE.Vector2(Math.max(.0001,Math.sin(a)*.44),.02+Math.cos(a)*.42));}p.push(new THREE.Vector2(.4,-.02));p.push(new THREE.Vector2(.0001,.04));
  B.g(gc('bell',()=>new THREE.LatheGeometry(p.reverse(),24)),mtx([0,.6,0],0,[K.w,1,K.w]),C.a);B.g(torG(.16),mtx([0,.61,0],[Math.PI/2,0,0],[.42*K.w,.42*K.w,.7]),C.b);
  hr=.42;X.H=grp(X.bd,0,.74,0);X.eye=[.4,-.1,.9,.25,.42];X.mo=[0,-.4,-.92,.4,'u',.14];X.top=[0,.32,0];U.hover=.38;
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.3,x=Math.sin(a)*.22,z=Math.cos(a)*.22;const t=tailChain(X,X.bd,[x,.6,z],{n:3,L:.13,rad:[.05,.04,.03,.008],rx:Math.PI-.15,curl:(i%2?.35:-.35),cols:[C.a,C.a,C.b]},'tn'+i);if(i===2)X.tip=t;}}
 else{const r=.25*K.w;B.t([[0,.3,.08],[0,.48,-.1],[0,.68,-.04],[0,.88,.1]],[r*.8,r*1.15,r*.95,r*.52],C.a,14);[[.4,-.16,.15],[.52,-.2,.17],[.64,-.19,.16],[.76,-.14,.13]].forEach(([y,z,w])=>B.s([0,y,z*K.w*.9],[w*K.w*.78,.045,.08],mixC(C.b,C.a,.25)));
  hr=.29*K.h;mkHead(X,X.bd,[0,1.02+hr*.35,.02],hr,'seahorse');U.hover=.12;X.tip=tailChain(X,X.bd,[0,.3,.08],{n:5,L:.12,rad:[r*.78,r*.64,r*.52,r*.42,r*.32,r*.16],rx:Math.PI*.82,curl:.8});
  X.back=[[0,.82,.16],[0,.66,.18],[0,.5,.15]];X.sho=[0,.74,.05];X.neck=[0,.86,0];X.nr=r*.8;return;}
 X.L('head',X.H);X.hr=hr;X.back=[[0,.95,.1],[0,.8,.3],[0,.6,.35]];X.sho=[0,.62,.3];X.neck=[0,.42,0];X.nr=.35;}
function bSerp(X){const{U,C,K}=X,w=K.w,rise=K.rise||1,SP=[[.3,.07,1.1,.05],[.36,.11,.9,.1],[.3,.16,.66,.15],[.12,.21,.44,.2],[-.05,.25,.2,.24],[-.04,.34,-.02,.25],[0,.55,-.17,.23],[0,.78,-.21,.2],[0,.98,-.2,.18]];
 for(let i=0;i<8;i++){const p=SP[i],q=SP[i+1],d=[q[0]-p[0],(q[1]-p[1])*(i>=5?rise:1),q[2]-p[2]],g=grp(X.bd,p[0],i>=6?SP[5][1]+(p[1]-SP[5][1])*rise:p[1],p[2]),L=X.L('sg'+i,g);
  L.t([[0,0,0],d],[p[3]*w,q[3]*w],C.a,14);const bv=j=>j<=3?[0,-1,0]:j>=6?[0,0,-1]:j===4?[0,-.8,-.6]:[0,-.4,-.92];const b0=bv(i),b1=bv(i+1),o0=p[3]*w*.36,o1=q[3]*w*.36;
  L.t([[b0[0]*o0,b0[1]*o0,b0[2]*o0],[d[0]+b1[0]*o1,d[1]+b1[1]*o1,d[2]+b1[2]*o1]],[p[3]*w*.74,q[3]*w*.74],C.b,12);U.serp.push({g,x:p[0],d,r:p[3]*w,i});}
 const top=U.serp[7],hp=[0,top.g.position.y+top.d[1]+.12,-.3],hr=.26*K.h;mkHead(X,X.bd,hp,hr,K.hk||'maw');
 X.tip={par:U.serp[0].g,pos:[0,.02,0]};X.back=[[0,.6,.2],[0,.5,.46],[0,.38,.72]];X.sho=[0,top.g.position.y-.1,-.1];X.neck=[0,top.g.position.y,-.2];X.nr=.2*w;X.segTop=i=>{const q=U.serp[i];return[q.d[0]*.5,q.d[1]*.5+q.r*.85,q.d[2]*.5];};}
function bGolem(X){const{U,C,K}=X,B=X.L('body',X.bd),v=K.v||'round',lo=v!=='round'?1:0,w=K.w;X.lo=lo;
 B.s([0,.8,0],[.52*w,.48,.44],C.a,0,lo);B.s([0,1.02,-.04],[.46*w,.3,.38],C.a,0,lo);[-1,1].forEach(s=>B.s([s*.44*w,1.04,0],[.26,.24,.26],C.a,0,lo));B.s([0,.74,-.3],[.34*w,.32,.16],C.b,0,lo);
 [-1,1].forEach((s,i)=>{const u=grp(X.bd,s*.25*w,.38,0),l=grp(u,0,-.24,0);X.L('lu'+i,u).t([[0,.1,0],[0,-.12,0],[0,-.24,0]],[.19,.17,.15],C.a,10);X.L('ll'+i,l).t([[0,0,0],[0,-.05,0]],[.15,.17],C.a,10).g(pawG(.2,.22,.085,3),mtx([0,-.07,-.04]),C.b);U.legs.push({u,l,front:true,s});
  U.arms.push(mkArm(X,X.bd,[s*.62*w,1.02,0],{s,r:.14,l1:.3,l2:.24,hand:'fist',rz:.1,hc:C.b},i));});
 const hr=.25*K.h,hn=v==='hunch';mkHead(X,X.bd,[0,hn?1.12:1.28,hn?-.42:-.3],hr,'golem');
 X.back=[[-.3,1.22,.14],[0,1.3,.16],[.3,1.22,.14]];X.sho=[0,1.14,.3];X.neck=[0,1.12,-.22];X.nr=.3;X.tip={par:X.bd,pos:[0,.7,.4]};if(hn)U.lean=.16;}
function bBiped(X){const{U,C,K}=X,B=X.L('body',X.bd),v=K.v||'slim',w=K.w*1.18,lg=K.l,leg=.22*lg,hy=.48*lg;
 B.t([[0,hy,.02],[0,hy+.26,0],[0,hy+.52,-.02],[0,hy+.64,-.04]],[.25*w,.29*w,.27*w,.18*w],C.a,14);B.t([[0,hy+.6,-.04],[0,hy+.74,-.06],[0,hy+.86,-.07]],[.15*w,.13*w,.13*w],C.a,12);
 [-1,1].forEach(s=>{B.s([s*.24*w,hy+.52,-.01],[.14*w,.13*w,.14*w],C.a);B.s([s*.13*w,hy,0],[.16*w,.15,.16*w],C.a);});B.s([0,hy+.3,-.19*w],[.2*w,.27,.12],C.b);
 [-1,1].forEach((s,i)=>{U.legs.push(mkLeg(X,X.bd,[s*.14*w,hy,0],{r:.1*w,l1:leg,l2:hy-leg-.06,s,paw:v==='tall'?'hoof':'paw',pc:v==='tall'?C.d:C.a},i));
  U.arms.push(mkArm(X,X.bd,[s*.32*w,hy+.54,-.01],{s,r:.078*w,l1:v==='slim'?.3:.26,l2:v==='slim'?.28:.23,rz:.14},i));});
 const hr=.33*K.h;mkHead(X,X.bd,[0,hy+.98+hr*.2,-.08],hr,K.hk||'biped');
 if(!X.has('vineTail')&&!X.has('wispTail')&&X.has('tail'))X.tip=tailChain(X,X.bd,[0,hy+.06,.18],{n:4,L:.14,rx:2.0,curl:-.26,rad:[.11,.09,.07,.05,.02]});
 X.back=[[0,hy+.64,.16],[0,hy+.44,.22],[0,hy+.24,.22]];X.sho=[0,hy+.56,.18];X.neck=[0,hy+.76,-.06];X.nr=.15*w;X.hy=hy;}
const BIRD={round:{br:[.36,.37,.4],by:.52,nk:0,hr:.27,hy:.98,hz:-.1,leg:.24,lw:.55},raptor:{br:[.27,.33,.4],by:.66,nk:1,hr:.25,hy:1.16,hz:-.18,leg:.38,lw:1},
 crane:{br:[.22,.25,.34],by:.82,nk:2,hr:.2,hy:1.5,hz:-.22,leg:.6,lw:.85},swift:{br:[.22,.24,.42],by:.5,nk:1,hr:.27,hy:.84,hz:-.32,leg:.18,lw:1.25},owl:{br:[.42,.44,.4],by:.6,nk:0,hr:.34,hy:1.08,hz:-.06,leg:.2,lw:.75}};
function bBird(X){const{U,C,K}=X,v=K.v||'raptor',Q=BIRD[v],B=X.L('body',X.bd),[rx,ry,rz]=Q.br.map(q=>q*K.w),by=Q.by*K.l;
 B.s([0,by,0],[rx,ry,rz],C.a);B.s([0,by-.04,-rz*.45],[rx*.78,ry*.82,rz*.55],C.b);
 if(Q.nk===1)B.t([[0,by+ry*.4,-rz*.3],[0,Q.hy*K.l-.12,Q.hz+.02]],[rx*.62,Q.hr*.7],C.a,12);
 if(Q.nk===2)B.t([[0,by+ry*.5,-rz*.4],[0,by+ry+.15,-rz*.55],[0,Q.hy*K.l-.3,Q.hz+.1],[0,Q.hy*K.l-.1,Q.hz]],[rx*.6,.07,.065,.08],C.a,12);
 [-1,1].forEach((s,i)=>{B.s([s*rx*.4,by-ry*.7,0],[.1,.1,.1],C.a);const u=grp(X.bd,s*rx*.38,by-ry*.75,.02),lg=Q.leg*K.l;X.L('lu'+i,u).t([[0,0,0],[0,-lg*.52,-.01],[0,-lg,0]],[.04,.034,.03],C.bk,8);
  const l=grp(u,0,-lg,0);X.L('ll'+i,l).g(birdFootG(),I4,C.bk);U.legs.push({u,l,front:true,s});});
 X.bk=K.bk||'short';const hr=Q.hr*K.h;mkHead(X,X.bd,[0,Q.hy*K.l+(Q.nk?0:0),Q.hz],hr,v==='owl'?'owl':'beak');
 const lw=Q.lw*(K.ws||1),ice=X.has('iceWings'),zig=X.has('zigWings'),wo={L:[.14*lw,.14*lw,.17*lw],N:[3,3,4],F:[.17*lw,.24*lw,.32*lw],fw:.05*Math.sqrt(lw),br:.035*Math.sqrt(lw),ws:1,rest:1,bird:true,
  cb:ice?mixC(C.s,'#ffffff',.45):zig?C.b:shade(C.a,.82),ct:ice?C.s:zig?C.b:X.wingTip||shade(C.a,.82),ice,pt:zig||ice,segCols:K.wc,ca:K.wca};
 [-1,1].forEach(s=>U.wings.push(wingRig(X,X.bd,s,[s*rx*.95,by+ry*.35,-rz*.1],wo)));
 const tg=grp(X.bd,0,by-ry*.05,rz*.85);tg.rotation.x=1.25;U.fan=tg;const T=X.L('fan',tg),tc=shade(C.a,.84);
 if(X.has('tailLong')||X.has('flamePlumes')||X.has('lanternPlumes')){for(let j=0;j<3;j++){const a=(j-1)*.22,Lq=.42+(j===1?.16:0);T.s([-Math.sin(a)*Lq*.5,Math.cos(a)*Lq*.5,0],[.055,Lq*.5,.018],j===1?C.a:tc,[0,0,a]);}X.tip={par:tg,pos:[0,.6,0]};}
 else if(X.has('forkTail')){[-1,1].forEach(s=>T.t([[0,0,0],[s*.05,.22,.0],[s*.14,.48,.02]],[.05,.03,.003],tc,8));T.s([0,.1,0],[.07,.12,.02],C.a);X.tip={par:tg,pos:[0,.3,0]};}
 else if(X.has('iceTail')){[-1,0,1].forEach(j=>T.g(crystalG(),mtx([j*.06,.02,0],[0,0,-j*.3],[.07,.32-Math.abs(j)*.06,.03]),j?C.b:C.s));X.tip={par:tg,pos:[0,.3,0]};}
 else{const n=v==='round'||v==='owl'?3:5;for(let j=0;j<n;j++){const a=(j-(n-1)/2)*.24,L=(n===3?.16:.24)-Math.abs(j-(n-1)/2)*.02;T.s([-Math.sin(a)*L,Math.cos(a)*L,0],[.05,L,.016],j%2?C.a:tc,[0,0,a]);}X.tip={par:tg,pos:[0,.3,0]};}
 X.back=[[0,by+ry*.85,.06],[0,by+ry*.7,rz*.5],[0,by+ry*.3,rz*.8]];X.sho=[0,by+ry*.6,-rz*.1];X.neck=[0,Q.hy*K.l-hr*.8,Q.hz+.04];X.nr=Q.hr*.6;
 U.wRaise=K.wRaise||0;U.wPitch=K.wPitch;U.lean=v==='swift'?.22:v==='crane'?-.06:0;U.wOpen=K.wOpen!=null?K.wOpen:X.leg?.55:X.has('sunCrest')||X.has('iceWings')?.3:0;}
// ---------- Signaturmerkmale (eigene Bauteile) ----------
function ears(X,type){const{U,C}=X,hr=X.hr,P=X.earP||[.5,.62,.06];[-1,1].forEach((s,i)=>{const g=grp(X.H,s*P[0]*hr,P[1]*hr,P[2]*hr);let L=hr*1.0,w=hr*.36,rz=-s*.34,rx=.14;
 if(type==='big'){L=hr*1.3*(X.K.ear||1);w=hr*.52*(X.K.ear||1);rz=-s*.52;}else if(type==='cat'){L=hr*.72*(X.K.ear||1);w=hr*.4*(X.K.ear||1);rz=-s*.3;}else if(type==='round'){L=hr*.7*(X.K.ear||1);w=hr*.42*(X.K.ear||1);rz=-s*.6;rx=.05;}
 g.rotation.set(rx,0,rz);g.userData.rz0=rz;const E=X.L('ear'+i,g),F=mtx([0,0,0],0,[1,1,.42]),Fi=mtx([0,L*.04,-w*.22],0,[1,1,.3]);
 if(type==='round'){E.g(sph(),mtx([0,L*.5,0],0,[w,L*.55,w*.36]),X.earOut||C.a);E.g(sph(),mtx([0,L*.5,-w*.14],0,[w*.68,L*.38,w*.2]),X.earIn||C.p);}
 else{const pts=X.zig?[[0,0,0],[L*.12,L*.35,0],[-L*.08,L*.62,0],[L*.06,L,-L*.06]]:[[0,0,0],[0,L*.45,0],[0,L,-L*.06]];E.g(tubeG(pts,[w,w*.78,w*.05],10),F,X.earOut||C.a);E.g(tubeG(pts,[w*.64,w*.48,w*.03],10),Fi,X.earIn||C.p);
  if(type==='big'||X.dt)E.g(tubeG([pts[pts.length-2].map(q=>q*1.05),pts[pts.length-1]],[w*.36,w*.04],8),F,X.dt||C.d);}
 U.ears.push(g);});}
// Loop B Nachbesserung: Rücken-/Schwanz-Anker für Merkmale, die ursprünglich nur für Schlangenkörper (U.serp/segTop) gebaut waren
const hasSerp=X=>X.U.serp.length>=8&&typeof X.segTop==='function';
function backPts(X,n){const B=X.back&&X.back.length?X.back:[[0,(X.H?X.H.position.y:.6)*.8,.1]];if(B.length===1)return Array.from({length:n},()=>B[0].slice());
 return Array.from({length:n},(_,i)=>{const t=n===1?.5:i/(n-1)*(B.length-1),a=Math.min(B.length-2,Math.floor(t)),f=t-a;return[0,1,2].map(j=>B[a][j]+(B[a+1][j]-B[a][j])*f);});}
const FEAT={
 bigEars:X=>ears(X,'big'),ears:X=>ears(X,'pt'),roundEars:X=>ears(X,'round'),catEars:X=>ears(X,'cat'),
 candleTail:X=>{const T=X.tip,L=X.L('wax',T.par),p=T.pos,s=X.K.ts||1;L.g(cylG(12),mtx([p[0],p[1]-.05*s,p[2]],0,[.085*s,.07*s,.085*s]),X.C.b);[0,1.6,3.6].forEach(a=>L.s([Math.sin(a)*.08*s,p[1]-.045*s,Math.cos(a)*.08*s],[.025*s,.05*s,.025*s],X.C.b));
  flame(X,T.par,[p[0],p[1]+.02*s,p[2]],(X.stage>2?.72:X.stage>1?.64:.56)*s,X.fc);},
 flameMane:X=>{const N=X.neck,R=X.nr*1.45,L=X.L('maneG',X.bd,'MG'),n=11,Ln=X.nr*(X.stage>2?2.6:2.1);for(let i=0;i<n;i++){const a=-2.3+i/(n-1)*4.6,sa=Math.sin(a),ca=Math.cos(a),ln=Ln*(1-Math.abs(a)*.1)*(i%2?.8:1),b=[N[0]+sa*R,N[1]+ca*R*.85,N[2]+.04];
  L.t([b,[b[0]+sa*ln*.45,b[1]+ca*ln*.3+ln*.2,b[2]+ln*.35],[b[0]+sa*ln*.6,b[1]+ca*ln*.2+ln*.45,b[2]+ln*.85]],[R*.36,R*.22,.004],i%2?X.C.s:mixC(X.C.s,X.C.a,.55),8);}},
 basalt:X=>{const L=X.L('basalt',X.bd),G=X.L('basaltG',X.bd,'MG'),d=X.C.d;X.back.forEach((p,i)=>{L.g(crystalG(),mtx([p[0],p[1]-.08,p[2]],[-.5,i,0],[.27,.34,.27]),d);G.s([p[0],p[1]-.03,p[2]+.1],[.05,.035,.08],X.C.s);});
  [-1,1].forEach(s=>{L.g(crystalG(),mtx([s*X.r*.85,X.sho[1]-.08,X.sho[2]-.02],[-.3,0,-s*.7],[.2,.28,.2]),d);L.g(crystalG(),mtx([s*X.r*.75,X.h+X.r*.5,X.len*.38],[.2,0,-s*.8],[.12,.16,.12]),d);G.s([s*X.r*.8,X.sho[1]-.12,X.sho[2]+.06],[.04,.03,.06],X.C.s);});},
 hornsBack:X=>{const L=X.L('head',X.H),hr=X.hr,Lh=hr*1.7;[-1,1].forEach(s=>L.t([[s*hr*.42,hr*.6,hr*.08],[s*hr*.52,hr*.6+Lh*.35,hr*.08+Lh*.35],[s*hr*.6,hr*.6+Lh*.42,hr*.1+Lh*.9]],[Lh*.17,Lh*.1,.004],X.C.hn,10));},
 dropTip:X=>{const L=X.L('head',X.H),h=X.hr*(X.body==='blob'?.85:1.1),t=X.top;L.t([[t[0],t[1]-h*.1,t[2]],[t[0],t[1]+h*.22,t[2]+h*.05],[t[0]+h*.08,t[1]+h*.42,t[2]+h*.14],[t[0]+h*.22,t[1]+h*.44,t[2]+h*.04]],[h*.3,h*.2,h*.1,.006],X.C.a,10);},
 tadTail:X=>{const g=grp(X.bd,0,.22,.42);g.userData.rx0=1.95;g.rotation.x=1.95;X.L('tad',g).t([[0,0,0],[0,.12,0],[0,.2,0]],[.1,.07,.02],X.C.a,8).g(finG(),mtx([0,.06,0],[0,-Math.PI/2,0],[.3,.36,.3]),X.C.b);X.U.tail.push(g);},
 gills:X=>{const hr=X.hr*1.4,L=X.L('gill',X.H,X.leg||X.stage>2?'MG':0);[-1,1].forEach(s=>[0,1,2].forEach(j=>{const b=[s*hr*.72,hr*(.05+j*.2),hr*.3],ln=hr*(.6-Math.abs(j-1)*.12),dy=(j-1)*.35;
  L.t([b,[b[0]+s*ln*.5,b[1]+ln*(.15+dy*.4),b[2]+ln*.25],[b[0]+s*ln*.8,b[1]+ln*(.32+dy*.6),b[2]+ln*.55]],[hr*.1,hr*.08,.004],X.C.s,8);[.35,.65].forEach(t=>L.s([b[0]+s*ln*.65*t,b[1]+ln*(.25+dy*.5)*t,b[2]+ln*.4*t],[hr*.075,hr*.045,hr*.075],X.C.s));}));},
 finCrest:X=>{const U=X.U;[3,4,5,6,7].forEach((i,k)=>{const q=U.serp[i];if(!q)return;X.L('sg'+i,q.g).g(finG(),mtx([q.d[0]*.5,q.d[1]*.5+q.r*.6,q.d[2]*.5+.05],[0,-Math.PI/2,i>=6?-.5:0],[.3+k*.02,.26+(X.stage>2?.1:0),.3]),X.stage>2?shade(X.C.a,.7):X.C.b);});},
 whirl:X=>{const sp=hasSerp(X),t=X.tip||{par:X.bd,pos:backPts(X,1)[0]},m=mesh(torG(.07,Math.PI*1.5),bmat(X.C.s,{transparent:true,opacity:.7,depthWrite:false}),sp?X.U.serp[1].g:t.par,sp?0:t.pos[0],sp?.05:t.pos[1]+.05,sp?0:t.pos[2],.26,.26,.26);m.rotation.x=Math.PI/2;m.userData.noOL=1;X.U.spin.push([m,'z',2.2]);},
 lure:X=>{const hr=X.hr,L=X.L('head',X.H),G=X.L('headG',X.H,'MG');L.t([[0,hr*.55,-hr*.2],[0,hr*1.3,-hr*.5],[0,hr*1.3,-hr*1.15],[0,hr*1.0,-hr*1.45]],[hr*.07,hr*.06,hr*.05,hr*.04],X.C.a,8);G.s([0,hr*.92,-hr*1.5],[hr*.2,hr*.24,hr*.2],X.C.s);X.U.pulse=1;},
 backSpikes:X=>{const L=X.L('body',X.bd),c=X.stage>2?X.C.s:X.C.b;if(X.U.serp.length){[2,3,4,5,6].forEach(i=>{const q=X.U.serp[i];X.L('sg'+i,q.g).t([[q.d[0]*.5,q.d[1]*.5+q.r*.7,q.d[2]*.5],[q.d[0]*.5,q.d[1]*.5+q.r*.7+.12,q.d[2]*.5+.07],[q.d[0]*.5,q.d[1]*.5+q.r*.7+.2,q.d[2]*.5+.16]],[.05,.025,0],c,6);});return;}
  X.back.forEach((p,i)=>L.t([[p[0],p[1]-.04,p[2]],[p[0],p[1]+.08,p[2]+.04],[p[0],p[1]+.14,p[2]+.12]],[.05,.025,0],c,6));},
 sprout:X=>{const L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),t=X.top,s=X.hr*(X.body==='plant'?1.7:1.5),st=[[t[0],t[1]-s*.05,t[2]],[t[0]+s*.03,t[1]+s*.18,t[2]+s*.02],[t[0]+s*.08,t[1]+s*.32,t[2]]];
  L.t(st,[s*.05,s*.04,s*.035],shade(X.C.a,.75),6);[[.95,mixC(X.C.a,'#ffffff',.2)],[-.9,shade(X.C.a,.85)]].forEach(([a,c],i)=>L.g(leafG(),mtx([t[0]+s*.06,t[1]+s*.24,t[2]],[i?.3:-.2,i?.6:-.4,-a],[s*.32,s*.42*(i?.85:1),s*.32]),c));G.s([t[0]+s*.09,t[1]+s*.36,t[2]],[s*.1,s*.12,s*.1],X.C.s);},
 leafSkirt:X=>{const L=X.L('body',X.bd);for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3;L.g(leafG(),mtx([Math.sin(a)*.3,.1,Math.cos(a)*.3],[Math.PI/2+.75,a,0],[.24,.3,.24]),i%2?shade(X.C.a,.78):shade(X.C.a,.9));}},
 leafCollar:X=>{const L=X.L('body',X.bd),N=X.neck,R=X.nr*1.55,n=9;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;L.g(leafG(),mtx([N[0]+Math.sin(a)*R,N[1]-.1,N[2]+Math.cos(a)*R*.9],[Math.PI/2+.75,a,0],[.2,.3,.2]),i%2?shade(X.C.a,.8):mixC(X.C.a,'#ffffff',.15));}},
 vineTail:X=>{const t=tailChain(X,X.bd,[0,X.hy+.06,.16],{n:5,L:.14,rx:2.1,curl:-.42,rad:[.06,.05,.045,.04,.032,.02]});X.L('tl4',t.par).g(leafG(),mtx([0,t.pos[1],0],[0,0,.4],[.13,.18,.13]),mixC(X.C.a,'#ffffff',.2));X.tip=t;},
 antlers:X=>{const L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),hr=X.hr*1.3,ac=X.C.hn,fl=(p)=>{for(let k=0;k<5;k++){const a=k/5*Math.PI*2;G.s([p[0]+Math.sin(a)*hr*.09,p[1]+Math.cos(a)*hr*.09,p[2]],[hr*.07,hr*.07,hr*.035],X.C.s);}G.s(p,[hr*.05,hr*.05,hr*.05],'#ffffff');};
  [-1,1].forEach(s=>{const b=[s*hr*.38,hr*.7,hr*.05],m=[s*hr*.8,hr*1.35,hr*.25],tp=[s*hr*1.05,hr*2.0,hr*.15];L.t([b,m,tp],[hr*.1,hr*.08,hr*.03],ac,8);
   const t1=[s*hr*.55,hr*1.4,-hr*.25],t2=[s*hr*1.4,hr*1.6,hr*.35];L.t([[s*hr*.66,hr*1.1,hr*.18],t1],[hr*.06,hr*.02],ac,6);L.t([[s*hr*.9,hr*1.55,hr*.24],t2],[hr*.06,hr*.02],ac,6);[tp,t1,t2].forEach(fl);});},
 leafCape:X=>{const L=X.L('cape',X.bd),S=X.sho;for(let i=0;i<5;i++){const x=(i-2)*.09;L.g(leafG(),mtx([S[0]+x,S[1]+.06,S[2]+.05+Math.abs(i-2)*.01],[Math.PI-.18,0,(i-2)*.16],[.24,.62-Math.abs(i-2)*.07,.24]),i%2?shade(X.C.a,.78):shade(X.C.a,.92));}},
 puffCrest:X=>{const L=X.L('head',X.H),t=X.top,h=X.hr,c=[t[0],t[1]+h*.45,t[2]+h*.05];L.t([[t[0],t[1]-h*.05,t[2]],c],[h*.05,h*.04],shade(X.C.a,.8),6);L.s(c,[h*.3,h*.3,h*.3],X.C.b);
  for(let i=0;i<10;i++){const a=i*2.4,y=Math.cos(i*1.3)*.8;L.s([c[0]+Math.sin(a)*h*.3*Math.sqrt(1-y*y),c[1]+y*h*.3,c[2]+Math.cos(a)*h*.3*Math.sqrt(1-y*y)],[h*.11,h*.11,h*.11],'#ffffff');}},
 vaneCrest:X=>{const L=X.L('head',X.H),h=X.hr*1.35;[-1,0,1].forEach(j=>L.s([j*h*.12,h*(.95+(j?0:.15)),h*(.45-Math.abs(j)*.05)],[h*.12,h*(j?.62:.82),h*.05],j?X.C.a:X.C.b,[-1.05,0,-j*.2]));L.g(coneG(3),mtx([0,h*1.55,h*1.0],[-1.0+Math.PI,0,0],[h*.2,h*.3,h*.05]),X.C.s);},
 incisors:X=>{const L=X.L('head',X.H),m=X.mz,h=X.hr;[-1,1].forEach(s=>L.s([s*h*.065,m[1]*h-h*.14,m[2]*h+h*.12],[h*.07,h*.13,h*.04],'#ffffff'));},
 paddleTail:X=>{const t=X.tip;X.L('pad',t.par).s([0,t.pos[1]+.1,0],[.16,.22,.05],shade(X.C.a,.7)).t([[0,t.pos[1],-.03],[0,t.pos[1]+.26,-.05]],[.012,.008],shade(X.C.a,.55),4);},
 keyTail:X=>{const t=X.tip,G=X.L('keyG',t.par,'MG'),y=t.pos[1];G.g(torG(.25),mtx([0,y+.07,0],[0,Math.PI/2,0],[.06,.06,.06]),X.C.s);G.s([0,y+.18,0],[.018,.08,.018],X.C.s);[[.12,.04],[.17,.03]].forEach(([dy,w])=>G.s([0,y+dy,.03],[.015,.02,w],X.C.s));},
 plugTail:X=>{const t=X.tip,L=X.L('plug',t.par),G=X.L('plugG',t.par,'MG'),y=t.pos[1];L.g(cylG(10),mtx([0,y-.02,0],0,[.07,.09,.07]),X.C.b);[-1,1].forEach(s=>{L.g(cylG(6),mtx([s*.03,y+.07,0],0,[.014,.08,.014]),'#e8eef4');G.s([s*.03,y+.16,0],[.022,.022,.022],X.C.s);});},
 zigStripes:X=>{const L=X.L('body',X.bd),R=(X.r||.2)*1.04;X.back.slice(0,2).concat([[0,X.back[2][1],X.back[2][2]+.05]]).forEach((p,i)=>{const yc=p[1]-R*.98,pts=[];for(let k=0;k<=6;k++){const a=-1.3+k/6*2.6;pts.push([Math.sin(a)*R,yc+Math.cos(a)*R,p[2]+(k%2?.05:-.04)]);}L.t(pts,[R*.12,R*.12],X.C.b,6);});
  const h=X.hr;X.L('head',X.H).t([[-h*.3,h*.7,-h*.55],[0,h*.82,-h*.62],[h*.3,h*.7,-h*.55]],[h*.08,h*.09,h*.08],X.C.b,6);},
 boltMane:X=>{const G=X.L('maneG',X.bd,'MG'),N=X.neck;for(let i=0;i<4;i++){const t=i/3,p=[0,N[1]+.18-t*.28,N[2]+.02+t*.34];G.g(boltG(),mtx([p[0],p[1]+.08,p[2]],[0,Math.PI/2,-.5],[.2,.22+(i===1?.06:0),.16]),i%2?X.C.s:'#ffffff');}},
 rodHorn:X=>{const h=X.hr,L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),b=[0,h*.75,-h*.25];L.t([b,[0,h*1.5,-h*.15],[0,h*2.1,0]],[h*.1,h*.07,h*.05],X.C.b,8);[1.2,1.65].forEach(y=>G.g(torG(.3),mtx([0,h*y,-h*.13+y*h*.04],[Math.PI/2+.2,0,0],[h*.13,h*.13,h*.13]),X.C.s));G.s([0,h*2.15,0],[h*.12,h*.12,h*.12],X.C.s);},
 boltTail:X=>{const t=X.tip,s=X.body==='bird'?.3:.22;X.L('boltG',t.par,'MG').g(boltG(),mtx([0,t.pos[1]-.02,0],[0,Math.PI/2,0],s),X.C.s);},
 amber:X=>{const G=X.L('amberG',X.body==='pebble'?X.bd:X.bd,'MG'),pts=X.body==='pebble'?[[.08,.62,.06,.15,.2],[-.08,.6,.12,.1,-.5],[.2,.55,-.02,.08,.6]]:[[-.38,1.28,.06,.1,.6],[.42,1.24,.04,.08,-.5],[0,1.42,.2,.12,0]];pts.forEach(([x,y,z,s,a])=>G.g(crystalG(),mtx([x,y,z],[.2,a,a*.5],[s,s*1.8,s]),X.C.s));},
 crack:X=>{X.L('body',X.bd).t([[-.32,.56,-.1],[-.15,.66,-.02],[0,.62,.08],[.14,.68,.18],[.3,.56,.24]],[.018,.02,.02,.02,.016],X.C.d,5);},
 armorBands:X=>{const L=X.L('body',X.bd);for(let i=0;i<4;i++){const z=-.16+i*.17,y=1.0+Math.sin(i*.9+.3)*.06;L.s([0,y,z+.06],[.56,.36-Math.abs(i-1.5)*.03,.1],X.C.b,[-.15+i*.12,0,0],1);}},
 hornsStub:X=>{const L=X.L('head',X.H),h=X.hr;[-1,1].forEach(s=>L.g(coneG(6),mtx([s*h*.45,h*.55,-h*.2],[-.25,0,-s*.35],[h*.2,h*.55,h*.2]),X.C.hn));},
 iceCrown:X=>{const G=X.L('headG',X.H,'MG'),t=X.top,h=X.hr;[[0,1,0],[-1,.75,.4],[1,.75,-.4],[-2,.55,.75],[2,.55,-.75]].slice(0,X.stage>1?5:3).forEach(([j,s,a])=>G.g(crystalG(),mtx([t[0]+j*h*.17,t[1]-h*.1,t[2]+Math.abs(j)*h*.05],[0,0,a*.6],[h*.22,h*.62*s,h*.22]),j%2?'#ffffff':X.C.s));},
 fluff:X=>{const L=X.L('body',X.bd);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;L.s([Math.sin(a)*.44,.34+Math.cos(i*2.1)*.05,Math.cos(a)*.42],[.13,.12,.13],X.C.a);}[-1,0,1].forEach(j=>L.s([j*.1,.86-Math.abs(j)*.04,.04],[.09,.1,.09],X.C.a));},
 stubWings:X=>{X.U.arms.forEach((A,i)=>{const L=X.L('arm'+i,A.u);L.length=0;const s=A.s;for(let j=0;j<3;j++)L.s([s*(.04+j*.03),-.04-j*.05,.02+j*.02],[.07,.13-j*.02,.04],j?X.C.b:X.C.a,[0,0,s*(.4+j*.3)]);});},
 wispTail:X=>{X.tip=tailChain(X,X.bd,[0,X.hy+.08,.16],{n:4,L:.16,rx:2.0,curl:-.35,rad:[.1,.08,.06,.04,.01],cols:[X.C.a,X.C.a,mixC(X.C.a,X.C.b,.5),X.C.b]});},
 crescentHorns:X=>{const h=X.hr,G=X.L(X.leg?'headG':'head',X.H,X.leg?'MG':0),c=X.leg?X.C.s:X.C.b;[-1,1].forEach(s=>G.t([[s*h*.4,h*.55,h*.05],[s*h*.95,h*.85,h*.15],[s*h*1.05,h*1.35,h*.05],[s*h*.75,h*1.75,-h*.15]],[h*.16,h*.14,h*.08,.004],c,10));},
 cape:X=>{const g=grp(X.bd,0,X.sho[1]+.08,X.sho[2]+.02);g.rotation.x=.12;X.L('capeM',g).g(capeG(),mtx([0,0,0],0,[1.05,1.15,1]),shade(X.C.a,.75)).g(torG(.3),mtx([0,0,-.02],[Math.PI/2,0,0],[.26,.18,.2]),X.C.b);X.U.fx.cape=g;},
 claws:X=>{X.U.arms.forEach((A,i)=>{const L=X.L('al'+i,A.l),t=A.tip;[-1,0,1].forEach(j=>L.g(coneG(5),mtx([t[0]+j*.035,t[1]-.05,t[2]-.02],[Math.PI+.4,0,0],[.022,.12,.022]),X.C.hn));});},
 bugWings:X=>{const m=bmat(mixC(X.C.s,'#ffffff',.5),{transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide});X.U.fx.bug=[-1,1].map(s=>{const g=grp(X.bd,s*.1,.74,.28),q=mesh(gc('bugw',()=>mergeG([[sph(),mtx([.22,.06,0],[0,0,.25],[.24,.1,.012])],[sph(),mtx([.18,-.08,0],[0,0,-.3],[.17,.07,.012])]])),m,g,0,0,0,1);q.scale.x=s;q.userData.noOL=1;g.userData.s=s;return g;});},
 antennae:X=>{const h=X.hr,L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),t=X.top;[-1,1].forEach(s=>{const e=[t[0]+s*h*.45,t[1]+h*.65,t[2]-h*.2];L.t([[t[0]+s*h*.12,t[1],t[2]],[t[0]+s*h*.3,t[1]+h*.45,t[2]],e],[h*.04,h*.03,h*.025],X.C.b,6);G.s(e,[h*.11,h*.11,h*.11],X.C.s);});},
 sunCrest:X=>{const G=X.L('headG',X.H,'MG'),h=X.hr*1.3;for(let j=0;j<5;j++){const a=(j-2)*.36;G.t([[Math.sin(a)*h*.3,h*.7,h*.1],[Math.sin(a)*h*.75,h*(1.3+(j===2?.25:0)),h*.45],[Math.sin(a)*h*1.0,h*(1.75+(j===2?.35:0)),h*.7]],[h*.11,h*.07,.004],j%2?X.C.s:X.C.a,6);}},
 lanternPlumes:X=>{const tg=X.U.fan,G=X.L('fanG',tg,'MG');[-1,0,1].forEach(j=>{const a=j*.22,L=.62+(j?0:.16);G.s([-Math.sin(a)*L,Math.cos(a)*L,0],[.06,.07,.06],X.C.s);G.g(cylG(8),mtx([-Math.sin(a)*L,Math.cos(a)*L+.04,0],[0,0,a],[.04,.04,.04]),X.C.a);});},
 halo:X=>{const m=mesh(torG(.075),bmat(X.C.s),X.H,0,X.hr*(X.U.blob?1.12:1.5),X.hr*.08,X.hr*.55);m.rotation.x=Math.PI/2-.25;m.userData.noOL=1;m.userData.y0=m.position.y;X.U.fx.halo=m;},
 mossShell:X=>{const L=X.L('shell',X.bd),r=X.r,len=X.len,h=X.h;L.g(hemi(),mtx([0,h-.02,0],0,[r*1.55,r*1.25,len*.85]),X.C.a);L.g(torG(.16),mtx([0,h-.01,0],[Math.PI/2,0,0],[r*1.52,len*.84,.32]),X.C.b);
  for(let i=0;i<7;i++){const a=i*2.3,q=.45+.35*((i*37)%10)/10;L.s([Math.sin(a)*r*q*1.2,h+r*1.12*Math.sqrt(1-q*q*.6),Math.cos(a)*len*q*.6],[r*.32,r*.22,r*.32],mixC(X.C.a,'#ffffff',.12+(i%3)*.05));}X.shTop=[0,h+r*1.25,0];},
 flower:X=>{const p=X.shTop?[.06,X.shTop[1]-.01,-.06]:[0,X.hr*.9,0],par=X.shTop?X.bd:X.H,G=X.L(X.shTop?'flG':'headG',par,'MG'),s=X.stage>1?.1:.08;for(let k=0;k<5;k++){const a=k/5*Math.PI*2;G.s([p[0]+Math.sin(a)*s,p[1]+.02,p[2]+Math.cos(a)*s],[s*.75,s*.3,s*.75],X.C.s);}G.s([p[0],p[1]+.05,p[2]],[s*.45,s*.4,s*.45],'#fff2a0');},
 tree:X=>{const L=X.L('tree',X.bd),b=X.shTop||(()=>{const q=backPts(X,3)[1];return[q[0],q[1]-.04,q[2]];})(),ox=X.shTop?0:b[0],oz=X.shTop?0:b[2];L.t([[ox-.05,b[1]-.05,oz+.05],[ox-.06,b[1]+.22,oz+.08],[ox-.02,b[1]+.42,oz+.04]],[.06,.045,.035],X.C.hn,6);[[-.02,.55,.04,.2],[.13,.47,.1,.14],[-.17,.46,-.02,.15],[0,.48,-.13,.13]].forEach(([x,y,z,r])=>L.s([ox+x,b[1]+y,oz+z],[r,r*.85,r],mixC(X.C.a,'#ffffff',.08)));X.shTop=[ox+.1,b[1]+.62,oz-.02];},
 rockPlates:X=>{const L=X.L('body',X.bd);X.U.legs.forEach(l=>{L.s([l.u.position.x*1.15,l.u.position.y-.02,l.u.position.z],[.13,.09,.13],X.C.b,[0,0,l.s*.4],1);});X.L('head',X.H).s([0,X.hr*.72,-X.hr*.25],[X.hr*.55,X.hr*.22,X.hr*.5],X.C.b,0,1);},
 shellCrown:X=>{const L=X.L('head',X.H),h=X.hr;for(let j=0;j<5;j++){const a=(j-2)*.38;L.s([Math.sin(a)*h*.35,h*.85+Math.cos(a)*h*.35,h*.25],[h*.15,h*.42,h*.08],j%2?X.C.b:mixC(X.C.b,'#ffffff',.3),[-.5,0,-a]);}L.s([0,h*.82,h*.25],[h*.18,h*.12,h*.12],X.C.s);},
 backFin:X=>{X.L('body',X.bd).g(finG(),mtx([0,.56,.2],[0,-Math.PI/2,-.2],[.5,.5,.5]),X.C.s);X.L('head',X.H).g(finG(),mtx([0,X.hr*.7,X.hr*.35],[0,-Math.PI/2,.3],[.25,.25,.25]),X.C.b);},
 coralHorns:X=>{const L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),h=X.hr;[-1,1].forEach(s=>{const b=[s*h*.35,h*.7,h*.1],m=[s*h*.75,h*1.4,h*.3],t=[s*h*.7,h*2.0,h*.15];L.t([b,m,t],[h*.13,h*.1,h*.05],X.C.b,8);
  const c1=[s*h*1.25,h*1.75,h*.6],c2=[s*h*.3,h*1.55,-h*.2];L.t([m,c1],[h*.08,h*.04],X.C.b,6);L.t([[s*h*.6,h*1.2,h*.25],c2],[h*.07,h*.035],X.C.b,6);[t,c1,c2].forEach(p=>G.s(p,[h*.09,h*.09,h*.09],X.C.s));});},
 arms:X=>{const sp=X.body==='seahorse';[-1,1].forEach((s,i)=>X.U.arms.push(mkArm(X,sp?X.bd:X.U.serp[5].g,sp?[s*.17*X.K.w,.66,-.08]:[s*.2,.1,-.12],{s,r:sp?.04:.06,l1:sp?.12:.18,l2:sp?.1:.16,rz:.5,col:X.C.a,hc:X.C.a},'x'+i)));},
 sunDisc:X=>{const g=grp(X.bd,0,X.sho[1]+.18,X.sho[2]+.22),G=X.L('discG',g,'MG');G.g(torG(.1),mtx([0,0,0],0,[.5,.5,.5]),X.C.s);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;G.g(coneG(4),mtx([Math.sin(a)*.52,Math.cos(a)*.52,0],[0,0,-a],[.07,i%2?.22:.32,.03]),i%2?X.C.a:X.C.b);}X.U.spin.push([g,'z',.25]);},
 flamePlumes:X=>{const tg=X.U.fan;[-1,0,1].forEach(j=>{const a=j*.22,L=.5+(j?0:.16);flame(X,tg,[-Math.sin(a)*L,Math.cos(a)*L,0],.5,X.fc).rotation.set(0,0,a+Math.PI*.05);});},
 aura:X=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:auraTex(),color:X.C.s,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));sp.renderOrder=-1;X.U.aura=sp;X.U.root.add(sp);},
 bands:X=>{const m=bmat(X.C.s,{transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});X.U.fx.bands=[0,1].map(i=>{const g=grp(X.U.base,0,0,0),q=mesh(torG(.012),m,g,0,0,0,.8);q.userData.noOL=q.userData.fxOnly=1;g.userData.i=i;return g;});},
 batWings:X=>{const sp=hasSerp(X),p=sp?X.U.serp[6].g:X.bd,o=sp?[0,.14,.14]:(X.sho||backPts(X,3)[0]);[-1,1].forEach(s=>X.U.wings.push(wingRig(X,p,s,[s*(sp?.1:.16),o[1],o[2]],{L:[.26,.3,.32],F:[.34,.44,.3],br:.045,mem:1,ws:1.6,rest:.15,cm:mixC(X.C.a,X.C.b,.35)})));},
 iceSpines:X=>{if(!hasSerp(X)){const G=X.L('iceB',X.bd,'MG');backPts(X,5).forEach((p,k)=>G.g(crystalG(),mtx([p[0],p[1]-.03,p[2]],[-.35,0,0],[.07,.18+k%2*.08,.07]),k%2?'#ffffff':X.C.s));return;}[2,3,4,5,6,7].forEach((i,k)=>{const q=X.U.serp[i],G=X.L('sgG'+i,q.g,'MG'),p=X.segTop(i);G.g(crystalG(),mtx(p,[.5,0,0],[.07,.2+k%2*.08,.07]),k%2?'#ffffff':X.C.s);});},
 propCrest:X=>{const g=grp(X.H,0,X.hr*1.0,X.hr*.15),L=X.L('prop',g,'MG');for(let i=0;i<3;i++){const a=i/3*Math.PI*2;L.s([Math.sin(a)*X.hr*.35,Math.cos(a)*X.hr*.35,0],[X.hr*.12,X.hr*.38,X.hr*.04],X.C.b,[0,0,-a]);}L.s([0,0,0],[X.hr*.1,X.hr*.1,X.hr*.1],X.C.s);g.rotation.x=-.4;X.U.spin.push([g,'z',3]);},
 zigWings:()=>{},iceWings:()=>{},tailLong:()=>{},forkTail:()=>{},iceTail:()=>{},tail:()=>{},
 cloud:X=>{const L=X.L('body',X.bd);[[0,.62,.05,.3],[-.28,.5,.08,.22],[.28,.5,.08,.22],[-.18,.76,.12,.2],[.18,.76,.12,.2],[0,.82,.2,.2],[-.3,.3,.12,.2],[.3,.3,.12,.2],[0,.36,.3,.24],[0,.62,.32,.22]].forEach(([x,y,z,r])=>L.s([x,y,z],[r,r*.9,r],X.C.a));X.L('head',X.H).s([0,-.02,-.3],[.3,.28,.18],X.C.b);X.eye=[.36,.06,.92,.2,.34];},
 ramHorns:X=>{const L=X.L('head',X.H),h=X.hr*(X.body==='bird'?1.15:.75),y0=X.body==='bird'?X.hr*.25:.18;[-1,1].forEach(s=>{const P=[];for(let k=0;k<=7;k++){const a=k/7*Math.PI*1.6,r=h*(.42-k*.035);P.push([s*(X.hr*.62+h*.12+Math.sin(a)*r*.35),y0+Math.cos(a)*r,X.hr*.05+Math.sin(a)*r]);}L.t(P,[h*.13,h*.1,h*.06,h*.02],X.C.b,8);});},
 cloudCollar:X=>{const L=X.L('body',X.bd),N=X.neck;for(let i=0;i<7;i++){const a=-2+i/6*4;L.s([N[0]+Math.sin(a)*X.nr*1.6,N[1]+Math.cos(a)*X.nr*.5-.06,N[2]+Math.cos(a)*X.nr*1.0+.04],[.09,.08,.09],X.C.b);}},
 helmet:X=>{const L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),h=X.hr;L.g(hemi(),mtx([0,h*.42,h*.06],[-.28,0,0],[h*1.04,h*.72,h*1.0]),X.C.hn);L.g(torG(.12),mtx([0,h*.42,h*.06],[Math.PI/2-.28,0,0],[h*1.03,h*1.0,.6]),shade(X.C.hn,.75));L.g(cylG(10),mtx([0,h*.86,-h*.62],[-1.1,0,0],[h*.2,h*.12,h*.2]),shade(X.C.hn,.75));G.g(crystalG(),mtx([0,h*.95,-h*.74],[-1.15,0,0],[h*.2,h*.34,h*.2]),X.C.s);},
 diggers:X=>{const big=X.body==='golem';(big?X.U.arms:X.U.legs.filter(l=>l.front)).forEach((A,i)=>{const L=big?X.L('al'+i,A.l):X.L('ll'+X.U.legs.indexOf(A),A.l),t=big?A.tip:A.foot,sc=big?1.6:1;
  for(let j=-1;j<=1;j++)L.t([[t[0]+j*.04*sc,t[1]-.02,t[2]-.04*sc],[t[0]+j*.05*sc,t[1]-.08*sc,t[2]-.12*sc],[t[0]+j*.055*sc,t[1]-.06*sc,t[2]-.2*sc]],[.03*sc,.02*sc,.003],X.C.hn,6);});},
 ore:X=>{const G=X.L('oreG',X.bd,'MG');[[-.22,1.25,.25,.12,.5],[.05,1.36,.28,.16,-.2],[.28,1.22,.24,.1,-.6],[-.05,1.12,.4,.1,.9]].forEach(([x,y,z,s,a])=>G.g(crystalG(),mtx([x,y,z],[.6,0,a],[s,s*2,s]),X.C.s));},
 bulbCrest:X=>{const h=X.hr,L=X.L('head',X.H),G=X.L('headG',X.H,'MG');[0,1].forEach(k=>L.g(torG(.3),mtx([0,h*(.85+k*.12),h*.05],[Math.PI/2,0,0],[h*.2,h*.2,h*.25]),X.C.b));G.s([0,h*1.32,h*.08],[h*.34,h*.4,h*.34],X.C.s);L.t([[-h*.1,h*1.05,h*.08],[-h*.05,h*1.3,h*.08],[h*.05,h*1.2,h*.08],[h*.1,h*1.42,h*.08]],[h*.03,h*.03,h*.03,h*.03],'#ff9a3a',4);},
 lavaBlobs:X=>{if(!hasSerp(X)){const G=X.L('lavaB',X.bd,'MG');backPts(X,5).forEach((p,k)=>{const s=k%2?.06:-.06,r=.05+k%3*.015;G.s([p[0]+s,p[1]+r*.4,p[2]],[r,r,r],X.C.s);});return;}[1,2,3,4,5,6].forEach((i,k)=>{const q=X.U.serp[i],G=X.L('sgG'+i,q.g,'MG');[[.55,.2],[-.6,.55]].forEach(([s,t],j)=>{if((k+j)%2)G.s([q.d[0]*t+s*q.r*.6,q.d[1]*t+q.r*.4,q.d[2]*t],[q.r*.5,q.r*.5,q.r*.5],X.C.s);});});},
 flameFin:X=>{[3,5,6].forEach((i,k)=>{const q=X.U.serp[i];flame(X,q.g,X.segTop(i),.7+k*.12,X.fc);});},
 geode:X=>{const G=X.L('geoG',X.bd,'MG'),L=X.L('body',X.bd);[[0,.82,-.4,.12,0],[-.12,.76,-.36,.09,.5],[.12,.78,-.36,.1,-.5],[.04,.66,-.36,.08,.2],[-.06,.92,-.35,.08,-.3]].forEach(([x,y,z,s,a])=>G.g(crystalG(),mtx([x*1.3,y,z-.04],[-1.2,0,a],[s*1.5,s*2.6,s*1.5]),X.C.s));
  L.s([0,.8,-.31],[.3,.3,.12],shade(X.C.b,.7),0,1);[-1,1].forEach(s=>L.s([s*.48,1.15,.05],[.22,.2,.24],X.C.b,[0,0,s*.4],1));[[-.25,1.3,.1],[.25,1.32,.12],[0,1.25,.3]].forEach(p=>G.g(crystalG(),mtx(p,[.3,0,p[0]*-1.6],[.1,.26,.1]),X.C.a));},
 crystalHorns:X=>{const G=X.L('headG',X.H,'MG'),h=X.hr;[-1,1].forEach(s=>G.g(crystalG(),mtx([s*h*.5,h*.6,-h*.1],[0,0,-s*.5],[h*.2,h*.55,h*.2]),X.C.s));},
 clockFace:X=>{const L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),h=X.hr;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;G.s([Math.sin(a)*h*.74,-h*.04+Math.cos(a)*h*.68,-h*.82+Math.abs(Math.sin(a))*h*.18],[h*.045,h*.045,h*.03],X.C.s);}
  L.t([[0,-h*.04,-h*.93],[-h*.02,h*.4,-h*.9]],[h*.035,h*.02],X.C.d,4);L.t([[0,-h*.04,-h*.93],[h*.3,h*.1,-h*.88]],[h*.035,h*.02],X.C.d,4);},
 earTufts:X=>{const L=X.L('head',X.H),h=X.hr;[-1,1].forEach(s=>{L.t([[s*h*.55,h*.6,0],[s*h*.75,h*1.0,h*.05],[s*h*.95,h*1.35,h*.12]],[h*.2,h*.12,.004],X.C.a,8);L.t([[s*h*.55,h*.62,-h*.06],[s*h*.72,h*.95,-h*.04]],[h*.1,h*.03],X.C.b,6);});},
 prism:X=>{const G=X.L('headG',X.H,'MG'),t=X.top;G.g(gc('prism3',()=>{const g=new THREE.CylinderGeometry(.5,.5,1,3).toNonIndexed();g.computeVertexNormals();return g;}),mtx([t[0],t[1]+.12,t[2]],[0,.4,Math.PI/2],[.12,.2,.12]),X.C.s);
  const rb=mesh(gc('rainbow',()=>{const P=[],cs=['#ff6a6a','#ffb04a','#ffe46a','#7fe07a','#6ac8ff','#a88aff'];cs.forEach((c,i)=>P.push([torG(.035,Math.PI),mtx([0,0,0],0,1-i*.065),c]));return mergeG(P);}),bmat('#ffffff',{vertexColors:true}),X.H,0,t[1]+.04,.16,.42);rb.userData.noOL=1;},
 cloudMane:X=>{if(!hasSerp(X)){const G=X.L('cloudB',X.bd);backPts(X,3).forEach((p,k)=>G.s([p[0],p[1]+.02,p[2]],[.15-k*.02,.11,.14],'#ffffff').s([p[0]+(k%2?.08:-.08),p[1]+.07,p[2]+.05],[.09,.08,.09],X.C.a));if(X.H)X.L('head',X.H).s([0,X.hr*.75,X.hr*.35],[X.hr*.42,X.hr*.32,X.hr*.42],'#ffffff');return;}[4,5,6,7].forEach(i=>{const q=X.U.serp[i],p=X.segTop(i);X.L('sg'+i,q.g).s([p[0],p[1],p[2]+.06],[.15,.12,.15],'#ffffff').s([p[0],p[1]+.06,p[2]+.15],[.1,.09,.1],X.C.a);});X.L('head',X.H).s([0,X.hr*.75,X.hr*.35],[X.hr*.42,X.hr*.32,X.hr*.42],'#ffffff');},
 ribbonTail:X=>{if(!hasSerp(X)){const t=X.tip||{par:X.bd,pos:backPts(X,3)[2]},L=X.L('ribB',t.par),p=t.pos;[-1,1].forEach(s=>L.g(coneG(3),mtx([p[0]+s*.02,p[1],p[2]],[0,0,s*(Math.PI/2+.2)],[.07,.13,.025]),X.C.b));L.s(p,[.04,.04,.04],X.C.s);L.t([[p[0],p[1],p[2]],[p[0]+.1,p[1]-.04,p[2]+.15],[p[0]+.05,p[1]-.06,p[2]+.3]],[.03,.02,.004],X.C.b,6);return;}[0,1].forEach(i=>{const q=X.U.serp[i],L=X.L('sg'+i,q.g),p=[q.d[0]*.5,q.d[1]*.5+q.r*.6,q.d[2]*.5];[-1,1].forEach(s=>L.g(coneG(3),mtx([p[0]+s*.02,p[1],p[2]],[0,0,s*(Math.PI/2+.2)],[.07,.13,.025]),X.C.b));L.s(p,[.04,.04,.04],X.C.s);});
  X.L('sg0',X.U.serp[0].g).t([[0,0,0],[.1,-.04,.15],[.05,-.06,.3],[.16,-.05,.42]],[.03,.025,.02,.004],X.C.b,6);},
 leafEars:X=>{const{U,C}=X,hr=X.hr;[-1,1].forEach((s,i)=>{const g=grp(X.H,s*hr*.72,hr*.42,hr*.05);g.rotation.set(.1,0,-s*1.05);g.userData.rz0=-s*1.05;X.L('ear'+i,g).g(leafG(),mtx([0,0,0],[0,-s*.3,0],[hr*.55,hr*1.0,hr*.55]),mixC(C.a,'#ffffff',.12)).t([[0,0,-.01],[0,hr*.75,-.02]],[hr*.04,hr*.01],shade(C.a,.7),4);U.ears.push(g);});},
 leafPads:X=>{const L=X.L('body',X.bd);[-1,1].forEach(s=>[0,1,2].forEach(j=>L.g(leafG(),mtx([s*(X.nr*2.0+j*.03),X.sho[1]+.06-j*.05,-.02+j*.06],[-.3,s*.4,-s*(1.25+j*.25)],[.2,.32-j*.04,.2]),j%2?shade(X.C.a,.82):mixC(X.C.a,'#ffffff',.1))));},
 moonMark:X=>{const G=X.L('markG',X.bd,'MG');G.g(torG(.32,Math.PI*1.25),mtx([0,X.hy+.42,-.33*X.K.w*1.18],[0,0,-.9],[.09,.09,.09]),X.C.s);},
 forearmPlates:X=>{X.U.arms.forEach((A,i)=>X.L('al'+i,A.l).s([0,-.1,.02],[.17,.14,.17],X.C.b,[.2,0,0],1));X.L('head',X.H).s([0,X.hr*.62,-X.hr*.1],[X.hr*.7,X.hr*.3,X.hr*.7],X.C.b,0,1);},
 shoulderOre:X=>{const G=X.L('oreG',X.bd,'MG');[-1,1].forEach(s=>[[.0,.12,.0,.1,.3],[.08,.04,.08,.07,.9]].forEach(([x,y,z,q,a])=>G.g(crystalG(),mtx([s*(.5+x),1.16+y,z],[0,0,-s*a],[q,q*2.2,q]),X.C.s)));},
 whiskers:X=>{const L=X.L('head',X.H),h=X.hr;[-1,1].forEach(s=>L.t([[s*h*.35,-h*.1,-h*1.1],[s*h*.9,-h*.2,-h*.8],[s*h*1.4,-h*.5,-h*.2],[s*h*1.5,-h*.7,h*.3]],[h*.05,h*.04,h*.03,.003],X.C.b,5));}};
function auraTex(){return cvTex('aura',128,128,x=>{const g=x.createRadialGradient(64,64,6,64,64,63);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.35,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);});}
function evoStage(id){let s=1,k=id;for(let n=0;n<4;n++){const p=MONS.findIndex(m=>m&&m.ev&&m.ev.to===k);if(p<1)break;s++;k=p;}return s;}
function hueC(c,deg,sat){const C=new THREE.Color(c),o={};C.getHSL(o);C.setHSL((o.h+deg/360+1)%1,Math.min(1,sat?Math.max(o.s*sat,.45):o.s),sat?Math.max(.3,Math.min(.68,o.l)):o.l);return'#'+C.getHexString();}
// Farben: [Haupt, Zweit, Signatur]; Glanzform = bewusst gewählte Kontrastpalette (shinyCols), sonst Hue-Shift
function monCols(M,o){let c1=M.sp[1],c2=M.sp[2],c3=M.sp[5]||M.sp[2];if(o.form&&o.form!=='normal'&&o.form!=='standard'){c1=hueC(c1,40);c2=hueC(c2,25);c3=hueC(c3,30);}
 if(o.shiny){if(M.shinyCols){c1=M.shinyCols[0];c2=M.shinyCols[1]||c2;c3=M.shinyCols[2]||c3;}else{c1=hueC(c1,150,1.05);c3=hueC(c3,150,1.05);}}return[c1,c2,c3];}
// ---------- Aufbau ----------
function buildMon3D(id,h,opts){if(typeof terraOf==='function'&&terraOf(id))return buildTerra(id,h,opts);opts=opts||{};artSpec(id);const M=MONS[id],body=bodyOf(M),feats=M.sp[3]||[],tun=M.sp[7]||{},stg=evoStage(id),[c1,c2,c3]=monCols(M,opts),sc=M.sp[4]*(opts.gender==='m'?1.04:1),loc=LOC[body]||'blob',
 root=new THREE.Group(),base=grp(root,0,0,0),bd=grp(base,0,0,0),leg=!!M.legend,fierce0=feats.some(f=>/horn|Horn|spike|Spike|basalt|claws/.test(f))||leg||M.t[0]==='schatten'||stg>=3,cute0=stg===1&&!!M.ev&&!fierce0,
 dk=mixC(shade(c1,.38),'#2a2633',.35),C={a:c1,b:c2,s:c3,d:dk,m:mixC(c1,'#ffffff',.5),k:'#2b1d26',p:mixC(c2,'#ff9fb0',.35),hn:mixC(c2,'#c9b08a',.45),bk:M.t.includes('schatten')?'#e8c25a':mixC(c3,'#f2a93b',.55)},
 MB=celMat(.5),MG=celMat(.35,c3,.5),U={legs:[],arms:[],wings:[],eyes:[],brows:[],serp:[],tail:[],ears:[],flames:[],spin:[],fx:{},body:bd,base,root,sh:loc,blob:loc==='blob'||loc==='float',seed:id*1.7,mats:[MB],gmats:[MG],MB,MG,act:{},stage:stg,
  K:{glow:leg?.18:(M.t.includes('lumen')?.1:0)},glowC:null},
 has=k=>feats.includes(k),def={1:{h:1.22,l:.86},2:{h:1,l:1},3:{h:.88,l:1.1}}[Math.min(3,stg)],K=Object.assign({w:1,len:1,n:1,t:1,h:def.h,l:def.l},tun);if(leg){K.h=tun.h||.9;}
 const fierce=K.fierce!=null?!!K.fierce:fierce0,cute=K.cute!=null?!!K.cute:cute0;
 const ck=id+'|'+c1+c2+c3+'|',LS={},X={U,C,K,body,bd,has,stage:stg,leg,M,id,ck,fc:[opts.shiny||!M.t.includes('glut')?mixC(c3,'#3a4aff',.15):'#ff6418',mixC(c3,'#ffffff',.3)],
  L:(n,par,mat)=>{if(!LS[n])LS[n]={par,L:PL(),mat:mat||0};else if(par&&!LS[n].par)LS[n].par=par;return LS[n].L;}};
 X.paw=K.paw;X.earIn=K.earIn;X.earOut=K.earOut;X.dt=K.dt;if(K.beak)C.bk=K.beak;
 // Körper
 if(body==='seal')bSeal(X);else if(body==='bearsit')bBearSit(X);else if(body==='bunny')bBunny(X);else if(loc==='quad')bQuad(X);else if(body==='blob'||body==='plant'||body==='pebble')bBlob(X);else if(loc==='float')bFloat(X);else if(loc==='serpent')bSerp(X);else if(loc==='golem')bGolem(X);else if(loc==='biped')bBiped(X);else bBird(X);
 // Merkmale
 feats.forEach(f=>{if(FEAT[f])try{FEAT[f](X);}catch(e){console.warn('Merkmal',f,e);}});
 // Listen → Meshes (gecacht je Art/Palette)
 for(const n in LS){const q=LS[n];if(!q.L.length||!q.par)continue;const m=new THREE.Mesh(gc(ck+n,()=>mergeG(q.L)),q.mat==='MG'?MG:MB);q.par.add(m);}
 const H=X.H,hr=X.hr;U.head=H;U.hr=hr;U.hk=!!LS.head&&LS.head.L.length&&!U.blob;
 // Gesicht: Augen (2 Glanzpunkte, Lidlinie), Brauen, Mund, Wangen
 const glow=K.glowEyes!=null?!!K.glowEyes:M.t.includes('schatten')||leg,iris=K.iris?K.iris:glow?(M.t.includes('schatten')?'#f2e14c':'#ffcf5a'):M.t.includes('frost')||M.t.includes('flut')?'#2f78b8':M.t.includes('flora')?'#3a8a3a':M.t.includes('volt')?'#3a3550':M.t.includes('lumen')?'#c87a1a':'#6a3a1e';
 const eM=new THREE.MeshBasicMaterial({alphaTest:.5}),mM=new THREE.MeshToonMaterial({gradientMap:monGrad(),alphaTest:.5}),bwM=bmat(shade(c1,.3));
 const[ex,ey,ez,er0,ery]=X.eye,er=er0*hr*(cute?1.15:1.04)*(K.eye||1);
 U.face={glow,sty:K.eyeSty||(glow?'glow':fierce?'sharp':cute?'round':'normal'),iris,skin:shade(c1,.97),eM,mM,ms:X.mo?X.mo[4]:null,fang:fierce||has('catEars')};
 [-1,1].forEach(s=>{const e=grp(H,s*ex*hr,ey*hr,-ez*hr);e.rotation.y=-s*ery;e.rotation.x=ey*.4;mesh(eyeGeo(s<0?-1:1),eM,e,0,0,0,er*.98,er*1.14,er*.5).userData.noOL=1;U.eyes.push({e,s});
  const bg=grp(e,0,er*1.3,0);bg.rotation.x=.3;const b=mesh(browG(s),bwM,bg,0,0,0,er,er,er);b.userData.noOL=1;U.brows.push({g:bg,s,y0:er*1.3,er});});
 if(cute){const bl=mesh(gc('blush'+[ex,ey,ez,er].map(v=>v.toFixed(3)),()=>mergeG([-1,1].map(s=>[sph(),mtx([s*ex*hr*1.08,ey*hr-er*1.25,-ez*hr*.93],[0,-s*ery,0],[er*.5,er*.26,er*.2])]))),bmat('#ff8fa3',{transparent:true,opacity:.55,depthWrite:false}),H,0,0,0,1);bl.userData.noOL=1;}
 if(X.mo){const[mx,my,mz,mr,,mw]=X.mo,mg=grp(H,mx*hr,my*hr,mz*hr);mg.rotation.x=mr;mesh(eyeGeo(1),mM,mg,0,0,mw*hr*.08,mw*hr*2.3,mw*hr*1.7,mw*hr*.34).userData.noOL=1;U.mouth=mg;}
 // Geschlecht: m = kantige Stirnmarke, w = runder Akzent
 if(opts.gender==='m'||opts.gender==='w'){const gm=opts.gender==='m',g=mesh(gm?gc('gm',()=>new THREE.ConeGeometry(1,1.6,3)):sph(),bmat(gm?shade(c2,.85):mixC(c2,'#ff8fb0',.55)),H,gm?0:hr*.55,gm?hr*.66:hr*.48,gm?-hr*.66:-hr*.42,hr*(gm?.08:.09));if(gm)g.rotation.x=-1.2;g.userData.noOL=1;}
 // Haltung je Art: Neigung (Asymmetrie), Gewicht auf einem Bein
 const hv=hs(id,77);U.tilt=(hv>.5?1:-1)*(.025+hv*.02);U.htilt=(hs(id,13)>.5?1:-1)*(.1+hs(id,19)*.08);U.cute=cute;
 if(loc==='serpent'){const ry=K.rise?1:Math.max(.8,Math.min(1.4,.9+hv*.3));base.scale.y=ry;H.scale.y/=ry;}
 base.updateMatrixWorld(true);{const bx=new THREE.Box3();base.traverse(o=>{if(o.isMesh&&!o.userData.fxOnly){o.geometry.boundingBox||o.geometry.computeBoundingBox();bx.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
  base.position.y=-bx.min.y+(U.hover||0);const sz=bx.getSize(new THREE.Vector3());U.baseH=Math.max(.5,sz.y+(U.hover||0)*.5,Math.max(sz.x,sz.z)*.62);}
 U.hip=(U.legs[0]&&!U.blob?Math.max(.1,U.legs[0].u.position.y):.3);
 if(U.aura){U.aura.position.y=U.baseH*.5;U.aura.scale.setScalar(U.baseH*1.9);}
 if(U.fx.bands)U.fx.bands.forEach(g=>{g.position.y=U.baseH*(.35+g.userData.i*.3);g.children[0].scale.setScalar(U.baseH*(.62-g.userData.i*.08));});
 // Glanzform: Funkeln (1 Draw-Call)
 if(opts.shiny){const n=10,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  const pt=new THREE.Points(g,new THREE.PointsMaterial({color:'#fff3b0',size:.11,map:typeof dotTex==='function'?dotTex():null,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));pt.frustumCulled=false;root.add(pt);U.fx.spark=pt;U.shiny=1;}
 // Umrisslinien mit Budget (≤ 60 Meshes je Kreatur), größte Teile zuerst
 const OL=monOl(mixC(shade(c1,.22),'#1a1420',.45)),ms=[];let n0=0;root.traverse(o=>{if(!o.isMesh)return;n0++;if(o.userData.noOL||o.userData.ol||o.material.isMeshBasicMaterial||o.material.isShaderMaterial)return;o.geometry.boundingSphere||o.geometry.computeBoundingSphere();
  const s=o.geometry.boundingSphere.radius*Math.max(o.scale.x,o.scale.y,o.scale.z);if(s>.03)ms.push([o,s]);});
 ms.sort((a,b)=>b[1]-a[1]);U.ols=[];ms.forEach(([o,s],i)=>{if(i<4)o.castShadow=true;o.receiveShadow=true;if(i>=MONMAX-n0)return;const l=new THREE.Mesh(o.geometry,OL);l.userData.ol=1;o.add(l);U.ols.push(l);});
 // Detailstufen für die Oberwelt: 1 = ohne Kleinteile/Umrisse, 2 = nur Grundkörper
 const all=[];root.traverse(o=>{if(o.isMesh&&!o.userData.ol){o.geometry.boundingSphere||o.geometry.computeBoundingSphere();const w=new THREE.Vector3();o.getWorldScale(w);all.push([o,o.geometry.boundingSphere.radius*Math.max(w.x,w.y,w.z)]);}});
 all.sort((a,b)=>b[1]-a[1]);const face=new Set(U.eyes.map(E=>E.e.children[0]));if(U.mouth)face.add(U.mouth.children[0]);U.lod1=all.filter(([o],i)=>i>=12&&!face.has(o)).map(q=>q[0]);U.lod2=all.filter(([o],i)=>i>=6).map(q=>q[0]);
 root.scale.setScalar((h||1)*sc/U.baseH);root.userData=U;setFace(U,'neutral','neutral');animMon(root,0,{still:true,pose:opts.pose});return root;}
const MONMAX=60;
// ---------- Mimik ----------
// Augen-Kuppel mit planarer Projektion (fl spiegelt für das rechte Auge → Innenseite immer links in der Textur)
function eyeGeo(fl){return gc('eyeD'+fl,()=>{const g=new THREE.SphereGeometry(1,18,12),p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)*.5*fl,.5+p.getY(i)*.5);return g;});}
// Braue: verjüngt, Innenseite (zur Kopfmitte) kräftiger
function browG(s){return gc('brow'+s,()=>tubeG([[s*.55,-.06,0],[s*.05,.1,0],[-s*.55,.02,0]],[.15,.12,.05],6));}
function cvTex(k,w,h,fn){if(M3.tex[k])return M3.tex[k];const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.lineCap=x.lineJoin='round';fn(x);const t=new THREE.CanvasTexture(c);t.anisotropy=2;return M3.tex[k]=t;}
// Augenzustände: neutral|freudig|wuetend|muede|verletzt|zu  (Anime: Lidlinie, Iris 2-stufig, zwei Glanzpunkte)
function eyeTex(sty,iris,skin,st){return cvTex(['e2',sty,iris,skin,st].join(),128,128,x=>{x.scale(2,2);const dk='#1a1222',gl=sty==='glow',arc=(c,w)=>{x.strokeStyle=dk;x.lineWidth=w;x.beginPath();x.moveTo(9,36-c*.25);x.quadraticCurveTo(32,36+c,55,36-c*.25);x.stroke();};
 if(st==='freudig'){arc(-17,7.5);return;}if(st==='zu'){arc(7,6);x.lineWidth=3;x.beginPath();x.moveTo(53,34);x.lineTo(59,30);x.stroke();return;}
 if(st==='verletzt'){x.strokeStyle=dk;x.lineWidth=7;x.beginPath();x.moveTo(52,18);x.lineTo(14,33);x.lineTo(52,48);x.stroke();x.fillStyle='#7fd0ff';x.beginPath();x.moveTo(52,46);x.quadraticCurveTo(60,56,55,60);x.quadraticCurveTo(48,60,52,46);x.fill();return;}
 x.save();x.beginPath();x.ellipse(32,33,27,29,0,0,7);x.clip();x.fillStyle=gl?'#fff4b8':'#ffffff';x.fillRect(0,0,64,64);if(sty!=='big'&&sty!=='ani'&&sty!=='slit'){x.fillStyle='rgba(120,130,170,.28)';x.fillRect(0,0,64,15);}
 const an=sty==='ani'||sty==='slit',bg=sty==='big'||an,ir=an?(st==='wuetend'?24:31):bg?(st==='wuetend'?20:24):st==='wuetend'?14:17,iy=st==='muede'?40:bg?34:35;x.save();x.beginPath();x.ellipse(32,iy,ir*.9,ir*1.05,0,0,7);x.clip();x.fillStyle=shade(iris,gl?1.0:1.0);x.fillRect(0,0,64,64);x.fillStyle=shade(iris,gl?.7:.55);x.fillRect(0,0,64,iy-ir*.25);
 x.fillStyle=shade(iris,gl?1.25:1.55);x.beginPath();x.ellipse(32,iy+ir*.75,ir*.75,ir*.45,0,0,7);x.fill();x.restore();
 x.fillStyle=dk;x.beginPath();if(gl||sty==='slit')x.ellipse(32,iy,sty==='slit'?4:3.2,ir*.8,0,0,7);else x.ellipse(32,iy+1,st==='wuetend'?5:bg?9:7,st==='wuetend'?6:bg?11:8.5,0,0,7);x.fill();
 x.fillStyle='#fff';x.beginPath();x.ellipse(bg?42:41,iy-(bg?9:8),bg?7.5:6,bg?8.5:7,-.4,0,7);x.fill();x.beginPath();x.arc(bg?23:24,iy+(bg?10:8),bg?3.6:2.8,0,7);x.fill();
 const lid=P=>{x.fillStyle=skin;x.beginPath();x.moveTo(-4,-4);P.forEach(p=>x.lineTo(p[0],p[1]));x.lineTo(68,-4);x.closePath();x.fill();x.strokeStyle=dk;x.lineWidth=4;x.beginPath();P.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();};
 if(st==='wuetend')lid([[-4,30],[68,10]]);else if(st==='muede')lid([[-4,30],[32,33],[68,30]]);else if(sty==='sharp')lid([[-4,16],[68,8]]);
 x.restore();x.strokeStyle=dk;x.lineWidth=an?1.2:2.4;x.beginPath();x.ellipse(32,33,27,29,0,.15,Math.PI-.15);x.stroke();
 // Lidlinie oben, kräftig, mit Schwung an der Außenseite
 x.lineWidth=an?5:6.5;x.beginPath();x.ellipse(32,33,27,29,0,Math.PI+.05,Math.PI*2-.02);x.stroke();if(!an){x.lineWidth=4;x.beginPath();x.moveTo(57,27);x.quadraticCurveTo(61,22,63,17);x.stroke();}});}
// Mundzustände je Stil (w|u|line): neutral|freudig|wuetend|muede|verletzt|auf
function mouthTex(ms,st,fang){return cvTex(['m',ms,st,fang?1:0].join(),64,64,x=>{const dk='#3a1e2a',L=(pts,w)=>{x.strokeStyle=dk;x.lineWidth=w||5;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();},
 fill=(f)=>{x.fillStyle='#5a1a2a';x.beginPath();f();x.fill();x.strokeStyle=dk;x.lineWidth=3.5;x.stroke();},tongue=(y)=>{x.save();x.clip();x.fillStyle='#ff8a9c';x.beginPath();x.ellipse(32,y,11,7,0,0,7);x.fill();x.restore();},
 fangs=y=>{x.fillStyle='#fff';[[24,1],[40,-1]].forEach(([fx])=>{x.beginPath();x.moveTo(fx-3.5,y);x.lineTo(fx+3.5,y);x.lineTo(fx,y+6);x.closePath();x.fill();});};
 if(st==='freudig'){fill(()=>{x.moveTo(14,28);x.quadraticCurveTo(32,30,50,28);x.quadraticCurveTo(48,50,32,50);x.quadraticCurveTo(16,50,14,28);});x.beginPath();x.moveTo(14,28);x.quadraticCurveTo(32,30,50,28);x.quadraticCurveTo(48,50,32,50);x.quadraticCurveTo(16,50,14,28);tongue(46);if(fang)fangs(28);return;}
 if(st==='auf'){fill(()=>x.ellipse(32,36,10,12,0,0,7));x.beginPath();x.ellipse(32,36,10,12,0,0,7);tongue(44);if(fang)fangs(25);return;}
 if(st==='wuetend'){fill(()=>{x.moveTo(15,40);x.quadraticCurveTo(32,22,49,40);x.quadraticCurveTo(32,34,15,40);});x.fillStyle='#fff';x.fillRect(22,31,20,4);return;}
 if(st==='muede'){L([[20,36],[27,34],[33,37],[39,34],[45,36]],4.5);return;}
 if(st==='verletzt'){x.fillStyle='#fff';x.fillRect(18,30,28,9);x.strokeStyle=dk;x.lineWidth=4;x.strokeRect(18,30,28,9);L([[25,30],[25,39]],2);L([[32,30],[32,39]],2);L([[39,30],[39,39]],2);return;}
 if(ms==='w')L([[14,28],[22,36],[32,30],[42,36],[50,28]]);else if(ms==='u')L([[16,28],[24,35],[32,37],[40,35],[48,28]]);else L([[12,30],[24,35],[40,35],[52,30]]);if(fang)fangs(ms==='line'?33:32);});}
// Brauen je Ausdruck: [Winkel innen, Höhe]
const BROW={neutral:[.08,0],freudig:[-.12,.22],wuetend:[.5,-.18],muede:[-.35,-.08],verletzt:[-.45,.12],zu:[.05,-.05],stolz:[.2,.05]};
function setFace(U,es,ms){if(!U.face)return;const F=U.face,k=es+'|'+ms;if(F.k===k)return;F.k=k;F.eM.map=eyeTex(F.sty,F.iris,F.skin,es==='stolz'?'neutral':es);F.eM.needsUpdate=!F.init;F.init=1;if(F.ms){F.mM.map=mouthTex(F.ms,ms,F.fang);F.mM.needsUpdate=!F.mi;F.mi=1;}
 const b=BROW[es]||BROW.neutral;U.brows.forEach(B=>{B.g.rotation.z=B.s*b[0];B.g.position.y=B.y0+b[1]*B.er;});}
// Öffentliche Mimik-API: dauerhaft oder für ms Millisekunden
function setExpression(o,e,ms){const U=o&&o.userData;if(!U||!U.face)return;if(ms)U.exT={e,until:performance.now()+ms};else{U.expr=e;}}
// ---------- Animation ----------
function animMon(o,t,st){const U=o.userData;if(U&&U.sprite)return animSprite(o,t,st);if(U&&U.model&&typeof animModel==='function')return animModel(o,t,st);if(!U||!U.body)return;st=st||{};const now=performance.now(),A=U.act,b=U.body,sh=U.sh,still=!!st.still,ph=t*.001,H=U.head;
 let dt=U.lt==null||still?0:(t-U.lt)*.001;U.lt=t;dt=Math.max(0,Math.min(.1,dt));const sm=(c,tg,sp)=>still?tg:c+(tg-c)*Math.min(1,dt*sp),ez=k=>k<=0?0:k>=1?1:k*k*(3-2*k);
 U.w=sm(U.w||0,st.moving?1:0,7);const w=U.w;U.wp=(U.wp||0)+dt*(U.gaitRate||(sh==='golem'?7.5:sh==='blob'?9:sh==='serpent'?6.5:sh==='float'?5:10.5))*(st.speed||1);
 const pose=st.pose||null;U.sl=sm(U.sl||0,pose==='sleep'?1:0,2.5);U.gz=sm(U.gz||0,pose==='graze'?1:pose==='sniff'?.55:0,5);U.hd=sm(U.hd||0,pose==='hide'?1:0,5);U.he=sm(U.he||0,pose==='hero'?1:0,5);const sl=U.sl,gz=U.gz,hd=U.hd,he=U.he;
 let fe=U.exT&&now<U.exT.until?U.exT.e:(U.expr||'neutral');if(still&&!st.expr)fe='neutral';if(st.expr)fe=st.expr;const p=U.wp,sp=Math.sin(p);
 // Idle-Varianten (Umschauen, Strecken, Schütteln)
 let iv=null,ik=0;if(U.iv&&t>=U.iv.t0&&t-U.iv.t0<U.iv.d){iv=U.iv.k;ik=(t-U.iv.t0)/U.iv.d;}else{U.iv=null;
  if(!still&&w<.05&&!A.atk&&!A.ko&&!pose&&sl<.05){if(!U.nIv||U.nIv-t>20000)U.nIv=t+2000+Math.random()*4000;if(t>U.nIv){U.iv={k:['look','stretch','shake','look'][Math.random()*4|0],t0:t,d:1900};U.nIv=t+5000+Math.random()*5000;}}}
 const ie=iv?Math.sin(Math.PI*ik):0,str=iv==='stretch'?ie:0,shk=iv==='shake'?ie:0;
 // Blinzeln
 let bl=0;if(!still){if(!U.nb||U.nb-t>20000)U.nb=t+800+Math.random()*2500;const d=t-U.nb;if(d>0){bl=d<70?d/70:d<160?1-(d-70)/90:0;if(d>=160)U.nb=t+(Math.random()<.2?120:1800+Math.random()*3200);}}
 // Kopf-Blickrichtung
 let ly=Math.sin(ph*.45+U.seed)*.2+Math.sin(ph*1.13+U.seed*3)*.06,lp=Math.sin(ph*.7+U.seed*2)*.04,lr=0;
 if(st.lookAt&&sl<.3){const dx=st.lookAt.x-o.position.x,dz=st.lookAt.z-o.position.z;let a=Math.atan2(-dx,-dz)-o.rotation.y;a=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(a)<2.4)ly=Math.max(-.9,Math.min(.9,a))*(st.lookK??.85)+ly*.25;}
 if(iv==='look'){ly=Math.sin(ik*Math.PI*2)*.8;lp=-.1*ie;lr=Math.sin(ik*Math.PI*2)*.18;}
 U.hy=sm(U.hy||0,ly,4);U.hp=sm(U.hp||0,lp,4);
 let px=0,py=0,pz=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1,hx=U.hp,hz=lr,mo=0,cl=0,fl=0,spread=0;
 const br=Math.sin(ph*2.2+U.seed);sy+=br*.016;sx-=br*.005;sz-=br*.005;const ws=Math.sin(ph*.55+U.seed)*(1-w);rz+=ws*.025;px+=ws*.012;
 // Charakter-Haltung: leicht asymmetrisch, Kopf geneigt, Gewicht auf einem Bein
 const idl=(1-w)*(A.atk||A.ko?0:1)*(1-sl)*(1-gz);rz+=U.tilt*idl;hz+=U.htilt*idl*(1+he*.4);
 // Laufzyklus
 const legP=[0,Math.PI,Math.PI,0];
 if(U.gait){const g=taGait(U,{p,w,ph,sl,gz,hd,he,spd:st.speed||1,now,fe,still});px+=g.px;py+=g.py;pz+=g.pz;rx+=g.rx;ry+=g.ry;rz+=g.rz;mo=Math.max(mo,g.mo);}
 else if(sh==='quad'){py+=(1-Math.cos(2*p))*.025*w;rx+=Math.sin(2*p)*.035*w;hx+=Math.sin(2*p+.6)*.06*w;
  U.legs.forEach((L,i)=>{const q=p+legP[i];L.u.rotation.x=Math.sin(q)*.6*w+(L.front?str*.75:-str*.15);L.l.rotation.x=-Math.max(0,Math.cos(q))*.8*w*(L.front?1:-.7)-(L.front?str*.35:0);});rx-=str*.14;mo=str*.8;
  const Lp=U.legs[U.tilt>0?0:1];if(Lp&&U.cute){Lp.u.rotation.x-=.35*idl;Lp.l.rotation.x-=.7*idl;}else if(U.legs[3]){const Lb=U.legs[U.tilt>0?3:2];Lb.u.rotation.x+=.1*idl;Lb.l.rotation.x+=.2*idl;}}
 else if(sh==='blob'){const hp=Math.abs(sp);py+=hp*.13*w;sy*=1+(hp-.5)*.2*w+str*.14;sx*=1-(hp-.5)*.1*w-str*.06;sz=sx;
  U.legs.forEach((L,i)=>{L.u.position.y=.06+Math.max(0,Math.sin(p+i*Math.PI))*.04*w;L.u.rotation.x=Math.sin(p+i*Math.PI)*.4*w;});
  U.arms.forEach((L,i)=>{L.u.rotation.z=L.s*(Math.sin(ph*1.6+i)*.1+hp*.5*w+str*1.4+shk*Math.sin(ik*40)*.4+he*.5);});mo=str*.7;}
 else if(sh==='float'){py+=Math.sin(ph*1.7+U.seed)*.045*(1-sl);rx-=w*.16;rz+=Math.sin(ph*1.1+U.seed)*.03;U.arms.forEach((L,i)=>{L.u.rotation.z=L.s*(Math.sin(ph*2.2+i)*.18+.1+he*.5+str);});mo=str*.7;}
 else if(sh==='serpent'){const amp=.025+.06*w;U.serp.forEach(q=>{q.off=Math.sin(ph*(1.4+w*4)-q.i*.85)*amp*Math.max(0,1-q.i/7)*(1.4-q.i*.08);});
  U.serp.forEach((q,i)=>{const n=U.serp[i+1],dx=(n?n.off:q.off+(q.off-(U.serp[i-1]||q).off))-q.off,len=Math.hypot(q.d[2],q.d[1])+.001;q.g.position.x=q.x+q.off;q.g.rotation.y=-Math.atan2(dx,len)*Math.sign(-q.d[2]||1)*(q.i<5?1:.3);
   q.g.rotation.x=q.i>=5?-str*.12-Math.sin(ph*1.1+U.seed)*.02-he*.06:0;});py+=str*.06;mo=str*.85;}
 else{const amp=sh==='golem'?.38:sh==='bird'?.5:.55;py+=(1-Math.cos(2*p))*(sh==='golem'?.03:.022)*w;ry+=sp*.07*w;rz+=sp*(sh==='golem'?.06:sh==='bird'?.08:.03)*w;hx+=Math.sin(2*p)*(sh==='bird'?.14:.05)*w;
  U.legs.forEach((L,i)=>{const q=p+i*Math.PI;L.u.rotation.x=Math.sin(q)*amp*w;L.l.rotation.x=-Math.max(0,Math.cos(q))*.9*amp*w;});
  U.arms.forEach((L,i)=>{L.u.rotation.x=-Math.sin(p+i*Math.PI)*.5*w+Math.sin(ph*1.5+i)*.04-he*(i?.2:.5);L.u.rotation.z=(L.u.userData.rz0||0)+L.s*(str*2.3+he*.25);if(L.l)L.l.rotation.x=-.25-str*.2-he*.4;});
  if(U.legs.length===2&&sh!=='bird'){const Lw=U.legs[U.tilt>0?1:0];Lw.u.rotation.x+=.14*idl;Lw.l.rotation.x-=.3*idl;px+=U.tilt*.6*idl;}
  sy*=1+str*.05;hx-=str*.25;mo=str*.8;spread=sh==='bird'?Math.max(str,he*.7):0;}
 rz+=shk*Math.sin(ik*42)*.07;
 // Heldenpose (Dex/Team): Brust raus, Kinn hoch, Kopf geneigt
 if(he>.01){rx+=.05*he*(sh==='serpent'?0:1);hx+=(U.terra?-.16:.12)*he;sy*=1+.02*he;}
 // Aktionen
 const ta=A.atk?(now-A.atk)/560:9;if(ta>=0&&ta<1){const wind=ta<.3?ez(ta/.3):ta<.45?1-ez((ta-.3)/.15):0,lun=ta<.3?0:ta<.5?ez((ta-.3)/.2):1-ez((ta-.5)/.5);
  pz+=wind*.12-lun*.6;py+=lun*.05;rx+=wind*.1-lun*.15;sy*=1-wind*.07;sx*=1+wind*.04;mo=Math.max(mo,lun*.9);cl=Math.max(cl,wind*.3);spread=Math.max(spread,wind+lun);
  if(sh==='golem'||sh==='biped')U.arms.forEach(L=>{L.u.rotation.x-=(L.s>0?lun*1.6:wind*.4);});if(sh==='serpent')hx+=wind*-.2+lun*.3;}
 const th=A.hit?(now-A.hit)/480:9;if(th>=0&&th<1){const r=(1-th)*(1-th);pz+=Math.sin(Math.min(1,th*3)*Math.PI/2)*.28*(1-th);px+=Math.sin(th*40)*.04*(1-th);rx+=.16*r;hx+=.2*r;fl=r*.75;cl=Math.max(cl,th<.55?1:0);mo=Math.max(mo,r*.5);}
 let kk=0;if(A.ko){kk=Math.min(1,(now-A.ko)/900);const e=ez(kk),bo=Math.sin(Math.min(1,kk*1.4)*Math.PI)*.08*(1-kk);
  if(U.gait){}else if(sh==='blob'){sy*=1-.42*e;sx*=1+.18*e;sz*=1+.18*e;}else if(sh==='float'){py-=(U.hover||0)*e;sy*=1-.3*e;sx*=1+.12*e;sz*=1+.12*e;rz+=.3*e;}else if(sh==='serpent'){py-=.18*e;rx+=.1*e;hx+=.5*e;}else{rz+=1.3*e;py-=.08*e;}py+=bo;hx+=.35*e;cl=1;ly=0;}
 let cs=1;if(A.catch&&now>A.catch){const k=Math.min(1,(now-A.catch)/380),e=ez(k);cs=1-e;py+=e*.3;ry+=e*5;fl=Math.max(fl,Math.min(1,k*3));}
 if(A.pop){const k=(now-A.pop)/450;if(k<1){cs=k<.5?ez(k/.5)*1.15:1.15-.15*ez((k-.5)/.5);fl=Math.max(fl,1-k);}else A.pop=0;}
 // Haltungen: grasen/schnüffeln (Kopf senken), schlafen (liegen), verstecken (ducken)
 const hip=U.hip||.4;if(H&&!U.blob&&!U.gait){const q=H.userData.p0||(H.userData.p0=[H.position.y,H.position.z]);H.position.y=q[0]-gz*(sh==='quad'?.26:.14)-sl*.06;H.position.z=q[1]-gz*.08;}
 if(gz>.01){hx-=gz*1.0;rx-=gz*.16;py-=gz*.02;if(pose==='graze')mo=Math.max(mo,Math.max(0,Math.sin(ph*9))*.5*gz);else hx+=Math.sin(ph*17)*.08*gz;}
 if(sl>.01&&U.gait){hx-=.22*sl;sy+=Math.sin(ph*1.3)*.03*sl;}
 if(sl>.01&&!U.gait){py-=(sh==='float'?(U.hover||0)*.9:hip*(sh==='bird'?.8:sh==='serpent'?.35:U.blob?.12:.62))*sl;hx-=.32*sl;sy+=Math.sin(ph*1.3)*.035*sl;
  U.legs.forEach(L=>{if(!L.l)return;if(sh==='quad'){L.u.rotation.x+=(1.45*(L.front?1:-1)-L.u.rotation.x)*sl;L.l.rotation.x*=1-sl;}else{L.u.rotation.x+=(1.35-L.u.rotation.x)*sl;L.l.rotation.x+=(-1.25-L.l.rotation.x)*sl;}});
  if(U.blob){sy*=1-.12*sl;sx*=1+.08*sl;sz*=1+.08*sl;}if(sh==='bird')U.hy+=(.9-U.hy)*sl*.5;rz+=(sh==='biped'?.08:0)*sl;}
 if(hd>.01&&!U.gait){py-=(sh==='float'?(U.hover||0)*.8:hip*.55)*hd;rx-=.05*hd;hx+=.12*hd;}
 // Ausdruck wirkt auf den Körper
 if(!still){if(fe==='freudig')py+=Math.max(0,Math.sin(ph*7.5))*.035*(1-sl);else if(fe==='wuetend'){rx-=.06;hx-=.1;sy*=1+Math.sin(ph*14)*.01;}else if(fe==='muede'){hx-=.14;}else if(fe==='verletzt')px+=Math.sin(ph*31)*.006;}
 if(A.hop){const k=(now-A.hop)/900;if(k<1)py+=Math.abs(Math.sin(k*Math.PI*2))*.16*(1-k*.4);else A.hop=0;}
 if(U.blob)ry+=U.hy*.55;
 if(U.lean){rx+=U.lean;U.legs.forEach(L=>{L.u.rotation.x-=U.lean;});}
 b.position.set(px,py,pz);b.rotation.set(rx,ry,rz);b.scale.set(sx*cs,sy*cs,sz*cs);
 if(H&&!U.blob)H.rotation.set(hx,U.hy,hz);else if(H)H.rotation.set(0,0,hz*.5);
 // Augen, Brauen, Mund
 cl=Math.max(cl,bl,str*.55);if(A.ko)fe='verletzt';let es=fe;if(sl>.4)es='zu';else if(cl>.5&&es!=='freudig'&&es!=='verletzt')es='zu';else if(he>.5&&es==='neutral')es='stolz';
 setFace(U,es,mo>.38?'auf':sl>.4?'neutral':he>.5&&fe==='neutral'?'freudig':fe);if(U.beak)U.beak.rotation.x=-mo*.45;
 // Ohren-Zucken
 if(U.ears.length){if(!U.ne||U.ne-t>20000)U.ne=t+2000+Math.random()*4000;const d=t-U.ne;const tw=d>0&&d<260?Math.sin(d/260*Math.PI*3)*.22:0;if(d>=260)U.ne=t+2500+Math.random()*5000;
  U.ears.forEach((g,i)=>{g.rotation.z=(g.userData.rz0??g.rotation.z)+(i?tw:0)*(g.userData.rz0>0?1:-1)+shk*Math.sin(ik*42+i)*.2-(A.ko?.4*(i?1:-1):0);});}
 // Schwanz-Kette
 const tf=1+w*1.4+shk*2.5;let tsum=0;U.tail.forEach((g,i)=>{g.rotation.z=Math.sin(ph*(2.4+w*3+shk*8)-i*.7)*.17*tf*(A.ko?.2:1);g.rotation.x=g.userData.rx0+Math.sin(ph*1.3-i*.5)*.06+(g.userData.rx0>1.5?0:-he*.15)+(A.ko&&i===0?.6:0);tsum+=g.rotation.x;});
 if(U.fan){U.fan.rotation.x=1.25+Math.sin(ph*1.8)*.05-spread*.2;U.fan.rotation.z=Math.sin(ph*(2+w*6))*.08*(1+w);}
 // Flügel
 U.wings.forEach((W,i)=>{const s=W.s,ko=A.ko?1:0;let fold,fa,amp,fr;
  if(W.bird){fold=Math.max(ko,1-Math.min(1,spread*1.2+(U.wOpen||0)));fr=spread>.1&&!he?16:3;amp=spread>.1&&!he?.55:.05;}else{fold=ko?.75:W.rest-spread*.25-he*.15;fr=w>.2?13:2.6;amp=w>.2?.45:.14+spread*.3;}
  fa=Math.sin(ph*fr+i*.1)*amp;W.wR.rotation.y=-s*(.2+1.25*fold);W.wF.rotation.z=s*((1-fold)*(fa+.3+(U.wRaise||0))-fold*.04);W.wP.rotation.x=.22*fold-(U.wPitch??.85)*(1-fold);
  W.segs.forEach((g,j)=>{if(j)g.rotation.z=s*((1-fold)*(Math.sin(ph*fr-j*.7)*amp*.55+.08)+fold*(j===1?-.28:-.12));});});
 // Effekte
 U.flames.forEach((f,i)=>{const k=1+Math.sin(ph*21+i)*.1+Math.sin(ph*33+i*2)*.07;f.scale.set(k*(A.ko?.5:1),k*1.15*(A.ko?.5:1),k*(A.ko?.5:1));});
 if(U.flames[0]&&U.tail.length&&U.flames[0].parent===U.tail[U.tail.length-1])U.flames[0].rotation.set(-tsum-rx,0,Math.sin(ph*5)*.08);
 U.spin.forEach(([m,ax,v])=>{m.rotation[ax]=ph*v;});
 if(U.fx.halo){U.fx.halo.position.y=U.fx.halo.userData.y0+Math.sin(ph*2)*.015;U.fx.halo.rotation.z=ph*.8;}
 if(U.fx.bug)U.fx.bug.forEach(g=>{g.rotation.z=g.userData.s*(.3+Math.sin(ph*28)*.5);g.rotation.y=-g.userData.s*.5;});
 if(U.fx.cape)U.fx.cape.rotation.x=.12+Math.sin(ph*1.6)*.05+w*.35;
 if(U.fx.bands)U.fx.bands.forEach(g=>{const i=g.userData.i;g.rotation.set(Math.PI/2+.35*(i?-1:1)+Math.sin(ph*.7+i)*.1,0,ph*(i?-.5:.4));});
 if(U.aura){U.aura.material.opacity=.45+Math.sin(ph*2)*.1;U.aura.scale.setScalar(U.baseH*(1.85+Math.sin(ph*1.5)*.06));}
 const pk=U.pulse||U.K.glow?.5+.5*Math.sin(ph*3):1;
 U.mats.forEach(m=>m.emissive.setScalar(fl));U.gmats.forEach(m=>{m.emissive.copy(m.userData.e0).multiplyScalar(.75+.5*pk).addScalar(fl);});
 // Glanz-Funkeln
 if(U.fx.spark){const pa=U.fx.spark.geometry.attributes.position,bu=U.sparkBurst&&now-U.sparkBurst<1800?1-(now-U.sparkBurst)/1800:0,R0=U.baseH*.5;
  for(let i=0;i<pa.count;i++){const a=ph*(.6+i*.07)+i*2.4,r=R0*(.55+.35*Math.sin(ph*.9+i)+bu*1.4),y=U.baseH*(.25+((i*.37+ph*.18)%1)*.8);pa.setXYZ(i,Math.cos(a)*r,y,Math.sin(a)*r);}pa.needsUpdate=true;
  U.fx.spark.material.size=.09+bu*.16+Math.max(0,Math.sin(ph*6))*.03;U.fx.spark.material.opacity=.55+.45*Math.max(bu,Math.abs(Math.sin(ph*3.1)));}
 // Schlaf-Zzz
 if(sl>.6&&!still){if(!U.fx.zz){U.fx.zz=[0,1].map(i=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:zTex(),transparent:true,depthWrite:false}));o.add(sp);return sp;});}
  U.fx.zz.forEach((sp,i)=>{const k=((ph*.45+i*.5)%1);sp.visible=true;sp.position.set(.25+k*.35,U.baseH*(.8+k*.7),-.05);sp.scale.setScalar((.2+k*.18)/o.scale.x);sp.material.opacity=Math.min(1,k*4)*(1-k);});}
 else if(U.fx.zz)U.fx.zz.forEach(sp=>sp.visible=false);}
function K0(U){return U.K&&U.K.glow||0;}
function zTex(){return cvTex('zzz',64,64,x=>{x.font='900 52px sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=9;x.strokeStyle='#2a3a6a';x.strokeText('Z',32,34);x.fillStyle='#ffffff';x.fillText('Z',32,34);});}
// ---------- Vorschaubilder (Heldenpose: Dreiviertel, leicht von unten) ----------
let TR=null;const THUMB={};
function studio(s){s.add(new THREE.HemisphereLight(0xffffff,0x8088a0,.48));const k=new THREE.DirectionalLight(0xfff2e0,.95);k.position.set(-2,3,3);s.add(k);const rim=new THREE.DirectionalLight(0xbfe0ff,.75);rim.position.set(2,2.5,-3);s.add(rim);}
function heroFrame(cam,m,asp){m.updateMatrixWorld(true);const box=new THREE.Box3();m.traverse(o=>{if(o.isMesh&&!o.userData.ol&&!o.userData.fxOnly&&!(m.userData.terra&&o.material&&o.material.transparent)){o.geometry.boundingBox||o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
 const sz=box.getSize(new THREE.Vector3()),ct=box.getCenter(new THREE.Vector3()),fit=Math.max(sz.y,sz.x*.9*(asp||1)+(m.userData.terra?sz.z*.22:0))*1.12,d=fit/(2*Math.tan(14*Math.PI/180));
 cam.position.set(ct.x,ct.y-sz.y*.14,ct.z+d);cam.lookAt(ct.x,ct.y-sz.y*.02,ct.z);cam.updateMatrixWorld();return{box,ct,sz};}
function monPortrait(id,size,opts){opts=Object.assign({pose:'hero'},opts||{});if(!TR){const r=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(1);
  r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;r.setClearColor(0,0);const s=new THREE.Scene();studio(s);TR={r,s,cam:new THREE.PerspectiveCamera(28,1,.1,50)};}
 // Terras (Fortsetzung 15:30): Porträt in Kartenqualität – feine Geometrie (TA_HQ) und 2×-Überabtastung, danach weich verkleinert (saubere Kanten, DPR-scharf)
 const tq=typeof terraOf==='function'&&!!terraOf(id)&&opts.hq!==false,ss=tq?2:1;const{r,s,cam}=TR;r.setSize(size*ss,size*ss,false);let m;if(tq)TA_HQ=1;try{m=buildMon3D(id,1,opts);}finally{if(tq)TA_HQ=0;}m.rotation.y=-Math.PI/2-.95+((MONS[id].sp[7]||{}).py||0);s.add(m);if(m.userData.aura)m.userData.aura.visible=!!opts.aura;
 const F=heroFrame(cam,m);MRIMK.value=.14;animMon(m,0,{still:true,pose:'hero',lookAt:{x:cam.position.x,z:cam.position.z},lookK:tq?(terraOf(id).pk??.25):undefined});r.render(s,cam);s.remove(m);
 const c=document.createElement('canvas');c.width=c.height=size;const cx=c.getContext('2d');cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';cx.drawImage(r.domElement,0,0,size*ss,size*ss,0,0,size,size);c.F=F;c.cam=cam;return c;}
// Fangkarte-Fix (Opus hoch, 10.11.): Vorschaubild aus verlorenem WebGL-Kontext (App im Hintergrund, zu viele Kontexte, GPU-Neustart) ist komplett transparent
// und wurde bisher für immer gecacht → leere Fang-Karte, leerer Dex-Eintrag. Jetzt: Deckung prüfen, leere Bilder nie cachen, TR bei Kontextverlust neu anlegen
// (höchstens 3×, mehr Kontexte würden den Welt-Renderer verdrängen), Fehlversuche mit Pause (4 s, 8 s, dann aufgeben) → Aufrufer zeichnen den 2D-Rückfall.
const THUMB_BAD={};let TR_NEW=0;
function thumbCover(c){try{const s=24,t=document.createElement('canvas');t.width=t.height=s;const x=t.getContext('2d');x.drawImage(c,0,0,s,s);const d=x.getImageData(0,0,s,s).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>24)n++;return n/(s*s);}catch(e){return 1;}}
function trLost(){try{const gl=TR&&TR.r.getContext();return!!(gl&&gl.isContextLost());}catch(e){return true;}}
function trReset(){if(!TR||TR_NEW>=3)return false;TR_NEW++;try{TR.r.dispose();}catch(e){}TR=null;return true;}
function monThumb(id){if(THUMB[id])return THUMB[id];const bad=THUMB_BAD[id];if(bad&&(bad.n>=3||performance.now()-bad.t<4000*bad.n))return null;
 for(let k=0;k<2;k++){if(trLost()&&!trReset())break;
  try{const SZ=(window.devicePixelRatio||1)>=1.5?512:384,c=monPortrait(id,SZ,{aura:false});if(thumbCover(c)<.004){if(trLost()&&trReset())continue;break;}
   const{box,ct}=c.F,cam=c.cam,pf=v=>(1-v.clone().project(cam).y)/2,foot=pf(new THREE.Vector3(ct.x,box.min.y,ct.z)),top=pf(new THREE.Vector3(ct.x,box.max.y,ct.z));
   // Terras: weicher Kontaktschatten unter den Füßen (Dex/Team/Fang-Karte wie die gemalten Karten); Rohbild ohne Schatten für Welt-Sprites
   const o=document.createElement('canvas');o.width=o.height=SZ;const x=o.getContext('2d'),P=[[box.min.x,box.min.z],[box.max.x,box.min.z],[box.min.x,box.max.z],[box.max.x,box.max.z]].map(([a,b])=>new THREE.Vector3(a,box.min.y,b).project(cam));
   const xs=P.map(v=>(v.x+1)/2*SZ),ys=P.map(v=>(1-v.y)/2*SZ),cx=(Math.min(...xs)+Math.max(...xs))/2,rw=Math.max(SZ*.1,(Math.max(...xs)-Math.min(...xs))*.38),rh=Math.max(SZ*.025,Math.min(rw*.3,(Math.max(...ys)-Math.min(...ys))*.55+SZ*.02)),cy=Math.min(SZ-rh,foot*SZ-rh*.15);
   x.save();x.translate(cx,cy);x.scale(1,rh/rw);const g=x.createRadialGradient(0,0,0,0,0,rw);g.addColorStop(0,'rgba(46,36,70,.34)');g.addColorStop(.55,'rgba(46,36,70,.17)');g.addColorStop(1,'rgba(46,36,70,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,rw,0,7);x.fill();x.restore();x.drawImage(c,0,0);
   delete THUMB_BAD[id];return THUMB[id]={img:o,raw:c,sh:1,foot,hf:Math.max(.2,foot-top)};}catch(e){if(trLost()&&trReset())continue;break;}}
 THUMB_BAD[id]={t:performance.now(),n:(bad?bad.n:0)+1};return null;}
// Vorschaubild ohne Ruckler: Warteschlange, je Leerlauf-Slot ein Bild (Kampfstart-Vorladen, Fang-Karte); Promise → THUMB-Eintrag oder null
const THUMB_Q=[];let THUMB_QT=0;
function monThumbAsync(id){if(THUMB[id]||!window.THREE||!MONS[id])return Promise.resolve(THUMB[id]||null);return new Promise(res=>{THUMB_Q.push([id,res]);if(!THUMB_QT)THUMB_QT=setTimeout(thumbRun,0);});}
function thumbRun(){THUMB_QT=0;const it=THUMB_Q.shift();if(!it)return;let T=null;try{T=monThumb(it[0]);}catch(e){}try{it[1](T);}catch(e){}
 if(THUMB_Q.length)THUMB_QT=window.requestIdleCallback?requestIdleCallback(thumbRun,{timeout:250}):setTimeout(thumbRun,16);}
function drawMon(c,id,x,y,size,flip,t,alpha){const T=window.THREE&&MONS[id]&&monThumb(id);if(!T)return drawMon2D(c,id,x,y,size,flip,t,alpha);
 const sc=MONS[id].sp[4],dh=size*sc*.86/T.hf,bob=Math.sin((t||0)/450)*size*.012,fy=y+size*sc*.42,top=fy-T.foot*dh+bob;
 c.save();if(alpha!==undefined)c.globalAlpha=alpha;if(!T.sh){c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(x,fy,size*sc*.32,size*sc*.07,0,0,7);c.fill();}
 if(flip){c.translate(x,0);c.scale(-1,1);c.drawImage(T.img,-dh/2,top,dh,dh);}else c.drawImage(T.img,x-dh/2,top,dh,dh);c.restore();}
// ---------- Drehbare Ansicht in Team & Dex (Heldenpose) ----------
let VR=null;
function viewer3d(id,size,opts){if(!window.THREE)return null;try{if(!VR){const r=new THREE.WebGLRenderer({alpha:true,antialias:true});r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;r.setClearColor(0,0);
  r.shadowMap.enabled=true;const s=new THREE.Scene();studio(s);const sd=new THREE.DirectionalLight(0xffffff,.3);sd.position.set(0,5,0);sd.castShadow=true;s.add(sd);
  const gr=new THREE.Mesh(new THREE.CircleGeometry(1.1,48),new THREE.ShadowMaterial({opacity:.25}));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;s.add(gr);
  VR={r,s,cam:new THREE.PerspectiveCamera(28,1,.1,50),m:null,yaw:2.6,drag:null,idle:0};const el=r.domElement;el.className='viewer';el.style.touchAction='none';el.title='Zum Drehen ziehen';
  el.addEventListener('pointerdown',e=>{VR.drag=e.clientX;VR.y0=VR.yaw;VR.tp=[e.clientX,performance.now()];el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointerup',e=>{const q=VR.tp;if(q&&Math.abs(e.clientX-q[0])<7&&performance.now()-q[1]<400&&VR.m){setExpression(VR.m,'freudig',1800);VR.m.userData.act.hop=performance.now();if(typeof playCry==='function')playCry(VR.id);}VR.tp=null;});
  el.addEventListener('pointermove',e=>{if(VR.drag!=null)VR.yaw=VR.y0+(e.clientX-VR.drag)*.012;});
  ['pointerup','pointercancel'].forEach(t=>el.addEventListener(t,()=>{VR.drag=null;VR.idle=performance.now();}));
  const loop=()=>{if(!VR.m||!el.isConnected&&++VR.wait>30){VR.run=0;return;}requestAnimationFrame(loop);if(!el.isConnected)return;VR.wait=0;const n=performance.now();if(VR.drag==null&&n-VR.idle>1400)VR.yaw+=.006;VR.m.rotation.y=VR.yaw;
   MRIMK.value=.15;animMon(VR.m,n,{pose:'hero',lookAt:{x:VR.cam.position.x,z:VR.cam.position.z}});VR.r.render(VR.s,VR.cam);};VR.loop=loop;}
 if(VR.m)VR.s.remove(VR.m);VR.yaw=2.6;VR.idle=performance.now();VR.m=buildMon3D(id,1,Object.assign({pose:'hero'},opts||{}));VR.id=id;VR.s.add(VR.m);const box=new THREE.Box3().setFromObject(VR.m),sz=box.getSize(new THREE.Vector3()),fit=Math.max(sz.y,sz.x,sz.z)*1.2;
 VR.cam.position.set(0,sz.y*.38+fit*.06,fit/(2*Math.tan(14*Math.PI/180)));VR.cam.lookAt(0,sz.y*.5,0);VR.r.setPixelRatio(Math.min(2,devicePixelRatio||1));VR.r.setSize(size,size);
 if(!VR.run){VR.run=1;VR.wait=0;requestAnimationFrame(VR.loop);}// Stabilität PC: Ansicht-Schleife endet, sobald die Ansicht entfernt ist
 return VR.r.domElement;}catch(e){return null;}}
// ---------- 3D-Kampfszene ----------
let BT=null,HS=0;
function skyDome(){return new THREE.Mesh(new THREE.SphereGeometry(60,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color()},bot:{value:new THREE.Color()}},
 vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float h=clamp(vP.y*1.7+.12,0.,1.);gl_FragColor=vec4(mix(bot,top,pow(h,.75)),1.);}'}));}
function scr(w){return(B&&B.scr&&B.scr[w])||(w==='foe'?[180,54]:[66,102]);}
// Bodentextur: weiche Flecken + feine Halme, geringer Kontrast (wird eingefärbt)
function groundTex(){if(M3.tex.gnd)return M3.tex.gnd;const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),r=prng(91);x.fillStyle='#ededed';x.fillRect(0,0,S,S);
 for(let i=0;i<160;i++){const v=215+r()*40|0;x.fillStyle=`rgba(${v},${v},${v},.5)`;x.beginPath();x.ellipse(r()*S,r()*S,8+r()*26,6+r()*18,r()*3,0,7);x.fill();}
 x.lineCap='round';for(let i=0;i<900;i++){const px=r()*S,py=r()*S,v=200+r()*55|0;x.strokeStyle=`rgba(${v},${v},${v},.7)`;x.lineWidth=1;x.beginPath();x.moveTo(px,py);x.lineTo(px+r()*2-1,py-3-r()*4);x.stroke();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(16,16);return M3.tex.gnd=t;}
function tmat(c,o){return new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:toonGrad()},o||{}));}
function bInst(s,geo,mt,list,fn){const m=new THREE.InstancedMesh(geo,mt,list.length),d=new THREE.Object3D();list.forEach((q,i)=>{fn(d,q,i);d.updateMatrix();m.setMatrixAt(i,d.matrix);m.setColorAt(i,new THREE.Color('#ffffff'));});m.castShadow=m.receiveShadow=true;s.add(m);return m;}
function battle3d(){if(!window.THREE)return false;if(BT)return true;try{const sc=$('#battle .scene'),cvs=document.createElement('canvas');cvs.id='bcv3';sc.insertBefore(cvs,sc.firstChild);
 const r=new THREE.WebGLRenderer({canvas:cvs,antialias:true});r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;
 const s=new THREE.Scene(),cam=new THREE.PerspectiveCamera(33,240/150,.1,120),hemi=new THREE.HemisphereLight(0xffffff,0x5a6650,.85),sun=new THREE.DirectionalLight(0xffffff,1);
 sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,far:30});s.add(hemi,sun);
 const rim=new THREE.DirectionalLight(0xdff0ff,.75);rim.position.set(6,5,-10);s.add(rim);
 // Kontaktschatten unter beiden Kreaturen (weich, immer lesbar)
 const csT=cvTex('cshadow',64,64,x=>{const g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.6,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}),
  csM=new THREE.MeshBasicMaterial({map:csT,transparent:true,depthWrite:false}),cs=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),csM);m.rotation.x=-Math.PI/2;m.renderOrder=2;s.add(m);return m;});
 const gt=groundTex();const gmat=tmat('#7fbf63',{map:gt}),pm=tmat('#9ad07a');
 const ground=new THREE.Mesh(new THREE.CircleGeometry(45,48),gmat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;s.add(ground);
 const pg=new THREE.LatheGeometry([[0,.16],[1.15,.16],[1.3,.13],[1.38,.06],[1.4,0]].map(([x,y])=>new THREE.Vector2(x,y)),40);
 [[2.4,-2.7],[-2.2,1.6]].forEach(([x,z])=>{const m=new THREE.Mesh(pg,pm);m.position.set(x,0,z);m.receiveShadow=true;s.add(m);});
 const rn=prng(7),R=(a,b)=>a+rn()*(b-a),pol=(a0,a1,r0,r1)=>{const a=R(a0,a1),rr=R(r0,r1);return[Math.cos(a)*rr,Math.sin(a)*rr];};
 // Gras & Blumen rund um die Plattformen
 const tufts=[],fls=[];for(let i=0;i<240;i++){const c=i%2?[2.4,-2.7]:[-2.2,1.6],[x,z]=pol(0,7,1.25,4.5);if(Math.hypot(c[0]+x,c[1]+z-.0)>.5)tufts.push([c[0]+x,c[1]+z,R(.6,1.3),R(0,6)]);}
 for(let i=0;i<120;i++){const[x,z]=pol(0,7,1.6,12);fls.push([x+.1,z-.5,R(.7,1.3),i]);}
 const tm=tmat('#ffffff'),tuftM=bInst(s,new THREE.ConeGeometry(.05,.36,4),tm,tufts,(d,[x,z,k,a])=>{d.position.set(x,.15*k,z);d.scale.set(k,k,k);d.rotation.set(R(-.25,.25),a,R(-.25,.25));});
 const flM=bInst(s,new THREE.IcosahedronGeometry(.07,0),tmat('#ffffff'),fls,(d,[x,z,k])=>{d.position.set(x,.08,z);d.scale.setScalar(k);});
 // Bäume aus weichen Kugeln, Büsche, Steine, Hügel, Wolken
 const trees=[];for(let i=0;i<24;i++){const a=R(Math.PI*.85,Math.PI*2.15),rr=R(11,24);trees.push([Math.cos(a)*rr,Math.sin(a)*rr,R(.8,1.3)]);}
 const trunk=bInst(s,new THREE.CylinderGeometry(.16,.24,1.6,7),tmat('#7a5236'),trees,(d,[x,z,k])=>{d.position.set(x,.8*k,z);d.scale.setScalar(k);});
 const crowns=[];trees.forEach(([x,z,k],i)=>{crowns.push([x,2.1*k,z,1.15*k,i]);crowns.push([x+.6*k,1.7*k,z+.2,.8*k,i]);crowns.push([x-.5*k,1.8*k,z-.3,.85*k,i]);crowns.push([x+.1,2.8*k,z,.75*k,i]);});
 const crown=bInst(s,new THREE.SphereGeometry(1,12,9),tmat('#ffffff'),crowns,(d,[x,y,z,r])=>{d.position.set(x,y,z);d.scale.set(r,r*.9,r);});
 const bush=[];for(let i=0;i<22;i++){const[x,z]=pol(Math.PI*.6,Math.PI*2.3,6,10);bush.push([x,z,R(.45,.8)]);}
 const bushM=bInst(s,new THREE.SphereGeometry(1,10,8),tmat('#ffffff'),bush,(d,[x,z,r])=>{d.position.set(x,r*.5,z);d.scale.set(r*1.3,r,r*1.1);});
 const rocks=[];for(let i=0;i<18;i++){const[x,z]=pol(0,Math.PI*2,4.5,14);rocks.push([x,z,R(.25,.7)]);}
 const rockM=bInst(s,new THREE.IcosahedronGeometry(1,1),tmat('#ffffff'),rocks,(d,[x,z,r])=>{d.position.set(x,r*.3,z);d.scale.set(r,r*.7,r*.9);d.rotation.y=x;});
 const hills=[];for(let i=0;i<9;i++){const a=Math.PI*.9+i/8*Math.PI*1.2;hills.push([Math.cos(a)*34,Math.sin(a)*34,R(7,12)]);}
 const hillM=bInst(s,new THREE.SphereGeometry(1,16,10),tmat('#ffffff'),hills,(d,[x,z,r])=>{d.position.set(x,-r*.35,z);d.scale.set(r*1.4,r*.7,r);});
 const clouds=[];for(let i=0;i<8;i++){const a=Math.PI*1.05+i/7*Math.PI*.9,cx=Math.cos(a)*42,cz=Math.sin(a)*42,cy=R(13,20);for(let j=0;j<4;j++)clouds.push([cx+(j-1.5)*2.4,cy+(j%2)*.8,cz+R(-1,1),R(1.6,2.6)]);}
 const cloudM=bInst(s,new THREE.SphereGeometry(1,10,8),tmat('#ffffff',{fog:false,emissive:'#ffffff',emissiveIntensity:.45}),clouds,(d,[x,y,z,r])=>{d.position.set(x,y,z);d.scale.set(r*1.3,r*.8,r);});cloudM.castShadow=false;
 const dome=skyDome();s.add(dome);s.fog=new THREE.Fog('#cfe6f2',18,55);
 BT={r,s,cam,hemi,sun,rim,cs,gmat,pm,tuftM,flM,trunk,crown,bushM,rockM,hillM,cloudM,dome,th:null,foe:null,me:null,fm:null,mm:null,ballT:0};
 const fit=()=>{if(!sc.clientWidth)return;r.setPixelRatio(Math.min(3,resH()/sc.clientHeight));r.setSize(sc.clientWidth,sc.clientHeight,false);cam.aspect=sc.clientWidth/sc.clientHeight;cam.updateProjectionMatrix();};
 BT.fit=fit;new ResizeObserver(fit).observe(sc);fit();return true;}catch(e){return false;}}
// Farben je Thema (Boden, Plattform, Gras, Blumen[], Kronen[], Busch, Stein, Hügel, Stamm)
const BTH={grass:['#7cc35f','#a3d884',['#5ea84a','#79c25a','#93d46e'],['#ffd84a','#ff7aa8','#ffffff','#9fb8ff','#ff9a4a'],['#4f9e4a','#5fb456','#3f8a43'],'#4c9a45','#a2a7ad','#6aa86a','#7a5236'],
 snow:['#e6eef5','#f6f9fc',['#d6e4ee','#e8f0f6','#c8d8e4'],['#ffffff','#dbe8f5','#c6dcf0'],['#e4f0f6','#cfe2ec','#9cc0c8'],'#d8e8f0','#b8c4cc','#cfdde8','#6a5040'],
 beach:['#ecd49a','#f6e4b8',['#9fc46a','#b7d47a','#8ab05a'],['#ffd0d8','#ffffff','#ffb38a','#f5e0c0'],['#5fae4f','#73c25e','#4f9a45'],'#6db35a','#cdb48e','#d9c38a','#8a6a46'],
 cave:['#5d4b3f','#74604f',['#6a5a48','#5a4a3c','#7a6a58'],['#9fe4f2','#c9a8ff','#7fd8ff'],['#4a3d36','#3e332c','#55473e'],'#4a3d36','#6a5a4e','#3a2e2a','#4a3a2a'],
 swamp:['#5f7a4e','#77925f',['#4a6a3a','#5a7a44','#6a8a4e'],['#e6d8ff','#ffffff','#c9b8e8'],['#3a5a32','#4a6a3a','#33502c'],'#3f5c36','#5a6050','#45603f','#4a3a2a'],
 ember:['#6b4a3c','#86604c',['#7a5444','#8a5a40','#5e4034'],['#ff9a3a','#ffd166','#ff6a3a'],['#5a4038','#6a4a3e','#4a3530'],'#5a4038','#4a3a36','#4a3430','#3a2a24'],
 whisper:['#7f9a86','#98b49e',['#6f8f7a','#86a890','#a0b8c8'],['#e6d8ff','#ffffff','#b8e0ff','#ffc8e8'],['#5f8a78','#7a9a9a','#8aa4b8'],'#5f8070','#9aa4b0','#6a8a84','#5a4a40'],
 inside:['#d8c6a4','#ead9b8',['#c8b593','#d8c6a4','#bfae8c'],['#ffffff'],['#c8b593','#c8b593','#c8b593'],'#c8b593','#bfae8c','#c8b593','#8a6a46']};
function themeBattle(th){const T=BTH[th]||BTH.grass,{gmat,pm,tuftM,flM,trunk,crown,bushM,rockM,hillM,cloudM}=BT,col=(m,arr)=>{const c=new THREE.Color();for(let i=0;i<m.count;i++){m.setColorAt(i,c.set(arr[i%arr.length]));}m.instanceColor.needsUpdate=true;};
 gmat.color.set(T[0]);pm.color.set(T[1]);col(tuftM,T[2]);col(flM,T[3]);col(crown,T[4]);bushM.material.color.set(T[5]);rockM.material.color.set(T[6]);hillM.material.color.set(T[7]);trunk.material.color.set(T[8]);
 const out=th!=='cave'&&th!=='inside';trunk.visible=crown.visible=out&&th!=='beach';bushM.visible=out;tuftM.visible=flM.visible=rockM.visible=th!=='inside';cloudM.visible=hillM.visible=out;}
function battleH(id){return(.72+.42*worldScale(id))/MONS[id].sp[4];}
function face(o,tx,tz){const dx=tx-o.position.x,dz=tz-o.position.z;o.rotation.y=Math.atan2(-dx,-dz);}
function render3DBattle(){if(performance.now()<HS)return;const{r,s,cam,hemi,sun,dome}=BT,th=cur.theme,nt=isNight(),now=performance.now();
 if(BT.th!==th){BT.th=th;themeBattle(th);}
 let top,bot;if(th==='cave'){top='#1a141e';bot='#3a2e34';}else if(th==='ember'&&!nt){top='#b8603a';bot='#f2c49a';}else if(th==='whisper'&&!nt){top='#8a9ad8';bot='#e6e0f2';}else if(th==='inside'){top='#b8a68a';bot='#efe4d0';}else if(nt){top='#060a22';bot='#2a3466';}else{top=th==='snow'?'#7fa8d0':'#4a8fe0';bot=th==='beach'?'#ffe2b8':'#d8eef7';}
 dome.material.uniforms.top.value.set(top);dome.material.uniforms.bot.value.set(bot);s.fog.color.set(bot);hemi.intensity=nt&&th!=='inside'?.45:.9;sun.intensity=nt&&th!=='inside'?.4:1.0;sun.color.set(nt?'#9fb0ff':'#fff3e0');
 BT.cloudM.material.emissiveIntensity=nt?.05:.45;
 let pan=0,push=0;
 if(B){const foe=B.foe[B.fi],me=G.team[B.mi];
  const mk3=(m,fo)=>{const o=monObj(m.s,battleH(m.s)*MONS[m.s].sp[4]*(fo&&spriteOK(m.s)&&monRender(m.s)==='sprite'?1.18:1),monOpts(m),s);const U=o.userData;if(U.sprite){U.csr=Math.max(.7,Math.min(2.6,(U.sw||1)*.78));return o;}
   o.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(o),z=bx.getSize(new THREE.Vector3());U.csr=Math.max(.7,Math.max(z.x,z.z)*1.05);return o;};
  if(BT.fm!==foe){if(BT.foe)monDrop(s,BT.foe);BT.foe=mk3(foe,1);s.add(BT.foe);BT.fm=foe;BT.ballT=0;if(foe.shiny)setTimeout(()=>B&&BT.foe&&playSeq('shinyAppear',{obj:BT.foe}),700);}
  if(BT.mm!==me){if(BT.me)monDrop(s,BT.me);BT.me=mk3(me);s.add(BT.me);BT.mm=me;}
  const k=ease((now-(B.t0||0))/520),hop=Math.sin(Math.min(1,(now-(B.t0||0))/520)*Math.PI)*.9;BT.foe.position.set(2.4+(1-k)*3,.16+hop,-2.7);BT.me.position.set(-2.2-(1-k)*3,.16+hop,1.6);face(BT.foe,-2.2,1.6);face(BT.me,2.4,-2.7);
  // Mimik im Kampf: Angriff → wütend, Treffer → verletzt, Sieg/Fang → freudig
  const sync=(o,w,m,ot)=>{const A=o.userData.act;if(B.lunge&&B.lunge.who===w){if(A.atk!==B.lunge.t)setExpression(o,'wuetend',900);A.atk=B.lunge.t;}if(B.fx&&B.fx.who===w&&!B.fx.buff){if(A.hit!==B.fx.t)setExpression(o,'verletzt',1100);A.hit=B.fx.t;}A.ko=m.hp<=0?(B.ko&&B.ko[w])||A.ko||now:0;
   setExpression(o,m.hp>0&&(ot.hp<=0||(w==='me'&&B.caught))?'freudig':m.hp>0&&m.hp<stat(m,'hp')*.25?'muede':'neutral');};
  sync(BT.foe,'foe',foe,me);sync(BT.me,'me',me,foe);
  [[BT.foe,0],[BT.me,1]].forEach(([o,i])=>{const c=BT.cs[i];c.visible=!BT.ext||!!o.userData.sprite;c.position.set(o.position.x,.168,o.position.z);const r=o.userData.csr*(1-Math.min(.5,Math.max(0,o.position.y-.16)*.6));c.scale.set(r,r*.8,1);});
  // Fang: Einsaugen in die Kapsel, bei Befreiung wieder herausploppen
  const FA=BT.foe.userData.act,ball=B.fx&&B.fx.who==='ball';if(ball&&BT.ballT!==B.fx.t){BT.ballT=B.fx.t;FA.catch=B.fx.t+430;}
  if(!ball&&BT.ballT&&!B.caught){BT.ballT=0;FA.catch=0;FA.pop=now;}
  BT.foe.visible=!B.caught&&!(ball&&now>FA.catch+380)&&!(foe.hp<=0&&now-(B.ko&&B.ko.foe||now)>1500);
  const pxw=o=>BT.cam.position.distanceTo(o.position)*2*Math.tan(BT.cam.fov*Math.PI/360)/Math.max(100,BT.r.domElement.clientHeight||150);
  animMon(BT.foe,now,{moving:k<1,lookAt:{x:BT.me.position.x,z:BT.me.position.z},cam:BT.cam,pxw:pxw(BT.foe),battle:1});animMon(BT.me,now+900,{moving:k<1,lookAt:{x:BT.foe.position.x,z:BT.foe.position.z},cam:BT.cam,pxw:pxw(BT.me),battle:1});
  if(B.lunge){const q=(now-B.lunge.t)/900;if(q>=0&&q<1){const e=Math.sin(q*Math.PI);pan=(B.lunge.who==='me'?1:-1)*e;push=e;}}
  BT.pan=(BT.pan||0)+(pan-(BT.pan||0))*.15;BT.push=(BT.push||0)+(push-(BT.push||0))*.15;
  // leichter Schwenk zur aktiven Kreatur: Auftakt Gegner, dann eigene Wahl
  const fo=now-(B.t0||0)<1900?1:B.busy?.15:-.7;BT.foc=(BT.foc||0)+(fo-(BT.foc||0))*.03;BT.cs[0].visible=(!BT.ext||!!BT.foe.userData.sprite)&&BT.foe.visible;}
 const sw=Math.sin(now/4200)*.35,intro=B?1-ease((now-(B.t0||0))/1100):0,pn=BT.pan||0,pu=BT.push||0;
 const fc=B?BT.foc||0:0;cam.position.set(-4.9+sw+pn*.55-intro*1.2+fc*.35,2.5+intro*1.1-pu*.15,6.2+intro*2.2-pu*.5-fc*.2);cam.lookAt(.35+sw*.3+pn*.7+fc*.5,.7,-.9-pn*.3-fc*.35);MRIMK.value=nt?.14:.16;BT.rim.intensity=nt?.35:.45;cam.updateMatrixWorld();if(typeof hyBattleFrame==='function')try{hyBattleFrame(BT,now);}catch(e){}/* Hybrid H2: Panorama, Licht aus dem Bild */sprTick(s,cam,now,{hemi,sun});r.render(s,cam);
 if(B&&BT.foe){const pj=(o,hf)=>{const v=o.position.clone();v.y+=o.userData.baseH*o.scale.y*hf;v.project(cam);return[(v.x+1)/2*240,(1-v.y)/2*150];};B.scr={foe:pj(BT.foe,.6),me:pj(BT.me,.6)};}}
// Draufsicht: gemalte Kampfszene mit Illustrationen (Option SET.b2d 'bild'|'3d'); ohne WebGL immer 2D
let B2D=false;function battle2DArt(){return typeof view!=='undefined'&&view==='2d'&&(SET.b2d||'bild')==='bild';}
function drawBattle(){B2D=battle2DArt()||!battle3d();const c3=document.getElementById('bcv3');if(c3)c3.style.visibility=B2D?'hidden':'';if(B2D)return drawBattle2D();render3DBattle();const bc=$('#bcv'),c=bc.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,bc.width,bc.height);c.setTransform(BS,0,0,BS,0,0);
 if(!B)return;const t=performance.now(),fx=B.fx;
 if(fx&&fx.who==='ball'){const k=Math.min(1,(t-fx.t)/500),[tx,ty]=scr('foe'),bx=40+(tx-40)*k,by=k>=1?ty+12:140+(ty+12-140)*k-Math.sin(k*Math.PI)*70,wob=k>=1?Math.sin((t-fx.t)/90)*.35:k*12;
  c.save();c.translate(bx,by);c.rotate(wob);const g=c.createLinearGradient(0,-7,0,7);g.addColorStop(0,'#ff8a5a');g.addColorStop(.48,'#d9482a');g.addColorStop(.52,'#f2f2f2');g.addColorStop(1,'#c9ccd6');
  circ(c,0,0,7,g);c.fillStyle='#222';c.fillRect(-7,-.7,14,1.4);circ(c,0,0,2.2,'#fff');c.restore();}
 if(fx&&fx.col&&t-fx.t<560){const k=Math.max(0,(t-fx.t)/560),[tx,ty]=scr(fx.who);
  if(fx.buff){for(let i=0;i<10;i++){const a=i/10*Math.PI*2;circ(c,tx+Math.cos(a)*24,ty+26-k*50-(i%2)*6,2.2*(1-k)+.5,fx.col);}}
  else{const fg=c.createRadialGradient(tx,ty,0,tx,ty,42*k+8);fg.addColorStop(0,`rgba(255,255,255,${.8*(1-k)})`);fg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=fg;c.fillRect(tx-60,ty-60,120,120);
   for(let i=0;i<14;i++){const a=i/14*Math.PI*2+i,dd=6+k*36;c.globalAlpha=1-k;circ(c,tx+Math.cos(a)*dd,ty+Math.sin(a)*dd*.8,3.2*(1-k)+.6,fx.col);}c.globalAlpha=1;}}}
// ---------- 3D-Oberwelt: wilde Kreaturen & Begleiter ----------
// Größe in der Welt (Spielfigur = 1,6): klein 0,5–0,8 · Mittelstufe ~1 · Endstufe 1,2–2,0 · Legende 2,5+
function worldScale(id){const M=MONS[id];if(!M)return 1;const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),z=M.sp[4];if(M.height)return cl(M.height,.3,4);
 if(M.legend)return cl(2.6+(z-1.15)*3,2.5,3.4);const stg=evoStage(id);
 if(M.ev)return stg>=2?cl(.95+(z-.85)*1.6,.85,1.25):cl(.55+(z-.6)*1.8,.5,.8);
 return stg>=2?cl(1.25+(z-.9)*2.6,1.2,2):cl(.7+(z-.6)*1.4,.6,1.3);}
function monOpts(m){return m?{shiny:!!m.shiny,gender:m.gender,form:m.form}:{};}
function monKey(id,o){return id+'|'+(o.shiny?1:0)+(o.gender||'')+(o.form||'');}
let PLH=0;function playerH(){if(PLH)return PLH;try{if(R3&&R3.player){R3.player.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(R3.player);if(b.max.y-b.min.y>.5)PLH=b.max.y-b.min.y;}}catch(e){}return PLH||1.3;}
// Emote-Sprite über dem Kopf (! ? Tropfen Herz Note)
function emoTex(k){return cvTex('emo'+k,64,64,x=>{x.fillStyle='#ffffff';x.strokeStyle='#28324a';x.lineWidth=4;x.beginPath();x.arc(32,28,22,0,7);x.moveTo(24,46);x.lineTo(32,60);x.lineTo(40,46);x.fill();x.stroke();x.fillStyle='#ffffff';x.beginPath();x.arc(32,28,20,0,7);x.fill();
 x.textAlign='center';x.textBaseline='middle';x.font='900 30px sans-serif';const C={'!':'#e2554d','?':'#3d6fd6',drop:'#3d9be0',heart:'#ff5f8a',note:'#2fa86a'}[k]||'#333';x.fillStyle=C;
 if(k==='heart'){x.beginPath();x.moveTo(32,40);x.bezierCurveTo(12,26,20,10,32,20);x.bezierCurveTo(44,10,52,26,32,40);x.fill();}else if(k==='drop'){x.beginPath();x.moveTo(32,10);x.quadraticCurveTo(46,30,32,42);x.quadraticCurveTo(18,30,32,10);x.fill();}
 else x.fillText(k==='note'?'♪':k,32,30);});}
function emo3d(o,e,now){const U=o.userData;if(!e||now-e.t>1300){if(U.emo)U.emo.visible=false;return;}if(!U.emo){U.emo=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:false}));U.emo.renderOrder=5;o.add(U.emo);}
 const k=(now-e.t)/1300,s=Math.min(1,k*6);U.emo.visible=true;if(U.emo.userData.k!==e.k){U.emo.material.map=emoTex(e.k);U.emo.material.needsUpdate=true;U.emo.userData.k=e.k;}U.emo.position.set(0,U.baseH*1.25+k*.15,0);U.emo.scale.setScalar(.42*s/o.scale.x);U.emo.material.opacity=k>.8?(1-k)*5:1;}
// ---------- 3D-Oberwelt: wilde Kreaturen & Begleiter ----------
function syncW3(S,t){const want=ROAM.list.concat(COMP&&COMP.s?[COMP]:[]),mm=S.userData.mm||(S.userData.mm=new Map()),now=performance.now(),pu=playerH()/1.6;
 const nt=isNight();MRIMK.value=nt?.08:.13;const cam=R3&&R3.cam,ch=(R3&&R3.r&&R3.r.domElement.clientHeight)||400,ft=cam?2*Math.tan(cam.fov*Math.PI/360)/ch:.004;
 // Darstellungsart je Kreatur: GLB (nah) → Sprite → prozedural; Wechsel baut das Objekt neu (Sprites blenden weich über)
 // Nutzer 15:17: Terras (neue Tiermodelle, TERRA) laufen in der Welt immer als 3D-Modell (3–7 Calls, LOD ohne Umriss ab 4,5 Felder) – kein Billboard; im Kampf bleibt das gemalte Bild
 const kindOf=r=>{if(typeof terraOf==='function'&&terraOf(r.s)&&window.MON_RENDER!=='model')return'proc';const d=Math.hypot(P.px-r.px,P.py-r.py);let k=monRender(r.s);if(k==='proc'&&procSpriteOK(r.s))k='sprite';if(k==='model'&&spriteOK(r.s)&&d>(r._mf?13:15)){r._mf=0;return'sprite';}r._mf=k==='model';return k;};
 for(const[k,o]of mm)if(!want.includes(k)||o.userData.key!==monKey(k.s,k.o||{})+'|'+kindOf(k)){mm.delete(k);monDrop(S,o);}
 for(const r of want){const isC=r===COMP;if(isC)r.o=monOpts(typeof compMon==='function'?compMon():null);r.o=r.o||{};let o=mm.get(r);
  if(!o){const kd=kindOf(r);o=monObj(r.s,worldScale(r.s)*pu,r.o,S,kd);o.userData.key=monKey(r.s,r.o)+'|'+kd;S.add(o);mm.set(r,o);}
  const gx=r.px+.5,gz=r.py+.5;o.position.set(gx,typeof terrainY==='function'?terrainY(gx,gz):0,gz);
  const ty=r.ang!=null?r.ang:YAW[r.dir];let df=ty-o.rotation.y;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;o.rotation.y+=df*(r.st==='flee'||r.st==='charge'?.4:.2);
  const d=Math.hypot(P.px-r.px,P.py-r.py),U=o.userData;o.visible=d<20;if(!o.visible)continue;
  if(!U.sprite){const lod=isC||d<4.5?0:d<9?1:2;if(U.lod!==lod&&U.ols){U.lod=lod;U.ols.forEach(l=>l.visible=!lod);U.lod2.forEach(m=>m.visible=true);(lod===2?U.lod2:lod===1?U.lod1:[]).forEach(m=>m.visible=false);}}
  if(U.face&&!U.face.glow)U.face.eM.color.setScalar(nt?.62:1);const ex=r.expr||'neutral';if(U.expr!==ex)setExpression(o,ex);if(r.react&&U.rt!==r.react.t){U.rt=r.react.t;setExpression(o,r.react.e||'freudig',1600);if(r.react.hop)U.act.hop=now;}
  if(r.shiny&&!r.shinySeen&&d<8){r.shinySeen=1;playSeq('shinyAppear',{obj:o,r});}
  emo3d(o,r.emo,now);
  const look=d<4.5&&r.pose!=='sleep'&&r.st!=='flee'?{x:P.px+.5,z:P.py+.5}:null,cd=cam?cam.position.distanceTo(o.position):6;
  animMon(o,t,{moving:r.t<1||!!r.mv,speed:r.dur?Math.min(1.9,420/r.dur):1,pose:r.pose||null,lookAt:look,cam,pxw:cd*ft,fade:Math.max(0,Math.min(1,(20-d)/3.5))});}
 sprTick(S,cam,now);}
// Glanz-Erscheinen: Funkeln + Klang (Jingle folgt später)
async function seqShinyAppear(o){o=o||{};const now=performance.now();if(o.obj&&o.obj.userData){o.obj.userData.sparkBurst=now;setExpression(o.obj,'freudig',1500);o.obj.userData.act.hop=now;}if(o.r)o.r.sparkT=now;
 try{if(typeof playJingle==='function')playJingle('shiny');else{sfx('catch');setTimeout(()=>sfx('lvl'),180);}}catch(e){}if(typeof compReact==='function')compReact('shiny');await new Promise(r=>setTimeout(r,RED?200:900));return{ok:true};}
// Muster-Materialien (Streifen / Punkte)
function pmat(c1,c2,kind,pat){const k='p'+c1+c2+kind+pat;if(M3.mats[k])return M3.mats[k];const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),r=prng(pat.length*31+c1.length);
 x.fillStyle=c1;x.fillRect(0,0,S,S);x.fillStyle=shade(c2,.85);x.globalAlpha=.6;
 if(pat==='stripes'){for(let i=-2;i<9;i++){x.beginPath();x.moveTo(i*40,0);x.lineTo(i*40+13,0);x.lineTo(i*40+53,S);x.lineTo(i*40+40,S);x.closePath();x.fill();}}
 else for(let i=0;i<18;i++){x.beginPath();x.ellipse(r()*S,r()*S,9+r()*16,8+r()*12,r()*3,0,7);x.fill();}
 x.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.5,1.5);
 return M3.mats[k]=new THREE.MeshToonMaterial({color:'#ffffff',map:t,gradientMap:toonGrad()});}

// ===================== Nachbau der Nutzer-Konzeptkunst (public/art) =====================
// Kanon-IDs (docs/dex-kanon.md). Prozeduraler Nachbau der Illustrationen 001, 004, 007–009, 031–033, 057, 059, 061 (nur noch für die drehbare 3D-Ansicht / MON_RENDER='proc');
// bildlose Linien-Verwandte 002/003, 005/006, 058, 060, 062 als stimmige Fallbacks (in Welt und Kampf sichtbar, solange kein Bild/GLB existiert).
// ART_HUE = Farbton-Drehung der Glanzform (Grad) – identisch für Illustration (26-art.js) und 3D (shinyCols daraus berechnet).
const ART_HUE={1:190,2:190,3:190,4:115,5:115,6:115,7:-75,8:-75,9:-75,59:125,60:125,57:195,58:195,31:-95,32:-95,33:-95,61:165,62:165};
const ART_DESIGN={
 1:{konzept:'Feuerfuchs-Welpe (Nutzer-Illustration)',silhouette:'Riesenkopf, Riesenohren, kurzer Rumpf, buschiger Schweif',farben:'Glutorange/Creme + Flammengelb',merkmal:'Schweif geht in eine Flamme über, Flammenmal auf der Stirn, Creme-Pfoten',pose:'Sprung, Maul offen, fröhlich'},
 2:{konzept:'Feuerfuchs – Jungwolf',silhouette:'gestreckter Hund',farben:'Orange/Creme + Gelb',merkmal:'größerer Flammenschweif, Flammenkragen, Stirnflamme',pose:'Gewicht vorn, frech'},
 3:{konzept:'Feuerfuchs – Vulkanwolf',silhouette:'großer Hund, breite Brust, Hörner',farben:'Rotorange/Creme + Lavagelb',merkmal:'Basaltplatten, Flammenmähne, Flammenschweif',pose:'stolz'},
 4:{konzept:'Robbenbaby mit Wasserkrone (Nutzer-Illustration)',silhouette:'liegende Robbe, großer Kopf, Schwanzflossen',farben:'Himmelblau/Weiß + Rosa',merkmal:'schwebende Wasserkrone mit Blasen, Blau-Tupfen',pose:'liegt, Kopf hoch, lacht'},
 5:{konzept:'Robbe – Strudelwächter',silhouette:'größere Robbe mit Rückenflosse',farben:'Blau/Weiß + Rosa',merkmal:'größere Krone, Rückenflosse',pose:'aufgerichtet'},
 6:{konzept:'Robbe – Tiefseekönig',silhouette:'massige Robbe mit Leuchtköder',farben:'Nachtblau/Eisweiß + Leuchtcyan',merkmal:'Kronen-Köder, leuchtende Tupfen',pose:'drohend erhoben'},
 7:{konzept:'Blattbär-Junges (Nutzer-Illustration)',silhouette:'sitzender Bär, großer Kopf, runde Ohren',farben:'Braun/Creme + Blattgrün, Knospe rosa',merkmal:'Blätterhaube mit Knospen-Spross, Blätterkragen, rosa Ballen',pose:'sitzt, gähnt, verschlafen'},
 8:{konzept:'Blattbär (Nutzer-Illustration)',silhouette:'sitzender, kräftiger Bär',farben:'Moosgrün/Creme + Rosa',merkmal:'Laubfell und Blätterumhang, Knospe auf dem Kopf',pose:'sitzt aufrecht, blickt hoch'},
 9:{konzept:'Blattbär-Waldhüter (Nutzer-Illustration)',silhouette:'großer Vierbeiner-Bär',farben:'Moosgrün/Creme + Blütenrosa',merkmal:'Lilienblüte, Blättermähne, Ranken um Körper und Beine',pose:'steht, Kopf erhoben'},
 59:{konzept:'Wind-Eule (Nutzer-Illustration)',silhouette:'Federkugel mit ausgebreiteten Flügeln',farben:'Cremeweiß/Minz + Himmelblau',merkmal:'zwei Wirbel-Federkränze, V-Stirnmal, türkise Schwingen',pose:'fliegt, Flügel offen'},
 60:{konzept:'Wind-Eule – Sturmvogt',silhouette:'Greifvogel mit Wirbelkronen',farben:'Creme/Minz + Blau',merkmal:'größere Wirbel, langer Schweif',pose:'Brust raus'},
 57:{konzept:'Stein-Gürteltier (Nutzer-Illustration)',silhouette:'Vierbeiner mit Kieselpanzer, große Ohren',farben:'Sand/Steingrau + Moosgrün',merkmal:'Panzer aus Kieselplatten mit Moos, Steinschweif',pose:'steht, lächelt'},
 58:{konzept:'Stein-Gürteltier – Felsträger',silhouette:'massiger Vierbeiner',farben:'Sand/Steingrau + Moos',merkmal:'mehr Platten, Stirnhörner, dunkle Krallen',pose:'breitbeinig'},
 31:{konzept:'Sternenkätzchen (Nutzer-Illustration)',silhouette:'Kätzchen, Riesenkopf, Ringelschweif',farben:'Nachtviolett/Lavendel + Sternlicht',merkmal:'Mondsichel auf der Stirn, leuchtende Sternflecken',pose:'geduckt, verspielt'},
 32:{konzept:'Sternenkatze (Nutzer-Illustration)',silhouette:'schlanke Katze, großer Sternenschweif',farben:'Nachtviolett/Lavendel + Sternlicht',merkmal:'Halskrause, Sternflecken, Mondsichel',pose:'steht, Kopf erhoben'},
 33:{konzept:'Sternenkatze – Mondoro (Nutzer-Illustration)',silhouette:'große Katze mit Mähne und Prachtschweif',farben:'Nachtviolett/Lavendel + Gold',merkmal:'Lichtkranz mit Stern, Kristallkragen, Sternenmantel',pose:'stolz, Blick nach oben'},
 61:{konzept:'Glühwürmchen-Hase (Nutzer-Illustration)',silhouette:'schwebender Hase mit Schlappohren und Flügeln',farben:'Creme-Gelb/Lavendel + Leuchtgelb',merkmal:'Fühler mit Leuchtkugeln, Laternen-Hinterleib',pose:'schwebt, Pfoten vor der Brust'},
 62:{konzept:'Glühwürmchen-Hase – Strahli',silhouette:'größerer Flughase mit Lichtkranz',farben:'Gold-Creme/Lavendel + Licht',merkmal:'vier große Flügel, Lichtkranz, große Laterne',pose:'schwebt strahlend'}};
Object.assign(DESIGN,ART_DESIGN);
// Farben je Art aus der Illustration; sp = [Altform, Farbe 1, Farbe 2, Merkmale, Größe, Signatur, Körper, Feinmaße]
const ORG='#e5470c',CRM='#ffe2b4',CAT='#3a2a74',LAV='#bda4f2',STN='#a8a399',STB='#cbbca6';
const ART3D={
 1:[ORG,CRM,['bigEars','flameTail','flameMark','browDots','chestRuff'],.7,'#ffc21f','hound',{h:1.45,l:.8,len:.82,paw:CRM,ear:1.12,iris:'#b84a0c',cute:1,dt:'#c8400c',py:.5,tail:{n:5,L:.14,rad:[.08,.14,.19,.21,.19,.12],rx:1.05,curl:-.16,yaw:-1.0,cols:[ORG,ORG,ORG,'#f0600f','#ff8a1a']}}],
 2:['#ee5a14',CRM,['ears','flameTail','flameMark','chestRuff','flameMane'],.85,'#ffc21f','hound',{hk:'wolf',l:1.05,paw:CRM,iris:'#c2560f',tail:{n:5,L:.15,rad:[.07,.12,.17,.19,.17,.11],rx:.85,curl:-.14,cols:['#ee5a14','#ee5a14','#ee5a14','#ff7a22','#ff9a2a']}}],
 3:['#d9431a',CRM,['ears','flameTail','flameMark','chestRuff','flameMane','basalt','hornsBack'],1,'#ffb02e','hound',{hk:'wolf',w:1.15,l:1.1,paw:CRM,iris:'#c2560f',tail:{n:5,L:.17,rad:[.08,.13,.18,.2,.18,.12],rx:.8,curl:-.12,cols:['#d9431a','#d9431a','#d9431a','#ff6a1a','#ff9a2a']}}],
 4:['#4f9fe8','#ffffff',['waterCrown','sealSpots','sealWhiskers','bubbles'],.7,'#9fe2ff','seal',{cute:1,iris:'#1f6fd0',spot:'#3f86d8',eye:1.1,py:.55}],
 5:['#3f98e8','#ffffff',['waterCrown','sealSpots','sealWhiskers','backFin','bubbles'],.85,'#9fe2ff','seal',{w:1.15,iris:'#1f6fd0',spot:'#2a6fc0',py:.45}],
 6:['#25529e','#dcefff',['waterCrown','sealSpots','sealWhiskers','backFin','lure'],1,'#7ff7ff','seal',{w:1.35,iris:'#21c8f0',spot:'#7ff0ff',glowSpots:1,fierce:1,py:.4}],
 7:['#a8703e','#f3dfb4',['roundEars','leafCap','budSprout','leafCollar','leafBack'],.7,'#ff9fc0','bearsit',{cute:1,earIn:'#f3dfb4',iris:'#4a2a14',leaf:'#8cc63a'}],
 8:['#93ae3a','#f3e0b2',['roundEars','leafCap','budSprout','leafMantle','leafCollar'],.85,'#ff9fc0','bearsit',{w:1.15,h:.92,earOut:'#efdcae',earIn:'#8a6436',iris:'#6a3a14',paw:'#efdcae',leaf:'#82c23e',cute:1}],
 9:['#8cab38','#f3e0b2',['roundEars','lily','leafMane','vines','blossoms','legLeaves'],1,'#ff8fb8','bear',{h:1.4,py:.25,earOut:'#efdcae',earIn:'#8a6436',paw:'#efdcae',iris:'#6a3a14',leaf:'#7fc23e'}],
 59:['#fbf7ee','#ffffff',['swirlCrest','vMark','chestScallops'],.65,'#45a6ea','bird',{v:'owl',bk:'short',wc:['#ffffff','#7ad6b4','#3a9ff0'],wca:'#ffffff',wOpen:1,ws:1.35,wPitch:.05,wRaise:.55,iris:'#1f78d8',cute:1,beak:'#f5b733',eye:1.12}],
 60:['#efe8d8','#ffffff',['swirlCrest','vMark','chestScallops','tailLong'],1,'#45a6ea','bird',{v:'raptor',bk:'hook',wc:['#ffffff','#7ad6b4','#3a9ff0'],wca:'#efe8d8',wOpen:.8,wPitch:.2,wRaise:.35,beak:'#f2b33a',iris:'#1f78d8'}],
 57:['#dbbb8c','#f6e6c8',['bigEars','stoneShell','headPlates','legPlates','mossTufts'],.65,'#7cc24a','dillo',{earIn:'#f2a08a',ear:.95,paw:'#dbbb8c',iris:'#7a3d10',cute:1,tail:{cols:[STN,STB,STN,STB,STN]}}],
 58:['#c9a878','#ecdcbc',['bigEars','stoneShell','headPlates','legPlates','mossTufts','hornsStub','toeClaws'],1,'#7cc24a','dillo',{w:1.3,len:1.15,h:.9,l:1.1,earIn:'#f2a08a',paw:'#c9a878',iris:'#7a3d10',tail:{cols:[STN,STB,STN,STB,STN]}}],
 31:[CAT,LAV,['catEars','crescent','starSpots','catWhiskers'],.65,'#fff0b0','cat',{h:1.55,l:.7,len:.8,w:1.3,iris:'#7a3fd8',glowEyes:0,cute:1,fierce:0,paw:'#c9b4f5',ear:1.2,eye:1.08,tail:{n:6,L:.115,rad:[.06,.08,.1,.11,.11,.09,.04],rx:1.0,curl:-.45,cols:[CAT,CAT,CAT,LAV,CAT,LAV]}}],
 32:[CAT,LAV,['catEars','crescent','starSpots','catWhiskers','ruff'],.9,'#fff0b0','cat',{h:1.15,l:1.05,len:1.0,w:1.2,iris:'#7a3fd8',glowEyes:0,fierce:0,paw:'#c9b4f5',ear:1.1,tail:{n:6,L:.15,rad:[.06,.1,.14,.16,.16,.13,.05],rx:.95,curl:-.42,cols:[CAT,CAT,CAT,LAV,CAT,LAV]}}],
 33:['#35266e',LAV,['catEars','crescent','starSpots','catWhiskers','ruff','starHalo','crystalCollar','starMantle'],1.05,'#ffe7a0','cat',{h:1.0,l:1.2,len:1.12,w:1.25,iris:'#7a3fd8',glowEyes:0,fierce:0,paw:'#c9b4f5',tail:{n:6,L:.17,rad:[.07,.12,.17,.2,.2,.16,.06],rx:.95,curl:-.4,cols:['#35266e','#35266e','#35266e',LAV,'#35266e',LAV]}}],
 61:['#fcecb4','#b79ae2',['floppyEars','bulbAntennae','fairyWings','lanternTail','headTuft'],.6,'#ffe27a','bunny',{cute:1,iris:'#6a3cc8',paw:'#b79ae2',earIn:'#ffc66a',eye:1.05}],
 62:['#fde2a2','#b79ae2',['floppyEars','bulbAntennae','fairyWings','lanternTail','headTuft','halo'],1,'#ffe27a','bunny',{w:1.2,h:.92,iris:'#6a3cc8',paw:'#b79ae2',earIn:'#ffc66a',ear:1.25,wings:2}]};
function hueRot(c,deg){const C=new THREE.Color(c),o={};C.getHSL(o);if(o.s<.16||!deg)return'#'+C.getHexString();C.setHSL((o.h+deg/360+1)%1,o.s,o.l);return'#'+C.getHexString();}
// Überschreibt sp/shinyCols/DESIGN einer Art einmalig (Altform sp[0] bleibt für 2D-Fallback und Rufe)
function artSpec(id){const M=MONS[id],A=ART3D[id];if(!M||!A||M._art3d)return;M._art3d=1;M.sp=[M.sp?M.sp[0]:'quad'].concat(A);const K=M.sp[7];if(K&&!K.eyeSty&&!K.glowEyes)K.eyeSty='big';
 if(window.THREE&&ART_HUE[id]!=null)M.shinyCols=[A[0],A[1],A[4]].map(c=>hueRot(c,ART_HUE[id]));}
function applyArt3D(){for(const id in ART3D)artSpec(+id);}
applyArt3D();
// Hilfen: Ausrichtung (+y → dir, +z → Normale), 4-Zack-Stern, Flammenzunge
function orientM(p,dir,nrm,s){const Y=new THREE.Vector3(dir[0],dir[1],dir[2]).normalize(),Z0=new THREE.Vector3(nrm[0],nrm[1],nrm[2]);let Z=Z0.sub(Y.clone().multiplyScalar(Z0.dot(Y)));if(Z.lengthSq()<1e-6)Z=new THREE.Vector3(0,0,1);Z.normalize();
 const X=new THREE.Vector3().crossVectors(Y,Z),m=new THREE.Matrix4().makeBasis(X,Y,Z),sc=typeof s==='number'?[s,s,s]:s;m.scale(new THREE.Vector3(sc[0],sc[1],sc[2]));m.setPosition(p[0],p[1],p[2]);return m;}
function star4G(){return gc('star4',()=>{const s=new THREE.Shape();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?.32:1;i?s.lineTo(Math.sin(a)*r,Math.cos(a)*r):s.moveTo(Math.sin(a)*r,Math.cos(a)*r);}s.closePath();return ext(s,.12);});}
function tongueG(){return gc('tongueF',()=>{const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(.5,.1,.45,.6,.12,1);s.bezierCurveTo(.2,.62,-.05,.55,-.22,.72);s.bezierCurveTo(-.32,.4,-.4,.15,0,0);return ext(s,.06);});}
function petalG(){return gc('petal',()=>{const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(.55,.2,.42,.85,0,1.05);s.bezierCurveTo(-.42,.85,-.55,.2,0,0);return ext(s,.025);});}
// ---------- Körper: Robbe (liegend) ----------
function bSeal(X){const{U,C,K}=X,w=K.w,B=X.L('body',X.bd),PTS=[[0,.34,-.12,.37],[0,.31,.18,.33],[0,.26,.44,.24],[0,.25,.64,.14],[0,.3,.78,.07]];
 B.t(PTS.map(q=>[q[0],q[1],q[2]]),PTS.map((q,i)=>q[3]*(i<4?w:1)),C.a,16);B.t([[0,.22,-.16],[0,.19,.16],[0,.17,.42]],[.33*w,.28*w,.17*w],C.b,14);
 X.surf=(z,a)=>{let i=0;while(i<PTS.length-2&&PTS[i+1][2]<z)i++;const p=PTS[i],q=PTS[i+1],t=Math.max(0,Math.min(1,(z-p[2])/(q[2]-p[2]))),r=(p[3]+(q[3]-p[3])*t)*(i<3?w:1),cy=p[1]+(q[1]-p[1])*t;return[[Math.sin(a)*r,cy+Math.cos(a)*r,z],[Math.sin(a),Math.cos(a),0]];};
 const hr=.4*K.h;mkHead(X,X.bd,[0,.5,-.36],hr,'seal');X.top=[0,hr*.86,0];
 [-1,1].forEach((s,i)=>{const a=grp(X.bd,s*.3*w,.16,-.2);X.L('arm'+i,a).s([s*.1,-.06,-.04],[.16,.065,.21],C.b,[0,s*.45,s*.35]).s([s*.13,-.02,-.09],[.065,.03,.06],C.p).s([s*.06,-.03,-.13],[.045,.025,.045],C.p);U.arms.push({u:a,l:null,s});});
 const tg=grp(X.bd,0,.3,.8);tg.userData.rx0=0;const T=X.L('fluke',tg);[-1,1].forEach(s=>{T.s([s*.13,.07,.06],[.13,.05,.2],C.b,[.55,s*.55,s*.35]);T.s([s*.09,.075,.02],[.08,.052,.11],C.a,[.55,s*.55,s*.35]);});U.tail.push(tg);
 X.back=[[0,.64,.0],[0,.58,.25],[0,.48,.48]];X.sho=[0,.6,-.05];X.neck=[0,.45,-.2];X.nr=.3;X.tip={par:tg,pos:[0,.1,.1]};X.earP=[.5,.6,.05];}
// ---------- Körper: sitzender Bär ----------
function bBearSit(X){const{U,C,K}=X,w=K.w,B=X.L('body',X.bd);B.s([0,.34,0],[.35*w,.37,.33*w],C.a);B.s([0,.31,-.2],[.23*w,.26,.15],C.b);B.s([0,.2,.26],[.07,.07,.07],C.a);
 const hr=.37*K.h;mkHead(X,X.bd,[0,.68+hr*.55,-.04],hr,'bear');X.top=[0,hr*.84,0];X.earP=[.62,.6,.05];
 [-1,1].forEach((s,i)=>{const u=grp(X.bd,s*.2*w,.06,-.18),F=X.L('ft'+i,u);F.s([0,.07,.12],[.14,.12,.19],C.a).s([0,.06,-.05],[.12,.11,.1],X.paw||C.a).s([0,.065,-.13],[.095,.095,.03],X.paw||C.b)
   .s([0,.045,-.155],[.05,.04,.012],C.p);[-1,0,1].forEach(j=>F.s([j*.042,.105,-.15],[.022,.02,.01],C.p));U.legs.push({u,l:null,front:true,s});
  const a=grp(X.bd,s*.32*w,.47,-.1);X.L('arm'+i,a).s([s*.03,-.09,-.05],[.085,.14,.085],C.a).s([s*.035,-.2,-.08],[.07,.05,.06],X.paw||C.a);U.arms.push({u:a,l:null,s});});
 X.back=[[0,.66,.12],[0,.52,.28],[0,.34,.33]];X.sho=[0,.6,.08];X.neck=[0,.66,-.02];X.nr=.21*w;X.tip={par:X.bd,pos:[0,.2,.3]};X.r=.35*w;X.h=.34;}
// ---------- Körper: schwebender Hase (Glühwürmchen) ----------
function bBunny(X){const{U,C,K}=X,w=K.w,B=X.L('body',X.bd);B.s([0,.42,.02],[.25*w,.29,.24*w],C.a);B.s([0,.46,-.16],[.17*w,.2,.1],mixC(C.a,'#ffffff',.5));
 [-1,1].forEach((s,i)=>{B.s([s*.13,.36,.12],[.09,.08,.07],C.b,0);const u=grp(X.bd,s*.11*w,.2,-.04);X.L('ft'+i,u).s([0,-.02,-.02],[.075,.095,.085],C.a).s([0,-.07,-.05],[.07,.05,.07],X.paw||C.b);U.legs.push({u,l:null,front:true,s});
  const a=grp(X.bd,s*.16*w,.6,-.16);X.L('arm'+i,a).s([s*.0,-.05,-.04],[.075,.09,.075],X.paw||C.b);U.arms.push({u:a,l:null,s});});
 B.t([[-.15,.62,-.2],[0,.58,-.25],[.15,.62,-.2]],[.07,.09,.07],mixC(C.a,'#ffffff',.55),8);
 const hr=.31*K.h;X.H=grp(X.bd,0,.84+hr*.2,-.02);mkHead(X,X.bd,[0,.84+hr*.2,-.02],hr,'bunny');X.top=[0,hr*.9,0];U.hover=.24;
 X.back=[[0,.7,.18],[0,.56,.24],[0,.4,.26]];X.sho=[0,.66,.12];X.neck=[0,.66,-.02];X.nr=.2;X.tip={par:X.bd,pos:[0,.22,.3]};}
// Vierbeiner-Varianten: schwerer Bär, Gürteltier
Object.assign(QD,{bear:{len:.74,r:.31,h:.5,neck:[.1,.1],nr:.21,head:.31,hk:'bear',paw:'paw',lr:.115,tail:{n:1,L:.06,rad:[.07,.04],rx:1.6,curl:0},chest:1.2,hip:1.08},
 dillo:{len:.62,r:.27,h:.36,neck:[.06,.13],nr:.15,head:.28,hk:'fox',paw:'paw',lr:.085,tail:{n:5,L:.085,rad:[.1,.09,.08,.065,.05,.02],rx:1.25,curl:.22},chest:1.0,hip:1.12}});
// ---------- Merkmale aus den Illustrationen ----------
Object.assign(FEAT,{
 // Fuchs: Schweif mit Flamme, Stirnflamme, Creme-Punkte über den Augen, Brustflausch
 flameTail:X=>{const T=X.tip,s=X.stage>2?1.3:X.stage>1?1.15:1;flame(X,T.par,[0,T.pos[1]-.04,0],.95*s,X.fc).rotation.x=-.25;},
 flameMark:X=>{const h=X.hr,G=X.L('headG',X.H,'MG');G.g(tongueG(),orientM([0,h*.6,-h*.76],[0,1,-.35],[0,.55,-1],[h*.34,h*.46,h*.5]),X.C.s);},
 browDots:X=>{const h=X.hr,L=X.L('head',X.H);[-1,1].forEach(s=>L.s([s*h*.4,h*.5,-h*.74],[h*.13,h*.08,h*.07],X.C.b,[.5,0,-s*.3]));},
 chestRuff:X=>{const L=X.L('body',X.bd),N=X.neck,R=X.nr*1.25;for(let i=0;i<7;i++){const a=(i-3)*.42,b=[N[0]+Math.sin(a)*R,N[1]-.02-Math.abs(a)*.03,N[2]-Math.cos(a)*R*.8];L.t([b,[b[0]*1.1,b[1]-.08,b[2]-.05],[b[0]*1.15,b[1]-.16,b[2]-.03]],[R*.36,R*.22,.004],X.C.b,8);}},
 // Robbe: Wasserkrone mit Blasen, Tupfen, Schnurrhaare, freie Blasen, Rückenflosse
 waterCrown:X=>{const h=X.hr,g=grp(X.H,0,X.top[1]+h*.55,-h*.05),G=X.L('crown',g),B2=X.L('crownG',g,'MG'),cc='#5ab4f0',R=h*.4,n=X.stage>1?7:5;
  G.g(torG(.16),mtx([0,0,0],[Math.PI/2,0,0],[R,R,1]),cc);
  for(let j=0;j<n;j++){const a=j/n*Math.PI*2,x=Math.sin(a)*R,z=Math.cos(a)*R,t=j%2?.75:1;G.t([[x,0,z],[x*1.1,h*.16*t,z*1.1],[x*1.2,h*.3*t,z*1.2]],[h*.085,h*.06,h*.05],cc,8);B2.s([x*1.2,h*.4*t,z*1.2],[h*.13,h*.13,h*.13],'#9fdcff');}
  X.U.spin.push([g,'y',.35]);if(X.has('lure'))X.U.pulse=1;},
 sealSpots:X=>{if(!X.surf)return;const L=X.L(X.K.glowSpots?'spotG':'body',X.bd,X.K.glowSpots?'MG':0),c=X.K.spot||shade(X.C.a,.78);[[.05,.7,.06],[.2,-.55,.05],[.36,.9,.045],[.48,-.95,.04],[.3,.25,.055],[.55,.55,.035]].forEach(([z,a,r])=>{const[p,n]=X.surf(z,a);L.g(sph(),orientM(p,[n[1],-n[0],0],n,[r,r*.8,r*.35]),c);});
  const H=X.L('head',X.H),h=X.hr;[[-.25,.82,.1],[.3,.78,.08]].forEach(([x,y,r])=>H.s([x*h,y*h,h*.1],[r*h*1.2,r*h*.5,r*h],'#ffffff'));},
 sealWhiskers:X=>{const L=X.L('head',X.H),h=X.hr,c='#2f4f8a';[-1,1].forEach(s=>[0,1].forEach(j=>L.t([[s*h*.38,-h*(.28+j*.1),-h*.9],[s*h*.62,-h*(.27+j*.14),-h*.82],[s*h*.82,-h*(.24+j*.2),-h*.66]],[h*.022,h*.018,h*.012],c,4)));},
 bubbles:X=>{const G=X.L('bubG',X.bd,'MG');[[.42,.62,-.3,.05],[-.46,.5,-.1,.04],[.5,.32,.3,.035],[-.38,.86,-.5,.03]].forEach(([x,y,z,r])=>G.s([x,y,z],[r,r,r],'#dff5ff'));},
 // Bär: Blätterhaube, Knospen-Spross, Blätter auf Rücken/Umhang/Mähne, Lilie, Ranken, Blüten
 leafCap:X=>{const L=X.L('leafH',X.H),h=X.hr,c=X.K.leaf||mixC(X.C.a,'#9ad04a',.6);[[.32,6,.58],[.9,9,.62]].forEach(([ph,n,len],r)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r*.35;if(r&&Math.cos(a)<-.45)continue;
  const nn=[Math.sin(a)*Math.sin(ph),Math.cos(ph),Math.cos(a)*Math.sin(ph)],p=nn.map((v,j)=>v*h*(j===1?.98:1.04)),d=[Math.sin(a)*Math.cos(ph)+nn[0]*.35,-Math.sin(ph)+nn[1]*.35,Math.cos(a)*Math.cos(ph)+nn[2]*.35];L.g(leafG(),orientM(p,d,nn,[h*.46,h*len,h*.46]),(i+r)%2?c:shade(c,.85));}});},
 budSprout:X=>{const t=X.top,h=X.hr,L=X.L('head',X.H),G=X.L('headG',X.H,'MG'),c=X.K.leaf||'#8cc63a',st=[[t[0],t[1]-h*.05,t[2]],[t[0]+h*.06,t[1]+h*.4,t[2]+h*.02],[t[0]+h*.12,t[1]+h*.72,t[2]]];
  L.t(st,[h*.06,h*.05,h*.045],shade(c,.8),6);[[-1,.5],[1,.3]].forEach(([s,y])=>L.g(leafG(),orientM([t[0]+h*.06,t[1]+h*y,t[2]],[s,.55,0],[0,0,-1],[h*.42,h*.62,h*.42]),s<0?c:shade(c,.9)));
  const b=[t[0]+h*.12,t[1]+h*.92,t[2]];G.s(b,[h*.17,h*.24,h*.17],X.C.s);G.g(coneG(8),mtx([b[0],b[1]+h*.12,b[2]],0,[h*.11,h*.16,h*.11]),X.C.s);
  [0,1,2].forEach(j=>{const a=j/3*Math.PI*2;L.g(leafG(),orientM([b[0]+Math.sin(a)*h*.06,b[1]-h*.18,b[2]+Math.cos(a)*h*.06],[Math.sin(a)*.4,1,Math.cos(a)*.4],[Math.sin(a),0,Math.cos(a)],[h*.14,h*.24,h*.14]),c);});},
 leafBack:X=>{const L=X.L('leafB',X.bd),c=X.K.leaf||'#8cc63a';for(let i=0;i<7;i++){const a=-1.3+i/6*2.6,n=[Math.sin(a),.25,Math.cos(a)*.6+.4],p=[n[0]*X.r*1.0,.28+i%2*.06,.05+n[2]*X.r*.7];L.g(leafG(),orientM(p,[n[0],-.6,n[2]],n,[.16,.22,.16]),i%2?c:shade(c,.85));}},
 leafMantle:X=>{const L=X.L('leafM',X.bd),c=X.K.leaf||'#82c23e',w=X.K.w;for(let r=0;r<2;r++)for(let i=0;i<9;i++){const a=-1.9+i/8*3.8,y=.58-r*.2,n=[Math.sin(a),.3,Math.cos(a)],p=[n[0]*X.r*(1.02+r*.1),y,n[2]*X.r*(.95+r*.1)+.04];
  L.g(leafG(),orientM(p,[n[0]*.6,-.8,n[2]*.6],n,[.17,.25,.17]),(i+r)%2?c:shade(c,.82));}},
 leafMane:X=>{const L=X.L('mane',X.bd),c=X.K.leaf||'#7fc23e',N=X.neck,R=X.nr*1.9;for(let r=0;r<2;r++)for(let i=0;i<11;i++){const a=-2.4+i/10*4.8,n=[Math.sin(a),Math.cos(a)*.9,.25+r*.3],p=[N[0]+n[0]*R*(1+r*.15),N[1]+n[1]*R*.85,N[2]+.04+r*.16];
  L.g(leafG(),orientM(p,[n[0],n[1]*.4-.5,.7],n,[.17,.27,.17]),(i+r)%2?c:shade(c,.84));}
  X.back.forEach((q,i)=>[-1,1].forEach(s=>L.g(leafG(),orientM([q[0]+s*.12,q[1]-.02,q[2]],[s*.8,-.4,.3],[s,.6,0],[.15,.24,.15]),i%2?c:shade(c,.88))));},
 lily:X=>{const t=X.top,h=X.hr,G=X.L('headG',X.H,'MG'),L=X.L('head',X.H),c0=[t[0]+h*.1,t[1]+h*.18,t[2]+h*.05],lc=X.K.leaf||'#7fc23e';
  [[-1,.2],[1,-.1],[-.3,.9]].forEach(([s,z])=>L.g(leafG(),orientM([c0[0],c0[1]-h*.05,c0[2]+z*h*.2],[s,.35,z*.3],[0,1,0],[h*.55,h*.85,h*.55]),lc));
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;G.g(petalG(),orientM([c0[0]+Math.sin(a)*h*.08,c0[1]+h*.08,c0[2]+Math.cos(a)*h*.08],[Math.sin(a)*.8,1,Math.cos(a)*.8],[Math.sin(a),-.6,Math.cos(a)],[h*.32,h*.52,h*.32]),k%2?X.C.s:mixC(X.C.s,'#ffffff',.3));}
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;L.t([[c0[0],c0[1]+h*.1,c0[2]],[c0[0]+Math.sin(a)*h*.1,c0[1]+h*.42,c0[2]+Math.cos(a)*h*.1]],[h*.02,h*.015],'#f2c230',4);L.s([c0[0]+Math.sin(a)*h*.1,c0[1]+h*.45,c0[2]+Math.cos(a)*h*.1],[h*.04,h*.04,h*.04],'#e89a1a');}},
 vines:X=>{const L=X.L('vine',X.bd),vc='#8a5a30',r=X.r*1.04,h=X.h,len=X.len;for(let v=0;v<2;v++){const P=[];for(let k=0;k<=10;k++){const t=k/10,a=t*Math.PI*2.4+v*Math.PI;P.push([Math.sin(a)*r,h+Math.cos(a)*r*.95,-len*.45+t*len*.9]);}L.t(P,[.03,.025,.025,.02],vc,6);}
  X.U.legs.forEach((lg,i)=>{if(i%3)return;const p=lg.u.position;L.t([[p.x*1.25,p.y-.02,p.z-.06],[p.x*1.4,p.y-.12,p.z+.02],[p.x*1.3,p.y-.24,p.z-.05]],[.025,.022,.018],vc,6);});},
 blossoms:X=>{const G=X.L('blosG',X.bd,'MG');[[-.18,.12],[.2,.0],[-.05,.3],[.26,.28]].forEach(([x,z],i)=>{const y=X.h+X.r*1.02-Math.abs(x)*.2;for(let k=0;k<5;k++){const a=k/5*Math.PI*2;G.s([x+Math.sin(a)*.035,y,z*X.len+Math.cos(a)*.035],[.03,.012,.03],X.C.s);}G.s([x,y+.01,z*X.len],[.016,.012,.016],'#ffd84a');});},
 legLeaves:X=>{X.U.legs.forEach((lg,i)=>{const L=X.L('lu'+i,lg.u),c=X.K.leaf||'#7fc23e';L.g(leafG(),orientM([lg.s*.06,-.08,-.06],[0,-1,-.3],[lg.s,0,-.4],[.07,.12,.07]),mixC(c,'#e8f0a0',.35));});},
 // Eule: Wirbel-Federkränze, V-Stirnmal, Brust-Schuppen
 swirlCrest:X=>{const L=X.L('head',X.H),h=X.hr*(X.stage>1?1.25:1.05),cs=X.K.wc||['#ffffff','#86d8bc','#45a6ea'];[-1,1].forEach(s=>{[0,1,2].forEach(j=>{const P=[];for(let k=0;k<=12;k++){const t=k/12,a=t*Math.PI*1.75-.3,r=h*(.95-t*.68)-j*h*.08;P.push([s*(h*.55+Math.sin(a)*r*.95+h*.15),h*.55+h*.35+(1-Math.cos(a))*r*.62,-j*h*.06+h*.05]);}
   L.t(P,[h*.2-j*h*.04,h*.16,h*.1,h*.03],cs[2-j],8);});});},
 vMark:X=>{const L=X.L('head',X.H),h=X.hr,c=(X.K.wc||[])[1]||X.C.s;[-1,1].forEach(s=>L.t([[0,h*.25,-h*.9],[s*h*.22,h*.48,-h*.86],[s*h*.42,h*.7,-h*.74]],[h*.07,h*.06,h*.03],c,6));},
 chestScallops:X=>{const L=X.L('body',X.bd),c=(X.K.wc||[])[1]||X.C.s,b=X.back?0:0;const Q=BIRD[X.K.v||'owl'],by=Q.by*X.K.l,rz=Q.br[2]*X.K.w;[[0,-.02],[1,-.16]].forEach(([r,dy])=>{const n=3-r;for(let i=0;i<n;i++){const x=(i-(n-1)/2)*.1;L.g(torG(.18,Math.PI),mtx([x,by+dy,-rz*.98],[0,0,Math.PI],[.045,.04,.05]),c);}});},
 // Gürteltier: Kieselpanzer, Kopfplatten, Beinplatten, Moos, dunkle Krallen
 stoneShell:X=>{const L=X.L('stone',X.bd),r=X.r*1.12,h=X.h,len=X.len,cs=[STN,STB,'#b6ada0','#d6c8b0'],rows=X.stage>1?6:5;let k=0;for(let i=0;i<rows;i++){const z=-len*.42+i/(rows-1)*len*.92,rr=r*(1-Math.pow((i-(rows-1)*.55)/(rows*.8),2)*.5),n=i%2?4:5;
  for(let j=0;j<n;j++){const a=-1.35+j/(n-1)*2.7,nn=[Math.sin(a),Math.cos(a),(z/len)*.5];L.g(sphLo(),orientM([Math.sin(a)*rr,h+r*.05+Math.cos(a)*rr*.95,z],[0,-nn[2],1],nn,[r*.4,r*.38,r*.17]),cs[k++%4]);}}
  X.stones=k;},
 headPlates:X=>{const L=X.L('stone',X.bd),H=X.L('head',X.H),h=X.hr;[[0,.78,.05,.42],[-.42,.6,-.2,.26],[.42,.6,-.2,.26]].forEach(([x,y,z,s],i)=>H.g(sphLo(),orientM([x*h,y*h,z*h],[0,.3,1],[x,1,-.3],[h*s*1.1,h*s*.9,h*s*.42]),i?STB:STN));
  const N=X.neck;L.g(sphLo(),orientM([N[0],N[1]+X.nr*.9,N[2]],[0,.4,1],[0,1,-.2],[X.nr*1.2,X.nr*.9,X.nr*.4]),STB);},
 legPlates:X=>{const L=X.L('stone',X.bd);X.U.legs.forEach((l,i)=>{const p=l.u.position;L.g(sphLo(),orientM([p.x*1.18,p.y-.04,p.z],[0,-1,0],[l.s,.2,0],[.1,.1,.06]),i%2?STN:STB);});},
 mossTufts:X=>{const L=X.L('moss',X.bd),r=X.r*1.12,h=X.h,len=X.len,c='#7cc24a';[[-.2,.1],[.15,-.4],[.35,.4],[-.3,.7],[0,-.8]].forEach(([zz,a],i)=>{const z=zz*len,p=[Math.sin(a)*r*1.02,h+r*.05+Math.cos(a)*r*1.05,z];for(let q=0;q<3;q++)L.s([p[0]+(q-1)*.035,p[1]+.012,p[2]+(q%2)*.03],[.045,.022,.04],q%2?c:shade(c,.85),0,1);});
  X.L('head',X.H).s([X.hr*.1,X.hr*.95,X.hr*.05],[X.hr*.2,X.hr*.07,X.hr*.16],c,0,1);},
 toeClaws:X=>{X.U.legs.forEach((lg,i)=>{if(!lg.l)return;const L=X.L('ll'+i,lg.l),f=lg.foot;[-1,0,1].forEach(j=>L.g(coneG(5),mtx([f[0]+j*.03,f[1]+.01,f[2]-.02],[-Math.PI/2+.2,0,0],[.018,.06,.018]),'#4a3a34'));});},
 // Sternenkatze: Mondsichel, Sternflecken, Halskrause, Lichtkranz mit Stern, Kristallkragen, Sternenmantel
 crescent:X=>{const h=X.hr,G=X.L('headG',X.H,'MG'),L=X.L('head',X.H);G.g(torG(.34,Math.PI*1.25),orientM([0,h*.62,-h*.72],[1,0,0],[0,.55,-1],[h*.17,h*.17,h*.17]),X.C.s);[-1,1].forEach(s=>L.s([s*h*.34,h*.5,-h*.78],[h*.09,h*.06,h*.05],X.C.b));},
 starSpots:X=>{const G=X.L('starG',X.bd,'MG'),r=X.r,h=X.h,len=X.len,big=X.stage>1?1.3:1;[[1,.35,.32,.9],[1,.85,.05,.6],[-1,.4,.3,.75],[1,.1,-.1,.45],[-1,.75,.0,.5]].forEach(([s,a,z,k])=>{const n=[s*Math.sin(a),Math.cos(a),.15];G.g(star4G(),orientM([n[0]*r*1.02,h+n[1]*r*1.0,z*len],[0,0,-1],n,r*.28*k*big),X.C.s);});
  const tp=X.tip;if(tp&&tp.par&&X.body==='cat'){const rr=(X.K.tail&&X.K.tail.rad?X.K.tail.rad[4]:.1)*1.02;[-1,1].forEach(s=>X.L('tailStarG',tp.par,'MG').g(star4G(),orientM([s*rr,.02,0],[0,1,0],[s,0,0],rr*.55*big),X.C.s));}},
 ruff:X=>{const L=X.L('body',X.bd),N=X.neck,R=X.nr*1.6,n=X.stage>2?11:8;for(let i=0;i<n;i++){const a=(i/(n-1)-.5)*3.6,b=[N[0]+Math.sin(a)*R*.9,N[1]-.04-Math.abs(a)*.02,N[2]-Math.cos(a)*R*.55+.02],ln=R*(X.stage>2?1.1:.85);
  L.t([b,[b[0]*1.15,b[1]-ln*.45,b[2]-ln*.25],[b[0]*1.25,b[1]-ln*.9,b[2]-ln*.15]],[R*.4,R*.26,.004],X.C.b,8);}},
 starHalo:X=>{const h=X.hr,g=grp(X.H,0,h*1.25,h*.1);g.rotation.set(Math.PI/2-.42,0,.25);const m=bmat('#ffe7a0'),ring=mesh(torG(.035),m,g,0,0,0,h*1.15,h*1.15,h*1.15);ring.userData.noOL=1;const st=mesh(star4G(),bmat('#fff6d0'),g,-h*.95,h*.6,0,h*.28,h*.28,h*.28);st.rotation.x=-Math.PI/2+.42;st.userData.noOL=1;g.userData.y0=g.position.y;X.U.fx.halo=g;},
 crystalCollar:X=>{const N=X.neck,R=X.nr*1.45,L=X.L('collar',X.bd),G=X.L('collarG',X.bd,'MG');L.g(torG(.12,Math.PI*.9),orientM([N[0],N[1]-.04,N[2]-.01],[1,0,0],[0,.3,-1],[R,R,R*.8]),'#f2c862');
  G.g(crystalG(),mtx([N[0],N[1]-R*.9,N[2]-R*.55],[Math.PI,0,0],[.07,.13,.07]),'#c88aff');[-1,1].forEach(s=>L.g(coneG(4),mtx([N[0]+s*R*.45,N[1]-R*.5,N[2]-R*.62],[0,0,s*2.6],[.03,.12,.02]),'#f2c862'));},
 starMantle:X=>{const L=X.L('mantle',X.bd),r=X.r,h=X.h,len=X.len;L.g(hemi(),mtx([0,h+r*.15,-len*.12],[0,0,0],[r*1.32,r*1.05,len*.42]),'#2a1c5e');L.g(torG(.06),mtx([0,h+r*.17,-len*.12],[Math.PI/2,0,0],[r*1.31,len*.41,.5]),'#f2c862');
  const G=X.L('starG',X.bd,'MG');[[-.6,.0],[.7,-.2],[0,.25]].forEach(([a,z])=>G.g(star4G(),orientM([Math.sin(a)*r*1.3,h+r*.15+Math.cos(a)*r*1.0,z*len-len*.12],[0,0,-1],[Math.sin(a),Math.cos(a),0],r*.15),'#fff4c0'));},
 catWhiskers:X=>{const L=X.L('head',X.H),h=X.hr;[-1,1].forEach(s=>[0,1].forEach(j=>L.t([[s*h*.5,-h*(.2+j*.12),-h*.72],[s*h*.78,-h*(.17+j*.16),-h*.58],[s*h*.98,-h*(.12+j*.22),-h*.4]],[h*.035,h*.028,h*.012],X.C.b,4)));},
 // Glühwürmchen-Hase: Schlappohren, Fühler mit Leuchtkugeln, Flügel, Laternen-Hinterleib, Stirnbüschel
 floppyEars:X=>{const{U,C}=X,h=X.hr,k=X.K.ear||1;[-1,1].forEach((s,i)=>{const g=grp(X.H,s*h*.5,h*.62,h*.05);g.rotation.z=0;g.userData.rz0=0;g.scale.z=.42;const E=X.L('ear'+i,g),P=[[0,0,0],[s*h*.3*k,h*.55*k,0],[s*h*1.0*k,h*.88*k,0],[s*h*1.68*k,h*.45*k,0]];
  E.t(P,[h*.16,h*.36,h*.44,h*.2],C.a,12);E.t(P.slice(1).map(q=>[q[0],q[1]-h*.03,q[2]-h*.16]),[h*.26,h*.33,h*.12],X.earIn||C.p,10);E.t([[P[2][0]*1.12,P[2][1]-h*.02,0],[P[3][0]*1.02,P[3][1],0]],[h*.43,h*.2],C.b,10);U.ears.push(g);});},
 bulbAntennae:X=>{const h=X.hr,t=X.top,L=X.L('head',X.H),G=X.L('headG',X.H,'MG');[-1,1].forEach(s=>{const e=[t[0]+s*h*.55,t[1]+h*1.0,t[2]+h*.05];L.t([[t[0]+s*h*.12,t[1]-h*.05,t[2]],[t[0]+s*h*.3,t[1]+h*.55,t[2]+h*.05],e],[h*.045,h*.035,h*.03],'#b08a6a',6);G.s(e,[h*.17,h*.17,h*.17],X.C.s);});},
 fairyWings:X=>{const m=bmat(mixC(X.C.b,'#fff3c0',.2),{transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide}),vein=bmat(shade(X.C.b,.85),{transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}),k=X.K.wings||1;
  X.U.fx.bug=[-1,1].map(s=>{const g=grp(X.bd,s*.1,.56,.18),q=mesh(gc('fwing'+k,()=>mergeG([[sph(),mtx([.3*k,.14*k,0],[0,0,.42],[.32*k,.15*k,.012])],[sph(),mtx([.24*k,-.1*k,0],[0,0,-.38],[.22*k,.1*k,.012])]])),m,g,0,0,0,1);q.scale.x=s;q.userData.noOL=1;
   const v=mesh(gc('fvein'+k,()=>mergeG([[torG(.06),mtx([.3*k,.14*k,.004],[0,0,.42],[.3*k,.13*k,.05])],[torG(.08),mtx([.24*k,-.1*k,.004],[0,0,-.38],[.2*k,.085*k,.05])]])),vein,g,0,0,0,1);v.scale.x=s;v.userData.noOL=1;g.userData.s=s;return g;});},
 lanternTail:X=>{const k=(X.stage>1?1.4:1.15),G=X.L('lanternG',X.bd,'MG'),L=X.L('lantern',X.bd),c=[0,.2,.34];G.s(c,[.15*k,.17*k,.15*k],'#ffe066');for(let j=0;j<4;j++){const a=j/4*Math.PI*2+.4;G.t([[c[0]+Math.sin(a)*.152*k,c[1]+.12*k,c[2]+Math.cos(a)*.152*k],[c[0]+Math.sin(a)*.16*k,c[1]-.04*k,c[2]+Math.cos(a)*.16*k]],[.012,.01],'#ffd23a',4);}
  for(let j=0;j<4;j++){const a=j/4*Math.PI*2;L.g(leafG(),orientM([c[0]+Math.sin(a)*.07*k,c[1]+.1*k,c[2]+Math.cos(a)*.07*k],[Math.sin(a)*.8,-.6,Math.cos(a)*.8],[Math.sin(a),.5,Math.cos(a)],[.15*k,.2*k,.15*k]),j%2?X.C.b:shade(X.C.b,.85));}X.U.pulse=1;},
 headTuft:X=>{const L=X.L('head',X.H),h=X.hr,t=X.top;[[-.15,-.3],[.12,.25],[0,0]].forEach(([x,a])=>L.t([[t[0]+x*h,t[1]-h*.08,t[2]-h*.1],[t[0]+x*h*1.4,t[1]+h*.18,t[2]-h*.22],[t[0]+x*h*1.2+Math.sin(a)*h*.15,t[1]+h*.3,t[2]-h*.4]],[h*.16,h*.1,.004],mixC(X.C.a,'#ffffff',.3),8));}
});

// ===================== Sprite-Modus (Loop A2, Standard): Kreaturen mit Illustration als Billboard =====================
// window.MON_RENDER = 'sprite' (Standard) | 'model' | 'proc' – Einstieg in die Kette model → sprite → proc; fehlt eine Stufe (kein GLB, kein Bild), greift die nächste.
// Alle Billboards einer Szene teilen EIN InstancedMesh mit EINEM Bild-Atlas (2048², 16 Zellen à 512 px) → 1 Draw-Call (+1 für Glanz-Funkeln, +2 je schlafender Kreatur).
// Billboard: um die Hochachse zur Kamera gedreht, leicht zur Kamera geneigt, hinten→vorn sortiert, Kontaktschatten (blobShadow / BT.cs), Wippen ≤ 3 px,
// Lauf-Hüpfer, Treffer-Blitz, Glanz (Farbton-Drehung + Funkeln), Papierwende beim Spiegeln (ART_FACE), weiches Ein-/Ausblenden.
if(!window.MON_RENDER)window.MON_RENDER='sprite';
const ART_BAD={};
function spriteOK(id){return!!window.THREE&&typeof hasArt==='function'&&hasArt(id)&&!artFramed(id)&&!ART_BAD[id];}
// Bildlose Arten (Loop A Nachbesserung): nur in der Oberwelt das prozedurale Modell EINMAL als Porträt rendern (monThumb, auch Dex-Vorschau)
// und als Sprite in den Atlas legen → 0 statt ≈35 Draw-Calls je Kreatur. Kampf, Dex und 3D-Ansicht bleiben prozedural. window.PROC_SPRITE=false schaltet ab.
if(window.PROC_SPRITE==null)window.PROC_SPRITE=true;
const PROC_CUT={};
function procSpriteOK(id){return!!window.THREE&&window.PROC_SPRITE!==false&&window.MON_RENDER!=='proc'&&!!MONS[id]&&!(typeof hasArt==='function'&&hasArt(id))&&PROC_CUT[id]!==false;}
function procCut(id){if(PROC_CUT[id]!==undefined)return PROC_CUT[id];let T=null;try{T=monThumb(id);}catch(e){}if(!T||!T.img)return PROC_CUT[id]=false;
 const s=T.raw||T.img,w=s.width,h=s.height;let D;try{D=s.getContext('2d').getImageData(0,0,w,h).data;}catch(e){return PROC_CUT[id]=false;}
 let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(D[(y*w+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;y1=y;}
 if(x1<0)return PROC_CUT[id]=false;const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(s,x0,y0,o.width,o.height,0,0,o.width,o.height);return PROC_CUT[id]=o;}
// Freigestelltes Bild für den Atlas: Illustration, sonst prozedurales Porträt
function sprCut(id){return typeof hasArt==='function'&&hasArt(id)?artCut(id):procCut(id);}
function monRender(id){const m=window.MON_RENDER;if(m==='proc'||!window.THREE)return'proc';
 if(m==='model'&&typeof modelReady==='function'){if(modelReady(id))return'model';if(typeof hasModel==='function'&&hasModel(id))getModelOverride(id);}
 return spriteOK(id)?'sprite':'proc';}
// Kreatur für Welt/Kampf in Zielhöhe h (Weltmaß); scene = Szene der Sprite-Ebene; kind erzwingt eine Darstellungsart
function monObj(id,h,opts,scene,kind){opts=opts||{};kind=kind||monRender(id);
 if(kind==='model'&&typeof getModelOverride==='function'){const o=getModelOverride(id,{h,opts});if(o)return o;kind=spriteOK(id)?'sprite':'proc';}
 if(kind==='sprite'&&scene)return sprObj(id,h,opts,scene);
 return buildMon3D(id,h/(MONS[id].sp[4]||1),opts);}
// Entfernen: Sprites blenden aus (300 ms), alles andere sofort
function monDrop(S,o){if(!o)return;const U=o.userData;if(U&&U.sprite&&!RED&&U.vis&&U.vis.a>.05){U.dying=performance.now();(S.userData.sprDie||(S.userData.sprDie=new Set())).add(o);return;}
 S.remove(o);if(U&&U.L)U.L.items.delete(o);if(typeof BLOB!=='undefined')BLOB.delete(o);}
// ---------- Atlas ----------
const SPA={S:2048,C:512,P:6,cv:null,x:null,tex:null,cell:{}};
function sprAtlas(){if(SPA.tex)return SPA;const c=document.createElement('canvas');c.width=c.height=SPA.S;SPA.cv=c;SPA.x=c.getContext('2d');
 const t=new THREE.CanvasTexture(c);t.premultiplyAlpha=true;t.anisotropy=4;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;SPA.tex=t;return SPA;}
// UV-Rechteck einer Art (lädt/stellt frei bei Bedarf; verdrängt die am längsten unbenutzte Art, wenn der Atlas voll ist)
function sprCell(id){const A=sprAtlas(),now=performance.now();let c=A.cell[id];if(c){c.used=now;return c;}
 const cut=sprCut(id);if(!cut)return null;const n=(A.S/A.C)|0,used=new Set(Object.values(A.cell).map(q=>q.slot));let slot=-1;for(let i=0;i<n*n;i++)if(!used.has(i)){slot=i;break;}
 if(slot<0){let old=null;for(const k in A.cell){const q=A.cell[k];if(now-q.used>1200&&(!old||q.used<old.used))old=q;}if(!old)return null;slot=old.slot;delete A.cell[old.id];}
 const sx=(slot%n)*A.C,sy=((slot/n)|0)*A.C,inn=A.C-2*A.P,k=Math.min(1,inn/Math.max(cut.width,cut.height)),w=cut.width*k,h=cut.height*k,x0=sx+A.P+(inn-w)/2,y0=sy+A.P+(inn-h);
 A.x.clearRect(sx,sy,A.C,A.C);A.x.drawImage(cut,x0,y0,w,h);A.tex.needsUpdate=true;
 return A.cell[id]={id,slot,u:x0/A.S,v:1-(y0+h)/A.S,du:w/A.S,dv:h/A.S,used:now};}
// ---------- Material & Ebene ----------
const SPR_VS=`attribute vec4 iUV;attribute vec4 iP;attribute vec4 iQ;uniform float uTilt;uniform float uPush;varying vec2 vUv;varying vec4 vP;varying float vDk;varying float vY;varying float vFD;
void main(){vec3 c=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz);
 vec3 tc=cameraPosition-c;float hd=max(length(tc.xz),1e-3);vec3 f=vec3(tc.x/hd,0.,tc.z/hd),r=vec3(f.z,0.,-f.x);
 float tl=clamp(atan(tc.y,hd)*uTilt+iQ.y,-.25,.6);vec3 up=vec3(0.,cos(tl),0.)+f*sin(tl);
 vec2 p=vec2(position.x*sx*iP.x,position.y*sy);float cr=cos(iQ.x),sr=sin(iQ.x);p=vec2(p.x*cr-p.y*sr,p.x*sr+p.y*cr);
 vec3 wp=c+r*p.x+up*p.y+f*(uPush*sx);vUv=iUV.xy+uv*iUV.zw;vP=iP;vDk=iQ.z;vY=uv.y;vec4 mv=viewMatrix*vec4(wp,1.);vFD=-mv.z;gl_Position=projectionMatrix*mv;}`;
const SPR_FS=`uniform sampler2D map;uniform vec3 uTint;uniform vec3 uRim;uniform vec2 uRimO;uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;uniform vec3 uHzC;uniform vec3 uHzK;varying vec2 vUv;varying vec4 vP;varying float vDk;varying float vY;varying float vFD;
vec3 hueRot(vec3 c,float a){float Y=dot(c,vec3(.299,.587,.114)),I=dot(c,vec3(.596,-.274,-.322)),Q=dot(c,vec3(.211,-.523,.312));float m=smoothstep(.035,.09,length(vec2(I,Q)));
 float cs=cos(a*m),sn=sin(a*m);vec2 q=vec2(I*cs-Q*sn,I*sn+Q*cs);return clamp(vec3(Y+.956*q.x+.621*q.y,Y-.272*q.x-.647*q.y,Y-1.106*q.x+1.703*q.y),0.,1.);}
void main(){vec4 t=texture2D(map,vUv);float a=t.a*vP.y;if(a<.004)discard;vec3 c=t.rgb/max(t.a,.0001);
 if(vP.w!=0.)c=hueRot(c,vP.w);c*=uTint*mix(.82,1.,smoothstep(0.,.32,vY));
 float aL=texture2D(map,vUv+uRimO*vec2(sign(vP.x),1.)).a;c+=uRim*clamp(t.a-aL,0.,1.)*smoothstep(.12,.5,vY);
 c=mix(c,vec3(1.),vP.z);c*=1.-vDk;
 #ifdef USE_FOG
 c=mix(c,fogColor,smoothstep(fogNear,fogFar,vFD));
 #endif
 c=mix(c,uHzC,clamp((vFD-uHzK.x)/max(uHzK.y-uHzK.x,.001),0.,1.)*uHzK.z);
 gl_FragColor=vec4(c*a,a);}`;
function sprMat(){const A=sprAtlas();return new THREE.ShaderMaterial({uniforms:Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog),{map:{value:null},uTint:{value:new THREE.Color(1,1,1)},uRim:{value:new THREE.Color(0,0,0)},uRimO:{value:new THREE.Vector2(0,0)},uTilt:{value:.32},uPush:{value:-.1},uHzC:{value:new THREE.Color(1,1,1)},uHzK:{value:new THREE.Vector3(0,1,0)}}),
 vertexShader:SPR_VS,fragmentShader:SPR_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true,premultipliedAlpha:true,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendEquation:THREE.AddEquation});}
// Look L1: Tiefenmaterial für den Schattenpass – gleiche Billboard-Rechnung (cameraPosition = Lichtkamera), Alpha-Test am Bild-Atlas
const SPR_DFS=`#include <packing>
uniform sampler2D map;varying vec2 vUv;varying vec4 vP;void main(){if(texture2D(map,vUv).a*vP.y<.5)discard;gl_FragColor=packDepthToRGBA(gl_FragCoord.z);}`;
function sprDepthMat(sm){return new THREE.ShaderMaterial({uniforms:{map:sm.uniforms.map,uTilt:sm.uniforms.uTilt,uPush:{value:0}},vertexShader:SPR_VS,fragmentShader:SPR_DFS,side:THREE.DoubleSide});}
function sprLayer(S,cap){const U=S.userData;if(U.spr)return U.spr;cap=cap||24;const g=new THREE.PlaneGeometry(1,1,1,1);g.translate(0,.5,0);
 const at=k=>{const b=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);b.setUsage(THREE.DynamicDrawUsage);g.setAttribute(k,b);return b;};
 const mat=sprMat();mat.uniforms.map.value=sprAtlas().tex;const m=new THREE.InstancedMesh(g,mat,cap);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.count=0;m.visible=false;m.renderOrder=3;m.userData.sprLayer=1;m.castShadow=true;m.customDepthMaterial=sprDepthMat(mat);S.add(m);
 return U.spr={S,cap,mesh:m,mat,uv:at('iUV'),p:at('iP'),q:at('iQ'),items:new Set(),spark:null,tint:new THREE.Color(1,1,1)};}
function sprObj(id,h,opts,S){const o=new THREE.Group(),L=sprLayer(S);
 o.userData={sprite:1,id,h,act:{},seed:(id*1.7)%6.28+Math.random()*2,shiny:!!opts.shiny,born:performance.now(),baseH:h,sw:h,sh:h,ols:[],lod1:[],lod2:[],fx:{},vis:null,L};
 L.items.add(o);artLoad(id);sprSize(o.userData);return o;}
// Größe: Höhe = Zielhöhe × SPR_K (Illustrationen haben Luft um Schweif/Flügel, große Köpfe) – breite Bilder etwas flacher, damit lange Kreaturen nicht riesig wirken
const SPR_K=1.45;
function sprSize(U){const c=sprCut(U.id);if(c===false){if(hasArt(U.id))ART_BAD[U.id]=ART_BAD[U.id]||(!artFramed(U.id)?1:0);return false;}if(!c)return false;const a=c.width/c.height,k=(a>1?Math.pow(a,-.3):1)*SPR_K;U.sh=U.h*k;U.sw=U.sh*a;U.baseH=U.sh;U.sized=1;
 if(U.L&&!(typeof BT!=='undefined'&&BT&&U.L.S===BT.s)&&U.blob0==null)U.blob0=Math.max(.24,Math.min(1.3,U.sw*.38));return true;}
const _sv=new THREE.Vector3(),_sr=new THREE.Vector3(),_sc1=new THREE.Color(),_sc2=new THREE.Color();
// Animation je Bild: setzt U.vis (Versatz, Stauchen, Neigen, Blitz, Deckkraft, Spiegelung)
function animSprite(o,t,st){const U=o.userData;st=st||{};if(!U.sized)sprSize(U);const now=performance.now(),A=U.act,ph=t*.001,ez=k=>k<=0?0:k>=1?1:k*k*(3-2*k),still=!!st.still||RED;
 let dt=U.lt==null?0:(t-U.lt)*.001;U.lt=t;dt=Math.max(0,Math.min(.1,dt));const sm=(c,g,s)=>c+(g-c)*Math.min(1,dt*s);
 const V=U.vis||(U.vis={fk:0,a:0,fl:0,hue:0,roll:0,tilt:0,dark:0,ox:0,oy:0,oz:0,sx:1,sy:1,spark:0}),h=U.sh,pxw=st.pxw||h*.006;
 U.w=sm(U.w||0,st.moving?1:0,8);const w=U.w;U.wp=(U.wp||0)+dt*(9+3*(st.speed||1))*(.25+.75*w);
 const pose=st.pose||null;U.sl=sm(U.sl||0,pose==='sleep'?1:0,2.5);U.gz=sm(U.gz||0,pose==='graze'?1:pose==='sniff'?.55:0,5);U.hd=sm(U.hd||0,pose==='hide'?1:0,5);const sl=U.sl,gz=U.gz,hd=U.hd;
 const fe=U.exT&&now<U.exT.until?U.exT.e:(U.expr||'neutral');
 // Blickrichtung: Ziel auf dem Bildschirm (rechts/links) aus Lauf- oder Blickrichtung und Kamera-Rechtsvektor
 let sd=U.sdir||1;const cam=st.cam;if(cam){_sr.setFromMatrixColumn(cam.matrixWorld,0);let dx,dz;if(st.lookAt){dx=st.lookAt.x-o.position.x;dz=st.lookAt.z-o.position.z;}else{dx=-Math.sin(o.rotation.y);dz=-Math.cos(o.rotation.y);}
  const ln=Math.hypot(dx,dz)||1;U.fdx=dx/ln;U.fdz=dz/ln;U.rx=_sr.x;U.rz=_sr.z;
  // Bildschirm-Projektion: liegt das Ziel rechts oder links? (robust auch bei Blick in die Tiefe)
  const p=o.position;_sv.set(p.x,p.y,p.z).project(cam);const ax=_sv.x;if(st.lookAt)_sv.set(st.lookAt.x,p.y,st.lookAt.z).project(cam);else _sv.set(p.x+U.fdx*1.5,p.y,p.z+U.fdz*1.5).project(cam);const q=_sv.x-ax;if(Math.abs(q)>.004||U.sdir==null)sd=q>=0?1:-1;}
 U.sdir=sd;const f0=artFace(U.id),tg=f0?(sd===f0?1:-1):1;if(!V.fk||still)V.fk=tg;else{const d=tg-V.fk;V.fk+=Math.sign(d)*Math.min(Math.abs(d),dt*12);if(Math.abs(V.fk)<.06)V.fk=Math.sign(d)*.06;}
 // Idle: Wippen + Atmen, zusammen höchstens 3 px auf dem Bildschirm
 const bA=Math.min(.008*h,1.5*pxw),rA=Math.min(.012,1.4*pxw/Math.max(h,.01)),idle=still?0:(1-w)*(1-sl),q=ph*2.1+U.seed;
 let oy=(.5+.5*Math.sin(q))*bA*idle,sy=1+Math.sin(q+.7)*rA*idle,sx=1-Math.sin(q+.7)*rA*.35*idle,roll=Math.sin(ph*.55+U.seed)*.01*idle,tilt=0,fwd=0,side=0,fl=0,dark=0,cs=1;
 // Laufen: kleine Hüpfer, Schaukeln, Stauchen, leicht vorgelehnt
 if(w>.01&&!still){const p=U.wp,b=Math.abs(Math.sin(p));oy+=b*.065*h*w;roll+=Math.sin(p)*.05*w-.035*sd*w;sy*=1+(b-.55)*.07*w;sx*=1-(b-.55)*.035*w;}
 if(!still){if(fe==='freudig')oy+=Math.max(0,Math.sin(ph*7.5))*.03*h*(1-sl);else if(fe==='wuetend'){roll-=.05*sd;sy*=1+Math.sin(ph*14)*.006;}else if(fe==='muede'){sy*=.975;tilt-=.04;}else if(fe==='verletzt')side+=Math.sin(ph*31)*.004*h;}
 // Haltungen: grasen/schnüffeln (vorbeugen, nicken), schlafen (flach, dunkler), verstecken (ins Gras ducken)
 if(gz>.01){sy*=1-.07*gz;roll-=.07*gz*sd;if(pose==='graze')sy*=1-Math.max(0,Math.sin(ph*8))*.025*gz;else roll+=Math.sin(ph*17)*.015*gz;}
 if(sl>.01){sy*=1-.12*sl;sx*=1+.05*sl;dark+=.1*sl;}
 if(hd>.01)oy-=.3*h*hd;
 // Angriff: ausholen, vorschnellen (zum Ziel)
 const ta=A.atk?(now-A.atk)/560:9;if(ta>=0&&ta<1){const wi=ta<.3?ez(ta/.3):ta<.45?1-ez((ta-.3)/.15):0,lu=ta<.3?0:ta<.5?ez((ta-.3)/.2):1-ez((ta-.5)/.5);fwd+=-wi*.12+lu*.55;roll+=(wi*.08-lu*.1)*sd;sy*=1-wi*.07+lu*.03;sx*=1+wi*.05;oy+=lu*.05*h;}
 // Treffer: Rückstoß, Zittern, weißer Blitz
 const th=A.hit?(now-A.hit)/480:9;if(th>=0&&th<1){const r=(1-th)*(1-th);fwd-=Math.sin(Math.min(1,th*3)*Math.PI/2)*.3*(1-th);side+=Math.sin(th*40)*.035*h*(1-th);roll+=.08*r*sd;fl=Math.max(fl,r*.85);}
 // K.O.: nach hinten umkippen, dunkler
 if(A.ko){const e=ez(Math.min(1,(now-A.ko)/900));roll+=1.15*e*sd;oy-=.03*h*e;dark+=.3*e;}
 // Fang: in die Kapsel schrumpfen; Befreiung: herausploppen; Hüpfer (Freude)
 if(A.catch&&now>A.catch){const k=Math.min(1,(now-A.catch)/380),e=ez(k);cs=1-e;oy+=e*.3;fl=Math.max(fl,Math.min(1,k*3));}
 if(A.pop){const k=(now-A.pop)/450;if(k<1){cs=k<.5?ez(k/.5)*1.15:1.15-.15*ez((k-.5)/.5);fl=Math.max(fl,1-k);}else A.pop=0;}
 if(A.hop){const k=(now-A.hop)/900;if(k<1)oy+=Math.abs(Math.sin(k*Math.PI*2))*.16*h*(1-k*.4);else A.hop=0;}
 // Ein-/Ausblenden (Erscheinen mit kleinem Aufploppen, Entfernen, Sichtweite)
 const bk=still?1:ez(Math.min(1,(now-U.born)/380));let a=bk*(st.fade??1);cs*=.86+.14*bk;if(U.dying)a*=Math.max(0,1-(now-U.dying)/300);
 const F=h*(st.battle?1:.6);V.ox=(U.fdx||0)*fwd*F+(U.rx||0)*side;V.oz=(U.fdz||0)*fwd*F+(U.rz||0)*side;V.oy=oy;V.sx=sx*cs;V.sy=sy*cs;V.roll=roll;V.tilt=tilt;V.fl=fl;V.dark=Math.min(.6,dark);V.a=a;
 V.hue=U.shiny?artHue(U.id)*Math.PI/180:0;const bu=U.sparkBurst&&now-U.sparkBurst<1800?1-(now-U.sparkBurst)/1800:0;V.spark=U.shiny?1+bu:bu>0?bu:0;
 if(U.blob0!=null)U.blob=U.blob0*Math.max(.05,a*cs);
 // Schlaf-Zzz (nur während des Schlafens)
 if(sl>.6&&!still){if(!U.fx.zz){U.fx.zz=[0,1].map(()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:zTex(),transparent:true,depthWrite:false}));o.add(sp);return sp;});}
  U.fx.zz.forEach((sp,i)=>{const k=(ph*.45+i*.5)%1;sp.visible=true;sp.position.set(.2+k*.3,h*(.75+k*.6),0);sp.scale.setScalar(.18+k*.16);sp.material.opacity=Math.min(1,k*4)*(1-k)*a;});}
 else if(U.fx.zz)U.fx.zz.forEach(sp=>sp.visible=false);}
// Je Bild: Ausblendende entfernen, Szenenlicht → Farbton, Instanzen hinten→vorn schreiben
function sprTick(S,cam,now,lt){const L=S.userData.spr;if(!L)return;now=now||performance.now();
 const die=S.userData.sprDie;if(die)for(const o of die){if(now-o.userData.dying>=300){die.delete(o);S.remove(o);L.items.delete(o);if(typeof BLOB!=='undefined')BLOB.delete(o);}else animSprite(o,now,{cam});}
 const hemi=lt&&lt.hemi||(typeof R3!=='undefined'&&R3&&S===R3.scene?R3.hemi:null),sun=lt&&lt.sun||(typeof R3!=='undefined'&&R3&&S===R3.scene?R3.sun:null);
 if(hemi&&sun){const c=_sc1.copy(hemi.color).multiplyScalar(hemi.intensity*.62).add(_sc2.copy(sun.color).multiplyScalar(sun.intensity*.48)),m=Math.max(c.r,c.g,c.b);if(m>1.03)c.multiplyScalar(1.03/m);
  c.r=Math.max(c.r,.3);c.g=Math.max(c.g,.32);c.b=Math.max(c.b,.44);L.tint.lerp(c,L.t0?.12:1);L.t0=1;L.mat.uniforms.uTint.value.copy(L.tint);
  // Randlicht-Hauch: Kante auf der Lichtseite (Sonne/Mond) – Richtung im Bildschirm, Farbe aus Sonnenlicht
  if(cam&&sun.target){_sv.copy(sun.position).sub(sun.target.position).normalize().transformDirection(cam.matrixWorldInverse);const l=Math.hypot(_sv.x,_sv.y)||1,u=L.mat.uniforms;
   u.uRimO.value.set(_sv.x/l*3.2/SPA.S,_sv.y/l*3.2/SPA.S);u.uRim.value.copy(sun.color).multiplyScalar(Math.min(.55,.18+sun.intensity*.22));
   if(typeof hySprPost==='function')try{hySprPost(S,L,cam);}catch(e){}/* Hybrid H2: Tönung/Randlicht nach Bild-Licht, Dunst */}}
 sprFlush(L,cam,now);}
function sprFlush(L,cam,now){const M=L.mesh;if(!cam){M.visible=false;return;}cam.updateMatrixWorld();_sv.setFromMatrixPosition(cam.matrixWorld);const cx=_sv.x,cy=_sv.y,cz=_sv.z,arr=[];
 for(const o of L.items){if(!o.parent){L.items.delete(o);continue;}const U=o.userData,V=U.vis;if(!V||V.a<.004||!U.sized)continue;let p=o,vis=true;while(p){if(!p.visible){vis=false;break;}p=p.parent;}if(!vis)continue;
  const c=sprCell(U.id);if(!c)continue;o.updateMatrixWorld();const e=o.matrixWorld.elements,x=e[12]+V.ox,y=e[13]+V.oy,z=e[14]+V.oz;arr.push([(x-cx)**2+(y-cy)**2+(z-cz)**2,x,y,z,U,V,c]);}
 arr.sort((a,b)=>b[0]-a[0]);const m=M.instanceMatrix.array,sp=[];let n=0;
 for(const[,x,y,z,U,V,c]of arr){if(n>=L.cap)break;const i=n*16;m.fill(0,i,i+16);m[i]=U.sw*V.sx;m[i+5]=U.sh*V.sy;m[i+10]=1;m[i+12]=x;m[i+13]=y;m[i+14]=z;m[i+15]=1;
  L.uv.setXYZW(n,c.u,c.v,c.du,c.dv);L.p.setXYZW(n,V.fk,V.a,V.fl,V.hue);L.q.setXYZW(n,V.roll,V.tilt,V.dark,0);if(V.spark>0)sp.push([x,y,z,U,V]);n++;}
 M.count=n;M.visible=n>0;M.instanceMatrix.needsUpdate=true;L.uv.needsUpdate=L.p.needsUpdate=L.q.needsUpdate=true;sprSpark(L,sp,now);L.n=n;}
// Glanz-Funkeln aller Glanz-Sprites einer Szene: ein Punkte-Objekt
function sprSpark(L,list,now){let P=L.spark;if(!list.length){if(P)P.visible=false;return;}
 if(!P){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(10*12*3),3));
  P=L.spark=new THREE.Points(g,new THREE.PointsMaterial({color:'#fff3b0',size:.12,map:typeof dotTex==='function'?dotTex():null,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));P.frustumCulled=false;P.renderOrder=4;L.S.add(P);}
 const pa=P.geometry.attributes.position,ph=now*.001;let n=0,bu=0;
 for(const[x,y,z,U,V]of list){const b=Math.max(0,V.spark-1);bu=Math.max(bu,b);for(let i=0;i<10&&n<pa.count;i++){const a=ph*(.6+i*.07)+i*2.4+U.seed,r=U.sw*(.32+.2*Math.sin(ph*.9+i)+b*.6),yy=U.sh*(.12+((i*.37+ph*.18)%1)*.85);
  pa.setXYZ(n++,x+Math.cos(a)*r*(U.rx||1),y+yy*V.sy,z+Math.cos(a)*r*(U.rz||0)+Math.sin(a)*.05);}}
 pa.needsUpdate=true;P.geometry.setDrawRange(0,n);P.visible=true;P.material.size=.08+bu*.14+Math.max(0,Math.sin(ph*6))*.03;P.material.opacity=.6+.4*Math.max(bu,Math.abs(Math.sin(ph*3.1)));}
// Kleine Linien-Korrektur der bildlosen Flut-Wolf-Linie (099–101) nach Referenzstreifen: blaues Fell, weiße Brust, Gold
[99,100,101].forEach(id=>{const M=MONS[id];if(M&&M.sp&&M.sp[1]==='#ffffff'){M.sp[1]='#3f80dc';M.sp[2]='#f4f8ff';M.shinyCols=['#7a4fd0','#f4f8ff','#ffd23f'];}});
