# case-03 — Loan-approval decision flowchart: prose lists every box but omits the branches/arrows

## Scenario
A credit union explains its automated loan-decision process with an inline-SVG flowchart. The
diagram has two decision diamonds (credit score ≥ 660? and DTI ≤ 40%?), three outcome boxes
(Decline / Manual underwriting / Auto-approve), arrows with Yes/No labels connecting them, and a
start box. The `figcaption` long description enumerates all the boxes but states none of the
connections or branch conditions — so the reader learns *what the stages are* but not *what
leads to what*.

## Attribute tuple
- **content-domain:** online banking / fintech (consumer lending)
- **UI-component / pattern:** inline `<svg role="img">` decision flowchart with arrowhead markers
- **host-language construct:** SVG with `aria-labelledby` (title) + visible `figcaption`
- **locale / i18n:** en
- **failure-mechanism:** long description lists nodes but drops the directed edges / decision logic the flowchart exists to convey (F67)

## Developer persona
An in-house dev exported the flowchart from a diagramming tool to SVG, then wrote a caption by
reading off the shapes left-to-right ("the process has these stages: ..."). They treated the
boxes as the content and the arrows as decoration, not realising the arrows *are* the content of
a flowchart. The build's a11y lint passed, so it shipped.

## Element / selector carrying the issue
`svg[role="img"]` (name via `#flowName`) paired with `figure > figcaption`. The caption lists
nodes; the directed edges and Yes/No conditions are absent.

## Exact accessibility mechanism
A screen-reader user hears "Flowchart of the Meridian personal-loan decision process" then a
flat list: Application received, Credit score check, DTI check, Auto-approve, Manual
underwriting, Decline. The sighted user follows the arrows and reads the logic: score < 660 →
Decline; score ≥ 660 but DTI > 40% → Manual underwriting; score ≥ 660 and DTI ≤ 40% →
Auto-approve. The non-sighted user cannot reconstruct any path and cannot answer the only
question the page exists to answer — "what will happen to my application, and why?" The text
alternative omits the relationships, so it does not present the same information.

## Expected ACT-style outcome
**failed** — F67 (the long description does not present the same information: it lists boxes,
omits the branch logic). Name + description presence PASS.

## Why automated tools miss it
The SVG has a non-empty accessible name and a descriptive caption; axe/WAVE/Lighthouse confirm
both and stop. They cannot trace `<path marker-end="url(#arrow)">` edges, associate them with the
Yes/No `<text>` labels, or determine that the caption fails to state any of those connections.
Understanding that a flowchart's meaning is in its edges — and that the prose dropped them — is a
semantic judgement over the rendered diagram.

## Citation
> **Reference:** WCAG Techniques — F67 (`wcag-techniques/failures/F67.html`)
>
> "The objective of this technique is to describe the failure that occurs when the long
> description for non-text content does not serve the same purpose or does not present the same
> information as the non-text content. This can cause problems for people who cannot interpret
> the non-text content because they rely on the long description to provide the necessary
> information conveyed by the non-text content. Without a long description that provides complete
> information, a person may not be able to comprehend or interact with the web page."
