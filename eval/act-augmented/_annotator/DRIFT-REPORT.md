# HTML-vs-mechanism drift audit

Every act-augmented page was read and compared against its `mechanism`/`scenario`/`expected`.

- **aligned** — HTML demonstrates the described failure/control; nothing to do.
- **stale-desc** — HTML is fine, only the prose drifted → **auto-corrected** in `description-overrides/` (shown corrected in the annotator).
- **not-aligned** — HTML does NOT demonstrate the described aspect → **left for you to decide** (regenerate the page, remap the aspect, or rewrite the description).

**Totals: 923 pages — 847 aligned · 57 stale-desc (fixed) · 19 not-aligned (need decision)** across 22 SCs.

## Per-SC summary

| SC | pages | aligned | stale-desc (fixed) | not-aligned (decide) |
|---|--:|--:|--:|--:|
| 1.1.1 | 49 | 46 | 3 | 0 |
| 1.3.1 | 54 | 51 | 2 | **1** |
| 1.3.2 | 42 | 41 | 1 | 0 |
| 1.4.1 | 47 | 47 | 0 | 0 |
| 1.4.3 | 48 | 33 | 13 | **2** |
| 1.4.5 | 36 | 35 | 1 | 0 |
| 1.4.10 | 47 | 41 | 5 | **1** |
| 1.4.11 | 42 | 39 | 3 | 0 |
| 1.4.13 | 36 | 32 | 3 | **1** |
| 2.1.1 | 36 | 36 | 0 | 0 |
| 2.1.2 | 42 | 36 | 3 | **3** |
| 2.4.2 | 31 | 31 | 0 | 0 |
| 2.4.3 | 49 | 45 | 4 | 0 |
| 2.4.4 | 36 | 34 | 0 | **2** |
| 2.4.6 | 42 | 40 | 1 | **1** |
| 2.4.7 | 36 | 35 | 1 | 0 |
| 2.4.10 | 42 | 39 | 2 | **1** |
| 3.3.1 | 40 | 35 | 5 | 0 |
| 3.3.2 | 36 | 31 | 4 | **1** |
| 3.3.3 | 42 | 39 | 2 | **1** |
| 4.1.2 | 48 | 43 | 3 | **2** |
| 4.1.3 | 42 | 38 | 1 | **3** |
| **all** | **923** | **847** | **57** | **19** |

## ⚠ Not-aligned — needs your decision (19)

The page on disk does not match the written aspect/description. Options per case: (a) regenerate the page to match, (b) move it to the aspect it actually demonstrates, or (c) rewrite the description.


### SC 1.3.1

- **visual-lists-without-list-markup/case-05** — Page is a 'Reflow incident runbook': real <ol class=runbook role=presentation> with 4 <li role=none>. Input describes a Loomly 5-step .stepper of <div class=step>; different page, element (ol vs div), count, and failure (F92 suppression, not list-not-marked-up).  
  [open page](/eval/act-augmented/1.3.1/pages/visual-lists-without-list-markup/case-05.html)

### SC 1.4.3

- **effective-background-across-cascade-and-overlays/case-04** — HTML is a 'Resonance' music-player card using mix-blend-mode:soft-light on .track-title #262626 over solid #c0c0c0 art; no .panel, no #14171c/#6f6f6f/#777 inheritance, no dark dashboard.  
  [open page](/eval/act-augmented/1.4.3/pages/effective-background-across-cascade-and-overlays/case-04.html)
- **faux-disabled-vs-genuinely-inactive-ui/case-05** — HTML is Larkwave 'Now playing' player — operable 'Save to library' white label over album-art gradient — not the TripNest cookie-consent #reject.btn.reject faux-disabled button described.  
  [open page](/eval/act-augmented/1.4.3/pages/faux-disabled-vs-genuinely-inactive-ui/case-05.html)

### SC 1.4.10

- **long-unbreakable-string-overflow-c33/case-07** — 'Aurelia Registry' SHA-256 page, not the crypto receipt. Full digest + Copy hidden by @media(max-width:600px) display:none — an F102 media-query mechanism, not a C33 dd.trunc string. Never overflows.  
  [open page](/eval/act-augmented/1.4.10/pages/long-unbreakable-string-overflow-c33/case-07.html)

### SC 1.4.13

- **dismissible-position-obscures-meaningful-vs-decorative/case-04** — expected=passed (decorative carve-out PASS) but page is a deliberate FAIL: Larkspur Ridge trail page whose tooltip #cond obscures an INFORMATIONAL difficulty-key SVG; no restaurant menu, no #al-cacio, no aria-hidden svg.flourish.  
  [open page](/eval/act-augmented/1.4.13/pages/dismissible-position-obscures-meaningful-vs-decorative/case-04.html)

### SC 2.1.2

- **documented-exit-reachability-and-accuracy-beyond-ctrlm/case-05** — File is InterpretHub booth with .exit-note 'press Ctrl+W' (browser-reserved, dead) -- a FAIL. No #helpToggle, no aria-expanded disclosure, no Ctrl+Q; description's in-subset reachable+accurate PASS is absent.  
  [open page](/eval/act-augmented/2.1.2/pages/documented-exit-reachability-and-accuracy-beyond-ctrlm/case-05.html)
- **input-gate-required-interaction-exception/case-06** — File is MeridianEHR drug-interaction modal PASS (role=dialog, documented Alt+X exit, .ackbox checkbox gate). No #thumb, no slide-to-confirm slider, no banking transfer; expected=failed but page is conformant.  
  [open page](/eval/act-augmented/2.1.2/pages/input-gate-required-interaction-exception/case-06.html)
- **modal-popover-legitimate-containment-vs-trap/case-06** — Page is Cobalt Bank identity modal #dialog with iframe srcdoc 'SecureScan' KYC widget (F10 cross-document trap). No #confirm, #zip, stacked modals, or nested-dismiss handoff exist.  
  [open page](/eval/act-augmented/2.1.2/pages/modal-popover-legitimate-containment-vs-trap/case-06.html)

### SC 2.4.4

- **duplicate-name-same-context-different-purpose/case-02** — Input is a PASS control (3 equivalent 'Download this data' PDF/XLSX/CSV); HTML is Wellspring Swim School, two 'download the form' links to NON-equivalent consent vs medical forms — a FAILING page, inverted verdict.  
  [open page](/eval/act-augmented/2.4.4/pages/duplicate-name-same-context-different-purpose/case-02.html)
- **duplicate-name-same-context-different-purpose/case-06** — Input is a PASS control (two 'contact us' to SAME #contact); HTML is BIOL 204 page, two 'open the syllabus' links to DIFFERENT ?cohort resources — a FAILING page (per its own note), inverted verdict.  
  [open page](/eval/act-augmented/2.4.4/pages/duplicate-name-same-context-different-purpose/case-06.html)

### SC 2.4.6

- **visible-vs-accessible-name-divergence/case-06** — HTML is a Hollowmere Museum galleries page, not the described newsletter-signup PASS control; no button.iconbtn[aria-label='Search'], no email field. Instead h2#h-roman aria-labelledby='h-saxon' is an active divergence FAILURE — different topic and opposite disposition.  
  [open page](/eval/act-augmented/2.4.6/pages/visible-vs-accessible-name-divergence/case-06.html)

### SC 2.4.10

- **nameless-heading-element/case-02** — h2#g-placeholder reads real words 'Untitled section' (SR hears a label) — a placeholder/generic-name defect (other aspect), not the described whitespace/CSS-image nameless heading.  
  [open page](/eval/act-augmented/2.4.10/pages/nameless-heading-element/case-02.html)

### SC 3.3.2

- **icon-only-label-not-widely-understood/case-06** — Input describes a PASSING Portbridge Logistics shipping form (loupe + visible text labels); HTML is a Riverside County energy form with TWO FAILING icon-only fields (pilcrow, lambda) — different page, opposite disposition.  
  [open page](/eval/act-augmented/3.3.2/pages/icon-only-label-not-widely-understood/case-06.html)

### SC 3.3.3

- **correction-not-knowable-dna-pass/case-04** — HTML is Maple County file-upload #doc (corrupted-PDF, 'We couldn't read this file...'), a conformant DNA PASS; described slug-availability inversion FAIL (#slug 'plinth.co/studio') is absent.  
  [open page](/eval/act-augmented/3.3.3/pages/correction-not-knowable-dna-pass/case-04.html)

### SC 4.1.2

- **name-omits-visible-label-text/case-01** — Page is PaleoCon workshop-booking grid; checkbox visible label 'Attend' IS contained in accName ('Track 2 2 to 5 PM The Cretaceous period Attend'). Defect is wrong-referent IDREFs, not label omission. No Save button, no aria-label.  
  [open page](/eval/act-augmented/4.1.2/pages/name-omits-visible-label-text/case-01.html)
- **name-omits-visible-label-text/case-03** — Page is Meridian Utilities billing; 'Pay' buttons aria-labelledby concatenate own 'Pay' + wrong invoice ctx (0042→ctx-0051). Visible 'Pay' IS a leading substring of accName; defect is wrong invoice id, not label omission. No PDF link, no aria-label='document'.  
  [open page](/eval/act-augmented/4.1.2/pages/name-omits-visible-label-text/case-03.html)

### SC 4.1.3

- **wrong-live-region-politeness-for-urgency/case-01** — Page is 'Helmsley Workspace — Notification preferences'; defect is span#savedMsg with aria-live='off' silencing 'Preferences saved.'. No shoe store, no p#liveCount[role=alert], no per-keystroke assertive counter.  
  [open page](/eval/act-augmented/4.1.3/pages/wrong-live-region-politeness-for-urgency/case-01.html)
- **wrong-live-region-politeness-for-urgency/case-04** — Page is MercyHealth refill prescription; defect is backwards SCR14 'Focus mode' toggle (on by default) setting p#refillStatus[role=status] to aria-live='off'. No LMS, no span#autosave[role=alert], no autosave flip.  
  [open page](/eval/act-augmented/4.1.3/pages/wrong-live-region-politeness-for-urgency/case-04.html)
- **wrong-live-region-politeness-for-urgency/case-05** — Brewhaus coffee-checkout topic matches, but live region is p#payStatus[role=status] with no aria-live='polite'; defect is content-routing urgent warning to plain #declineBanner, not polite-queuing. Described politeness defect absent.  
  [open page](/eval/act-augmented/4.1.3/pages/wrong-live-region-politeness-for-urgency/case-05.html)

## Stale-desc — descriptions auto-corrected (57)

Page is a valid case; the mechanism/scenario text drifted and was rewritten to match the HTML (see `description-overrides/<sc>.json`).


### SC 1.1.1

- **meaningful-image-suppressed-as-decorative/case-02** — Prose described a fashion size-guide (Size/Bust/Waist/Hip/Length, XS-XL, cm) rendered as an inline SVG table; the real page is an energy-tariff comparison painted on a <canvas>. The primarySelector `section.panel svg[role="presentation"]` matches no element (there is no SVG); the carrier is `section.panel canvas#rateChart[role="presentation"]`. The aspect's defect (informative graphic declared decorative, no text duplicate) is genuinely present.
- **meaningful-image-suppressed-as-decorative/case-04** — Prose gave the wrong dose values (Morning 1 tablet / Midday 1 tablet / Night 0) — the real regimen is Morning 2 / Midday 1 / Night 1 for Warfarin 5 mg, plus 'do not crush'. The suppression is `aria-hidden="true"` on the SVG, not `role="none"`, so the primarySelector `.schedule svg[role="none"]` does not match (use `.schedule svg[aria-hidden="true"]`). The decorative-suppression defect is genuinely present.
- **text-lookalike-glyph-substitution/case-02** — primarySelector `div.pay > span.brand` is wrong: span.brand actually sits inside `p.note` (a sibling of div.pay), so the correct selector is `p.note > span.brand`. The confusable code points and the F71 defect are exactly as described.

### SC 1.3.1

- **ascii-and-pre-faux-tables-and-columns/case-06** — Prose said the page 'uses <pre> twice ... a haiku in <pre>', but the haiku is actually a <p class="haiku"> with CSS white-space:pre, not a <pre> element. Only the logo is a real <pre>; the divider is a <div>. Corrected the element identification; the control itself is unchanged and valid.
- **form-label-and-group-relationships-by-context/case-01** — Prose described the wrong mechanism: it said the visible labels are unassociated <span>s in a separate column and inputs carry generic title='Field 1'..'Field 5'. The actual HTML has fully associated <label for>/id pairs with descriptive names; the real 1.3.1 failure is a CSS-grid visual-vs-programmatic label MISMATCH (swapped inputs), not absent/generic labelling. The page still demonstrates a 1.3.1 failure, so only the description was corrected.

### SC 1.3.2

- **responsive-breakpoint-order-desync/case-01** — Scenario claimed the visible step numbers are CSS counter() values keyed to visual position, producing a clean renumbered '1 Payment, 2 Shipping, 3 Review' on mobile. The actual HTML hard-codes the numerals as static <span class="step__num" aria-hidden="true"> text (1 on Shipping, 2 on Payment, 3 on Review) pinned to their content, so mobile actually shows badges out of order ('2 Payment' above '1 Shipping'). The breakpoint (max-width:600px) and the order: declarations in primarySelector are correct; only the numbering mechanism and the described mobile read are wrong. Defect (visual-order desync) is genuinely present.

### SC 1.4.3

- **aa-thresholds-and-large-text-classification/case-01** — Page was rewritten to a different concrete instance. primarySelector should be p.promo#strapline (Tidewater Rewards), not p.context.tone-muted (Harbor Ledger). Mechanism is now transform-scale shrinking a nominal-18pt line to ~10.8pt rendered, not a 24px-deck/16px-note color reuse. Color #8a8a8a (3.4522:1), not #8b8b8b (3.41:1). Same aspect (size classification → AA threshold), same expected=failed.
- **aa-thresholds-and-large-text-classification/case-02** — Page was rewritten. primarySelector should be .hero h1 (Coastline Ferries), not h2.section-head.is-regular (Meterly). The mechanism is a 15pt-normal heading over a horizontal gradient (worst-case backdrop), NOT a 14pt bold-vs-regular weight flip; colors are #2f4a5e on a gradient, not #8e8e8e on white (3.28:1). Same aspect, same expected=failed.
- **aa-thresholds-and-large-text-classification/case-03** — Page was rewritten. primarySelector should be .banner h1 (Harvest Lights), not h1.title (Atrium). The mechanism is now large-scale white text failing the relaxed 3:1 over a bright gradient stop, NOT a hairline-weight-100 anti-aliasing case; colors are white over a sunset gradient, not #3d6c6c on #111. Same aspect (large-text threshold), same expected=failed.
- **aa-thresholds-and-large-text-classification/case-04** — Page was rewritten. primarySelector should be .masthead img (Riverside Library), not h2.section-title#mtitle (BIO 204 LMS). The mechanism is now an image-of-text whose glyph size must be measured (~15.75pt normal), NOT a 1.5rem heading shrunk by an 87.5% root font-size to 21px; color #888888 (3.54:1), not #838383 (3.79:1). Note this case now overlaps the picture-with-significant-other-content aspect. Same broad aspect (size → threshold), same expected=failed.
- **aa-thresholds-and-large-text-classification/case-05** — Page was rewritten. primarySelector should be .panel h2 (Glassroom), not h2.course-head (Cantina del Molo). The mechanism is now 14pt normal-weight (large only if bold) over a gradient, NOT a condensed-face/font-stretch case; colors are #8c8c8c on a white→#efefef gradient, not #9c5a30 on #141414 (3.44:1). Same aspect (large-text classification), same expected=failed.
- **aa-thresholds-and-large-text-classification/case-06** — Page was rewritten. primarySelector should be p.policy (Fern & Field), not p.disclosure (Calverton DMV). The just-below-4.5 no-round mechanism is intact but the page is now over a white→#f4f4f4 gradient (4.4151:1→4.0142:1) rather than flat white; color #787878, not #767880 (4.40:1). Same aspect (hard 4.5:1, no rounding), same expected=failed.
- **decorative-vs-meaningful-text-exemption/case-02** — Prose named the flourish word 'INSPIRE' at 35% alpha; the actual DOM word is 'WANDER' at rgba(255,255,255,.30). The .flourish selector, aria-hidden decoration, and pass verdict are unchanged.
- **decorative-vs-meaningful-text-exemption/case-05** — rewritten to match the page (was a different instance)
- **faux-disabled-vs-genuinely-inactive-ui/case-02** — Behavioral mechanism (unguarded div role=button + aria-disabled=true) matches, but the concrete instance drifted: brand is Halcyon Bank not Lumen Analytics; id #sendBtn not #applyBtn; label 'Send transfer' not 'Apply credit'; demo is a balance drop $2,480.00→$2,330.00 not 'balance→$64.00'; colors #a4a4a4 on #eeeeee not #a3a3a3 on #f0f0f0 (ratio ≈2.2:1 unchanged). primarySelector should be #sendBtn[role="button"][tabindex="0"].
- **logotype-brand-exemption-and-erosion/case-03** — rewritten to match the page (was a different instance)
- **logotype-brand-exemption-and-erosion/case-05** — rewritten to match the page (was a different instance)
- **picture-with-significant-other-content-exemption/case-01** — Page was rewritten. primarySelector should be img.menu (Maison Verde bistro menu), not img#heroHeadingImg.headline (Cohere Ledger B2B SaaS hero). The in-scope flat-image-of-text contrast failure is intact, but the concrete instance differs: color pair #9c8e6f-on-#f3ead7 = 2.70:1, not warm-grey 3.25:1. Same aspect, same expected=failed.
- **state-dependent-text-contrast/case-01** — Page was rewritten. primarySelector should be #tideline-postcode::placeholder (Tideline swim-club form), not #q::placeholder (garden-centre catalogue). The failing placeholder is over a gradient fill (no single bg colour, ~2.48→1.53:1) with a decorative-placeholder carve-out, not flat white at 2.41:1; color #9aa0a6, not #a7a7a7. Same aspect (placeholder contrast), same expected=failed.

### SC 1.4.5

- **image-of-text-vs-live-text-core-detection/case-03** — Page genuinely demonstrates the aspect, but two concrete details drifted: the markup has EMPTY <span class="name rN"> spans (no off-screen/indented real text node), and the dish name is the span's own aria-label (role="text"), not a generic aria-label="menu item" on the <li>.

### SC 1.4.10

- **carousel-panel-overflow-g225/case-02** — Whole concrete instance drifted: there is no SaaS CRM testimonial carousel and no fixed-width tweetshot <img>. primarySelector should be section.plan .compare (the Business panel's two-column block), not figure.quote .tweetshot. The overflow is plain text in two fixed 220px columns, not an image missing max-width:100%; the C37 max-width remedy does not apply (a stacking/one-column layout would). The page is a valid expected:failed G225 case.
- **carousel-panel-overflow-g225/case-06** — Whole concrete instance drifted: there is no museum 'New Acquisitions' filmstrip and no figure.work/.credit no-wrap credit line / Reliquary Casket provenance. primarySelector should be article.recipe .stats (the third card, the Ragù card), not figure.work .credit. The overflow is driven by a non-wrapping stats-tile flex bar (flex-wrap:nowrap + flex:0 0 auto) on a width:max-content card, not a white-space:nowrap caption; the only white-space:nowrap in the file is the unrelated per-tile .stats .tile .v rule. The page is a valid expected:failed G225 case.
- **long-unbreakable-string-overflow-c33/case-06** — Char count drifted: the full data-full key is 71 chars, not 64 ('swaps in the full 64-char value'). All other specifics — the #revealBtn disclosure wiring, aria-expanded/aria-controls, reveal() script, overflow-wrap:anywhere on the revealed value, role=status announcement, Copy button, zero overflow at 320px — match the markup exactly.
- **meaningful-indentation-vs-gratuitous-g224/case-04** — Wholesale drift, and the expected value FLIPS from passed to failed. The HTML (and its companion case-04.md) is an intentional FAILED 'counterfeit-G224' nested-list case, NOT the described PASSED natural-history-museum Linnaean taxonomy. Wrong domain (legal 42 CFR vs museum), wrong selector (.issuetree li > .node vs .taxonomy), wrong mechanism (white-space:nowrap blocking per-item reflow vs a working per-item min-width wrap), and wrong disposition. The page itself is internally coherent and demonstrates the gratuitous-non-wrapping aspect; only the input description is stale.
- **sticky-fixed-content-consumes-small-viewport/case-03** — Focus-order specific drifted: the corner X (button.x) is NOT 'the last focusable element on the page'. In the DOM the close button precedes the ad's CTA link (a.cta 'Start free trial') inside aside.ad, so the CTA is last and the X is second-to-last. (The page's own code comment makes the same incorrect 'LAST focusable' claim.) The obscured-focus + dismiss-only-by-advancing-past-obscured-content failure is genuinely present; position:fixed, height:180px and the listening-guide link all match.

### SC 1.4.11

- **exemption-boundaries-inactive-hover-essential-symbolic/case-06** — Two distractor-control ratios drifted from the page's own CSS: Zoom icon is #3a3a3a at ~7.6:1 (prose said 9.2:1) and the ✕ close glyph is #9c9c9c at ~2.0:1 (prose said ~2.75:1). Verdicts are unaffected and the primary failing control (.tool--active-fail Draw, ~1.7:1) is exact.
- **focus-indicator-geometry-inner-border-partly-outside/case-03** — Component type drifted: the button is a SOLID blue primary button (fill #4189B9, blue border same hue), not an 'outlined ghost button ... over a light blue-tinted interior'. The branding/topic also differs (Cedar Park Health, not Lumen Photo Cloud pricing). The in-place border-recolour failure (green #4B933A vs blue interior #4189B9 = 1.005:1) is exactly as described.
- **state-indicator-contrast-adjacent-surface/case-02** — Colours and ratios drifted: actual CSS uses ON-track #4E9E52 (prose said #2E7D32) and ON-thumb #74B97A (prose said #C8C8C8); the thumb sits on the green track, there is no separate #B0B0B0 'position rail'. Track-vs-page is ~3.31:1, not ~5.1:1. The thumb-on-track failure (~1.32:1) is genuinely present.

### SC 1.4.13

- **dismissible-esc-keyboard-dismiss-without-moving-hover-focus/case-06** — primarySelector '#c1' does not exist; the trigger is button#term and the popup is #defn. The scenario also described a different concrete instance ('higher-ed LMS [1] footnote citation popup'), but the actual fixture is an Eastfield Museum 'maki-e' lacquer-technique glossary tooltip (lang=en; no footnote/[1]/citation/LMS anywhere). The passing Dismissible Method 2 control itself is correctly implemented.
- **dismissible-position-obscures-meaningful-vs-decorative/case-06** — Selector, topic, and obscuring mechanism in the prose were all wrong. The described RTL/Arabic size-guide (#size-pop, dir=rtl, physical left:0, label 'دليل المقاسات') is not this page; the real fixture is a Northline Rail departures board (lang=en, direction-independent geometry, page comment 'no i18n/RTL'), id #why-coast, mechanism bottom:-4px on a shrink-wrapped anchor growing upward. The core aspect (popup obscures its own trigger + meaningful content, no dismiss) is still genuinely demonstrated, so the page is fine; only the prose drifted.
- **hover-content-no-keyboard-focus-trigger-path/case-04** — Mechanism/scenario/primarySelector described a different fixture: a 'Cedar Valley Health A1C trend chart' with non-focusable <div> markers (#chart .point), mouseenter/mouseleave-only popups (#dp-popup), and A1C medical values/clinical notes. The real page is a SkyArc Airways fare-booking page; primarySelector '#chart .point' resolves to nothing. Its sub-mechanism is payload-divergence on focusable buttons (focus reveals an abbreviated payload), not the no-keyboard-path-on-a-non-focusable-element sub-mechanism in the prose. The page still genuinely fails 1.4.13 on the focus limb (expected=failed holds).

### SC 2.1.2

- **esc-standard-exit-method-no-advice-owed/case-03** — Primary selector should be #grid, not #modal. The Meridian Credit Union OTP modal, #vHelp, and the keyCode===13/Enter bug are all wrong; the real defect is Ctrl+Alt+G advised vs Ctrl+Alt+B coded (e.code==='KeyB').
- **esc-standard-exit-method-no-advice-owed/case-05** — Primary selector should be #calGrid, not #promo. The Aurora Hall theatre seat-picker modal, #dlg, .seat buttons, and the #promo stopPropagation positional trap do not exist; the real trap is a date-picker grid swallowing Tab/Esc.
- **esc-standard-exit-method-no-advice-owed/case-06** — Primary selector should be #plan, not #lbType. The RTL Arabic real-estate dual-listbox, #lbArea, #areaNext, and Ctrl+Shift+X do not exist; this is a single LTR session grid whose release combo is Ctrl+Shift+ArrowDown, with no passing foil widget.

### SC 2.4.3

- **css-reorder-tab-vs-visual-meaning/case-07** — Wrong concrete instance: prose described a Lakeview Dental 7-column September-2026 date-picker with weekday columns (Mon 7,14,21,28...), but the actual page is a Riverbank Playhouse theatre seat chart with an 8-column, 5-row grid of seats numbered 1-40. Same SC 2.4.3 column-major-DOM mechanism; brand, dimensions, example values, and primarySelector semantics drifted (button.col-3 = seat column 3 = seats 3,11,19,27,35, not a third weekday).
- **f85-revealed-dialog-not-adjacent/case-05** — Page is a genuine F85 failure (no focus move on open + revealed widget far in source), but the markup uses <nav aria-label> with plain <a> links — the page comment explicitly states 'no role=menu'. The scenario/mechanism wording 'role=menu panel' / 'menuitem' is inaccurate; corrected to a disclosure-nav of plain links.
- **nested-and-static-focusable-illogical-stops/case-03** — rewritten to match the page (was a different instance)
- **nested-and-static-focusable-illogical-stops/case-04** — Page genuinely demonstrates the per-item double focus stop (4 li.episode items), but the description prose drifted: there is no <article>, no tabindex=0, no role=link, no onclick, and no 'Read more' link, so primarySelector article.card[tabindex=0][role=link] does not exist. The real construction is the Bootstrap-style stretched-link pattern: li.episode > a.cover (whole-card) + a.listen 'Listen now', both to the same href.

### SC 2.4.6

- **descriptiveness-depends-on-layout-or-state/case-04** — rewritten to match the page (was a different instance)

### SC 2.4.7

- **drawn-indicator-fails-forced-colors-or-at-tracking/case-03** — Scenario/mechanism described a different concrete page than the HTML: prose said a 'TidalSync backup preferences' dark-theme settings panel with text inputs, a select, and a Save button whose focus cue was a dashed-ring SVG background-IMAGE (data: URI), with primarySelector 'input[type=text]:focus, select:focus, button.save:focus'. The actual page is a Coastliner seat picker using custom div[role=button] seats whose cue is a background-COLOR swap (primarySelector .seat:focus) - none of those elements/selectors exist on the page. Same aspect (custom-drawn indicator lost in forced-colors / untrackable by AT), different concrete instance; primarySelector should be '.seat:focus'.

### SC 2.4.10

- **nameless-heading-element/case-01** — Same nameless-heading defect, but the page and mechanism drifted: the prose describes a GOV.UK residential-parking-permit page whose 'Fees and payment' h2#sec-fees holds a single non-breaking space (U+00A0); the real page is a carrots recipe whose nameless heading is a PUA icon-font glyph (U+F080), and the selector is h2#h-nutri, not h2#sec-fees.
- **nameless-heading-element/case-03** — Same image-only nameless-heading defect, but the concrete instance drifted: the prose describes a wedding microsite ('Priya & Daniel') whose 'Travel & Stay' h2#h-travel holds a decorative swirl <img alt=''> (empty alt, accessible name ''); the real page is a recipe whose Method heading uses a divider image with a non-empty filename alt, and the selector is h2#h-method, not h2#h-travel.

### SC 3.3.1

- **error-message-mismatches-actual-error/case-03** — Prose said '12-character value (12 bullets)'; the actual retained value is 'riverstonelake' (14 characters), so the 12/12-bullet counts were wrong. The page's own HTML comment also mis-states it as 12. Defect mechanism is unchanged (14 >= 8 holds).
- **inline-error-adjacent-to-wrong-field/case-03** — rewritten to match the page (was a different instance)
- **non-text-only-error-indicator/case-01** — Prose described an allotment-newsletter email field 'tom@' with primarySelector input#email.flagged; the actual page is a course-enrolment form whose flagged field is input#seats (value '6', over-capacity). No input#email exists; the named value/field/scenario were wrong. The text-only red-border-plus-tint indicator mechanism is genuinely present as described, so only the prose drifted. (Corrected primarySelector: input#seats.flagged.)
- **non-text-only-error-indicator/case-03** — rewritten to match the page (was a different instance)
- **silent-redisplay-after-real-error/case-01** — rewritten to match the page (was a different instance)

### SC 3.3.2

- **focus-revealed-instruction-not-honored/case-01** — Page genuinely demonstrates the aspect (password's only instruction never perceivable on focus), but the prose described the wrong concrete mechanism: a classList.remove('hide') vs 'hidden' no-op. The real bug is a copy-pasted handler targeting #email-hint plus an aria-hidden, never-shown #pw-hint.
- **group-label-needed-but-absent-generalized-f82/case-05** — Page demonstrates the aspect, but the prose described the wrong concrete instance: it claimed a Cirruswing Air 'Passenger 1/2' badge drawn via CSS .pax-head::before{content:'Passenger ' counter(pax)} with an empty DOM div. The page is actually DevNorth 'Attendee 1/2' as REAL DOM text in a non-semantic div.ticket-bar.
- **instruction-visually-orphaned-from-its-field/case-02** — Page demonstrates the aspect (instruction not presented to all users), but the prose described a different concrete page/mechanism: a Brightleaf Supply Co. purchase-order field whose format hint sits in a closed-by-default <details> disclosure. The actual orphaning is a .sr-only visually-hidden span on a credit-union security-answer field.
- **instruction-visually-orphaned-from-its-field/case-05** — Page demonstrates the aspect (rendered position attaches the instruction to the wrong field), but the prose described a different concrete instance: a Meridian Credit Union 'Link an external bank account' form where a CSS-grid routing-number hint lands beside the Account nickname field. The actual page is a Northwind Tickets checkout where a position:absolute CVC note lands under the Card number field.

### SC 3.3.3

- **suggestion-stranded-far-from-field-or-unreachable/case-02** — Prose described a Nonprofit donation form with input#email, a top-of-page plain-text error summary ('Email format is wrong — use name@example.com') and no jump link / no near-field repetition. The actual page is a library-card renewal (input#barcode) and the stranding mechanism is an aria-hidden suggestion container excised from the AX tree, not a remote plain-text summary. Same aspect (correct suggestion present but not provided to the user), different concrete instance/field/mechanism. primarySelector input#email does not exist; the erroring field is input#barcode.
- **suggestion-stranded-far-from-field-or-unreachable/case-04** — Prose described a State tax e-filing form with a top error summary whose 'Jump to field' links target nonexistent fragments (a[href='#ein-field']/#routing while real ids are ein/bank-routing-input). The actual page is a banking SEPA-transfer form (input#iban) whose stranding mechanism is a hover-only title='' tooltip, not broken jump-link fragments. Same aspect (correct suggestion present but unreachable/not provided), different concrete instance/field/mechanism. primarySelector a[href='#ein-field'] does not exist in this DOM.

### SC 4.1.2

- **multipart-field-subnames-ambiguous/case-04** — Wrong page and wrong mechanism: scenario describes a Japanese municipal postal-code (郵便番号) entered as a 3-digit + 4-digit pair, both carrying the identical aria-label='郵便番号' (the 'all parts share one identical name' variant). The real page is an English rental price-range filter whose failure is F86 Example 3 — label tied to the first box, second box named by its separator '–'. The aspect (undifferentiated multi-part sub-names) genuinely holds, but the concrete instance, selector, and sub-mechanism differ.
- **multipart-field-subnames-ambiguous/case-05** — Wrong page and wrong mechanism: scenario describes a Northgate Cardiology blood-pressure reading (systolic input, diastolic input, unit <select>) where all three controls share title='Blood pressure'. The real page is a courier phone field whose parts are named by their placeholder format masks (unassociated visible captions). The aspect (ambiguous/undifferentiated multi-part sub-names) genuinely holds, but topic, selector, and the concrete naming mechanism differ.
- **stale-text-alternative-on-dynamic-named-component/case-05** — Wrong page entirely: scenario describes an Arabic RTL developer-forum flag/report toggle (button#flagBtn, <svg><title id='flagTitle'>, name 'أبلغ عن هذه المشاركة' / 'تراجع'), but the real page is an English LTR music player with a 3-state repeat-mode cycle button#repeatBtn / title#repeatTitle. Same F20-via-<svg><title> mechanism, but different topic, language, selector, glyph, and frozen string.

### SC 4.1.3

- **partial-update-no-atomic-truncated-announcement/case-01** — Wrong topic (medical prescription-refill counter, not a coffee-storefront cart), wrong region selector (p#refill-region not p#cart-region), wrong inner id (#refill-count not #cart-count), wrong text ('refills remaining' not 'items in cart'); also the scenario wrongly says aria-atomic is unset/spec-default when the page sets aria-atomic="false" explicitly.

---
_Generated by compile-drift-report.js from drift-report/*.json + description-overrides/*.json._
