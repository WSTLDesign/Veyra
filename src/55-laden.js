// ===== VEYRA – Ladebildschirm bei Gebietswechseln (Agent Übergänge & Bewegung, Opus hoch, 12.11.) – Doku: docs/uebergaenge.md =====
// REGEL: Ladebildschirm nur, wenn Start UND Ziel Außenkarten (MAPS) sind und sich unterscheiden: Route ↔ Stadt, Höhle/Sondergebiet (z. B. Nebelgrotte),
//  Wechsel zwischen großen Außenkarten. NIE, wenn Start oder Ziel ein Innenraum ist (INTERIORS bzw. Karte mit inside / theme 'inside':
//  Häuser, Läden, Labor, Kreaturenstation, Arenen, Liga) – dort bleibt die kurze Tür-Blende (SEQ.doorFade, 0,3 s).
// Ablauf: Eingabe sperren (mode 'wait') → weiche Abblende (LD_MS.fadeIn) → Ladebildschirm (Gebietsname, Region, Ortsbild, laufende Pfotenspur, Fortschritt)
//  → Karte laden (fn) → 3D-Szene im Hintergrund aufbauen (Bild 1: build3d über draw3d, Bild 2: erstes Rendern = Shader/Texturen, Bild 3: Himmel/Nachlauf)
//  → mindestens LD_MS.min sichtbar, sonst so kurz wie möglich → weiche Aufblende (LD_MS.fadeOut) → Eingabe frei → Gebietsschild (mapCard).
// Ankunft am Kartenrand (3D): eine Kachel nach innen, damit man nicht in der Gegenzone steht (17-move: Sperre bis man die Zone verlassen hat).
// Hüllen (gleiche Signatur): transit (11-fx), mapCard (15-ui, nur verzögert), hyPlaceShow (45-hybrid: Ortsstandbild entfällt, das Bild steckt im Ladebildschirm).
// Test-Hook: window.LADEN {active, count, log[{from,to,ms,shown}]}; window.LD_MS überschreibbar.
const LD_MS={fadeIn:240,min:650,fadeOut:320,minRed:350};
const LADEN={active:false,tok:0,count:0,log:[],el:null,card:null,fn:null};
window.LADEN=LADEN;window.LD_MS=LD_MS;
function ldInside(id){if(!id)return false;try{if(INTERIORS[id])return true;const m=MAPS[id];return!m||!!m.inside||m.theme==='inside';}catch(e){return true;}}
function ldNeeds(from,to){return!!(from&&to&&from!==to&&MAPS[from]&&MAPS[to]&&!ldInside(from)&&!ldInside(to));}
const LD_TIPS=['Tipp: Halte den Stick ganz nach außen, dann rennst du.','Tipp: Im hohen Gras warten wilde Terras.','Tipp: In der Kreaturenstation werden alle wieder gesund.',
 'Tipp: Drück A, wenn du mit jemandem reden willst.','Tipp: Wisch rechts, dann dreht sich die Kamera.','Tipp: Auf der Karte siehst du, wohin es weitergeht.','Tipp: Glitzern am Boden? Schau mal nach!'];
function ldEl(){if(LADEN.el)return LADEN.el;const el=document.createElement('div');el.id='ldOv';el.className='ld';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 el.innerHTML=`<div class="ld-bg"><img alt="" decoding="async"></div><div class="ld-shade"></div>
<div class="ld-box"><small class="ld-reg"></small><b class="ld-name"></b>
 <div class="ld-trail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
 <div class="ld-bar" aria-hidden="true"><i></i></div><p class="ld-tip"></p></div>`;
 document.body.appendChild(el);LADEN.el=el;return el;}
function ldPlaceSrc(id){try{if(typeof hyPlaceKey==='function'&&typeof hyArt==='function'){const k=hyPlaceKey(id);return k?hyArt(k):null;}}catch(e){}return null;}
function ldProg(p){const el=LADEN.el;if(el)el.style.setProperty('--ld-p',Math.max(0,Math.min(1,p)).toFixed(3));}
const ldWait=ms=>new Promise(r=>setTimeout(r,ms));
const ldFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
function ldRed(){try{return!!RED||matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
// Ankunft am Kartenrand: eine Kachel nach innen (nur 3D; 2D bleibt Kachel-genau wie bisher)
function ldArrive(){if(!cur||view==='2d')return;const x=P.x,y=P.y;let d=null;if(y===cur.h-1)d=[0,-1];else if(y===0)d=[0,1];else if(x===0)d=[1,0];else if(x===cur.w-1)d=[-1,0];if(!d)return;
 const nx=x+d[0],ny=y+d[1],t=tileAt(cur,nx,ny);if(t===null||blocked(nx,ny)||t==='E'||cur.doors[t]||(typeof roamAt==='function'&&roamAt(nx,ny)))return;
 P.x=P.fx=nx;P.y=P.fy=ny;P.px=nx;P.py=ny;G.px=nx;G.py=ny;try{if(typeof compReset==='function')compReset();}catch(e){}}
// Laufenden Ladebildschirm sofort beenden (neuer Übergang, Test, Kampf): ausstehendes fn wird noch ausgeführt, damit nie eine Karte fehlt
function ldAbort(){if(!LADEN.active)return;LADEN.tok++;const fn=LADEN.fn;LADEN.fn=null;if(fn)try{fn();}catch(e){console.error('Laden',e);}
 LADEN.active=false;LADEN.opaque=false;const el=LADEN.el;if(el){el.classList.remove('on','out');el.hidden=true;}document.body.classList.remove('ld-on');if(mode==='wait')mode='world';ldCard();}
function ldCard(){const m=LADEN.card;LADEN.card=null;if(m&&cur&&m===cur)try{mapCard(m);}catch(e){}}
async function ldRun(fn,to,from){if(LADEN.active)ldAbort();const tok=++LADEN.tok,red=ldRed(),t0=performance.now(),rec={from,to,t0:Math.round(t0),shown:0,ms:0};
 LADEN.active=true;LADEN.count++;LADEN.log.push(rec);if(LADEN.log.length>40)LADEN.log.shift();LADEN.fn=fn;
 mode='wait';held=null;try{STICK.x=STICK.y=0;}catch(e){}P.walk=false;P.v=0;
 const el=ldEl(),M=MAPS[to]||{},R=typeof regionOf==='function'?regionOf(to):['','#4cb85c'],src=ldPlaceSrc(to),img=el.querySelector('.ld-bg img');
 el.querySelector('.ld-name').textContent=M.name||'';el.querySelector('.ld-reg').textContent=R[0]&&R[0]!==M.name?R[0]:(M.theme==='cave'?'Höhle':'Unterwegs');
 el.querySelector('.ld-tip').textContent=LD_TIPS[LADEN.count%LD_TIPS.length];el.style.setProperty('--ld-lead',R[1]||'#4cb85c');
 el.classList.toggle('noimg',!src);if(src){if(img.getAttribute('src')!==src)img.src=src;}else img.removeAttribute('src');
 el.hidden=false;el.classList.remove('out');ldProg(.05);void el.offsetWidth;el.classList.add('on');document.body.classList.add('ld-on');try{sfx('whoosh');}catch(e){}
 await ldWait(red?0:LD_MS.fadeIn);if(tok!==LADEN.tok)return;rec.shown=Math.round(performance.now()-t0);const tShow=performance.now();LADEN.opaque=true;
 // 1) Karte (Daten, Figuren, Kreaturen)
 LADEN.fn=null;try{fn();}catch(e){console.error('Laden',e);}ldProg(.3);try{ldArrive();}catch(e){}
 await ldFrame();if(tok!==LADEN.tok)return;
 // 2) Szene aufbauen (Geometrie, Texturen, Himmel) – vorhandene Aufbau-Funktion draw3d/build3d, je Schritt ein eigenes Bild
 const d3=view!=='2d'&&typeof draw3d==='function'&&!!window.THREE,own=()=>{LADEN.own=true;try{draw3d();}catch(e){console.error('Laden 3D',e);}LADEN.own=false;};
 if(d3)own();ldProg(.7);await ldFrame();if(tok!==LADEN.tok)return;
 if(d3)own();ldProg(.9);await ldFrame();if(tok!==LADEN.tok)return;
 if(src&&img.decode)try{await Promise.race([img.decode(),ldWait(150)]);}catch(e){}
 const rest=(red?LD_MS.minRed:LD_MS.min)-(performance.now()-tShow);if(rest>0){ldProg(1);await ldWait(rest);}else ldProg(1);if(tok!==LADEN.tok)return;
 // 3) Aufblende (ab hier rendert die Hauptschleife wieder jedes Bild)
 LADEN.opaque=false;if(d3)own();el.classList.add('out');el.classList.remove('on');await ldWait(red?0:LD_MS.fadeOut);if(tok!==LADEN.tok)return;
 el.hidden=true;el.classList.remove('out');document.body.classList.remove('ld-on');LADEN.active=false;rec.ms=Math.round(performance.now()-t0);
 if(mode==='wait')mode='world';ldCard();}
// transit-Hülle: Gebietswechsel → Ladebildschirm, sonst (Innenräume) unverändert die kurze Blende
if(typeof transit==='function'){const _transitLd=transit;transit=function(fn,to){const from=cur&&cur.id;
 if(ldNeeds(from,to)){ldRun(fn,to,from);return;}if(LADEN.active)ldAbort();return _transitLd.apply(this,arguments);};}
// Gebietsschild erst nach dem Ladebildschirm
if(typeof mapCard==='function'){const _mapCardLd=mapCard;mapCard=function(m){if(LADEN.active&&m&&!m.inside){LADEN.card=m;try{const R=regionOf(m.id),app=$('#app');app.style.setProperty('--lead',R[1]);app.style.setProperty('--accent',R[2]);}catch(e){}return;}return _mapCardLd.apply(this,arguments);};}
// Ortsstandbild (45-hybrid) entfällt während des Ladebildschirms – das Ortsbild ist dessen Hintergrund
if(typeof hyPlaceShow==='function'){const _hpsLd=hyPlaceShow;hyPlaceShow=function(o){if(LADEN.active){try{HYP.lastKey=o.key;HYP.shownAt=performance.now();}catch(e){}return;}return _hpsLd.apply(this,arguments);};}
// Kampf o. Ä. während des Ladens (sollte wegen mode 'wait' nicht vorkommen): sofort beenden
if(typeof startBattle==='function'){const _sbLd=startBattle;startBattle=function(){if(LADEN.active)ldAbort();return _sbLd.apply(this,arguments);};}
// Solange der Ladebildschirm deckt, zeichnet die Hauptschleife die Welt nicht (spart Rechenzeit fürs Aufbauen); eigene Aufbau-Bilder laufen über LADEN.own
if(typeof draw3d==='function'){const _d3Ld=draw3d;draw3d=function(){if(LADEN.active&&LADEN.opaque&&!LADEN.own)return;return _d3Ld.apply(this,arguments);};}
