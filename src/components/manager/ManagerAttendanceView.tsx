import React, { useState } from 'react';
import { User, AttendanceRecord, Branch, SHIFT_DEFINITIONS } from '../../types';
import { 
  Clock, 
  Wifi, 
  Smartphone, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Building2, 
  Pin,
  Calendar,
  Globe
} from 'lucide-react';
import { formatSolarDateWithWeekday } from '../../utils/solarCalendar';

interface ManagerAttendanceViewProps {
  logs: AttendanceRecord[];
  allStaff: User[];
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onResetDevice: (userId: string) => void;
  onOpenWifiModal: () => void;
}

export const ManagerAttendanceView: React.FC<ManagerAttendanceViewProps> = ({
  logs = [],
  allStaff = [],
  branches = [],
  activeBranchId,
  onSelectBranch,
  onResetDevice,
  onOpenWifiModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBranch, setFilterBranch] = useState<string>(activeBranchId);
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [resetConfirmUser, setResetConfirmUser] = useState<User | null>(null);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string>('');

  const currentBranch = branches?.find((b) => b.id === filterBranch) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
    pinnedWifiIp: '118.69.182.45',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };

  const filteredLogs = logs.filter((log) => {
    const matchesBranch = filterBranch === 'all' || log.branchId === filterBranch;
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.wifiSsid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.wifiIp && log.wifiIp.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesShift = filterShift === 'all' || log.shiftType === filterShift;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesBranch && matchesSearch && matchesShift && matchesStatus;
  });

  const liveCheckedInCount = filteredLogs.filter((l) => !l.checkOutTime).length;
  const onTimeCount = filteredLogs.filter((l) => l.status === 'on-time' || (l.status === 'completed' && l.checkInTime <= '08:05')).length;
  const lateCount = filteredLogs.filter((l) => l.status === 'late').length;

  const handleConfirmReset = (staff: User) => {
    onResetDevice(staff.id);
    setResetConfirmUser(null);
    setResetSuccessNotice(`Đã reset mã máy của ${staff.name}. Nhân viên sẽ tự động lưu thiết bị mới trong lần Check-in tiếp theo.`);
    setTimeout(() => {
      setResetSuccessNotice('');
    }, 4000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 md:pb-6">
      {/* Reset Notification banner */}
      {resetSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center space-x-2 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          <span>{resetSuccessNotice}</span>
        </div>
      )}

      {/* Top Header & Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Đang trực ca (Live)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1 sm:mt-2">{liveCheckedInCount} NV</div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 truncate">
            {filterBranch === 'all' ? 'Tất cả chi nhánh' : currentBranch.shortName}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Đúng Giờ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 sm:mt-2">{onTimeCount} Lượt</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Tuân thủ ca tốt</div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Đi Muộn</span>
            <span className="text-xs text-amber-600 font-bold">⚠️</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1 sm:mt-2">{lateCount} Lượt</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Cần nhắc nhở</div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">WiFi & IP Ghim Quán</span>
            <button
              onClick={onOpenWifiModal}
              className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center space-x-0.5"
            >
              <Pin className="w-3 h-3 text-emerald-600" />
              <span>Ghim</span>
            </button>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1 font-mono truncate" title={currentBranch.pinnedWifiIp ? `IP: ${currentBranch.pinnedWifiIp}` : currentBranch.pinnedWifiSsid}>
            🌐 {filterBranch === 'all' ? 'IP từng chi nhánh' : `IP: ${currentBranch.pinnedWifiIp || 'Chưa ghim'}`}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {filterBranch === 'all' ? 'Bảo mật kép WiFi + IP' : `WiFi: ${currentBranch.pinnedWifiSsid}`}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Filters Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Branch Filter */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={filterBranch}
                onChange={(e) => {
                  setFilterBranch(e.target.value);
                  if (e.target.value !== 'all') {
                    onSelectBranch(e.target.value);
                  }
                }}
                className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">🏢 Tất Cả Chi Nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm nhân viên, mã máy, WiFi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả ca</option>
              <option value="morning">Ca Sáng (8h-13h)</option>
              <option value="afternoon">Ca Chiều (13h-18h)</option>
              <option value="evening">Ca Tối (18h-23h)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="on-time">Đúng giờ</option>
              <option value="late">Đi muộn</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0">
            Hiển thị: <span className="font-bold text-slate-800">{filteredLogs.length}</span> lượt chấm công
          </div>
        </div>

        {/* MOBILE CARD LIST */}
        <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const shiftDef = SHIFT_DEFINITIONS[log.shiftType];
              const staff = allStaff.find((s) => s.id === log.userId);
              const branch = branches.find((b) => b.id === log.branchId);

              return (
                <div key={log.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={staff?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={log.userName}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {branch?.shortName} • {shiftDef.name}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        log.status === 'on-time'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'late'
                          ? 'bg-amber-100 text-amber-800'
                          : log.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status === 'on-time'
                        ? 'Đúng giờ'
                        : log.status === 'late'
                        ? 'Đi muộn'
                        : log.status === 'completed'
                        ? 'Hoàn thành'
                        : 'Vắng mặt'}
                    </span>
                  </div>

                  {/* Date in Solar Calendar */}
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Dương Lịch: <strong className="text-slate-700">{log.solarDateFormatted || log.date}</strong></span>
                  </div>

                  {/* Time info row */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-in:</span>
                      <span className="font-mono font-bold text-emerald-700">{log.checkInTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-out:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {log.checkOutTime || (
                          <span className="text-emerald-600 animate-pulse text-[11px]">Đang trực...</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* WiFi & Device info */}
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1 text-slate-500">
                        <Pin className="w-3 h-3 text-emerald-600" />
                        <span>WiFi đã ghim:</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-700 truncate max-w-[150px]">{log.wifiSsid}</span>
                    </div>
                    {log.wifiIp && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1 text-slate-500">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>IP WiFi:</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700">{log.wifiIp}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1 text-slate-500">
                        <Smartphone className="w-3 h-3 text-slate-500" />
                        <span>Mã máy điện thoại:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded text-[10px]">{log.deviceId}</span>
                    </div>
                  </div>

                  {/* Device Reset Button for manager */}
                  {staff?.registeredDeviceId && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-medium">Mã máy đã khóa</span>
                      <button
                        onClick={() => setResetConfirmUser(staff)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Mã Máy</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Không tìm thấy bản ghi chấm công nào phù hợp.
            </div>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-3">Chi Nhánh</th>
                <th className="py-3 px-3">Ngày (Dương Lịch)</th>
                <th className="py-3 px-3">Ca & Giờ Vào/Ra</th>
                <th className="py-3 px-3">IP & WiFi Ghim</th>
                <th className="py-3 px-3">Mã Máy Điện Thoại</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-4 text-right">Khóa Máy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const shiftDef = SHIFT_DEFINITIONS[log.shiftType];
                const staff = allStaff.find((s) => s.id === log.userId);
                const branch = branches.find((b) => b.id === log.branchId);

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={staff?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={log.userName}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-800">{log.userName}</div>
                          <div className="text-[10px] text-slate-400">
                            {staff?.department || 'Nhân viên'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {branch?.shortName || log.branchName || 'Chi nhánh'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {log.solarDateFormatted || log.date}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{shiftDef.name}</div>
                      <div className="font-mono text-[11px] text-emerald-700 font-bold">
                        {log.checkInTime} → {log.checkOutTime || 'Đang trực...'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1 font-mono font-semibold text-emerald-800 text-[11px]">
                        <Pin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[120px]">{log.wifiSsid}</span>
                      </div>
                      {log.wifiIp && (
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-500 mt-0.5">
                          <Globe className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span>IP: {log.wifiIp}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                          {log.deviceId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'on-time'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : log.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status === 'on-time'
                          ? 'Đúng giờ'
                          : log.status === 'late'
                          ? 'Đi muộn'
                          : log.status === 'completed'
                          ? 'Hoàn thành'
                          : 'Vắng mặt'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {staff?.registeredDeviceId ? (
                        <button
                          onClick={() => setResetConfirmUser(staff)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Mã</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Chưa khóa</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Device ID */}
      {resetConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Xác nhận Reset Mã Máy</h4>
                <p className="text-xs text-slate-500">{resetConfirmUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc muốn Reset mã máy của <span className="font-bold text-slate-800">{resetConfirmUser.name}</span> (Mã hiện tại: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">{resetConfirmUser.registeredDeviceId}</code>)? Nhân viên sẽ được phép đăng ký mã máy mới trong lần chấm công kế tiếp.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setResetConfirmUser(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleConfirmReset(resetConfirmUser)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
              >
                Xác nhận Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
