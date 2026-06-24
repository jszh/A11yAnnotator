# case-04 — Council cookie policy: inline links styled identical to static text (1.4.1 not applicable)

## Scenario
A government cookie-and-tracking policy page has inline `<a>` links in its prose styled to look EXACTLY like the surrounding static text — same colour (inherited body colour), no underline, no weight or style change. Because colour is not used to distinguish the link from the static text at all, SC 1.4.1 does not apply to these links: there is no colour conveying the link-ness, so there is no use-of-colour failure. (This is a real usability problem, but a different criterion governs it.)

## Attribute tuple
- **content-domain:** government / civic services portal (council privacy policy)
- **UI-component / pattern:** inline text links within long-form policy prose
- **host-language construct:** `.body a { color:inherit; text-decoration:none }` (underline only on hover/focus)
- **locale / i18n:** en-GB
- **failure-mechanism:** NONE for 1.4.1 — colour conveys nothing, so the criterion is not applicable (limb c)

## Developer persona
A council web team adopted a "clean, distraction-free" reading style for legal pages and removed all link underlines and link colouring so the policy "reads like a printed document." The inline links inherit the body colour and look identical to the surrounding text. They are still real, focusable, navigable links (and underline on hover/focus). The team created a usability problem, but not a use-of-colour failure.

## Element / selector carrying the issue
`.body a` — e.g. the `resident account portal`, `bin-collection calendar`, `measurement schedule`, `cookie preferences centre`, and `online enquiry form` links. All inherit `#222` and have no underline at rest.

## Exact accessibility mechanism (what AT experiences / why it is not-applicable)
- For SC 1.4.1 the question is: does colour convey information here? It does not. The link and the adjacent static text are the SAME colour, so colour is not being used to distinguish the actionable link from the static text. The criterion's scope therefore excludes these links — there is no colour failure to find.
- The Understanding note gives this exact example: a hyperlink styled to appear no different than neighbouring static text does not fail 1.4.1 because there is no colour differentiation between the hyperlink text and the adjacent static text.
- This is distinct from F73: F73 fails when a link IS distinguished by colour (hue) for sighted users but lacks a non-colour cue. Here the link is not distinguished by colour at all, so 1.4.1 simply does not apply. (Poor discoverability is a real concern, but it is a 1.3.1/2.4.4-style issue, not the verdict for THIS SC.)

Verified by rendering: the inline links are visually indistinguishable from the body text at rest (a screen-reader still exposes them as links via role, and they underline on hover/focus).

## Expected ACT-style outcome
**inapplicable** (SC 1.4.1 — colour is not used to convey information / distinguish the link, so the criterion does not apply; there is no use-of-colour failure).

## Why automated tools miss it
A naive heuristic ("inline links should be underlined" or "any link colour cue needs a backup") would flag these links. But correctly classifying this requires recognising that colour conveys NOTHING here (link and text share one colour), which removes the links from 1.4.1's scope — a scoping judgement no contrast or link-styling linter performs. The hover/focus underline also confuses a static scan, since the underline does appear in some CSS states. Distinguishing not-applicable (no colour used) from a genuine F73 failure (colour is the only link cue) is a human scoping call.

## Citation
> "This criterion does not apply to situations where color has not been used to convey information, indicate an action, prompt a response or distinguish a visual element. For instance, a hyperlink which has been styled to appear no different than neighboring static text would not fail this success criterion, as there would be no color differentiation between the actionable hyperlink text and the adjacent static text."
— wcag-understanding/use-of-color.html (Intent note — inapplicability)

> "Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 1.4.1 Use of Color. (Do not need to meet or test)"
— docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md (C.9.1.4.1 — Use of colour, Result)
