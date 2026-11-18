import './styles.css';
import {fetchData,loadProject,escapeHTML as h} from './project-loader.js';
import {renderProject} from './project-view.js';
const main=document.querySelector('#main');
let activeView,mode='Read',catalog=[],loadNumber=0;
async function openProject(id,event) {
  const attempt=++loadNumber;
  activeView?.destroy();activeView=null;
  main.innerHTML='<p class="loading" role="status">Unfolding the map…</p>';
  try {
    if(!catalog.some(p=>p.id===id))throw new Error('This story was not found. Choose a story from Explore stories.');
    const data=await loadProject(id);if(attempt!==loadNumber)return;
    activeView=renderProject(main,data,mode,event);
    if(!event)history.replaceState(null,'',`#${id}`);
    document.title=`${data.project.title} · Baitlas`;
  } catch(error) {
    if(attempt!==loadNumber)return;
    main.innerHTML=`<section class="error-state" role="alert"><p class="eyebrow">THE MAP COULD NOT OPEN</p><h1>Let’s find our way back.</h1><p>${h(error.message)}</p><p>Serve the repository over HTTP and run both build commands in the README.</p><button id="retry-load" class="primary-button">Try again</button></section>`;
    document.querySelector('#retry-load').onclick=()=>openProject(catalog[0]?.id);
  }
}
const catalogButton=document.querySelector('#catalog-button'),catalogPanel=document.querySelector('#catalog');
function closeCatalog(){catalogPanel.hidden=true;catalogButton.setAttribute('aria-expanded','false');}
catalogButton.onclick=()=>{catalogPanel.hidden=!catalogPanel.hidden;catalogButton.setAttribute('aria-expanded',String(!catalogPanel.hidden));};
document.addEventListener('click',e=>{if(!e.target.closest('.catalog-wrap'))closeCatalog();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCatalog();});
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
  mode=button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  activeView?.setMode(mode);
});
const about=document.querySelector('#about-dialog');
document.querySelector('#about-button').onclick=()=>about.showModal();
for(const id of ['about-close','about-done'])document.getElementById(id).onclick=()=>about.close();
about.addEventListener('click',e=>{if(e.target===about){const r=about.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)about.close();}});
try {
  if(location.protocol==='file:')throw new Error('This interactive atlas needs a local web server. Run: python3 -m http.server 8000, then open http://localhost:8000.');
  catalog=await fetchData('generated/projects.json');
  if(!catalog.length)throw new Error('No projects have been built yet.');
  catalogPanel.innerHTML=`<p class="eyebrow">YOUR ATLAS</p>${catalog.map(p=>`<button data-project="${h(p.id)}"><strong>${h(p.title)}</strong><span>${h(p.period)} · ${h(p.category)} ↗</span></button>`).join('')}`;
  catalogPanel.onclick=e=>{const b=e.target.closest('[data-project]');if(b){closeCatalog();history.replaceState(null,'',`#${b.dataset.project}`);openProject(b.dataset.project);}};
  const rawHash=location.hash.slice(1);
  const [id,event]=['main','map-notes'].includes(rawHash)?[]:rawHash.split('/');
  await openProject(id||catalog[0].id,event);
  window.addEventListener('hashchange',()=>{const hash=location.hash.slice(1);if(['main','map-notes'].includes(hash))return;const [next,event]=hash.split('/');openProject(next||catalog[0].id,event);});
} catch(error){main.innerHTML=`<section class="error-state" role="alert"><h1>The atlas needs one more step.</h1><p>${h(error.message)}</p><p>See README.md for build and serving instructions.</p></section>`;}
