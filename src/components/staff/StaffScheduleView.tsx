import React, { useState } from 'react';
import { 
  User, 
  ShiftAssignment, 
  Branch, 
  DAYS_OF_WEEK, 
  SHIFT_DEFINITIONS, 
  ShiftType, 
  DayOfWeek 
} from '../../types';
import { 
  CalendarDays, 
  Users, 
  Clock, 
  CheckCircle2, 
  Download, 
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { 
  getSolarDateInfo, 
  getSolarWeekRangeText, 
  getAvailableSolarWeeks,
  getCurrentSolarWeekId,
  getNextWeekId,
  getPrevWeekId,
  isCurrentWeek
} from '../../utils/solarCalendar';

interface StaffScheduleViewProps {
  currentUser: User;
  branches: Branch[];
  allStaff: User[];
  weekId: string;
  onSelectWeek?: (weekId: string) => void;
  assignments: ShiftAssignment[];
}

export const StaffScheduleView: React.FC<StaffScheduleViewProps> = ({
  currentUser,
  branches = [],
  allStaff = [],
  weekId,
  onSelectWeek,
  assignments = [],
}) => {
  const [viewMode, setViewMode] = useState<'my_only' | 'full_roster'>('my_only');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    currentUser.branchId || branches?.[0]?.id || 'cn_quan1'
  );

  const availableWeeks = getAvailableSolarWeeks(weekId, 6, 10);
  const currentBranch = branches?.find((b) => b.id === selectedBranchId) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };
  const solarRange = getSolarWeekRangeText(weekId);
  const isThisWeek = isCurrentWeek(weekId);
  const currentSolarWeekId = getCurrentSolarWeekId();

  const dayIndex = new Date().getDay();
  const dayKeyMap: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayKeyMap[dayIndex];
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>(todayKey || 'mon');

  // Filter assignments for selected branch and selected solar week
  const branchAssignments = assignments.filter(
    (a) => a.weekId === weekId && (a.branchId === selectedBranchId || (!a.branchId && selectedBranchId === currentUser.branchId))
  );

  const myAssignments = branchAssignments.filter(
    (a) => a.assignedUserIds.includes(currentUser.id)
  );

  // Quick next/prev week navigators using dynamic ISO week math
  const handlePrevWeek = () => {
    if (onSelectWeek) {
      onSelectWeek(getPrevWeekId(weekId));
    }
  };
  const handleNextWeek = () => {
    if (onSelectWeek) {
      onSelectWeek(getNextWeekId(weekId));
    }
  };
  const handleResetToCurrentWeek = () => {
    if (onSelectWeek) {
      onSelectWeek(currentSolarWeekId);
    }
  };

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PartFlow//Staff Schedule//VI\n";
    
    myAssignments.forEach((assign) => {
      const shiftDef = SHIFT_DEFINITIONS[assign.shiftType];
      const solarInfo = getSolarDateInfo(weekId, assign.day);
      icsContent += `BEGIN:VEVENT\nSUMMARY:Ca làm việc ${shiftDef.name} (${shiftDef.timeRange})\nDESCRIPTION:Ca trực tại ${currentBranch.name} ngày ${solarInfo.displayFullWithDay}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lich_Lam_Viec_${currentUser.name}_${weekId}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStaffList = (userIds: string[]) => {
    return userIds
      .map((id) => allStaff.find((s) => s.id === id))
      .filter((s): s is User => Boolean(s));
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 md:pb-6">
      {/* Control Bar: Solar Calendar Week Selector, Branch Picker & View Switch */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title & Solar Calendar Range & Branch */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-800">
                  Lịch Làm Việc (Dương Lịch)
                </h2>
                {isThisWeek ? (
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Tuần này (Hiện tại)
                  </span>
                ) : weekId > currentSolarWeekId ? (
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Lịch tuần tới
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    Lịch tuần cũ
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className="font-bold flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600 inline" />
                  {solarRange}
                </span>
                <span>•</span>
                <span>
                  Bạn có <strong className="text-emerald-700">{myAssignments.length} ca</strong> ({myAssignments.length * 5} giờ) tại {currentBranch.shortName}
                </span>
              </div>
            </div>
          </div>

          {/* Branch & Week Selection Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Branch Selector */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Chi nhánh:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName} {b.id === currentUser.branchId ? '(Quán của tôi)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Jump to Current Week button if navigating away */}
            {!isThisWeek && onSelectWeek && (
              <button
                type="button"
                onClick={handleResetToCurrentWeek}
                className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <RotateCcw className="w-3 h-3 text-emerald-600" />
                <span>Về tuần này</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Week Selector Controls & View Mode Switches */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Selection with Prev / Next buttons */}
          {onSelectWeek && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevWeek}
                title="Lùi lại tuần cũ (Back)"
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={weekId}
                onChange={(e) => onSelectWeek(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent px-2 py-1 focus:outline-none cursor-pointer max-w-[210px] sm:max-w-none"
              >
                {availableWeeks.map((w) => (
                  <option key={w.weekId} value={w.weekId}>
                    {w.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextWeek}
                title="Sang tuần tiếp theo (Next)"
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toggle Switch: My Only vs Whole Branch */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-700 border border-slate-200">
            <button
              onClick={() => setViewMode('my_only')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'my_only'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ca của tôi
            </button>
            <button
              onClick={() => setViewMode('full_roster')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'full_roster'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cả chi nhánh
            </button>
          </div>

          <button
            onClick={handleExportICS}
            title="Tải lịch về điện thoại / Google Calendar (.ics)"
            className="px-3 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất .ics</span>
          </button>
        </div>
      </div>

      {/* MOBILE DAY SELECTOR & CARDS VIEW */}
      <div className="md:hidden space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Xem lịch theo ngày (Dương Lịch):
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedMobileDay === d.key;
            const isToday = d.key === todayKey;
            const solarInfo = getSolarDateInfo(weekId, d.key);
            const myShiftsOnDay = branchAssignments.filter(
              (a) => a.day === d.key && a.assignedUserIds.includes(currentUser.id)
            );

            return (
              <button
                key={d.key}
                onClick={() => setSelectedMobileDay(d.key)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex flex-col items-center min-w-[66px] border relative ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{d.shortLabel}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {solarInfo.formattedShort}
                </span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {myShiftsOnDay.length > 0 ? `${myShiftsOnDay.length} ca` : 'Nghỉ'}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1.5 right-1.5" title="Hôm nay" />
                )}
              </button>
            );
          })}
        </div>

        {/* Shift Cards for selected day on mobile */}
        <div className="space-y-3">
          {(['morning', 'afternoon', 'evening'] as ShiftType[]).map((shiftType) => {
            const shiftDef = SHIFT_DEFINITIONS[shiftType];
            const assignment = branchAssignments.find(
              (a) => a.day === selectedMobileDay && a.shiftType === shiftType
            );
            const assignedStaff = assignment ? getStaffList(assignment.assignedUserIds) : [];
            const isMeAssigned = assignment?.assignedUserIds.includes(currentUser.id);

            if (viewMode === 'my_only' && !isMeAssigned) {
              return null;
            }

            return (
              <div
                key={shiftType}
                className={`p-4 rounded-2xl border transition-all ${
                  isMeAssigned
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-sm text-slate-900">{shiftDef.name}</span>
                      <span className="text-xs text-slate-500 font-mono ml-2">({shiftDef.timeRange})</span>
                    </div>
                  </div>
                  {isMeAssigned && (
                    <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ca của bạn</span>
                    </span>
                  )}
                </div>

                <div className="py-2.5">
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">
                    Đồng nghiệp cùng ca ({assignedStaff.length} người):
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {assignedStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className={`flex items-center space-x-2 p-2 rounded-xl border ${
                          staff.id === currentUser.id
                            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs truncate">
                            {staff.name} {staff.id === currentUser.id && '(Tôi)'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">
                            {staff.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {viewMode === 'my_only' && !branchAssignments.some(
            (a) => a.day === selectedMobileDay && a.assignedUserIds.includes(currentUser.id)
          ) && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">Bạn không có ca làm việc vào ngày này</div>
              <p className="text-xs text-slate-400">Hãy chọn "Cả chi nhánh" để xem lịch của đồng nghiệp.</p>
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP GRID OF 7 DAYS */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((d) => {
          const isToday = d.key === todayKey;
          const solarInfo = getSolarDateInfo(weekId, d.key);
          const dayAssignments = branchAssignments.filter((a) => a.day === d.key);

          const myShiftsToday = dayAssignments.filter((a) =>
            a.assignedUserIds.includes(currentUser.id)
          );

          return (
            <div
              key={d.key}
              className={`bg-white rounded-2xl border transition-all p-3 flex flex-col space-y-2.5 shadow-2xs ${
                isToday
                  ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">{d.label}</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                    {solarInfo.formattedShort}
                  </span>
                  {isToday && (
                    <span className="mt-1 inline-block text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                      Hôm nay
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {myShiftsToday.length} ca
                </span>
              </div>

              {/* Shifts for this day */}
              <div className="space-y-2 flex-1">
                {(['morning', 'afternoon', 'evening'] as ShiftType[]).map((shiftType) => {
                  const shiftDef = SHIFT_DEFINITIONS[shiftType];
                  const assign = dayAssignments.find((a) => a.shiftType === shiftType);
                  const isMeAssigned = assign?.assignedUserIds.includes(currentUser.id);
                  const staffList = assign ? getStaffList(assign.assignedUserIds) : [];

                  if (viewMode === 'my_only' && !isMeAssigned) {
                    return (
                      <div
                        key={shiftType}
                        className="p-2 rounded-xl border border-dashed border-slate-200 text-slate-300 text-[10px] text-center"
                      >
                        {shiftDef.name} (Trống)
                      </div>
                    );
                  }

                  return (
                    <div
                      key={shiftType}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isMeAssigned
                          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={isMeAssigned ? 'text-emerald-950' : 'text-slate-800'}>
                          {shiftDef.name}
                        </span>
                        {isMeAssigned && (
                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                            Tôi
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {shiftDef.timeRange}
                      </div>

                      {/* Staff Avatars */}
                      {staffList.length > 0 && (
                        <div className="mt-2 pt-1 border-t border-slate-200/50 space-y-1">
                          {staffList.map((s) => (
                            <div
                              key={s.id}
                              className={`flex items-center space-x-1.5 text-[10px] ${
                                s.id === currentUser.id ? 'font-bold text-emerald-900' : 'text-slate-600'
                              }`}
                            >
                              <img
                                src={s.avatar}
                                alt={s.name}
                                className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                              />
                              <span className="truncate">{s.name.split(' ').slice(-1)[0]}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
