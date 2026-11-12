// ===== VEYRA – Feinschliff: Übergänge, Text, Sound, Haptik =====
let TW=null,AC=null,bt=0;
let RED=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Rivalenname: Texte nennen den Rivalen „Lio“ – im Spiel steht der selbst gewählte Name (G.rival)
function rivalize(t){t=String(t??'');if(typeof G==='undefined'||!G)return t;if(G.rival&&G.rival!=='Lio')t=t.replace(/\bLio\b/g,G.rival);if(G.name)t=t.replace(/\{name\}/g,G.name);return t;}
const TSPEED={langsam:1,normal:2,mittel:2,schnell:4};
function typeInto(el,text,fast,voice){text=rivalize(text);if(el._tw)el._tw.finish();let i=0,done=false,iv=0;
 const c={done:()=>done,finish(){if(done)return;done=true;clearInterval(iv);el.textContent=text;el.classList.remove('typing');}};el._tw=c;
 if(RED||SET.text==='sofort'){el.textContent=text;done=true;return c;}
 el.textContent='';el.classList.add('typing');iv=setInterval(()=>{const sp=TSPEED[SET.text]||2;i+=fast?sp+1:sp;if(voice&&i%4<sp&&text[i]!==' ')blip(voice);el.textContent=text.slice(0,i);if(i>=text.length){done=true;clearInterval(iv);el.classList.remove('typing');}},16);return c;}
// Effekte: [Wellenform, Startfrequenz, Endfrequenz, Dauer, Pegel, Verzögerung]; mehrere Teile je Schlüssel möglich
const SFX={tap:[['sine',620,900,.05,.05]],hit:[['square',240,70,.12,.06]],crit:[['sawtooth',340,50,.22,.07]],enc:[['triangle',330,990,.3,.07]],
 catch:[['sine',520,1240,.35,.07]],lvl:[['triangle',523,1318,.4,.07]],heal:[['sine',392,880,.45,.06]],bump:[['sine',140,90,.07,.05]],
 door:[['triangle',210,150,.07,.07],['sine',300,190,.09,.05,.07],['sine',880,1320,.12,.018,.12]],stairs:[['triangle',300,240,.05,.05],['triangle',260,200,.05,.05,.09],['triangle',220,170,.05,.05,.18]],
 ring:[['sine',988,988,.12,.05],['sine',1318,1318,.12,.05,.14],['sine',988,988,.12,.05,.5],['sine',1318,1318,.12,.05,.64]],
 page:[['triangle',1400,500,.07,.025],['sine',700,1100,.08,.02,.05]],open:[['sine',330,660,.12,.04],['triangle',660,990,.1,.03,.08]],close:[['sine',660,330,.1,.04],['triangle',300,200,.06,.04,.08]],
 pop:[['sine',500,1100,.08,.045]],whoosh:[['sawtooth',180,900,.35,.018]],land:[['sine',160,70,.14,.08]],emote:[['sine',900,1500,.06,.03]]};
const SFXT={};function sfx(k){SFXT[k]=performance.now();if(!SET.sfx||!SET.vol)return;try{initAudio();}catch(e){return;}const L=SFX[k];if(!L||!AC)return;
 for(const S of L){const t=AC.currentTime+(S[5]||0),o=AC.createOscillator(),g=AC.createGain();o.type=S[0];o.connect(g);g.connect(master());
  o.frequency.setValueAtTime(S[1],t);o.frequency.exponentialRampToValueAtTime(S[2],t+S[3]);g.gain.setValueAtTime(.0001,AC.currentTime);g.gain.setValueAtTime(S[4]*2.2*SET.vol/100,t);g.gain.exponentialRampToValueAtTime(.0001,t+S[3]+.06);o.start(t);o.stop(t+S[3]+.08);}}
function vib(p){if(!SET.vib)return;try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}}
function bump(){const n=performance.now();if(n-bt>450){bt=n;sfx('bump');}}
function zoneCol(id){if(!id)return'#05080a';if(INTERIORS[id])return'#2a1d14';return REGION[id]?shade(REGION[id][1],.32):'#05080a';}
// Übergang: läuft über SEQ.doorFade (23-intro.js), Fallback = alter Fade
function seqHas(n){try{return typeof SEQ[n]==='function';}catch(e){return false;}}
function transit(fn,to){if(seqHas('doorFade')){playSeq('doorFade',{fn,to});return;}const f=$('#fade');f.style.background=zoneCol(to);mode='wait';f.classList.add('on');
 setTimeout(()=>{fn();requestAnimationFrame(()=>requestAnimationFrame(()=>{f.classList.remove('on');if(mode==='wait')mode='world';}));},RED?0:210);}
// Schadenszahlen über der Kampfszene: Pop mit Überschwinger, weiche Kontur, Funken bei starken Treffern
const _drawBattle=drawBattle;drawBattle=function(){_drawBattle();if(!B||!B.pops)return;const c=$('#bcv').getContext('2d'),t=performance.now();
 B.pops=B.pops.filter(p=>t-p.t<1100);for(const p of B.pops){const k=(t-p.t)/1100,q=scr(p.who),x=q[0]+(p.big?0:4),y=q[1]-20-(1-Math.pow(1-k,2))*22;
  const ki=Math.min(1,k/.2)-1,s=RED?1:.45+.55*(1+2.70158*ki**3+1.70158*ki**2),fs=p.big?18:14;
  c.save();c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.translate(x,y);c.scale(s,s);
  if(p.big&&!RED){c.save();c.globalAlpha*=Math.max(0,1-k*2);c.strokeStyle=p.col;c.lineWidth=2;c.lineCap='round';for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.3,r0=fs*.7+k*30,r1=r0+5;c.beginPath();c.moveTo(Math.cos(a)*r0,Math.sin(a)*r0*.7-fs*.3);c.lineTo(Math.cos(a)*r1,Math.sin(a)*r1*.7-fs*.3);c.stroke();}c.restore();}
  c.font=`700 ${fs}px Fredoka, sans-serif`;c.textAlign='center';c.textBaseline='alphabetic';c.lineJoin='round';
  c.shadowColor='rgba(8,12,18,.35)';c.shadowOffsetY=2;c.shadowBlur=4;c.lineWidth=5;c.strokeStyle='rgba(20,26,38,.92)';c.strokeText(p.txt,0,0);c.shadowColor='transparent';
  const g=c.createLinearGradient(0,-fs,0,0);g.addColorStop(0,'#ffffff');g.addColorStop(1,p.col);c.fillStyle=g;c.fillText(p.txt,0,0);c.restore();}};
// ---------- Musik (generativ) ----------
let MUS=null;
const SONGS={title:{bpm:68,ch:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]},world:{bpm:86,ch:[[48,52,55],[57,60,64],[53,57,60],[55,59,62]]},
 night:{bpm:64,ch:[[57,60,64],[52,55,59],[53,57,60],[52,56,59]]},battle:{bpm:136,ch:[[45,48,52],[45,48,52],[41,45,48],[43,47,50]]}};
let MASTER=null,SILENT=null;
function master(){if(!MASTER){MASTER=AC.createDynamicsCompressor();MASTER.threshold.value=-14;MASTER.knee.value=20;MASTER.ratio.value=6;const g=AC.createGain();g.gain.value=1.9;MASTER.connect(g);g.connect(AC.destination);}return MASTER;}
function unlockMedia(){if(SILENT)return;try{SILENT=document.createElement('audio');SILENT.setAttribute('playsinline','');SILENT.loop=true;SILENT.volume=.01;
 SILENT.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';const p=SILENT.play();if(p&&p.catch)p.catch(()=>{SILENT=null;});}catch(e){SILENT=null;}}
function initAudio(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state!=='running')AC.resume().then(()=>{if(G&&!G._sndOk){G._sndOk=1;}});unlockMedia();}catch(e){return;}
 if(!MUS){MUS={g:AC.createGain(),step:0,next:0,m:null};MUS.g.gain.value=0;MUS.g.connect(master());}}
function audioState(){return !AC?'noch nicht gestartet':AC.state==='running'?'aktiv':'blockiert – tippe irgendwo ins Spiel';}
function note(n,t,d,type,v){const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1700;o.type=type;o.frequency.value=440*Math.pow(2,(n-69)/12);
 o.connect(f);f.connect(g);g.connect(MUS.g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.05);}
function musTick(){if(!MUS||!AC||AC.state!=='running')return;const vol=SET.music?SET.vol/100*SET.mvol/100*1.1:0;MUS.g.gain.setTargetAtTime(vol,AC.currentTime,.3);if(!vol)return;
 const m=mode==='battle'?'battle':(typeof I3!=='undefined'&&I3)?'intro':(!G||mode==='title'||!$('#intro').hidden)?'title':(cur&&cur.theme!=='inside'&&isNight())?'night':'world';if(m!==MUS.m){MUS.m=m;MUS.step=0;}
 const S=SONGS[m],beat=60/S.bpm;if(MUS.next<AC.currentTime)MUS.next=AC.currentTime+.05;
 while(MUS.next<AC.currentTime+.35){const t=MUS.next,st=MUS.step,ch=S.ch[Math.floor(st/8)%4];
  if(st%8===0)ch.forEach(n=>note(n,t,beat*4.2,'sine',m==='intro'?.06:.045));if(m==='intro'){if(st%8===0)note(ch[0]-12,t,beat*4,'triangle',.05);if(st%4===0)note(ch[2]+24,t,beat*1.2,'sine',.02);MUS.step++;MUS.next=t+beat/2;continue;}
  note(ch[[0,1,2,1,0,2,1,2][st%8]]+12,t,beat*.9,m==='battle'?'square':'triangle',m==='battle'?.02:.03);
  if(m==='battle'&&st%2===0)note(ch[0]-12,t,beat*.7,'sawtooth',.025);if(m==='world'&&st%4===2)note(ch[2]+24,t,beat*.5,'sine',.015);
  MUS.step++;MUS.next=t+beat/2;}}
setInterval(musTick,90);
['pointerdown','pointerup','touchend','click','keydown'].forEach(e=>document.addEventListener(e,initAudio,{passive:true}));document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AC&&AC.state!=='running')AC.resume().catch(()=>{});});
// ---------- Rascheln & Blubbern (Agent Bewegung): prozedurales Rauschen für versteckte Begegnungen ----------
// sfx('rustle'): drei kurze, bandgefilterte Rausch-Stöße (Grashalme) · sfx('bubble'): aufsteigende Sinus-Blasen (Wasser/Angel)
let NOISEB=null;function noiseBuf(){if(NOISEB)return NOISEB;const n=AC.sampleRate*.4|0,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);let x=0;for(let i=0;i<n;i++){x=x*.6+(Math.random()*2-1)*.4;d[i]=x;}return NOISEB=b;}
function sfxNoise(k){if(!SET.sfx||!SET.vol)return;try{initAudio();}catch(e){return;}if(!AC)return;const v=SET.vol/100*2.2,t0=AC.currentTime+.01;
 if(k==='rustle'){[[0,.11,3200],[.13,.09,4200],[.28,.14,2700],[.46,.08,3800]].forEach(([dt,d,f])=>{const s=AC.createBufferSource(),bp=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=1.4;
  s.connect(bp);bp.connect(g);g.connect(master());const t=t0+dt;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09*v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.start(t,Math.random()*.2);s.stop(t+d+.02);});}
 else{for(let i=0;i<4;i++){const o=AC.createOscillator(),g=AC.createGain(),t=t0+i*.09+Math.random()*.03,f=260+Math.random()*180;o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*2.6,t+.07);
  o.connect(g);g.connect(master());g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05*v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.08);o.start(t);o.stop(t+.1);}}}
const _sfxMV=sfx;sfx=function(k){if(k==='rustle'||k==='bubble'){SFXT[k]=performance.now();return sfxNoise(k);}return _sfxMV(k);};
