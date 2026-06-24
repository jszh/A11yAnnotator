# case-04 — Gov tax form: essential filing instruction lives only in a `title` on a non-focusable "?" span (FAIL)

## Scenario
State Department of Taxation "Form ST-100" quarterly sales-tax return. Two fields carry
return-critical instructions only inside a `title` attribute on a decorative "?" span:
"Nontaxable / exempt sales" warns NOT to include collected sales tax there ("the most common
cause of a rejected return"), and "Jurisdiction code" states the code must be the **delivery**
county, not the business county ("the second most common filing error"). The "?" markers are
non-interactive `<span>`s (no `tabindex`), there is no `aria-describedby`, and a `title`
attribute does not reliably surface as a tooltip on keyboard focus. The instructions appear
nowhere else on the page (the footer only links to an external PDF).

## Attribute tuple
- **content-domain:** government / tax filing
- **UI-component/pattern:** form-field help marker carrying a `title` tooltip
- **host-language construct:** `<span class="help" title="…">?</span>` (no `tabindex`, no `aria-describedby`)
- **locale/i18n:** en-US
- **failure-mechanism:** essential instruction stored only in `title`; trigger not focusable; `title` not surfaced on keyboard focus within two seconds; not associated to the input programmatically

## Developer persona
A government contractor migrating a paper form to HTML wanted to mirror the printed form's
"see instructions" footnotes without adding visible clutter. They reached for the simplest
"tooltip" they knew — the `title` attribute — and dropped the line-by-line guidance into it on
a small "?" badge. They assumed `title` is "the accessible way" because screen readers can read
it, never realizing a `title` on a non-focusable span surfaces only on mouse hover. The inputs
all have real `<label>`s, so the agency's automated scan passed.

## Element / selector carrying the issue
`.help` spans inside the "Nontaxable / exempt sales" label (`#exempt`) and the "Jurisdiction
code" label (`#juris`) — `title` holds the essential instruction; the span has no `tabindex`
and the input has no `aria-describedby` linking it.

## Exact accessibility mechanism
A keyboard user Tabs through the inputs. The "?" spans have no `tabindex`, so focus never lands
on them — Tab goes label-to-input. Even a user who suspected help text could not summon it:
a `title` attribute is exposed visually as a tooltip on mouse hover, but browsers do not
reliably render the `title` tooltip on keyboard focus, so per Trusted Tester Test 4.A "if the
tooltip does not appear within two seconds, keyboard focus will not reveal the title
information." Because there is no `aria-describedby`, a screen-reader user editing `#exempt` or
`#juris` never hears the warning as part of the field description. The essential instruction is
thus inaccessible by keyboard and is not available elsewhere on the page. SC 2.1.1
essential-information branch fails. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (Level A), access-to-essential-information branch. Essential
instruction conveyed only via a `title` tooltip that pointer-hover reveals but keyboard focus
does not, with no programmatic association and no equivalent text elsewhere.

## Why automated tools miss it
Every input has a properly associated `<label>`; the `title` attributes are present and
non-empty; there are no missing/empty attributes and no contrast problem — so axe-core, WAVE
and Lighthouse report no error (a non-empty `title` is, if anything, treated as a positive).
A static checker cannot judge that the `title` text is ESSENTIAL (return-rejecting) rather than
a nicety, cannot reason that a `title` on a non-focusable span will not surface on keyboard
focus within two seconds, and cannot verify the instruction is absent elsewhere on the page.
This is precisely the Trusted Tester title/tooltip judgment that requires a human.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, Test 4.A *How to Test* and *Identify Content*
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "For interactive elements with `title` attributes, place keyboard
> focus; if the tooltip does not appear within two seconds, keyboard focus will not reveal the
> title information."
>
> **Quote (verbatim, Notes):** "Not all browsers visually display the `title` as a tooltip on
> keyboard focus."
>
> **Quote (verbatim, Identify Content):** "ANDI \"title attributes\" feature (focusable
> elements) helps identify essential info in `title` attributes."
