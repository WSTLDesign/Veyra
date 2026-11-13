// Spielstand-Sicherheitsnetz (src/48-savesafe.js, docs/spielstand.md) ohne Browser:  node test/unit_savesafe.mjs
// Prüft: Migration mit Sicherung (_bak_<version>, letzte 3, nie kleiner überschreiben), Schreibschutz (leer/ungültig), anderes Spiel → Sicherung,
// kaputter Stand → Sicherung/IndexedDB/Hinweis (kein stilles Neues Spiel), Import-Prüfung (JSON, VEYRA0/VEYRA1-Code, abgeschnitten), IndexedDB-Spiegel per Stub,
// persist() nur einmal, Neustart löscht Spiegel, Attacken-Umbenennung Flammenrad → Glutwirbel, Medaillen-Texte.
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync } from 'fs';
const { ctx, run } = loadVeyra();
let ok = 0, bad = 0;
const t = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
const RAW = readFileSync(new URL('./fixtures/old_save_4orden.json', import.meta.url), 'utf8');
const RAW2 = readFileSync(new URL('./fixtures/old_save_pre_a1.json', import.meta.url), 'utf8');
// Browser-Bausteine, die der VM-Stub nicht hat
Object.assign(ctx, { TextEncoder, TextDecoder, btoa, atob, Blob, Response, CompressionStream, DecompressionStream });
// IndexedDB-Stub (asynchron über Microtasks, wie im Browser)
function fakeIDB() {
  const dbs = {}; const later = f => Promise.resolve().then(f);
  return { dbs, open(name) { const rq = {}; later(() => { const up = !dbs[name]; if (up) dbs[name] = {}; const D = dbs[name];
    const db = { createObjectStore(s) { D[s] = new Map(); }, transaction(s) { const st = D[s], tx = {}; const op = f => { const r = {}; later(() => { r.result = f(); r.onsuccess && r.onsuccess(); later(() => tx.oncomplete && tx.oncomplete()); }); return r; };
      tx.objectStore = () => ({ get: k => op(() => st.has(k) ? structuredClone(st.get(k)) : undefined), put: (v, k) => op(() => { st.set(k, structuredClone(v)); }), delete: k => op(() => { st.delete(k); }) }); return tx; } };
    rq.result = db; if (up && rq.onupgradeneeded) rq.onupgradeneeded(); rq.onsuccess && rq.onsuccess(); }); return rq; } };
}
const IDB = fakeIDB(); ctx.indexedDB = IDB;
let persistN = 0; ctx.navigator = { storage: { persist() { persistN++; return Promise.resolve(true); }, persisted: () => Promise.resolve(true) }, clipboard: null, userAgent: 'node' };
const LS = () => J(`(()=>{const o={};const s=localStorage;for(const k of ['veyra_save_v1','veyra_save_v1_bak_list','veyra_save_v1_kaputt'])o[k]=s.getItem(k);return o})()`);
const reset = () => run(`(()=>{for(const k of Object.keys(globalThis.__lsKeys||{}))localStorage.removeItem(k);const L=saveBackups();L.forEach(e=>localStorage.removeItem(e.k));['veyra_save_v1','veyra_save_v1_bak_list','veyra_save_v1_kaputt','veyra_persist'].forEach(k=>localStorage.removeItem(k));SS_=null;G=null;})()`);
run(`globalThis.__raw=${JSON.stringify(RAW)};globalThis.__raw2=${JSON.stringify(RAW2)};`);

await t('Grundlagen: SAVE_VERSION ≥ 1, leerer Speicher → loadSave() null, kein Hinweis, Fortsetzen startet kein stilles Neues Spiel nur ohne Altstand', () => {
  reset(); const r = J(`[SAVE_VERSION,loadSave(),saveMissing(),typeof saveWrite,typeof saveRead,typeof saveWipe]`);
  if (!(r[0] >= 1) || r[1] !== null || r[2] !== false || r[3] !== 'function' || r[4] !== 'function' || r[5] !== 'function') throw new Error(JSON.stringify(r)); });

await t('Migration mit Sicherung: alter Stand (ohne saveVersion) → _bak_0 = Rohstand, danach saveVersion/gid gesetzt, keine zweite Sicherung', () => {
  reset(); run(`localStorage.setItem(SAVEKEY,__raw);G=loadSave();migrateSave(G);globalThis.__g1={sv:G.saveVersion,gid:G.gid};migrateSave(G);`);
  const r = J(`({bak:localStorage.getItem(SAVEKEY+'_bak_0'),list:saveBackups().map(e=>e.k),g:__g1,team:G.team.length})`);
  if (!r.bak || JSON.stringify(JSON.parse(r.bak)) !== JSON.stringify(JSON.parse(RAW))) throw new Error('Sicherung ≠ Rohstand');
  if (r.list.length !== 1 || r.list[0] !== 'veyra_save_v1_bak_0') throw new Error('Liste ' + r.list);
  if (r.g.sv !== J('SAVE_VERSION') || !r.g.gid || !r.team) throw new Error(JSON.stringify(r.g)); });

await t('Migration bei App-Update (gleiche saveVersion, andere appVer) sichert ebenfalls; neues Spiel (freshG) sichert nichts', () => {
  reset(); run(`ssAppVer=()=>'0.9.1';G=JSON.parse(__raw);G.saveVersion=SAVE_VERSION;G.appVer='0.9.0';migrateSave(G);globalThis.__k=saveBackups().map(e=>e.k);G=freshG({});migrateSave(G);ssAppVer=()=>'';`);
  const k = J('__k'), n = J('saveBackups().length'), av = J('G.appVer');
  if (k.length !== 1 || !/_bak_1_0\.9\.0$/.test(k[0]) || n !== 1 || av !== '0.9.1') throw new Error(JSON.stringify({ k, n, av })); });

await t('Sicherungen: nur die letzten 3 bleiben; nie mit kleinerem oder ungültigem Stand überschreiben', () => {
  reset(); const r = J(`(()=>{const big=__raw,small=JSON.stringify(Object.assign(JSON.parse(__raw),{team:[],box:[]}));
   const a=['a','b','c','d','e'].map(x=>saveBackup(x,big,'test'));const keys=saveBackups().map(e=>e.k);const gone=localStorage.getItem(SAVEKEY+'_bak_a');
   const s1=saveBackup('e',small,'kleiner'),still=localStorage.getItem(SAVEKEY+'_bak_e')===big,s2=saveBackup('f','{}'),s3=saveBackup('g',''),s4=saveBackup('h','{"map":1');
   return{a,keys,gone,s1,still,s2,s3,s4}})()`);
  if (r.keys.join() !== ['c', 'd', 'e'].map(x => 'veyra_save_v1_bak_' + x).join() || r.gone !== null) throw new Error('Rotation ' + r.keys);
  if (r.s1 !== false || !r.still || r.s2 || r.s3 || r.s4) throw new Error(JSON.stringify(r)); });

await t('Schreibschutz: G leer/ungültig/null → saveWrite false, Spielstand unverändert; save() aus 15-ui nutzt den Schutz', () => {
  reset(); run(`localStorage.setItem(SAVEKEY,__raw);`);
  const r = J(`(()=>{const o=[];G={};o.push(saveWrite(JSON.stringify(G)));G=null;o.push(saveWrite('null'));G={map:'x',team:'kaputt',flags:{},dex:{}};o.push(saveWrite(JSON.stringify(G)));save();o.push(localStorage.getItem(SAVEKEY)===__raw);
   G=JSON.parse(__raw);o.push(saveWrite('{}'));o.push(localStorage.getItem(SAVEKEY)===__raw);return o})()`);
  if (r.join() !== 'false,false,false,true,false,true') throw new Error(r.join()); });

await t('Anderes Spiel überschreibt alten Stand → alter Stand als _bak_alt gesichert; gleiches Spiel → keine Sicherung', () => {
  reset(); run(`G=JSON.parse(__raw);migrateSave(G);globalThis.__a=JSON.stringify(G);localStorage.setItem(SAVEKEY,__a);saveBackups().forEach(e=>localStorage.removeItem(e.k));localStorage.removeItem(SAVEKEY+'_bak_list');`);
  const r = J(`(()=>{G.money=(G.money|0)+5;const same=saveWrite(JSON.stringify(G)),n1=saveBackups().length;G=freshG({name:'Neu'});migrateSave(G);G.team=[mk(1,5)];const w=saveWrite(JSON.stringify(G));
   const alt=localStorage.getItem(SAVEKEY+'_bak_alt');return{same,n1,w,alt:alt&&JSON.parse(alt).gid===JSON.parse(__a).gid,now:JSON.parse(localStorage.getItem(SAVEKEY)).name}})()`);
  if (!r.same || r.n1 !== 0 || !r.w || !r.alt || r.now !== 'Neu') throw new Error(JSON.stringify(r)); });

await t('Kaputter Spielstand (JSON-Fehler) → jüngste Sicherung wird geladen und zurückgeschrieben, Rohstand bleibt in _kaputt, Hinweis „bak“', () => {
  reset(); run(`saveBackup('0',__raw,'test');localStorage.setItem(SAVEKEY,'{"map":"route1","team":[{"s":1,');`);
  const r = J(`(()=>{const g=loadSave();return{ok:!!g&&g.map===JSON.parse(__raw).map,back:localStorage.getItem(SAVEKEY)===__raw,broken:localStorage.getItem(SAVEKEY+'_kaputt'),note:SS_.notice&&SS_.notice.k}})()`);
  if (!r.ok || !r.back || !/^\{"map":"route1"/.test(r.broken || '') || r.note !== 'bak') throw new Error(JSON.stringify(r)); });

await t('Kaputt ohne Sicherung → loadSave() null, Hinweis „broken“, Fortsetzen zeigt Hinweis statt stillem Neuen Spiel', () => {
  reset(); run(`localStorage.setItem(SAVEKEY,'nicht-json-'+'x'.repeat(40));globalThis.__ng=0;newGame=()=>{__ng++;};`);
  const r = J(`(()=>{const g=loadSave(),n=SS_.notice&&SS_.notice.k;cont();return{g,n,ng:__ng,kept:localStorage.getItem(SAVEKEY+'_kaputt')!==null,raw:localStorage.getItem(SAVEKEY)!==null}})()`);
  if (r.g !== null || r.n !== 'broken' || r.ng !== 0 || !r.kept || !r.raw) throw new Error(JSON.stringify(r)); });

await t('IndexedDB-Spiegel: Speichern spiegelt (Stub), leerer localStorage → saveBoot holt Stand aus IndexedDB; persist() genau einmal', async () => {
  reset(); persistN = 0; run(`SS_=null;G=JSON.parse(__raw);migrateSave(G);globalThis.__w1=saveWrite(JSON.stringify(G));G.money=7;globalThis.__w2=saveWrite(JSON.stringify(G));`);
  await run('SS_.mirrorP'); const m = IDB.dbs.veyra_save && IDB.dbs.veyra_save.kv.get('veyra_save_v1');
  if (!J('__w1') || !J('__w2') || !m || JSON.parse(m.raw).money !== 7) throw new Error('Spiegel fehlt');
  if (persistN !== 1) throw new Error('persist ' + persistN);
  run(`localStorage.removeItem(SAVEKEY);SS_.notice=null;`); const res = await run('saveBoot()');
  const r = J(`({m:JSON.parse(localStorage.getItem(SAVEKEY)||'null'),n:SS_.notice&&SS_.notice.k})`);
  if (res !== 'idb' || !r.m || r.m.money !== 7 || r.n !== 'idb') throw new Error(JSON.stringify({ res, r })); });

await t('IndexedDB: kaputter localStorage + gültiger Spiegel → Spiegel gewinnt, kaputter Rohstand bleibt erhalten; IndexedDB-Fehler still', async () => {
  run(`localStorage.setItem(SAVEKEY,'{kaputt');SS_.notice=null;`); const res = await run('saveBoot()');
  const r = J(`({ok:!!ssParse(localStorage.getItem(SAVEKEY)),br:localStorage.getItem(SAVEKEY+'_kaputt')})`);
  if (res !== 'idb' || !r.ok || r.br !== '{kaputt') throw new Error(JSON.stringify({ res, r }));
  ctx.indexedDB = { open() { throw new Error('gesperrt'); } }; run('SS_.dbp=null'); const v = await run(`ssMirror(localStorage.getItem(SAVEKEY))`); ctx.indexedDB = IDB; run('SS_.dbp=null');
  if (v !== false) throw new Error('Fehler nicht still: ' + v); });

await t('Neu starten (saveWipe): alter Stand als _bak_neustart gesichert, Spiegel gelöscht → kein Wiederauferstehen beim nächsten Start', async () => {
  run(`SS_.dbp=null;G=JSON.parse(__raw);migrateSave(G);saveWrite(JSON.stringify(G));`); await run('SS_.mirrorP'); await run('saveWipe()');
  const res = await run('saveBoot()'); const r = J(`({s:localStorage.getItem(SAVEKEY),b:!!localStorage.getItem(SAVEKEY+'_bak_neustart')})`);
  if (res !== 'leer' || r.s !== null || !r.b) throw new Error(JSON.stringify({ res, r })); });

await t('Import-Prüfung: leer, Fremdtext, fremdes JSON, abgeschnittener Code → kindgerechte Meldung; JSON und Code (VEYRA0/VEYRA1) gültig', async () => {
  const dec = async s => JSON.parse(JSON.stringify(await run(`saveDecode(${JSON.stringify(s)})`)));
  const e1 = await dec(''), e2 = await dec('hallo welt'), e3 = await dec('{"a":1}'), e4 = await dec('{"map":"x"');
  for (const e of [e1, e2, e3, e4]) if (!e.err || e.err.length > 90) throw new Error('Meldung ' + JSON.stringify(e));
  const j = await dec(RAW); if (j.err || j.g.name !== JSON.parse(RAW).name) throw new Error('JSON ' + j.err);
  const c1 = await run('saveCode(__raw2)'); if (!/^VEYRA1\./.test(c1)) throw new Error('kein VEYRA1: ' + c1.slice(0, 12));
  const d1 = await dec(c1); if (d1.err || JSON.stringify(d1.g) !== JSON.stringify(JSON.parse(RAW2))) throw new Error('VEYRA1 Rundweg ' + d1.err);
  const cut = await dec(c1.slice(0, Math.floor(c1.length * .6))); if (!cut.err) throw new Error('abgeschnitten nicht erkannt');
  const spaced = await dec(c1.replace(/(.{40})/g, '$1\n ')); if (spaced.err) throw new Error('Umbrüche ' + spaced.err);
  const zip = ctx.CompressionStream; ctx.CompressionStream = undefined; const c0 = await run('saveCode(__raw2)'); ctx.CompressionStream = zip;
  const d0 = await dec(c0); if (!/^VEYRA0\./.test(c0) || d0.err || d0.g.name !== JSON.parse(RAW2).name) throw new Error('VEYRA0 ' + c0.slice(0, 10));
  console.log('   Code-Länge ' + c1.length + ' Zeichen (deflate) · ' + c0.length + ' (ohne) · Rohstand ' + RAW2.length); });

await t('Import anwenden (saveImport): aktueller Stand vorher als _bak_vorimport gesichert, ungültiger Import schreibt nichts', () => {
  reset(); run(`localStorage.setItem(SAVEKEY,__raw);`);
  const r = J(`(()=>{const a=saveImport('{"map":"x"}'),k1=localStorage.getItem(SAVEKEY)===__raw,b=saveImport(__raw2),now=localStorage.getItem(SAVEKEY)===__raw2,bak=localStorage.getItem(SAVEKEY+'_bak_vorimport')===__raw;return{a,k1,b,now,bak}})()`);
  if (r.a !== false || !r.k1 || !r.b || !r.now || !r.bak) throw new Error(JSON.stringify(r)); });

await t('Recht/Kanon: Flammenrad heißt Glutwirbel (Daten, Rolle, Lernlisten); alter Spielstand wird umgeschrieben (Team/Box/Tasche/Flag)', () => {
  reset(); const r = J(`(()=>{const g=JSON.parse(__raw);g.team[0].moves.push({id:'flammenrad',pp:3});g.team[0].known.push('flammenrad');g.box=[[{s:1,l:30,xp:1,hp:1,moves:[{id:'flammenrad',pp:1}],known:['flammenrad']}]];
   g.bag.rolle_flammenrad=1;g.flags.sc_flammenrad=1;g.foundItems=['sc_flammenrad'];migrateSave(g);const box=(g.box||[]).flat(2).filter(Boolean);
   return{mv:!!MOVES.glutwirbel&&MOVES.glutwirbel[0],old:!!MOVES.flammenrad,item:ITEMS.rolle_glutwirbel&&ITEMS.rolle_glutwirbel.n,t0:g.team[0].moves.map(m=>m.id),k0:g.team[0].known,box:box.map(m=>m.moves.map(x=>x.id).join()+'|'+m.known.join()),bag:[g.bag.rolle_glutwirbel,g.bag.rolle_flammenrad],fl:[g.flags.sc_glutwirbel,g.flags.sc_flammenrad],fi:g.foundItems}})()`);
  if (r.mv !== 'Glutwirbel' || r.old || r.item !== 'Rolle: Glutwirbel') throw new Error(JSON.stringify(r));
  if (!r.t0.includes('glutwirbel') || r.t0.includes('flammenrad') || !r.k0.includes('glutwirbel') || r.k0.includes('flammenrad')) throw new Error('Team ' + JSON.stringify(r));
  if (!r.box.length || /flammenrad/.test(r.box.join()) || r.bag[0] !== 1 || r.bag[1] != null || r.fl[0] !== 1 || r.fl[1] != null || r.fi.join() !== 'sc_glutwirbel') throw new Error(JSON.stringify(r)); });

await t('Texte: Feldattacken nennen Medaillen statt Orden (FIELD_MOVES.medal ∈ MEDALS, keine „…orden“-Toasts in 17-move.js)', () => {
  const r = J(`({m:Object.values(FIELD_MOVES).map(f=>f.medal).filter(Boolean),M:MEDALS.map(x=>x[0])})`);
  const src = readFileSync(new URL('../src/17-move.js', import.meta.url), 'utf8');
  if (!r.m.length || !r.m.every(x => r.M.includes(x)) || /(Wellen|Gletscher|Mond)orden/.test(src)) throw new Error(JSON.stringify(r)); });

console.log(`\n${ok} ✓ / ${bad} ✗`); process.exit(bad ? 1 : 0);
