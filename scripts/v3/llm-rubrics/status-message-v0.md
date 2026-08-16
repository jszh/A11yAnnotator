---
id: status-message-v0
sc: 4.1.3
skill: dynamic-announcement
visionEvidence: [viewport]
---

# 4.1.3 — status messages (v0 atomic rubric, AA)

**Division of labor (v3.2).** This obligation reaches you by either of two routes, and WHICH one matters:
either the collector found a LIVE REGION on this page (an `aria-live="polite|assertive"` container, or an
implicitly-live role `status`/`alert`/`log`/`progressbar`) and the subject is that region — or the
deterministic instrument OBSERVED a content change on activation and the subject is the PAGE
(`/page-level::status-message`). **In the second case do not go looking for a live region to judge: on the
commonest failure shape there is no live region at rest at all, and that absence IS the failure.** The
insertion-only status-detector
ran but CANNOT decide the *un-hide* case (a status that appears by un-hiding a pre-rendered node, `addedCount=0`)
and names no trigger. When the CDP tools are enabled you also receive the OBJECTIVE before/after delta of one
activation (`observe_state_after_activation`: each newly-visible text + whether it landed in a region that
PRE-EXISTED) and the verbatim screen-reader announcement queue (`probe_screen_reader_after_action`:
`liveRegionAnnouncements` — the polite/assertive subset, the ONLY 4.1.3-relevant phrases).

**Judge:** when a status message is conveyed VISUALLY (a success/error/"3 results"/loading update that does not
move focus), is it ALSO conveyed to AT through an appropriate live region — with the right politeness and without
requiring focus? A success/status text that appears in NO live region (a plain `<div>` swapped in) is a barrier.

**WHAT ACTUALLY HAPPENED — `signals.statusObservations`.** When the deterministic instrument observed a
content change on activation you are handed one entry per trigger. Judge from these, not from the resting
screenshot, which cannot show any of it. Read them in this order:
1. `regionsBornWithContent` NON-EMPTY ⇒ a live region was INSERTED already holding its message. An AT
   observes regions that were in the tree when the change happened, so a region born with its content
   announces NOTHING. **This is a barrier**, and it is invisible to "is the text inside a live region?" —
   which is exactly why that question cleared these pages.
2. `removedText` NON-EMPTY ⇒ status text LEFT the page. A status message is content about "the success or
   results of an action… the waiting state… the progress of a process… the existence of errors", and its
   DISAPPEARANCE reports a change in that state just as its appearance did: when an in-progress message
   goes away, that IS the report that the operation finished, and an AT user is told nothing at the moment
   it happens. `appearedThenRemoved: true` marks a message added
   and withdrawn inside one observation (the progress-message pattern). *Guard: a self-dismissing toast
   whose removal conveys nothing new is NOT a barrier — the information was already announced when it
   appeared, and its expiry adds none. Ask what the removal TELLS the user; if the answer is "nothing", it
   is not a status change.*
3. `regionsUpdated[].emptied: true` ⇒ a pre-existing region was cleared. Same test as (2).
4. `regionsUpdated[].politeness` / `.atomic` ⇒ judge the politeness against the URGENCY of the message (an
   error or a time-critical warning delivered `polite` may be missed; a routine count delivered `assertive`
   interrupts), and `atomic: false` on a region where only part of a sentence changes means the AT reads
   the fragment, not the meaning.
5. `addedOutsideLiveRegion` NON-EMPTY with nothing else ⇒ the plain-`<div>` case; the detector will normally
   already have barriered it.

**NOT EVERY OBSERVED CHANGE IS A STATUS MESSAGE — check these exclusions FIRST.** This obligation now fires
on any page where activation demonstrably changed content, so the scope test is yours to apply. Per the
Understanding, a status message informs the user "on the success or results of an action, on the waiting
state of an application, on the progress of a process, or on the existence of errors", AND is not delivered
via a change of context. Therefore return **N/A**, not a barrier, for:
- **Primary content the user asked for.** "The list of results obtained from a search are not considered a
  status update and thus are not covered by this success criterion" — verbatim. Rendering the results is
  not a status message; the Understanding's own contrast is that the brief text ABOUT the operation —
  its progress, its completion, or the absence of any result — displayed alongside them, IS one.
- **A change of context.** If activation moved focus, opened a modal that takes focus, or navigated, the AT
  has already announced the new content by focusing it — out of scope by definition (`focusMoved: true`).
- **A selection the user just made.** Selecting a tab, checking a checkbox, choosing a radio in a survey —
  the control's own state change is announced by the control, and the panel it reveals is primary content.
- **Content revealed by a disclosure the user opened.** Same reason.

**WCAG soundness caveats (REQUIRED before failing or clearing):**
- **Absence ≠ pass.** The insertion-only detector finding NO insertion is NOT a clear — the un-hide case is exactly
  what it misses. Do not read "no detector finding" as "announced".
- A live region **created together with its message** (the region did not pre-exist the update) is NOT a reliable
  announcement — many AT do not announce it. Treat "region pre-existed" as a precondition for a clear.
- **An EMPTY announcement is not an announcement.** `probe_screen_reader_after_action` reports
  `emptyLiveRegionEvents` — live-region events whose spoken text is empty (a region touched but populated
  with nothing, or cleared). A non-zero count next to a visible on-screen status change means the user
  heard SILENCE where the sighted user read a message; that is a barrier, not evidence the region works.
  Never count an event toward `liveRegionAnnouncements` unless it carried text.
- If you cannot OBSERVE an actual announcement (no CDP tool result, no driven activation), you can confirm the
  region is correctly marked but NOT that updates are announced ⇒ return **PARTIAL**, never a clear.
- A live region that is `aria-live="off"`, `aria-hidden`, or never populated is not in scope here.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
