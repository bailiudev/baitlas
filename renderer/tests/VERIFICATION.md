# MVP verification — 2026-11-18

- Materializer and renderer builds passed. One root `index.html` serves Home, Read, Hike, About, and project articles using query parameters. The renderer no longer creates `read/`, `hike/`, or `about/`.
- All nine Node materializer tests passed. They cover content validation, map annotations, sanitized About Markdown, and local assets.
- In-app browser checks confirmed Read, Hike, and About query routes; one expedition article in each collection; 9 map markers and 11 timeline events; Great Falls event/card selection; 10 references; a direct notes link; and the first MVP's hash redirect.
- The staged repository subpath `/_site/?page=read&project=lewis_and_clark_expedition` rendered all 9 markers and loaded project data. `/_site/?page=about` rendered the About article without console errors.
- Earlier `/read/`, `/hike/`, and `/about/` URLs are no longer published; use the query URLs served by `index.html`.
- The desktop/mobile layout checks for the map, independent timeline, and notes were completed before the routing change. This change preserves their markup and styles.
- `git diff --check` passed.

The updated desktop/mobile Playwright suite passed a syntax check. It was not executed because the local Playwright Chromium executable is absent. The interactions above were checked in the Codex in-app browser. To run the separate suite, install Chromium with `npx playwright install chromium` inside `renderer/`, then run `npm test`.

The expedition remains a historical route study with schematic routes and generalized modern geography.
