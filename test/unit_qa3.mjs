// QA Phase 3: Kampfkern isoliert (Handrechnung), Status 20 Runden, Wetter, Reihenfolge 2.000×, EV-Cap, Migration, Alt-Texte, Recht
// Aufruf: node test/unit_qa3.mjs
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, readdirSync } from 'fs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' erwartet ' + JSON.stringify(b) + ', erhalten ' + JSON.stringify(a)); };
const near = (a, b, tol, m) => { if (Math.abs(a - b) > tol) throw new Error((m || '') + ' erwartet ≈' + b + ', erhalten ' + a); };
run(`SET.diff='normal';G=freshG({});G.time=12*60;cur={id:'route1',theme:'meadow'};
globalThis.fix=function(s,l,o){const m=mk(s,l);m.iv={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};m.ev={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};m.nature='ausgeglichen';m.ability=(o&&o.ab)||'flink';m.status=null;m.conf=0;m.friendship=70;m.heldItem=null;m.hp=stat(m,'hp');return m;};
globalThis.mkB=function(me,foes,o){G.team=[me];const b={tr:null,foe:foes,fi:0,mi:0,part:new Set([0]),double:!!(o&&o.double),foes:o&&o.double?foes.slice(0,2):[foes[0]],mine:[0],stm:new Map(),dead:new Set(),res:{me:0,foe:0},resOn:{},weather:(o&&o.wx)||null,wxT:Infinity,field:null,rt:false,sim:true};defineSt(b);B=b;return b;};
globalThis.oneType=function(ty,not){for(let i=1;i<MONS.length;i++){const M=MONS[i];if(M.t.length===1&&M.t[0]===ty)return i;}return null;};
globalThis.noType=function(ty){for(let i=1;i<MONS.length;i++){const M=MONS[i];if(!M.t.includes(ty))return i;}return null;};`);

// ---------- 1a. calcStat Handrechnung ----------
// Formel: core=⌊(2·B+AW+⌊TW/4⌋)·Lv/100⌋ · KP=core+Lv+10 · sonst ⌊(core+5)·1,1/0,9⌋
t('calcStat Bsp.1: Basis 80, AW 15, TW 100, Lv 37, Kernig (Atk▲ SpA▼)', () => {
  // core=⌊(160+15+25)·37/100⌋=74 ; KP=121 ; Atk=⌊79·1,1⌋=86 ; SpA=⌊79·0,9⌋=71 ; Def=79
  eq(run(`[calcStat(80,15,100,37,'kernig','hp'),calcStat(80,15,100,37,'kernig','atk'),calcStat(80,15,100,37,'kernig','spa'),calcStat(80,15,100,37,'kernig','def')]`), [121, 86, 71, 79]); });
t('calcStat Bsp.2: Basis 45, AW 31, TW 252, Lv 100, Würdevoll (SpV▲ Ini▼)', () => {
  // core=⌊(90+31+63)·100/100⌋=184 ; KP=294 ; SpV=⌊189·1,1⌋=207 ; Ini=⌊189·0,9⌋=170
  eq(run(`[calcStat(45,31,252,100,'würdevoll','hp'),calcStat(45,31,252,100,'würdevoll','spd'),calcStat(45,31,252,100,'würdevoll','spe')]`), [294, 207, 170]); });
t('calcStat Bsp.3: Basis 130, AW 0, TW 0, Lv 5, neutral', () => {
  // core=⌊260·5/100⌋=13 ; KP=28 ; sonst 18
  eq(run(`[calcStat(130,0,0,5,'ausgeglichen','hp'),calcStat(130,0,0,5,'ausgeglichen','atk'),calcStat(130,0,0,5,'beständig','spe')]`), [28, 18, 18]); });
t('calcStat: Wesenszug wirkt nie auf KP; alle 20 Nicht-Neutralen: genau ein ▲ und ein ▼', () => {
  eq(run(`(()=>{let bad=0;for(const n of Object.keys(NATURES)){const N=NATURES[n];const hp=calcStat(100,10,40,50,n,'hp')===calcStat(100,10,40,50,'ausgeglichen','hp');if(!hp)bad++;
   let up=0,dn=0;for(const k of['atk','def','spa','spd','spe']){const v=calcStat(100,10,40,50,n,k),b=calcStat(100,10,40,50,'ausgeglichen',k);if(v>b)up++;if(v<b)dn++;}
   if(N.up?(up!==1||dn!==1):(up||dn))bad++;}return bad})()`), 0); });

// ---------- 1b. calcDamage isoliert ----------
// Basis (ohne Faktoren) = (((2·Lv/5+2)·Stärke·A/D)/50+2)·DMG_SCALE ; Ergebnis = ⌊Basis · STAB · Eff · Krit · rnd⌋
const base = `(a,d,M,kat)=>(((2*a.l/5+2)*M[2]*battleStat(B,a,kat==='spez'?'spa':'atk')/Math.max(1,battleStat(B,d,kat==='spez'?'spd':'def')))/50+2)*DMG_SCALE`;
t('calcDamage: DMG_SCALE im Wertebereich, Grundformel exakt (ohne STAB, neutral, kein Krit)', () => {
  const r = run(`(()=>{const nt=noType('volt');const a=fix(nt,40),d=fix(noType('flora')===nt?10:10,40);mkB(a,[d]);const M=MOVES.rempler;if(M[1]==='kern'&&(MONS[a.s].t.includes('kern')))return'skip';
   const e=eff(M[1],MONS[d.s].t),stab=MONS[a.s].t.includes(M[1])?1.5:1;const b=(${base})(a,d,M,'phys');const r=calcDamage(a,d,'rempler',{B,crit:false,rnd:1});return[r.dmg,Math.max(1,Math.floor(b*stab*e)),DMG_SCALE]})()`);
  if (r === 'skip') return true; eq(r[0], r[1]); if (!(r[2] > 0 && r[2] <= 1)) throw new Error('DMG_SCALE ' + r[2]); });
t('calcDamage: STAB genau ×1,5 (gleicher Angreifer, Attacke mit/ohne Typ-Übereinstimmung, gleiche Stärke simuliert)', () => {
  eq(run(`(()=>{const a=fix(1,50),d=fix(59,50);mkB(a,[d]);const mv=['','glut',60,100,1,null,'spez',0,1],mo=['','kern',60,100,1,null,'spez',0,1];
   // Glimmo (Glut): STAB bei Glut, nicht bei Kern; Effektivität getrennt herausgerechnet
   const A=calcDamage(a,d,mv,{B,crit:false,rnd:1}),O=calcDamage(a,d,mo,{B,crit:false,rnd:1});return[A.stab,O.stab,MONS[a.s].t.includes('glut')]})()`), [1.5, 1, true]); });
t('calcDamage: Effektivität ×2 / ×0,5 / ×0 / ×4 aus TYPE_CHART (Doppeltyp multipliziert)', () => {
  eq(run(`(()=>{const a=fix(1,50),d=fix(59,50);mkB(a,[d]);let bad=0;const K=Object.keys(TYPES);
   for(const ty of K){const M=['',ty,60,100,1,null,'spez',0,1];for(const dd of[[K[0]],[K[3],K[5]],[K[1],K[7]]]){const want=dd.reduce((p,x)=>p*(TYPE_CHART[ty][x]),1),got=eff(ty,dd);if(got!==want)bad++;}}
   const dm=fix(59,50);const rr=calcDamage(a,dm,['','kern',60,100,1,null,'phys',0,1],{B,crit:false,rnd:1});return[bad,rr.eff===eff('kern',MONS[dm.s].t)]})()`), [0, true]); });
t('calcDamage: Krit ×1,5 exakt (gleicher Wurf, rnd 1) und Krit ignoriert Gegner-Verteidigungsstufe +', () => {
  const r = run(`(()=>{const a=fix(1,60),d=fix(59,60);mkB(a,[d]);const M=['','glut',70,100,1,null,'spez',0,1];const n=calcDamage(a,d,M,{B,crit:false,rnd:1}).dmg,c=calcDamage(a,d,M,{B,crit:true,rnd:1}).dmg;
   stOf(B,d).spd=4;const n4=calcDamage(a,d,M,{B,crit:false,rnd:1}).dmg,c4=calcDamage(a,d,M,{B,crit:true,rnd:1}).dmg;return[n,c,n4,c4]})()`);
  near(r[1] / r[0], 1.5, .03, 'Krit'); eq(r[3], r[1], 'Krit ignoriert +SpV'); if (!(r[2] < r[0])) throw new Error('+SpV senkt nicht'); });
t('calcDamage: Wetter-Faktoren Sonne/Regen/Gewitter/Schnee exakt', () => {
  const r = run(`(()=>{const a=fix(1,100),d=fix(59,100);mkB(a,[d]);const g=ty=>['',ty,120,100,1,null,'spez',0,1],o={B,crit:false,rnd:1};const out={};
   for(const[wx,ty]of[['sonne','glut'],['regen','glut'],['regen','flut'],['gewitter','volt'],['gewitter','flut'],['schnee','frost']]){B.weather=null;const n=calcDamage(a,d,g(ty),o).dmg;B.weather=wx;const w=calcDamage(a,d,g(ty),o).dmg;out[wx+'_'+ty]=w/n;}return out})()`);
  near(r.sonne_glut, 1.5, .05); near(r.regen_glut, .5, .05); near(r.regen_flut, 1.5, .05); near(r.gewitter_volt, 1.3, .05); near(r.gewitter_flut, 1.2, .05); near(r.schnee_frost, 1.3, .05); });
t('calcDamage: Resonanz +30 % auf Resonanz-Typ (STAB vorhanden, gleicher Typ)', () => {
  const r = run(`(()=>{const a=fix(1,60),d=fix(59,60);mkB(a,[d]);const M=['','glut',70,100,1,null,'spez',0,1],n=calcDamage(a,d,M,{B,crit:false,rnd:1}).dmg,w=calcDamage(a,d,M,{B,crit:false,rnd:1,res:{type:'glut'}}).dmg;return w/n})()`);
  near(r, 1.3, .04); });
t('calcDamage: Flächenabzug ×0,75, Stufe Angriff +2 → A×2', () => {
  const r = run(`(()=>{const a=fix(1,60),d=fix(59,60);mkB(a,[d]);const M=['','kern',70,100,1,null,'phys',0,1],n=calcDamage(a,d,M,{B,crit:false,rnd:1}).dmg,s=calcDamage(a,d,M,{B,crit:false,rnd:1,spread:true}).dmg;stOf(B,a).atk=2;const u=calcDamage(a,d,M,{B,crit:false,rnd:1}).dmg;return[s/n,u/n]})()`);
  near(r[0], .75, .03); near(r[1], 2, .15); });
t('calcDamage: Zufallsbereich 0,85–1,00, Mindestschaden 1, Immunität 0', () => {
  const r = run(`(()=>{const a=fix(1,30),d=fix(59,30);mkB(a,[d]);const M=['','glut',60,100,1,null,'spez',0,1];let lo=1e9,hi=0;for(let i=0;i<500;i++){const x=calcDamage(a,d,M,{B,crit:false}).dmg;lo=Math.min(lo,x);hi=Math.max(hi,x);}
   const w=fix(59,2),b2=fix(1,100);b2.hp=9999;return[hi/lo,calcDamage(w,b2,['','kern',10,100,1,null,'phys',0,1],{B,crit:false,rnd:.85}).dmg]})()`);
  if (r[0] > 1.25 || r[0] < 1.05) throw new Error('Streuung ' + r[0]); if (r[1] < 1) throw new Error('Min 1'); });

// ---------- 1c. orderActions ----------
t('orderActions: Priorität schlägt Initiative, Wechsel/Item zuerst', () => {
  eq(run(`(()=>{const slow=fix(57,30),fast=fix(72,30);slow.moves=[{id:'rempler',pp:99},{id:'schnell',pp:99}];fast.moves=[{id:'rempler',pp:99}];mkB(slow,[fast]);let ok=0;
   for(let i=0;i<50;i++){const o=orderActions(B,[{side:'foe',k:'move',mon:fast,i:0},{side:'me',k:'move',mon:slow,i:1}]);if(o[0].mon===slow)ok++;}
   const s=orderActions(B,[{side:'foe',k:'move',mon:fast,i:0},{side:'me',k:'item',mon:slow}]);return[ok,s[0].k]})()`), [50, 'item']); });
t('orderActions: Gleichstand ≈ 50/50 über 2.000 Läufe', () => {
  const n = run(`(()=>{const a=fix(59,30),b=fix(59,30);a.moves=[{id:'rempler',pp:99}];b.moves=[{id:'rempler',pp:99}];mkB(a,[b]);let n=0;for(let i=0;i<2000;i++)if(orderActions(B,[{side:'me',k:'move',mon:a,i:0},{side:'foe',k:'move',mon:b,i:0}])[0].mon===a)n++;return n})()`);
  near(n / 2000, .5, .05, 'Anteil'); });

// ---------- 1d. Zustände über 20 Runden ----------
t('Schlummer: endet nach 1–3 Zügen, nie mehr als 3 Ausfälle, nie Dauerschlaf (500 Läufe)', () => {
  eq(run(`(()=>{const a=fix(59,30),d=fix(113,30);mkB(a,[d]);let maxSkip=0,stuck=0;for(let i=0;i<500;i++){a.status=null;applyStatus(B,a,'schlummer');let skip=0;for(let r=0;r<20;r++){const c=STATUS.schlummer.canAct(a);if(!c.ok)skip++;else break;}maxSkip=Math.max(maxSkip,skip);if(a.status)stuck++;}return[maxSkip<=3,stuck]})()`), [true, 0]); });
t('Sporen: 1/10 KP je Runde über 20 Runden bis KO, Heilung halbiert', () => {
  eq(run(`(()=>{const a=fix(59,40);mkB(a,[fix(113,40)]);const max=stat(a,'hp'),d1=Math.max(1,Math.floor(max/10));applyStatus(B,a,'sporen');let first=a.hp;endOfTurn(B);const l1=first-a.hp;let r=1;while(a.hp>0&&r<20){endOfTurn(B);r++;}
   const b=fix(59,40);b.hp=1;const h0=healMonB(b,40);b.status='sporen';b.hp=1;const h1=healMonB(b,40);return[l1===d1,a.hp,r<=11,h1<=Math.floor(h0/2)+1&&h1<h0]})()`), [true, 0, true, true]); });
t('Starre: Ausfall ≈ 25 % (4.000 Versuche), Initiative ×0,6, immun: Volt', () => {
  const r = run(`(()=>{const a=fix(59,30);mkB(a,[fix(113,30)]);a.status='starre';let n=0;for(let i=0;i<4000;i++)if(!STATUS.starre.canAct(a).ok)n++;const s0=speedOf(B,fix(59,30));const s1=speedOf(B,a);
   const v=fix(1,30);v.moves=[{id:'rempler',pp:9}];const volt=fix(oneType('volt')||1,30);const e=applyStatus(B,volt,'starre');return[n/4000,s1/s0,volt.status,MONS[volt.s].t.join()]})()`);
  near(r[0], .25, .03); near(r[1], .6, .05); eq(r[2], null, 'Volt immun ' + r[3]); });
t('Sengen: 1/16 KP je Runde (20 Runden), Atk-Malus ×0,7 nur physisch, Glut immun', () => {
  const r = run(`(()=>{const a=fix(59,60),d=fix(57,60);mkB(a,[d]);const max=stat(a,'hp'),per=Math.max(1,Math.floor(max/16));applyStatus(B,a,'sengen');const h0=a.hp;endOfTurn(B);const l1=h0-a.hp;let rr=1;while(a.hp>0&&rr<20){endOfTurn(B);rr++;}
   const x=fix(59,60);mkB(x,[d]);const Mp=['','kern',70,100,1,null,'phys',0,1],Ms=['','kern',70,100,1,null,'spez',0,1];const p0=calcDamage(x,d,Mp,{B,crit:false,rnd:1}).dmg,s0=calcDamage(x,d,Ms,{B,crit:false,rnd:1}).dmg;x.status='sengen';
   const p1=calcDamage(x,d,Mp,{B,crit:false,rnd:1}).dmg,s1=calcDamage(x,d,Ms,{B,crit:false,rnd:1}).dmg;const g=fix(oneType('glut')||1,30);applyStatus(B,g,'sengen');return[l1===per,a.hp,rr<=Math.ceil(max/per),p1/p0,s1/s0,g.status]})()`);
  eq(r[0], true); eq(r[1], 0); eq(r[2], true); near(r[3], .7, .04); near(r[4], 1, .01); eq(r[5], null); });
t('Raureif: Initiative ×0,5, Spezial ×0,7, taut mit 25 %/Runde (endet in ≤ 20 Runden bei ≥ 99 %)', () => {
  const r = run(`(()=>{const a=fix(59,60),d=fix(113,60);mkB(a,[d]);let ended=0,tot=300;for(let i=0;i<tot;i++){a.status=null;applyStatus(B,a,'raureif');for(let r=0;r<20&&a.status;r++)STATUS.raureif.onTurn(a);if(!a.status)ended++;}
   const x=fix(59,60);mkB(x,[d]);const s0=speedOf(B,x);const Ms=['','kern',70,100,1,null,'spez',0,1];const q0=calcDamage(x,d,Ms,{B,crit:false,rnd:1}).dmg;x.status='raureif';return[ended/tot,speedOf(B,x)/s0,calcDamage(x,d,Ms,{B,crit:false,rnd:1}).dmg/q0]})()`);
  if (r[0] < .98) throw new Error('endet nur ' + r[0]); near(r[1], .5, .03); near(r[2], .7, .04); });
t('Benommenheit: 2–4 Züge, ≈ 1/3 Selbsttreffer, endet immer, kein Statuskonflikt mit Hauptzustand', () => {
  const r = run(`(()=>{const a=fix(59,40),d=fix(113,40);a.moves=[{id:'rempler',pp:9999}];mkB(a,[d]);let selfhit=0,acts=0,maxT=0,minT=9,stuck=0;
   for(let i=0;i<800;i++){a.conf=0;a.status='sengen';applyStatus(B,a,'wirr');maxT=Math.max(maxT,a.conf);minT=Math.min(minT,a.conf);const hp0=a.hp=stat(a,'hp');d.hp=stat(d,'hp');
    for(let r=0;r<5&&a.conf>0;r++){acts++;const h=a.hp,dh=d.hp;const ev=execMove(B,'me',a,0,d);if(a.hp<h&&d.hp===dh&&ev.some(e=>e.s&&/selbst/.test(e.s)))selfhit++;a.hp=stat(a,'hp');d.hp=stat(d,'hp');}
    if(a.conf>0)stuck++;}return[minT,maxT,selfhit/acts,stuck,a.status]})()`);
  eq(r[0], 2); eq(r[1], 4); near(r[2], .22, .07, 'Selbsttreffer je Zug (1/3 nach Abzug des Endzugs)'); eq(r[3], 0); eq(r[4], 'sengen'); });

// ---------- 1e. Wetter / Felder ----------
t('Wetter: jedes der 6 Wetter dauert genau 5 Runden, Start-/Endmeldung, Feld-Wirkung', () => {
  eq(run(`(()=>{const out=[];for(const k of Object.keys(WEATHER)){const a=fix(1,30),d=fix(2,30);mkB(a,[d]);const s=setWeather(B,k);let n=0;while(B.weather===k&&n<9){endOfTurn(B);n++;}out.push(k+':'+n+':'+(s[0].s===WEATHER[k].start));}return out})()`),
    ['sonne:5:true', 'regen:5:true', 'sand:5:true', 'schnee:5:true', 'nebel:5:true', 'gewitter:5:true']); });
t('Wetter: Sand/Schnee 1/16 Splitter (Fels/Kern bzw. Frost immun), Nebel ×0,9 Treffer', () => {
  const r = run(`(()=>{const a=fix(1,40),f=fix(oneType('frost')||2,40),fe=fix(oneType('fels')||2,40);mkB(a,[f]);setWeather(B,'schnee',5);const h=a.hp,hf=f.hp;endOfTurn(B);const l=h-a.hp,lf=hf-f.hp;
   setWeather(B,'nebel',5);const M=['','kern',80,100,1,null,'phys',0,1];return[l===Math.floor(stat(a,'hp')/16),lf,hitChance(B,a,f,M)]})()`);
  eq(r[0], true); eq(r[1], 0); near(r[2], .9, .01); });
t('Feld Blütenwiese: Heilung 1/16 je Runde, 5 Runden', () => {
  eq(run(`(()=>{const a=fix(7,40),d=fix(59,40);mkB(a,[d]);setField(B,'bluete',5);a.hp=1;let n=0;while(B.field&&n<9){endOfTurn(B);n++;}return[n,a.hp>1]})()`), [5, true]); });

// ---------- 1f. EV-Cap ----------
t('EV-Cap: 252 je Wert, 510 gesamt, keine negativen Rückgaben', () => {
  eq(run(`(()=>{const m=fix(1,30);let g=0;for(let i=0;i<400;i++){for(const k of SIX)g+=addEv(m,k,3);}const tot=SIX.reduce((a,k)=>a+m.ev[k],0);return[SIX.every(k=>m.ev[k]<=252),tot,g===tot]})()`), [true, 510, true]); });

// ---------- 1g. Migration ----------
t('Migration: Phase-2-Kreatur (ohne neue Felder) behält Daten, Werte = calcStat(Basis, 0, 0, Lv, neutral) bei iv=0', () => {
  const r = run(`(()=>{const m={s:5,l:27,xp:2700,hp:40,moves:[{id:'rempler',pp:7}],known:['rempler','kratzer'],nickname:'Fips',ab:'flink'};const snap=JSON.stringify({s:m.s,l:m.l,xp:m.xp,mv:m.moves,k:m.known,nn:m.nickname});migrateMon(m);
   const after=JSON.stringify({s:m.s,l:m.l,xp:m.xp,mv:m.moves,k:m.known,nn:m.nickname});m.iv={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};m.ev={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};const b=base6(MONS[5]);
   const ok=SIX.every((k,i)=>stat6(m,k)===calcStat(b[i],0,0,27,'ausgeglichen',k));
   // Alte Formel: ⌊2·Basis·Lv/100⌋+5 bzw. +Lv+10 (iv=0, ev=0)
   const old=SIX.every((k,i)=>stat6(m,k)===(k==='hp'?Math.floor(2*b[i]*27/100)+27+10:Math.floor(2*b[i]*27/100)+5));
   return[snap===after,ok,old,m.nature,m.friendship,typeof m.gender,m.hp>0&&m.hp<=stat(m,'hp'),m.ability]})()`);
  eq(r[0], true, 'Daten'); eq(r[1], true, 'calcStat'); eq(r[2], true, 'alte Formel'); eq(r[3], 'ausgeglichen'); eq(r[4], 70); eq(r[6], true); });
t('Migration: Spielstand mit flacher Box → 20×30, nichts geht verloren, idempotent, Team unverändert', () => {
  const r = run(`(()=>{const mon=(s,l)=>({s,l,xp:l*l*l,hp:10,moves:[{id:'rempler',pp:5}],known:['rempler']});const box=[];for(let i=1;i<=45;i++)box.push(mon(1+i%20,5+i));
   const g={map:'route1',team:[mon(1,9),mon(2,10)],box,flags:{},bag:{kapsel:3}};const ids=box.map(m=>kanonId(m.s)+'_'+m.l).sort().join();migrateSave(g);const j=JSON.stringify(g);migrateSave(g);
   const all=boxAll(g);return[g.box.length,g.box.every(b=>b.length===30),all.length,all.map(m=>m.s+'_'+m.l).sort().join()===ids,g.box[1].filter(Boolean).length,g.team.length,g.bag.kapsel,j===JSON.stringify(g),g.boxNames.length]})()`);
  eq(r[0], 20); eq(r[1], true); eq(r[2], 45); eq(r[3], true, 'Bestand'); eq(r[4], 15, 'Box 2 hat 15'); eq(r[5], 2); eq(r[6], 3); eq(r[7], true); eq(r[8], 20); });
t('Migration: Box mit fehlerhaften Einträgen (null, unbekannte Art) wird sanft bereinigt', () => {
  eq(run(`(()=>{const g={team:[null,{s:999,l:1},{s:1,l:3,xp:27,hp:5,moves:[],known:[]}],box:[null,{s:2,l:4,xp:64,hp:5,moves:[],known:[]},[null,{s:3,l:5,xp:125,hp:5,moves:[],known:[]}]],flags:{}};migrateSave(g);return[g.team.length,boxAll(g).length,g.box.length]})()`), [1, 2, 20]); });

// ---------- Schwierigkeit leicht/normal ----------
t('Leicht: eigener Schaden ×1,3, gegnerischer ×0,65 (gegenüber normal)', () => {
  const r = run(`(()=>{const a=fix(1,60),d=fix(29,60);mkB(a,[d]);const M=['','glut',70,100,1,null,'spez',0,1],o=()=>({B,crit:false,rnd:1});SET.diff='normal';const me0=calcDamage(a,d,M,o()).dmg,fo0=calcDamage(d,a,M,o()).dmg;SET.diff='leicht';const me1=calcDamage(a,d,M,o()).dmg,fo1=calcDamage(d,a,M,o()).dmg;SET.diff='normal';return[me1/me0,fo1/fo0]})()`);
  near(r[0], 1.3, .03); near(r[1], .65, .03); });
t('Leicht: Standardkapsel bei halben KP klappt meist (≥ 55 %), Normal bleibt unverändert', () => {
  const r = run(`(()=>{const sp=[...Array(40).keys()].find(i=>i>0&&MONS[i].cr>=40&&MONS[i].cr<=50);const m=mk(sp,10);m.hp=Math.floor(stat(m,'hp')/2);const f=()=>{let ok=0;for(let i=0;i<3000;i++)if(calcCatch(m,'kapsel',{dist:0,turn:1,dex:0}).ok)ok++;return ok/3000};SET.diff='normal';const n=f();SET.diff='leicht';const l=f();const full=mk(sp,10);SET.diff='leicht';let fk=0;for(let i=0;i<2000;i++)if(calcCatch(full,'kapsel',{dist:0,turn:1,dex:0}).ok)fk++;SET.diff='normal';return[n,l,fk/2000]})()`);
  if (!(r[1] >= .55 && r[1] > r[0] * 1.5)) throw new Error('leicht ' + r[1] + ' normal ' + r[0]); if (r[2] > .6) throw new Error('voller KP zu leicht ' + r[2]); });
t('Leicht: Wilde 1–3 Level unter höchstem Teamlevel, Tabelle nur gedeckelt; Trainer ≤ Spielerniveau (Leiter +1)', () => {
  eq(run(`(()=>{SET.diff='leicht';G.team=[mk(1,20),mk(2,14)];const w=new Set();for(let i=0;i<300;i++)w.add(wildLv(40));const lo=wildLv(5);const t1=trainerLv(40,{}),t2=trainerLv(40,{leader:'x'}),t3=trainerLv(8,{});SET.diff='normal';return[Math.min(...w),Math.max(...w),lo,t1,t2,t3,wildLv(40),trainerLv(40,{})]})()`), [17, 19, 5, 20, 21, 8, 40, 40]); });
t('Leicht: Routentrainer KI-Stufe 0, Arena 2, Top Vier 3; EP ×1,5; Niederlage ohne Geldverlust-Faktor', () => {
  eq(run(`(()=>{SET.diff='leicht';const r=[aiTier({tr:{flag:'tr_x',name:'X'}}),aiTier({tr:{flag:'badge1',leader:'Y',name:'L'}}),aiTier({tr:{flag:'top1',name:'T'}})];const f=mk(10,20),x=xpGain(f,false,1);SET.diff='normal';const n=xpGain(f,false,1);return[r.join(),Math.abs(x/n-1.5)<.05,DIFF.leicht.loseLoss,DIFF.normal.loseLoss,aiTier({tr:{flag:'tr_x',name:'X'}})]})()`), ['0,2,3', true, 0, .5, 1]); });
t('Leicht: Zustände beim Spieler höchstens 2 Runden (Sengen/Sporen/Starre/Schlummer/Benommenheit)', () => {
  eq(run(`(()=>{SET.diff='leicht';let bad=0;for(const k of['sengen','sporen','starre','schlummer','raureif']){const a=fix(59,40),d=fix(113,40);mkB(a,[d]);G.team=[a];applyStatus(B,a,k);let n=0;while(a.status&&n<10){endOfTurn(B);n++;}if(n>2||a.status)bad++;}
   const a=fix(59,40);mkB(a,[fix(113,40)]);for(let i=0;i<50;i++){a.conf=0;applyStatus(B,a,'wirr');if(a.conf>2)bad++;}
   const f=fix(113,40);mkB(fix(59,40),[f]);applyStatus(B,f,'sporen');let n=0;for(let i=0;i<8;i++)endOfTurn(B);const foeStays=f.status==='sporen';SET.diff='normal';return[bad,foeStays]})()`), [0, true]); });
t('Leicht: Läden ×0,6, Begegnungen ×0,6, keine Angreifer; Normal unverändert', () => {
  eq(run(`(()=>{const o=[];SET.diff='leicht';o.push(DIFF.leicht.shop,DIFF.leicht.enc,monNature(5)==='aggro'||monNature(1)==='aggro'||[...Array(40).keys()].some(i=>i>0&&monNature(i)==='aggro'));SET.diff='normal';o.push([...Array(40).keys()].some(i=>i>0&&monNature(i)==='aggro'));return o})()`), [.6, .6, false, true]); });

// ---------- 6. Alt-Texte & Rechtscheck ----------
const SRC = readdirSync(new URL('../src/', import.meta.url)).filter(f => /\.(js|css|html)$/.test(f));
const grepSrc = (re) => { const hits = []; for (const f of SRC) { readFileSync(new URL('../src/' + f, import.meta.url), 'utf8').split('\n').forEach((ln, i) => { if (re.test(ln)) hits.push(f + ':' + (i + 1) + ' ' + ln.trim().slice(0, 90)); }); } return hits; };
t('Texte: keine „Ultrakapsel/Superkapsel/Meisterkapsel“ mehr (Aliasse als Item-Keys erlaubt)', () => { const h = grepSrc(/Ultrakapsel|Superkapsel|Meisterkapsel|Hyperkapsel/); if (h.length) throw new Error(h.join(' | ')); });
t('Recht: keine Markennamen (Pokémon, Pokéball, Meisterball, Nintendo, Pikachu …)', () => { const h = grepSrc(/Pok[eé]mon|Pok[eé]ball|Pok[eé] ?Ball|\bPoké\b|Meisterball|Superball|Hyperball|Ultraball|Nintendo|Pikachu|Glurak|Bisasam|Schiggy|\bEvoli\b|Taschenmonster/i); if (h.length) throw new Error(h.join(' | ')); });
t('Recht: keine Namen bekannter Trainer (Ash, Misty, Brock, Gary, Rocko, Lysander …)', () => { const h = grepSrc(/\b(Ash Ketchum|Misty|Brock|Gary Oak|Rocko|Lorelei|Lance|Cynthia|Team Rocket|Erika|Blaine)\b/); if (h.length) throw new Error(h.join(' | ')); });

console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
if (bad) { console.log('FEHLER'); process.exit(1); } else console.log('Alle QA-Unit-Tests grün.');
