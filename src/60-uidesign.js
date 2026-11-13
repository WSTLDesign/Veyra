// ===== VEYRA – UI-Design 2 „Morgenglas“ (Agent UI-Design, 13.11.): eigene SVG-Symbole, Titelbild aus der Spielwelt + Wortmarke, HUD (Uhr-Symbol, Team-Kurzanzeige, Minikarte) =====
// Hängt sich nur an (keine fremden Funktionen umbenannt): BICON/APPICON werden mit eigenen Symbolen gefüllt, updClock/card/mmShow umhüllt. Stil: src/styles-ui2.css, Doku docs/ui-design.md
const UI_ICON=(()=>{const s=(d,extra)=>`<svg class="v-ico" viewBox="0 0 24 24" aria-hidden="true"${extra||''}>${d}</svg>`;return{
 // Kampf: Funken-Stern (eigene Form: vier Spitzen + kleiner Begleitfunke)
 fight:s('<path d="M11 3.5c.6 3.7 2.3 5.4 6 6-3.7.6-5.4 2.3-6 6-.6-3.7-2.3-5.4-6-6 3.7-.6 5.4-2.3 6-6z" fill="currentColor" stroke="none"/><path d="M18.5 15.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" fill="currentColor" stroke="none" opacity=".7"/>'),
 team:s('<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><circle cx="16.6" cy="9.6" r="2.5" opacity=".6"/><path d="M15.6 14.4c2.6-.3 4.4 1.3 4.9 4.6" opacity=".6"/>'),
 bag:s('<path d="M5 9.5h14l-1.2 9.3a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7z"/><path d="M9 9.5V7.6a3 3 0 0 1 6 0v1.9"/><path d="M9.5 13.5h5"/>'),
 run:s('<path d="M14 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M4 12h10M10 8l4 4-4 4"/>'),
 map:s('<path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13" opacity=".55"/>'),
 quest:s('<path d="M6 21V4"/><path d="M6 4.5c3-1.6 5.5 1.6 8.5 0s3.5-.4 3.5-.4v8.4s-.5-1.2-3.5.4-5.5-1.6-8.5 0"/>'),
 dex:s('<path d="M12 6.5C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5z"/><path d="M12 6.5v13" opacity=".55"/><path d="M15 11.5c1.2-1.8 2.8-2.2 3.3-2.2-.1 1.7-1.1 3.4-3.3 3.6z" fill="currentColor" stroke="none"/>'),
 box:s('<rect x="3.5" y="8" width="17" height="11.5" rx="2"/><path d="M5 8l2-3.5h10L19 8"/><path d="M10 12h4"/>'),
 medals:s('<path d="M8 3.5l2.5 6M16 3.5l-2.5 6"/><circle cx="12" cy="14.5" r="5"/><path d="M12 12l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" fill="currentColor" stroke="none"/>'),
 game:s('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>'),
 sun:s('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>'),
 moon:s('<path d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10z" fill="currentColor" fill-opacity=".18"/>'),
 cloud:s('<path d="M7 18.5h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.4A3.3 3.3 0 0 0 7 18.5z"/>'),
 next:s('<path d="M9 5l7 7-7 7"/>'),
 close:s('<path d="M6 6l12 12M18 6L6 18"/>')};})();
// Kampf-Befehle und Chronik-Apps mit eigenen Symbolen (Objekte sind const, Inhalte austauschbar)
try{BICON.fight=UI_ICON.fight;BICON.team=UI_ICON.team;BICON.bag=UI_ICON.bag;BICON.run=UI_ICON.run;}catch(e){}
try{for(const k of ['map','team','quest','dex','bag','box','medals','game'])APPICON[k]=UI_ICON[k];document.querySelectorAll('#tabs button .ap').forEach(a=>{a.innerHTML='';});}catch(e){}

// ---------- Titelbildschirm: Himmel + Horizont der Lichtlande (eigene Spielwelt-Bilder), Lichtpunkte, Wortmarke ----------
const VUI={teamSig:'',teamT:0};
function vArt(k){const A=window.ART_SRC||{};return A[k]||A[k+'_lo']||null;}
// Wortmarke „VEYRA“ (eigene Gestaltung): gerundete Display-Schrift, warmer Verlauf, Kristall-Funke über dem Y, Untertitel in Kapitälchen; u = eindeutiges Kürzel für Verlaufs-IDs
function vLogo(u,cls){return `<svg class="vtLogo ${cls||''}" viewBox="0 0 560 210" role="img" aria-label="Veyra – Kreaturenchronik">
  <defs><linearGradient id="vlG${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".55" stop-color="#ffe7c2"/><stop offset="1" stop-color="#f3b977"/></linearGradient>
  <linearGradient id="vlK${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#ffd6ec"/><stop offset="1" stop-color="#ff5ca8"/></linearGradient></defs>
  <g transform="translate(280 36)"><path d="M0-30L9-6 0 22-9-6z" fill="url(#vlK${u})" stroke="#2a2148" stroke-width="3" stroke-linejoin="round"/><path d="M0-30L9-6H-9z" fill="#fff" opacity=".55"/>
   <circle r="44" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="2 7"/></g>
  <text x="280" y="148" text-anchor="middle" font-size="124" font-weight="700" letter-spacing="10" fill="none" stroke="#2a2148" stroke-width="16" stroke-linejoin="round" paint-order="stroke">VEYRA</text>
  <text x="280" y="148" text-anchor="middle" font-size="124" font-weight="700" letter-spacing="10" fill="url(#vlG${u})">VEYRA</text>
  <path d="M66 172h62M432 172h62" stroke="#2a2148" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
  <text x="280" y="178" text-anchor="middle" font-size="19" font-weight="600" letter-spacing="5" fill="#2a2148" fill-opacity=".8" style="font-family:var(--font-ui)">KREATURENCHRONIK</text>
 </svg>`;}
function vTitle(){const t=$('#title');if(!t||t.querySelector('.vtBg'))return;
 const bg=document.createElement('div');bg.className='vtBg';bg.setAttribute('aria-hidden','true');
 const sky=vArt('sky_lichtlande_abend')||vArt('sky_lichtlande_tag'),hz=vArt('horizon_lichtlande'),hz2=vArt('horizon_smaragdwald');
 bg.innerHTML=`<i class="sky"${sky?` style="background-image:url('${sky}')"`:''}></i>${hz2?`<i class="hz b" style="background-image:url('${hz2}')"></i>`:''}${hz?`<i class="hz" style="background-image:url('${hz}')"></i>`:''}<i class="mist"></i><i class="shade"></i>`
  +Array.from({length:14},(_,i)=>`<i class="mote" style="left:${(7+i*6.6+(i*37)%9).toFixed(1)}%;top:${(38+(i*53)%40)}%;animation-delay:${(i*0.73%9).toFixed(2)}s;animation-duration:${8+(i%4)*1.6}s"></i>`).join('');
 if(!sky)bg.querySelector('.sky').style.background='linear-gradient(180deg,#5a6fb0,#e8b9b0 70%,#f6dccb)';
 t.prepend(bg);
 // Wortmarke „VEYRA“ (eigene Gestaltung): gerundete Display-Schrift, warmer Verlauf, Kristall-Funke über dem Y, Untertitel in Kapitälchen
 const h=t.querySelector('h1');const svg=vLogo('t');
 if(h)h.insertAdjacentHTML('afterend',svg);else t.insertAdjacentHTML('afterbegin',svg);
 const sub=t.querySelector('.tsub');if(sub)sub.setAttribute('aria-hidden','true');
 try{const v=document.querySelector('meta[name="veyra-version"]');if(v&&!t.querySelector('.vtVer'))t.insertAdjacentHTML('beforeend',`<span class="vtVer">Version ${v.content}</span>`);}catch(e){}
 vTitleBtns();}
function vTitleBtns(){const c=$('#tCont'),n=$('#tNew');if(!c||!n)return;n.classList.toggle('pri',!!c.hidden);c.classList.add('pri');}
vTitle();
// Startbildschirm (#iPrompt „Tippe, um zu beginnen“) und Opening-Endbild (#introLogo) mit derselben Wortmarke – vorher alte Schrift-Logos
function vIntroLogos(){const ip=$('#iPrompt');if(ip&&!ip.querySelector('.vtLogo')){const o=ip.querySelector('.ilogo');ip.insertAdjacentHTML('afterbegin',vLogo('p','vtP'));if(o)o.classList.add('vSr');}
 const il=$('#introLogo');if(il&&!il.querySelector('.vtLogo')){il.insertAdjacentHTML('afterbegin',vLogo('o','vtO'));il.querySelectorAll('h1,.okc').forEach(e=>e.classList.add('vSr'));}}
vIntroLogos();
try{new MutationObserver(vTitleBtns).observe($('#tCont'),{attributes:true,attributeFilter:['hidden']});}catch(e){}

// ---------- HUD: Uhr mit Sonne/Mond-Symbol ----------
const _updClockV=updClock;updClock=function(){_updClockV();try{const el=$('#hudClock'),tx=el.textContent.replace(/^[☾☀]\s*/,''),n=isNight();
 el.innerHTML=(n?UI_ICON.moon:UI_ICON.sun)+'<span>'+tx+'</span>';el.dataset.n=n?'1':'0';}catch(e){}};

// ---------- HUD: Minikarte dauerhaft (klein, rund); Taste #mmBtn entfällt optisch ----------
const _mmShowV=mmShow;mmShow=function(on,ms){_mmShowV(true);};
function vMmOn(){try{if(G&&cur&&!$('#mmW').classList.contains('show'))_mmShowV(true);}catch(e){}}

// ---------- HUD: Team-Kurzanzeige (Bild + KP-Ring), Tipp öffnet das Team ----------
function vTeamEl(){let e=$('#vTeam');if(!e){e=document.createElement('div');e.id='vTeam';e.setAttribute('role','button');e.tabIndex=0;e.setAttribute('aria-label','Team ansehen');
  e.addEventListener('click',()=>{if(G&&mode==='world')openMenu('team');});e.addEventListener('keydown',ev=>{if(ev.code==='Enter'||ev.code==='Space'){ev.preventDefault();e.click();}});
  const ov=$('#hudOv');(ov||$('#screen')).appendChild(e);}return e;}
function vTeamTick(){if(!G||!cur||mode==='title')return;vMmOn();const e=vTeamEl(),T=G.team||[];
 const sig=T.map(m=>m.s+':'+(m.shiny?1:0)+':'+Math.round(Math.max(0,m.hp)/stat(m,'hp')*20)).join('|');if(sig===VUI.teamSig)return;VUI.teamSig=sig;e.innerHTML='';
 T.slice(0,6).forEach(m=>{const max=stat(m,'hp'),p=Math.max(0,Math.min(1,m.hp/max)),d=document.createElement('span');d.className='vt'+(m.hp<=0?' ko':'');
  d.title=mname(m)+' · KP '+Math.max(0,m.hp)+'/'+max;const C=2*Math.PI*15;
  d.innerHTML=`<svg class="hpr" viewBox="0 0 34 34" aria-hidden="true"><circle class="b" cx="17" cy="17" r="15"/><circle class="f" cx="17" cy="17" r="15" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-p)).toFixed(1)}"/></svg>`;
  d.style.setProperty('--hc',p>.5?'#27b863':p>.2?'#f0a51e':'#e0433f');try{d.prepend(mini(m.s,28,m.hp<=0,{shiny:m.shiny,still:true}));}catch(x){}e.appendChild(d);});
 e.setAttribute('aria-label','Team ansehen – '+T.length+' Kreaturen');}
setInterval(vTeamTick,600);

// ---------- Team-Karten: Farbton der Kreatur als Kartenkopf ----------
const _cardV=card;card=function(m,i,inBox){const d=_cardV(m,i,inBox);try{d.style.setProperty('--mc',TYPES[MONS[m.s].t[0]].c);}catch(e){}return d;};

// ---------- Tasche: eigenes Symbol je Gegenstandsart (Kapsel = facettierter Kristall mit Ring, Trank, Stein …) ----------
const ITEM_ICON={ball:'<path d="M12 3l5 6-5 12-5-12z"/><path d="M7 9h10" opacity=".6"/><ellipse cx="12" cy="12" rx="9" ry="3.2" opacity=".55"/>',
 heal:'<path d="M9.5 3.5h5M10.5 3.5v4.2L6.2 15a4.5 4.5 0 0 0 3.9 6.5h3.8a4.5 4.5 0 0 0 3.9-6.5l-4.3-7.3V3.5"/><path d="M8 15.5h8" opacity=".6"/>',
 revive:'<path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.6 12 20 12 20z"/><path d="M12 11v4M10 13h4"/>',
 pp:'<path d="M13 3L6 13h5l-1 8 7-10h-5z"/>',cure:'<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/><path d="M9.5 14.5h5M12 12v5" opacity=".7"/>',
 stone:'<path d="M7 4h10l4 6-9 11-9-11z"/><path d="M3 10h18M9 4l3 6 3-6M12 10v11" opacity=".55"/>',
 held:'<circle cx="12" cy="13" r="6"/><path d="M9 3.5l3 3.5 3-3.5"/>',key:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
 scroll:'<path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2M9 9h6M9 13h6" />'};
const _rBagV=rBag;rBag=function(el){_rBagV(el);try{el.querySelectorAll('.item').forEach(r=>{if(r.querySelector('.vIt,img,canvas,svg'))return;const n=(r.querySelector('b')||{}).textContent;
 const k=Object.keys(ITEMS).find(x=>ITEMS[x].n===n);if(!k)return;const kind=ITEMS[k].k,ic=ITEM_ICON[kind]||ITEM_ICON.held;
 r.insertAdjacentHTML('afterbegin',`<i class="vIt" data-k="${kind}" aria-hidden="true"><svg class="v-ico" viewBox="0 0 24 24">${ic}</svg></i>`);r.classList.add('vItem');});}catch(e){}};
