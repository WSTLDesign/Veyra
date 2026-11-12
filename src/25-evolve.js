// ===== VEYRA – Entwicklung, Level-up, Heilstation (Agent F) =====
// Datenformat: MONS[i].evolutions=[{method,value,into,minL?}] – into = Art-ID oder Name (Name ⇒ Art wird erst gesucht; fehlt sie, wird der Eintrag übersprungen).
// Methoden: level | item (Element-Kristall, nicht abbrechbar) | trade (m.traded, value=getragenes Item|null) | friendship {min,time} | location (Karten-ID)
//  | held {item,time} | move (Attacken-ID) | gender {g,l} | special {use,n} (m.useCount) / {crits} (Volltreffer in einem Kampf)
// Schnittstellen: canEvolve(m,ctx)→{into,method,def}|null, evolve(m,cb,opts) (ersetzt), evolveNow(m), onTraded(m), evoList(id), SEQ.evolve/levelUp/heal/healitem
// Dex-Kanon (Agent A1): Jede Kanon-Linie ist immer per Level erreichbar (MONS[i].ev). Sonderwege = Abkürzung oder Zweig („Tareks Experimente“):
// Kristall (item), Freundschaft (+Tageszeit), Ort, Getragen (+Tageszeit), Attacke, Geschlecht, Tausch, Spezial-Training.
const EVO_DEF={
 28:[{method:'item',value:'lichtstein',into:29}],                                                    // Lumli + Lichtstein → Glimma (früher)
 31:[{method:'item',value:'dunkelstein',into:32},{method:'special',value:{use:'kralle',n:20},into:32}], // Dumbi
 37:[{method:'location',value:'moewenbucht',into:38}],                                               // Muschel am Meer → Perlo
 61:[{method:'friendship',value:{min:160,time:'day'},into:62},{method:'item',value:'lichtstein',into:62}], // Blinki
 72:[{method:'item',value:'donnerstein',into:73},{method:'held',value:{item:'lichtstein',time:'day'},into:123},{method:'special',value:{crits:3},into:73}], // Knips (+Zweig Glanzfell)
 75:[{method:'item',value:'froststein',into:124}],                                                   // Frosti + Froststein → Eisfee (Zweig)
 90:[{method:'item',value:'blattstein',into:91},{method:'gender',value:{g:'m',l:16},into:91}],        // Moosel
 22:[{method:'trade',value:null,into:23}],                                                           // Kiesel: Tausch → Brummit
 105:[{method:'friendship',value:{min:160,time:'day'},into:106}],                                    // Kitzli (Elowen)
 112:[{method:'held',value:{item:'dunkelstein',time:'night'},into:113}],                             // Knabbi
 114:[{method:'move',value:'blitzsprung',into:115}],                                                 // Zippi
 116:[{method:'friendship',value:{min:160,time:'night'},into:117}],                                  // Huschu
 // Wölki: Wolkenlamm mit vier Endformen je Methode
 118:[{method:'location',value:'frostheim',into:120},{method:'item',value:'lichtstein',into:122},{method:'held',value:{item:'glutkern',time:'day'},into:121}],
 129:[{method:'trade',value:null,into:130}],                                                         // Kannli: Tausch → Teekrug
 131:[{method:'special',value:{use:'funken',n:15},into:132}],                                        // Dochti
 135:[{method:'held',value:{item:'dunkelstein',time:'night'},into:136}],                             // Flatti
 137:[{method:'location',value:'frostheim',into:138}]};                                              // Otti im Eis
// Bestehende ev übersetzen + Zusatzmethoden; ev bleibt unverändert für Altcode
function evoFromEv(M){const L=[];if(M&&M.ev){if(M.ev.l)L.push({method:'level',value:M.ev.l,into:M.ev.to});if(M.ev.s)L.push({method:'item',value:M.ev.s,into:M.ev.to});}return L;}
for(let i=1;i<MONS.length;i++){const M=MONS[i];if(!M)continue;const L=(EVO_DEF[i]||[]).slice();
 for(const e of evoFromEv(M))if(!L.some(x=>x.method===e.method&&JSON.stringify(x.value)===JSON.stringify(e.value)&&x.into===e.into))L.push(e);
 // Level-Methode immer zuletzt (Sonderwege haben Vorrang)
 L.sort((a,b)=>(a.method==='level')-(b.method==='level'));M.evolutions=L;}
function evoList(id){const M=MONS[id];if(!M)return[];return Array.isArray(M.evolutions)?M.evolutions:evoFromEv(M);}
const EVO_NAME={};function resolveInto(into){if(typeof into==='number')return MONS[into]?into:null;if(typeof into!=='string')return null;
 if(EVO_NAME[into]&&MONS[EVO_NAME[into]]&&MONS[EVO_NAME[into]].n===into)return EVO_NAME[into];const i=MONS.findIndex(M=>M&&M.n===into);if(i>0){EVO_NAME[into]=i;return i;}return null;}
function evoMap(){if(!cur)return null;return cur.inside?(G.ret&&G.ret.map)||cur.id:cur.id;}
function evoTimeOk(t){if(!t)return true;const n=isNight();return t==='night'?n:t==='day'?!n:true;}
function knowsMove(m,id){return(m.moves||[]).some(x=>x.id===id)||(m.known||[]).includes(id);}
// ctx.trigger: level (nach Level-up) | item (mit ctx.item) | trade | battleEnd | any (Chronik/manuell)
function canEvolve(m,ctx){ctx=ctx||{};if(!m||!MONS[m.s])return null;const tr=ctx.trigger||'any',fr=m.friendship??70;
 if(tr==='level'&&m._evoNo===m.l)return null;
 for(const d of evoList(m.s)){const into=resolveInto(d.into);if(!into)continue;if(d.minL&&m.l<d.minL)continue;const v=d.value;let ok=false;
  if(tr==='item'){if(d.method==='item'&&ctx.item===v)ok=true;}
  else if(tr==='trade'){if(d.method==='trade'&&m.traded&&(!v||m.heldItem===v))ok=true;}
  else if(tr==='battleEnd'){if(d.method==='special')ok=evoSpecial(m,v,ctx);}
  else{const any=tr==='any';
   switch(d.method){
    case'level':ok=m.l>=v;break;
    case'trade':ok=any&&!!m.traded&&(!v||m.heldItem===v);break;
    case'friendship':ok=fr>=(v.min||220)&&evoTimeOk(v.time);break;
    case'location':ok=(ctx.map||evoMap())===v;break;
    case'held':ok=m.heldItem===v.item&&evoTimeOk(v.time);break;
    case'move':ok=knowsMove(m,v);break;
    case'gender':ok=m.gender===v.g&&m.l>=(v.l||1);break;
    case'special':ok=evoSpecial(m,v,ctx);break;}}
  if(ok)return{into,method:d.method,def:d};}
 return null;}
function evoSpecial(m,v,ctx){if(!v)return false;if(v.use)return((m.useCount||{})[v.use]||0)>=(v.n||20);
 if(v.crits){const c=ctx.crits??(B&&B._critBy?B._critBy.get(m)||0:0);return c>=v.crits;}return false;}

// ---------- Entwicklung ausführen (ersetzt evolve aus 14-battle.js) ----------
function sayP(l){return new Promise(r=>say(l,r));}
function evolve(m,cb,opts){opts=opts||{};let c=opts.into?{into:opts.into,method:opts.method||'item'}:opts.item?canEvolve(m,{trigger:'item',item:opts.item}):(m._evoQ||canEvolve(m,{trigger:'level'})||canEvolve(m,{trigger:'battleEnd'}));
 delete m._evoQ;if(!c||!MONS[c.into]){cb&&cb();return;}runEvolution(m,c,opts).catch(e=>console.error('Entwicklung',e)).then(()=>cb&&cb());}
async function runEvolution(m,c,opts){const fromN=mname(m),from=m.s,cancel=c.method!=='item'&&!opts.noCancel;
 if(typeof closeMenu==='function'&&!$('#menu').hidden)closeMenu();mode='wait';held=null;
 const r=await playSeq('evolve',{mon:m,from,into:c.into,cancel,method:c.method})||{};
 if(r.cancelled){m._evoNo=m.l;mode='world';await sayP(fromN+' hat aufgehört, sich zu entwickeln.');return false;}
 const ratio=m.hp/Math.max(1,stat(m,'hp')),A0=MONS[from],A1=MONS[c.into];if(m.ability&&A1.abilities){if(A0.hiddenAbility&&m.ability===A0.hiddenAbility&&A1.hiddenAbility)m.ability=A1.hiddenAbility;else{const ix=Math.max(0,(A0.abilities||[A0.ab]).indexOf(m.ability));m.ability=A1.abilities[Math.min(ix,A1.abilities.length-1)]||A1.ab;}}m.s=c.into;m.hp=m.hp>0?Math.max(1,Math.round(stat(m,'hp')*ratio)):0;delete m._evoNo;
 if((c.method==='trade'||c.method==='held')&&c.def&&c.def.value&&(c.def.value.item||c.def.value)===m.heldItem)m.heldItem=null;
 const nw=!G.dex.caught[c.into];caught(c.into);if(nw&&typeof dexNew==='function')dexNew(c.into);
 const fresh=[];for(const[lv,mv]of MONS[m.s].ls||[]){if(lv<=m.l&&!m.known.includes(mv)){m.known.push(mv);if(lv===m.l||lv===1)fresh.push(mv);}}
 mode='world';if(r.error||r.skipped)await sayP('Glückwunsch! '+fromN+' hat sich zu '+mname(m)+' entwickelt!');
 for(const mv of fresh)if(!m.moves.some(x=>x.id===mv))await learnMove(m,mv);
 if(mode==='wait')mode='world';return true;}
function evolveNow(m){const c=canEvolve(m,{trigger:'any'});if(!c){toast(mname(m)+' kann sich gerade nicht entwickeln');return false;}m._evoQ=c;evolve(m,()=>{});return true;}
function onTraded(m,cb){m.traded=1;const c=canEvolve(m,{trigger:'trade'});if(!c){cb&&cb();return false;}m._evoQ=c;evolve(m,cb);return true;}

// ---------- Attacken lernen (Ersetzen per Auswahl) ----------
function bChoice(q,opts){return new Promise(res=>{const wb=B&&B.busy;if(B)B.busy=true;hideB();const bm=$('#bMenu');bm.classList.add('rlist');$('#bLog').textContent=q;opts.forEach((t,i)=>btn(t,'mv lchoice',()=>{hideB();if(B)B.busy=wb;res(i);}));});}
function askP(q,opts){return new Promise(res=>ask(q,opts,res));}
async function learnMove(m,mv){const X=MOVES[mv];if(!X)return;if(m.moves.some(x=>x.id===mv))return;
 if(m.moves.length<4){m.moves.push({id:mv,pp:X[4]});if(B)await msg(mname(m)+' hat '+X[0]+' gelernt!');else await sayP(mname(m)+' hat '+X[0]+' gelernt!');sfx('lvlUp');return true;}
 const q=mname(m)+' möchte '+X[0]+' lernen, kennt aber schon 4 Attacken. Welche soll es vergessen?',L=[...m.moves.map(x=>MOVES[x.id][0]),'Nicht lernen'];
 const vis=B&&!$('#battle').hidden,i=vis?await bChoice(q,L):await askP(q,L);
 if(i>=4){if(vis)await msg(mname(m)+' hat '+X[0]+' nicht gelernt.',900);else await sayP(mname(m)+' hat '+X[0]+' nicht gelernt.');return false;}
 const old=MOVES[m.moves[i].id][0];m.moves[i]={id:mv,pp:X[4]};const t='1, 2 und … Schwupp! '+mname(m)+' hat '+old+' vergessen und '+X[0]+' gelernt!';sfx('lvlUp');
 if(vis)await msg(t,1200);else await sayP(t);return true;}

// ---------- Level-up ----------
function statKeys(m){try{const a=stat(m,'spa'),b=stat(m,'spv');if(isFinite(a)&&isFinite(b))return[['hp','KP'],['atk','Angriff'],['def','Verteidigung'],['spa','Sp.-Angriff'],['spv','Sp.-Vert.'],['spe','Initiative']];}catch(e){}
 return[['hp','KP'],['atk','Angriff'],['def','Verteidigung'],['spd','Initiative']];}
function statsOf(m){const o={};for(const[k]of statKeys(m))o[k]=stat(m,k);return o;}
SEQ.levelUp=async o=>{const m=o.mon;if(!m)return{};const K=statKeys(m),after=o.after||statsOf(m),g=o.gains,before=o.before||(g?Object.fromEntries(K.map(([k])=>[k,after[k]-(g[k]||0)])):statsOf(Object.assign({},m,{l:o.from||Math.max(1,m.l-1)})));
 const gains=Object.fromEntries(K.map(([k])=>[k,(after[k]||0)-(before[k]||0)])),short=SET.banim===0||RED;sfx('lvlUp');vib(12);
 if(B){B.lvFx={who:G.team[B.mi]===m?'me':'foe',t:performance.now()};if(BT&&BT.me&&G.team[B.mi]===m){setExpression(BT.me,'freudig',1600);BT.me.userData.act.hop=performance.now();}}
 const html=`<div class="lvc"><small class="ck">Level-up</small><div class="lvh"><i class="pm"></i><div><h2>${mname(m)}</h2><p class="lvl">Level <b>${o.l||o.level||m.l}</b></p></div></div>
  <div class="lvr">${K.map(([k,n],i)=>`<div class="lvs" style="--d:${i*.07}s"><span>${n}</span><b>${before[k]}</b><em data-g="${gains[k]}">+0</em><strong>${after[k]}</strong></div>`).join('')}</div></div>`;
 if(B&&!$('#battle').hidden&&typeof showCard==='function'){const p=showCard(html,'lvlc',short?1100:2600,el=>capFill(el,m));await p;return{ok:true};}
 // außerhalb des Kampfs: eigene Karte über der Welt
 const ov=document.createElement('div');ov.className='lvOv';ov.innerHTML=html+'<p class="cnext">Tippen zum Fortfahren</p>';($('#screen')||document.body).appendChild(ov);capFill(ov,m);
 await new Promise(r=>{let done=0;const f=()=>{if(done)return;done=1;ov.remove();r();};setTimeout(f,short?1100:2600);setTimeout(()=>ov.addEventListener('pointerdown',f),350);});return{ok:true};};
// Kartenbild über cardPic (24-capture: fester Canvas, Platzhalter + Nachfüllen); liefert Promise „Bild steht“ für showCard
function capFill(el,m){const pm=el.querySelector('.pm');let ready=null;if(pm&&typeof mini==='function'){const pic=mini(m.s,56,false,{shiny:m.shiny,card:true});pm.appendChild(pic);ready=pic.ready||null;}
 el.querySelectorAll('.lvs em').forEach((e,i)=>{const n=+e.dataset.g;if(RED||SET.banim===0){e.textContent='+'+n;return;}let v=0;const st=()=>{if(!e.isConnected)return;e.textContent='+'+v;if(v<n){v++;setTimeout(st,Math.max(25,220/Math.max(1,n)));}else e.classList.add('done');};setTimeout(st,260+i*90);});return ready;}
// ersetzt giveXp (14 ruft levelUp, lernt aber ohne Ersetzen-Dialog); Freundschaft +2 je Level
giveXp=async function(m,x){if(B){B.xl=B.xl||new Map();if(!B.xl.has(m))B.xl.set(m,{l0:m.l,xp0:m.xp,g:0});B.xl.get(m).g+=x;}
 m.xp+=x;await msg(mname(m)+' erhält '+x+' Erfahrungspunkte.');if(B)updB();
 while(m.l<100&&m.xp>=(m.l+1)**3){const before=statsOf(m),old=stat(m,'hp');m.l++;m.hp+=stat(m,'hp')-old;if(B)updB();
  if(typeof addFriend==='function')addFriend(m,friendMul(m)*2);await msg(mname(m)+' erreicht Level '+m.l+'!',900);await playSeq('levelUp',{mon:m,before,after:statsOf(m),l:m.l,level:m.l,from:m.l-1});
  for(const[lv,mv]of MONS[m.s].ls)if(lv===m.l&&!m.known.includes(mv)){m.known.push(mv);await learnMove(m,mv);}
  const c=canEvolve(m,{trigger:'level'});if(c&&B&&B.evo&&!B.evo.includes(m)){m._evoQ=c;B.evo.push(m);}}};

// ---------- Kampf-Hooks: Volltreffer je Kreatur, Attacken-Zähler, Entwicklungs-Kandidaten am Kampfende ----------
const _msgEvo=msg;msg=function(t,f){try{if(B&&typeof t==='string'&&/^(Volltreffer|Kritischer Treffer)/.test(t)&&B.lunge&&B.lunge.who==='me'){const a=G.team[B.mi];B._critBy=B._critBy||new Map();B._critBy.set(a,(B._critBy.get(a)||0)+1);}}catch(e){}return _msgEvo(t,f);};
const _doMoveEvo=doMove;doMove=async function(side,mi){let mv=null,pp0=0,uc0=0,A=null;try{if(B&&side==='me'&&mi>=0){A=G.team[B.mi];mv=A&&A.moves[mi];if(mv){pp0=mv.pp;A.useCount=A.useCount||{};uc0=A.useCount[mv.id]||0;}}}catch(e){}
 const r=await _doMoveEvo(side,mi);try{if(mv&&mv.pp<pp0&&(A.useCount[mv.id]||0)===uc0)A.useCount[mv.id]=uc0+1;}catch(e){}return r;};
const _endBattleEvo=endBattle;endBattle=function(res){try{if(B&&res!=='lose'){B.evo=(B.evo||[]).filter(m=>{if(m._evoQ)return true;const c=canEvolve(m,{trigger:'level'});if(c){m._evoQ=c;return true;}return false;});
  for(const m of G.team){if(B.evo.includes(m)||m.hp<=0&&!m._evoQ)continue;const xl=B.xl&&B.xl.get(m),up=xl&&m.l>xl.l0;const c=up?canEvolve(m,{trigger:'level'}):canEvolve(m,{trigger:'battleEnd'});if(c){m._evoQ=c;B.evo.push(m);}}}}catch(e){console.error(e);}
 return _endBattleEvo(res);};

// ---------- Chronik: Entwickeln-Knopf im Team-Detail, Kristalle anwenden / tragen lassen ----------
const _rDetailEvo=rDetail;rDetail=function(el){_rDetailEvo(el);try{const L=sel&&sel.box?G.box:G.team,m=sel&&L[sel.i];const act=el.querySelector('.acts');if(!m||!act||sel.box)return;
 const c=canEvolve(m,{trigger:'any'});if(c){const b=document.createElement('button');b.className='evoBtn';b.innerHTML='Entwickeln <small>→ '+MONS[c.into].n+'</small>';b.onclick=()=>evolveNow(m);act.appendChild(b);}
 if(m.heldItem&&ITEMS[m.heldItem]){const b=document.createElement('button');b.textContent=ITEMS[m.heldItem].n+' abnehmen';b.onclick=()=>{addItem(m.heldItem,1);toast(ITEMS[m.heldItem].n+' zurück in die Tasche');m.heldItem=null;rDetail(el);};act.appendChild(b);}}catch(e){}};
const _chooseForEvo=chooseFor;chooseFor=function(k){const it=ITEMS[k];if(!it||it.k!=='stone')return _chooseForEvo(k);const el=$('#mBody');el.innerHTML='<h3>'+it.n+' benutzen für …</h3>';const g=document.createElement('div');g.className='grid';
 G.team.forEach((m,i)=>{const c=canEvolve(m,{trigger:'item',item:k}),cd=card(m,i,false);cd.disabled=!c;if(!c)cd.title='Reagiert nicht auf diesen Kristall';
  cd.onclick=()=>{if(!(G.bag[k]>0))return;G.bag[k]--;closeMenu();evolve(m,()=>{},{item:k});};g.appendChild(cd);});el.appendChild(g);
 el.insertAdjacentHTML('beforeend','<h3>Tragen lassen</h3><p class="muted">Manche Kreaturen verändern sich nur, wenn sie einen Kristall tragen – zu einer bestimmten Tageszeit oder beim Tausch.</p>');const g2=document.createElement('div');g2.className='grid';
 G.team.forEach((m,i)=>{const cd=card(m,i,false);if(m.heldItem===k)cd.disabled=true;cd.onclick=()=>{if(!(G.bag[k]>0))return;if(m.heldItem)addItem(m.heldItem,1);G.bag[k]--;m.heldItem=k;toast(mname(m)+' trägt jetzt '+it.n);sfx('tap');renderMenu();};g2.appendChild(cd);});
 el.appendChild(g2);const b=document.createElement('button');b.className='back';b.textContent='Zurück';b.onclick=renderMenu;el.appendChild(b);};

// ---------- SEQ.evolve: dunkler Raum, Lichtpartikel, weiße Silhouette, Formwechsel, Licht-Burst ----------
let EVR=null;
function evoR3(){if(EVR)return EVR;if(!window.THREE)return null;try{const r=new THREE.WebGLRenderer({alpha:true,antialias:true});r.setClearColor(0,0);r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.12;
 const s=new THREE.Scene();studio(s);const cam=new THREE.PerspectiveCamera(30,1,.1,60);EVR={r,s,cam,white:new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false})};return EVR;}catch(e){return null;}}
SEQ.evolve=async o=>{const m=o.mon,from=o.from??m.s,into=o.into,cancel=!!o.cancel,short=SET.banim===0||RED,M0=MONS[from],M1=MONS[into];if(!M0||!M1)return{error:true};
 try{if(typeof picPrep==='function'){picPrep(from,{shiny:m.shiny});picPrep(into,{shiny:m.shiny});}}catch(e){}// Fangkarte-Fix: Bilder vorher/nachher sofort dekodieren
 const pm=mode;mode='wait';held=null;const ov=document.createElement('div');ov.className='evoOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-live','polite');
 ov.innerHTML='<canvas class="evoBg"></canvas><div class="evoTx"><p></p><small></small><i class="evoHold" aria-hidden="true"></i></div>';document.body.appendChild(ov);
 const bg=ov.querySelector('.evoBg'),tx=ov.querySelector('.evoTx p'),hint=ov.querySelector('.evoTx small'),hr=ov.querySelector('.evoHold'),dpr=Math.min(2,devicePixelRatio||1);
 let W=innerWidth,H=innerHeight;bg.width=W*dpr;bg.height=H*dpr;const c=bg.getContext('2d');c.scale(dpr,dpr);
 const S=seqClock(ov,short?.3:1);let holdT=0,cancelled=false,phase='intro',pk=0,alive=true;
 ov.addEventListener('pointerdown',()=>{holdT=performance.now();});['pointerup','pointercancel','pointerleave'].forEach(e=>ov.addEventListener(e,()=>{holdT=0;}));
 const kd=e=>{if(cancel&&phase==='morph'&&(e.code==='Escape'||e.code==='KeyB'||e.code==='KeyX'))cancelled=true;};document.addEventListener('keydown',kd);
 // 3D (mit 2D-Fallback)
 // Illustrationen (26-art.js) haben Vorrang: dann 2D-Weg mit Bild vorher/nachher
 const useArt=typeof hasArt==='function'&&(hasArt(from)||hasArt(into)),R=useArt?null:evoR3();let o0=null,o1=null,fit=null;
 if(R){try{o0=buildMon3D(from,battleH(from),monOpts(m));o1=buildMon3D(into,battleH(into),monOpts(m));R.s.add(o0,o1);o1.visible=false;const b=new THREE.Box3().setFromObject(o1).union(new THREE.Box3().setFromObject(o0)),sz=b.getSize(new THREE.Vector3());
  const h=Math.max(sz.y,sz.x*.8),cy=b.min.y+sz.y*.5;fit={h,cy};R.r.setPixelRatio(dpr);R.r.setSize(W,H,false);const cv=R.r.domElement;cv.className='evo3';ov.insertBefore(cv,ov.children[1]);
  R.cam.aspect=W/H;R.cam.fov=30;const d=h*.62/Math.tan(15*Math.PI/180)*(W<H?1.25:1);R.cam.position.set(0,cy+h*.12,d);R.cam.lookAt(0,cy,0);R.cam.updateProjectionMatrix();[o0,o1].forEach(x=>x.rotation.y=.35);}catch(e){console.error(e);o0=o1=null;}}
 const types=[...new Set([...M0.t,...M1.t])].map(t=>TYPES[t].c),P=Array.from({length:70},(_,i)=>({a:Math.random()*7,r:.15+Math.random()*.9,s:.3+Math.random(),y:Math.random(),c:types[i%types.length],z:1+Math.random()*2}));
 const off=document.createElement('canvas');off.width=off.height=512;const ox=off.getContext('2d');
 const draw=()=>{if(!alive)return;requestAnimationFrame(draw);const t=performance.now(),cx=W/2,cy=H*.44;
  // Hintergrund dunkel + Lichtpartikel
  const dark=phase==='intro'?Math.min(1,pk*1.4):1;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);const g=c.createRadialGradient(cx,cy,10,cx,cy,Math.max(W,H)*.75);
  g.addColorStop(0,`rgba(40,48,92,${.9*dark})`);g.addColorStop(1,`rgba(6,8,20,${.96*dark})`);c.fillStyle=g;c.fillRect(0,0,W,H);
  const inten=phase==='morph'?1+pk*2:phase==='glow'?1+pk:phase==='burst'||phase==='reveal'?2.5:phase==='done'?.6:.5;
  for(const p of P){p.a+=.004*p.s*inten;p.y=(p.y+.0016*p.s*inten)%1;const rr=Math.min(W,H)*.48*p.r*(phase==='morph'?1-pk*.35:1),x=cx+Math.cos(p.a)*rr,y=cy+Math.sin(p.a)*rr*.6-(p.y-.5)*H*.5;
   c.globalAlpha=Math.min(1,.25+inten*.25)*dark*(.5+.5*Math.sin(t/300+p.a*3));circ(c,x,y,p.z*(phase==='morph'?1+pk:1),p.c);}c.globalAlpha=1;
  // Leuchten hinter der Kreatur
  const gl=phase==='glow'?pk:phase==='morph'?1:phase==='burst'?1:phase==='reveal'?1-pk:0;if(gl>0){const r0=Math.min(W,H)*(.22+.06*Math.sin(t/180)),hg=c.createRadialGradient(cx,cy,0,cx,cy,r0*2);hg.addColorStop(0,`rgba(255,255,255,${.75*gl})`);hg.addColorStop(.4,`rgba(255,240,200,${.35*gl})`);hg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=hg;c.fillRect(0,0,W,H);}
  // Formwechsel: immer schneller zwischen alter und neuer Form
  let showNew=phase==='burst'||phase==='reveal'||phase==='done',sil=phase==='glow'&&pk>.45||phase==='morph'||phase==='burst';
  if(phase==='morph'){const T=(short?1.4:3.2),ph=T*(1.1*pk+5.2*pk*pk*pk);showNew=(ph%1)>.5;}
  if(phase==='cancel'){showNew=false;sil=false;}
  const sc=phase==='morph'?1+Math.sin(t/60)*.03*pk:phase==='reveal'&&!o1?1+Math.sin(pk*Math.PI)*.05:1;
  if(o0&&o1){o0.visible=!showNew;o1.visible=showNew;R.s.overrideMaterial=sil?R.white:null;[o0,o1].forEach(x=>{x.scale.setScalar(x.userData.s0||(x.userData.s0=x.scale.x));x.scale.setScalar(x.userData.s0*sc);});
   const ob=showNew?o1:o0;animMon(ob,t,{});R.r.render(R.s,R.cam);}
  else{// 2D-Fallback: Silhouette über Offscreen-Canvas
   const id=showNew?into:from,sz=Math.min(W,H)*(useArt?.62:.5);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,512,512);if(!(useArt&&drawArt(ox,id,36,30,440,440,false,{shiny:m.shiny})))drawMon(ox,id,256,300,300,false,t);if(sil){ox.globalCompositeOperation='source-atop';ox.fillStyle='#ffffff';ox.fillRect(0,0,512,512);ox.globalCompositeOperation='source-over';}
   c.drawImage(off,cx-sz*sc/2,cy-sz*.6-(sc-1)*sz,sz*sc,sz*sc);}
  // Licht-Burst
  if(phase==='burst'){c.fillStyle=`rgba(255,255,255,${Math.sin(Math.PI*pk)})`;c.fillRect(0,0,W,H);for(let i=0;i<24;i++){const a=i/24*Math.PI*2,d=pk*Math.max(W,H)*.6;c.globalAlpha=1-pk;circ(c,cx+Math.cos(a)*d,cy+Math.sin(a)*d*.7,4,types[i%types.length]);}c.globalAlpha=1;}
  if(phase==='reveal'){for(let i=0;i<10;i++){const a=t/500+i*.63,d=Math.min(W,H)*(.2+.04*Math.sin(t/200+i));capStar(c,cx+Math.cos(a)*d,cy+Math.sin(a)*d*.6,5*(1-pk*.5),'#ffe27a');}}
  // Halten-zum-Abbrechen-Ring
  if(cancel&&phase==='morph'&&holdT){const hk=Math.min(1,(t-holdT)/600);hr.style.setProperty('--k',hk);hr.classList.add('on');if(hk>=1)cancelled=true;}else{hr.classList.remove('on');}};
 draw();
 const ph=async(n,ms)=>{phase=n;const t0=S.now(),d=Math.max(1,ms*S.scale);const iv=setInterval(()=>{pk=Math.min(1,(S.now()-t0)/d);},16);pk=0;await S.wait(ms);clearInterval(iv);pk=1;};
 const until=async(n,ms)=>{phase=n;pk=0;const t0=S.now(),d=ms*S.scale;S.lock=cancel;while(alive){pk=Math.min(1,(S.now()-t0)/d);if(cancelled||pk>=1)break;await new Promise(r=>setTimeout(r,16));}S.lock=false;};
 let out={done:true};
 try{tx.textContent='Hm? '+(m.nickname||M0.n)+' entwickelt sich!';hint.textContent='';
  if(typeof playTheme==='function'){try{playTheme('evolve');}catch(e){sfx('evoTheme');}}else sfx('evoTheme');vib(10);
  await ph('intro',short?300:1300);await ph('glow',short?200:700);
  hint.textContent=cancel?'Halten zum Abbrechen':'Element-Kristall – lässt sich nicht aufhalten';await until('morph',short?1000:3400);
  if(cancelled){hint.textContent='';phase='cancel';tx.textContent='Hm? '+(m.nickname||M0.n)+' hat aufgehört, sich zu entwickeln.';sfx('bump');await ph('cancel',short?400:1200);out={cancelled:true};}
  else{hint.textContent='';sfx('evoBurst');vib([20,30,60]);await ph('burst',short?220:520);
   if(o1){setExpression(o1,'freudig',2500);o1.userData.act.hop=performance.now();}if(typeof playCry==='function')try{playCry(into);}catch(e){}
   await ph('reveal',short?250:900);jingle('evolve','evoJ');tx.textContent='Glückwunsch! '+(m.nickname||M0.n)+' hat sich zu '+M1.n+' entwickelt!';if(!G.dex.caught[into])hint.textContent='Neu! Eintrag in der Chronik';
   await ph('done',short?500:1900);}
 }finally{alive=false;S.stop();document.removeEventListener('keydown',kd);if(o0&&R){R.s.remove(o0,o1);R.s.overrideMaterial=null;}ov.classList.add('out');setTimeout(()=>ov.remove(),RED?0:220);if(mode==='wait')mode=pm==='menu'||pm==='battle'||pm==='wait'?'world':pm;}
 if(typeof compReact==='function'&&!out.cancelled)try{compReact('shiny');}catch(e){}
 return out;};

// ---------- Heilstation: eigene Heil-Figur + Heilbrunnen ----------
function drawHealer(c,x,y,s,t,arm){c.save();c.translate(x,y);c.scale(s,s);const bob=Math.sin(t/380)*1.2;
 c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(0,46,22,5,0,0,7);c.fill();
 // Gewand (Mint) + Schürze
 c.fillStyle='#6fd0b6';c.beginPath();c.moveTo(-20,44);c.quadraticCurveTo(-22,4+bob,0,2+bob);c.quadraticCurveTo(22,4+bob,20,44);c.closePath();c.fill();
 c.fillStyle='#f6fffb';c.beginPath();c.moveTo(-10,44);c.quadraticCurveTo(-9,16+bob,0,14+bob);c.quadraticCurveTo(9,16+bob,10,44);c.closePath();c.fill();
 c.fillStyle='#ff9eb2';c.beginPath();c.arc(0,26+bob,3.2,0,7);c.fill();
 // Arme
 c.strokeStyle='#6fd0b6';c.lineWidth=6;c.lineCap='round';const ar=arm||0;c.beginPath();c.moveTo(14,14+bob);c.lineTo(22+ar*10,22-ar*12+bob);c.stroke();c.beginPath();c.moveTo(-14,14+bob);c.lineTo(-20,28+bob);c.stroke();
 c.fillStyle='#ffd9c2';c.beginPath();c.arc(22+ar*10,22-ar*12+bob,3.4,0,7);c.fill();
 // Kopf, Haarknoten, Blatthaube mit Leuchtsamen
 c.fillStyle='#ffd9c2';c.beginPath();c.arc(0,-8+bob,12,0,7);c.fill();c.fillStyle='#ff8a6a';c.beginPath();c.arc(0,-19+bob,6,0,7);c.fill();c.beginPath();c.ellipse(0,-12+bob,13,6,0,Math.PI,0);c.fill();
 c.fillStyle='#4cb85c';c.beginPath();c.moveTo(-14,-14+bob);c.quadraticCurveTo(0,-34+bob,14,-14+bob);c.quadraticCurveTo(0,-20+bob,-14,-14+bob);c.fill();
 const sg=c.createRadialGradient(0,-26+bob,0,0,-26+bob,7);sg.addColorStop(0,'#fff');sg.addColorStop(.4,'#ffd166');sg.addColorStop(1,'rgba(255,209,102,0)');c.fillStyle=sg;c.beginPath();c.arc(0,-26+bob,7,0,7);c.fill();
 c.fillStyle='#28324a';c.beginPath();c.arc(-4,-8+bob,1.6,0,7);c.arc(4,-8+bob,1.6,0,7);c.fill();c.strokeStyle='#28324a';c.lineWidth=1.3;c.beginPath();c.arc(0,-4+bob,3.2,.2,Math.PI-.2);c.stroke();
 c.fillStyle='rgba(255,120,140,.35)';c.beginPath();c.arc(-7,-4+bob,2.2,0,7);c.arc(7,-4+bob,2.2,0,7);c.fill();c.restore();}
function healSlots(n,x,y,s){const L=[];for(let i=0;i<6;i++){const col=i%3,row=i/3|0;L.push([x+(col-1)*26*s,y+(row-.5)*24*s]);}return L.slice(0,Math.max(1,n));}
SEQ.heal=async o=>{o=o||{};const team=(G&&G.team)||[];const host=$('#screen')||document.body,pm=mode,short=SET.banim===0||RED;mode='wait';held=null;
 const ov=document.createElement('div');ov.className='healOv';ov.innerHTML='<canvas></canvas><p class="healTx">Kreaturenstation · Einen Moment bitte …</p>';host.appendChild(ov);
 const cv=ov.querySelector('canvas'),tx=ov.querySelector('.healTx'),dpr=typeof artHealDpr==='function'?artHealDpr():Math.min(3,devicePixelRatio||1),W=ov.clientWidth||host.clientWidth||360,H=ov.clientHeight||host.clientHeight||260;cv.width=W*dpr;cv.height=H*dpr;const c=cv.getContext('2d');
 const S=seqClock(ov,short?.3:1),n=Math.max(1,Math.min(6,team.length)),sc=Math.min(W/300,H/220),mx=W*.66,my=H*.5,slots=healSlots(n,mx,my,sc),hx=W*.25,hy=H*.52;
 const caps=team.slice(0,6).map(m=>({k:m.capsule||'kapsel',col:TYPES[MONS[m.s].t[0]].c,lit:0}));let phase='in',pk=0,alive=true;const notes=[523,587,659,784,880,1046];
 const draw=()=>{if(!alive)return;requestAnimationFrame(draw);const t=performance.now();c.setTransform(dpr,0,0,dpr,0,0);
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#e9fbf6');g.addColorStop(1,'#cfeef8');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='rgba(255,255,255,.6)';c.fillRect(0,H*.78,W,H*.22);c.fillStyle='rgba(111,208,182,.25)';for(let i=0;i<8;i++){c.beginPath();c.arc((i*97+t/40)%(W+40)-20,H*.2+Math.sin(i+t/900)*10,3+i%3,0,7);c.fill();}
  // Heilbrunnen: Bogen + Becken mit Fassungen
  c.save();c.translate(mx,my);c.scale(sc,sc);c.fillStyle='#ffffff';c.strokeStyle='#9fd8cc';c.lineWidth=3;c.beginPath();c.moveTo(-52,40);c.quadraticCurveTo(-58,-34,0,-46);c.quadraticCurveTo(58,-34,52,40);c.closePath();c.fill();c.stroke();
  const glowAll=phase==='shine'?Math.sin(pk*Math.PI):0;const ag=c.createRadialGradient(0,-36,2,0,-36,40);ag.addColorStop(0,`rgba(127,224,200,${.45+glowAll*.5})`);ag.addColorStop(1,'rgba(127,224,200,0)');c.fillStyle=ag;c.fillRect(-60,-80,120,80);
  c.fillStyle='#6fd0b6';c.beginPath();c.ellipse(0,40,56,9,0,0,7);c.fill();c.restore();
  slots.forEach(([x,y],i)=>{const C=caps[i];c.fillStyle='rgba(40,70,90,.12)';c.beginPath();c.arc(x,y,10*sc,0,7);c.fill();if(C&&C.lit){const lg=c.createRadialGradient(x,y,0,x,y,18*sc);lg.addColorStop(0,'rgba(255,255,255,.95)');lg.addColorStop(.5,C.col+'aa');lg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=lg;c.beginPath();c.arc(x,y,18*sc,0,7);c.fill();}});
  // Kapseln: hinein, leuchten, zurück
  caps.forEach((C,i)=>{const[sx,sy]=slots[i]||slots[0];let x=sx,y=sy,vis=true;
   if(phase==='in'){const k=Math.max(0,Math.min(1,pk*n*.6-i*.6+.4));const e=1-Math.pow(1-k,2);x=hx+30*sc+(sx-hx-30*sc)*e;y=H+10+(sy-H-10)*e-Math.sin(e*Math.PI)*30*sc;vis=k>0;}
   if(phase==='out'){const e=pk*pk;x=sx+(hx+30*sc-sx)*e;y=sy+(H+20-sy)*e;}
   if(vis)capIcon(c,x,y,7*sc,C.k,t+i*90,{ring:C.col,core:C.lit?'#ffffff':C.col,coreK:C.lit?1.4:1});});
  drawHealer(c,hx,hy,sc*1.05,t,phase==='in'||phase==='out'?1:0);
  if(phase==='shine')for(let i=0;i<10;i++){const a=t/400+i*.63;capStar(c,mx+Math.cos(a)*60*sc,my+Math.sin(a)*34*sc,3*sc*(1-pk*.4),'#ffffff');}};
 draw();const ph=async(nm,ms)=>{phase=nm;const t0=S.now(),d=Math.max(1,ms*S.scale);pk=0;const iv=setInterval(()=>{pk=Math.min(1,(S.now()-t0)/d);},16);await S.wait(ms);clearInterval(iv);pk=1;};
 try{sfx('tap');await ph('in',short?250:260+n*150);
  phase='lit';for(let i=0;i<n;i++){caps[i].lit=1;SFX.healNote=[['sine',notes[i],notes[i],.14,.035]];sfx('healNote');vib(5);await S.wait(short?50:210);}
  jingle('heal','healJ');tx.textContent='Alle Kreaturen sind wieder topfit!';await ph('shine',short?200:650);await ph('out',short?150:380);
 }finally{alive=false;S.stop();ov.classList.add('out');setTimeout(()=>ov.remove(),RED?0:200);if(mode==='wait')mode=pm==='dialog'?'world':pm;}
 if(typeof compReact==='function')try{compReact('heal');}catch(e){}return{ok:true};};
// Heilstation-Dialog (n.t==='nurse') mit Sequenz
const _talkHeal=talk;talk=function(n){if(!n||n.t!=='nurse'||n.hook)return _talkHeal(n);n.face=opp(P.dir);
 return ask('Willkommen in der Kreaturenstation! Sollen wir deine Kreaturen heilen?',['Ja, bitte','Nein'],i=>{if(i)return;healAll();G.respawn={...G.ret};save();const map=cur.id;
  playSeq('heal',{}).then(()=>{if(cur&&cur.id===map&&(mode==='world'||mode==='wait')&&!B)say('Deine Kreaturen sind wieder topfit. Dein Spielstand wurde gespeichert.');});});};
// Heil-Items im Kampf: grüne Funken + KP-Balken läuft hoch
SEQ.healitem=async o=>{if(!B||!o||!o.mon)return{};const me=G.team[B.mi]===o.mon;B.healFx={who:me?'me':'foe',t:performance.now()};sfx('heal');vib(8);
 if(me&&BT&&BT.me)setExpression(BT.me,'freudig',1300);try{updB();}catch(e){}return{ok:true};};
const _useItemEvo=useItem;useItem=function(k,m){const h0=m?m.hp:0,r=_useItemEvo(k,m);try{const it=ITEMS[k];if(B&&m&&it&&(it.k==='heal'||it.k==='revive')&&m.hp>h0)playSeq('healitem',{mon:m,from:h0,to:m.hp});}catch(e){}return r;};

// ---------- Stile ----------
{const st=document.createElement('style');st.textContent=`
.evoOv{position:fixed;inset:0;z-index:90;background:#070a18;touch-action:none;animation:fadein .3s}.evoOv.out{animation:fadeout .22s forwards}
.evoOv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.evoTx{position:absolute;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));bottom:max(22px,env(safe-area-inset-bottom,0px));max-width:528px;margin:0 auto;background:var(--ui);color:var(--fg);border-radius:18px;padding:14px 18px 12px;box-shadow:var(--shadow);font-family:var(--fd);font-weight:600;font-size:17px;line-height:1.35}
.evoTx p{margin:0;min-height:1.35em}.evoTx small{display:block;margin-top:4px;font-family:var(--fb);font-weight:600;font-size:12px;letter-spacing:.04em;color:var(--mute)}
.evoHold{position:absolute;right:14px;top:-26px;width:40px;height:40px;border-radius:50%;background:conic-gradient(var(--brand) calc(var(--k,0)*360deg),rgba(255,255,255,.25) 0);opacity:0;transition:opacity .15s;-webkit-mask:radial-gradient(circle,transparent 12px,#000 13px);mask:radial-gradient(circle,transparent 12px,#000 13px)}.evoHold.on{opacity:1}
.healOv{position:absolute;inset:0;z-index:25;animation:fadein .2s}.healOv.out{animation:fadeout .2s forwards}.healOv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.healTx{position:absolute;left:12px;right:12px;top:10px;margin:0;text-align:center;font-family:var(--fd);font-weight:600;font-size:14px;color:#1d5a50;background:rgba(255,255,255,.8);border-radius:999px;padding:6px 12px;box-shadow:var(--shadow-s)}
.lvc{width:min(340px,100%);background:var(--ui);border-radius:22px;padding:16px 18px;box-shadow:var(--shadow);animation:rise .3s var(--spring)}.lvc .ck{font-family:var(--fd);font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--brand)}
.lvh{display:flex;align-items:center;gap:10px;margin:4px 0 10px}.lvh h2{margin:0;font-family:var(--fd);font-size:20px}.lvh .lvl{margin:0;color:var(--mute);font-weight:600}.lvh .lvl b{color:var(--fg);font-size:18px}
.lvr{display:grid;gap:4px}.lvs{display:grid;grid-template-columns:1fr 44px 44px 44px;align-items:center;padding:5px 10px;border-radius:10px;background:var(--ui2);font-variant-numeric:tabular-nums;animation:rise .3s var(--spring) both;animation-delay:var(--d)}
.lvs span{font-weight:600;color:var(--mute);font-size:13px}.lvs b{text-align:right;font-weight:600;color:var(--mute)}.lvs em{text-align:right;font-style:normal;font-weight:700;color:var(--ok)}.lvs em.done{animation:pop2 .3s var(--spring)}.lvs strong{text-align:right;font-family:var(--fd)}
@keyframes pop2{50%{transform:scale(1.35)}}
.lvOv{position:absolute;inset:0;z-index:26;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(233,238,243,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}.lvOv .cnext{margin:0;font-size:12px;color:var(--mute);font-weight:600}
.evoBtn{background:linear-gradient(135deg,var(--brand),var(--brand2))!important;color:#fff!important;font-weight:700}.evoBtn small{font-weight:600;opacity:.9}
body.red .evoOv,body.red .healOv,body.red .lvc,body.red .lvs{animation:none}`;document.head.appendChild(st);}
