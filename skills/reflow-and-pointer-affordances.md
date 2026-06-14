---
name: reflow-and-pointer-affordances
description: Measure reflow at a 320px viewport (deterministic), and exercise hover/Escape to test that pointer-triggered content is dismissible and hoverable.
covers: cat_8 (primary)
wcag: 1.4.10 Reflow (AA, WCAG 2.1); 1.4.13 Content on Hover or Focus (AA, WCAG 2.1)
instruments: reflow harness (--viewport 320x900 / --zoom), hover/Escape driver, vision
behavioral: reflow=no (deterministic); dismissible/hoverable/persistent=yes (needs scripts)
---

# reflow-and-pointer-affordances

## When to run
Findings about no single-column reflow at 400% zoom / 320px, content lost to
horizontal scroll, or hover menus/tooltips that can't be dismissed (Escape) or
hovered into.

## Procedure — reflow (1.4.10), deterministic
1. `verify-finding.js --file <f> --viewport 320x900 --eval "return {scrollW:document.documentElement.scrollWidth, clientW:document.documentElement.clientWidth, overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+5, bodyLen:(document.body.innerText||'').length}"`.
2. **Decide**: `bodyLen>0` (page rendered) AND `scrollW` materially exceeds
   `clientW` (~320) → content needs 2-D scrolling → candidate **REPRODUCED** (Amazon
   1000, Nordstrom 733, BBC 1425 vs 320). Clean reflow (`scrollW≈clientW`) → **NOT
   REPRODUCED** (BBC/NY-Mag earlier passed before remapping — measure, don't assume).
3. **Apply the exemption before concluding.** 1.4.10 *exempts* "parts of the
   content which require two-dimensional layout for usage or meaning" — **data
   tables, maps, diagrams, code blocks, toolbars/spreadsheets**. So identify *what*
   overflows: `--viewport 320x900 --eval "return [...document.querySelectorAll('*')].filter(e=>e.scrollWidth>document.documentElement.clientWidth+5&&e.offsetParent).map(e=>e.tagName+'.'+(e.className||'').slice(0,30)).slice(0,10)"`.
   - General layout (header, nav, product grid, article text) overflowing → **REPRODUCED** (1.4.10 fail).
   - Only an exempt element (a `<table>`, a map canvas) overflowing while the page chrome reflows → **NOT REPRODUCED** (exempt). Don't fail a wide data table.
4. **Vision** — `--viewport 320x900 --shot reflow.png`, read it: does the page
   *chrome* collapse to one column, or stay wide/clipped? Confirms the number and
   shows whether the overflow is the layout or an exempt widget.

## Procedure — dismissible / hoverable / persistent (1.4.13), behavioral
1.4.13 has **three** conditions — check all three (a fail of any one fails the SC):
4. **Dismissible** — hover/open the menu (dispatch `mouseover` / act), then
   `press('Escape')`; assert it closed *without* moving pointer/focus. Stays open /
   no keydown handler → **REPRODUCED** (Temu Categories mega-menu). (Exception:
   content that's an input error or doesn't obscure other content is exempt.)
5. **Hoverable** — trigger a hover tooltip, then move the pointer from the trigger
   into the tooltip; it must not vanish mid-transit. Tooltip with no bridge / no
   `pointer-events` / not `outside:true` (Vanguard fund-flows Highcharts) →
   **REPRODUCED**.
6. **Persistent** — the content must stay visible until the trigger is removed,
   the user dismisses it, or its info is no longer valid. A tooltip on a short
   auto-timeout that vanishes while the trigger is still hovered/focused →
   **REPRODUCED**.

## Classify
- **REPRODUCED** — 320px horizontal overflow with content rendered; or menu/tooltip not Escape-dismissible / not hoverable.
- **PARTIAL** — hover/Escape behavior needs JS the snapshot won't run; report the static config (no keydown listener, default Highcharts tooltip).
- **NOT REPRODUCED** — reflows to one column; menu dismisses and tooltip is hoverable.

## Limits
Reflow is fully deterministic and the strongest signal in cat_8 — trust the
numbers + screenshot. Hover/Escape are dynamic; on `noscript` serves they can't
be exercised. Make sure the page actually rendered at 320px (`bodyLen>0`) before
trusting the overflow number.
