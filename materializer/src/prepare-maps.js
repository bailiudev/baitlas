// Reproducible conversion of the user's Natural Earth shapefiles. No network required.
import {read} from 'shapefile';
import {bboxClip} from '@turf/bbox-clip';
import {simplify} from '@turf/simplify';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const bounds = [-145, 10, -65, 70];
const sets = {land:'ne_10m_land', lakes:'ne_10m_lakes', rivers:'ne_10m_rivers_lake_centerlines'};
const features = [];
for (const [kind, name] of Object.entries(sets)) {
  const source = await read(path.join(root, 'content/shared/maps', name+'.shp'));
  let count = 0;
  for (const feature of source.features) {
    if (!feature.geometry) continue;
    const clipped = bboxClip(feature, bounds);
    if (!clipped.geometry.coordinates.length) continue;
    const reduced = simplify(clipped, {tolerance:0.008, highQuality:true});
    reduced.properties = {kind, name:feature.properties.name || ''};
    features.push(reduced); count++;
  }
  console.log(`${kind}: ${count} features`);
}
const out = path.join(root, 'content/projects/lewis_and_clark_expedition/assets/maps');
await mkdir(out, {recursive:true});
await writeFile(path.join(out, 'basemap.geojson'), JSON.stringify({type:'FeatureCollection', bbox:bounds, features}, (_, v) => typeof v === 'number' ? Math.round(v*100000)/100000 : v));
console.log('Prepared regional Natural Earth basemap.');
