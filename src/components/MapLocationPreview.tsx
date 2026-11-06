import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Layers } from 'lucide-react';

interface MapLocationPreviewProps {
  coordinates: { lat: number; lng: number } | null;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export const MapLocationPreview: React.FC<MapLocationPreviewProps> = ({
  coordinates,
  street,
  city,
  postalCode,
  country,
}) => {
  const [zoom, setZoom] = useState<number>(15);
  const [mapStyle, setMapStyle] = useState<'standard' | 'humanitarian'>('standard');

  const defaultCoords = { lat: 37.7749, lng: -122.4194 }; // SF default
  const activeLat = coordinates?.lat ?? defaultCoords.lat;
  const activeLng = coordinates?.lng ?? defaultCoords.lng;
  const hasCustomCoords = Boolean(coordinates);

  // Compute bounding box for OpenStreetMap static iframe embed
  const delta = 0.005 * Math.pow(2, 15 - zoom);
  const minLng = (activeLng - delta).toFixed(5);
  const maxLng = (activeLng + delta).toFixed(5);
  const minLat = (activeLat - delta).toFixed(5);
  const maxLat = (activeLat + delta).toFixed(5);

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${activeLat}%2C${activeLng}`;
  const externalOsmLink = `https://www.openstreetmap.org/?mlat=${activeLat}&mlon=${activeLng}#map=${zoom}/${activeLat}/${activeLng}`;

  return (
    <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Delivery Pin Location
            </h4>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {hasCustomCoords
                ? `${activeLat.toFixed(5)}°N, ${activeLng.toFixed(5)}°W`
                : 'Awaiting address lookup'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(18, z + 1))}
              className="px-2 py-0.5 hover:bg-slate-100 rounded text-slate-700 font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(12, z - 1))}
              className="px-2 py-0.5 hover:bg-slate-100 rounded text-slate-700 font-bold"
              title="Zoom Out"
            >
              −
            </button>
          </div>

          <a
            href={externalOsmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Open Full Map"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-52 bg-slate-100">
        <iframe
          title="OpenStreetMap Location"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src={osmUrl}
          className="w-full h-full"
        />

        {/* Center overlay pin banner */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2 shadow-xs flex items-center justify-between text-xs">
          <div className="truncate mr-2">
            <div className="font-semibold text-slate-900 truncate">
              {street || 'Target Street'}
            </div>
            <div className="text-slate-500 text-[11px] truncate">
              {[city, postalCode, country].filter(Boolean).join(', ') || 'Pending lookup'}
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
            <Navigation className="w-3 h-3" />
            Verified Pin
          </span>
        </div>
      </div>
    </div>
  );
};
