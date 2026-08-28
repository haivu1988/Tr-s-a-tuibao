import { User, ShiftRegistration, ShiftAssignment, DayOfWeek, ShiftType, DAYS_OF_WEEK } from '../types';
import { getSolarDateInfo } from './solarCalendar';

export interface ScheduleResult {
  assignments: ShiftAssignment[];
  stats: {
    totalShiftsNeeded: number; // 7 days * 3 shifts = 21 shifts
    totalStaffSlotsAssigned: number; // sum of staff across all shifts
    understaffedCount: number; // shifts with < 2 staff
    singleShiftDaysCount: number; // instances of 1 shift/day for an employee
    doubleShiftDaysCount: number; // instances of 2 shifts/day for an employee (minimized)
    tripleShiftDaysCount: number; // must be 0
    staffWorkload: Record<string, number>; // userId -> total shifts in week
  };
  warnings: string[];
}

export function autoScheduleWeek(
  branchId: string,
  weekId: string,
  staffList: User[],
  registrations: ShiftRegistration[],
  targetStaffPerShift: number = 2
): ScheduleResult {
  // Only use active staff allocated to this branch
  const activeStaff = staffList.filter(
    (s) => s.role === 'staff' && s.status === 'active' && s.branchId === branchId
  );
  const shiftTypes: ShiftType[] = ['morning', 'afternoon', 'evening'];
  const days: DayOfWeek[] = DAYS_OF_WEEK.map((d) => d.key);

  // Map of registrations by day and shift for this branch
  const regMap = new Map<string, Set<string>>();
  days.forEach((d) => {
    shiftTypes.forEach((s) => {
      regMap.set(`${d}_${s}`, new Set<string>());
    });
  });

  registrations
    .filter((r) => r.branchId === branchId && r.weekId === weekId)
    .forEach((r) => {
      const set = regMap.get(`${r.day}_${r.shiftType}`);
      if (set) {
        set.add(r.userId);
      }
    });

  // Track assignments: day -> shiftType -> string[] (userIds)
  const shiftAssignmentsMap = new Map<string, string[]>();
  // Track daily shift count per user: `${day}_${userId}` -> number
  const dailyUserShiftCount = new Map<string, number>();
  // Track total weekly shifts per user: userId -> number
  const weeklyUserShiftCount = new Map<string, number>();

  activeStaff.forEach((s) => {
    weeklyUserShiftCount.set(s.id, 0);
  });

  const getDailyCount = (day: DayOfWeek, userId: string) => {
    return dailyUserShiftCount.get(`${day}_${userId}`) || 0;
  };

  const incrementUserShift = (day: DayOfWeek, shiftType: ShiftType, userId: string) => {
    const key = `${day}_${shiftType}`;
    const list = shiftAssignmentsMap.get(key) || [];
    list.push(userId);
    shiftAssignmentsMap.set(key, list);

    dailyUserShiftCount.set(`${day}_${userId}`, getDailyCount(day, userId) + 1);
    weeklyUserShiftCount.set(userId, (weeklyUserShiftCount.get(userId) || 0) + 1);
  };

  // PASS 1: Assign registered staff who currently have 0 shifts on that day (prioritize 1 shift/day)
  days.forEach((day) => {
    shiftTypes.forEach((shiftType) => {
      const regSet = regMap.get(`${day}_${shiftType}`) || new Set();
      const currentAssigned = shiftAssignmentsMap.get(`${day}_${shiftType}`) || [];

      const candidates = Array.from(regSet)
        .filter((userId) => !currentAssigned.includes(userId) && getDailyCount(day, userId) === 0)
        .sort((a, b) => (weeklyUserShiftCount.get(a) || 0) - (weeklyUserShiftCount.get(b) || 0));

      while (candidates.length > 0 && (shiftAssignmentsMap.get(`${day}_${shiftType}`) || []).length < targetStaffPerShift) {
        const nextUser = candidates.shift();
        if (nextUser) {
          incrementUserShift(day, shiftType, nextUser);
        }
      }
    });
  });

  // PASS 2: If any shift still has < targetStaffPerShift, check registered staff who have 1 shift today (allow max 2 shifts/day, NEVER 3)
  days.forEach((day) => {
    shiftTypes.forEach((shiftType) => {
      const key = `${day}_${shiftType}`;
      const currentAssigned = shiftAssignmentsMap.get(key) || [];
      if (currentAssigned.length < targetStaffPerShift) {
        const regSet = regMap.get(key) || new Set();
        const candidates = Array.from(regSet)
          .filter((userId) => !currentAssigned.includes(userId) && getDailyCount(day, userId) === 1)
          .sort((a, b) => (weeklyUserShiftCount.get(a) || 0) - (weeklyUserShiftCount.get(b) || 0));

        while (candidates.length > 0 && (shiftAssignmentsMap.get(key) || []).length < targetStaffPerShift) {
          const nextUser = candidates.shift();
          if (nextUser) {
            incrementUserShift(day, shiftType, nextUser);
          }
        }
      }
    });
  });

  // PASS 3: If still understaffed (< targetStaffPerShift), check ANY active staff of this branch who have 0 shifts today
  days.forEach((day) => {
    shiftTypes.forEach((shiftType) => {
      const key = `${day}_${shiftType}`;
      const currentAssigned = shiftAssignmentsMap.get(key) || [];
      if (currentAssigned.length < targetStaffPerShift) {
        const candidates = activeStaff
          .map((s) => s.id)
          .filter((userId) => !currentAssigned.includes(userId) && getDailyCount(day, userId) === 0)
          .sort((a, b) => (weeklyUserShiftCount.get(a) || 0) - (weeklyUserShiftCount.get(b) || 0));

        while (candidates.length > 0 && (shiftAssignmentsMap.get(key) || []).length < targetStaffPerShift) {
          const nextUser = candidates.shift();
          if (nextUser) {
            incrementUserShift(day, shiftType, nextUser);
          }
        }
      }
    });
  });

  // PASS 4: Final fallback for critical minimum 2 staff - check active staff with 1 shift today (never > 2 shifts)
  days.forEach((day) => {
    shiftTypes.forEach((shiftType) => {
      const key = `${day}_${shiftType}`;
      const currentAssigned = shiftAssignmentsMap.get(key) || [];
      if (currentAssigned.length < targetStaffPerShift) {
        const candidates = activeStaff
          .map((s) => s.id)
          .filter((userId) => !currentAssigned.includes(userId) && getDailyCount(day, userId) === 1)
          .sort((a, b) => (weeklyUserShiftCount.get(a) || 0) - (weeklyUserShiftCount.get(b) || 0));

        while (candidates.length > 0 && (shiftAssignmentsMap.get(key) || []).length < targetStaffPerShift) {
          const nextUser = candidates.shift();
          if (nextUser) {
            incrementUserShift(day, shiftType, nextUser);
          }
        }
      }
    });
  });

  // Build final assignments
  const finalAssignments: ShiftAssignment[] = [];
  const warnings: string[] = [];
  let understaffedCount = 0;
  let singleShiftDaysCount = 0;
  let doubleShiftDaysCount = 0;
  let tripleShiftDaysCount = 0;

  days.forEach((day) => {
    const solarInfo = getSolarDateInfo(weekId, day);
    shiftTypes.forEach((shiftType) => {
      const key = `${day}_${shiftType}`;
      const assigned = shiftAssignmentsMap.get(key) || [];
      
      if (assigned.length < targetStaffPerShift) {
        understaffedCount++;
        const dayLabel = DAYS_OF_WEEK.find((d) => d.key === day)?.label || day;
        const shiftName = shiftType === 'morning' ? 'Ca Sáng' : shiftType === 'afternoon' ? 'Ca Chiều' : 'Ca Tối';
        warnings.push(`${dayLabel} (${solarInfo.formattedShort}) - ${shiftName}: Hiện chỉ có ${assigned.length}/${targetStaffPerShift} nhân viên.`);
      }

      finalAssignments.push({
        id: `assign_${branchId}_${weekId}_${day}_${shiftType}`,
        branchId,
        weekId,
        day,
        shiftType,
        solarDate: solarInfo.dateStr,
        assignedUserIds: assigned,
        status: 'approved',
        updatedAt: new Date().toISOString(),
      });
    });

    // Count shift distribution per day
    activeStaff.forEach((staff) => {
      const count = getDailyCount(day, staff.id);
      if (count === 1) singleShiftDaysCount++;
      else if (count === 2) doubleShiftDaysCount++;
      else if (count >= 3) tripleShiftDaysCount++;
    });
  });

  let totalStaffSlotsAssigned = 0;
  finalAssignments.forEach((a) => {
    totalStaffSlotsAssigned += a.assignedUserIds.length;
  });

  const staffWorkload: Record<string, number> = {};
  activeStaff.forEach((s) => {
    staffWorkload[s.id] = weeklyUserShiftCount.get(s.id) || 0;
  });

  return {
    assignments: finalAssignments,
    stats: {
      totalShiftsNeeded: 21,
      totalStaffSlotsAssigned,
      understaffedCount,
      singleShiftDaysCount,
      doubleShiftDaysCount,
      tripleShiftDaysCount,
      staffWorkload,
    },
    warnings,
  };
}
