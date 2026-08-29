import React, { useState, useEffect } from 'react';
import { 
  User, 
  Branch,
  WifiStoreConfig, 
  AttendanceRecord, 
  ShiftType, 
  DayOfWeek,
  SHIFT_DEFINITIONS,
  DAYS_OF_WEEK
} from '../../types';
import { 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  LogOut,
  Building2,
  Calendar,
  Pin,
  Globe,
  Cpu
} from 'lucide-react';
import { 
  validateDeviceForUser, 
  getClientDeviceId, 
  getSimulatedWifi,
  getSimulatedIp,
  validateBranchWifiIp
} from '../../utils/deviceWifi';
import { getCachedHardwareDeviceInfo, scanDeviceHardwareProfile, HardwareDeviceInfo } from '../../utils/deviceFingerprint';
import { getSolarDateInfo, formatSolarDateWithWeekday } from '../../utils/solarCalendar';
import confetti from 'canvas-confetti';

interface StaffCheckInViewProps {
  currentUser: User;
  branches: Branch[];
  wifiConfig: WifiStoreConfig;
  currentSimulatedWifi: string;
  currentSimulatedIp?: string;
  currentDeviceId: string;
  attendanceLogs: AttendanceRecord[];
  onCheckInSuccess: (record: AttendanceRecord, updatedUser?: User) => void;
  onCheckOutSuccess: (recordId: string, checkOutTime: string) => void;
}

export const StaffCheckInView: React.FC<StaffCheckInViewProps> = ({
  currentUser,
  branches = [],
  wifiConfig,
  currentSimulatedWifi,
  currentSimulatedIp = '118.69.182.45',
  currentDeviceId,
  attendanceLogs = [],
  onCheckInSuccess,
  onCheckOutSuccess,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<ShiftType>('morning');
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hwInfo, setHwInfo] = useState<HardwareDeviceInfo | null>(() => getCachedHardwareDeviceInfo());

  useEffect(() => {
    scanDeviceHardwareProfile().then((info) => setHwInfo(info));
  }, []);

  const currentBranch = branches?.find((b) => b.id === currentUser.branchId) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
    pinnedWifiIp: '118.69.182.45',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const dayIndex = new Date().getDay();
  const dayKeyMap: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayKeyMap[dayIndex];

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      
      const hour = now.getHours();
      if (hour >= 8 && hour < 13) setSelectedShift('morning');
      else if (hour >= 13 && hour < 18) setSelectedShift('afternoon');
      else setSelectedShift('evening');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Validation against Branch Pinned WiFi & IP
  const isWifiValid = 
    currentSimulatedWifi.toLowerCase().trim() === currentBranch.pinnedWifiSsid.toLowerCase().trim() ||
    currentSimulatedWifi.toLowerCase().includes(currentBranch.pinnedWifiSsid.toLowerCase()) ||
    currentSimulatedWifi === wifiConfig.primarySsid;

  const ipValidation = validateBranchWifiIp(currentSimulatedIp, currentBranch);
  const deviceValidation = validateDeviceForUser(currentUser, currentDeviceId);

  // Active check-in record for today
  const activeRecord = attendanceLogs.find(
    (l) => l.userId === currentUser.id && l.date === todayIso && !l.checkOutTime
  );

  const handlePerformCheckIn = () => {
    if (!isWifiValid) {
      setFeedback({
        type: 'error',
        message: `WiFi hiện tại ("${currentSimulatedWifi}") không đúng với WiFi đã ghim của ${currentBranch.name} ("${currentBranch.pinnedWifiSsid}"). Vui lòng kết nối đúng mạng WiFi!`,
      });
      return;
    }

    if (!ipValidation.isValid) {
      setFeedback({
        type: 'error',
        message: ipValidation.errorMessage || `Địa chỉ IP mạng (${currentSimulatedIp}) không khớp với IP đã ghim của ${currentBranch.shortName} (${currentBranch.pinnedWifiIp}).`,
      });
      return;
    }

    if (!deviceValidation.isValid) {
      setFeedback({
        type: 'error',
        message: deviceValidation.errorMessage || 'Lỗi mã máy không trùng khớp!',
      });
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    let updatedUser: User | undefined;
    if (!currentUser.registeredDeviceId) {
      updatedUser = {
        ...currentUser,
        registeredDeviceId: currentDeviceId,
      };
    }

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      branchId: currentUser.branchId || currentBranch.id,
      branchName: currentBranch.name,
      date: todayIso,
      solarDateFormatted: formatSolarDateWithWeekday(todayIso),
      day: todayKey,
      shiftType: selectedShift,
      checkInTime: timeStr,
      checkOutTime: null,
      wifiSsid: currentSimulatedWifi,
      wifiIp: currentSimulatedIp,
      pinnedWifiIp: currentBranch.pinnedWifiIp,
      isIpValid: true,
      deviceId: currentDeviceId,
      isDeviceIdValid: true,
      isWifiValid: true,
      status: 'on-time',
      notes: notes.trim() || undefined,
    };

    onCheckInSuccess(newRecord, updatedUser);

    setFeedback({
      type: 'success',
      message: deviceValidation.isFirstRegistration
        ? `Đã Check-in thành công tại ${currentBranch.shortName}! Mã máy (${currentDeviceId}) và IP (${currentSimulatedIp}) đã được duyệt hợp lệ.`
        : `Check-in ${SHIFT_DEFINITIONS[selectedShift].name} tại ${currentBranch.shortName} thành công lúc ${timeStr} (IP: ${currentSimulatedIp})!`,
    });

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setNotes('');
  };

  const handlePerformCheckOut = () => {
    if (!activeRecord) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    onCheckOutSuccess(activeRecord.id, timeStr);
    
    setFeedback({
      type: 'success',
      message: `Check-out thành công lúc ${timeStr}. Dữ liệu công đã được ghi nhận vào báo cáo của ${currentBranch.shortName}!`,
    });

    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Trạm Chấm Công Tự Động Định Danh</span>
          </div>
          <h2 className="text-2xl font-black">{currentUser.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-xs text-slate-300">
            <span className="font-semibold text-emerald-400 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              {currentBranch.name}
            </span>
            <span>•</span>
            <span>Lương: {currentUser.hourlyRate.toLocaleString('vi-VN')} đ/h</span>
          </div>
        </div>

        {/* Live Clock Display */}
        <div className="bg-slate-800/90 border border-slate-700 px-6 py-4 rounded-2xl text-center shadow-inner">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-emerald-400">
            {currentTime || '--:--:--'}
          </div>
          <div className="text-[11px] text-slate-300 capitalize mt-1 flex items-center justify-center space-x-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>{currentDateStr || 'Hôm nay'} (Dương lịch)</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start space-x-3 text-sm font-semibold animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{feedback.message}</div>
        </div>
      )}

      {/* Main Verification & Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Checks Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Xác Thực Điều Kiện Chấm Công
            </h3>
          </div>

          {/* WiFi Verification Row */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              isWifiValid
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-rose-50/70 border-rose-300'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                isWifiValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              <Wifi className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center">
                  <Pin className="w-3 h-3 mr-1 text-emerald-600" />
                  WiFi Chi Nhánh ({currentBranch.shortName})
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isWifiValid
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {isWifiValid ? 'Hợp lệ' : 'Không hợp lệ'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-700 mt-1 truncate">
                Đang kết nối: "{currentSimulatedWifi}"
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                WiFi đã ghim: <span className="font-mono font-semibold text-emerald-700">{currentBranch.pinnedWifiSsid}</span>
              </p>
            </div>
          </div>

          {/* IP Address Verification Row */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              ipValidation.isValid
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-rose-50/70 border-rose-300'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                ipValidation.isValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center">
                  <Globe className="w-3 h-3 mr-1 text-emerald-600" />
                  Địa Chỉ IP WiFi Quán
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ipValidation.isValid
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {ipValidation.isValid ? 'Khớp IP Ghim' : 'Sai Địa Chỉ IP'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-700 mt-1 truncate">
                IP hiện tại: {currentSimulatedIp}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                IP ghim quán ({currentBranch.shortName}): <span className="font-mono font-bold text-emerald-700">{currentBranch.pinnedWifiIp || 'Chưa thiết lập'}</span>
              </p>
            </div>
          </div>

          {/* Device MAC Address Verification Row */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              deviceValidation.isValid
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-rose-50/70 border-rose-300'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                deviceValidation.isValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-900">Địa chỉ MAC phần cứng điện thoại</span>
                  {hwInfo && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-md">
                      📱 {hwInfo.deviceName}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    deviceValidation.isFirstRegistration
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : deviceValidation.isValid
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {deviceValidation.isFirstRegistration
                    ? 'Lần đầu (Tự khóa MAC máy này)'
                    : deviceValidation.isValid
                    ? 'Khớp MAC máy chính chủ'
                    : 'Sai MAC điện thoại'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate flex items-center space-x-2">
                <span>MAC máy: {currentDeviceId}</span>
                <span className="text-[9px] font-sans font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  🔒 Web Crypto SHA-256
                </span>
              </div>
              {hwInfo && (
                <div className="text-[10.5px] text-slate-500 mt-1 flex flex-wrap gap-x-2">
                  <span>GPU: <strong className="text-slate-700">{hwInfo.gpuRenderer}</strong></span>
                  <span>•</span>
                  <span>CPU: <strong className="text-slate-700">{hwInfo.cpuCores} Cores</strong></span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                {currentUser.registeredDeviceId ? (
                  <>MAC đã khóa: <span className="font-mono font-semibold text-emerald-700">{currentUser.registeredDeviceId}</span></>
                ) : (
                  <span className="text-emerald-700 font-semibold">Chưa đăng ký. Địa chỉ MAC phần cứng từ chiếc điện thoại này sẽ được tự động khóa vĩnh viễn vào tài khoản của bạn khi bấm Check-in.</span>
                )}
              </p>
            </div>
          </div>

          {/* Security explanation note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Chính sách bảo mật chống gian lận
            </div>
            <p>
              Mỗi nhân viên chỉ được sử dụng 1 thiết bị điện thoại cố định và phải kết nối đúng WiFi đã ghim của chi nhánh mình trực.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Thực Hiện Điểm Danh
              </h3>
              {activeRecord && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Đang trong ca trực
                </span>
              )}
            </div>

            {/* If not checked in, choose shift */}
            {!activeRecord && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn ca làm việc hôm nay:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['morning', 'afternoon', 'evening'] as ShiftType[]).map((type) => {
                    const def = SHIFT_DEFINITIONS[type];
                    const selected = selectedShift === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedShift(type)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selected
                            ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-md'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs">{def.name}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${selected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {def.timeRange}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ghi chú điểm danh (tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Đến sớm mở quán, trực quầy pha chế..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* If checked in, show current status */}
            {activeRecord && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="text-xs text-emerald-900">
                  Bạn đã Check-in ca <span className="font-bold">{SHIFT_DEFINITIONS[activeRecord.shiftType].name}</span> lúc:
                </div>
                <div className="text-2xl font-black font-mono text-emerald-800">
                  {activeRecord.checkInTime}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  WiFi: {activeRecord.wifiSsid} • Mã máy: {activeRecord.deviceId}
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div>
            {activeRecord ? (
              <button
                type="button"
                onClick={handlePerformCheckOut}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>Hoàn Thành Ca & Check-out Ngay</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePerformCheckIn}
                disabled={!isWifiValid || !ipValidation.isValid || !deviceValidation.isValid}
                className={`w-full py-3.5 font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 ${
                  isWifiValid && ipValidation.isValid && deviceValidation.isValid
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Check-in Ca Làm</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
