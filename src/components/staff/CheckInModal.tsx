import React, { useState } from 'react';
import { User, ShiftType, AttendanceRecord, WifiStoreConfig, SHIFT_DEFINITIONS, Branch } from '../../types';
import { validateDeviceForUser, validateWifi, validateBranchWifiIp } from '../../utils/deviceWifi';
import { 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  ArrowRight,
  LogOut,
  Building2,
  Pin,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  branches?: Branch[];
  wifiConfig: WifiStoreConfig;
  currentSimulatedWifi: string;
  currentSimulatedIp?: string;
  currentDeviceId: string;
  attendanceLogs: AttendanceRecord[];
  onCheckInSuccess: (record: AttendanceRecord, updatedUser?: User) => void;
  onCheckOutSuccess: (recordId: string, checkOutTime: string, durationHours: number) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  branches = [],
  wifiConfig,
  currentSimulatedWifi,
  currentSimulatedIp = '118.69.182.45',
  currentDeviceId,
  attendanceLogs,
  onCheckInSuccess,
  onCheckOutSuccess,
}) => {
  if (!isOpen || !currentUser) return null;

  const currentBranch = branches.find((b) => b.id === currentUser.branchId) || branches[0] || {
    id: 'branch_q1',
    name: 'PartFlow Coffee - Quận 1',
    shortName: 'Quận 1',
    address: '120 Nguyễn Thị Minh Khai, Q.1',
    pinnedWifiSsid: 'PartFlow_Q1_5G',
    pinnedWifiIp: '118.69.182.45',
    color: 'emerald',
  };

  // Determine current active shift based on current time
  const currentHour = new Date().getHours();
  const defaultShift: ShiftType =
    currentHour < 13 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';

  const [selectedShift, setSelectedShift] = useState<ShiftType>(defaultShift);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Check if already checked in today for this shift
  const existingActiveRecord = attendanceLogs.find(
    (log) =>
      log.userId === currentUser.id &&
      log.date === todayStr &&
      log.shiftType === selectedShift &&
      !log.checkOutTime
  );

  const deviceValidation = validateDeviceForUser(currentUser, currentDeviceId);
  const ipValidation = validateBranchWifiIp(currentSimulatedIp, currentBranch);

  const handleCheckIn = () => {
    setError('');
    setSuccessMsg('');

    // Verify IP against pinned branch IP
    if (!ipValidation.isValid) {
      setError(
        ipValidation.errorMessage ||
          `Địa chỉ IP WiFi (${currentSimulatedIp}) không khớp với IP đã ghim của ${currentBranch.shortName} (${currentBranch.pinnedWifiIp}). Vui lòng kết nối đúng WiFi quán!`
      );
      return;
    }

    // Verify Device Hardware Code
    if (!deviceValidation.isValid) {
      setError(
        deviceValidation.errorMessage ||
          'Mã máy không hợp lệ. Vui lòng liên hệ Quản lý để được hỗ trợ reset mã máy.'
      );
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Determine status (on-time vs late)
    const shiftDef = SHIFT_DEFINITIONS[selectedShift];
    const isLate = now.getHours() > shiftDef.startHour || (now.getHours() === shiftDef.startHour && now.getMinutes() > 10);
    const status = isLate ? 'late' : 'on-time';

    let updatedUser: User | undefined = undefined;
    // If first-time registration, lock this device ID to the user!
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
      date: todayStr,
      day: 'mon', // current day
      shiftType: selectedShift,
      checkInTime: timeStr,
      checkOutTime: null,
      wifiSsid: `IP: ${currentSimulatedIp}`,
      wifiIp: currentSimulatedIp,
      pinnedWifiIp: currentBranch.pinnedWifiIp,
      isIpValid: true,
      deviceId: currentDeviceId,
      isDeviceIdValid: true,
      isWifiValid: true,
      status,
      notes: notes.trim() || undefined,
    };

    onCheckInSuccess(newRecord, updatedUser);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    setSuccessMsg(
      deviceValidation.isFirstRegistration
        ? `Đã đăng ký Mã máy (${currentDeviceId}) và Check-in IP (${currentSimulatedIp}) thành công tại ${currentBranch.shortName} lúc ${timeStr}!`
        : `Check-in thành công tại ${currentBranch.shortName} lúc ${timeStr} (IP WiFi: ${currentSimulatedIp})!`
    );

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleCheckOut = () => {
    if (!existingActiveRecord) return;
    setError('');

    if (!ipValidation.isValid) {
      setError(
        `Check-out yêu cầu kết nối đúng địa chỉ IP WiFi đã ghim của ${currentBranch.shortName} (${currentBranch.pinnedWifiIp}). Hiện tại: ${currentSimulatedIp}`
      );
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Calculate approximate duration
    const [inHours, inMins] = existingActiveRecord.checkInTime.split(':').map(Number);
    const inTotalMinutes = inHours * 60 + inMins;
    const outTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const diffHours = Math.max(0.5, Number(((outTotalMinutes - inTotalMinutes) / 60).toFixed(1)));

    onCheckOutSuccess(existingActiveRecord.id, timeStr, diffHours);

    setSuccessMsg(`Check-out thành công lúc ${timeStr}! Tổng thời gian làm việc: ${diffHours} giờ.`);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Chấm Công WiFi Chi Nhánh</h3>
              <p className="text-xs text-slate-400 flex items-center mt-0.5">
                <Building2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {currentBranch.name}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* User info card */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-300"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                <span className="font-semibold text-emerald-700">{currentBranch.shortName}</span>
                <span>•</span>
                <span>{currentUser.hourlyRate.toLocaleString('vi-VN')} đ/giờ</span>
              </div>
            </div>
          </div>

          {/* Validation Status Badges */}
          <div className="space-y-2.5">
            {/* IP validation box */}
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-all ${
                ipValidation.isValid
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-red-50/70 border-red-300 text-red-900 shadow-xs'
              }`}
            >
              <Globe
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  ipValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                }`}
              />
              <div className="text-xs flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>IP Mạng WiFi: {currentSimulatedIp}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      ipValidation.isValid
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {ipValidation.isValid ? '✓ Đúng IP WiFi Quán' : '✗ Sai Địa Chỉ IP'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center">
                  <Globe className="w-3 h-3 mr-1 text-emerald-600 inline" />
                  IP ghim ({currentBranch.shortName}): <span className="font-mono font-semibold ml-1 text-slate-800">{currentBranch.pinnedWifiIp || 'Chưa thiết lập'}</span>
                </div>
              </div>
            </div>

            {/* Device Hardware Key validation box */}
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-all ${
                deviceValidation.isValid
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-red-50/70 border-red-300 text-red-900 shadow-xs'
              }`}
            >
              <Smartphone
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  deviceValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                }`}
              />
              <div className="text-xs flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Mã Máy: {currentDeviceId}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      deviceValidation.isFirstRegistration
                        ? 'bg-amber-200 text-amber-800'
                        : deviceValidation.isValid
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {deviceValidation.isFirstRegistration
                      ? 'Khóa Mã Máy Lần Đầu'
                      : deviceValidation.isValid
                      ? '✓ Mã Máy Khớp'
                      : '✗ Sai Điện Thoại!'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {deviceValidation.isFirstRegistration ? (
                    <span className="text-amber-700">
                      *Mã máy phần cứng từ chiếc điện thoại này sẽ tự động được khóa cố định cho tài khoản của bạn khi bấm Check-in.
                    </span>
                  ) : (
                    <span>
                      Mã máy đã khóa: <span className="font-mono font-bold text-emerald-700">{currentUser.registeredDeviceId}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error / Success feedback */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Shift Selection if not checked in */}
          {!existingActiveRecord ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chọn Ca Làm Việc Chấm Công:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['morning', 'afternoon', 'evening'] as ShiftType[]).map((type) => {
                  const def = SHIFT_DEFINITIONS[type];
                  const isSelected = selectedShift === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedShift(type)}
                      className={`p-2.5 rounded-xl border text-center transition-colors ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">{def.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{def.timeRange}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú check-in (tùy chọn)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="vd: Trực thay bạn Tuấn, đổi ca..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            /* Active shift status box */
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">
                  Bạn đang trong {SHIFT_DEFINITIONS[existingActiveRecord.shiftType].name}
                </span>
                <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  Đang làm việc
                </span>
              </div>
              <div className="text-xs text-emerald-700">
                Đã Check-in lúc:{' '}
                <span className="font-bold font-mono">{existingActiveRecord.checkInTime}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Khi hết ca làm việc, vui lòng bấm nút Check-out bên dưới để chốt giờ làm.
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {!existingActiveRecord ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!ipValidation.isValid || !deviceValidation.isValid}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-98 ${
                  ipValidation.isValid && deviceValidation.isValid
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {deviceValidation.isFirstRegistration
                    ? 'Đăng Ký Máy & Check-in Ngay'
                    : 'Xác Nhận Check-In Vào Ca'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={!ipValidation.isValid}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-98 ${
                  ipValidation.isValid
                    ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <LogOut className="w-5 h-5" />
                <span>Xác Nhận Check-Out (Kết Thúc Ca)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
