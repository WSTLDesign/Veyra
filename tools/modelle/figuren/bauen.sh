#!/usr/bin/env bash
# Veyra Figuren Runde 2 – Bau aller/einzelner Figuren (Blender-Sperre!) → tools/modelle/build/figuren/*.glb → Draco → public/models/figuren/fig_<id>.glb
# Aufruf: bash tools/modelle/figuren/bauen.sh [alle|noa,veyran,…]
set -euo pipefail
cd "$(dirname "$0")/../../.."
VENV=${VEYRA_BLENDER_VENV:-/home/claude/.venv-blender}; GTD=${VEYRA_GLTF_TOOLS:-/home/claude/gltf-tools}
ALLE="noa rayan veyran mama mirael haendler buerger_a buerger_b buerger_c buerger_d"
L=${1:-alle}; [ "$L" = alle ] && L=$ALLE; L=${L//,/ }
mkdir -p tools/modelle/build/figuren public/models/figuren
LOCK=/home/claude/veyra/.blender.lock
for id in $L; do
  until mkdir "$LOCK" 2>/dev/null; do sleep 5; done
  echo "== $id =="; "$VENV/bin/python" tools/modelle/figuren/figuren.py $id tools/modelle/build/figuren/$id.glb 2>&1 | grep -E "^\[|Error|Traceback|line [0-9]" || true
  rmdir "$LOCK"
  "$GTD/node_modules/.bin/gltf-transform" draco tools/modelle/build/figuren/$id.glb public/models/figuren/fig_$id.glb --method edgebreaker >/dev/null
  ls -l public/models/figuren/fig_$id.glb | awk '{print $5, $9}'
done
