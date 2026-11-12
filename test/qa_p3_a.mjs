// QA Phase 3 (a): Kampfstart-Zeit, Resonanz (Runde/Echtzeit), Doppelkampf (Runde/Echtzeit), Fang bei vollem Team + Glanz, Hinterhalt im Gras – je 3× ohne hängenden Zustand
import { boot, done } from './qa_p2_lib.mjs';
const t = await boot();
const { ev, Wt, ok, p } = t;
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const step = async (n, fn) => { if (ONLY && !ONLY.test(n)) return; const e0 = t.errs.length, f0 = t.fails.length; try { await fn(); } catch (e) { t.fails.push(n + ': ' + e.message); } if (t.errs.length > e0) t.fails.push(n + ' (Konsole): ' + t.errs.slice(e0).join(' | ')); console.log((t.fails.length > f0 ? '✗ ' : '✓ ') + n); };
const clean = async (want = 'world') => { const s = await ev(`({mode,B:!!B,busy:B&&B.busy,card:!$('#bCard').hidden,seq:!$('#seqL').hidden,call:!$('#callOv').hidden,bat:!$('#battle').hidden,ov:document.querySelectorAll('.evoOv,.healOv,.lvOv,.seqCv').length,cap:!!(B&&B.cap)})`); if (s.B || s.card || s.seq || s.call || s.bat || s.ov || s.cap || s.mode !== want) throw new Error('hängt: ' + JSON.stringify(s)); };
const tapUntil = async (cond, n = 60, ms = 250) => { for (let i = 0; i < n; i++) { if (await ev(cond)) return true; await p.mouse.click(210, 420); await Wt(ms); } return await ev(cond); };
const menuUp = "!!(B&&!B.busy&&document.querySelector('#bMenu').children.length>0)";
const reset = async () => { await ev("if(B)endBattle('run');mode='world';B=null;G.team=[mk(4,25),mk(1,25),mk(10,25)];G.team.forEach(m=>m.hp=stat(m,'hp'));G.bag.kapsel=20;G.bag.trank=5;VILL.list=[];1"); await Wt(150); };
const trainer = (o) => `{name:'Prüfer Alma',flag:'tq_${o.f || 'x'}',pre:'Los!',post:'Gut gekämpft.',money:50,double:${!!o.dbl},team:${JSON.stringify(o.team)}}`;
const fight = async (btlMode, startJs) => { await ev(`SET.btl='${btlMode}';${startJs}`); await p.waitForFunction(() => (typeof B!=="undefined"&&B) && B.rt !== undefined && document.querySelector('#bMenu').children.length > 0 && !B.busy, null, { timeout: 12000, polling: 100 }).catch(() => {}); await tapUntil(menuUp, 40, 200); };

// ---------- Kampfstart-Zeit ----------
const measure = async (js, nb) => { await reset(); await ev(`G.nb=${nb};window.__t0=performance.now();window.__t1=0;window.__iv=setInterval(()=>{if(!window.__t1&&(typeof B!=="undefined"&&B)&&B.rt!==undefined&&document.querySelector('#bMenu').children.length>0&&!B.busy){window.__t1=performance.now();clearInterval(window.__iv);}},16);${js}`);
  await p.waitForFunction(() => window.__t1, null, { timeout: 12000, polling: 50 }).catch(() => {}); const ms = await ev('Math.round(__t1-__t0)'); await ev("clearInterval(window.__iv);if(B)endBattle('run');1"); await Wt(150); return ms; };
await step('Kampfstart-Zeit wild/Trainer', async () => {
  await ev("SET.btl='runde';SET.skipBattleIntro=0;1");
  const w1 = await measure("startBattle({wild:mk(10,8)})", 0), w2 = await measure("startBattle({wild:mk(10,8)})", 0), w3 = await measure("startBattle({wild:mk(10,8)})", 5);
  const t1 = await measure(`startBattle({trainer:${trainer({ team: [[10, 8], [13, 8]] })}})`, 0), t3 = await measure(`startBattle({trainer:${trainer({ team: [[10, 8], [13, 8]] })}})`, 5);
  ok('Kampfstart wild (Kampf 1, lang) [ms]', w1 > 0, { w1, w2, w3, trainer_lang: t1, trainer_kurz: t3 });
  // Geplant aus Code: Icon 300 + Freeze 260 + Wipe 420 + Meldung 650 (wild) ; kurz: 220 + 650
  console.log('   gemessen wild lang', w1, 'wild kurz', w3, 'Trainer lang', t1, 'Trainer kurz', t3);
  t.timing = { w1, w2, w3, t1, t3 };
});

// ---------- Resonanz ----------
const resRound = async (btlMode, r) => {
  await reset(); await fight(btlMode, "startBattle({wild:mk(10,12)})");
  await ev("B.foe[0].hp=stat(B.foe[0],'hp');B.res.me=1;B.g.me=1;B.g.foe=0;bTick&&bTick();1");
  const before = await ev("({dis:$('#resBtn').disabled})"); if (before.dis) { await ev("showMain&&(B.rt?showRT():showMain());1"); }
  await ev("$('#resBtn').disabled=false;$('#resBtn').click();1"); await Wt(300);
  const s = await ev("({on:!!B.resOn.me,aura:!!B.aura,turns:B.resOn.me&&B.resOn.me.turns,res:B.res.me,until:B.resOn.me&&B.resOn.me.until-Date.now(),rt:B.rt})");
  if (!s.on || !s.aura) throw new Error('Resonanz nicht aktiv ' + JSON.stringify(s)); if (s.res !== 0) throw new Error('Ladung nicht verbraucht');
  if (btlMode === 'echtzeit') { if (!(s.until > 6500 && s.until <= 8000)) throw new Error('8 s erwartet, until=' + s.until); await ev("B.resOn.me.until=Date.now()+300;1"); await Wt(500); if (await ev("!!resActive(B,'me',G.team[B.mi])")) throw new Error('läuft nicht ab'); }
  else { if (s.turns !== 3) throw new Error('3 Züge erwartet ' + s.turns); await ev("B.foe[0].hp=99999;for(let i=0;i<3;i++)endOfTurn(B);1"); if (await ev("!!resActive(B,'me',G.team[B.mi])")) throw new Error('läuft nicht ab'); }
  // zweiter Einsatz ohne Ladung nicht möglich
  const again = await ev("useResonance('me')"); if (again) throw new Error('zweiter Einsatz ohne Ladung');
  await ev("endBattle('run')"); await clean();
};
for (const m of ['runde']) for (let r = 0; r < 3; r++) await step(`Resonanz ${m} #${r + 1}`, () => resRound(m, r));

// ---------- Doppelkampf ----------
const dbl = async (btlMode, r) => {
  await reset(); await ev("G.team=[mk(4,30),mk(1,30),mk(10,30)];G.team.forEach(m=>m.hp=stat(m,'hp'));const pk=(ts)=>Object.keys(MOVES).find(k=>MOVES[k][2]>=40&&MOVES[k][6]!=='status'&&!/area/.test(MOVES[k][5]||'')&&MOVES[k][3]>=100&&ts.every(t=>eff(MOVES[k][1],MONS[t].t)>0));const sg=pk([10,13,2]);window.__sg=sg;G.team[0].moves=[{id:'wellen',pp:20},{id:sg,pp:20}];G.team[1].moves=[{id:sg,pp:20},{id:sg,pp:20}];1");
  await fight(btlMode, `startBattle({trainer:${trainer({ f: 'dbl' + r, dbl: true, team: [[10, 8], [13, 8], [2, 8]] })}})`);
  const s = await ev("({d:B.double,f:B.foes.length,m:B.mine.length,chip:document.querySelectorAll('#bFoeT .sc[title=Partner],#bMeT .sc[title=Partner]').length})");
  if (!s.d || s.f !== 2 || s.m !== 2) throw new Error('kein Doppelkampf ' + JSON.stringify(s));
  if (btlMode === 'echtzeit') await ev("B.g.me=1;B.g.foe=0;B.rtT=-99;1");
  // Zielwahl über UI: Rempler (nicht Fläche) → Zielkarten
  if (btlMode === 'runde') { await ev("document.querySelector('#bMenu .big.k1').click()"); await Wt(100); }
  const mvs = await ev("[...document.querySelectorAll('#bMenu .mv')].map(b=>b.dataset.i)");
  await ev("[...document.querySelectorAll('#bMenu .mv')].find(b=>b.dataset.i==='1').click()"); await Wt(150);
  const tg = await ev("[...document.querySelectorAll('#bMenu .tgt')].length"); if (tg !== 2) throw new Error('Zielwahl: ' + tg + ' Karten (mvs ' + mvs + ')');
  await ev("B.foes[1].hp=1;B.foes[0].hp=B.foes[0].hp;document.querySelectorAll('#bMenu .tgt')[1].click()"); await Wt(100);
  if (btlMode === 'runde') {
    // zweites Mitglied: Fläche (Wellen gehört Slot 0) → Partner nimmt Funken auf Ziel 0
    await tapUntil("!!document.querySelector('#bMenu .big.k1')", 20, 200); await ev("document.querySelector('#bMenu .big.k1').click()"); await Wt(100);
    await ev("[...document.querySelectorAll('#bMenu .mv')].find(b=>b.dataset.i==='0').click()"); await Wt(150);
    if (await ev("document.querySelectorAll('#bMenu .tgt').length") === 2) await ev("document.querySelectorAll('#bMenu .tgt')[0].click()");
  }
  await tapUntil(menuUp + "||!B", 50, 200);
  const hpS = await ev("B?(B.foe[1].hp<=0?'ko':'ok'):'ende'"); if (!/ko|ende/.test(hpS)) throw new Error('Ziel 2 nicht getroffen ' + hpS);
  // Rest besiegen: alle Gegner auf 1 KP, Flächenattacke Wellen
  if (await ev('!!B')) {
    for (let k = 0; k < 6 && await ev('!!B'); k++) {
      await ev("B.foe.forEach(m=>{if(m.hp>0)m.hp=1});B.busy=false;1");
      if (btlMode === 'echtzeit') await ev("B.g.me=1;B.g.foe=0;B.cdRaw=[1,1,1,1];showRT();1");
      else await tapUntil("!!document.querySelector('#bMenu .big.k1')||!B", 30, 200);
      if (!await ev('!!B')) break;
      if (btlMode === 'runde') { await ev("document.querySelector('#bMenu .big.k1')&&document.querySelector('#bMenu .big.k1').click()"); await Wt(100); }
      await ev("(()=>{const b=[...document.querySelectorAll('#bMenu .mv')].find(b=>b.dataset.i==='0'&&!b.disabled);b&&b.click()})()"); await Wt(120);
      if (await ev("document.querySelectorAll('#bMenu .tgt').length") > 0) await ev("[...document.querySelectorAll('#bMenu .tgt')].find(b=>!b.disabled).click()");
      await tapUntil(menuUp + "||!B", 40, 200);
    }
  }
  if (!await tapUntil('!B', 80, 250)) throw new Error('Kampf endet nicht: ' + await ev("JSON.stringify({m:mode,busy:B&&B.busy,card:!$('#bCard').hidden,foe:B&&B.foe.map(m=>m.hp)})"));
  await Wt(200); await clean();
  if (await ev("G.defeatedTrainers.includes('tq_dbl" + r + "')") !== true) throw new Error('Sieg nicht verbucht');
};
for (const m of ['runde']) for (let r = 0; r < 3; r++) await step(`Doppelkampf ${m} Sieg #${r + 1}`, () => dbl(m, r));
await step('Doppelkampf: Wechsel auf Bank', async () => {
  await reset(); await ev("G.team=[mk(4,30),mk(1,30),mk(10,30)];G.team.forEach(m=>m.hp=stat(m,'hp'));1"); await fight('runde', `startBattle({trainer:${trainer({ f: 'sw', dbl: true, team: [[10, 8], [13, 8]] })}})`);
  await ev("turn({k:'switch',i:2})"); await Wt(200); await ev("turn({k:'move',i:1,target:0})"); await tapUntil("!!document.querySelector('#bMenu .big.k1')", 40, 200);
  const mine = await ev("B.mine.map(i=>G.team[i].s).join()"); await ev("endBattle('run')"); await clean(); if (!/10/.test(mine)) throw new Error('Wechsel fehlt: ' + mine); });

// ---------- Fang bei vollem Team + Glanz ----------
const fullCatch = async (r, shiny) => {
  await reset(); await ev("G.team=[mk(4,25),mk(1,25),mk(10,25),mk(2,25),mk(5,25),mk(7,25)];G.team.forEach(m=>m.hp=stat(m,'hp'));G.box=[];normalizeBox(G);G.shinyChain={s:0,n:0};1");
  await fight('runde', `startBattle({wild:Object.assign(mk(14,5),{shiny:${shiny}})})`);
  const n0 = await ev("boxAll().length"); const sc0 = await ev("G.shinyChain.n");
  await ev("window.__cc=calcCatch;calcCatch=()=>({p:1,shakes:3,crit:false,ok:true});turn({k:'ball',item:'kapsel'});1");
  if (!await tapUntil('!B', 90, 250)) throw new Error('Kampf endet nicht');
  await ev('calcCatch=window.__cc;1'); await Wt(200);
  const s = await ev("({box:boxAll().length,team:G.team.length,chain:G.shinyChain,shiny:boxAll().some(m=>m.shiny),sp:boxAll().map(m=>m.s)})");
  if (s.box !== n0 + 1 || s.team !== 6) throw new Error('nicht in Box ' + JSON.stringify(s)); if (s.chain.s !== 14 || s.chain.n !== sc0 + 1) throw new Error('Serie ' + JSON.stringify(s.chain)); if (shiny && !s.shiny) throw new Error('Glanz verloren');
  await clean();
};
for (let r = 0; r < 3; r++) await step(`Fang bei vollem Team → Box + Fangserie #${r + 1}`, () => fullCatch(r, false));
for (let r = 0; r < 3; r++) await step(`Glanz-Fang bleibt Glanz #${r + 1}`, () => fullCatch(r, true));

// ---------- Begegnung im hohen Gras (Loop-C-QA 12.11.: grassAmbush entfernt → neuer Pfad moveEncounter, Zufall = 0, VEYRA_ENC an) ----------
for (let r = 0; r < 3; r++) await step(`Begegnung hohes Gras (moveEncounter) #${r + 1}`, async () => {
  await reset(); await ev("loadMap('route1',9,18);mode='world';G.time=12*60;1"); await Wt(300);
  const pos = await ev("(()=>{const m=cur.m||cur.map;for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++){const c=tileAt(cur,x,y);if(c==='\"'||c===':')return[x,y];}return null})()");
  if (!pos) throw new Error('kein hohes Gras gefunden');
  await ev(`window.VEYRA_ENC=1;P.x=P.px=${pos[0]};P.y=P.py=${pos[1]};ENC.steps=99;ENC.calm=0;ENC.pend=null;mode='world';(()=>{const R0=Math.random;Math.random=()=>0;try{if(!moveEncounter(tileAt(cur,P.x,P.y)))throw new Error('moveEncounter hat nicht ausgelöst');}finally{Math.random=R0;}})()`);
  const m0 = await ev('mode'); if (m0 !== 'wait') throw new Error('Rascheln: mode=' + m0);
  await p.waitForFunction(() => (typeof B!=="undefined"&&B) && document.querySelector('#bMenu').children.length > 0 && !B.busy, null, { timeout: 12000, polling: 100 }).catch(() => {});
  const s = await ev("({mode,wild:!B.tr})"); if (!s.wild || s.mode !== 'battle') throw new Error('kein Wildkampf ' + JSON.stringify(s));
  await ev("endBattle('run')"); await clean();
});

console.log('\nTiming:', JSON.stringify(t.timing || {}));
await done(t);
