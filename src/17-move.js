// ===== VEYRA – Bewegung & Physik: Zustände, Untergrund, Schwimmen, Gleiten, Klettern, Kanten =====
// Schnittstellen (AGENTS.md): P.state, setMoveState(s), terrainType(x,z), MOVE_PARAMS, camParams(), stepMs()
// Hooks für andere Module: COMP.mount (Partner trägt beim Schwimmen/Gleiten), P.alt/P.roll/P.lean.
// Reiten ist entfernt (Nutzer 12.11.): kein Zustand 'ride' mehr; alte Werte (P.state 'ride', G.flags.ride/rideTip) werden ignoriert bzw. auf 'walk' gesetzt.
// speed = Felder/s im 3D-Freilauf · ms = 2D-Schritttakt · camH/camD = Kamera-Höhe/-Abstand (3. Person)
// Bewegungsdynamik 12.11.: Gehen-Taste/voller Stick 2,8 (= 2D-Takt 360 ms, lockerer Trab), Rennen 5 (vorher 3,75/7,5 – bei 0,37 Beinlänge nur mit 9 Schritten/s möglich = „Zappeln“)
const MOVE_PARAMS={
 walk:{speed:2.8,accel:6,turn:1.7,camH:2.3,camD:3.6,anim:'walk',ms:360},
 run:{speed:5,accel:4.5,turn:1.55,camH:2.4,camD:3.9,anim:'run',ms:230},
 swim:{speed:2.5,accel:2.6,turn:1.25,camH:1.75,camD:3.3,anim:'swim',ms:420},
 glide:{speed:4,accel:2,turn:1.15,camH:2.7,camD:4.8,anim:'glide',ms:230,sink:.55,lift:2.4},
 climb:{speed:1.2,accel:8,turn:1.7,camH:2.1,camD:3.1,anim:'climb',ms:520}};
const MV={rw:false,glide:null,g2:null,hop2:null,hop3:null,hopY:0,slide:null,push:null,climbGo:0,swimN:0,swimNext:8,
 toastT:{},fxT:{},unT:0,hintQ:[],view:null,camH:2.3,camD:3.6,cl:0,lastA:0,wings:null};
// P.run bleibt kompatibel: true bei run. Schreiben (Stick, Rennen-Knopf, Shift) setzt den Rennwunsch.
(function(){MV.rw=!!P.run;delete P.run;Object.defineProperty(P,'run',{configurable:true,enumerable:true,
 get(){const s=P.state;return s==='walk'||s==='run'?MV.rw:false;},set(v){MV.rw=!!v;}});})();
const MOUNT_ST={swim:1,glide:1};
function isWaterT(t){return t==='~'||t==='Q';}
function terrainType(x,z){if(!cur)return'wall';const tx=Math.round(x),ty=Math.round(z),t=tileAt(cur,tx,ty);if(t===null)return'wall';
 if(isWaterT(t)){const w=(a,b)=>isWaterT(tileAt(cur,a,b));return w(tx+1,ty)&&w(tx-1,ty)&&w(tx,ty+1)&&w(tx,ty-1)?'deepwater':'water';}
 if(t==='"'||t===':')return'tallgrass';if(t==='I')return'ice';if(t==='R')return'ledge';if(/[0-9E]/.test(t))return'door';
 if(t==='.'||t===','||t==='F'||t==='c')return'land';return SOLID.has(t)?'wall':'land';}
function stepMs(){if(MV.g2)return MV.g2.ms;if(MV.hop2)return 420;return(MOVE_PARAMS[P.state]||MOVE_PARAMS.walk).ms;}
function camParams(){const M=MOVE_PARAMS[P.state]||MOVE_PARAMS.walk;return{h:MV.camH,d:MV.camD,lift:MV.cl,roll:P.roll,lean:P.lean,state:P.state,target:{h:M.camH,d:M.camD}};}
// ---------- Freischaltung ----------
// Feldattacken (05-field.js FIELD_MOVES): Schwimmen/Gleiten/Klettern = Orden (Flag) UND Kreatur mit Feldattacke
const MOVE_FM={swim:'wellenritt',glide:'sturmfluegel',climb:'kletterkralle'};
function medalOK(s){const F=FIELD_MOVES[MOVE_FM[s]];return!!(G&&G.flags&&(G.flags[s]||(F&&(G.badges||[]).length>=F.badge)));}
function moveMon(s){const id=MOVE_FM[s];return id&&typeof fieldMon==='function'?fieldMon(id):null;}
function moveUnlocked(s){if(s==='walk'||s==='run')return true;return medalOK(s)&&!!moveMon(s);}
// Träger für die Darstellung (04-roam compMon): beim Schwimmen/Gleiten die Kreatur, die es kann
function carrierMon(){if(!G||!P)return null;const st=P.state;if(st==='swim')return moveMon('swim');if(st==='glide')return moveMon('glide');return null;}
function compName(){const m=typeof compMon==='function'?compMon():null;return m?(m.nickname||MONS[m.s].n):'';}
function canSwim(){return!!(G&&medalOK('swim')&&moveMon('swim'));}
function climbArea(){return!!cur&&!cur.inside&&cur.theme!=='cave';}
function canClimb(){return!!(G&&medalOK('climb')&&moveMon('climb'));}
function canGlide(){return!!(G&&medalOK('glide')&&moveMon('glide'));}
function climbOK(){return!!(canClimb()&&climbArea());}
function unlockTick(now){if(now<MV.unT)return;MV.unT=now+400;const F=G.flags,n=(G.badges||[]).length;
 const L=[['swim',2,'Mit der Flutmedaille darf dein Partner dich übers Wasser tragen – wenn er Wellenritt kann. Geh einfach ins Wasser!'],
  ['glide',3,'Die Frostmedaille schimmert im Wind … Mit Sturmflügel trägt dich dein Partner im Gleitflug über Felskanten!'],
  ['climb',4,'Mit der Schattenmedaille und Kletterkralle findest du Halt an steilen Felswänden. Drück eine Weile gegen eine Klippe.']];
 for(const[k,need,txt]of L)if(n>=need&&!F[k]){F[k]=1;MV.hintQ.push(txt);}
 fieldLearnTick(now);
 if(MV.hintQ.length&&mode==='world'&&!P.moving&&!MV.glide)say(MV.hintQ.splice(0));}
function lockToast(k){const now=performance.now();if(now<(MV.toastT[k]||0))return;MV.toastT[k]=now+2600;
 if(k==='climbing')return toast('Festhalten zum Klettern …');const F=FIELD_MOVES[MOVE_FM[k]];if(!F)return toast(k);
 if(!medalOK(k))return toast(k==='swim'?'Hier könntest du schwimmen – mit der Flutmedaille und Wellenritt.':k==='glide'?'Von hier aus könntest du gleiten – mit der Frostmedaille und Sturmflügel.':'Diese Felswand ließe sich mit der Schattenmedaille und Kletterkralle erklettern.');
 const who=typeof fieldWho==='function'?fieldWho(MOVE_FM[k]):[];toast('Hier bräuchte ich '+F.n+' – '+F.types.map(t=>TYPES[t].n).join('/')+'-Kreaturen ab Lv '+F.lv+(who.length?', z. B. '+who[0]:'')+'.');}
// Feldattacke von selbst gelernt (Lernstufe erreicht) → in m.known eintragen + Hinweis (nacheinander, nicht alle auf einmal)
function fieldLearnTick(now){if(!G||!G.team||mode!=='world'||now<(MV.learnT||0)||typeof FIELD_MOVES==='undefined')return;
 for(const m of G.team){for(const id in FIELD_MOVES){const F=FIELD_MOVES[id];if((m.known||[]).includes(id)||!fieldLearnable(m.s,id)||(m.l||1)<F.lv)continue;
  fieldTeach(m,id);if(G.flags.fmSeen){toast((m.nickname||MONS[m.s].n)+' hat '+F.n+' gelernt! (Feldattacke)');MV.learnT=now+2400;return;}}}G.flags.fmSeen=1;}
// ---------- Zustandsautomat ----------
function landState(){return MV.rw?'run':'walk';}
function wantState(){if(MV.glide||MV.g2)return'glide';const t=cur?tileAt(cur,P.x,P.y):null;
 if(isWaterT(t)&&canSwim())return'swim';if(t==='X'&&canClimb())return'climb';return landState();}
function applyState(s){const prev=P.state;if(prev===s)return;P.state=s;MV.since=performance.now();
 if(COMP)COMP.mount=!!MOUNT_ST[s];
 if(view!=='2d'&&window.THREE&&(s==='swim'||prev==='swim')&&prev!=='glide')spawnFx('splash',P.px+.5,.05,P.py+.5);
 if(s==='swim'&&prev!=='swim'){sfx('pop');vib(12);}}
// Alt-Zustand (z. B. 'ride' aus früheren Versionen) → 'walk'
function moveResolve(){if(!MOVE_PARAMS[P.state])P.state='walk';if(!G||!cur)return;applyState(wantState());}
// Öffentlich: setzt Wunschzustand (walk/run) bzw. prüft swim/glide/climb gegen Freischaltung + Untergrund
function setMoveState(s){if(!G||!MOVE_PARAMS[s])return false;if(!moveUnlocked(s))return false;
 if(s==='walk'||s==='run')MV.rw=s==='run';
 else if(s==='glide'){if(!canGlide())return false;if(!MV.glide&&!MV.g2){if(view!=='2d')startGlide3();else{const gp=glidePath(P.dir,1);if(!gp)return false;startGlide2(gp);P.fx=P.x;P.fy=P.y;P.x=gp.to[0];P.y=gp.to[1];P.moving=true;P.t=0;}}}
 moveResolve();return P.state===s;}
function moveReset(){MV.glide=null;MV.g2=null;MV.hop2=null;MV.hop3=null;MV.hopY=0;MV.slide=null;MV.push=null;MV.climbGo=0;P.alt=0;P.roll=0;P.lean=0;
 if(!MOVE_PARAMS[P.state])P.state='walk';if(G&&cur)moveResolve();}
// ---------- Kanten, Gleitpfad, Klettern ----------
function landable(x,y){return tileAt(cur,x,y)!==null&&!blocked(x,y)&&!roamAt(x,y);}
// Gerade Linie: erste Kachel Kante (R), dann Kanten/Wasser bis zu festem Boden (max. 9)
function glidePath(dir,any){const[dx,dy]=DIRV[dir];let x=P.x,y=P.y;for(let k=1;k<=9;k++){x+=dx;y+=dy;const t=tileAt(cur,x,y);if(t===null)return null;
 if(k===1&&t!=='R'&&!any)return null;if(t==='R'||isWaterT(t))continue;if(landable(x,y))return k>=2?{to:[x,y],n:k}:null;return null;}return null;}
function pushWall(x,y,loose){const now=performance.now(),q=MV.push;
 if(q&&(loose||q.x===x&&q.y===y)&&now-q.t1<260){q.t1=now;if(now-q.t0>330){MV.push=null;return true;}}else{MV.push={x,y,t0:now,t1:now};lockToast('climbing');}return false;}
function startGlide2(gp){MV.g2={ms:gp.n*230+140,n:gp.n};MV.hop2=null;applyState('glide');sfx('whoosh');vib(15);}
// 2D-Gitter (auch für tryMove in 3D): true = begehbar trotz SOLID, false = gesperrt, {to} = Sprung/Gleitflug, null = Standard
function moveGate(dir,nx,ny){if(!G||!cur)return null;const t=tileAt(cur,nx,ny);if(t===null)return null;const occ=npcAt(nx,ny)||villAt(nx,ny);
 if(MV.g2||MV.glide)return false;
 if(isWaterT(t)){if(occ)return false;if(canSwim())return true;if(t==='Q')return null;lockToast('swim');return false;}
 if(t==='X'&&climbArea()){if(!canClimb()){if(G.badges&&G.badges.length>=2)lockToast('climb');return null;}if(occ)return false;if(P.state==='climb')return true;return pushWall(nx,ny)?true:false;}
 if(t==='R'){const[dx,dy]=DIRV[dir],gp=dir!=='up'?glidePath(dir):null;
  if(gp&&gp.n>2&&canGlide()&&P.state!=='swim'){startGlide2(gp);return{to:gp.to};}
  if(dir==='down'&&landable(nx+dx,ny+dy)){MV.hop2=1;sfx('whoosh');return{to:[nx+dx,ny+dy]};}
  if(gp&&gp.n>2&&!canGlide())lockToast('glide');return null;}
 return null;}
// onStep-Hook (03): Landung nach Sprung/Gleitflug, Eis-Rutschen
function moveLanded(t){ENC.steps++;if(MV.hop2){MV.hop2=null;sfx('land');vib(12);}
 if(MV.g2){MV.g2=null;sfx('land');vib([20,30,20]);moveResolve();}
 MV.slide=t==='I'&&view==='2d'?P.dir:null;}
// ---------- Versteckte Begegnungen: hohes Gras, Schwimmen, Angeln (Agent Bewegung) ----------
// Gras (" und :) zusätzlich zu den sichtbaren Kreaturen: 6–9 % je Schritt (DF().enc: leicht 6 %, normal 9 %), Rennen ×1,25,
// mind. 4 Schritte Abstand, 3 s Schonzeit nach jedem Kampf, nur im Weltmodus. Vorwarnung 0,7 s: Gras wackelt + Puff + Rascheln, dann Kampf.
// Schwimmen: 5–7 % je Schwimmschritt, Vorwarnung Blubberblasen/Kräuseln 0,85 s. Angeln: A vor Wasser → 1–3 s warten → „Es zappelt!“ → tippen.
const ENC={steps:99,calm:0,inB:0,pend:null,fish:null,tm:0,fxT:0};
function encDF(){try{const e=DF().enc;return e==null?1:e;}catch(e){return 1;}}
function encChance(kind){const k=Math.max(0,Math.min(1,(encDF()-.6)/.4));let p=kind==='water'?.05+.02*k:.06+.03*k;
 if(P.run&&kind!=='water')p*=1.25;return p;}
// Tests/Demo (navigator.webdriver oder VEYRA_DEMO): zufällige versteckte Begegnungen aus, damit Abläufe planbar bleiben; window.VEYRA_ENC=1 schaltet sie ein
function encAuto(){try{return(navigator.webdriver===true||!!window.VEYRA_DEMO)&&!window.VEYRA_ENC;}catch(e){return false;}}
function encReady(){return!encAuto()&&mode==='world'&&!ENC.pend&&!ENC.fish&&performance.now()>=ENC.calm&&ENC.steps>=4&&!MV.glide&&!MV.g2&&!!G&&G.team.some(m=>m.hp>0);}
// Seltenere Arten bevorzugt: Gewicht je Art = √(Einträge) × Bonus für niedrige Fangrate
function encWeight(s,n){const M=MONS[s];if(!M||M.legend)return 0;const cr=M.cr||120;return Math.sqrt(n)*(cr<=60?1.7:cr<=120?1.3:1);}
function encPick(L,rnd){rnd=rnd||Math.random;if(!L||!L.length)return null;const by=new Map();for(const e of L){if(!MONS[e[0]])continue;const q=by.get(e[0])||[];q.push(e);by.set(e[0],q);}
 const S=[...by.entries()].map(([s,q])=>[s,q,encWeight(s,q.length)]).filter(x=>x[2]>0);if(!S.length)return null;let r=rnd()*S.reduce((a,x)=>a+x[2],0),pick=S[S.length-1];
 for(const x of S){r-=x[2];if(r<0){pick=x;break;}}const e=pick[1][Math.floor(rnd()*pick[1].length*.9999)];return[e[0],e[1]+Math.floor(rnd()*(e[2]-e[1]+1)*.9999)];}
function grassEnc(rnd){const E=cur&&cur.enc;if(!E)return null;return encPick(isNight()?E.night:E.day,rnd);}
// Wasser-Arten: cur.enc.water (falls vorhanden), sonst Flut-Arten der Karte, sonst Flut-Arten aller Routen (Level nach Orden)
function waterEnc(rnd,fish){rnd=rnd||Math.random;const E=cur&&cur.enc,ok=e=>MONS[e[0]]&&MONS[e[0]].t.includes('flut')&&!MONS[e[0]].legend;
 if(E&&fish&&E.fish&&E.fish.length)return encPick(E.fish,rnd);if(E&&E.water&&E.water.length)return encPick(E.water,rnd);
 let L=E?(isNight()?E.night:E.day).filter(ok):[];if(!L.length&&E)L=E.day.concat(E.night).filter(ok);
 if(!L.length){const n=(G.badges||[]).length,lv=6+n*6,S=new Set();for(const id in MAPS){const e=MAPS[id].enc;if(e)e.day.concat(e.night).filter(ok).forEach(x=>S.add(x[0]));}
  if(!S.size)return null;L=[...S].map(s=>[s,lv,lv+3]);}
 return encPick(L,rnd);}
function moveEncounter(t){if(!G||!cur)return false;const grass=t==='"'||t===':',water=isWaterT(t)&&P.state==='swim';if(!grass&&!water)return false;
 if(grass&&!cur.enc)return false;if(!encReady())return false;if(Math.random()>=encChance(water?'water':'grass'))return false;
 const e=water?waterEnc():grassEnc();if(!e)return false;encWarn(water?'water':'grass',e);return true;}
// Vorwarnung: Spielfigur bleibt stehen, Gras/Wasser vor ihr bewegt sich, Geräusch – dann Kampf
function encWarn(kind,e){const[dx,dy]=DIRV[P.dir]||[0,0],ahead=tileAt(cur,P.x+dx,P.y+dy),ok=kind==='water'?isWaterT(ahead):(ahead==='"'||ahead===':');
 const x=ok?P.x+dx:P.x,y=ok?P.y+dy:P.y,dur=kind==='water'?850:700;ENC.pend={kind,s:e[0],l:e[1],x,y,t0:performance.now(),dur};ENC.steps=0;
 held=null;P.walk=false;P.v=0;if(typeof STICK!=='undefined'){STICK.x=0;STICK.y=0;}mode='wait';sfx(kind==='water'?'bubble':'rustle');vib(kind==='water'?[15,40,15]:[20,30,20]);
 clearTimeout(ENC.tm);ENC.tm=setTimeout(encFire,RED?250:dur);}
function encFire(){const p=ENC.pend;if(!p)return false;ENC.pend=null;if(mode!=='wait')return false;mode='world';if(!G.team.some(m=>m.hp>0))return false;held=null;startBattle({wild:mk(p.s,p.l)});return true;}
// 3D-Effekte (aus 09 atmo3d je Frame): Grasbüschel wackeln (uPush pulsiert), Puffs bzw. Blasen/Ringe
function encFx3d(put,t){const p=ENC.pend||ENC.fish;if(!p||!window.THREE)return;const x=p.x+.5,z=p.y+.5,k=(performance.now()-(p.t0||0))/1000;
 if(ENC.pend&&p.kind==='grass'){put(x,z,.95,.7+.7*Math.sin(k*34));if(every('ep',70)){const gy=terrainY(x,z);spawnFx('rustle',x+(Math.random()-.5)*.6,gy+.3,z+(Math.random()-.5)*.6);spawnFx('rustle',x+(Math.random()-.5)*.4,gy+.45,z+(Math.random()-.5)*.4);}if(every('ed',260))spawnFx('dust',x,terrainY(x,z)+.15,z);}
 else if(ENC.pend){if(every('ep',150)){spawnFx('wake',x+(Math.random()-.5)*.4,.05,z+(Math.random()-.5)*.4);spawnFx('splash',x,.04,z);}}
 else if(ENC.fish){const b=ENC.fish.ph==='bite';if(every('ef',b?140:700))spawnFx(b?'splash':'wake',x,.05,z);}}
// 2D-Effekte (aus 04 roamFx2D): Halme schwanken, Puffs; Blasen; Schwimmer
function encFx2d(c){const p=ENC.pend||ENC.fish;if(!p)return;const now=performance.now(),k=(now-(p.t0||now))/1000,X=p.x*TS+8,Y=p.y*TS+8;c.save();
 if(ENC.pend&&p.kind==='grass'){const col=(PAL[cur.theme]||PAL.default).tg;c.strokeStyle=shade(col,.8);c.lineWidth=1.8;c.lineCap='round';
  for(let i=0;i<9;i++){const bx=X-8+i*2,sw=Math.sin(k*40+i*1.3)*3.2;c.beginPath();c.moveTo(bx,Y+7);c.quadraticCurveTo(bx+sw*.5,Y,bx+sw,Y-6-(i%3)*2);c.stroke();}
  for(let i=0;i<5;i++){const a=i*1.26+k*2,r=3+((k*3+i*.3)%1)*8;c.globalAlpha=Math.max(0,.8-((k*3+i*.3)%1));circ(c,X+Math.cos(a)*r,Y-3-((k*3+i*.3)%1)*6,1.6,'#e8f5c8');}}
 else if(ENC.pend){for(let i=0;i<6;i++){const q=(k*1.6+i/6)%1;c.globalAlpha=1-q;c.strokeStyle='#eaf6ff';c.lineWidth=1;c.beginPath();c.arc(X+Math.sin(i*2.1)*4,Y+3-q*9,1.2+q*1.8,0,7);c.stroke();}
  c.globalAlpha=.6;c.beginPath();c.ellipse(X,Y+4,4+(k*9%6),2+(k*9%6)*.4,0,0,7);c.stroke();}
 else{const b=ENC.fish.ph==='bite',dy=b?Math.sin(k*30)*1.6+1:Math.sin(k*3)*.6;c.strokeStyle='rgba(40,40,60,.6)';c.lineWidth=.6;c.beginPath();c.moveTo(P.px*TS+8,P.py*TS+2);c.quadraticCurveTo((P.px*TS+X)/2+8,Math.min(P.py*TS,Y)-6,X,Y+dy);c.stroke();
  circ(c,X,Y+dy,2.2,'#ffffff');c.fillStyle='#e2554d';c.beginPath();c.arc(X,Y+dy,2.2,Math.PI,0);c.fill();if(b){c.strokeStyle='#eaf6ff';c.globalAlpha=.8;c.beginPath();c.ellipse(X,Y+3,5+(k*12%4),2,0,0,7);c.stroke();}}
 c.restore();}
// ---------- Angeln: A vor Wasser (nicht beim Schwimmen) ----------
function fishSpot(){if(!G||!cur||mode!=='world'||P.state==='swim'||MV.glide||!G.team.some(m=>m.hp>0))return null;const[dx,dy]=DIRV[P.dir],x=P.x+dx,y=P.y+dy;
 if(tileAt(cur,x,y)!=='~'||npcAt(x,y)||(typeof roamAt==='function'&&roamAt(x,y))||villAt(x,y))return null;return[x,y];}
function fishCast(){const sp=fishSpot();if(!sp)return false;const now=performance.now(),wait=1000+Math.random()*2000;
 ENC.fish={x:sp[0],y:sp[1],t0:now,ph:'wait',bite:now+wait};held=null;P.walk=false;P.v=0;mode='wait';toast('Du wirfst die Angel aus …');sfx('whoosh');
 clearTimeout(ENC.tm);ENC.tm=setTimeout(fishBite,wait);return true;}
function fishBite(){const F=ENC.fish;if(!F||F.ph!=='wait')return;F.ph='bite';F.t0=performance.now();toast('Es zappelt! Schnell tippen!');sfx('bubble');sfx('emote');vib([30,40,30]);
 clearTimeout(ENC.tm);ENC.tm=setTimeout(()=>fishEnd('miss'),RED?2200:1400);}
function fishEnd(r){const F=ENC.fish;if(!F)return;ENC.fish=null;clearTimeout(ENC.tm);if(mode==='wait')mode='world';
 if(r==='miss'){toast('Weg war\'s. Versuch es noch einmal!');return;}if(r==='early'){toast('Zu früh gezogen – noch hat nichts angebissen.');return;}
 const e=waterEnc(null,true);if(!e){toast('Hier beißt heute nichts an.');return;}ENC.steps=0;held=null;toast('Es zappelt! '+MONS[e[0]].n+' hängt an der Angel!');startBattle({wild:mk(e[0],e[1])});}
function fishReact(){const F=ENC.fish;if(!F)return false;const now=performance.now();if(F.ph==='bite'){fishEnd('catch');return true;}if(now-F.t0>350){fishEnd('early');return true;}return true;}
['pointerdown','keydown'].forEach(ev=>window.addEventListener(ev,e=>{if(!ENC.fish)return;if(ev==='keydown'&&(e.repeat||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')))return;
 if(ev==='keydown'&&!/^(Space|Enter|KeyE|KeyA|KeyX|NumpadEnter)$/.test(e.code))return;fishReact();if(ev==='keydown')e.preventDefault();},true));
// A-Taste: vor offenem Wasser angeln (nach NPC/Feld/Kreatur – die haben Vorrang)
const _interactFish=interact;interact=function(){if(mode==='world'&&!ENC.fish){const[dx,dy]=DIRV[P.dir],x=P.x+dx,y=P.y+dy;
 if(!npcAt(x,y)&&!(typeof roamAt==='function'&&roamAt(x,y))&&!villAt(x,y)&&!(COMP&&COMP.x===x&&COMP.y===y&&!COMP.mount)&&fishSpot())return fishCast();}return _interactFish();};
// Schonzeit nach Kämpfen: startBattle merkt sich den Kampf, moveTick setzt danach 3 s Ruhe
const _startBattleMV=startBattle;startBattle=function(){ENC.inB=1;ENC.pend=null;return _startBattleMV.apply(this,arguments);};
// ---------- Eingabe ----------
function stepInput(h){if(view==='2d'){if(MV.slide&&tileAt(cur,P.x,P.y)==='I')return tryMove(MV.slide);return tryMove(h);}
 if(h==='up')return tryMove(P.dir);
 const now=performance.now();if(now<turnT)return;turnT=now+240;const o=['up','right','down','left'],i=o.indexOf(P.dir);
 P.dir=o[(i+(h==='right'?1:h==='left'?3:2))%4];}
// ---------- Freies Laufen in 3D ----------
function dirFromAng(){const a=((P.ang%(2*Math.PI))+2*Math.PI)%(2*Math.PI);P.dir=['up','left','down','right'][Math.round(a/(Math.PI/2))%4];}
// Schwelle .2 statt .45: die Eckenprüfung in freeMove (±.27) sperrt sonst schon vorher – der Kartenrand war nie erreichbar
function edgeOut(nx,ny){if(nx<-.2||ny<-.2||nx>cur.w-.8||ny>cur.h-.8){const d=nx<-.2?'left':nx>cur.w-.8?'right':ny<-.2?'up':'down';
 if(MV.glide)endGlide(true);P.x=Math.max(0,Math.min(cur.w-1,Math.round(P.px)));P.y=Math.max(0,Math.min(cur.h-1,Math.round(P.py)));P.walk=false;tryMove(d);P.moving=false;P.px=P.x;P.py=P.y;return true;}return false;}
function pass3(tx,ty){const t=tileAt(cur,tx,ty);if(t===null)return false;
 if(MV.hop3&&t==='R')return!npcAt(tx,ty);
 if(isWaterT(t)){if(npcAt(tx,ty)||villAt(tx,ty))return false;if(canSwim())return true;if(t!=='Q')lockToast('swim');return false;}
 if(t==='X'&&climbArea()&&canClimb()){if(npcAt(tx,ty))return false;if(P.state==='climb'||performance.now()<MV.climbGo)return true;if(pushWall(tx,ty,1)){MV.climbGo=performance.now()+700;return true;}return false;}
 return!blocked(tx,ty);}
// Kante voraus: Gleitflug (lange Kante/Wasser dahinter) oder Hüpfer (abwärts)
function ledge3(rx,ry,fx,fy){const d=Math.abs(fx)>Math.abs(fy)?(fx>0?'right':'left'):(fy>0?'down':'up'),[dx,dy]=DIRV[d];
 const gp=d!=='up'&&P.x+dx===rx&&P.y+dy===ry?glidePath(d):null;
 if(gp&&gp.n>2&&canGlide()&&P.state!=='swim'){startGlide3();return true;}
 if(d==='down'&&landable(rx+dx,ry+dy)){MV.hop3={t:0,dur:.5};sfx('whoosh');return false;}
 if(gp&&gp.n>2&&!canGlide())lockToast('glide');return false;}
function freeMove(dt){if(mode!=='world'){P.walk=false;return;}let sx=STICK.x,sy=STICK.y;
 if(!sx&&!sy&&held){sx=held==='left'?-1:held==='right'?1:0;sy=held==='up'?-1:held==='down'?1:0;}
 if(P.ang==null)P.ang=YAW[P.dir];const s=Math.min(dt,120)/1000;const dz=v=>Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;sx=dz(sx);sy=dz(sy);
 if(MV.glide)return glide3(s,sx,sy);
 const M=MOVE_PARAMS[P.state]||MOVE_PARAMS.walk,ice=tileAt(cur,P.x,P.y)==='I';
 P.tv=(P.tv||0)+((-sx*M.turn*(ice?.45:1)*(Math.abs(sy)>.3?.65:1))-(P.tv||0))*Math.min(1,s*9);P.ang+=P.tv*s;dirFromAng();
 let want=-sy*M.speed;if(MV.hop3)want=Math.max(want,3,P.v||0);
 const up=Math.abs(want)>Math.abs(P.v||0),k=ice?(up?1.2:.75):(up?M.accel:7);// Bremsen τ ≈ 0,14 s: Auslaufen mit Ausfallschritt statt Einfrieren
 P.v=(P.v||0)+(want-(P.v||0))*Math.min(1,s*k);const sp=P.v*s;P.walk=Math.abs(P.v)>.08;if(!P.walk){P.v=0;return;}
 const fx=-Math.sin(P.ang),fy=-Math.cos(P.ang),nx=P.px+fx*sp,ny=P.py+fy*sp;
 if(edgeOut(nx,ny))return;
 if(P.v>.5&&!MV.hop3&&P.state!=='climb'){const ax=Math.round(P.px+fx*.62),ay=Math.round(P.py+fy*.62);
  if((ax!==P.x||ay!==P.y)&&tileAt(cur,ax,ay)==='R'){if(ledge3(ax,ay,fx,fy))return;}
  else if(canGlide()&&P.v>2.2&&P.state!=='swim'){const d0=terrainY(P.px+.5,P.py+.5),d1=terrainY(P.px+.5+fx*1.1,P.py+.5+fy*1.1);
   if(d0-d1>.6&&!blocked(Math.round(P.px+fx*1.1),Math.round(P.py+fy*1.1))){startGlide3();return;}}}
 const free=(x,y)=>{for(const[ox,oy]of[[-.27,-.27],[.27,-.27],[-.27,.27],[.27,.27]]){const tx=Math.round(x+ox),ty=Math.round(y+oy);if(tx===P.x&&ty===P.y)continue;if(!pass3(tx,ty))return false;}return true;};
 const rr=roamAt(Math.round(P.px+fx*.65),Math.round(P.py+fy*.65));if(rr&&G.team.some(m=>m.hp>0)&&!MV.hop3){P.walk=false;return startWild(rr);}
 if(free(nx,P.py))P.px=nx;else bump();if(free(P.px,ny))P.py=ny;
 const tx=Math.round(P.px),ty=Math.round(P.py);if(tx!==P.x||ty!==P.y){const ox=P.x,oy=P.y;P.x=tx;P.y=ty;G.px=tx;G.py=ty;compFollow(ox,oy);onStep();}
 if(MV.hop3&&MV.hop3.t>=MV.hop3.dur&&tileAt(cur,P.x,P.y)!=='R'){MV.hop3=null;MV.hopY=0;sfx('land');vib(12);if(window.THREE)spawnFx('land',P.px+.5,terrainY(P.px+.5,P.py+.5)+.02,P.py+.5);}}
// Gleitflug 3D: konstante Vorwärtsfahrt, Sinkrate, Lenken mit Rollen
function startGlide3(){MV.hop3=null;MV.glide={y:terrainY(P.px+.5,P.py+.5)+.1,vy:MOVE_PARAMS.glide.lift,t:0};P.v=MOVE_PARAMS.glide.speed;applyState('glide');sfx('whoosh');vib(15);
 if(window.THREE)spawnFx('wind',P.px+.5,MV.glide.y+.6,P.py+.5);}
function glide3(s,sx,sy){const M=MOVE_PARAMS.glide,g=MV.glide;g.t+=s;
 P.tv=(P.tv||0)+((-sx*M.turn)-(P.tv||0))*Math.min(1,s*4);P.ang+=P.tv*s;dirFromAng();
 P.roll+=(Math.max(-.6,Math.min(.6,P.tv*.5))-P.roll)*Math.min(1,s*6);
 const spd=M.speed*(1-sy*.25);P.v=spd;P.walk=true;g.vy=Math.max(g.vy-5*s,-M.sink);g.y+=g.vy*s;
 const fx=-Math.sin(P.ang),fy=-Math.cos(P.ang),nx=P.px+fx*spd*s,ny=P.py+fy*spd*s;if(edgeOut(nx,ny))return;
 const tx=Math.round(nx),ty=Math.round(ny),t=tileAt(cur,tx,ty);
 if(t===null||!(t==='R'||isWaterT(t)||!SOLID.has(t))){bump();return endGlide(true);}
 P.px=nx;P.py=ny;if(tx!==P.x||ty!==P.y){P.x=tx;P.y=ty;G.px=tx;G.py=ty;}
 const gy=terrainY(P.px+.5,P.py+.5),wet=isWaterT(t),surf=wet?Math.max(gy,.03):gy;
 if(g.y<=surf){const ok=wet?canSwim()&&!npcAt(tx,ty):t!=='R'&&!blocked(tx,ty);if(ok)return endGlide();g.y=surf;g.vy=Math.max(g.vy,0);}
 P.alt=Math.max(0,g.y-surf);if(g.t>14)endGlide(true);}
function endGlide(force,noStep){if(!MV.glide)return;MV.glide=null;P.roll=0;P.alt=0;const t=tileAt(cur,P.x,P.y);
 const ok=t!==null&&(isWaterT(t)?canSwim()&&!npcAt(P.x,P.y):t!=='R'&&!blocked(P.x,P.y));
 if(!ok){const[a,b]=findWalk(P.x,P.y);P.x=a;P.y=b;P.px=a;P.py=b;G.px=a;G.py=b;}
 moveResolve();sfx('land');vib([20,30,20]);if(window.THREE&&view!=='2d')spawnFx('land',P.px+.5,Math.max(terrainY(P.px+.5,P.py+.5),isWaterT(t)?.03:-9)+.02,P.py+.5);
 if(!noStep&&!force)onStep();}
// ---------- Tick (läuft nach roamTick, nur im Weltmodus) ----------
function every(k,ms){const n=performance.now();if(n<(MV.fxT[k]||0))return false;MV.fxT[k]=n+ms;return true;}
function moveTick(dt){if(!G||!cur)return;const now=performance.now(),s=Math.min(dt,120)/1000;unlockTick(now);
 if(MV.view!==view){if(MV.glide&&view==='2d')endGlide(true,true);if(view!=='2d'){MV.g2=null;MV.hop2=null;}else MV.hop3=null;MV.view=view;}
 if(ENC.inB&&mode==='world'){ENC.inB=0;ENC.calm=now+3000;}
 // 2D-Schritttakt: 15-ui rechnet mit 360/230 ms – hier auf stepMs() korrigieren
 if(view==='2d'&&P.moving&&P.t>0){const base=P.run?230:360,w=stepMs();if(w!==base)P.t=Math.max(.001,P.t+dt/w-dt/base);}
 if(view==='2d'&&!P.moving&&MV.slide&&mode==='world'){if(tileAt(cur,P.x,P.y)==='I'){const x0=P.x,y0=P.y;tryMove(MV.slide);if(P.x===x0&&P.y===y0&&!P.moving)MV.slide=null;}else MV.slide=null;}
 moveResolve();
 const st=P.state,mv=P.moving||P.walk;
 // Kurvenneigung / Rollen / Kletterhöhe
 if(st!=='glide')P.roll+=(0-P.roll)*Math.min(1,s*6);
 // Kurvenneigung (Bewegungsdynamik): Fliehkraft-Lean ∝ Tempo × Drehrate, ganzer Körper um die Füße (38 gaitTick hält die Füße am Boden)
 const lt=(st==='walk'||st==='run')&&mv&&view!=='2d'?Math.max(-.22,Math.min(.22,Math.abs(P.v||0)*(P.tv||0)*.028)):0;P.lean+=(lt-P.lean)*Math.min(1,s*7);
 if(!MV.glide){const tg=st==='climb'?1.05:0;P.alt+=(tg-P.alt)*Math.min(1,s*5);if(Math.abs(P.alt)<.002)P.alt=0;}
 if(MV.hop3){MV.hop3.t+=s;MV.hopY=Math.sin(Math.PI*Math.min(1,MV.hop3.t/MV.hop3.dur))*.5;}else MV.hopY=0;
 // Partner trägt (Schwimmen/Gleiten): Begleiter unter der Spielfigur
 if(COMP){COMP.mount=!!MOUNT_ST[st];if(COMP.mount){const a2=view==='2d'?alt2d()/TS:0;COMP.px=P.px;COMP.py=P.py-(view==='2d'?.01+a2:0);COMP.x=P.x;COMP.y=P.y;
  COMP.ang=P.ang!=null?P.ang:YAW[P.dir];COMP.dir=P.dir;COMP.mv=mv;COMP.pose=null;COMP.idle=0;COMP.trail=[[P.px,P.py]];}
  else if(view!=='2d'&&mv){const d=Math.hypot(COMP.px-P.px,COMP.py-P.py);if(d>2.4&&d<4){const k=(d-2.4)/d;COMP.px+=(P.px-COMP.px)*k;COMP.py+=(P.py-COMP.py)*k;}}}
 // Kamera weich nachführen
 const M=MOVE_PARAMS[st]||MOVE_PARAMS.walk,ck=Math.min(1,s*2.2);MV.camH+=(M.camH-MV.camH)*ck;MV.camD+=(M.camD-MV.camD)*ck;
 // Effekte 3D
 if(view!=='2d'&&window.THREE&&R3){const px=P.px+.5,pz=P.py+.5,f=[-Math.sin(P.ang||0),-Math.cos(P.ang||0)];
  if(st==='swim'&&mv&&every('sw',210))spawnFx('wake',px-f[0]*.3,.05,pz-f[1]*.3);
  if(st==='glide'&&MV.glide&&every('gl',110))spawnFx('wind',px+(Math.random()-.5)*.8,MV.glide.y+.5+Math.random()*.6,pz+(Math.random()-.5)*.8);
  mvHook();}
 }
const _roamTickMV=roamTick;roamTick=function(dt){_roamTickMV(dt);try{moveTick(dt);}catch(e){console.error('Bewegung',e);}};
// ---------- 2D-Darstellung: Sitzhöhe, Sprung-/Gleitbogen, Kielwasser, Schatten ----------
function alt2d(){if(MV.g2&&P.moving)return Math.pow(Math.sin(Math.PI*Math.min(1,P.t)),.55)*13;if(MV.hop2&&P.moving)return Math.sin(Math.PI*Math.min(1,P.t))*7;return 0;}
const _drawPersonMV=drawPerson;drawPerson=function(x,y,dir,col,walk,hat,t,hair){
 if(view==='2d'&&G&&col==='#e8623a'&&x===P.px*TS){const st=P.state,mount=COMP&&COMP.mount,a=alt2d(),c=cx;let dy=a;
  if(a>0){ell(c,x+8,y+15,5.5*(1-a/30),1.9,'rgba(0,0,0,.2)');}
  if(st==='swim'){const w=Math.sin(anim/300);c.strokeStyle='rgba(235,250,255,.75)';c.lineWidth=.8;c.beginPath();c.ellipse(x+8,y+12,8+w,2.6,0,0,7);c.stroke();
   if(P.moving){c.strokeStyle='rgba(235,250,255,.4)';c.beginPath();c.ellipse(x+8,y+13,11+w*1.5,3.6,0,0,7);c.stroke();}dy+=4+Math.sin(anim/280)*.8;}
  else if(mount)dy+=6;
  if(st==='glide'){const fl=Math.sin(anim/120)*1.5;c.fillStyle='rgba(235,250,255,.9)';c.strokeStyle='rgba(120,170,200,.7)';c.lineWidth=.6;
   const ay=y+9-dy;for(const sg of[-1,1]){c.beginPath();c.moveTo(x+8,ay);c.quadraticCurveTo(x+8+sg*10,ay-8+fl,x+8+sg*15,ay-2-fl);c.quadraticCurveTo(x+8+sg*8,ay+2,x+8,ay+3);c.fill();c.stroke();}}
  return _drawPersonMV(x,y-dy,dir,col,mount?false:walk,hat,t,hair);}
 return _drawPersonMV(x,y,dir,col,walk,hat,t,hair);};
// ---------- 3D-Darstellung: Hook um den Renderer (09 bleibt unverändert) ----------
let _mvP=null,_mvQ=null,_mvV=null;
function mvHook(){if(!R3||!R3.r||R3.r._mvOrig||!window.THREE)return;_mvP=new THREE.Vector3();_mvQ=new THREE.Quaternion();_mvV=new THREE.Vector3();const r=R3.r,orig=r.render.bind(r);r._mvOrig=orig;
 r.render=function(S,cam){if(S!==R3.scene||cam!==R3.cam||view==='2d'||!G||!cur)return orig(S,cam);let ok=false;
  try{_mvP.copy(cam.position);_mvQ.copy(cam.quaternion);ok=true;mvPose3d(S,cam);}catch(e){console.error('Bewegung 3D',e);}
  orig(S,cam);if(ok){cam.position.copy(_mvP);cam.quaternion.copy(_mvQ);}};}
function seatOf(o){if(o.userData.mvSeat)return o.userData.mvSeat;const ry=o.rotation.y,rz=o.rotation.z;o.rotation.set(0,0,0);o.updateMatrixWorld(true);
 const b=new THREE.Box3().setFromObject(o);o.rotation.y=ry;o.rotation.z=rz;const h=isFinite(b.max.y)?b.max.y-o.position.y:.6;return o.userData.mvSeat=Math.max(.3,Math.min(1,h*.78));}
function mvWings(S){let w=MV.wings;if(!w){w=new THREE.Group();const g=new THREE.SphereGeometry(.5,14,8),m=toonMat('#eefcff',{transparent:true,opacity:.88,emissive:'#9fe8ff',emissiveIntensity:.35});
  for(const sg of[-1,1]){const p=new THREE.Group(),wm=new THREE.Mesh(g,m);wm.scale.set(.62,.05,.26);wm.position.set(sg*.56,0,.06);wm.rotation.y=sg*-.25;p.add(wm);p.userData.sg=sg;w.add(p);}MV.wings=w;}
 if(w.parent!==S)S.add(w);return w;}
// Pose der Spielfigur für den Laufzyklus: sit (Schwimmen/Gleiten auf dem Partner), climb, air (Kantensprung), ground
function gaitModeP(){const st=P.state;if(MOUNT_ST[st]&&COMP&&COMP.mount)return'sit';if(st==='climb')return'climb';if(MV.hop3&&MV.hopY>.04)return'air';return'ground';}
function mvPose3d(S,cam){const pl=R3.player,px=P.px+.5,pz=P.py+.5,gy=terrainY(px,pz),st=P.state,t=anim,dt=Math.min(.1,Math.max(.001,(t-(MV.pt||t))/1000));MV.pt=t;
 const mm=S.userData.mm,o=COMP&&COMP.mount&&mm?mm.get(COMP):null,seat=o?seatOf(o):0,mv=P.walk||P.moving;let cy=gy,py=pl.position.y;
 if(st==='swim'){const surf=Math.max(gy,.03)+Math.sin(t/420)*.035;cy=surf-seat*.32;py=surf+seat*.45;}
 else if(st==='glide'){const y=MV.glide?MV.glide.y:gy+P.alt;cy=y+Math.sin(t/300)*.04;py=cy+seat*.85;}
 else if(P.alt||MV.hopY)py=gy+P.alt+MV.hopY;
 pl.position.y=py;pl.rotation.z=st==='glide'?P.roll:P.lean;
 // Beinposen (Sitzen/Klettern/Sprung) macht gaitTick (38-models.js) über gaitModeP(); alter Weg nur ohne Rig
 if(!pl.userData.rig){if(MOUNT_ST[st]&&COMP&&COMP.mount){const L=pl.userData.legs;if(L){L[0].rotation.x=L[1].rotation.x=1.2;L[0].rotation.z=-.25;L[1].rotation.z=.25;}}
  else if(pl.userData.legs){pl.userData.legs[0].rotation.z=pl.userData.legs[1].rotation.z=0;}
  if(st==='climb'&&mv&&pl.userData.legs){const a=Math.sin(t/120)*.5;pl.userData.legs[0].rotation.x=a;pl.userData.legs[1].rotation.x=-a;}}
 if(o){o.position.set(px,cy,pz);o.rotation.y=R3.yaw;o.rotation.z=pl.rotation.z*.7;}
 if(st==='glide'||(MV.wings&&MV.wings.visible)){const w=mvWings(S);w.visible=st==='glide';if(w.visible){w.position.set(px,(o?cy+seat*.55:py+.7),pz);w.rotation.set(0,R3.yaw,P.roll*.8);
  const fl=Math.sin(t/170)*.14;w.children.forEach(p=>{p.rotation.z=p.userData.sg*(.12+fl);});}}
 // Kamera: Höhe/Abstand je Zustand + Anhebung durch Partner/Flughöhe
 const lift=Math.max(-.5,py-(R3.gy??gy)-(st==='walk'||st==='run'?(mv?.02:0):0));MV.cl+=(lift-MV.cl)*(1-Math.exp(-8*dt));
 const C=camParams();
 if(view==='ego'){cam.position.y+=MV.cl;cam.rotateZ(-P.roll*.6);return;}
 const base=R3.gy??gy,hx=px,hy=base+1.3,hz=pz,full=(R3.cd||3.6)>3.3;
 const kd=full?C.d/3.6:Math.min(1,C.d/3.6);_mvV.copy(cam.position);_mvV.x=hx+(_mvV.x-hx)*kd;_mvV.z=hz+(_mvV.z-hz)*kd;_mvV.y=hy+(_mvV.y-hy)*(full?kd:1)+(C.h-2.3)*Math.min(1,(R3.cd||3.6)/3.6)+MV.cl;
 cam.position.copy(_mvV);if(R3.lk){_mvV.copy(R3.lk);_mvV.y+=MV.cl;cam.lookAt(_mvV);cam.rotateZ(-(R3.roll||0)*.4-P.roll*.5-P.lean*.3);}}
