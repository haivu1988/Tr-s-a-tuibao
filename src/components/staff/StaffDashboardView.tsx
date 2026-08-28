import React, { useState } from 'react';
import { 
  User, 
  ShiftAssignment, 
  AttendanceRecord, 
  ShiftRegistration, 
  WifiStoreConfig, 
  SHIFT_DEFINITIONS, 
  DAYS_OF_WEEK, 
  DayOfWeek, 
  ShiftType,
  Branch
} from '../../types';
import { 
  Clock, 
  CalendarDays, 
  DollarSign, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  LogOut,
  Calendar,
  Activity,
  Check,
  Building2,
  Pin,
  Wifi,
  Camera,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { validateDeviceForUser, validateWifi } from '../../utils/deviceWifi';
import { getSolarDateDetailFromDate, formatSolarDateWithWeekday } from '../../utils/solarCalendar';
import { AvatarModal } from './AvatarModal';

interface StaffDashboardViewProps {
  currentUser: User;
  allStaff: User[];
  weekId: string;
  assignments: ShiftAssignment[];
  attendanceLogs: AttendanceRecord[];
  registrations: ShiftRegistration[];
  wifiConfig: WifiStoreConfig;
  currentSimulatedWifi: string;
  currentDeviceId: string;
  branches?: Branch[];
  onOpenCheckInModal: () => void;
  onNavigateTab: (tab: string) => void;
  onUpdateAvatar?: (newAvatarUrl: string) => void;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({
  currentUser,
  allStaff,
  weekId,
  assignments,
  attendanceLogs,
  registrations,
  wifiConfig,
  currentSimulatedWifi,
  currentDeviceId,
  branches = [],
  onOpenCheckInModal,
  onNavigateTab,
  onUpdateAvatar,
}) => {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);

  const currentBranch = branches.find((b) => b.id === currentUser.branchId) || branches[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const dayIndex = new Date().getDay();
  const dayKeyMap: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayKeyMap[dayIndex];
  const solarDateInfo = getSolarDateDetailFromDate(todayStr);

  // Check if current user is assigned today
  const myTodayAssignments = assignments.filter(
    (a) => a.weekId === weekId && a.day === todayKey && a.assignedUserIds.includes(currentUser.id)
  );

  // Check if currently checked-in
  const activeRecord = attendanceLogs.find(
    (l) => l.userId === currentUser.id && l.date === todayStr && !l.checkOutTime
  );

  // Total weekly assignments for this user
  const myWeeklyAssignments = assignments.filter(
    (a) => a.weekId === weekId && a.assignedUserIds.includes(currentUser.id)
  );

  // My attendance logs
  const myAttendanceLogs = attendanceLogs.filter((l) => l.userId === currentUser.id);
  const completedAttendanceCount = myAttendanceLogs.filter(
    (l) => l.status === 'completed' || l.status === 'on-time'
  ).length;

  const totalWeeklyScheduledHours = myWeeklyAssignments.length * 5;
  const estimatedEarnings = totalWeeklyScheduledHours * currentUser.hourlyRate;

  const isWifiValid =
    currentSimulatedWifi.toLowerCase().trim() === currentBranch.pinnedWifiSsid.toLowerCase().trim() ||
    currentSimulatedWifi.toLowerCase().includes(currentBranch.pinnedWifiSsid.toLowerCase()) ||
    currentSimulatedWifi === wifiConfig.primarySsid;

  const deviceValidation = validateDeviceForUser(currentUser, currentDeviceId);

  return (
    <div className="space-y-6">
      {/* Hero Banner with Shift Status & Quick Check-in Button */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            {/* User Avatar with interactive change button */}
            <div className="relative group shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400/80 shadow-md ring-4 ring-white/10"
              />
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Thay đổi ảnh đại diện"
                className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md transition-transform hover:scale-110 cursor-pointer flex items-center justify-center"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentBranch.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors cursor-pointer border border-white/10"
                >
                  <Camera className="w-3 h-3 text-emerald-300" />
                  <span>Đổi Avatar</span>
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                Chào {currentUser.name}!
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs text-slate-300">
                <p className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hôm nay: <strong className="text-white">{solarDateInfo.formattedFull}</strong></span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Pin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>WiFi: <strong className="text-emerald-300 font-mono">{currentBranch.pinnedWifiSsid}</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Check-in Status Action card */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center space-y-3 min-w-[280px]">
            {activeRecord ? (
              <>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-bold uppercase tracking-wider">Đang Trong Ca Làm Việc</span>
                </div>
                <div className="text-lg font-black text-white">
                  {SHIFT_DEFINITIONS[activeRecord.shiftType].name}
                </div>
                <div className="text-xs text-slate-300">
                  Giờ vào: <span className="font-mono font-bold text-white">{activeRecord.checkInTime}</span>
                </div>
                <button
                  onClick={onOpenCheckInModal}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Check-Out Kết Thúc Ca</span>
                </button>
              </>
            ) : myTodayAssignments.length > 0 ? (
              <>
                <div className="text-xs font-semibold text-emerald-300 flex items-center space-x-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>Hôm nay có {myTodayAssignments.length} ca trực xếp lịch</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {myTodayAssignments.map(a => SHIFT_DEFINITIONS[a.shiftType].name).join(', ')}
                </div>
                <button
                  onClick={onOpenCheckInModal}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Chấm Công Vào Ca Ngay</span>
                </button>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold text-slate-300">
                  Hôm nay bạn không có ca trực cố định
                </div>
                <div className="text-xs text-slate-400">
                  Vẫn có thể chấm công nếu làm thay hoặc tăng ca:
                </div>
                <button
                  onClick={onOpenCheckInModal}
                  className="w-full py-2.5 px-4 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Chấm Công WiFi</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI & Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Ca làm việc tuần này */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ca Xếp Tuần Này</span>
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {myWeeklyAssignments.length} <span className="text-xs text-slate-400 font-normal">ca</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Tổng ~{totalWeeklyScheduledHours} giờ làm việc
          </div>
        </div>

        {/* Stat 2: Thu nhập ước tính */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Lương Ước Tính Tuần</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700">
            {estimatedEarnings.toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">đ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Đơn giá: {currentUser.hourlyRate.toLocaleString('vi-VN')} đ/h
          </div>
        </div>

        {/* Stat 3: Số lần chấm công */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Lượt Chấm Công</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {completedAttendanceCount} <span className="text-xs text-slate-400 font-normal">lượt</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Đã ghi nhận trong hệ thống
          </div>
        </div>

        {/* Stat 4: Trạng thái địa chỉ MAC */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Khóa MAC Điện Thoại</span>
            <Smartphone className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xs font-bold text-slate-900 flex items-center space-x-1">
            {currentUser.registeredDeviceId ? (
              <span className="text-emerald-700 flex items-center font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {currentUser.registeredDeviceId}
              </span>
            ) : (
              <span className="text-amber-600 text-xs">Chưa khóa MAC</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {currentUser.registeredDeviceId ? 'Chống chấm công hộ' : 'Sẽ tự động khóa khi check-in'}
          </div>
        </div>
      </div>

      {/* Main Grid: My Shifts vs Quick Action cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My weekly schedule timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Lịch Làm Việc Chi Tiết Trong Tuần</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các ca làm việc bạn đã được duyệt phân công tại {currentBranch.shortName}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('staff_schedule')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {DAYS_OF_WEEK.map((day) => {
              const dayAssignments = myWeeklyAssignments.filter((a) => a.day === day.key);
              const isToday = day.key === todayKey;
              const isRegistered = registrations.some(
                (r) => r.weekId === weekId && r.userId === currentUser.id && r.day === day.key
              );

              return (
                <div
                  key={day.key}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isToday
                      ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                      : dayAssignments.length > 0
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{day.shortLabel}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                        <span>{day.label}</span>
                        {isToday && (
                          <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isRegistered ? 'Đã đăng ký ca rảnh' : 'Chưa đăng ký'}
                      </div>
                    </div>
                  </div>

                  {/* Shift Badges for the day */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {dayAssignments.length > 0 ? (
                      dayAssignments.map((a) => {
                        const def = SHIFT_DEFINITIONS[a.shiftType];
                        return (
                          <span
                            key={a.shiftType}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{def.name} ({def.timeRange})</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic">Không có ca trực</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Quick action cards */}
        <div className="space-y-4">
          {/* Action 1: Đăng ký ca rảnh */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Đăng Ký Ca Rảnh Tuần</h4>
              <p className="text-xs text-slate-500 mt-1">
                Đăng ký các ca bạn có thể đi làm để Quản lý xếp lịch tự động công bằng.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('staff_register')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Vào Đăng Ký Ca</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 3: Đổi ảnh đại diện */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center space-x-3">
              <img
                src={currentUser.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Hồ Sơ & Ảnh Đại Diện</h4>
                <p className="text-[11px] text-slate-500">
                  {currentUser.department || 'Nhân viên'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Tùy chỉnh ảnh đại diện cá nhân hoặc tải ảnh chân dung mới từ thiết bị.
            </p>
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đổi Ảnh Đại Diện</span>
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      {isAvatarModalOpen && (
        <AvatarModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentUser={currentUser}
          onSaveAvatar={(newAvatarUrl) => {
            if (onUpdateAvatar) {
              onUpdateAvatar(newAvatarUrl);
            }
          }}
        />
      )}
    </div>
  );
};
