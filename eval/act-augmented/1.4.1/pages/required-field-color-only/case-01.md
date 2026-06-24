# case-01 — Required labels red, optional black, instruction is the self-referential "Required fields appear in red"

## Scenario
A volunteer sign-up form for the Riverside Food Bank's "Spring Distribution Drive." The form
mixes required and optional fields (first/last name, email, preferred shift are required;
middle name, phone, dietary notes, free-text notes are optional). The **only** visual
distinction between a required field and an optional field is the **colour of the label**:
required labels are red (`#c62828`), optional labels are black. A general instruction sits at
the top — but it reads only **"Required fields appear in red."** That sentence states the
colour rule yet, for a user who cannot perceive red, never lets them work out *which* fields
are required. There is no asterisk, no "(required)", no icon, no `aria-required`, no per-field
text cue.

## Attribute tuple
- **content-domain:** nonprofit / volunteer recruitment (food bank)
- **UI-component/pattern:** standard registration form with a top-of-form instruction banner
- **host-language construct:** `<label class="req">` styled `color:#c62828`; optional labels
  inherit black; no `required`/`aria-required` attributes anywhere
- **locale/i18n:** en-US
- **failure-mechanism:** F81 — required fields identified by colour difference only; the
  "alternative" instruction is itself colour-keyed and self-referential, so it does not satisfy
  1.4.1's requirement for a *visible* non-colour means of identifying each required field

## Developer persona
A volunteer coordinator built this in a generic form-builder template. The template's sample
copy already said "Required fields appear in red," so she kept it verbatim and simply turned
the labels she cared about red in the style panel. She reasoned, "I told them required fields
are red, so I've explained it" — never realising the instruction only describes the colour and
gives no colour-independent way to find the required fields.

## Element / selector carrying the issue
`label.req` (the red required labels: First name, Last name, Email address, Preferred shift)
versus the black optional labels (`label` without `.req`). The discriminating signal lives
entirely in the `color` declaration. The instruction `.legend-note` is the colour-keyed
"alternative" that does not resolve the ambiguity.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user hears every field announced identically — "First name, edit text",
"Middle name, edit text", "Phone number, edit text" — with no "required" state, because no
`required`/`aria-required` exists and the label text is the same for both kinds. A sighted
colour-blind user (e.g. protanopia/deuteranopia) sees the form rendered, reads "Required fields
appear in red," then scans the labels — and cannot tell red labels from black ones, so the
instruction is useless: it told them the *rule* but they cannot apply it. Viewing the page in
greyscale (the Trusted Tester canonical method) collapses red and black labels to nearly the
same grey, confirming colour is the sole differentiator. The required-vs-optional information
is therefore conveyed by colour alone with no working visible alternative → fails 1.4.1.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The DOM is impeccable: real `<label for>`/`<input id>` pairs, accessible names on every
control, red-on-white text passes contrast (5.9:1). axe-core, WAVE and Lighthouse have **no
rule** that (1) compares the computed colour of one set of labels against another to infer that
hue is the sole required/optional differentiator, or (2) reads the prose "Required fields
appear in red" and judges that, although a text instruction is *present*, it is self-referential
and never resolves which fields are required for someone who cannot see red. The page even
survives a naive "is there an instruction about required fields?" heuristic. Distinguishing a
genuinely resolving instruction from a circular colour-keyed one is a pure semantic judgment.

## Citation
> **WCAG Techniques, F81 — "Failure of Success Criterion 1.4.1 due to identifying required or
> error fields using color differences only":**
> "A user is completing an online form, and the phone number field is required. To indicate that
> the phone number field is required, the label \"Phone Number\" is displayed in a color
> different from the color used for optional fields, without any other indication that \"Phone
> Number\" is a required field. A person with color vision deficiency or low vision may not be
> able to identify that \"Phone Number\" is a required field."

(Verbatim from `wcag-techniques/failures/F81.html`. This page reproduces that failure exactly —
required labels coloured differently from optional labels with no other indication.)

> **WCAG 2.2 Understanding, Use of Color — Intent:**
> "Examples of information conveyed by color differences: “required fields are red\", “error is
> shown in red\", and “Mary's sales are in red, Tom's are in blue\"."

(Verbatim from `wcag-understanding/use-of-color.html`. The Understanding text names "required
fields are red" as the textbook example of colour-conveyed information that needs a non-colour
alternative; the page's instruction merely restates this rule rather than providing one.)
