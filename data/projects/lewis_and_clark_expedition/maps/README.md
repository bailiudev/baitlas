# Map provenance

The build creates `dist/projects/lewis_and_clark_expedition/maps/basemap.geojson` from the Natural Earth shapefiles under `data/shared/maps/`. The generated basemap is not stored in `data/`.

Clip extent: west -145, south 10, east -65, north 70. Simplification tolerance: 0.008 degrees; coordinates rounded to five decimal places. Natural Earth is public domain. Source README and version files are preserved beside each shapefile.

`config.yaml` contains Leaflet path styles. GeoJSON replaces the design’s proposed PMTiles because the supplied source assets are shapefiles and this small regional map needs no tile service. A project can instead point `basemap` at a custom GeoJSON file in this directory. Map imagery and scripts are served locally.
