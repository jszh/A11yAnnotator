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
   which is exactly why that question cleared these pages. When `signals.liveRegionBirths` is present it
   extends this check to regions the ACTIVATION sweep could never see: a region with `mountedAfterLoad` and
   `emptyAtBirth: false` — and WITHOUT `harnessInteraction: true` — was inserted already carrying its
   message with no user action at all, and `removedAtMs` means it then removed itself — announced by
   nothing and unreadable on demand. A row tagged `harnessInteraction: true` was born only AFTER the
   harness itself started clicking controls: attribute it to that interaction (the activation sweep's own
   observations already cover what a click produced), never read it as a spontaneous page-init birth.
   `emptyAtBirth: true` with a later `firstContentAtMs` is the healthy shape — it corroborates correct
   WIRING, and nothing more. **A birth record alone NEVER licenses a clear:** wiring says the region
   COULD announce; whether what happened on this page WAS announced is settled only by the
   observation/timeline/announcement evidence, and a healthy birth sitting beside an unresolved barrier
   question does not soften it — the PARTIAL caveat below still governs when no announcement was
   observed. Birth rows may also carry content-transition facts (when present: `emptiedAtMs`, or a
   last-content transition): a region whose content was REMOVED (`emptiedAtMs`) with no announced
   follow-up is the silent-empty shape — apply the removal test of items (2)/(3) to it, and note that
   the region's healthy birth earlier in its life says nothing about the silent emptying.
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
4. **`signals.statusTimelines` present ⇒ judge the WHOLE flow, in order, and ask the outcome question:
   after a busy/progress message is removed (a `content-removed` or `live-region-emptied` row), is the
   OUTCOME of the operation conveyed to AT at any later `atMs`?** The outcome is conveyed only by a later
   row INSIDE a live region (`content-added` with `inLiveRegion: true`, or a `live-region-updated`/
   `live-region-refilled` row), or by focus moving into the new content (the observation's focus facts).
   An outcome carried ONLY by a `content-added` row OUTSIDE any live region, or a `live-region-emptied`
   with no announced follow-up, reaches no AT — **that is a barrier**, and it is invisible to a single
   before/after observation, which is exactly why these pages were being cleared. A flow whose only outcome
   rows are `state-change`s or `visibility-flip`s is NOT automatically that shape — **but that softer
   reading is SCOPED: it applies ONLY when the flow never announced an interim busy/progress message.** A
   flow that DID announce one (a `content-added` with `inLiveRegion: true`, or a `live-region-updated`/
   `-refilled` row carrying interim text) and then removed or emptied it has itself established that this
   operation reports status as announced text; the outcome must arrive on that same channel, and an
   attribute flip — however programmatically determinable — is not the announced follow-up. That flow
   keeps the barrier shape above. Only in a pure attribute-flip flow (no interim status ever announced)
   decide instead whether any VISIBLE status message conveys the outcome
   — if sighted users receive no status message either, there may be no status message in scope at all.
   *Guards:* a removal that conveys
   nothing new (a toast expiring after its message was announced) is NOT a barrier — same test as the
   `removedText` item above; and judge the state at the END of the recorded flow, not an intermediate
   phase.
5. `regionsUpdated[].politeness` / `.atomic` ⇒ judge the politeness against the URGENCY of the message (an
   error or a time-critical warning delivered `polite` may be missed; a routine count delivered `assertive`
   interrupts), and `atomic: false` on a region where only part of a sentence changes means the AT reads
   the fragment, not the meaning. When the entry carries `mutatedFragment` (present only on `atomic: false`
   updates), that IS the exact text the AT reads for this update — apply the stand-alone check below to the
   FRAGMENT, not to the region's full visible text: a fragment that drops the sentence's subject is the
   truncated-announcement shape even though the full region text reads fine on screen.
6. `addedOutsideLiveRegion` NON-EMPTY with nothing else ⇒ the plain-`<div>` case; the detector will normally
   already have barriered it.

**THE ANNOUNCED STRING MUST STAND ON ITS OWN — a SECOND, independent check, applied only AFTER the wiring
checks above pass.** Correct delivery (a pre-existing region, sane politeness, updated in place) settles HOW
the message reaches AT, never WHAT it says — do not stop at "the live region is correctly implemented". Take
the exact string an AT would speak (`regionsUpdated[].after`, an `addedInsideLiveRegion` entry, or a
`liveRegionAnnouncements` entry) and read it ALONE, with no screen: does it state what happened, and to WHAT
it happened? A sighted user reads the update inside its visual context — the row it sits in, the label beside
it, the control it decorates; an AT user gets ONLY the string. Barrier ONLY when ALL THREE hold: **(i)** the
string names no subject — it states an outcome, quantity, or state change without saying what it applies to;
**(ii)** that referent IS on screen for a sighted user at the moment of the update, carried by some visible
text or accessible name near the update; and **(iii)** that
referent text sits OUTSIDE the announced region and is not re-announced with the update. You must POINT TO
the specific on-screen text that carries the missing referent; if you cannot, there is no barrier under this
check. **STRUCTURAL REQUIREMENT — a clear must CARRY this check's result.** Before returning NOT REPRODUCED
over an OBSERVED announcement, your `reasoning` sentence MUST quote the exact announced string, AND EITHER
name the subject/referent that makes it stand alone (the words inside the string, or the announced region's
own persistent text/accessible name, that say WHAT it applies to) OR state WHICH GUARD BELOW APPLIES —
`terse-outcome` or `region-carries-its-own-referent` — and why. Naming a guard is not an escape hatch from
quoting the string; it is the alternative to inventing a referent that, by the guard's own logic, does not
exist. A clear whose reasoning does NEITHER — quotes no referent AND names no guard — has not performed this
check: return PARTIAL instead. (This requirement lives in the `reasoning` field; the verdict JSON's shape is
unchanged.)
*Guards — do NOT sweep up terse-but-complete statuses.* Guard `terse-outcome`: a one-word outcome ("Done")
after a single unambiguous user action, where no on-screen text supplies a referent the string lacks, is
COMPLETE. Guard `region-carries-its-own-referent`: a count/value whose referent IS the announced region
itself — the region's own persistent text or accessible name says what is being counted and travels with
the update — is COMPLETE. Brevity alone is never the finding; the finding is a referent the sighted user
gets and the announced string drops.
**The one-word-outcome guard covers a one-word OUTCOME STATEMENT only — a word that itself states what
happened. It does NOT cover an announced string that is an icon's ACCESSIBLE NAME.** When the observation
carries accessible-name provenance (when present: an `accNameVoiced` entry — `viaAccName: true` with the
carrier's `tag`/`role`, a graphic source such as `svg`/`img`/`role="img"`, its nearest `lang`, and the
observation's `documentLang`), the spoken word was carried ONLY by markup the eye never reads — it is the
NAME OF A SYMBOL, not a composed status message. Ask whether that name, heard alone, states the outcome a
sighted user takes from the symbol: a name that merely names the glyph or its shape, or a name whose
language mismatches `documentLang` (announced with the wrong pronunciation and reading), leaves the AT
user to guess what was reported and FAILS the stand-alone test exactly as a subject-less string does.
Even without provenance fields, when the evidence shows a one-word announced string arising from a bare
icon inside the region, give it the same scrutiny — the one-word-outcome guard does not apply to it.

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
  **Read the three focus facts precisely; only one of them takes a page out of scope.**
  - `focusMoved: true` means focus came to rest on a REAL element after the activation. That is the
    change-of-context exclusion above.
  - `focusMovedIntoNewContent: true` is the stronger form — focus landed INSIDE the content that appeared.
    That is what "the AT announced it by focusing it" actually means, and it is the cleanest exclusion.
  - `focusDropped: true` is the **OPPOSITE of an exclusion, and never grounds for one.** It means the
    activation DESTROYED the element that had focus and focus fell back to the document body. Nothing was
    announced; the user's focus position was silently lost. That is a barrier SYMPTOM, and on a page whose
    new content is announced by nothing else it strengthens the case rather than removing it. Do not read a
    dropped focus as a change of context — no context was communicated, it was discarded.
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
