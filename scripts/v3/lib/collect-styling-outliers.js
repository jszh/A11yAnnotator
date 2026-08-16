'use strict';
// SC 1.3.1 — TEXT PRESENTATION used to convey information (WCAG **F2**).
//
// F2: "a change in the appearance of text conveys meaning without using appropriate semantic markup".
// Its own worked example styles a `<p>` with `font-family`, `font-size` and `font-weight` to look like a
// heading — so the failure is defined over *any* property that changes how text LOOKS, not over a
// hand-picked few.
//
// TWO DESIGN DECISIONS, both made to avoid fitting this to the pages that motivated it:
//
// 1. THE PROPERTY SET IS SOURCED FROM THE TECHNIQUE, NOT FROM A FIXTURE. An earlier cut checked only
//    weight/style/decoration and missed a page whose entire cue was `font-variant-caps: small-caps`.
//    The temptation is to add small-caps *because that page uses it*, which is exactly the overfit this
//    repo already names in sensory-lexicon.js ("a fixture-mined list silently passes the corpus while
//    missing real references"). Instead the set below enumerates the CSS text-appearance properties
//    wholesale — F2's own example spans three of them, and there is no principled reason to stop there.
//
// 2. PEERS ARE MATCHED BY STRUCTURAL POSITION, NOT BY SHARED PARENT. Bucketing on the immediate parent
//    put each of five product-card headings in a bucket of ONE (each lives in its own card wrapper), so
//    the two-plain / three-bold split that IS the failure could never be compared. The unit F2 cares
//    about is "comparable items", which on the web means the same position inside a REPEATED container.
//    The index-stripped DOM path expresses that directly: every `…/ul/li/div/h2` is one bucket however
//    many cards there are.
//
// Reports SHAPE only. Whether a presentation difference CARRIES INFORMATION is a judgment — a lede set
// larger and a caption set smaller are typographic hierarchy, not encoded meaning — and that judgment
// belongs to the rubric.
//
// ============================================================================================
// THE TRIGGER SET WAS CHOSEN BY MEASUREMENT. Seven variants were run over the same 925 pages with
// identical raw inputs, differing only in the discriminator:
//
//   all appearance properties ............................ 39.6% of pages   both target cases
//   minus colour and size-alone .......................... 28.6%            both
//   + require a genuinely REPEATED structure ............. 28.2%            both
//   "conventionally semantic" cues (caps/transform/
//     decoration/italic) ................................. 8.2%             one
//   + repeated ........................................... 7.9%             one
//   + strict 0.75 majority ............................... 5.3%             one
//   STRIKE-THROUGH + SMALL-CAPS ONLY  <-- shipped ........ 0.9%             one
//
// Two results are worth recording because both contradicted an expectation:
//
//  · Requiring the peers to come from a genuinely repeated container bought almost NOTHING
//    (28.6% -> 28.2%). The noise is already inside repeated structures; it is not stray hierarchy
//    between unrelated elements.
//  · The PROPERTY SET is the entire lever. `font-weight` and `font-size` are how the open web expresses
//    HIERARCHY, so a weight/size difference among peers is not evidence of encoding — it is evidence of
//    design. Strike-through and small-caps are different in kind: each has ONE conventional meaning
//    (removed/void; this run is a term), and neither is a hierarchy device.
//
// CONSEQUENCE, stated plainly: the shape where a MINORITY OF CARDS IS BOLDER AND LARGER to mean
// "promoted" is NOT separable from ordinary design by computed style — at 28.6% of all pages the
// predicate is measuring "this page has a visual hierarchy". That shape needs the screenshot and a
// judgment, not a style predicate, and it remains uncovered.
// ============================================================================================
function collectStylingOutliers() {
  const MAX_GROUPS = 6;
  const MAX_MEMBERS = 16;
  const MIN_MEMBERS = 3;            // fewer than three cannot have a majority and an outlier
  const MAJORITY = 0.6;

  // Semantic markup that DECLARES the distinction. If any peer carries one, the meaning is not
  // presentation-only and F2 does not apply.
  const SEMANTIC_SEL = 'strong, b, em, i, dfn, mark, ins, del, code, abbr, cite, q, sub, sup,'
    + ' [role="term"], [role="definition"], [role="mark"], [aria-label], [aria-labelledby], [title]';
  const SKIP = /^(script|style|svg|canvas|img|br|hr|pre|code|kbd|samp|option|head|meta|link)$/;

  const pathPattern = (e) => {
    const parts = [];
    for (let n = e; n && n.nodeType === 1 && n.tagName !== 'HTML'; n = n.parentElement) {
      parts.unshift(n.tagName.toLowerCase() + (n.getAttribute('role') ? '[' + n.getAttribute('role') + ']' : ''));
    }
    return parts.join('/');
  };
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const visible = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const ownText = (e) => {
    let t = ''; for (const n of e.childNodes) if (n.nodeType === 3) t += n.textContent;
    t = t.replace(/\s+/g, ' ').trim();
    return t || (e.textContent || '').replace(/\s+/g, ' ').trim();
  };
  // TRIGGER SET — measured, not assumed. See the option table in the header block below.
  const appearance = (cs) => [(cs.textDecorationLine || '').trim(), cs.fontVariantCaps].join('|');

  const buckets = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const tag = el.tagName.toLowerCase();
    if (SKIP.test(tag)) continue;
    if (el.closest('pre, code')) continue;
    if (!visible(el)) continue;
    const txt = ownText(el);
    if (txt.length < 2) continue;                       // no text ⇒ no TEXT presentation to judge
    const key = pathPattern(el);
    if (!buckets.has(key)) buckets.set(key, []);
    const b = buckets.get(key);
    if (b.length < MAX_MEMBERS) b.push({ el, xpath: xpathOf(el), label: txt.slice(0, 40), sig: appearance(getComputedStyle(el)) });
  }

  const groups = [];
  for (const [key, members] of buckets) {
    if (groups.length >= MAX_GROUPS) break;
    if (members.length < MIN_MEMBERS) continue;
    const tally = new Map();
    for (const m of members) tally.set(m.sig, (tally.get(m.sig) || 0) + 1);
    if (tally.size < 2) continue;                       // uniform presentation ⇒ nothing conveyed by a change
    const [majSig, majN] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    if (majN / members.length < MAJORITY || majN === members.length) continue;
    const outliers = members.filter((m) => m.sig !== majSig);
    // A peer with semantic markup means the distinction IS declared — F2 does not apply to the set.
    if (members.some((m) => m.el.matches(SEMANTIC_SEL) || m.el.querySelector(SEMANTIC_SEL))) continue;
    // Which properties actually differ — so the rubric can see WHAT the change is, not just that there is one.
    const props = ['fontWeight', 'fontStyle', 'fontSize', 'fontFamily', 'fontVariantCaps', 'fontVariant', 'textTransform', 'letterSpacing', 'textDecorationLine', 'color'];  // REPORTED in full, even though size/colour do not TRIGGER
    const majMember = members.find((m) => m.sig === majSig);
    const majCs = getComputedStyle(majMember.el);
    const outCs = getComputedStyle(outliers[0].el);
    const changed = props.filter((p) => String(majCs[p] || '').trim() !== String(outCs[p] || '').trim());
    groups.push({
      pattern: key.split('/').slice(-4).join('/'),
      memberCount: members.length,
      outlierCount: outliers.length,
      changedProperties: changed,
      outliers: outliers.slice(0, 6).map((m) => ({ xpath: m.xpath, label: m.label })),
      majority: members.filter((m) => m.sig === majSig).slice(0, 4).map((m) => ({ xpath: m.xpath, label: m.label })),
    });
  }
  // ---- SECOND SHAPE: a recurring INLINE CONVENTION -------------------------------------------------
  // The outlier pass finds "one of these is special". F2's other shape is a CONVENTION: inline runs styled
  // differently from the prose AROUND them to mean something — defined terms, cross-references, statuses.
  // There is no outlier there (every member is styled identically); the contrast is with the PARENT, and the
  // evidence that it means something is that it RECURS. This is the shape a purely sibling-comparing pass
  // structurally cannot see, which is why both exist.
  const conventions = new Map();
  for (const el of document.querySelectorAll('span, i, b, u, font, small, mark, em, strong')) {
    if (el.matches(SEMANTIC_SEL) || el.querySelector(SEMANTIC_SEL)) continue;   // the meaning IS declared
    if (el.closest('pre, code, a[href], button, [role=button], [role=link]')) continue;
    if (!visible(el)) continue;
    const parent = el.parentElement; if (!parent) continue;
    const cs = getComputedStyle(el); const ps = getComputedStyle(parent);
    if (appearance(cs) === appearance(ps)) continue;                            // renders like its context
    const txt = ownText(el); if (txt.length < 2) continue;
    // WHICH properties differ — the same spec-sourced set, so a `font-variant-caps` convention counts
    // exactly as a bold one does. An earlier cut hard-coded bold/italic/underline and was blind to
    // small-caps, which is the kind of gap a fixture-derived list produces.
    const TRIGGER = ['textDecorationLine', 'fontVariantCaps'];
    const changed = TRIGGER.filter((k) => String(cs[k] || '').trim() !== String(ps[k] || '').trim());
    if (!changed.length) continue;
    const sig = changed.join(',') + '|' + appearance(cs);
    if (!conventions.has(sig)) conventions.set(sig, { changed, members: [] });
    const c = conventions.get(sig);
    if (c.members.length < MAX_MEMBERS) c.members.push({ xpath: xpathOf(el), label: txt.slice(0, 40) });
  }
  const inlineConventions = [];
  for (const [, c] of conventions) {
    if (c.members.length < 2) continue;                 // a one-off flourish is not a convention
    inlineConventions.push({ changedProperties: c.changed, count: c.members.length, members: c.members.slice(0, 8) });
    if (inlineConventions.length >= MAX_GROUPS) break;
  }
  return { outlierGroups: groups, inlineConventions };
}

module.exports = { collectStylingOutliers };
