"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { Layers, ImageIcon } from "lucide-react";
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

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

function makeMarkerIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.75 14 22 14 22S28 23.75 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

type Report = {
  id: string;
  issueType: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
  aiSummary: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export function ReportsMap() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tileLayer, setTileLayer] = useState<TileLayerKey>("street");

  useEffect(() => {
    fetch("/api/reports/map")
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
          .map((report) => {
            const color = SEVERITY_COLORS[report.severity] ?? "#6b7280";
            const meta = ISSUE_TYPE_META[report.issueType] ?? ISSUE_TYPE_META.OTHER;
            const Icon = meta.icon;

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={makeMarkerIcon(color)}
              >
                <Popup minWidth={240} maxWidth={260}>
                  <div style={{ fontFamily: "inherit", width: 220 }}>
                    {/* Photo */}
                    {report.imageUrl ? (
                      <div
                        style={{
                          width: "100%",
                          height: 120,
                          borderRadius: 6,
                          overflow: "hidden",
                          marginBottom: 8,
                          background: "#f1f5f9",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={report.imageUrl}
                          alt="Problem photo"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: 70,
                          borderRadius: 6,
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                        }}
                      >
                        <ImageIcon style={{ width: 24, height: 24, color: "#94a3b8" }} />
                      </div>
                    )}

                    {/* Issue type */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: color + "22",
                          border: `1.5px solid ${color}`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon style={{ width: 12, height: 12, color }} />
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{meta.label}</span>
                    </div>

                    {/* Severity */}
                    <div style={{ marginBottom: 4 }}>
                      <SeverityBadge severity={report.severity} />
                    </div>

                    {/* Address */}
                    {report.address && (
                      <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                        {report.address}
                      </p>
                    )}

                    {/* AI summary */}
                    {report.aiSummary && (
                      <p style={{ fontSize: 11, color: "#475569", marginBottom: 6, lineHeight: 1.4 }}>
                        {report.aiSummary.length > 100
                          ? report.aiSummary.slice(0, 100) + "…"
                          : report.aiSummary}
                      </p>
                    )}

                    <Link
                      href={`/reports/${report.id}`}
                      style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
                    >
                      View full report →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Layer toggle */}
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
