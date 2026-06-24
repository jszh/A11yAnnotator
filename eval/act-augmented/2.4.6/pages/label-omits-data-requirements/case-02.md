# case-02 — Required "Email" field with no required indicator while siblings are marked "(required)"

## Scenario
A nonprofit donation form ("Riverkeepers Alliance"). A legend states "Fields marked (required) must
be completed." Two fields — **First name (required)** and **Gift amount (required)** — carry the
indicator. A third field, **Email**, is *also* required (it has the `required` attribute, the submit
handler blocks without it, and it is where the receipt and tax acknowledgement are sent) but its
visible label is just **"Email"** with no "(required)" word. The page has taught the user that
"(required)" marks mandatory fields, then silently breaks that convention on this one field, so its
label fails to convey that the field must be completed.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component/pattern:** vertical donation form with an explicit "(required)" key/legend
- **host-language construct:** `<label>` + `<input required>`; sibling labels carry a `.req` span, this one omits it
- **locale/i18n:** en-US
- **failure-mechanism:** required-status data requirement conveyed for siblings, omitted from the label of an equally-required field

## Developer persona
A volunteer front-end developer built the form from a component library where required fields are
flagged by adding a `<span class="req">(required)</span>` inside the label. They added it to the first
two fields, then later inserted the Email field by copy-pasting the First-name row, deleted the
`(required)` span "because the email looked self-evidently needed," but kept the `required` attribute
for validation. The visible convention and the actual requirement diverged.

## Element / selector carrying the issue
`#email` (`input[name="email"]`), label "Email" via `label[for="email"]`. Sibling labels for `#fname`
and `#amount` include `span.req` reading "(required)"; the email label does not, despite `#email`
carrying the `required` attribute and being enforced by the submit handler.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user has just been told, in the legend, that "(required)" is the required-field cue,
and has heard "First name, required, edit text" and "Gift amount, required, edit text" announced with
that visible cue present in the label. Arriving at "Email, edit text" (the `required`/`aria-required`
attribute may add a terse "required" token in some setups, but it is *not* in the visible label and is
inconsistent with the page's own stated convention), the user reasonably reads "Email" as the optional
field the legend's wording implies it is not. The descriptiveness shortfall is that the *label* fails
to communicate the required data requirement — a requirement TT 5.B lists ("required fields") and G131
says the label may carry — even though sibling labels do. This is not a topic-match question (ACT
cc0f0a territory); the topic is fine, the requirement cue is missing.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The label is present, associated, and non-empty, and the field carries a real `required` attribute, so
axe-core sees a correctly labelled, required input and reports no problem — many tools would actually
treat the presence of `required` as a *good* sign. No automated checker compares the visible required
convention used on sibling labels against this one to notice the inconsistency, nor judges that, given
the page's own "(required)" key, the omission makes the label non-descriptive of its requirement. That
is a contextual, human reading of the form's stated convention versus this field's label.

## Citation
> **WCAG Technique G131 — Providing descriptive labels, Description:**
> "The label may also be used to include text or a text symbol indicating that input is required."

(Verbatim from `wcag-techniques/general/G131.html`. The sibling labels use this device; the required Email label omits it, so the label does not indicate that input is required.)

> **Trusted Tester v5.1.3 — Test 5.B, How to Test step 2:**
> "Determine whether labels and/or instructions for form components sufficiently describe the purpose and applicable data requirements (date formats, **required fields**, data type, etc.)."

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. "Required fields" is exactly the data requirement this label fails to convey.)
