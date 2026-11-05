/**
 * Delivery Time Formatting Utilities
 * Handles flexible formats stored in DB such as:
 * - hours: "30-60 min", "1-2", "2-4", "4", "30-45 mins", "1-2 Hours"
 * - days: "0", "1", "2-3", "Same Day", "Tomorrow"
 */

export type DeliveryCutoffState = {
  hour: number;
  minute: number;
  isAfterCutoff: boolean;     // hour >= 19 (7:00 PM onwards)
  isBeforeMorning: boolean;   // hour < 9 (midnight to 8:59 AM)
  isOperationalHours: boolean; // 9 <= hour < 19 (9:00 AM to 6:59 PM)
};

/**
 * Returns current IST time state to coordinate 7:00 PM same-day cutoffs across PDP, cards, and checkout
 */
export function getDeliveryCutoffState(date = new Date()): DeliveryCutoffState {
  const istFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = istFormatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

  return {
    hour,
    minute,
    isAfterCutoff: hour >= 19,
    isBeforeMorning: hour < 9,
    isOperationalHours: hour >= 9 && hour < 19,
  };
}

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
  const { isAfterCutoff, isBeforeMorning } = getDeliveryCutoffState();

  if (/^today$/i.test(duration) || /hours?|mins?/i.test(duration)) {
    if (isAfterCutoff) {
      return "Delivery Tomorrow";
    }
    if (isBeforeMorning) {
      return "Delivery Today (from 10 AM)";
    }
    return `Delivery in ${duration}`;
  }

  if (/^tomorrow$/i.test(duration)) {
    return isAfterCutoff ? "Delivery in 2 Days" : "Delivery Tomorrow";
  }

  if (/^delivery/i.test(duration)) {
    return duration;
  }
  return `Delivery in ${duration}`;
}

/**
 * Product detail page main SLA (e.g. "Delivery by Today in 1-2 Hours", "Delivery by Tomorrow in 1-2 Hours")
 */
export function formatDeliveryDetailSla(hours?: string | number | null, days?: string | number | null): string {
  const h = cleanDeliveryString(hours);
  const d = cleanDeliveryString(days);
  const { isAfterCutoff, isBeforeMorning } = getDeliveryCutoffState();

  // If explicit multi-day SLA (e.g. 2 Days, 3 Days)
  if (d && !["0", "1", "today", "tomorrow"].includes(d.toLowerCase())) {
    const daysStr = /days?/i.test(d) ? d : `${d} Days`;
    return `Delivery within ${daysStr}`;
  }

  // If days is specifically 1 / Tomorrow
  if (d && (d === "1" || d.toLowerCase() === "tomorrow")) {
    return isAfterCutoff ? "Delivery by Day After Tomorrow" : "Delivery by Tomorrow";
  }

  // Same-day / hours-based delivery SLA
  const formattedHours = h && h !== "0" ? formatDeliveryTime(h, null) : "1-2 Hours";

  if (isAfterCutoff) {
    return `Delivery by Tomorrow in ${formattedHours}`;
  }

  if (isBeforeMorning) {
    return `Delivery by Today (Starts from 10:00 AM)`;
  }

  return `Delivery by Today in ${formattedHours}`;
}

/**
 * Returns time-aware helper subtitle for the delivery SLA box on PDP
 */
export function getDeliverySubText(): { text: string; isCutoff: boolean } {
  const { isAfterCutoff, isBeforeMorning } = getDeliveryCutoffState();

  if (isAfterCutoff) {
    return {
      text: "Same-day delivery closed (7:00 P.M. cutoff). Order now for delivery tomorrow.",
      isCutoff: true,
    };
  }

  if (isBeforeMorning) {
    return {
      text: "Order now for priority dispatch starting at 10:00 A.M. today.",
      isCutoff: false,
    };
  }

  return {
    text: "if ordered before 7:00 P.M. today (same-day delivery & installation)",
    isCutoff: false,
  };
}

/**
 * Floating mobile pill on product page (e.g. "Get it Today in 1-2 Hours", "Get it Tomorrow in 1-2 Hours")
 */
export function formatDeliveryPillText(hours?: string | number | null, days?: string | number | null): string {
  const h = cleanDeliveryString(hours);
  const d = cleanDeliveryString(days);
  const { isAfterCutoff, isBeforeMorning } = getDeliveryCutoffState();

  if (d && !["0", "1", "today", "tomorrow"].includes(d.toLowerCase())) {
    const daysStr = /days?/i.test(d) ? d : `${d} Days`;
    return `Get it in ${daysStr}`;
  }

  if (d && (d === "1" || d.toLowerCase() === "tomorrow")) {
    return isAfterCutoff ? "Get it Day After Tomorrow" : "Get it Tomorrow";
  }

  const formattedHours = h && h !== "0" ? formatDeliveryTime(h, null) : "1-2 Hours";

  if (isAfterCutoff) {
    return `Get it Tomorrow in ${formattedHours}`;
  }

  if (isBeforeMorning) {
    return `Get it Today (from 10:00 AM)`;
  }

  return `Get it Today in ${formattedHours}`;
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
