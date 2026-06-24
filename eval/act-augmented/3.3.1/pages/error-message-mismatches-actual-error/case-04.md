# case-04 — Donation amount (de-DE): value "1.234,56" valid for declared locale, error demands en-US "1234.56" format (wrong format asserted under i18n)

## Scenario
A German-language donation page (`lang="de"`, de-DE locale) in its **post-submit error state**. The donation-amount field retains `1.234,56`, which is a perfectly valid German currency string (dot = thousands separator, comma = decimal separator → €1,234.56). The visible, associated German error reads *"Der Betrag ist ungültig. Bitte geben Sie einen gültigen Betrag im Format 1234.56 ein."* ("The amount is invalid. Please enter a valid amount in the format 1234.56.") — i.e. it prescribes an **en-US** decimal format that is wrong for a German user and unnecessary for a value already valid in the page's own declared locale.

## Attribute tuple
- **content-domain:** nonprofit / donation flow (EU)
- **UI-component / pattern:** currency `<input inputmode="decimal">` with `aria-describedby` hint + error, `aria-invalid="true"`, scoped `lang="de"`
- **host-language construct:** localized German UI; error string embeds a foreign-locale format exemplar
- **locale / i18n:** de-DE — comma decimal separator, dot thousands separator (the failure is locale-specific)
- **failure-mechanism:** boilerplate mismatch — message asserts a format defect that is **false in the declared locale**; the value is already valid de-DE

## Developer persona
A developer localized the donation UI strings into German but reused a number-validation library configured for the en-US locale (period decimal). The library rejects `1.234,56` because it reads the comma as invalid, and the translator faithfully translated the library's default message — *including the literal en-US format exemplar "1234.56"* — into German without realizing it prescribes the wrong separator. The German text is grammatical and "describes how to fix it," so it passed linguistic QA and an axe scan (valid `lang`, label present, contrast fine). The locale mismatch is invisible to anyone not reasoning about de-DE number grammar.

## Element / selector carrying the issue
`#betrag-err` ("...im Format 1234.56...") asserting an en-US format against `#betrag[value="1.234,56"]`, a value already valid in the page's declared de-DE locale.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **German screen-reader user (NVDA/JAWS in German):** focusing the field hears the German label and the German error telling them to use the format `1234.56`. To a German speaker, `1234.56` reads as malformed (a German amount uses `1.234,56`); the instruction tells them to enter their euros in a foreign format. Their already-correct value is declared invalid and the "fix" would produce a value that looks wrong in their locale. They cannot determine what is actually wrong (nothing is — the real bug is the validator's locale).
- **Cognitive load / non-technical donor:** receives an authoritative German instruction that contradicts how German numbers are written, producing confusion and likely abandonment.
- **Sighted German user:** same — the message's exemplar plainly conflicts with German number conventions.

## Expected ACT-style outcome
**failed** (SC 3.3.1 — the described error misidentifies the nature of the problem; for a value valid in the declared locale, the message asserts a false format defect and never describes any real error).

## Why automated tools miss it
ACT 36b590 passes: a visible, in-tree indicator names the field and "describes how to resolve it" (it states a format). axe/WAVE/Lighthouse pass: `lang="de"` is a valid BCP-47 tag, the label is associated, `aria-describedby` resolves, contrast is fine. No automated tool parses locale-specific number grammar to determine that `1.234,56` is already a valid de-DE amount, nor that the message prescribes a foreign (en-US) format. Judging value↔locale↔message agreement requires knowing German number formatting and reading the value against the declared locale and the message together — a contextual, i18n-aware human judgment.

## Citation
> "The intent of this success criterion is to ensure that users are aware that an error has occurred and can determine what is wrong."
— wcag-understanding/error-identification.html (Intent) — here no real error exists, yet a false one is asserted, so the user cannot determine what (if anything) is wrong.

> "information that is provided by the user but that falls outside the required data format or allowed values."
— wcag-understanding/error-identification.html (Intent — definition of input error) — the value does NOT fall outside the required (de-DE) format, so the asserted format error is factually wrong.

> "locale-specific date/number/currency formats in error messages"
— eval/act-augmented/_seeds/facets.json (i18nContexts) — the diversity facet this page realizes: a localized error whose embedded format exemplar is from the wrong locale.
