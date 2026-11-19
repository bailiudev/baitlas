import './styles.css';
import {fetchData,loadProject,escapeHTML as h} from './project-loader.js';
import {renderProject} from './project-view.js';
import {renderHome,renderCollection,renderAbout,inCollection,projectURL} from './pages-view.js';
const main=document.querySelector('#main');
const page=document.body.dataset.page||'home';
const projectId=new URLSearchParams(location.search).get('project');
document.querySelector('.skip-link').href=`${location.pathname}${location.search}#main`;
for(const link of document.querySelectorAll('[data-page-link]')) {
  if(link.dataset.pageLink===page){link.classList.add('active');link.setAttribute('aria-current','page');}
}
try {
  if(location.protocol==='file:')throw new Error('Serve this atlas over HTTP: python3 -m http.server 8000, then open http://localhost:8000.');
  if(page==='about') {
    renderAbout(main,await fetchData('generated/about.html',true));document.title='About · Baitlas';
  } else {
    const catalog=await fetchData('generated/projects.json');
    // Keep links shared by the first MVP working.
    const [legacyId,legacyEvent]=location.hash.slice(1).split('/');
    if(page==='home'&&catalog.some(p=>p.id===legacyId)) {
      const url=new URL(projectURL(legacyId),document.baseURI);
      if(legacyEvent)url.hash=`event=${encodeURIComponent(legacyEvent)}`;
      location.replace(url.href);
    } else if((page==='read'||page==='hike')&&projectId) {
      if(!catalog.some(p=>p.id===projectId&&inCollection(p,page)))throw new Error('This article could not be found in this collection.');
      const data=await loadProject(projectId);
      const event=location.hash.startsWith('#event=')?decodeURIComponent(location.hash.slice(7)):undefined;
      renderProject(main,data,page,event);
      document.title=`${data.project.title} · ${page==='hike'?'Hike':'Read'} · Baitlas`;
      if(location.hash==='#map-notes'||location.hash.startsWith('#section-')||location.hash.startsWith('#reference-'))document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } else if(page==='read'||page==='hike') {
      renderCollection(main,catalog,page);document.title=`${page==='read'?'Read':'Hike'} · Baitlas`;
    } else renderHome(main,catalog);
  }
} catch(error) {
  main.innerHTML=`<section class="error-state" role="alert"><p class="eyebrow">A SMALL DETOUR</p><h1>Let’s find our way back.</h1><p>${h(error.message)}</p><a class="underlined-link" href="${page==='hike'?'hike/':'read/'}">Back to the collection ↗</a></section>`;
}
