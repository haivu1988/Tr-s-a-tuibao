import React, { useState } from 'react';
import { User, AttendanceRecord, SHIFT_DEFINITIONS, DAYS_OF_WEEK, Branch } from '../../types';
import { 
  FileSpreadsheet, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Calendar, 
  Smartphone, 
  Wifi,
  Search,
  Building2,
  Pin
} from 'lucide-react';
import { getSolarDateDetailFromDate, formatSolarDateWithWeekday } from '../../utils/solarCalendar';

interface StaffReportsViewProps {
  currentUser: User;
  attendanceLogs: AttendanceRecord[];
  branches?: Branch[];
}

export const StaffReportsView: React.FC<StaffReportsViewProps> = ({
  currentUser,
  attendanceLogs,
  branches = [],
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentBranch = branches.find((b) => b.id === currentUser.branchId) || branches[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Q.1',
    pinnedWifiSsid: 'Store_Main_5G',
  };

  const myLogs = attendanceLogs.filter((l) => l.userId === currentUser.id);

  const filteredLogs = myLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.date.includes(q) ||
      (log.notes && log.notes.toLowerCase().includes(q)) ||
      log.shiftType.toLowerCase().includes(q) ||
      (log.branchName && log.branchName.toLowerCase().includes(q))
    );
  });

  // Calculations
  const completedLogs = myLogs.filter((l) => l.status === 'completed' || l.checkOutTime);
  const totalHours = myLogs.reduce((sum, l) => sum + (l.workDurationHours || (l.checkOutTime ? 5.0 : 0)), 0);
  const totalEarnings = Math.round(totalHours * currentUser.hourlyRate);
  
  const onTimeCount = myLogs.filter((l) => l.status === 'on-time' || l.status === 'completed').length;
  const punctualityRate = myLogs.length > 0 ? Math.round((onTimeCount / myLogs.length) * 100) : 100;

  const handleExportCSV = () => {
    let csv = "Mã chấm công,Chi nhánh,Ngày (Dương lịch),Thứ,Ca làm,Giờ vào,Giờ ra,Số giờ làm,Mã máy,WiFi,Trạng thái,Thành tiền (VND),Ghi chú\n";
    
    myLogs.forEach((l) => {
      const shiftName = SHIFT_DEFINITIONS[l.shiftType]?.name || l.shiftType;
      const hours = l.workDurationHours || 5.0;
      const pay = Math.round(hours * currentUser.hourlyRate);
      const bName = l.branchName || currentBranch.name;
      csv += `"${l.id}","${bName}","${l.date}","${l.day}","${shiftName}","${l.checkInTime}","${l.checkOutTime || 'Chưa ra'}","${hours}","${l.deviceId}","${l.wifiSsid}","${l.status}","${pay}","${l.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bang-cong-${currentUser.id}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Báo Cáo Công & Thu Nhập Cá Nhân</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              {currentBranch.shortName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thống kê chi tiết các lượt chấm công và lương theo giờ ({currentUser.hourlyRate.toLocaleString('vi-VN')} đ/giờ)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={myLogs.length === 0}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel (CSV)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Tổng Giờ Đã Làm</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totalHours.toFixed(1)} <span className="text-xs text-slate-400 font-normal">giờ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Từ {completedLogs.length} ca hoàn thành
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Tổng Thu Nhập Tích Lũy</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {totalEarnings.toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">đ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {currentUser.hourlyRate.toLocaleString('vi-VN')} đ/h
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Tỷ Lệ Đúng Giờ</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {punctualityRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {onTimeCount}/{myLogs.length} lượt đúng giờ
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Chi Nhánh Chính</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900 truncate">
            {currentBranch.shortName}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-mono flex items-center">
            <Pin className="w-3 h-3 mr-0.5" />
            {currentBranch.pinnedWifiSsid}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Lịch Sử Chấm Công Chi Tiết (Dương Lịch)</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo ngày, ca, ghi chú..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ngày (Dương Lịch)</th>
                  <th className="py-3 px-4">Chi Nhánh</th>
                  <th className="py-3 px-4">Ca Làm</th>
                  <th className="py-3 px-4">Giờ Vào</th>
                  <th className="py-3 px-4">Giờ Ra</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Tạm Tính</th>
                  <th className="py-3 px-4">Mã Máy / WiFi</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => {
                  const shiftDef = SHIFT_DEFINITIONS[log.shiftType];
                  const hours = log.workDurationHours || (log.checkOutTime ? 5.0 : 0);
                  const pay = Math.round(hours * currentUser.hourlyRate);
                  const solarInfo = getSolarDateDetailFromDate(log.date);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{solarInfo.formattedFull}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.date}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                          {log.branchName || currentBranch.shortName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {shiftDef ? shiftDef.name : log.shiftType}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                        {log.checkInTime}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {log.checkOutTime ? (
                          <span className="font-semibold text-rose-700">{log.checkOutTime}</span>
                        ) : (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                            Đang làm việc
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {hours > 0 ? `${hours}h` : '--'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {pay > 0 ? `${pay.toLocaleString('vi-VN')} đ` : '--'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        <div className="flex items-center space-x-1 font-mono">
                          <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[100px]">{log.deviceId}</span>
                        </div>
                        <div className="flex items-center space-x-1 font-mono text-slate-400 mt-0.5">
                          <Wifi className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[100px]">{log.wifiSsid}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'completed' || log.status === 'on-time'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status === 'completed'
                            ? 'Hoàn thành'
                            : log.status === 'on-time'
                            ? 'Đúng giờ'
                            : log.status === 'late'
                            ? 'Đi trễ'
                            : 'Không hợp lệ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Chưa có lịch sử chấm công nào được ghi nhận.
          </div>
        )}
      </div>
    </div>
  );
};
