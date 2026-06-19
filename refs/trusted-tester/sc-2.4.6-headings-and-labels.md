# SC 2.4.6 Headings and Labels (Level AA) — TT Tests 5.B, 10.A

**TT sections:** 5. Forms (label adequacy), 10. Content Structure (heading adequacy) · **Baselines:** 10/13
**WCAG SC 2.4.6:** Headings and labels describe topic or purpose.

2.4.6 is split across two TT tests: **5.B** judges whether each **visual form label** is sufficiently
descriptive; **10.A** judges whether each **visual heading** describes the topic/purpose of its content. Both
are pure *adequacy/quality* judgments over visually-present text (presence is 3.3.2 / determinability is 1.3.1).

---

## Test 5.B — `2.4.6-label-descriptive` (Forms)
**Test Condition:** *Each visual form label is sufficiently descriptive.*
**DNA** if the page has no form elements, all form elements are disabled, or no visual labels are provided for
form elements.

### How to Test
1. Review the visual labels and/or instructions provided for each form component/control.
2. Determine whether labels and/or instructions for form components sufficiently describe the **purpose and
   applicable data requirements** (date formats, required fields, data type, etc.).

### Evaluate Results (PASS if BOTH true)
1. Each visual form label is sufficiently clear and descriptive, so users know what input data is expected, AND
2. Each visual button label is sufficiently clear and descriptive, so users know its function.

### Notes
- An **error message is not sufficient** to communicate the expected format to pass this test.
- The label or instruction can be **graphical or textual**.
- Any changes to form labels that occur automatically or as a result of interaction should be included.

---

## Test 10.A — `2.4.6-heading-purpose` (Content Structure → Headings)
**Test Condition:** *Each heading describes the topic or purpose of its content.*
**DNA** if there are no visual headings on the page.

### How to Test
1. For each **visually identified heading**, compare the heading text to the content beneath the heading.

### Evaluate Results (PASS if)
1. The heading describes the topic or purpose of its content.

> **Identify Content shared with 10.B/10.C/10.D:** identify all visually apparent headings (larger/bolded font,
> extra spacing). 10.A judges adequacy; 10.B/10.C judge programmatic determinability/level (see
> `sc-1.3.1-info-and-relationships.md`).
