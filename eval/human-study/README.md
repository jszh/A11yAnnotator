# Human adjudication study — 200 cases from the 56-page three-way comparison

The harness, GenA11y and axe disagree with each other on the 56 saved pages, and
nothing in that comparison says who is right: the pages are real sites with no
ground truth. This directory draws a 200-case sample from that disagreement and
provides the apparatus to put it in front of human evaluators.

## The sample

`sample/study-sample-200.json` — 200 cases, one case = one (page × SC × element)
row of the harness's 774-element stratified sample, which is the unit the three
tools were joined on.

| stratum | n | meaning |
| --- | ---: | --- |
| `ALL_ISSUE` | 40 | every tool reported a problem on this element |
| `ALL_CLEAN` | 40 | no tool reported a problem on this element |
| `DIFFER` | 120 | the tools split |

Coverage: **all 21** sampled success criteria, 51 of the 56 pages, all 7
disagreement patterns present in the pool. 178 cases target an element; 22 are
page-scope obligations (focus order, page title, meta refresh) that the corpus
carries on a `/page-level::<family>` pseudo-path and that a participant judges
about the page as a whole.

### What "agree" means here, and what it does not

A tool that has no rule for a criterion is silent, and silence is not the same
as "I looked and it was fine". GenA11y covers 15 of the 21 SCs; axe has a rule
for 8. The strata are built on **what each tool reported**, with silence
counting as no report, and every case additionally carries `lanes` recording
which tools could evaluate it at all — so an analysis can separate genuine
three-way agreement from three-way silence. Requiring all three lanes instead
would have collapsed the sample to 6 SCs and made full SC coverage impossible.

`ALL_ISSUE` is capped by the data: only 47 elements in the whole 774 were
flagged by all three, spread over 4 SCs, so the 40 drawn are most of that pool.

### How the draw works

Seeded (`--seed`, default `20260825`) and reproducible — `sample.test.js`
rebuilds it and compares. Within each stratum the draw is a round-robin over SCs,
and inside each SC a round-robin over that SC's disagreement patterns, so SC
coverage and pattern spread come out of the draw rather than being fixed up
afterwards. The pick inside a cell is random under the seed. The final order is
shuffled so strata are not clustered for the participant.

## Building the sample

```bash
node server.js &                                   # the page server on :3001
node eval/human-study/validate-pool.js             # which of the 774 still resolve
node eval/human-study/build-sample.js              # draw the 200
node eval/human-study/enrich-sample.js             # descriptors + a hard resolve check
node eval/human-study/recombine-harness-verdict.js # harness column = combined verdict
node eval/human-study/enrich-tool-reasons.js       # the sentence each checker gave
```

`validate-pool.js` loads all 56 pages twice and records which of the 708 distinct
targets resolve. A handful of heavily dynamic snapshots no longer reproduce the
DOM the harness sampled them from; those targets are excluded from the pool
*before* the draw rather than patched out of the sample afterwards. Current
result: **703 usable, 5 unusable, 0 flaky**.

`enrich-sample.js` re-resolves every drawn case, attaches the operator-facing
descriptor (tag, accessible role and name, geometry) and **fails the run** if
anything does not resolve.

Both use `public/resolve-xpath.js`, a structural walker rather than
`document.evaluate`. XPath name tests are namespace-aware, so an unprefixed
`svg` step matches nothing in an HTML document — that alone accounted for 5 of
the 30 unresolved cases in the first pass.

## Running the study

```bash
node eval/human-study/server.js --password=<pick one>
```

Starts on `http://127.0.0.1:4100` and brings up the page server on :3001 itself
(or attaches to one already running; `--no-spawn` to never start one). Without
`--password` / `STUDY_PASSWORD` a password is generated and printed.

- **Operator console** — `/control`, password-gated.
- **Participant client** — `/s/<token>`, one unguessable URL per participant,
  created from the console.

Everything else on the port is reverse-proxied to the page server. That is what
makes the page same-origin with the client, which is what lets the client place
the highlight and watch focus inside it; it also means the study reuses the page
server's offline serving rather than reimplementing it.

State lives in `data/study-state.json` and is written through on every change,
so the server can be restarted mid-session without losing assignments or notes.

### Operator console

Two pages. The **overview** is a list of participants — how many answered, which
criterion they are on, which page, whether their evaluation view is open — plus
everything that sets a session up: opening the study, adding people, splitting
the sample, the exports. Clicking a name opens **that participant's own page**,
which is where the controls that drive somebody live. One participant at a time
is a different job from watching a room, and the buttons that move a person
through their tasks should not be a mis-click away from the person next to them
in a list. Prev and Next are in the key colour because they are the two reached
for constantly.

The operator can also **answer for a participant** — the same 1/2/3/4 they see,
with the same rule that 4 clears the rest. It goes through the same recorder on
the server as the participant's own submission, so the validation cannot drift
between the two, and it is written down as `via: "operator"`: an answer typed
here is a different kind of measurement from one the participant gave, and the
analysis has to be able to tell them apart.

The console is **light**, like the client.

- **Participants** — add, copy link, rotate link (kills the old one), remove.
- **Split** — divide the sample across everyone, `interleave` (each participant
  gets a balanced mix) or `block`, with an optional shared **anchor** block
  assigned to everyone so inter-rater agreement is measurable. Seeded.
- **Selection dict** — JSON keyed by participant name or id; a value is either a
  list of case ids or a filter:

  ```json
  {
    "Robin": { "scs": ["1.1.1", "2.4.4"], "strata": ["DIFFER"], "shuffle": true, "seed": 1 },
    "Sam":   { "pages": ["Domino's.htm", "Kahoot!.htm"], "limit": 20 },
    "Alex":  ["C003", "C017", "C042"]
  }
  ```

  Filter fields (`pages`, `scs`, `strata`, `patterns`, `scope`) are ANDed;
  values within a field are ORed. A selection that matches nothing is reported
  and the previous assignment is left alone.
- **Per participant** — prev / next / **next unfinished** / go-to, reload the
  page, show highlight, focus target, **show/hide the tool view on their
  screen**, a live focus monitor, a **tool-view panel** showing the
  participant's A/B/C mapping, the verdicts as they see them and the answer
  they gave, and a notes field per task with done/skip. The card also carries a
  live **tool view open / closed** pill.
  Notes are debounced write-through, and a live update never steals the caret
  while the operator is typing.
- **What is still outstanding** — the console used to show only the task a
  participant happened to be on, so a gap left behind was invisible. Each
  participant's page now carries a **task grid**: one cell per assigned task,
  marked answered or not, the current one ringed, and every cell a link that
  navigates them straight there. **Next unfinished** jumps to the next task with
  no answer and **wraps** — which is the case that matters, because someone who
  worked to the end and skipped three is sitting on the last task, where plain
  "next" has nowhere to go. With nothing outstanding the button says *All
  answered* and does nothing. The overview list carries a **left** column so the
  same question can be answered for everyone at once, without opening anybody.

  "Finished" means **an answer is on record**, not the operator's `done` flag:
  `status` is set only by the notes field and is not touched by answering, so it
  cannot stand in for progress. `controlParticipantView` exposes
  `unansweredCount` alongside `answeredCount` for exactly this reason.
- **Assign by ability** — tick some participants, tick one or more task types,
  and the pool of cases needing those abilities is either **divided between
  them** (covering ground) or **given to each of them whole** (measuring
  agreement between people with the same ability). The panel shows each pool's
  size and each participant's current mix, so an assignment can be read back
  rather than taken on trust. `abilities` is also a filter in the JSON selection
  dict and in `selectCases`.

  Reassigning replaces a task list. **Answers are never deleted**, but one can
  end up stranded on a case the participant no longer holds — the only
  consequence of reassigning that reassigning again does not undo — so the
  response says exactly whose answers and which cases.
- **Export** — JSON or CSV of every (participant × case) row with the note, the
  stratum, and what each tool said. Both are sent with `Content-Disposition`;
  the JSON one was not, and `<a download>` on a `no-store` JSON response is the
  combination Chrome refuses with "file not available" — the request succeeded,
  the download did not.

### Which ability a task needs

Every case carries an `ability`, written by `tag-ability.js`, answering one
question: **what must the participant be able to perceive to reach a verdict?**

| | n | criteria |
| --- | --- | --- |
| `vision` | 126 | 1.1.1, 1.3.1, 1.4.1, 1.4.3, 1.4.4, 1.4.5, 1.4.12, 1.4.13, 2.2.2, 2.4.4, 2.4.7, 2.5.3 |
| `screenreader` | 33 | 4.1.2, 4.1.3 |
| `other` | 41 | 2.1.1, 2.1.2, 2.2.1, 2.4.2, 2.4.3, 2.4.6, 3.3.1 |

`screenreader` means **the verdict depends on AT output**, not that the
participant must be blind — a sighted expert with VoiceOver or NVDA can do
those 33. (The other reading, "tasks a blind participant can do", is a
different split: `screenreader` + `other` + most of 2.4.3, about 74 cases.)

Two of these were decided by reading the cases rather than WCAG:

- **2.4.4 link-purpose** looks like a text task, but **18 of its 21 links have no
  visible text at all** — image links and poster tiles, where the purpose comes
  from the picture.
- **1.1.1** has **no `alt` attribute at all on 20 of its 26 cases**, which makes
  "is there a text alternative" a code check — but deciding whether a missing alt
  is a *failure* means deciding whether the image is decorative, and that needs
  seeing it.

**1.3.1 and 2.5.3 need the visible presentation *and* the accessible name.**
They are vision rather than a fourth bucket, because the requirement is
asymmetric: a sighted expert can read an accessible name out of devtools, but a
blind expert cannot obtain the visible label at all.

The table is keyed by SC because that is the unit the study is staffed and
reported on. Two cases do not fit their bucket and carry an `abilityNote`
instead of being moved, which would cost the property that each arm is
describable as "these criteria": **C050** (2.4.3, tab order judged against the
visual reading order) and **C007** (3.3.1, an error state shown by styling
alone). `tag-ability.js` refuses to run if the sample contains a criterion the
table does not cover, so a re-drawn sample cannot come out quietly mis-tagged.

### The evaluation view

On every page load the participant gets a Material dialog — **Evaluate** in the
toolbar, Option/Alt+Enter from the keyboard — showing what the three checkers
said about this element — three columns, or **one column labelled
"1, 2, 3" when all three agreed**, since there is no choice to make between them.
Its title is the criterion: the number and then what it asks for, in one
sentence of WCAG's own language — "WCAG 1.4.3 — Provide sufficient contrast
between text and its background." It is out of the page header, where it would
sit in front of the participant the whole time they are looking at the page, but
it is here whenever they open the view.
`build-sc-guidance.js` assembles those sentences into `sc-guidance.json` from
the WCAG 2.2 Understanding "In Brief" text — most of it already in
`categories.json`, and five criteria (1.4.4, 1.4.12, 2.2.1, 2.2.2, 2.5.3) taken
from w3.org because the categories.json merge for the ACT-REST expansion is
still open. The server refuses to start if a sampled criterion has no sentence.

The four options are numbered **1, 2, 3** for the columns and **4** for "I
disagree with all of them", and the keys `1`-`4` tick them — except while the
participant is typing their disagreement, where a comment that says "1" should
be a comment. "Typing" means a field that takes text: the options are `<input>`
too, and one of them holds focus the moment the view opens, so a guard that
skipped inputs wholesale stopped the keys working exactly where they are most
likely to be pressed. Picking 4 with the **mouse** drops you into the comment
box; picking it with the **key** does not, because the next number pressed would
be typed into the comment instead of ticking anything. Escape inside the comment
box steps out of the field rather than closing the view, so a half-written
reason is not lost to a keystroke; a second Escape closes it. Opening the view puts focus on option 1 rather than the close
button a native dialog would pick, because choosing is the first thing to do.
Dismiss and Continue carry their keys (`Esc`, `Enter`) the way the toolbar
buttons do.

The columns are **checkboxes, not radios**: two checkers can both be right about
the same element, and a participant who thinks so should be able to say it
rather than being made to pick a favourite. "I disagree with all of them" is the
one exclusive answer — ticking it clears the columns and vice versa — and it
needs a comment. Answers are stored as a set of numbers *and* the tools those
numbers stood for. Their previous answer comes back if the operator sends them
to a task again.

Every column that reports a problem carries **the sentence that checker gave for
flagging it**, so what is being judged is a finding rather than a bare assertion.
A column that reported nothing carries no sentence: filling one in would be the
study putting words in a checker's mouth. In a collapsed card the three agreed on
the verdict but rarely on the wording, so each sentence is attributed to its
number; identical sentences are printed once.

The harness column shows the harness's **combined verdict for that element and
SC**, not the verdict of the one obligation the draw landed on. The 774-row
sample the 200 came from is keyed by *(page, SC, element, claim family)*, and one
element can carry several obligations under a single SC: an `<img>` gets both
`non-text-content` (is there a text alternative?) and `long-description` (is a
longer description needed, and is there one?). C045 and C064 are the same
missing-`alt` finding on two ESPN thumbnails — `non-text-content` = barrier from
axe, which runs inside the harness, and `long-description` = PARTIAL. C064 was
drawn on the element-keyed row and read "problem"; C045 was drawn on the
long-description row and read "clear". Nothing about the harness differed, only
which row the draw took. `recombine-harness-verdict.js` unions every obligation
the harness holds for the element under that SC, across all of its sources —
deterministic claims, checker and instrument and geometry results carried on
PROVISIONAL rows, and the LLM lane's shadow observations. It changed exactly one
of the 200 cases (C045, `--A` to `H-A`, still DIFFER) and retracted none.

**PARTIAL is not a barrier and stays not-flagging.** 14 of the 200 harness
columns sit on an obligation the harness could not settle; the harness having no
verdict is not the harness reporting a problem, and the study has no third column
state. What the combining fixes is the harness having a verdict *somewhere else
on the same element* that the sampled row hid.

The sentences are attached to the sample by `enrich-tool-reasons.js`, which reads
each tool's own output — the harness's judgment summaries (or, for a
deterministic finding, the rule or instrument's own wording), GenA11y's
`violation.reason`, and axe's rule `help` string. They are deliberately uniform:
one plain sentence, no rule identifiers, no mechanism names, no vocabulary only
one of the three has. 159 harness / 45 GenA11y / 54 axe flagged columns, all
covered.

**Which number is which checker is drawn per participant** and never leaves the
server. The payload carries `{label, verdict, evaluates, reason}`, so nothing on
the participant's screen — text, markup or ordering — names a tool. That is
checked by tests on both the API payload and the rendered DOM. The console shows
each participant's mapping, the sentences they are reading, and their answer; the
stored answer records the number *and* the tool it stood for, so a result is
readable without the blind.

`evaluates: false` means that checker has no rule for the criterion at all. The
participant is **not** told this any more — such a column simply reads "reports no
problem here", which is what a user of that tool would see. The flag still
travels with the payload and is still on the console, so the analysis can
separate silence from a lane that checked and found nothing.

Two caveats worth stating. The sentences are a real, intended relaxation of the
blind: they are written in three different voices, and a participant who reads
enough of them may start to recognise one. And where a harness finding came from
a bundled rule check, its sentence is that rule's own wording — so it can read
identically to the axe column (50 of the 200 cases). That is the truth about
those two lanes rather than an artefact.

**This deliberately relaxes an earlier property.** Before, the client payload
carried no tool information whatsoever; now it carries the verdicts. The
invariant that remains is that it never carries tool *identity*, nor the stratum
or pattern the sample was drawn on.

Continue submits the answer **and moves the participant to the next task**, via
`POST /api/client/advance`. It is the same cursor the operator's prev / next /
goto drives — the server pushes the new task down the same client stream and
broadcasts to the console, and the move is journalled as a nav event carrying
`via: 'participant'` — so the console never drifts from what the participant is
looking at, and the trace still says who moved them. On the last task it does
not wrap or clamp: the answer is recorded and the participant is told that was
the last one. If the advance itself fails, they are told that too, because
otherwise they are sitting on a task they have already answered with no way to
know.

**Continue is not live until something is chosen**, and it says so with
`aria-disabled` rather than the `disabled` attribute. A truly disabled button
leaves the tab order, so a participant working by keyboard or screen reader
reaches the end of the form and finds nothing there — no button, no reason, no
way to ask. This one stays reachable, announces itself as unavailable, and
activating it produces the same sentence `Enter` does. It performs no action and
submits nothing, which is the sense of "not clickable" that matters.

Its unavailable state is drawn with **explicit colours rather than the `.38`
opacity a disabled button gets**. Fading the whole button fades its label and its
background together — that put the text on this one at **2.06:1**, and the 1.4.3
exemption for text in an *inactive* component does not obviously cover a control
that is still in the tab order and still answers when pressed. The replacement
pair is **7.3:1**. In a study about contrast, the instrument should not be the
thing failing.

`Enter` is printed on Continue, so `Enter` behaves like Continue in both states —
including the blocked one. A key that silently does nothing is the same dead end
as an unexplained button, so the form takes the key over when Continue is not
live and raises the error instead. `Enter` inside the comment box is still a
newline.

The view **reopens without rebuilding when it is the same task**. Several
snapshots in this corpus navigate themselves a second or two after `load`, and
every load reopens the view — which used to clear a selection the participant
had already made on the task they were still on. A reopen for the same task,
while it is already up, is now left alone; a new task, or a close and reopen,
rebuilds and restores whatever answer is on record.

Every message this interface produces goes through a live region. There are two:
`#announcer` (`role="status"`, `aria-live="assertive"`) for task and highlight
announcements and for the "waiting" screens, and `#tool-error` (`role="alert"`,
`aria-live="assertive"`, `aria-atomic="true"`) for the evaluation view's errors —
one node carrying both what is read and what is spoken, so the two cannot drift.
A live region will not speak text it is already showing, which is exactly the
repeat case here (pressing `Enter` twice with nothing chosen has to say so
twice), so re-setting identical text empties the node for a frame first.

### Participant client

Deliberately bare: a one-line task header and the page. **Light chrome, always** —
the participant is judging how a page looks, and a dark shell wrapped around a
light snapshot changes how its contrast reads. The interface has no theme
switch and does not follow the system setting, for the same reason: every
participant should be looking at the same thing. It shows **"Waiting for
study to begin"** until an operator is signed in *and* has opened the study —
both, so a stale open flag does not start a session with nobody watching.

A Material top app bar carries two buttons, and each one prints the shortcut for
what it will do next, so there is no separate line of key hints for nobody to
read twice. The **Evaluate** button's pressed state is derived from the dialog
itself rather than mirrored, so it cannot claim the popup is open when it is
shut.

The focus button has three states, because there are two things a participant
might want and one button:

| state | label | key |
| --- | --- | --- |
| highlight hidden | Show focus | Shift+Enter |
| highlight on, focus on the target | Hide focus | Esc |
| highlight on, focus moved away | **Re-focus** | Shift+Enter |

The third is the one that matters: a participant tabs off to see how the page
behaves and then wants to come back, and a button still offering "Hide focus" is
offering the one thing they did not want. Clicking the button does exactly what
the key printed on it does — a button labelled Shift+Enter that did something
else would be worse than no label at all.

- **Escape** closes the tool view when it is open, and otherwise hides the
  highlight. It is observed, never swallowed: several tasks are about what the
  page itself does with Escape, so the page's own handlers run untouched, and
  closing the popup never pulls the highlight away.
- **Shift+Enter** returns focus to the highlighted element, closing the
  evaluation view first if it is open. Captured and stopped, so it works from
  inside a widget that handles Enter.
- **Option+Enter** (Alt+Enter) opens the evaluation view, and closes it again,
  so the key and the button it is printed on stay the same thing.

Both keys work from inside the page frame as well as from the study chrome, and
that is not free. The tool view is a modal `<dialog>` in the parent document, and
a browser turns Escape into a close request for it **only while the key is
pressed in that same document**. Once focus is inside the page frame the request
never arrives, so a participant whose focus had moved into the page while the
popup was up could not close anything from the keyboard at all. Two things fix
it: Shift+Enter takes the popup down on its way to the element, and Escape
arriving from the page frame closes the dialog directly instead of deferring to a
browser behaviour that will not happen.

The marker is an SVG: an orange stroke over a wider outline stroke, two colours,
so it holds an edge against a light page, a dark page or a photograph without
turning into a stack of outlines. **The outline is white on a dark backdrop and
black on a light one** — a white outline on a white page is not an outline. The
backdrop is measured by sampling around the marker and walking up from each
point to the first ancestor with a background colour that is not transparent;
there is no way to read rendered pixels from script, so imagery reads as
whatever is painted behind it, and where nothing resolves it stays white, which
is the safer default over a photograph. It is an SVG rather than a bordered `div`
because the outline has to be able to go dashed along **just the stretch that is
covered** (see below), and because the gap in a dash has to go all the way
through — a `box-shadow` halo stays solid behind a dashed border and fills every
gap straight back in. Two strokes on one geometry sharing one dash pattern is
the only way to get a gap that really shows the page through.

It is drawn 3px outside the element — **except where that would put it off the
screen.** An element that
reaches the edge of the browser frame (a full-width banner, a page-sized
container, a background video) cannot be ringed from outside and still be seen,
and a participant told something is highlighted who finds a bare page has been
given nothing. So each side the element itself **reaches** — not merely comes
near — is pulled back 16px inside the frame, clear of the edge. The marker then
reads as "this element reaches past what you can see", which is true, and it
tracks the scroll because the visible part of the element does. An element
scrolled entirely out of view is left alone rather than pinned to an edge,
because pinning it would claim something is on screen when it is not. An element
a few pixels in from the edge is left alone too: it has room for its ring, and
moving that ring would take the marker off the element it is marking — one case
in the sample is a 22px button near the right edge, which under a looser rule
would have had its ring dragged off it.

A marker painted on top of the page says "the target is here", which stops being
true the moment the page draws something over it: a page that keeps its banner
or its background video where it is while the content scrolls across leaves the
outline framing a screenful of something else.

So the outline is sampled where it is drawn. Each edge is probed at up to 24
points just inside it with `elementFromPoint`, five times a second, and the runs
that come back covered are stroked **dashed** while the rest stay solid — so the
dashing lands on the part of the element that is actually behind something. On
the Artera background video at rest that is 52% of the perimeter (the site
header sits over its top edge, the cookie banner over the bottom); scrolled to
where the hero panel covers it, 100%. The marker stays where the element is and
stays on top: the participant still needs to know where the target is, and what
changes is whether they are looking at it or at something in front of it.

Separately, and measuring a different thing, the element's **area** is sampled
on a 5×5 grid; when less than 10% of it is visible the study's header says
*target is behind the content on screen*. Area rather than perimeter because a
block of text over the middle of a banner covers a lot of it without touching
its edges. That one has hysteresis (covered below 10%, back above 25%) and a
400ms hold so scrolling past something does not rewrite the header on the way;
the dashing is deliberately not debounced, because it is a direct readout of
what is over the outline right now.

Both signals live in the study's chrome; nothing is added to the page. An
element scrolled off screen is not "covered" — it is just elsewhere, and is left
alone.

The marker is anchored the same way the element is. It is repositioned from a
`requestAnimationFrame` callback, which lands a frame after the scroll it is
reacting to — invisible as long as nothing has to be written. An element that
scrolls with the document keeps a constant *document* position, so an
absolutely-positioned marker simply travels with the page. An element pinned to
the viewport is the other way round: its document position changes with every
pixel of scroll, the marker is rewritten every frame, and it visibly lags —
which reads as the outline bouncing while the element sits still. So the client
watches what the element's viewport position does when the page scrolls and
switches the marker between `absolute` and `fixed` to match; neither case then
needs a write while scrolling. A clamped box is viewport-anchored by
construction, whatever the element does.

When the highlight appears it **scrolls the target into view and blinks twice.**
The blink is a Web Animation on the marker itself and the marker's geometry is
never animated: a ring whose bounds move even slightly is a ring that misreports
which element the task is about. Nothing else moves, and nothing is added to the
page under evaluation beyond the one `aria-hidden`, `pointer-events: none` box,
which is left exactly as it was. The
scroll is re-asserted twice while the layout settles, because several snapshots
keep loading content after the ring goes up and slide the element back off the
screen; it only re-scrolls when the target is actually out of view, so a page the
participant has scrolled themselves is left alone.

## Keeping the study out of what is being measured

The participant is the ground truth, so the apparatus must not change either the
page or what the participant knows.

- The client is sent the page, the target path, and the three blinded verdicts.
  Tool names, stratum, pattern and claim family stay on the server;
  `server.test.js` asserts the payload names none of them, and the browser test
  asserts the same of the rendered screen and the dialog markup.
- The visible highlight is a separate absolutely-positioned box, `aria-hidden`,
  no role, no text, not focusable, `pointer-events: none`. The end-to-end test
  asks the browser's own accessibility tree and asserts the ring is not in it.
- Nothing is added to the target that a screen reader would read — no
  `aria-label`, no `aria-describedby`, no wrapper. The only attribute ever set on
  it is `tabindex="-1"`, only when the browser refuses the focus without it, and
  it is taken away again once focus leaves. Dismissing the highlight does not
  blur the element the participant is standing on.
- Task announcements go to one `aria-live` region in the study chrome, outside
  the page frame.

## Tests

```bash
node --test eval/human-study/test/*.test.js
```

- `sample.test.js` — strata, SC coverage, pattern spread, no duplicates, every
  case resolves, the draw reproduces from its seed, and the split/selection maths.
- `server.test.js` — the API over real HTTP: the password gate, the waiting gate,
  assignment, navigation, notes, focus capping, export, link rotation, and state
  surviving a restart.
- `client.e2e.test.js` — the participant interface in a browser, including the
  accessibility-tree check on the highlight and the Escape/Shift+Enter contract.
- `control.e2e.test.js` — the console in a browser driving a live client.

`STUDY_SHOT_DIR=<dir>` puts the end-to-end screenshots somewhere you can look at
them; the run prints the path either way.

## Deployment (Cloud Run)

Cloud Run instances are replaced without warning and their disk goes with them,
so nothing about the study may live only on the container. Two independent
records handle that, because they fail in different ways:

| | where | written |
| --- | --- | --- |
| state snapshot | `gs://<bucket>/state/study-state.json` | write-through, compare-and-swap on the object generation |
| event journal | `gs://<bucket>/journal/<runId>/NNNNNN.jsonl` | append-only, batched; written once, never rewritten |
| the same journal | Cloud Logging | one structured JSON line per event, synchronously, before anything else |

Notes and assignments flush immediately; cursor moves and focus reports are
debounced and batched, because they are recoverable and they arrive constantly.
Removing a participant writes their notes into the journal *before* dropping
them from the state, so a mis-click is not destructive. On SIGTERM the server
flushes both with an 8-second bound — Cloud Run allows about ten — and anything
that misses that window has already reached Cloud Logging.

The snapshot write carries the generation it was read at, so a process holding a
stale copy is refused rather than silently winning. The service runs
`--max-instances=1`, but that is per revision, not per service: **every
deployment produces two writers for a few seconds**, because the outgoing
revision keeps serving while the incoming one has already read the state. The
incoming instance's first write is then refused — and if it does nothing about
that, the generation it holds can never match again and it stops writing the
snapshot for the rest of its life while the study carries on around it. (That is
not hypothetical; revision 7 spent its first minute like that.)

So a refused write is followed by a re-read and one retry, journalled as
`state-reclaimed` with both sides' sizes and a `behind` flag saying whether the
object we took was further along than what we held. One retry per flush, so two
live writers cannot turn it into a fight; the loser stays dirty and tries again
on the next mutation, converging the moment the other stops. Nothing is merged —
the journal already holds what both writers did, and `fetch-data.js` rebuilds
from it and reports the drift.

`/_status` reports `errorsSinceSave`, and `ok` is false whenever it is non-zero.
A cumulative error count would have called that frozen instance healthy.

### Getting the data back

```bash
node eval/human-study/fetch-data.js --bucket=<bucket> --out=results/human-study-<date>
```

Downloads both records and rebuilds `notes.csv` and `responses.csv` **from the
journal**, not the snapshot — the journal holds the full history, including earlier versions of an
edited note and the notes of a removed participant. It then compares the two and
writes `drift.json` if they disagree, rather than quietly picking a winner.

### Deploying

```bash
node eval/human-study/deploy/stage.js --out=/tmp/deploy-context
cd /tmp/deploy-context && gcloud builds submit --region=us-west1 \
  --tag=us-west1-docker.pkg.dev/<project>/a11y-study/human-study:v1 --timeout=3600s .
gcloud run deploy a11y-human-study --image=<that tag> --region=us-west1 ...
```

`stage.js` copies out only the 51 snapshots the sample refers to plus their
`_files` directories, the vendored CDN replacements, and the two servers — about
820MB out of a 15GB repository — and fails rather than warns if a page the
sample needs is missing.

The deployment flags that are not optional:

- `--max-instances=1` — single writer for the state snapshot.
- `--min-instances=1 --no-cpu-throttling` — the server holds long-lived SSE
  connections and runs flush timers between requests; throttled CPU would stall
  them, and a cold start mid-session would drop every participant's stream.
- `--timeout=3600` — SSE streams are long-lived requests.
- The control password comes from Secret Manager, never a plain env var.
- The runtime service account is granted `storage.objectAdmin` on the study
  bucket and `secretmanager.secretAccessor` on the one secret — nothing else.

The service is public (`allUsers` may invoke) because participants reach it by
link. Access control is inside the app: the console needs the password, and
`/assets/*` — the page snapshots — is served only to a signed-in operator or a
participant holding a live token. An unauthenticated request for a page gets a
403, so the corpus is not browsable by anyone who guesses the URL.

Running with `--min-instances=1` and CPU always allocated is the main cost; it
is roughly the price of one small always-on VM, so scale the service to zero
between study sessions if it will sit idle for a while.

## Known limitations

- **Do not run the console in the same browser as a participant client.** The
  console and the pages under evaluation are served from the same origin (that
  is what makes the highlight possible), so Chrome puts them in one renderer
  process, and a snapshot that busies its main thread starves the console. In a
  real session they are on different machines; the end-to-end test uses two
  separate browsers for the same reason.
- The client shell shares a renderer with the page it frames, which is inherent
  to same-origin iframing. A snapshot stuck in a tight loop will make the shell
  sluggish too. The page server's console-flood guard covers the worst of it.
- 5 of the 774 corpus rows are excluded because their element no longer exists
  when the page is served plainly (2 Quora divs, 2 Calendly `<script>` nodes, 1
  NFL/ESPN iframe). They are listed in `sample/pool-resolvability.json`.
- The corpus xpaths cannot be resolved with `document.evaluate` — XPath name
  tests are namespace-aware, so any path ending in an SVG node returns null.
  Anything that resolves these paths must use `public/resolve-xpath.js`. The
  harness itself uses `document.evaluate` in several places and has the same
  blind spot; that is noted here, not fixed here.

## Files

| | |
| --- | --- |
| `build-sample.js` | draws the 200 |
| `validate-pool.js` | which of the 774 targets still resolve |
| `enrich-sample.js` | descriptors + hard resolve check |
| `recombine-harness-verdict.js` | harness column = its combined verdict for the element |
| `enrich-tool-reasons.js` | the sentence each checker gave for flagging |
| `build-sc-guidance.js` | one WCAG sentence per criterion -> `sc-guidance.json` |
| `tag-ability.js` | which ability each case needs: vision / screenreader / other |
| `server.js` | study server (console, client, API, proxy) |
| `lib/store.js` | persisted study state |
| `lib/assign.js` | split and selection-dict logic |
| `public/resolve-xpath.js` | the shared xpath walker |
| `public/client.*` | participant interface |
| `public/control.*` | operator console |
| `sample/study-sample-200.json` | the sample |
| `sample/pool-resolvability.json` | the pool check |
