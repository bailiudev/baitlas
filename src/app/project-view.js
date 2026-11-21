import {escapeHTML as h} from './project-loader.js';
import {createMap} from './map-view.js';
import {createTimeline} from './timeline-view.js';
import {createCard} from './card-view.js';
import {renderNotes} from './notes-view.js';
export function renderProject(container,data,collection='read',initialEvent) {
  const {project,map:mapConfig,features,timeline,cards,notes}=data;
  container.innerHTML=`<a class="back-link" href="${collection}/">← All ${collection==='hike'?'routes':'stories'}</a><section class="project-heading"><div><p class="eyebrow"><span class="tiny-line"></span> THE EXPEDITION COLLECTION <span class="heading-number">/ 001</span></p><h1>${h(project.title)}</h1><p class="project-subtitle">${h(project.subtitle)}</p></div><div class="project-meta"><span class="period">${h(project.period)}</span><span>${timeline.length} moments <span class="meta-dot">·</span> ${features.features.filter(f=>f.properties.kind==='marker').length} places</span></div></section>
  <p class="mode-notice" ${collection==='read'?'hidden':''}>Historical route study. These approximate routes are not present-day hiking directions.</p>
  <section class="atlas" aria-label="Interactive expedition atlas"><div class="map-column"><div class="map-toolbar"><div><span class="live-dot"></span><span>EXPLORE THE JOURNEY</span></div><button id="reset-map" class="text-button">↖ Full expedition</button></div><div class="map-frame"><div id="map" tabindex="0" role="region" aria-label="Expedition map. Use plus and minus to zoom, arrow keys to pan, or choose a timeline event."></div><div class="map-caption"><span>${h(mapConfig.caption||project.title)}</span><small>${h(mapConfig.period||project.period)}</small></div><div class="compass" aria-hidden="true">N<span>↑</span></div><aside id="place-card" class="place-card" aria-label="Place details" aria-live="polite" hidden></aside></div><div class="map-bottom"><div class="legend" aria-label="Route legend">${features.features.filter(f=>f.properties.kind==='route').sort((a,b)=>(a.properties.legend_order??Infinity)-(b.properties.legend_order??Infinity)).map(({properties:p})=>`<span><i style="--swatch:${h(p.color)}"></i>${h(p.legend_label||p.title)}</span>`).join('')}</div><div class="layer-controls" aria-label="Map layers"><label><input type="checkbox" data-layer="routes" checked> Routes</label><label><input type="checkbox" data-layer="markers" checked> Places</label><label><input type="checkbox" data-layer="regions"> Regions</label></div></div><p class="map-disclaimer">${h(mapConfig.disclaimer||'')} <a href="${h(location.pathname+location.search)}#map-notes" id="map-notes-link">About this map ↗</a></p></div>
  </section><section class="timeline-panel" aria-label="Expedition timeline"><div class="timeline-header"><div><p class="eyebrow">FOLLOW THE STORY</p><h2>The journey, moment by moment.</h2><p class="timeline-hint">Select a moment to locate it on the map.</p></div><span class="event-count">${String(timeline.length).padStart(2,'0')}</span></div><div class="timeline-scroll"><ol id="timeline" class="timeline"></ol></div><div class="timeline-navigation"><span id="event-progress" aria-live="polite">Choose a moment to begin</span><button class="text-button" id="view-selected-map" hidden>View on map ↑</button><div><button id="previous-event" aria-label="Previous event" disabled>←</button><button id="next-event" aria-label="Next event">→</button></div></div></section>
  <section id="map-notes" class="notes-section" aria-label="Expedition notes"></section>`;
  let selected=-1;
  const card=createCard(container.querySelector('#place-card'));
  const byId=new Map(features.features.filter(f=>f.properties.kind==='marker').map(f=>[f.properties.id,f]));
  const map=createMap(container.querySelector('#map'),data,id=>select(timeline.find(e=>e.marker===id)?.id));
  const timelineView=createTimeline(container.querySelector('#timeline'),timeline,select);
  function select(id) {
    const index=timeline.findIndex(e=>e.id===id);if(index<0)return;
    selected=index;const event=timeline[index],feature=byId.get(event.marker);
    map.select(event.marker);timelineView.select(event.id);card.show(feature,cards[feature.properties.card],event);
    container.querySelector('#event-progress').textContent=`Moment ${index+1} of ${timeline.length}`;
    container.querySelector('#previous-event').disabled=index===0;
    container.querySelector('#next-event').disabled=index===timeline.length-1;
    container.querySelector('#view-selected-map').hidden=false;
    history.replaceState(null,'',`${location.pathname}${location.search}#event=${encodeURIComponent(event.id)}`);
  }
  container.querySelector('#view-selected-map').onclick=()=>container.querySelector('.map-frame').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  container.querySelector('#previous-event').onclick=()=>select(timeline[Math.max(0,selected-1)].id);
  container.querySelector('#next-event').onclick=()=>select(timeline[Math.min(timeline.length-1,selected+1)].id);
  container.querySelector('#reset-map').onclick=()=>{map.fit();card.close();};
  container.querySelectorAll('[data-layer]').forEach(input=>input.addEventListener('change',()=>map.toggle(input.dataset.layer,input.checked)));
  container.querySelector('#map-notes-link').onclick=e=>{e.preventDefault();history.replaceState(null,'',e.currentTarget.href);container.querySelector('#map-notes').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
  const notesView=renderNotes(container.querySelector('#map-notes'),notes,project.sources);
  if(initialEvent)select(initialEvent);
  return {destroy(){map.destroy();notesView.destroy();}};
}
