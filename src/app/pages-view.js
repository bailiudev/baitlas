import {escapeHTML as h} from './project-loader.js';
export const projectURL=project=>`${project.category.toLowerCase()}/${encodeURIComponent(project.id)}/`;
export const inCollection=(project,collection)=>project.category.toLowerCase()===collection;
// Decorative contour drawing, not geographic data or a navigable route.
function contours() {
  return `<svg class="contour-art" viewBox="0 0 580 380" fill="none" aria-hidden="true"><defs><clipPath id="contour-clip"><rect width="580" height="380" rx="3"/></clipPath></defs><g clip-path="url(#contour-clip)" stroke="#a6b4a0" stroke-width=".8">${Array.from({length:13},(_,i)=>`<path d="M ${-100+i*13} ${330+i*17} C ${20+i*8} ${100+i*11}, ${180-i*3} ${350-i*12}, ${215+i*5} ${190-i*13} S ${420+i*12} ${15-i*8}, ${620+i*5} ${100+i*14}"/>`).join('')}<path d="M85 286C150 240 178 300 230 209S335 151 379 100S430 105 476 66" stroke="#ad704d" stroke-width="2" stroke-dasharray="4 7"/><g fill="#f7f5ee" stroke="#526d56" stroke-width="1.5"><circle cx="85" cy="286" r="6"/><circle cx="230" cy="209" r="6"/><circle cx="379" cy="100" r="6"/><circle cx="476" cy="66" r="6"/></g></g><path d="M510 296v42m-6-33 6-9 6 9" stroke="#71836d"/><text x="510" y="283" fill="#71836d" text-anchor="middle" font-size="10" font-family="Arial">N</text></svg>`;
}
function articleRow(p,collection,index=0) {
  return `<li><a class="article-row" href="${h(projectURL(p))}"><span class="article-number">${String(index+1).padStart(2,'0')}</span><div class="article-info"><p class="eyebrow">${h(collection==='hike'?'ROUTES & LANDSCAPES':'HISTORY & EXPLORATION')}</p><h2>${h(p.title)}</h2><p>${h(p.description)}</p></div><span class="article-period">${h(p.period)}</span><span class="article-arrow" aria-hidden="true">↗</span></a></li>`;
}
export function renderHome(container,catalog) {
  const featured=catalog[0];
  container.innerHTML=`<section class="home-hero"><div class="hero-copy"><p class="eyebrow"><span class="tiny-line"></span> STORIES GROUNDED IN PLACE</p><h1>Go a little<br><em>further.</em></h1><p>Follow a river. Trace a journey.<br>Find the story a place has to tell.</p><a class="underlined-link" href="read/">Open the atlas <span aria-hidden="true">↗</span></a></div><div class="hero-art">${contours()}<span class="art-caption">A line to follow. A story to unfold.</span></div></section>
  <section class="highlights" aria-labelledby="highlights-heading"><div class="section-label"><h2 id="highlights-heading" class="eyebrow">FROM THE ATLAS</h2><a href="read/">All stories ↗</a></div>${featured?`<a class="featured-story" href="${h(projectURL(featured))}"><div class="feature-symbol" aria-hidden="true"><span>W</span><svg viewBox="0 0 180 110" fill="none"><path d="M10 74 44 68 62 39 82 54 100 26 119 43 150 33 170 39" stroke="#9eaa91"/><path d="M10 83C35 73 46 92 65 66S89 80 110 54 140 59 170 47" stroke="#ac704d" stroke-width="2" stroke-dasharray="4 5"/><circle cx="10" cy="83" r="4" fill="#556e56"/><circle cx="170" cy="47" r="4" fill="#556e56"/></svg><small>${h(featured.period)}</small></div><div><p class="eyebrow">FEATURED JOURNEY</p><h2>${h(featured.title)}</h2><p>${h(featured.description)}</p></div><span class="feature-open">Explore the story <span aria-hidden="true">↗</span></span></a>`:'<p>The first stories are on their way.</p>'}</section>
  <section class="collection-links" aria-label="Explore the collections"><a href="read/"><span class="eyebrow">01 / READ</span><h2>Travel through a story.</h2><p>Maps, moments, and the people in between.</p><span aria-hidden="true">↗</span></a><a href="hike/"><span class="eyebrow">02 / HIKE</span><h2>Look closer at the route.</h2><p>A collection for exploring journeys through place.</p><span aria-hidden="true">↗</span></a></section>`;
}
export function renderCollection(container,catalog,collection) {
  const hike=collection==='hike', articles=catalog.filter(p=>inCollection(p,collection));
  container.innerHTML=`<section class="collection-heading"><p class="eyebrow">THE ${hike?'ROUTE':'READING'} COLLECTION</p><h1>${hike?'Follow the route.':'Get lost in a story.'}</h1><p>${hike?'Explore the places and landscapes along a journey.':'Journeys through time, anchored in place.'}</p></section><section class="article-list-section" aria-label="${hike?'Hike':'Read'} articles"><div class="section-label"><h2 class="eyebrow">${hike?'ROUTES & FIELD NOTES':'STORIES & EXPEDITIONS'}</h2><span>${articles.length} ${articles.length===1?'article':'articles'}</span></div><ul class="article-list">${articles.map((p,i)=>articleRow(p,collection,i)).join('')}</ul>${!articles.length?'<p class="empty-collection">New articles are on their way.</p>':''}</section>`;
}
export function renderAbout(container) {
  const section=container.querySelector('.about-page');
  const title=section.querySelector('h1');
  const eyebrow=section.firstElementChild;
  if(eyebrow?.tagName==='P')eyebrow.classList.add('eyebrow');
  const body=document.createElement('div');body.className='about-copy prose';
  if(title)while(title.nextSibling)body.append(title.nextSibling);
  body.querySelector('p')?.classList.add('about-lead');
  body.querySelector('p:last-child > a:only-child')?.classList.add('underlined-link');
  section.append(body);
}
