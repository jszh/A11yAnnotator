"""
AccessGuru adapter constants (from NadeenAhmad/AccessGuruLLM).

AccessGuru's DETECTION module is a hybrid:
  - a SYNTAX/LAYOUT detector = axe-core 4.4.1 (deterministic; run via Selenium here,
    mirroring their Playwright `axe.run(document)`), and
  - a SEMANTIC detector = an LLM prompted with their semantic-violation taxonomy +
    the page HTML + a rendered screenshot (their exact PROMPT_TEMPLATE / output markers).
Both detectors' findings map to WCAG SCs via their `mapping_dict_file.json`. A page's
target SC is flagged if EITHER detector produces a violation mapping to it.
"""
import csv
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
AXE_JS_PATH = os.path.join(DATA_DIR, 'axe-4.4.1.min.js')

# violation-id → list of "X.Y.Z Name" WCAG strings (their mapping)
with open(os.path.join(DATA_DIR, 'mapping_dict_file.json')) as f:
    _MAP_RAW = json.load(f)

# normalize to violation-id → set of bare SC numbers ("1.1.1")
def _sc_num(s):
    return s.strip().split(' ', 1)[0]

VIOLATION_TO_SCS = {vid: {_sc_num(x) for x in scs} for vid, scs in _MAP_RAW.items()}

with open(os.path.join(DATA_DIR, 'violations_short_description.json')) as f:
    VIOLATION_DESC = json.load(f)

# Semantic violation types (Category == " Semantic" in their taxonomy CSV) — the LLM
# detector's target set. These are the violations axe cannot catch.
SEMANTIC_VIOLATIONS = []
with open(os.path.join(DATA_DIR, 'violation_taxonomy.csv')) as f:
    for row in csv.DictReader(f):
        if (row.get('Category') or '').strip().lower() == 'semantic':
            name = (row.get('violationnumberID') or '').strip()
            if name:
                SEMANTIC_VIOLATIONS.append(name)

# Fallback hard-coded descriptions for the 2 semantic types lacking a short description.
_EXTRA_DESC = {
    'video-captions-not-descriptive': 'Captions/subtitles are present but do not accurately convey the audio content.',
    'landmark-structural-violation': 'Landmark regions (header/nav/main/footer) are missing or structured incorrectly.',
    'landmark-purpose-mismatch': 'A landmark role does not match the actual purpose/content of the region.',
}

def _taxonomy_block():
    lines = ['Semantic Violation Taxonomy (violation-name: description):']
    for name in SEMANTIC_VIOLATIONS:
        desc = VIOLATION_DESC.get(name) or _EXTRA_DESC.get(name, '')
        lines.append(f'- {name}: {desc}' if desc else f'- {name}')
    return '\n'.join(lines)

SEMANTIC_TAXONOMY_STR = _taxonomy_block()

# SCs reachable by the SEMANTIC detector (union of the semantic types' mapped SCs).
SEMANTIC_SCS = set()
for _v in SEMANTIC_VIOLATIONS:
    SEMANTIC_SCS |= VIOLATION_TO_SCS.get(_v, set())

# AccessGuru semantic detector — their exact system + prompt template + output markers.
AG_SYSTEM = 'You are a web accessibility expert.'

SEMANTIC_PROMPT_TEMPLATE = """ You are a web accessibility expert. Your task is to detect semantic accessibility violations in the given HTML Web page. These violations are often not detectable by standard automated tools and require interpretation of the content meaning and user context.

A semantic violation occurs when:
- Attributes like alt text, language, or link/button labels are present but do not provide meaningful or accurate information,
- Visual or multimedia content is not described in a way that conveys its purpose to users with disabilities.

Use the information below to guide your analysis, you are operating on:
- The domain of the web page: {DOMAIN}
- The URL of the web page: {URL}

You are provided with:
- The HTML code of the web page to analyze,
- The full semantic violation taxonomy. This taxonomy defines specific types of semantic violations, their descriptions,
- A screenshot of the rendered view of the web page.

{TAXONOMY}

HTML:
{HTML}

(Screenshot attached below.)

Now, review the HTML and supplementary data. List all semantic violations you detect, and for each:
1. Identify the affected HTML element. Enclose the exact HTML snippet using the markers [START] and [END].
2. Specify the violation name (use the exact violation-name from the taxonomy).
"""
