CASE INDEX: 12
TESTCASE_ID: c4a2fe12d5a4
KIND: FN   SC: 4.1.2   RULE: kb1m8s   ARIA global properties not used where prohibited
run5 outcome: missedAgree   v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 4.1.2 LIKELY_OK [accessible-name-adequacy-v0] xpath=/html/body/h1[1]
  The h1 heading carries the accessible name 'I like bananas' sourced from its visible text content, which is a real, human-readable phrase that correctly identifies this heading — no 4.1.2 name-adequacy barrier is present.

## model reasoning trace (run5)

### subject sc=4.1.2 xpath=/html/body/h1[1] rubric=accessible-name-adequacy-v0 verdict=NOT REPRODUCED
THINK: Let me analyze this case carefully.

The element is `/html/body/h1[1]` - an H1 heading element.

Key signals:
1. **Accessible name**: "I like bananas" — present:true, resolved:true
2. **Decorative marking**: removedFromA11yTree:true, hiddenMechanism:"role-none" — wait, this is for an h1? That's interesting. The decorativeMarking signal says it's removed from the a11y tree via role-none.
3. **External checker cross-signal**: axe flagged `aria-braille-equivalent` for REVIEW on 4.1.2
4. **VSR annou
TOOL mcp__cdp__query_ax_node {"targetXpath":"/html/body/h1[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"heading\",\"roleSource\":\"role\",\"headingLevel\":1,\"nameFrom\":[\"contents\"],\"labelledby\":null,\"describedby\":null,\"focusable\":false,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":[],\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
THINK: OK so the ax node shows:
- role: "heading" (level 1)
- roleSource: "role"
- nameFrom: ["contents"]
- inTree: true
- NOT aria-hidden

This contradicts the decorativeMarking signal which said `removedFromA11yTree:true` with `hiddenMechanism:"role-none"`. The live ax node shows it IS in the tree with role="heading".

The accessible name "I like bananas" comes from contents, which matches the visible text. This is a proper h1 heading.

Now, the external checker flagged `aria-braille-equivalent` — th
SAY: The live `query_ax_node` result is definitive:

- **Computed role**: `heading` (level 1), in the accessibility tree
- **Name source**: `contents` — the visible text "I like bananas"
- No `aria-labelledby`, no `aria-describedby`, no prohibited ARIA attributes surfaced
- The `decorativeMarking` signal (role-none) contradicts the live AX node; the live measurement wins

The accessible name "I like ba

## FIXTURE HTML (kb1m8s/c4a2fe12d5a4)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 5</title>
</head>
<body>
	<h1 role="none" aria-brailleroledescription="Banana text">I like bananas</h1>
</body>
</html>
```
