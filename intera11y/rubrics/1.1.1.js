'use strict';
// 1.1.1 Non-text Content. Rules 1–5: GenA11y's detect_non_text_content test rules; rule 2 without "videos, and
// audio" (time-based media needs descriptive identification, not an accessible name — 1.1.1's media exception).
// Rules 6–8 added in the same style.
module.exports = {
  sc: '1.1.1', title: 'Non-text Content',
  rules: [
    {
      from: 'gena11y',
      text: 'Image buttons must have a non-empty accessible name.',
      tools: [],
      rubric: `An <input type="image"> (or a button whose only content is an image) exposed to assistive technology with an empty computed name fails (ACT 59796f; F65). Evidence: the computed name and its source.`,
    },
    {
      from: 'gena11y',
      text: 'Images must have non-empty accessible names unless decorative (alt="", role="presentation", aria-hidden="true").',
      tools: ['request_hi_res_crop'],
      rubric: `An <img>, role="img" element or image-map <area> that is exposed to assistive technology and has an empty computed name fails (ACT 23a2a8; F65). An image inside a link or button that is marked decorative (alt="", role="presentation" or "none") passes when the control's own text conveys the purpose (H2); an image with no alt attribute is not marked decorative — it is still exposed, with no name, and fails even inside a named control (ACT 23a2a8). Evidence: alt attribute, computed name and source, whether it is hidden from assistive technology, the control it sits in.`,
    },
    {
      from: 'gena11y',
      text: 'Accessible names must be meaningful, not just filenames or "image".',
      tools: ['request_hi_res_crop'],
      rubric: `A text alternative that is a file name, a placeholder ("image", "photo", "graphic") or otherwise does not describe the image fails (ACT qt1vmo; F30). Compare the crop with the alternative.`,
    },
    {
      from: 'gena11y',
      text: 'Object elements must have accessible names.',
      tools: ['request_hi_res_crop'],
      rubric: `An <object> that renders non-text content (an image, a plug-in) fails when it exposes no name and no fallback content that serves as its alternative (ACT 8fc3b6).`,
    },
    {
      from: 'gena11y',
      text: 'SVG elements with explicit roles must have accessible names.',
      tools: [],
      rubric: `An <svg> (or an element inside one) with role="img", "graphics-document" or "graphics-symbol" fails when its computed name is empty (ACT 7d6734). An SVG without such a role that is hidden from assistive technology is decorative and not tested here.`,
    },
    {
      from: 'added',
      text: 'Text alternatives must serve the equivalent purpose of the non-text content in its context (the text shown in an image of text, the key facts of a chart, the destination or action of an image inside a link or button).',
      tools: ['request_hi_res_crop', 'compare_named_regions'],
      rubric: `1.1.1 requires a text alternative "that serves the equivalent purpose". It fails when the alternative omits what the image conveys in context: the words in an image of text, the data or trend a chart shows, what a photo shows when that matters to the content (F30, F20 when the alternative is not updated with the image). For an image inside a link or button, the alternative describes the function, not the picture. It passes when adjacent text already conveys the information and the image is marked decorative, or when the alternative conveys it. request_hi_res_crop re-renders a small image larger so its text can be read; compare_named_regions compares an image with the text around it.`,
    },
    {
      from: 'added',
      text: 'Images hidden from assistive technology (empty alt, role="presentation"/"none", aria-hidden, CSS background images) must be purely decorative.',
      tools: ['request_hi_res_crop'],
      rubric: `An image that is not in the accessibility tree fails when it carries information that is not available elsewhere as text (ACT e88epe; F3 for information conveyed only by a CSS background image; F39 for decorative images given text). It passes when it is decoration, spacing, or repeats adjacent text.`,
    },
    {
      from: 'added',
      text: 'Video and audio must have a text alternative that at least provides descriptive identification of the content.',
      tools: ['request_hi_res_crop'],
      rubric: `For time-based media, 1.1.1 requires text alternatives that at least provide descriptive identification (G68, G100): a name, title, caption or adjacent text that says what the media is. It fails when a video or audio element carries no such identification — no accessible name, no labelling or adjacent text naming it. A decorative background video that conveys nothing and is hidden from assistive technology passes. Evidence: computed name, title, caption, the text around it, and a crop of the poster frame.`,
    },
    {
      from: 'added',
      text: 'Characters used as pictures — look-alike letters from other scripts, ASCII art, emoticons — must have a text alternative.',
      tools: [],
      rubric: `WCAG's definition of non-text content includes ASCII art, emoticons and leetspeak (character substitution): a word spelled with letters from another script reads as those other characters. It fails when such content carries meaning and no text alternative is exposed (e.g. an aria-label or adjacent text giving the intended word). Evidence: the word and its code points.`,
    },
  ],
};
