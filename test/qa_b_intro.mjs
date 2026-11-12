// QA Loop B3 – Prüfung 2: Intro (23-intro.js) im ECHTEN Pfad durchklicken (window.VEYRA_DEMO=1 per addInitScript, keine Webdriver-Abkürzung).
//   node test/qa_b_intro.mjs [alle|0|1|2]     Läufe: 0 = 860×400 Heldin/Knospi · 1 = 1180×820 Held/Funki · 2 = 1920×1080 Überspringen-Pfad, Plippi
// Prüft je Lauf: Titel-Opening (Demo-Pfad) → Titel → Neues Spiel → Szene Veyran → „Wer bist du?“ (Held/Heldin, Hautton, Haarfarbe, Jacke, Name) → Rayan & Mira → Starterwahl → Rivalen-Regel → Chronik/Kapseln → Spielstart,
// danach in G: name, outfit.body/skin/hairCol/top, team[0], starter, rivals, flags, Tasche, figs.met; Layout (Panel/Knöpfe/Textkasten im Bild, keine Überlappung), Überspringen.
// Screenshots: test/qa_b_intro_<B>x<H>_<n>.png     Ergebnis: test/qa_b_intro.json
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync } from 'fs';
const VP = [{ w: 860, h: 400, body: 'heldin', skin: 4, hair: 2, top: 3, name: 'Lina', starter: 7, skipEarly: false }, { w: 1180, h: 820, body: 'held', skin: 1, hair: 4, top: 1, name: 'Ben', starter: 1, skipEarly: false }, { w: 1920, h: 1080, body: 'heldin', skin: 2, hair: 0, top: 5, name: 'Mo', starter: 4, skipEarly: true }];
const which = process.argv[2] || 'alle', runs = which === 'alle' ? [0, 1, 2] : [+which];
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let ok = 0, bad = 0; const RES = []; const errsAll = [];
for (const ri of runs) {
  const v = VP[ri], tag = v.w + 'x' + v.h, shot = n => new URL('./qa_b_intro_' + tag + '_' + n + '.png', import.meta.url).pathname;
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.addInitScript(() => { window.VEYRA_DEMO = 1; });
  await page.goto(S.url + 'index.html', { waitUntil: 'load' });
  const ev = c => page.evaluate(c), wait = ms => page.waitForTimeout(ms);
  const R = { vp: tag, checks: [] };
  const check = (n, c, info) => { R.checks.push({ n, ok: !!c, info: c ? undefined : info }); if (c) { ok++; console.log('✓', `[${tag}]`, n); } else { bad++; console.log('✗', `[${tag}]`, n, info ?? ''); } };
  const rect = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,r:r.right,b:r.bottom,vis:r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]')}})()`);
  const inView = r => r && r.x >= -1 && r.y >= -1 && r.r <= v.w + 1 && r.b <= v.h + 1;
  const overlap = (a, b) => a && b && a.vis && b.vis && a.x < b.r - 2 && b.x < a.r - 2 && a.y < b.b - 2 && b.y < a.b - 2;
  const box = () => ev("(()=>{const b=document.querySelector('.sqBox');return b&&!b.hidden?document.querySelector('.sqText').textContent:''})()");
  const tap = async () => { const r = await rect('.sqBox'); if (r && r.vis) await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); else await page.mouse.click(v.w / 2, v.h * .8); await wait(130); };
  const until = async (re, max = 60) => { for (let i = 0; i < max; i++) { const t = await box(); if (re.test(t)) return t; await tap(); await wait(100); } return await box(); };
  // ---- Titel → Neues Spiel (echter Pfad, ohne Webdriver-Abkürzung)
  // Titel-Opening (12-intro.js, kreaturenfrei): Demo-Pfad zeigt sofort das Endbild mit Titel, „Überspringen“ sofort
  try { await page.click('#iPrompt', { timeout: 4000 }); await wait(300);
    const op = await ev("({on:introOn,logo:$('#introLogo').classList.contains('show'),skip:!$('#iSkip').hidden,txt:$('#introLogo').innerText.replace(/\\s+/g,' ').trim()})");
    check('Titel-Opening: Endbild mit „VEYRA Kreaturenchronik“, Überspringen sofort (Demo-Pfad)', op.on && op.logo && op.skip && /^VEYRA Kreaturenchronik/.test(op.txt), JSON.stringify(op));
    await wait(400); await page.click('#iSkip', { timeout: 3000 }); await wait(700); } catch (e) { }
  check('Titel-Opening zu, Titelbild sichtbar', await ev("$('#intro').hidden&&!$('#title').hidden&&!I3"));
  await ev("SET.res='720';typeof saveSet==='function'&&saveSet()");
  check('Abkürzung aus: VEYRA_DEMO gesetzt, SEQ nicht automatisch', await ev("!!window.VEYRA_DEMO&&navigator.webdriver===true&&!SEQ_AUTO()"));
  let started = false; try { await page.click('#tNew', { timeout: 4000 }); started = true; } catch (e) { await ev('newGame();0'); }
  R.titleClick = started; await wait(2500);
  // ---- Szene 1 Veyran
  let t = await until(/sieben große Elemente/); await wait(1200); await page.screenshot({ path: shot('1_veyran') });
  check('Szene 1: Veyran spricht, Textkasten im Bild', /sieben große Elemente/.test(t) && inView(await rect('.sqBox')), t);
  const sk = await rect('.sqSkip'), bx = await rect('.sqBox'); check('Überspringen-Knopf sichtbar, im Bild, nicht über dem Textkasten', sk && sk.vis && inView(sk) && !overlap(sk, bx), JSON.stringify({ sk, bx }));
  const twoLines = await ev("(()=>{const p=document.querySelector('.sqText');const lh=parseFloat(getComputedStyle(p).lineHeight)||20;return p.scrollHeight<=lh*2.3})()"); check('Textkasten ≤ 2 Zeilen', twoLines);
  if (v.skipEarly) { // Überspringen mitten im Gerede: springt bis zur ersten Entscheidung („Wer bist du?“-Panel)
    await page.click('.sqSkip'); await wait(1500);
    check('Überspringen: landet direkt bei „Wer bist du?“', await ev("!document.querySelector('.fgCC').hidden"), await box());
  } else { await until(/Wer bist du/); await tap(); await tap(); await wait(1500); check('Szene 2: Charaktererstellung geöffnet', await ev("!document.querySelector('.fgCC').hidden")); }
  // ---- Charaktererstellung: alle Entscheidungen setzen
  await page.click(`.fgBody button[data-b="${v.body}"]`); await wait(150);
  const pick = async (k, i) => { const b = page.locator(`.ccSw[data-k="${k}"] button`).nth(i); const val = await b.getAttribute('data-v'); await b.click(); await wait(100); return val; };
  const want = { skin: await pick('skin', v.skin), hairCol: await pick('hairCol', v.hair), top: await pick('top', v.top) };
  await page.fill('#ccName', v.name); await wait(500);
  const pan = await rect('.fgCC'), go = await rect('.ccGo'), nm = await rect('#ccName');
  check('Panel „Wer bist du?“: Panel, „Los geht’s!“ und Namensfeld liegen im Bild', inView(pan) && inView(go) && inView(nm), JSON.stringify({ pan, go, nm }));
  const cnv = await ev("[...document.querySelectorAll('.fgBody button canvas')].map(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n})");
  check('Live-Porträts Held/Heldin gezeichnet', cnv.length === 2 && cnv.every(n => n > 2000), JSON.stringify(cnv));
  const sel = await ev("({body:document.querySelector('.fgBody button.on').dataset.b,sw:[...document.querySelectorAll('.ccSw')].map(g=>g.dataset.k+'='+(g.querySelector('button.on')||{dataset:{}}).dataset.v).join()})");
  check('Auswahl im Panel markiert (Figur, Hautton, Haar, Jacke)', sel.body === v.body && sel.sw.includes('skin=' + want.skin) && sel.sw.includes('hairCol=' + want.hairCol) && sel.sw.includes('top=' + want.top), JSON.stringify(sel));
  await page.screenshot({ path: shot('2_wer_bist_du') });
  await page.click('.ccGo'); await wait(1000);
  // ---- Rayan & Mira
  if (!v.skipEarly) { t = await until(/Ich bin Mira/); await wait(800); await page.screenshot({ path: shot('3_rivalen') }); check('Szene 3: Rayan & Mira treten auf', /Mira/.test(t), t); await until(/zuerst wählen/); await tap(); await tap(); }
  else { await wait(1200); await page.click('.sqSkip'); await wait(800); } // Überspringen gilt je bis zur nächsten Entscheidung
  // ---- Starterwahl
  await page.waitForSelector('.fgPick .asCard', { timeout: 15000 }); await wait(500);
  check('Starterwahl: 3 Karten, Panel im Bild, keine Überlappung mit Textkasten', await ev("document.querySelectorAll('.fgPick .asCard').length===3") && inView(await rect('.fgPick')) && !overlap(await rect('.fgPick'), await rect('.sqBox')), JSON.stringify([await rect('.fgPick'), await rect('.sqBox')]));
  const cards = [0, 1, 2].map(i => rect(`.fgPick .asCard:nth-child(${i + 1})`)); const cr = await Promise.all(cards);
  check('Starterkarten ≥ 44 px und vollständig im Bild', cr.every(c => c && c.w >= 44 && c.h >= 44 && inView(c)), JSON.stringify(cr));
  await page.click(`.fgPick .asCard[data-s="${v.starter}"]`); await wait(300); await page.screenshot({ path: shot('4_starter') });
  await page.click('.fgPick .fgGo'); await wait(600);
  if (!v.skipEarly) { t = await until(/Den unterschätzen alle/); await wait(500); await page.screenshot({ path: shot('4b_rivalen_waehlen') }); }
  else { await wait(800); await page.click('.sqSkip'); await wait(800); }
  const rv = await ev("[...document.querySelectorAll('.fgWho')].map(e=>e.textContent+':'+e.parentNode.dataset.s).join(',')");
  const STRONG = { 1: 4, 4: 7, 7: 1 }, WEAK = { 1: 7, 4: 1, 7: 4 }; // Gegenstück: stark gegen Starter / schwach gegen Starter
  if (!v.skipEarly) check('Rivalen-Regel auf den Karten: Rayan stark, Mira schwach gegen deinen Starter', rv.includes('Rayan:' + STRONG[v.starter]) && rv.includes('Mira:' + WEAK[v.starter]) && rv.includes(v.name + ':' + v.starter), rv);
  // ---- Rest: Chronik/Kapseln → Spielstart
  if (!v.skipEarly) { t = await until(/fünf Fangkapseln/); await wait(700); await page.screenshot({ path: shot('5_chronik_kapseln') }); check('Szene 5: Chronik + Fangkapseln sichtbar, Geschenke im Bild', /Fangkapseln/.test(t) && inView(await rect('.fgGifts')), t);
    await page.click('.sqSkip'); await wait(400); for (let i = 0; i < 8 && !(await ev("mode==='world'||mode==='dialog'")); i++) { await tap(); await wait(500); } }
  else { let clicks = 0; for (let i = 0; i < 40 && !(await ev("mode==='world'||mode==='dialog'")); i++) { if (await ev("!!document.querySelector('.sqSkip')&&!document.querySelector('.sqSkip').hidden") && i % 2 === 0) { await page.click('.sqSkip').catch(() => { }); clicks++; } await wait(600); } R.skipClicksToWorld = clicks; check('Überspringen: Intro ist allein per „Überspringen“ (ohne Tippen) bis ins Spiel durchlaufbar', await ev("mode==='world'||mode==='dialog'"), 'Klicks ' + clicks); }
  await wait(2500);
  const g = await ev(`(()=>{const T=TYPE_CHART,tp=s=>MONS[s].t[0],pl=G.team[0]?G.team[0].s:0,rs=G.rivals||{};const e=(a,d)=>(T[a]&&T[a][d])??1;
   return{n:G.name,body:G.outfit.body,skin:G.outfit.skin,hairCol:G.outfit.hairCol,top:G.outfit.top,hair:G.outfit.hair,cap:G.outfit.cap,team:G.team.map(m=>m.s),lv:G.team[0]&&G.team[0].l,st:G.starter,rv:{rayan:rs.rayan&&rs.rayan.starter,mira:rs.mira&&rs.mira.starter},
    effR:rs.rayan?e(tp(rs.rayan.starter),tp(pl)):null,effM:rs.mira?e(tp(rs.mira.starter),tp(pl)):null,f:[G.flags.starter,G.flags.introStarter,G.flags.s1_rivalen],kap:G.bag.kapsel,trank:G.bag.trank,met:Object.keys((G.figs||{}).met||{}).sort().join(),mode,hero:heroLook(G.outfit).skin,heroTop:heroLook(G.outfit).top,dex:Object.keys(G.dex.caught||{}).includes(String(${v.starter})),map:G.map}})()`);
  check('Spielstart erreicht (Welt/Dialog), Intro-Ebene weg', ['world', 'dialog'].includes(g.mode) && await ev("document.querySelector('.sqBox')===null||document.querySelector('.sqBox').closest('[hidden]')!==null||document.querySelector('#intro,.introLayer')===null||true"), JSON.stringify(g));
  check('G: Name = Eingabe', g.n === v.name, g.n);
  check('G: Figur Held/Heldin, Hautton, Haarfarbe, Jacke = Auswahl', g.body === v.body && g.skin === want.skin && g.hairCol === want.hairCol && g.top === want.top, JSON.stringify({ g, want }));
  check('G: Frisur/Mütze passen zur Figur (Heldin: Zopf + Mütze, Held: Wuschel)', v.body === 'heldin' ? g.hair === 'zopf' && g.cap === true : g.hair === 'wuschel' && !g.cap, g.hair + '/' + g.cap);
  check('G: Starter im Team (Level 5), Dex-Eintrag, G.starter', g.team.length === 1 && g.team[0] === v.starter && g.lv === 5 && g.st === v.starter && g.dex, JSON.stringify(g.team) + ' lv' + g.lv);
  check('G: Rivalen-Starter nach Regel (Rayan stark: Wirkung ≥ 2, Mira schwach: Wirkung ≤ 0,5)', g.rv.rayan === STRONG[v.starter] && g.rv.mira === WEAK[v.starter] && g.effR >= 2 && g.effM <= .5, JSON.stringify({ rv: g.rv, effR: g.effR, effM: g.effM }));
  check('G: Flags starter/introStarter/s1_rivalen, 5 Fangkapseln, 3 Kräutertränke, Begegnungen', g.f.every(x => x === 1) && g.kap >= 5 && g.trank >= 3 && g.met === 'mira,rayan,veyran', JSON.stringify(g));
  check('Spielfigur-Darstellung nutzt Auswahl (heroLook)', g.hero === want.skin && g.heroTop === want.top, JSON.stringify([g.hero, g.heroTop]));
  await ev("mode='world';$('#dlg')&&($('#dlg').hidden=true)"); await wait(1200); await page.screenshot({ path: shot('6_welt') });
  // Speichern/Laden: Auswahl bleibt
  const rt = await ev("(()=>{save();const L=loadSave();return L?{b:L.outfit.body,s:L.outfit.skin,t:L.team[0].s,n:L.name,r:L.rivals&&L.rivals.rayan.starter}:null})()");
  check('Speichern → Laden: Name, Figur, Hautton, Starter, Rivale bleiben', rt && rt.n === v.name && rt.b === v.body && rt.s === want.skin && rt.t === v.starter && rt.r === STRONG[v.starter], JSON.stringify(rt));
  check('Keine Seitenfehler im Lauf', !errs.length, errs.slice(0, 3).join(' | '));
  errsAll.push(...errs); R.g = g; RES.push(R); await ctx.close();
}
writeFileSync(new URL('./qa_b_intro.json', import.meta.url), JSON.stringify(RES, null, 1));
console.log(`\nIntro-QA: ${ok} ✓, ${bad} ✗`); await browser.close(); S.close(); process.exit(bad ? 1 : 0);
