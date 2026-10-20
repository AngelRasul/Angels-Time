import { useState, useRef, useEffect, TouchEvent } from 'react';
import { Volume2, VolumeX, Bell, BellOff, Timer } from 'lucide-react';
import { PrayerTimings, NextPrayerInfo, PrayerId } from '../types.ts';
import { PRAYER_MAP, PrayerIcon } from './PrayerIcon.tsx';

interface AllPrayersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  timings: PrayerTimings;
  nextPrayer: NextPrayerInfo | null;
}

const DEFAULT_PREFERENCES: Record<PrayerId, boolean> = {
  Fajr: false,
  Sunrise: false,
  Dhuhr: false,
  Asr: false,
  Maghrib: false,
  Isha: false,
};

function loadStoredPreferences(storageKey: string): Record<PrayerId, boolean> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
      };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_PREFERENCES };
}

interface ActionButtonProps {
  type: 'sound' | 'notify';
  isOn: boolean;
  onToggle: () => void;
}

function ActionButton({ type, isOn, onToggle }: ActionButtonProps) {
  const isSound = type === 'sound';
  const ariaLabel = isSound ? 'Звук азана' : 'Уведомление';

  const colorClasses = isOn
    ? 'bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#1C1C1E]'
    : 'bg-black/[0.08] text-[#000000] hover:bg-black/[0.12] dark:bg-white/[0.08] dark:text-[#FFFFFF] dark:hover:bg-white/[0.12]';

  const renderIcon = () => {
    const iconClass = isOn ? 'shrink-0' : 'shrink-0 opacity-40';
    if (isSound) {
      return isOn ? (
        <Volume2 size={24} strokeWidth={2.5} className={iconClass} />
      ) : (
        <VolumeX size={24} strokeWidth={2.5} className={iconClass} />
      );
    }
    return isOn ? (
      <Bell size={24} strokeWidth={2.5} className={iconClass} />
    ) : (
      <BellOff size={24} strokeWidth={2.5} className={iconClass} />
    );
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isOn}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`w-[44px] h-[44px] sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-[0.92] cursor-pointer select-none shrink-0 ${colorClasses}`}
    >
      {renderIcon()}
    </button>
  );
}

export function AllPrayersSheet({
  isOpen,
  onClose,
  timings,
  nextPrayer,
}: AllPrayersSheetProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  // Restore sound & notify state per prayer on app start
  const [soundState, setSoundState] = useState<Record<PrayerId, boolean>>(() =>
    loadStoredPreferences('angelTimeSound')
  );
  const [notifyState, setNotifyState] = useState<Record<PrayerId, boolean>>(() =>
    loadStoredPreferences('angelTimeNotify')
  );

  const touchStartY = useRef(0);
  const currentDragY = useRef(0);

  const toggleSound = (id: PrayerId) => {
    setSoundState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('angelTimeSound', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleNotify = (id: PrayerId) => {
    setNotifyState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('angelTimeNotify', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setDragOffset(0);
      }, 350);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
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
    if (currentDragY.current > 80) {
      onClose();
    }
    setDragOffset(0);
    currentDragY.current = 0;
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 transition-opacity duration-350 select-none ${
        isAnimatingIn ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Full-Screen view with large rounded corners on all four corners */}
      <div
        className="w-full max-w-md h-full max-h-[96vh] bg-[#F2F2F6] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] rounded-[36px] sm:rounded-[44px] shadow-2xl flex flex-col justify-between overflow-hidden border border-black/5 dark:border-white/10"
        style={{
          transform: isAnimatingIn
            ? `translateY(${dragOffset}px) scale(${1 - Math.min(dragOffset / 1200, 0.08)})`
            : 'translateY(40px) scale(0.92)',
          opacity: isAnimatingIn ? 1 : 0,
          transition: isDragging
            ? 'none'
            : 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top safe-area bar with drag handle */}
        <div className="pt-[calc(0.6rem+env(safe-area-inset-top))] pb-2 px-6 flex justify-center cursor-grab active:cursor-grabbing shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
        </div>

        {/* All 6 prayer cards visible all at once without scrolling - all unified in the same color */}
        <div className="flex-1 px-2.5 sm:px-3 py-1 flex flex-col justify-between gap-1.5 sm:gap-2 overflow-hidden">
          {PRAYER_MAP.map((item) => {
            const time = timings[item.id];
            const isNext = nextPrayer?.id === item.id;
            const isSoundOn = Boolean(soundState[item.id]);
            const isNotifyOn = Boolean(notifyState[item.id]);

            return (
              <div
                key={item.id}
                className="flex-1 min-h-[58px] max-h-[76px] px-3 sm:px-4 rounded-[22px] sm:rounded-[26px] flex items-center justify-between transition-all bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] shadow-2xs"
              >
                {/* Left section: Icon circle (56px) + Name & Time */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 mr-2">
                  {/* 56px tonal circle with 28px prayer icon */}
                  <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full shrink-0 flex items-center justify-center bg-black/5 dark:bg-white/10 text-black dark:text-white">
                    <PrayerIcon id={item.id} size={28} />
                  </div>

                  {/* Prayer Name & Time on the left */}
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 whitespace-nowrap">
                      <span className="text-[17px] sm:text-[19px] font-bold tracking-tight">
                        {item.name}
                      </span>
                      <span className="text-[17px] sm:text-[19px] font-bold tracking-tight tabular-nums">
                        {time}
                      </span>
                    </div>

                    {/* Next prayer countdown */}
                    {isNext && nextPrayer && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Timer size={13} strokeWidth={2.5} className="text-black/60 dark:text-white/60 shrink-0" />
                        <span className="text-xs font-medium tabular-nums text-black/60 dark:text-white/60">
                          {nextPrayer.formattedCountdown}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right section: Sound & Notification toggle buttons side by side with 8px gap */}
                <div className="flex items-center gap-2 shrink-0">
                  <ActionButton
                    type="sound"
                    isOn={isSoundOn}
                    onToggle={() => toggleSound(item.id)}
                  />
                  <ActionButton
                    type="notify"
                    isOn={isNotifyOn}
                    onToggle={() => toggleNotify(item.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom padding respecting safe area */}
        <div className="pb-[calc(0.6rem+env(safe-area-inset-bottom))] shrink-0" />
      </div>
    </div>
  );
}
