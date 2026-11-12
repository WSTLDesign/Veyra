// ===== VEYRA – Bildsicherheit & einheitliche Bildqualität der Kreaturenbilder (Agent Kreaturenbilder, Opus hoch, 12.11.; docs/bilder.md) =====
// Ziel 9: Dex, Team, Lager, Kampf zeigen immer ein Bild – nie ein „?“. Ladeweg (Warteschlange, Wiederholen, Dekodieren, ART_BAD-Pause) sitzt in 26-art.js,
// das zentrale Kartenbild (cardPic) in 24-capture.js. Hier: Auflösung passend zum Ziel (artPicSrc), Speicher-Haushalt (begrenzte Zwischenspeicher, Freigabe
// bei Speicherdruck/Hintergrund, Canvas-Freigabe entfernter Bilder – iOS zählt Canvas-Speicher gesamt), Nachfüllen nach spätem Laden, <img>-Fehler → Ersatz.
// API: artDpr() · artPicSrc(id,px,{shiny,cut})→Canvas|Image · artRelease(alles) · artWatch(id,el) · artTrack(el) · artLazy(el) · artHealDpr()
// Zustand bewusst als var (Funktionen können aus früheren Modulen vor dieser Datei aufgerufen werden)
var ASF={lru:new Map(),bytes:0,max:0,cuts:[],shc:[],watch:new Map(),els:new Set(),io:null,ro:null,taint:false,low:false,jobs:[],jt:0};
function artDpr(){return Math.min(3,Math.max(1,window.devicePixelRatio||1));}
// Heil-Sequenz & andere Vollbild-Canvas: gleiche Pixeldichte wie die Kreaturenbilder (25-evolve begrenzt auf 2 – Vorschlag in docs/bilder.md)
function artHealDpr(){return artDpr();}
// Budget für verkleinerte Bilder: Handy 28 MB, sonst 64 MB (Gerätespeicher, wenn bekannt)
function asMax(){if(ASF.max)return ASF.max;const mob=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent||'')||(navigator.maxTouchPoints>1&&innerWidth<1100),dm=navigator.deviceMemory||0;
 return ASF.max=(mob||(dm&&dm<=4)?28:64)*1048576;}
// Canvas sicher anlegen: scheitert die Zuteilung (iOS-Gesamtgrenze), Zwischenspeicher freigeben und noch einmal versuchen
function asCanvas(w,h){for(let k=0;k<2;k++){try{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');if(x&&c.width===w)return c;}catch(e){}artRelease(true);}return null;}
function asKill(c){try{if(c&&c.getContext){c.width=c.height=0;}}catch(e){}}
// ---------- Auflösungs-Stufen ----------
// Statt 512 px in einem Schritt auf 60 px (bilinear = Treppen/Körnung): Halbierungsstufen bis zur nächsten Stufe ≥ Zielgröße, danach Verhältnis < 2.
const AS_B=[48,64,96,128,192,256,384,512,768,1024];
function asBucket(px,S){for(const b of AS_B)if(b>=px*.92)return Math.min(b,S);return S;}
function asDown(src,sw,sh,t){let cur=src,cw=sw,ch=sh;const f=t/Math.max(sw,sh);const tw=Math.max(1,Math.round(sw*f)),th=Math.max(1,Math.round(sh*f));
 while(cw/2>=tw*1.0&&ch/2>=th){const nw=Math.max(tw,Math.round(cw/2)),nh=Math.max(th,Math.round(ch/2)),c=asCanvas(nw,nh);if(!c)return null;const x=c.getContext('2d');x.imageSmoothingEnabled=true;try{x.imageSmoothingQuality='high';}catch(e){}
  x.drawImage(cur,0,0,cw,ch,0,0,nw,nh);if(cur!==src)asKill(cur);cur=c;cw=nw;ch=nh;}
 if(cw!==tw||ch!==th){const c=asCanvas(tw,th);if(!c)return null;const x=c.getContext('2d');x.imageSmoothingEnabled=true;try{x.imageSmoothingQuality='high';}catch(e){}x.drawImage(cur,0,0,cw,ch,0,0,tw,th);if(cur!==src)asKill(cur);cur=c;}
 if(cur===src){const c=asCanvas(sw,sh);if(!c)return null;c.getContext('2d').drawImage(src,0,0);cur=c;}
 return cur;}
// Boden-Platte entfernen + auf Inhalt zuschneiden (gleicher Algorithmus wie artCut der 3D-Sprites, nur in der Zielauflösung → billig)
function asCutCanvas(c){if(ASF.taint)return c;const w=c.width,h=c.height,x=c.getContext('2d');let D;try{D=x.getImageData(0,0,w,h);}catch(e){ASF.taint=true;return c;}
 const p=D.data,box=()=>{let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++)if(p[(y*w+xx)*4+3]>16){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y;y1=y;}return[x0,y0,x1,y1];};
 const[,y0,,y1]=box();if(y1<0)return c;try{artPlate(p,w,h,y0,y1);}catch(e){return c;}x.putImageData(D,0,0);const[X0,Y0,X1,Y1]=box();if(X1<0)return c;
 const o=asCanvas(X1-X0+1,Y1-Y0+1);if(!o)return c;o.getContext('2d').drawImage(c,X0,Y0,o.width,o.height,0,0,o.width,o.height);asKill(c);return o;}
// Bildquelle für eine Zielgröße (größte Kante in Gerätepixeln); gecacht nach Art/Glanz/Stufe/Zuschnitt, begrenzt (LRU nach Bytes)
function artPicSrc(id,px,o){o=o||{};if(!artReady(id))return null;const im=ART_IMG[id],S=Math.max(im.naturalWidth,im.naturalHeight);if(!S)return null;
 const t=asBucket(Math.max(16,px||S),S),cut=!!o.cut&&!artFramed(id)&&!ASF.taint,key=id+'|'+(o.shiny?1:0)+'|'+t+'|'+(cut?1:0);
 const hit=ASF.lru.get(key);if(hit){ASF.lru.delete(key);ASF.lru.set(key,hit);return hit.c;}
 if(t>=S&&!cut&&!o.shiny)return im;
 let src=im;if(o.shiny){const s=artShinyCanvas(id);if(s)src=s;}
 let c=asDown(src,src.naturalWidth||src.width,src.naturalHeight||src.height,t);if(!c)return src;if(cut)c=asCutCanvas(c);
 const b=c.width*c.height*4;ASF.lru.set(key,{c,b});ASF.bytes+=b;asTrim();return c;}
function asTrim(){const M=ASF.low?asMax()/3:asMax();for(const[k,v]of ASF.lru){if(ASF.bytes<=M)break;ASF.lru.delete(k);ASF.bytes-=v.b;asKill(v.c);}}
// Große Zwischenspeicher (volle Auflösung) begrenzen: Glanz-Canvas ≤ 4, Freistellungen der 3D-Sprites ≤ 18 (werden bei Bedarf neu berechnet)
function asRing(list,cache,id,max){const i=list.indexOf(id);if(i>=0)list.splice(i,1);list.push(id);while(list.length>max){const k=list.shift(),c=cache[k];if(c&&c.getContext){delete cache[k];asKill(c);}}}
artShinyCanvas=(f=>function(id){const had=ART_SHC[id]!==undefined,r=f.apply(this,arguments);if(r&&r.getContext&&!had)asRing(ASF.shc,ART_SHC,id,4);return r;})(artShinyCanvas);
artCut=(f=>function(id){const had=ART_CUT[id]!==undefined,r=f.apply(this,arguments);if(r&&r.getContext){if(!had||ASF.cuts[ASF.cuts.length-1]!==id)asRing(ASF.cuts,ART_CUT,id,18);}return r;})(artCut);
// Speicherdruck / Hintergrund: alles Verkleinerte, Glanz und nicht sichtbare Kartenbilder freigeben (Bilder selbst verwaltet der Browser)
function artRelease(all){for(const v of ASF.lru.values())asKill(v.c);ASF.lru.clear();ASF.bytes=0;
 [[ASF.shc,ART_SHC],[ASF.cuts,ART_CUT]].forEach(([L,C])=>{L.splice(0).forEach(k=>{const c=C[k];if(c&&c.getContext){delete C[k];asKill(c);}});});
 if(all)for(const el of ASF.els){if(!el.isConnected||!asVisible(el))asRel(el);}}
function asVisible(el){const r=el.getBoundingClientRect();return r.width>0&&r.bottom>-50&&r.top<innerHeight+50&&r.right>0&&r.left<innerWidth;}
// ---------- Kartenbilder (cardPic) verwalten ----------
// Freigabe: Backing auf 0 (iOS gibt Canvas-Speicher sonst erst spät frei); sichtbar werden → neu zeichnen (aus dem Zwischenspeicher, schnell)
function asRel(el){const P=el._pic;if(!P||!P.cv.width)return;asKill(P.cv);el._rel=1;}
function asRedraw(el){const P=el._pic;if(!P||!el.isConnected)return;if(el._go)return el._go();asJob(()=>{if(el.isConnected)P.fill(false);});}
function artTrack(el){ASF.els.add(el);asObs();try{ASF.ro&&ASF.ro.observe(el);}catch(e){}try{ASF.io&&ASF.io.observe(el);}catch(e){}}
function artLazy(el){artTrack(el);if(!ASF.io)el._go&&el._go();}
function asObs(){if(ASF.io!==null||ASF.ro!==null)return;
 try{ASF.io=window.IntersectionObserver?new IntersectionObserver(es=>{for(const e of es){const el=e.target;if(e.isIntersecting){if(el._go){const P=el._pic;if(P&&hasArt(P.id))artLoad(P.id,true);asJob(()=>el._go&&el._go());}else if(el._rel)asRedraw(el);}
   else if(el._pic&&el._pic.o.lazy&&!el._go&&e.boundingClientRect.width>0)asRel(el);}},{rootMargin:'600px 200px'}):false;}catch(e){ASF.io=false;}
 try{ASF.ro=window.ResizeObserver?new ResizeObserver(es=>{for(const e of es){const el=e.target,P=el._pic;if(!P||el._go||el._rel||el.dataset.pic==='wait')continue;
   if(picFit(el,P.cv,P.size))asJob(()=>{if(el.isConnected)P.fill(false);});}}):false;}catch(e){ASF.ro=false;}}
// Kleine Arbeitsliste: je Frame höchstens ~8 ms Zeichnen/Verkleinern (Dex-Öffnen ohne Standbild)
function asJob(f){ASF.jobs.push(f);if(!ASF.jt)ASF.jt=requestAnimationFrame(asRun);}
function asRun(){ASF.jt=0;const t0=performance.now();while(ASF.jobs.length&&performance.now()-t0<8){const f=ASF.jobs.shift();try{f();}catch(e){}}if(ASF.jobs.length)ASF.jt=requestAnimationFrame(asRun);}
// Nachfüllen: Bild kam später (oder nach der Fehlerpause doch) → wartende Ersatzbilder ersetzen
function artWatch(id,el){let S=ASF.watch.get(id);if(!S)ASF.watch.set(id,S=new Set());S.add(el);}
addEventListener('artstate',e=>{const{id,ok}=e.detail||{};const S=ASF.watch.get(id);if(!ok||!S)return;ASF.watch.delete(id);
 for(const el of S){if(!el.isConnected)continue;if(el._pic){if(el.dataset.pic!=='ok')asJob(()=>{if(el.isConnected)el._pic.fill(true);});}else if(el._artImg)el._artImg();}});
addEventListener('artretry',e=>{const id=e.detail&&e.detail.id,S=ASF.watch.get(id);if(S&&[...S].some(el=>el.isConnected))artLoad(id,true);else if(S)ASF.watch.delete(id);});
// Aufräumen: entfernte Kartenbilder nach ≥ 2 Durchgängen (8 s) freigeben und vergessen
setInterval(()=>{for(const el of ASF.els){if(el.isConnected){el._dis=0;continue;}if((el._dis=(el._dis||0)+1)>=2){asRel(el);ASF.els.delete(el);try{ASF.io&&ASF.io.unobserve(el);ASF.ro&&ASF.ro.unobserve(el);}catch(e){}}}
 for(const[k,S]of ASF.watch){for(const el of S)if(!el.isConnected)S.delete(el);if(!S.size)ASF.watch.delete(k);}},4000);
// Chronik neu aufbauen/schließen: alte Kartenbilder sofort freigeben (innerHTML='' allein gibt auf iOS keinen Canvas-Speicher zurück)
function asMenuRel(drop){document.querySelectorAll('#mBody .cpic').forEach(el=>{asRel(el);if(!drop)return;ASF.els.delete(el);try{ASF.io&&ASF.io.unobserve(el);ASF.ro&&ASF.ro.unobserve(el);}catch(e){}});}
renderMenu=(f=>function(){try{asMenuRel(true);}catch(e){}return f.apply(this,arguments);})(renderMenu);
closeMenu=(f=>function(){const r=f.apply(this,arguments);try{if($('#menu').hidden)asMenuRel(false);else setTimeout(()=>{if($('#menu').hidden)asMenuRel(false);},400);}catch(e){}return r;})(closeMenu);
// App in den Hintergrund (iOS beendet speicherhungrige Seiten zuerst) → freigeben; zurück → nicht sichtbare Kartenbilder bleiben frei bis sichtbar
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){ASF.low=true;artRelease(true);}else{ASF.low=false;for(const el of ASF.els)if(el._rel&&el.isConnected&&asVisible(el))asRedraw(el);}});
addEventListener('pagehide',()=>{try{artRelease(true);}catch(e){}});
// ---------- <img>-Wege (Begegnung, Starterwahl, Schlüpfen, Key-Art-Karte): Ladefehler → Canvas-Ersatz statt kaputtem Bild, später wieder echtes Bild ----------
// onerror am <img> selbst (artImg) greift auch, wenn der Fehler kommt, bevor das Element im Dokument hängt; Erfassung am Dokument als zweites Netz
function artImgErr(im){const a=im&&im.closest&&im.closest('.art[data-art]');if(a&&!a.classList.contains('artFb'))try{asImgFail(a,im);}catch(err){}}
document.addEventListener('error',e=>{const im=e.target;if(im&&im.tagName==='IMG')artImgErr(im);},true);
function asImgFail(a,im){const id=+a.dataset.art;if(!MONS[id])return;im.style.visibility='hidden';a.classList.add('artFb');let cv=a.querySelector('canvas.artCv');
 const draw=()=>{if(!cv){cv=document.createElement('canvas');cv.className='artCv';cv.setAttribute('aria-hidden','true');a.appendChild(cv);}const d=artDpr(),w=a.offsetWidth||64,h=a.offsetHeight||64;cv.width=Math.round(w*d);cv.height=Math.round(h*d);
  const x=cv.getContext('2d');if(!x)return;x.clearRect(0,0,cv.width,cv.height);const fr=a.classList.contains('framed'),W=cv.width,H=cv.height;
  if(!(artReady(id)&&drawArt(x,id,fr?0:W*.08,fr?0:H*.06,fr?W:W*.84,fr?H:H*.84,false,{cover:fr,cut:!fr})))try{drawMon2D(x,id,W/2,H*.55,Math.min(W,H)*.8,false,0);}catch(err){}};
 let fr0=0;const drawWhen=()=>{if(a.isConnected&&a.offsetWidth||++fr0>30)draw();else requestAnimationFrame(drawWhen);};drawWhen();if(im._asTry>=3)return;a._artImg=()=>{im._asTry=(im._asTry||0)+1;im.onload=()=>{im.style.visibility='';a.classList.remove('artFb');if(cv)asKill(cv),cv.remove();im.onload=null;};im.src=artGoodSrc(id);};
 if(artReady(id))return a._artImg();artWatch(id,a);artLoad(id,true);}
// ---------- Wartend registrierte Arten nach Kampfstart/Begegnung sofort vorne in die Warteschlange ----------
{const _sbnAS=startBattleNow;startBattleNow=function(){const r=_sbnAS.apply(this,arguments);try{if(B){(B.foe||[]).concat(G.team||[]).forEach(m=>{if(m&&hasArt(m.s))artLoad(m.s,true);});}}catch(e){}return r;};}
