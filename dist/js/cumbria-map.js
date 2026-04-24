/* ============================================================
   ProLuxe Travel — Cumbria interactive journey map
   Leaflet 1.9.4 + CARTO Voyager NoLabels tiles.
   Modelled exactly on villa-azzurra/dist/js/map.js.
   ============================================================ */

(function () {
  'use strict';

  if (!window.L) return;
  var mapEl = document.getElementById('cumbriaMap');
  if (!mapEl) return;

  /* ----------------------------------------------------------
     POINTS OF INTEREST
     GPS coordinates are correct to within ~150m. The two
     Windermere properties (Linthwaite and Gilpin) are plotted
     at their actual postcodes: LA23 3JA and LA23 3NE.
     High Newton (Heft) is plotted at the village centre;
     the pub sits just north of it.
  ---------------------------------------------------------- */
  var POIs = [
    /* ---- The ten featured properties ---- */
    {
      id: 'askham',
      name: 'Askham Hall',
      kind: 'Penrith · Country house',
      lat: 54.6339,
      lng: -2.7739,
      featured: true,
      photo: 'img/cumbria/waypoint-01-askham.jpg',
      distance: 'Ullswater valley',
      blurb: 'Lowther estate, kitchen garden on the doorstep. Allium holds one Michelin star.'
    },
    {
      id: 'forestside',
      name: 'Forest Side',
      kind: 'Grasmere · Country house',
      lat: 54.4573,
      lng: -3.0260,
      featured: true,
      labelPos: 'left',
      photo: 'img/cumbria/waypoint-02-grasmere.jpg',
      distance: 'Edge of Grasmere',
      blurb: 'Victorian gothic house above Grasmere. One Michelin star. Tasting menus built from what is in season on the land outside.'
    },
    {
      id: 'linthwaite',
      name: 'Linthwaite House',
      kind: 'Windermere · Country house',
      lat: 54.3517,
      lng: -2.9307,
      featured: true,
      labelPos: 'left',
      photo: 'img/cumbria/waypoint-03-windermere.jpg',
      distance: 'Above Windermere',
      blurb: 'Directly above the lake. Henrock holds one Michelin star. Simon Rogan.'
    },
    {
      id: 'gilpin',
      name: 'Gilpin Hotel & Lake House',
      kind: 'Windermere · Country house',
      lat: 54.3467,
      lng: -2.8791,
      featured: true,
      labelPos: 'right',
      photo: 'img/cumbria/waypoint-03-windermere.jpg',
      distance: 'Windermere valley',
      blurb: 'Cedar spa suites, SOURCE holds one Michelin star. Takes a larger group without losing the feel of the house.'
    },
    {
      id: 'heft',
      name: 'Heft',
      kind: 'High Newton · Village inn',
      lat: 54.2361,
      lng: -2.9092,
      featured: true,
      photo: 'img/cumbria/waypoint-04-coniston.jpg',
      distance: 'Southern Lakes',
      blurb: 'Kevin Tickle\'s fell-side kitchen. One Michelin star. Daily-changing tasting menu.'
    },
    {
      id: 'lenclume',
      name: 'L\'Enclume',
      kind: 'Cartmel · Restaurant with rooms',
      lat: 54.2004,
      lng: -2.9495,
      featured: true,
      labelPos: 'bottom',
      photo: 'img/cumbria/waypoint-05-cartmel.jpg',
      distance: 'Cartmel village',
      blurb: 'Simon Rogan\'s three-star flagship, inside a twelfth-century smithy. The evening a Cumbrian week builds towards.'
    },
    {
      id: 'samling',
      name: 'The Samling',
      kind: 'Ambleside · Country house',
      lat: 54.4064,
      lng: -2.9326,
      featured: true,
      labelPos: 'right',
      photo: 'img/cumbria/property-07-samling.jpg',
      distance: 'Above Windermere',
      blurb: 'Fifteen quiet acres above Windermere. Grand rooms, long views, the drive up feels like leaving the century behind.'
    },
    {
      id: 'holbeckghyll',
      name: 'Holbeck Ghyll',
      kind: 'Windermere · Country house',
      lat: 54.4093,
      lng: -2.9196,
      featured: true,
      labelPos: 'top',
      photo: 'img/cumbria/property-09-holbeck-ghyll.jpg',
      distance: 'Above Windermere',
      blurb: 'Former hunting lodge with views to the Langdale Pikes. Oak-panelled rooms, two AA Rosettes, a serious wine list.'
    },
    {
      id: 'armathwaite',
      name: 'Armathwaite Hall',
      kind: 'Bassenthwaite · Country house',
      lat: 54.6582,
      lng: -3.2245,
      featured: true,
      labelPos: 'right',
      photo: 'img/cumbria/property-10-armathwaite-hall.jpg',
      distance: 'Bassenthwaite Lake',
      blurb: 'Seventeenth-century manor on Bassenthwaite Lake. 400 acres, full spa, stables. Handles larger groups without feeling processed.'
    },
    {
      id: 'langdalechase',
      name: 'Langdale Chase',
      kind: 'Windermere · Country house',
      lat: 54.3810,
      lng: -2.9310,
      featured: true,
      labelPos: 'left',
      photo: 'img/cumbria/waypoint-03-windermere.jpg',
      distance: 'Eastern shore, Windermere',
      blurb: 'Grade II listed manor on the eastern shore of Windermere, reopened 2023 after a full restoration. Two AA Rosettes, Small Luxury Hotels of the World.'
    },
    {
      id: 'storrshall',
      name: 'Storrs Hall',
      kind: 'Windermere · Country house',
      lat: 54.3462,
      lng: -2.9300,
      featured: true,
      labelPos: 'bottom',
      photo: 'img/cumbria/waypoint-03-windermere.jpg',
      distance: 'South Windermere',
      blurb: 'Grade II* Georgian mansion on its own promontory into Windermere. Adults-only, 30 rooms, landscaped gardens running to the lake.'
    },
    {
      id: 'lodorefalls',
      name: 'Lodore Falls',
      kind: 'Borrowdale · Country house',
      lat: 54.5637,
      lng: -3.1438,
      featured: true,
      labelPos: 'right',
      photo: 'img/cumbria/property-10-armathwaite-hall.jpg',
      distance: 'Derwentwater, south of Keswick',
      blurb: 'On the southern shore of Derwentwater, with the falls rising directly behind the hotel. Spa, lake-facing rooms, and the Borrowdale valley on the doorstep.'
    },
    {
      id: 'cottageinthewood',
      name: 'The Cottage in the Wood',
      kind: 'Whinlatter Forest · Restaurant with rooms',
      lat: 54.6128,
      lng: -3.2226,
      featured: true,
      labelPos: 'left',
      photo: 'img/cumbria/property-10-armathwaite-hall.jpg',
      distance: 'Whinlatter Forest',
      blurb: 'One Michelin star in the middle of Whinlatter Forest. Jack and Beth Bond took the reins in 2024. Set deep enough that the week feels properly away.'
    }
  ];

  /* ----------------------------------------------------------
     MAP INIT
     Fit bounds on ALL POIs so every pin (journey + context)
     is visible on arrival. Generous padding keeps the pins
     comfortably inside the frame.
  ---------------------------------------------------------- */
  var bounds = L.latLngBounds(POIs.map(function (p) { return [p.lat, p.lng]; }));

  var map = L.map(mapEl, {
    scrollWheelZoom: false,
    zoomControl: true,
    doubleClickZoom: true,
    dragging: true,
    tap: true,
    attributionControl: true,
    minZoom: 9,
    maxZoom: 16
  }).fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });

  /* CARTO Voyager NoLabels: muted cream/beige base, we provide our own labels */
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '\u00a9 OpenStreetMap contributors, \u00a9 CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
    className: 'cumbria-tiles'
  }).addTo(map);

  /* ----------------------------------------------------------
     CUSTOM MARKERS
  ---------------------------------------------------------- */
  function makeIcon(poi) {
    var featuredClass = poi.featured ? ' poi--featured' : '';
    var labelClass = poi.labelPos ? ' poi--label-' + poi.labelPos : '';
    var size = poi.featured ? 44 : 26;
    var html = '<div class="poi' + featuredClass + labelClass + '" data-poi="' + poi.id + '">' +
               '<span class="poi__dot"></span>' +
               '<span class="poi__label">' + poi.name + '</span>' +
               '</div>';
    return L.divIcon({
      className: 'poi-icon',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  function makePopup(poi) {
    if (!poi.featured) return null;
    var photoBlock = poi.photo
      ? '<div class="poi-pop__photo" style="background-image:url(\'' + poi.photo + '\')" aria-hidden="true"></div>'
      : '';
    var distBlock = poi.distance
      ? '<p class="poi-pop__distance">' + poi.distance + '</p>'
      : '';
    var blurbBlock = poi.blurb
      ? '<p class="poi-pop__blurb">' + poi.blurb + '</p>'
      : '';
    return '<div class="poi-pop">' +
             photoBlock +
             '<div class="poi-pop__body">' +
               '<p class="poi-pop__kind">' + poi.kind + '</p>' +
               '<h3 class="poi-pop__name">' + poi.name + '</h3>' +
               distBlock +
               blurbBlock +
             '</div>' +
           '</div>';
  }

  /* ----------------------------------------------------------
     PLACE MARKERS
  ---------------------------------------------------------- */
  var markers = {};

  POIs.forEach(function (poi) {
    var marker = L.marker([poi.lat, poi.lng], {
      icon: makeIcon(poi),
      title: poi.name,
      alt: poi.name,
      riseOnHover: true,
      keyboard: true
    }).addTo(map);

    var popup = makePopup(poi);
    if (popup) {
      marker.bindPopup(popup, {
        className: 'cumbria-popup',
        closeButton: true,
        autoPan: true,
        autoPanPadding: [40, 40],
        maxWidth: 280,
        minWidth: 220
      });
    }

    marker.on('click', function () {
      map.flyTo([poi.lat, poi.lng], Math.max(map.getZoom(), 11), {
        duration: 0.9,
        easeLinearity: 0.4
      });
    });

    markers[poi.id] = marker;
  });

  /* ----------------------------------------------------------
     RESIZE HANDLING
     Invalidate after section reveals settle, and re-fit bounds
     so the map stays centred on all pins after layout.
  ---------------------------------------------------------- */
  window.addEventListener('load', function () {
    setTimeout(function () {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10, animate: false });
    }, 200);
  });

  /* ----------------------------------------------------------
     PUBLIC API
  ---------------------------------------------------------- */
  window.CumbriaMap = {
    map: map,
    markers: markers,
    flyTo: function (id) {
      var m = markers[id];
      if (!m) return;
      var ll = m.getLatLng();
      map.flyTo([ll.lat, ll.lng], Math.max(map.getZoom(), 12), { duration: 0.9 });
      m.openPopup();
    }
  };
})();
