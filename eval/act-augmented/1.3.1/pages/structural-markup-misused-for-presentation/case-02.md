# case-02 — Store's own shipping disclaimer wrapped in `<blockquote>` to indent it

## Scenario
An e-commerce product page for a solid-oak nightstand. The shipping/returns/assembly
disclaimer — which is the store's own first-party policy text — is wrapped in a `<blockquote>`
purely because the Shopify theme's blockquote style produces an indented, left-bordered
"fine print" box. The text is not a quotation: it has no source, no `<cite>`, no attribution,
no quoted speaker. The `<blockquote>` therefore asserts a quotation relationship (this is an
extended quote from another source) that does not exist in the content.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component/pattern:** product-page legal/fine-print disclaimer block
- **host-language construct:** `<blockquote>` used for indentation
- **locale/i18n:** en (US)
- **failure-mechanism:** quotation markup over non-quoted prose used only to indent (F43,
  "Using blockquote elements to provide additional indentation")

## Developer persona
A small-shop owner customising a Shopify "Dawn"-style theme wanted the policy text to look
set-apart from the product description. In the theme's rich-text block they saw that the
"quote" formatting option gave a nice indented box with a left border, so they applied it to
the disclaimer. To them "blockquote" just meant "the indented style"; they did not know it
declares the content a quotation to assistive technology.

## Element / selector carrying the issue
`.info > blockquote` — the disclaimer paragraphs ("Please note: this item ships flat-packed…"
and "Hearthwood Home reserves the right…").

## Exact accessibility mechanism (what AT experiences, why it fails)
The `<blockquote>` carries the implicit ARIA role `blockquote`. Screen readers expose this as
quotation structure: VoiceOver announces "quote" on entry and "end quote" on exit; some
NVDA/JAWS verbosity settings announce the blockquote boundary; refreshable-braille users
receive the blockquote/quotation semantic. The AT user is told this text is something the
merchant is *quoting* from an external source — implying it carries a different authority or
voice than the surrounding first-party copy. In reality it is the merchant's own binding
return policy. The fabricated quotation relationship can mislead the user about who is
speaking and the standing of the text (e.g. "is this a third-party review or the store's
actual policy?"). Per F43, `<blockquote>` is being used to achieve indentation while
indicating a quotation relationship that does not exist in the content.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A `<blockquote>` requires no attributes, can legitimately contain any flow content, and is
valid and non-empty here. There is no axe-core / WAVE / Lighthouse rule that inspects whether
the *content* of a blockquote is actually a quotation — doing so would require natural-language
understanding of the prose plus knowledge that this is the store speaking in its own voice.
Automated tools see a well-formed quotation container and pass it. Recognising that
first-party policy text is not a quote, and that the element was chosen only for its indented
appearance, is a semantic/contextual judgment only a human reading the page can make.

## Citation
> **WCAG Techniques, F43 — "Using blockquote elements to provide additional indentation":**
> "The following example uses blockquote for text that is not a quotation to give it
> prominence by indenting it when displayed in graphical browsers."

(Verbatim from `wcag-techniques/failures/F43.html`. This page is exactly that pattern: a
non-quotation — the store's own disclaimer — placed in `<blockquote>` for indentation.)

> **WCAG 2.2 Understanding Info and Relationships, Intent:**
> "The intent of this success criterion is to ensure that information and relationships that
> are implied by visual or auditory formatting are preserved when the presentation format
> changes."

(Verbatim from `wcag-understanding/info-and-relationships.html`. Here the markup instead
*adds* a relationship — quotation — that the visual presentation does not actually carry, the
inverse of preserving true relationships.)
