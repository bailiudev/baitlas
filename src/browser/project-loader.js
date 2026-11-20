export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function fetchData(path, asText=false) {
  const response=await fetch(new URL(path,document.baseURI));
  if(!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return asText?response.text():response.json();
}
export async function loadProject(id) {
  if(!/^[a-z0-9_-]+$/.test(id)) throw new Error('Invalid project identifier');
  const base=`projects/${id}/`;
  const [project,map,features,timeline,cards,notes]=await Promise.all(['project.json','map.json','features.geojson','timeline.json','cards.json','notes.html'].map(file=>fetchData(base+file,file.endsWith('.html'))));
  const [basemap,style]=await Promise.all([fetchData(map.basemap),fetchData(map.style)]);
  return {project,map,features,timeline,cards,notes,basemap,style};
}
export function dateLabel(date) {
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
}
