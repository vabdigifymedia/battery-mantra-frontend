import { useState, useCallback, useEffect, useRef } from "react";
import { Navigation, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

/** Default fallback: Indore, India */
const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 };
const DEFAULT_ZOOM = 15;

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [coords, setCoords] = useState(value ?? DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const updateCoordinates = useCallback((newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    onChange(newCoords);
  }, [onChange]);

  // Request GPS position
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
        updateCoordinates(newCoords);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 16, { animate: true });
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng]);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setGeoError("Location access denied. Please drag the pin on map.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [updateCoordinates]);

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

      // Auto-locate if no pre-existing value
      if (!value) {
        requestCurrentLocation();
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  return (
    <div className="mt-4 space-y-3">
      {/* Header + locate button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Pin Delivery Location</span>
          <span className="text-[11px] font-normal text-muted-foreground">(Drag pin or tap on map)</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={requestCurrentLocation}
          disabled={isLocating}
        >
          <Navigation className={`h-3.5 w-3.5 text-primary ${isLocating ? "animate-pulse" : ""}`} />
          {isLocating ? "Locating…" : "Use My Current Location"}
        </Button>
      </div>

      {geoError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
          {geoError}
        </p>
      )}

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="relative z-0 overflow-hidden rounded-xl border border-border shadow-sm w-full h-full min-h-[300px]"
        style={{ width: "100%" }}
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
