import React from 'react';
import { 
  User, 
  ShiftAssignment, 
  AttendanceRecord, 
  ShiftRegistration, 
  WifiStoreConfig, 
  Branch, 
  SHIFT_DEFINITIONS
} from '../../types';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  Sparkles, 
  Wifi, 
  AlertCircle, 
  Building2, 
  Pin,
  ChevronRight, 
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { 
  getSolarDateInfo, 
  getSolarWeekRangeText, 
  formatSolarDateWithWeekday 
} from '../../utils/solarCalendar';

interface ManagerDashboardViewProps {
  currentUser: User;
  allStaff: User[];
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onOpenBranchModal: () => void;
  weekId: string;
  assignments: ShiftAssignment[];
  attendanceLogs: AttendanceRecord[];
  registrations: ShiftRegistration[];
  wifiConfig: WifiStoreConfig;
  currentSimulatedWifi: string;
  onNavigateTab: (tab: string) => void;
  onOpenAutoSchedule: () => void;
  onOpenWifiModal: () => void;
}

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({
  currentUser,
  allStaff = [],
  branches = [],
  activeBranchId,
  onSelectBranch,
  onOpenBranchModal,
  weekId,
  assignments = [],
  attendanceLogs = [],
  registrations = [],
  currentSimulatedWifi,
  onNavigateTab,
  onOpenAutoSchedule,
  onOpenWifiModal,
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

  // Filter data specifically for the selected branch
  const branchStaff = allStaff.filter(
    (u) => u.role === 'staff' && u.branchId === activeBranchId
  );
  const branchAssignments = assignments.filter((a) => a.branchId === activeBranchId && a.weekId === weekId);
  const branchRegistrations = registrations.filter((r) => r.branchId === activeBranchId && r.weekId === weekId);
  const branchAttendance = attendanceLogs.filter((l) => l.branchId === activeBranchId);

  // Registered staff count
  const registeredStaffCount = Array.from(new Set(branchRegistrations.map((r) => r.userId))).length;

  // Today Solar Date
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayDayOfWeekMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const currentDayOfWeek = todayDayOfWeekMap[new Date().getDay()];

  // Today shifts for this branch
  const todayAssignments = branchAssignments.filter((a) => a.day === currentDayOfWeek);
  const todayLogs = branchAttendance.filter((l) => l.date === todayDateStr);
  const todayActiveCount = todayLogs.filter((l) => !l.checkOutTime).length;

  // Pending shifts count for this branch
  const pendingShiftsCount = branchAssignments.filter((a) => a.status === 'pending').length;

  // Check if current WiFi matches pinned WiFi
  const isPinnedWifiActive = currentBranch.pinnedWifiSsid.toLowerCase() === currentSimulatedWifi.toLowerCase();

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner: Branch Selection & Solar Calendar Overview */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">{formatSolarDateWithWeekday(todayDateStr)}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-700">Dương Lịch: {getSolarWeekRangeText(weekId)}</span>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
                <Building2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight">
                  {currentBranch.name}
                </h1>
                <p className="text-xs text-slate-500 truncate max-w-xl">
                  {currentBranch.address} • Hotline: {currentBranch.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Branch Switcher Pill */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {branches.map((b) => {
                const isSelected = b.id === activeBranchId;
                return (
                  <button
                    key={b.id}
                    onClick={() => onSelectBranch(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b.shortName}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onOpenBranchModal}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quản Trị Chi Nhánh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Scoped to this branch */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Branch Staff */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nhân Sự Chi Nhánh</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {branchStaff.length} <span className="text-xs font-normal text-slate-500">nhân viên</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span>Độc lập tại {currentBranch.shortName}</span>
            </div>
          </div>
        </div>

        {/* 2. Today Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đang Trong Ca</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              {todayActiveCount} <span className="text-xs font-normal text-slate-500">người</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Đã check-in hôm nay: {todayLogs.length} lượt
            </div>
          </div>
        </div>

        {/* 3. Shift Completion for this branch */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lịch Phân Ca Tuần</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {branchAssignments.length} <span className="text-xs font-normal text-slate-500">ca</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {pendingShiftsCount > 0 ? (
                <span className="text-amber-600 font-bold">Cần duyệt {pendingShiftsCount} ca thiếu người</span>
              ) : (
                <span className="text-emerald-600 font-bold">✓ Đã đủ nhân sự các ca</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Pinned WiFi Status Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">WiFi Đã Ghim</span>
            <button
              onClick={onOpenWifiModal}
              title="Đổi hoặc ghim WiFi mới"
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Pin className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-xs font-mono font-bold text-slate-900 truncate" title={currentBranch.pinnedWifiSsid}>
              📌 {currentBranch.pinnedWifiSsid}
            </div>
            <div className="mt-1.5">
              {isPinnedWifiActive ? (
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Khớp mạng chấm công
                </span>
              ) : (
                <button
                  onClick={onOpenWifiModal}
                  className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 hover:underline cursor-pointer"
                >
                  <AlertCircle className="w-3 h-3 mr-1" /> Ghim WiFi khác
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Today Roster & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Today Shifts at this branch */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Ca Trực Hôm Nay ({currentBranch.shortName})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Lịch trực theo dương lịch: {formatSolarDateWithWeekday(todayDateStr)}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Xem cả tuần</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Today Shift Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['morning', 'afternoon', 'evening'] as const).map((shiftType) => {
              const def = SHIFT_DEFINITIONS[shiftType];
              const assignment = todayAssignments.find((a) => a.shiftType === shiftType);
              const assignedUsers = (assignment?.assignedUserIds || [])
                .map((id) => branchStaff.find((u) => u.id === id))
                .filter(Boolean) as User[];

              return (
                <div
                  key={shiftType}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{def.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {def.timeRange}
                      </span>
                    </div>

                    {/* Assigned Personnel */}
                    <div className="mt-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500">
                        Nhân viên trực ({assignedUsers.length}):
                      </div>
                      {assignedUsers.length > 0 ? (
                        assignedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-slate-100"
                          >
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {user.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-amber-600 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                          Chưa phân công ca này
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Trạng thái:</span>
                    <span
                      className={`font-bold ${
                        assignedUsers.length >= 2 ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {assignedUsers.length >= 2 ? '✓ Đủ ca' : '⚠️ Thiếu người'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick Branch Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Thao Tác Nhanh Quản Lý
            </h3>
            <p className="text-xs text-slate-500">
              Chia ca và quản trị nhân sự cho {currentBranch.name}
            </p>

            <div className="mt-4 space-y-2.5">
              {/* Button 1: Auto Schedule for this branch */}
              <button
                onClick={onOpenAutoSchedule}
                className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Xếp Ca Tự Động ({currentBranch.shortName})
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    Tối ưu theo ca rảnh của {branchStaff.length} nhân viên
                  </div>
                </div>
              </button>

              {/* Button 2: Pin WiFi */}
              <button
                onClick={onOpenWifiModal}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Pin className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Ghim WiFi Chấm Công
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Hiện tại: {currentBranch.pinnedWifiSsid}
                  </div>
                </div>
              </button>

              {/* Button 3: Staff Management */}
              <button
                onClick={() => onNavigateTab('staff_mgmt')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Quản Lý & Thêm / Xóa Nhân Viên
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Thêm nhân viên mới, xóa nhân sự, chỉnh sửa lương theo giờ
                  </div>
                </div>
              </button>

              {/* Button 4: Branch Management */}
              <button
                onClick={onOpenBranchModal}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Quản Lý Danh Sách Chi Nhánh
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Thêm chi nhánh, chuyển nhân viên giữa các chi nhánh
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            <div className="font-semibold text-slate-700">Lưu ý quản lý:</div>
            Mỗi chi nhánh có danh sách nhân viên riêng. Ca làm việc tính theo lịch Dương lịch chuẩn (Thứ 2 - CN).
          </div>
        </div>
      </div>
    </div>
  );
};
