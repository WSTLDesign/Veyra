// ===== VEYRA – Intro (Loop B1): Prof. Veyran, Held/Heldin + Name, Rivalen Rayan & Mira, Starterwahl, Chronik + Fangkapseln · Übergänge (SEQ.intro, doorFade, areaBanner, fastTravel, ferry) =====
// Spielfigur-Aussehen: G.outfit = {body 'held'|'heldin', skin, hair, hairCol, top (Jacke), pants, cap, capCol} – Darstellung über heroLook() (34-figures) und drawFigure() (08-gfx)
//  hair ∈ OUTFIT.hair[].k ('kurz'|'wuschel'|'zopf'|'lang'|'dutt'); Held = Wuschel + Schutzbrille, Heldin = hoher Pferdeschwanz (zopf) + Cap
const OUTFIT={skin:['#fbe2cc','#f6d3b3','#e2b48c','#c98f62','#9a6440','#6b4430'],
 hair:[{k:'kurz',n:'Kurz'},{k:'wuschel',n:'Wuschel'},{k:'zopf',n:'Zopf'},{k:'lang',n:'Lang'},{k:'dutt',n:'Dutt'}],
 hairCol:['#7a4a26','#a4532a','#2a1d16','#d9a441','#c8462e','#e9e6e0','#4a5fb0'],
 top:['#3f7a3a','#2f6fb0','#b8433a','#6a4a9a','#1f8a7a','#d9822b','#3a3f4a','#e8623a'],
 pants:['#6a4a30','#7a5a3a','#26304a','#3f6a48','#8a8f9e','#2a2a2a'],
 capCol:['#efe6d2','#4c8a3c','#1f8a7a','#3d8fe0','#7d5aa6','#2a3346']};
function defaultOutfit(){return{body:'held',skin:'#f6d3b3',hair:'wuschel',hairCol:'#7a4a26',top:'#3f7a3a',pants:'#6a4a30',cap:false,capCol:'#efe6d2'};}
function outfitOf(){const d=defaultOutfit();return Object.assign(d,(typeof G!=='undefined'&&G&&G.outfit)||{});}
// Körper wechseln: Kanon-Frisur/Kopfbedeckung je Figur, Farben bleiben (Kanon-Grundfarben werden mitgetauscht)
function outfitBody(O,b){const her=b==='heldin';O.body=her?'heldin':'held';O.hair=her?'zopf':'wuschel';O.cap=her;O.pants=her?'#7a5a3a':'#6a4a30';
 const sw=(k,a,z)=>{if(O[k]===(her?a:z))O[k]=her?z:a;};sw('hairCol','#7a4a26','#a4532a');sw('top','#3f7a3a','#4c8a3c');return O;}
const SEQ_AUTO=()=>!!(navigator.webdriver&&!window.VEYRA_DEMO);
const ez3=k=>1-Math.pow(1-Math.max(0,Math.min(1,k)),3),ezB=k=>{k=Math.max(0,Math.min(1,k));const c=1.70158;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2);};

// ---------- Spielfigur / Mentor (alte Namen bleiben, zeichnen jetzt die Kanon-Figuren) ----------
function drawHero(c,x,y,s,o,t,opt){opt=opt||{};drawFigure(c,x,y,s,heroLook(o||defaultOutfit()),t,{expr:opt.expr||'freudig',noShadow:opt.noShadow,talk:opt.talk});}
function drawMentor(c,x,y,s,t,talk){drawFigure(c,x,y,s,FIGURES.veyran.look,t,{expr:'freudig',talk});}

// ---------- Fangkapsel (eigene Form: facettierter Kristall mit Lichtkern und Ring) ----------
function drawCapsule(c,x,y,r,t,open){c.save();c.translate(x,y);const a=t/500;
 c.strokeStyle='rgba(255,236,170,.9)';c.lineWidth=r*.12;c.beginPath();c.ellipse(0,0,r*1.25,r*.38,Math.sin(a)*.3,0,7);c.stroke();
 const sp=open?1+open*.6:1;[[0,-1.2],[.78,-.25],[.5,1],[-.5,1],[-.78,-.25]].forEach((p,i,A)=>{const q=A[(i+1)%5];c.fillStyle=i%2?'#bfe9ff':'#e6f7ff';c.beginPath();c.moveTo(0,0);c.lineTo(p[0]*r*sp,p[1]*r*sp);c.lineTo(q[0]*r*sp,q[1]*r*sp);c.closePath();c.fill();});
 c.strokeStyle='rgba(40,70,110,.55)';c.lineWidth=r*.06;c.beginPath();[[0,-1.2],[.78,-.25],[.5,1],[-.5,1],[-.78,-.25]].forEach((p,i)=>{i?c.lineTo(p[0]*r*sp,p[1]*r*sp):c.moveTo(p[0]*r*sp,p[1]*r*sp);});c.closePath();c.stroke();
 const g=c.createRadialGradient(0,0,0,0,0,r*.7);g.addColorStop(0,'#fff');g.addColorStop(.4,'#ffd166');g.addColorStop(1,'rgba(255,170,60,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,r*(.7+.08*Math.sin(t/120)),0,7);c.fill();c.restore();}
// Chronik (eigenes Gerät: Klapp-Tafel mit Blatt-Emblem, Display und Kristall-Knopf)
function drawChronik(c,x,y,s,t){c.save();c.translate(x,y);c.scale(s/100,s/100);c.lineJoin='round';
 c.fillStyle='#2e5a3a';c.beginPath();c.roundRect(-40,-30,80,62,12);c.fill();c.strokeStyle='rgba(20,30,40,.7)';c.lineWidth=2.4;c.stroke();
 const g=c.createLinearGradient(0,-24,0,20);g.addColorStop(0,'#bfefff');g.addColorStop(1,'#5ab0d8');c.fillStyle=g;c.beginPath();c.roundRect(-32,-23,52,40,7);c.fill();
 c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(-28,-20);c.lineTo(-6,-20);c.lineTo(-22,8);c.lineTo(-28,8);c.closePath();c.fill();
 figEmblem(c,'blatt',-6,-3,8,'rgba(30,90,60,.75)');const p=.5+.5*Math.sin(t/300);c.fillStyle=`rgba(216,27,114,${.6+.4*p})`;c.beginPath();c.moveTo(30,-8);c.lineTo(35,-2);c.lineTo(30,4);c.lineTo(25,-2);c.closePath();c.fill();
 c.fillStyle='#e6c35c';c.beginPath();c.arc(30,14,3.4,0,7);c.fill();c.restore();}

// ---------- 3D-Kreatur fürs Intro (Altbestand, nicht mehr genutzt – bleibt für Aufrufer anderer Module) ----------
function introMon3D(cv,id){if(!window.THREE||typeof buildMon3D!=='function')return null;try{
 const r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});r.setClearColor(0,0);const s=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,50);cam.position.set(0,.5,7);cam.lookAt(0,.5,0);
 s.add(new THREE.HemisphereLight('#fff7e8','#3a3050',.95));const m=buildMon3D(id,1.05);s.add(m);
 return{r,s,cam,m,size(w,h){r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();},frame(now){animMon(m,now,{moving:false});r.render(s,cam);},dispose(){try{r.dispose();}catch(e){}}};}catch(e){return null;}}

// ---------- Intro-Ablauf ----------
// Szenen: 1 Veyran + Blättchen (Knospi) + sieben Elemente · 2 Wer bist du? (Held/Heldin, Farben, Name) · 3 Rayan & Mira kommen · 4 Starterwahl mit Rivalen · 5 Chronik + Fangkapseln · 6 Übergang ins Spiel
// Kurze Sätze, je Textkasten höchstens 2 Zeilen. „Überspringen“ überspringt das Gerede bis zur nächsten Entscheidung (Name, Starter).
SEQ.intro=async(o)=>{o=o||{};
 if(o.auto??SEQ_AUTO()){beginGame({name:o.name||'Noa',rival:o.rival||'Lio',outfit:Object.assign(defaultOutfit(),o.outfit||{})});return{auto:true};}
 initAudio();mode='wait';const L=$('#seqL');L.className='layer seq fgIntro';L.hidden=false;L.innerHTML=`<div class="sqStage"><canvas class="sqCv"></canvas></div>
  <div class="sqBox" hidden><span class="sqName">Prof. Veyran</span><p class="sqText"></p><i class="sqMore" aria-hidden="true"></i></div><button class="sqSkip" type="button">Überspringen</button>
  <div class="ccPanel fgCC" hidden></div><div class="fgPick" hidden></div><div class="fgGifts" hidden></div>`;
 const cv=L.querySelector('.sqCv'),box=L.querySelector('.sqBox'),txt=L.querySelector('.sqText'),tag=L.querySelector('.sqName'),skip=L.querySelector('.sqSkip'),panel=L.querySelector('.ccPanel'),pick=L.querySelector('.fgPick'),gifts=L.querySelector('.fgGifts');
 const O=defaultOutfit();let name='Noa',starter=0,riv=null,skipTalk=false;
 const C=(x,s)=>({a:0,x,s:s||1,ex:'neutral',run:0,dir:1});
 const S={t0:performance.now(),spot:0,flash:0,talk:null,elems:0,done:false,heroSilh:1,pet:0,petT:0,cap:null,
  cast:{veyran:C(.5),hero:C(.5),rayan:C(-.2,.94),mira:C(1.2,.94)}};
 S.cast.veyran.ex='freudig';S.cast.rayan.ex='stolz';S.cast.mira.ex='freudig';
 let W=0,H=0,dpr=1;const fit=()=>{dpr=Math.min(2,devicePixelRatio||1);W=cv.clientWidth||innerWidth;H=cv.clientHeight||innerHeight;cv.width=W*dpr;cv.height=H*dpr;};fit();addEventListener('resize',fit);
 const land=()=>W>H*1.15;
 // Bühne: im Querformat links neben dem Panel; Figuren stehen über dem Textkasten
 const lay=()=>{const pOpen=!panel.hidden,top=!pick.hidden||!gifts.hidden,pw=pOpen&&land()?panel.getBoundingClientRect().width:0,lw=W-pw,base=land()?(pOpen?H*.9:H*.76):(pOpen?H*.36:H*.66),sz=land()?Math.min(H*(pOpen?.7:top?.4:.56),lw*.42):Math.min(H*(pOpen?.28:top?.3:.36),W*.5);return{lw,base,sz};};
 // Text: Sprecher-ID oder '' (Erzähler); Platzhalter {name} {starter} {rmon} …
 let tw=null,adv=null;const vars={};
 const fill=s=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k==='name'?(name||'du'):vars[k]??m);
 const tap=()=>{if(tw&&!tw.done()){tw.finish();return;}if(adv){const a=adv;adv=null;sfx('tap');a();}};
 const line=(who,s,ex)=>new Promise(res=>{if(skipTalk)return res();const F=who==='hero'?playerFig():FIGURES[who];if(F&&S.cast[who])S.cast[who].ex=ex||'freudig';
  box.hidden=false;S.talk=who;tag.textContent=who==='hero'?name:F?F.n:'';tag.hidden=!F;tag.style.background=F?(F.look.sig||F.look.emblemCol||F.look.top):'';if(who==='veyran')tag.style.background='#3f7a3a';
  tw=typeInto(txt,fill(s),false,voiceOf(F?F.n:'Erzähler'));const ck=setInterval(()=>{if(tw.done()){S.talkDone=1;box.classList.add('ready');clearInterval(ck);}},60);S.talkDone=0;
  adv=()=>{clearInterval(ck);box.classList.remove('ready');res();};});
 const wait=ms=>new Promise(r=>setTimeout(r,RED||skipTalk?Math.min(ms,60):ms));
 L.querySelector('.sqStage').addEventListener('pointerdown',tap);box.addEventListener('pointerdown',tap);
 const kd=e=>{if(['Enter','Space'].includes(e.code)&&!(e.target&&/INPUT|BUTTON/.test(e.target.tagName))){e.preventDefault();tap();}};document.addEventListener('keydown',kd);
 skip.onclick=e=>{e.stopPropagation();skipTalk=true;if(tw&&!tw.done())tw.finish();if(adv){const a=adv;adv=null;a();}};
 const tween=(obj,key,to,ms)=>new Promise(res=>{const from=obj[key],t0=performance.now(),d=RED||skipTalk?1:ms;const f=n=>{const k=Math.min(1,(n-t0)/d);obj[key]=from+(to-from)*ez3(k);if(k<1&&!S.done)requestAnimationFrame(f);else res();};requestAnimationFrame(f);});
 const enter=(id,x,ms)=>{const c=S.cast[id];c.run=1;c.dir=x>c.x?1:-1;c.a=1;return tween(c,'x',x,ms||700).then(()=>{c.run=0;});};
 const off=c=>document.createElement('canvas');const silhCv=off();
 // ---- Zeichnen
 const frame=now=>{if(S.done)return;const c=cv.getContext('2d'),T=(now-S.t0)/1000;c.setTransform(dpr,0,0,dpr,0,0);const{lw,base,sz}=lay();
  const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,figLerp('#05070f','#1d2a4a',S.spot));bg.addColorStop(1,figLerp('#05070f','#3a2e3e',S.spot));c.fillStyle=bg;c.fillRect(0,0,W,H);
  if(S.spot>0){c.save();c.globalAlpha=S.spot;
   // ferne Silhouette: Kristallturm von Aurenstadt im Dunst
   const tx=lw*.82,ty=base-sz*1.05;c.fillStyle='rgba(120,150,210,.18)';c.beginPath();c.moveTo(tx-sz*.05,base-sz*.3);c.lineTo(tx-sz*.02,ty);c.lineTo(tx,ty-sz*.12);c.lineTo(tx+sz*.02,ty);c.lineTo(tx+sz*.05,base-sz*.3);c.closePath();c.fill();
   const tg=c.createRadialGradient(tx,ty,0,tx,ty,sz*.2);tg.addColorStop(0,`rgba(140,210,255,${.35+.15*Math.sin(T*1.6)})`);tg.addColorStop(1,'rgba(140,210,255,0)');c.fillStyle=tg;c.fillRect(tx-sz*.2,ty-sz*.2,sz*.4,sz*.4);
   c.fillStyle='rgba(255,240,210,.10)';c.beginPath();c.ellipse(lw/2,base,lw*.48,sz*.1,0,0,7);c.fill();
   for(let i=0;i<28;i++){const px=(i*97.3+T*8*(1+i%3))%W,py=(i*53.1-T*10*(1+i%2)+H*4)%H,a=.3*(.5+.5*Math.sin(T*2+i));c.fillStyle=`rgba(255,235,190,${a})`;c.beginPath();c.arc(px,py,1+i%2,0,7);c.fill();}c.restore();}
  // Figuren (Sprecher mit Lichtkegel)
  const order=['rayan','veyran','mira','hero'];for(const id of order){const k=S.cast[id];if(k.a<=0)continue;const X=lw*k.x,run=k.run?Math.abs(Math.sin(now/90))*sz*.03:0,s2=sz*k.s;
   if(S.talk===id&&S.spot>0){const g=c.createRadialGradient(X,base-s2*.5,s2*.1,X,base-s2*.5,s2*.75);g.addColorStop(0,'rgba(255,240,200,.22)');g.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=g;c.fillRect(X-s2,base-s2*1.3,s2*2,s2*1.4);}
   const look=id==='hero'?heroLook(O):FIGURES[id].look,opt={expr:k.ex,talk:S.talk===id&&!S.talkDone};
   if(id==='hero'&&S.heroSilh>0){silhCv.width=Math.ceil(s2*1.5*dpr);silhCv.height=Math.ceil(s2*1.25*dpr);const sc=silhCv.getContext('2d');sc.setTransform(dpr,0,0,dpr,0,0);sc.clearRect(0,0,s2*1.5,s2*1.25);drawFigure(sc,s2*.75,s2*1.18,s2,look,now,opt);
    sc.globalCompositeOperation='source-atop';sc.fillStyle=`rgba(14,16,34,${S.heroSilh})`;sc.fillRect(0,0,s2*1.5,s2*1.25);sc.globalCompositeOperation='source-over';c.save();c.globalAlpha=k.a;c.drawImage(silhCv,X-s2*.75,base-run-s2*1.18,s2*1.5,s2*1.25);c.restore();}
   else{c.save();c.globalAlpha=k.a;if(k.dir<0&&k.run){c.translate(X,0);c.scale(-1,1);c.translate(-X,0);}drawFigure(c,X,base-run,s2,look,now,opt);c.restore();}
   k.box=[X,base,s2];}
  // Blättchen (Knospi) neben Veyran
  if(S.pet>0){const v=S.cast.veyran,k=Math.min(1,(now-S.petT)/650),px=lw*v.x+sz*.36,py=base-sz*.2-Math.abs(Math.sin(now/420))*sz*.02;c.save();c.globalAlpha=S.pet;
   const fn=typeof drawMonArt==='function'?drawMonArt:drawMon;fn(c,7,px,py,sz*.34*ezB(k),true,now);c.restore();}
  if(S.cap){const v=S.cast.veyran,k=Math.min(1,(now-S.cap.t)/600),x0=lw*v.x+sz*.12,y0=base-sz*.55,x1=lw*v.x+sz*.36,y1=base-sz*.25,x=x0+(x1-x0)*k,y=y0+(y1-y0)*k-Math.sin(k*Math.PI)*sz*.3;
   if(k<1)drawCapsule(c,x,y,sz*.05,now,0);else if(!S.cap.burst){S.cap.burst=1;S.flash=.8;sfx('catch');vib([20,30,60]);S.pet=1;S.petT=now;try{playCry(7);}catch(e){}}}
  // Sieben Elemente als Lichtkugeln im Bogen
  if(S.elems>0){const ks=['glut','flut','flora','fels','boe','lumen','schatten'],v=S.cast.veyran,cx0=lw*v.x,cy0=base-sz*1.02,R=sz*.62;c.save();c.globalAlpha=S.elems;
   ks.forEach((k2,i)=>{const a=Math.PI*(1.12+i*.126)+Math.sin(T*.8)*.02,x=cx0+Math.cos(a)*R,y=cy0+Math.sin(a)*R*.55+sz*.25+Math.sin(T*2+i)*3,r=sz*.045,col=TYPES[k2].c;
    const g=c.createRadialGradient(x,y,0,x,y,r*2.4);g.addColorStop(0,col+'cc');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-r*2.4,y-r*2.4,r*4.8,r*4.8);c.fillStyle='#fff';c.beginPath();c.arc(x,y,r*.55,0,7);c.fill();
    c.font=`700 ${Math.max(10,sz*.045)|0}px Fredoka, sans-serif`;c.textAlign='center';c.fillStyle='rgba(255,255,255,.9)';c.fillText(TYPES[k2].n,x,y+r*2.3);});c.restore();}
  if(S.flash>0){c.fillStyle=`rgba(255,250,230,${S.flash})`;c.fillRect(0,0,W,H);S.flash=Math.max(0,S.flash-.05);}
  requestAnimationFrame(frame);};requestAnimationFrame(frame);
 const scene=async f=>{skipTalk=false;skip.hidden=false;await f();};

 // ---- 1 Professor Veyran
 await scene(async()=>{await wait(500);await tween(S,'spot',1,1000);S.cast.veyran.x=.5;tween(S.cast.veyran,'a',1,700);await wait(450);sfx('pop');
  await line('veyran','Hallo! Schön, dass du da bist.','freudig');
  await line('veyran','Ich bin Professor Veyran. Ich erforsche die Kreaturen von Veyra.','laechelnd');
  S.cap={t:performance.now()};sfx('whoosh');await wait(800);if(!S.pet){S.pet=1;S.petT=performance.now();}
  await line('veyran','Darf ich vorstellen? Das ist Blättchen, ein Knospi.','freudig');
  await line('veyran','Blättchen schläft am liebsten in meinem Bart. Hihi.','laechelnd');
  await line('veyran','In Veyra leben Menschen und Kreaturen zusammen.','neutral');
  tween(S,'elems',1,700);await line('veyran','Es gibt sieben große Elemente: Glut, Flut, Flora, Fels, Böe, Lumen und Schatten.','freudig');
  await line('veyran','Jede Kreatur gehört zu einem Element. Manche sogar zu zwei!','ueberrascht');
  await tween(S,'elems',0,400);await line('veyran','Doch jetzt zu dir. Wer bist du?','neutral');});
 S.elems=0;if(!S.pet){S.pet=1;S.petT=performance.now();}S.cap=null;
 // ---- 2 Wer bist du?
 skip.hidden=true;box.hidden=true;S.talk=null;tween(S.cast.veyran,'a',0,350);S.pet=0;S.cast.hero.x=.5;S.cast.hero.a=1;sfx('pop');await tween(S,'heroSilh',0,900);
 panel.hidden=false;const res=await creation(panel,O,v=>{name=v.name;});name=res.name;panel.hidden=true;S.cast.hero.ex='freudig';
 // ---- 3 Rayan & Mira
 S.cast.veyran.x=.84;S.cast.hero.x=.5;tween(S.cast.veyran,'a',1,500);S.pet=1;S.petT=performance.now()-650;
 await scene(async()=>{await line('veyran','{name}! Ein schöner Name.','freudig');
  await line('veyran','Heute bekommst du deinen ersten Partner.','laechelnd');
  tween(S.cast.hero,'x',.4,500);S.cast.rayan.x=-.15;sfx('whoosh');await enter('rayan',.14,650);S.cast.rayan.ex='entschlossen';
  await line('rayan','Halt! Ich will zuerst!','entschlossen');
  await line('rayan','Ich bin Rayan. Ich werde der Stärkste in ganz Veyra!','stolz');
  S.cast.mira.x=1.15;sfx('whoosh');await enter('mira',.62,650);
  await line('mira','Rayan, du bist zu laut! Hallo, {name}. Ich bin Mira.','freudig');
  await line('mira','Wir drei starten heute gemeinsam. Toll, oder?','laechelnd');
  await line('veyran','Wunderbar! Dann seid ihr Freunde. Und Rivalen!','freudig');
  await line('veyran','{name}, du darfst zuerst wählen.','laechelnd');});
 S.cast.rayan.a=S.cast.mira.a=1;S.cast.rayan.x=.14;S.cast.mira.x=.62;S.cast.hero.x=.4;
 // ---- 4 Starterwahl
 skip.hidden=true;box.hidden=true;S.talk=null;starter=await pickStarter(pick);
 pickMine(pick,starter,name);const M=MONS[starter];riv=rivalStartersFig(starter);vars.starter=M.n;vars.strong=MONS[riv.rayan.starter].n;vars.weak=MONS[riv.mira.starter].n;
 vars.strongEl=TYPES[MONS[riv.rayan.starter].t[0]].n;vars.yourEl=TYPES[M.t[0]].n;vars.rmon=vars.strong;vars.mmon=vars.weak;
 await scene(async()=>{await line('veyran','{starter}! Eine tolle Wahl.','freudig');
  pickMark(pick,riv.rayan.starter,'Rayan','#e04848');sfx('pop');await line('rayan','Dann nehme ich {strong}! {strongEl} ist stark gegen {yourEl}. Hehe!','stolz');
  pickMark(pick,riv.mira.starter,'Mira','#3a8ad8');sfx('pop');await line('mira','Ich nehme {weak}. Den unterschätzen alle. Zu Unrecht!','freudig');
  await line('veyran','Jeder hat jetzt einen Partner. Passt gut aufeinander auf.','laechelnd');});
 pick.hidden=true;pick.innerHTML='';
 // ---- 5 Chronik + Fangkapseln
 await scene(async()=>{gifts.hidden=false;gifts.innerHTML='';addGift(gifts,'chronik','Chronik','Karte · Tagebuch · Dex');sfx('lvl');
  await line('veyran','Hier ist deine Chronik. Sie merkt sich alles, was du erlebst.','freudig');
  addGift(gifts,'kapsel','5× Fangkapsel','für wilde Kreaturen');addGift(gifts,'trank','3× Kräutertrank','gegen Müdigkeit');sfx('lvl');
  await line('veyran','Und hier: fünf Fangkapseln und drei Kräutertränke.','laechelnd');
  await line('veyran','Ist dein Partner müde? Dann geh zur Kreaturenstation.','neutral');
  await line('veyran','Mit Lehr-Kristallen lernen Kreaturen neue Attacken. Die findest du unterwegs.','nachdenklich');
  gifts.hidden=true;await line('rayan','Wer zuerst am Kristallbrunnen ist! Los, {rmon}!','entschlossen');S.cast.rayan.ex='freudig';enter('rayan',1.25,900);
  await line('mira','Warte doch, Rayan! Bis gleich, {name}!','freudig');enter('mira',1.3,1000);await wait(300);
  await line('veyran','Viel Glück, {name}! Veyra wartet auf dich.','freudig');});
 gifts.hidden=true;box.hidden=true;skip.hidden=true;
 // ---- 6 Spielstart: Spielstand anlegen, Partner + Geschenke, Porträt fliegt in die Welt
 beginGame({name,rival:'Rayan',outfit:O},true);mode='wait';
 try{G.team.push(mk(starter,5));caught(starter);G.starter=starter;G.rivals=riv;G.flags.starter=1;G.flags.introStarter=1;G.flags.s1_rivalen=1;addItem('kapsel',5);addItem('trank',3);['veyran','rayan','mira'].forEach(figMeet);}catch(e){console.error(e);}
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const hb=S.cast.hero.box||[W/2,H*.7,H*.4],[hx,hy,hs]=hb,snap=document.createElement('canvas');snap.className='sqSnap';const sw=Math.round(hs*1.2),sh=Math.round(hs*1.15);snap.width=sw*dpr;snap.height=sh*dpr;
 const sc2=snap.getContext('2d');sc2.scale(dpr,dpr);drawFigure(sc2,sw/2,sh-hs*.06,hs,heroLook(O),performance.now(),{noShadow:true,expr:'freudig'});snap.style.cssText=`left:${hx-sw/2}px;top:${hy-sh+hs*.06}px;width:${sw}px;height:${sh}px`;L.appendChild(snap);
 S.done=true;cv.style.opacity=0;L.classList.add('reveal');const tp=typeof playerScreen==='function'?playerScreen():null;
 await wait(60);if(tp){const k=Math.max(.05,tp.h*1.25/sh);snap.style.transform=`translate(${tp.x-hx}px,${tp.y-(hy-sh/2+hs*.06)}px) scale(${k})`;}else snap.style.opacity=0;sfx('whoosh');
 await wait(RED?0:950);snap.style.opacity=0;sfx('land');await wait(RED?0:250);
 removeEventListener('resize',fit);document.removeEventListener('keydown',kd);L.hidden=true;L.innerHTML='';L.className='layer';
 mode='world';welcomeHome();return{name,outfit:O,starter,rivals:riv};};

// Starterwahl: drei Karten (Bild, Element), Tippen wählt, Knopf bestätigt → Promise(Art-ID)
function pickStarter(el){return new Promise(res=>{const S=typeof STARTERS!=='undefined'?STARTERS:[1,4,7];let cur=0;el.hidden=false;
 el.innerHTML=`<p class="asHead">Wähle deinen ersten Partner</p><div class="asRow">${S.map(s=>{const M=MONS[s];return`<button type="button" class="asCard" data-s="${s}" style="--tc:${TYPES[M.t[0]].c}" aria-label="${M.n}, ${M.t.map(t=>TYPES[t].n).join(' und ')}">${typeof artImg==='function'?artImg(s,'asPic',{field:true}):''}<small>${typeof dexNr==='function'?dexNr(s):'#'+s}</small><b>${M.n}</b><span class="chips">${typeof chips==='function'?chips(M.t):''}</span></button>`;}).join('')}</div><button type="button" class="fgGo" disabled>Tippe auf eine Kreatur</button>`;
 const go=el.querySelector('.fgGo');
 el.querySelectorAll('.asCard').forEach(b=>b.onclick=e=>{e.stopPropagation();if(el.classList.contains('taken'))return;cur=+b.dataset.s;el.querySelectorAll('.asCard').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});sfx('tap');try{playCry(cur);}catch(_){}go.disabled=false;go.textContent=MONS[cur].n+', du bist es!';});
 go.onclick=e=>{e.stopPropagation();if(!cur)return;sfx('lvl');vib(30);el.classList.add('taken');go.remove();el.querySelector('.asHead').textContent='Dein Partner: '+MONS[cur].n;res(cur);};});}
function pickMark(el,s,who,col){const b=el.querySelector(`.asCard[data-s="${s}"]`);if(!b)return;b.classList.add('on');b.insertAdjacentHTML('beforeend',`<span class="fgWho" style="--wc:${col}">${who}</span>`);}
// eigene Karte nach der Wahl beschriften
function pickMine(el,s,name){const b=el.querySelector(`.asCard[data-s="${s}"]`);if(b&&!b.querySelector('.fgWho'))b.insertAdjacentHTML('beforeend',`<span class="fgWho" style="--wc:#d81b72">${name}</span>`);}
function addGift(el,kind,title,sub){const d=document.createElement('div');d.className='fgGift';const cv=document.createElement('canvas');cv.width=cv.height=168;const c=cv.getContext('2d'),t=performance.now();
 if(kind==='chronik')drawChronik(c,84,84,150,t);else if(kind==='kapsel'){drawCapsule(c,62,96,36,t,0);drawCapsule(c,118,70,26,t+400,0);}else{c.fillStyle='#6cc86a';c.beginPath();c.roundRect(62,50,44,72,14);c.fill();c.fillStyle='#d9f2c8';c.fillRect(70,36,28,18);c.fillStyle='#8a5a32';c.fillRect(72,30,24,8);figEmblem(c,'blatt',84,90,12,'#fff');}
 d.appendChild(cv);d.insertAdjacentHTML('beforeend',`<span>${title}</span><small>${sub}</small>`);el.appendChild(d);}

// Charaktererstellung: Held/Heldin (Kanon-Designs) + Hautton, Haarfarbe, Jacke, Name
function creation(panel,O,live){return new Promise(res=>{const sw=(key,list,lab)=>`<div class="ccRow"><b>${lab}</b><div class="ccSw" data-k="${key}">${list.map(c=>`<button type="button" style="--c:${c}" aria-label="${lab} ${c}" data-v="${c}"></button>`).join('')}</div></div>`;
 panel.innerHTML=`<h2>Wer bist du?</h2><div class="ccRow"><b>Figur</b><div class="fgBody">${['held','heldin'].map(b=>`<button type="button" data-b="${b}" aria-label="${b==='held'?'Held':'Heldin'}"><canvas width="148" height="148"></canvas>${b==='held'?'Held':'Heldin'}</button>`).join('')}</div></div>
  ${sw('skin',OUTFIT.skin,'Hautton')}${sw('hairCol',OUTFIT.hairCol,'Haarfarbe')}${sw('top',OUTFIT.top,'Jacke')}
  <div class="ccRow ccIn"><label><b>Dein Name</b><input id="ccName" maxlength="12" autocomplete="off" placeholder="z. B. Noa" value=""></label></div>
  <div class="ccAct"><button type="button" class="ccRnd">Zufall</button><button type="button" class="ccGo">Los geht's!</button></div>`;
 const faces=()=>panel.querySelectorAll('.fgBody button').forEach(b=>{const cv=b.querySelector('canvas'),c=cv.getContext('2d'),o=outfitBody(Object.assign({},O),b.dataset.b);c.clearRect(0,0,148,148);drawFigPortrait(c,heroLook(o),148,1000,'freudig');b.classList.toggle('on',O.body===b.dataset.b);});
 const upd=()=>{panel.querySelectorAll('.ccSw').forEach(g=>{const k=g.dataset.k;g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===O[k]));});faces();};upd();
 panel.querySelectorAll('.fgBody button').forEach(b=>b.onclick=()=>{outfitBody(O,b.dataset.b);sfx('tap');upd();});
 panel.querySelectorAll('.ccSw button').forEach(b=>b.onclick=()=>{O[b.parentNode.dataset.k]=b.dataset.v;sfx('tap');upd();});
 const pk=a=>a[Math.floor(Math.random()*a.length)];panel.querySelector('.ccRnd').onclick=()=>{outfitBody(O,Math.random()<.5?'held':'heldin');O.skin=pk(OUTFIT.skin);O.hairCol=pk(OUTFIT.hairCol);O.top=pk(OUTFIT.top);sfx('pop');upd();};
 panel.querySelector('.ccGo').onclick=()=>{const n=($('#ccName').value||'').trim().replace(/[<>{}]/g,'')||'Noa';sfx('lvl');if(live)live({name:n});res({name:n});};});}

// Begrüßung zu Hause: Nach dem Intro mit Partner (B2 darf welcomeHome in 27-story neu definieren)
const _welcome23=welcomeHome;welcomeHome=function(){try{if(G&&G.flags&&G.flags.introStarter&&G.team[0]){const nm=MONS[G.team[0].s].n;
 return say(['Mama: Da bist du ja, '+G.name+'! Und wer ist das?','Mama: '+nm+'! Wie süß! Pass gut auf '+nm+' auf.','Mama: Rayan und Mira sind schon losgerannt. Viel Spaß, Schatz!']);}}catch(e){}return _welcome23.apply(this,arguments);};

// ---------- Übergänge ----------
// Tür: 0,3 s Farbfade in Zielfarbe + Tür-Sound; opts {fn,to,col,kind:'door'|'edge'|'stairs'|'ladder'}
SEQ.doorFade=o=>new Promise(res=>{const f=$('#fade'),to=o.to,kind=o.kind||((to&&INTERIORS[to])||(cur&&cur.inside)?'door':'edge');
 f.style.background=o.col||zoneCol(to);f.style.transitionDuration=RED?'0s':'.15s';mode='wait';
 if(kind==='door')sfx('door');else if(kind==='stairs'||kind==='ladder')sfx('stairs');f.classList.add('on');
 setTimeout(()=>{try{o.fn&&o.fn();}catch(e){console.error(e);}requestAnimationFrame(()=>requestAnimationFrame(()=>{f.classList.remove('on');if(mode==='wait')mode='world';setTimeout(()=>{f.style.transitionDuration='';res();},RED?0:170);}));},RED?0:150);});
// Gebietsbanner oben links (nutzt #mapCard): opts {name, region, lead, ms}
let abT=0;SEQ.areaBanner=o=>new Promise(res=>{const c=$('#mapCard');$('#mcName').textContent=o.name||'';$('#mcRegion').textContent=o.region||'';if(o.lead)c.style.setProperty('--ab',o.lead);
 c.classList.remove('on');void c.offsetWidth;c.classList.add('on');clearTimeout(abT);abT=setTimeout(()=>{c.classList.remove('on');res();},o.ms||2600);});
// Vollbild-Leinwand für Schnellreise/Fähre
function seqCanvas(cls){const cv=document.createElement('canvas');cv.className='seqCv '+(cls||'');document.body.appendChild(cv);const dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;const c=cv.getContext('2d');c.scale(dpr,dpr);return{cv,c,W,H};}
function tapSkip(el){let skip=false;const f=()=>{skip=true;};el.addEventListener('pointerdown',f);document.addEventListener('keydown',f,{once:true});return()=>skip;}
// Schnellreise: Wegtrage – das Leit-Wesen trägt dich die Route entlang. opts {to,x,y,label}
SEQ.fastTravel=async o=>{if(!o||!o.to)return;if(typeof closeMenu==='function'&&!$('#menu').hidden)closeMenu();mode='wait';held=null;sfx('whoosh');
 const{cv,c,W,H}=seqCanvas('ft'),isSkip=tapSkip(cv),Ly=typeof worldLayout==='function'?worldLayout():{},from=Ly[cur.inside?(G.ret&&G.ret.map):cur.id]||[0,0],dest=Ly[o.to]||[0,0];
 const keys=Object.keys(Ly),xs=keys.map(k=>Ly[k][0]),ys=keys.map(k=>Ly[k][1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),pad=50,
  sc=Math.min((W-pad*2)/Math.max(1,x1-x0),(H-pad*2)/Math.max(1,y1-y0)),P2=p=>[pad+(p[0]-x0)*sc+((W-pad*2)-(x1-x0)*sc)/2,pad+(p[1]-y0)*sc+((H-pad*2)-(y1-y0)*sc)/2];
 const A=P2(from),Bp=P2(dest),mid=[(A[0]+Bp[0])/2,(A[1]+Bp[1])/2-Math.hypot(Bp[0]-A[0],Bp[1]-A[1])*.35],lead=G.team.find(m=>m.hp>0)||G.team[0],t0=performance.now(),D=RED?200:1900;
 const q=k=>[(1-k)*(1-k)*A[0]+2*(1-k)*k*mid[0]+k*k*Bp[0],(1-k)*(1-k)*A[1]+2*(1-k)*k*mid[1]+k*k*Bp[1]];
 await new Promise(r=>{const f=n=>{const k=Math.min(1,(n-t0)/D),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;c.fillStyle='#f6f1e6';c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(120,100,70,.12)';c.lineWidth=1;for(let i=0;i<W;i+=28){c.beginPath();c.moveTo(i,0);c.lineTo(i,H);c.stroke();}for(let i=0;i<H;i+=28){c.beginPath();c.moveTo(0,i);c.lineTo(W,i);c.stroke();}
  for(const k2 of keys){const m2=MAPS[k2];for(const d of 'nsew'){const to=m2[d];if(typeof to==='string'&&Ly[to]){const a=P2(Ly[k2]),b2=P2(Ly[to]);c.strokeStyle=G.visited&&G.visited[k2]&&G.visited[to]?'rgba(24,34,48,.25)':'rgba(24,34,48,.07)';c.lineWidth=4;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b2[0],b2[1]);c.stroke();}}}
  for(const k2 of keys){const p=P2(Ly[k2]),R=REGION[k2],v=G.visited&&G.visited[k2];c.fillStyle=v&&R?R[1]+'77':'rgba(150,140,120,.13)';c.beginPath();c.arc(p[0],p[1],Math.min(sc*.36,26),0,7);c.fill();if(v&&TOWNS[k2]&&k2!==o.to){c.font='600 12px Fredoka, sans-serif';c.textAlign='center';c.fillStyle='rgba(24,34,48,.6)';c.fillText(MAPS[k2].name,p[0],p[1]+Math.min(sc*.36,26)+13);}}
  c.setLineDash([2,7]);c.lineCap='round';c.strokeStyle='#b8501e';c.lineWidth=3;c.beginPath();for(let i=0;i<=40*e;i++){const p=q(i/40);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}c.stroke();c.setLineDash([]);
  [A,Bp].forEach((p,i)=>{c.fillStyle=i?'#ff7a3d':'#182230';c.beginPath();c.arc(p[0],p[1],7,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(p[0],p[1],3,0,7);c.fill();});
  c.font='600 15px Fredoka, sans-serif';c.textAlign='center';c.fillStyle='#182230';c.fillText(o.label||getMap(o.to).name,Bp[0],Bp[1]-16);
  const p=q(e),pr=q(Math.max(0,e-.02)),ang=Math.atan2(p[1]-pr[1],p[0]-pr[0]);c.save();c.translate(p[0],p[1]-6-Math.sin(n/120)*3);c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(0,22,16,4,0,0,7);c.fill();
  if(lead)(typeof drawMonArt==='function'?drawMonArt:drawMon)(c,lead.s,0,0,46,Math.cos(ang)<0,n,undefined,{shiny:lead.shiny});c.restore();c.globalAlpha=Math.max(0,(k-.82)/.18);c.fillStyle='#fff';c.fillRect(0,0,W,H);c.globalAlpha=1;
  if(k<1&&!isSkip())requestAnimationFrame(f);else r();};requestAnimationFrame(f);});
 G.ret=o.ret||G.ret;loadMap(o.to,o.x,o.y);P.dir='down';G.px=P.x;G.py=P.y;cv.style.transition='opacity .45s';cv.style.opacity=0;sfx('land');vib(25);
 const sc2=$('#screen');sc2.classList.remove('landed');void sc2.offsetWidth;sc2.classList.add('landed');setTimeout(()=>{cv.remove();if(typeof emote==='function')emote(null,'♪');},460);mode='world';return{ok:true};};
// Fähre: Ablegen → Meer → Ankunft als 2D-Animation. opts {from,to,map,x,y,ms}
SEQ.ferry=async o=>{o=o||{};const pm=mode;mode='wait';held=null;const{cv,c,W,H}=seqCanvas('ferry'),isSkip=tapSkip(cv),D=RED?300:(o.ms||6200),t0=performance.now();sfx('whoosh');
 const ship=(x,y,s,t)=>{c.save();c.translate(x,y+Math.sin(t/420)*s*.05);c.rotate(Math.sin(t/600)*.03);
  c.fillStyle='#ff7a3d';c.beginPath();c.moveTo(-s*.9,0);c.lineTo(s*.95,0);c.quadraticCurveTo(s*.85,s*.32,s*.55,s*.36);c.lineTo(-s*.62,s*.36);c.quadraticCurveTo(-s*.9,s*.2,-s*.9,0);c.fill();
  c.fillStyle='#fff';c.fillRect(-s*.9,-s*.04,s*1.85,s*.08);c.fillStyle='#f4f1ea';c.beginPath();c.roundRect(-s*.55,-s*.42,s*1.05,s*.4,s*.08);c.fill();
  c.fillStyle='#3d8fe0';for(let i=0;i<4;i++){c.beginPath();c.arc(-s*.4+i*s*.25,-s*.22,s*.06,0,7);c.fill();}c.fillStyle='#182230';c.beginPath();c.roundRect(s*.1,-s*.72,s*.2,s*.32,s*.05);c.fill();c.fillStyle='#ffd166';c.fillRect(s*.1,-s*.62,s*.2,s*.06);
  c.fillStyle='rgba(240,240,250,.6)';for(let i=0;i<3;i++){const k=((t/900+i/3)%1);c.beginPath();c.arc(s*.2-k*s*.6,-s*.8-k*s*.5,s*(.06+k*.1),0,7);c.fill();}c.restore();};
 const pier=(x,y,s,flip)=>{c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.fillStyle='#8a6a4a';c.fillRect(0,-s*.1,s*1.6,s*.12);for(let i=0;i<5;i++)c.fillRect(s*.1+i*s*.33,0,s*.06,s*.5);
  c.fillStyle='#c9a77c';c.beginPath();c.roundRect(s*1.1,-s*.75,s*.45,s*.65,s*.06);c.fill();c.fillStyle='#d24d4d';c.beginPath();c.moveTo(s*1.05,-s*.75);c.lineTo(s*1.33,-s*1);c.lineTo(s*1.6,-s*.75);c.fill();c.restore();};
 await new Promise(r=>{const f=n=>{const k=Math.min(1,(n-t0)/D),hz=H*.52,sky=c.createLinearGradient(0,0,0,hz);sky.addColorStop(0,'#7cc8f0');sky.addColorStop(1,'#fde9c8');c.fillStyle=sky;c.fillRect(0,0,W,hz);
  const sun=[W*.75,hz-H*.12];c.fillStyle='rgba(255,226,150,.9)';c.beginPath();c.arc(sun[0],sun[1],H*.07,0,7);c.fill();
  for(let i=0;i<4;i++){const x=((i*W*.33+n*.012*(1+i%2))%(W+200))-100,y=H*.12+i*H*.06;c.fillStyle='rgba(255,255,255,.85)';[[0,0,30],[26,4,22],[-24,6,20]].forEach(([a,b,rr2])=>{c.beginPath();c.arc(x+a,y+b,rr2*(H/600),0,7);c.fill();});}
  const sea=c.createLinearGradient(0,hz,0,H);sea.addColorStop(0,'#3a9ad6');sea.addColorStop(1,'#1f6aa8');c.fillStyle=sea;c.fillRect(0,hz,W,H-hz);
  // Akt: 0–.3 Ablegen (Kai links), .3–.7 offenes Meer, .7–1 Ankunft (Kai rechts)
  const s=Math.min(W,H)*.16,a1=Math.min(1,k/.3),a3=Math.max(0,(k-.7)/.3),sx=k<.3?W*.32+a1*W*.18:k<.7?W*.5:W*.5+ez3(a3)*W*.14,sy=hz+H*.17;
  if(k<.42)pier(W*.32-s*1.9-a1*W*.4,sy+s*.08,s,false);if(k>.62)pier(W*.66+s*1.9+(1-ez3(a3))*W*.5,sy+s*.08,s,true);
  for(let L2=0;L2<5;L2++){const yy=hz+L2*(H-hz)/5+8,amp=3+L2*2,spd=n*(.04+L2*.02);c.strokeStyle=`rgba(255,255,255,${.18+L2*.06})`;c.lineWidth=2;c.beginPath();for(let x=0;x<=W;x+=12){const y=yy+Math.sin((x+spd)/(40+L2*10))*amp;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
  ship(sx,sy,s,n);c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=3;c.beginPath();c.moveTo(sx-s*.9,sy+s*.3);c.quadraticCurveTo(sx-s*1.6,sy+s*.35,sx-s*2.4,sy+s*.28);c.stroke();
  for(let i=0;i<3;i++){const gx=(W*.2+i*W*.25+n*.05)%W,gy=H*.2+Math.sin(n/500+i)*12;c.strokeStyle='#33405a';c.lineWidth=2;c.beginPath();c.moveTo(gx-8,gy);c.quadraticCurveTo(gx-4,gy-5,gx,gy);c.quadraticCurveTo(gx+4,gy-5,gx+8,gy);c.stroke();}
  c.font='600 18px Fredoka, sans-serif';c.textAlign='center';c.fillStyle='rgba(24,34,48,.82)';const lab=k<.3?(o.from?'Ablegen in '+o.from:'Ablegen …'):k<.7?'Auf See':(o.to?'Ankunft in '+o.to:'Ankunft');c.fillText(lab,W/2,H*.9);
  if(k>.9){c.fillStyle=`rgba(255,255,255,${(k-.9)/.1})`;c.fillRect(0,0,W,H);}if(k<1&&!isSkip())requestAnimationFrame(f);else r();};requestAnimationFrame(f);});
 if(o.map)loadMap(o.map,o.x,o.y);cv.style.transition='opacity .4s';cv.style.opacity=0;setTimeout(()=>cv.remove(),420);sfx('land');mode=pm==='wait'?'world':pm;return{ok:true};};

// Titel-Opening erneut abspielen (aus den Optionen; Name bleibt playLegendIntro)
function playLegendIntro(){return new Promise(res=>{const I=$('#intro');I.classList.remove('out','cine');$('#introLogo').classList.remove('show');$('#introText').classList.remove('show');I.hidden=false;$('#icv').hidden=false;
 const _e=endIntro;endIntro=function(){endIntro=_e;_e();res();};startIntro();});}

// ---------- NPC-Gespräch (läuft nach dem Wrapper in 16): Schilder, Sprecher merken, Emote über dem Kopf ----------
const _talkD=talk;talk=function(n){if(!n)return;DLG.pend=n;
 if(n.t==='sign'){sfx('page');return say([].concat(n.txt||'…').map(l=>String(l)));}
 const r=_talkD(n);DLG.pend=null;const l=String((dlgQ&&dlgQ[0])||$('#dlgText').textContent||'');
 if(mode==='dialog'&&n.t!=='item'&&n.t!=='starter'&&n.t!=='legend'){const sym=n.t==='trainer'&&!G.flags[n.flag]?'!':n.t==='nurse'?'♪':/\?/.test(l)?'?':/!/.test(l)?'!':/…/.test(l)?'…':null;if(sym)emote(n,sym);}return r;};
