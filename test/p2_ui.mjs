// Phase 2 UI – Screenshots Hoch- und Querformat: Intro/Charaktererstellung, Chronik, Kampf Echtzeit/Runde, Dialog mit Emote
import { chromium } from 'playwright';
const only = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
for (const [tag, W] of [['p', { width: 390, height: 844 }], ['l', { width: 860, height: 400 }]]) {
  if (only && only !== tag) continue;
  const p = await b.newPage({ viewport: W, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push(tag + ' PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(tag + ' ' + m.text()); });
  await p.addInitScript(() => { window.VEYRA_DEMO = 1; localStorage.clear(); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
  const shot = n => p.screenshot({ path: new URL(`./p2_ui_${tag}_${n}.png`, import.meta.url).pathname });
  const ev = c => p.evaluate(c);
  await p.click('#iPrompt'); await p.waitForTimeout(400); await p.click('#iSkip'); await p.waitForTimeout(900);
  await ev("SET.res='720'");
  await p.click('#tNew'); await p.waitForTimeout(3600); await shot('intro1');
  const tapBox = async (n) => { for (let i = 0; i < n; i++) { await p.mouse.click(W.width / 2, 60); await p.waitForTimeout(160); await p.mouse.click(W.width / 2, 60); await p.waitForTimeout(260); } };
  await tapBox(2); await p.waitForTimeout(1600); await shot('intro2');
  await p.click('.sqSkip'); await p.waitForTimeout(2200); await shot('create');
  await p.click('.ccSeg[data-k=hair] button[data-v=zopf]'); await p.click('.ccSw[data-k=top] button:nth-child(2)'); await p.click('.ccSw[data-k=hairCol] button:nth-child(3)');
  await p.fill('#ccName', 'Juna'); await p.fill('#ccRival', 'Taro'); await p.waitForTimeout(300); await shot('create2');
  await p.click('.ccGo'); await p.waitForTimeout(500); await tapBox(3); await p.waitForTimeout(500);
  await p.waitForFunction(() => mode === 'dialog', null, { timeout: 8000 }).catch(() => errs.push(tag + ' Intro endet nicht im Dialog'));
  await p.waitForTimeout(600); await shot('home');
  // Dialog mit Emote + Umgebungsblase
  await ev("for(let i=0;i<4&&mode==='dialog';i++){TW&&TW.finish();advDlg();}G.team.push(mk(1,8));G.time=10*60;loadMap('morgenau',13,7);mode='world';P.dir='right';");
  await p.waitForTimeout(800); await ev("talk(npcs().find(n=>n.t==='talk'))"); await p.waitForTimeout(900); await shot('dialog');
  await ev("TW&&TW.finish();advDlg();mode='world';emote([10,9],'?');emote(null,'♪');AMB.next=0;loadMap('morgenau',13,8)"); await p.waitForTimeout(400); await shot('emote2d');
  // 3D mit Emote und Brotkrumen
  await ev("G.flags.starter=1;loadMap('route1',9,18);setView('third',true);mode='world';"); await p.waitForTimeout(1500); await ev("emote(null,'!');emote(npcs().find(n=>n.t==='trainer')||[9,15],'?')"); await p.waitForTimeout(350); await shot('emote3d'); await ev("setView('2d',true)");
  // Chronik
  for (const [shell, t] of [['holz', 'map'], ['kristall', 'team'], ['leder', 'quest'], ['prisma', 'dex']]) {
    await ev(`SET.shell='${shell}';G.badges=['Blütenorden'];G.visited.kupferhain=1;G.visited.heil_kupfer=1;loadMap('route1',9,12);mode='world';openMenu('${t}')`); await p.waitForTimeout(900); await shot('chronik_' + shell + '_' + t);
    await ev('closeMenu()'); await p.waitForTimeout(350);
  }
  await ev("SET.shell='holz';openMenu('map');mapView='world';renderMenu()"); await p.waitForTimeout(700); await shot('chronik_world');
  await ev("openMenu('game')"); await p.waitForTimeout(500); await shot('chronik_opts');
  await ev("mapView='here';openMenu('map')"); await p.waitForTimeout(400); await ev('closeMenu()'); await p.waitForTimeout(500); await shot('navarrow');
  // Kampf Echtzeit
  await ev("G.team=[mk(1,12),mk(4,10)];G.known2={};SET.btl='echtzeit';startBattle({wild:mk(10,9)})"); await p.waitForTimeout(2500);
  for (let i = 0; i < 6; i++) { await p.mouse.click(W.width / 2, W.height * .3); await p.waitForTimeout(250); }
  await p.waitForFunction(() => document.querySelector('#bMenu').children.length > 0, null, { timeout: 15000 });
  await ev('B.g.me=.45;B.g.foe=0'); await p.waitForTimeout(150); await shot('rt_cd');
  await ev('B.g.me=1;B.g.foe=0;G.known2.glut_kern=1;G.known2.glut_boe=1;B.st.foe.atk=-1;B.st.me.def=2;B.weather="regen";updB();showRT()'); await p.waitForTimeout(400); await shot('rt_ready');
  await ev("endBattle('run')"); await p.waitForTimeout(400);
  // Kampf Runde
  await ev("SET.btl='runde';startBattle({wild:mk(13,9)})"); await p.waitForTimeout(2500);
  for (let i = 0; i < 6; i++) { await p.mouse.click(W.width / 2, W.height * .3); await p.waitForTimeout(250); }
  await p.waitForFunction(() => document.querySelector('#bMenu').children.length > 0, null, { timeout: 15000 }); await p.waitForTimeout(500); await shot('round_main');
  await p.click('#bMenu .k1'); await p.waitForTimeout(600); await shot('round_moves');
  await ev("endBattle('run')"); await p.waitForTimeout(300);
  // Anruf + Schnellreise + Fähre
  await ev("void chronikCall('Prof. Lindqvist',['Test'])"); await p.waitForTimeout(700); await shot('call');
  await ev("$('#callOv .clOk').click();TW&&TW.finish();advDlg();"); await p.waitForTimeout(300);
  await ev("void playSeq('fastTravel',{to:'kupferhain',x:5,y:5,label:'Kupferhain'})"); await p.waitForTimeout(1100); await shot('fasttravel'); await p.waitForTimeout(1800);
  await ev("void playSeq('ferry',{from:'Brisenhafen',to:'Möwenbucht'})"); await p.waitForTimeout(3000); await shot('ferry'); await p.waitForTimeout(3800);
  await p.close();
}
console.log(errs.length ? errs.join('\n') : 'Screenshots ok.');
await b.close();
