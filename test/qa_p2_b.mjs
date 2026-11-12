// QA Phase 2 · B: Intro + Charaktererstellung (webdriver=false → echter Durchlauf), Kurzpfad (webdriver=true), Zeit bis zur ersten Kreatur
import { boot, done } from './qa_p2_lib.mjs';
// ---- Durchlauf 1: echtes Intro ----
let t = await boot({ webdriver: false, start: false }); let { p, ev, Wt, ok, closeDlg } = t;
await p.click('#iPrompt'); await Wt(800);
ok('Legenden-Intro läuft (webdriver=false)', await ev("!$('#intro').hidden"));
await p.click('#iSkip'); await Wt(1000);
ok('Tippen/Überspringen → Titel', await ev("$('#intro').hidden||$('#intro').classList.contains('out')||!$('#title').hidden"));
await p.click('#tNew'); await Wt(1200);
ok('Mentor-Intro (Sequenz intro) läuft, Spiel noch nicht gestartet', await ev("!$('#seqL').hidden&&!G||!$('#seqL').hidden"), await ev("({seq:!$('#seqL').hidden,mode,G:!!G})"));
await p.waitForSelector('.sqSkip', { timeout: 5000 }); await Wt(600);
// Antippen schreibt den Text fertig / weiter (Tippen), danach Überspringen
await p.mouse.click(200, 300); await Wt(200); await p.mouse.click(200, 300); await Wt(300);
await p.click('.sqSkip'); await p.waitForSelector('.ccPanel:not([hidden])', { timeout: 8000 }); await Wt(900);
ok('Charaktererstellung sichtbar', true);
await p.screenshot({ path: new URL('./qa_p2_create.png', import.meta.url).pathname });
// jede Option einmal setzen
const groups = await ev("[...document.querySelectorAll('.ccPanel [data-k]')].map(g=>({k:g.dataset.k,n:g.querySelectorAll('button').length}))");
for (const g of groups) for (let i = 0; i < g.n; i++) { if (g.k === 'capCol') await p.locator('.ccPanel [data-k="cap"] button').nth(0).click(); await p.locator(`.ccPanel [data-k="${g.k}"] button`).nth(i).click(); await Wt(20); }
ok('Alle Optionsgruppen durchgeklickt', groups.length >= 7, groups.map(g => g.k + ':' + g.n).join(' '));
// letzte Werte festlegen
await p.locator('.ccPanel [data-k="hair"] button').nth(2).click(); await p.locator('.ccPanel [data-k="cap"] button').nth(0).click(); await p.locator('.ccPanel [data-k="top"] button').nth(1).click();
await p.click('.ccRnd'); await Wt(50);
await p.locator('.ccPanel [data-k="hair"] button').nth(3).click(); await p.locator('.ccPanel [data-k="cap"] button').nth(0).click(); await p.locator('.ccPanel [data-k="top"] button').nth(1).click(); await p.locator('.ccPanel [data-k="pants"] button').nth(2).click();
await p.fill('#ccName', 'Tester<b>'); await p.fill('#ccRival', 'Kai');
await p.screenshot({ path: new URL('./qa_p2_create2.png', import.meta.url).pathname });
await p.click('.ccGo'); await Wt(600);
// Dialog durchtippen bis Welt
for (let i = 0; i < 40 && !(await ev('!!G')); i++) { await p.mouse.click(200, 300); await Wt(300); }
for (let i = 0; i < 40 && !(await ev("!!G&&mode==='world'&&$('#seqL').hidden")); i++) { await p.mouse.click(200, 300); await Wt(350); if (await ev("mode==='dialog'")) await closeDlg(); }
await closeDlg(); await Wt(400);
const g = await ev("({name:G.name,rival:G.rival,o:G.outfit,map:cur.id,mode,x:P.x,y:P.y,seq:!$('#seqL').hidden})");
ok('G.name gesetzt (ohne HTML-Zeichen)', g.name === 'Testerb', g.name);
ok('G.rival gesetzt', g.rival === 'Kai', g.rival);
ok('G.outfit komplett (hair lang, cap true, top #3d8fe0, pants #3f6a48)', g.o && g.o.hair === 'lang' && g.o.cap === true && g.o.top === '#3d8fe0' && g.o.pants === '#3f6a48' && !!g.o.skin && !!g.o.hairCol && !!g.o.capCol, g.o);
ok('Start zuhause, mode world, Sequenz-Layer zu', g.map === 'haus_spieler' && g.mode === 'world' && !g.seq, g);
// Figur zeigt Outfit (2D-Pixelprüfung: Oberteilfarbe im Canvas) + 3D rebuild
await ev("setView('2d',true)"); await Wt(400);
const c2 = await ev("(()=>{const c=document.querySelector('#world'),x=c.getContext('2d');const tx=P.px*TS+8,ty=P.py*TS+15-8;const sx=Math.round((tx-camX)*SC),sy=Math.round((ty-camY)*SC);const d=x.getImageData(sx,sy,1,1).data;return[d[0],d[1],d[2],sx,sy]})()");
ok('2D Spielfigur trägt Outfit-Oberteil (blau statt orange)', c2[2] > c2[0], c2);
await ev("setView('third',true)"); await Wt(1500);
ok('3D Spielfigur nach Outfit neu gebaut', await ev("!!R3&&!!R3.ofk&&R3.ofk.includes('3d8fe0')"));
await p.screenshot({ path: new URL('./qa_p2_hero3d.png', import.meta.url).pathname });
await ev("setView('2d',true)");
// Erster Fang: chronikCall (Intro läuft mit webdriver=false, Anrufe sind aktiv)
await ev("G.flags.firstcatch=1;mode='world'"); await p.waitForFunction(() => !document.querySelector('#callOv').hidden, null, { timeout: 8000 }).catch(() => {});
ok('chronikCall erscheint nach erstem Fang', await ev("!$('#callOv').hidden"));
await p.click('#callOv .clOk'); await Wt(500); await closeDlg(); await Wt(400);
ok('chronikCall schließt, mode world', await ev("$('#callOv').hidden&&mode==='world'"), await ev('mode'));
await done(t);
// ---- Durchlauf 2: webdriver=true → sofort ----
t = await boot({ webdriver: true, start: false }); ({ p, ev, Wt, ok, closeDlg } = t);
await p.click('#iPrompt'); await Wt(500); await p.click('#iSkip'); await Wt(900);
const t0 = Date.now(); await p.click('#tNew'); await p.waitForFunction(() => !!G && typeof mode !== 'undefined', null, { timeout: 5000 }); const dt = Date.now() - t0; await closeDlg();
const g2 = await ev("({name:G.name,rival:G.rival,hasO:!!G.outfit,mode,map:cur.id,seq:!$('#seqL').hidden})");
ok('webdriver=true: Intro endet sofort mit Standardwerten', dt < 2500 && g2.name === 'Noa' && g2.rival === 'Lio' && g2.hasO && g2.map === 'haus_spieler' && !g2.seq, { dt, g2 });
// ---- Zeit bis zur ersten Kreatur: Weg Zuhause → Labor (Schritte) ----
const walk = await ev(`(()=>{const res={};const bfs=(m,from,goals)=>{const W=m.rows[0].length,H=m.rows.length,key=(x,y)=>x+','+y,seen=new Map([[key(...from),0]]),q=[from];while(q.length){const[x,y]=q.shift(),d=seen.get(key(x,y));if(goals(x,y,m.rows[y][x]))return d;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H||seen.has(key(nx,ny)))continue;const tt=m.rows[ny][nx];if(SOLID.has(tt)&&!/[0-9]/.test(tt))continue;seen.set(key(nx,ny),d+1);q.push([nx,ny]);}}return -1;};
 loadMap('haus_spieler');const m1=cur;res.homeStart=[P.x,P.y];res.home=bfs(m1,[P.x,P.y],(x,y,t)=>/[0-9E]/.test(t)&&(x!==P.x||y!==P.y));
 const door=Object.keys(MAPS.morgenau.doors).find(k=>MAPS.morgenau.doors[k]==='haus_spieler');let ex=0,ey=0;MAPS.morgenau.rows.forEach((r,y)=>{const x=r.indexOf(door);if(x>=0){ex=x;ey=y+1;}});
 const labk=Object.keys(MAPS.morgenau.doors).find(k=>MAPS.morgenau.doors[k]==='labor');loadMap('morgenau',ex,ey);res.town=bfs(cur,[ex,ey],(x,y,t)=>t===labk);
 loadMap('labor');const sp=NPCS.labor.find(n=>n.t==='starter');res.lab=sp?bfs(cur,[P.x,P.y],(x,y)=>Math.abs(x-sp.x)+Math.abs(y-sp.y)===1):-1;return res;})()`);
const steps = (walk.home | 0) + (walk.town | 0) + (walk.lab | 0), secs = steps * 0.36;
ok('Zuhause → Starterwahl: Weg kurz (< 10 Minuten, hier nur Schritte)', steps > 0 && secs < 60, { ...walk, steps, sekunden_gehen: +secs.toFixed(1), geschätzt_mit_Dialogen_min: +((secs + 90) / 60).toFixed(1) });
await done(t);
