// ===== VEYRA – Dex-Kanon (Agent A1): Bild-Keys auf Kanon-IDs, Typ „Ursprung“, Signatur-Fähigkeiten, Rivalen-Starter, Hilfen =====
// Die Arten selbst (001–153) stehen in 01-data.js (MONS), Sonder-Entwicklungen in 25-evolve.js (EVO_DEF), Migration alt→Kanon in 21-species.js (ID_MAP).
// Hilfen für UI/Welt: dexNr(id) → '#001' · habitatOf(id) · speciesIn(region,zone?) · isMyth(id)
function dexNr(id){return'#'+String(id).padStart(3,'0');}
function habitatOf(id){return(MONS[id]&&MONS[id].habitat)||null;}
function speciesIn(region,zone){const o=[];for(let i=1;i<MONS.length;i++){const h=MONS[i]&&MONS[i].habitat;if(h&&h.region===region&&(!zone||h.zones.includes(zone)))o.push(i);}return o;}
function isMyth(id){return!!(MONS[id]&&MONS[id].myth);}

// Bild-/3D-Tabellen (10-mon3d: DESIGN, ART_DESIGN, ART3D, ART_HUE · 26-art: ART_FACE) tragen seit Loop A2 direkt Kanon-IDs – die frühere Umschlüsselung alt→Kanon entfällt.

// ---------- Typ „Ursprung“ (Mythische): Symbol Stern-Ring, Farbe Weiß-Gold-Violett, kampfneutral ----------
if(typeof TICON!=='undefined'&&!TICON.ursprung)TICON.ursprung='M8 1.5l1.2 2.8 3 .3-2.3 2 .7 3L8 8.1 5.4 9.6l.7-3-2.3-2 3-.3zM1.5 11.5c0-1.4 2.9-2.5 6.5-2.5s6.5 1.1 6.5 2.5S11.6 14 8 14s-6.5-1.1-6.5-2.5zm1.6 0c.4.6 2.4 1.2 4.9 1.2s4.5-.6 4.9-1.2c-.4-.6-2.4-1.2-4.9-1.2s-4.5.6-4.9 1.2z';
try{if(typeof PALETTE!=='undefined'&&PALETTE.el&&!PALETTE.el.ursprung){
 PALETTE.el.ursprung={n:'Ursprung',c:'#b993e6',deep:'#5a3a9a',glow:'#fff1c2',sym:TICON.ursprung,form:'sternförmig, schwebend, Ringe',soft:PALETTE.mix('#b993e6','#ffffff',.82),css:'--el-ursprung'};
 PALETTE.light['battle-ursprung']=Object.assign({},PALETTE.light.special,{el:'ursprung'});if(PALETTE.lightNames&&!PALETTE.lightNames.includes('battle-ursprung'))PALETTE.lightNames.push('battle-ursprung');}}catch(e){}

// ---------- Signatur-Fähigkeiten der Legenden/Mythischen (Texte in ABIL, 01-data.js) – kindgerecht einfache Effekte ----------
function sideHas(B,m,ab){if(!B||!m)return false;try{return alliesOf(B,sideOf(m)).some(x=>x&&x.hp>0&&abil(x)===ab);}catch(e){return false;}}
const SIG_WX={gezeitenwacht:'regen',sturmhueter:'gewitter',firnkrone:'schnee'};
const _onEnter37=onEnter;onEnter=function(B,m){const r=_onEnter37(B,m)||[];if(!B||!m)return r;const a=abil(m);
 if(SIG_WX[a]&&B.weather!==SIG_WX[a])return[...r,{k:'msg',s:ABIL[a][0]+' von '+mname(m)+'!'},...setWeather(B,SIG_WX[a],5)];
 if((a==='waldsaat'||a==='urwuchs')&&!(B.field&&B.field.k==='bluete'))return[...r,{k:'msg',s:ABIL[a][0]+' von '+mname(m)+'!'},...setField(B,'bluete',a==='waldsaat'?8:5)];
 return r;};
// Glutwiege: einmal pro Kampf mit halben KP wieder aufstehen
const _deal37=dealDamage;dealDamage=function(B,T,dmg,src){const r=_deal37(B,T,dmg,src);
 if(B&&T&&T.hp<=0&&abil(T)==='glutwiege'){B._gw=B._gw||new Set();if(!B._gw.has(T)){B._gw.add(T);T.hp=Math.max(1,Math.floor(maxHp(T)/2));r.note=' erhebt sich dank Glutwiege aus der Glut!';}}return r;};
// Schaden: Gleichgewicht (Element nach Schwäche), Sturmhüter, Firnkrone, Sternenwacht, Lichtwind, Zwielicht, Ewiges Licht, Kristallwall
const _calc37=calcDamage;calcDamage=function(att,def,move,ctx){ctx=ctx||{};let M=Array.isArray(move)?move:MOVES[move];if(!M||!M[2]||!att||!def||!MONS[att.s]||!MONS[def.s])return _calc37(att,def,move,ctx);
 const B=ctx.B||null,aA=abil(att),dA=abil(def),tD=mtypes(def);
 if(aA==='gleichgewicht'&&att!==def){let best=M[1],be=eff(M[1],tD);for(const t in TYPES){if(t==='ursprung')continue;const e=eff(t,tD);if(e>be){be=e;best=t;}}if(best!==M[1]){M=M.slice();M[1]=best;}}
 const r=_calc37(att,def,M,ctx);if(!r||!r.dmg)return r;let k=1;const ty=M[1];
 if(aA==='sturmhueter'&&ty==='boe')k*=1.3;
 if(aA==='firnkrone'&&ty==='frost')k*=1.2;
 if(aA==='sternenwacht'&&ty==='lumen'&&(ctx.night!=null?ctx.night:bNight()))k*=1.2;
 if(aA==='lichtwind'&&ty==='boe'){k*=1.2;const e2=eff('lumen',tD);if(r.eff>0&&e2>r.eff){k*=e2/r.eff;r.eff=e2;}}
 if((ty==='schatten'||ty==='lumen')&&(aA==='zwielicht'||dA==='zwielicht')&&r.eff>0&&r.eff!==1){k/=r.eff;r.eff=1;}
 if(dA==='ewigeslicht'&&ty==='schatten')k*=.5;
 if(B&&att!==def&&sideHas(B,def,'kristallwall'))k*=.8;
 if(k!==1)r.dmg=Math.max(1,Math.floor(r.dmg*k));return r;};
// Sternenschleier: Gegner treffen das Team seltener
const _hit37=hitChance;hitChance=function(B,A,T,M){let p=_hit37(B,A,T,M);if(B&&T&&A!==T&&M&&M[3]<101&&sideHas(B,T,'sternenschleier'))p*=.85;return p;};
// Sternenwacht: das Team schläft nie ein
const _st37=applyStatus;applyStatus=function(B,T,k,src){if(k==='schlummer'&&B&&T&&T.hp>0&&sideHas(B,T,'sternenwacht'))return[{k:'msg',s:mname(T)+' bleibt dank Sternenwacht hellwach!'}];return _st37(B,T,k,src);};
// Rundenende: Lebenshauch/Urwuchs (Team 1/16), Gezeitenwacht (bei Regen 1/8), Ewiges Licht (selbst 1/16)
const _eot37=endOfTurn;endOfTurn=function(B){const ev=_eot37(B)||[];try{for(const side of['me','foe']){const al=alliesOf(B,side).filter(m=>m&&m.hp>0);
  for(const src of al){const a=abil(src);let any=0;
   if(a==='lebenshauch'||a==='urwuchs'){for(const m of al)if(m.hp<maxHp(m)&&healMonB(m,maxHp(m)/16))any=1;if(any)ev.push({k:'msg',s:ABIL[a][0]+'! Das Team von '+mname(src)+' schöpft Kraft.'},{k:'upd'});}
   else if(a==='gezeitenwacht'&&B.weather==='regen'&&src.hp<maxHp(src)){if(healMonB(src,maxHp(src)/8))ev.push({k:'msg',s:'Gezeitenwacht! Der Regen heilt '+mname(src)+'.'},{k:'upd'});}
   else if(a==='ewigeslicht'&&src.hp<maxHp(src)){if(healMonB(src,maxHp(src)/16))ev.push({k:'msg',s:'Ewiges Licht! '+mname(src)+' leuchtet auf.'},{k:'upd'});}}}}catch(e){}return ev;};

// ---------- Rivalen: Starterwahl merken (G.starter, G.rivals = {rayan:{starter}, mira:{starter}}) ----------
const _caught37=caught;caught=function(s){const first=typeof G!=='undefined'&&G&&G.flags&&!G.flags.starter&&!G.starter&&STARTERS.includes(s);const r=_caught37(s);
 if(first){G.starter=s;G.rivals=rivalStarters(s);}return r;};
