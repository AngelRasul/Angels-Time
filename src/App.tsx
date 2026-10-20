import { useState, useEffect } from 'react';
import { City, ThemeMode } from './types.ts';
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { CitySearchScreen } from './components/CitySearchScreen.tsx';
import { PrayerTimesScreen } from './components/PrayerTimesScreen.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';

type Screen = 'welcome' | 'search' | 'prayer_times';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(() => {
    try {
      const saved = localStorage.getItem('angels_saved_city');
      if (saved) {
        return JSON.parse(saved) as City;
      }
    } catch (e) {
      console.error('Failed to parse saved city:', e);
    }
    return null;
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    try {
      const saved = localStorage.getItem('angels_saved_city');
      if (saved) {
        return 'prayer_times';
      }
    } catch {
      // fallback
    }
    return 'welcome';
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('angels_theme_mode');
      if (saved === 'dark') {
        return 'dark';
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Apply theme immediately on change and sync with DOM
  useEffect(() => {
    const isDark = themeMode === 'dark';
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [themeMode]);

  const handleToggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    try {
      localStorage.setItem('angels_theme_mode', nextMode);
    } catch {
      // ignore
    }
  };

  const handleCitySelected = (city: City) => {
    setSelectedCity(city);
    setCurrentScreen('prayer_times');
  };

  const handleCloseSearch = () => {
    if (selectedCity) {
      setCurrentScreen('prayer_times');
    } else {
      setCurrentScreen('welcome');
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F6] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] font-sans">
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onSelectCityClick={() => setCurrentScreen('search')}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {currentScreen === 'search' && (
        <CitySearchScreen
          onSelectCity={handleCitySelected}
          onClose={handleCloseSearch}
          canClose={Boolean(selectedCity)}
        />
      )}

      {currentScreen === 'prayer_times' && selectedCity && (
        <PrayerTimesScreen
          city={selectedCity}
          onChangeCityClick={() => setCurrentScreen('search')}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />
    </main>
  );
}
