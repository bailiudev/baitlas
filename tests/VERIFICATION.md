# MVP verification — 2026-11-18

- The content and browser-app builds passed. One root `index.html` serves Home, Read, Hike, About, and project articles using query parameters. The build no longer creates `read/`, `hike/`, or `about/`.
- All eleven Node content tests passed. They cover content validation, map annotations, sanitized About Markdown, and local assets.
- In-app browser checks confirmed Read, Hike, and About query routes; one expedition article in each collection; 9 map markers and 11 timeline events; Great Falls event/card selection; 10 references; a direct notes link; and the first MVP's hash redirect.
- The staged repository subpath `/_site/?page=read&project=lewis_and_clark_expedition` rendered all 9 markers and loaded project data. `/_site/?page=about` rendered the About article without console errors.
- Earlier `/read/`, `/hike/`, and `/about/` URLs are no longer published; use the query URLs served by `index.html`.
- The desktop/mobile layout checks for the map, independent timeline, and notes were completed before the routing change. This change preserves their markup and styles.
- `git diff --check` passed.

At the time of this check, the desktop/mobile Playwright suite passed a syntax check but was not executed because the local Chromium executable was absent. The interactions above were checked in the Codex in-app browser. The current suite runs in CI against `dist/`; locally, install Chromium with `npx playwright install chromium` from the repository root, then run `npm run test:browser`.

The expedition remains a historical route study with schematic routes and generalized modern geography.
