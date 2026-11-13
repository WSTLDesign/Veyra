// Bewegung – Feldattacken (Schwimmen/Gleiten/Klettern + Hindernisse; Reiten entfernt) ohne Browser:  node test/unit_fieldmoves.mjs
import { loadVeyra } from '../tools/balance.mjs';
const { run } = loadVeyra();
let ok = 0, bad = 0;
const t = (name, fn) => { try { const r = fn(); if (r === false) throw new Error('falsch'); ok++; console.log('✓', name); } catch (e) { bad++; console.log('✗', name, '–', e.message); } };
const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
run(`G=freshG({});G.time=12*60;G.flags.starter=1;loadMap('route1',9,12);mode='world';globalThis.SAID=[];say=(l,cb)=>{SAID.push([].concat(l).join(' '));};ask=(q,o,cb)=>{SAID.push(q);cb(0);};
 globalThis.team=(...L)=>{G.team=L.map(([s,l,k])=>{const m=mk(s,l);if(k)m.known=(m.known||[]).concat(k);return m;});P.state='walk';};`);
t('FIELD_MOVES: 7 Feldattacken mit eigenen Namen, Lern-Typen, Lernstufe, Rolle rolle_<id>', () => { const F = J('FIELD_MOVES'), k = Object.keys(F);
  if (k.join() !== 'rankenschnitt,felsschub,eisbruecke,leuchtfeuer,wellenritt,sturmfluegel,kletterkralle') throw new Error(k);
  for (const id of k) if (!F[id].n || !F[id].types.length || !(F[id].lv > 0) || F[id].item !== 'rolle_' + id) throw new Error(id); });
t('Reiten entfernt (Nutzer 12.11.): kein toggleRide/rideOK/canCarry, setMoveState(\'ride\') = false, Zustand \'ride\' → walk', () => {
  const r = J(`(()=>{team([1,10]);const f=[typeof toggleRide,typeof rideOK,typeof canCarry,typeof rideMon,'ride' in MOVE_PARAMS,'ride' in MOUNT_ST];const a=setMoveState('ride');P.state='ride';moveResolve();return[f,a,P.state,compMon().s]})()`);
  if (r[0].join() !== 'undefined,undefined,undefined,undefined,false,false' || r[1] !== false || r[2] !== 'walk' || r[3] !== 1) throw new Error(JSON.stringify(r)); });
t('Schwimmen: Orden UND Wellenritt (Flut ab Lv 14 oder per Rolle); ohne Orden nein', () => {
  const r = J(`(()=>{G.flags.swim=1;team([1,20]);const a=canSwim();team([4,10]);const b=canSwim();team([4,14]);const c=canSwim();team([4,10,['wellenritt']]);const d=canSwim();G.flags.swim=0;G.badges=[];const e=canSwim();G.badges=['a','b'];const f=canSwim();G.badges=[];return[a,b,c,d,e,f]})()`);
  if (r.join() !== 'false,false,true,true,false,true') throw new Error(r); });
t('Gleiten/Klettern: Sturmflügel (Böe) bzw. Kletterkralle (Fels/Schatten) + Orden', () => {
  const r = J(`(()=>{G.flags.glide=1;G.flags.climb=1;team([1,30]);const a=moveUnlocked('glide'),b=moveUnlocked('climb');team([59,14],[57,18]);const c=moveUnlocked('glide'),d=moveUnlocked('climb');G.flags.glide=0;G.flags.climb=0;const e=moveUnlocked('glide');return[a,b,c,d,e]})()`);
  if (r.join() !== 'false,false,true,true,false') throw new Error(r); });
t('Migration: alte Flags swim/glide/climb bleiben gültig (Orden-Erlaubnis), alte Flag ride bleibt unberührt (ignoriert); migrateSave bricht nicht', () => {
  const r = J(`(()=>{const old=freshG({});old.flags={starter:1,ride:1,swim:1,glide:1,climb:1};old.team=[mk(4,20),mk(59,20)];if(typeof migrateSave==='function')migrateSave(old);G=old;const a=[canSwim(),canGlide(),G.flags.ride,G.flags.swim];G.team=[mk(1,5)];const b=[canSwim(),canGlide()];return[a,b]})()`);
  if (r[0].join() !== 'true,true,1,1' || r[1].join() !== 'false,false') throw new Error(JSON.stringify(r)); });
t('Feldattacke von selbst gelernt → in m.known eingetragen (Rolle = fieldTeach, nur passende Typen)', () => {
  const r = J(`(()=>{G=freshG({});G.flags.starter=1;loadMap('route1',9,12);mode='world';const m=mk(4,15);G.team=[m];fieldLearnTick(performance.now());const a=(m.known||[]).includes('wellenritt');const f=mk(1,5);const b=fieldTeach(f,'wellenritt'),c=fieldTeach(f,'rankenschnitt');return[a,b,c,fieldKnows(f,'rankenschnitt'),fieldKnows(f,'leuchtfeuer')]})()`);
  if (r.join() !== 'true,false,true,true,false') throw new Error(r); });
t('Hindernis Baumstamm Y: ohne Rankenschnitt blockiert + Kind-Hinweis, mit Rankenschnitt geräumt, bleibt im Spielstand', () => {
  const r = J(`(()=>{G.team=[mk(59,4)];G.mods={};delete cache.route1;loadMap('route1',17,2);const pos=[17,1],t0=tileAt(cur,17,1),bl=blocked(17,1);P.x=17;P.y=2;P.dir='up';SAID=[];interact();const hint=SAID.join(' ');
   G.team=[mk(59,5)];SAID=[];interact();const t1=tileAt(cur,17,1);delete cache.route1;const m=getMap('route1');return[t0,bl,hint,t1,tileAt(m,17,1),JSON.stringify(G.mods.route1)]})()`);
  if (r[0] !== 'Y' || !r[1] || !/Hier bräuchte ich Rankenschnitt/.test(r[2]) || r[3] !== '.' || r[4] !== '.') throw new Error(JSON.stringify(r)); });
t('Felsbrocken U: Felsschub schiebt ihn ein Feld weiter (nicht auf Fund/Wand), Position bleibt im Spielstand', () => {
  const r = J(`(()=>{G.mods={};delete cache.route2;loadMap('route2',15,3);const t0=tileAt(cur,16,3);G.team=[mk(57,12)];P.x=15;P.y=3;P.dir='right';SAID=[];interact();const side=SAID.join(' '),s0=tileAt(cur,16,3);
   P.x=16;P.y=2;P.dir='down';SAID=[];interact();const a=tileAt(cur,16,3),b=tileAt(cur,16,4);delete cache.route2;const m=getMap('route2');return[t0,s0,a,b,tileAt(m,16,4),tileAt(m,16,3),side]})()`);
  if (r[0] !== 'U' || r[1] !== 'U' || !/kein Platz/.test(r[6]) || r[2] !== '.' || r[3] !== 'U' || r[4] !== 'U' || r[5] !== '.') throw new Error(JSON.stringify(r)); });
t('Geröll G/Dornen D/Wasser Q hängen an Felsschub/Rankenschnitt/Eisbrücke (nicht mehr am Typ allein)', () => { const r = J(`[FIELD.D.move,FIELD.G.move,FIELD.Q.move,FIELD.Y.move,FIELD.U.move]`); if (r.join() !== 'rankenschnitt,felsschub,eisbruecke,rankenschnitt,felsschub') throw new Error(r); });
t('Leuchtfeuer: Höhlenlicht (hasField lumen) erst mit gelernter Attacke', () => run(`(()=>{G.team=[mk(61,5)];const a=!!hasField('lumen');G.team=[mk(61,6)];return!a&&!!hasField('lumen')})()`));
t('Neue Sperren blockieren nie Hauptwege: alle Ausgänge, Türen und Figuren bleiben untereinander erreichbar', () => {
  const bad = J(`(()=>{G=freshG({});const out=[];for(const id in FIELDMAP){const m=getMap(id);cur=m;const N=NPCS[id]||[],nAt=(x,y)=>N.find(n=>n.x===x&&n.y===y);
   const OB=new Set(['D','G','Q','Y','U']);let pass=false;const free=(x,y)=>{const t=tileAt(m,x,y);return t!==null&&(!SOLID.has(t)||pass&&OB.has(t))&&!nAt(x,y);};const keys=[];
   for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(/[0-9E]/.test(t)&&free(x,y+1))keys.push([x,y+1]);if(((x===0&&m.links.w)||(x===m.w-1&&m.links.e)||(y===0&&m.links.n)||(y===m.h-1&&m.links.s))&&free(x,y))keys.push([x,y]);}
   for(const n of N)if(!/item|hidden|scroll|sparkle|sign/.test(n.t)){const nb=[[0,1],[1,0],[-1,0],[0,-1]].map(([a,b])=>[n.x+a,n.y+b]).filter(([a,b])=>free(a,b));if(nb.length)keys.push(nb[0]);}
   if(!keys.length)continue;const reach=()=>{const k0=keys.find(k=>free(k[0],k[1]))||keys[0],seen=new Set([k0+'']),q=[k0];while(q.length){const[x,y]=q.pop();for(const[a,b]of[[0,1],[1,0],[-1,0],[0,-1]]){const k=(x+a)+','+(y+b);if(!seen.has(k)&&free(x+a,y+b)){seen.add(k);q.push([x+a,y+b]);}}}return seen;};
   const s1=reach();pass=true;const s0=reach();pass=false;
   for(const k of keys)if(s0.has(k+'')&&!s1.has(k+''))out.push(id+':'+k);}return out})()`);
  // Loop C: auch die Glutschlucht sperrt keine Figuren mehr (Ausnahme entfernt)
  if (bad.length) throw new Error(bad.slice(0, 8).join(' ')); });
t('Jede Sperre hat davor eine erreichbare Lern-Art (Rolle/Art vor dem Hindernis in Story-Reihenfolge)', () => {
  const r = J(`(()=>{const order=Object.keys(MAPS),out=[];for(const id in FIELDMAP){const at=order.indexOf(id);for(const[x,y,c]of FIELDMAP[id]){const F=FIELD[c];if(!F||!F.move)continue;
   const ok=order.slice(0,at+1).some(mid=>{const E=MAPS[mid].enc;return E&&E.day.concat(E.night).some(e=>fieldLearnable(e[0],F.move))})||[1,4,7].some(s=>fieldLearnable(s,F.move));if(!ok)out.push(id+' '+c);}}return out})()`);
  if (r.length) throw new Error(r.join(', ')); });
t('Früh fangbar: je Feldattacke mind. eine lernfähige Art auf Route 1–3/Windküste', () => {
  const r = J(`(()=>{const maps=['route1','route2','route3','windkueste'],o={};for(const id in FIELD_MOVES){o[id]=[];for(const mid of maps){const E=MAPS[mid].enc;for(const e of E.day.concat(E.night))if(fieldLearnable(e[0],id)&&!o[id].includes(MONS[e[0]].n+'@'+mid))o[id].push(MONS[e[0]].n+'@'+mid);}}
   return o})()`);
  for (const k in r) { if (!r[k].length) throw new Error(k + ' fehlt'); console.log('   ' + k + ': ' + r[k].slice(0, 4).join(', ')); } });
console.log(`\n${ok} ✓ / ${bad} ✗`); process.exit(bad ? 1 : 0);
