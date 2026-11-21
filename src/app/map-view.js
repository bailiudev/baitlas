import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {escapeHTML as h} from './project-loader.js';
const latLng=c=>[c[1],c[0]];
export function createMap(element,data,onMarker) {
  const {features,basemap}=data;
  const config=data.map;
  const style=config.style;
  const map=L.map(element,{zoomControl:false,attributionControl:true,preferCanvas:true,minZoom:3,maxZoom:9,zoomSnap:0.25,maxBounds:config.extent.map(latLng),maxBoundsViscosity:0.8,scrollWheelZoom:false});
  element.style.background=style.ocean;
  L.control.zoom({position:'topright'}).addTo(map);
  L.control.scale({position:'bottomleft',imperial:false,maxWidth:100}).addTo(map);
  map.attributionControl.setPrefix(false);
  const attribution=config.attribution;
  if(attribution)map.attributionControl.addAttribution(`<a href="${h(attribution.url)}">${h(attribution.title)}</a>${attribution.note?` · ${h(attribution.note)}`:''}`);
  const baseRenderer=L.canvas({padding:0.5});
  for(const kind of ['land','lakes','rivers']) L.geoJSON(basemap,{filter:f=>f.properties.kind===kind,style:style[kind],interactive:false,renderer:baseRenderer}).addTo(map);
  const graticule=L.layerGroup().addTo(map);
  const [[west,south],[east,north]]=config.extent;
  for(let lon=Math.ceil(west/5)*5;lon<=east;lon+=5)L.polyline([[south,lon],[north,lon]],{color:'#607976',weight:0.5,opacity:0.16,interactive:false}).addTo(graticule);
  for(let lat=Math.ceil(south/5)*5;lat<=north;lat+=5)L.polyline([[lat,west],[lat,east]],{color:'#607976',weight:0.5,opacity:0.16,interactive:false}).addTo(graticule);
  const regionLayer=L.geoJSON(features,{filter:f=>f.properties.kind==='region',style:f=>({color:f.properties.color,weight:1,dashArray:'3 5',fillOpacity:0.13}),onEachFeature:(f,l)=>l.bindTooltip(`${h(f.properties.title)}${config.regionNote?`<br><small>${h(config.regionNote)}</small>`:''}`) });
  const routeLayer=L.geoJSON(features,{filter:f=>f.properties.kind==='route',style:f=>({color:f.properties.color,weight:3.5,opacity:0.95,dashArray:'7 5'}),onEachFeature:(f,l)=>l.bindTooltip(`${h(f.properties.title)}${config.routeNote?`<br><small>${h(config.routeNote)}</small>`:''}`)}).addTo(map);
  const markerLayer=L.layerGroup().addTo(map), markers=new Map();
  features.features.filter(f=>f.properties.kind==='marker').forEach((feature,index)=>{
    const p=feature.properties;
    const marker=L.marker(latLng(feature.geometry.coordinates),{title:p.title,alt:`Open ${p.title}`,keyboard:true,icon:L.divIcon({className:'place-marker',html:`<span>${String(index+1).padStart(2,'0')}</span>`,iconSize:[28,28],iconAnchor:config.markerAnchors?.[p.id]||[14,14]})}).addTo(markerLayer);
    marker.getElement()?.setAttribute('aria-label', `Open ${p.title}`);
    marker.bindTooltip(h(p.title),{direction:'top',offset:[0,-16]});
    marker.on('click',()=>onMarker(p.id)); markers.set(p.id,marker);
  });
  const labelLayer=L.layerGroup().addTo(map);
  for(const feature of features.features.filter(f=>f.properties.kind==='label')) {
    const {text,style}=feature.properties;
    L.marker(latLng(feature.geometry.coordinates),{interactive:false,keyboard:false,icon:L.divIcon({className:`geographic-label ${style}`,html:h(text).replace(/\n/g,'<br>'),iconSize:[160,30],iconAnchor:[80,15]})}).addTo(labelLayer);
  }
  const fit=()=>map.fitBounds(config.bounds.map(latLng),{padding:[28,35],animate:false});
  fit();
  const observer=new ResizeObserver(()=>{map.invalidateSize({pan:false});});observer.observe(element);
  return {
    map,fit,
    select(id){
      markers.forEach((marker,key)=>marker.getElement()?.classList.toggle('selected',key===id));
      const target=markers.get(id);
      if(target) {map.setView(target.getLatLng(),Math.max(map.getZoom(),6),{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});target.setZIndexOffset(1000);}
    },
    toggle(name,visible){const layer={routes:routeLayer,regions:regionLayer,markers:markerLayer}[name];if(layer)visible?map.addLayer(layer):map.removeLayer(layer);},
    destroy(){observer.disconnect();map.remove();}
  };
}
