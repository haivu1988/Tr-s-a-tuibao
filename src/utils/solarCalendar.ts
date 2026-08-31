import { DayOfWeek, DAYS_OF_WEEK } from '../types';

/**
 * Solar Calendar (Dương Lịch) Utilities for Vietnam
 * Calculates exact Gregorian dates for real-time automatic dates, dynamic ISO weeks, 
 * shift scheduling, attendance verification, and smooth Next/Back week navigation.
 */

// Calculate the ISO week ID for any given Date object (e.g., "2026-W36")
export function getIsoWeekId(d: Date = new Date()): string {
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (target.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3); // Nearest Thursday
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${year}-W${pad(weekNum)}`;
}

// Automatically detect the CURRENT real-world solar week ID
export function getCurrentSolarWeekId(): string {
  return getIsoWeekId(new Date());
}

// Parse a week ID (e.g., "2026-W36") and return the Monday Date (00:00:00 local time)
export function getStartDateOfWeek(weekId: string): Date {
  const match = weekId.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) {
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);
  }

  const year = parseInt(match[1], 10);
  const weekNumber = parseInt(match[2], 10);

  // Jan 4th is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = (jan4.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
  const monW1 = new Date(year, 0, 4 - dayOfJan4);

  const targetMonday = new Date(monW1.getFullYear(), monW1.getMonth(), monW1.getDate() + (weekNumber - 1) * 7, 0, 0, 0, 0);
  return targetMonday;
}

// Get the Sunday Date of a week
export function getEndDateOfWeek(weekId: string): Date {
  const monday = getStartDateOfWeek(weekId);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
  return sunday;
}

// Calculate the week ID after adding/subtracting N weeks (offset: +1 for next, -1 for back)
export function getAdjacentWeekId(weekId: string, offset: number = 1): string {
  const monday = getStartDateOfWeek(weekId);
  const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offset * 7 + 3); // Thursday of target week
  return getIsoWeekId(targetDate);
}

// Quick helper to get Next Week ID
export function getNextWeekId(weekId: string): string {
  return getAdjacentWeekId(weekId, 1);
}

// Quick helper to get Previous Week ID
export function getPrevWeekId(weekId: string): string {
  return getAdjacentWeekId(weekId, -1);
}

// Check if a given weekId is the current real-world week
export function isCurrentWeek(weekId: string): boolean {
  return weekId === getCurrentSolarWeekId();
}

// Check if a given date string (YYYY-MM-DD) is today
export function isDateToday(dateStr: string): boolean {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return dateStr === todayStr;
}

export interface SolarDateDetail {
  dayKey: DayOfWeek;
  dayLabel: string;
  shortLabel: string;
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  month: number;
  year: number;
  formattedShort: string; // 24/08
  formattedFull: string; // 24/08/2026
  displayWithDay: string; // Thứ 2 (24/08)
  displayFullWithDay: string; // Thứ 2, 24/08/2026
  isToday: boolean;
}

// Get solar date details for a specific day in a given week
export function getSolarDateInfo(weekId: string, dayKey: DayOfWeek): SolarDateDetail {
  const monday = getStartDateOfWeek(weekId);
  const dayInfo = DAYS_OF_WEEK.find((d) => d.key === dayKey) || DAYS_OF_WEEK[0];
  
  const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayInfo.solarOffsetDays);

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const dayOfMonth = targetDate.getDate();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${year}-${pad(month)}-${pad(dayOfMonth)}`;
  const formattedShort = `${pad(dayOfMonth)}/${pad(month)}`;
  const formattedFull = `${pad(dayOfMonth)}/${pad(month)}/${year}`;
  const displayWithDay = `${dayInfo.label} (${formattedShort})`;
  const displayFullWithDay = `${dayInfo.label}, ${formattedFull}`;
  const isToday = isDateToday(dateStr);

  return {
    dayKey,
    dayLabel: dayInfo.label,
    shortLabel: dayInfo.shortLabel,
    dateStr,
    dayOfMonth,
    month,
    year,
    formattedShort,
    formattedFull,
    displayWithDay,
    displayFullWithDay,
    isToday,
  };
}

// Helper to get solar date details directly from a date string (YYYY-MM-DD)
export function getSolarDateDetailFromDate(dateStr: string): SolarDateDetail {
  const date = new Date(dateStr);
  const weekdays: { [k: number]: { key: DayOfWeek; label: string; shortLabel: string } } = {
    0: { key: 'sun', label: 'Chủ Nhật', shortLabel: 'CN' },
    1: { key: 'mon', label: 'Thứ 2', shortLabel: 'T2' },
    2: { key: 'tue', label: 'Thứ 3', shortLabel: 'T3' },
    3: { key: 'wed', label: 'Thứ 4', shortLabel: 'T4' },
    4: { key: 'thu', label: 'Thứ 5', shortLabel: 'T5' },
    5: { key: 'fri', label: 'Thứ 6', shortLabel: 'T6' },
    6: { key: 'sat', label: 'Thứ 7', shortLabel: 'T7' },
  };
  const dInfo = !isNaN(date.getTime()) ? (weekdays[date.getDay()] || weekdays[1]) : weekdays[1];
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = !isNaN(date.getTime()) ? pad(date.getDate()) : '01';
  const m = !isNaN(date.getTime()) ? pad(date.getMonth() + 1) : '01';
  const y = !isNaN(date.getTime()) ? date.getFullYear() : 2026;
  const formattedShort = `${d}/${m}`;
  const formattedFull = `${d}/${m}/${y}`;
  return {
    dayKey: dInfo.key,
    dayLabel: dInfo.label,
    shortLabel: dInfo.shortLabel,
    dateStr,
    dayOfMonth: !isNaN(date.getTime()) ? date.getDate() : 1,
    month: !isNaN(date.getTime()) ? date.getMonth() + 1 : 1,
    year: y,
    formattedShort,
    formattedFull,
    displayWithDay: `${dInfo.label} (${formattedShort})`,
    displayFullWithDay: `${dInfo.label}, ${formattedFull}`,
    isToday: isDateToday(dateStr),
  };
}

// Get full 7 days details of a solar week
export function getSolarWeekDays(weekId: string): SolarDateDetail[] {
  return DAYS_OF_WEEK.map((d) => getSolarDateInfo(weekId, d.key));
}

// Get formatted solar date range of a week, e.g., "24/08/2026 – 30/08/2026"
export function getSolarWeekRangeText(weekId: string): string {
  const mondayInfo = getSolarDateInfo(weekId, 'mon');
  const sundayInfo = getSolarDateInfo(weekId, 'sun');
  return `${mondayInfo.formattedFull} – ${sundayInfo.formattedFull}`;
}

// Get clean short range e.g., "24/08 – 30/08/2026"
export function getSolarWeekShortRangeText(weekId: string): string {
  const mondayInfo = getSolarDateInfo(weekId, 'mon');
  const sundayInfo = getSolarDateInfo(weekId, 'sun');
  return `${mondayInfo.formattedShort} – ${sundayInfo.formattedFull}`;
}

export interface SolarWeekOption {
  weekId: string;
  weekNumber: number;
  year: number;
  label: string;
  shortLabel: string;
  solarRangeText: string;
  isCurrent: boolean;
  isNext: boolean;
  isPast: boolean;
}

// Generate selectable solar calendar weeks around current date & selected week dynamically
export function getAvailableSolarWeeks(centerWeekId?: string, pastWeeks = 6, futureWeeks = 10): SolarWeekOption[] {
  const currentWeekId = getCurrentSolarWeekId();
  const nextWeekId = getNextWeekId(currentWeekId);
  const baseWeekId = centerWeekId || currentWeekId;
  const baseMonday = getStartDateOfWeek(baseWeekId);

  const seen = new Set<string>();
  const weeks: SolarWeekOption[] = [];

  // Generate range from -pastWeeks to +futureWeeks
  for (let offset = -pastWeeks; offset <= futureWeeks; offset++) {
    const targetDate = new Date(baseMonday.getFullYear(), baseMonday.getMonth(), baseMonday.getDate() + offset * 7 + 3);
    const wId = getIsoWeekId(targetDate);
    if (seen.has(wId)) continue;
    seen.add(wId);

    const match = wId.match(/^(\d{4})-W(\d{1,2})$/);
    const year = match ? parseInt(match[1], 10) : 2026;
    const weekNumber = match ? parseInt(match[2], 10) : 1;
    const rangeText = getSolarWeekRangeText(wId);
    const isCurrent = wId === currentWeekId;
    const isNext = wId === nextWeekId;
    const isPast = wId < currentWeekId;

    let tag = '';
    if (isCurrent) tag = ' • Hiện tại (Tuần này)';
    else if (isNext) tag = ' • Tuần tiếp theo';
    else if (isPast) tag = ' • Lịch cũ';
    else tag = ' • Sắp tới';

    weeks.push({
      weekId: wId,
      weekNumber,
      year,
      label: `Tuần ${weekNumber} (${rangeText})${tag}`,
      shortLabel: `Tuần ${weekNumber} (${getSolarWeekShortRangeText(wId)})`,
      solarRangeText: rangeText,
      isCurrent,
      isNext,
      isPast,
    });
  }

  // Sort weeks chronologically
  weeks.sort((a, b) => a.weekId.localeCompare(b.weekId));
  return weeks;
}

// Format standard date strings to Vietnamese Solar Calendar format
export function formatSolarDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatSolarDateWithWeekday(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const weekday = weekdays[date.getDay()];
  return `${weekday}, ${formatSolarDate(dateString)} (Dương lịch)`;
}

