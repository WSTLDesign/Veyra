import { start, page, newGame } from '../qa_lc_lib.mjs';
const env = await start(); const P = await page(env, { w: 960, h: 540, set: { quality: 'eigene', modelle3d: true } }); P.on('pageerror', e => console.log('STACK', (e.stack || '').slice(0, 600)));
await newGame(P, { team: [[1, 12]], view: 'third' });
const r = await P.evaluate(async () => { await tmLoad(1); mode = 'world'; loadMap('route1', 9, 12); ROAM.list = []; const r = { s: 1, px: 9, py: 10, dir: 'down', t: 1, st: 'idle', o: {}, l: 5 }; ROAM.list.push(r);
  await new Promise(res => setTimeout(res, 1500)); const mm = R3.scene.userData.mm; return { n: mm ? mm.size : -1, inList: ROAM.list.includes(r), len: ROAM.list.length, keys: mm ? [...mm.keys()].map(k => k.s + ':' + !!mm.get(k).userData.tm) : [], comp: typeof COMP !== 'undefined' && COMP && COMP.s, mode }; });
console.log(JSON.stringify(r)); console.log(P.errs.slice(0, 3)); await env.close();
