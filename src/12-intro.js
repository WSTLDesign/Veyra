// ===== VEYRA – Titel-Opening (ersetzt das Legenden-Intro; Nutzer 10.11. 21:34: „weniger, keine Kreaturen“) – siehe docs/intro-video.md › Titel-Opening =====
// Dämmerung über Veyra, höchstens 5 s: Himmelsbild H1 (sky_lichtlande_abend) als Panorama mit Parallax-Schwenk, Kristall-Kathedrale (horizon_lichtlande) als Silhouette,
// Sonnenstrahlen, aufsteigende Lichtfunken, Titel weich eingeblendet → Blende ins Titelbild. Bewusst KEINE Kreaturen/Figuren. 2D-Canvas (#icv): echte Tiefe durch
// Parallax, kein zweiter WebGL-Kontext, funktioniert auch unter file://. Fehlt ein Bild → prozeduraler Verlauf + Bergschatten.
// Überspringen ab 1 s (Tippen, Taste, Knopf). navigator.webdriver / VEYRA_DEMO: sofort Endbild, Überspringen sofort, schließt nach 2,5 s selbst (VEYRA_OPEN=1 spielt echt).
// Test-Haken: window.VEYRA_OPEN_T = feste Zeit in s (Standbild für Screenshots).
// Loop C (QA O1): Gesamtdauer ≤ 5 s = DUR 4,3 s + 0,65 s Blende (endIntro)
const OP={DUR:4.3,SKIP:1,LOGO:1.5,VS:58,AUTO_END:2.5,sky:null,hz:null,hzT:null,src:{},t0:0,auto:false,ev:{},still:false};
let introOn=false,I3=null;// I3 ≠ null → 11-fx spielt die leise Intro-Klangfläche
const opSm=(a,b,t)=>{t=Math.max(0,Math.min(1,(t-a)/(b-a)));return t*t*(3-2*t);};
function opAuto(){return!!((navigator.webdriver||window.VEYRA_DEMO)&&!window.VEYRA_OPEN);}
// Bilder aus ART_SRC (App: volle Fassung, Artifact: _lo); Kulisse vorab abdunkeln (Dämmerungs-Silhouette)
function opLoad(){const S=window.ART_SRC||{},lowQ=(()=>{try{return typeof perfTier==='function'&&perfTier().name==='low';}catch(e){return false;}})();
 const pick=k=>lowQ?(S[k+'_lo']||S[k]):(S[k]||S[k+'_lo']);
 const ld=(k,cb)=>{const s=pick(k);if(!s||OP.src[k]===s)return;OP.src[k]=s;const im=new Image();im.decoding='async';im.onload=()=>cb(im);im.src=s;};
 ld('sky_lichtlande_abend',im=>{OP.sky=im;if(OP.still)opDraw(0,true);});
 ld('horizon_lichtlande',im=>{OP.hz=im;const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);
  x.globalCompositeOperation='source-atop';const g=x.createLinearGradient(0,0,0,c.height);g.addColorStop(0,'rgba(58,44,96,.62)');g.addColorStop(.8,'rgba(92,70,120,.5)');g.addColorStop(1,'rgba(150,110,140,.25)');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  OP.hzT=c;if(OP.still)opDraw(0,true);});}
// Lichtfunken: feste Startwerte (gleiche Bilder bei gleicher Zeit)
const OP_P=(()=>{let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;return Array.from({length:64},()=>({x:r(),y:r(),v:.04+r()*.07,w:r()*6.28,s:.8+r()*2.2,a:.35+r()*.6}));})();
// Ein Bild zeichnen. T = Sekunden seit Start; still=true → abgedunkeltes Standbild hinter „Tippe, um zu beginnen“
function opDraw(T,still){const cv=$('#icv');if(!cv)return;const dpr=Math.min(1.5,devicePixelRatio||1),W=cv.clientWidth||innerWidth,H=cv.clientHeight||innerHeight;
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 const red=typeof RED!=='undefined'&&RED,k=red?1:opSm(0,OP.DUR,T),ppd=H/OP.VS/(1.06-.06*k);// Grad → Pixel; leichtes Herauszoomen
 const azE=Math.min(130,90+.28*W*OP.VS/H),az=azE+(1-k)*24,el=8-(1-k)*12,hzAz=az+(1-k)*24*.4;// Kamera schwenkt nach links zur Sonne und hebt sich (Endblick: Kathedrale bei ~18 % Bildbreite, auch hochkant); Kulisse zieht schneller (Parallax)
 const Y=e=>H/2-(e-el)*ppd,X=(a,c0)=>W/2+(a-c0)*ppd;
 // Himmel (equirect: 360° × 180°)
 if(OP.sky){const I=OP.sky,iw=I.naturalWidth,ih=I.naturalHeight,hf=Math.min(300,W/ppd),sw=hf*iw/360,sx=(az-hf/2)*iw/360,top=el+H/2/ppd,sy=(90-top)*ih/180,sh=(H/ppd)*ih/180;
  c.drawImage(I,sx,sy,sw,sh,0,0,W,H);}
 else{const g=c.createLinearGradient(0,0,0,H),hy=Math.max(.05,Math.min(.95,Y(0)/H));g.addColorStop(0,'#3e3f72');g.addColorStop(hy*.55,'#7c6e9c');g.addColorStop(hy,'#f0bf98');g.addColorStop(Math.min(1,hy+.04),'#e8b9a0');g.addColorStop(1,'#a88aa0');c.fillStyle=g;c.fillRect(0,0,W,H);}
 // Sonne (Azimut 110°, knapp über dem Horizont): Glühen + Strahlen
 const sx=X(110,az),sy=Y(4),glow=still?.35:.45+.55*opSm(.3,2.4,T),R=Math.max(W,H);
 c.globalCompositeOperation='lighter';let g=c.createRadialGradient(sx,sy,0,sx,sy,R*.55);g.addColorStop(0,`rgba(255,226,170,${.42*glow})`);g.addColorStop(.1,`rgba(255,180,110,${.2*glow})`);g.addColorStop(1,'rgba(255,150,90,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
 if(!still){const ra=opSm(.6,3,T)*(1-opSm(OP.DUR-.6,OP.DUR,T)*.5);for(let i=0;i<14;i++){const j=i>>1,a=-Math.PI/2+(j-3)*.36+Math.sin(T*.22+j*1.7)*.05,w=(i&1?.022:.05)+(j%3)*.012,L=R*(.55+(j%2)*.2),al=(i&1?.07:.035)*(.7+.3*Math.sin(T*.9+j));
  const gr=c.createLinearGradient(sx,sy,sx+Math.cos(a)*L,sy+Math.sin(a)*L);gr.addColorStop(0,`rgba(255,226,180,${al*ra})`);gr.addColorStop(.6,`rgba(255,226,180,${al*ra*.35})`);gr.addColorStop(1,'rgba(255,226,180,0)');c.fillStyle=gr;
  c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+Math.cos(a-w)*L,sy+Math.sin(a-w)*L);c.lineTo(sx+Math.cos(a+w)*L,sy+Math.sin(a+w)*L);c.fill();}}
 c.globalCompositeOperation='source-over';
 // Horizont-Kulisse (tan-Abbildung −0,05…0,45 → Höhe ≈ −2,9°…24,2°), Kristall-Kathedrale bei 90°
 const yT=Y(24.2),yB=Y(-2.9);
 if(OP.hzT){const I=OP.hzT,iw=I.width,hf=Math.min(300,W/ppd),sw=hf*iw/360,sx2=(hzAz-hf/2)*iw/360;c.drawImage(I,sx2,0,sw,I.height,0,yT,W,yB-yT);}
 else{c.fillStyle='rgba(70,56,104,.85)';c.beginPath();c.moveTo(0,yB);for(let x=0;x<=W+8;x+=8){const a=hzAz+(x-W/2)/ppd;c.lineTo(x,Y(4+3.2*Math.abs(Math.sin(a*.11))+2.2*Math.sin(a*.37)));}c.lineTo(W,yB);c.fill();
  const cx=X(90,hzAz),w=ppd*.6;c.fillRect(cx-w,Y(15),w*2,Y(0)-Y(15));c.beginPath();c.moveTo(cx-w,Y(15));c.lineTo(cx,Y(20));c.lineTo(cx+w,Y(15));c.fill();
  c.strokeStyle='rgba(70,56,104,.85)';c.lineWidth=Math.max(2,ppd*.3);c.beginPath();c.ellipse(cx,Y(10),ppd*2.4,ppd*5,0,0,6.3);c.stroke();}
 // Kathedrale leuchtet auf (Kristallring)
 const kx=X(90,hzAz),ky=Y(11),kg=still?.2:opSm(1,2.6,T)*(.75+.25*Math.sin(T*2.4));c.globalCompositeOperation='lighter';g=c.createRadialGradient(kx,ky,0,kx,ky,ppd*9);
 g.addColorStop(0,`rgba(255,244,214,${.5*kg})`);g.addColorStop(.25,`rgba(190,220,255,${.22*kg})`);g.addColorStop(1,'rgba(160,200,255,0)');c.fillStyle=g;c.fillRect(kx-ppd*9,ky-ppd*9,ppd*18,ppd*18);
 // Aufsteigende Lichtfunken
 if(!still)for(const p of OP_P){const yy=((p.y-T*p.v)%1+1)%1,x=(p.x+Math.sin(T*.6+p.w)*.015)*W,y=H*(.15+yy*.9),tw=.6+.4*Math.sin(T*3+p.w*5),a=p.a*tw*opSm(.2,1.4,T)*Math.min(1,yy*3);
  const r=p.s*(H/700+.6);g=c.createRadialGradient(x,y,0,x,y,r*3);g.addColorStop(0,`rgba(255,240,200,${a})`);g.addColorStop(1,'rgba(255,220,160,0)');c.fillStyle=g;c.fillRect(x-r*3,y-r*3,r*6,r*6);}
 c.globalCompositeOperation='source-over';
 // Dämmerung: Start dunkel, Licht steigt; Mitte leicht abgedunkelt für den Titel (Lesbarkeit); Vignette
 const dark=still?.55:.5*(1-opSm(0,2.6,T))+.08;c.fillStyle=`rgba(14,14,40,${dark})`;c.fillRect(0,0,W,H);
 const lg=opSm(OP.LOGO-.3,OP.LOGO+1,T)*(still?0:1);if(lg>0){g=c.createRadialGradient(W/2,H*.47,0,W/2,H*.47,Math.max(W*.42,H*.5));g.addColorStop(0,`rgba(18,14,44,${.42*lg})`);g.addColorStop(1,'rgba(18,14,44,0)');c.fillStyle=g;c.fillRect(0,0,W,H);}
 g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.hypot(W,H)*.62);g.addColorStop(0,'rgba(6,6,20,0)');g.addColorStop(1,'rgba(6,6,20,.55)');c.fillStyle=g;c.fillRect(0,0,W,H);
 const fin=still?0:.85*(1-opSm(0,.7,T));if(fin>0){c.fillStyle=`rgba(5,8,22,${fin})`;c.fillRect(0,0,W,H);}}
// Abgedunkeltes Standbild hinter „Tippe, um zu beginnen“
function opStill(){if(introOn||!$('#intro')||$('#intro').hidden)return;OP.still=true;opLoad();opDraw(0,true);}
function opKey(e){if(!introOn)return;if(OP.auto||(performance.now()-OP.t0)/1000>=OP.SKIP){if(e&&e.type==='keydown'&&e.key==='Tab')return;endIntro();}}
function startIntro(){initAudio();opLoad();OP.still=false;OP.auto=opAuto();OP.ev={};const I=$('#intro');I.classList.remove('out','cine');$('#iPrompt').hidden=true;$('#icv').hidden=false;
 $('#introText').classList.remove('show');$('#introText').textContent='';$('#introLogo').classList.toggle('show',OP.auto);$('#iSkip').hidden=!OP.auto;
 OP.t0=performance.now();introOn=true;I3={opening:true};I.addEventListener('pointerdown',opKey);document.addEventListener('keydown',opKey,true);requestAnimationFrame(introFrame);}
function startIntro3D(){startIntro();}// Name bleibt (Aufrufer in 23/15); das Opening ist bewusst 2D-Parallax
function endIntro(){const I=$('#intro');introOn=false;I3=null;$('#iFlash').style.opacity=0;if(I){I.removeEventListener('pointerdown',opKey);}document.removeEventListener('keydown',opKey,true);
 if(!I||!I.isConnected||I.hidden||I.classList.contains('out'))return;I.classList.add('out');setTimeout(()=>{if(!introOn){I.hidden=true;I.classList.remove('out');}},650);}
function introFrame(now){if(!introOn)return;const ft=window.VEYRA_OPEN_T,real=ft!=null?+ft:(now-OP.t0)/1000,T=ft!=null?+ft:OP.auto?OP.DUR-.4:real;
 opDraw(T,false);const ev=(n,t,f)=>{if(real>=t&&!OP.ev[n]){OP.ev[n]=1;try{f();}catch(e){}}};
 if(!OP.auto){ev('s',.05,()=>{if(SET.sfx&&typeof sweep==='function')sweep(180,520,2.6,'sine',.035);});ev('k',OP.SKIP,()=>{$('#iSkip').hidden=false;});
  ev('l',OP.LOGO,()=>{$('#introLogo').classList.add('show');if(SET.sfx&&typeof sweep==='function')sweep(660,990,1.4,'sine',.025);});}
 if(ft==null&&real>=(OP.auto?OP.AUTO_END:OP.DUR))return endIntro();requestAnimationFrame(introFrame);}
$('#iPrompt').addEventListener('click',()=>startIntro());$('#iSkip').addEventListener('click',()=>{initAudio();endIntro();});
addEventListener('resize',()=>{if(OP.still&&!introOn)opDraw(0,true);});
setTimeout(opStill,0);
