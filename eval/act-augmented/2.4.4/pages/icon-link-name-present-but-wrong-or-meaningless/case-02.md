# case-02 — News breadcrumb: left "back" arrow whose alt says "forward"

## Scenario
A local-news article page ("The Harbor Ledger") has a breadcrumb control above the
headline: an icon link back to the Transit section index. The icon is a left-pointing
chevron-plus-shaft — the universal "previous / back" glyph — drawn as an inline
data-URI SVG. Its destination, `/transit/index`, is the section the reader arrived
from. But the `img` `alt` is the non-empty string `"forward"`, copied from a stylesheet
where the same sprite served as a *next-page* arrow on a paginator. The visible
"Transit desk" caption beside it is `aria-hidden="true"`, so the link's entire
accessible name is the word that contradicts the glyph.

## Attribute tuple
- **content-domain:** news / long-form editorial
- **UI-component/pattern:** breadcrumb / back-to-index navigation
- **host-language construct:** `<a><img alt="forward" src="data:image/svg+xml,…"><span aria-hidden="true">…</span></a>`
- **locale/i18n:** en-US
- **failure-mechanism:** directional alt text contradicts the rendered arrow direction and the destination (back-arrow labelled "forward")

## Developer persona
A template developer reused a single arrow sprite for two purposes: the paginator's
"next" control and the article breadcrumb's "back" control. When they pasted the
breadcrumb markup they copied the sprite *with its existing* `alt="forward"` from the
paginator partial, then flipped the SVG path to point left for the visual design — but
never updated the alt. Because the visible "Transit desk" label looked descriptive on
screen, they hid it from AT (`aria-hidden`) to "avoid double-speaking the icon," leaving
the contradictory `"forward"` as the only name.

## Element / selector carrying the issue
`.artnav a.iconnav[href="/transit/index"]` — its `img[alt="forward"]` renders a
left-pointing arrow; the sibling `span` caption is `aria-hidden="true"`.

## Exact accessibility mechanism
The `<a>` is exposed with role `link` and accessible name `"forward"` (the only
non-hidden text contributor is the `img` alt; the SVG is referenced via `src`, and the
caption span is removed from the tree by `aria-hidden`). A screen-reader user hears
"forward, link" and reasonably expects to advance to the *next* article. Activating it
instead moves them *backward* to the section index. The name is present and
programmatically determined — c487ae and F89 are satisfied — but it misdescribes both
the glyph's direction and the link's purpose, so 2.4.4 fails. This is the F89
semantic-mismatch sibling: not an empty name, but a present-and-wrong one.

## Expected ACT-style outcome
**failed** (SC 2.4.4 Link Purpose (In Context)). c487ae *passes* (name non-empty);
F89 inapplicable (the image link is named).

## Why automated tools miss it
The link has a non-empty accessible name (`"forward"`), so axe-core / WAVE / Lighthouse
report discernible text and pass it. No automated checker decodes the data-URI SVG's
`polyline points='15 18 9 12 15 6'` path to determine the chevron points left, and none
correlates that with a destination that is the page's *previous* location. Recognising
that "forward" is the opposite of a back-arrow's meaning requires a human to view the
rendered icon, infer its direction, and compare it against both the word and the link's
actual destination — pure visual-semantic judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding — "Intent of Link Purpose (In Context)"
> (`wcag-understanding/link-purpose-in-context.html`)
>
> **Quote (verbatim):** "The text of, or associated with, the link is intended to
> describe the purpose of the link."
>
> **Reference:** WCAG Technique F89 — "Failure of Success Criteria 2.4.4, 2.4.9 and
> 4.1.2 due to not providing an accessible name for an image which is the only content
> in a link" (`wcag-techniques/failures/F89.html`)
>
> **Quote (verbatim):** "This also applies when both text and images are used
> separately on a page to link to the same target." *(F89 governs the empty-name floor;
> this page passes that floor — the name "forward" is present — yet still fails 2.4.4
> because the present name describes the opposite of the link's purpose, the limb F89
> does not reach.)*
