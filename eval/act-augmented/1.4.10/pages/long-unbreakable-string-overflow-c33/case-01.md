# case-01 — Help-center reset-link article shows a 180-char raw URL as link text with no overflow-wrap

## Scenario
The Northwind Help Center has a support article reassuring users what a genuine password-reset
link looks like. To prove authenticity, the author pastes the **complete** reset URL — domain,
campaign params, and a long opaque JWT-style one-time token — as the visible text of an inline
`<a>`. The whole page is fluid (one fluid column, `max-width:760px`, fluid padding) and every
paragraph reflows beautifully at 320 CSS px. But the one link is the full raw URL, and the
opaque token segment has no slash/hyphen/ampersand for hundreds of characters, so the browser
finds no break opportunity. At 320px that single link is 1168px wide and forces a page-level
horizontal scrollbar (probed: document width 1204px vs 320px viewport; neutralizing only
`a.verify-link` returns the page to exactly 320px — it is the sole offender).

## Attribute tuple
- **Content domain:** help center / customer support (account & sign-in)
- **UI component / pattern:** knowledge-base article with an inline hyperlink rendered as its own raw URL
- **Host-language construct:** `<a>` whose link **text** is the full URL, inside fluid body prose; no `overflow-wrap`/`word-break` on links
- **Locale / i18n:** en
- **Failure mechanism:** long unbreakable string (opaque token in a URL) with break opportunities absent and no CSS escape → horizontal overflow at 320px

## Developer persona
A support-content writer (not an engineer) authored the article in the CMS rich-text editor.
A security colleague told them "show customers the exact link so they can spot phishing," so
they pasted the literal reset URL from a test email as both the link target and the visible
text. The CMS theme styles links with a brand color but never sets `overflow-wrap`, because no
one anticipated a 180-character link living in body copy. At desktop width it looked fine; the
overflow only appears once a low-vision user zooms to 400% (≈320px viewport).

## Element / selector carrying the issue
`a.verify-link` inside `.callout` — its text content is the full
`https://account.northwind.example/auth/reset?...&token=eyJ...` string.

## Exact accessibility mechanism
A low-vision user who zooms the page to 400% (or a phone user at a 320px viewport) sees every
paragraph reflow into the narrow column, but this one link shoots off the right edge. They must
now scroll horizontally back and forth to read the link — and, because a horizontal scrollbar
appears for the **whole page**, they cannot tell whether other content also lies off-screen.
This is precisely the two-dimensional-scrolling burden Reflow exists to prevent: enlarged
content must reflow so the user only scrolls in the reading direction. A screen-reader user is
unaffected (the link is announced fine), which is why this is a low-vision / magnification
defect, not a name/role/value defect. The fix is one CSS declaration (`overflow-wrap:anywhere`
on the link, per Technique C33) — or, better, using human-readable link text instead of the
raw URL.

## Expected ACT-style outcome
**failed** (SC 1.4.10). Non-excepted inline text content (a hyperlink) cannot be displayed at a
320 CSS px width without horizontal scrolling; no two-dimensional-layout exception applies to a
URL, and the string neither wraps nor is offered via an alternative.

## Why automated tools miss it
axe-core, WAVE and Lighthouse have **no rule that renders the page at 320px and measures string
overflow**. The only ACT rule mapped to 1.4.10 (`b4f0c3`) checks the viewport meta allows zoom —
and this page's `<meta name="viewport">` is perfectly fine, so that rule passes. The URL is a
valid, non-empty link with a correct `href` and accessible name, so link-name/empty-link rules
pass. A static heuristic could spot "this is a very long string in the markup," but it cannot
know whether it actually overflows (depends on font, container width, the surrounding fluid CSS)
nor whether the design already wraps it. Determining the horizontal scrollbar at 320px requires
visual measurement plus the judgment that a URL has no reflow exception — exactly what a human
tester does.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, Intent (`wcag-understanding/reflow.html`)
> "When lines of text extend beyond the edge of a viewport, users will be forced to scroll back-and-forth to read line by line. This can cause them to lose their place and can significantly increase both physical and cognitive effort."

**Reference:** WCAG Technique C33 — Allowing for Reflow with Long URLs and Strings of Text (`wcag-techniques/css/C33.html`)
> "Long sets of characters without a space, such as URLs shown as content, can break reflow when the page is zoomed. The objective of this technique is to present URLs without introducing a horizontal scroll bar at a width equivalent to 320 CSS pixels..."
