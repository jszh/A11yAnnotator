# PP-OCRv6 sidecar — `ocr_image_text`

The OCR engine behind the **non-authoritative** `ocr_image_text` shadow tool (the Phase-2 LLM judge's
12th CDP tool). It reads the *rendered pixels* of a crop and returns the recognised text + per-line boxes +
confidences — for images-of-text (1.4.5), a wordmark/label the vision pass can't resolve, or comparing
rendered text to the alt/accessible name. It is an **objective reading, never a verdict** — the model
interprets it, and the verdict stays canary-capped shadow like the rest of the LLM lane.

## Why a sidecar in its own venv
PaddleOCR (PP-OCRv6, shipped in paddleocr 3.7.0 on 2026-06-11) is a Python/`paddlepaddle` stack. To keep
that heavy dependency from touching the Node harness, it lives in an **isolated venv** (`./.venv`, gitignored)
and runs as a long-lived subprocess that the Node side (`scripts/v3/lib/ocr-sidecar.js`) spawns lazily,
reuses across calls (a warm second call is ~150ms), and kills when the tool session closes.

## Setup
```sh
bash scripts/v3/ocr/setup.sh
```
Models download to `~/.paddlex` on first use. Until this is run, `ocr_image_text` returns
`{error:'ocr-unavailable'}` and the harness treats OCR as INCONCLUSIVE — **nothing else is affected**
(the tool is opt-in; it only runs inside the `V3_LLM_TOOLS` lane, which is itself behind `V3_LLM`).

## Tuning knobs (env)
| var | default | meaning |
|-----|---------|---------|
| `V3_OCR_PYTHON` | `scripts/v3/ocr/.venv/bin/python` | interpreter that runs the sidecar |
| `V3_OCR_SCRIPT` | `scripts/v3/ocr/ocr_sidecar.py` | the sidecar script |
| `V3_OCR_STARTUP_TIMEOUT_MS` | `180000` | budget for model load + warmup on first spawn |
| `V3_OCR_CALL_TIMEOUT_MS` | `30000` | per-recognise timeout |

## Files
- `ocr_sidecar.py` — loads PP-OCRv6 once, warms it, then serves newline-JSON `{id,image_b64}` → `{id,ok,text,lines}`.
- `requirements.txt` — pinned `paddlepaddle==3.3.1`, `paddleocr==3.7.0` (verified on arm64 macOS / py3.11).
- `setup.sh` — creates the venv and installs the pins.
