# case-02 — Banking login: labelled username (PASS) vs. bare password ghost box (FAIL)

## Scenario
A credit-union sign-in card stacks a username field above a password field. The username
field has a visible `<label>` "Username", a high-contrast (6.47:1) green person icon inset
on the left, AND a placeholder "Your member username." The password field is a bare white
box on the white card: its visible label was "tucked into the design" and is now
`.sr-only` (visually hidden), it has no icon and no placeholder. **Both inputs share the
same outline `1px solid #ABABAB` = 2.30:1 against white.**

- Username — **PASS**: label + icon + placeholder all identify the control; the 2.30:1
  border is not the only cue, so it is not subject to the requirement.
- Password — **FAIL**: a white box on white with no other visual signal; the 2.30:1 border
  is the only cue, so it is required to reach 3:1 — and does not.

## Attribute tuple
- **content-domain**: online banking / fintech
- **UI-component/pattern**: vertical login form, "floating/hidden label" pattern
- **host-language construct**: visually-hidden `<label class="sr-only">` + bare `<input type="password">`
- **locale/i18n**: en
- **failure-mechanism**: design-driven label removal leaves the boundary as sole cue

## Developer persona
A designer handed the engineer a Figma mock where the password field showed only a grey
outline ("clean, minimal"). The engineer kept the label for screen readers by hiding it
with the team's standard `.sr-only` utility, satisfied that "accessibility is handled"
because the field still has a programmatic name. The username field kept its visible
treatment because it carried the brand's member-icon. The asymmetry was never noticed.

## Element / selector carrying the issue
- FAIL: `input#pass.ghost-input` — `label[for="pass"]` is `.sr-only`; border `#ABABAB` (2.30:1) is the only visual cue.
- PASS boundary: `input#user.ghost-input` — same border, but visible label + 6.47:1 icon + placeholder identify it.

## Exact accessibility mechanism
For a low-vision sighted user, the password row is a blank region of the white card. The
only thing that could say "type your password here" visually is the 2.30:1 outline, which
at that contrast is liable to vanish — the user may not realise there is a second field
and may try to submit with only a username. The hidden `.sr-only` label means a
screen-reader user *does* hear "Password," so AT-by-audio is fine; the failure is purely
the perceptual/visual channel for low-vision users. The username row never depends on its
border because the literal word "Username," the placeholder, and the contrasting icon
each independently announce the control.

## Expected ACT-style outcome
**failed** (the password input's required boundary is below 3:1).

## Why automated tools miss it
The label IS present (just visually hidden), so `<label>`/name checks pass — a linter sees
nothing wrong. axe/Lighthouse do not test input border contrast, so the 2.30:1 outline is
never measured. A tool also cannot know that the username's border is *exempt* (because of
its visible label/icon) while the password's identical border is *required* (because it is
the only cue) — that distinction is a semantic reading of which fields have an alternative
visual identifier. Only a human comparing the two rows sees the flip.

## Citation
> **WCAG 2.2 Understanding 1.4.11 — Boundaries**
> "If a control has visible content (such as text or a sufficiently contrasting icon),
> which helps users identify the presence of the control, then a border or other indication
> of the overall boundary of the hit area is not required, as is therefore not subject to
> non-text contrast requirements. Having a visual boundary indicating the hit area is only
> required when there is no other visual way to identify the presence of the control – and
> in those cases, the boundary must have sufficient non-text contrast in order to pass this
> success criterion."

> **WCAG 2.2 Understanding 1.4.11 — User Interface Components (Intent)**
> "Unless the control is inactive, any visual information provided that is necessary for a
> user to identify that a control is present and how to operate it must have a minimum 3:1
> contrast ratio with the adjacent colors."
