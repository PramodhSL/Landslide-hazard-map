let searchMarker; // Declared at top to avoid ReferenceErrors
let controlsPanel;
let searchResults;
let searchInput;
let clearBtn;

// All data is fetched directly from the Cloudflare R2 bucket.
const DATA_BASE_URL = 'https://pub-ee4ee353c00e4a7dbe74d0b5339e82b0.r2.dev';

// Local search and summary statistics variables
let localSearchIndex = [];
let summaryStats = null;
let currentFilters = { dis: '', r: '', d: '', g: '' };


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
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
            'osm': {
                type: 'raster',
                tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors, © CARTO'
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

// Add Navigation Control
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left');

// Add scale control
map.addControl(new maplibregl.ScaleControl({
    maxWidth: 150,
    unit: 'metric'
}), 'bottom-left');

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
        url: `pmtiles://${DATA_BASE_URL}/LHMP_50000.pmtiles`,
        attribution: 'NBRO',
        minzoom: 7,
        maxzoom: 24
    });

    updateProgress(60, 'Initializing layer system...');

    // --- Z-INDEX SPACER LAYERS ---
    // These invisible layers act as "shelves" to ensure correct order regardless of load time.
    map.addLayer({ id: 'z-index-1-base', type: 'background', layout: { visibility: 'none' } });
    map.addLayer({ id: 'z-index-2-hazards_50k', type: 'background', layout: { visibility: 'none' } });
    map.addLayer({ id: 'z-index-3-hazards_10k', type: 'background', layout: { visibility: 'none' } });
    map.addLayer({ id: 'z-index-4-zones', type: 'background', layout: { visibility: 'none' } }); // Red/Yellow
    map.addLayer({ id: 'z-index-5-overlays', type: 'background', layout: { visibility: 'none' } }); // Contours, Satellite
    map.addLayer({ id: 'z-index-6-top', type: 'background', layout: { visibility: 'none' } }); // Inspection

    // Load 50k immediately (Core Map)
    map.addLayer({
        'id': 'hazard_50k_fill',
        'type': 'fill',
        'source': 'hazard_50k',
        'source-layer': 'hazard_50k',
        'paint': {
            'fill-color': hazardColorMatch,
            'fill-opacity': 0.6,
            'fill-outline-color': 'rgba(0,0,0,0.1)'
        }
    }, 'z-index-2-hazards_50k'); // Put BEFORE the spacer

    // 1:10k layer - lazy loaded (saves bandwidth on mobile)
    window.hazard10kLoaded = false;
    window.loadHazard10k = function () {
        if (window.hazard10kLoaded) return;
        window.hazard10kLoaded = true; // Set flag immediately to prevent retries

        if (!map.getSource('hazard_10k')) {
            map.addSource('hazard_10k', {
                type: 'vector',
                url: `pmtiles://${DATA_BASE_URL}/LHZM_10000.pmtiles`,
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
            }, 'z-index-3-hazards_10k'); // Place in 10k shelf

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

    // --- LAZY LOADERS ---

    // 1. INSPECTION REPORTS (LOAD CLUSTERED GEOJSON)
    window.inspectionLoaded = false;
    window.loadInspection = function () {
        if (window.inspectionLoaded) return;
        window.inspectionLoaded = true;

        map.addSource('inspection_reports', {
            type: 'geojson',
            data: `${DATA_BASE_URL}/inspection_reports.geojson`,
            cluster: false
        });



        // Unclustered Points (Individual dots)
        map.addLayer({
            'id': 'inspection_points',
            'type': 'circle',
            'source': 'inspection_reports',
            'paint': {
                'circle-radius': 6, 
                'circle-color': [
                    'case',
                    /* ================= PRIORITY 1 ================= */
                    ['any', 
                        ['in', 'HR1', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'HR 1', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'P1', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'HR1', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'HR 1', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'P1', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
                    ], '#7f1d1d', // Dark Red

                    /* ================= PRIORITY 2 ================= */
                    ['any', 
                        ['in', 'HR2', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'HR 2', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'P2', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'HR2', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'HR 2', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'P2', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
                    ], '#dc2626', // Medium Red

                    /* ================= PRIORITY 3 ================= */
                    ['any', 
                        ['in', 'HR3', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'HR 3', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'P3', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'HR3', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'HR 3', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'P3', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
                    ], '#f87171', // Light Red

                    /* ================= GENERIC HIGH ================= */
                    ['any', 
                        ['in', 'HR', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'HR', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'HIGH', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
                    ], '#ef4444', 

                    /* ================= MEDIUM MATCHES ================= */
                    ['any', 
                        ['in', 'MR', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'MR', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'MEDIUM', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
                    ], '#eab308',

                    /* ================= LOW MATCHES ================= */
                    ['any', 
                        ['in', 'LR', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                        ['in', 'LR', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                        ['in', 'LOW', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
                    ], '#22c55e',

                    '#2563eb' // Default Blue
                ],
                'circle-stroke-width': 1.5, 
                'circle-stroke-color': '#ffffff'
            },
            'layout': { 'visibility': 'visible' }
        }, 'z-index-6-top'); // Top shelf

        // Re-bind events
        map.on('click', 'inspection_points', showPopup);
        map.on('mouseenter', 'inspection_points', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'inspection_points', () => map.getCanvas().style.cursor = '');
    };

    // 2. TOTAL IMPACT ZONE (TIZ) — 1:10,000
    window.tizZonesLoaded = false;
    window.loadTizzones = function () {
        if (window.tizZonesLoaded) return;
        window.tizZonesLoaded = true;

        map.addSource('tiz_zones', {
            type: 'vector',
            url: `pmtiles://${DATA_BASE_URL}/tiz_10k.pmtiles`
        });

        map.addLayer({
            'id': 'tiz_zones_fill',
            'type': 'fill',
            'source': 'tiz_zones',
            'source-layer': 'tiz_layer',
            'minzoom': 12,
            'paint': {
                'fill-color': [
                    'match',
                    ['get', 'DN'],
                    10, '#ef4444', // Red
                    20, '#facc15', // Yellow
                    '#000000'
                ],
                'fill-opacity': 0.6
            },
            'layout': { 'visibility': 'visible' }
        }, 'z-index-4-zones');

        map.on('click', 'tiz_zones_fill', showPopup);
        map.on('mouseenter', 'tiz_zones_fill', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'tiz_zones_fill', () => map.getCanvas().style.cursor = '');
    };

    // 2b. TOTAL IMPACT ZONE (TIZ) — 1:50,000
    window.tizZones50kLoaded = false;
    window.loadTizzones50k = function () {
        if (window.tizZones50kLoaded) return;
        window.tizZones50kLoaded = true;

        map.addSource('tiz_zones_50k', {
            type: 'vector',
            url: `pmtiles://${DATA_BASE_URL}/tiz_50k.pmtiles`
        });

        map.addLayer({
            'id': 'tiz_50k_fill',
            'type': 'fill',
            'source': 'tiz_zones_50k',
            'source-layer': 'tiz_layer',
            'paint': {
                'fill-color': [
                    'match',
                    ['get', 'DN'],
                    10, '#ef4444', // Red
                    20, '#facc15', // Yellow
                    '#000000'
                ],
                'fill-opacity': 0.6
            },
            'layout': { 'visibility': 'visible' }
        }, 'z-index-4-zones');

        map.on('click', 'tiz_50k_fill', showPopup);
        map.on('mouseenter', 'tiz_50k_fill', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'tiz_50k_fill', () => map.getCanvas().style.cursor = '');
    };

    // ARG Rain Gauges & Thiessen Polygons
    window.argLayersLoaded = false;
    window.loadARGLayers = function () {
        if (window.argLayersLoaded) return;
        window.argLayersLoaded = true;

        // Thiessen Polygons Source & Layer
        map.addSource('arg_thiessen', {
            type: 'geojson',
            data: `${DATA_BASE_URL}/arg_thiessen.geojson`,
            tolerance: 1.5
        });
        map.addLayer({
            'id': 'arg_thiessen_fill',
            'type': 'fill', 'source': 'arg_thiessen',
            'paint': {
                'fill-color': ['get', '_color'], // Distinct color per polygon
                'fill-opacity': 0.35, 
                'fill-outline-color': '#1e293b'
            },
            'layout': { 'visibility': 'visible' }
        }, 'z-index-4-zones'); 

        // Create a square icon for rain gauges (distinct from Inspection circles)
        const sqSize = 14;
        const sqCanvas = document.createElement('canvas');
        sqCanvas.width = sqSize;
        sqCanvas.height = sqSize;
        const sqCtx = sqCanvas.getContext('2d');
        sqCtx.fillStyle = '#1e293b'; // Dark/black fill
        sqCtx.fillRect(0, 0, sqSize, sqSize);
        sqCtx.strokeStyle = '#ffffff'; // White border
        sqCtx.lineWidth = 2;
        sqCtx.strokeRect(1, 1, sqSize - 2, sqSize - 2);
        const sqImgData = sqCtx.getImageData(0, 0, sqSize, sqSize);
        map.addImage('square-marker', { width: sqSize, height: sqSize, data: new Uint8Array(sqImgData.data.buffer) });

        // Point Locations Source & Layer (Symbol with square icon)
        map.addSource('arg_locations', {
            type: 'geojson',
            data: `${DATA_BASE_URL}/arg_locations.geojson`
        });
        map.addLayer({
            'id': 'arg_locations_points',
            'type': 'symbol', 'source': 'arg_locations',
            'layout': {
                'icon-image': 'square-marker',
                'icon-size': 1,
                'icon-allow-overlap': true,
                'visibility': 'visible'
            }
        }, 'z-index-6-top');
    };

    // 4. CONTOURS & SATELLITE LAYERS

    // Contours Lazy
    window.contoursLoaded = false;
    window.loadContours = function () {
        if (window.contoursLoaded) return;
        window.contoursLoaded = true;

        // Check if source exists (satellite might share it? no)
        map.addSource('contours', {
            type: 'vector',
            url: `pmtiles://${DATA_BASE_URL}/Contour_20M.pmtiles`,
            attribution: 'NBRO'
        });

        map.addLayer({
            'id': 'contours_line',
            'type': 'line', 'source': 'contours', 'source-layer': 'Contour_20M',
            'minzoom': 11,
            'paint': {
                'line-color': '#57534e', 'line-width': 1, 'line-opacity': 0.6
            },
            'layout': { 'visibility': 'visible' }
        }, 'z-index-5-overlays');
    };


    // 5. SATELLITE LANDSLIDES (Lazy — only fetched when the toggle is first turned ON)
    window.satelliteLsLoaded = false;
    window.loadSatelliteLs = function () {
        if (window.satelliteLsLoaded) return;
        window.satelliteLsLoaded = true;

        map.addSource('satellite_landslides', {
            type: 'vector',
            url: `pmtiles://${DATA_BASE_URL}/satellite_landslides.pmtiles`,
            attribution: 'Human Settlement & Planning Division'
        });

        map.addLayer({
            'id': 'satellite_polygons',
            'type': 'line',
            'source': 'satellite_landslides',
            'source-layer': 'satellite_landslides',
            'filter': ['==', ['get', 'type'], 'landslide_polygon'],
            'paint': { 'line-color': '#f97316', 'line-width': 2 },
            'layout': { 'visibility': 'visible' }
        }, 'z-index-5-overlays');

        map.addLayer({
            'id': 'satellite_points',
            'type': 'circle',
            'source': 'satellite_landslides',
            'source-layer': 'satellite_landslides',
            'filter': ['==', ['get', 'type'], 'incident_point'],
            'paint': {
                'circle-radius': 5,
                'circle-color': '#f97316',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            },
            'layout': { 'visibility': 'visible' }
        }, 'z-index-5-overlays');

        map.on('click', 'satellite_points', showPopup);
        map.on('click', 'satellite_polygons', showPopup);
        map.on('mouseenter', 'satellite_points', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'satellite_points', () => map.getCanvas().style.cursor = '');
        map.on('mouseenter', 'satellite_polygons', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'satellite_polygons', () => map.getCanvas().style.cursor = '');
    };


    map.on('click', 'hazard_50k_fill', showPopup);
    map.on('click', 'arg_locations_points', showPopup);

    map.on('mouseenter', 'hazard_50k_fill', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'hazard_50k_fill', () => map.getCanvas().style.cursor = '');
    map.on('mouseenter', 'arg_locations_points', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'arg_locations_points', () => map.getCanvas().style.cursor = '');

    // Fetch summary.json and search_index.json
    loadDashboardAndSearchData();

    // Map loaded - hide loading indicator with smooth transition
    updateProgress(100, 'Map ready!');
    setTimeout(() => {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.classList.remove('active');
    }, 500);

    // Notify user if a data source fails to load
    map.on('error', (e) => {
        const msg = (e.error && e.error.message) ? e.error.message : '';
        if (msg.includes('inspection_reports')) {
            showToast('\u26a0\ufe0f Inspection Reports failed to load. Check R2 bucket.', 'error');
        } else if (msg.includes('404')) {
            console.warn('Map source error (404):', msg);
        }
    });
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
    const layerId = e.features[0].layer ? e.features[0].layer.id : '';

    let content = '';

    if (layerId === 'inspection_points') {
        const rawRef = props['Ref. Code'] || props['Ref. No.'] || props['Reference Number'] || props['Ref No'] || props['Name'] || 'N/A';
        const refNo = String(rawRef).replace(/NBRO/g, 'NBRI');
        const risk = props['HR (Priority level)'] || props['Risk level'] || 'N/A';

        // Badge styling based on risk
        let badgeColor = '#3b82f6'; // default blue
        let badgeBg = 'rgba(59, 130, 246, 0.15)';
        const riskUpper = risk.toString().toUpperCase();
        if (riskUpper.includes('P1') || riskUpper.includes('HR1') || riskUpper.includes('HR 1')) {
            badgeColor = '#ef4444'; // Red
            badgeBg = 'rgba(239, 68, 68, 0.15)';
        } else if (riskUpper.includes('P2') || riskUpper.includes('HR2') || riskUpper.includes('HR 2')) {
            badgeColor = '#f97316'; // Orange
            badgeBg = 'rgba(249, 115, 22, 0.15)';
        } else if (riskUpper.includes('P3') || riskUpper.includes('HR3') || riskUpper.includes('HR 3')) {
            badgeColor = '#f59e0b'; // Amber
            badgeBg = 'rgba(245, 158, 11, 0.15)';
        } else if (riskUpper.includes('MR') || riskUpper.includes('MEDIUM')) {
            badgeColor = '#eab308'; // Yellow
            badgeBg = 'rgba(234, 179, 8, 0.15)';
        } else if (riskUpper.includes('LR') || riskUpper.includes('LOW')) {
            badgeColor = '#10b981'; // Green
            badgeBg = 'rgba(16, 185, 129, 0.15)';
        }

        // Build list of details dynamically
        let detailsHtml = '';
        const gpsKeys = ['latitude', 'longitude', 'gps', 'e', 'n', 'x', 'y', 'coordinate', 'coordinates', 'geometry', 'fid', 'objectid', 'source file', 'source sheet', 'typing', 'gps (wgs 84, in decimal degrees)'];

        for (const key in props) {
            if (props[key] !== null && props[key] !== undefined) {
                const valStr = props[key].toString().trim();
                if (valStr === '' || valStr === 'N/A') continue;

                const lowerKey = key.toLowerCase().trim();
                // Skip GPS and metadata keys, including single letters E/N/X/Y
                if (gpsKeys.includes(lowerKey) || 
                    lowerKey.includes('gps') || 
                    lowerKey === 'e' || lowerKey === 'n' || lowerKey === 'x' || lowerKey === 'y') {
                    continue;
                }

                // If key is Ref. Code or Ref. No., it is already in the header
                if (lowerKey === 'ref. code' || lowerKey === 'ref. no.' || lowerKey === 'ref no' || lowerKey === 'reference number') {
                    continue;
                }

                detailsHtml += `
                    <div style="margin-bottom: 8px; display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
                        <span style="color: #94a3b8; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${key}</span>
                        <span style="color: #fff; font-size: 0.8rem; line-height: 1.4; word-break: break-word;">${valStr}</span>
                    </div>
                `;
            }
        }

        content = `
            <div style="padding: 14px; font-family: system-ui, -apple-system, sans-serif; min-width: 280px; max-width: 320px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; padding-right: 24px;">
                    <span style="font-weight: 700; color: #fff; font-size: 0.85rem; word-break: break-all; flex: 1; min-width: 0; padding-right: 8px;">📍 Ref: ${refNo}</span>
                    <span style="padding: 2px 8px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; border: 1px solid ${badgeColor}; color: ${badgeColor}; background: ${badgeBg}; white-space: nowrap; flex-shrink: 0;">${risk}</span>
                </div>
                <div class="custom-popup-scroll" style="display: flex; flex-direction: column; max-height: 260px; overflow-y: auto; padding-right: 6px;">
                    ${detailsHtml || '<div style="color:#94a3b8; font-size:0.75rem;">No details available</div>'}
                </div>
            </div>
        `;
    } else if (layerId === 'tiz_zones_fill' || layerId === 'tiz_50k_fill') {
        const riskLevel = props.DN === 10 ? 'Red Zone' : (props.DN === 20 ? 'Yellow Zone' : 'Unknown');
        const badgeColor = props.DN === 10 ? '#ef4444' : '#facc15';
        const badgeBg = props.DN === 10 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(250, 204, 21, 0.15)';
        content = `
            <div style="padding: 14px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                    <span style="padding: 2px 8px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; border: 1px solid ${badgeColor}; color: ${badgeColor}; background: ${badgeBg}; white-space: nowrap;">${riskLevel}</span>
                </div>
                <div style="font-size: 0.8rem; color: #e2e8f0;"><b>Total Impact Zone (TIZ)</b></div>
            </div>
        `;
    } else {
        // Generic popup for other layers
        content = '<div class="popup-title">Feature Information</div>';
        content += '<div class="popup-info">';
        for (const key in props) {
            if (props[key] !== null && props[key] !== undefined) {
                content += `<b>${key}:</b> ${props[key]}<br>`;
            }
        }
        content += '</div>';
    }

    new maplibregl.Popup({ className: 'custom-modern-popup' })
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
}

function safeAddEventListener(id, event, callback) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, callback);
}

safeAddEventListener('layer-10k', 'change', (e) => {
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

safeAddEventListener('opacity-10k', 'input', (e) => {
    const opacity = parseInt(e.target.value) / 100;
    if (map.getLayer('hazard_10k_fill')) {
        map.setPaintProperty('hazard_10k_fill', 'fill-opacity', opacity);
    }
});

safeAddEventListener('layer-50k', 'change', (e) => {
    map.setLayoutProperty('hazard_50k_fill', 'visibility', e.target.checked ? 'visible' : 'none');
    // Dynamic zoom restriction: 1:50k supports up to zoom 14
    updateMaxZoom();
});

safeAddEventListener('opacity-50k', 'input', (e) => {
    const opacity = parseInt(e.target.value) / 100;
    if (map.getLayer('hazard_50k_fill')) {
        map.setPaintProperty('hazard_50k_fill', 'fill-opacity', opacity);
    }
});

// Update max zoom based on active layers
function updateMaxZoom() {
    const box10k = document.getElementById('layer-10k');
    const box50k = document.getElementById('layer-50k');
    const is10kActive = box10k ? box10k.checked : false;
    const is50kActive = box50k ? box50k.checked : false;

    if (is10kActive) {
        map.setMaxZoom(18);
    } else if (is50kActive) {
        map.setMaxZoom(14);
    } else {
        map.setMaxZoom(18);
    }

    if (map.getZoom() > map.getMaxZoom()) {
        map.setZoom(map.getMaxZoom());
    }
}

// Update configuration toggles to use lazy loaders

safeAddEventListener('layer-contours', 'change', (e) => {
    if (e.target.checked && !window.contoursLoaded) window.loadContours();
    if (map.getLayer('contours_line')) map.setLayoutProperty('contours_line', 'visibility', e.target.checked ? 'visible' : 'none');
});


safeAddEventListener('layer-inspection', 'change', (e) => {
    if (e.target.checked && !window.inspectionLoaded) window.loadInspection();
    const visibility = e.target.checked ? 'visible' : 'none';
    if (map.getLayer('inspection_points')) map.setLayoutProperty('inspection_points', 'visibility', visibility);

    // Advanced Query & Dashboard Visibility logic
    const advPanel = document.getElementById('advanced-query-panel');
    const dashPanel = document.getElementById('dashboard-panel');
    if (advPanel) advPanel.style.display = e.target.checked ? 'flex' : 'none';
    if (dashPanel) dashPanel.style.display = e.target.checked ? 'block' : 'none';
    
    // Ensure search index is loaded so we can populate query dropdowns
    if (e.target.checked && localSearchIndex.length === 0) {
        loadSearchIndex();
    }
});

// Close button for Advanced Query Panel
const closeQueryBtn = document.getElementById('close-query-btn');
if (closeQueryBtn) {
    closeQueryBtn.addEventListener('click', () => {
        document.getElementById('advanced-query-panel').style.display = 'none';
    });
}


const tizToggleBtn = document.getElementById('layer-tiz');
if (tizToggleBtn) {
    tizToggleBtn.addEventListener('change', (e) => {
        if (e.target.checked) {
            showToast('⚠️ <b>INTERNAL USE ONLY</b><br><br>The Total Impact Zone (TIZ) layer is a preliminary, model-derived product and has not been field verified. This dataset is restricted to internal institutional use only and is provided solely as a decision-support tool. It should not be used independently or considered as a final or authoritative assessment.', 'warning');
            if (!window.tizZonesLoaded) window.loadTizzones();
        }
        if (map.getLayer('tiz_zones_fill')) {
            map.setLayoutProperty('tiz_zones_fill', 'visibility', e.target.checked ? 'visible' : 'none');
        }
    });
}

const tiz50kToggleBtn = document.getElementById('layer-tiz-50k');
if (tiz50kToggleBtn) {
    tiz50kToggleBtn.addEventListener('change', (e) => {
        if (e.target.checked) {
            showToast('⚠️ <b>INTERNAL USE ONLY</b><br><br>The Total Impact Zone (TIZ) layer is a preliminary, model-derived product and has not been field verified. This dataset is restricted to internal institutional use only and is provided solely as a decision-support tool. It should not be used independently or considered as a final or authoritative assessment.', 'warning');
            if (!window.tizZones50kLoaded) window.loadTizzones50k();
        }
        if (map.getLayer('tiz_50k_fill')) {
            map.setLayoutProperty('tiz_50k_fill', 'visibility', e.target.checked ? 'visible' : 'none');
        }
    });
}

safeAddEventListener('layer-arg-locations', 'change', (e) => {
    if (e.target.checked && !window.argLayersLoaded) window.loadARGLayers();
    if (map.getLayer('arg_locations_points')) map.setLayoutProperty('arg_locations_points', 'visibility', e.target.checked ? 'visible' : 'none');
});

safeAddEventListener('layer-arg-thiessen', 'change', (e) => {
    if (e.target.checked && !window.argLayersLoaded) window.loadARGLayers();
    if (map.getLayer('arg_thiessen_fill')) map.setLayoutProperty('arg_thiessen_fill', 'visibility', e.target.checked ? 'visible' : 'none');
});

safeAddEventListener('layer-satellite-ls', 'change', (e) => {
    if (e.target.checked && !window.satelliteLsLoaded) window.loadSatelliteLs();
    const visibility = e.target.checked ? 'visible' : 'none';
    if (map.getLayer('satellite_polygons')) map.setLayoutProperty('satellite_polygons', 'visibility', visibility);
    if (map.getLayer('satellite_points')) map.setLayoutProperty('satellite_points', 'visibility', visibility);
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
                map.addLayer(item.layer, 'z-index-2-hazards_50k');
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

// Search functionality with local autocompletion & web fallback
searchInput = document.getElementById('search-input');
searchResults = document.getElementById('search-results');
clearBtn = document.getElementById('clear-search');
let searchTimeout;

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (query.length > 0) {
        clearBtn.style.display = 'block';
        // Lazily load search index on first keystroke
        if (localSearchIndex.length === 0) loadSearchIndex();
    } else {
        clearBtn.style.display = 'none';
        searchResults.style.display = 'none';
        return;
    }

    clearTimeout(searchTimeout);

    // If query is too short, don't trigger auto-search yet
    if (query.length < 3) {
        searchResults.style.display = 'none';
        return;
    }

    // Faster debounce for local index searches (300ms)
    searchTimeout = setTimeout(() => {
        searchLocation(query);
    }, 300);
});

// Allow immediate search or selecting first result when pressing Enter
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimeout);
        
        // If there's a result currently displayed, Enter should select the first one
        const firstResult = searchResults.querySelector('.search-result-item');
        if (firstResult && searchResults.style.display !== 'none') {
            firstResult.click();
            return;
        }

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

    // 1. Check if query is GPS coordinates (Latitude first, Longitude second)
    const coordPattern = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const match = query.trim().match(coordPattern);

    if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);

        if (lon >= 79.5 && lon <= 82.0 && lat >= 5.9 && lat <= 9.9) {
            displayResults([{
                display_name: `GPS Location - Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`,
                lat: lat,
                lon: lon,
                isLocal: true,
                risk: 'N/A'
            }]);
            return;
        } else {
            searchResults.innerHTML = '<div class="no-results" style="color:#f59e0b;">⚠️ Coordinates are outside Sri Lanka bounds</div>';
            return;
        }
    }

    // 2. Search Local Index (Ref Numbers, GND name, DSD)
    // NBRI mapped to NBRO so the search works internally with legacy data
    const q = query.toLowerCase().trim().replace('nbri', 'nbro');
    const localMatches = [];
    if (localSearchIndex && localSearchIndex.length > 0) {
        for (const item of localSearchIndex) {
            if (item.n.toLowerCase().includes(q) || 
                item.g.toLowerCase().includes(q) || 
                item.d.toLowerCase().includes(q) ||
                item.dis.toLowerCase().includes(q)) {
                localMatches.push(item);
                if (localMatches.length >= 8) break; // Limit local hits
            }
        }
    }

    const formattedLocal = localMatches.map(m => ({
        display_name: `${m.n.replace(/NBRO/g, 'NBRI')} - GND: ${m.g || 'N/A'}, DSD: ${m.d || 'N/A'} (${m.dis} District)`,
        lat: m.lat,
        lon: m.lon,
        isLocal: true,
        risk: m.r
    }));

    if (formattedLocal.length > 0) {
        displayResults(formattedLocal);

        // If query is long (>= 10 characters) and local matches are few, search Nominatim to enrich
        if (query.length >= 10 && formattedLocal.length < 5) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Sri Lanka')}&limit=3&countrycodes=lk`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                if (response.ok) {
                    const webData = await response.json();
                    if (webData && webData.length > 0) {
                        const combined = [...formattedLocal];
                        webData.forEach(w => {
                            const lat = parseFloat(w.lat);
                            const lon = parseFloat(w.lon);
                            // Avoid adding coordinates already matching a local site
                            if (!combined.some(c => Math.abs(c.lat - lat) < 0.001 && Math.abs(c.lon - lon) < 0.001)) {
                                combined.push({
                                    display_name: w.display_name,
                                    lat: lat,
                                    lon: lon,
                                    isLocal: false
                                });
                            }
                        });
                        displayResults(combined);
                    }
                }
            } catch (err) {
                console.warn("Nominatim fallback skipped:", err);
            }
        }
        return;
    }

    // 3. Fallback to Nominatim Web Geocoding (only for 4+ character queries)
    if (q.length >= 4) {
        try {
            const cacheKey = `geocode_${query}`;
            const cached = sessionStorage.getItem(cacheKey);

            if (cached) {
                const data = JSON.parse(cached);
                displayResults(data);
                return;
            }

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Sri Lanka')}&limit=5&countrycodes=lk`,
                { headers: { 'Accept-Language': 'en' } }
            );

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();

            if (data && data.length > 0) {
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                displayResults(data);
            } else {
                showNoResults();
            }
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = `<div class="no-results" style="color:#ef4444;">No results found. Check network connection.</div>`;
        }
    } else {
        showNoResults();
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
        if (result.isLocal) {
            title.innerHTML = `<span style="background: rgba(139, 92, 246, 0.2); color: #a78bfa; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; margin-right: 6px; font-weight: 600;">Local Site</span>${result.display_name.split(' - ')[0]}`;
        } else {
            title.textContent = result.display_name.split(',')[0];
        }

        const subtitle = document.createElement('div');
        subtitle.className = 'result-subtitle';
        if (result.isLocal) {
            subtitle.textContent = result.display_name.split(' - ').slice(1).join(' - ').trim();
        } else {
            subtitle.textContent = result.display_name.split(',').slice(1).join(',').trim();
        }

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
                zoom: 14,
                duration: 1500
            });

            if (searchMarker) {
                searchMarker.remove();
            }

            const markerColor = result.isLocal ? '#8b5cf6' : '#06b6d4';
            searchMarker = new maplibregl.Marker({ color: markerColor })
                .setLngLat([lon, lat])
                .setPopup(
                    new maplibregl.Popup().setHTML(
                        result.isLocal 
                            ? `<div class="popup-title">${result.display_name.split(' - ')[0]}</div>
                               <div class="popup-info"><b>Location:</b> ${result.display_name.split(' - ').slice(1).join(' - ')}<br><b>Risk level:</b> ${result.risk || 'N/A'}</div>`
                            : `<div class="popup-title">${result.display_name.split(',')[0]}</div>
                               <div class="popup-info">${subtitle.textContent}</div>`
                    )
                )
                .addTo(map)
                .togglePopup();

            searchResults.style.display = 'none';
            searchInput.value = result.isLocal ? result.display_name.split(' - ')[0] : result.display_name.split(',')[0];
        });

        searchResults.appendChild(item);
    });
}

function showNoResults() {
    searchResults.innerHTML = '<div class="no-results" style="padding:16px;text-align:center;color:#ef4444;font-size:0.9rem;display:flex;flex-direction:column;align-items:center;gap:8px;"><span style="font-size:1.5rem">🔍</span>No locations found. Try checking your spelling.</div>';
    searchResults.style.display = 'block';
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        // On mobile, only close results when user explicitly clicks the map canvas (not toolbar/controls)
        if (window.innerWidth <= 768 && !e.target.closest('#map canvas')) return;
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
    if (isControlsCollapsed || (isMobile && localStorage.getItem('controlsCollapsed') === null)) {
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

// Swipe-down-to-dismiss: mobile controls panel
(function () {
    let _swipeStartY = 0;
    controlsPanel.addEventListener('touchstart', (e) => {
        _swipeStartY = e.touches[0].clientY;
    }, { passive: true });
    controlsPanel.addEventListener('touchend', (e) => {
        const dy = e.changedTouches[0].clientY - _swipeStartY;
        if (dy > 60 && window.innerWidth <= 768) {
            controlsPanel.classList.add('collapsed');
            localStorage.setItem('controlsCollapsed', 'true');
        }
    }, { passive: true });
})();


// PWA Installation Logic
let deferredPrompt;
const installBtn = document.createElement('button');
installBtn.className = 'tool-menu-item';
installBtn.id = 'install-btn';
installBtn.style.display = 'none'; // Hidden by default
installBtn.innerHTML = `
    <span class="tool-icon" style="background: linear-gradient(135deg, #0f172a, #334155);">
        ${ICONS.install}
    </span>
    <span class="tool-label">Install App</span>
`;

// Append to Tools Menu
document.getElementById('tools-panel-content').appendChild(installBtn);

// Tools Menu Toggle Logic
const toolsMenuBtn = document.getElementById('tools-menu-btn');
const toolsPanel = document.getElementById('tools-panel');
const closeToolsBtn = document.getElementById('close-tools-btn');

toolsMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toolsPanel.classList.add('active');
});

closeToolsBtn.addEventListener('click', () => {
    toolsPanel.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (toolsPanel.classList.contains('active') && !toolsPanel.contains(e.target) && e.target !== toolsMenuBtn) {
        toolsPanel.classList.remove('active');
    }
});

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
    // Reset unit label back to km
    const unitEl = document.getElementById('measure-unit');
    if (unitEl) unitEl.textContent = 'km';
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

    // Calculate total distance with auto km/m unit switching
    if (measurePoints.length > 1) {
        let totalDist = 0;
        for (let i = 0; i < measurePoints.length - 1; i++) {
            totalDist += getDistance(measurePoints[i], measurePoints[i + 1]);
        }
        const unitEl = document.getElementById('measure-unit');
        if (totalDist < 1) {
            distanceValue.textContent = (totalDist * 1000).toFixed(0);
            if (unitEl) unitEl.textContent = 'm';
        } else {
            distanceValue.textContent = totalDist.toFixed(2);
            if (unitEl) unitEl.textContent = 'km';
        }
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
    const defaultName = 'Location ' + (getBookmarks().length + 1);

    // Use inline input instead of native browser prompt()
    const existing = document.getElementById('bookmark-name-row');
    if (existing) existing.remove();

    const row = document.createElement('div');
    row.id = 'bookmark-name-row';
    row.style.cssText = 'display:flex;gap:6px;padding:8px 12px 4px;';
    row.innerHTML = `
        <input id="bm-name-input" type="text" value="${defaultName}"
            style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(139,92,246,0.4);border-radius:8px;color:#e2e8f0;padding:6px 10px;font-size:0.82rem;outline:none;"
            placeholder="Enter location name" />
        <button id="bm-save-confirm"
            style="background:linear-gradient(135deg,#8b5cf6,#06b6d4);border:none;border-radius:8px;color:#fff;padding:6px 12px;cursor:pointer;font-size:0.82rem;font-weight:600;">Save</button>`;

    const panel = document.getElementById('bookmarks-panel');
    const footer = panel.querySelector('[style*="border-top"]');
    if (footer) footer.before(row); else panel.appendChild(row);

    const input = row.querySelector('#bm-name-input');
    input.focus(); input.select();

    const doSave = () => {
        const name = input.value.trim() || defaultName;
        const bookmarks = getBookmarks();
        bookmarks.push({ name, lat: center.lat, lon: center.lng, zoom: map.getZoom(), timestamp: Date.now() });
        saveBookmarks(bookmarks);
        row.remove();
        renderBookmarks();
        showToast('\u2705 Location saved!', 'success');
    };
    row.querySelector('#bm-save-confirm').addEventListener('click', doSave);
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') doSave(); });
});

// Share View functionality
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showToast('✅ Link copied to clipboard! Share this exact view.', 'success');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            showToast('❌ Failed to copy link.', 'error');
        });
    });
}

// Fullscreen functionality
const fullscreenBtn = document.getElementById('fullscreen-btn');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                showToast('❌ Fullscreen not supported.', 'error');
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
}
// =============================================
// COMPASS FUNCTIONALITY  
// =============================================
const compassIndicator = document.getElementById('compass-indicator');
const compassNeedle = document.getElementById('compass-needle');

map.on('rotate', () => {
    compassNeedle.style.transform = 'rotate(' + (-map.getBearing()) + 'deg)';
    // Show compass when map is rotated (even in 2D mode) OR pitched
    const hasBearing = Math.abs(map.getBearing()) > 0.5;
    const hasPitch   = map.getPitch() > 0;
    compassIndicator.style.display = (hasBearing || hasPitch) ? 'block' : 'none';
});
compassIndicator.addEventListener('click', () => { map.easeTo({ bearing: 0, pitch: 0, duration: 500 }); });
map.on('pitchend', () => {
    const hasBearing = Math.abs(map.getBearing()) > 0.5;
    compassIndicator.style.display = (hasBearing || map.getPitch() > 0) ? 'block' : 'none';
});

// Check if service worker is supported
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(registration => {
            console.log('ServiceWorker registration successful');
        })
        .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });

    // Notify user (not force-reload) when new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        showToast('🔄 New version available — tap to refresh the page.', 'info');
        const toast = document.getElementById('app-toast');
        if (toast) {
            toast.addEventListener('click', () => window.location.reload(), { once: true });
        }
    });
}


// =============================================
// DYNAMIC LEGEND FUNCTIONALITY
// =============================================
function updateLegend() {
    // Hazard Group
    const show10k = document.getElementById('layer-10k') ? document.getElementById('layer-10k').checked : false;
    const show50k = document.getElementById('layer-50k') ? document.getElementById('layer-50k').checked : false;
    const showBaseHazard = show10k || show50k;
    const showTiz10k = document.getElementById('layer-tiz') ? document.getElementById('layer-tiz').checked : false;
    const showTiz50k = document.getElementById('layer-tiz-50k') ? document.getElementById('layer-tiz-50k').checked : false;
    const showTiz = showTiz10k || showTiz50k;
    const showHazardGroup = showBaseHazard || showTiz;
    
    const hazSec = document.getElementById('legend-section-hazard');
    if (hazSec) hazSec.style.display = showHazardGroup ? 'block' : 'none';
    if (document.getElementById('leg-item-base-hazard')) document.getElementById('leg-item-base-hazard').style.display = showBaseHazard ? 'block' : 'none';
    if (document.getElementById('leg-item-tiz')) document.getElementById('leg-item-tiz').style.display = showTiz ? 'flex' : 'none';

    // Context Group
    const showArg = document.getElementById('layer-arg-locations') ? document.getElementById('layer-arg-locations').checked : false;
    const showThiessen = document.getElementById('layer-arg-thiessen') ? document.getElementById('layer-arg-thiessen').checked : false;
    const showSat = document.getElementById('layer-satellite-ls') ? document.getElementById('layer-satellite-ls').checked : false;
    const showContextGroup = showArg || showThiessen || showSat;
    
    const ctxSec = document.getElementById('legend-section-context');
    if (ctxSec) ctxSec.style.display = showContextGroup ? 'block' : 'none';
    if (document.getElementById('leg-item-arg')) document.getElementById('leg-item-arg').style.display = showArg ? 'flex' : 'none';
    if (document.getElementById('leg-item-thiessen')) document.getElementById('leg-item-thiessen').style.display = showThiessen ? 'flex' : 'none';
    if (document.getElementById('leg-item-satellite')) document.getElementById('leg-item-satellite').style.display = showSat ? 'inline-block' : 'none';

    // Inspection Group
    const showInsp = document.getElementById('layer-inspection') ? document.getElementById('layer-inspection').checked : false;
    const inspSec = document.getElementById('legend-section-inspection');
    if (inspSec) inspSec.style.display = showInsp ? 'block' : 'none';

    // Dividers
    if (document.getElementById('legend-divider-1')) {
        document.getElementById('legend-divider-1').style.display = (showHazardGroup && (showContextGroup || showInsp)) ? 'block' : 'none';
    }
    if (document.getElementById('legend-divider-2')) {
        document.getElementById('legend-divider-2').style.display = (showContextGroup && showInsp) ? 'block' : 'none';
    }

    // Hide entire legend container if all sections are hidden
    const anyVisible = showHazardGroup || showContextGroup || showInsp;
    const legendContainer = document.getElementById('legend');
    if (legendContainer) {
        if (!legendContainer.classList.contains('collapsed')) {
            legendContainer.style.display = anyVisible ? 'flex' : 'none';
            if (anyVisible) legendContainer.style.flexDirection = 'column';
        } else {
            legendContainer.style.display = anyVisible ? 'block' : 'none';
        }
    }
}

// Global listener for legend toggle
document.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'checkbox' && e.target.id && e.target.id.startsWith('layer-')) {
        updateLegend();
    }
});

// =============================================
// TOAST NOTIFICATION SYSTEM
// =============================================
function showToast(message, type = 'info') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) scale(0.9); background:rgba(15,23,42,0.97); backdrop-filter:blur(15px); color:#fff; padding:20px 28px; border-radius:12px; z-index:9999; box-shadow:0 15px 40px rgba(0,0,0,0.6); transition:transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275),opacity 0.4s; opacity:0; pointer-events:auto; font-weight:400; text-align:center; width:90vw; max-width:420px; font-size:0.85rem; line-height:1.5; cursor:pointer;';
        toast.title = 'Click to dismiss';
        toast.addEventListener('click', dismissToast);
        document.body.appendChild(toast);
    }
    const borders = { warning:'2px solid rgba(239,68,68,0.8)', error:'2px solid rgba(239,68,68,0.8)', success:'1px solid rgba(34,197,94,0.6)', info:'1px solid rgba(139,92,246,0.4)' };
    toast.style.border = borders[type] || borders.info;
    toast.innerHTML = message + '<div style="font-size:0.7rem;color:#64748b;margin-top:10px;opacity:0.8;">Tap to dismiss</div>';
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%,-50%) scale(1)';
    const duration = (type === 'warning' || type === 'error') ? 8000 : 5000;
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(dismissToast, duration);
}

function dismissToast() {
    const toast = document.getElementById('app-toast');
    if (toast) { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%,-50%) scale(0.9)'; }
    if (window.toastTimeout) { clearTimeout(window.toastTimeout); window.toastTimeout = null; }
}

// Run once on load to initialize legend state
window.addEventListener('load', () => {
    setTimeout(updateLegend, 100);
});

// Mobile Tooltip Helper: Shows what an icon does when touched (since mobile has no hover)
document.addEventListener('touchstart', (e) => {
    let target = e.target.closest('.fab-btn, .maplibregl-ctrl button');
    if (target) {
        let title = target.getAttribute('title') || target.getAttribute('aria-label');
        
        // Prefer explicit tooltips for FABs
        if (target.classList.contains('fab-btn')) {
            let tooltipSpan = target.querySelector('.fab-tooltip');
            if (tooltipSpan) title = tooltipSpan.innerText;
        }
        
        if (title) {
            let existing = document.getElementById('mobile-quick-tooltip');
            if (!existing) {
                existing = document.createElement('div');
                existing.id = 'mobile-quick-tooltip';
                // Small black pill tooltip at the top center
                existing.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.9); border:1px solid rgba(139,92,246,0.5); color:#fff; padding:6px 14px; border-radius:20px; font-size:0.85rem; z-index:99999; pointer-events:none; transition:opacity 0.2s; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-weight:500;';
                document.body.appendChild(existing);
            }
            existing.innerText = title;
            existing.style.opacity = '1';
            
            clearTimeout(window.mobileTooltipTimer);
            window.mobileTooltipTimer = setTimeout(() => {
                if(existing) existing.style.opacity = '0';
            }, 2000); // Hide after 2 seconds
        }
    }
}, {passive: true});

// =============================================
// EXECUTIVE SUMMARY DASHBOARD & LOCAL SEARCH LOGIC
// =============================================
// Lazy-load search index on first keystroke (saves ~786KB on every page load)
let _searchIndexLoading = false;
async function loadSearchIndex() {
    if (localSearchIndex.length > 0 || _searchIndexLoading) return;
    _searchIndexLoading = true;
    try {
        const cached = sessionStorage.getItem('search_index_v1');
        if (cached) {
            localSearchIndex = JSON.parse(cached);
        } else {
            const res = await fetch(`${DATA_BASE_URL}/search_index.json`);
            if (res.ok) {
                localSearchIndex = await res.json();
                try { sessionStorage.setItem('search_index_v1', JSON.stringify(localSearchIndex)); } catch(e) {}
            }
        }
        updateViewportStats();
        populateQueryDropdowns();
    } catch (e) {
        console.error('Failed to load search index:', e);
    } finally {
        _searchIndexLoading = false; // Allow retry on next keystroke after network failure
    }
}

async function loadDashboardAndSearchData() {
    try {
        const res = await fetch(`${DATA_BASE_URL}/summary.json`);
        if (res.ok) {
            summaryStats = await res.json();
            populateDashboard(summaryStats);
        }
        // Force load search index immediately so dashboard viewport stats work properly
        await loadSearchIndex();
    } catch (e) {
        console.error("Error loading dashboard data:", e);
    }
}

function populateDashboard(data) {
    // Populate global KPIs from summary.json (used before search_index loads)
    const kpiTotal   = document.getElementById('kpi-total');
    const kpiMapped  = document.getElementById('kpi-mapped');
    const kpiHr      = document.getElementById('kpi-hr');
    const kpiMr      = document.getElementById('kpi-mr');
    const kpiLr      = document.getElementById('kpi-lr');
    // Set the immutable total count from pre-built summary
    if (kpiTotal)  kpiTotal.innerHTML  = `${data.total_mapped.toLocaleString()}<span style="font-size:0.65rem;color:inherit;opacity:0.6;font-weight:normal;display:block;margin-top:1px;">total</span>`;
    if (kpiHr)     kpiHr.innerHTML     = `${data.total_hr.toLocaleString()}<span style="font-size:0.65rem;color:inherit;opacity:0.6;font-weight:normal;display:block;margin-top:1px;">total</span>`;
    if (kpiMapped) kpiMapped.innerHTML = '—'; // will be updated by viewport stats
    const tbody = document.getElementById('district-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#475569;padding:12px 0;">Pan or zoom map to see incidents</td></tr>';
    }
    const footer = document.getElementById('dashboard-footer');
    if (footer) footer.textContent = `Dataset: ${data.total_mapped.toLocaleString()} inspection records`;
}


function flyToDistrict(districtName) {
    if (!localSearchIndex || localSearchIndex.length === 0) return;
    const points = localSearchIndex.filter(p => p.dis.toLowerCase() === districtName.toLowerCase());
    if (points.length === 0) return;
    
    let sumLat = 0, sumLon = 0;
    points.forEach(p => {
        sumLat += p.lat;
        sumLon += p.lon;
    });
    const avgLat = sumLat / points.length;
    const avgLon = sumLon / points.length;
    
    map.flyTo({
        center: [avgLon, avgLat],
        zoom: 10,
        duration: 1500
    });
    showToast(`Flying to ${districtName} District`, 'success');
}

// Collapsible widget hook
const dashboardPanel = document.getElementById('dashboard-panel');
const dashboardToggle = document.getElementById('dashboard-toggle');
if (dashboardToggle && dashboardPanel) {
    dashboardToggle.addEventListener('click', () => {
        dashboardPanel.classList.toggle('collapsed');
        const btn = dashboardToggle.querySelector('.dashboard-toggle-btn');
        if (btn) {
            btn.textContent = dashboardPanel.classList.contains('collapsed') ? '▼' : '▲';
        }
    });
}

// =====================================================
// EXECUTIVE SUMMARY — LIVE INCIDENT AUTO-UPDATE
// Fires on every map pan/zoom + on data load
// =====================================================

// Risk classification helper
function classifyRisk(r) {
    const risk = (r || '').toString().toUpperCase().trim();
    if (risk.includes('HR1') || risk.includes('HR2') || risk.includes('HR3') ||
        risk.includes('P1')  || risk.includes('P2')  || risk.includes('P3')  ||
        risk.includes('HR') || risk.includes('HIGH')) return 'HR';
    if (risk.includes('MR') || risk.includes('MEDIUM') || risk.includes('MOD')) return 'MR';
    if (risk.includes('LR') || risk.includes('LOW')) return 'LR';
    return 'NONE';
}

// Risk badge HTML
function riskBadge(r) {
    const cls = classifyRisk(r);
    const styles = {
        HR:   'background:rgba(239,68,68,0.2);   color:#f87171; border:1px solid rgba(239,68,68,0.5);',
        MR:   'background:rgba(234,179,8,0.2);   color:#fbbf24; border:1px solid rgba(234,179,8,0.5);',
        LR:   'background:rgba(34,197,94,0.2);   color:#4ade80; border:1px solid rgba(34,197,94,0.5);',
        NONE: 'background:rgba(71,85,105,0.2);   color:#94a3b8; border:1px solid rgba(71,85,105,0.4);',
    };
    const labels = { HR: r || 'HR', MR: r || 'MR', LR: r || 'LR', NONE: r || '—' };
    return `<span style="font-size:0.7rem;font-weight:700;padding:2px 7px;border-radius:12px;${styles[cls]}">${labels[cls]}</span>`;
}

// Animate number change
function animateKpi(el, newVal) {
    if (!el) return;
    const current = parseInt(el.dataset.val || '0');
    if (current === newVal) return;
    el.dataset.val = newVal;
    const duration = 400;
    const start = performance.now();
    const from = current;
    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const val = Math.round(from + (newVal - from) * eased);
        el.innerHTML = `${val.toLocaleString()}<span style="font-size:0.65rem;color:inherit;opacity:0.6;font-weight:normal;display:block;margin-top:1px;">in view</span>`;
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function updateViewportStats() {
    const kpiMapped  = document.getElementById('kpi-mapped');
    const kpiHr      = document.getElementById('kpi-hr');
    const kpiMr      = document.getElementById('kpi-mr');
    const kpiLr      = document.getElementById('kpi-lr');
    const tbody       = document.getElementById('district-tbody');
    const footer      = document.getElementById('dashboard-footer');
    const barHr       = document.getElementById('risk-bar-hr');
    const barMr       = document.getElementById('risk-bar-mr');
    const barLr       = document.getElementById('risk-bar-lr');
    const barNone     = document.getElementById('risk-bar-none');
    const riskBarCont = document.getElementById('risk-bar-container');

    // Fallback to global summary if search index not loaded yet
    if (!localSearchIndex || localSearchIndex.length === 0) {
        if (summaryStats) {
            const kpiTotal = document.getElementById('kpi-total');
            if (kpiTotal) kpiTotal.innerHTML = summaryStats.total_mapped.toLocaleString() +
                '<span style="font-size:0.65rem;color:inherit;opacity:0.6;font-weight:normal;display:block;margin-top:1px;">total</span>';
            if (kpiHr) kpiHr.innerHTML = summaryStats.total_hr.toLocaleString() +
                '<span style="font-size:0.65rem;color:inherit;opacity:0.6;font-weight:normal;display:block;margin-top:1px;">total</span>';
        }
        return;
    }

    const bounds = map.getBounds();
    const west   = bounds.getWest();
    const east   = bounds.getEast();
    const north  = bounds.getNorth();
    const south  = bounds.getSouth();

    let totalMapped = 0, hrCount = 0, mrCount = 0, lrCount = 0, noneCount = 0;
    // District grouping: { districtName: { total, hr, mr, lr } }
    const districtMap = {};

    for (let i = 0; i < localSearchIndex.length; i++) {
        const item = localSearchIndex[i];
        const lng  = item.lon;
        const lat  = item.lat;
        if (lng >= west && lng <= east && lat >= south && lat <= north) {
            // Apply advanced filters so dashboard matches the filtered map dots
            // Use case-insensitive comparison because dropdown values are Title Case via cleanName()
            if (currentFilters.dis && (item.dis || '').toLowerCase() !== currentFilters.dis.toLowerCase()) continue;
            if (currentFilters.d && (item.d || '').toLowerCase() !== currentFilters.d.toLowerCase()) continue;
            if (currentFilters.g && (item.g || '').toLowerCase() !== currentFilters.g.toLowerCase()) continue;
            
            const cls = classifyRisk(item.r);
            
            if (currentFilters.r) {
                if (currentFilters.r === 'HR' && cls !== 'HR') continue;
                if (currentFilters.r === 'MR' && cls !== 'MR') continue;
                if (currentFilters.r === 'LR' && cls !== 'LR') continue;
            }
            
            totalMapped++;
            if      (cls === 'HR') hrCount++;
            else if (cls === 'MR') mrCount++;
            else if (cls === 'LR') lrCount++;
            else                   noneCount++;

            // Group by district
            const distName = item.dis || 'Unknown';
            if (!districtMap[distName]) districtMap[distName] = { total:0, hr:0, mr:0, lr:0 };
            districtMap[distName].total++;
            if      (cls === 'HR') districtMap[distName].hr++;
            else if (cls === 'MR') districtMap[distName].mr++;
            else if (cls === 'LR') districtMap[distName].lr++;
        }
    }

    // Update In-View KPIs with animated count
    animateKpi(kpiMapped, totalMapped);
    animateKpi(kpiHr,     hrCount);
    animateKpi(kpiMr,     mrCount);
    animateKpi(kpiLr,     lrCount);

    // Update total KPI (immutable — from summary.json)
    if (summaryStats) {
        const kpiTotal = document.getElementById('kpi-total');
        if (kpiTotal && !kpiTotal.dataset.set) {
            kpiTotal.dataset.set = '1';
            kpiTotal.innerHTML = summaryStats.total_mapped.toLocaleString() +
                '<span style="font-size:0.65rem;color:inherit;opacity:0.6;font-weight:normal;display:block;margin-top:1px;">total</span>';
        }
    }

    // Update proportional risk bar
    if (riskBarCont && totalMapped > 0) {
        riskBarCont.style.display = 'flex';
        const pct = (n) => (n / totalMapped * 100).toFixed(1) + '%';
        if (barHr)   barHr.style.width   = pct(hrCount);
        if (barMr)   barMr.style.width   = pct(mrCount);
        if (barLr)   barLr.style.width   = pct(lrCount);
        if (barNone) barNone.style.width = pct(noneCount);
    }

    // Populate district-wise table
    if (tbody) {
        if (totalMapped === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#475569;padding:12px 0;">No incidents in current view</td></tr>';
        } else {
            // Sort districts by HR count desc, then total desc
            const districts = Object.entries(districtMap).sort((a, b) => {
                if (b[1].hr !== a[1].hr) return b[1].hr - a[1].hr;
                return b[1].total - a[1].total;
            });
            tbody.innerHTML = districts.map(([name, d]) => {
                return `<tr style="cursor:pointer;" onclick="flyToDistrict('${name.replace(/'/g, "\\'")}')"
                    title="Click to fly to ${name} District">
                    <td style="font-size:0.72rem;color:#e2e8f0;font-weight:500;">${name}</td>
                    <td style="font-size:0.72rem;color:#a78bfa;font-weight:600;">${d.total}</td>
                    <td style="font-size:0.72rem;color:#f87171;">${d.hr || '—'}</td>
                    <td style="font-size:0.72rem;color:#fbbf24;">${d.mr || '—'}</td>
                    <td style="font-size:0.72rem;color:#4ade80;">${d.lr || '—'}</td>
                </tr>`;
            }).join('');
        }
    }

    // Footer timestamp
    if (footer) {
        const now = new Date();
        const total = summaryStats ? summaryStats.total_mapped.toLocaleString() : totalMapped.toLocaleString();
        footer.textContent = `Updated ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} · Showing ${totalMapped.toLocaleString()} of ${total}`;
    }
}

// Register map viewport moveend listener for statistics (debounced for performance)
let _moveEndTimer;
map.on('moveend', () => {
    clearTimeout(_moveEndTimer);
    _moveEndTimer = setTimeout(updateViewportStats, 250);
});


// =====================================================
// MOBILE FAB TOUCH TOOLTIPS
// Show a brief label when FABs are tapped on mobile
// =====================================================
(function() {
    const fabDefs = [
        { id: 'locate-btn',   label: 'Find My Location' },
        { id: 'bookmark-btn', label: 'Bookmarks' },
        { id: 'measure-btn',  label: 'Measure Distance' },
        { id: 'view3d-btn',   label: '3D Terrain View' },
        { id: 'share-btn',    label: 'Share Map View' },
        { id: 'fullscreen-btn',label: 'Toggle Fullscreen' }
    ];

    // Create shared tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'fab-touch-label';
    document.body.appendChild(tooltip);

    let hideTimer = null;

    fabDefs.forEach(({ id, label }) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => {
            // Only on mobile (touch device)
            const rect = btn.getBoundingClientRect();
            tooltip.textContent = label;
            tooltip.style.top = (rect.top + rect.height / 2 - 14) + 'px';
            tooltip.classList.add('show');

            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                tooltip.classList.remove('show');
            }, 1500);
        }, { passive: true });
    });
})();

// =====================================================
// Advanced Query Logic (Cascading Dropdowns)
// =====================================================

function cleanName(str) {
    if (!str) return '';
    // Remove Zero-Width Joiners (ZWJ/ZWNJ) and trim extra spaces
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Data structures to hold hierarchy
let districtToDSDs = {};
let dsdToGNDs = {};
let allDistricts = new Set();

function initQueryDropdowns() {
    if (!localSearchIndex || localSearchIndex.length === 0) return;
    
    // Build hierarchy
    localSearchIndex.forEach(item => {
        let dist = item.dis && item.dis !== 'nan' && item.dis !== 'Unknown' ? cleanName(item.dis) : '';
        let dsd = item.d && item.d !== 'nan' && item.d.trim() !== '' ? cleanName(item.d) : '';
        let gnd = item.g && item.g !== 'nan' && item.g.trim() !== '' ? cleanName(item.g) : '';
        
        if (dist) {
            allDistricts.add(dist);
            if (!districtToDSDs[dist]) districtToDSDs[dist] = new Set();
            if (dsd) {
                districtToDSDs[dist].add(dsd);
                if (!dsdToGNDs[dsd]) dsdToGNDs[dsd] = new Set();
                if (gnd) dsdToGNDs[dsd].add(gnd);
            }
        }
    });

    // Populate Districts
    const distSelect = document.getElementById('query-district');
    if (distSelect && distSelect.options.length <= 1) {
        buildOptions(allDistricts, distSelect);
    }
    
    // Attach listeners
    ['query-district', 'query-risk', 'query-dsd', 'query-gnd'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.dataset.listenerAttached) {
            el.dataset.listenerAttached = "1";
            el.addEventListener('change', handleFilterChange);
        }
    });
    
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn && !resetBtn.dataset.listenerAttached) {
        resetBtn.dataset.listenerAttached = "1";
        resetBtn.addEventListener('click', resetAllFilters);
    }
    
    // Initial state
    updateDropdownStates();
}

function buildOptions(set, selectEl) {
    if (!selectEl) return;
    const currentVal = selectEl.value;
    const options = Array.from(set).sort();
    const defaultOption = selectEl.options[0].outerHTML;
    selectEl.innerHTML = defaultOption + options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    if (options.includes(currentVal)) selectEl.value = currentVal;
}

function updateDropdownStates() {
    const distSelect = document.getElementById('query-district');
    const dsdSelect = document.getElementById('query-dsd');
    const gndSelect = document.getElementById('query-gnd');
    if (!distSelect || !dsdSelect || !gndSelect) return;
    
    const selectedDist = distSelect.value;
    const selectedDSD = dsdSelect.value;
    
    // If no district selected, disable DSD and GND
    if (!selectedDist) {
        dsdSelect.value = '';
        gndSelect.value = '';
        dsdSelect.disabled = true;
        gndSelect.disabled = true;
        dsdSelect.innerHTML = dsdSelect.options[0].outerHTML;
        gndSelect.innerHTML = gndSelect.options[0].outerHTML;
    } else {
        dsdSelect.disabled = false;
        // Rebuild DSD based on District (if it was just selected)
        if (dsdSelect.options.length <= 1 || !Array.from(districtToDSDs[selectedDist] || []).includes(dsdSelect.options[1]?.value)) {
            buildOptions(districtToDSDs[selectedDist] || new Set(), dsdSelect);
        }
        
        // If no DSD selected, disable GND
        if (!selectedDSD) {
            gndSelect.value = '';
            gndSelect.disabled = true;
            gndSelect.innerHTML = gndSelect.options[0].outerHTML;
        } else {
            gndSelect.disabled = false;
            if (gndSelect.options.length <= 1 || !Array.from(dsdToGNDs[selectedDSD] || []).includes(gndSelect.options[1]?.value)) {
                buildOptions(dsdToGNDs[selectedDSD] || new Set(), gndSelect);
            }
        }
    }
    
    // Update visual style for disabled selects
    [dsdSelect, gndSelect].forEach(el => {
        el.style.opacity = el.disabled ? '0.5' : '1';
        el.style.cursor = el.disabled ? 'not-allowed' : 'pointer';
    });
}

function resetAllFilters() {
    document.getElementById('query-district').value = '';
    document.getElementById('query-risk').value = '';
    document.getElementById('query-dsd').value = '';
    document.getElementById('query-gnd').value = '';
    
    updateDropdownStates();
    applyAdvancedFilters();
}

function handleFilterChange(e) {
    const targetId = e.target.id;
    if (targetId === 'query-district') {
        document.getElementById('query-dsd').value = '';
        document.getElementById('query-gnd').value = '';
    } else if (targetId === 'query-dsd') {
        document.getElementById('query-gnd').value = '';
    }
    
    updateDropdownStates();
    applyAdvancedFilters();
}

function populateQueryDropdowns() {
    initQueryDropdowns();
}

function applyAdvancedFilters() {
    currentFilters.dis = document.getElementById('query-district').value;
    currentFilters.r = document.getElementById('query-risk').value;
    currentFilters.d = document.getElementById('query-dsd').value;
    currentFilters.g = document.getElementById('query-gnd').value;
    
    // Mapbox GL filter syntax (case insensitive match workaround)
    const filterArray = ['all'];
    
    if (currentFilters.dis) {
        // District field in MapLibre might be capitalized differently, check both raw and Title Case
        filterArray.push(['any', 
            ['==', ['get', 'District'], currentFilters.dis],
            ['==', ['upcase', ['coalesce', ['get', 'District'], '']], currentFilters.dis.toUpperCase()]
        ]);
    }
    
    if (currentFilters.r) {
        if (currentFilters.r === 'HR') {
            filterArray.push(['any', 
                ['in', 'HR', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                ['in', 'HR', ['upcase', ['coalesce', ['get', 'HR (Priority level)'], '']]],
                ['in', 'P1', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                ['in', 'HIGH', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
            ]);
        } else if (currentFilters.r === 'MR') {
            filterArray.push(['any', 
                ['in', 'MR', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                ['in', 'MEDIUM', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
            ]);
        } else if (currentFilters.r === 'LR') {
            filterArray.push(['any', 
                ['in', 'LR', ['upcase', ['coalesce', ['get', 'Risk level'], '']]],
                ['in', 'LOW', ['upcase', ['coalesce', ['get', 'Risk level'], '']]]
            ]);
        }
    }
    
    if (currentFilters.d) {
        // Because zero-width joiners and case mismatch might exist in the raw geojson properties
        // compared to the cleaned currentFilters.d, we use a regex or a very lenient string match if possible.
        // Mapbox GL JS does not have regex filters, but we can check if indexof the original cleaned is > -1,
        // however Mapbox expressions are tricky. The best approach is to fix the GeoJSON beforehand, 
        // but here we can try to compare against upcased DSD.
        // Wait, Mapbox doesn't support stripping characters dynamically.
        filterArray.push(['any', 
            ['==', ['get', 'DSD'], currentFilters.d],
            ['==', ['upcase', ['coalesce', ['get', 'DSD'], '']], currentFilters.d.toUpperCase()],
            ['==', ['downcase', ['coalesce', ['get', 'DSD'], '']], currentFilters.d.toLowerCase()]
        ]);
    }
    
    if (currentFilters.g) {
        filterArray.push(['any', 
            ['==', ['get', 'GND'], currentFilters.g],
            ['==', ['get', 'GND_Name'], currentFilters.g],
            ['==', ['upcase', ['coalesce', ['get', 'GND'], '']], currentFilters.g.toUpperCase()],
            ['==', ['upcase', ['coalesce', ['get', 'GND_Name'], '']], currentFilters.g.toUpperCase()]
        ]);
    }
    
    // Apply filter to map
    if (map.getLayer('inspection_points')) {
        map.setFilter('inspection_points', filterArray.length > 1 ? filterArray : null);
    }
    
    // Trigger viewport update so Executive Summary matches the filter!
    updateViewportStats();
}

// =====================================================
// LAYER LOADING SPINNER
// Show a small spinner on the toggle label while a
// lazy layer is being loaded for the first time
// =====================================================
(function() {
    const lazyLayers = [
        { toggleId: 'layer-inspection',    loaderFn: () => window.loadInspection && window.loadInspection(),     layerId: 'inspection_points' },
        { toggleId: 'layer-arg-locations', loaderFn: () => window.loadARGLayers && window.loadARGLayers(),       layerId: 'arg_locations_points' },
        { toggleId: 'layer-arg-thiessen',  loaderFn: () => window.loadARGLayers && window.loadARGLayers(),       layerId: 'arg_thiessen_fill' },
        { toggleId: 'layer-tiz',           loaderFn: () => window.loadTizzones && window.loadTizzones(),         layerId: 'tiz_zones_fill' },
        { toggleId: 'layer-tiz-50k',       loaderFn: () => window.loadTizzones50k && window.loadTizzones50k(),  layerId: 'tiz_50k_fill' },
        { toggleId: 'layer-satellite-ls',  loaderFn: () => window.loadSatelliteLs && window.loadSatelliteLs(),  layerId: 'satellite_polygons' },
        { toggleId: 'layer-contours',      loaderFn: () => window.loadContours && window.loadContours(),         layerId: 'contours_line' },

    ];

    lazyLayers.forEach(({ toggleId, loaderFn, layerId }) => {
        const checkbox = document.getElementById(toggleId);
        if (!checkbox) return;

        checkbox.addEventListener('change', function() {
            if (!this.checked) return;
            // Only add spinner if the layer isn't loaded yet
            if (map.getLayer(layerId)) return;

            const label = this.closest('.layer-toggle')?.querySelector('.layer-label');
            if (!label) return;

            // Add spinner
            const spinner = document.createElement('span');
            spinner.className = 'layer-loading-spinner';
            spinner.id = 'spinner-' + toggleId;
            label.appendChild(spinner);

            // Poll until layer exists (max 15s)
            let attempts = 0;
            const poll = setInterval(() => {
                attempts++;
                if (map.getLayer(layerId) || attempts > 150) {
                    clearInterval(poll);
                    const existing = label.querySelector('.layer-loading-spinner');
                    if (existing) existing.remove();
                }
            }, 100);
        });
    });
})();

