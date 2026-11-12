// ===== VEYRA – Regionen: Leitfarbe, Akzent, Titelkarte =====
const REGION={morgenau:['Tal der Morgenau','#4cb85c','#ffd166'],route1:['Tal der Morgenau','#4cb85c','#ffd166'],kupferhain:['Kupferhügel','#c9852e','#4cb85c'],route2:['Kupferhügel','#c9852e','#4cb85c'],
 nebelgrotte:['Nebelgrotte','#7d5aa6','#9fe4f2'],brisenhafen:['Brisenküste','#3d8fe0','#ff9e8a'],route3:['Sonnenhang','#f2a640','#ffe7a0'],frostheim:['Frostheim','#79d6e8','#ffffff'],
 route4:['Nebelmarsch','#5f7a52','#c9a0e0'],schattmoor:['Schattmoor','#5a4a7a','#f2e14c'],siegesstrasse:['Siegesstraße','#e8c22e','#d94a4a']};
function regionOf(id){return REGION[id]||(G&&G.ret&&REGION[G.ret.map])||REGION.morgenau;}
let cardT=0;
function mapCard(m){const R=regionOf(m.id),app=$('#app');app.style.setProperty('--lead',R[1]);app.style.setProperty('--accent',R[2]);
 if(m.inside){toast(m.name);return;}const c=$('#mapCard');$('#mcName').textContent=m.name;$('#mcRegion').textContent=m.name===R[0]?(isNight()?'Bei Nacht':'Bei Tag'):R[0];
 c.classList.remove('on');void c.offsetWidth;c.classList.add('on');clearTimeout(cardT);cardT=setTimeout(()=>c.classList.remove('on'),2600);}

// ===== PALETTE – JS-Spiegel der Design-Tokens aus styles.css :root (Redesign Schritt 0, UI-Lead) =====
// Nutzung: Umgebung → PALETTE.env, Signatur → PALETTE.sig, Elemente → PALETTE.el[typ].{c,deep,glow,sym}, Licht → PALETTE.light[name] (setLightSet in 09),
// Bewegung → PALETTE.motion. Farben als '#rrggbb' (THREE.Color-tauglich). Bei Änderungen styles.css UND diese Tabelle pflegen.
const PALETTE=(()=>{
 const hx=n=>'#'+n.toString(16).padStart(6,'0'),num=c=>parseInt(c.slice(1),16);
 const mix=(a,b,t)=>{const A=num(a),B=num(b),f=s=>Math.round(((A>>s)&255)*(1-t)+((B>>s)&255)*t);return hx((f(16)<<16)|(f(8)<<8)|f(0));};
 const env={stone:'#d9d4cc',stoneD:'#a8a198',slate:'#7d8a99',slateD:'#4f5b69',sky:'#bcd3e3',skyD:'#8fb0c8',park:'#93ad8a',parkD:'#6b8762',roof:'#b88a7a',roofD:'#8d6558',wood:'#b59c7e',water:'#7fb3c4'};
 const sig={c:'#d81b72',c2:'#ec3a8a',hi:'#ff5ca8',ink:'#a3105a',soft:'#fde6f0',glow:'rgba(255,92,168,.55)',emissive:'#ff3d96'};
 const acc={heal:'#f0443a',healSoft:'#fde3e1',guide:'#ffc21a',guideInk:'#7a5600',neonA:'#3ff0ff',neonB:'#8a5cff'};
 // Element: c = gesättigte Hauptfarbe, deep = Schatten/Outline/Text, glow = Effekt-Licht, sym = SVG-Pfad (viewBox 0 0 16 16), form = Formsprache (Art-Direction)
 const E={kern:['Kern','#a89e8e','#6f6657','#efe6d4','M8 2.5a5.5 5.5 0 1 0 .01 0zM8 5.5a2.5 2.5 0 1 1-.01 0z','kompakt, rund-massiv'],
  glut:['Glut','#ff6526','#c2380c','#ffb45c','M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-4 0-7z','spitz, flammig'],
  flut:['Flut','#2a84f0','#1452a8','#8fd0ff','M8 1c2 3 5 6 5 9a5 5 0 0 1-10 0c0-3 3-6 5-9z','rund, tropfig'],
  flora:['Flora','#2fbf55','#17803a','#a6f08a','M2 14C2 7 7 2 14 2c0 7-5 12-12 12zM4 12L11 5','blattig'],
  volt:['Volt','#ffcf12','#b88a00','#fff27a','M9 1L3 9h4l-1 6 6-8H8l1-6z','zackig'],
  fels:['Fels','#b8793a','#7a4a1c','#f0c890','M2 13l4-8 3 3 2-4 3 9z','blockig'],
  frost:['Frost','#46d3f0','#1a8fb0','#e0fbff','M7 1h2v14H7zM1 7h14v2H1zM2.6 3.9l1.4-1.4 9.4 9.4-1.4 1.4zM12 2.5l1.4 1.4-9.4 9.4-1.4-1.4z','kristallin'],
  boe:['Böe','#8aa3ff','#4a5fc0','#e2e8ff','M2 6h8a2 2 0 1 0-2-2H6a4 4 0 1 1 4 4H2zm0 3h10a2.5 2.5 0 1 1-2.5 2.5h2A.5.5 0 1 0 12 11H2z','gestreckt, federig'],
  schatten:['Schatten','#7a46c8','#45207e','#c9a6ff','M10 2a6 6 0 1 0 4 10A5 5 0 0 1 10 2z','schlank, Leuchtaugen'],
  lumen:['Lumen','#ffe27a','#c99a12','#fffbe0','M8 1l1.8 4.6 4.8.4-3.7 3.1L12 14 8 11.3 4 14l1.1-4.9L1.4 6l4.8-.4z','strahlend']};
 const el={};for(const k in E){const[n,c,deep,glow,sym,form]=E[k];el[k]={n,c,deep,glow,sym,form,soft:mix(c,'#ffffff',.82),css:'--el-'+k};}
 // Licht-Sets: Himmel oben/unten, Sonne (Farbe, Stärke, Höhe°), Sonnen-Glow, Nebel (Farbe, nah, fern), Rim (Farbe, Stärke), Ambient (Himmel/Boden, Stärke), Belichtung
 const L=(o)=>Object.assign({skyTop:'#7fb4e6',skyBot:'#e9eef0',sun:'#fff1d6',sunI:1.15,sunEl:48,sunGlow:'#ffe2a8',fog:'#dfe7ec',fogNear:18,fogFar:70,rim:'#fff6e4',rimI:.55,amb:'#cfe0ef',ambGround:'#a9a48f',ambI:.62,exposure:1,sat:.82},o);
 const light={
  explore:L({}), // kühler Himmel + warmes Sonnenlicht, Umgebung leicht entsättigt
  dusk:L({skyTop:'#5d6fb0',skyBot:'#ffb48a',sun:'#ffb070',sunI:.9,sunEl:9,sunGlow:'#ff9a5c',fog:'#e8b9a2',fogNear:14,fogFar:55,rim:'#ffc690',rimI:.75,amb:'#b9a8c8',ambGround:'#7d6a5e',ambI:.5}),
  night:L({skyTop:'#05060c',skyBot:'#121628',sun:'#8fa8ff',sunI:.22,sunEl:35,sunGlow:'#33407a',fog:'#0b0e1a',fogNear:8,fogFar:38,rim:sig.hi,rimI:.6,amb:'#26304f',ambGround:'#0a0b12',ambI:.32,exposure:.8,sat:.7,neon:[sig.hi,acc.neonA,acc.neonB],windows:'#ffcf7a'}),
  special:L({skyTop:'#2a1a6e',skyBot:'#f4f0ff',sun:'#ffffff',sunI:1.6,sunEl:70,sunGlow:'#ffffff',fog:'#b9a8ff',fogNear:6,fogFar:40,rim:'#9fd0ff',rimI:1.1,amb:'#8a7dff',ambGround:'#2a2a6e',ambI:.8,exposure:1.25,sat:1.1,flash:'#ffffff',arcs:[acc.neonB,'#4f8bff',acc.neonA]})};
 // Kampf: warm + gesättigt, je Element getönt (Himmel/Nebel/Rim/Ambient aus Elementfarbe gemischt)
 for(const k in el){const c=el[k].c,g=el[k].glow;light['battle-'+k]=L({skyTop:mix('#ff9a5c',c,.45),skyBot:mix('#fff0d8',g,.35),sun:mix('#ffe0b0',g,.3),sunI:1.3,sunEl:30,sunGlow:mix('#ffc070',c,.4),
  fog:mix('#f6dcc4',c,.28),fogNear:12,fogFar:52,rim:g,rimI:.95,amb:mix('#f2d2b8',c,.3),ambGround:mix('#8a6a50',el[k].deep,.4),ambI:.7,exposure:1.05,sat:1.05,el:k});}
 const ui={surf0:'#eef1f5',surf1:'#ffffff',surf2:'#f3f5f8',surf3:'#e4e8ee',ink1:'#182230',ink2:'#5c6880',ink3:'#8a94a8',glass:'rgba(255,255,255,.74)',glassDark:'rgba(16,20,32,.62)',glassEdge:'rgba(255,255,255,.7)',ok:'#2fbf6a',warn:'#f0b428',bad:'#e5484d',
  radius:[8,14,20,28],shadow:['0 2px 8px -3px rgba(20,30,50,.28)','0 8px 22px -10px rgba(20,30,50,.38)','0 18px 44px -18px rgba(20,30,50,.5)']};
 const motion={press:'cubic-bezier(.34,1.56,.64,1)',sheet:'cubic-bezier(.65,0,.35,1)',out:'cubic-bezier(.2,.8,.2,1)',t:{100:100,200:200,300:300,500:500},pressScale:.95,lightBlend:600,banner:{in:500,hold:2500},hudDim:{after:4000,to:.4},hitStop:[2,4]};
 const type={display:"'Fredoka','Baloo 2','Trebuchet MS',sans-serif",ui:"'Nunito Sans',system-ui,sans-serif",size:{xs:12,sm:14,md:16,lg:20,xl:26,'2xl':34,hero:56},wDisplay:700,wUi:600,num:'tabular-nums'};
 // Kreaturen-Art-Direction als Zahlen: 2-Stufen-Cel, Outline 1,6×, Glanzfleck
 const creature={celSteps:[.42,1],shadowTint:.62,outlineScale:1.6,outlineColor:'#1d1a2a',spec:{size:.18,alpha:.85},eyeHighlights:2,maxColors:3};
 return{env,sig,acc,el,light,ui,motion,type,creature,mix,lightNames:Object.keys(light)};
})();

// ===== Look L1 (Welt-Rendering): Materialfarben + zusätzliche Licht-Sets – nur angehängt =====
// PALETTE.mat: Grundfarben der prozeduralen Weltmaterialien (Boden-Mischung 09 groundMat, Detailmuster addDetail).
// Zusätzliche Licht-Sets für setLightSet(): 'morning' (klarer Morgen), 'forest' (gedämpftes Grün), 'cave' (Höhle), 'interior' (warm drinnen).
PALETTE.mat={grass:'#7fb560',dirt:'#c7ad7e',cobble:'#bdb3a2',sand:'#dcc89c',wood:'#a5774a',plaster:'#efe6d6',roof:'#b87a5e',stone:'#a9a196',snow:'#eef4f8',rock:'#8a8075'};
(()=>{const L=PALETTE.light,b=L.explore,o=x=>Object.assign({},b,x);
 L.morning=o({skyTop:'#6fa6e0',skyBot:'#f6e2c8',sun:'#ffe2b8',sunI:1,sunEl:18,sunGlow:'#ffd8a0',fog:'#ece2d6',fogNear:16,fogFar:62,rim:'#ffe0b8',rimI:.65,amb:'#d8e2ee',ambGround:'#a8a088',ambI:.58});
 L.forest=o({skyTop:'#7aa8c8',skyBot:'#d6e6d0',sun:'#f4f0c8',sunI:.95,sunEl:52,fog:'#b8ccb0',fogNear:10,fogFar:46,rim:'#e8f4c0',rimI:.5,amb:'#bcd4b4',ambGround:'#6a7a50',ambI:.6});
 L.cave=o({skyTop:'#120d10',skyBot:'#1e1620',sun:'#b0a0d8',sunI:.2,sunEl:60,fog:'#120d10',fogNear:2,fogFar:12,rim:'#9fe4f2',rimI:.6,amb:'#8a7ab0',ambGround:'#3a2e36',ambI:.7,exposure:.95});
 L.interior=o({skyTop:'#2a2018',skyBot:'#2a2018',sun:'#fff3dc',sunI:.45,sunEl:70,fog:'#2a2018',fogNear:30,fogFar:60,rim:'#ffd9a0',rimI:.3,amb:'#fff2dc',ambGround:'#5a4030',ambI:.68});
 PALETTE.lightNames=Object.keys(L);})();

// ===== Look Nachbesserung (QA L3): Akzentfarben je Thema für die 3D-Welt (09 palOf mischt sie über PAL) und hellere Höhle =====
// whisper (Flüstertal): Boden heller, warmes Gras am Pfad (Akzent 1), Gold an Blüten (Akzent 2) – Bäume bleiben violett.
PALETTE.themeAccent={whisper:{g:'#a4a2d4',g2:'#9c9acc',p:'#e6dcc4',tg:'#a8955a',f:'#ffc93a',warm:'#d2a54a'}};
(()=>{const c=PALETTE.light.cave;Object.assign(c,{amb:'#a898cc',ambI:.9,fogNear:3.5,fogFar:18,exposure:1.05});})();
