# case-06 — Faint diagonal "VOID" stamp is the only cancellation signal on an invoice line (meaningful → failed)

## Scenario
An invoice has a cancelled line item ($1,800 on-site implementation). The ONLY signal that
this charge no longer applies is a faint, rotated "VOID" stamp across the row, `#cdb3b3` ≈
1.96:1. The row text is full-contrast and NOT struck through, and the $1,800 amount is still
printed (and is already excluded from the $3,360 total). The stamp carries critical financial
status; the author treated it as a stylistic overlay.

## Attribute tuple
- **content-domain:** fintech / billing / invoicing
- **UI-component/pattern:** data table line item with an absolutely-positioned diagonal "stamp" overlay
- **host-language construct:** hand-authored HTML5 `<table>` with a `position:relative` cell and an overflowing `<span>` stamp
- **locale/i18n:** en-US, USD
- **failure-mechanism:** status-bearing overlay word styled as a faded decorative stamp at 1.96:1; visually indistinguishable from a purely ornamental "stamp" graphic

## Developer persona
A billing-platform engineer added a "VOID stamp" CSS effect copied from a Dribbble
"invoice UI" shot, where the stamp was a decorative flourish. He set it to a soft, faded
red-gray "so it looks like a real rubber stamp" and never struck through or greyed the
underlying row, assuming the stamp alone made the cancellation obvious. In the live product
the stamp is the only cancellation cue, so its faintness hides load-bearing status.

## Element / selector carrying the issue
`.void-stamp` — the `<span>VOID</span>` overlay inside the line-item cell,
`color:#cdb3b3` with a `#cdb3b3` border, rotated `-12deg` over the white row.

## Exact accessibility mechanism
"VOID" is the sole indication that the $1,800 line is cancelled; without perceiving it a
reader sees a live-looking, full-contrast charge whose printed amount even appears to
contradict the total. The word conveys non-substitutable status (you cannot swap it for
"PAID" or remove it without changing the invoice's meaning), so it is in scope for SC 1.4.3,
not decoration. At 1.96:1 a low-vision or contrast-impaired user cannot read it and is
misled about what they owe. Result: 1.4.3 failure. (The stamp is live DOM text with
`aria-hidden="false"`, so an AT user does hear "VOID", but the visual-contrast user does
not.)

## Why automated tools miss it
A contrast checker computes 1.96:1 but cannot decide the exemption. The faint rotated word
is visually and structurally identical to a purely decorative "stamp" graphic that designers
add for flavor, and many scanners ignore absolutely-positioned rotated overlays as
decorative chrome. Ruling the stamp in-scope requires reading "VOID", recognizing it as the
only cancellation signal, and reconciling it against the still-printed $1,800 line and the
$3,360 total — multi-step semantic reasoning no automated tool performs.

## Citation
> **WCAG 2.2 Understanding — Contrast (Minimum)** (`wcag-understanding/contrast-minimum.html`):
> "Text that is decorative and conveys no information is excluded. For example, if random
> words are used to create a background and the words could be rearranged or substituted
> without changing meaning, then it would be decorative and would not need to meet this
> criterion."
