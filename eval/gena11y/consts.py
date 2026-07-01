import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EVAL_DIR = os.path.normpath(os.path.join(BASE_DIR, '..', 'act-augmented'))
TEMP_FILE_FOLDER = os.path.join(BASE_DIR, 'tmp_images')
os.makedirs(TEMP_FILE_FOLDER, exist_ok=True)

# SCs from categories.json that GenA11y's element extraction can cover.
# Element-level violations → LLM gets extracted DOM snippets + XPath labels.
COVERED_SCS = {
    '1.1.1',   # Non-text Content (visual elements)
    '1.3.1',   # Info and Relationships (tables, ARIA, lists, etc.)
    '1.3.2',   # Meaningful Sequence (linearized tables, whitespace, layout)
    '1.4.1',   # Use of Color (screenshot-based)
    '1.4.3',   # Contrast (Minimum) (computed colors)
    '1.4.5',   # Images of Text (image URLs, vision)
    '1.4.10',  # Reflow (before/after screenshot at 400%)
    '2.4.2',   # Page Titled
    '2.4.4',   # Link Purpose (In Context)
    '2.4.6',   # Headings and Labels
    '2.4.10',  # Section Headings
    '3.3.1',   # Error Identification (screenshot)
    '3.3.2',   # Labels or Instructions (form elements)
    '3.3.3',   # Error Suggestion (screenshot)
    '4.1.2',   # Name, Role, Value
}

# SCs in categories.json that GenA11y doesn't have extraction for;
# the runner emits "UNCOVERED" for these so they can be excluded from metrics.
UNCOVERED_SCS = {
    '1.4.11',  # Non-text Contrast (requires pixel-level runner)
    '1.4.13',  # Content on Hover or Focus (requires interaction)
    '2.1.1',   # Keyboard (requires keyboard navigation)
    '2.1.2',   # No Keyboard Trap (requires keyboard navigation)
    '2.4.3',   # Focus Order (requires tab-order inspection)
    '2.4.7',   # Focus Visible (requires focus state screenshot)
    '4.1.3',   # Status Messages (requires dynamic interaction)
}

ALL_CATEGORIES_SCS = COVERED_SCS | UNCOVERED_SCS

# Anthropic model to use
CLAUDE_MODEL = 'claude-sonnet-4-6'

# System prompt shared by all detection functions
SYSTEM_MESSAGE = (
    'You are an Accessibility Expert (WCAG Specialist) detecting WCAG 2.2 violations on web pages. '
    'Analyze the provided HTML elements and screenshots for compliance with the specified success criterion. '
    'Be precise and avoid false positives — only flag clear violations, not ambiguous cases.\n\n'
    'Each element in the input may be prefixed with a [path: /html/...] label giving its XPath. '
    'Include that XPath verbatim in your output for any violated element.\n\n'
    'Respond with ONLY a JSON object in this exact format (no markdown, no prose):\n'
    '{\n'
    '  "verdict": "REPRODUCED" | "NOT REPRODUCED" | "PARTIAL",\n'
    '  "confidence": "high" | "medium" | "low",\n'
    '  "violations": [\n'
    '    {\n'
    '      "xpath": "<value from [path: ...] label, or null if page-level>",\n'
    '      "outerHTML": "<opening tag only, no children>",\n'
    '      "reason": "<why it violates the criterion>",\n'
    '      "recommendation": "<how to fix>"\n'
    '    }\n'
    '  ],\n'
    '  "summary": "<1-2 sentence summary of findings>"\n'
    '}\n\n'
    'Use "REPRODUCED" when violations are found, '
    '"NOT REPRODUCED" when none are found, '
    '"PARTIAL" when some elements pass and others fail or evidence is incomplete.'
)
