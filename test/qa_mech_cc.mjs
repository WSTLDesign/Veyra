// QA Mechanik – Prüfpunkt 7: Fangkarte (Vollbild-Layout 860×400 und 860×484, 3D- und 2D-Welt, lange Namen, Legende, Glanz) – Ergänzung zu unit_catchcard.
//   node test/qa_mech_cc.mjs     Bilder: test/qa_mech_cc_*.png
import { start, page, newGame, reporter, here } from './qa_mech_lib.mjs';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_cc.log', 'QA Mechanik Fangkarte');
const env = await start();
const VPS = { a: [860, 400, '2d'], b: [860, 484, '2d'], c: [860, 484, 'third'] }; const LAB = (process.env.QA_LABELS || 'normal,lang,legende,bildlos,glanz').split(',');
for (const [w, h, view] of (process.env.QA_VP || 'a,b,c').split(',').map(k => VPS[k])) {
  const p = await page(env, { w, h, flags: {} }); await newGame(p, { team: [[1, 20]], view, setup: "G.bag.kapsel=60;G.bag.superk=20;" });
  const ev = (f, a) => p.evaluate(f, a);
  // Arten: kürzeste, längste Namen/Texte, Legende, bildlos
  const picks = await ev(() => { const ids = Object.keys(MONS).map(Number).filter(s => MONS[s] && !MONS[s].legend); const len = s => (MONS[s].n + ' ' + (MONS[s].trait || '') + ' ' + (MONS[s].t || []).length); ids.sort((a, b) => len(b).length - len(a).length); const leg = Object.keys(MONS).map(Number).find(s => MONS[s] && MONS[s].legend); return { longest: ids[0], name: MONS[ids[0]].n, legend: leg, legendName: MONS[leg].n, plain: 59, img: 2 }; });
  R.note(`[${w}×${h} ${view}] Auswahl: ${JSON.stringify(picks)}`);
  for (const [label, id, shiny] of [['normal', 59, false], ['lang', picks.longest, false], ['legende', picks.legend, false], ['bildlos', 2, false], ['glanz', 25, true]].filter(q => LAB.includes(q[0]))) {
    await ev(async ([id, shiny]) => { const oc = document.querySelector('#bCard'); if (oc) oc.innerHTML = ''; mode = 'world'; ROAM.list = []; const m = mk(id, 5); if (shiny) m.shiny = true; delete G.dex.caught[id]; delete G.dex.seen[id]; startBattle({ wild: m }); await new Promise(r => setTimeout(r, 400)); }, [id, shiny]);
    await p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 }).catch(() => { });
    await ev(() => { B.foe[B.fi].hp = 1; }); await ev(() => { [...document.querySelectorAll('#bMenu button')].find(x => /Tasche/i.test(x.textContent)).click(); }); await p.waitForTimeout(500);
    await ev(() => { [...document.querySelectorAll('#bMenu button')].find(x => /Fangkapsel|Sternkapsel|Kapsel/i.test(x.textContent)).click(); });
    const got = await p.waitForFunction(() => { const c = document.querySelector('#bCard .cc'); return c && c.getBoundingClientRect().width > 0; }, null, { timeout: 60000 }).then(() => true, () => false);
    await p.waitForTimeout(2200);
    const m = await ev(() => { const c = document.querySelector('#bCard .cc') || document.querySelector('#bCard'); if (!c) return null; const r = c.getBoundingClientRect(); const img = c.querySelector('canvas,img'); const ri = img && img.getBoundingClientRect(); const o = { card: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], vp: [innerWidth, innerHeight], inView: r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1, img: ri && [Math.round(ri.width), Math.round(ri.height)], scrollOver: c.scrollHeight > c.clientHeight + 2, txt: c.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) };
      const kids = [...c.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.bottom > innerHeight + 1 || q.right > innerWidth + 1 || q.top < -1 || q.left < -1); }).length; o.outside = kids; return o; });
    await p.screenshot({ path: here(`qa_mech_cc_${w}x${h}_${view}_${label}.png`) });
    R.note(`[${w}×${h} ${view}] ${label}: ${JSON.stringify(m)}`);
    R.t(`${w}×${h} ${view} ${label}: Fangkarte komplett im Bild, Bildfeld ≥ 70 px, nichts abgeschnitten`, got && m && m.inView && m.img && m.img[0] >= 70 && m.img[1] >= 70 && m.outside === 0 && !m.scrollOver, m);
    for (let i = 0; i < 40 && await ev(() => !!B); i++) { await ev(() => { document.querySelector('#bCard') && document.querySelector('#bCard').click(); TW && TW.finish && TW.finish(); }); await p.waitForTimeout(250); }
    await p.waitForTimeout(300);
  }
  R.t(`[${w}×${h} ${view}] keine Konsolenfehler`, p.errs.length === 0, p.errs); await p.close();
}
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
