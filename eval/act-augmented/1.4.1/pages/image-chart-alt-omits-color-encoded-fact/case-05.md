# case-05 — Status-dashboard screenshot; alt lists all eight services + states "red = down", long description even says "2 of 8 are down", but never names auth-gateway and payments-worker

## Scenario
An incident runbook page embeds a service-health dashboard as a flattened screenshot `<img>`
(inline-SVG `data:` URI). Eight production services are shown as a 4×2 grid of tiles; green tile =
healthy, red tile = down. Two services are red (auth-gateway: "timeout"; payments-worker: "no
heartbeat"); the other six are green with latency numbers. Each tile prints its service NAME and a
metric, so names and numbers are in the picture — but the HEALTH STATE is colour only. The `<img>`
has a rich alt naming all eight services and stating the rule ("tiles in green are healthy; tiles in
red are down"), plus an `aria-describedby` long description (in a `<details>`) that repeats the rule,
lists every service with its metric, and even states the count — "Two of the eight services are
currently down" — yet never NAMES which two. The down services are identifiable only by reading the
two red tiles.

## Attribute tuple
- **Content domain:** DevOps / SRE incident response (internal runbook)
- **UI component / pattern:** status dashboard screenshot embedded in a Markdown-rendered doc, with a `<details>` long description
- **Host-language construct:** `<img alt aria-describedby>` (inline-SVG `data:` URI) + `<details>` long description
- **Locale / i18n:** en
- **Failure mechanism:** F13 — alt and long description list every entity and state the colour rule (and even the COUNT of down services) but omit the resolved fact (which services are down)

## Developer persona
An on-call SRE took a screenshot of the Grafana "service health" panel and pasted it into the
incident runbook, then added a careful alt and an expandable text description so the runbook would be
accessible. They transcribed the legend, every service, every metric, and even noted "2 of 8 down" —
describing the dashboard's layout and rules. But the binding of "down" to a specific service name was,
on the original panel, conveyed by tile colour, and they reproduced that gap: the runbook's whole job
("page the owners of the DOWN services") depends on a fact the text never states.

## Element / selector carrying the issue
`img[aria-describedby="boardDesc"]` and its description `#boardDesc`. The down-services membership
(auth-gateway, payments-worker) is encoded only as the red fill of two tiles inside the screenshot.

## Exact accessibility mechanism
AT computes the image name from the long alt and appends the `#boardDesc` text. A screen-reader user
hears all eight service names, all metrics, "green = healthy / red = down", and "two of eight are
down" — enough to know there is an outage, but not which services it is. The runbook step "page the
on-call owner of each down service shown above" is therefore unactionable without sight. An on-call
engineer with deuteranopia scanning the page in a hurry also cannot reliably separate the red tiles
from the green ones; there is no second cue (no "DOWN" badge, no icon, no border) distinguishing them.
The colour-borne fact "auth-gateway and payments-worker are down" reaches no non-colour channel.

## Expected ACT-style outcome
**failed** (SC 1.4.1, via F13; also implicates 1.1.1). The image has a rich non-empty alt and a valid
associated long description, so every automated text-alternative rule passes. It fails 1.4.1 because
the information conveyed by the red/green tile colour (which services are down) is not also available
in text or via any non-colour visible cue. Stating the COUNT ("2 of 8 down") without the IDENTITIES is
a textbook F13: the rule and the totals are present, the resolved fact is missing.

## Why automated tools miss it
The `<img>` has a long alt and an associated `aria-describedby` description; axe/WAVE/Lighthouse pass
every alt/name/description rule and would rate the markup as good practice. No scanner reads the
screenshot pixels to find the two red tiles, reads their service names, and confirms those names are
absent from the alt and the long description. Detecting that "which tiles are red" is the load-bearing
colour fact, and that the prose never resolves it, is a human read-the-picture / read-the-prose /
compare judgment.

## Citation
**Reference:** WCAG Technique F13 (`wcag-techniques/failures/F13.html`)
> "This text alternative fails to provide the information which is conveyed by the color red in the image. The alternative should indicate which people did not meet the sales quota rather than relying on color."

**Reference:** Trusted Tester v5.1.3 SC 1.4.1, Test 13.A (`refs/trusted-tester/sc-1.4.1-use-of-color.md`)
> "When color is used to convey information, indicate an action, prompt a response, or distinguish a visual element, another visual, **onscreen** method is used to convey the information which does not use color."

**Reference:** Understanding SC 1.4.1 (`wcag-understanding/use-of-color.html`)
> "Color is not the only way of distinguishing information."
