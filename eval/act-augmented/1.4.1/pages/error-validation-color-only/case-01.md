# case-01 — Login form: failed password field marked by red border only (same-lightness gray on valid fields)

## Scenario
A corporate timesheet sign-in page rendered in its **post-submit error state**. The sign-in attempt failed, so a generic banner ("We couldn't sign you in.") appears at the top. The email field is accepted and keeps a 2px **gray** border; the password field — the one the user must correct — is given a 2px **red** border. There is no inline error text under the password field, no error icon, no "(error)" marker, and (deliberately) no `aria-invalid`. The only per-field signal that the **password** specifically is wrong is its hue.

## Attribute tuple
- **content-domain:** internal enterprise tool / timesheet SaaS
- **UI-component / pattern:** standard email+password login form, post-submit validation state
- **host-language construct:** two `<input>`s with associated `<label>`s; per-field state via CSS `border-color` only (`.is-valid` gray / `.is-invalid` red)
- **locale / i18n:** en-US
- **failure-mechanism:** F81 — error field identified using a color difference only; the red/gray pair tuned to near-equal lightness so the 3:1-lightness escape hatch does not apply

## Developer persona
A junior full-stack developer wired the login controller to return a generic "sign-in failed" flag (for credential-stuffing safety they intentionally don't say *which* field is wrong in text). For the visual, they grabbed the design-system tokens `--danger` (red) and `--border` (gray) and toggled `border-color` on the field that the validator flagged. They confirmed it "looked obviously wrong" on their own monitor and shipped it, never checking the grayscale view or that a sighted color-blind user gets no field-level cue.

## Element / selector carrying the issue
`#password.is-invalid` — the password input whose only distinguishing cue from the valid `#email.is-valid` is `border-color:#d92020` (red) vs `#8a8f94` (gray).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Sighted, full-color user:** sees a red-bordered password box and infers "fix the password." Works.
- **Sighted user with color vision deficiency / low vision / grayscale display:** the red border (#d92020 ≈ L\*48 on white) and the gray border (#8a8f94 ≈ L\*60 on white) are close in lightness; with hue removed the two borders look essentially the same, so this user cannot tell which field failed. The generic banner does not name the field. They are stuck — the page conveys the *which-field* information by hue alone.
- **Screen-reader user:** unaffected by this particular failure for the wrong reason — there is simply nothing per-field to announce (no `aria-invalid`, no message). That is a separate 3.3.1/4.1.2 gap; 1.4.1 is specifically about the **visible** alternative for the sighted color-blind user, who is the person harmed here.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — F81: an error field is identified using a color difference only, with no non-color visible cue and lightness difference below the 3:1 escape-hatch threshold).

## Why automated tools miss it
Both inputs have associated labels, non-empty in the DOM; the page has a `role="alert"` banner; all text meets contrast against the page. axe/WAVE/Lighthouse therefore report no violations. No automated rule classifies a 2px red border as an *error indicator* (it could be a brand accent) versus the gray border as *neutral*, and none computes whether the red↔gray lightness delta clears 3:1 to decide if the escape hatch rescues it. Recognizing that "red = this field is wrong" is conveyed by hue alone, with no text/icon/marker backing it, requires a human to reach the error state, read the page as a color-blind user would (or toggle grayscale), and apply F81.

## Citation
> "A user submits an online form and leaves a required field blank, resulting in an error. The form field that caused the error is indicated by red text only, without an additional non-color indication that the field caused an error."
— wcag-techniques/failures/F81.html (Examples)

> "An error indicator cannot use color alone as an indicator."
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Notes)

> "If content is conveyed through the use of colors that differ not only in their hue, but that also have a significant difference in lightness, then this counts as an additional visual distinction, as long as the difference in relative luminance between the colors leads to a contrast ratio of 3:1 or greater."
— wcag-understanding/use-of-color.html (Intent, note) — here the red/gray lightness delta is below 3:1, so the escape hatch does not apply.
