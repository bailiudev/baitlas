import {readFile,writeFile,readdir,mkdir,access,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {yaml,mapFeatures,markdown} from './content-utils.js';
import {validateContent} from './validate.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const projectsDir=path.join(root,'data/projects');
const dist=path.join(root,'dist');
const read=p=>readFile(p,'utf8');
const json=p=>read(p).then(JSON.parse);
const about=markdown(await read(path.join(root,'data/about.md')));
const shell=await read(path.join(root,'src/app/index.html'));
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
  const map=yaml(await read(path.join(dir,'map/config.yaml')));
  const timeline=yaml(await read(path.join(dir,'timeline.yaml')));
  const features=mapFeatures(...await Promise.all(['points','labels','routes','regions'].map(name=>read(path.join(dir,'map',`${name}.yaml`)).then(yaml))));
  const cards=Object.create(null);
  for(const file of (await readdir(path.join(dir,'cards'))).sort()) {
    if(file.endsWith('.md')) cards[path.basename(file,'.md')]=markdown(await read(path.join(dir,'cards',file)),id);
  }
  const notes=markdown(await read(path.join(dir,'notes.md')),id);
  validateContent(project,map,timeline,features,cards);
  const runtimeAssets=new Set();
  for(const key of ['basemap','style']) {
    const relative=map[key];
    if(relative.split('/').includes('..')) throw new Error(`Unsafe asset path: ${relative}`);
    const value=await json(path.join(dir,relative));
    if(key==='basemap' && (value.type!=='FeatureCollection' || !value.features.length)) throw new Error('Basemap is empty or invalid');
    runtimeAssets.add(relative);
    map[key]=`projects/${id}/${relative}`;
  }
  for(const html of [...Object.values(cards),notes]) for(const m of html.matchAll(/src="([^"]+)"/g)) {
    const relative=m[1].replace(`projects/${id}/`,'');
    await access(path.join(dir,relative));
    runtimeAssets.add(relative);
  }
  timeline.events.sort((a,b)=>a.date.localeCompare(b.date));
  output.push({id,project,map,timeline:timeline.events,features:{type:'FeatureCollection',features},cards,notes,runtimeAssets,dir});
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
  const payload={project:item.project,map:item.map,features:item.features,timeline:item.timeline,cards:item.cards,notes:item.notes};
  await writeFile(path.join(dest,'project.json'),JSON.stringify(payload,null,2)+'\n');
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
