// ===== VEYRA – Signatur-Mechanik: Wege der Kreaturen =====
const FIELD={
 D:{types:['glut','boe'],name:'Dornenhecke',verb:{glut:'brennt die Dornenhecke nieder',boe:'zerschneidet die Ranken mit Windklingen'},to:'.',col:'#ff8a3a'},
 G:{types:['fels'],name:'Geröll',verb:{fels:'zertrümmert das Geröll'},to:'.',col:'#c9a46a'},
 Q:{types:['frost'],name:'Offenes Wasser',verb:{frost:'friert das Wasser zu einer Eisbrücke'},to:'I',col:'#bff3ff'}};
const FIELDMAP={route1:[[18,16,'D'],[17,17,'T'],[18,18,'T']],route2:[[1,9,'T'],[2,10,'G'],[1,11,'T']],brisenhafen:[[18,13,'Q'],[18,14,'.']],
 frostheim:[[17,13,'D'],[16,14,'T'],[17,14,'.'],[18,14,'T']]};
const FSKILL={glut:'Rankenschnitt · räumt Dornen und Astwerk',boe:'Rankenschnitt · räumt Dornen und Astwerk',flora:'Rankenschnitt · räumt Dornen und Astwerk',fels:'Felsschub · räumt Geröll, schiebt Felsbrocken',kern:'Felsschub · räumt Geröll, schiebt Felsbrocken',frost:'Eisbrücke · überquert Wasser',lumen:'Leuchtfeuer · erhellt Höhlen',volt:'Leuchtfeuer · erhellt Höhlen',flut:'Wellenritt · schwimmen',schatten:'Kletterkralle · Felswände'};
NPCS.route1.push({x:18,y:17,t:'item',item:'superk',n:3,flag:'it_f1'});
NPCS.route2.push({x:1,y:10,t:'item',item:'elixier',n:2,flag:'it_f2'});
NPCS.brisenhafen.push({x:18,y:14,t:'item',item:'lichtstein',n:1,flag:'it_f3'});
NPCS.frostheim.push({x:17,y:14,t:'item',item:'donnerstein',n:1,flag:'it_f6'});
NPCS.nebelgrotte.push({x:2,y:1,t:'item',item:'ultra',n:3,flag:'it_f4',needLit:1},{x:16,y:4,t:'item',item:'froststein',n:1,flag:'it_f5',needLit:1});
SIDEQUESTS.unshift({f:'fieldmaster',title:'Wege der Kreaturen',d:'Feldattacken öffnen neue Wege: Rankenschnitt räumt Dornen und Astwerk, Felsschub zertrümmert Geröll und schiebt Felsbrocken, Eisbrücke friert Wasser, Leuchtfeuer erhellt Höhlen. Kreaturen lernen sie mit der Zeit oder mit einer Rolle. Stell dich vor ein Hindernis und drück A. Setze drei Feldattacken ein.'});
let FXT=null;
// Feld-Typ → Feldattacke (Agent Bewegung): Höhlenlicht usw. hängt an der gelernten Attacke, nicht mehr am Typ
function hasField(type){const id=FIELD_TYPE_MOVE[type];if(id)return fieldMon(id);return G&&G.team.find(m=>m.hp>0&&MONS[m.s].t.includes(type));}
function fieldOf(s){const L=Object.keys(FIELD_MOVES).filter(id=>fieldLearnable(s,id)).map(id=>FIELD_MOVES[id].n+' (ab Lv '+FIELD_MOVES[id].lv+')');return L.length?' · Feldattacken: '+L.join(', '):'';}
function applyField(m){const set=(x,y,c)=>{if(m.rows[y])m.rows[y]=m.rows[y].slice(0,x)+c+m.rows[y].slice(x+1);};
 (FIELDMAP[m.id]||[]).forEach(([x,y,c])=>set(x,y,c));if(G&&G.mods)(G.mods[m.id]||[]).forEach(([x,y,c])=>set(x,y,c));}
function applyMod(id,x,y,c){(G.mods[id]=G.mods[id]||[]).push([x,y,c]);const m=getMap(id);m.rows[y]=m.rows[y].slice(0,x)+c+m.rows[y].slice(x+1);
 delete scenes[id];if(R3)R3.mapId=null;mmFor=null;}
function fieldUse(x,y,t){const F=FIELD[t],id=F.move,FM=FIELD_MOVES[id],m=fieldMon(id);
 if(!m)return say(fieldNeedText(id,F.name));
 if(F.push){const[dx,dy]=DIRV[P.dir],nx=x+dx,ny=y+dy,nt=tileAt(cur,nx,ny);
  if(nt===null||SOLID.has(nt)||/[0-9E]/.test(nt)||blocked(nx,ny)||(NPCS[cur.id]||[]).some(n=>n.x===nx&&n.y===ny)||(typeof roamAt==='function'&&roamAt(nx,ny))||(P.x===nx&&P.y===ny))return say(F.name+'. Dahinter ist kein Platz – von einer anderen Seite schieben!');
  return ask(F.name+'. '+mname(m)+' kann '+FM.n+'. Schieben?',['Ja','Nein'],i=>{if(i)return;applyMod(cur.id,x,y,cur.theme==='cave'?'c':'.');applyMod(cur.id,nx,ny,t);fieldDone(m,x,y,F,mname(m)+' schiebt den Felsbrocken mit '+FM.n+' weg!');});}
 ask(F.name+'. '+mname(m)+' kann '+FM.n+'. Einsetzen?',['Ja','Nein'],i=>{if(i)return;applyMod(cur.id,x,y,F.to);fieldDone(m,x,y,F,mname(m)+' setzt '+FM.n+' ein'+(F.verb?' und '+F.verb:'')+'!');});}
function fieldDone(m,x,y,F,txt){FXT={x,y,t:performance.now(),col:F.col};
 const fl=$('#fxFlash');if(fl){fl.style.setProperty('--fc',F.col);fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go');}sfx('lvl');vib([30,30,60]);
 G.flags.field=(G.flags.field||0)+1;const L=[txt];
 if(G.flags.field>=3&&!G.flags.fieldmaster){G.flags.fieldmaster=1;addItem('ultra',3);L.push('Mission erfüllt: Wege der Kreaturen. Du erhältst 3× Sternkapsel.');}say(L);}
function fieldFx2D(c){if(!FXT)return;const k=(performance.now()-FXT.t)/750;if(k>1){FXT=null;return;}
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2+i,d=2+k*14;c.globalAlpha=1-k;circ(c,FXT.x*TS+8+Math.cos(a)*d,FXT.y*TS+8+Math.sin(a)*d-k*6,1.6*(1-k)+.4,FXT.col);}c.globalAlpha=1;}
function fieldDecor(S,m){const p=PAL[m.theme],D=[],Gr=[],I=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(t==='D')D.push([x,y]);else if(t==='G')Gr.push([x,y]);else if(t==='I')I.push([x,y]);}
 D.forEach(([x,y])=>{const g=new THREE.Group();g.position.set(x+.5,0,y+.5);const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.46,1),mat('#2b4f25'));b.position.y=.42;b.scale.set(1,.9,1);b.castShadow=true;g.add(b);
  for(let i=0;i<12;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(.04,.22,5),mat('#8a5a32'));const a=i/12*Math.PI*2;s.position.set(Math.cos(a)*.42,.3+(i%3)*.15,Math.sin(a)*.42);s.lookAt(Math.cos(a)*2,.6,Math.sin(a)*2);s.rotateX(Math.PI/2);g.add(s);}S.add(g);});
 Gr.forEach(([x,y])=>{for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.18+hs(x+i,y)*.16,0),mat(shade(p.r,.9+hs(i,x)*.3)));r.position.set(x+.2+hs(x,y+i)*.6,.15+(i>2?.22:0),y+.2+hs(y,x+i)*.6);r.rotation.set(i,i*2,0);r.castShadow=true;S.add(r);}});
 I.forEach(([x,y])=>{const s=new THREE.Mesh(new THREE.BoxGeometry(1,.1,1),new THREE.MeshStandardMaterial({color:'#d6f3ff',roughness:.08,transparent:true,opacity:.85}));s.position.set(x+.5,.05,y+.5);s.receiveShadow=true;S.add(s);});}

// ===== Feldattacken (Agent „Bewegung“, docs/bewegung.md) =====
// Eine Team-Kreatur muss die Attacke BEHERRSCHEN: gelernt per Rolle (47-finds.js: m.moves/m.known enthält die ID) oder von selbst ab Lernstufe,
// wenn die Art einen Lern-Typ hat (wird dann in m.known eingetragen, Hinweis in 17-move.js). badge = zusätzliche Orden-Erlaubnis.
const FIELD_MOVES={
 rankenschnitt:{n:'Rankenschnitt',types:['flora','boe','glut'],lv:5,use:'Räumt Dornenhecken und umgestürztes Astwerk weg.'},
 felsschub:{n:'Felsschub',types:['fels','kern'],lv:10,use:'Zertrümmert Geröll und schiebt Felsbrocken zur Seite.'},
 eisbruecke:{n:'Eisbrücke',types:['frost'],lv:12,use:'Friert offenes Wasser zu einer Brücke.'},
 leuchtfeuer:{n:'Leuchtfeuer',types:['lumen','glut','volt'],lv:6,use:'Macht dunkle Höhlen hell.'},
 wellenritt:{n:'Wellenritt',types:['flut'],lv:14,badge:2,medal:'Flutmedaille',use:'Trägt dich über das Wasser.'},
 sturmfluegel:{n:'Sturmflügel',types:['boe'],lv:14,badge:3,medal:'Frostmedaille',use:'Trägt dich im Gleitflug über Kanten.'},
 kletterkralle:{n:'Kletterkralle',types:['fels','schatten'],lv:18,badge:4,medal:'Schattenmedaille',use:'Hilft beim Klettern an Felswänden.'}};
for(const k in FIELD_MOVES)FIELD_MOVES[k].item='rolle_'+k;
const FIELD_TYPE_MOVE={lumen:'leuchtfeuer'};
function fieldLearnable(s,id){const F=FIELD_MOVES[id],M=MONS[s];return!!(F&&M&&M.t&&M.t.some(t=>F.types.includes(t)));}
function fieldKnows(m,id){if(!m||!FIELD_MOVES[id])return false;if((m.moves||[]).some(x=>x&&x.id===id)||(m.known||[]).includes(id))return true;return fieldLearnable(m.s,id)&&(m.l||1)>=FIELD_MOVES[id].lv;}
function fieldTeach(m,id){if(!m||!fieldLearnable(m.s,id))return false;m.known=m.known||[];if(!m.known.includes(id))m.known.push(id);return true;}
function fieldMon(id){return G&&G.team?G.team.find(m=>m.hp>0&&fieldKnows(m,id))||null:null;}
// Wer lernt es? Beispiel-Arten der Karte bzw. der frühen Routen für den Kind-Hinweis
function fieldWho(id){const F=FIELD_MOVES[id],seen=new Set(),out=[];for(const mid of['route1','route2','route3','windkueste',cur&&cur.id]){const E=mid&&MAPS[mid]&&MAPS[mid].enc;if(!E)continue;
 for(const e of E.day.concat(E.night)){if(seen.has(e[0])||!fieldLearnable(e[0],id))continue;seen.add(e[0]);out.push(MONS[e[0]].n);if(out.length>=2)return out;}}return out;}
function fieldNeedText(id,what){const F=FIELD_MOVES[id],ty=F.types.map(k=>TYPES[k]?TYPES[k].n:k).join(', '),who=fieldWho(id);
 return[(what?what+'. ':'')+'Hier bräuchte ich '+F.n+'.','Das lernen Kreaturen vom Typ '+ty+' ab Level '+F.lv+(who.length?'. Zum Beispiel '+who.join(' oder ')+'.':'.')+' Oder mit einer Rolle „'+F.n+'“.'];}
// Hindernisse: Dornenhecke D, Astwerk/Baumstamm Y (Rankenschnitt) · Geröll G, Felsbrocken U (Felsschub, schieben) · Offenes Wasser Q (Eisbrücke)
FIELD.D.move='rankenschnitt';FIELD.D.verb='schneidet die Dornen weg';FIELD.G.move='felsschub';FIELD.G.verb='zertrümmert das Geröll';FIELD.Q.move='eisbruecke';FIELD.Q.verb='friert das Wasser zu Eis';
FIELD.Y={types:['flora','boe','glut'],move:'rankenschnitt',name:'Umgestürzter Baumstamm',verb:'zerteilt das Astwerk',to:'.',col:'#a8d86a'};
FIELD.U={types:['fels','kern'],move:'felsschub',name:'Felsbrocken',push:true,to:'.',col:'#d8b47a'};
SOLID.add('Y');SOLID.add('U');
// Neue Sperren: nur Abzweige mit Funden (Schnittmenge per Min-Schnitt geprüft, test/unit_fieldmoves.mjs prüft, dass Ausgänge/Türen/Figuren erreichbar bleiben)
{const add=(id,L)=>{(FIELDMAP[id]=FIELDMAP[id]||[]).push(...L);};
 add('route1',[[17,1,'Y'],[18,2,'T']]);add('kupferhain',[[2,1,'Y'],[1,2,'T']]);add('route2',[[16,3,'U'],[17,2,'T'],[17,4,'T']]);
 add('route3',[[4,15,'G'],[2,15,'T']]);add('frostheim',[[2,1,'G'],[1,2,'T']]);add('route4',[[17,10,'Y'],[18,9,'T'],[18,11,'T']]);
 add('schattmoor',[[2,1,'G'],[1,2,'T']]);add('windkueste',[[17,13,'Y']]);add('siegesstrasse',[[17,15,'G'],[18,14,'T']]);}
// Felsbrocken U (route2 16,3): von oben (16,2) nach unten schieben öffnet den Zugang zum Fund
// 2D: Baumstamm/Felsbrocken über den Boden zeichnen (08-gfx kennt die neuen Zeichen nicht)
const _fieldFx2Dmv=fieldFx2D;fieldFx2D=function(c){try{if(cur&&cur.rows)for(let y=0;y<cur.h;y++){const r=cur.rows[y];if(r.indexOf('Y')<0&&r.indexOf('U')<0)continue;for(let x=0;x<cur.w;x++){const t=r[x];if(t!=='Y'&&t!=='U')continue;const X=x*TS,Y_=y*TS;
 if(t==='Y'){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(X+8,Y_+13,7.5,2.4,0,0,7);c.fill();c.fillStyle='#7a5232';c.fillRect(X+1,Y_+7,14,5);c.fillStyle='#9a6c44';c.fillRect(X+1,Y_+7,14,1.6);c.fillStyle='#c9a06a';c.beginPath();c.ellipse(X+14.5,Y_+9.5,1.6,2.6,0,0,7);c.fill();
  c.strokeStyle='#5f8f3a';c.lineWidth=1.3;c.beginPath();c.moveTo(X+4,Y_+7);c.lineTo(X+2,Y_+2);c.moveTo(X+9,Y_+7);c.lineTo(X+11,Y_+1.5);c.stroke();c.fillStyle='#6fae48';circ(c,X+2,Y_+2,2,'#6fae48');circ(c,X+11,Y_+2,2.3,'#7fbe52');}
 else{c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(X+8,Y_+13.5,7,2.3,0,0,7);c.fill();circ(c,X+8,Y_+8,6.4,'#8d8478');circ(c,X+6.5,Y_+6.5,4,'#a59c90');circ(c,X+5.5,Y_+5.5,1.6,'#c4bcb0');}}}}catch(e){}_fieldFx2Dmv(c);};
// 3D: Baumstamm (Zylinder + Aststümpfe + Blattbüschel), Felsbrocken (verbeulte Kugel) – werden von mergeDecor zu wenigen Meshes verschmolzen
const _fieldDecorMv=fieldDecor;fieldDecor=function(S,m){_fieldDecorMv(S,m);const p=PAL[m.theme]||PAL.default;
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(t!=='Y'&&t!=='U')continue;const g=new THREE.Group();g.position.set(x+.5,0,y+.5);
  if(t==='Y'){const lg=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,1.05,10),mat('#7a5232'));lg.rotation.z=Math.PI/2;lg.rotation.y=hs(x,y)*.6-.3;lg.position.y=.22;lg.castShadow=true;g.add(lg);
   const cap=new THREE.Mesh(new THREE.CircleGeometry(.2,10),mat('#d8b07a'));cap.position.set(.53,.22,0);cap.rotation.y=Math.PI/2;g.add(cap);
   for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.42,5),mat('#6a4628'));b.position.set(-.3+i*.3,.48,(i%2?.08:-.08));b.rotation.z=(i-1)*.5;b.castShadow=true;g.add(b);
    const lf=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,0),mat(i%2?'#6fae48':'#5f9a3c'));lf.position.set(-.3+i*.3+(i-1)*.12,.68,(i%2?.08:-.08));lf.castShadow=true;g.add(lf);}}
  else{const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.42,1),mat(shade(p.r||'#8d8478',1.05)));r.scale.set(1,.85,1);r.position.y=.36;r.rotation.set(hs(x,y)*3,hs(y,x)*3,0);r.castShadow=true;g.add(r);
   const s2=new THREE.Mesh(new THREE.DodecahedronGeometry(.16,0),mat(shade(p.r||'#8d8478',.9)));s2.position.set(.36,.12,.2);g.add(s2);}
  S.add(g);}};
