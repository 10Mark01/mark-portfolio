#!/usr/bin/env bash
# Rebuild the WebAssembly simulator into ../public/physics/.
# Needs emscripten (emcc). Tested with 3.1.6.
set -euo pipefail
cd "$(dirname "$0")"
OUT=../public/physics

mkdir -p "$OUT/assets"

emcc physics.c -O2 \
  -sASYNCIFY \
  -sMODULARIZE=1 -sEXPORT_NAME=createPhysicsSim \
  -sINVOKE_RUN=0 \
  -sINITIAL_MEMORY=16MB \
  -sEXPORTED_FUNCTIONS='["_run_program","_push_scancode","_image_ptr","_front_buffer_ptr","_char_buffer_ptr","_current_mode","_set_paused"]' \
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -o "$OUT/physics.js"

echo "built:"
ls -la "$OUT"
