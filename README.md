# Space Radio

An ISS-inspired radio: a changing sky, satellite passes, distance-controlled music
and pink noise, and messages shared while the station is overhead.

## Run locally

Use **Node 24** (`.nvmrc`), then:

```sh
npm ci
npm start
```

Open http://localhost:3000, allow location access, and press the original arrow
button to start audio. The development page now uses the same entry screen as
production, so browser audio permissions work consistently.

`npm start` runs the frontend and backend together; Ctrl+C closes both. The backend
uses port 3001. HTTP API calls and Socket.IO are proxied through the frontend.
For different ports: `PORT=3200 API_PORT=3201 npm start`.
Both listeners default to loopback; use `HOST=0.0.0.0` explicitly for LAN access.
Browser location access requires HTTPS outside localhost.

## Verify and build

```sh
npm test
npm run build
npm run serve
```

Production assets stay in `build/`, including all original logos, images, and music.
`npm run serve` serves the app and Socket.IO at http://localhost:3001; `PORT` and
`HOST` configure this listener. Deploy frontend and backend together behind an
HTTPS reverse proxy that forwards `/api` and `/socket.io`, including WebSocket
upgrades. The app is designed for deployment at the origin root.

Tests use Node's test runner, Vitest, jsdom, and React Testing Library. GitHub Actions
runs clean installation, tests, and the production build on Node 24.
`package-lock.json` is the only package lockfile; use npm.

## Preserved experience

- Original CSS layout, sky gradients, logos, menu labels, story, and music files.
- Original rolling number animation, coordinate typography, and local AM/PM times.
- Pink noise and the original distance-volume curves; music within 2250 km.
- Ten-degree elevation pass windows and newest-first messages while passing.

The internals use React 19 function components, MobX 6 without decorators, Tone 15,
Socket.IO 4, Koa 3, Webpack 5, and the current Babel pipeline. The small Odometer
renderer is intentionally isolated in `ForecastBoard` to preserve its exact
animation. JSONP, the embedded Tencent key/script, Moment, obsolete CRA scaffolding,
and duplicate socket connections have been removed.

## Orbital data

The retired Open Notify prediction API is replaced by local SGP4 calculations using
Satellite.js and real ISS TLE elements. Elements are downloaded over HTTPS from
CelesTrak, with Where the ISS at as a fallback. They are refreshed every six hours;
requests share the refresh and predictions are cached briefly. Elements older than
seven days are rejected. No artificial positions or passes are used in production.

The backend uses the same orbit for live coordinates and pass forecasts, preserving
the original 10° pass threshold. It searches the next 48 hours and returns up to five
passes, including a pass currently in progress. Extreme latitudes may have none.
Predictions are estimates and can shift after station maneuvers or refreshed elements.
The displayed distance keeps the original 350 km artistic altitude model rather
than changing the sound design to track altitude variations.

Position updates and playlist delivery no longer wait for successful forecasts.
Initialization failures offer Retry; failed forecasts retry in the background.
Disconnected sockets, abandoned location requests, timers, and audio nodes are cleaned
up. Zero latitude/longitude are valid locations. Music stops outside coverage and
tracks are shuffled without repeating until the playlist is exhausted.

## Browser regression fixture

```sh
node scripts/preview-fixture.js
```

http://localhost:3100 is a **test-only** page with controlled position/pass events
and real audio playback. It is excluded from production builds. It can exercise
sending messages and audio transitions without waiting for an actual ISS pass.
In its browser console, `radioFixture.leaveCoverage()` and
`radioFixture.reenterCoverage()` control the test scenario.

See [the behavior specification and verification notes](doc/modernization.md).
