import { User, ShiftRegistration, ShiftAssignment, DayOfWeek, ShiftType, DAYS_OF_WEEK } from '../types';
import { getSolarDateInfo } from './solarCalendar';

export interface ScheduleResult {
  assignments: ShiftAssignment[];
  stats: {
    totalShiftsNeeded: number; // 7 days * 3 shifts = 21 shifts
    totalStaffSlotsAssigned: number; // sum of staff across all shifts
    understaffedCount: number; // shifts with < targetStaffPerShift
    singleShiftDaysCount: number; // instances of 1 shift/day for an employee
    doubleShiftDaysCount: number; // instances of 2 shifts/day for an employee (minimized)
    tripleShiftDaysCount: number; // must be 0
    staffWorkload: Record<string, number>; // userId -> total shifts in week
    fairnessSummary?: {
      minShifts: number;
      maxShifts: number;
      avgShifts: number;
      isBalanced: boolean;
    };
  };
  warnings: string[];
}

/**
 * Thuật toán Tự Động Chia Ca Cân Bằng ("Same Same Nhau" - Fair & Balanced Workload Allocation)
 * 
 * Các nguyên tắc cốt lõi:
 * 1. Chỉ xếp ca cho nhân viên ĐÃ ĐĂNG KÝ ca đó (Tuyệt đối không xếp ca ngoài đăng ký).
 * 2. Số ca giữa các nhân viên được cân bằng tối đa ("same same nhau"): chênh lệch giữa người nhiều ca nhất
 *    và người ít ca nhất không vượt quá 1 ca (trừ trường hợp nhân viên tự đăng ký quá ít ca).
 * 3. Ưu tiên 1 ca/ngày. Chỉ xếp ca thứ 2 trong ngày khi không còn nhân viên nào khác đăng ký, TUYỆT ĐỐI KHÔNG 3 CA/NGÀY.
 * 4. Xử lý các ca khan hiếm nhân sự trước (Most Constrained First) kết hợp chu trình san bằng tải (Iterative Leveling & Rebalance).
 */
export function autoScheduleWeek(
  branchId: string,
  weekId: string,
  staffList: User[],
  registrations: ShiftRegistration[],
  targetStaffPerShift: number = 2
): ScheduleResult {
  // Chỉ lấy nhân viên chính thức đang hoạt động tại chi nhánh này
  const activeStaff = staffList.filter(
    (s) => s.role === 'staff' && s.status === 'active' && s.branchId === branchId
  );
  const shiftTypes: ShiftType[] = ['morning', 'afternoon', 'evening'];
  const days: DayOfWeek[] = DAYS_OF_WEEK.map((d) => d.key);

  // Tạo danh sách 21 ca trong tuần
  const allShifts: Array<{ day: DayOfWeek; shiftType: ShiftType; key: string }> = [];
  days.forEach((day) => {
    shiftTypes.forEach((shiftType) => {
      allShifts.push({ day, shiftType, key: `${day}_${shiftType}` });
    });
  });

  // Bản đồ lưu danh sách nhân viên đã đăng ký cho từng ca
  // Key: `${day}_${shiftType}` -> Set<userId>
  const regMap = new Map<string, Set<string>>();
  allShifts.forEach((s) => {
    regMap.set(s.key, new Set<string>());
  });

  // Đếm tổng số ca mỗi nhân viên đã đăng ký trong tuần này
  const userTotalRegCount = new Map<string, number>();
  activeStaff.forEach((s) => userTotalRegCount.set(s.id, 0));

  registrations
    .filter((r) => r.branchId === branchId && r.weekId === weekId)
    .forEach((r) => {
      const key = `${r.day}_${r.shiftType}`;
      const set = regMap.get(key);
      if (set && activeStaff.some((s) => s.id === r.userId)) {
        if (!set.has(r.userId)) {
          set.add(r.userId);
          userTotalRegCount.set(r.userId, (userTotalRegCount.get(r.userId) || 0) + 1);
        }
      }
    });

  // Bản đồ phân ca kết quả: Key: `${day}_${shiftType}` -> string[] (danh sách userIds)
  const shiftAssignmentsMap = new Map<string, string[]>();
  allShifts.forEach((s) => {
    shiftAssignmentsMap.set(s.key, []);
  });

  // Theo dõi số ca mỗi ngày của từng NV: Key: `${day}_${userId}` -> number
  const dailyUserShiftCount = new Map<string, number>();
  // Theo dõi tổng số ca trong tuần của từng NV: userId -> number
  const weeklyUserShiftCount = new Map<string, number>();

  activeStaff.forEach((s) => {
    weeklyUserShiftCount.set(s.id, 0);
    days.forEach((d) => {
      dailyUserShiftCount.set(`${d}_${s.id}`, 0);
    });
  });

  const getDailyCount = (day: DayOfWeek, userId: string): number => {
    return dailyUserShiftCount.get(`${day}_${userId}`) || 0;
  };

  const getWeeklyCount = (userId: string): number => {
    return weeklyUserShiftCount.get(userId) || 0;
  };

  const assignUserToShift = (day: DayOfWeek, shiftType: ShiftType, userId: string) => {
    const key = `${day}_${shiftType}`;
    const list = shiftAssignmentsMap.get(key) || [];
    if (!list.includes(userId)) {
      list.push(userId);
      shiftAssignmentsMap.set(key, list);
      dailyUserShiftCount.set(`${day}_${userId}`, getDailyCount(day, userId) + 1);
      weeklyUserShiftCount.set(userId, getWeeklyCount(userId) + 1);
    }
  };

  const removeUserFromShift = (day: DayOfWeek, shiftType: ShiftType, userId: string) => {
    const key = `${day}_${shiftType}`;
    const list = shiftAssignmentsMap.get(key) || [];
    const idx = list.indexOf(userId);
    if (idx !== -1) {
      list.splice(idx, 1);
      shiftAssignmentsMap.set(key, list);
      dailyUserShiftCount.set(`${day}_${userId}`, Math.max(0, getDailyCount(day, userId) - 1));
      weeklyUserShiftCount.set(userId, Math.max(0, getWeeklyCount(userId) - 1));
    }
  };

  // Tính số lượng slot lý tưởng cần phân bổ
  const totalSlotsNeeded = allShifts.length * targetStaffPerShift; // Ví dụ 21 * 2 = 42 slots
  const staffCount = activeStaff.length;
  const idealAvgShifts = staffCount > 0 ? Math.ceil(totalSlotsNeeded / staffCount) : 7;

  // Sắp xếp các ca: Ưu tiên ca khan hiếm người đăng ký trước (Most Constrained Shift First)
  // Các ca ít người đăng ký cần xếp trước để không bỏ lỡ nhân sự duy nhất có thể làm ca đó.
  const getSortedShifts = () => {
    return [...allShifts].sort((a, b) => {
      const regA = regMap.get(a.key)?.size || 0;
      const regB = regMap.get(b.key)?.size || 0;
      return regA - regB;
    });
  };

  // =========================================================================
  // GIAI ĐOẠN 1: PHÂN BỔ THEO VÒNG LẶP CÂN BẰNG TỪNG NẤC (Water-filling Rounds)
  // Mục tiêu: Giữ số ca của tất cả nhân viên tăng dần đều nhau (1 ca -> 2 ca -> 3 ca...)
  // =========================================================================
  const maxPassCap = Math.max(idealAvgShifts + 2, 8);

  for (let cap = 1; cap <= maxPassCap; cap++) {
    const sortedShifts = getSortedShifts();
    
    sortedShifts.forEach(({ day, shiftType, key }) => {
      const currentList = shiftAssignmentsMap.get(key) || [];
      if (currentList.length >= targetStaffPerShift) return;

      const regSet = regMap.get(key) || new Set<string>();
      
      // Lựa chọn ứng viên thỏa mãn:
      // 1. Đã đăng ký ca này
      // 2. Chưa được xếp vào ca này
      // 3. Ngày hôm nay chưa có ca nào (0 ca/ngày - ưu tiên hàng đầu)
      // 4. Tổng ca trong tuần hiện tại < cap
      const eligible0ShiftToday = Array.from(regSet).filter(
        (userId) =>
          !currentList.includes(userId) &&
          getDailyCount(day, userId) === 0 &&
          getWeeklyCount(userId) < cap
      );

      // Sắp xếp ứng viên ưu tiên:
      // - Người đang có ít ca trong tuần nhất (để kéo số ca lên bằng nhau)
      // - Người có ít tổng ca đăng ký hơn (tính linh hoạt thấp hơn cần ưu tiên ca hiếm)
      eligible0ShiftToday.sort((a, b) => {
        const diffWeekly = getWeeklyCount(a) - getWeeklyCount(b);
        if (diffWeekly !== 0) return diffWeekly;
        return (userTotalRegCount.get(a) || 0) - (userTotalRegCount.get(b) || 0);
      });

      while (
        eligible0ShiftToday.length > 0 &&
        (shiftAssignmentsMap.get(key) || []).length < targetStaffPerShift
      ) {
        const nextUser = eligible0ShiftToday.shift();
        if (nextUser) {
          assignUserToShift(day, shiftType, nextUser);
        }
      }
    });
  }

  // =========================================================================
  // GIAI ĐOẠN 2: LẤP CÁC CA CÒN THIẾU VỚI 1 CA/NGÀY (Nếu còn ứng viên đăng ký)
  // =========================================================================
  const sortedShiftsPhase2 = getSortedShifts();
  sortedShiftsPhase2.forEach(({ day, shiftType, key }) => {
    const currentList = shiftAssignmentsMap.get(key) || [];
    if (currentList.length >= targetStaffPerShift) return;

    const regSet = regMap.get(key) || new Set<string>();
    const eligible0ShiftToday = Array.from(regSet).filter(
      (userId) => !currentList.includes(userId) && getDailyCount(day, userId) === 0
    );

    eligible0ShiftToday.sort((a, b) => getWeeklyCount(a) - getWeeklyCount(b));

    while (
      eligible0ShiftToday.length > 0 &&
      (shiftAssignmentsMap.get(key) || []).length < targetStaffPerShift
    ) {
      const nextUser = eligible0ShiftToday.shift();
      if (nextUser) {
        assignUserToShift(day, shiftType, nextUser);
      }
    }
  });

  // =========================================================================
  // GIAI ĐOẠN 3: NẾU VẪN THIẾU NGƯỜI, CHO PHÉP TỐI ĐA 2 CA/NGÀY (TUYỆT ĐỐI CẤM 3 CA)
  // Vẫn ưu tiên nhân viên có tổng ca tuần thấp nhất trước để đảm bảo "same same nhau"
  // =========================================================================
  const sortedShiftsPhase3 = getSortedShifts();
  sortedShiftsPhase3.forEach(({ day, shiftType, key }) => {
    const currentList = shiftAssignmentsMap.get(key) || [];
    if (currentList.length >= targetStaffPerShift) return;

    const regSet = regMap.get(key) || new Set<string>();
    const eligible1ShiftToday = Array.from(regSet).filter(
      (userId) =>
        !currentList.includes(userId) &&
        getDailyCount(day, userId) === 1 // Đang có 1 ca hôm nay, cho phép thêm ca thứ 2
    );

    eligible1ShiftToday.sort((a, b) => getWeeklyCount(a) - getWeeklyCount(b));

    while (
      eligible1ShiftToday.length > 0 &&
      (shiftAssignmentsMap.get(key) || []).length < targetStaffPerShift
    ) {
      const nextUser = eligible1ShiftToday.shift();
      if (nextUser) {
        assignUserToShift(day, shiftType, nextUser);
      }
    }
  });

  // =========================================================================
  // GIAI ĐOẠN 4: SAN BẰNG TẢI NÂNG CAO (FAIRNESS LEVELING & REBALANCING OPTIMIZER)
  // Tìm các cặp nhân viên có chênh lệch ca (ví dụ A có 7 ca, B chỉ có 4 ca)
  // Nếu B cũng đăng ký một trong các ca của A và B chưa làm ca đó (và < 2 ca ngày đó),
  // thực hiện chuyển ca từ A sang B để số ca cân bằng tuyệt đối!
  // =========================================================================
  let improved = true;
  let iteration = 0;
  const MAX_ITERATIONS = 50;

  while (improved && iteration < MAX_ITERATIONS) {
    improved = false;
    iteration++;

    // Sắp xếp nhân viên theo số ca tuần giảm dần
    const sortedStaffByWorkload = [...activeStaff].sort(
      (a, b) => getWeeklyCount(b.id) - getWeeklyCount(a.id)
    );

    for (let i = 0; i < sortedStaffByWorkload.length; i++) {
      const highUser = sortedStaffByWorkload[i];
      const highCount = getWeeklyCount(highUser.id);

      for (let j = sortedStaffByWorkload.length - 1; j > i; j--) {
        const lowUser = sortedStaffByWorkload[j];
        const lowCount = getWeeklyCount(lowUser.id);

        // Chỉ cần điều chuyển nếu người nhiều ca hơn người ít ca từ 2 ca trở lên
        if (highCount - lowCount <= 1) break;

        // Tìm ca nào của highUser mà lowUser cũng đăng ký và có thể nhận
        let transferred = false;
        for (const shift of allShifts) {
          const list = shiftAssignmentsMap.get(shift.key) || [];
          if (!list.includes(highUser.id)) continue;

          // Kiểm tra xem lowUser có đăng ký ca này không
          const regSet = regMap.get(shift.key) || new Set<string>();
          if (!regSet.has(lowUser.id)) continue;

          // lowUser chưa có trong ca này
          if (list.includes(lowUser.id)) continue;

          const lowDailyCount = getDailyCount(shift.day, lowUser.id);
          // lowUser chỉ được nhận nếu ngày đó đang có 0 ca (ưu tiên tuyệt đối) hoặc 1 ca (nếu cần)
          if (lowDailyCount >= 2) continue;

          // Nếu highUser đang có 2 ca trong ngày đó, chuyển ca còn giúp giảm double shift!
          const highDailyCount = getDailyCount(shift.day, highUser.id);

          // Thực hiện điều chuyển 1 ca từ highUser sang lowUser
          removeUserFromShift(shift.day, shift.shiftType, highUser.id);
          assignUserToShift(shift.day, shift.shiftType, lowUser.id);

          improved = true;
          transferred = true;
          break;
        }

        if (transferred) break;
      }

      if (improved) break;
    }
  }

  // =========================================================================
  // GIAI ĐOẠN 5: TỐI ƯU HÓA GIẢM SỐ NGÀY LÀM 2 CA (DOUBLE SHIFTS REDUCTION)
  // Nếu có nhân viên A đang làm 2 ca/ngày, tìm xem có nhân viên B đăng ký ca đó,
  // có 0 ca trong ngày đó và có số ca tuần <= A không. Nếu có, chuyển để A chỉ làm 1 ca/ngày.
  // =========================================================================
  for (const shift of allShifts) {
    const list = shiftAssignmentsMap.get(shift.key) || [];
    const regSet = regMap.get(shift.key) || new Set<string>();

    for (const userId of [...list]) {
      if (getDailyCount(shift.day, userId) >= 2) {
        // userId đang phải làm 2 ca hôm nay
        // Tìm ứng viên thay thế có 0 ca hôm nay và tổng ca tuần hợp lý
        const potentialSub = Array.from(regSet).find(
          (subId) =>
            !list.includes(subId) &&
            getDailyCount(shift.day, subId) === 0 &&
            getWeeklyCount(subId) <= getWeeklyCount(userId)
        );

        if (potentialSub) {
          removeUserFromShift(shift.day, shift.shiftType, userId);
          assignUserToShift(shift.day, shift.shiftType, potentialSub);
        }
      }
    }
  }

  // =========================================================================
  // TẠO KẾT QUẢ VÀ THỐNG KÊ CHI TIẾT
  // =========================================================================
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
      const regSet = regMap.get(key) || new Set();

      if (assigned.length < targetStaffPerShift) {
        understaffedCount++;
        const dayLabel = DAYS_OF_WEEK.find((d) => d.key === day)?.label || day;
        const shiftName =
          shiftType === 'morning'
            ? 'Ca Sáng'
            : shiftType === 'afternoon'
            ? 'Ca Chiều'
            : 'Ca Tối';
        if (regSet.size === 0) {
          warnings.push(
            `${dayLabel} (${solarInfo.formattedShort}) - ${shiftName}: Chưa có nhân viên nào đăng ký ca này.`
          );
        } else {
          warnings.push(
            `${dayLabel} (${solarInfo.formattedShort}) - ${shiftName}: Chỉ có ${assigned.length}/${targetStaffPerShift} nhân viên đăng ký ca.`
          );
        }
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

    // Thống kê phân bổ ca theo ngày cho từng nhân viên
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
    staffWorkload[s.id] = getWeeklyCount(s.id);
  });

  // Tính toán mức độ đồng đều (Fairness Summary)
  const workloadCounts = Object.values(staffWorkload);
  const minShifts = workloadCounts.length > 0 ? Math.min(...workloadCounts) : 0;
  const maxShifts = workloadCounts.length > 0 ? Math.max(...workloadCounts) : 0;
  const sumShifts = workloadCounts.reduce((a, b) => a + b, 0);
  const avgShifts = workloadCounts.length > 0 ? +(sumShifts / workloadCounts.length).toFixed(1) : 0;
  const isBalanced = maxShifts - minShifts <= 1;

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
      fairnessSummary: {
        minShifts,
        maxShifts,
        avgShifts,
        isBalanced,
      },
    },
    warnings,
  };
}

