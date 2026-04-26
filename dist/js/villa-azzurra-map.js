/* ============================================================
   Villa Azzurra — Interactive Cap de Formentor map
   Leaflet 1.9.4 + CARTO Voyager tiles, custom olive markers,
   photo popups on click.
   ============================================================ */

(function () {
  'use strict';

  if (!window.L) return;
  const container = document.getElementById('capMap');
  if (!container) return;

  // ----------------------------------------------------------
  // POINTS OF INTEREST
  // Coordinates are approximate but correct to within ~100m
  // for a visual peninsula map. Adjust Villa Azzurra to the
  // exact parcel once the owner confirms.
  // ----------------------------------------------------------
  const VILLA_PHOTO = 'https://www.mallorcacollection.com/images/rooms/349/luxury-holiday-villa-mallorca-collection-formentor-villa-azure-oasis-251211-32.jpg';
  const POOL_PHOTO  = 'https://www.mallorcacollection.com/images/rooms/349/luxury-holiday-villa-mallorca-collection-formentor-villa-azure-oasis-251211-33.jpg';

  const pois = [
    {
      id: 'villa',
      name: 'Villa Azzurra',
      lat: 39.9305,
      lng: 3.1340,
      kind: 'Residence',
      distance: '',
      blurb: 'Four bedrooms, sixteen metre infinity pool, single level contemporary villa set within the Mediterranean pines.',
      photo: VILLA_PHOTO,
      featured: true,
    },
    {
      id: 'fs',
      name: 'Four Seasons Resort Mallorca at Formentor',
      lat: 39.9296,
      lng: 3.1316,
      kind: 'Hotel',
      distance: '300 metres · 4 minute walk',
      blurb: 'The 1929 grande dame reopened in 2024. Number twenty four on the World&rsquo;s 50 Best Hotels. Forbes Five Star 2026.',
      photo: null,
    },
    {
      id: 'beach',
      name: 'Platja de Formentor',
      lat: 39.9297,
      lng: 3.1363,
      kind: 'Beach',
      distance: '150 metres · 2 minute walk',
      blurb: 'Blue flag bay on the protected northern coast. Powder sand, pine shade, sheltered water.',
      photo: null,
    },
    {
      id: 'lighthouse',
      name: 'Cap de Formentor Lighthouse',
      lat: 39.9571,
      lng: 3.2127,
      kind: 'Landmark',
      distance: '25 minute drive',
      blurb: 'The end of the island. A coastal road that Sunday Times Travel called the finest drive in the Mediterranean.',
      photo: null,
    },
    {
      id: 'port',
      name: 'Port de Pollen\u00e7a',
      lat: 39.9059,
      lng: 3.0871,
      kind: 'Town',
      distance: '20 minute drive',
      blurb: 'Working marina, Michelin starred Terrae, and the starting line for the island&rsquo;s most photographed cycling climb.',
      photo: null,
    },
    {
      id: 'pollensa',
      name: 'Pollen\u00e7a Old Town',
      lat: 39.8746,
      lng: 3.0178,
      kind: 'Town',
      distance: '30 minute drive',
      blurb: 'Calvary Steps, the Sunday market, and a dozen cafes on the Placa Major.',
      photo: null,
    },
  ];

  // ----------------------------------------------------------
  // MAP INIT
  // ----------------------------------------------------------
  const map = L.map(container, {
    zoomControl: true,
    scrollWheelZoom: false,   // don't trap page scroll
    doubleClickZoom: true,
    dragging: true,
    tap: true,
    attributionControl: true,
    minZoom: 10,
    maxZoom: 16,
  });

  // Set reasonable default view, then fit bounds
  map.setView([39.9280, 3.1150], 12);

  // CARTO Voyager NoLabels — muted cream/beige base, we add our own labels
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '\u00a9 OpenStreetMap contributors, \u00a9 CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
    className: 'villa-tiles',
  }).addTo(map);

  // Fit to the full cluster including Pollenca Old Town
  const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });

  // ----------------------------------------------------------
  // CUSTOM MARKERS
  // ----------------------------------------------------------
  function makeIcon(poi) {
    const featuredClass = poi.featured ? ' poi--featured' : '';
    const size = poi.featured ? 28 : 20;
    const html = `
      <div class="poi${featuredClass}" data-poi="${poi.id}">
        <span class="poi__dot"></span>
        <span class="poi__label">${poi.name}</span>
      </div>
    `;
    return L.divIcon({
      className: 'poi-icon',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function makePopup(poi) {
    const photoBlock = poi.photo
      ? `<div class="poi-pop__photo" style="background-image:url('${poi.photo}')" aria-hidden="true"></div>`
      : `<div class="poi-pop__photo poi-pop__photo--mono" aria-hidden="true">
           <span class="poi-pop__mono-label">${poi.kind}</span>
         </div>`;
    const distanceBlock = poi.distance
      ? `<p class="poi-pop__distance">${poi.distance}</p>`
      : '';
    return `
      <div class="poi-pop">
        ${photoBlock}
        <div class="poi-pop__body">
          <p class="poi-pop__kind">${poi.kind}</p>
          <h3 class="poi-pop__name">${poi.name}</h3>
          ${distanceBlock}
          <p class="poi-pop__blurb">${poi.blurb}</p>
        </div>
      </div>
    `;
  }

  const markers = {};
  pois.forEach((poi) => {
    const marker = L.marker([poi.lat, poi.lng], {
      icon: makeIcon(poi),
      title: poi.name,
      alt: poi.name,
      riseOnHover: true,
      keyboard: true,
    }).addTo(map);

    marker.bindPopup(makePopup(poi), {
      className: 'poi-popup',
      closeButton: true,
      autoPan: true,
      autoPanPadding: [40, 40],
      maxWidth: 320,
      minWidth: 240,
    });

    marker.on('click', () => {
      map.flyTo([poi.lat, poi.lng], Math.max(map.getZoom(), 13), {
        duration: 0.9,
        easeLinearity: 0.4,
      });
    });

    markers[poi.id] = marker;
  });

  // Open Villa Azzurra popup by default after first render
  setTimeout(() => {
    if (markers.villa) markers.villa.openPopup();
  }, 600);

  // ----------------------------------------------------------
  // RESIZE HANDLING
  // Some browsers need invalidateSize after the section reveals.
  // ----------------------------------------------------------
  window.addEventListener('load', () => {
    setTimeout(() => map.invalidateSize(), 200);
  });

  // Expose a small API in case we want programmatic control later
  window.CapMap = {
    map: map,
    markers: markers,
    flyTo: (id) => {
      const poi = pois.find((p) => p.id === id);
      if (!poi) return;
      map.flyTo([poi.lat, poi.lng], 14, { duration: 0.9 });
      if (markers[id]) markers[id].openPopup();
    },
  };
})();
