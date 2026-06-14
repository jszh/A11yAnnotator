# Coverage Comparison: Our Annotation Taxonomy vs. WAI "How People with Disabilities Use the Web"

This report compares the nine annotation categories in [categories.json](categories.json)
(WCAG 2.2-based, used by the element-level human annotation UI) against the accessibility
aspects inventoried from the WAI resource in
[WAI-PEOPLE-USE-WEB-ASPECTS.md](WAI-PEOPLE-USE-WEB-ASPECTS.md). Aspect IDs (V1, C6, T19, U10, …)
refer to that document.

**Scope note.** Our taxonomy is the scope of *human judgment* in the annotation pipeline:
annotators label sampled DOM elements (20 per page, 70% AT-focusable) against these nine
categories. A separate machine layer — axe-core, with all 106 rules routed to the same nine
categories via [axe-map.json](axe-map.json) — runs alongside as a sidebar aid. **Issues that
heuristic checkers can determine programmatically and deterministically are specifically not
part of the human annotation scope**; spending annotator effort on them would duplicate what
axe already decides reliably. That design choice explains several apparent "gaps" below and
is called out explicitly in §3.1.

---

## 1. Our categories and their WCAG 2.2 scope

| Cat | Name | WCAG SCs in scope |
|-----|------|-------------------|
| cat_1 | Missing or Incorrect Accessible Names | 1.1.1, 2.4.4, 2.4.6, 4.1.2 |
| cat_2 | Semantic Structure and Reading Order | 1.3.1, 1.3.2, 2.4.3 |
| cat_3 | Heading and Page Structure | 2.4.2, 2.4.10 |
| cat_4 | Keyboard-Inaccessible Interaction | 2.1.1, 4.1.2 |
| cat_5 | Focus Traps and Visibility | 2.1.2, 2.4.7 |
| cat_6 | Visual Presentation, Color, and Contrast | 1.4.1, 1.4.3, 1.4.5, 1.4.11 |
| cat_7 | State or Status Changes Not Programmatically Exposed | 1.3.1, 4.1.3 |
| cat_8 | Reflow and Content on Hover/Focus | 1.4.10, 1.4.13 |
| cat_9 | Error Identification, Labels, and Instructions | 3.3.1, 3.3.2, 3.3.3 |

---

## 2. WAI aspects we cover

| WAI aspect(s) | Our category | Notes |
|---------------|--------------|-------|
| V1 text alternatives; P3 controls/images-of-text alternatives; T2 author-provided descriptions; U12 missing alt | **cat_1** | Direct match. Crucially, our human annotation judges *adequacy* of names/alt text, not just presence — the part heuristic checkers cannot decide. |
| V9/T3 properly coded structures (lists, headings, tables); U7 heading-based SR scanning | **cat_2**, **cat_3** | 1.3.1 + 1.3.2 + 2.4.3 (cat_2) and 2.4.2 + 2.4.10 (cat_3). |
| T9 document outline; T16 descriptive titles/headings/labels; T21 headings for non-visual overview | **cat_3** (headings, titles), **cat_1** (2.4.6 labels), **cat_9** (form labels) | Split across categories but covered. |
| V8/P1 full keyboard support; T11 keyboard-usable forms/links; U8 keyboard-operable buttons | **cat_4** | Direct match (2.1.1 + 4.1.2). Our virtual-screen-reader/keyboard inspection workflow tests this directly. |
| P5/U1 visible focus indicators; T12/U4/U11 focus traps, inescapable modals | **cat_5** | Direct match (2.1.2 + 2.4.7). |
| V6 contrast; U13 color-only required/error marking; U14 color-only chart encoding; U16 links distinguishable only by color | **cat_6** | 1.4.1 + 1.4.3 + 1.4.11 + 1.4.5. |
| U10 dynamic content changes not announced to screen reader | **cat_7** | Direct match (4.1.3 Status Messages + 1.3.1). |
| V2 resize without information loss; U24 reflow without 2-D scrolling; U25 tables under zoom | **cat_8** | Covered via 1.4.10 Reflow. (See §3.3 for the adjacent SCs we do not include.) |
| C10/T13/T17/U9 error messages and correction; U17 labels, required-field marking, format examples; P4 (error-correction part) | **cat_9** | 3.3.1 + 3.3.2 + 3.3.3. |

Overall: our nine categories track the **perceivability-by-AT and operability-by-keyboard core** of the WAI material — the barriers WAI attributes chiefly to blind, low-vision, and motor-impaired users. This matches the annotation method (forced screen-reader and keyboard inspection per element).

---

## 3. WAI aspects we do not cover, and why

### 3.1 Specifically excluded: programmatically determinable by heuristic checkers

These aspects are deterministic markup/DOM facts. axe-core decides them with essentially no
judgment required, so they are **deliberately not in the human annotation taxonomy**. They are
still surfaced in the tool (axe sidebar; each rule routed to a category by axe-map.json), but
annotators are not asked to label them, and the corresponding WCAG SCs are intentionally absent
from categories.json.

| WAI aspect | Heuristic check (axe rule) | WCAG SC (not in our taxonomy) |
|------------|---------------------------|-------------------------------|
| T19 skip links / P5 skip mechanisms (presence) | `bypass`, `region` | 2.4.1 Bypass Blocks |
| V2 zoom not disabled (the markup part) | `meta-viewport` | 1.4.4 Resize Text (partial) |
| C6/T7 auto-playing audio (presence) | `no-autoplay-audio` | 1.4.2 Audio Control |
| C6/U18 blinking/moving markup (legacy elements) | `blink`, `marquee` | 2.2.2 Pause, Stop, Hide (partial) |
| A1 caption track presence on media elements | `video-caption`, `audio-caption` | 1.2.1/1.2.2 (presence only) |
| Page language declared/valid (prerequisite for SR pronunciation, implied by T3) | `html-has-lang`, `valid-lang` | 3.1.1/3.1.2 Language of Page/Parts |
| Timed refresh/redirect (relates to C8/P2) | `meta-refresh` | 2.2.1/2.2.4 (markup-detectable part) |
| Broken ARIA references, duplicate IDs (plumbing under V9) | `aria-valid-attr-value`, `duplicate-id`, etc. | 4.1.x plumbing |

The dividing line we draw: **presence is machine-checkable; adequacy is human.** E.g., axe
checks that an image *has* alt text (excluded from human scope as a standalone question), while
cat_1 asks the human whether the name is *correct and useful*. Same split for captions
(presence → axe; accuracy, U19 → human, though see §3.2), and skip links (presence → axe;
whether they work → cat_4/cat_5 if sampled).

### 3.2 Out of scope of single-page, element-level, static annotation

These WAI aspects require context our unit of annotation (one sampled element on one frozen
page) cannot provide. They are genuine limitations of the dataset design, not of the category
list per se.

| WAI aspect | Why out of scope |
|------------|------------------|
| U6/C2/V5/T15 consistent layout, navigation, and labeling **across pages** (WCAG 3.2.3, 3.2.4) | Cross-page property; we annotate pages independently. |
| T18 multiple navigation mechanisms; U15 breadcrumbs (2.4.5 Multiple Ways) | Site-level property. |
| C8/P2/U2 time limits and time-outs; U3 saving progress (2.2.1) | Requires live sessions and server behavior; our pages are static snapshots served offline. |
| C7/U21/U26 memory-free authentication, CAPTCHA alternatives, password reset (3.3.8 Accessible Authentication) | Login/CAPTCHA flows are not exercised in snapshots. |
| U19/U20/A1–A3 caption *accuracy*, transcript quality, audio description, sign language (1.2.x quality) | Multimedia quality judgment; our AI-generated pages contain little to no real multimedia, and snapshots don't play media. |
| S1/S2/A4 voice-only services, phone-only contact channels | Service-design property, not page markup. |
| U22 search spelling tolerance | Requires functional backend. |

### 3.3 Not covered and *not* fully machine-checkable — true taxonomy gaps

These are the limitations worth flagging for the paper: aspects WAI treats as first-class
barriers, which need human judgment (heuristics are absent or weak), and which our categories
currently don't ask about.

| WAI aspect | Nearest WCAG SC | Gap |
|------------|-----------------|-----|
| C3/C4/U5 plain language, literal text, spelled-out acronyms; C5 illustrations for long text; A5 easy-to-read supplements | 3.1.3–3.1.5 (AAA) | The whole **cognitive/readability dimension** is absent. This is the largest thematic gap: WAI dedicates a full disability page to it, and AI generators plausibly differ on it. WCAG itself only covers it at AAA, which is presumably why it's excluded — worth stating explicitly. |
| P4/T12 large clickable areas / target size | 2.5.8 Target Size (Minimum), AA | Human-relevant, only partially heuristic (size is measurable, but exceptions need judgment). Not in any category. |
| Speech-input compatibility: visible label contained in accessible name | 2.5.3 Label in Name (A) | WAI's input page covers speech recognition users; mismatched name/label breaks voice control. Adjacent to cat_1 but its SC is not listed; annotators aren't prompted to check label/name agreement. |
| U12 single-key shortcut conflicts with screen readers | 2.1.4 Character Key Shortcuts (A) | Not covered; needs interaction testing. |
| C12 predictable interaction *within* a page (context changes on focus/input) | 3.2.1, 3.2.2 (A) | Observable on a single page; needs interaction; not in any category. |
| C6/U18 stoppable animations/auto-updating content beyond legacy markup (CSS/JS animation) | 2.2.2 (A) | axe only catches `blink`/`marquee`/autoplay; modern animated content needs human judgment. Not in scope. |
| Flashing content (seizure risk) | 2.3.1 (A) | Not covered by categories; not reliably heuristic. Likely rare in our corpus, but a stated exclusion is better than silence. |
| C9/T8/U23 honoring user style/spacing adaptations | 1.4.4 Resize Text, 1.4.12 Text Spacing (AA) | cat_8 has Reflow (1.4.10) but not these two adjacent AA criteria; a page can pass reflow yet break under text-spacing overrides. |
| U3 redundant re-entry of information | 3.3.7 Redundant Entry (A) | New in WCAG 2.2, multi-step; partially excluded by §3.2 anyway. |

### 3.4 Disability-coverage skew (summary limitation)

Mapping the nine categories back to WAI's five disability pages: **visual** and **physical/motor**
barriers are well covered (7–8 of 9 categories serve them); **auditory** is covered only via the
machine layer (caption presence) with no human category; **speech** is entirely out of scope;
**cognitive** is covered only where it overlaps structure/errors/consistency (cat_2, cat_3, cat_9)
and not at all for language complexity, distraction, or memory load. Any claims from the annotated
dataset should be scoped as covering *perceivability and operability* accessibility, not WCAG
conformance or accessibility for all disability groups.

---

## 4. Suggested wording for the limitations section

> Our taxonomy deliberately excludes violations that deterministic heuristic checkers (axe-core)
> already detect reliably — e.g., missing `alt`/`lang`/`title` attributes, caption-track presence,
> zoom-disabling viewport metadata, skip-link presence — and reserves human annotation for issues
> requiring judgment (adequacy of names, correctness of structure, operability under keyboard and
> screen reader). It further excludes (a) cross-page and site-level properties (consistent
> navigation, multiple ways), (b) session-dependent behavior (time limits, authentication), and
> (c) media quality (caption accuracy, audio description), which our static single-page snapshots
> cannot exercise. Finally, cognitive-accessibility aspects such as plain language (WCAG 3.1.3–3.1.5,
> AAA) and target size (2.5.8) are not covered; the dataset therefore measures perceivability- and
> operability-related accessibility rather than full WCAG conformance.

---

*WAI aspect excerpts referenced here come from [How People with Disabilities Use the Web](https://www.w3.org/WAI/people-use-web/), W3C Web Accessibility Initiative (WAI); see WAI-PEOPLE-USE-WEB-ASPECTS.md for verbatim excerpts and full attribution.*
