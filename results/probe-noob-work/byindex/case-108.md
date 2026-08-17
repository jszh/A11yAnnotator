CASE INDEX: 108
TESTCASE_ID: ab3046bbe77e
GT (expected): inapplicable   SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 4.1.2 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (4b1c6c/ab3046bbe77e)
```html
<!DOCTYPE html>
<html lang="en">
	<iframe style="display:none;" title="Document One" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html">
	</iframe>

	<iframe style="display:none;" aria-label="Document One" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-two.html">
	</iframe>
</html>
```
