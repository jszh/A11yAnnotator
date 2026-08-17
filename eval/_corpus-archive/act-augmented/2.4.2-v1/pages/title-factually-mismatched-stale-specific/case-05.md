# case-05 — Weather page titled with the same city name but the wrong state

## Scenario
A weather app view. The `<title>` reads **"Weather for Portland, Maine — 7-Day
Forecast"**, but every locating signal in the body identifies **Portland, Oregon**: the
location chip ("Portland, OR 97205"), the `<h1>` ("Portland, Oregon — Current
Conditions"), a geo strip with "State: Oregon (OR)", "County: Multnomah", "Time zone:
Pacific (PST)", coordinates 45.52° N / 122.68° W, the forecast section heading ("7-day
forecast for Portland, OR"), and a regional outlook naming the Willamette Valley,
Mt. Hood, and Vancouver, Washington. There are two well-known Portlands; the title
disambiguates to the **wrong** one. This is the subtlest possible mismatch: the salient
token "Portland" is shared verbatim with the body — only the state qualifier
("Maine" vs "Oregon"/"OR") is wrong.

## Element / selector carrying the issue
- `head > title` — `Weather for Portland, Maine — 7-Day Forecast`
- Contradicted by `.bar .loc` (`Portland, OR 97205`), `h1#loc-h1`
  (`Portland, Oregon — Current Conditions`), the `.geo` strip (`State: Oregon (OR)`,
  `Pacific (PST)`), `.week h2` (`7-day forecast for Portland, OR`), and the regional
  outlook (`Willamette Valley`, `Mt. Hood`).

## Exact accessibility mechanism (what AT experiences and why it fails)
The whole purpose of a weather page title is to let the user confirm *which* location's
forecast they are viewing — location is the page's defining specific. AT announces
"Weather for Portland, Maine," so a user planning travel to Maine, or scanning open tabs
for their Maine forecast, accepts this page as authoritative for Portland, ME. The data
is for Portland, OR (Pacific time, 54°F, marine layer). Because "Portland" is ambiguous,
the wrong state is not a harmless typo — it points the user to a different city 3,000
miles away. The title does not identify the contents of this page and would mislead a
user distinguishing it from a genuine Portland, ME forecast page. Limb-2
(descriptiveness) failure per F25.

## Why automated tools cannot detect it
"Weather for Portland, Maine — 7-Day Forecast" is non-empty, unique, idiomatic, and
maximally descriptive in shape; it passes 2779a5 and any descriptiveness heuristic
trivially. A token/lexical-overlap check is *defeated by design*: the title's salient
content word "Portland" appears throughout the body, so overlap is high and the title
looks confirmed. Detecting the failure requires geographic entity disambiguation —
knowing that Portland needs a state qualifier, extracting the body's qualifier (Oregon,
via OR, Pacific time, Multnomah County, Willamette Valley) and comparing it to the
title's qualifier (Maine). No accessibility rule engine resolves "which Portland"; this
is pure human/world-knowledge cross-checking.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** WCAG Understanding 2.4.2 Page Titled — Examples (A web application)
> File: `wcag-understanding/page-titled.html`
>
> "The web application dynamically generates titles for each web page, e.g., \"Bank XYZ, accounts for Alex Smith\" \"Bank XYZ, December 2005 statement for Account 1234-5678\"."
