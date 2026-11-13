// ===== VEYRA – Sichtbare wilde Kreaturen & Begleiter (Verhalten) =====
const ROAM={map:null,list:[],tiles:[],want:0,next:0,cryT:0};let COMP=null;
function roamAt(x,y){return ROAM.list.find(r=>r.x===x&&r.y===y);}
// Wesen: scheu (hohe Fangrate), angriffslustig (niedrige Fangrate, Schatten, Glut), sonst neutral
function monNature(s){const M=MONS[s];if(!M||M.legend)return'neutral';if(M.cr>=180&&!M.t.includes('schatten'))return'shy';return!DF().noAggro&&(M.cr<=60||(M.t.includes('schatten')&&M.cr<=120))?'aggro':'neutral';}
function nightOwl(s){const M=MONS[s],E=cur&&cur.enc;return M.t.includes('schatten')||M.ab==='nachtauge'||!!(E&&E.night.some(e=>e[0]===s)&&!E.day.some(e=>e[0]===s));}
function spawnRoam(){ROAM.list=[];ROAM.map=cur.id;ROAM.tiles=[];if(!cur.enc)return;
 for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++){const t=cur.rows[y][x];if(t==='"'||t===':')ROAM.tiles.push([x,y]);}
 ROAM.want=ROAM.tiles.length?Math.min(cur.theme==='cave'||cur.inside?3:6,Math.max(2,Math.round(ROAM.tiles.length/14))):0;ROAM.want=ROAM.want?Math.max(1,Math.round(ROAM.want*DF().enc)):0;/* Höhle/Innenraum: max. 3 (Draw-Call-Budget) */for(let i=0;i<ROAM.want;i++)addRoamer();}
function addRoamer(){const T=ROAM.tiles;if(!T.length)return;for(let k=0;k<25;k++){const[x,y]=T[Math.random()*T.length|0];
 if(blocked(x,y)||roamAt(x,y)||Math.abs(x-P.x)+Math.abs(y-P.y)<3)continue;const L=isNight()?cur.enc.night:cur.enc.day,e=L[Math.random()*L.length|0],gr=MONS[e[0]].genderRatio;
 ROAM.list.push({s:e[0],l:e[1]+(Math.random()*(e[2]-e[1]+1)|0),x,y,px:x,py:y,fx:x,fy:y,t:1,dir:['up','down','left','right'][Math.random()*4|0],next:performance.now()+600+Math.random()*2000,
  st:'idle',stT:0,nat:monNature(e[0]),owl:nightOwl(e[0]),shiny:Math.random()<1/400,o:null,g:gr===-1?null:Math.random()<(gr??.5)?'m':'w'});ROAM.list[ROAM.list.length-1].o={shiny:ROAM.list[ROAM.list.length-1].shiny};return;}}
function startWild(r){if(!G.team.some(m=>m.hp>0))return;const i=ROAM.list.indexOf(r);if(i>=0)ROAM.list.splice(i,1);held=null;
 const dx=r.x-P.x,dy=r.y-P.y;if(Math.abs(dx)+Math.abs(dy)===1)P.dir=dx>0?'right':dx<0?'left':dy>0?'down':'up';ROAM.next=performance.now()+6000;
 const m=mk(r.s,r.l);if(r.shiny)m.shiny=true;if(r.g&&m.gender==null)m.gender=r.g;startBattle({wild:m});}
const dirTo=(dx,dy)=>Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
function roamFree(r,nx,ny,any){const t=tileAt(cur,nx,ny);return(t==='"'||t===':'||(any&&t&&!SOLID.has(t)))&&!blocked(nx,ny)&&!roamAt(nx,ny)&&!(nx===P.x&&ny===P.y)&&!(COMP&&nx===COMP.x&&ny===COMP.y);}
function roamStep(r,d,dur,any){const[mx,my]=DIRV[d],nx=r.x+mx,ny=r.y+my;r.dir=d;if(!roamFree(r,nx,ny,any))return false;r.fx=r.x;r.fy=r.y;r.x=nx;r.y=ny;r.t=0;r.dur=dur;return true;}
function emote(r,k){r.emo={k,t:performance.now()};}
// Verhalten je Roamer: idle/grasen/schnüffeln/schlafen/verstecken/fliehen/anstürmen
function roamThink(r,now){const dist=Math.abs(r.x-P.x)+Math.abs(r.y-P.y),fast=P.run&&(P.moving||P.walk),night=isNight()&&!cur.inside;
 if(r.st==='sleep'){if(!night||(fast&&dist<=2)){r.st='idle';emote(r,'!');r.pose=null;r.expr='neutral';r.next=now+500;}else{r.pose='sleep';r.expr='neutral';return;}}
 if(night&&!r.owl&&r.st!=='flee'&&r.st!=='charge'&&dist>2){r.st='sleep';r.pose='sleep';return;}
 if(r.st==='hide'){if(dist>5||fast||now>r.stT){r.st='idle';r.pose=null;r.expr='neutral';}else{r.pose='hide';return;}}
 if(r.st==='flee'||r.st==='charge'){if(now>r.stT){r.st='idle';r.pose=null;r.expr='neutral';}}
 if(r.st==='graze'||r.st==='sniff'){if(now>r.stT||dist<=2){r.st='idle';r.pose=null;}else return;}
 if(now<r.next)return;
 // Auslöser
 if(r.st==='idle'&&r.nat!=='aggro'&&fast&&dist<=3){r.st='flee';r.stT=now+2400;r.expr='verletzt';emote(r,'!');}
 else if(r.st==='idle'&&r.nat==='shy'&&dist<=4&&tileAt(cur,r.x,r.y)==='"'){r.st='hide';r.stT=now+9000;r.pose='hide';r.expr='muede';emote(r,'?');return;}
 else if(r.st==='idle'&&r.nat==='aggro'&&dist<=4&&now>(r.chT||0)&&G.team.some(m=>m.hp>0)&&mode==='world'){r.st='charge';r.stT=now+2200;r.chT=now+9000;r.expr='wuetend';emote(r,'!');r.dir=dirTo(P.x-r.x,P.y-r.y);r.next=now+450;return;}
 if(r.st==='flee'){const away=['up','down','left','right'].map(d=>[d,Math.abs(r.x+DIRV[d][0]-P.x)+Math.abs(r.y+DIRV[d][1]-P.y)]).sort((a,b)=>b[1]-a[1]);
  for(const[d,dd]of away)if(dd>=dist&&roamStep(r,d,230,true))break;r.next=now+30;return;}
 if(r.st==='charge'){const dx=P.x-r.x,dy=P.y-r.y,d1=dirTo(dx,dy),d2=Math.abs(dx)>Math.abs(dy)?(dy>0?'down':'up'):(dx>0?'right':'left');if(!roamStep(r,d1,210,true)&&(dx&&dy))roamStep(r,d2,210,true);r.next=now+40;return;}
 // ruhig: umherstreifen, grasen, schnüffeln, neugierig nähern
 r.next=now+700+Math.random()*1900;const q=Math.random();
 if(q<.22){r.st='graze';r.pose='graze';r.stT=now+1600+Math.random()*1800;return;}if(q<.34){r.st='sniff';r.pose='sniff';r.stT=now+1200+Math.random()*1000;return;}
 let d=r.nat==='neutral'&&dist<=3&&Math.random()<.25&&G.team.length?dirTo(P.x-r.x,P.y-r.y):['up','down','left','right'][Math.random()*4|0];
 if(r.nat==='shy'){const c=['up','down','left','right'].filter(k=>tileAt(cur,r.x+DIRV[k][0],r.y+DIRV[k][1])==='"');if(c.length&&Math.random()<.7)d=c[Math.random()*c.length|0];}
 roamStep(r,d,420,false);}
// ---------- Begleiter: folgt dem Pfad der Spielfigur ----------
function compMon(){if(!G||!G.team)return null;/* Schwimmen/Gleiten: Begleiter = die Kreatur, die es kann (17-move carrierMon) */const c=typeof carrierMon==='function'?carrierMon():null;return c||G.team.find(x=>x.hp>0)||null;}
function compReset(){const m=compMon();if(!m){COMP=null;return;}const[dx,dy]=DIRV[P.dir];let x=P.x-dx,y=P.y-dy;if(blocked(x,y)){x=P.x;y=P.y;}
 COMP={s:m.s,x,y,px:x,py:y,fx:x,fy:y,t:1,dir:P.dir,ang:YAW?YAW[P.dir]:0,trail:[[x,y],[P.px,P.py]],idle:0,expr:"neutral",mv:false,stormT:0,petT:-1e9};}
function compFollow(x,y){/* Signatur bleibt; der Pfad wird in compTick aus P.px/P.py aufgezeichnet */}
function compExpr(m){const f=m.friendship??70;if(m.hp<stat(m,'hp')*.3)return'verletzt';return f>=160?'freudig':f<40?'muede':'neutral';}
// Reaktionen: heal | storm | shiny | pet (andere Module rufen compReact)
function compReact(kind){if(!COMP)return;const R={heal:['freudig','heart',1],storm:['verletzt','drop',0],shiny:['freudig','!',1],pet:['freudig','heart',1]}[kind]||['freudig','note',1];
 COMP.react={k:kind,t:performance.now(),e:R[0],hop:R[2]};emote(COMP,R[1]);COMP.pose=null;COMP.idle=0;if(kind!=='storm'&&typeof playCry==='function')playCry(COMP.s);}
function compTap(){if(!COMP)return;const m=compMon(),now=performance.now();compReact('pet');if(m&&now-COMP.petT>60000){COMP.petT=now;m.friendship=Math.min(255,(m.friendship??70)+1);}
 const f=m?(m.friendship??70):70,n=m?(m.nickname||MONS[m.s].n):'';toast(f>=160?n+' strahlt dich an!':f<40?n+' schaut dich skeptisch an.':n+' freut sich.');}
function compTick(dt,now){const C=COMP,T=C.trail,l=T[T.length-1];
 if(!l||Math.hypot(l[0]-P.px,l[1]-P.py)>.06)T.push([P.px,P.py]);if(T.length>80)T.splice(0,T.length-80);
 if(Math.hypot(C.px-P.px,C.py-P.py)>4){compReset();return;}
 // Zielpunkt: ~1,05 Felder Pfadlänge hinter der Spielfigur
 let need=1.05,tx=T[0][0],ty=T[0][1];for(let i=T.length-1;i>0;i--){const a=T[i],b=T[i-1],sl=Math.hypot(a[0]-b[0],a[1]-b[1]);if(sl>=need){const k=need/sl;tx=a[0]+(b[0]-a[0])*k;ty=a[1]+(b[1]-a[1])*k;break;}need-=sl;if(i===1){tx=b[0];ty=b[1];}}
 // 3D: seitlich versetzt, damit der Begleiter nicht zwischen Kamera und Spielfigur steht
 if(typeof view!=='undefined'&&view!=='2d'){const an=P.ang??(YAW[P.dir]||0),fx=-Math.sin(an),fy=-Math.cos(an),ox=tx-fy*.62+fx*.25,oy=ty+fx*.62+fy*.25;if(!blocked(Math.round(ox),Math.round(oy))){tx=ox;ty=oy;}}
 const dx=tx-C.px,dy=ty-C.py,d=Math.hypot(dx,dy),vmax=(P.run?5.2:3.4)*dt/1000;if(d>.03){const k=Math.min(1,vmax/d,.25+d);C.px+=dx*k;C.py+=dy*k;C.mv=d>.06;C.ang=Math.atan2(-dx,-dy);C.dir=dirTo(dx,dy);}else C.mv=false;
 C.x=Math.round(C.px);C.y=Math.round(C.py);
 // Leerlauf: schnüffeln/grasen, später hinlegen
 const pm=P.moving||P.walk;if(C.mv||pm){C.idle=0;if(C.pose)C.pose=null;}else C.idle+=dt;
 if(!C.mv&&!pm){if(C.idle>22000)C.pose='sleep';else if(C.idle>3500&&now>(C.pT||0)){C.pT=now+2500+Math.random()*4000;C.pose=C.pose?null:Math.random()<.5?'sniff':'graze';}
  if(C.idle>2000&&!C.pose&&now>(C.lookT||0)){C.lookT=now+3000;C.ang=Math.atan2(-(P.px-C.px),-(P.py-C.py));}}
 const m=compMon();if(m)C.expr=compExpr(m);
 if(G.weather&&G.weather[cur.id]==='gewitter'&&now>C.stormT){C.stormT=now+18000;compReact('storm');}}
// A-Taste vor dem Begleiter: Antippen statt Leerlauf (03 lädt vorher)
const _interact=interact;interact=function(){if(COMP&&COMP.s&&mode==='world'){const[dx,dy]=DIRV[P.dir],tx=P.x+dx,ty=P.y+dy;
 if(COMP.x===tx&&COMP.y===ty&&!npcAt(tx,ty)&&!roamAt(tx,ty)&&!villAt(tx,ty))return compTap();}return _interact();};
// Heilung → Begleiter freut sich
const _healAll=healAll;healAll=function(){_healAll();compReact('heal');};
function roamTick(dt){if(!cur||!G)return;if(ROAM.map!==cur.id){spawnRoam();compReset();}villTick(dt);const now=performance.now();
 const lead=compMon();if(COMP&&lead)COMP.s=lead.s;else if(!COMP&&lead)compReset();else if(COMP&&!lead)COMP=null;
 if(COMP)compTick(dt,now);
 if(ROAM.list.length<ROAM.want&&now>ROAM.next){addRoamer();ROAM.next=now+5000;}
 for(const r of ROAM.list){const de=Math.hypot(r.px-P.px,r.py-P.py);
  if(!r.seen&&de<5.5&&mode==='world'){r.seen=1;if(r.st!=='sleep'&&now>ROAM.cryT&&typeof playCry==='function'){ROAM.cryT=now+2600;playCry(r.s);}}
  if(r.t<1){r.t=Math.min(1,r.t+dt/(r.dur||420));r.px=r.fx+(r.x-r.fx)*r.t;r.py=r.fy+(r.y-r.fy)*r.t;
   if(r.t>=1&&mode==='world'&&!P.moving&&r.st!=='flee'&&r.st!=='hide'&&(r.st==='charge'||r.nat!=='shy')&&Math.abs(r.x-P.x)+Math.abs(r.y-P.y)===1){toast('Wildes '+MONS[r.s].n+' greift an!');return startWild(r);}continue;}
  roamThink(r,now);}}
// 2D-Overlay: Zzz, Emotes, Grasdeckung beim Verstecken, Glanzfunkeln (Weltkoordinaten)
function roamFx2D(c){if(!G||!cur)return;if(typeof encFx2d==='function')try{encFx2d(c);}catch(e){}const t=performance.now(),list=ROAM.list.concat(COMP&&COMP.s?[COMP]:[]);c.save();c.textAlign='center';c.textBaseline='middle';
 for(const r of list){const x=r.px*TS+8,y=r.py*TS;
  if(r.pose==='hide'){const col=(PAL[cur.theme]||PAL.default).tg;c.strokeStyle=col;c.lineWidth=1.6;c.lineCap='round';for(let i=0;i<7;i++){const bx=x-7+i*2.3,sw=Math.sin(t/500+i)*1.2;c.beginPath();c.moveTo(bx,y+14);c.quadraticCurveTo(bx+sw,y+6,bx+sw*1.6,y+1+(i%2)*2);c.stroke();}}
  if(r.pose==='sleep'){c.font='900 7px sans-serif';for(let i=0;i<2;i++){const k=((t/1600+i*.5)%1);c.globalAlpha=Math.min(1,k*4)*(1-k);c.lineWidth=2;c.strokeStyle='#2a3a6a';c.strokeText('z',x+4+k*6,y-6-k*9);c.fillStyle='#fff';c.fillText('z',x+4+k*6,y-6-k*9);}c.globalAlpha=1;}
  if(r.emo&&t-r.emo.t<1300){const k=(t-r.emo.t)/1300,s=Math.min(1,k*6),by=y-14-k*3;c.globalAlpha=k>.8?(1-k)*5:1;c.fillStyle='#fff';c.strokeStyle='#28324a';c.lineWidth=1;c.beginPath();c.arc(x,by,5.5*s,0,7);c.fill();c.stroke();
   const C={'!':'#e2554d','?':'#3d6fd6',drop:'#3d9be0',heart:'#ff5f8a',note:'#2fa86a'}[r.emo.k];c.fillStyle=C;c.font='900 '+(8*s|0)+'px sans-serif';
   c.fillText(r.emo.k==='heart'?'♥':r.emo.k==='drop'?'•':r.emo.k==='note'?'♪':r.emo.k,x,by+.5);c.globalAlpha=1;}
  if(r.shiny||r.sparkT&&t-r.sparkT<1500){for(let i=0;i<3;i++){const a=t/700+i*2.1,k=.5+.5*Math.sin(t/180+i*1.7);c.fillStyle=`rgba(255,240,170,${k})`;const sx=x+Math.cos(a)*8,sy=y+2+Math.sin(a)*5;c.beginPath();c.moveTo(sx,sy-2.2*k);c.lineTo(sx+.7,sy);c.lineTo(sx,sy+2.2*k);c.lineTo(sx-.7,sy);c.fill();}}}
 c.restore();}
const _fieldFx2D=fieldFx2D;fieldFx2D=function(c){_fieldFx2D(c);roamFx2D(c);};
// ---------- Stadtbewohner ----------
const TOWNS={morgenau:3,kupferhain:4,brisenhafen:4,frostheim:3,schattmoor:3,siegesstrasse:2};
const VCOL=['#c96b5a','#5a8ac9','#7ab86a','#d9a05a','#a07ac9','#e0c04a','#5ab0a0'];
const VILL={map:null,list:[]};
function villAt(x,y){return VILL.list.find(v=>v.x===x&&v.y===y);}
function spawnVill(){VILL.list=[];VILL.map=cur.id;const n=TOWNS[cur.id]||0,T=[];for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++)if(cur.rows[y][x]===',')T.push([x,y]);
 for(let i=0;i<n&&T.length;i++)for(let k=0;k<20;k++){const[x,y]=T[Math.random()*T.length|0];if(blocked(x,y)||(x===P.x&&y===P.y))continue;
  VILL.list.push({x,y,px:x,py:y,fx:x,fy:y,t:1,dir:'down',c:VCOL[(i*3+cur.id.length)%VCOL.length],next:performance.now()+Math.random()*3000});break;}}
function villLine(){const nt=isNight(),L=nt?['So spät noch unterwegs? Nachts zeigen sich ganz andere Kreaturen.','Schau mal nach oben, heute leuchten die Sterne besonders hell.','Nachts höre ich manchmal leises Flügelschlagen über den Dächern.','In der Kreaturenstation brennt die ganze Nacht Licht.']
 :['Was für ein Tag! Die Kreaturen im Gras sind heute richtig munter.','Warst du schon in der Arena? Man sagt, die Leitung dort ist unglaublich stark.','Im Laden gibt es Kapseln. Ich nehme immer ein paar mehr mit.','Wenn deine Kreaturen müde sind, geh in die Kreaturenstation. Das kostet nichts.','Mein Flausch weckt mich jeden Morgen pünktlich bei Sonnenaufgang.'];
 const th={snow:'Brrr, ohne dicke Jacke hält man es hier nicht lange aus.',beach:'Die Brise vom Meer riecht heute nach Salz und Abenteuer.',swamp:'Im Moor sollte man nie vom Weg abkommen.'}[cur.theme];if(th)L.push(th,th);
 if(G.badges.length)L.push('Ist das ein '+G.badges[G.badges.length-1]+'? Respekt!');if(COMP&&COMP.s)L.push('Dein '+MONS[COMP.s].n+' läuft dir ja treu hinterher!');
 return L[Math.random()*L.length|0];}
function villTick(dt){if(VILL.map!==cur.id)spawnVill();const now=performance.now();
 for(const v of VILL.list){if(v.t<1){v.t=Math.min(1,v.t+dt/650);v.px=v.fx+(v.x-v.fx)*v.t;v.py=v.fy+(v.y-v.fy)*v.t;continue;}
  if(now<v.next)continue;v.next=now+1500+Math.random()*3500;const d=['up','down','left','right'][Math.random()*4|0];v.dir=d;if(Math.random()<.35)continue;
  const[mx,my]=DIRV[d],nx=v.x+mx,ny=v.y+my,t=tileAt(cur,nx,ny);
  if((t===','||t==='.'||t==='F')&&!blocked(nx,ny)&&!roamAt(nx,ny)&&!(Math.abs(nx-P.px)<.9&&Math.abs(ny-P.py)<.9)&&!(COMP&&nx===COMP.x&&ny===COMP.y)){v.fx=v.x;v.fy=v.y;v.x=nx;v.y=ny;v.t=0;}}}
