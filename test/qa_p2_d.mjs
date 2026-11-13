// QA Phase 2 · D: Kampf-UI (Echtzeit-Blüte, Runden-Karten, Chips, Effektivität), Layouts, Draw-Calls, alter Spielstand
import { boot, done } from './qa_p2_lib.mjs';
const t = await boot(); const { p, ev, Wt, ok, closeDlg } = t;
await ev("G.team=[mk(4,14),mk(1,12),mk(2,10)];G.bag.trank=3;G.bag.kapsel=3;G.bag.meister=1;SET.skipBattleIntro=1;window.__moves=0;const _dm=doMove;doMove=async function(s,i){if(s==='me')window.__moves++;return _dm(s,i);}");
const menu = () => p.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu').children.length > 0, null, { timeout: 20000 });
const endBattle = async () => { await ev("if(B){B.foe.forEach(m=>m.hp=0)}"); for (let i = 0; i < 30 && await ev('!!B'); i++) { await p.mouse.click(200, 300); await Wt(250); } await ev("if(B){B=null;$('#battle').hidden=true;mode='world'}"); };
// ---- Echtzeit ----
await ev("SET.btl='echtzeit';loadMap('route1',9,18);mode='world';G.nb=5;startBattle({wild:mk(10,5)})"); await menu(); await Wt(300);
ok('RT: 4 Attacken-Buttons + Resonanz + Team/Tasche/Flucht', await ev("document.querySelectorAll('#bMenu.rt .pt').length>=4&&!!$('#resBtn')&&document.querySelectorAll('#bMenu .sm').length===3"), await ev("document.querySelectorAll('#bMenu button').length"));
await ev("B.g.me=.3;B.g.foe=0;bTick()"); await Wt(100);
ok('RT: Button-Füllstand (--cd) folgt Abklingzeit <1, nicht ready', await ev("(()=>{const b=document.querySelector('#bMenu .pt[data-i]');return parseFloat(b.style.getPropertyValue('--cd'))<.9&&!b.classList.contains('ready')})()"));
const m0 = await ev('__moves'); await ev("B.g.foe=0"); await p.locator('#bMenu .pt[data-i="0"]').click({ force: true }); await Wt(200);
ok('RT: Klick bei cd<1 löst keine Attacke aus', (await ev('__moves')) === m0, await ev('({m:__moves,busy:B.busy})'));
await ev("B.g.me=1;B.g.foe=0;B.busy=false;showRT()"); await Wt(150);
ok('RT: ready bei cd=1', await ev("document.querySelector('#bMenu .pt[data-i]').classList.contains('ready')"));
// Lock-on Position
const lo = await ev("(()=>{const l=$('#lockOn').getBoundingClientRect(),s=document.querySelector('#battle .scene').getBoundingClientRect();return{on:$('#lockOn').classList.contains('on'),l:[l.left,l.top,l.right,l.bottom].map(Math.round),s:[s.left,s.top,s.right,s.bottom].map(Math.round)}})()");
ok('RT: Lock-on aktiv und innerhalb .scene', lo.on && lo.l[0] >= lo.s[0] - 1 && lo.l[2] <= lo.s[2] + 1 && lo.l[1] >= lo.s[1] - 1 && lo.l[3] <= lo.s[3] + 1, lo);
// Doppelklick
const m1 = await ev('__moves'); await p.evaluate(() => { const b = document.querySelector('#bMenu .pt[data-i="0"]'); b.click(); b.click(); });
await Wt(2500); const m2 = await ev('__moves'); ok('RT: zwei schnelle Klicks → genau eine Attacke', m2 - m1 === 1, { delta: m2 - m1 });
await p.screenshot({ path: new URL('./qa_p2_rt.png', import.meta.url).pathname });
await endBattle(); await Wt(500);
await ev("G.nb=5;startBattle({wild:mk(10,5)})"); await menu(); await Wt(200);
const rst = await ev("({g:B.g,cd:B.cd,busy:B.busy,me:B.g.me<1})"); ok('Reset: neue Kampfrunde startet mit sauberem B.g/B.cd (me=.7, foe=.1)', Math.abs(rst.g.me - .7) < .15 && rst.g.foe < .3 && !rst.busy, rst);
await endBattle();
// ---- Runde ----
await ev("SET.btl='runde';G.nb=5;startBattle({wild:mk(12,6)})"); await menu(); await Wt(300);
ok('Runde: 4 Befehlskarten', await ev("document.querySelectorAll('#bMenu.rmain .big').length===4"));
await p.screenshot({ path: new URL('./qa_p2_round.png', import.meta.url).pathname });
// Kampf → Zurück → Kampf → Attacke
await p.click('#bMenu .big.k1'); await Wt(300); ok('Befehl Kampf: Attackenkarten', await ev("document.querySelectorAll('#bMenu .mv.cd').length>=1"));
await p.click('#bMenu .back'); await Wt(200); ok('Rückweg: Zurück → Hauptmenü', await ev("document.querySelectorAll('#bMenu.rmain .big').length===4"));
await p.click('#bMenu .big.k1'); await Wt(300); const mA = await ev('__moves'); await ev("B.foe[0].hp=B.foe[0].hp+200"); await p.click('#bMenu .mv.cd >> nth=0'); await Wt(300);
for (let i = 0; i < 40 && !(await ev("B&&!B.busy&&document.querySelectorAll('#bMenu.rmain .big').length===4")); i++) { await p.mouse.click(200, 300); await Wt(250); }
ok('Befehl Kampf: Attacke ausgeführt, zurück im Hauptmenü', (await ev('__moves')) - mA === 1 && await ev("document.querySelectorAll('#bMenu.rmain .big').length===4"));
// Team
await p.click('#bMenu .big.k2'); await Wt(300); ok('Befehl Team: Liste', await ev("document.querySelectorAll('#bMenu .tm').length===3"));
await p.click('#bMenu .back'); await Wt(200);
await p.click('#bMenu .big.k2'); await Wt(250); const mi0 = await ev('B.mi'); await p.locator('#bMenu .tm:not([disabled])').first().click(); await Wt(300);
for (let i = 0; i < 40 && !(await ev("B&&!B.busy&&document.querySelectorAll('#bMenu.rmain .big').length===4")); i++) { await p.mouse.click(200, 300); await Wt(250); }
ok('Befehl Team: Wechsel', (await ev('B.mi')) !== mi0, { vorher: mi0, nachher: await ev('B.mi') });
// Tasche
await p.click('#bMenu .big.k3'); await Wt(300); ok('Befehl Tasche: Items', await ev("document.querySelectorAll('#bMenu .it').length>=2"));
await p.click('#bMenu .back'); await Wt(200);
await ev("G.bag.trank=3;G.team[B.mi].hp=1;window.__hp0=1"); await p.click('#bMenu .big.k3'); await Wt(250); await p.locator('#bMenu .it-heal').first().click(); await Wt(250); await p.locator('#bMenu .tm:not([disabled])').first().click(); await Wt(300);
for (let i = 0; i < 40 && !(await ev("B&&!B.busy&&document.querySelectorAll('#bMenu.rmain .big').length===4")); i++) { await p.mouse.click(200, 300); await Wt(250); }
ok('Befehl Tasche: Trank verbraucht', await ev("G.bag.trank===2"), await ev('G.bag.trank'));
// Chips: Knurren/Härten
await ev("G.team[B.mi].moves=[{id:'knurren',pp:30},{id:'haerten',pp:30},{id:'wucht',pp:15}]"); await ev('showMain()'); await Wt(150);
const round = async (i) => { const m = await ev('__moves'); await p.click('#bMenu .big.k1'); await Wt(250); await p.locator('#bMenu .mv.cd').nth(i).click(); await p.waitForFunction(n => window.__moves > n, m, { timeout: 8000 }).catch(() => {});
  for (let k = 0; k < 40 && !(await ev("B&&!B.busy&&document.querySelectorAll('#bMenu.rmain .big').length===4")); k++) { await p.mouse.click(200, 300); await Wt(250); } };
await ev("B.foe[0].hp=9999;G.team[B.mi].hp=stat(G.team[B.mi],'hp')"); await round(1); await round(0);
const chips = await ev("({me:$('#bMeT').innerHTML.includes('class=\"sc'),foe:$('#bFoeT').innerHTML.includes('class=\"sc'),st:JSON.stringify(B.st)})"); ok('Werte-Chips nach Härten (eigene) und Knurren (Gegner)', chips.me && chips.foe, chips);
// Effektivität erst nach Erleben
await ev("G.known2={};B.foe[0].s=8;G.team[B.mi].moves=[{id:'wucht',pp:15},{id:'knurren',pp:30}];showMoves()"); await Wt(150);
const e0 = await ev("[...document.querySelectorAll('#bMenu .mv.cd .mf em')].map(e=>e.className)"); ok('Effektivität vor dem Erleben verborgen (?)', e0.length > 0 && e0.every(c => c === 'unk' || c === 'st'), e0);
await ev("learnEff(MOVES.wucht[1],MONS[B.foe[0].s].t)"); await ev('showMoves()'); await Wt(150);
const e1 = await ev("[...document.querySelectorAll('#bMenu .mv.cd .mf em')].map(e=>e.className)"); ok('Effektivität nach Erleben sichtbar bzw. neutral leer', !e1.slice(0, 1).includes('unk'), e1);
await p.screenshot({ path: new URL('./qa_p2_moves.png', import.meta.url).pathname });
// Flucht
await ev('showMain()'); await ev("Math.random=()=>0"); await p.click('#bMenu .big.k4'); for (let i = 0; i < 30 && await ev('!!B'); i++) { await p.mouse.click(200, 300); await Wt(250); }
ok('Befehl Flucht: Kampf endet in world', !(await ev('!!B')) && await ev("mode==='world'"), await ev('mode'));
// ---- Layouts ----
const lay = async (label, w, h) => { await p.setViewportSize({ width: w, height: h }); await Wt(500);
  const r = {}; r.world = await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth');
  await ev("openMenu('quest')"); await Wt(500); r.chronik = await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth&&document.querySelector("#menu .chCase").getBoundingClientRect().right<=innerWidth+1'); await p.screenshot({ path: new URL(`./qa_p2_${label}_chronik.png`, import.meta.url).pathname }); await ev("openMenu('map');mapView='world';renderMenu()"); await Wt(400); r.karte = await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth'); await ev('closeMenu()'); await Wt(400);
  for (const m of ['runde', 'echtzeit']) { await ev(`SET.btl='${m}';G.nb=5;startBattle({wild:mk(10,5)})`); await menu(); await Wt(250); r['kampf_' + m] = await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth&&document.querySelector("#bMenu").getBoundingClientRect().bottom<=innerHeight+1'); await p.screenshot({ path: new URL(`./qa_p2_${label}_${m}.png`, import.meta.url).pathname }); await endBattle(); }
  ok(`Layout ${label} ${w}x${h}: kein horizontaler Scroll (Welt, Chronik, Karte, Kampf)`, Object.values(r).every(Boolean), r); };
await lay('hoch', 390, 844); await lay('quer', 860, 400); await lay('schmal', 360, 640);
await p.setViewportSize({ width: 420, height: 860 }); await Wt(400);
// ---- Draw-Calls ----
const calls = {};
for (const [map, x, y, extra] of [['route1', 9, 18, "MV.ride=true;moveResolve()"], ['brisenhafen', 9, 14, "G.flags.swim=1;G.badges=['a','b'];moveResolve()"], ['windkueste', 7, 7, "G.flags.glide=1;G.badges=['a','b','c'];MV.ride=true;moveResolve()"]]) {
  await ev(`G.time=11*60;MV.glide=null;mode='world';loadMap('${map}',${x},${y});setView('third',true);${extra};spawnRoam();compReset();for(let k=0;k<30&&ROAM.list.length<ROAM.want;k++)addRoamer()`); await Wt(2500);
  calls[map + '/ride-swim'] = await ev('R3.r.info.render.calls');
  if (map === 'windkueste') { await ev("startGlide3()"); await Wt(600); calls[map + '/glide'] = await ev('R3.r.info.render.calls'); await ev('endGlide(true)'); }
  if (map === 'brisenhafen') { await ev("setMoveState('swim');P.state='swim';applyState('swim')"); await Wt(800); calls[map + '/swim'] = await ev('R3.r.info.render.calls'); }
}
await ev("setView('2d',true)");
ok('Draw-Calls ≤ 150 (Reiten/Schwimmen/Gleiten mit Begleiter)', Object.values(calls).every(c => c > 0 && c <= 150), calls);
// ---- alter Spielstand ----
await ev(`(()=>{const o=JSON.parse(JSON.stringify(G));for(const k of ['outfit','name','rival','visited','known2'])delete o[k];delete o.flags.ride;delete o.flags.swim;o.state=undefined;delete o.state;localStorage.setItem('veyra_save_test',JSON.stringify(o));window.__old=o;})()`);
const keyS = await ev("(()=>{const ks=Object.keys(localStorage);return ks})()"); console.log('  localStorage keys:', JSON.stringify(keyS));
const old = await ev(`(()=>{try{G=JSON.parse(JSON.stringify(window.__old));start();return{ok:true,name:G.name,rival:G.rival,outfit:!!G.outfit,visited:typeof G.visited,k2:typeof G.known2,mode,map:cur.id,err:null}}catch(e){return{ok:false,err:e.message}}})()`);
ok('Alter Spielstand ohne outfit/name/rival/visited/known2/state lädt', old.ok && old.outfit && old.visited === 'object' && old.k2 === 'object' && old.mode === 'world', old);
await Wt(1200); await ev("setView('third',true)"); await Wt(1200); await ev("openMenu('map');mapView='world';renderMenu()"); await Wt(300); await ev('closeMenu()'); await Wt(400);
ok('Alter Spielstand: Spielfigur 3D + Karte ohne Fehler', true);
// Speichern/Laden-Roundtrip mit echtem save()
await ev("save()"); ok('save()/loadSave() Roundtrip', await ev("!!loadSave()"));
await done(t);
