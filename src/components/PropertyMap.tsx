import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Precision = 'EXACT' | 'APPROXIMATE' | 'HIDDEN';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  precision: Precision;
  title?: string;
  className?: string;
}

const STREET_TILES: Record<'light' | 'dark', { url: string; attribution: string; subdomains?: string[] }> = {
  light: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles © Esri — Esri, Maxar, Earthstar Geographics, Esri Community Maps contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: ['a', 'b', 'c', 'd'],
  },
};

const SATELLITE_TILES = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles © Esri — Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, Aerogrid, IGN, IGP',
};

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42"><path d="M15 1C7.3 1 1 7.1 1 14.6 1 24.9 15 41 15 41s14-16.1 14-26.4C29 7.1 22.7 1 15 1z" fill="#0f766e" fill-opacity="0.92" stroke="#ffffff" stroke-width="2"/><circle cx="15" cy="14.5" r="5.5" fill="#14b8a6"/></svg>`;
const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="filter: drop-shadow(0 2px 3px rgb(0 0 0 / .35))">${PIN_SVG}</div>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -40],
});

export default function PropertyMap({ latitude, longitude, precision, title, className }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.TileLayer | null>(null);
  const satelliteRef = useRef(false);

  /* Street tiles for the current theme; if the dark source fails (offline/CSP), fall back to Esri light so the map is always shown. */
  const streetLayer = (map: L.Map): L.TileLayer => {
    const dark = document.documentElement.classList.contains('dark');
    const source = dark ? STREET_TILES.dark : STREET_TILES.light;
    const layer = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: 18,
      ...(source.subdomains ? { subdomains: source.subdomains } : {}),
    });
    if (dark) {
      layer.on('tileerror', () => {
        if (layerRef.current !== layer) return;
        layer.remove();
        layerRef.current = L.tileLayer(STREET_TILES.light.url, {
          attribution: STREET_TILES.light.attribution,
          maxZoom: 18,
        }).addTo(map);
      });
    }
    return layer;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
    layerRef.current = streetLayer(map);
    layerRef.current.addTo(map);
    map.setView([latitude, longitude], 14);

    if (precision === 'EXACT') {
      L.marker([latitude, longitude], { icon: PIN_ICON })
        .addTo(map)
        .bindPopup(title ?? '')
        .openPopup();
    } else {
      L.circle([latitude, longitude], {
        radius: 1200,
        color: '#0f766e',
        weight: 2,
        opacity: 0.7,
        fillColor: '#14b8a6',
        fillOpacity: 0.18,
      }).addTo(map);
    }

    mapRef.current = map;

    const onDarkChange = () => {
      if (satelliteRef.current) return;
      layerRef.current?.remove();
      layerRef.current = streetLayer(map);
      layerRef.current.addTo(map);
    };
    const observer = new MutationObserver(onDarkChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(containerRef.current);

    return () => {
      resize.disconnect();
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [latitude, longitude, precision, title]);

  const tileLayer = (satellite: boolean) => {
    if (layerRef.current) {
      layerRef.current.remove();
    }
    satelliteRef.current = satellite;
    layerRef.current = satellite
      ? L.tileLayer(SATELLITE_TILES.url, { attribution: SATELLITE_TILES.attribution, maxZoom: 18 })
      : streetLayer(mapRef.current!);
    layerRef.current.addTo(mapRef.current!);
    setTimeout(() => mapRef.current?.invalidateSize(), 180);
  };

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute right-2 top-2 z-[500] flex flex-col gap-1.5">
        <a
          href={`https://www.google.com/maps/dir//${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-gray-700 shadow ring-1 ring-black/5 transition hover:bg-gray-100 dark:bg-neutral-800 dark:text-gray-200 dark:ring-white/10"
          title="Directions"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        </a>
        <button
          type="button"
          onClick={() => tileLayer(!satelliteRef.current)}
          className="flex h-8 items-center gap-1.5 rounded-md bg-white px-2 text-[11px] font-semibold text-gray-700 shadow ring-1 ring-black/5 transition hover:bg-gray-100 dark:bg-neutral-800 dark:text-gray-200 dark:ring-white/10"
        >
          <span className="inline-block h-3 w-3 rounded-full align-middle" style={{ background: 'conic-gradient(from 0deg,#22c55e,#3b82f6,#f59e0b,#22c55e)' }} />
          {satelliteRef.current ? 'Map' : 'Satellite'}
        </button>
      </div>
    </div>
  );
}