# ISS light appearance

The passing marker keeps its existing trajectory, pass duration and ISS label.
A small warm-white core sits inside a soft cool halo. Slow, shallow and irregular
opacity changes suggest atmospheric shimmer without blinking fully off. A short,
diffuse trail points opposite travel and fades away from the core. The original
focus ring remains a subdued identification detail, separate from the light layers.

The marker is absent outside a pass. All decorative layers ignore pointer events.
Reduced-motion preference removes shimmer, halo breathing and ring rotation while
retaining the station's passage. No background stars or particles are added.

This is an artistic light treatment; the trail is not an orbital exhaust model.
Visual verification should cover dark sky, twilight, daylight and narrow screens.

## Verification

The `--iss` browser fixture on port 3103 shows an accelerated 30-second passage
against the production sky. Browser screenshots verified night, daylight, and dawn
at a 390-pixel viewport. Computed styles confirmed the trail follows the viewport
flight vector and reduced-motion disables all decorative animations. Existing 30
tests and the production build passed (existing asset-size warnings remain).

## Earlier visible entry and transparent input row

The marker now has a five-second visual lead-in and begins 48 pixels above the
input row, instead of traveling from below the viewport. Its motion ends at the
actual pass end; audio and chat still follow the actual rise time. Joining an
ongoing pass starts at the corresponding elapsed position, captured once on mount
so shared-clock updates do not accelerate or restart the animation. The tail angle
uses the revised flight vector.

The input row has a transparent background, including the bottom of the desktop
sidebar. Existing borders, input and send controls remain. Regression tests cover
the visual lead-in independently of reception and the initial elapsed-time offset.

Verification after entry changes: all 43 tests and the production build passed.
On the real page at 740 px width, the first visible marker's bottom was at 839 px
while the input row began at 863 px, and actual pass eligibility was still false.
The input background computed to transparent. Narrow and 1100 px desktop layouts
were visually checked; refreshing returned to live time.

## Corrected entrance and layout-specific input background

The visible spawn was replaced with a ten-second offscreen entrance. The marker
starts below the viewport and eases upward to the sky above the input row, then
continues its traversal until pass end. A Web Animation preserves initial elapsed
time and keeps progress when resizing; cleanup cancels the animation and listener.
This supersedes the earlier five-second visible start.

The wide split-panel layout keeps the entire sidebar and its input row black.
Only the full-width sky layout (at or below the existing 960 px breakpoint) makes
the input background transparent. Coordinate placeholder text is 65%-opaque white
in both layouts, rather than the browser's default gray.


## Uniform passage speed

The accelerated entrance segment was removed after listening to visual feedback.
The entire passage now follows one linear path, from 12 pixels below the viewport
to 48 pixels above it. The ten-second visual lead remains, but no separate ingress
speed or easing is applied. The shorter offscreen margin makes the light appear
sooner while preserving continuous movement. The tail angle matches this path.

Browser verification sampled the production marker in the 30-second fixture at
0, 5, 10 and 15 seconds: each interval covered approximately 144.94 pixels. The
animation reports linear easing throughout. All 43 tests and the build passed.
