import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Library,
  MapPin,
  Palette,
  Sparkles,
  Tag,
  TriangleAlert,
} from 'lucide-react';
import { APP_VERSION } from '../config.ts';

interface AboutScreenProps {
  onClose: () => void;
}

const linkClass = 'underline hover:opacity-80 transition-opacity inline-flex items-center gap-1';
const mutedClass = 'text-black/55 dark:text-white/55';
const iconCircleClass =
  'w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0';

export function AboutScreen({ onClose }: AboutScreenProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F2F2F6] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] select-none transition-opacity duration-200">
      <div className="max-w-md mx-auto min-h-screen px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 flex flex-col">
        {/* Top Header Row with Back Button */}
        <header className="flex items-center gap-3 shrink-0 mb-6 h-12">
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-current shrink-0"
            aria-label="Назад к настройкам"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight">О приложении</h1>
        </header>

        {/* App Title & Version Header */}
        <div className="mb-6 px-1 flex items-center gap-4">
          <div className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-[20px] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            <Sparkles size={38} strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Angels' Time</h2>
            <p className={`text-sm font-semibold ${mutedClass} mt-1 flex items-center gap-1.5`}>
              <Tag size={14} strokeWidth={2.5} className="shrink-0" />
              <span>Версия {APP_VERSION}</span>
            </p>
          </div>
        </div>

        {/* Section Card: Источники и лицензии */}
        <section className="w-full bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] rounded-[28px] p-5 mb-4 shadow-2xs border border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Library size={20} strokeWidth={2.5} className="text-black/60 dark:text-white/60 shrink-0" />
            <h3 className="text-[17px] font-bold tracking-tight">
              Источники и лицензии
            </h3>
          </div>

          <div className="flex flex-col gap-4 text-[14px] leading-relaxed">
            <div className="flex items-start gap-3">
              <div className={iconCircleClass}>
                <Clock size={18} strokeWidth={2.25} />
              </div>
              <p className="pt-1.5">
                Время намазов:{' '}
                <a
                  href="https://aladhan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>AlAdhan API (aladhan.com)</span>
                  <ExternalLink size={12} strokeWidth={2.5} className="shrink-0" />
                </a>
                , Islamic Network.{' '}
                <span className={mutedClass}>
                  Метод расчёта: Духовное управление мусульман России.
                </span>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className={iconCircleClass}>
                <MapPin size={18} strokeWidth={2.25} />
              </div>
              <p className="pt-1.5">
                Поиск городов:{' '}
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>Open-Meteo.com</span>
                  <ExternalLink size={12} strokeWidth={2.5} className="shrink-0" />
                </a>{' '}
                Geocoding API,{' '}
                <span className={mutedClass}>лицензия CC BY 4.0.</span>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className={iconCircleClass}>
                <Palette size={18} strokeWidth={2.25} />
              </div>
              <p className="pt-1.5">
                Иконки:{' '}
                <a
                  href="https://lucide.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <span>Lucide</span>
                  <ExternalLink size={12} strokeWidth={2.5} className="shrink-0" />
                </a>{' '}
                (лицензия ISC).{' '}
                <span className={mutedClass}>
                  Шрифты: Nunito (лицензия SIL OFL).
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Section Card: Важно */}
        <section className="w-full bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#000000] dark:text-[#FFFFFF] rounded-[28px] p-5 shadow-2xs border border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert size={20} strokeWidth={2.5} className="text-black/60 dark:text-white/60 shrink-0" />
            <h3 className="text-[17px] font-bold tracking-tight">Важно</h3>
          </div>
          <p className="text-[14px] leading-relaxed text-black/75 dark:text-white/75">
            Время намазов рассчитывается автоматически и может отличаться на несколько
            минут от расписания вашей мечети. Сверяйтесь с местным расписанием.
          </p>
        </section>
      </div>
    </div>
  );
}
