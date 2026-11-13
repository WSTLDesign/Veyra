// QA Loop B3 – Prüfung 5: Spielstand-Sicherheit für Loop B (G.figs, G.story, G.outfit.body).   node test/qa_b_save.mjs [--no-browser]
//  · test/fixtures/old_save_pre_a1.json (Stand vor Loop A) und test/fixtures/old_save_4orden.json (Stand mit 4 alten Orden, Format vor Loop B, wird bei Bedarf erzeugt)
//  · migrateKanon / migrateFigures / migrateStory / migrateSave je 2× → identisch (idempotent), nichts geht verloren (Team, Box, Dex, Flags, Geld, Tasche, Name)
//  · neuer Stand (Intro-Ergebnis) speichern → laden → migrieren → unverändert (G.figs, G.story, G.outfit.body, Rivalen, Flags)
//  · Browser: beide Altstände über „Fortsetzen“ laden, Medaillen/Story/Figuren prüfen, 4-Orden-Stand bis zum Epilog weiterspielbar (HUD „4/8 Medaillen“)
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
const fx = n => new URL('./fixtures/' + n, import.meta.url);
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); };

// ---- Fixture „4 alte Orden“ (Format Loop A, vor B: ver 4, dexKanon 1, Orden-Namen, keine figs/story/outfit.body)
if (!existsSync(fx('old_save_4orden.json'))) {
  const mon = (s, l) => ({ s, l, xp: l * l * l, hp: 40 + l * 3, moves: [{ id: 'kratzer', pp: 25 }, { id: 'knurren', pp: 30 }], known: ['kratzer', 'knurren'] });
  const seen = {}, caught = {}; for (let i = 1; i <= 90; i++) { seen[i] = 1; if (i % 2) caught[i] = 1; }
  writeFileSync(fx('old_save_4orden.json'), JSON.stringify({
    map: 'schattmoor', mods: {}, bag: { kapsel: 12, trank: 5, ultra: 3 }, money: 5400, time: 14 * 60, ver: 4, dexKanon: 1, name: 'Kim', rival: 'Lio', starter: 1,
    flags: { starter: 1, firstcatch: 1, badge1: 1, grunt1: 1, badge2: 1, tr_lio: 1, badge3: 1, boss1: 1, badge4: 1 }, badges: ['Blütenorden', 'Wellenorden', 'Gletscherorden', 'Mondorden'],
    rivals: { rayan: { starter: 7 }, mira: { starter: 4 } }, ret: { map: 'schattmoor', x: 5, y: 10 }, respawn: { map: 'kupferhain', x: 5, y: 10 }, px: 8, py: 12, visited: { morgenau: 1, route1: 1, schattmoor: 1 }, known2: {},
    outfit: { skin: '#f6d3b3', hair: 'zopf', hairCol: '#7a4a26', top: '#3f7a3a', pants: '#6a4a30', cap: true, capCol: '#efe6d2' },
    team: [mon(3, 36), mon(5, 33), mon(32, 34), mon(59, 30)], box: [mon(10, 12), mon(7, 15)], eggs: [], dex: { seen, caught }
  }, null, 1));
}
const FIXT = { 'old_save_pre_a1.json': readFileSync(fx('old_save_pre_a1.json'), 'utf8'), 'old_save_4orden.json': readFileSync(fx('old_save_4orden.json'), 'utf8') };
const { run } = loadVeyra();
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));

for (const [file, json] of Object.entries(FIXT)) {
  run(`localStorage.setItem('veyra_save_v1',${JSON.stringify(json)})`);
  const before = JSON.parse(json);
  const R = J(`(()=>{const g=loadSave();const o={};
   const sn=()=>JSON.stringify(g);
   migrateKanon(g);const k1=sn();migrateKanon(g);o.kanon=k1===sn();
   migrateSave(g);const s1=sn();migrateSave(g);o.save=s1===sn();
   const f1=JSON.stringify(g.figs);migrateFigures(g);o.figs=f1===JSON.stringify(g.figs);
   const st1=JSON.stringify([g.story,g.flags,g.badges]);migrateStory(g);migrateStory(g);o.story=st1===JSON.stringify([g.story,g.flags,g.badges]);
   o.shape={figs:g.figs,storyCh:g.story&&g.story.ch,mig:g.story&&g.story.mig,body:g.outfit&&g.outfit.body,outfit:!!g.outfit};
   o.badges=g.badges;o.team=g.team.map(m=>m.s);o.box=Array.isArray(g.box)?g.box.flat?g.box.flat().length:0:0;o.money=g.money;o.bag=g.bag;o.name=g.name;o.flags=Object.keys(g.flags).length;o.dexSeen=Object.keys(g.dex.seen).length;o.dexCaught=Object.keys(g.dex.caught).length;
   o.first=storyStep(g.flags)&&storyStep(g.flags).f;o.undef=[...g.team].filter(m=>!MONS[m.s]).length;o.rivals=g.rivals;o.starter=g.starter;o.visited=g.visited;
   G=g;save();const h=loadSave();const a=JSON.stringify(h);migrateSave(h);o.roundtrip=a===JSON.stringify(h);o.afterFigs=h.figs;o.afterBody=h.outfit&&h.outfit.body;return o;})()`);
  t(`${file}: migrateKanon/migrateSave/migrateFigures/migrateStory je 2× → identisch (idempotent)`, () => eq([R.kanon, R.save, R.figs, R.story], [true, true, true, true]));
  t(`${file}: G.figs {met,bond} und G.story (mig=1) angelegt`, () => { if (!R.shape.figs || typeof R.shape.figs.met !== 'object' || typeof R.shape.figs.bond !== 'object') throw new Error(JSON.stringify(R.shape)); if (R.shape.mig !== 1 || typeof R.shape.storyCh !== 'number') throw new Error(JSON.stringify(R.shape)); });
  t(`${file}: Medaillen umbenannt bzw. aus Flags nachgetragen, keine „…orden“-Namen, keine verloren`, () => { if (R.badges.some(b => /orden$/i.test(b))) throw new Error(R.badges.join()); if (R.badges.length < before.badges.length) throw new Error('Medaillen verloren ' + R.badges.length); if (file === 'old_save_4orden.json') eq(R.badges, ['Floramedaille', 'Flutmedaille', 'Frostmedaille', 'Schattenmedaille']); else if (!R.badges.includes('Floramedaille')) throw new Error('Floramedaille aus Flag badge1 nicht nachgetragen: ' + R.badges); });
  t(`${file}: Team, Geld, Tasche, Name, Flags, Dex bleiben erhalten`, () => { eq(R.team.length, before.team.length, 'Team'); eq(R.money, before.money, 'Geld'); eq(R.name, before.name, 'Name'); for (const [k, v] of Object.entries(before.bag)) if (R.bag[k] !== v) throw new Error('Tasche ' + k + ' ' + R.bag[k] + '≠' + v); if (R.flags < Object.keys(before.flags).length) throw new Error('Flags verloren'); eq(R.dexSeen, Object.keys(before.dex.seen).length, 'Dex gesehen'); eq(R.dexCaught, Object.keys(before.dex.caught).length, 'Dex gefangen'); eq(R.undef, 0, 'unbekannte Arten'); });
  t(`${file}: Speichern → Laden → Migrieren ist stabil (Rundlauf)`, () => { if (!R.roundtrip) throw new Error('verändert'); });
  if (file === 'old_save_4orden.json') {
    t('4-Orden-Stand: nächster Schritt ist die neue Böenmedaille, Outfit-Körper aus Frisur (Zopf → Heldin), Rivalen erhalten', () => { eq(R.first, 'badge_boe'); eq(R.shape.body, 'heldin'); eq(R.rivals, { rayan: { starter: 7 }, mira: { starter: 4 } }); });
  } else {
    t('Altstand vor Loop A: Starter/Rivalen abgeleitet, Story-Start (erster Schritt vorhanden)', () => { if (!R.first) throw new Error('kein Schritt'); if (!R.rivals || !R.rivals.rayan) throw new Error('keine Rivalen'); });
  }
}

// ---- neuer Stand wie nach dem Intro
t('Neuer Stand (Intro-Ergebnis) speichern → laden → migrieren: G.figs, G.story, G.outfit.body, Rivalen, Flags unverändert (ganzer Stand identisch)', () => {
  const r = J(`(()=>{G=freshG({name:'Lina',rival:'Rayan',outfit:Object.assign(defaultOutfit(),{body:'heldin',hair:'zopf',cap:true,skin:'#9a6440',top:'#6b4ea0'})});migrateSave(G);G.team.push(mk(7,5));G.starter=7;G.rivals=rivalStartersFig(7);G.flags.starter=1;G.flags.introStarter=1;G.flags.s1_rivalen=1;
   ['veyran','rayan','mira','elowen'].forEach(figMeet);figBond('rayan',12);G.story.ch=2;G.story.help.starter=1;G.story.seen.call_wende=1;G.flags.firstcatch=1;
   const want=JSON.stringify({figs:G.figs,story:G.story,body:G.outfit.body,riv:G.rivals,fl:G.flags,out:G.outfit});save();const h=loadSave();migrateSave(h);const got=JSON.stringify({figs:h.figs,story:h.story,body:h.outfit.body,riv:h.rivals,fl:h.flags,out:h.outfit});
   return{same:want===got,all:JSON.stringify(G)===JSON.stringify(h),met:Object.keys(h.figs.met).sort().join(),bond:h.figs.bond.rayan,body:h.outfit.body,ch:h.story.ch,riv:h.rivals}})()`);
  eq([r.same, r.all, r.met, r.bond, r.body, r.ch], [true, true, 'elowen,mira,rayan,veyran', 12, 'heldin', 2]);
});
t('Defekte neue Felder (figs=null, story=5, outfit.body=„x“) werden repariert statt zu werfen', () => {
  const r = J(`(()=>{const g={map:'route1',team:[],box:[],bag:{},flags:{starter:1},dex:{seen:{},caught:{}},time:480,badges:[],figs:null,story:5,outfit:{body:'x',hair:'wuschel'},dexKanon:1,ver:5};migrateSave(g);return{f:g.figs,s:typeof g.story,b:g.outfit.body}})()`);
  eq([typeof r.f.met, r.s, r.b], ['object', 'object', 'held']);
});

// ---- Browser: beide Altstände über „Fortsetzen“
if (!process.argv.includes('--no-browser')) {
  const { chromium } = await import('playwright'); const { serve } = await import('./art_serve.mjs');
  const S = await serve(); const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [file, json] of Object.entries(FIXT)) {
    const errs = [];
    try {
      const ctx = await browser.newContext({ viewport: { width: 860, height: 400 }, serviceWorkers: 'block' }); const p = await ctx.newPage();
      p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
      await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
      await p.addInitScript(j => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('veyra_save_v1', j); sessionStorage.setItem('__seeded', '1'); } } catch (e) { } }, json);
      await p.goto(S.url + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
      for (const sel of ['#iPrompt', '#iSkip']) { try { await p.click(sel, { timeout: 2500 }); await p.waitForTimeout(500); } catch (e) { } }
      await p.waitForSelector('#tCont:not([hidden])', { timeout: 15000 }); await p.click('#tCont'); await p.waitForTimeout(2000);
      const B = await p.evaluate(() => ({ mode, badges: G.badges.slice(), hud: document.querySelector('#hudBadges').textContent, figs: !!G.figs && typeof G.figs.met === 'object', story: !!G.story && G.story.mig === 1, q: (QUESTS.find(q => !G.flags[q.f]) || {}).title, body: G.outfit && G.outfit.body, team: G.team.map(m => m.s), step: (storyStep() || {}).f }));
      t(`Browser ${file}: Fortsetzen → Welt, G.figs/G.story/outfit.body vorhanden, keine „…orden“`, () => { if (!['world', 'dialog'].includes(B.mode) || !B.figs || !B.story || !['held', 'heldin'].includes(B.body) || B.badges.some(b => /orden$/i.test(b))) throw new Error(JSON.stringify(B)); });
      if (file === 'old_save_4orden.json') t('Browser 4-Orden-Stand: HUD „4/8 Medaillen“, Mission = Böenmedaille-Schritt, Team unverändert', () => eq([B.hud, B.step, B.team], ['4/8 Medaillen', 'badge_boe', [3, 5, 32, 59]]));
      // Menü Missionen öffnen: kein Fehler, Kapitelliste da
      await p.evaluate(() => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } mode = 'world'; openMenu('quest'); }); await p.waitForTimeout(800);
      const chap = await p.evaluate(() => document.querySelectorAll('#menu .stch').length);
      t(`Browser ${file}: Missionsseite zeigt Kapitel (${chap}) und keine Seitenfehler`, () => { if (chap < 3) throw new Error('Kapitel ' + chap); if (errs.length) throw new Error(errs.slice(0, 3).join(' | ')); });
      await ctx.close();
    } catch (e) { bad++; console.log('✗ Browser', file, '–', e.message); }
  }
  await browser.close(); S.close();
}
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`); process.exit(bad ? 1 : 0);
