// QA Mechanik – Prüfpunkt 8: Große Karte. Öffnen (Minikarte/M), Zoom-Kette, Marker, „Hier kannst du“ gegen Daten, Nebel, Tipp auf Ort, Schnellreise, Schließen, Pause,
// Touch ≥ 48 px, Erstzeichnung, 860×484 lesbar, Fremdbegriffe.
//   node test/qa_mech_bigmap.mjs     Bilder: test/qa_mech_bigmap_*.png
import { start, page, newGame, goMap, reporter, here } from './qa_mech_lib.mjs';
import { readFileSync } from 'fs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_bigmap.log', 'QA Mechanik Große Karte');
const env = await start();
const p = await page(env, { flags: {} });
await newGame(p, { team: [[1, 14], [25, 11]], view: '2d' });
const ev = (f, a) => p.evaluate(f, a);
await ev(async () => { SET.res = '720'; try { await preloadArt(); } catch (e) { } G.badges = ['Floramedaille']; G.flags.badge1 = 1; for (const id of ['morgenau', 'route1', 'kupferhain', 'route2', 'brisenhafen']) G.visited[id] = 1; G.time = 10 * 60; });
await goMap(p, 'kupferhain', 8, 6); await p.waitForTimeout(600);
const tap = async sel => { const b = await ev(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel); if (b) await p.mouse.click(b[0], b[1]); return !!b; };
const settle = () => p.waitForFunction(() => !BM.anim && performance.now() > BM.lock, null, { timeout: 60000 }).then(() => p.waitForTimeout(250));
await ev(() => { window.QL = { long: [], draw: 0 }; try { new PerformanceObserver(l => { for (const e of l.getEntries()) QL.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) { } const d3 = draw3d, d2 = draw; draw3d = function () { QL.draw++; return d3.apply(this, arguments); }; draw = function () { QL.draw++; return d2.apply(this, arguments); }; });
// ---- 1) Öffnen per Minikarte (Tipp) mit Erstzeichnung
await ev(() => mmShow(true)); await p.waitForTimeout(400);
const mm = await ev(() => { const r = $('#mmW').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), show: $('#mmW').classList.contains('show'), badge: getComputedStyle($('#mmW'), '::after').content }; });
R.note('Minikarte: ' + JSON.stringify(mm)); R.t('1 Minikarte sichtbar, Tipp-Fläche ≥ 48 px', mm.show && mm.w >= 48 && mm.h >= 48, mm);
const t0 = await ev(() => { QL.long.length = 0; const t = performance.now(); window.T0 = t; return t; });
await tap('#mmW');
const fd = await p.waitForFunction(() => BM.open && BM.L.here && BM.L.here.poi && document.querySelector('.bmBase'), null, { timeout: 30000 }).then(() => ev(() => performance.now() - T0));
await settle(); const lt1 = await ev(() => QL.long.slice());
R.note(`Erstzeichnung „Hier“ (Tipp → Basisbild): ${Math.round(fd)} ms, Long Tasks: ${JSON.stringify(lt1)}`);
R.t('1 Tipp auf Minikarte öffnet die große Karte (Ebene Hier, mode menu)', await ev(() => BM.open && BM.lvl === 'here' && mode === 'menu'));
R.t('1 Erstzeichnung < 600 ms (Software-Renderer), kein Long Task > 200 ms', fd < 600 && lt1.every(l => l[1] < 200), { fd, lt1 });
await p.screenshot({ path: here('qa_mech_bigmap_hier_860.png') });
// Pause: Zeit, Roamer, Draw-Aufrufe
const pa = await ev(async () => { const t = G.time, d = QL.draw, r0 = ROAM.list.map(r => [r.x, r.y].join()).join(); await new Promise(r => setTimeout(r, 2500)); return { time: G.time === t, draws: QL.draw - d, roam: ROAM.list.map(r => [r.x, r.y].join()).join() === r0, mode }; });
R.t('1 Pause (2D): Spielzeit steht, Roamer stehen, mode menu (draw-Zähler zählt auch die Hülle aus 46, daher nur Hinweis)', pa.time && pa.roam && pa.mode === 'menu', pa);
await ev(async () => { bmClose(); setView('third', 1); await new Promise(r => setTimeout(r, 1800)); openBigMap(); await new Promise(r => setTimeout(r, 800)); });
const pa3 = await ev(async () => { const a = R3.r.info.render.frame, t = G.time; await new Promise(r => setTimeout(r, 3000)); return { frames: R3.r.info.render.frame - a, time: G.time === t, open: BM.open, mode }; });
R.t('1 Pause (3D): während die Karte offen ist werden keine 3D-Frames gerendert (render.frame +0), Zeit steht', pa3.open && pa3.frames <= 1 && pa3.time && pa3.mode === 'menu', pa3);
await ev(async () => { bmClose(); setView('2d', 1); await new Promise(r => setTimeout(r, 600)); });
// Schließen auf vier Arten
const closes = {};
await tap('.bmX'); await p.waitForTimeout(400); closes.x = await ev(() => !BM.open && mode === 'world');
await ev(() => openBigMap()); await settle(); await p.keyboard.press('Escape'); await p.waitForTimeout(400); closes.esc = await ev(() => !BM.open && mode === 'world');
await p.keyboard.press('KeyM'); await settle(); const mOpen = await ev(() => BM.open); await p.keyboard.press('KeyM'); await p.waitForTimeout(400); closes.m = mOpen && await ev(() => !BM.open && mode === 'world');
await ev(() => openBigMap()); await settle(); await p.mouse.click(4, 242); await p.waitForTimeout(500); closes.outside = await ev(() => !BM.open && mode === 'world');
R.note('Schließen: ' + JSON.stringify(closes)); R.t('1 Schließen per X, Escape, M (und Öffnen per M), Tipp außerhalb', closes.x && closes.esc && closes.m && closes.outside, closes);
// ---- 2) Zoom-Kette (Mausrad/Knöpfe/Umschalter)
await ev(() => openBigMap()); await settle();
const lv = [await ev(() => BM.lvl)];
for (let i = 0; i < 14 && lv[lv.length - 1] !== 'world'; i++) { await p.mouse.move(430, 250); await p.mouse.wheel(0, 240); await p.waitForTimeout(260); await settle(); const l = await ev(() => BM.lvl); if (l !== lv[lv.length - 1]) lv.push(l); }
R.note('Zoom raus per Mausrad: ' + lv.join(' → ')); R.t('2 Rauszoomen per Mausrad: Hier → Region → Veyra', lv.join() === 'here,region,world', lv);
const lv2 = [await ev(() => BM.lvl)];
await ev(() => { const b = document.querySelector('.bmMe'); b && b.click(); });
for (let i = 0; i < 30 && lv2[lv2.length - 1] !== 'here'; i++) { if (lv2[lv2.length - 1] === 'region') await ev(() => { const b = document.querySelector('.bmMe'); b && b.click(); }); await p.mouse.move(430, 250); await p.mouse.wheel(0, -240); await p.waitForTimeout(260); await settle(); const l = await ev(() => BM.lvl); if (l !== lv2[lv2.length - 1]) lv2.push(l); }
R.note('Zoom rein per Mausrad: ' + lv2.join(' → ')); R.t('2 Reinzoomen per Mausrad (nach ◎ „zu mir“): Veyra → Region → Hier', lv2.join() === 'world,region,here', lv2);
// Knöpfe − / + und Umschalter
const bt = await ev(() => { const o = {}; for (const s of ['.bmOut', '.bmIn', '.bmCan', '.bmX', '.bmLegBtn']) { const e = document.querySelector(s); if (e) { const r = e.getBoundingClientRect(); o[s] = [Math.round(r.width), Math.round(r.height)]; } } o.seg = [...document.querySelectorAll('.bmSeg button')].map(b => { const r = b.getBoundingClientRect(); return [b.textContent.trim(), Math.round(r.width), Math.round(r.height)]; }); return o; });
R.note('Knopfgrößen: ' + JSON.stringify(bt));
await tap('.bmOut'); await settle(); await tap('.bmOut'); await settle(); const viaBtn = await ev(() => BM.lvl); await ev(() => bmSetLevel('here')); await settle();
const seg = await ev(() => [...document.querySelectorAll('.bmSeg button')].map(b => b.textContent.trim())); await p.evaluate(() => { [...document.querySelectorAll('.bmSeg button')][2].click(); }); await settle(); const viaSeg = await ev(() => BM.lvl);
R.t('2 Knopf − (2×) und Umschalter „Hier · Region · Veyra“ wechseln die Ebene', (viaBtn === 'region' || viaBtn === 'world') && viaSeg === 'world' && seg.length === 3, { viaBtn, viaSeg, seg });
// ---- 3) Marker (Region + Veyra)
await ev(async () => { for (const id of ['morgenau', 'route1', 'kupferhain', 'route2', 'brisenhafen', 'heil_brise', 'nebelgrotte', 'route3', 'frostheim']) G.visited[id] = 1; G.badges = ['Floramedaille', 'Flutmedaille']; G.flags.fasttravel = 1; bmSetLevel('region'); }); await settle();
const reg = await ev(() => { const poi = BM.L.region.poi; const cnt = {}; for (const q of poi) cnt[q.kind] = (cnt[q.kind] || 0) + 1; const meds = poi.filter(q => /^medal/.test(q.kind)); return { cnt, meds: meds.map(q => q.l + (q.sub ? ' | ' + q.sub : '')), n: poi.length, unv: Object.keys(MAPS).filter(id => !G.visited[id]).length }; });
R.note('Region-Marker: ' + JSON.stringify(reg)); await p.screenshot({ path: here('qa_mech_bigmap_region_860.png') });
R.t('3 Region: genau 8 Medaillen-Hallen (medal/medal0) mit Kanon-Namen', (reg.cnt.medal || 0) + (reg.cnt.medal0 || 0) === 8, reg);
R.t('3 Region: Turmrat/Krone, Stationen (Herz), Händler, Schnellreise-Punkte vorhanden', (reg.cnt.crown || 0) >= 1 && (reg.cnt.heal || 0) + (reg.cnt.fast || 0) >= 2 && (reg.cnt.shop || 0) >= 1 && (reg.cnt.fast || 0) >= 1, reg.cnt);
const wo = await ev(() => { bmSetLevel('world'); return 1; }); await settle(); await p.waitForTimeout(600);
const wld = await ev(() => { const poi = BM.L.world.poi; const cnt = {}; for (const q of poi) cnt[q.kind] = (cnt[q.kind] || 0) + 1; return { cnt, names: poi.filter(q => q.kind === 'region' || q.kind === 'regname').map(q => q.l + (q.vis ? '' : ' (Nebel)')) , fog: poi.filter(q => q.fog || q.vis === false).length }; });
R.note('Veyra-Marker: ' + JSON.stringify(wld)); await p.screenshot({ path: here('qa_mech_bigmap_veyra_860.png') });
R.t('3 Veyra: Orte, Medaillen und Herzen als Marker, Regionsschilder, Nebel über Unbesuchtem', Object.keys(wld.cnt).length >= 3 && wld.fog >= 1, wld);
// Nebel (visuell): unbesuchte Regionen
// ---- 4) Tipp auf Ort → Infokarte (Region-Ebene), Schnellreise nur freigeschaltet
await ev(() => bmSetLevel('region')); await settle();
const info = await ev(() => { const h = BM.hits.filter(q => q.p.kind === 'name' || q.p.kind === 'fast' || q.p.kind === 'heal' || /^medal/.test(q.p.kind)); return h.slice(0, 3).map(q => ({ k: q.p.kind, x: Math.round(q.x), y: Math.round(q.y), r: Math.round(q.r) })); });
const cardOf = async (kind) => ev(([kind]) => { const h = BM.hits.find(q => q.p.kind === kind); if (!h) return null; bmTap(h.x, h.y); const c = BM.el.querySelector('.bmCard'); return { hidden: c.hidden, txt: c.innerText.replace(/\s+/g, ' ').trim(), btn: !!c.querySelector('.bmGo'), btnTxt: (c.querySelector('.bmGo') || {}).textContent, r: Math.round(h.r) }; }, [kind]);
const cMedal = await cardOf('medal0') || await cardOf('medal'); const cFast = await ev(() => { const h = BM.hits.find(q => q.p.kind === 'fast' && q.p.fast && q.p.fast.town !== bmTop()); if (!h) return null; bmTap(h.x, h.y); const c = BM.el.querySelector('.bmCard'); return { hidden: c.hidden, txt: c.innerText.replace(/\s+/g, ' ').trim(), btn: !!c.querySelector('.bmGo'), btnTxt: (c.querySelector('.bmGo') || {}).textContent }; }); const cHeal = await cardOf('heal'); const cName = await ev(() => { bmTap(0, 0); const a = BM.hits.find(q => q.p.kind === 'name' || q.p.kind === 'place'); if (!a) return null; bmTap(a.x, a.y); const c = BM.el.querySelector('.bmCard'); return { txt: c.innerText.replace(/\s+/g, ' ').trim(), hidden: c.hidden }; });
R.note('Infokarten: ' + JSON.stringify({ cMedal, cFast, cHeal, cName }));
R.t('4 Tipp auf Medaillen-Halle: Name, Region/Ort, Medaille „erhalten/noch offen“, Entfernung', cMedal && !cMedal.hidden && /medaille/i.test(cMedal.txt) && /(noch offen|erhalten)/.test(cMedal.txt), cMedal);
R.t('4 Schnellreise nach erster Medaille: Infokarte der Station hat Knopf „Schnellreise nach …“', cFast && cFast.btn && /Schnellreise nach/.test(cFast.btnTxt), cFast);
// ohne Medaille: kein Knopf, Hinweis
await ev(() => { G.badges = []; G.flags.fasttravel = 0; BM.L = {}; bmSetLevel('region'); }); await settle();
const cNoFast = await ev(() => { const outs = []; for (const q of BM.hits) if (q.p.kind === 'heal' || q.p.kind === 'fast') { bmTap(q.x, q.y); const c = BM.el.querySelector('.bmCard'); outs.push({ k: q.p.kind, btn: !!c.querySelector('.bmGo'), txt: c.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) }); } return outs; });
R.note('Ohne Medaille: ' + JSON.stringify(cNoFast.slice(0, 3))); R.t('4 Ohne Medaille: Schnellreise nirgends (kein Knopf, Hinweis „ab der ersten Medaille“)', cNoFast.length > 0 && cNoFast.every(o => !o.btn) && cNoFast.some(o => /ab der ersten Medaille/.test(o.txt)), cNoFast.slice(0, 4));
// nur besuchte Orte: unbesuchte Station hat keinen Knopf (bmFastOf prüft bmVisited)
await ev(() => { G.badges = ['Floramedaille']; G.flags.badge1 = 1; BM.L = {}; bmSetLevel('region'); }); await settle();
const unv = await ev(() => { const sp = healSpots(); return sp.map(s => ({ town: s.town, vis: !!G.visited[s.town], fast: !!bmFastOf(s.town) })); }); R.note('Stationen: ' + JSON.stringify(unv));
R.t('4 Schnellreise nur zu besuchten Stationen (bmFastOf; aktuelle Station ausgenommen)', unv.every(s => s.town === 'kupferhain' || s.fast === s.vis) && unv.some(s => s.vis && s.fast), unv);
// Schnellreise ausführen (Bestätigungsknopf)
const dest = await ev(() => { const s = healSpots().find(s => G.visited[s.town] && s.town !== bmTop()); return s ? { town: s.town } : null; });
if (dest) { await ev(([d]) => { const h = BM.hits.find(q => q.p.fast && q.p.fast.town === d.town) || BM.hits.find(q => q.p.kind === 'fast'); if (h) bmTap(h.x, h.y); }, [dest]); const gb = await tap('.bmGo'); await p.waitForTimeout(6000); await ev(async () => { for (let i = 0; i < 10 && mode !== 'world'; i++) { TW && TW.finish && TW.finish(); advDlg(); await new Promise(r => setTimeout(r, 300)); } });
  const fr = await ev(() => ({ map: cur.id, mode, open: BM.open })); R.note('Schnellreise: ' + JSON.stringify({ dest, gb, fr })); R.t('4 Schnellreise: Karte schließt, Spieler steht an der Station (Zielkarte)', gb && !fr.open && fr.map === dest.town, { dest, fr }); }
await goMap(p, 'kupferhain', 8, 6); await p.waitForTimeout(500);
// ---- 5) „Hier kannst du“ gegen MAPS/NPCS (6 Karten)
const SUG = {};
for (const id of ['route1', 'kupferhain', 'windkueste', 'labor', 'brisenhafen', 'nebelgrotte']) {
  SUG[id] = await ev(async id => { G.badges = ['Floramedaille', 'Flutmedaille']; G.flags.swim = 1; G.flags.glide = 0; G.flags.climb = 0; G.team = [mk(1, 14)]; if (BM.open) bmClose(); loadMap(id, id === 'labor' ? 5 : 8, id === 'labor' ? 6 : 8); mode = 'world'; ROAM.list = []; await new Promise(r => setTimeout(r, 200)); openBigMap(); await new Promise(r => setTimeout(r, 700)); const S = bmSuggest().map(s => s.t);
    const m = cur, N = (NPCS[id] || []).filter(n => !npcHidden(n)); const has = { grass: m.rows.some(r => /["':]/.test(r)), water: m.rows.some(r => r.includes('~')), ledge: m.rows.some(r => r.includes('R')), wall: !m.inside && m.theme !== 'cave' && m.rows.some(r => r.includes('X')), shop: N.some(n => bmShopNpc(n)), heal: N.some(n => n.t === 'nurse') || bmDoors(m).some(d => d.kind === 'heal'), trainer: N.filter(n => n.t === 'trainer' && !G.flags[n.flag]).length, talkNames: N.filter(n => n.t === 'talk').map(n => bmFigName(n, 1)).filter(Boolean), items: N.filter(n => /^(item|scroll|hidden|sparkle)$/.test(n.t) && !G.flags[n.flag]).length, enc: !!m.enc, canSwim: canSwim(), exits: bmExits(m).map(e => e.d + '→' + e.name + (e.lock ? ' (zu)' : '')), doors: bmDoors(m).map(d => d.kind + ':' + d.l) };
    bmClose(); return { S, has }; }, id);
  await p.waitForTimeout(150); }
R.note('„Hier kannst du“ je Karte: ' + JSON.stringify(Object.fromEntries(Object.entries(SUG).map(([k, v]) => [k, v.S]))));
const bad = [];
for (const [id, { S, has }] of Object.entries(SUG)) { for (const t of S) {
  if (/^Wilde Kreaturen im Gras/.test(t) && !(has.grass && has.enc)) bad.push([id, t, 'kein Gras/enc']);
  if (/^Im Wasser schwimmen/.test(t) && !(has.water && has.canSwim)) bad.push([id, t, 'Wasser:' + has.water + ' canSwim:' + has.canSwim + ' (kein Wellenritt im Team)']);
  if (/^Von der Felskante gleiten/.test(t) && !has.ledge) bad.push([id, t, 'keine Kante']);
  if (/^An der Felswand klettern/.test(t) && !has.wall) bad.push([id, t, 'keine Wand']);
  if (/^(Einkaufen|Bei .* einkaufen)/.test(t) && !has.shop && !has.doors.some(d => /^shop/.test(d))) bad.push([id, t, 'kein Laden']);
  if (/^Glitzersachen/.test(t) && !has.items) bad.push([id, t, 'keine Funde']);
  if (/^Gegen .* kämpfen/.test(t) && !has.trainer) bad.push([id, t, 'kein Herausforderer']);
  const m = t.match(/^Mit (.*) sprechen$/); if (m && !has.talkNames.includes(m[1])) bad.push([id, t, 'Figur fehlt: ' + has.talkNames.join('/')]);
  const e = t.match(/^Nach (Norden|Süden|Westen|Osten): (.*)$/); if (e && !has.exits.some(x => x.includes(e[2]) && !/\(zu\)/.test(x))) bad.push([id, t, 'Ausgang fehlt: ' + has.exits.join('/')]);
} R.t(`5 „Hier kannst du“ ${id}: 2–5 Vorschläge`, S.length >= 2 && S.length <= 5, S); }
R.note('Abweichungen Vorschlag ↔ Daten: ' + JSON.stringify(bad)); R.t('5 Alle Vorschläge stimmen mit MAPS/NPCS/Fähigkeiten überein (stichprobenartig 6 Karten)', bad.length === 0, bad);
// ---- 6) Touch ≥ 48 px, Lesbarkeit 860×484, Fremdbegriffe
await ev(async () => { loadMap('route1', 9, 12); mode = 'world'; openBigMap(); }); await settle();
const ui = await ev(() => { const bad = [], all = []; for (const e of document.querySelectorAll('#bigMap button, #bigMap [role=button], #bigMap .bmChip')) { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (r.width === 0 || r.height === 0 || e.closest('[hidden]') || cs.visibility === 'hidden') continue; all.push([(e.className || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 14), Math.round(r.width), Math.round(r.height)]); if (r.width < 47.5 || r.height < 47.5) bad.push([(e.className || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 14), Math.round(r.width), Math.round(r.height)]); }
  const fs = []; for (const e of document.querySelectorAll('#bigMap *')) { if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; const r = e.getBoundingClientRect(); if (r.width === 0 || e.closest('[hidden]')) continue; fs.push(parseFloat(getComputedStyle(e).fontSize)); }
  return { bad, all, minFont: Math.min(...fs), n: fs.length }; });
R.note('Touch/Schrift: ' + JSON.stringify(ui)); R.t('6 Alle Bedienelemente der Karte ≥ 48 × 48 px', ui.bad.length === 0, ui.bad);
R.t('6 Kleinste DOM-Schrift ≥ 12 px', ui.minFont >= 12, ui.minFont);
const src = readFileSync(new URL('../src/46-bigmap.js', import.meta.url), 'utf8'); const bannedCode = (src.match(/Pok[eé]|Nintendo|Arena[^-\w]|Pokal|Gym\b|Orden\b/gi) || []); R.note('Code-Treffer Fremd/Orden in 46-bigmap.js: ' + JSON.stringify(bannedCode));
const txt = await ev(() => document.querySelector('#bigMap').innerText); R.t('6 Sichtbarer Text ohne Fremdbegriffe (Pokémon/Pokéball/Gym) und ohne „Orden“ (Kanon: Medaille)', !/Pok[eé]|Nintendo|\bGym\b|Orden\b/i.test(txt), txt.slice(0, 300));
await p.screenshot({ path: here('qa_mech_bigmap_route1_860.png') });
await tap('.bmLegBtn'); await p.waitForTimeout(500); await p.screenshot({ path: here('qa_mech_bigmap_legende_860.png') });
R.t('Keine Konsolenfehler', p.errs.length === 0, p.errs);
R.note('Long Tasks gesamt: ' + JSON.stringify(await ev(() => QL.long.filter(l => l[1] > 100))));
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
