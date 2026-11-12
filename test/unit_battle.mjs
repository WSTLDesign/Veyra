// Unit-Tests Kampfkern & Kreaturen-Tiefe (node, ohne Browser): node test/unit_battle.mjs
import { loadVeyra } from '../tools/balance.mjs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const eq = (a, b, m) => { if (a !== b) throw new Error((m || '') + ' erwartet ' + JSON.stringify(b) + ', erhalten ' + JSON.stringify(a)); };
const near = (a, b, tol, m) => { if (Math.abs(a - b) > tol) throw new Error((m || '') + ' erwartet ≈' + b + ', erhalten ' + a); };
run(`SET.diff='normal';G=freshG({});G.time=12*60;cur={id:'route1',theme:'meadow'};
globalThis.fix=function(s,l,o){const m=mk(s,l);m.iv={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};m.ev={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};m.nature='ausgeglichen';m.ability=(o&&o.ab)||'flink';m.status=null;m.friendship=70;m.heldItem=null;m.hp=stat(m,'hp');return m;};
globalThis.mkB=function(me,foes,o){G.team=[me];const b={tr:null,foe:foes,fi:0,mi:0,part:new Set([0]),double:!!(o&&o.double),foes:o&&o.double?foes.slice(0,2):[foes[0]],mine:[0],stm:new Map(),dead:new Set(),res:{me:0,foe:0},resOn:{},weather:(o&&o.wx)||null,wxT:Infinity,field:null,rt:false,sim:true};defineSt(b);B=b;return b;};`);

// ---------- calcStat ----------
t('calcStat: Formel (Basis 100, AW 31, TW 252, Lv 50)', () => { eq(run(`calcStat(100,31,252,50,'ausgeglichen','atk')`), 152); eq(run(`calcStat(100,31,252,50,'ausgeglichen','hp')`), 207); });
t('calcStat: Wesenszug ±10 %', () => { eq(run(`calcStat(100,31,252,50,'ungestüm','atk')`), 167); eq(run(`calcStat(100,31,252,50,'ungestüm','def')`), 136); eq(run(`calcStat(100,31,252,50,'beständig','atk')`), 152); });
t('NATURES: 25 Wesenszüge, 5 neutral, alle Paare eindeutig', () => { const r = run(`(()=>{const k=Object.keys(NATURES),neu=k.filter(x=>!NATURES[x].up),pairs=new Set(k.filter(x=>NATURES[x].up).map(x=>NATURES[x].up+'>'+NATURES[x].down));return[k.length,neu.length,pairs.size,k.includes('ausgeglichen')]})()`); eq(r[0], 25); eq(r[1], 5); eq(r[2], 20); eq(r[3], true); });
t('stat(m,"spd") bleibt Alias für Initiative', () => run(`(()=>{const m=fix(1,20);return stat(m,'spd')===stat6(m,'spe')&&stat(m,'spv')===stat6(m,'spd')})()`));
t('base6: Arten 1–40 mit 6 Basiswerten', () => run(`(()=>{for(let i=1;i<=40;i++){const b=base6(MONS[i]);if(!MONS[i].b6||b.length!==6||b.some(x=>!(x>0)))return false;}return true})()`));

// ---------- TYPE_CHART ----------
t('TYPE_CHART: 11×11 vollständig (inkl. Ursprung), Werte ∈ {0, ½, 1, 2}', () => run(`(()=>{const K=Object.keys(TYPES);if(K.length!==11||!K.includes('ursprung'))return false;return K.every(a=>K.every(d=>[0,.5,1,2].includes(TYPE_CHART[a][d])))})()`));
t('TYPE_CHART: deckt SE/NVE/IMM ab, eff() = Produkt', () => run(`(()=>{const K=Object.keys(TYPES);for(const a of K){for(const d of SE[a])if(TYPE_CHART[a][d]!==2)return false;for(const d of NVE[a])if(TYPE_CHART[a][d]!==.5)return false;for(const d of IMM[a]||[])if(TYPE_CHART[a][d]!==0)return false;
 for(const d1 of K)for(const d2 of K)if(d1!==d2&&eff(a,[d1,d2])!==(TYPE_CHART[a][d1]===0||TYPE_CHART[a][d2]===0?0:TYPE_CHART[a][d1]*TYPE_CHART[a][d2]))return false;}return true})()`));
t('TYPE_CHART: Symmetrie – gegenseitige Immunität Kern↔Schatten, kein Typ ist SE und NVE zugleich', () => run(`(()=>{if(TYPE_CHART.kern.schatten!==0||TYPE_CHART.schatten.kern!==0)return false;const K=Object.keys(TYPES);return K.every(a=>!SE[a].some(d=>NVE[a].includes(d)))&&K.filter(d=>d!=='ursprung').every(d=>K.some(a=>TYPE_CHART[a][d]!==1))&&K.every(a=>TYPE_CHART.ursprung[a]===1&&TYPE_CHART[a].ursprung===1)})()`));

// ---------- calcDamage ----------
t('calcDamage: Beispielwert (Funki Lv 20 Funken → Flausch Lv 20)', () => {
  const r = run(`(()=>{const a=fix(1,20),d=fix(59,20);mkB(a,[d]);const M=MOVES.funken,A=stat6(a,'spa'),D=stat6(d,'spd');const exp=Math.floor((((2*20/5+2)*40*A/D)/50+2)*DMG_SCALE*1.5*1);const r=calcDamage(a,d,'funken',{B,crit:false,rnd:1});return[r.dmg,exp,r.eff,r.stab]})()`);
  eq(r[0], r[1], 'Schaden'); eq(r[2], 1); eq(r[3], 1.5); });
t('calcDamage: Effektivität ×2 / ×0,5 / Immunität', () => { const r = run(`(()=>{const a=fix(1,30),f=fix(7,30),w=fix(4,30),k=fix(59,30);mkB(a,[f]);const o={B,crit:false,rnd:1};return[calcDamage(a,f,'funken',o).eff,calcDamage(a,w,'funken',o).eff,calcDamage(fix(113,30),fix(57,30),'zitter',o).eff,calcDamage(fix(113,30),fix(57,30),'zitter',o).dmg]})()`); eq(r[0], 2); eq(r[1], .5); eq(r[2], 0); eq(r[3], 0); });
t('calcDamage: Volltreffer ×1,5, phys/spez getrennt', () => { const r = run(`(()=>{const a=fix(1,30),d=fix(59,30);mkB(a,[d]);const n=calcDamage(a,d,'glutbiss',{B,crit:false,rnd:1}).dmg,c=calcDamage(a,d,'glutbiss',{B,crit:true,rnd:1}).dmg;const st=stOf(B,d);st.def=6;const p=calcDamage(a,d,'glutbiss',{B,crit:false,rnd:1}).dmg,s=calcDamage(a,d,'funken',{B,crit:false,rnd:1}).dmg;st.def=0;return[n,c,p,s,calcDamage(a,d,'funken',{B,crit:false,rnd:1}).dmg]})()`);
  near(r[1] / r[0], 1.5, .12, 'Krit'); if (!(r[2] < r[0])) throw new Error('Ver +6 senkt phys. Schaden nicht'); eq(r[3], r[4], 'Ver darf Spez nicht ändern'); });

// ---------- Wetter ----------
t('Wetter: Sonne Glut ×1,5, Regen Glut ×0,5, Feld Blütenwiese Flora ×1,3', () => { const r = run(`(()=>{const a=fix(1,30),d=fix(59,30),o=()=>({B,crit:false,rnd:1});mkB(a,[d]);const n=calcDamage(a,d,'brunst',o()).dmg;B.weather='sonne';const s=calcDamage(a,d,'brunst',o()).dmg;B.weather='regen';const r2=calcDamage(a,d,'brunst',o()).dmg;B.weather=null;const f=fix(7,30),n2=calcDamage(f,d,'blattw',o()).dmg;B.field={k:'bluete',name:'Blütenwiese',turns:5};const b=calcDamage(f,d,'blattw',o()).dmg;return[s/n,r2/n,b/n2]})()`);
  near(r[0], 1.5, .06, 'Sonne'); near(r[1], .5, .06, 'Regen'); near(r[2], 1.3, .06, 'Feld'); });
t('Wetter: Sandsturm trifft Nicht-Fels, läuft nach 5 Runden ab', () => { const r = run(`(()=>{const a=fix(1,30),d=fix(57,30);mkB(a,[d]);setWeather(B,'sand',5);const h0=a.hp,h1=d.hp;endOfTurn(B);const lost=h0-a.hp,rock=h1-d.hp;for(let i=0;i<4;i++)endOfTurn(B);return[lost,Math.floor(stat(a,'hp')/16),rock,B.weather]})()`); eq(r[0], r[1]); eq(r[2], 0); eq(r[3], null); });

// ---------- Zugreihenfolge ----------
t('Zugreihenfolge: Priorität vor Initiative, sonst schneller zuerst', () => { const r = run(`(()=>{const slow=fix(57,30),fast=fix(72,30);slow.moves=[{id:'rempler',pp:10},{id:'schnell',pp:10}];fast.moves=[{id:'rempler',pp:10}];mkB(slow,[fast]);
 const a=orderActions(B,[{side:'me',k:'move',mon:slow,i:0},{side:'foe',k:'move',mon:fast,i:0}]),b=orderActions(B,[{side:'me',k:'move',mon:slow,i:1},{side:'foe',k:'move',mon:fast,i:0}]),c=orderActions(B,[{side:'foe',k:'move',mon:fast,i:0},{side:'me',k:'switch',mon:slow,i:0}]);return[a[0].mon===fast,b[0].mon===slow,c[0].k]})()`); eq(r[0], true); eq(r[1], true); eq(r[2], 'switch'); });
t('Zugreihenfolge: Gleichstand zufällig', () => { const r = run(`(()=>{const a=fix(59,30),b=fix(59,30);a.moves=[{id:'rempler',pp:99}];b.moves=[{id:'rempler',pp:99}];mkB(a,[b]);let n=0;for(let i=0;i<400;i++)if(orderActions(B,[{side:'me',k:'move',mon:a,i:0},{side:'foe',k:'move',mon:b,i:0}])[0].mon===a)n++;return n})()`); if (r < 120 || r > 280) throw new Error('nicht zufällig: ' + r); });

// ---------- Zustände ----------
t('STATUS: 5 Zustände + Benommenheit mit {n,c,short,onTurn,canAct}', () => run(`['sengen','raureif','starre','schlummer','sporen','wirr'].every(k=>STATUS[k]&&STATUS[k].n&&STATUS[k].c&&STATUS[k].short&&typeof STATUS[k].onTurn==='function'&&typeof STATUS[k].canAct==='function')`));
t('Status: Versengt 1/16 KP & phys −30 %, Glut immun', () => { const r = run(`(()=>{const a=fix(59,30),d=fix(113,30);mkB(a,[d]);const n=calcDamage(a,d,'rempler',{B,crit:false,rnd:1}).dmg;applyStatus(B,a,'sengen');const s=calcDamage(a,d,'rempler',{B,crit:false,rnd:1}).dmg;const h=a.hp;endOfTurn(B);const g=fix(1,30);const im=applyStatus(B,g,'sengen');return[a.status,h-a.hp,Math.floor(stat(a,'hp')/16),s/n,g.status]})()`);
  eq(r[0], 'sengen'); eq(r[1], r[2]); near(r[3], .7, .06); eq(r[4], null); });
t('Status: Schlummer verhindert Handeln, Erstarrt senkt Initiative', () => { const r = run(`(()=>{const a=fix(59,30),d=fix(113,30);mkB(a,[d]);applyStatus(B,a,'schlummer');a.statusT=2;const ev=execMove(B,'me',a,0,d);const sp0=speedOf(B,d);applyStatus(B,d,'starre');return[ev.some(e=>e.k==='hit'),speedOf(B,d)/sp0,d.status]})()`); eq(r[0], false); near(r[1], .6, .01); eq(r[2], 'starre'); });
t('Statusattacke: Sporenwolke setzt Sporen (Flora immun)', () => { const r = run(`(()=>{const a=fix(7,30),d=fix(59,30);a.moves=[{id:'sporenwolke',pp:10}];mkB(a,[d]);let ok=0;for(let i=0;i<40&&!d.status;i++)execMove(B,'me',a,0,d);const f=fix(8,30);applyStatus(B,f,'sporen');return[d.status,f.status]})()`); eq(r[0], 'sporen'); eq(r[1], null); });
t('Werteänderungen begrenzt auf −6..+6', () => { const r = run(`(()=>{const a=fix(59,30),d=fix(113,30);mkB(a,[d]);for(let i=0;i<9;i++)changeStage(B,a,'atk',2,a);const up=stOf(B,a).atk;for(let i=0;i<20;i++)changeStage(B,a,'atk',-1,d);return[up,stOf(B,a).atk,B.st.me.atk]})()`); eq(r[0], 6); eq(r[1], -6); eq(r[2], -6); });

// ---------- Resonanz ----------
t('Resonanz: lädt durch Schaden, 3 Züge Elementform +30 % mit Typ-Zusatz', () => { const r = run(`(()=>{const a=fix(1,30),d=fix(59,30);a.moves=[{id:'funken',pp:99}];mkB(a,[d]);for(let i=0;i<3;i++){d.hp=stat(d,'hp');execMove(B,'me',a,0,d);}const charged=B.res.me>0;
 B.res.me=1;const n=calcDamage(a,d,'funken',{B,crit:false,rnd:1}).dmg;const u=useResonance('me'),res=resActive(B,'me',a);const w=calcDamage(a,d,'funken',{B,crit:false,rnd:1,res}).dmg;
 const k=fix(112,30),e1=calcDamage(a,fix(7,30),'rempler',{B,crit:false,rnd:1,res}).eff;const again=useResonance('me');for(let i=0;i<3;i++)endOfTurn(B);return[charged,u,!!res,w/n,e1,again,!!resActive(B,'me',a)]})()`);
  eq(r[0], true); eq(r[1], true); eq(r[2], true); near(r[3], 1.3, .07); eq(r[4], 2, 'Typ-Zusatz Glut gegen Flora'); eq(r[5], false); eq(r[6], false); });

// ---------- Doppelkampf & KI ----------
t('Doppelkampf: Flächenattacke trifft beide Gegner (×0,75)', () => { const r = run(`(()=>{const a=fix(4,30),d1=fix(1,28),d2=fix(2,28);a.moves=[{id:'wellen',pp:9}];mkB(a,[d1,d2],{double:true});const h1=d1.hp,h2=d2.hp;let tries=0;while(tries++<20&&(d1.hp===h1||d2.hp===h2)){d1.hp=h1;d2.hp=h2;execMove(B,'me',a,0,d1);}return[d1.hp<h1,d2.hp<h2]})()`); eq(r[0], true); eq(r[1], true); });
t('KI: Stufen 0–3, wählt gültige Aktion, Arenaleiter meidet Wirkungsloses', () => { const r = run(`(()=>{const a=fix(113,30),d=fix(57,30);a.moves=[{id:'zitter',pp:9},{id:'rempler',pp:9}];mkB(d,[a]);const tiers=[];for(const tr of[null,{flag:'tr_x',name:'X'},{flag:'badge1',leader:'Y',name:'L'},{flag:'champion',name:'C'}]){B.tr=tr;tiers.push(aiTier(B));}
 B.tr={flag:'badge1',leader:'Y',name:'L'};let zit=0;for(let i=0;i<50;i++){const c=aiChoose(B,a,'foe');if(c.k==='move'&&c.i===0)zit++;}return[tiers.join(','),zit]})()`); eq(r[0], '0,1,2,3'); eq(r[1], 0); });

// ---------- Trainings-Werte, Glanz, Freundschaft ----------
t('Trainings-Werte: Yield aus Basiswerten, Grenzen 252/510', () => { const r = run(`(()=>{const m=fix(1,30);const y=evYield(73);for(let i=0;i<300;i++)addEv(m,'atk',3);const a=m.ev.atk;for(let i=0;i<300;i++)addEv(m,'spe',3);for(let i=0;i<300;i++)addEv(m,'hp',3);return[y.key,a,m.ev.spe,Object.values(m.ev).reduce((x,c)=>x+c,0)]})()`); eq(r[0], 'spe'); eq(r[1], 252); eq(r[2], 252); eq(r[3], 510); });
t('Glanzform: 1:4096, Fangserie ×2 ab 10, Talisman ×3', () => { const r = run(`(()=>{G.shinyChain={s:0,n:0};G.talisman=false;const a=shinyRate();G.shinyChain={s:5,n:12};const b=shinyRate();G.talisman=true;const c=shinyRate();G.talisman=false;G.shinyChain={s:0,n:0};return[a,b,c]})()`); near(r[0], 1 / 4096, 1e-9); near(r[1], 2 / 4096, 1e-9); near(r[2], 6 / 4096, 1e-9); });
t('Freundschaft 0–255, Fang-Registrierung zählt Serie', () => { const r = run(`(()=>{const m=fix(1,10);addFriend(m,999);const hi=m.friendship;addFriend(m,-999);G.shinyChain={s:0,n:0};G.map='route1';const c1=fix(112,3),c2=fix(112,3);registerCatch(c1,'superk');registerCatch(c2,'kapsel');return[hi,m.friendship,G.shinyChain.n,c1.capsule,!!c1.metAt]})()`); eq(r[0], 255); eq(r[1], 0); eq(r[2], 2); eq(r[3], 'superk'); eq(r[4], true); });
t('Fähigkeiten: ≥ 38 Einträge, je Art 1–2 normale + 1 verborgene, Entwicklungslinie teilt sie', () => { const r = run(`(()=>{let ok=true;for(let i=1;i<=40;i++){const M=MONS[i];if(!M.abilities||M.abilities.length<1||M.abilities.length>2||!ABIL[M.hiddenAbility]||M.abilities.some(a=>!ABIL[a])||M.abilities.includes(M.hiddenAbility))ok=false;}
 return[Object.keys(ABIL).length,ok,MONS[1].abilities.join()===MONS[3].abilities.join()]})()`); if (r[0] < 38) throw new Error('nur ' + r[0]); eq(r[1], true); eq(r[2], true); });
t('MOVES: 9-stellig, Kategorie/Prio/Abklingzeit gesetzt', () => run(`Object.entries(MOVES).every(([k,M])=>M.length===9&&['phys','spez','status'].includes(M[6])&&typeof M[7]==='number'&&M[8]>0&&(M[2]>0)===(M[6]!=='status'))&&MOVES.schnell[7]===1&&MOVES.blitzsprung[7]===1`));

// ---------- Migration ----------
t('migrateMon: alte Kreatur bekommt alle Felder, KP-Anteil bleibt', () => { const r = run(`(()=>{const m={s:2,l:20,xp:8000,hp:30,moves:[{id:'kratzer',pp:10}],known:['kratzer']};const max0=Math.floor(2*58*20/100)+20+10;migrateMon(m);
 const keys=['nature','iv','ev','ability','hiddenAbility','gender','shiny','friendship','heldItem','capsule','metAt'];return[keys.every(k=>k in m),m.nature,m.friendship,m.ability,m.capsule,Math.abs(m.hp/stat(m,'hp')-30/max0)<.05,Object.values(m.iv).every(v=>v>=0&&v<=31),m.hiddenAbility]})()`);
  eq(r[0], true); eq(r[1], 'ausgeglichen'); eq(r[2], 70); eq(r[3], 'notkraft'); eq(r[4], 'kapsel'); eq(r[5], true); eq(r[6], true); eq(r[7], false); });
t('migrateMon: Legende ohne Geschlecht, idempotent', () => { const r = run(`(()=>{const m={s:142,l:50,xp:125000,hp:10,moves:[],known:[]};migrateMon(m);const j=JSON.stringify(m);migrateMon(m);return[m.gender,j===JSON.stringify(m)]})()`); eq(r[0], null); eq(r[1], true); });
t('migrateSave: alte flache Lagerliste → 20×30 Box 1, neue Felder', () => { const r = run(`(()=>{const g={map:'route1',team:[{s:1,l:5,xp:125,hp:20,moves:[],known:[]}],box:[{s:4,l:6,xp:216,hp:10,moves:[],known:[]},{s:7,l:7,xp:343,hp:12,moves:[],known:[]},{s:10,l:3,xp:27,hp:9,moves:[],known:[]}],bag:{},flags:{tr_jonas:1,badge1:1},dex:{seen:{},caught:{}},badges:['Blütenorden']};
 migrateSave(g);const s1=JSON.stringify(g);migrateSave(g);return[g.box.length,g.box.every(b=>b.length===30),g.box[0].filter(Boolean).length,g.box[0][0].s,boxAll(g).length,g.boxNames[0],Array.isArray(g.eggs),typeof g.medals,typeof g.daily,g.playtime,g.defeatedTrainers.includes('tr_jonas')&&g.defeatedTrainers.includes('badge1'),Array.isArray(g.foundItems),typeof g.weather,typeof g.contests,typeof g.tower,!!g.team[0].nature,s1===JSON.stringify(g)]})()`);
  eq(r[0], 20); eq(r[1], true); eq(r[2], 3); eq(r[3], 4); eq(r[4], 3); eq(r[5], 'Box 1'); eq(r[6], true); eq(r[7], 'object'); eq(r[8], 'object'); eq(r[9], 0); eq(r[10], true); eq(r[11], true); eq(r[12], 'object'); eq(r[13], 'object'); eq(r[14], 'object'); eq(r[15], true); eq(r[16], true, 'idempotent'); });
t('Box: lose push-Einträge werden einsortiert, boxAdd/boxRemove', () => { const r = run(`(()=>{const g={team:[],box:[],flags:{}};migrateSave(g);const m=fix(1,5);g.box.push(m);normalizeBox(g);const n=boxAll(g).length,len=g.box.length;boxRemove(m,g);return[n,len,boxAll(g).length]})()`); eq(r[0], 1); eq(r[1], 20); eq(r[2], 0); });
t('mk(): neue Kreatur vollständig initialisiert', () => run(`(()=>{const m=mk(5,12);return!!(m.iv&&m.ev&&NATURES[m.nature]&&MONS[5].abilities.includes(m.ability)&&m.friendship===70&&m.hp===stat(m,'hp')&&m.capsule)})()`));

console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
if (bad) { console.log('FEHLER'); process.exit(1); } else console.log('Alle Unit-Tests grün.');
