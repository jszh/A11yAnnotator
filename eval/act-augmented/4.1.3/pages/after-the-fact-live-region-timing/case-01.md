# case-01 — Confirmation injected via innerHTML that already contains role="status" (city recycling-bin request form)

## Scenario
A City of Brookhaven Public Works form lets residents request a free curbside recycling cart. On submit the
JavaScript runs `resultArea.innerHTML = '<div class="confirm" role="status">Your recycling cart request was
received…</div>'`, replacing an inert empty `<div id="result-area">` with a fully-formed success banner. The
**resting DOM after submit is a textbook-correct live region**: a `<div role="status">` with valid green-banner
styling and a complete confirmation message including a reference number. A static scan of that end state passes.
But the page had **no live region of any kind at load** — the `role="status"` attribute and the text arrived in
the same `innerHTML` write, so most screen readers never register the region and announce nothing. The sighted
user sees the green banner; the screen-reader user is left staring at a vanished form with no feedback and may
re-submit.

## Attribute tuple
- **content-domain:** government / civic services portal (municipal sanitation request)
- **UI-component/pattern:** same-page AJAX-style form confirmation banner
- **host-language construct:** `element.innerHTML = '<div role="status">…</div>'` (role born inside the markup string)
- **locale/i18n:** en
- **failure-mechanism:** F103 timing limb — role set *with* (not *before*) the dynamic content

## Developer persona
A junior developer at the city's web contractor, working to a fixed go-live date, copied the ubiquitous
"inject your success message" snippet from a tutorial that builds the banner as an HTML string containing
`role="status"`. It rendered exactly as the mockup showed, sighted QA confirmed "the green banner appears,"
and it shipped. Nobody asked whether the live region existed *before* the text, and no screen reader was run
against the submit flow.

## Element / selector carrying the issue
`#result-area > div.confirm[role="status"]` — created by the submit handler. The temporal marker
`data-region-born-with-content="true"` is set on it. The failure is the *absence* of any
`[role="status"], [role="alert"], [aria-live]` element in the page at load time (the `#result-area` wrapper is
a plain `<div>`).

## Exact accessibility mechanism (what AT experiences, why it fails)
Live-region announcements depend on the assistive technology having *registered* the region and then observing a
*mutation* of its contents. When the container element itself is inserted already carrying both its `role="status"`
(implicit `aria-live="polite"`) and its text in one operation, there is no "empty registered region → content
added" transition for the AT to detect. In NVDA, JAWS and VoiceOver this commonly results in **silence**: the
confirmation is never spoken. The screen-reader user, who also just lost the form (it was hidden), has no
indication the request succeeded — exactly the harm SC 4.1.3 exists to prevent. The fix is ARIA19/ARIA22 step 1:
ship an empty `<div role="status">` in the markup at load and write only `textContent` into it on submit.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
axe-core, WAVE and Lighthouse evaluate a single DOM snapshot. After submit that snapshot contains a valid
`<div role="status">` with non-empty text and adequate contrast — nothing is structurally wrong, so every rule
passes. These tools have no representation of *when* the role attribute came into existence relative to the text;
they cannot tell a region that was empty-at-load-then-filled (announces) apart from a region born-with-its-content
(silent). Catching it requires reasoning about the order of DOM operations in the submit handler — or observing
the actual AT silence — neither of which a static checker performs.

## Citation
> **WCAG Technique F103, `wcag-techniques/failures/F103.html` (Description):**
> "The absence of all of these techniques predicts a failure for the status message be announced to the user.
> Additionally, if the role or property is not set *before* the dynamic content is added, this also predicts a
> failure."

> **WCAG Technique ARIA19, `wcag-techniques/aria/ARIA19.html` (Tests, Procedure step 1):**
> "Determine that an empty error container with `role=alert` or `aria-live=assertive` attribute is present in the
> DOM (Document Object Model). at page load."
