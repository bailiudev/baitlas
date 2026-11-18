import Ajv from 'ajv';
import {readFileSync} from 'node:fs';
const ajv = new Ajv({allErrors:true});
const schema = name => JSON.parse(readFileSync(new URL(`../schemas/${name}.schema.json`, import.meta.url)));
const projectSchema = ajv.compile(schema('project'));
const timelineSchema = ajv.compile(schema('timeline'));
export function validateSchema(project, timeline) {
  for (const [name, check, value] of [['project.yaml',projectSchema,project],['timeline.yaml',timelineSchema,timeline]]) {
    if (!check(value)) throw new Error(`${name}: ${ajv.errorsText(check.errors)}`);
  }
  for (const key of ['bounds','extent']) {
    project.map[key].forEach(coordinate);
    const [sw,ne]=project.map[key];
    if(sw[0]>=ne[0] || sw[1]>=ne[1]) throw new Error(`Invalid map ${key}`);
  }
}
export function coordinate(c) {
  if (!Array.isArray(c) || c.length!==2 || !c.every(Number.isFinite) || Math.abs(c[0])>180 || Math.abs(c[1])>90) throw new Error(`Invalid coordinate: ${JSON.stringify(c)}`);
}
export function validateContent(project, timeline, features, cards) {
  validateSchema(project,timeline);
  const ids=new Set();
  for (const f of features) {
    if(f.type!=='Feature' || !f.properties || !/^[a-z0-9_-]+$/.test(f.properties.id)) throw new Error('Invalid feature identity');
    const {id,kind}=f.properties;
    if(ids.has(id)) throw new Error(`Duplicate feature: ${id}`); ids.add(id);
    if(!['marker','route','region'].includes(kind)) throw new Error(`Invalid feature kind: ${kind}`);
    const g=f.geometry;
    if(kind==='marker') {
      if(g.type!=='Point') throw new Error(`Marker ${id} must be a Point`);
      coordinate(g.coordinates);
      if(!cards[f.properties.card]) throw new Error(`Missing card for ${id}`);
    } else {
      if(!/^#[0-9a-f]{6}$/i.test(f.properties.color)) throw new Error(`Invalid color for ${id}`);
      if(kind==='route') {
        if(g.type!=='LineString' || g.coordinates.length<2) throw new Error(`Invalid route ${id}`);
        g.coordinates.forEach(coordinate);
      } else {
        if(g.type!=='Polygon' || !g.coordinates.length) throw new Error(`Invalid region ${id}`);
        for(const ring of g.coordinates) {
          if(ring.length<4 || JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1))) throw new Error(`Unclosed region ${id}`);
          ring.forEach(coordinate);
        }
      }
    }
  }
  const markers=new Set(features.filter(f=>f.properties.kind==='marker').map(f=>f.properties.id));
  const eventIds=new Set();
  for(const e of timeline.events) {
    if(eventIds.has(e.id)) throw new Error(`Duplicate event: ${e.id}`); eventIds.add(e.id);
    const date=new Date(`${e.date}T00:00:00Z`);
    if(Number.isNaN(date.valueOf()) || date.toISOString().slice(0,10)!==e.date) throw new Error(`Invalid date: ${e.date}`);
    if(!markers.has(e.marker)) throw new Error(`Missing marker ${e.marker} for ${e.id}`);
  }
}
