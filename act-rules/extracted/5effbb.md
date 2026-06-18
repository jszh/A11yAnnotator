# ACT Rule 5effbb — Link in context is descriptive proposed
status: proposed
implement: auto,manual,semi-auto
requirements(in-scope): 2.4.4
url: https://www.w3.org/WAI/standards-guidelines/act/rules/5effbb/proposed/

# 

 Proposed

 Link in context is descriptive

 Rule Mapping 

 This is an Atomic rule 
 to test
 2.4.4: Link Purpose (In Context) (Level A) 

## Description

 This rule checks that the accessible name of a link together with its context describes its purpose.

## Applicability

 This rule applies to any inheriting semantic link for which all the following is true:

- the link is included in the accessibility tree ; and 
 
- the link has a non-empty (“”) accessible name . 

## Expectation

 The accessible name of each target element together with its programmatically determined link context describes the purpose of the link.

## Background

### Assumptions

- 
 This rule assumes that the purpose of the link is not ambiguous to users in general when seen in context on the web page, which is the exception mentioned in success criteria 2.4.4 Link Purpose (In Context) or 2.4.9 Link Purpose (Link only) . If the link is ambiguous to users in general, users of assistive technologies are not at a disadvantage when viewing the link out of context.

- 
 This rule assumes that all semantic link elements are used as links. An element marked up as a link, but that does not behave as a link would not fail success criteria 2.4.4 Link Purpose (In Context) or 2.4.9 Link Purpose (Link only) .

### Accessibility Support

- Implementation of Presentational Roles Conflict Resolution varies from one browser or assistive technology to another. Depending on this, some semantic link elements can fail this rule with some technology but users of other technologies would not experience any accessibility issue. 

### Related rules

- Link has non-empty accessible name 
 
- Link is descriptive 

### Other Resources

- Understanding Success Criterion 2.4.4: Link Purpose (In Context) 
 
- Understanding Success Criterion 2.4.9: Link Purpose (Link Only) 
 
- G91: Providing link text that describes the purpose of a link 
 
- H30: Providing link text that describes the purpose of a link for anchor elements 
 
- H24: Providing text alternatives for the area elements of image maps 
 
- G53: Identifying the purpose of a link using link text combined with the text of the enclosing sentence 
 
- ARIA7: Using aria-labelledby for link purpose 
 
- ARIA8: Using aria-label for link purpose 
 
- H77: Identifying the purpose of a link using link text combined with its enclosing list item 
 
- H78: Identifying the purpose of a link using link text combined with its enclosing paragraph 
 
- H79: Identifying the purpose of a link in a data table using the link text combined with its enclosing table cell and associated table header cells 
 
- H81: Identifying the purpose of a link in a nested list using link text combined with the parent list item under which the list is nested 

## Accessibility Requirements Mapping

- 
 2.4.4 Link Purpose (In Context) (Level A) 

- Learn more about 2.4.4 Link Purpose (In Context) 
 
- Required for conformance to WCAG 2.0 and later on level A and higher. 
 
- Outcome mapping: 
 
- Any failed outcomes: success criterion is not satisfied 
 
- All passed outcomes: success criterion needs further testing 
 
- An inapplicable outcome: success criterion needs further testing 

### Secondary Requirements

 This rule is related to the following accessibility requirements, but was 
not designed to test this requirements directly. These 
 secondary requirements 
can either be stricter than the rule requires, or may be satisfied in ways 
not tested by the rule:

- 2.4.9 Link Purpose (Link Only) (Level AAA) : This success criterion is more strict than this rule. This is because the rule also considers the context of the link, in addition to the link text. Some of the passed examples do not satisfy this success criterion. 

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

 The accessible name (from the link’s text) describes the purpose of the link.

 <a href= "#desc" > See the description of this product. </a> 

 <p id= "desc" > This product consists of several web pages. </p> 

#### Passed Example 2

 Open in a new tab 

 The accessible name describes the purpose of the link.

 <a href= "#main" ><img src= "/test-assets/5effbb/main.png" alt= "Go to the main content" /></a> 

 <main> 
 <p id= "main" > This is the main content. </p> 
 </main> 

#### Passed Example 3

 Open in a new tab 

 The accessible name (from the link’s text), together with its programmatically determined link context (available from the text in the closest p ancestor), describes the purpose of the link.

 <p> See the description of <a href= "#desc" > this product </a> . </p> 

 <p id= "desc" > This product consists of several web pages. </p> 

#### Passed Example 4

 Open in a new tab 

 The accessible name (from the link’s text) describes the purpose of the link.

 <span role= "link" tabindex= "0" onclick= "document.location+='#desc'" > See description of the product. </span> 

 <p id= "desc" > This product consists of several web pages. </p> 

#### Passed Example 5

 Open in a new tab 

 The programmatically determined link context (provided by the ancestor with a role of listitem and text “Ulysses”) and the accessible name (from the link’s text) describe the purpose of the links.

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

#### Passed Example 6

 Open in a new tab 

 The programmatically determined link context (provided by the table header assigned to the cell containing the link) and the accessible name (from the link’s text) describe the purpose of the links.

 <table> 
 <tr> 
 <th colspan= "3" > Ulysses </th> 
 </tr> 
 <tr> 
 <td><a href= "https://www.gutenberg.org/files/4300/4300-h/4300-h.htm" > HTML </a></td> 
 <td> 
 <a href= "https://www.gutenberg.org/ebooks/4300.epub.images?session_id=04cd710372888de8d8d322215cdfe8ce5b0f8d73" 
 > EPUB </a 
 > 
 </td> 
 <td><a href= "https://www.gutenberg.org/files/4300/4300-0.txt" > Plain text </a></td> 
 </tr> 
 </table> 

#### Passed Example 7

 Open in a new tab 

 The accessible name describes the purpose of the link.

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

#### Passed Example 8

 Open in a new tab 

 The programmatically determined link context (provided by the cell containing the link) and the accessible name (from the link’s text) describe the purpose of the links.

 <table> 
 <tr> 
 <td> 
 Download Ulysses in
 <a href= "https://www.gutenberg.org/files/4300/4300-h/4300-h.htm" > HTML </a> 
 </td> 
 <td> 
 Download Ulysses in
 <a href= "https://www.gutenberg.org/ebooks/4300.epub.images?session_id=04cd710372888de8d8d322215cdfe8ce5b0f8d73" 
 > EPUB </a 
 > 
 </td> 
 </tr> 
 </table> 

#### Passed Example 9

 Open in a new tab 

 The programmatically determined link context (provided by the element referenced by the aria-describedby attribute) and the accessible name (from the link’s text) describe the purpose of the links.

 <h2 id= "rule" > Button has accessible name </h2> 
 <ul> 
 <li> 
 <a href= "https://www.w3.org/WAI/standards-guidelines/act/rules/97a4e1/#applicability" aria-describedby= "rule" 
 > Applicability </a 
 > 
 </li> 
 <li> 
 <a href= "https://www.w3.org/WAI/standards-guidelines/act/rules/97a4e1/#expectation" aria-describedby= "rule" 
 > Expectation </a 
 > 
 </li> 
 </ul> 

### Failed

#### Failed Example 1

 Open in a new tab 

 The accessible name (from the link’s text), together with the absence of programmatically determined link context , does not describe the purpose of the link.

 <a href= "#desc" > More </a> 

 <p id= "desc" > This product consists of several web pages. </p> 

#### Failed Example 2

 Open in a new tab 

 The accessible name (from the link’s text), together with the absence of programmatically determined link context , does not describe the purpose of the link.

 <div role= "link" tabindex= "0" onclick= "document.location+='#main'" > More </div> 

 <main> 
 <p id= "main" > This is the main content. </p> 
 </main> 

#### Failed Example 3

 Open in a new tab 

 The accessible name (from the link’s text), together with the absence of programmatically determined link context , does not describe the purpose of the link.

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

 The accessible name (from the link’s text) does not describe the purpose of the link. The other information available on the page is not programmatically determined link context because it is in a different p element.

 <p> 
 The W3C held a workshop on June 9-10, 2005 at DERI Innsbruck (Austria), to gather information about potential
 standardization work on Semantics in Web Services.
 </p> 

 <p><a href= "https://www.w3.org/2005/04/FSWS/workshop-report.html" > Workshop </a></p> 

#### Failed Example 5

 Open in a new tab 

 The accessible name (from the link’s text) does not describe the purpose of the link. The other information available on the page is not programmatically determined link context because it is outside the list where the links are.

 <p style= "font-weight: bold" > Ulysses </p> 
 <ul> 
 <li><a href= "https://www.gutenberg.org/files/4300/4300-h/4300-h.htm" > HTML </a></li> 
 <li> 
 <a href= "https://www.gutenberg.org/ebooks/4300.epub.images?session_id=04cd710372888de8d8d322215cdfe8ce5b0f8d73" > 
 EPUB
 </a> 
 </li> 
 <li><a href= "https://www.gutenberg.org/files/4300/4300-0.txt" > Plain text </a></li> 
 </ul> 

#### Failed Example 6

 Open in a new tab 

 The accessible name (from the link’s text) does not describe the purpose of the link. The other information available on the page is not programmatically determined link context because it not available on the same cell of the link or in a header cell for that cell.

 <table> 
 <tr> 
 <th colspan= "3" > Books </th> 
 </tr> 
 <tr> 
 <td> Ulysses </td> 
 <td><a href= "https://www.gutenberg.org/files/4300/4300-h/4300-h.htm" > Download </a></td> 
 <td> 1.61MB </td> 
 </tr> 
 </table> 

### Inapplicable

#### Inapplicable Example 1

 Open in a new tab 

 An a element with its semantic role changed from link to another role.

 <a href= "https://www.w3.org/WAI" role= "button" > Web Accessibility Initiative (WAI) </a> 

#### Inapplicable Example 2

 Open in a new tab 

 The link element is not included in the accessibility tree .

 <a href= "https://www.w3.org/WAI" style= "display: none;" 
 ><img src= "/test-assets/5effbb/cart.svg" alt= "Checkout" /> Checkout </a 
 > 

#### Inapplicable Example 3

 Open in a new tab 

 This a element is not a semantic link , because it has no href attribute.

 <a> placeholder </a> 

<h2 id="glossary"
[Glossary section omitted for brevity — see raw HTML]