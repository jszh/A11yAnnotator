# ACT Rule ucwvc8 — HTML page language subtag matches default language
status: proposed
implement: (not listed on rule page)
requirements: 3.1.1
url: https://www.w3.org/WAI/standards-guidelines/act/rules/ucwvc8/proposed/

#

Proposed

HTML page language subtag matches default language

Rule Mapping

This is an Atomic rule
to test
3.1.1: Language of Page (Level A)

## Description

This rule checks that the primary language subtag of the page language matches the default language of the page

## Applicability

This rule applies to any document element if it is an html element for which all of the following are true:

The document element has a lang attribute with a value that has a known primary language tag ; and

The document element is in a top-level browsing context ; and

The document element has a content type of text/html ; and

The document element has a defined default page language .

## Expectation

For each test target, the known primary language tag of its lang attribute matches the default page language of the test target.

## Background

### Assumptions

This rule assumes that the default human language of a page, as described in WCAG 2, can be determined by counting the number of words used in each language. If the default language needs to be derived in some other way (such as frequency analysis, mutual information based distance, …), this rule may fail while Success Criterion 3.1.1: Language of Page is still satisfied.

The language of the page can be set by other methods than the lang attribute, for example using HTTP headers or the meta element. These methods are not supported by all assistive technologies. This rule assumes that these other methods are insufficient to satisfying Success Criterion 3.1.1: Language of Page .

This rule assumes that user agents and assistive technologies can programmatically determine known primary language tags even if these do not conform to the RFC 5646 syntax.

This rule assumes that only known primary language tags are enough to satisfy Success Criterion 3.1.1 Language of Page ; this notably excludes grandfathered tags and ISO 639.2 three-letters codes, both having poor support in assistive technologies.

This rule assumes that iframe title elements are not exposed to assistive technologies and so does not consider them as part of the default page language .

### Accessibility Support

There are no accessibility support issues known.

### Related rules

HTML page has lang attribute

HTML page lang attribute has valid language tag

### Other Resources

Understanding Success Criterion 3.1.1: Language of Page

H57: Using language attributes on the html element

RFC 5646: Tags for Identifying Languages

The lang and xml:lang attributes

## Accessibility Requirements Mapping

3.1.1 Language of Page (Level A)

Learn more about 3.1.1 Language of Page

Required for conformance to WCAG 2.0 and later on level A and higher.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion is satisfied

An inapplicable outcome: success criterion needs further testing

H57: Using the language attribute on the HTML element

Learn more about technique H57

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique is satisfied

An inapplicable outcome: technique is satisfied

## Input Aspects

The following aspects are required in using this rule.

DOM tree

Accessibility tree

CSS Styling

Language

## Examples

### Passed

#### Passed Example 1

Open in a new tab

This page has a lang attribute value of en (English), which matches the default language of the page . The default language is English because all words are English.

<html lang= "en" >
<head>
<title> ACT Rules Format 1.0 - Abstract </title>
</head>
<body>
<p>
The Accessibility Conformance Testing (ACT) Rules Format 1.0 defines a format for writing accessibility test
rules. These test rules can be used for developing automated testing tools and manual testing methodologies. It
provides a common format that allows any party involved in accessibility testing to document and share their
testing procedures in a robust and understandable manner. This enables transparency and harmonization of testing
methods, including methods implemented by accessibility test tools.
</p>
</body>
</html>

#### Passed Example 2

Open in a new tab

This page has a lang attribute value of en (English), which matches the default language of the page . The default language is English because all but a few words are English.

<html lang= "EN" >
<head>
<title> Gelukkig </title>
</head>
<body>
<p> The Dutch word "gelukkig" has no equivalent in English. </p>
</body>
</html>

#### Passed Example 3

Open in a new tab

This page has lang attribute value of nl (Dutch), which matches the default language of the page . The default language is Dutch because all English words are in a p element with a lang attribute value of en .

<html lang= "nl" >
<head>
<title> Met de kippen op stok </title>
</head>
<body>
<blockquote>
<p> "Hij ging met de kippen op stok" </p>
</blockquote>
<p lang= "en" >
This Dutch phrase literally translates into "He went to roost with the chickens", but it means that he went to bed
early.
</p>
</body>
</html>

#### Passed Example 4

Open in a new tab

This page has a lang attribute value of en (English), which matches the default language of the page . The default language is English because the accessible texts are English, and all other text is in a p element with a lang attribute value of nl .

<html lang= "en" >
<head>
<title> Fireworks over Paris </title>
</head>
<body>
<img src= "/test-assets/shared/fireworks.jpg" alt= "Fireworks over Paris" />
<p lang= "nl" >
Gelukkig nieuwjaar!
</p>
</body>
</html>

### Failed

#### Failed Example 1

Open in a new tab

This page has a lang attribute value of da (Danish), which does not match the default language of the page . The default language is English because all words are English.

<html lang= "da" >
<head>
<title> ACT Rules Format 1.0 - Abstract </title>
</head>
<body>
<p>
The Accessibility Conformance Testing (ACT) Rules Format 1.0 defines a format for writing accessibility test
rules. These test rules can be used for developing automated testing tools and manual testing methodologies. It
provides a common format that allows any party involved in accessibility testing to document and share their
testing procedures in a robust and understandable manner. This enables transparency and harmonization of testing
methods, including methods implemented by accessibility test tools.
</p>
</body>
</html>

#### Failed Example 2

Open in a new tab

This page has a lang attribute value of nl (Dutch), which does not match the default language of the page . The default language is English because all but a few words are English.

<html lang= "nl" >
<head>
<title> Gelukkig </title>
</head>
<body>
<p> The Dutch word "gelukkig" has no equivalent in English. </p>
</body>
</html>

#### Failed Example 3

Open in a new tab

This page has a lang attribute value of en (English), which does not match the default language of the page . The default language is Dutch because all English words are in a p element with a lang attribute value of en .

<html lang= "en" >
<head>
<title> Met de kippen op stok </title>
</head>
<body>
<blockquote>
<p> "Hij ging met de kippen op stok" </p>
</blockquote>
<p lang= "en" >
This Dutch phrase literally translates into "He went to roost with the chickens", but it means that he went to bed
early.
</p>
</body>
</html>

#### Failed Example 4

Open in a new tab

This page has a lang attribute value of nl (Dutch), which does not match the default language of the page . The default language is English because the accessible texts are English, and all other text is in a p element with a lang attribute value of nl .

<html lang= "nl" >
<head>
<title> Fireworks over Paris </title>
</head>
<body>
<img src= "/test-assets/shared/fireworks.jpg" alt= "Fireworks over Paris" />
<p lang= "nl" >
Gelukkig nieuwjaar!
</p>
</body>
</html>

#### Failed Example 5

Open in a new tab

This page has a lang attribute value of nl (Dutch), which does not match the default language of the page . The default language is English because the accessible name of the img element is English. The lang attribute on the p element is effectively ignored.

<html lang= "nl" >
<head>
<title> Paris </title>
</head>
<body>
<img src= "/test-assets/shared/fireworks.jpg" aria-labelledby= "caption" />
<p lang= "en" id= "caption" hidden >
Fireworks over Paris!
</p>
</body>
</html>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

This is an SVG document , not an HTML document.

<svg xmlns="http://www.w3.org/2000/svg" lang="fr"></svg>

#### Inapplicable Example 2

Open in a new tab

This page has an undefined default language because it has no content or document title .

<html></html>

#### Inapplicable Example 3

Open in a new tab

This page has an undefined default language because it has no document title and all its content is wrapped in an element with a lang attribute.

<html>
<p lang= "en" >
The Accessibility Conformance Testing (ACT) Rules Format 1.0 defines a format for writing accessibility test rules.
These test rules can be used for developing automated testing tools and manual testing methodologies. It provides a
common format that allows any party involved in accessibility testing to document and share their testing procedures
in a robust and understandable manner. This enables transparency and harmonization of testing methods, including
methods implemented by accessibility test tools.
</p>
</html>

#### Inapplicable Example 4

Open in a new tab

This page has an undefined default language because it can either be English or French.

<html lang= "fr" >
<head>
<title> Paul put dire comment on tape </title>
</head>
<body>
<p> Paul put dire comment on tape </p>
</body>
</html>

#### Inapplicable Example 5

Open in a new tab

The lang attribute value of this page is an iso 639.2 three letters code, hence has no known primary language tag .

<html lang= "eng" >
<body>
<p lang= "en" > I love ACT rules! </p>
</body>
</html>

#### Inapplicable Example 6

Open in a new tab

The lang attribute value of this page is a grandfathered tag , hence has no known primary language tag .

<html lang= "i-lux" >
<body>
<p lang= "lb" > Lëtzebuerg ass e Land an Europa. </p>
</body>
</html>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
