# Evaluation Notes — Doomersion_Learn_languages_by_doomscrolling

## Collector / Driver

- No collector or driver errors; `problems: []` in both collect.json and drive.json.
- `drive.json vsr: true` — VSR was active.
- Tab walk found only 2 stops (the two store-badge links). This is correct — no other focusable elements exist on the page.

## Snapshot Fidelity

- Video element (el11): The `<video autoplay loop muted>` could not load `doomlingopromo2.mp4` from the saved page archive. Shot el11.png shows a black rectangle (no video playing). This means:
  - The `axName` reported as `"Unable to play media."` is the browser fallback message, not a real author-provided name.
  - Behavioral video playback (2.2.2 pause control) was confirmed via static attribute analysis (`autoplay`, `controls=false`, no sibling pause button) rather than live observation.
  - SR walk for video element (xpath el10 in drive) resolves to `"end of main"` — the video is not announced by SR as a video object in the walk, consistent with it having no accessible role/name in the AX tree.

## Ambiguities

- **Footer landmark**: Footer is nested inside `<main>` (`footerParent=MAIN`). Per HTML spec, a `<footer>` inside a sectioning element gets role `sectionfooter`, not `contentinfo`. This is a genuine structural issue (no page-level contentinfo landmark) but may be intentional for a single-page landing.
- **SVG icons in store badges**: Both `<svg>` elements inside the store links have no `aria-hidden` attribute. In SR walk they appear as `"graphics-document"` nodes. This is a Chrome/guidepup SR artifact — in real VoiceOver/NVDA these would likely be skipped as part of the named link. Treated as not a defect (parent link name is complete).
- **Decorative floating text spans** (span[1]–span[N] with words like 谢谢, Hej, Z, 你好, 안녕): These animated floating greeting words appear in SR walk (e.g. `speech: "谢谢"`, `speech: "Hej"`) as individual stops. They appear to be decorative animation elements. They are not sampled elements in collect.json, so they were not individually evaluated. Their SR exposure as plain text nodes (not `aria-hidden`) could be confusing but they do not carry role/interactive state, so no 4.1.2 defect. Could be noted as a minor SR noise issue.
- **Contrast of body text (26,26,26 on white)**: Effective background for `p.tagline` and `h1` resolves to white (`rgb(255,255,255)`) via body — contrast 17.4:1. No issue.

## Tool Behavior

- `verify-finding.js --eval` with arrow functions caused a parse error ("missing ) after argument list") on this engine — switched to `function` declarations. No data loss.
- `drive.json forms: []` — no forms on page, confirmed.
