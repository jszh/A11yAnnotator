# case-07 — Flight seat-selection step, descriptive title (PASSED boundary)

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-meaningless-out-of-context (Limb 2 — descriptiveness)
- **Expected ACT outcome:** **passed** (boundary variant)
- **Page:** `case-07.html`

## Scenario
The seat-selection step of a flight booking on "SkyArc Airways" (flight SA 0118,
JFK→LHR, Aug 12). This is the **boundary** member of the set: the SAME deictic wizard
context as the failing pages (a step whose forward action is "Select your seats"),
but a `<title>` that is self-identifying out of context:

> `Select seats — JFK→LHR Aug 12 — SkyArc Airways`

## Element / selector carrying the issue
`head > title` — here it does NOT carry an issue. It pairs the action ("Select
seats") with a standalone identifier (the specific flight JFK→LHR Aug 12 and the site
SkyArc Airways), so it survives detachment.

## Exact accessibility mechanism (what AT experiences)
Read alone in a tab, in browser history, or in a window list, the title tells a
returning user the action (select seats), the exact flight (JFK→LHR, Aug 12), and the
site (SkyArc Airways). With several airline tabs open the user can tell them apart;
in history the entry is recognisable weeks later. The body richness is identical to a
failing page in this set — the difference is purely that the title contributes a
standalone identifier rather than a bare deictic fragment.

## Why this PASSES and why the boundary matters
This sharpens the aspect: the failure on cases 01–06 is **not** the wizard context or
the action word ("Select", "Continue", "Step") — it is the **absence of a standalone
identifier**. Pairing the same action verb with a real subject (flight + site) makes
the title out-of-context-useful and the page passes 2.4.2. Note that **automated
tools cannot tell this PASS from the corresponding "Select" FAIL**: both have a
non-empty title that overlaps the body lexically. The PASS/FAIL line is exactly the
human out-of-context judgement that 2.4.2 requires and that axe/WAVE/Lighthouse do
not make.

## Citation
> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> "The title of each web page should:" … "Identify the subject of the web page" …
> "Make sense when read out of context, for example by a screen reader or in a site
> map or list of search results" … "It may also be helpful for the title to" …
> "Identify the site or other resource to which the web page belongs"

> **Reference:** WCAG Understanding 2.4.2 — *Examples of Page Titled (A web
> application)* (`wcag-understanding/page-titled.html`)
>
> "A banking application lets users inspect their bank accounts, view past statements,
> and perform transactions. The web application dynamically generates titles for each
> web page, e.g., \"Bank XYZ, accounts for Alex Smith\" \"Bank XYZ, December 2005
> statement for Account 1234-5678\"."

> **Reference:** WCAG Technique G127 — *Identifying a web page's relationship to a
> larger collection of web pages* (`wcag-techniques/general/G127.html`)
>
> "In other cases the information is provided by including the relevant information in
> the title of the web page."
