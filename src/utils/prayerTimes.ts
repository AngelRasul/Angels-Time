import { PrayerConfig, PrayerId, PrayerTimings, NextPrayerInfo } from '../types.ts';

export const PRAYER_CONFIGS: PrayerConfig[] = [
  {
    id: 'Fajr',
    nameRu: 'Фаджр',
    iconSymbol: 'nights_stay',
    isPrayer: true,
  },
  {
    id: 'Sunrise',
    nameRu: 'Восход',
    iconSymbol: 'wb_twilight',
    isPrayer: false,
  },
  {
    id: 'Dhuhr',
    nameRu: 'Зухр',
    iconSymbol: 'sunny',
    isPrayer: true,
  },
  {
    id: 'Asr',
    nameRu: 'Аср',
    iconSymbol: 'partly_cloudy_day',
    isPrayer: true,
  },
  {
    id: 'Maghrib',
    nameRu: 'Магриб',
    iconSymbol: 'bedtime',
    isPrayer: true,
  },
  {
    id: 'Isha',
    nameRu: 'Иша',
    iconSymbol: 'stars',
    isPrayer: true,
  },
];

export function getCityDateParts(timezone: string, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '0';
    const hour = parseInt(getPart('hour'), 10) % 24;
    const minute = parseInt(getPart('minute'), 10);
    const second = parseInt(getPart('second'), 10);
    const day = parseInt(getPart('day'), 10);
    const month = parseInt(getPart('month'), 10);
    const year = parseInt(getPart('year'), 10);
    return {
      hour,
      minute,
      second,
      day,
      month,
      year,
      totalSeconds: hour * 3600 + minute * 60 + second,
    };
  } catch {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return {
      hour,
      minute,
      second,
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      totalSeconds: hour * 3600 + minute * 60 + second,
    };
  }
}

export function formatDateForApi(day: number, month: number, year: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(day)}-${pad(month)}-${year}`;
}

export function cleanTime(timeString: string | undefined): string {
  if (!timeString) return '--:--';
  return timeString.split(' ')[0].trim();
}

export function timeStringToSeconds(timeStr: string): number {
  const clean = cleanTime(timeStr);
  const [h, m] = clean.split(':').map((x) => parseInt(x, 10));
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 3600 + m * 60;
}

/**
 * Format countdown without seconds:
 * - "через 4 ч 36 мин"
 * - if less than 1 hour: "через 36 мин"
 * - if less than 1 minute: "менее минуты"
 */
export function formatCountdown(totalSec: number): string {
  if (totalSec <= 0) return 'сейчас';
  if (totalSec < 60) return 'менее минуты';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `через ${hours} ч ${minutes} мин`;
    }
    return `через ${hours} ч`;
  }
  return `через ${minutes} мин`;
}

/**
 * Calculates the next of the 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha).
 * Sunrise is strictly excluded from being the hero next prayer.
 */
export function calculateNextPrayer(
  timings: PrayerTimings,
  timezone: string,
  tomorrowFajrTime?: string,
  currentDate = new Date()
): NextPrayerInfo {
  const cityNow = getCityDateParts(timezone, currentDate);
  const nowSec = cityNow.totalSeconds;

  const fajrSec = timeStringToSeconds(timings.Fajr);
  const dhuhrSec = timeStringToSeconds(timings.Dhuhr);
  const asrSec = timeStringToSeconds(timings.Asr);
  const maghribSec = timeStringToSeconds(timings.Maghrib);
  const ishaSec = timeStringToSeconds(timings.Isha);

  let nextId: PrayerId = 'Fajr';
  let nextNameRu = 'Фаджр';
  let targetTime = timings.Fajr;
  let isTomorrow = false;
  let secondsLeft = 0;

  if (nowSec < fajrSec) {
    nextId = 'Fajr';
    nextNameRu = 'Фаджр';
    targetTime = timings.Fajr;
    secondsLeft = fajrSec - nowSec;
  } else if (nowSec < dhuhrSec) {
    nextId = 'Dhuhr';
    nextNameRu = 'Зухр';
    targetTime = timings.Dhuhr;
    secondsLeft = dhuhrSec - nowSec;
  } else if (nowSec < asrSec) {
    nextId = 'Asr';
    nextNameRu = 'Аср';
    targetTime = timings.Asr;
    secondsLeft = asrSec - nowSec;
  } else if (nowSec < maghribSec) {
    nextId = 'Maghrib';
    nextNameRu = 'Магриб';
    targetTime = timings.Maghrib;
    secondsLeft = maghribSec - nowSec;
  } else if (nowSec < ishaSec) {
    nextId = 'Isha';
    nextNameRu = 'Иша';
    targetTime = timings.Isha;
    secondsLeft = ishaSec - nowSec;
  } else {
    nextId = 'Fajr';
    nextNameRu = 'Фаджр';
    targetTime = tomorrowFajrTime ? cleanTime(tomorrowFajrTime) : timings.Fajr;
    isTomorrow = true;
    const tomorrowFajrSec = timeStringToSeconds(targetTime);
    secondsLeft = 86400 - nowSec + tomorrowFajrSec;
  }

  return {
    id: nextId,
    nameRu: nextNameRu,
    targetTime,
    isTomorrow,
    totalSecondsLeft: secondsLeft,
    formattedCountdown: formatCountdown(secondsLeft),
  };
}
