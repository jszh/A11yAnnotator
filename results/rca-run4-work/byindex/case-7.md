CASE INDEX: 7
TESTCASE_ID: 096bf1e8eeb0
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 97a4e1   Button has non-empty accessible name

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 096bf1e8eeb0  [FP]
- rule: 97a4e1  Button has non-empty accessible name
- sc(GT-scored): 4.1.2   expected(GT): inapplicable   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/97a4e1/096bf1e8eeb0b5633861389cb3fa3267649e396c.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=medium [accessible-name-adequacy-v0] xpath=/html/body/button[1]
  summary: The accessible name 'take me somewhere' is present but inadequate — it conveys no specific destination or purpose, making it the navigation equivalent of 'click here'.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/button[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this case. The element is a button with:
- Accessible name: "take me somewhere" (present: true, resolved: true)
- Role override: native `button` tag but has `role="link"`
- The roleScrutiny flags that this control overrides its native role

The rubric says when there's a role override, I should verify the announced role matches its actual behavior. Let me check the computed role via query_ax_node.

The key question here is:
1. Is the accessible name "take me somewhere" adequate for this control?
2. Is the role override (`role="link"` on a `<button>`) a 4.1.2 barrier?
The name itself is somewhat vague—it hints at navigation but doesn't specify the destination. The bigger concern is the role mismatch: a `<button>` with `role="link"` creates a disconnect between what's announced and what users expect based on the element's visual and functional behavior. I need to check what role actually gets computed to determine if this violates 4.1.2. "Take me somewhere" is vague like "click here" — it hints at navigation without specifying a destination, which makes it inadequate for conveying the control's actual purpose. I'm also noticing the `role="link"` on a `<button>` element is problematic since the ARIA spec expects a link role to have href-equivalent behavior, and this setup could mislead assistive technology users about what the control actually does.
TOOL_CALL mcp__cdp__query_ax_node input={"targetXpath":"/html/body/button[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"link\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"contents\"],\"labelledby\":null,\"describedby\":null,\"focusable\":true,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":[],\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
THINK: So the computed role is "link" (from the `role` attribute on the `<button>` element). The name comes from "contents" which means the text content "take me somewhere."

Now let me assess:

1. **Role**: The element is a `<button>` with `role="link"`. The computed role is "link." This is technically valid ARIA - you can override a button's role to link. However, a link role typically implies navigation to a URL. The ARIA spec does allow `role="link"` on non-anchor elements.

2. **Name adequacy**: "take me somewhere" - this is vague and doesn't tell the user where the link will take them. 

A screen reader user would hear "take me somewhere, link" and get no useful information about the destination or purpose. It's like saying "click here" without context. The name conveys navigation intent but deliberately obscures the specific destination, which fails the accessibility requirement that a non-sighted user should understand what the control does or where it goes. The vagueness of "somewhere" is the core issue—it's essentially a "click here" button that fails to specify the actual destination. Even though the surrounding context isn't visible in the crop, the button itself provides no meaningful indication of purpose. I'm settling on REPRODUCED with medium confidence.
SAY: The AX node confirms: **computed role = `link`** (sourced from the `role` attribute), name from `contents` = "take me somewhere", focusable, not hidden.

Now I have everything needed to judge:

---

```json
{
  "verdict": "REPRODUCED",
  "confidence": "medium",
  "summary": "The accessible name 'take me somewhere' is present but inadequate — it conveys no specific destination or purpose, making it the navigation equivalent of 'click here'.",
  "reasoning": "The computed role is 'link' and the name resolves to 'take me somewhere' (from text contents); 'somewhere' is inherently non-descriptive and leaves a screen-reader user with no information about where the link leads or what action it performs, which is the 4.1.2 adequacy barrier.",
  "evidenceRefs": [
    "accessibleName.value = 'take me somewhere' (present:true, resolved:true, nameFrom:contents)",
    "query_ax_node: role='link' (roleSource='role'), focusable=true, not aria-hidden",
    "element-crop: rendered label is 'take me somewhere' — no surrounding context disambiguates the destination",
    "WCAG 4.1.2 / ARIA14: name must convey the control's purpose; 'somewhere' is non-specific and fails to describe destination or action"
  ]
}
```


================= FIXTURE HTML (97a4e1/096bf1e8eeb0) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Inapplicable Example 3</title>
</head>
<body>
	<button role="link">take me somewhere</button>
</body>
</html>
```
