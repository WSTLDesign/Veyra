// Terras – Starter-Linien in drei Ansichten (Dreiviertel, Seite, Front) → test/terras_starter_glut.png / _flut.png / _flora.png. Nur unter der Chromium-Sperre.
import { execFileSync } from 'child_process';
for (const [n, ids] of [['glut', '1,2,3'], ['flut', '4,5,6'], ['flora', '7,8,9']])
  console.log(n, execFileSync('node', ['test/terras_sheet.mjs', 'test/terras_starter_' + n + '.png', ids, '3', '340', 'qsf'], { cwd: new URL('..', import.meta.url).pathname }).toString().trim().split('\n').join(' | '));
