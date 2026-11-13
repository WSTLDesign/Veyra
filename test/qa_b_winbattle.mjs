// QA Loop B3 – Prüfung 7: Ursachenanalyse „Doppelkampf 2v2 – Sieg nicht gezählt“ (bekannter Wackler im Smoke-Test).   node test/qa_b_winbattle.mjs [Läufe=8] [--load]
// Fragen: (1) setzt winBattle das Sieg-Flag und wird danach G ersetzt/zurückgesetzt? (2) läuft winBattle mehrfach (Doppelaufruf aus checkFaint) und beendet ein Alt-Aufruf den nächsten Kampf?
// Methode: wie Smoke-Schritt (Doppelkampf 2v2, Gegner-KP 1, Autoturn + Tippen), aber mit Zählern an winBattle/checkFaint/endBattle, einer Kampf-ID je B und Protokoll. Mit --load läuft nebenher Last (2 Busy-Loops).
// Zusatz: gezielter Test der Re-Entranz: zwei gleichzeitige checkFaint()-Aufrufe bei toten Gegnern → wie oft läuft winBattle?
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { fork } from 'child_process';
const N = +(process.argv[2] || 8), LOAD = process.argv.includes('--load');
const burners = []; if (LOAD) for (let i = 0; i < 2; i++) burners.push(fork(new URL('./qa_b_winbattle.mjs', import.meta.url).pathname.replace('qa_b_winbattle.mjs', 'qa_b_burn.mjs')));
const S = await serve(); const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 420, height: 860 } }); const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(S.url + 'index.html', { waitUntil: 'load' }); const ev = c => page.evaluate(c), wait = ms => page.waitForTimeout(ms);
await page.click('#iPrompt'); await wait(900); await page.click('#iSkip'); await wait(900); await page.click('#tNew'); await wait(400); await ev("for(let i=0;i<30&&mode==='dialog';i++){TW&&TW.finish&&TW.finish();advDlg();}if(!G.team.length){G.flags.starter=1;G.team.push(mk(1,6));}0"); await wait(300);
await ev(`window.__log=[];window.__bid=0;window.__wc=0;
 const _w=winBattle;winBattle=async function(){const b=B;if(b&&!b._id)b._id=++window.__bid;if(b&&b.won){window.__skip=(window.__skip||0)+1;window.__log.push('win-skip B#'+b._id+' (schon gewonnen, Aufruf kehrt sofort zurück)');return _w.apply(this,arguments);}window.__wc++;const id=b&&b._id,fl=b&&b.tr&&b.tr.flag,g0=G;window.__log.push('win-start B#'+id+' '+(fl||'wild')+' foeHp='+(b&&b.foe.map(m=>m.hp)));
  try{return await _w.apply(this,arguments);}catch(e){window.__log.push('win-THROW B#'+id+' '+e.message);throw e;}finally{window.__log.push('win-end B#'+id+' flag='+(fl?G.flags[fl]:'-')+' G'+(g0===G?'=':'≠')+' Bnow#'+(B&&B._id));}};
 const _e=endBattle;endBattle=function(r){window.__log.push('end:'+r+' B#'+(B&&(B._id||'?'))+' foeHp='+(B&&B.foe&&B.foe.map(m=>m.hp)));return _e.apply(this,arguments);};
 const _cf=checkFaint;window.__cf=0;checkFaint=async function(){window.__cf++;return _cf.apply(this,arguments);};
 const _sb=startBattle;startBattle=function(o){const r=_sb.apply(this,arguments);setTimeout(()=>{if(B&&!B._id)B._id=++window.__bid;window.__log.push('start B#'+(B&&B._id)+' '+(o&&(o.wild?'wild':o.trainer&&o.trainer.name)));},0);return r;};0`);
const autoTurn = "(()=>{if(!B||B.busy||!document.querySelector('#bMenu').children.length)return 0;if(B.needSlot!=null){const i=G.team.findIndex((m,j)=>m.hp>0&&!B.mine.includes(j));if(i>=0)doSwitch(i);return 1;}const me=G.team[B.mi];const i=me.moves.findIndex(m=>m.pp>0&&MOVES[m.id][2]>0);const t=B.foes.findIndex(m=>m&&m.hp>0);turn({k:'move',i:i<0?-1:i,target:t<0?0:t});return 1;})()";
const finish = async n => { for (let i = 0; i < n && await ev('!!B'); i++) { await ev(autoTurn); await page.mouse.click(200, 300); await wait(260); } };
const R = []; const menuReady = () => page.waitForFunction(() => document.querySelector('#bMenu').children.length > 0, null, { timeout: 15000 });
for (let k = 0; k < N; k++) {
  const r = { k };
  // Vorlauf wie im Smoke: Wetterkampf mit Zustand (Gegner-KP 1, Sengen), danach direkt der Doppelkampf
  await ev("window.__log=[];window.__wc=0;window.__cf=0;G.flags.tr_smoke2=0;G.defeatedTrainers=G.defeatedTrainers.filter(f=>f!=='tr_smoke2');ROAM.list.length=0;ROAM.want=0;healAll();SET.btl='runde';SET.skipBattleIntro=1;G.weather=G.weather||{};G.weather.route1='regen';loadMap('route1',9,18);mode='world';setView('2d',true);startBattle({wild:mk(59,6)})");
  await menuReady(); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 20000 });
  await ev("applyStatus(B,B.foe[0],'sengen');updB();B.foe[0].hp=1"); await finish(40); r.afterWild = await ev('!!B'); r.wcWild = await ev('window.__wc');
  // sofort Doppelkampf (wie Smoke: kein Warten auf stehende Alt-Ketten)
  await ev("G.team.unshift(mk(1,20),mk(4,20));if(G.team.length>6)G.team.length=6;healAll();SET.btl='runde';SET.skipBattleIntro=1;loadMap('route1',9,18);mode='world';startBattle({trainer:{name:'Zwillinge Pia & Pit',team:[[59,4],[112,4]],flag:'tr_smoke2',pre:'',post:'Doppelt verloren!',money:10,double:true}})");
  await menuReady(); await page.waitForFunction(() => B && !B.busy && document.querySelector('#bMenu .big'), null, { timeout: 20000 });
  await ev('B.foe.forEach(m=>m.hp=1)'); await finish(150);
  await wait(2500); // Nachlauf: stehen noch Alt-Ketten?
  r.flag = await ev('!!G.flags.tr_smoke2'); r.wc = await ev('window.__wc'); r.cf = await ev('window.__cf'); r.log = await ev('window.__log'); r.stillB = await ev('!!B');
  r.ok = r.flag && !r.stillB; R.push(r);
  console.log(`Lauf ${k + 1}: Flag ${r.flag ? 'ja' : 'NEIN'} · winBattle wirksam ×${r.wc} · checkFaint ×${r.cf}${r.ok ? '' : '  ← FEHLER'}`);
  if (!r.ok || r.wc > 2) console.log('   ' + r.log.join('\n   '));
  await ev("B=null;$('#battle').hidden=true;mode='world';0"); await wait(500);
}
// Gezielt: Re-Entranz
const re = await ev(`(async()=>{window.__wc=0;window.__log=[];healAll();SET.btl='runde';SET.skipBattleIntro=1;loadMap('route1',9,18);mode='world';startBattle({wild:mk(59,3)});await new Promise(r=>setTimeout(r,2500));
  B.foe[0].hp=0;const a=checkFaint(),b=checkFaint();const t0=Date.now();while(B&&Date.now()-t0<12000){TW&&TW.finish&&TW.finish();advDlg();document.querySelector('#screen').dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(r=>setTimeout(r,150));}
  return{wc:window.__wc,log:window.__log.slice(-6),done:!B}})()`);
console.log('\nRe-Entranz-Test (zwei gleichzeitige checkFaint bei totem Gegner): winBattle wirksam ×' + re.wc + (re.wc > 1 ? '  ← Doppelaufruf möglich (Guard B.won fehlt?)' : '  (Guard B.won greift)') + ' · Ende erreicht: ' + re.done); re.log.forEach(l => console.log('   ' + l));
const bad = R.filter(r => !r.ok).length; console.log(`\n${N - bad}/${N} Läufe grün · Seitenfehler: ${errs.length}` + (errs.length ? '\n' + errs.slice(0, 5).join('\n') : ''));
burners.forEach(b => b.kill()); await browser.close(); S.close(); process.exit(0);
