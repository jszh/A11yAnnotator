# case-04 — Print button whose alt names the printer device, not the print action

## Scenario
A boarding-pass screen in an airline web app (SkyArc Airways) has an action bar with three
icon buttons. The print button shows a printer glyph, and its image `alt` is `"inkjet
printer"` — an oddly specific but literally accurate description of the depicted device. The
button's purpose is to print the boarding pass (it calls `window.print()`), but its
accessible name describes the appliance in the picture. The other two buttons are correctly
purpose-named (`"Add to Apple Wallet"`, `"Email boarding pass"`), so a screen-reader user
hears two real actions and one appliance.

## Attribute tuple
- **Content domain:** travel / airline mobile check-in
- **UI component / pattern:** icon action-button bar (image-as-control)
- **Host-language construct:** `<button onclick="window.print()">` with child `<img>` + an `aria-hidden="true"` visible caption
- **Locale / i18n:** en
- **Failure mechanism:** alt names the depicted device ("inkjet printer") instead of the control's action ("Print boarding pass")

## Developer persona
A mobile-app developer pulled the printer icon from a stock icon pack whose asset metadata
labelled it "inkjet printer". An automated alt-population step copied the icon's library
description into the `alt`. The visible "Print" caption underneath is decorative
(`aria-hidden="true"`) so it never reaches the accessible name — the team assumed the caption
"covered" labelling and never noticed the button announces the appliance instead of the
action.

## Element / selector carrying the issue
`.actionbar button[onclick] > img[alt="inkjet printer"]` — the button's accessible name is
computed from this image's alt (the sibling caption is `aria-hidden`), so the print control
announces as "inkjet printer".

## Exact accessibility mechanism
The button's only name-contributing content is the child image, so AccName(button) = "inkjet
printer". The visible "Print" text is `aria-hidden="true"` and contributes nothing. A
screen-reader user reaches "inkjet printer, button" with no indication that it prints the
boarding pass; a voice-control user saying "click print" finds no matching name. The glyph
genuinely depicts a desktop printer, so the alt is *accurate about the depiction and wrong
for the function*. The Wallet and Email buttons demonstrate purpose-named controls in the
same bar.

## Expected ACT-style outcome
**failed** (SC 1.1.1, control-purpose limb). The non-text content is a control; its name must
describe its purpose ("Print boarding pass" / "Print"), but "inkjet printer" describes the
image, so the alternative does not serve the equivalent purpose. Button-name presence checks
pass.

## Why automated tools miss it
axe-core/WAVE/Lighthouse pass any button with a non-empty accessible name; "inkjet printer"
is a valid non-empty name. They do not execute or interpret the `onclick="window.print()"`
handler, and they cannot judge that "inkjet printer" describes the device rather than naming
the print action. Detecting that the name should be the control's purpose requires
understanding what activating the button does — a human semantic judgment.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "For non-text content that is a control or accepts user input, such as images used as submit buttons, image maps or complex animations, a name is provided to describe the purpose of the non-text content so that the person at least knows what the non-text content is and why it is there."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "This text alternative should not necessarily describe the non-text content.  It should serve the same purpose and convey the same information."
