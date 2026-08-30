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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [coords, setCoords] = useState(value ?? DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const updateCoordinates = useCallback((newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    onChangeRef.current(newCoords);
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
        updateCoordinates(newCoords);

        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        if (map && marker) {
          // Ensure tile layout is correct before flying
          map.invalidateSize();
          marker.setLatLng([newCoords.lat, newCoords.lng]);
          map.flyTo([newCoords.lat, newCoords.lng], 17, { animate: true, duration: 1.2 });
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
        let msg = "Location access denied. Please drag the pin on map.";
        if (err.code === 2) msg = "Location unavailable. Please drag the pin on map.";
        if (err.code === 3) msg = "Location request timed out. Try again.";
        setGeoError(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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

      // Fix Leaflet's classic modal/dialog rendering bug:
      // Container may have zero size during dialog open animation.
      // invalidateSize forces Leaflet to recalculate after animation completes.
      setTimeout(() => {
        if (map && isMounted) {
          map.invalidateSize();
        }
      }, 300);
      setTimeout(() => {
        if (map && isMounted) {
          map.invalidateSize();
        }
      }, 600);

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
    <div className="space-y-3">
      {/* Header + locate button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
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
          {isLocating ? "Locating…" : "Use My Location"}
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
