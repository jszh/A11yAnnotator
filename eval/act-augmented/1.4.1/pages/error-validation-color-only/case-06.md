# case-06 — TRUE-NEGATIVE: invalid fields get red border PLUS inline message AND warning icon (PASSES)

## Scenario
A festival-ticket payment form in its **post-submit error state** — the same situation as the failing cases, built correctly. Two fields failed ("Name on card" empty, "Expiry" in the past). Each invalid field gets a red border **and**, directly below it, a visible inline **error message in text** ("Error: enter the name as printed on the card." / "Error: this card has expired…") **and** a **warning icon** (an SVG triangle with an exclamation shape). The valid fields (card number, CVC) have a plain gray border and no message. The error meaning is conveyed by three non-color channels — the word "Error" + descriptive text, the icon shape, and position under the field — so the red border is decoration on top of a sufficient cue. Included as a boundary case to sharpen the aspect: red-on-error is fine when a non-color visible cue exists.

## Attribute tuple
- **content-domain:** events / ticketing checkout (card payment)
- **UI-component / pattern:** payment form with per-field inline error messages + icon
- **host-language construct:** `input.invalid` (red border), each paired with a `<p class="err">` containing text + an `aria-hidden` SVG icon; `aria-describedby` links field to message
- **locale / i18n:** en-US, USD
- **failure-mechanism:** none — this is the G14/G205 sufficient pattern (information also available in text + icon), the explicit escape from F81

## Developer persona
A payments team that takes accessibility seriously built the error pattern from a design system whose error component bundles border + icon + message as one unit, so a developer cannot ship the red border without the accompanying text and icon. The result conveys errors through multiple non-color channels by construction.

## Element / selector carrying the issue (here: the cue that makes it PASS)
`#name.invalid` + `#name-err` and `#exp.invalid` + `#exp-err` — each invalid input is paired with a visible text message and a warning-triangle icon, so error identity does not rely on the red border's hue.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Sighted, full-color user:** red border + icon + message — obvious which fields failed and why.
- **Sighted color-blind / low-vision user / grayscale:** remove all color and the warning **triangle shape** is still visible and the message text ("Error: this card has expired…") still reads — the error identity survives without hue. Passes the grayscale test (the canonical detection method) because non-color cues remain.
- **Screen-reader user:** `aria-describedby` ties each message to its field, and `aria-invalid="true"` flags the state, so the descriptive error is announced — satisfying the parallel 3.3.1/4.1.2 requirements too. (1.4.1 is satisfied by the *visible* text+icon regardless.)

## Expected ACT-style outcome
**passed** (SC 1.4.1 — G14/G205: the error information is available in text and via a non-color icon, not by color alone; the red border is supplementary).

## Why automated tools miss it (here: agree, but for shallow reasons)
Automated tools also pass this page — but only because they see labeled inputs, describedby links, and contrast-passing text; they cannot actually verify that the *non-color* cue is sufficient for a color-blind user. Their pass is coincidentally correct. The human judgment is the same as in the failing cases (does a non-color visible cue exist?), and here the answer is yes — which a tool cannot affirmatively establish, only fail to contradict.

## Citation
> "The objective of this technique is to combine color and text or character cues to convey information. … The text cue must be included as part of the programmatically determinable name for the control."
— wcag-techniques/general/G205.html (Description) — text/character cue accompanying color, as here.

> "The objective of this technique is to ensure that when color differences are used to convey information, such as required form fields, the information conveyed by the color differences are also conveyed explicitly in text."
— wcag-techniques/general/G14.html (Description)

> "If content is conveyed through the use of colors that differ not only in their hue, but that also have a significant difference in lightness, then this counts as an additional visual distinction…"
— wcag-understanding/use-of-color.html (Intent, note) — not even needed here, because an explicit text+icon cue is present.
