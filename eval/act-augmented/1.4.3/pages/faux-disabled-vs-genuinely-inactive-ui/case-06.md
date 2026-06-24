# case-06 — RTL e-gov: `aria-disabled="true"` link that still fires (programmatic disabled lie)

## Scenario
An Arabic (RTL) e-government residency-renewal portal. The "تحميل الإيصال" (Download receipt)
control is an `<a href>` link styled dim grey (`#9c9c9c` on `#f4f4f4` ≈ 2.5:1) that carries
`aria-disabled="true"` — yet its `href` is live and a click handler opens the receipt.
`aria-disabled` is only a *claim*; nothing here blocks activation, so the control is operable. A
control that fires is not genuinely inactive, so the exemption does not apply and the dim Arabic
label fails 4.5:1. A truly-inert twin, the "طباعة" (Print) `<button disabled>` in the same grey,
IS exempt — identical look, opposite verdict.

## Attribute tuple
- **Content domain:** Government / public services — residency-permit renewal
- **UI component / pattern:** action bar mixing a live link mislabeled `aria-disabled` with a genuinely disabled native button
- **Host-language construct:** `<a href onclick aria-disabled="true">` (ARIA state asserted but not enforced) vs. `<button disabled>`
- **Locale / i18n:** Arabic (`lang="ar"`, `dir="rtl"`) — label text is `تحميل الإيصال`
- **Failure mechanism:** programmatic disabled assertion that is false — `aria-disabled` set on an operable link, so the sub-4.5:1 label is wrongly assumed exempt by anyone trusting the ARIA state

## Developer persona
A government-contractor dev copied a reusable "disabled link" pattern that adds `aria-disabled`
and a grey class but never prevents navigation (links cannot truly be disabled in HTML, and they
never added the JS guard). They applied it to "Download receipt" to mute it visually next to the
primary action, not realising the link still navigates and that `aria-disabled` without a guard is
a lie about operability.

## Element / selector carrying the issue
`#receiptLink.act.dim[aria-disabled="true"]` — the operable "تحميل الإيصال" link. Its dim Arabic
label is the failing content. The exempt twin is `#printBtn[disabled]` ("طباعة").

## Exact accessibility mechanism
A screen reader hears "تحميل الإيصال, dimmed/unavailable, link" because of `aria-disabled="true"`
— yet activating it (Enter or click) runs `openReceipt()` and opens the receipt. The ARIA state
contradicts the behavior: the control IS available for interaction, so it is an active component
and 1.4.3 governs its label. At ≈2.5:1 the Arabic text fails. The "طباعة" button, by contrast, is
natively `disabled` (truly inert, removed from the tab order) and its identical grey is legitimately
exempt. The verdict for the two same-colored controls is opposite and is fixed only by driving
each one.

## Expected ACT-style outcome
**failed** (SC 1.4.3). An operable link's label text is below 4.5:1; its `aria-disabled` is false.

## Why automated tools miss it
This is the hardest direction for tools: the markup *explicitly declares* `aria-disabled="true"`,
so any scanner that trusts ARIA state will treat the link as inactive and skip its contrast
entirely — a clean false negative. But `aria-disabled` does not make a link inert; only by
activating the link and seeing the receipt open does one learn the claim is false and the control
is in scope. No static analyzer drives the link to detect the lie, and the well-formed RTL markup
trips no linter.

## Citation
**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`)
> "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements. An inactive user interface component is visible but not currently operable."

**Reference:** Trusted Tester v5.1.3 — SC 1.4.3 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "EXCLUDE text that is: ... For inactive (disabled) user interface components"
