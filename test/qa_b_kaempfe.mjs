// QA Loop B3 – Prüfung 3d: Siegquote aller Story-Kämpfe gegen Figuren (figTeam/rivalTeam je Kapitel) auf 'leicht'.   node test/qa_b_kaempfe.mjs [N=300]
// Ansatz wie tools/balance.mjs (leaderRun): Spielerteam aus 4 zufälligen, zum Level passenden Arten (fitSpecies), die klügste Kreatur führt (bestVs), 2 Kräutertränke (Turmrat/Ardena 3);
// Gegner = echte Teams der NPCs (Getter figTeam/rivalTeam), Level über trainerLv() auf das Spielerlevel gedeckelt (Schwierigkeit 'leicht': Arenaleiter +1), KI-Stufe aus aiTier.
// Spielerlevel = höchstes Gegnerlevel − 1 („im Takt“), zusätzlich −4 („Nachzügler“, nur Info). Doppelkampf (s6_orden) wird als Folge von 1v1 simuliert.
// Ziele: Kapitel 1–4 ≥ 85 %, 5–8 ≥ 75 %, Finale ≥ 65 %.   Ergebnis → test/qa_b_kaempfe.json
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, writeFileSync } from 'fs';
const N = +(process.argv[2] || 300);
const txt = readFileSync(new URL('../tools/balance.mjs', import.meta.url), 'utf8');
const SIM = txt.slice(txt.indexOf('const SIM = String.raw`') + 'const SIM = String.raw`'.length, txt.indexOf('`;\n\nexport function simulate'));
const { run } = loadVeyra();
run("SET.diff='leicht'"); run(SIM);
// Kapitel je Kampf-Flag (Flags der Hauptgeschichte → STEPS.ch; Kapitel 9 = Finale); Kämpfe ohne Schritt-Flag: Turmrat top1–3 → Finale
run(`globalThis.__fights=function(){const o=[];const chOf=f=>{const s=STEPS.find(s=>s.f===f);return s?s.ch:(/^top/.test(f)?9:null)};
 for(const id in NPCS)for(const n of NPCS[id]){if(n.t!=='trainer'||!n.fig)continue;const ch=chOf(n.flag);if(ch==null)continue;let team;try{team=n.team}catch(e){continue}
  o.push({map:id,flag:n.flag,name:n.name,fig:n.fig,ch,lv:Math.max(...team.map(x=>x[1])),size:team.length});}return o;};
 globalThis.__sim=function(map,flag,delta,n){const npc=NPCS[map].find(x=>x.flag===flag);const team=npc.team;const top=Math.max(...team.map(x=>x[1]));const lv=Math.max(5,top-delta);const L=fitSpecies(lv);
  const tier3=npc.flag==='champion'||/^top/.test(npc.flag)||npc.elite;let win=0,turns=0;
  for(let k=0;k<n;k++){simInit();G.team=Array.from({length:4},()=>mk(L[Math.random()*L.length|0],lv));
   const foes=npc.team.map(([s,l])=>mk(s,trainerLv(l,npc)));const r=simFight(foes,{tr:npc,potions:{n:tier3?3:2}});if(r.win)win++;turns+=r.turns;}
  return{win:win/n,turns:turns/n,lv,tier:aiTier({tr:npc})};};`);
const fights = JSON.parse(run('JSON.stringify(__fights())')).sort((a, b) => a.ch - b.ch || a.lv - b.lv);
const pct = v => (v * 100).toFixed(0).padStart(3) + ' %';
const rows = [];
console.log(`Story-Kämpfe gegen Figuren (leicht), ${N} Kämpfe je Zeile · Spielerteam 4 Arten, Level = Gegner-Höchstlevel −1 bzw. −4\n`);
console.log('Kap | Kampf                           | Team (n, max Lv) | KI | Sieg im Takt (−1) | Züge | Sieg Nachzügler (−4)');
for (const f of fights) {
  const a = JSON.parse(run(`JSON.stringify(__sim(${JSON.stringify(f.map)},${JSON.stringify(f.flag)},1,${N}))`));
  const b = JSON.parse(run(`JSON.stringify(__sim(${JSON.stringify(f.map)},${JSON.stringify(f.flag)},4,${Math.max(60, N / 3 | 0)}))`));
  rows.push({ ...f, win: a.win, turns: a.turns, lvP: a.lv, tier: a.tier, winLag: b.win });
  console.log(`${String(f.ch === 9 ? 'F' : f.ch).padStart(3)} | ${(f.name + ' (' + f.flag + ')').padEnd(31)} | ${f.size}, L${f.lv}`.padEnd(58) + ` | ${a.tier}  | ${pct(a.win)} (Spieler L${a.lv}) | ${a.turns.toFixed(1)} | ${pct(b.win)}`);
}
const goal = ch => (ch === 9 ? .65 : ch <= 4 ? .85 : .75);
const chapters = {}; for (const r of rows) (chapters[r.ch] = chapters[r.ch] || []).push(r);
console.log('\nKapitel (Mittel der Kämpfe, schwächster Kampf, Ziel):');
const summary = [];
for (const ch of Object.keys(chapters).map(Number).sort((a, b) => a - b)) {
  const L = chapters[ch], mean = L.reduce((s, r) => s + r.win, 0) / L.length, worst = L.reduce((a, r) => r.win < a.win ? r : a, L[0]), g = goal(ch);
  const lag = L.reduce((s, r) => s + r.winLag, 0) / L.length;
  summary.push({ ch, n: L.length, mean, worst: worst.name, worstWin: worst.win, goal: g, ok: mean >= g && worst.win >= g - .1, lag });
  console.log(`  ${ch === 9 ? 'Finale' : 'Kapitel ' + ch}: ${pct(mean)} (Ziel ≥ ${pct(g)}) · schwächster ${worst.name} ${pct(worst.win)} · Nachzügler ${pct(lag)} → ${mean >= g ? 'ok' : 'UNTER ZIEL'}`);
}
writeFileSync(new URL('./qa_b_kaempfe.json', import.meta.url), JSON.stringify({ N, rows, summary }, null, 1));
const bad = summary.filter(s => s.mean < s.goal);
console.log(bad.length ? `\nUnter Ziel: Kapitel ${bad.map(s => s.ch).join(', ')}` : '\nAlle Kapitel erreichen das Ziel.');
process.exit(bad.length ? 1 : 0);
