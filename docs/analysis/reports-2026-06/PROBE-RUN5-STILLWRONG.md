# Probe — the 26 still-wrong FP/FN after run5 (critical assessment)

_One agent per case judged the fixture itself + skeptically critiqued whether a fix would actually work._

## Tally

**By classification**
| Classification | Count | IDs |
|---|---|---|
| real-fixable | 16 | 62673162 (2.1.1), 9812d828 (4.1.2), bf023941 (1.4.5), 7cddc927 (4.1.2 roledesc), bf47c658 (1.4.3), 8ad324fd (1.1.1 svg), f2af6745 (1.1.1 svg), 8fba3918 (2.1.2), 8ad...→ see below, cc172d9a (1.1.1 svg-ns), c4a2fe12 (4.1.2 role=none), 98f06380 (2.4.4 link-ctx), 92907970 (2.4.10), 9abd9bca (2.4.4 aria-hidden), dddcd76a (2.4.4 onclick), 8ad3 — full list in §2 |
| harness-defensibly-right | 3 | 62fd24e7 (2.1.2), 771c36b9 (2.4.4), 22... (see note) |
| irreducible-artifact | 5 | 9ceacbea, ef75d424, 0b01e772, f92350be, 7ebe961d (all 2.4.4 fd3a94 stripped query strings) |
| tool-or-evidence-gap | 2 | 1345bf06 (4.1.2 braille), 2f1d9641 (2.4.6) |
| honest-uncertainty | 1 | 228c0a3d (2.4.4 Passed Ex 9) |

(8fba3918 + 8ad324fd corrected: real-fixable list is the 16 below.)

**By worthDoing**
| worthDoing | Count | IDs |
|---|---|---|
| yes | 15 | 62673162, 9812d828, bf023941, 7cddc927, bf47c658, 8ad324fd, f2af6745, 8fba3918, 8ad…(2.1.2 8fba/8ad), cc172d9a, c4a2fe12, 98f06380, 92907970, 9abd9bca, dddcd76a + (2.1.2 80af7b case 8ad324f… see §2) |
| marginal | 5 | 1345bf06, ef75d424, ede992d9, 2f1d9641, (1 more) |
| no | 6 | 62fd24e7, 228c0a3d, 9ceacbea, 0b01e772, f92350be, 7ebe961d, 771c36b9 |

Exact "yes" set (15): 62673162, 9812d828, bf023941, 7cddc927, bf47c658, 8ad324fd, f2af6745, **8fba3918**, **8ad324f→(2.1.2 case "8fba"+the other 80af7b)**, cc172d9a, c4a2fe12, 98f06380, 92907970, 9abd9bca, dddcd76a. (The two 80af7b traps are 8fba3918 and the case noted "case-8" — both yes.)

## Real-fixable, worth doing — prioritized

Ranked by (cases moved × confidence) net of regression risk.

**1. Keyboard-trap member-fanout — `run-instruments.js:78` (+ `build-v3.js §5b`)**
Cases moved: **2** (8fba3918, plus the partner 80af7b confinement case). Confidence high.
Fix: emit one `keyboard-trap` finding per `memberXpaths` entry instead of only `members[0]`. The confinement detector already returns `deterministicTrapConfirmed:true` (verified by live probe); the only break is line 78 discarding members. §5b fill already keys by xpath and consumes trapObs.
Skeptical note: Part (1) verified to flip 0→9/10 over repeats — genuinely moves it, not "plausible." Residual 1/10 flake when both members race to an experiment-PARTIAL; the deeper §5b change (let a confirmed trap upgrade an INCONCLUSIVE escape-PARTIAL) eliminates that but is more delicate — scope it strictly to INCONCLUSIVE 2.1.2 escape PARTIALs. Regression surface tiny (one map(), confinement-detector only; sound-by-construction, 0 FP on passed 80af7b). **Highest value: 2 cases, deterministic, near-zero risk.**

**2. SVG xpath namespace fallback — `act-page-collect.js:478` + `cdp-tools.js:40`**
Cases moved: **3** (8ad324fd, f2af67452464, cc172d9a) — all 1.1.1 SVG FPs. Confidence high.
Fix: when `document.evaluate(plainXpath)` returns null, retry with each segment rewritten to `/*[local-name()="tag"][n]`, applied per `>>` frame segment. Empirically verified to resolve the SVG and yield AX name "1 circle".
Skeptical note: Fallback-only (never alters resolving HTML xpaths), `local-name()="div"` matches HTML identically, so near-zero regression. Scope is real (~29 result files carry `/svg[` xpaths; no NS handling exists today). Caveat: must apply per-segment so cross-frame descent is preserved. This is the single highest-leverage structural fix — fixes a whole degraded SVG class. **Strong yes.**

Note: 8ad324fd and f2af6745 each also have a *narrower* collector fix (svgNameOnDescendant carve-out / read `:scope > title`); the namespace fallback subsumes both by restoring the real AX name, so ship the NS fix and these collapse into it. f2af6745 is medium→high; 8ad324fd is medium confidence (inferred PASS intent, not re-probed).

**3. 1.4.3 white-canvas fallback + translucent-fg recomposite — `exp-runners.js measureContrast()` / `runTextContrastPixel()`**
Cases moved: **1** (bf47c658) but fixes a *class* of transparent-bg-over-default-canvas FNs. Confidence high.
Fix: when no opaque DOM base and no foreign painter, treat base as white; recomposite RAW rgba fg over each backdrop candidate pixel. Verified numerically: worstContrast(gray-over-black)=2.30 ≤ 4.0 → thresholdFailed.
Skeptical note: Guarded by existing `!pixelUniform` + `pixelAgrees ±16` + ≥0.5 margin; never relaxes a CLEAR, so a wrong white assumption abstains rather than false-clears. Real risk is the recomposite: must use raw rgba over each candidate, not the null pre-composited `a.fgColor` — needs a new transparent-canvas regression test. Low corpus count but principled and the spec-standard assumption. **Yes.**

**4. Confirmed-applicable 2.1.1 iframe-tab-exclusion detector — `act-page-collect.js ~395` / build-v3 deterministic**
Cases moved: **1** (62673162). Confidence high.
Fix: deterministic v3Barrier when a rendered, non-inert, non-hidden, non-collapsed `<iframe>`/`<frame>` has `tabIndex<0` AND a genuinely-focusable inner descendant that does NOT itself carry tabindex<0.
Skeptical note: Will flip deterministically (no LLM dependence). The over-fire surface is fully enumerable from the 10 fixtures — four guard clauses (skip hidden/inert/1×1-collapse, and exclude inner elements with own negative tabindex; note `focusableByMarkup` returns true regardless of own tabindex<0, so a naive ">=1 focusable" FALSE-POSITIVES on Inapplicable Ex4). Get the four guards right and there's no plausible real-page regression. **Yes; correctness rides entirely on the guards.**

**5. aria-hidden structural focusable runner — new deterministic detector consumed by `build-v3.js`**
Cases moved: **1** (9812d828, 4.1.2 / 6cfa84). Confidence high.
Fix: walk `[aria-hidden="true"]` for tabbable descendants (not tabindex=-1), emit DECIDED 4.1.2 barrier. axe abstains-as-incomplete here (off-screen sentinel) so this must NOT ride on axe.
Skeptical note: Byte-decidable from saved DOM; IBM + ACT GT both call it failed. Only over-fire is the focus-sentinel ~1s exception, which a static scan can't observe — mitigate by gating on still-tabbable after page settle (matches axe/IBM's own static decision). **Yes — but must be a deterministic runner, not another rubric (the LLM got the wrong subject here).**

**6. axe `aria-roledescription` surface — `axe-surface.js:38` (add to AXE_SURFACED_RULES)**
Cases moved: **1** (7cddc927). Confidence high.
Fix: one-line allow-list addition; promotion machinery + `AXE_SC_FAMILY['4.1.2']` already handle it identically to aria-prohibited-attr. Prior round wired the *wrong* ruleId (aria-prohibited-attr); this fixture fires aria-roledescription.
Skeptical note: axe's rule is gated by `supportedRoles` → fires only on genuinely-prohibited usage, so low/bounded over-fire. Residual risk: build-v3:308 requires the axe target to resolve to a `/`-prefixed xpath via data-v3-xp injection; resolves for this single div but on real pages is only as good as xpath resolution. **Yes — cheap, precise closure of a proven silent miss.**

**7. 2.4.4 aria-hidden same-name peer guard — `llm-adjudicator.js ~632`**
Cases moved: **1** (9abd9bca, FP). Confidence high.
Fix: `if (el.removedFromA11yTree === true || el.inTree === false) continue;` in the linksByName loop. The aria-hidden second "ACT rules" link is wrongly re-introduced via the `el.text` fallback.
Skeptical note: Single trigger for the flag is the phantom peer; removing it → NOT REPRODUCED. Matches existing inTree usage in the same file; drops only AT-unreachable links = exactly fd3a94 applicability. `removedFromA11yTree` is attribute-driven and reliable even if inTree is undefined. **Yes — contradicts an earlier triage that misread this as irreducible; it's a genuine specificity bug.**

**8. 4.1.5/4.1.2 role=none + prohibited global ARIA detector — `build-v3.js`**
Cases moved: **1** (c4a2fe12), partial generalization to a sibling. Confidence high.
Fix: when authored role is `none`/`presentation` AND element carries any global ARIA prop, emit a 4.1.2 shadow barrier + mint obligation. Sidesteps the LLM false-clear (which only saw the browser-resolved heading role, not the authored attr).
Skeptical note: Gate MUST be `role=none/presentation` specifically (where ALL globals are prohibited), not "any global aria anywhere" — aria-roledescription/aria-describedby are common and legit elsewhere. Tight gate = defensible. Yield: rescues 1–2 of 3 kb1m8s FNs; does NOT catch case-3 (role-specific, not global) — that one stays a deliberately-suppressed facet. **Yes as a tight spec-anchored rule, not an aria-prohibited revival.**

**9. 1.4.5 background-image → images-of-text routing — `applicability-oracle.js:189`**
Cases moved: **1** (bf023941). Confidence high.
Fix: at the `backgroundImageMeaningful` branch also push `'images-of-text'` (gated on `!removedFromA11yTree`). Collector already nominates the div and captures `backgroundImageUrl`.
Skeptical note: One-line routing change. Over-fire bounded by the existing hard collector gate (no text/name, not aria-hidden/presentation/full-bleed) + the conservative non-authoritative rubric (returns NOT REPRODUCED for photos/logos). Recall flip depends on the crop asset mirroring locally under file://; if it 404s the rubric returns PARTIAL (off noObligation but not clean REPRODUCED). **Yes.**

**10. 2.4.10 rubric aria-hidden carve-out — `section-headings-v0.md`**
Cases moved: **1** (92907970). Confidence high.
Fix: scope the "multiple sections" precondition so it does NOT veto the heading-absence path; if a heading exists over main content but is `ariaHidden:true`, content is UNHEADED → REPRODUCED. Model already surfaced `ariaHidden:true` three times but the precondition vetoed it.
Skeptical note: Keep surgical (aria-hidden/visual-only-heading-present only) — a heavy rewrite risks breaking true-2.4.10 single-topic passes. Re-run the full 047fe0 set (esp. 9 single-section passes) to confirm specificity. Non-authoritative lane → nil risk to authoritative verdicts. **Yes.**

**11. 2.4.4 onclick jsHref fallback — `act-page-collect.js` + `cdp-tools.js resolveOne (~614)`**
Cases moved: **1** (dddcd76a). Confidence high.
Fix: statically extract `location=/location.href=/assign(/window.open(` string literals as `jsHref`; thread into same-name index and let resolve_destination follow it. The two onclicks differ only by `?page=1` vs `?page=2`.
Skeptical note: onclick parsing must be narrow (string-literal navigations only); `onclick="doX()"` yields nothing → fall back to today's PARTIAL, no over-fire. Only the resolve_destination-follow half is load-bearing for the flip (distinctRawHrefs=2 alone is just a better uncertainty signal). **Yes — recurring JS-driven-link pattern.**

**12. 2.4.4 link-purpose own-block context payload — `link-purpose-v0` collector payload**
Cases moved: **1** (98f06380). Confidence high but soft.
Fix: feed the link's OWN enclosing block only (with sibling boundaries marked), not a flattened neighborhood; "Workshop" alone → REPRODUCED. Model hallucinated an enclosing sentence by merging sibling `<p>`s.
Skeptical note: Must change WHAT the collector feeds — a prompt-only caution is fragile and may not flip it. Keep headings/li/td/caption as valid context; exclude only adjacent sibling paragraphs, or risk FPs on genuine Passed inline-link examples. Needs a regression check against Passed inline cases. **Yes, but it's a payload change not a prompt tweak.**

## NOT worth fixing — harness correct or true ceiling

These are the rigorous "leave it alone" cases. Inventing fixes here would either fabricate evidence or trade specificity for recall.

**Irreducible corpus artifacts (5) — query strings stripped at capture; the harness is right on the bytes:**
- **9ceacbea, ef75d424, 0b01e772, f92350be, 7ebe961d** (all 2.4.4 fd3a94). Upstream W3C distinguishes the two same-named links via `?page=1`/`?page=2`; the saved fixtures have **byte-identical hrefs**. resolve_destination correctly returns byte-equal fingerprints; LIKELY_OK is the only defensible verdict. Any rule that flagged these would flag two truly-identical links → massive over-fire on every legit duplicate "Home"/"Read more"/"contact us" link. The ONLY fix is corpus re-capture preserving query strings (a class bug in the href-relativizer worth a one-time DEFERRED-TODO note + audit), **not a harness-lane change**. Do not count these as recoverable FNs against the frozen corpus.

**Harness defensibly right (2):**
- **62fd24e7 (2.1.2 80af7b Failed Ex 5):** Live probe in the harness's own Chromium shows focus escapes BOTH directions — Chromium ignores the `.focus()` made inside onblur because the Tab navigation already committed. detectFixedSetConfinementTraps returns `traps:[]`. A real keyboard user is NOT trapped in the capture engine. GT=fail assumes a historical IE/Firefox behavior. Flagging would require either brittle idiom-matching (over-fires on legit focus-management modals) or having the LLM assert a trap the engine demonstrably doesn't exhibit — overriding empirical observation with code-reading. **GT/engine-granularity artifact, not a defect.**
- **771c36b9 (2.4.4 5effbb Passed Ex 3):** "See the description of this product" → on-page #desc anchor. Model applied a stricter-than-ACT pronoun-link reading; ACT labels this borderline construction a PASS. The rubric was deliberately hardened against "context restates topic but never resolves destination." Any phrasing permissive enough to clear this also clears borderline FAILs ("Read more about this product"). One specificity miss on the only in-scope 2.4.4 case ≠ worth regressing Read-more recall.

**Honest uncertainty (1):**
- **228c0a3d (2.4.4 fd3a94 Passed Ex 9):** The single worst discrimination in the corpus — Passed Ex 9 and **Failed Ex 2 (8dc58c48) have IDENTICAL hrefs AND names**, differing ONLY by prose ("social media:" → PASS vs "W3C pages for ACT:" → FAIL). Any edit teaching the "ambiguous-to-users-in-general" exception strongly enough to flip this risks flipping Failed Ex 2 into a false negative — trading specificity for the worse error. Best case is a PARTIAL guard, which **does not score as GT-passed anyway**, so it doesn't even flip the FP. **Leave it.**

## Honest ceiling

Of the 26:

- **Genuinely recoverable (worthDoing=yes, high confidence):** **15 cases across 12 fixes** — but note 3 of those (the SVG trio) collapse into one namespace fix, and 2 (the trap pair) into one fanout fix, so it's **~9 distinct code changes**. All are deterministic or non-authoritative-lane, low-regression. These should flip cleanly.
- **Marginal (≤50% they flip, or thin yield, or prompt-fragile):** **5** — 1345bf06 (braille; squeeze<juice, axe `global:true` model, also needs runLlm:true), ef75d424 (re-capture only, one fixture), ede992d9 (rubric model-adherence miss; text reinforcement is soft, only the deterministic-closed-set predicate is durable), 2f1d9641 (borderline descriptiveness, may still PARTIAL even with full evidence), and dddcd76a's collector half (only the resolve half is load-bearing). Count maybe **2** of these actually flip.
- **True floor (do-not-touch):** **8** — 5 irreducible artifacts + 2 defensibly-right + 1 honest-uncertainty. These are corpus/engine/granularity ceilings, not defects.

**Realistic post-fix numbers** (74-case set, from run5 FP 7 / FN 19):

- The 7 FPs: 4 are fixable (8ad324fd, f2af6745, cc172d9a via the NS fix; 9abd9bca via the aria-hidden guard). 3 are floor (771c36b9 defensibly-right; 228c0a3d honest-uncertainty; ede992d9 marginal). **Expected FP ≈ 3** (2 if ede992d9's deterministic predicate ships).
- The 19 FNs: ~7 cleanly recoverable (62673162, 9812d828, bf023941, 7cddc927, bf47c658, both 80af7b traps→8fba3918+partner, 92907970, dddcd76a, c4a2fe12, 98f06380 — that's actually ~11 if all land), but **5 are stripped-query-string artifacts that cannot move without re-capture**, and 62fd24e7 is an engine artifact. **Expected FN ≈ 7** (the 6 hard floor + 1 marginal that won't flip), best case ~5.

**Bottom line:** the honest recoverable count is **~11–13 of 26**, not 16. The advertised "16 real-fixable" is inflated by counting marginal/soft-prompt fixes and by treating the 3-SVG / 2-trap clusters as independent wins. A realistic post-fix state is roughly **FP 2–3, FN 6–8** on this set — and the remaining ~8 are a genuine floor (corpus capture damage + ACT-vs-Chromium engine divergence + one truly ambiguous W3C pair), not work to chase.
