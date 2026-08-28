import { DayOfWeek, DAYS_OF_WEEK } from '../types';

/**
 * Solar Calendar (Dương Lịch) Utilities for Vietnam
 * Calculates exact Gregorian dates for weeks, shifts, attendance, and payroll.
 */

// Helper to parse weekId (e.g., "2026-W35") to the Monday start Date
export function getStartDateOfWeek(weekId: string): Date {
  const match = weekId.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) {
    // Default fallback to 2026-08-24 (Monday of W35 2026)
    return new Date(2026, 7, 24);
  }

  const year = parseInt(match[1], 10);
  const weekNumber = parseInt(match[2], 10);

  // ISO week calculation: Week 1 is the week with Jan 4th
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 1 (Mon) - 7 (Sun)
  const firstMonday = new Date(year, 0, 4 - dayOfWeek + 1);

  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  return targetMonday;
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
}

// Get solar date details for a specific day in a given week
export function getSolarDateInfo(weekId: string, dayKey: DayOfWeek): SolarDateDetail {
  const monday = getStartDateOfWeek(weekId);
  const dayInfo = DAYS_OF_WEEK.find((d) => d.key === dayKey) || DAYS_OF_WEEK[0];
  
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + dayInfo.solarOffsetDays);

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const dayOfMonth = targetDate.getDate();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${year}-${pad(month)}-${pad(dayOfMonth)}`;
  const formattedShort = `${pad(dayOfMonth)}/${pad(month)}`;
  const formattedFull = `${pad(dayOfMonth)}/${pad(month)}/${year}`;
  const displayWithDay = `${dayInfo.label} (${formattedShort})`;
  const displayFullWithDay = `${dayInfo.label}, ${formattedFull}`;

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
  };
}

// Get full 7 days details of a solar week
export function getSolarWeekDays(weekId: string): SolarDateDetail[] {
  return DAYS_OF_WEEK.map((d) => getSolarDateInfo(weekId, d.key));
}

// Get formatted solar date range of a week, e.g., "24/08/2026 – 30/08/2026 (Dương lịch)"
export function getSolarWeekRangeText(weekId: string): string {
  const mondayInfo = getSolarDateInfo(weekId, 'mon');
  const sundayInfo = getSolarDateInfo(weekId, 'sun');
  return `${mondayInfo.formattedFull} – ${sundayInfo.formattedFull}`;
}

export interface SolarWeekOption {
  weekId: string;
  weekNumber: number;
  year: number;
  label: string;
  solarRangeText: string;
  isCurrent: boolean;
}

// Generate selectable solar calendar weeks around current date
export function getAvailableSolarWeeks(): SolarWeekOption[] {
  const currentWeekNum = 35;
  const year = 2026;
  const weeks: SolarWeekOption[] = [];

  for (let w = 33; w <= 38; w++) {
    const wId = `${year}-W${w}`;
    const rangeText = getSolarWeekRangeText(wId);
    const isCurrent = w === currentWeekNum;
    weeks.push({
      weekId: wId,
      weekNumber: w,
      year,
      label: `Tuần ${w} (${rangeText}) ${isCurrent ? '• Hiện tại' : ''}`,
      solarRangeText: rangeText,
      isCurrent,
    });
  }

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
