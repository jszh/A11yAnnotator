# case-03 — Latitude/longitude pair entered as two "Decimal degrees" inputs with no coordinate grouping

## Scenario
An insurance underwriting flow (Cascade Mutual, wildfire-risk property survey). To pin the
insured structure's exact point, the form collects a latitude/longitude pair as two adjacent
native text inputs. Each input is labeled only with its UNIT — "Decimal degrees" — so the
two labels are identical. The left input is the latitude (`name="lat"`, value `44.0582`),
the right is the longitude (`name="lng"`, value `-121.3153`), but neither field alone says
"latitude" or "longitude", and nothing labels the two together as a coordinate. The role and
order of each field are conveyed only by left-to-right position (and by the invisible `name`
attribute).

## Attribute tuple + developer persona
- **content-domain:** insurance quote / underwriting risk survey
- **UI-component/pattern:** lat/lng coordinate-pair entry beside a map preview
- **host-language construct:** two native `<input inputmode="decimal">` in a flex pair
- **locale/i18n:** en-US; decimal-degrees notation
- **failure-mechanism:** each field labeled by its UNIT ("Decimal degrees"), not its role;
  the group meaning (an ordered latitude/longitude coordinate) is required to use the
  fields correctly but is never stated — only position + `name=` convey it
- **persona:** A back-end-leaning full-stack developer wired the inputs to a Leaflet map's
  drag handler. In the data model the fields are `lat` and `lng`, so to the developer the
  meaning was "obvious from the code." For the visible label they reused a shared "numeric
  unit" component that stamps the unit string ("Decimal degrees") as the label. They tested
  by dragging the pin (which fills both boxes) and never typed values manually, so they
  never experienced the ambiguity a keyboard/typed-entry user hits.

## Element / selector carrying the issue
`.pair` — the two inputs `#c1` (latitude, `name="lat"`) and `#c2` (longitude, `name="lng"`),
both labeled "Decimal degrees". No `<fieldset>`/`<legend>`, no "Coordinates"/"Latitude"/
"Longitude" text, no `aria-labelledby` group description.

## Exact accessibility mechanism (what AT experiences / why it fails)
- Both inputs have an associated, visible, non-empty `<label>` ("Decimal degrees"), so
  4.1.2 and missing-label checks pass.
- "Decimal degrees" labels the UNIT, not the field's role. Per the Understanding, labels
  must "identify the controls … so that users know what input data is expected" — here the
  user is not told which box is latitude and which is longitude, nor that the two form a
  coordinate.
- A screen-reader user hears "Decimal degrees, edit … Decimal degrees, edit" — two
  identical fields with no group description; the H71 "additional heading … specific to that
  particular group" is required and absent.
- A typed-entry user must guess the order; swapping lat/lng (44.06 / -121.32) silently
  relocates the pin. The information needed to enter data correctly is not provided in
  text, so SC 3.3.2 fails (F82's set-of-fields rationale generalized to a coordinate pair).

## Expected ACT-style outcome
**failed** — the field pair requires a group/role label (which is latitude, which is
longitude, and that together they are a coordinate); the only label present is the shared
unit "Decimal degrees", so users do not know what input is expected in each field.

## Why automated tools miss it
Both inputs are programmatically labeled with non-empty visible text and the map carries a
valid `aria-label`, so axe/WAVE/Lighthouse pass everything. No tool can know that two
fields both labeled "Decimal degrees" are an ordered latitude/longitude pair, that the unit
is not the role, or that a coordinate-group description is missing — this requires domain
knowledge and visual reasoning a static scanner does not have.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "The intent of this success criterion is to have content authors present instructions
  > or labels that identify the controls in a form so that users know what input data is
  > expected."
- **Reference:** WCAG Technique F82 (Failure … by visually formatting a set of … fields but
  not including a text label), Description — `wcag-techniques/failures/F82.html`
  > "However, even if all the fields have programmatically determined names, a text label
  > must also identify the set of fields as a phone number."
