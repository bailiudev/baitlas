# Page refinement verification — 2026-11-17

## Executed

- Materializer and renderer builds passed. Output includes the homepage, physical Read/Hike/About entry pages, catalog, 11 events, 15 map features, 9 cards, and notes.
- All seven Node materializer tests passed.
- In-app browser checks covered desktop and mobile layouts: homepage highlights; independent Read/Hike lists; opening the expedition from each collection; standalone About; correct active navigation; missing-project recovery.
- The map and timeline are sibling sections, with visible spacing between them. All 9 markers and 11 timeline events render. Great Falls selects moment 5/11 and the matching card; Next opens Lemhi Pass. View on map scrolls back to the map. Keyboard activation of St. Louis selects moment 11/11 and disables Next.
- Desktop notes have a left section menu and right article. Mobile notes stack the menu above the article. Five section links and ten references render. References are below the article; citation links preserve the original linked words and direct readers to the numbered reference.
- Section links preserve the project query and work after reload. Reference navigation moves keyboard focus to its target. New event URLs and legacy MVP links open the intended Fort Clatsop return event.
- No document horizontal overflow observed on desktop or mobile, including the 390-pixel homepage and narrower article viewports. No browser console warnings/errors observed.
- The staged deployment at `/_site/read/?project=lewis_and_clark_expedition` renders all markers and events, loads the local photograph, and preserves the deployment prefix in navigation, section links, and assets.
- Current screenshots: `screenshots/home-desktop.png`, `screenshots/home-mobile.png`, and `screenshots/notes-mobile.png`. Other existing screenshots document the original MVP.
- `git diff --check` passed.

## Standalone browser suite

`atlas.spec.js` was updated for the new navigation, independent timeline, article anchors, references, deep links, and keyboard interaction, with desktop/mobile projects. Its syntax check passed. The runner could not execute browser assertions because its Chromium executable is not installed. A sandboxed attempt also could not access the preview server; an approved retry reached the runner and confirmed the missing executable. The interactions above were verified using the in-app browser instead.

To run the separate suite, install Chromium with `npx playwright install chromium` in `renderer/`, then run `npm test`.

## Scope

The expedition appears in both Read and Hike for this MVP, with a historical-route-study label in Hike. The existing schematic route and modern-geography limitations are unchanged. No public deployment, commit, or push was performed for these refinements.
