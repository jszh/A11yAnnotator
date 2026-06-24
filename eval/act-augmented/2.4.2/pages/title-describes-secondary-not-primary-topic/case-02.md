# case-02 — Recipe page titled after its sidebar newsletter widget

## Scenario
A food-blog recipe page whose dominant main column is a complete recipe for
**"Brown Butter Miso Chocolate Chip Cookies"** — full ingredient list and a five-step
numbered method. The document `<title>` is **"Sign up for our newsletter — sweetcrumb.kitchen"**,
which is the heading text of the small newsletter-signup card in the sidebar. The title
correctly names a real peripheral widget but completely omits the recipe that is the page's
actual subject.

## Attribute tuple
- **content-domain:** food blog / recipe (restaurant-menu/cooking adjacent)
- **UI-component / pattern:** sidebar newsletter-signup widget (disclosure-style card with a form)
- **host-language construct:** `<title>` populated from a sidebar widget heading instead of the recipe `<h1>`
- **locale / i18n:** en-US (Portland blog)
- **failure-mechanism:** present-but-wrong-region — title names a peripheral conversion widget, not the dominant recipe (F25)

## Developer persona
A solo food blogger built the site on a drag-and-drop theme and added the newsletter widget
last, as the final "above the fold on the right" block. In the theme's page-builder the
newsletter block was, by drag order, the first element flagged with the "use as SEO title"
toggle, so the theme's auto-title feature grabbed *its* heading ("Sign up for our newsletter")
rather than the recipe headline. The blogger only ever looks at the published recipe in the
main column and never noticed the tab title is the newsletter prompt.

## Element / selector carrying the issue
- `head > title` — value: `Sign up for our newsletter — sweetcrumb.kitchen`
- Primary region: `main.recipe > h1#rtitle` ("Brown Butter Miso Chocolate Chip Cookies").
- Peripheral source region: `aside .card.nl > h2` ("Sign up for our newsletter").

## Exact accessibility mechanism (what AT experiences)
On page load a screen reader announces the title: "Sign up for our newsletter, sweetcrumb
dot kitchen." A user who arrived from a search result or saved the page to read later sees
it filed under a newsletter prompt, with no indication the page contains the cookie recipe
they wanted. Because every recipe page on this blog carries the same sidebar widget, every
page could share this identical title — so it neither describes nor distinguishes the page.
A `<title>` is present and non-empty, but it fails to identify the *overall content* of the
document, defeating the orientation/identification purpose of SC 2.4.2.

## Expected ACT-style outcome
**failed** (ACT rule c4a8a4 — the title must "describe the topic or purpose of the overall
content of the document"; it describes a peripheral widget instead).

## Why automated tools miss it
The `<title>` is present and non-empty, so axe-core `document-title`, WAVE, and Lighthouse
all report a pass. The phrase "Sign up for our newsletter" literally appears in the sidebar
DOM, so even a token-overlap heuristic between title and page text scores a match. No tool
can tell that the recipe — not the newsletter card — is the page's primary topic; that
demands recognizing the recipe as the visually and semantically dominant region and reading
its meaning, which is human judgment.

## Citation
**Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of
a web page not identifying the contents* (`wcag-techniques/failures/F25.html`).

> "This describes a failure condition when the web page has a title, but the title does not
> identify the contents or purpose of the web page."

**Supporting reference:** Trusted Tester v5.1.3, Test 12.B — *2.4.2-page-title-purpose*
(`refs/trusted-tester/sc-2.4.2-page-titled.md`).

> "Determine whether the Page Title is a **meaningful representation or indication** of page content."
