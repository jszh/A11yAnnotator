# case-02 — Recipe card matched pair: Save (Enter works) vs Print (onkeypress dropped)

## Scenario
A recipe blog ("The Weeknight Cucina") renders a recipe card with two action controls side by
side, built from identical-looking `<span role="link" tabindex="0">` elements:
- **Save to recipe box** has `onclick` **and** `onkeypress="if (event.key === 'Enter') saveRecipe();"`
  — it is reachable and activatable by keyboard (Enter), so it **passes**.
- **Print this recipe** is byte-for-byte the same in the source **except** the `onkeypress`
  was deleted during a "tidy up the markup" commit. Mouse click still works; **keyboard
  activation is dead** (no Enter, no Space).

The two controls are visually and structurally indistinguishable. The page's verdict therefore
hinges on **actually pressing Enter and Space on each control**, not on inspecting attributes.

## Attribute tuple + developer persona
- **content-domain:** food / recipe blogging
- **UI-component/pattern:** recipe-card action row; two pseudo-link controls (`role="link"`)
- **host-language construct:** `<span role="link" tabindex="0" onclick=... [onkeypress=...]>`
- **locale/i18n:** en
- **failure-mechanism:** matched pair — one operable, one with the key handler silently removed
- **persona:** A solo food blogger who hand-codes her theme. She originally wired both pseudo-links
  with a keypress handler after reading an a11y tip. Months later, running a linter that complained
  about an "unused event parameter" on Print, she "cleaned up" by deleting the whole `onkeypress`
  attribute on that one control — not realising it was the only keyboard path. Save was untouched.

## Element / selector carrying the issue
- PASS control: `.pseudo-link:nth-of-type(1)` — *Save to recipe box* (has `onkeypress`, Enter works).
- FAIL control: `.pseudo-link:nth-of-type(2)` — *Print this recipe* (no key handler; Enter/Space dead).

The **page** fails 2.1.1 because at least one in-scope function (Print) is not keyboard operable.

## Exact accessibility mechanism (what AT experiences and why it fails)
- A screen-reader user tabs through the card and reaches two controls, both announced as
  **"link"** (via `role="link"`), both apparently identical.
- On **Save to recipe box** the user presses **Enter** → `saveRecipe()` runs, "Saved to your
  recipe box ✓" is announced via the `role="status"` live region. Correct. (Note: per the WCAG
  Understanding note, responding to Enter but not Space is acceptable for a custom control.)
- On **Print this recipe** the user presses **Enter**, then **Space** → nothing happens, no
  announcement. The print function is keyboard-reachable but not operable, and there is no other
  keyboard route to printing on the page.

Verified behaviourally (headless Chromium): Save → Enter activates; Print → neither Enter nor
Space activates; both activate by mouse.

## Expected ACT-style outcome
**failed** (the page contains an in-scope function — Print — that is not keyboard operable).

## Why automated tools miss it
Both controls present a valid `role`, a `tabindex="0"`, and an `onclick`; one of them also has
an `onkeypress`. A scanner that checks "is it focusable / does it have a role / does it have an
accessible name" passes **both** identically. Distinguishing the operable control from the dead
one requires focusing each and pressing Enter **and** Space and observing the live-region
output — a runtime, interaction-time behaviour. Worse, the matched-pair design means a tool
cannot even use "one of these is suspicious" reasoning: they are siblings with the same class,
role, and shape. Only behavioural verification separates them.

## Citation
> **WCAG Failure Technique F42 — Failure of Success Criteria 1.3.1, 2.1.1, 2.1.3, or 4.1.2 when emulating links** (`wcag-techniques/failures/F42.html`)
>
> "For all elements presented as links which use JavaScript event handlers to make the element emulate a link: … Check if the emulated link can be activated using the keyboard."

> **WCAG Failure Technique F42 — Expected Results** (`wcag-techniques/failures/F42.html`)
>
> "If check #2 is false then this failure condition applies and the content fails Success Criteria 2.1.1 Keyboard and 2.1.3 Keyboard (No Exception)."

The Print pseudo-link cannot be activated using the keyboard, so F42 check #2 is false → 2.1.1 fails.
