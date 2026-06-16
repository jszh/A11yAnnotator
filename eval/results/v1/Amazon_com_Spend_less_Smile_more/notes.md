# Eval notes — Amazon_com_Spend_less_Smile_more

## Shot / crop mismatches (fidelity gaps)

- **el1.png / el1_focus.png** (Woot link, x=442, y=4686): Crop shows "Swim" and "ry brands" text fragments — appears to be a partial edge of a fashion carousel, not the Woot footer link area. visibleDiffPct=0 confirms the two shots are pixel-identical. The element likely scrolled into view on focus but the crop did not track the scroll offset. Focus ring cannot be visually confirmed.

- **el3.png / el3_focus.png** (Veeqo link, x=1027, y=4450): Crop shows "Sign in secu..." and a white/grey region — wrong area for the footer link. Same crop-drift issue as el1.

- **el6.png / el6_focus.png** (Go search button, x=833, y=10): Crop shows "ent Shop" (category navbar text) rather than the orange Go button at top of page. The Go button appearance is instead confirmed via a direct verify-finding.js screenshot of the search form. The 0.82% diffPct is a near-zero artifact.

- **el7.png / el7_focus.png** (Search input, x=373, y=11): Crop shows the category navigation bar ("otive Toys & Games Sports & Outdoors Baby Home Improvement") rather than the search field. The 15.4% diffPct is real and attributed to the autocomplete dropdown or orange focus border appearing, but cannot be visually confirmed from this crop.

- **el13.png** (medicube product link, x=7329, y=3022): Crop shows "Sign in securely" yellow button — completely different region. The product link is 7329px off-screen to the right in a horizontal carousel.

- **el14.png** (Pure Life Water link, x=5803, y=1237): Crop shows "Returns" nav text — wrong region. Product link is 5803px off to the right.

- **el17.png / el17_focus.png** (Amazon Business Card link, x=672, y=3989): Crop shows cosmetic product image — wrong region for footer link.

- **el18.png / el18_focus.png** (Help link, x=995, y=4190): Crop shows a near-black strip — wrong region.

- **el19.png / el19_focus.png** (Supply to Amazon link, x=388, y=3962): Crop shows white fabric/dress — wrong region.

## Off-screen carousel elements

- Elements el12, el13, el14 are product title links in horizontal carousels at x=5068–7329 (far right of viewport). They are reached by Tab (localTabWalk.reachedByTab=true) but their focusIndicator is computed-only due to off-screen position. Focus ring assessment is PARTIAL for all three.

## Focus indicator system

- Amazon uses a browser-default `outline:auto 5px rgb(0,95,204)` on footer links (el0, el2, el16, el18) when focused — but the visual diff shots are 0% for all of them, indicating the crop system didn't capture the focused scroll state. These are assessed as PARTIAL.
- Amazon nav links (el1 Pharmacy) use a custom orange box-shadow `rgb(255,153,0) 0px 0px 0px 2px` — correct pattern, not visually capturable in this run (computed-only).
- Carousel slide buttons (el8 Next, el10 Previous) and the hero link (el9) use `solid 2px rgb(136,140,140)` — this grey ring has only 2.71:1 contrast vs the light carousel background, failing 2.4.13 AAA.
- The Go button (el5) has NO focus indicator (none 0px outline, no box-shadow). REPRODUCED 2.4.7 AA.

## tabWalk noOutlineStops

Three stops in the global tab walk had no outline/shadow: the search department combobox (select), the search input (searchbox), and the Go button. The search input later showed 15.4% diff in localTabWalk, suggesting a JS-injected orange border appears. The Go button had no such diff.

## label-title-only (search dropdown)

The `<select id="searchDropdownBox">` is labeled only by `title="Search in"`. A `<label for="searchDropdownBox">` element exists in the DOM but is hidden with `display:none`. The axe `label-title-only` flag is valid — the visual label is absent, though the programmatic `title` attribute provides AT access. This is a marginal issue (title is a valid labelling technique per ARIA spec but considered less robust).

## aria-allowed-attr (critical axe)

The search input `#twotabsearchtextbox` has `role="searchbox"` with `aria-haspopup="grid"`. The ARIA spec does not list `aria-haspopup` as a supported state for the `searchbox` role (only `combobox` supports it). This is a genuine critical-impact ARIA misuse flagged by axe.

## Duplicate banner landmarks

`#navbar-main` (native `<header>`) and `#gw-desktop-herotator` (div[role=banner]) both create banner landmarks. The latter is nested inside the main content area — axe `landmark-banner-is-top-level` and `landmark-no-duplicate-banner` both fire.

## Footer outside landmarks

Multiple footer column elements (`.navFooterLinkCol`) appear to be outside any landmark region per axe `region` violation. The footer links are in a `div[role=navigation aria-label="More on Amazon"]` but the column containers themselves are not directly inside it.

## Problems / driver issues

- `drive.json` problems array is empty — no driver errors.
- `scriptsDisabled: false` — page JS ran normally.
- `maxTab: 50` — global tabWalk capped at 50 stops. The page likely has many more focusable elements (footer has hundreds of links). The cap means the global tabWalk is incomplete, but localTabWalk ensured each sampled element was individually reached.
