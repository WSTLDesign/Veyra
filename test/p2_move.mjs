// Phase 2 · Bewegung: Zustände, Schwimmen, Gleiten, Reiten, Kanten, Klettern, Steuerkreuz unverändert
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 420, height: 860 } });
const errs = [], fails = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
const ev = c => p.evaluate(c), W = ms => p.waitForTimeout(ms);
const ok = (name, cond, info) => { console.log((cond ? '✓ ' : '✗ ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!cond) fails.push(name); };
const closeDlg = async () => { for (let i = 0; i < 6 && await ev("mode==='dialog'"); i++) { await ev('TW&&TW.finish&&TW.finish();advDlg()'); await W(60); } };
const st = () => ev('({x:P.x,y:P.y,px:+P.px.toFixed(2),py:+P.py.toFixed(2),s:P.state,dir:P.dir,run:P.run,map:cur.id,mode})');
await p.click('#iPrompt'); await W(400); await p.click('#iSkip'); await W(900);
await ev("typeof beginGame==='function'?beginGame({},true):newGame()"); await W(300); await closeDlg();
await ev("document.querySelectorAll('#intro,#title').forEach(e=>e.hidden=true);mode='world';G.team.push(mk(4,12));G.flags.starter=1;VILL.list=[];SET.btl='runde'"); await W(300); await closeDlg();
// Zufallsbegegnungen in Tests abfangen
await ev("window.__sb=[];startBattle=function(o){window.__sb.push(o.wild&&o.wild.s);held=null;}");

// ---- Steuerkreuz (Vorlage test/dpad.mjs) ----
await ev("loadMap('kupferhain',3,5);P.dir='down';mode='world'");
const r = await ev("(()=>{const r=document.querySelector('#dpad').getBoundingClientRect();return[r.x,r.y,r.width,r.height]})()");
const up = [r[0] + r[2] / 2, r[1] + r[3] * .15], right = [r[0] + r[2] * .85, r[1] + r[3] / 2];
if (r[2] > 0) {
 await p.mouse.move(...up); await p.mouse.down(); await W(60); await p.mouse.up(); await W(500); let s = await st();
 ok('Tippen ↑ dreht nur', s.x === 3 && s.y === 5 && s.dir === 'up', s);
 await p.mouse.move(...right); await p.mouse.down(); await W(200); await p.mouse.up(); await W(600); s = await st();
 ok('Halten 200 ms = 1 Feld', s.x === 4 && s.y === 5 && s.dir === 'right', s);
 await p.mouse.move(...right); await p.mouse.down(); await W(1500); await p.mouse.up(); await W(600); s = await st();
 ok('Halten 1,5 s läuft mehrere Felder', s.x >= 7 && s.x <= 9, s);
} else ok('Steuerkreuz sichtbar', false, r);

// ---- Sperre vor Freischaltung ----
await ev("G.badges=[];G.flags.swim=0;G.flags.glide=0;G.flags.climb=0;loadMap('brisenhafen',9,12);P.dir='down';mode='world'");
await ev("tryMove('down')"); await W(500); let s = await st();
ok('Wasser gesperrt ohne Wellenorden', s.y === 12 && s.s !== 'swim', s);
ok('Hinweis-Toast schwimmen', /schwimmen/.test(await ev("$('#toast').textContent")), await ev("$('#toast').textContent"));
await ev("loadMap('route3',2,3);P.dir='down';mode='world';tryMove('down')"); await W(600); s = await st();
ok('Gleiten gesperrt ohne Gletscherorden', s.y === 3, s);

// ---- Schwimmen 2D (Brisenhafen) ----
await ev("G.badges=['Blütenorden','Wellenorden'];loadMap('brisenhafen',9,12);P.dir='down';mode='world'"); await W(700);
ok('Freischaltung swim + Hinweis', await ev('!!G.flags.swim') && await ev("mode==='dialog'"));
await closeDlg();
await ev("held='down'"); await W(700); await ev('held=null'); await W(500); s = await st();
ok('2D ins Wasser ⇒ swim', s.y >= 13 && s.s === 'swim', s);
ok('Begleiter = Reittier unter Spielfigur', await ev('COMP&&COMP.mount&&Math.abs(COMP.px-P.px)<.01&&Math.abs(COMP.py-P.py)<.05'));
const t0 = Date.now(); await ev("held='right'"); await W(1300); await ev('held=null'); await W(450); s = await st();
ok('2D schwimmen langsamer (420 ms/Feld)', s.x >= 11 && s.x <= 13 && s.s === 'swim', s);
await ev("MV.swimNext=1;MV.swimN=0;window.__sb=[];tryMove('left')"); await W(600);
const sb = await ev('window.__sb'); ok('Wasser-Begegnung (Flut-Art)', sb.length === 1 && (await ev(`MONS[${sb[0]}].t.includes('flut')`)), sb);
await ev("mode='world';held='up'"); await W(1200); await ev('held=null'); await W(400); s = await st();
ok('Wasser verlassen ⇒ walk', s.y <= 12 && s.s === 'walk' && !(await ev('COMP.mount')), s);

// ---- Schwimmen 3D (Windküste) ----
await ev("G.time=11*60;loadMap('windkueste',7,7);mode='world';setView('third',true);P.ang=YAW.right;P.dir='right'"); await W(1200);
await ev('STICK.y=-1'); for (let i = 0; i < 60 && !(await ev("P.state==='swim'&&P.px>9.1")); i++) await W(100); await ev('STICK.y=0'); await W(300); s = await st();
ok('3D ins Wasser ⇒ swim', s.s === 'swim' && (s.x === 9 || s.x === 10), s);
await p.screenshot({ path: new URL('./p2_swim.png', import.meta.url).pathname });
await ev('STICK.y=-1'); for (let i = 0; i < 80 && !(await ev("P.x>=11&&P.state!=='swim'")); i++) await W(100); await ev('STICK.y=0'); await W(300); s = await st();
ok('3D Wasser verlassen ⇒ Land', s.x >= 11 && s.s !== 'swim', s);

// ---- Gleiten 2D + 3D (Route 3 Klippen) ----
await ev("setView('2d',true);G.badges.push('Gletscherorden');loadMap('route3',2,3);P.dir='down';mode='world'"); await W(600); await closeDlg();
ok('Freischaltung glide', await ev('!!G.flags.glide'));
await ev("tryMove('down')"); await W(150); const mid = await st(); await W(900); s = await st();
ok('2D Gleitflug über Kanten', mid.s === 'glide' && s.y === 6 && s.s === 'walk', { mid, s });
await ev("loadMap('route3',2,13);P.dir='down';mode='world';tryMove('down')"); await W(700); s = await st();
ok('2D Kante herunterspringen', s.y === 15, s);
await ev("tryMove('up')"); await W(600); s = await st(); ok('Kante: Rückweg blockiert', s.y === 15, s);
await ev("loadMap('route3',3,2);mode='world';setView('third',true);P.ang=YAW.down;P.dir='down'"); await W(1200);
await ev('STICK.y=-1'); let gl = null; for (let i = 0; i < 20 && !gl; i++) { await W(60); if (await ev("P.state==='glide'")) gl = await st(); }
await W(250); await p.screenshot({ path: new URL('./p2_glide.png', import.meta.url).pathname });
for (let i = 0; i < 40 && await ev("P.state==='glide'"); i++) await W(100);
await ev('STICK.y=0'); await W(300); s = await st();
ok('3D Gleitflug startet an Kante und landet', !!gl && s.y >= 6 && s.s !== 'glide', { gl, s });

// ---- Reiten (Route 1) ----
await ev("loadMap('route1',9,18);mode='world';setView('third',true);P.ang=YAW.up;P.dir='up'"); await W(1000);
await ev("document.querySelector('#rideBtn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))"); await W(200);
ok('#rideBtn ⇒ ride', await ev("P.state==='ride'&&P.run===true&&COMP.mount"));
const y0 = await ev('P.py'); await ev('STICK.y=-1'); for (let i = 0; i < 30 && y0 - await ev('P.py') < 3.5; i++) await W(80);
await p.screenshot({ path: new URL('./p2_ride.png', import.meta.url).pathname });
await ev('STICK.y=0'); await W(300); const y1 = await ev('P.py');
ok('3D Reiten schnell', y0 - y1 > 3.2, { d: y0 - y1 });
await p.keyboard.press('KeyR'); await W(150); ok('Taste R ⇒ absteigen', await ev("P.state==='walk'"));
await ev("setView('2d',true);loadMap('route1',1,8);P.dir='right';mode='world';toggleRide()"); await W(300);
await ev("held='right'"); await W(1700); await ev('held=null'); await W(400); s = await st();
ok('2D Reiten 170 ms/Feld', s.x >= 9 && s.s === 'ride', s);
await ev("[...Object.keys(NPCS)].forEach(k=>NPCS[k].forEach(n=>{if(n.t==='trainer')G.flags[n.flag]=1;}))");
await ev("loadMap('windkueste',12,7);P.dir='right';mode='world';if(!MV.ride)toggleRide()"); await W(100);
await ev("tryMove('right')"); await W(600); s = await st();
ok('Reiten: Kante bleibt seitlich gesperrt (einseitig)', s.x === 12 && s.s === 'ride', s);
await ev("P.dir='left';tryMove('left')"); await W(600); s = await st(); ok('Reiten: Kante nicht rückwärts', s.x <= 12, s);
await ev("toggleRide();tryMove('right')"); await W(600); s = await st(); ok('Zu Fuß: seitliche Kante blockiert', s.x === 12, s);
await ev("loadMap('route1',9,18);mode='world';G.team.forEach(m=>m.hp=0)"); await W(200);
ok('Reiten nur mit kampffähiger Kreatur', !(await ev('toggleRide()')) && await ev("P.state!=='ride'"));
await ev("G.team.forEach(m=>healMon(m));if(MV.ride)toggleRide()");

// ---- Klettern (Glutschlucht, Felswand x=9) ----
await ev("loadMap('glutschlucht',8,1);P.dir='right';mode='world'"); await ev("tryMove('right')"); await W(400);
ok('Klettern gesperrt ohne Mondorden', (await st()).x === 8);
await ev("G.badges.push('Mondorden')"); await W(600); await closeDlg();
await ev("held='right'"); await W(1400); const cl = await st(); await W(900); await ev('held=null'); await W(600); s = await st();
ok('Klettern über Felswand', cl.s === 'climb' || s.x >= 10, { cl, s });
ok('Nach Klettern wieder Land', s.x >= 10 && s.s === 'walk', s);

// ---- Kein Feststecken: Zufallslauf 2D + 3D auf Windküste ----
for (const v of ['2d', 'third']) {
 await ev(`loadMap('windkueste',8,10);mode='world';setView('${v}',true)`); await W(500);
 let stuck = 0, last = null;
 for (let i = 0; i < 24; i++) {
  const d = ['up', 'down', 'left', 'right'][i * 7 % 4];
  if (v === '2d') await ev(`held='${d}'`); else await ev(`STICK.x=${[0, 0, -1, 1][i * 7 % 4]};STICK.y=${[-1, -1, -.5, -.5][i * 7 % 4]}`);
  await W(v === '2d' ? 260 : 450); await ev("if(mode!=='world'){mode='world';$('#dlg').hidden=true;}");
  const q = await st(); const k = q.px + ',' + q.py; if (k === last) stuck++; last = k;
 }
 await ev('held=null;STICK.x=STICK.y=0'); await W(400); s = await st();
 const bad = await ev("(()=>{const t=tileAt(cur,P.x,P.y);return t===null||(SOLID.has(t)&&!isWaterT(t)&&t!=='X')})()");
 ok('Zufallslauf ' + v + ': gültige Kachel, Zustand ' + s.s, !bad && ['walk', 'run', 'swim', 'climb', 'ride'].includes(s.s), { s, stuck });
}
await ev("setView('2d',true)");
console.log('\n' + (fails.length ? 'FEHLGESCHLAGEN: ' + fails.join(' | ') : 'Alle Bewegungs-Prüfungen bestanden.'));
console.log(errs.length ? errs.join('\n') : 'Keine Konsolenfehler.');
await b.close();
