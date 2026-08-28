import React, { useState } from 'react';
import { 
  User, 
  ShiftAssignment, 
  ShiftRegistration, 
  Branch, 
  DAYS_OF_WEEK, 
  SHIFT_DEFINITIONS, 
  DayOfWeek, 
  ShiftType
} from '../../types';
import { 
  Sparkles, 
  CheckCheck, 
  Edit3, 
  Building2, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import { 
  getSolarDateInfo, 
  getSolarWeekRangeText, 
  getAvailableSolarWeeks 
} from '../../utils/solarCalendar';

interface ManagerScheduleViewProps {
  allStaff: User[];
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  weekId: string;
  onSelectWeek: (weekId: string) => void;
  assignments: ShiftAssignment[];
  registrations: ShiftRegistration[];
  onOpenAutoSchedule: () => void;
  onEditAssignment: (assignment: ShiftAssignment) => void;
  onApproveAll: () => void;
}

export const ManagerScheduleView: React.FC<ManagerScheduleViewProps> = ({
  allStaff = [],
  branches = [],
  activeBranchId,
  onSelectBranch,
  weekId,
  onSelectWeek,
  assignments = [],
  registrations = [],
  onOpenAutoSchedule,
  onEditAssignment,
  onApproveAll,
}) => {
  const currentBranch = branches?.find((b) => b.id === activeBranchId) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };
  const availableWeeks = getAvailableSolarWeeks();

  // Filter staff & assignments strictly by active branch
  const branchStaff = allStaff.filter(
    (u) => u.role === 'staff' && u.branchId === activeBranchId
  );
  const branchAssignments = assignments.filter(
    (a) => a.branchId === activeBranchId && a.weekId === weekId
  );
  const branchRegistrations = registrations.filter(
    (r) => r.branchId === activeBranchId && r.weekId === weekId
  );

  // Distinct staff who registered for this week
  const registeredStaffIds = Array.from(new Set(branchRegistrations.map((r) => r.userId)));

  const solarWeekRange = getSolarWeekRangeText(weekId);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Control Bar: Branch Selector, Solar Calendar Week Picker & Action Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Branch & Solar Week Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <select
              value={activeBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({allStaff.filter((s) => s.role === 'staff' && s.branchId === b.id).length} NV)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Lịch Dương Lịch:</span>
            <span className="font-bold text-slate-800">{solarWeekRange}</span>
          </div>
        </div>

        {/* Right: Week Selector & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Week Selector Dropdown */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
            <select
              value={weekId}
              onChange={(e) => onSelectWeek(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent px-2 py-1 focus:outline-none cursor-pointer"
            >
              {availableWeeks.map((w) => (
                <option key={w.weekId} value={w.weekId}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Schedule Trigger Button */}
          <button
            onClick={onOpenAutoSchedule}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Xếp Ca Tự Động</span>
          </button>

          {/* Approve All Shifts Button */}
          <button
            onClick={onApproveAll}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Duyệt Toàn Bộ Lịch</span>
          </button>
        </div>
      </div>

      {/* Main Solar Calendar Shift Roster Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Ma Trận Ca Làm Việc (Dương Lịch) — {currentBranch.name}
          </span>
          <span className="text-slate-500 font-medium">
            Quy chuẩn: Tối thiểu 2 nhân viên/ca
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th className="p-3 text-left font-bold text-slate-700 w-32 border-r border-slate-200">
                  Ca Làm Việc
                </th>
                {DAYS_OF_WEEK.map((day) => {
                  const solarInfo = getSolarDateInfo(weekId, day.key);
                  return (
                    <th
                      key={day.key}
                      className="p-3 text-center font-bold text-slate-800 border-r border-slate-200 last:border-r-0"
                    >
                      <div className="text-xs">{day.label}</div>
                      <div className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
                        {solarInfo.formattedShort}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {(['morning', 'afternoon', 'evening'] as const).map((shiftType) => {
                const shiftDef = SHIFT_DEFINITIONS[shiftType];
                return (
                  <tr key={shiftType} className="hover:bg-slate-50/50 transition-colors">
                    {/* Shift Label Column */}
                    <td className="p-3 bg-slate-50/70 border-r border-slate-200 align-top">
                      <div className="font-bold text-slate-900 text-xs">{shiftDef.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {shiftDef.timeRange}
                      </div>
                    </td>

                    {/* 7 Days Columns */}
                    {DAYS_OF_WEEK.map((day) => {
                      const solarInfo = getSolarDateInfo(weekId, day.key);
                      const assignment = branchAssignments.find(
                        (a) => a.day === day.key && a.shiftType === shiftType
                      );
                      const assignedUsers = (assignment?.assignedUserIds || [])
                        .map((id) => branchStaff.find((u) => u.id === id))
                        .filter(Boolean) as User[];

                      const isShortStaffed = assignedUsers.length < 2;

                      // Registered staff available for this shift
                      const registeredStaff = branchRegistrations
                        .filter((r) => r.day === day.key && r.shiftType === shiftType)
                        .map((r) => branchStaff.find((u) => u.id === r.userId))
                        .filter(Boolean) as User[];

                      return (
                        <td
                          key={day.key}
                          className="p-2.5 border-r border-slate-200 last:border-r-0 align-top h-32 hover:bg-slate-50 transition-colors group relative"
                        >
                          <div className="flex flex-col justify-between h-full space-y-1.5">
                            {/* Assigned Staff Pills */}
                            <div className="space-y-1">
                              {assignedUsers.length > 0 ? (
                                assignedUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className="bg-white p-1 rounded-lg border border-slate-200 flex items-center space-x-1.5 shadow-2xs"
                                  >
                                    <img
                                      src={user.avatar}
                                      alt={user.name}
                                      className="w-4 h-4 rounded-full object-cover shrink-0"
                                    />
                                    <span className="text-[11px] font-semibold text-slate-800 truncate">
                                      {user.name}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] text-slate-400 italic py-1">
                                  Trống ca
                                </div>
                              )}
                            </div>

                            {/* Status & Edit Action */}
                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              {isShortStaffed ? (
                                <span className="text-amber-600 font-bold">
                                  ⚠️ {assignedUsers.length}/2 người
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-bold">
                                  ✓ Đủ ca
                                </span>
                              )}

                              <button
                                onClick={() =>
                                  onEditAssignment(
                                    assignment || {
                                      id: `a_${activeBranchId}_${day.key}_${shiftType}`,
                                      branchId: activeBranchId,
                                      weekId,
                                      day: day.key,
                                      shiftType,
                                      solarDate: solarInfo.dateStr,
                                      assignedUserIds: [],
                                      status: 'pending',
                                      updatedAt: new Date().toISOString(),
                                    }
                                  )
                                }
                                className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                                title="Chỉnh sửa ca này"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
