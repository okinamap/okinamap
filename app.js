(() => {
  "use strict";
  const cfg = window.OKINAMAP_CONFIG;
  const spots = window.OKINAMAP_SPOTS || [];
  const filterSpec = window.OKINAMAP_FILTERS;
  const categoryIcons = {
    "飲食店": '<path d="M7 3v7M4 3v4c0 2 6 2 6 0V3M7 10v11M15 3v18M15 3c5 2 5 9 0 10"/>',
    "カフェ": '<path d="M5 8h11v7a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a3 3 0 0 1 0 6h-2M8 3c-2 2 2 2 0 4M13 3c-2 2 2 2 0 4"/>',
    "ビーチ": '<path d="M3 15c3-4 6 4 9 0s6 4 9 0M3 20c3-4 6 4 9 0s6 4 9 0M6 11c2-5 10-7 14-3-3 0-4 1-5 3-2-2-4-2-5 0-1-2-2-3-4-3"/>',
    "その他": '<path d="m12 3 2.4 5 5.6.8-4 4 .9 5.7-4.9-2.7-4.9 2.7.9-5.7-4-4 5.6-.8z"/>'
  };
  let map;
  let markers = [];
  let activeFilters = { categories: [], tags: {} };
  let draftFilters = structuredClone(activeFilters);
  let selectedMarkerIds = [];
  let currentGroup = [];
  let currentGroupIndex = 0;

  const $ = id => document.getElementById(id);
  const sheet = $("spotSheet");
  const filterModal = $("filterModal");

  function buildStyleUrl() {
    return cfg.mapStyle.replace("{KEY}", encodeURIComponent(cfg.mapTilerKey));
  }
  function validKey() {
    return cfg.mapTilerKey && cfg.mapTilerKey !== "YOUR_MAPTILER_API_KEY";
  }
  function groupedSpots(list = spots) {
    const groups = new Map();
    list.forEach(spot => {
      const key = spot.groupId || `single:${spot.id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(spot);
    });
    return [...groups.values()];
  }
  function markerSvg(category) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${categoryIcons[category] || categoryIcons["その他"]}</svg>`;
  }
  function initMap() {
    if (!validKey()) {
      $("setupMessage").hidden = false;
      return;
    }
    map = new maplibregl.Map({
      container: "map",
      style: buildStyleUrl(),
      center: cfg.initialCenter,
      zoom: cfg.initialZoom,
      minZoom: cfg.minZoom,
      maxZoom: cfg.maxZoom,
      maxBounds: cfg.maxBounds,
      attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.on("load", renderMarkers);
  }
  function filteredSpots(filters) {
    return spots.filter(spot => {
      const categoryOk = !filters.categories.length || filters.categories.includes(spot.category);
      const selectedTagGroups = Object.values(filters.tags).filter(arr => arr.length);
      const tagsOk = selectedTagGroups.every(groupTags => groupTags.some(tag => spot.tags.includes(tag)));
      return categoryOk && tagsOk;
    });
  }
  function renderMarkers() {
    markers.forEach(item => item.marker.remove());
    markers = [];
    groupedSpots(filteredSpots(activeFilters)).forEach(group => {
      const primary = group[0];
      const el = document.createElement("button");
      el.type = "button";
      el.className = `custom-marker${group.length > 1 ? " is-group" : ""}`;
      el.innerHTML = markerSvg(primary.category);
      el.setAttribute("aria-label", group.length > 1 ? `${group.length}件のスポット` : primary.name);
      el.addEventListener("click", event => {
        event.stopPropagation();
        openGroup(group);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(primary.coordinates)
        .addTo(map);
      markers.push({ marker, el, ids: group.map(s => s.id) });
    });
  }
  function selectMarker(ids) {
    selectedMarkerIds = ids;
    markers.forEach(m => m.el.classList.toggle("is-selected", m.ids.some(id => ids.includes(id))));
  }
  function openGroup(group) {
    currentGroup = group;
    currentGroupIndex = 0;
    selectMarker(group.map(s => s.id));
    showSpot();
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    const lngLat = group[0].coordinates;
    const cardHeight = Math.min(sheet.scrollHeight || 360, window.innerHeight * .52);
    map.easeTo({ center: lngLat, offset: [0, -cardHeight * .42], duration: 420 });
  }
  function showSpot() {
    const spot = currentGroup[currentGroupIndex];
    $("spotName").textContent = spot.name;
    $("spotCategory").textContent = spot.category;
    $("spotDescription").textContent = spot.description;
    $("spotNotesWrap").hidden = !spot.notes;
    $("spotNotes").textContent = spot.notes || "";
    $("googleMapsLink").href = spot.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${spot.coordinates[1]},${spot.coordinates[0]}`;
    renderPhotos(spot.photos || []);
    const multiple = currentGroup.length > 1;
    $("groupSwitcher").hidden = !multiple;
    $("groupPosition").textContent = `${currentGroupIndex + 1} / ${currentGroup.length}`;
  }
  function renderPhotos(photos) {
    const carousel = $("photoCarousel");
    carousel.innerHTML = "";
    const list = photos.length ? photos : [{ src: "assets/placeholder.svg", position: "center" }];
    list.forEach((photo, index) => {
      const slide = document.createElement("div");
      slide.className = "photo-slide";
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = `${$("spotName").textContent}の写真 ${index + 1}`;
      img.style.objectPosition = photo.position || "center";
      img.draggable = false;
      slide.appendChild(img);
      if (list.length > 1) {
        const dots = document.createElement("div");
        dots.className = "photo-dots";
        list.forEach((_, dotIndex) => {
          const dot = document.createElement("span");
          dot.className = `photo-dot${dotIndex === index ? " active" : ""}`;
          dots.appendChild(dot);
        });
        slide.appendChild(dots);
      }
      carousel.appendChild(slide);
    });
    carousel.scrollLeft = 0;
  }
  function closeSheet() {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    selectMarker([]);
  }
  function initFilters() {
    const wrap = $("filterGroups");
    wrap.innerHTML = "";
    createFilterSection("カテゴリー", "categories", filterSpec.categories);
    filterSpec.tagGroups.forEach(group => createFilterSection(group.label, group.label, group.tags));
  }
  function createFilterSection(label, key, values) {
    const section = document.createElement("section");
    section.className = "filter-section";
    section.innerHTML = `<h2>${label}</h2><div class="chip-list"></div>`;
    const list = section.querySelector(".chip-list");
    values.forEach(value => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-chip";
      button.textContent = value;
      button.dataset.filterKey = key;
      button.dataset.value = value;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => toggleDraft(key, value));
      list.appendChild(button);
    });
    $("filterGroups").appendChild(section);
  }
  function selectedArray(filters, key) {
    return key === "categories" ? filters.categories : (filters.tags[key] ||= []);
  }
  function toggleDraft(key, value) {
    const arr = selectedArray(draftFilters, key);
    const index = arr.indexOf(value);
    index >= 0 ? arr.splice(index, 1) : arr.push(value);
    syncFilterUI();
  }
  function syncFilterUI() {
    document.querySelectorAll(".filter-chip").forEach(button => {
      const arr = selectedArray(draftFilters, button.dataset.filterKey);
      button.setAttribute("aria-pressed", String(arr.includes(button.dataset.value)));
    });
    const count = filteredSpots(draftFilters).length;
    $("resultCount").textContent = `該当するスポット：${count}件`;
    $("zeroMessage").hidden = count !== 0;
    $("applyFilters").disabled = count === 0;
  }
  function hasFilters(filters) {
    return filters.categories.length > 0 || Object.values(filters.tags).some(arr => arr.length > 0);
  }
  function openFilters() {
    draftFilters = structuredClone(activeFilters);
    syncFilterUI();
    filterModal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeFiltersDiscard() {
    filterModal.hidden = true;
    document.body.style.overflow = "";
  }
  function applyFilters() {
    activeFilters = structuredClone(draftFilters);
    closeFiltersDiscard();
    $("filterBadge").hidden = !hasFilters(activeFilters);
    closeSheet();
    if (map) renderMarkers();
  }
  function clearDraft() {
    draftFilters = { categories: [], tags: {} };
    syncFilterUI();
  }
  $("sheetClose").addEventListener("click", closeSheet);
  $("groupPrev").addEventListener("click", () => { currentGroupIndex = (currentGroupIndex - 1 + currentGroup.length) % currentGroup.length; showSpot(); });
  $("groupNext").addEventListener("click", () => { currentGroupIndex = (currentGroupIndex + 1) % currentGroup.length; showSpot(); });
  $("filterOpen").addEventListener("click", openFilters);
  $("filterClose").addEventListener("click", closeFiltersDiscard);
  $("clearFilters").addEventListener("click", clearDraft);
  $("applyFilters").addEventListener("click", applyFilters);
  document.addEventListener("keydown", event => { if (event.key === "Escape") filterModal.hidden ? closeSheet() : closeFiltersDiscard(); });

  initFilters();
  initMap();
})();
