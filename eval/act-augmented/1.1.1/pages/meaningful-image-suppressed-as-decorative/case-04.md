# case-04 — Dosing pictogram aria-hidden, with a partial-restatement caption trap

## Scenario
A NorthBay Pharmacy patient-portal prescription-detail page for **Warfarin 5 mg** (an
anticoagulant — a high-alert medication where dosing errors are dangerous). The page lists
prescriber, Rx number, quantity, and refills as text. The **dosing regimen** is conveyed by
a pictogram, an inline `<svg>` with sun/noon/moon glyphs and bold counts: **Morning 2
tablets, Midday 1 tablet, Night 1 tablet**, plus two warning glyphs — **"TAKE WITH FOOD"**
and **"DO NOT crush — swallow whole."** The whole `<svg>` carries `aria-hidden="true"`,
which removes the element **and its entire subtree** (every `<text>` node) from the
accessibility tree.

The trap: the visible caption beneath the picture restates the regimen only **partially** —
"Take your morning and midday doses as shown above. Do not skip doses." It silently omits
the actual tablet counts, the **night dose entirely**, and **both safety warnings**. A
sighted patient reads the complete regimen; a screen-reader user receives a plausible-sounding
but dangerously incomplete instruction and never learns how many tablets, that there is a
night dose, that the drug must be taken with food, or that it must not be crushed.

## Attribute tuple
- **content-domain:** healthcare / pharmacy patient portal (high-alert medication, safety-critical)
- **UI-component/pattern:** medication dosing-schedule pictogram with caption
- **host-language construct:** inline `<svg aria-hidden="true">` containing `<text>` dose counts + warning glyphs
- **locale/i18n:** en (US)
- **failure-mechanism:** informative graphic suppressed from AT via `aria-hidden="true"`, paired with a caption that restates only PART of the content (counts, night dose, and both warnings exist only in the hidden picture)

## Developer persona
A health-IT vendor's developer integrated a third-party "dose pictogram" component that
returns a self-contained SVG. To stop the screen reader from announcing the SVG's loose
`<text>` fragments as a disconnected word-soup ("Morning 2 tablets Midday 1 tablet Night…"),
they set `aria-hidden="true"` on the SVG wrapper — a reflex carried over from hiding
decorative chrome. They then hand-wrote the "Take your morning and midday doses as shown
above" caption, assuming a sentence that mentions "as shown" satisfied the requirement —
never noticing it names no counts, drops the night dose, and omits the with-food and
do-not-crush warnings that, for AT users, now exist nowhere.

## Element / selector carrying the issue
`.schedule svg[aria-hidden="true"]` (contains the dose-count `<text>` cells and the two
safety-warning glyphs/labels)

## Exact accessibility mechanism (what AT experiences, why it fails)
Unlike `role="presentation"`/`role="none"` (which removes only the element's *own* implicit
semantics and leaves descendants exposed), `aria-hidden="true"` removes the element **and its
entire subtree** from the accessibility tree. Browser verification (Chromium AX tree via
Puppeteer, `interestingOnly:false`) confirms the SVG and all its `<text>` nodes are absent:
the tree exposes the drug name, the metadata rows, the heading "Dosing schedule," then only
the caption *"Take your morning and midday doses as shown above. Do not skip doses."* — no
counts, no night dose, no "with food," no "do not crush." The pictogram conveys information
(the full regimen and the safety warnings) and is the **only** means of conveying the
omitted parts, so SC 1.1.1 requires a text alternative carrying that information. A partial
caption does not discharge it; suppressing safety-critical dosing detail behind
`aria-hidden` is a contextual F38-type failure of the highest consequence.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`aria-hidden="true"` on a graphic is valid, internally consistent markup, and ACT
**46ca7f** ("element marked decorative is not exposed") and **e88epe** ("image not in the
accessibility tree is decorative") PASS it by construction. Crucially, the page also has real
caption **text**, so even a naïve "image carries text that is missing from the page"
heuristic is defeated — text *is* present; it is just incomplete. No automated tool OCRs the
pictogram to recover "2 tablets / 1 tablet / 1 tablet / with food / do not crush," none can
compare those values against the caption to notice the counts, the night dose, and both
warnings are absent, and none can weigh that the omitted content is high-alert dosing.
axe/WAVE/Lighthouse see an intentionally-hidden graphic and a captioned schedule and report
nothing. Catching this requires reading the picture, reading the partial caption, and
comparing them field-by-field to find the safety-critical gaps — a visual + contextual human
judgment.

## Citation
> **WCAG 2.2 Understanding Non-text Content, Additional information — non-text content not covered by another situation:**
> "For non-text content that is not covered by one of the other situations listed below, such as charts, diagrams, audio recordings, pictures, and animations, text alternatives can make the same information available in a form that can be rendered through any modality (for example, visual, auditory or tactile)."

(Verbatim from `wcag-understanding/non-text-content.html`. The dosing diagram is exactly such
content — a picture/diagram — and the text alternative must make **the same information**
available; a caption that omits the counts, the night dose, and both warnings does not make
the same information available, so SC 1.1.1 is not met.)

> **Trusted Tester v5.1.3, Test 7.B — Decorative image, Evaluate Results (condition 1):**
> "The image is **NOT** the only means of conveying important information."

(Verbatim from `refs/trusted-tester/sc-1.1.1-non-text-content.md`. Test 7.B passes only when
this is true. Here the picture IS the only means of conveying the tablet counts, the night
dose, and the with-food / do-not-crush warnings — the caption restates none of them — so
condition 1 of 7.B is violated and the "decorative" classification fails.)
