# Evaluation Notes — Corporate Business Development Manager (Product) @ Harvey

## Driver / Script Issues

- **Multiple stuck drive-page.js processes**: Running `drive-page.js` without `--noscript` on this noscript-flagged page triggered the adaptive-scripted check (loads page scripted, probes DOM survival). The scripted load caused the Chrome renderer to spin at 120%+ CPU for 7+ minutes with the error "FATAL Attempted to use detached Frame" — the page's hydration detached the frame mid-probe. Required killing all child processes and re-running with explicit `--noscript` flag.
- **drive.json stdout truncated by tool**: The bash tool captures stdout up to ~80KB and stores it as a tool-result file; the drive.json written via `>` redirect was being populated from that truncated file (81040 bytes, invalid JSON at end). Fixed by using a `node -e` wrapper that spawned the process and piped stdout directly to the output file. Final drive.json: 81033 bytes, valid JSON, 21 elements.
- **forms[] empty**: The application form uses a `<div>`-based layout — no `<form>` element found (`hasForm:false`). The Submit Application button is `type="submit"` but is not inside any `<form>`. The drive-page.js error-on-submit probe relies on `<form>` elements and found none (forms:[]). Error identification (3.3.1/3.3.3) cannot be tested; PARTIAL on all form fields.

## Screenshot / Visual Check Notes

- **el1.png / el1_focus.png** (Privacy Policy link at top, EL0): Both show a thin horizontal line — the link is at y=2834 in a 900px viewport so only the bottom border area is captured. Focus diff not meaningful from this crop; confirmed via computedOutline + tabWalk.
- **el2.png / el3.png** (Preferred Last Name / Legal First and Last Name inputs, EL1/EL2): el2 shows input + "Preferred First Name*" label below it; el3 shows the Legal First input focused with a subtle blue border visible. Per-element focus diff could not be computed (computed-only method — elements were not in viewport at diff time). tabWalk stop data (outlineOrShadow:true) and verify-finding confirm focus ring exists (solid 4px rgba(8,0,234,0.13)).
- **el6.png / el6_focus.png** (unnamed toggle button, EL5): Both show an identical white rounded corner — the button (48×54px) is at the right edge of the Location combobox, and the crop captured only its corner. visibleDiffPct=0. Focus presence confirmed via computedOutline and tabWalk.
- **el7.png** (tabpanel, EL6): Large screenshot of full application form — useful for overall layout context.
- **el8.png / el8_focus.png** (Pronouns input, EL7): Both show nearly identical input + label below (diff=0 from this crop). computedOutline 'solid 4px rgba(8,0,234,0.13)' confirmed focused.
- **el17.png through el21.png** (footer elements): All blank white — footer is at y≈2892, well below the 900px viewport. No useful visual data; relied entirely on computedOutline, tabWalk, and computed styles.

## Snapshot Fidelity

- Page is flagged noscript:true. scriptsDisabled:true in drive output. All announcement (dynamic-announcement), form-submit error, and arrow-key navigation sub-verdicts are PARTIAL due to JS being disabled.
- vsr:true — the virtual SR injected successfully despite noscript serve; tab walk, SR walk, focus indicators, and static SR announcements work.
- The tabWalk captured 30 stops (maxTab:50), covering the full focusable set. No off-screen stops, no outline-missing stops.

## Page-Level Issues Not in Sampled Elements

- **File inputs without labels**: Two `input[type=file]` elements have no aria-label, aria-labelledby, or associated `<label>` (axe `label` violation). Neither file input was sampled directly (they are visually hidden; the "Upload File" / "Upload file" buttons trigger them). Flagged in EL4 forms skill evidence.
- **reCAPTCHA legal notice text** (`._recaptchaLegal_flnu3_29`): color rgb(125,134,153) on white = 3.66:1, 12px normal text — threshold 4.5. FAILS 1.4.3. axe confirms. Not in sampled elements — page-level color-contrast issue.
- **`<em>` text in Overview panel**: color rgb(125,134,153) on light gray background (~rgb(240,240,240)), pixel contrast 3.56:1, 14px normal — threshold 4.5. FAILS 1.4.3. axe confirms. Not in sampled elements.
- **`aria-required` not set**: All 8 required fields use the HTML `required` attribute but not `aria-required`. Browsers map `required` → `aria-required="true"` automatically, so SR announces "required" correctly. Not a defect.
