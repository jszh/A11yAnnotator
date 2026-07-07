# ACT Rule bisz58 — Meta element has no refresh delay (no exception)
status: approved
implement: (not listed on rule page)
requirements: 2.2.4, 3.2.5
url: https://www.w3.org/WAI/standards-guidelines/act/rules/bisz58/proposed/

#

Proposed

Meta element has no refresh delay (no exception)

Rule Mapping

This is an Atomic rule
to test
2.2.4: Interruptions (Level AAA) ,
3.2.5: Change on Request (Level AAA)

## Description

This rule checks that the meta element is not used for delayed redirecting or refreshing.

## Applicability

This rule applies to the first meta element in a document for which all the following are true:

the element has an http-equiv attribute value of "refresh" ; and

the element has a valid content attribute value , as described in the meta refresh pragma directive.

## Expectation

For each target, the time from the content attribute value is 0. To determine the time , run the shared declarative refresh steps on the meta element as described in the HTML refresh state .

## Background

The meta http-equiv="refresh" directive is an HTML tag used to instruct browsers to automatically refresh or reload a web page after a specified time interval. This can be useful for updating content dynamically or redirecting users to another page.

The content attribute in the meta http-equiv="refresh" directive is used to define the time interval, in seconds, after which the browser should automatically refresh or reload the web page. For example, content="5" would instruct the browser to refresh the page every 5 seconds. Careful consideration of the refresh interval is crucial to ensure optimal user experience and accessibility, particularly for individuals who may require more time to consume or interact with web content.

Because a refresh with a timing of 0 is effectively a redirect, it is exempt from this rule. Since refreshing the same page with a time of 0 can cause rapid screen flashes it is strongly recommended to avoid this.

### Assumptions

This rule assumes that no functionality was provided by the website for the user to adjust the timer.

### Accessibility Support

Not all major web browsers parse the value of the content attribute in the same way. Some major browsers, when they are unable to parse the value, default to a 0 seconds delay, whereas others will not redirect at all. This can cause some pages to be inapplicable for this rule, while still having a redirect in a minority of web browsers.

### Other Resources

Understanding Success Criterion 2.2.1: Timing Adjustable

Understanding Success Criterion 2.2.4: Interruptions

Understanding Success Criterion 3.2.5: Change on Request

G110: Using an instant client-side redirect

H76: Using meta refresh to create an instant client-side redirect

F40: Failure of Success Criterion 2.2.1 and 2.2.4 due to using meta redirect with a time limit

F41: Failure of Success Criterion 2.2.1, 2.2.4, and 3.2.5 due to using meta refresh with a time-out

## Accessibility Requirements Mapping

2.2.4 Interruptions (Level AAA)

Learn more about 2.2.4 Interruptions

Required for conformance to WCAG 2.0 and later on level AAA.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion needs further testing

An inapplicable outcome: success criterion needs further testing

3.2.5 Change on Request (Level AAA)

Learn more about 3.2.5 Change on Request

Required for conformance to WCAG 2.0 and later on level AAA.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion needs further testing

An inapplicable outcome: success criterion needs further testing

G110: Using an instant client-side redirect

Learn more about technique G110

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

H76: Using meta refresh to create an instant client-side redirect

Learn more about technique H76

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

### Secondary Requirements

This rule is related to the following accessibility requirements, but was
not designed to test this requirements directly. These
secondary requirements
can either be stricter than the rule requires, or may be satisfied in ways
not tested by the rule:

2.2.1 Timing Adjustable (Level A) : This success criterion is less strict than this rule. This is because this criterion allows redirects longer than 20 hours. Some of the failed examples satisfy this success criterion.

## Input Aspects

The following aspects are required in using this rule.

DOM Tree

## Examples

### Passed

#### Passed Example 1

Open in a new tab

This meta element redirects the user immediately. Users won’t notice the change in context.

<head>
<meta http-equiv= "refresh" content= "0; URL='https://w3.org'" />
</head>

#### Passed Example 2

Open in a new tab

The first valid meta element redirects immediately.

<head>
<meta http-equiv= "refresh" content= "0; https://w3.org" />
<meta http-equiv= "refresh" content= "30; https://w3.org" />
</head>

### Failed

#### Failed Example 1

Open in a new tab

This meta element refreshes the page after 30 seconds.

<head>
<meta http-equiv= "refresh" content= "30" />
</head>

#### Failed Example 2

Open in a new tab

This meta element redirects the user after 20 hours.

<head>
<meta http-equiv= "refresh" content= "72001; URL='https://w3.org'" />
</head>

#### Failed Example 3

Open in a new tab

The first meta element is not valid (because of the colon instead of a semi-colon in the content attribute), the second one redirects after 20 hours.

<head>
<meta http-equiv= "refresh" content= "0: https://w3.org" />
<meta http-equiv= "refresh" content= "72001; https://w3.org" />
</head>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

This meta element has no content attribute.

<head>
<meta http-equiv= "refresh" />
</head>

#### Inapplicable Example 2

Open in a new tab

This meta element has no http-equiv="refresh" attribute.

<head>
<meta content= "72001" />
</head>

#### Inapplicable Example 3

Open in a new tab

This meta element has an invalid content attribute (because of the colon instead of a semi-colon), and is therefore inapplicable.

<head>
<meta http-equiv= "refresh" content= "0: http://example.com" />
</head>

#### Inapplicable Example 4

Open in a new tab

This meta element has an invalid content attribute, and is therefore inapplicable.

<head>
<meta http-equiv= "refresh" content= "-00.12 foo" />
</head>

#### Inapplicable Example 5

Open in a new tab

This meta element has an invalid content attribute, and is therefore inapplicable.

<head>
<meta http-equiv= "refresh" content= "; 72001" />
</head>

#### Inapplicable Example 6

Open in a new tab

This meta element has an invalid content attribute, and is therefore inapplicable.

<head>
<meta http-equiv= "refresh" content= "" />
</head>

#### Inapplicable Example 7

Open in a new tab

This meta element has an invalid content attribute, and is therefore inapplicable.

<head>
<meta http-equiv= "refresh" content= "+72001; http://w3.org" />
</head>

#### Inapplicable Example 8

Open in a new tab

This meta element has an invalid content attribute, and is therefore inapplicable.

<head>
<meta http-equiv= "refresh" content= "foo; URL='https://w3.org'" />
</head>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
