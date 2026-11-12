// ===== VEYRA – Staging-Overlay (wird nur in Staging-Builds eingefügt, nie in der Live-Version) =====
// Badge „STAGING“, Debug-Menü, FPS-Anzeige, Fehlerzähler. Alle Spiel-Aufrufe sind abgesichert:
// fehlt eine Funktion in einer späteren Spielversion, wird der Knopf ausgegraut statt das Spiel zu stören.
(function () {
  'use strict';
  var INFO = window.VEYRA_STAGING || {};
  var errors = [];
  window.addEventListener('error', function (e) { errors.push((e.message || 'Fehler') + ' @' + (e.lineno || '?')); upd(); });
  window.addEventListener('unhandledrejection', function (e) { errors.push('Promise: ' + String(e.reason && e.reason.message || e.reason)); upd(); });

  var css = [
    '#stgBadge{position:fixed;z-index:2147483000;top:calc(env(safe-area-inset-top,0px) + 6px);left:50%;transform:translateX(-50%);',
    'display:flex;gap:6px;align-items:center;padding:4px 10px;border-radius:999px;background:#ff8a00;color:#1a0d00;',
    'font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.06em;box-shadow:0 2px 10px #0006;cursor:pointer;user-select:none;-webkit-user-select:none;opacity:.92}',
    '#stgBadge .e{background:#b00020;color:#fff;border-radius:999px;padding:1px 6px;display:none}',
    '#stgBadge .f{font-weight:600;opacity:.8}',
    '#stgPanel{position:fixed;z-index:2147483001;top:calc(env(safe-area-inset-top,0px) + 36px);left:50%;transform:translateX(-50%);',
    'width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 60px);overflow:auto;background:#141c20f2;color:#eef3f5;',
    'border:2px solid #ff8a00;border-radius:12px;padding:12px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px #000a}',
    '#stgPanel h3{margin:10px 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#ffb35c}',
    '#stgPanel h3:first-child{margin-top:0}',
    '#stgPanel .row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
    '#stgPanel button{min-height:40px;padding:0 12px;border-radius:8px;border:1px solid #ff8a0088;background:#22303a;color:#fff;font:600 13px system-ui,sans-serif}',
    '#stgPanel button:disabled{opacity:.35}',
    '#stgPanel input,#stgPanel select{min-height:40px;border-radius:8px;border:1px solid #fff3;background:#0d1417;color:#fff;padding:0 8px;font:13px system-ui,sans-serif}',
    '#stgPanel input[type=number]{width:72px}',
    '#stgPanel .meta{opacity:.75;font-size:12px}',
    '#stgPanel pre{white-space:pre-wrap;background:#0006;border-radius:8px;padding:8px;max-height:140px;overflow:auto;font-size:11px}',
    '#stgToast{position:fixed;z-index:2147483002;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);left:50%;transform:translateX(-50%);',
    'background:#ff8a00;color:#1a0d00;padding:8px 14px;border-radius:10px;font:600 13px system-ui,sans-serif;display:none}'
  ].join('');

  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function has(name) { try { return typeof window[name] === 'function' || typeof eval(name) === 'function'; } catch (e) { return false; } }
  function game() { try { return typeof G !== 'undefined' && G ? G : null; } catch (e) { return null; } }
  function toast(t) { var x = document.getElementById('stgToast'); x.textContent = t; x.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(function () { x.style.display = 'none'; }, 2200); }
  function safe(label, fn) { return function () { try { fn(); } catch (e) { errors.push('Debug „' + label + '“: ' + e.message); upd(); toast('Fehler: ' + e.message); } }; }
  function needGame() { if (!game()) throw new Error('Erst ein Spiel starten oder laden'); return game(); }
  function persist() { try { if (typeof save === 'function') save(); } catch (e) {} }

  var fps = 0;
  (function loop() { var n = 0, t0 = performance.now(); function f(t) { n++; if (t - t0 >= 1000) { fps = Math.round(n * 1000 / (t - t0)); n = 0; t0 = t; upd(); } requestAnimationFrame(f); } requestAnimationFrame(f); })();

  function upd() {
    var b = document.getElementById('stgBadge'); if (!b) return;
    b.querySelector('.f').textContent = fps + ' fps';
    var e = b.querySelector('.e'); e.style.display = errors.length ? 'inline' : 'none'; e.textContent = errors.length + ' Fehler';
    var p = document.getElementById('stgErr'); if (p) p.textContent = errors.length ? errors.slice(-30).join('\n') : 'Keine Fehler seit dem Laden.';
  }

  function monOptions() {
    try { return Object.keys(MONS).filter(function (k) { return MONS[k] && MONS[k].n; }).map(function (k) { return '<option value="' + k + '">' + ('00' + k).slice(-3) + ' · ' + MONS[k].n + '</option>'; }).join(''); } catch (e) { return ''; }
  }
  function mapOptions() {
    try { return Object.keys(MAPS).map(function (k) { return '<option value="' + k + '">' + (MAPS[k].name || k) + '</option>'; }).join(''); } catch (e) { return ''; }
  }

  function buildPanel() {
    var p = el('div', { id: 'stgPanel', hidden: '' });
    p.innerHTML =
      '<h3>Staging</h3><div class="meta">Version ' + (INFO.version || '?') + ' · Build ' + (INFO.built || '?') + (INFO.note ? ' · ' + INFO.note : '') +
      '<br>Eigener Spielstand – die Live-Version wird nicht berührt.</div>' +
      '<h3>Schnellstart</h3><div class="row"><button data-a="quick">Neues Testspiel ohne Intro</button></div>' +
      '<h3>Team</h3><div class="row">' +
      '<button data-a="heal">Team heilen</button>' +
      '<input id="stgLv" type="number" min="1" max="100" value="30"><button data-a="level">Level fürs Team setzen</button></div>' +
      '<h3>Kreaturen</h3><div class="row"><select id="stgMon">' + monOptions() + '</select>' +
      '<input id="stgMonLv" type="number" min="1" max="100" value="10">' +
      '<button data-a="give">Ins Team</button><button data-a="wild">Wildkampf</button><button data-a="dex">Dex komplett</button></div>' +
      '<h3>Welt</h3><div class="row"><select id="stgMap">' + mapOptions() + '</select><button data-a="warp">Hinreisen</button>' +
      '<button data-a="items">10× alle Items</button><button data-a="day">Tag/Nacht wechseln</button></div>' +
      '<h3>Spielstand (nur Staging)</h3><div class="row">' +
      '<button data-a="copy">Spielstand kopieren</button><button data-a="paste">Spielstand einfügen</button><button data-a="wipe">Staging-Stand löschen</button></div>' +
      '<h3>Fehlerprotokoll</h3><pre id="stgErr"></pre>' +
      '<div class="row"><button data-a="reload">Neu laden</button><button data-a="update">Auf neue Version prüfen</button><button data-a="close">Schließen</button></div>';
    var A = {
      quick: function () { if (game() && !window.confirm('Laufendes Staging-Spiel verwerfen und neu starten?')) return;
        togglePanel(false); beginGame({}, true); persist(); toast('Testspiel gestartet'); },
      heal: function () { needGame(); healAll(); persist(); toast('Team geheilt'); },
      level: function () { var g = needGame(), l = Math.max(1, Math.min(100, +document.getElementById('stgLv').value || 30));
        g.team.forEach(function (m, i) { var n = mk(m.s, l); n.shiny = m.shiny; n.gender = m.gender; if (m.nick) n.nick = m.nick; g.team[i] = Object.assign(m, { l: n.l, xp: n.xp, hp: n.hp, moves: n.moves, known: n.known }); });
        persist(); toast('Team auf Level ' + l); },
      give: function () { var g = needGame(), s = document.getElementById('stgMon').value, l = +document.getElementById('stgMonLv').value || 10;
        if (g.team.length >= 6) throw new Error('Team ist voll (6)'); g.team.push(mk(isNaN(+s) ? s : +s, l)); caught(isNaN(+s) ? s : +s); persist(); toast('Kreatur ins Team gelegt'); },
      wild: function () { needGame(); var s = document.getElementById('stgMon').value, l = +document.getElementById('stgMonLv').value || 10;
        if (mode !== 'walk' && mode !== 'free' && mode !== 'world') { /* nur Hinweis, viele Modi heißen anders */ }
        togglePanel(false); startBattle({ wild: mk(isNaN(+s) ? s : +s, l) }); },
      dex: function () { needGame(); Object.keys(MONS).forEach(function (k) { if (MONS[k]) caught(isNaN(+k) ? k : +k); }); persist(); toast('Dex vollständig'); },
      warp: function () { needGame(); var id = document.getElementById('stgMap').value; togglePanel(false); loadMap(id); persist(); toast('Gereist nach ' + id); },
      items: function () { var g = needGame(); var keys = Object.keys(g.bag || {}); try { if (typeof ITEMS !== 'undefined') keys = Object.keys(ITEMS); } catch (e) {}
        keys.forEach(function (k) { addItem(k, 10); }); persist(); toast(keys.length + ' Items aufgefüllt'); },
      day: function () { var g = needGame(); g.time = isNight() ? 12 * 60 : 22 * 60; persist(); toast(isNight() ? 'Jetzt Nacht' : 'Jetzt Tag'); },
      copy: function () { var raw = localStorage.getItem(SAVEKEY); if (!raw) throw new Error('Noch kein Staging-Spielstand');
        (navigator.clipboard ? navigator.clipboard.writeText(raw) : Promise.reject()).then(function () { toast('Spielstand kopiert'); }, function () { window.prompt('Spielstand kopieren:', raw); }); },
      paste: function () { var raw = window.prompt('Spielstand einfügen (z. B. aus der Live-Version kopiert):'); if (!raw) return;
        JSON.parse(raw); localStorage.setItem(SAVEKEY, raw); toast('Eingefügt – lade neu'); setTimeout(function () { location.reload(); }, 600); },
      wipe: function () { if (!window.confirm('Staging-Spielstand wirklich löschen? Die Live-Version ist nicht betroffen.')) return;
        Object.keys(localStorage).filter(function (k) { return k.indexOf(INFO.prefix || 'veyra_stg') === 0; }).forEach(function (k) { localStorage.removeItem(k); });
        try { indexedDB.deleteDatabase(INFO.db || 'veyra_stg_save'); } catch (e) {}
        toast('Gelöscht – lade neu'); setTimeout(function () { location.reload(); }, 600); },
      reload: function () { location.reload(); },
      update: function () { if (!navigator.serviceWorker) return location.reload();
        navigator.serviceWorker.getRegistration().then(function (r) { return r ? r.update() : null; }).then(function () { toast('Geprüft – lade neu'); setTimeout(function () { location.reload(); }, 800); }); },
      close: function () { togglePanel(false); }
    };
    var NEEDS = { quick: ['beginGame'], heal: ['healAll'], level: ['mk'], give: ['mk', 'caught'], wild: ['mk', 'startBattle'], dex: ['caught'], warp: ['loadMap'], items: ['addItem'], day: ['isNight'] };
    p.querySelectorAll('button[data-a]').forEach(function (b) {
      var a = b.getAttribute('data-a'); var miss = (NEEDS[a] || []).filter(function (n) { return !has(n); });
      if (miss.length) { b.disabled = true; b.title = 'In dieser Spielversion nicht verfügbar: ' + miss.join(', '); }
      b.addEventListener('click', safe(b.textContent, A[a]));
    });
    ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function (ev) { p.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    return p;
  }

  function togglePanel(on) { var p = document.getElementById('stgPanel'); if (!p) return; if (on === undefined) on = p.hidden; p.hidden = !on; if (on) upd(); }

  function mount() {
    document.head.appendChild(el('style', {}, css));
    var b = el('div', { id: 'stgBadge', role: 'button', 'aria-label': 'Staging-Menü öffnen' }, 'STAGING ' + (INFO.version || '') + ' <span class="f">– fps</span><span class="e"></span>');
    b.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
    ['pointerdown', 'touchstart'].forEach(function (ev) { b.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.body.appendChild(b); document.body.appendChild(buildPanel()); document.body.appendChild(el('div', { id: 'stgToast' }));
    // Tastatur: Strg+Shift+D öffnet das Menü
    window.addEventListener('keydown', function (e) { if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) { e.preventDefault(); togglePanel(); } });
    document.title = '[STAGING] ' + document.title;
    window.VEYRA_STAGING_ERRORS = errors;
    upd();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
