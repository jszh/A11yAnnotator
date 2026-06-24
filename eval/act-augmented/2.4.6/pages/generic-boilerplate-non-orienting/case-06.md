# case-06 — PASS control: descriptive re-heading of the support page + descriptive re-labelling of the settings form

## Scenario
This control deliberately mirrors the structure of case-01 (a three-section help article)
and case-02 (a notification-preferences form) on one page, but every heading and every label
is now **descriptive**. The headings read "Refund policy", "Delivery times & costs",
"Two-year warranty", "Notification preferences"; the form labels read "Email digest
frequency", "Colour theme", "Interface language", "Quiet-hours start time". Same DOM shape,
same body content, same domain — the only change is text that now lets a user predict and
orient. It exists so a reviewer can see exactly where "generic" tips into "orienting".

## Attribute tuple
- **content-domain**: e-commerce help centre + account preferences (combined)
- **UI-component/pattern**: long-form help article with in-page ToC + a labelled preferences form
- **host-language construct**: `<section aria-labelledby>` with descriptive `<h2>` headings; native `<label for>` controls
- **locale/i18n**: en-GB
- **failure-mechanism**: NONE — descriptive boundary control; headings and labels each describe the topic/purpose of their content

## Developer persona
The same help-centre author and the same backend engineer from case-01/02, but this time
they completed the renaming step: the author replaced the template's "Information"
placeholders with real section titles, and the engineer mapped each preference row to its
human-readable name before shipping. This is what the two failing pages should have looked
like.

## Element / selector carrying the issue
- PASS: `h2#s1` "Refund policy", `h2#s2` "Delivery times & costs", `h2#s3` "Two-year
  warranty", `h2#s4` "Notification preferences" — each describes its section.
- PASS: `label[for="f-digest"]` "Email digest frequency", `label[for="f-theme"]`
  "Colour theme", `label[for="f-lang"]` "Interface language", `label[for="f-quiet"]`
  "Quiet-hours start time" — each makes its control's purpose clear.
- PASS: `button[type=submit]` "Save preferences" — its function is clear.

## Exact accessibility mechanism
A screen-reader user pulling up the heading list now hears a meaningful outline — "Refund
policy · Delivery times & costs · Two-year warranty · Notification preferences" — and can
jump straight to the warranty or the delivery table. Tabbing through the form, each control
announces a name that tells the user what it does: "Email digest frequency, combo box, Once
a day." The descriptive headings and labels satisfy both limbs of 2.4.6: headings describe
the topic/purpose of their sections (Test 10.A) and labels make each control's purpose clear
(Test 5.B). Nothing on the page requires the user to read a whole block to discover what it
is about.

## Expected ACT-style outcome
**passed** — all headings and labels are present and sufficiently descriptive of their
content's topic or purpose; this is the descriptive contrast for cases 01/02.

## Why automated tools miss it
Automated tools would also "pass" this page — but for the wrong reason: they only verified
presence/association (non-empty headings, associated labels), exactly as they did for the
failing cases 01 and 02. The reason this page genuinely passes 2.4.6 — that the text is
*descriptive* — is invisible to them; only a human comparing each heading/label to its
content can confirm descriptiveness. The value of this control is to show that
presence-checking cannot distinguish it from the failing pages, which is the whole point of
the aspect.

## Citation
> **WCAG 2.2 Understanding 2.4.6 — Intent**
> "When headings are clear and descriptive, users can find the information they seek more
> easily, and they can understand the relationships between different parts of the content
> more easily. Descriptive labels help users identify specific components within the
> content."

> **WCAG Techniques — G130: Providing descriptive headings**
> "Descriptive headings and titles … work together to give users an overview of the content
> and its organization."

> **Trusted Tester 5.1.3 — Test 10.A / 5.B**
> "PASS if: The heading describes the topic or purpose of its content." / "Each visual form
> label is sufficiently clear and descriptive, so users know what input data is expected."
