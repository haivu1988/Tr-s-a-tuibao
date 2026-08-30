import React, { useState, useMemo } from 'react';
import { User, ShiftRegistration, ShiftAssignment, Branch, DAYS_OF_WEEK } from '../../types';
import { autoScheduleWeek, ScheduleResult } from '../../utils/scheduler';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Users, Building2, X, Calendar } from 'lucide-react';
import { getSolarWeekRangeText } from '../../utils/solarCalendar';
import confetti from 'canvas-confetti';

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  weekId: string;
  staffList: User[];
  registrations: ShiftRegistration[];
  onApplySchedule: (newAssignments: ShiftAssignment[]) => void;
}

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  isOpen,
  onClose,
  branch,
  weekId,
  staffList = [],
  registrations = [],
  onApplySchedule,
}) => {
  const [minStaffPerShift, setMinStaffPerShift] = useState<number>(2);

  const safeBranch = branch || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };

  const previewResult: ScheduleResult = useMemo(() => {
    return autoScheduleWeek(safeBranch.id, weekId, staffList, registrations, minStaffPerShift);
  }, [safeBranch.id, weekId, staffList, registrations, minStaffPerShift]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onApplySchedule(previewResult.assignments);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onClose();
  };

  const branchStaff = staffList.filter(
    (s) => s.role === 'staff' && s.status === 'active' && s.branchId === branch.id
  );

  const solarRange = getSolarWeekRangeText(weekId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center space-x-2">
                <span>Tự Động Chia Ca: {branch.name}</span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dương Lịch: {solarRange}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Rules Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span>Quy tắc chia ca tự động thông minh cho {branch.shortName}:</span>
              </div>
              {previewResult.stats.fairnessSummary && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ⚖️ Đã cân bằng đều: ~{previewResult.stats.fairnessSummary.avgShifts} ca/NV
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <div className="font-bold text-slate-800">Chia Đều Ca (Same Same Nhau)</div>
                  <div className="text-slate-500 text-[11px]">Cân bằng số ca giữa các nhân viên, chênh lệch tối đa 1 ca</div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <div className="font-bold text-slate-800">Ưu Tiên 1 Ca/Ngày & Cấm 3 Ca</div>
                  <div className="text-slate-500 text-[11px]">Tối đa 2 ca/ngày khi thiếu người, tuyệt đối không 3 ca/ngày</div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <div className="font-bold text-slate-800">Chỉ chia ca ĐÃ ĐĂNG KÝ</div>
                  <div className="text-slate-500 text-[11px]">Tuyệt đối không xếp ca nếu NV chưa đăng ký</div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">Tổng số ca tuần</div>
              <div className="text-xl font-extrabold text-slate-800 mt-1">21 Ca</div>
              <div className="text-[10px] text-slate-400">7 ngày × 3 ca/ngày</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">Số lượt NV được chia</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">
                {previewResult.stats.totalStaffSlotsAssigned} Lượt
              </div>
              <div className="text-[10px] text-slate-400">Đạt chỉ tiêu vận hành</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">Mức cân bằng số ca</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {previewResult.stats.fairnessSummary?.minShifts}-{previewResult.stats.fairnessSummary?.maxShifts} ca
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">
                {previewResult.stats.fairnessSummary?.isBalanced ? '✓ Rất đồng đều (~same same)' : 'Theo số ca đã đăng ký'}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">Tỉ lệ 1 ca & 2 ca/ngày</div>
              <div className="text-xl font-extrabold text-slate-800 mt-1 flex items-center space-x-1.5">
                <span className="text-blue-600">{previewResult.stats.singleShiftDaysCount}</span>
                <span className="text-slate-300">/</span>
                <span className="text-amber-600 text-sm font-semibold">{previewResult.stats.doubleShiftDaysCount} ngày</span>
              </div>
              <div className="text-[10px] text-emerald-600">0 vi phạm 3 ca</div>
            </div>
          </div>

          {/* Warnings (if any) */}
          {previewResult.warnings.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-amber-800 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
                Cảnh báo nhân lực tại {branch.shortName}:
              </div>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
                {previewResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Workload Distribution for Branch Staff */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Phân Bổ Nhân Sự Chi Nhánh ({branchStaff.length} nhân viên)</span>
              <span className="text-[11px] text-slate-400 normal-case">
                Tổng lượt đăng ký: {registrations.filter((r) => r.branchId === branch.id && r.weekId === weekId).length} ca
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-left font-semibold">
                    <th className="p-2.5">Nhân viên</th>
                    <th className="p-2.5 text-center">Số ca ĐK</th>
                    <th className="p-2.5 text-center">Số ca chia</th>
                    <th className="p-2.5 text-center">Tổng giờ</th>
                    <th className="p-2.5 text-right">Lương dự kiến</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchStaff.length > 0 ? (
                    branchStaff.map((staff) => {
                      const regCount = registrations.filter(
                        (r) => r.userId === staff.id && r.weekId === weekId
                      ).length;
                      const assignedCount = previewResult.stats.staffWorkload[staff.id] || 0;
                      const hours = assignedCount * 5;
                      const estimatedPay = hours * staff.hourlyRate;

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/70">
                          <td className="p-2.5 flex items-center space-x-2.5">
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                            <span className="font-semibold text-slate-800">{staff.name}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-600">{regCount}</td>
                          <td className="p-2.5 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                              {assignedCount} ca
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-700">{hours} giờ</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                            {estimatedPay.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        Chưa có nhân viên nào thuộc chi nhánh này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            *Áp dụng lịch chia ca tự động cho <span className="font-bold text-slate-800">{branch.name}</span>.
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Áp Dụng Lịch Cho {branch.shortName}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
