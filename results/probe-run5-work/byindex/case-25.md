CASE INDEX: 25
TESTCASE_ID: 2f1d964151ff
KIND: FN   SC: 2.4.6   RULE: cc0f0a   Form field label is descriptive
run5 outcome: uncertain   v3Barrier(deterministic): false   inScopeAutoPartial: 1   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 2.4.6 UNCERTAIN [heading-descriptive-v0] xpath=/html/body/input[1]
  The input's aria-labelledby references the submit button ('Go') first—a likely reversed/non-descriptive label order—but the exact assembled accessible name cannot be confirmed, leaving descriptiveness under 2.4.6 unresolved.

## model reasoning trace (run5)

### subject sc=2.4.6 xpath=/html/body/input[1] rubric=heading-descriptive-v0 verdict=PARTIAL
THINK: Let me analyze this. The element is `/html/body/input[1]` - a form input field. The viewport shows an unlabeled text input with a "Go" button. The VSR announcement is "(none)" meaning the input has no accessible name/label.

The claim family is "heading-descriptive" which covers both headings and labels per 2.4.6.

The input appears to have no label at all (VSR is "(none)"). Let me check the AX node to confirm.

Actually, the rubric says: "2.4.6 is about DESCRIPTIVENESS, not presence (missing he
TOOL mcp__cdp__query_ax_node {"targetXpath":"/html/body/input[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"textbox\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"relatedElement\"],\"labelledby\":[{\"id\":\"submit\",\"present\":true,\"hasText\":true},{\"id\":\"search\",\"present\":true,\"hasText\":true}],\"describedby\":null,\"focusable\":true,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing
THINK: Interesting! The input has `aria-labelledby` referencing two IDs: "submit" and "search". Let me check what text those IDs contain. The label is assembled from two referenced IDs. I need to see if this creates a meaningful label or a mismatched/reversed label order issue.

The nameFrom is ["relatedElement"] and it's labelledby ["submit", "search"]. The "submit" ID likely refers to the "Go" button and "search" might be another element. Let me check what accessible name this produces.

Actually, th
TOOL mcp__cdp__query_ax_node {"x":182,"y":18}
TOOL mcp__cdp__measure_geometry_live {"targetXpath":"/html/body/input[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"button\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"contents\"],\"labelledby\":\"unresolved-on-coordinate-path\",\"describedby\":\"unresolved-on-coordinate-path\",\"focusable\":true,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[],\"ignoredByActiveModal\"
TOOL_RESULT: [{"type":"text","text":"{\"found\":true,\"box\":{\"x\":8,\"y\":8,\"w\":153,\"h\":21},\"scrollWidth\":149,\"clientWidth\":149,\"overflowsHorizontally\":false,\"overflowPx\":0,\"overflowCulprit\":null,\"overlap\":null,\"occludedElements\":[],\"viewportWidthUsed\":1280,\"ambiguous\":false,\"targetXpath\":\"/html/body/input[1]\",\"stateUsed\":\"as-loaded(shared-page)\"}"}]
THINK: So the input at `/html/body/input[1]` has its accessible name sourced from `aria-labelledby` referencing IDs "submit" and "search" in that order. The "submit" ID appears to be the "Go" button (a button element), and "search" is some other element.

The VSR says "(none)" which is puzzling given the AX node shows labelledby references resolved. But the order "submit" then "search" means the accessible name concatenates the text of "submit" (the "Go" button) first, then "search". This would produce
TOOL mcp__cdp__capture_full_page {"targetXpath":"/html/body/input[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"screenshot\":\"<base64 8280 chars elided>\",\"fullPage\":true,\"pageSize\":{\"w\":1280,\"h\":900},\"viewport\":{\"w\":1280,\"h\":900},\"target\":{\"box\":{\"x\":8,\"y\":8,\"w\":153,\"h\":21},\"tag\":\"input\",\"role\":null,\"text\":\"\",\"inViewport\":true,\"offDocument\":false,\"verticalPositionPct\":1},\"note\":\"the WHOLE scrollable document (below the fold included).
THINK: The full page screenshot confirms there are only two elements on the page: an unlabeled text input and a "Go" button. 

From the AX node, the input has aria-labelledby referencing "submit" and "search" IDs. The "submit" ID likely maps to the "Go" button. But what is "search"?

The page appears to be nearly empty except for the input and button. The accessible name would be assembled from the text content of elements with id="submit" and id="search" in that order.

Looking at the VSR announcement
TOOL mcp__cdp__query_ax_node {"x":90,"y":18}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"textbox\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"relatedElement\"],\"labelledby\":\"unresolved-on-coordinate-path\",\"describedby\":\"unresolved-on-coordinate-path\",\"focusable\":true,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[],\"ignoredByActive
THINK: I need to understand what the assembled accessible name is for the textbox. The AX node shows `nameFrom: ["relatedElement"]` and `labelledby: [{"id":"submit","present":true,"hasText":true},{"id":"search","present":true,"hasText":true}]`.

But what are those IDs? "submit" likely is the button with "Go" text. "search" could be the input itself or another element. But inputs typically don't have their own text content, so the aria-labelledby references to "search" might refer to some other text ele
SAY: Let me check the accessible name more carefully by looking at the referenced elements.
TOOL mcp__cdp__ocr_image_text {"x":0,"y":0,"width":300,"height":50}
TOOL_RESULT: [{"type":"text","text":"{\"text\":\"Go\",\"lines\":[{\"text\":\"Go\",\"score\":0.9999535083770752,\"box\":[[170,9],[195,9],[195,29],[170,29]]}],\"lineCount\":1,\"minLineScore\":1,\"lowConfidenceLineCount\":0,\"engine\":\"PP-OCRv6 (paddleocr 3.7.0)\",\"note\":\"recognised text + PER-LINE boxes/confidence (PP-OCRv6 is a 50-language unified model; confidence is per-LINE, not per-glyph). Empty text OR
THINK: OCR only finds "Go" text on the page. The text input itself is empty (no label visible, no text in it). The only visible text is "Go" on the button.

So the page has:
- A text input with no visible label
- A "Go" button

The AX node shows the input has aria-labelledby referencing "submit" (present, hasText:true) and "search" (present, hasText:true). But OCR only shows "Go" visible text. The "search" element might be hidden (off-screen, display:none, visibility:hidden, etc.) or might be empty/ver
SAY: Based on my investigation, I have the following evidence:

1. **No headings** — `structure.headings: []` confirms zero headings on the page; nothing to evaluate for heading descriptiveness.
2. **The target input** — `role: textbox`, `nameFrom: ["relatedElement"]`, with `aria-labelledby` referencing `id="submit"` (present, hasText:true) then `id="search"` (present, hasText:true).
3. **VSR announcem

## FIXTURE HTML (cc0f0a/2f1d964151ff)
```html
<!DOCTYPE html>
<html lang="en">
	<span id="search" style="display: none">Search</span>
	<input type="text" name="search" aria-labelledby="submit search" />
	<button id="submit">Go</button>
</html>
```
