# Evaluation Notes — Rubric_Domain_Specific_Data_Infrastructure_for_A

## Screenshot fidelity
- Most element shots (el1–el8, el13–el18, el20–el21) are very small or near-blank. The noscript render produces minimal paint for header nav elements (crops are ~100×20px with almost no visible content). El12 ("Life Sciences" chip label) was the only non-blank mid-page shot.
- No shots exist for el9, el10, el11, el13, el14, el15, el18, el21 — these were off-screen (appearanceOffScreen:true) or simply not captured.
- All focus shots (el2_focus through el6_focus, el16_focus) are the same near-blank crop — cannot visually distinguish a focus ring vs unfocused state from the images. Focus-visibility verdicts for in-viewport header links rely on computed outline + tabWalk outlineOrShadow:true.

## noscript constraints
- scriptsDisabled:true. All dynamic-announcement verdicts are PARTIAL — no JS handlers fire, no live regions mutate, hover data is empty ({}).
- The "Talk to Us" links navigate to an external Google Form (newTab:true) — no JS activation behavior to test.
- Off-screen elements (el9, el10) are truly off-screen in the frozen noscript render (the hero section below the fold); in a live scripted render the page likely scrolls and these would be in-viewport when focused.

## Focus-visibility caveats
- el10 (hero button): computedOutline='none'; the Tailwind `focus-visible:ring-1 focus-visible:ring-ring` class is present in className but the ring only renders under `:focus-visible` pseudo-class, which isn't active at rest. Since the element was off-screen during the drive, no focusShot was captured. The REPRODUCED verdict for 2.4.7 on el10 should be confirmed with a live scripted run to see if the ring actually fires.
- el1 (logo link): localTabWalk reachedByTab=false is a localTabWalk positioning artifact (target is index 0, can't start 5 before it). The global tabWalk confirms the logo link IS stop[0].

## Duplicate headings
- The heading tree contains many duplicate h2/h3 entries. Investigation shows the duplicates have offsetWidth=0/offsetHeight=0 (zero-size, visually hidden via CSS) but are NOT aria-hidden. These are likely Tailwind/React animation or scroll-reveal container duplicates that should carry aria-hidden="true" to suppress them from the AX heading tree.

## Nested-interactive pattern
- 4 CTA instances all use `<a><button>...</button></a>` — each creates two consecutive tab stops. This affects header, hero section, jobs section, and contact section CTAs.

## No forms on page
- forms[] is empty — no form elements to evaluate for 3.3.x.

## Axe
- Two color-contrast violations: both point to white-on-orange buttons (contrastSolid=2.41).
- One heading-order violation: h4 footer labels following h2 directly.
