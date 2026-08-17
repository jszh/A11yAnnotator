# case-03 — Webmail SPA with one message open but `<title>` stays "Inbox"

## Scenario
A webmail single-page app (Postbox Mail). The router opens one message (`#/mail/m-4821`) and renders
it into the reading pane: `<h1>Re: Q3 budget review — Tuesday 10am</h1>`, the sender ("Priya Anand
&lt;priya.anand@acme.example&gt;"), a timestamp, and the full message body. The reading pane unmistakably
shows one specific opened email. `document.title` is set to **"Inbox"** at boot and is never updated when
a message is opened, so the title of an open, specific message is "Inbox" — the same as the message-list
view and every other opened message.

## Element / selector carrying the issue
- `head > title` — text node `"Inbox"`.
- Contradicting evidence: `article.reader h1` = "Re: Q3 budget review — Tuesday 10am"; `.reader .meta .name`
  = "Priya Anand"; the full message body is rendered.

## Exact accessibility mechanism (what AT experiences and why it fails)
The Trusted Tester note clarifies that "A web application is an application that runs in a web browser
(such as webmail) and may not have a URL that changes as content changes" — which is precisely why the
title carries the navigational burden here. A blind user who opens an email and then tab-switches relies
on the title to recall which message they were reading; AT users who depend on the title announcement to
confirm a view change get nothing useful. With the title stuck at "Inbox", an opened message about the
Q3 budget review is indistinguishable, by title, from the inbox list or any other open message. The title
neither identifies the message's topic nor distinguishes this reading state from others.

## Expected ACT-style outcome
**failed** (limb 2). Title present and non-empty (2779a5 passes) but does not reflect the opened
message's subject/sender and is identical across views.

## Why automated tools miss it
"Inbox" is a present, non-empty `<title>`, so ACT 2779a5 passes and axe/WAVE/Lighthouse report nothing.
A tool would have to read the reading-pane subject and sender, understand that an *opened message* is a
distinct view with its own topic, and judge that "Inbox" fails to reflect it — then notice that the title
is identical whether the list or any message is shown. That is content understanding plus a state-aware
distinguishability judgment, not a structural check. The per-message title update is a runtime behaviour
the static `<head>` gives no signal about.

## Citation
> **WCAG 2.2 Understanding — Understanding SC 2.4.2 Page Titled (`wcag-understanding/page-titled.html`):**
> "In cases such as Single Page Applications (SPAs), where various distinct pages/views are all nominally
> served from the same URI and the content of the page is changed dynamically, the title of the page
> should also be changed dynamically to reflect the content or topic of the current view."

> **Trusted Tester v5.1.3 — Note (`refs/trusted-tester/sc-2.4.2-page-titled.md`):**
> "A web application is an application that runs in a web browser (such as webmail) and may not have a
> URL that changes as content changes."
