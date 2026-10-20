import type { FC } from 'react';
import {
  Moon,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  MoonStar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PrayerId } from '../types.ts';

export interface PrayerMapItem {
  id: PrayerId;
  name: string;
  icon: LucideIcon;
}

export const PRAYER_MAP: PrayerMapItem[] = [
  { id: 'Fajr', name: 'Фаджр', icon: Moon },
  { id: 'Sunrise', name: 'Восход', icon: Sunrise },
  { id: 'Dhuhr', name: 'Зухр', icon: Sun },
  { id: 'Asr', name: 'Аср', icon: CloudSun },
  { id: 'Maghrib', name: 'Магриб', icon: Sunset },
  { id: 'Isha', name: 'Иша', icon: MoonStar },
];

export const PRAYER_ICONS: Record<PrayerId, LucideIcon> = {
  Fajr: Moon,
  Sunrise: Sunrise,
  Dhuhr: Sun,
  Asr: CloudSun,
  Maghrib: Sunset,
  Isha: MoonStar,
};

export interface PrayerIconProps {
  id: PrayerId;
  size?: number;
  className?: string;
}

export const PrayerIcon: FC<PrayerIconProps> = ({ id, size = 24, className = '' }) => {
  const IconComponent = PRAYER_ICONS[id] || Moon;
  return <IconComponent size={size} strokeWidth={2.5} className={className} />;
};
