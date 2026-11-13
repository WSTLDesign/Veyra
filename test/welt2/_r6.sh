#!/bin/bash
cd /home/claude/veyra
LOCK=/home/claude/veyra/.chromium.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT
echo "== Smoke"; timeout 900 node test/smoke.mjs 2>&1 | tail -1
echo "== Innen-QA"; timeout 1200 node test/innen_qa.mjs 2>&1 | grep -c "✗"; tail -1 test/innen_qa.log
echo "== Übergänge (Schalter an)"; timeout 1800 node test/welt2/_ueb_m3.mjs 2>&1 | tail -2
echo FERTIG
