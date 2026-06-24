# case-01 — "Read our Privacy Policy" footer link whose href points at the Terms of Service section

## Scenario
A credit union's "Help & Legal Centre" is a single self-contained page holding three
labelled sections reachable by fragment: `#privacy` (the real Privacy Policy), `#terms`
(the Terms of Service), and `#fees`. A footer "Legal documents" navigation lists jump
links. The first link reads **"Read our Privacy Policy"** — a specific, high-quality,
non-empty name — but its `href` is **`#terms`**, the Terms of Service section. The actual
Privacy Policy lives at `#privacy`. The name promises the Privacy Policy and delivers the
Terms of Service; both targets genuinely exist on the page, so the contradiction is
verifiable without leaving the page.

## Attribute tuple
- **content-domain:** online banking / fintech (credit-union legal centre)
- **UI-component / pattern:** footer "jump to document" navigation list of in-page anchors
- **host-language construct:** `<a href="#terms">` whose text claims a different section id
- **locale / i18n:** en-CA
- **failure-mechanism:** descriptive name vs. actual on-page destination mismatch — name describes the wrong (but real) section

## Developer persona
An agency dev built the legal centre by duplicating the second list item ("Read our Terms
of Service", `href="#terms"`) to create the Privacy row, then changed only the visible
text to "Read our Privacy Policy" and forgot to swap the `href` from `#terms` to
`#privacy`. Copy-paste-and-edit-the-label is the classic way this exact defect is born.
The page looks perfect, every link "works" (it scrolls somewhere real), and QA clicking
through with a mouse saw content appear and moved on.

## Element / selector carrying the issue
`footer nav[aria-label="Legal documents"] ul li:first-child a` — accessible name
"Read our Privacy Policy", `href="#terms"`. The contradicted target is the
`<section aria-labelledby="terms">` under the `<h2 id="terms">Terms of Service</h2>`. The
honest destination would be `#privacy`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Screen-reader user (links list / Rotor):** pulls up the list of links, reads
  "Read our Privacy Policy", and chooses it expecting the privacy document. Focus / scroll
  jumps to the **Terms of Service** heading and content. The user's decision to follow the
  link was made on a false premise — the link's name did not let them understand its actual
  purpose, which is the core intent of 2.4.4.
- **Sighted keyboard user:** activates the link and is moved to a heading that reads "Terms
  of Service", contradicting the link they just used.
- **Cognitive / low-vision user:** the mismatch between the promised document and the one
  that appears is disorienting — exactly the population 2.4.4 protects.
- The defect is genuinely in the DOM: the `href` really is `#terms`, and `#terms` really is
  the Terms section, so any agent that opens the target experiences the contradiction.

## Expected ACT-style outcome
**failed** (SC 2.4.4). The link's accessible name does not describe the purpose /
destination of the link; it describes a different, contradictory on-page document.

## Why automated tools miss it
- The name is **non-empty, specific, unique, and descriptive** — it passes c487ae
  (non-empty name), the "generic text" heuristics, and the duplicate-name heuristics.
- There is no `aria-label` override, no empty alt, no contrast problem — axe / WAVE /
  Lighthouse find nothing.
- `href="#terms"` is a perfectly valid same-page fragment that resolves to a real element,
  so no broken-anchor linter fires.
- Catching it requires **resolving the fragment, reading the destination section, and
  judging that "Terms of Service" content contradicts the words "Privacy Policy"** — a
  meaning-level cross-check between link text and target content that only a human can
  perform.

## Citation
> "The intent of this success criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "It is also a best practice for links with different purposes and destinations to have different link text."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))
