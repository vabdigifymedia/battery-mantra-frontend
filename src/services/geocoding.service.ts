export interface GeocodingResponse {
  address?: {
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    town?: string;
    village?: string;
    county?: string;
  };
  city?: string;
  error?: string;
}

export const geocodingService = {
  reverseGeocodeCity: async (lat: number, lon: number): Promise<string | null> => {
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

      if (response.ok) {
        const data: GeocodingResponse = await response.json();
        // Nominatim might return city, town, or village
        const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
        if (cityName) {
          return cityName;
        }
      }
      
      // Fallback: BigDataCloud API (Free, no key required)
      const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const fallbackResponse = await fetch(fallbackUrl);
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.city || fallbackData.locality) {
          return fallbackData.city || fallbackData.locality;
        }
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  },
};
