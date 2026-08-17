# case-03 — English news article, mojibake `<title>` ("CafÃ©")

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-wrong-language-or-garbled (Limb 2 — descriptiveness; machine-garbled/mojibake sub-dimension)
- **Expected ACT-style outcome:** **failed**

## Scenario
An English local-news article ("The Riverside Chronicle", `<html lang="en">`) about café
owners protesting permit fees. The body is clean, correctly-encoded English. The
`<title>`, however, is **mojibake**: the intended text "Café owners protest new permit
fees" was double-encoded — the UTF-8 bytes for "é" were re-interpreted as Latin-1 and
re-saved — so the title element's bytes are `C3 83 C2 A9` after "Caf", which a
UTF-8 browser decodes and displays as **"CafÃ©"**.

## Element / selector carrying the issue
`head > title` — content `CafÃ© owners protest new permit fees`.
The garbled run is genuinely in the DOM as the characters `C a f Ã ©` (verified at the
byte level: `c3 83 c2 a9`), so the browser tab and the accessibility tree carry the
corruption — it is not faked with a comment.

## Exact accessibility mechanism
A screen reader announces the document title character-by-word as written, so the user
hears something like "Caf A-tilde copyright owners protest…" (or, depending on the
verbosity setting, "Caf Ã ©…"). In the visual tab strip the user sees "CafÃ©". The
leading word — the most identifying token — is corrupted into a non-word. For a user
relying on the title to recognise this tab among others, to scan a history list, or to
read a search-result heading, the garble degrades or defeats identification: "CafÃ©" is
not a word the audience can match to "the café-fees story". The title is present and
technically composed of valid Unicode characters, so the failure is semantic: the
present title is machine-garbage, not a usable description.

## Why automated tools cannot detect it
- The title is present, non-empty, and made of valid Unicode code points ("Ã" U+00C3
  and "©" U+00A9 are legitimate characters). axe-core / WAVE / Lighthouse PASS a
  non-empty title and have no mojibake rule.
- The sequence "Ã©" is itself a valid character pair (it occurs in legitimate text and
  in some orthographies), so a heuristic that flagged it would produce false positives.
  Detecting that "CafÃ©" is corrupted "Café" — and that the corruption sits on the
  page's key identifying word and thus defeats out-of-context identification — requires
  a human who reads the title, recognises the encoding artifact, and compares it against
  the obviously-about-cafés body.

## Citation

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages* (`wcag-techniques/general/G88.html`)
>
> Verbatim quote (Description):
> "A descriptive title allows a user to easily identify what web page they are using and to tell when the web page has changed. The title can be used to identify the web page without requiring users to read or interpret page content."

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents* (`wcag-techniques/failures/F25.html`)
>
> Verbatim quote (Tests › Procedure):
> "Check whether the title of each web page identifies the contents
> or purpose of the web page ."
