// Unit-Tests Fangen & Entwicklung (Agent F): calcCatch-Werte, Wackler-Verteilung (10.000 Würfe je Kapsel/Status), canEvolve je Methode, Verzweigungen
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
const errs = [];page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
await page.waitForTimeout(400);
const R = await page.evaluate(() => {
 const out = [], ok = (n, c, info) => out.push({ n, ok: !!c, info: info === undefined ? '' : JSON.stringify(info) });
 beginGame({}, true); mode = 'world'; SET.diff = 'normal';
 let seed = 12345; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
 // --- calcCatch: Formelwerte ---
 const m = mk(59, 5); const max = stat(m, 'hp'); m.hp = max; // Flausch cr 255
 let r = calcCatch(m, 'kapsel', { roll: false, turn: 2 }); ok('Volle KP, cr255, ×1 ⇒ p=1/3', Math.abs(r.p - 1 / 3) < 1e-9, r.p);
 m.hp = 1; r = calcCatch(m, 'kapsel', { roll: false, turn: 2 }); ok('1 KP ⇒ p=(3·Max−2)/(3·Max)', Math.abs(r.p - (3 * max - 2) / (3 * max)) < 1e-9, r.p);
 const g = mk(2, 20); const gm = stat(g, 'hp'); g.hp = gm; // cr 45
 const pStd = calcCatch(g, 'kapsel', { roll: false, turn: 2 }).p, pExp = 45 / 3 / 255; ok('cr45 volle KP', Math.abs(pStd - pExp) < 1e-9, [pStd, pExp]);
 ok('Kobalt ×1,5', Math.abs(calcCatch(g, 'superk', { roll: false, turn: 2 }).p - pExp * 1.5) < 1e-9);
 ok('Stern ×2', Math.abs(calcCatch(g, 'ultra', { roll: false, turn: 2 }).p - pExp * 2) < 1e-9);
 ok('Zünd ×5 in Runde 1', Math.abs(calcCatch(g, 'zuendkapsel', { roll: false, turn: 1 }).p - pExp * 5) < 1e-9);
 ok('Zünd ×1 ab Runde 2', Math.abs(calcCatch(g, 'zuendkapsel', { roll: false, turn: 2 }).p - pExp) < 1e-9);
 ok('Geduld max ×4', Math.abs(calcCatch(g, 'geduldkapsel', { roll: false, turn: 30 }).p - pExp * 4) < 1e-9);
 ok('Dämmer nachts ×3', Math.abs(calcCatch(g, 'daemmer', { roll: false, turn: 2, night: true }).p - pExp * 3) < 1e-9);
 ok('Dämmer tags ×1', Math.abs(calcCatch(g, 'daemmer', { roll: false, turn: 2, night: false }).p - pExp) < 1e-9);
 const fl = mk(5, 20); fl.hp = stat(fl, 'hp'); /* Wabbel cr 45 (Plippi seit Loop-A-Nachbesserung cr 190) */ ok('Netz ×3,5 gegen Flut', Math.abs(calcCatch(fl, 'netz', { roll: false, turn: 2 }).p - pExp * 3.5) < 1e-9);
 const lo = mk(2, 1); lo.hp = stat(lo, 'hp'); ok('Nest Lv1 ×4', Math.abs(calcCatch(lo, 'nestkapsel', { roll: false, turn: 2 }).p - pExp * 4) < 1e-9);
 ok('Nest Lv20 ×2,1', Math.abs(calcCatch(g, 'nestkapsel', { roll: false, turn: 2 }).p - pExp * 2.1) < 1e-9);
 ok('Echo ×3,5 (bekannt)', Math.abs(calcCatch(g, 'echokapsel', { roll: false, turn: 2, caughtBefore: true }).p - pExp * 3.5) < 1e-9);
 g.status = 'schlummer'; ok('Schlummer ×2,5', Math.abs(calcCatch(g, 'kapsel', { roll: false, turn: 2 }).p - pExp * 2.5) < 1e-9);
 g.status = 'sporen'; ok('Sporen ×1,5', Math.abs(calcCatch(g, 'kapsel', { roll: false, turn: 2 }).p - pExp * 1.5) < 1e-9); g.status = null;
 ok('Überraschung (schlafend) ×2 in Runde 1', Math.abs(calcCatch(g, 'kapsel', { roll: false, turn: 1, surprise: 2 }).p - pExp * 2) < 1e-9);
 ok('Ranke: Überraschung doppelt wirksam', Math.abs(calcCatch(g, 'rankenkapsel', { roll: false, turn: 1, surprise: 1.5 }).p - pExp * 1.3 * 2) < 1e-9);
 ok('Absolut fängt immer', [...Array(200)].every(() => calcCatch(g, 'meister', {}).ok));
 ok('Wucht ×2,2', Math.abs(calcCatch(g, 'wuchtkapsel', { roll: false, turn: 2 }).p - pExp * 2.2) < 1e-9);
 ok('Wucht verfehlt auf Distanz', [...Array(50)].some(() => calcCatch(g, 'wuchtkapsel', { dist: 1.3, rand: rnd }).miss));
 ok('Feder trifft auf Distanz', [...Array(50)].every(() => !calcCatch(g, 'federkapsel', { dist: 1.3, rand: rnd }).miss));
 ok('Aliasse aufgelöst', ['kapsel', 'superk', 'ultra', 'daemmer', 'netz', 'meister'].every(k => capOf(k).item === k && ITEMS[k].k === 'ball'));
 ok('12+ Kapseln + 3 handgefertigt', Object.keys(CAPSULES).length >= 15 && Object.values(CAPSULES).filter(c => c.craft).length === 3);
 // --- Wackler-Verteilung: 10.000 Würfe je Kapsel/Status ---
 const dist = {};
 for (const k of ['kapsel', 'superk', 'ultra', 'zuendkapsel', 'netz']) for (const st of [null, 'schlummer', 'starre']) {
  const t = mk(2, 20); t.hp = Math.ceil(stat(t, 'hp') / 2); t.status = st; const pp = calcCatch(t, k, { roll: false, turn: 2 }).p;
  const H = [0, 0, 0, 0], C = { crit: 0, okc: 0 }; let okN = 0;
  for (let i = 0; i < 10000; i++) { const x = calcCatch(t, k, { turn: 2, dex: 0, rand: rnd }); if (x.ok) okN++; H[x.shakes]++; }
  const rate = okN / 10000; dist[k + '/' + (st || '-')] = { p: +pp.toFixed(3), rate, H };
  ok('Fangrate ≈ p (' + k + '/' + (st || '-') + ')', Math.abs(rate - pp) < .025, { pp, rate });
  // Erwartete Verteilung: P(s Wackler, Fehlschlag)=q^s(1-q)
  const q = Math.pow(pp, 1 / 3); if (pp < 1) ok('Wackler-Verteilung (' + k + '/' + (st || '-') + ')', [0, 1, 2].every(s => Math.abs(H[s] / 10000 - Math.pow(q, s) * (1 - q)) < .02), H);
 }
 // Kritischer Fang: mit voller Chronik ~16 %, immer genau 1 Wackler
 { const t = mk(2, 20); t.hp = stat(t, 'hp'); let c = 0, one = true; for (let i = 0; i < 10000; i++) { const x = calcCatch(t, 'kapsel', { turn: 2, dex: 1, rand: rnd }); if (x.crit) { c++; if (x.shakes !== 1) one = false; } }
  ok('Kritischer Fang ≈16 % bei voller Chronik', Math.abs(c / 10000 - .16) < .015, c); ok('Kritisch = 1 Wackler', one);
  let c0 = 0; for (let i = 0; i < 5000; i++) if (calcCatch(t, 'kapsel', { turn: 2, dex: 0, rand: rnd }).crit) c0++; ok('Kein kritischer Fang ohne Fortschritt', c0 === 0); }
 // --- canEvolve: alle Methoden ---
 const E = (s, l, extra) => Object.assign(mk(s, l), extra || {});
 const ce = (m, ctx) => { const c = canEvolve(m, ctx); return c ? c.into + ':' + c.method : null; };
 ok('Level: Funki 16 → Loddo', ce(E(1, 16), { trigger: 'level' }) === '2:level'); ok('Level: Funki 15 nein', ce(E(1, 15), { trigger: 'level' }) === null);
 ok('Kristall: Knips + Donnerstein', ce(E(72, 10), { trigger: 'item', item: 'donnerstein' }) === '73:item'); ok('Kristall falsch', ce(E(72, 10), { trigger: 'item', item: 'froststein' }) === null);
 ok('Kristall nur über item-Trigger', ce(E(72, 10), { trigger: 'level' }) === null);
 ok('Tausch: Kiesel → Brummit', ce(E(22, 10, { traded: 1 }), { trigger: 'trade' }) === '23:trade'); ok('Tausch: Kannli → Teekrug', ce(E(129, 10, { traded: 1 }), { trigger: 'trade' }) === '130:trade');
 ok('Ohne Tausch: Kiesel nein', ce(E(22, 10), { trigger: 'trade' }) === null); ok('Tausch ohne Tauschweg: Knackel nein', ce(E(57, 10, { traded: 1 }), { trigger: 'trade' }) === null);
 G.time = 12 * 60; ok('Freundschaft tags: Blinki', ce(E(61, 10, { friendship: 230 }), { trigger: 'level' }) === '62:friendship'); ok('Freundschaft zu gering', ce(E(61, 10, { friendship: 100 }), { trigger: 'level' }) === null);
 G.time = 22 * 60; ok('Freundschaft nachts: Huschu → Nachtkauz', ce(E(116, 10, { friendship: 230 }), { trigger: 'level' }) === '117:friendship'); ok('Blinki nachts nein', ce(E(61, 10, { friendship: 230 }), { trigger: 'level' }) === null);
 G.time = 12 * 60; loadMap('moewenbucht'); ok('Ort: Muschel in Möwenbucht → Perlo', ce(E(37, 10), { trigger: 'level' }) === '38:location'); loadMap('route1', 9, 18); ok('Ort: Muschel woanders nein', ce(E(37, 10), { trigger: 'level' }) === null);
 G.time = 22 * 60; ok('Getragen + Nacht: Knabbi + Dunkelstein', ce(E(112, 8, { heldItem: 'dunkelstein' }), { trigger: 'level' }) === '113:held'); G.time = 12 * 60; ok('Getragen tags nein', ce(E(112, 8, { heldItem: 'dunkelstein' }), { trigger: 'level' }) === null);
 const pi = E(114, 8); pi.moves[0] = { id: 'blitzsprung', pp: 30 }; ok('Attacke: Zippi kennt Blitzsprung → Voltfink', ce(pi, { trigger: 'level' }) === '115:move');
 ok('Geschlecht m: Moosel Lv17', ce(E(90, 17, { gender: 'm' }), { trigger: 'level' }) === '91:gender'); ok('Geschlecht w: Moosel nein', ce(E(90, 17, { gender: 'w' }), { trigger: 'level' }) === null);
 ok('Spezial: Kralle 20× → Noxli', ce(E(31, 10, { useCount: { kralle: 20 } }), { trigger: 'battleEnd' }) === '32:special'); ok('Spezial: 19× nein', ce(E(31, 10, { useCount: { kralle: 19 } }), { trigger: 'battleEnd' }) === null);
 ok('Spezial: 3 Volltreffer → Blitzmähne', ce(E(72, 10), { trigger: 'battleEnd', crits: 3 }) === '73:special'); ok('Spezial: 2 Volltreffer nein', ce(E(72, 10), { trigger: 'battleEnd', crits: 2 }) === null);
 ok('Abbruch merkt sich Level', (() => { const x = E(1, 16); x._evoNo = 16; return ce(x, { trigger: 'level' }) === null && ce(x, { trigger: 'any' }) === '2:level'; })());
 // --- Verzweigungen ---
 const ends = new Set((MONS[118].evolutions || []).map(e => e.into)); ok('Wölki: 4 Endformen', ends.size >= 4, [...ends]);
 ok('Wölki Lv22 ohne Sonderweg → Wolkenwoll', ce(E(118, 22), { trigger: 'level' }) === '119:level');
 ok('Wölki + Lichtstein → Wolkengeist', ce(E(118, 12), { trigger: 'item', item: 'lichtstein' }) === '122:item');
 loadMap('frostheim'); const zf = ce(E(118, 22), { trigger: 'level' }); ok('Ort: Wölki in Frostheim → Frostwölk (vor Level)', zf === '120:location', zf); loadMap('route1', 9, 18);
 ok('Knips verzweigt (Blitzmähne/Glanzfell)', new Set(MONS[72].evolutions.map(e => e.into)).size === 2);
 ok('Frosti verzweigt (Glazirr/Eisfee)', new Set(MONS[75].evolutions.map(e => e.into)).size === 2);
 ok('Alle Arten haben evolutions[]', MONS.slice(1).every(M => Array.isArray(M.evolutions)));
 ok('ev bleibt erhalten (Level-Weg je Kanon-Linie)', MONS[1].ev && MONS[1].ev.to === 2 && MONS[72].ev.l === 16 && MONS[72].evolutions.some(e => e.method === 'item' && e.value === 'donnerstein'));
 ok('Methoden ≥ 8', new Set(MONS.slice(1).flatMap(M => M.evolutions.map(e => e.method))).size >= 8, [...new Set(MONS.slice(1).flatMap(M => M.evolutions.map(e => e.method)))]);
 ok('capsuleStock wächst mit Orden', capsuleStock(0).length < capsuleStock(2).length && capsuleStock(4).length > capsuleStock(3).length && !capsuleStock(8).includes('meister'));
 ok('Rezepte vorhanden + herstellbar', (() => { G.bag.federschote = 2; G.bag.kapsel = 1; const r = RECIPES.find(x => x.out === 'federkapsel'); return canCraft(r) && craft(r) && G.bag.federkapsel === 2; })());
 return { out, dist };
});
let bad = 0; for (const t of R.out) { if (!t.ok) bad++; console.log((t.ok ? '✓ ' : '✗ ') + t.n + (t.ok ? '' : '  ' + t.info)); }
console.log('\nWackler-Verteilung (10.000 Würfe, halbe KP, Loddo Lv20):'); for (const [k, v] of Object.entries(R.dist)) console.log(' ', k.padEnd(18), 'p=' + v.p, 'Rate=' + v.rate.toFixed(3), 'Wackler[0..3]=' + v.H.join('/'));
console.log('\n' + (bad || errs.length ? bad + ' Fehler ' + errs.join(' ') : 'Alle Unit-Tests bestanden.'));
await browser.close(); process.exit(bad || errs.length ? 1 : 0);
