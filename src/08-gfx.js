// ===== VEYRA – Grafik (moderner Look) =====
let SC=resH()/(VH*TS);cv.width=Math.round(VW*TS*SC);cv.height=Math.round(VH*TS*SC);
const lc=document.createElement('canvas');lc.width=cv.width;lc.height=cv.height;const lx=lc.getContext('2d');
let camX=0,camY=0,camMap=null,lights=[],DC=null;
function shade(c,f){const n=parseInt(c.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
 r=Math.max(0,Math.min(255,r*f|0));g=Math.max(0,Math.min(255,g*f|0));b=Math.max(0,Math.min(255,b*f|0));return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function hs(x,y){let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function isPathT(t){return t===','||t==='='||(t&&/[0-9E]/.test(t));}
function rr(c,x,y,w,h,r,col){c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function circ(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
function ell(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();}
function night(){return isNight();}
function drawTile(t,x,y,sx,sy){const c=DC||cx,p=PAL[cur.theme],n=hs(x,y),n2=hs(y+7,x+3);c.save();c.translate(sx,sy);
 const R=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(a,b,w,h);};
 const ground=(col)=>{R(-.05,-.05,16.1,16.1,col||p.g);if(cur.theme!=='cave'){ell(c,3+n*10,4+n2*8,3,1.8,shade(col||p.g,n>.5?1.05:.95));
  if(n<.22&&cur.theme!=='beach'){c.strokeStyle=shade(p.g,.82);c.lineWidth=.7;c.beginPath();c.moveTo(4+n2*6,11);c.lineTo(5+n2*6,8.5);c.moveTo(6+n2*6,11);c.lineTo(6+n2*6,8);c.stroke();}}};
 if(cur.theme==='inside'){
  if(t==='W'){const g=c.createLinearGradient(0,0,0,16);g.addColorStop(0,'#7c6658');g.addColorStop(1,'#5e4b40');R(-.05,-.05,16.1,16.1,g);R(0,11,16,5,'#4a3a31');R(0,11,16,.8,'#8f7a6b');c.restore();return;}
  R(-.05,-.05,16.1,16.1,'#d8c19c');c.fillStyle='rgba(120,80,40,.18)';for(let i=0;i<16;i+=4)c.fillRect(0,i,16,.5);c.fillRect((y%2)*8+3,0,.5,16);
  if(t==='E'){rr(c,2,3,12,10,3,'#b8503a');rr(c,3.5,4.5,9,7,2,'#d9714f');}
  if(t==='C'){const g=c.createLinearGradient(0,2,0,16);g.addColorStop(0,'#c99566');g.addColorStop(.3,'#a8744a');g.addColorStop(1,'#7c5434');rr(c,-.2,2,16.4,14,1,g);R(0,2,16,2.5,'#e0b07e');}
  if(t==='B'){rr(c,1,-1,14,16,1.5,'#6a4630');[3.5,9.5].forEach(v=>{R(2,v+4.5,12,1,'#3e2618');['#d24d4d','#3b78c9','#e8c22e','#4cb85c'].forEach((col,i)=>rr(c,2.5+i*3,v,2.4,4.5,.5,col));});}
  if(t==='K'){ell(c,8,14,7,2,'rgba(0,0,0,.15)');const g=c.createLinearGradient(0,3,0,12);g.addColorStop(0,'#e0a870');g.addColorStop(1,'#a8703f');rr(c,0,3,16,9,2,g);}
  if(t==='R'){ell(c,8,14,5,1.8,'rgba(0,0,0,.18)');rr(c,4,8,8,7,1.5,'#b0674a');circ(c,8,6,5,'#4cb85c');circ(c,6,5,2.5,'#6fd07a');}
  c.restore();return;}
 if(BUILD.includes(t)){const above=tileAt(cur,x,y-1),col=ROOF[t];
  if(above!==t&&!/[0-9]/.test(above||'')){const g=c.createLinearGradient(0,-3,0,16);g.addColorStop(0,shade(col,1.2));g.addColorStop(1,shade(col,.82));
   c.fillStyle=g;c.fillRect(-.05,-3,16.1,16);c.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<12;i+=3.5)c.fillRect(0,i,16,.6);R(0,12.5,16,3.5,shade(col,.5));R(0,12.5,16,.7,shade(col,1.3));}
  else{const g=c.createLinearGradient(0,0,0,16);g.addColorStop(0,'#f6f1e7');g.addColorStop(1,'#ddd3c2');R(-.05,-.05,16.1,16.1,g);R(0,15,16,1,'#b8ab96');
   if(n>.45){const lit=night();rr(c,3.5,3,9,7.5,1.5,'#7c6a58');const wg=c.createLinearGradient(0,4,0,10);
    if(lit){wg.addColorStop(0,'#ffe9a8');wg.addColorStop(1,'#f5b44a');lights.push([sx+8,sy+7,22,'255,200,110']);}else{wg.addColorStop(0,'#bfe3f7');wg.addColorStop(1,'#6fa6cf');}
    rr(c,4.5,4,7,5.5,1,wg);R(7.75,4,.5,5.5,'#7c6a58');if(!lit){c.fillStyle='rgba(255,255,255,.5)';c.fillRect(5,4.5,2,1);}}
   if(t==='P'&&n<=.45){rr(c,4,3,8,8,2,'#fff');R(7,4.2,2,5.6,'#d24d4d');R(5.2,6,5.6,2,'#d24d4d');}
   if(t==='M'&&n<=.45){rr(c,3.5,4,9,6,2,'#3b78c9');circ(c,8,7,1.8,'#fff');}}
  c.restore();return;}
 if(/[0-9]/.test(t)){const above=tileAt(cur,x,y-1);
  if(above==='X'||cur.theme==='cave'){R(-.05,-.05,16.1,16.1,above==='X'?p.tr:p.g);c.fillStyle='#0b0806';c.beginPath();c.moveTo(1,16);c.lineTo(1,7);c.quadraticCurveTo(8,-1,15,7);c.lineTo(15,16);c.fill();c.restore();return;}
  R(-.05,-.05,16.1,16.1,'#ddd3c2');const g=c.createLinearGradient(0,2,0,16);g.addColorStop(0,'#8a5a3a');g.addColorStop(1,'#5c3a24');
  c.fillStyle=g;c.beginPath();c.moveTo(3,16);c.lineTo(3,5);c.quadraticCurveTo(8,1,13,5);c.lineTo(13,16);c.fill();circ(c,10.5,10,.9,'#f2c94c');
  if(night())lights.push([sx+8,sy+12,16,'255,190,100']);c.restore();return;}
 switch(t){
 case '.':case 'c':ground();break;
 case ',':ground();{const L=isPathT(tileAt(cur,x-1,y))?0:1.6,Rt=isPathT(tileAt(cur,x+1,y))?0:1.6,U=isPathT(tileAt(cur,x,y-1))?0:1.6,D=isPathT(tileAt(cur,x,y+1))?0:1.6;
  rr(c,L-.05,U-.05,16.1-L-Rt,16.1-U-D,(L||U||Rt||D)?4:0,p.p);if(n<.3)ell(c,4+n2*8,5+n*8,1.3,.9,shade(p.p,.82));if(n>.8)ell(c,10,11,1,.7,shade(p.p,1.08));}break;
 case '"':ground(shade(p.g,.94));for(let i=0;i<5;i++){const bx=1.5+i*3.2+n*1.5,sw=Math.sin(anim/650+x*.7+i)*1.3,top=3+((i+x)%2)*2.5;
  c.fillStyle=i%2?p.tg:shade(p.tg,1.15);c.beginPath();c.moveTo(bx-1.8,16.2);c.quadraticCurveTo(bx-1,9,bx+sw,top);c.quadraticCurveTo(bx+1,9,bx+1.8,16.2);c.fill();}break;
 case ':':R(-.05,-.05,16.1,16.1,p.tg);ell(c,4+n*8,5+n2*6,2.5,1.5,shade(p.tg,.85));if(n<.18){const a=.5+.5*Math.sin(anim/500+x);circ(c,10,9,1,`rgba(159,228,242,${a})`);lights.push([sx+10,sy+9,8,'140,220,255']);}break;
 case 'F':ground();[[4,5,'#f2d14c'],[11,4,p.f],[7,11,'#e86a8a'],[12.5,12,'#8fb8ff']].forEach(([a,b,col],i)=>{if(hs(x+i,y)<.25)return;for(let k=0;k<5;k++){const an=k*1.257+anim/3000;circ(c,a+Math.cos(an)*1.3,b+Math.sin(an)*1.3,1.1,col);}circ(c,a,b,.8,'#f7b733');});break;
 case 'T':ground();ell(c,8.5,14.5,7,2.6,'rgba(0,0,0,.2)');rr(c,6.6,8,2.8,7,1,'#6b4a2e');
  circ(c,8,6,7.6,p.tr2);circ(c,5.6,5.2,5,p.tr);circ(c,10.6,4.4,5,p.tr);circ(c,8,1.6,4.5,shade(p.tr,1.08));circ(c,6,1.5,2.2,`rgba(255,255,255,${cur.theme==='snow'?.85:.12})`);
  if(cur.theme==='snow'){ell(c,10,0,3,1.5,'#fff');ell(c,4,3,2.5,1.2,'#fff');}break;
 case 'R':ground();ell(c,8.5,14,7,2.2,'rgba(0,0,0,.2)');{const g=c.createRadialGradient(6,7,1,8,9,8);g.addColorStop(0,shade(p.r,1.35));g.addColorStop(1,shade(p.r,.8));
  c.fillStyle=g;c.beginPath();c.moveTo(1.5,13.5);c.quadraticCurveTo(1,5,7,3.5);c.quadraticCurveTo(14,3,14.5,13.5);c.closePath();c.fill();}break;
 case 'X':{const g=c.createLinearGradient(0,0,0,16);g.addColorStop(0,shade(p.tr,1.35));g.addColorStop(.25,p.tr);g.addColorStop(1,p.tr2);R(-.05,-.05,16.1,16.1,g);
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.6;c.beginPath();c.moveTo(2+n*4,4);c.lineTo(6+n*4,9);c.lineTo(4+n*4,14);c.moveTo(11,3+n2*3);c.lineTo(14,8);c.stroke();}break;
 case '~':case '=':{const g=c.createLinearGradient(0,0,0,16);g.addColorStop(0,p.w2);g.addColorStop(1,p.w);R(-.05,-.05,16.1,16.1,g);
  c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=.7;for(let k=0;k<2;k++){const yy=4+k*7+Math.sin(anim/700+x+k)*1.2;c.beginPath();c.moveTo(1+((anim/90+x*5+k*6)%10),yy);c.lineTo(5+((anim/90+x*5+k*6)%10),yy);c.stroke();}
  if(tileAt(cur,x,y-1)!=='~'&&tileAt(cur,x,y-1)!=='='){R(0,0,16,1.6,'rgba(255,255,255,.55)');}
  if(t==='='){const bg=c.createLinearGradient(0,0,16,0);bg.addColorStop(0,'#9c6c3e');bg.addColorStop(.5,'#c08a54');bg.addColorStop(1,'#9c6c3e');R(-.05,1,16.1,14,bg);
   c.fillStyle='rgba(60,30,10,.35)';for(let i=1;i<16;i+=3.5)c.fillRect(0,i,16,.6);R(0,1,16,1,'#6e4626');R(0,14,16,1,'#6e4626');}}break;
 case 'D':ground();circ(c,8,9,7,'#24461f');circ(c,6,7,4.5,'#2f5a2a');circ(c,10.5,6.5,4,'#356a30');c.strokeStyle='#8a5a32';c.lineWidth=1;c.beginPath();for(let i=0;i<9;i++){const a=i/9*Math.PI*2;c.moveTo(8+Math.cos(a)*5,9+Math.sin(a)*5);c.lineTo(8+Math.cos(a)*8.5,9+Math.sin(a)*8.5);}c.stroke();break;
 case 'G':ground();[[4,10,3.4],[10,11,4],[7,6,3],[12,6,2.4]].forEach(([a,b,r2],i)=>{ell(c,a+.5,b+2,r2,1.2,'rgba(0,0,0,.18)');circ(c,a,b,r2,shade(p.r,.85+i*.1));circ(c,a-r2*.3,b-r2*.3,r2*.35,shade(p.r,1.3));});break;
 case 'Q':{const g2=c.createLinearGradient(0,0,0,16);g2.addColorStop(0,p.w2);g2.addColorStop(1,p.w);R(-.05,-.05,16.1,16.1,g2);c.strokeStyle=`rgba(220,250,255,${.45+.25*Math.sin(anim/400)})`;c.lineWidth=.8;c.beginPath();c.moveTo(3,4);c.lineTo(7,8);c.lineTo(5,13);c.moveTo(7,8);c.lineTo(12,6);c.moveTo(9,10);c.lineTo(13,13);c.stroke();}break;
 case 'I':{const g2=c.createLinearGradient(0,0,16,16);g2.addColorStop(0,'#eefbff');g2.addColorStop(1,'#a9def2');R(-.05,-.05,16.1,16.1,g2);c.fillStyle='rgba(255,255,255,.7)';c.fillRect(3,3,5,1);c.fillRect(9,10,4,1);}break;
 default:ground();}
 c.restore();}
// 2D-Oberwelt-Figur (16-px-Kachel). look (optional, Loop B1) = Figuren-Aussehen aus 34-figures.js (figLookOf/heroLook): Jacke, Mantel/Umhang, Frisur, Mütze, Bart, Stab, Signaturfarbe
function drawPerson(x,y,dir,col,walk,hat,t,hair,look){const c=cx;c.save();c.translate(x+8,y+15);
 // Spielfigur (Kennung: Startfarben + Position) liest G.outfit
 let skin='#f3cfae',pants='#26304a',hstyle='kurz';
 if(!look&&col==='#e8623a'&&hat==='#1f8a7a'&&typeof G!=='undefined'&&G&&G.outfit&&typeof P!=='undefined'&&P&&x===P.px*TS)look=typeof heroLook==='function'?heroLook(G.outfit):null;
 if(!look&&col==='#e8623a'&&hat==='#1f8a7a'&&typeof G!=='undefined'&&G&&G.outfit&&typeof P!=='undefined'&&P&&x===P.px*TS){const o=Object.assign({},typeof defaultOutfit==='function'?defaultOutfit():{},G.outfit);
  col=o.top;skin=o.skin;pants=o.pants;hair=o.hairCol;hat=o.cap?o.capCol:null;hstyle=o.hair;}
 let coat=null,coatC=null,sig=null,beard=null,acc=[],sc=1,wide=1;
 if(look){const H=figHats(look);col=look.top||col;skin=look.skin||skin;pants=look.legCol||pants;hair=look.hairCol||hair;hat=H.includes('cap')||H.includes('federhut')?(look.hatCol||shade(col,.62)):H.includes('kapuze')?(look.coatCol||shade(col,.6)):null;
  hstyle={pferd:'zopf',geflochten:'zopf',zopf:'zopf',wuschel:'wuschel',wild:'wuschel',stachel:'wuschel',wolke:'wuschel',lang:'lang',dutt:'dutt'}[look.hair]||'kurz';
  coat=look.coat||null;coatC=look.coatCol||shade(col,.8);sig=look.sig||look.trim||null;beard=look.beard?(look.beardCol||hair):null;acc=look.acc||[];
  sc=look.build==='kind'||look.build==='klein'?.9:1;wide=look.build==='kraeftig'?1.18:1;}
 c.scale(sc*wide,sc);
 ell(c,0,0,5.5,2,'rgba(0,0,0,.22)');const ph=walk?t/75:0,bob=walk?Math.abs(Math.sin(ph))*1.1:0,sw=walk?Math.sin(ph)*1.8:0;
 // Umhang/Mantel hinten (bei Blick nach oben vorne)
 if(coat&&dir!=='down'){c.fillStyle=shade(coatC,.85);c.beginPath();c.moveTo(-5,-12.5-bob);c.lineTo(-6.6,-1.2);c.quadraticCurveTo(0,.4,6.6,-1.2);c.lineTo(5,-12.5-bob);c.fill();}
 if(acc.includes('rucksack')&&dir!=='down'){rr(c,-4.2,-12.6-bob,8.4,7.2,2.2,look.accCol||'#8a5a32');rr(c,-4.6,-13.8-bob,9.2,2.2,1.1,'#e8dcc0');}
 rr(c,-3.4,-5.5+(dir==='left'||dir==='right'?0:sw*.3),2.8,5.5,1.2,pants);rr(c,.6,-5.5-(dir==='left'||dir==='right'?0:sw*.3),2.8,5.5,1.2,pants);
 if(coat&&coat!=='umhang'&&dir==='down'){c.fillStyle=coatC;c.beginPath();c.moveTo(-4.8,-11-bob);c.lineTo(-5.8,-2.4);c.lineTo(-2,-2.4);c.lineTo(-1.2,-10-bob);c.fill();c.beginPath();c.moveTo(4.8,-11-bob);c.lineTo(5.8,-2.4);c.lineTo(2,-2.4);c.lineTo(1.2,-10-bob);c.fill();}
 const g=c.createLinearGradient(0,-12,0,-4);g.addColorStop(0,shade(col,1.15));g.addColorStop(1,shade(col,.8));rr(c,-4.8,-12.5-bob,9.6,8,3.2,g);
 if(sig){c.fillStyle=sig;c.fillRect(-4.2,-5.6-bob,8.4,1);}
 if(look&&look.scarf){rr(c,-3.6,-12.9-bob,7.2,2.2,1,look.scarf);}
 if(look&&(look.collar==='fell')){rr(c,-5.2,-13.4-bob,10.4,2.6,1.3,'#efe4cf');}
 if(acc.includes('rucksack')&&dir==='down'){c.fillStyle=shade(look.accCol||'#8a5a32',.8);c.fillRect(-3.6,-12-bob,1,6);c.fillRect(2.6,-12-bob,1,6);}
 if(coat==='umhang'&&dir==='down'){c.fillStyle=coatC;c.beginPath();c.moveTo(-5.4,-12.6-bob);c.lineTo(-7,-2);c.lineTo(-4.6,-2.4);c.lineTo(-3.6,-11-bob);c.fill();c.beginPath();c.moveTo(5.4,-12.6-bob);c.lineTo(7,-2);c.lineTo(4.6,-2.4);c.lineTo(3.6,-11-bob);c.fill();}
 circ(c,-5,-8.5-bob+sw*.3,1.5,skin);circ(c,5,-8.5-bob-sw*.3,1.5,skin);
 if(acc.includes('stab')){c.strokeStyle='#7a5434';c.lineWidth=.9;c.beginPath();c.moveTo(6,-1);c.lineTo(6,-21-bob);c.stroke();circ(c,6,-21.5-bob,1.4,look.accCol||'#ffd166');}
 const hy=-17-bob;circ(c,0,hy,5.6,skin);const hc=hair||'#4a3426';
 if(!hat&&(hstyle==='lang'||hstyle==='zopf')&&dir!=='down'){c.fillStyle=hc;rr(c,-5.4,hy-2,10.8,hstyle==='lang'?9:4,2,hc);if(hstyle==='zopf')circ(c,dir==='left'?3.5:dir==='right'?-3.5:0,hy+4,1.8,hc);}
 if(look&&look.hair==='pferd'&&dir!=='up'){c.fillStyle=hc;c.beginPath();c.ellipse(dir==='left'?4.6:dir==='right'?-4.6:4.8,hy+1.5+Math.sin(t/300)*.3,1.7,4,dir==='left'?-.4:.4,0,7);c.fill();}
 c.fillStyle=hat||hc;c.beginPath();if(dir==='up')c.arc(0,hy,5.9,0,7);else c.arc(0,hy-.6,5.9,Math.PI*1.02,Math.PI*1.98);c.fill();
 if(!hat){if(hstyle==='wuschel'){circ(c,-4.6,hy-3,2,hc);circ(c,4.6,hy-3,2,hc);circ(c,0,hy-6,2.2,hc);}if(hstyle==='dutt')circ(c,0,hy-6.8,2.3,hc);}
 if(look&&look.hairHi&&dir!=='up'){c.fillStyle=look.hairHi;c.fillRect(-2.6,hy-5.4,1.2,2.6);c.fillRect(2.2,hy-5,1.1,2.2);}
 if(hat){c.fillStyle=shade(hat,.7);const bx=dir==='left'?-6.5:dir==='right'?1.5:-4;if(dir!=='up')rr(c,bx,hy-1.6,dir==='down'?8:5,1.5,.7,shade(hat,.7));}
 if(look&&figHats(look).includes('brille')&&dir!=='up'){circ(c,-2,hy-4.2,1.3,'#9fe4ff');circ(c,2,hy-4.2,1.3,'#9fe4ff');}
 if(dir!=='up'){c.fillStyle='#1d1a24';const ex=dir==='left'?[-2.5]:dir==='right'?[2.5]:[-2,2];ex.forEach(e=>{c.beginPath();c.ellipse(e,hy+.8,.75,1.05,0,0,7);c.fill();});
  c.fillStyle='rgba(232,120,120,.35)';if(dir==='down'){circ(c,-3.4,hy+2.3,.9,c.fillStyle);circ(c,3.4,hy+2.3,.9,c.fillStyle);}
  if(beard&&dir==='down'){c.fillStyle=beard;c.beginPath();c.ellipse(0,hy+3.6,look.beard==='vollbart'?4.2:2.2,look.beard==='vollbart'?3:1.6,0,0,7);c.fill();}}
 c.restore();}
// Farbmischung #rrggbb (eigene Kopie, unabhängig von 12-intro)
function figLerp(a,b,t){const A=parseInt(a.slice(1),16),Bv=parseInt(b.slice(1),16);t=Math.max(0,Math.min(1,t));const m=(s)=>Math.round(((A>>s)&255)+((((Bv>>s)&255)-((A>>s)&255))*t));return'#'+((1<<24)|(m(16)<<16)|(m(8)<<8)|m(0)).toString(16).slice(1);}
// Kopfbedeckungen/Haarschmuck einer Figur als Liste
function figHats(L){return!L||!L.hat?[]:Array.isArray(L.hat)?L.hat:[L.hat];}

// ---------- Figuren (Loop B1): prozedurale Anime-Figur, Frontansicht, Einheitenraum Höhe 100, Ursprung = Füße ----------
// look: {build kind|klein|teen|adult|alt|kraeftig, sex m|w, skin, eye, hair (wuschel|stachel|wild|pferd|zopf|dutt|lang|glatt|kurz|wolke|geflochten|schopf), hairCol, hairHi,
//  beard (vollbart|kinnbart|schnurr|kurzbart), beardCol, top, top2, trim, belt, coat (mantel|kittel|umhang), coatCol, collar (fell|kragen|kapuze), scarf, legs (hose|cargo|shorts|rock|robe), legCol, socks, boots,
//  hat (cap|brille|stirnreif|federhut|kapuze|blume|muschel|mondsichel|feder|sonnenkristall|blattschmuck | Liste), hatCol, glasses (rund), face (sommersprossen|narbe|ohrringe | Liste), acc (rucksack|tasche|stab|laterne|bogen|buch|amulett|kugel|fernglas|kapsel|kraeuter | Liste), accCol, emblem, emblemCol, pose (verschraenkt|hueften|winken|zeigen), sig}
// opt: {expr, talk, noShadow, still, blink}
const FIG_BUILD={kind:{hr:15,hy:-79,sh:12.5,tt:-64,w:-39,hp:11,lw:7,aw:5.4,eye:1.12},klein:{hr:16,hy:-74,sh:11,tt:-58,w:-36,hp:10,lw:6.6,aw:5,eye:1.2},teen:{hr:13.6,hy:-84,sh:13.4,tt:-70,w:-42,hp:11.5,lw:7,aw:5.5,eye:1.05},
 adult:{hr:12.6,hy:-87,sh:14.2,tt:-74,w:-44,hp:12,lw:7.2,aw:5.7,eye:1},alt:{hr:13,hy:-83,sh:14.2,tt:-70,w:-42,hp:13,lw:7.4,aw:5.8,eye:.95},kraeftig:{hr:12.8,hy:-87,sh:17.6,tt:-74,w:-44,hp:14,lw:8.6,aw:7,eye:.95}};
const FIG_EXPR={neutral:'neutral',freudig:'freudig',laechelnd:'laechelnd',zaertlich:'zaertlich',entschlossen:'entschlossen',ueberrascht:'ueberrascht',nachdenklich:'nachdenklich',traurig:'traurig',
 stolz:'stolz',zufrieden:'stolz',begeistert:'freudig',ernst:'ernst'};
function figEmblem(c,kind,x,y,r,col){c.save();c.translate(x,y);c.fillStyle=col||'#fff';c.strokeStyle=col||'#fff';c.lineWidth=r*.28;c.beginPath();
 switch(kind){
  case'blatt':c.moveTo(-r*.9,r*.7);c.quadraticCurveTo(-r*.6,-r*.9,r*.9,-r*.8);c.quadraticCurveTo(r*.7,r*.7,-r*.9,r*.7);c.fill();break;
  case'flamme':c.moveTo(0,-r);c.quadraticCurveTo(r*.9,-r*.1,r*.55,r*.6);c.quadraticCurveTo(0,r*1.05,-r*.55,r*.6);c.quadraticCurveTo(-r*.9,-r*.1,0,-r);c.fill();break;
  case'welle':c.moveTo(-r,r*.2);c.quadraticCurveTo(-r*.5,-r*.6,0,r*.1);c.quadraticCurveTo(r*.5,r*.7,r,-r*.2);c.stroke();break;
  case'berg':c.moveTo(-r,r*.7);c.lineTo(-r*.25,-r*.7);c.lineTo(r*.2,0);c.lineTo(r*.5,-r*.4);c.lineTo(r,r*.7);c.closePath();c.fill();break;
  case'wind':c.arc(0,0,r*.75,Math.PI*.2,Math.PI*1.7);c.arc(r*.1,-r*.1,r*.35,Math.PI*1.7,Math.PI*.7,true);c.stroke();break;
  case'sonne':c.arc(0,0,r*.45,0,7);c.fill();for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*r*.62,Math.sin(a)*r*.62);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();}break;
  case'mond':c.arc(0,0,r*.85,Math.PI*.3,Math.PI*1.7);c.arc(r*.35,0,r*.62,Math.PI*1.6,Math.PI*.4,true);c.fill();break;
  case'flocke':for(let i=0;i<3;i++){const a=i*Math.PI/3;c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(-Math.cos(a)*r,-Math.sin(a)*r);}c.stroke();break;
  case'kreuzblatt':c.fillRect(-r*.22,-r*.85,r*.44,r*1.7);c.fillRect(-r*.85,-r*.22,r*1.7,r*.44);c.beginPath();c.fillStyle='#7ccf7a';c.ellipse(r*.55,-r*.55,r*.38,r*.2,-.8,0,7);c.fill();break;
  case'dorn':c.moveTo(0,-r);c.lineTo(r*.45,0);c.lineTo(0,r);c.lineTo(-r*.45,0);c.closePath();c.fill();c.beginPath();c.lineWidth=r*.18;c.ellipse(0,0,r,r*.38,0,0,7);c.stroke();break;
  case'stern':for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.42:r;c.lineTo(Math.cos(a)*q,Math.sin(a)*q);}c.closePath();c.fill();break;
  case'turm':c.moveTo(-r*.45,r*.8);c.lineTo(-r*.3,-r*.4);c.lineTo(0,-r);c.lineTo(r*.3,-r*.4);c.lineTo(r*.45,r*.8);c.closePath();c.fill();break;
  default:c.arc(0,0,r*.6,0,7);c.fill();}
 c.restore();}
function drawFigure(c,x,y,s,L,t,opt){L=L||{};opt=opt||{};t=t||0;const B=FIG_BUILD[L.build]||FIG_BUILD.adult,k=s/100,ex=FIG_EXPR[opt.expr]||'neutral';
 const bob=opt.still?0:Math.sin(t/620)*.8,blink=!opt.still&&opt.blink!==false&&(t%4300)<110&&!['stolz','zaertlich'].includes(ex);
 const has=(f,v)=>{const q=L[f];return Array.isArray(q)?q.includes(v):q===v;},hats=figHats(L);
 c.save();c.translate(x,y);c.scale(k,k);c.lineJoin='round';c.lineCap='round';
 const OL='rgba(30,22,40,.82)',LW=1.2,sk=L.skin||'#f3cfae',hc=L.hairCol||'#5a3a24',top=L.top||'#4c9a5c',top2=L.top2||'#f4efe2',trim=L.trim||shade(top,.68),leg=L.legCol||'#5a4632',boot=L.boots||'#4a3426',coatC=L.coatCol||top,acc=Array.isArray(L.acc)?L.acc:L.acc?[L.acc]:[],accC=L.accCol||'#8a5a32';
 const{hr,sh,tt,w,hp,lw,aw}=B,hy=B.hy-bob,T=tt-bob;
 // Zwei-Ton-Cel: Grundfarbe, Schattenseite rechts (Licht von links oben), dünne Kontur
 const cel=(path,col,lx,noLine,f)=>{c.save();path();c.fillStyle=col;c.fill();if(lx<500){c.clip();c.fillStyle=shade(col,f||.8);c.fillRect(lx,-170,240,240);}c.restore();if(!noLine){path();c.strokeStyle=OL;c.lineWidth=LW;c.stroke();}};
 const E=(a,b,rx,ry,col,rot)=>{c.fillStyle=col;c.beginPath();c.ellipse(a,b,rx,ry,rot||0,0,7);c.fill();};
 const RR=(a,b,ww,h,r)=>()=>{c.beginPath();c.roundRect(a,b,ww,h,r);};
 if(!opt.noShadow)E(0,0,24,5,'rgba(10,14,30,.26)');
 // ---- hinten: Umhang, Mantelrücken, Rucksack, Bogen, Kapuze, Hinterhaar
 if(L.coat==='umhang')cel(()=>{c.beginPath();c.moveTo(-sh-1,T+3);c.quadraticCurveTo(-sh-9,-30,-sh-11,-5);c.quadraticCurveTo(0,-1,sh+11,-5);c.quadraticCurveTo(sh+9,-30,sh+1,T+3);c.closePath();},shade(coatC,.82),2);
 if(L.coat==='mantel'||L.coat==='kittel')cel(()=>{c.beginPath();c.moveTo(-sh,T+4);c.lineTo(-hp-7,-15);c.quadraticCurveTo(0,-11,hp+7,-15);c.lineTo(sh,T+4);c.closePath();},shade(coatC,.72),3,true);
 if(acc.includes('bogen')){c.strokeStyle='#7a5032';c.lineWidth=2.4;c.beginPath();c.arc(-4,T+20,sh+12,-Math.PI*.42,Math.PI*.36);c.stroke();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(-4+Math.cos(-Math.PI*.42)*(sh+12),T+20+Math.sin(-Math.PI*.42)*(sh+12));c.lineTo(-4+Math.cos(Math.PI*.36)*(sh+12),T+20+Math.sin(Math.PI*.36)*(sh+12));c.stroke();}
 if(acc.includes('rucksack')){cel(RR(-sh-4.5,T-3,2*sh+9,w-T+8,6),accC,2);cel(RR(-sh-7,T-9,2*sh+14,8,4),L.rollCol||'#d9cfb4',4);c.strokeStyle='rgba(60,40,20,.5)';c.lineWidth=.8;c.beginPath();c.moveTo(-sh-4,T-5);c.lineTo(sh+4,T-5);c.stroke();}
 if(hats.includes('kapuze')||L.collar==='kapuze')cel(()=>{c.beginPath();c.ellipse(0,hy+1,hr*1.32,hr*1.3,0,0,7);},shade(L.hoodCol||coatC,.75),hr*.5);
 figHairBack(c,L,hy,hr,T,t,cel,OL,LW);
 // ---- Beine, Stiefel
 const lx1=-hp+lw*.15,lx2=hp-lw*1.15,legTop=w-2;
 if(L.legs==='shorts'||L.legs==='rock'){
  for(const a of[lx1,lx2])cel(RR(a+.6,legTop+8,lw-1.2,-6-legTop-8+2,3),sk,a+lw*.55);
  if(L.socks)for(const a of[lx1,lx2])cel(RR(a+.4,-24,lw-.8,18,2.5),L.socks,a+lw*.55);
  if(L.legs==='shorts')for(const a of[lx1,lx2])cel(RR(a-1,legTop,lw+2,13,3),leg,a+lw*.6);
  else cel(()=>{c.beginPath();c.moveTo(-hp,legTop);c.lineTo(-hp-6,legTop+19);c.quadraticCurveTo(0,legTop+22,hp+6,legTop+19);c.lineTo(hp,legTop);c.closePath();},leg,3);}
 else if(L.legs==='robe')cel(()=>{c.beginPath();c.moveTo(-hp,legTop);c.lineTo(-hp-5,-6);c.quadraticCurveTo(0,-3,hp+5,-6);c.lineTo(hp,legTop);c.closePath();},leg,3);
 else{const cw=L.legs==='cargo'?1.6:0;for(const a of[lx1,lx2])cel(RR(a-cw/2,legTop,lw+cw,-6-legTop+1,3.4),leg,a+lw*.6);
  if(L.legs==='cargo')for(const a of[lx1,lx2]){cel(RR(a-1.2,legTop+14,lw*.75,6,1.4),shade(leg,.86),a+3);}}
 for(const[a,d]of[[lx1,-1],[lx2,1]])cel(()=>{c.beginPath();c.moveTo(a-1,-12);c.lineTo(a+lw+1,-12);c.lineTo(a+lw+1.2+(d>0?2.5:0),-.8);c.quadraticCurveTo(a+lw*.5,.8,a-1.2-(d<0?2.5:0),-.8);c.closePath();},boot,a+lw*.6);
 if(L.bootTrim)for(const a of[lx1,lx2])cel(RR(a-1.2,-13.5,lw+2.4,3.2,1.4),L.bootTrim,a+lw);
 if(L.laces)for(const a of[lx1,lx2]){c.strokeStyle=L.laces;c.lineWidth=.8;c.beginPath();c.moveTo(a+1.4,-9);c.lineTo(a+lw-1.4,-7.6);c.moveTo(a+1.4,-6.4);c.lineTo(a+lw-1.4,-5);c.stroke();}
 // ---- Mantel vorne (über den Beinen, vorne offen)
 const coatFront=()=>{if(L.coat!=='mantel'&&L.coat!=='kittel')return;for(const d of[-1,1])cel(()=>{c.beginPath();c.moveTo(d*sh,T+3);c.lineTo(d*(hp+7.5),-15);c.lineTo(d*(hp-1.5),-16);c.lineTo(d*3,T+12);c.closePath();},coatC,d>0?d*(hp-2):-5);
  if(L.coatTrim){c.strokeStyle=L.coatTrim;c.lineWidth=1.4;c.beginPath();c.moveTo(-3,T+12);c.lineTo(-hp+1.5,-16);c.moveTo(3,T+12);c.lineTo(hp-1.5,-16);c.stroke();}};
 // ---- Oberkörper
 const torso=()=>{c.beginPath();c.moveTo(-sh+1,T+1);c.quadraticCurveTo(-sh-1.5,T+4,-sh,T+9);c.quadraticCurveTo(-hp-1.5,w-6,-hp-.5,w+2);c.lineTo(hp+.5,w+2);c.quadraticCurveTo(hp+1.5,w-6,sh,T+9);c.quadraticCurveTo(sh+1.5,T+4,sh-1,T+1);c.quadraticCurveTo(0,T-2.5,-sh+1,T+1);c.closePath();};
 cel(torso,top,3);
 // Innenteil (offene Jacke, V), Saum, Gürtel
 if(!L.closed){cel(()=>{c.beginPath();c.moveTo(-4.6,T-.4);c.lineTo(0,T+15);c.lineTo(4.6,T-.4);c.closePath();},top2,1,true);c.strokeStyle=OL;c.lineWidth=.7;c.beginPath();c.moveTo(0,T+15);c.lineTo(0,w+1);c.stroke();}
 if(L.sig){c.strokeStyle=L.sig;c.lineWidth=1.1;c.beginPath();c.moveTo(-4.1,T+.8);c.lineTo(-.4,T+13.4);c.stroke();}
 cel(RR(-hp-1,w-2.8,2*hp+2,4.4,2),trim,hp*.4);
 if(L.vest)for(const d of[-1,1])cel(()=>{c.beginPath();c.moveTo(d*(sh-1.5),T+1.5);c.quadraticCurveTo(d*(sh+.5),T+10,d*(hp+.5),w+1);c.lineTo(d*3.2,w+1);c.lineTo(d*3.6,T+6);c.closePath();},L.vest,d>0?3:999);
 if(L.belt){cel(RR(-hp-.6,w-5.8,2*hp+1.2,3.4,1.2),L.belt,3);E(0,w-4.1,1.8,1.6,'#e6c35c');}
 coatFront();
 if(L.collar==='fell'){for(let i=0;i<7;i++){const a=Math.PI*(1.05+i*.15);E(Math.cos(a)*(sh-1)*1.05,T+3+Math.sin(a)*-4.5+Math.abs(i-3)*1.2,4.2,3.4,i%2?'#efe2c8':'#e2d2b0');}c.strokeStyle='rgba(120,96,60,.35)';c.lineWidth=.6;c.beginPath();c.moveTo(-sh,T+4);c.quadraticCurveTo(0,T+9,sh,T+4);c.stroke();}
 if(L.collar==='kragen'){for(const d of[-1,1])cel(()=>{c.beginPath();c.moveTo(d*2,T);c.lineTo(d*(sh-2),T-1.5);c.lineTo(d*7,T+8);c.closePath();},shade(coatC||top,1.1),d>0?3:999);}
 if(L.scarf){cel(()=>{c.beginPath();c.ellipse(0,T+1.4,7.8,3.6,0,0,7);},L.scarf,2);cel(RR(-6.5,T+2,4.6,13,2),shade(L.scarf,.92),-3);}
 if(L.emblem)figEmblem(c,L.emblem,sh*.48,T+9,2.8,L.emblemCol||'#fff');
 if(acc.includes('amulett')){c.strokeStyle='#c99a3a';c.lineWidth=.7;c.beginPath();c.moveTo(-3.5,T);c.lineTo(0,T+11);c.lineTo(3.5,T);c.stroke();cel(()=>{c.beginPath();c.moveTo(0,T+9);c.lineTo(2.4,T+12);c.lineTo(0,T+15);c.lineTo(-2.4,T+12);c.closePath();},L.amuCol||accC,0);E(-.6,T+11,.7,.9,'rgba(255,255,255,.75)');}
 if(acc.includes('tasche')){c.strokeStyle=shade(accC,.7);c.lineWidth=1.6;c.beginPath();c.moveTo(-sh+2,T+1);c.lineTo(hp+1,w-3);c.stroke();cel(RR(hp-4,w-6,10,9,2.4),accC,hp+1);if(L.bagSym)figEmblem(c,L.bagSym,hp+1,w-1.6,2.2,L.bagSymCol||'#ffe08a');}
 if(acc.includes('kraeuter')){for(let i=0;i<3;i++)cel(RR(-hp-1+i*2.6,w-1,2.2,5,1),['#6cc86a','#f29ab8','#9fd8f2'][i],-hp+i*2.6+1);}
 // ---- Arme
 figArms(c,L,B,T,w,t,cel,E,OL,LW,top,sk,acc,accC);
 // ---- Hals, Kopf
 cel(RR(-3.2,hy+hr*.78,6.4,T-hy-hr*.78+2,2.4),shade(sk,.92),1,true);
 if(L.collar==='kragenhoch')cel(RR(-6,T-4,12,6,3),coatC,2);
 const face=()=>{c.beginPath();c.moveTo(-hr,hy-hr*.18);c.bezierCurveTo(-hr*1.02,hy+hr*.5,-hr*.5,hy+hr*.98,0,hy+hr*1.04);c.bezierCurveTo(hr*.5,hy+hr*.98,hr*1.02,hy+hr*.5,hr,hy-hr*.18);c.arc(0,hy-hr*.18,hr,0,Math.PI,true);c.closePath();};
 E(-hr*.98,hy+hr*.22,hr*.17,hr*.24,shade(sk,.9));E(hr*.98,hy+hr*.22,hr*.17,hr*.24,shade(sk,.86));
 cel(face,sk,hr*.48,false,.9);
 if(has('face','ohrringe')){E(-hr*.98,hy+hr*.55,hr*.09,hr*.09,'#f2c94c');E(hr*.98,hy+hr*.55,hr*.09,hr*.09,'#f2c94c');}
 figFace(c,L,hy,hr,B.eye,ex,blink,opt.talk?Math.sin(t/75)>0:false,E,OL);
 figHairFront(c,L,hy,hr,T,t,cel,E,OL,LW,hats);
 c.restore();}
// Hinterhaar: lange Haare, Pferdeschwanz, Zopf-Rücken, Dutt
function figHairBack(c,L,hy,hr,T,t,cel,OL,LW){const hc=L.hairCol||'#5a3a24',st=L.hair,sw=Math.sin(t/700)*1.2;
 if(st==='lang'||st==='geflochten')cel(()=>{c.beginPath();c.moveTo(-hr*1.1,hy-hr*.4);c.quadraticCurveTo(-hr*1.35,T+18,-hr*1.1,T+(st==='lang'?30:22));c.lineTo(-hr*.4,T+(st==='lang'?27:20));c.lineTo(hr*.4,T+(st==='lang'?28:20));c.lineTo(hr*1.1,T+(st==='lang'?31:22));c.quadraticCurveTo(hr*1.35,T+18,hr*1.1,hy-hr*.4);c.closePath();},shade(hc,.86),hr*.3);
 if(st==='pferd'){cel(()=>{c.beginPath();c.moveTo(hr*.1,hy-hr*1.05);c.bezierCurveTo(hr*1.7+sw,hy-hr*1.3,hr*2.1+sw,hy+hr*.6,hr*1.25+sw*1.5,T+20);c.bezierCurveTo(hr*1.55+sw,hy+hr*1.2,hr*1.05,hy-hr*.2,hr*.55,hy-hr*.62);c.closePath();},hc,hr*1.3);
  c.fillStyle=L.tieCol||'#3d8fe0';c.beginPath();c.ellipse(hr*.62,hy-hr*.98,hr*.2,hr*.14,.6,0,7);c.fill();
  if(L.hairHi){c.strokeStyle=L.hairHi;c.lineWidth=hr*.13;c.beginPath();c.moveTo(hr*.95,hy-hr*.85);c.bezierCurveTo(hr*1.6+sw,hy-hr*.4,hr*1.6+sw,hy+hr*.6,hr*1.35+sw*1.4,T+14);c.stroke();}}
 if(st==='dutt'){cel(()=>{c.beginPath();c.ellipse(0,hy-hr*1.08,hr*.5,hr*.42,0,0,7);},hc,hr*.15);}
 if(st==='wuschel'||st==='wolke'||st==='wild'||st==='stachel')cel(()=>{c.beginPath();c.ellipse(0,hy-hr*.12,hr*1.16,hr*1.1,0,0,7);},shade(hc,.85),hr*.4,true);
 if(st==='glatt')cel(()=>{c.beginPath();c.moveTo(-hr*1.08,hy-hr*.3);c.lineTo(-hr*1.05,hy+hr*.75);c.lineTo(hr*1.05,hy+hr*.75);c.lineTo(hr*1.08,hy-hr*.3);c.closePath();},shade(hc,.85),hr*.4,true);}
// Arme je Pose (Ärmel in Jacken-/Mantelfarbe, Hände, gehaltene Requisiten)
function figArms(c,L,B,T,w,t,cel,E,OL,LW,top,sk,acc,accC){const{sh,aw}=B,slv=L.coat==='mantel'||L.coat==='kittel'?(L.coatCol||top):top,hand=L.gloves||sk,pose=L.pose,arm=(x0,y0,x1,y1,col)=>{c.save();const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy);c.translate(x0,y0);c.rotate(Math.atan2(dy,dx)-Math.PI/2);cel(()=>{c.beginPath();c.roundRect(-aw/2,-1,aw,len+2,aw/2);},col,aw*.05);c.restore();};
 const sw=Math.sin(t/620)*1.2,cuff=(x,y)=>{if(L.cuffCol)E(x,y,aw*.62,aw*.32,L.cuffCol);};
 if(pose==='verschraenkt'){arm(-sh,T+4,-sh+1,T+16,slv);arm(sh,T+4,sh-1,T+16,slv);cel(()=>{c.beginPath();c.roundRect(-sh+1,T+12,2*sh-2,aw+1,aw/2);},shade(slv,.95),sh*.3);
  cel(()=>{c.beginPath();c.roundRect(-sh+3,T+14.5,2*sh-6,aw,aw/2);},slv,sh*.2);E(sh-4,T+14,aw*.55,aw*.5,hand);E(-sh+4,T+17,aw*.55,aw*.5,hand);return;}
 const Lx=-sh-1.5,Rx=sh+1.5,ey=w+1;
 // linker Arm (Bildseite links)
 if(pose==='hueften'){arm(-sh,T+4,-sh-7,T+16,slv);arm(-sh-7,T+16,-B.hp-.5,w-1,slv);E(-B.hp-.5,w-1,aw*.6,aw*.55,hand);}
 else if(pose==='winken'){const a=Math.sin(t/180)*.25;arm(-sh,T+4,-sh-8,T-8,slv);c.save();c.translate(-sh-8,T-8);c.rotate(a);arm(0,0,-1,-13,slv);E(-1,-15,aw*.62,aw*.62,hand);c.restore();}
 else{arm(-sh,T+4,Lx-1.5,ey+sw*.3,slv);cuff(Lx-1.5,ey-3);E(Lx-1.5,ey+1.5+sw*.3,aw*.6,aw*.6,hand);}
 // rechter Arm (Bildseite rechts) – hält Stab, Laterne, Buch, Kugel, Kapsel …
 const hold=acc.find(a=>['stab','laterne','buch','kugel','kapsel','fernglas'].includes(a));
 if(pose==='hueften'){arm(sh,T+4,sh+7,T+16,slv);arm(sh+7,T+16,B.hp+.5,w-1,slv);E(B.hp+.5,w-1,aw*.6,aw*.55,hand);}
 else if(pose==='zeigen'){arm(sh,T+4,sh+12,T+1,slv);E(sh+14,T+.5,aw*.6,aw*.55,hand);}
 else if(hold==='stab'){const hx=Rx+4,hyy=w-8;c.strokeStyle='#7a5434';c.lineWidth=2.2;c.beginPath();c.moveTo(hx,-1);c.lineTo(hx,B.hy-B.hr-4);c.stroke();c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.6;c.beginPath();c.moveTo(hx-.5,-2);c.lineTo(hx-.5,B.hy-B.hr-3);c.stroke();
  const gy=B.hy-B.hr-8,gl=c.createRadialGradient(hx,gy,0,hx,gy,7);gl.addColorStop(0,'rgba(255,240,180,.75)');gl.addColorStop(1,'rgba(255,240,180,0)');c.fillStyle=gl;c.fillRect(hx-8,gy-8,16,16);
  cel(()=>{c.beginPath();c.moveTo(hx,gy-4.5);c.lineTo(hx+2.8,gy);c.lineTo(hx,gy+4.5);c.lineTo(hx-2.8,gy);c.closePath();},L.stabCol||accC,hx);arm(sh,T+4,hx,hyy,slv);E(hx,hyy,aw*.62,aw*.6,hand);}
 else if(hold==='buch'){arm(sh,T+4,sh-2,T+20,slv);c.save();c.translate(sh-5,T+20);c.rotate(-.2);cel(()=>{c.beginPath();c.roundRect(-6,-5,12,10,1.4);},L.bookCol||'#4c8a4c',4);c.fillStyle='#f6eed8';c.fillRect(-5.4,-4.2,1.6,8.4);if(L.emblem)figEmblem(c,'blatt',1,0,2.4,'#e6c35c');c.restore();E(sh-2,T+21,aw*.6,aw*.55,hand);}
 else if(hold==='laterne'){arm(sh,T+4,Rx+2,ey-2,slv);const lx=Rx+2,ly=ey+5;c.strokeStyle='#5a4632';c.lineWidth=.8;c.beginPath();c.moveTo(lx,ey);c.lineTo(lx,ly-3);c.stroke();const gl=c.createRadialGradient(lx,ly+2,0,lx,ly+2,10);gl.addColorStop(0,L.lampGlow||'rgba(255,214,120,.7)');gl.addColorStop(1,'rgba(255,214,120,0)');c.fillStyle=gl;c.fillRect(lx-10,ly-8,20,20);
  cel(()=>{c.beginPath();c.roundRect(lx-3,ly-3,6,8,2);},L.lampCol||'#f6d77a',lx+1);c.strokeStyle='#5a4632';c.lineWidth=.8;c.strokeRect(lx-3,ly-3,6,8);E(Rx+2,ey-1,aw*.6,aw*.6,hand);}
 else if(hold==='kugel'){arm(sh,T+4,sh+3,T+19,slv);const ox=sh+4,oy=T+15,g=c.createRadialGradient(ox-1.5,oy-1.5,.5,ox,oy,5.2);g.addColorStop(0,'#ffd0d6');g.addColorStop(.35,L.orbCol||'#e0303e');g.addColorStop(1,'#3a0d18');c.fillStyle=g;c.beginPath();c.arc(ox,oy,5,0,7);c.fill();c.strokeStyle=OL;c.lineWidth=LW;c.stroke();E(ox-1.6,oy-1.8,1.2,.8,'rgba(255,255,255,.8)');E(sh+3,T+20.5,aw*.6,aw*.55,hand);}
 else if(hold==='kapsel'){arm(sh,T+4,sh+4,T+15,slv);if(typeof drawCapsule==='function')drawCapsule(c,sh+5,T+11,3.6,t,0);E(sh+4,T+16,aw*.6,aw*.55,hand);}
 else if(hold==='fernglas'){arm(sh,T+4,Rx+1,ey,slv);cel(()=>{c.beginPath();c.roundRect(Rx-2.5,ey+1,5,8,1.6);},'#3a3446',Rx);E(Rx+1,ey,aw*.6,aw*.6,hand);}
 else{arm(sh,T+4,Rx+1.5,ey-sw*.3,slv);cuff(Rx+1.5,ey-3);E(Rx+1.5,ey+1.5-sw*.3,aw*.6,aw*.6,hand);}}
// Gesicht: Anime-Augen (Lidlinie, Iris mit zwei Glanzpunkten), Brauen, Mund je Ausdruck, Bart, Brille, Sommersprossen, Narbe
function figFace(c,L,hy,hr,es,ex,blink,talk,E,OL){const iris=L.eye||'#5a3a24',dark='#1d1a24',bc=shade(L.beardCol||L.hairCol||'#5a3a24',.7),w=L.sex==='w',ey=hy+hr*.12,ew=hr*.235*es,eh=hr*.33*es,dx=hr*.4;
 const closedArc=(x,up)=>{c.strokeStyle=dark;c.lineWidth=hr*.09;c.beginPath();if(up)c.arc(x,ey+eh*.25,ew*.9,Math.PI*1.15,Math.PI*1.85);else c.arc(x,ey-eh*.35,ew*.9,Math.PI*.15,Math.PI*.85);c.stroke();};
 for(const s of[-1,1]){const x=s*dx;
  if(blink||ex==='stolz'){closedArc(x,true);continue;}
  if(ex==='zaertlich'){closedArc(x,false);continue;}
  const sur=ex==='ueberrascht',lid=ex==='entschlossen'||ex==='ernst'?.32:ex==='laechelnd'?.22:ex==='traurig'?.18:0,h2=eh*(sur?1.12:1);
  c.save();c.beginPath();c.ellipse(x,ey,ew,h2,0,0,7);c.clip();c.fillStyle='#fff';c.fillRect(x-ew,ey-h2,ew*2,h2*2);
  const look=ex==='nachdenklich'?-ew*.32:0,ir=sur?.62:.84,g=c.createLinearGradient(0,ey-h2,0,ey+h2);g.addColorStop(0,shade(iris,.45));g.addColorStop(.55,iris);g.addColorStop(1,shade(iris,1.35));
  c.fillStyle=g;c.beginPath();c.ellipse(x+look,ey+h2*.08,ew*ir,h2*ir*.98,0,0,7);c.fill();c.fillStyle=dark;c.beginPath();c.ellipse(x+look,ey+h2*.12,ew*ir*.42,h2*ir*.48,0,0,7);c.fill();
  c.fillStyle='#fff';c.beginPath();c.ellipse(x+look-ew*.32,ey-h2*.32,ew*.3,h2*.24,0,0,7);c.fill();c.beginPath();c.arc(x+look+ew*.34,ey+h2*.38,ew*.13,0,7);c.fill();
  if(lid){c.fillStyle=shade(L.skin||'#f3cfae',.96);c.beginPath();c.moveTo(x-ew*1.2,ey-h2*1.2);c.lineTo(x+ew*1.2,ey-h2*1.2);c.lineTo(x+ew*1.2,ey-h2+h2*2*lid*(ex==='traurig'?(s<0?.6:1.4):ex==='entschlossen'?(s<0?1.5:.5):1));c.lineTo(x-ew*1.2,ey-h2+h2*2*lid*(ex==='traurig'?(s<0?1.4:.6):ex==='entschlossen'?(s<0?.5:1.5):1));c.closePath();c.fill();}
  c.restore();
  // Lidlinie oben (dick, mit Wimpernschwung), unten dünn
  const ly=ey-h2+(lid?h2*2*lid:0)*.9;c.strokeStyle=dark;c.lineWidth=hr*.085;c.beginPath();c.moveTo(x-s*ew*1.05,ly+h2*.18);c.quadraticCurveTo(x,ly-h2*.2,x+s*ew*1.12,ly+h2*.08);if(w||L.lash){c.lineTo(x+s*ew*1.38,ly-h2*.12);}c.stroke();
  c.lineWidth=hr*.035;c.globalAlpha=.6;c.beginPath();c.arc(x,ey+h2*.15,ew*.85,Math.PI*.3,Math.PI*.7);c.stroke();c.globalAlpha=1;}
 // Brauen
 const by=ey-eh*1.25-(ex==='ueberrascht'?hr*.1:0);c.strokeStyle=shade(L.browCol||L.hairCol||'#5a3a24',.65);c.lineWidth=hr*.075;
 for(const s of[-1,1]){const x=s*dx;let i=0,o=0;if(ex==='entschlossen'||ex==='ernst'){i=hr*.12;o=-hr*.04;}else if(ex==='traurig'){i=-hr*.1;o=hr*.04;}else if(ex==='nachdenklich'&&s>0){i=-hr*.08;o=-hr*.12;}else if(ex==='freudig'||ex==='laechelnd'){i=-hr*.03;o=-hr*.03;}
  c.beginPath();c.moveTo(x-s*ew*.95,by+i);c.quadraticCurveTo(x,by-hr*.06+(i+o)/2,x+s*ew*1.15,by+o);c.stroke();}
 // Wangen, Nase, Sommersprossen
 const bl=ex==='zaertlich'||ex==='freudig'?.42:.24;E(-dx*1.18,ey+eh*1.05,hr*.17,hr*.09,`rgba(240,110,110,${bl})`);E(dx*1.18,ey+eh*1.05,hr*.17,hr*.09,`rgba(240,110,110,${bl})`);
 c.strokeStyle='rgba(150,80,60,.5)';c.lineWidth=hr*.04;c.beginPath();c.moveTo(-hr*.02,ey+eh*.95);c.lineTo(hr*.05,ey+eh*1.12);c.stroke();
 const fl=[].concat(L.face||[]);if(fl.includes('sommersprossen'))for(const s of[-1,1])for(let i=0;i<4;i++)E(s*(dx*.9+i*hr*.07),ey+eh*.9+(i%2)*hr*.05,hr*.025,hr*.025,'rgba(160,90,60,.55)');
 if(fl.includes('narbe')){c.strokeStyle='rgba(150,70,70,.65)';c.lineWidth=hr*.05;c.beginPath();c.moveTo(dx+ew*.2,ey-eh*1.6);c.lineTo(dx-ew*.5,ey+eh*1.1);c.stroke();}
 // Bart (unter dem Mund)
 const my=hy+hr*.64,bd=L.beard;
 if(bd==='vollbart'){c.fillStyle=L.beardCol||'#e9e6e0';c.beginPath();c.moveTo(-hr*.95,hy+hr*.3);c.quadraticCurveTo(-hr*1.05,hy+hr*1.5,0,hy+hr*1.95);c.quadraticCurveTo(hr*1.05,hy+hr*1.5,hr*.95,hy+hr*.3);c.quadraticCurveTo(hr*.6,hy+hr*.8,0,hy+hr*.72);c.quadraticCurveTo(-hr*.6,hy+hr*.8,-hr*.95,hy+hr*.3);c.fill();c.strokeStyle=OL;c.lineWidth=1;c.stroke();
  c.strokeStyle='rgba(150,150,160,.45)';c.lineWidth=.7;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*hr*.25,hy+hr*1.05);c.quadraticCurveTo(i*hr*.3,hy+hr*1.4,i*hr*.15,hy+hr*1.7);c.stroke();}}
 if(bd==='kurzbart'){c.fillStyle=L.beardCol||bc;c.globalAlpha=.9;c.beginPath();c.moveTo(-hr*.92,hy+hr*.35);c.quadraticCurveTo(-hr*.8,hy+hr*1.12,0,hy+hr*1.2);c.quadraticCurveTo(hr*.8,hy+hr*1.12,hr*.92,hy+hr*.35);c.quadraticCurveTo(hr*.5,hy+hr*.95,0,hy+hr*.82);c.quadraticCurveTo(-hr*.5,hy+hr*.95,-hr*.92,hy+hr*.35);c.fill();c.globalAlpha=1;}
 if(bd==='kinnbart'){c.fillStyle=L.beardCol||bc;c.beginPath();c.moveTo(-hr*.24,hy+hr*.86);c.quadraticCurveTo(0,hy+hr*1.32,hr*.24,hy+hr*.86);c.quadraticCurveTo(0,hy+hr*.98,-hr*.24,hy+hr*.86);c.fill();}
 // Mund
 c.strokeStyle='#7a3a30';c.lineWidth=hr*.06;const mw=hr*.2;
 if(talk&&ex!=='freudig'){c.fillStyle='#8a3434';c.beginPath();c.ellipse(0,my,mw*.6,hr*.08,0,0,7);c.fill();}
 else if(ex==='freudig'){c.fillStyle='#8a3434';c.beginPath();c.moveTo(-mw*1.3,my-hr*.05);c.quadraticCurveTo(0,my+hr*.32,mw*1.3,my-hr*.05);c.closePath();c.fill();c.fillStyle='#f28c9a';c.beginPath();c.ellipse(0,my+hr*.12,mw*.6,hr*.07,0,0,7);c.fill();c.fillStyle='#fff';c.fillRect(-mw*.9,my-hr*.05,mw*1.8,hr*.05);}
 else if(ex==='ueberrascht'){c.fillStyle='#8a3434';c.beginPath();c.ellipse(0,my+hr*.04,mw*.42,hr*.11,0,0,7);c.fill();}
 else if(ex==='traurig'){c.beginPath();c.arc(0,my+hr*.16,mw*.8,Math.PI*1.2,Math.PI*1.8);c.stroke();}
 else if(ex==='entschlossen'||ex==='stolz'){c.beginPath();c.moveTo(-mw,my);c.quadraticCurveTo(mw*.2,my+hr*.06,mw*1.1,my-hr*.08);c.stroke();}
 else if(ex==='ernst'){c.beginPath();c.moveTo(-mw*.8,my+hr*.02);c.lineTo(mw*.8,my+hr*.02);c.stroke();}
 else if(ex==='nachdenklich'){c.beginPath();c.moveTo(-mw*.2,my+hr*.03);c.quadraticCurveTo(mw*.5,my-hr*.02,mw*1,my+hr*.04);c.stroke();}
 else{c.beginPath();c.arc(0,my-hr*.1,mw*(ex==='laechelnd'||ex==='zaertlich'?1:.8),Math.PI*.22,Math.PI*.78);c.stroke();}
 if(bd==='schnurr'||bd==='vollbart'){c.fillStyle=bd==='vollbart'?(L.beardCol||'#e9e6e0'):(L.beardCol||bc);for(const s of[-1,1]){c.beginPath();c.moveTo(0,my-hr*.2);c.quadraticCurveTo(s*hr*.45,my-hr*.32,s*hr*.62,my-hr*.02);c.quadraticCurveTo(s*hr*.35,my-hr*.08,0,my-hr*.08);c.fill();}}
 // Brille
 if(L.glasses==='rund'){c.strokeStyle='#8a6a3a';c.lineWidth=hr*.06;for(const s of[-1,1]){c.beginPath();c.arc(s*dx,ey,ew*1.45,0,7);c.stroke();}c.beginPath();c.moveTo(-dx+ew*1.45,ey-hr*.04);c.quadraticCurveTo(0,ey-hr*.12,dx-ew*1.45,ey-hr*.04);c.stroke();
  c.fillStyle='rgba(255,255,255,.22)';for(const s of[-1,1]){c.beginPath();c.ellipse(s*dx-ew*.5,ey-eh*.4,ew*.45,eh*.25,-.5,0,7);c.fill();}}}
// Vorderhaar (Pony mit Glanzband) + Kopfschmuck
function figHairFront(c,L,hy,hr,T,t,cel,E,OL,LW,hats){const hc=L.hairCol||'#5a3a24',st=L.hair||'kurz',hi=L.hairHi;
 const tips={wuschel:[.32,.5,.42,.56,.38,.5,.3],stachel:[.28,.5,.3,.52,.32,.46],wild:[.3,.55,.35,.6,.3,.5],pferd:[.55,.62,.5,.4,.3],zopf:[.5,.45,.52,.42,.36],dutt:[.42,.5,.44,.38],lang:[.6,.48,.55,.5,.62],glatt:[.5,.58,.46,.36,.28],kurz:[.22,.3,.24,.28,.2],wolke:[.18,.25,.2,.25],geflochten:[.38,.44,.4,.34],schopf:[.3,.42,.36,.3]}[st]||[.3,.4,.3];
 const dome=st==='wuschel'||st==='wild'||st==='stachel'?1.16:st==='wolke'?1.06:1.1,cy=hy-hr*.12;
 const path=()=>{c.beginPath();c.moveTo(-hr*dome,cy+hr*.15);c.arc(0,cy,hr*dome,Math.PI*1.02,Math.PI*1.98);const n=tips.length;
  for(let i=0;i<=n;i++){const xx=hr*dome*(1-2*i/n),tip=i<n?tips[i]:0,xm=hr*dome*(1-2*(i+.5)/n);c.lineTo(xx,i===0||i===n?cy+hr*.22:cy-hr*.42);if(i<n)c.lineTo(xm+(st==='glatt'||st==='pferd'?hr*.12:0),cy-hr*.42+hr*tip*.75);}c.closePath();};
 if(st==='wolke'){for(const s of[-1,1])for(let i=0;i<3;i++)cel(()=>{c.beginPath();c.arc(s*hr*(1.02+i*.06),hy-hr*(.35-i*.38),hr*.34,0,7);},hc,s>0?hr*1.05:999,true);}
 cel(path,hc,hr*.35);
 // Spitzen/Wuschel oben
 if(st==='wuschel'||st==='schopf')for(const[a,r,h]of[[-.55,.38,.3],[.05,.42,.42],[.6,.36,.28]])cel(()=>{c.beginPath();c.moveTo(hr*(a-.25),cy-hr*.85);c.quadraticCurveTo(hr*(a-.1),cy-hr*(1.1+h),hr*(a+.32),cy-hr*(1.18+h));c.quadraticCurveTo(hr*(a+.15),cy-hr*1.02,hr*(a+.3),cy-hr*.82);c.closePath();},hc,hr*a+hr*.1);
 if(st==='stachel'||st==='wild')for(let i=0;i<7;i++){const a=Math.PI*(1.08+i*.14),r0=hr*1.02,r1=hr*(st==='wild'?1.62:1.5)*(i%2?.9:1);cel(()=>{c.beginPath();c.moveTo(Math.cos(a-.2)*r0,cy+Math.sin(a-.2)*r0);c.lineTo(Math.cos(a+.05)*r1,cy+Math.sin(a+.05)*r1);c.lineTo(Math.cos(a+.24)*r0,cy+Math.sin(a+.24)*r0);c.closePath();},i===2&&hi?hi:hc,Math.cos(a)*r0);}
 if(st==='lang'||st==='geflochten'||st==='glatt')for(const s of[-1,1])cel(()=>{c.beginPath();c.moveTo(s*hr*.86,cy+hr*.1);c.quadraticCurveTo(s*hr*1.2,hy+hr*.9,s*hr*(st==='glatt'?.95:1.1),st==='glatt'?hy+hr*.95:T+(st==='lang'?16:6));c.lineTo(s*hr*.78,st==='glatt'?hy+hr*.8:T+(st==='lang'?10:2));c.quadraticCurveTo(s*hr*.95,hy+hr*.4,s*hr*.7,cy+hr*.25);c.closePath();},hc,s>0?hr*.92:999);
 if(st==='zopf'){const bx=hr*.82;for(let i=0;i<6;i++)cel(()=>{c.beginPath();c.ellipse(bx+i*.5,hy+hr*.95+i*hr*.42,hr*.24,hr*.26,0,0,7);},i%2?shade(hc,.9):hc,bx+i*.5);E(bx+2.6,hy+hr*.95+6*hr*.42-hr*.2,hr*.16,hr*.12,L.tieCol||'#fff');}
 if(st==='geflochten'){c.strokeStyle=shade(hc,.8);c.lineWidth=hr*.06;for(let i=0;i<5;i++){c.beginPath();c.arc(0,cy,hr*(dome-.04),Math.PI*(1.15+i*.17),Math.PI*(1.25+i*.17));c.stroke();}}
 if(hi&&st!=='stachel'){c.fillStyle=hi;c.beginPath();c.moveTo(hr*.15,cy-hr*.95);c.quadraticCurveTo(hr*.55,cy-hr*.3,hr*.35,cy+hr*.5);c.lineTo(hr*.2,cy+hr*.42);c.quadraticCurveTo(hr*.35,cy-hr*.3,-hr*.05,cy-hr*.9);c.closePath();c.fill();}
 // Glanzband
 c.strokeStyle='rgba(255,255,255,.38)';c.lineWidth=hr*.09;c.beginPath();c.arc(0,cy,hr*dome*.72,Math.PI*1.22,Math.PI*1.5);c.stroke();
 // Kopfschmuck
 const hcol=L.hatCol||'#3d8fe0';
 for(const h of hats){
  if(h==='cap'){cel(()=>{c.beginPath();c.arc(0,cy-hr*.1,hr*1.08,Math.PI*1.02,Math.PI*1.98);c.closePath();},hcol,hr*.3);cel(()=>{c.beginPath();c.ellipse(-hr*.15,cy-hr*.08,hr*1.2,hr*.24,-.05,0,Math.PI);c.closePath();},L.brimCol||shade(hcol,.75),hr*.5);
   E(0,cy-hr*1.1,hr*.12,hr*.08,shade(hcol,.7));if(L.capSym){E(0,cy-hr*.55,hr*.3,hr*.28,L.capSymBg||'#fff');figEmblem(c,L.capSym,0,cy-hr*.55,hr*.2,L.capSymCol||'#4c9a5c');}}
  if(h==='brille'){c.fillStyle=L.gogBand||'#4a3426';c.beginPath();c.ellipse(0,cy-hr*.62,hr*1.06,hr*.18,0,Math.PI,0);c.fill();for(const s of[-1,1]){const gx=s*hr*.42,gy=cy-hr*.78;c.fillStyle='#c9a54a';c.beginPath();c.arc(gx,gy,hr*.3,0,7);c.fill();c.strokeStyle=OL;c.lineWidth=.9;c.stroke();const g=c.createRadialGradient(gx-hr*.08,gy-hr*.08,0,gx,gy,hr*.24);g.addColorStop(0,'#e8fbff');g.addColorStop(1,L.gogCol||'#3fb8d8');c.fillStyle=g;c.beginPath();c.arc(gx,gy,hr*.22,0,7);c.fill();}}
  if(h==='stirnreif'||h==='sonnenkristall'){c.strokeStyle=L.circCol||'#e6c35c';c.lineWidth=hr*.09;c.beginPath();c.arc(0,cy+hr*.15,hr*1.03,Math.PI*1.12,Math.PI*1.88);c.stroke();const gy=cy+hr*.15-hr*1.03;
   cel(()=>{c.beginPath();c.moveTo(0,gy-hr*.22);c.lineTo(hr*.17,gy);c.lineTo(0,gy+hr*.2);c.lineTo(-hr*.17,gy);c.closePath();},hcol,0);if(h==='sonnenkristall')figEmblem(c,'sonne',0,gy-hr*.05,hr*.32,'rgba(255,214,90,.8)');}
  if(h==='federhut'){cel(()=>{c.beginPath();c.ellipse(0,cy-hr*.6,hr*1.4,hr*.28,0,0,7);},shade(hcol,.85),hr*.4);cel(()=>{c.beginPath();c.moveTo(-hr*.8,cy-hr*.62);c.quadraticCurveTo(-hr*.75,cy-hr*1.45,0,cy-hr*1.45);c.quadraticCurveTo(hr*.75,cy-hr*1.45,hr*.8,cy-hr*.62);c.closePath();},hcol,hr*.25);
   cel(()=>{c.beginPath();c.moveTo(hr*.5,cy-hr*.9);c.quadraticCurveTo(hr*1.6,cy-hr*1.9,hr*1.25,cy-hr*2.15);c.quadraticCurveTo(hr*1.1,cy-hr*1.4,hr*.42,cy-hr*1.0);c.closePath();},L.featherCol||'#4cb85c',hr);}
  if(h==='blume'||h==='blattschmuck'){const fx=-hr*.82,fy=cy-hr*.45;if(h==='blattschmuck'){for(const a of[-.6,.2,1])E(fx+Math.cos(a)*hr*.3,fy+Math.sin(a)*hr*.3,hr*.26,hr*.12,'#5fb85a',a);}for(let i=0;i<5;i++){const a=i*1.257;E(fx+Math.cos(a)*hr*.15,fy+Math.sin(a)*hr*.15,hr*.14,hr*.14,L.flowerCol||'#ffffff');}E(fx,fy,hr*.08,hr*.08,'#f2c94c');}
  if(h==='muschel'){const fx=-hr*.85,fy=cy-hr*.3;cel(()=>{c.beginPath();c.moveTo(fx,fy+hr*.22);c.lineTo(fx-hr*.25,fy-hr*.12);c.quadraticCurveTo(fx,fy-hr*.32,fx+hr*.25,fy-hr*.12);c.closePath();},'#fbe6d4',fx);E(fx+hr*.2,fy+hr*.3,hr*.07,hr*.07,'#5fd2e0');}
  if(h==='mondsichel'){c.save();c.translate(-hr*.75,cy-hr*.7);c.fillStyle='#e6c35c';c.beginPath();c.arc(0,0,hr*.3,Math.PI*.3,Math.PI*1.7);c.arc(hr*.12,0,hr*.22,Math.PI*1.6,Math.PI*.4,true);c.fill();c.restore();}
  if(h==='feder')for(const[a,col]of[[-.5,'#ffffff'],[-.2,'#5fc8d8']])cel(()=>{c.beginPath();c.ellipse(hr*.9+a*hr,cy-hr*.95,hr*.14,hr*.5,a,0,7);},col,hr);
  if(h==='kapuze')cel(()=>{c.beginPath();c.arc(0,cy+hr*.05,hr*1.24,Math.PI*1.05,Math.PI*1.95);c.lineTo(hr*1.02,hy+hr*.4);c.quadraticCurveTo(hr*1.1,cy-hr*.4,0,cy-hr*.98);c.quadraticCurveTo(-hr*1.1,cy-hr*.4,-hr*1.02,hy+hr*.4);c.closePath();},L.hoodCol||L.coatCol||'#3a3446',hr*.3);}}
// Porträt (Kopf + Schultern) in eine quadratische Fläche W×W
function drawFigPortrait(c,L,W,t,expr,talk){const B=FIG_BUILD[L&&L.build]||FIG_BUILD.adult,kk=W*.33/B.hr;drawFigure(c,W/2,W*.5-B.hy*kk,kk*100,L,t||1000,{expr,talk,noShadow:true,still:true});}
function draw(){const c=cx,vw=VW*TS,vh=VH*TS;lights=[];
 let tx=P.px*TS+8-vw/2,ty=P.py*TS+8-vh/2;const mw=cur.w*TS,mh=cur.h*TS;
 tx=mw<=vw?(mw-vw)/2:Math.max(0,Math.min(tx,mw-vw));ty=mh<=vh?(mh-vh)/2:Math.max(0,Math.min(ty,mh-vh));
 if(camMap!==cur.id){camX=tx;camY=ty;camMap=cur.id;}else{camX+=(tx-camX)*.2;camY+=(ty-camY)*.2;}
 const ox=Math.round(camX*SC)/SC,oy=Math.round(camY*SC)/SC;
 c.setTransform(1,0,0,1,0,0);c.fillStyle='#0a0d12';c.fillRect(0,0,cv.width,cv.height);c.setTransform(SC,0,0,SC,-ox*SC,-oy*SC);
 const x0=Math.floor(ox/TS)-1,y0=Math.floor(oy/TS)-1;
 for(let y=y0;y<=y0+VH+2;y++)for(let x=x0;x<=x0+VW+2;x++){const t=tileAt(cur,x,y);if(t!==null)drawTile(t,x,y,x*TS,y*TS);}
 const ents=npcs().map(n=>({n,y:n.y})).concat([{p:1,y:P.py}],ROAM.list.map(r=>({r,y:r.py})),COMP&&COMP.s?[{r:COMP,y:COMP.py}]:[],VILL.list.map(v=>({v,y:v.py}))).sort((a,b)=>a.y-b.y);
 for(const e of ents){if(e.v){drawPerson(e.v.px*TS,e.v.py*TS-1,e.v.dir,e.v.c,e.v.t<1,shade(e.v.c,.6),anim,'#3a2a1e');continue;}if(e.r){drawMon(c,e.r.s,e.r.px*TS+8,e.r.py*TS+2,e.r===COMP?18:21,e.r.dir==='left',anim+e.r.x*300);continue;}if(e.p){drawPerson(P.px*TS,P.py*TS-1,P.dir,'#e8623a',P.moving||held,'#1f8a7a',anim,'#3a2a1e');lights.push([P.px*TS+8,P.py*TS+6,hasField('lumen')?96:58,'255,235,190']);continue;}
  const n=e.n,sx=n.x*TS,sy=n.y*TS;
  if(n.t==='item'||n.t==='starter'){const pu=Math.sin(anim/300+n.x)*.8;ell(c,sx+8,sy+13,4,1.4,'rgba(0,0,0,.2)');
   const g=c.createRadialGradient(sx+6.5,sy+6+pu,.5,sx+8,sy+8+pu,5);const col=n.t==='item'?'#f2c94c':n.c;g.addColorStop(0,'#fff');g.addColorStop(.35,col);g.addColorStop(1,shade(col,.6));
   circ(c,sx+8,sy+8+pu,4.6,g);c.fillStyle='rgba(255,255,255,.85)';c.fillRect(sx+3.6,sy+7.6+pu,8.8,.9);lights.push([sx+8,sy+8,14,'255,220,140']);continue;}
  if(n.t==='legend'){const ok=G.flags[n.req]&&!(n.day&&isNight())&&!(n.night&&!isNight());
   if(ok){const col=TYPES[MONS[n.mon].t[0]].c;const g=c.createRadialGradient(sx+8,sy+6,1,sx+8,sy+6,16);g.addColorStop(0,col+'88');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(sx-10,sy-12,36,36);
    drawMon(c,n.mon,sx+8,sy+5,24,false,anim);lights.push([sx+8,sy+6,40,'255,230,180']);}
   else{const a=.3+.25*Math.sin(anim/300);circ(c,sx+8,sy+8,2.5+Math.sin(anim/250),`rgba(255,240,180,${a})`);lights.push([sx+8,sy+8,10,'255,240,180']);}continue;}
  if(n.t==='sign'){ell(c,sx+8,sy+14,5,1.5,'rgba(0,0,0,.22)');rr(c,sx+7,sy+8,2,6.5,.6,'#6e4626');rr(c,sx+2.2,sy+2,11.6,7.6,1.6,'#c9985c');rr(c,sx+2.2,sy+2,11.6,1.6,.8,'#e0b676');c.fillStyle='rgba(60,36,16,.55)';c.fillRect(sx+4.2,sy+4.6,7.6,.7);c.fillRect(sx+4.2,sy+6.6,5.2,.7);continue;}
  drawPerson(sx,sy-1,n.face||n.d||'down',n.c,false,shade(n.c,.62),anim,'#3a2a1e',typeof figLookOf==='function'?figLookOf(n):null);
  if(n.alert){c.save();c.translate(sx+8,sy-20);rr(c,-5,-6,10,10,5,'#fff');c.fillStyle='#fff';c.beginPath();c.moveTo(-2,3);c.lineTo(0,6);c.lineTo(2,3);c.fill();rr(c,-.9,-4,1.8,4.2,.8,'#e2554d');circ(c,0,1.8,1,'#e2554d');c.restore();}}
 drawGuide2D(c);fieldFx2D(c);c.setTransform(1,0,0,1,0,0);
 // Licht & Tageszeit
 const h=G.time/60;let dark=0,dc='14,20,52';
 if(!cur.inside){if(h>=20.5||h<5)dark=.6;else if(h>=18)dark=(h-18)/2.5*.6;else if(h<7)dark=(7-h)/2*.6;
  if(cur.theme==='cave'){dark=Math.max(dark,hasField('lumen')?.35:.64);dc='12,8,18';}
  if(h>=16.5&&h<19.5&&cur.theme!=='cave'){c.fillStyle=`rgba(255,140,60,${Math.min(1,(h-16.5)/1.5)*.13})`;c.fillRect(0,0,cv.width,cv.height);}}
 if(dark>0&&!SET.light){c.fillStyle=`rgba(${dc},${dark*.85})`;c.fillRect(0,0,cv.width,cv.height);}
 if(dark>0&&SET.light){lx.globalCompositeOperation='source-over';lx.clearRect(0,0,lc.width,lc.height);lx.fillStyle=`rgba(${dc},${dark})`;lx.fillRect(0,0,lc.width,lc.height);
  lx.globalCompositeOperation='destination-out';for(const[wx,wy,r]of lights){const X=(wx-ox)*SC,Y=(wy-oy)*SC,Rr=r*SC;const g=lx.createRadialGradient(X,Y,0,X,Y,Rr);g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=g;lx.fillRect(X-Rr,Y-Rr,Rr*2,Rr*2);}
  c.drawImage(lc,0,0);c.globalCompositeOperation='lighter';
  for(const[wx,wy,r,col]of lights){if(r>40)continue;const X=(wx-ox)*SC,Y=(wy-oy)*SC,Rr=r*SC*.8;const g=c.createRadialGradient(X,Y,0,X,Y,Rr);g.addColorStop(0,`rgba(${col},${.22*dark/.6})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(X-Rr,Y-Rr,Rr*2,Rr*2);}
  c.globalCompositeOperation='source-over';}
 // Partikel
 const W=cv.width,H=cv.height,t=anim,K=SC/3;if(SET.particles){
 if(cur.theme==='snow'&&!cur.inside)for(let i=0;i<46;i++){const s=1+i%3;const x=((i*137.5+t*.012*s+Math.sin(t/900+i)*14)%W+W)%W,y=((i*91.7+t*.035*s)%H);circ(c,x,y,(1.2+s*.6)*K,'rgba(255,255,255,.85)');}
 else if(cur.theme==='cave')for(let i=0;i<18;i++){const x=((i*173.3+Math.sin(t/2000+i)*30)%W+W)%W,y=H-((i*97+t*.012)%H);circ(c,x,y,1.4*K,'rgba(180,230,255,.35)');}
 else if(!cur.inside&&dark>.3)for(let i=0;i<14;i++){const x=((i*211+Math.sin(t/1700+i*2)*60+t*.01)%W+W)%W,y=((i*157+Math.cos(t/1900+i)*40)%H+H)%H,a=.4+.6*Math.max(0,Math.sin(t/400+i*1.7));
  const g=c.createRadialGradient(x,y,0,x,y,9*K);g.addColorStop(0,`rgba(230,255,140,${a})`);g.addColorStop(1,'rgba(230,255,140,0)');c.fillStyle=g;c.fillRect(x-9*K,y-9*K,18*K,18*K);}}
 // Vignette
 const vg=c.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,W*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.28)');c.fillStyle=vg;c.fillRect(0,0,W,H);}

// ---------- Kreaturen: plastisch gezeichnet ----------
function drawMon2D(c,id,x,y,size,flip,t,alpha){const M=MONS[id];if(!M)return;const[sh,c1,c2,f,sc]=M.sp;const o='rgba(20,16,30,.55)';
 c.save();c.translate(x,y);const k=size/100*sc;c.scale(flip?-k:k,k);if(alpha!==undefined)c.globalAlpha=alpha;
 const bob=Math.sin((t||0)/450)*1.8;
 c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(0,43,34,7,0,0,7);c.fill();c.translate(0,bob);
 c.lineWidth=2;c.strokeStyle=o;c.lineJoin='round';
 const grad=(a,b,rx,ry,col)=>{const g=c.createRadialGradient(a-rx*.35,b-ry*.45,1,a,b,Math.max(rx,ry)*1.15);g.addColorStop(0,shade(col,1.3));g.addColorStop(.55,col);g.addColorStop(1,shade(col,.68));return g;};
 const E=(a,b,rx,ry,col,rot)=>{c.fillStyle=grad(a,b,rx,ry,col);c.beginPath();c.ellipse(a,b,rx,ry,rot||0,0,7);c.fill();c.stroke();};
 const tri=(pts,col)=>{const g=c.createLinearGradient(pts[0],pts[1],pts[2],pts[3]);g.addColorStop(0,shade(col,.85));g.addColorStop(1,shade(col,1.2));c.fillStyle=g;c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.closePath();c.fill();c.stroke();};
 const leg=(a,b,w,h,col)=>{const g=c.createLinearGradient(a,0,a+w,0);g.addColorStop(0,shade(col,1.1));g.addColorStop(1,shade(col,.7));c.fillStyle=g;c.beginPath();c.roundRect(a,b,w,h,w/2.2);c.fill();c.stroke();};
 let H;
 if(f.includes('wings')&&sh!=='bird'){E(-18,-6,17,8,c2,-.6);E(16,-8,17,8,c2,.6);}
 if(f.includes('flame')){c.save();c.translate(-34,0);const fl=Math.sin((t||0)/120)*2;c.strokeStyle='rgba(180,60,10,.5)';tri([0,10,-11+fl,-15,2,-5,7-fl,-24,11,6],'#ff9a2e');c.strokeStyle='transparent';tri([2,8,-3,-6,4,-2,6,-11+fl,8,6],'#fff1a8');c.strokeStyle=o;c.restore();}
 if(f.includes('tail')&&sh!=='serpent'){c.fillStyle=grad(-34,0,14,14,c1);c.beginPath();c.moveTo(-26,14);c.quadraticCurveTo(-48,4,-40,-17);c.lineTo(-33,-14);c.quadraticCurveTo(-38,6,-22,8);c.closePath();c.fill();c.stroke();}
 if(sh==='quad'){[-20,-8,8,20].forEach((a,i)=>leg(a-4.5,16,9,23,shade(c1,i%2?.9:.8)));E(0,12,32,19,c1);E(5,19,16,8,c2);H={x:24,y:-10,r:17};}
 else if(sh==='blob'){E(-14,38,9,5,shade(c1,.8));E(14,38,9,5,shade(c1,.8));E(0,8,32,30,c1);E(0,21,18,12,c2);H={x:0,y:-2,r:28,inBody:1};}
 else if(sh==='bird'){c.fillStyle='#d99a3a';c.fillRect(-8,30,3,10);c.fillRect(5,30,3,10);E(-26,4,23,10,c2,-.5);E(0,10,22,24,c1);E(2,17,13,14,c2);E(26,4,23,10,shade(c2,.92),.5);H={x:6,y:-24,r:15};}
 else if(sh==='biped'){leg(-14,25,9,15,shade(c1,.8));leg(5,25,9,15,shade(c1,.8));E(-20,6,6,14,shade(c1,.88),.3);E(20,6,6,14,shade(c1,.88),-.3);E(0,10,20,24,c1);E(0,17,11,14,c2);H={x:0,y:-24,r:16};}
 else if(sh==='serpent'){[[-34,30,8],[-24,32,10],[-10,30,13],[2,22,15],[8,8,15]].forEach(([a,b,r2],i)=>E(a,b,r2,r2*.9,i%2?c1:shade(c1,.92)));
  if(f.includes('tail'))tri([-40,28,-53,20,-49,37],c2);E(10,14,8,10,c2);H={x:14,y:-16,r:17};}
 else{c.fillStyle=grad(0,14,30,24,c1);c.beginPath();c.roundRect(-30,-8,60,46,15);c.fill();c.stroke();E(-34,12,9,14,shade(c1,.85));E(34,12,9,14,shade(c1,.85));
  c.fillStyle=grad(0,18,16,11,c2);c.beginPath();c.roundRect(-16,8,32,22,9);c.fill();H={x:0,y:-16,r:15};}
 if(f.includes('mane'))for(let i=0;i<7;i++){const a=-2.6+i*.55;tri([H.x+Math.cos(a)*H.r*.8,H.y+Math.sin(a)*H.r*.8,H.x+Math.cos(a-.25)*(H.r+11),H.y+Math.sin(a-.25)*(H.r+11),H.x+Math.cos(a+.25)*(H.r+3),H.y+Math.sin(a+.25)*(H.r+3)],c2);}
 const bo=sh==='blob'?14:0;
 if(f.includes('spikes'))for(let i=0;i<3;i++)tri([-18+i*12,-6-bo,-12+i*12,-21-bo,-6+i*12,-6-bo],shade(c2,.92));
 if(f.includes('fin'))tri([-10,-8-bo-2,2,-27-bo,8,-6-bo-2],c2);
 if(!H.inBody)E(H.x,H.y,H.r,H.r*.92,c1);
 if(f.includes('ears')){tri([H.x-H.r*.7,H.y-H.r*.4,H.x-H.r*.9,H.y-H.r-12,H.x-H.r*.1,H.y-H.r*.8],c1);tri([H.x+H.r*.1,H.y-H.r*.8,H.x+H.r*.6,H.y-H.r-12,H.x+H.r*.8,H.y-H.r*.3],c1);
  c.fillStyle='rgba(255,170,170,.5)';c.beginPath();c.moveTo(H.x-H.r*.6,H.y-H.r*.55);c.lineTo(H.x-H.r*.8,H.y-H.r-6);c.lineTo(H.x-H.r*.25,H.y-H.r*.8);c.fill();}
 if(f.includes('horns')){c.strokeStyle=shade(c2,.55);c.lineWidth=4.5;c.lineCap='round';c.beginPath();c.moveTo(H.x-6,H.y-H.r+3);c.quadraticCurveTo(H.x-14,H.y-H.r-12,H.x-4,H.y-H.r-19);
  c.moveTo(H.x+6,H.y-H.r+3);c.quadraticCurveTo(H.x+16,H.y-H.r-10,H.x+10,H.y-H.r-19);c.stroke();c.lineWidth=2;c.strokeStyle=o;}
 if(f.includes('leaf')){c.save();c.translate(H.x,H.y-H.r);c.rotate(-.4+Math.sin((t||0)/500)*.08);E(4,-8,6,11,'#7ad36a');c.strokeStyle='rgba(30,90,30,.6)';c.beginPath();c.moveTo(4,1);c.lineTo(4,-16);c.stroke();c.restore();c.strokeStyle=o;}
 if(f.includes('halo')){c.save();c.shadowColor='#fff3b0';c.shadowBlur=8;c.strokeStyle='#fff3b0';c.lineWidth=3;c.beginPath();c.ellipse(H.x,H.y-H.r-10,H.r*.7,4,0,0,7);c.stroke();c.restore();}
 // Gesicht
 const ex=H.x+4,ey=H.y-2;c.lineWidth=1.2;
 [[ex-8,ey],[ex+6,ey]].forEach(([a,b])=>{c.fillStyle='#fff';c.beginPath();c.ellipse(a,b,4.6,5.8,0,0,7);c.fill();c.stroke();
  const ig=c.createLinearGradient(0,b-4,0,b+4);ig.addColorStop(0,'#2a2238');ig.addColorStop(1,shade(c1,.5));c.fillStyle=ig;c.beginPath();c.ellipse(a+1,b+.8,3,3.8,0,0,7);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(a+2,b-1,1.3,0,7);c.fill();c.beginPath();c.arc(a,b+2.4,.6,0,7);c.fill();});
 c.fillStyle='rgba(255,140,140,.35)';c.beginPath();c.ellipse(ex-11,ey+7,3.2,1.8,0,0,7);c.ellipse(ex+9,ey+7,3.2,1.8,0,0,7);c.fill();
 if(sh==='bird'){c.save();c.translate(H.x+12,H.y+2);c.strokeStyle=o;tri([0,-4,12,0,0,4],'#f2b33a');c.restore();}
 c.restore();}

// ---------- Kampfszene ----------
const ease=k=>1-Math.pow(1-Math.min(1,Math.max(0,k)),3);
function drawBattle2D(){const bc=$('#bcv'),c=bc.getContext('2d');c.setTransform(BS,0,0,BS,0,0);const W=240,H=150,th=cur.theme,nt=isNight(),t=performance.now();
 const sky=th==='cave'?['#241b2e','#4a3a46']:th==='inside'?['#cdbfa6','#eee4d3']:nt?['#0f1636','#3b3f72']:th==='snow'?['#9cc4e4','#eef5fa']:th==='swamp'?['#4f6a5a','#a9b893']:th==='beach'?['#5fb4e8','#ffe2b8']:th==='ember'?['#b8603a','#f2c49a']:th==='whisper'?['#8a9ad8','#e6e0f2']:['#6cb4ec','#e2f3fa'];
 let g=c.createLinearGradient(0,0,0,90);g.addColorStop(0,sky[0]);g.addColorStop(1,sky[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
 if(th!=='cave'&&th!=='inside'){if(nt){circ(c,40,22,9,'#f4f1dc');circ(c,44,20,8,sky[0]);for(let i=0;i<20;i++)circ(c,(i*53)%W,(i*29)%60,.5+(i%3)*.3,'rgba(255,255,255,.7)');}
  else{const sg=c.createRadialGradient(205,20,2,205,20,30);sg.addColorStop(0,'rgba(255,250,220,1)');sg.addColorStop(.3,'rgba(255,240,180,.6)');sg.addColorStop(1,'rgba(255,240,180,0)');c.fillStyle=sg;c.fillRect(170,-10,70,60);}
  for(let l=0;l<2;l++){c.fillStyle=l?(nt?'#2a3460':shade(sky[1],.78)):(nt?'#1d2650':shade(sky[1],.88));c.beginPath();c.moveTo(0,90);for(let x=0;x<=W;x+=10)c.lineTo(x,74-l*6-Math.sin(x/30+l*2)*6-Math.sin(x/13+l)*2);c.lineTo(W,90);c.fill();}}
 const gr=th==='snow'?'#e3ecf3':th==='beach'?'#ecd59b':th==='cave'?'#5d4b3f':th==='swamp'?'#5a7350':th==='inside'?'#c8b593':th==='ember'?'#8a6a58':th==='whisper'?'#8a86c0':'#7fbf63';
 g=c.createLinearGradient(0,78,0,H);g.addColorStop(0,shade(gr,.9));g.addColorStop(1,shade(gr,1.08));c.fillStyle=g;c.fillRect(0,78,W,H-78);
 const plat=(x,y,rx,ry)=>{ell(c,x,y+3,rx,ry,'rgba(0,0,0,.18)');const pg=c.createRadialGradient(x,y-2,2,x,y,rx);pg.addColorStop(0,shade(gr,1.18));pg.addColorStop(1,shade(gr,.82));ell(c,x,y,rx,ry,pg);
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;c.beginPath();c.ellipse(x,y,rx*.82,ry*.7,0,0,7);c.stroke();};
 plat(178,72,46,11);plat(64,134,60,13);
 if(nt&&th!=='inside'){c.fillStyle='rgba(15,20,60,.22)';c.fillRect(0,0,W,H);}
 if(!B)return;const foe=B.foe[B.fi],me=G.team[B.mi],fx=B.fx,lu=B.lunge;
 const enter=ease((t-(B.t0||0))/650);
 const shake=w=>fx&&fx.who===w&&!fx.buff&&t-fx.t<380?Math.sin((t-fx.t)/22)*3.5:0;
 const lunge=w=>lu&&lu.who===w&&t-lu.t<320?Math.sin((t-lu.t)/320*Math.PI)*12*(w==='me'?1:-1):0;
 const ko=(w,m)=>m.hp>0?1:(B.ko&&B.ko[w]?Math.max(0,1-(t-B.ko[w])/550):0);
 let fX=178+(1-enter)*110+shake('foe')+lunge('foe'),fY=60+(foe.hp>0?0:(1-ko('foe',foe))*20);
 if(fx&&fx.who==='ball'){const k=Math.min(1,(t-fx.t)/500),bx=60+(178-60)*k,by=120-Math.sin(k*Math.PI)*90+(k>=1?0:0)+(1-k)*-0;
  const wob=k>=1?Math.sin((t-fx.t)/90)*.35:0;c.save();c.translate(bx,k>=1?66:by);c.rotate(wob+(k<1?k*12:0));
  const bg2=c.createLinearGradient(0,-7,0,7);bg2.addColorStop(0,'#ff8a5a');bg2.addColorStop(.48,'#d9482a');bg2.addColorStop(.52,'#f2f2f2');bg2.addColorStop(1,'#c9ccd6');circ(c,0,0,7,bg2);c.fillStyle='#222';c.fillRect(-7,-.7,14,1.4);circ(c,0,0,2.2,'#fff');c.restore();}
 else if(foe.hp>0||ko('foe',foe)>0)drawMon(c,foe.s,fX,fY,66,true,t,ko('foe',foe));
 if(me&&(me.hp>0||ko('me',me)>0))drawMon(c,me.s,64-(1-enter)*110+shake('me')+lunge('me'),110+(me.hp>0?0:(1-ko('me',me))*20),88,false,t+700,ko('me',me));
 if(fx&&fx.col&&t-fx.t<560){const k=Math.max(0,(t-fx.t)/560),tx=fx.who==='foe'?178:64,ty=fx.who==='foe'?52:98;
  if(fx.buff){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;circ(c,tx+Math.cos(a)*22,ty+20-k*44-(i%2)*6,2*(1-k)+.5,fx.col);}}
  else{const fg=c.createRadialGradient(tx,ty,0,tx,ty,40*k+8);fg.addColorStop(0,`rgba(255,255,255,${.85*(1-k)})`);fg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=fg;c.fillRect(tx-60,ty-60,120,120);
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2+i,d=6+k*34;c.globalAlpha=1-k;circ(c,tx+Math.cos(a)*d,ty+Math.sin(a)*d*.8,3.2*(1-k)+.6,fx.col);}c.globalAlpha=1;}}}
