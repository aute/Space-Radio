# Hidden page-clock rehearsal

Five logo clicks within three seconds jump this page to ten seconds before the
next future forecast pass. Time advances at 1x using a monotonic elapsed clock.
The sky, pass visibility, distance and audio share this clock. Simulated positions
come from the backend's real orbital elements at the requested timestamp; live
socket positions are retained separately and cannot overwrite rehearsal positions.

The hidden gesture leaves normal logo appearance unchanged. Rehearsal adds no visible status or controls; refresh restores live time.
Missing forecasts and prediction errors do not invent a pass. Overlapping requests, restore and unmount must cancel or ignore late results.
During rehearsal, chat uses a page-local channel with the same message UI and
pass gating. Sent text appears locally without contacting the live broadcast server.
Refresh restores live messaging. Switching sessions clears rehearsal messages.

## Verification

- Tests cover the five-click window/reset, ten-second lead-in, 1x monotonic clock,
  live-position isolation, restore, missing passes, in-flight cancellation and unmount.
- Backend tests check invalid timestamps, requested-date propagation, and unchanged
  live position after a future prediction.
- The real page at port 3000 was exercised with actual geolocation and forecasts:
  four clicks did nothing; the fifth jumped to 16:11:01 before the 16:11:11 pass.
  The marker appeared after ten seconds, and returning to live removed rehearsal state.
  Wall-clock elapsed time remained approximately twelve seconds during the check.
- All 36 tests and the production build passed; existing asset-size warnings remain.

The visible rehearsal banner and restore button were subsequently removed at the
user's request. Refresh is the user-facing way to leave rehearsal; the internal
restore operation remains for lifecycle cleanup and restarting a rehearsal.

Rehearsal chat regression: the real page was entered via the hidden gesture, then
an Enter submission appeared in the existing message list and cleared the input.
No rehearsal banner appeared, and refresh removed the test message. The local
channel test also verifies pass gating and that the live socket is never called.
All 37 tests and the production build passed after this change.

Rehearsal always plays 告别 (`musicList/1.mp3`) from the beginning, including when
restarting the hidden gesture. Refresh restores the normal shuffled playlist.
