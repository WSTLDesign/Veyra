// QA Loop A3 – Prüfung 3: Save-Migration alt (vor Dex-Kanon, IDs 1–41) → Kanon.   node test/unit_migration.mjs
// Teil A (VM, ohne Browser): alter Spielstand als JSON → localStorage → loadSave() → migrateSave() → Prüfungen.
// Teil B (Browser, Playwright + test/art_serve.mjs): derselbe Spielstand im echten Spiel über „Fortsetzen“ laden, Team/Dex prüfen, Screenshots.
// Erwartete Zuordnung wird aus docs/dex-kanon.md (Abschnitt ID_MAP) gelesen, nicht aus dem Code (unabhängige Gegenprobe).
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); };

// ---- erwartete Zuordnung aus der Doku
const doc = readFileSync(new URL('../docs/dex-kanon.md', import.meta.url), 'utf8');
const line = doc.split('\n').find(l => /^1→001 · 2→002/.test(l));
const EXP = Object.fromEntries(line.split('·').map(s => s.trim().split('→').map(Number)));
const OLD_NAMES = { 1: 'Glimmo', 4: 'Tröpfli', 7: 'Keimling', 10: 'Pieplo', 14: 'Funkfell', 20: 'Schemmo', 28: 'Solaryn', 41: 'Astramahr' };
const NEW_NAMES = { 1: 'Funki', 4: 'Plippi', 7: 'Knospi', 10: 'Flausch', 14: 'Knips', 20: 'Dumbi', 28: 'Ignivar', 41: 'Mondoro' };

// ---- alter Spielstand (Format vor A1: ver 3, ohne dexKanon/rivals/starter, Box = flache Liste, Kreaturen ohne iv/nature teils)
const mon = (s, l, extra) => Object.assign({ s, l, xp: l * l * l, hp: 20 + l * 3, moves: [{ id: 'kratzer', pp: 25 }, { id: 'knurren', pp: 30 }], known: ['kratzer', 'knurren'] }, extra || {});
const seen = {}, caught = {};
for (let i = 1; i <= 41; i++) { seen[i] = 1; if (i % 2) caught[i] = 1; }
const OLD = {
  map: 'route1', mods: {}, bag: { kapsel: 7, trank: 3 }, money: 2400, flags: { starter: 1, rival1: 1, badge1: 1 }, time: 13 * 60, badges: ['a'],
  ret: { map: 'kupferhain', x: 5, y: 10 }, respawn: { map: 'kupferhain', x: 5, y: 10 }, px: 8, py: 12, name: 'Noa', rival: 'Lio', outfit: {}, visited: { morgenau: 1, route1: 1 }, known2: {},
  ver: 3,
  team: [mon(1, 12, { nickname: 'Funki-Alt', nature: 'kernig', iv: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 }, shiny: true }), mon(4, 9), mon(7, 8), mon(20, 14, { hp: 1 })],
  box: [mon(10, 10), mon(28, 45), mon(41, 40), mon(14, 16), mon(33, 20), mon(18, 15), mon(39, 22), mon(24, 18), mon(36, 25), mon(12, 7), mon(2, 30), mon(3, 50)],
  eggs: [{ s: 12, l: 1, eggSteps: 200 }, { s: 26, l: 1, eggSteps: 300 }],
  dex: { seen, caught }, dexNew: { 1: 1, 10: 1, 41: 1 }, shinyChain: { s: 20, n: 3 },
};
mkdirSync(new URL('./fixtures/', import.meta.url), { recursive: true });
writeFileSync(new URL('./fixtures/old_save_pre_a1.json', import.meta.url), JSON.stringify(OLD, null, 1));
const oldJson = JSON.stringify(OLD);

// ---- Teil A: VM
run(`localStorage.setItem(SAVEKEY, ${JSON.stringify(oldJson)});`);
const R = JSON.parse(run(`(()=>{const g=loadSave();const had=!!g.dexKanon;migrateSave(g);const a=JSON.stringify(g);migrateSave(g);const again=JSON.stringify(g);
 const all=[...g.team,...boxAll(g)];G=g;
 return JSON.stringify({had,team:g.team.map(m=>m.s),names:g.team.map(m=>MONS[m.s]&&MONS[m.s].n),box:boxAll(g).map(m=>m.s),eggs:g.eggs.map(m=>m.s),seen:Object.keys(g.dex.seen).map(Number).sort((a,b)=>a-b),caught:Object.keys(g.dex.caught).map(Number).sort((a,b)=>a-b),
 dexNew:Object.keys(g.dexNew).map(Number).sort((a,b)=>a-b),sc:g.shinyChain,starter:g.starter,rivals:g.rivals,k:g.dexKanon,ver:g.ver,idem:a===again,
 undef:all.filter(m=>!MONS[m.s]).length,badMove:all.flatMap(m=>[...m.moves.map(x=>x.id),...m.known]).filter(id=>!MOVES[id]).length,
 hp:all.map(m=>[m.s,m.hp,stat(m,'hp')]),lv:all.map(m=>m.l),ab:all.map(m=>[m.ability,!!ABIL[m.ability]]),nat:all.map(m=>m.nature),iv:all.map(m=>m.iv&&Object.keys(m.iv).length),
 nick:g.team[0].nickname,shiny:g.team[0].shiny,natKept:g.team[0].nature,ivKept:g.team[0].iv.hp,
 boxShape:[g.box.length,g.box[0].length],boxNames:g.boxNames.length,medals:typeof g.medals,
 caughtN:Object.keys(g.dex.caught).length,seenN:Object.keys(g.dex.seen).length,dexFrac:dexFrac()})})()`));

t('ID_MAP im Code = ID_MAP laut docs/dex-kanon.md (41 Einträge)', () => { const code = JSON.parse(run('JSON.stringify(ID_MAP)')); eq(code, Object.fromEntries(Object.entries(EXP).map(([k, v]) => [k, v])), 'ID_MAP'); eq(Object.keys(EXP).length, 41); });
t('Alter Spielstand hat kein dexKanon (echter Altstand), wird geladen', () => { if (R.had) throw new Error('Fixture hat dexKanon'); if (!R.team.length) throw new Error('leer'); });
t('Team: alle IDs auf Kanon umgemappt (1,4,7,20 → 001,004,007,031)', () => eq(R.team, [1, 4, 7, 20].map(x => EXP[x])));
t('Team-Namen neu: Funki, Plippi, Knospi, Dumbi', () => eq(R.names, ['Funki', 'Plippi', 'Knospi', 'Dumbi']));
t('Box: alle Einträge umgemappt', () => eq(R.box.slice().sort((a, b) => a - b), [10, 28, 41, 14, 33, 18, 39, 24, 36, 12, 2, 3].map(x => EXP[x]).sort((a, b) => a - b)));
t('Eier umgemappt', () => eq(R.eggs, [12, 26].map(x => EXP[x])));
t('Dex gesehen/gefangen: Schlüssel umgemappt, Zähler unverändert (41 / 21)', () => { eq(R.seen, Object.values(EXP).sort((a, b) => a - b), 'seen'); eq(R.caught, Object.keys(caught).map(k => EXP[k]).sort((a, b) => a - b), 'caught'); eq([R.seenN, R.caughtN], [41, 21]); });
t('Dex-Anteil (caught/153) korrekt', () => { if (Math.abs(R.dexFrac - 21 / 153) > 1e-9) throw new Error(R.dexFrac); });
t('dexNew + Glanz-Serie umgemappt (20 → 031)', () => { eq(R.dexNew, [1, 10, 41].map(x => EXP[x]).sort((a, b) => a - b)); eq(R.sc, { s: EXP[20], n: 3 }); });
t('Keine undefinierten Arten, keine ungültigen Attacken', () => { eq([R.undef, R.badMove], [0, 0]); });
t('Level, Wesenszug, Anlage-Werte, Glanz, Spitzname bleiben erhalten', () => { eq(R.lv.slice(0, 4), [12, 9, 8, 14]); eq([R.nick, R.shiny, R.natKept, R.ivKept], ['Funki-Alt', true, 'kernig', 20]); });
t('Fehlende Felder ergänzt (iv 6 Werte, Fähigkeit gültig, Wesenszug vorhanden)', () => { if (R.iv.some(n => n !== 6)) throw new Error('iv'); if (R.ab.some(([a, v]) => !v)) throw new Error('ability ' + JSON.stringify(R.ab.filter(x => !x[1]))); if (R.nat.some(n => !n)) throw new Error('nature'); });
t('KP nach Umstellung gültig (0 < hp ≤ Max, außer unverändert 1)', () => { const b = R.hp.filter(([s, hp, mx]) => hp > mx || hp < 1); if (b.length) throw new Error(JSON.stringify(b)); });
t('Starter + Rivalen aus Team abgeleitet (Funki → Rayan 007, Mira 004)', () => eq([R.starter, R.rivals.rayan.starter, R.rivals.mira.starter], [1, 7, 4]));
t('Flags dexKanon=1, ver ≥ 4, Box 20×30, Boxnamen, Medaillen', () => { eq([R.k, R.ver >= 4, R.boxShape, R.boxNames >= 20, R.medals], [1, true, [20, 30], true, 'object']); });
t('Idempotent: zweites migrateSave ändert nichts', () => { if (!R.idem) throw new Error('verändert'); });
t('Speichern/Laden-Rundlauf: save() → loadSave() → migrateSave() stabil', () => { const r = JSON.parse(run(`(()=>{const g=loadSave();migrateSave(g);G=g;save();const h=loadSave();const a=JSON.stringify(h);migrateSave(h);return JSON.stringify({same:a===JSON.stringify(h),k:h.dexKanon,t:h.team.map(m=>m.s)})})()`)); eq([r.same, r.k, r.t], [true, 1, R.team]); });
t('Neuer Spielstand (freshG) wird nicht umgemappt', () => { const r = JSON.parse(run(`(()=>{const g=freshG({});g.team.push(mk(10,5));g.dex.seen[10]=1;migrateSave(g);return JSON.stringify([g.team[0].s,Object.keys(g.dex.seen).map(Number)])})()`)); eq(r, [10, [10]]); });
t('Sehr alter Spielstand (ver 1: ohne Box-Format, ohne eggs/medals/dex) lädt ohne Fehler', () => { const r = JSON.parse(run(`(()=>{const g={map:'morgenau',team:[{s:1,l:5,xp:125,hp:20,moves:[{id:'kratzer',pp:25}],known:['kratzer']}],box:[{s:7,l:3,xp:27,hp:10,moves:[],known:[]}],bag:{},flags:{},dex:{seen:{1:1},caught:{}},time:480,badges:[]};migrateSave(g);return JSON.stringify({t:g.team[0].s,b:boxAll(g).map(m=>m.s),k:g.dexKanon,shape:g.box.length})})()`)); eq(r, { t: 1, b: [7], k: 1, shape: 20 }); });
t('Defekter Eintrag (unbekannte Art 999, null im Team) wird ausgefiltert statt zu crashen', () => { const r = JSON.parse(run(`(()=>{const g={map:'morgenau',team:[null,{s:999,l:5,xp:1,hp:1,moves:[],known:[]},{s:4,l:5,xp:125,hp:20,moves:[],known:[]}],box:[],bag:{},flags:{},dex:{seen:{},caught:{}},time:480,badges:[]};migrateSave(g);return JSON.stringify(g.team.map(m=>m.s))})()`)); eq(r, [4]); });
t('Nach dem Laden sind Entwicklungen der umgemappten Arten möglich (Dumbi L18 → Noxli)', () => { const r = JSON.parse(run(`(()=>{const m=mk(31,18);return JSON.stringify([MONS[m.s].ev&&MONS[m.s].ev.l,MONS[MONS[m.s].ev.to].n])})()`)); eq(r, [18, 'Noxli']); });
t('Alle 41 alten IDs: Zielart existiert und trägt sinnvollen Namen (Diff-Liste)', () => { const names = JSON.parse(run(`JSON.stringify(Object.fromEntries(Object.entries(ID_MAP).map(([o,n])=>[o,MONS[n]&&MONS[n].n])))`)); const miss = Object.entries(names).filter(([, n]) => !n); if (miss.length) throw new Error(JSON.stringify(miss)); for (const [o, n] of Object.entries(OLD_NAMES)) if (names[o] !== NEW_NAMES[o]) throw new Error(o + ' ' + names[o]); });

// ---- Teil B: echtes Spiel (Playwright) – optional mit --no-browser überspringen
if (!process.argv.includes('--no-browser')) {
  const { chromium } = await import('playwright');
  const { serve } = await import('./art_serve.mjs');
  const S = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  try {
    const p = await browser.newPage({ viewport: { width: 860, height: 400 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
    await p.addInitScript(j => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('veyra_save_v1', j); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, oldJson);
    await p.goto(S.url + 'index.html', { waitUntil: 'load' });
    await p.waitForTimeout(600);
    // Intro-Aufforderung/Titel: wie smoke.mjs
    for (const sel of ['#iPrompt', '#iSkip']) { try { await p.click(sel, { timeout: 2500 }); await p.waitForTimeout(500); } catch (e) {} }
    await p.waitForSelector('#tCont:not([hidden])', { timeout: 15000 });
    await p.click('#tCont'); await p.waitForTimeout(1500);
    const B = await p.evaluate(() => ({ mode, team: G.team.map(m => m.s), names: G.team.map(m => mname(m)), k: G.dexKanon, seen: Object.keys(G.dex.seen).length, caught: Object.keys(G.dex.caught).length, map: G.map, undef: [...G.team, ...boxAll(G)].filter(m => !MONS[m.s]).length }));
    t('Browser: Fortsetzen lädt Altstand (mode=world, Karte route1)', () => eq([B.mode === 'world' || B.mode === 'dialog', B.map], [true, 'route1']));
    t('Browser: Team = Funki, Plippi, Knospi, Dumbi; dexKanon=1; keine undefinierten Arten', () => eq([B.names, B.k, B.undef], [['Funki', 'Plippi', 'Knospi', 'Dumbi'], 1, 0]));
    t('Browser: Dex-Zähler 41 gesehen / 21 gefangen', () => eq([B.seen, B.caught], [41, 21]));
    await p.evaluate(() => { for (let i = 0; i < 20 && mode === 'dialog'; i++) { TW && TW.finish && TW.finish(); advDlg(); } });
    await p.evaluate(async () => { await preloadArt(); setView('2d', true); openMenu('dex'); }); await p.waitForTimeout(900);
    const dexTxt = await p.evaluate(() => (document.querySelector('.dexhead') || {}).innerText || '');
    t('Browser: Dex zeigt Anteil (14 %)', () => { if (!/14/.test(dexTxt)) throw new Error(JSON.stringify(dexTxt)); });
    await p.screenshot({ path: new URL('./qa_a_migration_dex.png', import.meta.url).pathname });
    await p.evaluate(() => { closeMenu && closeMenu(); openMenu('team'); }); await p.waitForTimeout(900);
    await p.screenshot({ path: new URL('./qa_a_migration_team.png', import.meta.url).pathname });
    t('Browser: kein console.error / pageerror beim Laden', () => { const e = errs.filter(x => !/Failed to load resource|favicon|net::ERR/.test(x)); if (e.length) throw new Error(e.slice(0, 3).join(' | ')); });
  } catch (e) { bad++; console.log('✗ Browser-Teil –', e.message); }
  await browser.close(); S.close();
}
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
if (bad) { console.log('FEHLER'); process.exit(1); } else console.log('Migration: alle Prüfungen grün.');
