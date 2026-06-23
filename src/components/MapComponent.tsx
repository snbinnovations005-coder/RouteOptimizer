/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE — MapComponent
   Top-level composition of organisms. Manages state and wires everything.

   Atomic Design Hierarchy:
     ION     → tokens.css  (pseudo-classes, design tokens, stroke tags)
     ATOM    → NumberBadge, StatusTag, TextInput, ActionButton
     MOLECULE→ LocationSlot, StatCard, StopListItem
     ORGANISM→ InputPanel, ResultPanel, RouteLayer
     TEMPLATE→ THIS FILE (MapComponent)
   ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useState, useCallback } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { SLOT_COUNT } from "@/components/ions";
import { InputPanel, ResultPanel, RouteLayer } from "@/components/organisms";
import { parseGoogleMapsLink } from "@/components/utils";
import type { Location, RouteResult } from "@/components/types";

// ─── Main exported component ─────────────────────────────────────────────────

const TEST_LINKS = [
  "https://www.google.com/maps/place/SVP+Hospital/@23.018501,72.573767,4150m/data=!3m1!1e3!4m6!3m5!1s0x395e85c8293d8927:0xbecb51a51b50d4c1!8m2!3d23.0196776!4d72.5717022!16s%2Fg%2F11hfxw5srj?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=d17cbd66-62a3-46da-a16c-2a111efd9af7",
  "https://www.google.com/maps/place/Maninagar,+Ahmedabad,+Gujarat,+India/@22.9927574,72.5940799,4151m/data=!3m2!1e3!4b1!4m6!3m5!1s0x395e85c2e335ed6b:0xd19a77c6688f5c9b!8m2!3d22.995165!4d72.604097!16zL20vMDRfMXo1?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=a59f8a32-46f9-449c-8db9-979ea316d4d2",
  "https://www.google.com/maps/place/Ghodasar,+Ahmedabad,+Gujarat,+India/@22.9746608,72.6128512,2076m/data=!3m2!1e3!4b1!4m6!3m5!1s0x395e8f5590ffcd7d:0x4b0554bef6153a98!8m2!3d22.9755494!4d72.6154686!16s%2Fg%2F1ywqfdw4h?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=2a432f3a-8eb3-4af6-866f-dfc0bd264a70",
  "https://www.google.com/maps/place/Deepmala+Bunglows/@22.9792425,72.6148159,1038m/data=!3m2!1e3!4b1!4m6!3m5!1s0x395e8600f101fa05:0x6f30e0c451108516!8m2!3d22.9792376!4d72.6173908!16s%2Fg%2F11bw1h3f12?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=7a41796c-5700-4835-a429-baebcb516627",
  "https://www.google.com/maps/place/Ahuja+Career+Institute/@22.996676,72.601282,1038m/data=!3m2!1e3!4b1!4m6!3m5!1s0x395e850db752415b:0x3b5f502462ebb8b7!8m2!3d22.9966711!4d72.6038569!16s%2Fg%2F11hdng_slz?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=738cdf3a-d767-4c95-9365-9e5c22510de7",
  "https://www.google.com/maps/place/ALLEN+Career+Institute+-+Maninagar+Campus+%7C+IIT+JEE,+NEET+%26+Foundation+Coaching/@22.9948243,72.6067605,1038m/data=!3m2!1e3!4b1!4m6!3m5!1s0x395e85e0d5b6f865:0xd03cd47c2a90a5aa!8m2!3d22.9948194!4d72.6093354!16s%2Fg%2F11b7gt21b8?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=274ee0ad-e739-475f-9ee9-066f9f9770d2",
  "https://www.google.com/maps/place/Uttam+Nagar+Garden/@22.9948243,72.6067605,1038m/data=!3m1!1e3!4m6!3m5!1s0x395e85e685cd2e0b:0xe1ec3b70f2f3d8a4!8m2!3d22.9922221!4d72.6066817!16s%2Fg%2F1tczyxvm?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=99aa1b3a-8d30-4ebb-8fa2-bb114dcaff91",
  "https://www.google.com/maps/place/L+G+HOSPITAL/@22.9948243,72.6067605,1038m/data=!3m1!1e3!4m6!3m5!1s0x395e858896d0a3f3:0xf9d96166a308cc2c!8m2!3d22.9984336!4d72.6042512!16s%2Fg%2F11l66311vz?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=47251e0b-9433-40f1-a204-4b4cd6300ee8",
  "https://www.google.com/maps/place/Physics+Wallah+Vidyapeeth+Coaching+Center+Maninagar+%7C+Foundation+Classes/@22.9933608,72.6046244,2615m/data=!3m1!1e3!4m6!3m5!1s0x395e85a50a6845b3:0x1dcbced0f8693ee7!8m2!3d22.994415!4d72.607594!16s%2Fg%2F11xlgdpq67?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=999d56ac-bd75-4432-8767-4b4999bd309b",
  "https://www.google.com/maps/place/Bank+of+Baroda/@22.9941995,72.6158958,163m/data=!3m1!1e3!4m6!3m5!1s0x395e85e75a38a2b3:0x6b946be7cc8f218d!8m2!3d22.9944798!4d72.6166988!16s%2Fg%2F1q5bncxym?entry=tts&g_ep=EgoyMDI2MDYxNi4wIPu8ASoASAFQAw%3D%3D&skid=33ee665a-1dea-46b0-a5fd-b627531d257f"
];

export default function MapComponent({ apiKey }: { apiKey: string }) {
  const [inputs, setInputs] = useState<string[]>(
    Array.from({ length: SLOT_COUNT }, (_, i) => TEST_LINKS[i] || "")
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>(Array(SLOT_COUNT).fill(null));
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [computing, setComputing] = useState(false);

  /* ── Handlers ──────────────────────────────────────────────────────────── */

  const handleInput = (idx: number, value: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    setErrors((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const handleOptimize = async () => {
    setComputing(true);
    const newErrors: (string | null)[] = Array(SLOT_COUNT).fill(null);
    const parsed: Location[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const raw = inputs[i];
      if (!raw.trim()) continue;

      let linkToParse = raw;
      if (raw.includes("maps.app.goo.gl") || raw.includes("goo.gl/maps")) {
        try {
          const res = await fetch("/api/expand", {
            method: "POST",
            body: JSON.stringify({ url: raw }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) linkToParse = data.url;
          }
        } catch (e) {
          console.error("Failed to expand short link", e);
        }
      }

      const result = parseGoogleMapsLink(linkToParse);
      if (!result) {
        newErrors[i] = "Could not extract coordinates from this link.";
      } else {
        parsed.push({ id: String(i), raw, ...result });
      }
    }

    setErrors(newErrors);

    if (parsed.length < 2) {
      alert("Please provide at least 2 valid locations.");
      setComputing(false);
      return;
    }

    setLocations(parsed);
  };

  const handleClear = () => {
    setInputs(Array(SLOT_COUNT).fill(""));
    setErrors(Array(SLOT_COUNT).fill(null));
    setLocations([]);
    setRouteResult(null);
    setComputing(false);
  };

  const handleResult = useCallback((r: RouteResult | null) => {
    setRouteResult(r);
    setComputing(false);
  }, []);

  /* ── Compute ordered locations for result panel ────────────────────────── */

  const orderedLocations = (() => {
    if (!routeResult || locations.length < 2) return [];
    const [origin, ...rest] = locations;
    const destination = rest[rest.length - 1];
    const intermediates = rest.slice(0, -1);
    const { optimizedOrder } = routeResult;

    if (optimizedOrder.length > 0 && intermediates.length > 0) {
      return [origin, ...optimizedOrder.map((i) => intermediates[i]), destination];
    }
    return locations;
  })();

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-500 p-8 text-center">
        <p className="text-lg font-medium">
          Please set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
        {/* ── Left Panel ── */}
        <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[85vh] pr-1">
          <InputPanel
            inputs={inputs}
            errors={errors}
            computing={computing}
            onInputChange={handleInput}
            onOptimize={handleOptimize}
            onClear={handleClear}
          />

          {routeResult && (
            <ResultPanel
              result={routeResult}
              orderedLocations={orderedLocations}
            />
          )}
        </div>

        {/* ── Right Panel: Map ── */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 min-h-[400px]">
          <Map
            defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
            defaultZoom={5}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="route-optimizer-map"
          >
            <RouteLayer locations={locations} onResult={handleResult} />
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
