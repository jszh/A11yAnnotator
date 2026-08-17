---
id: use-of-color-v0
sc: 1.4.1
skill: color-and-visual-text
visionEvidence: [element-crop, surrounding-region]
---

# 1.4.1 — use of color (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The collector extracted the element, its
role/state, and the surrounding context, and screenshotted it. Your job is to JUDGE whether information is
conveyed by COLOR ALONE — whether removing color (or for a color-blind viewer) would lose meaning a
sighted user gets. A deterministic checker cannot reliably tell "color is the ONLY cue" from "color plus a
shape/underline/text label also present", so it leaves these at auto-PARTIAL. Where a deterministic CLAIM
already disposed this obligation, DEFER. This rubric owns the color-ALONE question (F73/F81); it does NOT
judge whether two colors have enough contrast (1.4.11/1.4.3 own that).

**APPLICABILITY PRECONDITION — check this FIRST, before looking for a second cue.** 1.4.1 applies only when
COLOR IS THE MEANS by which some information is conveyed. If color is not carrying information here at all,
the SC does not apply and the answer is NOT REPRODUCED (or N/A) — *not* a barrier. Ask, in order:
  1. **What information is supposedly conveyed?** Name it concretely ("which sellers are verified", "which
     row failed"). If you cannot name a specific piece of information that color encodes, STOP: not applicable.
  2. **Is color actually DIFFERENTIATING anything?** If the element renders in the SAME color as its
     surroundings — an in-text link with the identical color as the prose, a "status" cell colored like every
     other cell — then color is conveying NOTHING, and a *zero* color difference is the strongest possible
     evidence that this is not a color-alone failure. It may be some other SC's problem (an undistinguished
     link is 1.4.1 only if hue is the sole distinguisher; with no distinguisher at all, the relevant failure
     is that the link is not identifiable, and if an underline or other affordance IS present the SC is
     satisfied). **Never reason "the colors are identical / the contrast ratio is 1:1, therefore this fails
     the ≥3:1 lightness escape, therefore barrier."** That inverts the SC: the escape clause only matters
     once you have established color IS the differentiator.
  3. Only if information IS being carried by color, proceed to the second-cue analysis below.

**Do NOT assert numeric contrast/luminance ratios you have not been given.** You cannot compute a ratio by
eye from a crop. If your reasoning needs a ratio, either use one that was handed to you in the signals, call
the contrast tool if it is available, or return PARTIAL. A fabricated number ("contrast ratio 1.62") is not
evidence and has produced false barriers here before. This is a RULE with exactly one escape: the number
must come from `compute_contrast_ratio` (or `resolve_part_color`) on the two colours you are comparing, or
from the signals. There is no third source.

**THE SUBJECT'S OWN RESOLVED COLOURS AND STATE — `signals.fieldColourState`.** For a form field whose form is
not colour-uniform you are handed that field's USED colours (text, background, per-side `border`, `outline`),
its label's colour, its state attributes, and the peers whose appearance DIFFERS from it. **These values are
AUTHORITATIVE over the crops for what colour this element is and what state it is in.** A `surrounding-region`
crop is a rectangle, so on a multi-column form it contains the EDGES OF NEIGHBOURING FIELDS — a coloured border
near this element's boundary may belong to the control beside it. If no side of `border` carries the coded
colour, this field does not have that border, whatever the crop appears to show. `sameAppearanceAs` lists the
peers that render exactly as this one does and `differentAppearanceFrom` the rest, each with its own
`errorStated` and its `nonColourCue`. A field matching the peers that carry no cue, and differing from the peers
stated to be in a state, is in the DEFAULT STATE — not a colour-alone failure but a field the coding does not
apply to, and demanding an error/required indicator on it inverts the criterion. `labelColourContrasts` is the
MEASURED luminance separation between this field's label colour and each other label colour in the set: it is
the number the key/legend test below asks for, so use it rather than estimating one. Where no such signal is
present you still may not assert a colour, border or state you cannot point to — return PARTIAL instead.

**A GRAYSCALE OR CVD RE-RENDER IS NOT EVIDENCE THAT A CUE SURVIVES.** `render_with_overrides(grayscale)`
maps each colour to its LUMINANCE, so two hues that differ in lightness — red vs green, the commonest shape
this criterion covers — come back as visibly different shades and the re-render appears to "confirm" a cue
that a colour-blind reader does not actually receive. It was measured worse than the colour crop for this
question and produced this rubric's only false clear. If you want the lightness separation, COMPUTE it
(`compute_contrast_ratio`, ≥3:1 per G183); a grayscale image is not a substitute, and "the elements are
still distinguishable in grayscale" is never on its own a reason to clear.

**A COLOUR PEER GROUP — `signals.colourPeerGroup`. WHEN THIS SIGNAL IS PRESENT, THE GROUP IS THE
QUESTION.** The subject element is merely the group's ANCHOR — the member the obligation attached to — and
a verdict that reasons only about the anchor's own text or colours answers the wrong question. Judge the
SET: across the members listed, is the colour difference the ONLY thing distinguishing a category, status
or state, with no per-member text, pattern, shape or icon cue carrying the same distinction? The members
are structural peers (same tag, same role, same parent), identical on every non-colour axis the collector
measured, and differ in used colour; each is listed with its label and colours. A listed member may itself
be colour-uniform — an uncoded member sitting inside a coded set, such as a neutral lead item beside
category-coded siblings — it is there for comparison, and "this member's information is already plain
text" clears that MEMBER, never the group. This is the shape element-level 1.4.1 cannot see, because no
individual member looks wrong — the information lives in the DIFFERENCE. Two questions, in order:
1. **Is the colour carrying information across the set?** A palette chosen for looks is not a 1.4.1
   failure. Ask what a reader would learn from the colours — a category, a status, a severity, a grouping.
   If each coded member's OWN label already names the category it belongs to, the colour is reinforcing
   text that is already there and there is no barrier.
2. **If it is, is that information also available without colour for EVERY coded member?** A per-item text
   label, an icon or pattern on each item, an accessible name, or a legend entry attached to each item all
   satisfy G14/G182. A separate key that maps colour→meaning by HUE NAME does NOT: the reader still has to
   perceive which colour each item is to use it. (A key that names its states by a non-hue property is the
   one exception — apply the key/legend test below, verification included.)
Only if colour carries information AND nothing else conveys it is this a barrier — and it stands even when
the anchor happens to be the plainest member of the group. Colour-uniform groups, zebra striping, syntax
highlighting, images and text-less swatches were already excluded before you saw it.

**COLOUR REFERENCED IN INSTRUCTIONS (`signals.*colorReferences`, F81 / Understanding 1.4.1).**

**THIS SIGNAL IS APPLICABILITY ONLY. IT IS A WORDING MATCH, NEVER A FINDING.** The detector matches
grammatical CONSTRUCTIONS in prose — a presentation verb followed by a colour word, a colour word attached to
a UI noun, an explicit "colour-coded" phrase. All a hit tells you is that THIS TEXT is in scope for a colour
judgment: go and look. It is **not** evidence that colour is the only cue, **not** corroboration for a
barrier you were already leaning toward, and it says **nothing whatsoever about any element other than the
one whose own text matched**. So:
- NEVER write that a barrier is confirmed by, supported by, or corroborated by a colour-reference hint. The
  hint cannot confirm anything; it only opened the question.
- NEVER carry a hit on one element's prose across to a verdict on a DIFFERENT element. A page-level sentence
  does not make each control's own state colour-only — every element is judged on its own pixels and signals.
- If the only thing supporting your barrier is that the lexicon fired, you have NO barrier: return NOT
  REPRODUCED, or PARTIAL if the pixels are genuinely ambiguous.

Once in scope, judge the instruction ITSELF, on its own words. Prose that tells the reader to identify
content by its colour is the Understanding's own example of this failure — it gives "required fields are
shown in red" — because a reader who cannot distinguish the colours named cannot follow the instruction. The
same applies to any instruction that picks out controls, rows, states or regions by colour and gives the
reader no other way to find them. It is a barrier UNLESS the instruction ALSO gives the reader a way to tell
its referents apart WITHOUT perceiving hue — an added marker or text ("...shown in red and marked with an
asterisk"), a position, an order, a shape, or a stated LIGHTNESS/shade difference between the coded states —
or the elements it refers to carry a distinguishing label the instruction could have used instead. See the
key/legend test below for how to decide whether that alternative actually works, and verify it before you
credit it.
*Guard:* a colour word used descriptively about a thing in the world — a product's colour, an ingredient,
a proper name that happens to contain a colour word — identifies nothing ON THE PAGE and is not in scope.
The test is whether a reader is being told to FIND something by its colour. If not, return N/A.

**WHEN A KEY OR LEGEND COUNTS (G14 / G182) — the test is whether a reader can APPLY it WITHOUT hue.** Pages
often explain their own colour coding in text. Such an explanation is neither automatically worthless nor
automatically sufficient. Ask exactly one question: could a reader who cannot distinguish the hues involved
USE this key to reach the same information a sighted reader gets?
- A key phrased ONLY in hue names — one hue means this, another hue means that — CANNOT be applied by that
  reader. They can see that two items differ; the key gives them no way to say WHICH is which. The
  information remains colour-only ⇒ **the barrier stands.** This is the ordinary case, and it covers the
  colour-only chart, map, calendar or status-table key however carefully it is worded.
- A key that STATES a distinguishing property of the coded items which SURVIVES colour-vision loss — that one
  state is lighter and the other darker, or that one carries a marker, icon, outline, shape or pattern the
  other lacks — CAN be applied: the reader uses the stated property, not the hue. Then the information is not
  conveyed by colour ALONE ⇒ **not a barrier for the states that key covers.** The key must SAY the property;
  a key that merely happens to list its entries in some order has not given the reader anything, because
  nothing tells them the coded items are ordered the same way.
- **This exception is for a SMALL, EXPLICITLY CONTRASTED set of states — in practice two.** "Lighter versus
  darker" is a distinction a reader can actually make; a ranking across four or six colour-coded categories
  is not, so a multi-category series does not escape this way even if some lightness spread exists.
- **VERIFY the property the key claims; do not take its word for it.** If it claims a lightness/shade
  difference, MEASURE it (`compute_contrast_ratio` between the two used colours; read ≥3:1 as sufficient
  separation, the threshold G183 uses). If it claims a marker, icon or shape, find it in the crop. A key
  asserting a non-hue difference the page does not actually have is not a remedy — the barrier stands, and
  you should say the key is inaccurate.
- Per-item remedies always suffice and need no key at all: a text label, an icon or pattern on each item, or
  an accessible name carrying the state (G14/G182).

**CATEGORY CODING WITHOUT A KEY (G14 / G182).** A chart, map, legend, calendar, or status table that encodes
a category ONLY by fill colour fails even when every colour is far apart in luminance: the reader can see
that two regions differ but cannot tell WHICH category each one is. G14 requires the distinction to be
available without colour, and G182 gives the standard remedy — an additional visual pattern (hatching,
texture, shape, direct labelling) or a text/symbol key attached to each series. So do not clear a
colour-coded series because "the colours are clearly different"; ask whether a reader who cannot use hue
can still map each region to its category — the key/legend test above is exactly that question.

**Judge:** is there a SECOND, non-color cue carrying the same information — or is color the only thing
distinguishing the states? Two classic failure modes:
- **Links not distinguished from body text except by color (F73):** in-text links that look identical to
  surrounding prose except for hue — no underline, no weight, no other affordance, and no lightness
  separation — so a color-blind reader cannot find them. Per F73's Procedure, ANY of these satisfies: an
  underline, distinct weight, italic, a shape/icon affordance, OR a sufficient lightness difference between
  link and surrounding text (read as ≥3:1 luminance separation, not merely a different hue at similar
  lightness) — a lightness difference survives color-vision loss, so WCAG counts it as a non-"color-alone"
  cue. The residual F73 barrier is the equal-luminance hue-only link: a hue swap at similar lightness
  (<3:1 luminance separation from the prose) with no other affordance.
- **Status / required / error / selected shown only by color (F81):** a required field marked only by a red
  label, an invalid field flagged only by turning red, a "success/error" state distinguished only by
  green/red, a selected item shown only by a color swap — with no asterisk, icon, text, border, or other
  non-color indicator. (The same state ALSO carrying text/an icon/a shape is NOT a barrier.)

**Evidence handed to you:** the `element-crop` and the `surrounding-region` (so you can compare the
color-cued element against its peers and see whether a second cue is present), the role/state, and any
associated text. Judge from these pixels only.

**Interpreting the deterministic evidence (and why it is uncertain):** this obligation reached you BECAUSE the
deterministic lane could not decide it — so hunt for the second cue. Note that `contrast.uncertainReason` is a
GENERIC abstention notice: it reports that no ratio was computed, and it describes NEITHER this element's
backdrop nor its colours. Never read it as a finding that a colour difference was observed here, and never
treat its wording about gradients/overlays as a fact about this element. CRITICAL invariant: ABSENCE OF A
DETERMINISTIC FINDING IS NOT A PASS.
The checker did not certify "a second cue exists" — it punted precisely because it could not tell. So never
infer "no finding ⇒ a non-color cue must be there"; look, and if no non-color cue is visible where one is
needed, that is the barrier. If the crop is ambiguous about whether a faint underline/border exists,
abstain rather than clear.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- The requirement is a non-color cue, not the ABSENCE of color — color PLUS another cue is fine; do not
  flag color used redundantly.
- A cue need not be obtrusive: a visible underline, a shape difference, an icon, an asterisk, or adjacent
  text all satisfy it. Do not insist on any particular form.
- Hover/focus-only differentiation does not count for the default state (the reader must distinguish it at
  rest) — but if you are not handed the rendered states to judge this, return PARTIAL.
- Do not judge ABSOLUTE contrast adequacy here — whether text/UI clears its threshold against the page
  background is 1.4.11/1.4.3's job, and a redundant cue with weak contrast is a 1.4.11/1.4.3 question, not
  a 1.4.1 one. CARVE-OUT (F73): you MAY credit a visible link-vs-surrounding-text LIGHTNESS difference
  (≥3:1 luminance separation between the link color and the prose color) as the required non-color cue —
  that is the RELATIVE comparison F73's Procedure itself sanctions, not a contrast-adequacy judgment. When
  the handed axe `link-in-text-block` signal reports PASS, DEFER to it — axe measured exactly this
  link-vs-surrounding-text separation.
- CRITICAL GUARD — the ≥3:1 escape is F73-ONLY; do NOT extend it to F81 states whose meaning relies on
  perceiving a SPECIFIC color (green=valid / red=invalid, red=required, color-keyed legend states): there
  the user must recognize WHICH color, not merely that the element stands apart, so an additional non-color
  indicator (icon, text, asterisk, shape, border) is required REGARDLESS of contrast ratio. The ONE situation
  in which a lightness separation does resolve an F81 state is the key case above — where the page's own text
  identifies its states by LIGHTNESS rather than by hue, so the reader never has to recognise WHICH colour,
  AND you have measured that the stated separation is really there. A key that names its states by hue does
  not qualify, however far apart those two colours happen to sit in luminance: knowing the two differ still
  does not tell the reader which one the key was talking about.
- When the crop cannot settle whether a second cue is present, return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier —
information conveyed by color alone), NOT REPRODUCED (no barrier — a non-color cue also carries it),
PARTIAL (cannot decide from the handed crops), N/A (abstain — NOT "out of scope", that is the oracle's
job)}.
