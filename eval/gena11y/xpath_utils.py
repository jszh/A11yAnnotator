"""XPath helpers for element identification in the adapted GenA11y pipeline."""

# Injects a positional XPath (e.g., /html/body/div[1]/a[2]) for any DOM element.
# Uses tag-name-scoped sibling counting (same as our v3 harness convention).
_GET_XPATH_JS = """
(function getXPath(el) {
    if (!el || el.nodeType !== 1) return '';
    var parts = [];
    while (el && el.nodeType === 1) {
        var idx = 1;
        var sib = el.previousSibling;
        while (sib) {
            if (sib.nodeType === 1 && sib.tagName === el.tagName) idx++;
            sib = sib.previousSibling;
        }
        parts.unshift(el.tagName.toLowerCase() + '[' + idx + ']');
        el = el.parentNode;
    }
    return '/' + parts.join('/');
})(arguments[0])
"""


def get_element_xpath(driver, element):
    """Return absolute positional XPath for a live Selenium WebElement."""
    try:
        return driver.execute_script(_GET_XPATH_JS, element) or ''
    except Exception:
        return ''


def format_with_xpath(outer_html, xpath):
    """Prefix outerHTML with its [path: ...] label for LLM consumption."""
    if xpath:
        return f'[path: {xpath}]\n{outer_html}'
    return outer_html


def extract_outer_html_and_xpath(driver, element):
    """Return (outerHTML, xpath) for a Selenium element, catching stale refs."""
    try:
        outer_html = element.get_attribute('outerHTML') or ''
        xpath = get_element_xpath(driver, element)
        return outer_html, xpath
    except Exception:
        return '', ''


def build_xpath_map(driver, elements):
    """
    Given a flat list of Selenium elements, return {outerHTML: xpath}.
    Used so detection code can resolve LLM-returned outerHTML back to XPath.
    """
    m = {}
    for el in elements:
        html, xpath = extract_outer_html_and_xpath(driver, el)
        if html and xpath and html not in m:
            m[html] = xpath
    return m


def resolve_xpath(html_snippet, xpath_map):
    """
    Best-effort lookup of xpath for a given outerHTML string.
    The LLM sometimes trims whitespace or attributes; fall back to substring.
    """
    if not html_snippet:
        return None
    if html_snippet in xpath_map:
        return xpath_map[html_snippet]
    # substring match — take the first key that contains or is contained by the snippet
    snippet_stripped = html_snippet.strip()
    for known, xpath in xpath_map.items():
        k = known.strip()
        if snippet_stripped in k or k in snippet_stripped:
            return xpath
    return None
