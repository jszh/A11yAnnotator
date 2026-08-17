# case-06 — Password-reset KB article titled "No Title"

## Scenario
A fully populated support **knowledge-base article** in the Nimbus Mail Help Center:
sidebar of related articles, breadcrumb, a 5-step numbered reset procedure, a security
note, a troubleshooting section, and a "was this helpful?" widget. The `<title>` is the
authoring/CMS placeholder **`No Title`** — the literal words an importer writes when no
title was supplied.

## Element / selector carrying the issue
- `head > title` — text node `No Title`.
- Contradicting evidence: `article h1` ("How to reset your Nimbus Mail password"), the
  breadcrumb, and the procedure `<ol>`.

## Exact accessibility mechanism
- The irony of `No Title` is that it *is* a non-empty title node — so presence rule 2779a5
  passes — yet semantically it announces the absence of a title. A screen-reader user hears
  the page identified as "No Title," which is actively misleading: it suggests the page is
  blank or broken, while the body is a complete, useful procedure.
- A user with several Help-Center tabs open (password reset, 2FA, phishing) sees every one
  labelled "No Title" and cannot tell them apart. Limb 1 passes; limb 2 fails.

## Expected ACT-style outcome
**failed** — ACT rule c4a8a4. F25 lists "No Title" verbatim.

## Why automated tools miss it
"No Title" is two real words, non-empty, valid — it satisfies every structural signal.
The string is a perfect adversarial case for linters: the words literally say there is no
title, yet a regex/DOM check for "title text exists" returns true. Only a human (or a model
reasoning about meaning) recognizes "No Title" as a placeholder that fails to name the
password-reset content.

## Citation
> **Reference: WCAG Techniques — F25** (`wcag-techniques/failures/F25.html`)
>
> "Examples of text that are not titles include: Authoring tool default titles, such as
> "Enter the title of your HTML document here," "Untitled Document" "No Title" "Untitled
> Page" "New Page 1""

> **Reference: WCAG Understanding — Page Titled** (`wcag-understanding/page-titled.html`)
>
> "People with visual disabilities will benefit from being able to differentiate content
> when multiple web pages are open."
