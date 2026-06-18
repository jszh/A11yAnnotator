#!/usr/bin/env bash
# One-time setup for the PP-OCRv6 sidecar that backs the non-authoritative `ocr_image_text` shadow tool.
# Creates an ISOLATED venv so the heavy paddlepaddle/paddleocr dependency never touches the rest of the
# project (it is gitignored). Re-run after requirements.txt changes. PP-OCRv6 models download to ~/.paddlex
# on first use. Until this is run, ocr_image_text returns {error:'ocr-unavailable'} and the harness treats
# OCR as INCONCLUSIVE — nothing else is affected (the tool is opt-in, non-authoritative shadow).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 -m venv "$DIR/.venv"
"$DIR/.venv/bin/python" -m pip install --upgrade pip
"$DIR/.venv/bin/pip" install -r "$DIR/requirements.txt"
echo "PP-OCRv6 sidecar ready: $DIR/.venv (models download to ~/.paddlex on first OCR call)."
