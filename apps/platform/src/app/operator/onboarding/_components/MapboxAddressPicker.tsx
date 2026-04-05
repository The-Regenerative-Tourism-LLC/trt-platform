"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { inputCls } from "./primitives";
import { getMapboxToken } from "./getMapboxToken";

import "mapbox-gl/dist/mapbox-gl.css";

interface GeoFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{ id: string; text: string; short_code?: string }>;
}

export interface PickedLocation {
  address: string;
  latitude: number;
  longitude: number;
  country?: string;
  region?: string;
}

interface Props {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  onSelect: (loc: PickedLocation) => void;
}

export function MapboxAddressPicker({
  initialAddress,
  initialLat,
  initialLng,
  onSelect,
}: Props) {
  // process.env.NEXT_PUBLIC_MAPBOX_TOKEN is inlined at build time — it may be
  // undefined if the variable was not present when Railway ran `next build`.
  // The server action fallback reads from the live runtime environment instead,
  // ensuring the token is always available regardless of build-time state.
  const [token, setToken] = useState<string | null>(
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null
  );

  const [input, setInput] = useState(initialAddress ?? "");
  const [suggestions, setSuggestions] = useState<GeoFeature[]>([]);
  const [open, setOpen] = useState(false);

  // coords drives the map — null means map is hidden
  const [coords, setCoords] = useState<[number, number] | null>(
    initialLat != null && initialLng != null ? [initialLng, initialLat] : null
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch the token from the server at runtime if it wasn't inlined at build time.
  useEffect(() => {
    if (token) return;
    getMapboxToken().then((t) => {
      if (t) setToken(t);
    });
  }, [token]);

  // ── Initialize / update map whenever coords change ──────────────────────────
  // The map container is only rendered when coords !== null, so by the time
  // this effect runs, mapContainerRef.current is guaranteed to be in the DOM.
  useEffect(() => {
    if (!coords || !token) return;

    let cancelled = false;

    (async () => {
      const mbgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapContainerRef.current) return;

      mbgl.accessToken = token;

      if (!mapRef.current) {
        // First time: create the map
        const map = new mbgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: coords,
          zoom: 12,
          interactive: false,
          attributionControl: false,
        });
        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) return;
          markerRef.current = new mbgl.Marker({ color: "#111827" })
            .setLngLat(coords)
            .addTo(map);
        });
      } else {
        // Subsequent coords: move the existing map
        mapRef.current.flyTo({ center: coords, zoom: 12, duration: 600 });
        markerRef.current?.remove();
        markerRef.current = new mbgl.Marker({ color: "#111827" })
          .setLngLat(coords)
          .addTo(mapRef.current);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, token]);

  // Destroy map on unmount
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Geocoding search ────────────────────────────────────────────────────────
  const handleInputChange = (val: string) => {
    setInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!token || val.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
          `${encodeURIComponent(val)}.json` +
          `?access_token=${token}&types=address,place&limit=5`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const features: GeoFeature[] = json.features ?? [];
        setSuggestions(features);
        setOpen(features.length > 0);
      } catch {
        // silently ignore network errors
      }
    }, 350);
  };

  const handleSelect = (feature: GeoFeature) => {
    const [lng, lat] = feature.center;
    setInput(feature.place_name);
    setOpen(false);
    setSuggestions([]);
    setCoords([lng, lat]); // triggers the map effect above

    let country: string | undefined;
    let region: string | undefined;
    for (const ctx of feature.context ?? []) {
      if (ctx.id.startsWith("country.")) country = ctx.text;
      if ((ctx.id.startsWith("district.") || ctx.id.startsWith("region.")) && !region) {
        region = ctx.text;
      }
    }

    onSelect({ address: feature.place_name, latitude: lat, longitude: lng, country, region });
  };

  return (
    <div className="space-y-3">
      {/* Autocomplete input */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Start typing an address…"
          className={inputCls}
          autoComplete="off"
        />

        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
            {suggestions.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={() => handleSelect(f)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors border-b border-border/30 last:border-0 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                <span>{f.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map preview — only rendered (and ref-attached) once coords exist */}
      {coords && token && (
        <div
          ref={mapContainerRef}
          className="w-full h-48 rounded-xl overflow-hidden border border-border"
        />
      )}
    </div>
  );
}
