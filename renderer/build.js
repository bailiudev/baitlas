import {build} from 'esbuild';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({entryPoints:[root+'renderer/src/app.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outdir:root+'generated/renderer',loader:{'.png':'file'},assetNames:'[name]-[hash]',legalComments:'eof'});
await mkdir(root+'generated/renderer',{recursive:true});
await copyFile(root+'renderer/node_modules/leaflet/LICENSE',root+'generated/renderer/LEAFLET-LICENSE.txt');
console.log('Built generated/renderer/app.js and app.css');

// Physical entry pages work on static hosts without rewrite rules.
const shell=await readFile(root+'index.html','utf8');
for(const page of ['read','hike','about']) {
  await mkdir(root+page,{recursive:true});
  await writeFile(root+page+'/index.html',shell.replace('<head>','<head>\n  <base href="../" />').replace('data-page="home"',`data-page="${page}"`).replace('<title>Baitlas · Stories grounded in place</title>',`<title>${page[0].toUpperCase()+page.slice(1)} · Baitlas</title>`));
}
console.log('Built Read, Hike, and About entry pages');
