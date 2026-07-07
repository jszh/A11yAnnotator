# ACT Rule ffd0e9 — Heading has non-empty accessible name
status: proposed
implement: (not listed on rule page)
requirements: (no mapped WCAG SC — pure ARIA/other; requirementKeys: aria12:namecalculation)
url: https://www.w3.org/WAI/standards-guidelines/act/rules/ffd0e9/proposed/

#

Proposed

Heading has non-empty accessible name

Rule Mapping

This is an Atomic rule

## Description

This rule checks that each heading has a non-empty accessible name.

## Applicability

This rule applies to any HTML element that is a semantic heading , included in the accessibility tree .

## Expectation

Each test target has a non-empty ( "" ) accessible name .

## Background

Completely empty headings (e.g., <h1></h1> ) seem to be consistently ignored by assistive technologies. However, they fail Technique H42: Using h1-h6 to identify headings (by using heading markup for content which is not heading). Moreover, they may be rendered on screen (by breaking flow content, or because of custom styling), thus causing concerns for sighted users. Therefore, this rule also fails on these.

### Assumptions

There are no assumptions.

### Accessibility Support

Some assistive technologies may hide headings with empty accessible name from the users. This depends on the user agent, on how the accessible name was computed (the accessible name and description computation is not clear concerning which characters should be trimmed), and on the assistive technology itself. Hence, there are cases where the outcome of this rule is failed , but users of certain assistive technology and browser combinations will not experience an issue.

Implementation of Presentational Roles Conflict Resolution varies from one browser or assistive technology to another. Depending on this, some semantic heading elements can fail this rule with some technology but users of other technologies would not experience any accessibility issue because the same elements would have a semantic role of presentation and be hidden for these users.

The accessible name and description computation suggests that if an aria-labelledby attribute refers to an existing but empty element, the computation should stop and return an empty name without defaulting to the next steps. Several user agents and assistive technologies chose to use the next step in the computation in this case (ultimately defaulting to the content).

### Other Resources

Understanding Success Criterion 1.3.1: Info and Relationships

Technique H42: Using h1-h6 to identify headings

## Accessibility Requirements Mapping

ARIA 1.2, 5.2.8 Accessible Name Calculation

Learn more about ARIA 1.2, 5.2.8 Accessible Name Calculation

Required for conformance to WAI-ARIA 1.2 author requirements.

Outcome mapping:

Any failed outcomes: WAI-ARIA requirement is not satisfied

All passed outcomes: WAI-ARIA requirement needs further testing

An inapplicable outcome: WAI-ARIA requirement needs further testing

## Input Aspects

The following aspects are required in using this rule.

Accessibility Tree

DOM Tree

CSS Styling

## Examples

### Passed

#### Passed Example 1

Open in a new tab

This h1 element has a non-empty accessible name .

<h1> ACT rules </h1>

#### Passed Example 2

Open in a new tab

This div element with a semantic role of heading has a non-empty accessible name .

<div role= "heading" aria-level= "1" > ACT rules </div>

#### Passed Example 3

Open in a new tab

This h1 element has a non-empty accessible name given by its aria-labelledby attribute.

<span id= "h-name" hidden > ACT rules </span>
<h1 aria-labelledby= "h-name" > Learn about ACT rules </h1>

#### Passed Example 4

Open in a new tab

This h1 element has a non-empty accessible name given by the alt attribute of its content.

<h1><img src= "/test-assets/shared/act-logo.png" alt= "ACT rules" /></h1>

#### Passed Example 5

Open in a new tab

This h1 element is not visible , but is still included in the accessibility tree . It has a non-empty accessible name .

<h1 style= "position: absolute; top: -9999px" > ACT rules </h1>

### Failed

#### Failed Example 1

Open in a new tab

This h1 element has an empty accessible name because its content is not exposed to assistive technologies.

<h1><img src= "/test-assets/shared/act-logo.png" alt= "" /></h1>

#### Failed Example 2

Open in a new tab

This h1 element has an empty accessible name given by its aria-label attribute. Its content is not exposed to assistive technologies, thus preventing the accessible name to default to the content.

<h1 aria-label= "" ><span aria-hidden= "true" > ACT rules </span></h1>

#### Failed Example 3

Open in a new tab

This h1 element has an empty accessible name given by its aria-labelledby attribute. Its content is not exposed to assistive technologies, thus preventing the accessible name to default to the content.

<span id= "h-name" hidden ></span>
<h1 aria-labelledby= "h-name" ><span aria-hidden= "true" > ACT rules </span></h1>

#### Failed Example 4

Open in a new tab

This h1 element has an empty accessible name because the img element has a semantic role of presentation , and thus does not provide an accessible name to the h1 element. Note that the alt attribute does not trigger Presentational Roles Conflict Resolution because it is not an ARIA attribute.

<h1><img src= "/test-assets/shared/act-logo.png" alt= "ACT rules" role= "presentation" /></h1>

#### Failed Example 5

Open in a new tab

This h1 element has an empty accessible name because the spaces and line break are trimmed by accessible name computation .

<h1><br /></h1>

#### Failed Example 6

Open in a new tab

This h1 element has an empty accessible name . It is nonetheless rendered by breaking the flow content, resulting in a confusing situation for sighted users.

<span> Hello </span>
<h1></h1>
<span> World! </span>

#### Failed Example 7

Open in a new tab

This div element with a semantic role of heading has an empty accessible name (and content). It is nonetheless rendered due to its styling, resulting in a confusing situation for sighted users.

<div role= "heading" aria-level= "1" style= "border-style: solid" ></div>

#### Failed Example 8

Open in a new tab

This h1 element has an explicit role of none . However, the global property aria-label is specified. Thus it has a semantic role of heading due to Presentational Roles Conflict Resolution . It has an empty accessible name given by its aria-label attribute and the lack of accessible content to fallback to.

<h1 aria-label= "" role= "none" ><span aria-hidden= "true" > ACT rules </span></h1>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

There is no semantic heading element.

<div></div>

#### Inapplicable Example 2

Open in a new tab

This h1 element is not included in the accessibility tree .

<h1 aria-hidden= "true" ></h1>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
