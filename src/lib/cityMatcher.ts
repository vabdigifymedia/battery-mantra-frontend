import type { CityDto } from "@/types/dto";

/**
 * Serviceable cities and their verified aliases, sub-regions, and colloquial variations.
 * Specifically configured for Battery Mantra active operational cities:
 * Ghaziabad, Delhi, Faridabad, Modinagar, Lucknow, Kanpur, Ballabgarh, Bengaluru,
 * Agra, Meerut, Mathura, Bahadurgarh, Katra, Noida Extension, Greater Noida, Noida, Gurgaon.
 */
const CITY_ALIASES: Record<string, string[]> = {
  // --- Noida Tri-Zone (kept strictly separated) ---
  "noida": [
    "noida city",
    "gautam buddha nagar",
    "gautam budh nagar",
    "gb nagar",
    "g b nagar",
    "sector 62",
    "sector 18",
  ],
  "greater noida": [
    "gr noida",
    "gr. noida",
    "greaternoida",
    "greater noida authority",
    "pari chowk",
    "knowledge park",
    "surajpur",
    "kasna",
    "alpha",
    "beta",
    "gamma",
    "delta",
    "omega",
  ],
  "noida extension": [
    "noida ext",
    "noida extn",
    "noida-ext",
    "noidaextension",
    "greater noida west",
    "gr noida west",
    "gr. noida west",
    "gaur city",
    "char murti",
  ],

  // --- Delhi NCR Hubs ---
  "delhi": [
    "new delhi",
    "delhi ncr",
    "dilli",
    "south delhi",
    "north delhi",
    "west delhi",
    "east delhi",
    "central delhi",
    "ndls",
  ],
  "gurgaon": [
    "gurugram",
    "gurgoan",
    "gurgao",
    "gurgram",
    "manesar",
    "sohna",
    "dlf",
    "cyber city",
    "golf course road",
    "palam vihar",
  ],
  "ghaziabad": [
    "gaziabad",
    "gaziyabad",
    "gzb",
    "sahibabad",
    "indirapuram",
    "vaishali",
    "vasundhara",
    "loni",
    "raj nagar",
    "raj nagar extension",
    "crossings republik",
    "kavi nagar",
  ],
  "modinagar": [
    "modi nagar",
    "modinagr",
  ],
  "faridabad": [
    "fbd",
    "nit faridabad",
    "old faridabad",
    "faridabd",
  ],
  "ballabgarh": [
    "ballabhgarh",
    "balabgarh",
    "ballabgadh",
  ],
  "bahadurgarh": [
    "bahadur garh",
    "bahadurgadh",
  ],

  // --- Uttar Pradesh & Other Hubs ---
  "lucknow": [
    "lko",
    "lakhnau",
    "gomti nagar",
    "alambagh",
    "hazratganj",
    "indira nagar",
  ],
  "kanpur": [
    "knp",
    "cawnpore",
  ],
  "agra": [
    "taj nagari",
  ],
  "meerut": [
    "merut",
    "mrt",
  ],
  "mathura": [
    "vrindavan",
    "mathura vrindavan",
  ],

  // --- Jammu & Kashmir ---
  "katra": [
    "katra jammu",
    "vaishno devi",
    "vaishnodevi",
    "mata vaishno devi",
  ],

  // --- South Hub ---
  "bengaluru": [
    "bangalore",
    "blr",
    "whitefield",
    "koramangala",
    "electronic city",
    "indiranagar",
    "hsr layout",
  ],
};

/**
 * Strips punctuation, special characters, and extra spaces for clean comparison.
 */
export function normalizeCityName(name?: string | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[.,\-_/\\#+()$~%'":*?<>{}!@^&=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Returns string similarity ratio between 0 and 1.
 */
export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return (maxLen - dist) / maxLen;
}

/**
 * Matches an input address city against a list of serviceable public cities.
 *
 * CRITICAL RULE:
 * Candidate cities are sorted by string length DESCENDING so specific multi-word
 * cities ("greater noida", "noida extension", "ballabgarh", "modinagar") are
 * evaluated BEFORE shorter substrings ("noida", "delhi", etc.).
 */
export function matchCity(
  inputCity?: string | null,
  publicCities?: CityDto[] | null
): CityDto | null {
  if (!inputCity || !publicCities || publicCities.length === 0) return null;

  const cleanInput = normalizeCityName(inputCity);
  if (!cleanInput) return null;

  // Pre-normalize and sort candidates by length DESCENDING
  // This ensures "greater noida" and "noida extension" match before "noida"
  const normalizedCities = publicCities
    .map((c) => ({
      city: c,
      cleanName: normalizeCityName(c.cityName),
    }))
    .sort((a, b) => b.cleanName.length - a.cleanName.length);

  // --- PASS 1: Exact Match ---
  for (const item of normalizedCities) {
    if (item.cleanName === cleanInput) {
      return item.city;
    }
  }

  // --- PASS 2: Known Aliases & Specific Sub-region Dictionaries ---
  // Check multi-word aliases first, length-descending
  for (const item of normalizedCities) {
    const key = item.cleanName;
    const aliases = (CITY_ALIASES[key] || []).sort((a, b) => b.length - a.length);

    // Exact alias match
    if (aliases.includes(cleanInput)) {
      return item.city;
    }

    // Check if cleanInput contains any multi-word alias (e.g. "gaur city" in "gaur city 1")
    for (const alias of aliases) {
      if (cleanInput === alias || cleanInput.startsWith(alias + " ") || cleanInput.endsWith(" " + alias) || cleanInput.includes(" " + alias + " ")) {
        return item.city;
      }
    }

    // Reverse check: alias list mapping
    for (const [aliasKey, aliasList] of Object.entries(CITY_ALIASES)) {
      if (aliasKey === cleanInput && aliasList.includes(item.cleanName)) {
        return item.city;
      }
    }
  }

  // --- PASS 3: Phrase / Substring Containment (Multi-word before Single-word) ---
  for (const item of normalizedCities) {
    // Exact word boundary or full containment for multi-word cities
    if (item.cleanName.includes(" ")) {
      if (
        cleanInput === item.cleanName ||
        cleanInput.includes(item.cleanName)
      ) {
        return item.city;
      }
    } else {
      // Single-word cities (like "noida", "delhi"):
      // Only match if it's a discrete word, NOT preceded by "greater" or followed by "extension"
      const words = cleanInput.split(" ");
      const hasWord = words.includes(item.cleanName);

      if (hasWord) {
        // Guard against matching "noida" when the input actually mentions "greater noida" or "noida extension"
        if (item.cleanName === "noida") {
          const hasGreaterNoida = cleanInput.includes("greater noida") || cleanInput.includes("gr noida");
          const hasNoidaExt = cleanInput.includes("noida extension") || cleanInput.includes("noida ext") || cleanInput.includes("greater noida west");
          if (!hasGreaterNoida && !hasNoidaExt) {
            return item.city;
          }
        } else if (item.cleanName === "faridabad") {
          if (!cleanInput.includes("ballabgarh") && !cleanInput.includes("ballabhgarh")) {
            return item.city;
          }
        } else if (item.cleanName === "ghaziabad") {
          if (!cleanInput.includes("modinagar") && !cleanInput.includes("modi nagar")) {
            return item.city;
          }
        } else {
          return item.city;
        }
      }
    }
  }

  // --- PASS 4: Fuzzy Levenshtein Typo Tolerance ---
  let bestMatch: CityDto | null = null;
  let highestScore = 0;

  const inputTokens = cleanInput.split(" ").filter((t) => t.length >= 3);

  for (const item of normalizedCities) {
    const target = item.cleanName;
    const maxLen = Math.max(cleanInput.length, target.length);
    const allowedDist = target.length <= 5 ? 1 : target.length <= 10 ? 2 : 3;

    // Direct comparison
    const dist = levenshteinDistance(cleanInput, target);
    const score = (maxLen - dist) / maxLen;

    if (dist <= allowedDist && score >= 0.74) {
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item.city;
      }
    }

    // Token comparison for single-word targets (e.g. "Noyda" in "Noyda Sec 62")
    if (!target.includes(" ")) {
      for (const token of inputTokens) {
        // Skip token comparison if token is "greater" or "extension"
        if (token === "greater" || token === "extension") continue;

        const tokenDist = levenshteinDistance(token, target);
        const tokenMaxLen = Math.max(token.length, target.length);
        const tokenScore = (tokenMaxLen - tokenDist) / tokenMaxLen;
        const tokenAllowed = target.length <= 5 ? 1 : 2;

        if (tokenDist <= tokenAllowed && tokenScore >= 0.74) {
          // Guard for noida typos: if input contains "greater", don't match "noida"
          if (target === "noida" && (cleanInput.includes("greater") || cleanInput.includes("extension"))) {
            continue;
          }
          if (tokenScore > highestScore) {
            highestScore = tokenScore;
            bestMatch = item.city;
          }
        }
      }
    }
  }

  return bestMatch;
}
