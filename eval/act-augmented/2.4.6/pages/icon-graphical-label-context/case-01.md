# case-01 — Document viewer: magnifying-glass button named "Search" that opens print preview

## Scenario
A PDF/document viewer ("Acme Logistics — Q3 Filing.pdf") has a top toolbar with zoom-out,
zoom-in, a magnifying-glass button, and a download button. The magnifying-glass button carries
`aria-label="Search"`, and a sighted user reading the loupe glyph expects it to search the
document text. But its click handler opens a **Print preview** dialog — there is no search
function on the page at all. The glyph and its accessible name agree with each other ("loupe =
Search") yet both misdescribe what the control actually does.

## Attribute tuple
- **content-domain:** legal/financial filing — document viewer
- **UI-component/pattern:** APG `toolbar` of icon-only buttons
- **host-language construct:** `<button aria-label="Search"><svg aria-hidden="true">…loupe…</svg></button>` + `showModal()`
- **locale/i18n:** en-US
- **failure-mechanism:** graphical label present and self-consistent (loupe + "Search") but the control's real function is print-preview — present-but-misleading icon label

## Developer persona
A product engineer cloned a generic "viewer toolbar" component from an internal design-system
sandbox. The sandbox shipped a magnifier button stubbed to `aria-label="Search"`. When this
viewer turned out to have no full-text index, the engineer repurposed that same button to launch
the print-preview flow (the quickest free slot on the bar) but never changed the glyph or the
label, because the a11y CI only asserted "every button has a name" — which still passed.

## Element / selector carrying the issue
- `button#searchBtn[aria-label="Search"]` — renders a magnifying-glass SVG; `onclick` calls `printDlg.showModal()`.

## Exact accessibility mechanism
The button is exposed with role `button` and accessible name "Search" (computed from
`aria-label`; the inner SVG is `aria-hidden="true"`). A screen-reader user hears "Search,
button" and a sighted user sees the universally-understood loupe — both are led to expect a
text-search affordance. Activating it instead opens a print-preview `<dialog>`. The label (whether
read as the glyph or as the announced string) does not describe the control's purpose, so the
descriptive limb of 2.4.6 fails for a graphical label. Name presence (4.1.2) is satisfied.

## Expected ACT-style outcome
**failed** (SC 2.4.6 Headings and Labels — label limb, TT 5.B). The accessible name exists, so a
name-presence rule passes; the label is simply not descriptive of the actual function.

## Why automated tools miss it
axe-core (`button-name`), WAVE, and Lighthouse only confirm the button has a non-empty accessible
name; "Search" is non-empty, so all pass. No automated checker renders the inline SVG to identify
it as a loupe, and none executes the click handler to discover the control opens print preview
rather than searching. Judging that a loupe-glyph button labelled "Search" misdescribes a
print-preview action is an inherently visual + behavioural + semantic human judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding — Headings and Labels (`wcag-understanding/headings-and-labels.html`)
>
> **Quote (verbatim):** "Note that the same image can be interpreted differently in different contexts. However, it can still be considered descriptive if its use is commonly understood in each context. For example, when accompanying a text field, a loupe or magnifying glass icon with text alternative of "Search" is commonly interpreted as indicating the field is for entering and submitting a search query."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.4.6, Test 5.B (`refs/trusted-tester/sc-2.4.6-headings-and-labels.md`)
>
> **Quote (verbatim):** "Each visual button label is sufficiently clear and descriptive, so users know its function."
