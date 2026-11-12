// ===== VEYRA – Spielstand-Sicherheitsnetz (QA Mechanik S1, AGENTS.md „SPIELSTAND-SICHERHEIT“) – Doku: docs/spielstand.md =====
// Hooks: 15-ui save() → saveWrite(s), loadSave() → saveRead(), cont() → saveMissing(), „Neu starten“ → saveWipe(); migrateSave (21) wird hier umhüllt.
// (1) G.saveVersion + G.appVer + G.gid; (2) vor jeder Migration Sicherung des Rohstands SAVEKEY+'_bak_<version>' (die letzten 3, nie mit kleinerem/leerem Stand überschreiben);
// (3) Spiegelkopie in IndexedDB (asynchron, Fehler still); (4) navigator.storage.persist() einmalig beim ersten Speichern; (5) Schreibschutz: nie leeres/ungültiges Objekt speichern;
// (6) Laden: kaputter Stand → Sicherung → IndexedDB → Hinweis (nie stillschweigend „Neues Spiel“); (7) Optionen › Erweitert: Code/Datei sichern, Code/Datei laden, Sicherungen.
// Achtung Reihenfolge: 15-ui ruft loadSave() schon beim Laden der Seite (vor diesem Modul) → Zustand nur über var + ssCfg() (keine const/let im TDZ).
var SAVE_VERSION=1;// erhöhen bei jeder Datenänderung mit Migration (siehe docs/spielstand.md)
var SS_;// ohne Initialwert: saveRead() kann schon vor diesem Modul gelaufen sein (Hinweis bleibt erhalten)
function ssCfg(){return SS_||(SS_={key:SAVEKEY,bak:SAVEKEY+'_bak_',list:SAVEKEY+'_bak_list',broken:SAVEKEY+'_kaputt',keep:3,db:'veyra_save',store:'kv',pkey:'veyra_persist',notice:null,dbp:null,mirrorP:null,persist:null});}
// Attacken-Umbenennungen (Recht/Kanon): alte ID → neue ID; Spielstände werden beim Laden umgeschrieben
var MOVE_RENAME={flammenrad:'glutwirbel'};
function ssLS(){try{return typeof localStorage!=='undefined'?localStorage:null;}catch(e){return null;}}
function ssGet(k){try{const L=ssLS();return L?L.getItem(k):null;}catch(e){return null;}}
function ssSet(k,v){try{const L=ssLS();if(!L)return false;L.setItem(k,v);return L.getItem(k)===v;}catch(e){return false;}}
function ssDel(k){try{const L=ssLS();if(L)L.removeItem(k);}catch(e){}}
function ssAppVer(){try{const m=document.querySelector('meta[name="veyra-version"]'),c=m&&typeof m.getAttribute==='function'?m.getAttribute('content'):'';return typeof c==='string'?c:'';}catch(e){return'';}}
function ssGid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
// ---------- Prüfung ----------
// Pflichtfelder eines Spielstands (auch alte Stände ohne saveVersion erfüllen sie)
function ssValid(g){return!!g&&typeof g==='object'&&!Array.isArray(g)&&typeof g.map==='string'&&g.map.length>0&&Array.isArray(g.team)&&g.team.length<=6&&
 g.team.every(m=>m&&typeof m==='object'&&Number.isFinite(+m.s))&&!!g.flags&&typeof g.flags==='object'&&!Array.isArray(g.flags)&&!!g.dex&&typeof g.dex==='object';}
function ssParse(raw){if(typeof raw!=='string'||raw.length<20||raw.length>4e6)return null;try{const g=JSON.parse(raw);return ssValid(g)?g:null;}catch(e){return null;}}
function ssCount(o){return o&&typeof o==='object'?Object.keys(o).filter(k=>o[k]).length:0;}
function ssWorth(g){if(!g)return 0;let n=0;try{n=(g.team||[]).length*10+(g.badges||[]).length*50+ssCount(g.dex&&g.dex.caught)*5+ssCount(g.flags);}catch(e){}return n;}
// Kurzbeschreibung für Kinder: „Noa · 3 Kreaturen · 2 Medaillen“
function saveSummary(g){if(!g)return'';const t=(g.team||[]).length,b=(g.badges||[]).length,c=ssCount(g.dex&&g.dex.caught);
 return(g.name||'Ohne Namen')+' · '+t+(t===1?' Kreatur':' Kreaturen')+' · '+b+(b===1?' Medaille':' Medaillen')+(c?' · '+c+' im Dex':'');}
// ---------- Sicherungen (localStorage) ----------
function saveBackups(){try{const l=JSON.parse(ssGet(ssCfg().list)||'[]');return Array.isArray(l)?l.filter(e=>e&&typeof e.k==='string'):[];}catch(e){return[];}}
// Sichert raw unter SAVEKEY+'_bak_'+tag. Nie mit leerem/ungültigem oder kleinerem Stand eine vorhandene Sicherung überschreiben. Behält die letzten 3.
function saveBackup(tag,raw,why){const S=ssCfg();if(!ssParse(raw))return false;const k=S.bak+tag,old=ssGet(k);
 if(old===raw)return true;if(old&&ssParse(old)&&old.length>raw.length)return false;
 const L=saveBackups().filter(e=>e.k!==k);L.push({k,t:Date.now(),why:why||'',n:raw.length});
 while(L.length>S.keep){const o=L.shift();ssDel(o.k);}
 let ok=ssSet(k,raw);while(!ok&&L.length>1){const o=L.shift();ssDel(o.k);ok=ssSet(k,raw);}// Speicher voll: älteste Sicherung freigeben
 if(!ok)return false;ssSet(S.list,JSON.stringify(L));return true;}
// Kaputter Rohstand bleibt aufgehoben (nie mit kleinerem überschreiben)
function ssKeepBroken(raw){const S=ssCfg();if(typeof raw!=='string'||raw.length<3)return;const o=ssGet(S.broken);if(o&&o.length>=raw.length)return;ssSet(S.broken,raw);}
function ssNewestBackup(){const L=saveBackups().slice().sort((a,b)=>b.t-a.t);for(const e of L){const raw=ssGet(e.k);if(ssParse(raw))return{raw,t:e.t,k:e.k};}return null;}
// ---------- IndexedDB-Spiegel (asynchron, Fehler still) ----------
function ssIDB(){const S=ssCfg();if(S.dbp)return S.dbp;S.dbp=new Promise(res=>{try{const I=typeof indexedDB!=='undefined'?indexedDB:null;if(!I||typeof I.open!=='function')return res(null);
  const rq=I.open(S.db,1);rq.onupgradeneeded=()=>{try{rq.result.createObjectStore(S.store);}catch(e){}};rq.onsuccess=()=>res(rq.result);rq.onerror=()=>res(null);rq.onblocked=()=>res(null);}catch(e){res(null);}});
 return S.dbp;}
function ssIdbOp(kind,k,v){const S=ssCfg();return ssIDB().then(db=>new Promise(res=>{if(!db)return res(kind==='get'?null:false);try{const tx=db.transaction(S.store,kind==='get'?'readonly':'readwrite'),st=tx.objectStore(S.store);
  const rq=kind==='get'?st.get(k):kind==='put'?st.put(v,k):st.delete(k);let out=kind==='get'?null:true;rq.onsuccess=()=>{if(kind==='get')out=rq.result==null?null:rq.result;};
  tx.oncomplete=()=>res(out);tx.onerror=tx.onabort=()=>res(kind==='get'?null:false);}catch(e){res(kind==='get'?null:false);}})).catch(()=>kind==='get'?null:false);}
function ssMirror(raw){const S=ssCfg();if(!ssParse(raw))return Promise.resolve(false);S.mirrorP=ssIdbOp('put',S.key,{raw,t:Date.now(),v:SAVE_VERSION});return S.mirrorP;}
function ssMirrorGet(){return ssIdbOp('get',ssCfg().key).then(m=>m&&typeof m.raw==='string'&&ssParse(m.raw)?m:null);}
// ---------- dauerhafter Speicher ----------
function ssPersistOnce(){const S=ssCfg();if(S.persist)return;S.persist='gefragt';try{if(ssGet(S.pkey)!=null)return;const st=typeof navigator!=='undefined'&&navigator.storage;
 if(st&&typeof st.persist==='function'){const p=st.persist();if(p&&typeof p.then==='function')p.then(ok=>{S.persist=ok?'ja':'nein';ssSet(S.pkey,ok?'1':'0');},()=>{});}}catch(e){}}
function ssStandalone(){try{return!!(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true);}catch(e){return false;}}
// ---------- Migration (umhüllt migrateSave aus 21-species.js) ----------
function ssRenameMoves(g){const R=MOVE_RENAME,seen=new Set();
 const fix=(o,d)=>{if(!o||typeof o!=='object'||d>7||seen.has(o))return;seen.add(o);if(Array.isArray(o)){for(const x of o)fix(x,d+1);return;}
  if('s' in o&&Array.isArray(o.moves)){o.moves.forEach((mv,i)=>{if(typeof mv==='string'&&R[mv])o.moves[i]=R[mv];else if(mv&&R[mv.id])mv.id=R[mv.id];});if(Array.isArray(o.known))o.known=o.known.map(k=>R[k]||k);}
  for(const k in o)if(o[k]&&typeof o[k]==='object')fix(o[k],d+1);};
 try{fix(g.team,0);fix(g.box,0);fix(g.eggs,0);for(const k of['daycare','pension','party'])if(g[k])fix(g[k],0);
  for(const a in R){const ia='rolle_'+a,ib='rolle_'+R[a],fa='sc_'+a,fb='sc_'+R[a];
   if(g.bag&&g.bag[ia]!=null){g.bag[ib]=(g.bag[ib]|0)+(g.bag[ia]|0);delete g.bag[ia];}
   if(g.flags&&g.flags[fa]!=null){g.flags[fb]=g.flags[fb]||g.flags[fa];delete g.flags[fa];}
   if(Array.isArray(g.foundItems))g.foundItems=g.foundItems.map(f=>f===fa?fb:f);}}catch(e){}}
function ssBeforeMigrate(g){try{const sv=+g.saveVersion||0,av=ssAppVer(),old=sv<SAVE_VERSION,upd=!!(av&&g.appVer&&g.appVer!==av);if(!old&&!upd)return;
  if(!ssValid(g)||!((g.team&&g.team.length)||(g.badges&&g.badges.length)))return;// frisches/leeres Spiel: nichts zu sichern
  saveBackup(old?String(sv):sv+'_'+String(g.appVer).replace(/[^\w.-]/g,''),JSON.stringify(g),old?'vor Migration':'vor Update');}catch(e){}}
var _migSS=migrateSave;migrateSave=function(g){if(g&&typeof g==='object'){ssBeforeMigrate(g);ssRenameMoves(g);}const r=_migSS.apply(this,arguments);
 if(g&&typeof g==='object'){g.saveVersion=SAVE_VERSION;const av=ssAppVer();if(av)g.appVer=av;if(!g.gid)g.gid=ssGid();}return r;};
// Neues Spiel trägt gleich Version + Kennung (keine „Altstand“-Sicherung beim ersten Start)
var _freshSS=freshG;freshG=function(){const g=_freshSS.apply(this,arguments);if(g){g.saveVersion=SAVE_VERSION;g.gid=ssGid();const av=ssAppVer();if(av)g.appVer=av;}return g;};
// ---------- Schreiben (aus 15-ui save()) ----------
function saveWrite(s){const S=ssCfg();if(typeof G==='undefined'||!ssValid(G)||typeof s!=='string'||!ssParse(s))return false;// Schreibschutz
 const old=ssGet(S.key);
 if(old&&old!==s){const og=ssParse(old);
  if(!og)ssKeepBroken(old);
  else if((og.gid&&G.gid&&og.gid!==G.gid)||(!og.gid&&ssWorth(G)<ssWorth(og)))saveBackup('alt',old,'überschrieben');// anderes Spiel → altes sichern
  else if(s.length<old.length*.5)saveBackup('gross',old,'stark geschrumpft');}
 if(!ssSet(S.key,s)){const L=saveBackups();while(L.length){const o=L.shift();ssDel(o.k);ssSet(S.list,JSON.stringify(L));if(ssSet(S.key,s))break;}if(ssGet(S.key)!==s)return false;}
 ssMirror(s);ssPersistOnce();return true;}
// ---------- Lesen (aus 15-ui loadSave()) ----------
function saveRead(){const S=ssCfg(),raw=ssGet(S.key);if(raw==null||raw==='')return null;const g=ssParse(raw);if(g)return g;
 ssKeepBroken(raw);const b=ssNewestBackup();
 if(b&&ssSet(S.key,b.raw)){S.notice={k:'bak',t:b.t};ssNoteSoon();return ssParse(b.raw);}
 S.notice={k:'broken'};ssNoteSoon();return null;}
// Fortsetzen ohne ladbaren Stand: Hinweis statt stillem Neustart (true = Hinweis gezeigt)
function saveMissing(){const S=ssCfg(),raw=ssGet(S.key);if(raw||(S.notice&&S.notice.k==='broken')){ssNote('broken');return true;}return false;}
// „Neu starten“: alten Stand sichern, Spiegel löschen (sonst käme er beim nächsten Start zurück)
function saveWipe(){const S=ssCfg(),raw=ssGet(S.key);if(raw&&ssParse(raw))saveBackup('neustart',raw,'vor Neustart');ssDel(S.key);return ssIdbOp('del',S.key);}
// Import/Wiederherstellen: aktuellen Stand vorher sichern, dann schreiben + spiegeln
function saveImport(raw){const S=ssCfg(),g=ssParse(raw);if(!g)return false;const cur=ssGet(S.key);
 if(cur&&cur!==raw){if(ssParse(cur))saveBackup('vorimport',cur,'vor dem Laden');else ssKeepBroken(cur);}
 if(!ssSet(S.key,raw))return false;ssMirror(raw);return true;}
// ---------- Start: IndexedDB-Wiederherstellung, Spiegel anlegen ----------
function saveBoot(){const S=ssCfg(),raw=ssGet(S.key);
 if(ssParse(raw))return ssMirrorGet().then(m=>{if(!m||m.raw!==raw)return ssMirror(raw).then(()=>'gespiegelt');return'ok';});
 return ssMirrorGet().then(m=>{const now=ssGet(S.key);if(ssParse(now))return'ok';
  if(m){if(now)ssKeepBroken(now);if(ssSet(S.key,m.raw)){S.notice={k:'idb',t:m.t};try{const c=document.getElementById('tCont');if(c)c.hidden=false;}catch(e){}ssNoteSoon();return'idb';}}
  if(now){if(!S.notice)S.notice={k:'broken'};ssNoteSoon();return'kaputt';}return'leer';});}
// ---------- Code / Datei ----------
function ssB64(bytes){let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(bin);}
function ssUnB64(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
function ssCanZip(){return typeof CompressionStream==='function'&&typeof DecompressionStream==='function'&&typeof Response==='function'&&typeof Blob==='function';}
// Code: „VEYRA1.“ + Base64(deflate(JSON)) – Rückfall „VEYRA0.“ + Base64(JSON)
function saveCode(raw){const plain=()=>'VEYRA0.'+ssB64(new TextEncoder().encode(raw));
 if(!ssCanZip())return Promise.resolve(plain());
 try{return new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer().then(b=>'VEYRA1.'+ssB64(new Uint8Array(b))).catch(plain);}catch(e){return Promise.resolve(plain());}}
// Text (Code oder JSON) → {g,raw} oder {err}
function saveDecode(text){const bad=err=>({err});let t=String(text||'').trim();if(!t)return Promise.resolve(bad('Da ist noch nichts drin. Füge zuerst den Code ein.'));
 const done=raw=>{let g=null,j=true;try{g=JSON.parse(raw);}catch(e){j=false;}if(!j)return bad('Der Code ist nicht vollständig. Kopiere ihn bitte noch einmal ganz.');
  if(!ssValid(g))return bad('Das ist kein Veyra-Spielstand.');return{g,raw:JSON.stringify(g)};};
 try{if(t[0]==='{')return Promise.resolve(done(t));
  const m=t.replace(/\s+/g,'').match(/^VEYRA([01])\.([A-Za-z0-9+/=]+)$/);if(!m)return Promise.resolve(bad('Das ist kein Veyra-Code. Er beginnt mit „VEYRA“.'));
  const bytes=ssUnB64(m[2]);
  if(m[1]==='0')return Promise.resolve(done(new TextDecoder().decode(bytes)));
  if(!ssCanZip())return Promise.resolve(bad('Dieses Gerät kann den Code nicht öffnen. Nimm die Datei.'));
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text().then(done,()=>bad('Der Code ist nicht vollständig. Kopiere ihn bitte noch einmal ganz.'));}
 catch(e){return Promise.resolve(bad('Der Code ist nicht vollständig. Kopiere ihn bitte noch einmal ganz.'));}}
function ssCurrentRaw(){const S=ssCfg();try{if(typeof G!=='undefined'&&ssValid(G)){if(typeof normalizeBox==='function')normalizeBox(G);return JSON.stringify(G);}}catch(e){}const r=ssGet(S.key);return ssParse(r)?r:null;}
function ssDownload(raw){try{const n='veyra-spielstand-'+new Date().toISOString().slice(0,10)+'.json',u=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');
 a.href=u;a.download=n;a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove();},1500);return true;}catch(e){return false;}}
function ssCopy(text,ta){const fb=()=>{try{if(!ta)return false;ta.focus();ta.select();ta.setSelectionRange(0,text.length);return document.execCommand('copy');}catch(e){return false;}};
 try{if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function')return navigator.clipboard.writeText(text).then(()=>true,()=>fb());}catch(e){}return Promise.resolve(fb());}
// ---------- Hinweis-Seite (kein confirm/alert) ----------
function ssH(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function ssWhen(t){try{const d=new Date(t);return d.toLocaleDateString('de-DE',{day:'numeric',month:'numeric'})+' '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}catch(e){return'';}}
var SS_NOTE_T;
function ssNoteSoon(){clearTimeout(SS_NOTE_T);SS_NOTE_T=setTimeout(()=>{const S=ssCfg();if(S.notice)ssNote(S.notice.k);},60);}
function ssNote(k){const S=ssCfg();let el=document.getElementById('ssNote');if(!el){el=document.createElement('div');el.id='ssNote';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.body.appendChild(el);}
 const T={bak:['Sicherung geladen','Dein Spielstand war kaputt. Ich habe die letzte Sicherung geholt. Du kannst weiterspielen.'],
  idb:['Spielstand gerettet','Dein Spielstand war weg. Ich habe ihn aus der Sicherung geholt. Du kannst weiterspielen.'],
  broken:['Spielstand kaputt','Dein Spielstand lässt sich nicht öffnen. Er ist aufgehoben. Hast du einen Spielstand-Code? Dann füge ihn ein.']}[k]||['Hinweis',''];
 el.innerHTML=`<div class="ssCard"><b>${T[0]}</b><p>${T[1]}</p><div class="btns"></div></div>`;const bx=el.querySelector('.btns');
 const btn=(t,f,c)=>{const b=document.createElement('button');b.className='pill'+(c?' '+c:'');b.textContent=t;b.onclick=()=>{el.hidden=true;S.notice=null;try{sfx('tap');}catch(e){}f&&f();};bx.appendChild(b);return b;};
 if(k==='broken'){btn('Code einfügen',()=>ssOpenImport(),'go');btn('Später');}
 else{const c=document.getElementById('tCont');btn('Weiterspielen',()=>{const t=document.getElementById('title');if(t&&!t.hidden&&c&&!c.hidden)c.click();},'go');btn('OK');}
 el.hidden=false;}
function ssOpenImport(){try{rSettings._adv=1;rSettings._ssImp=1;const o=document.getElementById('opts');if(o&&(typeof mode==='undefined'||mode==='title')){o.hidden=false;rSettings(document.getElementById('optBody'));}
 else if(typeof openMenu==='function')openMenu('game');}catch(e){}}
// ---------- Optionen › Erweitert ----------
function ssSettings(el){const host=el.querySelector('details.adv>.opts');if(!host)return;
 const row=(label,desc)=>{const r=document.createElement('div');r.className='orow wide ssRow';r.innerHTML=`<div><b>${label}</b>${desc?`<p class="muted">${desc}</p>`:''}</div>`;host.appendChild(r);return r;};
 const btn=(box,t,f,c)=>{const b=document.createElement('button');b.className='pill'+(c?' '+c:'');b.textContent=t;b.onclick=e=>{try{sfx('tap');}catch(x){}f(e);};box.appendChild(b);return b;};
 const msg=(box,t,c)=>{let m=box.querySelector('.ssMsg');if(!m){m=document.createElement('p');m.className='ssMsg';m.setAttribute('role','status');box.appendChild(m);}m.className='ssMsg'+(c?' '+c:'');m.textContent=t;};
 const area=(ro)=>{const ta=document.createElement('textarea');ta.className='ssCode';ta.rows=4;ta.spellcheck=false;ta.setAttribute('autocomplete','off');ta.setAttribute('autocapitalize','off');if(ro){ta.readOnly=true;ta.addEventListener('focus',()=>ta.select());}
  ['keydown','keyup','keypress'].forEach(t=>ta.addEventListener(t,e=>e.stopPropagation()));return ta;};
 // 1) Sichern
 const cur=ssCurrentRaw(),r1=row('Spielstand sichern','Du bekommst einen Code. Heb ihn gut auf. Damit holst du dein Spiel zurück.');
 const b1=document.createElement('div');b1.className='btns';r1.appendChild(b1);const box1=document.createElement('div');box1.className='ssBox';box1.hidden=true;r1.appendChild(box1);
 let codeP=null,ta1=null;const getCode=()=>{if(!codeP)codeP=saveCode(cur);return codeP;};
 const showCode=()=>getCode().then(c=>{if(!ta1){ta1=area(true);box1.prepend(ta1);}ta1.value=c;box1.hidden=false;return c;});
 if(!cur){msg(r1,'Noch kein Spielstand da.');}
 else{btn(b1,'Code zeigen',()=>showCode().then(()=>{msg(box1,'Markiere den Code und kopiere ihn.');ta1.focus();}));
  btn(b1,'Kopieren',()=>showCode().then(c=>ssCopy(c,ta1)).then(ok=>msg(box1,ok?'Kopiert! Füge den Code in eine Notiz ein.':'Kopieren ging nicht. Markiere den Code und kopiere ihn selbst.',ok?'ok':'bad')));
  btn(b1,'Als Datei',()=>{const ok=ssDownload(cur);showCode().then(()=>msg(box1,ok?'Datei wird gespeichert. Klappt das nicht? Dann nimm den Code.':'Datei geht hier nicht. Nimm den Code.',ok?'':'bad'));});}
 // 2) Laden (Code/Datei) mit Sicherheitsabfrage als Seiten-UI
 const r2=row('Spielstand laden','Füge einen Code ein oder wähle eine Datei.'),b2=document.createElement('div');b2.className='btns';r2.appendChild(b2);
 const box2=document.createElement('div');box2.className='ssBox';box2.hidden=!rSettings._ssImp;r2.appendChild(box2);rSettings._ssImp=0;
 const ta2=area(false);ta2.placeholder='Code hier einfügen (VEYRA…)';box2.appendChild(ta2);const b2b=document.createElement('div');b2b.className='btns';box2.appendChild(b2b);
 const ask=document.createElement('div');ask.className='ssAsk';ask.hidden=true;r2.appendChild(ask);
 const askFor=(g,raw)=>{ask.innerHTML=`<b>Gefunden: ${ssH(saveSummary(g))}</b><p>${cur?'Dein jetziges Spiel wird ersetzt. Keine Sorge: Es wird vorher gesichert.':'Dieses Spiel wird geladen.'}</p><div class="btns"></div>`;
  const bb=ask.querySelector('.btns');btn(bb,'Ja, laden',()=>ssApply(raw,ask),'go');btn(bb,'Abbrechen',()=>{ask.hidden=true;});ask.hidden=false;ask.scrollIntoView&&ask.scrollIntoView({block:'nearest'});};
 const check=text=>saveDecode(text).then(r=>{if(r.err){ask.hidden=true;msg(box2,r.err,'bad');return;}msg(box2,'Der Code passt.','ok');askFor(r.g,r.raw);});
 btn(b2,'Code einfügen',()=>{box2.hidden=false;ta2.focus();});
 const fi=document.createElement('input');fi.type='file';fi.accept='.json,.txt,application/json,text/plain';fi.hidden=true;r2.appendChild(fi);
 fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;box2.hidden=false;if(f.size>4e6){msg(box2,'Die Datei ist zu groß.','bad');return;}
  const rd=new FileReader();rd.onload=()=>{ta2.value=String(rd.result||'');check(ta2.value);};rd.onerror=()=>msg(box2,'Die Datei ließ sich nicht lesen.','bad');rd.readAsText(f);fi.value='';};
 btn(b2,'Datei wählen',()=>fi.click());btn(b2b,'Prüfen',()=>check(ta2.value),'go');
 // 3) Sicherungen auf diesem Gerät
 const L=saveBackups().slice().sort((a,b)=>b.t-a.t).map(e=>({e,raw:ssGet(e.k)})).filter(x=>ssParse(x.raw));
 const r3=row('Sicherungen auf diesem Gerät','Das Spiel sichert sich selbst, z. B. vor einem Update.');
 if(!L.length)msg(r3,'Noch keine Sicherung da.');
 for(const{e,raw}of L){const g=ssParse(raw),d=document.createElement('div');d.className='ssBak';d.innerHTML=`<span><b>${ssH(saveSummary(g))}</b><small>${ssH(ssWhen(e.t))}${e.why?' · '+ssH(e.why):''}</small></span>`;
  btn(d,'Laden',()=>askFor(g,raw));r3.appendChild(d);}
 // 4) Dauerhaft speichern (Homescreen-Hinweis)
 const r4=row('Spielstand dauerhaft behalten',ssStandalone()?'Veyra ist auf deinem Homescreen. So bleibt dein Spielstand am sichersten.':'Tipp: Füge Veyra zum Homescreen hinzu. Dann bleibt dein Spielstand sicher. Sichere ab und zu den Code.');
 try{const st=navigator.storage;if(st&&typeof st.persisted==='function')st.persisted().then(p=>{if(p)msg(r4,'Dein Gerät hebt den Spielstand dauerhaft auf.','ok');},()=>{});}catch(e){}}
function ssApply(raw,ask){if(typeof mode!=='undefined'&&mode==='battle'){ask.querySelector('p').textContent='Bitte erst den Kampf beenden.';return;}
 if(!saveImport(raw)){ask.querySelector('p').textContent='Laden ging nicht. Ist der Speicher voll?';return;}
 try{G=ssParse(raw);const o=document.getElementById('opts');if(o)o.hidden=true;if(typeof closeMenu==='function'&&!document.getElementById('menu').hidden)closeMenu();start();toast('Spielstand geladen');}
 catch(e){try{toast('Spielstand gespeichert. Bitte neu starten.');}catch(x){}}}
var _rSetSS=rSettings;rSettings=function(el){const r=_rSetSS.apply(this,arguments);try{ssSettings(el);}catch(e){}return r;};
// Toasts ebenfalls durch den Kanon-Filter (QA T1: alte Begriffe nie sichtbar)
var _toastSS=toast;toast=function(t){return _toastSS.call(this,typeof kanonText==='function'?kanonText(t):t);};
try{saveBoot();}catch(e){}
