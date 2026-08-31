import { 
  ShiftType, 
  ShiftAssignment, 
  DayOfWeek, 
  SHIFT_DEFINITIONS, 
  DAYS_OF_WEEK 
} from '../types';
import { getSolarDateDetailFromDate } from './solarCalendar';

/**
 * Shift & Attendance Rules Engine:
 * 1. Chỉ được tính công khi check-in và check-out ĐÚNG CA ĐÃ ĐƯỢC CHIA TRONG LỊCH PHÂN CA.
 * 2. Check-in thành công khi diễn ra trong khoảng: Sớm tối đa 30 phút hoặc Trễ tối đa 30 phút so với giờ BẮT ĐẦU ca.
 * 3. Check-out thành công khi diễn ra trong khoảng: Sớm tối đa 30 phút hoặc Trễ tối đa 30 phút so với giờ KẾT THÚC ca.
 */

export interface ShiftTimeWindowConfig {
  shiftType: ShiftType;
  shiftName: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  // Check-in window (±30 mins from start)
  checkInStartMinuteOfDay: number; // e.g. 08:00 - 30m = 07:30 (450 mins)
  checkInEndMinuteOfDay: number;   // e.g. 08:00 + 30m = 08:30 (510 mins)
  checkInWindowText: string;       // "07:30 – 08:30"
  // Check-out window (±30 mins from end)
  checkOutStartMinuteOfDay: number; // e.g. 13:00 - 30m = 12:30 (750 mins)
  checkOutEndMinuteOfDay: number;   // e.g. 13:00 + 30m = 13:30 (810 mins)
  checkOutWindowText: string;       // "12:30 – 13:30"
}

export const SHIFT_TIME_WINDOWS: Record<ShiftType, ShiftTimeWindowConfig> = {
  morning: {
    shiftType: 'morning',
    shiftName: 'Ca Sáng (08:00 - 13:00)',
    startHour: 8,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
    checkInStartMinuteOfDay: 7 * 60 + 30, // 07:30 (450)
    checkInEndMinuteOfDay: 8 * 60 + 30,   // 08:30 (510)
    checkInWindowText: '07:30 – 08:30 (±30 phút so với 08:00)',
    checkOutStartMinuteOfDay: 12 * 60 + 30, // 12:30 (750)
    checkOutEndMinuteOfDay: 13 * 60 + 30,   // 13:30 (810)
    checkOutWindowText: '12:30 – 13:30 (±30 phút so với 13:00)',
  },
  afternoon: {
    shiftType: 'afternoon',
    shiftName: 'Ca Chiều (13:00 - 18:00)',
    startHour: 13,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    checkInStartMinuteOfDay: 12 * 60 + 30, // 12:30 (750)
    checkInEndMinuteOfDay: 13 * 60 + 30,   // 13:30 (810)
    checkInWindowText: '12:30 – 13:30 (±30 phút so với 13:00)',
    checkOutStartMinuteOfDay: 17 * 60 + 30, // 17:30 (1050)
    checkOutEndMinuteOfDay: 18 * 60 + 30,   // 18:30 (1110)
    checkOutWindowText: '17:30 – 18:30 (±30 phút so với 18:00)',
  },
  evening: {
    shiftType: 'evening',
    shiftName: 'Ca Tối (18:00 - 23:00)',
    startHour: 18,
    startMinute: 0,
    endHour: 23,
    endMinute: 0,
    checkInStartMinuteOfDay: 17 * 60 + 30, // 17:30 (1050)
    checkInEndMinuteOfDay: 18 * 60 + 30,   // 18:30 (1110)
    checkInWindowText: '17:30 – 18:30 (±30 phút so với 18:00)',
    checkOutStartMinuteOfDay: 22 * 60 + 30, // 22:30 (1350)
    checkOutEndMinuteOfDay: 23 * 60 + 30,   // 23:30 (1410)
    checkOutWindowText: '22:30 – 23:30 (±30 phút so với 23:00)',
  },
};

/**
 * Format minutes of day into "HH:mm" string
 */
export function formatMinutesOfDay(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convert Date object or time string "HH:mm" to minutes of day
 */
export function getMinutesOfDay(time: Date | string): number {
  if (typeof time === 'string') {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  return time.getHours() * 60 + time.getMinutes();
}

export interface ShiftAssignmentValidationResult {
  isAssigned: boolean;
  assignedShiftsToday: ShiftType[];
  assignedShiftNames: string[];
  dayKey: DayOfWeek;
  dayLabel: string;
  dateStr: string;
  errorMessage?: string;
}

/**
 * Check if the staff member is scheduled for a specific shift on a given date
 */
export function validateStaffShiftAssignment(
  userId: string,
  targetShift: ShiftType,
  dateStr: string,
  weekId: string,
  assignments: ShiftAssignment[],
  branchId?: string
): ShiftAssignmentValidationResult {
  const solarDetail = getSolarDateDetailFromDate(dateStr);
  const dayKey = solarDetail.dayKey;

  // Filter assignments for this day
  const todayAssignments = assignments.filter((a) => {
    const matchesWeek = a.weekId === weekId;
    const matchesDay = a.day === dayKey;
    const matchesDate = a.solarDate ? a.solarDate === dateStr : true;
    const matchesBranch = branchId ? (!a.branchId || a.branchId === branchId) : true;
    return matchesWeek && matchesDay && matchesDate && matchesBranch;
  });

  // Find all shifts this user is assigned to today
  const userAssignedShifts: ShiftType[] = [];
  todayAssignments.forEach((assignment) => {
    if (assignment.assignedUserIds.includes(userId)) {
      if (!userAssignedShifts.includes(assignment.shiftType)) {
        userAssignedShifts.push(assignment.shiftType);
      }
    }
  });

  const isAssigned = userAssignedShifts.includes(targetShift);
  const assignedShiftNames = userAssignedShifts.map(
    (st) => SHIFT_DEFINITIONS[st]?.name || st
  );

  let errorMessage: string | undefined = undefined;
  if (!isAssigned) {
    if (userAssignedShifts.length === 0) {
      errorMessage = `Bạn KHÔNG ĐƯỢC CHIA CA làm việc nào vào ${solarDetail.displayFullWithDay}. Chỉ nhân viên có lịch phân ca đã duyệt mới được tính công!`;
    } else {
      errorMessage = `Bạn chỉ được phân công [${assignedShiftNames.join(', ')}] vào ${solarDetail.displayWithDay}. Không thể chấm công cho [${SHIFT_DEFINITIONS[targetShift]?.name}].`;
    }
  }

  return {
    isAssigned,
    assignedShiftsToday: userAssignedShifts,
    assignedShiftNames,
    dayKey,
    dayLabel: solarDetail.dayLabel,
    dateStr,
    errorMessage,
  };
}

export interface CheckInTimeWindowResult {
  isValid: boolean;
  currentTimeStr: string;
  currentMinutes: number;
  shiftStartMinutes: number;
  windowStartMinutes: number;
  windowEndMinutes: number;
  windowStartStr: string;
  windowEndStr: string;
  diffMinutes: number; // âm là sớm, dương là trễ
  isTooEarly: boolean;
  isTooLate: boolean;
  status: 'on-time' | 'late' | 'early' | 'invalid_early' | 'invalid_late';
  statusLabel: string;
  errorMessage?: string;
}

/**
 * Validate if Check-In time is within early/late 30 minutes of shift start
 */
export function validateCheckInTimeWindow(
  shiftType: ShiftType,
  currentTime: Date | string = new Date()
): CheckInTimeWindowResult {
  const currentMinutes = getMinutesOfDay(currentTime);
  const currentTimeStr = typeof currentTime === 'string' 
    ? currentTime 
    : currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const win = SHIFT_TIME_WINDOWS[shiftType];
  const shiftStartMinutes = win.startHour * 60 + win.startMinute;
  const windowStartMinutes = win.checkInStartMinuteOfDay;
  const windowEndMinutes = win.checkInEndMinuteOfDay;

  const diffMinutes = currentMinutes - shiftStartMinutes;
  const isTooEarly = currentMinutes < windowStartMinutes;
  const isTooLate = currentMinutes > windowEndMinutes;
  const isValid = !isTooEarly && !isTooLate;

  let status: CheckInTimeWindowResult['status'] = 'on-time';
  let statusLabel = 'Đúng Giờ';
  let errorMessage: string | undefined = undefined;

  const windowStartStr = formatMinutesOfDay(windowStartMinutes);
  const windowEndStr = formatMinutesOfDay(windowEndMinutes);
  const shiftStartStr = formatMinutesOfDay(shiftStartMinutes);

  if (isTooEarly) {
    status = 'invalid_early';
    const minsEarly = Math.abs(diffMinutes);
    statusLabel = `Quá sớm (${minsEarly} phút)`;
    errorMessage = `Chưa đến khung giờ Check-In ${win.shiftName}. Bạn chỉ được check-in sớm tối đa 30 phút trước ca (Khung giờ mở: ${windowStartStr} – ${windowEndStr}).`;
  } else if (isTooLate) {
    status = 'invalid_late';
    const minsLate = diffMinutes;
    statusLabel = `Quá trễ (${minsLate} phút)`;
    errorMessage = `Đã quá thời gian cho phép Check-In ${win.shiftName}. Hệ thống chỉ chấp nhận trễ tối đa 30 phút sau khi bắt đầu ca (Hết hạn lúc: ${windowEndStr}).`;
  } else {
    // Within [-30, +30]
    if (diffMinutes < -5) {
      status = 'early';
      statusLabel = `Sớm ${Math.abs(diffMinutes)} phút (Hợp lệ)`;
    } else if (diffMinutes <= 10) {
      status = 'on-time';
      statusLabel = 'Đúng Giờ (Hợp lệ)';
    } else {
      status = 'late';
      statusLabel = `Trễ ${diffMinutes} phút (Trong hạn 30p)`;
    }
  }

  return {
    isValid,
    currentTimeStr,
    currentMinutes,
    shiftStartMinutes,
    windowStartMinutes,
    windowEndMinutes,
    windowStartStr,
    windowEndStr,
    diffMinutes,
    isTooEarly,
    isTooLate,
    status,
    statusLabel,
    errorMessage,
  };
}

export interface CheckOutTimeWindowResult {
  isValid: boolean;
  currentTimeStr: string;
  currentMinutes: number;
  shiftEndMinutes: number;
  windowStartMinutes: number;
  windowEndMinutes: number;
  windowStartStr: string;
  windowEndStr: string;
  diffMinutes: number; // âm là sớm so với giờ kết thúc, dương là trễ
  isTooEarly: boolean;
  isTooLate: boolean;
  status: 'completed' | 'early-leave' | 'late-leave' | 'invalid_early' | 'invalid_late';
  statusLabel: string;
  errorMessage?: string;
}

/**
 * Validate if Check-Out time is within early/late 30 minutes of shift end
 */
export function validateCheckOutTimeWindow(
  shiftType: ShiftType,
  currentTime: Date | string = new Date()
): CheckOutTimeWindowResult {
  const currentMinutes = getMinutesOfDay(currentTime);
  const currentTimeStr = typeof currentTime === 'string' 
    ? currentTime 
    : currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const win = SHIFT_TIME_WINDOWS[shiftType];
  const shiftEndMinutes = win.endHour * 60 + win.endMinute;
  const windowStartMinutes = win.checkOutStartMinuteOfDay;
  const windowEndMinutes = win.checkOutEndMinuteOfDay;

  const diffMinutes = currentMinutes - shiftEndMinutes;
  const isTooEarly = currentMinutes < windowStartMinutes;
  const isTooLate = currentMinutes > windowEndMinutes;
  const isValid = !isTooEarly && !isTooLate;

  let status: CheckOutTimeWindowResult['status'] = 'completed';
  let statusLabel = 'Đúng Giờ';
  let errorMessage: string | undefined = undefined;

  const windowStartStr = formatMinutesOfDay(windowStartMinutes);
  const windowEndStr = formatMinutesOfDay(windowEndMinutes);
  const shiftEndStr = formatMinutesOfDay(shiftEndMinutes);

  if (isTooEarly) {
    status = 'invalid_early';
    const minsEarly = Math.abs(diffMinutes);
    statusLabel = `Về quá sớm (${minsEarly} phút)`;
    errorMessage = `Chưa đến khung giờ Check-Out ${win.shiftName}. Bạn chỉ được check-out sớm tối đa 30 phút trước khi kết thúc ca (Khung giờ mở: ${windowStartStr} – ${windowEndStr}).`;
  } else if (isTooLate) {
    status = 'invalid_late';
    const minsLate = diffMinutes;
    statusLabel = `Quá trễ (${minsLate} phút)`;
    errorMessage = `Đã quá thời gian cho phép Check-Out ${win.shiftName}. Hệ thống chỉ chấp nhận check-out trễ tối đa 30 phút sau khi kết thúc ca (Hết hạn lúc: ${windowEndStr}).`;
  } else {
    // Within [-30, +30]
    if (diffMinutes < -5) {
      status = 'early-leave';
      statusLabel = `Check-out sớm ${Math.abs(diffMinutes)} phút (Hợp lệ)`;
    } else {
      status = 'completed';
      statusLabel = 'Hoàn Thành Ca Đúng Giờ';
    }
  }

  return {
    isValid,
    currentTimeStr,
    currentMinutes,
    shiftEndMinutes,
    windowStartMinutes,
    windowEndMinutes,
    windowStartStr,
    windowEndStr,
    diffMinutes,
    isTooEarly,
    isTooLate,
    status,
    statusLabel,
    errorMessage,
  };
}
