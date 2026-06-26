# Discovery-lane recall research report

Date: 2026-06-21

Scope: follow-up on `REPORT.md` item 4.3, the overlap between the 14 systematic false negatives and
`docs/DEFERRED-TODO.md` item B, "Screenshot+LLM page pre-analysis". This pass is deliberately quota-safe:
no fresh Claude/LLM ACT runs and no fresh ACT reruns were performed. Evidence comes from the existing run
artifacts, static/adversarial code inspection, local ACT testcase HTML, WCAG/ACT guidance, and related-work
search.

## Executive summary

The item-B thesis is right but too broad. The 14 systematic FNs are not one failure mode called "needs a
screenshot". They split into at least four discovery problems:

1. Visual subject discovery: rendered images/text/graphics are visible to users but no obligation reaches the
   rubric.
2. Relational subject-set discovery: the page has the right individual elements, but the WCAG/ACT assertion is
   about a set, such as identically named iframes or same-name links.
3. Interactive state discovery: the barrier exists only after keyboard or activation state exploration.
4. Evidence resolver gaps: an obligation exists, but the required destination, page purpose, or escape-instruction
   evidence is unavailable or misrouted.

The best course is therefore not one monolithic page-level VLM call. Build a typed discovery layer: visual
triage as a candidate producer, deterministic set-level obligation producers, live interaction producers, and
resolver/provenance upgrades. Every lane should mint obligations or review candidates, not direct pass/fail
claims.

The most concrete current bug found here is that `images-of-text` and `non-text-content` are currently coupled
behind the same `removedFromA11yTree !== true` gate in
`scripts/v3/lib/applicability-oracle.js`. That suppresses both ACT `e88epe` decorative-marking failures and
ACT `0va7u6` image-of-text failures such as an empty-alt image that visually says "Welcome to our website".
This should be split: visible images removed from the accessibility tree can still owe an image-of-text
review, and can still owe a decorative-marking review for 1.1.1 when the pixels appear semantically unique.

## Evidence used

- Existing systematic-FN set: `evidence/systematic-error-decomposition.md`.
- Existing-run ledger created in this pass: `evidence/discovery-fn-ledger-from-existing-runs.json`.
- Existing current-ish run checked for status: `results/run10-deployed-current/results.json`.
- Local ACT testcase HTML under `eval/checker-comparison/act-subset/pages/`.
- Current code:
  - `scripts/v3/lib/applicability-oracle.js`
  - `scripts/v3/lib/act-page-collect.js`
  - `scripts/v3/lib/run-instruments.js`
  - `scripts/v3/lib/build-v3.js`

No new LLM-generated judgments were produced.

## WCAG and ACT grounding

W3C WAI explicitly warns that tools can identify potential issues but cannot automatically check all accessibility
aspects; human judgment is required and tool results can be false or misleading:
https://www.w3.org/WAI/test-evaluate/tools/selecting/

Relevant SC/ACT constraints:

- WCAG 1.1.1 requires text alternatives for non-text content presented to users, while pure decoration or visual
  formatting can be ignored by assistive technology:
  https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html
- ACT `e88epe` checks visible `img`, `svg`, and `canvas` elements ignored by AT and expects each test target to be
  purely decorative. It also has important exceptions, including images inside an ancestor named from author:
  https://www.w3.org/WAI/standards-guidelines/act/rules/e88epe/
- WCAG 1.4.5 requires text instead of images of text except where the presentation is customizable or essential:
  https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html
- WCAG 2.1.2 allows focus traps only if focus can be moved away by keyboard, or if users are advised of a
  non-standard escape method:
  https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html
- WCAG 4.1.2 requires name, role, and value to be programmatically determinable for UI components:
  https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html
- WCAG 2.4.4 link purpose can be determined from link text or programmatically determined link context:
  https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html
- WCAG 2.4.2 requires page titles that describe topic or purpose:
  https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html

Recent related work lines up with the harness direction: LLMs help most on semantic/text-centric accessibility
judgments, but remain unreliable as sole deciders, especially for syntactic/layout behavior. See the 2026 SLR
on LLMs for web accessibility and the 2026 empirical LLM repair/detection study:

- https://arxiv.org/abs/2605.13873
- https://arxiv.org/abs/2605.27716

## Current status of the original 14 stable FNs

This table uses `results/run10-deployed-current` as a current existing-run reference, not as a fresh experiment.
The original "14" label comes from the three-run variance baseline.

| Case | Rule | SC | Existing run10 status | Root cause class | Best next lane |
|---|---:|---:|---|---|---|
| `8fba3918` | `80af7b` | 2.1.2 | `noVerdict` | Interaction plus semantic advisory | Keyboard state-machine plus escape-advisory review |
| `62fd24e7` | `80af7b` | 2.1.2 | `uncertain` | Interaction plus semantic advisory | Keyboard state-machine plus escape-advisory review |
| `7dcc4ae0` | `80af7b` | 2.1.2 | `noObligation` | Trap surface not discovered | Interaction discovery producer |
| `c1cc2a71` | `4b1c6c` | 4.1.2 | `missedAgree` | Per-iframe rubric used for set-level assertion | Same-name iframe set obligation |
| `ac65ce86` | `4b1c6c` | 4.1.2 | `missedAgree` | Per-iframe rubric used for set-level assertion | Same-name iframe set obligation |
| `4d33680e` | `4b1c6c` | 4.1.2 | `missedAgree` | Per-iframe rubric used for set-level assertion | Same-name iframe set obligation |
| `e5b8fa7a` | `e88epe` | 1.1.1 | `noObligation` | Visible image removed from AT tree suppressed | Decorative-marking review obligation |
| `5d0c52f3` | `e88epe` | 1.1.1 | `noObligation` | Visible image removed from AT tree suppressed | Decorative-marking review obligation |
| `9ff50232` | `e88epe` | 1.1.1 | `noObligation` | Visible image removed from AT tree suppressed | Decorative-marking review obligation |
| `e1d4ed75` | `0va7u6` | 1.4.5 | `noObligation` | Image-of-text suppressed by decorative/AT-tree gate | Split 1.4.5 from 1.1.1 gate |
| `bf023941` | `0va7u6` | 1.4.5 | `caught` | Already improved in this existing run | Keep as regression fixture |
| `dddcd76a` | `fd3a94` | 2.4.4 | `uncertain` | Destination resolver refused | Local destination resolver/provenance |
| `7ebe961d` | `fd3a94` | 2.4.4 | `missedAgree` | Same-name link equivalence unresolved or misread | Link-set obligation plus resolver |
| `4c72b3b9` | `c4a8a4` | 2.4.2 | `missedAgree` | Page-title purpose needs page-substance comparison | Page-title semantic packet plus full-page context |

The run10 details confirm the set-level iframe problem: for `c1cc2a71`, two iframes both named "List of
Contributors" point to `page-one.html` and `page-two.html`, but the harness sent each iframe separately to
`accessible-name-adequacy-v0`, which returned `LIKELY_OK` for both names. That is true locally and wrong for the
ACT assertion, which is about equivalent purpose across identically named frames.

The local ACT HTML confirms the visual/AT-tree suppression problem:

- `e5b8fa7a`: `<img ... alt="">` displays the W3C logo and has no accessible alternative.
- `5d0c52f3`: `<img ... aria-hidden="true" alt="W3C logo">` displays the W3C logo but removes it from AT.
- `9ff50232`: `<img ... role="none" alt="W3C logo">` displays the W3C logo but removes it from AT.
- `e1d4ed75`: `<img ... alt="">` displays "Welcome to our website" as an image of text.

## Static/adversarial code findings

### Finding 1: `removedFromA11yTree` suppresses the exact review cases item B needs

`act-page-collect.js` collects `removedFromA11yTree`, `hiddenMechanism`, `renderedVisible`, `nearbyText`, and
`ariaHiddenWithName` for image-like elements. Good raw evidence exists.

But `applicability-oracle.js` currently enumerates both `non-text-content` and `images-of-text` only when the
graphic is not removed from the accessibility tree:

```js
if ((IMG_ROLE.test(role) || el.isImage === true) && el.removedFromA11yTree !== true && el.svgNamedDescendant !== true) {
  fams.push('non-text-content');
  fams.push('images-of-text');
}
```

That explains why `e88epe` and `e1d4ed75` reach no rubric in run10. The comment says a hidden-but-meaningful
graphic is "still caught by the alt-text-adequacy decorative-marking signal", but there is no obligation for that
signal to fill in the observed run.

Adversarial check: simply removing the gate would over-enumerate many legitimate decorative images. ACT `e88epe`
has passed examples where an empty-alt or aria-hidden image is purely decorative, and it has an exception for a
named ancestor. So the fix should not be a deterministic barrier. It should be a discovered/review obligation with
positive visual and context evidence.

Recommended change:

- Split `images-of-text` from `non-text-content`.
- Enumerate `images-of-text` for visible `img/svg/canvas/role=img` even when removed from AT, unless the graphic is
  clearly absent from rendering or is an explicitly scoped non-text exception.
- Add a separate `decorative-marking-review` or `non-text-content` review path for visible removed-from-tree images
  where `renderedVisible` is true and the image is not inside an author-named ancestor.
- Feed the rubric `hiddenMechanism`, `nearbyText`, `ariaHiddenWithName`, crop/OCR, and ancestor-name facts.
- Keep verdicts provisional until gold validation.

### Finding 2: item B should discover regions, not decide barriers

The current build pipeline already has the correct consumption shape: `build-v3.js` calls
`dynamic.expandDiscovered(bundle.experiments)`, and checker uncertainty can mint obligations from incomplete
checker findings. The missing part is the producer for page-level visual candidates.

Adversarial check: a full-page screenshot model can easily mark decorative graphics, logos, photos, or icons as
"meaningful" without knowing adjacent text, named ancestors, or ACT exceptions. That creates false positives if the
triage lane decides. Therefore item B should return bounded candidate regions plus why, and the per-region rubric
should decide or abstain.

Recommended shape:

- One page-level visual triage call per page when LLM quota returns.
- Inputs: viewport/full-page tiles, compact DOM/AX summary, page title, and existing obligation inventory.
- Outputs: candidate regions with `bbox`, resolvable DOM target if possible, suspected SC/family, and reason.
- Outputs must not be `BARRIER_OBSERVED` or `NO_BARRIER_OBSERVED`.
- Each candidate becomes a discovered obligation with screenshot hash, DOM digest, target/bbox provenance, and cap
  accounting.

### Finding 3: same-name iframe and link cases need set-level obligations

The `4b1c6c` cases are not solved by better per-element accessible-name prompting. The individual names can be
excellent while the set fails because identically named iframes lead to different resources/purposes.

Adversarial check: "two iframes share a name" is not by itself a barrier. They can embed identical resources or
different URLs with equivalent content. A deterministic producer can discover the set, but final equivalence still
needs resolver evidence and possibly semantic judgment.

Recommended change:

- Add a `iframe-equivalent-purpose` claim family for 4.1.2 set-level obligations.
- Producer: group in-tree iframes by normalized accessible name. Mint one obligation per group with size >= 2.
- Evidence: title/name, `src`, resolved final URL if local/same-origin, frame title/body fingerprint when readable,
  and screenshots/crops for each frame.
- Auto-clear only when a sound equivalence proof exists, such as identical resolved resource and identical relevant
  frame content digest.
- Otherwise route to a purpose-equivalence rubric or human label, not `accessible-name-adequacy-v0`.

Same-name link cases should follow the same pattern: group links by accessible name and programmatically determined
context, resolve destinations locally where possible, then ask a narrow equivalence question. The `dddcd76a`
run10 rubric summary shows the current resolver refusal is enough to turn a likely barrier into `UNCERTAIN`.

### Finding 4: keyboard-trap recall is partly behavioral and partly semantic

`run-instruments.js` already makes the right soundness call for fixed-set confinement: it demotes that detector to
review because WCAG 2.1.2 permits non-standard keyboard escape methods if users are advised. Pure keyboard driving
cannot tell whether the page tells users "press Ctrl+M to exit".

Adversarial check: a bounded Tab/Shift+Tab/Escape loop with documented non-standard exit and the same loop without
that documentation are mechanically identical until semantic page text is read. Promoting fixed-set confinement
directly to a barrier would create false positives.

Recommended change:

- Keep self-refocus and confirmed no-exit traps as deterministic/provisional barriers where already validated.
- For fixed-set confinement, mint a `no-keyboard-trap` review obligation over the confined set, not only the first
  target.
- Add a narrow "escape advisory" semantic packet: visible text near the trapped region, accessible descriptions,
  instructions, modal/dialog labels, and attempted standard exits.
- The rubric/human should answer: "Is there a user-advised keyboard method to leave this trap?" If not, barrier.

### Finding 5: page title and page structure need page-substance evidence, not only title text

`4c72b3b9` is a missed page-title failure in run10. WCAG 2.4.2 asks whether the title describes the page topic or
purpose, so a title-only or first-viewport-only packet can be underpowered.

Adversarial check: a generic title can be acceptable for a tiny demo page but unacceptable for a substantive page;
conversely, page body can be generated below the fold or after SPA state changes. A rule that flags every generic
title without page substance will over-fire, while a rule that trusts any non-empty title will miss failures.

Recommended change:

- Page-title rubric packet should include title, first meaningful heading, main landmark text, visible body summary,
  and full-page or tiled screenshot.
- If the page is trivial or a test harness shell, abstain.
- For SPAs, a later state change should carry state-scoped title evidence; no global clear from initial load only.

## Proposed implementation plan

### Phase 1: low-quota deterministic producers and routing fixes

1. Split `images-of-text` from the 1.1.1 AT-tree gate.
   - Test with `e1d4ed75` and a decorative empty-alt photo.
   - Expected: both get an obligation, but only image-of-text evidence can become a barrier after rubric/human review.

2. Add `decorative-marking-review` for visible removed-from-tree graphics.
   - Test with the three `e88epe` failed examples and the ACT passed examples.
   - Expected: failed examples reach review; passed decorative examples do not become deterministic barriers.

3. Add `iframe-equivalent-purpose` set obligations.
   - Test with `c1cc2a71`, same-src same-title pass, different-title inapplicable, and inaccessible cross-origin frames.
   - Expected: per-iframe name adequacy no longer answers the set-level claim.

4. Improve local resolver evidence for link purpose.
   - Preserve query strings.
   - Resolve local ACT relative URLs and `onclick`/`jsHref` cases where already extracted.
   - Return "unresolved with reason" as evidence, not a hidden no-op.

5. Add explicit no-LLM regression fixtures for discovery.
   - The gate is "obligation minted with provenance", not "barrier decided".
   - This can be tested while quota is unavailable.

### Phase 2: visual discovery lane when LLM quota returns

1. Implement page-level visual triage as an obligation producer only.
2. Start with narrow candidate classes:
   - text baked into image or canvas
   - graph/chart/diagram without visible equivalent text
   - color-only status/key
   - visually prominent heading/list/table structure absent from DOM facts
3. Cap fan-out and stratify candidates by SC/family.
4. Use per-region rubric/tool packets with OCR, crop, DOM/AX target, nearby text, and ancestor names.
5. Evaluate by three-run median/range, not a single run, because the prior research established ACT LLM-lane
   variance around this size.

### Phase 3: interactive discovery lane

1. Build the deferred dynamic-subject reveal runner for disclosure/tab/carousel/menu states.
2. Emit discovered subjects after activation with action provenance and content fingerprint.
3. Re-run relevant static/visual producers on the reached state.
4. Add fixed-set keyboard trap review packets with escape-advisory evidence.

### Phase 4: gold annotation collection

Use this lane for candidate generation, not final truth. For each discovered obligation:

- Humans label all PARTIAL/discovered obligations.
- Sample pass/fail fills stratified by mechanism and SC.
- Separate false-clear risk from false-barrier risk.
- Maintain held-out adversarial fixtures so discovery improvements do not merely learn ACT quirks.

## Future validation matrix

| Lane | Positive tests | Adversarial tests | Main risk |
|---|---|---|---|
| Images-of-text split | `0va7u6/e1d4ed75`, background text image | decorative photo, logo exception, SVG live text | FP flood from decorative images |
| Decorative-marking review | `e88epe` failed visible hidden logos | empty-alt fireworks, named-ancestor exception, adjacent equivalent text | turning review into barrier too early |
| Iframe set obligation | same-name different content frames | same-name identical src, equivalent content different URL, single iframe | per-element rubric leakage |
| Link set resolver | same-name different query destinations | query aliases to same content, aria-hidden duplicate link, table/context disambiguation | false difference from URL string only |
| Fixed-set trap review | trap without advised escape | trap with visible Ctrl-key instruction, hidden instruction, dynamically revealed instruction | deterministic over-promotion |
| Page title packet | title unrelated to body purpose | trivial page with generic title, SPA state title changes | body-title semantic overreach |
| Visual triage | canvas chart, text-in-image, color-only key | decorative hero image, brand logo, photo with caption, ornamental bullets | candidate flood and model salience bias |

## Things not to do

- Do not let screenshot triage emit final pass/fail.
- Do not make `removedFromA11yTree` a blanket 1.1.1 barrier.
- Do not use per-element accessible-name adequacy to settle same-name iframe equivalence.
- Do not promote fixed-set keyboard confinement without checking user-advised non-standard escape.
- Do not suppress page-title/page-structure obligations solely because visible structure is absent; absence can be
  the barrier.

## Conclusion

The recall gap is real, but the right design is more surgical than the original item-B wording. The current harness
already has strong consumption machinery for discovered obligations; it needs better producers. The immediate,
quota-safe work is to split suppressed visual obligations and add set-level deterministic producers. The LLM/VLM
work should come later as bounded discovery and per-region judgment, never as a direct conformance oracle.
