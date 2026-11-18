import {escapeHTML as h} from './project-loader.js';
export function renderNotes(container,notes,sources) {
  container.innerHTML=`<nav class="notes-toc" aria-label="Article sections"><p class="eyebrow">IN THIS ARTICLE</p><ol></ol></nav><div class="notes-reading"><article class="prose notes-copy">${notes}</article><section class="references" id="section-references" tabindex="-1" aria-labelledby="references-heading"><p class="eyebrow">FURTHER READING</p><h2 id="references-heading">References</h2><ol></ol><p class="reference-credit">Historical accounts: National Park Service & National Archives. Map data: Natural Earth.</p></section></div>`;
  const article=container.querySelector('.notes-copy');
  const refs=sources.map(s=>({...s}));
  const refIndex=new Map(refs.map((s,i)=>[s.url,i]));
  for(const link of article.querySelectorAll('a[href^="https://"],a[href^="http://"]')) {
    const url=link.getAttribute('href');
    if(!refIndex.has(url)){refIndex.set(url,refs.length);refs.push({title:link.textContent,url});}
    const n=refIndex.get(url)+1;
    link.href=`${location.pathname}${location.search}#reference-${n}`;
    link.before(document.createTextNode(link.textContent));
    link.textContent=`[${n}]`;link.className='reference-link';link.setAttribute('aria-label',`Reference ${n}: ${refs[n-1].title}`);
  }
  const headings=[...article.querySelectorAll('h2,h3')];
  headings.forEach((heading,i)=>{heading.id=`section-${i+1}-${heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;heading.tabIndex=-1;});
  const entries=[...headings,{id:'section-references',textContent:'References'}];
  const currentPath=`${location.pathname}${location.search}`;
  container.querySelector('.notes-toc ol').innerHTML=entries.map((heading,i)=>`<li><a href="${h(currentPath)}#${h(heading.id)}"><span>${String(i+1).padStart(2,'0')}</span>${h(heading.textContent)}</a></li>`).join('');
  container.querySelector('.references ol').innerHTML=refs.map((s,i)=>`<li id="reference-${i+1}" tabindex="-1"><a href="${h(s.url)}" target="_blank" rel="noopener noreferrer">${h(s.title)} <span aria-hidden="true">↗</span></a><span class="reference-domain">${h(new URL(s.url).hostname.replace(/^www\./,''))}</span></li>`).join('');
  const links=[...container.querySelectorAll('.notes-toc a')];
  function markActive(id){for(const link of links){if(link.hash===`#${id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
  const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting);if(visible.length)markActive(visible[0].target.id);},{rootMargin:'-5% 0px -65% 0px'});
  for(const heading of [...headings,container.querySelector('.references')])observer.observe(heading);
  container.addEventListener('click',event=>{
    const link=event.target.closest('.notes-toc a,.reference-link');if(!link)return;
    const target=document.getElementById(link.hash.slice(1));if(!target)return;
    event.preventDefault();history.replaceState(null,'',link.href);
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    target.focus({preventScroll:true});markActive(target.id);
  });
  return {destroy(){observer.disconnect();}};
}
