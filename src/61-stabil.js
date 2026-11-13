// ===== VEYRA – Stabilität PC (13.11., Agent „Stabilität PC“, Opus hoch) =====
// Anlass: Werkstatt im Leitstand (Iframe, gleicher Prozess) fror auf Laptop mit Intel Iris Xe ein (1,3 Bilder/s, Beenden unmöglich).
// Doku: docs/stabilitaet.md · Test: test/stabil_qa.mjs
// Bausteine:
//  1) GPU-Klasse → Startstufe (dediziert hoch · Iris Xe/Arc integriert/Radeon Graphics mittel · UHD/HD/Vega/ältere Iris niedrig), PC-Bilddeckel 60 (integriert 30), DPR-Deckel integriert 1,25
//  2) Wachhund: misst JEDES gezeichnete Bild (auch > 250 ms, auch ohne SET.res 'auto'); Ø > 45 ms über 1,5 s → Stufe runter, dann Renderskala bis 0,5;
//     Ø > 100 ms oder 2 Einzelbilder > 250 ms in 4 s → sofort niedrig + Skala 0,5 + Bloom/Schatten aus; hoch erst nach 10 s stabil
//  3) Modell-Warteschlange window.VMODEL_QUEUE: alle GLB-Ladevorgänge (38/57/58/09 über modelLoaders().load) nacheinander, ~100 ms Pause, Leerlauf-Rückruf;
//     Werkstatt: Modell-Skripte erst bei Bedarf (window.PILOT_LAZY statt 28 Skript-Tags im Kopf)
//  4) Beenden: postMessage {veyra:'stop'} (speichern, Schleifen + Ton aus, WebGL frei), {veyra:'key'} (Strg+Q/Esc vom Leitstand), Pause unsichtbar/außerhalb, 5 fps ohne Fokus
// API: STAB · stabInfo() · stabStop(why) · stabLoad(t) (Test: künstliche Last ms je Bild) · VMODEL_QUEUE
const STAB={cls:'?',gpu:'',base:'mid',ceil:'high',lim:'high',smax:1,dpr:9,cap:60,ws:false,
 win:{n:0,sum:0,t0:0},prev:0,lr:0,lt:-1,grace:8,spikes:[],lastBad:-1e9,lastUp:0,stableT:0,emerg:0,downs:0,ups:0,
 off:false,blur:false,parked:false,work:0,stopped:0,frames:0,fps:0,fpsN:0,fpsT:0,gls:[],load:0,log:[]};
const STAB_RK={low:0,mid:1,high:2},STAB_TN=['low','mid','high'];
function stabLog(s){STAB.log.push(Math.round(performance.now())+' '+s);if(STAB.log.length>40)STAB.log.shift();}
// ---------- 1) GPU-Klasse ----------
function stabClass(r,touch){r=String(r||'');
 if(/SwiftShader|llvmpipe|softpipe|Microsoft Basic Render/i.test(r))return'soft';
 if(touch&&!/Intel|NVIDIA|GeForce|Radeon|Apple M\d/i.test(r))return'mobil';// Handy/Tablet: Auswahl von 59 (starke Mobil-GPUs) bleibt
 if(/GeForce MX|Quadro (K|NVS)/i.test(r))return'igpu';// Einstiegs-GPUs wie integriert behandeln
 if(/GeForce (RTX|GTX)|NVIDIA (RTX|Quadro|T\d{3,4}|A\d{3,4})|Quadro|TITAN|Radeon(\(TM\))? (RX|Pro)|Arc\(TM\) [AB]\d{3}|Arc [AB]\d{3}|Apple M\d/i.test(r))return'dgpu';
 if(/Iris\(R\) Xe|Iris Xe|Arc\(TM\) Graphics|Arc Graphics|Radeon\(TM\) Graphics|Radeon Graphics|Radeon\(TM\) \d{3}M|Radeon \d{3}M/i.test(r))return'igpu';
 if(/Intel|Vega|Radeon|Apple GPU|Mali|Adreno|PowerVR/i.test(r))return'igpu-low';
 if(/NVIDIA|GeForce/i.test(r))return'dgpu';
 return'unbekannt';}
(function(){const r=GFX&&GFX.gpu||'';STAB.gpu=r;STAB.cls=stabClass(r,PERF.touch);
 try{STAB.ws=/[?&]ws=1/.test(location.search)||window.parent!==window;}catch(e){STAB.ws=true;}
 const c=STAB.cls,pc=!PERF.touch;
 STAB.base=c==='dgpu'?'high':c==='igpu'||c==='unbekannt'?'mid':c==='mobil'?(GFX.strong?'high':PERF.tier):'low';
 if(c!=='mobil')GFX.strong=c==='dgpu';// 59 zählte Iris/Arc/Radeon pauschal als stark → PERF.tier 'high' auf integrierter Grafik
 STAB.ceil=GFX.force||(SET.gfx!=='auto'&&PERF.TIERS[SET.gfx]?SET.gfx:STAB.base);if(STAB_RK[STAB.ceil]<STAB_RK[STAB.base])STAB.ceil=STAB.base;
 if(GFX.force&&STAB_RK[GFX.force]>STAB_RK[STAB.ceil])STAB.ceil=GFX.force;
 STAB.lim=STAB.ceil;
 // Werkstatt (Iframe im Leitstand / ?ws=1) am PC: mit „mittel“ starten, der Wachhund darf nach 10 s stabil höher
 if(STAB.ws&&pc&&!GFX.force&&STAB.base==='high'){STAB.base='mid';}
 if(pc&&c!=='dgpu')STAB.dpr=1.25;
 STAB.cap=pc?(c==='dgpu'||SET.quality!=='auto'?60:30):0;
 try{const q=/[?&]fps=(\d+)/.exec(location.search);if(q)STAB.cap=Math.max(5,Math.min(60,+q[1]));}catch(e){}
 stabLog('GPU '+c+' · Start '+STAB.base+' · Deckel '+STAB.ceil+' · '+(STAB.cap||'∞')+' fps');})();
function stabCap(){const f=+SET.fps||0;let c=STAB.cap||f||0;if(f&&c)c=Math.min(c,f);if(!PERF.touch)c=Math.min(c||60,60);return c||0;}
// Stufe/Skala begrenzen (43 regelt weiter, aber nie über die Grenze des Wachhunds und nie nach oben, bevor 10 s stabil)
if(typeof perfStart==='function'&&!perfStart._stab){const _pst=perfStart;perfStart=function(){_pst();
  if(!GFX.force&&SET.gfx==='auto'&&STAB.cls!=='mobil')PERF.tier=STAB.base;
  if(STAB_RK[PERF.tier]>STAB_RK[STAB.lim])PERF.tier=STAB.lim;PERF.scale=Math.min(PERF.scale,STAB.smax);};perfStart._stab=1;perfStart();}
if(typeof perfSet==='function'&&!perfSet._stab){const _pse=perfSet;perfSet=function(t){if(!PERF.TIERS[t])return;
  if(STAB_RK[t]>STAB_RK[STAB.lim])t=STAB.lim;if(STAB_RK[t]>STAB_RK[PERF.tier]&&performance.now()-STAB.lastBad<10000)return;return _pse(t);};perfSet._stab=1;}
function stabScale(k){k=Math.max(.5,Math.min(1,Math.round(k*100)/100));PERF.scale=k;PERF.changed=performance.now();try{if(R3&&R3.fit)R3.fit();}catch(e){}}
if(typeof perfScale==='function'&&!perfScale._stab){const _psc=perfScale;perfScale=function(k){k=Math.min(k,STAB.smax);const mn=perfTier().smin||.6;
  if(STAB.smax<mn-.001){stabScale(Math.min(k,STAB.smax));return;}return _psc(k);};perfScale._stab=1;}
// Renderskala des Wachhunds gilt auch bei fester Auflösung (SET.res ≠ 'auto' ignoriert PERF.scale)
if(typeof resH3==='function'&&!resH3._stab){const _rh3=resH3;resH3=function(){const h=_rh3();return SET.res!=='auto'&&STAB.smax<1?Math.max(180,Math.round(h*STAB.smax)):h;};resH3._stab=1;}
if(typeof dprCap==='function'&&!dprCap._stab){const _dc=dprCap;dprCap=function(){return Math.min(_dc(),STAB.dpr);};dprCap._stab=1;}
// ---------- 2) Wachhund ----------
function stabDown(why){const now=performance.now();STAB.lastBad=now;STAB.downs++;
 if(PERF.tier!=='low'){const t=STAB_TN[STAB_RK[PERF.tier]-1];STAB.lim=t;perfSet(t);stabLog('runter → '+t+' ('+why+')');}
 else if(STAB.smax>.5){STAB.smax=Math.max(.5,Math.min(STAB.smax,PERF.scale)-.15);stabScale(STAB.smax);stabLog('Skala → '+STAB.smax+' ('+why+')');}
 STAB.win.n=STAB.win.sum=0;STAB.win.t0=0;}
function stabEmergency(why){const now=performance.now();STAB.lastBad=now;STAB.emerg++;STAB.lim='low';perfSet('low');STAB.smax=.5;stabScale(.5);
 try{GFX.post=false;}catch(e){}try{if(R3&&R3.sun)R3.sun.castShadow=false;}catch(e){}
 if(!PERF.touch)STAB.cap=30;if(STAB.emerg===1||STAB.emerg%20===0)stabLog('NOTBREMSE '+STAB.emerg+' ('+why+')');
 if(STAB.emerg===1)try{toast('Grafik auf „niedrig“ gestellt, damit es flüssig bleibt');}catch(e){}
 STAB.win.n=STAB.win.sum=0;STAB.win.t0=0;STAB.spikes.length=0;}
function stabUp(){const now=performance.now();STAB.lastUp=now;STAB.ups++;
 if(STAB.smax<1){STAB.smax=Math.min(1,+(STAB.smax+.15).toFixed(2));stabScale(STAB.smax);stabLog('Skala hoch → '+STAB.smax);return;}
 if(STAB.downs>=3)return;// mehrfach zu langsam: Stufe nicht mehr anheben
 if(STAB_RK[STAB.lim]<STAB_RK[STAB.ceil]){STAB.lim=STAB_TN[STAB_RK[STAB.lim]+1];}
 if(STAB_RK[PERF.tier]<STAB_RK[STAB.lim]&&(SET.gfx==='auto'||GFX.force)&&!STAB.emerg){const t=STAB_TN[STAB_RK[PERF.tier]+1];perfSet(t);stabLog('hoch → '+t);if(t==='high')try{GFX.post=true;}catch(e){}}}
function stabMeasure(t){const W=STAB.win,dt=STAB.prev?t-STAB.prev:0;STAB.prev=t;STAB.frames++;
 STAB.fpsN++;if(t-STAB.fpsT>=1000){STAB.fps=Math.round(STAB.fpsN*1000/(t-STAB.fpsT||1));STAB.fpsN=0;STAB.fpsT=t;}
 if(!dt)return;if(STAB.blur)return;// gedrosselt: nicht bewerten
 if(STAB.grace>0){STAB.grace--;if(dt>100)return;}// Kartenwechsel, Kampfstart, Modell fertig: ein langes Bild ist erwartet
 const now=performance.now();
 if(dt>250){STAB.spikes=STAB.spikes.filter(x=>now-x<4000);STAB.spikes.push(now);if(STAB.spikes.length>=2){stabEmergency('2 Bilder > 250 ms');return;}}
 if(!W.t0)W.t0=t;W.n++;W.sum+=dt;if(t-W.t0<1500||W.n<3)return;
 const avg=W.sum/W.n;W.n=W.sum=0;W.t0=t;STAB.avg=+avg.toFixed(1);
 if(avg>100){stabEmergency('Ø '+avg.toFixed(0)+' ms');return;}
 if(avg>45){stabDown('Ø '+avg.toFixed(0)+' ms');return;}
 const c=stabCap(),tgt=c?1000/c:16.7;
 if(avg<tgt*1.2+4){if(!STAB.stableT)STAB.stableT=now;if(now-STAB.stableT>=10000&&now-STAB.lastBad>=10000&&now-STAB.lastUp>=10000){stabUp();STAB.stableT=now;}}else STAB.stableT=0;}
// Ereignisse mit erwartbar langem Bild
function stabGrace(n){STAB.grace=Math.max(STAB.grace,n||3);}
if(typeof loadMap==='function'&&!loadMap._stab){const _lm=loadMap;loadMap=function(){stabGrace(4);return _lm.apply(this,arguments);};loadMap._stab=1;}
if(typeof startBattle==='function'&&!startBattle._stab){const _sb=startBattle;startBattle=function(){stabGrace(4);return _sb.apply(this,arguments);};startBattle._stab=1;}
if(typeof setView==='function'&&!setView._stab){const _sv=setView;setView=function(){stabGrace(3);return _sv.apply(this,arguments);};setView._stab=1;}
// Test: künstliche Last je gezeichnetem Bild (ms Rechenzeit auf dem Hauptthread)
function stabLoad(ms){STAB.load=+ms||0;}
// ---------- Schleife: Deckel, Drosselung, Pause, Messung (äußerste Hülle um 15/43/54) ----------
function stabHold(){return STAB.off;}
if(typeof loop==='function'&&!loop._stab){const _lS=loop;loop=function(t){if(STAB.stopped||window.__quit)return;
  if(t===STAB.lt)return;STAB.lt=t;// zweite Kette im selben Bild verwerfen
  if(stabHold()){STAB.parked=true;STAB.prev=0;return;}
  // Hauptthread-Budget: kostet ein Bild > 30 ms Rechenzeit, höchstens die Hälfte der Zeit zeichnen (Leitstand/Eingaben behalten Luft)
  const c=stabCap(),iv=Math.max(STAB.blur?200:c?1000/c:0,STAB.work>30?Math.min(2*STAB.work,2000):0);
  if(iv&&STAB.lr&&t-STAB.lr<iv-3){requestAnimationFrame(loop);return;}
  const lf=lastFrame,a=performance.now();_lS(t);
  if(lastFrame!==lf){STAB.lr=t;const w=performance.now()-a;if(STAB.load){const e=performance.now()+STAB.load;while(performance.now()<e){}}STAB.work+=(w-STAB.work)*(w>STAB.work?.5:.2);stabMeasure(t);}};loop._stab=1;}
function stabResume(){if(STAB.stopped||window.__quit)return;STAB.prev=0;STAB.win.n=STAB.win.sum=0;STAB.win.t0=0;
 if(STAB.parked&&!stabHold()){STAB.parked=false;try{LOOP.paused=false;}catch(e){}lastT=0;requestAnimationFrame(loop);}}
// Sichtbarkeit: außerhalb des Bildes (Iframe weggescrollt/ausgeblendet) → Pause; ohne Fokus → 5 Bilder/s
try{if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{const e=es[es.length-1];const off=!e.isIntersecting;if(off!==STAB.off){STAB.off=off;stabLog(off?'außerhalb → Pause':'sichtbar');if(!off)stabResume();}},{threshold:0});
  addEventListener('DOMContentLoaded',()=>io.observe(document.documentElement));if(document.readyState!=='loading')io.observe(document.documentElement);}}catch(e){}
function stabFocus(){const b=!document.hasFocus();if(b!==STAB.blur){STAB.blur=b;STAB.prev=0;STAB.win.n=STAB.win.sum=0;STAB.win.t0=0;}}
addEventListener('blur',stabFocus);addEventListener('focus',stabFocus);setInterval(()=>{if(!STAB.stopped)stabFocus();},700);
document.addEventListener('visibilitychange',()=>{STAB.prev=0;STAB.win.n=STAB.win.sum=0;STAB.win.t0=0;});
// ---------- 3) Modell-Warteschlange ----------
const VMODEL_QUEUE=window.VMODEL_QUEUE={q:[],busy:false,gap:100,done:0,fail:0,max:0,ms:[],log:[]};
const stabIdle=f=>{try{if(window.requestIdleCallback)return requestIdleCallback(f,{timeout:400});}catch(e){}return setTimeout(f,16);};
function vmqPush(job,prio,name){const Q=VMODEL_QUEUE;Q.q.push({job,prio:prio||5,t:performance.now(),name});Q.q.sort((a,b)=>a.prio-b.prio||a.t-b.t);Q.max=Math.max(Q.max,Q.q.length);vmqNext();}
function vmqNext(){const Q=VMODEL_QUEUE;if(Q.busy||!Q.q.length||STAB.stopped)return;if(STAB.off||document.hidden){setTimeout(vmqNext,500);return;}
 Q.busy=true;const it=Q.q.shift();stabIdle(()=>{const t0=performance.now();let fin=false;
  const end=ok=>{if(fin)return;fin=true;Q.busy=false;ok?Q.done++:Q.fail++;Q.ms.push([it.name,Math.round(performance.now()-t0)]);stabGrace(2);setTimeout(()=>stabIdle(vmqNext),Q.gap);};
  try{it.job(end);}catch(e){end(false);}});}
// Reihenfolge: Spielfigur zuerst, dann Häuser der Karte, Figuren, Terras, zuletzt der alte Pilot
function vmqPrio(u){u=String(u);return/fig_noa/.test(u)?0:/welt\//.test(u)?1:/figuren\//.test(u)?2:/terras\//.test(u)?3:/pilot\//.test(u)?8:5;}
function vmqName(u){u=String(u);if(u.startsWith('data:'))return'data';const m=/([\w-]+)\.glb/.exec(u);return m?m[1]:u.slice(-30);}
// Werkstatt: Modell-Skripte (data-URI) erst bei Bedarf nachladen statt alle im Kopf
function vmqResolve(u){const id=vmqName(u),P=window.PILOT_SRC||{},Lz=window.PILOT_LAZY||{};if(String(u).startsWith('data:'))return Promise.resolve(u);
 if(P[id])return Promise.resolve(P[id]);if(!Lz[id])return Promise.resolve(u);
 return new Promise(res=>{const s=document.createElement('script');s.src=Lz[id];s.async=true;s.onload=()=>{res((window.PILOT_SRC||{})[id]||u);};s.onerror=()=>res(u);document.head.appendChild(s);});}
function vmqWrap(L){if(!L||L._stab)return L;L._stab=1;const ld=L.load.bind(L);
 L.load=function(url,onL,onP,onE){const nm=vmqName(url);vmqPush(end=>{vmqResolve(url).then(u=>{if(STAB.stopped){end(false);return;}
   ld(u,g=>{try{onL&&onL(g);}finally{end(true);try{if(window.PILOT_SRC&&window.PILOT_LAZY&&window.PILOT_LAZY[nm])delete window.PILOT_SRC[nm];}catch(e){}}},onP,e=>{try{onE&&onE(e);}finally{end(false);}});});},vmqPrio(url),nm);};
 try{if(L.dracoLoader&&L.dracoLoader.setWorkerLimit)L.dracoLoader.setWorkerLimit(1);}catch(e){}// Draco dekodiert im Worker – einer reicht, schont die CPU
 return L;}
if(typeof modelLoaders==='function'&&!modelLoaders._stab){const _ml=modelLoaders;modelLoaders=function(){return _ml().then(vmqWrap);};modelLoaders._stab=1;}
// ---------- 4) Beenden ----------
// WebGL-Kontexte merken (alle, die nach dem Laden entstehen: Welt, Kampf, Porträts, Ansicht, Entwicklung, Intro)
try{const gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k){const g=gc.apply(this,arguments);try{if(g&&/webgl/i.test(k)&&!STAB.gls.includes(g))STAB.gls.push(g);}catch(e){}return g;};}catch(e){}
function stabRenderers(){const a=[];const add=o=>{try{if(o&&o.r)a.push(o.r);}catch(e){}};try{add(typeof R3!=='undefined'?R3:null);}catch(e){}try{add(typeof BT!=='undefined'?BT:null);}catch(e){}
 try{add(typeof TR!=='undefined'?TR:null);}catch(e){}try{add(typeof VR!=='undefined'?VR:null);}catch(e){}try{add(typeof EVR!=='undefined'?EVR:null);}catch(e){}return a;}
function stabRelease(){let n=0;for(const r of stabRenderers()){try{if(r&&r.dispose){try{r.setAnimationLoop&&r.setAnimationLoop(null);}catch(e){}try{r.dispose();}catch(e){}try{r.forceContextLoss();}catch(e){}n++;}}catch(e){}}
 for(const g of STAB.gls){try{if(!g.isContextLost()){const x=g.getExtension('WEBGL_lose_context');if(x)x.loseContext();}}catch(e){}}
 try{const L=typeof MODEL!=='undefined'&&MODEL.loader;if(L&&L.dracoLoader&&L.dracoLoader.dispose)L.dracoLoader.dispose();}catch(e){}return n;}
function stabAudioOff(){try{if(typeof AC!=='undefined'&&AC){if(AC.close)AC.close().catch(()=>{});else if(AC.suspend)AC.suspend();}}catch(e){}
 try{document.querySelectorAll('audio,video').forEach(m=>{try{m.pause();}catch(e){}});}catch(e){}try{if(typeof SILENT!=='undefined'&&SILENT)SILENT.pause();}catch(e){}}
// Alle Schleifen anhalten: rAF wird wirkungslos, Intervalle/Zeitgeber werden gelöscht
function stabHalt(){STAB.stopped=STAB.stopped||1;try{window.requestAnimationFrame=function(){return 0;};}catch(e){}
 try{const hi=setTimeout(()=>{},0);for(let i=1;i<=hi;i++){clearInterval(i);}}catch(e){}}
function stabStop(why){if(STAB.stopRes)return STAB.stopRes;const t0=performance.now();let saved=false;
 try{if(typeof G!=='undefined'&&G&&typeof save==='function')saved=save()!==false;}catch(e){}
 window.__quit=1;STAB.stopped=1;try{LOOP.paused=true;}catch(e){}try{mode='wait';held=null;}catch(e){}
 stabAudioOff();const n=stabRelease();stabHalt();
 STAB.stopRes={saved,why:why||'',ms:+(performance.now()-t0).toFixed(1),renderer:n,gl:STAB.gls.length,lost:STAB.gls.filter(g=>{try{return g.isContextLost();}catch(e){return true;}}).length};
 stabLog('gestoppt ('+(why||'')+')');return STAB.stopRes;}
// Strg+Q / Speichern & schließen: zusätzlich alle Schleifen anhalten, Ton aus, Leitstand benachrichtigen
if(typeof quitGame==='function'&&!quitGame._stab){const _qg=quitGame;quitGame=function(){if(window.__quit&&document.getElementById('quitOv'))return;const r=_qg.apply(this,arguments);
  STAB.stopped=1;stabAudioOff();setTimeout(()=>{stabRelease();stabHalt();},80);try{if(window.parent!==window)parent.postMessage({veyra:'quit'},'*');}catch(e){}return r;};quitGame._stab=1;}
function stabKey(d){const key=String(d.key||''),code=d.code||(key==='Escape'?'Escape':key.length===1?'Key'+key.toUpperCase():key);
 if(/^q$/i.test(key)&&d.ctrl){quitGame();return'quit';}
 const tg=document.activeElement&&document.activeElement!==document.documentElement?document.activeElement:document.body;
 for(const ty of['keydown','keyup'])try{tg.dispatchEvent(new KeyboardEvent(ty,{key,code,ctrlKey:!!d.ctrl,bubbles:true,cancelable:true}));}catch(e){}return'key';}
addEventListener('message',e=>{const d=e.data;if(!d||typeof d!=='object'||typeof d.veyra!=='string')return;
 let src=null;try{src=e.source;}catch(x){}if(src&&src!==window.parent&&src!==window)return;
 const reply=m=>{try{(src||window.parent).postMessage(m,'*');}catch(x){}};
 if(d.veyra==='stop'){const r=stabStop(d.why||'nachricht');reply(Object.assign({veyra:'stopped'},r));}
 else if(d.veyra==='key'){if(!STAB.stopped)reply({veyra:'ack',what:stabKey(d)});}
 else if(d.veyra==='ping')reply({veyra:'pong',fps:STAB.fps,tier:PERF.tier,stopped:!!STAB.stopped});});
// ---------- Anzeige im Staging-Badge (fps + Stufe) ----------
const STAB_TL={high:'hoch',mid:'mittel',low:'niedrig'};
setInterval(()=>{if(STAB.stopped)return;const b=document.getElementById('stgBadge');if(!b)return;let s=b.querySelector('.stab');
 if(!s){s=document.createElement('span');s.className='stab';s.style.cssText='font-weight:600;opacity:.85;margin-left:4px';const f=b.querySelector('.f');if(f){f.style.display='none';f.after(s);}else b.appendChild(s);}
 const fp=STAB.parked||STAB.off?'Pause':(STAB.fps||0)+' fps';s.textContent='– '+fp+' · '+(STAB_TL[PERF.tier]||PERF.tier)+(STAB.emerg?' (Notbremse)':'');},1000);
function stabInfo(){return{cls:STAB.cls,gpu:STAB.gpu,base:STAB.base,ceil:STAB.ceil,lim:STAB.lim,tier:PERF.tier,scale:PERF.scale,smax:STAB.smax,dpr:dprCap(),cap:stabCap(),fps:STAB.fps,avg:STAB.avg,
 frames:STAB.frames,work:+STAB.work.toFixed(1),emerg:STAB.emerg,downs:STAB.downs,ups:STAB.ups,off:STAB.off,blur:STAB.blur,parked:STAB.parked,stopped:STAB.stopped,ws:STAB.ws,gls:STAB.gls.length,
 q:{wait:VMODEL_QUEUE.q.length,done:VMODEL_QUEUE.done,fail:VMODEL_QUEUE.fail,max:VMODEL_QUEUE.max,busy:VMODEL_QUEUE.busy},log:STAB.log.slice(-12)};}
