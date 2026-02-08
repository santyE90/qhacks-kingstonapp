"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { Issue } from "@/lib/types";

const iconRetinaUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

type Props = {
  issues: Issue[];
};

export default function IssueMap({ issues }: Props) {
  useEffect(() => {
    // Fix default marker icon paths in Next.js build.
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  const points = issues
    .filter((issue) => issue.latitude !== null && issue.longitude !== null)
    .map((issue) => ({
      ...issue,
      latitude: issue.latitude as number,
      longitude: issue.longitude as number,
    }));

  const center =
    points.length > 0
      ? [points[0].latitude, points[0].longitude]
      : [44.2312, -76.486]; // Kingston default

  return (
    <div className="surface-card overflow-hidden rounded-3xl">
      <MapContainer
        center={center as [number, number]}
        zoom={13}
        className="h-[360px] w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{issue.title}</p>
                <p className="text-xs">{issue.address}</p>
                <p className="text-xs text-muted">{issue.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
