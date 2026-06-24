# case-02 — 20px (15pt) NORMAL booking headline over a sky gradient: not large-scale, fails 4.5:1 at the deep-blue end

## Scenario
Coastline Ferries' booking page has a hero header with a left-to-right "sky" gradient running
from pale `#d8e6f0` to a saturated harbour blue `#6f93ad`. The booking headline "Reserve your
summer crossing — Mainland to Harris" is brand slate `#2f4a5e`, set at **20px / weight 400**.
20px = **15.0pt** by the UA metric, and 15pt at normal weight is **not** large-scale (the
boundary is 18pt / 24px), so the **4.5:1** threshold applies. Against the gradient the contrast
slides from ~7.3:1 over the pale left end down to **~2.85:1** over the deep right end; over the
right third of the headline the worst-case background pixels are well under 4.5:1. **FAILS**.

## Attribute tuple + developer persona
- **content-domain:** travel / ferry ticketing
- **UI-component/pattern:** hero booking headline over a decorative gradient banner
- **host-language construct:** `<h1>` + `<p class="sub">` with `color:#2f4a5e; font-size:20px; font-weight:400` over `linear-gradient(90deg,...)`
- **locale/i18n:** en-GB
- **failure-mechanism:** worst-case background-pixel selection across a gradient, combined with a
  size classification (20px normal = 15pt = NOT large-scale) that forces the stricter 4.5:1 limit
- **developer persona:** A marketer who liked how the slate headline "popped" against the pale
  left of the gradient where they previewed it, and assumed a 20px headline was "big enough" to
  be treated as large text. Neither holds: the headline runs into the dark blue end where contrast
  collapses, and 20px normal is below the large-scale boundary.

## Element / selector carrying the issue
- FAILS: `h1` and `p.sub` — `#2f4a5e` at 20px / weight 400 over the sky gradient. 15.0pt normal →
  not large-scale → 4.5:1 required. Worst-case bg (`#84a6bf`/`#6f93ad`) gives 3.62:1 → 2.85:1 < 4.5:1.
- Controls: `main .body p` and the table are dark text on white, above 4.5:1.

## Exact accessibility mechanism
Per F83 and Trusted Tester 13.C, where the background varies the tester samples the
**least-contrast** background pixel adjacent to the letters. Here that is the deep-blue right end,
where slate-on-blue falls below 3:1. The reader with low vision loses the right-hand words of the
headline entirely. The 3:1 relaxation would rescue some of that band — but only if the text were
large-scale, and 20px / weight 400 = 15pt is below the 18pt boundary, so 4.5:1 is the governing
threshold and the failure is unambiguous.

## Expected outcome
**failed** — SC 1.4.3. Normal-size text (15pt) over the dark portion of the gradient falls below
the required 4.5:1 (down to ~2.85:1 at the worst-case background pixel).

## Why automated tools miss it
Verified empirically: **axe-core 4.10.3 returns 0 violations and marks the headline `incomplete`**
with the message "Element's background color could not be determined due to a background gradient"
(contrastRatio 0). axe cannot pick a background pixel across a gradient, so it abstains and emits
no violation — the page looks clean on a scan. A human must (1) sample the worst-case (lightest-
contrast) background region behind the letters — the deep-blue right end — and obtain ~2.85:1, and
(2) classify the size: 20px / weight 400 = 15.0pt, which is below the 18pt large-scale boundary,
so 4.5:1 (not the relaxed 3:1) applies. Only the combination of worst-case pixel sampling and the
size classification yields the FAIL; neither is something the scanner attempts.

## Citation
> **Reference:** WCAG Technique F83 — Failure due to using background images that do not provide
> sufficient contrast with foreground text (`wcag-techniques/failures/F83.html`)
>
> **Quote (verbatim):** "For pictures, this means that there would need to be sufficient contrast
> between the text and those parts of the image that are most like the text and behind the text."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "Select the **Background** color-dropper, click a pixel in the background
> close to the text. If the background is varied, choose a pixel that provides the **least contrast**."
>
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "The ratio between sizes in points and CSS pixels is `1pt = 1.333px`,
> therefore `14pt` and `18pt` are equivalent to approximately `18.5px` and `24px`."
