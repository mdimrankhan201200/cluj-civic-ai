"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { Layers } from "lucide-react";
import { ISSUE_TYPE_META } from "@/lib/issue-type-meta";

const TILE_LAYERS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
} as const;

type TileLayerKey = keyof typeof TILE_LAYERS;

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
  POTHOLE: "Pothole",
  BROKEN_ROAD: "Broken road",
  SIDEWALK_DAMAGE: "Sidewalk damage",
  OVERFLOWING_BIN: "Overflowing bin",
  GARBAGE: "Illegal garbage",
  BROKEN_STREET_LIGHT: "Broken street light",
  WATER_LEAKAGE: "Water leakage",
  TRAFFIC_SIGN_DAMAGE: "Traffic sign damage",
  CONSTRUCTION_HAZARD: "Construction hazard",
  ROAD_CRACK: "Road crack",
  OTHER: "Other",
};

type Report = {
  id: string;
  issueType: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
  aiSummary: string | null;
  createdAt: string;
};

export function ReportsMap() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tileLayer, setTileLayer] = useState<TileLayerKey>("street");

  useEffect(() => {
    fetch("/api/reports?limit=200")
      .then((r) => r.json())
      .then((data: { data: Report[] }) => {
        setReports(data.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }

  const active = TILE_LAYERS[tileLayer];
  const other = tileLayer === "street" ? "satellite" : "street";

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[46.7712, 23.6236]}
        zoom={13}
        className="w-full h-full rounded-lg"
      >
        <TileLayer key={tileLayer} url={active.url} attribution={active.attribution} />
        {reports
          .filter((r) => r.status !== "REJECTED")
          .map((report) => (
            <CircleMarker
              key={report.id}
              center={[report.latitude, report.longitude]}
              radius={10}
              pathOptions={{
                fillColor: SEVERITY_COLORS[report.severity] ?? "#6b7280",
                fillOpacity: 0.85,
                color: "#fff",
                weight: 2,
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const meta = ISSUE_TYPE_META[report.issueType] ?? ISSUE_TYPE_META.OTHER;
                      const Icon = meta.icon;
                      return (
                        <>
                          <span className={`p-1 rounded-full ${meta.bg}`}>
                            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          </span>
                          <p className="font-semibold text-sm">{meta.label}</p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    <SeverityBadge severity={report.severity} />
                  </div>
                  {report.aiSummary && (
                    <p className="text-xs text-gray-600 line-clamp-2">{report.aiSummary}</p>
                  )}
                  <Link
                    href={`/reports/${report.id}`}
                    className="text-xs text-blue-600 hover:underline block"
                  >
                    View details →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Layer toggle button — sits above the map */}
      <button
        onClick={() => setTileLayer(other)}
        className="absolute bottom-6 left-4 z-[1000] flex items-center gap-1.5 bg-white border border-gray-300 shadow-md rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Layers className="h-3.5 w-3.5" />
        {TILE_LAYERS[other].label} view
      </button>
    </div>
  );
}
