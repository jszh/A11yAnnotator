CASE INDEX: 35
TESTCASE_ID: c3ed1c920db0
GT (expected): passed   SC: 1.1.1   RULE: 8fc3b6   Object element rendering non-text content has non-empty accessible name
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 1.1.1 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (8fc3b6/c3ed1c920db0)
```html
<!DOCTYPE html>
<html>
	<style>
		.offScreen {
			position: absolute;
			left: -9999px;
			top: -9999px;
		}
	</style>
	<body>
		<object title="Moon speech" data="/WAI/content-assets/wcag-act-rules/test-assets/moon-audio/moon-speech.mp3" class="offScreen"></object>
	</body>
</html>
```
