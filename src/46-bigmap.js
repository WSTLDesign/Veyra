// ===== VEYRA – Große Karte (Agent „Karte“, Opus hoch; docs/bigmap.md) =====
// Zoom-Kette: Karte (aktuelle Karte groß, Figuren, Türen, Ziel) → Region (alle Karten als zusammenhängender Atlas nach MAPS-Verbindungen) → Veyra (Weltbild map_veyra).
// Öffnen: Tipp auf die Minikarte oder Taste M. Schließen: X, Escape, M, Tipp außerhalb. Spiel pausiert (mode 'menu'), Musik läuft weiter.
// Leistung: Grundbild je Ebene einmal in Canvas 2D gezeichnet (CSS-Transform für Zoom/Ziehen), nur die Marker-Ebene wird je Frame neu gezeichnet. Keine 3D-Aufrufe.
const BM={open:false,lvl:'here',prev:'world',el:null,v:{s:1,x:0,y:0},L:{},anim:null,ptr:new Map(),pinch:null,drag:null,tap:null,lastTap:null,hits:[],ping:null,raf:0,leg:false,card:null,wheelT:0,sw:0,sh:0,lock:0};
const BM_ICOL={talk:'#3d7fe0',trainer:'#f29a17',shop:'#159f8a',heal:'#ef4a3f',medal:'#e2a90f',medal0:'#9aa3b2',crown:'#7d52e8',door:'#5c6880',item:'#f6b915',grass:'#36a04a',water:'#2a84f0',glide:'#5b8def',climb:'#a0703a',quest:'#b04fd8',goal:'#ff6a2b',wild:'#ff8a3d',fast:'#d81b72',cave:'#6b5a8a'};
const BM_REGC={lichtlande:'#e0a91a',smaragdwald:'#2fa65a',flutkueste:'#2a84f0',glutlande:'#f0612a',kristallgebirge:'#8f63d6',frosttundra:'#38b9d8',himmelsweiten:'#7b95f5',schattenmoor:'#7a46c8'};
const BM_REGN={lichtlande:'Lichtlande',smaragdwald:'Smaragdwald',flutkueste:'Flutküste',glutlande:'Glutlande',kristallgebirge:'Kristallgebirge',frosttundra:'Frosttundra',himmelsweiten:'Himmelsweiten',schattenmoor:'Schattenmoor'};
// Weltbild (800×534): Orte und Regionsschilder (überdecken die gemalten Schilder; Frosttundra ergänzt)
const BM_WPOS={morgenau:[372,306],route1:[282,276],kupferhain:[196,214],route2:[160,300],nebelgrotte:[306,140],brisenhafen:[256,352],windkueste:[372,400],moewenbucht:[524,352],
 route3:[372,206],frostheim:[450,52],glutschlucht:[214,130],route4:[528,128],schattmoor:[620,214],siegesstrasse:[448,170],fluestertal:[716,170]};
const BM_WREG={glutlande:[156,97,[150,110,160,95]],kristallgebirge:[390,84,[430,100,120,80]],himmelsweiten:[670,78,[660,75,150,75]],smaragdwald:[135,262,[125,255,130,105]],
 lichtlande:[404,248,[405,225,100,80]],schattenmoor:[697,254,[700,245,105,110]],flutkueste:[414,359,[420,440,250,95]],frosttundra:[522,24,[420,38,110,38]]};
const bmR=()=>{try{return(typeof RED!=='undefined'&&RED)||matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
const bmMix=(a,b,t)=>typeof PALETTE!=='undefined'?PALETTE.mix(a,b,t):a;
const bmHash=(x,y)=>(((x*73856093)^(y*19349663))>>>0)%1000/1000;
function bmPal(m){const b=PAL[m.theme]||(typeof TH3A!=='undefined'&&PAL[TH3A[m.theme]])||PAL.default,a=typeof PALETTE!=='undefined'&&PALETTE.themeAccent&&PALETTE.themeAccent[m.theme];return a?Object.assign({},b,a):b;}
const BM_REGC0={};function bmReg(id){if(BM_REGC0[id])return BM_REGC0[id];let r='lichtlande';try{if(typeof skyRegion==='function')r=skyRegion(Object.assign({id},MAPS[id]||(INTERIORS[id]?{theme:'inside'}:{})));}catch(e){}return BM_REGC0[id]=r;}
function bmTop(){return cur.inside?(G.ret&&G.ret.map)||'morgenau':cur.id;}
function bmVisited(id){return!!(G.visited&&G.visited[id]);}
function bmHops(from,to){if(from===to)return 0;const seen={[from]:0},q=[from];while(q.length){const c=q.shift();for(const l of(typeof mapLinks==='function'?mapLinks(c):[])){if(l.to in seen)continue;seen[l.to]=seen[c]+1;if(l.to===to)return seen[l.to];q.push(l.to);}}return null;}
function bmDist(id){const n=bmHops(cur.id,id);return n===0||id===bmTop()&&cur.inside?'Du bist hier':n==null?'':n===1?'1 Karte entfernt':n+' Karten entfernt';}
function bmFigName(n,soft){if(!n)return'';if(n.name)return n.name;const FG=typeof FIGURES!=='undefined'?FIGURES:{},F=FG[n.fig]||FG[n.hook];if(F&&F.n)return F.n;const t=[].concat(n.txt||[])[0];const m=typeof t==='string'&&t.match(/^([^:\n]{2,30}):/);if(m)return m[1];
 const h=String(n.hook||'').split('_')[0].replace(/\d+$/,'');if(h&&!/^(hafen|wache|item|orden)$/.test(h))return h[0].toUpperCase()+h.slice(1);return soft?'':'Bewohner';}
function bmMedal(n){const M=typeof MEDALS!=='undefined'&&n&&MEDALS.find(x=>x[1]===n.flag);if(!M)return null;const F=typeof FIGURES!=='undefined'&&n.fig&&FIGURES[n.fig],hall=F&&F.ort?(F.ort.split(' · ')[1]||F.ort):'Medaillen-Halle';
 return{name:M[0],el:M[2],hall,who:bmFigName(n),got:!!(G.flags[n.flag]||(G.badges||[]).includes(M[0]))};}
function bmShopNpc(n){return n.t==='shop'||/^(borwin|tilda|nyx)$/.test(n.hook||'')||/Händler/.test(n.name||'');}
function bmHidden(n){try{return!!npcHidden(n);}catch(e){return false;}}
function bmFindTile(m,ch){for(let y=0;y<m.h;y++){const x=m.rows[y].indexOf(ch);if(x>=0)return{x,y};}return null;}
function bmDoorPos(parent,inner){const m=getMap(parent);for(const k in m.doors||{})if(m.doors[k]===inner){const p=bmFindTile(m,k);if(p)return p;}return null;}
function bmParent(id){if(MAPS[id])return id;for(const p in MAPS)if(Object.values(MAPS[p].doors||{}).includes(id))return p;return null;}
// Kartenpunkt (map,x,y) → Außenkarte + Feld (Innenräume → Tür der Außenkarte)
function bmOuter(map,x,y){if(MAPS[map])return{map,x,y};const p=bmParent(map);if(!p)return null;const d=bmDoorPos(p,map);return d?{map:p,x:d.x,y:d.y}:null;}
function bmSideOpen(){const L=[];if(typeof SQ==='undefined')return L;for(const q of SQ){if(G.flags[q.f])continue;const R=(typeof SIDEQUESTS!=='undefined'&&(SIDEQUESTS.find(s=>s.f===q.f)||{}).req)||q.req;
 if(R&&R.flag&&!G.flags[R.flag])continue;if(R&&R.badges&&(G.badges||[]).length<R.badges)continue;let T=null;try{T=q.t&&q.t();}catch(e){}if(T&&T.map)L.push({q,T});}return L;}
function bmQuest(){const q=QUESTS.find(q=>!G.flags[q.f])||(typeof sideNow==='function'?sideNow():null);let gp=null,T=null;try{gp=typeof guidePoint==='function'?guidePoint():GP;}catch(e){gp=GP;}try{T=questTarget();}catch(e){}return{q,gp,T};}

// ---------- Kartendaten der aktuellen Karte ----------
function bmExits(m){const raw=MAPS[m.id]||{},out=[];for(const d of'nsew'){const to=raw[d];if(typeof to!=='string'||!MAPS[to])continue;const T=[],hz=d==='n'||d==='s';
  if(hz){const y=d==='n'?0:m.h-1;for(let x=0;x<m.w;x++)if(!SOLID.has(m.rows[y][x]))T.push(x);}else{const x=d==='w'?0:m.w-1;for(let y=0;y<m.h;y++)if(!SOLID.has(m.rows[y][x]))T.push(y);}
  const c=T.length?T.reduce((a,b)=>a+b,0)/T.length:(hz?m.w:m.h)/2-.5,g=raw.gate&&raw.gate[d];
  out.push({d,to,x:d==='w'?0:d==='e'?m.w-1:c,y:d==='n'?0:d==='s'?m.h-1:c,lock:!!(g&&g.f&&!G.flags[g.f]),name:MAPS[to].name});}return out;}
function bmDoors(m){const out=[];for(const k in m.doors||{}){const id=m.doors[k],p=bmFindTile(m,k);if(!p)continue;const I=INTERIORS[id];let kind='door',l=I?I.name:(MAPS[id]&&MAPS[id].name)||id,med=null;
  if(id==='@out'){kind='exit';l='Ausgang';}else if(I&&I.k==='heal'){kind='heal';l='Kreaturenstation';}else if(I&&I.k==='shop')kind='shop';else if(I&&I.k==='liga'){kind='crown';l=T_('elite');}
  else if(I&&I.k==='arena'){const n=(NPCS[id]||[]).find(n=>bmMedal(n));med=n&&bmMedal(n);kind=med&&med.got?'medal':'medal0';if(med)l=med.hall;}else if(MAPS[id])kind='cave';
  out.push({x:p.x,y:p.y,id,kind,l,med});}
 if(m.inside){const e=bmFindTile(m,'E');if(e)out.push({x:e.x,y:e.y,kind:'exit',l:'Ausgang · '+((G.ret&&MAPS[G.ret.map]&&MAPS[G.ret.map].name)||'draußen')});}return out;}
function bmSpots(m){// Gras-/Wasser-/Gleit-/Kletterstellen als Cluster-Mittelpunkte
 const seen=new Set(),out=[],F=G.flags,outdoor=!m.inside&&m.theme!=='cave';
 const cls=t=>t==='"'||t===':'?'grass':t==='~'?'water':t==='R'?'rock':t==='X'&&outdoor?'wall':null;
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const k=cls(m.rows[y][x]);if(!k||seen.has(x+','+y))continue;const q=[[x,y]],T=[];seen.add(x+','+y);
  while(q.length){const[a,b]=q.pop();T.push([a,b]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy,kk=nx+','+ny;if(seen.has(kk)||cls(tileAt(m,nx,ny))!==k)continue;seen.add(kk);q.push([nx,ny]);}}
  const walkN=([a,b])=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const t=tileAt(m,a+dx,b+dy);return t&&!SOLID.has(t)&&t!=='X';});
  let P2=T;if(k==='wall'){P2=T.filter(walkN);if(P2.length<3||P2.length>T.length*.8&&T.length<4)continue;}if(k==='rock'&&T.length<2)continue;if((k==='grass'||k==='water')&&T.length<4)continue;
  if(k==='wall'&&T.every(([a,b])=>a===0||b===0||a===m.w-1||b===m.h-1))continue;
  const cx=P2.reduce((s,p)=>s+p[0],0)/P2.length,cy=P2.reduce((s,p)=>s+p[1],0)/P2.length;let best=P2[0],bd=1e9;for(const p of P2){const d=(p[0]-cx)**2+(p[1]-cy)**2;if(d<bd){bd=d;best=p;}}
  const kind=k==='grass'?'grass':k==='water'?'water':k==='rock'?'glide':'climb';
  out.push({x:best[0],y:best[1],kind,n:T.length,on:kind==='grass'?!!m.enc:kind==='water'?!!F.swim:kind==='glide'?!!F.glide:!!F.climb});}
 const lim={grass:3,water:2,glide:2,climb:2},keep=[];for(const k in lim)keep.push(...out.filter(o=>o.kind===k).sort((a,b)=>b.n-a.n).slice(0,lim[k]));return keep;}
function bmHerePOI(){const m=cur,L=[],Q=bmQuest();
 for(const e of bmExits(m))L.push({x:e.x,y:e.y,kind:'exit',d:e.d,lock:e.lock,l:e.name,sub:(e.lock?'Noch gesperrt · ':'')+({n:'Nach Norden',s:'Nach Süden',w:'Nach Westen',e:'Nach Osten'}[e.d]),to:e.to,label:1});
 for(const d of bmDoors(m))L.push(Object.assign({label:1,sub:d.kind==='heal'?'Hier werden deine Kreaturen wieder gesund':d.kind==='shop'?'Hier kannst du einkaufen':d.med?(d.med.who+' · Medaille: '+(d.med.got?'erhalten':'noch offen')):d.kind==='crown'?T_('champTitle')+' '+T_('champ')+' wartet oben':'Tür'},d));
 for(const n of npcs()){let kind=null,l=bmFigName(n),sub='';
  if(/^(item|scroll|hidden|sparkle)$/.test(n.t)){if(G.flags[n.flag])continue;kind='item';l='Etwas Glitzerndes';sub='Geh hin und schau nach';}
  else if(n.t==='trainer'){if(G.flags[n.flag])continue;const md=bmMedal(n);kind=md?'medal0':'trainer';sub=md?md.hall+' · Medaille: noch offen':'Herausforderer – will kämpfen';}
  else if(n.t==='nurse'){kind='heal';sub='Heilt deine Kreaturen';}else if(bmShopNpc(n)){kind='shop';sub='Händler';}
  else if(n.t==='talk'){kind='talk';sub='Sprich mit '+(/^(Mama|Oma)/.test(l)?'ihr':'dieser Figur');}else if(n.t==='starter'){if(G.flags.starter)continue;kind='item';l='Fangkapsel';sub='Hier wartet dein erster Partner';}
  if(kind)L.push({x:n.x,y:n.y,kind,l,sub,npc:n});}
 for(const s of bmSpots(m))L.push(Object.assign({l:{grass:'Hohes Gras',water:'Wasser',glide:'Felskante',climb:'Felswand'}[s.kind],
  sub:{grass:'Hier leben wilde Kreaturen',water:s.on?'Schwimm mit deinem Partner':'Schwimmen lernst du mit der Flutmedaille',glide:s.on?'Lauf hinaus und gleite!':'Gleiten lernst du später',climb:s.on?'Drück gegen die Wand zum Klettern':'Klettern lernst du später'}[s.kind]},s));
 try{for(const r of ROAM.list)L.push({x:r.px??r.x,y:r.py??r.y,kind:'wild',l:'Wilde Kreatur',sub:MONS[r.s]&&G.dex.seen[r.s]?MONS[r.s].n:'Noch unbekannt',small:1});}catch(e){}
 for(const{q,T}of bmSideOpen()){if(T.map!==m.id||Q.q&&Q.q.f===q.f)continue;L.push({x:T.x,y:T.y,kind:'quest',l:'Nebenmission',sub:q.title+' · '+T.l});}
 if(Q.gp){const gx=Math.max(0,Math.min(m.w-1,Q.gp.x)),gy=Math.max(0,Math.min(m.h-1,Q.gp.y));L.push({x:gx,y:gy,kind:'goal',l:'Ziel',sub:(Q.q?Q.q.title+' · ':'')+Q.gp.l,goal:1});}
 L.push({x:P.px,y:P.py,kind:'me',l:G.name||'Du',sub:'Das bist du'});return L;}
// „Hier kannst du …“: 2–5 kurze Vorschläge aus den Kartendaten
function bmSuggest(){const m=cur,L=[],POI=BM.L.here?BM.L.here.poi:bmHerePOI(),Q=bmQuest(),near=k=>{let b=null,bd=1e9;for(const p of POI)if(p.kind===k||(Array.isArray(k)&&k.includes(p.kind))){const d=Math.hypot(p.x-P.px,p.y-P.py);if(d<bd){bd=d;b=p;}}return b;};
 const add=(t,p,ic)=>{if(L.length<5&&t&&!L.some(o=>o.t===t))L.push({t,p,ic});};
 if(Q.gp){const g=POI.find(p=>p.goal);add('Zum Ziel: '+(Q.gp.here?Q.gp.l:Q.gp.l.split(' · ')[0]),g,'goal');}
 const md=POI.find(p=>p.kind==='medal0');if(md)add('Medaille holen: '+md.l,md,'medal0');
 const tk=POI.filter(p=>p.kind==='talk'&&p.npc&&(p.npc.hook||p.npc.prof)&&bmFigName(p.npc,1)).sort((a,b)=>Math.hypot(a.x-P.px,a.y-P.py)-Math.hypot(b.x-P.px,b.y-P.py))[0];if(tk)add('Mit '+tk.l+' sprechen',tk,'talk');
 const sq=near('quest');if(sq)add('Nebenmission: '+sq.sub.split(' · ')[0],sq,'quest');
 const gr=POI.find(p=>p.kind==='grass'&&p.on);if(gr&&G.team.length)add('Wilde Kreaturen im Gras finden',near('grass'),'grass');
 const hurt=G.team.some(t=>t.hp<stat(t,'hp'));const hl=near('heal');if(hl)add(hurt?'Kreaturen heilen lassen':'Zur Kreaturenstation',hl,'heal');
 const sh=near('shop');if(sh)add(m.inside?'Einkaufen':sh.npc?'Bei '+sh.l+' einkaufen':'Einkaufen: '+sh.l,sh,'shop');
 const it=near('item');if(it)add('Glitzersachen einsammeln',it,'item');
 const tr=near('trainer');if(tr)add('Gegen '+tr.l+' kämpfen',tr,'trainer');
 const sw=POI.find(p=>p.kind==='water'&&p.on);if(sw)add('Im Wasser schwimmen',sw,'water');
 const gl=POI.find(p=>p.kind==='glide'&&p.on);if(gl)add('Von der Felskante gleiten',gl,'glide');
 const cl=POI.find(p=>p.kind==='climb'&&p.on);if(cl)add('An der Felswand klettern',cl,'climb');
 const ex=POI.filter(p=>p.kind==='exit'&&!p.lock);for(const e of ex)add(m.inside?'Nach draußen gehen':({n:'Nach Norden',s:'Nach Süden',w:'Nach Westen',e:'Nach Osten'}[e.d]||'Weiter')+': '+e.l,e,'exit');
 if(L.length<2)add('Die Gegend erkunden',{x:P.px,y:P.py},'me');return L;}

// ---------- Weiches Kartenbild (Canvas 2D) ----------
function bmBlob(c,m,test,ts,r,col){c.fillStyle=col;c.beginPath();const R=r*ts;for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){if(!test(m.rows[y][x]))continue;const cx=(x+.5)*ts,cy=(y+.5)*ts;c.moveTo(cx+R,cy);c.arc(cx,cy,R,0,7);
  const rt=x+1<m.w&&test(m.rows[y][x+1]),dn=y+1<m.h&&test(m.rows[y+1][x]);if(rt)c.rect(cx,cy-R,ts,2*R);if(dn)c.rect(cx-R,cy,2*R,ts);if(rt&&dn&&test(m.rows[y+1][x+1]))c.rect(cx,cy,ts,ts);}c.fill();}
function bmRenderMap(c,m,ts,o){o=o||{};const p=bmPal(m),W=m.w*ts,H=m.h*ts,fine=ts>=9,isB=t=>BUILD.includes(t),isD=t=>/[0-9]/.test(t),edgeT=(x,y)=>tileAt(m,x,y);
 c.save();c.fillStyle=m.inside?bmMix(p.g,'#8a6f5a',.15):p.g;c.fillRect(0,0,W,H);
 if(fine&&!m.inside)for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(t!=='.'&&t!=='c')continue;const h=bmHash(x,y);c.fillStyle=h<.5?p.g2:bmMix(p.g,'#ffffff',.12);
  for(let k=0;k<3;k++){const a=bmHash(x*7+k,y*3+k),b=bmHash(y*5+k,x*11+k);c.globalAlpha=.55;c.beginPath();c.arc((x+a)*ts,(y+b)*ts,Math.min(3.4,ts*.07+ts*.05*h),0,7);c.fill();}c.globalAlpha=1;}
 if(m.inside){c.strokeStyle='rgba(90,60,40,.12)';c.lineWidth=Math.max(1,ts*.04);for(let y=1;y<m.h;y++){c.beginPath();c.moveTo(0,y*ts);c.lineTo(W,y*ts);c.stroke();}}
 // Wasser mit hellem Ufer
 const wat=t=>t==='~'||t==='Q'||t==='=';bmBlob(c,m,wat,ts,.66,bmMix(p.w2,'#ffffff',.35));bmBlob(c,m,wat,ts,.54,p.w);
 if(fine){c.strokeStyle=bmMix(p.w2,'#ffffff',.3);c.lineWidth=Math.max(1,ts*.06);c.lineCap='round';for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='~'&&bmHash(x,y)<.45){const cx=(x+.5)*ts,cy=(y+.5)*ts;c.beginPath();c.arc(cx,cy+ts*.12,ts*.2,Math.PI*1.15,Math.PI*1.85);c.stroke();}}
 bmBlob(c,m,t=>t==='I',ts,.56,'#dff4ff');
 // Wege
 const path=t=>t===','||t==='E'||isD(t)&&!o.noDoorPath;bmBlob(c,m,path,ts,.5,bmMix(p.p,'#000000',.1));bmBlob(c,m,path,ts,.42,p.p);
 // Höhlenboden dunkel / hohes Gras
 bmBlob(c,m,t=>t==='"'||t===':',ts,.55,bmMix(p.tg,'#000000',.12));bmBlob(c,m,t=>t==='"'||t===':',ts,.47,p.tg);
 if(fine){c.strokeStyle=bmMix(p.tg,'#ffffff',.28);c.lineWidth=Math.max(1,ts*.07);c.lineCap='round';for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(t!=='"'&&t!==':')continue;const cx=(x+.3+bmHash(x,y)*.4)*ts,cy=(y+.62)*ts;
  c.beginPath();c.moveTo(cx-ts*.16,cy-ts*.24);c.lineTo(cx-ts*.04,cy);c.lineTo(cx+.02*ts,cy-ts*.32);c.lineTo(cx+ts*.08,cy);c.lineTo(cx+ts*.2,cy-ts*.22);c.stroke();}}
 // Blumen
 const FC=[p.f,'#ff8fb0','#ffd84a','#ffffff'];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='F')for(let k=0;k<(fine?4:2);k++){c.fillStyle=FC[(x+y+k)%4];c.beginPath();c.arc((x+.2+bmHash(x+k,y)*.6)*ts,(y+.2+bmHash(y+k,x)*.6)*ts,Math.max(1,ts*.1),0,7);c.fill();}
 // Brücken
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='='){c.fillStyle='#b88a58';c.fillRect(x*ts,(y+.12)*ts,ts+.5,ts*.76);if(fine){c.fillStyle='#8f6640';for(let k=1;k<4;k++)c.fillRect((x+k/4)*ts-ts*.02,(y+.12)*ts,ts*.04,ts*.76);}}
 // Felskanten (Gleitstellen) und Wände
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.rows[y][x]==='R'){const X=x*ts,Y=y*ts;c.fillStyle=bmMix(p.r,'#000000',.25);c.beginPath();c.roundRect(X+ts*.04,Y+ts*.16,ts*.92,ts*.82,ts*.22);c.fill();c.fillStyle=p.r;c.beginPath();c.roundRect(X+ts*.04,Y+ts*.04,ts*.92,ts*.74,ts*.22);c.fill();
  if(fine){c.fillStyle=bmMix(p.r,'#ffffff',.28);c.beginPath();c.roundRect(X+ts*.16,Y+ts*.12,ts*.5,ts*.16,ts*.08);c.fill();}}
 const wall=t=>t==='X';bmBlob(c,m,wall,ts,.6,m.theme==='cave'?p.tr2:bmMix(p.r,'#2a2420',.45));bmBlob(c,m,wall,ts,.46,m.theme==='cave'?bmMix(p.tr2,p.r,.35):bmMix(p.r,'#2a2420',.2));
 if(m.inside){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x],X=x*ts,Y=y*ts;if(t==='W'){c.fillStyle='#8a6f5a';c.fillRect(X,Y,ts+.5,ts+.5);if(tileAt(m,x,y+1)&&tileAt(m,x,y+1)!=='W'){c.fillStyle='#a5866c';c.fillRect(X,Y+ts*.7,ts+.5,ts*.3);}}
  else if(t==='B'){c.fillStyle='#7a5434';c.beginPath();c.roundRect(X+ts*.08,Y+ts*.08,ts*.84,ts*.84,ts*.12);c.fill();c.fillStyle='#d8b27a';c.fillRect(X+ts*.18,Y+ts*.3,ts*.64,ts*.1);c.fillRect(X+ts*.18,Y+ts*.6,ts*.64,ts*.1);}
  else if(t==='K'){c.fillStyle='#c89a64';c.beginPath();c.roundRect(X+ts*.06,Y+ts*.14,ts*.88,ts*.72,ts*.16);c.fill();}
  else if(t==='C'){c.fillStyle='#efe8da';c.beginPath();c.roundRect(X,Y+ts*.12,ts+.5,ts*.76,ts*.1);c.fill();c.fillStyle=BM_ICOL.heal;c.fillRect(X,Y+ts*.7,ts+.5,ts*.12);}
  else if(t==='E'){c.fillStyle='#d8c19c';c.beginPath();c.roundRect(X+ts*.1,Y+ts*.2,ts*.8,ts*.6,ts*.15);c.fill();}}}
 // Gebäude: zusammenhängende Dachflächen + Türen
 const seen=new Set();for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(!isB(t)||seen.has(x+','+y))continue;const q=[[x,y]],T=[];seen.add(x+','+y);
  while(q.length){const[a,b]=q.pop();T.push([a,b]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy,k=nx+','+ny,tt=edgeT(nx,ny);if(seen.has(k)||!tt||!(tt===t||isD(tt)))continue;seen.add(k);q.push([nx,ny]);}}
  const xs=T.map(v=>v[0]),ys=T.map(v=>v[1]),x0=Math.min(...xs),x1=Math.max(...xs)+1,y0=Math.min(...ys),y1=Math.max(...ys)+1,X=x0*ts+ts*.06,Y=y0*ts+ts*.04,w=(x1-x0)*ts-ts*.12,h=(y1-y0)*ts-ts*.08,rf=ROOF[t]||'#a0583a';
  c.fillStyle='rgba(20,24,30,.22)';c.beginPath();c.roundRect(X+ts*.14,Y+ts*.24,w,h,ts*.3);c.fill();
  c.fillStyle='#f3ead8';c.beginPath();c.roundRect(X,Y,w,h,ts*.3);c.fill();
  const g=c.createLinearGradient(0,Y,0,Y+h*.7);g.addColorStop(0,bmMix(rf,'#ffffff',.22));g.addColorStop(1,rf);c.fillStyle=g;c.beginPath();c.roundRect(X,Y,w,h*.68,[ts*.3,ts*.3,ts*.12,ts*.12]);c.fill();
  c.strokeStyle=bmMix(rf,'#000000',.25);c.lineWidth=Math.max(1,ts*.07);c.beginPath();c.moveTo(X+ts*.3,Y+h*.3);c.lineTo(X+w-ts*.3,Y+h*.3);c.stroke();
  if(fine){c.fillStyle='rgba(255,236,170,.9)';for(let k=0;k<Math.floor(w/ts);k++){const wx=X+ts*(.35+k),wy=Y+h*.76;if(wx+ts*.3>X+w)break;c.beginPath();c.roundRect(wx,wy,ts*.28,ts*.2,ts*.05);c.fill();}}
  for(const[a,b]of T)if(isD(m.rows[b][a])){c.fillStyle='#5c3a24';c.beginPath();c.roundRect((a+.24)*ts,(b+.3)*ts,ts*.52,ts*.66,[ts*.24,ts*.24,ts*.04,ts*.04]);c.fill();}}
 // Höhleneingänge (Tür ohne Gebäude)
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x];if(!isD(t)||[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isB(edgeT(x+dx,y+dy)||'')))continue;
  c.fillStyle='#1d1620';c.beginPath();c.roundRect((x+.14)*ts,(y+.18)*ts,ts*.72,ts*.8,[ts*.36,ts*.36,ts*.06,ts*.06]);c.fill();}
 // Feld-Hindernisse
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const t=m.rows[y][x],cx=(x+.5)*ts,cy=(y+.5)*ts;if(t==='D'){c.fillStyle='#24461f';for(let k=0;k<5;k++){c.beginPath();c.arc(cx+Math.cos(k*1.3)*ts*.22,cy+Math.sin(k*1.3)*ts*.22,ts*.2,0,7);c.fill();}c.fillStyle='#d94a4a';c.beginPath();c.arc(cx+ts*.1,cy-ts*.08,ts*.06,0,7);c.fill();}
  else if(t==='G'){c.fillStyle='#9a8a70';for(let k=0;k<3;k++){c.beginPath();c.arc(cx+(k-1)*ts*.24,cy+(k%2)*ts*.12,ts*.2,0,7);c.fill();}}}
 // Bäume
 const snow=m.theme==='snow',tc=p.tr,hi=snow?'#f4f9fc':bmMix(p.tr,'#fff6c8',.3);for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){if(m.rows[y][x]!=='T')continue;const j=fine?(bmHash(x,y)-.5)*ts*.12:0,cx=(x+.5)*ts+j,cy=(y+.5)*ts-j;
  c.fillStyle='rgba(10,20,10,.2)';c.beginPath();c.arc(cx+ts*.1,cy+ts*.18,ts*.56,0,7);c.fill();}
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){if(m.rows[y][x]!=='T')continue;const j=fine?(bmHash(x,y)-.5)*ts*.12:0,cx=(x+.5)*ts+j,cy=(y+.5)*ts-j;
  if(fine){const g=c.createRadialGradient(cx-ts*.2,cy-ts*.24,ts*.04,cx,cy,ts*.6);g.addColorStop(0,hi);g.addColorStop(.55,tc);g.addColorStop(1,bmMix(tc,'#000000',.18));c.fillStyle=g;}else c.fillStyle=tc;c.beginPath();c.arc(cx,cy,ts*.56,0,7);c.fill();}
 // Licht von oben links + leichte Nacht-Tönung
 const lg=c.createLinearGradient(0,0,W,H);lg.addColorStop(0,'rgba(255,248,226,.16)');lg.addColorStop(1,'rgba(20,30,60,.12)');c.fillStyle=lg;c.fillRect(0,0,W,H);
 if(o.night&&!m.inside){c.globalCompositeOperation='multiply';c.fillStyle='#b7bfe6';c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';}
 if(o.fog){c.globalCompositeOperation='saturation';c.fillStyle='#808080';c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';c.fillStyle='rgba(232,236,243,.62)';c.fillRect(0,0,W,H);}
 c.restore();}

// ---------- Atlas (Region): alle Karten zusammenhängend nach Verbindungen ----------
let BM_ATLAS=null;
function bmAtlas(){if(BM_ATLAS)return BM_ATLAS;const P={},GAP=3,ids=Object.keys(MAPS),dim=id=>[MAPS[id].rows[0].length,MAPS[id].rows.length];
 const hit=(x,y,w,h)=>Object.values(P).some(o=>x<o.x+o.w+GAP-.01&&x+w+GAP>o.x+.01&&y<o.y+o.h+GAP-.01&&y+h+GAP>o.y+.01);
 const D={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]},q=['morgenau'];{const[w,h]=dim('morgenau');P.morgenau={x:0,y:0,w,h};}
 const put=(id,x,y,d)=>{const[w,h]=dim(id);let g=0;while(hit(x,y,w,h)&&g++<40){x+=D[d][0]*4;y+=D[d][1]*4;}P[id]={x,y,w,h};q.push(id);};
 while(q.length){const id=q.shift(),a=P[id],m=MAPS[id];for(const d of'nsew'){const to=m[d];if(typeof to!=='string'||!MAPS[to]||P[to])continue;const[w,h]=dim(to);
   put(to,d==='e'?a.x+a.w+GAP:d==='w'?a.x-GAP-w:a.x+a.w/2-w/2,d==='s'?a.y+a.h+GAP:d==='n'?a.y-GAP-h:a.y+a.h/2-h/2,d);}
  for(const k in m.doors||{}){const to=m.doors[k];if(!MAPS[to]||P[to])continue;const dp=bmFindTile(getMap(id),k)||{x:a.w/2},[w]=dim(to);put(to,a.x+dp.x-w/2,a.y-GAP-dim(to)[1],'n');}}
 let i=0;for(const id of ids)if(!P[id]){const[w,h]=dim(id);let mx=-1e9;for(const o of Object.values(P))mx=Math.max(mx,o.y+o.h);put(id,i*(w+GAP),mx+GAP,'e');i++;}
 const xs=Object.values(P),x0=Math.min(...xs.map(o=>o.x))-3,y0=Math.min(...xs.map(o=>o.y))-4;for(const o of xs){o.x-=x0;o.y-=y0;}
 return BM_ATLAS={P,w:Math.max(...xs.map(o=>o.x+o.w))+3,h:Math.max(...xs.map(o=>o.y+o.h))+3};}
function bmAtlasLinks(){const A=bmAtlas(),L=[];for(const id in A.P){const a=A.P[id],m=MAPS[id];
  for(const d of'ne'){const to=m[d];if(typeof to!=='string'||!A.P[to])continue;const b=A.P[to],ea=bmExits(getMap(id)).find(e=>e.d===d),bd={n:'s',e:'w'}[d],eb=bmExits(getMap(to)).find(e=>e.d===bd);
   const pa=ea?[a.x+ea.x+.5,a.y+ea.y+.5]:[a.x+a.w/2,a.y+a.h/2],pb=eb?[b.x+eb.x+.5,b.y+eb.y+.5]:[b.x+b.w/2,b.y+b.h/2];L.push({a:id,b:to,pa,pb});}
  for(const k in m.doors||{}){const to=m.doors[k];if(!MAPS[to]||!A.P[to])continue;const dp=bmFindTile(getMap(id),k),b=A.P[to],e=bmFindTile(getMap(to),Object.keys(MAPS[to].doors||{}).find(kk=>MAPS[to].doors[kk]==='@out')||'E');
   L.push({a:id,b:to,pa:[a.x+dp.x+.5,a.y+dp.y+.5],pb:e?[b.x+e.x+.5,b.y+e.y+.5]:[b.x+b.w/2,b.y+b.h],cave:1});}}return L;}
function bmAtlasPOI(){const A=bmAtlas(),L=[],ft=typeof canFastTravel==='function'&&canFastTravel(),heal=typeof healSpots==='function'?healSpots():[],Q=bmQuest(),top=bmTop();
 for(const id in A.P){const a=A.P[id],m=getMap(id),vis=bmVisited(id),reg=bmReg(id);
  L.push({x:a.x+a.w/2-.5,y:a.y-1.1,kind:'name',l:MAPS[id].name,map:id,vis,reg,label:1});
  for(const d of bmDoors(m)){if(!['heal','shop','medal','medal0','crown'].includes(d.kind))continue;const sp=d.kind==='heal'&&heal.find(s=>s.town===id);
   L.push({x:a.x+d.x,y:a.y+d.y,kind:d.kind==='heal'&&sp&&ft&&vis?'fast':d.kind,l:d.kind==='heal'?'Kreaturenstation':d.l,med:d.med,map:id,vis,fast:sp&&ft&&vis&&!(top===id&&!cur.inside)?sp:null,
    sub:d.kind==='crown'?T_('champTitle')+' '+T_('champ'):d.med?d.med.who:''});}
  const seenM=new Set();for(const n of NPCS[id]||[]){const md=n.t==='trainer'&&bmMedal(n);if(md){if(seenM.has(n.flag))continue;seenM.add(n.flag);L.push({x:a.x+n.x,y:a.y+n.y,kind:md.got?'medal':'medal0',l:md.hall,med:md,map:id,vis,sub:md.who});continue;}// Medaillen-Hallen immer zeigen
   if(bmHidden(n))continue;if(bmShopNpc(n))L.push({x:a.x+n.x,y:a.y+n.y,kind:'shop',l:bmFigName(n),map:id,vis,sub:'Händler'});}}
 for(const{q,T}of bmSideOpen()){if(Q.q&&Q.q.f===q.f)continue;const o=bmOuter(T.map,T.x,T.y);if(!o||!A.P[o.map])continue;L.push({x:A.P[o.map].x+o.x,y:A.P[o.map].y+o.y,kind:'quest',l:q.title,sub:'Nebenmission · '+T.l,map:o.map,vis:bmVisited(o.map)});}
 if(Q.T){const o=bmOuter(Q.T.map,Q.T.x,Q.T.y);if(o&&A.P[o.map])L.push({x:A.P[o.map].x+o.x,y:A.P[o.map].y+o.y,kind:'goal',l:'Ziel',sub:(Q.q?Q.q.title+' · ':'')+(Q.T.l||''),map:o.map,goal:1,vis:1});}
 const me=cur.inside?(G.ret?{x:G.ret.x,y:G.ret.y}:null):{x:P.px,y:P.py};if(me&&A.P[top])L.push({x:A.P[top].x+me.x,y:A.P[top].y+me.y,kind:'me',l:'Du bist hier',map:top});
 return L;}
function bmWorldPOI(){const L=[],ft=typeof canFastTravel==='function'&&canFastTravel(),heal=typeof healSpots==='function'?healSpots():[],Q=bmQuest(),top=bmTop(),tgt=Q.T&&bmParent(Q.T.map);
 for(const id in BM_WPOS){if(!MAPS[id])continue;const[x,y]=BM_WPOS[id],vis=bmVisited(id),town=!!(typeof TOWNS!=='undefined'&&TOWNS[id])||id==='siegesstrasse',m=getMap(id);
  const meds=bmMapMedals(id);
  const crown=bmDoors(m).some(d=>d.kind==='crown'),sp=heal.find(s=>s.town===id);
  L.push({x,y,kind:'place',l:MAPS[id].name,map:id,vis,town,meds,crown,heal:!!sp,fast:sp&&ft&&vis&&!(top===id&&!cur.inside)?sp:null,reg:bmReg(id),label:town||id===top});}
 if(tgt&&BM_WPOS[tgt])L.push({x:BM_WPOS[tgt][0],y:BM_WPOS[tgt][1],kind:'goal',l:'Ziel',sub:(Q.q?Q.q.title+' · ':'')+(Q.T.l||''),map:tgt,goal:1});
 if(BM_WPOS[top])L.push({x:BM_WPOS[top][0],y:BM_WPOS[top][1],kind:'me',l:'Du bist hier',map:top});return L;}

// ---------- Symbole ----------
function bmGlyph(c,k,r){c.fillStyle='#fff';c.strokeStyle='#fff';c.lineWidth=r*.16;c.lineJoin='round';c.lineCap='round';c.beginPath();
 if(k==='talk'){c.roundRect(-r*.52,-r*.42,r*1.04,r*.72,r*.26);c.moveTo(-r*.18,r*.26);c.lineTo(-r*.34,r*.56);c.lineTo(r*.08,r*.28);c.fill();}
 else if(k==='trainer'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,R=i%2?r*.26:r*.6;c.lineTo(Math.cos(a)*R,Math.sin(a)*R+r*.04);}c.closePath();c.fill();}
 else if(k==='shop'){c.roundRect(-r*.44,-r*.16,r*.88,r*.66,r*.14);c.fill();c.beginPath();c.lineWidth=r*.13;c.arc(0,-r*.16,r*.24,Math.PI,0);c.stroke();}
 else if(k==='heal'||k==='fast'){c.moveTo(0,r*.5);c.bezierCurveTo(-r*.75,0,-r*.42,-r*.62,0,-r*.24);c.bezierCurveTo(r*.42,-r*.62,r*.75,0,0,r*.5);c.fill();}
 else if(k==='medal'||k==='medal0'){c.moveTo(-r*.3,-r*.62);c.lineTo(-r*.08,-r*.1);c.lineTo(r*.08,-r*.1);c.lineTo(r*.3,-r*.62);c.closePath();c.fill();c.beginPath();c.arc(0,r*.16,r*.34,0,7);c.fill();
  c.fillStyle=k==='medal'?BM_ICOL.medal:BM_ICOL.medal0;c.beginPath();c.arc(0,r*.16,r*.17,0,7);c.fill();}
 else if(k==='crown'){c.moveTo(-r*.5,r*.34);c.lineTo(-r*.5,-r*.3);c.lineTo(-r*.22,0);c.lineTo(0,-r*.46);c.lineTo(r*.22,0);c.lineTo(r*.5,-r*.3);c.lineTo(r*.5,r*.34);c.closePath();c.fill();}
 else if(k==='door'||k==='cave'){c.roundRect(-r*.34,-r*.48,r*.68,r*.94,[r*.34,r*.34,r*.06,r*.06]);c.fill();c.fillStyle=BM_ICOL[k];c.beginPath();c.arc(r*.14,r*.04,r*.07,0,7);c.fill();}
 else if(k==='item'){for(let i=0;i<8;i++){const a=i*Math.PI/4,R=i%2?r*.2:r*.62;c.lineTo(Math.cos(a)*R,Math.sin(a)*R);}c.closePath();c.fill();}
 else if(k==='grass'){c.lineWidth=r*.15;c.moveTo(-r*.44,r*.36);c.lineTo(-r*.26,-r*.3);c.lineTo(-r*.06,r*.36);c.lineTo(r*.08,-r*.5);c.lineTo(r*.22,r*.36);c.lineTo(r*.44,-r*.2);c.stroke();}
 else if(k==='water'){c.lineWidth=r*.15;for(const yy of[-r*.2,r*.18]){c.moveTo(-r*.5,yy);c.quadraticCurveTo(-r*.25,yy-r*.22,0,yy);c.quadraticCurveTo(r*.25,yy+r*.22,r*.5,yy);}c.stroke();}
 else if(k==='glide'){c.moveTo(-r*.56,r*.14);c.quadraticCurveTo(-r*.1,-r*.56,r*.56,-r*.3);c.quadraticCurveTo(r*.1,-r*.1,r*.16,r*.34);c.quadraticCurveTo(-r*.1,r*.02,-r*.56,r*.14);c.fill();}
 else if(k==='climb'){c.moveTo(-r*.56,r*.42);c.lineTo(-r*.12,-r*.42);c.lineTo(r*.12,0);c.lineTo(r*.26,-r*.22);c.lineTo(r*.56,r*.42);c.closePath();c.fill();}
 else if(k==='quest'){c.lineWidth=r*.15;c.moveTo(-r*.3,r*.52);c.lineTo(-r*.3,-r*.5);c.stroke();c.beginPath();c.moveTo(-r*.3,-r*.5);c.lineTo(r*.48,-r*.3);c.lineTo(-r*.3,-r*.06);c.fill();}
 else if(k==='wild'){c.arc(0,r*.18,r*.3,0,7);for(const[a,b]of[[-.42,-.22],[-.15,-.5],[.15,-.5],[.42,-.22]]){c.moveTo(a*r+r*.13,b*r);c.arc(a*r,b*r,r*.13,0,7);}c.fill();}
 else if(k==='exit'){c.lineWidth=r*.2;c.moveTo(-r*.32,r*.2);c.lineTo(0,-r*.2);c.lineTo(r*.32,r*.2);c.stroke();}}
function bmIcon(c,k,x,y,r,o){o=o||{};c.save();c.translate(x,y);const col=o.col||BM_ICOL[k]||'#5c6880';
 if(k==='goal'){const s=r*1.15;c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(0,s*.1,s*.5,s*.18,0,0,7);c.fill();c.translate(0,-s*.95);c.fillStyle=col;c.strokeStyle='#fff';c.lineWidth=Math.max(2,s*.14);
  c.beginPath();c.moveTo(0,s*1);c.bezierCurveTo(-s*.25,s*.55,-s*.78,s*.2,-s*.78,-s*.2);c.arc(0,-s*.2,s*.78,Math.PI,0);c.bezierCurveTo(s*.78,s*.2,s*.25,s*.55,0,s*1);c.closePath();c.stroke();c.fill();
  c.translate(0,-s*.2);bmGlyph(c,'quest',s*.72);c.restore();return;}
 c.shadowColor='rgba(16,24,40,.35)';c.shadowBlur=r*.5;c.shadowOffsetY=r*.12;c.fillStyle='#fff';c.beginPath();c.arc(0,0,r,0,7);c.fill();c.shadowColor='transparent';
 c.fillStyle=col;c.beginPath();c.arc(0,0,r-Math.max(2,r*.16),0,7);c.fill();if(o.dim){c.fillStyle='rgba(255,255,255,.45)';c.fill();}
 if(k==='fast'){c.strokeStyle='#fff';c.lineWidth=r*.1;c.setLineDash([r*.2,r*.16]);c.beginPath();c.arc(0,0,r*.66,0,7);c.stroke();c.setLineDash([]);}
 c.rotate(o.rot||0);bmGlyph(c,k,(r-Math.max(2,r*.16))*1.05);c.restore();}
function bmPill(c,x,y,t,o){o=o||{};const fs=o.fs||13;c.save();c.font=`${o.w||700} ${fs}px 'Nunito Sans',system-ui,sans-serif`;const tw=c.measureText(t).width,pad=fs*.62,h=fs*1.75,w=tw+pad*2+(o.dot?fs*.9:0);
 let X=x-w/2,Y=y-h/2;if(o.clamp){X=Math.max(o.clamp[0]+4,Math.min(o.clamp[2]-w-4,X));Y=Math.max(o.clamp[1]+4,Math.min(o.clamp[3]-h-4,Y));}
 c.shadowColor='rgba(16,24,40,.28)';c.shadowBlur=8;c.shadowOffsetY=2;c.fillStyle=o.bg||'rgba(255,255,255,.92)';c.beginPath();c.roundRect(X,Y,w,h,h/2);c.fill();c.shadowColor='transparent';
 if(o.dot){c.fillStyle=o.dot;c.beginPath();c.arc(X+pad+fs*.3,Y+h/2,fs*.3,0,7);c.fill();}c.fillStyle=o.ink||'#16202c';c.textBaseline='middle';c.textAlign='left';c.fillText(t,X+pad+(o.dot?fs*.9:0),Y+h/2+.5);c.restore();return{x:X,y:Y,w,h};}

// ---------- Ebenen (Grundbild einmal zeichnen) ----------
function bmStage(){return BM.el.querySelector('.bmStage');}
function bmLayer(l){if(BM.L[l])return BM.L[l];const st=bmStage(),W=st.clientWidth,H=st.clientHeight,pad=Math.max(14,Math.min(W,H)*.05),dpr=Math.min(2,devicePixelRatio||1),cap=Math.max(W,H)*dpr>2600?3600:2600;let L;
 if(l==='here'){const m=cur,fit=Math.min((W-pad*2)/m.w,(H-pad*2)/m.h);L={cw:m.w,ch:m.h,fit,poi:bmHerePOI()};const R=Math.min(cap/(m.w*fit),cap/(m.h*fit),dpr*2.5);
  L.cv=bmCanvas(m.w*fit*R,m.h*fit*R);const c=L.cv.getContext('2d');bmRenderMap(c,m,fit*R,{night:isNight()});L.R=R;}
 else if(l==='region'){const A=bmAtlas(),fit=Math.min((W-pad)/A.w,(H-pad)/A.h);L={cw:A.w,ch:A.h,fit,poi:bmAtlasPOI()};const ts=Math.min(cap/A.w,cap/A.h,fit*dpr*4,26);
  L.cv=bmCanvas(A.w*ts,A.h*ts);const c=L.cv.getContext('2d');c.lineCap='round';
  for(const k of bmAtlasLinks()){const v=bmVisited(k.a)&&bmVisited(k.b);c.strokeStyle=v?'rgba(255,255,255,.85)':'rgba(255,255,255,.35)';c.lineWidth=ts*(k.cave?.45:.9);c.setLineDash(k.cave||!v?[ts*.6,ts*.7]:[]);
   c.beginPath();c.moveTo(k.pa[0]*ts,k.pa[1]*ts);c.lineTo(k.pb[0]*ts,k.pb[1]*ts);c.stroke();c.setLineDash([]);}
  for(const id in A.P){const a=A.P[id],m=getMap(id),vis=bmVisited(id);c.save();c.translate(a.x*ts,a.y*ts);c.shadowColor='rgba(10,20,40,.35)';c.shadowBlur=ts*1.4;c.shadowOffsetY=ts*.4;c.fillStyle='#fff';
   c.beginPath();c.roundRect(-ts*.3,-ts*.3,m.w*ts+ts*.6,m.h*ts+ts*.6,ts*1.1);c.fill();c.shadowColor='transparent';c.beginPath();c.roundRect(0,0,m.w*ts,m.h*ts,ts*.9);c.clip();
   bmRenderMap(c,m,ts,{fog:!vis,noDoorPath:0});c.restore();
   c.strokeStyle=vis?BM_REGC[bmReg(id)]||'#fff':'rgba(160,168,182,.9)';c.lineWidth=ts*.3;c.beginPath();c.roundRect(a.x*ts-ts*.15,a.y*ts-ts*.15,m.w*ts+ts*.3,m.h*ts+ts*.3,ts*1);c.stroke();}
  L.ts=ts;L.R=ts/fit;}
 else{const img=bmWorldImg(),fit=Math.min((W-pad*.6)/800,(H-pad*.6)/534);L={cw:800,ch:534,fit,poi:bmWorldPOI(),img:!!img};const R=Math.min(cap/800,cap/534,fit*dpr*1.5);
  L.cv=bmCanvas(800*R,534*R);const c=L.cv.getContext('2d');c.scale(R,R);bmRenderWorld(c,img);L.R=R;}
 L.cv.className='bmBase';L.cv.setAttribute('aria-hidden','true');return BM.L[l]=L;}
function bmCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(2,Math.round(w));c.height=Math.max(2,Math.round(h));return c;}
const BM_WIMG={img:null,ok:false};
function bmWorldImg(){if(BM_WIMG.ok)return BM_WIMG.img;const src=window.ART_SRC&&window.ART_SRC.map_veyra;if(!src)return null;if(!BM_WIMG.img){const im=new Image();im.decoding='async';im.onload=()=>{BM_WIMG.ok=true;if(BM.open&&BM.lvl==='world'){delete BM.L.world;bmSetLevel('world',{keep:1});}};im.src=src;BM_WIMG.img=im;}
 return BM_WIMG.img.complete&&BM_WIMG.img.naturalWidth?(BM_WIMG.ok=true,BM_WIMG.img):null;}
function bmRenderWorld(c,img){if(img){c.drawImage(img,0,0,800,534);}else{// schematische Regionskarte (ohne Bild)
  const g=c.createLinearGradient(0,0,0,534);g.addColorStop(0,'#2f6fa8');g.addColorStop(1,'#1d4f86');c.fillStyle=g;c.fillRect(0,0,800,534);
  for(const r in BM_WREG){const e=BM_WREG[r][2];c.fillStyle=bmMix(BM_REGC[r],'#ffffff',.35);c.beginPath();c.ellipse(e[0],e[1],e[2]*.9,e[3]*.9,0,0,7);c.fill();}
  c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=3;c.setLineDash([6,8]);for(const id in BM_WPOS){const m=MAPS[id];if(!m)continue;for(const d of'ne'){const to=m[d];if(typeof to==='string'&&BM_WPOS[to]){c.beginPath();c.moveTo(...BM_WPOS[id]);c.lineTo(...BM_WPOS[to]);c.stroke();}}}c.setLineDash([]);}
 // Nebel über Regionen ohne besuchte Karte
 const seenR={};for(const id in MAPS)if(bmVisited(id))seenR[bmReg(id)]=1;
 const fogR=Object.keys(BM_WREG).filter(r=>!seenR[r]);if(fogR.length){const F=bmCanvas(800,534),f=F.getContext('2d');f.drawImage(c.canvas,0,0,c.canvas.width,c.canvas.height,0,0,800,534);
  f.globalCompositeOperation='saturation';f.fillStyle='#808080';f.fillRect(0,0,800,534);f.globalCompositeOperation='source-over';f.fillStyle='rgba(230,235,243,.5)';f.fillRect(0,0,800,534);
  const M=bmCanvas(800,534),mm=M.getContext('2d');for(const r of fogR){const e=BM_WREG[r][2];mm.save();mm.translate(e[0],e[1]);mm.scale(e[2]/100,e[3]/100);const g=mm.createRadialGradient(0,0,0,0,0,118);g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(.62,'rgba(0,0,0,.8)');g.addColorStop(1,'rgba(0,0,0,0)');mm.fillStyle=g;mm.beginPath();mm.arc(0,0,118,0,7);mm.fill();mm.restore();}
  f.globalCompositeOperation='destination-in';f.drawImage(M,0,0);c.drawImage(F,0,0,800,534);}
 for(const r in BM_WREG){const[x,y]=BM_WREG[r];bmRegPill(c,x,y,r,!!seenR[r]);}}
// Regionsschild (überdeckt das gemalte Schild: ≈ 124×32 px im Bild) mit Element-Symbol der Region
const BM_REGEL={lichtlande:'lumen',smaragdwald:'flora',flutkueste:'flut',glutlande:'glut',kristallgebirge:'fels',frosttundra:'frost',himmelsweiten:'boe',schattenmoor:'schatten'};
function bmRegPill(c,cx,cy,r,v){c.save();c.font="800 14px 'Nunito Sans',system-ui,sans-serif";const t=BM_REGN[r],w=Math.max(126,c.measureText(t).width+52),h=32,X=cx-w/2,Y=cy-h/2,col=v?BM_REGC[r]:'#9aa3b2';
 c.shadowColor='rgba(10,20,40,.4)';c.shadowBlur=8;c.shadowOffsetY=2;c.fillStyle=v?'rgba(255,252,244,.97)':'rgba(234,237,243,.96)';c.beginPath();c.roundRect(X,Y,w,h,h/2);c.fill();c.shadowColor='transparent';
 c.fillStyle=col;c.beginPath();c.arc(X+16,cy,13,0,7);c.fill();const E=typeof PALETTE!=='undefined'&&PALETTE.el[BM_REGEL[r]];if(E&&window.Path2D){c.save();c.translate(X+16-7.5,cy-7.5);c.scale(15/16,15/16);c.fillStyle='#fff';c.fill(new Path2D(E.sym));c.restore();}
 c.fillStyle=v?'#16202c':'#5c6880';c.textBaseline='middle';c.textAlign='left';c.fillText(t,X+36,cy+1);c.restore();}

// ---------- Ansicht (Transform) ----------
function bmStageRect(){const st=bmStage();return{W:st.clientWidth,H:st.clientHeight};}
function bmBase(L){const{W,H}=bmStageRect();return{ox:(W-L.cw*L.fit)/2,oy:(H-L.ch*L.fit)/2};}
function bmToScr(L,v,u,w){const b=bmBase(L);return[b.ox+v.x+u*L.fit*v.s,b.oy+v.y+w*L.fit*v.s];}
function bmToCon(L,v,X,Y){const b=bmBase(L);return[(X-b.ox-v.x)/(L.fit*v.s),(Y-b.oy-v.y)/(L.fit*v.s)];}
// Ansicht so wählen, dass Inhalts-Rechteck (u,w,uw,wh) auf das Bildschirm-Rechteck (X,Y,Wd,Hd) fällt
function bmMatch(L,r,S){const s=S.w/(r.w*L.fit),b=bmBase(L);return{s,x:S.x-b.ox-r.x*L.fit*s,y:S.y-b.oy-r.y*L.fit*s};}
function bmFrame(L,r,k){const{W,H}=bmStageRect(),s=Math.min(W*(k||.9)/(r.w*L.fit),H*(k||.9)/(r.h*L.fit));return bmMatch(L,r,{x:W/2-r.w*L.fit*s/2,y:H/2-r.h*L.fit*s/2,w:r.w*L.fit*s});}
function bmLim(l){return l==='here'?[.6,6]:l==='region'?[.6,14]:[1,4];}
function bmClampV(L,v){const[a,b]=bmLim(BM.lvl);v.s=Math.max(a,Math.min(b,v.s));const{W,H}=bmStageRect(),bb=bmBase(L),cw=L.cw*L.fit*v.s,ch=L.ch*L.fit*v.s,m=60;
 const x0=bb.ox+v.x,y0=bb.oy+v.y;if(x0>W-m)v.x-=x0-(W-m);if(x0+cw<m)v.x+=m-(x0+cw);if(y0>H-m)v.y-=y0-(H-m);if(y0+ch<m)v.y+=m-(y0+ch);return v;}
function bmDefault(l){const L=BM.L[l];if(l==='here'){const ts=L.fit;if(ts<22&&!cur.inside){const s=Math.min(3,24/ts);return bmFocusV(L,P.px+.5,P.py+.5,s);}return{s:1,x:0,y:0};}
 if(l==='region'){const A=bmAtlas(),ids=bmRegionSet(bmTop()).filter(id=>A.P[id]);const x0=Math.min(...ids.map(i=>A.P[i].x)),y0=Math.min(...ids.map(i=>A.P[i].y)),x1=Math.max(...ids.map(i=>A.P[i].x+A.P[i].w)),y1=Math.max(...ids.map(i=>A.P[i].y+A.P[i].h));
  const pd=6;const v=bmFrame(L,{x:x0-pd,y:y0-pd-1,w:x1-x0+pd*2,h:y1-y0+pd*2},.94);v.s=Math.max(1,Math.min(v.s,5));return v;}
 return{s:1,x:0,y:0};}
// Region der aktuellen Karte (zusammenhängend) + direkte Nachbarkarten als Rahmen
function bmNb(id){const m=MAPS[id],o=[];if(!m)return o;for(const d of'nsew')if(typeof m[d]==='string'&&MAPS[m[d]])o.push(m[d]);for(const k in m.doors||{})if(MAPS[m.doors[k]])o.push(m.doors[k]);for(const p in MAPS)if(Object.values(MAPS[p].doors||{}).includes(id))o.push(p);
 for(const p in MAPS)for(const d of'nsew')if(MAPS[p][d]===id)o.push(p);return[...new Set(o)];}
function bmRegionSet(top){const reg=bmReg(top),C=new Set([top]),q=[top];while(q.length){const id=q.shift();for(const n of bmNb(id))if(!C.has(n)&&bmReg(n)===reg){C.add(n);q.push(n);}}const out=new Set(C);for(const id of C)for(const n of bmNb(id))out.add(n);return[...out];}
function bmFocusV(L,u,w,s){const{W,H}=bmStageRect(),b=bmBase(L);return{s,x:W/2-b.ox-u*L.fit*s,y:H/2-b.oy-w*L.fit*s};}
function bmApply(){const L=BM.L[BM.lvl];if(!L)return;const v=BM.v,b=bmBase(L);L.cv.style.width=L.cw*L.fit+'px';L.cv.style.height=L.ch*L.fit+'px';L.cv.style.transform=`translate(${b.ox+v.x}px,${b.oy+v.y}px) scale(${v.s})`;BM.dirty=1;}
function bmAnimTo(to,ms,done){const fr=Object.assign({},BM.v);if(bmR()||!ms){BM.v=Object.assign({},to);bmApply();done&&done();return;}BM.anim={fr,to,t0:performance.now(),ms,done};}

// ---------- Ebenenwechsel (Zoom-Kette) ----------
function bmMapScreenRect(l,id){const L=BM.L[l];if(!L)return null;let r;if(l==='here')r={x:0,y:0,w:L.cw,h:L.ch};else if(l==='region'){const a=bmAtlas().P[id];if(!a)return null;r={x:a.x,y:a.y,w:a.w,h:a.h};}else return null;
 const p=bmToScr(L,BM.v,r.x,r.y);return{x:p[0],y:p[1],w:r.w*L.fit*BM.v.s,h:r.h*L.fit*BM.v.s};}
function bmSetLevel(l,o){o=o||{};const old=BM.lvl,oldL=BM.L[old];let from=null;
 if(!o.keep&&old!==l){if(old==='here'&&l==='region'&&!cur.inside)from={id:cur.id,S:bmMapScreenRect('here')};else if(old==='region'&&l==='here'&&!cur.inside)from={id:cur.id,S:bmMapScreenRect('region',cur.id)};}
 const L=bmLayer(l),st=bmStage();BM.lvl=l;BM.el.dataset.lvl=l;BM.card=null;bmCard(null);
 st.querySelectorAll('.bmBase').forEach(c=>{if(c!==L.cv){c.classList.add('out');setTimeout(()=>{if(c.classList.contains('out'))c.remove();},bmR()?0:320);}});
 if(L.cv.parentNode!==st){L.cv.classList.remove('out');st.insertBefore(L.cv,st.firstChild);}else L.cv.classList.remove('out');
 const target=o.view||bmDefault(l);let start=null;
 if(from&&from.S){if(l==='region'){const a=bmAtlas().P[from.id];start=bmMatch(L,{x:a.x,y:a.y,w:a.w,h:a.h},from.S);}else start=bmMatch(L,{x:0,y:0,w:L.cw,h:L.ch},from.S);}
 else if(!o.keep&&old!==l){const k=(['here','region','world'].indexOf(l)>['here','region','world'].indexOf(old))?1.7:.62,{W,H}=bmStageRect();start={s:target.s*k,x:target.x*k+(W/2)*(1-k)+bmBase(L).ox*(k-1),y:target.y*k+(H/2)*(1-k)+bmBase(L).oy*(k-1)};}
 if(start&&!bmR()){BM.v=start;bmApply();bmAnimTo(target,460);}else{BM.v=target;bmApply();}
 BM.lock=performance.now()+520;const sky=bmSky(l!=='here');BM.el.style.setProperty('--bm-top',sky[0]);BM.el.style.setProperty('--bm-hor',sky[1]);BM.el.dataset.time=sky[2];bmUi();}
function bmCheckLevel(){if(BM.anim||performance.now()<BM.lock)return;const v=BM.v,l=BM.lvl;
 if(l==='here'&&v.s<.82)return bmSetLevel('region');
 if(l==='region'){if(v.s<.8)return bmSetLevel('world');if(!cur.inside){const r=bmMapScreenRect('region',cur.id),{W,H}=bmStageRect();if(r&&(r.w>W*.86||r.h>H*.86)&&r.x<W/2&&r.x+r.w>W/2&&r.y<H/2&&r.y+r.h>H/2)return bmSetLevel('here');}}
 if(l==='world'&&v.s>2.3)return bmSetLevel('region');}
function bmZoom(f,X,Y){const L=BM.L[BM.lvl];if(!L)return;BM.anim=null;const{W,H}=bmStageRect();X=X??W/2;Y=Y??H/2;const v=BM.v,[u,w]=bmToCon(L,v,X,Y),[lo,hi]=bmLim(BM.lvl),s=Math.max(lo,Math.min(hi,v.s*f)),b=bmBase(L);
 BM.v={s,x:X-b.ox-u*L.fit*s,y:Y-b.oy-w*L.fit*s};bmClampV(L,BM.v);bmApply();}
function bmStep(dir){// Knöpfe: +/−, an der Grenze nächste Ebene
 const l=BM.lvl,[lo,hi]=bmLim(l);if(dir<0){if(l==='here'&&BM.v.s<=1.02)return bmSetLevel('region');if(l==='region'&&BM.v.s<=1.02)return bmSetLevel('world');if(l==='world')return;}
 else{if(l==='world'&&BM.v.s>=1.9)return bmSetLevel('region');if(l==='region'&&!cur.inside&&BM.v.s>=bmDefault('region').s*1.6)return bmSetLevel('here');}
 const fr=Object.assign({},BM.v);bmZoom(dir>0?1.45:1/1.45);const to=Object.assign({},BM.v);BM.v=fr;bmApply();bmAnimTo(to,220);}

// ---------- Marker-Ebene (je Frame) ----------
function bmFrameDraw(now){if(!BM.open)return;BM.raf=requestAnimationFrame(bmFrameDraw);const A=BM.anim;if(A){const k=Math.min(1,(now-A.t0)/A.ms),e=1-Math.pow(1-k,3);BM.v={s:A.fr.s+(A.to.s-A.fr.s)*e,x:A.fr.x+(A.to.x-A.fr.x)*e,y:A.fr.y+(A.to.y-A.fr.y)*e};bmApply();if(k>=1){BM.anim=null;A.done&&A.done();}}
 if(!BM.dirty&&bmR())return;BM.dirty=0;bmDrawMarks(now);}
function bmDrawMarks(now){const st=bmStage(),cv=BM.el.querySelector('.bmMk'),{W,H}=bmStageRect(),dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);const L=BM.L[BM.lvl];if(!L)return;const v=BM.v,S=(u,w)=>bmToScr(L,v,u,w),hits=BM.hits=[],t=bmR()?0:now/1000,cl=[0,0,W,H];
 const tsS=L.fit*v.s,r0=BM.lvl==='here'?Math.max(12,Math.min(19,tsS*.42)):BM.lvl==='region'?Math.max(10,Math.min(16,tsS*.7)):14,hit=(x,y,p,r)=>hits.push({x,y,r:Math.max(24,r),p});
 const order={wild:0,grass:1,water:1,glide:1,climb:1,item:2,talk:3,trainer:3,shop:3,heal:3,fast:3,door:3,cave:3,medal:4,medal0:4,crown:4,exit:5,quest:6,name:2,place:2,goal:8,me:9};
 const P2=L.poi.slice().sort((a,b)=>(order[a.kind]||0)-(order[b.kind]||0));
 if(BM.lvl==='here'){
  const occ=new Set();for(const p of P2){let[x,y]=S(p.x+.5,p.y+.5);if(x<-40||y<-40||x>W+40||y>H+40)continue;
   if(p.kind==='me'||p.kind==='goal')continue;const ok=Math.round(p.x)+','+Math.round(p.y);let off=0;if(p.kind==='quest'&&occ.has(ok)){x+=r0*.95;y-=r0*1.05;off=1;}occ.add(ok);
   if(p.kind==='exit'&&p.d){const off={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]}[p.d],rot={n:0,s:Math.PI,w:-Math.PI/2,e:Math.PI/2}[p.d],bob=Math.sin(t*3)*3;
    const ax=x+off[0]*(tsS*.35+bob),ay=y+off[1]*(tsS*.35+bob);bmIcon(c,'exit',ax,ay,r0,{rot,col:p.lock?'#9aa3b2':'#16202c'});
    const lx=x-off[0]*r0*2.1,ly=y-off[1]*r0*1.9+(p.d==='w'||p.d==='e'?r0*1.9:0);const b=bmPill(c,lx,ly,p.l+(p.lock?' (zu)':''),{fs:12.5,clamp:cl});hit(ax,ay,p,r0);hit(b.x+b.w/2,b.y+b.h/2,p,b.w/2);continue;}
   if(p.kind==='exit'){bmIcon(c,'door',x,y,r0,{col:'#16202c'});const b=bmPill(c,x,y+r0+12,p.l,{fs:12,clamp:cl});hit(x,y,p,r0);continue;}
   const small=p.small,r=(small?r0*.62:['grass','water','glide','climb'].includes(p.kind)?r0*.86:r0)*(off?.74:1),dim=('on'in p)&&!p.on;
   let yy=y;if(p.npc){yy=y-tsS*.15;}if(p.kind==='item'){const k=.85+.15*Math.sin(t*4+p.x);c.save();c.globalAlpha=.9;bmIcon(c,'item',x,yy,r*k);c.restore();}else bmIcon(c,p.kind,x,yy,r,{dim});
   hit(x,yy,p,r);if(p.label&&tsS*1>=11){const b=bmPill(c,x,yy+r+11,p.l,{fs:12,clamp:cl});}}
  // Begleiter
  try{if(COMP&&COMP.s){const[x,y]=S((COMP.px??COMP.x)+.5,(COMP.py??COMP.y)+.5),r=r0*.8;c.save();c.shadowColor='rgba(16,24,40,.3)';c.shadowBlur=6;c.fillStyle='#fff';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.shadowColor='transparent';
   c.beginPath();c.arc(x,y,r-2.5,0,7);c.clip();const ty=MONS[COMP.s].t[0];c.fillStyle=(typeof PALETTE!=='undefined'&&PALETTE.el[ty]&&PALETTE.el[ty].soft)||'#eef';c.fillRect(x-r,y-r,r*2,r*2);
   if(!(typeof drawArt==='function'&&drawArt(c,COMP.s,x-r*1.05,y-r*1.05,r*2.1,r*2.1,false))){c.fillStyle=(PALETTE.el[ty]||{}).c||'#999';c.beginPath();c.arc(x,y,r*.55,0,7);c.fill();}c.restore();
   hit(x,y,{kind:'comp',l:MONS[COMP.s].n,sub:'Dein Partner begleitet dich'},r);}}catch(e){}}
 else if(BM.lvl==='region'){const showSmall=tsS>=3.2;
  for(const p of P2){if(p.kind==='me'||p.kind==='goal')continue;const[x,y]=S(p.x+.5,p.y+.5);if(x<-60||y<-60||x>W+60||y>H+60)continue;
   if(p.kind==='name'){const b=bmPill(c,x,y,p.vis?p.l:p.l+' · ?',{fs:12.5,dot:p.vis?BM_REGC[p.reg]:'#a3abb8',bg:p.vis?'rgba(255,255,255,.94)':'rgba(236,239,244,.9)',ink:p.vis?'#16202c':'#5c6880'});hit(b.x+b.w/2,b.y+b.h/2,p,b.w/2);continue;}
   if(!showSmall&&!['medal','medal0','crown','fast','quest'].includes(p.kind))continue;const r=r0*(p.kind==='shop'?.8:1);bmIcon(c,p.kind,x,y,r,{dim:!p.vis&&p.kind!=='quest'});hit(x,y,p,r);}}
 else{const ms=Math.max(.6,Math.min(1.1,L.fit*v.s/1.5));for(const p of P2){if(p.kind==='me'||p.kind==='goal')continue;const[x,y]=S(p.x,p.y),r=(p.town?13:9)*ms*(p.vis?1:.8);
   c.save();c.shadowColor='rgba(10,20,40,.45)';c.shadowBlur=6;c.fillStyle='#fff';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.shadowColor='transparent';c.fillStyle=p.vis?BM_REGC[p.reg]:'#a3abb8';c.beginPath();c.arc(x,y,r-2.5,0,7);c.fill();
   if(!p.vis&&r>8){c.fillStyle='#fff';c.font=`800 ${r*1.1}px Fredoka,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('?',x,y+1);}c.restore();hit(x,y,p,r);
   const ir=11*ms;let ix=x+r+ir*.9;if(p.fast||p.heal&&p.vis){bmIcon(c,p.fast?'fast':'heal',ix,y-r,ir);hit(ix,y-r,p,ir);ix+=ir*2.1;}
   for(const md of p.meds){bmIcon(c,md.got?'medal':'medal0',ix,y-r,ir,{dim:!p.vis});ix+=ir*2.1;}if(p.crown){bmIcon(c,'crown',ix,y-r,ir,{dim:!p.vis});}
   if(p.vis&&(p.label&&ms>.72||v.s>1.5))bmPill(c,x,y+r+13*ms,p.l,{fs:Math.max(11,13*ms)});}}
 // Ziel und Spieler zuletzt (oben)
 for(const p of P2){if(p.kind!=='goal')continue;const[x,y]=BM.lvl==='world'?S(p.x,p.y):S(p.x+.5,p.y+.5),k=bmR()?0:(t*1.1)%1;c.save();c.strokeStyle='rgba(255,106,43,'+(.6*(1-k))+')';c.lineWidth=3;c.beginPath();c.arc(x,y,r0*(1+k*1.6),0,7);c.stroke();c.restore();
  const gx=Math.max(14,Math.min(W-14,x)),gy=Math.max(34,Math.min(H-6,y));bmIcon(c,'goal',gx,gy,r0*1.05);hit(gx,gy-r0,p,r0*1.3);}
 for(const p of P2){if(p.kind!=='me')continue;const[x,y]=BM.lvl==='world'?S(p.x,p.y):S(p.x+.5,p.y+.5),k=bmR()?.5:(t*.9)%1,r=BM.lvl==='world'?Math.max(9,Math.min(13,L.fit*v.s*8)):Math.max(11,r0*.95);
  c.save();c.fillStyle='rgba(216,27,114,'+(.32*(1-k))+')';c.beginPath();c.arc(x,y,r*(1.2+k*1.8),0,7);c.fill();c.shadowColor='rgba(16,24,40,.4)';c.shadowBlur=8;c.fillStyle='#fff';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.shadowColor='transparent';
  c.fillStyle='#d81b72';c.beginPath();c.arc(x,y,r-3,0,7);c.fill();const ang=BM.lvl==='here'?(view!=='2d'&&P.ang!=null?P.ang:YAW[P.dir]):null;
  if(ang!=null&&BM.lvl!=='world'){c.translate(x,y);c.rotate(-ang);c.fillStyle='#fff';c.beginPath();c.moveTo(0,-r*.62);c.lineTo(r*.46,r*.42);c.lineTo(0,r*.2);c.lineTo(-r*.46,r*.42);c.closePath();c.fill();c.setTransform(dpr,0,0,dpr,0,0);}
  else{c.fillStyle='#fff';c.beginPath();c.arc(x,y,r*.32,0,7);c.fill();}c.restore();bmPill(c,x,y-r-14,BM.lvl==='here'?(G.name||'Du'):'Du bist hier',{fs:12,bg:'#d81b72',ink:'#fff',clamp:cl});hit(x,y,p,r);}
 if(BM.ping){const pg=BM.ping,k=(now-pg.t0)/1400;if(k>1)BM.ping=null;else{const[x,y]=S(pg.x+.5,pg.y+.5);c.save();c.strokeStyle='rgba(216,27,114,'+(1-k)+')';c.lineWidth=4;for(const o of[0,.3]){const kk=Math.max(0,k-o);c.beginPath();c.arc(x,y,r0*(1+kk*3),0,7);c.stroke();}c.restore();BM.dirty=1;}}}

// ---------- Karte zum Antippen (Infokarte) ----------
function bmInfo(p){if(!p)return null;const o={t:p.l,lines:[],btn:null};
 if(BM.lvl==='here'){if(p.sub)o.lines.push(p.sub);if(p.kind==='exit'&&p.to)o.lines.push(MAPS[p.to]?(BM_REGN[bmReg(p.to)]||'')+(bmVisited(p.to)?'':' · noch nicht besucht'):'');if(p.kind==='me')o.lines.push(cur.name+' · '+(BM_REGN[bmReg(bmTop())]||''));if(p.goal)o.t='Dein Ziel';}
 else{const id=p.map;if(p.kind==='region'){o.t=p.l;o.lines.push('Diese Region hast du noch nicht besucht.');return o;}if(p.kind==='me'){o.t='Du bist hier';o.lines.push(cur.name+' · '+BM_REGN[bmReg(bmTop())]);return o;}if(p.goal){o.t='Dein Ziel';o.lines.push(p.sub);if(id)o.lines.push(bmDist(id));return o;}
  if(p.kind==='name'||p.kind==='place'){o.t=p.vis?MAPS[id].name:MAPS[id].name+' (noch nicht entdeckt)';}else if(p.sub&&p.kind!=='quest')o.t=p.l+' · '+p.sub;else if(p.kind==='quest'){o.t='Nebenmission: '+p.l;o.lines.push(p.sub.replace(/^Nebenmission · /,'Wo: '));}
  if(id){o.lines.push((MAPS[id]?MAPS[id].name+' · ':'')+(BM_REGN[bmReg(id)]||''));
   const meds=p.med?[p.med]:p.meds||(p.kind==='name'?bmMapMedals(id):[]);for(const md of meds)o.lines.push(md.name+' ('+md.hall+'): '+(md.got?'erhalten ✓':'noch offen'));
   if(p.kind==='crown'||p.crown||p.kind==='name'&&bmDoors(getMap(id)).some(d=>d.kind==='crown'))o.lines.push(T_('elite')+' und '+T_('champTitle')+' '+T_('champ'));
   if(p.kind==='heal'||p.kind==='fast'||p.heal||p.kind==='name'&&bmDoors(getMap(id)).some(d=>d.kind==='heal'))o.lines.push('Kreaturenstation');
   const d=bmDist(id);if(d)o.lines.push(d);const sp=p.fast||(p.kind==='name'&&bmFastOf(id));
   if(sp)o.btn={t:'Schnellreise nach '+MAPS[sp.town].name,f:()=>bmFast(sp)};else if((p.kind==='heal'||p.heal||p.kind==='fast')&&!(typeof canFastTravel==='function'&&canFastTravel()))o.lines.push('Schnellreise gibt es ab der ersten Medaille');}}
 return o;}
function bmMapMedals(id){const out=[];for(const n of NPCS[id]||[]){const md=n.t==='trainer'&&bmMedal(n);if(md&&!out.some(o=>o.name===md.name))out.push(md);}for(const d of bmDoors(getMap(id)))if(d.med)out.push(d.med);return out;}
function bmFastOf(id){if(!(typeof canFastTravel==='function'&&canFastTravel())||!bmVisited(id)||bmTop()===id&&!cur.inside)return null;return(healSpots().find(s=>s.town===id))||null;}
function bmFast(sp){bmClose();try{sfx('tap');}catch(e){}playSeq('fastTravel',{to:sp.town,x:sp.x,y:sp.y,label:MAPS[sp.town].name,ret:{map:sp.town,x:sp.x,y:sp.y}});}
function bmCard(o,X,Y){const el=BM.el.querySelector('.bmCard');if(!o){el.hidden=true;return;}el.innerHTML=`<b>${o.t}</b>${o.lines.filter(Boolean).map(l=>`<span>${l}</span>`).join('')}${o.btn?`<button type="button" class="bmGo">${o.btn.t}</button>`:''}`;
 el.hidden=false;if(o.btn)el.querySelector('.bmGo').onclick=e=>{e.stopPropagation();o.btn.f();};const{W,H}=bmStageRect(),w=el.offsetWidth,h=el.offsetHeight;let x=X-w/2,y=Y-h-22;if(y<8)y=Y+26;
 el.style.left=Math.max(8,Math.min(W-w-8,x))+'px';el.style.top=Math.max(8,Math.min(H-h-8,y))+'px';}
function bmTap(X,Y){let best=null,bd=1e9;for(const h of BM.hits){const d=Math.hypot(h.x-X,h.y-Y);if(d<=h.r&&d<bd){bd=d;best=h;}}
 if(best){try{sfx('tap');}catch(e){}return bmCard(bmInfo(best.p),best.x,best.y);}
 const L=BM.L[BM.lvl],[u,w]=bmToCon(L,BM.v,X,Y);
 if(BM.lvl==='here'){const t=tileAt(cur,Math.floor(u),Math.floor(w));const D={'"':['Hohes Gras','Hier leben wilde Kreaturen'],':':['Dunkler Boden','Hier leben wilde Kreaturen'],'~':['Wasser',G.flags.swim?'Du kannst hier schwimmen':'Schwimmen lernst du mit der Flutmedaille'],'T':['Bäume',''],'R':['Felskante',G.flags.glide?'Von hier kannst du gleiten':''],'F':['Blumen',''],'=':['Brücke',''],'X':['Felswand',cur.theme==='cave'?'':G.flags.climb?'Hier kannst du klettern':''],'D':['Dornen','Eine Glut- oder Böen-Kreatur räumt sie weg'],'G':['Geröll','Eine Fels-Kreatur räumt es weg']}[t];
  if(D)return bmCard({t:D[0],lines:[D[1]]},X,Y);return bmCard(null);}
 if(BM.lvl==='region'){const A=bmAtlas();for(const id in A.P){const a=A.P[id];if(u>=a.x&&u<=a.x+a.w&&w>=a.y&&w<=a.y+a.h)return bmCard(bmInfo({kind:'name',map:id,vis:bmVisited(id),l:MAPS[id].name}),X,Y);}}
 bmCard(null);}

// ---------- Oberfläche ----------
function bmBuild(){if(BM.el)return BM.el;const el=document.createElement('div');el.id='bigMap';el.className='bm';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Große Karte');
 const ico=(d)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 el.innerHTML=`<div class="bmPanel"><header class="bmHead"><div class="bmTitle"><b class="bmName"></b><small class="bmSub"></small></div>
 <div class="bmSeg" role="tablist" aria-label="Kartenebene"><button type="button" role="tab" data-l="here">Hier</button><button type="button" role="tab" data-l="region">Region</button><button type="button" role="tab" data-l="world">Veyra</button></div>
 <button type="button" class="bmX" aria-label="Karte schließen">${ico('M6 6l12 12M18 6L6 18')}</button></header>
 <div class="bmStage"><canvas class="bmMk" aria-hidden="true"></canvas><button type="button" class="bmGoal" hidden></button>
 <div class="bmZoom"><button type="button" class="bmIn" aria-label="Hineinzoomen">${ico('M12 5v14M5 12h14')}</button><button type="button" class="bmOut" aria-label="Herauszoomen">${ico('M5 12h14')}</button><button type="button" class="bmMe" aria-label="Zu mir">${ico('M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 .01 0')}</button></div>
 <button type="button" class="bmLegBtn" aria-expanded="false">Legende</button><div class="bmLeg" hidden></div><div class="bmCard" hidden role="status"></div></div>
 <footer class="bmFoot"><span class="bmCan">Hier kannst du:</span><div class="bmChips"></div></footer></div>`;
 document.body.appendChild(el);BM.el=el;
 el.addEventListener('pointerdown',e=>{if(e.target===el){e.preventDefault();BM.outT=1;}});el.addEventListener('click',e=>{if(e.target===el&&BM.outT)bmClose();BM.outT=0;});
 el.querySelector('.bmX').onclick=()=>bmClose();
 el.querySelectorAll('.bmSeg button').forEach(b=>b.onclick=()=>{if(b.dataset.l!==BM.lvl){try{sfx('page');}catch(e){}bmSetLevel(b.dataset.l);}});
 el.querySelector('.bmIn').onclick=()=>bmStep(1);el.querySelector('.bmOut').onclick=()=>bmStep(-1);
 el.querySelector('.bmMe').onclick=()=>{const L=BM.L[BM.lvl],me=L&&L.poi.find(p=>p.kind==='me');if(!me)return;const u=BM.lvl==='world'?me.x:me.x+.5,w=BM.lvl==='world'?me.y:me.y+.5;bmAnimTo(bmClampV(L,bmFocusV(L,u,w,Math.max(BM.v.s,bmDefault(BM.lvl).s))),320);BM.ping={x:BM.lvl==='world'?me.x-.5:me.x,y:BM.lvl==='world'?me.y-.5:me.y,t0:performance.now()};};
 el.querySelector('.bmLegBtn').onclick=()=>{BM.leg=!BM.leg;bmLegend();};
 el.querySelector('.bmGoal').onclick=()=>{const p=BM.L[BM.lvl].poi.find(p=>p.goal);if(p)bmFocus(p);};
 const st=el.querySelector('.bmStage');st.addEventListener('pointerdown',bmPDown);st.addEventListener('pointermove',bmPMove);st.addEventListener('pointerup',bmPUp);st.addEventListener('pointercancel',bmPUp);
 st.addEventListener('wheel',e=>{if(e.target.closest('.bmLeg,.bmCard'))return;e.preventDefault();const r=st.getBoundingClientRect();bmZoom(Math.exp(-e.deltaY*.0016),e.clientX-r.left,e.clientY-r.top);clearTimeout(BM.wheelT);BM.wheelT=setTimeout(bmCheckLevel,160);},{passive:false});
 return el;}
function bmUi(){const el=BM.el,l=BM.lvl,top=bmTop(),reg=bmReg(top);
 el.querySelector('.bmName').textContent=l==='here'?cur.name:l==='region'?BM_REGN[reg]:'Veyra';
 el.querySelector('.bmSub').textContent=l==='here'?(BM_REGN[reg]||'')+(cur.inside?' · '+((MAPS[top]||{}).name||''):''):l==='region'?bmRegionLine(reg):bmWorldLine();
 el.querySelectorAll('.bmSeg button').forEach(b=>{const on=b.dataset.l===l;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);if(b.dataset.l==='region')b.textContent=BM_REGN[reg]||'Region';});
 const Q=bmQuest(),g=el.querySelector('.bmGoal'),gp=BM.L[l]&&BM.L[l].poi.find(p=>p.goal);g.hidden=!Q.q;if(Q.q)g.innerHTML=`<i aria-hidden="true"></i><span><small>Ziel</small><b>${Q.q.title}</b>${Q.gp?`<em>${Q.gp.l}</em>`:''}</span>`;g.disabled=!gp;
 const ch=el.querySelector('.bmChips'),can=el.querySelector('.bmCan');ch.innerHTML='';const S=l==='here'?bmSuggest():l==='region'?bmRegionChips(reg):bmWorldChips();
 can.textContent=l==='here'?'Hier kannst du:':l==='region'?'In '+(BM_REGN[reg]||'der Region')+':':'In Veyra:';
 for(const s of S){const b=document.createElement('button');b.type='button';b.className='bmChip';const cv=document.createElement('canvas');cv.width=cv.height=56;cv.className='bmCi';bmIcon(cv.getContext('2d'),s.ic,28,s.ic==='goal'?40:28,s.ic==='goal'?18:22);
  b.append(cv,document.createTextNode(s.t));if(s.p)b.onclick=()=>bmFocus(s.p);else b.disabled=!s.f;if(s.f)b.onclick=s.f;ch.appendChild(b);}
 bmLegend();}
function bmRegionLine(reg){const A=bmAtlas(),ids=Object.keys(A.P).filter(id=>bmReg(id)===reg),v=ids.filter(bmVisited).length;return v+' von '+ids.length+' Orten entdeckt';}
function bmWorldLine(){const ids=Object.keys(MAPS),v=ids.filter(bmVisited).length,mg=typeof MEDALS!=='undefined'?MEDALS.filter(M=>G.flags[M[1]]||(G.badges||[]).includes(M[0])).length:0;return v+' von '+ids.length+' Orten entdeckt · Medaillen '+mg+' von '+(typeof MEDALS!=='undefined'?MEDALS.length:8);}
function bmRegionChips(reg){const L=BM.L.region.poi,out=[],Q=bmQuest(),add=(t,p,ic)=>{if(out.length<5&&!out.some(o=>o.t===t))out.push({t,p,ic});};
 const g=L.find(p=>p.goal);if(g)add('Zum Ziel: '+MAPS[g.map].name,g,'goal');
 for(const p of L.filter(q=>q.kind==='medal0').sort((a,b)=>(bmHops(cur.id,a.map)??99)-(bmHops(cur.id,b.map)??99)))if(bmRegionSet(bmTop()).includes(p.map))add('Medaille holen: '+p.l,p,'medal0');
 for(const p of L)if(p.kind==='quest'&&bmReg(p.map)===reg)add('Nebenmission: '+p.l,p,'quest');
 for(const p of L)if(p.kind==='fast'&&p.fast&&bmReg(p.map)===reg)add('Schnellreise: '+MAPS[p.map].name,p,'fast');
 for(const p of L)if(p.kind==='name'&&!p.vis&&bmReg(p.map)===reg)add('Noch zu entdecken: '+p.l,p,'quest');
 if(out.length<2)add('Rauszoomen für ganz Veyra',null,'exit'),out[out.length-1].f=()=>bmSetLevel('world');return out;}
function bmWorldChips(){const L=BM.L.world.poi,out=[],add=(t,p,ic,f)=>{if(out.length<5&&!out.some(o=>o.t===t))out.push({t,p,ic,f});};
 const g=L.find(p=>p.goal);if(g)add('Zum Ziel: '+MAPS[g.map].name,g,'goal');
 const ft=typeof canFastTravel==='function'&&canFastTravel(),info=(t,l)=>()=>{const{W,H}=bmStageRect();bmCard({t,lines:[l]},W/2,H*.55);};if(ft){const f=L.find(p=>p.fast);add(f?'Schnellreise: tippe ein Herz':'Schnellreise: besuche Kreaturenstationen',f,'fast',f?null:info('Schnellreise','Besuche eine Kreaturenstation, dann kannst du dorthin reisen.'));}else add('Schnellreise ab der ersten Medaille',null,'heal',info('Schnellreise','Ab der ersten Medaille reist du schnell zu besuchten Kreaturenstationen.'));
 const hop=id=>{const n=bmHops(cur.id,id);return n==null?99:n;},open=L.filter(p=>p.meds&&p.meds.some(m=>!m.got)).sort((a,b)=>hop(a.map)-hop(b.map));if(open[0])add('Nächste Medaille: '+open[0].meds.find(m=>!m.got).hall,open[0],'medal0');
 const seenR={};for(const id in MAPS)if(bmVisited(id))seenR[bmReg(id)]=1;const fr=Object.keys(BM_WREG).filter(r=>!seenR[r]);if(fr.length)add('Noch fremd: '+fr.slice(0,2).map(r=>BM_REGN[r]).join(', ')+(fr.length>2?' …':''),{kind:'region',x:BM_WREG[fr[0]][0],y:BM_WREG[fr[0]][1],l:BM_REGN[fr[0]],reg:fr[0]},'quest');
 return out;}
function bmLegend(){const el=BM.el,b=el.querySelector('.bmLegBtn'),box=el.querySelector('.bmLeg');b.setAttribute('aria-expanded',BM.leg);box.hidden=!BM.leg;if(!BM.leg)return;
 const K=BM.lvl==='here'?[['me','Du'],['goal','Ziel'],['talk','Sprechen'],['trainer','Herausforderer'],['medal0','Medaillen-Halle'],['heal','Kreaturenstation'],['shop','Händler / Laden'],['item','Glitzersache'],['grass','Hohes Gras'],['water','Wasser'],['glide','Gleit-Kante'],['climb','Kletterwand'],['quest','Nebenmission'],['wild','Wilde Kreatur'],['exit','Ausgang']]
  :[['me','Du bist hier'],['goal','Ziel'],['medal','Medaille erhalten'],['medal0','Medaille offen'],['crown',T_('elite')+' · '+T_('champ')],['heal','Kreaturenstation'],['fast','Schnellreise'],['shop','Händler'],['quest','Nebenmission']];
 box.innerHTML='';for(const[k,t]of K){const r=document.createElement('span'),cv=document.createElement('canvas');cv.width=cv.height=52;cv.className='bmCi';const c=cv.getContext('2d');
  if(k==='me'){c.fillStyle='#d81b72';c.beginPath();c.arc(26,26,17,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=4;c.stroke();}else bmIcon(c,k,26,k==='goal'?40:26,k==='goal'?17:20);r.append(cv,document.createTextNode(t));box.appendChild(r);}}
function bmFocus(p){if(!p)return;const L=BM.L[BM.lvl],u=BM.lvl==='world'?p.x:p.x+.5,w=BM.lvl==='world'?p.y:p.y+.5,s=Math.max(BM.v.s,BM.lvl==='here'?Math.min(2.2,26/L.fit):BM.lvl==='region'?Math.max(2,bmDefault('region').s):1.4);
 const to=bmClampV(L,bmFocusV(L,u,w,Math.min(bmLim(BM.lvl)[1],s)));bmAnimTo(to,380,()=>{const[X,Y]=bmToScr(L,BM.v,u,w);bmCard(bmInfo(p),X,Y-8);});BM.ping={x:BM.lvl==='world'?p.x-.5:p.x,y:BM.lvl==='world'?p.y-.5:p.y,t0:performance.now()};try{sfx('tap');}catch(e){}}

// ---------- Gesten: Ziehen, Pinch, Doppeltipp ----------
function bmPDown(e){if(e.target.closest('button,.bmLeg,.bmCard'))return;const st=bmStage();try{st.setPointerCapture(e.pointerId);}catch(x){}const r=st.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};
 BM.ptr.set(e.pointerId,p);BM.anim=null;if(BM.ptr.size===1){BM.drag={x0:p.x,y0:p.y,v0:Object.assign({},BM.v),moved:false,t:performance.now()};}
 else if(BM.ptr.size===2){const[a,b]=[...BM.ptr.values()];BM.pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,v0:Object.assign({},BM.v)};BM.drag=null;}}
function bmPMove(e){if(!BM.ptr.has(e.pointerId))return;const r=bmStage().getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};BM.ptr.set(e.pointerId,p);const L=BM.L[BM.lvl];
 if(BM.pinch&&BM.ptr.size>=2){const[a,b]=[...BM.ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,P0=BM.pinch,[lo,hi]=bmLim(BM.lvl),s=Math.max(lo*.9,Math.min(hi,P0.v0.s*d/P0.d0));
  const[u,w]=bmToCon(L,P0.v0,P0.mx,P0.my),bb=bmBase(L);BM.v={s,x:mx-bb.ox-u*L.fit*s,y:my-bb.oy-w*L.fit*s};bmApply();return;}
 const D=BM.drag;if(!D)return;const dx=p.x-D.x0,dy=p.y-D.y0;if(!D.moved&&Math.hypot(dx,dy)>7)D.moved=true;if(D.moved){BM.v={s:D.v0.s,x:D.v0.x+dx,y:D.v0.y+dy};bmClampV(L,BM.v);bmApply();}}
function bmPUp(e){if(!BM.ptr.has(e.pointerId))return;const p=BM.ptr.get(e.pointerId);BM.ptr.delete(e.pointerId);
 if(BM.pinch){if(BM.ptr.size<2){BM.pinch=null;BM.drag=null;bmClampV(BM.L[BM.lvl],BM.v);bmApply();bmCheckLevel();}return;}
 const D=BM.drag;BM.drag=null;if(!D||D.moved||e.type==='pointercancel')return;const now=performance.now(),lt=BM.lastTap;
 if(lt&&now-lt.t<360&&Math.hypot(lt.x-p.x,lt.y-p.y)<34){BM.lastTap=null;bmCard(null);bmAnimTo(bmDefault(BM.lvl),300);return;}BM.lastTap={t:now,x:p.x,y:p.y};bmTap(p.x,p.y);}

// ---------- Öffnen / Schließen ----------
function openBigMap(lvl){if(BM.open||!G||!cur||mode!=='world'||(typeof B!=='undefined'&&B))return false;const el=bmBuild();BM.prev=mode;mode='menu';held=null;try{STICK.x=STICK.y=0;P.walk=false;}catch(e){}
 try{if(typeof mmShow==='function')mmShow(false);}catch(e){}BM.L={};BM_ATLAS=null;BM.open=true;BM.lvl=lvl||'here';el.hidden=false;el.classList.remove('in');void el.offsetWidth;el.classList.add('in');document.body.classList.add('bm-on');
 bmSetLevel(BM.lvl,{keep:1});try{sfx('open');}catch(e){}cancelAnimationFrame(BM.raf);BM.dirty=1;BM.raf=requestAnimationFrame(bmFrameDraw);setTimeout(()=>{try{el.querySelector('.bmX').focus({preventScroll:true});}catch(e){}},30);return true;}
function bmClose(){if(!BM.open)return;BM.open=false;cancelAnimationFrame(BM.raf);BM.anim=null;BM.ptr.clear();BM.pinch=BM.drag=null;const el=BM.el;el.classList.remove('in');document.body.classList.remove('bm-on');
 const fin=()=>{if(!BM.open){el.hidden=true;el.querySelectorAll('.bmBase').forEach(c=>c.remove());BM.L={};}};if(bmR())fin();else setTimeout(fin,200);
 if(mode==='menu')mode=BM.prev==='world'?'world':BM.prev||'world';try{sfx('close');}catch(e){}}
const closeBigMap=bmClose;
function bmSky(out){try{if(!out&&cur.inside)return['#4a3a2e','#c9a27a','innen'];if(!out&&cur.theme==='cave')return['#1d1724','#5a4a6a','hoehle'];const s=skyFor(bmReg(bmTop()),typeof skyTime==='function'?skyTime():'tag');return[s.stats.top||'#7f9fcf',s.stats.hor||'#e4dccf',s.time];}catch(e){return['#7f9fcf','#e4dccf','tag'];}}
// Tasten (vor den Spiel-Handlern): M öffnet/schließt, Escape/X schließt, +/− zoomt, Pfeile verschieben
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;
 if(!BM.open){if(e.code==='KeyM'&&!e.repeat&&G&&cur&&mode==='world'&&!(typeof B!=='undefined'&&B)){e.preventDefault();e.stopImmediatePropagation();openBigMap();}return;}
 if(e.code==='Tab')return;e.stopImmediatePropagation();if(['Escape','KeyM','KeyX','Backspace'].includes(e.code)){e.preventDefault();if(!e.repeat)bmClose();return;}
 if(e.code==='Equal'||e.code==='NumpadAdd'||e.key==='+'){e.preventDefault();bmStep(1);return;}if(e.code==='Minus'||e.code==='NumpadSubtract'||e.key==='-'){e.preventDefault();bmStep(-1);return;}
 const d={ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[1,0],ArrowRight:[-1,0]}[e.code];if(d){e.preventDefault();BM.anim=null;BM.v.x+=d[0]*60;BM.v.y+=d[1]*60;bmClampV(BM.L[BM.lvl],BM.v);bmApply();}
 if(e.code==='Digit1')bmSetLevel('here');if(e.code==='Digit2')bmSetLevel('region');if(e.code==='Digit3')bmSetLevel('world');},true);
addEventListener('keyup',e=>{if(BM.open)e.stopImmediatePropagation();},true);
addEventListener('resize',()=>{if(!BM.open)return;clearTimeout(BM.rsT);BM.rsT=setTimeout(()=>{if(!BM.open)return;const l=BM.lvl;BM.L={};bmSetLevel(l,{keep:1});},160);});
// Hook: Tipp auf die (sichtbare) Minikarte → große Karte
(()=>{const w=document.getElementById('mmW');if(!w)return;w.setAttribute('role','button');w.setAttribute('aria-label','Große Karte öffnen');w.tabIndex=-1;
 w.addEventListener('click',e=>{if(!w.classList.contains('show'))return;e.preventDefault();e.stopPropagation();openBigMap();});})();
setTimeout(()=>{try{bmWorldImg();}catch(e){}},5000);// Weltbild früh dekodieren
// Pause: solange die große Karte offen ist, wird die Welt nicht neu gezeichnet (letztes Bild bleibt stehen; spart Akku, keine 3D-Aufrufe)
{const _d3=draw3d;draw3d=function(){if(BM.open&&!BM.first)return;BM.first=0;return _d3.apply(this,arguments);};const _d2=draw;draw=function(){if(BM.open&&!BM.first)return;BM.first=0;return _d2.apply(this,arguments);};}
