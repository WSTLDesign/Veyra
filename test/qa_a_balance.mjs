// QA Loop A3 – Prüfung 5: Balance-Detail (Starter-Linien, Typen, Fangquoten).  node test/qa_a_balance.mjs [N=300]
// Ergänzt tools/balance.mjs (Gesamtwerte) um: Gleichgewicht der drei Starter-Linien je Stufe, Typ-Dominanz (gleiche Stufe/gleiches Level), Fangquoten (calcCatch, Standardkapsel, volle KP).
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, writeFileSync } from 'fs';
const N = +(process.argv[2] || 300);
const txt = readFileSync(new URL('../tools/balance.mjs', import.meta.url), 'utf8');
const SIM = txt.slice(txt.indexOf('const SIM = String.raw`') + 'const SIM = String.raw`'.length, txt.indexOf('`;\n\nexport function simulate'));
const out = { N, lines: {}, types: {}, catch: {}, legends: {} };
const pct = v => (v * 100).toFixed(0).padStart(3) + ' %';
for (const diff of ['normal', 'leicht']) {
  const { run } = loadVeyra();
  run(`SET.diff='${diff}'`); run(SIM);
  run(`globalThis.stageOf=function(id){let n=1;for(;;){const p=MONS.findIndex(M=>M&&M.ev&&M.ev.to===id);if(p<1)return n;id=p;n++;}};
   globalThis.duelRun=function(sid,lv,n,oppStage){let w=0,t=0;const P=[];for(let i=1;i<MONS.length;i++){const M=MONS[i];if(M&&!M.legend&&stageOf(i)===oppStage&&!(M.evolutions&&0))P.push(i);}
    for(let k=0;k<n;k++){simInit();G.team=[mk(sid,lv)];const foe=mk(P[Math.random()*P.length|0],lv);const r=simFight([foe]);if(r.win)w++;t+=r.turns;}return{win:w/n,turns:t/n};};`);
  const line = (a, b, c) => [a, b, c];
  const LINES = { 'Glut 001-003 (Funki)': [1, 2, 3], 'Flut 004-006 (Plippi)': [4, 5, 6], 'Flora 007-009 (Knospi)': [7, 8, 9] };
  const LV = [8, 26, 42];
  console.log(`\n=== ${diff}: Starter-Linien 1v1 gegen gleichstufige Wilde (Level gleich), ${N} Kämpfe je Zelle ===`);
  console.log('Stufe/Level'.padEnd(14) + Object.keys(LINES).map(k => k.padEnd(26)).join(''));
  out.lines[diff] = {};
  for (let s = 0; s < 3; s++) {
    const row = []; for (const [nm, ids] of Object.entries(LINES)) { const r = run(`duelRun(${ids[s]},${LV[s]},${N},${s + 1})`); row.push(r); (out.lines[diff][nm] = out.lines[diff][nm] || []).push({ stage: s + 1, lv: LV[s], win: r.win, turns: r.turns }); }
    const mean = row.reduce((a, r) => a + r.win, 0) / 3, spread = Math.max(...row.map(r => r.win)) - Math.min(...row.map(r => r.win));
    console.log(`Stufe ${s + 1} L${LV[s]}`.padEnd(14) + row.map(r => (pct(r.win) + ' (' + r.turns.toFixed(1) + ' Z)').padEnd(26)).join('') + `  Spanne ${(spread * 100).toFixed(0)} pp  Abw. vom Mittel max ${(Math.max(...row.map(r => Math.abs(r.win - mean))) * 100).toFixed(0)} pp`);
  }
  // Typ-Dominanz: jede Nicht-Legende 1v1 gegen Wilde mit ähnlichem BST (±25) bei gleichem Level (Level nach BST-Klasse) → isoliert Typ/Wertverteilung/Attacken vom BST
  run(`globalThis.bstOf=id=>MONS[id].b6.reduce((a,b)=>a+b,0);globalThis.duelBand=function(sid,lv,n){let w=0;const P=[];const b0=bstOf(sid);for(let i=1;i<MONS.length;i++){const M=MONS[i];if(M&&!M.legend&&i!==sid&&Math.abs(bstOf(i)-b0)<=25)P.push(i);}
    for(let k=0;k<n;k++){simInit();G.team=[mk(sid,lv)];const foe=mk(P[Math.random()*P.length|0],lv);if(simFight([foe]).win)w++;}return w/n;};`);
  const types = JSON.parse(run('JSON.stringify(Object.keys(TYPES).filter(t=>t!=="ursprung"))'));
  const rows = JSON.parse(run(`JSON.stringify((()=>{const o=[];for(let i=1;i<MONS.length;i++){const M=MONS[i];if(!M||M.legend)continue;const b=bstOf(i),lv=b<350?14:b<450?28:42;o.push([i,M.n,M.t,b,duelBand(i,lv,${Math.max(60, N / 3 | 0)})]);}return o;})())`));
  const all = rows.reduce((a, r) => a + r[4], 0) / rows.length;
  console.log(`\n=== ${diff}: Typ-Dominanz (Nicht-Legenden 1v1 gegen Wilde mit ähnlichem BST ±25, gleiches Level; Gesamtmittel ${pct(all)}) ===`);
  out.types[diff] = { mean: all, byType: {}, extremes: [] };
  for (const t of types) {
    const sel = rows.filter(r => r[2][0] === t); if (!sel.length) continue; const m = sel.reduce((a, r) => a + r[4], 0) / sel.length;
    const any = rows.filter(r => r[2].includes(t)); const ma = any.reduce((a, r) => a + r[4], 0) / any.length;
    out.types[diff].byType[t] = { n: sel.length, win: m, winAny: ma, dev: m - all };
    console.log(t.padEnd(9) + `Haupttyp n=${String(sel.length).padStart(2)} ${pct(m)} (${((m - all) * 100 >= 0 ? '+' : '') + ((m - all) * 100).toFixed(0)} pp) · enthält Typ n=${String(any.length).padStart(2)} ${pct(ma)} (${((ma - all) * 100 >= 0 ? '+' : '') + ((ma - all) * 100).toFixed(0)} pp)`);
  }
  rows.sort((a, b) => b[4] - a[4]);
  out.types[diff].extremes = { top: rows.slice(0, 8).map(r => r[0] + ' ' + r[1] + ' ' + (r[4] * 100 | 0) + '%'), bottom: rows.slice(-8).map(r => r[0] + ' ' + r[1] + ' ' + (r[4] * 100 | 0) + '%') };
  console.log('Stärkste:', out.types[diff].extremes.top.join(', ')); console.log('Schwächste:', out.types[diff].extremes.bottom.join(', '));
  // Legenden/Mythische L50 gegen Endstufen L50
  const leg = JSON.parse(run(`JSON.stringify((()=>{const o={leg:[],myth:[]};for(let i=140;i<=153;i++){const r=duelRun(i,50,${Math.max(40, N / 5 | 0)},3);(MONS[i].myth?o.myth:o.leg).push([MONS[i].n,r.win]);}return o;})())`));
  out.legends[diff] = leg; console.log('Legenden L50 vs Endstufen L50:', leg.leg.map(x => x[0] + ' ' + (x[1] * 100 | 0) + '%').join(', ')); console.log('Mythische:', leg.myth.map(x => x[0] + ' ' + (x[1] * 100 | 0) + '%').join(', '));
  // Fangquoten (Standardkapsel, volle KP, Wildlevel 5, kein Status)
  if (diff === 'leicht' || diff === 'normal') {
    const c = JSON.parse(run(`JSON.stringify((()=>{const o=[];G=freshG({});G.time=12*60;cur={id:'route1',theme:'meadow'};for(let i=1;i<MONS.length;i++){const m=mk(i,5);m.hp=stat(m,'hp');const r=calcCatch(m,'kapsel',{roll:false,maxHp:stat(m,'hp'),dex:0,dist:0.6});o.push([i,MONS[i].n,MONS[i].cr,r.p]);}return o;})())`));
    const st1 = c.filter(x => [1, 4, 7].includes(x[0])), s1 = c.filter(x => x[0] <= 139 && JSON.parse(run(`MONS[${x[0]}].stage===1`))), leg2 = c.filter(x => x[0] >= 140);
    out.catch[diff] = { starter: st1.map(x => [x[1], x[3]]), stage1min: Math.min(...s1.map(x => x[3])), stage1below35: s1.filter(x => x[3] < .35).map(x => x[1] + ' ' + (x[3] * 100).toFixed(0) + '%'), legMax: Math.max(...leg2.map(x => x[3])), legMin: Math.min(...leg2.map(x => x[3])), n1: s1.length };
    console.log(`\n=== ${diff}: Fangquote Standardkapsel, volle KP, ohne Bonus ===`);
    console.log('Starter (Stufe 1):', st1.map(x => x[1] + ' cr' + x[2] + ' = ' + (x[3] * 100).toFixed(1) + ' %').join(' · '));
    console.log(`Alle Stufe-1-Arten (${s1.length}): min ${(out.catch[diff].stage1min * 100).toFixed(1)} %; unter 35 %: ${out.catch[diff].stage1below35.length}`, out.catch[diff].stage1below35.slice(0, 12).join(', '));
    console.log(`Legenden/Mythische: ${(out.catch[diff].legMin * 100).toFixed(1)}–${(out.catch[diff].legMax * 100).toFixed(1)} %`);
  }
}
writeFileSync(new URL('./qa_a_balance.json', import.meta.url), JSON.stringify(out, null, 1));
