# case-05 — <template> clone bundling role="status" with its Arabic confirmation text (RTL pharmacy refill portal)

## Scenario
صيدلية النخيل (Al-Nakhil Pharmacy) runs an Arabic, right-to-left patient portal for prescription refills. Each
"تجديد" (Renew) button clones a `<template id="renew-tpl">` whose markup **already contains**
`<div class="status-card" role="status" aria-live="polite">…تم استلام طلب تجديد…</div>` with the confirmation copy
baked in, fills in the medication name, and appends the clone into an empty `#status-area`. The resting DOM is a
valid Arabic `role="status"` live region with a complete refill confirmation — a static scan passes. But the live
region clone enters the document already holding its content; no empty live region was registered at load, so the
"تم استلام طلب تجديد" (refill received) status is not announced to screen-reader users.

## Attribute tuple
- **content-domain:** healthcare / pharmacy patient portal (prescription refill)
- **UI-component/pattern:** same-page refill confirmation card cloned from a `<template>`
- **host-language construct:** `<template>` whose content node carries `role="status"`/`aria-live` + text; `tpl.content.cloneNode(true)` then `appendChild` (region cloned already-filled)
- **locale/i18n:** Arabic, `lang="ar" dir="rtl"` (RTL, Eastern-Arabic numerals)
- **failure-mechanism:** F103 timing limb — role/property present in the cloned subtree *with* the content, never as a pre-existing empty container

## Developer persona
A pharmacy-chain developer localized the portal to Arabic and, wanting the success markup and its translated copy
to live in one editable place, authored the confirmation as a `<template>` that includes `role="status"`. On renew
they clone and append it. The template approach felt "clean and accessible — the role is right there in the markup."
They never realized that cloning a template node that already contains both the role and the text, then appending
it, inserts a live region born with its content that never announces. Bilingual sighted QA saw the green
confirmation appear, so it shipped.

## Element / selector carrying the issue
`#status-area > div.status-card[role="status"]` — cloned from `#renew-tpl`. Temporal marker
`data-region-born-with-content="true"` (authored into the template). At load `#status-area` is an empty plain
`<div>` with no live-region semantics.

## Exact accessibility mechanism (what AT experiences, why it fails)
A polite live region announces only when the AT is already monitoring it and its contents change. `cloneNode(true)`
of a template fragment produces a detached subtree in which `role="status"`, `aria-live="polite"`, and the Arabic
message text all coexist; `appendChild` then connects that whole subtree at once. There is no empty-region-then-
mutation transition, so NVDA/JAWS/VoiceOver (and TalkBack reading Arabic) stay **silent**. The screen-reader user
gets no confirmation that the refill request was received — a status message ("success or results of an action")
squarely in scope for 4.1.3. The RTL/Arabic context is incidental to the mechanism but realistic: the same template
pattern is even more tempting when authors want translated copy centralized. The fix is ARIA22 step 1: a persistent
empty `<div role="status">` in the page, with only the message text written in on renew.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The appended clone is a valid `role="status" aria-live="polite"` region with non-empty, well-contrasted Arabic text;
axe/WAVE/Lighthouse report nothing. They cannot see that the role attribute and the text were authored together
inside a `<template>` and cloned as one unit — the snapshot shows only the present, correct end state. Distinguishing
a cloned-already-filled region (silent) from text written into a pre-existing empty region (announced) requires
reasoning about the template-clone-append sequence or observing AT silence; neither is in scope for static analysis.

## Citation
> **WCAG Technique ARIA22, `wcag-techniques/aria/ARIA22.html` (Tests, Procedure step 1 and step 2):**
> "Check that the container destined to hold the status message has a `role` attribute with a value of `status`
> *before* the status message occurs. Check that when the status message is triggered, it is inside the container."

> **WCAG Technique F103, `wcag-techniques/failures/F103.html` (Description):**
> "Additionally, if the role or property is not set *before* the dynamic content is added, this also predicts a
> failure."
