# case-02 — News article: breadcrumbs, share menu-button, pagination — zero data-entry controls (INAPPLICABLE)

## Scenario
A long-form newspaper feature ("The Quiet Comeback of the Night Train"). The page is interaction-rich but has **no data-entry control at all**: breadcrumb links, a "Print" action button, a "Share" menu-button (`aria-haspopup="menu"`) that opens a real menu of share *links*, a "Top" jump link, prev/next article pagination links, numbered page pagination links, related-reading links, and topic tag links. There is no `<form>`, no `<input>`, no editable element. Because SC 3.3.2 applies only "when content requires user input," and this page requires none, the correct disposition is **inapplicable** (Trusted Tester: "DNA if the page does not have form elements").

## Attribute tuple
- **content-domain:** news / long-form editorial
- **UI-component / pattern:** breadcrumb + menu button (share) + pagination (prev/next + numbered) + action button (print) + tag/related links
- **host-language construct:** `<a href="#...">` navigation, `<button aria-haspopup="menu">` opening a `role="menu"` of link items; NO inputs
- **locale / i18n:** en (Nordic byline content)
- **failure-mechanism:** none — pure INAPPLICABLE; the page is built to bait an over-eager "every control needs an instruction" evaluator

## Developer persona
A front-end dev on a newspaper CMS template. They built a rich reading experience: share menu, pagination, breadcrumbs. None of it is a form, and they never added one — articles don't collect data here (comments live on a separate page). The realism trap is that the "Share ▾" control is a fashionable menu-button and the pagination looks form-adjacent, so a reviewer skimming for "controls" might reflexively ask "where are the instructions for these inputs?" — but there are no inputs.

## Element / selector carrying the issue
No failing element and no in-scope element. Controls an evaluator must recognise as OUT of scope (not data entry): `nav.crumbs a`, `#shareBtn` + `#shareMenu [role=menuitem]`, `#printBtn`, `.pagenav a`, `.pages a`, `.related a`, `.tags a`, the `#top` jump link.

## Exact accessibility mechanism (what AT experiences / why it is inapplicable)
- **Screen-reader user:** navigating the page hears links and buttons — "Share, button, has popup, collapsed"; activating it opens "Share this article, menu" with four link items; "Next, link"; "page 2, link". Every interactive element is a navigation or action control. None prompts for or accepts typed/selected data.
- **Keyboard user:** Tab cycles through links and the share/print buttons; Enter follows links or opens the menu. There is nothing to "fill in."
- Because no control "requires user input," there is no population of form elements for 3.3.2 to evaluate. The SC simply does not apply.

## Expected ACT-style outcome
**inapplicable** (SC 3.3.2 — the page contains no data-entry controls; per the SC's scope clause and Trusted Tester DNA condition, there is nothing for 3.3.2 to test).

## Why automated tools miss it
axe/WAVE/Lighthouse emit no 3.3.2 finding here simply because there are no form inputs to label — but "no rule fired" is not the same as the affirmative judgment "3.3.2 is inapplicable because nothing on this page is a data-entry control." A tool cannot tell whether silence means "passed," "no inputs present," or "inputs present but somehow skipped." The human/model judgment this fixture demands is to look at the share menu-button, the pagination, and the breadcrumbs and correctly conclude they are not associated with data entry — and therefore neither owe nor lack a 3.3.2 instruction. This guards directly against the failure mode where an evaluator flags links/menus/pagination as "missing input instructions."

## Citation
> "This success criterion does not apply to links or other controls (such as an expand/collapse widget, or similar interactive components) that are not associated with data entry."
— wcag-understanding/labels-or-instructions.html (Intent)

> "DNA if the page does not have form elements or all form elements are disabled."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A — Test Condition / DNA)

> "Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 3.3.2 Labels or Instructions. (Do not need to meet or test)"
— docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md (C.9.3.3.2 — Result)
