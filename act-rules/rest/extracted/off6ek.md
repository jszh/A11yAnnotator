# ACT Rule off6ek — HTML element language subtag matches language
status: proposed
implement: (not listed on rule page)
requirements: 3.1.2
url: https://www.w3.org/WAI/standards-guidelines/act/rules/off6ek/proposed/

#

Proposed

HTML element language subtag matches language

Rule Mapping

This is an Atomic rule
to test
3.1.2: Language of Parts (Level AA)

## Description

This rule checks that the primary language subtag of an element matches its default language

## Applicability

This rule applies to any HTML element with a lang attribute for which all the following are true:

in body : the element is an inclusive descendant in the flat tree of a body element; and

HTML : the element is in a document with a content type of text/html ; and

Valid language : the element’s lang attribute value has a known primary language tag ; and

Not empty : there is some non-empty text inheriting its programmatic language from the element which is neither empty nor only whitespace .

## Expectation

For each test target, the primary language of its lang attribute value is a most common language of the test target.

## Background

This rule checks that, if a lang attribute is used, its value is correct with respect to the content. This rule does not check whether a lang attribute should have been used or not. Especially, this rule does not check when lang attributes are missing. This must be tested separately and it is therefore possible to pass this rule without satisfying Success Criterion 3.1.2 Language of Parts .

### Assumptions

This rule assumes that user agents and assistive technologies can programmatically determine known primary language tags even on language tags that do not conform to the RFC 5646 syntax.

This rule assumes that only language tags with a known primary language tag are enough to satisfy Success Criterion 3.1.2 Language of Parts ; this notably excludes grandfathered tags and ISO 639.2 three-letters codes, both having poor support in assistive technologies.

This rule assumes that the text nodes contain text that express something in human language and therefore need a correct programmatic language.

### Accessibility Support

There are no accessibility support issues known.

### Related rules

Element with lang Attribute Has Valid Language Tag

### Other Resources

Understanding Success Criterion 3.1.2: Language of Page

H58: Using language attributes to identify changes in the human language

RFC 5646: Tags for Identifying Languages

The lang and xml:lang attributes

In all examples, the html element has itself a lang attribute in order to make sure that the examples satisfy Success Criterion 3.1.1 Language of Page . These html elements are, however, never applicable because they are not descendants of a body element, and the example descriptions do not mention them further.

## Accessibility Requirements Mapping

3.1.2 Language of Parts (Level AA)

Learn more about 3.1.2 Language of Parts

Required for conformance to WCAG 2.0 and later on level AA and higher.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion is satisfied

An inapplicable outcome: success criterion needs further testing

H58: Using language attributes to identify changes in the human language

Learn more about technique H58

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

This span element has a lang attribute value of nl (Dutch), which matches its most common language . The most common language is Dutch because all words are Dutch.

<html lang= "en" >
<head>
<title> Dutch idioms </title>
</head>
<body>
<p>
The Dutch phrase <span lang= "nl" > "Hij ging met de kippen op stok" </span> literally translates into "He went to
roost with the chickens", but it means that he went to bed early.
</p>
</body>
</html>

#### Passed Example 2

Open in a new tab

The second p element has lang attribute value of nl (Dutch), which matches its most common language . The most common language is Dutch because all English words are in span elements with a lang attribute value of en . Both span elements also have a lang attribute matching their most common language.

<html lang= "en" >
<head>
<title> Dutch idioms </title>
</head>
<body>
<p> Dutch idioms and their English meaning. </p>
<p lang= "nl" >
<span lang= "en" > The Dutch phrase </span> "Hij ging met de kippen op stok"
<span lang= "en"
> literally translates into "He went to roost with the chickens", but it means that he went to bed early. </span
>
</p>
</body>
</html>

#### Passed Example 3

Open in a new tab

This div element has a lang attribute value of en (English), which matches its most common language . The most common language is English because the accessible texts are English, and all other text is in a p element with a (correct) lang attribute value of fr .

<html lang= "FR" >
<head>
<title> Feu d'artifice du nouvel an </title>
</head>
<body>
<div lang= "EN" >
<img src= "/test-assets/shared/fireworks.jpg" alt= "Fireworks over Paris" />
<p lang= "FR" >
Bonne année !
</p>
</div>
</body>
</html>

#### Passed Example 4

Open in a new tab

This span element has a lang attribute value of fr (French), which matches one of its most common languages . The most common languages are both English and French because all the words belong to both languages.

<html lang= "en" >
<p>
Even though all its words are English and it has meaning in English, the sentence
<span lang= "fr" > Paul put dire comment on tape </span> is also a French sentence.
</p>
</html>

#### Passed Example 5

Open in a new tab

This span element has a lang attribute value of en (English), which matches one of its most common languages . The most common languages are both English and French because all the words belong to both languages.

<html lang= "fr" >
<p>
Bien que tous les ses mots soient français et qu'elle ait un sens en français, la phrase
<span lang= "en" > Paul put dire comment on tape </span> est aussi une phrase anglaise.
</p>
</html>

### Failed

#### Failed Example 1

Open in a new tab

This span element has lang attribute value of fr (French), which does not match its most common language . The most common language is Dutch because all words are Dutch.

<html lang= "en" >
<head>
<title> Dutch idioms </title>
</head>
<body>
<p>
The Dutch phrase <span lang= "fr" > "Hij ging met de kippen op stok" </span> literally translates into "He went to
roost with the chickens", but it means that he went to bed early.
</p>
</body>
</html>

#### Failed Example 2

Open in a new tab

The second p element has lang attribute value of en (English), which does not match its most common language . The most common language is Dutch because all English words are in span elements with a lang attribute value of fr . Both span elements also have an incorrect lang attribute in order to make sure that all targets in this example fail the rule.

<html lang= "nl" >
<head>
<title> Met de kippen op stok </title>
</head>
<body>
<blockquote>
<p> "Hij ging met de kippen op stok" </p>
</blockquote>
<p lang= "en" >
<span lang= "fr" > The Dutch phrase </span> "Hij ging met de kippen op stok"
<span lang= "fr"
> literally translates into "He went to roost with the chickens", but it means that he went to bed early. </span
>
</p>
</body>
</html>

#### Failed Example 3

Open in a new tab

This div element has a lang attribute value of fr (French), which does not match its most common language . The most common language is English because the accessible texts are English, and all other text is in a p element with a lang attribute value of nl , which also doesn’t match its common language.

<html lang= "fr" >
<head>
<title> Feu d'artifice du nouvel an </title>
</head>
<body>
<div lang= "fr" >
<img src= "/test-assets/shared/fireworks.jpg" alt= "Fireworks over Paris" />
<p lang= "nl" >
Bonne année !
</p>
</div>
</body>
</html>

#### Failed Example 4

Open in a new tab

This div element has a lang attribute value of fr (French), which does not match its most common language . The most common language is English because the accessible name of the img element is English. The lang attribute on the p element is effectively ignored. The p element is not applicable because there is no text inheriting its programmatic language from it since its content is neither visible nor included in the accessibility tree .

<html lang= "fr" >
<head>
<title> Feu d'artifice du nouvel an </title>
</head>
<body>
<div lang= "fr" >
<img src= "/test-assets/shared/fireworks.jpg" aria-labelledby= "caption" />
<p lang= "en" id= "caption" hidden >
Fireworks over Paris
</p>
</div>
</body>
</html>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

This document is not HTML .

<svg xmlns="http://www.w3.org/2000/svg" lang="en">
<text x="0" y="0">I love ACT rules!</text>
</svg>

#### Inapplicable Example 2

Open in a new tab

There is no descendant of a body element with a lang attribute.

<html lang= "en" >
<body>
<p> I love ACT rules! </p>
</body>
</html>

#### Inapplicable Example 3

Open in a new tab

The first p element is empty because the only element inheriting its programmatic language is itself, and it has no text node child.

<html lang= "en" >
<body>
<p lang= "fr" ></p>
<p> I love ACT rules! </p>
</body>
</html>

#### Inapplicable Example 4

Open in a new tab

This p element is empty because it has no content that is either visible or included in the accessibility tree .

<html lang= "en" >
<body>
<p lang= "fr" hidden > I love ACT rules! </p>
</body>
</html>

#### Inapplicable Example 5

Open in a new tab

The text inheriting its programmatic language from this div element is only whitespace .

<html lang= "en" >
<body>
<div lang= "invalid" > &nbsp; </div>
</body>
</html>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
