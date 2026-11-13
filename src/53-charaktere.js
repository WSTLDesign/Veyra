// ===== VEYRA – Charakterentwicklung (Agent Charaktere 12.11.): Das Aussehen des Helden wächst mit =====
// Stufen aus dem Fortschritt (keine Pflichtfelder im Spielstand): Medaillen (G.badges / Flags badge*), Story-Flags (s5_ruinen, top3, champion).
//   0 Startkleidung → 1 Abenteuer-Jacke + Plaketten (1. Medaille) → 2 Expedition: Rucksack, Tasche, Stiefel (3 Medaillen oder Eisruinen)
//   → 3 Umhang + Medaillenreihe am Gürtel (alle 8 Medaillen oder 3. Turmhüter) → 4 Kronen-Mantel (Kristallkrone)
// Wirkt überall, wo heroLook() benutzt wird: 3D-Welt + Kampf (person3d über 09 outfitSync), 2D-Figur/Porträt (drawFigure), Intro (Stufe 0).
// Optional im Spielstand: G.flags.lookStufe (höchste schon gezeigte Stufe, nur für den Hinweis „Neues Aussehen“).
const CHAR_STAGES=[
 {n:'Startkleidung',t:'Dein T-Shirt von zu Hause. Bequem für den ersten Weg.',next:'Gewinne deine erste Medaille.'},
 {n:'Abenteuer-Jacke',t:'Deine Jacke für die Reise. Jede Medaille glänzt als Plakette darauf.',next:'Sammle drei Medaillen.'},
 {n:'Expeditions-Ausrüstung',t:'Rucksack, Tasche und feste Stiefel. Damit schaffst du jeden Weg.',next:'Sammle alle acht Medaillen.'},
 {n:'Medaillen-Umhang',t:'Alle Medaillen hängen am Gürtel. Und dazu ein Umhang!',next:'Hol dir die Kristallkrone.'},
 {n:'Kronen-Mantel',t:'Du trägst die Kristallkrone. Dein Mantel strahlt wie ein Stern.',next:''}];
// Medaillen des Spielers in der Reihenfolge des Erwerbs → [{name, el}]
function charMedals(g){g=g===undefined?(typeof G!=='undefined'?G:null):g;if(!g)return[];const M=typeof MEDALS!=='undefined'?MEDALS:[],F=g.flags||{},out=[],seen=new Set();
 const old=typeof MEDAL_OLD!=='undefined'?MEDAL_OLD:{};
 for(let b of g.badges||[]){b=old[b]||b;if(seen.has(b))continue;seen.add(b);const m=M.find(x=>x[0]===b);out.push({name:b,el:m?m[2]:null});}
 for(const m of M)if(F[m[1]]&&!seen.has(m[0])){seen.add(m[0]);out.push({name:m[0],el:m[2]});}
 return out;}
function charMedalCol(el){try{const p=typeof PALETTE!=='undefined'&&PALETTE.el&&PALETTE.el[el];if(p&&p.c)return p.c;}catch(e){}return(typeof CHAR_EL_COL!=='undefined'&&CHAR_EL_COL[el])||'#e6c35c';}
// Stufe 0–4 aus dem Fortschritt (alter Spielstand ohne Medaillen/Flags → 0)
function charStage(g){g=g===undefined?(typeof G!=='undefined'?G:null):g;if(!g)return 0;const F=g.flags||{},n=charMedals(g).length;
 if(F.champion)return 4;if(F.top3||n>=8)return 3;if(n>=3||F.s5_ruinen)return 2;if(n>=1)return 1;return 0;}
// Aussehen je Stufe auf das Grund-Aussehen (heroLook) legen; Farben des Spielers (Jacke, Haare, Haut) bleiben
function charOutfit(L,st,o,g){L=Object.assign({},L);const her=L.sex==='w',topC=L.top,med=st>0?charMedals(g).map(m=>charMedalCol(m.el)):[];
 const hats=Array.isArray(L.hat)?L.hat.slice():L.hat?[L.hat]:[];L.hat=hats.length?hats:null;// Schutzbrille auf dem Kopf gehört zum Grund-Aussehen (Referenz hero_m) – bleibt in allen Stufen
 L.acc=[];L.scarf=null;L.gloves=null;L.emblem=null;L.belt=null;L.medals=null;L.medalBelt=false;L.bootHigh=false;L.coat=null;L.stage=st;
 if(st===0){L.closed=true;L.sleeve='kurz';L.top2=null;L.boots=her?'#e8e2d6':'#e8e2d6';L.bootTrim=topC;L.laces=topC;L.sole='#8a8a92';return L;}
 L.closed=false;L.top2=her?'#f1e8d6':'#efe6d2';L.trim=shade(topC,.7);L.medals=med;
 if(st>=2){L.acc=her?['tasche','rucksack']:['rucksack'];L.accCol=her?'#7a4a2a':'#7d7a3a';L.rollCol='#e2d6b8';L.bootHigh=true;L.boots='#5a3d28';L.bootTrim='#8fbf4a';L.belt='#5a3d28';
  L.gloves='#3a3030';if(!her){L.scarf='#f0b429';if(!(L.hat||[]).includes('brille'))L.hat=(L.hat||[]).concat('brille');L.gogCol='#57c2dc';}else L.bagSym='sonne';}
 if(st>=3){L.coat='umhang';L.coatCol='#2f4a7a';L.coatTrim='#e6c35c';L.coatIn=shade(topC,.85);L.medalBelt=true;L.belt='#6a4a2a';L.emblem=null;L.crest=st>=4?'#9fe4ff':null;}
 if(st>=4){L.coat='mantel';L.coatCol='#f6f1e4';L.coatTrim='#e6b83a';L.closed=false;L.boots='#f2ece0';L.bootTrim='#e6b83a';L.acc=her?['tasche']:[];L.scarf=null;L.crest='#9fe4ff';L.gloves='#f2ece0';}
 return L;}
// heroLook(o[, stufe]) – Stufe kommt aus dem Fortschritt, wenn nicht angegeben (Intro: G noch leer → 0)
if(typeof heroLook==='function'){const _heroLook53=heroLook;heroLook=function(o,st){const L=_heroLook53(o);try{return charOutfit(L,st==null?charStage():st,o);}catch(e){return L;}};}
// Schlüssel für Neuaufbau der 3D-Spielfigur: Stufe + Medaillen
function charKey(g){return charStage(g)+'|'+charMedals(g).map(m=>m.el).join(',');}
if(typeof outfitSync==='function'){const _outfitSync53=outfitSync;outfitSync=function(){try{const k=charKey();if(R3.chk!==k){R3.chk=k;R3.ofk=null;R3.ofT=0;charNotice();}}catch(e){}return _outfitSync53.apply(this,arguments);};}
// Hinweis „Neues Aussehen“ (einmal je Stufe; optionales Flag lookStufe)
function charNotice(){if(typeof G==='undefined'||!G||!G.flags)return;const st=charStage();if(G.flags.lookStufe==null){G.flags.lookStufe=st;return;}
 if(st>G.flags.lookStufe){G.flags.lookStufe=st;try{if(typeof toast==='function')toast('Neues Aussehen: '+CHAR_STAGES[st].n+'!');}catch(e){}}}
// ---------- 2D: Medaillen-Plaketten auf drawFigure (Jacke bzw. Gürtel) ----------
if(typeof drawFigure==='function'){const _drawFigure53=drawFigure;drawFigure=function(c,x,y,s,L,t,opt){_drawFigure53.apply(this,arguments);try{
  if(!L||!L.medals||!L.medals.length||typeof FIG_BUILD==='undefined')return;const B=FIG_BUILD[L.build]||FIG_BUILD.adult,k=s/100,o=opt||{},bob=o.still?0:Math.sin((t||0)/620)*.8;
  c.save();c.translate(x,y);c.scale(k,k);const n=Math.min(8,L.medals.length),r=1.55;
  L.medals.slice(0,8).forEach((col,i)=>{let px,py;if(L.medalBelt){px=(i-(n-1)/2)*3.5;py=B.w-bob-.5;}else{px=B.sh*.32+(i%4)*3.5;py=B.tt-bob+8+Math.floor(i/4)*3.7;}
   c.beginPath();c.arc(px,py,r,0,7);c.fillStyle='#e6c35c';c.fill();c.lineWidth=.45;c.strokeStyle='rgba(30,22,40,.7)';c.stroke();c.beginPath();c.arc(px,py,r*.6,0,7);c.fillStyle=col;c.fill();});
  if(L.crest){const px=-B.sh*.38,py=B.tt-bob+8;c.beginPath();c.moveTo(px,py-3);c.lineTo(px+2,py);c.lineTo(px,py+3);c.lineTo(px-2,py);c.closePath();c.fillStyle=L.crest;c.fill();c.lineWidth=.5;c.strokeStyle='#e6c35c';c.stroke();}
  c.restore();}catch(e){}};}
// ---------- Chronik: „Dein Aussehen“ (kurz, kindgerecht) ----------
function charLookHtml(){const st=charStage(),S=CHAR_STAGES[st],n=charMedals().length;
 return`<h3>Dein Aussehen</h3><div class="chLook"><canvas class="chLookCv" width="132" height="176" aria-hidden="true"></canvas><div class="chLookTx"><b>${S.n}</b><p>${S.t}</p>`+
  `<div class="chLookSt">${CHAR_STAGES.map((q,i)=>`<span class="${i<=st?'got':''}" title="${q.n}"></span>`).join('')}</div>`+(S.next?`<p class="muted">Als Nächstes: ${S.next}</p>`:'<p class="muted">Du hast alles erreicht!</p>')+`<small class="muted">${n}/8 Medaillen</small></div></div>`;}
function charLookDraw(el){const cv=el&&el.querySelector('.chLookCv');if(!cv||typeof drawFigure!=='function'||typeof heroLook!=='function')return;const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);
 drawFigure(c,cv.width/2,cv.height-8,cv.height*.86,heroLook(G&&G.outfit),1000,{expr:'freudig',still:true});}
if(typeof rQuest==='function'){const _rQuest53=rQuest;rQuest=function(el){const r=_rQuest53.apply(this,arguments);try{if(el&&G){el.insertAdjacentHTML('beforeend',charLookHtml());charLookDraw(el);}}catch(e){}return r;};}
