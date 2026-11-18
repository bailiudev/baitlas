import {readFile,writeFile,readdir,mkdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {yaml,markers,markdown} from './parsers/content.js';
import {validateContent} from './validate.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const content=path.join(root,'content/projects');
const generated=path.join(root,'generated');
const read=p=>readFile(p,'utf8');
const json=p=>read(p).then(JSON.parse);
const output=[];
for(const entry of (await readdir(content,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
  if(!entry.isDirectory()) continue;
  const id=entry.name, dir=path.join(content,id);
  const project=yaml(await read(path.join(dir,'project.yaml')));
  if(project.id!==id || !/^[a-z0-9_-]+$/.test(id)) throw new Error(`Project ID must match its folder: ${id}`);
  const timeline=yaml(await read(path.join(dir,'timeline.yaml')));
  const features=markers(await read(path.join(dir,'map/markers.csv')));
  for(const kind of ['routes','regions']) for(const file of (await readdir(path.join(dir,'map',kind))).sort()) {
    if(file.endsWith('.geojson')) {
      const data=await json(path.join(dir,'map',kind,file));
      features.push(...(data.type==='FeatureCollection'?data.features:[data]));
    }
  }
  const cards=Object.create(null);
  for(const file of (await readdir(path.join(dir,'cards'))).sort()) {
    if(file.endsWith('.md')) cards[path.basename(file,'.md')]=markdown(await read(path.join(dir,'cards',file)),id);
  }
  const notes=markdown(await read(path.join(dir,'notes.md')),id);
  validateContent(project,timeline,features,cards);
  for(const key of ['basemap','style']) {
    const relative=project.map[key];
    if(relative.split('/').includes('..')) throw new Error(`Unsafe asset path: ${relative}`);
    const value=await json(path.join(dir,relative));
    if(key==='basemap' && (value.type!=='FeatureCollection' || !value.features.length)) throw new Error('Basemap is empty or invalid');
    project.map[key]=`content/projects/${id}/${relative}`;
  }
  for(const html of [...Object.values(cards),notes]) for(const m of html.matchAll(/src="([^"]+)"/g)) await access(path.join(root,m[1]));
  timeline.events.sort((a,b)=>a.date.localeCompare(b.date));
  output.push({id,project,timeline:timeline.events,features:{type:'FeatureCollection',features},cards,notes});
}
// Validate every project before replacing generated content.
await mkdir(generated,{recursive:true});
for(const item of output) {
  const dest=path.join(generated,'projects',item.id);await mkdir(dest,{recursive:true});
  for(const [name,value] of Object.entries({'project.json':item.project,'timeline.json':item.timeline,'features.geojson':item.features,'cards.json':item.cards,'notes.html':item.notes})) {
    await writeFile(path.join(dest,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
  }
  console.log(`Built ${item.id}: ${item.timeline.length} events, ${item.features.features.length} features, ${Object.keys(item.cards).length} cards`);
}
await writeFile(path.join(generated,'projects.json'),JSON.stringify(output.map(({project:p})=>({id:p.id,title:p.title,description:p.description,period:p.period,category:p.category})),null,2)+'\n');
