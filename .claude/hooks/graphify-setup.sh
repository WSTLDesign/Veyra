#!/usr/bin/env bash
# Installiert Graphify (falls nötig) und hält den Code-Wissensgraphen aktuell.
# Läuft beim Start jeder Claude-Code-Sitzung; braucht Python >= 3.10.
set -u
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0
command -v python3 >/dev/null 2>&1 || { echo "graphify: kein python3 – übersprungen"; exit 0; }
if ! command -v graphify-mcp >/dev/null 2>&1; then
  if command -v uv >/dev/null 2>&1; then uv tool install -q "graphifyy[mcp]" >/dev/null 2>&1
  else pip install -q --break-system-packages "graphifyy[mcp]" >/dev/null 2>&1 || pip install -q "graphifyy[mcp]" >/dev/null 2>&1; fi
fi
command -v graphify >/dev/null 2>&1 || { echo "graphify: Installation fehlgeschlagen"; exit 0; }
# Nur geänderte Dateien werden neu verarbeitet (SHA256-Cache), keine Modellaufrufe.
graphify extract . --code-only >/dev/null 2>&1 && echo "graphify: Wissensgraph aktuell (graphify-out/graph.json)"
exit 0
