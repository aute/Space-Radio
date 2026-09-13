# Blocked-send notice

Clicking Send or pressing Enter while sending is unavailable displays a temporary
notice above the input row. It uses a black background, a one-pixel white border,
and centered white text showing that sending is unavailable and the next predicted
pass's local date and time. Missing forecasts show a neutral unavailable-time message.

The notice disappears after four seconds. Repeated attempts reset its timer without
stacking boxes; entering reception dismisses it immediately. Draft text is preserved,
no message is emitted, and IME confirmation does not trigger a send attempt. Timers
are cleaned up on unmount. No extra control or permanent status is added.

Tests cover blocked sends, preserved drafts, next-pass time, retry timing, missing
forecasts and reception recovery. On the real page the notice displayed the next
pass at 9/14 16:11:11 with black/white computed styles and dismissed automatically.
All 47 tests and the production build passed.
