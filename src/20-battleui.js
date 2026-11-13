// ===== VEYRA – Kampf-UI: Resonanz, schräge Befehlskarten (Runde), Werte-/Status-Chips, Lock-on =====
// Liest (falls vorhanden): B.cd[i] (Füllstand 0..1 je Attacke, sonst B.g.me), B.res.me (0..1), B.weather, B.foes (Doppelkampf), m.status, STATUS[name], useResonance(side), SET.banim
const STL={atk:'Ang',def:'Ver',spa:'SpA',spd:'SpV',spe:'Ini',acc:'Gen',eva:'Aus'};
const BICON={fight:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 6.3L21 9l-5.3 4 1.9 6.6L12 15.8 6.4 19.6 8.3 13 3 9l6.8-.7z" fill="currentColor"/></svg>',
 team:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5.2" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="16.5" cy="13.5" r="4" fill="currentColor" opacity=".55"/></svg>',
 bag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14l-1 10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
 run:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h12M11 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".5"/></svg>'};
function hideB(){const bm=$('#bMenu');bm.innerHTML='';bm.classList.remove('rt','wait','rmain','rmoves','rlist');}
function btn(label,cls,fn,dis){const b=document.createElement('button');b.type='button';b.innerHTML=label;b.className=cls||'';b.disabled=!!dis;b.onclick=fn;$('#bMenu').appendChild(b);return b;}
function hpBar(el,m){const max=stat(m,'hp'),p=Math.max(0,Math.min(1,m.hp/max));el.style.width=(p*100)+'%';const gh=el.previousElementSibling;if(gh)gh.style.width=(p*100)+'%';
 el.style.background=p>.5?'var(--hp1)':p>.2?'var(--hp2)':'var(--hp3)';el.parentNode.classList.toggle('low',p>0&&p<=.2);el.parentNode.dataset.band=p>.5?'hi':p>.2?'mid':'lo';}
// Effektivität erst nach dem ersten Erleben zeigen: G.known2['att_def']=true
function effKnown(att,defT){const K=(G&&G.known2)||{};return defT.every(d=>K[att+'_'+d]);}
function learnEff(att,defT){if(!G)return;G.known2=G.known2||{};defT.forEach(d=>G.known2[att+'_'+d]=true);}
const _doMoveU=doMove;doMove=async function(side,mi){let at=null,D=null,h0=0;try{const A=side==='me'?G.team[B.mi]:B.foe[B.fi];D=side==='me'?B.foe[B.fi]:G.team[B.mi];h0=D.hp;
  const M=mi<0?['','kern',50]:MOVES[A.moves[mi].id];if(M&&M[2])at=M[1];}catch(e){}
 const r=await _doMoveU(side,mi);if(at&&D&&(D.hp<h0||eff(at,MONS[D.s].t)===0))learnEff(at,MONS[D.s].t);return r;};
// Kurzer Kampfstart auf Wunsch (SET.skipBattleIntro)
const _startBattleU=startBattle;startBattle=function(o){if(SET.skipBattleIntro&&G)G.nb=Math.max(G.nb||0,3);return _startBattleU(o);};
function stChips(st){if(!st)return'';return Object.keys(STL).filter(k=>st[k]).map(k=>{const v=Math.max(-6,Math.min(6,st[k]));return`<span class="sc ${v>0?'up':'dn'}" title="${STL[k]} ${v>0?'+':''}${v}">${STL[k]}<b>${v>0?'+':'−'}${Math.abs(v)}</b></span>`;}).join('');}
function statusChip(m){const s=m&&m.status;if(!s)return'';const k=typeof s==='string'?s:(s.name||s.k||s.id);const S=(typeof STATUS!=='undefined'&&STATUS&&STATUS[k])||{};
 return`<span class="stc" style="--sc:${S.c||S.col||'#8a6fd0'}" title="${S.d||''}">${S.short||S.n||S.name||k}</span>`;}
const WXN={klar:'Klar',sonne:'Sonne',regen:'Regen',schnee:'Schnee',sand:'Sandsturm',nebel:'Nebel',gewitter:'Gewitter',wind:'Wind'};
function updB(){const me=G.team[B.mi],foe=B.foe[B.fi];
 $('#bFoeName').innerHTML=tbadge(MONS[foe.s].t)+'<span class="nm">'+mname(foe)+(G.dex.caught[foe.s]?' <span class="own" title="Bereits gefangen">●</span>':'')+'</span><small>Lv '+foe.l+'</small>';
 $('#bFoeT').innerHTML=chips(MONS[foe.s].t)+statusChip(foe)+stChips(B.st.foe);hpBar($('#bFoeHp'),foe);
 $('#bMeName').innerHTML=tbadge(MONS[me.s].t)+'<span class="nm">'+mname(me)+'</span><small>Lv '+me.l+'</small>';$('#bMeT').innerHTML=chips(MONS[me.s].t)+statusChip(me)+stChips(B.st.me);hpBar($('#bMeHp'),me);
 const nb=$('#bMeNum');if(nb._who!==me){nb._who=me;nb._v=undefined;}countTo(nb,Math.max(0,me.hp),stat(me,'hp'));
 const a=me.l**3,b=(me.l+1)**3;$('#bMeXp').style.width=Math.min(100,(me.xp-a)/(b-a)*100)+'%';
 $('#bBalls').innerHTML=B.tr?B.foe.map(m=>`<i class="${m.hp>0?'':'out'}"></i>`).join(''):'';
 const w=B.weather&&(typeof B.weather==='string'?B.weather:B.weather.name||B.weather.k),wc=$('#wxChip');wc.hidden=!w||w==='klar';if(w)wc.innerHTML=`<i aria-hidden="true"></i>${WXN[w]||w}${B.field?' · '+(B.field.name||B.field):''}`;wc.dataset.w=w||'';}
function mvHint(M,foe){if(!M[2])return'<em class="st">Status</em>';const ft=MONS[foe.s].t;if(!effKnown(M[1],ft))return'<em class="unk" title="Wirkung noch unbekannt – probiere es aus">?</em>';
 const e=eff(M[1],ft);return e>1?'<em class="eff">Sehr effektiv</em>':e===0?'<em class="weak">Wirkungslos</em>':e<1?'<em class="weak">Schwach</em>':'';}
function mvGo(i){const M=i>=0?MOVES[G.team[B.mi].moves[i].id]:null;if(B.foes&&B.foes.filter(m=>m.hp>0).length>1&&M&&M[2])return pickFoe(t=>turn({k:'move',i,target:t}));turn({k:'move',i});}
function mvCard(mv,i){const M=MOVES[mv.id],foe=B.foe[B.fi],out=mv.pp<=0,rt=!!B.rt;
 const b=btn(`<i class="tic">${ticon(M[1])}</i><div class="mvt"><b>${M[0]}</b><span>${TYPES[M[1]].n}${M[2]?' · '+M[2]:''}</span><p class="mf"><small class="ap${out?' out':mv.pp<=M[4]/4?' lo':''}">${out?'Keine AP':'AP '+mv.pp+'/'+M[4]}</small>${mvHint(M,foe)}</p></div>`,
  'mv '+(rt?'pt p'+i:'cd'),()=>mvGo(i),out);b.style.setProperty('--tc',TYPES[M[1]].c);b.dataset.i=i;b.dataset.t=M[1];b.setAttribute('aria-label',`${M[0]}, ${TYPES[M[1]].n}${M[2]?', Stärke '+M[2]:''}, ${out?'keine AP':'AP '+mv.pp}`);return b;}
// Resonanz: Aufladering (B.res.me), aktiv erst mit useResonance (Phase 3)
function resCore(small){const has=typeof useResonance==='function',v=Math.max(0,Math.min(1,(B&&B.res&&B.res.me)||0)),ok=has&&v>=1;
 const b=btn(`<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="r0" cx="22" cy="22" r="19"/><circle class="r1" cx="22" cy="22" r="19" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100-v*100}"/><path class="rs" d="M22 10l3 8.5 9 .5-7 5.5 2.5 8.5L22 28l-7.5 5 2.5-8.5-7-5.5 9-.5z"/></svg><span>Resonanz</span>`,
  'res'+(small?' sm2':'')+(ok?' full':''),()=>{if(has&&B&&B.res&&B.res.me>=1){sfx('lvl');vib([20,30,60]);useResonance('me');}},!ok);
 b.id='resBtn';b.title=has?(ok?'Resonanz bereit!':'Lädt sich im Kampf auf'):'Resonanz – ab Phase 3';b.setAttribute('aria-label',has?'Resonanz, '+Math.round(v*100)+' Prozent':'Resonanz, verfügbar ab Phase 3');return b;}
function showRT(){if(!B)return;hideB();const me=G.team[B.mi],bm=$('#bMenu');bm.classList.add('rt');$('#bLog').textContent=B.g.me>=1?'Bereit! Wähle eine Attacke.':mname(me)+' sammelt Energie …';
 if(me.moves.every(m=>m.pp<=0))btn('<b>Verzweifeln</b><span>Letzte Kraft – kostet KP</span>','mv desp',()=>turn({k:'move',i:-1}));
 me.moves.forEach(mvCard);for(let i=me.moves.length;i<4;i++)btn('<span>Frei</span>','pt empty p'+i,null,true);resCore();
 btn(BICON.team+'<span>Team</span>','sm',()=>showTeamB(false));btn(BICON.bag+'<span>Tasche</span>','sm',showBag);btn(BICON.run+'<span>Rückzug</span>','sm',()=>turn({k:'run'}));bm.classList.toggle('wait',B.g.me<1);bTick();}
function showMain(){if(B&&B.rt)return showRT();hideB();const bm=$('#bMenu');bm.classList.add('rmain');const me=G.team[B.mi];$('#bLog').textContent='Was soll '+mname(me)+' tun?';
 const L=(ic,t,s)=>`<span class="cl">${ic}<b>${t}</b><small>${s}</small></span>`,alive=G.team.filter(m=>m.hp>0).length;
 btn(L(BICON.fight,'Kampf',me.moves.length+' Attacken'),'big k1',showMoves);btn(L(BICON.team,'Team',alive+' kampfbereit'),'big k2',()=>showTeamB(false));
 btn(L(BICON.bag,'Tasche',Object.keys(G.bag).filter(k=>G.bag[k]>0&&ITEMS[k]&&['ball','heal','revive','pp'].includes(ITEMS[k].k)).length+' Sorten'),'big k3',showBag);
 btn(L(BICON.run,'Rückzug',B.tr?'Nicht möglich':'Zurück in die Welt'),'big k4',()=>turn({k:'run'}),!!B.tr);resCore(true);
 bm.querySelectorAll('.big').forEach(b=>{const t=b.querySelector('b'),s=b.querySelector('small');if(t)b.setAttribute('aria-label',t.textContent+(s?', '+s.textContent:''));});}
function showMoves(){hideB();const bm=$('#bMenu');bm.classList.add('rmoves');const me=G.team[B.mi];$('#bLog').textContent='Wähle eine Attacke.';
 if(me.moves.every(m=>m.pp<=0))btn('<b>Verzweifeln</b><span>Letzte Kraft – kostet KP</span>','mv desp',()=>turn({k:'move',i:-1}));
 me.moves.forEach(mvCard);btn('Zurück','back',showMain);}
function showTeamB(forced){hideB();$('#bMenu').classList.add('rlist');$('#bLog').textContent=forced?'Wen schickst du als Nächstes?':'Wen willst du einwechseln?';
 G.team.forEach((m,i)=>{const b=btn(`<i class="tic pm"></i><div><b>${mname(m)} <small>Lv ${m.l}</small></b><span>${m.hp<=0?'Kampfunfähig':'KP '+Math.max(0,m.hp)+'/'+stat(m,'hp')}${i===B.mi?' · im Kampf':''}</span>${bar(m.hp/stat(m,'hp'))}</div>`,'mv tm',
  ()=>forced?doSwitch(i,true):turn({k:'switch',i}),m.hp<=0||i===B.mi);b.querySelector('.pm').appendChild(mini(m.s,36,m.hp<=0,{shiny:m.shiny}));b.style.setProperty('--tc',TYPES[MONS[m.s].t[0]].c);});
 if(!forced)btn('Zurück','back',showMain);}
function showBag(){hideB();$('#bMenu').classList.add('rlist');$('#bLog').textContent='Tasche';const ks=Object.keys(G.bag).filter(k=>G.bag[k]>0&&ITEMS[k]&&['ball','heal','revive','pp'].includes(ITEMS[k].k));
 if(!ks.length)$('#bLog').textContent='Deine Tasche ist leer.';
 ks.forEach(k=>{const it=ITEMS[k],dis=it.k==='ball'&&!!B.tr;btn(`<b>${it.n} <small>×${G.bag[k]}</small></b><span>${dis?'Bei einer Herausforderung nicht möglich':it.d}</span>`,'mv it it-'+it.k,()=>{if(it.k==='ball')return turn({k:'ball',item:k});pickTarget(k);},dis);});
 btn('Zurück','back',showMain);}
function pickTarget(k){hideB();$('#bMenu').classList.add('rlist');const it=ITEMS[k];$('#bLog').textContent='Für wen?';
 G.team.forEach((m,i)=>{const ok=it.k==='revive'?m.hp<=0:it.k==='heal'?m.hp>0&&m.hp<stat(m,'hp'):true;
  const b=btn(`<i class="tic pm"></i><div><b>${mname(m)}</b><span>KP ${Math.max(0,m.hp)}/${stat(m,'hp')}</span>${bar(m.hp/stat(m,'hp'))}</div>`,'mv tm',()=>turn({k:'item',item:k,i}),!ok);b.querySelector('.pm').appendChild(mini(m.s,36,m.hp<=0,{shiny:m.shiny}));});btn('Zurück','back',showBag);}
// Doppelkampf vorbereitet: Zielkarten, wenn B.foes mehr als ein Ziel hat
function pickFoe(cb){hideB();$('#bMenu').classList.add('rlist');$('#bLog').textContent='Welches Ziel?';(B.foes||B.foe).forEach((m,i)=>{const b=btn(`<i class="tic pm"></i><div><b>${mname(m)} <small>Lv ${m.l}</small></b>${bar(m.hp/stat(m,'hp'))}</div>`,'mv tm tgt',()=>cb(i),m.hp<=0);
 b.querySelector('.pm').appendChild(mini(m.s,36,m.hp<=0,{shiny:m.shiny}));b.style.setProperty('--tc',TYPES[MONS[m.s].t[0]].c);});btn('Zurück','back',showMain);}
// Pro Bild: Abklingzeit je Blütenblatt, Lock-on über dem Gegner, Resonanz-Ring
function bTick(){if(!B)return;const bm=$('#bMenu'),lo=$('#lockOn'),rt=!!(B.rt&&!B.busy&&bm.classList.contains('rt'));lo.classList.toggle('on',rt);
 if(rt){const q=scr('foe');lo.style.left=(q[0]/240*100)+'%';lo.style.top=(q[1]/150*100)+'%';lo.classList.toggle('ready',B.g.me>=1);}
 bm.querySelectorAll('.pt[data-i]').forEach(b=>{const i=+b.dataset.i,v=Math.max(0,Math.min(1,B.cd&&B.cd[i]!=null?B.cd[i]:B.g.me));b.style.setProperty('--cd',v.toFixed(3));b.classList.toggle('ready',v>=1&&!b.disabled);});
 const rb=$('#resBtn');if(rb&&B.res){const v=Math.max(0,Math.min(1,B.res.me||0)),r1=rb.querySelector('.r1');if(r1)r1.setAttribute('stroke-dashoffset',100-v*100);const ok=typeof useResonance==='function'&&v>=1;if(rb.disabled===ok){rb.disabled=!ok;rb.classList.toggle('full',ok);}}}
const _drawBattleU=drawBattle;drawBattle=function(){_drawBattleU();bTick();};
