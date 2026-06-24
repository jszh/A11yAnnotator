# case-06 — BOUNDARY (passed): mute toggle + caption-language refresh keep their names in sync

## Scenario
A field-school video lesson player (Tidewater Field School). This is the SAME component class
as the failing cases — named, interactive toggles whose visual content swaps on click — but
built CORRECTLY. Two controls:
1. A mute/unmute `<button>`: the glyph's sound-waves hide/show AND its `aria-label` is
   rewritten ("Mute audio"↔"Unmute audio") on every click.
2. A caption-language refresh `<button>` wrapping a flag `<img>`: each click regenerates the
   flag `src` AND its `alt` ("Captions: English"→"Captions: Español"→...) together, and swaps
   the visible caption text.

## Attribute tuple
- **content-domain:** higher-ed / field-school video lesson
- **UI-component/pattern:** media mute toggle + caption-language refresh control
- **host-language construct:** `aria-label` (toggle) and `<img alt>` (refresh) both rewritten in lockstep with the swapped content
- **locale/i18n:** multilingual captions (en/es/fr), cycled at runtime
- **failure-mechanism:** NONE — included as the sharpening boundary; name tracks content, so F20 does not apply

## Developer persona
A developer who read the ARIA APG button pattern and treats the accessible name as STATE,
not a write-once template attribute. Every handler that changes what a control shows ALSO
rewrites its name, so name and rendered content can never disagree.

## Element / selectors carrying the (correct) behavior
`button#muteBtn[aria-label]` — rewritten on toggle; `img#flagImg[alt]` — regenerated with
`src` on each language cycle.

## Exact accessibility mechanism
After muting, the glyph loses its sound-waves AND the name becomes "Unmute audio", so AT,
braille, and voice-control all describe the action the control now performs. After cycling
the caption language, the flag picture and its `alt` change together, so the text alternative
always substitutes for the rendered flag. No F20 condition arises: the text alternative
remains usable in place of the non-text content after every change.

Verified with Puppeteer: clicking `#muteBtn` changed the wave glyph display (inline→none) AND
the name (Mute→Unmute); clicking `#langBtn` changed `#flagImg` `alt` (English→Español) AND
its `src` together.

## Expected ACT-style outcome
**passed** (4.1.2).

## Why this is the sharpening boundary (and why tools can't use it as the discriminator)
A static one-shot scan cannot tell case-06 (pass) apart from case-02 (fail): at every single
instant BOTH pages present a non-empty, validly named toggle, so axe/WAVE/Lighthouse report
"pass" for both. The only thing that distinguishes correct from F20 is whether the name
TRACKED the content across the state change — a temporal comparison that requires triggering
the interaction and re-reading the name. This case proves the aspect is about temporal
correctness of the name, not its mere presence.

## Citation
> **WCAG Technique F20, Tests — Expected Results:** "If check #1 is true then the text
> alternative is not up to date with current item, this failure condition applies, and content
> fails these Success Criteria." (Here check #1 is false — the text alternative IS up to date
> with the current item — so the failure condition does not apply and the content passes.)
> — `wcag-techniques/failures/F20.html`
