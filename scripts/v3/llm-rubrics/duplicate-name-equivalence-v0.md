---
id: duplicate-name-equivalence-v0
sc: 4.1.2
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 4.1.2 — identical-name iframes serve equivalent purpose (v0 relational rubric)

**Division of labor (v3.2).** You do NOT decide whether a name EXISTS or is well-formed — `accessible-name-adequacy-v0`
owns single-element name adequacy and the deterministic detectors own name PRESENCE. This rubric owns ONE relational
question that a single-element view structurally cannot answer: **when two or more `<iframe>` elements share the SAME
accessible name, do they serve an EQUIVALENT purpose?** (ACT 4b1c6c.) You only ever receive an iframe that HAS a
same-named peer — the harness skips this rubric otherwise.

**Why this is its own rubric.** 4.1.2 requires that elements with the same role expose name/role/value such that the
user is not misled. Two frames both named "List of Contributors" are fine if they show the same thing, but a barrier if
one is the contributor list and the other is an advertising panel — the name promises sameness the content breaks. The
single-element adequacy rubric is explicitly told NOT to make this call (a frame's name is a purpose summary, not a
mirror of its DOM); it lands here instead.

**Evidence handed to you (`signals.sameNameIframes`):**
- `name` — the shared accessible name.
- `peers` — the OTHER same-named iframes (`{xpath, name, src}`); `selfSrc` — this iframe's own `src`.
- `distinctSrcs` — the number of DISTINCT (query/hash/trailing-slash-normalized) `src` values across this frame **and**
  its peers. `allSameSrc` — true when that count is 1.
- the `element-crop` (THIS frame's rendered content) and `surrounding-region` (page context).

**Judge:**
- **`allSameSrc` (distinctSrcs = 1):** every same-named frame loads the SAME resource → they trivially serve the same
  purpose → **NOT REPRODUCED** (no barrier). This is the common false alarm to clear (the same page embedded twice; a
  `title` on one frame and an `aria-label` carrying the same string on another, both pointing at one src).
- **`distinctSrcs` ≥ 2:** the identically-named frames load DIFFERENT `src` resources. This is a TRIGGER TO INSPECT,
  **not** a verdict — a different `src` does NOT by itself prove a different purpose. **Call
  `compare_iframe_content(iframeXpaths=[this frame + its same-named peers])`**: it reads each SAME-ORIGIN frame's
  RENDERED content (title/h1/firstParagraph/visibleText) and returns a per-field EQUALITY grid. Read it — fields that
  MATCH across the set ⇒ the frames render the same content (equivalent); fields that DIVERGE (different title/h1/text)
  ⇒ genuinely different content. Do NOT decide from the `src` strings alone (`page-one.html` vs `page-two.html` look
  interchangeable as strings but render DIFFERENT content — exactly the call this tool settles). A crossOrigin frame
  cannot be read by the tool — fall back to the crops + the shared name, or return PARTIAL. With the grid (or the
  crops), two same-named frames with distinct srcs are **NOT REPRODUCED (equivalent)** when ANY of these holds:
  - **Same content, different path:** the srcs are different strings but resolve to the SAME page — a copy / mirror, a
    file under a different directory, or a renamed duplicate (e.g. `page-one.html` vs `sub-dir/page-one.html` vs
    `page-one-copy.html` vs `page-three-same-as-page-one.html`), or a CDN / locale variant (`/en/list` vs `/fr/list`)
    of the same content. Confirm from the crops that the frames render the SAME content.
  - **Same CATEGORY purpose:** the shared name denotes a KIND of content rather than a specific document — e.g. two
    frames both named "advertising" / "sponsored" / "related" that each show a DIFFERENT ad but whose PURPOSE
    (display an advertisement) is identical. The name promises a category, and both frames deliver that category →
    equivalent purpose → not a barrier.

  It IS a barrier (**REPRODUCED**) when the crops show the same-named frames serve genuinely DIFFERENT purposes — a
  contributor list in one and a contact form (or a different data page: "page one" vs "page two" of different records)
  in the other — so the single shared name misdirects the user about what the frame contains. If you cannot see enough
  of each frame's content to decide between equivalent-content/category and genuinely-different-purpose, return
  **PARTIAL** — never a confident clear OR a confident barrier on the `src` strings alone.
- **empty `src` ('') on any peer (a `srcdoc` / JS-set frame):** the raw src cannot fingerprint it — judge from the
  rendered crops, or return **PARTIAL** if the contents are not visible. Absence of a comparable src is NOT a pass.

**WCAG soundness caveats:**
- This is about PURPOSE equivalence, not pixel identity: two frames may render different pixels yet be equivalent
  (the same live feed at two moments), and two frames may render similar-looking pixels yet differ in purpose. Lead
  with what each frame is FOR (its content + the page context), using `src` as the primary deterministic signal and
  the crop to confirm.
- Do NOT flag a frame whose name merely *could be more specific* — 4.1.2 here is about same-name COLLISION with
  divergent purpose, not descriptiveness (that is 2.4.6). A single named frame with no same-named peer never reaches you.
- A terse shared name that accurately covers genuinely-equivalent frames is fine — do not demand uniqueness for its
  own sake; uniqueness is only required when the purposes actually differ.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — same-named frames serve DIFFERENT purposes), NOT REPRODUCED (no barrier — same-named frames are
equivalent), PARTIAL (cannot confirm equivalence from the handed evidence), N/A (abstain — NOT "out of scope", that is
the oracle's job)}.
