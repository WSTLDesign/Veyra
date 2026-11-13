// QA Mechanik – Prüfpunkt 6: Fundstücke. Rolle lernen (Feld + Kampf, Ersetzen bei 4), Rubrik „Rollen“ (Touch ≥ 48 px), verstecktes Wesen, Wiederkehr, Glitzer, 3D-Darstellung, Dex-Hinweis.
//   node test/qa_mech_finds.mjs     Bilder: test/qa_mech_finds_*.png
import { start, page, newGame, reporter, here } from './qa_mech_lib.mjs';
import { execSync } from 'child_process';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_finds.log', 'QA Mechanik Fundstücke');
const env = await start();
const p = await page(env, { flags: {} });
await newGame(p, { team: [[1, 8]], view: '2d' });
const ev = (f, a) => p.evaluate(f, a);
const box = sel => ev(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, vis: r.width > 0 && r.height > 0 && !e.closest('[hidden]') }; }, sel);
const flush = () => ev(async () => { for (let i = 0; i < 20; i++) { TW && TW.finish && TW.finish(); advDlg(); await new Promise(r => setTimeout(r, 40)); if (mode === 'world') break; } mode = 'world'; });
// ---- 1) Feld-Rolle lernen über die echte Oberfläche (Menü → Tasche → Rollen → Lernen → Kreatur)
const setup = await ev(() => { const fl = Object.keys(MONS).map(Number).find(s => MONS[s] && MONS[s].t.includes('flora') && !MONS[s].legend && !canCarry(s)); G.team = [mk(1, 8), mk(fl, 4)]; G.bag.rolle_rankenschnitt = 1; G.bag.rolle_felsschub = 1; G.bag.rolle_wellenschlag = 0; G.flags.fmSeen = 1; G.team[1].known = []; return { fl, name: MONS[fl].n }; });
await ev(() => { if (mode !== 'menu') pressB(); }); await p.waitForTimeout(700); await p.click('#tabs button[data-t="bag"]'); await p.waitForTimeout(500);
const bag = await ev(() => { const h = [...document.querySelectorAll('#mBody h3')].map(e => e.textContent); const rows = [...document.querySelectorAll('#mBody .fdRoll')].map(r => { const b = r.querySelector('button').getBoundingClientRect(), rr = r.getBoundingClientRect(); return { txt: r.querySelector('b').textContent, small: r.querySelector('small').textContent, btn: [Math.round(b.width), Math.round(b.height)], row: Math.round(rr.height) }; }); return { h, rows }; });
await p.screenshot({ path: here('qa_mech_finds_rollen.png') }); R.note('Rubrik Rollen: ' + JSON.stringify(bag));
R.t('1 Tasche: Rubrik „Rollen“ vorhanden, Feld-Rollen zuerst', bag.h.includes('Rollen') && bag.rows.length >= 2 && /Feld/.test(bag.rows[0].small), bag);
R.t('1 „Lernen“-Knopf: Touch-Ziel ≥ 48 px (Höhe und Breite)', bag.rows.every(r => r.btn[0] >= 48 && r.btn[1] >= 48), bag.rows.map(r => r.btn));
await ev(() => { document.querySelector('#mBody .fdRoll button').click(); }); await p.waitForTimeout(500); await p.screenshot({ path: here('qa_mech_finds_rolle_lernen.png') });
const ch = await ev(() => { const cards = [...document.querySelectorAll('#mBody .grid > *')].map(c => { const r = c.getBoundingClientRect(); return { cls: c.className, dis: c.disabled, tag: (c.querySelector('.fdTag') || {}).textContent, w: Math.round(r.width), h: Math.round(r.height) }; }); const back = document.querySelector('#mBody .back'); const rb = back && back.getBoundingClientRect(); return { cards, back: rb && [Math.round(rb.width), Math.round(rb.height)] }; });
R.note('Lernen-Auswahl: ' + JSON.stringify(ch)); R.t('1 Auswahl: Karten „Kann es lernen / Kann es schon / Passt nicht“, Karten und „Zurück“ ≥ 48 px (Auftrag Touch ≥ 48)', ch.cards.length === 2 && ch.cards.every(c => c.w >= 48 && c.h >= 48) && ch.back[1] >= 48 && ch.cards.some(c => /Kann es/.test(c.tag)), ch);
await ev(() => { const c = [...document.querySelectorAll('#mBody .grid > *')].find(c => !c.disabled); c && c.click(); }); await p.waitForTimeout(500);
const L1 = await ev(() => { const m = G.team[1]; return { known: m.known.slice(), bag: G.bag.rolle_rankenschnitt, fk: fieldKnows(m, 'rankenschnitt'), battleSlots: m.moves.map(x => x.id), mp: !!MOVES.rankenschnitt, toast: (document.querySelector('#toast') || {}).textContent }; });
R.t('1 Feld-Rolle gelernt: Attacke in known, belegt keinen Kampfplatz, Rolle bleibt in der Tasche (wiederverwendbar)', L1.known.includes('rankenschnitt') && L1.fk && !L1.battleSlots.includes('rankenschnitt') && L1.bag === 1, L1);
// Erneut: schon gelernt → „Kann es schon“
await ev(() => { if (mode !== 'menu') pressB(); }); await p.waitForTimeout(400); await p.click('#tabs button[data-t="bag"]'); await p.waitForTimeout(400); await ev(() => { document.querySelector('#mBody .fdRoll button').click(); }); await p.waitForTimeout(400);
const again = await ev(() => [...document.querySelectorAll('#mBody .grid .fdTag')].map(t => t.textContent)); R.t('1 Zweite Nutzung: Hinweis „Kann es schon“ bei der Kreatur', again.some(t => /schon/.test(t)), again);
// ---- 2) Kampf-Rolle mit 4 Attacken: Ersetzen-Dialog
await ev(() => { const g = Object.keys(MONS).map(Number).find(s => MONS[s] && MONS[s].t.includes('glut') && !MONS[s].legend && canLearnScroll('rolle_glutwirbel', mk(s, 30)) === 'ok'); const m = mk(g, 30); while (m.moves.length < 4) { const id = Object.keys(MOVES).find(k => k !== 'glutwirbel' && !m.moves.some(x => x.id === k)); m.moves.push({ id, pp: MOVES[id][4] }); } m.known = [...new Set([...(m.known || []), ...m.moves.map(x => x.id)])]; G.team = [m]; G.bag = { rolle_glutwirbel: 1 }; window.QM = { old: m.moves.map(x => x.id), sp: g }; });
await ev(() => { closeMenu && closeMenu(); mode = 'world'; }); await p.waitForTimeout(300); await ev(() => { pressB(); }); await p.waitForTimeout(600); await p.click('#tabs button[data-t="bag"]'); await p.waitForTimeout(400); await ev(() => { document.querySelector('#mBody .fdRoll button').click(); }); await p.waitForTimeout(400);
await ev(() => { document.querySelector('#mBody .grid > *:not([disabled])').click(); }); await p.waitForTimeout(500); await p.screenshot({ path: here('qa_mech_finds_ersetzen.png') });
const fg = await ev(() => { const h = document.querySelector('#mBody h3').textContent, p_ = (document.querySelector('#mBody .fdHint') || {}).textContent, slots = [...document.querySelectorAll('#mBody .fdSlots .slot')].map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; }); return { h, p_, slots }; });
R.note('Ersetzen: ' + JSON.stringify(fg)); R.t('1 Kampf-Rolle bei 4 Attacken: „… kennt schon vier Attacken. Welche soll Platz machen?“, 4 Plätze ≥ 48 px', /vier Attacken/.test(fg.h) && fg.slots.length === 4 && fg.slots.every(s => s.h >= 48 && s.w >= 48), fg);
await ev(() => { document.querySelectorAll('#mBody .fdSlots .slot')[2].click(); }); await p.waitForTimeout(500);
const rp = await ev(() => { const m = G.team[0]; return { moves: m.moves.map(x => x.id), old: QM.old, newIn: m.moves.some(x => x.id === 'glutwirbel'), oldKept: m.known.includes(QM.old[2]), n: m.moves.length }; });
R.t('1 Ersetzen: gewählter Platz wird überschrieben, alte Attacke bleibt unter „Erlernte Attacken“ (known), weiter 4 Attacken', rp.newIn && rp.n === 4 && rp.oldKept && !rp.moves.includes(rp.old[2]), rp);
// ---- 3) verstecktes Wesen → Kampf, Art außerhalb enc, Wiederkehr
await ev(() => { closeMenu && closeMenu(); mode = 'world'; });
const hid = await ev(async () => { const out = []; for (const id in NPCS) for (const n of NPCS[id]) if (n.f === 'hidden') { const enc = MAPS[id] && MAPS[id].enc ? MAPS[id].enc.day.concat(MAPS[id].enc.night).map(e => e[0]) : []; out.push({ id, mon: n.mon, name: MONS[n.mon].n, lvl: n.lvl, inEnc: enc.includes(n.mon), legend: !!MONS[n.mon].legend, flag: n.flag }); } return out; });
R.note('Versteckte Wesen: ' + JSON.stringify(hid.map(h => h.id + ':' + h.name + ' Lv' + h.lvl)));
R.t('3 12 versteckte Wesen, keines auf einer enc-Liste, keine Legende', hid.length === 12 && hid.every(h => !h.inEnc && !h.legend), hid.filter(h => h.inEnc || h.legend));
const hr = await ev(async () => { G.team = [mk(1, 20)]; G.flags = Object.assign(G.flags, { starter: 1 }); const n = NPCS.route1.find(x => x.f === 'hidden'); loadMap('route1', n.x - 1 < 0 ? n.x + 1 : n.x - 1, n.y); mode = 'world'; ROAM.list = []; ROAM.want = 0; P.dir = n.x - 1 < 0 ? 'left' : 'right'; P.dir = 'right'; if (n.x - 1 < 0) { P.x = P.px = n.x + 1; P.dir = 'left'; } else { P.x = P.px = n.x - 1; }
  P.y = P.py = n.y; const out = { n: { x: n.x, y: n.y, mon: n.mon, flag: n.flag }, player: [P.x, P.y], tileFree: !blocked(P.x, P.y) }; const sb = startBattle; let btl = null; startBattle = function (o) { btl = o; ENC.inB = 1; FIND_RUN && 0; mode = 'world'; };
  const msgs = []; const s0 = say; say = (t, cb) => { msgs.push(Array.isArray(t) ? t.join(' | ') : t); return s0(t, cb); };
  interact(); out.dlg = msgs.slice(); for (let i = 0; i < 6 && !btl; i++) { TW && TW.finish && TW.finish(); advDlg(); await new Promise(r => setTimeout(r, 60)); } say = s0; startBattle = sb;
  out.btl = btl && btl.wild && { s: btl.wild.s, l: btl.wild.l }; out.flag = !!G.flags[n.flag]; out.flagT = G.flags[n.flag + '_t']; out.run = FIND_RUN && FIND_RUN.s; return out; });
R.note('Hidden: ' + JSON.stringify(hr)); R.t('3 Verstecktes Wesen: „Da bewegt sich etwas!“ → Kampf mit der Fund-Art (Lumli Lv 5), Fund-Flag + Zeitstempel gesetzt', hr.btl && hr.btl.s === hr.n.mon && hr.dlg.some(t => /Da bewegt sich etwas/.test(t)) && hr.flag && typeof hr.flagT === 'number', hr);
// Kampf real durchlaufen: Flucht → Toast „weggehuscht“, Fund bleibt weg bis 1 Spieltag; danach Wiederkehr beim Kartenwechsel; gefangen → bleibt weg
const wk = await ev(async () => { const n = NPCS.route1.find(x => x.f === 'hidden'); const o = {}; const tt = toast; const T = []; toast = t => T.push(t);
  FIND_RUN = { n, s: n.mon }; startBattle({ wild: mk(n.mon, 5) }); await new Promise(r => setTimeout(r, 400)); endBattle('run'); await new Promise(r => setTimeout(r, 300)); o.toast = T.slice(); o.hidden1 = npcHidden(n) ? 1 : 0;
  G.playtime = (G.flags[n.flag + '_t'] | 0) + 1439; loadMap('route1', 5, 5); o.t1439 = !!G.flags[n.flag]; G.playtime = (G.flags[n.flag + '_t'] | 0) + 1440; loadMap('route1', 5, 5); o.t1440 = !!G.flags[n.flag];
  // gefangen: bleibt weg
  G.flags[n.flag] = 1; G.flags[n.flag + '_t'] = G.playtime - 5000; G.dex.caught[n.mon] = 1; loadMap('route1', 5, 5); o.caughtStays = !!G.flags[n.flag]; delete G.dex.caught[n.mon]; toast = tt; return o; });
R.note('Wiederkehr: ' + JSON.stringify(wk)); R.t('3 Flucht: Toast „… ist weggehuscht. Morgen ist es wieder da.“, Wesen verschwindet', wk.toast.some(t => /weggehuscht/.test(t)) && wk.hidden1 === 1, wk);
R.t('3 Wiederkehr nach genau 1 Spieltag (1439 → weg, 1440 → da); gefangene Art kehrt nicht wieder', wk.t1439 === true && wk.t1440 === false && wk.caughtStays === true, wk);
// Müde Kreaturen: kein Kampf, Fund bleibt
const tired = await ev(async () => { const n = NPCS.route2.find(x => x.f === 'hidden'); G.team = [mk(1, 20)]; G.team[0].hp = 0; loadMap('route2', n.x + 1, n.y); mode = 'world'; ROAM.list = []; P.dir = 'left'; P.x = P.px = n.x + 1; P.y = P.py = n.y; const msgs = []; const s0 = say; say = t => { msgs.push(Array.isArray(t) ? t.join(' | ') : t); }; interact(); say = s0; const o = { msgs, flag: !!G.flags[n.flag] }; G.team[0].hp = 99; mode = 'world'; return o; });
R.t('3 Mit müden Kreaturen: „Da raschelt etwas … zu müde“, kein Kampf, Fund bleibt liegen', tired.msgs.some(t => /müde/.test(t)) && !tired.flag, tired);
// ---- 4) Glitzer: Würfel (Verteilung) + einmal real aufheben
const gl = await ev(() => { const cnt = { kapsel: 0, trank: 0, supertr: 0, beere: 0, money: 0 }; let money = 0, caps = 0, heal = 0, N = 20000; const BER = ['honigtau', 'glanzbeere', 'steinnuss', 'federschote', 'rankfrucht']; for (let i = 0; i < N; i++) { const r = rollSparkle(); if (r.money) { cnt.money++; money += r.money; } else if (BER.includes(r.item)) cnt.beere++; else cnt[r.item]++; if (r.item === 'kapsel') caps += r.n; if (r.item === 'trank' || r.item === 'supertr') heal += r.n; }
  const sx = NPCS.windkueste.find(n => n.f === 'sparkle'); G.flags[sx.flag] = 0; delete G.flags[sx.flag]; G.bag = {}; const before = G.money; loadMap('windkueste', sx.x - 1, sx.y); mode = 'world'; ROAM.list = []; P.x = P.px = sx.x - 1; P.y = P.py = sx.y; P.dir = 'right'; const msgs = []; const s0 = say; say = t => msgs.push(Array.isArray(t) ? t.join(' | ') : t); interact(); say = s0; mode = 'world';
  return { dist: Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, +(v / N * 100).toFixed(1)])), capsPer: +(caps / N).toFixed(2), healPer: +(heal / N).toFixed(2), moneyPer: Math.round(money / N), msgs, flag: !!G.flags[sx.flag], bag: G.bag, dm: G.money - before }; });
R.note('Glitzer: ' + JSON.stringify(gl)); R.t('4 Glitzer-Verteilung ≈ Gewichte (Kapsel 30, Trank 25, Starker Trank 10, Beere 20, ¤ 15 ±2) ', Math.abs(gl.dist.kapsel - 30) < 2 && Math.abs(gl.dist.trank - 25) < 2 && Math.abs(gl.dist.supertr - 10) < 2 && Math.abs(gl.dist.beere - 20) < 2 && Math.abs(gl.dist.money - 15) < 2, gl.dist);
R.t('4 Glitzer aufheben: „Es glitzert!“ + Inhalt, einmalig (Flag), Tasche/¤ geändert', gl.msgs.some(t => /Es glitzert/.test(t)) && gl.flag && (Object.keys(gl.bag).length > 0 || gl.dm > 0), gl);
// ---- 5) Rolle am Boden aufheben (Dialog) + 3D-Darstellung der vier Fund-Arten
const sc = await ev(() => { const n = NPCS.route1.find(x => x.f === 'scroll'); delete G.flags[n.flag]; G.bag = {}; loadMap('route1', n.x + 1, n.y); mode = 'world'; ROAM.list = []; P.x = P.px = n.x + 1; P.y = P.py = n.y; P.dir = 'left'; const msgs = []; const s0 = say; say = t => msgs.push(Array.isArray(t) ? t.join(' | ') : t); interact(); say = s0; mode = 'world'; return { msgs, bag: G.bag, flag: !!G.flags[n.flag] }; });
R.note('Rolle am Boden: ' + JSON.stringify(sc)); R.t('5 Rolle am Boden: Dialog „Du hast eine Lehrrolle gefunden!“ mit Typ-Hinweis und Wegweiser zur Tasche, Rolle in der Tasche', sc.msgs.some(t => /Lehrrolle gefunden/.test(t) && /Passt zu/.test(t) && /Tasche/.test(t)) && sc.bag.rolle_rankenschnitt === 1 && sc.flag, sc);
// 3D: vier Fund-Arten nebeneinander auf Route 1 (Testobjekte), Close-up
await ev(async () => { setView('third', 1); await new Promise(r => setTimeout(r, 1500)); });
// Einfacher: vorhandene Karte nutzen und Test-NPCs in route1 einhängen
const shot3d = await ev(async () => { const kinds = [{ f: 'item', item: 'kapsel' }, { f: 'scroll', item: 'rolle_rankenschnitt' }, { f: 'hidden', mon: 28, lvl: 5 }, { f: 'sparkle', item: 'kapsel' }]; loadMap('route1', 9, 20); mode = 'world'; ROAM.list = []; ROAM.want = 0;
  const m = cur; const free = []; for (let x = 4; x < 16 && free.length < 4; x++) if (m.rows[19][x] === '.' || m.rows[19][x] === ',') free.push(x); const L = NPCS.route1; for (let i = 0; i < 4 && i < free.length; i++) L.push(Object.assign({ x: free[i], y: 19, t: 'item', n: 1, flag: 'qa3d' + i, qa: 1 }, kinds[i])); return { free };
});
const geo = await ev(async () => { const L = NPCS.route1.filter(n => n.qa); L.forEach(n => { delete G.flags[n.flag]; }); R3.mapId = null; delete scenes.route1; loadMap('route1', 9, 21); mode = 'world'; ROAM.list = []; P.ang = 0; P.dir = 'up'; await new Promise(r => setTimeout(r, 2500)); const S = R3.scene; const info = []; for (const e of (S.userData.npcs || [])) if (e.n && e.n.qa) { const c = e.o.children; info.push({ f: e.n.f, geo: c[0] && c[0].geometry && c[0].geometry.type, geo2: c[1] && c[1].geometry && c[1].geometry.type, col: c[0] && c[0].material && c[0].material.color && c[0].material.color.getHexString() }); } return info; });
R.note('3D-Fundobjekte: ' + JSON.stringify(geo)); R.t('5 3D: die vier Fund-Arten haben unterschiedliche Form/Farbe (Kapsel, Rolle, Busch, Stern)', geo.length === 4 && new Set(geo.map(g => g.geo + g.col)).size === 4, geo);
await ev(() => { P.x = P.px = 9; P.y = P.py = 22; P.ang = 0; }); await p.waitForTimeout(1500); await p.screenshot({ path: here('qa_mech_finds_3d.png') });
await ev(() => { const L = NPCS.route1; for (let i = L.length - 1; i >= 0; i--) if (L[i].qa) L.splice(i, 1); setView('2d', 1); });
// ---- 6) Dex-Hinweis (gesehen, nicht gefangen)
const dx = await ev(async () => { closeMenu && closeMenu(); mode = 'world'; const id = 28; G.dex.seen[id] = 1; delete G.dex.caught[id]; pressB(); await new Promise(r => setTimeout(r, 600)); return FIND_HINTS[id]; });
await p.click('#tabs button[data-t="dex"]'); await p.waitForTimeout(1500);
const dxr = await ev(async () => { const cells = [...document.querySelectorAll('#mBody .dx')]; const c = cells[27]; c.click(); await new Promise(r => setTimeout(r, 400)); return { hint: (document.querySelector('#mBody .fdDex') || {}).textContent, cells: cells.length, info: !!document.querySelector('#mBody .dinfo') }; });
await p.screenshot({ path: here('qa_mech_finds_dexhinweis.png') }); R.note('Dex: ' + JSON.stringify({ dx, dxr }));
R.t('6 Dex-Detail einer gesehenen, nicht gefangenen Fund-Art zeigt „Irgendwo … versteckt.“', /Irgendwo .* versteckt/.test(dxr.hint || ''), { dx, dxr });
R.t('Keine Konsolenfehler', p.errs.length === 0, p.errs);
await env.close();
// ---- 7) Balance
let bal = ''; try { bal = execSync('node tools/balance.mjs funde', { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8', timeout: 60000 }); } catch (e) { bal = String(e.stdout || e.message); }
R.note('tools/balance.mjs funde:\n' + bal.slice(0, 3500)); R.t('7 tools/balance.mjs funde läuft und liefert Kapseln/Heilmittel/¤ je Karte', /Kapsel/.test(bal), bal.slice(0, 200));
console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
