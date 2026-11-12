// Unit/Browser-Test Titel-Opening (src/12-intro.js, docs/intro-video.md › Titel-Opening) – echter Browserpfad über test/art_serve.mjs.
//   node build.mjs && node test/unit_opening.mjs
// Geprüft: keine Kreaturen-/Figuren-Aufrufe im Opening (Code-Suche), nur sky_/horizon_-Bilder; echter Ablauf (VEYRA_OPEN=1): Dauer 4–6 s, Überspringen erst ab 1 s
//   (Tippen, Taste, Knopf), Titel + Untertitel, Klangfläche (I3), Blende ins Titelbild; Webdriver/Demo-Pfad: sofort Endbild, schließt selbst; Rückfall ohne Bilder;
//   playLegendIntro spielt erneut ab; Optionen-Text. Screenshots: test/opening_<0s|2s|4s>_<1920|860>.png (Standbild über window.VEYRA_OPEN_T).
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { readFileSync } from 'fs';
let ok = 0, bad = 0;
const t = (n, c, info) => { if (c) { ok++; console.log('✓', n); } else { bad++; console.log('✗', n, info !== undefined ? '– ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''); } };
const out = n => new URL('./' + n, import.meta.url).pathname;

// ---------- 1) Code-Suche: im Opening wird keine Kreatur/Figur gezeichnet
const src = ['12-intro.js', '13-intro3d.js'].map(f => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8')).join('\n');
const code = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const BAN = /\b(drawMon|buildMon3D|animMon|monSprite|drawFig\w*|figPortrait|drawHero\w*|heroLook|MONS|FIGS|silo)\s*[\(\[.]/;
t('Opening-Code ruft keine Kreaturen-/Figuren-Zeichner auf (drawMon, buildMon3D, animMon, Figuren, MONS)', !BAN.test(code), (code.match(BAN) || [])[0]);
const keys = [...code.matchAll(/ld\('([\w-]+)'/g)].map(m => m[1]);
t('Opening lädt nur Himmel/Kulisse (sky_lichtlande_abend, horizon_lichtlande)', keys.length === 2 && keys.every(k => /^(sky|horizon)_/.test(k)), keys);
t('Keine Kreaturen-Bildschlüssel (ART_SRC[Zahl]) im Opening', !/ART_SRC\s*\[\s*\d/.test(code) && !/S\[\s*\d/.test(code));
const app = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
t('Build: altes Legenden-Intro nicht mehr enthalten (IL3/ILINES/intro3dFrame)', !/IL3=|ILINES=|function intro3dFrame/.test(app));
t('Build: Titel „Kreaturenchronik“ + „Die Welt der Terras“ im Opening-Markup', /id="introLogo"><h1>VEYRA<\/h1><p class="okc">Kreaturenchronik<\/p><p class="tsub">Die Welt der Terras<\/p>/.test(app));

// ---------- 2) Browser
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const IGN = /Failed to load resource|favicon|net::ERR|GPU stall|GL Driver/;
const allErrs = [];
async function open(o = {}) {
  const ctx = await browser.newContext({ viewport: o.vp || { width: 860, height: 400 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const p = await ctx.newPage(); p.errs = []; p.ctx = ctx;
  p.on('pageerror', e => p.errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) p.errs.push('console.error: ' + m.text().slice(0, 160)); });
  await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  if (o.block) await p.route(/(sky|horizon)_lichtlande[\w]*\.webp/, r => r.abort());
  await p.addInitScript(o.real === false ? () => { window.VEYRA_DEMO = 1; } : () => { window.VEYRA_DEMO = 1; window.VEYRA_OPEN = 1; });
  if (o.init) await p.addInitScript(o.init);
  await p.goto(S.url + 'index.html', { waitUntil: 'load' });
  return p;
}
const ev = (p, c) => p.evaluate(c), W = (p, ms) => p.waitForTimeout(ms);
const st = p => ev(p, "({on:introOn,hid:$('#intro').hidden,out:$('#intro').classList.contains('out'),skip:!$('#iSkip').hidden,logo:$('#introLogo').classList.contains('show'),i3:!!I3,prompt:!$('#iPrompt').hidden,title:!$('#title').hidden})");
const done = async (p, max = 9000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { const s = await st(p); if (!s.on) return (Date.now() - t0); await W(p, 50); } return -1; };
const lum = p => ev(p, "(()=>{const c=$('#icv'),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data;let s=0,n=0,mn=255,mx=0;for(let i=0;i<d.length;i+=4*97){const l=(d[i]+d[i+1]+d[i+2])/3;s+=l;n++;mn=Math.min(mn,l);mx=Math.max(mx,l);}return{avg:s/n,span:mx-mn}})()");

// 2a) Echter Ablauf: Standbild hinter dem Startknopf, Dauer, Überspringen erst ab 1 s, Titel
{
  const p = await open();
  await W(p, 700);
  const s0 = await st(p); const l0 = await lum(p);
  t('Vor dem Start: „Tippe, um zu beginnen“ über abgedunkeltem Himmelsbild', s0.prompt && !s0.on && l0.span > 10, { s0, l0 });
  const imgs = await ev(p, "({sky:!!OP.sky,hz:!!OP.hzT})"); t('Himmelsbild + Kathedralen-Kulisse geladen', imgs.sky && imgs.hz, imgs);
  await p.click('#iPrompt'); const tStart = Date.now();
  await W(p, 400); let s = await st(p);
  t('Opening läuft, Klangfläche aktiv (I3 gesetzt → 11-fx „intro“), Überspringen noch verborgen', s.on && s.i3 && !s.skip && !s.logo, s);
  await p.mouse.click(430, 200); await p.keyboard.press('Space'); await W(p, 150); s = await st(p);
  t('Tippen/Taste vor 1 s überspringt NICHT', s.on && !s.out, s);
  await W(p, Math.max(0, 1150 - (Date.now() - tStart))); s = await st(p);
  t('Ab 1 s: „Überspringen“ sichtbar', s.on && s.skip, s);
  const sk = await p.locator('#iSkip').boundingBox(); t('„Überspringen“ gut tippbar (≥ 32 px hoch)', sk && sk.height >= 32, sk);
  await W(p, Math.max(0, 1900 - (Date.now() - tStart))); s = await st(p);
  t('Titel „VEYRA – Kreaturenchronik – Die Welt der Terras“ eingeblendet', s.logo && await ev(p, "$('#introLogo').innerText.replace(/\\s+/g,' ').trim()") === 'VEYRA Kreaturenchronik DIE WELT DER TERRAS', await ev(p, "$('#introLogo').innerText"));
  const l1 = await lum(p); t('Bild nicht leer (Himmel + Licht)', l1.avg > 25 && l1.span > 40, l1);
  const rest = await done(p); const dur = (Date.now() - tStart) / 1000;
  t('Opening endet von selbst nach 4–6 s', rest >= 0 && dur >= 4 && dur <= 6.3, dur.toFixed(2) + ' s');
  await W(p, 800); s = await st(p);
  t('Blende ins Titelbild: #intro verborgen, Titel sichtbar, I3 frei', s.hid && s.title && !s.i3, s);
  t('Keine Seitenfehler (echter Ablauf)', !p.errs.length, p.errs); allErrs.push(...p.errs); await p.ctx.close();
}
// 2b) Überspringen ab 1 s per Tippen und per Taste
for (const how of ['tap', 'key']) {
  const p = await open(); await W(p, 300); await p.click('#iPrompt'); await W(p, 1250);
  if (how === 'tap') await p.mouse.click(300, 300); else await p.keyboard.press('Enter');
  const ms = await done(p, 1500); await W(p, 800); const s = await st(p);
  t(`Überspringen ab 1 s per ${how === 'tap' ? 'Tippen' : 'Taste'} → sofort ins Titelbild`, ms >= 0 && ms < 400 && s.hid && s.title, { ms, s });
  allErrs.push(...p.errs); await p.ctx.close();
}
// 2c) Webdriver/Demo-Pfad: sofort Endbild, Überspringen sofort, schließt selbst
{
  const p = await open({ real: false }); await W(p, 300); await p.click('#iPrompt'); await W(p, 150); const s = await st(p);
  t('Webdriver/Demo: sofort Endbild mit Titel, „Überspringen“ sofort sichtbar', s.on && s.logo && s.skip, s);
  const ms = await done(p, 4000); t('Webdriver/Demo: schließt nach ≤ 3 s selbst', ms >= 0 && ms < 3000, ms);
  allErrs.push(...p.errs); await p.ctx.close();
}
// 2d) Rückfall ohne Bilder (z. B. Bild fehlt): prozeduraler Verlauf, keine Fehler
{
  const p = await open({ block: true }); await W(p, 300); await p.click('#iPrompt'); await W(p, 2000);
  const im = await ev(p, "({sky:!!OP.sky,hz:!!OP.hzT})"), l = await lum(p);
  t('Rückfall ohne Bilder: Verlauf + Bergschatten gezeichnet, keine Fehler', !im.sky && !im.hz && l.avg > 25 && l.span > 30 && !p.errs.length, { im, l, e: p.errs });
  await p.screenshot({ path: out('opening_fallback_860.png') });
  allErrs.push(...p.errs); await p.ctx.close();
}
// 2e) playLegendIntro spielt das Opening erneut; Optionen-Text
{
  const p = await open(); await W(p, 300); await p.click('#iPrompt'); await W(p, 1200); await p.click('#iSkip'); await W(p, 900);
  const r = await ev(p, "(async()=>{const t0=performance.now();setTimeout(()=>{window._mid={on:introOn,vis:!$('#intro').hidden}},600);await playLegendIntro();return{ms:performance.now()-t0,mid:window._mid,hid:$('#intro').hidden}})()");
  await W(p, 800); const hid = await ev(p, "$('#intro').hidden");
  t('playLegendIntro: Opening läuft erneut und löst nach dem Ende auf', r.mid && r.mid.on && r.mid.vis && r.ms > 4000 && r.ms < 6500 && hid, r);
  const o = await ev(p, "($('#tOpt').click(),$('#optBody').innerText)");
  t('Optionen: „Titel-Opening beim Start“ + „Titel-Opening ansehen“, kein „Legenden-Intro“ mehr', /Titel-Opening beim Start/.test(o) && /Titel-Opening ansehen/.test(o) && !/Legenden-Intro/.test(o));
  allErrs.push(...p.errs); await p.ctx.close();
}
// 2f) Screenshots (Standbild je Zeitpunkt)
for (const vp of [{ width: 1920, height: 1080, tag: '1920' }, { width: 860, height: 400, tag: '860' }]) {
  for (const T of [0.35, 2, 4]) {
    const p = await open({ vp, init: `window.VEYRA_OPEN_T=${T}` }); await W(p, 400); await p.click('#iPrompt'); await W(p, T >= 2 ? 2600 : 300);
    await p.screenshot({ path: out(`opening_${Math.floor(T)}s_${vp.tag}.png`) }); allErrs.push(...p.errs); await p.ctx.close();
  }
}
t('Keine Seitenfehler in allen Läufen', !allErrs.length, allErrs.slice(0, 3));
console.log(`\nTitel-Opening: ${ok} ✓, ${bad} ✗`); await browser.close(); S.close(); process.exit(bad ? 1 : 0);
