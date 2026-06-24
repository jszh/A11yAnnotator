# case-05 — "No roles match" result summary as a plain <p>, no live region (in-scope status → fail)

## Scenario
An Aperture Robotics careers page with a faceted job filter (Department, Location). Filtering runs
client-side with no reload and **without moving focus**. A summary line above the list updates to
"Showing N of 3 open roles." or, when nothing matches, **"No roles match your filters."** — rendered as a
plain `<p id="summary">` (and an `#empty` block) with **no** `role="status"`/`aria-live`. The results
**list** is correctly *not* a status message and needs no live region; but the count / empty-state
summary **is** a genuine status message (it conveys the result of the filter action), and it is left
programmatically undeterminable. This is the false-negative direction: an in-scope status the author
treated as "just content" like the list.

## Attribute tuple
- **content-domain:** job board / ATS careers site
- **UI-component/pattern:** filter facets (checkboxes) updating a result summary + list
- **host-language construct:** plain `<p id="summary">` + `[hidden]` empty-state `<div>`, mutated by JS;
  no live-region attributes
- **locale/i18n:** en
- **failure-mechanism:** genuine status message ("No results returned" / result count) rendered without
  any of `output`/`role=status`/`role=alert`/`role=log`/`aria-live` (F103)

## Developer persona
A full-stack engineer who built instant client-side filtering and added a friendly summary line and an
empty-state. They thought of both the list and the summary as "content that re-renders," so they wired
neither into a live region. They never tested with a screen reader, so they never noticed that after
checking "Hardware + Austin" the screen-reader user — focus still on the checkbox — hears silence and
cannot tell whether zero roles matched or the page is still loading.

## Element / selector carrying the issue
`#summary` (and the `#empty` block). On a no-match filter it reads "No roles match your filters." with no
status semantics; on a match it reads "Showing N of 3 open roles." Both are status messages with no
programmatic surfacing.

## Exact accessibility mechanism (what AT experiences, why it fails)
The filter action changes content without taking focus (focus stays on the checkbox) and without a page
refresh, so it squarely meets the first limb of the status-message definition. The summary text conveys
the *result of an action* — the Understanding's canonical examples include "18 results returned" and
"No results returned." Because `#summary` is a plain `<p>` with no `output`/`role=status`/`role=alert`/
`role=log`/`aria-live`, NVDA/JAWS/VoiceOver announce **nothing** when it changes; the user must manually
hunt for the text to discover the outcome. Per F103, when a status message exists but is not surfaced by
AT (none of the live-region techniques present), the SC fails. The contrast with the *list* — correctly
not a status — is what makes this a genuine 4.1.3 failure rather than an N/A.

## Expected ACT-style outcome
**failed** — a real status message (result count / "No results returned") is present but not
programmatically determinable through role or properties (F103, steps 1–4 all true).

## Why automated tools miss it
On a static snapshot the markup is clean: labeled checkboxes, a semantic `<ul>` of jobs, fine contrast,
no missing attributes — axe/WAVE/Lighthouse report nothing. They also do not run the filter, so they
never observe the silent text swap. Even a dynamic tool would have to decide that the *summary sentence*
(not the list) qualifies as a status message requiring a live region — a meaning-based judgment about
what the content conveys (the result of the action). Tools cannot determine that "No roles match" *means*
a result/empty status while the list of jobs does not; that is the human interpretation this aspect
isolates.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Intent), `wcag-understanding/status-messages.html`:**
> "the list of results obtained from a search are not considered a status update and thus are not covered
> by this success criterion. However, brief text messages displayed about the completion or status of the
> search, such as \"Searching...\", \"18 results returned\" or \"No results returned\" would be status
> updates if they do not take focus or cause a page refresh."

> **WCAG 2.2 Techniques F103 (Description), `wcag-techniques/failures/F103.html`:**
> "the new content provides information to the user on the outcome of an action, the state of an
> application, the progress of a process, or the existence of errors. … The absence of all of these
> techniques predicts a failure for the status message be announced to the user."
