# ACT Rule c5a4ea — Video element visual content has accessible alternative
status: proposed
implement: (not listed on rule page)
requirements: 1.2.3
url: https://www.w3.org/WAI/standards-guidelines/act/rules/c5a4ea/proposed/

#

Proposed

Video element visual content has accessible alternative

Rule Mapping

This is a Composite rule
to test
1.2.3: Audio Description or Media Alternative (Prerecorded) (Level A)

## Description

This rule checks that video elements with audio have an alternative for the video content as audio or as text.

## Applicability

This rule applies to every non-streaming video element that is visible , where the video contains audio.

## Expectation

For each test target, the outcome of at least one of the following rules is passed:

Video Element Visual Content Has Audio Description

Video Element Visual Content Has Transcript

Video Element Content Is Media Alternative For Text

## Background

### Assumptions

This rule assumes that a mechanism is available to start the video and that the video element is not simply used to display the poster .

This rule assumes that the language of each test target can be correctly determined (either programmatically or by analyzing the content), and sufficiently understood.

### Accessibility Support

The HTML video element can also have a track element that provides an audio description. This should provide assistive technologies with a timed text description of visual information in a video. However, there is no native support in any major browser for this technique. Technique H96: Using the track element to provide audio descriptions can not be relied upon to conform to 1.2.3: Audio Description or Media Alternative (Prerecorded) .

### Other Resources

Understanding Success Criterion 1.2.5: Audio Description (Prerecorded)

G78: Providing a second, user-selectable, audio track that includes audio descriptions

G173: Providing a version of a movie with audio descriptions

G8: Providing a movie with extended audio descriptions

## Accessibility Requirements Mapping

1.2.3 Audio Description or Media Alternative (Prerecorded) (Level A)

Learn more about 1.2.3 Audio Description or Media Alternative (Prerecorded)

Required for conformance to WCAG 2.0 and later on level A and higher.

Outcome mapping:

Any failed outcomes: success criterion is not satisfied

All passed outcomes: success criterion needs further testing

An inapplicable outcome: success criterion needs further testing

G8: Providing a movie with extended audio descriptions

Learn more about technique G8

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

G69: Providing an alternative for time based media

Learn more about technique G69

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

G78: Providing a second, user-selectable, audio track that includes audio descriptions

Learn more about technique G78

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

G173: Providing a version of a movie with audio descriptions

Learn more about technique G173

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

### Secondary Requirements

This rule is related to the following accessibility requirements, but was
not designed to test this requirements directly. These
secondary requirements
can either be stricter than the rule requires, or may be satisfied in ways
not tested by the rule:

1.2.5 Audio Description (Prerecorded) (Level AA) : This success criterion is more strict than this rule. This is because the rule allows a media alternative in place of audio description. Some of the passed examples do not satisfy this success criterion.

1.2.8 Media Alternative (Prerecorded) (Level AAA) : This success criterion is more strict than this rule. This is because the rule allows audio description in place of a media alternative. Some of the passed examples do not satisfy this success criterion.

## Input Rules

Outcomes of the following rules are required as input for this rule.

Video element visual content has audio description

Audio and visuals of video element have transcript

Video element content is media alternative for text

## Examples

These HTML files are used in several examples:

File /test-assets/rabbit-video/transcript.html :

<!DOCTYPE html>
<html lang= "en" >
<head>
<meta charset= "utf-8" />
<title> Description of the rabbit video </title>
</head>
<body>
<h1> Description of the rabbit video </h1>
<p>
The video shows a giant fat rabbit climbing out of a hole in the ground. He stretches, yawns, and then starts
walking. Then he stops to scratch his bottom.
</p>
</body>
</html>

File /test-assets/rabbit-video/incorrect-transcript.html :

<!DOCTYPE html>
<html lang= "en" >
<head>
<meta charset= "utf-8" />
<title> Description of the dog video </title>
</head>
<body>
<h1> Description of the dog video </h1>
<p>
The video shows a giant fat dog climbing out of a hole in the ground. He stretches, yawns, and then starts
walking. Then he stops to scratch his bottom.
</p>
</body>
</html>

### Passed

#### Passed Example 1

Open in a new tab

This video element has an audio description because it has voiceover that describes the visual information.

<html lang= "en" >
<video controls >
<source src= "/test-assets/rabbit-video/video-with-voiceover.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video-with-voiceover.webm" type= "video/webm" />
</video>
</html>

#### Passed Example 2

Open in a new tab

A video element with a link to a text transcript.

<html lang= "en" >
<video controls >
<source src= "/test-assets/rabbit-video/video.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video.webm" type= "video/webm" />
</video>
<a href= "/test-assets/rabbit-video/transcript.html" > Transcript </a>
</html>

#### Passed Example 3

Open in a new tab

This video element describes some of the text on the same page. The text identifies the video as an alternative.

<html lang= "en" >
<p>
Not being able to use your computer because your mouse doesn't work, is frustrating. Many people use only the
keyboard to navigate websites. Either through preference or circumstance. This is solved by keyboard compatibility.
Keyboard compatibility is described in WCAG. See the video below to watch the same information again in video form.
</p>
<video src= "/test-assets/perspective-video/perspective-video.mp4" controls ></video>
</html>

### Failed

#### Failed Example 1

Open in a new tab

This video element has an incorrect audio description.

<html lang= "en" >
<video controls >
<source src= "/test-assets/rabbit-video/video-with-incorrect-voiceover.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video-with-incorrect-voiceover.webm" type= "video/webm" />
</video>
</html>

#### Failed Example 2

Open in a new tab

A video element with a link to an incorrect text transcript on a different page.

<html lang= "en" >
<video controls >
<source src= "/test-assets/rabbit-video/video.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video.webm" type= "video/webm" />
</video>
<a href= "/test-assets/rabbit-video/incorrect-transcript.html" > Transcript </a>
</html>

#### Failed Example 3

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

#### Failed Example 4

Open in a new tab

A video element with a description track element. Description tracks are not supported.

<html lang= "en" >
<video controls >
<source src= "/test-assets/rabbit-video/video.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video.webm" type= "video/webm" />
<track kind= "descriptions" src= "/test-assets/rabbit-video/descriptions.vtt" />
</video>
</html>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

A video element without audio.

<html lang= "en" >
<video controls >
<source src= "/test-assets/rabbit-video/silent.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/silent.webm" type= "video/webm" />
</video>
</html>

#### Inapplicable Example 2

Open in a new tab

A video element that is not visible .

<html lang= "en" >
<video controls style= "display: none;" >
<source src= "/test-assets/rabbit-video/video.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video.webm" type= "video/webm" />
</video>
</html>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
