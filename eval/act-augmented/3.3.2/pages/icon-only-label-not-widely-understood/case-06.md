# case-06 — Public-benefits form whose only visible cues are a ¶ (pilcrow) and a λ, opaque to its actual audience

## Scenario
"Riverside County" Department of Community Services runs an online *Apply for winter energy
assistance* (LIHEAP) form. The page states its intended audience explicitly: "Open to all county
residents. Most applicants are seniors on fixed incomes and recently-arrived immigrant families."
Two rows are correctly text-labeled ("Applicant last name", "Home ZIP code"). The next two rows have
NO text label — each field's only visible cue is a square pictogram tile holding a single glyph: a
**pilcrow ¶** (an editor's/typesetter's end-of-paragraph mark) for a field that actually expects the
*number of people in your household*, and a **Greek lambda λ** for a `<select>` that expects the
applicant's *monthly gross income bracket (A–F)*. A pilcrow is genuinely "widely understood" — by
editors and typographers — but it is opaque to THIS form's stated audience; λ means nothing about
income to anyone. The failure turns on the audience-relative "widely understood by the intended
target audience" limb, not on a generically meaningless glyph.

## Attribute tuple
- **content-domain:** government / civic services — public benefits (energy-assistance) application
- **UI-component/pattern:** multi-step gov form mixing two text-labeled rows with two glyph-tile rows (one `<input>`, one `<select>`)
- **host-language construct:** `<span aria-hidden="true"><svg>…¶…</svg></span>` beside `<input aria-label="Number of people in your household">`, and an `aria-hidden` λ `<svg>` beside `<select aria-label="Monthly gross household income bracket, codes A through F">`
- **locale/i18n:** en-US page, but audience-relative comprehension (seniors + recently-arrived immigrant applicants) is the crux
- **failure-mechanism:** icon-only labels whose glyphs (¶, λ) are not widely understood **by the intended target audience**, even though one (¶) is well understood by a different, narrower audience

## Developer persona
A contractor themed the form so "every field gets a tidy pictogram tile." The last two fields had no
obvious icon, so the contractor grabbed glyphs from a generic symbol set — a paragraph/pilcrow mark
and a Greek lambda — because they "looked clean and official," and added an `aria-label` to each so
the accessibility scanner stayed green. No one asked whether a senior or a recently-arrived applicant
could read "household size" out of a ¶ or "income bracket" out of a λ.

## Element / selector carrying the issue
- `input[aria-label="Number of people in your household"]` — sole visible cue is the preceding
  `span.pic > svg` rendering a pilcrow ¶ (`aria-hidden="true"`).
- `select[aria-label="Monthly gross household income bracket, codes A through F"]` — sole visible cue
  is the preceding `span.pic > svg` rendering a Greek λ (`aria-hidden="true"`).
- (Passing contrast: `#lname` and `#zip` carry real `<label>` text.)

## Exact accessibility mechanism
Both glyph-only controls are exposed with role `textbox`/`combobox` and the correct accessible name
from `aria-label` ("Number of people in your household"; "Monthly gross household income bracket, codes
A through F"), confirmed in the rendered Chromium AX tree, so 4.1.2 Name, Role, Value is satisfied and
a screen-reader user is told exactly what to enter. A sighted applicant, however, sees only a ¶ tile
and a λ tile — no text label, placeholder, or hint is presented to them. The criterion requires the
visible label to be widely understood *by the intended target audience*; a pilcrow (an editor's mark)
and a lambda are not understood by this form's stated audience of seniors and recently-arrived
applicants as "household size" and "income bracket." The two correctly text-labeled rows above set the
expectation that fields carry words, making the omission sharper. The visible cue therefore fails to
communicate what input is expected, a 3.3.2 image-label "widely understood" failure distinct from the
satisfied 4.1.2 name-presence requirement.

## Expected ACT-style outcome
**failed** (SC 3.3.2 Labels or Instructions — visible-cue-adequacy / image-label limb). Programmatic
names are present and correct (4.1.2 passes) and two sibling fields are properly labeled, but the only
visible cue for the household-size and income-bracket fields is a glyph (¶ / λ) not widely understood
by the intended target audience.

## Why automated tools miss it
axe-core (`label` / `aria-input-field-name` / `select-name`), WAVE, and Lighthouse only verify that
each control has a non-empty accessible name; the `aria-label`s satisfy that and the glyph SVGs are
`aria-hidden`, so all report no violation. No scanner rasterises the inline SVGs to recognise they
render as "¶" and "λ", and none carries an audience model that can decide a pilcrow is understood by
editors but not by seniors or recently-arrived benefits applicants. Whether a rendered glyph is
"widely understood by the intended target audience" is an irreducibly human, audience-relative visual
and semantic judgment — which is why automated tools and a human reviewer DISAGREE here (tools: pass;
human: fail).

## Citation
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "Note that the majority of form control labels are text-based. Using images as labels meets the requirements of the criterion, but care should be taken to ensure that the images are widely understood by the intended target audience. Authors may consider providing additional hints, such as text-based tooltips or supplementary text, to support clarity when using image-based labels."
>
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "It is possible for controls and inputs to have an appropriate accessible name or description (e.g. using `aria-label=\"...\"`) and therefore pass Success Criterion 4.1.2, but to still fail this success criterion (if the labels or instructions aren't presented to all users, not just those using assistive technologies)."
