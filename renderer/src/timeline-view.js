import {escapeHTML as h,dateLabel} from './project-loader.js';
export function createTimeline(container,events,onSelect) {
  container.innerHTML=events.map((event,i)=>`<li><button class="timeline-event" data-event="${h(event.id)}" aria-pressed="false"><span class="timeline-dot" aria-hidden="true"></span><span class="event-date">${h(dateLabel(event.date))}</span><span class="event-title">${h(event.title)}</span><span class="event-summary">${h(event.summary)}</span><span class="event-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span></button></li>`).join('');
  container.addEventListener('click',event=>{const button=event.target.closest('[data-event]');if(button)onSelect(button.dataset.event);});
  return {select(id) {
    for(const button of container.querySelectorAll('[data-event]')) {
      const active=button.dataset.event===id;
      button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
      if(active) {
        // Scroll the timeline's own viewport, never jump the surrounding page.
        const viewport=container.parentElement;
        const top=button.getBoundingClientRect().top-viewport.getBoundingClientRect().top+viewport.scrollTop;
        if(top<viewport.scrollTop || top+button.offsetHeight>viewport.scrollTop+viewport.clientHeight) viewport.scrollTo({top:Math.max(0,top-60),behavior:'smooth'});
      }
    }
  }};
}
