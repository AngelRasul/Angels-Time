import { useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft, X, MapPin, ChevronRight, LoaderCircle, SearchX, WifiOff } from 'lucide-react';
import { City } from '../types.ts';
import { searchCities, CitySearchResult } from '../utils/citySearch.ts';

interface CitySearchScreenProps {
  onSelectCity: (city: City) => void;
  onClose: () => void;
  canClose: boolean;
}

export function CitySearchScreen({ onSelectCity, onClose, canClose }: CitySearchScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await searchCities(trimmed, controller.signal);
        setResults(data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrorMessage('Не удалось загрузить. Проверьте интернет и попробуйте снова');
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleCitySelect = (city: CitySearchResult) => {
    const cityToSave: City = {
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
      country: city.country,
      admin1: city.admin1,
      admin2: city.admin2,
      region: city.admin1 || city.region,
    };
    localStorage.setItem('angels_saved_city', JSON.stringify(cityToSave));
    onSelectCity(cityToSave);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  const tonalCircle =
    'w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0';
  const surface =
    'bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.06]';

  // Material You grouped list: большие скругления снаружи, маленькие между пунктами
  const itemRadius = (i: number, total: number) => {
    if (total === 1) return 'rounded-[28px]';
    if (i === 0) return 'rounded-t-[28px] rounded-b-[6px]';
    if (i === total - 1) return 'rounded-b-[28px] rounded-t-[6px]';
    return 'rounded-[6px]';
  };

  return (
    <div className="min-h-screen bg-[#F2F2F6] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-6 sm:px-6 max-w-md mx-auto flex flex-col select-none">
      {/* Material You search bar: одна капсула, слева «назад» (или лупа), справа очистить */}
      <div className={`flex items-center ${surface} rounded-full h-14 pl-2 pr-2 mb-5 transition-all`}>
        {canClose ? (
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Закрыть поиск"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center shrink-0 text-black/55 dark:text-white/55">
            <Search size={22} strokeWidth={2} />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск города"
          className="flex-1 min-w-0 mx-2 bg-transparent border-0 focus:outline-none caret-black dark:caret-white text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 text-[17px]"
        />
        {query.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Очистить"
          >
            <X size={20} strokeWidth={2} />
          </button>
        ) : canClose ? (
          <div className="w-10 h-10 flex items-center justify-center shrink-0 text-black/55 dark:text-white/55">
            <Search size={22} strokeWidth={2} />
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Loading */}
        {isLoading && (
          <div className="py-10 flex flex-col items-center gap-3 text-black/55 dark:text-white/55">
            <LoaderCircle size={28} strokeWidth={2} className="animate-spin" />
            <span className="text-sm font-medium">Ищем город…</span>
          </div>
        )}

        {/* Error */}
        {errorMessage && !isLoading && (
          <div className={`${surface} rounded-[28px] p-5 flex items-start gap-3.5`}>
            <div className={tonalCircle}>
              <WifiOff size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-semibold tracking-tight">Не получилось загрузить</p>
              <p className="text-[13px] leading-[18px] mt-0.5 text-black/55 dark:text-white/55">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <div className="flex flex-col gap-[2px]">
            {results.map((city, index) => (
              <button
                key={`${city.id}-${city.name}-${city.latitude}-${city.longitude}-${index}`}
                type="button"
                onClick={() => handleCitySelect(city)}
                className={`w-full text-left ${surface} ${itemRadius(index, results.length)} px-4 py-3.5 flex items-center gap-3.5 active:bg-black/5 dark:active:bg-white/10 active:scale-[0.99] transition-all cursor-pointer`}
              >
                <div className={tonalCircle}>
                  <MapPin size={22} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] leading-6 font-semibold tracking-tight truncate">
                    {city.name}
                  </div>
                  {city.secondaryText && (
                    <div className="text-[13px] leading-[18px] text-black/55 dark:text-white/55 truncate">
                      {city.secondaryText}
                    </div>
                  )}
                </div>
                <ChevronRight size={20} strokeWidth={2} className="text-black/35 dark:text-white/35 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Nothing found */}
        {!isLoading && query.trim().length >= 2 && results.length === 0 && !errorMessage && (
          <div className="py-12 flex flex-col items-center gap-3 text-center text-black/55 dark:text-white/55">
            <div className={tonalCircle}>
              <SearchX size={22} strokeWidth={2} />
            </div>
            <p className="text-sm font-medium">Ничего не найдено. Проверьте название города</p>
          </div>
        )}
      </div>
    </div>
  );
}
