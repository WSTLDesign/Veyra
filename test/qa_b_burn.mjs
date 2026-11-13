// Hilfsprozess für test/qa_b_winbattle.mjs --load: erzeugt CPU-Last (Busy-Loop), um Zeitabhängigkeiten sichtbar zu machen.
let x = 0; setInterval(() => { const t = Date.now(); while (Date.now() - t < 80) x += Math.sqrt(x + 1); }, 100);
