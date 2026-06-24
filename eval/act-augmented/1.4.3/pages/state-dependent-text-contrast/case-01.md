# case-01 — Placeholder prompt on a GRADIENT field (F83 per-glyph), beside a decorative placeholder trap

## Scenario
A sea-swimming club sign-up form. The **Home postcode** field is empty on load, so the only text it shows is its placeholder, which states the **required input format**: *"e.g. TR11 4QY — used to find your beach group."* The field is not painted a flat colour: its fill is a CSS `linear-gradient` ("frosted glass" look) running from a pale tint (`#f4f9f8`) to a deeper teal (`#a8cdc4`). The placeholder grey (`#9aa0a6`) therefore has a **different contrast ratio under every glyph** — about **2.48:1** over the light end down to **~1.53:1** over the deep-teal end — all below 4.5:1. As soon as the swimmer types, the value is near-black (`#16201f`, ~9.7–15.7:1 across the gradient) and reads fine, so the field fails contrast *only* in its empty, placeholder state.

Two further fields are deliberately included to test judgment, not just measurement:
- **Full name** field: a *legible* placeholder (`#4d6660` on flat white, ~6.0:1) — a passing control.
- **Swim mantra** field: a *faint, decorative* placeholder ("the cold never bothered the regulars", `#c9c9c9` on white, ~1.66:1) — flavour copy that conveys no information and is **excluded** from 1.4.3.

## Attribute tuple
- **content-domain:** community / sports club membership sign-up
- **UI-component / pattern:** text inputs with `::placeholder` prompts; one field has a `background-image` gradient fill
- **host-language construct:** `::placeholder` pseudo-element `color` over a `linear-gradient` `background-image` (no flat `background-color`)
- **locale / i18n:** en-GB (UK postcode format "TR11 4QY")
- **failure-mechanism:** placeholder text below 4.5:1 against a **non-uniform** background (F83), in the in-scope empty state — combined with a decorative-placeholder exclusion trap

## Developer persona
A designer built the form from a "frosted glass" UI kit where input fields carry a soft teal gradient. They picked the placeholder grey straight from the kit's mockup because it looked elegant on the comp, and confirmed the *typed* value (the only state they filled in to test) was dark and legible. They never inspected the *empty* field, and because the field has no flat `background-color` for a contrast picker to read, they assumed it was fine. Separately a teammate added a faint "vibe" placeholder to the optional mantra field purely for flavour.

## Element / selector carrying the issue
`#tideline-postcode::placeholder` — `color:#9aa0a6` painted over `background-image:linear-gradient(100deg,#f4f9f8,#dcece8,#c2ddd6,#a8cdc4)`. The typed `#16201f` value is unaffected and passes; the decorative `#tideline-promo::placeholder` is excluded; the `#tideline-name::placeholder` control passes.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Low-vision / contrast-impaired sighted user:** before typing, the prompt that tells them what format the box needs is barely perceptible — and *unevenly* so. Over the deeper-teal right-hand end of the field the glyphs drop to ~1.53:1 and effectively vanish, so even a user who can make out the left of the prompt loses the part that scopes the input. This is genuine, meaningful instruction (the required postcode format).
- **Once typed:** the value is high-contrast across the whole gradient, so the failure exists *only* in the empty placeholder state — the default state every user first encounters.
- **The decorative field is NOT a failure:** the mantra placeholder is flavour text that could be removed or rearranged without changing meaning, so per the Understanding's decorative-text exclusion it is out of scope; flagging it would be an over-report.

## Expected ACT-style outcome
**failed** (SC 1.4.3 — the postcode field's in-scope placeholder is below 4.5:1 everywhere along its gradient, governed by the ~1.53:1 least-contrast region; the name placeholder passes and the mantra placeholder is excluded as decorative).

## Why this needs HUMAN judgment (not just a smarter automated rule)
The reviewer was right that a *flat* placeholder colour on a *flat* field is mechanically resolvable. This case is engineered so a `::placeholder`-aware checker still cannot close it, for two independent reasons:

1. **Non-uniform background (F83).** The failing field has no `background-color` — `getComputedStyle` returns a `background-image` gradient, not a colour. There is no single value to compute a ratio against. F83 requires judging contrast against *"those parts of the image that are most like the text and behind the text"* — i.e. a human eyedroppers the **least-contrast** region under the glyphs (the Trusted Tester CCA "least contrast" pixel step). That is a visual/spatial judgment, not a CSSOM lookup.
2. **In-scope vs decorative (semantic).** A naive colour-ratio rule would also flag the faint *decorative* mantra placeholder (~1.66:1), producing a false positive, and would have no basis to treat the postcode prompt's required-format instruction as the *meaningful* in-scope text. Deciding which faint placeholder conveys information (in scope) and which is decorative (excluded) is a semantic call automation cannot make.

Beyond that, axe-core/WAVE/Lighthouse compute contrast for **text nodes** in the DOM; `::placeholder` is generated content with no text node, so they skip it entirely, and every real text node (typed value, headings, body copy) passes — a static scan is all-green. Confirming the failure, and *correctly scoping* it, needs a human to view the empty field, recognise the required-format prompt as in-scope text, eyedrop its least-contrast region over the gradient, and apply the decorative exclusion to the mantra field.

## Citation
> "This success criterion applies to text in the page, including placeholder text and text that is shown when a pointer is hovering over an object or when an object has keyboard focus. If any of these are used in a page, the text needs to provide sufficient contrast."
— wcag-understanding/contrast-minimum.html (Intent)

> "Text that is decorative and conveys no information is excluded. For example, if random
>          words are used to create a background and the words could be rearranged or substituted
>          without changing meaning, then it would be decorative and would not need to meet this
>          criterion."
— wcag-understanding/contrast-minimum.html (Intent)

> "To satisfy Success Criterion 1.4.3 Contrast (Minimum) and 1.4.6 Contrast (Enhanced), there must be sufficient contrast between the text and its background. For pictures, this means that there would need to be sufficient contrast between the text and those parts of the image that are most like the text and behind the text."
— wcag-techniques/failures/F83.html (Description)
