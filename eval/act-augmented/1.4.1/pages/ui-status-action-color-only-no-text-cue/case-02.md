# case-02 — "Opens in a new window" indicated by link colour alone (county clerk portal)

## Scenario
A county Clerk-Recorder resource page lists document links. Links that open in a **new
browser tab** are coloured teal; same-window links use the default blue. The "opens in a
new window" action is conveyed purely by link colour. There is no "(opens in new window)"
text, no external-link icon, and no per-link cue — only a prose footnote ("Links shown in
teal open in a new browser tab"). Both colours pass 1.4.3 contrast against white.

## Attribute tuple
- **content-domain:** government / civic services portal (county records office)
- **UI-component/pattern:** in-content link list (`<ul>` of `<a>`)
- **host-language construct:** `<a target="_blank" rel="noopener">` styled by a `class` colour swap
- **locale/i18n:** en-US
- **failure-mechanism:** an *action* indication ("link opens in a new window") encoded by link colour only — the Understanding's own example of a colour-encoded action

## Developer persona
A CMS author maintaining the office's resource pages added external services (VitalChek,
the GIS map, the e-recording portal) and set them to open in new tabs. To "warn" users she
applied a teal "external link" CSS class she found in the theme and wrote one explanatory
sentence at the top. She never added the per-link "(opens in new window)" text the theme's
docs recommend, assuming the colour plus the note was enough.

## Element / selector carrying the issue
`a.newwin` (e.g. the VitalChek, parcel-map, e-recording, and payments links). They differ
from `a.local` only by `color:#1c8a86` vs `#14467a`; identical underline, weight, and size.

## Exact accessibility mechanism
A user who cannot distinguish teal from blue (colour deficiency, grayscale, monochrome
display) cannot tell which links will navigate away in the current tab versus spawn a new
one — an action that matters for orientation and for users who rely on the Back button. The
prose footnote is itself colour-keyed ("teal"), so it does not rescue the user. In the
verified grayscale render every link is the same dark gray; the new-window action is
entirely lost. (This sits beside F73: links are distinguished from text by underline, so
*link-ness* passes, but the *which-ones-open-new-windows* distinction is colour-only.)

## Expected ACT-style outcome
**failed** — colour is the only visual means of indicating the new-window action; no
non-colour text/icon cue accompanies the affected links.

## Why automated tools miss it
Every `<a>` has descriptive link text and a valid href; teal and blue both clear 4.5:1, so
link-name and contrast checks pass. No automated tool compares two *link* colours, infers
that "teal specifically encodes opens-in-new-window," and confirms that no non-colour cue
carries the same action. That requires reading the convention and reasoning about meaning.

## Citation
> **WCAG 2.2 Understanding 1.4.1 (use-of-color.html, Intent):** "Examples of indications of
> an action include: using color to indicate that a link will open in a new window or that
> a database entry has been updated successfully."

The page realises exactly the first of these named action-indication examples: the
new-window action is carried by link colour alone, with no redundant visible cue.
