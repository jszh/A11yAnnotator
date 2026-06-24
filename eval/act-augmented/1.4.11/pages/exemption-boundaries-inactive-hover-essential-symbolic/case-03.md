# case-03 — "Trusted by" logo wall: author-choice low-contrast logos (FAIL) vs one brand-mandated logo (NA)

## Scenario
A SaaS marketing hero: "Trusted by the world's most innovative finance teams," followed by a wall
of ten company wordmarks on a pure-black page. Nine wordmarks are set in `#1c1c1c` (~1.23:1) and
turn white only on hover — a fashionable "logos reveal on hover" effect. The tenth, `BNØRD`, is
set in its brand-mandated navy `#11203a` and never recolors. The author-choice nine FAIL 1.4.11;
the brand-mandated one is Essential and is NA. This mirrors the figure in the Understanding doc.

## Attribute tuple
- **Content domain:** SaaS analytics / fintech marketing site
- **UI component / pattern:** "trusted by" logo wall (link list), CSS hover reveal
- **Host-language construct:** text wordmarks as `<a class="logo">`; `color` swap on `:hover`/`:focus-visible`
- **Locale / i18n:** en (with a non-ASCII brand glyph "Ø")
- **Failure mechanism:** author-choice low contrast on logos wrongly assumed Essential/exempt; one truly brand-mandated logo correctly exempt — the reversal the SC calls out

## Developer persona
A growth-team developer copied a trendy "monochrome logos that light up on hover" section from a
landing-page template. To make it feel premium on the dark hero, they set the resting logo color
to near-black (`#1c1c1c`) and only revealed white on hover. They assumed "logos are exempt from
contrast anyway," not realizing that the exemption depends on the color being brand-MANDATED, not
on the element being a logo. The single client whose brand book actually fixes a navy wordmark was
pasted in as-is.

## Element / selector carrying the issue
`.logo` (the nine `#1c1c1c` wordmarks at ~1.23:1, e.g. `a[href="#north"]`) — these FAIL. The
exempt element is `.logo--brand` (`#bnord`, brand-mandated `#11203a`) — NA.

## Exact accessibility mechanism
Logos are exempted under the Essential exception *because* their colors are assumed to be mandated
by brand guidelines. The SC explicitly reverses this when the low contrast is an author choice: a
logo presented low-contrast by author choice is "not essential, and the logo is not exempt." Here
the nine wordmarks are deliberately dimmed to `#1c1c1c` for visual style and revealed only on
hover — pure author choice — so they are in scope and fail at ~1.23:1. A low-vision user cannot
perceive that nine of the page's named clients exist at all until they happen to hover. The tenth
wordmark's navy is brand-mandated, so altering it would misrepresent the brand; that presentation
IS essential and exempt (NA).

## Expected ACT-style outcome
**failed** (SC 1.4.11). The nine author-choice low-contrast wordmarks fail; the single brand-
mandated wordmark is the NA boundary that sharpens the distinction.

## Why automated tools miss it
A scanner sees ten low-contrast text/wordmark elements on black and cannot tell which color is
brand-mandated (Essential, exempt) from which is an author styling choice (in scope, failing). It
also cannot judge that a hover-reveal is masking a non-essential too-faint default rather than
being a legitimate supplemental effect. Most contrast tools would either exempt all "logo"-like
elements or flag all ten identically; the correct nine-fail / one-NA split depends entirely on
knowing brand intent — human knowledge a tool has no access to.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "If logos are presented with an insufficient contrast, but their presentation was an author choice rather than being mandated by corporate identity or brand guidelines, then that particular low contrast presentation is not \"essential\", and the logo is not exempt from the contrast requirements."

**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "An author chooses to present company logos with low contrast by default, until they are hovered; the fact that these are logos doesn't exempt this scenario from failing the requirements of this success criterion, as the initial low contrast presentation is not \"essential\""
