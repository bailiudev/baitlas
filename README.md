# Baitlas

A local, static storytelling atlas following the **Baitlas Design** file architecture. The first project is `lewis_and_clark_expedition`: 11 timeline events, 9 place cards, 3 schematic outbound route segments, 3 optional focus regions, sourced notes, and a local photograph.

## Build and view the MVP

Requires Node.js 20+ and npm. Build the complete static site, then serve only `dist/`:

```sh
npm ci
npm run build
npm run serve
```

Open **http://127.0.0.1:8000/** for the highlights homepage. Read, Hike, and About have their own directory pages (`/read/`, `/hike/`, `/about/`); each collection links to project pages such as `/read/lewis_and_clark_expedition/`. Use an HTTP server; double-clicking `index.html` (`file://`) cannot load the JSON assets in browsers.

The map uses locally bundled Leaflet, Natural Earth geography, and local media. No API key, CDN, tile server, or network request is needed at runtime. Source links open the original references when clicked.

## Build and test

The normal build generates the basemap from the preserved shapefiles. No separate map-preparation command is needed.

Build before running the content tests, which inspect `dist/`:

```sh
npm test
```

The Playwright suite covers desktop and mobile interactions and also runs in CI:

```sh
npx playwright install chromium
npm run test:browser
```

## File structure

```text
.github/workflows/deploy.yml
package.json, package-lock.json, playwright.config.js
src/
  build/                            Build scripts, validation, and schemas/
  app/                              page-template.html, browser modules, and styles.css
tests/                              Content and browser tests; ignored results/
data/
  pages/about.md                    Site About copy
  shared/maps/                      Original supplied Natural Earth datasets
  projects/lewis_and_clark_expedition/
    project.yaml, sources.yaml, timeline.yaml, notes.md, cards.yaml
    maps/config.yaml, points.yaml, labels.yaml, routes.yaml, regions.yaml
    images/fort-clatsop.jpg
dist/                               Complete deployable site; built locally and ignored by Git
  index.html
  read/index.html, hike/index.html, about/index.html
  read/lewis_and_clark_expedition/index.html
  resources/                       Files loaded by the pages
    app.js, app.css                 Bundled browser code and styles
    LEAFLET-LICENSE.txt
    projects.json                   Project listing
    projects/lewis_and_clark_expedition/
      project.json                  Metadata, sources, map config/features, timeline, cards, notes
      maps/basemap.geojson          Generated at build time
      images/fort-clatsop.jpg
```

The necessary basemap-format deviation is **GeoJSON instead of PMTiles**: the provided map sources were Natural Earth shapefiles. During every full build, `build-map.js` clips and simplifies the shared sources using each project's `maps/config.yaml`, then `build-content.js` writes the resulting `basemap.geojson` into `dist/resources/projects/`. A project may instead select a custom GeoJSON file in its `maps/` folder. Authored points, labels, routes, and regions use YAML; `build-content.js` converts them into the project's `project.json`, which also contains the compiled article, cards, timeline, and Leaflet map styles. The large basemap stays separate. Leaflet's default PNG marker and layer-control icons are unused; `build-app.js` omits them. No glyph fonts or sprite directories are needed because Leaflet draws these vector paths and markers directly. The build scripts keep authored data separate from deployable output. The build generates an `index.html` for each public page from the shared `src/app/page-template.html`; links to older query URLs redirect to the new paths. Edit the template and run `npm run build` for code or style changes.

## Author content

- `data/pages/about.md`: all About copy. Use an introductory eyebrow paragraph, one H1, then the lead paragraph and article sections. The browser app supplies layout and typography. `build-content.js` sanitizes and embeds this into `dist/about/index.html`; rebuild after copy edits. Relative links resolve from the site root, including on repository subpaths.
- `project.yaml`: title, descriptive metadata, and one required `category: Read` or `category: Hike`. Its `id` must match its folder name. The category determines the project's only collection and URL.
- `sources.yaml`: a `sources:` list of title and HTTPS URL pairs used for the article's references.
- `maps/config.yaml`: `basemap: natural-earth` generates a basemap from `data/shared/maps/`, while `basemap: maps/custom.geojson` selects a project-supplied map. Its `source:` entry records the basemap's origin, datasets, license, and geographic caveat. It also holds Leaflet styles, visible bounds, and presentation fields such as attribution, marker pixel anchors, caption, period, disclaimer, and route/region notes. Custom GeoJSON features use `properties.kind` values `land`, `lakes`, or `rivers`.
- `timeline.yaml`: dated events, each with a unique ID, a marker ID, summary, and source URL. Multiple events can refer to one place. Events are sorted by date during the build.
- `maps/points.yaml`: `markers` with unique IDs and WGS84 `[longitude, latitude]` coordinates. These are the selectable locations for timeline events and information cards. Each marker ID must have a matching entry in `cards.yaml`.
- `maps/labels.yaml`: `labels` with text, coordinates, and an ocean/mountain/river style.
- `maps/routes.yaml`: route metadata and ordered `path` coordinates, each `[longitude, latitude]`. Routes are independent of the points used for cards. Optional `legend_label` and `legend_order` control the legend.
- `maps/regions.yaml`: region metadata and `boundary` coordinates, each `[longitude, latitude]`. Regions are independent of card points. The content build closes each polygon automatically.
- `cards.yaml`: one `cards:` mapping keyed by marker ID. Each value is a Markdown block scalar (`|`) for the information card.
- `notes.md` and `images/`: article Markdown and project images. Use image paths relative to the project root, such as `images/fort-clatsop.jpg`. HTML is sanitized. Raw scripts and unsafe URLs are removed. Referenced images must exist.

The content build checks schemas, coordinates, real calendar dates, duplicate IDs, marker/card matches, region boundaries, and referenced images before emitting `dist/`. It generates the runtime basemap and copies only used images into the deployable site. Rebuild after editing authored content, then serve `dist/`.

## Interaction

Select a timeline event or numbered place to open its card and center the map. Cards start hidden. Use previous/next to move through events, **Full expedition** to restore the overview, and checkboxes to toggle routes, places, or regions. Maps support dragging, touch zoom, zoom buttons, and keyboard panning. Mouse-wheel zoom is disabled to preserve normal page scrolling.

Read and Hike are independent article collections. The sample expedition belongs to Read; Hike is empty until a Hike project is added. About is a separate page. Each project has a full-width map, a separate horizontal timeline below it, and an article with a left-hand section menu. References appear at the bottom of the article. On small screens the section menu stacks above the text.

Selected events have reloadable URLs, e.g. `/read/lewis_and_clark_expedition/#event=leave-clatsop`. Section and numbered reference links preserve the current project. Older query and hash links redirect to the new article URL. On GitHub Pages, directory routes use a trailing slash; a request without it may be redirected to the slash form.

## Historical scope and provenance

Historical text is summarized from the National Park Service and National Archives, with links in `sources.yaml`, cards, timeline data, and notes. The local photograph depicts a **modern Fort Clatsop reconstruction** and is credited to NPS in the notes. Map provenance is recorded in `maps/config.yaml` and beside the shared shapefiles.

The supplied Natural Earth datasets are public domain and represent **generalized modern geography**, not the landscape in 1804. Coordinates are editorial approximations. Route segments are simplified outbound connections, not reconstructed daily tracks; the split 1806 return routes are intentionally omitted, while the return remains on the timeline. Regions are editorial focus areas, not Indigenous territories or historical political boundaries. Fort Mandan's original location is uncertain.

## GitHub Pages

The workflow installs dependencies, builds `dist/`, runs content and desktop/mobile browser tests against `dist/` alone, then uploads that directory to GitHub Pages. Source files, original shapefiles, and `node_modules` are excluded from the deployed artifact. With the linked custom domain, public routes include `https://baitlas.com/`, `https://baitlas.com/read/`, `https://baitlas.com/about/`, and `https://baitlas.com/read/lewis_and_clark_expedition/`. Relative base paths also support the repository subpath on GitHub Pages. Deployment occurs on a push to `main` or manual workflow dispatch.

## Map behavior

`map-view.js` owns Leaflet behavior and shared visual defaults (control placement, zoom limits, marker sizes, route strokes, and five-degree grid spacing). It consumes the basemap's land/lakes/rivers layer contract. Geographic labels, source attribution, marker-specific pixel anchors, and project caveats belong to authored content. Grid bounds are derived from the project's map extent; there are no expedition IDs or named geographic labels in the browser map code.
