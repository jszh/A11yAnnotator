# Hunk to apply: numeric-homoglyph branch in the confusable mint's guard (`build-v3.js`)

`build-v3.js` is held by the lead; this is supplied to apply, not applied here. Everything else in the lane
is landed on `round3-llm-evidence-lane`:

| file | change |
|---|---|
| `scripts/v3/lib/confusable-text.js` | new NUMERIC-HOMOGLYPH lane — `NUMERIC_HOMOGLYPH` map (7 entries, UTS #39-sourced), per-word folds-entirely-to-digits gate, currency/unit/quantity context conjunct, >=2 digit-shaped floor (this lane only), new kind `homoglyph-numeric` |
| `scripts/v3/tests/runners/confusable-text.test.js` | 4 new tests (13 total) — RCA case-05 `$ЗОО`→`$300`, digit-mix/adjacency variants, FP guards, precomputeSignals pass-through |

**The adjudicator needs NO hunk.** `precomputeSignals`' confusable block (`llm-adjudicator.js` ~344–368)
reads `cf.kinds/count/asciiFold/samples/lang/langMatchesScript` generically; `homoglyph-numeric` flows through
it unchanged (test: "precomputeSignals surfaces homoglyph-numeric through the EXISTING confusable block").
Its `hasMix` softening check is `kinds.includes('homoglyph-mix')`, which a numeric hit correctly does not
trigger.

**The mint's guard is the one place the lane is still swallowed.** `foldReplacesALetter` accepts a positional
replacement only when the FOLDED char is an ASCII LETTER — the (correct) gate that keeps Japanese full-width
punctuation and full-width digits from minting. `$ЗОО` → `$300` replaces three source LETTERS with DIGITS, so
every replacement lands on `[0-9]`, the guard returns false, and text-lookalike-glyph-substitution/case-05
mints nothing: the detector fires but the barrier never reaches a judge (RCA s10, 1.1.1 row; Tier 2 #21).

## Ordering and safety

- **Inert until the detector lane exists; safe in either order.** Every pre-existing fold that lands on a
  digit has an Nd-category SOURCE (math-styled `𝟑`, full-width `１`), which the new branch's `\p{L}` source
  test rejects — so against the OLD detector this hunk is dead code, and against the NEW detector it admits
  exactly the `homoglyph-numeric` folds. Since the detector lane is already landed on this branch, applying
  the hunk switches case-05's mint on.
- The surrounding block comment stays true as written: "Full-width DIGITS are deliberately not enough on
  their own" (still excluded — `１` is Nd, not L), and "case-05's 'RX-O0OO' SKU … never reaches this loop"
  (all-ASCII, still unreachable). The inserted comment records the numeric nuance at the site.
- Aperture: the mint keeps its innermost-only walk, the 12-obligation page cap, and the detector-side
  conjunct (token folds ENTIRELY to digits AND currency/unit/digit context) — an ordinary Cyrillic page gains
  no obligations. Verified semantics (pure node): `$ЗОО`→`$300` mints; `１２３`→`123` does not; `（`→`(`
  does not; `Аpple`→`Apple` still mints.

## HUNK — `foldReplacesALetter` numeric branch

### Anchor (currently ~line 556, the tail of the LETTER-BEARING GATE comment plus the whole function)

```js
  // an exact positional comparison rather than a sample heuristic — and it is capped by asciiFold's own
  // 200-char slice, hence the min-length walk. Full-width DIGITS are deliberately not enough on their own:
  // they carry the Nd category and assistive technology reads them correctly.
  const foldReplacesALetter = (src, cf) => {
    const a = [...String(src || '')];
    const b = [...String((cf && cf.asciiFold) || '')];
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) if (a[i] !== b[i] && /^[A-Za-z]$/.test(b[i])) return true;
    return false;
  };
```

### Replace with

```js
  // an exact positional comparison rather than a sample heuristic — and it is capped by asciiFold's own
  // 200-char slice, hence the min-length walk. Full-width DIGITS are deliberately not enough on their own:
  // they carry the Nd category and assistive technology reads them correctly.
  //
  // NUMERIC BRANCH (RCA s10, text-lookalike-glyph-substitution/case-05 '$ЗОО'; Tier 2 #21). The detector's
  // homoglyph-numeric lane folds digit-lookalike LETTERS to digits ('$ЗОО' → '$300'), and the letter-only
  // test above swallowed exactly that shape: every replacement lands on [0-9], so no obligation was minted
  // and the barrier never reached a judge. A source LETTER folding to an ASCII DIGIT is a real substitution —
  // AT reads "ze", the eye reads 3 — so count it. The source must be a LETTER (\p{L}) for the digit case,
  // which keeps the full-width-digit exclusion above intact: '１' is Nd, not L, and still does not mint.
  const foldReplacesALetter = (src, cf) => {
    const a = [...String(src || '')];
    const b = [...String((cf && cf.asciiFold) || '')];
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] === b[i]) continue;
      if (/^[A-Za-z]$/.test(b[i])) return true;
      if (/^[0-9]$/.test(b[i]) && /\p{L}/u.test(a[i])) return true;
    }
    return false;
  };
```
