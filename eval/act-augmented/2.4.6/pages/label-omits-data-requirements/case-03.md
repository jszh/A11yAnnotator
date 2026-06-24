# case-03 — "Card number" field accepts only 16 un-spaced digits, format unstated in the label

## Scenario
An e-commerce checkout (Maillot Cyclery bike shop). The payment form has four fields. Three carry
their format inline: "Expiry (MM/YY)", "Security code (3 digits)". The card-number field is labelled
merely **"Card number"** — no statement of the accepted format. Its validator is `/^\d{16}$/`: it
accepts *only* 16 bare digits and rejects the grouped form ("4111 1111 1111 1111") that is printed on
the physical card and that almost everyone types. There is no input mask or auto-formatting to hint at
the shape, and "16 digits, no spaces" appears only in the post-submit error.

## Attribute tuple
- **content-domain:** e-commerce product & checkout (cycling retailer)
- **UI-component/pattern:** two-column checkout with payment fieldset + order summary
- **host-language construct:** `<label>` + `<input type="text" inputmode="numeric">`; sibling labels carry "(MM/YY)" / "(3 digits)" but this one does not
- **locale/i18n:** en-US
- **failure-mechanism:** data-type/format requirement (16 digits, no spaces) omitted from a label whose siblings show theirs

## Developer persona
A Shopify theme was customised by an agency that hand-rolled a custom payment step instead of the
hosted card field. The agency wrote concise format hints for expiry and CVC ("they're short, people get
them wrong"), but assumed the card number was "obvious" and left the label bare. The validation regex
came from a payment gateway's example that pre-strips spaces server-side — but the agency forgot to
strip on the client, so the un-spaced-only rule leaked to the UI with no matching label cue.

## Element / selector carrying the issue
`#card-number` (`input[name="card-number"]`), label "Card number" via `label[for="card-number"]`. No
inline format text and no `aria-describedby`; the `/^\d{16}$/` constraint lives only in the submit
handler and the error message. Sibling labels `#exp` ("Expiry (MM/YY)") and `#cvc` ("Security code
(3 digits)") demonstrate the format cue this one lacks.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user reaches "Card number, edit text" — correctly associated and non-empty, so 3.3.2
and 4.1.2 pass. The name conveys the topic (a card number) but not the applicable data requirement: the
field demands exactly 16 digits with no spaces, while the number on the card is printed in groups of
four. A user typing it as printed is rejected and only then, via the error, learns the accepted format.
The contrast with the sibling fields makes the shortfall sharper — the page knows how to put a format
cue in a label and did so for the easier fields, but omitted it from the field with the strictest,
least-obvious constraint. The topic is correct, so this is the data-requirement limb of TT 5.B, not the
topic-mismatch case ACT cc0f0a covers.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The label is present, associated via `for`/`id`, and non-empty; the input has valid attributes
(`inputmode`, `autocomplete="cc-number"`) — axe-core, WAVE and Lighthouse report a correctly labelled
field. No scanner executes or parses the `/^\d{16}$/` regex to discover that spaces are rejected, and
none can judge that "Card number" alone fails to communicate the accepted format. Deciding the label is
topically right but requirement-blind — especially when its own siblings show their formats — is human
semantic judgment.

## Citation
> **Trusted Tester v5.1.3 — Test 5.B, How to Test step 2:**
> "Determine whether labels and/or instructions for form components sufficiently describe the purpose and applicable data requirements (**date formats**, required fields, **data type**, etc.)."

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. The accepted card-number format/data-type — 16 digits, no spaces — is exactly the data requirement this label omits.)

> **Trusted Tester v5.1.3 — Test 5.B, Evaluate Results:**
> "Each visual form label is sufficiently clear and descriptive, so users know what input data is expected"

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. A user cannot know from "Card number" that spaces are forbidden and exactly 16 digits are required, so they do not know what input is expected.)
