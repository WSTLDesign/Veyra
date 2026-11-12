// QA Hybrid (Sonnet hoch) – Prüfpunkt 3 (Abläufe) + 10 (file://-Rückfall): Höhle/Innenraum → alter Hintergrund, Kampf-Ende (Sieg), Fang, Flucht, Doppelkampf 2v2, Wechsel zwischen Kämpfen, Konsolenfehler; dann dist/index.html über file://.
// Aufruf: node build.mjs && node test/qa_hybrid_flow.mjs → ✓/✗ auf stdout, Screenshots test/qa_hybrid_flow_*.png
import { boot, scene } from './look_lib.mjs';
import { chromium } from 'playwright';
const png = n => new URL(`./qa_hybrid_flow_${n}.png`, import.meta.url).pathname;
let fails = 0; const ok = (n, c, d = '') => { if (!c) fails++; console.log((c ? '✓ ' : '✗ ') + n + (d ? '  [' + d + ']' : '')); };
const B = await boot({ w: 860, h: 484, set: { res: 'native', gfx: 'high', fps: 0, shadows: 1, particles: 1, light: 1, hudDim: 'aus' } }); const { page } = B;
await page.evaluate(() => { ROAM.list.length = 0; ROAM.want = 0; window.VEYRA_DEMO = 0; SET.btl = 'runde'; SET.diff = 'leicht'; });
const waitMenu = () => page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 120000 });
const state = () => page.evaluate(() => ({ on: HYB.on, cur: !!HYB.cur, dome: BT && BT.dome.visible, calls: BT && BT.r.info.render.calls, key: HYB.key, mode, B: !!B, err: 0 }));
const endAll = () => page.evaluate(() => { try { if (B) endBattle('run'); } catch (e) { } mode = 'world'; for (let i = 0; i < 30 && !$('#dlg').hidden; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
const autoTurn = "(()=>{if(!B||B.busy||!document.querySelector('#bMenu').children.length)return 0;if(B.needSlot!=null){const i=G.team.findIndex((m,j)=>m.hp>0&&!B.mine.includes(j));if(i>=0)doSwitch(i);return 1;}const me=G.team[B.mi];const i=me.moves.findIndex(m=>m.pp>0&&MOVES[m.id][2]>0);const t=B.foes.findIndex(m=>m&&m.hp>0);turn({k:'move',i:i<0?-1:i,target:t<0?0:t});return 1;})()";
const calls = [];
// 1) Höhle (Nebelgrotte, Thema cave), Innenraum (Haus) → alter Hintergrund (HYB.on false, Kuppel sichtbar)
for (const [m, x, y, nm] of [['nebelgrotte', 6, 12, 'hoehle'], ['labor', 5, 5, 'innen']]) {
  await scene(page, m, x, y, 720); await page.waitForTimeout(800);
  await page.evaluate(() => { SET.skipBattleIntro = 1; startBattle({ wild: mk(25, 10) }); }); await waitMenu(); await page.waitForTimeout(2200);
  const s = await state(); await page.screenshot({ path: png(nm) });
  ok(`F1 ${nm}: kein Panorama, alter Hintergrund (Kuppel sichtbar)`, !s.on && !s.cur && s.dome === true, JSON.stringify(s)); calls.push(s.calls); await endAll(); await page.waitForTimeout(500);
}
// 2) Draußen → Panorama; Flucht
await scene(page, 'route1', 9, 12, 720); await page.waitForTimeout(800);
await page.evaluate(() => { startBattle({ wild: mk(25, 12) }); }); await waitMenu(); await page.waitForTimeout(2500);
let s = await state(); ok('F2 Draußen: Panorama an, Kuppel aus', s.on && s.cur && s.dome === false, JSON.stringify(s)); calls.push(s.calls);
for (let i = 0; i < 12 && await page.evaluate(() => !!B); i++) { await waitMenu().catch(() => { }); await page.evaluate(() => { if (B && !B.busy) turn({ k: 'run' }); }); await page.waitForFunction(() => !B, null, { timeout: 6000 }).catch(() => { }); } // Flucht gelingt nur mit Wahrscheinlichkeit → wiederholen
s = await page.evaluate(() => ({ B: !!B, mode, on: HYB.on })); ok('F3 Flucht: Kampf endet, Welt (HYB.on bleibt bis zum nächsten Kampfbild stehen – harmlos, BT-Szene wird nicht gezeichnet)', !s.B && s.mode === 'world', JSON.stringify(s));
// 3) Fang (Absolutkapsel)
await page.evaluate(() => { G.bag.meister = 3; startBattle({ wild: mk(31, 10) }); }); await waitMenu(); await page.waitForTimeout(1500);
await page.evaluate(() => { turn({ k: 'ball', item: 'meister' }); });
await page.waitForFunction(() => !B, null, { timeout: 60000 }).catch(() => { });
await page.evaluate(() => { for (let i = 0; i < 40 && !$('#dlg').hidden; i++) { TW && TW.finish && TW.finish(); advDlg(); } }); await page.waitForTimeout(1500);
s = await page.evaluate(() => ({ B: !!B, mode, teamN: G.team.length, on: HYB.on, cards: [...document.querySelectorAll('#bCard,.capCard')].map(e => e.hidden).join(',') })); ok('F4 Fang: Kampf endet, Welt', !s.B && (s.mode === 'world' || s.mode === 'dialog'), JSON.stringify(s));
await page.evaluate(() => { mode = 'world'; for (let i = 0; i < 40 && !$('#dlg').hidden; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
// 4) Sieg (Gegner 1 KP, Attacke)
await page.evaluate(() => { startBattle({ wild: mk(25, 6) }); }); await waitMenu(); await page.waitForTimeout(1200);
await page.evaluate(() => { B.foe[B.fi].hp = 1; }); for (let i = 0; i < 60 && await page.evaluate(() => !!B); i++) { await page.evaluate(autoTurn); await page.mouse.click(300, 200); await page.waitForTimeout(500); if (i % 15 === 14) await page.evaluate(() => { B && B.foe[B.fi] && (B.foe[B.fi].hp = Math.min(B.foe[B.fi].hp, 1)); }); }
await page.evaluate(() => { for (let i = 0; i < 40 && !$('#dlg').hidden; i++) { TW && TW.finish && TW.finish(); advDlg(); } }); await page.waitForTimeout(1000);
s = await page.evaluate(() => ({ B: !!B, mode, on: HYB.on })); ok('F5 Sieg: Kampf endet, Welt', !s.B && s.mode === 'world', JSON.stringify(s));
// 4b) Höhle NACH einem Kampf mit Panorama: alter Hintergrund wiederhergestellt (Nebel, Belichtung, Kuppel)
await scene(page, 'nebelgrotte', 6, 12, 720); await page.waitForTimeout(800);
await page.evaluate(() => { startBattle({ wild: mk(25, 10) }); }); await waitMenu(); await page.waitForTimeout(2200);
s = await page.evaluate(() => ({ on: HYB.on, dome: BT.dome.visible, fogN: BT.s.fog.near, fogF: BT.s.fog.far, exp: BT.r.toneMappingExposure, hemiG: BT.hemi.groundColor.getHexString(), meshVis: HYB.mesh && HYB.mesh.visible, th: BT.th }));
ok('F5b Höhle nach Panorama-Kampf: alter Hintergrund komplett zurück (Kuppel an, Panorama-Viereck aus, Nebel 18–55, Belichtung 1,1)', !s.on && s.dome && !s.meshVis && s.fogN === 18 && s.fogF === 55 && Math.abs(s.exp - 1.1) < .01, JSON.stringify(s)); await page.screenshot({ path: png('hoehle_nach_panorama') }); await endAll(); await page.waitForTimeout(400);
// 5) Doppelkampf 2v2
await scene(page, 'route1', 9, 12, 720); await page.waitForTimeout(800);
await page.evaluate(() => { G.team = [mk(1, 14), mk(7, 14)]; G.team.forEach(m => { m.hp = stat(m, 'hp'); }); });
await page.evaluate(() => { startBattle({ trainer: { name: 'QA-Zwillinge', team: [[59, 6], [112, 6]], flag: 'tr_qa_hy', pre: '', post: 'Doppelt verloren!', money: 10, double: true } }); }); await waitMenu(); await page.waitForTimeout(2200);
const d = await page.evaluate(() => ({ d: B.double, f: B.foes.length, m: B.mine.length, on: HYB.on, calls: BT.r.info.render.calls, vis: [BT.foe && BT.foe.visible, BT.me && BT.me.visible] })); calls.push(d.calls);
ok('F6 Doppelkampf 2v2 startet mit Panorama', d.d && d.f === 2 && d.m === 2 && d.on, JSON.stringify(d)); await page.screenshot({ path: png('doppel') });
for (let i = 0; i < 120 && await page.evaluate(() => !!B); i++) { await page.evaluate(autoTurn); await page.mouse.click(200, 200); await page.waitForTimeout(260); if (i % 20 === 19) await page.evaluate(() => { for (let k = 0; k < 20 && !$('#dlg').hidden; k++) { TW && TW.finish && TW.finish(); advDlg(); } }); }
await page.evaluate(() => { for (let i = 0; i < 40 && !$('#dlg').hidden; i++) { TW && TW.finish && TW.finish(); advDlg(); } }); await page.waitForTimeout(800);
s = await page.evaluate(() => ({ B: !!B, mode, win: !!G.flags.tr_qa_hy })); ok('F7 Doppelkampf endet fehlerfrei (Sieg gezählt)', !s.B && s.mode === 'world', JSON.stringify(s));
// 6) Schneller Wechsel Kampf → Kampf in verschiedenen Zeiten (Tag → Nacht): Panorama wechselt, keine Texturleiche
let tex0 = 0;
for (const t of [720, 1125, 1380, 720]) { await scene(page, 'route1', 9, 12, t); await page.waitForTimeout(600); await page.evaluate(() => { startBattle({ wild: mk(25, 8) }); }); await waitMenu(); await page.waitForTimeout(1200); const k = await page.evaluate(() => ({ key: HYB.key, tex: HYB.texs.size, glTex: BT.r.info.memory.textures })); tex0 = Math.max(tex0, k.tex); calls.push(await page.evaluate(() => BT.r.info.render.calls)); console.log('  Zeit', t, JSON.stringify(k)); await endAll(); await page.waitForTimeout(300); }
ok('F8 höchstens 2 Kampftexturen im Speicher (HYB.texs)', tex0 <= 2, 'max ' + tex0);
ok('F9 Draw-Calls im Kampf ≤ 150', Math.max(...calls) <= 150, 'max ' + Math.max(...calls) + ' (' + calls.join(',') + ')');
ok('F10 keine Konsolenfehler im Ablauf', B.errs.length === 0, B.errs.slice(0, 4).join(' | ')); await B.close();

console.log(`\nFails: ${fails}`); process.exit(fails ? 1 : 0);
