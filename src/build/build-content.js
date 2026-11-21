import {readFile,writeFile,readdir,mkdir,access,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {yaml,mapFeatures,markdown} from './content-utils.js';
import {validateContent} from './validate.js';
import {prepareBasemap,serializeBasemap} from './build-map.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const projectsDir=path.join(root,'data/projects');
const dist=path.join(root,'dist');
const read=p=>readFile(p,'utf8');
const about=markdown(await read(path.join(root,'data/pages/about.md')));
const shell=await read(path.join(root,'src/app/page-template.html'));
const loading='<p class="loading" role="status">Opening the atlas…</p>';
async function writePage(relative,page,project='') {
  const depth=relative.split('/').length-1;
  const base='../'.repeat(depth)||'./';
  let html=shell.replace('__BASE__',base).replace('__PAGE__',page).replace('__PROJECT__',project);
  if(page==='about') html=html.replace(loading,`<section class="about-page">${about}</section>`);
  const destination=path.join(dist,relative);
  await mkdir(path.dirname(destination),{recursive:true});
  await writeFile(destination,html);
}
const output=[];
for(const entry of (await readdir(projectsDir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
  if(!entry.isDirectory()) continue;
  const id=entry.name, dir=path.join(projectsDir,id);
  const project=yaml(await read(path.join(dir,'project.yaml')));
  if(project.id!==id || !/^[a-z0-9_-]+$/.test(id)) throw new Error(`Project ID must match its folder: ${id}`);
  const sources=yaml(await read(path.join(dir,'sources.yaml')));
  const map=yaml(await read(path.join(dir,'maps/config.yaml')));
  const timeline=yaml(await read(path.join(dir,'timeline.yaml')));
  const features=mapFeatures(...await Promise.all(['points','labels','routes','regions'].map(name=>read(path.join(dir,'maps',`${name}.yaml`)).then(yaml))));
  const cardSource=yaml(await read(path.join(dir,'cards.yaml')));
  if(!cardSource||typeof cardSource!=='object'||Array.isArray(cardSource)||Object.keys(cardSource).length!==1||!cardSource.cards||typeof cardSource.cards!=='object'||Array.isArray(cardSource.cards))throw new Error(`Invalid cards.yaml for ${id}`);
  const cards=Object.create(null);
  for(const [cardId,text] of Object.entries(cardSource.cards)) {
    if(!/^[a-z0-9_-]+$/.test(cardId)||typeof text!=='string'||!text.trim())throw new Error(`Invalid card ${cardId} in ${id}`);
    cards[cardId]=markdown(text,id);
  }
  const notes=markdown(await read(path.join(dir,'notes.md')),id);
  validateContent(project,map,timeline,features,cards,sources);
  const basemap=await prepareBasemap(dir,map);
  const runtimeAssets=new Set();
  map.basemap=`projects/${id}/maps/basemap.geojson`;
  for(const html of [...Object.values(cards),notes]) for(const m of html.matchAll(/src="([^"]+)"/g)) {
    const prefix=`projects/${id}/`;
    if(!m[1].startsWith(prefix))throw new Error(`Invalid image path: ${m[1]}`);
    const relative=m[1].slice(prefix.length);
    await access(path.join(dir,relative));
    runtimeAssets.add(relative);
  }
  timeline.events.sort((a,b)=>a.date.localeCompare(b.date));
  output.push({id,project,sources:sources.sources,map,basemap,timeline:timeline.events,features:{type:'FeatureCollection',features},cards,notes,runtimeAssets,dir});
}
// Validate every project before replacing output. A full build removes stale files;
// a content-only build preserves the existing browser bundle.
if(process.env.BAITLAS_FULL_BUILD==='1') await rm(dist,{recursive:true,force:true});
else {
  await Promise.all(['projects','read','hike','about'].map(name=>rm(path.join(dist,name),{recursive:true,force:true})));
  await rm(path.join(dist,'about.html'),{force:true});
}
await mkdir(dist,{recursive:true});
await writePage('index.html','home');
await Promise.all(['read','hike','about'].map(page=>writePage(`${page}/index.html`,page)));
for(const item of output) {
  const dest=path.join(dist,'projects',item.id);await mkdir(dest,{recursive:true});
  const payload={project:item.project,sources:item.sources,map:item.map,features:item.features,timeline:item.timeline,cards:item.cards,notes:item.notes};
  await writeFile(path.join(dest,'project.json'),JSON.stringify(payload,null,2)+'\n');
  await mkdir(path.join(dest,'maps'),{recursive:true});
  await writeFile(path.join(dest,'maps/basemap.geojson'),serializeBasemap(item.basemap));
  for(const relative of item.runtimeAssets) {
    const target=path.join(dest,relative);
    await mkdir(path.dirname(target),{recursive:true});
    await copyFile(path.join(item.dir,relative),target);
  }
  const page=item.project.category.toLowerCase();
  await writePage(`${page}/${item.id}/index.html`,page,item.id);
  console.log(`Built ${item.id}: ${item.timeline.length} events, ${item.features.features.length} features, ${Object.keys(item.cards).length} cards`);
}
await writeFile(path.join(dist,'projects.json'),JSON.stringify(output.map(({project:p})=>({id:p.id,title:p.title,description:p.description,period:p.period,category:p.category})),null,2)+'\n');
