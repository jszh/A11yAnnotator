# DHS Trusted Tester test cases (machine-readable)

`testcases.json` — 54 test case entries derived from the DHS Trusted Tester v5.1.3
certification practice-exam corpus (`refs/DHS-Trusted-Tester-examples/`), scoped to this
project's in-scope WCAG SCs (`categories.json`) and to only the exam questions where the
verified-correct answer choice is known (`markerType == "correct"` in the sidecar JSON —
see `refs/DHS-Trusted-Tester-examples/*/*.json` and `_captured-pages/INDEX.json`).

The schema mirrors the repo-root `testcases.json` (the W3C ACT Task Force test-suite
manifest: `ruleId`/`expected`/`testcaseId`/...), so it can be consumed the same way, plus a
`trustedTester` block preserving the original multiple-choice question, and a `target`
naming the specific DOM element(s) responsible for the verdict.

## Provenance

For each of the 54 records, an agent read the actual captured page under
`_captured-pages/<id>/` (HTML captured live via `scripts/tools/dhs-capture-pages.js`, not
reconstructed) and:
1. identified the CSS selector(s) for the element(s) the correct answer's verdict is
   actually about, grounded in the real markup (not invented);
2. wrote a 1-3 sentence `mechanism` tying that element to the verdict;
3. optionally cross-referenced a W3C ACT rule ID from `act-rules/act-rules-manifest.json`
   when its concept genuinely matched — most SCs in this corpus (e.g. 1.1.1 CAPTCHA,
   1.4.5, 2.1.1 keystroke timing, 3.3.x) have no corresponding rule in that 40-rule
   manual/semi-auto subset, so `ruleId`/`ruleName` are `null` for most entries.

Verified: all 54 source PDFs are represented exactly once, and the `expected` field
(passed/failed/inapplicable) matches each record's correct choice's verdict
(Pass/Fail/Does Not Apply) exactly, cross-checked programmatically against
`_captured-pages/INDEX.json`. A sample of the underlying selector claims (missing
`<table>` element, broken `<span for=...>` label association, format hints embedded in
`<label>` text) was independently spot-checked by grepping the real captured HTML.

## Schema

```jsonc
{
  "testcaseId": "dhs-<sc_folder>-<testId>",     // stable per (SC folder, Trusted Tester test id)
  "testcaseTitle": "<testName>",
  "wcagSuccessCriterion": "1.1.1",
  "expected": "passed" | "failed" | "inapplicable",
  "ruleId": "23a2a8" | null,                    // cross-ref into act-rules/act-rules-manifest.json, only when confident
  "ruleName": "..." | null,
  "target": {
    "selector": "img.hero[alt='...']" | ["sel1", "sel2"] | null,  // null when the verdict is "nothing of this kind exists on the page"
    "description": "..."
  },
  "mechanism": "...",                            // why this element -> this verdict, grounded in the real markup
  "trustedTester": {
    "sourcePdf": "1.1.1-captcha-alternative/Example1.pdf",
    "testId": "7.D",
    "testCondition": "...",
    "question": "...",
    "choices": [ { "letter": "a", "verdict": "Fail", "text": "...", "marker": "none" }, ... ],
    "correctLetter": "d"
  },
  "subject": {
    "examPageUrl": "https://training.section508testing.net/...",
    "capturedPage": "_captured-pages/444383-12/index.html"   // relative to refs/DHS-Trusted-Tester-examples/
  }
}
```

`subject.capturedPage` is relative to `refs/DHS-Trusted-Tester-examples/`, which is
gitignored (third-party reference material, per the existing `refs/*` convention) — this
manifest is tracked, but the underlying captured pages/PDFs are local-only. Regenerate them
with `scripts/tools/dhs-capture-pages.js` if needed.

## Not included

The 26 exam questions where the marked answer is known-*incorrect* (red-X in the source
PDF, per `markerType == "incorrect"` in the sidecars) are excluded — the true correct
answer for those was never resolved, so there's no verified element/verdict to test
against.
