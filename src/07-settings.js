// ===== VEYRA – Einstellungen =====
const SETKEY='veyra_set';let BS=2;
const PRESET={niedrig:{res:'720',fps:30,shadows:0,light:0,particles:0,dist:'nah',gfx:'low'},mittel:{res:'1080',fps:30,shadows:0,light:1,particles:1,dist:'mittel',gfx:'mid'},
 hoch:{res:'1080',fps:60,shadows:1,light:1,particles:1,dist:'mittel',gfx:'high'},ultra:{res:'1440',fps:60,shadows:1,light:1,particles:1,dist:'weit',gfx:'high'},
 auto:{res:'auto',fps:60,shadows:1,light:1,particles:1,dist:'mittel',gfx:'auto'}};
const SET=Object.assign({quality:'auto',res:'auto',fps:60,gfx:'auto',view:'third',shadows:1,light:1,particles:1,dist:'mittel',vol:80,font:'normal',btl:'runde',diff:'leicht',ctrl:'kreuz',motion:'auto',cb:0,sfx:1,music:1,mvol:45,vib:1,text:'normal',stick:'M',intro:1},
 (()=>{try{return JSON.parse(localStorage.getItem(SETKEY)||'{}');}catch(e){return{};}})());
if(SET.diff!=='normal')SET.diff='leicht';SET.btl='runde';// Echtzeitmodus entfernt (Migration alter Einstellungen)
// Renderhöhe (Look L1): nie mehr als die Gerätepixel – min(SET.res, Bildschirmhöhe × DPR); DPR-Deckel 2 (1,5 bei schwacher GPU, PERF.weak aus 43-perf.js).
// 'auto' und 'native' = Gerätehöhe; resH3() = Renderhöhe der 3D-Welt inkl. dynamischer Auflösung (PERF.scale 0,6–1,0, nur bei 'auto').
function perfObj(){try{return PERF;}catch(e){return null;}}// PERF entsteht erst in 43-perf.js (TDZ-sicher)
function dprCap(){const P_=perfObj(),w=P_&&P_.weak;return Math.min(devicePixelRatio||1,w?1.5:2);}
function devH(){const s=document.getElementById('screen');return Math.max(200,Math.round(Math.min(2160,((s&&s.clientHeight)||innerHeight||300)*dprCap())));}
function resH(){const d=devH();if(SET.res==='native'||SET.res==='auto'||!(+SET.res>0))return d;return Math.min(+SET.res,d);}
function resH3(){const h=resH(),P_=perfObj(),k=SET.res==='auto'&&P_?P_.scale:1;return Math.max(180,Math.round(h*k));}
function DIST(){return{nah:.6,mittel:1,weit:1.7}[SET.dist]||1;}
function saveSet(){try{localStorage.setItem(SETKEY,JSON.stringify(SET));}catch(e){}applySet();}
function fitView(){const s=$('#screen'),asp=s.clientWidth&&s.clientHeight?s.clientWidth/s.clientHeight:15/11;VW=Math.max(8,VH*asp);SC=resH()/(VH*TS);cv.width=Math.round(VW*TS*SC);cv.height=Math.round(VH*TS*SC);lc.width=cv.width;lc.height=cv.height;}
function applySet(){fitView();
 BS=Math.min(10,resH()/150);const bc=$('#bcv');bc.width=Math.round(240*BS);bc.height=Math.round(150*BS);
 if(R3&&R3.fit)R3.fit();const s={S:118,M:150,L:186}[SET.stick]||150;$('#stick').style.setProperty('--sz',s+'px');$('#dpad').style.setProperty('--sz',(s+6)+'px');$('#stick').hidden=SET.ctrl!=='stick';$('#dpad').hidden=SET.ctrl==='stick';document.body.classList.toggle('big',SET.font==='gross');RED=SET.motion==='weniger'||matchMedia('(prefers-reduced-motion: reduce)').matches;document.body.classList.toggle('red',RED);document.body.classList.toggle('cb',!!SET.cb);}
function rSettings(el){el.innerHTML='';const sec=(t,d)=>{el.insertAdjacentHTML('beforeend',`<h3>${t}${d?` <small>${d}</small>`:''}</h3>`);const b=document.createElement('div');b.className='opts';el.appendChild(b);return b;};
 const row=(box,label,desc,ctrl)=>{const r=document.createElement('div');r.className='orow';r.innerHTML=`<div><b>${label}</b>${desc?`<p class="muted">${desc}</p>`:''}</div>`;r.appendChild(ctrl);box.appendChild(r);};
 const redraw=()=>rSettings(el);
 const seg=(key,opts,custom)=>{const d=document.createElement('div');d.className='seg';opts.forEach(([v,l])=>{const b=document.createElement('button');b.textContent=l;b.className=String(SET[key])===String(v)?'on':'';
  b.onclick=()=>{SET[key]=v;if(key==='quality'&&PRESET[v])Object.assign(SET,PRESET[v]);else if(custom!==false&&['res','fps','shadows','light','particles','dist','gfx'].includes(key))SET.quality='eigene';saveSet();sfx('tap');redraw();};d.appendChild(b);});return d;};
 const tog=key=>{const b=document.createElement('button');b.className='tog'+(SET[key]?' on':'');b.setAttribute('role','switch');b.setAttribute('aria-checked',!!SET[key]);b.innerHTML='<i></i>';
  b.onclick=()=>{SET[key]=SET[key]?0:1;if(['shadows','light','particles'].includes(key))SET.quality='eigene';saveSet();sfx('tap');redraw();};return b;};
 const rng=key=>{const w=document.createElement('label');w.className='rng';const i=document.createElement('input');i.type='range';i.min=0;i.max=100;i.value=SET[key];i.id='set_'+key;
  const o=document.createElement('output');o.textContent=SET[key]+' %';i.oninput=()=>{SET[key]=+i.value;o.textContent=i.value+' %';};i.onchange=()=>{saveSet();sfx('tap');};w.append(i,o);return w;};
 const H=resH(),W=Math.round(H*15/11);
 const g=sec('Grafik',`Bildschirm: ${W}×${H} · ${SET.fps?SET.fps+' fps':'unbegrenzt'}`);
 row(g,'Qualitätsstufe','Setzt Auflösung, Bildrate und Effekte auf einmal.',seg('quality',[['auto','Auto'],['niedrig','Niedrig'],['mittel','Mittel'],['hoch','Hoch'],['ultra','Ultra']].concat(SET.quality==='eigene'?[['eigene','Eigene']]:[]),false));
 row(g,'Auflösung','2K sieht am schärfsten aus, braucht aber mehr Akku.',seg('res',[['auto','Auto'],['720','720p'],['1080','1080p'],['1440','2K'],['native','Nativ']]));
 row(g,'Bildrate','30 fps schont den Akku, 60 fps läuft flüssiger.',seg('fps',[[30,'30'],[60,'60'],[0,'Max']]));
 row(g,'Sichtweite','Wie weit du in den 3D-Ansichten schauen kannst.',seg('dist',[['nah','Nah'],['mittel','Mittel'],['weit','Weit']]));
 row(g,'Echtzeit-Schatten','Schatten von Sonne und Mond in 3D.',tog('shadows'));
 row(g,'Dynamisches Licht','Laterne, leuchtende Fenster und Kristalle bei Nacht.',tog('light'));
 row(g,'Partikel','Schnee, Glühwürmchen und Höhlenstaub.',tog('particles'));
 const s=sec('Sound');
 {const st=document.createElement('div');st.className='btns';const tb=document.createElement('button');tb.className='pill';tb.textContent='Sound testen';tb.onclick=()=>{initAudio();sfx('lvl');vib(20);setTimeout(redraw,400);};st.append(tb);row(s,'Audio-Status: '+audioState(),/iPhone|iPad/.test(navigator.userAgent)?'Auf dem iPhone: Stummschalter an der Seite ausschalten und Lautstärke hochdrehen.':'Der Ton startet nach der ersten Berührung im Spiel.',st);}
 row(s,'Gesamtlautstärke','',rng('vol'));
 row(s,'Musik','Ruhige Melodien in der Welt, treibende im Kampf.',tog('music'));
 row(s,'Musiklautstärke','',rng('mvol'));
 row(s,'Soundeffekte','Treffer, Fänge, Level-ups und Menüs.',tog('sfx'));
 row(s,'Sprechlaute','Kurze Töne, während Dialoge und Kampftexte erscheinen.',tog('blip'));
 row(s,'Vibration','Kurzes Feedback bei Treffern und Begegnungen.',tog('vib'));
 const c=sec('Steuerung & Text');
 row(c,'Steuerung','Steuerkreuz: vier feste Richtungen, kurzes Tippen dreht nur, Halten läuft. Joystick: stufenlos.',seg('ctrl',[['kreuz','Steuerkreuz'],['stick','Joystick']]));
 row(c,'Größe der Steuerung','',seg('stick',[['S','Klein'],['M','Mittel'],['L','Groß']]));
 row(c,'Schwierigkeit','Leicht: eigene Angriffe stärker, Gegner schwächer, Fangen und Erfahrung leichter, weniger Begegnungen. Normal: klassische Werte.',seg('diff',[['leicht','Leicht'],['normal','Normal']]));
 row(c,'Schriftgröße','Größere Texte in Dialogen, Kampf und Menüs.',seg('font',[['normal','Normal'],['gross','Groß']]));
 row(c,'Bewegung reduzieren','Schaltet Kamera-Wackeln, Wischeffekte und Einblend-Animationen ab.',seg('motion',[['auto','Automatisch'],['weniger','Weniger']]));
 row(c,'Farbschwäche-Modus','KP-Balken in Blau/Orange statt Grün/Rot, Symbole stärker betont.',tog('cb'));
 row(c,'Textgeschwindigkeit','',seg('text',[['langsam','Langsam'],['normal','Normal'],['sofort','Sofort']]));
 row(c,'Intro beim Start','Die Eröffnungssequenz vor dem Titelbild.',tog('intro'));
 if(G){const p=sec('Spielstand');const bt=(t,f,cls)=>{const b=document.createElement('button');b.textContent=t;b.className='pill'+(cls?' '+cls:'');b.onclick=f;return b;};
  const r1=document.createElement('div');r1.className='btns';r1.append(bt('Speichern',save));row(p,'Spiel speichern','In der Kreaturenstation wird automatisch gespeichert.',r1);
  const r2=document.createElement('div');r2.className='btns';r2.append(bt('Bis 12 Uhr',()=>{G.time=720;updClock();toast('Es ist Mittag');}),bt('Bis 22 Uhr',()=>{G.time=1320;updClock();toast('Die Nacht bricht herein');}));
  row(p,'Rasten','Manche Kreaturen zeigen sich nur tagsüber oder nachts.',r2);
  const r3=document.createElement('div');r3.className='btns';const nb=bt('Neu starten',e=>{if(nb.dataset.c){try{localStorage.removeItem(SAVEKEY);}catch(x){}closeMenu();newGame();}else{nb.dataset.c=1;nb.textContent='Wirklich löschen?';}},'danger');r3.append(nb);
  row(p,'Neues Spiel','Löscht deinen Spielstand auf diesem Gerät.',r3);}}
// ---------- Vollbild & Layout (Agent UI-Vollbild) ----------
// portrait: 'drehen' (Hinweis „Bitte Gerät drehen“, Spiel pausiert) | 'allow' (Hochformat: Welt oben 60 %, Steuerung unten 40 %)
// fs: 1 = beim ersten Tippen Vollbild anfordern · hudDim: 'stark' (40 %) | 'mittel' (65 %) | 'aus' – Abblenden nach 4 s · ctrl-Alias 'dpad' = 'kreuz'
if(SET.portrait!=='allow')SET.portrait='drehen';if(SET.fs==null)SET.fs=1;
if(!['stark','mittel','aus'].includes(SET.hudDim))SET.hudDim=SET.inDim===0?'aus':'stark';
if(SET.ctrl==='dpad')SET.ctrl='kreuz';
// ---------- Look L1: Leistung & Ansicht (Migration alter Einstellungen) ----------
// gfx: 'auto'|'low'|'mid'|'high' (Qualitätsstufe der 3D-Welt, 43-perf.js) · res zusätzlich 'auto' (Gerätepixel + dynamische Auflösung) · view: 'third' (Standard) | '2d' (versteckte Option)
// Unveränderte Alt-Standards (res 1440 / 30 fps / „eigene“) wechseln einmalig auf Auto; bewusst gewählte Werte bleiben, werden aber auf Gerätepixel gekappt.
if(SET.lookV!==1){SET.lookV=1;if(SET.res==='1440'&&SET.quality==='eigene'&&+SET.fps===30){SET.res='auto';SET.fps=60;SET.quality='auto';}}
if(!['auto','low','mid','high'].includes(SET.gfx))SET.gfx='auto';SET.view=SET.view2d?'2d':'third';// SET.view2d (Optionen › Erweitert, L2) ist maßgeblich, SET.view spiegelt es
if(!['720','1080','1440','native','auto'].includes(String(SET.res)))SET.res='auto';
