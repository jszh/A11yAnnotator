# case-03 — fixed lower-band ad obscures the keyboard-focused in-article link (Focus-Not-Obscured overlap)

## Scenario
"A Short History of Western Music" runs a sponsored fixed-position ad across the lower band of
the page (a 180px-tall banner pinned to `bottom`, spanning nearly the full 320px width). The
article — the literal "Medieval Period of music" example from the WCAG Reflow Understanding doc
— reflows perfectly to a single column. But because the ad is `position: fixed`, when a keyboard
user tabs to the in-article hyperlink in the closing paragraph ("the medieval listening guide
and recommended recordings"), the browser scrolls that link into view toward the lower part of
the viewport — directly **under** the fixed ad. The focused link is obscured, and the ad's only
dismiss control (a tiny × that is the last focusable element on the page) is reachable only by
advancing focus past the obscured link.

## Attribute tuple
- **Content domain:** developer/editorial reference (music history)
- **UI component / pattern:** fixed-position sponsored ad over article body, with corner close button
- **Host-language construct:** `aside.ad { position: fixed; left/right/bottom; height: 180px; z-index: 60 }`
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** fixed author content obscures the element with keyboard focus, with the dismiss control reachable only after advancing focus past it

## Developer persona
The site monetises via a programmatic ad network whose tag injects a fixed, dismissible banner.
At full-window desktop the banner sits politely in a corner and never touches the prose. The
developer integrating the tag tested at desktop, where focused links never scroll into the ad's
zone, and never tabbed through the article at a zoomed-in viewport — so they never saw the ad
land on a focused link. The × close button was appended at the end of the ad markup (and thus
end of the DOM), making it last in tab order.

## Element / selector carrying the issue
`aside.ad` (`position: fixed; bottom: 8px; height: 180px; left/right: 10px`). The focus victim
is `a.inline` in the final paragraph; the dismiss control is `.ad .x` (last focusable element).

## Exact accessibility mechanism
A sighted mouse user can ignore or close the corner ad. A keyboard / low-vision user tabbing to
the "listening guide" link triggers the browser to scroll it into view; verified at 320×480, the
focused link renders at top=314–394 while the fixed ad occupies top=292 downward, overlapping the
link by ~20,800 px² with `document.elementFromPoint` at the link's centre returning the ad — i.e.
the focused element is fully obscured. The user sees a focus ring on nothing, or no focus at all,
and to dismiss the ad they must keep tabbing *forward* past the obscured link to reach the × —
the precise pattern the SC's Focus-Not-Obscured overlap forbids ("a way to dismiss... without
requiring the advancement of keyboard focus"). The ad also reduces reading space (70% of a 256px
viewport), compounding the Reflow harm.

## Expected ACT-style outcome
**failed** (SC 1.4.10, via its Focus Not Obscured overlap). Fixed author content obscures the
keyboard-focused link at the reflow viewport, and the dismiss path requires advancing focus past
the obscured element.

## Why automated tools miss it
The ad is well-formed: the × has `aria-label="Close advertisement"`, the CTA is a real link,
contrast is adequate, and zoom is allowed. axe/WAVE/Lighthouse do not tab through the page,
do not scroll focused elements into view, and have no rule that hit-tests whether a fixed
element covers the focused element or whether the dismiss control precedes or follows it in
focus order. Verified empirically (Puppeteer Tab + elementFromPoint): the focused link is
covered by the ad. Detecting this requires a human to keyboard-navigate at the narrow viewport
and *see* the focus disappear under the ad — the judgment the Understanding doc reserves for a
reviewer.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Focus Not Obscured (Minimum)" overlap, sticky-ad example (`wcag-understanding/reflow.html`)
> "However, when attempting to zoom in the page, the ads remain in their fixed position. They obscure not only the focusable elements of the page, providing no way to dismiss the ad without finding / keyboard navigating to its close button, but significantly reduce the available space for reading."

**Reference:** WCAG 2.2 Understanding — Reflow, sticky-ad figure caption (`wcag-understanding/reflow.html`)
> "The fixed position advertisement not only obstructs the hyperlink that has keyboard focus, but significantly limits the available space to read the content of the web page."

**Reference:** WCAG 2.2 Understanding — Reflow, Focus Not Obscured overlap (`wcag-understanding/reflow.html`)
> "in the case author created content does obscure content, there is a way for a user to dismiss the obscuring content without requiring the advancement of keyboard focus."
