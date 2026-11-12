// Rendert board.html → board.png (ganze Seite). Aufruf: node test/redesign/board_shot.mjs
import { chromium } from 'playwright';
const b = await chromium.launch();const p = await b.newPage({ viewport: { width: 1220, height: 900 }, deviceScaleFactor: 1 });
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.goto(new URL('./board.html', import.meta.url).href, { waitUntil: 'load' });await p.waitForTimeout(500);
await p.screenshot({ path: new URL('./board.png', import.meta.url).pathname, fullPage: true, animations: 'disabled' });
console.log(errs.length?errs.join('\n'):'board ok');await b.close();
