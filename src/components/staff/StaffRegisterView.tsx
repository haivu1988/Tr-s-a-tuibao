import React, { useState } from 'react';
import { 
  User, 
  ShiftRegistration, 
  Branch, 
  DayOfWeek, 
  ShiftType, 
  DAYS_OF_WEEK, 
  SHIFT_DEFINITIONS 
} from '../../types';
import { 
  Calendar, 
  Check, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Building2
} from 'lucide-react';
import { getSolarDateInfo, getSolarWeekRangeText } from '../../utils/solarCalendar';
import confetti from 'canvas-confetti';

interface StaffRegisterViewProps {
  currentUser: User;
  branches: Branch[];
  weekId: string;
  registrations: ShiftRegistration[];
  onSaveRegistrations: (newRegs: ShiftRegistration[]) => void;
}

export const StaffRegisterView: React.FC<StaffRegisterViewProps> = ({
  currentUser,
  branches = [],
  weekId,
  registrations = [],
  onSaveRegistrations,
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

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [activeMobileDay, setActiveMobileDay] = useState<DayOfWeek>('mon');

  const toggleShift = (day: DayOfWeek, shiftType: ShiftType) => {
    const key = `${day}_${shiftType}`;
    setSelectedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isSelected = (day: DayOfWeek, shiftType: ShiftType) => {
    return !!selectedMap[`${day}_${shiftType}`];
  };

  // Count total selected shifts
  const selectedCount = Object.values(selectedMap).filter(Boolean).length;

  // Check how many shifts registered on a specific day
  const getDayCount = (day: DayOfWeek) => {
    let count = 0;
    (['morning', 'afternoon', 'evening'] as ShiftType[]).forEach((s) => {
      if (selectedMap[`${day}_${s}`]) count++;
    });
    return count;
  };

  const handleSave = () => {
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
    setSaveSuccessMessage('Đã lưu nguyện vọng ca làm việc thành công!');

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
    }, 3000);
  };

  const handleClearAll = () => {
    setSelectedMap({});
  };

  const handleSelectAllMorning = () => {
    const updated = { ...selectedMap };
    DAYS_OF_WEEK.forEach((d) => {
      updated[`${d.key}_morning`] = true;
    });
    setSelectedMap(updated);
  };

  const handleSelectAllEvening = () => {
    const updated = { ...selectedMap };
    DAYS_OF_WEEK.forEach((d) => {
      updated[`${d.key}_evening`] = true;
    });
    setSelectedMap(updated);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 md:pb-6">
      {/* Header & Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                Đăng Ký Ca Làm Việc Hàng Tuần
              </h2>
              <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
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

        {/* Action button */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="text-left md:text-right">
            <div className="text-[11px] text-slate-500">Đã chọn:</div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-700">
              {selectedCount} <span className="text-xs font-normal text-slate-500">ca / tuần</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Lưu Đăng Ký</span>
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center space-x-2.5 text-xs sm:text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Rules Banner & Quick Helpers */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start space-x-2.5 sm:space-x-3">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-bold text-white">Quy tắc phân ca tối ưu:</p>
            <p className="text-[11px] sm:text-xs">
              • 3 ca/ngày: Sáng (8h-13h), Chiều (13h-18h), Tối (18h-23h). Tối đa 2 ca/ngày (cấm 3 ca).
            </p>
          </div>
        </div>

        {/* Quick select helpers */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleSelectAllMorning}
            className="flex-1 sm:flex-none px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
          >
            + Ca Sáng
          </button>
          <button
            onClick={handleSelectAllEvening}
            className="flex-1 sm:flex-none px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
          >
            + Ca Tối
          </button>
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa hết</span>
          </button>
        </div>
      </div>

      {/* MOBILE DAY SELECTOR TABS & LARGE TOUCH CARDS */}
      <div className="md:hidden space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Chọn ngày theo Dương Lịch:
        </div>
        
        {/* Mobile Horizontal Day Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {DAYS_OF_WEEK.map((d) => {
            const isSelectedDay = activeMobileDay === d.key;
            const countOnDay = getDayCount(d.key);
            const solarInfo = getSolarDateInfo(weekId, d.key);

            return (
              <button
                key={d.key}
                onClick={() => setActiveMobileDay(d.key)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex flex-col items-center min-w-[66px] border ${
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
                  className={`text-[9px] font-mono mt-0.5 px-1 rounded ${
                    countOnDay > 0
                      ? isSelectedDay
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                      : 'text-slate-400'
                  }`}
                >
                  {countOnDay} ca
                </span>
              </button>
            );
          })}
        </div>

        {/* Big Touch Shift Cards for Active Mobile Day */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="font-bold text-sm text-slate-900">
                {DAYS_OF_WEEK.find((d) => d.key === activeMobileDay)?.label} ({getSolarDateInfo(weekId, activeMobileDay).formattedShort})
              </span>
              <span className="text-xs text-slate-400 ml-2">
                (Đang chọn {getDayCount(activeMobileDay)} ca)
              </span>
            </div>
            {getDayCount(activeMobileDay) >= 3 && (
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                Cảnh báo 3 ca/ngày
              </span>
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
                  onClick={() => toggleShift(activeMobileDay, shiftType)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                    active
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">{shiftDef.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{shiftDef.timeRange} (5 tiếng)</div>
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

      {/* DESKTOP MATRIX GRID OF 7 DAYS */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((d) => {
          const countOnDay = getDayCount(d.key);
          const hasWarning = countOnDay >= 3;
          const solarInfo = getSolarDateInfo(weekId, d.key);

          return (
            <div
              key={d.key}
              className={`bg-white rounded-2xl border transition-all p-3 flex flex-col space-y-2.5 shadow-2xs ${
                countOnDay > 0 ? 'border-emerald-300 ring-1 ring-emerald-400/30' : 'border-slate-200'
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
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    countOnDay === 0
                      ? 'bg-slate-100 text-slate-500'
                      : countOnDay === 1
                      ? 'bg-emerald-100 text-emerald-800'
                      : countOnDay === 2
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {countOnDay} ca
                </span>
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
                      onClick={() => toggleShift(d.key, shiftType)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-400'
                          : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{shiftDef.name}</span>
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

              {hasWarning && (
                <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded-lg flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Cảnh báo: 3 ca/ngày</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer on Desktop */}
      <div className="hidden md:flex bg-white p-5 rounded-2xl border border-slate-200 shadow-xs items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              Sau khi lưu, Quản lý chi nhánh {currentBranch.shortName} sẽ chạy chia ca và phân bổ công bằng.
            </div>
            <div className="text-xs text-slate-800 font-bold mt-0.5">
              Dự kiến lương nếu được duyệt {selectedCount} ca: {(selectedCount * 5 * currentUser.hourlyRate).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Lưu Nguyện Vọng ({currentBranch.shortName})</span>
        </button>
      </div>

      {/* STICKY MOBILE BOTTOM BAR FOR INSTANT SAVING */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500">Đã chọn: <span className="font-bold text-emerald-700 font-mono text-xs">{selectedCount} ca</span></div>
          <div className="text-xs font-bold text-slate-900">
            ~{(selectedCount * 5 * currentUser.hourlyRate).toLocaleString('vi-VN')} đ
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Lưu Đăng Ký</span>
        </button>
      </div>
    </div>
  );
};
