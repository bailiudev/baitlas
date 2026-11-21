import {build} from 'esbuild';
import {readFile,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const outdir=root+'dist/resources';
// The site uses divIcon markers and its own layer controls, so Leaflet's PNG icons are unused.
const unusedLeafletIcons={name:'unused-leaflet-icons',setup(build){
  build.onLoad({filter:/[/\\]leaflet[/\\]dist[/\\]leaflet\.css$/},async({path})=>{
    let contents=await readFile(path,'utf8');
    for(const name of ['layers.png','layers-2x.png','marker-icon.png']) {
      const declaration=`background-image: url(images/${name});`;
      if(!contents.includes(declaration)) throw new Error(`Leaflet CSS icon declaration changed: ${name}`);
      contents=contents.replace(declaration,'background-image: none;');
    }
    return {contents,loader:'css'};
  });
}};
await build({entryPoints:[root+'src/app/app.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outdir,plugins:[unusedLeafletIcons],legalComments:'eof'});
await copyFile(root+'node_modules/leaflet/LICENSE',outdir+'/LEAFLET-LICENSE.txt');
console.log('Built dist/resources/app.js and app.css');
