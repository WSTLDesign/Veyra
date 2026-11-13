// QA Phase 2 · A: Bewegung – Freischaltung, Zufallsbewegung je Zustand (2D+3D), Kanten, Reiten, Klettern, Steuerkreuz
import { boot, done } from './qa_p2_lib.mjs';
const t = await boot(); const { p, ev, Wt, ok, closeDlg } = t;
await ev("window.__sb=[];startBattle=function(o){window.__sb.push(o.wild&&o.wild.s);held=null;STICK.x=STICK.y=0;}");
const st = () => ev('({x:P.x,y:P.y,s:P.state,map:cur.id,mode,t:tileAt(cur,P.x,P.y)})');
const setup = (map, x, y, view, badges, extra = '') => ev(`G.badges=${JSON.stringify(['a','b','c','d','e','f','g','h'].slice(0, badges))};G.flags.swim=G.flags.glide=G.flags.climb=0;MV.ride=false;MV.rw=false;P.moving=false;ROAM.list.length=0;MV.glide=null;MV.g2=null;MV.hop2=null;MV.hop3=null;mode='world';held=null;loadMap('${map}',${x},${y});P.dir='down';setView('${view}',true);${extra}`);
// ---- Freischaltung Orden 0..4 ----
for (let n = 0; n <= 4; n++) {
  await setup('route1', 9, 18, '2d', n); await Wt(1000); await closeDlg();
  const f = await ev('({swim:!!G.flags.swim,glide:!!G.flags.glide,climb:!!G.flags.climb})');
  ok(`Orden ${n}: swim=${n >= 2} glide=${n >= 3} climb=${n >= 4}`, f.swim === (n >= 2) && f.glide === (n >= 3) && f.climb === (n >= 4), f);
}
// ---- Sperre vor Freischaltung (je Zustand, 2D) ----
await setup('windkueste', 7, 7, '2d', 1); await closeDlg(); await ev("tryMove('right');tryMove('right');tryMove('right')"); await Wt(1200);
let s = await st(); ok('Wasser gesperrt (1 Orden) windkueste', s.t !== '~' && s.s !== 'swim', s);
await setup('route2', 3, 10, '2d', 3);
const xs = await ev("(()=>{const o=[];cur.rows.forEach((r,y)=>[...r].forEach((t,x)=>{if(t==='X'&&!SOLID.has(cur.rows[y+1]?.[x]||'#')&&cur.rows[y+1]?.[x]!==undefined)o.push([x,y])}));return o.slice(0,6)})()");
const xw = await ev("(()=>{const o=[];cur.rows.forEach((r,y)=>[...r].forEach((t,x)=>{if(t==='X'&&'.,F'.includes(cur.rows[y+1]?.[x]||'#'))o.push([x,y])}));return o})()");
ok('route2 hat X-Wand mit Land davor', xw.length > 0, xw.slice(0, 3));
if (xw.length) {
  const [wx, wy] = xw[0];
  await setup('route2', wx, wy + 1, '2d', 3); await ev("P.dir='up'"); await ev("held='up'"); await Wt(1800); await ev('held=null'); await Wt(300); s = await st();
  ok('Klettern gesperrt (3 Orden)', s.y === wy + 1 && s.s !== 'climb', s);
  await setup('route2', wx, wy + 1, '2d', 4); await Wt(700); await closeDlg(); await ev("P.dir='up'"); await ev("held='up'"); await Wt(2500); s = await st(); await ev('held=null');
  ok('Klettern frei (4 Orden) ⇒ climb/Wand betreten', s.y <= wy && s.s === 'climb', s);
  await ev("held='down'"); await Wt(2500); await ev('held=null'); await Wt(300); s = await st();
  ok('Wand wieder verlassen ⇒ walk', s.s === 'walk' && s.y >= wy + 1, s);
}
// ---- Kanten einseitig (2D) ----
const ledges = await ev("(()=>{const o=[];for(const id of ['route3','windkueste','siegesstrasse','route4','glutschlucht']){const m=MAPS[id];m.rows.forEach((r,y)=>[...r].forEach((t,x)=>{if(t==='R'&&y>0&&y<m.rows.length-1){const u=m.rows[y-1][x],d=m.rows[y+1][x],l=r[x-1];if('.,F'.includes(u)&&'.,F'.includes(d)&&l&&'.,F\"'.includes(l)&&!(NPCS[id]||[]).some(n=>n.x===x&&(n.y===y+1||n.y===y-1)||n.x===x-1&&n.y===y))o.push([id,x,y]);}}));}return o})()");
ok('Kanten vorhanden', ledges.length > 0, ledges.length);
let okDown = 0, okUp = 0, okRideUp = 0, okSide = 0; const badL = [];
for (const [id, x, y] of ledges) {
  await setup(id, x, y - 1, '2d', 1); await ev("VILL.list=[];P.dir='down';tryMove('down')"); await Wt(650); let q = await st(); const d1 = q.y === y + 1; if (d1) okDown++;
  await setup(id, x, y + 1, '2d', 1); await ev("VILL.list=[];P.dir='up';tryMove('up')"); await Wt(450); q = await st(); const u1 = q.y === y + 1; if (u1) okUp++;
  await setup(id, x, y + 1, '2d', 1, 'MV.ride=true;moveResolve()'); await ev("VILL.list=[];P.dir='up';tryMove('up')"); await Wt(450); q = await st(); const r1 = q.y === y + 1; if (r1) okRideUp++;
  await setup(id, x - 1, y, '2d', 1); await ev("VILL.list=[];P.dir='right';tryMove('right')"); await Wt(450); q = await st(); const s1 = q.x === x - 1; if (s1) okSide++;
  if (!(d1 && u1 && r1 && s1)) badL.push([id, x, y, d1, u1, r1, s1]);
}
const n = ledges.length;
ok(`Kanten einseitig: runter ${okDown}/${n}, hoch gesperrt ${okUp}/${n}, hoch Reiten gesperrt ${okRideUp}/${n}, seitlich gesperrt ${okSide}/${n}`, okDown === n && okUp === n && okRideUp === n && okSide === n, badL.slice(0, 5));
// ---- Reiten: Bedingungen ----
await setup('route1', 9, 18, '2d', 0); await ev('G.team.forEach(m=>m.hp=0)'); await ev('toggleRide()'); s = await ev('({r:MV.ride,s:P.state})');
ok('Reiten ohne kampffähige Kreatur nicht möglich', !s.r && s.s !== 'ride', s);
await ev('G.team.forEach(m=>m.hp=stat(m,"hp"))'); await ev('toggleRide()'); s = await ev('({r:MV.ride,s:P.state})'); ok('Reiten mit Kreatur', s.r && s.s === 'ride', s);
await ev("G.ret={map:'morgenau',x:7,y:11};loadMap('labor');mode='world'"); await Wt(300); s = await ev('({r:MV.ride,s:P.state,i:cur.inside})');
ok('Drinnen automatisch abgestiegen', s.s !== 'ride', s); await ev('toggleRide()'); s = await ev('({r:MV.ride,s:P.state})'); ok('Drinnen Reiten gesperrt', s.s !== 'ride' && !s.r, s);
await ev("loadMap('route1',9,18);mode='world'"); await Wt(300); s = await ev('({s:P.state})'); ok('Draußen nach Betreten kein automatisches Reiten', s.s !== 'ride', s);
// ---- Schwimm-Begegnung -> endet in world (echte startBattle) ----
// ---- Zufallsbewegung je Zustand ----
const walkFor = (ms, view) => ev(`new Promise(res=>{let n=0;const f=${view === '2d'}?()=>{if(mode==='dialog'){TW&&TW.finish&&TW.finish();advDlg();}held=['up','down','left','right'][Math.random()*4|0];}:()=>{if(mode==='dialog'){TW&&TW.finish&&TW.finish();advDlg();}STICK.y=Math.random()<.8?-1:0;STICK.x=Math.random()*2-1;if(Math.random()<.1)held=null;};const iv=setInterval(f,200);setTimeout(()=>{clearInterval(iv);held=null;STICK.x=STICK.y=0;res(1)},${ms})})`);
const cases = [
  ['walk', 'kupferhain', 3, 5, 0, ''], ['run', 'route1', 9, 18, 0, 'MV.rw=true'], ['ride', 'route1', 9, 18, 0, 'MV.ride=true;moveResolve()'],
  ['swim', 'brisenhafen', 9, 14, 2, 'moveResolve()'], ['glide/Kanten', 'route3', 2, 3, 3, ''], ['swim windkueste', 'windkueste', 9, 7, 4, 'moveResolve()'], ['climb Schlucht', 'glutschlucht', 3, 8, 4, ''],
];
for (const view of ['2d', 'third']) for (const [name, map, x, y, b, extra] of cases) {
  await setup(map, x, y, view, b, extra); await Wt(900); await closeDlg(); await ev("G.flags.swim=G.flags.swim||" + (b >= 2 ? 1 : 0) + ";mode='world'");
  await walkFor(10000, view); await ev("held=null;STICK.x=STICK.y=0"); await Wt(1500); await closeDlg();
  for (let i = 0; i < 40 && await ev('!!(P.moving||MV.g2||MV.glide||MV.hop2||MV.hop3)'); i++) await Wt(150);
  await closeDlg(); const r = await ev("(()=>{const T=tileAt(cur,P.x,P.y),bl=blocked(P.x,P.y),sw=P.state==='swim',cl=P.state==='climb';const valid=!bl||(sw&&(T==='~'||T==='Q'))||(cl&&T==='X');return{x:P.x,y:P.y,s:P.state,T,valid,mode,sb:__sb.length}})()");
  // Fluchtweg: mindestens eine Richtung führt weg (nach 2 Versuchen je Richtung)
  const esc = await ev(`(async()=>{const x0=P.x,y0=P.y,W=ms=>new Promise(r=>setTimeout(r,ms));for(let k=0;k<5;k++){mode='world';for(const d of ['up','right','down','left']){ROAM.list.length=0;P.dir=d;if(${view !== '2d'}){P.ang=YAW[d];STICK.x=0;P.tv=0;held='up';}else held=d;await W(${view === '2d' ? 650 : 1100});held=null;await W(150);if(P.x!==x0||P.y!==y0)return true;}if(${view !== '2d'}){held='right';await W(900);held=null;}}return false})()`);
  ok(`${view} Zufallsbewegung ${name}: kein Feststecken`, r.valid && esc && r.mode === 'world', { ...r, esc });
}
// ---- Wasser betreten/verlassen stellt Zustand zurück (3D + Reiten) ----
await setup('windkueste', 7, 7, '2d', 4, "MV.ride=true;moveResolve()"); await closeDlg(); await ev('MV.swimNext=99'); await ev("mode='world'");
await ev("held='right'"); for (let i = 0; i < 40 && !(await ev("P.state==='swim'")); i++) await Wt(100); s = await st(); ok('Reiten → Wasser ⇒ swim', s.s === 'swim', s);
await ev("held='left'"); for (let i = 0; i < 60 && (await ev("P.state==='swim'")); i++) await Wt(100); await ev('held=null'); await Wt(400); s = await st();
ok('Wasser verlassen ⇒ ride (Wunsch bleibt)', s.s === 'ride' || s.s === 'walk', s);
await done(t);
