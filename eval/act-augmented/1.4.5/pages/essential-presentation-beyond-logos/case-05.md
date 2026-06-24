# case-05 — Binding Terms-of-Service clause imaged and labelled a "type sample" to claim the exception (FAIL)

## Scenario
A cloud-storage company's Terms of Service page renders its most consequential clauses —
governing law, the liability cap, and a binding-arbitration / class-action waiver — as a single
image, and dresses it up as a "type sample of our house legal typeface, Pinevault Text." Both
the `<figcaption>` and an `aria-describedby` note explicitly assert the "type sample"
rationale. But this is not a specimen of a typeface; it is legally operative contract text the
user must be able to read, enlarge, recolour, and reflow. The same words in the user's own font
would carry identical legal meaning, so the "type sample" claim is a fig leaf over avoidable
images of text. A human reviewer must *reject* the bogus essential-presentation justification.

## Attribute tuple
- **Content domain:** legal / terms & policy (SaaS)
- **UI component / pattern:** policy document body with a `<figure>` carrying an `aria-describedby` rationale note
- **Host-language construct:** `<img>` (inline-SVG `data:` URI) of multi-paragraph legal prose, with a self-justifying caption
- **Locale / i18n:** en-US (Delaware law, AAA arbitration)
- **Failure mechanism:** ordinary operative informational text imaged and falsely labelled a "type sample" to invoke the essential-presentation exception

## Developer persona
A product engineer who had been told by legal to make the arbitration clause "look like our
official letterhead." Knowing WCAG lists "type samples" as a permitted image-of-text case, they
wrapped the clause in an exported PNG, wrote a transcribing alt to keep the a11y scanner happy,
and added a caption and an `aria-describedby` note literally calling it a "type sample" — a
sincere but mistaken belief that asserting the exception in markup makes it apply.

## Element / selector carrying the issue
`main figure img[aria-describedby="ts-note"]` (with its `<figcaption>` and `#ts-note`). The
image's pixels are the governing-law, liability-cap, and arbitration clauses; the caption and
note assert the "type sample" justification.

## Exact accessibility mechanism
The operative legal text exists only as SVG `<text>` glyphs inside the image. A low-vision user
who needs 200–400% zoom cannot enlarge the arbitration clause without it pixelating; a user on a
high-contrast / forced-colors theme cannot recolour it; a user who needs reflow to a single
narrow column cannot reflow a fixed raster. Because the information is the *words of a binding
contract* — not a demonstration of letterforms — the visual presentation is not essential: live
HTML would convey the same effect and information while remaining adjustable. The self-applied
"type sample" label does not change what the content is. (The alt fully transcribes the clause,
so 1.1.1 is met; only 1.4.5 fails.)

## Expected ACT-style outcome
**failed** (SC 1.4.5). The image of text can be replaced by live text with the same effect and
information; it is operative legal prose, not a genuine type sample, logotype, or customizable
image, so no exception applies despite the asserted "type sample" rationale.

## Why automated tools miss it
The image has a full, accurate `alt`, the page has a `<title>`, headings, landmarks, and good
contrast — no rule fires in axe-core / WAVE / Lighthouse. Worse, the DOM *truthfully states in
markup* (caption + `aria-describedby`) that this is a "type sample," and there is no
machine-checkable signal that the claim is false. No tool OCRs the image, and none can evaluate
whether "type sample" is a legitimate essential-presentation claim for binding legal text.
Rejecting the abuse — recognising that operative contract prose is not a font specimen — is a
pure human contextual judgment.

## Citation
**Reference:** WCAG 2.2 Understanding Images of Text — Intent (`wcag-understanding/images-of-text.html`)
> "This includes instances where a particular presentation of text is essential to the information being conveyed, such as type samples, logotypes, branding, etc."

**Reference:** WCAG 2.2 Understanding Images of Text — Intent (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Type samples, branding, images of specific fonts that are not widely supported are additional examples of images of text that cannot be replaced by text."
