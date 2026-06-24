# case-05 — Operable label over album art (no solid background) beside a genuinely-disabled control

## Scenario
A Larkwave "Now playing" card. The player bar is overlaid directly on the album artwork (a
diagonal gradient standing in for a JPEG so the page renders from `file://`). It holds two
controls. **Shuffle** is a native `<button disabled>` — genuinely inert, removed from the tab
order, correctly **exempt** from 1.4.3. **Save to library** is fully operable (real `<button>`,
no `disabled`, no `aria-disabled`, live handler). Its **white** label is painted on the artwork:
over the dark top-left it reads ~16:1, but the art brightens toward the lower-right to a pale sand
tone, and where the label crosses that region white-on-`#e0cfa3`..`#e9d9b6` falls to ≈1.4–1.8:1 —
far below 4.5:1. Because the control is operable, 1.4.3 governs its label, and at its worst-case
region it **fails**. The whole verdict turns on (a) recognising Shuffle is truly inactive →
exempt, and (b) sampling the worst-case pixels behind the operable label — which no scanner can
do, because there is no single solid background color over the image.

## Attribute tuple
- **Content domain:** Media / music streaming — "Now playing" player card
- **UI component / pattern:** player control bar overlaid on album artwork; one genuinely-disabled native button + one operable text-label control over a background image
- **Host-language construct:** native `<button>` (operable, label over `background-image`) vs. native `<button disabled>` (inert); failing text has no solid background to compute
- **Locale / i18n:** en
- **Failure mechanism:** operable control's label rendered over a varying photographic/gradient background, dropping below 4.5:1 in the bright region — undetectable by tools (no solid bg) and adjacent to a correctly-exempt disabled control

## Developer persona
A media-app front-end dev placed the player controls directly over the cover art for a
"immersive, edge-to-edge" look, using plain white labels that "always look clean on art." They
tested only against dark covers, where white pops, and disabled Shuffle behind a Premium gate with
the native `disabled` attribute. They never checked a light-toned cover, where the same white
"Save to library" label washes out — and assumed their contrast scanner would have caught it if it
were a problem (it could not: the background is the artwork, so the tool returned no result).

## Element / selector carrying the issue
`#save.ctrl.save` — the operable "Save to library" button. Its white label, over the bright end
of the artwork, is the failing content. The exempt control is `#shuffle.ctrl.shuffle[disabled]`,
whose faint label is out of scope because the control is genuinely inactive.

## Exact accessibility mechanism
A screen reader announces "Shuffle (Premium only), dimmed, button" — genuinely inactive, so its
faint label is exempt. "Save to library, button" has **no** disabled state; clicking it runs the
handler (toast appears, `aria-pressed="true"` set), proving it is operable and therefore in scope
for 1.4.3. The label is white text laid on the album artwork, which varies from dark (top-left,
~16:1) to a pale sand tone (lower-right). Per Understanding 1.4.3, contrast must be judged from
the foreground/background actually presented; where the white label crosses the pale region the
ratio is ≈1.4–1.8:1, well under 4.5:1, so a low-vision user cannot read the active control's
label there. The verdict requires sampling the **least-contrast** region behind the operable
label — a manual eyedropper step — and confirming Shuffle is exempt because it is truly inert.

## Expected ACT-style outcome
**failed** (SC 1.4.3). An operable control's white label crosses a bright region of the
background artwork where its contrast drops to ≈1.4–1.8:1, below 4.5:1. The adjacent
genuinely-disabled Shuffle button is correctly exempt and is not the failure.

## Why automated tools miss it
The failing label sits over a background **image/gradient**, so there is no single solid
background color to compute against. axe-core does not flag it: its color-contrast rule returns
**incomplete** with "Element's background color could not be determined due to a background
gradient" (and the analogous message for background images); Lighthouse and WAVE behave the same.
The only deterministic contrast signal on the page — the disabled Shuffle button — is correctly
skipped as inactive, so the one text that fails is precisely the one no scanner can evaluate.
Detecting it requires a human to eyedropper the worst-case (brightest) pixels behind the white
label and compare against the 4.5:1 threshold — the Trusted Tester / Colour Contrast Analyser
"least contrast" procedure — and to confirm by activation that the control is operable, not inert.

## Citation
**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`)
> "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements. An inactive user interface component is visible but not currently operable."

**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`)
> "Because authors do not have control over user settings for font smoothing/anti-aliasing, when evaluating this Success Criterion, refer to the foreground and background colors obtained from the user agent, or the underlying markup and stylesheets, rather than the text as presented on screen."

**Reference:** Trusted Tester v5.1.3 — SC 1.4.3 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "Two distinct mechanisms: (a) selectable live text → ANDI auto-computes from CSS colors; (b) text on a background image / image-of-text → ANDI can't, so a human eyedroppers the least-contrast foreground & background pixels with CCA."
