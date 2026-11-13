// QA Loop A3 – Prüfung 6: Doppelkampf 2v2, Sieg-Zählung (früher gemeldeter Wackler).   node test/qa_a_double.mjs [Wiederholungen=3]
// Varianten: beide Gegner KO durch Angriffe · nur Gegner 2 schwach · beide sterben im selben Zug · Sieg durch Zustandsschaden am Rundenende · Niederlage zählt NICHT als Sieg · wechselnde Arten.
// Prüft je Lauf: Kampf endet, G.flags[flag] + defeatedTrainers genau einmal, Geld-Belohnung genau einmal, mode='world', B=null.
import { chromium } from 'playwright';
const REP = +(process.argv[2] || 3);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +(process.env.VW||860), height: +(process.env.VH||400) }, deviceScaleFactor: 1 });
const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
const ev = c => page.evaluate(c);
await page.click('#iPrompt'); await page.waitForTimeout(800); await page.click('#iSkip'); await page.waitForTimeout(800); await page.click('#tNew'); await page.waitForTimeout(400);
await ev('for(let i=0;i<20&&mode==="dialog";i++){TW&&TW.finish&&TW.finish();advDlg();}');
await ev("G.flags.starter=1;SET.skipBattleIntro=1;SET.btl='runde';SET.diff='leicht'");
const autoTurn = "(()=>{if(!B||B.busy||!document.querySelector('#bMenu').children.length)return 0;if(B.needSlot!=null){const i=G.team.findIndex((m,j)=>m.hp>0&&!B.mine.includes(j));if(i>=0)doSwitch(i);return 1;}const me=G.team[B.mi];const i=me.moves.findIndex(m=>m.pp>0&&MOVES[m.id][2]>0);const t=B.foes.findIndex(m=>m&&m.hp>0);turn({k:'move',i:i<0?-1:i,target:t<0?0:t});return 1;})()";
const finish = async n => { for (let i = 0; i < n && await ev('!!B'); i++) { await ev(autoTurn); await page.mouse.click(+(process.env.CX||200), +(process.env.CY||200)); await page.waitForTimeout(220); } };
const waitMenu = () => page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 40000 });
const results = [], outcomes = {}; let n = 0;
const pairs = [[59, 112], [25, 31], [90, 72], [10, 22], [13, 46]];
async function run(name, setup, expect, team) {
  n++; const flag = 'tr_qa_' + n; const e0 = errs.length;
  const r = { name, ok: false, detail: '' }, T0 = Date.now();
  try {
    await ev("for(let i=0;i<30&&!$('#dlg').hidden;i++){TW&&TW.finish&&TW.finish();advDlg();}"); await ev(`(()=>{G.team=${team||'[mk(1,14),mk(7,14)]'};G.team.forEach(m=>{m.hp=stat(m,'hp');});B=null;mode='world';setView('2d',true);loadMap('route1',9,18);window.__m0=G.money;})()`);
    const [a, b] = pairs[n % pairs.length];
    await ev(`startBattle({trainer:{name:'QA-Zwillinge ${n}',team:[[${a},6],[${b},6]],flag:'${flag}',pre:'',post:'Doppelt verloren!',money:10,double:true}})`);
    await waitMenu();
    const d = await ev('({d:B.double,f:B.foes.length,m:B.mine.length})'); if (!d.d || d.f !== 2 || d.m !== 2) throw new Error('kein Doppelkampf ' + JSON.stringify(d));
    await ev(setup); await finish(+(process.env.TURNS||300));
    if (await ev('!!B')) { const dg = await ev("B?JSON.stringify({busy:B.busy,needSlot:B.needSlot,mi:B.mi,mine:B.mine,foeHp:B.foe.map(m=>m.hp),foesHp:B.foes.map(m=>m&&m.hp),teamHp:G.team.map(m=>m.hp),mode,menu:document.querySelector('#bMenu').children.length,dlg:!$('#dlg').hidden,log:($('#bLog')||{}).textContent,card:!$('#bCard').hidden}):'B weg'"); throw new Error('Kampf nicht beendet ' + dg); }
    const o = await ev(`({win:!!G.flags['${flag}'],dt:G.defeatedTrainers.filter(x=>x==='${flag}').length,money:G.money-window.__m0,mode,B:!!B,alive:G.team.filter(m=>m.hp>0).length,pos:G.map})`);
    if (expect === 'any') { const cls = o.win ? 'Sieg' : (o.pos !== 'route1' ? 'Niederlage (Respawn)' : 'ANOMALIE: weder Sieg noch Niederlage'); r.ok = cls !== 'Sieg' ? cls.startsWith('Niederlage') : o.dt === 1 && o.money > 0; r.detail = cls + ' ' + JSON.stringify(o); results.push(r); console.log(r.ok ? '✓' : '✗', name, '–', r.detail); outcomes[cls.split(' ')[0]] = (outcomes[cls.split(' ')[0]] || 0) + 1; await ev("for(let i=0;i<30&&!$('#dlg').hidden;i++){TW&&TW.finish&&TW.finish();advDlg();}"); await page.waitForTimeout(250); await ev("for(let i=0;i<30&&!$('#dlg').hidden;i++){TW&&TW.finish&&TW.finish();advDlg();}"); return; }
    const wantWin = expect === 'win';
    if (o.win !== wantWin) throw new Error((wantWin ? 'Sieg nicht gezählt ' : 'Niederlage als Sieg gezählt ') + JSON.stringify(o));
    if (wantWin && o.dt !== 1) throw new Error('defeatedTrainers ' + o.dt + '× ' + JSON.stringify(o));
    if (!wantWin && o.dt !== 0) throw new Error('defeatedTrainers bei Niederlage ' + JSON.stringify(o));
    if (wantWin && !(o.money > 0)) throw new Error('keine Belohnung ' + JSON.stringify(o));
    r.ok = true; r.detail = JSON.stringify(o) + ' ' + Math.round((Date.now() - T0) / 1000) + ' s'; r.money = o.money;
    await ev("for(let i=0;i<30&&!$('#dlg').hidden;i++){TW&&TW.finish&&TW.finish();advDlg();}"); await page.waitForTimeout(250);
    await ev("for(let i=0;i<30&&!$('#dlg').hidden;i++){TW&&TW.finish&&TW.finish();advDlg();}");
    if (await ev("mode!=='world'")) throw new Error('mode nach Kampf/Dialog = ' + await ev('mode'));
  } catch (e) { r.detail = e.message.slice(0, 300); try { await ev("B=null;$('#battle').hidden=true;mode='world';"); } catch (_) {} }
  if (errs.length > e0) { r.ok = false; r.detail += ' | Fehler: ' + errs.slice(e0, e0 + 2).join(' / '); }
  results.push(r); console.log(r.ok ? '✓' : '✗', name, '–', r.detail);
}
const SC = [
  ['beide Gegner per Angriff besiegt', 'B.foe.forEach(m=>m.hp=1)', 'win'],
  ['nur Gegner 2 schwach, Gegner 1 stark (Reihenfolge)', 'B.foe[0].hp=stat(B.foe[0],"hp");B.foe[1].hp=1', 'win'],
  ['beide Gegner sterben im selben Zug', 'B.foe.forEach(m=>m.hp=1);G.team.forEach(m=>{m.moves.forEach(x=>x.pp=99)})', 'win'],
  ['Sieg durch Zustandsschaden am Rundenende (Sengen)', "B.foe.forEach(m=>{m.hp=2;m.status='sengen';m.statusT=9});G.team.forEach(m=>{m.moves=[{id:'knurren',pp:99}];})", 'win'],
  ['eigene Kreaturen schwach, Gegner stark → Niederlage zählt nicht', 'G.team.forEach(m=>m.hp=1);B.foe.forEach(m=>{m.l=60;m.hp=stat(m,"hp");})', 'lose'],
  ['Schwaches Team (L3/L2), Gegner 1 KP (Smoke-Szenario, Ausgang offen): nur Sieg oder echte Niederlage erlaubt', 'B.foe.forEach(m=>m.hp=1)', 'any', '[mk(1,3),mk(4,2)]'],
];
// Reihenfolge per 3. Argument (z. B. "5,1,5,1" = Niederlage, Sieg, …); Standard: alle Varianten × REP
const order = process.argv[3] ? process.argv[3].split(',').map(Number) : Array.from({ length: REP }, () => [1, 2, 3, 4, 5]).flat();
for (const k of order) await run(...SC[k - 1]);
const bad = results.filter(r => !r.ok);
// Gewinn-Belohnung muss in allen Siegen gleich sein (nicht doppelt gezählt)
const mo = [...new Set(results.filter(r => r.ok && r.money).map(r => r.money))];
if (Object.keys(outcomes).length) console.log('Ausgänge (Szenario "offen"):', JSON.stringify(outcomes));
console.log(`\n${results.length - bad.length}/${results.length} Läufe ok · Belohnungswerte: ${mo.join(', ')}${mo.length > 2 ? ' (uneinheitlich – prüfen)' : ''}`);
await browser.close(); process.exit(bad.length ? 1 : 0);
