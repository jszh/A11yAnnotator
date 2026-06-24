# case-06 — Font-foundry specimen: image of text that IS essential (achievability gate → PASS)

## Scenario
"Halcyon Type Foundry" sells a typeface called "Meridian Display". The product page shows a
large character-set specimen — a raster **PNG** of the alphabet rendered in the actual
letterforms of the font being sold. At first glance this looks like a 1.4.5 failure (text
baked into an image). It is not: the **entire purpose** of a specimen is to display the exact
glyphs of *this* typeface; rendering that line as live text in any other (web-safe) font would
no longer represent Meridian Display. This is the WCAG "Representation of a font family"
essential case, where the visual presentation is *not* achievable with the available text
technologies without destroying the information — so the 1.4.5 exception applies and the page
**passes**. This case is the deliberate boundary foil: it exercises the achievability/essential
clause that the FAIL cases (01–05) do not.

## Attribute tuple
- **Content domain:** developer / design tooling (digital type foundry storefront)
- **UI component / pattern:** product page (specimen figure + buy box + live-text preview)
- **Host-language construct:** `<img class="specimen" alt="...">` raster of a typeface's glyphs (essential image of text); all surrounding UI is live text
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is the legitimate exception (essential / not-achievable-as-live-text); included to sharpen the threshold against cases 01–05

## Developer persona
A foundry's site builder knows the rules well: they deliberately deliver the specimen as an
image because that is the correct, conformant way to show a font you do not want substituted,
and they add a descriptive alt for 1.1.1. Everything else on the page (price, feature list,
buy button, live preview field) is real text. This persona embodies the *correct* judgment
that the FAIL personas lacked.

## Element / selector carrying the issue
`img.specimen[alt^="Uppercase character set of the Meridian Display typeface"]` — the specimen
image of text. It is the focus of the SC judgment, but the verdict is PASS because the
presentation is essential and not achievable as substitutable live text.

## Exact accessibility mechanism
A sighted shopper evaluates the typeface by its exact letterforms. A screen-reader user hears
the alt ("Uppercase character set of the Meridian Display typeface, A through Z, shown in its
actual letterforms"), which conveys what the specimen is — 1.1.1 satisfied. For 1.4.5, the
question is whether live text could achieve the *same effect*: it cannot, because the effect IS
the specific font's design, and any substitute font would defeat the representation. WCAG's
intent paragraph explicitly permits images of text "where a particular presentation of text is
essential to the information being conveyed, such as type samples". So no live-text obligation
arises here, and the page passes. (Contrast cases 01–05, where the look was an ordinary
serif/script/red heading achievable in CSS, so the exception did NOT apply.)

## Expected ACT-style outcome
**passed** (SC 1.4.5). The specimen is an image of text, but its visual presentation is
essential and not achievable as substitutable live text, so it falls under the SC's exception;
the rest of the page uses live text.

## Why automated tools miss it
Automated tools fail in *both* directions on 1.4.5 and so cannot reach this verdict. They
cannot OCR the specimen to even recognize it contains text, and — decisively — they cannot make
the human judgment "is this presentation essential / unachievable as live text?" that
distinguishes a legitimate type specimen (PASS) from an avoidable styled heading (FAIL). A
tool that naively flagged "image with text-like alt" would wrongly fail this page; a tool that
ignored it would coincidentally pass it for the wrong reason. Only a human applying the
achievability/essential clause lands on the correct PASS for the right reason — which is
exactly why this aspect is uncovered.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, Intent (`wcag-understanding/images-of-text.html`)
> "This includes instances where a particular presentation of text is essential to the information being conveyed, such as type samples, logotypes, branding, etc."

**Reference:** WCAG 2.2 Understanding — Images of Text, Examples → Representation of a font family (`wcag-understanding/images-of-text.html`)
> "A web page contains information about a particular font family. Substituting the font family with another font would defeat the purpose of the representation. The representation is included as a jpeg image which does not allow the text characteristics to be changed. The image has a text alternative."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, Evaluate Results (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "The image of text cannot be replaced with text, OR ... The image of text can be visually customized."
