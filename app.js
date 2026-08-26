(()=>{"use strict";
const cfg=OKINAMAP_CONFIG,spots=OKINAMAP_SPOTS||[],spec=OKINAMAP_FILTERS,$=id=>document.getElementById(id);
let map,markers=[],active={categories:[],tags:{}},draft,group=[],groupIndex=0,userMarker=null,lastPosition=null,toastTimer;

// Uploaded pictograms redrawn as inline SVG. The common pin shell is shared by every category.
const pictograms={
  "飲食店":`<g class="pin-pictogram pin-pictogram-food">
    <path d="M19 14v9.4c0 2.3 1.8 4.1 4.1 4.1h.3c2.3 0 4.1-1.8 4.1-4.1V14"/>
    <path d="M23.25 14v9.2M19 19h8.5M23.25 27.5V39"/>
    <path d="M34.3 14c-3.1 4.4-4.2 8-3.4 11 .5 1.8 1.7 3.1 3.4 3.9V39M34.3 14V39"/>
  </g>`,
  "カフェ":`<g class="pin-pictogram pin-pictogram-cafe">
    <path d="M15.5 23.2h20.2v7.1c0 5.3-4.2 9.4-9.5 9.4h-1.3c-5.3 0-9.4-4.1-9.4-9.4z"/>
    <path d="M35.7 25.2h2.4c4.2 0 5.7 2.4 5.7 5.3 0 3.4-2.4 5.8-6.4 5.8h-3"/>
    <path d="M20.2 20.4c-2-2.2.2-3.9 2-5.4 1.5-1.3 1.8-2.7.5-4.2"/>
    <path d="M28 20.4c-2-2.2.2-3.9 2-5.4 1.5-1.3 1.8-2.7.5-4.2"/>
  </g>`,
  "ビーチ":`<g class="pin-pictogram pin-pictogram-beach">
    <path d="M13.5 26.1c3.1-7 8.9-11.3 15.7-11.3 7.2 0 13.2 4.6 16 11.8-3.6-1.5-6.4-.9-8.9 2.2-2.9-2.5-5.7-2.7-8.6.1-2.9-2.8-5.8-2.8-8.7-.1-1.9-2.3-3.7-3-5.5-2.7z"/>
    <path d="M29.2 14.8l1.9 22.4M21.3 39.1h19.4c-2.4-2-5.7-3-9.7-3-4.1 0-7.3 1-9.7 3z"/>
    <path d="M29.2 14.8c-4.2 3.7-7.5 8.4-10.2 14M29.2 14.8c4.2 3.7 6.5 8.4 7.1 14"/>
  </g>`,
  "その他":`<g class="pin-pictogram pin-pictogram-other">
    <path d="m24.1 14.2 2.5 5.2 5.8.8-4.2 4.1 1 5.8-5.1-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z"/>
    <path d="m35.8 27.3 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/>
    <path d="m20 31.9 1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"/>
  </g>`
};
function markerSvg(category){return `<svg class="coded-pin" viewBox="0 0 54 58" aria-hidden="true"><path class="pin-shell" d="M27 2.5C13.7 2.5 5 11.9 5 24.7c0 16.4 22 30.3 22 30.3s22-13.9 22-30.3C49 11.9 40.3 2.5 27 2.5Z"/>${pictograms[category]||pictograms["その他"]}</svg>`}
function validKey(){return cfg.mapTilerKey&&cfg.mapTilerKey!=="YOUR_MAPTILER_API_KEY"}
function groups(list){const m=new Map;list.forEach(s=>{const k=s.groupId||`single:${s.id}`;(m.get(k)||m.set(k,[]).get(k)).push(s)});return[...m.values()]}
function filtered(f){return spots.filter(s=>{const c=!f.categories.length||f.categories.includes(s.category),gs=Object.values(f.tags).filter(a=>a.length);return c&&gs.every(tags=>tags.some(t=>s.tags.includes(t)))})}
function initMap(){if(!validKey()){$("setupMessage").hidden=false;return}map=new maplibregl.Map({container:"map",style:cfg.mapStyle.replace("{KEY}",encodeURIComponent(cfg.mapTilerKey)),center:cfg.initialCenter,zoom:cfg.initialZoom,minZoom:cfg.minZoom,maxZoom:cfg.maxZoom,maxBounds:cfg.maxBounds,attributionControl:false});map.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");map.addControl(new maplibregl.AttributionControl({compact:true}),"bottom-right");map.on("load",renderMarkers)}
function renderMarkers(){markers.forEach(x=>x.marker.remove());markers=[];groups(filtered(active)).forEach(g=>{const p=g[0],el=document.createElement("button");el.className="marker-wrap coded-marker";el.type="button";el.innerHTML=`<span class="marker-art">${markerSvg(p.category)}</span>${g.length>1?`<span class="count-badge">${g.length}</span>`:""}`;el.ariaLabel=g.length>1?`${g.length}件のスポット`:p.name;el.onclick=e=>{e.stopPropagation();openGroup(g)};const marker=new maplibregl.Marker({element:el,anchor:"bottom"}).setLngLat(p.coordinates).addTo(map);markers.push({marker,el,ids:g.map(s=>s.id)})})}
function openGroup(g){group=g;groupIndex=0;markers.forEach(m=>m.el.classList.toggle("is-selected",m.ids.some(id=>g.some(s=>s.id===id))));showSpot();$("spotSheet").classList.add("is-open");$("spotSheet").setAttribute("aria-hidden","false");map.easeTo({center:g[0].coordinates,offset:[0,-Math.min(innerHeight*.22,190)],duration:400})}
function showSpot(){const s=group[groupIndex];$("spotName").textContent=s.name;$("spotCategory").textContent=s.category;$("spotDescription").textContent=s.description;$("spotNotesWrap").hidden=!s.notes;$("spotNotes").textContent=s.notes||"";$("googleMapsLink").href=s.googleMapsUrl||`https://www.google.com/maps/search/?api=1&query=${s.coordinates[1]},${s.coordinates[0]}`;renderPhotos(s.photos||[]);$("groupSwitcher").hidden=group.length<2;$("groupSwitcher").style.display=group.length<2?"none":"grid";$("groupPosition").textContent=`${groupIndex+1} / ${group.length}`}
function renderPhotos(photos){const c=$("photoCarousel");c.innerHTML="";(photos.length?photos:[{src:"assets/placeholder.svg"}]).forEach((p,i,a)=>{const d=document.createElement("div");d.className="photo-slide";d.innerHTML=`<img src="${p.src}" alt="${$("spotName").textContent}の写真 ${i+1}" style="object-position:${p.position||"center"}">${a.length>1?`<div class="photo-dots">${a.map((_,j)=>`<span class="photo-dot ${i===j?"on":""}"></span>`).join("")}</div>`:""}`;c.appendChild(d)});c.scrollLeft=0}
function closeSheet(){$("spotSheet").classList.remove("is-open");$("spotSheet").setAttribute("aria-hidden","true");markers.forEach(m=>m.el.classList.remove("is-selected"))}
function selected(f,key){return key==="categories"?f.categories:(f.tags[key]??=[])}
function initFilters(){const host=$("filterGroups"),add=(label,key,vals)=>{const sec=document.createElement("section");sec.className="filter-section";sec.innerHTML=`<h2>${label}</h2><div class="chip-list"></div>`;vals.forEach(v=>{const b=document.createElement("button");b.className="filter-chip";b.textContent=v;b.dataset.key=key;b.dataset.value=v;b.onclick=()=>{const a=selected(draft,key),i=a.indexOf(v);i<0?a.push(v):a.splice(i,1);syncFilters()};sec.lastChild.appendChild(b)});host.appendChild(sec)};add("カテゴリー","categories",spec.categories);spec.tagGroups.forEach(g=>add(g.label,g.label,g.tags))}
function syncFilters(){document.querySelectorAll(".filter-chip").forEach(b=>b.setAttribute("aria-pressed",selected(draft,b.dataset.key).includes(b.dataset.value)));const n=filtered(draft).length;$("resultCount").textContent=`該当するスポット：${n}件`;$("zeroMessage").hidden=n!==0;$("applyFilters").disabled=n===0}
function hasFilters(f){return f.categories.length||Object.values(f.tags).some(a=>a.length)}
function openFilters(){draft=structuredClone(active);syncFilters();$("filterModal").hidden=false}
function showToast(msg){clearTimeout(toastTimer);$("toast").textContent=msg;$("toast").classList.add("show");toastTimer=setTimeout(()=>$("toast").classList.remove("show"),3000)}
function insideBounds(lng,lat){const b=cfg.maxBounds;return lng>=b[0][0]&&lng<=b[1][0]&&lat>=b[0][1]&&lat<=b[1][1]}
function locate(){if(lastPosition){map.easeTo({center:[lastPosition.coords.longitude,lastPosition.coords.latitude],zoom:15,duration:500});return}if(!navigator.geolocation){showToast("この端末では現在地を利用できません");return}navigator.geolocation.getCurrentPosition(pos=>{const lng=pos.coords.longitude,lat=pos.coords.latitude;if(!insideBounds(lng,lat)){showToast("現在地はOKINAMAPの表示範囲外です");return}lastPosition=pos;if(!userMarker){const el=document.createElement("div");el.className="user-heart";el.setAttribute("aria-label","現在地");userMarker=new maplibregl.Marker({element:el,anchor:"bottom"}).setLngLat([lng,lat]).addTo(map)}else userMarker.setLngLat([lng,lat]);map.easeTo({center:[lng,lat],zoom:15,duration:600})},err=>showToast(err.code===1?"現在地を取得できませんでした。位置情報設定をご確認ください":"現在地を取得できませんでした"),{enableHighAccuracy:true,timeout:10000,maximumAge:60000})}
$("sheetClose").onclick=closeSheet;$("groupPrev").onclick=()=>{groupIndex=(groupIndex-1+group.length)%group.length;showSpot()};$("groupNext").onclick=()=>{groupIndex=(groupIndex+1)%group.length;showSpot()};$("filterOpen").onclick=openFilters;$("filterClose").onclick=()=>{$("filterModal").hidden=true};$("clearFilters").onclick=()=>{draft={categories:[],tags:{}};syncFilters()};$("applyFilters").onclick=()=>{active=structuredClone(draft);$("filterModal").hidden=true;$("filterBadge").hidden=!hasFilters(active);closeSheet();if(map)renderMarkers()};$("locateButton").onclick=locate;initFilters();initMap()})();
