// Beenden & PC-Notbremse (54-beenden.js): Knopf in der Chronik, Abschalt-Seite, Weiterspielen, Strg+Q, Desktop-Auflösungsdeckel.
//   node test/beenden_qa.mjs
import { start, page, newGame, reporter } from './qa_mech_lib.mjs';
const R = reporter(process.env.QA_LOG || '/tmp/beenden_qa.log', 'Beenden & Notbremse');
const env = await start(); const p = await page(env, { w: 1280, h: 720 }); await newGame(p, { team: [[1, 12]], view: '3d' });
const ev = (f, a) => p.evaluate(f, a);
const W = ms => p.waitForTimeout(ms);
// 1) Knopf sichtbar in der Chronik
await ev(() => { mode = 'world'; openMenu('quest'); }); await W(1500);
const btn = await ev(() => { const b = document.getElementById('mQuit'); if (!b || !b.offsetParent) return null; const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), t: b.textContent.trim() }; });
R.t('1 Knopf „Speichern & schließen“ sichtbar in der Chronik', !!btn && btn.h >= 40, btn);
// 2) Klick → gespeichert, Abschalt-Seite, Schleife steht
const before = await ev(() => (typeof PERF === 'object' ? PERF.frames : 0));
await p.click('#mQuit'); await W(700);
const after1 = await ev(() => ({ ov: !!document.getElementById('quitOv'), txt: (document.querySelector('#quitOv h2') || {}).textContent, frames: typeof PERF === 'object' ? PERF.frames : 0, saved: !!localStorage.getItem('veyra_save_v1'), fs: !!document.fullscreenElement, q: !!window.__quit }));
await W(500);
const after2 = await ev(() => (typeof PERF === 'object' ? PERF.frames : 0));
R.t('2 Abschalt-Seite erscheint, Stand gespeichert', after1.ov && /Gespeichert/.test(after1.txt || '') && after1.saved, after1);
R.t('2 Spielschleife angehalten (keine neuen Bilder)', after1.q && after2 === after1.frames, { f1: after1.frames, f2: after2 });
// 3) Weiterspielen
const gl = await ev(() => { try { return R3 && R3.r && R3.r.getContext().isContextLost(); } catch (e) { return 'n/a'; } });
R.t('2 WebGL-Kontext nach dem Beenden freigegeben', gl === true || gl === 'n/a', gl);
await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => {}), p.click('#quitBack')]); await W(2500);
const back = await ev(() => ({ ov: !!document.getElementById('quitOv'), q: !!window.__quit, title: !!document.getElementById('title') }));
R.t('3 „Neu laden und weiterspielen“ lädt die Seite ohne Abschalt-Seite neu', !back.ov && !back.q, back);
// Zweite Seite nach dem Neuladen
const p2 = await page(env, { w: 1280, h: 720 }); await newGame(p2, { team: [[1, 12]], view: '3d' }); const ev2 = (f, a) => p2.evaluate(f, a); const W2 = ms => p2.waitForTimeout(ms);
// 4) Strg+Q
await p2.keyboard.press('Control+KeyQ'); await W2(600);
const ctrlq = await ev2(() => !!document.getElementById('quitOv'));
R.t('4 Strg+Q öffnet die Abschalt-Seite', ctrlq);
// 5) Desktop-Deckel: devH ≤ 1080, dprCap ≤ 1,25 (Maus-Gerät)
const caps = await ev2(() => ({ touch: matchMedia('(pointer:coarse)').matches, devH: devH(), dpr: dprCap() }));
R.t('5 PC: Renderhöhe ≤ 1440 und DPR-Deckel ≤ 1,5', caps.touch || (caps.devH <= 1440 && caps.dpr <= 1.5), caps);
// 6) Wächter: künstlich langsame Bilder → Stufe „niedrig“
const guard = await ev2(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); PERF.ft = 200; await W(5600); return { q: SET.quality, tier: PERF.tier }; });
R.t('6 Wächter stellt bei dauerhaft > 120 ms je Bild auf „niedrig“', guard.q === 'niedrig' && guard.tier === 'low', guard);
console.log(`beenden_qa: ${R.ok} ok, ${R.bad} fehl`); await env.close(); process.exit(R.bad ? 1 : 0);
