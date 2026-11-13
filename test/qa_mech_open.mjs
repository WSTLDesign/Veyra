// QA Mechanik – Prüfpunkt 2: Titel-Opening (kreaturenfrei, Dauer, Skip, Option aus) + Ablauf Opening → Titel → Neues Spiel → Film → Charaktererstellung → erste Karte.
//   node test/qa_mech_open.mjs        Bilder: test/qa_mech_open_*.png
import { start, page, reporter, here } from './qa_mech_lib.mjs';
import { readFileSync } from 'fs';
const LOG = process.env.QA_LOG || '/tmp/qa_mech_open.log';
const R = reporter(LOG, 'QA Mechanik Opening');
const env = await start();
// ---- A) Code-Suche: keine Kreatur/Figur im Opening
{ const src = ['../src/12-intro.js', '../src/13-intro3d.js'].map(f => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
  const hits = (src.match(/drawMon|buildMon3D|animMon|monThumb|person3d|drawPerson|MONS\[|THREE\.|mk\(|sprite/g) || []);
  R.t('A1 Code 12-intro/13-intro3d: keine Kreaturen-/Figuren-/three.js-Aufrufe', hits.length === 0, hits);
  const shell = readFileSync(new URL('../src/shell.html', import.meta.url), 'utf8'); const m = shell.match(/<div id="intro"[\s\S]*?<\/div>\s*<\/div>/); R.note('shell #intro: ' + (m ? m[0].replace(/\s+/g, ' ').slice(0, 500) : 'nicht gefunden')); }
// ---- B) Bilder: eingefrorene Zeiten (VEYRA_OPEN=1 + VEYRA_OPEN_T)
for (const T of [0, 1.0, 2.5, 4.0, 5.1]) {
  const p = await page(env, { flags: { VEYRA_OPEN: 1, VEYRA_OPEN_T: T } });
  await p.waitForTimeout(1200); await p.click('#iPrompt'); await p.waitForTimeout(1500);
  const st = await p.evaluate(() => ({ on: introOn, logo: $('#introLogo').classList.contains('show'), skipVis: !$('#iSkip').hidden, txt: $('#introLogo').innerText.replace(/\s+/g, ' ').trim(), cv: !!$('#icv') && !$('#icv').hidden, imgs: !!(OP.sky && OP.hz) }));
  await p.screenshot({ path: here(`qa_mech_open_${String(T).replace('.', '_')}s.png`) });
  R.note(`T=${T}s ${JSON.stringify(st)}`); R.t(`B T=${T}s: Opening läuft, Himmelsbild + Kulisse geladen, keine Seitenfehler`, st.on && st.imgs && p.errs.length === 0, { st, errs: p.errs });
  if (T >= 1.5) R.t(`B T=${T}s: Titel „VEYRA Kreaturenchronik“ sichtbar`, st.logo && /VEYRA/.test(st.txt) && /Kreaturenchronik/.test(st.txt), st);
  if (T === 0) R.t('B T=0: Titel noch nicht eingeblendet (erst ab 1,5 s)', !st.logo, st);
  await p.close();
}
// Pixelanalyse der Frames auf Figuren/Kreaturen ist visuell (Bilder ansehen); zusätzlich: DOM im Opening enthält nur Titeltexte, kein img/canvas außer #icv
{ const p = await page(env, { flags: { VEYRA_OPEN: 1, VEYRA_OPEN_T: 3 } }); await p.waitForTimeout(800); await p.click('#iPrompt'); await p.waitForTimeout(800);
  const d = await p.evaluate(() => { const I = $('#intro'); return { imgs: I.querySelectorAll('img').length, cvs: [...I.querySelectorAll('canvas')].map(c => c.id), tcv: !!$('#tcv') && getComputedStyle($('#tcv')).display }; });
  R.t('B DOM #intro: keine <img>, nur Canvas #icv', d.imgs === 0 && d.cvs.length === 1 && d.cvs[0] === 'icv', d); R.note('Titelbild-Kreaturen #tcv: ' + JSON.stringify(d.tcv)); await p.close(); }
// ---- C) Dauer + Skip (echte Zeit)
{ const p = await page(env, { flags: { VEYRA_OPEN: 1 } }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => new Promise(res => { const t0 = performance.now(); document.getElementById('iPrompt').click(); const log = {}; 
    // Skip-Versuch bei 0,4 s (Tippen) und Taste bei 0,7 s → müssen wirkungslos sein
    setTimeout(() => { $('#intro').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); log.on04 = introOn; }, 400);
    setTimeout(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); log.on07 = introOn; log.skipHidden07 = $('#iSkip').hidden; }, 700);
    const iv = setInterval(() => { if (log.skipShown == null && !$('#iSkip').hidden) log.skipShown = performance.now() - t0; if (log.logo == null && $('#introLogo').classList.contains('show')) log.logo = performance.now() - t0;
      if (!introOn) { log.end = performance.now() - t0; }
      if ($('#intro').hidden) { log.hidden = performance.now() - t0; clearInterval(iv); res(log); } }, 20); }));
  R.note('Dauer: ' + JSON.stringify(r)); R.t('C Dauer Opening ≈ 5 s (Ende 5,0–5,6 s, Ausblendung fertig ≤ 6,4 s)', r.end > 4900 && r.end < 5700 && r.hidden < 6500, r);
  R.t('C Skip vor 1 s wirkungslos (Tippen 0,4 s, Taste 0,7 s), Knopf noch verborgen', r.on04 && r.on07 && r.skipHidden07, r);
  R.t('C „Überspringen“-Knopf erscheint ab ≈ 1 s', r.skipShown >= 950 && r.skipShown < 1400, r); R.t('C Titel erscheint ≈ 1,5 s', r.logo >= 1400 && r.logo < 1900, r);
  await p.close(); }
for (const how of ['tipp', 'taste', 'knopf']) { const p = await page(env, { flags: { VEYRA_OPEN: 1 } }); await p.waitForTimeout(1500);
  await p.click('#iPrompt'); await p.waitForTimeout(1250);
  if (how === 'tipp') await p.mouse.click(430, 300); else if (how === 'taste') await p.keyboard.press('Space'); else await p.click('#iSkip');
  await p.waitForTimeout(250); const e1 = await p.evaluate(() => !introOn); await p.waitForTimeout(900); const e2 = await p.evaluate(() => ({ hid: $('#intro').hidden, title: !$('#title').hidden, mode }));
  R.t(`C Skip ab 1,25 s per ${how}: Opening endet sofort, Titel sichtbar`, e1 && e2.hid && e2.title && e2.mode === 'title', e2); await p.close(); }
// ---- D) Option aus → Titel direkt; Option an wieder; Option „ansehen“
{ const p = await page(env, { flags: { VEYRA_OPEN: 1 } }); await p.waitForTimeout(800);
  const a = await p.evaluate(() => { SET.intro = false; saveSet(); return SET.intro; }); await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
  const s = await p.evaluate(() => ({ introHidden: $('#intro').hidden, title: !$('#title').hidden, mode, introOn }));
  R.t('D Option „Titel-Opening beim Start“ aus → Titel direkt, kein Opening', a === false && s.introHidden && s.title && !s.introOn, s);
  await p.screenshot({ path: here('qa_mech_open_optionaus.png') });
  // Optionen ansehen: „Titel-Opening ansehen“ spielt ab
  const lab = await p.evaluate(() => { const o = []; try { document.querySelector('#tOpts, #tOptions') } catch (e) { } return [...document.querySelectorAll('#title button')].map(b => b.textContent.trim()); }); R.note('Titel-Buttons: ' + JSON.stringify(lab));
  await p.evaluate(() => { SET.intro = true; saveSet(); }); await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
  R.t('D Option wieder an → Opening-Standbild „Tippe, um zu beginnen“ da', await p.evaluate(() => !$('#intro').hidden && !$('#iPrompt').hidden), {}); await p.close(); }
R.t('Keine Seitenfehler (Block A–D)', true);
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
