---
id: focus-return-after-dismissal-v0
sc: 2.4.3
skill: focus-management
toolMode: required
visionEvidence: []
---

# 2.4.3 — FOCUS RETURN AFTER DISMISSAL (v0 atomic rubric)

**Your one question:** when revealed content is dismissed, does focus return to the control that
opened it?

Nothing else is yours. Whether the revealed content was reachable in the first place is
`focus-reveal-adjacency-v0`'s question — a page can satisfy that and still fail this one, and the two
are measured separately. Modal containment, resting-order meaning and redundant stops each have their
own rubric. Answer the return and stop.

**Why you get no screenshots.** This question is about where focus lands after a state the resting page
is not in. A still cannot show it. The instrument entered the state, dismissed it, and recorded where
focus went.

**Division of labor (v3.2).** You do NOT activate or dismiss anything. The instrument opened the
revealed region, dismissed it (Escape, else a close-named control inside the region), and measured the
fields below. These are measurements, not inferences.

**Reading the `reveal` facts on a stop.**
- `regionHiddenAfterDismiss` — whether the region actually went away when the instrument dismissed it.
- `returnedToOpener` — where focus was once it had.
- `openerStillPresent` — whether the control that opened it even exists any more afterwards.
- A `null` means the question could not be asked. **Never argue from a `null` in either direction.**

**How to decide.** DHS Trusted Tester 4.F step 2b requires checking the focus order TO, FROM and WITHIN
revealed content; the *from* half is where focus lands once the content is gone. Dumping focus
somewhere unrelated — commonly the document body, which restarts the whole ring — loses the user's
place and is the failure this rubric owns.

- **REPRODUCED** — `regionHiddenAfterDismiss: true` **and** `returnedToOpener: false` **and**
  `openerStillPresent: true`. All three. The content went away, the control that opened it is still
  there, and focus did not go back to it.
- **NOT REPRODUCED** — focus returned to the opener, or one of the two preconditions below applies.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **`openerStillPresent: false` is NOT a barrier.** If the action removed its own trigger, moving focus
  to a logical neighbour is the documented correct behaviour. Return NOT REPRODUCED.
- **`regionHiddenAfterDismiss` false or absent is NOT a barrier.** Nothing was dismissed, so nothing is
  owed. Do not convert a failed dismissal attempt into a focus-return failure — if the region would not
  close, that is a different defect and not this one.
- **Absence is not a pass.** No `reveal` facts at all means this was not measured, not that it is
  sound. PARTIAL is the honest answer when the page's whole substance is the revealed state and no
  facts are present.
- **A trap is 2.1.2's.** Focus that cannot leave the region is a different failure with its own owner.
- **One reveal failing is enough.** If several openers were measured, a single one meeting all three
  conditions is a barrier — say which.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — focus is not returned to the still-present opener after the revealed content is dismissed),
NOT REPRODUCED (no barrier), PARTIAL (cannot decide from the handed facts), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
