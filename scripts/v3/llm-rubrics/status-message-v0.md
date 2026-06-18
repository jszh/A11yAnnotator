---
id: status-message-v0
sc: 4.1.3
skill: dynamic-announcement
visionEvidence: [viewport]
---

# 4.1.3 — status messages (v0 atomic rubric, AA)

**Division of labor (v3.2).** The collector found a LIVE REGION on this page (an `aria-live="polite|assertive"`
container, or an implicitly-live role `status`/`alert`/`log`/`progressbar`). The insertion-only status-detector
ran but CANNOT decide the *un-hide* case (a status that appears by un-hiding a pre-rendered node, `addedCount=0`)
and names no trigger. When the CDP tools are enabled you also receive the OBJECTIVE before/after delta of one
activation (`observe_state_after_activation`: each newly-visible text + whether it landed in a region that
PRE-EXISTED) and the verbatim screen-reader announcement queue (`probe_screen_reader_after_action`:
`liveRegionAnnouncements` — the polite/assertive subset, the ONLY 4.1.3-relevant phrases).

**Judge:** when a status message is conveyed VISUALLY (a success/error/"3 results"/loading update that does not
move focus), is it ALSO conveyed to AT through an appropriate live region — with the right politeness and without
requiring focus? A success/status text that appears in NO live region (a plain `<div>` swapped in) is a barrier.

**WCAG soundness caveats (REQUIRED before failing or clearing):**
- **Absence ≠ pass.** The insertion-only detector finding NO insertion is NOT a clear — the un-hide case is exactly
  what it misses. Do not read "no detector finding" as "announced".
- A live region **created together with its message** (the region did not pre-exist the update) is NOT a reliable
  announcement — many AT do not announce it. Treat "region pre-existed" as a precondition for a clear.
- If you cannot OBSERVE an actual announcement (no CDP tool result, no driven activation), you can confirm the
  region is correctly marked but NOT that updates are announced ⇒ return **PARTIAL**, never a clear.
- A live region that is `aria-live="off"`, `aria-hidden`, or never populated is not in scope here.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
