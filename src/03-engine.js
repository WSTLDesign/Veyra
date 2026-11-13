// ===== VEYRA – Engine: Welt, Steuerung, Grafik =====
const $=s=>document.querySelector(s);
const TS=16,VH=11;let VW=15;const SAVEKEY='veyra_save_v1';
const DIRV={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const SOLID=new Set('TR~XWChPMALBKDGQ'.split(''));
const BUILD='hPMAL';
const ROOF={h:'#a0583a',P:'#d24d4d',M:'#3b78c9',A:'#c9952e',L:'#2a9d8f'};
const PAL={
 default:{g:'#7fc06a',g2:'#78b863',p:'#dcc792',tg:'#3f8f46',tr:'#2e6b3c',tr2:'#245a31',w:'#3b8fd4',w2:'#6ab0ea',r:'#8d8a84',f:'#f6efe0'},
 snow:{g:'#e6edf4',g2:'#dde6ef',p:'#c3cfdc',tg:'#8fb3c6',tr:'#3f6f7d',tr2:'#eaf3f8',w:'#5c9cc4',w2:'#a6d0ea',r:'#8a96a3',f:'#ffffff'},
 beach:{g:'#eed8a0',g2:'#e8d196',p:'#d9bb78',tg:'#5fa85c',tr:'#3d7a40',tr2:'#2f6332',w:'#2f9ad6',w2:'#7cc8f0',r:'#a39a88',f:'#ff9e8a'},
 swamp:{g:'#5f7a52',g2:'#5a744d',p:'#8a7a55',tg:'#3b5537',tr:'#2a3c29',tr2:'#1f2e1f',w:'#3f625c',w2:'#5d8a80',r:'#6b6a5f',f:'#c9a0e0'},
 cave:{g:'#6e5c4b',g2:'#685645',p:'#7a6754',tg:'#54443a',tr:'#3a2f27',tr2:'#2c231d',w:'#2f5a7a',w2:'#457a9a',r:'#4a3d33',f:'#9fe4f2'},
 inside:{g:'#e7dcc6',g2:'#ddd0b8',p:'#e7dcc6',tg:'#e7dcc6',tr:'#8a6f5a',tr2:'#6e5646',w:'#3b8fd4',w2:'#5aa8e6',r:'#9a9088',f:'#fff'}
};
let G=null,cur=null,mode='title',held=null,lastT=0,clockAcc=0,anim=0;
const P={x:0,y:0,px:0,py:0,dir:'down',moving:false,t:0,fx:0,fy:0,step:0,state:'walk',alt:0,roll:0,lean:0};/* state/alt/roll/lean: 17-move.js */
const cache={};
const cv=$('#world'),cx=cv.getContext('2d');

// ---------- Kreaturen ----------
function stat(m,k){const b=MONS[m.s].b,i={hp:0,atk:1,def:2,spd:3}[k];
 return k==='hp'?Math.floor(2*b[0]*m.l/100)+m.l+10:Math.floor(2*b[i]*m.l/100)+5;}
function mk(s,l){const m={s,l,xp:l*l*l,hp:0,moves:[],known:[]};
 for(const[lv,mv]of MONS[s].ls)if(lv<=l&&!m.known.includes(mv))m.known.push(mv);
 m.moves=m.known.slice(-4).map(id=>({id,pp:MOVES[id][4]}));m.hp=stat(m,'hp');return m;}
function mname(m){return MONS[m.s].n;}
// Titel nach dem Finale (Anzeige): Kronenhüterin/Kronenhüter je nach gewählter Figur
function crownTitle(){return typeof G!=='undefined'&&G&&G.outfit&&G.outfit.body==='heldin'?'Kronenhüterin':'Kronenhüter';}
function healMon(m){m.hp=stat(m,'hp');m.moves.forEach(x=>x.pp=MOVES[x.id][4]);}
function healAll(){G.team.forEach(healMon);}
function isNight(){const h=Math.floor(G.time/60);return h>=20||h<6;}
function seen(s){G.dex.seen[s]=1;}function caught(s){G.dex.seen[s]=1;G.dex.caught[s]=1;}
function addItem(k,n){G.bag[k]=(G.bag[k]||0)+n;}

// ---------- Karten ----------
function getMap(id){if(cache[id])return cache[id];
 const m=MAPS[id]?Object.assign({},MAPS[id]):buildInterior(id);
 const W=Math.max(...m.rows.map(r=>r.length));m.rows=m.rows.map(r=>(r+'T'.repeat(W)).slice(0,W));
 m.links={n:m.n,s:m.s,e:m.e,w:m.w};if(MAPS[id]){const S=MAPS[id];Object.defineProperty(m,'links',{configurable:true,get(){return{n:S.n,s:S.s,e:S.e,w:S.w};}});Object.defineProperty(m,'gate',{configurable:true,get(){return S.gate;},set(v){S.gate=v;}});}m.w=W;m.h=m.rows.length;m.id=id;m.doors=m.doors||{};applyField(m);return cache[id]=m;}
function tileAt(m,x,y){return(y<0||y>=m.h||x<0||x>=m.w)?null:m.rows[y][x];}
function npcHidden(n){if(n.hideIf&&G.flags[n.hideIf])return 1;if(n.vanish&&G.flags[n.flag])return 1;
 if((n.t==='item'||n.t==='legend')&&G.flags[n.flag])return 1;if(n.needLit&&!hasField('lumen'))return 1;if(n.t==='starter'&&G.flags.starter)return 1;return 0;}
function npcs(){return(NPCS[cur.id]||[]).filter(n=>!npcHidden(n));}
function npcAt(x,y){return npcs().find(n=>n.x===x&&n.y===y);}
function blocked(x,y){const t=tileAt(cur,x,y);if(t===null||SOLID.has(t))return true;return!!npcAt(x,y)||!!villAt(x,y);}
function findWalk(x,y){const q=[[x,y]],s=new Set();while(q.length){const[a,b]=q.shift();const k=a+','+b;if(s.has(k))continue;s.add(k);
 if(a>=0&&b>=0&&a<cur.w&&b<cur.h&&!blocked(a,b))return[a,b];if(s.size>400)break;
 for(const d of Object.values(DIRV))q.push([a+d[0],b+d[1]]);}return[x,y];}
function exitSpot(m){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(t==='E'||m.doors[t]==='@out')return[x,y-1];}return[1,1];}
function loadMap(id,x,y){cur=getMap(id);G.map=id;
 if(x===undefined){[x,y]=exitSpot(cur);}const[a,b]=findWalk(x,y);P.x=P.fx=a;P.y=P.fy=b;P.px=a;P.py=b;
 $('#hudMap').textContent=cur.name;mapCard(cur);if(typeof moveReset==='function')moveReset();}
function warpBack(){const r=G.ret||{map:'morgenau',x:4,y:5};loadMap(r.map,r.x,r.y);P.dir='down';}

// ---------- Bewegung ----------
function tryMove(dir){P.dir=dir;const[dx,dy]=DIRV[dir],nx=P.x+dx,ny=P.y+dy;
 if(nx<0||ny<0||nx>=cur.w||ny>=cur.h){const key={up:'n',down:'s',left:'w',right:'e'}[dir],to=(cur.links||{})[key];if(!to)return;
  const g=cur.gate&&cur.gate[key];if(g&&!G.flags[g.f]){held=null;say(g.m);return;}
  const t=getMap(to);let tx=nx,ty=ny;if(key==='n')ty=t.h-1;if(key==='s')ty=0;if(key==='e')tx=0;if(key==='w')tx=t.w-1;
  transit(()=>loadMap(to,Math.min(tx,t.w-1),Math.min(ty,t.h-1)),to);return;}
 const rr=roamAt(nx,ny);if(rr&&G.team.some(m=>m.hp>0)){startWild(rr);return;}
 // Untergrund-Regeln (17-move.js): true = begehbar trotz SOLID (Wasser/Klippe), false = gesperrt, {to:[x,y]} = Sprung/Gleitflug
 const mg=typeof moveGate==='function'?moveGate(dir,nx,ny):null;if(mg===false){bump();return;}
 if(mg&&mg.to){P.fx=P.x;P.fy=P.y;P.x=mg.to[0];P.y=mg.to[1];P.moving=true;P.t=0;P.step^=1;compFollow(P.fx,P.fy);return;}
 if(mg!==true&&blocked(nx,ny)){const fz=FIELD[tileAt(cur,nx,ny)];if(fz)toast(fz.name+' · A drücken');bump();return;}
 P.fx=P.x;P.fy=P.y;P.x=nx;P.y=ny;P.moving=true;P.t=0;P.step^=1;compFollow(P.fx,P.fy);}
function onStep(){const t=tileAt(cur,P.x,P.y);if(typeof moveLanded==='function')moveLanded(t);
 if(cur.doors[t]){const d=cur.doors[t];if(d==='@out'){transit(warpBack,G.ret&&G.ret.map);return;}
  G.ret={map:cur.id,x:P.x,y:P.y+1};transit(()=>{loadMap(d);P.dir='up';},d);return;}
 if(t==='E'){transit(warpBack,G.ret&&G.ret.map);return;}
 if(checkTrainers())return;
 // Versteckte Begegnungen (hohes Gras + Schwimmen) laufen über 17-move.js moveEncounter – zusätzlich zu den sichtbaren Kreaturen (04-roam)
 if(typeof moveEncounter==='function'&&moveEncounter(t))return;
 if(typeof moveEncounter!=='function'&&(t==='"'||t===':')&&cur.enc&&G.team.length&&Math.random()<.08){const L=isNight()?cur.enc.night:cur.enc.day;
  const e=L[Math.floor(Math.random()*L.length)];const lv=e[1]+Math.floor(Math.random()*(e[2]-e[1]+1));
  held=null;startBattle({wild:mk(e[0],lv)});}}
function checkTrainers(){for(const n of npcs()){if(n.t!=='trainer'||!n.d||G.flags[n.flag])continue;
 const[dx,dy]=DIRV[n.d];for(let i=1;i<=4;i++){const x=n.x+dx*i,y=n.y+dy*i;const t=tileAt(cur,x,y);if(t===null||SOLID.has(t))break;
  if(x===P.x&&y===P.y){held=null;n.alert=1;setTimeout(()=>{n.alert=0;P.dir=opp(n.d);say(n.pre,()=>startBattle({trainer:n}));},450);mode='wait';return true;}
  if(npcAt(x,y))break;}}return false;}
function opp(d){return{up:'down',down:'up',left:'right',right:'left'}[d];}

// ---------- Interaktion ----------
function interact(){const[dx,dy]=DIRV[P.dir];let n=npcAt(P.x+dx,P.y+dy);
 if(!n&&tileAt(cur,P.x+dx,P.y+dy)==='C')n=npcAt(P.x+2*dx,P.y+2*dy);if(n)return talk(n);const ft=tileAt(cur,P.x+dx,P.y+dy);if(FIELD[ft])return fieldUse(P.x+dx,P.y+dy,ft);const rr=roamAt(P.x+dx,P.y+dy);if(rr)return startWild(rr);const vv=villAt(P.x+dx,P.y+dy);if(vv){vv.dir=opp(P.dir);vv.next=performance.now()+4000;say(villLine());}}
function talk(n){if(n.d!==undefined||n.t==='talk'||n.t==='nurse'||n.t==='shop')n.face=opp(P.dir);
 switch(n.t){
 case 'talk':
  if(n.prof)return say(!G.flags.starter?['Prof. Lindqvist: Da bist du ja! Willkommen in der Welt der Kreaturen von Veyra.','Auf dem Tisch liegen drei Kapseln. Wähle deinen ersten Partner!']
   :!G.flags.firstcatch?['Prof. Lindqvist: Schwäche wilde Kreaturen im hohen Gras und wirf dann eine Kapsel. Auf Route 1 im Norden geht es los!']
   :G.flags.champion?['Prof. Lindqvist: Du trägst die Kristallkrone! Schau mal in deinen Kreaturendex – findest du alle '+NMON+'?']:['Prof. Lindqvist: Die erste Arena liegt in Kupferhain. Viel Erfolg!','Übrigens: Kreaturen helfen dir auch außerhalb von Kämpfen. Stell dich vor eine Dornenhecke, Geröll oder offenes Wasser und drück A!']);
  if(n.collector){const c=Object.keys(G.dex.caught).length;
   if(G.flags.collector)return say('Sammler: Danke nochmal! Deine Sammlung ist beeindruckend.');
   if(c>=15){G.flags.collector=1;addItem('ultra',5);addItem('elixier',3);return say(['Sammler: '+c+' verschiedene Kreaturen! Fantastisch!','Du erhältst 5× Sternkapsel und 3× Wesensessenz.']);}
   return say(['Sammler: Ich sammle Geschichten über Kreaturen. Zeig mir 15 verschiedene gefangene Kreaturen!','Bisher hast du '+c+'.']);}
  if(n.heal){healAll();G.respawn={...G.ret};}
  return say(n.txt);
 case 'nurse':return ask('Willkommen in der Kreaturenstation! Sollen wir deine Kreaturen heilen?',['Ja, bitte','Nein'],i=>{
  if(i)return;healAll();sfx('heal');vib(30);G.respawn={...G.ret};save();say('Deine Kreaturen sind wieder topfit. Dein Spielstand wurde gespeichert.');});
 case 'shop':return openShop(INTERIORS[cur.id].stock);
 case 'starter':{const M=MONS[n.mon];return ask(`${M.n} · ${M.t.map(t=>TYPES[t].n).join('/')}\n${M.d}\nMöchtest du ${M.n} wählen?`,['Ja','Nein'],i=>{
  if(i)return;G.team.push(mk(n.mon,5));caught(n.mon);G.flags.starter=1;addItem('kapsel',5);addItem('trank',3);
  say(['Du hast '+M.n+' gewählt!','Prof. Lindqvist: Nimm auch 5 Kapseln und 3 Kräutertränke mit. Auf Route 1 im Norden kannst du wilde Kreaturen fangen!']);});}
 case 'legend':{const ok=G.flags[n.req]&&!(n.day&&isNight())&&!(n.night&&!isNight());
  if(!ok)return say(n.txt);const M=MONS[n.mon];return say(['Ein gewaltiges Brüllen hallt durch die Luft…',M.n+' erscheint!'],()=>startBattle({wild:mk(n.mon,n.lvl),legend:n}));}
 case 'item':case 'scroll':case 'hidden':case 'sparkle':if(typeof FINDS!=='undefined'&&(FINDS[n.f]||FINDS[n.t]))return pickFind(n);G.flags[n.flag]=1;addItem(n.item,n.n);return say(`Du hast ${n.n}× ${ITEMS[n.item].n} gefunden!`);
 case 'trainer':if(G.flags[n.flag])return say(n.post);return say(n.pre,()=>startBattle({trainer:n}));}}

// ---------- Dialoge ----------
let dlgQ=[],dlgCb=null;
function say(l,cb){dlgQ=[].concat(l);dlgCb=cb||null;mode='dialog';$('#dlgOpts').innerHTML='';showDlg();}
function setDlg(s){const m=s.match(/^([^:\n]{2,30}): ([\s\S]*)$/);$('#dlgName').hidden=!m;if(m)$('#dlgName').textContent=m[1];TW=typeInto($('#dlgText'),m?m[2]:s,false,voiceOf(m?m[1]:'Erzähler'));}
function showDlg(){$('#dlg').hidden=false;setDlg(dlgQ[0]);$('#dlgMore').hidden=false;}
function advDlg(){if(TW&&!TW.done()){TW.finish();return;}if($('#dlgOpts').children.length)return;sfx('tap');dlgQ.shift();if(dlgQ.length)return showDlg();
 $('#dlg').hidden=true;mode='world';const c=dlgCb;dlgCb=null;c&&c();}
function ask(q,opts,cb){mode='dialog';$('#dlg').hidden=false;setDlg(q);$('#dlgMore').hidden=true;
 const o=$('#dlgOpts');o.innerHTML='';opts.forEach((t,i)=>{const b=document.createElement('button');b.textContent=t;
  b.onclick=e=>{e.stopPropagation();o.innerHTML='';$('#dlg').hidden=true;mode='world';cb(i);};o.appendChild(b);});}
let toastT=0;function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),1600);}

// ---------- Hauptschleife: Drosselung & Pause (Look L1) ----------
// Die Schleife `loop` steht in 15-ui.js; 43-perf.js umhüllt sie und fragt hier: loopGate(t) → true = Frame ausführen.
// Verdeckter Tab: kein Frame, die Schleife ruht, bis die Seite wieder sichtbar ist (dann ein Neustart ohne dt-Sprung).
// Menü, Dialog, Titel, Laden: höchstens LOOP.idleFps (30) – die Welt dahinter bewegt sich kaum, der Akku dankt.
const LOOP={paused:false,last:0,idleFps:30};
function loopIdle(){return mode==='menu'||mode==='dialog'||mode==='title'||mode==='shop';}
function loopGate(t){if(document.hidden){LOOP.paused=true;return false;}if(loopIdle()&&t-LOOP.last<1000/LOOP.idleFps-2)return false;LOOP.last=t;return true;}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&LOOP.paused&&typeof loop==='function'){LOOP.paused=false;lastT=0;requestAnimationFrame(loop);}});
