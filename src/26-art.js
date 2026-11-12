// ===== VEYRA – Nutzer-Konzeptkunst: Illustrationen in 2D (Dex, Team, Box, Fang-Karte, Kampf-2D, Begegnung, Entwicklung, Starterwahl, Schlüpfen) + Quelle der 3D-Sprites =====
// Quelle: public/art/<Kanon-Nr. 3-stellig>_<name>.webp → window.ART_SRC[Nr] (build.mjs; App = Pfad art/…, Artifact = data-URI). Nicht-Zahl-Keys (map_, region_, stadt_, ort_) sind Orte, keine Arten.
// API: artSrc(id) · hasArt(id) · artFramed(id) · artFace(id) · artHue(id) · artImg(id,cls,o)→HTML · artEl(id,size,o)→Element · artStage(id,size,o)→Detail-Bühne
//      drawArt(ctx,id,x,y,w,h,flip,o)→bool · drawMonArt(c,id,x,y,size,faceLeft,t,alpha,o) · artCut(id)→freigestelltes Canvas (3D-Sprite) · preloadArt() · artStarter(npc) · SEQ.hatch
// Blickrichtung der Illustration (vollständig für alle Bild-Arten): -1 schaut nach links, 1 nach rechts, 0 frontal – Spiegeln im Kampf und Sprite-Wende in 3D
const ART_FACE={1:-1,4:-1,7:0,8:1,9:1,10:1,11:1,12:1,13:1,14:1,15:1,16:1,17:1,18:1,19:1,20:1,21:1,22:1,23:1,24:1,25:1,26:1,27:1,28:1,29:1,30:1,31:1,32:1,33:1,34:1,35:1,36:1,37:1,38:1,39:1,40:1,41:1,42:1,43:1,44:1,45:1,46:1,47:1,48:1,49:1,50:1,51:1,52:0,53:1,54:1,55:1,56:1,57:1,59:0,61:0,63:1,64:1,65:1,66:1,67:1,68:1,69:1,70:1,71:1,72:1,73:1,74:1,75:1,76:1,77:1,78:1,79:1,80:1,81:1,82:1,83:1,84:1,85:1,86:1,87:1,88:1,89:1,90:1,91:1,92:1,93:1,94:1,95:1,96:0,97:1,98:1,140:1,141:1,142:0,143:1,144:1,145:1,146:0,147:1,148:1,149:1,150:1,151:1,152:1,153:1};
// Key-Art der Legenden/Mythischen (Hintergrund, nicht freigestellt): Bildausschnitt-Fokus [x %, y %] auf Kopf/Oberkörper für runde/kleine Ausschnitte
const ART_FOCUS={140:[54,30],141:[62,24],142:[50,26],143:[58,28],144:[60,30],145:[56,30],146:[54,28],147:[52,32],148:[58,28],149:[62,32],150:[56,32],151:[66,40],152:[54,30],153:[46,32]};
const ART_IMG={},ART_SHC={},ART_WAIT={},ART_OPQ={},ART_CUT={},ART_HUEC={};
function artNum(id){const n=+id;return Number.isInteger(n)&&n>0&&(typeof MONS==='undefined'||n<MONS.length)?n:0;}
function artSrc(id){const S=window.ART_SRC,n=artNum(id);return(n&&S&&S[n])||null;}
function hasArt(id){return!!artSrc(id);}
function artFace(id){return ART_FACE[id]??0;}
// Gerahmt = Key-Art mit Hintergrund: Legenden/Mythische, außer ihr Bild ist nachweislich freigestellt (dann auch 3D-Sprite)
function artFramed(id){if(!hasArt(id))return false;if(ART_OPQ[id]!=null)return ART_OPQ[id];const M=typeof MONS!=='undefined'&&MONS[id];return!!(M&&(M.legend||M.myth));}
// Glanzform: Farbton-Drehung (Grad) – aus ART_HUE (10-mon3d) oder aus der Glanz-Palette der Art abgeleitet (gleiche Richtung wie das 3D-Modell)
function artHue(id){if(typeof ART_HUE!=='undefined'&&ART_HUE[id]!=null)return ART_HUE[id];if(ART_HUEC[id]!=null)return ART_HUEC[id];const M=typeof MONS!=='undefined'&&MONS[id];let d=150;
 try{if(M&&M.shinyCols&&M.sp&&window.THREE){const a={},b={};new THREE.Color(M.sp[1]).getHSL(a);new THREE.Color(M.shinyCols[0]).getHSL(b);const q=((b.h-a.h)*360+540)%360-180;if(Math.abs(q)>=25&&a.s>=.12&&b.s>=.12)d=Math.round(q);}}catch(e){}
 return ART_HUEC[id]=d;}
// ---------- Robustes Laden (Agent Kreaturenbilder, 12.11., docs/bilder.md) ----------
// Vorher: 105 Bilder gleichzeitig beim Start, ein einziger Fehlversuch (Netz kurz weg, Service Worker liefert HTML statt Bild, Dekodier-Fehler bei Speicherdruck)
// setzte ART_BAD für immer → Dex/Team zeigten das kaputte <img> (iPhone: „?“), Welt/Kampf fielen dauerhaft auf Ersatzmodelle zurück.
// Jetzt: Warteschlange (max. 4 parallel, sichtbare Bilder zuerst), Dekodieren per img.decode() (Rückfall: Probezeichnung), 3 Wiederholungen mit Pause
// (0,6 s / 1,8 s / 5 s; ab dem 2. Wiederholen mit Cache-Umgehung), ART_BAD erst nach endgültigem Fehler und nach 20 s (oder „online“/Rückkehr in die App) wieder frei.
// Ereignis window 'artstate' {id,ok} meldet jedes Endergebnis (50-artsafe füllt damit Ersatzbilder nach).
const ARTQ={max:4,run:0,q:[],st:{},n:{},good:{}};
function artLoad(id,hi){const n=artNum(id);if(!n)return null;if(!artSrc(n))return null;const st=ARTQ.st[n];
 if(!st){ARTQ.st[n]='q';if(hi)ARTQ.q.unshift(n);else ARTQ.q.push(n);artPump();}
 else if(hi&&st==='q'){const i=ARTQ.q.indexOf(n);if(i>0){ARTQ.q.splice(i,1);ARTQ.q.unshift(n);}}
 return ART_IMG[n]||(ART_IMG[n]=new Image());}
function artPump(){while(ARTQ.run<ARTQ.max&&ARTQ.q.length){const n=ARTQ.q.shift();if(ARTQ.st[n]==='q')artFetch(n);}}
function artDrawable(im){try{const c=document.createElement('canvas');c.width=c.height=2;const x=c.getContext('2d');if(!x)return false;x.drawImage(im,0,0,2,2);return true;}catch(e){return false;}}
function artFetch(n){ARTQ.run++;ARTQ.st[n]='l';const k=ARTQ.n[n]||0,s=artSrc(n),url=k>=2&&!/^(data|blob):/.test(s)?s+(s.includes('?')?'&':'?')+'r'+k+'='+(Date.now()%1e7):s;
 const im=new Image();im.decoding='async';let end=0;
 const fin=ok=>{if(end)return;end=1;clearTimeout(to);im.onload=im.onerror=null;ARTQ.run--;
  if(ok){ART_IMG[n]=im;ARTQ.st[n]='ok';ARTQ.good[n]=url;delete ARTQ.n[n];if(typeof ART_BAD!=='undefined'&&ART_BAD[n])delete ART_BAD[n];if(ART_CUT[n]===false&&!artFramed(n))delete ART_CUT[n];artProbe(n,im);artDone(n,true);}
  else{const c=ARTQ.n[n]=k+1;if(c<=3){ARTQ.st[n]='w';setTimeout(()=>{if(ARTQ.st[n]!=='w')return;ARTQ.st[n]='q';ARTQ.q.unshift(n);artPump();},[600,1800,5000][c-1]*(1+Math.random()*.25));}
   else{ARTQ.st[n]='bad';if(typeof ART_BAD!=='undefined')ART_BAD[n]=1;artDone(n,false);setTimeout(()=>artUnbad(n),20000);}}
  artPump();};
 const to=setTimeout(()=>fin(false),k?15000:10000);
 im.onload=()=>{if(!im.naturalWidth)return fin(false);if(!im.decode)return fin(artDrawable(im));im.decode().then(()=>fin(true),()=>fin(!!im.naturalWidth&&artDrawable(im)));};
 im.onerror=()=>fin(false);im.src=url;}
function artDone(n,ok){const W=ART_WAIT[n];delete ART_WAIT[n];(W||[]).forEach(f=>{try{f();}catch(e){}});try{dispatchEvent(new CustomEvent('artstate',{detail:{id:n,ok}}));}catch(e){}}
// Endgültiger Fehler ist nur vorläufig: nach der Pause wieder anfragbar (ART_BAD frei); Interessenten (50-artsafe) fragen dann erneut an
function artUnbad(n){if(ARTQ.st[n]!=='bad')return;delete ARTQ.st[n];delete ARTQ.n[n];if(typeof ART_BAD!=='undefined')delete ART_BAD[n];try{dispatchEvent(new CustomEvent('artretry',{detail:{id:n}}));}catch(e){}}
function artState(id){return ARTQ.st[artNum(id)]||'';}
function artGoodSrc(id){const n=artNum(id);return ARTQ.good[n]||artSrc(n);}
function artReady(id){const n=artNum(id);if(!n)return false;if(ARTQ.st[n]==='ok'){const im=ART_IMG[n];if(im&&im.naturalWidth)return true;}artLoad(n);return false;}
function artOnLoad(id,f){const n=artNum(id);if(artReady(n))return f();if(!n||!artSrc(n)||ARTQ.st[n]==='bad')return f();(ART_WAIT[n]=ART_WAIT[n]||[]).push(f);}
try{const again=()=>{for(const k in ARTQ.st)if(ARTQ.st[k]==='bad')artUnbad(+k);};addEventListener('online',again);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')again();});}catch(e){}
// Eckpixel prüfen: deckend = Key-Art (gerahmt), sonst freigestellt
function artProbe(id,im){try{const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');x.drawImage(im,0,0,16,16);const d=x.getImageData(0,0,16,16).data,A=i=>d[i*4+3];
 ART_OPQ[id]=[0,15,240,255].filter(i=>A(i)>200).length>=3;}catch(e){/* Bild aus fremder Herkunft: Rahmen-Entscheidung bleibt bei Legende/Mythisch */}}
// Vorladen: alle Arten in die Warteschlange (niedrige Priorität, max. 4 parallel); Promise erfüllt, wenn jede Art ihr Endergebnis hat
function preloadArt(){const S=window.ART_SRC||{};return Promise.all(Object.keys(S).filter(artNum).map(k=>new Promise(res=>{artLoad(+k);artOnLoad(+k,res);})));}
// Glanzform-Bild für Canvas: Pixel mit Farbe im Farbton drehen (Creme/Weiß/Umriss bleiben); bei gesperrten Pixeln Canvas-Filter
function artShinyCanvas(id){if(ART_SHC[id]!==undefined)return ART_SHC[id];const im=artLoad(id);if(!artReady(id))return null;const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d'),hue=artHue(id);
 try{x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data,rot=hue/360;
  for(let i=0;i<p.length;i+=4){if(p[i+3]<8)continue;const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,dd=mx-mn;if(dd<.06)continue;
   const s=l>.5?dd/(2-mx-mn):dd/(mx+mn);if(s<.16)continue;let h=mx===r?(g-b)/dd+(g<b?6:0):mx===g?(b-r)/dd+2:(r-g)/dd+4;h=(h/6+rot+1)%1;
   const q=l<.5?l*(1+s):l+s-l*s,pp=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?pp+(q-pp)*6*t:t<.5?q:t<2/3?pp+(q-pp)*(2/3-t)*6:pp;};p[i]=f(h+1/3)*255;p[i+1]=f(h)*255;p[i+2]=f(h-1/3)*255;}
  x.putImageData(d,0,0);}
 catch(e){x.clearRect(0,0,c.width,c.height);if('filter' in x){x.filter=`hue-rotate(${hue}deg)`;x.drawImage(im,0,0);x.filter='none';}else return ART_SHC[id]=null;}
 return ART_SHC[id]=c;}
// ---------- Freistellung für 3D-Sprites: gemalte Boden-Platte (helle, graue Ellipse unter den Füßen) entfernen, auf Inhalt zuschneiden ----------
// Ergebnis: Canvas (Breite/Höhe = Inhalt) – null solange das Bild lädt, false wenn ungeeignet (gerahmt / gesperrte Pixel)
function artCut(id){if(ART_CUT[id]!==undefined)return ART_CUT[id];if(!artReady(id))return null;if(artFramed(id))return ART_CUT[id]=false;const im=ART_IMG[id],w=im.naturalWidth,h=im.naturalHeight;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0);let D;
 try{D=x.getImageData(0,0,w,h);}catch(e){return ART_CUT[id]=false;}/* gesperrte Pixel: nur 3D fällt zurück (sprSize setzt ART_BAD), 2D zeichnet das Bild weiter */
 const p=D.data,box=()=>{let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++)if(p[(y*w+xx)*4+3]>16){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y;y1=y;}return[x0,y0,x1,y1];};
 let[,y0,,y1]=box();if(y1<0)return ART_CUT[id]=false;artPlate(p,w,h,y0,y1);x.putImageData(D,0,0);const[X0,Y0,X1,Y1]=box();if(X1<0)return ART_CUT[id]=false;
 const o=document.createElement('canvas');o.width=X1-X0+1;o.height=Y1-Y0+1;o.getContext('2d').drawImage(c,X0,Y0,o.width,o.height,0,0,o.width,o.height);return ART_CUT[id]=o;}
function artPlate(p,w,h,y0,y1){const band=y1-Math.floor((y1-y0)*.26),N=w*h,seen=new Uint8Array(N),Q=new Int32Array(N);let qh=0,qt=0;
 const L=i=>{const r=p[i*4],g=p[i*4+1],b=p[i*4+2];return(Math.max(r,g,b)+Math.min(r,g,b))/510;},S=i=>(Math.max(p[i*4],p[i*4+1],p[i*4+2])-Math.min(p[i*4],p[i*4+1],p[i*4+2]))/255;
 const pl=i=>p[i*4+3]>8&&S(i)<.16&&L(i)>.7,seed=i=>{if(!seen[i]&&pl(i)){seen[i]=1;Q[qt++]=i;}};
 for(let y=band;y<=y1;y++){let a=-1,b=-1;for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>16){if(a<0)a=x;b=x;}if(a>=0){seed(y*w+a);seed(y*w+b);}}
 for(let x=0;x<w;x++)for(let y=y1;y>=Math.max(band,y1-2);y--)seed(y*w+x);
 while(qh<qt){const i=Q[qh++],x=i%w,y=(i/w)|0,li=L(i);const nb=[x+1<w?i+1:-1,x>0?i-1:-1,y+1<h?i+w:-1,y-1>=band?i-w:-1];
  for(const j of nb)if(j>=0&&!seen[j]&&pl(j)&&Math.abs(L(j)-li)<.07){seen[j]=1;Q[qt++]=j;}}
 for(let i=0;i<N;i++)if(seen[i])p[i*4+3]=0;
 for(let y=band;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,al=p[i*4+3];if(!al||al>=250||seen[i])continue;if(S(i)<.25&&((x+1<w&&seen[i+1])||(x>0&&seen[i-1])||(y+1<h&&seen[i+w])||(y>0&&seen[i-w])))p[i*4+3]=0;}
 return qt;}
// Element-Farbfeld (weiches radiales Licht aus den Typfarben)
function artRgba(h,a){const n=parseInt(h.slice(1),16);return`rgba(${n>>16},${n>>8&255},${n&255},${a})`;}
function artField(id){const t=(MONS[id]&&MONS[id].t)||['kern'],c1=TYPES[t[0]].c,c2=TYPES[t[1]||t[0]].c;
 return`radial-gradient(ellipse 62% 48% at 50% 64%,${artRgba(c1,.42)},${artRgba(c1,.14)} 58%,${artRgba(c1,0)} 76%),radial-gradient(circle at 74% 26%,${artRgba(c2,.3)},${artRgba(c2,0)} 46%),radial-gradient(circle at 50% 45%,#fff,var(--ui2,#eef2f6) 78%)`;}
// Fallback-Bild ohne Illustration: 3D-Vorschaubild als data-URI (gecacht)
const ART_FB={};function artFallbackSrc(id){if(ART_FB[id])return ART_FB[id];try{const T=typeof monThumb==='function'&&window.THREE&&monThumb(id);if(T&&T.img)return ART_FB[id]=T.img.toDataURL('image/png');}catch(e){}return null;}
// HTML-Variante (String): Bild mit Kontaktschatten, Schwebe-Animation, Glanz-Funkeln; Key-Art gerahmt (cover, Himmelsrahmen); ohne Illustration → 3D-Vorschaubild
function artImg(id,cls,o){o=o||{};const has=hasArt(id),s=has?artGoodSrc(id):artFallbackSrc(id);if(has)artLoad(id,true);if(!s)return'';const fr=has&&artFramed(id),sh=o.shiny&&has&&artHue(id),F=ART_FOCUS[id]||[50,30];
 const st=fr?`--fx:${F[0]}%;--fy:${F[1]}%`:o.field?`background:${artField(id)}`:'';
 return`<span class="art${cls?' '+cls:''}${o.dim?' dim':''}${o.shiny?' shiny':''}${o.field||fr?' field':''}${fr?' framed':''}${has?'':' fb'}"${has?` data-art="${id}"`:''}${st?` style="${st}"`:''}>${fr?'':'<i class="artSh" aria-hidden="true"></i>'}<img src="${s}" alt="${o.alt||''}" draggable="false" decoding="async"${has?' onerror="artImgErr(this)"':''}${sh?` style="--hue:${artHue(id)}deg"`:''}>${o.shiny?'<i class="artSp" aria-hidden="true"></i>':''}${fr?'<i class="artFr" aria-hidden="true"></i>':''}</span>`;}
// DOM-Variante in fester Größe (ersetzt die Canvas-Miniatur, wenn eine Illustration existiert); o.h = abweichende Höhe (gerahmte Karte)
function artEl(id,size,o){o=o||{};const w=document.createElement('span');w.innerHTML=artImg(id,'mini',o);const el=w.firstChild;if(!el)return null;
 el.style.width=size+'px';el.style.height=(o.h||size)+'px';el.style.setProperty('--fl',Math.max(1,Math.min(3,size*.022)).toFixed(1)+'px');if(size<60)el.classList.add('sm');
 const img=el.querySelector('img');if(o.shiny&&hasArt(id)&&artHue(id))img.classList.add('hue');if(o.still||size<40)el.classList.add('still');return el;}
// Detail-Bühne (Dex/Team): Illustration auf Element-Farbfeld bzw. Key-Art als große gerahmte Karte; Umschalter zur drehbaren 3D-Ansicht
function artStage(id,size,o){o=o||{};const d=document.createElement('div'),fr=artFramed(id);d.className='artStage'+(fr?' big':'');
 const pic=fr?artEl(id,Math.round(size*1.8),Object.assign({h:Math.round(size*2.25)},o)):(typeof cardPic==='function'?cardPic(id,size,{field:true,shiny:!!o.shiny,dim:!!o.dim,stage:true}):artEl(id,size,Object.assign({field:true},o)));d.appendChild(pic);
 if(fr){const M=MONS[id];d.insertAdjacentHTML('beforeend',`<span class="artTag">${M.myth?'Mythisch':'Legendär'}</span>`);}
 if(!o.no3d&&window.THREE&&typeof viewer3d==='function'){const b=document.createElement('button');b.type='button';b.className='art3d';b.textContent='3D';b.title='Zwischen Illustration und 3D-Modell wechseln';b.setAttribute('aria-pressed','false');let v=null;
  b.onclick=e=>{e.stopPropagation();const on=b.getAttribute('aria-pressed')!=='true';if(on){v=viewer3d(id,size,o.mon&&typeof monOpts==='function'?monOpts(o.mon):{shiny:!!o.shiny});if(!v)return;pic.replaceWith(v);b.textContent='Bild';}
   else{if(v&&v.parentNode)v.replaceWith(pic);b.textContent='3D';}b.setAttribute('aria-pressed',String(on));try{sfx('tap');}catch(_){}};d.appendChild(b);}
 return d;}
// ---------- Canvas ----------
// drawArt: Illustration in Box (x,y,w,h) einpassen (contain, nie verzerren), Boden unten bündig; flip = waagerecht spiegeln; o.cover = füllen mit Fokus (Key-Art)
// Bildqualität (12.11.): Quelle in der Auflösung, die das Ziel in Gerätepixeln braucht (artPicSrc in 50-artsafe: Halbierungsstufen statt 512→60 px in einem
// Schritt = pixelig/körnig), imageSmoothingQuality 'high'; o.cut = Boden-Platte entfernt und auf Inhalt zugeschnitten (wie die 3D-Sprites)
function drawArt(ctx,id,x,y,w,h,flip,o){o=o||{};if(!artReady(id))return false;const base=ART_IMG[id],sh=!!(o.shiny&&artHue(id));let src=null;
 try{if(typeof artPicSrc==='function'){let kd=1;try{const m=ctx.getTransform&&ctx.getTransform();if(m)kd=Math.hypot(m.a,m.b)||1;}catch(e){}
  const bw=base.naturalWidth,bh=base.naturalHeight,S=Math.max(bw,bh),kk=o.cover?Math.max(w/bw,h/bh):Math.min(w/bw,h/bh)*(o.cut?1.35:1);
  src=artPicSrc(id,S*kk*kd,{shiny:sh,cut:!!o.cut&&!o.cover});}}catch(e){src=null;}
 if(!src){src=base;if(sh){const s=artShinyCanvas(id);if(s)src=s;}}
 const iw=src.naturalWidth||src.width,ih=src.naturalHeight||src.height;if(!iw||!ih)return false;ctx.save();if(o.alpha!==undefined)ctx.globalAlpha*=o.alpha;
 ctx.imageSmoothingEnabled=true;try{ctx.imageSmoothingQuality='high';}catch(e){}
 if(o.cover){const F=ART_FOCUS[id]||[50,30],k=Math.max(w/iw,h/ih),sw=w/k,sh2=h/k,sx=Math.max(0,Math.min(iw-sw,iw*F[0]/100-sw/2)),sy=Math.max(0,Math.min(ih-sh2,ih*F[1]/100-sh2*.42));ctx.drawImage(src,sx,sy,sw,sh2,x,y,w,h);ctx.restore();return true;}
 const k=Math.min(w/iw,h/ih),dw=iw*k,dh=ih*k,dx=x+(w-dw)/2,dy=y+(h-dh)*(o.valign??1);
 if(flip){ctx.translate(dx+dw/2,0);ctx.scale(-1,1);ctx.drawImage(src,-dw/2,dy,dw,dh);}else ctx.drawImage(src,dx,dy,dw,dh);ctx.restore();return true;}
// Gerahmte Key-Art als Portrait-Karte auf Canvas (2D-Kampf): abgerundet, Himmelsrahmen, Funkeln
function drawFramedArt(c,id,x,fy,w,h,t,alpha,o){c.save();if(alpha!==undefined)c.globalAlpha*=alpha;const r=Math.min(w,h)*.14,X=x-w/2,Y=fy-h;
 c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(x,fy,w*.46,w*.09,0,0,7);c.fill();
 const path=()=>{c.beginPath();c.moveTo(X+r,Y);c.arcTo(X+w,Y,X+w,Y+h,r);c.arcTo(X+w,Y+h,X,Y+h,r);c.arcTo(X,Y+h,X,Y,r);c.arcTo(X,Y,X+w,Y,r);c.closePath();};
 c.save();path();c.clip();drawArt(c,id,X,Y,w,h,false,{cover:true,shiny:o&&o.shiny});const g=c.createLinearGradient(0,Y,0,Y+h);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(20,16,60,.18)');c.fillStyle=g;c.fillRect(X,Y,w,h);c.restore();
 const bg=c.createLinearGradient(X,Y,X+w,Y+h);bg.addColorStop(0,'#bfe4ff');bg.addColorStop(.35,'#ffffff');bg.addColorStop(.65,'#ffd98a');bg.addColorStop(1,'#c9b2ff');c.strokeStyle=bg;c.lineWidth=Math.max(1.2,w*.035);path();c.stroke();
 const tt=(t||0)/600;for(let i=0;i<3;i++){const k=.5+.5*Math.sin(tt*2+i*2.1),sx=X+w*[.18,.84,.7][i],sy=Y+h*[.12,.2,.86][i],s=Math.max(1.2,w*.04)*k;c.fillStyle=`rgba(255,248,210,${.4+.6*k})`;c.beginPath();c.moveTo(sx,sy-s*2);c.lineTo(sx+s*.5,sy);c.lineTo(sx,sy+s*2);c.lineTo(sx-s*.5,sy);c.closePath();c.fill();}
 c.restore();return true;}
// Ersatz für drawMon mit gleicher Bedeutung: (x,y) Mitte, Füße bei y+size·Größe·0,42; faceLeft = Kreatur soll nach links schauen
function drawMonArt(c,id,x,y,size,faceLeft,t,alpha,o){if(!hasArt(id)||!artReady(id))return drawMon(c,id,x,y,size,faceLeft,t,alpha);o=o||{};
 const M=MONS[id],sc=(M&&M.sp[4])||.8,fy=y+size*sc*.42;
 if(artFramed(id)){const h=Math.max(30,Math.min(size*.98,fy-8)),bob=RED?0:Math.sin((t||0)/700)*size*.01;return drawFramedArt(c,id,x,fy+2-Math.abs(bob),h*.77,h,t,alpha,o);}
 const bh=size*sc*1.12,bw=size*sc*1.4,bob=RED?0:Math.sin((t||0)/520)*size*.012,f=artFace(id),mir=faceLeft?f>0:f<0;
 c.save();if(alpha!==undefined)c.globalAlpha=alpha;c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(x,fy,size*sc*(.34-bob*.004),size*sc*.075,0,0,7);c.fill();c.restore();
 drawArt(c,id,x-bw*.43,fy-bh*.86+size*sc*.02-Math.abs(bob),bw*.86,bh*.86,mir,{shiny:o.shiny,alpha,cut:true});return true;}
// 2D-Kampf: drawMon zeichnet dort die Illustration (Glanz aus dem Kampfzustand); 24-capture umhüllt drawMon weiter (Fang-Ausblendung bleibt)
let ARTCTX=null;
drawMon=(o=>function(c,id,x,y,size,flip,t,alpha){if(ARTCTX&&hasArt(id)&&artReady(id)){const m=flip?ARTCTX.foe:ARTCTX.me;return drawMonArt(c,id,x,y,size*1.08,flip,t,alpha,{shiny:!!(m&&m.s===id&&m.shiny)});}return o.apply(this,arguments);})(drawMon);
drawBattle2D=(o=>function(){ARTCTX=B?{foe:B.foe[B.fi],me:G.team[B.mi]}:{};try{return o.apply(this,arguments);}finally{ARTCTX=null;}})(drawBattle2D);
// ---------- Begegnungs-Banner: kurze Bildeinblendung beim Auftauchen einer wilden Kreatur ----------
function artEncounter(o){if(!B||!o||o.trainer)return;const m=B.foes&&B.foes[0];if(!m||!hasArt(m.s)||SET.banim===0)return;const bt=$('#battle');if(!bt)return;
 const old=bt.querySelector('.artEnc');if(old)old.remove();const M=MONS[m.s],d=document.createElement('div');d.className='artEnc'+(RED?' red':'')+(artFramed(m.s)?' leg':'');d.setAttribute('aria-hidden','true');d.style.setProperty('--tc',TYPES[M.t[0]].c);
 d.innerHTML=`<div class="aeIn">${artImg(m.s,'aePic',{field:true,shiny:m.shiny})}<div class="aeTx"><small>${M.myth?'Mythische Begegnung':o.legend||B.legend||M.legend?'Legendäre Begegnung':o.ambush?'Überraschung!':'Wilde Begegnung'}</small><b>${M.n}${m.shiny?' ✦':''}</b><span class="chips">${typeof chips==='function'?chips(M.t):''}</span></div></div>`;
 bt.appendChild(d);setTimeout(()=>d.classList.add('out'),RED?1200:1700);setTimeout(()=>d.remove(),RED?1500:2300);}
startBattleNow=(o=>function(opts){const r=o.apply(this,arguments);try{artEncounter(opts);}catch(e){}return r;})(startBattleNow);
// ---------- Starterwahl: drei große Karten (001/004/007) über dem Dialog; Tippen auf eine Karte stellt die Frage für diese Kreatur ----------
function artStarter(n){const S=(typeof npcs==='function'?npcs():[]).filter(q=>q.t==='starter').sort((a,b)=>a.x-b.x);if(S.length<2||!$('#screen'))return;
 let ov=$('#artStart');if(!ov){ov=document.createElement('div');ov.id='artStart';ov.className='artStart';document.body.appendChild(ov);}ov.classList.remove('out','picked');
 // Platz: im Hochformat unter dem Spielbild (dort ist Luft), sonst oben im Spielbild unter der Kopfleiste
 const R=$('#screen').getBoundingClientRect(),below=innerHeight-R.bottom>230;ov.classList.toggle('below',below);Object.assign(ov.style,{left:R.left+'px',width:R.width+'px',top:(below?R.bottom+10:R.top+44)+'px'});
 ov.innerHTML=`<p class="asHead">Wähle deinen ersten Partner</p><div class="asRow">${S.map(q=>{const M=MONS[q.mon];return`<button type="button" class="asCard${q===n?' on':''}" data-x="${q.x}" style="--tc:${TYPES[M.t[0]].c}" aria-pressed="${q===n}" aria-label="${M.n}, ${M.t.map(t=>TYPES[t].n).join(' und ')}">${artImg(q.mon,'asPic',{field:true})}<small>${typeof dexNr==='function'?dexNr(q.mon):'#'+q.mon}</small><b>${M.n}</b><span class="chips">${typeof chips==='function'?chips(M.t):''}</span></button>`;}).join('')}</div>`;
 ov.querySelectorAll('.asCard').forEach(b=>b.onclick=e=>{e.stopPropagation();const q=S.find(z=>z.x===+b.dataset.x);if(q&&q!==n){try{sfx('tap');}catch(_){}if(q.mon&&typeof playCry==='function')try{playCry(q.mon);}catch(_){}talk(q);}});
 clearInterval(artStarter.iv);artStarter.iv=setInterval(()=>{const chosen=G&&G.flags&&G.flags.starter;if(!chosen&&mode==='dialog'&&!$('#dlg').hidden)return;clearInterval(artStarter.iv);
  if(chosen){ov.classList.add('picked');const t=G.team[0]&&G.team[0].s;ov.querySelectorAll('.asCard').forEach(b=>{const q=S.find(z=>z.x===+b.dataset.x);b.classList.toggle('on',!!q&&q.mon===t);});}
  ov.classList.add('out');setTimeout(()=>ov.remove(),chosen&&!RED?1100:260);},120);}
const _talkArt=talk;talk=function(n){const r=_talkArt.apply(this,arguments);try{if(n&&n.t==='starter'&&G&&!G.flags.starter&&mode==='dialog')artStarter(n);}catch(e){}return r;};
// ---------- Schlüpfen: Ei wackelt, Risse, Licht, Kreatur erscheint (Bild, sonst 3D-Vorschaubild). Wird nur gesetzt, wenn noch keine Sequenz existiert ----------
async function artHatch(o){o=o||{};const m=o.mon;if(!m||!MONS[m.s])return{};const pm=mode;mode='wait';held=null;const M=MONS[m.s],short=SET.banim===0||RED,tc=TYPES[M.t[0]].c;
 const ov=document.createElement('div');ov.className='hatchOv';ov.style.setProperty('--tc',tc);ov.setAttribute('role','dialog');ov.setAttribute('aria-live','polite');
 ov.innerHTML=`<div class="hStage"><div class="hEgg" aria-hidden="true"><i class="hCrack"></i></div><div class="hMon">${artImg(m.s,'hPic',{shiny:m.shiny})}</div><i class="hBurst" aria-hidden="true"></i></div><p class="hTx"></p>`;
 document.body.appendChild(ov);const tx=ov.querySelector('.hTx'),W=ms=>new Promise(r=>setTimeout(r,short?ms*.3:ms));let skip=false;ov.addEventListener('pointerdown',()=>{skip=true;});
 try{tx.textContent='Oh? Das Ei bewegt sich!';ov.classList.add('wob');try{sfx('tap');}catch(e){}await W(1500);
  if(!skip){ov.classList.add('crack');try{sfx('capShake');}catch(e){}await W(900);}ov.classList.add('burst');try{sfx('evoBurst');vib([20,30,60]);}catch(e){}await W(450);
  ov.classList.add('reveal');try{if(typeof playCry==='function')playCry(m.s);}catch(e){}tx.textContent=(m.nickname||M.n)+' ist geschlüpft!'+(m.shiny?' Es funkelt!':'');await W(2000);}
 finally{ov.classList.add('out');setTimeout(()=>ov.remove(),RED?0:260);if(mode==='wait')mode=pm==='wait'?'world':pm;}
 return{ok:true};}
if(typeof SEQ!=='undefined'&&!SEQ.hatch)SEQ.hatch=artHatch;
// 3D-Nachbau-Daten (10-mon3d ART3D) sicher angewendet
try{if(typeof applyArt3D==='function')applyArt3D();}catch(e){}
// Vorladen beim Start (leise; nur Arten, keine Orts-/Regionsbilder)
try{preloadArt();}catch(e){}
