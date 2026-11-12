// ===== VEYRA – Intro-Film (App) bzw. Poster-Standbild (Artifact) vor dem interaktiven Intro (SEQ.intro, 23) – siehe docs/intro-video.md =====
// build.mjs setzt window.INTRO_VIDEO={hd,sd,poster,type} (App) oder null (Artifact) und window.INTRO_POSTER (App: Pfad, Artifact: data-URI).
// Ablauf: Titel › „Neues Spiel“ › introFilmGate() › Film (Vollbild, Ton, „Überspringen“ beim ersten Ansehen ab 18 s, danach ab 2 s) › Blende zu Schwarz › SEQ.intro.
// SET.introSeen=1 nach dem ersten Abspielen; danach fragt „Neues Spiel“ kurz „Intro ansehen?“. Optionen › Erweitert › „Intro-Film“ spielt erneut.
const IV={el:null,err:false,on:false,busy:false,last:null};
// Langsame Verbindung / Datensparmodus → 480p
function ivSlow(){const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;return!!(c&&(c.saveData||/^(slow-2g|2g|3g)$/.test(c.effectiveType||'')));}
function ivSrc(){const V=window.INTRO_VIDEO;return V&&V.hd?(ivSlow()&&V.sd?V.sd:V.hd):null;}
// Webdriver-Pfad (Smoke) und VEYRA_DEMO (QA-Intro) überspringen den Film; Tests mit window.VEYRA_VIDEO=1 spielen ihn echt ab
function ivAuto(){return(typeof SEQ_AUTO==='function'&&SEQ_AUTO())||(!!window.VEYRA_DEMO&&!window.VEYRA_VIDEO);}
// Video-Element anlegen; im Titel nur Metadaten vorladen
function ivPrep(){if(IV.el&&!IV.err)return IV.el;const src=ivSrc();if(!src)return null;
 const v=document.createElement('video');v.preload='metadata';v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.disablePictureInPicture=true;
 v.setAttribute('aria-hidden','true');IV.err=false;v.addEventListener('error',()=>{IV.err=true;});v.src=src;IV.el=v;return v;}
function ivSeen(){if(!SET.introSeen){SET.introSeen=1;try{saveSet();}catch(e){}}}
function ivKey(on,f){if(on)document.addEventListener('keydown',f,true);else document.removeEventListener('keydown',f,true);}

// ---------- Film abspielen → Promise<{played, why}>; why ∈ ended|skip|error|timeout|codec|none ----------
function playIntroFilm(o){o=o||{};return new Promise(done=>{
 const V=window.INTRO_VIDEO;if(!ivSrc()||IV.on){done({played:false,why:'none'});return;}
 if(IV.err){IV.el=null;IV.err=false;}const v=ivPrep();
 if(!v||(V.type&&v.canPlayType&&v.canPlayType(V.type)==='')){done({played:false,why:'codec'});return;}
 // Welt anhalten: Modus 'title' = gedrosselter Loop ohne Weltrender (15/03), Synth-Musik stumm
 const prevMode=mode,prevMus=SET.music;IV.on=true;mode='title';SET.music=0;
 const L=document.createElement('div');L.className='ivL';L.setAttribute('role','dialog');L.setAttribute('aria-label','Intro-Film');
 L.innerHTML='<button class="ivSnd" type="button" aria-label="Ton einschalten">Ton an</button><button class="ivSkip" type="button">Überspringen</button><div class="ivBlack"></div>';
 L.prepend(v);document.body.appendChild(L);
 const skip=L.querySelector('.ivSkip'),snd=L.querySelector('.ivSnd');
 // 16:9 füllt das Bild (cover); weicht das Seitenverhältnis stark ab (> 12 % Beschnitt), schwarze Ränder (contain)
 const fit=()=>{const r=innerWidth/Math.max(1,innerHeight),k=16/9;L.classList.toggle('contain',1-Math.min(r,k)/Math.max(r,k)>.12);};fit();addEventListener('resize',fit);
 let fin=false,started=false;const T=[];const later=(f,ms)=>T.push(setTimeout(f,ms));
 // Erstes Ansehen: „Überspringen“ erst nach 18 s (Kind soll den Anfang sehen); danach ab 2 s. Testharness (webdriver) ohne Sperre, außer window.VEYRA_LOCK=1
 const lockMs=(SET.introSeen||(navigator.webdriver&&!window.VEYRA_LOCK))?2000:18000,t0s=performance.now();const canSkip=()=>lockMs<=2000||performance.now()-t0s>=lockMs;
 const showSkip=()=>{if(canSkip())skip.classList.add('show');};
 const cleanup=()=>{T.forEach(clearTimeout);removeEventListener('resize',fit);ivKey(false,kd);document.removeEventListener('visibilitychange',vis);IV.on=false;
  if(mode==='title')mode=prevMode;SET.music=prevMus;try{v.pause();}catch(e){}};
 const end=why=>{if(fin)return;fin=true;IV.last=why;const ok=why==='ended'||why==='skip';
  if(!ok||RED){cleanup();L.remove();try{v.removeAttribute('src');v.load();}catch(e){}IV.el=null;done({played:started,why});return;}
  // weicher Ausklang: Bild und Ton gemeinsam zu Schwarz, dann die nächste Ebene unter einer kurzen Schwarzblende
  L.classList.add('out');const v0=v.volume,t0=performance.now();const ramp=n=>{const k=Math.min(1,(n-t0)/700);try{v.volume=v0*(1-k);}catch(e){}if(k<1)requestAnimationFrame(ramp);};requestAnimationFrame(ramp);
  setTimeout(()=>{cleanup();done({played:true,why});L.classList.add('gone');setTimeout(()=>{L.remove();try{v.removeAttribute('src');v.load();}catch(e){}IV.el=null;},480);},760);};
 const kd=e=>{if((e.code==='Escape'&&canSkip())||((e.code==='Enter'||e.code==='Space')&&skip.classList.contains('show'))){e.preventDefault();e.stopPropagation();end('skip');}else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();showSkip();}};ivKey(true,kd);
 const vis=()=>{if(fin)return;if(document.hidden)v.pause();else if(started)v.play().catch(()=>{});};document.addEventListener('visibilitychange',vis);
 skip.onclick=e=>{e.stopPropagation();if(canSkip())end('skip');};
 snd.onclick=e=>{e.stopPropagation();v.muted=false;snd.classList.remove('show');};
 L.addEventListener('pointerdown',e=>{if(e.target===skip||e.target===snd)return;showSkip();});
 v.addEventListener('error',()=>end('error'));v.addEventListener('ended',()=>end('ended'));
 v.addEventListener('playing',()=>{if(!started){started=true;ivSeen();}});
 later(showSkip,lockMs);
 // kein Hängen: startet der Film nicht binnen 8 s (Netz, Datei, Codec), geht es weiter
 later(()=>{if(!started)end('timeout');},8000);
 v.preload='auto';v.muted=false;v.volume=Math.max(0,Math.min(1,(SET.vol??80)/100));
 const p=v.play();if(p&&p.catch)p.catch(err=>{if(fin)return;
  // Autoplay mit Ton verweigert → stumm starten, dezenter „Ton an“-Knopf
  if(err&&err.name==='NotAllowedError'){v.muted=true;v.play().then(()=>snd.classList.add('show')).catch(()=>end('error'));}else end('error');});
 if(o.onStart)o.onStart(L,v);
});}

// ---------- Kurzabfrage „Intro ansehen?“ → Promise<boolean> ----------
function ivAsk(){return new Promise(res=>{const L=document.createElement('div');L.className='ivAsk';L.setAttribute('role','dialog');L.setAttribute('aria-label','Intro ansehen?');
 L.innerHTML='<div class="ivCard"><b>Intro ansehen?</b><p>Der Film über die Welt der Terras.</p><div class="ivBtns"><button type="button" class="pri" data-a="1">Ja</button><button type="button" data-a="0">Nein</button></div></div>';
 document.body.appendChild(L);const fin=a=>{ivKey(false,kd);try{sfx('tap');}catch(e){}L.remove();res(a);};
 const kd=e=>{if(e.code==='Escape'){e.preventDefault();e.stopPropagation();fin(false);}};ivKey(true,kd);
 L.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();fin(b.dataset.a==='1');});setTimeout(()=>{try{L.querySelector('button').focus({preventScroll:true});}catch(e){}},30);});}

// ---------- Artifact: Poster-Standbild 2 s mit Logo-Einblendung (das Poster trägt das Kristall-Logo: es schärft sich aus der Unschärfe auf; Text-Logo nur für Screenreader) ----------
function ivPoster(){const P=window.INTRO_POSTER;if(!P)return Promise.resolve({played:false,why:'none'});return new Promise(done=>{
 const prevMode=mode;mode='title';const L=document.createElement('div');L.className='ivL ivPost';L.setAttribute('aria-label','Veyra – Die Welt der Terras');
 L.style.setProperty('--ivp',`url("${P}")`);L.innerHTML='<div class="ivImg"></div><div class="ivLogo"><h1>VEYRA</h1><p>Die Welt der Terras</p></div><div class="ivBlack"></div>';document.body.appendChild(L);
 requestAnimationFrame(()=>L.classList.add('in'));let fin=false;
 const end=()=>{if(fin)return;fin=true;L.classList.add('out');setTimeout(()=>{if(mode==='title')mode=prevMode;done({played:true,why:'poster'});L.classList.add('gone');setTimeout(()=>L.remove(),480);},RED?0:520);};
 L.addEventListener('pointerdown',end);setTimeout(end,2000);});}

// ---------- Tor vor dem interaktiven Intro (newGame in 15) ----------
async function introFilmGate(){if(IV.busy)return{busy:true};IV.busy=true;try{
 if(ivAuto()){ivSeen();return{auto:true};}
 if(!window.INTRO_VIDEO){if(SET.introSeen)return{skipped:true};const r=await ivPoster();ivSeen();return r;}
 if(SET.introSeen&&!(await ivAsk()))return{skipped:true};
 return await playIntroFilm();}finally{IV.busy=false;}}
// Optionen › Erweitert › „Intro-Film“: nur der Film, danach zurück, wo man war
function replayIntroFilm(){if(IV.on||IV.busy)return Promise.resolve({busy:true});const o=$('#opts');if(o)o.hidden=true;if(G&&!$('#menu').hidden)closeMenu();return playIntroFilm({replay:true});}

// ---------- Titel: Poster als Hintergrund (App), Metadaten erst laden, wenn der Titel sichtbar ist ----------
(function(){const V=window.INTRO_VIDEO,t=$('#title');if(!t)return;
 if(V&&V.poster){t.classList.add('poster');t.style.setProperty('--tposter',`url("${V.poster}")`);}
 if(!V||ivAuto())return;const I=$('#intro');
 const chk=()=>{if(!t.hidden&&(!I||I.hidden)&&mode==='title'){ivPrep();mo.disconnect();return true;}return false;};
 const mo=new MutationObserver(chk);if(I)mo.observe(I,{attributes:true,attributeFilter:['hidden']});mo.observe(t,{attributes:true,attributeFilter:['hidden']});setTimeout(chk,0);})();
