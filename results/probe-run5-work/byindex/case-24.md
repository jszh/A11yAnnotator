CASE INDEX: 24
TESTCASE_ID: dddcd76a61f6
KIND: FN   SC: 2.4.4   RULE: fd3a94   Links with identical accessible names and same context serve equivalent purpose
run5 outcome: uncertain   v3Barrier(deterministic): false   inScopeAutoPartial: 2   inScopeObligations: 2

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 2.4.4 UNCERTAIN [link-purpose-v0] xpath=/html/body/div[1]/span[3]/span[1]
  The link name 'Contact Us' is inherently descriptive, but a same-named peer link exists whose destination cannot be verified (no href; resolve_destination failed), so a same-name/different-destination barrier cannot be ruled out.

## model reasoning trace (run5)

### subject sc=2.4.4 xpath=/html/body/div[1]/span[3]/span[1] rubric=link-purpose-v0 verdict=PARTIAL
THINK: Let me analyze the evidence for WCAG 2.4.4 link purpose.

The accessible name is "Contact Us" - this is a clear, descriptive name that tells users exactly where the link goes (a contact page/form).

There's a same-named link peer at `/html/body/div[1]/span[3]/span[2]` also named "Contact Us" with `distinctRawHrefs: 0`. The signal says there are 0 distinct raw hrefs, which means they share the same raw href (or both have null hrefs). But the uncertainty reason says I shouldn't rely on raw href eq
SAY: I need to resolve the destinations of the two same-named "Contact Us" links before deciding, since both have null raw hrefs (span elements, not anchors) and I cannot confirm they go to the same place without checking.
TOOL mcp__cdp__resolve_destination {"linkXpaths":["/html/body/div[1]/span[3]/span[1]","/html/body/div[1]/span[3]/span[2]"]}
TOOL_RESULT: [{"type":"text","text":"{\"fingerprints\":[{\"linkXpath\":\"/html/body/div[1]/span[3]/span[1]\",\"error\":\"no href on the target\"},{\"linkXpath\":\"/html/body/div[1]/span[3]/span[2]\",\"error\":\"no href on the target\"}],\"resolvedCount\":0,\"equality\":{\"finalUrlEqual\":null,\"titleEqual\":null,\"h1Equal\":null,\"mainFirstParagraphEqual\":null},\"note\":\"each link resolved to a raw fingerpri
THINK: Both links have no href, so resolve_destination can't follow them. These are span elements with role=link (or just spans) that are JavaScript-driven. 

Now I need to make a judgment. Since I can't resolve the destinations:

1. "Contact Us" is a clear, descriptive link name - it's not generic
2. Both links share the same name "Contact Us"
3. Both have null hrefs - they're JavaScript-driven

The question is: do these two same-named links go to different destinations? Since both are labeled "Contac
SAY: Both links lack `href` attributes (JavaScript-driven spans), so destination resolution is impossible. I must now judge on the available evidence.

**Analysis:**

1. **Name clarity:** "Contact Us" is a descriptive, non-generic name — it clearly communicates the link's purpose (reaching out to the organisation). This is not a bare action word ("Click here", "Read more") or format-only token.

2. **S

## FIXTURE HTML (fd3a94/dddcd76a61f6)
```html
<!DOCTYPE html>
<html lang="en">
	<div>
		<span style="text-align:center;">Contact us</span>
		<span style="display:flex; justify-content:space-around;">
			<img src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/shared/chat.png" alt="Chat" style="max-width:50px;" />
			<img src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/shared/phone.png" alt="Phone" style="max-width:50px;" />
		</span>
		<span style="display:flex; justify-content:space-around;">
			<span
				role="link"
				tabindex="0"
				onclick="location='/WAI/content-assets/wcag-act-rules/test-assets/links-with-identical-names-serve-equivalent-purpose-b20e66/contact-us.html?page=1'"
				>Contact Us</span
			>
			<span
				role="link"
				tabindex="0"
				onclick="location='/WAI/content-assets/wcag-act-rules/test-assets/links-with-identical-names-serve-equivalent-purpose-b20e66/contact-us.html?page=2'"
				>Contact Us</span
			>
		</span>
	</div>
</html>
```
