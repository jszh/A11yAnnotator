'use strict';
// 1.4.3 Contrast (Minimum). Rules 1–2: GenA11y's detect_contrast test rules. GenA11y's rule 3 ("check text
// readability from the screenshot") is removed: readability is not the criterion; rule 3 below states what is.
module.exports = {
  sc: '1.4.3', title: 'Contrast (Minimum)',
  rules: [
    {
      from: 'gena11y',
      text: 'Normal text and its background must achieve at least 4.5:1 contrast ratio.',
      tools: ['compute_contrast_ratio', 'resolve_part_color'],
      rubric: `Text below the large-text size fails when its colour and the background it is rendered on have a contrast ratio below 4.5:1 (ACT afw4f7; F24 when a foreground colour is set without a background, or the reverse). When the computed background and the rendered background agree, the computed ratio is the measurement. Exempt (1.4.3's exceptions): text in inactive (disabled) components, pure decoration, text that is not visible, text that is part of a picture with significant other visual content, and logotypes. Evidence: text colour, computed background (composited through translucent layers), ratio and threshold, the dominant rendered colour behind the text.`,
    },
    {
      from: 'gena11y',
      text: 'Large text (≥18pt normal or ≥14pt bold) must achieve at least 3:1.',
      tools: ['compute_contrast_ratio', 'resolve_part_color'],
      rubric: `Large text (at least 18 pt / 24 CSS px, or 14 pt / about 18.66 CSS px bold) fails below 3:1, with the same exceptions as rule 1.`,
    },
    {
      from: 'added',
      text: 'Text over an image, gradient or overlapping content must meet its ratio against the part of the background behind each part of the text.',
      tools: ['measure_text_contrast_over_image', 'resolve_part_color', 'compute_contrast_ratio', 'set_state_and_capture'],
      rubric: `Where the background is not one colour, the least-contrasting part of the text governs: it fails when some part of the text drops below its threshold against what is rendered behind it (F83 for text over a background image). measure_text_contrast_over_image reports the worst-case ratio under the glyphs; resolve_part_color and compute_contrast_ratio measure a specific region. Check the crop.`,
    },
  ],
};
