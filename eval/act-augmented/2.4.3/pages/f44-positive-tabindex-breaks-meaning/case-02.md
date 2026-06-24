# case-02 — Edit-drift: a later-added "Daytime phone" field has no tabindex and is tabbed after Submit

## Scenario
A State of Marin employee benefits-enrollment form (Step 2 of 4). Every original field has an
explicit positive `tabindex`: First name (1), Last name (2), Work email (3), Mailing address
(4), City (5), ZIP (6), then **Continue to Step 3** (7) and **Save & finish later** (8). In a
later sprint, HR asked for a **Daytime phone** field. The developer dropped it into the DOM in
exactly the right visual place — directly under Work email — but forgot to give it a `tabindex`.
Because positive-tabindex elements are traversed first (in numeric order) and the un-indexed
phone field is traversed afterward in DOM order, Tab order becomes:
**First → Last → Email → Address → City → ZIP → Continue (Submit) → Save → Phone.**
The phone field is reached dead last, *after* the submit button — the exact edit-drift case the
F44 technique describes.

## Attribute tuple
- **content-domain:** government / civic services portal (HR benefits enrollment)
- **UI-component / pattern:** multi-step wizard form (Step 2 of 4)
- **host-language construct:** explicit `tabindex` 1–8 on every control EXCEPT one newly added `<input type="tel">` (no tabindex)
- **locale / i18n:** en-US
- **failure-mechanism:** edit-drift — a mid-form field added without tabindex falls to the end of the tab order, behind Submit

## Developer persona
A contractor maintaining a legacy ASP.NET portal where "tab order is managed with explicit
tabindex" was a documented team convention from years ago. When the change ticket "add daytime
phone under work email" came in, they copied the email field's markup, changed the id/label/type,
and pasted it — but deleted the `tabindex="3"` thinking it would collide, intending to renumber
everything later. They never did. QA tested with a mouse, saw the field in the right place, and
signed off.

## Element / selector carrying the issue
- `#phone` (`input[name="phone"]`) — the only control in the form WITHOUT a `tabindex`.
- Its neighbors `#email` (`tabindex="3"`) and `#addr` (`tabindex="4"`) are explicitly numbered,
  so `#phone` is excluded from the positive-tabindex pass and is visited last, after
  `button[type="submit"]` (`tabindex="7"`) and the secondary button (`tabindex="8"`).

## Exact accessibility mechanism (what AT experiences)
A keyboard or screen-reader user fills the form top to bottom by Tab. After Work email, Tab jumps
PAST the visible phone field straight to Mailing address; the user never lands on phone during the
natural pass. They reach the **Continue to Step 3** button believing the form is complete, and a
*required* field has been silently skipped. If they keep tabbing past Submit, focus finally lands
on the phone field — orphaned after the action buttons, with no surrounding context, where a
screen-reader user has no reason to expect a data-entry field. The focus order destroys both
*meaning* (a contact field divorced from the contact section) and *operability* (a required field
practically unreachable in the normal flow, encountered only after the submit control). Fails 2.4.3.

## Expected ACT-style outcome
**failed** — F44 failure of SC 2.4.3, the edit-drift variant (new field without tabindex pushed to
the end of the tab order).

## Why automated tools miss it
Every control has a programmatic label, valid markup, good contrast, and correct `autocomplete` —
naive checks pass. axe-core only emits a best-practice note for the *presence* of positive
tabindex; it has no rule that detects a single control *omitted* from an otherwise-explicit
numbering, nor that the omission strands a required field after the Submit button. Recognising that
"a data field reached only after the submit control" breaks operability requires understanding what
a submit button means and that an enrollment field encountered post-submit is effectively
unreachable — a human operability and form-flow judgment, not a static-DOM property.

## Citation
**Reference:** WCAG Technique F44 — *Failure of Success Criterion 2.4.3 due to using tabindex to
create a tab order that does not preserve meaning and operability* (`wcag-techniques/failures/F44.html`).

> "Later, the page is modified to add a new field in the middle of the page, but the author forgets
> to add a tabindex attribute to the new field. As a result, the new field is at the end of the tab
> order."

**Supporting reference:** WCAG Technique F44, root cause statement (`wcag-techniques/failures/F44.html`).

> "One of the most common causes of this failure occurs when editing a page where tabindex has been
> used. It is easy for the tab order and the content order to fall out of correspondence when the
> content is edited but the tabindex attributes are not updated to reflect the changes to the content."
