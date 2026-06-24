# case-02 — Custom `div role="button"` claims `aria-disabled="true"` but still fires

## Scenario
A mobile-banking "Send money" screen (Halcyon Bank). The pay control is a custom
`<div role="button" tabindex="0">` painted pale grey (`#a4a4a4` on `#eeeeee` ≈ 2.2:1). The author
set `aria-disabled="true"` on it "while we re-check your balance," intending it to be inert until a
balance promise resolves — but the `keydown` (Enter/Space) and `click` handlers were never guarded
against that flag. So the control STILL fires: focusing it and pressing Enter submits the transfer,
the balance drops, and a receipt appears. `aria-disabled` is a CLAIM, not enforcement — it does not
remove the element from the focus order and nothing here blocks activation. The control is therefore
operable, the inactive-UI exemption does not apply, and its ≈2.2:1 label fails 1.4.3.

## Attribute tuple
- **Content domain:** consumer fintech — mobile-banking funds transfer
- **UI component / pattern:** APG-style custom button (`div[role=button][tabindex=0]`) — NOT a native control
- **Host-language construct:** `role`/`tabindex` + `aria-disabled="true"` (a *claim* of inactivity) + unguarded JS `keydown`/`click` handlers
- **ARIA anti-pattern:** `aria-disabled="true"` with no behavioral enforcement (the "aria-disabled lie")
- **Locale / i18n:** en
- **Failure mechanism:** a control asserts `aria-disabled` so scanners trust it as inactive (exempt), yet it remains keyboard- and pointer-operable, so its sub-4.5:1 label is in scope and wrongly skipped

## Developer persona
A front-end engineer built a design-system "ghost button" as a `div` for pixel-perfect styling. To
gate it during an async balance re-check they flipped `aria-disabled="true"` and the muted/ghost
color token, planning to early-return from the handlers once the guard was wired. They shipped the
ARIA state and the dim styling but never added the `aria-disabled` guard in the listeners, so the
muted control is fully live the entire time.

## Element / selector carrying the issue
`#sendBtn[role="button"][tabindex="0"][aria-disabled="true"]` — the "Send transfer" div. Its label
text is the failing content; the unguarded handlers make it operable despite the `aria-disabled`
claim.

## Exact accessibility mechanism
`tabindex="0"` keeps the div in the focus order (an `aria-disabled` element is *not* removed from
the tab sequence), and the `keydown` handler fires on Enter/Space (`e.preventDefault()` then
`send()`), as does the `click` handler. The transfer posts, the balance changes from `$2,480.00` to
`$2,330.00`, and the receipt is announced. Because the component is available for interaction, 1.4.3
applies and the ≈2.2:1 label must reach 4.5:1; it does not, so the page fails. The genuinely-inert
twin beside it ("Schedule for later," native `<button disabled>`, identical grey) is NOT focusable
and never fires — it IS exempt. Same pixels, opposite verdict: the distinction is behavioral.

## Expected ACT-style outcome
**failed** (SC 1.4.3). An operable custom button — `aria-disabled` notwithstanding — with label text
below 4.5:1.

## Why automated tools miss it
Verified against axe-core 4.12.1 `color-contrast` run on this exact file: the page produces **no
violation and no incomplete** result. Axe trusts the `aria-disabled="true"` ARIA state and treats
the control as a disabled/inactive widget, so the failing label is never measured — a clean
automated pass that is WRONG. (Strip the `aria-disabled` and axe immediately flips to a hard
color-contrast violation on the identical pixels, proving the verdict turns entirely on the ARIA
claim.) No scanner validates the claim, because doing so requires driving the control: focus
`#sendBtn`, press Enter, observe the balance drop and receipt — i.e. determine operability by
interaction, which static analyzers do not do. This is the inverse of an over-flagging tool: here
the tool is *silenced* by an ARIA assertion the markup does not back up behaviorally.

## Citation
**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`), section "Inactive User Interface Components"
> "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements. An inactive user interface component is visible but not currently operable. An example would be a submit button at the bottom of a form that is visible but cannot be activated until all the required fields in the form are completed."

**Reference:** Trusted Tester v5.1.3 — SC 1.4.3 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "Identify **ALL text AND images of text**. **EXCLUDE** text that is:"
> "- For inactive (disabled) user interface components"
