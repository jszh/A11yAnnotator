# case-06 — French booking button named by hidden English nodes (i18n contradiction) + a passing twin

## Scenario
A French bistro reservation panel (`<html lang="fr">`). The primary action visibly reads, in French,
**Réserver une table** — the words a francophone diner reads and would speak. But
`aria-labelledby="lbl-verb lbl-noun"` concatenates two visually-hidden English nodes ("Confirm" +
"booking") left untranslated by a multilingual theme. The computed name is the English "Confirm
booking": a different language from both the visible label and the page `lang`, with zero shared
words. A secondary button ("Annuler", `aria-label="Annuler la réservation"`) is included as a
**passing** contrast — its name CONTAINS the visible word.

## Attribute tuple
- **Content domain:** restaurant booking / hospitality
- **UI component / pattern:** reservation form with primary + secondary action buttons
- **Host-language construct:** `<button aria-labelledby>` concatenating hidden nodes (ARIA9-style)
- **Locale / i18n:** **fr** page; accessible name leaks English — translated-UI mismatch
- **Failure mechanism:** `aria-labelledby` to hidden untranslated nodes; divergence type = **CONTRADICTS + cross-language**
- **ARIA anti-pattern (facets.json):** "aria-labelledby points to an empty or wrong/hidden element"; **i18nContexts:** "translated UI where title/label not translated (mixed language)"

## Developer persona
An agency themed a multilingual restaurant template. The booking widget shipped with English
`aria-labelledby` references to hidden helper spans for "accessibility"; the translation pass covered
visible strings but missed the hidden helper nodes, so the French page exposes English accessible
names. The dev assumed translating visible text was sufficient.

## Element / selector carrying the issue
- **Failing:** `button.btn-primary` — `<button aria-labelledby="lbl-verb lbl-noun">Réserver une
  table</button>` with hidden `<span id="lbl-verb">Confirm</span>` + `<span id="lbl-noun">booking</span>`.
- **Passing twin:** `button.btn-ghost` — `<button aria-label="Annuler la réservation">Annuler</button>`.

## Exact accessibility mechanism
`aria-labelledby` overrides the button's own text, concatenating the referenced nodes' text. Verified
in Chromium: failing button `role=button`, `accName="Confirm booking"`; passing twin `role=button`,
`accName="Annuler la réservation"`. On a French page a screen reader abruptly announces English
"Confirm booking", contradicting the visible "Réserver une table"; a French voice-control user saying
« Réserver une table » activates nothing. The passing twin's name *contains* "Annuler", so voice
still matches — satisfying F111 check #3. Both names are non-empty, so ACT rule 97a4e1 PASSES for
both; only the visual+semantic label-in-name comparison distinguishes them.

## Expected ACT-style outcome
**failed** (the page's primary control fails: F111 check #1 true, #2 true, #3 false). The co-located
"Annuler" control passes (#3 true), demonstrating that a superset name is acceptable and isolating
the defect to omission/contradiction.

## Why automated tools miss it
Both buttons have non-empty names, valid `aria-labelledby` IDREFs resolving to present elements, and
valid roles — so 97a4e1 / axe / WAVE / Lighthouse pass both. No automated 4.1.2 checker reads the
visible French label off the rendered button, detects the language switch, and diffs it against
"Confirm booking". Judging that the name is in the wrong language and omits the visible label is a
human visual+linguistic decision.

## Citation
> "For each user interface control element where an aria-labelledby attribute is present: 1. Check
> that the value of the aria-labelledby attribute is the id of an element or a space separated list of
> ids on the web page. 2. Check that the text of the referenced element or elements accurately labels
> the user interface control."
— WCAG Techniques, **ARIA16** (`wcag-techniques/aria/ARIA16.html`), Tests › Procedure
> (check #1 passes here — the IDREFs are valid — but check #2 fails: "Confirm booking" does not
> accurately label the visibly-French "Réserver une table" control.)
