import { start, page, newGame } from '../qa_lc_lib.mjs';
const env = await start(); const P = await page(env, { w: 960, h: 540, set: { quality: 'eigene', modelle3d: true } });
await newGame(P, { team: [[1, 12]], view: 'third' });
const r = await P.evaluate(async () => { await tmLoad(1); const o = buildTerra(1, 1, {}); const k = monRender(1); let o2; try { o2 = monObj(1, .8, {}, R3.scene); } catch (e) { o2 = { userData: { err: e.message } }; }
  return { on: tmOn(), ready: tmReady(1), tm: !!o.userData.tm, k, o2: Object.keys(o2.userData).slice(0, 12), terra: !!terraOf(1), TAHQ: typeof TA_HQ !== 'undefined' ? TA_HQ : 'undef', bt: buildTerra.toString().slice(0, 120), mr: monRender.toString().slice(0, 100) }; });
console.log(JSON.stringify(r, null, 1)); console.log(P.errs.slice(0, 3)); await env.close();
