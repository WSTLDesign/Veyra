// Bewegung – versteckte Begegnungen (Gras, Schwimmen, Angeln) ohne Browser:  node test/unit_encounter.mjs
import { loadVeyra } from '../tools/balance.mjs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
run(`G=freshG({});G.time=12*60;G.flags.starter=1;G.team=[mk(1,12)];SET.diff='leicht';loadMap('route1',9,12);mode='world';
 globalThis.LASTB=null;startBattle=function(o){ENC.inB=1;ENC.pend=null;LASTB=o;mode='battle';};
 globalThis.grassTile=()=>{for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++)if(cur.rows[y][x]==='"'&&!blocked(x,y))return[x,y];};
 globalThis.reset=()=>{ENC.pend=null;ENC.fish=null;ENC.steps=99;ENC.calm=0;ENC.inB=0;mode='world';LASTB=null;P.state='walk';MV.rw=false;};`);
t('Wahrscheinlichkeit je Grasschritt: leicht 6 %, normal 9 %, Rennen ×1,25, Alt-Zustand ride = Gehen (Reiten entfernt); Wasser 5–7 %', () => {
  const r = J(`(()=>{reset();const a=encChance('grass');SET.diff='normal';const b=encChance('grass'),w=encChance('water');MV.rw=true;const c=encChance('grass');MV.rw=false;P.state='ride';const d=encChance('grass');P.state='walk';SET.diff='leicht';const w2=encChance('water');return[a,b,c,d,w,w2]})()`);
  const near = (x, y) => Math.abs(x - y) < 1e-9; if (!near(r[0], .06) || !near(r[1], .09) || !near(r[2], .1125) || !near(r[3], .09) || !near(r[4], .07) || !near(r[5], .05)) throw new Error(JSON.stringify(r)); });
t('Gras-Begegnung: Rascheln-Vorwarnung (mode wait, Ort im Gras), danach Kampf mit Art aus cur.enc (Tag)', () => {
  const r = J(`(()=>{reset();const g=grassTile();P.x=g[0];P.y=g[1];P.dir='up';const R=Math.random;Math.random=()=>0;const hit=moveEncounter('"');Math.random=R;const p=ENC.pend&&{...ENC.pend},m=mode;const f=encFire();return{hit,p,m,f,b:LASTB&&LASTB.wild&&LASTB.wild.s,enc:cur.enc.day.map(e=>e[0])}})()`);
  if (!r.hit || !r.p || r.p.kind !== 'grass' || r.m !== 'wait' || !r.f) throw new Error(JSON.stringify(r)); if (!r.enc.includes(r.b)) throw new Error('Art ' + r.b);
  if (!(r.p.dur >= 500 && r.p.dur <= 1000)) throw new Error('Vorwarnung ' + r.p.dur); });
t('Sichtbare Kreaturen bleiben (Roamer auf Gras-Karten) UND versteckte Begegnungen laufen parallel', () => run(`(()=>{reset();roamTick(16);return ROAM.tiles.length>0&&ROAM.want>0&&typeof moveEncounter==='function'})()`));
t('Mindestabstand 4 Schritte zwischen zwei versteckten Begegnungen', () => run(`(()=>{reset();ENC.steps=3;const R=Math.random;Math.random=()=>0;const a=moveEncounter('"');ENC.steps=4;const b=moveEncounter('"');Math.random=R;return!a&&b})()`));
t('Schonzeit 3 s nach einem Kampf; nie im Dialog/Menü', () => run(`(()=>{reset();ENC.inB=1;mode='world';moveTick(16);const calm=ENC.calm-performance.now();const R=Math.random;Math.random=()=>0;const a=moveEncounter('"');ENC.calm=0;mode='dialog';const b=moveEncounter('"');mode='world';const c=moveEncounter('"');Math.random=R;return calm>2500&&calm<=3000&&!a&&!b&&c})()`));
t('Kein Rascheln außerhalb von hohem Gras, kein Kampf ohne kampffähige Kreatur', () => run(`(()=>{reset();const R=Math.random;Math.random=()=>0;const a=moveEncounter('.');const hp=G.team[0].hp;G.team[0].hp=0;const b=moveEncounter('"');G.team[0].hp=hp;Math.random=R;return!a&&!b})()`));
t('Rate über 20 000 Grasschritte (leicht) ≈ 6 % abzüglich Mindestabstand', () => { const r = J(`(()=>{reset();let n=0;for(let i=0;i<20000;i++){ENC.steps++;if(moveEncounter('"')){n++;ENC.pend=null;mode='world';}}return n/20000})()`); if (!(r > .045 && r < .062)) throw new Error(r); console.log('   effektiv ' + (r * 100).toFixed(2) + ' % je Schritt'); });
t('Seltenere Arten bevorzugt: Gewicht √n × Fangraten-Bonus (seltene Art versteckt häufiger als in der Sichtliste)', () => {
  const r = J(`(()=>{const L=[[59,2,3],[59,2,3],[59,2,3],[59,2,3],[61,2,3]];let c=0;let s=1;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};for(let i=0;i<5000;i++)if(encPick(L,rnd)[0]===61)c++;return[c/5000,MONS[61].cr,MONS[59].cr]})()`);
  if (!(r[0] > .2)) throw new Error('Anteil seltene Art ' + r[0] + ' (Sichtliste 0,2)'); });
t('Nachts andere Liste (cur.enc.night)', () => run(`(()=>{reset();G.time=23*60;const ids=new Set();const R=Math.random;for(let i=0;i<200;i++){const e=grassEnc();ids.add(e[0]);}G.time=12*60;return[...ids].every(s=>cur.enc.night.some(e=>e[0]===s))})()`));
t('Schwimmen: versteckte Wasser-Begegnung mit Blasen-Vorwarnung, Art vom Typ Flut', () => {
  const r = J(`(()=>{reset();loadMap('brisenhafen',5,5);mode='world';P.state='swim';const R=Math.random;Math.random=()=>0;const hit=moveEncounter('~');Math.random=R;const k=ENC.pend&&ENC.pend.kind;encFire();P.state='walk';return{hit,k,s:LASTB&&LASTB.wild.s,t:LASTB&&MONS[LASTB.wild.s].t}})()`);
  if (!r.hit || r.k !== 'water' || !r.t.includes('flut')) throw new Error(JSON.stringify(r)); });
t('Wasser ohne Schwimmen (am Ufer) löst nichts aus', () => run(`(()=>{reset();loadMap('brisenhafen',5,5);mode='world';P.state='walk';const R=Math.random;Math.random=()=>0;const a=moveEncounter('~');Math.random=R;return!a})()`));
run(`globalThis.shore=()=>{for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++){if(blocked(x,y)||tileAt(cur,x,y)==='~')continue;for(const d of['up','down','left','right']){const[dx,dy]=DIRV[d];if(tileAt(cur,x+dx,y+dy)==='~'&&!npcAt(x+dx,y+dy))return[x,y,d];}}};`);
t('Angeln: A vor Wasser wirft aus (1–3 s), „Es zappelt!“, Tippen → Kampf mit Wasser-Art', () => {
  const r = J(`(()=>{reset();loadMap('brisenhafen',5,5);mode='world';const s=shore();P.x=s[0];P.y=s[1];P.px=P.x;P.py=P.y;P.dir=s[2];interact();const f=ENC.fish&&{...ENC.fish},m=mode;fishBite();const ph=ENC.fish&&ENC.fish.ph;fishReact();return{f,m,ph,b:LASTB&&MONS[LASTB.wild.s].t,wait:f&&f.bite-f.t0}})()`);
  if (!r.f || r.m !== 'wait' || r.ph !== 'bite' || !r.b || !r.b.includes('flut')) throw new Error(JSON.stringify(r)); if (!(r.wait >= 1000 && r.wait <= 3000)) throw new Error('Wartezeit ' + r.wait); });
t('Angeln: zu spät → „Weg war\'s.“, zu früh → kein Kampf, Spiel läuft weiter (mode world)', () => run(`(()=>{reset();const s=shore();P.x=s[0];P.y=s[1];P.dir=s[2];fishCast();fishBite();fishEnd('miss');const a=!LASTB&&mode==='world'&&!ENC.fish;fishCast();ENC.fish.t0-=1000;fishReact();return a&&!LASTB&&mode==='world'&&!ENC.fish})()`));
t('Angeln nutzt cur.enc.fish, wenn die Karte eine Angel-Liste hat', () => run(`(()=>{reset();cur.enc=cur.enc||{day:[],night:[]};const old=cur.enc.fish;cur.enc.fish=[[37,7,7]];const e=waterEnc(null,true);cur.enc.fish=old;return e[0]===37&&e[1]===7})()`));
t('Prof-Hinweis „Schwäche wilde Kreaturen im hohen Gras…“ passt: Gras löst wieder Kämpfe aus', () => run(`(()=>{reset();loadMap('route1',9,12);const g=grassTile();P.x=g[0];P.y=g[1];const R=Math.random;Math.random=()=>0;onStep();Math.random=R;return!!ENC.pend||mode==='battle'||!!LASTB})()`));
// QA B1/B2: nur EIN Gras-System – kein paralleler Hinterhalt im Schritt-Hook; grassAmbush (toter Code) ist seit Loop C entfernt
t('Ein Gras-System (QA B1/B2): Schritt im Gras löst ohne encReady nichts aus; grassAmbush existiert nicht mehr', () => {
  const r = J(`(()=>{reset();const g=grassTile();P.x=g[0];P.y=g[1];const R=Math.random;Math.random=()=>0;ENC.steps=0;onStep();const a={m:mode,p:!!ENC.pend};Math.random=R;reset();return{a,gone:typeof grassAmbush==='undefined'}})()`);
  if (r.a.m !== 'world' || r.a.p || !r.gone) throw new Error(JSON.stringify(r)); });
t('Gras-Rate gesamt über onStep (nur moveEncounter): leicht ≈ 5 %, normal ≈ 7 % (± 2)', () => {
  const r = J(`(()=>{const g=grassTile();const out={};for(const d of ['leicht','normal']){SET.diff=d;let n=0,hit=0;for(let run=0;run<12;run++){reset();ENC.steps=0;for(let k=0;k<300;k++){P.x=g[0];P.y=g[1];mode='world';ENC.calm=0;onStep();n++;if(ENC.pend||mode!=='world'){hit++;ENC.pend=null;mode='world';}}}out[d]=100*hit/n;}SET.diff='leicht';reset();return out})()`);
  console.log('   Rate leicht ' + r.leicht.toFixed(2) + ' % · normal ' + r.normal.toFixed(2) + ' %');
  if (!(r.leicht >= 3 && r.leicht <= 7 && r.normal >= 5 && r.normal <= 9)) throw new Error(JSON.stringify(r)); });
console.log(`\n${ok} ✓ / ${bad} ✗`); process.exit(bad ? 1 : 0);
