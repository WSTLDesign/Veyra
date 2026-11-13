// Spielstand-Sicherheitsnetz im echten Spiel (ein Chromium):  node test/qa_savesafe_ui.mjs   → Bilder test/savesafe_*.png
// Altstand laden (Sicherung _bak_0), Optionen › Erweitert: Code zeigen/kopieren, Code laden mit Seiten-Abfrage, kaputter Stand → Sicherung, localStorage leer → IndexedDB, „Zurück“ ≥ 48 px.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const RAW = readFileSync(new URL('./fixtures/old_save_4orden.json', import.meta.url), 'utf8'), RAW2 = readFileSync(new URL('./fixtures/old_save_pre_a1.json', import.meta.url), 'utf8');
const NOSHOT = !!process.env.NOSHOTS;
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 860, height: 400 }, deviceScaleFactor: 1 });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
const URL_ = new URL('../dist/index.html', import.meta.url).href;
let ok = 0, bad = 0; const T = (n, c, d) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, d !== undefined ? JSON.stringify(d) : ''); } };
const ev = (f, a) => page.evaluate(f, a), W = ms => page.waitForTimeout(ms), shot = async n => { if (!NOSHOT) await page.screenshot({ path: new URL('./savesafe_' + n + '.png', import.meta.url).pathname }); };
const boot = async () => { await page.goto(URL_, { waitUntil: 'load' }); await W(3200); await ev(() => { const i = document.getElementById('intro'); if (i && !i.hidden) try { endIntro(); } catch (e) {} }); await W(400); };
await boot();
T('frischer Start: kein Hinweis, kein Fortsetzen', await ev(() => !document.getElementById('ssNote') && document.getElementById('tCont').hidden));
await ev(r => localStorage.setItem(SAVEKEY, r), RAW); await boot();
T('Altstand: Fortsetzen sichtbar', await ev(() => !document.getElementById('tCont').hidden));
await page.click('#tCont'); await W(1500);
const m1 = await ev(() => ({ sv: G.saveVersion, gid: !!G.gid, bak: !!localStorage.getItem(SAVEKEY + '_bak_0'), mode }));
T('Altstand migriert: saveVersion, gid, Sicherung _bak_0', m1.sv >= 1 && m1.gid && m1.bak, m1);

// Optionen › Erweitert
const openAdv = async () => { await ev(() => { rSettings._adv = 1; openMenu('game'); }); await W(900); };
await openAdv(); await shot('optionen');
const rows = await ev(() => [...document.querySelectorAll('details.adv .ssRow>div:first-child>b')].map(b => b.textContent));
T('Erweitert: 4 Zeilen (sichern, laden, Sicherungen, dauerhaft)', rows.length === 4 && /sichern/.test(rows[0]) && /laden/.test(rows[1]), rows);
const btnSz = await ev(() => [...document.querySelectorAll('details.adv .ssRow .pill')].filter(b => b.offsetParent).map(b => Math.round(b.getBoundingClientRect().height)));
T('Knöpfe ≥ 48 px hoch', btnSz.length >= 5 && btnSz.every(h => h >= 48), btnSz);
await ev(() => [...document.querySelectorAll('details.adv .ssRow .pill')].find(b => b.textContent === 'Code zeigen').click()); await page.waitForFunction(() => { const t = document.querySelector('details.adv .ssCode[readonly]'); return t && t.value.length > 10; }, null, { timeout: 8000 }).catch(() => {});
const code = await ev(() => { const t = document.querySelector('details.adv .ssCode[readonly]'); return t && { v: t.value, ro: t.readOnly, us: getComputedStyle(t).userSelect }; });
T('Code zeigen: markierbarer Text „VEYRA1.…“', code && /^VEYRA[01]\./.test(code.v) && code.ro && code.us === 'text', code && { v: code.v.slice(0, 12), ro: code.ro, us: code.us });
await ev(() => document.querySelector('details.adv .ssCode[readonly]').scrollIntoView({ block: 'center' })); await W(200); await shot('code');
await ev(() => [...document.querySelectorAll('details.adv .ssRow .pill')].find(b => b.textContent === 'Kopieren').click()); await W(500);
T('Kopieren: Rückmeldung angezeigt', !!(await ev(() => { const m = document.querySelector('details.adv .ssMsg'); return m && m.textContent; })));
// Code eines anderen Spiels einfügen → prüfen → Seiten-Abfrage → laden
const code2 = await ev(r => saveCode(r), RAW2);
await ev(() => [...document.querySelectorAll('details.adv .ssRow .pill')].find(b => b.textContent === 'Code einfügen').click()); await W(200);
const ta = page.locator('details.adv .ssCode:not([readonly])'); await ta.fill('VEYRA1.kaputt'); await ev(() => [...document.querySelectorAll('details.adv .ssRow .pill')].find(b => b.textContent === 'Prüfen').click()); await W(400);
const e1 = await ev(() => [...document.querySelectorAll('details.adv .ssMsg.bad')].map(m => m.textContent).join('|'));
T('falscher Code: kindgerechte Meldung, keine Abfrage', !!e1 && await ev(() => document.querySelector('details.adv .ssAsk').hidden), e1);
await ta.fill(code2); await page.keyboard.press('m'); await W(200);
T('Tippen im Code-Feld löst keine Spieltasten aus (Menü bleibt offen)', await ev(() => mode === 'menu' && !document.getElementById('menu').hidden));
await ta.fill(code2); await ev(() => [...document.querySelectorAll('details.adv .ssRow .pill')].find(b => b.textContent === 'Prüfen').click()); await page.waitForFunction(() => { const a = document.querySelector('details.adv .ssAsk'); return a && !a.hidden; }, null, { timeout: 8000 }).catch(() => {});
const ask = await ev(() => { const a = document.querySelector('details.adv .ssAsk'); return a && !a.hidden && a.textContent; });
T('Sicherheitsabfrage als Seiten-UI (Name, Kreaturen, Medaillen)', !!ask && /Gefunden:/.test(ask) && /Kreatur/.test(ask) && /gesichert/.test(ask), ask);
await ev(() => document.querySelector('details.adv .ssAsk').scrollIntoView({ block: 'center' })); await W(200); await shot('abfrage');
await ev(() => [...document.querySelectorAll('details.adv .ssAsk .pill')].find(b => b.textContent === 'Ja, laden').click()); await W(1500);
const im = await ev(() => ({ name: G.name, menu: document.getElementById('menu').hidden, mode, bak: !!localStorage.getItem(SAVEKEY + '_bak_vorimport'), map: G.map }));
T('Import geladen: Spiel läuft mit neuem Stand, alter Stand gesichert', im.name === JSON.parse(RAW2).name && im.mode !== 'menu' && im.menu && im.bak, im);
// Sicherungen-Liste
await openAdv(); const baks = await ev(() => document.querySelectorAll('details.adv .ssBak').length);
T('Sicherungen-Liste zeigt ≥ 2 Einträge (vor Migration, vor dem Laden)', baks >= 2, baks); await ev(() => closeMenu()); await W(300);
// „Zurück“-Knopf in Menü-Panes
await ev(() => { openMenu('bag'); }); await W(700); await ev(() => { const k = Object.keys(G.bag).find(k => ITEMS[k] && ITEMS[k].k === 'heal' && G.bag[k] > 0); if (k) chooseFor(k); }); await W(300);
const backs = await ev(() => [...document.querySelectorAll('#menu .back')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
await ev(() => closeMenu()); await W(300);
await ev(() => { openMenu('team'); sel = { i: 0 }; renderMenu(); }); await W(500);
const backs2 = await ev(() => [...document.querySelectorAll('#menu .back')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
await shot('zurueck');
const allB = backs.concat(backs2); T('„Zurück“ ≥ 48 px (Tasche/Team)', allB.length > 0 && allB.every(b => b[1] >= 48), allB);
await ev(() => closeMenu()); await W(300);
// Kaputter Stand → Sicherung + Hinweis
await ev(() => { save(); localStorage.setItem(SAVEKEY, '{"map":"route1","team":[{'); }); await boot();
const n1 = await ev(() => { const n = document.getElementById('ssNote'); return n && !n.hidden && n.textContent; });
T('kaputter Stand: Hinweis „Sicherung geladen“, Fortsetzen sichtbar, Rohstand aufgehoben', !!n1 && /Sicherung/.test(n1) && await ev(() => !document.getElementById('tCont').hidden && !!localStorage.getItem(SAVEKEY + '_kaputt')), n1);
await shot('hinweis');
await ev(() => [...document.querySelectorAll('#ssNote .pill')].find(b => b.textContent === 'OK').click()); await W(200);
// localStorage gelöscht, IndexedDB-Spiegel da → Wiederherstellung
await ev(() => { localStorage.clear(); }); await boot();
const n2 = await ev(() => ({ note: (document.getElementById('ssNote') || {}).textContent || '', cont: !document.getElementById('tCont').hidden, ls: !!localStorage.getItem(SAVEKEY) }));
T('localStorage leer → Stand aus IndexedDB geholt, Hinweis, Fortsetzen sichtbar', /gerettet/.test(n2.note) && n2.cont && n2.ls, n2);
console.log('   vor Weiterspielen:', JSON.stringify(await ev(() => ({ title: document.getElementById('title').hidden, cont: document.getElementById('tCont').hidden, mode, intro: document.getElementById('intro').hidden }))));
await ev(() => [...document.querySelectorAll('#ssNote .pill')].find(b => b.textContent === 'Weiterspielen').click()); await W(1500);
console.log('   nach:', JSON.stringify(await ev(() => ({ mode, G: !!G, team: G && G.team.length }))));
T('„Weiterspielen“ startet das gerettete Spiel', await ev(() => mode !== 'title' && !!G && G.team.length > 0));
// Neu starten löscht den Spiegel (kein Wiederauferstehen)
await ev(() => { saveWipe(); }); await W(400); await ev(() => localStorage.clear()); await boot();
T('nach „Neu starten“ + leerem Speicher: kein Wiederauferstehen, kein Hinweis', await ev(() => document.getElementById('tCont').hidden && !(document.getElementById('ssNote') && !document.getElementById('ssNote').hidden)));
T('keine Konsolenfehler', errs.length === 0, errs.slice(0, 5));
console.log(`\n${ok} ✓ / ${bad} ✗`); await browser.close(); process.exit(bad ? 1 : 0);
