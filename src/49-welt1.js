// ===== VEYRA – Loop C: Welt I im Hybrid-Look (Lichtlande · Smaragdwald · Flutküste · Glutlande) – siehe docs/loop-c.md =====
// Nur Darstellung (3D) + Spawn-Sicherheit. Kacheln, Kollision, 2D, Spielstand-Schlüssel bleiben unverändert.
// Bausteine: Regions-Look (Palette/Theme/Leitfarbe/Baumfarben) · Wahrzeichen + Requisiten je Ort (alles in die zusammengeführten
// Stadt-/Leucht-Meshes von 09 → keine zusätzlichen Draw-Calls je Objekt) · Übergangstore an Kartenausgängen in der Farbe der Zielregion ·
// nahtloser Himmelswechsel zwischen Regionen (Vorladen der Nachbarregion) · Blickrichtung beim Verlassen von Häusern · Spawn-Korrektur.
// Hooks: 09 build3d ruft w1TreeTint (Baumfarben) und w1CrysSkip (Höhlenkristalle); landmarks3d/palOf/th3/leadOf/warpBack/loadMap/skyAttach werden hier umhüllt.

// ---------- Regions-Look ----------
const W1R={
 lichtlande:{lead:'#e2b24a',pal:{tr:'#3d7a46',warm:'#a6c85a'},th:{fogTint:['#f6e6cc',.12]},
  trees:{p:.4,c:['#ffc2d6','#ffd6e4','#f6a9c6','#fff0f4']},gate:'#f2c24a'},
 smaragdwald:{lead:'#2e9e58',pal:{tr:'#2a7442',warm:'#b9d04c',tg:'#3c944a'},th:{tree:'forest',fogTint:['#d6e4a6',.14]},gate:'#3fbf6a'},
 flutkueste:{lead:'#22aec4',pal:{f:'#e8418f'},th:{},gate:'#2cc4d8'},
 glutlande:{lead:'#df5a2c',pal:{tr:'#b5452c',warm:'#f2932e'},th:{fogTint:['#f2a878',.2]},trees:{p:.6,c:['#d9532c','#ef8a2c','#c23e2a','#f4b040']},gate:'#ff7a3a'},
 kristallgebirge:{gate:'#a58bff'},frosttundra:{gate:'#9fe4ff'},schattenmoor:{gate:'#a77bff'},himmelsweiten:{gate:'#bfe8ff'}
};
// ---------- Orte (Weltkoordinaten: Feld (x,y) = Welt (x+.5, y+.5)) ----------
// lm: Wahrzeichen/Requisiten {type,x,y,s,r}; face: Blickrichtung beim Verlassen eines Hauses ('x,y' → Richtung); auto: automatische Requisiten
const WELT1={
 // Nachbesserung 1 (QA Loop C W-2): Wahrzeichen liegen jetzt in der Blickachse der Ankunft (Story-Richtung) und ≤ ≈ 25 Felder weit (weniger Dunst); alles außerhalb der Karte
 morgenau:{reg:'lichtlande',face:{'4,5':'right','15,5':'left','7,11':'down'},
  lm:[{type:'kristallturm',x:26.5,y:4.5,s:1.12},{type:'bluetenbaum',x:22.5,y:-.5,s:1.5},{type:'bluetenbaum',x:-3,y:9,s:1.3}]},
 route1:{reg:'lichtlande',lm:[{type:'kristallturm',x:15,y:-6,s:1.3},{type:'bluetenbaum',x:-3.5,y:12,s:1.3},{type:'bluetenbaum',x:23.5,y:6,s:1.3},{type:'windmuehle',x:5,y:28,s:1.2}]},
 route3:{reg:'lichtlande',lm:[{type:'kristallturm',x:-3,y:-7,s:1.2},{type:'windmuehle',x:21,y:-5,s:1.4},{type:'windmuehle',x:25,y:1,s:1.1},{type:'bluetenbaum',x:-3,y:3,s:1.3}]},
 siegesstrasse:{reg:'lichtlande',lm:[{type:'kristallturm',x:10,y:-9.5,s:1.35},{type:'sonnenbanner',x:5.3,y:5.95},{type:'sonnenbanner',x:14.7,y:5.95},{type:'sonnenbanner',x:9.2,y:5.95},{type:'sonnenbanner',x:11.8,y:5.95},{type:'bluetenbaum',x:-3,y:8,s:1.4},{type:'bluetenbaum',x:23,y:10,s:1.4}]},
 kupferhain:{reg:'smaragdwald',lm:[{type:'baumhaus',x:-3.2,y:8,s:1,r:.6},{type:'baumhaus',x:15.5,y:-4.5,s:1.5,r:-.4},{type:'leuchtpilze',x:18.6,y:12.4},{type:'leuchtpilze',x:1.4,y:12.5}]},
 route2:{reg:'smaragdwald',lm:[{type:'baumhaus',x:19,y:-2.5,s:1.35,r:.2},{type:'leuchtpilze',x:7.2,y:9.4},{type:'leuchtpilze',x:2.6,y:8.6}]},
 fluestertal:{reg:'smaragdwald',pal:{tr:'#2f5e55',warm:'#7c74c8',tg:'#5f8a66',g:'#a2aa9c',g2:'#9ba395',p:'#d8d0e4'},th:{fogTint:['#9a96c8',.18]},
  trees:{p:.32,c:['#6a6fb8','#7e86c8','#5d8fa0']},lm:[{type:'weltenbaum',x:26.5,y:12.5,s:1},{type:'mondstein',x:-1.6,y:6},{type:'mondstein',x:21.4,y:9},{type:'mondstein',x:21.5,y:20.5}],auto:{pilze:.32}},
 brisenhafen:{reg:'flutkueste',lm:[{type:'segelschiff',x:5,y:21,s:1.1,r:.08},{type:'boot',x:4.5,y:14.2,r:.4},{type:'boot',x:14.6,y:13.7,r:-.3}]},
 windkueste:{reg:'flutkueste',lm:[{type:'boot',x:15.5,y:24.5,r:.6},{type:'leuchtturm2',x:26,y:8.5,s:1.35}]},
 moewenbucht:{reg:'flutkueste',lm:[{type:'segelschiff',x:12.5,y:19.4,s:1.1,r:1.05},{type:'boot',x:7,y:15.2,r:.2},{type:'boot',x:15.5,y:15.6,r:-.5}]},
 glutschlucht:{reg:'glutlande',lm:[{type:'vulkan',x:35,y:3,s:.85},{type:'obsidianfeste',x:-9,y:-12,s:1},{type:'ahorn',x:-1.8,y:10,s:1.2},{type:'ahorn',x:21.6,y:4,s:1.1},{type:'ahorn',x:21.6,y:17,s:1.2},{type:'feuerschale',x:3.1,y:5.05},{type:'feuerschale',x:5.9,y:5.05}]},
 nebelgrotte:{reg:null,lm:[{type:'grottenkristall',x:5.6,y:8.7,s:1.15},{type:'grottenkristall',x:7.6,y:6.85,s:.95},{type:'grottenkristall',x:11.4,y:6.85,s:.85},{type:'grottenkristall',x:2.2,y:8.3,s:.8}],crysSkip:['10,9','12,9']}
};
const W1_BUILD='hPMAL';
function w1Of(m){const id=m&&(m.id||m);return id&&WELT1[id]||null;}
function w1Reg(m){const W=w1Of(m);return W&&W.reg?W1R[W.reg]:null;}

// ---------- Palette / Theme / Leitfarbe (nur 3D; Cache je Karte) ----------
const W1C={pal:{},th:{}};
const _palOfW1=palOf;palOf=function(m){const b=_palOfW1(m),W=w1Of(m);if(!W)return b;const k=m.id+'|'+m.theme;if(W1C.pal[k])return W1C.pal[k];const R=W.reg&&W1R[W.reg]||{};return W1C.pal[k]=Object.assign({},b,R.pal||{},W.pal||{});};
const _th3W1=th3;th3=function(m){const b=_th3W1(m),W=w1Of(m);if(!W||!m||m.inside)return b;const k=m.id+'|'+m.theme;if(W1C.th[k])return W1C.th[k];const R=W.reg&&W1R[W.reg]||{};
 // Strand-/Glut-Thema behalten ihre Bäume (Palmen/rund), Smaragdwald mischt Nadel- und Laubbäume
 const o=Object.assign({},b,R.th||{},W.th||{});if(m.theme==='beach'||m.theme==='ember'||m.theme==='whisper')o.tree=b.tree;return W1C.th[k]=o;};
const _leadOfW1=leadOf;leadOf=function(m){const R=w1Reg(m);return R&&R.lead?new THREE.Color(R.lead):_leadOfW1(m);};
// Baumkronen: Anteil p bekommt eine Blüten-/Laubfarbe der Region (Lichtlande Kirschblüte, Glutlande Ahorn, Flüstertal Silberlaub)
function w1TreeTint(m,x,z,far){const W=w1Of(m);if(!W)return null;const T=W.trees||(W.reg&&W1R[W.reg]&&W1R[W.reg].trees);if(!T)return null;
 const r=hs((x*7|0)+101,(z*11|0)+37);if(r>=T.p)return null;const c=new THREE.Color(T.c[Math.floor(hs(x*3|0,z*5|0)*T.c.length)%T.c.length]);
 return[c,c.clone().lerp(new THREE.Color('#ffffff'),.22),c.clone().multiplyScalar(.8)];}
// Höhlenkristalle: Felder ausnehmen (Nebelgrotte: Kristall lag im Eingangsblick hinter dem Chronik-Knopf → als großer Grottenkristall links sichtbar)
function w1CrysSkip(m,x,y){const W=w1Of(m);return!!(W&&W.crysSkip&&W.crysSkip.includes(x+','+y));}

// ---------- Bausteine (lokale Koordinaten, Ursprung = Fußpunkt) ----------
const W1G={};function w1g(k,f){return W1G[k]||(W1G[k]=f());}
const W1M=(x,y,z,sx,sy,sz,rx,ry,rz)=>w3M(x,y,z,sx??1,sy??sx??1,sz??sx??1,rx||0,ry||0,rz||0);
const W1LM={
 // Aurenstadt-Kristallturm (Königspalast, Wahrzeichen der Lichtlande): weißer Stein, Goldringe, blau leuchtender Kristall mit Sonnenhalo
 kristallturm(at,gl){const st='#ece6d8',st2='#d9d1c0',gold='#e6bd58',roof='#3f7fd0';
  at(w1g('kt0',()=>new THREE.CylinderGeometry(3.4,3.9,2.4,18)),st2,W1M(0,-.2,0),4);
  at(w1g('kt1',()=>new THREE.CylinderGeometry(1.55,1.8,4.4,18)),st,W1M(0,3.2,0),4);at(w1g('kt2',()=>new THREE.CylinderGeometry(1.25,1.5,3.6,18)),st,W1M(0,7.2,0),4);at(w1g('kt3',()=>new THREE.CylinderGeometry(.95,1.2,3,18)),st,W1M(0,10.5,0),4);
  for(const y of[5.4,9,12])at(w1g('ktr',()=>new THREE.TorusGeometry(1,.1,6,28)),gold,W1M(0,y,0,y<6?1.62:y<10?1.32:1.04,y<6?1.62:y<10?1.32:1.04,1,Math.PI/2,0,0));
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4,x=Math.cos(a)*2.9,z=Math.sin(a)*2.9;at(w1g('ktt',()=>new THREE.CylinderGeometry(.5,.58,4.2,12)),st,W1M(x,2.1,z),4);at(w1g('ktc',()=>new THREE.ConeGeometry(.72,1.8,12)),roof,W1M(x,5.1,z));
   gl(w1g('ktw',()=>new THREE.BoxGeometry(.22,.5,.05)),'#9fcbe8','#ffd890',W1M(Math.cos(a)*3.42,3.2,Math.sin(a)*3.42,1,1,1,0,-a+Math.PI/2,0));}
  at(w1g('ktcap',()=>new THREE.ConeGeometry(1.1,1.4,18)),roof,W1M(0,12.6,0));
  gl(w1g('ktk',()=>new THREE.OctahedronGeometry(1.15,0)),'#a6dcff','#7fe6ff',W1M(0,15.3,0,1,2.5,1));
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2;gl(w1g('kts',()=>new THREE.OctahedronGeometry(.32,0)),'#c4e8ff','#9ff0ff',W1M(Math.cos(a)*2.1,14.2+i*.5,Math.sin(a)*2.1,1,2,1));}
  gl(w1g('kth',()=>new THREE.TorusGeometry(2.3,.07,6,40)),'#ffe9a8','#ffd27a',W1M(0,15.3,0));},
 // Kirschblütenbaum (groß, Lichtlande): Stamm mit Ästen, rosa Kronen, Blütenteppich
 bluetenbaum(at){at(w1g('bbs',()=>new THREE.CylinderGeometry(.22,.38,2.4,8)),'#6b4a3e',W1M(0,1.2,0),3);
  [[.5,2.1,.1,-.7],[-.45,2.2,-.2,.75],[.05,2.3,.5,.3]].forEach(([x,y,z,r])=>at(w1g('bba',()=>new THREE.CylinderGeometry(.07,.13,1.3,6)),'#6b4a3e',W1M(x*.6,y,z*.6,1,1,1,z,0,r)));
  const C=['#ffc2d6','#ffb0cc','#ffd8e6','#f7a2c2','#ffe4ee','#ffc8dc'];[[0,3.2,0,1.35],[1.05,2.85,.3,1],[-1,2.9,-.25,1.05],[.2,2.95,1.,.95],[-.3,3.0,-1.,.95],[.15,3.95,.1,.95]].forEach(([x,y,z,r],i)=>at(canopyGeo(10,7),C[i],W1M(x,y,z,r,r*.85,r)));
  at(w1g('bbt',()=>new THREE.CircleGeometry(1.9,18).rotateX(-Math.PI/2)),'#ffd2e2',W1M(0,.025,0));},
 // Roter Ahorn (Glutlande)
 ahorn(at){at(w1g('bbs',()=>new THREE.CylinderGeometry(.22,.38,2.4,8)),'#4e3428',W1M(0,1.2,0),3);
  const C=['#d9532c','#ef8a2c','#c23e2a','#f4b040','#e0662e'];[[0,3.1,0,1.25],[.95,2.75,.2,.95],[-.9,2.8,-.3,1],[.15,2.85,.9,.9],[.1,3.8,0,.85]].forEach(([x,y,z,r],i)=>at(canopyGeo(10,7),C[i],W1M(x,y,z,r,r*.85,r)));},
 // Sonnen-Banner (Lichtlande): Mast, rotes Tuch mit goldener Sonne
 sonnenbanner(at,gl){at(w1g('sbm',()=>new THREE.CylinderGeometry(.045,.06,2.7,6)),'#6a5644',W1M(0,1.35,0),3);at(w1g('sbq',()=>new THREE.CylinderGeometry(.025,.025,.7,5)),'#6a5644',W1M(0,2.55,0,1,1,1,0,0,Math.PI/2));
  at(w1g('sbt',()=>new THREE.BoxGeometry(.62,1.05,.03)),'#d2413a',W1M(0,1.98,.04));at(w1g('sbk',()=>new THREE.BoxGeometry(.62,.08,.035)),'#e6bd58',W1M(0,1.48,.045));
  gl(w1g('sbs',()=>new THREE.CylinderGeometry(.17,.17,.03,14)),'#f4cf5a','#ffd890',W1M(0,2.08,.065,1,1,1,Math.PI/2,0,0));at(w1g('sbf',()=>new THREE.SphereGeometry(.07,8,6)),'#e6bd58',W1M(0,2.74,0));},
 // Baumhaus (Smaragdwald, Gruß aus Wurzelheim): alter Baum mit Plattform, Hütte, warmem Fenster, Strickleiter
 baumhaus(at,gl){at(w1g('bh0',()=>new THREE.CylinderGeometry(.55,.95,6.4,10)),'#6e5038',W1M(0,3.1,0),3);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.3;at(w1g('bhr',()=>new THREE.CylinderGeometry(.14,.32,1.6,6)),'#644832',W1M(Math.cos(a)*.95,.3,Math.sin(a)*.95,1,1,1,Math.sin(a)*.8,0,-Math.cos(a)*.8),3);}
  at(w1g('bhp',()=>new THREE.CylinderGeometry(1.9,1.9,.18,16)),'#b07a48',W1M(0,3.6,0),3);at(w1g('bhh',()=>new THREE.BoxGeometry(1.5,1.1,1.2)),'#c89a62',W1M(.2,4.25,.1),3);
  at(w1g('bhd',()=>new THREE.ConeGeometry(1.2,.9,4)),'#b8553a',W1M(.2,5.25,.1,1,1,1,0,Math.PI/4,0));gl(w1g('bhw',()=>new THREE.BoxGeometry(.32,.36,.04)),'#c8b088','#ffd27a',W1M(.2,4.3,.72));
  for(let i=0;i<7;i++)at(w1g('bhl',()=>new THREE.BoxGeometry(.4,.04,.06)),'#8a6a44',W1M(-1.1,.6+i*.42,1.2),3);
  const C=['#3f8f46','#4f9f4a','#6cb04c','#8cc052','#5aa64a'];[[0,7.4,0,2.3],[1.7,6.6,.4,1.6],[-1.6,6.8,-.3,1.7],[.3,6.5,1.6,1.5],[-.2,8.6,.1,1.5]].forEach(([x,y,z,r],i)=>at(canopyGeo(10,7),C[i],W1M(x,y,z,r,r*.82,r)));},
 // Leuchtpilze (Smaragdwald/Flüstertal): Kappen leuchten nachts türkis
 leuchtpilze(at,gl,q){const n=q.n||4;for(let i=0;i<n;i++){const a=i*2.4+(q.x||0),r=i?.12+i*.05:0,x=Math.cos(a)*r,z=Math.sin(a)*r,s=i?.7+.15*(i%2):1;
  at(w1g('lps',()=>new THREE.CylinderGeometry(.028,.04,.2,6)),'#efe6d2',W1M(x,.1*s,z,s));gl(w1g('lpc',()=>new THREE.SphereGeometry(.1,10,6,0,Math.PI*2,0,Math.PI/2)),'#7fb2f0','#5ff0ff',W1M(x,.19*s,z,s*1.1,s*.75,s*1.1));}},
 // Mondstein (Flüstertal): Menhir mit leuchtender Rune
 mondstein(at,gl){at(w1g('msb',()=>new THREE.BoxGeometry(.55,1.9,.4)),'#7d7a92',W1M(0,.85,0,1,1,1,.04,0,.05),4);at(w1g('msc',()=>new THREE.ConeGeometry(.33,.35,4)),'#8a87a0',W1M(0,1.95,0,1,1,1,0,Math.PI/4,0),4);
  gl(w1g('msr',()=>new THREE.BoxGeometry(.16,.5,.02)),'#a99ae6','#c9b8ff',W1M(0,1.05,.215));gl(w1g('msr2',()=>new THREE.BoxGeometry(.3,.05,.02)),'#a99ae6','#c9b8ff',W1M(0,1.2,.215));},
 // Vulkan (Glutlande): dunkler Basaltkegel, glühender Kraterrand + Kraterglut, Lavaströme, Rauchfahne (unten orange angestrahlt) – Nachbesserung 1 (W-3)
 vulkan(at,gl){at(w1g('vk',()=>new THREE.LatheGeometry([[13,-2],[12,0],[9,3.2],[6,6.8],[3.6,9.6],[3,10.1],[2.4,9.8],[2,9.3]].map(([a,b])=>new THREE.Vector2(a,b)),20)),'#3a2e2e',W1M(0,0,0),4);
  gl(w1g('vkc',()=>new THREE.CylinderGeometry(2.45,2.2,.3,18)),'#ff7a2a','#ffb24a',W1M(0,9.5,0));gl(w1g('vkr',()=>new THREE.TorusGeometry(2.75,.32,6,24)),'#ff5a1a','#ff9a3a',W1M(0,10.0,0,1,1,1,Math.PI/2,0,0));
  const rp=y=>y<3.2?12-.94*y:y<6.8?9-(y-3.2)*.833:6-(y-6.8)*.857;// Kegelradius in Höhe y (Lavaströme liegen auf der Flanke)
  [[-.62,1.5,5.6],[-.2,1.2,4.2],[.15,1.7,6.4],[.55,1.1,3.6],[1.1,1.3,4.8],[-1.15,1.2,4.4]].forEach(([o,w,L],i)=>{const a=Math.PI+o,r=rp(7.5-L*.45)+.1;gl(w1g('vkl'+i,()=>new THREE.BoxGeometry(.26*w,L*.8,.24)),i%2?'#ff7a2a':'#ff5a1a','#ffa040',W1M(Math.cos(a)*r,7.5-L*.45,Math.sin(a)*r,1,1,1,-Math.sin(a)*.66,0,Math.cos(a)*.66));});
  gl(w1g('vkp',()=>new THREE.SphereGeometry(1,10,7)),'#ff9a5a','#ffb070',W1M(.2,11.2,0,2.4,1.2,2.2));
  [[.8,13,.2,2.7,'#d6a48e'],[1.8,15,.1,3.1,'#b39a92'],[3.1,17,0,3.4,'#9c8e8c'],[4.7,18.8,-.2,3.5,'#8e8688']].forEach(([x,y,z,r,c])=>at(w1g('vks',()=>new THREE.SphereGeometry(1,10,7)),c,W1M(x,y,z,r,r*.62,r*.9)));},
 // Obsidian-Festung (Flammenkrone, Silhouette)
 obsidianfeste(at,gl){const o='#3a3036',o2='#4a3c40';at(w1g('of0',()=>new THREE.BoxGeometry(7,3.2,4)),o,W1M(0,1.2,0),4);
  [[-3.4,6.5],[3.4,6.5],[0,9]].forEach(([x,h])=>{at(w1g('oft'+h,()=>new THREE.CylinderGeometry(.85,1,h,10)),o2,W1M(x,h/2,0),4);at(w1g('ofc',()=>new THREE.ConeGeometry(1.15,2,10)),'#2e262c',W1M(x,h+1,0));at(w1g('ofb',()=>new THREE.BoxGeometry(.6,1.6,.04)),'#c8302a',W1M(x,h-1.4,1.02));});
  gl(w1g('ofr',()=>new THREE.CylinderGeometry(.75,.75,.05,16)),'#ff8a3a','#ffc060',W1M(0,6.4,.88,1,1,1,Math.PI/2,0,0));},
 // Glut-Kristalle am Wegrand (Glutlande)
 glutkristall(at,gl,q){at(rockGeo(),'#5a4644',W1M(0,.08,0,.34,.2,.3));const n=3;for(let i=0;i<n;i++){const a=i*2.1+(q.x||0)*.7,r=i?.13:0;gl(w1g('gkc',()=>new THREE.OctahedronGeometry(.13,0)),'#ff9a3a','#ffbe5a',W1M(Math.cos(a)*r,.24-i*.03,Math.sin(a)*r,1,2.4-i*.5,1,0,a,(i?.35:0)*(i%2?1:-1)));}},
 // Feuerschale (Glutlande, an Türen): Sockel, Schale, Flamme; Fackel-Licht/Halo über S.userData.torch
 feuerschale(at,gl,q,c){at(w1g('fs0',()=>new THREE.CylinderGeometry(.1,.15,.72,8)),'#6a5a50',W1M(0,.36,0),4);at(w1g('fs1',()=>new THREE.CylinderGeometry(.27,.14,.18,10)),'#3e3430',W1M(0,.8,0));
  gl(w1g('fs2',()=>new THREE.ConeGeometry(.17,.42,8)),'#ffa040','#ffd070',W1M(0,1.06,0));if(c&&c.S&&c.S.userData.torch)c.S.userData.torch.push([c.x,c.y+1.05,c.z,'#ff9a40']);},
 // Bougainvillea (Flutküste): Busch mit Magenta-Blüten
 bougainvillea(at){[[0,.28,0,.34],[.24,.22,.06,.26],[-.22,.24,-.04,.27],[.02,.5,-.02,.24]].forEach(([x,y,z,r])=>at(canopyGeo(7,5),'#3f8a46',W1M(x,y,z,r)));
  for(let i=0;i<9;i++){const a=i*2.39,h=.18+(i%3)*.15,rr=.24+(i%2)*.06;at(w1g('bvf',()=>new THREE.SphereGeometry(.075,6,4)),i%3?'#e8418f':'#f36aa8',W1M(Math.cos(a)*rr,h+.12,Math.sin(a)*rr));}},
 // Ruderboot (Flutküste)
 boot(at){at(w1g('bt0',()=>new THREE.CylinderGeometry(.42,.3,1.6,10,1,false,0,Math.PI).rotateZ(Math.PI/2).rotateX(Math.PI/2)),'#a8743e',W1M(0,.12,0,1,.5,1),3);
  at(w1g('bt1',()=>new THREE.BoxGeometry(1.5,.06,.6)),'#c89a62',W1M(0,.13,0),3);at(w1g('bt2',()=>new THREE.BoxGeometry(1.52,.07,.62)),'#f2ede2',W1M(0,.2,0));at(w1g('bt3',()=>new THREE.BoxGeometry(.08,.05,.56)),'#8a5a34',W1M(.2,.2,0));},
 // Segelschiff = Fähre (Flutküste)
 segelschiff(at,gl){at(w1g('ss0',()=>new THREE.BoxGeometry(5.2,1,1.7)),'#6a4226',W1M(0,.2,0),3);at(w1g('ss1',()=>new THREE.ConeGeometry(.85,1.6,4).rotateZ(-Math.PI/2)),'#6a4226',W1M(3.3,.3,0,1,.62,1.42,0,0,0),3);
  at(w1g('ss2',()=>new THREE.BoxGeometry(5.3,.1,1.75)),'#c08a54',W1M(0,.74,0),3);at(w1g('ss3',()=>new THREE.BoxGeometry(5.25,.18,1.74)),'#f2ede2',W1M(0,.5,0));
  for(const[x,h]of[[-1.1,4.2],[1.2,4.8]]){at(w1g('ssm'+h,()=>new THREE.CylinderGeometry(.07,.09,h,6)),'#7a5434',W1M(x,.75+h/2,0),3);
   for(const[f,w,hh]of[[.3,1.7,.26],[.62,1.25,.2]]){for(const sg of[1,-1])at(w1g('sss'+w,()=>new THREE.CylinderGeometry(1.6,1.6,1,10,1,true,-w/3.2,w/1.6)),'#f6f0e2',W1M(x-.5+(sg<0?1.11:0),.75+h*f,0,1,h*hh,.35*sg,0,Math.PI/2,0));at(w1g('ssy',()=>new THREE.BoxGeometry(.06,.06,1)),'#7a5434',W1M(x,.75+h*(f+hh/2)+.03,0,1,1,w+.2));}}
  at(w1g('ssf',()=>new THREE.BoxGeometry(.5,.28,.03)),'#22aec4',W1M(1.45,.75+4.8+.1,0));gl(w1g('ssl',()=>new THREE.SphereGeometry(.1,8,6)),'#f6e6b0','#ffd27a',W1M(-2.4,1.2,0));},
 // Leuchtturm in der Ferne (Leuchtturmklippen, von der Windküste aus)
 leuchtturm2(at,gl){at(rockGeo(),'#8a8478',W1M(0,-.4,0,3.4,1.6,3),4);for(let i=0;i<6;i++)at(w1g('lt'+i,()=>new THREE.CylinderGeometry(.82-i*.08-.08,.82-i*.08,1.2,14)),i%2?'#e8574a':'#f6f2ea',W1M(0,.6+i*1.2,0));
  at(w1g('ltc',()=>new THREE.ConeGeometry(.6,.8,12)),'#e8574a',W1M(0,8.1,0));gl(w1g('ltl',()=>new THREE.CylinderGeometry(.42,.42,.6,10)),'#e8eef0','#fff2b0',W1M(0,7.5,0));},
 // Windmühle (Sonnenhang, Gruß aus den Himmelsweiten)
 windmuehle(at){at(w1g('wm0',()=>new THREE.CylinderGeometry(.8,1.15,4.2,12)),'#f2ede2',W1M(0,2.1,0),4);at(w1g('wm1',()=>new THREE.ConeGeometry(1.05,1.5,12)),'#d2413a',W1M(0,4.95,0));
  for(let i=0;i<4;i++)at(w1g('wmb',()=>new THREE.BoxGeometry(.34,2.6,.05)),'#efe2c4',W1M(0,4.1,1.0,1,1,1,0,0,i*Math.PI/2+.4).multiply(new THREE.Matrix4().makeTranslation(0,1.3,0)));at(w1g('wmh',()=>new THREE.CylinderGeometry(.14,.14,.3,8)),'#7a5434',W1M(0,4.1,.92,1,1,1,Math.PI/2,0,0));},
 // Weltenbaum (Flüstertal/Schattenhain, uralter Hain – Nachbesserung 1 W-2): mächtiger Stamm mit Wurzeln, Kronen petrol/lavendel, Leuchtfrüchte
 weltenbaum(at,gl){at(w1g('wb0',()=>new THREE.CylinderGeometry(.75,1.35,7,10)),'#5a4a3e',W1M(0,3.3,0),3);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.2;at(w1g('wbr',()=>new THREE.CylinderGeometry(.22,.5,2.4,6)),'#544538',W1M(Math.cos(a)*1.25,.45,Math.sin(a)*1.25,1,1,1,Math.sin(a)*1.05,0,-Math.cos(a)*1.05),3);}
  [[.9,6.6,.2,-.8],[-.85,6.9,-.3,.9],[.1,7.2,.9,.4]].forEach(([x,y,z,r])=>at(w1g('wba',()=>new THREE.CylinderGeometry(.18,.32,2.6,6)),'#5a4a3e',W1M(x,y,z,1,1,1,z*.8,0,r),3));
  const C=['#2f6e6a','#3d7f78','#6a6fb8','#4f8a80','#7e86c8','#35746e'];[[0,9.2,0,3.2],[2.3,8.2,.5,2.3],[-2.3,8.4,-.4,2.4],[.4,8.1,2.2,2.2],[-.4,8.3,-2.2,2.2],[.2,10.9,.1,2.2]].forEach(([x,y,z,r],i)=>at(canopyGeo(10,7),C[i],W1M(x,y,z,r,r*.8,r)));
  for(let i=0;i<9;i++){const a=i*2.4,rr=2.2+(i%3)*.5;gl(w1g('wbf',()=>new THREE.SphereGeometry(.16,8,6)),'#c9b8ff','#e6dcff',W1M(Math.cos(a)*rr,7.4+(i%4)*.6,Math.sin(a)*rr));}},
 // Grottenkristall (Nebelgrotte): große Gruppe, gut sichtbar links vom Eingang
 grottenkristall(at,gl){at(rockGeo(),'#5a4a40',W1M(0,.15,0,.9,.45,.8));
  [[0,0,1.9,0],[.42,.1,1.3,-.35],[-.4,-.12,1.45,.38],[.12,.42,1.0,-.2],[-.18,-.4,.9,.25]].forEach(([x,z,h,r])=>gl(w1g('gkk',()=>new THREE.OctahedronGeometry(.3,0)),'#9fe4f2','#c4f6ff',W1M(x,h*.55,z,1,h*1.4,1,r,x*3,r*.7)));},
 // Übergangstor-Pfosten (an Kartenausgängen, Farbe der Zielregion): Steinpfeiler, Banner, Lichtkristall
 torpfosten(at,gl,q){const c=q.c||'#ffffff';at(w1g('tp0',()=>new THREE.BoxGeometry(.42,2.3,.42)),'#e6e0d2',W1M(0,1.1,0),4);at(w1g('tp1',()=>new THREE.BoxGeometry(.58,.2,.58)),'#d6cfbf',W1M(0,2.32,0),4);at(w1g('tp2',()=>new THREE.BoxGeometry(.6,.25,.6)),'#d6cfbf',W1M(0,.1,0),4);
  at(w1g('tp3',()=>new THREE.BoxGeometry(.34,.85,.03)),c,W1M(0,1.55,.23));gl(w1g('tp4',()=>new THREE.OctahedronGeometry(.17,0)),c,c,W1M(0,2.72,0,1,1.8,1));},
 // Seestern / Muschel (Strand, flach – darf überlaufen werden)
 seestern(at){at(w1g('st0',()=>new THREE.CylinderGeometry(.13,.13,.035,5)),'#ff8a5a',W1M(0,.02,0));},
 muschel(at){at(w1g('mu0',()=>new THREE.SphereGeometry(.09,8,5,0,Math.PI*2,0,Math.PI/2)),'#f6e2d2',W1M(0,0,0,1,.5,1.2));}
};
const W1TALL=new Set(['kristallturm','baumhaus','vulkan','obsidianfeste','leuchtturm2','windmuehle','segelschiff','bluetenbaum','ahorn','weltenbaum']);

// ---------- automatische Requisiten je Region + Übergangstore ----------
function w1Auto(m,W){const L=[],R=m.rows,T=(x,y)=>tileAt(m,x,y),walk=t=>t!==null&&(t==='.'||t===','||t==='"'||t==='F'),reg=W.reg;
 // Übergangstore: je Kartenkante mit Nachbarkarte ein Pfostenpaar außen an der Öffnung (Farbe der Zielregion)
 const links=m.links||{};for(const d of'nsew'){const to=links[d];if(!to||!MAPS[to])continue;const rg=typeof skyRegion==='function'?skyRegion(to):'lichtlande',c=(W1R[rg]&&W1R[rg].gate)||'#ffffff';
  const open=[];if(d==='n'||d==='s'){const y=d==='n'?0:m.h-1;for(let x=0;x<m.w;x++)if(!SOLID.has(R[y][x]))open.push(x);}else{const x=d==='w'?0:m.w-1;for(let y=0;y<m.h;y++)if(!SOLID.has(R[y][x]))open.push(y);}
  if(!open.length)continue;const a=Math.min(...open),b=Math.max(...open)+1;
  if(d==='n'||d==='s'){const z=d==='n'?-.55:m.h+.55,r=d==='n'?0:Math.PI;L.push({type:'torpfosten',x:a-.3,y:z,c,r},{type:'torpfosten',x:b+.3,y:z,c,r});}
  else{const x=d==='w'?-.55:m.w+.55,r=d==='w'?Math.PI/2:-Math.PI/2;L.push({type:'torpfosten',x,y:a-.3,c,r},{type:'torpfosten',x,y:b+.3,c,r});}}
 const A=W.auto||{};
 // Gebäude-Fronten: Ecken links/rechts der Frontreihe
 const fronts=[];for(let y=0;y<m.h-1;y++)for(let x=0;x<m.w;x++){const t=R[y][x];if(!W1_BUILD.includes(t)||W1_BUILD.includes(R[y+1][x])||/[0-9]/.test(R[y+1][x]))continue;const lft=!W1_BUILD.includes(T(x-1,y)||'.')&&!/[0-9]/.test(T(x-1,y)||''),rgt=!W1_BUILD.includes(T(x+1,y)||'.')&&!/[0-9]/.test(T(x+1,y)||'');
  if(lft)fronts.push([x+.2,y+.95]);if(rgt)fronts.push([x+.8,y+.95]);}
 // Türen (Ziffern), deren Seitenfelder Gebäude sind
 const doors=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(/[0-9]/.test(R[y][x])&&W1_BUILD.includes(T(x-1,y)||'')&&W1_BUILD.includes(T(x+1,y)||''))doors.push([x,y,T(x-1,y)]);
 if(reg==='smaragdwald'||A.pilze){const p=A.pilze||.16;for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){if(R[y][x]!=='T'||hs(x*13+5,y*7+3)>=p)continue;for(const[a,b]of[[0,1],[1,0],[-1,0],[0,-1]]){if(!walk(T(x+a,y+b)))continue;L.push({type:'leuchtpilze',x:x+.5+a*.36,y:y+.5+b*.36,n:2+(hs(x,y)*3|0)});break;}}}
 if(reg==='glutlande'){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=R[y][x];if(t==='R'&&hs(x*5,y*9)<.7)L.push({type:'glutkristall',x:x+.5+(hs(x,y*3)-.5)*.3,y:y+.62});
   else if(t==='X'&&walk(T(x,y+1))&&hs(x*7+1,y*3)<.22)L.push({type:'glutkristall',x:x+.5+(hs(x*3,y)-.5)*.4,y:y+.9});}}
 if(reg==='flutkueste'){fronts.forEach(([x,y],i)=>{if(hs(x*9|0,y*3|0)<.75)L.push({type:'bougainvillea',x,y:y-.05});});
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){if(R[y][x]!=='.')continue;let wet=0;for(const[a,b]of[[0,1],[1,0],[-1,0],[0,-1]])if(T(x+a,y+b)==='~')wet=1;if(!wet||hs(x*11,y*5)>.4)continue;L.push({type:hs(x,y*7)<.5?'seestern':'muschel',x:x+.3+hs(x*3,y)*.4,y:y+.3+hs(y*3,x)*.4,r:hs(x,y)*6});}}
 if(reg==='lichtlande'){doors.forEach(([x,y,b])=>{if(b!=='h')L.push({type:'sonnenbanner',x:x-.55,y:y+.96},{type:'sonnenbanner',x:x+1.55,y:y+.96});});}
 return L;}

// ---------- Wahrzeichen-Hülle ----------
const _lm3dW1=landmarks3d;
landmarks3d=function(m,th,add,glow,ty,S,lead){_lm3dW1.apply(this,arguments);try{w1Landmarks(m,th,add,glow,ty,S,lead);}catch(e){console.error('welt1',e);}};
function w1Landmarks(m,th,add,glow,ty,S,lead){const W=w1Of(m);if(!W||m.inside)return;
 const yAt=(x,z)=>x>=0&&z>=0&&x<m.w&&z<m.h?ty(x,z):Math.max(-.2,terrainOuter(m,x,z)),seen=S.userData.w1=[];
 const put=q=>{const B=W1LM[q.type];if(!B)return;const x=q.x,z=q.y,y0=(q.y0??yAt(x,z))-(W1TALL.has(q.type)?.15:0),s=q.s||1,
   R=new THREE.Matrix4().compose(new THREE.Vector3(x,y0,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,q.r||0,0)),new THREE.Vector3(s,s,s)),
   lk=W1TALL.has(q.type)&&(x<0||z<0||x>m.w||z>m.h)?10:0,
   at=(g,c,mm,k)=>add(g,c,new THREE.Matrix4().multiplyMatrices(R,mm||new THREE.Matrix4()),(k||0)+lk),gl=(g,c,c2,mm)=>glow(g,c,c2,new THREE.Matrix4().multiplyMatrices(R,mm||new THREE.Matrix4()),lk);
   B(at,gl,q,{x,y:y0,z,s,S,lead,m});seen.push(q.type);};
 for(const q of W.lm||[])put(q);for(const q of w1Auto(m,W))put(q);}

// ---------- Himmel: Regionswechsel ohne Naht ----------
// Beim Betreten einer Karte werden die Himmelsbilder der Nachbarregionen (aktuelle Tageszeit) + Kulisse vorgeladen und gehalten;
// wechselt die Region, steht das Bild sofort (kein Aufblenden über dem prozeduralen Himmel).
const W1SKY={pins:[]};
function w1SkyPre(m){if(typeof skyTexture!=='function'||!m||m.inside||typeof skyRegion!=='function')return;const own=skyRegion(m),keys=new Set();
 const tz=typeof skyTime==='function'?skyTime():'tag';for(const d of'nsew'){const to=m.links&&m.links[d];if(!to||!MAPS[to])continue;const rg=skyRegion(to);if(rg===own)continue;
  try{keys.add(skyFor(rg,tz).key);const hz=horizonFor(rg);if(hz&&hz.ok)keys.add(hz.key);}catch(e){}}
 for(const k of W1SKY.pins)if(!keys.has(k))skyTextureRelease(k);const old=new Set(W1SKY.pins);W1SKY.pins=[...keys];for(const k of keys)if(!old.has(k))skyTexture(k,true);}
if(typeof skyAttach==='function'){const _skyAttachW1=skyAttach;skyAttach=function(S,m){const prev=typeof SKY3!=='undefined'?SKY3.region:null;const r=_skyAttachW1.apply(this,arguments);
 try{if(prev&&SKY3.region!==prev&&!m.inside){const h=typeof G!=='undefined'&&G?G.time/60:12,B=skyBlend(h),E=skyTex(skyFor(SKY3.region,B.a).key),H=horizonFor(SKY3.region),EH=H&&H.ok?skyTex(H.key):null;
   if(E&&E.state==='ok'&&(!EH||EH.state==='ok')){SKY3.fade=1;SKY3.fT0=0;}}w1SkyPre(m);}catch(e){}return r;};}

// ---------- Blickrichtung beim Verlassen eines Hauses (Morgenau-Spawn u. a.) ----------
// Gesetzt nach warpBack: Tabelle je Ort, sonst Richtung mit dem freiesten Blick (Gebäude/Wände direkt vor der Kamera vermeiden)
function welt1Face(dir){if(!cur||cur.inside)return dir;const W=w1Of(cur),k=P.x+','+P.y;let d=W&&W.face&&W.face[k];
 if(!d){const score=dd=>{const v=DIRV[dd];let n=0;for(let i=1;i<=6;i++){const t=tileAt(cur,P.x+v[0]*i,P.y+v[1]*i);if(t===null||W1_BUILD.includes(t)||t==='T'||t==='X')break;n++;}return n;};
  d=dir||'down';if(score(d)<4){let best=d,bs=score(d);for(const c of['down','right','left'])if(score(c)>bs+1){best=c;bs=score(c);}d=best;}}
 P.dir=d;return d;}
const _warpBackW1=warpBack;warpBack=function(){_warpBackW1.apply(this,arguments);try{welt1Face(P.dir);}catch(e){}};

// ---------- Spawn-Korrektur beim Laden ----------
// loadMap mit fester Position (Fortsetzen, Rückkehr): liegt das Feld abgeschnitten (nicht von Ein-/Ausgängen erreichbar und ohne Weg hinaus),
// wird die Figur auf das nächste erreichbare Feld gesetzt. Regeln wie im Spiel: Wasser nur mit Schwimmen, Felskanten nur abwärts, Wände nur mit Klettern.
function w1Pass(m,x,y,fx,fy){const t=tileAt(m,x,y);if(t===null)return false;const sw=typeof canSwim==='function'&&canSwim(),cl=typeof canClimb==='function'&&canClimb()&&typeof climbArea==='function'&&climbArea();
 if(t==='~'||t==='Q')return sw;if(t==='X')return cl;if(t==='R')return fy!=null&&y>fy&&tileAt(m,x,y+1)!==null&&!SOLID.has(tileAt(m,x,y+1));return!SOLID.has(t);}
function w1Reach(m,starts){const seen=new Set(),q=[];for(const[x,y]of starts){const k=x+','+y;if(!seen.has(k)){seen.add(k);q.push([x,y]);}}
 while(q.length){const[x,y]=q.shift();for(const[a,b]of[[0,1],[1,0],[-1,0],[0,-1]]){const nx=x+a,ny=y+b,k=nx+','+ny;if(seen.has(k))continue;if(!w1Pass(m,nx,ny,x,y))continue;seen.add(k);q.push([nx,ny]);}}return seen;}
function w1Seeds(m){const S=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(/[0-9E]/.test(t)){const up=t==='E'||(m.doors&&m.doors[t]==='@out'),yy=up?y-1:y+1,u=tileAt(m,x,yy);if(u!==null&&!SOLID.has(u))S.push([x,yy]);}
  const edge=(x===0&&m.links&&m.links.w)||(x===m.w-1&&m.links&&m.links.e)||(y===0&&m.links&&m.links.n)||(y===m.h-1&&m.links&&m.links.s);if(edge&&!SOLID.has(t))S.push([x,y]);}return S;}
function w1SpawnFix(){if(!cur||!G)return false;const m=cur,seeds=w1Seeds(m);if(!seeds.length)return false;const main=w1Reach(m,seeds),k=P.x+','+P.y;if(main.has(k))return false;
 const out=w1Reach(m,[[P.x,P.y]]);for(const q of out)if(main.has(q))return false;// es gibt einen Weg hinaus (z. B. Felskante) → bleiben
 let best=null,bd=1e9;for(const q of main){const[a,b]=q.split(',').map(Number),t=tileAt(m,a,b);if(t===null||SOLID.has(t))continue;const d=Math.abs(a-P.x)+Math.abs(b-P.y);if(d<bd){bd=d;best=[a,b];}}
 if(!best)return false;const[a,b]=findWalk(best[0],best[1]);P.x=P.fx=P.px=a;P.y=P.fy=P.py=b;G.px=a;G.py=b;return true;}
// ---------- Ankunft nach Kartenwechsel (Nachbesserung 1, QA Loop C W-1) ----------
// In 3D stand die Figur nach einem Kartenrand-Wechsel genau zwischen den Torpfosten; die Verfolgerkamera dahinter zeigte Pfosten/Kristalle
// und Randbäume unten im Bild (über Rennen/Chronik/Fang/Stick). Jetzt: Ankunft 2–3 Felder weiter innen (gerade Linie, nur freie Felder).
// 2D (Kachelmodus) bleibt wie bisher am Rand. Erkannt wird der Wechsel über tryMove (Kartenrand mit Nachbarkarte).
const W1EDGE={e:null,n:0};
const _tryMoveW1=tryMove;tryMove=function(dir){try{const v=cur&&DIRV[dir];if(v){const nx=P.x+v[0],ny=P.y+v[1];if(nx<0||ny<0||nx>=cur.w||ny>=cur.h){const key={up:'n',down:'s',left:'w',right:'e'}[dir],to=(cur.links||{})[key];W1EDGE.e=to?{from:cur.id,to,key,t:performance.now()}:null;}}}catch(e){}return _tryMoveW1.apply(this,arguments);};
function w1Inward(id,x,y,key){const m=getMap(id),d={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]}[key];if(!m||!d)return null;
 const onEdge=key==='n'?y===m.h-1:key==='s'?y===0:key==='e'?x===0:x===m.w-1;if(!onEdge)return null;
 const free=(a,b)=>{const t=tileAt(m,a,b);if(t===null||SOLID.has(t)||/[0-9E]/.test(t)||t==='~'||t==='Q'||t==='R')return false;return!(NPCS[id]||[]).some(n=>n&&n.x===a&&n.y===b&&!npcHidden(n));};
 let bx=x,by=y;for(let i=1;i<=3;i++){const a=x+d[0]*i,b=y+d[1]*i;if(!free(a,b))break;bx=a;by=b;}return bx!==x||by!==y?[bx,by]:null;}
const _loadMapW1=loadMap;loadMap=function(id,x,y){
 try{const E=W1EDGE.e;if(E&&x!==undefined&&view!=='2d'&&E.to===id&&cur&&cur.id===E.from&&performance.now()-E.t<5000){W1EDGE.e=null;const q=w1Inward(id,x,y,E.key);if(q){x=q[0];y=q[1];W1EDGE.n++;}}}catch(e){}
 const r=x===undefined?_loadMapW1.call(this,id):_loadMapW1.call(this,id,x,y);try{if(x!==undefined&&w1SpawnFix())W1SKY.fixed=(W1SKY.fixed||0)+1;}catch(e){}return r;};
// ---------- Himmels-Texturen: kein verwaister GPU-Upload (Nachbesserung 1, QA Loop C P-3) ----------
// skyGC (44-sky) verwarf auch Einträge, deren Bild noch lud → onload legte danach eine Textur an, die nie mehr freigegeben wurde
// (≈ 2 × 2048² je Runde Morgenau → Route 1 → Route 3). Ladende Einträge bleiben jetzt im Cache, bis sie fertig sind, und werden danach normal freigegeben.
if(typeof skyGC==='function'){skyGC=function(keep){const nw=performance.now();for(const[k,E]of SKY3.cache){if(keep.has(E.key)||E.pin||E.state==='load')continue;if(nw-E.t<3000)continue;if(E.tex)E.tex.dispose();SKY3.cache.delete(k);}};}
// ---------- Legenden in der Oberwelt als Sprite (Nachbesserung 1, QA Loop C P-1) ----------
// Legenden mit Key-Art (gerahmtes Bild, nicht freistellbar) liefen als prozedurales 3D-Modell mit ≈ 35–40 Draw-Calls (Route 3: 40, Siegesstraße: 35).
// 09 build3d legt sie jetzt als Sprite an; hier bekommt der Atlas für gerahmte Arten das prozedurale Porträt (monThumb) statt des Rahmenbilds. Kampf/Dex unverändert.
if(typeof sprCut==='function'&&typeof procCut==='function'){const _sprCutW1=sprCut;sprCut=function(id){try{if(typeof artFramed==='function'&&artFramed(id))return procCut(id);}catch(e){}return _sprCutW1(id);};}
// Test-/Werkzeug-Helfer: Ortsliste, Anzahl Wahrzeichen
function welt1Info(id){const W=WELT1[id];return W?{reg:W.reg,lm:(W.lm||[]).map(q=>q.type)}:null;}
