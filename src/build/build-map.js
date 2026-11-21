// Prepare a project's runtime basemap from shared Natural Earth data or its own GeoJSON.
import {read} from 'shapefile';
import {bboxClip} from '@turf/bbox-clip';
import {simplify} from '@turf/simplify';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../../',import.meta.url));
const sets={land:'ne_10m_land',lakes:'ne_10m_lakes',rivers:'ne_10m_rivers_lake_centerlines'};

export async function prepareBasemap(projectDir,config) {
  let basemap;
  if(config.basemap==='natural-earth') {
    const [[west,south],[east,north]]=config.extent;
    const bbox=[west,south,east,north];
    const features=[];
    for(const [kind,name] of Object.entries(sets)) {
      const source=await read(path.join(root,'data/shared/maps',`${name}.shp`));
      for(const feature of source.features) {
        if(!feature.geometry)continue;
        const clipped=bboxClip(feature,bbox);
        if(!clipped.geometry.coordinates.length)continue;
        const reduced=simplify(clipped,{tolerance:0.008,highQuality:true});
        reduced.properties={kind,name:feature.properties.name||''};
        features.push(reduced);
      }
    }
    basemap={type:'FeatureCollection',bbox,features};
  } else {
    if(!/^maps\/[a-zA-Z0-9_-]+\.geojson$/.test(config.basemap))throw new Error(`Invalid custom basemap path: ${config.basemap}`);
    basemap=JSON.parse(await readFile(path.join(projectDir,config.basemap),'utf8'));
  }
  if(basemap.type!=='FeatureCollection'||!Array.isArray(basemap.features)||!basemap.features.length)throw new Error('Basemap is empty or invalid');
  if(!basemap.features.every(f=>f.type==='Feature'&&f.geometry&&['land','lakes','rivers'].includes(f.properties?.kind)))throw new Error('Basemap features need land, lakes, or rivers kinds');
  return basemap;
}

export const serializeBasemap=basemap=>JSON.stringify(basemap,(_,value)=>typeof value==='number'?Math.round(value*100000)/100000:value);
