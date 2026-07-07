# ACT Rule aizyf1 — Link is descriptive
status: proposed
implement: (not listed on rule page)
requirements: 2.4.9
url: https://www.w3.org/WAI/standards-guidelines/act/rules/aizyf1/proposed/

#

Proposed

Link is descriptive

Rule Mapping

This is an Atomic rule
to test
2.4.9: Link Purpose (Link Only) (Level AAA)

## Description

This rule checks that the accessible name of a link describes its purpose.

## Applicability

This rule applies to any inheriting semantic link for which all the following is true:

the link is included in the accessibility tree ; and

the link has a non-empty ( "" ) accessible name .

## Expectation

Each test target has an accessible name which describes its purpose.

## Background

### Assumptions

This rule assumes that the purpose of the link is not ambiguous to users in general when seen in context on the web page, which is the exception mentioned in Success Criterion 2.4.9 Link Purpose (Link Only) . If the link is ambiguous to users in general, users of assistive technologies are not at a disadvantage when viewing the link out of context.

This rule assumes that all semantic link elements are used as links. An element marked up as a link, but that does not behave as a link would not fail Success Criterion 2.4.9 Link Purpose (Link Only) .

### Accessibility Support

Implementation of Presentational Roles Conflict Resolution varies from one browser or assistive technology to another. Depending on this, some semantic link elements can fail this rule with some technology but users of other technologies would not experience any accessibility issue.

### Related rules

Link has non-empty accessible name

### Other Resources

Understanding Success Criterion 2.4.9: Link Purpose (Link Only)

G91: Providing link text that describes the purpose of a link

H30: Providing link text that describes the purpose of a link for anchor elements

H24: Providing text alternatives for the area elements of image maps

ARIA7: Using aria-labelledby for link purpose

ARIA8: Using aria-label for link purpose

## Accessibility Requirements Mapping

2.4.9 Link Purpose (Link Only) (Level AAA)

Learn more about 2.4.9 Link Purpose (Link Only)

Required for conformance to WCAG 2.0 and later on level AAA.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion needs further testing

An inapplicable outcome: success criterion needs further testing

## Input Aspects

The following aspects are required in using this rule.

Accessibility Tree

DOM Tree

CSS Styling

Language

## Examples

### Passed

#### Passed Example 1

Open in a new tab

This a element has an accessible name from its text that describes its purpose.

<a href= "#desc" > See the description of this product. </a>

<p id= "desc" > This product consists of several web pages. </p>

#### Passed Example 2

Open in a new tab

This a element has an accessible name from the alt attribute on its img element that describes its purpose.

<a href= "#main" ><img src= "/test-assets/5effbb/main.png" alt= "Go to the main content" /></a>

<main>
<p id= "main" > This is the main content. </p>
</main>

#### Passed Example 3

Open in a new tab

This span element has an explicit role of link and an accessible name from its text that describes its purpose.

<span role= "link" tabindex= "0" onclick= "document.location+='#desc'" > See description of the product. </span>

<p id= "desc" > This product consists of several web pages. </p>

#### Passed Example 4

Open in a new tab

This a element has an accessible name from its aria-labelledby attribute that describes its purpose.

<p id= "instructions" > Go to the main content. </p>
<svg xmlns= "http://www.w3.org/2000/svg" x= "0" y= "0" >
<a href= "#main" aria-labelledby= "instructions" >
<path
style= "fill:#1E201D;"
d= "M21.205,5.007c-0.429-0.444-1.143-0.444-1.587,0c-0.429,0.429-0.429,1.143,0,1.571l8.047,8.047H1.111
C0.492,14.626,0,15.118,0,15.737c0,0.619,0.492,1.127,1.111,1.127h26.554l-8.047,8.032c-0.429,0.444-0.429,1.159,0,1.587
c0.444,0.444,1.159,0.444,1.587,0l9.952-9.952c0.444-0.429,0.444-1.143,0-1.571L21.205,5.007z"
/>
</a>
</svg>

<main>
<p id= "main" > This is the main content. </p>
</main>

### Failed

#### Failed Example 1

Open in a new tab

This link has an accessible name which does not describe its purpose.

<a href= "#desc" > More </a>

<p id= "desc" > This product consists of several web pages. </p>

#### Failed Example 2

Open in a new tab

This link has an accessible name which does not describe its purpose.

<div role= "link" tabindex= "0" onclick= "document.location+='#main'" > More </div>

<main>
<p id= "main" > This is the main content. </p>
</main>

#### Failed Example 3

Open in a new tab

This link has an accessible name which does not describe its purpose.

<svg xmlns= "http://www.w3.org/2000/svg" x= "0" y= "0" >
<a href= "#main" >
<text x= "20" y= "20" >
Go
</text>
</a>
</svg>

<main>
<p id= "main" > This is the main content. </p>
</main>

#### Failed Example 4

Open in a new tab

This link has an accessible name which, alone, does not describe its purpose.

<p> See the description of <a href= "#desc" > this product </a> . </p>

<p id= "desc" > This product consists of several web pages. </p>

#### Failed Example 5

Open in a new tab

These links have accessible names which, alone, do not describe their purpose.

<ul>
<li>
Ulysses
<ul>
<li><a href= "https://www.gutenberg.org/files/4300/4300-h/4300-h.htm" > HTML </a></li>
<li>
<a href= "https://www.gutenberg.org/ebooks/4300.epub.images?session_id=04cd710372888de8d8d322215cdfe8ce5b0f8d73" >
EPUB
</a>
</li>
<li><a href= "https://www.gutenberg.org/files/4300/4300-0.txt" > Plain text </a></li>
</ul>
</li>
</ul>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

There is no inheriting semantic link in this document.

<a href= "https://www.w3.org/WAI" role= "button" > Web Accessibility Initiative (WAI) </a>

#### Inapplicable Example 2

Open in a new tab

This link is not included in the accessibility tree .

<a href= "https://www.w3.org/WAI" style= "display: none;"
><img src= "/test-assets/5effbb/cart.svg" alt= "Checkout" /> Checkout </a
>

#### Inapplicable Example 3

Open in a new tab

There is no inheriting semantic link in this document ( a element without an href attribute do not have a role of link ).

<a> placeholder </a>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
