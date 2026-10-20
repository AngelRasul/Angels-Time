export interface City {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  region?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
}

export type PrayerId = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerConfig {
  id: PrayerId;
  nameRu: string;
  iconSymbol: string;
  isPrayer: boolean;
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface NextPrayerInfo {
  id: PrayerId;
  nameRu: string;
  targetTime: string;
  isTomorrow: boolean;
  totalSecondsLeft: number;
  formattedCountdown: string;
}

export type ThemeMode = 'light' | 'dark';
