import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({entryPoints:[root+'renderer/src/app.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outdir:root+'generated/renderer',loader:{'.png':'file'},assetNames:'[name]-[hash]',legalComments:'eof'});
await mkdir(root+'generated/renderer',{recursive:true});
await copyFile(root+'renderer/node_modules/leaflet/LICENSE',root+'generated/renderer/LEAFLET-LICENSE.txt');
console.log('Built generated/renderer/app.js and app.css');
