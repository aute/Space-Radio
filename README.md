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

- Original CSS layout, logos, menu labels, story, and music files.
- A clear-sky gradient following solar elevation, smoothly interpolated through the day.
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

## Clear-sky preview

`node scripts/preview-fixture.js --sky` opens a separate time-scrubbing preview at
http://localhost:3100. It shows a full day in Shanghai on a chosen date; Play runs
24 hours in two minutes. These controls do not appear in the radio.
The live background uses the viewer's coordinates and actual date, with continuous
Oklab interpolation and one-second clock samples. It contains no stars or clouds.
See [the sky specification](doc/sky.md).

## Radio audio preview

`node scripts/preview-fixture.js --audio` opens an A/B listening page at
http://localhost:3102. Compare the original pink noise with the new receiver texture,
change distance, and enable 12-second music excerpts to hear consecutive crossfades.
The production UI is unchanged. Reception blends the distance curve with pass
progress: interference fades through the first quarter and returns in the last. The player
preloads one successor, uses 1.6-second overlaps, smooths distance gain changes,
and fades out on coverage exit. See [the audio specification](doc/audio.md).

## ISS light preview

`node scripts/preview-fixture.js --iss` opens a 30-second pass preview at
http://localhost:3103 with night, dawn, and daytime skies. The marker adds a soft
halo, gentle shimmer, and a short fading trail. See [the appearance specification](doc/iss-appearance.md).

## Rehearse a pass on the real page

After entering the radio, click the upper-right logo five times within three
seconds. This page jumps to ten seconds before the next predicted ISS pass, then
advances at normal speed. The sky, marker and audio distance follow the page clock;
positions are propagated from the backend's real orbital elements. The computer
clock is untouched. Refresh to return to live time. Rehearsal adds no visible status or controls. Test-mode
messages appear on this page only; refreshing restores live messaging.
See [the page-clock specification](doc/page-clock.md).
