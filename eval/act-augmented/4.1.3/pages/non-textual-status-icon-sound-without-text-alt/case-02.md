# case-02 — Upload widget swaps a spinner image (alt="") to a green-check image (alt="") inside role="status"

## Scenario
A LearnHub LMS "Submit assignment: Lab Report 4" page for a Cell Biology 210 course. The file row has
a status slot the developer set up as a live region (`role="status"` present at page load). When the
student clicks **Submit**, an `<img>` spinner is injected into that region (busy), then 1.8 s later it is
swapped for a green-check `<img>` (done). Both images carry `alt=""`. The spinner→check swap is the only
indication that the upload is in progress and then succeeds.

## Attribute tuple
- **content-domain:** higher-ed LMS / course assignment submission
- **UI-component/pattern:** file-upload widget with busy→done progress (dynamic-state: skeleton/loading then success)
- **host-language construct:** `<img>` with `alt=""` swapped via `innerHTML` inside `role="status"`
- **locale/i18n:** en
- **failure-mechanism:** non-text status (image swap) is the sole carrier of busy + success; live region present but computed text is empty throughout

## Developer persona
A bootcamp-grad front-end dev who learned the rule "decorative images get `alt=""`." The upload icons
came from the design system as "decorative status glyphs," so they dutifully set `alt=""` on both. They
also did the live-region setup correctly (empty `role="status"` pre-placed). It "tested fine" visually:
spinner, then a satisfying green check. They never opened a screen reader, so they never noticed the
region announces "" both times — and that the single most important moment (submission succeeded) is
silent.

## Element / selector carrying the issue
`#uStatus[role="status"] > img[alt=""]` — first the spinner image, then the green-check image. With
`alt=""` the live region's text content is the empty string at every state.

## Exact accessibility mechanism (what AT experiences, why it fails)
`role="status"` has implicit `aria-live="polite"` and (with `aria-atomic="true"`) re-reads the whole
container on change. But the container's only descendant is an `<img alt="">`, which contributes no text
to the accessible name/description and no text to the region's content. So the polite live region
mutates twice — busy, then done — and announces nothing each time. A blind student clicks Submit and
hears total silence, with no way to know whether the assignment uploaded, is still uploading, or failed.
The Understanding doc's own example expects "application busy" to be announced for a busy icon; here the
busy *and* the success states are both swallowed. Giving the busy image `alt="Uploading"` and the done
image `alt="Submitted"` (or co-locating offscreen text) would satisfy 1.1.1 and let the present role do
its job — that is the PASS shape, deliberately not used here.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`role="status"` is present in the DOM at load (F103 / live-region seeds PASS). Every `<img>` has an `alt`
attribute, and `alt=""` is the W3C-recommended value for a decorative image, so axe/WAVE/Lighthouse's
"images must have alternate text" rule is satisfied — there is nothing to flag. Automated tooling cannot
determine that this spinner→check image carries the upload *status* (versus being ornamental) and that
`alt=""` therefore drops the busy/success information. Concluding that the green check means "submitted"
and that the region announced nothing requires visual recognition of the icon's meaning plus semantic
reasoning about what the status owed the user.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Status message examples), `wcag-understanding/status-messages.html`:**
> "After a user activates a process, an icon symbolizing 'busy' appears on the screen. The screen reader
> announces \"application busy\"."

> **WCAG Techniques ARIA22 (role=status shopping-cart example), `wcag-techniques/aria/ARIA22.html`:**
> "Because it adds visual context, the shopping cart image — with succinct and accurate `alt` text — is
> also placed in the container."

(ARIA22 shows the intended shape: an image conveying status inside the live region must carry "succinct
and accurate `alt` text." Here both status images use `alt=""`, so the present role announces nothing.)
