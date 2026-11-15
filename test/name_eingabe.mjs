// Namenseingabe: Tasten W/A/S/D, Pfeile, Leertaste, E/X/M, Shift müssen im Textfeld ankommen (kein preventDefault, keine Bewegung)
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 1 });
await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(new URL('../dist/index.html', import.meta.url).href, { waitUntil: 'load' });
await page.click('#iPrompt'); await page.waitForTimeout(1200);
await page.click('#iSkip'); await page.waitForTimeout(900);
let ok = 0, bad = 0;
const check = (name, c) => { if (c) { ok++; console.log('✓', name); } else { bad++; console.log('✗', name); } };
// Echte Eingabe in ein Textfeld im Weltmodus (wie Charaktererstellung): Tasten tippen, Wert prüfen
const r = await page.evaluate(async () => {
  mode = 'world'; const inp = document.createElement('input'); inp.id = 'ccName'; inp.maxLength = 12; document.body.appendChild(inp); inp.focus();
  const codes = [['KeyW', 'w'], ['KeyA', 'a'], ['KeyS', 's'], ['KeyD', 'd'], ['KeyE', 'e'], ['KeyX', 'x'], ['KeyM', 'm'], ['Space', ' ']];
  const prevented = [], moved = []; const h0 = held, m0 = mode;
  for (const [code, key] of codes) { const e = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }); inp.dispatchEvent(e); if (e.defaultPrevented) prevented.push(code); if (held !== h0 || STICK.x || STICK.y || mode !== m0) moved.push(code); }
  const sh = new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft', bubbles: true, cancelable: true }); inp.dispatchEvent(sh);
  const run = P.run; inp.remove(); return { prevented, moved, run, mode };
});
check('keine Taste wird im Textfeld abgefangen (' + r.prevented.join(',') + ')', r.prevented.length === 0);
check('keine Bewegung/Modus-Änderung durch Tippen (' + r.moved.join(',') + ')', r.moved.length === 0 && r.mode === 'world');
check('Shift im Textfeld startet kein Rennen', !r.run);
// Echtes Tippen über die Tastatur in das Feld
const typed = await page.evaluate(() => { const inp = document.createElement('input'); inp.id = 'tn'; document.body.appendChild(inp); inp.focus(); return 1; });
await page.keyboard.type('Wasda xm');
const val = await page.evaluate(() => { const v = document.getElementById('tn').value; document.getElementById('tn').remove(); return v; });
check('getippter Text kommt vollständig an: "' + val + '"', val === 'Wasda xm');
await browser.close();
console.log(`name_eingabe: ${ok} ok, ${bad} fehl`);
process.exit(bad ? 1 : 0);
