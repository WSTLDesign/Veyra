#!/usr/bin/env bash
# Veyra Terra-Serie – baut Modelle mit dem Terra-Baukasten (tbau.py) und komprimiert sie (Draco) nach public/models/terras/<id>.glb
# Aufruf: bash tools/modelle/terras/bauen.sh [001 002 … | alle]   (Blender-Sperre wird genommen; Umgebung wie tools/modelle/bauen.sh)
set -euo pipefail
cd "$(dirname "$0")/../../.."
VENV=${VEYRA_BLENDER_VENV:-/home/claude/.venv-blender}; GTD=${VEYRA_GLTF_TOOLS:-/home/claude/gltf-tools}
LOCK=/home/claude/veyra/.blender.lock; until mkdir "$LOCK" 2>/dev/null; do sleep 5; done; trap 'rmdir "$LOCK"' EXIT
mkdir -p tools/modelle/terras/build public/models/terras
skript(){ case $1 in 001|002|003) echo canide;; 004|005|006) echo robbe;; 007|008|009) echo baer;; 059) echo vogel;; 061) echo schwebe;; 112) echo nager;; esac; }
ARTEN=${*:-alle}; [ "$ARTEN" = alle ] && ARTEN="001 002 003 004 005 006 007 008 009 059 061"
for a in $ARTEN; do
  s=$(skript $a); echo "== t$a ($s) =="
  "$VENV/bin/python" tools/modelle/terras/$s.py $a tools/modelle/terras/build/t$a.glb 2>&1 | grep -E "^\[|Error|Traceback|line " | grep -v EGL | tail -4 || true
  "$GTD/node_modules/.bin/gltf-transform" draco tools/modelle/terras/build/t$a.glb public/models/terras/t$a.glb --method edgebreaker >/dev/null
  ls -l public/models/terras/t$a.glb | awk '{print $5, $9}'
done
