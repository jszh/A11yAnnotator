# case-03 — Frame named "Newsletter signup" (via aria-labelledby) but content is an ad

## Scenario
A gardening blog article ("How to repot a fiddle-leaf fig") has an in-article embed slot.
A small caption heading reads "Newsletter signup" and is wired as the iframe's accessible
name with `aria-labelledby`. The frame's actual content, however, is a GrowFast plant-food
**advertisement** ("Advertisement — GrowFast Plant Food", "Bigger leaves in 30 days",
"Shop GrowFast"). The name does not merely fail to describe the content — it describes
*different* content.

## Attribute tuple
- **content-domain:** editorial blog / content marketing
- **UI-component/pattern:** in-article embed slot named via `aria-labelledby`
- **host-language construct:** `<h2 id>` + `<iframe aria-labelledby=… srcdoc>`
- **locale/i18n:** en
- **failure-mechanism:** misleading name — labelling element left stale after the embedded resource was swapped (name now describes the wrong content)

## Developer persona
The slot was originally built by the content team to hold a newsletter sign-up form, with
the `<h2 id="promo-label">Newsletter signup</h2>` correctly labelling it. Months later the
growth team monetised the slot by swapping the embedded resource for a paid advertisement
but, working only in the embed's source, left the labelling heading and its `id` in place.
The visual caption and the accessible name now both say "Newsletter signup" over ad content.

## Element / selector carrying the issue
`aside.promo iframe[aria-labelledby="promo-label"]` — accessible name resolved from
`#promo-label`. Accessible name computed by Chrome: `"NEWSLETTER SIGNUP"` (the uppercase
is a rendered `text-transform`; the labelledby reference resolves correctly, confirmed via
CDP).

## Exact accessibility mechanism
The iframe is in the tab order and exposed with role `Iframe` and a non-empty accessible
name computed from the `aria-labelledby` reference. A screen-reader user navigating frames
hears "Newsletter signup" and reasonably expects an email-capture form; on entering the
frame they instead find advertising. The name is programmatically determined and non-empty
(rule passes) but actively misdescribes the content — a worse failure of the "Name" limb
than a merely vague name, and squarely a TT 12.D failure.

## Expected ACT-style outcome
**failed** (TT 12.D). cae760 *passes* (aria-labelledby yields a non-empty name); 4b1c6c
*inapplicable* (single iframe).

## Why automated tools miss it
The `aria-labelledby` reference resolves to a real element, so the accessible name is
non-empty and the markup is valid — cae760 passes and no ARIA-reference error is raised.
axe/WAVE/Lighthouse cannot render the frame to discover its content is an advertisement
rather than a newsletter form, and they have no notion of "the name describes the wrong
content." Only a human reading the name against the rendered frame (TT 12.D) catches that
the accessible name and the content disagree.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 12.D `4.1.2-iframe-name`
> (`refs/trusted-tester/sc-4.1.2-name-role-value.md`)
>
> **Quote (verbatim):** "Evaluate Results (PASS if) … The ANDI Output for each `<iframe>`
> in the tab order sufficiently describes its content."
>
> **Quote (verbatim):** "Test Condition: *The combination of accessible name and
> description for each `<iframe>` describes its content.*"
