// Terra-Serie – Funktionstest mit Schalter an (Welt + Kampf je Modell, keine Konsolenfehler). NUR unter der Chromium-Sperre:
//   LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT; node test/terras2/terras2_test.mjs
import { start, page, newGame, reporter } from '../qa_lc_lib.mjs';
const R = reporter('terras2/terras2_test.txt', 'Terra-Serie: Welt + Kampf mit Schalter modelle3d an');
const IDS = (process.env.ARTEN || '1,2,3,4,5,6,7,8,9').split(',').map(Number);
// Intro robust wegklicken (langsamer Start bei ausgelasteter CPU)
async function boot(p) { for (let i = 0; i < 60; i++) { for (const sel of ['#iPrompt', '#iSkip']) await p.click(sel, { timeout: 800 }).catch(() => { });
  const gone = await p.evaluate(() => { const s = document.querySelector('#intro'); if (!s || s.hidden) return true; const c = getComputedStyle(s); return c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0; });
  if (gone) return; await p.waitForTimeout(1000); } }
const env = await start();
const P = await page(env, { w: 960, h: 540, set: { quality: 'eigene', modelle3d: true } });
await boot(P);
await newGame(P, { team: [[1, 12]], view: 'third' });
const ld = await P.evaluate(async (ids) => { const t = performance.now(), out = {}; await Promise.all(ids.map(i => tmLoad(i))); for (const i of ids) out[i] = { ok: tmReady(i), ms: TMOD.ms[TMOD.ids[i]] }; out.gesamt = Math.round(performance.now() - t); out.pilotFunki = PILOT.st.funki; return out; }, IDS);
R.t('alle Modelle geladen', IDS.every(i => ld[i].ok), ld);
R.t('Pilot-Funki nicht doppelt geladen', ld.pilotFunki === 'serie', ld.pilotFunki);
for (const id of IDS) {
  // Welt: als wilde Kreatur im Gras
  const w = await P.evaluate(async (id) => { mode = 'world'; loadMap('route1', 9, 12); VILL && (VILL.list = []); ROAM.list = []; ROAM.want = 0; const r = ({s:id,l:5,x:9,y:10,px:9,py:10,fx:9,fy:10,t:1,dir:'down',next:performance.now()+800,st:'idle',stT:0,nat:monNature(id),owl:nightOwl(id),shiny:false,o:{shiny:false},g:null}); ROAM.list.push(r);
    await new Promise(res => setTimeout(res, 1200)); const mm = R3.scene.userData.mm, o = mm && mm.get(r); await new Promise(res => setTimeout(res, 2500));
    const U = o && o.userData; return { tm: !!(U && U.tm), clips: U && U.acts ? Object.keys(U.acts).length : 0, h: U && +U.h.toFixed(2) }; }, id);
  R.t(`Welt ${id}: Modell`, w.tm && w.clips >= 8, w);
  // Kampf: eigenes Modell gegen wildes Modell (statt flachem Bild)
  const foe = IDS[(IDS.indexOf(id) + 3) % IDS.length];
  await P.evaluate(([id, foe]) => { G.team = [mk(id, 12)]; G.time = 11 * 60; SET.btl = 'runde'; startBattle({ wild: mk(foe, 6) }); }, [id, foe]);
  await P.waitForFunction(() => typeof BT !== 'undefined' && BT && BT.foe && BT.me, null, { timeout: 15000 }).catch(() => { }); await P.waitForTimeout(1200);
  const b = await P.evaluate(() => { const A = BT && BT.me && BT.me.userData; if (A && A.act) A.act.atk = performance.now(); const F = BT && BT.foe && BT.foe.userData; if (F && F.act) F.act.hit = performance.now();
    return { me: !!(A && A.tm), foe: !!(F && F.tm), meSprite: !!(A && A.sprite), foeSprite: !!(F && F.sprite) }; });
  await P.waitForTimeout(900);
  const b2 = await P.evaluate(() => { if (!BT || !BT.foe) return false; const F = BT.foe.userData; F.act.ko = performance.now(); return true; }); await P.waitForTimeout(700);
  R.t(`Kampf ${id} vs ${foe}: beide als Modell`, b.me && b.foe && !b.meSprite && !b.foeSprite, b);
  await P.evaluate(() => { try { endBattle('run'); } catch (e) { } mode = 'world'; }); await P.waitForTimeout(500);
}
// Schalter aus ⇒ unverändert: neue Seite, kein Laden
const Q = await page(env, { w: 960, h: 540, set: { quality: 'eigene', modelle3d: false } });
await boot(Q);
await newGame(Q, { team: [[1, 12]], view: 'third' });
const off = await Q.evaluate(() => ({ on: tmOn(), st: Object.keys(TMOD.st).length }));
R.t('Schalter aus: nichts geladen', !off.on && off.st === 0, off);
R.t('keine Konsolenfehler (an)', P.errs.length === 0, P.errs.slice(0, 4));
R.t('keine Konsolenfehler (aus)', Q.errs.length === 0, Q.errs.slice(0, 4));
console.log(`\n${R.ok} ok, ${R.bad} Fehler`);
await env.close(); process.exit(R.bad ? 1 : 0);
