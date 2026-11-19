# Baitlas

A local, static storytelling atlas following the **Baitlas Design** file architecture. The first project is `lewis_and_clark_expedition`: 11 timeline events, 9 place cards, 3 schematic outbound route segments, 3 optional focus regions, sourced notes, and a local photograph.

## View the built MVP

Generated browser assets and project data are included. No installation is needed to view them:

```sh
cd /Users/bailiu/Documents/Baitlas/repo
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000** for the highlights homepage. Read, Hike, and About are separate views served by one `index.html`; the two collections link to project articles. Use an HTTP server; double-clicking `index.html` (`file://`) cannot load the JSON assets in browsers.

The map uses locally bundled Leaflet, Natural Earth geography, and local media. No API key, CDN, tile server, or network request is needed at runtime. Source links open the original references when clicked.

## Install and build

Requires Node.js 20+ and npm. Run from the repository root:

```sh
npm ci --prefix materializer
npm ci --prefix renderer
npm run build --prefix materializer
npm run build --prefix renderer
```

To reproduce the basemap from the preserved shapefiles (only needed when changing the map extent or simplification):

```sh
npm run maps --prefix materializer
npm run build --prefix materializer
```

To validate content:

```sh
npm test --prefix materializer
```

An optional Playwright smoke suite covers desktop and mobile interactions:

```sh
cd renderer
npx playwright install chromium
npm test
```

## File structure

```text
.github/workflows/deploy.yml
index.html                          Shared entry for Home, Read, Hike, About, and articles
materializer/
  package.json, package-lock.json
  src/build.js, validate.js, prepare-maps.js, parsers/content.js
  schemas/
  tests/
renderer/
  package.json, package-lock.json, build.js, playwright.config.js
  src/app.js, pages-view.js, project-loader.js, project-view.js, map-view.js
  src/timeline-view.js, card-view.js, notes-view.js, styles.css
  tests/
content/
  about.md                         Site About copy
  shared/assets/maps/sources/       Original supplied Natural Earth datasets
  projects/lewis_and_clark_expedition/
    project.yaml, timeline.yaml, notes.md
    map/config.yaml, labels.geojson, markers.csv
    map/routes/*.geojson
    map/regions/*.geojson
    cards/*.md
    assets/maps/basemap.geojson, style.json, README.md
    assets/images/fort-clatsop.jpg, README.md
generated/
  renderer/                        Bundled browser JavaScript, CSS, Leaflet assets/license
  about.html                       Sanitized About content
  projects.json
  projects/lewis_and_clark_expedition/
    project.json, map.json, features.geojson, timeline.json, cards.json, notes.html
```

The necessary map-format deviation is **GeoJSON instead of PMTiles**: the provided map sources were Natural Earth shapefiles. `prepare-maps.js` clips and simplifies those local sources into one small regional vector file. `style.json` contains Leaflet path styles. No glyph fonts or sprite directories are needed because Leaflet draws these vector paths and markers directly. The additional build/configuration scripts make the authored/generated separation reproducible. The renderer uses `index.html` for every view. The `page` and optional `project` query parameters select the content without server rewrites. Edit the shell in `index.html` and rebuild the renderer for code or style changes.

## Author content

- `content/about.md`: all About copy. Use an introductory eyebrow paragraph, one H1, then the lead paragraph and article sections. The renderer supplies layout and typography. The materializer sanitizes this into `generated/about.html`; rebuild the materializer after copy edits. About links such as `?page=read` resolve from the site root, including on repository subpaths.
- `project.yaml`: title, descriptive metadata, and source list. Its `id` must match its folder name. Optional `collections: [Read, Hike]` controls which article lists include the project; otherwise `category` supplies the collection.
- `map/config.yaml`: basemap and style paths, visible bounds, and map presentation fields such as attribution, marker pixel anchors, caption, period, disclaimer, and route/region notes.
- `timeline.yaml`: dated events, each with a unique ID, a marker ID, summary, and source URL. Multiple events can refer to one place. Events are sorted by date during the build.
- `map/markers.csv`: longitude/latitude in WGS84 decimal degrees, a unique marker ID, and the basename of its Markdown card. Quoted CSV fields can contain commas.
- `map/labels.geojson`: optional GeoJSON FeatureCollection of noninteractive geographic labels. Each Point has a unique `id`, `kind: label`, display `text`, and a `style` of `ocean`, `mountain`, or `river`.
- `map/routes/`: GeoJSON LineStrings. `properties` include a unique `id`, `kind: route`, `title`, hex `color`, description, and source. Optional `legend_label` supplies a short legend name; otherwise the route title is used. `legend_order` sets display order. Legend colors come from route colors.
- `map/regions/`: GeoJSON Polygons with closed rings; use `kind: region`.
- `cards/` and `notes.md`: Markdown, with local image paths relative to the project root, such as `assets/images/fort-clatsop.jpg`. HTML is sanitized. Raw scripts and unsafe URLs are removed. Image files must exist.

The materializer checks schemas, coordinates, real calendar dates, duplicate IDs, marker/card references, closed regions, and required assets before emitting generated files. Rebuild both packages after edits affecting both content and renderer. Serve the repository root, since generated metadata references project assets in `content/`.

## Interaction

Select a timeline event or numbered place to open its card and center the map. Cards start hidden. Use previous/next to move through events, **Full expedition** to restore the overview, and checkboxes to toggle routes, places, or regions. Maps support dragging, touch zoom, zoom buttons, and keyboard panning. Mouse-wheel zoom is disabled to preserve normal page scrolling.

Read and Hike are independent article collections. The sample expedition appears in both; Hike labels it as a historical route study. About is a separate page. Each project has a full-width map, a separate horizontal timeline below it, and an article with a left-hand section menu. References appear at the bottom of the article. On small screens the section menu stacks above the text.

Selected events have reloadable URLs, e.g. `?page=read&project=lewis_and_clark_expedition#event=leave-clatsop`. Section and numbered reference links preserve the current project. Links shared by the first MVP (`#lewis_and_clark_expedition/leave-clatsop`) redirect to the new article URL.

## Historical scope and provenance

Historical text is summarized from the National Park Service and National Archives, with links in cards, timeline data, and notes. The local photograph depicts a **modern Fort Clatsop reconstruction** and is credited to NPS. See each asset directory's README for provenance.

The supplied Natural Earth datasets are public domain and represent **generalized modern geography**, not the landscape in 1804. Coordinates are editorial approximations. Route segments are simplified outbound connections, not reconstructed daily tracks; the split 1806 return routes are intentionally omitted, while the return remains on the timeline. Regions are editorial focus areas, not Indigenous territories or historical political boundaries. Fort Mandan's original location is uncertain.

## GitHub Pages

The existing workflow installs dependencies, builds and validates content, bundles the renderer, and packages `index.html`, `generated/`, and project runtime assets. Source shapefiles and `node_modules` are excluded from the deployed artifact. Paths are relative, so the site supports repository subpaths on GitHub Pages. Deployment occurs on a push to `main` or manual workflow dispatch.

## Renderer boundaries

`map-view.js` owns Leaflet behavior and shared visual defaults (control placement, zoom limits, marker sizes, route strokes, and five-degree grid spacing). It consumes the basemap's land/lakes/rivers layer contract. Geographic labels, source attribution, marker-specific pixel anchors, and project caveats belong to authored content. Grid bounds are derived from the project's map extent; there are no expedition IDs or named geographic labels in the map renderer.
