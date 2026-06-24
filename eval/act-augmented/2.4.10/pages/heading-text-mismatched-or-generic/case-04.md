# case-04 — Settings page where the "Privacy" and "Notifications" section headings are swapped

## Scenario
A SaaS analytics product's Preferences screen groups its controls into two `<fieldset>`
sections, each opened by an `<h2>` that is the group's accessible name via `aria-labelledby`.
The first group, headed **"Privacy"**, contains exclusively **notification** controls (weekly
email digest, push alerts on threshold breach, quiet hours, notification email address). The
second group, headed **"Notifications"**, contains exclusively **privacy** controls (profile
visibility, share usage data, allow third-party data export, searchable by email). The two
section headings are swapped relative to their bodies; every control *within* each group is
internally consistent, so the mismatch is only visible across the heading/body boundary.

## Attribute tuple
- **content-domain**: SaaS analytics dashboard — account settings / preferences
- **UI-component/pattern**: grouped settings form using `<fieldset>` + APG switch (toggle) pattern, with `aria-labelledby` group names
- **host-language construct**: `<fieldset aria-labelledby>` referencing an `<h2 id>`; custom accessible toggle switches
- **locale/i18n**: en-US
- **failure-mechanism**: (d) swapped headings — the "Privacy" heading sits above notification controls and the "Notifications" heading sits above privacy controls

## Developer persona
A front-end developer built a reusable `<SettingsGroup heading="…">` React component and
rendered two of them. When wiring up the page they passed the `heading` props in the wrong
order (a classic prop-ordering mistake) — `heading="Privacy"` to the group that maps to the
notifications state slice, and vice-versa. Each group's internal controls came from the
correct data slice, so the toggles work and look right; only the two heading props are
crossed, and no one re-read the screen as "heading → its controls."

## Element / selector carrying the issue
- FAIL: `h2#g1` (text "Privacy") is the `aria-labelledby` name of the fieldset containing the
  notification toggles (digest / push alerts / quiet hours / notification email).
- FAIL: `h2#g2` (text "Notifications") is the `aria-labelledby` name of the fieldset containing
  the privacy toggles (profile visibility / data sharing / export / searchable by email).

## Exact accessibility mechanism
The section accessible name is computed from the `<h2>` via `aria-labelledby`. A screen-reader
user navigating by heading or landing on the fieldset hears "Privacy, group" and then a list of
controls about email digests and push alerts — the heading actively **mislabels** the controls.
A user who wants to turn OFF data sharing for privacy reasons will, reading the heading list,
go to "Privacy" and find only notification toggles; the actual data-sharing control is filed
under "Notifications", where they would never look. Because the heading is the programmatic
name of the group, the wrong name propagates to braille output and to the rotor's form/heading
lists. The headings exist and are non-empty, but each introduces the wrong section.

## Expected ACT-style outcome
**failed** — both section headings are present and non-empty but name the opposite section's
contents, so they do not introduce/identify the section they label.

## Why automated tools miss it
The outline is `h1` → two `h2`, non-empty and ordered; the `aria-labelledby` references resolve
to real elements, so axe-core, WAVE and Lighthouse pass (no empty heading, no broken
`aria-labelledby`, valid heading order, fieldsets correctly named). "Privacy" and
"Notifications" are both legitimate settings vocabulary, so nothing looks anomalous to a linter.
Detecting the swap requires reading the controls under each heading and recognising that they
belong to the *other* heading — a semantic comparison of heading text against the meaning of the
form fields beneath it, which no automated tool can perform.

## Citation
> **WCAG 2.2 Understanding — Examples of Section Headings**
> "A web application contains a settings page that is divided into groups of related settings.
> Each section contains a heading describing the class of settings."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify
> them."
