# case-05 — German "Betrag" (Amount) field rejects the € symbol; locale-specific format unstated

## Scenario
A German statutory health-insurer's online portal ("Mittelrhein Krankenkasse"), reimbursement claim
form, entirely in German (`lang="de"`). The amount field is labelled with the correct topic noun
**"Betrag"** (Amount). Its validator is `/^\d+,\d{2}$/`: it accepts only a comma decimal with exactly
two fraction digits and **no currency symbol** and **no thousands separator** (e.g. "85,00"). The most
natural German entry — "85,00 €" with the euro sign, or "1.250,00" with the German thousands dot, or
the English "85.00" — is rejected. The required shape is disclosed only in the post-submit error. A
sibling field, "IBAN (DE, 22 Stellen)", *does* carry its format, sharpening the omission on "Betrag".

## Attribute tuple
- **content-domain:** healthcare / statutory-insurance patient portal (Germany)
- **UI-component/pattern:** reimbursement claim sheet (treatment + amount + IBAN)
- **host-language construct:** `<label>` + free-text `<input inputmode="decimal">` + JS regex; sibling IBAN label carries its format, "Betrag" does not
- **locale/i18n:** de-DE — locale-specific currency format (comma decimal, € symbol) is the trap
- **failure-mechanism:** data-type/currency-format requirement (no € symbol, comma decimal, two digits) omitted from a topically-correct label

## Developer persona
An in-house developer at the Krankenkasse localised the form to German and correctly used a comma
decimal in the backend's parser, but wrote the parser to be strict (no symbol, no grouping) to match a
legacy mainframe import. They added a clear format hint to the IBAN field (because IBANs are obviously
formatted) but assumed the euro amount was self-evident and left "Betrag" bare — not realising the
strict parser would reject the euro sign that German users habitually type after the number.

## Element / selector carrying the issue
`#betrag` (`input[name="betrag"]`), label "Betrag" via `label[for="betrag"]`. No format hint and no
`aria-describedby`; the `/^\d+,\d{2}$/` constraint (comma decimal, two fraction digits, no € symbol, no
thousands dot) lives only in the submit handler and the error message. The sibling `#iban` label
("IBAN (DE, 22 Stellen)") demonstrates the inline format cue this field lacks.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user (e.g. NVDA in German) hears "Betrag, Eingabe Text" — a correctly associated,
non-empty accessible name, so 3.3.2 and 4.1.2 pass. The name conveys the topic (an amount) but not the
applicable, locale-specific data requirements: comma decimal, exactly two fraction digits, no currency
symbol, no thousands separator. A German user typing "85,00 €" as they would on paper is rejected
solely because of the euro sign, with no way to anticipate that from "Betrag". The format is disclosed
only in the after-submit error — the situation TT 5.B's Note forbids. Because the topic is correct, this
is the data-requirement limb, not a topic mismatch.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The label is present, associated, and non-empty in the document's declared language — axe-core, WAVE
and Lighthouse see a properly labelled field and report nothing. No scanner reads the `/^\d+,\d{2}$/`
validator to learn the euro symbol and thousands separator are rejected, and none has the locale
knowledge to judge that a German amount label should state "no € symbol, comma decimal". Recognising
this requires a human who understands both German number conventions and that the label omits the
requirement its own sibling IBAN field shows.

## Citation
> **Trusted Tester v5.1.3 — Test 5.B, How to Test step 2:**
> "Determine whether labels and/or instructions for form components sufficiently describe the purpose and applicable data requirements (date formats, required fields, **data type**, etc.)."

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. The accepted data type/format — comma decimal, two digits, no currency symbol — is the data requirement "Betrag" omits.)

> **Trusted Tester v5.1.3 — Test 5.B, Notes:**
> "An **error message is not sufficient** to communicate the expected format to pass this test."

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. The "ohne Währungszeichen, mit Komma" rule appears only in the post-submit error, which this Note disallows.)
