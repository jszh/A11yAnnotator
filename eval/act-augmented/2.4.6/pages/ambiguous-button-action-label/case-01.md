# case-01 — Three buttons all labeled "OK" save, discard, and export a dashboard layout

## Scenario
A SaaS analytics product ("Northwind Analytics"). The user has been rearranging
tiles in a dashboard editor and tries to leave with unsaved changes. An
`alertdialog` appears offering three choices, described in prose: keep the edits
(save), throw them away (discard), or take a copy (export `.json`). The three
action buttons below the prose are **all labeled "OK"**, and — worse — they are
rendered in a *different* order (export, save, discard) than the prose lists them
(save, discard, export). The visible button text alone does not tell the user which
"OK" performs which function.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component / pattern:** modal confirmation dialog (`role="alertdialog"`) with a button row
- **host-language construct:** three native `<button type="button">` elements, each text content "OK"
- **locale / i18n:** en-US
- **failure-mechanism:** generic, identical action verb-less labels ("OK") on three controls with three distinct consequential functions; the disambiguating prose is present but not associated with any button, and button order does not even match the prose order

## Developer persona
A back-end-leaning engineer wired up the editor's "unsaved changes" guard quickly
before a demo. The design spec said "show a confirm dialog," so he reused the
team's generic `Dialog` component, whose default footer is three `OK` buttons he
forgot to relabel. He tested it himself with a mouse, clicking the button whose
position he remembered, and it "worked," so the placeholder labels shipped. He
never tab-navigated the dialog or listened to it with a screen reader.

## Element / selector carrying the issue
`.dialog .actions > button` — three sibling `<button>` elements, all with the
accessible name **"OK"**, mapping (in DOM order) to export, save, and discard.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** can *guess* from button styling (primary blue vs. ghost
  vs. neutral) and may read the prose, but even they get no reliable mapping —
  color is not a label and the order is scrambled.
- **Screen-reader user (tabbing the dialog / using a forms or buttons list):**
  hears "OK, button" three times in a row with nothing to distinguish them. The
  accessible name "OK" conveys only "this is a confirm-style button," not *which*
  of save / discard / export it triggers. Choosing wrong silently discards
  unsaved work or writes an unwanted layout.
- **Function judgment:** per TT 5.B prong 2, each visible button label must be
  "sufficiently clear and descriptive, so users know its function." "OK" attached
  to three different functions fails that test for all three.

## Expected ACT-style outcome
**failed** (SC 2.4.6, TT 5.B button-function prong / G131). The labels are present
and grammatical but do not make each control's purpose clear.

## Why automated tools miss it
- Every button has a non-empty accessible name and a valid role, so axe
  `button-name`, WAVE, and Lighthouse all pass; there is no empty-label or
  missing-name rule to trip.
- Duplicate accessible names across sibling controls are not a violation any
  mainstream linter reports.
- Judging that "OK" fails to convey *function* — and that three identical "OK"s on
  save/discard/export is dangerous — requires reading the dialog's prose, mapping
  it to the buttons, and reasoning about the consequence of each action. That is an
  irreducible human semantic judgment.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results, point 2)

> "The objective of this technique is to ensure that the label for any interactive component within web content makes the component's purpose clear."
— wcag-techniques/general/G131.html (Description)
