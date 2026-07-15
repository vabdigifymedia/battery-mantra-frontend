export interface GeocodingResponse {
  address?: {
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  error?: string;
}

export const geocodingService = {
  reverseGeocode: async (lat: number, lon: number): Promise<string | null> => {
    try {
      // Using OpenStreetMap Nominatim API (Free, no key required)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          // Nominatim requires a valid user agent
          "User-Agent": "BatteryMantra/1.0",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch location data");
      }

      const data: GeocodingResponse = await response.json();
      
      if (data.address?.postcode) {
        return data.address.postcode;
      }
      
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  },
};
