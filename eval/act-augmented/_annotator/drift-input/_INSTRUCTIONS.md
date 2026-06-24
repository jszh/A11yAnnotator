# Drift audit — does each page still match its written description?

You are auditing one WCAG Success Criterion (SC) of the act-augmented corpus. For every test
page in that SC, decide whether the **actual HTML** still demonstrates the failure described by
its `mechanism` + `scenario`, consistent with the aspect and `expected` value.

## Inputs
- `eval/act-augmented/_annotator/drift-input/<SC>.json` — array of:
  `{ aspect, aspectTitle, aspectDescription, caseId, file, expected, scenario, mechanism, primarySelector }`
- For each entry, **READ the page HTML** at `file` (repo-root-relative, e.g.
  `eval/act-augmented/<SC>/pages/<aspect>/<caseId>.html`).

## How to judge each page
`expected: "failed"` → the page should CONTAIN the described accessibility defect.
`expected: "passed"` → a calibration control that should be CLEAN (no defect).

Classify into exactly one `status`:
- **aligned** — the HTML genuinely implements the described mechanism/scenario for this aspect
  (minor wording differences are fine; the defect/control is really there as described).
- **stale-desc** — the HTML DOES demonstrate this aspect's failure/control, BUT the
  `mechanism`/`scenario` text is inaccurate about specifics: it names the wrong element /
  selector / class / id, cites a wrong example value or wording, or describes a different
  concrete instance than what is actually on the page. The page is fine; only the prose drifted.
- **not-aligned** — the HTML does NOT demonstrate the described aspect: it is a different
  page/topic, the defect is absent, or it now shows a different kind of issue. (Do NOT fix these.)

Judge from the real DOM (read the markup: classes, ids, text, ARIA, inline styles, scripts).

## Outputs — write TWO files for your SC
1. `eval/act-augmented/_annotator/drift-report/<SC>.json` — include EVERY page:
   ```json
   { "<aspect>/<caseId>": { "status": "aligned|stale-desc|not-aligned", "reason": "<=25 words, concrete HTML evidence" } }
   ```
2. `eval/act-augmented/_annotator/description-overrides/<SC>.json` — ONLY `stale-desc` cases:
   ```json
   { "<aspect>/<caseId>": { "mechanism": "<corrected, 1-3 sentences matching the real HTML>", "scenario": "<corrected one-liner>", "note": "<what was wrong>" } }
   ```
   Write `{}` if there are no stale-desc cases. Do NOT add entries for aligned or not-aligned.

Both files pretty-printed (2-space). Key strings are exactly `<aspect>/<caseId>` (e.g.
`logotype-brand-exemption-and-erosion/case-03`).

## Return
A short summary: counts of aligned / stale-desc / not-aligned, then a bullet list of EVERY
`not-aligned` case with its one-line reason (these go to the human to decide next steps).
