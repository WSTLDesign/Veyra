// Terras – Kampf- und Welt-Aufnahmen (Agent Terras, Opus hoch; Fortsetzung 15:30). Nur unter der Chromium-Sperre starten.
// → test/terras_kampf.png (Loddo gegen Brocken: zwei bildlose Arten, beide als neues Tiermodell im 3D-Kampf)
// → test/terras_kampf_bild.png (Flammel als Modell gegen Knackel mit gemaltem Bild – Kampf zeigt das Bild, wo es eins gibt)
// → test/terras_welt.png (Route 1, Begleiter Flammel läuft als 3D-Modell mit, kein Billboard)
import { start, page, newGame } from './qa_lc_lib.mjs';
const env = await start(); const p = await page(env, { w: 860, h: 484 });
await newGame(p, { team: [[2, 22], [3, 36]], view: 'third' }); await p.evaluate(() => { window.VEYRA_DEMO = 1; });
const fight = async (wild, lv, file) => {
  await p.evaluate(([w, l]) => { VILL && (VILL.list = []); G.time = 11 * 60; SET.btl = 'runde'; startBattle({ wild: mk(w, l) }); }, [wild, lv]);
  await p.waitForTimeout(2600); for (let i = 0; i < 5; i++) { await p.mouse.click(430, 200); await p.waitForTimeout(300); }
  await p.waitForTimeout(1200); await p.screenshot({ path: file });
  return p.evaluate(() => { const r = { mode }; try { endBattle && endBattle(); } catch (e) { } mode = 'world'; return r; });
};
await fight(58, 20, 'test/terras_kampf.png');
await p.evaluate(() => { G.team = [mk(3, 36), mk(2, 22)]; }); await p.waitForTimeout(400);
await fight(57, 18, 'test/terras_kampf_bild.png');
await p.evaluate(() => { mode = 'world'; G.team = [mk(3, 36), mk(2, 22)]; loadMap('route1', 9, 12); setView('third', true); VILL && (VILL.list = []); ROAM && (ROAM.want = 0, ROAM.list = []); P.dir = 'down'; });
await p.waitForTimeout(2500); await p.evaluate(() => { P.run = false; STICK.y = 1; }); await p.waitForTimeout(900); await p.evaluate(() => { STICK.y = 0; }); await p.waitForTimeout(1600);
const info = await p.evaluate(() => { const S = R3 && R3.scene, mm = S && S.userData.mm, o = mm && COMP && mm.get(COMP); return { comp: COMP && COMP.s, kind: o ? (o.userData.sprite ? 'Billboard' : o.userData.terra ? '3D-Modell (Terra)' : '3D') : '–' }; });
await p.screenshot({ path: 'test/terras_welt.png' });
console.log('Begleiter', JSON.stringify(info), p.errs.length ? 'FEHLER: ' + p.errs.join(' | ') : 'ok');
await env.close();
