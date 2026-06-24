# case-05 — Recipe page: two identical heart buttons (private save vs public like), both named "heart"

## Scenario
A recipe page ("Smoky Charred Corn Ribs" on Hearthside) has an action bar with two visually
identical **heart** buttons side by side. The first saves the recipe **privately** to the user's
own cookbook; the second posts a **public like** attributed to the user and shown to others. Both
render the same heart glyph and both carry `aria-label="heart"`, so neither the icon nor the
accessible name tells these two consequential actions apart — and one of them has a privacy
implication (public attribution) the other does not.

## Attribute tuple
- **content-domain:** recipe / food + community (social action)
- **UI-component/pattern:** two toggle buttons (`aria-pressed`) in an article action bar
- **host-language construct:** two `<button aria-label="heart" aria-pressed>…<svg aria-hidden>…heart…</svg></button>` with different handlers
- **locale/i18n:** en
- **failure-mechanism:** same glyph + same name reused for two distinct functions; the icon fails to disambiguate private-bookmark from public-like

## Developer persona
A developer reused a single `<HeartButton>` component for both the "save" and "like" features
because they share the same icon in the design kit. The component hard-codes `aria-label="heart"`
from the icon name. Each instance was wired to a different handler (save vs like), but nobody gave
the two instances distinct, function-revealing names — the visible counts ("Saved to my cookbook"
vs "312 public likes") were considered "enough" by sighted reviewers, and the a11y gate only
checks that a name exists.

## Element / selector carrying the issue
- `button#saveBtn[aria-label="heart"]` — toggles a **private** "in my cookbook" state.
- `button#likeBtn[aria-label="heart"]` — toggles a **public** like attributed to the user.

## Exact accessibility mechanism
Both buttons expose role `button`, the identical accessible name "heart" (heart SVGs are
`aria-hidden`), and an `aria-pressed` state. A screen-reader user navigating by control hears
"heart, toggle button" twice with nothing to distinguish a private save from a public like; the
adjacent count text is in a separate element and is not part of either accessible name. The same
glyph in the same context is reused for two different functions without each use being commonly
understood — the Understanding doc permits image reuse only when "its use is commonly understood in
each context." A bare heart does not signal "private bookmark" vs "public like," so the graphical
label is not sufficiently descriptive for either control.

## Expected ACT-style outcome
**failed** (SC 2.4.6 Headings and Labels — label limb, TT 5.B). Both controls have non-empty names
(4.1.2 passes) and duplicate names are legal; the label is just not descriptive enough to
disambiguate the two functions.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse pass both buttons (non-empty `button-name`, valid `aria-pressed`).
Duplicate accessible names are not an error, and there is no label-in-name mismatch. No tool
rasterises the heart glyph, and none reasons that one heart means "private save" while the other
means "public like," or that the shared name "heart" describes the picture rather than either
purpose. Detecting that the identical icon+name fails to disambiguate two consequential actions —
including a privacy-relevant one — requires a human comparing the two controls' real behaviours.

## Citation
> **Reference:** WCAG 2.2 Understanding — Headings and Labels (`wcag-understanding/headings-and-labels.html`)
>
> **Quote (verbatim):** "Note that the same image can be interpreted differently in different contexts. However, it can still be considered descriptive if its use is commonly understood in each context."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.4.6, Test 5.B (`refs/trusted-tester/sc-2.4.6-headings-and-labels.md`)
>
> **Quote (verbatim):** "Each visual button label is sufficiently clear and descriptive, so users know its function."
