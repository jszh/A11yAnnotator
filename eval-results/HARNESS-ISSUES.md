# Harness / methodology audit — types of inconsistency in the eval

Systematic re-examination of all 56 pages' `collect.json` / `drive.json` / `results.json`
plus targeted re-launches (CDP `forcePseudoState`, real-keyboard arrow probes, spacing
measurement, screenshot diffs) to find **types** of issues — not every instance. Each type
below was confirmed on ≥3 different pages (or all instances, if fewer).

Severity legend: ⛔ produces wrong verdicts at scale · ⚠️ produces wrong verdicts in a
bounded subset · ℹ️ limitation that was mostly handled / inherent.

---

## T1 ⛔ Focus-visibility false positives — outline read while UNFOCUSED (`computed-only` fallback)
**Cause:** harness + prompt.
When the focused screenshot can't be captured (element off-screen, or the focused clip
shifts so it no longer matches the baseline clip) **and** the local Tab walk never reached
the element (`localTabWalk.reachedByTab=false`), `drive-page.js` falls back to
`getComputedStyle(el).outline` — but reads it while the element is **not** keyboard-focused.
A `:focus-visible { outline … }` rule is therefore invisible to it, so the element looks
like it has no indicator and the agent records **2.4.7 REPRODUCED ("no focus indicator")**.

- 461 focus REPRODUCED verdicts; **118 are `computed-only`**, of which **30 had
  `reachedByTab=false`** (the unfocused-read subset).
- The AGENT-PLAN told agents to "lean on … computed outline" for `computed-only` without
  warning that computed outline is only meaningful while the element is actually focused.

**Verified false positives** (forced `:focus-visible` via CDP, measured the real ring):
| Page | el | recorded | actual focused ring |
|---|---|---|---|
| Apple/Yahoo | #7 menuitem | "no indicator" | `outline: auto 1px #99c8ff`, **6.9%** diff |
| Apple/Yahoo | #10 button | "no indicator" | `outline: solid 2px #6489c6`, **4.8%** |
| Google Drive | #2 link | "no indicator" | `outline: solid 1px #4d90fe` (Google blue), **5.2%** |

Not universal — Reebok #6/#8 genuinely have no ring even when `:focus-visible` is forced
(diff 0%), so those REPRODUCED verdicts are correct. So this is a **partial-rate false
positive concentrated in the 30 `reachedByTab=false` computed-only verdicts**.
*Fix:* when no focused shot exists, read the outline **with the focus-visible pseudo-state
forced** (CDP `CSS.forcePseudoState`), or downgrade to PARTIAL — never assert "no indicator"
from an unfocused computed read.

## T2 ⚠️ Over-confident 2.1.1 "keyboard-inoperable" on composite / JS-driven widgets
**Cause:** harness + prompt.
Three compounding limits, none distinguishable from a real defect by the harness:
1. **Roving tabindex is correct design** — only the *active* tab in an ARIA tablist is in the
   Tab sequence (others are `tabindex=-1`, reached by arrows). So `reachedByTab=false` on a
   non-active tab is **expected**, not a violation. The plan's rule "`reachedByTab:false` →
   2.1.1 candidate" has no carve-out for this.
2. **Synthetic probes** — `keyboard`/`arrowKeys` use `el.dispatchEvent(new KeyboardEvent…)`
   (untrusted); real widgets frequently ignore these, so `respondsToArrows=false` is
   unreliable.
3. **Offline snapshot** — JS-app widgets' handlers often aren't wired offline, so even *real*
   trusted arrow keys do nothing — the harness can't tell "broken" from "not hydrated."

Recorded as confident **REPRODUCED** rather than PARTIAL on: Google Drive #20/#21 (tabs),
Temu #7 (tab, `tabindex=-1`), Zillow #14 (tab), Reebok #12/#13, Calendly #2.
I re-tested Google Drive and Temu with **real** (trusted) arrow keys — still no response —
confirming the snapshot can't exercise them, i.e. the honest verdict is **PARTIAL**, not a
definite failure. *Fix:* treat `tab`/roving-tabindex specially; never derive 2.1.1 from
synthetic-event non-response or from a JS-app snapshot that isn't hydrated.

## T3 ⚠️ Target-size (2.5.8) over-reporting — raw bounding-box height, WCAG exceptions ignored
**Cause:** inaccurate skill / prompt.
The plan instructs `box.w/ box.h < 24 → 2.5.8`. WCAG 2.5.8 exempts targets via the
**spacing** exception (a 24px circle on each undersized target doesn't overlap a neighbor)
and the **inline** exception. The heuristic uses bounding-box *height* and never evaluates
spacing.

- **29 of 75 (39%)** 2.5.8 REPRODUCED findings are footer/nav text links failing on
  **height only** (w≥24, h<24): "Blog", "Gift Cards", "Careers", "Privacy",
  "Microsoft Terms of Sale", "licenses", "Size Guides", etc.
- **Verified false positive** on Home Artera: footer links are 15px tall but the nearest
  target **center-to-center distance is 31–36px (≥24)** → spacing exception applies →
  they **PASS** — yet all were marked REPRODUCED.
- Pages: Home Artera, Blue Apron, Microsoft Store, NFL, Kahoot, Zillow.
- (axe's own `target-size` *does* account for spacing; findings the agent backed with axe —
  e.g. ix, BuzzFeed — are more credible than the box.h<24 ones.)

## T4 ⚠️ Large-text contrast threshold bug — 14**px** used where WCAG means 14**pt** (18.66px)
**Cause:** harness arithmetic bug — [`scripts/eval-page.js:198`](../scripts/eval-page.js#L198).
```
const large = rec.fontPx >= 18.66 || (rec.fontPx >= 14 && +(dom.fontWeight) >= 700);
```
WCAG "large text" for bold is **≥14pt = 18.66px**, not 14px. So **bold text between 14px and
18.66px is given the lenient 3.0:1 threshold instead of 4.5:1** — **66 elements** affected.
Of those, 3 have `contrastSolid` in [3, 4.5):
- ⛔ **Domino's "JOIN NOW"** 16px bold, **4.33:1** → marked **NOT REPRODUCED** — a genuine
  4.5:1 failure **masked** by the bug (false negative).
- boohooman "SALE" (4.0:1) and ix (3.36:1) — same bug, but those agents spotted the 14pt
  rule themselves and overrode to REPRODUCED.
*Fix:* change `>= 14` to `>= 18.66` (14pt). Note the masked-failure direction (false
negative) is the opposite of T1/T3.

## T5 ℹ️ Container-level contrast is misleading (text lives in a child)
**Cause:** harness data-source limit (mostly compensated by agents).
`collect.contrastSolid` uses the element's **own** computed `color`, not the child node that
holds the visible text, so a container reports a passing ratio while the real text fails:
Reacher div `contrastSolid=19.2` but its child H4 "Retain" is **2.38:1**; Notion parent vs
child span (`rgba(0,0,0,0.54)`); ix button vs its `cli/` prefix span (3.36:1). Agents
**mostly caught these** by recomputing child/pixel contrast (18 such overrides) — good — but
it shifts contrast accuracy onto manual agent alpha-compositing, which is a variability/error
surface rather than a measured value.

## T6 ℹ️ DOM / xpath instability between the two browser loads
**Cause:** harness (snapshot non-determinism) + a few over-confident agent verdicts.
Lazy/hydrated content shifts the DOM between the `collect` load and the `drive` load (and on
re-load), so an element resolves statically but is `notFound` dynamically. 16 drive-notFound;
Zillow #14 vanished even on a fresh reload during this audit. Handling was *mostly* honest
(PARTIAL/N/A), but a few **dynamic** verdicts were asserted with no drive evidence:
- ⛔ **Newegg #5** focus-management = **REPRODUCED** (definite defect on an element the driver
  never exercised).
- **Macy's #8** keyboard / focus / focus-visibility = **NOT REPRODUCED** (definite "no
  problem" with no dynamic evidence). Both should be PARTIAL.
(Their *name-role* verdicts are fine — `collect` resolved them.)

## T7 ℹ️ noscript SSR-vs-live divergence (acknowledged, but findings read as "the page")
**Cause:** inherent fidelity limit.
For the 10 noscript pages that blank on hydration, **both** `collect` and `drive` evaluate the
SSR / no-JS DOM. Dynamic checks correctly go PARTIAL (BBC: 1 REPRODUCED / 34 PARTIAL), but the
**static** findings — names, contrast, target-size, structure — describe the SSR rendering,
which can differ substantially from the hydrated page users actually see (Nordstrom 36
REPRODUCED, Spirit 33, Fed10 31 on SSR markup). Honestly flagged in SUMMARY/notes; can't be
verified offline. Worth a caveat that these verdicts are "for the no-JS rendering."

---

## Checked and found NOT to be a problem (validated)
- **Focus-diff threshold (1.5%).** Borderline positives (diff 1.5–1.9%, marked
  "indicator present / NOT REPRODUCED") were spot-checked on the shot pairs — Newegg #3 has a
  real dashed ring, o11 #5 a faint gray ring — so they are genuine thin indicators. The
  mandated eye-check on positives held; threshold is generous but validated.
- **Focus SC mapping is consistent** — 206× 2.4.7 (AA), 5× 2.4.13 (AAA); no cross-page drift.
- **name-role evidence matches the data** — sampled REPRODUCED name findings all cite real
  `axName` from collect (literal-alt-as-text, label-content-name-mismatch, a 2000-char post
  used as a button name); no hallucinated/empty-vs-named contradictions found.
- **Announcement synthetic-click false-negative** — only 1 candidate (Opendoor #3); not a
  systemic type.

## Priority fixes (by blast radius)
1. **T8** screenshot crop drift — the largest single reliability hole (see below).
2. **T4** one-line bug (`14 → 18.66`) — also re-screen the 66 affected elements.
3. **T1** force `:focus-visible` for the 30 unfocused-read focus verdicts (or PARTIAL them).
4. **T3** add the 2.5.8 spacing/inline exception (or trust axe's `target-size`) — re-screen
   the 29 height-only text-link findings.
5. **T2** roving-tabindex carve-out + PARTIAL (not REPRODUCED) when only synthetic events or
   an un-hydrated snapshot were available.
6. **T6** never assert a definite *dynamic* verdict on a drive-`notFound` element → PARTIAL.

---

# Round 2 — issues surfaced by reading the agents' own reasoning (`notes.md`)

689 problem bullets across 51 `notes.md` files. These are mostly harness limitations the
agents *documented* — useful because they show where the harness fed bad data, regardless of
whether the agent caught it.

## T8 ⛔ Screenshot crop drift / scroll desync — the single biggest reliability hole
**Cause:** harness. The per-element appearance and focus screenshots frequently capture the
**wrong region**. The clip is computed from `getBoundingClientRect()` but the screenshot is
taken at a different scroll position (sticky headers, focus-induced scroll, deep-below-fold
elements), so the crop shows unrelated content. When both the unfocused and focused crops
land on the same wrong region, `visibleDiffPct=0` — which the agent reads as "no focus ring."
- **294 of 467** captured focus shots (`method=real-tab-diff`) have `visibleDiffPct===0`;
  **50 pages** affected. Of the 90 that became **focus-visibility = REPRODUCED**, **40 had a
  computed-while-focused `outline:auto …`** (a *real* rendered ring) — 15 with the exact
  browser-default ring `rgb(0,95,204)`.
- **Confirmed false positive:** Home Panera #15 ("Term Of Use") — driver `diff=0` → agent
  said "no ring," but forcing `:focus-visible` on a fresh load gives **8.44%** (real ring).
  Agents *documented* the same wrong-crop on Newegg el7, Opendoor el12/el13, Snowflake
  (el1/4/6/15-18), Openroll el10/el12, NY Mag (el1/3/8/9/11), Amazon (el3/14/17/18/19),
  Domino's el12, GrazeMate el18 — ~10 pages in their own words.
- **Compounding agent error:** on BuzzFeed #9 the agent *explicitly wrote* "the crop shows the
  emoji strip, not the thumbnail" and still issued REPRODUCED, discounting the `outline:auto`
  evidence. The correct move when the crop is wrong is PARTIAL or "ring present," never "no ring."
- **Interacts with the 1.5% threshold** (area-dependent): a real 1px ring around a large
  element is <1.5% of the crop → reads as "no ring" even with a *correct* crop (likely
  BuzzFeed #9, Apple #2, which tested ~0% even when forced).
*Fix:* take the focused screenshot only after confirming the element is scrolled to the same
clip as the baseline (re-read the rect immediately before each shot; abort if it moved); and
when the diff is ~0, defer to the **computed-while-focused** outline — treat any non-`none`
outline (especially `outline:auto`/UA-default) as ring-present.

## T9 ⚠️ VSR "document" spurious announcement after click-induced navigation
**Cause:** harness. After a click that navigates / re-renders (or after a Pass-B reload
re-`start()`s the virtual SR), `vsr.lastSpokenPhrase()` returns the document-root phrase
**"document"**, which the harness records as `activate.vsrAnnouncement`. It looks like the
element announced something when it didn't. **LinkedIn 14/14 activations, BuzzFeed 5,
Corporate 6** (note: BuzzFeed/Corporate had *zero* reloads — so this is navigation-driven, not
purely reload-driven). Agents mostly saw through it ("document (page-level, expected)").
*Fix:* filter root/landmark phrases (`document`, `main`, `banner`…) out of `vsrAnnouncement`;
stop the VSR before reload and restart cleanly; baseline `speechBefore` after the VSR settles.

## T10 ⚠️ VSR stale / sticky `lastSpokenPhrase`
**Cause:** harness. When a tab/SR stop surfaces nothing, `lastSpokenPhrase()` returns the
**previous** stop's phrase, so `tabWalk`/`srWalk` `speech` fields mis-attribute one element's
announcement to another (Reddit: `speech='link, Home'` flagged as "stale SR announcement from
prior stop"; 5 pages have srWalk runs where ≤⅓ of phrases are unique). Pollutes the
reading-order and dynamic-announcement evidence. *Fix:* clear/sentinel the phrase between
stops and only attribute speech that changed.

## T11 ⚠️ Effective-background walk picks the wrong backdrop (contrast false alarms)
**Cause:** harness (extends T5). `collect`'s `effBg` walks ancestors to the first non-
transparent background, which misses elements rendered over **overlays / cards / z-index /
transformed** layers. Produces wildly wrong contrast: **Calendly el21** `contrastSolid=1.05`
vs real **11.98** (button over a dark card the walk didn't see); **Rotten Tomatoes el17**
`3.24` vs real **14.06** (picked an ancestor bg the element doesn't actually sit on). Agents
caught both via `--pixel-contrast`. *Fix:* prefer pixel sampling whenever the element's own
bg is transparent, instead of trusting the ancestor walk.

## T12 ⚠️ Offline media artifacts poison name/contrast/focus
**Cause:** snapshot fidelity. Video/media can't load headless/offline, so (a) the browser's
fallback text **"Unable to play media."** becomes the element's `axName` (o11 el15, Doomersion
el11, Vanguard `object`) → bogus 1.1.1/4.1.2 name judgments; (b) shots are **black frames**
(LinkedIn el8/el9 video controls, Doomersion el11) → `diff=0` focus artifacts and useless
contrast crops. *Fix:* detect the UA media-error name and black-frame crops; route those
sub-verdicts to PARTIAL with the reason.

## T13 ⚠️ Global tab-walk cap + focus-trap exhaustion → incomplete keyboard/order evidence
**Cause:** harness. The global `tabWalk` is capped (default 50; lower on some runs) and is
consumed by traps, so deep elements are never reached — feeding false "not keyboard-reachable"
signals (ties into T2). Wayfair el13 sits at focus index **315** and was missed even by the
local cap (300); Calendly's >50 focusables overflow the cap; **justgalsbeingchicks**' global
walk (cap 22) was entirely consumed by the `shreddit-player` trap so most feed links and all
sidebar disclosures were never reached. *Fix:* raise/uncap with a time budget; on
`trapDetected`, restart the walk *past* the trap; rely on `localTabWalk` for reachability
rather than presence in the capped global walk.

## T14 ℹ️ Cookie/consent-overlay contamination
**Cause:** snapshot/harness. Third-party consent layers (OneTrust, cmplz, etc.) (a) **darken
every screenshot** — Home Artera's el1–el21 all render near-black from the cookie banner,
voiding all visual checks; (b) inject **duplicate headings** into `structure.headings`
(Vueling h3/h4 "Your Privacy"…, Blue Apron "Privacy Preference Center", Calendly) → false
heading-order/duplicate-heading findings attributed to the page; (c) feed the forms probe (see
T15). *Fix:* dismiss/!hide known consent containers before collection, or exclude them from
structure/shot/forms analysis.

## T15 ℹ️ Forms probe submits junk forms
**Cause:** harness. The error-on-submit probe blindly submits the first 4 `<form>`s, which on
many pages are cookie/modal/hidden/0-field forms (Reebok forms[0-2] = 0 fields; BuzzFeed &
Domino's have no real form so the cookie buttons yield nothing) → meaningless
`nativeValidationOnly` results. *Fix:* skip forms with no visible editable fields; target the
form that actually owns the sampled field.

## T16 ℹ️ Sampling coverage gap (methodology, not a wrong verdict)
Real failures exist **outside** the ~21 sampled elements/page and surface only in `notes.md`,
so they're never counted: justgalsbeingchicks ad-overlay unnamed links (4.1.2), Reddit
`shreddit-progress-bar` invalid ARIA (4.1.2), LinkedIn off-screen Volume slider (2.4.11),
Vanguard `object` VPAID with no name. The tallies undercount by construction. *Fix:* note
explicitly that counts are per-sample, not per-page-exhaustive (axe already sees these — could
report axe-only-on-unsampled separately).

## On the specific "recovered (reloaded) before N" note (the original question)
The reload mechanism itself is **mostly benign**: Pass A (shots, tab/SR walks, focus
indicators) runs with **no reloads**, and Pass-B reloads hand each element a **clean** page,
so per-element appearance/keyboard/focus data is fine. The note's "may have prevented full
state observation" **overstates** the risk and, surfaced as a generic bullet, invites the
evaluating agent to distrust valid data (over-PARTIAL). Meanwhile it **missed** the one real
reload-linked corruption — the VSR "document" artifact (T9). Takeaways: (1) the raw "reloaded
before N" list is low-value to the LLM and should be dropped or downgraded; (2) what *should*
reach the LLM is the **specific** affected signal (e.g. "announcement capture unreliable
here"), and better still the harness should **fix** the signal (stop/restart VSR cleanly)
rather than offload a vague caveat; (3) the genuinely missing reload is for **non-navigational
mutations** — a click that opens a menu/overlay without changing the URL is *not* reloaded, so
the next element can be probed against a contaminated page (latent, low observed incidence).
