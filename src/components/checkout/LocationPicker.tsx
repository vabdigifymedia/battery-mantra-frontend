import { useState, useCallback, useRef } from "react";
import { Navigation, MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { env } from "@/lib/utils/env";

const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 }; // Indore fallback
const DEFAULT_ZOOM = 15;

const libraries: ("places")[] = ["places"];

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [coords, setCoords] = useState(value ?? DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const updateCoordinates = useCallback((newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    onChangeRef.current(newCoords);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (!value) {
      requestCurrentLocation();
    }
  }, [value]);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      updateCoordinates({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, [updateCoordinates]);

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      updateCoordinates({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, [updateCoordinates]);

  const onLoadAutocomplete = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const newCoords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        updateCoordinates(newCoords);
        mapRef.current?.panTo(newCoords);
        mapRef.current?.setZoom(17);
      }
    }
  }, [updateCoordinates]);

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
        mapRef.current?.panTo(newCoords);
        mapRef.current?.setZoom(17);
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
  }, [updateCoordinates]);

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
        <p className="font-semibold mb-1">Failed to load Google Maps</p>
        <p>Please check your internet connection or API key configuration.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-muted rounded-xl border border-border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header + Search bar + locate button */}
      <div className="flex flex-col gap-3">
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
            className="h-8 gap-1.5 text-xs shrink-0"
            onClick={requestCurrentLocation}
            disabled={isLocating}
          >
            <Navigation className={`h-3.5 w-3.5 text-primary ${isLocating ? "animate-pulse" : ""}`} />
            {isLocating ? "Locating…" : "My Location"}
          </Button>
        </div>

        <div className="relative w-full">
          <Autocomplete
            onLoad={onLoadAutocomplete}
            onPlaceChanged={onPlaceChanged}
            options={{ componentRestrictions: { country: "in" } }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search your society, building, or landmark..."
                className="pl-9 h-10 w-full bg-background"
                onKeyDown={(e) => {
                  // Prevent form submission when pressing enter on autocomplete
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </div>
          </Autocomplete>
        </div>
      </div>

      {geoError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
          {geoError}
        </p>
      )}

      {/* Map container */}
      <div className="relative z-0 overflow-hidden rounded-xl border border-border shadow-sm w-full h-[350px]">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={coords}
          zoom={DEFAULT_ZOOM}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
          }}
        >
          <Marker
            position={coords}
            draggable={true}
            onDragEnd={onMarkerDragEnd}
            animation={window.google?.maps?.Animation?.DROP}
          />
        </GoogleMap>
      </div>

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
