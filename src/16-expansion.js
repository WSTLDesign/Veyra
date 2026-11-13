// ===== VEYRA – Erweiterung: neue Kreaturen, Zielführung, Stimmen =====
// --- Arten: seit dem Dex-Kanon (Agent A1) vollständig in 01-data.js (MONS 001–153). Hier nur noch die Begegnungs-Ergänzungen (Kanon-IDs). ---
MAPS.route1.enc.day.push([25,2,5]);MAPS.route1.enc.night.push([25,2,5]);
MAPS.route2.enc.day.push([22,6,9],[25,6,9]);MAPS.route2.enc.night.push([22,6,9]);MAPS.nebelgrotte.enc.day.push([22,9,12]);MAPS.nebelgrotte.enc.night.push([22,9,12]);
MAPS.route3.enc.day.push([115,15,19],[34,16,19]);MAPS.route3.enc.night.push([34,16,19]);
MAPS.frostheim.enc.day.push([11,22,25]);MAPS.frostheim.enc.night.push([11,22,25]);
MAPS.route4.enc.night.push([117,27,30]);MAPS.route4.enc.day.push([115,26,29]);
MAPS.schattmoor.enc.day.push([53,30,33]);MAPS.schattmoor.enc.night.push([117,31,34]);
MAPS.siegesstrasse.enc.day.push([122,37,40],[23,36,40]);MAPS.siegesstrasse.enc.night.push([117,37,40],[11,36,40]);
NPCS.arena2[0].team.push([53,21]);NPCS.arena3[0].team.push([11,28]);NPCS.liga[2].team.push([122,44]);
const NMON=MONS.length-1;

// --- Zielführung: Wohin als Nächstes? ---
const QTARGET={q1:{map:'morgenau',x:7,y:10,l:'Labor',in:{labor:[3,4,'Kapseln auf dem Tisch']}},q2:{map:'route1',x:9,y:6,l:'Hohes Gras auf Route 1'},q3:{map:'kupferhain',x:8,y:3,l:'Arena Kupferhain'},
 q4:{map:'route2',x:10,y:2,l:'Nebelgrotte',in:{nebelgrotte:[8,8,'Dämmerorden-Rekrut']}},q5:{map:'brisenhafen',x:5,y:9,l:'Arena Brisenhafen'},q6:{map:'frostheim',x:4,y:4,l:'Arena Frostheim'},
 q7:{map:'route4',x:8,y:6,l:'Ordensmeister Vargo'},q8:{map:'schattmoor',x:4,y:10,l:'Arena Schattmoor'},q9:{map:'siegesstrasse',x:10,y:5,l:'Liga von Veyra',in:{liga:null}}};
function questTarget(){const q=QUESTS.find(q=>!G.flags[q.f]);if(!q){const s=sideNow();if(!s)return null;const T=QTARGET[s.f];return typeof T==='function'?T():T||null;}const T=QTARGET[q.id];if(!T)return null;
 if(T.in&&cur.id in T.in){const v=T.in[cur.id];if(v)return{map:cur.id,x:v[0],y:v[1],l:v[2]};const n=npcs().find(n=>n.t==='trainer'&&!G.flags[n.flag]);return n?{map:cur.id,x:n.x,y:n.y,l:n.name}:null;}
 return T;}
function mapLinks(id){const L=[];const m=MAPS[id];if(m){for(const d of 'nsew')if(m[d])L.push({to:m[d],via:d});for(const k in m.doors||{})if(m.doors[k]!=='@out')L.push({to:m.doors[k],via:'door',k});if(Object.values(m.doors||{}).includes('@out')){const parent=Object.keys(MAPS).find(p=>Object.values(MAPS[p].doors||{}).includes(id));if(parent)L.push({to:parent,via:'exit'});}}
 else{const parent=Object.keys(MAPS).find(p=>Object.values(MAPS[p].doors||{}).includes(id));if(parent)L.push({to:parent,via:'exit'});}return L;}
function routeHop(from,to){if(from===to)return null;const prev={[from]:null},q=[from];while(q.length){const c=q.shift();for(const l of mapLinks(c)){if(l.to in prev)continue;prev[l.to]={from:c,link:l};q.push(l.to);if(l.to===to){let n=to;while(prev[n].from!==from)n=prev[n].from;return prev[n].link;}}}return null;}
function guidePoint(){const T=questTarget();if(!T)return null;if(T.map===cur.id)return{x:T.x,y:T.y,l:T.l,here:1};const h=routeHop(cur.id,T.map);if(!h)return null;
 if(h.via==='exit'){const[x,y]=exitSpot(cur);return{x,y:y+1,l:'Zum Ausgang · '+T.l};}
 if(h.via==='door'){for(let y=0;y<cur.h;y++){const x=cur.rows[y].indexOf(h.k);if(x>=0)return{x,y,l:(getMap(h.to).name)+' · '+T.l};}}
 const e={n:[P.x,-1],s:[P.x,cur.h],w:[-1,P.y],e:[cur.w,P.y]}[h.via];return{x:e[0],y:e[1],l:{n:'Nach Norden',s:'Nach Süden',w:'Nach Westen',e:'Nach Osten'}[h.via]+' · '+T.l};}
let GP=null,gpT=0;
function guideTick(){if(!G||!cur)return;const t=performance.now();if(t-gpT>400){gpT=t;GP=guidePoint();}
 const q=QUESTS.find(q=>!G.flags[q.f])||sideNow();$('#hq').textContent=q?(GP?q.title+'  ›  '+GP.l:q.title):crownTitle()+' von Veyra';}
function guideAngle(){if(!GP)return null;const dx=GP.x-P.px,dy=GP.y-P.py;if(Math.abs(dx)+Math.abs(dy)<1.2&&GP.here)return null;return Math.atan2(dx,-dy);}
function drawGuide2D(c){if(!GP||!GP.here)return;const t=anim,bob=Math.sin(t/260)*1.5,x=GP.x*TS+8,y=GP.y*TS-6+bob;
 c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(GP.x*TS+8,GP.y*TS+4,4,1.6,0,0,7);c.fill();
 c.fillStyle='#ff7a3d';c.beginPath();c.moveTo(x,y+6);c.lineTo(x-5,y-2);c.lineTo(x+5,y-2);c.closePath();c.fill();c.beginPath();c.arc(x,y-4,5,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x,y-4,2,0,7);c.fill();}
function guide3d(S,t){let g=S.userData.guide;if(!g){g=new THREE.Group();const beam=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,5,16,1,true),new THREE.MeshBasicMaterial({color:'#ff9a4a',transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}));beam.position.y=2.5;g.add(beam);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.5,32),new THREE.MeshBasicMaterial({color:'#ff7a3d',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;g.add(ring);g.userData.ring=ring;S.add(g);S.userData.guide=g;}
 g.visible=!!(GP&&GP.here);if(!g.visible)return;g.position.set(GP.x+.5,0,GP.y+.5);const k=1+Math.sin(t/300)*.12;g.userData.ring.scale.set(k,k,1);g.children[0].material.opacity=.2+Math.sin(t/400)*.08;}

// --- Stimmen: Sprechblips & Intro-Klang ---
let blipN=0;
function blip(pitch){if(!SET.sfx||!SET.vol||!SET.blip)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state!=='running')return;}catch(e){return;}
 const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.setValueAtTime(pitch*(1+(Math.random()-.5)*.08),t);o.connect(g);g.connect(master());
 g.gain.setValueAtTime(.07*SET.vol/100,t);g.gain.exponentialRampToValueAtTime(.0001,t+.055);o.start(t);o.stop(t+.06);}
function voiceOf(name){if(!name)return 300;let h=0;for(const ch of name)h=(h*31+ch.charCodeAt(0))|0;return 220+(Math.abs(h)%7)*34;}
function sweep(f0,f1,dur,type,vol){try{const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(600,t);f.frequency.exponentialRampToValueAtTime(4000,t+dur);
 o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);o.connect(f);f.connect(g);g.connect(master());g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol*SET.vol/100,t+dur*.8);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.3);o.start(t);o.stop(t+dur+.4);}catch(e){}}
function boom(){try{const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(28,t+1.4);o.connect(g);g.connect(master());
 g.gain.setValueAtTime(.5*SET.vol/100,t);g.gain.exponentialRampToValueAtTime(.0001,t+1.6);o.start(t);o.stop(t+1.7);
 const n=AC.createBufferSource(),buf=AC.createBuffer(1,AC.sampleRate*1.2,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.2);n.buffer=buf;
 const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;const g2=AC.createGain();g2.gain.value=.35*SET.vol/100;n.connect(f);f.connect(g2);g2.connect(master());n.start(t);}catch(e){}}
SONGS.intro={bpm:50,ch:[[45,48,52],[41,45,48],[43,47,50],[40,43,47]]};
SET.blip=SET.blip??1;

// --- Design-Pass: ersetzt durch den Kreaturen-Neuentwurf (sp-Werte je Art, Konzepte in 10-mon3d.js DESIGN) ---

// ===== Welterweiterung: Windküste, Möwenbucht, Glutschlucht, Flüstertal =====
// --- Verknüpfungen & Sperren ---
MAPS.brisenhafen.e='windkueste';MAPS.brisenhafen.gate.e={f:'badge2',m:'Ein Seemann: „Der Windküsten-Pfad ist tückisch. Nur Reisende mit der Flutmedaille dürfen dort entlang.“'};
MAPS.route3.e='glutschlucht';MAPS.route3.gate={e:{f:'badge3',m:'Heiße Luft weht aus der Schlucht im Osten. Ohne drei Medaillen ist das viel zu gefährlich.'}};
MAPS.schattmoor.e='fluestertal';MAPS.schattmoor.gate.e={f:'badge4',m:'Ein Moorwächter: „Das Flüstertal ist nichts für Anfänger. Komm mit vier Medaillen wieder, und am besten nachts mit offenen Augen.“'};
// Westkante: getMap() überschreibt m.w (Westlink) mit der Kartenbreite. Dieser Wrapper liest den Link aus MAPS.
const _tryMove=tryMove;
tryMove=function(dir){if(dir==='left'&&P.x-1<0){P.dir=dir;const src=MAPS[cur.id],to=src&&src.w;if(!to)return;
  const g=src.gate&&src.gate.w;if(g&&!G.flags[g.f]){held=null;say(g.m);return;}
  const t=getMap(to);transit(()=>loadMap(to,t.w-1,Math.min(P.y,t.h-1)),to);return;}
 return _tryMove(dir);};
// Feldhindernisse der Glutschlucht – Loop C: sie sperren nur noch den Schatzweg, keine Figuren (Ruska, Hagen, Ilka frei erreichbar).
// Kette zum Schatz (2,18): Dornen am Durchgang (14,14) → Wasser (9,18) → Geröll vor der Schatz-Nische (3,18, Ahorn-Bäume ringsum; Felskante (1,19) erlaubt nur den Sprung hinaus).
// Alte Spielstände: G.mods behalten freigeräumte Felder; (9,7) ist jetzt ohnehin frei. Wer in der neuen Nische stand, wird beim Laden umgesetzt (49-welt1.js).
FIELDMAP.glutschlucht=[[14,14,'D'],[9,18,'Q'],[3,18,'G'],[1,17,'T'],[2,17,'T'],[2,19,'T']];
// Regionen, Paletten, Dorfbewohner
REGION.windkueste=['Windküste','#3aa6c8','#ffffff'];REGION.moewenbucht=['Windküste','#3aa6c8','#ff9e8a'];
REGION.glutschlucht=['Glutschlucht','#d9582b','#ffc24a'];REGION.fluestertal=['Flüstertal','#7a7ad0','#f5d983'];
PAL.ember={g:'#c9a074',g2:'#c19a6e',p:'#a8794e',tg:'#9a6a3e',tr:'#7a4632',tr2:'#4a2a1f',w:'#3b8fd4',w2:'#6ab0ea',r:'#8a6a58',f:'#ffb04a'};
PAL.whisper={g:'#8a86c0',g2:'#837fb8',p:'#d4cdea',tg:'#5a5fa8',tr:'#2f3a72',tr2:'#232b58',w:'#3a5fb0',w2:'#8ab0f0',r:'#9894b8',f:'#f5d983'};
TOWNS.moewenbucht=3;

// --- Nebenmissionen (Flags: sq_<id>_on = angenommen, sq_<id> = erledigt) ---
const NP=(map,x,y,l)=>({map,x,y,l});
const SQ=[
 {f:'sq_woelkchen',title:'Das verlorene Wölkchen',d:'Mika aus Möwenbucht vermisst ihr Wölki. Es versteckt sich im Gras des Windküsten-Pfads. Ab Flutmedaille.',req:{badges:2,text:'Ab Flutmedaille'},
  t:()=>G.flags.sq_woelkchen_on&&!G.flags.sq_woelkchen_found?NP('windkueste',15,2,'Verirrtes Wölkchen'):NP('moewenbucht',6,10,'Mika')},
 {f:'sq_post',title:'Post für den Hafen',d:'Fischer Henrik auf der Mole von Möwenbucht hat einen Brief für den Hafenmeister von Brisenhafen.',
  t:()=>G.flags.sq_post_on?NP('brisenhafen',13,12,'Hafenmeister'):NP('moewenbucht',10,15,'Fischer Henrik')},
 {f:'sq_foto',title:'Fotosafari',d:'Fotografin Lene auf dem Windküsten-Pfad will je ein gefangenes Flora-, Flut- und Böe-Wesen in deinem Dex sehen.',
  t:()=>NP('windkueste',13,9,'Fotografin Lene')},
 {f:'sq_tausch1',title:'Tildas Tauschhandel',d:'Händlerin Tilda auf dem Windküsten-Pfad tauscht einen Blattstein gegen 3 Supertränke.',
  t:()=>NP('windkueste',2,13,'Händlerin Tilda')},
 {f:'sq_schatz',title:'Der Schatz der Glutschlucht',d:'Bergführer Torben kennt einen Schatz hinter Geröll, Dornen und Wasser. Die Schlucht liegt östlich von Route 3, ab 3 Medaillen.',req:{badges:3,text:'Ab 3 Medaillen'},
  t:()=>G.flags.sq_schatz_on?NP('glutschlucht',2,18,'Versteckter Schatz'):NP('glutschlucht',6,6,'Bergführer Torben')},
 {f:'sq_hitze',title:'Hitzeprobe',d:'Schmiedin Ruska in der Glutschlucht will eine Glut- oder Fels-Kreatur ab Level 27 in deinem Team sehen. Sie wohnt im Osten der Schlucht.',
  t:()=>NP('glutschlucht',13,10,'Schmiedin Ruska')},
 {f:'sq_lichter',title:'Die drei Flüsterlichter',d:'Mondweberin Sira im Flüstertal bittet dich, nachts drei Flüsterlichter einzusammeln. Ab 4 Medaillen.',req:{badges:4,text:'Ab 4 Medaillen'},
  t:()=>{const F=G.flags;if(F.sq_lichter_on){const o=[[2,3],[17,10],[4,22]].find((p,i)=>!F['sq_fl'+(i+1)]);if(o)return NP('fluestertal',o[0],o[1],'Flüsterlicht (nachts)');}return NP('fluestertal',15,3,'Mondweberin Sira (nachts)');}},
 {f:'sq_tausch2',title:'Nyx und die Nacht',d:'Händlerin Nyx zeigt sich nur nachts im Flüstertal und tauscht einen Dunkelstein gegen Wesensessenz und Quellessenz.',
  t:()=>NP('fluestertal',5,13,'Händlerin Nyx (nachts)')}];
SQ.forEach(q=>{SIDEQUESTS.push(q.req?{f:q.f,title:q.title,d:q.d,req:q.req}:{f:q.f,title:q.title,d:q.d});QTARGET[q.f]=q.t;});
function sideNow(){return SQ.find(q=>!G.flags[q.f]);}

// --- NPC-Erweiterungen: hook (eigene Gesprächslogik), nightOnly/dayOnly (Sichtbarkeit) ---
const HOOKS={};
const newQ=t=>toast('Neue Nebenmission: '+t),doneQ=t=>toast('Nebenmission erfüllt: '+t);
function reward(items,money){const L=[];items.forEach(([k,n])=>{addItem(k,n);L.push(n+'× '+ITEMS[k].n);});if(money){G.money+=money;L.push(money+' ¤');}sfx('lvl');return 'Du erhältst '+L.join(', ')+'.';}
function takeItem(k,n){G.bag[k]=(G.bag[k]||0)-n;if(G.bag[k]<=0)delete G.bag[k];}
function caughtType(t){return Object.keys(G.dex.caught).some(id=>MONS[id]&&MONS[id].t.includes(t));}
const _talk=talk;
talk=function(n){if(n.hook&&HOOKS[n.hook]){if(n.t!=='item')n.face=opp(P.dir);return HOOKS[n.hook](n);}return _talk(n);};
const _npcHidden=npcHidden;
npcHidden=function(n){if(n.nightOnly&&!isNight())return 1;if(n.dayOnly&&isNight())return 1;return _npcHidden(n);};

HOOKS.mika=n=>{const F=G.flags;
 if(F.sq_woelkchen)return say('Mika: Mein Wölki schläft jetzt wieder jede Nacht an meinem Kissen. Danke, dass du es gefunden hast!');
 if(F.sq_woelkchen_found){F.sq_woelkchen=1;F.sq_woelkchen_on=1;const r=reward([['ultra',2],['trank',3]],500);doneQ('Das verlorene Wölkchen');
  return say(['Mika: Wölki! Da bist du ja! Es hat sich an dich geschmiegt…','Mika: Danke, danke, danke! Das hier ist von meinem Papa für Retter.',r]);}
 if(!F.sq_woelkchen_on)return say(['Mika: Mein Wölki ist weggeflogen! Es ist so leicht, dass der Wind es einfach mitgenommen hat.','Mika: Bitte such es auf dem Windküsten-Pfad. Es ist ganz schüchtern und versteckt sich bestimmt im Gras.'],()=>{F.sq_woelkchen_on=1;newQ('Das verlorene Wölkchen');});
 return say('Mika: Hast du mein Wölki schon gefunden? Es ist ganz bestimmt im Gras auf dem Pfad, im Nordosten hinter der Brücke.');};
HOOKS.woelkchen=n=>{G.flags.sq_woelkchen_found=1;sfx('catch');
 return say(['Im Gras kauert ein winziges Wölkchen. Ein verirrtes Wölki! Es zittert ein wenig.','Es schmiegt sich an dich und folgt dir willig.',G.flags.sq_woelkchen_on?'Bring es zu Mika nach Möwenbucht!':'Es gehört bestimmt jemandem. In Möwenbucht weiß man sicher mehr.']);};
HOOKS.henrik=n=>{const F=G.flags;
 if(F.sq_post)return say('Henrik: Der Hafenmeister hat geantwortet? Dann ist ja alles gut. Danke, Bote!');
 if(!F.sq_post_on)return say(['Henrik: Du siehst fit aus! Kannst du mir einen Gefallen tun?','Henrik: Dieser Brief muss zum Hafenmeister nach Brisenhafen. Mit meinen Knien schaffe ich den langen Küstenpfad nicht mehr.','Du hast einen versiegelten Brief erhalten.'],()=>{F.sq_post_on=1;newQ('Post für den Hafen');});
 return say('Henrik: Der Brief geht an den Hafenmeister in Brisenhafen. Du findest ihn unten am Hafenmarkt.');};
HOOKS.hafen=n=>{const F=G.flags;
 if(F.sq_post_on&&!F.sq_post){F.sq_post=1;const r=reward([['beleber',2],['supertr',2]],600);doneQ('Post für den Hafen');
  return say(['Hafenmeister: Ein Brief von Henrik aus Möwenbucht? Er bestellt wie jedes Jahr zehn neue Netze.','Hafenmeister: Du hast dir ein Trinkgeld verdient, Bote.',r]);}
 if(F.sq_post)return say('Hafenmeister: Henrik schreibt mir jedes Jahr dasselbe. Aber ich lese seine Briefe gern.');
 return say('Hafenmeister: Ich führe Buch über alle Schiffe in Brisenhafen. Nach Osten geht es über den Windküsten-Pfad nach Möwenbucht.');};
HOOKS.lene=n=>{const F=G.flags,T=[['flora','Flora'],['flut','Flut'],['boe','Böe']],miss=T.filter(([t])=>!caughtType(t));
 if(F.sq_foto)return say('Lene: Mein Fotoband „Wesen der Küste“ ist fast fertig. Deine Kreaturen sind die Stars!');
 if(!miss.length){F.sq_foto=1;F.sq_foto_on=1;const r=reward([['ultra',3],['elixier',2]],0);doneQ('Fotosafari');
  return say(['Lene: Ein Flora-, ein Flut- und ein Böe-Wesen! Perfekt, die Fotos werden grandios.','Lene: Hier, dein Honorar als Model.',r]);}
 if(!F.sq_foto_on)return say(['Lene: Ich bin Lene, Naturfotografin. Für mein Buch fehlen mir noch ein paar Motive.','Lene: Zeig mir ein Flora-Wesen, ein Flut-Wesen und ein Böe-Wesen. Gefangen müssen sie sein, dann trägt dein Dex sie ein.'],()=>{F.sq_foto_on=1;newQ('Fotosafari');});
 return say(['Lene: Es fehlt noch: '+miss.map(m=>m[1]).join(', ')+'.','Lene: Es zählen alle Kreaturen, die in deinem Dex als gefangen stehen.']);};
HOOKS.tilda=n=>{const F=G.flags,have=G.bag.supertr||0;
 if(F.sq_tausch1)return say('Tilda: Der Blattstein steht dir gut! Handeln macht glücklich.');
 return ask('Tilda: Ich bin Tilda, fahrende Händlerin. Ich tausche einen Blattstein gegen 3 Supertränke. Du hast '+have+'. Tauschen?',['Tauschen','Später'],i=>{if(i)return;
  if(have<3)return say('Tilda: Das sind noch nicht genug Supertränke. Komm wieder, wenn du drei hast!');
  takeItem('supertr',3);addItem('blattstein',1);F.sq_tausch1=1;sfx('lvl');doneQ('Tildas Tauschhandel');say(['Tilda: Abgemacht!','Du erhältst 1× Blattstein.']);});};
HOOKS.torben=n=>{const F=G.flags;
 if(F.sq_schatz)return say('Torben: Du hast den Schatz tatsächlich geholt! Ich hätte nie geglaubt, dass jemand alle drei Hindernisse knackt.');
 if(!F.sq_schatz_on)return say(['Torben: Ich bin Torben, Bergführer. Tief in dieser Schlucht liegt ein alter Schatz, aber der Weg ist versperrt.','Torben: Geröll weicht einer Fels-Kreatur, Dornen weichen Glut oder Böe, und das Wasser im Südwesten gefriert unter Frost. Viel Glück!'],()=>{F.sq_schatz_on=1;newQ('Der Schatz der Glutschlucht');});
 return say('Torben: Erst das Geröll im Tunnel, dann die Dornenhecke im Süden, zuletzt das Wasser im Südwesten. Frost macht daraus eine Eisbrücke.');};
HOOKS.schatz=n=>{const F=G.flags;F.sq_schatz=1;F.sq_schatz_on=1;const r=reward([['ultra',5],['elixier',3],['hypertr',2]],2000);doneQ('Der Schatz der Glutschlucht');
 return say(['Unter einem glühenden Stein liegt eine alte Kiste!','Du hast den Schatz der Glutschlucht gefunden!',r]);};
HOOKS.ruska=n=>{const F=G.flags,ok=G.team.find(m=>(MONS[m.s].t.includes('glut')||MONS[m.s].t.includes('fels'))&&m.l>=27);
 if(F.sq_hitze)return say('Ruska: Die Esse brennt, die Kreaturen glühen. Besser kann ein Tag nicht sein!');
 if(ok){F.sq_hitze=1;F.sq_hitze_on=1;const r=reward([['hypertr',2],['elixier',2]],800);doneQ('Hitzeprobe');return say(['Ruska: '+mname(ok)+' auf Level '+ok.l+'! Das nenne ich Hitze!',r]);}
 if(!F.sq_hitze_on)return say(['Ruska: Ich schmiede seit dreißig Jahren in dieser Schlucht. Eine echte Glut-Kreatur erkenne ich am Blick.','Ruska: Zeig mir eine Glut- oder Fels-Kreatur ab Level 27 in deinem Team, dann belohne ich dich!'],()=>{F.sq_hitze_on=1;newQ('Hitzeprobe');});
 return say('Ruska: Noch nicht heiß genug. Ich brauche eine Glut- oder Fels-Kreatur ab Level 27 in deinem Team.');};
HOOKS.sira=n=>{const F=G.flags,c=[1,2,3].filter(i=>F['sq_fl'+i]).length;
 if(F.sq_lichter)return say('Sira: Das Tal leuchtet wieder. Die Schatten sind jetzt viel sanfter zu uns.');
 if(c>=3){F.sq_lichter=1;F.sq_lichter_on=1;const r=reward([['lichtstein',1],['ultra',3],['hypertr',1]],1500);doneQ('Die drei Flüsterlichter');return say(['Sira: Drei Flüsterlichter! Sie tanzen schon wieder um meinen Stein.','Sira: Nimm dies als Dank des Tals.',r]);}
 if(!F.sq_lichter_on)return say(['Sira: Ich webe Mondlicht in Stoffe. Doch meine Flüsterlichter sind fortgeflattert.','Sira: Sammle drei von ihnen ein. Sie zeigen sich nur nachts: im Nordwesten, am Teich im Osten und im Süden des Tals.'],()=>{F.sq_lichter_on=1;newQ('Die drei Flüsterlichter');});
 return say('Sira: Du hast '+c+' von 3 Flüsterlichtern. Sie tanzen nur nachts: im Nordwesten, am Teich im Osten und im Süden.');};
HOOKS.licht=n=>{G.flags[n.flag]=1;sfx('catch');const c=[1,2,3].filter(i=>G.flags['sq_fl'+i]).length;
 return say(['Ein Flüsterlicht tanzt in deine Hand und erlischt mit einem leisen Seufzen.','Flüsterlichter gesammelt: '+c+' von 3.'+(c>=3?' Bring sie zu Sira an den Steinkreis!':'')]);};
HOOKS.nyx=n=>{const F=G.flags;
 if(F.sq_tausch2)return say('Nyx: Der Dunkelstein wird dir gute Dienste leisten. Die Nacht vergisst nie.');
 return ask('Nyx: Psst… Ich tausche einen Dunkelstein gegen 1 Wesensessenz und 1 Quellessenz. Abgemacht?',['Tauschen','Nein'],i=>{if(i)return;
  if(!(G.bag.elixier>0&&G.bag.hypertr>0))return say('Nyx: Dafür brauche ich eine Wesensessenz und eine Quellessenz. Komm wieder, wenn du beides hast.');
  takeItem('elixier',1);takeItem('hypertr',1);addItem('dunkelstein',1);F.sq_tausch2=1;sfx('lvl');doneQ('Nyx und die Nacht');say(['Nyx: Abgemacht. Ich war nie hier.','Du erhältst 1× Dunkelstein.']);});};
