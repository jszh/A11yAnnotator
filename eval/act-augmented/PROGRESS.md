# ACT-Augmentation Progress Ledger

**✅ COMPLETE (2026-06-22): all 22 SCs · 150 uncovered aspects · 904 valid human-judgment pages.** See `SUMMARY.md`.

Goal: for every in-scope WCAG SC, list the aspects the synthetic ACT tests do NOT cover,
and construct ≥5 valid new test pages per aspect (adversarially CDP-verified).

Pipeline per SC (`_tools/sc-pipeline.workflow.js`): Understand → Reason (5 lenses) →
Synthesize → Construct (≥5 pages/aspect) → Verify (CDP) → Finalize.

| SC | Title | Status | Aspects | Valid pages | Notes |
|----|-------|--------|---------|-------------|-------|
| 1.1.1 | Non-text Content | ✅ DONE | 7 | 49/49 valid | sequential rerun |
| 1.3.1 | Info and Relationships | ✅ DONE | 9 | 54/54 valid | sequential rerun |
| 1.3.2 | Meaningful Sequence | ✅ DONE | 7 | 42/42 valid | no ACT cases — full SC uncovered |
| 1.4.1 | Use of Color | ✅ DONE | 7 | 43/47 valid | session-limit tail, finalized from data |
| 1.4.3 | Contrast (Minimum) | ✅ DONE | 8 | 8/8 aspects ≥5 | top-up: large-text-classification aspect now 6 valid |
| 1.4.5 | Images of Text | ✅ DONE | 6 | 36/36 valid | |
| 1.4.10 | Reflow | ✅ DONE | – | see summary | no ACT cases — full SC uncovered |
| 1.4.11 | Non-text Contrast | ✅ DONE | – | see summary | no ACT cases — full SC uncovered |
| 1.4.13 | Content on Hover or Focus | ✅ DONE | 6 | 6/6 aspects ≥5 | top-up: dismissible-obscures aspect now 6 valid |
| 2.1.1 | Keyboard | ✅ DONE | 6 | 36/36 valid | |
| 2.1.2 | No Keyboard Trap | ✅ DONE | – | see summary | |
| 2.4.2 | Page Titled | ✅ DONE (v2) | 5 | 31 (100% valid) | all aspects ≥5; pipeline validated |
| 2.4.3 | Focus Order | ✅ DONE | – | see summary | no ACT cases — full SC uncovered |
| 2.4.4 | Link Purpose (In Context) | ✅ DONE | – | see summary | |
| 2.4.6 | Headings and Labels | ✅ DONE | – | see summary | |
| 2.4.7 | Focus Visible | ✅ DONE | – | see summary | |
| 2.4.10 | Section Headings | ✅ DONE | – | see summary | |
| 3.3.1 | Error Identification | ✅ DONE | – | see summary | |
| 3.3.2 | Labels or Instructions | ✅ DONE | – | see summary | no ACT cases — full SC uncovered |
| 3.3.3 | Error Suggestion | ✅ DONE | – | see summary | no ACT cases — full SC uncovered |
| 4.1.2 | Name, Role, Value | ✅ DONE | 8 | 47/48 valid | sequential rerun |
| 4.1.3 | Status Messages | ✅ DONE | – | see summary | no ACT cases — full SC uncovered |
