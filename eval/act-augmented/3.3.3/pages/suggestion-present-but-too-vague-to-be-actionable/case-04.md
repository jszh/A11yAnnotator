# case-04 — German tax portal: "Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut." on a Steuer-ID with a fixed 11-digit format

## Scenario
A German state tax portal ("Finanzportal des Landes") re-displays an electronic tax-return form after a failed submit. The **Steuer-Identifikationsnummer** (tax ID) field is correctly flagged — `aria-invalid="true"`, error tied via `aria-describedby`, a `role="alert"` summary, focus moved — but the message is the German equivalent of the most generic filler there is: **"Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut."** ("Please check your entry and try again."). The German tax ID has a fixed, publicly documented format — **exactly 11 digits** — which the validator enforces (`/^\d{11}$/`), yet the message never states it. The user entered `DE 4711 X`; they are told only to "check and retry," with no hint that the field wants 11 plain digits. A sibling field (Postleitzahl / postal code) is an always-correct contrast control whose hint names its format precisely ("Fünf Ziffern, z. B. 10115.").

## Attribute tuple
- **content-domain:** government / civic services portal (tax return)
- **UI-component / pattern:** server-redisplayed `<fieldset>`/`<legend>` form with `role="alert"` summary + inline error
- **host-language construct:** `<input type="text" inputmode="numeric" aria-invalid aria-describedby>` inside a fieldset
- **locale / i18n:** **de-DE** — the entire UI and the error message are German; the adequacy judgment must be made on German prose
- **failure-mechanism:** fix-oriented German filler substituted for the field's known 11-digit format
- **prevalence:** LONG-TAIL — combines a non-English locale with a country-specific identifier whose format is determinate but culturally specific

## Developer persona
A German public-sector contractor localized a generic form framework. The framework shipped one default validation string, which the team translated faithfully to "Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut." and reused for every field. The Steuer-ID's real rule (11 Ziffern) lives only in the regex. Because the translation reads as polite, grammatical, fix-oriented German and the error plumbing is correct, both the content review and the automated scan signed off.

## Element / selector carrying the issue
`#stid-fehler` ("Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.") describing `#stid`, whose validator enforces `^\d{11}$`. The PASS contrast control is `#plz-hinweis` ("Fünf Ziffern, z. B. 10115.").

## Exact accessibility mechanism (what AT experiences / why it fails)
- **German screen-reader user (NVDA + German voice):** focus lands on the field and they hear "Steuer-Identifikationsnummer, Pflichtfeld, Eingabe ungültig, Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut." They have checked their entry — it is their tax ID — and the message offers no clue that the field wants 11 digits with no letters or spaces. They cannot know whether to strip the "DE", the spaces, or the "X", or to add digits.
- **Cognitively-loaded user:** "überprüfen und erneut versuchen" assumes they know the correct shape; they do not, and it is withheld.
- **Contrast (PLZ field):** its hint states the format and an example, so the user can comply on the first try — the actionable target the Steuer-ID error lacks.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — the required format is fixed and knowable (11 digits) so a correction can be suggested; the German message provides neither a suggested value nor adequate information to fix the error).

## Why automated tools miss it
3.3.1 passes: the error is identified, associated, in a `role="alert"`, and focused — confirmable by axe/WAVE/Lighthouse regardless of language. A fix-phrasing heuristic, if it even handled German, would match "überprüfen"/"versuchen Sie es erneut" as corrective language. To flag this a tool would need to (a) understand the German sentence is content-free filler, (b) know the Steuer-ID's canonical format is 11 digits, and (c) judge that the message withholds it — a cross-lingual semantic-adequacy chain no scanner performs. Locale multiplies the difficulty: tools that have any error-quality heuristic at all are English-tuned.

## Citation
> "Some examples of information that is not accepted include information that is required but omitted by the user and information that is provided by the user but that falls outside the required data format or allowed values."
— wcag-understanding/error-suggestion.html (Intent) — `DE 4711 X` falls outside the required 11-digit format; that format is the suggestable information being withheld.

> "However the text description is provided, it should do one of the following … Provide examples of the correct data entry for the field, [or] Describe the correct data entry for the field."
— wcag-techniques/general/G85.html (Description) — the German message does neither; the PLZ hint shows what compliance looks like.

> "Determine whether guidance provides sufficient details for how to correct the error and/or offers suggestions of corrected input."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (How to Test) — "Bitte überprüfen Sie Ihre Eingabe" supplies no such detail.
