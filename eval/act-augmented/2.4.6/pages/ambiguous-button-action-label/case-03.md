# case-03 — A list of five drafts, each row's only button reads "Remove" with no object

## Scenario
A newsroom CMS "My drafts" screen ("Larkspur Newsroom"). Five unpublished stories
are listed, each with a title, last-edited time, a "Draft" status pill, and a single
**"Remove"** button. Removing a draft is permanent (stated in the hint). Every row's
button is the bare word **"Remove"** — the label never names *which* story it
removes. The disambiguating title lives in a sibling `<span class="title">`, not in
the button and not programmatically associated with it.

## Attribute tuple
- **content-domain:** news / editorial CMS (draft management)
- **UI-component / pattern:** repeated list rows (`<ul>`/`<li>`) each with one row-action button
- **host-language construct:** five native `<button type="button">`, each text content "Remove"; row title in a separate `<span>`
- **locale / i18n:** en-GB
- **failure-mechanism:** action label with no object — the verb ("Remove") is present and apt, but the button never says *what* it removes; the object is visually adjacent but not in the name and not programmatically linked

## Developer persona
A junior front-end dev built the drafts list from a reusable `<RowActions>`
component that hard-codes a `"Remove"` button (it is used in a dozen tables across
the CMS). She knew each button needed to target its own row's id and wired the
`onClick` correctly with the draft's id — so it *works* with a mouse, where the
button is unmistakably "the one on this row." She never added a per-row label,
because visually the row context is obvious and the shared component had no slot
for one.

## Element / selector carrying the issue
`ul.drafts > li.draft > button.btn` — five sibling `<button>` elements, all with the
accessible name **"Remove"**, each permanently deleting a different, unnamed draft.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** sees the button physically beside its row's title, so the
  object is conveyed by spatial proximity — purely visual.
- **Screen-reader user (buttons list / rotor / tabbing):** hears "Remove, button"
  five times with nothing to differentiate them. The accessible name carries the
  verb but not the object, so the user cannot tell whether they are about to
  permanently delete "the harbour dredging vote" or "the Q3 report." The
  row title is a separate node, not chained into the button name via
  `aria-labelledby`, so it does not reach the accessible name.
- **Function judgment:** in a repeated list, "knowing the control's function" means
  knowing *which* object it acts on. A label of "Remove" alone leaves the function
  (remove *what*?) unclear, failing TT 5.B's button-function prong.

## Expected ACT-style outcome
**failed** (SC 2.4.6, TT 5.B button-function prong / G131). The labels are present
but do not make each control's purpose clear because they omit the object acted on.

## Why automated tools miss it
- Each button has a non-empty accessible name and valid role, so `button-name`,
  WAVE, and Lighthouse pass. Repeated identical names are not a flagged violation.
- A tool cannot decide that "Remove" is insufficient *because the object is missing*
  — that requires understanding the list is a set of distinct drafts and that the
  per-row title (in a sibling node, not associated) is the object the button needs
  to name.
- Whether the adjacent title "rescues" the label is a programmatic-association +
  semantic judgment; here it does not (no `aria-labelledby`), and only a human
  reading the DOM relationships can confirm that.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results, point 2)

> "Descriptive labels help users identify specific components within the content."
— wcag-understanding/headings-and-labels.html (Intent of Headings and Labels)
