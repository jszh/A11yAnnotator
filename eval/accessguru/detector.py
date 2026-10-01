"""
AccessGuru detection: axe-core 4.4.1 (syntax/layout) + LLM semantic detector.

Reuses the gena11y adapter's cross-family transport (a11y_detector.dispatch) so the
same Gemini/OpenAI/Claude endpoints power the semantic detector, with AccessGuru's
own system prompt + taxonomy prompt.
"""
import os
import re
import sys

# reuse the transport layer from the gena11y adapter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # own dir for ag_consts
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'gena11y'))
import a11y_detector  # noqa: E402

from ag_consts import (  # noqa: E402
    AG_SYSTEM, AXE_JS_PATH, SEMANTIC_PROMPT_TEMPLATE, SEMANTIC_TAXONOMY_STR,
    SEMANTIC_VIOLATIONS, VIOLATION_TO_SCS,
)

with open(AXE_JS_PATH) as _f:
    _AXE_SRC = _f.read()

_AXE_RUN_JS = """
var cb = arguments[arguments.length - 1];
try {
  axe.run(document, {resultTypes: ['violations']})
     .then(function (r) { cb(r.violations.map(function (v) { return v.id; })); })
     .catch(function (e) { cb({__error: String(e)}); });
} catch (e) { cb({__error: String(e)}); }
"""

# InterA11y's XPath convention (every step indexed: /html[1]/body[1]/div[2]), so findings join expert-study cases
_XPATH_OF_JS = """
window.__agXpathOf = function (e) {
  if (!e || e.nodeType !== 1) return null;
  var parts = [];
  for (var n = e; n && n.nodeType === 1; n = n.parentElement) {
    var i = 1;
    for (var s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
    parts.unshift(n.tagName.toLowerCase() + '[' + i + ']');
  }
  return '/' + parts.join('/');
};
"""

_AXE_NODES_JS = """
var cb = arguments[arguments.length - 1];
try {
  axe.run(document, {resultTypes: ['violations'], elementRef: true})
     .then(function (r) {
       var out = [];
       r.violations.forEach(function (v) { v.nodes.forEach(function (n) { out.push({id: v.id, xpath: window.__agXpathOf(n.element)}); }); });
       cb(out);
     })
     .catch(function (e) { cb({__error: String(e)}); });
} catch (e) { cb({__error: String(e)}); }
"""

# an HTML snippet the semantic detector quoted → the element it quotes, by its opening tag (tag name and the
# identifying attributes it carries); among several matches, the one whose markup starts like the snippet
_LOCATE_JS = """
var snippets = arguments[0];
function norm(s) { return String(s || '').replace(/\\s+/g, ' ').replace(/\\s*([<>=\\/])\\s*/g, '$1').trim().toLowerCase(); }
return snippets.map(function (snip) {
  try {
    var t = document.createElement('template'); t.innerHTML = String(snip || '').trim();
    var q = t.content.firstElementChild; if (!q) return null;
    var sel = q.tagName.toLowerCase();
    ['id', 'href', 'src', 'alt', 'aria-label', 'name', 'title', 'role', 'type', 'class'].forEach(function (a) {
      var v = q.getAttribute(a); if (v !== null && v.length < 300) sel += '[' + a + '=' + JSON.stringify(v) + ']';
    });
    var c = []; try { c = Array.prototype.slice.call(document.querySelectorAll(sel)); } catch (e) { c = []; }
    if (!c.length) return null;
    if (c.length > 1) {
      var head = norm(q.outerHTML).slice(0, 200);
      var exact = c.filter(function (e) { return norm(e.outerHTML).slice(0, 200) === head; });
      if (exact.length) c = exact;
    }
    return window.__agXpathOf(c[0]);
  } catch (e) { return null; }
});
"""


# ---------------------------------------------------------------------------
# Syntax/layout detector: axe-core 4.4.1
# ---------------------------------------------------------------------------

def run_axe(driver) -> list:
    """Inject axe-core 4.4.1 and return the list of violation rule-ids (or [])."""
    try:
        driver.set_script_timeout(45)
        driver.execute_script(_AXE_SRC)
        result = driver.execute_async_script(_AXE_RUN_JS)
    except Exception:
        return []
    if isinstance(result, dict):          # {__error: ...}
        return []
    return [v for v in (result or []) if isinstance(v, str)]


def run_axe_nodes(driver) -> list:
    """axe-core 4.4.1's violations with their elements: [{id, xpath}] (axe must already be injected)."""
    try:
        driver.execute_script(_XPATH_OF_JS)
        result = driver.execute_async_script(_AXE_NODES_JS)
    except Exception:
        return []
    return [r for r in (result or []) if isinstance(r, dict)] if isinstance(result, list) else []


def locate_snippets(driver, snippets) -> list:
    """XPaths (or None) of the elements the semantic detector's [START]…[END] snippets quote."""
    if not snippets:
        return []
    try:
        driver.execute_script(_XPATH_OF_JS)
        return driver.execute_script(_LOCATE_JS, snippets) or [None] * len(snippets)
    except Exception:
        return [None] * len(snippets)


_SNIPPET_RE = re.compile(r'\[START\](.*?)\[END\]', re.DOTALL)


def parse_semantic_items(raw: str) -> list:
    """Each quoted snippet with the violation name that follows it (before the next snippet):
    [{snippet, name}] — the name only when it is in the semantic taxonomy."""
    if not raw:
        return []
    items = []
    ms = list(_SNIPPET_RE.finditer(raw))
    for i, m in enumerate(ms):
        tail = raw[m.end(): ms[i + 1].start() if i + 1 < len(ms) else len(raw)]
        head = raw[(ms[i - 1].end() if i else 0): m.start()]
        name = None
        for seg in (tail, head):
            n = _NAME_RE.search(seg)
            if n and n.group(1).strip().lower() in SEMANTIC_VIOLATIONS:
                name = n.group(1).strip().lower(); break
        items.append({'snippet': m.group(1).strip().strip('`').strip(), 'name': name})
    return items


def axe_scs(violation_ids) -> set:
    scs = set()
    for vid in violation_ids:
        scs |= VIOLATION_TO_SCS.get(vid, set())
    return scs


# ---------------------------------------------------------------------------
# Semantic detector: LLM over AccessGuru's taxonomy prompt (+ HTML + screenshot)
# ---------------------------------------------------------------------------

def build_semantic_prompt(domain: str, url: str, html: str, max_html_chars: int = 60000) -> str:
    if len(html) > max_html_chars:
        html = html[:max_html_chars] + '\n<!-- [truncated] -->'
    return (SEMANTIC_PROMPT_TEMPLATE
            .replace('{DOMAIN}', domain)
            .replace('{URL}', url)
            .replace('{TAXONOMY}', SEMANTIC_TAXONOMY_STR)
            .replace('{HTML}', html))


_NAME_RE = re.compile(r'violation\s*name\s*:?\s*\**\s*`?([a-z0-9][a-z0-9\-]+)`?', re.IGNORECASE)


def parse_semantic(raw: str) -> list:
    """Extract detected semantic violation names from the LLM output.
    Primary: 'Violation Name: <name>' markers (their format). Fallback: scan for any
    taxonomy name mentioned. Only names in the semantic taxonomy are kept."""
    if not raw:
        return []
    found = set()
    for m in _NAME_RE.findall(raw):
        name = m.strip().lower()
        if name in SEMANTIC_VIOLATIONS:
            found.add(name)
    # fallback: any taxonomy name literally present in the text
    low = raw.lower()
    for name in SEMANTIC_VIOLATIONS:
        if name in low:
            found.add(name)
    return sorted(found)


def semantic_scs(violation_names) -> set:
    scs = set()
    for name in violation_names:
        scs |= VIOLATION_TO_SCS.get(name, set())
    return scs


def detect_semantic(domain: str, url: str, html: str, screenshot_b64: str) -> dict:
    """Run the LLM semantic detector once for the page. Returns detection + trace fields."""
    prompt = build_semantic_prompt(domain, url, html)
    blocks = [a11y_detector._text_block(prompt)]
    if screenshot_b64:
        blocks.append(a11y_detector._b64_image_block(screenshot_b64))
    prompt_text, raw, usage, reasoning, provider = a11y_detector.dispatch(blocks, system=AG_SYSTEM)
    names = parse_semantic(raw or '')
    return {
        'violation_names': names,
        'scs': sorted(semantic_scs(names)),
        'raw': raw,
        'reasoning': reasoning,
        'usage': usage,
        'provider': provider,
    }
