# case-02 — Paywall "Continue reading" text link with onfocus="if(this.blur)this.blur();" (F55 Example 3)

## Scenario
A newspaper article hits its free-article paywall. The call-to-action is a real
`<a href="/subscribe">Continue reading — subscribe for $1</a>`. A legacy template helper
adds an inline `onfocus="if(this.blur)this.blur();"` handler to the link. When a keyboard
user Tabs to it, focus is removed the instant it arrives, so the (valid) `:focus-visible`
yellow ring never paints and the subscribe link is reachable only with a mouse.

## Attribute tuple
- **content-domain**: news / long-form editorial (premium subscriber gate)
- **UI-component/pattern**: paywall CTA — descriptive text hyperlink
- **host-language construct**: inline `onfocus` guard expression on an `<a href>`
- **locale/i18n**: en
- **failure-mechanism**: F55 — `onfocus="if(this.blur)this.blur();"` drops focus on receipt (canonical F55 Example 3)

## Developer persona
An agency contractor maintaining the paper's aging CMS theme found that on some legacy
browsers the subscribe link kept a "sticky" focus outline after the modal closed. Rather
than fix the modal, they copied the classic F55 guard expression
`onfocus="if(this.blur)this.blur();"` into the shared `buildSubscribeLink()` template helper,
so it now decorates every paywall CTA site-wide. The guard (`if(this.blur)`) was meant to
look defensive and "safe," which is exactly why it survived review.

## Element / selector carrying the issue
- FAIL: `.gate .paywall a.cta[href="/subscribe?ref=harbor-rail"]` — `onfocus="if(this.blur)this.blur();"`.

## Exact accessibility mechanism
A keyboard user reading the gated article tabs from the utility nav into the paywall and
presses Tab to reach "Continue reading — subscribe for $1". The link receives focus, fires
its `focus` event, and the inline handler immediately calls `this.blur()`, dropping focus
in the same event-loop tick. The `a.cta:focus-visible` rule (yellow outline + highlight)
is well-formed but never renders, because the link is no longer the focused element when
the browser paints. The keyboard user perceives the focus indicator jumping straight from
the article to whatever follows, with no stop on the subscribe link, and cannot activate
the only path past the paywall without a pointing device. This is the F55 failure: focus
does not remain on the element when received.

## Expected ACT-style outcome
**failed** — focus does not remain on the subscribe link after it is received; no visible
focus indication is ever shown for it (F55).

## Why automated tools miss it
The link is a genuine `<a>` with `href`, descriptive visible text, and a valid
`:focus-visible` indicator in CSS — every static, name/role/markup-based check (axe, WAVE,
Lighthouse) passes, and there is no automated 2.4.7 rule. The failure is the `onfocus`
expression, whose effect only exists in time: focus is granted then revoked within one
tick, so any single snapshot of the page (focused or not) shows the link without a ring,
identical to an un-tabbed state. Detecting it requires executing the Tab traversal and
confirming the indicator never persists on the link — the human/dynamic procedure F55
prescribes, not something a DOM/CSS scan reproduces.

## Citation
> **WCAG Techniques — F55: Failure of Success Criteria 2.1.1, 2.4.7, 2.4.13, and 3.2.1 due to using script to remove focus when focus is received**
> Example: `<a href="link.html" onfocus="if(this.blur)this.blur();">Link Phrase</a>`
>
> Description: "Content that normally receives focus when the content is accessed by keyboard
> may have this focus removed by scripting... this practice removes focus from the content
> entirely, which means that the content can only be operated by a pointing device such as a
> mouse."

> **WCAG 2.2 Understanding 2.4.7 — Intent of Focus Visible**
> "The purpose of this success criterion is to help a person know which element has the
> keyboard focus." ... "The focus indicator must not be time limited, when the keyboard
> focus is shown it must remain."
