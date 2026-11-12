// Beenden & PC-Notbremse (12.11.): Knopf „Speichern & schließen“ in der Chronik; Abschalt-Seite; Schutz gegen Einfrieren am PC
// Schnittstellen: quitGame() – speichert, verlässt Vollbild, hält Schleifen/Ton an, versucht window.close(), zeigt sonst die Abschalt-Seite
function quitGame(){
 let ok=false;try{ok=save()!==false;}catch(e){}
 try{if(document.fullscreenElement||document.webkitFullscreenElement){const x=document.exitFullscreen||document.webkitExitFullscreen;const p=x&&x.call(document);if(p&&p.catch)p.catch(()=>{});}}catch(e){}
 window.__quit=1;try{if(typeof LOOP==='object')LOOP.paused=true;}catch(e){}
 try{if(typeof AC!=='undefined'&&AC&&AC.suspend)AC.suspend();}catch(e){}
 try{mode='wait';held=null;}catch(e){}
 const ov=document.createElement('div');ov.id='quitOv';ov.innerHTML='<div class="quitCard"><h2>'+(ok?'Gespeichert.':'Speichern nicht möglich – Stand bleibt wie zuletzt gespeichert.')+'</h2><p>Du kannst das Fenster jetzt schließen.</p><p class="quitHint">Falls es sich nicht von selbst schließt: <b>Alt + F4</b> (PC) oder den Tab schließen.</p><div class="quitBtns"><button type="button" id="quitClose">Fenster schließen</button><button type="button" id="quitBack">Neu laden und weiterspielen</button></div></div>';
 document.body.appendChild(ov);
 // WebGL freigeben (GPU entlasten), erst danach schließen – schließen nur auf Klick, nie automatisch
 const release=()=>{try{for(const r of [typeof R3==='object'&&R3&&R3.r,typeof TR!=='undefined'&&TR&&TR.r,typeof VR!=='undefined'&&VR&&VR.r]){if(r&&r.dispose){try{r.setAnimationLoop&&r.setAnimationLoop(null);}catch(e){}try{r.dispose();}catch(e){}try{r.forceContextLoss();}catch(e){}}}}catch(e){}};
 setTimeout(release,50);
 const canClose=!!window.opener||history.length<=1;
 const tryClose=()=>{try{window.close();}catch(e){}setTimeout(()=>{const h=ov.querySelector('.quitHint');if(h)h.innerHTML='Der Browser erlaubt das automatische Schließen hier nicht. Bitte den <b>Tab schließen</b> (Strg+W) oder <b>Alt+F4</b>.';},400);};
 const cb=ov.querySelector('#quitClose');cb.onclick=tryClose;if(!canClose)cb.textContent='Fenster schließen (falls erlaubt)';
 ov.querySelector('#quitBack').onclick=()=>{try{location.reload();}catch(e){}};
}
// Spielschleife hart anhalten, solange __quit gesetzt ist (LOOP.paused allein stoppt sie nicht)
if(typeof loop==='function'&&!loop._quit){const _loopQ=loop;loop=function(t){if(window.__quit)return;_loopQ(t);};loop._quit=1;}
addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('mQuit');if(b)b.onclick=()=>{try{closeMenu();}catch(e){}quitGame();};});
// Tastenkürzel: Strg+Q (bzw. ⌘+Q wird vom System abgefangen) → speichern & schließen
addEventListener('keydown',e=>{if(e.key&&e.key.toLowerCase()==='q'&&(e.ctrlKey||e.metaKey)&&!e.repeat){e.preventDefault();quitGame();}},{capture:true});
// PC-Notbremse: am PC (keine Touch-Eingabe) nie über 1080 Zeilen rendern, DPR-Deckel 1,25; bei schwachem/Software-Renderer Voreinstellung „niedrig“ und 30 fps
(function(){try{
 const touch=matchMedia('(pointer:coarse)').matches;if(touch)return;
 if(typeof PERF==='object'&&PERF.weak&&SET.quality==='auto'){Object.assign(SET,PRESET.niedrig);SET.quality='niedrig';SET.fs=0;}
 const weak=typeof PERF==='object'&&PERF.weak;
 if(typeof devH==='function'){const _devH=devH;devH=function(){return Math.min(weak?1080:1440,_devH());};}
 if(typeof dprCap==='function'){const _dpr=dprCap;dprCap=function(){return Math.min(weak?1.25:1.5,_dpr());};}
}catch(e){}})();
// Wächter: wenn mehrere Sekunden lang Bilder > 120 ms dauern, Stufe „niedrig“ erzwingen (einmalig), damit der PC nicht einfriert
(function(){let bad=0,done=false;function tick(){if(done)return;try{if(typeof PERF==='object'&&PERF.ft>120){bad++;if(bad>=25){done=true;Object.assign(SET,PRESET.niedrig);SET.quality='niedrig';if(typeof perfSet==='function')perfSet('low');try{applySet();}catch(e){}try{toast('Grafik auf „niedrig“ gestellt, damit es flüssig bleibt');}catch(e){}}}else bad=Math.max(0,bad-1);}catch(e){}}setInterval(tick,200);})();
