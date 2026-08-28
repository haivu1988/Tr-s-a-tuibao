import React, { useState } from 'react';
import { User, ShiftAssignment, Branch, DAYS_OF_WEEK, SHIFT_DEFINITIONS } from '../../types';
import { X, Check, AlertTriangle, Building2, Calendar } from 'lucide-react';
import { getSolarDateInfo } from '../../utils/solarCalendar';

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: ShiftAssignment | null;
  branch?: Branch;
  allStaff: User[];
  allAssignments: ShiftAssignment[];
  onSaveAssignment: (updated: ShiftAssignment) => void;
}

export const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  isOpen,
  onClose,
  assignment,
  branch,
  allStaff = [],
  allAssignments = [],
  onSaveAssignment,
}) => {
  if (!isOpen || !assignment) return null;

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(assignment.assignedUserIds || []);
  const [status, setStatus] = useState<'pending' | 'approved'>(assignment.status);
  const [notes, setNotes] = useState<string>(assignment.notes || '');

  const dayInfo = DAYS_OF_WEEK.find((d) => d.key === assignment.day);
  const shiftDef = SHIFT_DEFINITIONS[assignment.shiftType];
  const solarInfo = getSolarDateInfo(assignment.weekId, assignment.day);

  // Filter staff specifically for this assignment's branch
  const branchStaff = allStaff.filter(
    (s) => s.role === 'staff' && s.status === 'active' && s.branchId === assignment.branchId
  );

  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const getUserShiftCountOnDay = (userId: string) => {
    return allAssignments
      .filter((a) => a.weekId === assignment.weekId && a.day === assignment.day && a.id !== assignment.id && a.branchId === assignment.branchId)
      .reduce((count, a) => (a.assignedUserIds.includes(userId) ? count + 1 : count), 0);
  };

  const handleSave = () => {
    onSaveAssignment({
      ...assignment,
      solarDate: solarInfo.dateStr,
      assignedUserIds: selectedUserIds,
      status,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold">
                {dayInfo?.label}
              </span>
              <h3 className="text-sm sm:text-base font-bold">{shiftDef.name} ({shiftDef.timeRange})</h3>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dương Lịch: {solarInfo.displayFullWithDay}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Branch indicator */}
          {branch && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Áp dụng cho: <strong className="text-slate-800">{branch.name}</strong></span>
            </div>
          )}

          {/* Status warning if understaffed */}
          {selectedUserIds.length < 2 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Cảnh báo nhân lực:</span> Ca làm việc này hiện có{' '}
                <span className="font-bold underline">{selectedUserIds.length} nhân viên</span>. Cần tối thiểu <span className="font-bold">2 nhân viên</span>.
              </div>
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Trạng Thái Duyệt Ca
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                  status === 'approved'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Đã Duyệt (Approved)</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                  status === 'pending'
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Chờ Duyệt (Pending)</span>
              </button>
            </div>
          </div>

          {/* Staff selection list */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Chọn Nhân Viên Trực ({selectedUserIds.length} đã chọn):</span>
              <span className="text-[11px] text-slate-400 font-normal">Chạm để chọn/bỏ</span>
            </label>

            <div className="space-y-1.5">
              {branchStaff.length > 0 ? (
                branchStaff.map((staff) => {
                  const isSelected = selectedUserIds.includes(staff.id);
                  const otherShiftsToday = getUserShiftCountOnDay(staff.id);
                  const totalShiftsToday = isSelected ? otherShiftsToday + 1 : otherShiftsToday;

                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleToggleUser(staff.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate flex items-center space-x-1.5">
                            <span>{staff.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-semibold">
                                Trong ca
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {staff.department} • {staff.phone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            totalShiftsToday >= 3
                              ? 'bg-red-100 text-red-700'
                              : totalShiftsToday === 2
                              ? 'bg-amber-100 text-amber-700'
                              : totalShiftsToday === 1
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {totalShiftsToday === 0 ? 'Chưa có ca' : `${totalShiftsToday} ca/ngày`}
                        </span>

                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  Chi nhánh này chưa có nhân viên nào.
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú ca làm việc (tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="vd: Cần bàn giao kho lúc 13h..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu Ca Làm Việc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
