# case-02 — Help article where the Refund-Policy section is headed "Shipping & Delivery" (heading copied from the section above)

## Scenario
A UK homeware retailer's "Shipping, Returns & Refunds" help page has four sections:
**Shipping & Delivery**, **Tracking your order**, the **Refund policy**, and **Contact us**.
The third section's body is unambiguously the refund policy (30-day window, refund to
original payment method in 5–7 working days, restocking deduction, gift-card-as-store-credit
rule). But its `<h2>` reads **"Shipping & Delivery"** — duplicated verbatim from the first
section's heading and never edited. The hand-written in-page table of contents lists the
correct names ("Refund policy"), so the TOC and the body heading silently disagree.

## Attribute tuple
- **content-domain**: e-commerce — customer help centre (shipping / returns / refunds)
- **UI-component/pattern**: two-column article with a sticky in-page table-of-contents nav linking to `<section id>` anchors
- **host-language construct**: `<section aria-labelledby>` headings + an `<aside>` jump-link list
- **locale/i18n**: en-GB
- **failure-mechanism**: (b) a heading copied from the section above, so it names the previous topic instead of its own

## Developer persona
A content editor duplicated the finished "Shipping & Delivery" section block to use as a
scaffold for the refund section (same layout, intro paragraph, bullet list), rewrote the body
to be the refund policy, but forgot to change the duplicated `<h2>`. The TOC was maintained
separately and got the correct label, so the page passed a quick visual scan — the wrong
heading is only obvious if you read the heading immediately above its refund prose.

## Element / selector carrying the issue
- FAIL: `h2#h-refunds` (text "Shipping & Delivery") sits above the refund-policy body.
- Corroborating tell: `aside.toc` lists "Refund policy" for the `#refunds` anchor, so the
  programmatic heading contradicts the page's own navigation label.
- (The first section `h2#h-dispatch`, also "Shipping & Delivery", is correct — the duplication
  is the source of the error.)

## Exact accessibility mechanism
A screen-reader user navigating by heading hears two sections announced as "Shipping &
Delivery, heading level 2." If they are hunting for the refund rules, the heading list
actively **misleads** them: it tells them the refund section is more shipping content, so they
skip past the very section they need, or they open the second "Shipping & Delivery" expecting
delivery info and instead hit refund prose. A user who jumps via the TOC link "Refund policy"
lands on a section whose heading says "Shipping & Delivery", creating a name/landmark
mismatch (the `aria-labelledby` accessible name of the section is "Shipping & Delivery", not
"Refund policy"). This is a topic **mismatch**: the heading names a different section than the
one it introduces.

## Expected ACT-style outcome
**failed** — the section has a heading, but the heading text introduces the wrong topic
(shipping) rather than the section's actual content (refunds).

## Why automated tools miss it
The page's heading outline is a clean `h1` → four `h2` sequence, all non-empty, valid order,
so axe-core, WAVE and Lighthouse pass every heading rule. Duplicate heading text ("Shipping &
Delivery" twice) is not a violation any tool flags. Detecting the defect requires reading the
section body (refund timelines, restocking fees, gift-card rule) and recognising that
"Shipping & Delivery" does not describe it — a semantic comparison of heading-to-body that no
automated checker performs. The TOC-vs-heading contradiction is a tell, but tools do not
cross-check a hand-authored jump list against section accessible names.

## Citation
> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental \"handles\" that aid in comprehension of the content."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content**
> "Since headings indicate the start of important sections of content, it is possible for
> users with assistive technology to jump directly to the appropriate heading and begin
> reading the content."

> **WCAG Techniques — F2 (Failure)**
> "This document describes a failure that occurs when a change in the appearance of text
> conveys meaning without using appropriate semantic markup." (Cited as the WCAG family for
> heading meaning failing to track the section it labels.)
