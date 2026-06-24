# case-02 — Patient-portal refill form: every input resting-blue, focus ring the same blue

## Scenario
A medication-refill form in a healthcare "MyChart"-style patient portal. Every
control (medication name, Rx number, quantity select, pickup date, phone,
notes textarea, and the two buttons) carries a permanent `2px solid #1a73e8`
border *and* a resting `outline:2px solid #1a73e8` so the form looks modern and
"filled in". The author's `:focus` rule produces the same 2px solid blue outline
— only the `outline-offset` nudges by 1px. Tabbing the form therefore produces a
tiny edge-pixel change but no perceptible difference: the field already looked
blue-bordered and stays blue-bordered.

## Attribute tuple
- **content-domain:** healthcare / patient portal / pharmacy
- **UI-component/pattern:** multi-field data-entry form (text/tel/date/select/textarea + buttons)
- **host-language construct:** native form controls with resting `border` + `outline` in the focus-ring colour
- **locale/i18n:** en-US
- **failure-mechanism:** F78 mode 2 — resting outline matches the focus ring in colour and weight, so :focus yields no perceptible change

## Developer persona
A product designer specced a "Material-flavored" form where inputs always show a
crisp blue active-state border, because the team felt empty grey boxes "looked
unfinished". A junior developer implemented it by putting the blue 2px border and
a matching blue outline on the resting state, then copy-pasted a `:focus` rule
that re-applies the same blue outline with a 1px offset tweak. Their lint passed
("focus style present, outline not none"), so it shipped without anyone tabbing
the form to check it was perceptible.

## Element / selector carrying the issue
`input[type=text|tel|date], select, textarea` — resting
`border:2px solid #1a73e8; outline:2px solid #1a73e8; outline-offset:-2px`. The
`input:focus, select:focus, textarea:focus` rule sets the identical
`outline:2px solid #1a73e8` and only changes `outline-offset` to `-1px`.

## Exact accessibility mechanism
A focused field's outline offset shifts by one pixel, so a pixel comparison
detects *some* change and the field is not literally `outline:none`. But the
control was already drawn with a 2px solid blue border and a 2px solid blue
outline of the same hue at rest; the focused appearance is the same blue at the
same weight. A keyboard user tabbing through the seven controls sees no
distinguishing state change and cannot tell which field is active — the focus
indicator is present but not perceptible. (Programmatic focus and labels are
correct, so AT speech is unaffected; the barrier is the missing *visible*
distinction for sighted keyboard and low-vision users.)

## Expected ACT-style outcome
**failed** (SC 2.4.7 Focus Visible). ACT oj04fd's single-element focused/unfocused
diff is non-zero (1px offset change), so oj04fd would *pass*; the perceptibility
failure is outside oj04fd's scope.

## Why automated tools miss it
No control uses `outline:none`, a `:focus` style exists, and a focused/unfocused
diff is non-zero — so axe-core, WAVE and Lighthouse register a focus indicator
and pass. They do not measure whether the focused appearance is perceptibly
different from the *resting* appearance of the same colour and weight; judging
that a blue ring over an already-blue border produces no human-perceptible change
requires visual comparison a tool does not perform.

## Citation
> **Reference:** WCAG Technique F78 — "Failure of Success Criterion 1.4.11, 2.4.7
> and 2.4.13 due to styling element outlines and borders…" (`wcag-techniques/failures/F78.html`)
>
> **Quote (verbatim):** "Other styling may make it difficult to see the focus
> indicator even though it is present, such as outlines that look the same as the
> focus outline, or thick borders that are the same color as the focus indicator
> so it cannot be seen against them."
>
> **Reference:** WCAG Understanding 2.4.7 Focus Visible — Examples (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "When text fields receive focus, a vertical bar is
> displayed in the field, indicating that the user can insert text, OR all of the
> text is highlighted, indicating that the user can type over the text."
