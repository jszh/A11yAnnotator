# case-05 — Pharmacy refill: title names the discontinued 10 mg Rx on the 20 mg refill page

## Scenario
A pharmacy patient-portal "refill ready" confirmation. The patient had a dose increase,
so two Lisinopril prescriptions exist in their history — the **discontinued 10 mg
(Rx 4471829)** and the **active 20 mg (Rx 4471830)**. This page is the **20 mg refill**:
the `<h1>`, the patient/Rx subheading (Rx 4471830), the dispensed-label panel — a
bilingual English / Simplified-Chinese **image-of-text** pharmacy label whose `aria-label`
reads "Lisinopril 20 mg…", the strength field (20 mg), the directions, the pickup line
("bring photo ID to collect your **20 mg** refill"), the explicit note that the 10 mg was
discontinued, and the footer all say **20 mg / Rx 4471830**. The `<title>`, however, reads
**"Refill ready: Lisinopril 10 mg — Rx 4471829 | BayCare Pharmacy"** — built from a stale
cached prescription summary naming the prior, now-discontinued strength. Right patient,
right drug, right pharmacy, a real sibling Rx — only the strength (and its paired Rx
number) is the wrong instance. Because dosage is involved, the mismatch is safety-critical.

## Attribute tuple + developer persona
- **content-domain:** healthcare / pharmacy patient portal
- **UI component / pattern:** confirmation panel + **bilingual image-of-text dispensed label (inline SVG)** + definition-list Rx summary
- **host-language construct:** `<title>` built from a cached/last-known prescription summary object
- **locale / i18n:** bilingual en + zh-Hans on the label (`lang="zh-Hans"` per text node); medication strength as the critical identifier
- **failure-mechanism:** stale cache — the title source object still holds the prior (discontinued) Rx; body rendered live from the new fill
- **developer persona:** A portal engineer set `document <title>` from a `patient.lastFilledSummary`
  cache populated at login. After the prescriber discontinued the 10 mg and the 20 mg was
  dispensed, the page body rendered from the live fill record, but the cached summary
  (still the 10 mg) hadn't been invalidated, so the head title named the old strength.
  Both prescriptions are genuine records, so the stale title is entirely plausible.

## Element / selector carrying the issue
- `head > title` — `Refill ready: Lisinopril 10 mg — Rx 4471829 | BayCare Pharmacy`
- Contradicted by `main h1#rx-h1` (`Lisinopril 20 mg tablet — refill ready`), `.who`
  (`Rx 4471830`), the dispensed-label `svg[role="img"]` aria-label (`Lisinopril 20 mg…
  Rx 4471830`), `dl.rx` (Strength `20 mg`, Rx `4471830`), the directions (`one 20 mg
  tablet`), the pickup line (`your 20 mg refill`), the `.note` (10 mg `discontinued`),
  and the footer (`Lisinopril 20 mg (Rx 4471830)`).

## Exact accessibility mechanism (what AT experiences and why it fails)
A screen-reader user hears "Refill ready: Lisinopril 10 mg — Rx 4471829" on tab
announcement, page load, tab/window list, history and notifications. The page — and the
image-of-text label's `aria-label`, which AT reads — establish the refill is **20 mg,
Rx 4471830**, with the 10 mg explicitly discontinued. Strength is precisely what
distinguishes this confirmation from the sibling Rx. A blind or low-vision patient
managing a dose change, who trusts the announced title to confirm which strength is ready,
is told the wrong (old) dose by the primary orientation cue. The harm is concrete and
medical: the patient may believe the discontinued 10 mg is what they are collecting, take
the wrong dose, or call to dispute a "wrong" fill. Users with cognitive or memory
disabilities — primary beneficiaries of titles per the Understanding doc — cannot rely on
the title to tell two strengths apart. This is the descriptiveness limb of F25; within the
patient's set of prescription pages it fails to distinguish this page and names a sibling.

## Why automated tools cannot detect it
axe-core, WAVE and Lighthouse verify only that a `<title>` is present and non-empty
(ACT 2779a5). "Refill ready: Lisinopril 10 mg — Rx 4471829 | BayCare Pharmacy" is valid,
non-empty, unique, pharmacy-qualified and on-topic. A keyword-overlap tool passes it
because title and body share "Refill ready", "Lisinopril", "BayCare Pharmacy", "Rx", "mg"
— and the body even *mentions* 10 mg and Rx 4471829 in the discontinuation note, so naive
overlap finds the title's tokens present in the body and scores it consistent. The
deciding facts (the subject is the 20 mg / Rx 4471830 fill; the 10 mg is referenced only
as the discontinued prior) live in the H1, the SVG label's accessible name, the strength
field, and the note's semantics — none of which an automated check parses or reconciles
against the title. Only a human (or model) reading the body's true strength catches it.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify this page's medication
strength/Rx; among the patient's prescription pages it names a discontinued sibling).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** WCAG 2.2 Understanding — Page Titled (Benefits)
> File: `wcag-understanding/page-titled.html`
>
> "People with cognitive disabilities, limited short-term memory and reading disabilities also benefit from the ability to identify content by its title."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "The Page Title accurately identifies the contents or purpose of the web page, AND if the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."
