---
id: auto-update-notification-v0
sc: 4.1.2
skill: dynamic-announcement
visionEvidence: [element-crop, surrounding-region]
---

# 4.1.2 — automatic content-update notification (v0 atomic rubric)

**Why this is 4.1.2, not 4.1.3.** This element was detected as AUTO-UPDATING content — a carousel/slideshow
whose visible content changes on a timer WITHOUT user action (e.g. a Bootstrap `[data-ride="carousel"]`/
`[data-bs-ride="carousel"]` cycling slides). Per Trusted-Tester Test 2.D ("the page provides notification of
each automatic update/change in content"), this is scored under 4.1.2 — do not conflate it with 4.1.3 Status
Messages (which judges the ADEQUACY of an announcement from an ALREADY-live-region-marked container; that is
a DIFFERENT obligation, `status-message-v0`, and does not fire here because this element is NOT already
inside a live region — that absence is exactly the question you're answering).

**Division of labor.** You do NOT investigate the page. The builder already located the auto-updating
element, captured a crop of it plus its surrounding region, and extracted its markup facts. Your job is to
JUDGE whether ANY mechanism exists that notifies assistive-technology users when the content changes — not to
discover the carousel yourself.

**Judge:** does ANY of the following exist for this element's automatic changes?
1. The changing content sits inside a genuine live region (`aria-live="polite"`/`"assertive"`, or
   `role="status"`/`"alert"`/`"log"`) — check the crop/markup for this on the SLIDE CONTAINER itself (the part
   that actually swaps), not just decorative wrapper divs.
2. Focus programmatically moves to the changed content with a description of what changed.
3. A dialog or other explicit mechanism announces each change.

**NOT sufficient (a common false-clear to avoid):** visually-hidden "Previous"/"Next" labels on MANUAL
navigation controls (e.g. `<span class="sr-only">Previous</span>`) name those CONTROLS — they say nothing
about the AUTOMATIC slide changes that happen without the user touching them. Do not credit manual-control
labeling as satisfying the automatic-change notification requirement; these are two different things. Manual
pagination indicators (dots, a "slide 2 of 4" counter) are also not a NOTIFICATION mechanism unless they are
themselves in a live region that updates and announces on each automatic transition.

**Evidence handed to you:** `element-crop` (the carousel/slideshow itself), `surrounding-region` (wider
context, including any adjacent live region or off-carousel status area), the element's collected
`liveRegion`/`autoUpdatingContent` facts (the latter is why this obligation exists at all — trust it, don't
re-derive "is this really auto-updating" from the screenshot alone since a static crop cannot show motion),
AND raw markup (`rawElementHtml`/`enclosingHtml`) — a screenshot cannot show an `aria-live`/`role="status"`
attribute at all, so criterion 1 above MUST be answered from the markup, not the crop. If markup evidence is
present, use it as authoritative for criterion 1; only fall back to PARTIAL if markup is genuinely absent.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- If the auto-updating region genuinely IS wrapped in a live region (check carefully — it may be on a
  different element than the outer carousel container), clear it — NOT REPRODUCED.
- A carousel that only advances on EXPLICIT user action (clicking next/prev, no autoplay/timer) is not in
  scope for this obligation at all — but you are only ever handed this obligation when the collector already
  confirmed a timer-driven `data-ride`/`data-bs-ride` marker, so do not second-guess that determination from
  the crop; judge the NOTIFICATION question, not whether it auto-advances.
- If the crop doesn't show enough of the DOM structure to confirm presence/absence of a live region, return
  PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — no notification mechanism found), NOT REPRODUCED (no barrier — a real mechanism
exists), PARTIAL (cannot decide from the evidence), N/A (abstain — NOT "out of scope", that is the
oracle's job)}.
