import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validateContent} from '../src/build/validate.js';
import {markdown,mapFeatures,yaml} from '../src/build/content-utils.js';
import {prepareBasemap} from '../src/build/build-map.js';
const root=new URL('../',import.meta.url);
const json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
async function fixture(){
 const base='dist/resources/projects/lewis_and_clark_expedition/';
 const project=yaml(await readFile(new URL('data/projects/lewis_and_clark_expedition/project.yaml',root),'utf8'));
 const sources=yaml(await readFile(new URL('data/projects/lewis_and_clark_expedition/sources.yaml',root),'utf8'));
 const map=yaml(await readFile(new URL('data/projects/lewis_and_clark_expedition/maps/config.yaml',root),'utf8'));
 const compiled=await json(base+'project.json');
 return [project,map,{events:compiled.timeline},compiled.features.features,compiled.cards,sources];
}
test('compiled sample has valid coordinates, card references, and chronological events',async()=>{
 const args=await fixture();validateContent(...args);
 assert.equal(args[2].events.length,11);assert.equal(args[3].filter(f=>f.properties.kind==='marker').length,9);
 assert.equal(args[3].filter(f=>f.properties.kind==='label').length,4);
 const dates=args[2].events.map(e=>e.date);assert.deepEqual(dates,[...dates].sort());
});
test('rejects a broken event-to-marker link',async()=>{const a=await fixture();a[2].events[0].marker='missing';assert.throws(()=>validateContent(...a),/Missing marker/);});
test('rejects impossible dates',async()=>{const a=await fixture();a[2].events[0].date='1804-02-31';assert.throws(()=>validateContent(...a),/Invalid date/);});
test('rejects invalid and empty coordinates',async()=>{const a=await fixture();a[3][0].geometry.coordinates=[200,45];assert.throws(()=>validateContent(...a),/Invalid coordinate/);const b=await fixture();b[3][0].geometry.coordinates=[-90.1,null];assert.throws(()=>validateContent(...b),/Invalid coordinate/);});
test('rejects missing cards and unclosed regions',async()=>{const a=await fixture();a[4]={};assert.throws(()=>validateContent(...a),/Missing card/);const b=await fixture();b[3].find(f=>f.properties.kind==='region').geometry.coordinates[0].pop();assert.throws(()=>validateContent(...b),/Unclosed region/);});
test('builds coordinate-only routes and regions independently of card points',async()=>{
 const base='data/projects/lewis_and_clark_expedition/maps/';
 const [points,labels,routes,regions]=await Promise.all(['points','labels','routes','regions'].map(name=>readFile(new URL(base+name+'.yaml',root),'utf8').then(yaml)));
 const features=mapFeatures(points,labels,routes,regions);
 assert.equal(points.labels,undefined);
 assert.equal(points.markers[0].card,undefined);
 assert.equal(features.find(f=>f.properties.kind==='marker').properties.card,undefined);
 assert.equal(labels.labels.length,4);
 const marker=features.find(f=>f.properties.id==='camp-dubois');
 const route=features.find(f=>f.properties.id==='missouri');
 assert.deepEqual(route.geometry.coordinates[0],marker.geometry.coordinates);
 const changed=structuredClone(points);changed.markers[0].coordinates=[-90.2,38.8];
 assert.deepEqual(mapFeatures(changed,labels,routes,regions).find(f=>f.properties.id==='missouri').geometry.coordinates[0],[-90.1,38.802]);
 assert.deepEqual(features.find(f=>f.properties.kind==='region').geometry.coordinates[0].at(-1),features.find(f=>f.properties.kind==='region').geometry.coordinates[0][0]);
 const broken=structuredClone(routes);broken.routes[0].path[0]={marker:'missing'};
 assert.throws(()=>mapFeatures(points,labels,broken,regions),/array of \[longitude, latitude\] coordinates/);
 const brokenRegion=structuredClone(regions);brokenRegion.regions[0].boundary[0]={marker:'camp-dubois'};
 assert.throws(()=>mapFeatures(points,labels,routes,brokenRegion),/array of \[longitude, latitude\] coordinates/);
 const oldCard=structuredClone(points);oldCard.markers[0].card='camp-dubois';
 assert.throws(()=>mapFeatures(oldCard,labels,routes,regions),/Card references are inferred/);
});
test('removes executable Markdown',()=>{
 const html=markdown('# A\n<script>alert(1)</script>\n<a href="javascript:alert(1)">bad</a>\n![Photo](images/test.jpg)','sample');
 assert.ok(!html.includes('<script'));assert.ok(!html.includes('javascript:'));assert.ok(html.includes('resources/projects/sample/images/test.jpg'));
 assert.throws(()=>markdown('![Photo](images/../private.jpg)','sample'),/Image must be inside/);
 assert.throws(()=>markdown('![Photo](images/not-an-image.txt)','sample'),/Image must be inside/);
});
test('basemap is generated only in dist and local photo remains in images',async()=>{
 const base=await json('dist/resources/projects/lewis_and_clark_expedition/maps/basemap.geojson');
 assert.deepEqual([...new Set(base.features.map(f=>f.properties.kind))].sort(),['lakes','land','rivers']);
 await assert.rejects(readFile(new URL('data/projects/lewis_and_clark_expedition/maps/basemap.geojson',root)),/ENOENT/);
 assert.ok((await readFile(new URL('data/projects/lewis_and_clark_expedition/images/fort-clatsop.jpg',root))).length>1000);
});
test('custom basemaps in maps load without accessing paths outside that folder',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'baitlas-map-'));
 try {
  await mkdir(path.join(dir,'maps'));
  const custom={type:'FeatureCollection',features:[{type:'Feature',properties:{kind:'land'},geometry:{type:'Polygon',coordinates:[[[-1,0],[1,0],[1,1],[-1,0]]]}}]};
  await writeFile(path.join(dir,'maps/custom.geojson'),JSON.stringify(custom));
  assert.deepEqual(await prepareBasemap(dir,{basemap:'maps/custom.geojson'}),custom);
  await assert.rejects(prepareBasemap(dir,{basemap:'maps/../private.geojson'}),/Invalid custom basemap path/);
  custom.features[0].properties.kind='unknown';
  await writeFile(path.join(dir,'maps/custom.geojson'),JSON.stringify(custom));
  await assert.rejects(prepareBasemap(dir,{basemap:'maps/custom.geojson'}),/Basemap features need/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('cards are authored in one YAML file keyed by marker ID',async()=>{
 const project='data/projects/lewis_and_clark_expedition/';
 const source=yaml(await readFile(new URL(project+'cards.yaml',root),'utf8'));
 const points=yaml(await readFile(new URL(project+'maps/points.yaml',root),'utf8'));
 assert.deepEqual(Object.keys(source.cards).sort(),points.markers.map(point=>point.id).sort());
 assert.match(source.cards['fort-clatsop'],/images\/fort-clatsop.jpg/);
 const a=await fixture();a[4].unused='<p>Unused</p>';
 assert.throws(()=>validateContent(...a),/Card has no marker/);
});

test('map annotations validate coordinates, kinds, and marker references',async()=>{
 const a=await fixture();a[3].find(f=>f.properties.kind==='label').geometry.coordinates=[181,40];
 assert.throws(()=>validateContent(...a),/Invalid coordinate/);
 const b=await fixture();b[1].markerAnchors.missing=[14,14];
 assert.throws(()=>validateContent(...b),/Unknown marker anchor/);
 const c=await fixture();c[3].find(f=>f.properties.kind==='label').properties.style='invalid';
 assert.throws(()=>validateContent(...c),/Invalid label/);
 const d=await fixture();d[3]=d[3].filter(f=>f.properties.kind!=='label');delete d[1].markerAnchors;delete d[1].attribution;
 assert.doesNotThrow(()=>validateContent(...d));
});
test('map configuration and sources are authored separately from project metadata',async()=>{
 const [project,map,,,,sources]=await fixture();
 const compiled=await json('dist/resources/projects/lewis_and_clark_expedition/project.json');
 assert.deepEqual(Object.keys(compiled).sort(),['cards','features','map','notes','project','sources','timeline']);
 assert.equal(project.map,undefined);
 assert.equal(project.sources,undefined);
 assert.equal(map.caption,'THE WESTWARD PASSAGE');
 assert.equal(map.basemap,'natural-earth');
 assert.equal(map.source.title,'Natural Earth 1:10 million');
 assert.deepEqual(map.source.datasets,['ne_10m_land','ne_10m_lakes','ne_10m_rivers_lake_centerlines']);
 assert.equal(map.style.ocean,'#dce8e6');
 assert.deepEqual(compiled.project,project);
 assert.equal(compiled.project.map,undefined);
 assert.equal(compiled.project.sources,undefined);
 assert.deepEqual(compiled.sources,sources.sources);
 assert.equal(compiled.map.caption,map.caption);
 assert.equal(compiled.map.basemap,'resources/projects/lewis_and_clark_expedition/maps/basemap.geojson');
 assert.deepEqual(compiled.map.style,map.style);
});
test('rejects malformed project sources and map provenance',async()=>{
 const a=await fixture();a[5].sources[0].url='http://example.com';
 assert.throws(()=>validateContent(...a),/sources.yaml/);
 const b=await fixture();b[5].sources=[];
 assert.throws(()=>validateContent(...b),/sources.yaml/);
 const c=await fixture();c[1].source.url='http://example.com';
 assert.throws(()=>validateContent(...c),/maps\/config.yaml/);
});
test('each project has exactly one Read or Hike category',async()=>{
 const [project,map,timeline,features,cards]=await fixture();
 assert.equal(project.category,'Read');
 assert.equal(project.collections,undefined);
 for(const invalid of [{...project,collections:['Read','Hike']},{...project,category:'Travel'},{...project,category:undefined}]) {
  assert.throws(()=>validateContent(invalid,map,timeline,features,cards),/project.yaml/);
 }
});
test('About is embedded in its page from sanitized Markdown with site-relative links',async()=>{
 const source=await readFile(new URL('data/pages/about.md',root),'utf8');
 const result=await readFile(new URL('dist/about/index.html',root),'utf8');
 assert.ok(result.includes(markdown(source)));
 assert.match(result,/<h1>/);assert.match(result,/href="read\/"/);
 assert.ok(!markdown('<script>alert(1)</script>\n[bad](javascript:alert(1))').includes('javascript:'));
 assert.throws(()=>markdown('![Photo](images/photo.jpg)'),/project directory/);
});
test('dist contains every runtime asset without source-directory paths',async()=>{
 const html=await readFile(new URL('dist/index.html',root),'utf8');
 assert.match(html,/\.\/resources\/app\.js/);
 for(const [route,base,page] of [['read/','../','read'],['hike/','../','hike'],['about/','../','about']]) {
  const pageHtml=await readFile(new URL(`dist/${route}index.html`,root),'utf8');
  assert.ok(pageHtml.includes(`<base href="${base}"`));
  assert.ok(pageHtml.includes(`data-page="${page}"`));
 }
 assert.deepEqual((await readdir(new URL('dist/',root))).sort(),['about','hike','index.html','read','resources']);
 await readFile(new URL('dist/resources/app.js',root));
 await readFile(new URL('dist/resources/app.css',root));
 await readFile(new URL('dist/resources/LEAFLET-LICENSE.txt',root));
 const catalog=await json('dist/resources/projects.json');
 for(const {id,category,...metadata} of catalog){
  assert.equal(metadata.collections,undefined);
  const collection=category.toLowerCase();
  const pageHtml=await readFile(new URL(`dist/${collection}/${id}/index.html`,root),'utf8');
  assert.ok(pageHtml.includes('<base href="../../"'));
  assert.ok(pageHtml.includes(`data-page="${collection}" data-project="${id}"`));
  await assert.rejects(readFile(new URL(`dist/${collection==='read'?'hike':'read'}/${id}/index.html`,root),'utf8'),/ENOENT/);
  const base=`dist/resources/projects/${id}/`;
  assert.deepEqual((await readdir(new URL(base,root))).sort(),['images','maps','project.json']);
  const {map,cards,notes,features,timeline}=await json(base+'project.json');
  assert.equal(features.type,'FeatureCollection');
  assert.ok(timeline.length>0);
  for(const asset of [map.basemap,...[...Object.values(cards),notes].flatMap(html=>[...html.matchAll(/src="([^"]+)"/g)].map(match=>match[1]))]){
   assert.ok(asset.startsWith(`resources/projects/${id}/maps/`)||asset.startsWith(`resources/projects/${id}/images/`),`Unexpected runtime asset path: ${asset}`);
   await readFile(new URL(`dist/${asset}`,root));
  }
 }
});
