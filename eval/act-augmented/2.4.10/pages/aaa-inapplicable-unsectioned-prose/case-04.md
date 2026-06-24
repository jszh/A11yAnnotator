# case-04 — Multi-topic how-to guide disguised as flowing prose, missing all section headings (FAIL twin)

## Scenario
A smart-thermostat "Getting Started" help article reads like chatty, continuous prose, but
it is genuinely **organized into five distinct sections**, each a self-contained help topic
the reader walks through in order:
1. unboxing & wiring the unit,
2. connecting it to Wi-Fi,
3. creating a heating schedule,
4. using geofencing,
5. troubleshooting a unit that won't connect.

These are exactly the kind of topical sections a reader would want to jump to ("just take me
to troubleshooting"). The content *is* "organized into sections," so 2.4.10 applies — and
because **none of the five topics has a heading**, the page **fails**. This is the deliberate
twin of the genuinely-unsectioned PASS cases (letter, speech, story): same surface (paragraphs,
no headings) but the *genre* is a multi-topic procedural guide, which flips the verdict.

## Attribute tuple
- **content-domain**: SaaS / consumer-IoT help center (smart-home device support)
- **UI-component/pattern**: knowledge-base article with breadcrumb, search, and "was this helpful?" widget
- **host-language construct**: single `<article>` with `<h1>` and five sibling `<p>` blocks — each `<p>` is a distinct procedural topic; **no** `<h2>`/`<h3>`
- **locale/i18n**: en-US (North American HVAC terminals)
- **failure-mechanism**: content genuinely organized into five topical sections, all rendered as heading-less paragraphs, with a conversational tone that disguises the underlying section structure

## Developer persona
A support author wrote the article in the help-desk WYSIWYG by "just typing it out the way
I'd explain it to a friend." Because the prose flows conversationally, the editor preview
looked complete and human, and the author never stepped back to see that the article is really
five how-to topics in a row. The CMS auto-inserts the `<h1>` from the article title field, so
`page-has-heading-one` is satisfied and nothing nagged them to add `<h2>`s. The friendliness
of the writing is precisely what hid the missing structure.

## Element / selector carrying the issue
- FAIL: `article > p` blocks 1–5 (the five procedural topics: wiring, Wi-Fi, schedule,
  geofencing, troubleshooting). Each begins a distinct section of content yet carries no
  heading. (Markers in the source comments map each `<p>` to its topic.)

## Exact accessibility mechanism
A screen-reader user lands on this article wanting just the *troubleshooting* steps — the most
common reason someone opens a getting-started guide after the fact. They pull up the heading
list and find a single entry: the `<h1>` "Getting Started with Lumen Thermostat." There is no
"Connecting to Wi-Fi," no "Troubleshooting" — so the only way to reach the won't-connect steps
is to arrow through wiring, Wi-Fi, scheduling, and geofencing first, reading or skimming each
in full. This is exactly the navigation loss 2.4.10 prevents: when content is organized into
sections, headings let users "jump the focus from heading to heading … to find quickly content
of interest" (Understanding, Benefits). The five topics ARE sections; their headings are
missing; the criterion fails. Contrast with the PASS cases, whose continuous prose has no such
jumpable topics to lose.

## Expected ACT-style outcome
**failed** — the page is organized into five distinct topical sections (a procedural how-to
guide) and none of them has a section heading.

## Why automated tools miss it
The body is five clean `<p>` elements; the single `<h1>` satisfies `page-has-heading-one`;
there are no empty or out-of-order headings (there are no sub-headings at all). So axe-core,
WAVE, and Lighthouse report no heading problem. The structure that *makes* this a failure —
that the five paragraphs are five distinct procedural topics a user would navigate between —
exists only in the *meaning* of the prose, not in the markup, and the conversational tone is
engineered (by an author writing naturally) to read as one flow. Recognising the section
structure requires reading and comprehending all five paragraphs and knowing the genre is a
multi-topic guide; no automated checker has that semantic model, which is why this exact
case is what the ACT corpus's degenerate stubs (a bare SVG, a one-paragraph excerpt) fail to
cover.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections. For instance, long documents are often divided
> into a variety of chapters, chapters have subtopics, etc. When such sections exist, they
> need to have headings that introduce them."

> **WCAG 2.2 Understanding 2.4.10 — Benefits**
> "People who navigate content by keyboard will be able to jump the focus from heading to
> heading, enabling them to find quickly content of interest."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content (Tests)**
> "1. Check that the content is divided into separate sections. 2. Check that each section on
> the page starts with a heading."
