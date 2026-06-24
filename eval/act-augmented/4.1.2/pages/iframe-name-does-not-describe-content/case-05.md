# case-05 — Two distinct-but-generic frames: "Section A" (chat) vs "Section B" (help docs)

## Scenario
A SaaS "Support Console" lays out two embedded tools side by side. Panel 1 is a **live
chat widget** ("Live chat with Support", an active conversation with an agent, a message
box). Panel 2 is a **help-doc viewer** ("Backup job stuck at 0%" with troubleshooting
steps and a CLI command). The dashboard grid auto-names each embed slot by position:
`title="Section A"` and `title="Section B"`. The names are non-empty *and distinct*, yet
neither says what its tool is.

## Attribute tuple
- **content-domain:** B2B SaaS / IT operations support console
- **UI-component/pattern:** two side-by-side embedded tools (chat + docs) in a grid
- **host-language construct:** two `<iframe srcdoc>` with positional titles "Section A"/"Section B"
- **locale/i18n:** en
- **failure-mechanism:** generic *distinct* names (so 4b1c6c stays inapplicable) that fail to distinguish purposes

## Developer persona
A platform engineer assembled the console from a dashboard grid library whose embed slots
auto-title by position ("Section A", "Section B", …). The titles are technically unique and
non-empty, so every automated check the team ran was green; nobody renamed the slots to
describe the chat and docs tools they hold.

## Element / selector carrying the issue
`.layout .pane:nth-of-type(1) iframe[title="Section A"]` (chat) and
`.layout .pane:nth-of-type(2) iframe[title="Section B"]` (help docs). Accessible names
computed by Chrome: `"Section A"`, `"Section B"` (verified via CDP).

## Exact accessibility mechanism
Both iframes are in the tab order and exposed with role `Iframe` and the names "Section A"
/ "Section B". A screen-reader user navigating frames hears two positional labels and
cannot tell which frame is the live chat (where they might type to an agent) and which is
static documentation. Each name is non-empty and distinct — so both the non-emptiness rule
and the identical-name rule are satisfied/non-triggered — but neither describes its
frame's content, failing the embedded-frame "Name" limb of 4.1.2 under TT 12.D for each
frame.

## Expected ACT-style outcome
**failed** (TT 12.D, for both frames). cae760 *passes* (both names non-empty); 4b1c6c
*inapplicable* (names differ, so there is no identical-name set to evaluate for equivalent
purpose).

## Why automated tools miss it
Two validly named, uniquely named iframes pass cae760, and because the names differ,
4b1c6c — whose entire applicability is two-or-more iframes with *matching* names — never
engages. axe/WAVE/Lighthouse see two correctly named frames and report nothing. They cannot
render the frames to learn one is a chat widget and the other a help-doc viewer, nor judge
that "Section A/B" fails to distinguish those purposes. This per-frame content-to-name
judgement is exactly the human step TT 12.D requires, and it is precisely the gap left by
4b1c6c only covering the identical-name case.

## Citation
> **Reference:** ACT Rule 4b1c6c — *Iframe elements with identical accessible names have
> equivalent purpose* (`act-rules/extracted/4b1c6c.md`)
>
> **Quote (verbatim, Applicability):** "This rule applies to any set of any two or more
> iframe elements which: are in the same web page (HTML) ; and are included in an
> accessibility tree ; and that have matching accessible names that are not empty ( "" )."
>
> *(The two frames here have DIFFERENT names, so this rule's applicability is not met and
> it cannot evaluate them — leaving the descriptiveness of each distinct generic name to
> the human TT 12.D check: "the accessible name and description accurately describe the
> content of each `<iframe>`.")*
