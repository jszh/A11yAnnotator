# case-05 — Arabic recipe card: download icon named with the recipe's own title

## Scenario
An RTL Arabic cooking site ("مطبخ النخيل") shows a recipe card for chicken kabsa. In the
card header, beside the title, is an icon-only link whose glyph is a download arrow
(a downward arrow dropping into a tray) pointing to `kabsa.pdf` — its purpose is "save
the recipe as PDF." But the CMS template wired the link's `aria-label` to the *article
title* variable, so the accessible name is `"كبسة الدجاج بالخطوات"` (the recipe's own
name), not "تحميل الوصفة (PDF)". The name is non-empty and is well-formed, meaningful
Arabic — c487ae/F89 pass and no i18n rule fires — but it describes the article, not the
download action the icon performs.

## Attribute tuple
- **content-domain:** restaurant menu / recipe (food) content
- **UI-component/pattern:** card-header utility action (download-as-PDF icon link)
- **host-language construct:** `<a aria-label="{article title}"><svg aria-hidden="true">…</svg></a>`
- **locale/i18n:** Arabic, `lang="ar" dir="rtl"` (RTL, non-Latin script)
- **failure-mechanism:** accessible name bound to the article-title template variable instead of the action — present, meaningful, but describes the wrong thing

## Developer persona
A theme developer building a recipe CMS added a "download PDF" button to the card
component and bound its `aria-label` to the same `{{recipe.title}}` token they had
already used for the card heading — partly out of copy-paste habit, partly believing
"naming it after the recipe is more descriptive than a bare icon." It satisfied the
linter (non-empty name) and read sensibly in the visual design (the title is right next
to it), so it shipped across every recipe on the site.

## Element / selector carrying the issue
`.recipe-card .head a.pdf-link[href$=".pdf"]` — glyph is a download arrow; its
`aria-label` is the recipe title `"كبسة الدجاج بالخطوات"`; the inner SVG is
`aria-hidden="true"`.

## Exact accessibility mechanism
The `<a>` is in the accessibility tree with role `link` and accessible name
`"كبسة الدجاج بالخطوات"`. A screen-reader user navigating the card hears the recipe
title spoken *twice* — once as the `h1`, once as this link — with nothing to indicate the
second instance is a *download* control. They cannot tell the link saves a PDF; they may
assume it is a duplicate heading link or skip it. The name is present, programmatically
determined, and linguistically valid, but it does not convey the link's purpose (the
download action), so 2.4.4 fails.

## Expected ACT-style outcome
**failed** (SC 2.4.4 Link Purpose (In Context)). c487ae *passes* (name non-empty);
F89 inapplicable (the icon link is named).

## Why automated tools miss it
The link's accessible name is a non-empty, correctly-scripted Arabic string with proper
`lang`/`dir`, so axe-core / WAVE / Lighthouse pass the discernible-text rule and trigger
no language or empty-name finding. No tool renders the SVG to recognise a download glyph,
reads that the `href` is a `.pdf`, or knows that naming a control after the surrounding
article (rather than its action) misdescribes its purpose. Catching it requires reading
Arabic, viewing the rendered icon, and reasoning that "the recipe title" is not "download
the recipe" — visual, linguistic, and semantic judgment a tool cannot perform.

## Citation
> **Reference:** WCAG 2.2 Understanding — "Intent of Link Purpose (In Context)"
> (`wcag-understanding/link-purpose-in-context.html`)
>
> **Quote (verbatim):** "In cases where the link takes one to a document or a web
> application, the name of the document or web application would be sufficient to
> describe the purpose of the link (which is to take you to the document or web
> application)." *(The name here is the recipe ARTICLE's title, not the document the
> link downloads, and it omits that the link's purpose is to download a PDF.)*
>
> **Reference:** WCAG Technique G91 — "Providing link text that describes the purpose of
> a link" (`wcag-techniques/general/G91.html`)
>
> **Quote (verbatim):** "The description lets a user distinguish this link from links in
> the web page that lead to other destinations and helps the user determine whether to
> follow the link."
