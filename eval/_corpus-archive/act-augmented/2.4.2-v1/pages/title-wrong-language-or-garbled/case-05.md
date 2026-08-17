# case-05 — Spanish recipe page, `<title>` in an unrelated third language (Polish)

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-wrong-language-or-garbled (Limb 2 — descriptiveness is language-dependent)
- **Expected ACT-style outcome:** **failed**

## Scenario
A Spanish recipe page ("Cocina de la Abuela", `<html lang="es">`) for *tortilla de
patatas*. The body — hero, metadata, ingredients, numbered steps, chef's tip, storage —
is substantive, idiomatic Spanish. The `<title>` is in **Polish**:
**"Przepis na tortillę ziemniaczaną — domowa kuchnia"** ("Recipe for potato tortilla —
home cooking"), a third language unrelated to the page's Spanish audience.

This is the most subtle case in the set: the Polish title **is genuinely descriptive of
the topic** — it really does name the dish. That is exactly the crux of the aspect:
**descriptiveness is language-dependent.** A title can name the right topic and still
fail because the audience cannot read the language it is written in.

## Element / selector carrying the issue
`head > title` — content `Przepis na tortillę ziemniaczaną — domowa kuchnia` (Polish).

## Exact accessibility mechanism
The screen reader announces a Polish string (and, if language auto-switching is off, may
mispronounce it under a Spanish voice); the tab, bookmark, and history entry all show
Polish text. The page's audience reads Spanish (`lang="es"`, Spanish body). A
Spanish-only reader cannot read Polish, so they cannot use this title to identify,
distinguish, or return to the page out of context — even though the title nominally
names the dish. G88 ties "descriptive" to *making sense when read out of context … in a
site map or list of search results*; "making sense" presupposes the reader can read the
language. The title is present and well-formed, so the failure is purely semantic /
linguistic: descriptive-but-not-in-the-audience's-language.

## Why automated tools cannot detect it
- The title is present, non-empty, and well-formed; missing-/empty-title rules PASS.
- A keyword/word-overlap heuristic ("does the title share words with the body?") would
  see *no* overlap between Polish title and Spanish body — but word non-overlap across
  languages is **not** a reliable failure signal: legitimate pages routinely carry
  correct foreign-language or transliterated titles. A language detector could report
  "title: Polish, body: Spanish", yet cannot decide whether that mismatch defeats
  identification *for this page's audience* (a Polish-language page for Polish readers
  with a Polish title is fine; this is a Spanish page). Resolving that requires reading
  both, inferring the audience, and judging usability — a human task.

## Citation

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages* (`wcag-techniques/general/G88.html`)
>
> Verbatim quote (title should):
> "Make sense when read out of context, for example by a screen reader or in a site map or list of search results"

> **Reference:** ACT Rule c4a8a4 — *HTML page title is descriptive* (`act-rules/extracted/c4a8a4.md`)
>
> Verbatim quote (Input Aspects required by the rule):
> "DOM Tree"
> "Language"
> *(The rule itself names "Language" as a required input aspect — descriptiveness cannot be judged without knowing the language of title and content.)*
