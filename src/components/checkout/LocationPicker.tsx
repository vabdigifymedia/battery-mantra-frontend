import { useState, useCallback, useEffect, useRef } from "react";
import { Navigation, MapPin, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "leaflet/dist/leaflet.css";

/** Default fallback: Indore, India */
const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 };
const DEFAULT_ZOOM = 15;

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

interface SearchSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [coords, setCoords] = useState(value ?? DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  const updateCoordinates = useCallback((newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    onChangeRef.current(newCoords);
  }, []);

  // Move map & marker to a location
  const flyToLocation = useCallback((lat: number, lng: number, zoom = 17) => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      map.invalidateSize();
      marker.setLatLng([lat, lng]);
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
    }
    updateCoordinates({ lat, lng });
  }, [updateCoordinates]);

  // Search places using Nominatim API (free, no key)
  const searchPlaces = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "BatteryMantra/1.0",
        },
      });
      if (res.ok) {
        const data: SearchSuggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (err) {
      console.warn("Place search failed:", err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search on input change
  const handleSearchInput = useCallback((val: string) => {
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      searchPlaces(val);
    }, 400);
  }, [searchPlaces]);

  // Handle suggestion click
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    flyToLocation(lat, lng, 17);
    setSearchQuery(suggestion.display_name.split(",").slice(0, 2).join(","));
    setShowSuggestions(false);
    setSuggestions([]);
  }, [flyToLocation]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Request GPS position — always fresh, no cache
  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        flyToLocation(newCoords.lat, newCoords.lng, 17);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
        let msg = "Location access denied. Please drag the pin or search.";
        if (err.code === 2) msg = "Location unavailable. Please search or drag the pin.";
        if (err.code === 3) msg = "Location request timed out. Try again.";
        setGeoError(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [flyToLocation]);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const leafletModule = await import("leaflet");
      const L = leafletModule.default || leafletModule;

      if (!isMounted || !mapContainerRef.current) return;

      // Custom Red Pin SVG icon
      const customPinIcon = L.divIcon({
        className: "custom-map-marker",
        html: `
          <div style="transform: translate(-50%, -100%); cursor: grab;">
            <svg width="34" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C7.58 0 4 3.58 4 8C4 13.5 12 24 12 24C12 24 20 13.5 20 8C20 3.58 16.42 0 12 0Z" fill="#dc2626"/>
              <circle cx="12" cy="8" r="3.5" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
      });

      const initialLat = coords.lat;
      const initialLng = coords.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        const next = { lat: position.lat, lng: position.lng };
        updateCoordinates(next);
      });

      map.on("click", (e: any) => {
        const next = { lat: e.latlng.lat, lng: e.latlng.lng };
        marker.setLatLng([next.lat, next.lng]);
        updateCoordinates(next);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Fix Leaflet's classic modal/dialog rendering bug
      setTimeout(() => { if (map && isMounted) map.invalidateSize(); }, 300);
      setTimeout(() => { if (map && isMounted) map.invalidateSize(); }, 600);

      // Auto-locate if no pre-existing value
      if (!value) {
        requestCurrentLocation();
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  return (
    <div className="space-y-3">
      {/* Search bar + locate button */}
      <div className="flex items-center gap-2 flex-wrap">
        <div ref={searchWrapperRef} className="relative flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search location... (e.g. Noida Sector 62)"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 flex items-start gap-2"
                  onClick={() => handleSuggestionSelect(s)}
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="line-clamp-2 text-foreground/90">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs shrink-0"
          onClick={requestCurrentLocation}
          disabled={isLocating}
        >
          <Navigation className={`h-3.5 w-3.5 text-primary ${isLocating ? "animate-pulse" : ""}`} />
          {isLocating ? "Locating…" : "My Location"}
        </Button>
      </div>

      {geoError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
          {geoError}
        </p>
      )}

      {/* Map container — explicit height is REQUIRED for Leaflet */}
      <div
        ref={mapContainerRef}
        className="relative z-0 overflow-hidden rounded-xl border border-border shadow-sm w-full"
        style={{ height: 350, width: "100%" }}
      />

      {/* Coordinates display */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p className="tabular-nums">
          📍 Lat: <span className="font-semibold text-foreground">{coords.lat.toFixed(5)}</span>
          {" · "}
          Lng: <span className="font-semibold text-foreground">{coords.lng.toFixed(5)}</span>
        </p>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          ✓ Precision Delivery Enabled
        </span>
      </div>
    </div>
  );
}
