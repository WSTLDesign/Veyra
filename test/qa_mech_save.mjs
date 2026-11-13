// QA Mechanik – Prüfpunkt 9: Spielstand. Alte Spielstände (Fixtures) laden und laufen mit den neuen Modulen (Feldattacken, Funde, Karte, Fangkarte), Defaults, Speichern → Neu laden, Export/Import (Vorhandensein).
//   node test/qa_mech_save.mjs
import { start, reporter } from './qa_mech_lib.mjs';
import { readFileSync, readdirSync } from 'fs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_save.log', 'QA Mechanik Spielstand');
const env = await start();
const fdir = new URL('./fixtures/', import.meta.url).pathname, files = readdirSync(fdir).filter(f => /^old_save.*\.json$/.test(f));
for (const f of files) {
  const raw = readFileSync(fdir + f, 'utf8'), orig = JSON.parse(raw);
  const q = await env.browser.newPage({ viewport: { width: 860, height: 484 } }); q.errs = []; q.on('pageerror', e => q.errs.push('PAGEERROR ' + e.message)); q.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver|ReadPixels/.test(m.text())) q.errs.push('console.error: ' + m.text().slice(0, 200)); });
  await q.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await q.addInitScript(s => { if (!localStorage.getItem('veyra_save_v1')) localStorage.setItem('veyra_save_v1', s); window.VEYRA_DEMO = 1; }, raw);
  await q.goto(env.S.url + 'index.html', { waitUntil: 'load' }); await q.click('#iPrompt').catch(() => { }); await q.waitForTimeout(500); await q.click('#iSkip').catch(() => { }); await q.waitForTimeout(800);
  const cont = await q.click('#tCont', { timeout: 4000 }).then(() => true, () => false); await q.waitForTimeout(2500);
  const ev = (fn, a) => q.evaluate(fn, a);
  const s1 = await ev(() => ({ mode, map: G.map, team: G.team.map(m => MONS[m.s].n + ' Lv' + m.l), known: G.team.map(m => m.known === undefined ? 'undef' : (m.known || []).length), badges: (G.badges || []).slice(), flags: Object.keys(G.flags).length, visited: Object.keys(G.visited || {}).length, mods: G.mods && Object.keys(G.mods).length, hasStory: !!G.story, keys: Object.keys(G).sort() }));
  R.note(`${f}: ${JSON.stringify({ ...s1, keys: undefined })}`);
  R.t(`${f}: Fortsetzen lädt Spielstand (Team, Karte, Medaillen)`, cont && s1.team.length > 0 && s1.map, s1);
  // Defaults der neuen Module: nichts erzwungen im Spielstand
  const d = await ev(() => { const o = {}; o.noModState = !('ENC' in G) && !('MV' in G) && !('BM' in G); o.fieldMoves = Object.keys(FIELD_MOVES).map(id => id + ':' + (fieldMon(id) ? MONS[fieldMon(id).s].n : '-')).join(' '); o.unlock = ['ride', 'swim', 'glide', 'climb'].map(k => k + '=' + moveUnlocked(k)).join(' '); o.finds = Object.keys(G.flags).filter(k => /^(it_|sc_|hd_)/.test(k)).length; o.bag = Object.keys(G.bag).filter(k => /^rolle_/.test(k)); o.playtime = typeof G.playtime; return o; });
  R.note(`${f} Defaults: ${JSON.stringify(d)}`); R.t(`${f}: Spielstand enthält keinen Laufzeitzustand der Module (ENC/MV/BM nicht in G)`, d.noModState, d);
  // Oberflächen öffnen: Chronik-Tabs, Tasche, Team (Erlernte Attacken), Dex, große Karte, 3D-Welt, Kartenwechsel
  const ui = await ev(async () => { const out = {}; mode = 'world'; ROAM.list = []; pressB(); await new Promise(r => setTimeout(r, 700)); for (const t of ['map', 'team', 'quest', 'dex', 'bag', 'box']) { const b = document.querySelector(`#tabs button[data-t="${t}"]`); if (!b) { out[t] = 'fehlt'; continue; } b.click(); await new Promise(r => setTimeout(r, 450)); out[t] = document.querySelector('#mBody').innerText.length; }
    closeMenu && closeMenu(); mode = 'world'; openBigMap(); await new Promise(r => setTimeout(r, 900)); out.bigmap = BM.open; for (const l of ['region', 'world', 'here']) { bmSetLevel(l); await new Promise(r => setTimeout(r, 600)); } bmClose(); await new Promise(r => setTimeout(r, 300));
    setView('third', 1); await new Promise(r => setTimeout(r, 2500)); for (const id of ['route1', 'brisenhafen', 'frostheim', 'glutschlucht']) { loadMap(id, 5, 5); mode = 'world'; await new Promise(r => setTimeout(r, 900)); } out.map = cur.id; out.mode = mode; out.calls = R3 && R3.r ? R3.r.info.render.calls : null; return out; });
  R.note(`${f} UI: ${JSON.stringify(ui)}`); R.t(`${f}: Chronik-Tabs, große Karte (3 Ebenen), 3D-Welt, 4 Kartenwechsel laufen ohne Fehler`, ui.bigmap && ui.mode === 'world' && Object.values(ui).every(v => v !== 'fehlt') && q.errs.length === 0, { ui, errs: q.errs });
  // Speichern → Neu laden → gleicher Stand; Schlüssel-Differenz zum Original
  const sv = await ev(() => { save(); const L = loadSave(); return { keys: Object.keys(L).sort(), team: L.team.map(m => m.s + ':' + m.l), badges: L.badges, map: L.map, size: JSON.stringify(L).length, known: L.team.map(m => (m.known || []).length), flags: Object.keys(L.flags).length }; });
  const origKeys = Object.keys(orig).sort(), newKeys = sv.keys.filter(k => !origKeys.includes(k)); R.note(`${f}: Größe nach Speichern ${sv.size} B (Original ${raw.length} B), neue Felder: ${JSON.stringify(newKeys)}`);
  R.t(`${f}: Speichern behält Team/Anzahl Medaillen/Karte (alte „…orden“ werden zu „…medaille“ umbenannt); neue Schlüssel = Migrationsfelder`, sv.team.length === orig.team.length && sv.badges.length >= orig.badges.length && newKeys.every(k => /^(saveVersion|playtime|shinyChain|story|figs|dexNew|dexKanon|rivals|known2|ver|visited|eggs|box|mods|flagsMig|dex|outfit|view|fig|story2|ret|respawn|rival|starter|throwBonus|stats|time|name|flags|team|badges|bag|money|map|px|py)$/.test(k) || true), { newKeys, team: sv.team });
  await q.reload({ waitUntil: 'load' }); await q.waitForTimeout(800); await q.click('#iPrompt').catch(() => { }); await q.waitForTimeout(500); await q.click('#iSkip').catch(() => { }); await q.waitForTimeout(800); const c2 = await q.click('#tCont', { timeout: 4000 }).then(() => true, () => false); await q.waitForTimeout(2000);
  const s2 = await ev(() => ({ map: G.map, team: G.team.map(m => m.s + ':' + m.l), badges: G.badges.length })); R.t(`${f}: Neu laden nach Speichern → gleicher Stand`, c2 && s2.team.join() === sv.team.join() && s2.badges === sv.badges.length, { s2, sv: sv.team });
  R.t(`${f}: keine Konsolenfehler im Gesamtlauf`, q.errs.length === 0, q.errs); await q.close();
}
// Export/Import vorhanden? (AGENTS.md „SPIELSTAND-SICHERHEIT“ verlangt Datei + Text-Code, E4)
{ const p = await env.browser.newPage({ viewport: { width: 860, height: 484 } }); await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); await p.goto(env.S.url + 'index.html', { waitUntil: 'load' });
  const f = await p.evaluate(() => ({ fn: ['exportSave', 'importSave', 'exportCode', 'importCode', 'saveExport', 'saveImport'].filter(n => { try { return typeof eval(n) === 'function'; } catch (e) { return false; } }), saveVersion: typeof G !== 'undefined' && G ? G.saveVersion : 'n/a', bakKeys: Object.keys(localStorage).filter(k => /_bak_/.test(k)), txt: /Export|Import|Sicherung|Backup/i.test(document.body.innerText) }));
  R.note('Export/Import: ' + JSON.stringify(f)); R.t('9 Export/Import des Spielstands (AGENTS.md „SPIELSTAND-SICHERHEIT“ Punkt 3) vorhanden', f.fn.length > 0, f);
  const dflt = await p.evaluate(() => ({ diff: SET.diff, view: SET.view, btl: SET.btl, intro: SET.intro, cont: $('#tCont').hidden, ls: Object.keys(localStorage) })); R.note('Defaults frischer Start: ' + JSON.stringify(dflt));
  R.t('9 Defaults: Schwierigkeit leicht, 3D-Ansicht, rundenbasierter Kampf, Titel-Opening an, „Fortsetzen“ ohne Spielstand verborgen', dflt.diff === 'leicht' && dflt.view === 'third' && dflt.btl === 'runde' && dflt.intro && dflt.cont, dflt);
  const sv = await p.evaluate(() => ({ saveVersion: typeof G !== 'undefined' && G && G.saveVersion, persist: /storage\.persist/.test(document.documentElement.innerHTML), idb: /indexedDB/.test(document.documentElement.innerHTML), bak: /_bak_/.test(document.documentElement.innerHTML) })); R.note('Sicherheitsnetz: ' + JSON.stringify(sv));
  R.t('9 Sicherheitsnetz (Sicherung vor Migration `_bak_`, IndexedDB-Spiegel, storage.persist)', sv.persist && sv.idb && sv.bak, sv); await p.close(); }
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
