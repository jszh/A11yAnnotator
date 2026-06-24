# case-03 — Collapsed disclosure: summary "Estimated cost for today's visit" expands to the cancellation policy

## Scenario
A patient-portal "Visit summary" page with three `<details>`/`<summary>` disclosures. The
`<summary>` is the visible section heading. In its **default collapsed state**, the first
summary reads "Estimated cost for today's visit" — telling a sighted user this section is
about cost/pricing. But the panel body, revealed only on expansion, is the practice's
**missed-appointment / cancellation policy** (no-show fees, discharge after three
no-shows). The heading describes a *different* section. The other two disclosures
("Your prescriptions from this visit" → the prescription list; "Follow-up & next steps"
→ follow-up instructions) are apt, isolating the failure to the first.

## Attribute tuple
- **content-domain**: healthcare / patient portal (visit summary)
- **UI-component/pattern**: native `<details>`/`<summary>` disclosure (collapsed by default)
- **host-language construct**: `<details><summary>…</summary>…</details>`
- **locale/i18n**: en
- **failure-mechanism**: heading apt only relative to a *different* section; collapsed default state mis-orients

## Developer persona
A CMS author at the health system assembled the visit-summary template from a library of
reusable disclosure blocks. They duplicated the "Estimated cost" block to add the
cancellation-policy content quickly, pasted the policy text into the body, but forgot to
update the duplicated summary text. Because the block was collapsed in the editor preview,
the stale "Estimated cost for today's visit" summary was never seen against its new body.

## Element / selector carrying the issue
- FAIL: the first `summary` ("Estimated cost for today's visit") whose `<details>` body is
  the missed-appointment / cancellation policy.
- PASS context: `details:nth-of-type(2) summary` ("Your prescriptions from this visit")
  and `details:nth-of-type(3) summary` ("Follow-up & next steps") accurately predict their
  bodies.

## Exact accessibility mechanism
The collapsed summary is what every user lands on. A sighted user scanning the page reads
"Estimated cost for today's visit" and either skips it (if they don't care about cost) or
opens it expecting a price — and instead finds a fee/discharge policy; they never realize
the cost information is absent and the policy is buried under a cost label. A screen-reader
user navigating disclosures hears the same misleading name and forms the same wrong
expectation. The heading-as-summary does not describe the topic of its content (TT 10.A;
the body becomes the perceivable content once expanded). The presence of a valid,
non-empty accessible name on the summary means name/role checks are green; the defect is
purely the *meaning* of the heading relative to its (state-gated) content.

## Expected ACT-style outcome
**failed** (a visible heading/summary does not describe the topic of its content; the
collapsed default state actively mis-orients the user).

## Why automated tools miss it
The `<summary>`/`<details>` markup is valid, the summary has a non-empty accessible name,
and structurally the summary "precedes" the body in the flat tree — a tool sees a
heading-then-content pair and passes. With the panel collapsed, the policy text is
`display:none` and not perceivable, so b49b2e — which judges the "first perceivable
content after the test target" and whose Assumptions explicitly exclude hidden/expandable
content — cannot evaluate it. No automated tool reads "Estimated cost," expands the
disclosure, reads "cancellation policy," and reasons that the two do not match. That is a
human semantic judgment over interacted-with content.

## Citation
> **ACT Rule b49b2e — Heading is descriptive (Assumptions)**
> "This rule also assumes that the content the heading is intended to describe is visible
> and not hidden from assistive technologies. Otherwise, cases such as expandable content
> using a heading might fail this rule while Success Criterion 2.4.6 Headings and Label is
> still satisfied."

> **Trusted Tester v5.1.3 — Test 10.A (Evaluate Results)**
> "The heading describes the topic or purpose of its content."
