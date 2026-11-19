import {parse as yaml} from 'yaml';
import {parse as csv} from 'csv-parse/sync';
import {marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
export {yaml};
export function markers(text) {
  return csv(text,{columns:true,skip_empty_lines:true,bom:true}).map(row=>({
    type:'Feature', properties:{id:row.id,title:row.title,card:row.card,kind:'marker',category:row.kind,location_note:row.location_note,source:row.source},
    geometry:{type:'Point',coordinates:[row.longitude.trim()===''?NaN:Number(row.longitude),row.latitude.trim()===''?NaN:Number(row.latitude)]}
  }));
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
        return {tagName:tag,attribs:{...attrs,src:`content/projects/${id}/${attrs.src}`,loading:'lazy'}};
      }
    }
  });
}
