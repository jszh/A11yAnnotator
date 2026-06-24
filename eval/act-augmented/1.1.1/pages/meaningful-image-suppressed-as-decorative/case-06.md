# case-06 — 2FA enrollment QR code marked role="presentation" (function lost)

## Scenario
A Vantage Bank "Turn on two-factor authentication" page. To enroll, the user must scan a QR
code with their authenticator app; the QR encodes the `otpauth://` secret. The QR is an
inline `<svg>` with `role="presentation"`, removing it from the accessibility tree. There is
no "enter this setup key manually" text, no copyable secret string, and no alternative
enrollment path — only generic instructions ("Open your authenticator app … scan the code
below"). A sighted user scans and proceeds; a screen-reader user cannot complete enrollment
at all, because the function lives entirely in an image they cannot reach and there is no
text/secret to type instead.

This is the SC 1.1.1 limb for **functional** non-text content (a control / mechanism), not
merely informative content: the image is the operation.

## Attribute tuple
- **content-domain:** banking / account security (authentication)
- **UI-component/pattern:** TOTP authenticator enrollment QR
- **host-language construct:** inline `<svg role="presentation">` rendering QR modules; no manual-key fallback
- **locale/i18n:** en (US)
- **failure-mechanism:** a functional image (the enrollment mechanism) declared decorative, with no text-alternative key and no alternate path — the function is unreachable for AT

## Developer persona
A security-team engineer rendered the QR client-side with a QR library that outputs inline
SVG. To stop screen readers from announcing the QR's hundreds of `<rect>` modules as noise,
they slapped `role="presentation"` on the root SVG — treating it like decorative chrome. They
shipped without the standard "Can't scan it? Enter this key manually: XXXX-XXXX-…" fallback,
not realising that for AT users they had removed the only way to turn on 2FA.

## Element / selector carrying the issue
`.qrbox svg[role="presentation"]` (the QR code that encodes the otpauth secret)

## Exact accessibility mechanism (what AT experiences, why it fails)
`role="presentation"` strips the SVG from the accessibility tree, so AT exposes nothing for
the QR. A screen-reader user hears the heading, the three setup steps, and the "enter the
6-digit code" field — but there is nothing to scan or copy, because the QR is invisible to
them and no setup key is offered as text. Per SC 1.1.1, non-text content that is a control or
accepts user input must provide a name describing its purpose, and informative/functional
content must have a text alternative serving the equivalent purpose; here neither exists, and
there is no alternative enrollment route, so the user is fully blocked. Declaring the
functional QR decorative is a contextual F38 failure that also denies the equivalent function.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`role="presentation"` on an SVG is valid decorative markup that ACT **46ca7f** and **e88epe**
PASS by construction. There is no `<img>` `alt` to be flagged as missing, and a decorative
declaration is syntactically correct, so axe/WAVE/Lighthouse report nothing. No tool decodes
the QR to learn it is a functional otpauth secret, and none can know there is no manual-key
fallback. Recognising that this graphic is the sole enrollment mechanism — and that hiding it
strips a needed function with no equivalent — requires understanding what a QR enrollment
flow is and inspecting the page for an alternative path. That is human contextual judgment.

## Citation
> **WCAG 2.2 Understanding Non-text Content, Additional information — "For non-text content that is a control or accepts user input":**
> "For non-text content that is a control or accepts user input, such as images used as submit buttons, image maps or complex animations, a name is provided to describe the purpose of the non-text content so that the person at least knows what the non-text content is and why it is there."

(Verbatim from `wcag-understanding/non-text-content.html`. The enrollment QR is functional
non-text content that requires a name/purpose and an equivalent way to use it; `role="presentation"`
provides neither, blocking AT users from the function.)

> **Trusted Tester v5.1.3, Test 7.B — Decorative image, How to Test:**
> "Determine if the image is the **only means of conveying important information** on the page."

(Verbatim from `refs/trusted-tester/sc-1.1.1-non-text-content.md`. The QR is the only means
of conveying — and performing — enrollment, so the "decorative" classification fails 7.B.)
