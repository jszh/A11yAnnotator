# case-04 — Recipe page titled with the source filename "recipe-final-v2.html"

## Scenario
A complete recipe page — **Lemon & Thyme Roast Chicken** — with serving/time metadata, a
photo region, a checkbox-style ingredient list, and numbered method steps. The `<title>`
is the saved **source filename `recipe-final-v2.html`**: a versioned working-file name,
complete with the `.html` extension, that got dropped into the title.

## Element / selector carrying the issue
- `head > title` — text node `recipe-final-v2.html`.
- Contradicting evidence: `header h1` ("Lemon & Thyme Roast Chicken"), the `.ingredients`
  list, and the `.steps` ordered list.

## Exact accessibility mechanism
- A screen-reader user hears the page announced as **"recipe-final-v2.html"** — letters,
  a hyphen, a version token, and a file extension read out as a string. It tells the user
  the file is *a* recipe in the loosest sense, but it does not name *which* dish, and it
  reads as developer-internal cruft, not a human title.
- In a bookmark list of saved recipes, every "…-final-v2.html" page is indistinguishable.
  Limb 1 (present) passes; limb 2 (identifies topic/purpose) fails — the title does not
  identify *this* roast-chicken recipe.

## Expected ACT-style outcome
**failed** — ACT rule c4a8a4. F25 explicitly lists non-descriptive filenames as non-titles.

## Why automated tools miss it
`recipe-final-v2.html` is non-empty and valid. A linter cannot reliably classify a string
as "a filename, not a title": legitimate titles can contain dots, hyphens, and the word
"recipe", and some pages *are* legitimately about files. Deciding it fails requires
recognizing the version-suffix-plus-extension shape as a working filename AND noting the
body is a specific dish the filename never names — visual/semantic human judgment.

## Citation
> **Reference: WCAG Techniques — F25** (`wcag-techniques/failures/F25.html`)
>
> "Filenames that are not descriptive in their own right, such as report.html or
> spk12.html"

> **Reference: WCAG Techniques — G88** (`wcag-techniques/general/G88.html`)
>
> "The title of each web page should: Identify the subject of the web page[;] Make sense
> when read out of context, for example by a screen reader or in a site map or list of
> search results[;] Be short"
