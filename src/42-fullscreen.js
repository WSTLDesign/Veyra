// ===== VEYRA – Vollbild 16:9 (Agent UI-Vollbild) =====
// Layout-Modus (body.lay-land | lay-port | lay-rot), Drehhinweis + Pause, Fullscreen-API + Orientation-Lock, iOS-Hinweis,
// HUD-Abblenden nach 4 s (body.hud-idle), Kamera-FOV je Seitenverhältnis (Welt + 3D-Kampf), Kampf-Canvas ohne Verzerrung (2D-Bühne + Ränder).
// Schnittstellen: fsLayout() (neu berechnen), fsToggle() (Vollbild an/aus), FSL = {mode, port, touch, aspect}
const FSL={mode:'land',port:false,touch:false,aspect:16/9};
function fsCan(){const d=document.documentElement;return!!(d.requestFullscreen||d.webkitRequestFullscreen);}
function fsIs(){return!!(document.fullscreenElement||document.webkitFullscreenElement);}
function fsRequest(){const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;if(!f||fsIs())return Promise.resolve(false);
 let p;try{p=f.call(d,{navigationUI:'hide'});}catch(e){return Promise.resolve(false);}
 return Promise.resolve(p).then(()=>{try{const o=screen.orientation;if(o&&o.lock)o.lock('landscape').catch(()=>{});}catch(e){}return true;}).catch(()=>false);}
function fsToggle(){if(fsIs()){const x=document.exitFullscreen||document.webkitExitFullscreen;try{const p=x&&x.call(document);if(p&&p.catch)p.catch(()=>{});}catch(e){}return;}
 fsRequest().then(ok=>{if(!ok)toast('Vollbild ist hier nicht verfügbar');});}
// Sichtbare Höhe (iOS Safari: Layout-Höhe bleibt bei eingeklappter Leiste kleiner als der sichtbare Bereich → Balken unten)
function fsVisH(){let h=innerHeight;try{const v=window.visualViewport;if(v&&v.height>0)h=Math.round(Math.max(v.height,v.scale>1.01?0:innerHeight));}catch(e){}return h||innerHeight;}
function fsVars(){const H=fsVisH();document.documentElement.style.setProperty('--vvh',H+'px');return H;}
function fsLayout(){
 const W=innerWidth,H=fsVars(),b=document.body;let touch=false;
 try{touch=matchMedia('(pointer:coarse)').matches||(navigator.maxTouchPoints>0&&matchMedia('(hover:none)').matches);}catch(e){}
 const port=H>W*1.05,rot=port&&touch&&SET.portrait!=='allow';
 FSL.port=port;FSL.touch=touch;FSL.aspect=W/Math.max(1,H);FSL.mode=rot?'rot':port?'port':'land';
 b.classList.toggle('lay-land',!port);b.classList.toggle('lay-port',port);b.classList.toggle('lay-rot',rot);b.classList.toggle('lay-tab',!port&&W>=900&&H>=600);
 document.documentElement.style.setProperty('--hud-dim',{stark:.4,mittel:.65,aus:1}[SET.hudDim]||.4);
 fsRot(rot);}
// ---------- Drehhinweis: Overlay + Pause (mode 'wait' sichern/wiederherstellen) ----------
let fsPaused=null;
function fsRot(on){const ov=document.getElementById('rotOv');if(!ov)return;ov.hidden=!on;
 if(on){if(typeof mode!=='undefined'&&mode==='world'&&G){fsPaused='world';mode='wait';held=null;STICK.x=STICK.y=0;}}
 else{if(fsPaused&&mode==='wait')mode=fsPaused;fsPaused=null;}}
(function(){
const $id=id=>document.getElementById(id),body=document.body;
// ---------- Layout bei Größen-/Lagewechsel ----------
let rz=0;const relayout=()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(()=>{fsLayout();try{if(R3&&R3.fit)R3.fit();}catch(e){}try{if(BT&&BT.fit)BT.fit();}catch(e){}});};
addEventListener('resize',relayout);addEventListener('orientationchange',relayout);
try{const vv=window.visualViewport;if(vv){vv.addEventListener('resize',relayout);vv.addEventListener('scroll',relayout);}}catch(e){}
// iOS: nach Lagewechsel/Leisten-Einklappen meldet Safari die Höhe verzögert → kurz nachmessen
let vvLast=0;setInterval(()=>{const h=fsVisH();if(h!==vvLast){vvLast=h;relayout();}},400);
try{screen.orientation&&screen.orientation.addEventListener&&screen.orientation.addEventListener('change',relayout);}catch(e){}
document.addEventListener('fullscreenchange',()=>{relayout();const b=$id('fsBtn');if(b)b.setAttribute('aria-pressed',fsIs()?'true':'false');fsExitBtn();});
// Escape verlässt das Vollbild immer (zusätzlich zum Browser-Standard); Knopf „Vollbild verlassen“ am PC
addEventListener('keydown',e=>{if(e.key==='Escape'&&fsIs()){const x=document.exitFullscreen||document.webkitExitFullscreen;try{const p=x&&x.call(document);if(p&&p.catch)p.catch(()=>{});}catch(e2){}}},{capture:true});
function fsExitBtn(){let b=$id('fsExit');if(fsIs()&&!FSL.touch){if(!b){b=document.createElement('button');b.id='fsExit';b.type='button';b.textContent='Vollbild verlassen (Esc)';b.onclick=()=>fsToggle();document.body.appendChild(b);}b.hidden=false;}else if(b)b.hidden=true;}
const _as=applySet;applySet=function(){const r=_as.apply(this,arguments);try{fsLayout();}catch(e){}return r;};
$id('rotAllow').addEventListener('click',()=>{SET.portrait='allow';saveSet();try{sfx('tap');}catch(e){}fsLayout();});
// Falls eine Sequenz während des Drehhinweises in die Welt zurückkehrt: erneut pausieren
setInterval(()=>{if(FSL.mode==='rot'&&typeof mode!=='undefined'&&mode==='world'&&G){fsPaused='world';mode='wait';held=null;STICK.x=STICK.y=0;}},300);
// ---------- Vollbild beim ersten Tippen + iOS-Hinweis (einmalig) ----------
const iOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=()=>{try{return!!navigator.standalone||matchMedia('(display-mode: fullscreen),(display-mode: standalone)').matches;}catch(e){return false;}};
function hint(html,ms){const h=$id('fsHint');if(!h)return;h.innerHTML=html+'<button type="button" aria-label="Hinweis schließen">OK</button>';h.hidden=false;h.classList.remove('on');void h.offsetWidth;h.classList.add('on');
 const off=()=>{h.classList.remove('on');setTimeout(()=>{h.hidden=true;},RED?0:300);};h.querySelector('button').onclick=e=>{e.stopPropagation();off();};setTimeout(off,ms||8000);}
let first=true;
// Automatisches Vollbild nur auf Touch-Geräten (Handy/Tablet). Am PC mit Maus nur per Knopf – sonst kommt man schwer wieder heraus.
document.addEventListener('pointerdown',()=>{if(!first)return;first=false;if(navigator.webdriver)return;
 if(SET.fs!==0&&FSL.touch&&fsCan()&&!fsIs())fsRequest();
 else if(iOS&&!standalone()&&!SET.iosHint){SET.iosHint=1;try{localStorage.setItem(SETKEY,JSON.stringify(SET));}catch(e){}
  setTimeout(()=>hint('<b>Tipp für Vollbild</b><span>Tippe in Safari auf <em>Teilen</em> und dann auf <em>Zum Home-Bildschirm</em>. Dann startet Veyra ohne Leisten.</span>',9000),900);}},{capture:true});
// ---------- HUD abblenden nach 4 s ohne Eingabe ----------
let lastAct=performance.now();const downs=new Set();
const wake=()=>{lastAct=performance.now();if(body.classList.contains('hud-idle'))body.classList.remove('hud-idle');};
addEventListener('pointerdown',e=>{downs.add(e.pointerId);wake();},{capture:true,passive:true});
addEventListener('pointerup',e=>{downs.delete(e.pointerId);wake();},{capture:true,passive:true});
addEventListener('pointercancel',e=>{downs.delete(e.pointerId);},{capture:true,passive:true});
addEventListener('pointermove',wake,{capture:true,passive:true});addEventListener('keydown',wake,{capture:true,passive:true});addEventListener('wheel',wake,{capture:true,passive:true});
setInterval(()=>{const idle=SET.hudDim!=='aus'&&typeof mode!=='undefined'&&mode==='world'&&!downs.size&&!held&&!STICK.x&&!STICK.y&&performance.now()-lastAct>4000;
 if(idle!==body.classList.contains('hud-idle'))body.classList.toggle('hud-idle',idle);},250);
// ---------- Kamera-FOV je Seitenverhältnis ----------
// Breiter als die Referenz: die Hälfte der Zusatzbreite wird zusätzliche Welt (hfov wächst), die andere Hälfte kostet etwas Höhe (kein Fischauge).
// Schmaler als 1,2 (Hochformat): vertikales FOV wächst, damit seitlich genug Welt bleibt.
const D2R=Math.PI/180;
function fovFor(V,A,ref,pe){const t=Math.tan(V*D2R/2);let k=1;if(A>ref)k=Math.sqrt(ref/A);else if(A<1.2)k=Math.pow(1.2/A,pe);return 2*Math.atan(t*k)/D2R;}
function hookR3(){if(typeof R3==='undefined'||!R3||!R3.r||R3.r._fsHook)return;const r=R3.r,prev=r.render;r._fsHook=1;
 r.render=function(S,cam){if(cam&&cam===R3.cam&&cam.isPerspectiveCamera&&cam.aspect>0){const base=cam.fov,f=fovFor(base,cam.aspect,16/9,.3);
   if(Math.abs(f-base)>.05){cam.fov=f;cam.updateProjectionMatrix();try{return prev.apply(r,arguments);}finally{cam.fov=base;}}}
  return prev.apply(r,arguments);};}
// 3D-Kampf: FOV + Bildausschnitt, damit die Kreaturen zwischen KP-Panels (links) und Befehlskarten (rechts unten) stehen
// Look L2: im Kampf gilt CAM (mode 'battle', 35-transitions.js) – Fallback-Anwendung hier, solange 10-mon3d CAM nicht selbst liest (CAM.battleApplied)
function camBattleOn(){try{const C=typeof camGet==='function'?camGet():null;return!!(C&&C.mode==='battle'&&C.eye&&!C.battleApplied&&typeof B!=='undefined'&&B&&!B2D);}catch(e){return false;}}
function camBattleApply(cam){const C=camGet(),A=cam.aspect||1.78;if(typeof BT!=='undefined'&&BT)BT._fsK=null;
 // FOV (Referenz 16:9): schmale Szenen bekommen mehr vertikales FOV, damit beide Kreaturen im Bild bleiben
 const f=2*Math.atan(Math.tan(C.fov*Math.PI/360)*Math.pow(Math.max(1,1.78/A),.45))*180/Math.PI;if(cam.view)cam.clearViewOffset();
 cam.fov=f;cam.updateProjectionMatrix();cam.position.set(C.eye.x,C.eye.y,C.eye.z);cam.lookAt(C.lookAt.x,C.lookAt.y,C.lookAt.z);cam.updateMatrixWorld();}
// Sprites (Billboards, Sortierung) vor dem Rendern schon auf die CAM-Kamera ausrichten
if(typeof sprTick==='function'){const _spt=sprTick;sprTick=function(S,cam){try{if(typeof BT!=='undefined'&&BT&&S===BT.s&&cam===BT.cam&&camBattleOn())camBattleApply(cam);}catch(e){}return _spt.apply(this,arguments);};}
function hookBT(){if(typeof BT==='undefined'||!BT||!BT.r||BT.r._fsHook)return;const r=BT.r,prev=r.render,cam=BT.cam,V0=cam.fov;r._fsHook=1;BT.V0=V0;
 r.render=function(S,c){
  if(c===cam&&cam.aspect>0&&camBattleOn()){camBattleApply(cam);
   const out=prev.apply(r,arguments);try{if(typeof battleHudPlace==='function')battleHudPlace(cam,r.domElement);}catch(e){}return out;}
  if(c===cam&&cam.aspect>0){const key=cam.aspect.toFixed(3)+FSL.mode+(r.domElement.clientWidth|0);
   if(BT._fsK!==key){BT._fsK=key;cam.fov=FSL.port?fovFor(V0,cam.aspect,9,.85):2*Math.atan(Math.tan(V0*D2R/2)*Math.max(1,1.6/cam.aspect)*1.06)/D2R;const w=r.domElement.clientWidth||240,h=r.domElement.clientHeight||150;
    // Querformat: Bild leicht nach links/oben schieben (Platz für das Dock rechts unten); Hochformat: neutral
    if(!FSL.port&&cam.aspect>1.3){cam.setViewOffset(w,h,Math.round(w*.085),Math.round(h*.09),w,h);}else if(cam.view)cam.clearViewOffset();
    cam.updateProjectionMatrix();}}
  return prev.apply(r,arguments);};
 const fit=BT.fit;if(fit&&!fit._fs){BT.fit=function(){const o=fit.apply(this,arguments);BT._fsK=null;return o;};BT.fit._fs=1;}}
// ---------- Kampf-Canvas (#bcv): Seitenverhältnis der Szene, 2D-Bühne unverzerrt, Ränder fortgesetzt ----------
const bc=$id('bcv'),bctx=bc.getContext('2d'),stP=CanvasRenderingContext2D.prototype.setTransform,OFF={kx:1,ky:1,ox:0,oy:0};
bctx.setTransform=function(a,b,c,d,e,f){if(arguments.length===6&&!(a===1&&b===0&&c===0&&d===1&&e===0&&f===0))return stP.call(this,a*OFF.kx,b*OFF.ky,c*OFF.kx,d*OFF.ky,e*OFF.kx+OFF.ox,f*OFF.ky+OFF.oy);return stP.apply(this,arguments);};
function bcvFit(){const sc=bc.parentNode,w=sc&&sc.clientWidth,h=sc&&sc.clientHeight;if(!w||!h)return false;
 const Hp=Math.max(150,Math.round(150*BS)),Wp=Math.min(4096,Math.round(Hp*w/h));if(bc.width!==Wp||bc.height!==Hp){bc.width=Wp;bc.height=Hp;}return true;}
function map3d(){OFF.kx=bc.width/(240*BS);OFF.ky=bc.height/(150*BS);OFF.ox=0;OFF.oy=0;}
// 2D: Bühne 240×150 so groß wie möglich; im Querformat oben 84 % (unten liegt die UI), Rest = fortgesetzter Himmel/Boden
function map2d(){const Wp=bc.width,Hp=bc.height,land=!FSL.port&&Wp/Hp>1.3,f=land?.86:1,S=Math.min(Wp/240,Hp*f/150);
 OFF.kx=OFF.ky=S/BS;OFF.ox=Math.round((Wp-240*S)*(land?.18:.5));OFF.oy=land?Math.round(Math.max(0,Hp*.02)):Math.round((Hp-150*S)*.42);return S;}
function extend2d(S){const Wp=bc.width,Hp=bc.height,x0=OFF.ox,y0=OFF.oy,x1=Math.round(x0+240*S),y1=Math.round(y0+150*S);bctx.save();stP.call(bctx,1,0,0,1,0,0);bctx.imageSmoothingEnabled=true;
 try{if(x0>0)bctx.drawImage(bc,x0+1,0,1,Hp,0,0,x0+1,Hp);if(x1<Wp)bctx.drawImage(bc,x1-2,0,1,Hp,x1-1,0,Wp-x1+1,Hp);
  // oben/unten: einfarbig aus einem reinen Himmels-/Bodenpixel (keine Streifen unter Plattformen)
  if(y0>0)bctx.drawImage(bc,x0+2,y0+1,1,1,0,0,Wp,y0+1);if(y1<Hp){bctx.drawImage(bc,x0+2,y1-2,1,1,0,y1-1,Wp,Hp-y1+1);}}catch(e){}bctx.restore();}
if(typeof drawBattle2D==='function'){const _d2=drawBattle2D;drawBattle2D=function(){if(!bcvFit())return _d2.apply(this,arguments);const S=map2d();const r=_d2.apply(this,arguments);extend2d(S);return r;};}
if(typeof drawBattle==='function'){const _db=drawBattle;drawBattle=function(){if(bcvFit())map3d();try{hookBT();}catch(e){}const r=_db.apply(this,arguments);const b=$id('battle');if(b)b.classList.toggle('b2d',!!B2D);return r;};}
// ---------- 2D-Welt: Bereiche außerhalb kleiner Karten in Umgebungsfarbe (PALETTE) statt Schwarz ----------
function lbColor(){const th=cur&&cur.theme,nt=typeof isNight==='function'&&isNight(),E=PALETTE.env,m=PALETTE.mix;
 const base=cur&&cur.inside?m(E.wood,'#000000',.55):th==='cave'?'#241b2e':th==='snow'?m(E.sky,'#ffffff',.35):th==='beach'?m(E.water,'#000000',.15):m(E.parkD,'#000000',.22);return nt?m(base,'#05060c',.55):base;}
if(typeof draw==='function'){const _dr=draw;draw=function(){const r=_dr.apply(this,arguments);try{if(cur){const c=cx,W=cv.width,H=cv.height,L=Math.round(-Math.round(camX*SC)),T=Math.round(-Math.round(camY*SC)),R=L+Math.round(cur.w*TS*SC),Bm=T+Math.round(cur.h*TS*SC);
  if(L>0||T>0||R<W||Bm<H){c.save();stP.call(c,1,0,0,1,0,0);c.fillStyle=lbColor();if(L>0)c.fillRect(0,0,L,H);if(R<W)c.fillRect(R,0,W-R,H);if(T>0)c.fillRect(0,0,W,T);if(Bm<H)c.fillRect(0,Bm,W,H-Bm);
   const sh=Math.round(10*SC/2.5);c.globalAlpha=.35;c.fillStyle='#000';if(L>0)c.fillRect(L-sh*.4,Math.max(0,T),sh*.4,Math.min(H,Bm)-Math.max(0,T));if(R<W)c.fillRect(R,Math.max(0,T),sh*.4,Math.min(H,Bm)-Math.max(0,T));c.restore();}}}catch(e){}return r;};}
// ---------- Takt: Hooks nachziehen ----------
setInterval(()=>{try{hookR3();}catch(e){}},500);
fsLayout();
})();
