# ACT Rule b33eff — Orientation of the page is not restricted using CSS transforms
status: approved
implement: (not listed on rule page)
requirements: 1.3.4
url: https://www.w3.org/WAI/standards-guidelines/act/rules/b33eff/proposed/

#

Proposed

Orientation of the page is not restricted using CSS transforms

Rule Mapping

This is an Atomic rule
to test
1.3.4: Orientation (Level AA)

## Description

This rule checks that page content is not restricted to either landscape or portrait orientation using CSS transforms.

## Applicability

This rule applies to any HTML element that is visible and has one of the following CSS properties applied conditionally on the orientation media feature with a value of landscape or portrait :

the CSS rotate property; or

the CSS transform property with any of the below transformation functions :

rotate

rotate3d

rotateZ

matrix

matrix3d

Note: These specific transformation functions are of interest to this rule as they have the potential to affect the rotation of a given element.

Note: The rotate property and the rotate3d , rotateZ and matrix3d transform functions are currently part of a W3C Working Draft and widely implemented in browsers.

## Expectation

The target element is neither rotated clockwise nor counter clockwise around the Z-axis at an angle corresponding to 90 degrees relative from the position of the element in landscape orientation to the position of the element in portrait orientation, and vice versa.

Note: Imagine the display of a smartphone with cartoon figure at its center. With this example, if a user turns the smartphone a quarter turn, that is a partial move from one orientation to the other, the user would expect that the cartoon figure continues to remain facing upwards. The smartphone accomplishes this by rotating the contents of its display a quarter turn to counter the users change in orientation. In effect, the cartoon figure has remained in place and its rotation relative from one orientation to the other is 0 degrees. Now imagine that a developer facilitated this rotation of the cartoon figure by a quarter turn only when the smartphone starts from one orientation and not the other; its rotation relative from one orientation to the other would then be 90 degrees and it would appear stuck, or locked, as the user moves between orientations. What the developer has done is effectively counter the smartphone’s attempt at countering the user’s change in orientation.

## Background

### Assumptions

This rule does not consider and may produce incorrect results for:

Elements for which a particular display orientation is essential .

The existence of any control on the page that can change the orientation on demand.

Scripts are not used to adjust the CSS orientation lock.

### Accessibility Support

There are no accessibility support issues known.

### Other Resources

Understanding Success Criterion 1.3.4: Orientation

CSS Transforms Module Level 1

CSS Transforms Module Level 2

CSS3 Media Queries

Managing screen orientation

Orientation

The Transform Rendering Model

## Accessibility Requirements Mapping

1.3.4 Orientation (Level AA)

Learn more about 1.3.4 Orientation

Required for conformance to WCAG 2.1 and later on level AA and higher.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion needs further testing

An inapplicable outcome: success criterion needs further testing

## Input Aspects

The following aspects are required in using this rule.

DOM Tree

CSS Styling

## Examples

### Passed

#### Passed Example 1

Open in a new tab

A page where CSS transform property has rotateZ transform function conditionally applied on the orientation media feature which does not restrict the element to either portrait or landscape orientation.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : portrait ) {
html {
transform : rotateZ ( 1turn );
}
}
</style>
</head>
<body>
<main>
Page Content
</main>
</body>
</html>

#### Passed Example 2

Open in a new tab

A page where CSS transform property has matrix transform function conditionally applied on the orientation media feature which does not restrict the element to either portrait or landscape orientation.

Note: The extremely small number in the transform function below is included to ensure testing methodologies correctly interpret the impacts of the transformation and are not simply looking for 0.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : portrait ) {
html {
transform : matrix ( 1 , -1.22465 e-15 , 1.22465 e-15 , 1 , 0 , 0 );
}
}
</style>
</head>
<body>
<main>
Page Content
</main>
</body>
</html>

#### Passed Example 3

Open in a new tab

A page where the CSS rotate property has a 0 degree rotation conditionally applied on the orientation media feature which does not restrict the element to either portrait or landscape orientation.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : portrait ) {
html {
rotate : 0turn ;
}
}
</style>
</head>
<body>
<main>
Page Content
</main>
</body>
</html>

### Failed

#### Failed Example 1

Open in a new tab

A page where CSS transform property has rotate transform function conditionally applied on the orientation media feature which restricts the element to landscape orientation.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : portrait ) {
html {
transform : rotate ( 1.5708rad );
width : min ( 100vw , 100vh );
height : min ( 100vw , 100vh );
}
}
</style>
</head>
<body>
Page Content
</body>
</html>

#### Failed Example 2

Open in a new tab

A page where CSS transform property has matrix3d transform function conditionally applied on the orientation media feature which restricts the element to portrait orientation.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : landscape ) {
body {
transform : matrix3d ( 0 , -1 , 0 , 0 , 1 , 0 , 0 , 0 , 0 , 0 , 1 , 0 , 0 , 0 , 0 , 1 );
}
}
</style>
</head>
<body>
Page Content
</body>
</html>

#### Failed Example 3

Open in a new tab

This page appears rotated at a slight angle of 2.5 degrees for stylistic purposes, but is locked in portrait orientation by applying a 92.5 degree rotation when in landscape orientation:

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
body {
transform : rotate ( 2.5deg );
padding : 2rem ;
width : min ( 100vw , 100vh );
height : min ( 100vw , 100vh );
}

@media ( orientation : landscape ) {
body {
transform : rotate ( 92.5deg );
position : absolute ;
right : 0px ;
}
}
</style>
</head>
<body>
Page Content
</body>
</html>

#### Failed Example 4

Open in a new tab

A page where the CSS rotate property has a 90 degree rotation conditionally applied on the orientation media feature which restricts the element to landscape orientation.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : portrait ) {
html {
rotate : 90deg ;
width : min ( 100vw , 100vh );
height : min ( 100vw , 100vh );
}
}
</style>
</head>
<body>
Page Content
</body>
</html>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

A page where there are no CSS styles.

<html lang= "en" >
<head>
<title> Page with some content </title>
</head>
<body>
I am a page with no styles
</body>
</html>

#### Inapplicable Example 2

Open in a new tab

A page that has no CSS transform property specified.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
html {
font-size : 22px ;
}
@media ( min-width : 30em ) {
font-size : 100% ;
}
</style>
</head>
<body>
Page Content
</body>
</html>

#### Inapplicable Example 3

Open in a new tab

A page where CSS transform property is applied to an element that is not visible .

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : landscape ) {
body {
transform : rotateZ ( 0 , 0 , 1 , 270deg );
}
}
</style>
</head>
<body style= "display:none;" >
<main>
Page Content
</main>
</body>
</html>

#### Inapplicable Example 4

Open in a new tab

A page where CSS transform property is not applied conditionally on the orientation media feature .

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
body {
transform : rotate ( 90deg );
width : calc ( min ( 100vw , 100vh ) - 2rem );
height : calc ( min ( 100vw , 100vh ) - 2rem );
padding : 1rem ;
}
</style>
</head>
<body>
<main>
Page Content
</main>
</body>
</html>

#### Inapplicable Example 5

Open in a new tab

A page where CSS transform property is conditionally applied on the orientation media feature , but does not have any of the applicable transformation functions which restricts the element to either landscape or portrait orientation.

<html lang= "en" >
<head>
<title> Page with some content </title>
<style>
@media ( orientation : portrait ) {
body {
transform : translateX ( 100px );
}
}
</style>
</head>
<body>
<main>
Page Content
</main>
</body>
</html>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
