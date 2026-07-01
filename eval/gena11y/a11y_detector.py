"""
Adapted from GenA11y A11yDetector/a11y_detector.py.

Changes vs. upstream:
  - OpenAI GPT-4o replaced with a PLUGGABLE cross-family transport, selected by
    the active model string (a11y_detector.configure(model=...)):
      * claude-*  → Python Agent SDK (CLAUDE_CODE_OAUTH_TOKEN, images via Read tool)
      * gemini-*  → Google generativeai generateContent REST (GEMINI_API_KEY)
      * gpt-*/o*  → OpenAI Responses API /v1/responses (OPENAI_API_KEY)
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
_LOCK = threading.Lock()
_LLM_SEM = threading.Semaphore(8)          # global cap on concurrent LLM calls
_CTX = threading.local()                    # per-page (sc, file) for trace attribution
TRACE_SINK = None                           # callable(dict) -> None, set by runner

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
OPENAI_BASE = 'https://api.openai.com/v1'

# approximate USD / 1M tokens (best-effort; precise TOKENS are the authoritative artifact)
_PRICES = {
    'gemini-3.5-flash': {'in': 0.30, 'out': 2.50},
    'gpt-5.4-mini':     {'in': 0.25, 'out': 2.00},
    'gpt-5.4':          {'in': 1.25, 'out': 10.0},
}

# Module-level LLM telemetry the runner surfaces into status.json for the monitor.
LLM_STATS = {
    'calls': 0, 'done': 0,
    'inputTokens': 0, 'outputTokens': 0,
    'cacheReadTokens': 0, 'cacheCreateTokens': 0,
    'costUsd': 0.0,
}


def configure(model: str = None, llm_concurrency: int = None, trace_sink=None) -> None:
    """Set the active model, the global LLM-concurrency cap, and the trace sink."""
    global MODEL, _LLM_SEM, TRACE_SINK
    if model:
        MODEL = model
    if llm_concurrency:
        _LLM_SEM = threading.Semaphore(llm_concurrency)
    if trace_sink is not None:
        TRACE_SINK = trace_sink


def set_context(sc: str, file: str) -> None:
    """Called by each page worker so traces can be attributed to (sc, file)."""
    _CTX.sc, _CTX.file = sc, file


def _provider() -> str:
    m = MODEL.lower()
    if m.startswith('gemini'):
        return 'gemini'
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
    p = _PRICES.get(MODEL)
    if not p:
        return 0.0
    return (input_tok / 1e6) * p['in'] + (output_tok / 1e6) * p['out']


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

def _http_gemini(prompt_text, images, system=SYSTEM_MESSAGE, max_output_tokens=4096, _retries=4):
    if not GEMINI_API_KEY:
        return None, {}, None
    parts = [{'text': prompt_text}] + [
        {'inlineData': {'mimeType': mt, 'data': b64}} for mt, b64 in images
    ]
    budget = max_output_tokens
    doubled = False
    url = f'{GEMINI_BASE}/models/{MODEL}:generateContent?key={GEMINI_API_KEY}'
    for attempt in range(_retries + 1):
        body = {
            'systemInstruction': {'parts': [{'text': system}]},
            'contents': [{'role': 'user', 'parts': parts}],
            'generationConfig': {
                'temperature': 0,
                'maxOutputTokens': budget,
                'thinkingConfig': {'includeThoughts': True},
            },
        }
        try:
            r = requests.post(url, json=body, timeout=180)
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
            if not answer and cand.get('finishReason') == 'MAX_TOKENS' and not doubled:
                doubled = True
                budget = min(budget * 2, 16384)
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
# Transport: Claude via the Python Agent SDK (images via Read tool)
# ---------------------------------------------------------------------------

def _claude_sdk(content_blocks, system=SYSTEM_MESSAGE):
    import claude_agent_sdk
    from claude_agent_sdk.types import AssistantMessage, ClaudeAgentOptions, ResultMessage

    prompt_text, temp_files, has_images = _content_blocks_to_cli(content_blocks)
    use_read = has_images and bool(temp_files)
    usage_box = {}

    async def _q():
        opts = ClaudeAgentOptions(
            system_prompt=system,
            tools=['Read'] if use_read else [],
            permission_mode='bypassPermissions',
            max_turns=5 if use_read else 1,
        )
        parts = []
        async for msg in claude_agent_sdk.query(prompt=prompt_text, options=opts):
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if hasattr(block, 'text'):
                        parts.append(block.text)
            elif isinstance(msg, ResultMessage):
                u = msg.usage or {}
                usage_box.update({
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
        _stat_add(in_tok, out_tok, cost=_price(in_tok, out_tok), done=bool(raw))

    return prompt_text, raw, usage, reasoning, provider


def _call_llm(content_blocks: list, _retries: int = 3) -> dict:
    """Route to the configured provider, record usage/trace, return a verdict dict."""
    prompt_text, raw, usage, reasoning, provider = dispatch(content_blocks)
    verdict = _parse_verdict(raw) if raw else _error_verdict(
        f'{provider} transport returned no text ({usage})')
    _emit_trace(prompt_text, raw, verdict, usage, reasoning, provider)
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
        return _error_verdict('No JSON object in response')
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
                    return _error_verdict('JSON parse error')
                return _normalize(obj)
    return _error_verdict('Unbalanced JSON')


def _normalize(obj: dict) -> dict:
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
    return {
        'verdict': 'NOT REPRODUCED',
        'confidence': 'low',
        'violations': [],
        'summary': f'Analysis error: {msg}',
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
            'Look for form validation errors visible in the screenshot. If no form or error state '
            'is present, the page passes.\n'
            '------------------\n'
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
        return _error_verdict(f'Exception in detect_for_sc({sc}): {e}')
    return _error_verdict(f'SC {sc} not handled by detector')
