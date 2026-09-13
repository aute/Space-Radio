# User-facing compatibility specification

## Objective

Modernize the complete implementation on Node 24 while preserving the user's visual
and interaction experience. The original stylesheet rules, assets, copy, music,
layout, menus, animations, and radio model are the compatibility boundary; obsolete
implementation details are not.

## Behavior contracts

1. The original entry screen waits for location and satellite position. Clicking its
   arrow unlocks browser audio and reveals the radio. Development and production use
   this same flow. Failures show recovery text and Retry only in the error state.
2. Sky gradients now follow continuous solar elevation as specified in [sky.md](sky.md).
   The header, sliding menu, story/back
   view, sidebar, and rolling distance digits retain their existing styles.
3. Coordinates retain degrees/minutes/seconds and hemisphere suffixes. Forecasts use
   local `AM/PM hh:mm:ss`. Missing forecasts show a neutral time placeholder instead
   of `Invalid date`. Development-only debug forecast rows are removed.
4. A pass means elevation >= 10°, matching the retired Open Notify definition.
   Preserve an ongoing pass's rise time and show the next future pass in the sidebar.
5. The distance model is sqrt(surfaceDistance² + 350²), using the original Earth
   radius of 6378.137 km. Radio coverage is strictly below 2250 km. Preserve pink
   noise and the original noise/music gain curves; dispose music when coverage ends.
6. Load real MP3s, shuffle without repeats within a cycle, ignore late loads after
   coverage exit, and release resources on unmount. Audio starts only after a gesture.
7. Enter/click sends nonempty messages while usable and clears the input. IME Enter
   does not send. Messages appear newest-first and clear outside a pass. Retain
   existing Socket.IO event names while upgrading both ends of its protocol.
8. A single socket supplies location, playlist, and chat data. Reconnect re-registers
   the location. Repeated joins replace previous registration. Disconnected users
   are removed, and malformed input does not crash the server.
9. Latitude/longitude zero are valid. Subscribe to position before async location and
   forecast requests. Forecast outages do not stop live position or playlist updates.
10. `npm ci`, `npm test`, `npm run build`, `npm start`, and `npm run serve` work on
    Node 24. Build output remains `build/`. Shutdown and startup failures release ports.

## Implementation choices

- React 19 Hooks and MobX 6 `makeAutoObservable`; no legacy decorators/lifecycles/refs.
- Tone 15 behind a testable audio controller; Socket.IO 4 and Koa 3 on the server.
- Native geolocation/fetch and formatting; remove Tencent JSONP, Moment, Geodesy,
  duplicate frontend sockets, and unused service-worker/CRA scaffolding.
- Keep the isolated Odometer renderer and its original CSS for visual fidelity.
- Calculate both position and predictions with Satellite.js SGP4 using fresh TLEs.
  Prefer CelesTrak, fall back to Where the ISS at; bound refreshes/cache/forecast horizon.
- Preserve all existing styles except an additive initialization-error rule.
- A separate browser fixture uses controlled data and is never part of production.

## Verification

Automated tests cover position/forecast independence, zero coordinates, reconnect,
unmount races, message ordering and clearing, IME handling, menu/story navigation,
coordinate/time formatting, audio gain/playlist/late-load behavior, real local socket
connections, API validation/failure, and server startup cleanup. Orbital fixtures
verify ordered passes, actual 10° rise crossings, ongoing passes, and stale elements.

Browser checks cover the real location/position/forecast flow, entry button, menu and
story, plus controlled in-coverage MP3 playback and chat. The fixture's AudioContext
and decoded audio buffer starts are observed directly; its orbit data is explicitly
synthetic test data. Production receives only downloaded orbital elements.

### Results on 2026-09-14 (Node 24.4.0)

- Clean `npm ci`, all 17 tests, and production build passed.
- `npm audit` reported zero known vulnerabilities across the installed graph.
- Live location, satellite distance, and five forecast windows loaded successfully.
- Polling-only and WebSocket-only clients received all four playlist entries via
  the development proxy; the forecast API returned HTTP 200.
- Production HTML and linked scripts/styles, focus SVG, and MP3 returned HTTP 200.
- Browser audio instrumentation observed a running AudioContext, real MP3 playback,
  the first source ending on coverage exit, and a different MP3 starting on reentry;
  no browser error or unhandled rejection was recorded in that scenario.
- Desktop menu/story and 390-pixel mobile menu were visually inspected. Existing
  CSS and visual assets were retained; only the error-state CSS was added.
- Build size warnings remain for the original media files and vendor bundle.

References:
- [React 19 migration](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [MobX state](https://mobx.js.org/observable-state.html)
- [Original pass definition](https://open-notify-api.readthedocs.io/en/latest/iss_pass.html)
- [Satellite.js](https://github.com/shashwatak/satellite-js)
- [Tone Player](https://tonejs.github.io/docs/15.1.22/classes/Player.html)
- [Webpack development server migration](https://github.com/webpack/webpack-dev-server/blob/main/migration-v6.md)
