/**
 * resolve-xpath.js - the one resolver both the enrichment pass and the study
 * client use to turn a sampled xpath back into a node.
 *
 * The xpaths in the corpus are produced by the collector's `xpathOf`, which is
 * a purely structural path: every step is `tag[nth-of-that-tag-among-siblings]`
 * with no predicates, no wildcards, no text tests. `document.evaluate` is NOT a
 * correct inverse of it, because XPath name tests are namespace-aware: an
 * unprefixed `svg` step matches only elements in no namespace, so every path
 * ending in an SVG node silently resolves to null. That is not hypothetical -
 * it accounts for 5 of the 30 unresolved cases in the first enrichment pass
 * over this sample (icon <svg> under 1.1.1 on the o11 page).
 *
 * So walk the tree instead, comparing tagName the same way `xpathOf` built it.
 * `document.evaluate` is kept as a fallback for any path shape the walker does
 * not understand.
 *
 * Loaded as a plain script in the browser (defines window.resolveStudyXpath)
 * and required in Node for the enrichment pass, so it stays a single source.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.resolveStudyXpath = api.resolveStudyXpath;
  root.RESOLVE_XPATH_SRC = api.source;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Kept as a string as well so it can be handed to page.evaluate / injected
  // into a frame without bundling.
  const source = `function resolveStudyXpath(xpath, doc) {
    doc = doc || document;
    if (typeof xpath !== 'string' || !xpath) return null;
    if (xpath.indexOf('/page-level::') === 0) return null; // page-scope pseudo-path: no node
    var steps = xpath.replace(/^\\//, '').split('/');
    var node = null;
    for (var i = 0; i < steps.length; i++) {
      var m = /^([A-Za-z0-9_.:-]+)(?:\\[(\\d+)\\])?$/.exec(steps[i]);
      if (!m) { node = null; break; }
      var tag = m[1].toLowerCase();
      var nth = m[2] ? parseInt(m[2], 10) : 1;
      var kids;
      if (node === null) {
        // first step is the document element
        kids = doc.documentElement ? [doc.documentElement] : [];
      } else {
        kids = [];
        for (var k = node.firstElementChild; k; k = k.nextElementSibling) kids.push(k);
      }
      var seen = 0, hit = null;
      for (var j = 0; j < kids.length; j++) {
        var t = kids[j].tagName;
        // SVG/MathML tagName is case-sensitive and can be camelCase
        // (linearGradient); xpathOf lowercased it, so compare lowercased.
        if (t && String(t).toLowerCase() === tag) { seen++; if (seen === nth) { hit = kids[j]; break; } }
      }
      if (!hit) { node = null; break; }
      node = hit;
    }
    if (node) return node;
    try {
      return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || null;
    } catch (e) { return null; }
  }`;
  // eslint-disable-next-line no-new-func
  const resolveStudyXpath = new Function(`${source}; return resolveStudyXpath;`)();
  return { resolveStudyXpath, source };
});
