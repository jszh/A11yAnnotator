# ACT Rule akn7bn — Iframe with interactive elements is not excluded from tab-order
status: approved
implement: auto,semi-auto,lint
requirements(in-scope): 2.1.1
url: https://www.w3.org/WAI/standards-guidelines/act/rules/akn7bn/proposed/

# 

 Proposed

 Iframe with interactive elements is not excluded from tab-order

 Rule Mapping 

 This is an Atomic rule 
 to test
 2.1.1: Keyboard (Level A) , 
 2.1.3: Keyboard (No Exception) (Level AAA) 

## Description

 This rule checks that iframe elements which contain keyboard focusable elements are not excluded from sequential focus navigation.

## Applicability

 This rule applies to any iframe element that is not inert and that contains at least one element for which all the following are true:

- the element is visible ; and 
 
- the element is part of the sequential focus navigation order of the iframe ’s document . 

 An element is contained in a nested browsing context if its owner document is the container document of the nested browsing context .

## Expectation

 The test target does not have a negative number as a tabindex attribute value .

## Background

 Setting the tabindex attribute of an iframe element to a negative value effectively excludes its content from the tab-order of the page. A button may be in the tab-order of an iframe , but if the iframe itself is taken from the tab-order, the button is effectively keyboard inaccessible.

 Each document, including documents inside an iframe , has its own sequential focus navigation order . These focus orders are combined to get the page’s global tab-order (called the flattened tabindex-ordered focus navigation scope ). For an iframe with a negative tabindex, its sequential focus navigation order is not included in the page’s global tab-order (as a consequence for the rules to build the tabindex-ordered focus navigation scope ).

### Assumptions

 This rule assumes that interactive content inside iframe elements is used to provide functionality. If the interactive content does not provide functionality, for example a button that does nothing when clicked, success criterion 2.1.1 may be satisfied, even if the rule is failed.

### Accessibility Support

 There are no accessibility support issues known.

### Other Resources

- Understanding Success Criterion 2.1.1: Keyboard 
 
- WCAG Technique G202: Ensuring keyboard control for all functionality 

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

 This iframe element does not have a tabindex attribute value that is a negative number

 <iframe srcdoc= "<a href='/'>Home</a>" ></iframe> 

#### Passed Example 2

 Open in a new tab 

 This iframe element does not have a tabindex attribute value that is a negative number

 <iframe tabindex= "0" srcdoc= "<a href='/'>Home</a>" ></iframe> 

### Failed

#### Failed Example 1

 Open in a new tab 

 This iframe element contains a visible link that is part of its sequential focus navigation order , and has a negative tabindex .

 <iframe tabindex= "-1" srcdoc= "<a href='/'>Home</a>" ></iframe> 

### Inapplicable

#### Inapplicable Example 1

 Open in a new tab 

 This iframe element contains no content that is part of its sequential focus navigation order .

 <iframe tabindex= "-1" srcdoc= "<h1>Hello world</h1>" ></iframe> 

#### Inapplicable Example 2

 Open in a new tab 

 This iframe element contains no visible content because the iframe is hidden.

 <iframe tabindex= "-1" hidden srcdoc= "<a href='/'>Home</a>" ></iframe> 

#### Inapplicable Example 3

 Open in a new tab 

 This iframe element contains no visible content because of the small size of the iframe.

 <iframe tabindex= "-1" width= "1" height= "1" srcdoc= "<a href='/'>Home</a>" ></iframe> 

#### Inapplicable Example 4

 Open in a new tab 

 This iframe element contains a link that is not part of its sequential focus navigation order because of its own tabindex .

 <iframe tabindex= "-1" srcdoc= "<a href='/' tabindex='-1'>Home</a>" ></iframe> 

#### Inapplicable Example 5

 Open in a new tab 

 This iframe element is inert because of its own inert attribute value .

 <iframe tabindex= "-1" inert srcdoc= "<a href='/'>Home</a>" ></iframe> 

#### Inapplicable Example 6

 Open in a new tab 

 Once the “Privacy policy details” button is activated, the iframe element becomes inert because of the showModal() method, which causes the iframe to be blocked by a modal .

 <iframe id= "myFrame" title= "Links" srcdoc= "<a href='/'>Home</a>" ></iframe> 
 <div> 
 <button id= "ppButton" onclick= "openDialog()" > Privacy policy details </button> 
 </div> 
 <dialog id= "ppDialog" aria-labelledby= "dialogLabel" > 
 <h2 id= "dialogLabel" > Privacy Policy </h2> 
 <p> We store no data. </p> 
 <button id= "cancel" onclick= "ppDialog.close()" > Cancel </button> 
 </dialog> 
 <script> 
 const openDialog = () => { 
 ppDialog . showModal () 
 myFrame . tabIndex = ' -1 ' 
 } 
 ppDialog . addEventListener ( ' close ' , () => ( myFrame . tabIndex = 0 )) 
 window . addEventListener ( ' DOMContentLoaded ' , openDialog ) 
 </script> 

<h2 id="glossary"
[Glossary section omitted for brevity — see raw HTML]