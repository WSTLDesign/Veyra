// QA Gegenprüfung Runde 1 – Punkt 9 Spielstand (ein Chromium):  node test/qa_savesafe_r1.mjs
// a) Altstand ohne saveVersion → Sicherung _bak_*, max. 3 · b) kaputtes JSON → Sicherung / IndexedDB / Hinweis, nie stilles Neues Spiel
// c) Export-Code → Import in frischem Profil stellt Team wieder her; Müll wird abgelehnt · d) leeres Objekt wird nie gespeichert
// e) Altstand mit „flammenrad“ → „glutwirbel“ in Team/Box/Tasche/Flag
import { start, reporter } from './qa_mech_lib.mjs';
import { readFileSync } from 'fs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_savesafe_r1.log', 'QA Gegenprüfung R1 – Spielstand');
const env = await start();
const fx = n => readFileSync(new URL('./fixtures/' + n, import.meta.url), 'utf8');
const RAW = fx('old_save_4orden.json'), orig = JSON.parse(RAW);
const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver|ReadPixels/;
const mkCtx = async () => { const ctx = await env.browser.newContext({ viewport: { width: 860, height: 484 } }); const p = await ctx.newPage(); p.setDefaultTimeout(15000); p.setDefaultNavigationTimeout(180000); p.errs = [];
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push(m.text().slice(0, 200)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' })); return { ctx, p }; };
const boot = async p => { await p.goto(env.S.url + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(700); await p.click('#iPrompt').catch(() => { }); await p.waitForTimeout(400); await p.click('#iSkip').catch(() => { }); await p.waitForTimeout(1200); };
const cont = async p => { const ok = await p.click('#tCont', { timeout: 3000 }).then(() => true, () => false); await p.waitForTimeout(1800); return ok; };
const baks = p => p.evaluate(() => Object.keys(localStorage).filter(k => /_bak_/.test(k) && !/_bak_list$/.test(k)));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- a) Altstand ohne saveVersion + max. 3 Sicherungen ----------
{ const { ctx, p } = await mkCtx(); await boot(p);
  R.t('a0 Fixture hat keine saveVersion (echter Altstand)', orig.saveVersion === undefined);
  await p.evaluate(r => localStorage.setItem('veyra_save_v1', r), RAW); await boot(p); const c = await cont(p);
  const s = await p.evaluate(() => ({ sv: G.saveVersion, gid: !!G.gid, av: G.appVer, team: G.team.length, badges: G.badges.slice() }));
  const b1 = await baks(p); R.note('Sicherungen nach 1. Laden: ' + b1.join(','));
  R.t('a1 Altstand wird geladen (Fortsetzen, Team, saveVersion gesetzt)', c && s.sv >= 1 && s.gid && s.team === orig.team.length, s);
  R.t('a2 Sicherung veyra_save_v1_bak_* entstanden', b1.length >= 1, b1);
  const bk0 = await p.evaluate(() => { const v = localStorage.getItem('veyra_save_v1_bak_0'); if (!v) return null; const g = JSON.parse(v); return { sv: g.saveVersion, team: g.team.length, badges: g.badges }; });
  R.t('a3 _bak_0 ist der unveränderte Altstand (keine saveVersion, alte „…orden“-Namen)', bk0 && bk0.sv === undefined && bk0.badges.some(x => /orden/.test(x)), bk0);
  // mehrere „Updates“ simulieren: appVer ändert sich → je eine Sicherung „vor Update“
  for (let i = 1; i <= 5; i++) { await p.evaluate(i => { const g = JSON.parse(localStorage.getItem('veyra_save_v1')); g.appVer = 'alt' + i; g.saveVersion = 1; g.flags['qa_n' + i] = 1; localStorage.setItem('veyra_save_v1', JSON.stringify(g)); }, i); await boot(p); await cont(p); }
  const bN = await baks(p), lst = await p.evaluate(() => JSON.parse(localStorage.getItem('veyra_save_v1_bak_list') || '[]').length);
  R.note('Sicherungen nach 5 weiteren Updates: ' + bN.join(',') + ' · Liste ' + lst);
  R.t('a4 Höchstens 3 Sicherungen (localStorage-Schlüssel und Liste)', bN.length <= 3 && bN.length >= 2 && lst <= 3, { bN, lst });
  R.t('a5 keine Konsolenfehler', p.errs.length === 0, p.errs); await ctx.close(); }

// ---------- b) kaputtes JSON ----------
{ const { ctx, p } = await mkCtx(); await boot(p);
  await p.evaluate(r => localStorage.setItem('veyra_save_v1', r), RAW); await boot(p); await cont(p);
  await p.evaluate(() => { save(); }); await p.waitForTimeout(600);
  const good = await p.evaluate(() => localStorage.getItem('veyra_save_v1')); const idb0 = await p.evaluate(() => ssMirrorGet().then(m => !!m));
  R.t('b0 Speichern spiegelt in IndexedDB', idb0);
  // b1: kaputt + Sicherung vorhanden → Sicherung
  await p.evaluate(() => localStorage.setItem('veyra_save_v1', '{"map":"route1","team":[{"s":1'));
  await boot(p);
  const b1 = await p.evaluate(() => ({ cont: !document.getElementById('tCont').hidden, note: (document.getElementById('ssNote') || {}).textContent || '', ls: localStorage.getItem('veyra_save_v1'), kap: !!localStorage.getItem('veyra_save_v1_kaputt') }));
  R.t('b1 kaputt + Sicherung → Stand aus Sicherung, Hinweis sichtbar, Fortsetzen sichtbar, Rohstand aufgehoben', b1.cont && /icherung/.test(b1.note) && b1.kap && b1.ls && b1.ls.length > 100 && JSON.parse(b1.ls).team.length === orig.team.length, { note: b1.note.slice(0, 100), cont: b1.cont, kap: b1.kap });
  await p.evaluate(() => { const b = [...document.querySelectorAll('#ssNote button')].find(b => /Weiterspielen/.test(b.textContent)); if (b) b.click(); }); await p.waitForTimeout(1800); R.t('b1b Hinweis-Knopf „Weiterspielen“ startet das gerettete Spiel (Team vollständig)', await p.evaluate(() => G && mode !== 'title' && G.team.length) === orig.team.length);
  // b2: kaputt, keine Sicherungen → IndexedDB
  await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (/_bak_/.test(k)) localStorage.removeItem(k); localStorage.setItem('veyra_save_v1', 'KAPUTT{{'); });
  await boot(p);
  const b2 = await p.evaluate(() => ({ cont: !document.getElementById('tCont').hidden, note: (document.getElementById('ssNote') || {}).textContent || '', ls: (localStorage.getItem('veyra_save_v1') || '').slice(0, 5) }));
  R.t('b2 kaputt, ohne Sicherung → IndexedDB-Spiegel stellt her (Hinweis, Fortsetzen)', b2.cont && b2.ls === '{"map' && b2.note.length > 5, b2);
  // b3: alles weg außer kaputtem Rohstand → Hinweis, kein stilles Neues Spiel
  await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (/_bak_/.test(k)) localStorage.removeItem(k); localStorage.setItem('veyra_save_v1', 'KAPUTT{{'); return ssIdbOp('del', 'veyra_save_v1'); });
  await boot(p);
  const b3 = await p.evaluate(() => ({ note: (document.getElementById('ssNote') || {}).textContent || '', ls: localStorage.getItem('veyra_save_v1'), kap: localStorage.getItem('veyra_save_v1_kaputt'), mode, cont: !document.getElementById('tCont').hidden }));
  R.t('b3 nichts rettbar → Hinweis-Seite, Rohstand bleibt (nicht gelöscht, nicht überschrieben)', b3.note.length > 10 && b3.ls === 'KAPUTT{{' && b3.mode === 'title', b3);
  await p.click('#tNew').catch(() => { }); await p.waitForTimeout(500);
  const b3b = await p.evaluate(() => ({ ls: localStorage.getItem('veyra_save_v1'), kap: localStorage.getItem('veyra_save_v1_kaputt') }));
  R.note('Nach „Neues Spiel“ direkt: ' + JSON.stringify({ ls: (b3b.ls || '').slice(0, 20), kap: (b3b.kap || '').slice(0, 20) }));
  R.t('b3b Rohstand weiter irgendwo erhalten (veyra_save_v1 oder _kaputt)', (b3b.ls || '').includes('KAPUTT') || (b3b.kap || '').includes('KAPUTT'), b3b);
  R.t('b4 keine Konsolenfehler', p.errs.length === 0, p.errs); await ctx.close(); }

// ---------- c) Export → Import ----------
let CODE, CODEJSON;
{ const { ctx, p } = await mkCtx(); await boot(p); await p.evaluate(r => localStorage.setItem('veyra_save_v1', r), RAW); await boot(p); await cont(p);
  CODE = await p.evaluate(() => { save(); return saveCode(localStorage.getItem('veyra_save_v1')); }); CODEJSON = await p.evaluate(() => localStorage.getItem('veyra_save_v1'));
  R.note('Code-Länge ' + CODE.length + ' Zeichen, Präfix ' + CODE.slice(0, 7) + ' (Spielstand ' + CODEJSON.length + ' B)'); R.t('c0 Export-Code erzeugt (VEYRA1./VEYRA0.)', /^VEYRA[01]\.[A-Za-z0-9+/=]+$/.test(CODE)); await ctx.close(); }
{ const { ctx, p } = await mkCtx(); await boot(p);
  R.t('c1 frisches Profil: kein Spielstand', await p.evaluate(() => localStorage.getItem('veyra_save_v1')) === null && await p.evaluate(() => document.getElementById('tCont').hidden));
  const garbage = ['', '   ', 'hallo welt', 'VEYRA1.%%%%', 'VEYRA1.kaputt', 'VEYRA1.' + CODE.slice(7, 60), 'VEYRA9.AAAA', '{}', '{"a":1}', '[]', '{"map":"x","team":"nein"}', 'null', '{"map":"route1","team":[],"flags":{}}', CODE.slice(0, CODE.length - 30)];
  const rej = await p.evaluate(async gs => { const o = []; for (const t of gs) { let r; try { r = await saveDecode(t); } catch (e) { r = { err: 'EXC ' + e.message }; } o.push([t.slice(0, 18), !!r.err, r.err || '']); } return o; }, garbage);
  R.note('Müll-Eingaben: ' + JSON.stringify(rej.map(x => [x[0], x[1]])));
  R.t('c2 Müll wird abgelehnt (Decode liefert Fehler, kindgerechter Text, keine Ausnahme)', rej.every(x => x[1] && x[2] && !/EXC/.test(x[2])), rej.filter(x => !x[1] || /EXC/.test(x[2])));
  R.t('c2b nach Müll-Import bleibt Speicher leer', await p.evaluate(() => localStorage.getItem('veyra_save_v1')) === null);
  // Import über die echte Oberfläche (Titel › Optionen › Erweitert › Code einfügen)
  await p.evaluate(() => { rSettings._adv = 1; const o = document.getElementById('opts'); o.hidden = false; rSettings(o); }); await p.waitForTimeout(500);
  const clickPill = t => p.evaluate(t => { const b = [...document.querySelectorAll('details.adv .ssRow .pill, details.adv .ssAsk .pill')].find(b => b.textContent === t && b.offsetParent !== null); if (b) b.click(); return !!b; }, t);
  await p.evaluate(() => { const d = document.querySelector('details.adv'); if (d) d.open = true; });
  R.t('c3 UI: „Code einfügen“ im Titel-Optionsmenü erreichbar', await clickPill('Code einfügen')); await p.waitForTimeout(200);
  const ta = p.locator('details.adv .ssCode:not([readonly])'); await ta.fill('Das ist Müll'); await clickPill('Prüfen'); await p.waitForTimeout(500);
  R.t('c3b UI: Müll → Fehlermeldung, keine Abfrage, Speicher leer', await p.evaluate(() => !!document.querySelector('details.adv .ssMsg.bad') && document.querySelector('details.adv .ssAsk').hidden && localStorage.getItem('veyra_save_v1') === null));
  await ta.fill(CODE); await clickPill('Prüfen'); await p.waitForFunction(() => { const a = document.querySelector('details.adv .ssAsk'); return a && !a.hidden; }, null, { timeout: 8000 }).catch(() => { });
  const ask = await p.evaluate(() => { const a = document.querySelector('details.adv .ssAsk'); return a && !a.hidden ? a.textContent : ''; });
  R.t('c4 UI: gültiger Code → Abfrage mit Zusammenfassung', /Gefunden/.test(ask), ask);
  await clickPill('Ja, laden'); await p.waitForTimeout(1800);
  const after = await p.evaluate(() => { const g = JSON.parse(localStorage.getItem('veyra_save_v1') || 'null'); return g && { team: g.team.map(m => m.s + ':' + m.l).join(), name: g.name, badges: g.badges.length, box: (g.box || []).length }; });
  const want = JSON.parse(CODEJSON);
  R.t('c5 Import stellt Team/Name/Medaillen/Box wieder her (frisches Profil)', after && after.team === want.team.map(m => m.s + ':' + m.l).join() && after.name === want.name && after.badges === want.badges.length, { after, name: want.name });
  await boot(p); const c = await cont(p); const live = await p.evaluate(() => ({ team: G.team.map(m => MONS[m.s].n + ' Lv' + m.l).join(), map: G.map, mode }));
  R.t('c6 Nach Neustart: Fortsetzen → importiertes Team spielbar', c && live.team.split(',').length === want.team.length, live);
  // JSON-Datei-Import (Textpfad)
  const jd = await p.evaluate(raw => saveDecode(raw).then(r => !!r.g), CODEJSON); R.t('c7 reines JSON (Datei) wird ebenfalls erkannt', jd);
  R.t('c8 keine Konsolenfehler', p.errs.length === 0, p.errs); await ctx.close(); }

// ---------- d) leeres Objekt wird nie gespeichert ----------
{ const { ctx, p } = await mkCtx(); await boot(p); await p.evaluate(r => localStorage.setItem('veyra_save_v1', r), RAW); await boot(p); await cont(p);
  await p.evaluate(() => save()); const good = await p.evaluate(() => localStorage.getItem('veyra_save_v1'));
  const r = await p.evaluate(() => { const o = {}; o.w1 = saveWrite('{}'); o.w2 = saveWrite('null'); o.w3 = saveWrite('{"a":1}'); o.w4 = saveWrite(''); o.w5 = saveWrite('[]'); const keep = G; G = {}; try { save(); } catch (e) { o.exc = e.message; } o.w7 = localStorage.getItem('veyra_save_v1'); G = null; try { save(); } catch (e) { } o.w8 = localStorage.getItem('veyra_save_v1'); G = keep; o.im = saveImport('{}'); o.im2 = saveImport('xx'); o.final = localStorage.getItem('veyra_save_v1'); o.bakBefore = Object.keys(localStorage).filter(k => /_bak_/.test(k)).length; o.w6 = saveWrite('{"map":"x","team":[],"flags":{},"dex":{}}'); o.afterW6 = (localStorage.getItem('veyra_save_v1') || '').length; o.gross = !!localStorage.getItem('veyra_save_v1_bak_gross'); return o; });
  R.note('saveWrite({}/null/…): ' + JSON.stringify({ w1: r.w1, w2: r.w2, w3: r.w3, w4: r.w4, w5: r.w5, w6: r.w6, im: r.im, im2: r.im2 }));
  R.t('d1 saveWrite lehnt {} / null / [] / leer / Teilobjekte ab', !r.w1 && !r.w2 && !r.w3 && !r.w4 && !r.w5, r);
  R.t('d2 save() mit G={} oder G=null lässt guten Stand unangetastet', r.w7 === good && r.w8 === good && r.final === good && !r.exc, { exc: r.exc, same: r.w7 === good });
  R.note('Extra: formal gültiger Minimalstand (team=[]) wird geschrieben = ' + r.w6 + '; Sicherung „gross“ vorher angelegt = ' + r.gross);
  R.t('d3 saveImport lehnt {} und Text ab', !r.im && !r.im2);
  // Direkt in localStorage gelegtes '{}' → beim Laden wie kaputt behandelt, nicht still Neues Spiel
  await p.evaluate(() => localStorage.setItem('veyra_save_v1', '{}')); await boot(p);
  const e = await p.evaluate(() => ({ cont: !document.getElementById('tCont').hidden, ls: (localStorage.getItem('veyra_save_v1') || '').length, note: !!document.getElementById('ssNote') }));
  R.t('d4 „{}“ im Speicher wird beim Start durch Sicherung/Spiegel ersetzt (nicht still Neues Spiel)', e.cont && e.ls > 100, e);
  R.t('d5 keine Konsolenfehler', p.errs.length === 0, p.errs); await ctx.close(); }

// ---------- e) Flammenrad → Glutwirbel ----------
{ const { ctx, p } = await mkCtx(); await boot(p); const g = JSON.parse(RAW);
  const known = ['kratzer', 'knurren', 'flammenrad']; g.team[0].moves = [{ id: 'kratzer', pp: 25 }, { id: 'flammenrad', pp: 15 }]; g.team[0].known = known.slice();
  g.team[1].moves = ['flammenrad', 'kratzer']; g.box = [{ s: 4, l: 20, xp: 8000, hp: 50, moves: [{ id: 'flammenrad', pp: 10 }], known: ['flammenrad', 'kratzer'] }, ...(g.box || [])];
  g.bag = { ...g.bag, rolle_flammenrad: 2 }; g.flags = { ...g.flags, sc_flammenrad: 1 }; g.foundItems = ['sc_flammenrad', 'it_x'];
  const raw = JSON.stringify(g); R.t('e0 Fixture enthält „flammenrad“ (Team, Box, Tasche, Flag)', (raw.match(/flammenrad/g) || []).length >= 6);
  await p.evaluate(r => localStorage.setItem('veyra_save_v1', r), raw); await boot(p); const c = await cont(p);
  const s = await p.evaluate(() => { const all = JSON.stringify(G); return { cnt: (all.match(/flammenrad/gi) || []).length, gl: (all.match(/glutwirbel/g) || []).length, m0: G.team[0].moves.map(m => m.id || m), k0: G.team[0].known, m1: G.team[1].moves.map(m => m.id || m), box: JSON.stringify(G.box).includes('glutwirbel') && !JSON.stringify(G.box).includes('flammenrad'), bagOld: G.bag.rolle_flammenrad, bagNew: G.bag.rolle_glutwirbel, flOld: G.flags.sc_flammenrad, flNew: G.flags.sc_glutwirbel, found: G.foundItems, name: (typeof MOVES !== 'undefined' && MOVES.glutwirbel ? MOVES.glutwirbel[0] : null), oldMove: typeof MOVES !== 'undefined' && !!MOVES.flammenrad, bagTxt: (() => { try { return Object.keys(G.bag).map(k => ITEMS[k] ? ITEMS[k].n : k).join('|'); } catch (e) { return ''; } })() }; });
  R.note('Ergebnis: ' + JSON.stringify(s));
  R.t('e1 Team: Attacke und „bekannt“-Liste auf glutwirbel umgeschrieben', c && s.m0.includes('glutwirbel') && !s.m0.includes('flammenrad') && s.k0.includes('glutwirbel') && !s.k0.includes('flammenrad') && s.m1[0] === 'glutwirbel', s);
  R.t('e2 Box umgeschrieben', s.box); R.t('e3 Tasche: rolle_flammenrad → rolle_glutwirbel (Menge 2), alter Schlüssel weg', s.bagNew === 2 && s.bagOld === undefined, s);
  R.t('e4 Flag sc_glutwirbel, foundItems umgeschrieben', s.flNew === 1 && s.flOld === undefined && s.found.includes('sc_glutwirbel') && !s.found.includes('sc_flammenrad'), s);
  R.t('e5 Gesamter Spielstand enthält kein „flammenrad“ mehr; Attackenname „Glutwirbel“, alter Eintrag aus MOVES entfernt', s.cnt === 0 && s.gl >= 5 && s.name === 'Glutwirbel' && !s.oldMove, s);
  const ui = await p.evaluate(async () => { mode = 'world'; ROAM && (ROAM.list = []); openMenu('team'); await new Promise(r => setTimeout(r, 600)); const c0 = document.querySelector('#mBody .grid > *'); if (c0) c0.click(); await new Promise(r => setTimeout(r, 600)); const t1 = document.getElementById('mBody').innerText; openMenu('bag'); await new Promise(r => setTimeout(r, 600)); const t2 = document.getElementById('mBody').innerText; return { team: /Glutwirbel/.test(t1), flam: /flammenrad/i.test(t1 + t2), bag: /Glutwirbel/.test(t2) }; });
  R.t('e6 Sichtbare Texte (Team/Tasche): „Glutwirbel“ ja, „Flammenrad“ nein', ui.team && !ui.flam, ui);
  await p.evaluate(() => { closeMenu(); save(); }); const sv = await p.evaluate(() => localStorage.getItem('veyra_save_v1').includes('flammenrad'));
  R.t('e7 Gespeicherter Stand enthält kein „flammenrad“', !sv);
  R.t('e8 keine Konsolenfehler', p.errs.length === 0, p.errs); await ctx.close(); }

await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
