import { useState, useRef, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { NextPrayerInfo, PrayerConfig } from '../types.ts';
import { MaterialIcon } from './MaterialIcon.tsx';
import { PrayerIcon } from './PrayerIcon.tsx';

interface HeroPrayerCardProps {
  nextPrayer: NextPrayerInfo;
  nextPrayerConfig: PrayerConfig | null | undefined;
  onOpenAllPrayers: () => void;
}

export function HeroPrayerCard({
  nextPrayer,
  nextPrayerConfig,
  onOpenAllPrayers,
}: HeroPrayerCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 350, cardHeight: 220 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setDimensions((prev) => ({
          ...prev,
          width: w,
        }));
      }
    };

    updateSize();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setDimensions((prev) => ({ ...prev, width: w }));
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { width: w } = dimensions;
  const cardH = 220; // 50% shorter, ~30% screen height
  const tabH = 52; // 52px tall tab
  const tabW = Math.min(Math.max(Math.round(w * 0.52), 170), w - 40); // ~50% of card width
  const cardR = 32; // 32px card corners
  const tabR = 26; // half of tab height for fully rounded bottom
  const filletR = 20; // 20px concave inverted fillet where tab meets card

  const x1 = Math.round((w - tabW) / 2);
  const x2 = Math.round((w + tabW) / 2);

  // Generate unified continuous SVG outline path with concave fillets
  const pathD = w > 0
    ? [
        `M ${cardR} 0`,
        `L ${w - cardR} 0`,
        `A ${cardR} ${cardR} 0 0 1 ${w} ${cardR}`,
        `L ${w} ${cardH - cardR}`,
        `A ${cardR} ${cardR} 0 0 1 ${w - cardR} ${cardH}`,
        `L ${x2 + filletR} ${cardH}`,
        `A ${filletR} ${filletR} 0 0 0 ${x2} ${cardH + filletR}`,
        `L ${x2} ${cardH + tabH - tabR}`,
        `A ${tabR} ${tabR} 0 0 1 ${x2 - tabR} ${cardH + tabH}`,
        `L ${x1 + tabR} ${cardH + tabH}`,
        `A ${tabR} ${tabR} 0 0 1 ${x1} ${cardH + tabH - tabR}`,
        `L ${x1} ${cardH + filletR}`,
        `A ${filletR} ${filletR} 0 0 0 ${x1 - filletR} ${cardH}`,
        `L ${cardR} ${cardH}`,
        `A ${cardR} ${cardR} 0 0 1 0 ${cardH - cardR}`,
        `L 0 ${cardR}`,
        `A ${cardR} ${cardR} 0 0 1 ${cardR} 0`,
        'Z',
      ].join(' ')
    : '';

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[380px] mx-auto relative select-none cursor-pointer transition-transform duration-200 active:scale-[0.99]"
      onClick={onOpenAllPrayers}
      style={{
        height: `${cardH + tabH}px`,
        filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.05)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.04))',
      }}
    >
      {/* Unified Background SVG Shape */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${w || 350} ${cardH + tabH}`}
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="var(--bg-card)"
          className="transition-colors duration-200"
        />
      </svg>

      {/* Hero Card Content Area (Card Height) */}
      <div
        className="relative z-10 w-full flex flex-col items-center justify-between px-6 pt-5 pb-3 text-center"
        style={{ height: `${cardH}px` }}
      >
        {/* Top: Clean tonal circle with prayer icon */}
        <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 shrink-0 flex items-center justify-center text-current">
          <PrayerIcon id={nextPrayer.id} size={24} />
        </div>

        {/* Middle: Prayer name & Large Bold Time */}
        <div className="my-auto py-1">
          <div className="flex items-center justify-center mb-0.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {nextPrayer.nameRu}
            </h1>
          </div>

          <div className="text-5xl sm:text-6xl font-black tracking-tight tabular-nums">
            {nextPrayer.targetTime}
          </div>
        </div>

        {/* Bottom: Countdown under time with Timer icon */}
        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-black/60 dark:text-white/60 tabular-nums pb-1">
          <Timer size={15} strokeWidth={2.5} className="shrink-0" />
          <span>{nextPrayer.formattedCountdown}</span>
        </div>
      </div>

      {/* Hanging Tab Content Area (Tab Height) */}
      <div
        className="relative z-10 mx-auto flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide transition-opacity hover:opacity-80 cursor-pointer"
        style={{
          width: `${tabW}px`,
          height: `${tabH}px`,
        }}
      >
        <span>Показать все</span>
        <MaterialIcon name="expand_more" size={18} className="opacity-60" />
      </div>
    </div>
  );
}
