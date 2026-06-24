# case-02 — In-page action pill coded `role="link"`

## Scenario
The pricing section of **Cadence** (a productivity app's marketing page) offers two
plans. Each "Choose …" call-to-action is a solid pill that visibly depresses on press
(translate + inset shadow). Activating it performs an **in-page action** — it selects the
plan and updates a live order-summary box on the same page. There is no navigation: no
`href`, no URL change, no new document. The pill is coded
`<span role="link" tabindex="0">Choose Pro</span>`.

## Attribute tuple
- **content-domain:** SaaS marketing / pricing page
- **UI-component / pattern:** primary CTA pill that performs an in-page action (order-summary update)
- **host-language construct:** `<span role="link" tabindex="0">` with a click/keydown handler
- **locale / i18n:** en-US
- **failure-mechanism:** valid ARIA role token that is the WRONG role — `link` (navigation) for a control whose behaviour is an in-page action (`button`)

## Developer persona
A designer built the pricing block in Webflow and attached an "interaction" (the press
animation) plus a custom-code embed that mutates the summary. Webflow's element panel let
them set the ARIA role from a dropdown; the designer picked "link" because the element
"looks like our nav links and we want it in the links list." No navigation was ever
wired — the embed does the work — but the role stayed `link`. The page passes the
team's automated scan because `link` is a valid role and the element has a name.

## Element / selector carrying the issue
- `.cta[role="link"]` (both CTAs, notably `.cta[data-plan="Pro"]`) — controls that
  perform an in-page action while announcing as links. There is no `href` and no
  navigation in the handler.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user hears **"Choose Pro, link."** The `link` role sets the expectation
of navigation — moving to a new location or context — and such users routinely surface
links in a dedicated links-list and treat them as "go somewhere." Activating this control
instead silently changes an order-summary region on the same page; nothing navigates,
violating the announced affordance. ARIA distinguishes the two roles by behaviour: a
`link` changes location/context, whereas a `button` performs an action in place. Because
this control acts in place, its correct role is `button` ("Choose Pro, button"). The
chosen role is valid but does not convey the control's actual function.

## Expected ACT-style outcome
**failed** — SC 4.1.2 Role limb: a valid role token (`link`) that does not match the
control's actual function (an in-page action belongs to role `button`).

## Why automated tools miss it
axe-core / WAVE / Lighthouse confirm `role="link"` is a valid token (674b10 passes), the
element has an accessible name, and it is focusable and operable. A link without an `href`
is not an automatic violation (it is a common, legitimate pattern for JS-driven links).
No tool inspects the handler, observes that activation mutates an on-page region rather
than navigating, and concludes the role should be `button`. Telling navigation apart from
an in-page action requires reading the behaviour and the rendered press affordance —
human judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "The intent of this success criterion is to ensure that Assistive Technologies (AT)
> can gather appropriate information about, activate (or set) and keep up to date on the
> status of user interface controls in the content."

**Supporting reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "If custom controls are created, however, or interface elements are programmed (in
> code or script) to have a different role and/or function than usual, then additional
> measures need to be taken to ensure that the controls provide important and appropriate
> information to assistive technologies..."
