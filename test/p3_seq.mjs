// Phase 3 / Agent F: Sequenzen Fang (Erfolg, Ausbruch, kritisch), Entwicklung (Level, Kristall, Abbruch), Level-up, Heilstation – je 3× ohne hängenden Zustand
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 1 });
const errs = [];page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
const ev = c => page.evaluate(c), wait = ms => page.waitForTimeout(ms), shot = n => page.screenshot({ path: new URL('./' + n, import.meta.url).pathname });
const fails = [];const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const step = async (n, fn) => { if (ONLY && !ONLY.test(n)) return; const e0 = errs.length; try { await fn(); } catch (e) { fails.push(n + ': ' + e.message); } const bad = errs.length > e0; if (bad) fails.push(n + ': ' + errs.slice(e0).join(' | ')); console.log((fails.some(f => f.startsWith(n + ':')) ? '✗ ' : '✓ ') + n); };
const clean = async (want) => { const s = await ev(`({mode,B:!!B,card:!$('#bCard').hidden,ov:document.querySelectorAll('.evoOv,.healOv,.lvOv,.seqCv').length,cap:!!(B&&B.cap)})`); if (s.B || s.card || s.ov || s.cap || (want && s.mode !== want)) throw new Error('hängt: ' + JSON.stringify(s)); };
const tapUntil = async (cond, n = 60, ms = 250) => { for (let i = 0; i < n; i++) { if (await ev(cond)) return true; await page.mouse.click(210, 420); await wait(ms); } return await ev(cond); };
const advUntilWorld = async () => { for (let i = 0; i < 30 && await ev("mode==='dialog'"); i++) { await ev("TW&&TW.finish&&TW.finish();if(!$('#dlgOpts').children.length)advDlg()"); await wait(60); } };
await page.click('#iPrompt').catch(()=>{});await wait(600);await page.click('#iSkip').catch(()=>{});await wait(600);
await ev("document.querySelectorAll('#intro,#title').forEach(e=>e.hidden=true);beginGame({},true);SET.btl='runde';SET.skipBattleIntro=1;G.time=12*60;G.team=[mk(1,12)];G.dex.caught[1]=1;loadMap('route1',9,18);mode='world';setView('2d',true)");
await wait(400);
const battle = async (foe) => { await ev(`mode='world';startBattle({wild:mk(${foe},4)})`); await page.waitForFunction(() => B && document.querySelector('#bMenu').children.length > 0 && !B.busy, null, { timeout: 20000, polling: 100 }).catch(() => {}); await tapUntil("document.querySelector('#bMenu .big')", 30, 200); };
// --- Fang ---
for (const [name, res, file] of [['Erfolg', { p: .5, shakes: 3, crit: false, ok: true }, 'p3_catch_ok.png'], ['Ausbruch', { p: .3, shakes: 2, crit: false, ok: false }, 'p3_catch_break.png'], ['kritisch', { p: .3, shakes: 1, crit: true, ok: true }, 'p3_catch_crit.png']]) {
 for (let r = 0; r < 3; r++) await step(`Fang ${name} #${r + 1}`, async () => {
  await battle(10); const n0 = await ev('G.team.length+G.box.flat().length');
  await ev(`window.__cc=calcCatch;calcCatch=()=>(${JSON.stringify(res)});G.bag.kapsel=5;G.bag.superk=2;turn({k:'ball',item:${r === 1 ? "'superk'" : "'kapsel'"}});1`);
  if (r === 0) { const want = name === 'Ausbruch' ? ['break'] : name === 'kritisch' ? ['absorb', 'drop'] : ['shake']; await page.waitForFunction(w => B && B.cap && w.includes(B.cap.ph), want, { timeout: 60000, polling: 30 }).catch(() => {}); await shot(file); }
  if (res.ok) { const ok = await tapUntil('!B', 80, 250); if (!ok) throw new Error('Kampf endet nicht'); if (await ev('G.team.length+G.box.flat().length') !== n0 + 1) throw new Error('nicht gefangen'); await clean('world'); }
  else { const ok = await tapUntil("B&&!B.cap&&!B.busy&&document.querySelector('#bMenu .big')", 80, 250); if (!ok) throw new Error('kein Menü nach Ausbruch: ' + await ev('JSON.stringify({c:!!B.cap,b:B.busy,m:$("#bMenu").children.length})')); if (await ev('B.caught')) throw new Error('B.caught bleibt'); await ev("endBattle('run')"); await clean('world'); }
  await ev('calcCatch=window.__cc;G.team.length=1'); await wait(150);
 });
}
await step('Fang Kurzfassung (Kampfanimationen aus) < 1,2 s', async () => { await battle(10); try { await ev("SET.banim=0;window.__r=null;playSeq('catch',{mon:B.foe[0],capsule:'kapsel',res:{shakes:3,ok:true}}).then(r=>window.__r=r)"); await page.waitForFunction(() => window.__r, null, { timeout: 60000 }); const r = await ev('__r'); console.log('   Kurzfassung geplant', r.ms, 'ms'); if (!(r.ms > 0 && r.ms < 1200)) throw new Error('ms=' + r.ms); } finally { await ev("SET.banim=1;if(B){B.cap=null;endBattle('run')}"); } await clean('world'); });
// --- Level-up (mit Attacken-Ersetzen) ---
for (let r = 0; r < 3; r++) await step(`Level-up #${r + 1}`, async () => {
 await ev("G.team=[mk(35,27)];G.team[0].hp=stat(G.team[0],'hp')"); await battle(10);
 try {
 await ev("window.__lvd=0;window.__lv=giveXp(G.team[0],28**3-G.team[0].xp).then(()=>window.__lvd=1);1");
 let seen = false; for (let i = 0; i < 60 && !await ev('window.__lvd'); i++) {
  if (await ev("$('#bCard').classList.contains('lvlc')&&!$('#bCard').hidden")) { if (!seen && r === 0) { await wait(900); await shot('p3_levelup.png'); } seen = true; }
  const ch = await ev("[...document.querySelectorAll('#bMenu .mv')].map(b=>b.textContent)"); if (ch.length === 5 && ch[4].includes('Nicht')) { await ev(`document.querySelectorAll('#bMenu .mv')[${r === 2 ? 4 : r}].click()`); await wait(200); continue; }
  await page.mouse.click(210, 420); await wait(220); }
 if (!seen) throw new Error('keine Werte-Karte'); const mv = await ev('G.team[0].moves.map(m=>m.id)'); if (r < 2 && !mv.includes('donner')) throw new Error('nicht gelernt ' + mv); if (r === 2 && mv.includes('donner')) throw new Error('trotz Ablehnung gelernt');
 } finally { await ev("window.__lvd=0;if(B)endBattle('run')"); } await advUntilWorld(); await clean('world'); });
// --- Entwicklung ---
const evoRun = async (setup, hold, file) => { await ev(setup); let shotDone = false; const t0 = Date.now();
 if (hold) { await wait(2700); await page.mouse.move(210, 300); await page.mouse.down(); await wait(950); if (file) { await shot(file); shotDone = true; } await page.mouse.up(); }
 else if (file) { await wait(3300); await shot(file); shotDone = true; }
 for (let i = 0; i < 80; i++) { if (await ev("!document.querySelector('.evoOv')&&mode!=='wait'")) break; await wait(150); }
 await advUntilWorld(); await wait(250); await advUntilWorld(); return Date.now() - t0; };
for (let r = 0; r < 3; r++) await step(`Entwicklung Level #${r + 1}`, async () => { await evoRun("G.team=[mk(1,16)];mode='world';evolveNow(G.team[0])", false, r === 0 ? 'p3_evolve.png' : null); if (await ev('G.team[0].s') !== 2) throw new Error('s=' + await ev('G.team[0].s')); await clean('world'); });
for (let r = 0; r < 3; r++) await step(`Entwicklung Kristall (Halten bricht nicht ab) #${r + 1}`, async () => { await evoRun("G.team=[mk(14,10)];G.bag.donnerstein=1;openMenu('bag');chooseFor('donnerstein');document.querySelector('#mBody .grid .mon:not([disabled])').click()", true, r === 0 ? 'p3_evolve_kristall.png' : null); if (await ev('G.team[0].s') !== 15) throw new Error('s=' + await ev('G.team[0].s')); if (await ev('G.bag.donnerstein')) throw new Error('Kristall nicht verbraucht'); await clean('world'); });
for (let r = 0; r < 3; r++) await step(`Entwicklung Abbruch #${r + 1}`, async () => { await evoRun("G.team=[mk(1,16)];mode='world';evolveNow(G.team[0])", true, r === 0 ? 'p3_evolve_abbruch.png' : null); if (await ev('G.team[0].s') !== 1) throw new Error('nicht abgebrochen'); if (await ev('G.team[0]._evoNo') !== 16) throw new Error('_evoNo fehlt'); await clean('world'); });
await step('Entwicklung nach Kampf (Level-up → Loddo)', async () => { await ev("G.team=[mk(1,15)];G.team[0].hp=stat(G.team[0],'hp')"); await battle(10); await ev("giveXp(G.team[0],16**3-G.team[0].xp).then(()=>endBattle('win'));1"); for (let i = 0; i < 80 && await ev('G.team[0].s') !== 2; i++) { if (await ev("!!document.querySelector('.evoOv')")) await wait(200); else if (await ev("[...document.querySelectorAll('#bMenu .mv')].some(b=>/Nicht lernen/.test(b.textContent))")) await ev("[...document.querySelectorAll('#bMenu .mv')].find(b=>/Nicht lernen/.test(b.textContent)).click()"); else { await page.mouse.click(210, 420); await wait(200); } } for (let i = 0; i < 60 && await ev("!!document.querySelector('.evoOv')"); i++) await wait(150); await advUntilWorld(); if (await ev('G.team[0].s') !== 2) throw new Error('keine Entwicklung'); await clean('world'); });
// --- Heilstation ---
for (let r = 0; r < 3; r++) await step(`Heilstation #${r + 1}`, async () => { await ev("G.team=[mk(1,12),mk(4,9),mk(10,6),mk(31,7)];G.team.forEach((m,i)=>{m.hp=1;m.capsule=['kapsel','superk','herzkapsel','netz'][i]});G.ret={map:'kupferhain',x:5,y:10};loadMap('heil_kupfer');mode='world';talk(NPCS.heil_kupfer[0])");
 await wait(150); await page.click('#dlgOpts button'); if (r === 0) { await wait(1500); await shot('p3_heal.png'); }
 for (let i = 0; i < 60 && await ev("!!document.querySelector('.healOv')"); i++) await wait(100); await wait(100); await advUntilWorld();
 if (!await ev("G.team.every(m=>m.hp===stat(m,'hp'))")) throw new Error('nicht geheilt'); await clean('world'); });
await step('Heil-Item im Kampf', async () => { await ev("G.team=[mk(1,12)];G.team[0].hp=3;G.bag.trank=2"); await battle(10); await ev("turn({k:'item',item:'trank',i:0});1"); await wait(300); if (!await ev('!!(B&&B.healFx)')) throw new Error('kein healFx'); await tapUntil("B&&!B.busy&&document.querySelector('#bMenu .big')", 40, 250); await ev("endBattle('run')"); await clean('world'); });
// Galerie aller Kapseln
await step('Kapsel-Galerie', async () => { await ev(`(()=>{const d=document.createElement('div');d.id='capGal';d.style.cssText='position:fixed;inset:0;z-index:99;background:#f4f7fb;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px;align-content:start;font:600 11px system-ui';
 for(const id in CAPSULES){const C=CAPSULES[id],b=document.createElement('div');b.style.cssText='background:#fff;border-radius:12px;padding:6px;text-align:center';b.appendChild(capIconCanvas(id,64));const s=document.createElement('div');s.textContent=C.n;b.appendChild(s);const s2=document.createElement('div');b.appendChild(s2);s2.style.opacity=.6;s2.textContent='klein:';s2.appendChild(capIconCanvas(id,20));d.appendChild(b);}document.body.appendChild(d);})()`); await wait(200); await shot('p3_capsules.png'); await ev("$('#capGal').remove()"); });
console.log('\n' + (fails.length ? fails.join('\n') : 'Alle Sequenz-Tests bestanden.'));
await browser.close(); process.exit(fails.length ? 1 : 0);
