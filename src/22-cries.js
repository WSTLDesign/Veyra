// ===== VEYRA – Kreaturenrufe (prozedural, WebAudio) & Sequenz-Registrierung =====
// Jede Art klingt anders: Form → Grundklang/Rhythmus, Element → Klangfarbe, Größe → Tonhöhe; MONS[id].cry{base,shape} überschreibt.
const CRY={last:{},noise:null};
const CRY_SHAPE={quad:{wave:'sawtooth',syl:2,att:.012,dur:.17,gap:.07,cont:'bark',q:4},blob:{wave:'sine',syl:3,att:.02,dur:.11,gap:.04,cont:'up',q:2},
 bird:{wave:'triangle',syl:3,att:.006,dur:.08,gap:.035,cont:'chirp',q:6},biped:{wave:'sawtooth',syl:2,att:.03,dur:.24,gap:.06,cont:'vowel',q:7},
 serpent:{wave:'triangle',syl:1,att:.08,dur:.55,gap:0,cont:'down',q:3,hiss:.5},golem:{wave:'square',syl:2,att:.04,dur:.3,gap:.08,cont:'down',q:3,rumble:1}};
const CRY_EL={glut:{crackle:.35,bright:1.2},flut:{vib:[9,.06],soft:1},flora:{soft:1.3,vib:[4,.03]},volt:{trem:[38,.7],wave:'square',bright:1.4},fels:{crackle:.2,bright:.7},
 frost:{bell:1,bright:1.5},boe:{hiss:.35,vib:[5,.04]},schatten:{detune:22,bright:.6,swell:1},lumen:{bell:.8,bright:1.3},kern:{}};
function cryNoise(){if(CRY.noise)return CRY.noise;const n=AC.sampleRate,b=AC.createBuffer(1,n,n),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return CRY.noise=b;}
function cryParams(id){const M=MONS[id],sh=M.sp[0],z=M.sp[4],S=Object.assign({},CRY_SHAPE[sh]||CRY_SHAPE.quad),E=Object.assign({},CRY_EL[M.t[0]]||{},M.t[1]?Object.fromEntries(Object.entries(CRY_EL[M.t[1]]||{}).map(([k,v])=>[k,typeof v==='number'?v*.5:v])):{});
 const h1=hs(id,17),h2=hs(id,29),h3=hs(id,41);let base=330*Math.pow(2,(.85-z)*2.2)*Math.pow(2,(h1*8-4)/12);if(M.legend)base*=.62;
 const syl=Math.max(1,Math.min(4,S.syl+(h2<.3?-1:h2>.75?1:0)));let cont=S.cont;if(h3>.7)cont=cont==='down'?'wobble':cont==='up'?'trill':cont;
 if(M.cry){if(M.cry.base)base=M.cry.base;if(M.cry.shape)cont=M.cry.shape;}return{S,E,base,syl,cont,z,leg:!!M.legend,h:h1};}
function playCry(id,o){o=o||{};try{if(!MONS[id]||typeof AC==='undefined'||!AC||AC.state!=='running'||!SET.sfx||!SET.vol||typeof master!=='function')return;}catch(e){return;}
 const now=performance.now();if(CRY.last[id]&&now-CRY.last[id]<450)return;CRY.last[id]=now;
 try{const{S,E,base,syl,cont,z,leg,h}=cryParams(id),t0=AC.currentTime+.02,vol=(o.vol??1)*SET.vol/100*(leg?.34:.26),out=AC.createGain();out.gain.value=vol;out.connect(master());
  const flt=AC.createBiquadFilter();flt.type=S.cont==='vowel'?'bandpass':'lowpass';flt.Q.value=S.q*(E.soft?.6:1);flt.frequency.value=Math.min(9000,base*(S.cont==='vowel'?2.6:5)*(E.bright||1)/(E.soft||1));flt.connect(out);
  let t=t0,end=t0;for(let i=0;i<syl;i++){const d=S.dur*(1+(i===syl-1?.35:0))*(leg?1.6:1)*(.8+z*.3),f=base*(cont==='bark'&&i===syl-1?.82:1)*(cont==='trill'?1+(i%2)*.18:1),g=AC.createGain();g.connect(flt);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(E.swell?.6:1,t+(E.swell?d*.6:S.att));g.gain.exponentialRampToValueAtTime(.0001,t+d);
   const mkO=(det)=>{const os=AC.createOscillator();os.type=E.wave&&S.wave!=='sine'?E.wave:S.wave;os.detune.value=det||0;const F=os.frequency;
    if(cont==='up'){F.setValueAtTime(f*.75,t);F.exponentialRampToValueAtTime(f*1.25,t+d);}else if(cont==='down'){F.setValueAtTime(f*1.2,t);F.exponentialRampToValueAtTime(f*.6,t+d);}
    else if(cont==='chirp'){F.setValueAtTime(f*1.1,t);F.exponentialRampToValueAtTime(f*1.9,t+d*.5);F.exponentialRampToValueAtTime(f*1.3,t+d);}
    else if(cont==='bark'){F.setValueAtTime(f*1.35,t);F.exponentialRampToValueAtTime(f,t+d*.25);F.exponentialRampToValueAtTime(f*.7,t+d);}
    else if(cont==='wobble'){F.setValueAtTime(f,t);for(let k=1;k<=6;k++)F.linearRampToValueAtTime(f*(k%2?1.15:.9),t+d*k/6);}
    else{F.setValueAtTime(f*.9,t);F.linearRampToValueAtTime(f*1.12,t+d*.4);F.exponentialRampToValueAtTime(f*.85,t+d);}
    if(E.vib){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=E.vib[0];lg.gain.value=f*E.vib[1];l.connect(lg);lg.connect(F);l.start(t);l.stop(t+d+.05);}
    os.connect(g);os.start(t);os.stop(t+d+.05);return os;};
   mkO(0);if(E.detune)mkO(E.detune);
   if(E.trem){const l=AC.createOscillator(),lg=AC.createGain();l.type='square';l.frequency.value=E.trem[0];lg.gain.value=E.trem[1]*.5;l.connect(lg);lg.connect(g.gain);l.start(t);l.stop(t+d+.05);}
   if(E.bell){const b=AC.createOscillator(),bg=AC.createGain();b.type='sine';b.frequency.value=f*(3.01+h);b.connect(bg);bg.connect(out);bg.gain.setValueAtTime(.0001,t);bg.gain.exponentialRampToValueAtTime(.35*E.bell,t+.01);bg.gain.exponentialRampToValueAtTime(.0001,t+d*2.2);b.start(t);b.stop(t+d*2.3);}
   const nz=(S.hiss||0)+(E.hiss||0),cr=E.crackle||0,rb=S.rumble||0;
   if(nz||cr||rb){const n=AC.createBufferSource();n.buffer=cryNoise();const nf=AC.createBiquadFilter(),ng=AC.createGain();nf.type=rb?'lowpass':'bandpass';nf.frequency.value=rb?220:cr?2400:4200;nf.Q.value=rb?1:cr?.8:1.5;
    n.connect(nf);nf.connect(ng);ng.connect(out);const a=rb?.9:cr?cr*1.6:nz*.9;ng.gain.setValueAtTime(.0001,t);ng.gain.exponentialRampToValueAtTime(a,t+(cr?.005:d*.3));
    if(cr)for(let k=1;k<6;k++)ng.gain.setValueAtTime(a*(k%2?.15:1),t+d*k/6);ng.gain.exponentialRampToValueAtTime(.0001,t+d);n.start(t,Math.random()*.5);n.stop(t+d+.05);}
   end=t+d;t+=d+S.gap;}
  setTimeout(()=>{try{out.disconnect();}catch(e){}},(end-t0+1)*1000);}catch(e){}}
// Kampfbeginn: Ruf des Gegners (14 lädt vorher)
if(typeof startBattleNow==='function'){const _sbn=startBattleNow;startBattleNow=function(o){const r=_sbn.apply(this,arguments);setTimeout(()=>{try{if(B&&B.foe&&B.foe[0])playCry(B.foe[0].s);}catch(e){}},420);return r;};}
// Sequenz: Glanzform erscheint (Implementierung in 10-mon3d.js)
SEQ.shinyAppear=seqShinyAppear;
