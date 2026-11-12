// QA Mechanik – Prüfpunkt 2 (Ablauf): Opening → Titel → „Neues Spiel“ → Intro-Film → Charaktererstellung → erste Karte (App, VEYRA_OPEN/VIDEO/HY echt) + Artifact-Variante (Poster statt Film).
//   node test/qa_mech_flow.mjs [app|artifact]     Bilder: test/qa_mech_flow_*.png
import { start, page, reporter, here } from './qa_mech_lib.mjs';
const which = process.argv[2] || 'alle';
const R = reporter(process.env.QA_LOG || '/tmp/qa_mech_flow.log', 'QA Mechanik Ablauf');
const env = await start();
const REC = `window.TL=[];window.TLs=()=>{const q=s=>document.querySelector(s),vis=e=>e&&!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&+getComputedStyle(e).opacity>.05&&!e.closest('[hidden]');
 return{t:Math.round(performance.now()),mode:typeof mode!=='undefined'?mode:null,intro:vis(q('#intro')),title:vis(q('#title')),film:!!q('.ivL')&&!q('.ivL').classList.contains('gone'),poster:!!q('.ivPost'),ask:!!q('.ivAsk'),sq:vis(q('.sqBox')),cc:vis(q('.fgCC')),pick:vis(q('.fgPick')),place:!!q('#hyPlace'),chap:!!q('#hyChap'),map:typeof G!=='undefined'&&G?G.map:null,ivlast:typeof IV!=='undefined'?IV.last:null};};
 setInterval(()=>{try{const s=TLs();const l=TL[TL.length-1];if(!l||JSON.stringify({...l,t:0})!==JSON.stringify({...s,t:0}))TL.push(s);}catch(e){}},40);`;
async function run(kind) {
  const url = kind === 'app' ? 'index.html' : 'artifact.html';
  const p = await env.browser.newPage({ viewport: { width: 860, height: 484 } }); p.errs = []; const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver|MEDIA_ERR|Media resource|ReadPixels/;
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 200)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  await p.route(/cdnjs\.cloudflare\.com.*three\.min\.js/, r => r.fulfill({ path: new URL('../dist/three.min.js', import.meta.url).pathname, contentType: 'text/javascript' }));
  await p.addInitScript(() => { window.VEYRA_DEMO = 1; window.VEYRA_VIDEO = 1; window.VEYRA_OPEN = 1; window.VEYRA_HY = 1; }); await p.addInitScript(REC);
  if (kind === 'app') await p.goto(env.S.url + url, { waitUntil: 'load' }); else await p.goto(new URL('../dist/artifact.html', import.meta.url).href, { waitUntil: 'load' });
  const ev = c => p.evaluate(c), wait = ms => p.waitForTimeout(ms);
  const rect = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,vis:r.width>0&&r.height>0&&!e.closest('[hidden]')}})()`);
  const box = () => ev("(()=>{const b=document.querySelector('.sqBox');return b&&!b.hidden?document.querySelector('.sqText').textContent:''})()");
  const tap = async () => { const r = await rect('.sqBox'); if (r && r.vis) await p.mouse.click(r.x + r.w / 2, r.y + r.h / 2); else await p.mouse.click(430, 380); await wait(130); };
  const until = async (re, max = 80) => { for (let i = 0; i < max; i++) { const t = await box(); if (re.test(t)) return t; await tap(); await wait(100); } return await box(); };
  await wait(1500);
  // 1) Opening (echt) → Titel
  const tc = await ev('performance.now()'); await p.click('#iPrompt'); await wait(2500); await p.screenshot({ path: here(`qa_mech_flow_${kind}_1_opening.png`) });
  await p.waitForFunction(() => $('#intro').hidden && !$('#title').hidden, null, { timeout: 15000 }); const tEnd = await ev('performance.now()'); await wait(600); await p.screenshot({ path: here(`qa_mech_flow_${kind}_2_titel.png`) });
  R.note(`[${kind}] Opening bis Titel: ${Math.round(tEnd - tc)} ms`); R.t(`[${kind}] Opening → Titel ohne Hänger (Titel nach 5,5–6,6 s sichtbar)`, tEnd - tc > 5400 && tEnd - tc < 6800, tEnd - tc);
  const titleState = await ev("({poster:$('#title').classList.contains('poster'),sub:($('#title .tsub')||{}).textContent,btns:[...document.querySelectorAll('#title button')].map(b=>b.textContent.trim())})"); R.note(`[${kind}] Titel: ${JSON.stringify(titleState)}`);
  if (kind === 'artifact') R.t('[artifact] Titel ohne Poster-Hintergrund (kein Video im Artifact)', !titleState.poster, titleState);
  else R.t('[app] Titel mit Poster-Hintergrund + Untertitel „Die Welt der Terras“', titleState.poster && titleState.sub === 'Die Welt der Terras', titleState);
  // 2) Neues Spiel → Film (App) / Poster (Artifact)
  const tNew = await ev('performance.now()'); await p.click('#tNew'); await wait(1200); await p.screenshot({ path: here(`qa_mech_flow_${kind}_3_film.png`) });
  const fs1 = await ev('TLs()'); R.note(`[${kind}] 1,2 s nach „Neues Spiel“: ${JSON.stringify(fs1)}`);
  if (kind === 'artifact') {
    R.t('[artifact] „Neues Spiel“ zeigt Poster-Standbild (kein Film, keine Abfrage)', fs1.poster && !fs1.ask, fs1);
    await ev("SET.introSeen"); await p.waitForFunction(() => !document.querySelector('.ivPost'), null, { timeout: 10000 }); const tp = await ev('performance.now()'); R.note(`[artifact] Poster ${Math.round(tp - tNew)} ms`); R.t('[artifact] Poster kürzer als 3,5 s, dann Intro', tp - tNew < 3500, tp - tNew);
  } else {
    // Film: Chromium kann H.264 evtl. nicht → why 'codec'/'error'/'timeout'; sonst spielt er
    const can = await ev("(()=>{const v=document.createElement('video');return{h264:v.canPlayType('video/mp4; codecs=\"avc1.42E01E, mp4a.40.2\"'),mp4:v.canPlayType('video/mp4'),type:(window.INTRO_VIDEO||{}).type}})()"); R.note(`[app] canPlayType: ${JSON.stringify(can)}`);
    const playing = fs1.film; if (playing) { await wait(2200); const sk = await rect('.ivSkip'); R.note(`[app] Skip-Knopf: ${JSON.stringify(sk)}`); R.t('[app] Film-Overlay: „Überspringen“ ≥ 48 px hoch, im Bild', sk && sk.vis && sk.h >= 47 && sk.x >= 0 && sk.x + sk.w <= 860, sk); await p.screenshot({ path: here(`qa_mech_flow_${kind}_3b_film_skip.png`) }); await p.click('.ivSkip'); }
    const tEndF = await p.waitForFunction(() => !document.querySelector('.ivL') || document.querySelector('.ivL').classList.contains('gone'), null, { timeout: 20000 }).then(() => true, () => false);
    R.t('[app] Film endet/übersprungen binnen 20 s (kein Hänger, auch ohne Codec)', tEndF, fs1);
  }
  // 3) Veyran-Szene → Charaktererstellung
  const t1 = await p.waitForFunction(() => { const b = document.querySelector('.sqBox'); return b && !b.hidden; }, null, { timeout: 20000 }).then(() => true, () => false); R.t(`[${kind}] Nach Film/Poster erscheint die Veyran-Szene (Textkasten) ohne Hänger`, t1);
  await wait(800); await p.screenshot({ path: here(`qa_mech_flow_${kind}_4_veyran.png`) });
  const mid = await ev('TLs()'); R.t(`[${kind}] Kein Film-/Poster-/Titel-Overlay mehr über der Veyran-Szene`, !mid.film && !mid.poster && !mid.ask && !mid.intro && !(await ev("(()=>{const e=document.elementFromPoint(430,60);return !!(e&&e.closest('#title'))})()")), mid);
  await until(/Wer bist du/); await tap(); await tap(); await wait(1500);
  await p.click('.fgBody button[data-b="heldin"]'); await wait(200); await p.fill('#ccName', 'Lina'); await wait(300); await p.click('.ccGo'); await wait(1000);
  await until(/zuerst wählen/); await tap(); await tap(); await p.waitForSelector('.fgPick .asCard', { timeout: 15000 }); await wait(400); await p.click('.fgPick .asCard[data-s="1"]'); await wait(300); await p.click('.fgPick .fgGo'); await wait(600);
  await until(/Den unterschätzen alle/); for (let i = 0; i < 4; i++) { await tap(); await wait(200); }
  await until(/fünf Fangkapseln/); await wait(600);
  // Ende: weiter tippen, bis die Welt läuft; Zeitleiste der Standbilder beobachten
  const tW0 = await ev('performance.now()'); let seen = { place: 0, chap: 0 };
  for (let i = 0; i < 260; i++) { const s = await ev('TLs()'); if (s.place) seen.place = 1; if (s.chap) seen.chap = 1; if (s.mode === 'world' && s.map === 'haus_spieler' && !s.sq && !s.place && !s.chap && i > 10) { await wait(600); const s2 = await ev('TLs()'); if (s2.mode === 'world' && !s2.sq && !s2.place && !s2.chap) break; }
    if (s.chap || s.place) { await wait(500); await p.mouse.click(430, 242); } else if (s.sq) await tap(); else if (s.mode === 'dialog') { await p.mouse.click(430, 440); await wait(150); } else await wait(250); }
  await wait(1000); const fin = await ev('({map:G.map,mode,name:G.name,team:G.team.length,placeCnt:HYP.count,chapCnt:HYC.count,pics:G.story&&G.story.pics,overlayN:document.querySelectorAll("#hyPlace,#hyChap,.ivL,.ivPost").length})');
  await p.screenshot({ path: here(`qa_mech_flow_${kind}_5_welt.png`) });
  const TL = await ev('TL.map(s=>s.t+":"+[s.mode,s.map,s.intro?"intro":"",s.title?"title":"",s.film?"film":"",s.poster?"poster":"",s.sq?"dlg":"",s.cc?"cc":"",s.pick?"pick":"",s.place?"ORT":"",s.chap?"KAPITEL":""].filter(Boolean).join("/"))');
  // Doppel-Ortsbild: Anzahl Ortsbilder/Kapitelbilder seit Spielstart
  const events = TL.filter(x => /ORT|KAPITEL/.test(x)); R.note(`[${kind}] Zeitleiste ab Spielstart (Standbilder): ${JSON.stringify(events)}`); R.note(`[${kind}] Endzustand: ${JSON.stringify(fin)}`);
  const ortRuns = (() => { let n = 0, prev = false; for (const x of TL) { const o = /ORT/.test(x); if (o && !prev) n++; prev = o; } return n; })(), chapRuns = (() => { let n = 0, prev = false; for (const x of TL) { const o = /KAPITEL/.test(x); if (o && !prev) n++; prev = o; } return n; })();
  R.t(`[${kind}] Erste Karte: Spiel läuft (mode world, Karte ${fin.map}), Team hat Starter`, fin.mode === 'world' && fin.team === 1 && fin.overlayN === 0, fin);
  R.t(`[${kind}] Kein Doppel-Ortsbild: höchstens 1 Ortsbild, höchstens 1 Kapitelbild bis zum ersten freien Laufen (Ort ${ortRuns}×, Kapitel ${chapRuns}×)`, ortRuns <= 1 && chapRuns <= 1, { ortRuns, chapRuns, events });
  R.t(`[${kind}] Ortsbild und Kapitelbild nie gleichzeitig`, !TL.some(x => /ORT/.test(x) && /KAPITEL/.test(x)), events);
  R.t(`[${kind}] Keine Konsolenfehler im Ablauf`, p.errs.length === 0, p.errs); await p.close();
}
if (which === 'alle' || which === 'app') await run('app'); if (which === 'alle' || which === 'artifact') await run('artifact');
await env.close(); console.log(`\n${R.ok} ✓ / ${R.bad} ✗`); process.exit(R.bad ? 1 : 0);
