// QA Phase 2 · C: Chronik-Stress, Hüllen, Karte, Schnellreise, Übergänge, NPC-Kommunikation, Optionen
import { boot, done } from './qa_p2_lib.mjs';
const t = await boot(); const { p, ev, Wt, ok, closeDlg } = t;
await ev("window.__origSB=startBattle;window.__sb=[];startBattle=function(o){window.__sb.push(1);held=null;}");
await ev("G.ret={map:'morgenau',x:7,y:11};loadMap('morgenau',7,12);mode='world';G.flags.ride=1;setView('2d',true)"); await Wt(400);
const clean = () => ev("({seqL:$('#seqL').hidden,call:$('#callOv').hidden,menu:$('#menu').hidden,mode,cv:document.querySelectorAll('.seqCv').length,out:document.querySelectorAll('.layer.out').length,fade:$('#fade')?.classList.contains('on')})");
// ---- 30× schnell öffnen/schließen ----
for (let i = 0; i < 30; i++) { await ev("mode==='world'&&(P.moving=false)"); await p.click('#btnB', { delay: 0 }); await Wt(i % 3 ? 40 : 15); if (await ev("!$('#menu').hidden")) await p.click('#mClose'); await Wt(i % 2 ? 30 : 5); }
await Wt(700); let c = await clean(); ok('Chronik 30× auf/zu: Menü zu, mode world', c.menu && c.mode === 'world' && c.out === 0, c);
await ev("openMenu('team')"); await Wt(100); await ev('closeMenu()'); await ev("openMenu('quest')"); await Wt(300); await ev('closeMenu()'); await Wt(600); c = await clean();
ok('Auf/Zu/Auf/Zu mit Seitenwechsel sauber', c.menu && c.mode === 'world', c);
// B-Taste (Tastatur Escape/Enter?) und pressB im Menü
await ev("pressB()"); await Wt(200); ok('pressB öffnet', await ev("mode==='menu'&&!$('#menu').hidden")); await ev('pressB()'); await Wt(500); ok('pressB schließt', await ev("mode==='world'&&$('#menu').hidden"));
// ---- alle 8 Seiten × 4 Hüllen ----
const tabs = await ev('Object.keys(CHTAB)'); ok('8 Chronik-Seiten', tabs.length === 8, tabs);
const emptyPages = [];
for (const shell of ['holz', 'leder', 'kristall', 'prisma']) {
  await ev(`SET.shell='${shell}';saveSet&&saveSet()`);
  for (const tb of tabs) { await ev(`G.team.length||0;openMenu('${tb}')`); await Wt(120); const r = await ev("({n:$('#mBody').children.length,sh:$('#menu').dataset.shell,w:document.documentElement.scrollWidth<=document.documentElement.clientWidth,tab})"); if (!r.n || r.sh !== shell || !r.w) emptyPages.push(shell + '/' + tb + JSON.stringify(r)); await ev('closeMenu()'); await Wt(330); }
}
ok('8 Seiten × 4 Hüllen rendern (nicht leer, Hülle gesetzt, kein H-Scroll)', emptyPages.length === 0, emptyPages);
await p.screenshot({ path: new URL('./qa_p2_shell.png', import.meta.url).pathname });
// ---- Karte Hier / Welt ----
await ev("openMenu('map')"); await Wt(300);
for (const k of ['world', 'here', 'world', 'here']) { await ev(`mapView='${k}';renderMenu()`); await Wt(250); const r = await ev("({cv:!!document.querySelector('.bigmap'),w:document.querySelector('.bigmap')?.width||0})"); ok('Karte ' + k, r.cv && r.w > 20, r); }
await ev('closeMenu()'); await Wt(400);
// ---- Missionen gesperrt zeigen Schloss ----
await ev("G.badges=[];openMenu('quest')"); await Wt(300);
const lk = await ev("({locked:document.querySelectorAll('.quest.locked').length,withLock:[...document.querySelectorAll('.quest.locked')].filter(q=>q.querySelector('svg')||/🔒/.test(q.textContent)).length,req:document.querySelectorAll('.qreq').length})");
ok('Gesperrte Missionen mit Schloss + Voraussetzung', lk.locked > 0 && lk.withLock === lk.locked && lk.req === lk.locked, lk);
await ev('closeMenu()'); await Wt(400);
// ---- Schnellreise ----
const spots = await ev("healSpots().map(s=>({t:s.town,h:s.heal,x:s.x,y:s.y}))"); ok('Heilstationen gefunden', spots.length >= 3, spots.map(s => s.t));
await ev("G.badges=[];G.visited={}"); await ev("openMenu('map');mapView='world';renderMenu()"); await Wt(300);
ok('Schnellreise ohne Orden gesperrt', await ev("[...document.querySelectorAll('.ftb')].every(b=>b.disabled)"));
await ev('closeMenu()'); await Wt(400);
const target = spots.find(s => s.t === 'kupferhain') || spots[1];
await ev(`G.badges=['Blütenorden'];G.visited={'${target.t}':1,'${target.h}':1};loadMap('morgenau',7,12);mode='world'`); await ev("openMenu('map');mapView='world';renderMenu()"); await Wt(400);
await ev("tab==='map'||openMenu('map')"); const nEn = await ev("[...document.querySelectorAll('.ftb')].filter(b=>!b.disabled).length"); ok('Schnellreise-Eintrag freigeschaltet (nur besucht)', nEn === 1, nEn);
await p.locator('.ftb:not([disabled])').first().click();
await p.waitForFunction(t0 => mode === 'world' && cur.id === t0 && document.querySelectorAll('.seqCv').length === 0, target.t, { timeout: 15000 }).catch(() => {});
await Wt(700); c = await clean(); const at = await ev('({id:cur.id,x:P.x,y:P.y})');
ok('SEQ.fastTravel endet in world an richtiger Karte, ohne hängende Overlays', at.id === target.t && c.mode === 'world' && c.seqL && c.call && c.cv === 0 && c.menu, { at, c });
// ---- Übergänge: Tür / Treppen / Banner / Fähre ----
await ev("loadMap('morgenau',7,12);mode='world'"); await Wt(200);
const f0 = Date.now(); await ev("playSeq('doorFade',{fn:()=>loadMap('labor'),to:'labor'})"); await Wt(40); const fcol = await ev("$('#fade').style.background"); await Wt(600);
ok('doorFade: Zielfarbe gesetzt, endet in world, Karte gewechselt', !!fcol && await ev("mode==='world'&&cur.id==='labor'&&!$('#fade').classList.contains('on')"), { fcol, ms: Date.now() - f0 });
for (const kind of ['stairs', 'ladder', 'edge']) { await ev(`playSeq('doorFade',{fn:()=>0,to:'morgenau',kind:'${kind}'})`); await Wt(700); ok('doorFade ' + kind, await ev("mode==='world'&&!$('#fade').classList.contains('on')")); }
await ev("loadMap('morgenau',7,12)"); await ev("playSeq('areaBanner',{name:'Testroute',region:'Region',lead:'#3d8fe0',ms:900});0"); await Wt(200); ok('areaBanner sichtbar', await ev("$('#mapCard').classList.contains('on')&&$('#mcName').textContent.length>0")); await Wt(1000); ok('areaBanner verschwindet', await ev("!$('#mapCard').classList.contains('on')"));
await ev("G.visited={};loadMap('route1',9,20);mode='world'"); await ev("transit(()=>loadMap('route2',9,20),'route2')"); await Wt(900); await ev("updHud&&0"); ok('Routenwechsel zeigt Banner', await ev("document.querySelector('#mcName').textContent.length>0&&mode==='world'"), await ev("$('#mcName').textContent"));
await ev("playSeq('ferry',{from:'Brisenhafen',to:'Möwenbucht',map:'moewenbucht',x:5,y:5,ms:1500})"); await p.waitForFunction(() => mode === 'world' && cur.id === 'moewenbucht' && !document.querySelector('.seqCv.ferry'), null, { timeout: 8000 }).catch(() => {}); await Wt(500);
c = await clean(); ok('Fähre endet in world an Zielkarte', c.mode === 'world' && c.cv === 0 && await ev("cur.id==='moewenbucht'"), c);
// ---- Kampfstart-Zeit ----
const timeBattle = async (label, setup) => { await ev("loadMap('route1',9,18);mode='world';held=null"); await ev(setup); await p.waitForFunction(() => !B && mode === 'world', null, { timeout: 4000 }).catch(() => {});
  const r = await p.evaluate(() => new Promise(res => { window.__t0 = performance.now(); startBattle({ wild: mk(10, 3) }); const iv = setInterval(() => { if (B && document.querySelector('#bMenu').children.length > 0) { clearInterval(iv); res(Math.round(performance.now() - window.__t0)); } }, 16); setTimeout(() => { clearInterval(iv); res(-1); }, 9000); }));
  console.log('  Kampfstart ' + label + ': ' + r + ' ms'); await ev("B=null;$('#battle').hidden=true;mode='world'"); return r; };
await ev("startBattle=window.__origSB;SET.btl='runde';G.nb=0");
const times = {};
times.erster = await timeBattle('1. Kampf (voller Übergang)', "G.nb=0;SET.skipBattleIntro=0");
times.kurz = await timeBattle('ab 3. Kampf (kurzer Übergang)', "G.nb=5;SET.skipBattleIntro=0");
times.skip = await timeBattle('skipBattleIntro=1', "G.nb=0;SET.skipBattleIntro=1");
await ev("SET.skipBattleIntro=0;SET.btl='echtzeit'"); times.rt = await timeBattle('Echtzeit, kurz', "G.nb=5");
console.log('  (Software-GL: ein Frame ~600 ms verzerrt Timer; geplante Timeouts siehe Bericht)'); ok('Kampfstart ausgeführt (Zeiten unter Software-GL nur Orientierung)', times.skip > 0 && times.skip <= times.erster + 500, times);
const tmo = await ev("(()=>{const s=startBattle.toString()+startBattleNow.toString();return[...s.matchAll(/(\\d+)\\s*[,)]/g)].length})()");
// ---- NPC-Kommunikation ----
await ev("SET.btl='runde';loadMap('morgenau',7,12);mode='world';setView('2d',true)"); await Wt(300);
await ev("emote(null,'!')"); await Wt(120); ok('Emote 2D (Spielfigur)', await ev('EMO.length>0'), await ev('EMO.length'));
await ev("setView('third',true)"); await Wt(900); await ev("emote(null,'♥');emote(NPCS.morgenau[0],'?')"); await Wt(300); ok('Emote 3D (Sprite)', await ev('EMO.some(e=>e.spr)'), await ev('EMO.map(e=>!!e.spr)')); await ev("setView('2d',true)"); await Wt(300);
await ev("EMO.length=0;SET.amb=1;AMB.next=0;AMB.seen.clear();const n0=NPCS.morgenau.find(n=>n.t==='talk'&&n.txt&&!n.prof);P.x=P.px=n0.x+2;P.y=P.py=n0.y;P.moving=false;mode='world'"); await Wt(2500);
ok('Sprechblase naher Bewohner', await ev("$('#ambB').classList.contains('on')&&$('#ambB').textContent.length>0"), await ev("$('#ambB').textContent"));
await ev("chronikCall('Test Anruf',['Hallo!']);0"); await Wt(300); ok('chronikCall erscheint', await ev("!$('#callOv').hidden&&mode==='wait'")); await p.click('#callOv .clOk'); await Wt(500); await closeDlg(); await Wt(300); ok('chronikCall schließt per Tipp, mode world', await ev("$('#callOv').hidden&&mode==='world'"), await ev('mode'));
// Schild-NPC
await ev("NPCS.morgenau.push({x:P.x+1,y:P.y,t:'sign',txt:['Willkommen in Morgenau!','Zweite Zeile.']});mode='world';P.dir='right';"); await Wt(150); await ev('interact()'); await Wt(300);
ok('Schild sprechbar (Dialog öffnet, kein Portrait)', await ev("mode==='dialog'&&$('#dlg').classList.contains('sign')&&$('#dlgFace').hidden"), await ev("$('#dlgText').textContent"));
await closeDlg(); await ev("NPCS.morgenau.pop()"); await Wt(100);
// Du erhältst
await ev("say(['Du erhältst 3 Kapseln!'])"); await Wt(300); ok('„Du erhältst“-Hook (get-Klasse, Jingle ohne Fehler)', await ev("$('#dlg').classList.contains('get')")); await closeDlg();
// Texttempo
for (const sp of ['langsam', 'normal', 'schnell', 'sofort']) { await ev(`SET.text='${sp}'`); await ev("say(['Ein ziemlich langer Beispieltext für das Texttempo.'])"); await Wt(150); const l = await ev("$('#dlgText').textContent.length"); await ev('TW&&TW.finish&&TW.finish()'); await closeDlg(); console.log('  Texttempo ' + sp + ': nach 150 ms ' + l + ' Zeichen'); }
const opts = await ev("(()=>{const o={};for(const k of ['text','font','banim','shell','shellAcc','skipBattleIntro','crumbs','amb','lang'])o[k]=SET[k];return o})()"); console.log('  SET:', JSON.stringify(opts));
await ev("SET.text='normal'");
// Textgröße
const fs = {}; for (const f of ['klein', 'normal', 'gross']) { await ev(`SET.font='${f}';applySet()`); await ev("say(['Test'])"); await Wt(100); fs[f] = await ev("parseFloat(getComputedStyle($('#dlgText')).fontSize)+'|'+document.body.className+'|'+(document.documentElement.scrollWidth<=document.documentElement.clientWidth)"); await closeDlg(); }
ok('Textgröße S/M/L ändert Schriftgröße, kein H-Scroll', fs.klein.split('|')[0] < fs.normal.split('|')[0] && parseFloat(fs.gross.split('|')[0]) > parseFloat(fs.normal.split('|')[0]) && Object.values(fs).every(v => v.endsWith('true')), fs);
await ev("SET.font='normal';applySet()");
// Farbschwäche / banim aus / skipBattleIntro im Kampf-UI
await ev("SET.cb=1;applySet()"); await ev("setView('2d',true);SET.btl='runde';startBattle=window.__origSB;startBattle({wild:mk(10,3)})"); await p.waitForFunction(() => B && document.querySelector('#bMenu').children.length > 0, null, { timeout: 15000 }).catch(() => {});
ok('Farbschwäche: body.cb gesetzt, KP-Balken blau (Kontur/Muster)', await ev("document.body.classList.contains('cb')&&getComputedStyle(document.body).getPropertyValue('--hp1').trim()==='#4a9bff'"));
await ev("B=null;$('#battle').hidden=true;mode='world';SET.cb=0;applySet()");
await ev("SET.banim=0;applyUiSet()"); ok('banim aus → body.noBattleAnim-Klasse', await ev("document.body.classList.contains('noBanim')")); await ev("SET.banim=1;applyUiSet()");
await done(t);
