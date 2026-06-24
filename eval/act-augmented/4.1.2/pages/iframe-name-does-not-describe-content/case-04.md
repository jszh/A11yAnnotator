# case-04 — Comments thread with stale `aria-label="Loading…"` after async load

## Scenario
A book-review page lazy-loads a third-party comments thread into an `<iframe>`. While the
thread fetches, the script sets `aria-label="Loading…"` as a placeholder name. When the
load completes the script injects the comments markup (three reader comments, reply
buttons, a comment box) but **forgets to clear the placeholder name**, so the iframe's
permanent accessible name is the transient string "Loading…", which no longer matches the
loaded content.

## Attribute tuple
- **content-domain:** editorial / book-review blog
- **UI-component/pattern:** lazy-loaded comments-thread iframe
- **host-language construct:** `<iframe>` with JS-set `aria-label` + deferred `srcdoc` injection
- **locale/i18n:** en
- **failure-mechanism:** stale transient status string left as the accessible name post-load (state/timing bug)

## Developer persona
A front-end dev added a loading affordance so the empty frame would not announce as
nameless during the fetch, setting `aria-label="Loading…"`. The completion handler swaps in
the real thread but the dev never added the line to reset the label — the visual UI looked
finished, and the leftover name only surfaces to AT.

## Element / selector carrying the issue
`#discuss` (`iframe[aria-label="Loading…"]`). After the async injection settles, the
accessible name computed by Chrome is still `"Loading…"` (verified via CDP after a 700 ms
settle — the comments are present but the name is unchanged).

## Exact accessibility mechanism
Post-load the iframe is in the tab order, role `Iframe`, accessible name `"Loading…"`. A
screen-reader user navigating frames hears "Loading…" indefinitely — implying the frame is
still busy — when it actually contains a fully populated comments thread with a reply
form. The name is non-empty and programmatically determined (rule passes) but is a stale
status string that does not describe the current content, failing the embedded-frame
"Name" limb of 4.1.2 under TT 12.D.

## Expected ACT-style outcome
**failed** (TT 12.D). cae760 *passes* (name "Loading…" is non-empty); 4b1c6c *inapplicable*
(single iframe).

## Why automated tools miss it
A scanner run after the page settles sees a non-empty accessible name ("Loading…"), so
cae760 passes and nothing is flagged; with one iframe 4b1c6c never applies. The defect is a
state/timing inconsistency between a transient name and the loaded content — invisible to
static rules, which have no concept that "Loading…" is a status string nor any way to read
the frame's current content. A human must read the name against the loaded comments and
recognise the mismatch, the comparison TT 12.D requires.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 12.D `4.1.2-iframe-name`
> (`refs/trusted-tester/sc-4.1.2-name-role-value.md`)
>
> **Quote (verbatim):** "Review the ANDI Output for each iframe with a non-negative
> tabindex (or where tabindex is not defined) to determine whether the accessible name and
> description accurately describe the content of each `<iframe>`."
>
> **Quote (verbatim):** "Evaluate Results (PASS if) … The ANDI Output for each `<iframe>` in
> the tab order sufficiently describes its content."
