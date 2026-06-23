/* ═══════════════════════════════════════════════════════════════════════════
   ORGANISM — RouteLayer
   Map overlay: computes the route via Routes API, draws polyline & markers.
   Pure Google Maps logic — no visible DOM output (returns null).
   ═══════════════════════════════════════════════════════════════════════════ */

// src/components/organisms/RouteLayer.tsx
"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { Location, RouteResult } from "@/components/types";

interface Props {
  locations: Location[];
  onResult: (r: RouteResult | null) => void;
}

export default function RouteLayer({ locations, onResult }: Props) {
  const map = useMap();
  const geometryLib = useMapsLibrary("geometry");
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || locations.length < 2 || !geometryLib) return;

    const [origin, ...rest] = locations;
    const destination = rest[rest.length - 1];
    const intermediates = rest.slice(0, -1);

    const fetchRoute = async () => {
      const res = await fetch("/api/route", {           // ← server-side proxy keeps key safe
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          intermediates: intermediates.map((l) => ({
            location: { latLng: { latitude: l.lat, longitude: l.lng } },
          })),
          travelMode: "DRIVE",
          optimizeWaypointOrder: intermediates.length > 0,
          routingPreference: "TRAFFIC_AWARE",
        }),
      });

      if (!res.ok) { console.error(await res.json()); onResult(null); return; }

      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) { onResult(null); return; }

      // Draw polyline
      polylineRef.current?.setMap(null);
      const path = google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
      polylineRef.current = new google.maps.Polyline({
        path, map,
        strokeColor: "#4285F4", strokeOpacity: 1, strokeWeight: 4, geodesic: true,
      });

      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds);

      onResult({
        encodedPolyline: route.polyline?.encodedPolyline ?? "",
        distanceMeters: route.distanceMeters,
        durationSeconds: parseInt(route.duration?.replace("s", "") ?? "0", 10),
        optimizedOrder: route.optimizedIntermediateWaypointIndex ?? [],
      });
    };

    fetchRoute();
    return () => polylineRef.current?.setMap(null);
  }, [map, locations, geometryLib]);

  return null;
}
