import L from 'leaflet';

const CARTO = 'https://{s}.basemaps.cartocdn.com';

export type MapTheme = 'dark' | 'light' | 'satellite';

export interface MapTileSet {
  dark: L.TileLayer[];
  light: L.TileLayer[];
  satellite: L.TileLayer[];
}

const tileDefaults: L.TileLayerOptions = {
  maxZoom: 20,
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
 * Dark: Carto dark_all — white labels on dark background (no outline), plus color underlay.
 * Light: Voyager. Satellite: imagery + white labels.
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
    `${CARTO}/light_only_labels/{z}/{x}/{y}{r}.png`,
    'map-tile-labels',
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
    `${CARTO}/light_only_labels/{z}/{x}/{y}{r}.png`,
    'map-tile-labels',
    { opacity: 0.9 },
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
      return '#000000';
  }
}
