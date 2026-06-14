# Accessibility Aspects in WAI "How People with Disabilities Use the Web"

This document inventories the accessibility aspects covered by the W3C WAI resource **How People with Disabilities Use the Web**, as mirrored in this repository under
`wai-website-main/pages/fundamentals/people/people-use-web/`.

The resource has three sections, all covered below:

1. **Diverse Abilities and Barriers** (`abilities-barriers/` — auditory, cognitive, physical, speech, visual)
2. **Tools and Techniques** (`tools-techniques/` — perception, presentation, input, navigation/interaction)
3. **Stories of Web Users** (`user-stories/` — nine personas with concrete barrier examples)

All excerpts are **verbatim and unmodified** from the source documents. See the
[Attribution](#attribution) section for source links and license.

---

## 1. Aspects from "Diverse Abilities and Barriers"

Each barrier listed by WAI is an accessibility aspect that web content can get right or wrong. Grouped by the disability page that lists it (many aspects affect several groups; WAI itself notes the lists "are not a complete list of all disabilities or barriers").

### 1.1 Visual disabilities ([visual.md](wai-website-main/pages/fundamentals/people/people-use-web/abilities-barriers/visual.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| V1 | Text alternatives for images and controls | "Images, controls, and other structural elements that do not have equivalent text alternatives." |
| V2 | Resizable text, images, layouts without information loss | "Text, images, and page layouts that cannot be resized, or that lose information when resized." |
| V3 | Orientation cues, page structure, navigational aids | "Missing visual and non-visual orientation cues, page structure, and other navigational aids." |
| V4 | Multimedia alternatives (text, audio, audio description) | "Video content that does not have text or audio alternatives, or an audio-description track." |
| V5 | Consistent, predictable, simple navigation and functions | "Inconsistent, unpredictable, and overly complicated navigation mechanisms and page functions." |
| V6 | Foreground/background contrast | "Text and images with insufficient contrast between foreground and background color combinations." |
| V7 | Support for user-defined custom colors | "Websites, web browsers, and authoring tools that do not support the use of custom color combinations." |
| V8 | Full keyboard support | "Websites, web browsers, and authoring tools that do not provide full keyboard support." |
| V9 | Properly coded structures for AT (lists, headings, tables) | "…some people do not see the content and rely on lists, headings, tables, and other page structures to be properly coded so that they can be identified by browsers and assistive technologies." |

### 1.2 Auditory disabilities ([auditory.md](wai-website-main/pages/fundamentals/people/people-use-web/abilities-barriers/auditory.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| A1 | Captions and transcripts for audio content | "Audio content, such as videos with voices and sounds, without captions or transcripts." |
| A2 | Media players: caption display and volume controls | "Media players that do not display captions and that do not provide volume controls." |
| A3 | Caption customization (text size, colors) | "Media players that do not provide options to adjust the text size and colors for captions." |
| A4 | Alternatives to voice-only interaction | "Web-based services, including web applications, that rely on interaction using voice only." |
| A5 | Sign language and easy-to-read text supplements | "Lack of sign language to supplement important information and text that is difficult to read." |

### 1.3 Cognitive and learning disabilities ([cognitive.md](wai-website-main/pages/fundamentals/people/people-use-web/abilities-barriers/cognitive.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| C1 | Simple processes (avoid complex multi-stage forms) | "Complex, multi-stage process such as forms." |
| C2 | Understandable navigation and page layouts | "Complex or inconsistent navigation mechanisms and page layouts that are difficult to understand and use." |
| C3 | Plain language (simple sentences, common words) | "Complex sentences that are difficult to read and unusual words that are difficult to understand." |
| C4 | Literal text (avoid unpredictable metaphors) | "Metaphors and other non-literal text whose meaning is not predictable from the usual meanings of the words." |
| C5 | Illustrations supporting long text | "Long passages of text without images, graphs, or other illustrations to highlight the context." |
| C6 | Control over moving/blinking content and background audio | "Moving, blinking, or flickering content, and background audio that cannot be turned off." |
| C7 | Authentication that does not rely on memory | "Passwords and access codes that rely on memory." |
| C8 | Time limits on activities | "Time-outs on activities" |
| C9 | Adaptable visual design (browser controls, custom style sheets) | "Visual page designs that cannot be adapted using web browser controls or custom style sheets." |
| C10 | Error-tolerant design | "Designs that make errors less likely and that make it easy for users to correct errors." |
| C11 | Consistent labeling of forms, buttons, content parts | "Consistent labeling of forms, buttons, and other content parts so that users understand what they are being asked to do." |
| C12 | Predictable link targets and interaction | "Predictable link targets, functionality, and overall interaction." |

### 1.4 Physical disabilities ([physical.md](wai-website-main/pages/fundamentals/people/people-use-web/abilities-barriers/physical.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| P1 | Full keyboard support | "Websites, web browsers, and authoring tools that do not provide full keyboard support." |
| P2 | Sufficient time limits | "Insufficient time limits to respond or to complete tasks, such as to fill out online forms." |
| P3 | Text alternatives for controls, including images of text | "Controls, including links with images of text, that do not have equivalent text alternatives." |
| P4 | Large clickable areas, time, error correction | "Providing large clickable areas, enough time to complete tasks, and error correction options for forms are important design aspects." |
| P5 | Visible focus indicators; skip mechanisms | "Other important design aspects include providing visible indicators of the current focus, and mechanisms to skip over blocks, such as over page headers or navigation bars." |
| P6 | Sequential keystrokes instead of chording | "…they may type single keystrokes in sequence or use sticky keys rather than typing simultaneous keystrokes (\"chording\") to activate commands." |

### 1.5 Speech disabilities ([speech.md](wai-website-main/pages/fundamentals/people/people-use-web/abilities-barriers/speech.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| S1 | Alternatives to voice-only services | "Web-based services, including web applications, that rely on interaction using voice only." |
| S2 | Non-phone contact channels | "Websites that offer phone numbers as the only way to communicate with the organizations." |

---

## 2. Aspects from "Tools and Techniques"

These pages describe what assistive technologies and adaptive strategies *require from content* in order to work.

### 2.1 Perception — hearing, feeling, seeing ([perception.md](wai-website-main/pages/fundamentals/people/people-use-web/tools-techniques/perception.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| T1 | Content convertible across forms (text is the pivot) | "Content in textual form can be more easily converted into other forms and is therefore particularly useful." |
| T2 | Author-provided alternatives (alt text, captions) | "…at least some level of human intervention is necessary to create textual descriptions for images and captions for audio content." |
| T3 | Correctly coded structures for screen readers / Braille | "Screen readers can process websites and apps with correctly coded headings, lists, links, button, and other structures much better." (video transcript) |
| T4 | Multi-modal notifications | "**Auditory, tactile, and visual notifications** – prompting or alerting the user in different ways such as by blinking or displaying visual dialogs, by using sound, or by vibration." |

### 2.2 Presentation — distinguishing and understanding ([presentation.md](wai-website-main/pages/fundamentals/people/people-use-web/tools-techniques/presentation.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| T5 | User-adjustable presentation (size, contrast, volume) | "Some people need larger text and image sizes or higher contrast between text and background colors to see the content better, and some people need louder audio with lower background noise to better hear the content." |
| T6 | Suppressible pop-ups and animations | "Some people need to turn off pop-up windows and animations that disorient or distract them." |
| T7 | No auto-playing sound (interferes with text-to-speech) | "A sound that is automatically played, such as background music on a website, can also distract people or interfere with text-to-speech software." |
| T8 | Coding that supports adaptation (fonts, colors, spacing, restructuring) | "While these changes are often managed using specialized browsers and tools, website authors need to provide adequate coding to support such adjustments and adaptations." |
| T9 | Document outline from heading hierarchy | "**Document outline** – representation of the content that only shows the headings and relevant structures (such as headings nesting and hierarchy) to help provide orientation and an overview of the contents." |
| T10 | Alternative representations of information | "…authors can provide different representations of the same information to address the widest audience possible, such as graphical and tabular representations of data for people with different learning styles." |

### 2.3 Input — typing, writing, clicking ([input.md](wai-website-main/pages/fundamentals/people/people-use-web/tools-techniques/input.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| T11 | Keyboard-usable forms, links, functionality | "For example, forms, links, and other functionality need to be usable by keyboard." |
| T12 | No keyboard focus traps; large clickable areas | "In particular, applications (\"client-side scripting\"), embedded media players, and other programmatic objects need to provide full keyboard support that does not trap the keyboard focus within the program and larger clickable areas for buttons and links." |
| T13 | Time, error messages, and correction options | "Accessible content also provides enough time to complete tasks, clear and helpful error messages and options for correcting input." |
| T14 | Compatibility with speech recognition, eye tracking, switches | "**Alternative keyboard and mouse** – hardware and software primarily used by people with cognitive and physical disabilities to help interact with the computer." |

### 2.4 Navigation / Interaction — finding and orienting ([navigation.md](wai-website-main/pages/fundamentals/people/people-use-web/tools-techniques/navigation.md))

| # | Aspect | Verbatim excerpt |
|---|--------|------------------|
| T15 | Consistency and predictability of labels | "**Consistency and predictability** – labeling of functions such as links, buttons, and controls should be consistent, and the expected function should be predictable from the label." |
| T16 | Descriptive titles, headings, and labels (usable out of context) | "**Descriptive titles, headings, and labels** – page titles, section headings, and labels for forms, links, and controls are sometimes read on their own or out of context and need to be descriptive." |
| T17 | Helpful error and success messages | "**Helpful error and success messages** – dialogs and other messages, such as after submitting forms, need to help users complete their tasks and avoid disorientation, distraction, confusion, or discomfort." |
| T18 | Multiple navigation mechanisms (search, sitemap, menus) | "**Multiple navigation mechanisms** – websites need to provide multiple ways to locate web pages, for example by providing sitemaps and search functionality in addition to hierarchical navigation menus." |
| T19 | Skip links over repetitive blocks | "**Skip links** – mechanisms to allow keyboard users to skip over repetitive blocks of content such as page headings, navigation bars, or menus." |
| T20 | Visual orientation cues | "**Visual orientation cues** – examples include using background colors to indicate different parts of the content, using unique headings, and placing relevant information in prominent areas of a web page." |
| T21 | Headings designed for non-visual overview/scanning | "A person is not seeing the screen and needing to get an overview and orient themselves by scanning the headings on a web page; the headings need to be also designed to support such purposes." |

---

## 3. Aspects from "Stories of Web Users" (barrier examples)

The nine personas restate many aspects above in concrete form; aspects *not already itemized* in sections 1–2, or given a distinctly sharper formulation, are listed here.

| # | Aspect | Story | Verbatim excerpt |
|---|--------|-------|------------------|
| U1 | Visible focus styling on links and form fields | Ade (story-one) | "When I tab through links and form fields there is no visual styling to show me which element I am on." |
| U2 | Adjustable/extendable time-outs | Ade (story-one) | "I usually take much longer to complete long forms or processes and often get timed out." |
| U3 | Saving progress in long multi-step forms | Ade (story-one) | "Completing long forms with no way to save progress and take a break can be tiring." |
| U4 | Keyboard-closable pop-up windows/modals | Ade (story-one) | "When a window opens and I can't close it using only the keyboard it can be difficult." |
| U5 | Literal language; spelled-out acronyms and abbreviations | Ian (story-two), Stefan (story-eight) | "I have difficulty understanding metaphors, acronyms, abbreviations, and words that aren't used in their literal sense." |
| U6 | Consistent layout and navigation across pages | Ian (story-two), Lakshmi (story-three), Marta (story-seven) | "I get confused when I go to a different page on a website and the layout and navigation aren't the same." |
| U7 | Headings as screen-reader scanning structure | Lakshmi (story-three) | "When sites are laid out using properly marked up headings and paragraphs, I can use hot keys in my screen reader to quickly jump from one heading or paragraph to another, stopping at anything that sounds interesting." |
| U8 | Keyboard-operable buttons and links | Lakshmi (story-three) | "Sometimes I can't control things on websites such as buttons and links. I can hear they are there but I can't press them." |
| U9 | Clear error messages with correction instructions | Lakshmi (story-three) | "Sometimes when I fill in a form on a website it won't let me submit it and it isn't clear why not." |
| U10 | Screen-reader notification of dynamic content changes | Lakshmi (story-three) | "There are times when content on a website changes but I don't always know about it." |
| U11 | Escapable modal windows | Lakshmi (story-three) | "Some sites have modal windows that I can get stuck in because I can't seem to find anyway to close it." |
| U12 | Screen-reader/shortcut key conflicts; accessible CAPTCHA; clear form fields | Lakshmi (story-three) | "…such as when images don't include alternative text or short-cut keys conflict with the screen reader commands. Other sources of frustration include multiple levels of navigation (e.g., nested menus), forms that don't make it clear to the screen reader what the fields are meant to contain, and visual CAPTCHA with either no or a poor auditory alternative." |
| U13 | Information not conveyed by color alone | Lexie (story-four) | "When filling out a form online, required fields and errors are marked with a red outline." |
| U14 | Charts labeled directly or with texture, not color only | Lexie (story-four) | "The columns are directly labelled or use a texture as well as color." |
| U15 | Breadcrumbs / orientation within a site | Sophie (story-five), Elias (story-nine) | "A breadcrumb at the top of the page that shows all of the pages I was on helps me feel oriented and lets me go back to a familiar page." |
| U16 | Links visually distinct from text and headings | Sophie (story-five) | "Designers like to get fancy with links and sometimes it's hard to figure out the difference between the links and highlighted text or headings." |
| U17 | Clear labels, required-field marking, format examples | Sophie (story-five) | "Tell me what fields are required, put a simple and clear label on each form field, and give me an example of the format they want, especially for dates." |
| U18 | Stoppable moving/animated content | Sophie (story-five), Ian (story-two), Elias (story-nine) | "Moving or animated text or pictures is really distracting. It keeps pulling my attention away from what I'm trying to do." |
| U19 | Accurate, well-positioned, readable captions | Dhruv (story-six) | "…sometimes the captions don't convey the exact words that the instructor is saying, especially in some of my more technical classes." |
| U20 | Transcripts accessible to Braille devices (not embedded-only captions) | Marta (story-seven) | "Some videos only have embedded captions which I can't access easily." / "Having a transcript is a big help. It is much easier for me to read with my Braille device." |
| U21 | Accessible authentication (no inaccessible CAPTCHA) | Marta (story-seven), Elias (story-nine) | "If a site has a CAPTCHA that uses images or audio then I just can't use it - it can take me ages to work out the image and I can't hear the audio alternative." |
| U22 | Search with spelling tolerance/suggestions | Stefan (story-eight) | "I like when search tools offer alternative spellings or alternative search suggestions instead of just returning no results." |
| U23 | Respecting user browser settings (font, size, spacing) | Stefan (story-eight) | "I use browser settings to specify the font, text size, and line spacing I need but some sites don't display my settings." |
| U24 | Text reflow on resize without 2-D scrolling | Elias (story-nine) | "When I resize a website using my browser some of the text disappears or is cut short and sometimes I have to scroll across the screen as well as down." |
| U25 | Tables that adapt under zoom | Elias (story-nine) | "Online tables sometimes have a lot of space between the columns and when I'm zoomed it, I have to scroll from left to right to see all of the content and I often miss the association from one column to the next." |
| U26 | Password reset options / remembered user information | Elias (story-nine) | "An option to remember my password for this site and a means of resetting my password if I need to." |

---

## Attribution

Excerpts in this document are reproduced **unmodified** from
[How People with Disabilities Use the Web](https://www.w3.org/WAI/people-use-web/),
W3C Web Accessibility Initiative (WAI). Editor: Shadi Abou-Zahra. Previous editor: Judy Brewer.
Developed by the Education and Outreach Working Group ([EOWG](https://www.w3.org/WAI/EO/)).
Copyright © W3C ® (MIT, ERCIM, Keio, Beihang).

Source pages:

- Overview: https://www.w3.org/WAI/people-use-web/
- Diverse Abilities and Barriers: https://www.w3.org/WAI/people-use-web/abilities-barriers/
  ([auditory](https://www.w3.org/WAI/people-use-web/abilities-barriers/auditory/),
  [cognitive](https://www.w3.org/WAI/people-use-web/abilities-barriers/cognitive/),
  [physical](https://www.w3.org/WAI/people-use-web/abilities-barriers/physical/),
  [speech](https://www.w3.org/WAI/people-use-web/abilities-barriers/speech/),
  [visual](https://www.w3.org/WAI/people-use-web/abilities-barriers/visual/))
- Tools and Techniques: https://www.w3.org/WAI/people-use-web/tools-techniques/
  ([perception](https://www.w3.org/WAI/people-use-web/tools-techniques/perception/),
  [presentation](https://www.w3.org/WAI/people-use-web/tools-techniques/presentation/),
  [input](https://www.w3.org/WAI/people-use-web/tools-techniques/input/),
  [navigation](https://www.w3.org/WAI/people-use-web/tools-techniques/navigation/))
- Stories of Web Users: https://www.w3.org/WAI/people-use-web/user-stories/
