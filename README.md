# Baitlas

A local, static storytelling atlas following the **Baitlas Design** file architecture. The first project is `lewis_and_clark_expedition`: 11 timeline events, 9 place cards, 3 schematic outbound route segments, 3 optional focus regions, sourced notes, and a local photograph.

## View the built MVP

Generated browser assets and project data are included. No installation is needed to view them:

```sh
cd /Users/bailiu/Documents/Baitlas/repo
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000**. Use an HTTP server; double-clicking `index.html` (`file://`) cannot load the JSON assets in browsers.

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
index.html
materializer/
  package.json, package-lock.json
  src/build.js, validate.js, prepare-maps.js, parsers/content.js
  schemas/
  tests/
renderer/
  package.json, package-lock.json, build.js, playwright.config.js
  src/app.js, project-loader.js, project-view.js, map-view.js
  src/timeline-view.js, card-view.js, notes-view.js, styles.css
  tests/
content/
  shared/assets/maps/sources/       Original supplied Natural Earth datasets
  projects/lewis_and_clark_expedition/
    project.yaml, timeline.yaml, notes.md
    map/markers.csv
    map/routes/*.geojson
    map/regions/*.geojson
    cards/*.md
    assets/maps/basemap.geojson, style.json, README.md
    assets/images/fort-clatsop.jpg, README.md
generated/
  renderer/                        Bundled browser JavaScript, CSS, Leaflet assets/license
  projects.json
  projects/lewis_and_clark_expedition/
    project.json, features.geojson, timeline.json, cards.json, notes.html
```

The necessary map-format deviation is **GeoJSON instead of PMTiles**: the provided map sources were Natural Earth shapefiles. `prepare-maps.js` clips and simplifies those local sources into one small regional vector file. `style.json` contains Leaflet path styles. No glyph fonts or sprite directories are needed because Leaflet draws these vector paths and markers directly. The additional build/configuration scripts make the authored/generated separation reproducible.

## Author content

- `project.yaml`: title, descriptive metadata, basemap paths, visible bounds, and source list. Its `id` must match its folder name.
- `timeline.yaml`: dated events, each with a unique ID, a marker ID, summary, and source URL. Multiple events can refer to one place. Events are sorted by date during the build.
- `map/markers.csv`: longitude/latitude in WGS84 decimal degrees, a unique marker ID, and the basename of its Markdown card. Quoted CSV fields can contain commas.
- `map/routes/`: GeoJSON LineStrings. `properties` include a unique `id`, `kind: route`, `title`, hex `color`, description, and source.
- `map/regions/`: GeoJSON Polygons with closed rings; use `kind: region`.
- `cards/` and `notes.md`: Markdown, with local image paths relative to the project root, such as `assets/images/fort-clatsop.jpg`. HTML is sanitized. Raw scripts and unsafe URLs are removed. Image files must exist.

The materializer checks schemas, coordinates, real calendar dates, duplicate IDs, marker/card references, closed regions, and required assets before emitting generated files. Rebuild both packages after edits affecting both content and renderer. Serve the repository root, since generated metadata references project assets in `content/`.

## Interaction

Select a timeline event or numbered place to open its card and center the map. Cards start hidden. Use previous/next to move through events, **Full expedition** to restore the overview, and checkboxes to toggle routes, places, or regions. Maps support dragging, touch zoom, zoom buttons, and keyboard panning. Mouse-wheel zoom is disabled to preserve normal page scrolling.

Read and Hike use the same page design and sample content, as specified. Hike includes a note explaining that this historical example is not a navigable hiking route. Explore stories displays the project catalog. About explains the atlas. Selected events have reloadable URLs, e.g. `#lewis_and_clark_expedition/leave-clatsop`.

## Historical scope and provenance

Historical text is summarized from the National Park Service and National Archives, with links in cards, timeline data, and notes. The local photograph depicts a **modern Fort Clatsop reconstruction** and is credited to NPS. See each asset directory's README for provenance.

The supplied Natural Earth datasets are public domain and represent **generalized modern geography**, not the landscape in 1804. Coordinates are editorial approximations. Route segments are simplified outbound connections, not reconstructed daily tracks; the split 1806 return routes are intentionally omitted, while the return remains on the timeline. Regions are editorial focus areas, not Indigenous territories or historical political boundaries. Fort Mandan's original location is uncertain.

## GitHub Pages

The existing workflow installs dependencies, builds and validates content, bundles the renderer, and packages only `index.html`, `generated/`, and project runtime assets. Source shapefiles and `node_modules` are excluded from the deployed artifact. Paths are relative, so the site supports repository subpaths on GitHub Pages. Deployment occurs on a push to `main` or manual workflow dispatch; this implementation does not push or deploy automatically.
