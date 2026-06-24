# case-02 — Destructive button: visible "Delete account" but accessible name "Delete account draft"

## Scenario
An online-banking "close account" confirmation panel. The destructive button visibly reads
**"Delete account"** — accurate about the permanent, irreversible closure of the whole checking
account (the warning above lists the consequences). But the button's accessible name is **composed**
via `aria-labelledby` from two on-page spans and computes to **"Delete account draft"**. The trailing
"draft" makes the announced label *misleadingly narrow*: a screen-reader user hears "Delete account
draft, button" and reasonably thinks they are discarding a saved draft, not closing their bank
account. The visible surface (permanent account closure) and the announced surface (recoverable draft
deletion) **diverge in meaning**.

## Attribute tuple
- **Content domain:** online banking / fintech
- **UI component / pattern:** destructive confirmation button (modal-style panel)
- **Host-language construct:** `<button aria-labelledby="span span">` concatenating hidden spans
- **Locale / i18n:** en-US
- **Failure mechanism:** composed accessible name adds a **misleading qualifier word** the visible
  text lacks; divergence type = **VISIBLE-ACCURATE / ANNOUNCED-MISLEADING** (different function)
- **ARIA anti-pattern (facets.json):** "aria-labelledby points to an empty or wrong/hidden element"
  (here: a stale extra qualifier span)

## Developer persona
The destructive button was cloned from a "Delete account draft" card in the same admin UI (which
discarded an autosaved draft). The dev updated the **visible** text node to "Delete account" but left
the `aria-labelledby` referencing the original `del-verb` + `del-qual` ("draft") spans, so the
accessible name still carries the obsolete "draft" qualifier.

## Element / selector carrying the issue
`button#del-btn` — visible text "Delete account"; `aria-labelledby="del-verb del-qual"` →
accessible name "Delete account draft". Verified in Chromium: `role=button`,
`accName="Delete account draft"`, `visibleText="Delete account"`.

## Exact accessibility mechanism
`aria-labelledby` concatenates the referenced (hidden) spans' text: "Delete account" + "draft" =
"Delete account draft". A blind user navigating the dialog hears a button that claims to delete a
*draft* — a low-stakes, recoverable action — when activating it permanently closes the account. The
accessible name is present, the role is correct, and the visible words "Delete account" ARE contained
in the name, but the name *describes a different, far less destructive function* than the control
performs. This is the explicitly-separate 2.4.6 judgment: the label is inaccurate about purpose.

## Expected ACT-style outcome
**failed** — TT 5.B (`2.4.6-label-descriptive`), button-label limb: a button label must be
"sufficiently clear and descriptive, so users know its function". "Delete account draft" misdescribes
the function (it deletes the account, not a draft). The "Keep my account" button passes.

## Why automated tools miss it
The earlier draft of this page used `aria-label="Submit"`, which axe-core's experimental
`label-content-name-mismatch` rule (ACT 2ee8b8) **did** flag, because the visible "Delete account"
was not a substring of "Submit". I redesigned it so the visible text **is** a substring of the
accessible name ("Delete account" ⊆ "Delete account draft"): verified that a full `axe.run` (default
ruleset + `label-content-name-mismatch` explicitly enabled) now reports **0 violations**. The visible
label is contained in the name, so the subset check is satisfied; both spans resolve, so no
dangling-IDREF lint fires; the name is a fluent real phrase, so no empty/slug heuristic fires.
Detecting the defect requires reading the *extra* word "draft", understanding the panel's true
consequence (permanent closure), and judging that the announced function is wrong — a semantic
judgment no string-comparison rule can make.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— Trusted Tester v5.1.3, Test **5.B** `2.4.6-label-descriptive`, *Evaluate Results*
> (`refs/trusted-tester/sc-2.4.6-headings-and-labels.md`). The announced "Delete account draft" tells
> the user the wrong function, so this check is false.
