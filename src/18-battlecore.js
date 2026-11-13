// ===== VEYRA – Kampfkern (ohne DOM): Schaden, Zugfolge, Zustände, Wetter & Felder, Resonanz, Gegner-KI =====
// Runde und Echtzeit nutzen dieselben Funktionen; 14-battle.js spielt nur die Ereignisse ab (msg/fx/hit).
// Ereignisse: {k:'msg',s} · {k:'hit',who,dmg,crit,eff,col,mon} · {k:'fx',who,col,buff} · {k:'lunge',who} · {k:'upd'} · {k:'faint',mon}
const STG_KEYS=['atk','def','spa','spd','spe','acc','eva'];
const stg=s=>s>=0?(2+s)/2:2/(2-s);
const stgAcc=s=>s>=0?(3+s)/3:3/(3-s);
// Balancing (tools/balance.mjs): Schadens-Skalierung, damit wilde Kämpfe 3–6 Züge dauern
let DMG_SCALE=.5;
// Schwierigkeit (SET.diff): zentrale Faktoren, 'normal' = unveränderte Werte
const DIFF={leicht:{dmgMe:1.3,dmgFoe:.65,catch:1.6,xp:1.5,wildGap:[1,3],trainerCap:true,aiRoute0:true,loseLoss:0,shop:.6,enc:.6,noAggro:true,statusMax:2},
 normal:{dmgMe:1,dmgFoe:1,catch:1,xp:1,wildGap:null,trainerCap:false,aiRoute0:false,loseLoss:.5,shop:1,enc:1,noAggro:false,statusMax:0}};
function DF(){return DIFF[typeof SET!=='undefined'&&SET&&SET.diff]||DIFF.leicht;}
function topLv(){return G&&G.team&&G.team.length?Math.max(...G.team.map(m=>m.l)):5;}
// Wilde Kreatur: 1–3 Level unter dem höchsten Teamlevel deckeln (Tabellen bleiben)
function wildLv(l){const g=DF().wildGap;if(!g)return l;return Math.max(2,Math.min(l,topLv()-g[0]-(Math.random()*(g[1]-g[0]+1)|0)));}
function trainerLv(l,tr){if(!DF().trainerCap)return l;return Math.max(2,Math.min(l,topLv()+(tr&&tr.leader?1:0)));}
const STRUGGLE=['Verzweifeln','kern',50,100,1,'recoil4','phys',0,2.5];
function newStages(){return{atk:0,def:0,spa:0,spd:0,spe:0,acc:0,eva:0};}
function abil(m){return(m&&(m.ability||MONS[m.s].ab))||'';}
function heldOf(m){return(m&&m.heldItem)||'';}
function maxHp(m){return stat(m,'hp');}
function mtypes(m){return MONS[m.s].t;}
function sideOf(m){return G&&G.team&&G.team.includes(m)?'me':'foe';}
function bNight(){try{return typeof isNight==='function'&&G&&G.time!=null?isNight():false;}catch(e){return false;}}

// ---------- Wetter & Felder ----------
const WEATHER={
 sonne:{n:'Sonne',c:'#ffb43a',boost:{glut:1.5,flut:.5},start:'Die Sonne brennt grell!',end:'Das Sonnenlicht lässt nach.'},
 regen:{n:'Regen',c:'#3d8fe0',boost:{flut:1.5,glut:.5},start:'Es beginnt zu regnen!',end:'Der Regen hört auf.'},
 sand:{n:'Sandsturm',c:'#c9a46a',chip:1/16,safe:['fels','kern'],start:'Ein Sandsturm zieht auf!',end:'Der Sandsturm legt sich.'},
 schnee:{n:'Schnee',c:'#cfeaf5',boost:{frost:1.3},chip:1/16,safe:['frost'],start:'Dichter Schnee fällt!',end:'Der Schneefall endet.'},
 nebel:{n:'Nebel',c:'#b9c3cc',acc:.9,start:'Nebel verhüllt das Feld.',end:'Der Nebel lichtet sich.'},
 gewitter:{n:'Gewitter',c:'#5b6aa8',boost:{volt:1.3,flut:1.2},start:'Ein Gewitter grollt!',end:'Das Gewitter zieht ab.'}};
const FIELDS={
 bluete:{n:'Blütenwiese',c:'#7ccf6a',boost:{flora:1.3},heal:1/16,start:'Eine Blütenwiese überzieht das Kampffeld!',end:'Die Blüten verwelken.'},
 funken:{n:'Funkenfeld',c:'#e8c22e',boost:{volt:1.3},noSleep:true,start:'Knisternde Funken tanzen über den Boden!',end:'Das Funkenfeld erlischt.'}};
const WORLD_WX={regen:'regen',gewitter:'gewitter',schnee:'schnee',sand:'sand',nebel:'nebel',sonne:'sonne'};
function setWeather(B,k,turns){if(!WEATHER[k]||B.weather===k)return[];B.weather=k;B.wxT=turns||5;return[{k:'msg',s:WEATHER[k].start},{k:'upd'}];}
function setField(B,k,turns){if(!FIELDS[k])return[];if(B.field&&B.field.k===k)return[];B.field={k,name:FIELDS[k].n,turns:turns||5};return[{k:'msg',s:FIELDS[k].start},{k:'upd'}];}
function wxBoost(B,type){const W=WEATHER[B&&B.weather];let m=W&&W.boost&&W.boost[type]||1;const F=B&&B.field&&FIELDS[B.field.k];if(F&&F.boost&&F.boost[type])m*=F.boost[type];return m;}

// ---------- Zustände: 5 eigene + Benommenheit (flüchtig, m.conf) ----------
const STATUS={
 sengen:{n:'Versengt',c:'#f2753a',short:'VRS',d:'Verliert je Runde 1/16 KP · physischer Schaden −30 %',immune:['glut'],on:'wird versengt!',
  onTurn(m){const d=Math.max(1,Math.floor(maxHp(m)/16));m.hp=Math.max(0,m.hp-d);return[{k:'hit',who:sideOf(m),dmg:d,col:'#f2753a',mon:m,dot:1},{k:'msg',s:mname(m)+' leidet unter der Glut.'}];},canAct(){return{ok:true};}},
 raureif:{n:'Raureif',c:'#79d6e8',short:'RAU',d:'Initiative halbiert · Spezial-Schaden −30 % · taut mit 25 % je Runde',immune:['frost'],on:'ist von Raureif überzogen!',
  onTurn(m){if(Math.random()<.25){m.status=null;return[{k:'msg',s:'Der Raureif auf '+mname(m)+' taut.'},{k:'upd'}];}return[];},canAct(){return{ok:true};}},
 starre:{n:'Erstarrt',c:'#e8c22e',short:'STR',d:'Initiative −40 % · setzt mit 25 % Chance aus',immune:['volt'],on:'erstarrt!',
  onTurn(){return[];},canAct(m){return Math.random()<.25?{ok:false,s:mname(m)+' ist erstarrt und kann sich nicht rühren!'}:{ok:true};}},
 schlummer:{n:'Schlummer',c:'#7d5aa6',short:'SLM',d:'Schläft 1–3 Züge',on:'fällt in tiefen Schlummer!',
  onTurn(){return[];},canAct(m){if((m.statusT|0)>0){m.statusT--;return{ok:false,s:mname(m)+' schlummert tief.'};}m.status=null;return{ok:true,s:mname(m)+' ist aufgewacht!'};}},
 sporen:{n:'Sporen',c:'#6fae3c',short:'SPO',d:'Verliert je Runde 1/10 KP · Heilung halbiert',immune:['flora'],on:'ist von Sporen befallen!',
  onTurn(m){const d=Math.max(1,Math.floor(maxHp(m)/10));m.hp=Math.max(0,m.hp-d);return[{k:'hit',who:sideOf(m),dmg:d,col:'#6fae3c',mon:m,dot:1},{k:'msg',s:'Die Sporen zehren an '+mname(m)+'.'}];},canAct(){return{ok:true};}},
 wirr:{n:'Benommen',c:'#c98ad8',short:'BEN',d:'2–4 Züge: 33 % Chance, sich selbst zu treffen',volatile:true,on:'ist benommen!',onTurn(){return[];},canAct(){return{ok:true};}}};
function applyStatus(B,T,k,src){if(!T||T.hp<=0)return[];const S=STATUS[k],tn=mname(T);if(!S)return[];
 if(k==='wirr'){if(T.conf>0||abil(T)==='lichtschild')return[{k:'msg',s:tn+' bleibt unbeirrt.'}];T.conf=2+(Math.random()*3|0);if(sideOf(T)==='me'&&DF().statusMax)T.conf=Math.min(T.conf,DF().statusMax);return[{k:'fx',who:sideOf(T),col:S.c},{k:'msg',s:tn+' '+S.on},{k:'upd'}];}
 if(T.status)return[{k:'msg',s:tn+' ist bereits '+STATUS[T.status].n.toLowerCase()+'.'}];
 if(S.immune&&mtypes(T).some(t=>S.immune.includes(t)))return[{k:'msg',s:'Das wirkt nicht auf '+tn+'.'}];
 if(k==='schlummer'&&(abil(T)==='lichtschild'||abil(T)==='wachsam'||(B&&B.field&&FIELDS[B.field.k].noSleep)))return[{k:'msg',s:tn+' bleibt hellwach!'}];
 T.status=k;T.statusAge=0;T.statusT=k==='schlummer'?1+(Math.random()*3|0):0;if(sideOf(T)==='me'&&DF().statusMax)T.statusT=Math.min(T.statusT,DF().statusMax);return[{k:'fx',who:sideOf(T),col:S.c},{k:'msg',s:tn+' '+S.on},{k:'upd'}];}
function healAmt(m,n){let v=n;if(m.status==='sporen')v*=.5;if(abil(m)==='tiefwurzel')v*=1.5;return Math.max(1,Math.floor(v));}
function healMonB(m,n){const max=maxHp(m),b=m.hp;m.hp=Math.min(max,m.hp+healAmt(m,n));return m.hp-b;}

// ---------- Werte im Kampf ----------
function stOf(B,m){if(!B)return newStages();if(!B.stm)B.stm=new Map();let s=B.stm.get(m);if(!s){s=newStages();B.stm.set(m,s);}return s;}
function changeStage(B,T,key,n,src){const st=stOf(B,T),tn=mname(T),L={atk:'Angriff',def:'Verteidigung',spa:'Spezial-Angriff',spd:'Spezial-Verteidigung',spe:'Initiative',acc:'Genauigkeit',eva:'Ausweichen'}[key];
 if(n<0&&src&&src!==T&&abil(T)==='klarblick')return[{k:'msg',s:'Klarblick! Die Werte von '+tn+' sinken nicht.'}];
 const v=Math.max(-6,Math.min(6,st[key]+n));if(v===st[key])return[{k:'msg',s:'Die '+L+' von '+tn+' kann sich nicht weiter ändern.'}];
 const d=v-st[key];st[key]=v;const out=[{k:'fx',who:sideOf(T),col:n>0?'#ffd166':'#8fb3c6',buff:n>0},{k:'msg',s:'Die '+L+' von '+tn+(d>1?' steigt stark!':d>0?' steigt!':d<-1?' sinkt stark!':' sinkt!')},{k:'upd'}];
 if(d<0&&src&&src!==T&&abil(T)==='trotzkopf'&&st.atk<6){st.atk=Math.min(6,st.atk-d);out.push({k:'msg',s:'Trotzkopf! Der Angriff von '+tn+' steigt.'});}return out;}
function battleStat(B,m,k,o){let v=stat6(m,k);if(STG_KEYS.includes(k)&&k!=='acc'&&k!=='eva'){let s=stOf(B,m)[k];if(o&&o.crit){if(o.att&&s<0)s=0;if(o.def&&s>0)s=0;}v*=stg(s);}return v;}
function speedOf(B,m){let s=battleStat(B,m,'spe');const a=abil(m),w=B&&B.weather;
 if(m.status==='raureif')s*=.5;if(m.status==='starre')s*=.6;if(a==='flink')s*=1.2;if(a==='regentanz'&&w==='regen')s*=2;if(a==='flimmer'&&w==='sonne')s*=1.5;if(heldOf(m)==='flinkfeder')s*=1.2;return s;}
function prioOf(m,M){return(M?M[7]|0:0)+(M&&M[6]==='status'&&abil(m)==='flinkzunge'?1:0);}
// Zugreihenfolge: Wechsel/Items/Flucht zuerst, dann Priorität, dann Initiative, Gleichstand zufällig
function orderActions(B,acts){for(const a of acts){a._r=Math.random();const M=a.k==='move'?(a.i<0?STRUGGLE:MOVES[a.mon.moves[a.i].id]):null;a._p=a.k==='move'?prioOf(a.mon,M):7;a._s=speedOf(B,a.mon);}
 return acts.sort((x,y)=>(y._p-x._p)||(y._s-x._s)||(x._r-y._r));}

// ---------- Schaden ----------
// calcDamage(att,def,move,ctx) → {dmg,crit,eff,stab,absorb}; ctx: {B, crit (erzwingen true/false), rnd (0,85–1), spread, res:{type}}
function calcDamage(att,def,move,ctx){ctx=ctx||{};const B=ctx.B||null,M=Array.isArray(move)?move:MOVES[move];if(!M||!M[2])return{dmg:0,crit:false,eff:1,stab:1};
 const type=M[1],kat=M[6]==='spez'?'spez':'phys',aA=abil(att),dA=abil(def),tD=mtypes(def),tA=mtypes(att),res=ctx.res||null;
 if(dA==='glutfang'&&type==='glut')return{dmg:0,crit:false,eff:1,absorb:'heal'};
 if(dA==='quellherz'&&type==='flut')return{dmg:0,crit:false,eff:1,absorb:'heal'};
 if(dA==='blitzfang'&&type==='volt')return{dmg:0,crit:false,eff:1,absorb:'spa'};
 let e=eff(type,tD);if(res&&res.type&&res.type!==type)e=Math.max(e,eff(res.type,tD));// Resonanz: Element als Typ-Zusatz
 if(e===0)return{dmg:0,crit:false,eff:0,stab:1};
 let cc=1/16;if(aA==='gluecks')cc*=2;if((att.friendship|0)>=220)cc*=2;cc=Math.min(cc,1/3);
 const crit=dA==='felspanzer'?false:ctx.crit!=null?!!ctx.crit:Math.random()<cc;
 let A=battleStat(B,att,kat==='spez'?'spa':'atk',{crit,att:1}),D=battleStat(B,def,kat==='spez'?'spd':'def',{crit,def:1});const w=B&&B.weather,night=ctx.night!=null?ctx.night:bNight();
 if(kat==='phys'&&aA==='nachtauge'&&night)A*=1.2;if(kat==='phys'&&aA==='sonnenseele'&&!night)A*=1.2;
 if(w==='sand'&&kat==='spez'&&tD.includes('fels'))D*=1.5;if(w==='schnee'&&kat==='phys'&&tD.includes('frost'))D*=1.3;
 let dmg=(((2*att.l/5+2)*M[2]*A/Math.max(1,D))/50+2)*DMG_SCALE;
 const stabT=tA.includes(type)||(res&&res.type===type),stab=stabT?(aA==='wesensgleich'?1.75:1.5):1;dmg*=stab;
 if(res&&res.type===type)dmg*=1.3;
 dmg*=wxBoost(B,type);
 if(aA==='notkraft'&&att.hp<maxHp(att)/3&&tA.includes(type))dmg*=1.5;
 if(aA==='kraftprotz'&&kat==='phys')dmg*=1.2;if(aA==='scharfsinn'&&kat==='spez')dmg*=1.15;if(aA==='sonnenglut'&&kat==='spez'&&w==='sonne')dmg*=1.3;
 const area=/(^|,)area(,|$)/.test(M[5]||'');if(aA==='schwarmgeist'&&area)dmg*=1.25;if(ctx.spread)dmg*=.75;
 if(att.status==='sengen'&&kat==='phys')dmg*=.7;if(att.status==='raureif'&&kat==='spez')dmg*=.7;
 const hi=heldOf(att);if(hi&&ITEMS[hi]&&ITEMS[hi].boost===type)dmg*=1.2;if(hi==='kraftreif')dmg*=1.25;
 if(dA==='dickhaut')dmg*=.8;if(crit)dmg*=1.5;
 if(att!==def)dmg*=sideOf(att)==='me'?DF().dmgMe:DF().dmgFoe*(DF().dmgFoe<1&&B&&B.ai>=3?1.2:1);
 dmg*=e*(ctx.rnd!=null?ctx.rnd:.85+Math.random()*.15);
 return{dmg:Math.max(1,Math.floor(dmg)),crit,eff:e,stab};}
function hitChance(B,A,T,M){if(M[3]>=101)return 1;const aA=abil(A),w=B&&B.weather;
 if(aA==='sturmsinn'&&(w==='regen'||w==='gewitter')&&(M[1]==='boe'||M[1]==='volt'))return 1;
 let p=M[3]/100*stgAcc(stOf(B,A).acc-stOf(B,T).eva);if(aA==='kraftprotz'&&M[6]==='phys')p*=.9;
 const dA=abil(T);if(dA==='schattenmantel'&&bNight())p*=.85;if(dA==='sandschleier'&&w==='sand')p*=.8;if(dA==='schneemantel'&&w==='schnee')p*=.8;
 if(WEATHER[w]&&WEATHER[w].acc)p*=WEATHER[w].acc;return p;}
// Effekt-Kürzel lesen (alt: pri, foeAtkDn, defUp, atkUp, heal, drain)
const FX_ALIAS={foeAtkDn:'foe:atk:-1',defUp:'self:def:1',atkUp:'self:atk:1'};
function parseFx(s){if(!s)return[];return String(s).split(',').map(x=>FX_ALIAS[x]||x).map(x=>{const p=x.split(':');return{k:p[0],a:p[1],b:p[2],c:p[3]};});}

// ---------- Resonanz: lädt durch Schaden, 3 Züge / 8 s Elementform ----------
function chargeRes(B,side,amt){if(!B||!B.res)return;const lead=side==='me'?G.team[B.mi]:B.foe[B.fi];let k=1;if(lead&&abil(lead)==='resoseele')k*=1.5;if(lead&&heldOf(lead)==='resokristall')k*=1.3;
 B.res[side]=Math.min(1,(B.res[side]||0)+amt*k);}
function resActive(B,side,m){const r=B&&B.resOn&&B.resOn[side];if(!r||(m&&r.mon!==m))return null;if(B.rt?Date.now()>r.until:r.turns<=0)return null;return r;}
function useResonance(side){side=side||'me';if(typeof B==='undefined'||!B||!B.res||(B.res[side]||0)<1||resActive(B,side))return false;
 const m=side==='me'?G.team[B.mi]:B.foe[B.fi];if(!m||m.hp<=0)return false;const type=mtypes(m)[0];B.res[side]=0;B.resOn=B.resOn||{};
 B.resOn[side]={mon:m,type,turns:3,until:Date.now()+8000,col:TYPES[type].c};B.aura={who:side,col:TYPES[type].c,t:Date.now()};
 try{if(typeof SEQ!=='undefined'&&SEQ.resonance)playSeq('resonance',{side,mon:m,type});}catch(e){}
 if(typeof resonanceFx==='function')resonanceFx(side,m,type);return true;}

// ---------- Attacke ausführen (rein, liefert Ereignisse) ----------
function foesOf(B,side){return side==='me'?(B.foes||[B.foe[B.fi]]):(B.mine||[B.mi]).map(i=>G.team[i]);}
function alliesOf(B,side){return side==='me'?(B.mine||[B.mi]).map(i=>G.team[i]):(B.foes||[B.foe[B.fi]]);}
function dealDamage(B,T,dmg,src){const max=maxHp(T);let d=Math.min(dmg,T.hp),note=null;
 if(d>=T.hp&&T.hp===max&&max>1){if(abil(T)==='zaeh'){d=T.hp-1;note=' hält dank Zähigkeit durch!';}else if(heldOf(T)==='zaehwurz'){d=T.hp-1;T.heldItem=null;note=' klammert sich an die Zähwurz!';}}
 if(!note&&d>=T.hp&&sideOf(T)==='me'&&B&&!B.sim){const f=T.friendship|0,p=f>=250?.15:f>=200?.1:0;if(p&&Math.random()<p){d=T.hp-1;note=' hält aus Treue zu dir mit 1 KP durch!';}}
 T.hp=Math.max(0,T.hp-d);return{d,note};}
function execMove(B,side,A,mi,D,o){o=o||{};const ev=[],od=side==='me'?'foe':'me',an=mname(A),pre=side==='me'?'':(B.tr?'Gegnerisches ':'Wildes ');
 if(!A||A.hp<=0)return ev;let M,mid=null;if(mi<0||!A.moves[mi])M=STRUGGLE;else{const mv=A.moves[mi];mv.pp=Math.max(0,mv.pp-1);mid=mv.id;M=MOVES[mid];}
 // Kann handeln?
 if(A.status&&STATUS[A.status]){const c=STATUS[A.status].canAct(A,B);if(c.s)ev.push({k:'msg',s:c.s});if(!c.ok){ev.push({k:'upd'});return ev;}if(!A.status)ev.push({k:'upd'});}
 if(A.conf>0){A.conf--;if(A.conf<=0){ev.push({k:'msg',s:an+' ist nicht mehr benommen.'});}
  else if(Math.random()<1/3){const r=calcDamage(A,A,['','kern',40,100,1,null,'phys',0,0],{B,crit:false});const x=dealDamage(B,A,r.dmg,A);ev.push({k:'msg',s:an+' ist benommen …'},{k:'hit',who:side,dmg:x.d,col:'#c98ad8',mon:A},{k:'msg',s:'Es trifft sich vor Verwirrung selbst!'});return ev;}}
 ev.push({k:'msg',s:pre+an+' setzt '+M[0]+' ein!'},{k:'lunge',who:side});
 const fx=parseFx(M[5]),has=k=>fx.find(f=>f.k===k),area=!!has('area'),res=resActive(B,side,A);
 let targets=[D];const opp=foesOf(B,side).filter(m=>m&&m.hp>0);if(area&&B.double)targets=opp;else if(!D||D.hp<=0)targets=opp.length?[opp[0]]:[];
 if(!targets.length&&M[2]){ev.push({k:'msg',s:'Doch es gibt kein Ziel mehr.'});return ev;}
 if(M[2]){const spread=area&&targets.length>1;
  for(const T of targets){const tn=mname(T),ts=sideOf(T);
   if(Math.random()>=hitChance(B,A,T,M)){ev.push({k:'msg',s:spread?tn+' weicht aus!':'Daneben!'});continue;}
   const r=calcDamage(A,T,M,{B,spread,res});
   if(r.absorb){if(r.absorb==='spa')ev.push(...changeStage(B,T,'spa',1,T));else{const h=healMonB(T,maxHp(T)/4);ev.push({k:'msg',s:tn+' nimmt die Energie auf'+(h?' und heilt sich.':'.')},{k:'upd'});}continue;}
   if(r.eff===0){ev.push({k:'msg',s:'Das hat keine Wirkung auf '+tn+' …'});continue;}
   const x=dealDamage(B,T,r.dmg,A);ev.push({k:'hit',who:ts,dmg:x.d,crit:r.crit,eff:r.eff,col:TYPES[M[1]].c,mon:T,type:M[1]});
   if(r.crit)ev.push({k:'msg',s:'Volltreffer!'});if(r.eff>1)ev.push({k:'msg',s:spread?'Sehr effektiv gegen '+tn+'!':'Das ist sehr effektiv!'});else if(r.eff<1)ev.push({k:'msg',s:spread?'Wenig Wirkung bei '+tn+' …':'Das ist nicht sehr effektiv …'});
   if(x.note)ev.push({k:'msg',s:tn+x.note});
   // Resonanz laden: Austeilen und Einstecken
   const frac=x.d/Math.max(1,maxHp(T));chargeRes(B,side,frac*.55);chargeRes(B,ts,frac*.4);
   if(T.status==='raureif'&&M[1]==='glut'){T.status=null;ev.push({k:'msg',s:'Die Glut taut '+tn+' auf!'},{k:'upd'});}
   if(T.status==='schlummer'&&T.hp>0&&Math.random()<.3){T.status=null;ev.push({k:'msg',s:tn+' schreckt aus dem Schlummer!'},{k:'upd'});}
   // Zusatzeffekte
   for(const f of fx){if(T.hp<=0&&(f.k==='st'||f.k==='conf'||f.k==='foe'))continue;
    if(f.k==='st'){let ch=+f.b||0;if(f.a==='raureif'&&abil(A)==='frosthauch')ch+=20;if(Math.random()*100<ch){const e2=applyStatus(B,T,f.a,A);if(ch>=100||T.status===f.a)ev.push(...e2);}}
    else if(f.k==='conf'){if(Math.random()*100<(+f.a||0)&&!(T.conf>0))ev.push(...applyStatus(B,T,'wirr',A));}
    else if(f.k==='foe'){if(Math.random()*100<(f.c!=null?+f.c:100))ev.push(...changeStage(B,T,f.a,+f.b,A));}
    else if(f.k==='self'){if(Math.random()*100<(f.c!=null?+f.c:100))ev.push(...changeStage(B,A,f.a,+f.b,A));}
    else if(f.k==='drain'&&A.hp>0){const h=healMonB(A,x.d/2);if(h)ev.push({k:'msg',s:tn+' wurde Energie entzogen.'},{k:'upd'});}}
   if(frostFx(A,M)&&T.hp>0&&!fx.some(f=>f.k==='st'&&f.a==='raureif')&&Math.random()<.2){const e2=applyStatus(B,T,'raureif',A);if(T.status==='raureif')ev.push(...e2);}
   // Berührung: Fähigkeiten des Ziels
   if(M[6]==='phys'&&A.hp>0){const dA=abil(T);
    const cs={glutkern:'sengen',funkenhaut:'starre',sporenpelz:'sporen'}[dA];if(cs&&!A.status&&Math.random()<.25){ev.push({k:'msg',s:dA==='glutkern'?'Glutkern!':dA==='funkenhaut'?'Funkenhaut!':'Sporenpelz!'});ev.push(...applyStatus(B,A,cs,T));}
    if(dA==='dornenkleid'){const d2=Math.max(1,Math.floor(maxHp(A)/8));A.hp=Math.max(0,A.hp-d2);ev.push({k:'hit',who:side,dmg:d2,col:'#4cb85c',mon:A,dot:1},{k:'msg',s:'Dornenkleid! '+an+' sticht sich.'});}}
   if(T.hp>0&&abil(T)==='abschreck'&&Math.random()<.25&&A.hp>0)ev.push({k:'msg',s:'Abschreckung!'},...changeStage(B,A,'atk',-1,T));
   if(A.hp>0&&has('recoil')&&x.d>0){const d2=Math.max(1,Math.floor(x.d/4));A.hp=Math.max(0,A.hp-d2);ev.push({k:'hit',who:side,dmg:d2,col:'#c9d3dc',mon:A,dot:1},{k:'msg',s:an+' erleidet Rückstoß.'});}
   if(A.hp>0&&has('recoil4')){const d2=Math.max(1,Math.ceil(maxHp(A)/4));A.hp=Math.max(0,A.hp-d2);ev.push({k:'hit',who:side,dmg:d2,col:'#c9d3dc',mon:A,dot:1},{k:'msg',s:an+' erleidet Rückstoß.'});}
   if(A.hp>0&&heldOf(A)==='kraftreif'){const d2=Math.max(1,Math.floor(maxHp(A)/10));A.hp=Math.max(0,A.hp-d2);ev.push({k:'hit',who:side,dmg:d2,col:'#c9d3dc',mon:A,dot:1},{k:'msg',s:'Der Kraftreif zehrt an '+an+'.'});}}
  ev.push({k:'upd'});return ev;}
 // Status-Attacken
 const T=targets[0]||D;const foeTarget=fx.some(f=>f.k==='st'||f.k==='conf'||f.k==='foe');
 if(foeTarget&&T&&Math.random()>=hitChance(B,A,T,M)){ev.push({k:'msg',s:'Daneben!'});return ev;}
 let any=false;for(const f of fx){
  if(f.k==='st'){any=true;ev.push(...applyStatus(B,T,f.a,A));}
  else if(f.k==='conf'){any=true;ev.push(...applyStatus(B,T,'wirr',A));}
  else if(f.k==='foe'){any=true;ev.push(...changeStage(B,T,f.a,+f.b,A));}
  else if(f.k==='self'){any=true;ev.push(...changeStage(B,A,f.a,+f.b,A));}
  else if(f.k==='wx'){any=true;const e2=setWeather(B,f.a,5);ev.push(...(e2.length?e2:[{k:'msg',s:'Das Wetter ist schon so.'}]));}
  else if(f.k==='fld'){any=true;const e2=setField(B,f.a,5);ev.push(...(e2.length?e2:[{k:'msg',s:'Das Feld liegt bereits.'}]));}
  else if(f.k==='heal'){any=true;if(A.hp>=maxHp(A))ev.push({k:'msg',s:'KP sind schon voll.'});else{healMonB(A,maxHp(A)/2);ev.push({k:'fx',who:side,col:'#7ee08a',buff:1},{k:'msg',s:an+' erholt sich.'},{k:'upd'});}}
  else if(f.k==='cure'){any=true;const al=alliesOf(B,side).filter(m=>m&&m.hp>0&&(m.status||m.conf>0));al.forEach(m=>{m.status=null;m.conf=0;});ev.push({k:'fx',who:side,col:'#ffffff',buff:1},{k:'msg',s:al.length?'Ein heller Ruf weckt alle Lebensgeister!':'Nichts passiert.'},{k:'upd'});}}
 if(!any)ev.push({k:'msg',s:'Nichts passiert.'});return ev;}
function frostFx(A,M){return abil(A)==='frosthauch'&&M[1]==='frost';}

// ---------- Auftritt (Fähigkeiten beim Eintritt) & Rundenende ----------
function onEnter(B,m){const a=abil(m),wx={sonnenruf:'sonne',regenruf:'regen',sandruf:'sand',schneeruf:'schnee'}[a],fl={bluehruf:'bluete',spannruf:'funken'}[a];
 if(wx&&B.weather!==wx)return[{k:'msg',s:ABIL[a][0]+' von '+mname(m)+'!'},...setWeather(B,wx,5)];
 if(fl&&!(B.field&&B.field.k===fl))return[{k:'msg',s:ABIL[a][0]+' von '+mname(m)+'!'},...setField(B,fl,5)];return[];}
function onLeave(B,m){if(!m)return;m.conf=0;if(B&&B.stm)B.stm.delete(m);if(abil(m)==='quellruhe'&&m.hp>0){m.status=null;m.hp=Math.min(maxHp(m),m.hp+Math.floor(maxHp(m)/4));}
 if(B&&B.resOn)for(const s in B.resOn)if(B.resOn[s]&&B.resOn[s].mon===m)B.resOn[s]=null;}
function endOfTurn(B){const ev=[],act=[...alliesOf(B,'me'),...alliesOf(B,'foe')].filter(m=>m&&m.hp>0),W=WEATHER[B.weather],F=B.field&&FIELDS[B.field.k];
 for(const m of act){if(m.hp<=0)continue;
  if(m.status&&STATUS[m.status]){ev.push(...STATUS[m.status].onTurn(m,B));
   if(m.hp>0&&m.status&&sideOf(m)==='me'&&DF().statusMax&&(m.statusAge=(m.statusAge|0)+1)>=DF().statusMax){m.status=null;ev.push({k:'msg',s:mname(m)+' hat sich vom Zustand erholt.'},{k:'upd'});}}
  if(m.hp>0&&W&&W.chip&&!mtypes(m).some(t=>W.safe.includes(t))&&!(abil(m)==='sandschleier'&&B.weather==='sand')&&!(abil(m)==='schneemantel'&&B.weather==='schnee')){const d=Math.max(1,Math.floor(maxHp(m)*W.chip));m.hp=Math.max(0,m.hp-d);ev.push({k:'hit',who:sideOf(m),dmg:d,col:W.c,mon:m,dot:1},{k:'msg',s:(B.weather==='sand'?'Der Sandsturm peitscht ':'Die Kälte beißt ')+mname(m)+'.'});}
  const max=maxHp(m);if(m.hp>0&&m.hp<max){let h=0,why='';
   if(F&&F.heal){h+=max*F.heal;why='Die Blüten nähren ';}
   if(abil(m)==='regen'){h+=max/16;why=why||'Regeneration: ';}
   if(abil(m)==='morgentau'&&(B.weather==='regen'||B.weather==='gewitter')){h+=max/8;why=why||'Morgentau erfrischt ';}
   if(heldOf(m)==='quellmoos'){h+=max/16;why=why||'Das Quellmoos heilt ';}
   if(h){const got=healMonB(m,h);if(got)ev.push({k:'msg',s:why+mname(m)+(why.endsWith(': ')?' heilt sich.':'.')},{k:'upd'});}}}
 if(B.weather&&B.wxT!==Infinity&&--B.wxT<=0){ev.push({k:'msg',s:WEATHER[B.weather].end});B.weather=B.wx0||null;B.wxT=Infinity;ev.push({k:'upd'});}
 if(B.field&&--B.field.turns<=0){ev.push({k:'msg',s:FIELDS[B.field.k].end});B.field=null;ev.push({k:'upd'});}
 if(B.resOn&&!B.rt)for(const s in B.resOn){const r=B.resOn[s];if(r&&--r.turns<=0){B.resOn[s]=null;ev.push({k:'msg',s:'Die Resonanz von '+mname(r.mon)+' verklingt.'},{k:'upd'});}}
 return ev;}

// ---------- Gegner-KI: 0 wild (fast zufällig) · 1 Trainer · 2 Arenaleiter/Rivale/Boss (Effektivität) · 3 Top Vier/Champion (Wechsel, Items) ----------
function aiTier(B){const t=B&&B.tr;if(!t)return 0;if(t.ai!=null)return t.ai;const t0=aiTier0(t);return t0===1&&DF().aiRoute0?0:t0;}
function aiTier0(t){if(t.flag==='champion'||/^top/.test(t.flag||'')||t.elite)return 3;
 if(t.leader||/^boss|^tr_lio|^grunt/.test(t.flag||'')||/Rivale|Ordensmeister/.test(t.name||''))return 2;return 1;}
function expDmg(B,A,T,M){if(!M[2])return 0;const r=calcDamage(A,T,M,{B,crit:false,rnd:.925,night:bNight()});return r.dmg*Math.min(1,M[3]/100);}
function scoreMove(B,A,T,i,tier){const mv=A.moves[i],M=MOVES[mv.id],fx=parseFx(M[5]),rnd=tier>=2?.9+Math.random()*.2:.7+Math.random()*.6;
 if(M[2]){const d=expDmg(B,A,T,M);let s=d/Math.max(1,T.hp)*100;if(d>=T.hp)s+=tier>=2?60:25;if(tier>=2&&eff(M[1],mtypes(T))===0)s=0;if(M[7]>0&&d>=T.hp)s+=20;return Math.min(200,s)*rnd;}
 let s=8;for(const f of fx){
  if(f.k==='st')s=T.status||STATUS[f.a].immune&&mtypes(T).some(t=>STATUS[f.a].immune.includes(t))?0:(tier>=2?(T.hp>maxHp(T)*.7?38:12):18);
  else if(f.k==='conf')s=T.conf>0?0:tier>=2?24:16;
  else if(f.k==='self')s=stOf(B,A)[f.a]>=2||A.hp<maxHp(A)*.6?4:(tier>=2?30:18);
  else if(f.k==='foe')s=stOf(B,T)[f.a]<=-2?4:22;
  else if(f.k==='wx'){const own=mtypes(A),good=(f.a==='sonne'&&own.includes('glut'))||(f.a==='regen'&&own.includes('flut'))||(f.a==='sand'&&own.includes('fels'))||(f.a==='schnee'&&own.includes('frost'));s=B.weather===f.a?0:good?(tier>=2?45:25):6;}
  else if(f.k==='fld')s=B.field&&B.field.k===f.a?0:mtypes(A).includes(f.a==='bluete'?'flora':'volt')?(tier>=2?40:22):6;
  else if(f.k==='heal')s=A.hp<maxHp(A)*.45?(tier>=2?70:40):0;
  else if(f.k==='cure')s=alliesOf(B,sideOf(A)).some(m=>m&&m.status)?50:0;}
 return s*rnd;}
// Liefert {k:'move',i,target} | {k:'switch',i} | {k:'item',item}; target = Index in foesOf(B,side)
function aiChoose(B,A,side,o){o=o||{};const tier=o.tier!=null?o.tier:side==='foe'?aiTier(B):2,opp=foesOf(B,side),live=opp.map((m,j)=>[m,j]).filter(([m])=>m&&m.hp>0);
 const ok=A.moves.map((mv,i)=>i).filter(i=>A.moves[i].pp>0&&(!B.rt||!o.cd||o.cd[i]==null||o.cd[i]>=1));if(!ok.length||!live.length)return{k:'move',i:A.moves.some(m=>m.pp>0)?ok[0]??0:-1,target:live.length?live[0][1]:0};
 if(tier>=2&&o.items!==false&&(B.aiItems|0)>0&&A.hp>0&&A.hp<maxHp(A)*.25&&Math.random()<.8){B.aiItems--;return{k:'item',item:tier>=3?'hypertr':'supertr'};}
 if(tier===0&&Math.random()<.65){const i=ok[Math.random()*ok.length|0];return{k:'move',i,target:live[Math.random()*live.length|0][1]};}
 let best=null;for(const i of(o.dmgOnly&&ok.some(i=>MOVES[A.moves[i].id][2])?ok.filter(i=>MOVES[A.moves[i].id][2]):ok))for(const[T,j]of live){const s=scoreMove(B,A,T,i,tier);if(!best||s>best.s)best={i,target:j,s};}
 if(tier>=3&&side==='foe'&&o.canSwitch!==false&&best.s<25&&(B.aiSw|0)<2&&A.hp>maxHp(A)*.3){const act=new Set(B.foes||[B.foe[B.fi]]);let alt=null;
  B.foe.forEach((m,k)=>{if(m.hp<=0||act.has(m))return;let s=0;for(let i=0;i<m.moves.length;i++)for(const[T]of live)s=Math.max(s,scoreMove(B,m,T,i,tier));if(s>60&&(!alt||s>alt.s))alt={k,s};});
  if(alt){B.aiSw=(B.aiSw|0)+1;return{k:'switch',i:alt.k};}}
 if(tier>=2&&side==='foe'&&B.res&&B.res.foe>=1&&!resActive(B,'foe'))useResonance('foe');
 return{k:'move',i:best.i,target:best.target};}

// ---------- Belohnungen: EP-Formel, Trainings-Werte (Yield aus Basiswerten) ----------
const SIX=['hp','atk','def','spa','spd','spe'];
function xpGain(foe,trainer,share){return Math.max(1,Math.floor(MONS[foe.s].x*foe.l/7*(trainer?1.5:1)*DF().xp/Math.max(1,share||1)));}
function evYield(s){const b=base6(MONS[s]),sum=b.reduce((a,c)=>a+c,0),k=b.indexOf(Math.max(...b));return{key:SIX[k],n:sum<330?1:sum<470?2:3};}
function addEv(m,key,n){m.ev=m.ev||{hp:0,atk:0,def:0,spa:0,spd:0,spe:0};const tot=SIX.reduce((a,k)=>a+(m.ev[k]|0),0),room=Math.max(0,Math.min(252-(m.ev[key]|0),510-tot,n));
 if(!room)return 0;const oldMax=stat(m,'hp');m.ev[key]=(m.ev[key]|0)+room;if(key==='hp'&&m.hp>0)m.hp+=stat(m,'hp')-oldMax;return room;}
