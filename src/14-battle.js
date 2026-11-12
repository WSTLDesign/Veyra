// ===== VEYRA – Kampfablauf (Rundenkampf) auf Basis des Kampfkerns (18-battlecore.js) =====
// UI-Darstellung (Menüs, Karten, Chips) in 20-battleui.js; hier: Start, Ablauf, Ereignisse abspielen, Fangen, Belohnung.
let B=null;
// Kampfart für Musik-Hook playTheme('battle_'+art)
function battleArt(o){if(o.legend)return'legend';const t=o.trainer;if(!t)return o.ambush?'ambush':'wild';if(t.flag==='champion')return'champion';
 if(/^top/.test(t.flag||''))return'elite';if(t.leader)return'leader';if(/Rivale/.test(t.name||''))return'rival';return'trainer';}
// Kampfstart: Icon 0,3 s → Freeze → Wipe → Arena; als SEQ.battleStart registriert (21-species.js, da 19-seq.js später lädt)
async function seqBattleStart(a){a=a||{};const o=a.o||{},short=!!a.short,sc=$('#screen'),al=$('#alertMark'),W=ms=>new Promise(r=>setTimeout(r,ms));
 sfx('enc');vib(15);try{if(typeof playTheme==='function')playTheme('battle_'+battleArt(o));}catch(e){}
 if(!short){al.classList.add('on');await W(240);sc.classList.add('freeze');await W(200);}
 vib([25,40,25]);const w=$('#wipe');w.classList.toggle('short',short);w.classList.remove('go');void w.offsetWidth;w.classList.add('go');
 await W(RED?0:short?220:360);sc.classList.remove('freeze');al.classList.remove('on');return{ok:true};}
function startBattle(o){if(o.wild&&!o.legend){const nl=wildLv(o.wild.l);if(nl<o.wild.l){const w=mk(o.wild.s,nl);w.shiny=o.wild.shiny;if(o.wild.gender!==undefined)w.gender=o.wild.gender;o.wild=w;}}
 held=null;mode='battle';G.nb=(G.nb||0)+1;const short=G.nb>2||RED||SET.banim===0;
 const p=(typeof SEQ!=='undefined'&&SEQ.battleStart)?playSeq('battleStart',{o,short}):seqBattleStart({o,short});p.then(()=>startBattleNow(o));}
function worldWeather(){try{const s=typeof weatherNow==='function'?weatherNow():(G.weather&&cur&&G.weather[cur.id]);return WORLD_WX[s]||null;}catch(e){return null;}}
function defineSt(b){b.st={};for(const side of['me','foe'])Object.defineProperty(b.st,side,{enumerable:true,
 get(){const m=side==='me'?G.team[b.mi]:b.foe[b.fi];return m?stOf(b,m):newStages();},set(v){const m=side==='me'?G.team[b.mi]:b.foe[b.fi];if(m)b.stm.set(m,Object.assign(newStages(),v||{}));}});}
function startBattleNow(o){$('#battle').classList.toggle('rtm',rtOn());try{if(typeof camBattleStart==='function')camBattleStart(o);}catch(e){}/* Look L2: Kamera-Regie über CAM */const tr=o.trainer||null,foe=o.wild?[o.wild]:(o.foes||tr.team.map(([s,l])=>mk(s,trainerLv(l,tr))));
 const alive=G.team.map((m,i)=>i).filter(i=>G.team[i].hp>0),dbl=!!((o.double||(tr&&tr.double))&&foe.length>1&&alive.length>1);
 B={tr,legend:o.legend||null,foe,fi:0,mi:alive[0],part:new Set(),fx:null,evo:[],t0:performance.now(),ko:{},lunge:null,pops:[],g:{me:.7,foe:.1},rt:false,busy:false,
  double:dbl,foes:dbl?[foe[0],foe[1]]:[foe[0]],mine:dbl?alive.slice(0,2):[alive[0]],stm:new Map(),dead:new Set(),res:{me:0,foe:0},resOn:{},
  cd:[1,1,1,1],cdRaw:[1,1,1,1],cdFoe:[1,1,1,1],weather:null,wxT:Infinity,wx0:null,field:null,ai:0,aiItems:0,aiSw:0,queue:[],rtT:0,turnN:0,ambush:!!o.ambush,foeTurn:0};
 defineSt(B);B.ai=aiTier(B);B.aiItems=B.ai>=3?2:B.ai>=2?1:0;
 const ww=worldWeather();if(ww){B.weather=B.wx0=ww;}
 B.mine.forEach(i=>B.part.add(i));B.foes.forEach(m=>seen(m.s));$('#battle').hidden=false;hideB();updB();
 (async()=>{const q=SET.skipBattleIntro?-420:(!o.trainer&&!o.legend?-650:0),F=B.foes;
  if(B.tr)await msg(B.tr.name+' fordert dich heraus und schickt '+F.map(mname).join(' und ')+'!',q||1000);
  else await msg(o.ambush?'Im hohen Gras raschelt es – ein verstecktes '+mname(F[0])+' springt hervor!':(B.legend?'Das legendäre '+mname(F[0])+' erscheint!':'Wildes '+mname(F[0])+' erscheint!'),q);
  if(!B)return;if(!q&&!B.tr)await msg('Los, '+B.mine.map(i=>mname(G.team[i])).join(' und ')+'!',q);
  if(!B)return;if(B.weather&&WEATHER[B.weather])await msg(WEATHER[B.weather].n+' liegt über dem Kampffeld.',q||700);
  for(const m of[...F,...B.mine.map(i=>G.team[i])])await playEv(onEnter(B,m));
  if(!B)return;B.rt=rtOn();showMain();})();}
function msg(t,fast){return new Promise(res=>{const tw=typeInto($('#bLog'),t,true,340);let done=0,to;const el=$('#battle');
 const arm=ms=>{clearTimeout(to);to=setTimeout(()=>f(),ms);};
 const f=e=>{if(done)return;if(e&&!tw.done()){tw.finish();arm(900);return;}done=1;clearTimeout(to);if(!tw.done())tw.finish();el.removeEventListener('pointerdown',f);document.removeEventListener('keydown',f);res();};
 arm(fast<0?-fast:Math.max(1000,fast||t.length*6+1100));setTimeout(()=>{if(!done){el.addEventListener('pointerdown',f);document.addEventListener('keydown',f);}},120);});}
// Zahl weich hoch-/runterzählen
function countTo(el,to,max){const from=el._v??to;el._v=to;cancelAnimationFrame(el._raf);const fmt=v=>v+' / '+max;
 if(RED||from===to){el.textContent=fmt(to);return;}const t0=performance.now(),d=Math.min(700,240+Math.abs(to-from)*12);
 const f=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=fmt(Math.round(from+(to-from)*e));if(k<1)el._raf=requestAnimationFrame(f);};el._raf=requestAnimationFrame(f);}
const TICON={kern:'M8 3a5 5 0 1 0 .01 0z',glut:'M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-4 0-7z',flut:'M8 1c2 3 5 6 5 9a5 5 0 0 1-10 0c0-3 3-6 5-9z',flora:'M2 14C2 7 7 2 14 2c0 7-5 12-12 12z',volt:'M9 1L3 9h4l-1 6 6-8H8l1-6z',fels:'M2 13l4-8 3 3 2-4 3 9z',frost:'M7 1h2v14H7zM1 7h14v2H1zM2.6 3.9l1.4-1.4 9.4 9.4-1.4 1.4zM12 2.5l1.4 1.4-9.4 9.4-1.4-1.4z',boe:'M2 6h8a2 2 0 1 0-2-2H6a4 4 0 1 1 4 4H2zm0 3h10a2.5 2.5 0 1 1-2.5 2.5h2A.5.5 0 1 0 12 11H2z',schatten:'M10 2a6 6 0 1 0 4 10A5 5 0 0 1 10 2z',lumen:'M8 1l1.8 4.6 4.8.4-3.7 3.1L12 14 8 11.3 4 14l1.1-4.9L1.4 6l4.8-.4z'};
function ticon(t){return`<svg class="ti" viewBox="0 0 16 16" aria-hidden="true"><path d="${TICON[t]}"/></svg>`;}
function chips(t){return t.map(x=>`<span class="chip" style="--tc:${TYPES[x].c}">${ticon(x)}${TYPES[x].n}</span>`).join('');}
function tbadge(t){return`<i class="tb" style="--tc:${TYPES[t[0]].c}">${ticon(t[0])}</i>`;}
function useItem(k,m){const it=ITEMS[k];if(!it||!m)return'';const max=stat(m,'hp'),nm=mname(m);
 if(it.k==='heal'){if(m.hp<=0)return nm+' ist kampfunfähig.';G.bag[k]--;const b=m.hp;m.hp=Math.min(max,m.hp+healAmt(m,it.v));return nm+' wurde um '+(m.hp-b)+' KP geheilt.';}
 if(it.k==='revive'){if(m.hp>0)return nm+' ist noch bei Kräften.';G.bag[k]--;m.hp=Math.floor(max/2);if(B&&B.dead)B.dead.delete(m);return nm+' ist wieder bei Kräften!';}
 if(it.k==='pp'){G.bag[k]--;m.moves.forEach(x=>x.pp=MOVES[x.id][4]);return 'Die AP von '+nm+' wurden aufgefüllt.';}
 if(it.k==='cure'){if(!m.status&&!(m.conf>0))return nm+' fehlt nichts.';G.bag[k]--;m.status=null;m.conf=0;if(B)updB();return nm+' ist wieder ganz munter.';}
 if(it.k==='friend'){G.bag[k]--;const f=addFriend(m,it.v);return nm+' genießt '+it.n+'. Freundschaft '+f+'/255.';}
 if(it.k==='abil'){const L=MONS[m.s].abilities||[MONS[m.s].ab];if(L.length<2||m.hiddenAbility)return 'Das Wandelharz zeigt keine Wirkung.';G.bag[k]--;m.ability=L[(L.indexOf(m.ability)+1)%L.length];return nm+' hat jetzt die Fähigkeit '+ABIL[m.ability][0]+'.';}
 if(it.k==='hidden'){const h=MONS[m.s].hiddenAbility;if(!h||m.ability===h)return 'Der Splitter bleibt still.';G.bag[k]--;m.ability=h;m.hiddenAbility=true;return 'Verborgene Kraft erwacht: '+nm+' hat jetzt '+ABIL[h][0]+'!';}
 if(it.k==='held'){G.bag[k]--;const old=m.heldItem;if(old)addItem(old,1);m.heldItem=k;return nm+' trägt jetzt '+it.n+(old?' (zurück: '+ITEMS[old].n+')':'')+'.';}
 return 'Das kann hier nicht benutzt werden.';}
// Kompatibel: Initiative und alte KI-Schnittstelle
function spd(m){return speedOf(B,m);}
function aiMove(foe,me){const c=aiChoose(B,foe,sideOf(foe)==='me'?'me':'foe',{items:false,canSwitch:false});return c.k==='move'?c.i:-1;}

// ---------- Ereignisse aus dem Kern abspielen ----------
function focus(m){if(!B||!m)return;const i=G.team.indexOf(m);if(i>=0){if(B.mi!==i){B.mi=i;}}else{const j=B.foe.indexOf(m);if(j>=0)B.fi=j;}}
function restoreFocus(){if(!B)return;const a=B.mine.find(i=>G.team[i]&&G.team[i].hp>0);if(a!=null)B.mi=a;const f=B.foes.find(m=>m&&m.hp>0);if(f)B.fi=B.foe.indexOf(f);}
const WAIT=ms=>new Promise(r=>setTimeout(r,ms));
async function playEv(ev){const anim=SET.banim!==0;for(const e of ev||[]){if(!B)return;switch(e.k){
 case'msg':await msg(e.s);break;case'upd':updB();break;
 case'lunge':if(anim){B.lunge={who:e.who,t:performance.now()};await WAIT(420);}break;
 case'fx':if(anim)B.fx={who:e.who,t:performance.now(),col:e.col,buff:e.buff};break;
 case'hit':{if(B.double)focus(e.mon);const now=performance.now();if(anim)B.fx={who:e.who,t:now,col:e.col};
  B.pops.push({who:e.who,txt:'−'+e.dmg,t:now,col:e.eff>1?'#ffd166':e.eff<1&&e.eff!=null?'#c9d3dc':'#ffffff',big:e.crit||e.eff>1});
  if(!e.dot){if(anim)HS=now+(e.crit?110:55);if(e.crit&&anim){const sq=$('#battle .scene');if(sq){sq.classList.remove('shake');void sq.offsetWidth;sq.classList.add('shake');}}sfx(e.crit?'crit':'hit');vib(e.crit||e.eff>1?[40,30,40]:22);}
  updB();if(!e.dot&&anim)await WAIT(380);break;}}}}
// Eine Attacke: Ziel/Angreifer über B.act {A,D} (Doppelkampf), sonst aktive Kreaturen
async function doMove(side,mi){if(!B)return;const a=B.act||{};B.act=null;const A=a.A||(side==='me'?G.team[B.mi]:B.foe[B.fi]),D=a.D||(side==='me'?B.foe[B.fi]:G.team[B.mi]);
 if(!A||A.hp<=0)return;if(B.rt&&mi>=0){if(side==='me'&&G.team[B.mi]===A){B.cdRaw[mi]=0;B.cd[mi]=0;}else if(side==='foe')B.cdFoe[mi]=0;}
 await playEv(execMove(B,side,A,mi,D));}
// Rundenmodus: Doppelkampf sammelt erst Befehle für alle eigenen aktiven Kreaturen
async function turn(act){if(!B)return;if(B.rt)return rtAction(act);
 if(act.k==='move'&&act.target==null&&B.double&&typeof uiPickTarget==='function'&&B.foes.filter(m=>m&&m.hp>0).length>1&&act.i>=0&&MOVES[G.team[B.mi].moves[act.i].id][2]&&!/area/.test(MOVES[G.team[B.mi].moves[act.i].id][5]||'')){try{act.target=await uiPickTarget(B.foes);}catch(e){}}
 act.mon=G.team[B.mi];if(B.double&&act.k!=='run'&&act.k!=='ball'){B.queue.push(act);
  const next=B.mine.find(i=>G.team[i]&&G.team[i].hp>0&&!B.queue.some(q=>q.mon===G.team[i]));if(next!=null){B.mi=next;return showMain();}}
 const acts=B.double?B.queue.splice(0):[act];if(B.double&&!acts.includes(act))acts.push(act);B.mi=B.mine.find(i=>G.team[i].hp>0)??B.mi;return runRound(acts);}
async function switchIn(side,slot,idx){if(side==='me'){const old=G.team[B.mine[slot]];if(old&&old.hp>0)await msg(mname(old)+', komm zurück!');onLeave(B,old);B.mine[slot]=idx;B.mi=idx;B.part.add(idx);B.dead.delete(G.team[idx]);B.cd=[1,1,1,1];B.cdRaw=[1,1,1,1];updB();await msg('Los, '+mname(G.team[idx])+'!');await playEv(onEnter(B,G.team[idx]));}
 else{const old=B.foes[slot];onLeave(B,old);B.foes[slot]=B.foe[idx];B.fi=idx;seen(B.foe[idx].s);updB();await msg(B.tr.name+' ruft '+mname(old)+' zurück und schickt '+mname(B.foe[idx])+'!');await playEv(onEnter(B,B.foe[idx]));}}
async function foeItem(F,item){const max=stat(F,'hp');F.hp=Math.min(max,F.hp+(item==='hypertr'?max:60));updB();await msg(B.tr.name+' setzt '+ITEMS[item].n+' bei '+mname(F)+' ein!');}
async function runRound(myActs){hideB();B.turnN++;const moves=[];
 for(const a of myActs){const A=a.mon;if(!B)return;if(!A||(A.hp<=0&&a.k!=='item'))continue;
  if(a.k==='run'){if(B.tr){await msg('Aus einer Herausforderung kannst du nicht weglaufen!');return showMain();}
   if(Math.random()<Math.min(.95,speedOf(B,A)/speedOf(B,B.foe[B.fi])*.5+.35)){await msg('Du bist sicher entkommen!');return endBattle('run');}await msg('Flucht misslungen!');}
  else if(a.k==='switch')await switchIn('me',Math.max(0,B.mine.indexOf(G.team.indexOf(A))),a.i);
  else if(a.k==='item'){await msg(useItem(a.item,G.team[a.i]));updB();}
  else if(a.k==='ball'){if(await tryCatch(a.item))return;}
  else if(a.k==='move')moves.push({side:'me',k:'move',mon:A,i:a.i,target:a.target});}
 for(const F of[...B.foes]){if(!B)return;if(!F||F.hp<=0)continue;const c=aiChoose(B,F,'foe');
  if(c.k==='switch'){await switchIn('foe',B.foes.indexOf(F),c.i);continue;}if(c.k==='item'){await foeItem(F,c.item);continue;}
  moves.push({side:'foe',k:'move',mon:F,i:c.i,target:c.target});}
 orderActions(B,moves);
 let mvN=0;for(const a of moves){if(!B)return;if(a.mon.hp<=0)continue;if(mvN++>0&&!RED)await WAIT(350);const act=a.side==='me'?B.mine.map(i=>G.team[i]):B.foes;if(!act.includes(a.mon))continue;
  const opp=foesOf(B,a.side);let D=opp[a.target!=null?a.target:0];if(!D||D.hp<=0)D=opp.find(m=>m&&m.hp>0);if(!D)break;
  B.act={A:a.mon,D};if(B.double){focus(a.mon);focus(D);}await doMove(a.side,a.i);if(await checkFaint())return;}
 if(!B)return;await playEv(endOfTurn(B));if(await checkFaint())return;restoreFocus();showMain();}
// KO prüfen: Belohnung, Ersatz, Sieg/Niederlage. true = Ablauf unterbrochen
async function checkFaint(){if(!B)return true;
 for(const F of B.foes){if(!F||F.hp>0||B.dead.has(F))continue;B.dead.add(F);focus(F);B.ko.foe=performance.now();await msg((B.tr?'Gegnerisches ':'')+mname(F)+' wurde besiegt!');await rewardKo(F);if(!B)return true;}
 for(let k=0;k<B.foes.length;k++){const F=B.foes[k];if(F&&F.hp>0)continue;const nx=B.foe.findIndex(m=>m.hp>0&&!B.foes.includes(m));if(nx<0)continue;
  onLeave(B,F);B.foes[k]=B.foe[nx];B.fi=nx;B.part=new Set(B.mine.filter(i=>G.team[i].hp>0));seen(B.foe[nx].s);updB();
  await msg(B.tr.name+' schickt '+mname(B.foe[nx])+' in den Kampf!');await playEv(onEnter(B,B.foe[nx]));}
 if(!B.foe.some(m=>m.hp>0)){await winBattle();return true;}
 for(const i of B.mine){const m=G.team[i];if(!m||m.hp>0||B.dead.has(m))continue;B.dead.add(m);focus(m);B.ko.me=performance.now();await msg(mname(m)+' wurde besiegt!');if(typeof addFriend==='function')addFriend(m,-1);}
 if(!G.team.some(m=>m.hp>0)){await msg('Du hast keine kampffähigen Kreaturen mehr …');endBattle('lose');return true;}
 const slot=B.mine.findIndex(i=>G.team[i].hp<=0),bench=G.team.some((m,i)=>m.hp>0&&!B.mine.includes(i));
 if(slot>=0&&bench){B.needSlot=slot;B.mi=B.mine[slot];B.busy=true;showTeamB(true);return true;}
 if(slot>=0)restoreFocus();return false;}
async function rewardKo(F){const alive=[...B.part].filter(i=>G.team[i]&&G.team[i].hp>0),gain=xpGain(F,!!B.tr,alive.length),y=evYield(F.s);
 for(const i of alive){const m=G.team[i];addEv(m,y.key,y.n);await giveXp(m,gain);if(!B)return;}}
async function doSwitch(i){if(!B)return;const slot=B.needSlot!=null?B.needSlot:Math.max(0,B.mine.indexOf(B.mi));
 if(B.mine.includes(i)&&B.mine[slot]!==i){toast('Ist schon im Kampf');return showTeamB(true);}
 B.needSlot=null;B.busy=false;onLeave(B,G.team[B.mine[slot]]);B.mine[slot]=i;B.mi=i;B.dead.delete(G.team[i]);B.part.add(i);B.cd=[1,1,1,1];B.cdRaw=[1,1,1,1];updB();
 await msg('Los, '+mname(G.team[i])+'!');await playEv(onEnter(B,G.team[i]));
 const s2=B.mine.findIndex(j=>G.team[j].hp<=0);if(s2>=0&&G.team.some((m,j)=>m.hp>0&&!B.mine.includes(j))){B.needSlot=s2;B.mi=B.mine[s2];return showTeamB(true);}
 restoreFocus();showMain();}
// Überschreibbar (Agent F: 24/25): giveXp, tryCatch, evolve – gleiche Signatur
async function giveXp(m,x){if(B){B.xl=B.xl||new Map();if(!B.xl.has(m))B.xl.set(m,{l0:m.l,xp0:m.xp,g:0});B.xl.get(m).g+=x;}m.xp+=x;await msg(mname(m)+' erhält '+x+' Erfahrungspunkte.');updB();
 while(m.l<100&&m.xp>=(m.l+1)**3){const old=stat(m,'hp');m.l++;m.hp+=stat(m,'hp')-old;updB();sfx('lvl');await playSeq('levelUp',{mon:m,level:m.l,from:m.l-1});await msg(mname(m)+' erreicht Level '+m.l+'!');
  for(const[lv,mv]of MONS[m.s].ls)if(lv===m.l&&!m.known.includes(mv)){m.known.push(mv);
   if(m.moves.length<4){m.moves.push({id:mv,pp:MOVES[mv][4]});await msg(mname(m)+' hat '+MOVES[mv][0]+' gelernt!');}
   else await msg(mname(m)+' kann jetzt '+MOVES[mv][0]+'! Ordne die Attacke im Team-Menü zu.');}
  const ev=MONS[m.s].ev;if(ev&&ev.l&&m.l>=ev.l&&B&&!B.evo.includes(m))B.evo.push(m);}}
// Fallback-Fangquote, falls calcCatch (24-capture.js) fehlt
function catchFallback(foe,k){const it=ITEMS[k];let r=it.r;if(r==='night')r=isNight()?3.5:1;if(r==='net')r=MONS[foe.s].t.some(t=>t==='flut'||t==='boe')?3:1;if(typeof r!=='number')r=1;
 if(r>=999)return{p:1,shakes:3,crit:false};const max=stat(foe,'hp'),sb=foe.status==='schlummer'||foe.status==='raureif'?2:foe.status?1.5:1;
 return{p:Math.min(1,(3*max-2*foe.hp)*MONS[foe.s].cr*r*sb/(3*max)/255),shakes:null,crit:false};}
async function tryCatch(k){const it=ITEMS[k],foe=B.foe[B.fi];G.bag[k]--;await msg('Du wirfst eine '+it.n+'!');
 const r=typeof calcCatch==='function'?calcCatch(foe,k,{B,night:isNight(),turn:B.turnN,status:foe.status,map:cur&&cur.id}):catchFallback(foe,k);
 const ok=r.ok!=null?!!r.ok:r.p>=1||Math.random()<r.p,sh=ok?3:r.shakes!=null?Math.min(2,r.shakes):Math.floor(Math.random()*3);
 B.fx={who:'ball',t:performance.now()};
 if(typeof SEQ!=='undefined'&&SEQ.catch)await playSeq('catch',{mon:foe,capsule:k,item:k,ok,shakes:sh,crit:!!r.crit,p:r.p});
 else for(let i=0;i<sh;i++)await msg('Die Kapsel wackelt'+' …'.repeat(i+1));
 if(!ok){B.fx=null;await msg(['Oh nein! Es hat sich befreit!','Mist! Fast hätte es geklappt!','Argh! So knapp!'][sh]||'Es hat sich befreit!');return false;}
 B.caught=1;B.fx={who:'foe',t:performance.now(),col:'#ffd166'};sfx('catch');vib([20,40,90]);await msg('Geschafft! '+mname(foe)+' wurde gefangen!');const nw=!G.dex.caught[foe.s];
 foe.status=null;foe.conf=0;if(typeof registerCatch==='function')registerCatch(foe,k);await catchCard(foe,nw);caught(foe.s);G.flags.firstcatch=1;
 if(B.legend)G.flags[B.legend.flag]=1;if(nw)await msg('Neuer Eintrag im Kreaturendex!');
 if(G.team.length<6)G.team.push(foe);else{const at=typeof boxAdd==='function'?boxAdd(foe):(G.box.push(foe),1);await msg(mname(foe)+(at?' wurde in die Kreaturenbox geschickt.':' findet keinen Platz – die Box ist voll!'));}
 endBattle('catch');return true;}
async function winBattle(){if(!B||B.won)return;B.won=1;/* B3: nur einmal je Kampf – ein zweiter, gleichzeitiger Rundenlauf (checkFaint) würde sonst Belohnung doppelt vergeben und später den NÄCHSTEN Kampf per endBattle('win') ohne Sieg-Flag beenden */if(B.tr){const t=B.tr;G.flags[t.flag]=1;if(G.defeatedTrainers&&!G.defeatedTrainers.includes(t.flag))G.defeatedTrainers.push(t.flag);
  await msg(t.name+': '+t.post);G.money+=t.money;await msg('Du erhältst '+t.money+' ¤.');
  if(t.leader){G.badges.push(t.leader);await msg('Du erhältst den '+t.leader+'!');}
  if(t.gift){addItem(t.gift[0],t.gift[1]);await msg('Du erhältst '+t.gift[1]+'× '+ITEMS[t.gift[0]].n+'.');}}
 if(typeof addFriend==='function')for(const i of B.part)if(G.team[i]&&G.team[i].hp>0)addFriend(G.team[i],B.tr?2:1);
 await resultCard();endBattle('win');}
function endBattle(res){try{if(typeof camBattleEnd==='function')camBattleEnd();}catch(e){}$('#battle').hidden=true;$('#bCard').hidden=true;const sc=$('#screen');sc.classList.remove('retn');void sc.offsetWidth;sc.classList.add('retn');mode='world';updHud();const evo=B?B.evo:[];const tr=B&&B.tr;
 G.team.forEach(m=>{m.conf=0;});if(B&&B.foe)B.foe.forEach(m=>{m.conf=0;});B=null;
 if(res==='lose'){G.money=Math.floor(G.money*(1-DF().loseLoss));healAll();const r=G.respawn||{map:'morgenau',x:4,y:5};G.ret={...r};loadMap(r.map,r.x,r.y);
  return say(['Du eilst zurück und deine Kreaturen werden geheilt.','Dabei hast du die Hälfte deines Geldes verloren.']);}
 const go=()=>{const m=evo.shift();if(!m){if(tr&&tr.flag==='champion')say(['Herzlichen Glückwunsch!','Du bist jetzt '+crownTitle()+' von Veyra!','Gerüchten zufolge kreist über der Siegesstraße nun ein legendäres Gewitterwesen …']);save();return;}
  evolve(m,go);};go();}
function evolve(m,cb){const ev=MONS[m.s].ev;if(!ev)return cb&&cb();const from=mname(m),r=m.hp/stat(m,'hp');m.s=ev.to;m.hp=Math.round(stat(m,'hp')*r);caught(m.s);
 for(const[lv,mv]of MONS[m.s].ls)if(lv<=m.l&&!m.known.includes(mv))m.known.push(mv);
 say(['Was? '+from+' entwickelt sich!','Glückwunsch! '+from+' hat sich zu '+mname(m)+' entwickelt!'],cb);}
// Resonanz-Darstellung (Kern ruft resonanceFx nach useResonance)
function resonanceFx(side,m,type){if(!B)return;B.fx={who:side,t:performance.now(),col:TYPES[type].c,buff:1};sfx('lvl');vib([20,30,60]);
 const t=(side==='me'?'':'Gegnerisches ')+mname(m)+' gerät in Resonanz: '+TYPES[type].n+'-Form!';try{$('#bLog').textContent=t;}catch(e){}if(side==='me'&&typeof toast==='function')toast('Resonanz! '+TYPES[type].n+'-Form');updB();}

// ---------- (Echtzeit entfernt) Aktionsleiste + Abklingzeit – totes Erbe, nie aktiv ----------
// Echtzeitmodus entfernt: Rundenkampf ist die einzige Variante (rtTick/Blüte-UI bleiben als totes Erbe, werden nie aktiv)
function rtOn(){return false;}
async function rtAction(act){if(B.busy||B.g.me<1){toast(B.busy?'Moment …':'Noch nicht bereit');return showRT();}
 if(act.k==='move'&&act.i>=0&&(B.cdRaw[act.i]??1)<1){toast('Attacke lädt noch …');return showRT();}
 B.busy=true;B.g.me=0;B.readyShown=0;hideB();const me=G.team[B.mi];
 if(act.k==='run'){if(B.tr)await msg('Aus einer Herausforderung kannst du nicht weglaufen!');else if(Math.random()<Math.min(.95,speedOf(B,me)/speedOf(B,B.foe[B.fi])*.5+.35)){await msg('Du bist sicher entkommen!');return endBattle('run');}else await msg('Flucht misslungen!');}
 else if(act.k==='switch')await switchIn('me',Math.max(0,B.mine.indexOf(B.mi)),act.i);
 else if(act.k==='item'){await msg(useItem(act.item,G.team[act.i]));updB();}
 else if(act.k==='ball'){if(await tryCatch(act.item))return;}
 else if(act.k==='move'){const opp=B.foes;let D=opp[act.target!=null?act.target:0];if(!D||D.hp<=0)D=opp.find(m=>m&&m.hp>0);B.act={A:me,D};await doMove('me',act.i);
  if(B&&B.double&&!await checkFaint()){const p=B.mine.map(i=>G.team[i]).find(m=>m!==me&&m.hp>0);if(p){const c=aiChoose(B,p,'me',{tier:2,items:false,canSwitch:false});if(c.k==='move'){const D2=B.foes[c.target]&&B.foes[c.target].hp>0?B.foes[c.target]:B.foes.find(m=>m&&m.hp>0);if(D2){B.act={A:p,D:D2};focus(p);await doMove('me',c.i);restoreFocus();}}}}}
 if(!B||await checkFaint())return;B.busy=false;restoreFocus();showRT();}
async function rtFoe(){B.busy=true;B.g.foe=0;hideB();const live=B.foes.filter(m=>m&&m.hp>0);const F=live[(B.foeTurn++)%Math.max(1,live.length)];
 if(F){const c=aiChoose(B,F,'foe',{cd:B.cdFoe});if(c.k==='switch')await switchIn('foe',B.foes.indexOf(F),c.i);else if(c.k==='item')await foeItem(F,c.item);
  else{const opp=foesOf(B,'foe');let D=opp[c.target]||opp.find(m=>m&&m.hp>0);if(!D||D.hp<=0)D=opp.find(m=>m&&m.hp>0);B.act={A:F,D};if(B.double){focus(F);focus(D);}await doMove('foe',c.i);}}
 if(!B||await checkFaint())return;B.busy=false;restoreFocus();showRT();}
async function rtRound(){B.busy=true;const ev=endOfTurn(B);if(ev.length){hideB();await playEv(ev);}if(!B||await checkFaint())return;B.busy=false;if(ev.length)showRT();}
function rtTick(dt){if(!B||!B.rt||B.busy||mode!=='battle')return;const me=G.team[B.mi],foe=B.foe[B.fi];if(!me||!foe||me.hp<=0||foe.hp<=0)return;
 const s=Math.min(dt,60)/1000,a=speedOf(B,me),b=speedOf(B,foe),bm=$('#bMenu'),sub=!bm.classList.contains('rt');
 B.g.me=Math.min(1,B.g.me+s*(.28+.45*a/(a+b)));B.g.foe=Math.min(1,B.g.foe+s*(.28+.45*b/(a+b))*(B.tr?1:.9)*(sub?.35:1));
 for(let i=0;i<4;i++){const mv=me.moves[i];if(mv)B.cdRaw[i]=Math.min(1,(B.cdRaw[i]??1)+s/MOVES[mv.id][8]);B.cd[i]=Math.min(B.cdRaw[i]??1,B.g.me);const fm=foe.moves[i];if(fm)B.cdFoe[i]=Math.min(1,(B.cdFoe[i]??1)+s/MOVES[fm.id][8]);}
 bm.style.setProperty('--g',B.g.me);if(!sub)bm.classList.toggle('wait',B.g.me<1);$('#bMeAtb').style.width=B.g.me*100+'%';$('#bFoeAtb').style.width=B.g.foe*100+'%';$('#bMeAtb').parentNode.classList.toggle('full',B.g.me>=1);
 if(B.g.me>=1&&!B.readyShown){B.readyShown=1;if(!sub)$('#bLog').textContent='Bereit! Wähle eine Attacke.';sfx('tap');vib(10);}
 B.rtT+=s;if(B.rtT>=5){B.rtT=0;rtRound();return;}
 if(B.g.foe>=1)rtFoe();}

// Gras-Begegnungen: einziges System ist moveEncounter (17-move.js, Schonzeit 3 s + 4 Schritte Abstand, Rascheln-Vorwarnung).
// Der frühere Direkt-Hinterhalt grassAmbush wurde in Loop C entfernt (toter Code, QA B2).

// ---------- Ergebnis- und Fangkarten ----------
// Karte zeigen; schließt per Tipp (nach kurzer Sperre) oder automatisch
// fill(card) (optional): setzt Bilder ein und liefert ein Promise „Bild steht“ – kommt das Bild erst später (Platzhalter → Nachfüllen, 24-capture cardPic),
// schließt die Karte frühestens 1,8 s danach automatisch – auch wenn das echte Bild nach dem 2D-Rückfall nachkommt (Ereignis „picfill“) (Fangkarte-Fix: vorher schloss sie nach 3,4 s, egal ob das Bild schon da war)
function showCard(html,cls,max,fill){const c=$('#bCard'),el=$('#battle');c.className=cls;c.innerHTML=html+'<p class="cnext">Tippen zum Fortfahren</p>';c.hidden=false;const t0=performance.now();
 let hold=null;try{hold=typeof fill==='function'?fill(c):null;}catch(e){console.error('Karte',e);}
 return new Promise(res=>{let done=0,to;const f=e=>{if(done||(e&&performance.now()-t0<450))return;done=1;clearTimeout(to);el.removeEventListener('pointerdown',f);document.removeEventListener('keydown',f);c.removeEventListener('picfill',ext);
  c.classList.add('out');setTimeout(()=>{c.hidden=true;c.classList.remove('out');res();},RED?0:200);};
  to=setTimeout(()=>f(),max||3200);setTimeout(()=>{if(!done){el.addEventListener('pointerdown',f);document.addEventListener('keydown',f);}},120);
  const ext=()=>{if(done)return;const left=t0+(max||3200)-performance.now();if(left<1800){clearTimeout(to);to=setTimeout(()=>f(),1800);}};
  if(hold&&hold.then)hold.then(ext,()=>{});c.addEventListener('picfill',ext);});}
// Kartenbild: robuster Weg (24-capture cardPic: Canvas in fester Größe, Platzhalter + Nachfüllen); ohne 24-capture die alte Miniatur
function cardMini(id,size,o){return mini(id,size,false,Object.assign({card:true},o||{}));}
function xpPct(m,l,xp){const a=l**3,b=(l+1)**3;return Math.max(0,Math.min(100,(xp-a)/(b-a)*100));}
async function resultCard(){if(!B)return;const inBox=m=>typeof boxAll==='function'?boxAll().includes(m):G.box.includes(m),rows=[...(B.xl||new Map())].filter(([m])=>G.team.includes(m)||inBox(m));
 const html=`<div class="rc"><small class="ck">${B.tr?'Herausforderung gewonnen':'Kampf gewonnen'}</small><h2>Sieg!</h2>${B.tr?`<p class="rmoney">+${B.tr.money.toLocaleString('de-DE')} ¤</p>`:''}
  <div class="rrows">${rows.map(([m,r],i)=>`<div class="rrow" style="--d:${i*.08}s"><i class="pm"></i><div><b>${mname(m)} <small>Lv <span class="lv">${r.l0}</span></small></b>
  <div class="xpb2"><i style="width:${xpPct(m,r.l0,r.xp0)}%"></i></div><small class="eg">+${r.g} EP</small></div>${m.l>r.l0?`<span class="lvup">Level ${m.l}!</span>`:''}</div>`).join('')}</div></div>`;
 const p=showCard(html,'res',3600,c=>{const els=[...c.querySelectorAll('.rrow')],w=rows.map(([m],i)=>{const pic=cardMini(m.s,44,{shiny:m.shiny});els[i].querySelector('.pm').appendChild(pic);return pic.ready;});return Promise.all(w);});
 const els=[...$('#bCard').querySelectorAll('.rrow')];
 rows.forEach(([m,r],i)=>{const e=els[i];const bar=e.querySelector('.xpb2 i'),end=xpPct(m,m.l,m.xp),up=m.l>r.l0;
  if(RED){bar.style.width=end+'%';if(up){e.classList.add('up');e.querySelector('.lv').textContent=m.l;}return;}
  setTimeout(()=>{bar.style.width=(up?100:end)+'%';},350+i*120);
  if(up)setTimeout(()=>{e.classList.add('up');e.querySelector('.lv').textContent=m.l;sfx('lvl');bar.style.transition='none';bar.style.width='0%';void bar.offsetWidth;bar.style.transition='';bar.style.width=end+'%';},1100+i*120);});
 await p;}
async function catchCard(m,nw){const M=MONS[m.s],ab=ABIL[(m.ability)||M.ab]||ABIL[M.ab];
 const p=showCard(`<div class="cc"><div class="flip"><div class="back"><span>V</span></div><div class="front" style="--tc:${TYPES[M.t[0]].c}">${nw?'<span class="ribbon">Neu im Dex</span>':''}<i class="pm"></i>
  <small>${typeof dexNr==='function'?dexNr(m.s):'#'+m.s}</small><h2>${mname(m)}${m.shiny?' ✦':''}</h2><div class="chips">${chips(M.t)}</div><p>Lv ${m.l} · ${ab[0]}${m.nature&&typeof NATURES!=='undefined'&&NATURES[m.nature]?' · '+NATURES[m.nature].n:''}</p></div></div></div>`,'catch',3400,
  c=>{const pm=c.querySelector('.pm'),h=Math.round(parseFloat(getComputedStyle(pm).height))||120,pic=cardMini(m.s,Math.max(64,Math.min(120,h)),{shiny:m.shiny,field:true});pm.appendChild(pic);return pic.ready;});
 await p;}
