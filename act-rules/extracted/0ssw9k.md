# ACT Rule 0ssw9k — Scrollable content can be reached with sequential focus navigation
status: approved
implement: auto,semi-auto
requirements(in-scope): 2.1.1
url: https://www.w3.org/WAI/standards-guidelines/act/rules/0ssw9k/proposed/

# 

 Proposed

 Scrollable content can be reached with sequential focus navigation

 Rule Mapping 

 This is an Atomic rule 
 to test
 2.1.1: Keyboard (Level A) , 
 2.1.3: Keyboard (No Exception) (Level AAA) 

## Description

 This rule checks that scrollable elements or their descendants can be reached with sequential focus navigation so that they can be scrolled by keyboard

## Applicability

 This rule applies to any HTML element that has visible children in the flat tree , and for which at least one of the following is true:

- the element has a horizontal scroll distance greater than the computed left or right padding of the element; or 
 
- the element has a vertical scroll distance greater than the computed top or bottom padding of the element. 

## Expectation

 For each target element, at least one of the following is true:

- the element is included in sequential focus navigation ; or 
 
- the element has a descendant in the flat tree that is included in sequential focus navigation ; or 
 
- the element is inert . 

## Background

 To ensure there is some element from which arrow keys can be used to control the scroll position, focus must be on or in a scrollable region. If scripts are used to prevent the keyboard events from reaching the scrollable region, this could still cause a keyboard accessibility issue. This must be tested separately.

 This rule only applies to elements who scroll content in the same document. Elements such as iframes that embed other documents may also be scrollable, but for them it is the embedded document that scrolls, not the content in the same document. Such scenarios are tested separately with rules such as Iframe with negative tabindex has no interactive elements .

### Assumptions

 This rule assumes that all scrollable elements with visible content need to be keyboard accessible. Scrollable elements that do not need to be keyboard accessible, perhaps because their content is purely decorative , the scroll area is whitespace, or because scroll can be controlled in some other keyboard accessible way such as through a button or custom scrollbar, may fail this rule but still satisfy success criterion 2.1.1 Keyboard .

### Accessibility Support

 Some browsers will automatically make any scrollable element focusable to ensure keyboard accessibility. However, the browser does not include these elements in sequential focus navigation when it has a negative number as a tabindex attribute value .

 Some browsers restrict scrolling to the content box of elements; while others allow to scroll the full border box , hence including the element’s padding. This results in some elements being scrollable with a browser but not with another.

### Other Resources

- Understanding Success Criterion 2.1.1: Keyboard 
 
- G202: Ensuring keyboard control for all functionality 

## Accessibility Requirements Mapping

- 
 2.1.1 Keyboard (Level A) 

- Learn more about 2.1.1 Keyboard 
 
- Required for conformance to WCAG 2.0 and later on level A and higher. 
 
- Outcome mapping: 
 
- Any failed outcomes: success criterion is not satisfied 
 
- All passed outcomes: success criterion needs further testing 
 
- An inapplicable outcome: success criterion needs further testing 

- 
 2.1.3 Keyboard (No Exception) (Level AAA) 

- Learn more about 2.1.3 Keyboard (No Exception) 
 
- Required for conformance to WCAG 2.0 and later on level AAA. 
 
- Outcome mapping: 
 
- Any failed outcomes: success criterion is not satisfied 
 
- All passed outcomes: success criterion needs further testing 
 
- An inapplicable outcome: success criterion needs further testing 

- 
 G202: Ensuring keyboard control for all functionality 

- Learn more about technique G202 
 
- Not required for conformance to any W3C accessibility recommendation. 
 
- Outcome mapping: 
 
- Any failed outcomes: technique is not satisfied 
 
- All passed outcomes: technique needs further testing 
 
- An inapplicable outcome: technique needs further testing 

## Input Aspects

 The following aspects are required in using this rule.

- DOM Tree 
 
- CSS Styling 

## Examples

### Passed

#### Passed Example 1

 Open in a new tab 

 This scrollable section element is included in sequential focus navigation because it has a tabindex attribute set to 0 .

 <section style= "height: 100px; width: 500px; overflow: scroll;" tabindex= "0" > 
 <h1> WCAG 2.1 Abstract </h1> 
 <p> 
 Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
 accessible. Following these guidelines will make content more accessible to a wider range of people with
 disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
 speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
 and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
 address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
 will also often make Web content more usable to users in general.
 </p> 
 </section> 

#### Passed Example 2

 Open in a new tab 

 This scrollable section element contains a link that is included in sequential focus navigation .

 <section style= "height: 100px; width: 500px; overflow: scroll;" > 
 <h1> 
 <a href= "https://www.w3.org/TR/WCAG22/#abstract" > 
 WCAG 2.1 Abstract
 </a> 
 </h1> 
 <p> 
 Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
 accessible. Following these guidelines will make content more accessible to a wider range of people with
 disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
 speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
 and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
 address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
 will also often make Web content more usable to users in general.
 </p> 
 </section> 

#### Passed Example 3

 Open in a new tab 

 This scrollable section element is inert because of the modal dialog, so neither the section nor its descendant elements are included in sequential focus navigation .

 <style> 
 dialog :-internal-dialog-in-top-layer::backdrop { 
 background : rgba ( 1 , 1 , 1 , 0.8 ); 
 } 
 </style> 
 <section style= "height: 100px; width: 500px; overflow: scroll;" tabindex= "0" > 
 <h1> WCAG 2.1 Abstract </h1> 
 <p> 
 Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
 accessible. Following these guidelines will make content more accessible to a wider range of people with
 disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
 speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
 and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
 address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
 will also often make Web content more usable to users in general.
 <button id= "ppButton" onclick= "openDialog()" > Read more about WCAG 2.2 </button> 
 </p> 
 </section> 
 <dialog id= "ppDialog" aria-labelledby= "dialogLabel" > 
 <h2 id= "dialogLabel" > WCAG 2.2 </h2> 
 <p> 
 <a href= "https://www.w3.org/TR/WCAG22/" > WCAG 2.2 </a> 
 </p> 
 <button id= "cancel" onclick= "ppDialog.close()" > Cancel </button> 
 </dialog> 
 <script> 
 const openDialog = () => { 
 ppDialog . showModal (); 
 myFrame . tabIndex = ' -1 ' 
 } 
 ppDialog . addEventListener ( ' close ' , () => myFrame . tabIndex = 0 ) 
 window . addEventListener ( ' DOMContentLoaded ' , openDialog ); 
 </script> 

### Failed

#### Failed Example 1

 Open in a new tab 

 This vertically scrollable section element is not included in sequential focus navigation , nor does it have any descendants that are.

 <section style= "height: 100px; width: 500px; overflow-y: scroll" > 
 <h1> WCAG 2.1 Abstract </h1> 
 <p> 
 Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
 accessible. Following these guidelines will make content more accessible to a wider range of people with
 disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
 speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
 and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
 address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
 will also often make Web content more usable to users in general.
 </p> 
 </section> 

#### Failed Example 2

 Open in a new tab 

 This horizontally scrollable section element is not included in sequential focus navigation , nor does it have any descendants that are.

 <style> 
 section { 
 height : 100px ; 
 width : 400px ; 
 overflow-y : auto ; 
 white-space : nowrap ; 
 } 
 section > img { 
 display : inline-block ; 
 width : 80px ; 
 } 
 </style> 
 <h1> Our sponsors: </h1> 
 <section> 
 <img src= "/test-assets/shared/w3c-logo.png" alt= "W3C" /> 
 <img src= "/test-assets/shared/eu-logo.svg" alt= "EU" /> 
 <img src= "/test-assets/shared/w3c-logo.png" alt= "W3C" /> 
 <img src= "/test-assets/shared/eu-logo.svg" alt= "EU" /> 
 <img src= "/test-assets/shared/w3c-logo.png" alt= "W3C" /> 
 <img src= "/test-assets/shared/eu-logo.svg" alt= "EU" /> 
 <img src= "/test-assets/shared/w3c-logo.png" alt= "W3C" /> 
 </section> 

### Inapplicable

#### Inapplicable Example 1

 Open in a new tab 

 This section element has a computed overflow of visible . Because of this its scroll distance will be 0, regardless of the element’s content.

 <section style= "height: 95px; width: 500px;" > 
 <h1> WCAG 2.1 Abstract </h1> 
 <p> 
 Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
 accessible. Following these guidelines will make content more accessible to a wider range of people with
 disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
 speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
 and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
 address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
 will also often make Web content more usable to users in general.
 </p> 
 </section> 

#### Inapplicable Example 2

 Open in a new tab 

 This section element has a scroll distance of 0 in both directions.

 <section style= "height: 95px; width: 500px; overflow: auto;" > 
 <p> 
 <a href= "https://www.w3.org/TR/WCAG22/#abstract" > 
 WCAG 2.1 Abstract
 </a> 
 </p> 
 </section> 

#### Inapplicable Example 3

 Open in a new tab 

 This section element is not scrollable because it has a computed overflow of hidden .

 <h1> 
 <a href= "https://www.w3.org/TR/WCAG22/#abstract" > 
 WCAG 2.1 Abstract
 </a> 
 </h1> 
 <section style= "height: 95px; width: 500px; overflow: hidden;" > 
 <p> 
 Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
 accessible. Following these guidelines will make content more accessible to a wider range of people with
 disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
 speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
 and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
 address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
 will also often make Web content more usable to users in general.
 </p> 
 </section> 

#### Inapplicable Example 4

 Open in a new tab 

 This scrollable section element has no visible content.

 <p> This is what a scrollbar looks like: </p> 
 <section style= "height: 20px; width: 500px; overflow-x:scroll;" > 
 <div style= "width: 1000px; height: 1px;" ></div> 
 </section> 

#### Inapplicable Example 5

 Open in a new tab 

 This section element has a horizontal scroll distance that is less than its horizontal padding , and vertical scroll distance that is less than its vertical padding .

 <section style= "height: 210px; width: 530px; overflow: scroll; padding: 30px 0 30px 30px;" > 
 <div role= "heading" aria-level= "1" > WCAG 2.1 Abstract </div> 
 <div style= "width: 520px" > 
 Web Content Accessibility Guidelines (WCAG) 2.1 covers a wide range of recommendations for making Web content more
 accessible. Following these guidelines will make content more accessible to a wider range of people with
 disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement,
 speech disabilities, photosensitivity, and combinations of these, and some accommodation for learning disabilities
 and cognitive limitations; but will not address every user need for people with these disabilities. These guidelines
 address accessibility of web content on desktops, laptops, tablets, and mobile devices. Following these guidelines
 will also often make Web content more usable to users in general.
 </div> 
 </section> 

#### Inapplicable Example 6

 Open in a new tab 

 This iframe element is not a scrollable element, but instead contains a nested browsing context that is scrollable. These must be tested separately.

 <iframe src= "https://www.w3.org/TR/WCAG22/#abstract" width= "500" height= "200" ></iframe> 

<h2 id="glossary"
[Glossary section omitted for brevity — see raw HTML]