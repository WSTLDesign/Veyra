// Veyra – Kampf-Balancing ohne Browser: lädt alle src/*.js in eine VM (DOM/THREE gestubbt) und simuliert Kämpfe mit dem Kampfkern (18-battlecore.js).
// Aufruf: node tools/balance.mjs [anzahl=1000]   ·   Export loadVeyra() für test/unit_battle.mjs
import { readFileSync, readdirSync } from 'fs';
import vm from 'vm';
import { pathToFileURL } from 'url';

function deepStub() {
  const cache = new Map();
  const mk = () => {
    const f = function () {};
    return new Proxy(f, {
      get(t, k) {
        if (k === Symbol.toPrimitive) return () => 0;
        if (k === Symbol.iterator) return function* () {};
        if (k === 'then') return undefined;
        if (k === 'length') return 0;
        if (k === 'hidden' || k === 'checked' || k === 'disabled' || k === 'matches') return false;
        if (k === 'textContent' || k === 'innerHTML' || k === 'value' || k === 'id' || k === 'className') return '';
        if (typeof k === 'symbol') return undefined;
        if (!cache.has(k)) cache.set(k, mk());
        return cache.get(k);
      },
      set() { return true; },
      apply() { return mk(); },
      construct() { return mk(); },
      has() { return true; },
    });
  };
  return mk();
}

export function loadVeyra() {
  const root = new URL('../src/', import.meta.url);
  const files = readdirSync(root).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
  const src = files.map(f => readFileSync(new URL(f, root), 'utf8')).join('\n');
  const S = deepStub();
  const store = {};
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    document: S, window: S, navigator: S, THREE: S, Audio: S, Image: S, AudioContext: S, webkitAudioContext: S,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    requestAnimationFrame: () => 0, cancelAnimationFrame() {}, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    performance: { now: () => Date.now() }, addEventListener() {}, removeEventListener() {}, innerWidth: 420, innerHeight: 860, devicePixelRatio: 1,
    location: { protocol: 'file:', search: '', href: '' }, screen: S, history: S, fetch: () => Promise.reject(new Error('offline')),
    ResizeObserver: S, CanvasRenderingContext2D: S, IntersectionObserver: S, MutationObserver: S, getComputedStyle: () => S, Blob: S, URL: S, CustomEvent: S, Event: S, HTMLElement: S, KeyboardEvent: S, OffscreenCanvas: S, speechSynthesis: S, SpeechSynthesisUtterance: S, visualViewport: S, alert() {}, AbortController: S, queueMicrotask, TextEncoder, TextDecoder, btoa: x => Buffer.from(String(x), 'binary').toString('base64'), atob: x => Buffer.from(String(x), 'base64').toString('binary'),
    Math, Date, JSON, Object, Array, Set, Map, WeakMap, Promise, Number, String, Symbol, RegExp, Error, Proxy, Reflect, Float32Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, Infinity, NaN, isNaN, parseFloat, parseInt, structuredClone,
  };
  ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(src + '\n;globalThis.__V={MONS,MOVES,TYPES,TYPE_CHART,ABIL,ITEMS,NATURES,STATUS,WEATHER,FIELDS};', ctx, { filename: 'veyra-bundle.js' });
  const run = code => vm.runInContext(code, ctx);
  return { ctx, run };
}

// ---------- Simulation ----------
// Spieler-Strategie: bester erwarteter Schaden (KI-Stufe 2 aus dem Kern), Gegner: Stufe je Kampfart
const SIM = String.raw`
globalThis.simInit=function(){G=freshG({});G.time=12*60;G.team=[];cur={id:'route1',theme:'meadow',enc:null};};
globalThis.newB=function(foe,o){o=o||{};const alive=G.team.map((m,i)=>i).filter(i=>G.team[i].hp>0);
 const b={tr:o.tr||null,foe,fi:0,mi:alive[0],part:new Set(alive.slice(0,1)),double:false,foes:[foe[0]],mine:[alive[0]],stm:new Map(),dead:new Set(),res:{me:0,foe:0},resOn:{},
  weather:o.weather||null,wxT:Infinity,wx0:o.weather||null,field:null,ai:0,aiItems:0,aiSw:0,rt:false,sim:true,turnN:0};defineSt(b);b.ai=aiTier(b);b.aiItems=b.ai>=3?2:b.ai>=2?1:0;return b;};
// Ein Kampf: liefert {win, turns}
globalThis.simFight=function(foeList,o){o=o||{};B=newB(foeList,o);let turns=0;{const i=bestVs(B.foes[0]);if(i>=0){B.mi=i;B.mine=[i];B.part=new Set([i]);}}
 for(const m of [...B.foes,...B.mine.map(i=>G.team[i])])onEnter(B,m);
 while(turns<80){turns++;const me=G.team[B.mi],F=B.foes[0];const acts=[];
  // Spieler: Resonanz nutzen, wenn voll
  if(B.res.me>=1&&o.useRes!==false)useResonance('me');
  // Spieler heilt (nur Arenaszenario) bei <25 %
  if(o.potions&&o.potions.n>0&&me.hp<stat(me,'hp')*.25){o.potions.n--;me.hp=Math.min(stat(me,'hp'),me.hp+60);}
  else{const c=aiChoose(B,me,'me',{tier:2,items:false,canSwitch:false,dmgOnly:o.dmgOnly!==false});acts.push({side:'me',k:'move',mon:me,i:c.i,target:0});}
  const c2=aiChoose(B,F,'foe');
  if(c2.k==='switch'){onLeave(B,F);B.foes[0]=B.foe[c2.i];B.fi=c2.i;onEnter(B,B.foes[0]);}
  else if(c2.k==='item'){F.hp=Math.min(stat(F,'hp'),F.hp+(c2.item==='hypertr'?stat(F,'hp'):60));}
  else acts.push({side:'foe',k:'move',mon:F,i:c2.i,target:0});
  orderActions(B,acts);
  for(const a of acts){if(a.mon.hp<=0)continue;const opp=foesOf(B,a.side);const D=opp.find(m=>m&&m.hp>0);if(!D)break;if(a.side==='me'&&a.mon!==G.team[B.mi])continue;if(a.side==='foe'&&!B.foes.includes(a.mon))continue;
   execMove(B,a.side,a.mon,a.i,D);if(simFaint())return{win:B.won,turns};}
  endOfTurn(B);if(simFaint())return{win:B.won,turns};}
 return{win:false,turns};};
// Kluge Wahl: eigene Kreatur mit bestem Verhältnis aus ausgeteiltem zu eingestecktem Schaden
globalThis.bestVs=function(F){let bi=-1,bs=-1e9;G.team.forEach((m,i)=>{if(m.hp<=0)return;const out=Math.max(0,...m.moves.map(mv=>expDmg(B,m,F,MOVES[mv.id])))/Math.max(1,F.hp),inn=Math.max(0,...F.moves.map(mv=>expDmg(B,F,m,MOVES[mv.id])))/Math.max(1,m.hp);const sc=out-inn*.8;if(sc>bs){bs=sc;bi=i;}});return bi;};
globalThis.simFaint=function(){const F=B.foes[0];if(F.hp<=0){const nx=B.foe.findIndex(m=>m.hp>0);if(nx<0){B.won=true;return true;}onLeave(B,F);B.foes[0]=B.foe[nx];B.fi=nx;onEnter(B,B.foe[nx]);}
 const me=G.team[B.mi];if(me.hp<=0){const nx=bestVs(B.foes[0]);if(nx<0){B.won=false;return true;}onLeave(B,me);B.mi=nx;B.mine=[nx];onEnter(B,G.team[nx]);}return false;};
globalThis.pool=function(lo,hi){const o=[];for(let i=1;i<MONS.length;i++){const M=MONS[i];if(!M||M.legend)continue;o.push(i);}return o;};
// Stufe einer Art grob passend zum Level (Basisform < 20, mittel 16–36, Endform ab 30)
globalThis.fitSpecies=function(lv){const P=pool();const stage=id=>{let n=0;for(let i=1;i<MONS.length;i++)if(MONS[i]&&MONS[i].ev&&MONS[i].ev.to===id)n=1+stage(i);return n;};
 return P.filter(id=>{const s=stage(id),evo=!!MONS[id].ev;if(lv<16)return s===0;if(lv<32)return s<=1;return!evo||s>=1;});};
globalThis.wildRun=function(lo,hi,n){let win=0,turns=0,tl=[];const L=fitSpecies(lo);
 for(let k=0;k<n;k++){simInit();const lv=lo+(Math.random()*(hi-lo+1)|0);G.team=[0,1,2].map(()=>mk(L[Math.random()*L.length|0],lv));
  const foe=mk(L[Math.random()*L.length|0],Math.max(2,lv-2-(Math.random()*3|0)));const r=simFight([foe]);if(r.win)win++;turns+=r.turns;tl.push(r.turns);}
 tl.sort((a,b)=>a-b);return{win:win/n,turns:turns/n,med:tl[n>>1]};};
// Arena-Szenario: Team aus 3 (Level ≈ Leiter −1), 2 Tränke gegen Leiter-Team (KI Stufe 2/3)
globalThis.leaderRun=function(lo,hi,n,tier){let win=0,turns=0;const L=fitSpecies(lo);
 for(let k=0;k<n;k++){simInit();const lv=lo+(Math.random()*(hi-lo+1)|0);G.team=Array.from({length:4},()=>mk(L[Math.random()*L.length|0],lv));
  const tr={name:'Sim',flag:tier>=3?'top1':'badgeX',leader:tier===2?'X':null,money:0};const sz=tier>=3?4:3;const foes=Array.from({length:sz},()=>mk(L[Math.random()*L.length|0],trainerLv(lv+1,tr)));
  const r=simFight(foes,{tr,potions:{n:tier>=3?3:2}});if(r.win)win++;turns+=r.turns;}return{win:win/n,turns:turns/n};};
`;

export function simulate(n = 1000, diff = 'normal') {
  const { run } = loadVeyra();
  run(`SET.diff='${diff}'`);
  run(SIM);
  const ranges = [[5, 15], [15, 30], [30, 45], [45, 60]];
  const rows = [];
  for (const [lo, hi] of ranges) {
    const w = run(`wildRun(${lo},${hi},${n})`);
    const a = run(`leaderRun(${lo},${hi},${Math.max(100, n / 4 | 0)},2)`);
    const e = run(`leaderRun(${lo},${hi},${Math.max(100, n / 4 | 0)},3)`);
    rows.push({ range: lo + '–' + hi, wildWin: w.win, wildTurns: w.turns, wildMed: w.med, leaderWin: a.win, leaderTurns: a.turns, eliteWin: e.win, eliteTurns: e.turns });
  }
  return rows;
}

// ---------- Fundstücke (47-finds.js, docs/funde.md): Verteilung Rollen / versteckte Wesen / Kapseln & Tränke ----------
// Glitzer zählt mit Erwartungswert (Gewichte aus SPARKLE). Vergleich: Startpaket 5 Kapseln + 3 Tränke, Ladenpreis Kapsel 200 ¤.
export function findsReport() {
  const { run } = loadVeyra();
  return JSON.parse(run(`JSON.stringify((()=>{const E=new Set();for(const id in MAPS){const e=MAPS[id].enc;if(e)[...(e.day||[]),...(e.night||[])].forEach(x=>E.add(x[0]));}
   const tot=SPARKLE.reduce((a,s)=>a+s.w,0),avg=a=>(a[0]+a[1])/2,exp={ball:0,heal:0,money:0,berry:0};
   for(const s of SPARKLE){const p=s.w/tot;if(s.money)exp.money+=p*avg(s.money);else if(s.berry)exp.berry+=p*avg(s.n);else if(ITEMS[s.item].k==='ball')exp.ball+=p*avg(s.n);else exp.heal+=p*avg(s.n);}
   const maps={},sum={ball:0,heal:0,other:0,sparkle:0,scroll:0,hidden:0,old:0,neu:0};
   for(const id in NPCS)for(const n of NPCS[id]){if(n.t!=='item'||n.hook)continue;const M=maps[id]=maps[id]||{scroll:[],hidden:[],ball:0,heal:0,sparkle:0,other:[]};
    if(n.f==='scroll'){M.scroll.push(ITEMS[n.item].n.replace('Rolle: ','')+(ITEMS[n.item].field?'*':''));sum.scroll++;}
    else if(n.f==='hidden'){M.hidden.push(MONS[n.mon].n+' Lv'+n.lvl+(E.has(n.mon)?' (!enc)':''));sum.hidden++;}
    else if(n.f==='sparkle'){M.sparkle++;sum.sparkle++;}
    else{const k=ITEMS[n.item]&&ITEMS[n.item].k;if(/^fr_/.test(n.flag))continue;if(k==='ball'){M.ball+=n.n;sum.ball+=n.n;}else if(k==='heal'||k==='revive'||k==='pp'){M.heal+=n.n;sum.heal+=n.n;}else{M.other.push(ITEMS[n.item].n);sum.other++;}
     if(FIND_NPCS[id]&&FIND_NPCS[id].some(q=>q.flag===n.flag))sum.neu++;else sum.old++;}}
   return{maps,sum,exp,hidden:Object.keys(FIND_HINTS).length,regions:Object.values(FIND_HINTS).reduce((o,h)=>(o[h.region]=(o[h.region]||0)+1,o),{})};})())`));
}
export function printFinds() {
  const R = findsReport(), s = R.sum, e = R.exp;
  console.log('\n== Fundstücke (Boden, ohne Missions-Funde/Beerensträucher) ==');
  console.log('Karte         | Rollen (* = Feld)                    | Verstecktes Wesen          | Kapseln | Heilmittel | Glitzer');
  for (const [id, M] of Object.entries(R.maps)) console.log(`${id.padEnd(13)} | ${M.scroll.join(', ').padEnd(36)} | ${M.hidden.join(', ').padEnd(26)} | ${String(M.ball).padStart(7)} | ${String(M.heal).padStart(10)} | ${M.sparkle}`);
  const g = s.sparkle;
  console.log(`Summe: ${s.scroll} Rollen, ${s.hidden} versteckte Wesen (Regionen ${JSON.stringify(R.regions)}), feste Funde ${s.old} alt + ${s.neu} neu`);
  console.log(`Kapseln fest ${s.ball} + Glitzer ≈${(g * e.ball).toFixed(1)} · Heilmittel fest ${s.heal} + Glitzer ≈${(g * e.heal).toFixed(1)} · Beeren ≈${(g * e.berry).toFixed(1)} · Geld ≈${Math.round(g * e.money)} ¤ (${g} Glitzer, je Glitzer ≈${e.ball.toFixed(2)} Kapseln/${e.heal.toFixed(2)} Heilmittel/${Math.round(e.money)} ¤)`);
  return R;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === 'funde') { printFinds(); process.exit(0); }
  const n = +(process.argv[2] || 1000);
  const pct = v => (v * 100).toFixed(0).padStart(3) + ' %';
  for (const diff of (process.argv[3] ? [process.argv[3]] : ['normal', 'leicht'])) {
    const rows = simulate(n, diff);
    console.log(`\n== Schwierigkeit: ${diff} ==`);
    console.log(`Veyra Balancing – ${n} wilde Kämpfe je Bereich (Team aus 3, passende Kreatur führt; Züge bis KO), Arena je ${Math.max(100, n / 4 | 0)} (4 gegen 3, Gegner Lv+1, 2 Tränke), Top Vier (4 gegen 4, Lv+1, KI wechselt + 2 Items, 3 Tränke)`);
    console.log('Level   | Wild Sieg | Wild Züge Ø (Median) | Arena Sieg | Arena Züge | Top Vier Sieg | Top Vier Züge');
    for (const r of rows) console.log(`${r.range.padEnd(7)} | ${pct(r.wildWin).padStart(9)} | ${r.wildTurns.toFixed(1).padStart(10)} (${r.wildMed})      | ${pct(r.leaderWin).padStart(10)} | ${r.leaderTurns.toFixed(1).padStart(10)} | ${pct(r.eliteWin).padStart(13)} | ${r.eliteTurns.toFixed(1).padStart(13)}`);
  }
  // Bewegung: versteckte Begegnungen + Feldattacken (Agent Bewegung) – wo finden Spieler die nötigen Arten?
  const { run } = loadVeyra();
  const FM = JSON.parse(run(`JSON.stringify((()=>{G=freshG({});const order=Object.keys(MAPS).filter(k=>MAPS[k].enc),o={};
   for(const id in FIELD_MOVES){o[id]={n:FIELD_MOVES[id].n,lv:FIELD_MOVES[id].lv,where:[]};for(const mid of order){const E=MAPS[mid].enc,L=E.day.concat(E.night).filter(e=>fieldLearnable(e[0],id));for(const e of L){const k=MONS[e[0]].n+' ('+mid+', Lv '+e[1]+')';if(!o[id].where.some(w=>w.startsWith(MONS[e[0]].n+' ')))o[id].where.push(k);}if(o[id].where.length>=3)break;}}
   o.starter={n:'Starter',lv:0,where:[1,4,7].map(s=>MONS[s].n+': '+Object.keys(FIELD_MOVES).filter(id=>fieldLearnable(s,id)).map(id=>FIELD_MOVES[id].n).join('/'))};
   const rate={};for(const d of['leicht','normal']){SET.diff=d;P.state='walk';MV.rw=false;rate[d]=[encChance('grass'),encChance('water')];}o.rate={n:'Begegnungen je Schritt',lv:0,where:Object.entries(rate).map(([d,r])=>d+': Gras '+(r[0]*100).toFixed(1)+' %, Schwimmen '+(r[1]*100).toFixed(1)+' %')};return o})())`));
  console.log('\n== Bewegung: Feldattacken (früheste Fundorte) & versteckte Begegnungen ==');
  for (const k in FM) console.log((FM[k].n + (FM[k].lv ? ' (ab Lv ' + FM[k].lv + ')' : '')).padEnd(26) + ' | ' + FM[k].where.join(' · '));
  printFinds();
}
