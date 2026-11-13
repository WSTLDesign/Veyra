// ===== VEYRA – Hauptgeschichte „Das Lied der acht Kristalle“ (Agent B2 Story) =====
// 8 Kapitel (je Region eines) + Finale + Epilog, Nebenmissionen, Kanon-Texte, Zielführung, Kapitel-Karten.
// Daten: STORY (Kapitel → Schritte, je Schritt ein Missions-Flag in G.flags), SITES (Kanon-Ort → heutige Karte), STORY_TERM (Platzhalter-Begriffe).
// Figuren: NPCs tragen fig:'<id>' (docs/figuren.md, 34-figures.js). Spielstand: G.story={ch,help{},seen{},mig} – Default in 21-species.js (Block „B2“).
// Doku: docs/story.md · Test: test/unit_story.mjs

// ---------- Begriffe (Platzhalter, bis docs/figuren.md sie festlegt) ----------
// Werte = Begriffe aus 34-figures.js (FIGURES.terms, Agent B1); T_() liest zur Laufzeit zuerst dort
const STORY_TERM={elite:'Turmrat',eliteOne:'Turmhüter',eliteW:'Turmhüterin',ace:'Veyra-Profi',champ:'Ardena',champTitle:'Kronenhüterin',champLong:'Trägerin der Kristallkrone',crown:'Kristallkrone',order:'Schattenorden',orderNew:'Dämmerbund'};
function T_(k){try{if(typeof FIGURES!=='undefined'&&FIGURES&&FIGURES.terms&&FIGURES.terms[k])return FIGURES.terms[k];}catch(e){}return STORY_TERM[k]||k;}

// ---------- Orte: Kanon-Name → heutige Karte (Loop C/D biegen hier nur map/n/in um) ----------
// n = Name im Text, in = „in …“-Wendung, kanon = endgültiger Kanon-Name (WELT-KANON)
const SITES={
 aurenstadt:{map:'morgenau',n:'Morgenau',in:'in Morgenau',kanon:'Aurenstadt'},
 labor:{map:'labor',n:'Labor',in:'im Labor',kanon:'Forschungszentrum Aurenstadt'},
 elowenhaus:{map:'haus_nachbar',n:'Haus nebenan',in:'im Haus nebenan',kanon:'Elowens Haus'},
 lichtweg:{map:'route1',n:'Route 1',in:'auf Route 1',kanon:'Lichtlande-Weg'},
 wurzelheim:{map:'kupferhain',n:'Kupferhain',in:'in Kupferhain',kanon:'Wurzelheim'},
 waldpfad:{map:'route2',n:'Route 2',in:'auf Route 2',kanon:'Smaragdwald-Pfad'},
 tempel:{map:'nebelgrotte',n:'Nebelgrotte',in:'in der Nebelgrotte',kanon:'Altwurzeltempel'},
 azurhafen:{map:'brisenhafen',n:'Brisenhafen',in:'in Brisenhafen',kanon:'Azurhafen'},
 muschelbucht:{map:'windkueste',n:'Windküsten-Pfad',in:'auf dem Windküsten-Pfad',kanon:'Muschelbucht'},
 leuchtturm:{map:'haus_moewe3',n:'Möwenbucht',in:'in Möwenbucht',kanon:'Leuchtturmklippen'},
 himmelsbruecke:{map:'route3',n:'Sonnenhang',in:'am Sonnenhang',kanon:'Himmelsbrücke'},
 eiswacht:{map:'frostheim',n:'Frostheim',in:'in Frostheim',kanon:'Eiswacht'},
 emberklamm:{map:'glutschlucht',n:'Glutschlucht',in:'in der Glutschlucht',kanon:'Emberklamm'},
 tiefenmine:{map:'nebelgrotte',n:'Nebelgrotte',in:'in der Nebelgrotte',kanon:'Tiefenmine'},
 morast:{map:'route4',n:'Nebelmarsch',in:'im Nebelmarsch',kanon:'Morastplateau'},
 nebelholm:{map:'schattmoor',n:'Schattmoor',in:'in Schattmoor',kanon:'Nebelholm'},
 schattenhain:{map:'fluestertal',n:'Flüstertal',in:'im Flüstertal',kanon:'Schattenhain'},
 kristallfeste:{map:'siegesstrasse',n:'Siegesstraße',in:'auf der Siegesstraße',kanon:'Kristallfeste'},
 palast:{map:'liga',n:'Palast',in:'im Palast',kanon:'Königspalast Aurenstadt'}};

// ---------- Medaillen (ersetzen die alten „Orden“; G.badges speichert den Namen) ----------
const MEDALS=[['Floramedaille','badge1','flora'],['Flutmedaille','badge2','flut'],['Böenmedaille','badge_boe','boe'],['Frostmedaille','badge3','frost'],
 ['Glutmedaille','badge_glut','glut'],['Felsmedaille','badge_fels','fels'],['Schattenmedaille','badge4','schatten'],['Lumenmedaille','badge_lumen','lumen']];
const MEDAL_OLD={'Blütenorden':'Floramedaille','Wellenorden':'Flutmedaille','Gletscherorden':'Frostmedaille','Mondorden':'Schattenmedaille'};

// ---------- Lernliste: kurze Hilfen fürs Kind (einmal, wenn der Schritt dran ist) ----------
const STORY_HELP={
 talk:'Tipp: Stell dich vor eine Person und tippe auf A.',
 starter:'Tipp: Stell dich vor eine Fangkapsel auf dem Tisch und tippe auf A.',
 catch:'Tipp: Schwäche eine wilde Kreatur. Tippe dann auf Tasche und wirf eine Fangkapsel.',
 guide:'Tipp: Folge dem orangen Leuchtpfeil. Er zeigt dir immer den Weg.',
 chronik:'Tipp: Tippe auf Chronik. Die Karte zeigt dir dein nächstes Ziel.',
 heal:'Tipp: In jeder Kreaturenstation heilt Mirael deine Kreaturen. Sprich mit ihr.',
 type:'Tipp: Glut schlägt Flora. Flut schlägt Glut. Flora schlägt Flut.',
 field:'Tipp: Kreaturen helfen dir. Stell dich vor Geröll oder Dornen und tippe auf A.',
 resonanz:'Tipp: Ist der Resonanz-Ring im Kampf voll, tippe darauf. Deine Kreatur wird stärker!',
 medal:'Tipp: Jede Medaille zeigt: Ein Elementarkristall ist wieder sicher.',
 box:'Tipp: Ist dein Team voll, kommen neue Kreaturen in die Kreaturenbox.',
 double:'Tipp: Im Doppelkampf kämpfen zwei Kreaturen auf jeder Seite. Tippe auf ein Ziel.',
 mission:'Tipp: Oben links steht immer deine Mission. Tippe darauf für mehr.'};

// ---------- Hauptgeschichte ----------
// Schritt: f = Flag · t = Kurz-Ziel (HUD) · d = Satz · by = Auslöser-NPC {map, hook|flag} oder at = [map,x,y,Label] · help · old = alter Fortschritt, der den Schritt beim Laden erledigt
const STORY=[
 {n:1,reg:'Lichtlande',el:'lumen',title:'Der erste Funke',crystal:null,end:'s1_elowen',
  goal:'Hol dir deinen ersten Partner bei Professor Veyran.',
  steps:[
   {f:'starter',t:'Wähle deinen ersten Partner',d:'Professor Veyran wartet {in@labor}. Auf dem Tisch liegen drei Fangkapseln.',by:{map:'labor',at:[5,4]},l:'Fangkapseln auf dem Tisch',help:'starter'},
   {f:'s1_rivalen',t:'Lerne Rayan und Mira kennen',d:'Zwei Kinder stürmen ins Labor. Sprich mit ihnen!',by:{map:'labor',hook:'rayan_labor'},l:'Rayan und Mira',help:'talk',old:'badge1'},
   {f:'firstcatch',t:'Fange eine wilde Kreatur',d:'Im hohen Gras {in@lichtweg} leben wilde Kreaturen. Fang eine!',at:['route1',9,6,'Hohes Gras'],help:'catch'},
   {f:'s1_kaine',t:'Folge dem Fremden im Mantel',d:'Jemand im dunklen Mantel steht {in@lichtweg} und beobachtet dich.',by:{map:'route1',hook:'kaine1'},l:'Fremder im Mantel',help:'guide',old:'badge1'},
   {f:'s1_elowen',t:'Zeig Oma Elowen den Splitter',d:'Oma Elowen wohnt {in@elowenhaus} {in@aurenstadt}. Sie kennt alte Legenden.',by:{map:'haus_nachbar',hook:'elowen'},l:'Oma Elowen',help:'chronik',old:'badge1'}]},
 {n:2,reg:'Smaragdwald',el:'flora',title:'Das Flüstern im Wald',crystal:'flora',end:'s2_kristall',
  goal:'Beschütze den Flora-Kristall {in@wurzelheim}.',
  steps:[
   {f:'s2_elara',t:'Triff die Waldhüterin Elara',d:'Elara wartet {in@wurzelheim}. Der Wald braucht Hilfe.',by:{map:'kupferhain',hook:'elara'},l:'Waldhüterin Elara',help:'heal',old:'badge1'},
   {f:'badge1',t:'Gewinne die Floramedaille',d:'Arenaleiter Lior wartet in seiner Arena {in@wurzelheim}.',by:{map:'arena1',flag:'badge1'},l:'Arenaleiter Lior',help:'type'},
   {f:'grunt1',t:'Folge dem Orden in die Grotte',d:'Ordensleute sind {in@tempel} verschwunden. Sie wollen den Flora-Kristall.',by:{map:'nebelgrotte',flag:'grunt1'},l:'Ordensrekrut',help:'field'},
   {f:'s2_seraphine',t:'Sprich mit der Frau in Violett',d:'Eine Frau in violettem Mantel steht {in@tempel}.',by:{map:'nebelgrotte',hook:'seraphine1'},l:'Seraphine',old:'badge2'},
   {f:'s2_kristall',t:'Bring den Kristall zu Elara',d:'Der Flora-Kristall muss nach Hause. Elara wartet {in@wurzelheim}.',by:{map:'kupferhain',hook:'elara'},l:'Waldhüterin Elara',old:'badge2'}]},
 {n:3,reg:'Flutküste',el:'flut',title:'Wellen der Freundschaft',crystal:'flut',end:'s3_leuchtturm',
  goal:'Rette den Flut-Kristall im Leuchtturm.',
  steps:[
   {f:'s3_mira',t:'Triff Mira am Hafen',d:'Mira wartet am Hafen {in@azurhafen} auf einen Probekampf.',by:{map:'brisenhafen',hook:'mira1'},l:'Rivalin Mira',help:'resonanz',old:'badge3'},
   {f:'badge2',t:'Gewinne die Flutmedaille',d:'Arenaleiterin Neria wartet im Wasserpalast {in@azurhafen}.',by:{map:'arena2',flag:'badge2'},l:'Arenaleiterin Neria',help:'medal'},
   {f:'s3_kaine',t:'Halte den Späher Kaine auf',d:'Kaine schleicht {in@muschelbucht} Richtung Leuchtturm.',by:{map:'windkueste',hook:'kaine_kueste'},l:'Späher Kaine',old:'badge3'},
   {f:'s3_leuchtturm',t:'Besuche den Leuchtturmwärter',d:'Ruven wohnt im Leuchtturm-Haus {in@leuchtturm}.',by:{map:'haus_moewe3',hook:'ruven'},l:'Leuchtturmwärter Ruven',old:'badge3'}]},
 {n:4,reg:'Himmelsweiten',el:'boe',title:'Die Brücke im Wind',crystal:'boe',end:'badge_boe',
  goal:'Hol den Böen-Kristall zurück zu Sylva.',
  steps:[
   {f:'tr_lio',t:'Stell dich deinem Rivalen Rayan',d:'Rayan wartet {in@himmelsbruecke}. Er will wissen, wer stärker ist.',by:{map:'route3',flag:'tr_lio'},l:'Rivale Rayan'},
   {f:'s4_seraphine',t:'Stell Seraphine auf der Brücke',d:'Seraphine steht mit dem Böen-Kristall auf der Brücke {in@himmelsbruecke}.',by:{map:'route3',hook:'seraphine2'},l:'Seraphine',old:'badge3'},
   {f:'s4_kristall',t:'Bring Sylva ihren Kristall',d:'Sylva aus den Himmelsweiten wartet oben {in@himmelsbruecke}.',by:{map:'route3',hook:'sylva'},l:'Arenaleiterin Sylva',old:'badge3'},
   {f:'badge_boe',t:'Gewinne die Böenmedaille',d:'Sylva fordert dich heraus. Zeig ihr, wie hoch du fliegst!',by:{map:'route3',hook:'sylva'},l:'Arenaleiterin Sylva'}]},
 {n:5,reg:'Frosttundra',el:'frost',title:'Das verborgene achte Königreich',crystal:'frost',end:'s5_kaine',
  goal:'Finde das Geheimnis des achten Kristalls {in@eiswacht}.',
  steps:[
   {f:'badge3',t:'Gewinne die Frostmedaille',d:'Arenaleiterin Eira trainiert im ewigen Eis {in@eiswacht}.',by:{map:'arena3',flag:'badge3'},l:'Arenaleiterin Eira',help:'box'},
   {f:'s5_elowen',t:'Hör Oma Elowens Legende',d:'Oma Elowen ist {in@eiswacht}. Sie will dir etwas Wichtiges sagen.',by:{map:'frostheim',hook:'elowen2'},l:'Oma Elowen',old:'boss1'},
   {f:'s5_ruinen',t:'Untersuche die Eisruinen',d:'Im Norden {in@eiswacht} liegen alte Eisruinen mit Bildern.',by:{map:'frostheim',hook:'eisruine'},l:'Eisruinen',old:'boss1'},
   {f:'s5_kaine',t:'Sprich mit Kaine',d:'Kaine steht nachdenklich vor den Eisruinen.',by:{map:'frostheim',hook:'kaine2'},l:'Späher Kaine',old:'boss1'}]},
 {n:6,reg:'Glutlande',el:'glut',title:'Zusammen sind wir stärker',crystal:'glut',end:'s6_rayan2',
  goal:'Hilf Rayan und Kael, den Glut-Kristall zu schützen.',
  steps:[
   {f:'s6_rayan',t:'Hilf Rayan',d:'Rayan sitzt erschöpft {in@emberklamm}. Seine Kreaturen sind müde.',by:{map:'glutschlucht',hook:'rayan_glut'},l:'Rayan',old:'badge4'},
   {f:'s6_orden',t:'Stoppe die zwei Ordensrekruten',d:'Zwei Ordensrekruten wollen den Glut-Kristall holen. Ein Doppelkampf!',by:{map:'glutschlucht',hook:'orden_glut'},l:'Ordensrekruten',help:'double',old:'badge4'},
   {f:'badge_glut',t:'Gewinne die Glutmedaille',d:'Arenaleiter Kael wartet unten am Lavafluss {in@emberklamm}.',by:{map:'glutschlucht',hook:'kael'},l:'Arenaleiter Kael'},
   {f:'s6_rayan2',t:'Sprich noch einmal mit Rayan',d:'Rayan will dir etwas sagen.',by:{map:'glutschlucht',hook:'rayan_glut'},l:'Rayan',old:'badge4'}]},
 {n:7,reg:'Kristallgebirge',el:'fels',title:'Tief in der Mine',crystal:'fels',end:'s7_tarek',
  goal:'Rette den Fels-Kristall in der Tiefenmine.',
  steps:[
   {f:'s7_torvik',t:'Triff Torvik',d:'Torvik aus dem Kristallgebirge wartet {in@tiefenmine}.',by:{map:'nebelgrotte',hook:'torvik'},l:'Arenaleiter Torvik',old:'badge4'},
   {f:'s7_rekruten',t:'Stoppe die Ordensrekruten',d:'Drei Rekruten graben {in@tiefenmine} nach dem Fels-Kristall.',by:{map:'nebelgrotte',hook:'rekruten'},l:'Ordensrekruten',old:'badge4'},
   {f:'badge_fels',t:'Gewinne die Felsmedaille',d:'Torvik will einen ehrlichen Kampf.',by:{map:'nebelgrotte',hook:'torvik'},l:'Arenaleiter Torvik'},
   {f:'s7_tarek',t:'Hör Tareks Messung',d:'Tarek misst die Kristalle. Sein Gerät piept wie verrückt.',by:{map:'nebelgrotte',hook:'tarek_mine'},l:'Forscher Tarek',old:'badge4'}]},
 {n:8,reg:'Schattenmoor',el:'schatten',title:'Licht im Dämmerland',crystal:'schatten',end:'s8_hain',
  goal:'Finde heraus, warum der Schatten-Kristall flackert.',
  steps:[
   {f:'boss1',t:'Stell Kaine im Nebelmarsch',d:'Kaine versperrt {in@morast} den Weg nach Osten.',by:{map:'route4',flag:'boss1'},l:'Späher Kaine'},
   {f:'s8_kaine',t:'Hör Kaine zu',d:'Kaine will dir etwas sagen.',by:{map:'route4',hook:'kaine3'},l:'Kaine',old:'badge4'},
   {f:'badge4',t:'Gewinne die Schattenmedaille',d:'Arenaleiterin Nymera wartet im Mondtempel {in@nebelholm}.',by:{map:'arena4',flag:'badge4'},l:'Arenaleiterin Nymera'},
   {f:'s8_hain',t:'Besuche den Schatten-Kristall',d:'Nymera zeigt dir den Schatten-Kristall {in@schattenhain}.',by:{map:'fluestertal',hook:'schattenkristall'},l:'Schatten-Kristall',old:'champion'}]},
 {n:9,reg:'Lichtlande',el:'lumen',title:'Das Lied der acht Kristalle',crystal:'lumen',end:'champion',finale:1,
  goal:'Bring den Schattenorden und die Kristalle wieder zusammen.',
  steps:[
   {f:'badge_lumen',t:'Gewinne die Lumenmedaille',d:'Arenaleiter Solan wartet am Sonnentor {in@kristallfeste}.',by:{map:'siegesstrasse',hook:'solan'},l:'Arenaleiter Solan'},
   {f:'sf_seraphine',t:'Stell Seraphine',d:'Seraphine bewacht die Kristallkammern {in@kristallfeste}.',by:{map:'siegesstrasse',hook:'seraphine3'},l:'Seraphine',old:'champion'},
   {f:'sf_varkon',t:'Stell Lord Varkon',d:'Lord Varkon hat die Kristalle gesammelt. Er steht vor dem Palast.',by:{map:'siegesstrasse',hook:'varkon'},l:'Lord Varkon',old:'champion'},
   {f:'sf_auralis',t:'Sprich mit Varkon',d:'Varkon ist traurig. Vielleicht können alle zusammen helfen.',by:{map:'siegesstrasse',hook:'varkon'},l:'Lord Varkon',old:'champion'},
   {f:'top4',t:'Besiege den {T:elite}',d:'Im Kristallturm warten die vier Turmhüter vom {T:elite}.',fn:'liga',l:'{T:elite}',old:'top3'},
   {f:'champion',t:'Triff {T:champTitle} {T:champ}',d:'{T:champTitle} {T:champ} wartet ganz oben im Palast.',by:{map:'liga',flag:'champion'},l:'{T:champTitle} {T:champ}'}]},
 {n:10,reg:'Aurenstadt',el:'lumen',title:'Ein neuer Morgen',crystal:null,end:'se_fest',epilog:1,
  goal:'Feiere mit allen {in@aurenstadt}.',
  steps:[
   {f:'se_fest',t:'Feiere mit Professor Veyran',d:'Alle warten {in@labor} {in@aurenstadt} auf dich!',by:{map:'labor',hook:'veyran'},l:'Professor Veyran',help:'mission'}]}];
const STEPS=[];STORY.forEach(c=>c.steps.forEach((s,i)=>{s.ch=c.n;s.i=i;STEPS.push(s);}));
const CRYSTALS=[['flora','Flora','#2fbf55'],['flut','Flut','#2a84f0'],['boe','Böen','#8aa3ff'],['frost','Frost','#46d3f0'],['glut','Glut','#ff6526'],['fels','Fels','#b8793a'],['schatten','Schatten','#7a46c8'],['lumen','Lumen','#e8b80a']];
function crystalSafe(k,F){F=F||(G&&G.flags)||{};const c=STORY.find(c=>c.crystal===k);return!!(c&&F[c.end]);}
function storyStep(F){F=F||(G&&G.flags)||{};return STEPS.find(s=>!F[s.f])||null;}
function storyChapter(n){return STORY.find(c=>c.n===n);}

// ---------- Text: Kanon-Begriffe, Ort-Platzhalter, Rivalen-Starter ----------
const KANON_REPL=[[/Prof\. Lindqvist/g,'Professor Veyran'],[/Lindqvist/g,'Veyran'],[/Dämmerorden/g,'Schattenorden'],[/Dämmerordens/g,'Schattenordens'],
 [/\bden ([A-ZÄÖÜ][a-zäöüß]*medaille)\b/g,'die $1'],[/\bTop[- ]Vier\b/g,()=>T_('elite')],[/\bTop-Drei\b/g,()=>T_('eliteOne')],
 [/\b(\d+)\/4 Orden\b/g,'$1/8 Medaillen'],[/\bab dem ersten Orden\b/g,'ab der ersten Medaille'],[/\b(\d|zwei|drei|vier|fünf|sechs|sieben|acht) Orden\b/g,'$1 Medaillen']];
function rivalRoot(w){const r=typeof G!=='undefined'&&G&&G.rivals&&G.rivals[w]&&G.rivals[w].starter;return r||(w==='rayan'?1:4);}
function siteOf(k){return SITES[k]||null;}
function kanonText(t){if(typeof t!=='string')return t;
 t=t.replace(/\{(in)?@(\w+)\}/g,(m,i,k)=>{const S=SITES[k];return S?(i?S.in:S.n):k;}).replace(/\{T:(\w+)\}/g,(m,k)=>T_(k))
  .replace(/\{mon:(\w+)\}/g,(m,w)=>{const r=rivalRoot(w);return MONS[r]?MONS[r].n:'';}).replace(/\{N\}/g,()=>typeof NMON!=='undefined'?NMON:MONS.length-1);
 for(const[a,b]of KANON_REPL)t=t.replace(a,b);
 // Schwierigkeit „leicht“: keine Bestrafung – dann auch keinen Geldverlust ankündigen
 if(/Hälfte deines Geldes/.test(t))try{if(typeof DF==='function'&&!DF().loseLoss)t='Keine Sorge, dir fehlt nichts. Ruh dich kurz aus!';}catch(e){}
 return t;}
// Kästen mit mehr als 2 Zeilen (> 110 Zeichen) an der Satzgrenze teilen; der Sprecher-Name wird übernommen
function kanonLines(l){const o=[];for(const x of [].concat(l)){const t=kanonText(x);if(typeof t!=='string'||t.length<=110||/\n/.test(t)){o.push(t);continue;}
 const m=t.match(/^([^:\n]{2,30}): /),nm=m?m[1]+': ':'',body=m?t.slice(nm.length):t,ss=body.match(/[^.!?…]+[.!?…]+["“”]?\s*/g)||[body];let a='';
 for(const s of ss){if(a&&(nm+a+s).trim().length>110){o.push((nm+a).trim());a='';}a+=s;}if(a)o.push((nm+a).trim());}return o;}
const _say27=say;say=function(l,cb){return _say27(kanonLines(l),cb);};
const _rivalize27=rivalize;rivalize=function(t){return _rivalize27(kanonText(t));};
// Kreaturenstation: Mirael begrüßt dich mit Ortsgruß (Text der Frage aus 03/25 wird ersetzt)
const MIRAEL_HI={heil_kupfer:'Der Wald duftet heute nach Moos.',heil_brise:'Riechst du das Meer?',heil_frost:'Wärm dich erst mal auf!',heil_schatt:'Hier leuchten die Laternen die ganze Nacht.',
 heil_sieg:'Gleich geht es zum Palast. Aufgeregt?',heil_moewe:'Die Möwen haben mir von dir erzählt.'};
const _ask27=ask;ask=function(q,opts,cb){if(typeof q==='string'&&/^Willkommen in der Kreaturenstation! Sollen wir/.test(q)){const h=cur&&MIRAEL_HI[cur.id];q='Mirael: Willkommen in der Kreaturenstation!'+(h?' '+h:'')+'\nSoll ich deine Kreaturen heilen?';}
 return _ask27(kanonText(q),Array.isArray(opts)?opts.map(kanonText):opts,cb);};
if(typeof chronikCall==='function'){const _cc27=chronikCall;chronikCall=function(name,lines){return _cc27(kanonText(name),[].concat(lines).map(kanonText));};}

// ---------- Hauptschritte → Missionsliste (QUESTS) und Zielführung (QTARGET) ----------
function npcBy(by){const L=NPCS[by.map]||[];return by.hook?L.find(n=>n.hook===by.hook):by.flag?L.find(n=>n.flag===by.flag):null;}
function stepTarget(s){
 if(s.fn==='liga'){if(cur&&cur.id==='liga'){const n=(NPCS.liga||[]).find(n=>n.t==='trainer'&&!G.flags[n.flag]);if(n)return{map:'liga',x:n.x,y:n.y,l:n.name};}return{map:'liga',x:5,y:13,l:kanonText(s.l)};}
 if(s.at)return{map:s.at[0],x:s.at[1],y:s.at[2],l:kanonText(s.at[3]||s.l)};
 if(s.by){if(s.by.at)return{map:s.by.map,x:s.by.at[0],y:s.by.at[1],l:kanonText(s.l)};const n=npcBy(s.by);if(n)return{map:s.by.map,x:n.x,y:n.y,l:kanonText(s.l||n.name||'')};}
 return null;}
STEPS.forEach(s=>{const c=storyChapter(s.ch);QUESTS.push({id:'st_'+s.f,f:s.f,ch:s.ch,get title(){return kanonText(s.t);},get d(){return kanonText(s.d);},get chapter(){return kanonText((c.finale?'Finale':c.epilog?'Epilog':'Kapitel '+c.n)+' · '+c.reg+' · '+c.title);}});
 QTARGET['st_'+s.f]=()=>stepTarget(s);});
// Zielführung: wie 16-expansion, zusätzlich Ziel-Funktionen für Hauptschritte
questTarget=function(){if(!G)return null;const q=QUESTS.find(q=>!G.flags[q.f]);
 if(!q){const s=sideNow();if(!s)return null;const T=QTARGET[s.f];return typeof T==='function'?T():T||null;}
 let T=QTARGET[q.id];if(typeof T==='function')T=T();if(!T)return null;
 if(T.in&&cur&&cur.id in T.in){const v=T.in[cur.id];if(v)return{map:cur.id,x:v[0],y:v[1],l:v[2]};const n=npcs().find(n=>n.t==='trainer'&&!G.flags[n.flag]);return n?{map:cur.id,x:n.x,y:n.y,l:n.name}:null;}
 if(!MAPS[T.map]&&!INTERIORS[T.map])return null;return T;};

// ---------- Sichtbarkeit: sOn (alle Flags nötig) / sOff (verschwindet bei einem Flag) ----------
const _npcHid27=npcHidden;npcHidden=function(n){const F=(G&&G.flags)||{};if(n.sOn&&![].concat(n.sOn).every(f=>F[f]))return 1;if(n.sOff&&[].concat(n.sOff).some(f=>F[f]))return 1;return _npcHid27(n);};

// ---------- Figuren-Daten: Rivalen-Teams nach Starter, Begriffe der Endrunde ----------
function stageAt(root,lv){let s=root,g=0;while(MONS[s]&&MONS[s].ev&&lv>=MONS[s].ev.l&&g++<4)s=MONS[s].ev.to;return s;}
function storyNpc(map,key){return(NPCS[map]||[]).find(n=>n.flag===key||n.hook===key);}
function defTeam(n,f){if(n)Object.defineProperty(n,'team',{configurable:true,enumerable:true,get:f});}
// Teams aus FIGURES (34-figures.js: figTeam/rivalTeam) auf das Kapitel-Level gebracht; ohne FIGURES bleibt das Team aus 02-world
const FIG_FIGHT={badge1:['lior',14],badge2:['neria',22],badge_boe:['sylva',21],badge3:['eira',30],badge_glut:['kael',30],badge_fels:['torvik',32],badge4:['nymera',36],badge_lumen:['solan',40],
 s3_kaine:['kaine',20,1],boss1:['kaine',32,2],s4_seraphine:['seraphine',21],sf_seraphine:['seraphine',40],sf_varkon:['varkon',44],top1:['brann',41],top2:['zaria',42],top3:['ondra',43],top4:['hesper',44],champion:['ardena',47]};
function figTeamOk(T){return Array.isArray(T)&&T.length&&T.every(x=>Array.isArray(x)&&MONS[x[0]]&&x[1]>0);}
for(const id in NPCS)for(const n of NPCS[id]){const k=n.t==='trainer'&&FIG_FIGHT[n.flag];if(!k)continue;const st=n.team;
 defTeam(n,()=>{try{if(typeof figTeam==='function'&&typeof FIGURES!=='undefined'&&FIGURES[k[0]]){const T=figTeam(k[0],{lv:k[1],stufe:k[2]});if(figTeamOk(T))return T;}}catch(e){}return st;});}
{const sm=storyNpc('brisenhafen','s3_mira'),sr=storyNpc('route3','tr_lio'),fm=()=>[[stageAt(rivalRoot('mira'),17),17],[59,15]],fr=()=>[[stageAt(rivalRoot('rayan'),22),22],[57,20],[60,21]];
 const riv=(w,st,fb)=>{try{if(typeof rivalTeam==='function'&&typeof FIGURES!=='undefined'&&FIGURES[w]){const T=rivalTeam(w,st);if(figTeamOk(T))return T;}}catch(e){}return fb();};
 defTeam(sm,()=>riv('mira',2,fm));defTeam(sr,()=>riv('rayan',3,fr));}

// ---------- Hilfen für Gespräche ----------
const F_=()=>G.flags;
function fightN(n,pre){return say(pre||n.pre,()=>startBattle({trainer:n}));}
function askFight(n,q,later){return ask(kanonText(q),['Los geht\'s!','Später'],i=>{if(i)return say(later||'Komm wieder, wenn du bereit bist!');startBattle({trainer:n});});}
function stepDone(f){if(!G.flags[f]){G.flags[f]=1;const s=STEPS.find(s=>s.f===f);const c=s&&storyChapter(s.ch);if(c&&c.end===f)chapterDone(c);}}
function chapterDone(c){try{sfx('lvl');vib([20,40,60]);}catch(e){}const k=c.crystal&&CRYSTALS.find(x=>x[0]===c.crystal);
 toast(c.epilog?'Epilog geschafft!':(c.finale?'Finale':'Kapitel '+c.n)+' geschafft!'+(k?' Der '+k[1]+'-Kristall leuchtet.':''));}
function isEvolved(s){for(let i=1;i<MONS.length;i++)if(MONS[i]&&MONS[i].ev&&MONS[i].ev.to===s)return true;return false;}
function healHere(){healAll();if(G.ret)G.respawn={...G.ret};}
function curStepLine(){const s=storyStep();return s?'Dein nächstes Ziel: '+kanonText(s.t)+'.':'Du hast alle Kapitel geschafft!';}

// ---------- Kapitel 1 · Lichtlande ----------
HOOKS.veyran=n=>{const F=F_();
 if(!F.starter)return say(['Professor Veyran: Da bist du ja! Willkommen in meinem Labor.','Professor Veyran: In Veyra gibt es sieben große Elemente.','Professor Veyran: Glut, Flut, Flora, Fels, Böe, Lumen und Schatten.','Professor Veyran: Auf dem Tisch liegen drei Fangkapseln. Wähle deinen ersten Partner!']);
 if(!F.s1_rivalen)return say('Professor Veyran: Rayan und Mira wollen dich kennenlernen. Sprich mit ihnen!');
 if(!F.firstcatch)return say(['Professor Veyran: Auf {@lichtweg} im Norden leben wilde Kreaturen.','Professor Veyran: Fang eine davon. Deine Chronik schreibt alles auf!']);
 if(F.champion&&!F.se_fest){const r=reward([['schimmertalisman',1],['ultra',5]],3000);
  return say(['Professor Veyran: {name}! Ganz {@aurenstadt} feiert dich!','Mama: Ich habe Kuchen gebacken. Für alle!','Rayan: Nächstes Mal gewinne ich. Aber heute feiere ich mit dir.',
   'Mira: Ich reise mit Neria zu den Korallenriffen. Kommst du mal mit?','Kaine: Der Orden heißt jetzt {T:orderNew}. Wir pflegen die Kristalle.','Oma Elowen: Die Kristalle singen. Und du hast ihnen zugehört.',
   'Professor Veyran: Deine Reise ist nicht zu Ende. Es warten noch viele Kreaturen.','Professor Veyran: Und die Legenden wollen dich kennenlernen!','Professor Veyran: Hier, ein Schimmertalisman. Damit findest du leichter Glanzformen.',r],()=>stepDone('se_fest'));}
 if(F.se_fest)return say('Professor Veyran: Findest du alle {N} Kreaturen? Die Chronik zählt mit.');
 return say(['Professor Veyran: Schön, dich zu sehen, {name}!','Professor Veyran: '+curStepLine()]);};
HOOKS.rayan_labor=HOOKS.mira_labor=n=>say(['Rayan: Hey! Ich bin Rayan. Ich habe {mon:rayan} gewählt. Wir werden die Besten!','Mira: Und ich bin Mira. Mein Partner ist {mon:mira}.',
 'Mira: Kleiner Tipp: Im hohen Gras wohnen wilde Kreaturen.','Mira: Im Kampf tippst du auf Tasche. Dann wirfst du eine Fangkapsel.','Rayan: Wer zuerst eine fängt, hat gewonnen! Bis dann!',
 'Rayan und Mira rennen aus dem Labor.'],()=>stepDone('s1_rivalen'));
HOOKS.kaine1=n=>say(['Ein Fremder im dunklen Mantel schaut durch ein Fernglas.','Kaine: Hm? Ein neues Gesicht. Interessant.','Kaine: Der Kristall im Wald flackert. Der Orden wird ihn holen.',
 'Er verschwindet im Nebel. Im Gras glitzert etwas Rotes.','Du findest einen roten Kristallsplitter. Zeig ihn Oma Elowen!'],()=>{stepDone('s1_kaine');sfx('catch');});
HOOKS.elowen=n=>{const F=F_();
 if(F.sq_korb_on&&!F.sq_korb){const r=reward([['trank',3],['honigtau',1]],0);F.sq_korb=1;doneQ('Mamas Picknickkorb');
  return say(['Oma Elowen: Ein Korb von deiner Mama? Mit Beerenkuchen! Danke, Kind.','Oma Elowen: Nimm ein paar Kräuter mit. Die tun Kreaturen gut.',r]);}
 if(!F.starter)return say(['Oma Elowen: Heute holst du deinen ersten Partner? Wie aufregend!','Oma Elowen: Das Labor ist gleich unten im Süden.']);
 if(F.s1_kaine&&!F.s1_elowen){const r=reward([['superk',3],['trank',3]],0);
  return say(['Oma Elowen: Ein roter Splitter? Zeig mal her… Oh je.','Oma Elowen: Das ist ein Zeichen vom Schattenorden.','Oma Elowen: Hör gut zu. In Veyra gibt es Elementarkristalle.',
   'Oma Elowen: Sie halten Feuer, Wasser, Wald und Wind im Gleichgewicht.','Oma Elowen: Sieben Kristalle kennt jeder. Einen achten kennt fast niemand.',
   'Oma Elowen: Seit einiger Zeit flackern sie. Der Orden will sie alle einsammeln.','Oma Elowen: Aber Kristalle gehören nach Hause. So wie Kreaturen zu ihren Freunden.',
   'Oma Elowen: Geh nach {@wurzelheim}. Die Waldhüterin Elara braucht Hilfe.',r],()=>stepDone('s1_elowen'));}
 if(!F.s1_kaine)return say(['Oma Elowen: Deine Kreatur ist ja reizend! Pass gut auf sie auf.','Oma Elowen: Wenn dir draußen etwas Seltsames begegnet, erzähl es mir.']);
 if(F.se_fest)return say(['Oma Elowen: Weißt du, was Auralis mir einmal ins Ohr gesummt hat?','Oma Elowen: „Kein Kristall leuchtet allein.“ Jetzt weißt du, warum.']);
 return say(['Oma Elowen: Jeder Kristall singt sein eigenes Lied. Hörst du es auch?','Oma Elowen: '+curStepLine()]);};
HOOKS.mama=n=>{const F=F_();healHere();
 if(!F.starter)return say(n.txt);
 if(!F.sq_korb_on)return say(['Mama: Schön, dass du da bist! Deine Kreaturen ruhen sich kurz aus.','Mama: Bringst du Oma Elowen nebenan diesen Picknickkorb?','Du hast den Picknickkorb bekommen.'],()=>{F.sq_korb_on=1;newQ('Mamas Picknickkorb');});
 if(!F.sq_korb)return say(['Mama: Der Korb ist für Oma Elowen. Sie wohnt im Haus nebenan.','Mama: Deine Kreaturen sind wieder fit!']);
 return say([F.champion?'Mama: Ich bin so stolz auf dich!':'Mama: Ruht euch aus. Ich habe Tee gekocht.','Mama: Deine Kreaturen sind wieder fit!']);};

// ---------- Kapitel 2 · Smaragdwald ----------
HOOKS.elara=n=>{const F=F_();
 if(F.s2_kristall)return HOOKS.elara_sq(n);
 if(!F.s2_elara)return say(['Elara: Halt! Du bist neu hier, oder? Ich bin Elara, die Waldhüterin.','Elara: Der Flora-Kristall wohnt im Garten-Tempel von Lior.','Elara: Doch seit Tagen schleichen Ordensleute herum.',
  'Elara: Gewinne Liors Vertrauen in der Arena. Dann helfen wir zusammen!'],()=>stepDone('s2_elara'));
 if(F.s2_seraphine&&!F.s2_kristall){const r=reward([['ultra',2],['honigtau',2]],800);
  return say(['Elara: Du hast den Flora-Kristall! Unglaublich!','Elara: Hör nur, wie er summt. Jetzt ist er wieder zu Hause.','Elara: Der Wald dankt dir. Ich auch.',r],()=>stepDone('s2_kristall'));}
 if(!F.badge1)return say('Elara: Liors Arena ist das große Gebäude im Norden. Viel Glück!');
 if(!F.grunt1)return say(['Elara: Die Ordensleute sind in die Nebelgrotte gelaufen!','Elara: Sie liegt an {@waldpfad}, gleich im Osten.']);
 return say('Elara: Was ist in der Grotte passiert? Sieh lieber nach!');};
HOOKS.seraphine1=n=>say(['Eine Frau in violettem Mantel tritt aus dem Nebel.','Seraphine: Knut, du Tollpatsch. Komm, wir gehen.','Seraphine: Und du… du verstehst noch nicht, warum wir das tun.',
 'Seraphine: Die Kristalle werden schwach. Lord Varkon will Veyra retten.','Sie verschwindet. Knut lässt vor Schreck etwas fallen.','Du hast den Flora-Kristall gefunden! Er leuchtet grün und warm.',
 'Bring ihn zu Elara nach {@wurzelheim}!'],()=>{stepDone('s2_seraphine');sfx('catch');});

// ---------- Kapitel 3 · Flutküste ----------
HOOKS.mira1=n=>{const F=F_();if(!F.s3_mira)return fightN(n);
 if(!F.badge2)return say(['Mira: Neria ist streng, aber lieb. Du schaffst das!',STORY_HELP.type]);
 return say(['Mira: Ich habe gehört, ein Späher schleicht zum Leuchtturm.','Mira: Pass auf dich auf, ja? Wir sind doch Freunde.']);};
HOOKS.kaine_kueste=n=>fightN(n);
HOOKS.ruven=n=>{const F=F_();
 if(F.s3_kaine&&!F.s3_leuchtturm){const r=reward([['netz',3],['supertr',2]],1000);
  return say(['Ruven: Du hast den Späher verjagt? Dann ist mein Licht sicher!','Ruven: Oben im Turm leuchtet der Flut-Kristall.','Ruven: Er macht das Licht blau. So verirrt sich kein Schiff.',
   'Ruven: Weit draußen auf dem Meer wacht Thalor über die Gezeiten.','Ruven: Nimm das als Dank, junger Held.',r],()=>stepDone('s3_leuchtturm'));}
 return say(n.txt);};

// ---------- Kapitel 4 · Himmelsweiten ----------
HOOKS.seraphine2=n=>fightN(n);
HOOKS.sylva=n=>{const F=F_();
 if(F.badge_boe)return say(['Sylva: Der Wind trägt dich nach Norden. Dort liegt {@eiswacht}.','Sylva: Zieh dich warm an!']);
 if(!F.s4_seraphine)return say(['Sylva: Hallo! Ich bin Sylva aus den Himmelsweiten.','Sylva: Der Orden hat meinen Böen-Kristall geholt!','Sylva: Seraphine steht damit auf der Brücke im Süden. Hilfst du mir?']);
 if(!F.s4_kristall){const r=reward([['ultra',2],['boesiegel',1]],0);
  return say(['Sylva: Du hast meinen Kristall! Er pfeift fröhlich im Wind.','Sylva: Danke! Jetzt weht der Wind wieder frei.',r],()=>{stepDone('s4_kristall');askFight(n,'Sylva: Kämpfst du mit mir um die Böenmedaille?');});}
 return askFight(n,'Sylva: Kämpfst du mit mir um die Böenmedaille?');};

// ---------- Kapitel 5 · Frosttundra (Wendepunkt) ----------
HOOKS.elowen2=n=>say(['Oma Elowen: Da bist du ja! Ich bin mit dem Schlitten gekommen.','Oma Elowen: Weißt du noch? Ich sprach von einem achten Kristall.','Oma Elowen: Er liegt hier im Eis versteckt. Der Frost-Kristall.',
 'Oma Elowen: Im Norden der Stadt sind alte Eisruinen. Dort steht die wahre Geschichte.','Oma Elowen: Geh hin und sieh sie dir an. Ich warte hier.'],()=>stepDone('s5_elowen'));
HOOKS.eisruine=n=>say(['In das alte Eis sind Bilder geritzt. Du wischst den Schnee weg.','Bild 1: Acht Kristalle leuchten. Jeder in seinem Land.','Bild 2: Ein Mann trägt alle Kristalle fort. Sie werden dunkel.',
 'Bild 3: Menschen und Kreaturen halten sich an den Händen. Die Kristalle singen.','Darunter steht: „Gemeinsam, nicht allein.“','Unter dem Eis funkelt der Frost-Kristall. Er ist sicher!'],()=>{stepDone('s5_ruinen');sfx('catch');});
HOOKS.kaine2=n=>{const r=reward([['hypertr',2],['frostsiegel',1]],1200);
 return say(['Kaine steht vor den Bildern. Er bemerkt dich nicht.','Kaine: Ein Mann trägt alle Kristalle fort. Und sie werden dunkel…','Kaine: Lord Varkon sagt, wir retten Veyra. Aber das Bild sagt etwas anderes.',
  'Kaine: Ich… ich muss nachdenken.','Kaine geht leise in den Schnee davon.','Oma Elowen: Der Orden ist nicht böse, Kind. Er hat Angst.','Oma Elowen: Und Angst kann man verstehen.',r],()=>stepDone('s5_kaine'));};

// ---------- Kapitel 6 · Glutlande ----------
HOOKS.rayan_glut=n=>{const F=F_();
 if(!F.s6_rayan){const has=(G.bag.trank||0)>0;if(has)takeItem('trank',1);
  return say(['Rayan sitzt erschöpft auf einem Stein. Seine Kreaturen sind müde.','Rayan: Ich wollte den Orden allein aufhalten. Das war dumm.','Rayan: Die Ordensrekruten kämpfen immer zu zweit!',
   has?'Du gibst Rayan einen Kräutertrank. Seine Kreaturen strahlen wieder.':'Du hilfst Rayan auf. Er lächelt ein bisschen.','Rayan: Danke, {name}. Zusammen sind wir stärker.','Rayan: Sie stehen gleich da vorn. Zeig es ihnen!'],()=>stepDone('s6_rayan'));}
 if(!F.s6_orden)return say('Rayan: Die zwei Rekruten stehen gleich da vorn. Ich feuere dich an!');
 if(!F.badge_glut)return say('Rayan: Jetzt fehlt nur noch Kael! Er steht unten am Lavafluss.');
 const r=reward([['glutsiegel',1],['ultra',3]],0);
 return say(['Rayan: Du hast Kael besiegt! Wahnsinn!','Rayan: Weißt du was? Ich trainiere jetzt mit meinem Team. Nicht nur für mich.','Rayan: Kael sagt, der Fels-Kristall ist auch in Gefahr.',
  'Rayan: Er liegt tief in der Tiefenmine. Der Eingang ist {in@tiefenmine}.',r],()=>stepDone('s6_rayan2'));};
HOOKS.orden_glut=n=>fightN(n);
HOOKS.kael=n=>{const F=F_();if(!F.badge_glut)return fightN(n);return say(['Kael: Dein Feuer brennt hell!','Kael: Pass gut auf den Fels-Kristall auf.']);};

// ---------- Kapitel 7 · Kristallgebirge ----------
HOOKS.torvik=n=>{const F=F_();
 if(!F.s7_torvik)return say(['Torvik: Wer da? Ah, du bist {name}! Rayan hat von dir erzählt.','Torvik: Ich bin Torvik aus dem Kristallgebirge.','Torvik: Hier unten beginnt die Tiefenmine. Dort schläft der Fels-Kristall.',
  'Torvik: Aber ich höre Ordensleute graben! Hilfst du mir?'],()=>stepDone('s7_torvik'));
 if(!F.s7_rekruten)return say('Torvik: Die Rekruten graben im Westen der Grotte!');
 if(!F.badge_fels)return askFight(n,'Torvik: Danke! Jetzt ein ehrlicher Kampf um die Felsmedaille?');
 return say('Torvik: Tarek misst die Kristalle. Sprich mit ihm!');};
HOOKS.rekruten=n=>fightN(n);
HOOKS.tarek_mine=n=>{const r=reward([['felssiegel',1],['resokristall',1]],0);
 return say(['Tarek: Psst! Mein Messgerät piept wie verrückt.','Tarek: Alle Kristalle werden schwächer. Nicht nur einer.','Tarek: Am stärksten flackert der Schatten-Kristall im Osten.',
  'Tarek: Der Orden hat recht: Es gibt ein Problem.','Tarek: Aber Wegnehmen hilft nicht. Das zeigen die Bilder im Eis.','Tarek: Nimm dieses Resonanzprisma. Es stärkt die Resonanz im Kampf.',r],()=>stepDone('s7_tarek'));};

// ---------- Kapitel 8 · Schattenmoor ----------
HOOKS.kaine3=n=>say(['Kaine: Ich habe die Bilder im Eis nicht vergessen.','Kaine: Lord Varkon hat Angst. Er glaubt, nur er kann die Kristalle schützen.','Kaine: Ich mache nicht mehr mit. Ich helfe jetzt dir.',
 'Kaine: Varkon wartet vor dem Palast. Seraphine bewacht die Kristallkammern.','Kaine: Aber zuerst brauchst du Nymeras Hilfe {in@nebelholm}.'],()=>stepDone('s8_kaine'));
HOOKS.nymera_hain=n=>{const F=F_();if(F.s8_hain)return say('Nymera: Siehst du? Licht und Schatten brauchen einander.');
 return say(['Nymera: Komm, hier wohnt der Schatten-Kristall. Hab keine Angst.','Nymera: Schatten ist wie eine warme Decke. Er hilft dem Licht beim Ausruhen.','Nymera: Leg deine Hand auf den Kristall. Er ist gleich neben mir.']);};
HOOKS.schattenkristall=n=>{const r=reward([['schattensiegel',1],['hypertr',3]],1500);
 return say(['Du legst deine Hand auf den Schatten-Kristall.','Er ist kühl und weich wie Mondlicht.','Deine Kreaturen kuscheln sich an. Das Flackern hört auf!',
  'Nymera: Er mag dich. Jetzt flackert er nicht mehr.','Nymera: Geh zur {@kristallfeste}. Dort wartet die letzte Prüfung.',r],()=>{stepDone('s8_hain');sfx('catch');});};

// ---------- Finale · Lichtlande ----------
HOOKS.solan=n=>{const F=F_();if(!F.badge_lumen)return fightN(n);return say(['Solan: Der Weg zu den Kristallkammern ist frei.','Solan: Sei mutig. Und sei freundlich.']);};
HOOKS.seraphine3=n=>{const F=F_();if(!F.sf_seraphine)return fightN(n);
 return say(['Seraphine: Kaine hat mir die Bilder aus dem Eis gezeigt.','Seraphine: Vielleicht… hat Varkon sich geirrt.','Seraphine: Geh zu ihm. Ich komme mit.']);};
HOOKS.varkon=n=>{const F=F_();if(!F.sf_varkon)return fightN(n);
 if(!F.sf_auralis){const r=reward([['lumensiegel',1],['beleber',3]],3000);
  return say(['Varkon: Ich habe die Kristalle eingesammelt, um sie zu schützen. Und doch flackern sie.','Da kommen alle: Rayan, Mira, Kaine, Seraphine, Elara und Oma Elowen.',
   'Oma Elowen: Varkon. Kristalle kann man nicht einsperren. Sie brauchen Freunde.','Rayan: Zusammen! So wie auf den Bildern im Eis!','Alle halten ihre Kreaturen fest. Eine warme Resonanz breitet sich aus.',
   'Vom Himmel schwebt ein helles Licht herab. Es ist Auralis, das Ursprungswesen!','Auralis summt ein Lied. Alle acht Kristalle singen mit.','Varkon: Sie… sie leuchten wieder. Weil wir zusammen sind.',
   'Varkon: Es tut mir leid. Ich wollte ganz allein alles retten.','Varkon: Ab heute bringen wir jeden Kristall nach Hause. Versprochen.','Auralis schaut dich freundlich an. Dann wird es zu Sternenstaub.',
   'Die Palastwache verbeugt sich. Der Weg in den Palast ist frei!',r],()=>{stepDone('sf_auralis');try{vib([30,60,120]);}catch(e){}});}
 return say(['Varkon: Danke, {name}. Wir nennen uns jetzt {T:orderNew}.','Varkon: Im Palast wartet der {T:elite}. Viel Glück!']);};
HOOKS.wache=n=>{const F=F_();if(F.sf_varkon)return say('Palastwache: Lord Varkon möchte noch mit dir sprechen.');
 return say(['Palastwache: Der Palast ist noch geschlossen.','Palastwache: Erst müssen alle Kristalle wieder leuchten!']);};

// ---------- Nebenmissionen (11 neu) · Flags: sq_<id>_on = angenommen, sq_<id> = erledigt ----------
const SQ2=[
 {f:'sq_korb',title:'Mamas Picknickkorb',d:'Bring Mamas Picknickkorb zu Oma Elowen ins Haus nebenan.',req:{flag:'starter',text:'Nach der Starterwahl'},
  t:()=>G.flags.sq_korb_on?NP('haus_nachbar',4,3,'Oma Elowen'):NP('haus_spieler',3,3,'Mama')},
 {f:'sq_funkel',title:'Tareks Funkelsteine',d:'Tarek im Labor sucht drei Funkelsteine. Sie liegen auf Route 1, in Kupferhain und auf Route 2.',req:{flag:'firstcatch',text:'Nach dem ersten Fang'},
  t:()=>{const F=G.flags;if(F.sq_funkel_on){const o=[['route1',16,13,'sq_fs1'],['kupferhain',18,1,'sq_fs2'],['route2',11,11,'sq_fs3']].find(p=>!F[p[3]]);if(o)return NP(o[0],o[1],o[2],'Funkelstein');}return NP('labor',8,2,'Forscher Tarek');}},
 {f:'sq_experiment',title:'Tareks Experiment',d:'Tarek möchte eine entwickelte Kreatur in deinem Team sehen.',req:{flag:'sq_funkel',text:'Nach Tareks Funkelsteinen'},t:()=>NP('labor',8,2,'Forscher Tarek')},
 {f:'sq_faehrten',title:'Elaras Fährten',d:'Elara sucht drei Tierspuren. Zwei sind auf Route 2, eine ist in der Nebelgrotte.',req:{flag:'s2_kristall',text:'Nach Kapitel 2'},
  t:()=>{const F=G.flags;if(F.sq_faehrten_on){const o=[['route2',5,8,'sq_fa1'],['route2',17,3,'sq_fa2'],['nebelgrotte',2,9,'sq_fa3']].find(p=>!F[p[3]]);if(o)return NP(o[0],o[1],o[2],'Tierspur');}return NP('kupferhain',16,12,'Waldhüterin Elara');}},
 {f:'sq_blumen',title:'Wilmas durstige Blumen',d:'Gärtnerin Wilma in Kupferhain braucht eine Flut-Kreatur in deinem Team.',req:{flag:'starter',text:'Nach der Starterwahl'},t:()=>NP('kupferhain',3,12,'Gärtnerin Wilma')},
 {f:'sq_laterne',title:'Borwins Laterne',d:'Händler Borwin in Brisenhafen hat seine Laterne auf Route 2 verloren.',
  t:()=>G.flags.sq_laterne_on&&!G.flags.sq_laterne_found?NP('route2',6,3,'Borwins Laterne'):NP('brisenhafen',16,6,'Händler Borwin')},
 {f:'sq_knoten',title:'Marlenes Flut-Freunde',d:'Kapitänin Marlene in Brisenhafen wartet. Zeig ihr drei Flut-Kreaturen in deinem Dex.',t:()=>NP('brisenhafen',16,12,'Kapitänin Marlene')},
 {f:'sq_fieber',title:'Das frierende Frosti',d:'Ein Frosti in Frostheim ist krank. Bring Heilerin Mirael eine Sonnbeere oder Honigtau.',t:()=>NP('frostheim',17,5,'Heilerin Mirael')},
 {f:'sq_ofen',title:'Astas kalter Ofen',d:'Asta in der Hütte der Glutschlucht sucht eine Glutnuss für ihren Ofen.',
  t:()=>G.flags.sq_ofen_on&&!G.flags.sq_nuss?NP('glutschlucht',1,9,'Glutnuss'):NP('huette_glut',4,3,'Hüttenwärterin Asta')},
 {f:'sq_sterne',title:'Corvins Sternenfreund',d:'Sternendeuter Corvin wohnt in Schattmoor. Zeig ihm eine Schatten-Kreatur in deinem Team.',t:()=>NP('schattmoor',16,13,'Sternendeuter Corvin')},
 {f:'sq_signal',title:'Kaines Signalkristalle',d:'Kaine hat drei Signalkristalle versteckt. Zwei liegen im Nebelmarsch, einer in Schattmoor.',req:{flag:'s8_kaine',text:'Nach Kapitel 8'},
  t:()=>{const F=G.flags;if(F.sq_signal_on){const o=[['route4',4,3,'sq_sk1'],['route4',13,10,'sq_sk2'],['schattmoor',2,13,'sq_sk3']].find(p=>!F[p[3]]);if(o)return NP(o[0],o[1],o[2],'Signalkristall');}return NP('schattmoor',6,13,'Kaine');}}];
SQ2.forEach(q=>{SQ.push(q);SIDEQUESTS.push({f:q.f,title:q.title,d:q.d,req:q.req});QTARGET[q.f]=q.t;});
// Alte Nebenmissionen: Medaillen statt Orden (Sperre über req statt Text-Erkennung)
SIDEQUESTS.forEach(q=>{const m=(q.d||'').match(/\b[Aa]b (\d) Orden/);if(m&&!q.req)q.req={badges:+m[1],text:'Ab '+m[1]+' Medaillen'};if(m)q.d=q.d.replace(/\b([Aa]b) (\d) Orden/,'$1 $2 Medaillen');
 const w=(q.d||'').match(/\b[Aa]b (Wellen)orden/);if(w){q.req=q.req||{badges:2,text:'Ab Flutmedaille'};q.d=q.d.replace(/\b([Aa]b) Wellenorden/,'$1 Flutmedaille');}});
SQ.forEach(q=>{q.d=q.d.replace(/\b([Aa]b) (\d) Orden/,'$1 $2 Medaillen').replace(/\b([Aa]b) Wellenorden/,'$1 Flutmedaille');});
function countF(L){return L.filter(f=>G.flags[f]).length;}
HOOKS.tarek=n=>{const F=F_();
 if(!F.starter)return say(['Tarek: Oh! Hallo! Ich bin Tarek, Professor Veyrans Assistent.','Tarek: Such dir zuerst einen Partner aus. Ich bin so gespannt!']);
 if(!F.firstcatch)return say(['Tarek: Fang erst mal eine Kreatur. Danach habe ich eine Aufgabe für dich.',STORY_HELP.catch]);
 if(!F.sq_funkel_on)return say(['Tarek: Ich erforsche, wie Kreaturen sich entwickeln.','Tarek: Dafür brauche ich drei Funkelsteine.','Tarek: Einer liegt auf {@lichtweg}, einer {in@wurzelheim}, einer auf {@waldpfad}.'],()=>{F.sq_funkel_on=1;newQ('Tareks Funkelsteine');});
 if(!F.sq_funkel){const c=countF(['sq_fs1','sq_fs2','sq_fs3']);if(c<3)return say('Tarek: Du hast '+c+' von 3 Funkelsteinen. Sie glitzern gelb!');
  F.sq_funkel=1;const r=reward([['ultra',2],['honigtau',1]],0);doneQ('Tareks Funkelsteine');return say(['Tarek: Drei Funkelsteine! Perfekt, jetzt kann ich messen.',r]);}
 if(!F.sq_experiment_on)return say(['Tarek: Neues Experiment! Zeig mir eine Kreatur, die sich entwickelt hat.','Tarek: Kreaturen entwickeln sich durch Training, Kristalle oder Freundschaft.'],()=>{F.sq_experiment_on=1;newQ('Tareks Experiment');});
 if(!F.sq_experiment){const m=G.team.find(m=>m&&isEvolved(m.s));if(!m)return say('Tarek: Noch keine entwickelte Kreatur im Team? Trainiere weiter!');
  F.sq_experiment=1;const r=reward([['donnerstein',1],['blattstein',1]],800);doneQ('Tareks Experiment');return say(['Tarek: '+mname(m)+'! Wunderschön entwickelt!','Tarek: Das schreibe ich sofort auf. Danke!',r]);}
 return say('Tarek: Jede Entwicklung ist ein kleines Wunder. Findest du alle?');};
HOOKS.funkelstein=n=>{G.flags[n.flag]=1;sfx('catch');const c=countF(['sq_fs1','sq_fs2','sq_fs3']);
 return say(['Du hast einen Funkelstein gefunden! Er glitzert gelb.','Funkelsteine: '+c+' von 3.'+(c>=3?' Bring sie zu Tarek ins Labor!':'')]);};
HOOKS.elara_sq=n=>{const F=F_();
 if(!F.sq_faehrten_on)return say(['Elara: Willst du die Geheimnisse des Waldes lernen?','Elara: Such drei Tierspuren. Zwei auf {@waldpfad}, eine {in@tempel}.'],()=>{F.sq_faehrten_on=1;newQ('Elaras Fährten');});
 if(!F.sq_faehrten){const c=countF(['sq_fa1','sq_fa2','sq_fa3']);if(c<3)return say('Elara: Du hast '+c+' von 3 Spuren gefunden. Schau genau hin!');
  F.sq_faehrten=1;const r=reward([['ultra',3],['federkapsel',2]],0);doneQ('Elaras Fährten');
  return say(['Elara: Alle drei Spuren! Du hast das Auge einer Waldhüterin.','Elara: Seltene Kreaturen zeigen sich oft nur bei Nacht oder bei Regen.',r]);}
 return say(['Elara: Ich kenne geheime Pfade in ganz Veyra.','Elara: '+curStepLine()]);};
HOOKS.faehrte=n=>{G.flags[n.flag]=1;sfx('catch');const c=countF(['sq_fa1','sq_fa2','sq_fa3']);
 return say(['Du findest kleine Pfotenabdrücke im Boden.','Tierspuren: '+c+' von 3.'+(c>=3?' Zeig sie Elara!':'')]);};
HOOKS.wilma=n=>{const F=F_();
 if(F.sq_blumen)return say('Wilma: Meine Blumen tanzen im Wind. Danke für den Regen!');
 const fl=G.team.find(m=>m&&MONS[m.s]&&MONS[m.s].t.includes('flut'));
 if(fl){F.sq_blumen=1;F.sq_blumen_on=1;const r=reward([['honigtau',3],['sonnbeere',2]],0);doneQ('Wilmas durstige Blumen');
  return say(['Wilma: Oh, '+mname(fl)+'! Kannst du meine Blumen gießen?',mname(fl)+' spritzt fröhlich Wasser. Die Blumen strahlen!','Wilma: Wunderbar! Das hier ist für euch.',r]);}
 return say(['Wilma: Früher war ich Arenaleiterin. Jetzt pflege ich Blumen.','Wilma: Meine Blumen sind so durstig! Bring mir eine Flut-Kreatur im Team.'],()=>{if(!F.sq_blumen_on){F.sq_blumen_on=1;newQ('Wilmas durstige Blumen');}});};
HOOKS.borwin=n=>{const F=F_();
 if(F.sq_laterne)return say(['Borwin: Meine Laterne leuchtet wieder! Willst du was kaufen? Nein? Auch gut!','Borwin: Ich reise bald weiter. Vielleicht sehen wir uns!']);
 if(F.sq_laterne_found){F.sq_laterne=1;const r=reward([['superk',5],['balsamkapsel',2]],0);doneQ('Borwins Laterne');
  return say(['Borwin: Meine Laterne! Ohne sie finde ich nachts keinen Weg.','Borwin: Dafür bekommst du einen Freundschafts-Rabatt. Hundert Prozent!',r]);}
 if(!F.sq_laterne_on)return say(['Borwin: Hallo! Ich bin Borwin, reisender Händler.','Borwin: Ich habe meine Laterne auf {@waldpfad} verloren. Findest du sie?'],()=>{F.sq_laterne_on=1;newQ('Borwins Laterne');});
 return say('Borwin: Die Laterne liegt irgendwo auf {@waldpfad}. Sie leuchtet orange!');};
HOOKS.laterne=n=>{G.flags[n.flag]=1;sfx('catch');return say(['Du hast Borwins Laterne gefunden!','Bring sie zu Borwin nach {@azurhafen}.']);};
HOOKS.marlene=n=>{const F=F_(),c=Object.keys(G.dex.caught).filter(id=>MONS[id]&&MONS[id].t.includes('flut')).length;
 if(F.sq_knoten)return say('Marlene: Ahoi! Neria ist eine tolle Arenaleiterin. Ich segle jetzt wieder.');
 if(c>=3){F.sq_knoten=1;F.sq_knoten_on=1;const r=reward([['netz',5],['flutsiegel',1]],0);doneQ('Marlenes Flut-Freunde');return say(['Marlene: '+c+' Flut-Kreaturen in deinem Dex! Du bist ein echter Seebär.',r]);}
 return say(['Marlene: Ahoi! Ich bin Kapitänin Marlene.','Marlene: Zeig mir drei verschiedene Flut-Kreaturen in deinem Dex. Du hast '+c+'.'],()=>{if(!F.sq_knoten_on){F.sq_knoten_on=1;newQ('Marlenes Flut-Freunde');}});};
HOOKS.mirael=n=>{const F=F_();
 if(F.sq_fieber)return say(['Mirael: Das kleine Frosti spielt wieder im Schnee.','Mirael: Danke für deine Hilfe!']);
 const k=(G.bag.sonnbeere||0)>0?'sonnbeere':(G.bag.honigtau||0)>0?'honigtau':null;
 if(F.sq_fieber_on&&k){takeItem(k,1);F.sq_fieber=1;const r=reward([['balsamkapsel',3],['hypertr',2]],0);doneQ('Das frierende Frosti');
  return say(['Mirael: Du hast '+ITEMS[k].n+' dabei! Komm, wir geben es ihm.','Das Frosti knabbert und wird ganz warm. Es lächelt!',r]);}
 if(!F.sq_fieber_on)return say(['Mirael: Ich bin Mirael, die Heilerin.','Mirael: Ein kleines Frosti friert und ist krank.','Mirael: Bring mir eine Sonnbeere oder Honigtau. Es gibt sie im Laden.'],()=>{F.sq_fieber_on=1;newQ('Das frierende Frosti');});
 return say('Mirael: Eine Sonnbeere oder Honigtau würde helfen. Der Laden ist gleich hier.');};
HOOKS.asta=n=>{const F=F_();healHere();
 if(F.sq_ofen)return say(['Asta: Mein Ofen glüht wie nie! Setz dich ans Feuer.','Asta: Deine Kreaturen sind wieder fit.']);
 if(F.sq_nuss){F.sq_ofen=1;const r=reward([['glutkern',1],['supertr',2]],0);doneQ('Astas kalter Ofen');
  return say(['Asta: Eine Glutnuss! Rein damit in den Ofen.','Asta: Hör nur, wie es knistert. Danke!',r]);}
 if(!F.sq_ofen_on)return say(['Asta: Setz dich! Deine Kreaturen sind wieder fit.','Asta: Nur mein Ofen ist kalt. Ich brauche eine Glutnuss.','Asta: Im Westen der Schlucht liegt sicher eine.'],()=>{F.sq_ofen_on=1;newQ('Astas kalter Ofen');});
 return say(['Asta: Die Glutnuss liegt im Westen der Schlucht.','Asta: Deine Kreaturen sind wieder fit.']);};
HOOKS.glutnuss=n=>{G.flags[n.flag]=1;sfx('catch');return say(['Du hast eine Glutnuss gefunden! Sie ist warm wie ein Brötchen.','Bring sie zu Asta in die Hütte.']);};
HOOKS.corvin=n=>{const F=F_();
 if(F.sq_sterne)return say('Corvin: Die Sterne erzählen von dir. Nur Gutes!');
 const m=G.team.find(m=>m&&MONS[m.s]&&MONS[m.s].t.includes('schatten'));
 if(m){F.sq_sterne=1;F.sq_sterne_on=1;const r=reward([['daemmer',5],['dunkelstein',1]],0);doneQ('Corvins Sternenfreund');
  return say(['Corvin: '+mname(m)+'! Seine Augen leuchten wie kleine Sterne.','Corvin: Schatten-Kreaturen lieben den Nachthimmel. Danke!',r]);}
 return say(['Corvin: Früher war ich Arenaleiter. Jetzt deute ich die Sterne.','Corvin: Ich würde so gern eine Schatten-Kreatur kennenlernen. Hast du eine im Team?'],()=>{if(!F.sq_sterne_on){F.sq_sterne_on=1;newQ('Corvins Sternenfreund');}});};
HOOKS.kaine4=n=>{const F=F_();
 if(!F.sq_signal_on)return say(['Kaine: Ich habe drei Signalkristalle versteckt. So fanden wir Ordensleute den Weg.','Kaine: Jetzt brauchen wir sie nicht mehr. Sammelst du sie ein?','Kaine: Zwei liegen {in@morast}, einer hier {in@nebelholm}.'],()=>{F.sq_signal_on=1;newQ('Kaines Signalkristalle');});
 if(!F.sq_signal){const c=countF(['sq_sk1','sq_sk2','sq_sk3']);if(c<3)return say('Kaine: Du hast '+c+' von 3 Signalkristallen. Sie leuchten lila.');
  F.sq_signal=1;const r=reward([['ultra',3],['resokristall',1]],0);doneQ('Kaines Signalkristalle');return say(['Kaine: Alle drei! Danke. Ich fange jetzt neu an.',r]);}
 return say('Kaine: Ich lerne gerade, Kreaturen zu pflegen statt Wege zu bewachen. Es macht Spaß!');};
HOOKS.signal=n=>{G.flags[n.flag]=1;sfx('catch');const c=countF(['sq_sk1','sq_sk2','sq_sk3']);
 return say(['Du hast einen Signalkristall gefunden. Er leuchtet lila.','Signalkristalle: '+c+' von 3.'+(c>=3?' Bring sie zu Kaine!':'')]);};

// ---------- Kapitel-Karte, Hilfen und Anrufe (nur im freien Spiel, nie in Testläufen) ----------
{const st=document.createElement('style');st.textContent=`
.stCard{position:absolute;left:50%;top:max(64px,calc(env(safe-area-inset-top,0px) + 56px));transform:translate(-50%,-12px);z-index:30;min-width:min(320px,86vw);max-width:min(460px,92vw);padding:12px 18px 13px;border-radius:18px;
 background:var(--glass,rgba(255,255,255,.78));-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 10px 30px -12px rgba(20,30,50,.5);text-align:center;opacity:0;pointer-events:none;transition:opacity .4s,transform .5s cubic-bezier(.34,1.56,.64,1)}
.stCard.on{opacity:1;transform:translate(-50%,0)}.stCard small{display:block;font:700 11px/1.2 var(--fb,system-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--stc,#d81b72)}
.stCard b{display:block;margin:3px 0 2px;font:700 20px/1.2 var(--fd,'Trebuchet MS',sans-serif);color:var(--fg,#182230)}.stCard p{margin:0;font:600 13px/1.35 var(--fb,system-ui);color:var(--mute,#5c6880)}
.stCard i{display:block;height:3px;width:56px;margin:8px auto 0;border-radius:3px;background:var(--stc,#d81b72)}
.stCrys{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.stCrys span{display:inline-flex;align-items:center;gap:5px;padding:4px 9px 4px 6px;border-radius:999px;background:var(--ui2,#f3f5f8);font-size:12px;font-weight:700;color:var(--mute,#8a94a8)}
.stCrys span:before{content:'';width:10px;height:13px;clip-path:polygon(50% 0,100% 40%,50% 100%,0 40%);background:#c4cad4}.stCrys span.on{color:var(--fg,#182230)}.stCrys span.on:before{background:var(--cc);box-shadow:0 0 8px var(--cc)}
.quest.stch{padding-top:8px}.quest.stch small.stn{color:var(--mute,#8a94a8)}.stTips p{margin:4px 0}
@media (prefers-reduced-motion:reduce){.stCard{transition:opacity .2s}}`;document.head.appendChild(st);}
let stT=0,stCardT=0;
function storyCard(c){try{let el=$('#stCard');if(!el){el=document.createElement('div');el.id='stCard';el.className='stCard';el.setAttribute('role','status');($('#screen')||document.body).appendChild(el);}
 const col=(PALETTE&&PALETTE.el&&PALETTE.el[c.el]&&PALETTE.el[c.el].c)||'#d81b72';el.style.setProperty('--stc',col);
 el.innerHTML=`<small>${c.finale?'Finale':c.epilog?'Epilog':'Kapitel '+c.n} · ${c.reg}</small><b>${kanonText(c.title)}</b><p>${kanonText(c.goal)}</p><i></i>`;
 el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(stCardT);stCardT=setTimeout(()=>el.classList.remove('on'),3800);try{sfx('tap');}catch(e){}}catch(e){}}
// Anrufe über die Chronik an Wendepunkten
const STORY_CALLS=[
 {id:'call_wende',when:F=>F.s5_kaine&&!F.s6_rayan,name:'Professor Veyran',lines:['Ich habe gehört, was in den Eisruinen steht!','Der Orden hat Angst um die Kristalle. Vielleicht können wir helfen, statt nur zu kämpfen.','Rayan ist {in@emberklamm}. Er braucht dich!']},
 {id:'call_hain',when:F=>F.s8_hain&&!F.badge_lumen,name:'Mira',lines:['Hallo! Hier ist Mira. Ich habe von dem Schatten-Kristall gehört.','Ich bin bald {in@kristallfeste}. Dann helfe ich dir!']}];
function storyTick(){if(!G||!cur||mode!=='world'||B)return;const t=performance.now();if(t-stT<600)return;stT=t;
 try{if(typeof SEQ_AUTO==='function'&&SEQ_AUTO())return;}catch(e){}
 if(!$('#dlg').hidden||($('#menu')&&!$('#menu').hidden)||($('#callOv')&&!$('#callOv').hidden))return;
 const S=G.story=G.story||{ch:0,help:{},seen:{}};S.help=S.help||{};S.seen=S.seen||{};const s=storyStep();
 if(s&&s.ch!==S.ch){S.ch=s.ch;const c=storyChapter(s.ch);/* Hybrid H2: Kapitel-Standbild (einmal je Kapitel), danach die Kapitel-Karte */if(typeof hyChapterShow==='function')stT=t+(hyChapterShow(c.n,{then:()=>storyCard(c)})?8000:3200);else{storyCard(c);stT=t+3200;}return;}
 const c=STORY_CALLS.find(c=>!S.seen[c.id]&&c.when(G.flags));if(c&&typeof chronikCall==='function'){S.seen[c.id]=1;chronikCall(c.name,c.lines);return;}
 if(s&&s.help&&!S.help[s.f]){const T=stepTarget(s);if(T&&T.map!==cur.id)return;S.help[s.f]=1;S.help['k_'+s.help]=1;say(STORY_HELP[s.help]);}}
const _guideTick27=guideTick;guideTick=function(){_guideTick27.apply(this,arguments);try{storyTick();}catch(e){}};

// ---------- Chronik: Missionen nach Kapiteln, Kristalle, acht Medaillen, Lernliste ----------
rQuest=function(el){const q=QUESTS.find(q=>!G.flags[q.f]),s=storyStep();
 if(q)el.insertAdjacentHTML('beforeend',`<div class="quest now"><small>${q.chapter}</small><h2>${q.title}</h2><p>${q.d}</p>${GP?`<span class="qgo">${GP.l}</span>`:''}</div>`);
 else el.insertAdjacentHTML('beforeend',`<div class="quest now"><small>Hauptgeschichte abgeschlossen</small><h2>Alle Kristalle singen</h2><p>Fange alle ${NMON} Kreaturen und triff die Legenden.</p></div>`);
 el.insertAdjacentHTML('beforeend','<h3>Elementarkristalle</h3><div class="stCrys">'+CRYSTALS.map(([k,n,c])=>`<span class="${crystalSafe(k)?'on':''}" style="--cc:${c}">${n}</span>`).join('')+'</div>');
 el.insertAdjacentHTML('beforeend','<h3>Kapitel</h3>');
 STORY.forEach(c=>{const done=!!G.flags[c.end],now=s&&s.ch===c.n,lab=c.finale?'Finale':c.epilog?'Epilog':'Kapitel '+c.n,n=c.steps.filter(x=>G.flags[x.f]).length;
  if(!done&&!now&&s&&c.n>s.ch)return el.insertAdjacentHTML('beforeend',`<div class="quest locked stch"><b>${LOCK}${lab} · ${c.reg}</b></div>`);
  el.insertAdjacentHTML('beforeend',`<div class="quest stch ${done?'done':''}"><b>${done?'✓ ':''}${lab} · ${kanonText(c.title)}</b><small class="stn"> ${c.reg} · ${n}/${c.steps.length}</small>${now?`<p class="muted">${kanonText(c.goal)}</p>`:''}</div>`);});
 el.insertAdjacentHTML('beforeend','<h3>Nebenmissionen</h3>');
 const L=SIDEQUESTS.map(q=>({q,r:questReq(q)})).map(o=>Object.assign(o,{lock:!G.flags[o.q.f]&&!reqMet(o.r)}));
 L.sort((a,b)=>(!!G.flags[a.q.f])-(!!G.flags[b.q.f])||a.lock-b.lock).forEach(({q,r,lock})=>el.insertAdjacentHTML('beforeend',`<div class="quest ${G.flags[q.f]?'done':lock?'locked':''}"><b>${G.flags[q.f]?'✓ ':lock?LOCK:''}${q.title}</b>${lock?`<span class="qreq">${r.text||'Noch gesperrt'}</span>`:''}<p class="muted">${kanonText(q.d)}</p></div>`));
 el.insertAdjacentHTML('beforeend',`<h3>Medaillen <small>${G.badges.length}/8</small></h3><div class="badges">${MEDALS.map(([b,f,e])=>`<span class="badge ${G.badges.includes(b)||G.flags[f]?'got':''}" style="--bc:${(PALETTE.el[e]||{}).c||'#888'}">${b}</span>`).join('')}</div>`);
 const tips=Object.keys(STORY_HELP).filter(k=>G.story&&G.story.help&&G.story.help['k_'+k]);
 if(tips.length)el.insertAdjacentHTML('beforeend','<h3>Gelernt</h3><div class="stTips">'+tips.map(k=>`<p class="muted">${STORY_HELP[k]}</p>`).join('')+'</div>');};
updHud=function(){if(!G)return;updClock();$('#hudBadges').textContent=G.badges.length+'/8 Medaillen';};

// ---------- Spielstand: einmalige Ableitung aus altem Fortschritt (aufgerufen aus migrateSave, 21-species.js Block B2) ----------
function migrateStory(g){if(!g)return g;g.flags=g.flags||{};const S=g.story=(g.story&&typeof g.story==='object')?g.story:{};S.help=S.help||{};S.seen=S.seen||{};S.pics=(S.pics&&typeof S.pics==='object')?S.pics:{};/* Hybrid H2: gezeigte Kapitel-Standbilder */
 if(Array.isArray(g.badges))g.badges=g.badges.map(b=>MEDAL_OLD[b]||b);
 if(!S.mig){const F=g.flags;STEPS.forEach(s=>{if(s.old&&F[s.old]&&!F[s.f])F[s.f]=1;});
  // Medaillen aus Flags nachtragen (z. B. sehr alte Stände ohne badges-Liste)
  if(Array.isArray(g.badges))MEDALS.forEach(([b,f])=>{if(F[f]&&!g.badges.includes(b))g.badges.push(b);});
  STORY_CALLS.forEach(c=>{if(c.when(F))S.seen[c.id]=1;});STEPS.forEach(s=>{if(F[s.f]){S.help[s.f]=1;if(s.help)S.help['k_'+s.help]=1;}});
  const c=STEPS.find(s=>!F[s.f]);S.ch=Object.keys(F).length?(c?c.ch-1:99):0;S.mig=1;}
 if(typeof S.ch!=='number')S.ch=0;return g;}
