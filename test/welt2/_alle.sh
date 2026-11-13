#!/bin/bash
# Welt-Grafik Runde 5: alle Browser-Läufe in EINER Sperre
cd /home/claude/veyra
LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT
echo "== Budget ohne LOD"; NOLOD=1 timeout 300 node test/welt2/_budget.mjs kupferhain 4 11 up
echo "== Budget mit LOD"; timeout 300 node test/welt2/_budget.mjs kupferhain 4 11 up
echo "== Budget Morgenau mit LOD"; timeout 300 node test/welt2/_budget.mjs morgenau 9 3 down | tail -2
echo "== Bilder"; SZENEN='{"morgenau":["morgenau",9,3,"down",700],"labor":["morgenau",12,9,"left",700],"laden":["kupferhain",13,11,"up",700],"station":["kupferhain",4,11,"up",700]}' MODELLE=1 timeout 700 node test/welt2/shots.mjs r5 hoch 2>&1 | grep -v "^ "
echo "== Smoke"; timeout 600 node test/smoke.mjs 2>&1 | tail -1
echo "== Übergänge (Schalter an)"; timeout 1500 node test/welt2/_ueb_m3.mjs 2>&1 | tail -3
echo FERTIG
