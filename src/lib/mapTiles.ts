import L from 'leaflet';

const CARTO = 'https://{s}.basemaps.cartocdn.com';

/** Allow wide zoom-out (continental / multi-state); default view stays z11 regional. */
export const MAP_MIN_ZOOM = 3;
export const MAP_MAX_ZOOM = 20;

export type MapTheme = 'dark' | 'light' | 'satellite';

export interface MapTileSet {
  dark: L.TileLayer[];
  light: L.TileLayer[];
  satellite: L.TileLayer[];
}

const tileDefaults: L.TileLayerOptions = {
  minZoom: MAP_MIN_ZOOM,
  maxZoom: MAP_MAX_ZOOM,
  subdomains: 'abcd',
  crossOrigin: 'anonymous',
};

/** Leaflet ignores `className` in options — attach to the layer container on add. */
function createTileLayer(
  url: string,
  layerClass: string,
  options: L.TileLayerOptions = {},
): L.TileLayer {
  const layer = L.tileLayer(url, { ...tileDefaults, ...options });

  layer.on('add', function (this: L.TileLayer) {
    const container = this.getContainer();
    if (container) {
      L.DomUtil.addClass(container, layerClass);
    }
  });

  return layer;
}

/**
 * Dark: dark_nolabels + Voyager color + Carto dark Matter labels (original dark_all lettering).
 * Light: Voyager. Satellite: imagery + dark Matter labels (same lettering as dark theme).
 */
export function createMapTileSets(): MapTileSet {
  const darkBase = createTileLayer(
    `${CARTO}/dark_nolabels/{z}/{x}/{y}{r}.png`,
    'map-tile-dark-base',
  );

  const darkColor = createTileLayer(
    `${CARTO}/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png`,
    'map-tile-color-overlay',
  );

  const darkLabels = createTileLayer(
    `${CARTO}/dark_only_labels/{z}/{x}/{y}{r}.png`,
    'map-tile-dark-labels',
  );

  const light = createTileLayer(
    `${CARTO}/rastertiles/voyager/{z}/{x}/{y}{r}.png`,
    'map-tile-light',
  );

  const satellite = createTileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'map-tile-satellite',
    { maxZoom: 19 },
  );

  const satelliteLabels = createTileLayer(
    `${CARTO}/dark_only_labels/{z}/{x}/{y}{r}.png`,
    'map-tile-labels',
  );

  return {
    dark: [darkBase, darkColor, darkLabels],
    light: [light],
    satellite: [satellite, satelliteLabels],
  };
}

export function removeMapTileLayers(map: L.Map): void {
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer);
    }
  });
}

export function applyMapTheme(map: L.Map, tileSets: MapTileSet, theme: MapTheme): void {
  removeMapTileLayers(map);
  tileSets[theme].forEach((layer) => layer.addTo(map));
}

export function mapThemeBackground(theme: MapTheme): string {
  switch (theme) {
    case 'light':
      return '#ebe8e2';
    case 'satellite':
      return '#141414';
    default:
      return '#323640';
  }
}
