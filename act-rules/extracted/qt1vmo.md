# ACT Rule qt1vmo — Image accessible name is descriptive
status: approved
implement: manual,semi-auto
requirements(in-scope): 1.1.1
url: https://www.w3.org/WAI/standards-guidelines/act/rules/qt1vmo/proposed/

# 

 Proposed

 Image accessible name is descriptive

 Rule Mapping 

 This is an Atomic rule 
 to test
 1.1.1: Non-text Content (Level A) 

## Description

 This rule checks that the accessible names of images serve an equivalent purpose to the image.

## Applicability

 This rule applies to any img , canvas or svg element that is visible and has a non-empty accessible name , except if one or more of the following is true:

- The element has an ancestor in the flat tree that is named from author ; or 
 
- The element is an img element where the current request ’s state is not completely available . 

## Expectation

 Each test target has an accessible name that serves an equivalent purpose to the non-text content of that test target.

## Background

### Assumptions

 There are no assumptions.

### Accessibility Support

 Some popular browser / screen reader combinations do not pronounce the accessible names of svg elements. This can be resolved by adding an explicit semantic role of img to the svg element.

### Other Resources

- Understanding Success Criterion 1.1.1: Non-text Content 
 
- G94: Providing short text alternative for non-text content that serves the same purpose and presents the same information as the non-text content 
 
- G95: Providing short text alternatives that provide a brief description of the non-text content 
 
- F30: Failure of Success Criterion 1.1.1 and 1.2.1 due to using text alternatives that are not alternatives (e.g., filenames or placeholder text) 

## Accessibility Requirements Mapping

- 
 1.1.1 Non-text Content (Level A) 

- Learn more about 1.1.1 Non-text Content 
 
- Required for conformance to WCAG 2.0 and later on level A and higher. 
 
- Outcome mapping: 
 
- Any failed outcomes: success criterion is not satisfied 
 
- All passed outcomes: success criterion needs further testing 
 
- An inapplicable outcome: success criterion needs further testing 

- 
 G94: Providing short text alternative for non-text content that serves the same purpose and presents the same information as the non-text content 

- Learn more about technique G94 
 
- Not required for conformance to any W3C accessibility recommendation. 
 
- Outcome mapping: 
 
- Any failed outcomes: technique is not satisfied 
 
- All passed outcomes: technique needs further testing 
 
- An inapplicable outcome: technique needs further testing 

- 
 G95: Providing short text alternatives that provide a brief description of the non-text content 

- Learn more about technique G95 
 
- Not required for conformance to any W3C accessibility recommendation. 
 
- Outcome mapping: 
 
- Any failed outcomes: technique is not satisfied 
 
- All passed outcomes: technique needs further testing 
 
- An inapplicable outcome: technique needs further testing 

## Input Aspects

 The following aspects are required in using this rule.

- Accessibility Tree 
 
- DOM Tree 
 
- CSS Styling 
 
- Language 

## Examples

### Passed

#### Passed Example 1

 Open in a new tab 

 This img element has an alt attribute that describes the image.

 <html lang= "en" > 
 <img src= "/test-assets/shared/w3c-logo.png" alt= "W3C logo" /> 
 </html> 

#### Passed Example 2

 Open in a new tab 

 This svg element has an aria-label attribute that describes the HTML5 logo image.

 <html lang= "en" > 
 <svg viewBox= "0 0 512 512" aria-label= "HTML 5 logo" role= "img" > 
 <path 
 d= "M108.4 0h23v22.8h21.2V0h23v69h-23V46h-21v23h-23.2M206 23h-20.3V0h63.7v23H229v46h-23M259.5 0h24.1l14.8 24.3L313.2 0h24.1v69h-23V34.8l-16.1 24.8l-16.1-24.8v34.2h-22.6M348.7 0h23v46.2h32.6V69h-55.6" 
 /> 
 <path fill= "#e44d26" d= "M107.6 471l-33-370.4h362.8l-33 370.2L255.7 512" /> 
 <path fill= "#f16529" d= "M256 480.5V131H404.3L376 447" /> 
 <path 
 fill= "#ebebeb" 
 d= "M142 176.3h114v45.4h-64.2l4.2 46.5h60v45.3H154.4M156.4 336.3H202l3.2 36.3 50.8 13.6v47.4l-93.2-26" 
 /> 
 <path fill= "#fff" d= "M369.6 176.3H255.8v45.4h109.6M361.3 268.2H255.8v45.4h56l-5.3 59-50.7 13.6v47.2l93-25.8" /> 
 </svg> 
 </html> 

#### Passed Example 3

 Open in a new tab 

 This canvas element has an aria-label attribute that describes the W3C logo image.

 <html lang= "en" > 
 <canvas id= "logo" width= "72" height= "48" aria-label= "W3C logo" ></canvas> 
 <script> 
 const img = new Image () 
 img . src = ' /test-assets/shared/w3c-logo.png ' 
 img . onload = function () { 
 const ctx = document . querySelector ( ' #logo ' ). getContext ( ' 2d ' ) 
 ctx . drawImage ( img , 0 , 0 ) 
 } 
 </script> 
 </html> 

### Failed

#### Failed Example 1

 Open in a new tab 

 This img element has an alt attribute that incorrectly describes the image.

 <html lang= "en" > 
 <img src= "/test-assets/shared/w3c-logo.png" alt= "ERCIM logo" /> 
 </html> 

#### Failed Example 2

 Open in a new tab 

 This svg element has an aria-label attribute that incorrectly describes the image (the aria-label is “W3C” but the actual image is the HTML5 logo).

 <html lang= "en" > 
 <svg viewBox= "0 0 512 512" aria-label= "W3C" role= "img" > 
 <path 
 d= "M108.4 0h23v22.8h21.2V0h23v69h-23V46h-21v23h-23.2M206 23h-20.3V0h63.7v23H229v46h-23M259.5 0h24.1l14.8 24.3L313.2 0h24.1v69h-23V34.8l-16.1 24.8l-16.1-24.8v34.2h-22.6M348.7 0h23v46.2h32.6V69h-55.6" 
 /> 
 <path fill= "#e44d26" d= "M107.6 471l-33-370.4h362.8l-33 370.2L255.7 512" /> 
 <path fill= "#f16529" d= "M256 480.5V131H404.3L376 447" /> 
 <path 
 fill= "#ebebeb" 
 d= "M142 176.3h114v45.4h-64.2l4.2 46.5h60v45.3H154.4M156.4 336.3H202l3.2 36.3 50.8 13.6v47.4l-93.2-26" 
 /> 
 <path fill= "#fff" d= "M369.6 176.3H255.8v45.4h109.6M361.3 268.2H255.8v45.4h56l-5.3 59-50.7 13.6v47.2l93-25.8" /> 
 </svg> 
 </html> 

#### Failed Example 3

 Open in a new tab 

 This canvas element has an aria-label attribute that incorrectly describes the image (the aria-label is “HTML5 logo” but the actual image is the W3C logo).

 <html lang= "en" > 
 <canvas id= "logo" width= "72" height= "48" aria-label= "HTML 5 logo" ></canvas> 
 <script> 
 const img = new Image () 
 img . src = ' /test-assets/shared/w3c-logo.png ' 
 img . onload = function () { 
 const ctx = document . querySelector ( ' #logo ' ). getContext ( ' 2d ' ) 
 ctx . drawImage ( img , 0 , 0 ) 
 } 
 </script> 
 </html> 

### Inapplicable

#### Inapplicable Example 1

 Open in a new tab 

 This img element has an empty ( "" ) accessible name . The image is described by the adjacent text.

 <img src= "/test-assets/shared/pdf-icon.png" alt= "" /> PDF document

#### Inapplicable Example 2

 Open in a new tab 

 This decorative img element has an empty ( "" ) accessible name because it has no attributes or content to provide an accessible name.

 <html lang= "en" > 
 <p> Happy new year! </p> 
 <img src= "/test-assets/shared/fireworks.jpg" role= "presentation" /> 
 </html> 

#### Inapplicable Example 3

 Open in a new tab 

 This svg element has an empty ( "" ) accessible name because it has no attributes or content to provide an accessible name.

 <html lang= "en" > 
 <p> Happy new year! </p> 
 <svg height= "200" xmlns= "http://www.w3.org/2000/svg" > 
 <polygon points= "100,10 40,180 190,60 10,60 160,180" fill= "yellow" /> 
 </svg> 
 </html> 

#### Inapplicable Example 4

 Open in a new tab 

 This canvas element has an empty ( "" ) accessible name because it has no attributes or content to provide an accessible name.

 <html lang= "en" > 
 <p> Happy new year! </p> 
 <canvas id= "newyear" width= "200" height= "200" ></canvas> 
 <script> 
 const ctx = document . querySelector ( ' #newyear ' ). getContext ( ' 2d ' ) 
 ctx . fillStyle = ' yellow ' 
 ctx . beginPath () 
 ctx . moveTo ( 100 , 10 ) 
 ctx . lineTo ( 40 , 180 ) 
 ctx . lineTo ( 190 , 60 ) 
 ctx . lineTo ( 10 , 60 ) 
 ctx . lineTo ( 160 , 180 ) 
 ctx . fill () 
 </script> 
 </html> 

#### Inapplicable Example 5

 Open in a new tab 

 This img element is not visible .

 <html lang= "en" > 
 <img src= "/test-assets/shared/w3c-logo.png" alt= "W3C logo" style= "display:none" /> 
 </html> 

#### Inapplicable Example 6

 Open in a new tab 

 This canvas element is not visible because it is completely transparent.

 <html lang= "en" > 
 <canvas width= "200" height= "200" ></canvas> 
 </html> 

#### Inapplicable Example 7

 Open in a new tab 

 This img element has no accessible name because it is not included in the accessibility tree .

 <html lang= "en" > 
 <img aria-hidden= "true" src= "/test-assets/shared/fireworks.jpg" alt= "fireworks" /> 
 </html> 

#### Inapplicable Example 8

 Open in a new tab 

 This svg element is ignored because it is a child of a link that provides its accessible name .

 <a href= "https://w3.org" aria-label= "W3C Website" > 
 <svg height= "200" xmlns= "http://www.w3.org/2000/svg" aria-label= "star" > 
 <polygon points= "100,10 40,180 190,60 10,60 160,180" fill= "yellow" /> 
 </svg> 
 </a> 

#### Inapplicable Example 9

 Open in a new tab 

 This img element has a src attribute which will cause the image request state to be Broken .

 <img src= "/test-assets/does-not-exist.png" alt= "" /> 

#### Inapplicable Example 10

 Open in a new tab 

 This is a div element with a background image. Background images must be tested separate from this rule.

 <p> Happy new year! </p> 
 <div 
 style= "
 width: 260px;
 height: 260px;
 background: url(/test-assets/shared/fireworks.jpg) no-repeat;
" 
 ></div> 

<h2 id="glossary"
[Glossary section omitted for brevity — see raw HTML]