import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContent} from '../src/validate.js';
import {markdown,markers,yaml} from '../src/parsers/content.js';
const root=new URL('../../',import.meta.url);
const json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
async function fixture(){
 const base='generated/projects/lewis_and_clark_expedition/';
 const project=yaml(await readFile(new URL('content/projects/lewis_and_clark_expedition/project.yaml',root),'utf8'));
 const map=yaml(await readFile(new URL('content/projects/lewis_and_clark_expedition/map/config.yaml',root),'utf8'));
 return [project,map,{events:await json(base+'timeline.json')},(await json(base+'features.geojson')).features,await json(base+'cards.json')];
}
test('compiled sample has valid coordinates, card references, and chronological events',async()=>{
 const args=await fixture();validateContent(...args);
 assert.equal(args[2].events.length,11);assert.equal(args[3].filter(f=>f.properties.kind==='marker').length,9);
 assert.equal(args[3].filter(f=>f.properties.kind==='label').length,4);
 const dates=args[2].events.map(e=>e.date);assert.deepEqual(dates,[...dates].sort());
});
test('rejects a broken event-to-marker link',async()=>{const a=await fixture();a[2].events[0].marker='missing';assert.throws(()=>validateContent(...a),/Missing marker/);});
test('rejects impossible dates',async()=>{const a=await fixture();a[2].events[0].date='1804-02-31';assert.throws(()=>validateContent(...a),/Invalid date/);});
test('rejects invalid and empty coordinates',async()=>{const a=await fixture();a[3][0].geometry.coordinates=[200,45];assert.throws(()=>validateContent(...a),/Invalid coordinate/);assert.ok(Number.isNaN(markers('id,title,latitude,longitude,card\nx,X,,5,x')[0].geometry.coordinates[1]));});
test('rejects missing cards and unclosed regions',async()=>{const a=await fixture();a[4]={};assert.throws(()=>validateContent(...a),/Missing card/);const b=await fixture();b[3].find(f=>f.properties.kind==='region').geometry.coordinates[0].pop();assert.throws(()=>validateContent(...b),/Unclosed region/);});
test('supports quoted CSV commas and removes executable Markdown',()=>{
 assert.equal(markers('id,title,latitude,longitude,card\nx,"A, B",40,-100,x')[0].properties.title,'A, B');
 const html=markdown('# A\n<script>alert(1)</script>\n<a href="javascript:alert(1)">bad</a>\n![Photo](assets/images/test.jpg)','sample');
 assert.ok(!html.includes('<script'));assert.ok(!html.includes('javascript:'));assert.ok(html.includes('content/projects/sample/assets/images/test.jpg'));
 assert.throws(()=>markdown('![Photo](assets/images/../../private.jpg)','sample'),/Image must be inside/);
});
test('basemap contains all three supplied layers and local photo exists',async()=>{
 const base=await json('content/projects/lewis_and_clark_expedition/assets/maps/basemap.geojson');
 assert.deepEqual([...new Set(base.features.map(f=>f.properties.kind))].sort(),['lakes','land','rivers']);
 assert.ok((await readFile(new URL('content/projects/lewis_and_clark_expedition/assets/images/fort-clatsop.jpg',root))).length>1000);
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
test('map configuration is authored and generated separately from project metadata',async()=>{
 const [project,map]=await fixture();
 assert.equal(project.map,undefined);
 assert.equal(map.caption,'THE WESTWARD PASSAGE');
 assert.equal((await json('generated/projects/lewis_and_clark_expedition/project.json')).map,undefined);
 assert.equal((await json('generated/projects/lewis_and_clark_expedition/map.json')).caption,map.caption);
});
test('About is materialized from sanitized Markdown with site-relative links',async()=>{
 const source=await readFile(new URL('content/about.md',root),'utf8');
 const result=await readFile(new URL('generated/about.html',root),'utf8');
 assert.equal(result,markdown(source));
 assert.match(result,/<h1>/);assert.match(result,/href="\?page=read"/);
 assert.ok(!markdown('<script>alert(1)</script>\n[bad](javascript:alert(1))').includes('javascript:'));
 assert.throws(()=>markdown('![Photo](assets/images/photo.jpg)'),/project asset directory/);
});
