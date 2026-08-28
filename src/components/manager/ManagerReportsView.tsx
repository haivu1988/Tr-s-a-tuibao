import React, { useState } from 'react';
import { User, ShiftAssignment, AttendanceRecord, Branch } from '../../types';
import { 
  Download, 
  DollarSign, 
  Clock, 
  Users, 
  Building2, 
  Calendar 
} from 'lucide-react';
import { getSolarWeekRangeText } from '../../utils/solarCalendar';

interface ManagerReportsViewProps {
  weekId: string;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  allStaff: User[];
  assignments: ShiftAssignment[];
  attendanceLogs: AttendanceRecord[];
}

export const ManagerReportsView: React.FC<ManagerReportsViewProps> = ({
  weekId,
  branches = [],
  activeBranchId,
  onSelectBranch,
  allStaff = [],
  assignments = [],
  attendanceLogs = [],
}) => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(activeBranchId);
  const solarRange = getSolarWeekRangeText(weekId);

  const staffOnly = allStaff.filter((s) => {
    if (s.role !== 'staff') return false;
    if (selectedBranchFilter !== 'all' && s.branchId !== selectedBranchFilter) return false;
    return true;
  });

  // Compute stats per staff
  const staffPayroll = staffOnly.map((staff) => {
    // Assigned shifts in week
    const assignedCount = assignments
      .filter((a) => a.weekId === weekId && (selectedBranchFilter === 'all' || a.branchId === selectedBranchFilter))
      .reduce((count, a) => (a.assignedUserIds.includes(staff.id) ? count + 1 : count), 0);

    // Actual completed attendance logs
    const completedLogs = attendanceLogs.filter(
      (l) => l.userId === staff.id && (l.status === 'completed' || l.status === 'on-time')
    );

    const actualHours = completedLogs.reduce(
      (sum, l) => sum + (l.workDurationHours || 5),
      0
    );

    const scheduledHours = assignedCount * 5;
    const totalPay = scheduledHours * staff.hourlyRate;
    const onTimeLogs = completedLogs.filter((l) => l.status === 'on-time' || l.status === 'completed');
    const onTimeRate = completedLogs.length > 0 ? Math.round((onTimeLogs.length / completedLogs.length) * 100) : 100;
    const branch = branches.find((b) => b.id === staff.branchId);

    return {
      staff,
      branchName: branch?.name || 'Chi nhánh',
      branchShortName: branch?.shortName || 'CN',
      assignedCount,
      scheduledHours,
      actualHours,
      totalPay,
      onTimeRate,
      completedLogsCount: completedLogs.length,
    };
  });

  const totalWeeklyBudget = staffPayroll.reduce((sum, item) => sum + item.totalPay, 0);
  const totalScheduledHours = staffPayroll.reduce((sum, item) => sum + item.scheduledHours, 0);
  const totalShiftsAssigned = staffPayroll.reduce((sum, item) => sum + item.assignedCount, 0);

  const handleExportCSV = () => {
    const headers = ['Mã NV', 'Họ và Tên', 'Chi Nhánh', 'Số Điện Thoại', 'Lương/Giờ (VND)', 'Số ca phân bổ', 'Tổng giờ làm', 'Tổng lương tạm tính (VND)', 'Tỷ lệ đúng giờ'];
    const rows = staffPayroll.map((item) => [
      item.staff.id,
      item.staff.name,
      item.branchName,
      item.staff.phone || '',
      item.staff.hourlyRate,
      item.assignedCount,
      item.scheduledHours,
      item.totalPay,
      `${item.onTimeRate}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Luong_PartFlow_${weekId}_${selectedBranchFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Branch & Calendar Range Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500">Lọc Báo Cáo Theo:</span>
            <select
              value={selectedBranchFilter}
              onChange={(e) => {
                setSelectedBranchFilter(e.target.value);
                if (e.target.value !== 'all') {
                  onSelectBranch(e.target.value);
                }
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">🏢 Tất Cả Chi Nhánh ({allStaff.filter((s) => s.role === 'staff').length} NV)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({allStaff.filter((s) => s.role === 'staff' && s.branchId === b.id).length} NV)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kỳ Lương Dương Lịch:</span>
            <span className="font-bold text-slate-800">{solarRange}</span>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel (CSV)</span>
        </button>
      </div>

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tổng Chi Phí Lương Tuần</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {totalWeeklyBudget.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {selectedBranchFilter === 'all' ? 'Tất cả chi nhánh' : branches.find((b) => b.id === selectedBranchFilter)?.name}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tổng Giờ Làm Phân Bổ</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-2">
            {totalScheduledHours} Giờ
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Tổng cộng {totalShiftsAssigned} lượt ca trực vận hành
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Nhân Sự Part-time</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-2">
            {staffOnly.length} Nhân Viên
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Được phân công trực trong tuần
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Bảng Tổng Hợp Chấm Công & Bảng Lương (Dương Lịch)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động tính dựa trên lịch chia ca và dữ liệu chấm công WiFi từng chi nhánh
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-3">Chi Nhánh</th>
                <th className="py-3 px-3 text-right">Lương / Giờ</th>
                <th className="py-3 px-3 text-center">Số Ca Phân Bổ</th>
                <th className="py-3 px-3 text-center">Tổng Giờ Làm</th>
                <th className="py-3 px-3 text-center">Tỷ Lệ Đúng Giờ</th>
                <th className="py-3 px-4 text-right">Tổng Lương Dự Tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffPayroll.length > 0 ? (
                staffPayroll.map((item) => (
                  <tr key={item.staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.staff.avatar}
                          alt={item.staff.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-800">{item.staff.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {item.staff.id} • {item.staff.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px]">
                        {item.branchShortName}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {item.staff.hourlyRate.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {item.assignedCount} ca
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {item.scheduledHours} giờ
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.onTimeRate}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                      {item.totalPay.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Chưa có nhân viên nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
            {staffPayroll.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-800">
                  <td colSpan={3} className="py-3 px-4 text-slate-900">
                    TỔNG CỘNG ({selectedBranchFilter === 'all' ? 'TẤT CẢ CHI NHÁNH' : branches.find((b) => b.id === selectedBranchFilter)?.name})
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{totalShiftsAssigned} ca</td>
                  <td className="py-3 px-3 text-center font-mono">{totalScheduledHours} giờ</td>
                  <td className="py-3 px-3 text-center">-</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-800 text-base font-black">
                    {totalWeeklyBudget.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
