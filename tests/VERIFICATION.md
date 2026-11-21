# MVP verification — 2026-11-20

- The full content and browser-app builds passed. `dist/` contains separate directory pages for Home, Read, Hike, About, and each project's collection URLs. The large basemap remains a separate asset.
- All 12 Node content tests passed. They cover validation, map annotations, sanitized About Markdown embedded in its page, generated route files, and local assets.
- All 12 Playwright tests passed in desktop and mobile Chromium. They cover navigation, slashless direct visits and their directory redirects, project reloads, map and timeline interactions, article references, local-only assets, and legacy query/hash redirects.
- An unknown project path returns HTTP 404. The build does not create a custom `404.html`.
- `git diff --check` passed.

The expedition remains a historical route study with schematic routes and generalized modern geography. GitHub Pages may redirect slashless directory paths to their trailing-slash form.
