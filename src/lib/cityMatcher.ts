import type { CityDto } from "@/types/dto";

/**
 * Common Indian city aliases, synonyms, and sub-regions mapped to standardized city identifiers.
 */
const CITY_ALIASES: Record<string, string[]> = {
  delhi: [
    "new delhi",
    "delhi ncr",
    "ncr",
    "south delhi",
    "north delhi",
    "west delhi",
    "east delhi",
    "central delhi",
    "dilli",
    "ndls",
  ],
  gurgaon: [
    "gurugram",
    "gurgoan",
    "gurgao",
    "gurgram",
    "dlf",
    "sohna",
    "manesar",
  ],
  noida: [
    "greater noida",
    "gr noida",
    "gautam buddha nagar",
    "gautam budh nagar",
    "gb nagar",
    "g b nagar",
    "noida extension",
    "noida ext",
  ],
  ghaziabad: [
    "gaziabad",
    "gaziyabad",
    "gzb",
    "sahibabad",
    "indirapuram",
    "vaishali",
    "vasundhara",
    "loni",
    "modinagar",
  ],
  faridabad: [
    "fbd",
    "ballabgarh",
    "ballabhgarh",
    "nit faridabad",
  ],
  bangalore: [
    "bengaluru",
    "blr",
  ],
  mumbai: [
    "bombay",
    "navi mumbai",
    "thane",
    "kalyan",
  ],
  hyderabad: [
    "secunderabad",
    "cyberabad",
    "hyd",
  ],
  kolkata: [
    "calcutta",
  ],
  chennai: [
    "madras",
  ],
  pune: [
    "poona",
    "pcmc",
    "pimpri",
    "chinchwad",
  ],
  jaipur: [
    "pink city",
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
 * Uses a multi-tiered pipeline:
 * 1. Exact normalized match
 * 2. Alias / synonym dictionary match
 * 3. Substring & word token overlap match
 * 4. Fuzzy Levenshtein match with typo tolerance
 */
export function matchCity(
  inputCity?: string | null,
  publicCities?: CityDto[] | null
): CityDto | null {
  if (!inputCity || !publicCities || publicCities.length === 0) return null;

  const cleanInput = normalizeCityName(inputCity);
  if (!cleanInput) return null;

  // Pre-normalize public city names
  const normalizedCities = publicCities.map((c) => ({
    city: c,
    cleanName: normalizeCityName(c.cityName),
  }));

  // --- PASS 1: Exact match on normalized name ---
  for (const item of normalizedCities) {
    if (item.cleanName === cleanInput) {
      return item.city;
    }
  }

  // --- PASS 2: Known Aliases & Synonyms ---
  for (const item of normalizedCities) {
    const key = item.cleanName;
    const aliases = CITY_ALIASES[key] || [];

    // Check if input equals an alias of this city
    if (aliases.includes(cleanInput)) {
      return item.city;
    }

    // Check if input alias matches city
    for (const [aliasKey, aliasList] of Object.entries(CITY_ALIASES)) {
      if (aliasKey === cleanInput && aliasList.includes(item.cleanName)) {
        return item.city;
      }
    }
  }

  // --- PASS 3: Word Token Overlap & Substring Containment ---
  const inputTokens = cleanInput.split(" ").filter((t) => t.length >= 3);

  for (const item of normalizedCities) {
    // Check if cleanInput contains the city name as a standalone word/phrase
    if (
      cleanInput.includes(item.cleanName) ||
      item.cleanName.includes(cleanInput)
    ) {
      return item.city;
    }

    // Check if any significant token in input matches city name
    for (const token of inputTokens) {
      if (token === item.cleanName) {
        return item.city;
      }
      // Check token against aliases
      const aliases = CITY_ALIASES[item.cleanName] || [];
      if (aliases.includes(token)) {
        return item.city;
      }
    }
  }

  // --- PASS 4: Fuzzy Levenshtein Typo Tolerance ---
  // Compare cleanInput and individual tokens against cleanName with max distance
  let bestMatch: CityDto | null = null;
  let highestScore = 0;

  for (const item of normalizedCities) {
    const target = item.cleanName;
    const maxLen = Math.max(cleanInput.length, target.length);

    // Dynamic distance threshold: 1 for short words (<=5), 2 for medium (6-10), 3 for long
    const allowedDist = target.length <= 5 ? 1 : target.length <= 10 ? 2 : 3;

    // Direct comparison
    const dist = levenshteinDistance(cleanInput, target);
    const score = (maxLen - dist) / maxLen;

    if (dist <= allowedDist && score >= 0.72) {
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item.city;
      }
    }

    // Also compare input tokens against target (e.g. "Noyda" in "Noyda Sec 62")
    for (const token of inputTokens) {
      const tokenDist = levenshteinDistance(token, target);
      const tokenScore = (Math.max(token.length, target.length) - tokenDist) / Math.max(token.length, target.length);
      const tokenAllowed = target.length <= 5 ? 1 : 2;

      if (tokenDist <= tokenAllowed && tokenScore >= 0.72) {
        if (tokenScore > highestScore) {
          highestScore = tokenScore;
          bestMatch = item.city;
        }
      }
    }
  }

  return bestMatch;
}
