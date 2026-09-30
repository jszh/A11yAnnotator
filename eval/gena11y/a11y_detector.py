"""
Adapted from GenA11y A11yDetector/a11y_detector.py.

Changes vs. upstream:
  - OpenAI GPT-4o replaced with a PLUGGABLE cross-family transport, selected by
    the active model string (a11y_detector.configure(model=...)):
      * claude-*  → Python Agent SDK (CLAUDE_CODE_OAUTH_TOKEN, images via Read tool)
      * gemini-*  → Google generativeai generateContent REST (GEMINI_API_KEY)
      * gpt-*/o*  → OpenAI Responses API /v1/responses (OPENAI_API_KEY)
      * chatgpt/* → LiteLLM ChatGPT-subscription Responses transport (OAuth device flow)
    The Gemini/OpenAI transports mirror scripts/v3/lib/llm-agent-adapter.js
    (makeGeminiTransport / makeOpenAITransport) — single-shot judge, no tools,
    vision inlined as base64 (faithful to upstream GenA11y's single-shot design).
  - Output schema changed to our {verdict, confidence, violations[], summary}.
  - Scope limited to SCs in categories.json that GenA11y extraction covers.
  - Thread-safe LLM_STATS + a trace sink so the parallel runner can persist every
    call's prompt, raw response, reasoning/thinking, parsed verdict and usage.
"""

import asyncio
import base64
import json
import os
import re
import tempfile
import threading
import time
import urllib.request

import requests
from dotenv import load_dotenv

from consts import CLAUDE_MODEL, SYSTEM_MESSAGE, TEMP_FILE_FOLDER
from helper import aggregate_responses, chunk_data

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# ---------------------------------------------------------------------------
# Runtime configuration (set by the runner via configure())
# ---------------------------------------------------------------------------

MODEL = CLAUDE_MODEL
EFFORT = None
_LOCK = threading.Lock()
_LLM_SEM = threading.Semaphore(8)          # global cap on concurrent LLM calls
_CTX = threading.local()                    # per-page (sc, file) for trace attribution
TRACE_SINK = None                           # callable(dict) -> None, set by runner
STANCE = 'original'                         # 'original' | 'neutral' (InterA11y's ablation ladder, step 1)

# The ablation ladder's step 1 (intera11y/DESIGN.md §6): GenA11y with only its prompt stance replaced by InterA11y's
# judge stance (intera11y/src/judge/prompt.js) — the same extraction, screenshots, chunking and test rules. The
# original stance asks the model to detect violations, "only flag clear violations", and returns one page verdict in
# which PARTIAL ("evidence is incomplete") counts as a detection; the neutral stance asks for a verdict per element,
# with no instruction favouring either outcome. It carries no evidence standard (InterA11y's judge has one, so that
# arrives with step 2). The reply is mapped back to GenA11y's schema (_normalize_neutral),
# so scoring is unchanged: FAIL elements and page findings are the violations.
SYSTEM_NEUTRAL = (
    'You are an accessibility auditor testing one web page against one WCAG 2.2 success criterion.\n\n'
    "You receive the criterion's test rules and the page's elements that the rules concern, each prefixed with a "
    '[path: /html/...] label giving its XPath, and sometimes a screenshot. For each element, decide whether it meets '
    "the criterion's test condition.\n\n"
    'Verdicts, one per element:\n'
    '- FAIL — the evidence shows the test condition is not met.\n'
    '- PASS — the evidence shows the test condition is met.\n'
    '- NOT_APPLICABLE — the evidence shows the criterion does not apply to this element (say which applicability '
    'condition it lacks).\n'
    '- UNDETERMINED — the evidence supports none of the above.\n\n'
    'If the page has a failure of this criterion that is not one of the listed elements (or only a screenshot is '
    "given), report it under pageFindings with the XPath of the element it concerns if you have it, or null.\n\n"
    'Answer with one JSON object and nothing else:\n'
    '{"elements":[{"xpath":"<the element\'s [path: ...] value, verbatim>","outerHTML":"<opening tag only>",'
    '"verdict":"FAIL|PASS|NOT_APPLICABLE|UNDETERMINED","reason":"<why>"}],\n'
    ' "pageFindings":[{"xpath":"<xpath or null>","outerHTML":"<opening tag, or empty>","reason":"…"}]}'
)

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
OPENAI_BASE = 'https://api.openai.com/v1'

# USD / 1M tokens, standard paid tier (ai.google.dev/gemini-api/docs/pricing, checked 2026-09-06).
# Output includes reasoning/thinking tokens (results/supplementary585-gem37-flash-cost-breakdown.md).
# CORRECTED 2026-09-06: 'gemini-3.5-flash' previously carried 0.30/2.50, which are FLASH-LITE's rates —
# every 3.5-flash baseline run before this commit understated spend ~5x on input and ~3.6x on output.
# 3.7-flash rates are promotional through 2026-12-31 and double on 2027-01-01.
_PRICES = {
    'gemini-3.5-flash-lite': {'in': 0.30, 'out': 2.50},   # must precede 'gemini-3.5-flash' (longest-prefix)
    'gemini-3.5-flash': {'in': 1.50, 'out': 9.00},
    'gemini-3.7-flash': {'in': 0.75, 'out': 3.75},
    'gpt-5.4-mini':     {'in': 0.25, 'out': 2.00},
    'gpt-5.4':          {'in': 1.25, 'out': 10.0},
}
# flex/batch bill at 50% of standard; SERVICE_TIER is set by the runner from --service-tier / env.
_TIER_MULTIPLIER = {'flex': 0.5, 'batch': 0.5}
SERVICE_TIER = os.environ.get('V3_LLM_SERVICE_TIER') or None

# Module-level LLM telemetry the runner surfaces into status.json for the monitor.
LLM_STATS = {
    'calls': 0, 'done': 0,
    'inputTokens': 0, 'outputTokens': 0,
    'cacheReadTokens': 0, 'cacheCreateTokens': 0,
    'costUsd': 0.0,
}


def configure(model: str = None, llm_concurrency: int = None, trace_sink=None,
              effort: str = None, stance: str = None) -> None:
    """Set the active model, reasoning effort, concurrency cap, trace sink, and prompt stance."""
    global MODEL, EFFORT, _LLM_SEM, TRACE_SINK, STANCE
    if stance:
        if stance not in ('original', 'neutral'):
            raise ValueError(f'unknown stance {stance}')
        STANCE = stance
    if model:
        MODEL = model
    EFFORT = effort
    if llm_concurrency:
        _LLM_SEM = threading.Semaphore(llm_concurrency)
    if trace_sink is not None:
        TRACE_SINK = trace_sink


def set_context(sc: str, file: str) -> None:
    """Called by each page worker so traces can be attributed to (sc, file)."""
    _CTX.sc, _CTX.file = sc, file


def _provider() -> str:
    m = MODEL.lower()
    if m.startswith('chatgpt/'):
        return 'chatgpt'
    if m.startswith('gemini'):
        return 'gemini'
    # OpenRouter ids are always 'vendor/model' (qwen/qwen3.8-flash, moonshot/..., x-ai/...).
    # Checked BEFORE the bare gpt/o prefixes so 'openai/gpt-...' routes to OpenRouter rather
    # than to the direct OpenAI transport, which would use the wrong key and base URL.
    if '/' in m:
        return 'openrouter'
    if m.startswith('gpt') or m.startswith('o'):
        return 'openai'
    return 'claude'


# ---------------------------------------------------------------------------
# Content block constructors (same interface as before — transports translate)
# ---------------------------------------------------------------------------

def _b64_image_block(b64_data: str, media_type: str = 'image/png') -> dict:
    return {'type': 'image', 'source': {'type': 'base64', 'media_type': media_type, 'data': b64_data}}


def _url_image_block(url: str) -> dict:
    return {'type': 'image', 'source': {'type': 'url', 'url': url}}


def _text_block(text: str) -> dict:
    return {'type': 'text', 'text': text}


# ---------------------------------------------------------------------------
# Telemetry + trace helpers (thread-safe)
# ---------------------------------------------------------------------------

def _stat_add(input_tok=0, output_tok=0, cache_read=0, cache_create=0, cost=0.0, done=False):
    with _LOCK:
        LLM_STATS['inputTokens'] += int(input_tok or 0)
        LLM_STATS['outputTokens'] += int(output_tok or 0)
        LLM_STATS['cacheReadTokens'] += int(cache_read or 0)
        LLM_STATS['cacheCreateTokens'] += int(cache_create or 0)
        LLM_STATS['costUsd'] += float(cost or 0)
        if done:
            LLM_STATS['done'] += 1


def _price(input_tok: int, output_tok: int) -> float:
    # Longest-prefix match so suffixed/dated ids ('gemini-3.5-flash-lite-preview') price as their family
    # instead of falling through to 0.0 — an absent price silently reading as "free" is how the Gemini
    # runs came to report $0 spend.
    keys = [k for k in _PRICES if (MODEL or '').startswith(k)]
    if not keys:
        return 0.0
    p = _PRICES[max(keys, key=len)]
    mult = _TIER_MULTIPLIER.get(SERVICE_TIER, 1.0)
    return ((input_tok / 1e6) * p['in'] + (output_tok / 1e6) * p['out']) * mult


def _emit_trace(prompt_text, raw, verdict, usage, reasoning, provider, extra=None):
    """Persist one LLM call's full I/O to the trace sink (JSONL) if configured."""
    sink = TRACE_SINK
    if sink is None:
        return
    rec = {
        'sc': getattr(_CTX, 'sc', None),
        'file': getattr(_CTX, 'file', None),
        'model': MODEL,
        'provider': provider,
        'prompt': prompt_text,
        'raw': raw,
        'verdict': verdict,
        'reasoning': reasoning,
        'usage': usage,
    }
    if extra:
        rec.update(extra)
    try:
        with _LOCK:
            sink(rec)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Content preparation
# ---------------------------------------------------------------------------

def _prepare_inline(content_blocks: list) -> tuple[str, list[tuple[str, str]]]:
    """
    Flatten blocks → (prompt_text, images) where images = [(media_type, b64), ...].
    URL images are downloaded and base64-inlined (faithful single-shot vision).
    """
    parts, images = [], []
    for block in content_blocks:
        if block['type'] == 'text':
            parts.append(block['text'])
        elif block['type'] == 'image':
            src = block['source']
            if src['type'] == 'base64':
                images.append((src.get('media_type', 'image/png'), src['data']))
            elif src['type'] == 'url':
                try:
                    data = urllib.request.urlopen(src['url'], timeout=30).read()
                    images.append(('image/png', base64.b64encode(data).decode()))
                    parts.append(f"[image: {src['url']}]")
                except Exception:
                    parts.append(f"[image URL (fetch failed): {src['url']}]")
    return ''.join(parts), images


def _content_blocks_to_cli(content_blocks: list) -> tuple[str, list[str], bool]:
    """Claude path only: decode images to temp PNGs read via the Agent SDK Read tool."""
    prompt_parts, temp_files, has_images = [], [], False
    for block in content_blocks:
        if block['type'] == 'text':
            prompt_parts.append(block['text'])
            continue
        if block['type'] != 'image':
            continue
        has_images = True
        source = block['source']
        if source['type'] == 'base64':
            img_bytes = base64.b64decode(source['data'])
            media_type = source.get('media_type', 'image/png')
            ext = '.png' if 'png' in media_type else '.jpg'
            fd, tmp_path = tempfile.mkstemp(suffix=ext, dir=TEMP_FILE_FOLDER)
            try:
                os.write(fd, img_bytes)
            finally:
                os.close(fd)
            temp_files.append(tmp_path)
            prompt_parts.append(f'\n[Please read and analyze the image at: {tmp_path}]\n')
        elif source['type'] == 'url':
            url = source['url']
            ext = next((e for e in ('.png', '.jpg', '.jpeg', '.gif', '.webp') if e in url.lower()), '.png')
            try:
                fd, tmp_path = tempfile.mkstemp(suffix=ext, dir=TEMP_FILE_FOLDER)
                os.close(fd)
                urllib.request.urlretrieve(url, tmp_path)
                temp_files.append(tmp_path)
                prompt_parts.append(f'\n[Please read and analyze the image at: {tmp_path} (source: {url})]\n')
            except Exception:
                prompt_parts.append(f'\n[Image URL (download failed): {url}]\n')
    if has_images and temp_files:
        prompt_parts.append('\nIMPORTANT: Use the Read tool to view each image file listed above '
                            'before forming your accessibility verdict.\n')
    return ''.join(prompt_parts), temp_files, has_images


# ---------------------------------------------------------------------------
# Transport: Google Gemini (generateContent REST) — single-shot, no tools
# mirrors makeGeminiTransport in scripts/v3/lib/llm-agent-adapter.js
# ---------------------------------------------------------------------------

# Gemini counts THINKING tokens against maxOutputTokens. At effort=high on a real page the model
# routinely spends ~3.9k tokens thinking, so the old flat 4096 budget left ~150 tokens for the answer
# and the JSON came back truncated — which _parse_verdict then turned into a clean "NOT REPRODUCED".
# Size the budget to the thinking level so the answer is not crowded out by the reasoning.
_THINKING_OUTPUT_BUDGET = {'MINIMAL': 8192, 'LOW': 8192, 'MEDIUM': 16384, 'HIGH': 32768}
_MAX_OUTPUT_CEILING = 65536


def _http_openrouter(prompt_text, images, system=SYSTEM_MESSAGE, max_output_tokens=None, _retries=8):
    """OpenAI-compatible chat/completions against OpenRouter.

    Two things make this different from the direct OpenAI transport:

    * COST IS REPORTED, NOT DERIVED. Passing {"usage": {"include": true}} makes OpenRouter return
      usage.cost — the credits actually charged for the call, including its own margin and whatever
      upstream provider it routed to. That is strictly better than a local price table, which is what
      every other transport here needs, so this path returns costUsd and _price() is bypassed for it.
    * MANY OPENROUTER MODELS THINK. qwen3.8-flash spent 68 of 80 completion tokens on reasoning for a
      trivial prompt, and reasoning lands in message.reasoning while the answer lands in
      message.content. A budget sized for the answer alone truncates before any answer is emitted —
      an empty content with finish_reason='length', which upstream would read as "no violations".
      So the budget is generous by default and a truncated reply retries once at double, matching the
      Gemini transport's MAX_TOKENS handling.
    """
    if not OPENROUTER_API_KEY:
        return None, {}, None
    content = [{'type': 'text', 'text': prompt_text}] + [
        {'type': 'image_url', 'image_url': {'url': f'data:{mt};base64,{b64}'}} for mt, b64 in images
    ]
    _level = {'minimal': 8192, 'low': 8192, 'medium': 16384, 'high': 32768}
    budget = max_output_tokens or _level.get(str(EFFORT or 'medium').lower(), 16384)
    # Reasoning effort is a SEPARATE knob from the token budget. Until 2026-09-06 this transport
    # used EFFORT only to size max_tokens, so every OpenRouter run silently used the provider's
    # default reasoning — qwen3.8-flash spends ~715 reasoning tokens/call at default against 26 at
    # 'low', a 27x difference that --effort appeared to control and did not.
    # Only effort low/medium/high are accepted; 'minimal', reasoning.max_tokens and enabled:false
    # are all rejected by this provider ("Provider returned error"), so map onto the three that work.
    _reasoning = {'minimal': 'low', 'low': 'low', 'medium': 'medium',
                  'high': 'high', 'xhigh': 'high', 'max': 'high'}.get(str(EFFORT or '').lower())
    doubled = False
    _last_err = 'none'
    url = f'{OPENROUTER_BASE}/chat/completions'
    headers = {'Authorization': f'Bearer {OPENROUTER_API_KEY}', 'content-type': 'application/json'}
    for attempt in range(_retries + 1):
        body = {
            'model': MODEL,
            'messages': [{'role': 'system', 'content': system},
                         {'role': 'user', 'content': content}],
            'max_tokens': budget,
            'temperature': 0,
            'usage': {'include': True},
        }
        if _reasoning:
            body['reasoning'] = {'effort': _reasoning}
        try:
            r = requests.post(url, json=body, headers=headers, timeout=900)
            if r.status_code == 429 or r.status_code >= 500:
                _last_err = f'http-{r.status_code}'
                # 429 is the dominant failure at high concurrency and it is SUSTAINED, not a blip:
                # linear 2/4/6/8s backoff (20s total) exhausted retries on 12-18% of calls in the
                # 585 runs, and every one of those became a fabricated negative. Exponential with
                # jitter, capped at 60s, gives ~4 min of patience instead of 20 s.
                import random
                time.sleep(min(60, 2 ** attempt) * (1 + random.random() * 0.3))
                continue
            if not r.ok:
                return None, {'error': f'http-{r.status_code}'}, None
            j = r.json()
            if j.get('error'):
                _last_err = str(j['error'])[:160]
                # OpenRouter reports upstream failures as HTTP 200 with an error body ("Provider
                # returned error"), which are transient and frequent at high concurrency. Without a
                # retry these become no-verdicts — i.e. fabricated "no violations found" rows.
                if attempt < _retries:
                    time.sleep(2 * (attempt + 1))
                    continue
                return None, {'error': str(j['error'])[:200]}, None
            ch = (j.get('choices') or [{}])[0]
            msg = ch.get('message') or {}
            answer = msg.get('content') or ''
            reasoning = msg.get('reasoning') or ''
            u = j.get('usage') or {}
            usage = {
                'input_tokens': u.get('prompt_tokens', 0),
                'output_tokens': u.get('completion_tokens', 0),
                'reasoning_tokens': (u.get('completion_tokens_details') or {}).get('reasoning_tokens', 0),
                'finishReason': ch.get('finish_reason'),
                # OpenRouter bills this exactly; do NOT re-derive it from a local table.
                'costUsd': u.get('cost'),
            }
            if ch.get('finish_reason') == 'length' and not doubled:
                doubled = True
                budget *= 2
                continue
            return answer, usage, reasoning
        except Exception as e:  # network/timeout — same backoff as the other transports
            _last_err = f'{type(e).__name__}: {str(e)[:120]}'
            if attempt >= _retries:
                return None, {'error': _last_err}, None
            time.sleep(2 * (attempt + 1))
    # Carry the LAST underlying failure, not just that retries ran out. Recording only
    # 'retry-exhausted' made 70 no-verdicts in a 585 GenA11y run undiagnosable from the artifact.
    return None, {'error': f'retry-exhausted: {_last_err}'}, None


def _http_gemini(prompt_text, images, system=SYSTEM_MESSAGE, max_output_tokens=None, _retries=4):
    if not GEMINI_API_KEY:
        return None, {}, None
    parts = [{'text': prompt_text}] + [
        {'inlineData': {'mimeType': mt, 'data': b64}} for mt, b64 in images
    ]
    _level = {
        'minimal': 'MINIMAL', 'low': 'LOW', 'medium': 'MEDIUM',
        'high': 'HIGH', 'xhigh': 'HIGH', 'max': 'HIGH',
    }.get(str(EFFORT or '').lower())
    budget = max_output_tokens or _THINKING_OUTPUT_BUDGET.get(_level, 8192)
    doubled = False
    url = f'{GEMINI_BASE}/models/{MODEL}:generateContent?key={GEMINI_API_KEY}'
    for attempt in range(_retries + 1):
        thinking_config = {'includeThoughts': True}
        if _level:
            thinking_config['thinkingLevel'] = _level
        body = {
            'systemInstruction': {'parts': [{'text': system}]},
            'contents': [{'role': 'user', 'parts': parts}],
            'generationConfig': {
                'temperature': 0,
                'maxOutputTokens': budget,
                'thinkingConfig': thinking_config,
            },
        }
        if SERVICE_TIER:
            body['service_tier'] = SERVICE_TIER
        try:
            # flex targets 1-15 min per request and is sheddable; the 180s standard timeout would abort
            # slow-but-healthy responses and record them as failures. The 429/5xx retry above is what
            # flex's "no server-side fallback" requires.
            _timeout = 900 if SERVICE_TIER == 'flex' else 180
            r = requests.post(url, json=body, timeout=_timeout)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(2 * (attempt + 1))
                continue
            if not r.ok:
                return None, {'httpStatus': r.status_code, 'body': r.text[:500]}, None
            j = r.json()
            cand = (j.get('candidates') or [{}])[0]
            cparts = (cand.get('content') or {}).get('parts') or []
            answer = ''.join(p.get('text', '') for p in cparts if not p.get('thought'))
            thinking = ''.join(p.get('text', '') for p in cparts if p.get('thought'))
            um = j.get('usageMetadata') or {}
            usage = {
                'input_tokens': um.get('promptTokenCount', 0),
                'output_tokens': (um.get('candidatesTokenCount', 0) or 0) + (um.get('thoughtsTokenCount', 0) or 0),
                'thoughts_tokens': um.get('thoughtsTokenCount', 0),
                'finishReason': cand.get('finishReason'),
            }
            if cand.get('finishReason') == 'MAX_TOKENS' and not doubled:
                # Truncation, with or without a partial answer: retry once with a bigger budget
                # rather than parsing a cut-off object (which used to read as "no violations").
                doubled = True
                budget = min(budget * 2, _MAX_OUTPUT_CEILING)
                continue
            return answer or None, usage, (thinking or None)
        except Exception as exc:
            if attempt < _retries:
                time.sleep(2 * (attempt + 1))
                continue
            return None, {'error': str(exc)}, None
    return None, {'error': 'retry-exhausted'}, None


# ---------------------------------------------------------------------------
# Transport: OpenAI GPT (Responses API /v1/responses) — single-shot, no tools
# mirrors makeOpenAITransport in scripts/v3/lib/llm-agent-adapter.js
# ---------------------------------------------------------------------------

def _http_openai(prompt_text, images, system=SYSTEM_MESSAGE, effort='medium', max_output_tokens=16000, _retries=4):
    if not OPENAI_API_KEY:
        return None, {}, None
    content = [{'type': 'input_text', 'text': prompt_text}] + [
        {'type': 'input_image', 'image_url': f'data:{mt};base64,{b64}'} for mt, b64 in images
    ]
    body = {
        'model': MODEL,
        'instructions': system,
        'input': [{'role': 'user', 'content': content}],
        'max_output_tokens': max_output_tokens,
        'reasoning': {'effort': effort, 'summary': 'auto'},
    }
    headers = {'authorization': f'Bearer {OPENAI_API_KEY}', 'content-type': 'application/json'}
    for attempt in range(_retries + 1):
        try:
            r = requests.post(f'{OPENAI_BASE}/responses', headers=headers, json=body, timeout=300)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(2 * (attempt + 1))
                continue
            if not r.ok:
                return None, {'httpStatus': r.status_code, 'body': r.text[:500]}, None
            j = r.json()
            answer = j.get('output_text') or ''
            reasoning_parts = []
            if not answer:
                for item in (j.get('output') or []):
                    if item.get('type') == 'message':
                        for c in item.get('content', []):
                            if c.get('type') in ('output_text', 'text'):
                                answer += c.get('text', '')
            for item in (j.get('output') or []):
                if item.get('type') == 'reasoning':
                    for s in item.get('summary', []) or []:
                        reasoning_parts.append(s.get('text', '') if isinstance(s, dict) else str(s))
            u = j.get('usage') or {}
            usage = {
                'input_tokens': u.get('input_tokens', 0),
                'output_tokens': u.get('output_tokens', 0),
                'reasoning_tokens': (u.get('output_tokens_details') or {}).get('reasoning_tokens', 0),
                'finishReason': j.get('status'),
            }
            reasoning = '\n'.join(p for p in reasoning_parts if p) or None
            return (answer or None), usage, reasoning
        except Exception as exc:
            if attempt < _retries:
                time.sleep(2 * (attempt + 1))
                continue
            return None, {'error': str(exc)}, None
    return None, {'error': 'retry-exhausted'}, None


# ---------------------------------------------------------------------------
# Transport: ChatGPT subscription via LiteLLM OAuth — single-shot, no tools
#
# LiteLLM owns the OAuth device flow and local token refresh. This route deliberately
# does not inspect or reuse ~/.codex/auth.json: CHATGPT_TOKEN_DIR / CHATGPT_AUTH_FILE
# are LiteLLM's credential boundary. The subscription backend rejects token-limit
# fields and metadata, so neither is sent.
# ---------------------------------------------------------------------------

def _plain_dict(value):
    """Convert LiteLLM/OpenAI response models to plain JSON-compatible dictionaries."""
    if isinstance(value, dict):
        return value
    if hasattr(value, 'model_dump'):
        return value.model_dump()
    if hasattr(value, 'dict'):
        return value.dict()
    return json.loads(json.dumps(value, default=lambda obj: getattr(obj, '__dict__', str(obj))))


def _parse_responses_payload(response) -> tuple:
    """Return (answer, usage, reasoning) from Responses or LiteLLM response shapes."""
    # The ChatGPT subscription backend is natively streaming. LiteLLM returns an iterator even when the caller did
    # not request streaming, unlike its ordinary Responses providers. Aggregate deltas and retain the completed
    # response because that final event is the authoritative usage record.
    if (not isinstance(response, dict) and not hasattr(response, 'model_dump')
            and not hasattr(response, 'dict') and hasattr(response, '__iter__')):
        text_deltas, reasoning_deltas, completed = [], [], None
        for event in response:
            event = _plain_dict(event)
            event_type = event.get('type')
            if event_type == 'response.output_text.delta':
                text_deltas.append(event.get('delta', ''))
            elif event_type in ('response.reasoning_summary_text.delta', 'response.reasoning_text.delta'):
                reasoning_deltas.append(event.get('delta', ''))
            elif event_type == 'response.completed':
                completed = event.get('response')
        if completed:
            answer, usage, reasoning = _parse_responses_payload(completed)
            return (answer or ''.join(text_deltas) or None, usage,
                    reasoning or ''.join(reasoning_deltas) or None)
        return ''.join(text_deltas) or None, {
            'input_tokens': 0, 'output_tokens': 0, 'reasoning_tokens': 0,
            'finishReason': 'stream-ended-without-completed-event',
        }, ''.join(reasoning_deltas) or None

    j = _plain_dict(response)
    answer = j.get('output_text') or ''
    reasoning_parts = []
    for item in (j.get('output') or []):
        if not isinstance(item, dict):
            item = _plain_dict(item)
        if item.get('type') == 'message':
            for content in (item.get('content') or []):
                if not isinstance(content, dict):
                    content = _plain_dict(content)
                if content.get('type') in ('output_text', 'text'):
                    answer += content.get('text', '')
        elif item.get('type') == 'reasoning':
            for summary in (item.get('summary') or []):
                summary = _plain_dict(summary) if not isinstance(summary, dict) else summary
                reasoning_parts.append(summary.get('text', ''))

    # Some LiteLLM releases expose an OpenAI-chat-shaped convenience view even for responses().
    if not answer:
        choices = j.get('choices') or []
        if choices:
            message = (_plain_dict(choices[0]).get('message') or {})
            message = _plain_dict(message) if not isinstance(message, dict) else message
            answer = message.get('content') or ''
            if message.get('reasoning_content'):
                reasoning_parts.append(message['reasoning_content'])

    usage_raw = j.get('usage') or {}
    usage_raw = _plain_dict(usage_raw) if not isinstance(usage_raw, dict) else usage_raw
    output_details = usage_raw.get('output_tokens_details') or {}
    output_details = _plain_dict(output_details) if not isinstance(output_details, dict) else output_details
    usage = {
        'input_tokens': usage_raw.get('input_tokens', usage_raw.get('prompt_tokens', 0)),
        'output_tokens': usage_raw.get('output_tokens', usage_raw.get('completion_tokens', 0)),
        'reasoning_tokens': output_details.get('reasoning_tokens', 0),
        'finishReason': j.get('status') or j.get('finish_reason'),
    }
    reasoning = '\n'.join(part for part in reasoning_parts if part) or None
    return (answer or None), usage, reasoning


def _litellm_chatgpt(prompt_text, images, system=SYSTEM_MESSAGE, effort='medium', _retries=4):
    try:
        import litellm
    except Exception as exc:
        return None, {'error': f'LiteLLM unavailable: {exc}'}, None

    content = [{'type': 'input_text', 'text': prompt_text}] + [
        {'type': 'input_image', 'image_url': f'data:{mt};base64,{b64}'} for mt, b64 in images
    ]
    kwargs = {
        'model': MODEL,
        'instructions': system,
        'input': [{'role': 'user', 'content': content}],
    }
    if effort:
        kwargs['reasoning'] = {'effort': effort, 'summary': 'auto'}

    for attempt in range(_retries + 1):
        try:
            response = litellm.responses(**kwargs)
            return _parse_responses_payload(response)
        except Exception as exc:
            status = getattr(exc, 'status_code', None)
            if attempt < _retries and (status == 429 or (isinstance(status, int) and status >= 500)):
                time.sleep(2 * (attempt + 1))
                continue
            return None, {'error': f'{type(exc).__name__}: {exc}', 'httpStatus': status}, None
    return None, {'error': 'retry-exhausted'}, None


# ---------------------------------------------------------------------------
# Transport: Claude via the Python Agent SDK (images via Read tool)
# ---------------------------------------------------------------------------

def _claude_sdk(content_blocks, system=SYSTEM_MESSAGE):
    import claude_agent_sdk
    from claude_agent_sdk.types import AssistantMessage, ClaudeAgentOptions, ResultMessage

    prompt_text, temp_files, has_images = _content_blocks_to_cli(content_blocks)
    use_read = has_images and bool(temp_files)
    usage_box = {}

    async def _q():
        # Pin the requested model (and effort, when set): without `model=` the SDK
        # falls back to the CLI's account default, so `--model claude-haiku-4-5`
        # would be recorded in telemetry but never actually called.
        opts = ClaudeAgentOptions(
            system_prompt=system,
            tools=['Read'] if use_read else [],
            permission_mode='bypassPermissions',
            max_turns=5 if use_read else 1,
            model=MODEL,
            **({'effort': EFFORT} if EFFORT else {}),
        )
        parts = []
        async for msg in claude_agent_sdk.query(prompt=prompt_text, options=opts):
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if hasattr(block, 'text'):
                        parts.append(block.text)
            elif isinstance(msg, ResultMessage):
                u = msg.usage or {}
                mu = getattr(msg, 'model_usage', None) or {}
                usage_box.update({
                    'models_used': sorted(mu.keys()) if isinstance(mu, dict) else None,
                    'input_tokens': u.get('input_tokens', 0),
                    'output_tokens': u.get('output_tokens', 0),
                    'cache_read_input_tokens': u.get('cache_read_input_tokens', 0),
                    'cache_creation_input_tokens': u.get('cache_creation_input_tokens', 0),
                    'costUsd': float(msg.total_cost_usd or 0),
                })
        return ''.join(parts)

    try:
        raw = asyncio.run(_q())
    except Exception as exc:
        _cleanup(temp_files)
        return None, {'error': str(exc)}, None
    _cleanup(temp_files)
    return (raw or None), usage_box, None


# ---------------------------------------------------------------------------
# Core LLM call — dispatches to the active provider's transport
# ---------------------------------------------------------------------------

def dispatch(content_blocks: list, system: str = SYSTEM_MESSAGE) -> tuple:
    """
    Route content_blocks to the active provider's transport with a given system
    prompt; record usage + call stats. Returns (prompt_text, raw, usage, reasoning,
    provider). Shared by GenA11y (_call_llm) and the AccessGuru adapter.
    """
    provider = _provider()
    prompt_text, images = _prepare_inline(content_blocks)

    with _LOCK:
        LLM_STATS['calls'] += 1

    with _LLM_SEM:
        if provider == 'gemini':
            raw, usage, reasoning = _http_gemini(prompt_text, images, system=system)
        elif provider == 'chatgpt':
            raw, usage, reasoning = _litellm_chatgpt(
                prompt_text, images, system=system, effort=EFFORT or 'medium')
        elif provider == 'openrouter':
            raw, usage, reasoning = _http_openrouter(prompt_text, images, system=system)
        elif provider == 'openai':
            raw, usage, reasoning = _http_openai(prompt_text, images, system=system)
        else:
            raw, usage, reasoning = _claude_sdk(content_blocks, system=system)

    if provider == 'claude':
        _stat_add(usage.get('input_tokens', 0), usage.get('output_tokens', 0),
                  usage.get('cache_read_input_tokens', 0), usage.get('cache_creation_input_tokens', 0),
                  cost=usage.get('costUsd', 0), done=bool(raw))
    else:
        in_tok, out_tok = usage.get('input_tokens', 0), usage.get('output_tokens', 0)
        # OpenRouter reports the cost it actually charged; every other provider needs the local
        # table. Prefer the reported figure — it already accounts for routing and margin, which a
        # static table cannot know.
        reported = usage.get('costUsd')
        cost = float(reported) if isinstance(reported, (int, float)) else _price(in_tok, out_tok)
        _stat_add(in_tok, out_tok, cost=cost, done=bool(raw))

    return prompt_text, raw, usage, reasoning, provider


_UNPARSEABLE = ('No JSON object in response', 'JSON parse error', 'Unbalanced JSON')

# An attribute value this long is data, not something an accessibility judgement reads: SVG path coordinates,
# embedded base64 images. GenA11y sends whole element markup and cannot split one element across chunks, so a
# single inline map (megabytes of path data) put chunks over the model's context window and they returned no
# verdict. Such values are shortened to their first 200 characters plus a note of the length removed.
_LONG_ATTR = re.compile(r'(=\\?["\'])([^"\'\\]{2000,})')


def _shorten_long_attributes(blocks: list) -> list:
    out = []
    for b in blocks:
        if isinstance(b, dict) and b.get('type') == 'text' and isinstance(b.get('text'), str) and len(b['text']) > 2000:
            b = {**b, 'text': _LONG_ATTR.sub(lambda m: f'{m.group(1)}{m.group(2)[:200]}…[{len(m.group(2)) - 200} characters omitted]', b['text'])}
        out.append(b)
    return out


def _call_llm(content_blocks: list, _retries: int = 3) -> dict:
    """Route to the configured provider, record usage/trace, return a verdict dict. A reply that is not valid JSON
    is asked again (up to twice more), as InterA11y's clients do; every attempt is traced."""
    content_blocks = _shorten_long_attributes(content_blocks)
    for attempt in range(3):
        prompt_text, raw, usage, reasoning, provider = dispatch(
            content_blocks, system=SYSTEM_NEUTRAL if STANCE == 'neutral' else SYSTEM_MESSAGE)
        verdict = _parse_verdict(raw) if raw else _no_verdict(
            f'{provider} transport returned no text ({usage})')
        _emit_trace(prompt_text, raw, verdict, usage, reasoning, provider, extra={'attempt': attempt})
        unparseable = verdict.get('verdict') == 'NO VERDICT' and any(
            m in verdict.get('summary', '') for m in _UNPARSEABLE)
        if not unparseable:
            break
    return verdict


def _cleanup(paths: list) -> None:
    for p in paths:
        try:
            os.unlink(p)
        except Exception:
            pass


def _parse_verdict(text: str) -> dict:
    text = re.sub(r'^```[a-z]*\n?', '', text.strip(), flags=re.MULTILINE)
    text = re.sub(r'\n?```$', '', text.strip(), flags=re.MULTILINE)
    start = text.find('{')
    if start < 0:
        return _no_verdict('No JSON object in response')
    depth, in_str, esc = 0, False, False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                span = text[start:i + 1]
                try:
                    obj = json.loads(span)
                except Exception:
                    return _no_verdict('JSON parse error')
                return _normalize(obj)
    return _no_verdict('Unbalanced JSON')


def _normalize_neutral(obj: dict) -> dict:
    """A neutral-stance reply in GenA11y's schema: FAIL elements and page findings are the violations."""
    elements = [e for e in (obj.get('elements') or []) if isinstance(e, dict)]
    findings = [f for f in (obj.get('pageFindings') or []) if isinstance(f, dict)]
    fails = [e for e in elements if str(e.get('verdict', '')).upper() == 'FAIL']
    counts = {}
    for e in elements:
        v = str(e.get('verdict', '')).upper() or 'MISSING'
        counts[v] = counts.get(v, 0) + 1
    violations = [{'xpath': v.get('xpath'), 'outerHTML': v.get('outerHTML', ''),
                   'reason': ' — '.join(x for x in (v.get('evidence', ''), v.get('reason', '')) if x),
                   'recommendation': ''} for v in fails + findings]
    return {
        'verdict': 'REPRODUCED' if violations else 'NOT REPRODUCED',
        'confidence': 'medium',
        'violations': violations,
        'summary': f'element verdicts {counts}; page findings {len(findings)}',
        'elementVerdicts': counts,
    }


def _normalize(obj: dict) -> dict:
    if STANCE == 'neutral':
        return _normalize_neutral(obj)
    valid_verdicts = {'REPRODUCED', 'NOT REPRODUCED', 'PARTIAL'}
    verdict = obj.get('verdict', 'NOT REPRODUCED')
    if verdict not in valid_verdicts:
        verdict = 'NOT REPRODUCED'
    violations = obj.get('violations', [])
    if not isinstance(violations, list):
        violations = []
    return {
        'verdict': verdict,
        'confidence': obj.get('confidence', 'low') if obj.get('confidence') in ('high', 'medium', 'low') else 'low',
        'violations': [
            {
                'xpath': v.get('xpath'),
                'outerHTML': v.get('outerHTML', ''),
                'reason': v.get('reason', ''),
                'recommendation': v.get('recommendation', ''),
            }
            for v in violations if isinstance(v, dict)
        ],
        'summary': obj.get('summary', ''),
    }


def _error_verdict(msg: str) -> dict:
    """NO APPLICABLE DATA — the page had nothing for this SC to look at. A genuine negative."""
    return {
        'verdict': 'NOT REPRODUCED',
        'confidence': 'low',
        'violations': [],
        'summary': f'Analysis error: {msg}',
    }


def _no_verdict(msg: str) -> dict:
    """
    NO VERDICT — the transport failed or the response could not be parsed, so the model never
    actually said "no violations here". Returning NOT REPRODUCED for these (the old behaviour)
    silently manufactured negatives: a truncated or 5xx'd call scored exactly like a clean pass.
    'NO VERDICT' is outside runner._OUTCOME, so the runner books it as noVerdict, not missedAgree.
    """
    return {
        'verdict': 'NO VERDICT',
        'confidence': 'low',
        'violations': [],
        'summary': f'No verdict: {msg}',
    }


# ---------------------------------------------------------------------------
# Per-SC detection functions
# ---------------------------------------------------------------------------

def detect_page_title(page_title_dict: dict) -> dict:
    """SC 2.4.2 — Page Titled."""
    user_text = (
        'Analyze compliance with WCAG SC 2.4.2 (Page Titled).\n'
        'Test rules:\n'
        '1. The page title must not be null or empty.\n'
        '2. The page title must be descriptive of the page content.\n'
        '------------------\n'
        f'Title: {page_title_dict["title"]}\n'
        f'Portion of page text: {page_title_dict["portion_text"]}\n'
    )
    return _call_llm([_text_block(user_text)])


def detect_non_text_content(visual_elements_dict: dict) -> dict:
    """SC 1.1.1 — Non-text Content."""
    chunks = chunk_data(visual_elements_dict, threshold_tokens=20000, max_chunk_tokens=5000)
    responses = []
    base_text = (
        'Analyze compliance with WCAG SC 1.1.1 (Non-text Content).\n'
        'Test rules:\n'
        '1. Image buttons must have a non-empty accessible name.\n'
        '2. Images, videos, and audio must have non-empty accessible names unless decorative '
        '(alt="", role="presentation", aria-hidden="true").\n'
        '3. Accessible names must be meaningful, not just filenames or "image".\n'
        '4. Object elements must have accessible names.\n'
        '5. SVG elements with explicit roles must have accessible names.\n'
        'Elements prefixed with [path: ...] give the XPath of the element.\n'
        '------------------\n'
    )
    for chunk in chunks:
        content = base_text + '\n'.join(f'{k}: {v}' for k, v in chunk.items())
        responses.append(_call_llm([_text_block(content)]))
    return aggregate_responses(responses) if responses else _error_verdict('No elements')


def detect_images_of_text(img_urls: list) -> dict:
    """SC 1.4.5 — Images of Text. Uses vision to check for text in images."""
    if not img_urls:
        return {'verdict': 'NOT REPRODUCED', 'confidence': 'high',
                'violations': [], 'summary': 'No images found on page.'}

    base_text = (
        'Analyze compliance with WCAG SC 1.4.5 (Images of Text).\n'
        'For each image, determine if it contains visible text that could instead be rendered as actual text.\n'
        'Exceptions: purely decorative images, logos, essential text (e.g., in diagrams).\n'
        '------------------\n'
    )
    valid_exts = ('.png', '.jpg', '.jpeg', '.gif', '.webp')
    checkable = [u for u in img_urls if u and any(u.lower().endswith(e) for e in valid_exts)][:10]

    if not checkable:
        return {'verdict': 'NOT REPRODUCED', 'confidence': 'medium',
                'violations': [], 'summary': 'No checkable image URLs found.'}

    blocks = [_text_block(base_text)]
    for url in checkable:
        try:
            blocks.append(_url_image_block(url))
            blocks.append(_text_block(f'Image URL: {url}\n--\n'))
        except Exception:
            continue

    return _call_llm(blocks)


def detect_missing_labels(form_elements: list) -> dict:
    """SC 3.3.2 — Labels or Instructions."""
    if not form_elements:
        return {'verdict': 'NOT REPRODUCED', 'confidence': 'high',
                'violations': [], 'summary': 'No form elements found.'}
    chunks = chunk_data(form_elements)
    base_text = (
        'Analyze compliance with WCAG SC 3.3.2 (Labels or Instructions).\n'
        'Test rules:\n'
        '1. Groups with nested inputs must have a unique accessible name (fieldset + legend).\n'
        '2. Checkboxes and radio buttons must have a label after the control.\n'
        '3. Text inputs and <select> elements must have a label before the control.\n'
        '4. The HTML5 placeholder must not replace a visible label.\n'
        '5. Each input must have an associated visible label.\n'
        'Elements prefixed with [path: ...] give the XPath.\n'
        '------------------\n'
    )
    responses = []
    for chunk in chunks:
        content = base_text + '\n-------------\n'.join(str(e) for e in chunk)
        responses.append(_call_llm([_text_block(content)]))
    return aggregate_responses(responses)


def detect_reflow(reflow_dict: dict) -> dict:
    """SC 1.4.10 — Reflow."""
    blocks = [
        _text_block(
            'Analyze compliance with WCAG SC 1.4.10 (Reflow).\n'
            'The first screenshot shows the original page, the second shows it at 400% zoom '
            'with a 1280×1024 viewport.\n'
            'Failures:\n'
            '1. Content disappears after zooming and is no longer available.\n'
            '2. The page requires scrolling in two dimensions to read content at 400% zoom.\n'
            '------------------\n'
        ),
        _b64_image_block(reflow_dict['original']),
        _text_block('Above: original. Below: 400% zoom.\n'),
        _b64_image_block(reflow_dict['reflow']),
    ]
    return _call_llm(blocks)


def detect_link_purpose(link_list: list) -> dict:
    """SC 2.4.4 — Link Purpose (In Context)."""
    if not link_list:
        return {'verdict': 'NOT REPRODUCED', 'confidence': 'high',
                'violations': [], 'summary': 'No links found on page.'}
    base_text = (
        'Analyze compliance with WCAG SC 2.4.4 (Link Purpose In Context).\n'
        'A link passes if its purpose is clear from its accessible name OR from its surrounding '
        'context (same sentence, paragraph, list item, or table cell).\n'
        'Test rules:\n'
        '1. The link must have a non-empty accessible name.\n'
        '2. The link in context must be descriptive (not just "click here", "read more", etc. '
        'unless context clarifies the destination).\n'
        '3. Links with identical names in the same context must serve an equivalent purpose.\n'
        'Elements prefixed with [path: ...] give the XPath of the link.\n'
        '------------------\n'
    )
    chunks = chunk_data(link_list)
    responses = []
    for chunk in chunks:
        content = base_text + '\n-------------\n'.join(str(e) for e in chunk)
        responses.append(_call_llm([_text_block(content)]))
    return aggregate_responses(responses)


def detect_contrast(contrast_list: list, bg_image_dict: dict) -> dict:
    """SC 1.4.3 — Contrast (Minimum)."""
    base_text = (
        'Analyze compliance with WCAG SC 1.4.3 (Contrast Minimum).\n'
        'Test rules:\n'
        '1. Normal text and its background must achieve at least 4.5:1 contrast ratio.\n'
        '2. Large text (≥18pt normal or ≥14pt bold) must achieve at least 3:1.\n'
        '3. When a background image is present, check text readability from the screenshot.\n'
        'Elements prefixed with [path: ...] give the XPath. '
        'Each element includes inline style with color/font-size/background-color for reference.\n'
        '------------------\n'
    )
    text_data = [{'type': 'text', 'content': t} for t in contrast_list]
    img_data = [{'type': 'image', 'html': k, 'b64': v} for k, v in bg_image_dict.items()]
    combined = text_data + img_data
    chunks = chunk_data(combined)
    responses = []
    for chunk in chunks:
        blocks = [_text_block(base_text)]
        for item in chunk:
            if item['type'] == 'text':
                blocks.append(_text_block(f"{item['content']}\n-------------\n"))
            else:
                blocks.append(_text_block(f"{item['html']}\n"))
                blocks.append(_b64_image_block(item['b64']))
                blocks.append(_text_block('-------------\n'))
        responses.append(_call_llm(blocks))
    return aggregate_responses(responses) if responses else _error_verdict('No contrast data')


def detect_headings_labels(form_and_headings: dict) -> dict:
    """SC 2.4.6 — Headings and Labels."""
    base_text = (
        'Analyze compliance with WCAG SC 2.4.6 (Headings and Labels).\n'
        'A heading or label passes if it is present AND descriptive. '
        'Missing headings/labels are NOT violations of this SC — only non-descriptive ones are.\n'
        'Test rules:\n'
        '1. If a heading is present, it must describe the section it introduces.\n'
        '2. If a form field label is present, it must describe the purpose of the field.\n'
        'Elements prefixed with [path: ...] give the XPath.\n'
        '------------------\n'
    )
    headings = form_and_headings.get('headings', [])
    forms = form_and_headings.get('forms', [])
    combined = [{'type': 'heading', 'content': h} for h in headings] + \
               [{'type': 'form', 'content': f} for f in forms]
    chunks = chunk_data(combined)
    responses = []
    for chunk in chunks:
        lines = [base_text, 'Headings:\n']
        for item in chunk:
            if item['type'] == 'heading':
                lines.append(f"{item['content']}\n-------------\n")
        lines.append('\nForm containers:\n')
        for item in chunk:
            if item['type'] == 'form':
                lines.append(f"{item['content']}\n-------------\n")
        responses.append(_call_llm([_text_block(''.join(lines))]))
    return aggregate_responses(responses) if responses else _error_verdict('No heading/label data')


def detect_section_headings(section_list: list, screenshot_b64: str) -> dict:
    """SC 2.4.10 — Section Headings."""
    base_blocks = [
        _text_block(
            'Analyze compliance with WCAG SC 2.4.10 (Section Headings).\n'
            'Test rules:\n'
            '1. Each distinct section of content should have a heading.\n'
            '2. Each heading should be descriptive of its section.\n'
            'Use the screenshot to identify visual sections not marked up with <section>.\n'
            '------------------\n'
        ),
        _b64_image_block(screenshot_b64),
        _text_block('Section heading data:\n'),
    ]
    for i, sec in enumerate(section_list, 1):
        if sec.get('no_heading'):
            base_blocks.append(_text_block(f'Section {i}: no heading present.\n-------------\n'))
        else:
            base_blocks.append(_text_block(
                f'Section {i} heading: {sec.get("headings", "")}\n-------------\n'))
    return _call_llm(base_blocks)


def detect_info_relation(info_dict: dict) -> dict:
    """SC 1.3.1 — Info and Relationships."""
    base_text = (
        'Analyze compliance with WCAG SC 1.3.1 (Info and Relationships).\n'
        'Common failures:\n'
        '- Tables: missing <th>, missing scope, inconsistent columns, layout tables with semantics.\n'
        '- ARIA: invalid roles, missing required context, missing required owned elements.\n'
        '- onClick on divs/spans emulating links without role="link".\n'
        '- White-space columns/tables in <pre> or plain text.\n'
        '- Headings not hierarchical; empty headings.\n'
        '- Lists/definitions marked up incorrectly.\n'
        '- Radio/checkbox groups not in a <fieldset>.\n'
        '- Fieldset without a <legend>.\n'
        '- CSS ::before/::after content conveying non-decorative information.\n'
        'Elements prefixed with [path: ...] give the XPath.\n'
        '------------------\n'
    )
    combined = []
    for key, items in info_dict.items():
        if isinstance(items, list):
            combined.extend({'_key': key, 'content': item} for item in items)
        else:
            combined.append({'_key': key, 'content': str(items)})

    chunks = chunk_data(combined)
    responses = []
    for chunk in chunks:
        lines = [base_text]
        for item in chunk:
            lines.append(f"{item['_key'].replace('_', ' ').capitalize()}:\n")
            lines.append(f"{item['content']}\n-------------\n")
        responses.append(_call_llm([_text_block(''.join(lines))]))
    return aggregate_responses(responses) if responses else _error_verdict('No info/relation data')


def detect_meaningful_sequence(table_list: list, whitespace_list: list, layout_list: list) -> dict:
    """SC 1.3.2 — Meaningful Sequence."""
    base_text = (
        'Analyze compliance with WCAG SC 1.3.2 (Meaningful Sequence).\n'
        'Common failures:\n'
        '1. Layout table whose linearized order does not match reading order.\n'
        '2. White-space characters used to create visual spacing within words.\n'
        '3. CSS float/flex/grid that rearranges visual vs. DOM order meaningfully.\n'
        '------------------\n'
    )
    combined = (
        [{'type': 'table', 'original': t['original'], 'linear': t['linearized']} for t in table_list] +
        [{'type': 'whitespace', 'content': w} for w in whitespace_list] +
        [{'type': 'layout', 'content': l} for l in layout_list]
    )
    chunks = chunk_data(combined)
    responses = []
    for chunk in chunks:
        lines = [base_text]
        for item in chunk:
            if item['type'] == 'table':
                lines.append(f"Original table:\n{item['original']}\nLinearized:\n{item['linear']}\n-------------\n")
            elif item['type'] == 'whitespace':
                lines.append(f"White-space formatted text:\n{item['content']}\n-------------\n")
            else:
                lines.append(f"Layout-rearranged element:\n{item['content']}\n-------------\n")
        responses.append(_call_llm([_text_block(''.join(lines))]))
    return aggregate_responses(responses) if responses else _error_verdict('No sequence data')


def detect_name_role_value(name_role_dict: dict, form_dict: list) -> dict:
    """SC 4.1.2 — Name, Role, Value."""
    base_text = (
        'Analyze compliance with WCAG SC 4.1.2 (Name, Role, Value).\n'
        'Test rules:\n'
        '1. Buttons must have non-empty, descriptive accessible names.\n'
        '2. Elements with aria-hidden must not receive focus.\n'
        '3. Form fields must have non-empty, descriptive accessible names; one label per field.\n'
        '4. Menu items must have non-empty, descriptive accessible names.\n'
        '5. Iframes must have non-empty, descriptive accessible names; identical names → same purpose.\n'
        '6. div/span used as controls (with onclick/keydown) must have an appropriate ARIA role.\n'
        '7. Links must have valid href values.\n'
        'Elements prefixed with [path: ...] give the XPath.\n'
        '------------------\n'
    )
    combined = []
    for key, items in name_role_dict.items():
        combined.extend({'_key': key, 'content': item} for item in items)
    for form in (form_dict or []):
        combined.append({'_key': 'form', 'content': form})

    chunks = chunk_data(combined)
    responses = []
    for chunk in chunks:
        lines = [base_text]
        for item in chunk:
            lines.append(f"{item['_key'].replace('_', ' ').capitalize()}:\n{item['content']}\n-------------\n")
        responses.append(_call_llm([_text_block(''.join(lines))]))
    return aggregate_responses(responses) if responses else _error_verdict('No name/role data')


def detect_use_of_color(color_dict: dict) -> dict:
    """SC 1.4.1 — Use of Color."""
    blocks = [
        _text_block(
            'Analyze compliance with WCAG SC 1.4.1 (Use of Color).\n'
            'Test rules:\n'
            '1. Links distinguished only by color must also have another visual indicator '
            '(underline, bold, different lightness, etc.).\n'
            '2. Required or error form fields identified only by color must have an additional '
            'non-color indicator (asterisk, label text, icon, etc.).\n'
            'Use the screenshot to identify these situations.\n'
            '------------------\n'
        ),
        _b64_image_block(color_dict['screenshot']),
    ]
    return _call_llm(blocks)


def detect_error_identification(screenshot_b64: str) -> dict:
    """SC 3.3.1 — Error Identification."""
    blocks = [
        _text_block(
            'Analyze compliance with WCAG SC 3.3.1 (Error Identification).\n'
            'Test rules:\n'
            '1. If an input error is automatically detected, the item in error must be identified '
            '   and the error described to the user in text.\n'
            # the neutral stance drops the default verdict ("... the page passes"), as InterA11y's gena11y rubric does
            'Look for form validation errors visible in the screenshot.'
            + ('\n' if STANCE == 'neutral' else ' If no form or error state is present, the page passes.\n')
            + '------------------\n'
        ),
        _b64_image_block(screenshot_b64),
    ]
    return _call_llm(blocks)


def detect_error_suggestion(screenshot_b64: str) -> dict:
    """SC 3.3.3 — Error Suggestion."""
    blocks = [
        _text_block(
            'Analyze compliance with WCAG SC 3.3.3 (Error Suggestion).\n'
            'Test rules:\n'
            '1. If an input error is detected and suggestions for correction are known, the '
            '   suggestion must be provided in text (unless it would jeopardize security).\n'
            'Look for form validation errors in the screenshot and check whether a correction '
            'suggestion is provided. If no error state is visible, the page passes.\n'
            '------------------\n'
        ),
        _b64_image_block(screenshot_b64),
    ]
    return _call_llm(blocks)


# ---------------------------------------------------------------------------
# Dispatcher: run detection for one SC given its pre-extracted data
# ---------------------------------------------------------------------------

def detect_for_sc(sc: str, data) -> dict:
    """
    Run the appropriate detection function for the given SC and extracted data.
    Returns a verdict dict in our output schema.
    """
    sc = sc.strip()
    try:
        if sc == '1.1.1':
            return detect_non_text_content(data)
        if sc == '1.3.1':
            return detect_info_relation(data)
        if sc == '1.3.2':
            return detect_meaningful_sequence(data[0], data[1], data[2])
        if sc == '1.4.1':
            return detect_use_of_color(data)
        if sc == '1.4.3':
            return detect_contrast(data[0], data[1])
        if sc == '1.4.5':
            return detect_images_of_text(data)
        if sc == '1.4.10':
            return detect_reflow(data)
        if sc == '2.4.2':
            return detect_page_title(data)
        if sc == '2.4.4':
            return detect_link_purpose(data)
        if sc == '2.4.6':
            return detect_headings_labels(data)
        if sc == '2.4.10':
            return detect_section_headings(data[0], data[1])
        if sc == '3.3.1':
            return detect_error_identification(data)
        if sc == '3.3.2':
            return detect_missing_labels(data)
        if sc == '3.3.3':
            return detect_error_suggestion(data)
        if sc == '4.1.2':
            return detect_name_role_value(data, [])
    except Exception as e:
        return _no_verdict(f'Exception in detect_for_sc({sc}): {e}')
    return _error_verdict(f'SC {sc} not handled by detector')
