# case-04 — Obituary print view titled "Details"

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-meaningless-out-of-context (Limb 2 — descriptiveness)
- **Expected ACT outcome:** **failed**
- **Page:** `case-04.html`

## Scenario
A print-friendly obituary notice from "Riverside Memorial Chapel" for Eleanor
Margaret Whitfield, with biography and service details. The `<title>` is the generic
pointer word **"Details"** — the label of the "Details" link that opened this view.

## Element / selector carrying the issue
`head > title` (text `Details`). The deceased's name (`article > h1`) and the
"Service details" section (`h2`) supply the on-page context; "Details" echoes that
section heading.

## Exact accessibility mechanism (what AT experiences)
A family member comparing several obituary notices opens each in a tab. Every tab
announces **"Details"** — they cannot tell whose notice is whose, defeating the very
benefit 2.4.2 cites of differentiating content when multiple pages are open. In
history a week later, "Details" recalls nothing. "Details" is deictic: it means
"details **of** the thing you clicked", interpretable only relative to the prior
listing page. On the page the deceased's name is the H1 and the content is rich, so a
sighted user has full context; the failure is exposed only when the title is read
detached.

## Why automated tools miss it
- **2779a5 (non-empty title):** passes.
- **c4a8a4 (descriptive), automated parts:** "Details" appears verbatim in the
  visible "Service details" heading, so a title/body lexical-overlap check is
  satisfied. axe/WAVE/Lighthouse see a non-empty, even content-echoing string and
  fire nothing. Recognising that "Details" fails to identify the page out of context
  — distinguishing a pointer word from a real subject — requires human judgement.

## Citation
> **Reference:** WCAG Understanding 2.4.2 — *Benefits of Page Titled*
> (`wcag-understanding/page-titled.html`)
>
> "People with visual disabilities will benefit from being able to differentiate
> content" […] "when multiple web pages are open."

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> "The title of each web page should:" … "Identify the subject of the web page"

> **Reference:** Trusted Tester v5.1.3 — *Test 12.B `2.4.2-page-title-purpose`,
> Evaluate Results* (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
>
> "The Page Title accurately identifies the contents or purpose of the web page"
