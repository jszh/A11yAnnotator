# case-06 — Discount field: instruction names the wrong purpose ("Enter your member ID (8 digits)") on a promo-code field

## Scenario
A film-festival ticket checkout. The visible field label is *"Discount code"* and the field is, in fact, a **promo-code** box — its validator accepts alphanumeric codes like `LUMIERE25` and its placeholder reads "PROMO CODE." But the visible, programmatically associated instruction is leftover boilerplate naming a **completely different purpose**: *"Enter your member ID (8 digits) to apply your membership benefit."* It states a numeric 8-digit rule that contradicts the field's alphanumeric promo pattern, and it points the user toward a "member ID" the discount box does not want at all. A user who follows the instruction — hunting for an 8-digit member ID, or typing 8 digits — is rejected; the field's real purpose is misrepresented by a confident, well-formed instruction. The membership-tier `<select>` below is an always-correct contrast control whose instruction matches its field exactly.

## Attribute tuple
- **content-domain:** events / ticketing (arts festival checkout)
- **UI-component / pattern:** inline "apply code" text field + button, plus a sibling membership-tier `<select>`
- **host-language construct:** `<input pattern="[A-Za-z0-9]{4,16}">` with an `aria-describedby` hint whose text is copied from another form
- **locale / i18n:** en (festival branding); the contrast control demonstrates a correct instruction-to-field match
- **failure-mechanism:** copied boilerplate names the WRONG PURPOSE entirely (member ID vs promo code) and states the wrong rule (8 digits vs alphanumeric code)

## Developer persona
The festival's web team reused a checkout template from a *members-only* venue site, where the same box collected an 8-digit member ID. For the public festival they relabelled the field "Discount code," swapped the validator to accept promo codes, and set the placeholder to "PROMO CODE" — but the helper paragraph, *"Enter your member ID (8 digits)…",* was a separate string left over from the source template. It's grammatical, names a concrete rule, and "provides an instruction," so it passed copy review and an axe scan. The instruction describes a field that no longer exists here.

## Element / selector carrying the issue
`#promo-hint` (text "Enter your member ID (8 digits) to apply your membership benefit") describing `#promo`, a discount/promo field whose `pattern="[A-Za-z0-9]{4,16}"`, placeholder "PROMO CODE," and validator (accepts `LUMIERE25`, rejects `\d{8}`) demonstrate a different purpose and rule than the instruction states.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the field hears "Discount code, edit, Enter your member ID (8 digits) to apply your membership benefit." The label says one thing (discount code) and the instruction says another (member ID). They reasonably trust the more specific instruction, search for a member ID they may not possess, or type 8 digits — and are rejected with "Enter a promo code such as LUMIERE25." The up-front instruction named the wrong purpose, which the Understanding identifies as a labels-or-instructions failure.
- **Cognitively-loaded user:** the conflicting label-vs-instruction pairing is disorienting; a user without a membership may abandon checkout believing the discount is members-only.
- **Contrast control:** the membership-tier `<select>` hears "Membership tier (for member pricing) … Select the tier printed on your membership card …" — purpose and instruction agree, so it passes; this sharpens that the defect is the *correspondence* between words and field, not the presence of an instruction.

## Expected ACT-style outcome
**failed** (SC 3.3.2 — an instruction identifying the control is provided, but it identifies the wrong control/purpose and states a rule the field does not enforce; it does not let the user "know what input data is expected"). The sibling membership-tier select is a **passed** contrast control on the same page.

## Why automated tools miss it
The instruction is present, non-empty, associated, and readable — TT 5.A and ACT pass it, and axe/WAVE/Lighthouse confirm the label, the resolved `aria-describedby`, the contrast, and the role. No scanner reads "member ID (8 digits)," reads the alphanumeric promo `pattern` and the placeholder "PROMO CODE," and reasons that the instruction names a different purpose and an incompatible rule. There is no automated model of "what is this field actually for" to compare against the prose. Detecting it requires reading the instruction, inferring the field's real purpose from its pattern/placeholder/validator, and noticing they describe different things.

## Citation
> "The intent of this success criterion is to have content authors present instructions or labels that identify the controls in a form so that users know what input data is expected."
— wcag-understanding/labels-or-instructions.html (Intent) — the instruction here misidentifies the control (member ID vs promo code), so the user does NOT know what input is expected.

> "Too much information or instruction can be just as harmful as too little."
— wcag-understanding/labels-or-instructions.html (Intent) — a confident instruction for the wrong purpose is the "harmful" case; it actively misdirects the user.

> "Visual labels or instructions are provided for form elements." … "This test only determines whether visual labels/instructions are **present**, regardless of accuracy."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A) — the instruction is present, so the presence-only procedure passes; its wrong-purpose content is out of the test's reach.
