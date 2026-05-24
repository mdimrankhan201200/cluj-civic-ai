"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Navigation, Loader2, Layers } from "lucide-react";

const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
} as const;
type TileLayerKey = keyof typeof TILE_LAYERS;
import { useGeolocation } from "@/hooks/useGeolocation";

// Fix Leaflet default icon paths broken by webpack/turbopack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

type Props = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
};

function MapClickHandler({ onLocationChange }: { onLocationChange: Props["onLocationChange"] }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      let address: string | undefined;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "User-Agent": "ClujCivicAI/1.0 (contact@cluj-civic.ro)" } }
        );
        if (res.ok) {
          const data = await res.json() as { display_name?: string };
          address = data.display_name;
        }
      } catch {
        // proceed without address
      }
      onLocationChange(lat, lng, address);
    },
  });
  return null;
}

export function LocationPicker({ latitude, longitude, onLocationChange }: Props) {
  const { getLocation, latitude: gpsLat, longitude: gpsLng, isLoading, error } = useGeolocation();
  const [mounted, setMounted] = useState(false);
  const [tileLayer, setTileLayer] = useState<TileLayerKey>("street");

  useEffect(() => { setMounted(true); }, []);

  // When GPS coords arrive, reverse geocode and call parent
  useEffect(() => {
    if (!gpsLat || !gpsLng) return;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${gpsLat}&lon=${gpsLng}&format=json`,
      { headers: { "User-Agent": "ClujCivicAI/1.0 (contact@cluj-civic.ro)" } }
    )
      .then((r) => r.json())
      .then((data: { display_name?: string }) => {
        onLocationChange(gpsLat, gpsLng, data.display_name);
      })
      .catch(() => {
        onLocationChange(gpsLat, gpsLng);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsLat, gpsLng]);

  const center: [number, number] = [latitude ?? 46.7712, longitude ?? 23.6236];

  if (!mounted) return <div className="h-64 bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" size="sm" onClick={getLocation} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4 mr-2" />
        )}
        {isLoading ? "Detecting location..." : "Use my location"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-sm text-muted-foreground">
        Or click on the map to set the location manually.
      </p>

      <div className="relative rounded-lg overflow-hidden border border-border" style={{ height: 300 }}>
        <MapContainer center={center} zoom={latitude ? 16 : 13} className="h-full w-full">
          <TileLayer key={tileLayer} url={TILE_LAYERS[tileLayer].url} attribution={TILE_LAYERS[tileLayer].attribution} />
          {latitude && longitude && <Marker position={[latitude, longitude]} />}
          <MapClickHandler onLocationChange={onLocationChange} />
        </MapContainer>
        <button
          type="button"
          onClick={() => setTileLayer((t) => t === "street" ? "satellite" : "street")}
          className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 bg-white border border-gray-300 shadow-md rounded-md px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Layers className="h-3 w-3" />
          {tileLayer === "street" ? "Satellite" : "Street"} view
        </button>
      </div>

      {latitude && longitude && (
        <p className="text-xs text-muted-foreground">
          Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}
