# MVP verification — 2026-11-17

## Executed

- Materializer build: 11 chronological events, 15 map features (9 markers, 3 routes, 3 regions), 9 sanitized cards, notes, project catalog.
- Seven Node content tests passed: valid sample; broken marker reference; impossible date; invalid/empty coordinates; missing cards/open region rings; CSV quoting/Markdown sanitization; basemap layers and photograph.
- Renderer production bundle built successfully with locally bundled Leaflet.
- Interactive checks in the Codex in-app browser at desktop (1440 × 1000) and mobile (390 × 844) sizes: map rendering; timeline/card selection; previous/next; marker selection; full-extent reset; layer checkboxes; Read/Hike; About; project catalog; notes navigation; deep-link loading; missing-project recovery; keyboard event activation; skip-link and reload.
- All 9 markers and 11 events present. Cards hidden initially. Last-event Next button disabled. Selected Great Falls event shows moment 5/11 and the matching card; Next opens Lemhi Pass.
- Photograph decoded successfully at 1600 pixels wide. Mobile document width equals the 390-pixel viewport. No browser console warnings or errors observed.
- Desktop and mobile screenshots are in `screenshots/`.
- The staged deployment bundle was opened under `/_site/`: all 9 markers and 11 events rendered, and the Fort Clatsop card photograph loaded. This verifies relative asset paths for a GitHub Pages repository subpath.
- `git diff --check` passed.

## Additional automation

`atlas.spec.js` supplies a repeatable Playwright desktop/mobile suite. Its syntax was checked, but the standalone Playwright runner was not executed successfully in this environment: the initial attempt could not bind its preview server inside the sandbox. The server was subsequently started with approved permissions and the interaction checks above were completed in the in-app browser instead. Install Chromium and run `npm test --prefix renderer` to execute this separate suite.

## Scope

The routes are schematic outbound connections. Return events are included, but the 1806 return branches are not mapped. Focus regions are editorial, and Natural Earth depicts modern generalized geography. No public deployment was performed.
