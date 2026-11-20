import {parse as yaml} from 'yaml';
import {marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
export {yaml};
export function mapFeatures(points, labels, routes, regions) {
  if(!Array.isArray(points?.markers) || !Array.isArray(labels?.labels) || !Array.isArray(routes?.routes) || !Array.isArray(regions?.regions)) throw new Error('Map YAML needs markers, labels, routes, and regions lists');
  if('labels' in points) throw new Error('Labels belong in labels.yaml, not points.yaml');
  const markerIds=new Set();
  const features=[];
  for(const {id,title,coordinates,card,...properties} of points.markers) {
    if(markerIds.has(id)) throw new Error(`Duplicate marker: ${id}`);
    markerIds.add(id);
    features.push({type:'Feature',properties:{id,title,card,kind:'marker',...properties},geometry:{type:'Point',coordinates}});
  }
  for(const {id,coordinates,...properties} of labels.labels) {
    features.push({type:'Feature',properties:{id,kind:'label',...properties},geometry:{type:'Point',coordinates}});
  }
  const coordinatePath=(path,context)=>{
    if(!Array.isArray(path) || !path.every(Array.isArray)) throw new Error(`${context} needs an array of [longitude, latitude] coordinates`);
    return path;
  };
  for(const {id,path,...properties} of routes.routes) {
    features.push({type:'Feature',properties:{id,kind:'route',...properties},geometry:{type:'LineString',coordinates:coordinatePath(path,`Route ${id}`)}});
  }
  for(const {id,boundary,...properties} of regions.regions) {
    const ring=[...coordinatePath(boundary,`Region ${id}`)];
    if(ring.length && JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1))) ring.push([...ring[0]]);
    features.push({type:'Feature',properties:{id,kind:'region',...properties},geometry:{type:'Polygon',coordinates:[ring]}});
  }
  return features;
}
export function markdown(text, id) {
  return sanitizeHtml(marked.parse(text), {
    allowedTags:[...sanitizeHtml.defaults.allowedTags,'img'],
    allowedAttributes:{a:['href','rel'],img:['src','alt','title','loading']},
    allowedSchemes:['https','http'],
    transformTags:{
      a: (tag,attrs)=>({tagName:tag,attribs:{...attrs,rel:'noopener noreferrer'}}),
      img: (tag,attrs)=> {
        // Author paths are relative to the project's root. Keep the entire runtime local.
        if(!id) throw new Error('Images require a project asset directory');
        if(!/^assets\/images\/[a-zA-Z0-9_./-]+$/.test(attrs.src||'') || attrs.src.split('/').includes('..')) throw new Error(`Image must be inside assets/images: ${attrs.src}`);
        return {tagName:tag,attribs:{...attrs,src:`projects/${id}/${attrs.src}`,loading:'lazy'}};
      }
    }
  });
}
