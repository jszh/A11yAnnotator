# case-04 — Deploy spinner in role="status" with alt="spinner.gif" (region announces the filename, not "busy")

## Scenario
A ForgeCI continuous-integration dashboard showing "Pipeline #4821 · payments-api". The "Deploy to
staging" stage has a status cell set up as `role="status"` (present at load). When the engineer clicks
**Run deploy**, an animated spinner `<img>` is injected with `alt="spinner.gif"`; on completion it is
swapped for a green-check `<img>` with `alt="check_24.png"`. The two already-completed stages above also
use `alt="check_24.png"`. The icon swap is the only status indicator.

## Attribute tuple
- **content-domain:** developer tooling / CI-CD pipeline dashboard
- **UI-component/pattern:** build/deploy stage list with busy→done status icons (dynamic-state: progress of a process)
- **host-language construct:** `<img>` injected into `role="status"`, `alt` set to the asset filename
- **locale/i18n:** en
- **failure-mechanism:** present-but-wrong text alternative — the alt is the image filename, so the live region announces "spinner.gif" instead of the busy/done state

## Developer persona
A platform engineer who built the dashboard quickly and let the build script auto-populate `alt` from
each icon's filename (a habit from an old asset-pipeline helper that did `alt = basename(src)`). It never
occurred to them that `alt="spinner.gif"` is not a description — to them every image "had alt text," and
the live region was wired correctly, so they considered status messaging done. They test on a Linux box
without a screen reader and only ever read the visual spinner/check.

## Element / selector carrying the issue
`#deployStatus[role="status"] > img[alt="spinner.gif"]` (busy), then `> img[alt="check_24.png"]` (done).
The region's computed text becomes the filename string rather than a status.

## Exact accessibility mechanism (what AT experiences, why it fails)
`role="status"` re-announces its (atomic) contents on change. The contents are an image whose accessible
name is its `alt`, i.e. the literal "spinner.gif" — so the screen reader says "spinner dot gif" while the
deploy is running, then "check underscore 24 dot png" when it finishes. The user is given a meaningless
filename in place of "Deploying to staging" / "application busy" / "Deploy succeeded". This is the
present-but-misleading variant: the alt is non-empty and valid, but it describes the file, not the state,
so the announced status is unintelligible. The Understanding doc expects a busy icon to announce
"application busy"; a filename does not convey that.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`role="status"` is present at load (F103 / live-region seeds PASS). Every `<img>` has a non-empty `alt`
attribute, so axe/WAVE/Lighthouse's "images must have alternate text" rule PASSES — `alt="spinner.gif"`
is, to a linter, simply "alt text that exists." No automated rule evaluates whether the alt is a useful
description versus a filename, nor whether it matches the icon's status meaning. Recognizing that
"spinner.gif" is a filename standing in for "busy," and that the live region therefore announces
nonsense, requires human semantic judgment about the alt's content and the icon's role.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Status message examples), `wcag-understanding/status-messages.html`:**
> "After a user activates a process, an icon symbolizing 'busy' appears on the screen. The screen reader
> announces \"application busy\"."

> **WCAG Techniques ARIA22 (role=status shopping-cart example), `wcag-techniques/aria/ARIA22.html`:**
> "Because it adds visual context, the shopping cart image — with succinct and accurate `alt` text — is
> also placed in the container."

(ARIA22 requires the image's `alt` to be "succinct and accurate"; a filename ("spinner.gif") is neither —
it is present but does not convey the busy/done status, so the announced message is meaningless.)
