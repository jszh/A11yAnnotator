#!/usr/bin/env python3
"""PP-OCRv6 sidecar for the v3 harness' non-authoritative `ocr_image_text` shadow tool.

Loads the PaddleOCR (PP-OCRv6) model ONCE, then serves newline-delimited JSON requests on stdin and
writes newline-delimited JSON responses on stdout. The Node side (ocr-sidecar.js) owns the process
lifecycle (lazy spawn, reuse, kill on tool-session close). This script NEVER emits a verdict — it
returns the raw recognised text + per-line boxes + confidences; the model interprets them.

Protocol (one JSON object per line):
  ->  {"cmd": "ping"}                                  <-  {"ok": true, "ready": true}
  ->  {"id": 1, "image_b64": "<png base64>"}           <-  {"id": 1, "ok": true, "text": "...",
                                                            "lines": [{"text": "...", "score": 0.99, "box": [[x,y],...]}]}
  ->  malformed / failing request                      <-  {"id": ?, "ok": false, "error": "..."}
On startup, after the model is warm, prints exactly:   {"ready": true, "engine": "PP-OCRv6"}
"""
import sys, os, io, json, base64, traceback

def _eprint(*a):
    print(*a, file=sys.stderr, flush=True)

def _load_engine():
    """Construct a PaddleOCR engine pinned to PP-OCRv6, degrading gracefully across 3.x API shapes."""
    from paddleocr import PaddleOCR
    # The doc-orientation / unwarping / textline-orientation sub-models are document-scan features we don't
    # want for a UI crop — disable them for speed + determinism. Pin PP-OCRv6 when the kwarg is supported.
    common = dict(use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False)
    for kwargs in ({**common, "ocr_version": "PP-OCRv6"}, common, {"ocr_version": "PP-OCRv6"}, {}):
        try:
            return PaddleOCR(**kwargs)
        except (TypeError, ValueError) as e:
            _eprint(f"[ocr_sidecar] PaddleOCR({kwargs}) rejected: {e}")
            continue
    # last resort — let any remaining error propagate so startup fails loudly
    return PaddleOCR()

def _to_ndarray(image_b64):
    import numpy as np
    from PIL import Image
    raw = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    return np.array(img)

def _predict(engine, arr):
    """Run inference and normalise the 3.x result into lines=[{text,score,box}] regardless of API shape."""
    # PaddleOCR 3.x: engine.predict(input=ndarray) -> list of result objects with a dict view.
    try:
        results = engine.predict(arr)
    except (AttributeError, TypeError):
        results = engine.ocr(arr)  # older 2.x fallback
    lines = []
    for res in (results or []):
        # 3.x result objects expose a dict (res.json / res['res'] / direct mapping); be liberal.
        d = None
        for getter in (lambda r: r.json.get("res", r.json) if hasattr(r, "json") and isinstance(r.json, dict) else None,
                       lambda r: dict(r) if isinstance(r, dict) else None,
                       lambda r: r.get("res") if isinstance(r, dict) else None):
            try:
                d = getter(res)
            except Exception:
                d = None
            if isinstance(d, dict):
                break
        if isinstance(d, dict) and ("rec_texts" in d or "rec_text" in d):
            texts = d.get("rec_texts") or d.get("rec_text") or []
            scores = d.get("rec_scores") or d.get("rec_score") or []
            polys = d.get("rec_polys") or d.get("dt_polys") or d.get("rec_boxes") or []
            for i, t in enumerate(texts):
                box = polys[i] if i < len(polys) else None
                lines.append({
                    "text": t,
                    "score": float(scores[i]) if i < len(scores) else None,
                    "box": _box_to_list(box),
                })
        elif isinstance(res, (list, tuple)):
            # 2.x shape: [ [box, (text, score)], ... ]
            for item in res:
                try:
                    box, (text, score) = item[0], item[1]
                    lines.append({"text": text, "score": float(score), "box": _box_to_list(box)})
                except Exception:
                    continue
    return lines

def _box_to_list(box):
    if box is None:
        return None
    try:
        return [[float(p[0]), float(p[1])] for p in box]
    except Exception:
        try:
            return [float(v) for v in box]  # flat [x1,y1,x2,y2]
        except Exception:
            return None

def _warmup(engine):
    """Force the first-run model download + a JIT inference NOW, so the `ready` line means fully-warm and
    every subsequent recognize() is fast (the v6 models download on the first predict, not on construction)."""
    try:
        import numpy as np
        engine.predict(np.full((32, 320, 3), 255, dtype=np.uint8))
    except Exception as e:
        _eprint(f"[ocr_sidecar] warmup predict failed (non-fatal): {e}")

def main():
    try:
        engine = _load_engine()
        _warmup(engine)
    except Exception as e:
        print(json.dumps({"ready": False, "error": f"engine-load-failed: {e}"}), flush=True)
        _eprint(traceback.format_exc())
        return 1
    print(json.dumps({"ready": True, "engine": "PP-OCRv6"}), flush=True)
    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            req = json.loads(raw)
        except Exception:
            print(json.dumps({"ok": False, "error": "bad-json"}), flush=True)
            continue
        if req.get("cmd") == "ping":
            print(json.dumps({"ok": True, "ready": True}), flush=True)
            continue
        rid = req.get("id")
        try:
            arr = _to_ndarray(req["image_b64"])
            lines = _predict(engine, arr)
            text = "\n".join(l["text"] for l in lines if l.get("text"))
            print(json.dumps({"id": rid, "ok": True, "text": text, "lines": lines}), flush=True)
        except Exception as e:
            print(json.dumps({"id": rid, "ok": False, "error": str(e)[:300]}), flush=True)
    return 0

if __name__ == "__main__":
    sys.exit(main())
