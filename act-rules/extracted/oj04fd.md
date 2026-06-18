# ACT Rule oj04fd — Element in sequential focus order has visible focus
status: approved
implement: auto,manual,semi-auto
requirements(in-scope): 2.4.7
url: https://www.w3.org/WAI/standards-guidelines/act/rules/oj04fd/proposed/

# 

 Proposed

 Element in sequential focus order has visible focus

 Rule Mapping 

 This is an Atomic rule 
 to test
 2.4.7: Focus Visible (Level AA) 

## Description

 This rule checks that each element in sequential focus order has some visible focus indication.

## Applicability

 The rule applies to any element which is part of sequential focus navigation in an HTML document .

## Expectation

 For each target element, there is at least one device pixel inside the scrolling area of the viewport whose HSL color value is different when the element is focused from when it is not.

## Background

 Default styling in user agents provides a focus indication for focusable elements (even those that are not focusable by default), as shown in Passed Examples 1 and 2. Many examples in this rule need to remove that indicator in order to illustrate various situations. This is bad practice and should normally be avoided.

 WCAG 2.0 and 2.1 do not have any requirement of how big or small focus indicator should be, or how far or near from the focusable element it should be. Thus it is possible to pass this rule and Success Criterion 2.4.7 Focus Visible with barely perceptible changes at the other end of the page. That would however still be an accessibility issue. WCAG 2.2 includes Success Criterion 2.4.11 Focus Appearance and Success Criterion 2.4.12 Focus Not Obscured (Minimum) specifying how big the focus indicator should be. All Passed Examples in this rule satisfy those success criteria.

 WCAG does not require that the focus indicator for each focusable element is unique in appearance. Therefore, this rule can pass even if several focus indicators are identical. Such a situation may nonetheless cause confusion and all examples in this rule avoid it.

### Assumptions

 There are no assumptions.

### Accessibility Support

 There are no accessibility support issues known.

### Other Resources

- Success Criterion 2.4.7 Focus Visible 
 
- Success Criterion 2.4.11 Focus Appearance 
 
- Success Criterion 2.4.12 Focus Not Obscured (Minimum) 
 
- Understanding Success Criterion 2.4.7: Focus Visible 
 
- Understanding Success Criterion 2.4.11: Focus Appearance 
 
- Understanding Success Criterion 2.4.12: Focus Not Obscured (Minimum) 

## Accessibility Requirements Mapping

- 
 2.4.7 Focus Visible (Level AA) 

- Learn more about 2.4.7 Focus Visible 
 
- Required for conformance to WCAG 2.0 and later on level AA and higher. 
 
- Outcome mapping: 
 
- Any failed outcomes: success criterion is not satisfied 
 
- All passed outcomes: success criterion needs further testing 
 
- An inapplicable outcome: success criterion needs further testing 

## Input Aspects

 The following aspects are required in using this rule.

- CSS styling 
 
- DOM tree 

## Examples

 These Javascript and CSS files are used in several examples: 

 File /test-assets/focus-visible-oj04fd/script.js :

 function toggleActivation ( id ) { 
 document . getElementById ( id ). classList . toggle ( ' active ' ) 
 } 

 File /test-assets/focus-visible-oj04fd/styles.css :

 .indicator { 
 display : inline-block ; 
 width : 1em ; 
 height : 1em ; 
 } 

 .solid.active { 
 background-color : navy ; 
 } 

 .border.active { 
 border : medium solid navy ; 
 } 

 .no-focus-default :focus { 
 /* Never do that without defining other focus indication! */ 
 outline : none ; 
 } 

### Passed

#### Passed Example 1

 Open in a new tab 

 The focusable element is part of sequential focus navigation . It has an outline when it is focused (due to default User Agent’s styling). The outline has a different hsl value compared to the hsl value of the background over which the outline appears (the exact values depend on the type of browser being used).

 <a href= "https://act-rules.github.io/" > ACT rules </a> 

#### Passed Example 2

 Open in a new tab 

 The focusable element is part of sequential focus navigation . It has an outline when it is focused (due to default User Agent’s styling). The outline has a different hsl value compared to the hsl value of the background over which the outline appears (the exact values depend on the type of browser being used).

 <span tabindex= "0" > Act rules </span> 

#### Passed Example 3

 Open in a new tab 

 The focusable element is part of sequential focus navigation . Its parent span puts a border around it when it is focused (the border of the span element). The border’s hsl value ( hsl(240, 100%, 25%) ) is different to the hsl value of the background ( hsl(0, 0%, 100%) ) over which the border appears.

 <link rel= "stylesheet" href= "/test-assets/focus-visible-oj04fd/styles.css" /> 
 <script src= "/test-assets/focus-visible-oj04fd/script.js" ></script> 

 <span id= "indicator" class= "border" > 
 <a 
 id= "act" 
 class= "no-focus-default" 
 onfocus= "toggleActivation('indicator')" 
 onblur= "toggleActivation('indicator')" 
 href= "https://act-rules.github.io/" 
 > ACT rules </a 
 > 
 </span> 

#### Passed Example 4

 Open in a new tab 

 Each of these three focusable elements has a blue square in front of it when it is focused . The square’s hsl value ( hsl(240, 100%, 25%) ) is different to the hsl value of the background ( hsl(0, 0%, 100%) ) over which the square appears.

 <link rel= "stylesheet" href= "/test-assets/focus-visible-oj04fd/styles.css" /> 
 <script src= "/test-assets/focus-visible-oj04fd/script.js" ></script> 

 <span id= "indicator-act" class= "indicator solid" ></span> 
 <a 
 id= "act" 
 class= "no-focus-default" 
 onfocus= "toggleActivation('indicator-act'); toggleActivation('indicator-wcag')" 
 onblur= "toggleActivation('indicator-act'); toggleActivation('indicator-wcag')" 
 href= "https://act-rules.github.io/" 
 > ACT rules </a 
 > 
 <span id= "indicator-wcag" class= "indicator solid" ></span> 
 <a 
 id= "wcag" 
 class= "no-focus-default" 
 onfocus= "toggleActivation('indicator-wcag'); toggleActivation('indicator-w3c')" 
 onblur= "toggleActivation('indicator-wcag'); toggleActivation('indicator-w3c')" 
 href= "https://www.w3.org/TR/WCAG22/" 
 > WCAG </a 
 > 
 <span id= "indicator-w3c" class= "indicator solid" ></span> 
 <a 
 id= "w3c" 
 class= "no-focus-default" 
 onfocus= "toggleActivation('indicator-w3c'); toggleActivation('indicator-final')" 
 onblur= "toggleActivation('indicator-w3c'); toggleActivation('indicator-final')" 
 href= "https://www.w3.org/" 
 > WCAG </a 
 > 
 <span id= "indicator-final" class= "indicator solid" ></span> 

### Failed

#### Failed Example 1

 Open in a new tab 

 The focusable element does not have any pixel changing color when it is focused because the default styling has been overwritten by a style that removes the outline.

 <link rel= "stylesheet" href= "/test-assets/focus-visible-oj04fd/styles.css" /> 
 <a class= "no-focus-default" href= "https://act-rules.github.io/" > ACT rules </a> 

### Inapplicable

#### Inapplicable Example 1

 Open in a new tab 

 This document contains no focusable element.

 <span> ACT rules </span> 

#### Inapplicable Example 2

 Open in a new tab 

 None of the focusable elements in this document are part of sequential focus navigation .

 <a tabindex= "-1" href= "https://act-rules.github.io/" > ACT rules </a> 
 <a tabindex= "-1" href= "https://www.w3.org/TR/WCAG22/" > WCAG </a> 

<h2 id="glossary"
[Glossary section omitted for brevity — see raw HTML]