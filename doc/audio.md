# Receiver texture and playback transitions

## Review findings

- The previous controller downloaded the next track only after the current track
  ended, leaving network/decoding gaps between tracks.
- Distance updates assigned volume immediately, and coverage exit disposed a
  playing source immediately. These abrupt gain changes could click or sound cut off.
- One plain pink-noise source had no spectral drift or intermittent receiver detail.
- Failed tracks were consumed from the shuffle cycle; a new cycle could repeat the
  track just played. Concurrent starts and failures during node creation also needed
  explicit lifecycle handling.

## Accepted behavior

- Retain the original 2250 km coverage rule and distance-volume curve.
- Use restrained receiver noise: filtered pink hiss, drifting narrow-band static,
  occasional soft tuning sweeps and a faint heterodyne tone. No speech, music samples,
  alarm-like beeps, or harsh impulse clicks are added to the ambience.
- Smooth distance gain changes; fade music out on coverage exit and noise in/out on
  initial start/stop. Keep the texture quieter as reception improves.
- Preload one successor and schedule its overlap using the audio clock. Use a short
  crossfade, release finished sources, and bound decoded buffers to two at a time.
- Cancel queued playback and stale loads on exit/dispose; tolerate rapid reentry,
  playlist changes, empty playlists, download failure, and delayed end callbacks.
- Shuffle without repeats per cycle and avoid immediate repetition at cycle boundaries
  when more than one track is available. Skip failed files with bounded retry/backoff.
- Keep production UI unchanged. A separate audio preview supports A/B listening,
  distance changes, and accelerated track transitions with the same production engine.

This is synthesized radio-receiver sound design, not a recording of space plasma.

## Implementation and verification

- The controller separates a distance-controlled music bus from per-track linear
  envelopes. It preloads one successor and schedules a 1.6-second overlap on Tone's
  audio clock. Very short buffers use a proportionally shorter envelope.
- Coverage exit ramps the bus over 0.6 seconds, cancels queued sources, and frees
  the outgoing player after its exit envelope. Distance noise changes use 0.8 seconds.
- Receiver layers use a high/low-pass filtered pink bed, slowly swept band-pass
  white noise, and random 4–12-second tuning details with smooth envelopes.
- `stop()` is called explicitly before disposal: Tone 15's noise disposal only
  disconnects its looping source. Late downloads cannot restart released players.
- Eleven controller tests cover overlap scheduling, gain ramps, canceled loads,
  concurrent starts, initialization retry, failed media/backoff, rapid reentry,
  playlist replacement/empty playlists, shuffle boundaries, and timer cleanup.
- Real browser playback decoded the original MP3 files and scheduled starts 10.4
  seconds apart in the 12-second fixture (1.6-second overlap). Leaving coverage
  ended active and queued music; no error or unhandled rejection was recorded.

The texture is intentionally subtle. A/B listening is the subjective acceptance
check; automated tests verify scheduling and lifecycle, not perceived sound quality.

After explicit source-stop cleanup, browser checks confirmed all receiver graph
nodes disposed and both looping noise sources stopped. A 12.5-second output sample
at 3000 km showed varying RMS (approximately 0.0041–0.0077), changing tuning-band
frequency, and peak amplitude 0.026, with no clipping in that sample. The full suite
passed 30 tests; the production build passed with existing asset-size warnings.

## Pass-aligned reception (revised listening behavior)

The former distance-only curve was already clear at the 10-degree rise crossing.
Reception now also follows the shared page clock's pass progress in both live and
rehearsal modes. Before rise and at rise, in-range music is attenuated to -42 dB
and receiver noise remains at -20 dB. A smooth envelope opens over the first 25%
of the pass, retaining interference early and reaching clear reception around
20–25%. The last quarter mirrors this transition on departure. The 2250 km outer
limit and distance-dependent attenuation remain; without forecasts, distance-only
reception is the fallback. Gain ramps and track scheduling are unchanged.

Tests cover the ten-second lead-in, early interference, quarter-pass clarity,
mirrored departure, startup envelope retention, and the shared rehearsal clock.
This supersedes the earlier requirement to preserve the distance curve alone.

Verification: all 40 tests and the production build passed. Instrumentation on the
real page observed music gain 0.007943 (-42 dB) and noise gain 0.1 (-20 dB) during
the rehearsal lead-in and rise crossing. The pass marker began while these weak
reception levels were still applied. Refresh returned the page to live mode.


### Audible music during ingress

Listening feedback showed that the -42 dB starting music level masked the opening
of tracks. The pass envelope now starts music at -22 dB (20 dB higher), capped by
the distance-only level at weak outer-edge reception. The existing music rise and
noise fade shapes remain unchanged: music is present beneath interference early,
then becomes clear through the first quarter. Earlier -42 dB measurements above
record the superseded envelope. Regression tests cover the revised starting level,
startup retention, and avoiding a gain boost at the coverage boundary.

## Fixed rehearsal track

Rehearsal pins `./musicList/1.mp3`, whose ID3 title is 告别 (Li Tai-hsiang /
Tang Hsiao-shih). Each new rehearsal session fades out current playback, cancels
its queue and starts this track from the beginning. Live playlist broadcasts cannot
change the rehearsal selection. Normal live mode keeps the original shuffle.
Regression tests cover entering from an already playing track, restarting rehearsal,
and restoring the live playlist.
