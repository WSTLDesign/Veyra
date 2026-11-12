// Loop B1 Figuren – Screenshots (860×400, Querformat-Vollbild) über den lokalen Server test/art_serve.mjs:
//  Intro (interaktiv, VEYRA_DEMO) Szenen 1–6 → test/b1_intro_*.png · drei Figuren-Dialoge → test/b1_dialog_*.png · Figurenreihe → test/b1_figuren.png
//  Porträt-Bilder aus public/art_ref/*_face_*.webp werden nur für diesen Test unter /figref/ eingehängt (im Build noch nicht enthalten, siehe docs/figuren.md).
//  Aufruf: node build.mjs && node test/b1_shots.mjs
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { readFileSync, readdirSync } from 'fs';
const ref = new URL('../public/art_ref/', import.meta.url), out = n => new URL('./b1_' + n + '.png', import.meta.url).pathname;
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 860, height: 400 }, deviceScaleFactor: 1, hasTouch: false, serviceWorkers: 'block' }); // SW würde /figref/ am Routing vorbeiladen
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text() + ' @' + JSON.stringify(m.location())); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.route(/\/figref\//, r => { const f = decodeURIComponent(new URL(r.request().url()).pathname.split('/figref/')[1]); try { r.fulfill({ body: readFileSync(new URL(f, ref)), contentType: 'image/webp' }); } catch (e) { r.fulfill({ status: 404, body: '' }); } });
await page.addInitScript(() => { window.VEYRA_DEMO = 1; });
await page.goto(S.url + 'index.html', { waitUntil: 'load' });
const ev = c => page.evaluate(c), wait = ms => page.waitForTimeout(ms);
let ok = 0, bad = 0; const check = (n, c, info) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, info ?? ''); } };
// Titel → Neues Spiel (interaktives Intro)
try { await page.click('#iPrompt', { timeout: 3000 }); await wait(800); await page.click('#iSkip', { timeout: 3000 }); await wait(700); } catch (e) { }
await ev("SET.res='720';typeof saveSet==='function'&&saveSet()");
await ev("newGame();0"); await wait(600);
const box = () => ev("(()=>{const b=document.querySelector('.sqBox');return b&&!b.hidden?document.querySelector('.sqText').textContent:''})()");
const tap = async () => { await page.mouse.click(430, 345); await wait(140); };
// bis Text enthält … weitertippen
const until = async (re, max = 40) => { for (let i = 0; i < max; i++) { const t = await box(); if (re.test(t)) { await ev("(()=>{})()"); return t; } await tap(); await wait(120); } return await box(); };
await wait(2200);
let t = await until(/sieben große Elemente/); await wait(1700); await page.screenshot({ path: out('intro_1_veyran') }); check('Szene 1: Veyran + Elemente', /sieben große Elemente/.test(t), t);
// Zeilenlänge: ≤ 2 Zeilen im Textkasten
const twoLines = async () => ev("(()=>{const p=document.querySelector('.sqText');const lh=parseFloat(getComputedStyle(p).lineHeight)||20;return p.scrollHeight<=lh*2.2})()");
check('Textkasten ≤ 2 Zeilen (längster Satz)', await twoLines());
await until(/Wer bist du/); await tap(); await tap(); await wait(1400);
const panelOpen = await ev("!document.querySelector('.fgCC').hidden"); check('Szene 2: Charaktererstellung offen', panelOpen);
await page.click('.fgBody button[data-b="heldin"]'); await wait(200);
await page.click('.ccSw[data-k="top"] button:nth-child(2)'); await wait(150);
await page.fill('#ccName', 'Lina'); await wait(300); await page.screenshot({ path: out('intro_2_wer_bist_du') });
await page.click('.ccGo'); await wait(900);
t = await until(/Ich bin Mira/); await wait(900); await page.screenshot({ path: out('intro_3_rivalen') }); check('Szene 3: Rayan & Mira', /Mira/.test(t), t);
await until(/zuerst wählen/); await tap(); await tap(); await wait(700);
check('Szene 4: Starterkarten', await ev("document.querySelectorAll('.fgPick .asCard').length===3"));
await page.click('.fgPick .asCard[data-s="7"]'); await wait(300); await page.screenshot({ path: out('intro_4_starter') });
await page.click('.fgPick .fgGo'); await wait(500);
t = await until(/Den unterschätzen alle/); await wait(500); await page.screenshot({ path: out('intro_4b_rivalen_waehlen') });
const rv = await ev("[...document.querySelectorAll('.fgWho')].map(e=>e.textContent+':'+e.parentNode.dataset.s).join(',')");
check('Rivalen-Regel im Intro: Rayan Glut (stark gegen Flora), Mira Flut', rv === 'Rayan:1,Mira:4,Lina:7', rv);
t = await until(/fünf Fangkapseln/); await wait(800); await page.screenshot({ path: out('intro_5_chronik_kapseln') }); check('Szene 5: Chronik + Fangkapseln', /Fangkapseln/.test(t), t);
// Überspringen: restliches Gerede bis Spielstart
await page.click('.sqSkip'); await wait(400); for (let i = 0; i < 6 && !(await ev("mode==='world'||mode==='dialog'")); i++) { await tap(); await wait(500); }
await wait(1800);
const g = await ev("({n:G.name,b:G.outfit.body,team:G.team.map(m=>m.s),st:G.starter,r:G.rivals,f:[G.flags.starter,G.flags.introStarter,G.flags.s1_rivalen],kap:G.bag.kapsel,met:Object.keys(G.figs.met).sort().join(),mode})");
check('Spielstart: Name, Heldin, Knospi im Team, Rivalen, Flags, Kapseln, Begegnungen', g.n === 'Lina' && g.b === 'heldin' && g.team.join() === '7' && g.st === 7 && g.r.rayan.starter === 1 && g.r.mira.starter === 4 && g.f.every(x => x === 1) && g.kap >= 5 && g.met === 'mira,rayan,veyran', JSON.stringify(g));
await page.screenshot({ path: out('intro_6_welt') });
// ---- Figuren-Dialoge (Porträts: Kael & Veyran mit Bild über /figref/, Rayan prozedural)
const faces = readdirSync(ref).filter(f => /^(kael|prof)_face_.*\.webp$/.test(f));
await ev(`(()=>{${faces.map(f => `window.ART_SRC[${JSON.stringify(f.replace('.webp', ''))}]='/figref/${f}';`).join('')}})()`);
const dlg = async (code, name) => { await ev("mode='world';$('#dlg').hidden=true;" + code); await wait(1600); await ev("TW&&TW.finish&&TW.finish()"); await wait(500); await page.screenshot({ path: out('dialog_' + name) }); };
await dlg("DLG.pend={fig:'kael',t:'trainer'};say([figSay('kael','gruss',2)])", 'kael');
check('Dialog Kael: Porträt aus Bild (geladen)', await ev("$('#dlgFace')._fw==='kael|freudig'&&!$('#dlgFace').hidden&&!!figFaceImg('kael','freudig')"), await ev("$('#dlgFace')._fw"));
await dlg("DLG.pend={fig:'rayan',t:'talk'};say([figSay('rayan','niederlage',3)])", 'rayan');
check('Dialog Rayan: prozedurales Porträt', await ev("($('#dlgFace')._fw||'').startsWith('rayan|')"));
await dlg("DLG.pend={fig:'veyran',t:'talk'};say([figSay('veyran','alltag',0)])", 'veyran');
check('Dialog Veyran: Ausdruck aus Situation, Bild geladen', await ev("$('#dlgFace')._fw==='veyran|laechelnd'&&!!figFaceImg('veyran','laechelnd')"), await ev("$('#dlgFace')._fw"));
// ---- Figurenreihe (alle Kanon-Figuren, prozedural)
await ev(`(()=>{$('#dlg').hidden=true;const ids=Object.keys(FIGURES),cv=document.createElement('canvas');cv.width=860;cv.height=400;cv.id='b1row';cv.style.cssText='position:fixed;inset:0;z-index:999';document.body.appendChild(cv);
 const c=cv.getContext('2d'),g=c.createLinearGradient(0,0,0,400);g.addColorStop(0,'#eef3f8');g.addColorStop(1,'#cfdbe6');c.fillStyle=g;c.fillRect(0,0,860,400);const per=Math.ceil(ids.length/2),cw=860/per;
 ids.forEach((id,i)=>{const x=(i%per)*cw+cw/2,y=i<per?186:384,F=FIGURES[id];drawFigure(c,x,y,150,F.player?heroLook({body:id}):F.look,1000,{expr:'freudig',still:true});c.font='600 9px sans-serif';c.textAlign='center';c.fillStyle='#182230';c.fillText(F.player?(id==='heldin'?'Heldin':'Held'):F.n.replace(/^(Prof\\.|Lord|Oma|Meister|Kapitän|Gärtnerin|Kapitänin|Sternendeuter|Leuchtturmwärter|Hüttenwärterin) /,''),x,y+11);});})()`);
await wait(200); await page.screenshot({ path: out('figuren') });
console.log(`\nB1-Screenshots: ${ok} ✓, ${bad} ✗` + (errs.length ? '\nFehler:\n' + errs.join('\n') : '\nKeine Seitenfehler.'));
await browser.close(); S.close(); process.exit(bad || errs.length ? 1 : 0);
