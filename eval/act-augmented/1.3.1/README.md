# SC 1.3.1 Info and Relationships — augmented test corpus

The published ACT rules for SC 1.3.1 lean on the relationships a checker can verify mechanically — explicit `<th>`/`<td>` associations, `<label for>` pairs, ARIA wiring — and largely stop where deterministic tooling stops. They do not cover the failures where the *visual* presentation asserts a structure or status that the markup never encodes, or where structural markup asserts a relationship the content does not actually have. Those are the cases that require a human (or a vision-capable judge) to compare what the page looks like against what it programmatically exposes. This corpus adds nine such aspects: visual-only headings styled but not marked up (F2); genuine data tables whose semantics are absent or stripped (F91/F92); layout tables that fabricate data-table semantics (F46); structural elements misused for presentation (F43); visually apparent lists not programmatically identified as lists (TT 10.D); tabular/multi-column content faked with whitespace or `<pre>` (F34/F48/F33); scripted look-alike controls exposing a generic or absent role (F42); form label/group relationships conveyed only by visual layout (TT 5.C); and emphasis or special-status meaning conveyed only by text styling (G117/H49).

Every aspect is finalized with 6 valid pages (5 failing/boundary cases plus 1 deliberate PASS negative control each), all human-judgment-dependent and all retained — so each aspect comfortably clears the 5-valid-page bar with no aspect falling short. The remaining `problems` recorded per page in `summary.json` are minor documentation/citation/metadata notes (e.g. inline-vs-CSS styling provenance, stitched-but-verbatim citations, prompt-metadata describing a different page than the on-disk file, incidental unrelated axe landmark/region noise); none change a page's outcome, severity, or keep recommendation.

| aspect | valid pages | page statuses |
|---|---|---|
| visual-headings-without-heading-markup | 6 | valid, valid, valid, valid, valid, valid |
| data-table-missing-or-suppressed-semantics | 6 | valid, valid, valid, valid, valid, valid |
| layout-table-fabricating-data-semantics | 6 | valid, valid, valid, valid, valid, valid |
| structural-markup-misused-for-presentation | 6 | valid, valid, valid, valid, valid, valid |
| visual-lists-without-list-markup | 6 | valid, valid, valid, valid, valid, valid |
| ascii-and-pre-faux-tables-and-columns | 6 | valid, valid, valid, valid, valid, valid |
| emulated-controls-wrong-or-missing-role | 6 | valid, valid, valid, valid, valid, valid |
| form-label-and-group-relationships-by-context | 6 | valid, valid, valid, valid, valid, valid |
| special-status-text-conveyed-only-by-styling | 6 | valid, valid, valid, valid, valid, valid |
