# ACT Rule ye5d6e — Document has an instrument to move focus to non-repeated content
status: proposed
implement: (not listed on rule page)
requirements: 2.4.1
url: https://www.w3.org/WAI/standards-guidelines/act/rules/ye5d6e/proposed/

#

Proposed

Document has an instrument to move focus to non-repeated content

Rule Mapping

This is an Atomic rule

## Description

This rule checks that there is an instrument to move focus to non-repeated content in the page

## Applicability

This rule applies to any HTML web page .

## Expectation

For each test target, there exists at least one instrument inside it to move focus just before a node of non-repeated content after repeated content .

## Background

The intention of this rule is that focus is moved to the main area of content of a document. However, defining the main area of content in a non-ambiguous way is not really doable. Therefore, the rule takes a more lenient position and only requires to move focus to some non-repeated content. Additional conditions on this destination were considered and rejected when writing the rule since it might be acceptable, for example, to skip the first heading of the main area of content if it has the exact same content as the title element of the document. Therefore, it is possible to pass this rule but still fail the related techniques and violate Success Criterion 2.4.1 Bypass blocks .

While it is clear that a “skip link” is a valid way to satisfy Success Criterion 2.4.1 Bypass blocks , it is less clear how “deep” in the page such a skip link could be. Notably, Technique G124: Adding links at the top of the page to each area of the content is listing valid cases where it could be fairly “deep” if the page has many areas of the content. Rather than trying to fix an arbitrary value (e.g. “the skip link must be among the first 5 focusable elements”), or trying to figure out some condition on what precedes it, this rule only checks its existence. It is clear that if no “skip link” is provided, then another way to bypass blocks of repeated content must be found. However, it is possible to pass this rule without satisfying Success Criterion 2.4.1 Bypass blocks if the skip link is too far away from the start of the page.

### Assumptions

This rule assumes that there is at least one block of repeated content before the non-repeated content, and therefore Technique G123: Adding a link at the beginning of a block of repeated content to go to the end of the block will require a link to the non-repeated content in order to skip this block of repeated content . If there is no block of repeated content before the non-repeated content, then it is possible to fail this rule but still pass Technique G123: Adding a link at the beginning of a block of repeated content to go to the end of the block .

### Accessibility Support

There are no accessibility support issues known.

### Other Resources

Technique G1: Adding a link at the top of each page that goes directly to the main content area

Technique G123: Adding a link at the beginning of a block of repeated content to go to the end of the block

Technique G124: Adding links at the top of the page to each area of the content

## Accessibility Requirements Mapping

G1: Adding a link at the top of each page that goes directly to the main content area

Learn more about technique G1

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

G123: Adding a link at the beginning of a block of repeated content to go to the end of the block

Learn more about technique G123

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

G124: Adding links at the top of the page to each area of the content

Learn more about technique G124

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

## Input Aspects

The following aspects are required in using this rule.

Accessibility Tree

CSS styling

DOM Tree

Language

## Examples

These HTML, Javascript, and CSS files are used in several examples:

File /test-assets/bypass-blocks-cf77f2/chapter2.html :

<html>
<head>
<title> The Three Kingdoms, Chapter 2 </title>
</head>
<body>
<nav id= "chapters-navigation" >
<h1> Content </h1>
<ol>
<li><a href= "/test-assets/bypass-blocks-cf77f2/chapter1.html" > Chapter 1 </a></li>
<li><a> Chapter 2 </a></li>
</ol>
</nav>

<aside id= "bio-translator" >
<h1> About the translator </h1>
<p> Yu Sumei is a professor of English at East China Normal University. </p>
</aside>
<aside id= "about-book" >
<h1> About the book </h1>
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<main>
<h1> Zhang Fei Trashes the Inspector in Wrath </h1>
<p>
Now this Dong Zhuo, also known as Dong Zhong-ying, was from Lintao in northwest China.
</p>
</main>
</body>
</html>

File /test-assets/bypass-blocks-cf77f2/click-on-enter.js :

function ClickOnEnter (... ids ) {
ids . forEach ( id => {
const link = document . getElementById ( id )

link . addEventListener ( ' keyup ' , function ( event ) {
if ( event . key === ' Enter ' ) {
event . preventDefault ()
link . click ()
}
})
})
}

File /test-assets/bypass-blocks-cf77f2/styles.css :

.off-screen {
position : absolute ;
top : -999px ;
}

.visible-on-focus {
position : absolute ;
top : -100px ;
}
.visible-on-focus :focus-within {
position : relative ;
top : 0px ;
}

### Passed

#### Passed Example 1

Open in a new tab

In this document , the first a element is an instrument to navigate , and thus move the focus, to the non-repeated content. This example passes Technique G1: Adding a link at the top of each page that goes directly to the main content area .

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<a href= "#main" > Skip to main content </a>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
</div>
</body>
</html>

#### Passed Example 2

Open in a new tab

In this document , the third a element is an instrument to move the focus to the non-repeated content. This example passes Technique G124: Adding links at the top of the page to each area of the content .

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<nav id= "local-navigation" >
<a href= "#bio-translator" > Skip to translator's biography </a>
<a href= "#about-book" > Skip to information about the book </a>
<a href= "#main" > Skip to main content </a>
</nav>

<aside id= "bio-translator" >
<p> Yu Sumei is a professor of English at East China Normal University. </p>
</aside>
<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>
</div>
</body>
</html>

#### Passed Example 3

Open in a new tab

In this document , the second a element (inside the second aside element) is an instrument to move the focus to the non-repeated content. This example passes Technique G123: Adding a link at the beginning of a block of repeated content to go to the end of the block .

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<aside id= "bio-translator" >
<a href= "#about-book" > Skip to information about the book </a>
<p> Yu Sumei is a professor of English at East China Normal University. </p>
</aside>
<aside id= "about-book" >
<a href= "#main" > Skip to main content </a>
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>
</div>
</body>
</html>

#### Passed Example 4

Open in a new tab

In this document , the first a element is an instrument to move the focus to the non-repeated content. In this case, the element is normally hidden but is visible when focused .

<html lang= "en" >
<head>
<link rel= "stylesheet" href= "/test-assets/bypass-blocks-cf77f2/styles.css" />
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<nav class= "visible-on-focus" >
<a href= "#main" > Skip to main content </a>
</nav>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>
</div>
</body>
</html>

#### Passed Example 5

Open in a new tab

In this document , the first div element is an instrument to move the focus to the non-repeated content.

<html lang= "en" >
<head>
<script src= "/test-assets/bypass-blocks-cf77f2/click-on-enter.js" ></script>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body onload= "ClickOnEnter('skip-link')" >
<div role= "link" onclick= "location.assign('#main');" tabindex= "0" id= "skip-link" > Skip to main content </div>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>
</div>
</body>
</html>

#### Passed Example 6

Open in a new tab

In this document , the first a element is an instrument to move the focus to the non-repeated content.

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<a href= "#main" aria-label= "Skip to main content" > 📖 </a>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>
</div>
</body>
</html>

#### Passed Example 7

Open in a new tab

In this document , the first a element is an instrument to move the focus to the non-repeated content. Even though its target is inside a block of repeated content , it is still just before some non-repeated content after repeated content because there is no perceivable content between the link target and the non-repeated content. Thus, following the link does skip all the repeated content.

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<a href= "#just-before-main" > Skip to main content </a>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
<span id= "just-before-main" ></span>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>
</div>
</body>
</html>

#### Passed Example 8

Open in a new tab

In this document , the first a element is an instrument to move the focus to the non-repeated content. Even though its target is not the first element after it, it is still just before the first non-repeated content after repeated content . Thus, following the link does not skip any non-repeated content.

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<a href= "#just-before-main" > Skip to main content </a>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<hr />
<span id= "just-before-main" ></span>
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>
</div>
</body>
</html>

### Failed

#### Failed Example 1

Open in a new tab

This document has no instrument to skip to the non-repeated content.

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
</div>
</body>
</html>

#### Failed Example 2

Open in a new tab

In this document , the link to skip to the non-repeated content does not reference a valid id attribute and thus when activated will not move focus to the non-repeated content.

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<a href= "#invalid-id" > Skip to main content </a>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>

<aside id= "about-book" >
<p> The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
</div>
</body>
</html>

#### Failed Example 3

Open in a new tab

In this document , the skip link does not move focus just before some non-repeated content after repeated content . The focus is moved on perceivable content which is inside the block of repeated content . Thus, following the link does not skip all the repeated content.

<html lang= "en" >
<head>
<title> The Three Kingdoms, Chapter 1 </title>
</head>
<body>
<a href= "#before-main" > Skip to main content </a>
<a href= "/test-assets/bypass-blocks-cf77f2/chapter2.html" > Read Chapter 2 </a>

<aside id= "about-book" >
<p id= "before-main" > The Romance of the Three Kingdoms is a 14th century historical novel. </p>
</aside>

<div id= "main" >
<p>
Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
of time.
</p>
</div>
</body>
</html>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

This document is not an HTML web page .

<svg xmlns="http://www.w3.org/2000/svg">
<title>This is an SVG</title>
</svg>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
