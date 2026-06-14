# BuzzFeed evaluation notes

## Collector / driver problems

- **el5, el6 shots blank**: Both `time` elements are deep in the page (y≈6629 and y≈14445). Appearance shots captured blank white regions — scroll mismatch between element position and screenshot crop. Static data (contrast, role) relied on from collect.json.
- **el8, el10, el12, el16 shots blank**: Same scroll-mismatch issue for elements far down the page. File sizes 143–317 bytes indicate near-blank PNG. Computed styles from collect.json used for contrast verdicts.
- **el9 diffPct=0 but indicatorPresent=true (driver contradiction)**: Driver set `indicatorPresent:true` via computedOutline fallback ('auto 1px') despite real-tab-diff returning 0 and both shot files being byte-identical (5790 bytes each). The crop captured the emoji reactions strip rather than the image link area. Overrode to REPRODUCED with reasoning noted in results.json.
- **el11 shots blank (200 bytes)**: Emoji Reactions button at y≈14848. Appearance and focus shots are near-blank. Focus visibility verdict marked PARTIAL on that basis.
- **el14 shot near-blank (172 bytes)**: OneTrust accordion button is only 16×6px — too small to produce a meaningful screenshot crop.
- **el15/el16/el18 shots byte-identical**: OneTrust consent panel buttons capture the bokeh celebrity photo background rather than the button itself. diffPct=0 and byte-identical files confirm zero pixel change; verdicts set to REPRODUCED (no visible focus change) with this evidence.
- **el7 focusShot null (method:computed-only)**: Driver could not capture focus screenshot because element was off-screen during the focus diff procedure. PARTIAL verdict applied.
- **el3 srWalk.targetSpeech mismatch**: srWalk positioned on the parent `<a>` link (xpath …a[2]) rather than the sampled `<button>` child — expected behaviour when button is nested inside link and SR reads the outer link boundary first.
- **el11 modal.focusMovedIntoDialog:false despite focus landing in `<dialog>` tag**: Driver's modal check uses `role="dialog"` selector; the native `<dialog>` elements on the page have no `role` attribute set, so the check returns false even though focus did move into the dialog element. The focusMovedTo xpath includes `/dialog[1]/` confirming the destination. closedByEscapeOrButton and focusReturnedToTrigger remain definitively false (real failures).
- **el18 needsPixelContrast:false (collector error)**: The OneTrust link sits over a transparent/composited background (bokeh photo panel) but the collector did not flag needsPixelContrast. Contrast verdict left PARTIAL pending pixel sampling.
- **forms[] empty**: No `<form>` elements found by the driver on the page — the cookie consent controls use `<button>` elements without a wrapping `<form>`, so no error-on-submit probe was executed. forms-instructions-errors verdict for el17 (cookie search input) based on static label check only.

## Snapshot fidelity notes

- The page uses Next.js / React with many dynamically injected elements. Collect.json was reused from a prior run (collectedAt:null). Page content appears fully hydrated in the driver run (tabWalk.count:50, drive.json vsr:true).
- All 50+ instances of the `<ul role="button" aria-controls="dialog">` Emoji Reactions pattern share the same failures (aria-allowed-role, aria-valid-attr-value, label-content-name-mismatch, keyboard non-responsiveness). Only el11 was sampled; findings apply page-wide.
- The `meta http-equiv="refresh" content="3600"` causes a 1-hour page reload — this could interfere with long evaluation sessions but did not affect this run.
- `landmark-complementary-is-top-level` axe violation (not surfaced in element samples): multiple `<aside role="complementary">` elements for advertisements are nested inside `<header>` elements rather than being top-level landmarks. Not assigned to a sampled element; noted here.
- `aria-roledescription` axe violation: a `<div aria-roledescription="carousel">` and a slide `<div aria-roledescription="slide">` — the carousel container div has no semantic role (generic), making aria-roledescription invalid per spec. Not sampled as an element; noted here.
