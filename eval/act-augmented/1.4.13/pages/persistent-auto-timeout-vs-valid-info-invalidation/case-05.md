# case-05 — Doc editor "Saving… → Saved." popup disappears because the busy info became invalid (PASS exception)

## Scenario
A collaborative document editor (Quillpad) has a sync chip in the toolbar. On hover/focus
the chip shows a persistent `role="tooltip"` ("Last synced just now…") that meets all
three conditions. Separately, while the user edits, the chip shows a transient
**"Saving…"** busy state; when the autosave completes, the label changes to **"Saved."**
and then the transient state clears. The transient popup's disappearance reflects the
**busy information becoming invalid** — the save genuinely finished — which the Persistent
condition explicitly permits. This must be judged a **PASS**, not a persistence failure.

## Attribute tuple
- **content-domain**: developer/productivity SaaS (collaborative doc editor)
- **UI-component/pattern**: autosave sync-status indicator + hover detail tooltip
- **host-language construct**: `contenteditable` `input` event → busy→done semantic change
- **locale/i18n**: en
- **failure-mechanism**: NONE — legitimate information-invalidation (the boundary/exception)

## Developer persona
A product engineer built an honest autosave indicator: it announces "Saving…" while a
write is in flight, switches to "Saved." on success, then settles. They deliberately made
it transient because once the document is saved, a lingering "Saving…" would be a lie.

## Element / selector carrying the issue
- Boundary/exception element: `#syncLabel` inside `.sync` — its text transitions
  "Saving…" → "Saved." → "All changes saved", driven by the document `input` event.
- Persistent hover tooltip (unaffected, passes all three conditions): `#syncDetail[role="tooltip"]`.

## Exact accessibility mechanism
The chip's detail tooltip appears on hover/focus, is hoverable, Esc-dismissible, and
stays visible until the user leaves or dismisses it — Dismissible/Hoverable/Persistent all
pass. The transient "Saving…" message is the interesting part: it ends because the
information it conveys (a write is in progress) becomes false once the save completes. The
Persistent condition lists "the information conveyed by the additional content becomes
invalid, such as a 'busy' message that is no longer valid" as an allowed reason for content
to end. AT-wise: a user reading the chip sees the truthful progression busy → done; nothing
the user still needs is removed while still valid.

## Expected ACT-style outcome
**passed** — the only timed disappearance is a busy message ending when its information
becomes invalid (the explicit Persistent exception); the hover detail tooltip meets all
three conditions.

## Why automated tools miss it
This page is the discriminator. It contains a `setTimeout` that removes content after a
delay — structurally the SAME shape as case-01's FAIL. A heuristic that flags "any timer
that hides hover/focus content" would wrongly fail it. axe/WAVE/Lighthouse, conversely,
report nothing either way. Correctly judging this a PASS requires reading the MEANING of
the content over time: "Saving…" became false, so its disappearance is the permitted
info-invalidation, not a disallowed auto-timeout. That is human semantic/temporal
reasoning, not a timer-presence check.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Persistent:** "Once it appears, the content should
> remain visible until: … The information conveyed by the additional content becomes
> invalid, such as a 'busy' message that is no longer valid."
> (wcag-understanding/content-on-hover-or-focus.html)

> **WCAG 2.2 Understanding 1.4.13 — Dismissible:** "The success criterion allows for input
> error messages to persist as there are cases that require attention, explicit
> confirmation or remedial action." (wcag-understanding/content-on-hover-or-focus.html)
