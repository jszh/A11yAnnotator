# ACT Rule fd26cf — Video element visual-only content is media alternative for text
status: proposed
implement: (not listed on rule page)
requirements: (no mapped WCAG SC — pure ARIA/other; requirementKeys: )
url: https://www.w3.org/WAI/standards-guidelines/act/rules/fd26cf/proposed/

#

Proposed

Video element visual-only content is media alternative for text

Rule Mapping

This is an Atomic rule

## Description

This rule checks non-streaming silent video is a media alternative for text on the page.

## Applicability

This rule applies to any non-streaming video element that is visible where the video does not contain audio.

## Expectation 1

All the information contained in each target element is available as text (directly or via text alternatives) that is visible and included in the accessibility tree .

## Expectation 2

Each target element is labeled as a video alternative for text on the page by content that is visible and included in the accessibility tree .

## Background

The term label used in expectations 2 and 3 does not refer to the label element.

### Assumptions

A mechanism is available to start the video and that the video element is not simply used to display the poster .

### Accessibility Support

There are no accessibility support issues known.

### Other Resources

Understanding Success Criterion 1.2.1: Audio-only and Video-only (Prerecorded)

## Accessibility Requirements Mapping

This rule is not required for conformance.

## Input Aspects

The following aspects are required in using this rule.

DOM Tree

CSS Styling

Audio output

Language

## Examples

### Passed

#### Passed Example 1

Open in a new tab

This video element, which has no audio, is a media alternative for the text in the page and it is labeled as such.

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Many people use only the
keyboard to navigate websites. Either through preference or circumstance. This is solved by keyboard compatibility.
Keyboard compatibility is described in WCAG. See the video below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video-with-captions-silent.mp4" controls ></video>
</html>

### Failed

#### Failed Example 1

Open in a new tab

This video element, which has no audio, has more information than the text on the page.

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Either through preference or
circumstance. This is solved by keyboard compatibility. Keyboard compatibility is described in WCAG. See the video
below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video-with-captions-silent.mp4" controls ></video>
</html>

#### Failed Example 2

Open in a new tab

This video element, which has no audio, is a media alternative for the text in the page and labeled as such, but the text is not visible .

<html lang= "en" >
<p style= "display: none;" >
Not being able to use your computer because your mouse doesn't work, is frustrating. Many people use only the
keyboard to navigate websites. Either through preference or circumstance. This is solved by keyboard compatibility.
Keyboard compatibility is described in WCAG. See the video below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video-with-captions-silent.mp4" controls ></video>
</html>

#### Failed Example 3

Open in a new tab

This video element, which has no audio, is a media alternative for the text in the page but not labeled as such.

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Many people use only the
keyboard to navigate websites. Either through preference or circumstance. This is solved by keyboard compatibility.
Keyboard compatibility is described in WCAG.
</p>
<video src= "/test-assets/perspective-video/perspective-video-with-captions-silent.mp4" controls ></video>
</html>

#### Failed Example 4

Open in a new tab

This video element, which has no audio, is a media alternative for the text in the page and labeled as such, but the label is not visible .

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Many people use only the
keyboard to navigate websites. Either through preference or circumstance. This is solved by keyboard compatibility.
Keyboard compatibility is described in WCAG.
</p>
<p style= "display: none;" >
See the video below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video-with-captions-silent.mp4" controls ></video>
</html>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

This video element has audio.

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Many people use only the
keyboard to navigate websites. Either through preference or circumstance. This is solved by keyboard compatibility.
Keyboard compatibility is described in WCAG. See the video below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video.mp4" controls ></video>
</html>

#### Inapplicable Example 2

Open in a new tab

This video element is not visible .

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Many people use only the
keyboard to navigate websites. Either through preference or circumstance. This is solved by keyboard compatibility.
Keyboard compatibility is described in WCAG. See the video below to watch the same information again in video form.
</p>
<video
src= "/test-assets/perspective-video/perspective-video-with-captions-silent.mp4"
controls
style= "display: none;"
></video>
</html>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
