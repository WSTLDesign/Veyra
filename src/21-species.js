// ===== VEYRA – Kreaturen-Tiefe: Wesenszüge, Anlage-/Trainings-Werte, Fähigkeiten, Geschlecht, Freundschaft, Glanzform, Migration =====
// Werte-Keys: hp, atk, def, spa, spd (Spezial-Verteidigung), spe (Initiative). stat(m,'spd') bleibt Alias für Initiative (alt), stat(m,'spv') = Spezial-Verteidigung.
// ---------- Wesenszüge (25, davon 5 neutral) ----------
const NATURES={
 ausgeglichen:{n:'Ausgeglichen',up:null,down:null,desc:'Ruht in sich – keine Neigung.'},
 beständig:{n:'Beständig',up:null,down:null,desc:'Bleibt sich in jeder Lage treu.'},
 verträumt:{n:'Verträumt',up:null,down:null,desc:'Schaut gern den Wolken nach.'},
 wechselhaft:{n:'Wechselhaft',up:null,down:null,desc:'Heute so, morgen anders.'},
 gemütlich:{n:'Gemütlich',up:null,down:null,desc:'Nimmt alles, wie es kommt.'},
 ungestüm:{n:'Ungestüm',up:'atk',down:'def',desc:'Stürmt los, ohne an Deckung zu denken.'},
 kernig:{n:'Kernig',up:'atk',down:'spa',desc:'Lieber Muskeln als Kniffe.'},
 trotzig:{n:'Trotzig',up:'atk',down:'spd',desc:'Lässt sich nichts sagen.'},
 stur:{n:'Stur',up:'atk',down:'spe',desc:'Geht langsam, aber mit Wucht.'},
 behütend:{n:'Behütend',up:'def',down:'atk',desc:'Schützt lieber, als anzugreifen.'},
 standhaft:{n:'Standhaft',up:'def',down:'spa',desc:'Wankt nicht, grübelt nicht.'},
 dickfellig:{n:'Dickfellig',up:'def',down:'spd',desc:'Schläge prallen ab, Worte nicht.'},
 bedächtig:{n:'Bedächtig',up:'def',down:'spe',desc:'Überlegt jeden Schritt zweimal.'},
 grüblerisch:{n:'Grüblerisch',up:'spa',down:'atk',desc:'Denkt viel, rauft wenig.'},
 funkelnd:{n:'Funkelnd',up:'spa',down:'def',desc:'Strahlt vor Ideen, vergisst die Deckung.'},
 feurig:{n:'Feurig',up:'spa',down:'spd',desc:'Brennt für alles – und verbrennt sich.'},
 versonnen:{n:'Versonnen',up:'spa',down:'spe',desc:'Langsam, aber voller Einfälle.'},
 gütig:{n:'Gütig',up:'spd',down:'atk',desc:'Hat ein großes Herz und wenig Biss.'},
 empfindsam:{n:'Empfindsam',up:'spd',down:'def',desc:'Spürt viel, hält wenig aus.'},
 geduldig:{n:'Geduldig',up:'spd',down:'spa',desc:'Wartet ab, was kommt.'},
 würdevoll:{n:'Würdevoll',up:'spd',down:'spe',desc:'Hat es nie eilig.'},
 flatterhaft:{n:'Flatterhaft',up:'spe',down:'atk',desc:'Überall und nirgends.'},
 waghalsig:{n:'Waghalsig',up:'spe',down:'def',desc:'Schnell wie der Wind, dünn wie Papier.'},
 quirlig:{n:'Quirlig',up:'spe',down:'spa',desc:'Kann keine Sekunde stillsitzen.'},
 rastlos:{n:'Rastlos',up:'spe',down:'spd',desc:'Immer auf dem Sprung.'}};
const NATURE_KEYS=Object.keys(NATURES);
const SIX_L={hp:'KP',atk:'Angriff',def:'Verteidigung',spa:'Spezial-Angriff',spd:'Spezial-Verteidigung',spe:'Initiative'};

// ---------- Werte ----------
// KP: ⌊(2·Basis + AW + ⌊TW/4⌋)·Lv/100⌋ + Lv + 10 · sonst: ⌊(⌊(2·Basis + AW + ⌊TW/4⌋)·Lv/100⌋ + 5) · Wesenszug(1,1 / 0,9)⌋
function calcStat(base,iv,ev,lv,nature,key){const core=Math.floor((2*base+(iv|0)+Math.floor((ev|0)/4))*lv/100);
 if(key==='hp')return core+lv+10;const N=NATURES[nature];let v=core+5;if(N&&N.up&&N.up!==N.down){if(N.up===key)v*=1.1;else if(N.down===key)v*=.9;}return Math.floor(v);}
const SIXI={hp:0,atk:1,def:2,spa:3,spd:4,spe:5};
function stat6(m,k){const b=base6(MONS[m.s]);return calcStat(b[SIXI[k]],m.iv?m.iv[k]:0,m.ev?m.ev[k]:0,m.l,m.nature,k);}
function stat(m,k){if(k==='spd')k='spe';else if(k==='spv')k='spd';return stat6(m,SIXI[k]!=null?k:'hp');}

// (Basiswerte und Lernlisten aller Arten stehen seit dem Dex-Kanon direkt in 01-data.js)

// ---------- Fähigkeiten je Art: 1–2 normale + 1 verborgene (aus Element der Linie abgeleitet) ----------
const ABIL_POOL={glut:['glutkern','flimmer','sonnenglut'],flut:['quellherz','regentanz','morgentau'],flora:['sporenpelz','tiefwurzel','dornenkleid'],volt:['funkenhaut','blitzfang','sturmsinn'],
 fels:['felspanzer','sandschleier','kraftprotz'],frost:['frosthauch','schneemantel','klarblick'],boe:['sturmsinn','schwarmgeist','flinkzunge'],schatten:['schattenmantel','trotzkopf','kraftprotz'],
 lumen:['lichtschild','scharfsinn','wesensgleich'],kern:['zaeh','wachsam','flinkzunge']};
const HIDDEN_POOL={glut:['sonnenruf','glutfang'],flut:['regenruf','quellruhe'],flora:['bluehruf','regen'],volt:['spannruf','resoseele'],fels:['sandruf','zaeh'],frost:['schneeruf','felspanzer'],
 boe:['resoseele','flinkzunge'],schatten:['trotzkopf','resoseele'],lumen:['resoseele','quellruhe'],kern:['gluecks','resoseele']};
// Legenden/Mythische tragen hiddenAbility direkt in MONS (01-data.js); hier nur Fallback je Kanon-ID
const LEGEND_HIDDEN={};
function lineRoot(id){const par={};for(let i=1;i<MONS.length;i++){const e=MONS[i]&&MONS[i].ev;if(e&&e.to)par[e.to]=i;}let r=id,n=0;while(par[r]&&n++<5)r=par[r];return r;}
function assignAbilities(){for(let i=1;i<MONS.length;i++){const M=MONS[i];if(!M)continue;const R=MONS[lineRoot(i)]||M,rid=lineRoot(i),t=R.t[R.t.length-1];
 if(!M.abilities){const pool=ABIL_POOL[t]||ABIL_POOL.kern;let a2=pool[rid%pool.length];if(a2===M.ab)a2=pool[(rid+1)%pool.length];M.abilities=M.legend?[M.ab]:[M.ab,a2];}
 if(!M.hiddenAbility){const hp=HIDDEN_POOL[R.t[0]]||HIDDEN_POOL.kern;let h=LEGEND_HIDDEN[i]||hp[rid%hp.length];if(M.abilities.includes(h))h=hp[(rid+1)%hp.length];M.hiddenAbility=h;}
 if(M.genderRatio===undefined&&M.legend)M.genderRatio=-1;}}
assignAbilities();

// ---------- Kreatur: Initialisierung & Migration ----------
function randIv(){const o={};for(const k of SIX)o[k]=Math.random()*32|0;return o;}
function rollGender(s){const r=MONS[s].genderRatio;if(r===-1||r===null||MONS[s].legend&&r===undefined)return null;return Math.random()<(r??.5)?'m':'w';}
function initMon(m,fresh){if(!m||!MONS[m.s])return m;const M=MONS[m.s],L=M.abilities||[M.ab],old=fresh?0:stat(m,'hp');
 if(!m.iv||typeof m.iv!=='object')m.iv=randIv();for(const k of SIX)if(m.iv[k]==null)m.iv[k]=Math.random()*32|0;
 if(!m.ev||typeof m.ev!=='object')m.ev={};for(const k of SIX)m.ev[k]=Math.max(0,Math.min(252,m.ev[k]|0));
 if(!m.nature||!NATURES[m.nature])m.nature=fresh?NATURE_KEYS[Math.random()*NATURE_KEYS.length|0]:'ausgeglichen';
 if(!m.ability||!ABIL[m.ability])m.ability=fresh?L[Math.random()*L.length|0]:(L.includes(m.ab)?m.ab:M.ab);
 if(m.hiddenAbility==null)m.hiddenAbility=false;if(m.gender===undefined)m.gender=rollGender(m.s);if(m.shiny==null)m.shiny=false;else m.shiny=!!m.shiny;
 if(m.friendship==null)m.friendship=70;if(m.heldItem===undefined)m.heldItem=null;if(!m.capsule)m.capsule='kapsel';if(m.form===undefined)m.form=null;if(m.status===undefined)m.status=null;
 if(!m.metAt)m.metAt={map:(typeof G!=='undefined'&&G&&G.map)||null,l:m.l,date:new Date().toISOString().slice(0,10)};
 if(!fresh&&old>0){const nw=stat(m,'hp');m.hp=m.hp>=old?nw:Math.max(m.hp>0?1:0,Math.round(m.hp/old*nw));}return m;}
function migrateMon(m){return initMon(m,false);}
// Wrapper: neue Kreaturen vollständig (zufälliger Wesenszug, Fähigkeit, AW)
const _mk21=mk;mk=function(s,l){const m=_mk21(s,l);initMon(m,true);m.hp=stat(m,'hp');return m;};

// Neue Spielstände sind bereits im Dex-Kanon (keine ID-Umstellung beim ersten migrateSave)
const _fresh21=freshG;freshG=function(p){const g=_fresh21(p);g.dexKanon=1;g.rivals={rayan:{starter:null},mira:{starter:null}};return g;};

// ---------- Kreaturenbox: 20 Boxen × 30 Plätze ----------
const BOXN=20,BOXS=30;
function normalizeBox(g){g=g||G;if(!g)return;const b=Array.isArray(g.box)?g.box:[];const ok=b.length===BOXN&&b.every(x=>Array.isArray(x)&&x.length===BOXS);if(ok)return;
 const flat=[];for(const x of b){if(Array.isArray(x))x.forEach(m=>{if(m&&m.s)flat.push(m);});else if(x&&x.s)flat.push(x);}
 const nb=Array.from({length:BOXN},()=>Array(BOXS).fill(null));
 // Bestehende Plätze erhalten, lose Einträge (alte Liste / push) auffüllen
 const placed=new Set();b.forEach((x,i)=>{if(Array.isArray(x)&&i<BOXN)x.forEach((m,j)=>{if(m&&m.s&&j<BOXS){nb[i][j]=m;placed.add(m);}});});
 g.box=nb;for(const m of flat)if(!placed.has(m))boxAdd(m,g);}
function boxAll(g){g=g||G;if(!g||!g.box)return[];const o=[];for(const x of g.box){if(Array.isArray(x))x.forEach(m=>{if(m)o.push(m);});else if(x&&x.s)o.push(x);}return o;}
function boxAdd(m,g){g=g||G;if(!Array.isArray(g.box)||g.box.length!==BOXN||!Array.isArray(g.box[0]))normalizeBox(g);for(let i=0;i<BOXN;i++)for(let j=0;j<BOXS;j++)if(!g.box[i][j]){g.box[i][j]=m;return{b:i,s:j};}return null;}
function boxRemove(m,g){g=g||G;for(const x of g.box||[])if(Array.isArray(x)){const j=x.indexOf(m);if(j>=0){x[j]=null;return true;}}return false;}

// ---------- Spielstand-Migration ----------
// ---------- Dex-Kanon: alte Art-IDs (1–41, inkl. Erweiterung 31–41) → Kanon-Nummern (Agent A1, Tabelle docs/dex-kanon.md) ----------
const ID_MAP={1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:59,11:60,12:112,13:113,14:72,15:73,16:57,17:58,18:75,19:76,20:31,21:32,22:61,23:62,24:90,25:91,26:37,27:38,28:142,29:147,30:144,
 31:25,32:26,33:22,34:23,35:115,36:34,37:11,38:117,39:53,40:122,41:33};
function kanonId(s){return ID_MAP[s]||s;}
// Einmalig je Spielstand (g.dexKanon): Team, Box, Eier, Dex (gesehen/gefangen/neu), Glanz-Serie, Starter
function migrateKanon(g){if(!g||g.dexKanon)return g;const fix=m=>{if(m&&typeof m.s==='number'&&ID_MAP[m.s])m.s=ID_MAP[m.s];};
 (g.team||[]).forEach(fix);for(const x of g.box||[]){if(Array.isArray(x))x.forEach(fix);else fix(x);}(g.eggs||[]).forEach(fix);
 const rk=o=>{if(!o||typeof o!=='object')return o;const n={};for(const k in o)n[ID_MAP[k]||k]=o[k];return n;};
 if(g.dex){g.dex.seen=rk(g.dex.seen)||{};g.dex.caught=rk(g.dex.caught)||{};}if(g.dexNew)g.dexNew=rk(g.dexNew);
 if(g.shinyChain&&ID_MAP[g.shinyChain.s])g.shinyChain.s=ID_MAP[g.shinyChain.s];if(ID_MAP[g.starter])g.starter=ID_MAP[g.starter];
 g.dexKanon=1;return g;}
// Rivalen (Nutzer 13:55): Spieler wählt Funki (001), Plippi (004) oder Knospi (007); Rayan bevorzugt Glut, Mira Flut – sie nehmen die beiden anderen
const STARTERS=[1,4,7];
function rivalStarters(p){const rest=STARTERS.filter(x=>x!==p);const rayan=rest.includes(1)?1:rest.find(x=>x!==4),mira=rest.find(x=>x!==rayan);return{rayan:{starter:rayan},mira:{starter:mira}};}
function ensureRivals(g){if(!g)return g;if(!g.starter&&g.flags&&g.flags.starter){const L=[...(g.team||[]),...boxAll(g)];for(const m of L){const r=typeof lineRoot==='function'?lineRoot(m.s):m.s;if(STARTERS.includes(r)){g.starter=r;break;}}}
 if(!g.rivals||typeof g.rivals!=='object')g.rivals={rayan:{starter:null},mira:{starter:null}};
 if(g.starter&&!g.rivals.rayan.starter)Object.assign(g.rivals,rivalStarters(g.starter));return g;}
function migrateSave(g){if(!g)return g;migrateKanon(g);g.team=(g.team||[]).filter(m=>m&&MONS[m.s]);g.team.forEach(migrateMon);normalizeBox(g);boxAll(g).forEach(migrateMon);
 if(!Array.isArray(g.boxNames)||g.boxNames.length<BOXN){const o=g.boxNames||[];g.boxNames=Array.from({length:BOXN},(_,i)=>o[i]||'Box '+(i+1));}
 for(const[k,v]of[['eggs',[]],['medals',{}],['daily',{}],['weather',{}],['contests',{}],['tower',{}],['foundItems',null],['defeatedTrainers',null]])if(g[k]==null&&v!==null)g[k]=v;
 g.flags=g.flags||{};
 if(!Array.isArray(g.defeatedTrainers)){g.defeatedTrainers=[];try{for(const id in NPCS)for(const n of NPCS[id])if(n.t==='trainer'&&g.flags[n.flag]&&!g.defeatedTrainers.includes(n.flag))g.defeatedTrainers.push(n.flag);}catch(e){}}
 if(!Array.isArray(g.foundItems)){g.foundItems=[];try{for(const id in NPCS)for(const n of NPCS[id])if(n.t==='item'&&g.flags[n.flag]&&!g.foundItems.includes(n.flag))g.foundItems.push(n.flag);}catch(e){}}
 if(typeof g.playtime!=='number')g.playtime=0;if(!g.shinyChain||typeof g.shinyChain!=='object')g.shinyChain={s:0,n:0};
 if(g.talisman==null)g.talisman=!!(g.bag&&g.bag.schimmertalisman>0);if(g.steps==null)g.steps=0;ensureRivals(g);g.ver=Math.max(g.ver|0,4);return g;}
// ===== B2 Story (Agent B2): Spielstand-Felder der Hauptgeschichte =====
// Default: G.story={ch:0,help:{},seen:{}}. Neue Story-Flags (s1_…–s8_…, sf_…, se_…, badge_boe/glut/fels/lumen, sq_… der Nebenmissionen) sind ungesetzt = nicht erledigt.
// migrateStory (27-story.js) leitet einmalig erledigte Schritte aus altem Fortschritt ab (badge1…champion) und benennt alte Orden in Medaillen um.
const _migB2=migrateSave;migrateSave=function(g){const r=_migB2(g);if(g){if(!g.story||typeof g.story!=='object')g.story={ch:0,help:{},seen:{}};if(typeof migrateStory==='function')migrateStory(g);}return r;};
// ===== Ende B2 =====
// ===== B1 Figuren (Agent B1): Spielstand-Felder der Figuren =====
// G.figs={met:{<figur>:1}, bond:{<figur>:0–100}} · G.outfit.body 'held'|'heldin' (aus alter Frisur abgeleitet: zopf/lang/dutt → heldin). Idempotent.
function migrateFigures(g){if(!g)return g;if(!g.figs||typeof g.figs!=='object')g.figs={met:{},bond:{}};if(!g.figs.met||typeof g.figs.met!=='object')g.figs.met={};if(!g.figs.bond||typeof g.figs.bond!=='object')g.figs.bond={};
 if(g.outfit&&typeof g.outfit==='object'&&g.outfit.body!=='held'&&g.outfit.body!=='heldin')g.outfit.body=['zopf','lang','dutt'].includes(g.outfit.hair)?'heldin':'held';return g;}
const _migB1=migrateSave;migrateSave=function(g){const r=_migB1(g);migrateFigures(g);return r;};
// ===== Ende B1 =====
const _start21=start;start=function(){migrateSave(G);return _start21.apply(this,arguments);};
const _save21=save;save=function(){if(G)normalizeBox(G);return _save21.apply(this,arguments);};
if(typeof document!=='undefined'&&typeof setInterval==='function')setInterval(()=>{if(G&&mode!=='title'&&!document.hidden)G.playtime=(G.playtime|0)+1;},1000);

// ---------- Glanzform: 1:4096, Fangserie & Talisman ----------
function shinyRate(){let r=1/4096;const n=(G&&G.shinyChain&&G.shinyChain.n)|0;r*=n>=30?4:n>=20?3:n>=10?2:1;if(G&&(G.talisman||(G.bag&&G.bag.schimmertalisman>0)))r*=3;return r;}
function shinyRoll(){return Math.random()<shinyRate();}
const _addRoamer21=addRoamer;addRoamer=function(){const n=ROAM.list.length;const r0=_addRoamer21.apply(this,arguments);if(ROAM.list.length>n){const r=ROAM.list[ROAM.list.length-1];r.shiny=shinyRoll();r.o=Object.assign({},r.o||{},{shiny:r.shiny});}return r0;};
// Nach erfolgreichem Fang (14 ruft es; 24-capture.js sollte es ebenfalls aufrufen)
function registerCatch(m,k){if(!m)return;migrateMon(m);m.capsule=k||m.capsule||'kapsel';m.metAt={map:G.map,l:m.l,date:new Date().toISOString().slice(0,10)};
 const c=G.shinyChain=G.shinyChain||{s:0,n:0};if(c.s===m.s)c.n++;else{c.s=m.s;c.n=1;}}

// ---------- Freundschaft 0–255 ----------
function addFriend(m,n){if(!m)return 0;m.friendship=Math.max(0,Math.min(255,(m.friendship??70)+n));return m.friendship;}
function friendLabel(f){return f>=250?'Unzertrennlich':f>=200?'Eng verbunden':f>=150?'Vertraut':f>=100?'Freundlich':f>=50?'Neutral':'Distanziert';}
const _onStep21=onStep;onStep=function(){const r=_onStep21.apply(this,arguments);try{if(G){G.steps=(G.steps|0)+1;if(G.steps%128===0)G.team.forEach((m,i)=>{if(m.hp>0)addFriend(m,i===0?2:1);});}}catch(e){}return r;};
const _healAll21=healAll;healAll=function(){const r=_healAll21.apply(this,arguments);try{if(G&&mode!=='battle')G.team.forEach(m=>addFriend(m,1));}catch(e){}return r;};
const _healMon21=healMon;healMon=function(m){const r=_healMon21.apply(this,arguments);if(m){m.status=null;m.conf=0;}return r;};

// ---------- Kampfstart-Sequenz registrieren (Ablauf in 14-battle.js) ----------
SEQ.battleStart=seqBattleStart;

// ---------- Chronik: Team/Box auf 20×30 umstellen, Werte-Infos, neue Items in der Tasche ----------
function rTeam(el){normalizeBox(G);const g=document.createElement('div');g.className='grid';G.team.forEach((m,i)=>g.appendChild(card(m,i,false)));el.appendChild(g);const L=boxAll();
 const h=document.createElement('h3');h.innerHTML='Kreaturenbox <small>'+L.length+' Kreaturen</small>';el.appendChild(h);
 if(!L.length)el.insertAdjacentHTML('beforeend',empty('box','Die Kreaturenbox ist leer','Ist dein Team voll, landen neu gefangene Kreaturen hier.'));
 const g2=document.createElement('div');g2.className='grid';L.forEach((m,i)=>g2.appendChild(card(m,i,true)));el.appendChild(g2);}
const _rDetail21=rDetail;rDetail=function(el){if(!sel||!sel.box)return _rDetail21(el);const L=boxAll(),m=L[sel.i];if(!m){sel=null;return renderMenu();}
 // Original rendern, dann Box-Aktion ersetzen
 const keep=G.box;G.box=L;try{_rDetail21(el);}finally{G.box=keep;}const act=el.querySelector('.acts');if(!act)return;const bs=act.querySelectorAll('button');const b=bs[bs.length-1];
 if(b){b.onclick=()=>{if(G.team.length>=6)return toast('Das Team ist voll');boxRemove(m);G.team.push(m);sel=null;renderMenu();};b.disabled=G.team.length>=6;}};
const STAT6=[['hp','KP'],['atk','Angriff'],['def','Verteidigung'],['spa','Sp.-Angriff'],['spv','Sp.-Vert.'],['spe','Initiative']];
function evoWay(d){const v=d.value,T={day:' tagsüber',night:' nachts'},I=x=>ITEMS[x]?ITEMS[x].n:x;
 switch(d.method){case'level':return'ab Level '+v;case'item':return'mit '+I(v);case'trade':return'durch Tausch'+(v?' (trägt '+I(v)+')':'');case'friendship':return'bei großer Freundschaft'+(T[v&&v.time]||'');
  case'location':return'an einem besonderen Ort';case'held':return'wenn sie '+I(v.item)+' trägt'+(T[v.time]||'');case'move':return'wenn sie '+(MOVES[v]?MOVES[v][0]:v)+' kennt';
  case'gender':return'als '+(v.g==='w'?'Weibchen':'Männchen')+' ab Level '+(v.l||1);case'special':return'durch besonderes Training';}return'';}
const _rPane21=rPane;rPane=function(el,m){_rPane21(el,m);try{if(typeof dtab==='undefined'||!m)return;const M=MONS[m.s],N=NATURES[m.nature]||NATURES.ausgeglichen,A=ABIL[m.ability||M.ab]||ABIL[M.ab];
 if(dtab==='stats'){const v=STAT6.map(([k])=>stat(m,k)),top=Math.max(...v)*1.15,mk=k=>{const kk=k==='spv'?'spd':k;return N.up===kk?' <b style="color:#2e9e5b" title="Wesenszug: erhöht">▲</b>':N.down===kk?' <b style="color:#d0553f" title="Wesenszug: gesenkt">▼</b>':'';};
  const f=m.friendship|0;
  el.innerHTML='<div class="stats">'+STAT6.map(([k,l],i)=>`<div class="srow"><span>${l}${mk(k)}</span><div class="sbar"><i style="width:${v[i]/top*100}%"></i></div><b>${v[i]}</b></div>`).join('')+'</div>'+
   `<p class="muted">Wesenszug <b>${N.n}</b>${N.up?` (${SIX_L[N.up]} ▲ · ${SIX_L[N.down]} ▼)`:' (neutral)'} · ${N.desc}</p>`+
   `<p class="abil"><b>${A[0]}</b>${m.hiddenAbility?' ✦':''} – ${A[1]}</p>`+
   `<p class="muted">Freundschaft <b>${friendLabel(f)}</b> (${f}/255)${m.heldItem&&ITEMS[m.heldItem]?' · trägt '+ITEMS[m.heldItem].n:''}</p>`;}
 else if(dtab==='info'){const ab=el.querySelector('.abil');if(ab)ab.innerHTML=`<b>${A[0]}</b>${m.hiddenAbility?' ✦':''} – ${A[1]}`;
  const L=evoList(m.s).filter(d=>d.method!=='level'&&d.method!=='item'&&resolveInto(d.into));
  if(L.length)el.insertAdjacentHTML('beforeend',`<p class="muted">Weitere Wege: ${L.map(d=>MONS[resolveInto(d.into)].n+' '+evoWay(d)).join(' · ')}</p>`);}}catch(e){}};
// „Ins Lager“ (15-ui pusht in G.box): beim nächsten Rendern einsortieren
const _renderMenu21=renderMenu;renderMenu=function(){if(G&&G.box&&G.box.some(x=>x&&!Array.isArray(x)))normalizeBox(G);return _renderMenu21.apply(this,arguments);};
function rBox(el){const n=boxAll().length;el.insertAdjacentHTML('beforeend',`<div class="soon"><div class="soonArt" aria-hidden="true">${EMPTY.box}</div><b>Kreaturenbox</b><p class="muted">20 Boxen mit je 30 Plätzen. Ansicht mit Namen, Hintergründen und Sortieren folgt.</p><span class="pill2">${n} Kreaturen in der Box</span></div>`);
 const b=document.createElement('button');b.className='pill';b.textContent='Zur Box im Team';b.onclick=()=>{tab='team';renderMenu();};el.querySelector('.soon').appendChild(b);}
const NEWK=['abil','hidden','friend','cure','held'];
const _rBag21=rBag;rBag=function(el){_rBag21(el);const ks=Object.keys(ITEMS).filter(k=>G.bag[k]>0&&NEWK.includes(ITEMS[k].k));if(!ks.length)return;if(el.querySelector('.empty'))el.innerHTML='';
 el.insertAdjacentHTML('beforeend','<h3>Pflege & Ausrüstung</h3>');ks.forEach(x=>{const it=ITEMS[x],r=document.createElement('div');r.className='item';r.innerHTML=`<div><b>${it.n}</b> <small>×${G.bag[x]}</small><p class="muted">${it.d}</p></div>`;
  const b=document.createElement('button');b.textContent=it.k==='held'?'Geben':'Benutzen';b.onclick=()=>chooseFor21(x);r.appendChild(b);el.appendChild(r);});};
function chooseFor21(k){const it=ITEMS[k],el=$('#mBody');el.innerHTML='<h3>'+it.n+' – für wen?</h3>';const g=document.createElement('div');g.className='grid';
 G.team.forEach((m,i)=>{const M=MONS[m.s],ok=it.k==='abil'?(M.abilities||[]).length>1&&!m.hiddenAbility:it.k==='hidden'?m.ability!==M.hiddenAbility:it.k==='cure'?!!m.status:true;
  const c=card(m,i,false);c.disabled=!ok;c.onclick=()=>{toast(useItem(k,m));renderMenu();};g.appendChild(c);});
 el.appendChild(g);const b=document.createElement('button');b.className='back';b.textContent='Zurück';b.onclick=renderMenu;el.appendChild(b);}
// Neue Waren in vorhandenen Läden
try{const add=(id,ks)=>{const I=INTERIORS[id];if(I&&I.stock)ks.forEach(k=>{if(ITEMS[k]&&!I.stock.includes(k))I.stock.push(k);});};
 add('laden_kupfer',['honigtau','weckkraut']);add('laden_brise',['honigtau','weckkraut','flutsiegel','florasiegel']);add('laden_frost',['sonnbeere','flinkfeder','quellmoos','frostsiegel','glutsiegel']);
 add('laden_schatt',['wandelharz','sonnbeere','zaehwurz','kraftreif','schattensiegel','lumensiegel','resokristall']);add('laden_moewe',['boesiegel','voltsiegel','felssiegel','kernsiegel','weckkraut']);}catch(e){}

// ---------- Doppelkampf: Partner-Anzeige an den Werte-Chips ----------
const _updB21=updB;updB=function(){_updB21.apply(this,arguments);try{if(!B||!B.double)return;const pc=m=>`<span class="sc ${m.hp>0?'up':'dn'}" title="Partner">${mname(m)} <b>${Math.round(Math.max(0,m.hp)/stat(m,'hp')*100)}%</b></span>`;
 const of=B.foes.filter(m=>m&&m!==B.foe[B.fi]),om=B.mine.map(i=>G.team[i]).filter(m=>m&&m!==G.team[B.mi]);
 if(of.length)$('#bFoeT').insertAdjacentHTML('beforeend',of.map(pc).join(''));if(om.length)$('#bMeT').insertAdjacentHTML('beforeend',om.map(pc).join(''));}catch(e){}};
