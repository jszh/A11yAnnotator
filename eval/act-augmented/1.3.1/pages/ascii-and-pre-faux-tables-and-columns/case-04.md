# case-04 — CLI terminal output as a column-bearing data table in `<pre>` (dev docs)

## Scenario
A developer-docs "Troubleshooting a stuck rollout" page. The doc instructs operators to read the
columns of `kubectl get pods` output — NAME / READY / STATUS / RESTARTS / AGE — to diagnose a
failing deployment. The diagnosis explicitly depends on scanning *down the STATUS column* and
*cross-referencing the same row's READY and RESTARTS counts*. The pasted terminal output is a real,
column-bearing data table, but it is verbatim text inside a `<pre>`: columns space-aligned, header
row detached, no `<table>`, `<th>`, `scope`, or `role`. The surrounding prose ("scan down the
STATUS column", "compare their READY columns") references columns that do not exist for AT.

## Attribute tuple
- **Content domain:** developer docs / DevOps runbook
- **UI component / pattern:** pasted CLI transcript used as a status table the reader must compare by column
- **Host-language construct:** `<pre>` with space-aligned columns + header row, dark "terminal" styling
- **Locale / i18n:** en-US (technical English)
- **Failure mechanism:** F48/F34 — tabular CLI output in `<pre>`; column headers and per-column comparison conveyed only by alignment, and the prose depends on those columns

## Developer persona
A platform engineer wrote the runbook fast, between incidents. They ran the command, copy-pasted
the output into a fenced code block (which renders as `<pre>`), and wrote the explanation around it.
Code blocks are the correct, idiomatic way to show a command — so it never occurred to them that
this particular block is not a decorative log but a table whose *columns must be compared*, and
that a screen-reader user loses exactly the column structure the instructions rely on.

## Element / selector carrying the issue
`pre.term` — the header row (`NAME READY STATUS RESTARTS AGE`) and each pod row are space-aligned
plain text. The READY/STATUS/RESTARTS relationships the prose tells the reader to compare exist
only as visual columns. (Decorative use of `<pre>` for a log would be fine; here the relationships
are load-bearing.)

## Exact accessibility mechanism
A screen reader reads each line as one run, collapsing the alignment spaces, and the header row is
just the first such line — never associated with the data lines. The user hears:
*"checkout-7d9f8c6b4-pl4mn 0/1 CrashLoopBackOff 8 4m"* as a flat string and cannot map `0/1` to
"READY" or `8` to "RESTARTS" without having memorized the header order and counted tokens. The
instruction "scan down the STATUS column" is impossible: there is no STATUS column to scan, only
the third token of each line. Comparing READY across rows (a 2-D operation) is unavailable in a
1-D text stream. The diagnosis the page promises is therefore unreachable for AT users.

## Expected ACT-style outcome
**failed** (SC 1.3.1). The column relationships that the content explicitly requires the reader to
use are conveyed only by character alignment and are not programmatically determinable.

## Why automated tools miss it
Pasted CLI output inside `<pre>` is the single most common and entirely valid use of the element;
no automated rule can distinguish a decorative terminal log from a table whose columns must be
compared. There is no table/role/attribute for any ACT 1.3.1 rule to evaluate, so axe-core, WAVE,
and Lighthouse report nothing. Determining that THIS `<pre>` carries load-bearing column
relationships — by reading the surrounding instructions and the aligned data — is human semantic
judgment.

## Citation
**Reference:** WCAG Technique F48 (`wcag-techniques/failures/F48.html`)
> "Instead, the HTML table element is intended to present tabular data. Assistive technologies use the structure of an HTML table to present data to the user in a logical manner. This structure is not available when using the pre element."

**Reference:** WCAG Technique F34 (`wcag-techniques/failures/F34.html`)
> "When tables are created in this manner there is no way to indicate that a cell is intended to be a header cell, no way to associate the table header cells with the table data cells, or to navigate directly to a particular cell in a table."
