# Map provenance

`basemap.geojson` is built by `build/build-map.js` from the supplied Natural Earth shapefiles preserved under `content/shared/maps/`.

Clip extent: west -145, south 10, east -65, north 70. Simplification tolerance: 0.008 degrees; coordinates rounded to five decimal places. Natural Earth is public domain. Source README and version files are preserved beside each shapefile.

`style.json` contains Leaflet path styles, not the MapLibre style specification. GeoJSON replaces the design’s proposed PMTiles because the supplied source assets are shapefiles and this small regional map needs no tile service. Map imagery and scripts are served locally.
