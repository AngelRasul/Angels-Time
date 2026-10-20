import { PrayerTimings } from '../types.ts';
import { cleanTime } from '../utils/prayerTimes.ts';

const CACHE_PREFIX = 'aladhan_';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

interface CachedPrayerEntry {
  timings: PrayerTimings;
  timestamp: number;
  dateStr: string;
  locationKey: string;
}

// In-memory tracker for 1-minute debounce per cache key
const lastRequestTimeByKey = new Map<string, number>();

/**
 * Clean up cached Aladhan entries older than 7 days from localStorage.
 * Runs once on application start.
 */
export function cleanupOldPrayerCache(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry: CachedPrayerEntry = JSON.parse(raw);
            if (now - entry.timestamp > SEVEN_DAYS_MS) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// Auto-run cleanup on module load
cleanupOldPrayerCache();

function buildLocationKey(lat: number, lng: number, method = 14, school = 0): string {
  return `${Number(lat).toFixed(2)}_${Number(lng).toFixed(2)}_${method}_${school}`;
}

export function buildPrayerCacheKey(
  lat: number,
  lng: number,
  dateStr: string,
  method = 14,
  school = 0
): string {
  const loc = buildLocationKey(lat, lng, method, school);
  return `${CACHE_PREFIX}${loc}_${dateStr}`;
}

/**
 * Searches localStorage for the latest available cached prayer timings for this location.
 */
export function getLatestCachedPrayerTimings(
  lat: number,
  lng: number,
  method = 14,
  school = 0
): PrayerTimings | null {
  try {
    const locPrefix = `${CACHE_PREFIX}${buildLocationKey(lat, lng, method, school)}_`;
    let latestEntry: CachedPrayerEntry | null = null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(locPrefix)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry: CachedPrayerEntry = JSON.parse(raw);
            if (!latestEntry || entry.timestamp > latestEntry.timestamp) {
              latestEntry = entry;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return latestEntry ? latestEntry.timings : null;
  } catch {
    return null;
  }
}

export interface FetchPrayerResult {
  timings: PrayerTimings;
  isStale: boolean;
}

/**
 * Fetch prayer timings with persistent caching, 1-min debounce, and fallback to latest cached data.
 */
export async function fetchPrayerTimings(
  lat: number,
  lng: number,
  timezone: string,
  dateStr: string,
  method = 14,
  school = 0
): Promise<FetchPrayerResult> {
  const cacheKey = buildPrayerCacheKey(lat, lng, dateStr, method, school);

  // 1. Check exact cache for this date - never call API again if cached
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const entry: CachedPrayerEntry = JSON.parse(cachedRaw);
      if (entry && entry.timings) {
        return { timings: entry.timings, isStale: false };
      }
    }
  } catch {
    // ignore
  }

  // 2. Debounce: do not request more than once per minute for the same key
  const now = Date.now();
  const lastRequest = lastRequestTimeByKey.get(cacheKey) || 0;
  if (now - lastRequest < ONE_MINUTE_MS) {
    // If debounced and no exact cache, check if latest cached data exists
    const fallback = getLatestCachedPrayerTimings(lat, lng, method, school);
    if (fallback) {
      return { timings: fallback, isStale: true };
    }
    throw new Error('Слишком частые запросы. Пожалуйста, подождите минуту.');
  }

  // Mark request attempt time
  lastRequestTimeByKey.set(cacheKey, now);

  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}&timezonestring=${encodeURIComponent(
    timezone
  )}`;

  try {
    const res = await fetch(url);

    if (res.status === 429 || !res.ok) {
      throw new Error(`API error ${res.status}`);
    }

    const data = await res.json();
    if (!data.data || !data.data.timings) {
      throw new Error('Некорректный формат данных');
    }

    const timings: PrayerTimings = {
      Fajr: cleanTime(data.data.timings.Fajr),
      Sunrise: cleanTime(data.data.timings.Sunrise),
      Dhuhr: cleanTime(data.data.timings.Dhuhr),
      Asr: cleanTime(data.data.timings.Asr),
      Maghrib: cleanTime(data.data.timings.Maghrib),
      Isha: cleanTime(data.data.timings.Isha),
    };

    // Store in localStorage
    try {
      const entryToSave: CachedPrayerEntry = {
        timings,
        timestamp: Date.now(),
        dateStr,
        locationKey: buildLocationKey(lat, lng, method, school),
      };
      localStorage.setItem(cacheKey, JSON.stringify(entryToSave));
    } catch {
      // ignore storage errors
    }

    return { timings, isStale: false };
  } catch (error) {
    // On 429 or network error: use latest available cached day if available
    const fallback = getLatestCachedPrayerTimings(lat, lng, method, school);
    if (fallback) {
      return { timings: fallback, isStale: true };
    }

    // No cache exists at all
    throw new Error('Не удалось загрузить время намазов. Попробуйте позже');
  }
}
