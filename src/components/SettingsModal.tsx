import { useState, useRef, useEffect, TouchEvent, CSSProperties } from 'react';
import { Volume1, Volume2, ChevronRight, Info, Moon, Sun, Check } from 'lucide-react';
import { ThemeMode } from '../types.ts';
import { getSavedVolume, saveVolume } from '../utils/audioPlayer.ts';
import { AboutScreen } from './AboutScreen.tsx';

/*
 * Material You (Material 3) настройки, без синего.
 * Цвета как во всём приложении: белый и чёрный (светлая тема / тёмная тема).
 * Основной цвет = чёрный в светлой теме и белый в тёмной.
 */

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

const cardClass =
  'w-full bg-white dark:bg-[#1C1C1E] text-black dark:text-white rounded-[28px] border border-black/[0.04] dark:border-white/[0.06]';
const tonalCircle =
  'w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0';
const secondaryText = 'text-black/55 dark:text-white/55';

export function SettingsModal({
  isOpen,
  onClose,
  themeMode,
  onToggleTheme,
}: SettingsModalProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [volumePercent, setVolumePercent] = useState<number>(() =>
    Math.round(getSavedVolume() * 100)
  );

  const touchStartY = useRef(0);
  const currentDragY = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
      setIsAboutOpen(false);
    } else {
      setVolumePercent(Math.round(getSavedVolume() * 100));
    }
  }, [isOpen]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentDragY.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      currentDragY.current = deltaY;
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentDragY.current > 60) {
      onClose();
    }
    setDragOffset(0);
    currentDragY.current = 0;
  };

  const handleVolumeRelease = () => {
    const vol = volumePercent / 100;
    saveVolume(vol);
  };

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';
  const sliderVars = { '--p': volumePercent / 100 } as CSSProperties;
  // Центр ручки: 8px от краёв, чтобы она не вылезала за дорожку
  const handleLeft = 'calc(8px + (100% - 16px) * var(--p))';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 transition-opacity duration-300 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F2F2F6] dark:bg-black text-black dark:text-white rounded-t-[32px] sm:rounded-[32px] px-4 pt-3 pb-8 shadow-2xl transition-all duration-250 ease-out"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="pt-1 pb-4 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-8 h-1 rounded-full bg-black/20 dark:bg-white/20" />
        </div>

        {/* Title */}
        <div className="mb-5 px-2">
          <h2 className="text-[28px] leading-9 font-semibold tracking-tight">Настройки</h2>
        </div>

        <div className="flex flex-col gap-2">
          {/* Adhan volume card */}
          <div
            className={`${cardClass} p-5`}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className={tonalCircle}>
                <Volume2 size={22} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] leading-6 font-semibold tracking-tight">
                  Громкость азана
                </h3>
                <p className={`text-[13px] leading-[18px] mt-0.5 ${secondaryText}`}>
                  Звук для каждого намаза включается отдельно: Показать все → значок звука
                </p>
              </div>
              <span className="text-[15px] font-semibold tabular-nums mt-0.5 min-w-[40px] text-right">
                {volumePercent}%
              </span>
            </div>

            {/* Slider */}
            <div
              className="flex items-center gap-3 mt-5 touch-none"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Volume1 size={20} strokeWidth={2} className={`${secondaryText} shrink-0`} />

              <div className="relative flex-1 h-9 touch-none" style={sliderVars}>
                {/* Active track */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-3 rounded-full bg-black dark:bg-white"
                  style={{ width: `max(4px, calc(${handleLeft} - 6px))` }}
                />
                {/* Inactive track (на 100% скрыт, чтобы не было полупрозрачной палки) */}
                {volumePercent < 97 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-0 h-3 rounded-full bg-black/10 dark:bg-white/20"
                    style={{ left: `calc(${handleLeft} + 6px)` }}
                  />
                )}
                {/* Active stick at 100% matching the stick at 0% */}
                {volumePercent >= 97 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-0 h-3 rounded-full bg-black dark:bg-white"
                    style={{ width: '4px' }}
                  />
                )}
                {/* Handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-7 rounded-full bg-black dark:bg-white pointer-events-none"
                  style={{ left: handleLeft }}
                />

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumePercent}
                  onChange={(e) => setVolumePercent(Number(e.target.value))}
                  onPointerUp={handleVolumeRelease}
                  onTouchEnd={handleVolumeRelease}
                  onMouseUp={handleVolumeRelease}
                  onKeyUp={handleVolumeRelease}
                  aria-label="Громкость азана"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none"
                />
              </div>

              <Volume2 size={20} strokeWidth={2} className={`${secondaryText} shrink-0`} />
            </div>
          </div>

          {/* Dark mode tile with M3 switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Тёмный режим"
            onClick={onToggleTheme}
            className={`${cardClass} px-5 py-4 flex items-center gap-3.5 text-left cursor-pointer active:scale-[0.98] transition-transform duration-200`}
          >
            <div className={tonalCircle}>
              {isDark ? (
                <Moon size={22} strokeWidth={2} />
              ) : (
                <Sun size={22} strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[17px] leading-6 font-semibold tracking-tight">
                Тёмный режим
              </div>
              <div className={`text-[13px] leading-[18px] ${secondaryText}`}>
                {isDark ? 'Включён' : 'Выключен'}
              </div>
            </div>

            {/* M3 switch */}
            <div
              className={`relative w-[52px] h-8 rounded-full shrink-0 transition-colors duration-200 ${
                isDark
                  ? 'bg-black dark:bg-white'
                  : 'bg-black/5 dark:bg-white/10 border-2 border-black/35 dark:border-white/40'
              }`}
              aria-hidden="true"
            >
              <div
                className={`absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isDark
                    ? 'left-[24px] w-6 h-6 bg-white dark:bg-black text-black dark:text-white'
                    : 'left-[4px] w-4 h-4 bg-black/50 dark:bg-white/60'
                }`}
              >
                {isDark && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          </button>

          {/* About row */}
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className={`${cardClass} px-5 py-4 flex items-center gap-3.5 text-left cursor-pointer active:scale-[0.98] transition-transform duration-200`}
          >
            <div className={tonalCircle}>
              <Info size={22} strokeWidth={2} />
            </div>
            <span className="flex-1 text-[17px] leading-6 font-semibold tracking-tight">
              О приложении
            </span>
            <ChevronRight size={22} strokeWidth={2} className={`${secondaryText} shrink-0`} />
          </button>
        </div>
      </div>

      {/* Full-screen About Modal */}
      {isAboutOpen && <AboutScreen onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
