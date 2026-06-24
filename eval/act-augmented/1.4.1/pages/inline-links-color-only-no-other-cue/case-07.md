# case-07 — TRUE-NEGATIVE (inapplicable): hyperlink styled identical to static text (no color differentiation)

## Scenario
A bank's "Acceptable Use Policy" legal page. Inside the clauses, three hyperlinks
(`.inline-ref`) are styled to look *exactly* like the neighboring static text: same color
`#202124`, same weight, no underline, no hover/focus change. Because there is **no** color
differentiation between the actionable link text and the adjacent static text, 1.4.1 does not
apply — color is not being used to convey the link, so there is nothing a color-blind user
loses relative to a sighted user. (It is arguably poor *usability* for everyone, but that is
not a 1.4.1 failure.) A clearly-styled blue underlined link in the footer is a distractor that
is plainly a link and not at issue.

## Attribute tuple
- **content-domain:** legal / banking terms & policy
- **UI-component/pattern:** numbered `<section class="clause">` legal clauses + a `<footer>` with one normal link
- **host-language construct:** static HTML5; inline links deliberately styled to be visually identical to body text
- **locale/i18n:** en-GB (banking, "30 days in advance")
- **failure-mechanism:** NONE — non-applicability boundary (no color is used to distinguish the link, so 1.4.1's "distinguish a visual element by color" precondition is not met)

## Developer persona
A bank's compliance team wanted legal cross-references to be present and clickable but *not*
visually emphasized (so the policy reads as a single sober block and links don't draw the eye
or imply marketing). Their dev set `.inline-ref { color:inherit; text-decoration:none }`
intentionally. The links are discoverable by keyboard/AT and by hovering, but visually they
are indistinguishable from prose — by design, with no color cue at all.

## Element / selector carrying the issue
`.legal .inline-ref` — `color:#202124; text-decoration:none; font-weight:400`, identical to
the surrounding body text. (The `footer a` blue link is a separate, clearly-styled link.)

## Exact accessibility mechanism
Since the link color equals the body-text color, there is *no* color difference between the
link and adjacent text for anyone — full-color, color-blind, or grayscale users all see the
same thing. 1.4.1 protects information conveyed *by color*; here color conveys nothing about
the link, so a color-blind user is at no disadvantage relative to a sighted user. The
Understanding note states this exact case "would not fail this success criterion, as there
would be no color differentiation between the actionable hyperlink text and the adjacent
static text." (Programmatic link-discoverability for AT is governed by other criteria such as
1.3.1/4.1.2, not 1.4.1.)

## Expected ACT-style outcome
**inapplicable** — color is not used to convey, indicate, prompt, or distinguish here, so the
1.4.1 precondition is not met for these links.

## Why automated tools miss it
A naive "colored link without underline = fail" heuristic would mis-flag this; conversely a
1.4.3 tool stays silent. Correctly classifying it as *inapplicable* requires recognizing that
link color equals body color (no color differentiation exists) and applying the Understanding
note's non-applicability rule — a semantic judgment distinguishing "color-only differentiation
that fails" from "no color differentiation at all, so out of scope." No scanner makes that
call; it guards against over-reporting.

## Citation
> **WCAG Understanding — Use of Color** (`wcag-understanding/use-of-color.html`):
> "This criterion does not apply to situations where color has not been used to convey
> information, indicate an action, prompt a response or distinguish a visual element. For
> instance, a hyperlink which has been styled to appear no different than neighboring static
> text would not fail this success criterion, as there would be no color differentiation
> between the actionable hyperlink text and the adjacent static text."
