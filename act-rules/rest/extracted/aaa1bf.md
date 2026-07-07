# ACT Rule aaa1bf — Audio or video element that plays automatically has no audio that lasts more than 3 seconds
status: proposed
implement: (not listed on rule page)
requirements: 1.4.2
url: https://www.w3.org/WAI/standards-guidelines/act/rules/aaa1bf/proposed/

#

Proposed

Audio or video element that plays automatically has no audio that lasts more than 3 seconds

Rule Mapping

This is an Atomic rule

## Description

audio or video that plays automatically does not output audio for more than 3 seconds.

## Applicability

This rule applies to any audio or video element for which all the following are true:

autoplay : the element has an autoplay attribute value of true ; and

not muted : the element has a muted attribute value of false ; and

not paused : the element has a paused attribute value of false ; and

duration : the element has a media resource lasting more than 3 seconds that contains audio.

## Expectation

For each test target the total audio output does not last more than 3 seconds.

Note: This rule does not cover single audio instances that play repeatedly for more than three seconds, or multiple audio instances for more than three seconds. The WCAG Understanding documentation for 1.4.2 Audio Controls is ambiguous about how to handle these scenarios.

## Background

### Assumptions

There are no assumptions.

### Accessibility Support

There are no accessibility support issues known.

### Other Resources

Understanding Success Criterion 1.4.2: Audio Control

F23: Failure of 1.4.2 due to playing a sound longer than 3 seconds where there is no mechanism to turn it off

G60: Playing a sound that turns off automatically within three seconds

G171: Playing sounds only on user request

## Accessibility Requirements Mapping

G60: Playing a sound that turns off automatically within three seconds

Learn more about technique G60

Not required for conformance to any W3C accessibility recommendation.

Outcome mapping:

Any failed outcomes: technique is not satisfied

All passed outcomes: technique needs further testing

An inapplicable outcome: technique needs further testing

## Input Aspects

The following aspects are required in using this rule.

DOM Tree

CSS Styling

Audio output

Visual output (no link available)

## Examples

### Passed

#### Passed Example 1

Open in a new tab

This audio element does not play automatically for more than 3 seconds.

<audio src= "/test-assets/moon-audio/moon-speech.mp3#t=25" autoplay ></audio>

#### Passed Example 2

Open in a new tab

This video element’s audio output does not last longer than 3 seconds.

<video autoplay >
<source src= "/test-assets/rabbit-video/video.mp4#t=8,10" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video.webm#t=8,10" type= "video/webm" />
</video>

### Failed

#### Failed Example 1

Open in a new tab

This audio element plays automatically for more than 3 seconds.

<audio src= "/test-assets/moon-audio/moon-speech.mp3" autoplay controls ></audio>

#### Failed Example 2

Open in a new tab

This video element plays some audio automatically for more than 3 seconds.

<video autoplay >
<source src= "/test-assets/rabbit-video/video.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video.webm" type= "video/webm" />
</video>

### Inapplicable

#### Inapplicable Example 1

Open in a new tab

This video element has audio that autoplays for longer than 3 seconds but is muted.

<video autoplay muted >
<source src= "/test-assets/rabbit-video/video.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/video.webm" type= "video/webm" />
</video>

#### Inapplicable Example 2

Open in a new tab

This video element refers to a source file that has no audio output.

<video autoplay >
<source src= "/test-assets/rabbit-video/silent.mp4" type= "video/mp4" />
<source src= "/test-assets/rabbit-video/silent.webm" type= "video/webm" />
</video>

#### Inapplicable Example 3

Open in a new tab

This audio element does not autoplay.

<audio src= "/test-assets/moon-audio/moon-speech.mp3" controls ></audio>

<h2 id="glossary">
[Glossary section omitted for brevity — see raw HTML]
