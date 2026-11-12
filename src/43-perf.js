// ===== VEYRA – Leistung: Frame-Zeit, Qualitätsstufen, dynamische Auflösung, Debug-Anzeige (Look L1) =====
// Schnittstellen:
//  PERF.tier 'low'|'mid'|'high' · perfTier() → {name,shadow(0|512|1024),shadowEvery,part,veg,fog,leaves} · PERF.scale (0,6–1,0, nur SET.res 'auto')
//  PERF.ft / PERF.js = gleitendes Mittel Frame-Abstand / JS-Zeit je Frame (ms) · PERF.weak = schwache GPU (DPR-Deckel 1,5)
//  perfSet(tier) erzwingt eine Stufe (SET.gfx bleibt) · window.PERF_HUD=1 (oder ?perf=1) zeigt FPS, ms, Calls, Dreiecke, Stufe, Auflösung
//  09-three3d.js liest perfTier() in w3Quality(); 07 resH3() liest PERF.scale; 03 loopGate() drosselt Menü/Dialog und pausiert verdeckte Tabs.
const PERF=(()=>{
 const TIERS={low:{name:'low',shadow:0,shadowEvery:0,part:.3,veg:.45,fog:.75,leaves:0},mid:{name:'mid',shadow:512,shadowEvery:2,part:.6,veg:.72,fog:.88,leaves:16},high:{name:'high',shadow:1024,shadowEvery:1,part:1,veg:1,fog:1,leaves:34}};
 let weak=false;try{const c=document.createElement('canvas'),g=c.getContext('webgl');if(g){const e=g.getExtension('WEBGL_debug_renderer_info'),r=e?String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)):'';
  weak=/Mali-[4T][0-9]{0,2}\b|Mali-G5[12]|Adreno \(TM\) [345]\d\d|PowerVR SGX|PowerVR Rogue G|SwiftShader|llvmpipe/i.test(r);const lc=g.getExtension('WEBGL_lose_context');if(lc)lc.loseContext();}}catch(e){}
 const touch=(()=>{try{return matchMedia('(pointer:coarse)').matches;}catch(e){return false;}})();
 if(!weak&&touch&&(navigator.hardwareConcurrency||8)<=4&&(navigator.deviceMemory||4)<=3)weak=true;
 return{TIERS,weak,touch,tier:'high',scale:1,ft:16.7,js:0,last:0,win:{n:0,sum:0,js:0,t0:0},slow:0,fast:0,hud:null,hudT:0,frames:0,changed:0};
})();
function perfTier(){return PERF.TIERS[PERF.tier]||PERF.TIERS.high;}
function perfStart(){if(SET.gfx!=='auto'&&PERF.TIERS[SET.gfx])PERF.tier=SET.gfx;else PERF.tier=PERF.weak?'low':PERF.touch?'mid':'high';PERF.scale=PERF.weak?.8:1;}
perfStart();
// Stufe setzen und an die Welt weitergeben (Schatten, Partikel, Vegetation, Nebel)
function perfSet(t){if(!PERF.TIERS[t]||t===PERF.tier)return;PERF.tier=t;PERF.changed=performance.now();PERF.slow=PERF.fast=0;if(typeof w3Quality==='function')try{w3Quality(perfTier());}catch(e){console.error(e);}}
function perfScale(k){k=Math.max(.6,Math.min(1,Math.round(k*100)/100));if(Math.abs(k-PERF.scale)<.01)return;PERF.scale=k;PERF.changed=performance.now();try{if(typeof R3!=='undefined'&&R3&&R3.fit)R3.fit();}catch(e){}}
// Messung je ausgeführtem Frame: Abstand (rAF-Zeitstempel) + JS-Dauer; alle 600 ms Bewertung mit Hysterese
function perfFrame(t,jsMs){const W=PERF.win,dt=PERF.last?t-PERF.last:0;PERF.last=t;PERF.frames++;
 if(!dt||dt>250||loopIdle()||mode==='battle'){W.n=W.sum=W.js=0;W.t0=t;return;}// QA L3: im Kampf nicht regeln (Kampf-Canvas ignoriert PERF.scale, die Welt würde danach unscharf starten)
 PERF.ft+=(dt-PERF.ft)*.08;PERF.js+=(jsMs-PERF.js)*.08;W.n++;W.sum+=dt;W.js+=jsMs;if(!W.t0)W.t0=t;
 if(t-W.t0<600||W.n<8)return;const avg=W.sum/W.n;W.n=W.sum=W.js=0;W.t0=t;
 if(performance.now()-PERF.changed<900)return;// nach Umschaltung erst einschwingen
 const target=SET.fps?Math.max(1000/SET.fps,16.7):16.7,autoRes=SET.res==='auto',autoTier=SET.gfx==='auto';
 if(avg>target*1.25){PERF.fast=0;PERF.slow++;if(autoRes&&PERF.scale>.6)perfScale(PERF.scale-(avg>target*1.8?.15:.08));else if(autoTier&&PERF.slow>=4){perfSet(PERF.tier==='high'?'mid':'low');}}
 else if(avg<target*1.08){PERF.slow=0;PERF.fast++;if(autoRes&&PERF.scale<1&&PERF.fast>=3){perfScale(PERF.scale+.05);PERF.fast=1;}else if(autoTier&&PERF.fast>=16&&(!autoRes||PERF.scale>=1)){const up=PERF.tier==='low'?'mid':PERF.tier==='mid'&&!PERF.weak?'high':null;if(up)perfSet(up);PERF.fast=0;}}
 else{PERF.slow=Math.max(0,PERF.slow-1);PERF.fast=Math.max(0,PERF.fast-1);}}
// Debug-Anzeige
function perfHud(){const on=!!window.PERF_HUD;let h=PERF.hud;if(!on){if(h)h.hidden=true;return;}
 if(!h){h=PERF.hud=document.createElement('div');h.id='perfHud';h.setAttribute('aria-hidden','true');h.style.cssText='position:fixed;left:6px;bottom:6px;z-index:9999;pointer-events:none;font:11px/1.35 ui-monospace,monospace;color:#e8ffe8;background:rgba(10,16,20,.72);padding:4px 7px;border-radius:6px;white-space:pre';document.body.appendChild(h);}
 h.hidden=false;const bt=mode==='battle'&&typeof BT!=='undefined'&&BT&&BT.r,r=bt?BT.r:(typeof R3!=='undefined'&&R3&&R3.r&&view!=='2d'?R3.r:null),inf=r?r.info.render:null,cv=r?r.domElement:null;
 h.textContent=`${(1000/Math.max(1,PERF.ft)).toFixed(0)} FPS · ${PERF.ft.toFixed(1)} ms · JS ${PERF.js.toFixed(1)} ms\n`+(inf?`Calls ${inf.calls} · Dreiecke ${(inf.triangles/1000).toFixed(1)}k\n`:'')+`Stufe ${PERF.tier}${SET.gfx==='auto'?' (auto)':''} · Auflösung ${cv?cv.width+'×'+cv.height:'-'} (${Math.round(PERF.scale*100)} %)${PERF.weak?' · schwach':''}`;}
try{if(/[?&]perf=1/.test(location.search))window.PERF_HUD=1;}catch(e){}
// Hauptschleife umhüllen (15-ui.js `loop`): Pause/Drosselung (03 loopGate) + Messung nur für tatsächlich gezeichnete Frames
if(typeof loop==='function'&&!loop._perf){const _loopL1=loop;loop=function(t){if(document.hidden){LOOP.paused=true;return;}if(!loopGate(t)){requestAnimationFrame(loop);return;}
  const lf=lastFrame,a=performance.now();_loopL1(t);if(lastFrame!==lf){perfFrame(t,performance.now()-a);if(t-PERF.hudT>250){PERF.hudT=t;perfHud();}}};loop._perf=1;}
// 3D-Standard: start() in 15-ui.js (L2) startet in 3D, Draufsicht nur mit SET.view2d=1; SET.view (07) spiegelt das ('third'|'2d').
