# SC 2.4.2 Page Titled (Level A) — TT Tests 12.A, 12.B

**TT section:** 12. Page Titles, Frames, and iFrames → Page Titles · **Baseline:** 11. Page Titles
**WCAG SC 2.4.2:** Web pages have titles that describe topic or purpose.

## Identify Content
All web pages. **Test Conditions 12.A and 12.B always apply** — you may NOT evaluate as DNA.

---

## Test 12.A — `2.4.2-page-title-defined`
**Test Condition:** *A `<title>` element is defined for the web page.*

### How to Test
1. Launch **ANDI: structures**. Review the alerts in ANDI's "Accessibility Alerts" section to determine whether
   ANDI displays either Invalid HTML Alert:
   - a. "Page has no `<title>`"
   - b. "Page `<title>` cannot be empty"

### Evaluate Results (PASS if)
1. A Page Title is defined for the web page.

---

## Test 12.B — `2.4.2-page-title-purpose`
**Test Condition:** *The `<title>` element identifies the contents or purpose of the web page.*

### How to Test
1. Launch **ANDI: structures** → "more details" → "page title." A modal dialog will appear with the identified
   page title listed.
2. Evaluate the purpose and content of the web page.
3. Determine whether the Page Title is a **meaningful representation or indication** of page content.
   - a. If the web page is part of a set of web pages, determine whether the Page Title is sufficient to
     **distinguish** the web page from other pages.
   - b. For documents or web applications, the name of the document or web application would be sufficient to
     describe the purpose of the page.

### Evaluate Results (PASS if ALL true)
1. The Page Title accurately identifies the contents or purpose of the web page, AND
2. If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other
   pages in the web site.

> **Note:** A web application is an application that runs in a web browser (such as webmail) and may not have a
> URL that changes as content changes.
