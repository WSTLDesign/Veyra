// QA Phase 3 (b): UI-Konsistenz (Team-Detail, Tasche, Läden, Kristallschleiferin, Chronik-Tabs hoch/quer), Draw-Calls, Speicher nach 10 Kämpfen
import { boot, done } from './qa_p2_lib.mjs';
const t = await boot();
const { ev, Wt, ok, p } = t;
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const step = async (n, fn) => { if (ONLY && !ONLY.test(n)) return; const e0 = t.errs.length, f0 = t.fails.length; try { await fn(); } catch (e) { t.fails.push(n + ': ' + e.message); } if (t.errs.length > e0) t.fails.push(n + ' (Konsole): ' + t.errs.slice(e0).join(' | ')); console.log((t.fails.length > f0 ? '✗ ' : '✓ ') + n); };
const shot = n => p.screenshot({ path: new URL('./' + n, import.meta.url).pathname });
const noHScroll = async (what) => { const s = await ev("({d:document.documentElement.scrollWidth,w:innerWidth,m:(()=>{const e=document.querySelector('#mBody')||document.body;return[e.scrollWidth,e.clientWidth]})()})"); if (s.d > s.w + 1 || s.m[0] > s.m[1] + 1) throw new Error('horizontaler Scroll (' + what + ') ' + JSON.stringify(s)); };
const closeAll = async () => { await ev("(typeof closeMenu==='function')&&closeMenu();mode='world';1"); await Wt(100); };

await ev("G.team=[mk(1,16),mk(4,12),mk(10,5)];G.team[0].nature='ungestüm';G.team[0].ability=MONS[1].abilities[0];G.team[0].friendship=210;G.team.forEach(m=>m.hp=stat(m,'hp'));G.bag.kapsel=3;1");

await step('Team-Detail: Wesenszug ▲▼, Fähigkeit + Beschreibung, Freundschaft, 6 Werte', async () => {
  await ev("openMenu('team')"); await Wt(300); await p.click('.mon'); await Wt(400); await ev("dtab='stats';rDetail($('#mBody'))"); await Wt(300);
  const s = await ev("(()=>{const e=document.querySelector('#mBody');return{t:e.innerText,rows:[...e.querySelectorAll('.srow span')].map(x=>x.textContent.trim()),evo:!!e.querySelector('.evoBtn')}})()");
  const need = ['Wesenszug', 'Ungestüm', '▲', '▼', 'Freundschaft', 'Eng verbunden', '210/255', 'Sp.-Angriff', 'Sp.-Vert.'];
  const miss = need.filter(x => !s.t.includes(x)); if (miss.length) throw new Error('fehlt: ' + miss.join(',') + ' | ' + s.t.slice(0, 300));
  if (s.rows.length !== 6) throw new Error('Werte-Zeilen: ' + s.rows.length);
  const ab = await ev("ABIL[G.team[0].ability][1]"); if (!s.t.includes(ab)) throw new Error('Fähigkeits-Beschreibung fehlt');
  if (!s.evo) throw new Error('Entwickeln-Knopf fehlt bei Lv16 Glimmo'); await shot('qa_p3_detail.png'); await noHScroll('Detail');
});
await step('Team-Detail: Entwickeln-Knopf nur bei canEvolve; Info-Tab ohne Fehler', async () => {
  await ev("sel={i:1,box:false,slot:null};dtab='stats';rDetail($('#mBody'))"); await Wt(250);
  if (await ev("!!document.querySelector('#mBody .evoBtn')")) throw new Error('Knopf bei Lv12 Tröpfli');
  await ev("sel={i:0,box:false,slot:null};dtab='info';rDetail($('#mBody'))"); await Wt(250); const tx = await ev("document.querySelector('#mBody').innerText"); if (!/entwickelt sich/i.test(tx)) throw new Error('Info: ' + tx.slice(0, 200));
  await ev("sel={i:0,box:false,slot:null};dtab='moves';rDetail($('#mBody'))"); await Wt(250); await ev("sel=null;renderMenu()"); await closeAll();
});
await step('Tasche: neue Kapseln mit Kristall-Icon, keine Doppel', async () => {
  await ev("for(const k in ITEMS)if(ITEMS[k].k==='ball')G.bag[k]=2;G.bag.glanzbeere=1;G.bag.donnerstein=1;1"); await ev("openMenu('bag')"); await Wt(400);
  const s = await ev("(()=>{const rows=[...document.querySelectorAll('#mBody .item')];const names=rows.map(r=>(r.querySelector('b')||{}).textContent);const balls=Object.values(ITEMS).filter(i=>i.k==='ball').map(i=>i.n);return{n:names.length,dup:names.filter((x,i)=>names.indexOf(x)!==i),icons:rows.filter(r=>r.querySelector('.capIc')).length,balls:balls.length,miss:balls.filter(b=>!names.some(x=>x&&x.trim().startsWith(b)))}})()");
  if (s.dup.length) throw new Error('doppelt ' + s.dup); if (s.miss.length) throw new Error('fehlen in Tasche: ' + s.miss); if (s.icons < s.balls) throw new Error('Icons ' + s.icons + '/' + s.balls);
  await shot('qa_p3_bag.png'); await noHScroll('Tasche'); await closeAll();
});
await step('Läden: capsuleStock je Orden ohne Doppel', async () => {
  const res = {};
  for (const id of ['laden_kupfer', 'laden_brise', 'laden_frost', 'laden_schatt', 'laden_moewe']) for (const nb of [0, 2, 4]) {
    await ev(`G.badges=Array(${nb}).fill('x');G.ret={map:'kupferhain',x:5,y:10};loadMap('${id}');mode='world';1`); await Wt(150);
    const r = await ev(`(()=>{const I=INTERIORS['${id}'];openShop(I.stock);const names=[...document.querySelectorAll('#shopBody .item')].map(r=>(r.querySelector('b')||r).textContent.trim().replace(/\\s*×.*$/,''));const dup=names.filter((x,i)=>names.indexOf(x)!==i);const k=[...document.querySelectorAll('#shopBody .item')].length;closeMenu&&closeMenu();return{k,dup,caps:capsuleStock(${nb}).length}})()`);
    res[id + '/' + nb] = r.k + 'x' + r.caps; if (r.dup.length) throw new Error(id + ' mit ' + nb + ' Orden: doppelt ' + r.dup);
    await ev("document.querySelector('#shop')&&($('#shop').hidden=true);mode='world';1");
  }
  console.log('   ', JSON.stringify(res));
  const a = await ev("[0,1,2,3,4].map(n=>capsuleStock(n).length)"); if (!(a[0] < a[4])) throw new Error('capsuleStock wächst nicht: ' + a);
});
await step('Kristallschleiferin: ohne Zutaten Hinweis, mit Zutaten Kapsel', async () => {
  await ev("G.ret={map:'kupferhain',x:5,y:10};loadMap('haus_kupfer');mode='world';G.flags.craft_intro=1;delete G.bag.federschote;G.bag.kapsel=1;1"); await Wt(150);
  if (!await ev("NPCS.haus_kupfer.some(n=>n.hook==='werkbank')")) throw new Error('Juna fehlt');
  await ev("HOOKS.werkbank()"); await Wt(300);
  const opts = await ev("[...document.querySelectorAll('#dlgOpts button')].map(b=>b.textContent)"); if (opts.length < 7) throw new Error('Menü ' + JSON.stringify(opts));
  await p.click('#dlgOpts button'); await Wt(300);
  for (let i = 0; i < 4; i++) { await ev('TW&&TW.finish&&TW.finish()'); await Wt(60); }
  const tx = await ev("document.querySelector('#dlg')?document.querySelector('#dlg').innerText:document.body.innerText"); if (!/fehlen/.test(tx)) throw new Error('kein Hinweis: ' + tx.slice(0, 200));
  for (let i = 0; i < 12 && await ev("mode==='dialog'"); i++) { await ev('TW&&TW.finish&&TW.finish();if(!$("#dlgOpts").children.length)advDlg()'); await Wt(80); if (await ev("$('#dlgOpts').children.length")) break; }
  // Menü erneut (nach Hinweis ruft craftMenu): Fertig wählen
  await ev("(()=>{const b=[...document.querySelectorAll('#dlgOpts button')];b.length&&b[b.length-1].click()})()"); await Wt(200);
  for (let i = 0; i < 8 && await ev("mode==='dialog'"); i++) { await ev('TW&&TW.finish&&TW.finish();advDlg()'); await Wt(80); }
  await ev("G.bag.federschote=2;G.bag.kapsel=1;G.bag.federkapsel=0;1"); await ev("craftMenu()"); await Wt(300); await p.click('#dlgOpts button'); await Wt(300);
  for (let i = 0; i < 6; i++) { await ev('TW&&TW.finish&&TW.finish()'); await Wt(60); }
  const n = await ev("G.bag.federkapsel|0"); if (n !== 2) throw new Error('Federkapseln: ' + n);
  for (let i = 0; i < 10 && await ev("mode==='dialog'"); i++) { await ev('TW&&TW.finish&&TW.finish();advDlg();(()=>{const b=[...document.querySelectorAll("#dlgOpts button")];b.length&&b[b.length-1].click()})()'); await Wt(80); }
  await ev("mode='world';1");
});
for (const [name, W] of [['hoch', { width: 420, height: 860 }], ['quer', { width: 860, height: 420 }], ['schmal', { width: 340, height: 700 }]]) {
  await step(`Chronik-Tabs ${name}: alle Tabs ohne Fehler / Scroll`, async () => {
    await p.setViewportSize(W); await Wt(300); await ev("G.badges=['a','b'];G.team=[mk(1,16),mk(4,12),mk(10,5)];G.team.forEach(m=>m.hp=stat(m,'hp'));G.box=[];normalizeBox(G);boxAdd(mk(14,7));boxAdd(mk(2,9));1");
    for (const tb of ['team', 'bag', 'quest', 'dex', 'game', 'map', 'box', 'medals']) { await ev(`mode='world';sel=null;openMenu('${tb}')`); await Wt(350); await noHScroll(name + '/' + tb); if (tb === 'team') { await shot(`qa_p3_${name}_team.png`); await p.click('.mon'); await Wt(300); await shot(`qa_p3_${name}_detail.png`); await noHScroll(name + '/detail'); await ev("sel=null;renderMenu()"); } if (tb === 'bag') await shot(`qa_p3_${name}_bag.png`); }
    // Box-Kreatur im Team-Tab: Detail
    await ev("sel={box:true,i:0,slot:null};tab='team';rDetail($('#mBody'))"); await Wt(300); await noHScroll(name + '/boxdetail'); await ev("sel=null;1"); await closeAll();
  });
}
await p.setViewportSize({ width: 420, height: 860 }); await Wt(200);

// ---------- Performance ----------
await step('Draw-Calls Welt/Kampf ≤ 150, Geometrien nach 10 Kämpfen', async () => {
  await ev("setView('third',true);loadMap('route1',9,18);mode='world';1"); await Wt(2500);
  const world = await ev("(()=>{const r=R3&&R3.r||R3;return r&&r.info?{calls:r.info.render.calls,geo:r.info.memory.geometries,tex:r.info.memory.textures}:null})()");
  console.log('   Welt', JSON.stringify(world));
  if (!world) throw new Error('renderer nicht gefunden'); if (world.calls > 150) throw new Error('Welt Draw-Calls ' + world.calls);
  await ev("SET.btl='runde';SET.banim=1;1");
  const geo = [];
  let maxCalls = 0;
  for (let i = 0; i < 10; i++) {
    await ev(`mode='world';G.team=[mk(4,25)];G.team[0].hp=stat(G.team[0],'hp');startBattle({wild:mk(${[10, 13, 2, 14, 1][i % 5]},8)})`);
    await p.waitForFunction(() => typeof B !== 'undefined' && B && document.querySelector('#bMenu').children.length > 0 && !B.busy, null, { timeout: 15000, polling: 100 }).catch(() => {});
    await Wt(500);
    const r = await ev("(()=>{const r=BT&&BT.r;return r?{calls:r.info.render.calls,geo:r.info.memory.geometries,w:R3&&R3.info?R3.info.memory.geometries:0}:null})()");
    if (r) { maxCalls = Math.max(maxCalls, r.calls); geo.push(r.geo); }
    await ev("if(B)endBattle('run');mode='world';1"); await Wt(300);
  }
  console.log('   Kampf: max Draw-Calls', maxCalls, '· Geometrien je Kampf', JSON.stringify(geo));
  if (maxCalls > 150) throw new Error('Kampf Draw-Calls ' + maxCalls);
  if (geo.length > 6 && geo[geo.length - 1] > geo[5] * 1.3) throw new Error('Geometrien wachsen weiter: ' + geo[5] + ' → ' + geo[geo.length - 1]);
  t.perf = { world, maxCalls, geo };
});
await done(t);
