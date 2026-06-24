# case-06 — PASS control: every descriptive name correctly matches its on-page destination

## Scenario
A healthcare patient-portal "information hub" built with the SAME structure as the failing
cases — a skip link, an "On this page" jump list, several labelled sections reachable by
`#fragment`, and a footer "Documents" list — but here **every link's accessible name
correctly matches the section it targets**:
- "Skip to your message inbox" → `#inbox` (the inbox section)
- "Jump to: Booking a flu vaccine" → `#flu` (the flu-vaccine booking section)
- "Jump to: Notice of Patient Rights" / "Read our Notice of Patient Rights" → `#rights`
- "Read our Privacy Policy" → `#privacy` (which genuinely IS the Privacy Policy)

Opening any target confirms the destination content is exactly what the link's name
promised. This is the honest contrast that isolates the aspect: identical name-quality and
identical structure to the failing pages, opposite verdict, decided solely by whether the
descriptive name matches the real destination.

## Attribute tuple
- **content-domain:** healthcare / patient portal
- **UI-component / pattern:** information hub — skip link + in-page jump list + footer document links
- **host-language construct:** `<a href="#privacy">`, `<a href="#rights">`, `<a href="#inbox">`, `<a href="#flu">` all matching their section ids
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — every descriptive name correctly describes its actual on-page destination (control)

## Developer persona
A careful portal developer wired each jump link by selecting the destination section's id
from a checklist and verifying, link by link, that the visible text and the target heading
agreed (e.g. "Read our Privacy Policy" → the section headed "Privacy Policy"). This is what
the failing pages should have done.

## Element / selector carrying the issue
No issue. The reference link to compare against the failing cases is
`footer nav[aria-label="Documents"] ul li:first-child a` — accessible name "Read our Privacy
Policy", `href="#privacy"`, where `#privacy` is the section headed "Privacy Policy". The
contrast with case-01 (same link text, `href="#terms"`) is exact.

## Exact accessibility mechanism (what AT experiences, why it passes)
- **Screen-reader user (links list):** chooses "Read our Privacy Policy" and is taken to the
  Privacy Policy section; chooses "Skip to your message inbox" and lands in the inbox. Each
  link's name reliably predicts where it goes, so the user can decide whether to follow it —
  the intent of 2.4.4 is satisfied.
- **Keyboard / cognitive users:** every jump delivers the promised content, so navigation by
  the page's own link list is trustworthy.
- The match is real in the DOM: each `href` fragment resolves to the section whose heading
  matches the link's name.

## Expected ACT-style outcome
**passed** (SC 2.4.4). Each link's accessible name describes the purpose / destination of
the link, and the actual on-page destination matches that name.

## Why automated tools miss it
- Just as in the failing cases, automated tools cannot adjudicate this either way: they see
  non-empty, descriptive, unique names and resolvable fragments and report "no issue" —
  which here happens to be correct, but only because a human can confirm the name↔destination
  match. The tools do not perform that confirmation; they are blind to the property the SC
  actually tests. Including this PASS control shows the verdict turns entirely on the
  human-judged name-vs-destination match, not on any signal a scanner can read.

## Citation
> "The intent of this success criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "Check that text of the link describes the purpose of the link"
— wcag-techniques/general/G91.html (Tests — Procedure)
