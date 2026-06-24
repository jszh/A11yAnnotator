# case-02 — APG tabs widget whose three tab labels all read "Details"

## Scenario
A product-detail page for the "Aurora 14" laptop uses a standard WAI-ARIA Authoring Practices (APG) tabs widget to switch between three panels: a technical specification table, customer reviews, and shipping & returns. The tablist is fully correct — arrow-key navigation, roving tabindex, `aria-selected`, `aria-controls`/`aria-labelledby` wiring. The defect: all three tab buttons carry the identical label **"Details"**. A tab label is, for SC 2.4.6 purposes, the *label of the section it controls*; three sibling tabs all labeled "Details" do not distinguish their panels.

## Attribute tuple
- **content-domain:** e-commerce product detail page
- **UI-component / pattern:** APG tabs / tablist (interactive disclosure of sibling sections)
- **host-language construct:** `role="tablist"` with three `role="tab"` buttons + three `role="tabpanel"`s
- **locale / i18n:** en-US
- **failure-mechanism:** relational/uniqueness failure of the SC 2.4.6 *label* limb — each tab's accessible name is present and non-empty, but the three sibling tab labels are identical, so navigating the tablist gives no orientation as to which panel is which

## Developer persona
A developer copied a vetted APG tabs reference implementation (which is why the ARIA is flawless) and dropped in three panels. The first panel's content was a spec sheet they mentally called "the details", so they typed `Details` as the tab label. When they added the reviews and shipping panels later, they duplicated the markup of the first tab and forgot to rename the label — the panels render correctly and the widget works, so the visual review (where the *selected* panel's content is obviously different) never surfaced that the three tab captions are identical.

## Element / selector carrying the issue
`[role="tablist"] > [role="tab"]` — the three `<button>` elements `#tab-1`, `#tab-2`, `#tab-3`, each with the text "Details". They should read "Specifications", "Reviews", "Shipping &amp; returns".

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user clicks a tab and sees the panel content change; they infer each tab's purpose from the revealed content, and the active tab is visually underlined.
- A screen-reader user lands on the tablist and arrows across it. They hear: "Details, tab, 1 of 3, selected … Details, tab, 2 of 3 … Details, tab, 3 of 3". Because only the *selected* panel is exposed (the others are `hidden`), the user cannot preview panel content to disambiguate; the tab label is the only orientation cue, and it is identical for all three. They have no way to know which tab leads to specs vs. reviews vs. shipping without activating each in turn.
- Per G130's relational principle (applied to labels via G131 / TT 5.B), a label must make its target's purpose clear *and* distinguish it from siblings. "Details" fails: it is the same for all three and describes none of them specifically.

The defect is real in the DOM: three `role="tab"` elements each contain the text "Details", and the live widget announces them identically.

## Expected ACT-style outcome
**failed** (SC 2.4.6 — label limb / TT 5.B: the visual/section labels are not sufficiently descriptive to distinguish the sibling sections they control; G130 relational requirement applied to labels).

## Why automated tools miss it
The widget is ARIA-perfect: each tab has a valid `role`, a non-empty accessible name ("Details"), correct `aria-selected`, and valid `aria-controls`. axe-core (`aria-roles`, `aria-required-attr`, `aria-valid-attr-value`, `button-name`) and Lighthouse all PASS — a present, non-empty name satisfies every machine check, and 4.1.2 Name/Role/Value is satisfied. No automated rule compares sibling tab labels for mutual distinctiveness or judges whether "Details" orients a user among three panels. Recognizing the failure requires understanding that a tab is a section label, reading what each panel actually contains, and judging that one repeated word cannot differentiate three different sections — human semantic judgment.

## Citation
> "Descriptive headings identify sections of the content in relation both to the web page as a whole and to other sections of the same web page."
— wcag-techniques/general/G130.html (Description)

> "The objective of this technique is to ensure that the label for any interactive component within web content makes the component's purpose clear."
— wcag-techniques/general/G131.html (Description)

> "1. Each visual form label is sufficiently clear and descriptive, so users know what input data is expected, AND 2. Each visual button label is sufficiently clear and descriptive, so users know its function."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results)
