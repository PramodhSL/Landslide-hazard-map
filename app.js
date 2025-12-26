let searchMarker; // Declared at top to avoid ReferenceErrors
let controlsPanel;
let searchResults;
let searchInput;
let clearBtn;

// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}


let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Icon Constants
const ICONS = {
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    locate: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
    locating: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`,
    bookmark: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    measure: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"></path><path d="M7 3.34V5a3 3 0 0 0 3 3v0a2 2 0 0 1 2 2v0c0 1.1.9 2 2 2v0a2 2 0 0 0 2-2v0c0-1.1.9-2 2-2h3.17"></path><path d="M11 21.95V18a2 2 0 0 0-2-2v0a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"></path><circle cx="12" cy="12" r="10"></circle></svg>`,
    measureStop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>`,
    view3d: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg>`,
    view2d: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
    install: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌'
};


const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
            }
            // Satellite, hillshade, and hybrid-labels will be loaded on-demand
        },
        layers: [
            {
                id: 'osm',
                type: 'raster',
                source: 'osm',
                layout: { visibility: 'visible' }
            }
            // Other layers loaded on-demand
        ]
    },
    center: [80.7718, 7.8731],
    zoom: 8,
    maxBounds: [
        [79.5, 5.9], // Southwest coordinates (Sri Lanka bounds)
        [82.0, 9.9] // Northeast coordinates
    ],
    minZoom: 7,
    maxZoom: 18,
    hash: true, // Enable URL hash for sharing map position
    attributionControl: true,
    preserveDrawingBuffer: false, // Better performance
    renderWorldCopies: false, // Don't render map copies
    touchZoomRotate: true,
    touchPitch: true, // Enable pitch for 3D view
    dragRotate: true, // Enable rotation
    pitchWithRotate: true
});

// Add Navigation Control (zoom buttons)
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left');

// Add Scale Bar (shows distance in km/m)
map.addControl(new maplibregl.ScaleControl({
    maxWidth: 150,
    unit: 'metric'
}), 'bottom-right');

// Progress bar update function
function updateProgress(percent, status) {
    const progressBar = document.getElementById('progress-bar');
    const loadingStatus = document.getElementById('loading-status');
    if (progressBar) progressBar.style.width = percent + '%';
    if (loadingStatus) loadingStatus.textContent = status;
}

// Simulate loading progress
updateProgress(20, 'Loading base map...');

const hazardColorMatch = [
    "match",
    ["get", "Hazard"],
    "Landslides not likely to occur", "rgb(165, 254, 164)",
    "Modest level of landslide hazard exist", "rgb(254, 244, 141)",
    "Landslide are to be expected", "rgb(254, 172, 0)",
    "Landslide most likely to occur", "rgb(99, 0, 0)",
    "Water Bodies", "rgb(115, 223, 255)",
    "Landslides have been occurred in the Past", "rgb(230, 0, 0)",
    "Inaccessible slopes", "rgb(128, 128, 128)",
    "Subsidence & Rockfall", "rgb(165, 0, 230)",
    "rgb(52, 52, 52)"
];

map.on('load', () => {
    updateProgress(40, 'Loading hazard layers...');

    // Only load 1:50k initially (lighter, faster)
    map.addSource('hazard_50k', {
        type: 'vector',
        url: 'pmtiles://https://pub-ee4ee353c00e4a7dbe74d0b5339e82b0.r2.dev/LHMP_50000.pmtiles',
        attribution: 'NBRO',
        minzoom: 7,
        maxzoom: 24 // Allow overzooming deeply
    });

    updateProgress(60, 'Loading incident data...');

    // 1:10k loaded on-demand (when zoomed in or toggled)

    map.addSource('early_warning', {
        type: 'geojson',
        data: 'early_warning.geojson',
        tolerance: 10, // Increased tolerance to prevent WebGL "Max vertices" crash
        buffer: 0
    });

    map.addSource('satellite_landslides', {
        type: 'vector',
        url: 'pmtiles://satellite_landslides.pmtiles', // Hosted on GitHub Pages (relative path)
        attribution: 'Human Settlement & Planning Division'
    });

    map.addLayer({
        'id': 'hazard_50k_fill',
        'type': 'fill',
        'source': 'hazard_50k',
        'source-layer': 'hazard_50k',
        'paint': {
            'fill-color': hazardColorMatch,
            'fill-opacity': 0.6, // Reduced opacity to let hillshade show through
            'fill-outline-color': 'rgba(0,0,0,0.1)' // Softer outline
        }
    });

    // 1:10k layer - lazy loaded (saves bandwidth on mobile)
    window.hazard10kLoaded = false;
    window.loadHazard10k = function () {
        if (window.hazard10kLoaded) return;
        window.hazard10kLoaded = true; // Set flag immediately to prevent retries

        if (!map.getSource('hazard_10k')) {
            map.addSource('hazard_10k', {
                type: 'vector',
                url: 'pmtiles://https://pub-ee4ee353c00e4a7dbe74d0b5339e82b0.r2.dev/LHZM_10000.pmtiles',
                attribution: 'NBRO',
                minzoom: 12,
                maxzoom: 24
            });

            map.addLayer({
                'id': 'hazard_10k_fill',
                'type': 'fill',
                'source': 'hazard_10k',
                'source-layer': 'hazard_10k',
                'paint': {
                    'fill-color': hazardColorMatch,
                    'fill-opacity': 0.6,
                    'fill-outline-color': 'rgba(0,0,0,0.1)'
                },
                'layout': {
                    'visibility': document.getElementById('layer-10k').checked ? 'visible' : 'none'
                }
            });

            map.on('click', 'hazard_10k_fill', showPopup);
            map.on('mouseenter', 'hazard_10k_fill', () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', 'hazard_10k_fill', () => map.getCanvas().style.cursor = '');
        }
    }

    // Auto-load 1:10k when zoomed in (zoom level 12+)
    map.on('zoom', () => {
        if (map.getZoom() >= 12 && !window.hazard10kLoaded) {
            window.loadHazard10k();
        }
    });

    // Contour Layer Source
    map.addSource('contours', {
        type: 'vector',
        url: 'pmtiles://https://pub-ee4ee353c00e4a7dbe74d0b5339e82b0.r2.dev/Contour_20M.pmtiles',
        attribution: 'NBRO'
    });

    // Contour Layer Style
    map.addLayer({
        'id': 'contours_line',
        'type': 'line',
        'source': 'contours',
        'source-layer': 'Contour_20M',
        'paint': {
            'line-color': '#57534e', // Stone-600
            'line-width': 1,
            'line-opacity': 0.6
        },
        'layout': {
            'visibility': document.getElementById('layer-contours').checked ? 'visible' : 'none'
        }
    });

    // Toggle logic for contours
    document.getElementById('layer-contours').addEventListener('change', (e) => {
        const visibility = e.target.checked ? 'visible' : 'none';
        if (map.getLayer('contours_line')) {
            map.setLayoutProperty('contours_line', 'visibility', visibility);
        }
    });




    map.addLayer({
        'id': 'early_warning_points',
        'type': 'circle',
        'source': 'early_warning',
        'paint': {
            'circle-radius': 6,
            'circle-color': [
                'match',
                ['get', 'status'],
                'recent', '#ec4899', // Pink for recent
                '#22c55e' // Green for old
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        },
        'layout': {
            'visibility': 'visible'
        }
    });

    // Satellite Landslides (Polygons)
    map.addLayer({
        'id': 'satellite_polygons',
        'type': 'line',
        'source': 'satellite_landslides',
        'source-layer': 'satellite_landslides',
        'filter': ['==', ['get', 'type'], 'landslide_polygon'],
        'paint': {
            'line-color': '#f97316', // Orange
            'line-width': 2
        },
        'layout': { 'visibility': 'none' }
    });

    // Satellite Landslides (Points)
    map.addLayer({
        'id': 'satellite_points',
        'type': 'circle',
        'source': 'satellite_landslides',
        'source-layer': 'satellite_landslides',
        'filter': ['==', ['get', 'type'], 'incident_point'],
        'paint': {
            'circle-radius': 5,
            'circle-color': '#f97316', // Orange
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        },
        'layout': { 'visibility': 'none' }
    });

    map.on('click', 'hazard_50k_fill', showPopup);
    map.on('click', 'early_warning_points', showPopup);
    map.on('click', 'satellite_points', showPopup);
    map.on('click', 'satellite_polygons', showPopup);

    map.on('mouseenter', 'hazard_50k_fill', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'hazard_50k_fill', () => map.getCanvas().style.cursor = '');
    map.on('mouseenter', 'early_warning_points', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'early_warning_points', () => map.getCanvas().style.cursor = '');
    map.on('mouseenter', 'satellite_points', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'satellite_points', () => map.getCanvas().style.cursor = '');
    map.on('mouseenter', 'satellite_polygons', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'satellite_polygons', () => map.getCanvas().style.cursor = '');

    // Map loaded - hide loading indicator with smooth transition
    updateProgress(100, 'Map ready!');
    setTimeout(() => {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.classList.remove('active');
    }, 500);
});

// FAILSAFE: Force remove loader after 10 seconds if it gets stuck
setTimeout(() => {
    const loader = document.getElementById('loading-indicator');
    if (loader && loader.classList.contains('active')) {
        console.warn('Loader stuck, forcing removal.');
        loader.classList.remove('active');
        showToast('Network slow, but map is usable.', 'info');
    }
}, 10000);

function showPopup(e) {
    const coordinates = e.lngLat;
    const props = e.features[0].properties;

    let content = '<div class="popup-title">Feature Information</div>';
    content += '<div class="popup-info">';
    for (const key in props) {
        if (props[key] !== null) {
            content += `<b>${key}:</b> ${props[key]}<br>`;
        }
    }
    content += '</div>';

    new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
}

document.getElementById('layer-10k').addEventListener('change', (e) => {
    // Load 1:10k on demand if user toggles it
    if (e.target.checked && !window.hazard10kLoaded) {
        window.loadHazard10k();
    }
    if (window.hazard10kLoaded) {
        map.setLayoutProperty('hazard_10k_fill', 'visibility', e.target.checked ? 'visible' : 'none');
    }

    // Dynamic zoom restriction: 1:10k supports up to zoom 18
    updateMaxZoom();
});

document.getElementById('opacity-10k').addEventListener('input', (e) => {
    const opacity = parseInt(e.target.value) / 100;
    if (map.getLayer('hazard_10k_fill')) {
        map.setPaintProperty('hazard_10k_fill', 'fill-opacity', opacity);
    }
});

document.getElementById('layer-50k').addEventListener('change', (e) => {
    map.setLayoutProperty('hazard_50k_fill', 'visibility', e.target.checked ? 'visible' : 'none');
    // Dynamic zoom restriction: 1:50k supports up to zoom 14
    updateMaxZoom();
});

document.getElementById('opacity-50k').addEventListener('input', (e) => {
    const opacity = parseInt(e.target.value) / 100;
    if (map.getLayer('hazard_50k_fill')) {
        map.setPaintProperty('hazard_50k_fill', 'fill-opacity', opacity);
    }
});

// Update max zoom based on active layers
function updateMaxZoom() {
    const is10kActive = document.getElementById('layer-10k').checked;
    const is50kActive = document.getElementById('layer-50k').checked;

    if (is10kActive) {
        // 1:10k layer is on, allow zoom to 18
        map.setMaxZoom(18);
    } else if (is50kActive) {
        // Only 1:50k layer is on, restrict zoom to 14
        map.setMaxZoom(14);
    } else {
        // No hazard layers, default max zoom
        map.setMaxZoom(18);
    }

    // If current zoom exceeds new max, zoom out
    if (map.getZoom() > map.getMaxZoom()) {
        map.setZoom(map.getMaxZoom());
    }
}

document.getElementById('layer-warning').addEventListener('change', (e) => {
    map.setLayoutProperty('early_warning_points', 'visibility', e.target.checked ? 'visible' : 'none');
});

document.getElementById('layer-satellite-ls').addEventListener('change', (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('satellite_polygons', 'visibility', visibility);
    map.setLayoutProperty('satellite_points', 'visibility', visibility);
});



// Basemap toggle controls with lazy loading
let satelliteLoaded = false;
let hillshadeLoaded = false;
let hybridLabelsLoaded = false;
let roadsLoaded = false;
let buildingsLoaded = false;

function ensureLayersLoaded(layers, callback) {
    let toLoad = [];

    if (layers.includes('satellite') && !satelliteLoaded) {
        toLoad.push({
            source: 'satellite',
            config: {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: 'Tiles &copy; Esri',
                maxzoom: 17 // Clamp zoom to prevent "Map data not available"
            },
            layer: {
                id: 'satellite',
                type: 'raster',
                source: 'satellite',
                layout: { visibility: 'none' }
            }
        });
    }

    if (layers.includes('hillshade') && !hillshadeLoaded) {
        // Original Esri Hillshade (user prefers this)
        toLoad.push({
            source: 'hillshade',
            config: {
                type: 'raster',
                tiles:
                    ['https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: 'Tiles &copy; Esri',
                maxzoom: 14
            },
            layer: {
                id: 'hillshade',
                type: 'raster',
                source: 'hillshade',
                paint: {
                    'raster-opacity': 1.0,
                    'raster-contrast': 0.1
                },
                layout: { visibility: 'none' }
            }
        });
    }

    if (layers.includes('hybrid-labels') && !hybridLabelsLoaded) {
        toLoad.push({
            source: 'hybrid-labels',
            config: {
                type: 'raster',
                tiles:
                    ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: 'Tiles &copy; Esri'
            },
            layer: {
                id: 'hybrid-labels',
                type: 'raster',
                source: 'hybrid-labels',
                layout: { visibility: 'none' }
            }
        });
    }

    if (toLoad.length > 0) {
        toLoad.forEach(item => {
            if (item.source && !map.getSource(item.source)) {
                map.addSource(item.source, item.config);
            }
            if (item.layer) {
                // Dynamic layer placement
                if (item.layer.id === 'hillshade') {
                    map.addLayer(item.layer, 'hazard_50k_fill');
                } else {
                    map.addLayer(item.layer, 'hazard_50k_fill');
                }
            }
        });

        if (layers.includes('satellite')) satelliteLoaded = true;
        if (layers.includes('hillshade')) hillshadeLoaded = true;
        if (layers.includes('hybrid-labels')) hybridLabelsLoaded = true;
    }





    if (callback) callback();
}

// Basemap card click handlers
document.querySelectorAll('.basemap-card').forEach(card => {
    card.addEventListener('click', () => {
        const basemapType = card.dataset.basemap;

        // Update active state visually
        document.querySelectorAll('.basemap-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Switch basemap logic
        if (basemapType === 'osm') {
            map.setLayoutProperty('osm', 'visibility', 'visible');
            if (satelliteLoaded) map.setLayoutProperty('satellite', 'visibility', 'none');
            if (hybridLabelsLoaded) map.setLayoutProperty('hybrid-labels', 'visibility', 'none');
        } else if (basemapType === 'satellite') {
            ensureLayersLoaded(['satellite'], () => {
                map.setLayoutProperty('osm', 'visibility', 'none');
                map.setLayoutProperty('satellite', 'visibility', 'visible');
                if (hybridLabelsLoaded) map.setLayoutProperty('hybrid-labels', 'visibility', 'none');
            });
        } else if (basemapType === 'hybrid') {
            ensureLayersLoaded(['satellite', 'hybrid-labels'], () => {
                map.setLayoutProperty('osm', 'visibility', 'none');
                map.setLayoutProperty('satellite', 'visibility', 'visible');
                map.setLayoutProperty('hybrid-labels', 'visibility', 'visible');
            });
        }
    });
});





document.getElementById('locate-btn').addEventListener('click', () => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        showToast("Geo-Location requires HTTPS.", 'error');
        return;
    }


    if ("geolocation" in navigator) {
        const locateBtn = document.getElementById('locate-btn');
        const loadingIndicator = document.getElementById('loading-indicator');

        // FIX: If already watching, just re-center
        if (window.watchId) {
            if (window.gpsMarker) {
                map.flyTo({ center: window.gpsMarker.getLngLat(), zoom: 17 });
                // Visual feedback
                locateBtn.classList.add('active'); // Ensure active
                setTimeout(() => locateBtn.classList.remove('active'), 200); // Blink effect
                setTimeout(() => locateBtn.classList.add('active'), 400);
            } else {
                showToast("Signal weak. Still locating...", 'info');
            }
            return; // Don't stop, just return
        }

        // loadingIndicator.classList.add('active'); // REMOVED: Blocking loader is bad UX for GPS
        showToast("Acquiring GPS...", 'info');
        locateBtn.classList.add('active');
        locateBtn.innerHTML = ICONS.locating + '<span class="fab-tooltip">Locating...</span>';

        let startTime = Date.now();
        const TIMEOUT_MS = 60000; // Increase to 60s for better persistence

        // Clear any existing markers
        if (searchMarker) { searchMarker.remove(); searchMarker = null; }
        if (window.gpsMarker) { window.gpsMarker.remove(); }

        window.stopLocationWatch = function () {
            if (window.watchId !== null) {
                navigator.geolocation.clearWatch(window.watchId);
                window.watchId = null;
            }
            loadingIndicator.classList.remove('active');
            locateBtn.classList.remove('active');
            locateBtn.innerHTML = ICONS.locate + '<span class="fab-tooltip">Find Location</span>';
        }

        window.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                // Create/Update marker
                if (window.gpsMarker) {
                    window.gpsMarker.setLngLat([lng, lat]);
                    window.gpsMarker.getPopup().setHTML(
                        `<div class="popup-title">📍 Your Location</div>
    <div class="popup-info">
        <b>Latitude:</b> ${lat.toFixed(6)}<br>
        <b>Longitude:</b> ${lng.toFixed(6)}<br>
        <b>Accuracy:</b> ±${Math.round(accuracy)}m
    </div>`
                    );
                } else {
                    window.gpsMarker = new maplibregl.Marker({ color: '#8b5cf6' })
                        .setLngLat([lng, lat])
                        .setPopup(new maplibregl.Popup().setHTML(
                            `<div class="popup-title">📍 Your Location</div>
    <div class="popup-info">
        <b>Latitude:</b> ${lat.toFixed(6)}<br>
        <b>Longitude:</b> ${lng.toFixed(6)}<br>
        <b>Accuracy:</b> ±${Math.round(accuracy)}m
    </div>`
                        ))
                        .addTo(map)
                        .togglePopup();

                    // Fly to location on first fix
                    map.flyTo({ center: [lng, lat], zoom: 16 });
                }

                // Remove auto-stop on accuracy to keep usage continuous if user desires
                // if (accuracy <= 5 || (Date.now() - startTime) > TIMEOUT_MS) {
                //     stopLocationWatch();
                // }
                // Check timeout only? Or let it run?
                // Let's stop only on timeout to save battery eventually
                if ((Date.now() - startTime) > TIMEOUT_MS) {
                    window.stopLocationWatch();
                    // Notify user it timed out/stopped to save battery
                    showToast("GPS tracking stopped to save battery.", 'info');
                }
            },
            (error) => {
                console.error("GPS Error:", error);
                // Only alert on fatal errors, ignore timeout of cached pos
                if (Date.now() - startTime > TIMEOUT_MS) {
                    window.stopLocationWatch();
                    showToast("Location check timed out. Please check GPS reception.", 'error');
                }
            },
            { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 }
        );

        // Safety timeout just in case
        setTimeout(() => {
            if (window.watchId !== null) window.stopLocationWatch();
        }, TIMEOUT_MS + 1000);

    } else {
        showToast('Geolocation is not supported by your browser', 'error');
    }
});

// Search functionality using Nominatim API
searchInput = document.getElementById('search-input');
searchResults = document.getElementById('search-results');
clearBtn = document.getElementById('clear-search');
let searchTimeout;

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (query.length > 0) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
        searchResults.style.display = 'none';
        return;
    }

    clearTimeout(searchTimeout);

    // Don't auto-search until user has typed enough (10 chars for GPS coords like "7.123 80.456")
    if (query.length < 10) return;

    // Auto-search after 800ms of no typing (debounce)
    searchTimeout = setTimeout(() => {
        searchLocation(query);
    }, 800);
});

// Allow immediate search when pressing Enter
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimeout); // Cancel any pending auto-search
        const query = searchInput.value.trim();
        if (query.length >= 1) {
            searchLocation(query);
        }
    }
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchResults.style.display = 'none';
    if (searchMarker) {
        searchMarker.remove();
    }
});

async function searchLocation(query) {
    // Visual feedback
    searchResults.style.display = 'block';
    searchResults.innerHTML = '<div class="no-results" style="color:#8b5cf6;">Searching...</div>';

    // Check if query is GPS coordinates (e.g., "7.456789 80.456789" or "7.456789, 80.456789")
    // Format: Latitude first, Longitude second (like Google Earth)
    const coordPattern = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const match = query.trim().match(coordPattern);

    if (match) {
        // User entered coordinates - parse as LAT, LON (Google Earth order)
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);

        // Validate coordinates are within Sri Lanka bounds (roughly)
        if (lon >= 79.5 && lon <= 82.0 && lat >= 5.9 && lat <= 9.9) {
            // Valid Sri Lanka coordinates
            searchResults.style.display = 'none';

            map.flyTo({
                center: [lon, lat],
                zoom: 14,
                duration: 1500
            });

            if (searchMarker) {
                searchMarker.remove();
            }

            searchMarker = new maplibregl.Marker({ color: '#06b6d4' })
                .setLngLat([lon, lat])
                .setPopup(
                    new maplibregl.Popup().setHTML(
                        `<div class="popup-title">GPS Location</div>
                                <div class="popup-info"><b>Latitude:</b> ${lat.toFixed(6)}<br><b>Longitude:</b> ${lon.toFixed(6)}</div>`
                    )
                )
                .addTo(map)
                .togglePopup();

            // Keep user's format: Lat, Lon
            // REMOVED: searchInput.value reformatting to prevent overwriting user input while typing
            // searchInput.value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            return;
        } else {
            // Coordinates outside Sri Lanka
            searchResults.innerHTML = '<div class="no-results" style="color:#f59e0b;">⚠️ Coordinates are outside Sri Lanka bounds</div>';
            return;
        }
    }

    // Otherwise, search by name using Nominatim API
    try {
        // Use browser cache to reduce API calls
        const cacheKey = `geocode_${query}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
            const data = JSON.parse(cached);
            displayResults(data);
            return;
        }

        // Add User-Agent header (recommended by Nominatim)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Sri Lanka')}&limit=5&countrycodes=lk`,
            { headers: { 'Accept-Language': 'en' } }
        );

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        // Cache the results
        if (data && data.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            displayResults(data);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `<div class="no-results" style="color:#ef4444;">Error: ${error.message}. Check network.</div>`;
        searchResults.style.display = 'block';
    }
}

function displayResults(results) {
    searchResults.innerHTML = '';
    searchResults.style.display = 'block';

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';

        const title = document.createElement('div');
        title.className = 'result-title';
        title.textContent = result.display_name.split(',')[0];

        const subtitle = document.createElement('div');
        subtitle.className = 'result-subtitle';
        subtitle.textContent = result.display_name.split(',').slice(1).join(',').trim();

        item.appendChild(title);
        item.appendChild(subtitle);

        item.addEventListener('click', () => {
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);

            if (isNaN(lat) || isNaN(lon)) {
                showToast("Error: Could not parse location coordinates.", 'error');
                return;
            }

            map.flyTo({
                center: [lon, lat],
                zoom: 12, // Reduced from 14 to avoid crashing WebGL with heavy 10k tiles
                duration: 1500
            });

            if (searchMarker) {
                searchMarker.remove();
            }

            searchMarker = new maplibregl.Marker({ color: '#06b6d4' })
                .setLngLat([lon, lat])
                .setPopup(
                    new maplibregl.Popup().setHTML(
                        `<div class="popup-title">${result.display_name.split(',')[0]}</div>
                    <div class="popup-info">${subtitle.textContent}</div>`
                    )
                )
                .addTo(map)
                .togglePopup();

            searchResults.style.display = 'none';
            searchInput.value = result.display_name.split(',')[0];
        });

        searchResults.appendChild(item);
    });
}

function showNoResults() {
    searchResults.innerHTML = '<div class="no-results">No results found in Sri Lanka</div>';
    searchResults.style.display = 'block';
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        searchResults.style.display = 'none';
    }
});

// Legend toggle functionality
const legendToggle = document.getElementById('legend-toggle');
const legend = document.querySelector('.legend');

legendToggle.addEventListener('click', () => {
    legend.classList.toggle('collapsed');

    // Save preference to localStorage
    if (legend.classList.contains('collapsed')) {
        localStorage.setItem('legendCollapsed', 'true');
    } else {
        localStorage.setItem('legendCollapsed', 'false');
    }
});

// Restore legend state on page load
window.addEventListener('load', () => {
    const isLegendCollapsed = localStorage.getItem('legendCollapsed') === 'true';
    // Default to collapsed on mobile if no preference is saved
    const isMobile = window.innerWidth <= 768;

    if (isLegendCollapsed || (isMobile && localStorage.getItem('legendCollapsed') === null)) {
        legend.classList.add('collapsed');
    }

    const isControlsCollapsed = localStorage.getItem('controlsCollapsed') === 'true';
    if (isControlsCollapsed) {
        controlsPanel.classList.add('collapsed');
    }
});

// Controls toggle functionality
const controlsToggle = document.getElementById('controls-toggle');
controlsPanel = document.querySelector('.controls-panel');

controlsToggle.addEventListener('click', () => {
    controlsPanel.classList.toggle('collapsed');

    // Save preference to localStorage
    if (controlsPanel.classList.contains('collapsed')) {
        localStorage.setItem('controlsCollapsed', 'true');
    } else {
        localStorage.setItem('controlsCollapsed', 'false');
    }
});


// PWA Installation Logic
let deferredPrompt;
const installBtn = document.createElement('button');
installBtn.className = 'fab-btn';
installBtn.id = 'install-btn';
installBtn.style.display = 'none'; // Hidden by default
installBtn.style.background = 'linear-gradient(135deg, #0f172a, #334155)';
installBtn.innerHTML = ICONS.install + '<span class="fab-tooltip">Install App</span>';

// Append to FAB container
document.querySelector('.fab-container').appendChild(installBtn);

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    installBtn.style.display = 'flex';
});

installBtn.addEventListener('click', (e) => {
    // Hide our user interface that shows our A2HS button
    installBtn.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
    });
});

// Register Service Worker
// Accordion Functionality
document.querySelectorAll('.layer-header').forEach(header => {
    header.addEventListener('click', () => {
        const section = header.parentElement;

        // Toggle active class
        section.classList.toggle('active');
    });
});

// 3D View Toggle
let is3DMode = false;
const view3dBtn = document.getElementById('view3d-btn');

view3dBtn.addEventListener('click', () => {
    is3DMode = !is3DMode;

    if (is3DMode) {
        // Zoom out first if too zoomed in (prevents WebGL crash)
        const safeZoom = Math.min(map.getZoom(), 14);

        // Switch to 3D view with hillshade
        map.easeTo({
            pitch: 60,
            bearing: map.getBearing() || 0,
            zoom: safeZoom,
            duration: 1000
        });
        view3dBtn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
        view3dBtn.innerHTML = ICONS.view2d + '<span class="fab-tooltip">2D View</span>';

        // Auto-enable hillshade for better 3D effect
        ensureLayersLoaded(['hillshade'], () => {
            map.setLayoutProperty('hillshade', 'visibility', 'visible');
        });
    } else {
        // Switch to 2D view
        map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
        });
        view3dBtn.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
        view3dBtn.innerHTML = ICONS.view3d + '<span class="fab-tooltip">3D Terrain View</span>';

        // Disable hillshade
        if (hillshadeLoaded) {
            map.setLayoutProperty('hillshade', 'visibility', 'none');
        }
    }
});

// Measurement Tool Logic
let isMeasuring = false;
let measurePoints = [];
let measureMarkers = [];
const measureBtn = document.getElementById('measure-btn');
const measureResult = document.getElementById('measure-result');
const distanceValue = document.getElementById('distance-value');
const clearMeasureBtn = document.getElementById('clear-measure');

// Haversine formula for distance (km)
function getDistance(coord1, coord2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(coord2.lat - coord1.lat);
    const dLon = deg2rad(coord2.lng - coord1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

measureBtn.addEventListener('click', () => {
    isMeasuring = !isMeasuring;
    if (isMeasuring) {
        // measureBtn.textContent = '🛑 Stop Measuring'; // Removed text change, adding active class instead
        measureBtn.classList.add('active');
        measureBtn.innerHTML = ICONS.measureStop + '<span class="fab-tooltip">Stop Measuring</span>';
        measureBtn.style.background = 'linear-gradient(135deg, #ef4444, #f59e0b)';
        map.getCanvas().style.cursor = 'crosshair';
        measureResult.style.display = 'block';
    } else {
        stopMeasuring();
    }
});

function stopMeasuring() {
    isMeasuring = false;
    measureBtn.classList.remove('active');
    measureBtn.innerHTML = ICONS.measure + '<span class="fab-tooltip">Measure Distance</span>';
    measureBtn.style.background = 'linear-gradient(135deg, #10b981, #0ea5e9)';
    map.getCanvas().style.cursor = '';
}

clearMeasureBtn.addEventListener('click', clearMeasurement);

function clearMeasurement() {
    measurePoints = [];
    measureMarkers.forEach(marker => marker.remove());
    measureMarkers = [];
    distanceValue.textContent = '0.00';
    // Hide the distance result box
    measureResult.style.display = 'none';
    if (map.getSource('measure-line')) {
        map.getSource('measure-line').setData({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: []
            }
        });
    }
    // Also stop measuring mode
    stopMeasuring();
}

map.on('click', (e) => {
    if (!isMeasuring) return;

    const point = e.lngLat;
    measurePoints.push(point);

    // Add marker
    const marker = new maplibregl.Marker({ color: '#10b981', scale: 0.8 })
        .setLngLat(point)
        .addTo(map);
    measureMarkers.push(marker);

    // Update line
    const coordinates = measurePoints.map(p => [p.lng, p.lat]);

    if (!map.getSource('measure-line')) {
        map.addSource('measure-line', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                }
            }
        });
        map.addLayer({
            id: 'measure-line',
            type: 'line',
            source: 'measure-line',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': '#10b981',
                'line-width': 3,
                'line-dasharray': [2, 2]
            }
        });
    } else {
        map.getSource('measure-line').setData({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        });
    }

    // Calculate total distance
    if (measurePoints.length > 1) {
        let totalDist = 0;
        for (let i = 0; i < measurePoints.length - 1; i++) {
            totalDist += getDistance(measurePoints[i],
                measurePoints[i + 1]);
        } distanceValue.textContent = totalDist.toFixed(2);
    }
});



// =============================================
// GPS BOOKMARKS FUNCTIONALITY
// =============================================
const bookmarkBtn = document.getElementById('bookmark-btn');
const bookmarksPanel = document.getElementById('bookmarks-panel');
const bookmarksList = document.getElementById('bookmarks-list');
const closeBookmarksBtn = document.getElementById('close-bookmarks');
const saveLocationBtn = document.getElementById('save-current-location');

function getBookmarks() {
    const stored = localStorage.getItem('mapBookmarks');
    return stored ? JSON.parse(stored) : [];
}

function saveBookmarks(bookmarks) {
    localStorage.setItem('mapBookmarks', JSON.stringify(bookmarks));
}

// Global markers array
window.bookmarkMarkers = window.bookmarkMarkers || [];

function updateBookmarkMarkers() {
    // Clear existing
    window.bookmarkMarkers.forEach(m => m.remove());
    window.bookmarkMarkers = [];

    const bookmarks = getBookmarks();
    bookmarks.forEach(b => {
        const el = document.createElement('div');
        el.innerHTML = '<div style="color:#f59e0b; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)); cursor:pointer;">' + ICONS.bookmark + '</div>';
        el.addEventListener('click', () => {
            map.flyTo({ center: [b.lon, b.lat], zoom: 16 });
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([b.lon, b.lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>${b.name}</b>`))
            .addTo(map);

        window.bookmarkMarkers.push(marker);
    });
}

function renderBookmarks() {
    updateBookmarkMarkers(); // Sync map markers
    const bookmarks = getBookmarks();
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:20px; font-size:0.85rem;">No saved locations yet</div>';
        return;
    }
    bookmarksList.innerHTML = bookmarks.map((b, i) =>
        '<div style=\"flex:1; display:flex; align-items:center; gap:8px;\" onclick=\"flyToBookmark(' + i + ')\">' +
        '<div style=\"color:#f59e0b;\">' + ICONS.bookmark + '</div>' +
        '<div><div style=\"color:#e2e8f0; font-size:0.85rem; font-weight:500;\">' + b.name + '</div>' +
        '<div style=\"color:#94a3b8; font-size:0.7rem;\">' + b.lat.toFixed(5) + ', ' + b.lon.toFixed(5) + '</div></div></div>' +
        '<button onclick=\"deleteBookmark(' + i + ')\" style=\"background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;\">' + ICONS.trash + '</button></div>'
    ).join('');
}

window.flyToBookmark = function (index) {
    const bookmarks = getBookmarks();
    const b = bookmarks[index];
    if (b) { map.flyTo({ center: [b.lon, b.lat], zoom: 14, duration: 1500 }); bookmarksPanel.style.display = 'none'; }
};

window.deleteBookmark = function (index) {
    const bookmarks = getBookmarks();
    bookmarks.splice(index, 1);
    saveBookmarks(bookmarks);
    renderBookmarks();
};

bookmarkBtn.addEventListener('click', () => {
    if (bookmarksPanel.style.display === 'none') { renderBookmarks(); bookmarksPanel.style.display = 'block'; }
    else { bookmarksPanel.style.display = 'none'; }
});

closeBookmarksBtn.addEventListener('click', () => { bookmarksPanel.style.display = 'none'; });

saveLocationBtn.addEventListener('click', () => {
    const center = map.getCenter();
    const name = prompt('Enter a name for this location:', 'Location ' + (getBookmarks().length + 1));
    if (name) {
        const bookmarks = getBookmarks();
        bookmarks.push({ name: name, lat: center.lat, lon: center.lng, zoom: map.getZoom(), timestamp: Date.now() });
        saveBookmarks(bookmarks);
        renderBookmarks();
        showToast('Location saved!', 'success');
    }
});
// =============================================
// COMPASS FUNCTIONALITY  
// =============================================
const compassIndicator = document.getElementById('compass-indicator');
const compassNeedle = document.getElementById('compass-needle');

map.on('rotate', () => { compassNeedle.style.transform = 'rotate(' + (-map.getBearing()) + 'deg)'; });
compassIndicator.addEventListener('click', () => { map.easeTo({ bearing: 0, pitch: 0, duration: 500 }); });
map.on('pitchend', () => { compassIndicator.style.display = map.getPitch() > 0 ? 'block' : 'none'; });

// Check if service worker is supported
if ('serviceWorker' in navigator) {
    // Register service worker
    navigator.serviceWorker.register('./sw.js')
        .then(registration => {
            console.log('ServiceWorker registration successful');
        })
        .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });

    // Refresh page when new service worker takes control
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });
}

