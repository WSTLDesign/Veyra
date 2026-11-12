// ===== VEYRA – Fundstücke: Lehrrollen, versteckte Wesen, Glitzer-Zufallsfunde (Agent Fundstücke, docs/funde.md) =====
// Daten: FIND_NPCS in 02-world.js (t:'scroll'|'hidden'|'sparkle'), ITEMS rolle_* in 01-data.js.
// Hook: 03-engine talk → case 'item' … if(FINDS[n.f]||FINDS[n.t]) return pickFind(n).
// Beim Laden wird jede Fund-Art auf t:'item' + f:<Art> umgestellt: 2D-Zeichnung, 3D-Mesh, Ausblenden per Flag
// und alte Spielstand-Logik (foundItems) kennen nur 'item' – so bleibt dort alles unverändert.

// ---------- Feld-Attacken: Liste kommt aus FIELD_MOVES (17-move.js, Agent Bewegung), hier nur Rückfall ----------
// Rückfall-Werte: Name, Lern-Typen (alle Kreaturen mit einem dieser Typen dürfen lernen), Zweck, Kampfwerte.
const FIELD_FALLBACK={
 rankenschnitt:{n:'Rankenschnitt',types:['flora','boe','glut'],use:'Schneidet Ranken und Dornen weg.',mv:['Rankenschnitt','flora',45,100,25,null,'phys']},
 felsschub:{n:'Felsschub',types:['fels','kern'],use:'Schiebt schwere Felsen zur Seite.',mv:['Felsschub','fels',50,100,20,null,'phys']},
 leuchtfeuer:{n:'Leuchtfeuer',types:['lumen','glut','volt'],use:'Macht dunkle Höhlen hell.',mv:['Leuchtfeuer','lumen',40,100,25,'conf:10','spez']},
 wellenritt:{n:'Wellenritt',types:['flut'],use:'Trägt dich über das Wasser.',mv:['Wellenritt','flut',55,100,20,null,'phys']},
 eisbruecke:{n:'Eisbrücke',types:['frost','flut'],use:'Friert Wasser zu einer Brücke.',mv:['Eisbrücke','frost',45,100,25,'st:raureif:10','spez']},
 sturmfluegel:{n:'Sturmflügel',types:['boe'],use:'Trägt dich im Gleitflug über Kanten.',mv:['Sturmflügel','boe',55,100,20,null,'phys']},
 kletterkralle:{n:'Kletterkralle',types:['fels','flora','schatten'],use:'Hilft beim Klettern an Felswänden.',mv:['Kletterkralle','fels',50,100,20,null,'phys']}};
const fdNorm=s=>String(s||'').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
// → {id:{n,types[],use}}. FIELD_MOVES darf Objekt {id:{n|name,types|learn|t,use|d}} oder Liste [{id,…}] sein.
function fieldMoves(){const o={};let F=null;try{F=typeof FIELD_MOVES!=='undefined'?FIELD_MOVES:null;}catch(e){}
 if(F&&typeof F==='object'){const L=Array.isArray(F)?F.map(v=>[v&&(v.id||v.move),v]):Object.entries(F);
  for(const[k,v0]of L){if(!k)continue;const v=typeof v0==='string'?{id:v0}:(v0||{});const id=v.move||v.id||k,M=typeof MOVES!=='undefined'&&MOVES[id];
   const ty=[].concat(v.types||v.learn||v.t||v.type||[]).filter(t=>typeof TYPES!=='undefined'&&TYPES[t]);
   o[id]={n:v.n||v.name||(M&&M[0])||(FIELD_FALLBACK[id]||{}).n||id,types:ty.length?ty:((FIELD_FALLBACK[id]||{}).types||(M?[M[1]]:[])),use:v.use||v.zweck||v.d||(FIELD_FALLBACK[id]||{}).use||''};}}
 for(const k in FIELD_FALLBACK){const f=FIELD_FALLBACK[k];if(!Object.keys(o).some(id=>fdNorm(o[id].n)===fdNorm(f.n)||id===k))o[k]={n:f.n,types:f.types.slice(),use:f.use};}
 return o;}
// Rollen-ITEMS an die endgültigen Feld-Attacken binden (Name/ID aus FIELD_MOVES), fehlende Attacken als Rückfall anlegen
function fdSyncScrolls(){const FM=fieldMoves();
 for(const k in ITEMS){const it=ITEMS[k];if(it.k!=='scroll'||!it.field)continue;
  const id=Object.keys(FM).find(id=>id===it.mv||fdNorm(FM[id].n)===fdNorm(it.mv)||fdNorm(FM[id].n)===fdNorm(it.n.replace(/^Rolle: /,'')));if(!id)continue;
  it.mv=id;const nm=FM[id].n;it.n='Rolle: '+nm;it.d='Lehrt '+nm+'. '+(FM[id].use?FM[id].use+' ':'Damit kommst du an neue Orte. ')+'Die Rolle bleibt in der Tasche.';}
 for(const k in ITEMS){const it=ITEMS[k];if(it.k!=='scroll'||MOVES[it.mv])continue;const f=FIELD_FALLBACK[it.mv];if(!f)continue;const M=f.mv.slice();
  while(M.length<6)M.push(null);M[7]=0;M[8]=M[2]?+Math.min(4.8,1.1+M[2]/34).toFixed(1):2.6;MOVES[it.mv]=M;if(it.t&&TYPES[M[1]])it.t=M[1];}}
fdSyncScrolls();

// ---------- Lernen ----------
function scrollInfo(k){const it=ITEMS[k];if(!it||it.k!=='scroll'||!MOVES[it.mv])return null;const M=MOVES[it.mv];let types=[M[1]];
 if(it.field){const f=fieldMoves()[it.mv];if(f&&f.types.length)types=f.types;}return{k,id:it.mv,M,field:!!it.field,types};}
// 'ok' | 'kennt' | 'nein'. Feld-Attacke (05-field.js): jede Art mit Lern-Typ, unabhängig von der Stufe; liegt außerhalb der vier Kampfplätze (m.known).
// Kampf-Attacke: passender Typ, Lernliste der Art oder Kern-Attacke; belegt einen der vier Plätze.
function canLearnScroll(k,m){const S=scrollInfo(k),M=m&&MONS[m.s];if(!S||!M)return'nein';
 if(S.field){if(typeof fieldKnows==='function'?fieldKnows(m,S.id):(m.known||[]).includes(S.id))return'kennt';
  return(typeof fieldLearnable==='function'?fieldLearnable(m.s,S.id):S.types.some(t=>M.t.includes(t)))?'ok':'nein';}
 if((m.moves||[]).some(x=>x&&x.id===S.id))return'kennt';
 if(S.types.some(t=>M.t.includes(t)))return'ok';if(S.M[1]==='kern'||(M.ls||[]).some(e=>e[1]===S.id))return'ok';return'nein';}
// Lehrt die Attacke. Kampf-Attacke bei 4 Attacken: slot = Platz, der Platz macht (alte Attacke bleibt unter „Erlernte Attacken“). Die Rolle verbraucht sich nicht.
function teachScroll(k,m,slot){const S=scrollInfo(k);if(!S)return'';const r=canLearnScroll(k,m),nm=mname(m);
 if(r==='kennt')return nm+' kann '+S.M[0]+' schon.';if(r!=='ok')return nm+' kann '+S.M[0]+' nicht lernen.';
 m.moves=m.moves||[];m.known=m.known||[];
 if(S.field){if(typeof fieldTeach==='function')fieldTeach(m,S.id);if(!m.known.includes(S.id))m.known.push(S.id);return nm+' kann jetzt '+S.M[0]+'! Das hilft draußen in der Welt.';}
 const full=m.moves.length>=4;if(full&&(slot==null||!m.moves[slot]))return'';
 if(!m.known.includes(S.id))m.known.push(S.id);const mv={id:S.id,pp:S.M[4]};
 if(!full){m.moves.push(mv);return nm+' kann jetzt '+S.M[0]+'!';}
 const old=MOVES[m.moves[slot].id][0];m.moves[slot]=mv;return nm+' vergisst '+old+'. '+nm+' kann jetzt '+S.M[0]+'!';}
function fdTypes(S){return S.types.map(t=>TYPES[t]?TYPES[t].n:t).join(', ');}
function fdBack(txt,fn){const b=document.createElement('button');b.className='back';b.textContent=txt;b.onclick=fn;return b;}
function fdDone(t){try{sfx('lvl');}catch(e){}try{vib(20);}catch(e){}toast(t);renderMenu();}
function chooseScroll(k){const it=ITEMS[k],S=scrollInfo(k),el=$('#mBody');if(!S)return;el.innerHTML='';
 el.insertAdjacentHTML('beforeend',`<h3>${it.n} – wer soll lernen?</h3><p class="muted fdHint">Passt zu: ${fdTypes(S)}.${S.field?' Feld-Attacken brauchen keinen Kampfplatz.':''} Die Rolle bleibt danach in der Tasche.</p>`);
 const g=document.createElement('div');g.className='grid';
 G.team.forEach((m,i)=>{const r=canLearnScroll(k,m),c=card(m,i,false);c.classList.add('fd-'+r);c.disabled=r!=='ok';
  c.insertAdjacentHTML('beforeend',`<small class="fdTag">${r==='ok'?'Kann es lernen':r==='kennt'?'Kann es schon':'Passt nicht'}</small>`);
  c.onclick=()=>{if(r!=='ok')return;if(S.field||(m.moves||[]).length<4)fdDone(teachScroll(k,m));else chooseForget(k,m);};g.appendChild(c);});
 el.appendChild(g);el.appendChild(fdBack('Zurück',renderMenu));}
function chooseForget(k,m){const S=scrollInfo(k),el=$('#mBody');el.innerHTML='';
 el.insertAdjacentHTML('beforeend',`<h3>${mname(m)} kennt schon vier Attacken.</h3><p class="muted fdHint">Welche soll Platz machen für ${S.M[0]}? Keine Sorge: Unter „Team“ kannst du sie später wieder wählen.</p>`);
 const sl=document.createElement('div');sl.className='slots fdSlots';
 m.moves.forEach((mv,i)=>{const X=MOVES[mv.id],b=document.createElement('button');b.className='slot';b.style.setProperty('--tc',TYPES[X[1]].c);
  b.innerHTML=`<i class="tic">${ticon(X[1])}</i><div><b>${X[0]}</b><span>${TYPES[X[1]].n} · ${X[2]?'Stärke '+X[2]:'Status'}</span></div>`;
  b.onclick=()=>fdDone(teachScroll(k,m,i));sl.appendChild(b);});
 el.appendChild(sl);el.appendChild(fdBack('Doch nicht',()=>chooseScroll(k)));}
// Tasche: eigene Rubrik „Rollen“ (Feld-Attacken zuerst)
const _rBagFd=rBag;rBag=function(el){_rBagFd(el);try{const ks=Object.keys(ITEMS).filter(k=>ITEMS[k].k==='scroll'&&G.bag[k]>0&&scrollInfo(k)).sort((a,b)=>(ITEMS[b].field|0)-(ITEMS[a].field|0));
 if(!ks.length)return;if(el.querySelector('.empty'))el.innerHTML='';el.insertAdjacentHTML('beforeend','<h3>Rollen</h3>');
 ks.forEach(k=>{const it=ITEMS[k],S=scrollInfo(k),r=document.createElement('div');r.className='item fdRoll';r.style.setProperty('--tc',TYPES[S.M[1]].c);
  r.innerHTML=`<div><b>${it.n}</b> <small>${S.field?'Feld-Attacke':'Attacke'} · ${fdTypes(S)}</small><p class="muted">${it.d}</p></div>`;
  const b=document.createElement('button');b.textContent='Lernen';b.onclick=()=>chooseScroll(k);r.appendChild(b);el.appendChild(r);});}catch(e){console.error('Rollen',e);}};

// ---------- Funde aufheben ----------
const FIND_DAY=1440;  // 1 Spieltag = 1440 Spielminuten = 1440 s Spielzeit (G.playtime)
let FIND_RUN=null;     // laufender Kampf gegen ein verstecktes Wesen {n,s}
// Glitzer: Gewichte (Summe 100). Bewusst klein gehalten – Läden und Funde reichen auf „leicht“ schon gut aus.
const SPARKLE=[{w:30,item:'kapsel',n:[1,2]},{w:25,item:'trank',n:[1,1]},{w:10,item:'supertr',n:[1,1]},
 {w:20,berry:['honigtau','glanzbeere','steinnuss','federschote','rankfrucht'],n:[1,2]},{w:15,money:[100,300]}];
function rollSparkle(rnd){rnd=rnd||Math.random;const tot=SPARKLE.reduce((a,s)=>a+s.w,0);let x=rnd()*tot,e=SPARKLE[SPARKLE.length-1];
 for(const s of SPARKLE){x-=s.w;if(x<0){e=s;break;}}const N=a=>a[0]+Math.floor(rnd()*(a[1]-a[0]+1)*.9999);
 if(e.money)return{money:Math.round(N(e.money)/10)*10};const item=e.berry?e.berry[Math.floor(rnd()*e.berry.length*.9999)]:e.item;return{item:ITEMS[item]?item:'trank',n:N(e.n)};}
function fdFound(n){try{if(Array.isArray(G.foundItems)&&!G.foundItems.includes(n.flag))G.foundItems.push(n.flag);}catch(e){}
 try{sfx('lvl');}catch(e){}try{if(typeof spawnFx==='function'&&view!=='2d'){const y=terrainY(n.x+.5,n.y+.5)+.35;for(let i=0;i<5;i++)spawnFx('sparkle',n.x+.5,y,n.y+.5);}}catch(e){}}
const FINDS={
 scroll(n){const k=n.item,it=ITEMS[k],S=scrollInfo(k);G.flags[n.flag]=1;if(!it||!S)return say('Hier liegt nichts mehr.');
  const had=(G.bag[k]||0)>0;if(!had)addItem(k,1);fdFound(n);
  return say(['Du hast eine Lehrrolle gefunden!',it.n+'. Passt zu: '+fdTypes(S)+'.',had?'Die hast du schon. Du kannst sie immer wieder benutzen.':S.field?'Damit kommt eine Kreatur an neue Orte.':'Damit lernt eine Kreatur eine neue Attacke.','Öffne die Tasche und tippe bei „Rollen“ auf „Lernen“.']);},
 hidden(n){const M=MONS[n.mon];if(!M)return say('Hier raschelt nichts.');
  if(!G.team.some(m=>m.hp>0))return say(['Da raschelt etwas …','Deine Kreaturen sind zu müde. Ruh dich erst aus.']);
  G.flags[n.flag]=1;G.flags[n.flag+'_t']=G.playtime|0;FIND_RUN={n,s:n.mon};
  return say(['Da bewegt sich etwas!','Ein seltenes Wesen springt heraus: '+M.n+'!'],()=>{held=null;startBattle({wild:mk(n.mon,n.lvl||10)});});},
 sparkle(n,rnd){G.flags[n.flag]=1;const r=rollSparkle(rnd);fdFound(n);
  if(r.money){G.money=(G.money|0)+r.money;return say(['Es glitzert!','Du findest ein Säckchen mit '+r.money+' ¤.']);}
  addItem(r.item,r.n);return say(['Es glitzert!','Du findest '+r.n+'× '+ITEMS[r.item].n+'.']);}};
function pickFind(n,rnd){const f=FINDS[n.f]||FINDS[n.t];return f?f(n,rnd):undefined;}
// Fund-Arten auf t:'item' + f umstellen (auch später ergänzte NPC-Listen: findsNormalize() erneut aufrufen)
function findsNormalize(){for(const id in NPCS)for(const n of NPCS[id]||[])if(n&&n.t!=='item'&&FINDS[n.t]){n.f=n.t;n.t='item';if(n.n==null)n.n=1;}}
findsNormalize();
// Verstecktes Wesen kommt nach einem Spieltag zurück, solange die Art nicht gefangen ist
function findsTick(){if(!G||!G.flags)return 0;let k=0;const now=G.playtime|0;
 for(const id in NPCS)for(const n of NPCS[id]||[]){if(n.f!=='hidden'||!G.flags[n.flag])continue;if(G.dex&&G.dex.caught&&G.dex.caught[n.mon])continue;
  const t=G.flags[n.flag+'_t'];if(typeof t==='number'&&now-t>=FIND_DAY){delete G.flags[n.flag];delete G.flags[n.flag+'_t'];k++;}}return k;}
const _loadMapFd=loadMap;loadMap=function(){try{findsTick();}catch(e){}return _loadMapFd.apply(this,arguments);};
const _endBattleFd=endBattle;endBattle=function(res){const f=FIND_RUN;FIND_RUN=null;const r=_endBattleFd.apply(this,arguments);
 try{if(f&&G&&!(G.dex&&G.dex.caught&&G.dex.caught[f.s]))toast(MONS[f.s].n+' ist weggehuscht. Morgen ist es wieder da.');}catch(e){}return r;};

// ---------- Dex-Hinweis: „Irgendwo in <Region> versteckt.“ ----------
const FD_REG={lichtlande:'in den Lichtlanden',smaragdwald:'im Smaragdwald',flutkueste:'an der Flutküste',glutlande:'in den Glutlanden',kristallgebirge:'im Kristallgebirge',
 frosttundra:'in der Frosttundra',schattenmoor:'im Schattenmoor',himmelsweiten:'in den Himmelsweiten'};
const FIND_HINTS={};  // Art-ID → {map, region, text}; Dex-Detail zeigt text bei gesehenen, noch nicht gefangenen Arten
(()=>{for(const id in NPCS)for(const n of NPCS[id]||[])if(n.f==='hidden'&&MONS[n.mon]){let reg='lichtlande';try{reg=skyRegion(id);}catch(e){}
 FIND_HINTS[n.mon]={map:id,region:reg,text:'Irgendwo '+(FD_REG[reg]||'in Veyra')+' versteckt.'};}})();
// rDex bleibt unangetastet: Klick auf ein Dex-Feld baut das Detail synchron; danach (Bubble-Phase) Hinweis anhängen
const _rDexFd=rDex;rDex=function(el){const r=_rDexFd.apply(this,arguments);try{if(!el._fdHint){el._fdHint=1;el.addEventListener('click',e=>{try{
 const b=e.target&&e.target.closest&&e.target.closest('.dx');if(!b||!b.parentNode)return;const i=[...b.parentNode.children].indexOf(b)+1,H=FIND_HINTS[i];
 if(!H||!G.dex.seen[i]||G.dex.caught[i]||el.querySelector('.fdDex'))return;const d=el.querySelector('.dinfo');if(d)d.insertAdjacentHTML('beforeend',`<p class="fdDex">${H.text}</p>`);}catch(err){}});}}catch(err){}return r;};

// ---------- 3D: Form-/Farbvariante des vorhandenen Fund-Meshes (gleiche 2 Meshes, nur Geometrie/Material getauscht) ----------
// Gegenstand: Kapsel bleibt (Heilmittel mintgrün) · Rolle: Pergament-Rolle mit Ring in Typfarbe · verstecktes Wesen: raschelnder Busch · Glitzer: Spitzenstern
function styleFind3d(o,n){if(!o||!o.children||o.children.length<2||!o.userData||!o.userData.spin)return;const cr=o.children[0],ring=o.children[1],k=n.f;
 const mat=(c,e,i)=>toonMat(c,{emissive:e,emissiveIntensity:i});
 if(k==='scroll'){const S=scrollInfo(n.item),tc=S&&TYPES[S.M[1]]?TYPES[S.M[1]].c:'#c9985c';
  cr.geometry=g3('fdScroll',()=>{const g=new THREE.CylinderGeometry(.07,.07,.34,12);g.rotateZ(Math.PI/2);return g;});cr.material=mat('#f4e6c0','#ffd98a',.35);cr.scale.set(1,1,1);
  ring.geometry=g3('fdRing',()=>new THREE.TorusGeometry(.17,.024,6,20));ring.material=mat(tc,tc,.6);}
 else if(k==='hidden'){cr.geometry=g3('fdBush',()=>new THREE.IcosahedronGeometry(.25,1));cr.material=mat('#5fae4a','#2f7a2a',.25);cr.scale.set(1,.82,1);cr.position.y=-.13;
  ring.geometry=g3('fdGlit',()=>new THREE.TorusGeometry(.3,.012,4,24));ring.material=mat('#fffbe0','#ffe9a0',.9);ring.position.y=-.13;}
 else if(k==='sparkle'){cr.geometry=g3('fdStar',()=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.075:.19;s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}
   const g=new THREE.ExtrudeGeometry(s,{depth:.05,bevelEnabled:false});g.translate(0,0,-.025);return g;});cr.material=mat('#fff3b0','#ffc93a',.75);cr.scale.set(1,1,1);
  ring.material=mat('#ffd0f0','#ff9ad8',.6);}
 else{const it=ITEMS[n.item];if(it&&(it.k==='heal'||it.k==='revive'||it.k==='pp'))cr.material=mat('#8fe3b0','#3fbf7a',.45);}}
if(typeof build3d==='function'){const _build3dFd=build3d;build3d=function(){const S=_build3dFd.apply(this,arguments);
 try{for(const e of(S&&S.userData&&S.userData.npcs)||[])if(e.n&&e.n.t==='item')styleFind3d(e.o,e.n);}catch(err){console.error('Fund-3D',err);}return S;};}
