import {escapeHTML as h,dateLabel} from './project-loader.js';
export function createTimeline(container,events,onSelect) {
  container.innerHTML=events.map((event,i)=>`<li><button class="timeline-event" data-event="${h(event.id)}" aria-pressed="false"><span class="timeline-dot" aria-hidden="true"></span><span class="event-date">${h(dateLabel(event.date))}</span><span class="event-title">${h(event.title)}</span><span class="event-summary">${h(event.summary)}</span><span class="event-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span></button></li>`).join('');
  container.addEventListener('click',event=>{const button=event.target.closest('[data-event]');if(button)onSelect(button.dataset.event);});
  return {select(id) {
    for(const button of container.querySelectorAll('[data-event]')) {
      const active=button.dataset.event===id;
      button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
      if(active) {
        const viewport=container.parentElement;
        const rect=button.getBoundingClientRect(),frame=viewport.getBoundingClientRect();
        if(rect.left<frame.left||rect.right>frame.right) viewport.scrollTo({left:Math.max(0,rect.left-frame.left+viewport.scrollLeft-12),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      }
    }
  }};
}
