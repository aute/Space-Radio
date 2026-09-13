# Clear-sky background specification

- Render a clean, vertically graded clear sky: no stars, clouds, sun/moon discs,
  textures, or decorative glow spots.
- Daylight is blue at the zenith, less saturated and brighter at the horizon.
  Warm sunrise/sunset color is confined mainly to the lower sky. Deep night is
  near-black navy, without the original magenta wash.
- Drive color by continuous solar elevation using the current date and available
  viewer coordinates. This naturally adapts to season, longitude, and polar days.
  Before location is available, use a continuous local-clock fallback.
- Interpolate palette colors perceptually in Oklab with continuous first
  derivatives; no hourly switches, tween resets, or intentional pauses at keys.
- Update the live clock every second and let typed CSS color properties interpolate
  between samples. Resynchronize when a hidden page becomes visible; clean up timers.
- Keep the existing application layout, assets, audio, and radio behavior intact.
- Provide a separate day-scrubbing preview for inspecting dawn/day/dusk/night and
  accelerated transitions. Preview controls do not appear in the radio itself.

The palette is an artistic approximation of a clear atmosphere, not a radiometric
atmospheric scattering simulation. Solar elevation is calculated from NOAA solar
position equations; atmospheric refraction and weather are intentionally omitted.

## Verification

On 2026-09-14, all 22 tests and the production build passed. Sky-specific tests
cover solar noon/night, longitude and polar seasons, subdued night luminance,
daylight horizon lightness, continuous colors and slopes at palette boundaries,
midnight continuity, sub-hour updates, and timer cleanup. Browser inspection checked
the eight time-of-day previews, accelerated playback, and a real intermediate color
sample during a typed CSS-property transition. Existing bundle/media size warnings
remain unrelated to this change.

Run `node scripts/preview-fixture.js --sky` and open http://localhost:3100 to inspect
the separate preview. It uses Shanghai coordinates and an editable date.
