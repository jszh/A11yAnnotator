# case-03 — Password strength meter goes red; rules conveyed by colour only, no text suggestion

## Scenario
A SaaS signup card. The user typed the password **`summer24`**; client-side JS classified it as
**weak**, lit only the first of four meter segments in red, turned the field border red, and
**silently blocked the submit** (the "Create account" button does nothing while the password is
weak). The rules that would make the password acceptable are fully knowable — at least 8 chars,
mixed case, a digit, a symbol, and not a common word-stem — yet **none of them appear in text.**
The red meter segment + red border are the entire "guidance" on how to correct the input.

## Attribute tuple
- **content-domain:** SaaS analytics / B2B trial signup
- **UI-component/pattern:** APG `meter`/progress-style strength indicator beneath a password field
- **host-language construct:** `<input type="password">` + `<div class="meter" aria-hidden="true">` driven by JS
- **locale/i18n:** en-US
- **failure-mechanism:** input error detected (submit blocked) with a knowable correction (the rules), conveyed only by colour/fill; no text rules — G84/G85 "in text" suggestion limb

## Developer persona
A frontend engineer cloned a popular "password-strength-meter" CodePen that ships exactly four
coloured bars and no copy. He wired it to gate the submit so weak passwords can't get through.
Design told him the meter looked cleaner without a "wall of requirement text," so he deleted the
rules list that the original demo had in a comment, trusting "red bar = users will figure it out."
He marked the meter `aria-hidden="true"` after an audit complained the empty segments were noisy
to a screen reader — which removed the only (visual) cue from the accessibility tree entirely.

## Element / selector carrying the issue
`.group.weak` wrapping `input#pw` plus `.meter[data-level="weak"]`. The single red segment and the
red field border are the sole carriers of "make the password stronger," and the meter is
`aria-hidden="true"` so even that visual cue is absent from the accessibility tree. No text states
the rules anywhere in the DOM.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user tabs to the password field and hears "Choose a password, edit, password,
summer24." The meter is `aria-hidden="true"`, so its colour level is not exposed at all; even the
visual signal a sighted user gets (one red bar) is invisible to AT. Pressing "Create account"
does nothing — `submit` is silently `preventDefault()`-ed while weak — with **no** announcement,
no live region, no error text, no `aria-invalid`. So a blind user experiences a form that simply
will not submit and is given zero text guidance about why or how to fix it; even a sighted user is
told only "weak" via colour, never the rules. The suggested correction is entirely knowable but
is provided through colour alone, which G84 and G85 say does not satisfy the SC — a text
description of the required format/values is required.

## Expected ACT-style outcome
**failed** — input is rejected and the correction is knowable, but the rules/suggestion are
conveyed by colour only (and the meter is hidden from AT), with no text description.

## Why automated tools miss it
- The password field has a real `<label for>`, a valid `type="password"`, and the meter is
  `aria-hidden` so no broken-widget rule fires. Nothing is empty or malformed — linters pass.
- The strength gate lives in JS, not in HTML constraints, so `validity.valid` is `true` and the
  accessibility tree reports `invalid:false`. There is no `aria-invalid` and the submit is blocked
  with no DOM change for a scanner to observe.
- No tool can read the JS classification rules or know that the meter colour is the only place
  they're expressed. Recognising that the missing element is specifically the *suggestion text*
  (the rules) requires typing a weak password, watching the meter, finding the submit silently
  refuses, and reasoning that the rules are knowable yet never written. Human judgment only.

## Citation
> **WCAG Technique G85 (Providing a text description when user input falls outside the required
> format or values), Description:** "However the text description is provided, it should do one of
> the following things to assist the user: Provide examples of the correct data entry for the
> field, Describe the correct data entry for the field, Show values of the correct data entry that
> are similar to the user's data entry, with instructions to the user as to how to enter one of
> these correct values..."
>
> Source file: `wcag-techniques/general/G85.html`
