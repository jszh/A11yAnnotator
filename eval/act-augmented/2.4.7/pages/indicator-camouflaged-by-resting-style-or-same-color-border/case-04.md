# case-04 — Analytics chart toolbar: thin same-navy focus ring merged into an 8px same-navy resting border

## Scenario
A SaaS revenue-analytics dashboard has a chart-controls toolbar (Group by,
Compare, Annotate, Export CSV, Share). Every toolbar button has a permanent
`8px solid #1b2a4a` (brand navy) border for a "raised chip" look. The team *did*
author a real focus style — but it is a thin same-navy box-shadow ring
(`box-shadow:0 0 0 1px #1b2a4a`) drawn with no offset/blur, so its 1px spreads
flush against the OUTER edge of the already-thick navy border, in the identical
navy. There is no separating background channel between ring and border, and the
ring is thinner than the border, so the two merge: 1px of navy added to an 8px
navy frame is imperceptible. On Tab the focused button looks like the same navy
chip as its neighbours, so the focused control is not distinguishable.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component/pattern:** APG `toolbar` of native `<button>` controls
- **host-language construct:** `role="toolbar"` with `<button>`s; **author-supplied** (not UA) `:focus` box-shadow ring same hue as the resting border, drawn flush (no offset gap)
- **locale/i18n:** en-US
- **failure-mechanism:** F78 mode 3 — a focus indicator thinner than, and the same colour as, a thick border it is drawn against; here the ring is custom (not the UA default) and uses `box-shadow` with zero offset so no background gap separates it from the border

## Developer persona
A design-system engineer built the toolbar to match the product's navy brand
chrome and gave every button a chunky 8px navy border. Reviewers asked for an
explicit focus style (the team had been burned by `outline:none` before), so the
engineer added a 1px navy `box-shadow` `:focus` ring "to stay on brand,"
deliberately with no offset so it would "hug" the button cleanly. The PR passed
review and the automated a11y gate because a focus style was unmistakably present
in code — nobody keyboard-tested that a 1px navy ring flush against an 8px navy
border is invisible.

## Element / selector carrying the issue
`.toolbar button` — resting `border:8px solid #1b2a4a`. The
`.toolbar button:focus` rule sets `outline:none` and applies
`box-shadow:0 0 0 1px #1b2a4a` (offset 0, blur 0) in the identical navy, so the
1px ring spreads directly against the outer edge of the 8px navy border with no
background gap between them.

## Exact accessibility mechanism
On focus, a 1px navy box-shadow ring is spread flush against the button's outer
edge, so the computed style changes and a focused/unfocused diff is non-zero. But
the button already wears an 8px navy border; the ring is the exact same navy, is
thinner than the border, and abuts it with no separating background channel — so
the ring merges into the thicker same-hue frame and adds no perceptible change.
A keyboard user navigating the toolbar cannot tell which of the five buttons is
focused. Each `<button>` exposes role `button` and an accessible name correctly,
so AT speech is fine — the failure is purely the absence of a *distinguishable
visible focus* for sighted keyboard/low-vision users. This extends F78 mode 3
beyond the UA default ring to a same-colour *author-supplied* `box-shadow` ring
drawn against the border with no offset gap.

## Expected ACT-style outcome
**failed** (SC 2.4.7 Focus Visible). ACT oj04fd sees a non-zero focused/unfocused
diff and an author focus style, so oj04fd would *pass*; the same-hue-occlusion of
the custom ring against the thicker same-hue border is the uncovered gap.

## Why automated tools miss it
This is the hardest variant for tooling: there is a genuine author-supplied
`:focus` rule (so even a heuristic looking for missing focus styles finds one),
`outline:none` appears only as the focus rule's reset (replaced by a real
box-shadow ring, not a removal), and a focused/unfocused style diff is non-zero.
axe-core, WAVE and Lighthouse all pass. Determining that the navy ring is the
same hue as — and thinner than — the navy border it sits flush against, and is
therefore not perceptually distinguishing, requires a human to read the colours
in context and judge contrast, which no edge-pixel or computed-style rule does.

## Citation
> **Reference:** WCAG Technique F78 — Description (`wcag-techniques/failures/F78.html`)
>
> **Quote (verbatim):** "Other styling may make it difficult to see the focus
> indicator even though it is present, such as outlines that look the same as the
> focus outline, or thick borders that are the same color as the focus indicator
> so it cannot be seen against them."
>
> **Reference:** WCAG Understanding 2.4.7 Focus Visible — Benefits (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "This success criterion helps anyone who relies on the
> keyboard to operate the page, by letting them visually determine the component on
> which keyboard operations will interact at any point in time."
