// Redesign Schritt 0/2: Screenshots aller Hauptzustände in Hoch- (390x844) und Querformat (860x400)
// Aufruf: node test/redesign/shots.mjs [before|after] [p|l] [Filter-Regex]
import { chromium } from 'playwright';
const pre = process.argv[2] || 'before', only = process.argv[3], F = process.argv[4] ? new RegExp(process.argv[4]) : null;
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [], done = [];
for (const [tag, W] of [['p', { width: 390, height: 844 }], ['l', { width: 860, height: 400 }]]) {
  if (only && only !== tag && only !== 'all') continue;
  const p = await b.newPage({ viewport: W, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push(tag + ' PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(tag + ' ' + m.text()); });
  await p.addInitScript(() => { window.VEYRA_DEMO = 1; try { localStorage.clear(); } catch (e) { } });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(new URL('../../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
  const ev = c => p.evaluate(c), wait = ms => p.waitForTimeout(ms);
  const shot = async n => { if (F && !F.test(n)) return; await p.screenshot({ path: new URL(`./${pre}_${n}_${tag}.png`, import.meta.url).pathname }); done.push(n + '_' + tag); };
  const want = n => !F || F.test(n);
  const tap = async (n = 1) => { for (let i = 0; i < n; i++) { await p.mouse.click(W.width / 2, W.height * .3); await wait(220); } };
  const toWorld = async () => { for (let i = 0; i < 30 && await ev("mode==='dialog'"); i++) { await ev("TW&&TW.finish&&TW.finish();if(!$('#dlgOpts').children.length)advDlg()"); await wait(60); } };
  const step = async (n, fn) => { if (!want(n)) return; try { await fn(); } catch (e) { errs.push(tag + ' ' + n + ': ' + e.message.split('\n')[0]); } };
  // Titel
  await p.click('#iPrompt').catch(() => { }); await wait(500); await p.click('#iSkip').catch(() => { }); await wait(1200);
  await ev("SET.res='720'");
  await step('titel', async () => { await wait(600); await shot('titel'); });
  // Intro mit Mentor + Charaktererstellung
  if (want('intro') || want('erstellung')) {
    await p.click('#tNew'); await wait(3800); await shot('intro');
    await p.click('.sqSkip').catch(() => { }); await wait(2400); await shot('erstellung');
    await ev("document.querySelectorAll('#seqL').forEach(e=>{e.hidden=true;e.innerHTML=''})");
  }
  // Spielstart direkt über beginGame()
  await ev("document.querySelectorAll('#intro,#title,#seqL').forEach(e=>e.hidden=true);beginGame({name:'Noa',rival:'Lio'},true);SET.btl='runde';SET.skipBattleIntro=1;G.flags.starter=1;G.team=[mk(1,12),mk(4,10),mk(7,9)];G.dex.caught[1]=G.dex.caught[4]=G.dex.caught[7]=1;for(let i=1;i<=24;i++)G.dex.seen[i]=1;G.badges=['Blütenorden'];G.visited=Object.assign(G.visited||{},{kupferhain:1,heil_kupfer:1,route1:1,morgenau:1});mode='world'");
  await toWorld();
  await step('welt3d_tag', async () => { await ev("G.time=10*60;loadMap('morgenau',13,9);P.dir='up';mode='world';setView('third',true)"); await wait(3200); await shot('welt3d_tag'); });
  await step('welt3d_nacht', async () => { await ev("G.time=22*60;loadMap('morgenau',13,9);P.dir='up';mode='world';setView('third',true)"); await wait(3200); await shot('welt3d_nacht'); });
  await step('heil_innen', async () => { await ev("G.time=12*60;loadMap('heil_kupfer',5,7);P.dir='up';mode='world';setView('third',true)"); await wait(3000); await shot('heil_innen'); });
  await ev("setView('2d',true);G.time=10*60"); await wait(500);
  await step('welt2d', async () => { await ev("loadMap('route1',9,12);P.dir='up';mode='world'"); await wait(900); await shot('welt2d'); });
  await step('dialog', async () => { await ev("loadMap('morgenau',13,7);mode='world';P.dir='right'"); await wait(700); await ev("talk(npcs().find(n=>n.t==='talk'))"); await wait(1300); await shot('dialog'); await toWorld(); await ev("mode='world'"); });
  await step('banner', async () => { await ev("mode='world';loadMap('kupferhain',...findWalk(8,10));void playSeq('areaBanner',{name:'Kupferhain',region:'Kupferhügel',lead:'#c9852e'})"); await wait(700); await shot('banner'); await wait(2400); });
  for (const t of ['map', 'team', 'dex', 'game']) await step('chronik_' + t, async () => { await ev(`loadMap('route1',9,12);mode='world';openMenu('${t}')`); await wait(1000); await shot('chronik_' + t); await ev('closeMenu()'); await wait(400); });
  // Kampf rundenbasiert
  const battle = async () => { await ev("loadMap('route1',9,12);mode='world';G.team.forEach(m=>m.hp=stat(m,'hp'));startBattle({wild:mk(13,6)})"); await p.waitForFunction(() => B && document.querySelector('#bMenu .big') && !B.busy, null, { timeout: 25000, polling: 150 }).catch(async () => { await tap(8); }); await wait(600); };
  if (want('kampf') || want('attacken')) {
    await battle(); await shot('kampf');
    await p.click('#bMenu .k1').catch(() => { }); await wait(700); await shot('attacken');
    await ev("endBattle('run')"); await wait(600);
  }
  await step('fang', async () => {
    await battle(); await ev("void (typeof uiCaught==='function'?uiCaught(B.foe[0],true):catchCard(B.foe[0],true))"); await wait(1600); await shot('fang');
    await ev("endBattle('run')"); await wait(300); await toWorld();
  });;
  await p.close();
}
console.log('Bilder:', done.length, done.join(' '));
console.log(errs.length ? errs.join('\n') : 'Screenshots ok.');
await b.close();
