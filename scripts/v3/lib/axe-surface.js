// Harness 3.3 — C0: surface axe's already-decided coverage into v3 as a NON-AUTHORITATIVE checker
// cross-signal. axe runs at COLLECTION time (scripts/eval-page.js → `collect.axe`/`collect.axeRan`,
// + `collect.axeIncomplete` for needs-review outcomes), but the v3 ledger never consumed it — its
// decided wins were free coverage v3 threw away. We reconcile axe's decided wins (the allow-lists
// below) into a side `checkerFindings` artifact.
//
// INVARIANT (HARNESS-3.3-IMPLEMENTATION.md §2): a checker finding is NEVER an obligation disposition.
// It does not enter reconcile() and so adds NO tie-break — it is a shadow cross-signal at the same
// tier as instrument findings, unioned as evidence and scored against gold, never authoritative. So
// EXPANDING what we surface (this file) can only add shadow signals — it can never false-clear or
// false-barrier an obligation.
'use strict';

// (1) SCs surfaced WHOLESALE — every axe rule carrying one of these wcag tags is surfaced. axe owns
// these cleanly (the coverage analysis verified the rule families are precise, not noisy):
//   1.3.1 info-relationships, 1.3.5 autocomplete, 1.4.4 resize, 2.4.4 link purpose (pre-existing);
//   1.1.1 the non-text-name family that axe tags `wcag111` — image-alt/input-image-alt/svg-img-alt/
//         object-alt/role-img-alt, AND aria-meter-name/aria-progressbar-name (axe tags these 1.1.1 too,
//         though they read as 4.1.2 conceptually); note `area-alt` is NOT here (axe tags it 2.4.4/4.1.2);
//   2.1.1 scrollable-region-focusable/frame-focusable-content/server-side-image-map; 2.4.2 document-title.
const AXE_SURFACED_SCS = Object.freeze(new Set(['1.1.1', '1.3.1', '1.3.5', '1.4.4', '2.1.1', '2.4.2', '2.4.4']));
const AXE_SURFACED_PREFIXES = Object.freeze(['3.1.']); // 3.1.x language SCs (3.1.1 lang, 3.1.2 lang-of-parts)

// (2) PER-RULE allow-list — rules surfaced by their axe ruleId regardless of SC, so their (typically
// 4.1.2) limb is consumed WITHOUT opening bare 4.1.2 to the whole noisy name/aria family (coverage
// analysis §A caveat). Each is the verified ACT reference implementation for a name/aria-validity rule.
const AXE_SURFACED_RULES = Object.freeze(new Set([
  // name-presence (4.1.2 limb)
  'button-name', 'link-name', 'label', 'select-name', 'aria-input-field-name', 'aria-toggle-field-name',
  'summary-name', 'frame-title', 'aria-command-name',
  // aria-validity (4.1.2) — settled ARIA-legality facts axe decides deterministically, so the LLM lane is
  // never asked to re-judge them. `aria-hidden-focus` = a focusable element inside an aria-hidden=true
  // subtree (the element is removed from the a11y tree yet still tabbable → a name/role/value barrier);
  // `aria-prohibited-attr` = an aria-* attr the element's role forbids; `aria-braille-equivalent` = an
  // aria-braillelabel/brailleroledescription with no non-braille label/roledescription to back it (RCA: all
  // three carry axe's `wcag412` tag and promote to a decided 4.1.2 barrier via AXE_SC_FAMILY in build-v3).
  'aria-required-attr', 'aria-allowed-attr', 'aria-valid-attr', 'aria-roles', 'aria-valid-attr-value',
  'nested-interactive', 'aria-hidden-focus', 'aria-prohibited-attr', 'aria-braille-equivalent', 'aria-roledescription',
  // required owned/context (1.3.1 — redundant with the wholesale set, listed for intent/robustness)
  'aria-required-children', 'aria-required-parent', 'td-headers-attr',
  // use-of-color (1.4.1, coverage item #8) — F73: a link distinguishable from its surrounding text-block
  // ONLY by colour. axe tags it `wcag141`; we surface it per-rule so 1.4.1 is NOT opened wholesale.
  'link-in-text-block',
]));

// ALLOWLIST_SCS (coverage item #10): the ONLY SCs a per-rule-allow-listed rule may surface. The per-rule
// gate previously emitted a rule under EVERY wcag tag it carried, so a rule tagged with an out-of-scope
// SC (e.g. the obsolete `wcag411`/4.1.1, removed in WCAG 2.2) would leak that SC into the finding set.
// (In the bundled axe build no allow-listed rule currently carries `wcag411`, so the leak is latent —
// this is a defensive guard against a future rule, not a live bug.) These are the four SCs the allow-list
// legitimately evidences: 4.1.2 (name/aria), 2.4.4 (link-name's purpose limb), 1.3.1 (required owned/
// context, td-headers), 1.4.1 (link-in-text-block). Anything else an allow-listed rule tags is dropped.
const ALLOWLIST_SCS = Object.freeze(new Set(['4.1.2', '2.4.4', '1.3.1', '1.4.1']));

// (3) BEST-PRACTICE rules carry NO `/^wcag\d/` tag, so eval-page.js retains an EMPTY `wcag` array for
// them and tag-based surfacing alone drops them. Map the ruleId → { sc, review } (coverage item #6):
//   • review:false — the rule decides a genuine SC barrier (an empty heading, a role/decoration conflict).
//   • review:true  — the rule is an ADVISORY structure/navigation best-practice that is NOT a strict SC
//     failure (skipped heading level, non-unique landmark, content outside a region, positive tabindex).
//     Surfacing these as review-tier priors mirrors the axe-`incomplete` tier: a prior to weigh, never a
//     decided barrier. (Only SCs in the harness universe are mapped; 2.4.3 rides the triage queue.)
const BEST_PRACTICE_RULE_SC = Object.freeze({
  // 46ca7f — a decorative role=presentation/none in conflict with focusability/a global ARIA attr. axe's
  // matcher fires on ANY implicit-role element (li/nav/div/heading…), but ACT 46ca7f maps to 1.1.1 ONLY
  // for decorative NON-TEXT content; for text/non-decorative content it is not a WCAG failure at all. So
  // this is an ADVISORY prior (review:true), NOT a decided 1.1.1 barrier (adversarial verify #2).
  'presentation-role-conflict': { sc: '1.1.1', review: true },
  'empty-heading':              { sc: '1.3.1', review: false }, // ffd0e9 — semantic heading with no accessible name (ARIA §5.2.8)
  // advisory structure priors (1.3.1 info-relationships) — real signals, not strict failures:
  'heading-order':              { sc: '1.3.1', review: true },  // a skipped heading level (G141 is advisory)
  'landmark-unique':            { sc: '1.3.1', review: true },  // two landmarks share role+name
  'landmark-one-main':          { sc: '1.3.1', review: true },  // page lacks a single main landmark
  'region':                     { sc: '1.3.1', review: true },  // content sits outside any landmark
  'page-has-heading-one':       { sc: '1.3.1', review: true },  // no level-1 heading
  'empty-table-header':         { sc: '1.3.1', review: true },  // a <th>/role=columnheader with no text
  'scope-attr-valid':           { sc: '1.3.1', review: true },  // a scope= value that is not row/col(group)
  // advisory name/role priors (4.1.2):
  'aria-allowed-role':          { sc: '4.1.2', review: true },  // an explicit role not allowed on the element
  'aria-dialog-name':           { sc: '4.1.2', review: true },  // a dialog/alertdialog with no accessible name
  'aria-treeitem-name':         { sc: '4.1.2', review: true },  // a treeitem with no accessible name
  // advisory non-text prior (1.1.1):
  'image-redundant-alt':        { sc: '1.1.1', review: true },  // alt text duplicates adjacent visible text
  // advisory focus-order prior (2.4.3 — rides the triage queue):
  'tabindex':                   { sc: '2.4.3', review: true },  // a positive tabindex disturbs focus order
});

// axe carries its SC binding in the violation's own WCAG TAGS (e.g. 'wcag131'); level/version tags
// ('wcag2a', 'wcag21aa') and category tags do not match this and resolve to null (then dropped).
const wcagTagToSc = (t) => { const m = /^wcag(\d)(\d)(\d+)$/.exec(String(t)); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; };
const isSurfaced = (sc) => AXE_SURFACED_SCS.has(sc) || AXE_SURFACED_PREFIXES.some((p) => sc.startsWith(p));

// The surfaced SC set for one axe finding (violation or incomplete). A wholesale-tagged SC surfaces if
// `isSurfaced`; an allow-listed rule additionally surfaces its in-scope `ALLOWLIST_SCS` tags (so 4.1.2 is
// consumed without opening the noisy family) — but a tag OUTSIDE both gates (e.g. obsolete 4.1.1) is
// dropped (#10). A best-practice rule with no wcag tag falls back to its ruleId→{sc} mapping (#6).
function surfacedScsFor(v) {
  const ruleId = String(v.id || '');
  const tagScs = [...new Set((Array.isArray(v.wcag) ? v.wcag : []).map(wcagTagToSc).filter(Boolean))];
  const ruleAllowed = AXE_SURFACED_RULES.has(ruleId);
  let scs = tagScs.filter((sc) => isSurfaced(sc) || (ruleAllowed && ALLOWLIST_SCS.has(sc)));
  if (!scs.length && Object.prototype.hasOwnProperty.call(BEST_PRACTICE_RULE_SC, ruleId)) scs = [BEST_PRACTICE_RULE_SC[ruleId].sc];
  return [...new Set(scs)];
}

// Whether a surfaced finding is an ADVISORY best-practice prior (review-tier even when axe calls it a
// hard violation) — only the best-practice rules flagged `review:true` above.
function bestPracticeIsReview(ruleId) {
  const bp = BEST_PRACTICE_RULE_SC[ruleId];
  return !!(bp && bp.review === true);
}

// Map `collect.axe` (violations) + `collect.axeIncomplete` (needs-review) — the eval-page.js shape
// [{ id, impact, help, wcag:[tag…], nodes:[{target,html}] }] — to surfaced checker findings.
//
// FAIL-CLOSED: `collect.axeRan` MUST be EXACTLY true. A missing sentinel means axe never ran on this
// page — surfacing nothing then is correct, but we must NOT let "no findings" read as "axe says clean"
// (R2.7-B). Callers should treat `ran:false` as "no axe signal", not "no violations".
//
// A finding can carry several decided SC tags and several nodes; it fans out to one finding per
// (rule, SC, element, kind), deduped by (ruleId, sc, target, kind). axe's raw `html` snippet and human
// `help` prose are dropped: the surfaced finding is structured harness data (rule id + SC + impact +
// element selector), so it cannot leak page content into the strictly-scanned v3 results.
function surfaceAxeFindings(collect) {
  const ran = !!(collect && collect.axeRan === true);
  if (!ran) return { ran, findings: [] };
  const findings = [];
  const seen = new Set();
  // kind:'violation' is axe's hard finding (review:false ⇒ a decided hard signal); kind:'incomplete' is
  // axe's needs-review outcome (review:true ⇒ a prior, NOT a decision) — e.g. td-headers-attr empty-headers,
  // aria-required-children empty-container, aria-prohibited-attr ambiguity. Both stay non-authoritative.
  const emit = (list, kind, review) => {
    for (const v of (Array.isArray(list) ? list : [])) {
      if (!v || typeof v !== 'object') continue;
      const ruleId = String(v.id || 'axe-rule');
      const impact = v.impact != null ? String(v.impact) : '';
      const scs = surfacedScsFor(v);
      if (!scs.length) continue; // finding carries no surfaced SC → not surfaced
      // an advisory best-practice rule is review-tier even when axe reports it as a hard violation (#6).
      const effReview = review || bestPracticeIsReview(ruleId);
      const nodes = Array.isArray(v.nodes) && v.nodes.length ? v.nodes : [null];
      for (const sc of scs) {
        for (const n of nodes) {
          const target = n && Array.isArray(n.target) ? n.target.join(' ') : (n && n.target != null ? String(n.target) : null);
          // PREFER the v3 xpath the collector resolved at collection time (n.xpath) so build-v3 can match the
          // finding to an obligation by xpath (the axe-promotion). Falls back to the raw CSS target when absent
          // (older collector output / a node the collector couldn't resolve) — then it stays a shadow-only signal.
          const xpath = (n && typeof n.xpath === 'string' && n.xpath) || target;
          const key = `${ruleId}::${sc}::${target || ''}::${kind}`;
          if (seen.has(key)) continue;
          seen.add(key);
          findings.push({ source: 'axe', detector: `axe:${ruleId}`, ruleId, sc, impact, kind, xpath, cssTarget: target, review: effReview });
        }
      }
    }
  };
  emit(collect.axe, 'violation', false);
  emit(collect.axeIncomplete, 'incomplete', true);
  return { ran: true, findings };
}

module.exports = { surfaceAxeFindings, surfacedScsFor, bestPracticeIsReview, wcagTagToSc, isSurfaced, AXE_SURFACED_SCS, AXE_SURFACED_PREFIXES, AXE_SURFACED_RULES, ALLOWLIST_SCS, BEST_PRACTICE_RULE_SC };
