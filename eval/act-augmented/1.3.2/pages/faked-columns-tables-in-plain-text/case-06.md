# case-06 — Boundary PASS: single-column changelog in a `<textarea>` linearizes correctly (no faked grid)

## Scenario
Release notes for "fern-cli 2.3.0." The CHANGELOG is shown in a read-only monospace `<textarea>`, and
a short decorative ASCII rule sits above it. Crucially, the changelog is **single-column**: a release
header, then `Added` / `Fixed` / `Changed` sections each followed by indented bullet lines. The
indentation expresses simple top-to-bottom nesting (items under a heading); no two facts are placed
side-by-side in aligned columns and nothing forms a grid. The linear character stream a screen reader
reads is exactly the intended reading order. This is the deliberate negative control for the aspect.

## Attribute tuple
- **Content domain:** open-source developer tooling / release notes
- **UI-component / pattern:** read-only `<textarea>` changelog + decorative ASCII divider (`role="img"`)
- **Host-language construct:** `<textarea readonly>` monospace, single-column; plus a decorative `<pre role="img">`
- **Locale / i18n:** en-US
- **Failure-mechanism:** NONE — monospace/`pre` used for code fidelity and top-to-bottom nesting, not to fake columns; sequence is preserved on linearization

## Developer persona
The maintainer copied their `CHANGELOG.md`'s "Keep a Changelog" section into the release page so users
can paste it into upgrade tickets. They kept it in a monospace box for fidelity. Because they followed
the conventional single-column changelog format, indentation is purely hierarchical — there is no
2-D alignment to break.

## Element / selector carrying the issue
None for failure. The elements to inspect are `textarea#log` (single-column changelog, reads linearly)
and `pre.divider[role="img"]` (decorative ASCII rule with an accessible name, conveys no data).

## Exact accessibility mechanism (what AT experiences, why it passes)
- A sighted user reads top to bottom: release header, then each section heading and its bullets.
- A screen reader reads the textarea value in the same top-to-bottom order. Because no content is
  aligned into side-by-side columns, every line is a complete, independent statement and the spoken
  sequence matches the visual sequence: *"Added — fern sync dry-run previews changes…"* etc. The
  indentation collapses to nothing meaningful being lost, since it only signaled nesting, not a column
  relationship. The decorative divider is exposed as an image with the name "Decorative divider" and
  does not interject stray characters into the reading flow.
- A correct reading sequence is therefore available; 1.3.2 is satisfied. (This is a PASS for THIS SC;
  whether the bullets ought to be a real `<ul>` is a separate 1.3.1 consideration and out of scope
  here.)

## Expected ACT-style outcome
**passed** (SC 1.3.2 — the preformatted text is single-column; its linear reading order preserves the
intended meaning; no F33/F34 column or table is faked).

## Why automated tools miss it (symmetry note)
Just as automated tools cannot detect the failing column/table cases, they also cannot *confirm* this
pass: they have no model of the rendered monospace layout and so cannot determine that no 2-D grid is
being faked. A tool sees a valid labelled `<textarea>` of text either way. Confirming that the linear
order here genuinely preserves meaning — and that the indentation is nesting, not columns — is the
same human visual + semantic judgment, applied to reach a PASS. This is what makes it a clean boundary
control rather than a trivially-passing page.

## Citation
> "Providing a particular linear order is only required where it affects meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence — "For clarity")

> "in HTML, text is always a meaningful sequence."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)

> "Examine the document for data or information presented in columnar format. Check whether the columns
> are created using white space characters to lay out the information."
— wcag-techniques/failures/F33.html (Tests — Procedure; here both checks resolve negative, so F33 does not apply)
