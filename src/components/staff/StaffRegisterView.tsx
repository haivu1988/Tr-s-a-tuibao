import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShiftRegistration, 
  Branch, 
  DayOfWeek, 
  ShiftType, 
  DAYS_OF_WEEK, 
  SHIFT_DEFINITIONS,
  RegistrationWeekControl
} from '../../types';
import { 
  Calendar, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Building2, 
  Lock, 
  Unlock, 
  Sun, 
  Sunset, 
  Moon, 
  Clock, 
  Layers,
  LayoutList,
  CalendarDays,
  Save,
  AlertCircle
} from 'lucide-react';
import { 
  getSolarDateInfo, 
  getSolarWeekRangeText, 
  getAvailableSolarWeeks 
} from '../../utils/solarCalendar';
import confetti from 'canvas-confetti';

interface StaffRegisterViewProps {
  currentUser: User;
  branches: Branch[];
  weekId: string;
  onSelectWeek?: (weekId: string) => void;
  registrations: ShiftRegistration[];
  onSaveRegistrations: (newRegs: ShiftRegistration[]) => void;
  isRegistrationOpen: boolean;
  registrationControl?: RegistrationWeekControl;
}

export const StaffRegisterView: React.FC<StaffRegisterViewProps> = ({
  currentUser,
  branches = [],
  weekId,
  onSelectWeek,
  registrations = [],
  onSaveRegistrations,
  isRegistrationOpen,
  registrationControl,
}) => {
  const currentBranch = branches?.find((b) => b.id === currentUser.branchId) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };
  const solarRange = getSolarWeekRangeText(weekId);
  const availableWeeks = getAvailableSolarWeeks();

  // Current user's registered keys for this week: `${day}_${shiftType}`
  const userRegs = registrations.filter(
    (r) => r.userId === currentUser.id && r.weekId === weekId
  );

  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    userRegs.forEach((r) => {
      map[`${r.day}_${r.shiftType}`] = true;
    });
    return map;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [activeMobileDay, setActiveMobileDay] = useState<DayOfWeek>('mon');
  const [mobileDisplayMode, setMobileDisplayMode] = useState<'tabs' | 'list'>('list');

  // Re-sync selectedMap when weekId or registrations change
  useEffect(() => {
    const map: Record<string, boolean> = {};
    registrations
      .filter((r) => r.userId === currentUser.id && r.weekId === weekId)
      .forEach((r) => {
        map[`${r.day}_${r.shiftType}`] = true;
      });
    setSelectedMap(map);
    setHasUnsavedChanges(false);
  }, [weekId, registrations, currentUser.id]);

  const toggleShift = (day: DayOfWeek, shiftType: ShiftType) => {
    if (!isRegistrationOpen) return;
    const key = `${day}_${shiftType}`;
    setSelectedMap((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const isSelected = (day: DayOfWeek, shiftType: ShiftType) => {
    return !!selectedMap[`${day}_${shiftType}`];
  };

  // Count total selected shifts
  const selectedCount = Object.values(selectedMap).filter(Boolean).length;

  // Check how many shifts registered on a specific day (0 to 3)
  const getDayCount = (day: DayOfWeek) => {
    let count = 0;
    (['morning', 'afternoon', 'evening'] as ShiftType[]).forEach((s) => {
      if (selectedMap[`${day}_${s}`]) count++;
    });
    return count;
  };

  // Toggle all 3 shifts for a specific day
  const handleToggleWholeDay = (day: DayOfWeek) => {
    if (!isRegistrationOpen) return;
    const currentCount = getDayCount(day);
    const selectAll = currentCount < 3;
    setSelectedMap((prev) => ({
      ...prev,
      [`${day}_morning`]: selectAll,
      [`${day}_afternoon`]: selectAll,
      [`${day}_evening`]: selectAll,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!isRegistrationOpen) return;

    // Keep other users' registrations, replace current user's registrations for this week
    const otherUsersRegs = registrations.filter(
      (r) => !(r.userId === currentUser.id && r.weekId === weekId)
    );

    const newMyRegs: ShiftRegistration[] = [];
    DAYS_OF_WEEK.forEach((d) => {
      const solarInfo = getSolarDateInfo(weekId, d.key);
      (['morning', 'afternoon', 'evening'] as ShiftType[]).forEach((s) => {
        if (selectedMap[`${d.key}_${s}`]) {
          newMyRegs.push({
            id: `reg_${currentUser.id}_${weekId}_${d.key}_${s}_${Date.now()}`,
            userId: currentUser.id,
            branchId: currentUser.branchId || currentBranch.id,
            weekId,
            day: d.key,
            shiftType: s,
            solarDate: solarInfo.dateStr,
            createdAt: new Date().toISOString(),
          });
        }
      });
    });

    onSaveRegistrations([...otherUsersRegs, ...newMyRegs]);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage(`Đã lưu thành công ${newMyRegs.length} ca làm việc cho ${solarRange}!`);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSaveSuccessMessage('');
    }, 3500);
  };

  const handleClearAll = () => {
    if (!isRegistrationOpen) return;
    setSelectedMap({});
    setHasUnsavedChanges(true);
  };

  const handleSelectAllMorning = () => {
    if (!isRegistrationOpen) return;
    const updated = { ...selectedMap };
    DAYS_OF_WEEK.forEach((d) => {
      updated[`${d.key}_morning`] = true;
    });
    setSelectedMap(updated);
    setHasUnsavedChanges(true);
  };

  const handleSelectAllAfternoon = () => {
    if (!isRegistrationOpen) return;
    const updated = { ...selectedMap };
    DAYS_OF_WEEK.forEach((d) => {
      updated[`${d.key}_afternoon`] = true;
    });
    setSelectedMap(updated);
    setHasUnsavedChanges(true);
  };

  const handleSelectAllEvening = () => {
    if (!isRegistrationOpen) return;
    const updated = { ...selectedMap };
    DAYS_OF_WEEK.forEach((d) => {
      updated[`${d.key}_evening`] = true;
    });
    setSelectedMap(updated);
    setHasUnsavedChanges(true);
  };

  const handleSelectAllFullDay = () => {
    if (!isRegistrationOpen) return;
    const updated = { ...selectedMap };
    DAYS_OF_WEEK.forEach((d) => {
      updated[`${d.key}_morning`] = true;
      updated[`${d.key}_afternoon`] = true;
      updated[`${d.key}_evening`] = true;
    });
    setSelectedMap(updated);
    setHasUnsavedChanges(true);
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case 'morning':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'afternoon':
        return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'evening':
        return <Moon className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-40 md:pb-8">
      {/* Header & Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-800">
                  Đăng Ký Ca Làm Việc
                </h2>
                {isRegistrationOpen ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <Unlock className="w-3 h-3 mr-1 text-emerald-600" />
                    Cổng Đang Mở
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                    <Lock className="w-3 h-3 mr-1 text-rose-600" />
                    Cổng Đang Khóa
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                <span className="font-semibold text-slate-700 flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  {currentBranch.name}
                </span>
                <span>•</span>
                <span className="font-bold text-slate-800">Lịch Dương: {solarRange}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Week Selector & Top Action Buttons */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap">
          {onSelectWeek && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
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
          )}

          <div className="text-left md:text-right px-2">
            <div className="text-[11px] text-slate-500">Đã chọn:</div>
            <div className="text-sm sm:text-base font-black font-mono text-emerald-700">
              {selectedCount} <span className="text-xs font-normal text-slate-500">ca / tuần</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isRegistrationOpen}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center space-x-1.5 touch-manipulation select-none ${
              isRegistrationOpen
                ? hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 ring-2 ring-emerald-400 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isRegistrationOpen ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isRegistrationOpen ? (hasUnsavedChanges ? 'Lưu Nguyện Vọng *' : 'Lưu Đăng Ký') : 'Đã Khóa'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center space-x-2.5 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Status Gate Banner */}
      {!isRegistrationOpen ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 text-amber-900 flex items-start space-x-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-sm sm:text-base flex items-center space-x-1.5 text-amber-950">
              <span>Cổng Đăng Ký Ca Đang Đóng (Chỉ Xem)</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Quản lý chưa mở hoặc đã đóng cổng nhận đăng ký ca cho <strong>{solarRange}</strong>. Bạn đang xem lại các ca đã đăng ký trước đó. Nếu cần đổi ca hoặc đăng ký thêm, vui lòng nhờ Quản lý mở cổng.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Unlock className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-emerald-100 space-y-1">
              <p className="font-bold text-white text-sm">
                Cổng Đăng Ký Đang Mở — Được chọn cả 3 ca / ngày:
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-200">
                • Bạn có thể đăng ký 1, 2 hoặc <strong>cả 3 ca trong 1 ngày</strong>: Ca Sáng (08:00-13:00), Ca Chiều (13:00-18:00), Ca Tối (18:00-23:00).
              </p>
            </div>
          </div>

          {/* Quick select helpers */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSelectAllMorning}
              className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-emerald-100 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center touch-manipulation active:scale-95"
            >
              + Ca Sáng
            </button>
            <button
              type="button"
              onClick={handleSelectAllAfternoon}
              className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-emerald-100 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center touch-manipulation active:scale-95"
            >
              + Ca Chiều
            </button>
            <button
              type="button"
              onClick={handleSelectAllEvening}
              className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-emerald-100 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center touch-manipulation active:scale-95"
            >
              + Ca Tối
            </button>
            <button
              type="button"
              onClick={handleSelectAllFullDay}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white text-[11px] sm:text-xs font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center space-x-1 touch-manipulation active:scale-95 shadow-2xs"
            >
              <Layers className="w-3 h-3" />
              <span>+ Cả 3 Ca / Ngày</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 touch-manipulation active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa hết</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE DISPLAY CONTROLS */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-800 flex items-center">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Giao diện chọn ca điện thoại:
          </span>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setMobileDisplayMode('list')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center space-x-1 transition-all touch-manipulation ${
                mobileDisplayMode === 'list'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-3 h-3" />
              <span>Cuộn 7 ngày</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileDisplayMode('tabs')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center space-x-1 transition-all touch-manipulation ${
                mobileDisplayMode === 'tabs'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Từng ngày</span>
            </button>
          </div>
        </div>

        {/* MODE A: TAB-BY-TAB SELECTION */}
        {mobileDisplayMode === 'tabs' && (
          <div className="space-y-3">
            {/* Mobile Horizontal Day Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
              {DAYS_OF_WEEK.map((d) => {
                const isSelectedDay = activeMobileDay === d.key;
                const countOnDay = getDayCount(d.key);
                const solarInfo = getSolarDateInfo(weekId, d.key);

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setActiveMobileDay(d.key)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex flex-col items-center min-w-[70px] border touch-manipulation cursor-pointer ${
                      isSelectedDay
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{d.shortLabel}</span>
                    <span className={`text-[10px] font-mono ${isSelectedDay ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {solarInfo.formattedShort}
                    </span>
                    <span
                      className={`text-[9px] font-mono mt-0.5 px-1.5 py-0.2 rounded-full font-bold ${
                        countOnDay === 3
                          ? isSelectedDay
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-amber-100 text-amber-900'
                          : countOnDay > 0
                          ? isSelectedDay
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {countOnDay === 3 ? 'Cả 3 ca' : `${countOnDay} ca`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Day Detail Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-sm text-slate-900">
                    {DAYS_OF_WEEK.find((d) => d.key === activeMobileDay)?.label} ({getSolarDateInfo(weekId, activeMobileDay).formattedShort})
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    (Đã chọn {getDayCount(activeMobileDay)}/3 ca)
                  </span>
                </div>
                {isRegistrationOpen && (
                  <button
                    type="button"
                    onClick={() => handleToggleWholeDay(activeMobileDay)}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer touch-manipulation"
                  >
                    {getDayCount(activeMobileDay) === 3 ? 'Bỏ chọn ngày' : '+ Chọn cả 3 ca'}
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {(['morning', 'afternoon', 'evening'] as ShiftType[]).map((shiftType) => {
                  const shiftDef = SHIFT_DEFINITIONS[shiftType];
                  const active = isSelected(activeMobileDay, shiftType);

                  return (
                    <button
                      key={shiftType}
                      type="button"
                      disabled={!isRegistrationOpen}
                      onClick={() => toggleShift(activeMobileDay, shiftType)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between touch-manipulation select-none active:scale-[0.98] ${
                        !isRegistrationOpen
                          ? active
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 cursor-not-allowed opacity-90'
                            : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                          : active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-400 cursor-pointer'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                          {getShiftIcon(shiftType)}
                        </div>
                        <div>
                          <div className="text-sm font-bold flex items-center space-x-1.5">
                            <span>{shiftDef.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{shiftDef.timeRange} (5 tiếng)</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                          active
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {active ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span className="text-slate-300 text-xs">+</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODE B: 7-DAY CONTINUOUS SCROLL LIST (EASIEST FOR PHONE USERS) */}
        {mobileDisplayMode === 'list' && (
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((d) => {
              const countOnDay = getDayCount(d.key);
              const solarInfo = getSolarDateInfo(weekId, d.key);

              return (
                <div
                  key={d.key}
                  className={`bg-white rounded-2xl border transition-all p-3.5 space-y-2.5 shadow-2xs ${
                    countOnDay === 3
                      ? 'border-amber-300 bg-amber-50/10'
                      : countOnDay > 0
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-900">{d.label}</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {solarInfo.formattedShort}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          countOnDay === 3
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : countOnDay > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {countOnDay === 3 ? 'Cả 3 ca' : `${countOnDay}/3 ca`}
                      </span>

                      {isRegistrationOpen && (
                        <button
                          type="button"
                          onClick={() => handleToggleWholeDay(d.key)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 transition-colors touch-manipulation cursor-pointer"
                        >
                          {countOnDay === 3 ? 'Bỏ' : '+3 ca'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3 Shifts Row Grid for this day on phone */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['morning', 'afternoon', 'evening'] as ShiftType[]).map((shiftType) => {
                      const shiftDef = SHIFT_DEFINITIONS[shiftType];
                      const active = isSelected(d.key, shiftType);

                      return (
                        <button
                          key={shiftType}
                          type="button"
                          disabled={!isRegistrationOpen}
                          onClick={() => toggleShift(d.key, shiftType)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all touch-manipulation select-none active:scale-[0.96] ${
                            !isRegistrationOpen
                              ? active
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 cursor-not-allowed opacity-90'
                                : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                              : active
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-2 ring-emerald-400 cursor-pointer'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            {getShiftIcon(shiftType)}
                            <span className="text-xs font-bold">{shiftDef.name.replace('Ca ', '')}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 mb-1.5">
                            {shiftDef.timeRange.split(' - ')[0]}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                              active
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {active ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-300">+</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DESKTOP MATRIX GRID OF 7 DAYS */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((d) => {
          const countOnDay = getDayCount(d.key);
          const solarInfo = getSolarDateInfo(weekId, d.key);

          return (
            <div
              key={d.key}
              className={`bg-white rounded-2xl border transition-all p-3 flex flex-col space-y-2.5 shadow-2xs ${
                countOnDay === 3
                  ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-50/10'
                  : countOnDay > 0 
                  ? 'border-emerald-300 ring-1 ring-emerald-400/30' 
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
                </div>
                <div className="flex items-center space-x-1">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      countOnDay === 0
                        ? 'bg-slate-100 text-slate-500'
                        : countOnDay === 1
                        ? 'bg-emerald-100 text-emerald-800'
                        : countOnDay === 2
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {countOnDay === 3 ? 'Cả 3 ca' : `${countOnDay} ca`}
                  </span>
                </div>
              </div>

              {/* Shifts for this day */}
              <div className="space-y-2 flex-1">
                {(['morning', 'afternoon', 'evening'] as ShiftType[]).map((shiftType) => {
                  const shiftDef = SHIFT_DEFINITIONS[shiftType];
                  const active = isSelected(d.key, shiftType);

                  return (
                    <button
                      key={shiftType}
                      type="button"
                      disabled={!isRegistrationOpen}
                      onClick={() => toggleShift(d.key, shiftType)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        !isRegistrationOpen
                          ? active
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 cursor-not-allowed opacity-90'
                            : 'bg-slate-50/40 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-400'
                          : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs flex items-center space-x-1">
                          {getShiftIcon(shiftType)}
                          <span>{shiftDef.name}</span>
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                            active
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">
                        {shiftDef.timeRange}
                      </span>
                    </button>
                  );
                })}
              </div>

              {countOnDay === 3 && (
                <div className="text-[10px] text-amber-800 font-semibold bg-amber-50 p-1.5 rounded-lg flex items-center space-x-1 border border-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Đăng ký 3 ca</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer on Desktop */}
      <div className="hidden md:flex bg-white p-5 rounded-2xl border border-slate-200 shadow-xs items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              Sau khi lưu nguyện vọng ca, Quản lý chi nhánh {currentBranch.shortName} sẽ tổng hợp và duyệt lịch làm việc chính thức.
            </div>
            <div className="text-xs text-slate-800 font-bold mt-0.5">
              Dự kiến lương nếu được phân đủ {selectedCount} ca ({selectedCount * 5} giờ): {(selectedCount * 5 * currentUser.hourlyRate).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!isRegistrationOpen}
          className={`px-6 py-3 font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
            isRegistrationOpen
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isRegistrationOpen ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{isRegistrationOpen ? `Lưu Nguyện Vọng (${currentBranch.shortName})` : 'Cổng Đăng Ký Đang Đóng'}</span>
        </button>
      </div>

      {/* DEDICATED MOBILE FLOATING SAVE BAR (ABOVE BOTTOM NAVIGATION) */}
      <div className="md:hidden fixed bottom-[62px] left-0 right-0 z-30 px-3 py-2 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 shadow-2xl flex items-center justify-between gap-2.5">
        <div className="text-white min-w-0">
          <div className="text-[11px] text-slate-300 flex items-center space-x-1 truncate">
            <span>Đã chọn:</span>
            <span className="font-bold text-emerald-400 font-mono text-xs">{selectedCount} ca</span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            )}
          </div>
          <div className="text-xs font-black text-white truncate">
            ~{(selectedCount * 5 * currentUser.hourlyRate).toLocaleString('vi-VN')} đ
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!isRegistrationOpen}
          className={`px-4 py-2.5 font-black rounded-xl text-xs shadow-lg transition-all flex items-center space-x-1.5 touch-manipulation select-none shrink-0 ${
            isRegistrationOpen
              ? hasUnsavedChanges
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-90 ring-2 ring-emerald-300 animate-bounce'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-90'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isRegistrationOpen ? <Check className="w-4 h-4 stroke-[3]" /> : <Lock className="w-4 h-4" />}
          <span>{isRegistrationOpen ? (hasUnsavedChanges ? 'LƯU NGAY *' : 'Lưu Đăng Ký') : 'Đang Đóng'}</span>
        </button>
      </div>
    </div>
  );
};
