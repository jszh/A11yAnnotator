# Trusted Tester Gap Analysis — R2 (adversarial review of the builder's G1/G2/G3/G5 closures)

**Date:** 2026-06-19
**Supersedes/extends:** `TRUSTED-TESTER-GAP-ANALYSIS.md` (the original gap analysis + the builder's implementation-status section).
**What this is:** an *independent* adversarial re-review of commit `65113cc` ("Close Trusted-Tester v5.1.3 in-scope
gaps (G1/G2/G3/G5) + adversarial hardening"). The builder ran their own 4-agent review; this R2 looks for what that
self-review *missed* and re-validates the fixes it claims.

**Method (all findings are execution-grounded, not asserted):** a 5-lane adversarial workflow (22 agents). One
skeptic per lane (G1 lists, G2 background-image, G3 captcha, G5 form-error, cross-cutting) constructed **novel
counter-example fixtures and ran them through the REAL collectors/runners** (`collect-lists.js`,
`collectActPage`, `RUNNERS['form-error-probe']`, the oracle/coverage/adjudicator modules) via puppeteer on the same
Chrome the suite uses; an independent verifier then **re-ran each candidate finding and tried to refute it**
(is it a genuine defect, or behavior legitimately owned by the vision rubric / axe / a deliberate trade-off?).
I reconciled one cross-agent contradiction myself against the source (see §3, G5-F2).

---

## 0. Verdict

The builder's closures are **substantially sound and their claimed fixes hold**. Crucially, **no confirmed finding
is a published false-barrier or a false-PASS** — every residual is bounded by the harness's shadow/non-authoritative
architecture (a collector signal only *nominates* an obligation the vision rubric judges; nothing deterministic
turns `backgroundImageMeaningful`/`isCaptcha`/`lists[].kind` into an authoritative CLEAR, and `form-error-probe`
is not in the AUTHORITY registry so it cannot publish a barrier). The independent review **re-validated every
builder fix** (disabled/readonly G5, dangling-labelledby G2, turnstile-class G3, em-dash/container/roman/emoji G1)
by re-running them — all hold.

What the builder's self-review **missed** (the value of this pass): **6 confirmed residuals**, clustered in G2 and
G3, plus G5 soundness narrowings. The single most important is a **collector-parity divergence** in two gates the
commit explicitly labels "parity" copies.

- **G1 (lists): clean.** Zero confirmed defects. Every "miss" the skeptic raised (ARIA `role=list`, CSS `::before`
  bullets, colon-numbered markers, the 30/12/4000 caps) is either a non-barrier, owned by axe, or a *documented*
  vision-rubric delegation. One low-value recall enhancement remains (read `::before`/`list-style-image` so the
  rubric gets a textual hint instead of relying on the screenshot alone).
- **G2 (bg-image): one medium + two low.** A real parity divergence between the two collectors (G2-1); `::before`
  background icons invisible to the gate (G2-2); meaningful bg co-located with text never nominated (G2-3).
- **G3 (captcha): two medium.** Over-broad substring detection *strips* alt-text-adequacy from real non-captcha
  images (G3-1/CC-1); a same-origin in-frame captcha never reaches 7.D (G3-2).
- **G5 (form-error): two low + one corrected.** `type=button`+JS-validation under-trigger (G5-F1, downgraded from
  HIGH after the authority reconciliation); `data-val-required` on a server-validated-only form false-barriers in
  the *shadow* lane (G5-F2); residue (aria-invalid / appended nodes) left on the DOM (G5-F4).

**Net: 0 high, 3 medium, 6 low/info confirmed; 6 candidates refuted as expected-by-design.**

---

## Resolution status (2026-06-19 — all confirmed findings addressed)

All 3 medium + the actionable lows were FIXED; the recall/elegance lows were deferred with rationale. 511/511 v3
tests green (+4 R2 regressions in `trusted-tester-gaps.test.js`); the bg/captcha probe is 15/15.

| ID | Sev | Resolution |
|---|---|---|
| **G2-1** | med | **Fixed.** Extracted a shared `_bgInteractive(el)` helper in `act-page-collect.js` (native tags + interactive roles incl. option/spinbutton/textbox/searchbox + `tabindex>=0` + `onclick`), used by the top-level AND in-frame loops; aligned `eval-page.js` (`searchbox` added). An `onclick`/`role=spinbutton` bg control now fires on the ACT path. Test: G2/G3 collector test (p6/p7). |
| **G3-1 / CC-1** | med | **Fixed.** Token-based `_isCaptchaEl` (provider signatures OR captcha/turnstile as a LEADING class/id token segment — not a buried substring; `title` only on an `<iframe>`); and `alt-text-adequacy` is no longer stripped from a captcha **image**. Tests: tokenizer (d7/d8) + routing (capimg keeps both rubrics). |
| **G3-2** | med | **Fixed.** `isCaptcha` + `backgroundImageMeaningful` now computed in the same-origin in-frame branch via the shared helpers. Test: same-origin `srcdoc` g-recaptcha. |
| **G5-F2** | low/med-if-promoted | **Fixed.** `data-val-*`/`ng-required` honored only when an ACTIVE client validator is detectable (`jQuery.validator` / `angular` / `[data-valmsg-for]`/`.field-validation-*` spans); else abstain. Test: server-validated-only fixture stays unconstrained. |
| **G5-F1** | low | **Fixed.** The submit trigger falls back to clicking a `type=button`/`role=button` validator when no submit control exists. Test: type=button validator surfaces the error. |
| **G5-F4** | low | **Fixed.** `aria-invalid` is snapshotted and restored after the probe (page-isolation insurance). |
| **CC-3 / 7.A.1.c** | low | **Resolved** by the G3-1 fix — a captcha `<img>` keeps `alt-text-adequacy` (alt-purpose) alongside `captcha-alternative` (modalities). |
| **CC-8** | low | **Partially addressed.** Added production-path tests for the previously-divergent shapes (onclick/spinbutton bg, buried-captcha, in-frame captcha); within `act-page-collect.js` the two loops now share one helper, eliminating the drift locus. Full cross-collector fact-equality harness still TODO. |
| **G2-2** (`::before` icons), **G2-3** (bg+text single element), **G1** `::before` recall | low | **Deferred** with design notes in `DEFERRED-TODO.md` §F (recall/elegance; none a barrier or false-PASS). |
| **G1-F7** | info | The `kind:'real'` descriptive row on a hidden `<ul>` is benign (drives no verdict); noted, no change. |

---

## 1. Confirmed findings (survived independent refutation)

| ID | Lane | Type | Severity | One-line |
|---|---|---|---|---|
| **G2-1** | G2 | parity FN | **medium** | The two "parity" bg gates use different interactivity predicates → a full-bleed/`onclick`/`role=option,spinbutton` bg control is nominated by `eval-page.js` but **dropped by the production ACT path** (`act-page-collect.js`), so 7.C coverage depends on which collector ran. |
| **G3-1 / CC-1** | G3 | FP→FN cascade | **medium** | `/captcha\|turnstile/` is a **bare substring** match on class/id (+ loose `title`); it fires on `no-captcha-needed-badge`, `captcha-help`, `title="What is a CAPTCHA?"` — and `RUBRIC_GATE` then **strips `alt-text-adequacy-v0`** from those images, dropping their 7.A/7.B/7.C alt judgment (becomes an un-judged auto-PARTIAL — recall loss, *not* a false PASS). |
| **G3-2** | G3 | FN | **medium** | The **same-origin in-frame** collection branch (`act-page-collect.js:347–355`) omits the `isCaptcha` computation entirely, so a captcha whose only signal lives inside a same-origin frame never enumerates the 7.D obligation. (Cross-origin reCAPTCHA — the dominant case — is caught at the iframe-element level via the `src` channel.) |
| **G2-2** | G2 | FN | **low** | `::before`/`::after` `background-image` is invisible to the gate (`getComputedStyle(el).backgroundImage`, no pseudo arg). Interactive case is rescued by 4.1.2 (`button-name`); a **non-interactive `::before` status icon** is a total blind spot. The detection primitive already exists (`exp-runners.js` `pseudoPaints()`). |
| **G2-3** | G2 | FN (by-design, over-broad) | **low** | A meaningful bg-image **co-located with text on one element** is never nominated (`text.length===0` gate). The common idiom (separate badge/icon span) IS caught; the single-element case (`<div class=bg>Premium</div>` with a meaning-only bg) is owned by nobody. Deliberate decorative-flood guard, but text-*presence* ≠ text-*equivalent*. |
| **G5-F1** | G5 | under-trigger FN | **low** *(was HIGH)* | `<button type="button">`+JS-click validation is never triggered — the trigger selector `button[type=submit],input[type=submit],button:not([type])` excludes `type=button`, and the `requestSubmit()` fallback fires no listener → false `errorNotIdentified:true`. The **same selector is shared by `vision-capture.js`**, so the screenshot lane is blind too. *Downgraded:* `form-error-probe` is shadow (§3), so this is a shadow-PARTIAL + offline-metric effect, not a published barrier. |
| **G5-F2** | G5 | FP false-barrier | **low now / medium-if-promoted** *(corrected)* | `data-val-required`/`data-val-email` are widened on attribute **presence**; a server-validated-only ASP.NET form (unobtrusive script absent/async-failed) is treated as client-constrained → false `errorNotIdentified:true`. The builder explicitly refused to widen bare `type=password` for *exactly this reason* — the same epistemic gap applies here. Harm is bounded to the shadow lane + `falseBarrierRate` pollution (matters for a future promotion). |
| **G5-F4** | G5 | soundness (latent) | **low** | The probe restores only `el.value`; it leaves `aria-invalid=true` and any appended error nodes on the live DOM. Contaminates a measurement **only if two fields are probed on one un-reloaded page** — which the production paths never do (`run-experiments.js` fresh-page-per-attempt; `vision-capture.js` reload-per-form). The only current exposure is the test harness itself. |
| **CC-3** | G3 | division-of-labor gap | **low** | A bare `<img>` captcha now gets **only** the 7.D modality rubric; TT 7.A.1.c ("the alt must describe the CAPTCHA's *purpose*") is asked by **neither** rubric — silently contradicting the original doc's G3 claim that "alt-text-adequacy handles CAPTCHA purpose description." Niche (modern captchas are widget-based). |
| **CC-8** | cross | test-gap | **low** | No test asserts the two collectors agree on bg/captcha (the duplicated, registry-uncovered "parity" logic — exactly where G2-1 drifted); no test covers the bg-with-text / named-control exemptions. |
| **G1-F7** | G1 | by-design (info) | **info** | The `kind:'real'` loop never calls `vis()`, so a clipped sr-only / `display:none` `<ul>` still emits a `real` entry. Refuted as a defect (drives no verdict; benign descriptive row; the builder's "reject sr-only" fix was scoped to the *faux* nominator). Recorded only to correct the commit message's blanket phrasing. |

---

## 2. Builder fixes that were re-validated (all hold)

Re-run against fresh fixtures + the real modules:

- **G1:** container-of-lists leaf-item guard ✓; em/en-dash prose exclusion ✓; roman/lettered/emoji/fullwidth recall ✓;
  clipped sr-only rejection ✓ *on the faux path it guards* (see G1-F7 for the real-path nuance).
- **G2:** dangling `aria-labelledby` no longer masks (the control still fires) ✓; size-cap removed → medium
  non-interactive bg fires, full-bleed backdrop suppressed ✓; gradient-only does not fire ✓.
- **G3:** `turnstile-widget`/`cf-turnstile` class channel + `g-recaptcha` + `data-sitekey` all fire ✓; a cross-origin
  reCAPTCHA iframe fires via `src`/`title` ✓.
- **G5:** disabled/readonly required fields are not-applicable (no false barrier) ✓; `aria-disabled="true"` too ✓;
  `eqTrue` case/whitespace tolerance ✓; the positive soft-marker set all constrain, the negative set
  (`data-required="false"`, expression `ng-required`, bare password, `aria-required="false"`) all stay unconstrained ✓.
- **Soundness rail:** traced end-to-end — no code path turns `backgroundImageMeaningful`/`isCaptcha`/`lists[].kind`
  into an authoritative or PROVISIONAL CLEAR; the bg/captcha obligations resolve to auto-PARTIAL (honest undecided) ✓.
- **Rule-16 oracle↔coverage** agree under adversarial multi-gate shapes (img+bg, field+bg, img+captcha, captcha+bg) ✓.
- **Full suite:** 507/507 v3 tests pass with Chrome present (DOM-extractor assertions actually execute, 0 skips);
  the TT-gap file is 13/13 ✓.

---

## 3. Detail on the load-bearing findings

### G2-1 — collector parity divergence (medium) — *the top new finding*
The two `backgroundImageMeaningful` gates were authored together in `65113cc` as explicit parity copies
(`act-page-collect.js` literally comments "parity with eval-page.js"). Their bodies are operand-for-operand
identical **except the interactivity operand**:
- **Path A (production ACT/FN-LLM, `act-page-collect.js:~248`):** `isInteractive = focusableByMarkup(el) ||
  /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(sampledRole)` — omits `onclick`,
  `role=option`, `role=spinbutton`, `role=textbox`, `role=combobox`, `role=searchbox`.
- **Path B (`eval-page.js:~540`):** `_interactiveLocal = interactiveTags || interactiveRoles (incl. option,
  spinbutton) || tabindex>=0 || hasAttribute('onclick')`.

Observed (ran `/tmp/g2-parity-run.js`): a full-bleed `<div onclick>` bg control is **dropped from Path A's
inventory entirely** (no obligation reaches the LLM) but `backgroundImageMeaningful=true` on Path B; `role=option`
and `role=spinbutton` full-bleed bg controls are `false` on A, `true` on B — all printed `DIVERGE`. Refutation
failed: the value is computed once at collect and only read afterward (`llm-adjudicator.js:313` attaches the 7.C
subject *only* when the flag is true), and role-bearing ones get only a *different-SC* (4.1.2) backstop, while the
bare `onclick` div is dropped with no recovery. **Fix:** extract one shared interactivity predicate used by both
gates (at minimum add `onclick` to Path A and align the role sets).

### G3-1 / CC-1 — over-broad captcha detection strips the alt obligation (medium)
`isCaptcha = /captcha|turnstile/.test(class+id) || data-sitekey || /…/.test(src) || /captcha/.test(title)`.
The class/id test is a **bare substring**, so `class="no-captcha-needed-badge"` matches (substring "captcha"), and
the `title` channel matches prose like `"What is a CAPTCHA?"`. `RUBRIC_GATE` then does two things to such an
element: routes in `captcha-alternative-v0` **and gates off `alt-text-adequacy-v0`** (`el.isCaptcha !== true`).
Since `alt-text-adequacy-v0` is the **sole** component performing TT 7.A/7.B/7.C, a meaningful image that merely
*mentions* captcha loses its alt judgment. End-to-end repro (real Chrome + oracle + `selectRubricSubjects` + loaded
rubrics): a `<img class="no-captcha-needed-badge" alt="Verified human">` routes to `captcha-alternative-v0` only;
an identical image without the substring keeps `alt-text-adequacy-v0`. Bounded to **recall loss** (the obligation
stays in the ledger as auto-PARTIAL — never a false clear) and to low-frequency element shapes. **Fix:** token /
word-boundary match (`g-recaptcha`/`h-captcha`/`cf-turnstile`/`captcha` as a *token*, + provider iframe `src` /
`data-sitekey`), drop or tighten the `title` channel, and **keep `alt-text-adequacy` for a plain `<img>` captcha**
(let both rubrics run — `captcha-alternative` already abstains to PARTIAL).

### G3-2 — in-frame captcha never reaches 7.D (medium)
The top-level branch computes `isCaptcha`; the same-origin **in-frame** push branch (`act-page-collect.js:347–355`)
sets `text/focusable/isImage/...` but **omits `isCaptcha` and the key**. The oracle gates 7.D strictly on
`isCaptcha===true`, so an in-frame `g-recaptcha` routes to `non-text-content`→`alt-text-adequacy` (the *wrong*
question) instead of `captcha-alternative`. The dominant real-world shape (cross-origin reCAPTCHA host div in the
top document) is unaffected. **Fix:** mirror the `isCaptcha` (and `backgroundImageMeaningful`) computation into the
in-frame branch.

### G5-F2 — server-validated false barrier + the authority reconciliation (corrected)
**The two verifier agents contradicted each other on whether `form-error-probe` publishes an authoritative
barrier. I resolved it against the source:** `authority.js:62` — `authorityFor(experimentId, direction)` returns
`{state:'shadow', mayPublish:false}` for any mechanism with **no registry entry**, and the `AUTHORITY` registry
(`authority.js:40`) is frozen with **only** `focus-visual-retry/{NO_,}BARRIER_OBSERVED`. There is **no
`form-error-probe/*` entry.** Therefore a false `errorNotIdentified:true` from `form-error-probe` **cannot publish
as an authoritative 3.3.1 barrier** — it falls to `shadowObs` → a shadow PARTIAL (indistinguishable from an
un-judged auto-PARTIAL), and the §5b PROVISIONAL-fill loop (`build-v3.js:~405`) excludes deterministic shadow obs.
So G5-F1's verifier was right and G5-F2's "AUTHORITATIVE published claim" framing was wrong (it traced claim-shape
resolution, not the publication gate). **Net effect:** the G5 false-barriers (F1 `type=button`, F2 server-validated)
pollute the **offline `falseBarrierRate`** that gates a *future* promotion and *would* become published barriers
*if* the probe were ever promoted — but they are not published today. That is why both are **low now**, with F2
**medium-if-promoted**. The fixes remain worthwhile: (F2) gate the `data-val-*` widening on a *detectable active
validator* (`window.jQuery?.validator`, a wired submit handler, or a `[data-valmsg-for]`/`.field-validation-valid`
span) and otherwise abstain — the same bias the comment already applies to bare password; (F1) also click
`role=button`/non-submit validators (or abstain when only `type=button` exists), mirrored in `vision-capture.js`.

---

## 4. Candidates checked and REFUTED (recorded for honesty)

These were constructed, run, and **dismissed as expected-by-design** — the review is not just a defect list:

- **ARIA `role=list` ignored (G1-F1/CC-5):** a well-formed `role=list`+`role=listitem` is *not* a barrier; a
  *malformed* one is caught by axe `aria-required-children` (surfaced for 1.3.1). Invalid as a defect (flagged the
  axe-OFF dependency as a note).
- **CSS `::before`/`list-style-image` bullet lists missed (CC-4/G1-F3):** the `info-relationships-v0` rubric
  *explicitly anticipates this* (lines 35–36: "judge from the screenshot directly") and the page-level 1.3.1
  obligation runs regardless. Verified the rendered viewport PNG shows the bullets. → low **recall enhancement**
  (read `::before`/`::marker` to give the rubric a textual hint), not a defect.
- **Zero-height/async Turnstile mount dropped (CC-2):** a never-rendered empty mount paints zero pixels (invisible
  to user *and* vision); the moment it mounts it is caught via two channels (host div gains height; injected iframe
  `src`). Invalid.
- **`backgroundImageUrl` truncated at the first `)` (G2-4):** real, but the field has exactly one consumer (a
  context string in the prompt); crops are keyed by **xpath**, not URL, and Chrome loads the parenthesized URL
  correctly. Cosmetic, no behavioral effect. Invalid.
- **Colon-numbered markers `1:` (CC-6):** nit; overloaded with times/ratios; the candidate is non-authoritative and
  the screenshot lane recovers it. Invalid.
- **List caps (30 real / 12 faux / 4000-scan) (G1-F4):** low; rare to exceed on a real page; later lists are
  descriptive-signal omissions the screenshot can still cover.

---

## 5. Corrected per-gap status (updates the builder's implementation-status table)

| Gap | Builder status | R2 status |
|---|---|---|
| **G1 lists** (1.3.1/10.D) | ✅ DONE | ✅ **DONE — clean.** No confirmed defect. Optional: `::before`/`list-style-image` recall hint; clarify the commit's "reject sr-only" note (faux-only). |
| **G2 bg-image** (1.1.1/7.C) | ✅ DONE | ✅ DONE **with 1 medium + 2 low residuals:** unify the two collectors' interactivity predicate (**G2-1**), optionally cover `::before` icons (G2-2) and the bg-with-text single-element case (G2-3). |
| **G3 captcha** (1.1.1/7.D) | ✅ DONE | 🟡 **DONE but 2 medium residuals:** tighten the substring detector + stop stripping alt-adequacy from non-widget images (**G3-1/CC-1**); compute `isCaptcha` in the in-frame branch (**G3-2**); decide ownership of TT 7.A.1.c captcha-purpose-in-alt (**CC-3**). |
| **G5 error-trigger** (3.3.1/5.F) | ✅ DONE (sound subset) | ✅ DONE **with soundness narrowings:** gate `data-val-*` on a detectable active validator (**G5-F2**); click non-submit validators / abstain (**G5-F1**); restore `aria-invalid` or assert page-isolation (**G5-F4**). All shadow-bounded today. |
| G4/G6/G7/G8 | deferred/structural | unchanged (DEFERRED-TODO §F) |

---

## 6. Prioritized recommendations

1. **G2-1 (medium) — unify the interactivity predicate** across `act-page-collect.js` and `eval-page.js` into one
   shared helper. This is the clearest defect (two "parity" copies that aren't), and it also closes **CC-8** if you
   add a single-fixture parity test asserting the two collectors emit identical bg/captcha facts.
2. **G3-1/CC-1 (medium) — tighten captcha detection to widget-root/token matching** and stop gating
   `alt-text-adequacy` off for plain `<img>`/bg images (run both rubrics; `captcha-alternative` self-abstains). Add
   a rubric-gate test: a non-captcha image with "captcha" in its class must keep `alt-text-adequacy`.
3. **G3-2 (medium) — compute `isCaptcha`/`backgroundImageMeaningful` in the in-frame collection branch.**
4. **G5-F2 (low/medium-if-promoted) — gate the `data-val-*` widening on a detectable active client validator**,
   else abstain (mirrors the existing bare-password bias). Highest-value G5 soundness narrowing before any future
   promotion of `form-error-probe`.
5. **Low/cleanup:** G2-2 `::before` (reuse `pseudoPaints()`); G5-F1 `type=button` trigger (+ `vision-capture.js`
   parity); G5-F4 restore `aria-invalid`; CC-3 decide TT 7.A.1.c ownership; G1 `::before` list recall hint; correct
   the commit's "reject sr-only" phrasing (faux-only).

---

## Validation log (R2)

| Claim | How verified | Result |
|---|---|---|
| Builder's claimed fixes (G1×4, G2×3, G3×3, G5×6) | re-ran each through the real collectors/runners on Chrome | all hold (G1-F7 = real-path nuance, benign) |
| `form-error-probe` publishes authoritatively? | Read `authority.js:40,62` + traced `build-v3.js` publication path | **No** — no registry entry → default-shadow → shadow PARTIAL; corrects G5-F2's verifier |
| G2 parity divergence | ran `collectActPage` vs replicated `eval-page` gate on one fixture; `onclick`/`option`/`spinbutton`/full-bleed all `DIVERGE` | confirmed (G2-1) |
| captcha substring strips alt-adequacy | `collectActPage` + `oracle.familiesFor` + `selectRubricSubjects` + loaded rubrics, end-to-end | confirmed (G3-1/CC-1) |
| in-frame captcha omits `isCaptcha` | collected a same-origin in-frame `g-recaptcha`; `hasIsCaptchaField:false`, routed to `non-text-content` | confirmed (G3-2) |
| soundness rail (no deterministic CLEAR) | traced `backgroundImageMeaningful`/`isCaptcha`/`lists[].kind` consumers across `lib/` | holds — obligations resolve to auto-PARTIAL only |
| full suite | `node --test` (Chrome present) | 507/507 pass, 0 skip; TT-gap file 13/13 |
