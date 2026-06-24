# 4-annotator work split (10-SC demo set)

Splits the **10-SC demo set** (`demo-10sc-filter-full.json` →
1.1.1, 1.4.1, 2.4.2, 2.4.4, 1.3.1, 1.4.13, 2.1.2, 3.3.1, 4.1.3, 2.4.3 = **426 pages**)
across **4 annotators** so that **every page is annotated by exactly 2 of them** (for
inter-annotator agreement), and each annotator does **213 pages** (half the set).

All four use the **same shared order** — a deterministic shuffle keyed by **seed 42** that
randomizes SC order, aspect order within each SC, and case order within each aspect. Because
the seed is shared, "first half", "middle half", etc. refer to the *same* ordering for everyone.

## Assignments

| Annotator | Portion | Filter file | Pages |
|---|---|---|--:|
| **1** | First half (0–50%) | `annotator-1-first-half.json` | 213 |
| **2** | Second half (50–100%) | `annotator-2-second-half.json` | 213 |
| **3** | First quarter + last quarter (0–25% & 75–100%) | `annotator-3-q1-q4.json` | 213 |
| **4** | Middle half (25–75%) | `annotator-4-middle.json` | 213 |

## Coverage (each quarter → exactly 2 annotators)

The shared order is divided into quarters at positions 0 · 107 · 213 · 320 · 426.

| Quarter (in shared order) | Annotated by |
|---|---|
| Q1 — pages 1–107 | **A1** (first half) + **A3** (q1+q4) |
| Q2 — pages 108–213 | **A1** (first half) + **A4** (middle) |
| Q3 — pages 214–320 | **A2** (second half) + **A4** (middle) |
| Q4 — pages 321–426 | **A2** (second half) + **A3** (q1+q4) |

So the four overlapping pairs are A1∩A3, A1∩A4, A2∩A4, A2∩A3 (one quarter each); A1 never
overlaps A2, and A3 never overlaps A4. Every page lands in exactly two annotators' sets.

## How each annotator loads their portion

1. Open the annotator: `npm start`, then
   `http://localhost:3001/eval/act-augmented/_annotator/index.html`.
2. Click **⛶ Filter** and choose your `annotator-N-….json` file from this `splits/` folder.
3. The queue is restricted to your 213 pages, in the shared seed-42 order. Annotate; **⬇ Export**
   when done. (The filter persists in the browser until you **✕ Clear filter**.)

> Each annotator should use a different browser profile / machine (or **⚙ → name**) so their
> localStorage and export don't collide.

## Filter format (for reference)

These files use the filter's seed + slice extensions:

```json
{
  "include": ["1.1.1", "1.4.1", "…the 10 SCs…"],   // restrict to the demo set
  "seed": 42,                                       // deterministic SC/aspect/case shuffle
  "slice": { "ranges": [[0, 0.5]] }                 // fractional ranges of the shared order
}
```

`include` restricts the pool (SC, SC/aspect, or SC/aspect/case selectors), `seed` orders it, and
`slice.ranges` (fractions of the ordered pool, `[start,end)` with `Math.round(frac×N)` boundaries)
picks each annotator's portion. To re-split a different pool, change `include`; the same four
`slice.ranges` keep the exact-2× coverage. To change the shared order, change `seed` in **all**
four files together.
