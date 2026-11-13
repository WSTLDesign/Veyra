#!/usr/bin/env bash
# Veyra Pilot 3D-Modelle – komplette Werkzeugkette (reproduzierbar):
#   1. Blender 5.3 als Python-Modul in eigener Umgebung (uv)  2. gltf-transform (npm, außerhalb des Projekts)
#   3. Bauskripte noa.py / funki.py → tools/modelle/build/*.glb (+ Texturen als PNG, Kennzahlen *.json)
#   4. Draco-Kompression → public/models/pilot/<id>.glb
# Aufruf: bash tools/modelle/bauen.sh [noa|funki|alle]
set -euo pipefail
cd "$(dirname "$0")/../.."
VENV=${VEYRA_BLENDER_VENV:-/home/claude/.venv-blender}
GTD=${VEYRA_GLTF_TOOLS:-/home/claude/gltf-tools}
if [ ! -x "$VENV/bin/python" ]; then uv venv "$VENV" --python 3.13 && VIRTUAL_ENV="$VENV" uv pip install bpy==5.3.0 numpy; fi
if [ ! -x "$GTD/node_modules/.bin/gltf-transform" ]; then mkdir -p "$GTD" && (cd "$GTD" && npm init -y >/dev/null && npm i @gltf-transform/cli@4.5.1); fi
mkdir -p tools/modelle/build public/models/pilot
for m in ${1:-alle}; do
  for id in $( [ "$m" = alle ] && echo noa funki || echo "$m" ); do
    echo "== $id =="; "$VENV/bin/python" tools/modelle/$id.py tools/modelle/build/$id.glb 2>&1 | grep -E "^\[|Error|Traceback" || true
    "$GTD/node_modules/.bin/gltf-transform" draco tools/modelle/build/$id.glb public/models/pilot/$id.glb --method edgebreaker
    ls -l public/models/pilot/$id.glb
  done
done
