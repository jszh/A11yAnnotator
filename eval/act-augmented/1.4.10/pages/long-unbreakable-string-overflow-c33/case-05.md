# case-05 — PASS control: order-tracking page shows the same long URL but with overflow-wrap:break-word

## Scenario
Greenhaus Living's order-tracking page is the **PASS boundary** for cases 01-04. It shows the
same kind of long opaque tracking URL as visible link text (domain + params + a long no-space
token), in the same kind of fluid single-column layout — but the link has
`overflow-wrap:break-word; word-break:break-word; overflow-wrap:anywhere` applied (the exact CSS
prescribed by Technique C33). At 320px the URL wraps cleanly inside the column and the page does
**not** scroll horizontally (probed: document width 320px = viewport, zero overflow). Nothing is
truncated; the full URL remains the link's accessible name.

## Attribute tuple
- **Content domain:** e-commerce / order tracking
- **UI component / pattern:** order-status timeline with a "live tracking link" shown as its full URL
- **Host-language construct:** `<a class="track" style="overflow-wrap:anywhere">` in fluid prose
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is the correctly-remediated counterpart; the C33 wrap is present

## Developer persona
A front-end developer who had previously been bitten by a long-link Reflow bug (the case-01
pattern) now reflexively adds `overflow-wrap:anywhere` to any element that may hold a URL or
token. They show the full link so customers can copy it to another device, but the wrap rule
means it never overflows at any width. This is the "did it right" control that proves the failing
pages fail because of the missing/suppressed wrap, not because long URLs are inherently
forbidden.

## Element / selector carrying the issue
`a.track` — same long-URL content as case-01, but with `overflow-wrap:break-word` /
`overflow-wrap:anywhere`, so it wraps within the 320px column. No issue.

## Exact accessibility mechanism
At 400% zoom / 320px, the long tracking URL wraps onto multiple lines inside the fluid column, so
the low-vision user reads it by scrolling only vertically (the reading direction) — exactly what
Reflow requires. No page-level horizontal scrollbar appears, so the user is not misled into
hunting for off-screen content. The full value is present and selectable; nothing is hidden or
truncated. This page exists so the evaluator must distinguish a *wrapped* long string (pass) from
a *non-wrapping* one (cases 01-04, fail) — the markup looks almost identical; only the wrap CSS
and the rendered result differ.

## Expected ACT-style outcome
**passed** (SC 1.4.10). All non-excepted text content, including the long URL, reflows within a
320 CSS px width without horizontal scrolling.

## Why automated tools miss it
Symmetry argument: an automated tool that cannot detect the *failure* in cases 01-04 (because it
does not render at 320px and measure overflow) equally cannot certify this *pass*. ACT `b4f0c3`
passes here for the same trivial reason it passes on the failing pages (zoom is allowed), so the
ACT result is identical across pass and fail — it carries no signal about the actual reflow
behavior. Confirming this page genuinely passes (the URL wraps, no horizontal scroll) requires
rendering at 320px and observing the wrapped result, i.e. the same human/visual step the failing
cases need.

## Citation
**Reference:** WCAG Technique C33 — Examples → Breaking long URLs (`wcag-techniques/css/C33.html`)
> "Using the following CSS will cause long URLs to break at appropriate places (hyphens, forward slashes, etc.) and within words without causing reflow."

**Reference:** WCAG 2.2 Understanding — Reflow, In brief (`wcag-understanding/reflow.html`)
> "What to do: Make lines of text reflow within the viewport."
