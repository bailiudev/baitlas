export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function fetchData(path, asText=false) {
  const response=await fetch(new URL(path,document.baseURI));
  if(!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return asText?response.text():response.json();
}
export async function loadProject(id) {
  if(!/^[a-z0-9_-]+$/.test(id)) throw new Error('Invalid project identifier');
  const base=`projects/${id}/`;
  const content=await fetchData(base+'project.json');
  const {map}=content;
  const basemap=await fetchData(map.basemap);
  return {...content,basemap};
}
export function dateLabel(date) {
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
}
