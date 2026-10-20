import { City } from '../types.ts';

/**
 * Open-Meteo Geocoding raw result object.
 */
export interface OpenMeteoRawCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  admin4_id?: number;
  timezone?: string;
  population?: number;
  country_id?: number;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  postcodes?: string[];
}

export interface CitySearchResult extends City {
  id: number;
  population?: number;
  feature_code?: string;
  secondaryText: string;
}

/**
 * Allowed feature codes: Only real cities, towns and villages (populated places).
 * Excludes:
 * - PPLX (city sections, neighbourhoods, boroughs)
 * - PPLH, PPLQ, PPLW, PPLCH, PPLR, PPLF
 * - Administrative regions (ADM1, ADM2, ADMD)
 * - Mountains (MT), streams (STM), airports (AIRP), hotels (HTL), stations, etc.
 */
export const ALLOWED_FEATURE_CODES = new Set([
  'PPL',   // Populated place (standard city, town, village)
  'PPLA',  // Seat of a first-order administrative division (state/province/oblast capital)
  'PPLA2', // Seat of a second-order administrative division (district/raion center)
  'PPLA3', // Seat of a third-order administrative division
  'PPLA4', // Seat of a fourth-order administrative division
  'PPLC',  // Capital of a political entity (national capital)
]);

/**
 * Words that mark a street, district or other non-city object.
 * A result is dropped if its name equals one of these or starts with one
 * (e.g. "Улица", "улица Ленина", "Микрорайон 5").
 */
const NON_CITY_WORDS = [
  'улица', 'ул', 'переулок', 'пер', 'проспект', 'пр-кт', 'шоссе', 'площадь',
  'бульвар', 'набережная', 'проезд', 'тупик', 'аллея', 'тракт', 'дорога',
  'микрорайон', 'мкр', 'квартал', 'район', 'массив', 'посёлок при', 'остановка',
  'станция', 'разъезд', 'платформа', 'километр', 'километра', 'кордон',
  'street', 'st', 'avenue', 'road', 'district', 'quarter',
];

export function isNonCityName(name: string): boolean {
  const n = (name || '').trim().toLowerCase().replace(/\./g, '');
  if (!n) return true;
  return NON_CITY_WORDS.some((w) => n === w || n.startsWith(w + ' '));
}

/**
 * Filters results to keep only valid populated places.
 * Small villages with 0 or missing population are kept.
 */
export function filterPopulatedPlaces(cities: OpenMeteoRawCity[]): OpenMeteoRawCity[] {
  return cities.filter((city) => {
    if (!city.feature_code) return false;
    if (!ALLOWED_FEATURE_CODES.has(city.feature_code)) return false;
    return !isNonCityName(city.name);
  });
}

/**
 * Deduplicates results: Two results are considered duplicates if they share
 * the same normalized name + admin1 + country. Keeps only the first occurrence.
 */
export function deduplicateCities(cities: OpenMeteoRawCity[]): OpenMeteoRawCity[] {
  const seen = new Set<string>();
  const unique: OpenMeteoRawCity[] = [];

  for (const city of cities) {
    const normName = (city.name || '').trim().toLowerCase();
    const normAdmin1 = (city.admin1 || '').trim().toLowerCase();
    const normCountry = (city.country || '').trim().toLowerCase();
    const key = `${normName}|${normAdmin1}|${normCountry}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(city);
    }
  }

  return unique;
}

/**
 * Sorts results so that the most relevant come first:
 * 1. exact name match with the query
 * 2. name starts with the query
 * 3. larger population first (missing population = 0)
 * Stable for ties, so the original API order is preserved.
 */
export function sortCitiesByRelevance(
  cities: OpenMeteoRawCity[],
  query: string
): OpenMeteoRawCity[] {
  const q = query.trim().toLowerCase();
  const rank = (c: OpenMeteoRawCity) => {
    const n = (c.name || '').trim().toLowerCase();
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    return 2;
  };
  return [...cities].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return (b.population ?? 0) - (a.population ?? 0);
  });
}

/**
 * Builds the secondary line for each result item:
 * - Uses admin1 and country, e.g. "Республика Дагестан, Россия"
 * - If admin1 is missing, shows only country
 * - If admin1 equals name, shows only country
 * - If two kept results still look identical, adds admin2 to disambiguate.
 * - Never shows coordinates, feature codes, or technical information.
 */
export function formatCityResults(cities: OpenMeteoRawCity[]): CitySearchResult[] {
  // Step 1: Compute candidate base secondary text for each item
  const baseSecondaryList = cities.map((city) => {
    const hasAdmin1 = Boolean(
      city.admin1 && city.admin1.trim().toLowerCase() !== city.name.trim().toLowerCase()
    );
    const parts: string[] = [];
    if (hasAdmin1 && city.admin1) {
      parts.push(city.admin1.trim());
    }
    if (city.country && city.country.trim()) {
      parts.push(city.country.trim());
    }
    return parts.join(', ');
  });

  // Step 2: Detect collisions (same name AND same baseSecondaryText in the kept list)
  const collisionKeys = new Set<string>();
  const seenKeys = new Set<string>();

  cities.forEach((city, index) => {
    const key = `${city.name.trim().toLowerCase()}||${baseSecondaryList[index].toLowerCase()}`;
    if (seenKeys.has(key)) {
      collisionKeys.add(key);
    } else {
      seenKeys.add(key);
    }
  });

  // Step 3: Format final secondary line, adding admin2 if colliding
  return cities.map((city, index) => {
    const key = `${city.name.trim().toLowerCase()}||${baseSecondaryList[index].toLowerCase()}`;
    const isColliding = collisionKeys.has(key);

    let secondaryText = baseSecondaryList[index];

    if (
      isColliding &&
      city.admin2 &&
      city.admin2.trim().toLowerCase() !== city.name.trim().toLowerCase()
    ) {
      const parts: string[] = [];
      const hasAdmin1 = Boolean(
        city.admin1 && city.admin1.trim().toLowerCase() !== city.name.trim().toLowerCase()
      );
      if (hasAdmin1 && city.admin1) {
        parts.push(city.admin1.trim());
      }
      parts.push(city.admin2.trim());
      if (city.country && city.country.trim()) {
        parts.push(city.country.trim());
      }
      secondaryText = parts.join(', ');
    }

    return {
      id: city.id,
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone || 'UTC',
      region: city.admin1,
      admin1: city.admin1,
      admin2: city.admin2,
      country: city.country,
      population: city.population,
      feature_code: city.feature_code,
      secondaryText,
    };
  });
}

const citySearchMemoryCache = new Map<string, CitySearchResult[]>();

/**
 * Searches cities via Open-Meteo Geocoding API with in-memory caching:
 * 1. Checks in-memory cache for normalized query (lowercase, trimmed)
 * 2. Fetches up to 30 raw results if not cached
 * 3. Filters strictly for populated places (PPL*)
 * 4. Deduplicates by name + admin1 + country
 * 5. Sorts by relevance: exact name, then prefix, then population
 * 6. Returns and caches up to 8 formatted results
 */
export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<CitySearchResult[]> {
  const normalizedKey = query.trim().toLowerCase();
  if (normalizedKey.length < 2) {
    return [];
  }

  if (citySearchMemoryCache.has(normalizedKey)) {
    return citySearchMemoryCache.get(normalizedKey)!;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=30&language=ru&format=json`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`Ошибка поиска: ${res.status}`);
  }

  const data = await res.json();
  if (!data.results || !Array.isArray(data.results)) {
    citySearchMemoryCache.set(normalizedKey, []);
    return [];
  }

  const populated = filterPopulatedPlaces(data.results);
  const deduplicated = deduplicateCities(populated);
  const sorted = sortCitiesByRelevance(deduplicated, query);
  const top8 = sorted.slice(0, 8);
  const results = formatCityResults(top8);

  citySearchMemoryCache.set(normalizedKey, results);
  return results;
}
