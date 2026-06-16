---
id: error-suggestion-v0
sc: 3.3.3
skill: forms-instructions-errors
visionEvidence: [state-before, state-after]
---

# 3.3.3 — error suggestion (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT drive the form — the driver already submitted it and captured
the field+error region before/after. (3.3.1 error IDENTIFICATION has its own deterministic runner; do
NOT re-litigate whether an error was identified.) JUDGE whether, WHEN an input error is detected and
suggestions are known, a CORRECTION suggestion is provided.

**Judge:** does the error message tell the user HOW to fix it (a suggestion), not merely THAT it is
wrong? "Invalid email" alone is weaker than "Enter an email like name@example.com". Only applies when a
suggestion is actually possible (free-text essays / security reasons may exempt — see caveats).

**Evidence handed to you:** the before/after crop of the field+error region (`state-before`,
`state-after`), the validation/error text, and the field type.

**WCAG soundness caveats (these STOP a false barrier):**
- C2 (mechanism-agnostic): do NOT infer a 3.3.3 failure from a missing `aria-invalid` or the absence of a
  message — only judge the CONTENT of a message that IS shown.
- If a correction suggestion is genuinely not knowable (or withholding it is essential, e.g. security),
  the absence is NOT a failure — return NOT REPRODUCED or N/A as fits.
- If no error was demonstrated for this field, there is nothing to judge → N/A (abstain).

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
