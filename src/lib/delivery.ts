/**
 * Delivery Time Formatting Utilities
 * Handles flexible formats stored in DB such as:
 * - hours: "30-60 min", "1-2", "2-4", "4", "30-45 mins", "1-2 Hours"
 * - days: "0", "1", "2-3", "Same Day", "Tomorrow"
 */

export function cleanDeliveryString(val?: string | number | null): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Parses and returns the normalized delivery duration text (e.g. "30-60 min", "1-2 Hours", "Tomorrow")
 */
export function formatDeliveryTime(hours?: string | number | null, days?: string | number | null): string {
  const h = cleanDeliveryString(hours);
  const d = cleanDeliveryString(days);

  if (h && h !== "0") {
    // If unit is already present in string (e.g. "30-60 min", "2 Hours", "45 mins")
    if (/hours?|hrs?|mins?|minutes?|days?/i.test(h)) {
      return h;
    }
    // Check if it's high numeric values like "30-60" or "45"
    const nums = h.match(/\d+/g)?.map(Number) || [];
    const isLikelyMinutes = nums.length > 0 && nums.every((n) => n >= 15);
    return isLikelyMinutes ? `${h} min` : `${h} Hours`;
  }

  if (d) {
    if (/days?/i.test(d)) {
      return d;
    }
    if (d === "0" || d.toLowerCase() === "today") {
      return "Today";
    }
    if (d === "1" || d.toLowerCase() === "tomorrow") {
      return "Tomorrow";
    }
    return `${d} Days`;
  }

  return "1-2 Hours";
}

/**
 * Delivery card strip text (e.g. "Delivery in 30-60 min", "Delivery Tomorrow", "Delivery in 1-2 Hours")
 */
export function formatDeliveryCardSla(hours?: string | number | null, days?: string | number | null): string {
  const duration = formatDeliveryTime(hours, days);
  if (/^today$/i.test(duration)) {
    return "Delivery Today";
  }
  if (/^tomorrow$/i.test(duration)) {
    return "Delivery Tomorrow";
  }
  if (/^delivery/i.test(duration)) {
    return duration;
  }
  return `Delivery in ${duration}`;
}

/**
 * Product detail page main SLA (e.g. "Delivery by Today in 1-2 Hours", "Delivery by Tomorrow", "Delivery within 2 Days")
 */
export function formatDeliveryDetailSla(hours?: string | number | null, days?: string | number | null): string {
  const h = cleanDeliveryString(hours);
  const d = cleanDeliveryString(days);

  if (h && h !== "0") {
    const formattedHours = formatDeliveryTime(h, null);
    return `Delivery by Today in ${formattedHours}`;
  }

  if (d) {
    if (d === "1" || d.toLowerCase() === "tomorrow") {
      return "Delivery by Tomorrow";
    }
    if (d === "0" || d.toLowerCase() === "today") {
      return "Delivery by Today";
    }
    const daysStr = /days?/i.test(d) ? d : `${d} Days`;
    return `Delivery within ${daysStr}`;
  }

  return "Delivery by Today in 1-2 Hours";
}

/**
 * Floating mobile pill on product page (e.g. "Get it Today in 1-2 Hours", "Get it Tomorrow")
 */
export function formatDeliveryPillText(hours?: string | number | null, days?: string | number | null): string {
  const h = cleanDeliveryString(hours);
  const d = cleanDeliveryString(days);

  if (h && h !== "0") {
    const formattedHours = formatDeliveryTime(h, null);
    return `Get it Today in ${formattedHours}`;
  }

  if (d) {
    if (d === "1" || d.toLowerCase() === "tomorrow") {
      return "Get it Tomorrow";
    }
    if (d === "0" || d.toLowerCase() === "today") {
      return "Get it Today";
    }
    const daysStr = /days?/i.test(d) ? d : `${d} Days`;
    return `Get it in ${daysStr}`;
  }

  return "Get it Today in 1-2 Hours";
}

/**
 * Formats city name label for delivery strip. E.g.
 * - Noida -> "Noida & Delhi NCR"
 * - Delhi -> "Delhi NCR"
 * - Agra -> "Agra"
 * - null/undefined -> "Noida & Delhi NCR"
 */
export function formatCityDeliveryLabel(cityName?: string | null): string {
  if (!cityName) return "Noida & Delhi NCR";
  const lower = cityName.trim().toLowerCase();
  if (lower === "delhi ncr" || lower === "delhi-ncr" || lower === "delhi" || lower === "new delhi") {
    return "Delhi NCR";
  }
  const isNcrCity = ["noida", "greater noida", "gurgaon", "gurugram", "ghaziabad", "faridabad"].some(
    (c) => lower.includes(c)
  );
  if (isNcrCity) {
    return `${cityName} & Delhi NCR`;
  }
  return cityName;
}

/**
 * Returns sensible default delivery SLA based on city:
 * - NCR / Major cities -> "1-2 Hours"
 * - Other cities -> "2-4 Hours"
 */
export function getDefaultDeliveryTime(cityName?: string | null): string {
  if (!cityName) return "1-2 Hours";
  const lower = cityName.trim().toLowerCase();
  const isNcrCity = ["delhi", "noida", "greater noida", "gurgaon", "gurugram", "ghaziabad", "faridabad"].some(
    (c) => lower.includes(c)
  );
  return isNcrCity ? "1-2 Hours" : "2-4 Hours";
}

/**
 * Returns formatted delivery duration string with fallback to city-specific default
 */
export function getDeliveryTimeText(
  hours?: string | number | null,
  days?: string | number | null,
  cityName?: string | null
): string {
  const h = cleanDeliveryString(hours);
  const d = cleanDeliveryString(days);
  if ((h && h !== "0") || d) {
    return formatDeliveryTime(hours, days);
  }
  return getDefaultDeliveryTime(cityName);
}
