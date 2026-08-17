# RCA case 85a2d2ea8aeb  [FP]
- rule: 6cfa84  Element with aria-hidden has no content in sequential focus navigation
- sc(GT-scored): 4.1.2   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/6cfa84/85a2d2ea8aeb1eddb5a6576edb958c2d1597ddfc.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/div[1]/button[1]
  summary: The accessible name 'Some button' is generic and uninformative, failing to convey the control's purpose to a non-sighted user.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/div[1]/button[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: The element has an accessible name "Some button" which is present and resolved. The visual crop shows a button labeled "Some button". 

"Some button" is a generic, uninformative name - it doesn't describe what the button does. It's similar to naming a button "button" or "click here". The name doesn't convey the control's purpose.

This is a clear case of an inadequate accessible name - "Some button" is generic and tells a non-sighted user nothing about what the button does.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The accessible name 'Some button' is generic and uninformative, failing to convey the control's purpose to a non-sighted user.",
  "reasoning": "The name 'Some button' describes only that the element is a button (which is already conveyed by its role), providing zero information about what action the button performs — exactly the pattern the rubric identifies as a barrier (a generic name on a control whose purpose is specific).",
  "evidenceRefs": [
    "accessibleName.value = 'Some button' (present: true, resolved: true)",
    "element-crop: rendered button visually labeled 'Some button'",
    "Rubric: generic names such as 'button', 'click', 'untitled' on a purpose-specific control are barriers under 4.1.2 / ARIA14"
  ]
}
```
