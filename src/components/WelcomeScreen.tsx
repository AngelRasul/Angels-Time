import { Settings } from 'lucide-react';
import { MaterialIcon } from './MaterialIcon.tsx';

interface WelcomeScreenProps {
  onSelectCityClick: () => void;
  onOpenSettings?: () => void;
}

export function WelcomeScreen({ onSelectCityClick, onOpenSettings }: WelcomeScreenProps) {
  return (
    <div className="relative min-h-screen bg-[#F2F2F6] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] flex flex-col justify-between px-6 py-8 sm:px-8 max-w-md mx-auto select-none">
      {/* Top Bar with Settings button */}
      <div className="flex justify-end items-center w-full">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] shadow-2xs active:scale-95 transition-all cursor-pointer"
            aria-label="Настройки"
          >
            <Settings size={22} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Centered Content */}
      <div className="flex flex-col items-center text-center my-auto px-2">
        {/* Soft Tonal Emblem */}
        <div className="w-24 h-24 mb-8 rounded-full bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] flex items-center justify-center shadow-2xs">
          <MaterialIcon name="nights_stay" size={48} />
        </div>

        {/* Greeting */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ассаламу алейкум
        </h1>
      </div>

      {/* Bottom Action Area */}
      <div className="w-full pb-4">
        <button
          type="button"
          onClick={onSelectCityClick}
          className="w-full h-14 min-h-[56px] rounded-full bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#1C1C1E] font-bold text-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Выбрать город</span>
          <MaterialIcon name="arrow_forward" size={24} />
        </button>
      </div>
    </div>
  );
}
