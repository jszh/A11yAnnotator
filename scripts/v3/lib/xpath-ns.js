'use strict';
// NAMESPACE-AGNOSTIC XPATH (LLM-ROUTING-AND-FAILURE-ANALYSIS Tier-0 #1). `document.evaluate(xpath, …, 9, …)`
// uses an UNPREFIXED name-test, which matches ONLY null-namespace (HTML) nodes — so an SVG/MathML-namespaced
// subject (`/html/body/svg[1]/a[1]`, a chart, a wordmark) resolves to `singleNodeValue=null`, silently loses
// its crop, and abstains at the required-evidence gate. The fix the appendix probe-verified: rewrite each
// plain lowercase element step `tag` / `tag[idx]` to `*[local-name()='tag'][idx]`, which matches a node of
// that local name in ANY namespace (and resolves the IDENTICAL node for HTML, whose local-name is lowercase).
//
// PURE Node-side string rewrite (NOT injected into the page): no `eval`/`new Function`, so a strict-CSP corpus
// page can't block it, and the ORIGINAL xpath stays the visionByXpath / observation map key — only the string
// handed to `document.evaluate` is rewritten. Idempotent: an already-rewritten `*[local-name()=…]` step is
// left untouched. Non-element steps (`*`, `@attr`, `text()`, `node()`, an axis `::` step such as the synthetic
// `page-level::title`, or any predicate richer than a bare positional index) are left as-is.
function nsXPath(xpath) {
  if (typeof xpath !== 'string' || xpath.indexOf('/') === -1) return xpath;
  return xpath.split('/').map((step) => {
    if (!step) return step; // '' from the leading '/' (root) or a '//' descendant step
    const m = /^([a-zA-Z][\w-]*)(\[\d+\])?$/.exec(step); // a bare element name with an OPTIONAL positional index
    if (!m) return step; // *, @attr, text(), already-rewritten local-name(), axis::, or a non-positional predicate
    return `*[local-name()='${m[1]}']${m[2] || ''}`;
  }).join('/');
}

module.exports = { nsXPath };
