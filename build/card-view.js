import {escapeHTML as h,dateLabel} from './project-loader.js';
export function createCard(container) {
  let trigger=null;
  container.addEventListener('click',e=>{if(e.target.closest('[data-close-card]')) close();});
  container.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
  function close(){container.hidden=true;trigger?.focus({preventScroll:true});}
  return {close, show(feature,html,event) {
    trigger=document.activeElement;
    container.innerHTML=`<div class="card-topline"><span class="eyebrow">${h(event?dateLabel(event.date):feature.properties.category)}</span><button class="close-button" data-close-card aria-label="Close place card">×</button></div>${event?`<p class="card-event-title">${h(event.title)}</p><p class="card-event-summary">${h(event.summary)}</p>`:''}<div class="prose card-body">${html}</div>`;
    container.hidden=false;
    // Keep timeline keyboard focus in place; the card is a named, nonmodal region.
  }};
}
