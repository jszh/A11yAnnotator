'use strict';
// 3.3.1 Error Identification. Rule 1: GenA11y's detect_error_identification test rule, verbatim (its instruction
// "If no form or error state is present, the page passes" is not a test rule and is not carried over).
module.exports = {
  sc: '3.3.1', title: 'Error Identification',
  rules: [
    {
      from: 'gena11y',
      text: 'If an input error is automatically detected, the item in error must be identified and the error described to the user in text.',
      tools: ['interact_and_observe', 'observe_state_after_activation', 'probe_screen_reader_after_action'],
      rubric: `Applies to each field the page puts into an error state — after an empty or invalid submission, or already on load when a page is re-displayed after a failed submission. It fails when the page detects the error but no text identifies which item is in error and describes the error: the error is shown only by colour, a border or an icon without a text alternative; a message does not say which field is wrong where more than one could be; the text identifies a different item than the one in error — a message placed at, associated with, or a summary naming, a field that is not the one the page flagged — so the item in error is not identified (the SC text: "the item that is in error is identified"); the submission is refused with no message; or the text exists only visually and not for assistive technology, or only programmatically and not visibly. It passes with a text message next to the field, in its label, or in a summary that names each field (G83, G85, ARIA19, ARIA21, SCR18, SCR32), and with the browser's own validation message. When the page accepts the input (no error detected), the criterion does not apply. Evidence: per field or form — constraints and label, whether it was flagged at rest or after a submission, every text that could describe the error (validation message, aria-describedby / aria-errormessage, new text and whether it is in a live region, native alert text), focus, whether the submission went through, images at rest and after each submission. interact_and_observe reproduces a submission; probe_screen_reader_after_action reads what a screen reader announces.`,
    },
  ],
};
