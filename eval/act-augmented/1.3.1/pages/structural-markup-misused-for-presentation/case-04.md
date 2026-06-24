# case-04 — Decorative `<fieldset>`/`<legend>` box around promo prose with no form controls

## Scenario
A nonprofit food-bank campaign landing page. A "Matching Gift This Week" highlight box is
built with `<fieldset><legend>Matching Gift This Week</legend> … prose … </fieldset>` purely
to obtain the inset, notched-border look that fieldset+legend produce. The box contains only a
heading-like paragraph, body prose, and a jump link — **no** `<input>`, `<select>`,
`<textarea>`, radio, or checkbox. Lower on the same page sits a *real*, correctly grouped
donation-amount `<fieldset>` (radio buttons + legend), so the page genuinely has forms; the
decorative fieldset is the defect, deliberately placed beside a legitimate one to sharpen the
distinction.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component/pattern:** promotional "highlight"/callout box
- **host-language construct:** `<fieldset>` + `<legend>` with no controls inside
- **locale/i18n:** en (US)
- **failure-mechanism:** control-grouping markup over content with no controls, used for a
  bordered look (F43, "Using the fieldset and legend elements to give a border to text")

## Developer persona
A volunteer designer building the campaign page in a visual editor wanted a boxed callout with
a title that notches into the top border. They had previously seen that styling come from a
`<fieldset>`/`<legend>` on a form, so they reused the same markup for the promo box because it
gave the exact border treatment they wanted — without realising `<fieldset>` declares a group
of form controls to assistive technology.

## Element / selector carrying the issue
`fieldset.promo` with its child `legend` ("Matching Gift This Week"). Selector:
`main > fieldset.promo`.

## Exact accessibility mechanism (what AT experiences, why it fails)
`<fieldset>` has the implicit ARIA role `group`, and its `<legend>` becomes the group's
accessible name. Screen readers therefore announce a *form-control group* named "Matching Gift
This Week" surrounding the promotional prose, and AT users navigating forms or fields may be
told they are entering/inside a group that, by its semantics, should contain related controls.
There are none. The markup asserts a grouping relationship between form controls that does not
exist in the content — the box is just text. An AT user looking for the controls implied by the
group finds nothing, and the false "group" pollutes the forms/landmarks model. Per F43 this is
fieldset/legend used to give a border to text rather than to group controls. (The genuine
donation fieldset below behaves correctly and is the contrasting PASS.)

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A `<fieldset>` that *has* a `<legend>` is the pattern automated tools reward: axe-core checks
that grouped controls sit inside a fieldset and that fieldsets carry a legend, and it has no
rule that a fieldset must actually contain form controls. A fieldset wrapping only prose trips
nothing in axe, WAVE, or Lighthouse — to them it looks like best-practice grouping. Determining
that this particular fieldset groups *no controls* and was chosen only for its border requires
reading the box's contents and recognising there is nothing to group — a semantic judgment.

## Citation
> **WCAG Techniques, F43 — "Using the fieldset and legend elements to give a border to text":**
> "`<fieldset> <legend>Bargain Corner</legend> <p>Buy today, and save 20%</p> </fieldset>`"

(Verbatim from `wcag-techniques/failures/F43.html`. This page reproduces that exact failure:
a fieldset/legend drawn around promo prose ("Matching Gift This Week" / "2× every dollar")
with no form controls inside.)

> **WCAG 2.2 Understanding Info and Relationships, Intent:**
> "form fields may be positioned as groups that share text labels"

(Verbatim from `wcag-understanding/info-and-relationships.html`. `<fieldset>`/`<legend>` exist
to encode that real relationship — a group of form fields sharing a label — which is absent
here, so the markup misrepresents the content.)
