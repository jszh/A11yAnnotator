'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/media-process-auth');

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body><main><h1>${title}</h1>${body}</main></body></html>`;
}

const cases = [];
const addHtml = (aspect, expected, id, html) => cases.push({ kind: 'html', aspect, expected, id, html });
const addJson = (aspect, expected, id, data) => cases.push({ kind: 'json', aspect, expected, id, data });

const mediaMeta = (id, data) => `<script id="${id}" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const transcript = (text, label = 'Transcript') => `<details data-v3-transcript><summary>${label} </summary><p>${text}</p></details>`;
const description = (text) => `<div data-v3-description-text><strong>Audio description text:</strong> ${text}</div>`;

for (let i = 1; i <= 10; i++) {
  const pos = (i - 1) % 10;
  let positiveMedia = '';
  let positiveMeta = {};
  if (pos === 0) {
    positiveMeta = { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'chef says add salt and pepper', visualContent: 'chef stirs soup', captionText: '' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="descriptions" src="desc.vtt" srclang="en"></video>`;
  } else if (pos === 1) {
    positiveMeta = { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'speaker says evacuation begins now alarm sounds', visualContent: 'speaker at podium', captionText: 'speaker says evacuation begins now' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>`;
  } else if (pos === 2) {
    positiveMeta = { sc: '1.2.3', mediaType: 'synchronized-video', audioContent: 'narrator says welcome', visualContent: 'red valve opens and pressure gauge rises', captionText: 'narrator says welcome', descriptionText: '' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>`;
  } else if (pos === 3) {
    positiveMeta = { sc: '1.2.1', mediaType: 'audio-only', audioContent: 'mayor announces library opens monday applause follows', transcriptText: '' };
    positiveMedia = `<audio id="target" controls data-v3-media-meta="mediaMeta" src="podcast.mp3"></audio>`;
  } else if (pos === 4) {
    positiveMeta = { sc: '1.2.1', mediaType: 'audio-only', audioContent: 'professor explains photosynthesis sunlight carbon dioxide water glucose', transcriptText: '' };
    positiveMedia = `<audio id="target" controls data-v3-media-meta="mediaMeta" src="lecture.mp3"></audio>${transcript('professor explains photosynthesis')}`;
  } else if (pos === 5) {
    positiveMeta = { sc: '1.2.1', mediaType: 'video-only', visualContent: 'hand turns red knob clockwise then gauge reaches safe zone', transcriptText: '' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta" muted src="silent-demo.mp4"></video>`;
  } else if (pos === 6) {
    positiveMeta = { sc: '1.2.5', mediaType: 'synchronized-video', audioContent: 'music plays', visualContent: 'on screen text reads dose two tablets warning do not drive', descriptionText: '' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="descriptions" src="desc.vtt" srclang="en"></video>${description('music plays')}`;
  } else if (pos === 7) {
    positiveMeta = { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'interviewer asks name guest answers maya laughter', visualContent: 'two people in studio', captionText: 'interviewer asks name guest answers maya' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>`;
  } else if (pos === 8) {
    positiveMeta = { sc: '1.2.3', mediaType: 'synchronized-video', audioContent: 'narrator says attach cable', visualContent: 'technician plugs blue cable into port B', transcriptText: '' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>${transcript('narrator says attach cable')}`;
  } else {
    positiveMeta = { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'guide says turn left bell rings dog barks', visualContent: 'guide points left', captionText: 'guide says turn left' };
    positiveMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>`;
  }
  addHtml('media-alternatives', 'positive', `media-p${i}`, page(`Media positive ${i}`, `<figure>${positiveMedia}<figcaption>Media alternative test ${i}</figcaption></figure>${mediaMeta('mediaMeta', positiveMeta)}`));

  const neg = (i - 1) % 10;
  let negativeMedia = '';
  let negativeMeta = {};
  if (neg === 0) {
    negativeMeta = { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'chef says add salt and pepper', visualContent: 'chef stirs soup', captionText: 'chef says add salt and pepper' };
    negativeMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>`;
  } else if (neg === 1) {
    negativeMeta = { sc: '1.2.2', mediaType: 'media-alternative-for-text', audioContent: 'text paragraph read aloud exactly', captionText: '', mediaAlternativeForText: true, clearlyLabeledAlternative: true };
    negativeMedia = `<p id="source-text">Text paragraph read aloud exactly.</p><video id="target" controls data-v3-media-meta="mediaMeta" data-v3-media-alternative-for-text="true" data-v3-clearly-labeled-alternative="true"><p>Media alternative for the preceding text.</p></video><p>This video is clearly labeled as a media alternative for the page text.</p>`;
  } else if (neg === 2) {
    negativeMeta = { sc: '1.2.3', mediaType: 'synchronized-video', audioContent: 'narrator says welcome', visualContent: 'red valve opens and pressure gauge rises', captionText: 'narrator says welcome', descriptionText: 'red valve opens and pressure gauge rises' };
    negativeMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"><track kind="descriptions" src="desc.vtt" srclang="en"></video>`;
  } else if (neg === 3) {
    negativeMeta = { sc: '1.2.1', mediaType: 'audio-only', audioContent: 'mayor announces library opens monday applause follows', transcriptText: '' };
    negativeMedia = `<audio id="target" controls data-v3-media-meta="mediaMeta" src="podcast.mp3"></audio>${transcript('mayor announces library opens monday applause follows')}`;
  } else if (neg === 4) {
    negativeMeta = { sc: '1.2.1', mediaType: 'video-only', visualContent: 'hand turns red knob clockwise then gauge reaches safe zone', transcriptText: '' };
    negativeMedia = `<video id="target" controls data-v3-media-meta="mediaMeta" muted src="silent-demo.mp4"></video>${transcript('hand turns red knob clockwise then gauge reaches safe zone')}`;
  } else if (neg === 5) {
    negativeMeta = { sc: '1.2.5', mediaType: 'synchronized-video', audioContent: 'music plays', visualContent: 'on screen text reads dose two tablets warning do not drive', descriptionText: '' };
    negativeMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="descriptions" src="desc.vtt" srclang="en"></video>${description('on screen text reads dose two tablets warning do not drive')}`;
  } else if (neg === 6) {
    negativeMeta = { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'interviewer asks name guest answers maya laughter', visualContent: 'two people in studio', captionText: 'interviewer asks name guest answers maya laughter' };
    negativeMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en" default></video>`;
  } else if (neg === 7) {
    negativeMeta = { sc: '1.2.3', mediaType: 'synchronized-video', audioContent: 'narrator says attach cable', visualContent: 'technician plugs blue cable into port B', transcriptText: '' };
    negativeMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>${transcript('narrator says attach cable technician plugs blue cable into port B', 'Full transcript')}`;
  } else if (neg === 8) {
    negativeMeta = { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'guide says turn left bell rings dog barks', visualContent: 'guide points left', captionText: 'guide says turn left bell rings dog barks' };
    negativeMedia = `<video id="target" controls data-v3-media-meta="mediaMeta"><track kind="captions" src="captions.vtt" srclang="en"></video>`;
  } else {
    negativeMeta = { sc: '1.2.1', mediaType: 'audio-only', audioContent: 'weather alert hail expected tonight siren sounds', transcriptText: '' };
    negativeMedia = `<audio id="target" controls data-v3-media-meta="mediaMeta" src="alert.mp3"></audio>${transcript('weather alert hail expected tonight siren sounds', 'Emergency transcript')}`;
  }
  addHtml('media-alternatives', 'negative', `media-n${i}`, page(`Media negative ${i}`, `<figure>${negativeMedia}<figcaption>Media alternative control ${i}</figcaption></figure>${mediaMeta('mediaMeta', negativeMeta)}`));
}

const processBase = (id) => ({
  processId: `checkout-${id}`,
  processBoundaryComplete: true,
  requiresPersistedUserData: true,
  requiredStepIds: ['cart', 'shipping', 'payment', 'confirm'],
  persistedFields: ['email', 'shipping-address'],
  steps: [
    { id: 'cart', url: '/cart', measured: true, result: 'pass' },
    { id: 'shipping', url: '/checkout/shipping', measured: true, result: 'pass' },
    { id: 'payment', url: '/checkout/payment', measured: true, result: 'pass' },
    { id: 'confirm', url: '/checkout/confirm', measured: true, result: 'pass' },
  ],
  redundantEntryChecks: [
    { field: 'email', sameProcess: true, previouslyProvided: true, requiredAgain: true, autoPopulated: true },
  ],
});
const processPositive = [
  (m) => { Object.assign(m.steps.find((s) => s.id === 'cart'), { result: 'fail', failureSc: '2.1.1', failure: 'cart quantity controls are not keyboard operable' }); },
  (m) => { Object.assign(m.steps.find((s) => s.id === 'shipping'), { result: 'fail', failureSc: '3.3.2', failure: 'shipping address fields lack labels or instructions' }); },
  (m) => { Object.assign(m.steps.find((s) => s.id === 'payment'), { result: 'fail', failureSc: '3.3.1', failure: 'payment error is not identified to the user' }); },
  (m) => { Object.assign(m.steps.find((s) => s.id === 'confirm'), { result: 'fail', failureSc: '2.4.7', failure: 'confirmation action has no visible keyboard focus indicator' }); },
  (m) => { m.redundantEntryChecks = [{ field: 'email', sameProcess: true, previouslyProvided: true, requiredAgain: true }]; },
  (m) => { m.redundantEntryChecks = [{ field: 'shipping-address', sameProcess: true, previouslyProvided: true, requiredAgain: true }]; },
  (m) => { Object.assign(m.steps.find((s) => s.id === 'payment'), { result: 'fail', failureSc: '1.4.3', failure: 'payment summary text contrast is below threshold' }); },
  (m) => { Object.assign(m.steps.find((s) => s.id === 'confirm'), { result: 'fail', failureSc: '4.1.3', failure: 'confirmation status is not programmatically announced' }); },
  (m) => { Object.assign(m.steps.find((s) => s.id === 'shipping'), { result: 'fail', failureSc: '3.3.7', failure: 'same shipping phone is required again without reuse mechanism' }); },
  (m) => { Object.assign(m.steps.find((s) => s.id === 'cart'), { result: 'fail', failureSc: '1.4.10', failure: 'cart contents require horizontal scrolling at reflow size' }); },
];
const processNegative = [
  (m) => m,
  (m) => { m.redundantEntryChecks = [{ field: 'email', sameProcess: true, previouslyProvided: true, requiredAgain: true, availableForSelection: true }]; },
  (m) => { m.redundantEntryChecks = [{ field: 'card-cvv', sameProcess: true, previouslyProvided: true, requiredAgain: true, exception: 'security-verification' }]; },
  (m) => { m.requiresPersistedUserData = false; delete m.persistedFields; },
  (m) => { m.steps = m.steps.map((s) => ({ ...s, stateRef: `state://${s.id}` })); },
  (m) => { m.redundantEntryChecks = [{ field: 'shipping-address', sameProcess: true, previouslyProvided: true, requiredAgain: true, userConfirmedReuse: true }]; },
  (m) => { m.requiredStepIds = ['cart', 'shipping', 'payment', 'confirm']; },
  (m) => { m.steps.find((s) => s.id === 'confirm').url = '/checkout/done'; },
  (m) => { m.persistedFields = ['email', 'shipping-address', 'billing-address']; },
  (m) => { m.processId = 'registration'; },
];
for (let i = 1; i <= 10; i++) {
  const p = processBase(i);
  processPositive[i - 1](p);
  addJson('complete-process', 'positive', `process-p${i}`, p);
  const n = processBase(`n${i}`);
  processNegative[i - 1](n);
  addJson('complete-process', 'negative', `process-n${i}`, n);
}

const siteBase = (id) => ({
  setId: `account-set-${id}`,
  sameStateBreakpointContext: true,
  pages: [
    {
      url: '/account/overview',
      title: 'Account Overview',
      purpose: 'account overview',
      helpMechanisms: [{ type: 'chat', label: 'Support chat', href: '/help/chat' }, { type: 'phone', label: 'Call support', href: 'tel:18005550100' }],
      navItems: [{ label: 'Overview', href: '/account/overview' }, { label: 'Payments', href: '/account/payments' }, { label: 'Settings', href: '/account/settings' }],
      components: [{ key: 'search-account', label: 'Search account', role: 'button' }, { key: 'save-form', label: 'Save changes', role: 'button' }],
      links: [{ name: 'View statement', href: '/account/statement', purpose: 'open statement' }],
    },
    {
      url: '/account/payments',
      title: 'Account Payments',
      purpose: 'account payments',
      helpMechanisms: [{ type: 'chat', label: 'Support chat', href: '/help/chat' }, { type: 'phone', label: 'Call support', href: 'tel:18005550100' }],
      navItems: [{ label: 'Overview', href: '/account/overview' }, { label: 'Payments', href: '/account/payments' }, { label: 'Settings', href: '/account/settings' }],
      components: [{ key: 'search-account', label: 'Search account', role: 'button' }, { key: 'save-form', label: 'Save changes', role: 'button' }],
      links: [{ name: 'View statement', href: '/account/statement', purpose: 'open statement' }],
    },
  ],
});
const sitePositive = [
  (m) => { m.pages[1].title = 'Account Overview'; m.pages[1].purpose = 'make payment'; },
  (m) => { m.pages[1].navItems = [m.pages[1].navItems[1], m.pages[1].navItems[0], m.pages[1].navItems[2]]; },
  (m) => { m.pages[1].navItems[0].href = '/dashboard'; },
  (m) => { m.pages[1].helpMechanisms = [m.pages[1].helpMechanisms[1], m.pages[1].helpMechanisms[0]]; },
  (m) => { m.pages[1].components[0].label = 'Find account'; },
  (m) => { m.pages[1].links[0].href = '/account/tax-form'; m.pages[1].links[0].purpose = 'open tax form'; },
  (m) => { m.pages[1].title = ''; },
  (m) => { m.pages.push({ url: '/account/settings', title: 'Account Settings', purpose: 'account settings', helpMechanisms: [{ type: 'phone', label: 'Call support', href: 'tel:18005550100' }, { type: 'chat', label: 'Support chat', href: '/help/chat' }] }); },
  (m) => { m.pages[1].components[1].role = 'link'; },
  (m) => { m.pages[1].title = 'Account Overview'; m.pages[1].purpose = 'payment history'; m.pages[1].navItems.pop(); },
];
const siteNegative = [
  (m) => m,
  (m) => { m.pages[0].title = 'Account Overview'; m.pages[1].title = 'Account Overview'; m.pages[1].purpose = 'account overview'; },
  (m) => { m.pages[0].links[0].name = 'Open statement'; m.pages[1].links[0].name = 'View statement'; },
  (m) => { m.pages[0].components[0].label = 'Search accounts'; m.pages[1].components[0].label = 'Search accounts'; },
  (m) => { m.pages[0].helpMechanisms.reverse(); m.pages[1].helpMechanisms.reverse(); },
  (m) => { m.pages[0].navItems[2].label = 'Preferences'; m.pages[1].navItems[2].label = 'Preferences'; },
  (m) => { m.pages[0].purpose = 'account overview'; m.pages[1].purpose = 'account payments'; },
  (m) => { m.pages.push({ ...m.pages[1], url: '/account/history', title: 'Account History', purpose: 'payment history' }); },
  (m) => { m.pages[0].links = []; m.pages[1].links = []; },
  (m) => { m.pages[0].components = []; m.pages[1].components = []; },
];
for (let i = 1; i <= 10; i++) {
  const p = siteBase(i);
  sitePositive[i - 1](p);
  addJson('site-set-consistency', 'positive', `site-p${i}`, p);
  const n = siteBase(`n${i}`);
  siteNegative[i - 1](n);
  addJson('site-set-consistency', 'negative', `site-n${i}`, n);
}

for (let i = 1; i <= 10; i++) {
  const pos = [
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="email"><label>Email from account step <input id="target" name="email" autocomplete="email"></label><label>Enter email again <input id="target2" name="email" autocomplete="off" required></label><p>The email was entered on the previous step and must be typed again.</p></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="shipping-postal"><label>Shipping postal code <input id="target" name="shipping-postal" autocomplete="postal-code"></label><label>Retype shipping postal code <input id="target2" name="shipping-postal" autocomplete="off" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="phone"><label>Contact phone <input id="target" name="phone" autocomplete="tel"></label><label>Repeat phone number <input id="target2" name="phone" autocomplete="off" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="address1"><label>Street address <input id="target" name="address1" autocomplete="address-line1"></label><label>Type street address again <input id="target2" name="address1" autocomplete="off" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="member-id"><label>Member ID <input id="target" name="member-id"></label><label>Re-enter member ID <input id="target2" name="member-id" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="appointment-date"><label>Appointment date <input id="target" name="appointment-date"></label><label>Confirm by typing date again <input id="target2" name="appointment-date" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="cardholder"><label>Cardholder name <input id="target" name="cardholder" autocomplete="cc-name"></label><label>Retype cardholder name <input id="target2" name="cardholder" autocomplete="off" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="student-number"><label>Student number <input id="target" name="student-number"></label><label>Enter student number again <input id="target2" name="student-number" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="emergency-contact"><label>Emergency contact <input id="target" name="emergency-contact"></label><label>Repeat emergency contact <input id="target2" name="emergency-contact" required></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="account-number"><label>Account number <input id="target" name="account-number"></label><label>Re-enter account number <input id="target2" name="account-number" required></label></form>`,
  ][i - 1];
  const neg = [
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-reuse-exception="auto-populated" data-v3-redundant-key="email"><label>Email <input id="target" name="email" autocomplete="email"></label><label>Email reused automatically <input id="target2" name="email" autocomplete="email" value="user@example.com"></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-reuse-exception="available-for-selection" data-v3-redundant-key="address"><label>Address <input id="target" name="address"></label><label>Select saved address <select id="target2" name="address"><option>Use saved address</option></select></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="false" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-redundant-key="email"><label>Previous application email <input id="target" name="email"></label><label>New unrelated newsletter email <input id="target2" name="email"></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="false" data-v3-required-reentry="true" data-v3-redundant-key="phone"><label>Home phone <input id="target" name="phone-home"></label><label>Work phone <input id="target2" name="phone-work"></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="false" data-v3-reuse-exception="optional-confirmation" data-v3-redundant-key="email"><label>Email <input id="target" name="email"></label><label>Optional confirmation <input id="target2" name="email"></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-reuse-exception="security-purpose" data-v3-redundant-key="password"><label>Password <input id="target" type="password" name="password"></label><label>Re-enter password for security <input id="target2" type="password" name="password"></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-reuse-exception="invalid-data-correction" data-v3-redundant-key="postal"><label>Postal code entered earlier <input id="target" name="postal"></label><label>Correct invalid postal code <input id="target2" name="postal"></label></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-reuse-exception="essential" data-v3-redundant-key="signature"><label>Signer name <input id="target" name="signature"></label><label>Type legal signature again <input id="target2" name="signature"></label></form>`,
    `<form data-v3-redundant-entry="false"><label>Email <input id="target" name="email"></label><label>Phone <input id="target2" name="tel"></label><p>Different information in one step.</p></form>`,
    `<form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-reuse-exception="user-confirmed-reuse" data-v3-redundant-key="billing-address"><label>Billing address <input id="target" name="billing-address"></label><button id="target2" type="button">Use same as shipping</button></form>`,
  ][i - 1];
  addHtml('redundant-entry', 'positive', `redundant-p${i}`, page(`Redundant positive ${i}`, pos));
  addHtml('redundant-entry', 'negative', `redundant-n${i}`, page(`Redundant negative ${i}`, neg));
}

for (let i = 1; i <= 10; i++) {
  const pos = [
    `<form data-v3-auth-step="true" data-v3-cognitive-test="password-recall" data-v3-no-auth-exception="true"><label>Password <input id="target" type="password" autocomplete="off" onpaste="return false"></label><p>No password manager, paste, or alternate sign-in is offered.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="captcha" data-v3-no-auth-exception="true"><label>Email <input id="target" name="email"></label><div class="captcha-box" data-sitekey="x">Type the distorted text shown in the image</div></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="transcription" data-v3-no-auth-exception="true"><label>Security phrase <input id="target" name="phrase" aria-describedby="h"></label><p id="h">Memorize and type the phrase from the previous screen.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="calculation" data-v3-no-auth-exception="true"><label>Answer <input id="target" name="answer"></label><p>Solve 17 + 26 before continuing.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="object-recognition" data-v3-no-auth-exception="true"><label>Image challenge <input id="target" name="challenge"></label><p>Select all pictures containing traffic lights. No alternative is provided.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="personal-content" data-v3-no-auth-exception="true"><label>Security answer <input id="target" name="mother-maiden"></label><p>Enter your mother's maiden name from memory.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="otp-transcription" data-v3-no-auth-exception="true"><label>One-time code <input id="target" name="otp" autocomplete="off" onpaste="return false"></label><p>Read and retype the code sent in an image attachment.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="password-recall" data-v3-no-auth-exception="true"><label>Passphrase <input id="target" type="password" autocomplete="off"></label><button type="button">Reveal password requirements only</button></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="puzzle" data-v3-no-auth-exception="true"><label>Puzzle response <input id="target" name="puzzle"></label><p>Drag the pieces mentally into order, then enter the sequence.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="password-recall" data-v3-no-auth-exception="true"><label>Password <input id="target" type="password" autocomplete="off"></label><p>Account recovery is available only after signing in.</p></form>`,
  ][i - 1];
  const neg = [
    `<form data-v3-auth-step="true" data-v3-cognitive-test="password-recall" data-v3-auth-exception="password-manager"><label>Password <input id="target" type="password" autocomplete="current-password"></label><p>Password managers and paste are supported.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="password-recall" data-v3-auth-exception="magic-link"><label>Email <input id="target" type="email" autocomplete="email"></label><a href="/magic">Email me a sign-in link instead</a></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="otp" data-v3-auth-exception="autocomplete"><label>Code <input id="target" name="otp" autocomplete="one-time-code"></label><p>Paste and one-time-code autofill are supported.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="object-recognition" data-v3-auth-exception="alternative-modality"><label>Challenge <input id="target" name="challenge"></label><button type="button">Use audio challenge instead</button></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="calculation" data-v3-auth-exception="non-cognitive-alternative"><label>Answer <input id="target" name="answer"></label><button type="button">Send push approval to my device</button></form>`,
    `<form data-v3-auth-step="false"><label>Newsletter password hint <input id="target" name="nickname"></label><p>This is not an authentication step.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="personal-content" data-v3-auth-exception="personal-content-exception"><label>Favorite color <input id="target" name="color"></label><p>This uses personal content supplied by the user as the permitted exception.</p></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="captcha" data-v3-auth-exception="non-visual-non-cognitive"><label>Email <input id="target" name="email"></label><div class="captcha-box" data-sitekey="x">CAPTCHA</div><button type="button">Verify by email link instead</button></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="password-recall" data-v3-auth-exception="passkey"><label>Username <input id="target" name="username" autocomplete="username"></label><button type="button">Use passkey</button></form>`,
    `<form data-v3-auth-step="true" data-v3-cognitive-test="transcription" data-v3-auth-exception="human-help"><label>Code <input id="target" name="code"></label><a href="/support">Contact support to authenticate without this test</a></form>`,
  ][i - 1];
  addHtml('accessible-authentication', 'positive', `auth-p${i}`, page(`Auth positive ${i}`, pos));
  addHtml('accessible-authentication', 'negative', `auth-n${i}`, page(`Auth negative ${i}`, neg));
}

const readingBlock = (attrs, text, extra = '') => `<section id="target" data-v3-reading-review="true" ${attrs}><p>${text}</p>${extra}</section>`;
const hardReadingAttrs = 'data-v3-required-content="true" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="true" data-v3-no-supplement="true" data-v3-reading-method-supported="true"';
const readingPositives = [
  'Before submitting the loan restructuring election, the applicant must reconcile amortization projections, subordinate lien disclosures, and debt-service coverage assumptions without a plain-language explanation.',
  'To complete medication intake, compare contraindications, hepatic impairment warnings, and pharmacokinetic interactions, then certify comprehension before continuing.',
  'The checkout requires acceptance of an indemnification clause, limitation-of-liability exclusion, and arbitration venue provision without a summary or simpler version.',
  'Error recovery requires interpreting idempotency, reconciliation window, and credential revocation instructions before the account can be restored.',
  'The safety procedure requires calculating permissible exposure duration from decibel-weighted dose tables and respiratory cartridge breakthrough intervals.',
  'Enrollment requires understanding actuarial value, coinsurance accumulation, out-of-network balance billing, and formulary tier exceptions before choosing a plan.',
  'The security settings page requires deciding between asymmetric key rotation, certificate pinning, and federated identity fallback with no glossary.',
  'A benefits appeal requires reading administrative exhaustion, evidentiary preclusion, and retroactive eligibility language before filing.',
  'The tax form asks users to classify constructive receipt, imputed income, and withholding safe-harbor status without supplemental content.',
  'The travel authorization requires users to interpret fare basis restrictions, interline endorsement rules, and involuntary reroute liability before payment.',
];
const readingNegatives = [
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="true" data-v3-supplemental-content="plain-language-summary" data-v3-reading-method-supported="true"', 'This policy includes complex legal terms.', '<aside>Plain-language summary: you can cancel within 30 days and get a refund.</aside>'),
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="true" data-v3-lower-secondary-version="linked-simple-version" data-v3-reading-method-supported="true"', 'The medical disclosure contains specialized terms.', '<a href="#simple">Read the simple version</a><p id="simple">Simple version: talk to your doctor if you feel dizzy.</p>'),
  readingBlock('data-v3-required-content="false" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="true" data-v3-no-supplement="true" data-v3-reading-method-supported="true"', 'Marketing copy mentions synergistic optimization and operational excellence.', '<p>This is optional promotional text, not needed to complete the task.</p>'),
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="false" data-v3-proper-names-titles-removed="true" data-v3-no-supplement="true" data-v3-reading-method-supported="true"', 'Enter your name. Choose a date. Press Continue.'),
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="false" data-v3-proper-names-titles-removed="true" data-v3-supplemental-content="glossary" data-v3-reading-method-supported="true"', 'NASA means National Aeronautics and Space Administration. MFA means multi-factor authentication.', '<dl><dt>MFA</dt><dd>A second sign-in check.</dd></dl>'),
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="true" data-v3-supplemental-content="icons-examples" data-v3-reading-method-supported="true"', 'The advanced billing rule is explained with examples.', '<p>Example: If you paid twice, we return the extra payment.</p>'),
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="false" data-v3-no-supplement="true" data-v3-reading-method-supported="true"', 'The apparent difficulty is the title International Classification of Diseases Eleventh Revision.', '<p>After removing the title, the instruction is simple: choose the code your doctor gave you.</p>'),
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="true" data-v3-supplemental-content="audio-and-illustration" data-v3-reading-method-supported="true"', 'A dense emergency instruction is paired with audio and an illustrated checklist.', '<button type="button">Play plain-language audio</button><ol><li>Leave now.</li><li>Call 911.</li></ol>'),
  readingBlock('data-v3-required-content="true" data-v3-above-lower-secondary="true" data-v3-proper-names-titles-removed="true" data-v3-no-supplement="true" data-v3-reading-method-supported="false" data-v3-reading-language="ja"', '日本語の文章の読解レベルはこの英語用フィクスチャ手法では判定できません。'),
  `<section id="target" data-v3-reading-review="false" data-v3-required-content="false" data-v3-above-lower-secondary="false" data-v3-no-supplement="true" data-v3-reading-method-supported="true"><p>This sample paragraph is not part of the task.</p></section>`,
];
for (let i = 1; i <= 10; i++) {
  addHtml('language-readability-cognitive', 'positive', `cog-p${i}`, page(`Cognitive positive ${i}`, readingBlock(hardReadingAttrs, readingPositives[i - 1])));
  addHtml('language-readability-cognitive', 'negative', `cog-n${i}`, page(`Cognitive negative ${i}`, readingNegatives[i - 1]));
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = { generatedAt: new Date().toISOString(), cases: [] };
for (const c of cases) {
  const dir = path.join(OUT, c.aspect, c.expected);
  fs.mkdirSync(dir, { recursive: true });
  const ext = c.kind === 'json' ? 'json' : 'html';
  const file = path.join(dir, `${c.id}.${ext}`);
  fs.writeFileSync(file, c.kind === 'json' ? JSON.stringify(c.data, null, 2) + '\n' : c.html);
  manifest.cases.push({ id: c.id, kind: c.kind, aspect: c.aspect, expected: c.expected, file: path.relative(ROOT, file) });
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(path.join(OUT, 'manifest.json'));
