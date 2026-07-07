# ACT Rule eac66b — Video element auditory content has accessible alternative
status: proposed
implement: (not listed on rule page)
requirements: 1.2.2
url: https://www.w3.org/WAI/standards-guidelines/act/rules/eac66b/proposed/

#

Proposed

Video element auditory content has accessible alternative

Rule Mapping

This is a Composite rule
to test
1.2.2: Captions (Prerecorded) (Level A)

## Description

This rule checks that video elements have an alternative for information conveyed through audio.

## Applicability

This rule applies to every non-streaming video element that is visible , where the video contains audio.

## Expectation

For each test target, the outcome of at least one of the following rules is passed:

Video Element Content Is Media Alternative For Text

Video Element Auditory Content Has Captions

## Background

### Assumptions

This rule assumes that the video element is used to play synchronized media (video with audio), and that there is a mechanism to start the media.

This rule assumes that the language of each test target can be correctly determined (either programmatically or by analyzing the content), and sufficiently understood.

### Accessibility Support

There are no accessibility support issues known.

### Other Resources

Understanding Success Criterion 1.2.2: Captions (Prerecorded)

G93: Providing open (always visible) captions

G87: Providing closed captions

H95: Using the track element to provide captions

## Accessibility Requirements Mapping

1.2.2 Captions (Prerecorded) (Level A)

Learn more about 1.2.2 Captions (Prerecorded)

Required for conformance to WCAG 2.0 and later on level A and higher.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion needs further testing

An inapplicable outcome: success criterion needs further testing

G87: Providing closed captions

Learn more about technique G87

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

G93: Providing open (always visible) captions

Learn more about technique G93

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

H95: Using the track element to provide captions

Learn more about technique H95

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

## Input Rules

Outcomes of the following rules are required as input for this rule.

Video element content is media alternative for text

Video element auditory content has captions

## Examples

### Passed

#### Passed Example 1

Open in a new tab

A video element with an associated track element that contains captions for all the audio.

<html lang= "en" >
<video src= "/test-assets/perspective-video/perspective-video.mp4" controls >
<track src= "/test-assets/perspective-video/perspective-caption.vtt" kind= "captions" />
</video>
</html>

#### Passed Example 2

Open in a new tab

A video element that describes some of the text on the same page. The text on the page labels the video as an alternative.

<html lang= "en" >
<p>
Web Accessibility Perspectives: Keyboard Accessibility. Not being able to use your computer because your mouse
doesn't work, is frustrating. Many people use only the keyboard to navigate websites. Either through preference or
circumstance. This is solved by keyboard compatibility. Keyboard compatibility is described in WCAG. See the video
below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video.mp4" controls ></video>
</html>

### Failed

#### Failed Example 1

Open in a new tab

A video element without any form of captions.

<html lang= "en" >
<video src= "/test-assets/perspective-video/perspective-video.mp4" controls ></video>
</html>

#### Failed Example 2

Open in a new tab

A video element that describes some of the text on the same page. The video contains more information than the text does.

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Either through preference or
circumstance. This is solved by keyboard compatibility. Keyboard compatibility is described in WCAG. See the video
below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video.mp4" controls ></video>
</html>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

A video element that is not visible .

<html lang= "en" >
<video src= "/test-assets/perspective-video/perspective-video.mp4" controls style= "display: none;" ></video>
</html>

#### Inapplicable Example 2

Open in a new tab

A video element without audio.

<html lang= "en" >
<video src= "/test-assets/perspective-video/perspective-video-silent.mp4" controls ></video>
</html>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
