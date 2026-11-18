import {escapeHTML as h} from './project-loader.js';
export function renderNotes(container,notes,sources) {
  container.innerHTML=`<div class="notes-intro"><p class="eyebrow">THE FIELD NOTES</p><h2>Beyond the line <br>on the map.</h2><p>The people, places, and choices behind the journey.</p></div><article class="prose notes-copy">${notes}</article><aside class="sources"><p class="eyebrow">READ THE SOURCES</p>${sources.map((source,i)=>`<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer"><span>${String(i+1).padStart(2,'0')}</span>${h(source.title)}<span aria-hidden="true">↗</span></a>`).join('')}<p>Historical accounts: National Park Service & National Archives.<br>Map data: Natural Earth.</p></aside>`;
}
