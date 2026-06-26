# case-06 — Analytics SPA on "Revenue by Region" but `<title>` lags at "Console"

## Scenario
An analytics console (Metricly). **Variant trigger: the title lags one navigation behind.** Unlike the
other failing cases, this router *does* assign `document.title` — but an off-by-one bug snapshots the title
*before* rendering and writes the snapshot back afterward, so it always re-applies the previous view's name.
The app boots on the "Console" overview (title "Console"), the user navigates to the **Revenue by Region**
report, the report renders in the body (heading, a bar chart with per-region figures, and a breakdown table),
but the title is re-set to **"Console"** — the prior view's name, not the report's.

## Element / selector carrying the issue
- `head > title` — text node `"Console"` (set dynamically, but to the stale prior value).
- Contradicting evidence: `h1` = "Revenue by Region"; `.range` = "Q2 2026 (Apr 1 – Jun 30)"; chart caption
  "Revenue by region (Q2 2026 …)"; nav `a[aria-current="page"]` = "Reports".

## Exact accessibility mechanism (what AT experiences and why it fails)
This page demonstrates that the failure is not only "the developer forgot to set the title" — even a title
that *is* dynamically assigned fails the SC if it names the wrong view. The user is looking at the Revenue
by Region report, but the accessible page name announced and shown in the tab is "Console" (the overview).
A screen-reader user trusting the title would believe they are still on the overview; the title actively
mislabels the current location. It neither identifies the report's topic nor distinguishes the report view
from the overview view — they share the title "Console".

## Expected ACT-style outcome
**failed** (limb 2). Title present, non-empty, and even dynamically set (2779a5 passes), but reflects the
previous view rather than the current Revenue-by-Region report.

## Why automated tools miss it
"Console" is a non-empty, valid `<title>`, so ACT 2779a5 passes; the title is even updated by script, so any
heuristic that merely checks "is the title dynamic?" would also be satisfied. Only by reading the rendered
report's heading/caption/table and comparing them to the title text can one see that the title names the wrong
view. That title↔topic correspondence check is semantic and requires understanding what the page is *about*;
no structural or presence checker performs it. The one-navigation lag is a runtime sequencing defect with no
trace in a static head snapshot.

## Citation
> **WCAG 2.2 Understanding — Understanding SC 2.4.2 Page Titled (`wcag-understanding/page-titled.html`):**
> "In cases such as Single Page Applications (SPAs), where various distinct pages/views are all nominally
> served from the same URI and the content of the page is changed dynamically, the title of the page
> should also be changed dynamically to reflect the content or topic of the current view."

> **WCAG Techniques — F25 (`wcag-techniques/failures/F25.html`):**
> "This describes a failure condition when the web page has a title, but the title does not identify the
> contents or purpose of the web page."
