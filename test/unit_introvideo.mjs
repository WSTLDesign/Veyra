// Unit/Browser-Test Intro-Film (src/44-introvideo.js, docs/intro-video.md) – echter Browserpfad über test/art_serve.mjs.
//   node build.mjs && node test/unit_introvideo.mjs
// Geprüft: Build (dist/video, Artifact ohne mp4/INTRO_VIDEO=null, Poster inline), Service Worker (kein Vorab-Cache), Titel (Poster, Untertitel, Metadaten-Vorladen),
//   Abspielen + Skip ab 2 s + Tippen zeigt Skip + Flag + Weiter ins interaktive Intro, Loop-Pause, „Intro ansehen?“ Ja/Nein, Fehlerpfad (Datei fehlt, Codec),
//   Quelle 480p bei langsamer Verbindung, stummer Start + „Ton an“ bei Autoplay-Sperre, Webdriver-Pfad (Smoke), Optionen › Erweitert, Artifact-Variante (Poster 2 s).
// Screenshots: test/introvideo_title.png, test/introvideo_overlay.png (1280×720), test/introvideo_overlay_860.png, test/introvideo_ask.png, test/introvideo_poster.png
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { readFileSync, existsSync, statSync } from 'fs';
let ok = 0, bad = 0;
const t = (n, c, info) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, info !== undefined ? '– ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''); } };
const D = p => new URL('../dist/' + p, import.meta.url), out = n => new URL('./' + n, import.meta.url).pathname;

// ---------- 1) Build / statisch
const app = readFileSync(D('index.html'), 'utf8'), art = readFileSync(D('artifact.html'), 'utf8'), sw = readFileSync(D('sw.js'), 'utf8');
t('dist/video existiert (720p, 480p, Poster)', ['intro_720.mp4', 'intro_480.mp4', 'intro_poster.jpg'].every(f => existsSync(D('video/' + f)) && statSync(D('video/' + f)).size > 1000));
t('App: INTRO_VIDEO mit 720p/480p/Poster', /window\.INTRO_VIDEO=\{"hd":"video\/intro_720\.mp4","sd":"video\/intro_480\.mp4","poster":"video\/intro_poster\.jpg"/.test(app));
t('Artifact: window.INTRO_VIDEO=null', art.includes('window.INTRO_VIDEO=null;'));
t('Artifact enthält kein mp4 und keinen Videopfad', !/\.mp4/i.test(art) && !/video\/intro_/.test(art));
t('Artifact: Poster als data-URI eingebettet', /window\.INTRO_POSTER="data:image\/jpeg;base64,/.test(art));
t('Artifact bleibt < 16 MB', statSync(D('artifact.html')).size < 16e6, statSync(D('artifact.html')).size);
const shell = (/const SHELL = \[([^\]]*)\]/.exec(sw) || [])[1] || '';
t('Service Worker: Video nicht vorab gecacht, eigener Laufzeit-Cache mit Range-Antworten', shell && !/video/.test(shell) && /veyra-video-/.test(sw) && /status: 206/.test(sw));

// ---------- 2) Browser
const S = await serve();
const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver|MEDIA_ERR|Media resource/;
const ARGS = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: ARGS });
const VP = { width: 860, height: 400 };
async function open(o = {}) {
  const ctx = o.ctx || await browser.newContext({ viewport: o.vp || VP, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const p = await ctx.newPage(); p.errs = []; p.ctx = ctx;
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 160)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  if (o.route) await o.route(p);
  if (o.demo !== false) await p.addInitScript(() => { window.VEYRA_DEMO = 1; window.VEYRA_VIDEO = 1; });
  if (o.init) await p.addInitScript(o.init);
  await p.goto(S.url + (o.page || 'index.html'), { waitUntil: 'load' });
  if (o.legend !== false) { // Titel-Opening (12-intro.js) vor dem Titelbild schließen
    try { await p.click('#iPrompt', { timeout: 4000 }); await p.waitForTimeout(500); await p.click('#iSkip', { timeout: 3000 }); await p.waitForTimeout(800); } catch (e) { } }
  return p;
}
const ev = (p, c) => p.evaluate(c);
const allErrs = [];

// 2a) Titel + Abspielen + Skip
{
  const p = await open();
  const ti = await ev(p, "({poster:$('#title').classList.contains('poster'),bg:getComputedStyle($('#title'),'::after').backgroundImage,sub:($('#title .tsub')||{}).textContent,pre:IV.el&&IV.el.preload,src:IV.el&&IV.el.getAttribute('src')})");
  t('Titel (App): Poster als Hintergrund', ti.poster && /intro_poster\.jpg/.test(ti.bg), ti);
  t('Titel: Untertitel „Die Welt der Terras“', ti.sub === 'Die Welt der Terras', ti.sub);
  t('Titel: Video-Metadaten erst im Titel vorgeladen (preload=metadata, 720p)', ti.pre === 'metadata' && /intro_720/.test(ti.src || ''), ti);
  await p.waitForTimeout(600); await p.screenshot({ path: out('introvideo_title.png') });
  await p.click('#tNew'); await p.waitForTimeout(900);
  const s1 = await ev(p, "({ov:!!document.querySelector('.ivL video'),skip:document.querySelector('.ivSkip').classList.contains('show'),mode,idle:loopIdle(),music:SET.music})");
  t('Neues Spiel → Film-Overlay im Vollbild, Loop gedrosselt (Modus title), Synth-Musik stumm', s1.ov && s1.mode === 'title' && s1.idle && s1.music === 0, s1);
  t('„Überspringen“ noch verborgen (< 2 s)', !s1.skip, s1);
  await p.waitForTimeout(1500);
  const s2 = await ev(p, "(()=>{const v=document.querySelector('.ivL video'),b=document.querySelector('.ivSkip').getBoundingClientRect(),cs=getComputedStyle(v);return{show:document.querySelector('.ivSkip').classList.contains('show'),w:b.width,h:b.height,t:v.currentTime,muted:v.muted,fit:cs.objectFit,vw:v.getBoundingClientRect().width,seen:SET.introSeen}})()");
  t('„Überspringen“ nach 2 s sichtbar, ≥ 48 px', s2.show && s2.w >= 48 && s2.h >= 48, s2);
  t('Film läuft (currentTime > 0), Ton an, Vollbild; 860×400 (2,15:1) → schwarze Ränder (contain)', s2.t > 0.3 && !s2.muted && s2.fit === 'contain' && s2.vw === VP.width, s2);
  await p.setViewportSize({ width: 1280, height: 720 }); await p.waitForTimeout(250);
  t('16:9-Bild (1280×720) → object-fit cover', await ev(p, "getComputedStyle(document.querySelector('.ivL video')).objectFit") === 'cover');
  await p.setViewportSize({ width: 1200, height: 600 }); await p.waitForTimeout(250);
  t('2:1-Bild (≤ 12 % Beschnitt) → cover', await ev(p, "getComputedStyle(document.querySelector('.ivL video')).objectFit") === 'cover');
  t('SET.introSeen=1 nach Abspielbeginn', s2.seen === 1, s2.seen);
  await p.setViewportSize({ width: 1280, height: 720 }); await p.waitForTimeout(1200); await p.screenshot({ path: out('introvideo_overlay.png') });
  await p.setViewportSize(VP); await p.waitForTimeout(200); await p.screenshot({ path: out('introvideo_overlay_860.png') });
  await p.click('.ivSkip'); await p.waitForTimeout(1600);
  const s3 = await ev(p, "({ov:!!document.querySelector('.ivL'),seq:!$('#seqL').hidden,last:IV.last,on:IV.on,music:SET.music,stored:JSON.parse(localStorage.getItem(SETKEY)).introSeen})");
  t('Skip → Fade zu Schwarz → interaktives Intro (Veyran) startet', !s3.ov && s3.seq && s3.last === 'skip' && !s3.on, s3);
  t('Musik-Einstellung zurückgesetzt, Flag gespeichert', s3.music === 1 && s3.stored === 1, s3);
  allErrs.push(...p.errs);
  // 2b) zweites „Neues Spiel“: Abfrage Nein → direkt interaktiv; Ja → Film
  await p.reload({ waitUntil: 'load' }); try { await p.click('#iPrompt', { timeout: 4000 }); await p.waitForTimeout(500); await p.click('#iSkip', { timeout: 3000 }); await p.waitForTimeout(800); } catch (e) { }
  await p.click('#tNew'); await p.waitForTimeout(400);
  const a1 = await ev(p, "(()=>{const a=document.querySelector('.ivAsk');if(!a)return null;const bs=[...a.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return{t:b.textContent,h:r.height}});return{q:a.querySelector('b').textContent,bs,ov:!!document.querySelector('.ivL')}})()");
  t('Weiteres „Neues Spiel“: Abfrage „Intro ansehen?“ (Ja/Nein, ≥ 48 px), kein Film', a1 && a1.q === 'Intro ansehen?' && a1.bs.map(b => b.t).join() === 'Ja,Nein' && a1.bs.every(b => b.h >= 48) && !a1.ov, a1);
  await p.screenshot({ path: out('introvideo_ask.png') });
  await p.click('.ivAsk button[data-a="0"]'); await p.waitForTimeout(500);
  t('„Nein“ → direkt ins interaktive Intro', await ev(p, "!document.querySelector('.ivAsk')&&!document.querySelector('.ivL')&&!$('#seqL').hidden"));
  await p.reload({ waitUntil: 'load' }); try { await p.click('#iPrompt', { timeout: 4000 }); await p.waitForTimeout(500); await p.click('#iSkip', { timeout: 3000 }); await p.waitForTimeout(800); } catch (e) { }
  await p.click('#tNew'); await p.waitForTimeout(400); await p.click('.ivAsk button[data-a="1"]'); await p.waitForTimeout(500);
  t('„Ja“ → Film spielt erneut', await ev(p, "!!document.querySelector('.ivL video')"));
  await p.mouse.click(400, 200); await p.waitForTimeout(150);
  t('Tippen ins Bild zeigt „Überspringen“ sofort (< 2 s)', await ev(p, "document.querySelector('.ivSkip').classList.contains('show')"));
  await p.keyboard.press('Escape'); await p.waitForTimeout(1600);
  t('Escape überspringt, danach interaktives Intro', await ev(p, "!document.querySelector('.ivL')&&!$('#seqL').hidden&&IV.last==='skip'"));
  allErrs.push(...p.errs); await p.ctx.close();
}

// 2c) Optionen › Erweitert › „Intro-Film abspielen“ (vom Titel) + Quelle bei langsamer Verbindung
{
  const p = await open({ init: () => { Object.defineProperty(navigator, 'connection', { configurable: true, value: { effectiveType: '3g', saveData: false } }); } });
  t('Langsame Verbindung (3g) → 480p-Quelle', await ev(p, "/intro_480/.test(ivSrc())&&/intro_480/.test(IV.el.getAttribute('src'))"), await ev(p, 'ivSrc()'));
  await p.click('#tOpt'); await p.waitForTimeout(300); await p.click('#optBody details.adv summary'); await p.waitForTimeout(200);
  const row = p.locator('#optBody .orow', { hasText: 'Intro-Film abspielen' });
  t('Optionen › Erweitert: Zeile „Intro-Film abspielen“', await row.count() === 1);
  await row.locator('button').click(); await p.waitForTimeout(700);
  t('Abspielen aus den Optionen: Film läuft, Optionen zu', await ev(p, "!!document.querySelector('.ivL video')&&$('#opts').hidden"));
  await p.keyboard.press('Escape'); await p.waitForTimeout(1600);
  t('Nach dem Film zurück im Titel (kein interaktives Intro)', await ev(p, "!document.querySelector('.ivL')&&mode==='title'&&$('#seqL').hidden&&!$('#title').hidden"));
  allErrs.push(...p.errs); await p.ctx.close();
}

// 2d) Fehlerpfad: Datei fehlt (404) / Codec unbekannt → sofort weiter, ohne Hängen, Flag bleibt aus
{
  const p = await open({ route: p => p.route(/\/video\/intro_(720|480)\./, r => r.fulfill({ status: 404, body: '404' })) });
  const t0 = Date.now(); await p.click('#tNew');
  await p.waitForFunction(() => !$('#seqL').hidden, null, { timeout: 9000 }).catch(() => { });
  const dt = Date.now() - t0, s = await ev(p, "({ov:!!document.querySelector('.ivL'),seq:!$('#seqL').hidden,last:IV.last,seen:SET.introSeen||0,on:IV.on,mode})");
  t('Datei fehlt → sofort interaktives Intro (< 2,5 s), kein Overlay, Flag nicht gesetzt', !s.ov && s.seq && s.last !== 'skip' && !s.on && !s.seen && dt < 2500, { ...s, dt });
  allErrs.push(...p.errs); await p.ctx.close();
}
{
  const p = await open(); await ev(p, "INTRO_VIDEO.type='video/x-veyra-unbekannt'");
  await p.click('#tNew'); await p.waitForTimeout(300);
  t('Codec nicht abspielbar → sofort weiter', await ev(p, "!document.querySelector('.ivL')&&!$('#seqL').hidden"));
  allErrs.push(...p.errs); await p.ctx.close();
}

// 2e) Webdriver-Pfad (wie Smoke): Film übersprungen, Flag gesetzt, Spiel startet; Wiedergabe im Spiel pausiert den 3D-Render
{
  const p = await open({ demo: false });
  t('Webdriver-Pfad: kein Vorladen im Titel', await ev(p, '!IV.el'));
  await p.click('#tNew'); await p.waitForTimeout(500);
  const s = await ev(p, "({G:!!G,ov:!!document.querySelector('.ivL'),seen:SET.introSeen,mode})");
  t('Webdriver: Film übersprungen, SET.introSeen=1, Spiel läuft', s.G && !s.ov && s.seen === 1, s);
  await ev(p, "for(let i=0;i<30&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}0"); await p.waitForTimeout(1200);
  await ev(p, "window._d3=0;const o=draw3d;draw3d=function(){window._d3++;return o.apply(this,arguments)};0"); await p.waitForTimeout(800);
  const before = await ev(p, 'window._d3');
  await ev(p, 'replayIntroFilm();0'); await p.waitForTimeout(400); await ev(p, 'window._d3=0'); await p.waitForTimeout(1200);
  const during = await ev(p, "({n:window._d3,mode,hud:$('#hudOv').hidden})");
  t('Im Spiel abgespielt: kein Weltrender während des Films (draw3d 0×), HUD aus', before > 3 && during.n === 0 && during.mode === 'title' && during.hud, { before, during });
  await p.keyboard.press('Escape'); await p.waitForTimeout(1600);
  const after = await ev(p, "({mode,n:window._d3})");
  t('Nach dem Film: zurück in die Welt, Render läuft wieder', after.mode === 'world' && after.n > 3, after);
  allErrs.push(...p.errs); await p.ctx.close();
}

// 2f) Autoplay mit Ton gesperrt → stumm starten + „Ton an“ (Headless ignoriert die Autoplay-Regel; Sperre wie im Handy-Browser nachgebildet: play() mit Ton → NotAllowedError)
{
  const b2 = browser;
  const p = await open({ legend: false, init: () => { const pl = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { return this.muted ? pl.call(this) : Promise.reject(new DOMException('Autoplay mit Ton gesperrt', 'NotAllowedError')); }; } });
  await ev(p, "$('#intro').hidden=true;playIntroFilm();0"); await p.waitForTimeout(1500);
  const s = await ev(p, "(()=>{const v=document.querySelector('.ivL video');const b=document.querySelector('.ivSnd');return v?{muted:v.muted,t:v.currentTime,snd:b.classList.contains('show'),h:b.getBoundingClientRect().height}:null})()");
  t('Autoplay mit Ton verweigert → stumm gestartet, „Ton an“-Knopf (≥ 48 px)', s && s.muted && s.t > 0.2 && s.snd && s.h >= 48, s);
  if (s) { await p.click('.ivSnd'); await p.waitForTimeout(150); t('„Ton an“ schaltet den Ton ein', await ev(p, "!document.querySelector('.ivL video').muted&&!document.querySelector('.ivSnd').classList.contains('show')")); }
  allErrs.push(...p.errs); await p.ctx.close();
}

// 2g) Artifact-Variante: dist/artifact.html in ein Dokument-Skelett gelegt (wie claude.ai), three.js lokal statt CDN
{
  const three = readFileSync(D('three.min.js'));
  const p = await open({
    page: 'artifact_wrap.html', route: async p => {
      await p.route(/artifact_wrap\.html$/, r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + art + '</body></html>' }));
      await p.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/, r => r.fulfill({ status: 404, body: '' }));
      await p.route(/cdnjs\.cloudflare\.com\/.*three\.min\.js$/, r => r.fulfill({ body: three, contentType: 'text/javascript' })); // zuletzt registriert = Vorrang
    }
  });
  const ti = await ev(p, "({poster:$('#title').classList.contains('poster'),sub:($('#title .tsub')||{}).textContent,v:window.INTRO_VIDEO,el:IV.el,vids:document.querySelectorAll('video').length})");
  t('Artifact: kein Video, kein Poster-Titel, Untertitel vorhanden', ti.v === null && !ti.el && !ti.poster && ti.vids === 0 && ti.sub === 'Die Welt der Terras', ti);
  await p.click('#tNew'); await p.waitForTimeout(1300);
  const s = await ev(p, "(()=>{const L=document.querySelector('.ivPost');const I=L&&L.querySelector('.ivImg');return L?{bg:getComputedStyle(I).backgroundImage.slice(0,40),in:L.classList.contains('in'),logo:L.querySelector('h1').textContent,sub:L.querySelector('p').textContent,vids:document.querySelectorAll('video').length}:null})()");
  t('Artifact: Poster-Standbild mit Logo-Einblendung „VEYRA – Die Welt der Terras“', s && /data:image\/jpeg/.test(s.bg) && s.logo === 'VEYRA' && s.sub === 'Die Welt der Terras' && s.in && s.vids === 0, s);
  await p.screenshot({ path: out('introvideo_poster.png') });
  await p.waitForTimeout(1800);
  t('Artifact: nach ~2 s weiter ins interaktive Intro, Flag gesetzt', await ev(p, "!document.querySelector('.ivPost')&&!$('#seqL').hidden&&SET.introSeen===1"));
  allErrs.push(...p.errs); await p.ctx.close();
}
// ---- Erstes Ansehen: „Überspringen“ gesperrt bis 18 s (VEYRA_LOCK=1 erzwingt die Sperre im Testharness) ----
{
  const p = await open({ init: () => { window.VEYRA_LOCK = 1; } });
  await p.click('#tNew'); await p.waitForTimeout(3000);
  await p.mouse.click(430, 200); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const a = await ev(p, "({ov:!!document.querySelector('.ivL video'),skip:document.querySelector('.ivSkip').classList.contains('show')})");
  t('Erstes Ansehen: bei 3 s zeigt weder Tippen noch Escape „Überspringen“, Film läuft weiter', a.ov && !a.skip, a);
  await p.waitForTimeout(15800);
  const b = await ev(p, "({ov:!!document.querySelector('.ivL video'),skip:document.querySelector('.ivSkip').classList.contains('show')})");
  t('Erstes Ansehen: ab 18 s ist „Überspringen“ sichtbar', b.ov && b.skip, b);
  await p.click('.ivSkip'); await p.waitForTimeout(1600);
  t('Erstes Ansehen: Überspringen ab 18 s funktioniert', await ev(p, "!document.querySelector('.ivL')"));
  allErrs.push(...p.errs); await p.ctx.close();
}

t('Keine Konsolen-/Seitenfehler', allErrs.length === 0, allErrs.slice(0, 6));
await browser.close(); S.close();
console.log(`\nunit_introvideo: ${ok} ✓, ${bad} ✗`);
process.exit(bad ? 1 : 0);
