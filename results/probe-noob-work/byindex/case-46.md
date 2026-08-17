CASE INDEX: 46
TESTCASE_ID: 305891f137b5
GT (expected): passed   SC: 2.1.1   RULE: 0ssw9k   Scrollable content can be reached with sequential focus navigation
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 1   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 2.1.1 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (0ssw9k/305891f137b5)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 2</title>
</head>
<body>
	<section style="height: 100px; width: 500px; overflow: scroll;">
		<h1>
			<a href="https://www.w3.org/TR/WCAG21/#abstract">
				WCAG 2.1 Abstract
			</a>
		</h1>
		<p>
			Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
			accessible. Following these guidelines will make content more accessible to a wider range of people with
			disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
			speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
			and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
			address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
			will also often make Web content more usable to users in general.
		</p>
	</section>
</body>
</html>
```
