// ===== VEYRA – Menüs, Steuerung, Speichern =====
function updClock(){const h=Math.floor(G.time/60),m=G.time%60;let w='klar';try{w=cur?weatherNow():'klar';}catch(e){}const el=$('#hudClock');
 el.textContent=(isNight()?'☾ ':'☀ ')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+(w&&w!=='klar'&&typeof WXN!=='undefined'?' · '+(WXN[w]||w):'');el.dataset.w=w||'klar';}
function updHud(){if(!G)return;updClock();$('#hudBadges').textContent=G.badges.length+'/8 Medaillen';}
// Speichern/Laden laufen über das Sicherheitsnetz (48-savesafe.js: Schreibschutz, Sicherungen, IndexedDB-Spiegel, Wiederherstellung); Rückfall ohne Modul wie bisher
function save(){try{const s=JSON.stringify(G);if(typeof saveWrite==='function'){if(!saveWrite(s)){toast('Speichern nicht möglich');return;}}else localStorage.setItem(SAVEKEY,s);toast('Gespeichert');}catch(e){toast('Speichern nicht möglich');}}
function loadSave(){if(typeof saveRead==='function')return saveRead();try{const s=localStorage.getItem(SAVEKEY);return s?JSON.parse(s):null;}catch(e){return null;}}
// Neues Spiel: Intro mit Prof. Lindqvist + Charaktererstellung (SEQ.intro in 23-intro.js), Start im eigenen Zuhause
function freshG(p){p=p||{};return{map:'haus_spieler',mods:{},team:[],box:[],bag:{},money:3000,flags:{},dex:{seen:{},caught:{}},time:8*60,badges:[],
 ret:{map:'morgenau',x:4,y:5},respawn:{map:'morgenau',x:4,y:5},px:5,py:5,name:p.name||'Noa',rival:p.rival||'Lio',outfit:Object.assign(defaultOutfit(),p.outfit||{}),visited:{morgenau:1,haus_spieler:1},known2:{}};}
function beginGame(p,quiet){G=freshG(p);start();P.dir='up';if(!quiet)welcomeHome();}
function welcomeHome(){say(['Mama: Guten Morgen, '+G.name+'! '+G.rival+' ist vorhin schon zum Labor gerannt.','Mama: Prof. Lindqvist wartet auf dich. Das Labor liegt gleich im Süden des Dorfs. Viel Glück!']);}
function newGame(){const go=()=>{if(typeof SEQ!=='undefined'&&SEQ.intro)return playSeq('intro');beginGame({});};/* Intro-Film (44) vor dem interaktiven Intro */return typeof introFilmGate==='function'?introFilmGate().catch(()=>{}).then(r=>r&&r.busy?r:go()):go();}
function start(){G.mods=G.mods||{};migrateUi(G);if(!MAPS[G.map]&&!INTERIORS[G.map]){G.map='morgenau';G.px=G.py=undefined;}for(const k in cache)delete cache[k];for(const k in scenes)delete scenes[k];if(R3)R3.mapId=null;mmFor=null;$('#title').hidden=true;mode='world';loadMap(G.map,G.px??4,G.py??5);updHud();setView(SET.view2d?'2d':(G.view==='ego'?'ego':'third'),true);/* Look L2: 3D-Freilauf ist Standard, Draufsicht nur über Optionen › Erweitert */}
function cont(){G=loadSave();if(!G){if(typeof saveMissing==='function'&&saveMissing())return;return newGame();}start();}

// ---------- Menü ----------
let tab='team',sel=null;
let sheetT=0;
function sheetOpen(el){clearTimeout(sheetT);document.querySelectorAll('.layer.out').forEach(x=>{x.classList.remove('out');x.hidden=true;});el.hidden=false;}
// Chronik: diegetisches Gerät – klappt aus der Hand der Spielfigur auf (Ursprung = Bildschirmposition der Figur)
const CHTAB={map:'Karte',team:'Team',quest:'Missionen',dex:'Chronik-Dex',bag:'Tasche',box:'Kreaturenbox',medals:'Medaillen',game:'Optionen'};
function openMenu(t){if(!G.team.length&&(t==='team'||(!t&&tab==='team')))t='quest';tab=t||tab;if(!CHTAB[tab])tab='quest';mode='menu';sfx('open');hqToggle(false);const m=$('#menu');
 m.dataset.shell=SET.shell||'glas';m.classList.toggle('acc',!!SET.shellAcc);const ps=playerScreen();
 sheetOpen(m);if(ps){const cr=m.querySelector('.chCase').getBoundingClientRect();m.style.setProperty('--ox',(ps.x-cr.left)+'px');m.style.setProperty('--oy',(ps.y-cr.top)+'px');}m.classList.remove('opening');void m.offsetWidth;if(!RED)m.classList.add('opening');clearTimeout(m._ot);m._ot=setTimeout(()=>m.classList.remove('opening'),700);
 $('#tabInk').classList.add('snap');renderMenu();}
function closeMenu(){const open=['#menu','#shop'].map($).filter(x=>!x.hidden);const wasMap=!$('#menu').hidden&&tab==='map';mode='world';sel=null;updHud();if(!$('#menu').hidden)sfx('close');
 if(wasMap)NAV.arrowT=performance.now()+180;
 if(RED){open.forEach(x=>x.hidden=true);return;}open.forEach(x=>{x.classList.remove('opening');x.classList.add('out');});clearTimeout(sheetT);
 sheetT=setTimeout(()=>open.forEach(x=>{if(x.classList.contains('out')){x.hidden=true;x.classList.remove('out');}}),260);}
function renderMenu(){document.querySelectorAll('#tabs button').forEach(b=>{const on=b.dataset.t===tab;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);b.setAttribute('aria-current',on?'page':'false');const a=b.querySelector('.ap');if(a&&!a.firstChild)a.innerHTML=APPICON[b.dataset.t]||'';});inkTo();
 $('#chTitle').textContent=CHTAB[tab]||'Chronik';$('#money').textContent=G.money.toLocaleString('de-DE')+' ¤';const el=$('#mBody');el.innerHTML='';el.dataset.t=tab;el.classList.remove('swap');void el.offsetWidth;el.classList.add('swap');
 try{({team:rTeam,bag:rBag,quest:rQuest,dex:rDex,game:rGame,map:rMap,box:rBox,medals:rMedals})[tab](el);}catch(err){console.error('Chronik-Seite '+tab,err);if(!el.children.length)el.insertAdjacentHTML('beforeend','<div class="empty"><b>Hier hakt es gerade</b><p class="muted">Tippe auf eine andere Seite und dann wieder hierher.</p></div>');}}
// Miniatur: Illustration (26-art.js), sonst 3D-Vorschaubild als Bild in gleicher Rahmung (Fallback Canvas); o={shiny,field,still}
function mini(id,size,dim,o){if(typeof artEl==='function'&&(hasArt(id)||window.THREE)){const a=artEl(id,size,Object.assign({dim:!!dim},o||{}));if(a)return a;}const c=document.createElement('canvas');c.width=c.height=size*2;c.className='mini';c.style.width=c.style.height=size+'px';
 const x=c.getContext('2d');x.scale(2,2);if(dim)x.filter='grayscale(1) brightness(.35)';drawMon(x,id,size/2,size*.55,size*.8,false,0);return c;}
function bar(p,cls){return`<div class="bar ${cls||''}"><i style="width:${Math.max(0,Math.min(1,p))*100}%;background:${p>.5?'var(--hp1)':p>.2?'var(--hp2)':'var(--hp3)'}"></i></div>`;}
// Gleitende Markierung hinter der aktiven App (Leiste unten im Hochformat, links im Querformat)
function inkTo(){const on=$('#tabs button.on'),ink=$('#tabInk');if(!on)return;ink.style.width=on.offsetWidth+'px';ink.style.height=on.offsetHeight+'px';ink.style.transform=`translate(${on.offsetLeft}px,${on.offsetTop}px)`;
 if(ink.classList.contains('snap'))requestAnimationFrame(()=>requestAnimationFrame(()=>ink.classList.remove('snap')));on.scrollIntoView({block:'nearest',inline:'nearest'});}
// Portrait mit HP-Ring
function ring(m,size){const max=stat(m,'hp'),p=Math.max(0,Math.min(1,m.hp/max)),w=document.createElement('span');w.className='ring'+(m.hp<=0?' ko':'');
 w.style.cssText=`--p:${p};--hc:${p>.5?'var(--hp1)':p>.2?'var(--hp2)':'var(--hp3)'};width:${size+12}px;height:${size+12}px`;w.appendChild(mini(m.s,size,m.hp<=0,{shiny:m.shiny}));return w;}
// Leerzustand mit kleiner Illustration
const EMPTY={bag:'<svg viewBox="0 0 96 80" aria-hidden="true"><ellipse cx="48" cy="72" rx="30" ry="5" fill="var(--ui3)"/><path d="M26 34c0-8 10-14 22-14s22 6 22 14l4 26c1 7-4 12-11 12H33c-7 0-12-5-11-12z" fill="#ffd9b0"/><path d="M34 26c4-6 24-6 28 0" stroke="var(--brand)" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="48" cy="44" r="6" fill="var(--brand)"/><path d="M40 58h16" stroke="#e8b48a" stroke-width="3" stroke-linecap="round"/></svg>',
 box:'<svg viewBox="0 0 96 80" aria-hidden="true"><ellipse cx="48" cy="72" rx="32" ry="5" fill="var(--ui3)"/><rect x="20" y="30" width="56" height="38" rx="8" fill="#dbe6f2"/><path d="M16 30l8-12h48l8 12z" fill="#c4d4e6"/><rect x="40" y="40" width="16" height="8" rx="4" fill="#fff"/><circle cx="70" cy="18" r="3" fill="var(--accent)"/><circle cx="78" cy="26" r="2" fill="var(--teal)"/></svg>',
 dex:'<svg viewBox="0 0 96 80" aria-hidden="true"><ellipse cx="48" cy="72" rx="28" ry="5" fill="var(--ui3)"/><circle cx="48" cy="38" r="24" fill="#e7edf5"/><circle cx="48" cy="38" r="24" fill="none" stroke="var(--brand)" stroke-width="4" stroke-dasharray="30 120" stroke-linecap="round"/><text x="48" y="46" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="22" fill="var(--mute)">?</text></svg>'};
function empty(k,t,d){return`<div class="empty">${EMPTY[k]}<b>${t}</b><p class="muted">${d}</p></div>`;}
function card(m,i,inBox){const d=document.createElement('button');d.className='mon'+(m.hp<=0?' ko':'');const max=stat(m,'hp');
 d.innerHTML=`${!inBox&&i===0?'<span class="lead">Spitze</span>':''}<div class="mt"><b>${mname(m)}</b><small>Lv ${m.l}</small></div><div class="chips">${chips(MONS[m.s].t)}</div><small class="num">${m.hp<=0?'Kampfunfähig':'KP '+Math.max(0,m.hp)+' / '+max}</small>`;
 d.prepend(ring(m,64));d.onclick=()=>{sel={i,box:inBox,slot:null};rDetail($('#mBody'));};return d;}
function rTeam(el){const g=document.createElement('div');g.className='grid';G.team.forEach((m,i)=>g.appendChild(card(m,i,false)));el.appendChild(g);
 const h=document.createElement('h3');h.innerHTML='Lager <small>'+G.box.length+' Kreaturen</small>';el.appendChild(h);
 if(!G.box.length)el.insertAdjacentHTML('beforeend',empty('box','Das Lager ist leer','Ist dein Team voll, landen neu gefangene Kreaturen hier.'));
 const g2=document.createElement('div');g2.className='grid';G.box.forEach((m,i)=>g2.appendChild(card(m,i,true)));el.appendChild(g2);}
let dtab='moves';
function rDetail(el){const L=sel.box?G.box:G.team,m=L[sel.i];if(!m){sel=null;return renderMenu();}const M=MONS[m.s];el.innerHTML='';
 const top=document.createElement('div');top.className='dtop';top.appendChild(typeof hasArt==='function'&&hasArt(m.s)?artStage(m.s,150,{shiny:m.shiny,mon:m}):(viewer3d(m.s,150)||mini(m.s,110)));
 const a=m.l**3,b=(m.l+1)**3,max=stat(m,'hp');
 top.insertAdjacentHTML('beforeend',`<div class="dinfo"><h2>${mname(m)} <small>Lv ${m.l}</small></h2><div class="chips">${chips(M.t)}</div>
 <div class="dbar"><span>KP</span>${bar(m.hp/max)}<b>${Math.max(0,m.hp)}/${max}</b></div><div class="dbar"><span>EP</span>${bar((m.xp-a)/(b-a),'xp')}<b>${Math.max(0,b-m.xp)} bis Lv ${m.l+1}</b></div></div>`);el.appendChild(top);
 const tb=document.createElement('div');tb.className='seg dtabs';tb.setAttribute('role','tablist');const pane=document.createElement('div');pane.className='dpane';
 [['stats','Werte'],['moves','Attacken'],['info','Info']].forEach(([k,l])=>{const x=document.createElement('button');x.textContent=l;x.className=dtab===k?'on':'';x.setAttribute('role','tab');x.setAttribute('aria-selected',dtab===k);
  x.onclick=()=>{dtab=k;tb.querySelectorAll('button').forEach(y=>{y.classList.toggle('on',y===x);y.setAttribute('aria-selected',y===x);});rPane(pane,m);sfx('tap');};tb.appendChild(x);});
 el.append(tb,pane);rPane(pane,m);
 const act=document.createElement('div');act.className='acts';
 const mkb=(t,f,dis)=>{const b4=document.createElement('button');b4.textContent=t;b4.onclick=f;b4.disabled=!!dis;act.appendChild(b4);};
 mkb('Zurück',()=>{sel=null;renderMenu();});
 if(!sel.box){mkb('An die Spitze',()=>{G.team.unshift(G.team.splice(sel.i,1)[0]);sel.i=0;toast(M.n+' führt jetzt das Team an');rDetail(el);},sel.i===0);
  mkb('Ins Lager',()=>{G.box.push(G.team.splice(sel.i,1)[0]);sel=null;renderMenu();},G.team.length<2);}
 else mkb('Ins Team',()=>{G.team.push(G.box.splice(sel.i,1)[0]);sel=null;renderMenu();},G.team.length>=6);
 el.appendChild(act);}
function rPane(el,m){const M=MONS[m.s];el.innerHTML='';el.classList.remove('swap');void el.offsetWidth;el.classList.add('swap');
 if(dtab==='stats'){const S=[['hp','KP'],['atk','Angriff'],['def','Verteidigung'],['spd','Initiative']],v=S.map(([k])=>stat(m,k)),top=Math.max(...v)*1.15;
  el.innerHTML='<div class="stats">'+S.map(([k,l],i)=>`<div class="srow"><span>${l}</span><div class="sbar"><i style="width:${v[i]/top*100}%"></i></div><b>${v[i]}</b></div>`).join('')+'</div>'+
   `<p class="muted">Werte steigen mit jedem Level. Wesen: ${ABIL[M.ab][0]}.</p>`;return;}
 if(dtab==='info'){const ev=M.ev?(M.ev.l?'Entwickelt sich ab Level '+M.ev.l+' zu '+MONS[M.ev.to].n:'Entwickelt sich mit '+ITEMS[M.ev.s].n):'Keine weitere Entwicklung';
  el.innerHTML=`<p class="abil"><b>${ABIL[M.ab][0]}</b> – ${ABIL[M.ab][1]}</p><p class="desc">${M.d||''}</p><p class="muted">${ev}${fieldOf(m.s)}</p>`;return;}
 el.insertAdjacentHTML('beforeend',`<h3>Aktive Attacken <small>${sel.slot===null?'Tippe einen Platz an, dann eine erlernte Attacke':'Platz '+(sel.slot+1)+' gewählt – jetzt Attacke wählen'}</small></h3>`);
 const sl=document.createElement('div');sl.className='slots';
 for(let i=0;i<4;i++){const mv=m.moves[i],b2=document.createElement('button');b2.className='slot'+(sel.slot===i?' on':'')+(mv?'':' free');
  if(mv){const X=MOVES[mv.id];b2.style.setProperty('--tc',TYPES[X[1]].c);b2.innerHTML=`<i class="tic">${ticon(X[1])}</i><div><b>${X[0]}</b><span>${TYPES[X[1]].n} · ${X[2]?'Stärke '+X[2]:'Status'}</span><small class="ap">AP ${mv.pp}/${X[4]}</small></div>`;}
  else b2.innerHTML='<i class="tic"></i><div><b>Frei</b><span>Tippe hier, dann Attacke wählen</span></div>';
  b2.setAttribute('aria-pressed',sel.slot===i);b2.onclick=()=>{sel.slot=sel.slot===i?null:i;rPane(el,m);};sl.appendChild(b2);}el.appendChild(sl);
 el.insertAdjacentHTML('beforeend','<h3>Erlernte Attacken</h3>');const kn=document.createElement('div');kn.className='known';
 m.known.forEach(id=>{const X=MOVES[id],act=m.moves.some(x=>x.id===id),b3=document.createElement('button');b3.className='kmv'+(act?' act':'');b3.style.setProperty('--tc',TYPES[X[1]].c);
  b3.innerHTML=`${X[0]}<small>${TYPES[X[1]].n}${X[2]?' · '+X[2]:''}${act?' · aktiv':''}</small>`;b3.disabled=act;
  b3.onclick=()=>{let s=sel.slot;if(s===null)s=m.moves.length<4?m.moves.length:null;if(s===null){toast('Wähle zuerst einen Platz');return;}
   m.moves[s]={id,pp:Math.min(X[4],m.moves[s]&&m.moves[s].id===id?m.moves[s].pp:X[4])};if(s>=m.moves.length)m.moves.push(m.moves[s]);m.moves=m.moves.filter(Boolean);sel.slot=null;toast(X[0]+' zugeordnet');rPane(el,m);};
  kn.appendChild(b3);});el.appendChild(kn);}
function rBag(el){const ks=Object.keys(ITEMS).filter(k=>G.bag[k]>0);
 if(!ks.length){el.innerHTML=empty('bag','Dein Beutel ist leer','Läden findest du in jeder Stadt.');return;}
 const groups=[['ball','Fangkapseln'],['heal','Heilung'],['revive','Heilung'],['pp','Heilung'],['stone','Entwicklungssteine']];const done=new Set();
 for(const[k,title]of groups){if(done.has(title))continue;const its=ks.filter(x=>groups.filter(g=>g[1]===title).some(g=>g[0]===ITEMS[x].k));if(!its.length)continue;done.add(title);
  el.insertAdjacentHTML('beforeend','<h3>'+title+'</h3>');
  its.forEach(x=>{const it=ITEMS[x],r=document.createElement('div');r.className='item';
   r.innerHTML=`<div><b>${it.n}</b> <small>×${G.bag[x]}</small><p class="muted">${it.d}</p></div>`;
   if(it.k!=='ball'){const b=document.createElement('button');b.textContent='Benutzen';b.onclick=()=>chooseFor(x);r.appendChild(b);}el.appendChild(r);});}}
function chooseFor(k){const it=ITEMS[k],el=$('#mBody');el.innerHTML='<h3>'+it.n+' benutzen für …</h3>';const g=document.createElement('div');g.className='grid';
 G.team.forEach((m,i)=>{const max=stat(m,'hp');let ok=it.k==='heal'?m.hp>0&&m.hp<max:it.k==='revive'?m.hp<=0:it.k==='pp'?true:MONS[m.s].ev&&MONS[m.s].ev.s===k;
  const c=card(m,i,false);c.disabled=!ok;if(it.k==='stone'&&!ok)c.title='Reagiert nicht auf diesen Stein';
  c.onclick=()=>{if(it.k==='stone'){G.bag[k]--;closeMenu();evolve(m,()=>{});return;}toast(useItem(k,m));renderMenu();};g.appendChild(c);});
 el.appendChild(g);const b=document.createElement('button');b.className='back';b.textContent='Zurück';b.onclick=renderMenu;el.appendChild(b);}
// Sperren: Feld q.req = {badges:n} | {flag:'x'} (+ text), sonst aus dem Beschreibungstext abgeleitet
function questReq(q){if(q.req)return q.req;const d=q.d||'';let m=d.match(/\b[Aa]b (\d) (?:Orden|Medaillen)/);if(m)return{badges:+m[1],text:'Ab '+m[1]+' Medaillen'};
 m=d.match(/\b[Aa]b (Blüten|Wellen|Gletscher|Mond)orden|\b[Aa]b (Flora|Flut|Frost|Schatten)medaille/);if(m){const k=m[1]||m[2];return{badges:{Blüten:1,Wellen:2,Gletscher:3,Mond:4,Flora:1,Flut:2,Frost:3,Schatten:4}[k],text:'Ab '+({Blüten:'Flora',Wellen:'Flut',Gletscher:'Frost',Mond:'Schatten'}[k]||k)+'medaille'};}
 if(/Nur für den Champion/i.test(d))return{flag:'champion',text:'Nur mit der Kristallkrone'};return null;}
function reqMet(r){if(!r)return true;if(r.badges!=null&&G.badges.length<r.badges)return false;if(r.flag&&!G.flags[r.flag])return false;return true;}
const LOCK='<svg class="lk" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.5 7zm2 0h4V5a2 2 0 0 0-4 0z"/></svg>';
function rQuest(el){const cur=QUESTS.find(q=>!G.flags[q.f]);
 if(cur)el.insertAdjacentHTML('beforeend',`<div class="quest now"><small>Aktuelle Mission</small><h2>${cur.title}</h2><p>${cur.d}</p>${GP?`<span class="qgo">${GP.l}</span>`:''}</div>`);
 else el.insertAdjacentHTML('beforeend',`<div class="quest now"><small>Hauptgeschichte abgeschlossen</small><h2>${crownTitle()} von Veyra</h2><p>Fange alle ${NMON} Kreaturen und finde die Legenden.</p></div>`);
 el.insertAdjacentHTML('beforeend','<h3>Nebenmissionen</h3>');
 const L=SIDEQUESTS.map(q=>({q,r:questReq(q)})).map(o=>Object.assign(o,{lock:!G.flags[o.q.f]&&!reqMet(o.r)}));
 L.sort((a,b)=>(!!G.flags[a.q.f])-(!!G.flags[b.q.f])||a.lock-b.lock).forEach(({q,r,lock})=>el.insertAdjacentHTML('beforeend',`<div class="quest ${G.flags[q.f]?'done':lock?'locked':''}"><b>${G.flags[q.f]?'✓ ':lock?LOCK:''}${q.title}</b>${lock?`<span class="qreq">${r.text||'Noch gesperrt'}</span>`:''}<p class="muted">${q.d}</p></div>`));
 el.insertAdjacentHTML('beforeend','<h3>Erledigt</h3>');
 QUESTS.filter(q=>G.flags[q.f]).forEach(q=>el.insertAdjacentHTML('beforeend',`<div class="quest done"><b>✓ ${q.title}</b></div>`));
 // Spielstand-Schlüssel bleiben die alten Namen (G.badges), angezeigt wird der Medaillen-Name (MEDAL_OLD aus 27-story.js)
 el.insertAdjacentHTML('beforeend',`<h3>Medaillen</h3><div class="badges">${['Blütenorden','Wellenorden','Gletscherorden','Mondorden'].map((b,i)=>`<span class="badge ${G.badges.includes(b)?'got':''}" style="--bc:${['#4cb85c','#3d8fe0','#79d6e8','#7d5aa6'][i]}">${(typeof MEDAL_OLD!=='undefined'&&MEDAL_OLD[b])||['Floramedaille','Flutmedaille','Frostmedaille','Schattenmedaille'][i]}</span>`).join('')}</div>`);}
function rDex(el){const c=Object.keys(G.dex.caught).length,s=Object.keys(G.dex.seen).length;
 const pc=c/NMON,C=2*Math.PI*26;
 el.insertAdjacentHTML('beforeend',`<div class="dexhead"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" class="tr"/><circle cx="32" cy="32" r="26" class="pr" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pc)}" style="--c:${C}"/></svg><b class="pct">${Math.round(pc*100)}<small>%</small></b>
  <div><b>Kreaturendex</b><p class="muted">Gefangen ${c} von ${NMON} · Gesehen ${s}</p><div class="bar xp"><i style="width:${s/NMON*100}%"></i></div></div></div>`);
 if(!s)el.insertAdjacentHTML('beforeend',empty('dex','Noch keine Einträge','Begegne Kreaturen im hohen Gras, um den Dex zu füllen.'));const g=document.createElement('div');g.className='dex';const lazy=[];
 for(let i=1;i<MONS.length;i++){const d=document.createElement('button');const isS=G.dex.seen[i],isC=G.dex.caught[i];d.className='dx'+(isC?' got':isS?' seen':' none');const hn=isS?'':dexHint(i);if(!isS){d.setAttribute('aria-label',hn?'Unbekannt. Hinweis: '+hn:'Unbekannt');if(hn)d.classList.add('hint');}
  if(isS){if(dexLazy(i)){const ph=document.createElement('div');ph.className='q ph';ph.style.background=`radial-gradient(circle,${TYPES[MONS[i].t[0]].c}55,${TYPES[MONS[i].t[0]].c}14 70%)`;d.appendChild(ph);lazy.push([i,ph,!isC]);}else d.appendChild(mini(i,56,!isC,{lazy:true}));}else d.insertAdjacentHTML('beforeend','<div class="q">?</div>');
  d.insertAdjacentHTML('beforeend',`<small>${typeof dexNr==='function'?dexNr(i):'#'+i} ${isS?MONS[i].n:'???'}</small>`);if(isS&&typeof artFramed==='function'&&artFramed(i))d.classList.add('leg');
  d.onclick=()=>{if(!isS){if(hn)toast('Hinweis: '+hn);return;}try{dexDetail();}catch(err){console.error('Dex-Detail',err);renderMenu();}function dexDetail(){const M=MONS[i];el.innerHTML='';const t=document.createElement('div');t.className='dtop';t.appendChild(typeof hasArt==='function'&&hasArt(i)?artStage(i,150,{dim:!isC,no3d:!isC}):((isC&&viewer3d(i,150))||mini(i,110,!isC)));
   t.insertAdjacentHTML('beforeend',`<div class="dinfo"><h2><small class="dnr">${typeof dexNr==='function'?dexNr(i):'#'+i}</small> ${M.n}</h2><div class="chips">${chips(M.t)}</div><p>${isC?M.d:'Noch nicht gefangen.'}</p>${isC?`<p class="abil"><b>${ABIL[M.ab][0]}</b> – ${ABIL[M.ab][1]}</p>`:''}</div>`);
   el.appendChild(t);const b=document.createElement('button');b.className='back';b.textContent='Zurück';b.onclick=renderMenu;el.appendChild(b);}};g.appendChild(d);}
 el.appendChild(g);dexFill(el,lazy);}
// Loop C: Versteck-Hinweis für ungesehene Arten (kindgerecht kurz) – Quellen: Gras-/Wasser-Listen der Karten (enc), versteckte Wesen (FIND_HINTS, 47), Entwicklung, Legende
// Nachbesserung 1 (QA Loop C D-1/D-2/D-3): Karten in Story-Reihenfolge (frühester Fundort), Starter „Wird dir geschenkt.“, Entwicklungen nennen Vorstufe oder deren Fundort
const DEX_ORDER=['morgenau','route1','kupferhain','route2','nebelgrotte','brisenhafen','windkueste','moewenbucht','route3','frostheim','glutschlucht','route4','schattmoor','fluestertal','siegesstrasse'];
function dexMaps(){const r=id=>{const k=DEX_ORDER.indexOf(id);return k<0?99:k;};return Object.keys(MAPS).sort((a,b)=>r(a)-r(b));}
function dexSrc(i){const T=m=>(m.name||'').replace(/ · .*/,'');let day=null,night=null,fish=null,gift=null,dayR=99,nightR=99,r=0;
 for(const id of dexMaps()){r++;const e=MAPS[id].enc;if(!e)continue;const has=L=>(L||[]).some(q=>q[0]===i);if(!day&&has(e.day)){day=T(MAPS[id]);dayR=r;}if(!night&&has(e.night)){night=T(MAPS[id]);nightR=r;}if(!fish&&has(e.fish))fish=T(MAPS[id]);}
 if(typeof STARTERS!=='undefined'&&STARTERS.includes(i))gift='geschenkt';else for(const id in NPCS)for(const n of NPCS[id]||[])if(n&&n.mon===i&&!gift){if(n.t==='starter'||n.t==='gift')gift='geschenkt';else if(n.t==='trade')gift='tausch';}
 return{day,night,fish,gift,dayR,nightR,find:typeof FIND_HINTS!=='undefined'?FIND_HINTS[i]:null};}
function dexPre(i){for(let j=1;j<MONS.length;j++){const L=typeof evoList==='function'?evoList(j):[];const ev=MONS[j]&&MONS[j].ev;if((ev&&ev.to===i)||L.some(q=>q.into===i||q.into===MONS[i].n))return j;}return 0;}
function dexHint(i){const M=MONS[i];if(!M)return'';try{const S=dexSrc(i);
  if(S.day&&S.night)return'Lebt im hohen Gras: '+(S.nightR<S.dayR?S.night:S.day)+'.';/* frühester Ort (Tag oder Nacht) */if(S.day)return'Lebt im hohen Gras: '+S.day+' (am Tag).';if(S.night)return'Kommt nachts heraus: '+S.night+'.';if(S.fish)return'Beißt beim Angeln an: '+S.fish+'.';
  if(S.find)return S.find.text;if(S.gift==='geschenkt')return'Wird dir geschenkt.';if(S.gift==='tausch')return'Gibt es im Tausch.';
  const j=dexPre(i);if(j){if(G.dex.seen[j])return'Entwickelt sich aus '+MONS[j].n+'.';
   // Vorstufe noch unbekannt: Fundort der Vorstufe (bzw. ihrer Vorstufe) nennen – ohne Namen (kein Vorgriff)
   let k=j;for(let n=0;n<4&&k;n++){const Q=dexSrc(k),fit=s=>s.length<=45?s:null;let h=null;
    if(Q.day)h=fit('Vorstufe lebt im hohen Gras: '+Q.day+'.');else if(Q.night)h=fit('Vorstufe kommt nachts heraus: '+Q.night+'.');else if(Q.fish)h=fit('Vorstufe beißt beim Angeln an: '+Q.fish+'.');
    else if(Q.find)h=fit('Vorstufe versteckt sich '+(typeof FD_REG!=='undefined'&&FD_REG[Q.find.region]||'in Veyra')+'.');else if(Q.gift==='geschenkt')h='Entwickelt sich aus einem Partner.';
    if(h)return h;k=dexPre(k);}
   return'Entwickelt sich aus einer anderen Kreatur.';}
  if(M.legend||M.myth)return'Eine Legende. Folge der Geschichte!';}catch(e){}return'';}
// Dex-Erstöffnung (B3-Fix): 3D-Vorschaubilder bildloser Arten kosten je ca. 80–300 ms (Renderer, ReadPixels, PNG) – synchron beim Öffnen = Standbild/weißer Bildschirm. Jetzt Platzhalter, Bilder danach je Frame eines.
function dexLazy(i){return typeof hasArt==='function'&&!hasArt(i)&&!!window.THREE&&typeof THUMB!=='undefined'&&!THUMB[i];}
function dexFill(el,q){if(!q.length)return;const run=()=>{if(!q.length||!el.isConnected||el.dataset.t!=='dex')return;const[i,ph,dim]=q.shift();try{if(ph.isConnected)ph.replaceWith(mini(i,56,dim));}catch(e){}if(q.length)requestAnimationFrame(run);};requestAnimationFrame(run);}
function rGame(el){rSettings(el);}
// ---------- Laden ----------
function shopP(it){return Math.max(1,Math.round(it.p*DF().shop));}
function openShop(stock){mode='menu';sheetOpen($('#shop'));const el=$('#shopBody');
 const r=()=>{$('#shopMoney').textContent=G.money.toLocaleString('de-DE')+' ¤';el.innerHTML='';
  stock.forEach(k=>{const it=ITEMS[k],d=document.createElement('div');d.className='item';
   d.innerHTML=`<div><b>${it.n}</b> <small>${shopP(it)} ¤ · im Beutel: ${G.bag[k]||0}</small><p class="muted">${it.d}</p></div>`;
   [1,5].forEach(n=>{const b=document.createElement('button');b.textContent='×'+n;b.disabled=G.money<shopP(it)*n;b.onclick=()=>{G.money-=shopP(it)*n;addItem(k,n);toast(n+'× '+it.n+' gekauft');r();};d.appendChild(b);});
   el.appendChild(d);});};r();}

// ---------- Steuerung ----------
const KEYS={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
function pressA(){if(mode==='dialog')return advDlg();if(mode==='world'&&!P.moving)interact();}
function pressB(){if(mode==='world'&&!P.moving)return openMenu();if(mode==='menu')return closeMenu();if(mode==='dialog')advDlg();}
document.addEventListener('keydown',e=>{if(mode==='battle'||mode==='title')return;const d=KEYS[e.code];if(d){if(held!==d){heldT=performance.now();if(view==='2d'&&!P.moving&&mode==='world')P.dir=d;}held=d;if(view!=='2d'){STICK.y=d==='up'?-1:0;STICK.x=d==='left'?-1:d==='right'?1:0;if(d==='down'&&!e.repeat&&mode==='world')P.ang=(P.ang??YAW[P.dir])+Math.PI;}e.preventDefault();return;}
 if(e.repeat)return;if(['Enter','Space','KeyE'].includes(e.code)){e.preventDefault();pressA();}if(['Escape','KeyX','KeyM'].includes(e.code))pressB();});
document.addEventListener('keyup',e=>{if(KEYS[e.code]===held){held=null;STICK.x=STICK.y=0;}});
const st=$('#stick'),kn=$('#knob');let sid=null;
function stickMove(e){const r=st.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const max=r.width*.34,d=Math.hypot(x,y);
 if(d>max){x=x/d*max;y=y/d*max;}kn.style.transform=`translate(${x}px,${y}px)`;
 STICK.x=d<r.width*.12?0:x/max;STICK.y=d<r.width*.12?0:y/max;held=d<r.width*.22?null:Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');P.run=d>max*.92;st.dataset.run=P.run?1:'';}
function stickEnd(e){if(e.pointerId!==sid)return;sid=null;held=null;STICK.x=STICK.y=0;P.run=runLock;kn.style.transform='';st.dataset.run='';st.classList.remove('on');}
st.addEventListener('pointerdown',e=>{e.preventDefault();sid=e.pointerId;st.setPointerCapture(sid);st.classList.add('on');stickMove(e);});
st.addEventListener('pointermove',e=>{if(e.pointerId===sid)stickMove(e);});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>st.addEventListener(t,stickEnd));
const dpd=$('#dpad');let dpid=null,dpDir=null,dpAx=null,heldT=0,runLock=false;
function dpRead(e){const r=dpd.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;if(Math.hypot(x,y)<.12)return[null,null];
 const ax=Math.abs(x),ay=Math.abs(y);let main;if(dpDir&&((dpDir==='up'||dpDir==='down')?ay*1.35>ax:ax*1.35>ay))main=dpDir.match(/up|down/)?(y<0?'up':'down'):(x<0?'left':'right');else main=ax>ay?(x>0?'right':'left'):(y>0?'down':'up');
 const diag=(main==='up'||main==='down')&&ax>.18?(x<0?'left':'right'):null;return[main,diag];}
function dpApply(e){const[d,ax]=dpRead(e);if(d!==dpDir){dpDir=d;heldT=performance.now();if(d&&view==='2d'&&!P.moving&&mode==='world')P.dir=d;if(d&&view!=='2d'&&d==='down'&&mode==='world'){P.ang=(P.ang??YAW[P.dir])+Math.PI;dpDir='up';}}
 dpAx=ax;dpd.dataset.d=dpDir||'';dpd.dataset.x=dpAx||'';held=dpDir;
 if(view!=='2d'){STICK.y=dpDir==='up'?-1:0;STICK.x=dpDir==='left'?-1:dpDir==='right'?1:dpAx==='left'?-.6:dpAx==='right'?.6:0;}}
dpd.addEventListener('pointerdown',e=>{e.preventDefault();dpid=e.pointerId;dpd.setPointerCapture(dpid);dpDir=null;dpApply(e);});
dpd.addEventListener('pointermove',e=>{if(e.pointerId===dpid)dpApply(e);});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>dpd.addEventListener(t,e=>{if(e.pointerId!==dpid)return;dpid=null;dpDir=null;dpAx=null;held=null;STICK.x=STICK.y=0;dpd.dataset.d='';dpd.dataset.x='';}));
$('#runBtn').addEventListener('pointerdown',e=>{e.preventDefault();runLock=!runLock;P.run=runLock;$('#runBtn').setAttribute('aria-pressed',runLock);sfx('tap');});
document.addEventListener('keydown',e=>{if(e.key==='Shift')P.run=true;});document.addEventListener('keyup',e=>{if(e.key==='Shift')P.run=runLock;});
$('#btnA').addEventListener('pointerdown',e=>{e.preventDefault();pressA();});
$('#btnB').addEventListener('pointerdown',e=>{e.preventDefault();pressB();});
$('#dlg').addEventListener('pointerdown',e=>{if(e.target.tagName!=='BUTTON')advDlg();});
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;sel=null;renderMenu();});
$('#mClose').onclick=closeMenu;$('#viewBtn').onclick=()=>{if(!G||mode==='title')return;setView(VIEWS[(VIEWS.indexOf(view)+1)%3]);};$('#shopClose').onclick=closeMenu;
$('#tNew').onclick=()=>{if(loadSave()&&!$('#tNew').dataset.c){$('#tNew').dataset.c=1;$('#tNew').textContent='Alten Spielstand überschreiben?';return;}newGame();};
$('#tCont').onclick=cont;$('#tOpt').onclick=()=>{$('#opts').hidden=false;rSettings($('#optBody'));};$('#optClose').onclick=()=>{$('#opts').hidden=true;};if(!loadSave())$('#tCont').hidden=true;

// ---------- Hauptschleife ----------
let lastFrame=0,lastDt=16;function loop(t){if(SET.fps&&t-lastFrame<1000/SET.fps-3){requestAnimationFrame(loop);return;}lastFrame=t;const dt=Math.min(120,t-(lastT||t));lastT=t;lastDt=dt;anim=t;
 if(G&&mode==='world'){clockAcc+=dt;if(clockAcc>=1000){clockAcc-=1000;G.time=(G.time+1)%1440;updClock();}
  if(P.moving){P.t+=dt/(P.run?230:360);if(P.t>=1){P.moving=false;P.px=P.x;P.py=P.y;G.px=P.x;G.py=P.y;onStep();}
   else{P.px=P.fx+(P.x-P.fx)*P.t;P.py=P.fy+(P.y-P.fy)*P.t;}}
  if(view!=='2d')freeMove(dt);else if(!P.moving&&held&&mode==='world'&&(SET.ctrl!=='kreuz'||performance.now()-heldT>110))stepInput(held);roamTick(dt);}
 if(G&&cur&&mode!=='title')(view==='2d'?draw:draw3d)();if(mode==='battle'){drawBattle();rtTick(lastDt);}
 requestAnimationFrame(loop);}
// Titelbild: ohne Kreaturen (Nutzer 10.11. 21:34 „keine Kreaturen“, QA Mechanik O1) – Canvas #tcv bleibt im DOM, ist aber ausgeblendet
(function(){const cc=$('#tcv');if(cc)cc.hidden=true;
 try{const ft=$('#tFoot');if(ft)ft.textContent=typeof fsCan==='function'&&fsCan()&&SET.fs!==0&&matchMedia('(pointer:coarse)').matches?'Beim ersten Tippen geht es ins Vollbild':'Am schönsten im Querformat';}catch(e){}})();
window.claude?.hot?.snapshot?.(()=>G?{G:JSON.stringify(G)}:{});
new ResizeObserver(()=>fitView()).observe($('#screen'));
$('#fsBtn').onclick=()=>fsToggle();if(!fsCan())$('#fsBtn').hidden=true;
// Querformat: Tippen irgendwo ins Bild blättert den Dialog weiter (Steuerung ist währenddessen ausgeblendet)
$('#screen').addEventListener('pointerdown',e=>{if(mode==='dialog'&&!$('#dlgOpts').children.length&&!(e.target.closest&&e.target.closest('#dlg,button,#hudOv,.layer')))advDlg();});
function boot(d){applySet();if(d&&d.G){try{G=JSON.parse(d.G);start();$('#intro').hidden=true;}catch(e){}}else if(!SET.intro)$('#intro').hidden=true;requestAnimationFrame(loop);}
window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});

// ---------- HUD: Minikarte & Mission ----------
let mmImg=null,mmFor=null;
function mmCol(t){const p=PAL[cur.theme];if(ROOF[t])return ROOF[t];if(/[0-9E]/.test(t))return'#5c3a24';
 return{'.':p.g,',':p.p,'"':p.tg,'T':p.tr,'~':p.w,'=':'#a87a4a','R':p.r,'X':p.tr,'c':p.g,':':p.tg,'F':shade(p.g,1.1),'o':'#d8c19c','D':'#24461f','G':'#9a8a70','Q':'#7fc0e8','I':'#d6f3ff','W':'#5e4b40'}[t]||'#8a7a6a';}
function hudTick(){if(!G||!cur||mode==='title'){$('#hudOv').hidden=true;return;}$('#hudOv').hidden=false;guideTick();{const h=$('#hq'),t=h.textContent;if(t!==h._t||!h.firstElementChild){const[a,b]=t.split('  ›  ');h.innerHTML=`<b>${a}</b>${b?`<small>${b}</small>`:''}`;h._t=t;hudNeed(a);}}
 if(mode!=='world'&&!$('#hqCard').hidden)hqToggle(false);
 if(!$('#mmW').classList.contains('show'))return;const c=$('#mm'),x=c.getContext('2d'),S=c.width;if(mmFor!==cur.id){mmFor=cur.id;const o=document.createElement('canvas');o.width=cur.w;o.height=cur.h;const ox=o.getContext('2d');
  for(let y=0;y<cur.h;y++)for(let xx=0;xx<cur.w;xx++){ox.fillStyle=mmCol(cur.rows[y][xx]);ox.fillRect(xx,y,1,1);}mmImg=o;}
 const k=S/12;x.clearRect(0,0,S,S);x.save();x.beginPath();x.arc(S/2,S/2,S/2,0,7);x.clip();x.fillStyle='#16201c';x.fillRect(0,0,S,S);x.imageSmoothingEnabled=false;
 x.drawImage(mmImg,S/2-(P.px+.5)*k,S/2-(P.py+.5)*k,cur.w*k,cur.h*k);const dot=(px,py,col,r)=>{x.fillStyle=col;x.beginPath();x.arc(S/2+(px-P.px)*k,S/2+(py-P.py)*k,r,0,7);x.fill();};
 ROAM.list.forEach(r=>dot(r.px,r.py,'#ff9a4a',k*.32));VILL.list.forEach(v=>dot(v.px,v.py,'#ffffff',k*.24));npcs().filter(n=>n.t==='trainer'&&!G.flags[n.flag]).forEach(n=>dot(n.x,n.y,'#ef5b55',k*.3));
 const ga=guideAngle();if(ga!=null){const rot=view!=='2d'&&P.ang!=null?P.ang:0;x.save();x.translate(S/2,S/2);x.rotate(ga);x.fillStyle='#ff7a3d';x.beginPath();x.moveTo(0,-S/2+3);x.lineTo(-7,-S/2+14);x.lineTo(7,-S/2+14);x.closePath();x.fill();x.restore();}
 x.translate(S/2,S/2);x.rotate(-(view!=='2d'&&P.ang!=null?P.ang:YAW[P.dir]));x.fillStyle='#ffc24d';x.strokeStyle='#2a1700';x.lineWidth=1.5;x.beginPath();x.moveTo(0,-k*.75);x.lineTo(k*.5,k*.5);x.lineTo(0,k*.25);x.lineTo(-k*.5,k*.5);x.closePath();x.fill();x.stroke();x.restore();}
setInterval(hudTick,180);
// Missionszeile: Tipp klappt Detailkarte auf, erst dort geht es ins Menü
let hqT=0;
function hqToggle(on){const c=$('#hqCard'),h=$('#hq');on=on??c.hidden;clearTimeout(hqT);h.classList.toggle('open',on);h.setAttribute('aria-expanded',on);
 if(!on){c.hidden=true;if(mode==='world')hqShow(2500);return;}const q=QUESTS.find(q=>!G.flags[q.f]);
 c.innerHTML=`<small>${q?'Aktuelle Mission':'Hauptgeschichte abgeschlossen'}</small><b>${q?q.title:crownTitle()+' von Veyra'}</b><p>${q?q.d:'Fange alle Kreaturen und finde die Legenden.'}</p>${GP?`<span class="hqt">${GP.l}</span>`:''}<button type="button">Alle Missionen</button>`;
 c.querySelector('button').onclick=e=>{e.stopPropagation();openMenu('quest');};c.hidden=false;c.style.setProperty('--hqh',h.offsetHeight+'px');sfx('tap');hqT=setTimeout(()=>hqToggle(false),7000);}
$('#hq').onclick=()=>{if(mode==='world')hqToggle();};
// ---------- Look L2: HUD nur bei Bedarf (Uhr blendet nach 3 s ab, Ziel-Zeile bei Änderung, Minikarte auf Tipp/Halten) ----------
const HUDL={clockT:0,hqT:0,quest:null,area:null,wx:null,mmT:0,mmDown:0,mmWas:false};
function hudWake(){const p=$('#hudP');if(!p)return;p.classList.remove('dim');clearTimeout(HUDL.clockT);HUDL.clockT=setTimeout(()=>p.classList.add('dim'),3000);}
function hqShow(ms){const h=$('#hq');h.classList.add('show');clearTimeout(HUDL.hqT);HUDL.hqT=setTimeout(()=>{if(!h.classList.contains('open'))h.classList.remove('show');},ms||6000);}
function mmShow(on,ms){const w=$('#mmW'),b=$('#mmBtn');w.classList.toggle('show',!!on);if(b)b.setAttribute('aria-pressed',on?'true':'false');clearTimeout(HUDL.mmT);if(on){mmFor=null;hudTick();if(ms)HUDL.mmT=setTimeout(()=>mmShow(false),ms);}}
function hudNeed(quest){if(!G||!cur)return;if(cur.id!==HUDL.area){HUDL.area=cur.id;hudWake();}
 const w=$('#hudClock').dataset.w;if(w!==HUDL.wx){HUDL.wx=w;hudWake();}
 if(quest!==HUDL.quest){const first=HUDL.quest===null;HUDL.quest=quest;if(mode==='world'||first)hqShow(first?7000:6000);}}
$('#hudP').addEventListener('click',()=>{if(!G||mode==='title')return;hudWake();hqShow(6000);try{sfx('tap');}catch(e){}});
$('#hudP').addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();$('#hudP').click();}});
{const mb=$('#mmBtn');mb.addEventListener('pointerdown',e=>{e.preventDefault();HUDL.mmDown=performance.now();HUDL.mmWas=$('#mmW').classList.contains('show');mmShow(true);try{sfx('tap');}catch(x){}});
 const up=()=>{if(!HUDL.mmDown)return;const held=performance.now()-HUDL.mmDown;HUDL.mmDown=0;if(held>380)mmShow(false);else if(HUDL.mmWas)mmShow(false);else mmShow(true,6000);};
 mb.addEventListener('pointerup',up);mb.addEventListener('pointercancel',up);mb.addEventListener('pointerleave',up);
 mb.addEventListener('click',e=>{if(e.detail===0)mmShow(!$('#mmW').classList.contains('show'),6000);});}

// ---------- Migration (Spielstand-Felder der UI) ----------
function migrateUi(g){g.visited=g.visited||{};g.visited[g.map]=1;if(g.respawn)g.visited[g.respawn.map]=1;g.known2=g.known2||{};g.outfit=Object.assign(defaultOutfit(),g.outfit||{});g.rival=g.rival||'Lio';g.name=g.name||'Noa';}
const _loadMapV=loadMap;loadMap=function(id,x,y){_loadMapV(id,x,y);if(G){(G.visited||(G.visited={}))[id]=1;}
 /* Look L2: wilde Kreaturen gleich beim Kartenwechsel setzen (wie roamTick) – in 3D dauert der erste Frame einer neuen Karte, sonst ploppen sie erst danach auf */
 try{if(G&&cur&&typeof spawnRoam==='function'&&ROAM.map!==cur.id){spawnRoam();if(typeof compReset==='function')compReset();}}catch(e){}};
// Gebietsbanner statt Titelkarte (SEQ.areaBanner in 23-intro.js); #mapCard bleibt das Element
function mapCard(m){const R=regionOf(m.id),app=$('#app');app.style.setProperty('--lead',R[1]);app.style.setProperty('--accent',R[2]);
 if(m.inside){toast(m.name);return;}const region=m.name===R[0]?(isNight()?'Bei Nacht':'Bei Tag'):R[0];
 if(seqHas('areaBanner'))return playSeq('areaBanner',{name:m.name,region,lead:R[1]});$('#mcName').textContent=m.name;$('#mcRegion').textContent=region;const c=$('#mapCard');c.classList.remove('on');void c.offsetWidth;c.classList.add('on');clearTimeout(cardT);cardT=setTimeout(()=>c.classList.remove('on'),2600);}

// ---------- Bildschirmkoordinaten ----------
// Feld (tx,ty) + Höhe hu (in Feldern) → [x,y,Feldhöhe] in CSS-Pixeln relativ zu #screen; null, wenn hinter der Kamera
function worldPt(tx,ty,hu){const s=$('#screen'),W=s.clientWidth,H=s.clientHeight;if(!W||!cur)return null;
 if(view!=='2d'&&R3&&R3.cam&&R3.mapId===cur.id&&window.THREE){const gy=typeof terrainY==='function'?terrainY(tx+.5,ty+.5):0,v=new THREE.Vector3(tx+.5,gy+(hu||0),ty+.5),d=v.clone().sub(R3.cam.position),fw=new THREE.Vector3();R3.cam.getWorldDirection(fw);
  if(d.dot(fw)<=.05)return null;v.project(R3.cam);return[(v.x+1)/2*W,(1-v.y)/2*H,H/(2*Math.tan(R3.cam.fov*Math.PI/360)*d.length())];}
 const k=W/(VW*TS),ox=Math.round(camX*SC)/SC,oy=Math.round(camY*SC)/SC;return[(tx*TS+8-ox)*k,(ty*TS+12-(hu||0)*TS-oy)*k,TS*k];}
function playerScreen(){const s=$('#screen');if(!s||!cur||!G)return null;const r=s.getBoundingClientRect(),p=worldPt(P.px,P.py,.55);return p?{x:r.left+p[0],y:r.top+p[1],h:p[2]}:null;}

// ---------- Overlay über #screen: Emotes (2D), Brotkrumen, Zielpfeil, Umgebungs-Sprechblasen ----------
const NAV={arrowT:0},EMO=[],EMOSYM={'!':'#e2554d','?':'#3d6fd6','…':'#66728a','♪':'#2fa86a','♥':'#ff5f8a','✦':'#ff9a3a'},EMOMAP={note:'♪',heart:'♥',drop:'…'};
// emote(npcOrPos, sym): npc-Objekt {x,y}, Feld [x,y] oder null (= Spielfigur); Kreaturen (ROAM/COMP) behalten ihr eigenes Emote aus 04-roam.js
const _emoR=emote;emote=function(t,sym){if(t&&!Array.isArray(t)&&(t===COMP||ROAM.list.includes(t)))return _emoR(t,sym);sym=EMOMAP[sym]||sym;if(!EMOSYM[sym])sym='!';
 for(let i=EMO.length-1;i>=0;i--)if(EMO[i].who===t){emoKill(EMO[i]);EMO.splice(i,1);}EMO.push({who:t,sym,t0:performance.now(),life:sym==='…'?1900:1400});sfx('emote');};
function emoPos(e){const w=e.who;if(!w)return[P.px,P.py];if(Array.isArray(w))return w;return[w.px??w.x,w.py??w.y];}
function emoKill(e){if(e.spr){e.spr.parent&&e.spr.parent.remove(e.spr);e.spr.material.dispose();e.spr=null;}}
const EMOTX={};function emoTex2(sym){if(EMOTX[sym])return EMOTX[sym];const c=document.createElement('canvas');c.width=c.height=96;emoBubble(c.getContext('2d'),48,42,30,sym,1);return EMOTX[sym]=new THREE.CanvasTexture(c);}
function emoBubble(x,cx,cy,r,sym,s){x.save();x.translate(cx,cy);x.scale(s,s);x.fillStyle='#fff';x.strokeStyle='rgba(24,34,48,.75)';x.lineWidth=r*.12;x.beginPath();x.arc(0,0,r,0,7);x.moveTo(-r*.28,r*.9);x.lineTo(0,r*1.4);x.lineTo(r*.3,r*.88);x.fill();x.stroke();
 x.fillStyle='#fff';x.beginPath();x.arc(0,0,r*.9,0,7);x.fill();x.fillStyle=EMOSYM[sym];x.textAlign='center';x.textBaseline='middle';x.font=`800 ${r*(sym==='…'?1.1:1.25)}px Fredoka, sans-serif`;x.fillText(sym,0,sym==='…'?-r*.18:r*.06);x.restore();}
function emoDraw(x,now){for(let i=EMO.length-1;i>=0;i--){const e=EMO[i],k=(now-e.t0)/e.life;if(k>=1){emoKill(e);EMO.splice(i,1);continue;}
 const[tx,ty]=emoPos(e),s=Math.min(1,ezB(k*5)),a=k>.82?(1-k)/.18:1;
 if(view!=='2d'&&R3&&R3.scene){if(!e.spr){e.spr=new THREE.Sprite(new THREE.SpriteMaterial({map:emoTex2(e.sym),transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false}));e.spr.renderOrder=20;}
  if(e.spr.parent!==R3.scene)R3.scene.add(e.spr);const gy=typeof terrainY==='function'?terrainY(tx+.5,ty+.5):0;e.spr.position.set(tx+.5,gy+1.95+k*.12,ty+.5);e.spr.scale.setScalar(.62*s);e.spr.material.opacity=a;continue;}
 if(e.spr){emoKill(e);}const p=worldPt(tx,ty,1.55);if(!p)continue;x.globalAlpha=a;emoBubble(x,p[0],p[1]-k*4,Math.max(10,p[2]*.36),e.sym,s);x.globalAlpha=1;}}
function crumbs(x,now){if(SET.crumbs===0||mode!=='world'||!GP)return;const dx=GP.x-P.px,dy=GP.y-P.py,d=Math.hypot(dx,dy);if(d<1.8)return;const ux=dx/d,uy=dy/d;
 for(let i=0;i<4;i++){const s=1.05+i*.7;if(s>d-.7)break;const p=worldPt(P.px+ux*s,P.py+uy*s,.02);if(!p)continue;const ph=((now/1100)-i*.2+4)%1,a=.18+.42*Math.pow(Math.max(0,Math.sin(ph*Math.PI)),2),r=Math.max(2.2,p[2]*.075);
  x.globalAlpha=a;x.fillStyle='#fff';x.beginPath();x.arc(p[0],p[1],r*1.5,0,7);x.fill();x.fillStyle='#ff7a3d';x.beginPath();x.arc(p[0],p[1],r,0,7);x.fill();}x.globalAlpha=1;}
function navArrow(x,now){const k=(now-NAV.arrowT)/1900;if(k<0||k>1||!GP)return;const p0=worldPt(P.px,P.py,.2),d=Math.hypot(GP.x-P.px,GP.y-P.py);if(!p0||d<.8)return;
 const p1=worldPt(P.px+(GP.x-P.px)/d,P.py+(GP.y-P.py)/d,.2);if(!p1)return;const a=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]),R=Math.max(26,p0[2]*1.15),s=ezB(Math.min(1,k*4)),al=k>.75?(1-k)/.25:1;
 x.save();x.translate(p0[0],p0[1]);x.globalAlpha=al*.9;x.strokeStyle='rgba(255,122,61,.55)';x.lineWidth=3;x.setLineDash([3,6]);x.beginPath();x.ellipse(0,0,R*s,R*s*.62,0,0,7);x.stroke();x.setLineDash([]);
 x.rotate(a);x.translate(R*s+Math.sin(now/120)*2,0);x.scale(s,s);x.fillStyle='#ff7a3d';x.strokeStyle='#fff';x.lineWidth=3;x.lineJoin='round';x.beginPath();x.moveTo(14,0);x.lineTo(-6,-11);x.lineTo(-2,0);x.lineTo(-6,11);x.closePath();x.stroke();x.fill();x.restore();}
// Umgebungs-Sprechblasen: nahe Bewohner murmeln kurze Sätze, ohne angesprochen zu werden
const AMB={next:0,who:null,until:0,seen:new Map()};
function shortLine(t){t=rivalize(String(Array.isArray(t)?t[0]:t||'')).replace(/^[^:\n]{2,30}: /,'').replace(/\n/g,' ');const m=t.match(/^.*?[.!?…](\s|$)/);let s=(m?m[0]:t).trim();
 if(s.length>40){s=s.slice(0,38);const sp=s.lastIndexOf(' ');s=s.slice(0,sp>20?sp:38).replace(/[,;:]$/,'')+' …';}return s;}
function ambTick(now){const b=$('#ambB');if(mode!=='world'||SET.amb===0){if(AMB.who){AMB.who=null;b.classList.remove('on');}return;}
 if(AMB.who){const w=AMB.who,p=worldPt(w.px??w.x,w.py??w.y,1.5);if(!p||now>AMB.until){AMB.who=null;b.classList.remove('on');AMB.next=now+4200+Math.random()*3500;}else b.style.transform=`translate(${p[0]|0}px,${p[1]|0}px)`;return;}
 if(now<AMB.next||P.moving)return;AMB.next=now+1400;const near=w=>{const d=Math.abs((w.px??w.x)-P.px)+Math.abs((w.py??w.y)-P.py);return d>=1.5&&d<=4.5;};
 const L=npcs().filter(n=>n.t==='talk'&&n.txt&&!n.prof&&near(n)).map(n=>({w:n,t:n.txt})).concat(typeof VILL!=='undefined'?VILL.list.filter(near).map(v=>({w:v,t:null})):[]).filter(o=>now-(AMB.seen.get(o.w)||-1e9)>26000);
 if(!L.length)return;const o=L[Math.floor(Math.random()*L.length)],line=shortLine(o.t||(typeof villLine==='function'?villLine():''));if(!line)return;AMB.seen.set(o.w,now);AMB.who=o.w;AMB.until=now+2900;b.innerHTML=`<span>${line}</span>`;b.classList.remove('on');void b.offsetWidth;b.classList.add('on');}
function ovTick(){const c=$('#ovCv'),s=$('#screen'),W=s.clientWidth,H=s.clientHeight,dpr=Math.min(2,devicePixelRatio||1);if(!W)return;if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}
 const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);if(!G||!cur||mode==='title')return;const now=performance.now();crumbs(x,now);navArrow(x,now);emoDraw(x,now);ambTick(now);}
const _drawOv=draw;draw=function(){_drawOv();if(view==='2d')ovTick();};const _draw3Ov=draw3d;draw3d=function(){_draw3Ov();ovTick();};

// ---------- Dialog: Sprecher-Porträt (gezeichnetes Gesicht), Schilder, „Du erhältst …“ ----------
const DLG={pend:null,cur:null};
const _say0=say;say=function(l,cb){DLG.cur=DLG.pend;DLG.pend=null;return _say0(l,cb);};
const _ask0=ask;ask=function(q,o,cb){DLG.cur=DLG.pend;DLG.pend=null;return _ask0(q,o,cb);};
function faceFor(name,n){const nm=(name||'').trim();if(/Lindqvist|Veyran/.test(nm))return{mentor:1};let h=voiceOf(nm);h=Math.abs(h*2654435761|0);
 if(G&&(nm===G.rival||/^Rivale/.test(nm)))return{o:{skin:'#f3cfae',hair:'wuschel',hairCol:'#c8462e',top:'#7a9ad9',pants:'#26304a',cap:false,capCol:'#000000'}};
 if(G&&nm===G.name)return{o:G.outfit};const top=n&&/^#[0-9a-f]{6}$/i.test(n.c||'')?n.c:OUTFIT.top[h%8];
 return{o:{skin:OUTFIT.skin[(h>>4)%5],hair:OUTFIT.hair[(h>>7)%5].k,hairCol:OUTFIT.hairCol[(h>>10)%6],top,pants:'#26304a',cap:!!(n&&n.c)&&(h>>13)%2===0,capCol:shade(top,.62)}};}
function drawFace(cv,name,n){const c=cv.getContext('2d'),W=cv.width,f=faceFor(name,n);c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(W/2,W/2,W/2,0,7);c.clip();
 const g=c.createLinearGradient(0,0,0,W);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#dfe6ee');c.fillStyle=g;c.fillRect(0,0,W,W);
 if(f.mentor){const k=2*W/112;drawMentor(c,W/2,W*.56+100*k,100*k,1000,false);}else{const k=1.7*W/112;drawHero(c,W/2,W*.56+78*k,100*k,f.o,1000,{noShadow:true});}c.restore();}
const _setDlg=setDlg;setDlg=function(s){_setDlg(s);const n=$('#dlgName'),p=$('#dlgPor'),fc=$('#dlgFace'),d=$('#dlg'),sign=DLG.cur&&DLG.cur.t==='sign';d.classList.toggle('who',!n.hidden);d.classList.toggle('sign',!!sign);
 const txt=String(s).replace(/^([^:\n]{2,30}): /,''),get=/^Du (erhältst|hast|bekommst)\b/.test(txt)&&/(erhältst|erhalten|gefunden|bekommst)/.test(txt);d.classList.toggle('get',get);
 if(get&&d._got!==s){d._got=s;if(typeof playJingle==='function')playJingle('item');else if(performance.now()-(SFXT.lvl||0)>600)sfx('lvl');}
 p.hidden=true;fc.hidden=n.hidden||sign;if(n.hidden||sign)return;const nm=n.textContent.trim(),w=nm.split(/\s+/).filter(x=>!/\.$/.test(x)),h=voiceOf(nm)*7%360;
 p.textContent=(w[0]||nm)[0].toUpperCase();p.style.setProperty('--pc',`hsl(${h} 62% 56%)`);if(fc._who!==nm){fc._who=nm;drawFace(fc,nm,DLG.cur);fc.classList.remove('in');void fc.offsetWidth;fc.classList.add('in');}};
// Eingehender Ruf über die Chronik: chronikCall(name, lines) → Promise (nach dem Gespräch)
function chronikCall(name,lines){return new Promise(res=>{const o=$('#callOv');mode='wait';held=null;
 o.innerHTML=`<div class="clCard"><span class="clRing"><canvas width="112" height="112"></canvas></span><div class="clTx"><small>Eingehender Ruf · Chronik</small><b>${name}</b></div><button type="button" class="clOk">Annehmen</button></div>`;
 drawFace(o.querySelector('canvas'),name);o.hidden=false;o.classList.remove('out');sfx('ring');vib([60,80,60]);const ri=setInterval(()=>{sfx('ring');vib([60,80,60]);},1700);let done=0;
 const go=()=>{if(done)return;done=1;clearInterval(ri);o.classList.add('out');setTimeout(()=>{o.hidden=true;o.classList.remove('out');},260);mode='world';
  say([].concat(lines).map(l=>/^[^:\n]{2,30}: /.test(l)?l:name+': '+l),()=>res(true));};
 o.querySelector('.clOk').onclick=e=>{e.stopPropagation();sfx('tap');go();};setTimeout(go,9000);});}
setInterval(()=>{try{if(!G||mode!=='world'||B||SEQ_AUTO()||!G.flags.firstcatch||G.flags.call_first)return;G.flags.call_first=1;
 setTimeout(()=>{if(mode!=='world'){G.flags.call_first=0;return;}chronikCall('Prof. Veyran',['Hallo, '+G.name+'! Hier spricht Prof. Veyran – über deine Chronik.','Deine erste gefangene Kreatur! Herzlichen Glückwunsch, der Eintrag steht schon im Chronik-Dex.',G.rival+' hat übrigens auch gerade angerufen und will dich unbedingt vor der Arena in Kupferhain überholen.','Wenn du nicht weiterweißt: Öffne die Chronik. Die Karte zeigt dir den Weg.']);},1500);}catch(e){}},800);

// ---------- Chronik-Seiten: Karte, Kreaturenbox, Medaillen ----------
const APPICON={map:'<svg viewBox="0 0 24 24"><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" fill="currentColor" opacity=".25"/><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5zM9 4v13.5M15 6.5V20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
 team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="11" r="5" fill="currentColor" opacity=".25"/><circle cx="9" cy="11" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="13.5" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="10.5" cy="10.5" r="1" fill="currentColor"/><path d="M5 6.5L4 3.5l3 1.5M13 6.5l1-3-3 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
 quest:'<svg viewBox="0 0 24 24"><path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
 dex:'<svg viewBox="0 0 24 24"><path d="M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V19c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5z" fill="currentColor" opacity=".25"/><path d="M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V19c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5zM12 6v13.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
 bag:'<svg viewBox="0 0 24 24"><path d="M5 9h14l-1 10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="currentColor" opacity=".25"/><path d="M5 9h14l-1 10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 9V7a3 3 0 0 1 6 0v2M10 13h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
 box:'<svg viewBox="0 0 24 24"><path d="M3.5 8.5L12 4l8.5 4.5v8L12 21l-8.5-4.5z" fill="currentColor" opacity=".25"/><path d="M3.5 8.5L12 4l8.5 4.5v8L12 21l-8.5-4.5zM3.5 8.5L12 13l8.5-4.5M12 13v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
 medals:'<svg viewBox="0 0 24 24"><path d="M8 3h3l1 5-3 1zM16 3h-3l-1 5 3 1z" fill="currentColor" opacity=".35"/><circle cx="12" cy="15" r="6" fill="currentColor" opacity=".25"/><circle cx="12" cy="15" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 12l.9 1.9 2 .3-1.45 1.4.35 2-1.8-1-1.8 1 .35-2-1.45-1.4 2-.3z" fill="currentColor"/></svg>',
 game:'<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8M4 12h2M10 12h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="7" r="2.2" fill="currentColor"/><circle cx="10" cy="17" r="2.2" fill="currentColor"/><circle cx="8" cy="12" r="2.2" fill="currentColor"/></svg>'};
let mapView='here';
function canFastTravel(){return!!(G.flags.fasttravel||G.badges.length>=1);}
// Weltschema aus den Kartenverbindungen (n/s/o/w + Türen zu Außenkarten)
let WL=null;function worldLayout(){if(WL)return WL;const L={morgenau:[0,0]},q=['morgenau'],D={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]},used=new Set(['0,0']);
 const put=(id,p,st)=>{let g=0;while(used.has(p.map(v=>v.toFixed(2))+'')&&g++<12)p=[p[0]+st[0],p[1]+st[1]];L[id]=p;used.add(p.map(v=>v.toFixed(2))+'');q.push(id);};
 while(q.length){const id=q.shift(),m=MAPS[id];if(!m)continue;for(const d of 'nsew'){const to=m[d];if(typeof to==='string'&&MAPS[to]&&!L[to])put(to,[L[id][0]+D[d][0],L[id][1]+D[d][1]],D[d].map(v=>v*.5));}
  for(const k in m.doors||{}){const to=m.doors[k];if(MAPS[to]&&!L[to])put(to,[L[id][0]+.6,L[id][1]-.5],[.5,0]);}}
 let i=0;for(const id in MAPS)if(!L[id])put(id,[i++,4],[1,0]);return WL=L;}
function healSpots(){const out=[];for(const town in MAPS){const m=MAPS[town];for(const k in m.doors||{}){const id=m.doors[k];if(!INTERIORS[id]||INTERIORS[id].k!=='heal')continue;for(let y=0;y<m.rows.length;y++){const x=m.rows[y].indexOf(k);if(x>=0){out.push({town,heal:id,x,y:y+1});break;}}}}return out;}
function topMap(){return cur.inside?(G.ret&&G.ret.map)||'morgenau':cur.id;}
function rMap(el){const seg=document.createElement('div');seg.className='seg mapseg';seg.setAttribute('role','tablist');
 [['here',cur.inside?cur.name:cur.name],['world','Welt']].forEach(([k,l])=>{const b=document.createElement('button');b.textContent=l;b.className=mapView===k?'on':'';b.setAttribute('role','tab');b.setAttribute('aria-selected',mapView===k);b.onclick=()=>{mapView=k;sfx('page');renderMenu();};seg.appendChild(b);});el.appendChild(seg);
 const wrap=document.createElement('div');wrap.className='mapW '+mapView;const cv=document.createElement('canvas');cv.className='bigmap';cv.setAttribute('aria-label',mapView==='world'?'Weltkarte':'Karte von '+cur.name);const tip=document.createElement('span');tip.className='mtip';tip.hidden=true;wrap.append(cv,tip);el.appendChild(wrap);
 const T=questTarget();el.insertAdjacentHTML('beforeend',`<p class="mgoal"><i aria-hidden="true"></i><span><small>Ziel</small>${GP?GP.l:T?T.l:'Kein Ziel – erkunde Veyra!'}</span></p>`);
 if(mapView==='world'){const H=document.createElement('h3');H.innerHTML='Schnellreise <small>'+(canFastTravel()?'zu besuchten Kreaturenstationen':'ab der ersten Medaille')+'</small>';el.appendChild(H);
  const box=document.createElement('div');box.className='ftl';const spots=healSpots();spots.forEach(sp=>{const vis=G.visited[sp.heal]||G.visited[sp.town],b=document.createElement('button');b.className='ftb';
   const R=REGION[sp.town];b.style.setProperty('--rc',vis&&R?R[1]:'#c3ccd8');b.innerHTML=`<i aria-hidden="true"></i><b>${vis?MAPS[sp.town].name:'???'}</b><small>${vis?'Kreaturenstation':'Noch nicht besucht'}</small>`;b.disabled=!vis||!canFastTravel()||topMap()===sp.town&&!cur.inside;
   b.onclick=()=>{sfx('tap');playSeq('fastTravel',{to:sp.town,x:sp.x,y:sp.y,label:MAPS[sp.town].name,ret:{map:sp.town,x:sp.x,y:sp.y}});};box.appendChild(b);});el.appendChild(box);}
 requestAnimationFrame(()=>{if(!wrap.isConnected)return;(mapView==='world'?drawWorldMap:drawHereMap)(cv,tip,wrap);});}
function mapTip(tip,wrap,x,y,t){tip.textContent=t;tip.hidden=false;tip.style.left=x+'px';tip.style.top=y+'px';tip.classList.remove('in');void tip.offsetWidth;tip.classList.add('in');sfx('tap');}
function drawHereMap(cv,tip,wrap){const m=cur,W=wrap.clientWidth,maxH=Math.max(180,Math.min(innerHeight*.52,520)),ts=Math.max(4,Math.min(W/m.w,maxH/m.h)),w=m.w*ts,h=m.h*ts,dpr=Math.min(2,devicePixelRatio||1);
 cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+'px';cv.style.height=h+'px';const c=cv.getContext('2d');c.scale(dpr,dpr);
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];c.fillStyle=mmCol(t);c.fillRect(x*ts,y*ts,ts+.5,ts+.5);if(t==='T'||t==='"'){c.fillStyle='rgba(0,0,0,.08)';c.beginPath();c.arc(x*ts+ts/2,y*ts+ts/2,ts*.32,0,7);c.fill();}}
 const POI=[];for(const k in m.doors||{}){const id=m.doors[k];for(let y=0;y<m.h;y++){const x=m.rows[y].indexOf(k);if(x>=0){let nm=id==='@out'?'Ausgang':(INTERIORS[id]?INTERIORS[id].name:(MAPS[id]&&MAPS[id].name)||id);POI.push({x,y,l:nm,k:'door',id});break;}}}
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='E')POI.push({x,y,l:'Ausgang',k:'door'});
 const raw=MAPS[m.id]||{};[['n',m.w/2,0],['s',m.w/2,m.h-1],['w',0,m.h/2],['e',m.w-1,m.h/2]].forEach(([d,x,y])=>{const to=raw[d];if(typeof to==='string'&&MAPS[to])POI.push({x,y,l:(G.visited[to]?MAPS[to].name:'Unbekannt')+' '+({n:'↑',s:'↓',w:'←',e:'→'}[d]),k:'edge'});});
 npcs().forEach(n=>{if(n.t==='trainer'&&!G.flags[n.flag])POI.push({x:n.x,y:n.y,l:n.name||'Wanderer',k:'tr'});else if(n.t==='nurse')POI.push({x:n.x,y:n.y,l:'Pflegerin',k:'npc'});else if(n.t==='shop')POI.push({x:n.x,y:n.y,l:'Verkäufer',k:'npc'});});
 POI.forEach(p=>{const X=p.x*ts+ts/2,Y=p.y*ts+ts/2;if(p.k==='door'){c.fillStyle='#fff';c.strokeStyle='#182230';c.lineWidth=1.5;c.beginPath();c.roundRect(X-ts*.4,Y-ts*.4,ts*.8,ts*.8,ts*.2);c.fill();c.stroke();}
  else if(p.k==='tr'){c.fillStyle='#ef5b55';c.beginPath();c.arc(X,Y,ts*.32,0,7);c.fill();}else if(p.k==='edge'){c.fillStyle='rgba(24,34,48,.55)';c.beginPath();c.arc(X,Y,ts*.3,0,7);c.fill();}});
 if(GP){const X=Math.max(0,Math.min(m.w-1,GP.x))*ts+ts/2,Y=Math.max(0,Math.min(m.h-1,GP.y))*ts+ts/2,r=Math.max(6,ts*.45);c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(X,Y+r*.9,r*.7,r*.25,0,0,7);c.fill();
  c.fillStyle='#ff7a3d';c.beginPath();c.moveTo(X,Y+r*.8);c.lineTo(X-r*.75,Y-r*.6);c.arc(X,Y-r*.8,r*.8,Math.PI*.82,Math.PI*.18);c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.arc(X,Y-r*.8,r*.32,0,7);c.fill();POI.push({x:GP.x,y:GP.y,l:'Ziel: '+GP.l,k:'goal'});}
 const X=P.px*ts+ts/2,Y=P.py*ts+ts/2,r=Math.max(6,ts*.48);c.save();c.translate(X,Y);c.rotate(view!=='2d'&&P.ang!=null?P.ang:YAW[P.dir]);c.fillStyle='rgba(255,194,77,.3)';c.beginPath();c.arc(0,0,r*1.6,0,7);c.fill();
 c.fillStyle='#ffc24d';c.strokeStyle='#2a1700';c.lineWidth=1.6;c.beginPath();c.moveTo(0,-r);c.lineTo(r*.7,r*.7);c.lineTo(0,r*.35);c.lineTo(-r*.7,r*.7);c.closePath();c.fill();c.stroke();c.restore();POI.push({x:P.px,y:P.py,l:'Du ('+(G.name||'')+')',k:'me'});
 cv.onclick=e=>{const R=cv.getBoundingClientRect(),tx=(e.clientX-R.left)/ts-.5,ty=(e.clientY-R.top)/ts-.5;let best=null,bd=2.2;POI.forEach(p=>{const d=Math.hypot(p.x-tx,p.y-ty);if(d<bd){bd=d;best=p;}});
  mapTip(tip,wrap,cv.offsetLeft+(best?best.x*ts+ts/2:e.clientX-R.left),cv.offsetTop+(best?best.y*ts:e.clientY-R.top),best?best.l:m.name);};}
function drawWorldMap(cv,tip,wrap){const L=worldLayout(),ks=Object.keys(L),xs=ks.map(k=>L[k][0]),ys=ks.map(k=>L[k][1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),W=wrap.clientWidth,pad=26;
 const sc=Math.min((W-pad*2)/Math.max(1,x1-x0),(Math.min(innerHeight*.48,460)-pad*2)/Math.max(1,y1-y0),74),w=W,h=(y1-y0)*sc+pad*2,dpr=Math.min(2,devicePixelRatio||1),ox=(W-(x1-x0)*sc)/2;
 cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+'px';cv.style.height=h+'px';const c=cv.getContext('2d');c.scale(dpr,dpr);const Pt=k=>[ox+(L[k][0]-x0)*sc,pad+(L[k][1]-y0)*sc];
 c.lineCap='round';ks.forEach(k=>{const m=MAPS[k];for(const d of 'nsew'){const to=m[d];if(typeof to==='string'&&L[to]){const a=Pt(k),b=Pt(to),v=G.visited[k]&&G.visited[to];c.strokeStyle=v?'rgba(24,34,48,.35)':'rgba(24,34,48,.12)';c.lineWidth=v?4:3;c.setLineDash(v?[]:[2,6]);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.setLineDash([]);}}
  for(const dk in m.doors||{}){const to=m.doors[dk];if(L[to]){const a=Pt(k),b=Pt(to);c.strokeStyle='rgba(24,34,48,.15)';c.lineWidth=2;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();}}});
 const here=topMap(),T=questTarget(),tgt=T?(MAPS[T.map]?T.map:Object.keys(MAPS).find(p=>Object.values(MAPS[p].doors||{}).includes(T.map))):null,heal=new Set(healSpots().map(s=>s.town)),r=Math.max(7,Math.min(15,sc*.2));
 ks.forEach(k=>{const[x,y]=Pt(k),v=G.visited[k],R=REGION[k],town=!!TOWNS[k]||k==='siegesstrasse';c.fillStyle=v?(R?R[1]:'#8a9ab0'):'#d5dbe3';c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();if(town)c.roundRect(x-r*1.1,y-r*1.1,r*2.2,r*2.2,r*.5);else c.arc(x,y,r*.8,0,7);c.fill();c.stroke();
  if(v&&heal.has(k)){c.fillStyle='#fff';c.fillRect(x-r*.5,y-r*.15,r,r*.3);c.fillRect(x-r*.15,y-r*.5,r*.3,r);}if(!v){c.fillStyle='#8a94a6';c.font=`700 ${r}px Fredoka, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('?',x,y+1);}
  if(k===here){c.strokeStyle='#ffc24d';c.lineWidth=3;c.beginPath();c.arc(x,y,r*1.65,0,7);c.stroke();}
  if(k===tgt){c.fillStyle='#ff7a3d';c.beginPath();c.moveTo(x+r*1.2,y-r*.4);c.lineTo(x+r*.7,y-r*1.6);c.arc(x+r*1.2,y-r*1.9,r*.55,Math.PI*.9,Math.PI*.1);c.closePath();c.fill();}
  if(v&&(town||k===here)){c.font=`600 ${Math.max(10,Math.min(13,r*.95))}px Fredoka, sans-serif`;c.textAlign='center';c.textBaseline='top';c.fillStyle='#182230';c.fillText(MAPS[k].name,x,y+r*1.3);}});
 cv.onclick=e=>{const B2=cv.getBoundingClientRect(),mx=e.clientX-B2.left,my=e.clientY-B2.top;let best=null,bd=r*2.6;ks.forEach(k=>{const p=Pt(k),d=Math.hypot(p[0]-mx,p[1]-my);if(d<bd){bd=d;best=k;}});
  if(best){const p=Pt(best);mapTip(tip,wrap,cv.offsetLeft+p[0],cv.offsetTop+p[1]-r,G.visited[best]?MAPS[best].name+(REGION[best]&&REGION[best][0]!==MAPS[best].name?' · '+REGION[best][0]:''):'Noch nicht entdeckt');}};}
function rBox(el){el.insertAdjacentHTML('beforeend',`<div class="soon"><div class="soonArt" aria-hidden="true">${EMPTY.box}</div><b>Kreaturenbox</b><p class="muted">Die Kreaturenbox wird bald geöffnet.</p><span class="pill2">${G.box.length} Kreaturen im Lager</span></div>`);
 const b=document.createElement('button');b.className='pill';b.textContent='Zum Lager im Team';b.onclick=()=>{tab='team';renderMenu();};el.querySelector('.soon').appendChild(b);}
function rMedals(el){const got=G.medals||{},n=Object.keys(got).length;el.insertAdjacentHTML('beforeend',`<div class="soon slim"><b>Medaillen</b><p class="muted">Kleine Auszeichnungen für Entdeckungen und Erfolge. ${n?n+' erhalten.':'Noch keine – sie folgen in einer späteren Phase.'}</p></div><div class="medals">${Array.from({length:24},(_,i)=>`<span class="md${Object.values(got)[i]?' got':''}" aria-label="${Object.values(got)[i]?'Medaille':'Leerer Platz'}"><i></i></span>`).join('')}</div>`);}

// ---------- Einstellungen (erweitert: Chronik-Hülle, Texttempo, Textgröße S/M/L, Kampfanimationen, Kampfstart, Sprache) ----------
const SHELLS=[['glas','Glas','#eef3f8','#d81b72'],['holz','Holz & Messing','#a5683a','#e3b45a'],['kristall','Kristallglas','#bfe6f2','#ffffff'],['leder','Expeditions-Leder','#8a5a36','#e9d9b8'],['prisma','Neon-Prisma','#ff5fb8','#5fe0ff']];
function applyUiSet(){const b=document.body;b.classList.toggle('small',SET.font==='klein');b.classList.toggle('noBanim',SET.banim===0);document.documentElement.lang=SET.lang==='en'?'en':'de';const m=$('#menu');if(m){m.dataset.shell=SET.shell||'glas';m.classList.toggle('acc',!!SET.shellAcc);}}
const _applySetU=applySet;applySet=function(){_applySetU();applyUiSet();};applyUiSet();
function rSettings(el){el.innerHTML='';const sec=(t,d)=>{el.insertAdjacentHTML('beforeend',`<h3>${t}${d?` <small>${d}</small>`:''}</h3>`);const b=document.createElement('div');b.className='opts';el.appendChild(b);return b;};
 const row=(box,label,desc,ctrl)=>{const r=document.createElement('div');r.className='orow';r.innerHTML=`<div><b>${label}</b>${desc?`<p class="muted">${desc}</p>`:''}</div>`;r.appendChild(ctrl);box.appendChild(r);return r;};
 const redraw=()=>{const y=el.scrollTop;rSettings(el);el.scrollTop=y;};
 const seg=(key,opts,custom,def)=>{const d=document.createElement('div');d.className='seg';const v0=SET[key]??def;opts.forEach(([v,l])=>{const b=document.createElement('button');b.textContent=l;b.className=String(v0)===String(v)?'on':'';
  b.onclick=()=>{SET[key]=v;if(key==='quality'&&PRESET[v])Object.assign(SET,PRESET[v]);else if(custom!==false&&['res','fps','shadows','light','particles','dist','gfx'].includes(key))SET.quality='eigene';saveSet();if(['quality','res','gfx'].includes(key)){try{perfStart();w3Quality();}catch(e){}}sfx('tap');redraw();};d.appendChild(b);});return d;};
 const tog=(key,def)=>{const on=!!(SET[key]??def),b=document.createElement('button');b.className='tog'+(on?' on':'');b.setAttribute('role','switch');b.setAttribute('aria-checked',on);b.innerHTML='<i></i>';
  b.onclick=()=>{SET[key]=on?0:1;if(['shadows','light','particles'].includes(key))SET.quality='eigene';saveSet();sfx('tap');redraw();};return b;};
 const rngX=(key,min,max,step,def)=>{const w=document.createElement('label');w.className='rng';const i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;i.value=SET[key]??def;i.id='set_'+key;
  const o=document.createElement('output');o.textContent=i.value+' %';i.oninput=()=>{SET[key]=+i.value;o.textContent=i.value+' %';};i.onchange=()=>{saveSet();sfx('tap');};w.append(i,o);return w;};
 const rng=key=>{const w=document.createElement('label');w.className='rng';const i=document.createElement('input');i.type='range';i.min=0;i.max=100;i.value=SET[key];i.id='set_'+key;
  const o=document.createElement('output');o.textContent=SET[key]+' %';i.oninput=()=>{SET[key]=+i.value;o.textContent=i.value+' %';};i.onchange=()=>{saveSet();sfx('tap');};w.append(i,o);return w;};
 const pills=(...L)=>{const d=document.createElement('div');d.className='btns';L.forEach(([t,f,cls])=>{const b=document.createElement('button');b.className='pill'+(cls?' '+cls:'');b.textContent=t;b.onclick=f;d.appendChild(b);});return d;};
 const H=resH(),W=Math.round(H*innerWidth/Math.max(1,innerHeight));
 const ch=sec('Chronik','Dein Reisebegleiter');{const d=document.createElement('div');d.className='shells';SHELLS.forEach(([k,l,c1,c2])=>{const b=document.createElement('button');b.className='shl'+((SET.shell||'glas')===k?' on':'');b.dataset.shell=k;b.style.setProperty('--c1',c1);b.style.setProperty('--c2',c2);
  b.innerHTML=`<i aria-hidden="true"></i><span>${l}</span>`;b.setAttribute('aria-pressed',(SET.shell||'glas')===k);b.onclick=()=>{SET.shell=k;saveSet();sfx('page');redraw();};d.appendChild(b);});row(ch,'Hülle','Fünf eigene Hüllen für dein Gerät.',d).classList.add('wide');}
 row(ch,'Regionsakzent','Schmuckstein und Riemen nehmen die Farbe der aktuellen Region an.',tog('shellAcc',0));
 const sc=sec('Bildschirm','Vollbild im Querformat');
 row(sc,'Vollbild','Handy: beim ersten Tippen auf den ganzen Bildschirm. PC: nur über den Knopf, Esc verlässt es.',(()=>{const w=document.createElement('div');w.className='btns';w.append(tog('fs',1));if(typeof fsCan==='function'&&fsCan()){const b=document.createElement('button');b.className='pill';b.textContent=typeof fsIs==='function'&&fsIs()?'Vollbild beenden':'Jetzt Vollbild';b.onclick=()=>{fsToggle();setTimeout(redraw,400);};w.append(b);}return w;})());
 row(sc,'Hochformat erlauben','Aus: Hinweis „Bitte Gerät drehen“. An: Welt füllt den Bildschirm, Tasten liegen darüber.',(()=>{const b=document.createElement('button'),on=SET.portrait==='allow';b.className='tog'+(on?' on':'');b.setAttribute('role','switch');b.setAttribute('aria-checked',on);b.innerHTML='<i></i>';
  b.onclick=()=>{SET.portrait=on?'drehen':'allow';saveSet();sfx('tap');redraw();};return b;})());
 row(sc,'Tasten abblenden','Nach 4 Sekunden ohne Eingabe werden Anzeigen und Tasten durchsichtig.',seg('hudDim',[['stark','Stark'],['mittel','Leicht'],['aus','Aus']],false,'stark'));
 const g=sec('Grafik',`Bildschirm: ${W}×${H} · ${SET.fps?SET.fps+' fps':'unbegrenzt'}`);
 row(g,'Qualitätsstufe','Setzt Auflösung, Bildrate und Effekte auf einmal.',seg('quality',[['auto','Auto'],['niedrig','Niedrig'],['mittel','Mittel'],['hoch','Hoch'],['ultra','Ultra']].concat(SET.quality==='eigene'?[['eigene','Eigene']]:[]),false));
 row(g,'Auflösung','2K sieht am schärfsten aus, braucht aber mehr Akku.',seg('res',[['auto','Auto'],['720','720p'],['1080','1080p'],['1440','2K'],['native','Nativ']]));
 row(g,'Grafikstufe','Auto passt Schatten, Pflanzen und Effekte an dein Gerät an. Niedrig schont den Akku.',seg('gfx',[['auto','Auto'],['low','Niedrig'],['mid','Mittel'],['high','Hoch']]));
 row(g,'Bildrate','30 fps schont den Akku, 60 fps läuft flüssiger.',seg('fps',[[30,'30'],[60,'60'],[0,'Max']]));
 row(g,'Sichtweite','Wie weit du in den 3D-Ansichten schauen kannst.',seg('dist',[['nah','Nah'],['mittel','Mittel'],['weit','Weit']]));
 row(g,'Echtzeit-Schatten','Schatten von Sonne und Mond in 3D.',tog('shadows'));
 row(g,'Dynamisches Licht','Laterne, leuchtende Fenster und Kristalle bei Nacht.',tog('light'));
 row(g,'Partikel','Schnee, Glühwürmchen und Höhlenstaub.',tog('particles'));
 const s=sec('Sound');
 row(s,'Audio-Status: '+audioState(),/iPhone|iPad/.test(navigator.userAgent)?'Auf dem iPhone: Stummschalter an der Seite ausschalten und Lautstärke hochdrehen.':'Der Ton startet nach der ersten Berührung im Spiel.',pills(['Sound testen',()=>{initAudio();sfx('lvl');vib(20);setTimeout(redraw,400);}]));
 row(s,'Gesamtlautstärke','',rng('vol'));
 row(s,'Musik','Ruhige Melodien in der Welt, treibende im Kampf.',tog('music'));
 row(s,'Musiklautstärke','',rng('mvol'));
 row(s,'Soundeffekte','Treffer, Fänge, Level-ups, Türen und Menüs.',tog('sfx'));
 row(s,'Sprechlaute','Kurze Töne, während Dialoge und Kampftexte erscheinen.',tog('blip'));
 const c=sec('Steuerung');
 row(c,'Steuerung','Stick: erscheint links, wo dein Daumen aufsetzt; rechts wischen dreht die Kamera. Steuerkreuz: vier Richtungen, Tippen dreht, Halten läuft. Joystick: fester Stick.',seg('ctrl',[['dyn','Stick'],['kreuz','Steuerkreuz'],['stick','Joystick']]));
 row(c,'Größe der Steuerung','',seg('stick',[['S','Klein'],['M','Mittel'],['L','Groß']]));
 row(c,'Kamera-Empfindlichkeit','Wie schnell die Kamera beim Wischen dreht.',rngX('inSens',50,150,5,100));
 row(c,'Kamera umkehren','Wischen nach rechts oder oben dreht die Kamera andersherum.',seg('camInv',[['','Aus'],['x','Seitlich'],['y','Hoch/Runter'],['xy','Beides']],false,''));
 row(c,'Schwierigkeit','Leicht: eigene Angriffe stärker, Gegner schwächer, Fangen und Erfahrung leichter, weniger Begegnungen. Normal: klassische Werte.',seg('diff',[['leicht','Leicht'],['normal','Normal']]));
 row(c,'Brotkrumen','Kleine Punkte am Boden zeigen die Richtung zum Missionsziel.',tog('crumbs',1));
 row(c,'Murmelnde Bewohner','Nahe Bewohner zeigen kurze Sprechblasen, ohne dass du sie ansprichst.',tog('amb',1));
 const t=sec('Text & Lesbarkeit');
 row(t,'Texttempo','Wie schnell Dialoge erscheinen. Tippen zeigt den Rest sofort.',seg('text',[['langsam','Langsam'],['normal','Mittel'],['schnell','Schnell'],['sofort','Sofort']]));
 row(t,'Textgröße','Dialoge, Kampftexte und Menüs.',seg('font',[['klein','S'],['normal','M'],['gross','L']]));
 row(t,'Farbschwäche-Modus','KP-Balken in Blau/Orange statt Grün/Rot, Typsymbole mit Kontur, Muster statt nur Farbe.',tog('cb'));
 row(t,'Sprache','Englisch folgt in Phase 6 – bis dahin bleibt alles auf Deutsch.',seg('lang',[['de','Deutsch'],['en','English']],true,'de'));
 const a=sec('Komfort');
 row(a,'Vibration','Kurzes Feedback bei Treffern und Begegnungen.',tog('vib'));
 row(a,'Bewegung reduzieren','Schaltet Kamera-Wackeln, Wischeffekte und Einblend-Animationen ab.',seg('motion',[['auto','Automatisch'],['weniger','Weniger']]));
 row(a,'Kampfanimationen','Aus: Attacken ohne Sprünge, Blitze und Pulse – Kämpfe gehen schneller.',tog('banim',1));
 row(a,'Kampfstart kurz','Überspringt den langen Auftakt vor Kämpfen.',tog('skipBattleIntro',0));
 row(a,'Titel-Opening beim Start','Kurze Dämmerung über Veyra mit dem Titel, bevor das Titelbild erscheint (ca. 5 s, Tippen überspringt).',tog('intro'));
 row(a,'Titel-Opening ansehen','',pills(['Abspielen',()=>{$('#opts').hidden=true;if(G&&!$('#menu').hidden)closeMenu();playLegendIntro();}]));
 {const d=document.createElement('details');d.className='adv';d.open=!!rSettings._adv;d.addEventListener('toggle',()=>{rSettings._adv=d.open;});d.innerHTML='<summary>Erweitert <small>Ansicht, Draufsicht'+(window.INTRO_VIDEO?', Intro-Film':'')+'</small></summary>';
  const b=document.createElement('div');b.className='opts';d.appendChild(b);el.appendChild(d);const vNow=SET.view2d?'2d':(G&&G.view==='ego'?'ego':'third');
  const vw=document.createElement('div');vw.className='seg';[['third','3D'],['ego','Ego'],['2d','Draufsicht']].forEach(([v,l])=>{const x=document.createElement('button');x.textContent=l;x.className=vNow===v?'on':'';x.setAttribute('aria-pressed',vNow===v);
   x.onclick=()=>{SET.view2d=v==='2d'?1:0;saveSet();sfx('tap');if(G){if(mode!=='title'&&cur)setView(v,true);else G.view=v;}redraw();};vw.appendChild(x);});
  row(b,'Ansicht','3D-Freilauf ist der Standard. Die Draufsicht ist die klassische 2D-Kachelansicht.',vw);
  row(b,'Kampfbild in der Draufsicht','Gemalte Kampfszene mit den Illustrationen oder die 3D-Arena.',seg('b2d',[['bild','Illustration'],['3d','3D-Arena']],false,'bild'));
  if(window.INTRO_VIDEO&&typeof replayIntroFilm==='function')row(b,'Intro-Film abspielen','Der Eröffnungsfilm „Die Welt der Terras“ (87 s, mit Ton).',pills(['Abspielen',()=>{sfx('tap');replayIntroFilm();}]));}
 if(G){const p=sec('Spielstand',G.name?'Chronik von '+G.name:'');
  row(p,'Spiel speichern','In der Kreaturenstation wird automatisch gespeichert.',pills(['Speichern',save]));
  row(p,'Rasten','Manche Kreaturen zeigen sich nur tagsüber oder nachts.',pills(['Bis 12 Uhr',()=>{G.time=720;updClock();toast('Es ist Mittag');}],['Bis 22 Uhr',()=>{G.time=1320;updClock();toast('Die Nacht bricht herein');}]));
  const r3=pills(['Neu starten',e=>{const nb=e.currentTarget;if(nb.dataset.c){try{if(typeof saveWipe==='function')saveWipe();else localStorage.removeItem(SAVEKEY);}catch(x){}closeMenu();$('#opts').hidden=true;newGame();}else{nb.dataset.c=1;nb.textContent='Wirklich löschen?';}},'danger']);
  row(p,'Neues Spiel','Startet von vorn. Dein altes Spiel bleibt als Sicherung (Optionen › Erweitert).',r3);}}
addEventListener('resize',()=>{if(!$('#menu').hidden)inkTo();});
