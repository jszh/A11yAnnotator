'use strict';
// GenA11y's own prompt text for the six criteria it covers, verbatim from eval/gena11y/a11y_detector.py (the
// detect_* functions): the heading, any text between the heading and the rules, and the test rules — unedited,
// including the parts InterA11y's rubrics remove or change. Used only by the ablation ladder (INTERA11Y_RUBRIC=gena11y),
// to run GenA11y's rules inside InterA11y's pipeline.
//
// Not carried over: the lines after the rules. Three describe GenA11y's input format ("Elements prefixed with
// [path: ...] give the XPath", "Use the screenshot to identify these situations", "Each element includes inline
// style ... for reference"); InterA11y's cards state their own format. The fourth, 3.3.1's "If no form or error
// state is present, the page passes", tells the model which way to decide without evidence, which the neutral
// stance removes.
module.exports = {
  '1.1.1': {
    heading: 'Analyze compliance with WCAG SC 1.1.1 (Non-text Content).',
    rules: [
      'Image buttons must have a non-empty accessible name.',
      'Images, videos, and audio must have non-empty accessible names unless decorative (alt="", role="presentation", aria-hidden="true").',
      'Accessible names must be meaningful, not just filenames or "image".',
      'Object elements must have accessible names.',
      'SVG elements with explicit roles must have accessible names.',
    ],
  },
  '1.4.1': {
    heading: 'Analyze compliance with WCAG SC 1.4.1 (Use of Color).',
    rules: [
      'Links distinguished only by color must also have another visual indicator (underline, bold, different lightness, etc.).',
      'Required or error form fields identified only by color must have an additional non-color indicator (asterisk, label text, icon, etc.).',
    ],
  },
  '1.4.3': {
    heading: 'Analyze compliance with WCAG SC 1.4.3 (Contrast Minimum).',
    rules: [
      'Normal text and its background must achieve at least 4.5:1 contrast ratio.',
      'Large text (≥18pt normal or ≥14pt bold) must achieve at least 3:1.',
      'When a background image is present, check text readability from the screenshot.',
    ],
  },
  '2.4.4': {
    heading: 'Analyze compliance with WCAG SC 2.4.4 (Link Purpose In Context).',
    preamble: 'A link passes if its purpose is clear from its accessible name OR from its surrounding context (same sentence, paragraph, list item, or table cell).',
    rules: [
      'The link must have a non-empty accessible name.',
      'The link in context must be descriptive (not just "click here", "read more", etc. unless context clarifies the destination).',
      'Links with identical names in the same context must serve an equivalent purpose.',
    ],
  },
  '3.3.1': {
    heading: 'Analyze compliance with WCAG SC 3.3.1 (Error Identification).',
    rules: [
      'If an input error is automatically detected, the item in error must be identified and the error described to the user in text.',
    ],
  },
  '4.1.2': {
    heading: 'Analyze compliance with WCAG SC 4.1.2 (Name, Role, Value).',
    rules: [
      'Buttons must have non-empty, descriptive accessible names.',
      'Elements with aria-hidden must not receive focus.',
      'Form fields must have non-empty, descriptive accessible names; one label per field.',
      'Menu items must have non-empty, descriptive accessible names.',
      'Iframes must have non-empty, descriptive accessible names; identical names → same purpose.',
      'div/span used as controls (with onclick/keydown) must have an appropriate ARIA role.',
      'Links must have valid href values.',
    ],
  },
};
