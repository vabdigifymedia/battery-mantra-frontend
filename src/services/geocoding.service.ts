export interface GeocodingResponse {
  address?: {
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    town?: string;
    village?: string;
    county?: string;
    city_district?: string;
    state_district?: string;
    suburb?: string;
    municipality?: string;
  };
  city?: string;
  error?: string;
}

export const geocodingService = {
  reverseGeocodeCity: async (lat: number, lon: number): Promise<string | null> => {
    try {
      // Using OpenStreetMap Nominatim API (Free, no key required)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          // Nominatim requires a valid user agent
          "User-Agent": "BatteryMantra/1.0",
        },
      });

      if (response.ok) {
        const data: GeocodingResponse = await response.json();
        const addr = data.address;
        if (addr) {
          // For Indian satellite cities (Noida, Gurgaon, etc.), Nominatim often puts
          // the actual city name in state_district, city_district, or suburb instead of city.
          // We check the most specific field first, then fall back to broader ones.
          const cityName = 
            addr.city ||
            addr.town ||
            addr.city_district ||
            addr.state_district ||
            addr.municipality ||
            addr.village ||
            addr.suburb ||
            addr.county;

          if (cityName) {
            // Clean up common suffixes like " district", " tahsil"
            return cityName.replace(/\s+(district|tahsil)$/i, "").trim();
          }
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
