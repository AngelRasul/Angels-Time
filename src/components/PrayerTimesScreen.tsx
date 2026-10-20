import { useState, useEffect, useCallback, useRef } from 'react';
import { City, PrayerTimings, NextPrayerInfo } from '../types.ts';
import {
  PRAYER_CONFIGS,
  getCityDateParts,
  formatDateForApi,
  calculateNextPrayer,
} from '../utils/prayerTimes.ts';
import { fetchPrayerTimings } from '../api/prayerTimesApi.ts';
import { MapPin, Settings } from 'lucide-react';
import { MaterialIcon } from './MaterialIcon.tsx';
import { AllPrayersSheet } from './AllPrayersSheet.tsx';
import { HeroPrayerCard } from './HeroPrayerCard.tsx';

interface PrayerTimesScreenProps {
  city: City;
  onChangeCityClick: () => void;
  onOpenSettings: () => void;
}

export function PrayerTimesScreen({
  city,
  onChangeCityClick,
  onOpenSettings,
}: PrayerTimesScreenProps) {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [tomorrowFajr, setTomorrowFajr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isAllPrayersOpen, setIsAllPrayersOpen] = useState(false);

  const loadedDateKeyRef = useRef<string>('');
  const retryCountRef = useRef<number>(0);
  const retryTimerRef = useRef<number | null>(null);

  // Clear pending retries and reset retry count when city changes
  useEffect(() => {
    retryCountRef.current = 0;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [city]);

  const fetchTimings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const scheduleRetry = () => {
      if (retryCountRef.current < 3) {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = window.setTimeout(() => {
          retryCountRef.current += 1;
          fetchTimings();
        }, 60000);
      }
    };

    try {
      const cityNow = getCityDateParts(city.timezone);
      const dateKey = `${cityNow.year}-${cityNow.month}-${cityNow.day}`;
      loadedDateKeyRef.current = dateKey;

      const todayDateStr = formatDateForApi(cityNow.day, cityNow.month, cityNow.year);

      // Fetch today's timings (cached in localStorage, debounced, with fallback)
      const result = await fetchPrayerTimings(
        city.latitude,
        city.longitude,
        city.timezone,
        todayDateStr,
        14,
        0
      );

      setTimings(result.timings);
      setIsStale(result.isStale);

      if (result.isStale) {
        scheduleRetry();
      } else {
        retryCountRef.current = 0;
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      }

      // Pre-fetch tomorrow's Fajr for countdown after Isha
      const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tomorrowCity = getCityDateParts(city.timezone, tomorrowDate);
      const tomorrowDateStr = formatDateForApi(
        tomorrowCity.day,
        tomorrowCity.month,
        tomorrowCity.year
      );

      try {
        const tomorrowResult = await fetchPrayerTimings(
          city.latitude,
          city.longitude,
          city.timezone,
          tomorrowDateStr,
          14,
          0
        );
        if (tomorrowResult?.timings?.Fajr) {
          setTomorrowFajr(tomorrowResult.timings.Fajr);
        }
      } catch {
        // Fallback handled automatically
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Не удалось загрузить время намазов. Попробуйте позже'
      );
      scheduleRetry();
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  // 1. Fetch on app open
  useEffect(() => {
    fetchTimings();
  }, [fetchTimings]);

  // 2. Midnight date change & 1-second live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);

      if (city.timezone && loadedDateKeyRef.current) {
        const cityNow = getCityDateParts(city.timezone, current);
        const currentDateKey = `${cityNow.year}-${cityNow.month}-${cityNow.day}`;
        if (currentDateKey !== loadedDateKeyRef.current) {
          fetchTimings();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [city.timezone, fetchTimings]);

  // 3. Tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTimings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchTimings]);

  // 4. Update automatically every 60 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTimings();
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTimings]);

  // Next prayer is strictly one of the 5 prayers (Sunrise excluded)
  const nextPrayer: NextPrayerInfo | null = timings
    ? calculateNextPrayer(timings, city.timezone, tomorrowFajr || undefined, now)
    : null;

  const nextPrayerConfig = nextPrayer
    ? PRAYER_CONFIGS.find((p) => p.id === nextPrayer.id)
    : null;

  return (
    <div className="min-h-screen bg-[#F2F2F6] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 max-w-md mx-auto flex flex-col justify-between select-none relative">
      {/* Top Header Row (City Selector + Settings Gear) */}
      <header className="flex items-center justify-between shrink-0 mb-2">
        <button
          type="button"
          onClick={onChangeCityClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] shadow-2xs hover:opacity-85 active:scale-98 max-w-[75%] transition-all cursor-pointer"
          aria-label={`Город: ${city.name}. Нажмите для смены.`}
        >
          <MapPin
            size={18}
            strokeWidth={2.5}
            className="text-black/60 dark:text-white/60 shrink-0"
          />
          <span className="font-bold text-base truncate">{city.name}</span>
          <MaterialIcon
            name="expand_more"
            size={20}
            className="text-black/40 dark:text-white/40"
          />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] shadow-2xs hover:opacity-85 active:scale-95 transition-all cursor-pointer"
          aria-label="Настройки"
          title="Настройки"
        >
          <Settings size={22} strokeWidth={2.5} />
        </button>
      </header>

      {/* Main Area: Positioned closer to top bar (location and settings) */}
      <main className="flex-1 flex flex-col items-center pt-3 sm:pt-5 pb-4">
        {isLoading && !timings && (
          <div className="py-24 text-center text-sm font-medium text-black/60 dark:text-white/60">
            Загрузка расписания...
          </div>
        )}

        {errorMessage && !isLoading && !timings && (
          <div className="p-6 rounded-[28px] bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] shadow-2xs text-center my-12">
            <p className="font-bold text-base mb-2">Не удалось загрузить время намазов</p>
            <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed mb-5">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={fetchTimings}
              className="w-full py-3.5 px-4 rounded-full bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#1C1C1E] font-semibold active:scale-98 transition-all cursor-pointer"
            >
              Повторить попытку
            </button>
          </div>
        )}

        {isStale && timings && (
          <div className="text-[12px] font-semibold text-black/60 dark:text-white/60 bg-black/5 dark:bg-white/10 px-3.5 py-1.5 rounded-full text-center mb-3">
            Данные могут быть не актуальны
          </div>
        )}

        {timings && nextPrayer && (
          <HeroPrayerCard
            nextPrayer={nextPrayer}
            nextPrayerConfig={nextPrayerConfig}
            onOpenAllPrayers={() => setIsAllPrayersOpen(true)}
          />
        )}
      </main>

      {/* "All Prayers" Full-Screen View with Morph Transition */}
      {timings && (
        <AllPrayersSheet
          isOpen={isAllPrayersOpen}
          onClose={() => setIsAllPrayersOpen(false)}
          timings={timings}
          nextPrayer={nextPrayer}
        />
      )}
    </div>
  );
}
