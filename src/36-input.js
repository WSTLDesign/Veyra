// ===== VEYRA – Steuerung (Redesign Agent E, geprüft/vollendet durch Agent UI-Vollbild) =====
// 3D-Freilauf mit dynamischem Analogstick (links), Kamera wischen (rechts), Kontext-Buttons (A, Kapsel werfen, Rennen, Chronik).
// Das Steuerkreuz (15-ui.js) und SET.ctrl 'kreuz'/'stick' bleiben unverändert; neu: SET.ctrl 'dyn' (Standard in 3D, in 2D zeigt es das Steuerkreuz).
// Schnittstellen:
//  window.CAM  = {mode:'explore',target,dist,height,yaw,pitch,fov,roll,lookAt}  – yaw = Blickrichtung (Konvention wie P.ang: vorwärts = (-sin yaw, -cos yaw)),
//                pitch = Kamerahöhenwinkel in rad (PITCH0 .30 = Standardansicht). Agent A/D: setzt 09 CAM.yaw/pitch selbst, dann CAM.applied=true setzen → 36 schaltet seinen Render-Shim ab.
//  window.INP  = {st (Stick), cm (Kamera), aim (Wurf), centerCam(), camReset(), throwAt(roamer), version}
//  G.throwBonus = true  – Wurf aus der Welt: erster Fangversuch im folgenden Kampf bekommt Überraschungsbonus ×2 (catchCtx-Wrapper unten; 24-capture/14-battle dürfen es zusätzlich lesen). Wird bei Kampfende gelöscht.
//  SET: ctrl 'dyn'|'kreuz'|'stick', inSens (50–150 %), camInv ''|'x'|'y'|'xy', inHint, inV (Migration); Stick-Größe = SET.stick (S|M|L); Vibration = SET.vib.
//  Abblenden nach 4 s: body.hud-idle (42-fullscreen.js, SET.hudDim). Optionen stehen in 15-ui.js rSettings (Abschnitt Steuerung).
(function(){
const PITCH0=.30,TAU=Math.PI*2,DEAD_ON=.2,DEAD_OFF=.12,RUN_ON=.95,RUN_OFF=.84;
const wrap=a=>{a%=TAU;if(a>Math.PI)a-=TAU;else if(a<-Math.PI)a+=TAU;return a;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const now=()=>performance.now();
const redMotion=()=>{try{return !!RED||matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
const save=()=>{try{localStorage.setItem(SETKEY,JSON.stringify(SET));}catch(e){}};
// ---------- Migration & Defaults ----------
if(SET.inV!==1){SET.inV=1;if(SET.ctrl==='kreuz')SET.ctrl='dyn';save();}
if(SET.inSens==null)SET.inSens=100;if(SET.camInv==null)SET.camInv='';
// ---------- Kamera-Objekt ----------
function getCam(){let C=null;try{if(typeof CAM!=='undefined'&&CAM)C=CAM;}catch(e){}
 if(!C)C=window.CAM=window.CAM||{};
 const D={mode:'explore',target:{x:0,y:0,z:0},dist:3.6,height:2.3,yaw:0,pitch:PITCH0,fov:55,roll:0,lookAt:{x:0,y:0,z:0}};
 for(const k in D)if(C[k]===undefined)C[k]=D[k];return C;}
getCam();
// ---------- Zustand ----------
const ST={id:null,on:false,act:false,run:false,bx:0,by:0,x:0,y:0,m:0,n:0,th:null},
 CM={id:null,x:0,y:0,t0:0,px:0,py:0,moved:0,tap:{t:0,x:0,y:0}},
 AIM={on:false,id:null,t0:0,x:0,y:0,moved:0,fly:null,dirty:false,lock:null},
 INP={version:1,st:ST,cm:CM,aim:AIM,cen:null,camF:1,mapId:null,view:null,act:now(),omega:0,e0:.2,hint:0,hintT:0,vp:null,rc:null,e5:1.6};
window.INP=INP;
// ---------- DOM & CSS ----------
const css=`
.in-root{position:fixed;inset:0;z-index:12;pointer-events:none;font-family:var(--font-display);-webkit-touch-callout:none}
.in-root[hidden]{display:none!important}
body.in-dyn #stick,body.in-dyn #dpad,body.in-dyn #pad .ab{display:none!important}
body.in-dyn #app,.in-root{touch-action:none}
.in-stick{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;opacity:0;transition:opacity var(--t-100) linear;will-change:transform}
.in-stick.on{opacity:1}
.in-base{position:absolute;left:calc(var(--in-d)/-2);top:calc(var(--in-d)/-2);width:var(--in-d);height:var(--in-d);border-radius:50%;box-sizing:border-box;
 background:radial-gradient(circle at 50% 38%,rgba(255,255,255,.9),var(--glass-bg) 72%);border:1.5px solid var(--glass-edge);box-shadow:var(--sh-2),inset 0 2px 10px rgba(24,34,48,.08);
 backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur));transform:scale(.7);transition:transform var(--t-200) var(--ease-press)}
.in-stick.on .in-base{transform:scale(1)}
.in-base::before{content:'';position:absolute;inset:13%;border-radius:50%;border:2px dotted var(--ink-3);opacity:.55}
.in-ring{position:absolute;inset:-5px;border-radius:50%;border:3px solid var(--sig);opacity:calc(var(--m,0)*1.1);transform:scale(calc(.94 + var(--m,0)*.06));box-shadow:0 0 16px var(--sig-glow)}
.in-stick.run .in-ring{box-shadow:0 0 0 5px var(--sig-glow),0 0 28px var(--sig-glow);animation:inPulse .8s ease-in-out infinite}
@keyframes inPulse{50%{transform:scale(1.045)}}
.in-knob{position:absolute;left:calc(var(--in-d)*-.22);top:calc(var(--in-d)*-.22);width:calc(var(--in-d)*.44);height:calc(var(--in-d)*.44);border-radius:50%;box-sizing:border-box;
 background:radial-gradient(circle at 35% 30%,#fff 0,#fff 28%,var(--sig-soft) 100%);border:2px solid var(--focus);box-shadow:var(--sh-2);transform:translate3d(var(--kx,0px),var(--ky,0px),0)}
.in-stick.run .in-knob{background:radial-gradient(circle at 35% 30%,var(--sig-hi),var(--sig));border-color:#fff}
/* Daumenbogen um A (Ursprung rechts unten); Größen skalieren mit --u (42/styles), Touch ≥ 48 px */
.in-cluster{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));width:calc(var(--in-a) * 3.4);height:calc(var(--in-a) * 2.8);pointer-events:none;transition:opacity var(--t-500) var(--ease-out)}
.in-root{--in-a:clamp(64px,calc(var(--u,13px) * 5.6),80px)}
body.hud-idle .in-cluster,body.hud-idle .in-ghost{opacity:var(--hud-dim,.4)}
.in-btn{position:absolute;pointer-events:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;box-sizing:border-box;margin:0;padding:0 16px;min-width:48px;min-height:48px;
 border:1.5px solid var(--glass-edge);border-radius:var(--r-pill);background:var(--glass-bg);color:var(--ink-1);box-shadow:var(--sh-2);backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur));
 font:var(--fw-display) var(--fs-sm)/1 var(--font-display);letter-spacing:.02em;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;
 transition:transform var(--t-100) var(--ease-press),background var(--t-200),color var(--t-200),box-shadow var(--t-200)}
.in-root .in-btn:active,.in-root .in-btn.press{transform:scale(var(--press-scale))}
.in-btn:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
.in-btn small{font:700 11px/1 var(--font-display);letter-spacing:.03em}
.in-btn[aria-pressed=true]{background:var(--sig);color:#fff;border-color:rgba(255,255,255,.6);box-shadow:var(--sh-sig),var(--sh-2)}
.in-btn[hidden]{display:none!important}
.in-a{right:0;bottom:0;width:var(--in-a);height:var(--in-a);border-radius:50%;padding:0;font-size:calc(var(--in-a) * .36);background:linear-gradient(160deg,var(--sig-2),var(--sig));color:#fff;border-color:rgba(255,255,255,.6);box-shadow:var(--sh-sig),var(--sh-2);text-shadow:0 1px 0 rgba(0,0,0,.18)}
.in-a::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--sig-hi);opacity:0;transform:scale(.9);transition:opacity var(--t-300),transform var(--t-300) var(--ease-out)}
.in-root.near .in-a::after{opacity:.8;transform:scale(1);animation:inPulse 1.2s ease-in-out infinite}
.in-throw{right:calc(var(--in-a) * 1.38);bottom:calc(var(--in-a) * .08);width:calc(var(--in-a) * .8);height:calc(var(--in-a) * .8);border-radius:50%;padding:0}
.in-run{right:calc(var(--in-a) * .78);bottom:calc(var(--in-a) * 1.08)}
.in-menu{right:calc(var(--in-a) * .1);bottom:calc(var(--in-a) * 1.5);width:calc(var(--in-a) * .78);height:calc(var(--in-a) * .78);border-radius:50%;padding:0}
.in-menu svg{width:44%;height:44%}
.in-throw.aim{background:var(--sig-soft);border-color:var(--sig);box-shadow:0 0 0 4px var(--sig-glow),var(--sh-2)}
.in-throw.off{opacity:.55}
.in-throw svg{width:46%;height:46%;display:block}
/* Geister-Stick: zeigt Kindern, wo der Daumen hin darf; verschwindet, sobald der echte Stick erscheint */
.in-ghost{position:fixed;left:max(28px,calc(env(safe-area-inset-left,0px) + 16px));bottom:max(24px,env(safe-area-inset-bottom,0px));width:var(--in-d);height:var(--in-d);border-radius:50%;pointer-events:none;
 border:2px dashed rgba(255,255,255,.75);background:radial-gradient(circle,rgba(255,255,255,.28) 0 22%,rgba(255,255,255,.08) 23% 100%);box-shadow:0 0 0 1px rgba(24,34,48,.12);transition:opacity var(--t-300)}
.in-ghost::after{content:'';position:absolute;left:50%;top:50%;width:30%;height:30%;margin:-15% 0 0 -15%;border-radius:50%;background:rgba(255,255,255,.7);box-shadow:var(--sh-1)}
.in-root.st-on .in-ghost,.in-root[data-m=dialog] .in-ghost{opacity:0}
body.lay-port .in-ghost{bottom:max(28px,env(safe-area-inset-bottom,0px));left:max(28px,env(safe-area-inset-left,0px))}
.in-root[data-m=dialog] .in-opt{display:none!important}
body.lay-land .in-root[data-m=dialog] .in-cluster{opacity:0;pointer-events:none}body.lay-land .in-root[data-m=dialog] .in-btn{pointer-events:none}
.in-aim{position:fixed;left:0;top:0;pointer-events:none;z-index:11}
.in-hint{position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom,0px));transform:translate(-50%,10px);max-width:min(86vw,420px);box-sizing:border-box;padding:10px 16px;border-radius:var(--r-3);text-align:center;
 background:var(--glass-bg);border:1.5px solid var(--glass-edge);box-shadow:var(--sh-2);backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur));
 color:var(--ink-1);font:600 var(--fs-sm)/1.35 var(--font-ui);opacity:0;pointer-events:none;transition:opacity var(--t-300),transform var(--t-300) var(--ease-out)}
.in-hint.on{opacity:1;transform:translate(-50%,0)}
.in-hint b{color:var(--sig-ink);font-family:var(--font-display)}
body.red .in-root *,body.red .in-root{transition:none!important;animation:none!important}
@media (prefers-reduced-motion:reduce){.in-root *{transition:none!important;animation:none!important}}
`;
const sty=document.createElement('style');sty.id='in-style';sty.textContent=css;document.head.appendChild(sty);
const root=document.createElement('div');root.className='in-root';root.hidden=true;root.dataset.m='world';
root.innerHTML=`<i class="in-ghost" aria-hidden="true"></i><div class="in-stick" aria-hidden="true"><i class="in-base"><i class="in-ring"></i></i><i class="in-knob"></i></div>
<div class="in-cluster">
 <button class="in-btn in-menu in-opt" type="button" aria-label="Chronik öffnen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V19c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5zM12 6v13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><small>Chronik</small></button>
 <button class="in-btn in-run in-opt" type="button" aria-label="Rennen umschalten" aria-pressed="false"><span>Rennen</span></button>
 <button class="in-btn in-throw in-opt" type="button" aria-label="Kapsel werfen: Halten zum Zielen, loslassen zum Werfen"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l9 8-3 13-6 5-6-5-3-13z" fill="#8fdcec" stroke="#182230" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 3l-3 9 3 17M16 3l3 9-3 17" stroke="#182230" stroke-opacity=".45" stroke-width="1.2" fill="none"/><ellipse cx="16" cy="14.5" rx="11" ry="3.2" fill="none" stroke="#ffc21a" stroke-width="2.4"/></svg><small>Fang</small></button>
 <button class="in-btn in-a" type="button" aria-label="Interagieren"><span>A</span></button>
</div>
<div class="in-hint" role="status"><b>Links</b> ziehen: gehen · <b>Rechts</b> wischen: Kamera · <b>Doppeltippen</b>: Kamera zurück</div>`;
document.body.appendChild(root);
const $s=root.querySelector('.in-stick'),$ring=root.querySelector('.in-ring'),$A=root.querySelector('.in-a'),$T=root.querySelector('.in-throw'),$run=root.querySelector('.in-run'),$menu=root.querySelector('.in-menu'),$hint=root.querySelector('.in-hint');
const aimCv=document.createElement('canvas');aimCv.className='in-aim';aimCv.setAttribute('aria-hidden','true');root.appendChild(aimCv);
const actx=aimCv.getContext('2d');
// ---------- Hilfen ----------
const sizeS=()=>({S:.85,M:1,L:1.3}[SET.stick]||1);
const stickR=()=>Math.round(54*sizeS());
const lockRun=()=>{try{return !!runLock;}catch(e){return false;}};
const dynOn=()=>SET.ctrl==='dyn'&&view!=='2d'&&!!G&&!!cur;
const camOn=()=>{const C=getCam();return dynOn()&&mode!=='battle'&&mode!=='title'&&!B&&!C.applied&&(!C.mode||C.mode==='explore')&&!!R3&&!!R3.player;};
const uiTarget=t=>!!(t&&t.closest&&t.closest('button,a,input,select,textarea,label,summary,#dlg,#hqCard,#mmW,.hud,.layer,.in-cluster,#toast,#rotOv,#fsHint'));
const act=()=>{INP.act=now();};
function camYaw(){return getCam().yaw;}
function playerAng(){return P.ang==null?YAW[P.dir]:P.ang;}
function camSync(force){ // Kartenwechsel / Ansichtswechsel → Kamera hinter die Figur
 const C=getCam();if(!cur)return;if(force||INP.mapId!==cur.id||INP.view!==view){INP.mapId=cur.id;INP.view=view;C.yaw=playerAng();C.pitch=PITCH0;INP.camF=1;INP.cen=null;}}
INP.camReset=()=>{INP.mapId=null;camSync(true);};
INP.centerCam=function(){const C=getCam();if(!camOn()&&!dynOn())return;if(redMotion()){C.yaw=playerAng();C.pitch=PITCH0;INP.cen=null;return;}
 INP.cen={t0:now(),from:C.yaw,p0:C.pitch,dur:360};try{sfx('tap');}catch(e){}};
// ---------- Stick (links) ----------
function stShow(on){$s.classList.toggle('on',on);root.classList.toggle('st-on',on);}
function stPlace(){const R=stickR();$s.style.transform=`translate3d(${ST.bx}px,${ST.by}px,0)`;root.style.setProperty('--in-d',Math.round(R*2.5)+'px');}
function stEnd(){if(ST.id==null&&!ST.on)return;ST.id=null;ST.on=false;ST.act=false;ST.m=ST.n=0;ST.th=null;ST.run=false;stShow(false);$s.classList.remove('run');
 STICK.x=STICK.y=0;INP.omega=0;if(view!=='2d')P.run=lockRun();}
function stDown(e){ST.id=e.pointerId;ST.on=true;ST.act=false;ST.run=false;ST.th=null;ST.bx=ST.ox=e.clientX;ST.by=ST.oy=e.clientY;ST.m=ST.n=0;
 root.style.setProperty('--m',0);$s.style.setProperty('--kx','0px');$s.style.setProperty('--ky','0px');$s.classList.remove('run');stPlace();stShow(true);held=null;}
function stMove(e){const R=stickR();let dx=e.clientX-ST.bx,dy=e.clientY-ST.by,d=Math.hypot(dx,dy);
 if(d>R){const k=(d-R)/d;ST.bx+=dx*k;ST.by+=dy*k;dx=e.clientX-ST.bx;dy=e.clientY-ST.by;d=Math.hypot(dx,dy);stPlace();} // Basis wandert mit
 const m=clamp(d/R,0,1);ST.m=m;
 if(!ST.act){if(m>=DEAD_ON)ST.act=true;}else if(m<DEAD_OFF)ST.act=false;           // Totzone mit Hysterese
 ST.n=ST.act?clamp((m-DEAD_OFF)/(.9-DEAD_OFF),0,1):0;                              // Gehen: stufenlos bis 90 %
 if(ST.act){const th=Math.atan2(dx,-dy);if(ST.th===null||Math.abs(wrap(th-ST.th))>(m<.35?.21:.05))ST.th=th;} // Richtungs-Hysterese
 const wasRun=ST.run;if(!ST.run&&m>=RUN_ON)ST.run=true;else if(ST.run&&m<RUN_OFF)ST.run=false;                  // Laufen nur bei großer Auslenkung
 if(ST.run&&!wasRun){try{vib(8);}catch(x){}}
 $s.classList.toggle('run',ST.run&&ST.act);
 const kx=d>0?dx/d*Math.min(d,R):0,ky=d>0?dy/d*Math.min(d,R):0;$s.style.setProperty('--kx',kx.toFixed(1)+'px');$s.style.setProperty('--ky',ky.toFixed(1)+'px');root.style.setProperty('--m',ST.act?m.toFixed(2):0);}
// ---------- Fahren (wird vor freeMove aufgerufen) ----------
function driving(){return ST.on&&ST.act&&mode==='world'&&view!=='2d'&&SET.ctrl==='dyn';}
function drive(dt){const s=Math.min(dt,120)/1000,M=(typeof MOVE_PARAMS!=='undefined'&&MOVE_PARAMS[P.state])||{turn:1.7};
 if(P.ang==null)P.ang=YAW[P.dir];held=null;P.run=ST.run||lockRun();
 const tgt=camYaw()-ST.th;let err=wrap(tgt-P.ang);
 if(typeof MV!=='undefined'&&MV.glide){STICK.x=-clamp(err*1.4,-1,1);STICK.y=-Math.max(.5,ST.n);INP.omega=null;return;} // Gleitflug: Lenken über STICK.x
 const ice=cur&&tileAt(cur,P.x,P.y)==='I',wmax=(3+2.2*M.turn)*(ice?.5:1);
 let dl=err*(1-Math.exp(-13*s));dl=clamp(dl,-wmax*s,wmax*s);P.ang+=dl;INP.omega=s>0?dl/s:0;
 err=wrap(tgt-P.ang);const a=Math.abs(err),f=a<.7?1:a>1.75?0:(()=>{const u=(a-.7)/1.05;return 1-u*u*(3-2*u);})();
 const v=ST.n*f;STICK.x=0;STICK.y=v>.02?-(.16+.84*v):0;}
const _fm=freeMove;
freeMove=function(dt){if(driving()){drive(dt);if(INP.omega===null){return _fm.apply(this,arguments);}
 P.tv=0;const r=_fm.apply(this,arguments);P.tv=INP.omega;return r;}
 return _fm.apply(this,arguments);};
// ---------- Kamera wischen (rechts) ----------
function camSwipe(dx,dy){const C=getCam(),k=(SET.inSens||100)/100,inv=SET.camInv||'';INP.cen=null;
 C.yaw=wrap(C.yaw+(inv.includes('x')?1:-1)*dx*.0075*k);
 C.pitch=clamp(C.pitch+(inv.includes('y')?-1:1)*dy*.005*k,.02,.85);}
function cmDown(e){CM.id=e.pointerId;CM.x=CM.px=e.clientX;CM.y=CM.py=e.clientY;CM.t0=now();CM.moved=0;}
function cmMove(e){const dx=e.clientX-CM.x,dy=e.clientY-CM.y;CM.x=e.clientX;CM.y=e.clientY;CM.moved=Math.max(CM.moved,Math.hypot(e.clientX-CM.px,e.clientY-CM.py));
 if(CM.moved>6)camSwipe(dx,dy);}
function cmUp(e,cancel){const t=now();if(!cancel&&CM.moved<12&&t-CM.t0<280){const T=CM.tap;
  if(t-T.t<340&&Math.hypot(e.clientX-T.x,e.clientY-T.y)<56){INP.centerCam();CM.tap={t:0,x:0,y:0};}else CM.tap={t,x:e.clientX,y:e.clientY};}
 CM.id=null;}
// ---------- Zeiger-Verteilung ----------
function ok(e){return dynOn()&&!e.defaultPrevented&&!(e.pointerType==='mouse'&&e.button!==0);}
document.addEventListener('pointerdown',e=>{act();if(!ok(e)||mode!=='world'||uiTarget(e.target))return;
 const sr=document.getElementById('screen').getBoundingClientRect();if(e.clientY<sr.top)return;
 if(e.clientX<innerWidth/2){if(ST.id==null){stDown(e);try{e.target.setPointerCapture(e.pointerId);}catch(x){}stMove(e);hideHint();}}
 else if(CM.id==null){cmDown(e);try{e.target.setPointerCapture(e.pointerId);}catch(x){}hideHint();}});
document.addEventListener('pointermove',e=>{if(e.pointerId===ST.id){act();stMove(e);}else if(e.pointerId===CM.id){act();cmMove(e);}});
const upH=cancel=>e=>{if(e.pointerId===ST.id)stEnd();else if(e.pointerId===CM.id)cmUp(e,cancel);};
document.addEventListener('pointerup',upH(false));document.addEventListener('pointercancel',upH(true));
document.addEventListener('lostpointercapture',e=>{if(e.pointerId===ST.id)stEnd();else if(e.pointerId===CM.id)cmUp(e,true);});
document.addEventListener('touchmove',e=>{if((ST.id!=null||CM.id!=null||AIM.on)&&e.cancelable)e.preventDefault();},{passive:false});
document.addEventListener('contextmenu',e=>{if(ST.id!=null||CM.id!=null||AIM.on||(e.target.closest&&e.target.closest('.in-root')))e.preventDefault();});
addEventListener('blur',()=>{stEnd();CM.id=null;aimCancel();});
// Tastatur: , und . drehen die Kamera, C zentriert
const KC={};document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;act();if(e.code==='Comma'||e.code==='Period')KC[e.code]=1;if(e.code==='KeyC'&&!e.repeat&&dynOn()&&mode==='world')INP.centerCam();});
document.addEventListener('keyup',e=>{delete KC[e.code];});
// ---------- Kontext-Buttons ----------
function bind(btn,fn,down){const h=e=>{e.preventDefault();act();btn.classList.add('press');setTimeout(()=>btn.classList.remove('press'),120);fn(e);};
 btn.addEventListener('pointerdown',down||h);btn.addEventListener('click',e=>{if(e.detail===0)h(e);});}
bind($A,()=>pressA());
bind($menu,()=>pressB());
bind($run,()=>{try{runLock=!runLock;}catch(e){}P.run=lockRun();syncBtns();try{sfx('tap');vib(6);}catch(e){}});
function syncBtns(){const L=lockRun();$run.setAttribute('aria-pressed',L?'true':'false');const rb=document.getElementById('runBtn');if(rb)rb.setAttribute('aria-pressed',L?'true':'false');
 const cap=hasCaps();$T.classList.toggle('off',!cap);}
let nearT=0,nearV=false;
function nearTalk(){const t=now();if(t-nearT<250)return nearV;nearT=t;nearV=false;
 try{if(!cur||typeof npcs!=='function')return false;const a=view!=='2d'&&P.ang!=null?P.ang:YAW[P.dir],fx=-Math.sin(a),fz=-Math.cos(a);
  nearV=npcs().some(n=>{const dx=n.x-P.px,dz=n.y-P.py,d=Math.hypot(dx,dz);return d<1.7&&d>.01&&(dx*fx+dz*fz)/d>.55;});}catch(e){}return nearV;}
function hasCaps(){try{return Object.values(CAPSULES).some(c=>(G.bag[c.item]||0)>0);}catch(e){return true;}}
// ---------- Kapsel werfen ----------
function aimTarget(){const C=getCam();let best=null;if(!ROAM||!ROAM.list)return null;
 for(const r of ROAM.list){const dx=r.px-P.px,dz=r.py-P.py,d=Math.hypot(dx,dz);if(d>9.5||d<.8||r.dead)continue;
  const da=Math.abs(wrap(Math.atan2(-dx,-dz)-C.yaw));if(da>.5)continue;const sc=da+d*.03;if(!best||sc<best.s)best={r,d,s:sc};}
 return best;}
function canThrow(){if(mode!=='world'||view==='2d'||!G)return false;
 if(!G.team.some(m=>m.hp>0)){toast('Dein Team braucht erst eine Pause.');return false;}
 if(!hasCaps()){toast('Du hast keine Fangkapseln.');return false;}
 if(P.state==='swim'||P.state==='glide'||P.state==='climb'||(typeof MV!=='undefined'&&(MV.glide||MV.hop3))){toast('Hier kannst du nicht werfen.');return false;}return true;}
function aimStart(e){e.preventDefault();act();if(AIM.fly||!canThrow())return;AIM.on=true;AIM.id=e.pointerId;AIM.t0=now();AIM.x=e.clientX;AIM.y=e.clientY;AIM.moved=0;AIM.dirty=true;$T.classList.add('aim');
 try{$T.setPointerCapture(e.pointerId);}catch(x){}INP.cen=null;try{sfx('tap');}catch(x){}}
function aimMove(e){if(!AIM.on||e.pointerId!==AIM.id)return;act();const dx=e.clientX-AIM.x,dy=e.clientY-AIM.y;AIM.x=e.clientX;AIM.y=e.clientY;AIM.moved+=Math.hypot(dx,dy);camSwipe(dx,dy);}
function aimCancel(){if(!AIM.on)return;AIM.on=false;AIM.id=null;$T.classList.remove('aim');}
function aimEnd(e,cancel){if(!AIM.on||e.pointerId!==AIM.id)return;const held_=now()-AIM.t0;aimCancel();if(cancel)return;
 const tg=aimTarget();if(!tg&&held_<260&&AIM.moved<10){toast('Zum Zielen den Knopf halten, wischen und loslassen.');return;}
 launch(tg);}
$T.addEventListener('pointerdown',aimStart);$T.addEventListener('pointermove',aimMove);$T.addEventListener('pointerup',e=>aimEnd(e,false));$T.addEventListener('pointercancel',e=>aimEnd(e,true));$T.addEventListener('lostpointercapture',e=>aimEnd(e,true));
$T.addEventListener('click',e=>{if(e.detail===0&&canThrow())launch(aimTarget());}); // Tastatur: sofort auf bestes Ziel
function handPos(){const pl=R3.player;return[pl.position.x,pl.position.y+1.05,pl.position.z];}
function groundAt(x,z){return typeof terrainY==='function'?terrainY(x,z):0;}
function endPoint(tg){if(tg&&tg.r){const r=tg.r;return[r.px+.5,groundAt(r.px+.5,r.py+.5)+.35,r.py+.5];}
 const C=getCam(),h=handPos(),x=h[0]-Math.sin(C.yaw)*5,z=h[2]-Math.cos(C.yaw)*5;return[x,groundAt(x,z)+.05,z];}
function launch(tg){const h=handPos(),e=endPoint(tg),d=Math.hypot(e[0]-h[0],e[2]-h[2]);
 AIM.fly={t0:now(),dur:(redMotion()?260:520+d*38),r:tg?tg.r:null,S:h,E:e,H:.7+d*.14};AIM.dirty=true;
 try{const pl=R3.player;if(typeof figAnim==='function')figAnim(pl,'wurf');}catch(x){}
 try{sfx('whoosh');vib(10);}catch(x){}}
INP.throwAt=function(r){if(!canThrow())return false;launch(r?{r,d:Math.hypot(r.px-P.px,r.py-P.py)}:null);return true;};
function flyDone(){const f=AIM.fly;AIM.fly=null;AIM.dirty=true;const r=f.r;
 if(r&&ROAM.list.includes(r)&&mode==='world'&&G.team.some(m=>m.hp>0)){try{sfx('pop');vib([20,30,20]);}catch(e){}
  G.throwBonus=true;try{startWild(r);}catch(e){G.throwBonus=false;console.error(e);}return;}
 try{spawnFx('land',f.E[0],f.E[1],f.E[2]);sfx('land');}catch(e){}toast('Daneben! Versuch es noch einmal.');}
// Fangbonus: erster Fangversuch nach einem Wurf bekommt Überraschungsbonus (wie bei einer schlafenden Kreatur)
if(typeof catchCtx==='function'){const _cc=catchCtx;catchCtx=function(){const c=_cc.apply(this,arguments);try{if(G&&G.throwBonus&&(c.turn||1)<=1){c.surprise=Math.max(c.surprise||1,2);c.thrown=true;}}catch(e){}return c;};}
if(typeof startBattle==='function'){const _sb=startBattle;startBattle=function(o){try{if(G&&!(o&&o.wild))G.throwBonus=false;}catch(e){}return _sb.apply(this,arguments);};}
if(typeof endBattle==='function'){const _eb=endBattle;endBattle=function(){try{if(G)G.throwBonus=false;}catch(e){}return _eb.apply(this,arguments);};}
// ---------- Render-Shim: Kamera orbitet um die Figur (solange 09 CAM nicht selbst liest) ----------
let _Y,_q1,_q2,_pv,_of,_rt,_lk,_sP,_sQ,_sL;
function hook(){if(!R3||!R3.r||R3.r._inHook||!window.THREE)return;const r=R3.r,prev=r.render;r._inHook=1;
 _Y=new THREE.Vector3(0,1,0);_q1=new THREE.Quaternion();_q2=new THREE.Quaternion();_pv=new THREE.Vector3();_of=new THREE.Vector3();_rt=new THREE.Vector3();_lk=new THREE.Vector3();_sP=new THREE.Vector3();_sQ=new THREE.Quaternion();_sL=new THREE.Vector3();INP.vp=new THREE.Matrix4();
 r.render=function(S,cam){let shim=false;
  if(S===R3.scene&&cam===R3.cam){try{if(camOn()){_sP.copy(cam.position);_sQ.copy(cam.quaternion);if(R3.lk)_sL.copy(R3.lk);shim=true;shimApply(cam);}}catch(e){shim=false;console.error('Steuerung Kamera',e);}}
  let out;try{out=prev.apply(r,arguments);}finally{if(shim){cam.position.copy(_sP);cam.quaternion.copy(_sQ);if(R3.lk)R3.lk.copy(_sL);}}
  if(S===R3.scene&&cam===R3.cam)try{postRender(cam);}catch(e){}
  return out;};}
function clearFrac(piv,off){let f=1;const px=Math.round(piv.x),pz=Math.round(piv.z);
 for(let s=.2;s<=1.001;s+=.1){const x=piv.x+off.x*s,z=piv.z+off.z*s,tx=Math.round(x),tz=Math.round(z);if(tx===px&&tz===pz)continue;
  const t=tileAt(cur,tx,tz);if(t===null||SOLID.has(t)){f=Math.max(.32,s-.14);break;}}return f;}
function shimApply(cam){camSync();const C=getCam(),pl=R3.player,a=wrap(C.yaw-R3.yaw),dp=C.pitch-PITCH0;
 if(view==='ego'){if(Math.abs(a)>1e-4){_q1.setFromAxisAngle(_Y,a);cam.quaternion.premultiply(_q1);}if(Math.abs(dp)>1e-4)cam.rotateX(-dp);return;}
 _pv.set(pl.position.x,pl.position.y+1.1,pl.position.z);_of.copy(cam.position).sub(_pv);
 if(Math.abs(a)>1e-4){_q1.setFromAxisAngle(_Y,a);_of.applyQuaternion(_q1);cam.quaternion.premultiply(_q1);if(R3.lk){R3.lk.sub(_pv).applyQuaternion(_q1).add(_pv);}}
 if(Math.abs(dp)>1e-4){const e=Math.atan2(_of.y,Math.hypot(_of.x,_of.z)),e2=clamp(e+dp,.04,1.25);_rt.set(1,0,0).applyQuaternion(cam.quaternion);
  _q2.setAxisAngle?0:0;_q2.setFromAxisAngle(_rt,-(e2-e));_of.applyQuaternion(_q2);cam.quaternion.premultiply(_q2);if(R3.lk){R3.lk.sub(_pv).applyQuaternion(_q2).add(_pv);}}
 const off=Math.abs(a)>.05||Math.abs(dp)>.03,tf=off?clearFrac(_pv,_of):1;INP.camF+=(tf-INP.camF)*(tf<INP.camF?.5:.07);
 cam.position.copy(_pv).addScaledVector(_of,INP.camF);const gy=groundAt(cam.position.x,cam.position.z)+.3;if(cam.position.y<gy)cam.position.y=gy;}
// ---------- Nach dem Rendern: Projektion sichern, Wurf-Overlay zeichnen ----------
function proj(x,y,z){const e=INP.vp.elements,w=e[3]*x+e[7]*y+e[11]*z+e[15];if(w<.05)return null;const rc=INP.rc;
 return[rc.left+((e[0]*x+e[4]*y+e[8]*z+e[12])/w+1)/2*rc.width,rc.top+(1-(e[1]*x+e[5]*y+e[9]*z+e[13])/w)/2*rc.height,rc.height*.5*INP.e5/w];}
function sigColor(){if(INP._sig)return INP._sig;try{const v=getComputedStyle(document.documentElement).getPropertyValue('--sig').trim();INP._sig=v||(typeof PALETTE!=='undefined'?PALETTE.sig.c:'#d81b72');}catch(e){INP._sig='#d81b72';}return INP._sig;}
function fitAim(){const W=innerWidth,H=innerHeight,d=Math.min(2,devicePixelRatio||1);if(aimCv.width!==Math.round(W*d)||aimCv.height!==Math.round(H*d)){aimCv.width=Math.round(W*d);aimCv.height=Math.round(H*d);aimCv.style.width=W+'px';aimCv.style.height=H+'px';}
 actx.setTransform(d,0,0,d,0,0);}
function postRender(cam){INP.vp.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);INP.e5=cam.projectionMatrix.elements[5];
 if(!(AIM.on||AIM.fly)){if(AIM.dirty){AIM.dirty=false;actx.setTransform(1,0,0,1,0,0);actx.clearRect(0,0,aimCv.width,aimCv.height);}return;}
 INP.rc=R3.r.domElement.getBoundingClientRect();fitAim();actx.clearRect(0,0,innerWidth,innerHeight);
 const sig=sigColor(),t=now();
 if(AIM.fly){const f=AIM.fly;let p=(t-f.t0)/f.dur;if(f.r&&ROAM.list.includes(f.r)){f.E=endPoint({r:f.r});}
  if(p>=1){flyDone();actx.clearRect(0,0,innerWidth,innerHeight);return;}
  const e=1-Math.pow(1-p,1.6),x=f.S[0]+(f.E[0]-f.S[0])*e,z=f.S[2]+(f.E[2]-f.S[2])*e,y=f.S[1]+(f.E[1]-f.S[1])*e+f.H*4*e*(1-e),s=proj(x,y,z);
  if(s){const rad=Math.max(8,s[2]*.17);try{capIcon(actx,s[0],s[1],rad,'standard',t,{});}catch(x2){actx.fillStyle=sig;actx.beginPath();actx.arc(s[0],s[1],rad,0,7);actx.fill();}}
  return;}
 const C=getCam(),tg=aimTarget(),h=handPos(),E=endPoint(tg),d=Math.hypot(E[0]-h[0],E[2]-h[2]),H=.7+d*.14,N=22;AIM.lock=tg?tg.r:null;
 const pts=[];for(let i=0;i<=N;i++){const u=i/N,q=proj(h[0]+(E[0]-h[0])*u,h[1]+(E[1]-h[1])*u+H*4*u*(1-u),h[2]+(E[2]-h[2])*u);if(q)pts.push(q);}
 if(pts.length>1){actx.lineJoin='round';actx.lineCap='round';
  actx.strokeStyle='rgba(255,255,255,.75)';actx.lineWidth=6.5;actx.beginPath();pts.forEach((q,i)=>i?actx.lineTo(q[0],q[1]):actx.moveTo(q[0],q[1]));actx.stroke();
  actx.strokeStyle=sig;actx.lineWidth=3.2;actx.setLineDash(tg?[]:[7,7]);actx.beginPath();pts.forEach((q,i)=>i?actx.lineTo(q[0],q[1]):actx.moveTo(q[0],q[1]));actx.stroke();actx.setLineDash([]);}
 const eg=proj(E[0],tg?E[1]-.3:E[1],E[2]);
 if(eg){const rx=Math.max(14,eg[2]*(tg?.62:.42)),ry=rx*.5,pul=redMotion()?0:Math.sin(t/180)*2;
  actx.lineWidth=5.5;actx.strokeStyle='rgba(255,255,255,.85)';actx.beginPath();actx.ellipse(eg[0],eg[1],rx+pul,ry+pul/2,0,0,7);actx.stroke();
  actx.lineWidth=3;actx.strokeStyle=sig;actx.beginPath();actx.ellipse(eg[0],eg[1],rx+pul,ry+pul/2,0,0,7);actx.stroke();
  if(tg){actx.fillStyle=sig;for(let k=0;k<4;k++){const a=k*Math.PI/2+(redMotion()?0:t/700);actx.beginPath();actx.arc(eg[0]+Math.cos(a)*(rx+pul+7),eg[1]+Math.sin(a)*(ry+pul/2+4),3,0,7);actx.fill();}}}
 // Figur dreht sich zum Ziel
 if(!(ST.on&&ST.act)){const want=tg?Math.atan2(-(tg.r.px-P.px),-(tg.r.py-P.py)):C.yaw;P.ang=playerAng()+wrap(want-playerAng())*.18;}}
// Optionen (Steuerung, Empfindlichkeit, Kamera umkehren, Abblenden) stehen in 15-ui.js rSettings.
// ---------- Einbindung in applySet / setView ----------
function apply(){const dyn=SET.ctrl==='dyn'&&view!=='2d';document.body.classList.toggle('in-dyn',dyn);
 root.style.setProperty('--in-d',Math.round(stickR()*2.5)+'px');if(!dyn){stEnd();aimCancel();}}
const _as=applySet;applySet=function(){const r=_as.apply(this,arguments);try{apply();}catch(e){}return r;};
const _sv=setView;setView=function(){const r=_sv.apply(this,arguments);try{apply();camSync(true);}catch(e){}return r;};
// ---------- Hinweis (einmalig) ----------
function showHint(){if(SET.inHint||INP.hint)return;INP.hint=1;$hint.classList.add('on');INP.hintT=setTimeout(hideHint,7000);}
function hideHint(){if(!$hint.classList.contains('on'))return;$hint.classList.remove('on');clearTimeout(INP.hintT);if(!SET.inHint){SET.inHint=1;save();}}
// ---------- Takt ----------
let last=now();
function tick(){requestAnimationFrame(tick);const t=now(),dt=Math.min(100,t-last);last=t;
 try{hook();
  const vis=dynOn()&&(mode==='world'||mode==='dialog');
  if(root.hidden===vis)root.hidden=!vis;
  if(vis){root.dataset.m=mode;
   if(mode!=='world'&&(ST.on||AIM.on||CM.id!=null)){stEnd();aimCancel();CM.id=null;}
   syncBtns();root.classList.toggle('near',mode==='world'&&nearTalk());if(mode==='world')showHint();}
  else{if(ST.on||AIM.on||CM.id!=null){stEnd();aimCancel();CM.id=null;}}
  if(dynOn()){camSync();const C=getCam();
   // Zentrier-Animation
   if(INP.cen){const c=INP.cen,p=clamp((t-c.t0)/c.dur,0,1),e=1-Math.pow(1-p,3);C.yaw=wrap(c.from+wrap(playerAng()-c.from)*e);C.pitch=c.p0+(PITCH0-c.p0)*e;if(p>=1)INP.cen=null;}
   // Tastatur-Kamera
   if(KC.Comma||KC.Period){C.yaw=wrap(C.yaw+((KC.Comma?1:0)-(KC.Period?1:0))*1.8*dt/1000);INP.cen=null;}
   // Alte Eingaben (Pfeiltasten/Tests über STICK): Kamera folgt wie zuvor
   else if(!ST.on&&!AIM.on&&CM.id==null&&!INP.cen&&mode==='world'&&(STICK.x||STICK.y||held)&&!C.applied)C.yaw=wrap(C.yaw+wrap(R3?R3.yaw-C.yaw:0)*(1-Math.exp(-2.4*dt/1000)));
   if(!C.applied&&(C.mode==='explore')&&R3&&R3.player){const p=R3.player.position;C.target.x=p.x;C.target.y=p.y;C.target.z=p.z;if(R3.lk){C.lookAt.x=R3.lk.x;C.lookAt.y=R3.lk.y;C.lookAt.z=R3.lk.z;}if(R3.cd)C.dist=R3.cd;}}
  if(!B&&mode!=='battle'&&G&&G.throwBonus)G.throwBonus=false;
 }catch(e){if(!INP._err){INP._err=1;console.error('Steuerung',e);}}}
apply();requestAnimationFrame(tick);
})();
