# case-03 — 21pt bold festival title (genuinely large-scale) over a sunset gradient: still FAILS because the bright end drops below even 3:1

## Scenario
The Harvest Lights Festival banner sets the festival name in **white**, **28px / weight 700**,
over a warm left-to-right "sunset" gradient that brightens from deep umber `#6b3f2a` to pale
straw `#c98f55`/`#a89a7a` at the right. 28px = **21.0pt bold** — comfortably over the 14pt-bold
and 18pt boundaries, so this **is** large-scale and only **3:1** is required. The trap: being
large-scale lowers the bar to 3:1, it does not remove it. Over the pale straw stops at the right
end, white-on-`#c98f55` = **2.78:1** and white-on-`#a89a7a` = **2.77:1** — **below 3:1**. So even
at the relaxed ratio the right portion of the title fails. **FAILS**.

## Attribute tuple + developer persona
- **content-domain:** events / arts festival promotion
- **UI-component/pattern:** large festival title (white) over a decorative warm gradient hero
- **host-language construct:** `<h1>` with `color:#fff; font-size:28px; font-weight:700` over `linear-gradient(100deg,...)`
- **locale/i18n:** en-GB
- **failure-mechanism:** worst-case background-pixel selection where the gradient's *bright* stops
  reduce white-on-light below even the relaxed 3:1 — large-scale is necessary but not sufficient
- **developer persona:** A festival volunteer who knew "large headings only need 3:1" and treated
  that as a free pass for the big white title, never checking the bright right end of the gradient
  where the white text washes out below 3:1.

## Element / selector carrying the issue
- FAILS: `h1` — white, 28px / 700 (= 21.0pt bold, large-scale → 3:1 applies), over the sunset
  gradient. Worst-case bg at the bright straw end gives white-on-`#c98f55` = 2.78:1 < 3:1.
- Note: `.dates` is 18px / 700 = 13.5pt bold = NOT large-scale (axe itself reports "13.5pt (18px)
  ... expected 4.5:1"), so it would need 4.5:1; it too fails over the bright end. The headline is
  the primary failing element.
- Controls: `main .content p` is dark on `#fffdf8`, above 4.5:1.

## Exact accessibility mechanism
This is the inverse trap of a large-text pass: the analyst correctly identifies the title as
large-scale and is tempted to wave it through at 3:1, but the worst-case background pixel
(F83 / TT 13.C: choose the least-contrast region behind the letters) is the bright straw, where
white text drops to ~2.78:1. The relaxed 3:1 ratio is the floor for large text; below it, even a
21pt title is unreadable for the low-vision user as the strokes blend into the light background.

## Expected outcome
**failed** — SC 1.4.3. The title is large-scale (3:1 applies), but at the bright end of the
gradient the worst-case contrast (~2.78:1) is below even 3:1.

## Why automated tools miss it
Verified empirically: **axe-core 4.10.3 returns 0 violations and marks the title `incomplete`**
("background color could not be determined due to a background gradient", contrastRatio 0). axe
will not select a pixel across the gradient, so it abstains. The human judgment is two-layered and
deliberately counter-intuitive: first classify the title as large-scale (21pt bold → 3:1, which
invites a pass), then *still* sample the worst-case background region — the bright straw stops —
and find white-on-straw at ~2.78:1, below 3:1. A reviewer who stops at "it's large text, 3:1
applies, looks fine" reaches the wrong verdict; the correct AA outcome is FAIL because the relaxed
ratio is a floor, not an exemption, and the brightest part of the gradient breaches it.

## Citation
> **Reference:** WCAG Technique F83 (`wcag-techniques/failures/F83.html`)
>
> **Quote (verbatim):** "**Quickcheck:** First do a quick check to see if the contrast between the
> text and the area of the image that is darkest (for dark text) or lightest (for light text) meets
> or exceeds that required by the Success Criterion"
>
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Text that is larger and has wider character strokes is easier to read at
> lower contrast. The contrast requirement for larger text is therefore lower."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If the background is varied, choose a pixel that provides the **least contrast**."
