# case-05 — RTL Arabic wordmark link with a non-exempt "Home" descriptor (logo-vs-beyond-logo inside one control)

## Scenario
A mobile banking wallet ("نسيج" / Naseej) puts its home link in the app shell as a single
`<a href="/wallet">` containing **two** visible strings. The first is the Arabic wordmark
"نسيج" — the bank's logotype — set in brand "sky" (`#6cbfb2`) on white, computed contrast
~**2.16:1**. As the logotype, that string carries no 1.4.3 contrast requirement, so it is
left untouched. Beside it the team appended a small descriptor "الرئيسية" ("Home") so users
can tell where the link goes; it is set at `#9aa7b0` on white, **13px, normal weight**,
computed contrast ~**2.46:1**. That descriptor is *not* the logo or logotype — it is
informative wayfinding text — so the brand exemption does not reach it. Because it is
normal-size text, the **4.5:1** threshold applies, and ~2.46:1 fails. The page **fails**.

## Attribute tuple
- **content-domain:** online banking / fintech (mobile wallet)
- **UI-component/pattern:** app-shell home link whose label mixes the wordmark with a separate destination descriptor
- **host-language construct:** `<a class="brand">` wrapping `<span class="mark">` (logotype) + `<span class="dest">` (non-logo text)
- **locale/i18n:** ar (RTL, Arabic script)
- **failure-mechanism:** informative non-logo text smuggled in beside the wordmark and wrongly assumed to inherit the logotype exemption — the "beyond logo and logotype" boundary, here inside an interactive control

## Developer persona
A fintech team localized their app for the Gulf market. They kept the established "the logo
is the home button" pattern and the pale brand color for the wordmark, and — for usability —
added a small "الرئيسية" descriptor next to it inside the same link. Whoever picked its grey
assumed that anything sitting in the brand lockup is "part of the logo" and therefore exempt.
The boundary they missed: the exemption stops at the logo/logotype itself; the appended
functional label is ordinary informative text. The RTL/non-Latin context adds a second blind
spot — reviewers and tools are weakest at telling which Arabic string is the brand mark and
which is a plain label.

## Element / selector carrying the issue
`.shell .appbar a.brand .dest` — the descriptor "الرئيسية" at `color:#9aa7b0` on `#ffffff`
(~2.46:1), 13px / weight 400 (normal-size text, so the 4.5:1 bar applies). The sibling
`a.brand .mark` ("نسيج", ~2.16:1) is the exempt logotype and is NOT the defect.

## Exact accessibility mechanism
A low-vision user of the wallet looks at the home control to confirm where it goes. The
wordmark "نسيج" is faint, but as the logotype it is exempt by SC 1.4.3 — that is by design
and not the problem. The thing they actually need to read to operate the control, the
"الرئيسية" / "Home" descriptor, renders at ~2.46:1 and is illegible. That descriptor is not
the logo or logotype; it is informative interactive text, which the exemption does not cover:
"Corporate identity or brand guidelines beyond logo and logotype are not included in the
exception." It is normal-size text (13px, normal weight — below the 18.66px-bold / 24px-
regular large-text boundary), so the applicable threshold is 4.5:1, and ~2.46:1 fails. The
defect is correctly scoped to the descriptor; the wordmark is correctly left alone.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The wordmark "نسيج" is an exempt
logotype (no contrast requirement, even as a link). The adjacent "الرئيسية" descriptor is
informative non-logo text the exemption does not reach; it is normal-size text, so the
4.5:1 threshold applies, and ~2.46:1 fails AA.

## Why automated tools miss it
A scanner computes both ratios (~2.16:1 for the wordmark, ~2.46:1 for the descriptor) but
cannot tell which span is the logotype and which is informative text — so it cannot reach the
correctly *scoped* verdict: leave the wordmark alone, fail the descriptor. The hard judgments
are human and stack: (1) recognizing across Arabic script that "نسيج" is the brand wordmark
(exempt) while "الرئيسية" is an ordinary functional label (not exempt), and (2) holding the
two strings to different bars inside one link. A reviewer who reasons "it's all in the brand
lockup, so it's exempt" wrongly suppresses the flag — the trap. axe/WAVE/Lighthouse model
neither the logotype identity nor the logo-vs-beyond-logo boundary, which ACT rules 09o5cg /
afw4f7 set aside as an assumption ("this rule does not take logos or brand names into
consideration"). Note this case does NOT rely on the contested claim that interactivity
revokes the logo's own exemption; the failure rests entirely on plainly non-exempt text.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — Intent
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Corporate identity or brand guidelines beyond logo and logotype are
> not included in the exception."
>
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — Intent (large-text threshold)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Text that is larger and has wider character strokes is easier to read at lower contrast. The contrast requirement for larger text is therefore lower."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "Normal text: **4.5:1**; Large-scale text (≥18pt or ≥14pt bold): **3:1**."
