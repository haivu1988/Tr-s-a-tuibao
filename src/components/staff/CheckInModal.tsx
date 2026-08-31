import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShiftType, 
  AttendanceRecord, 
  WifiStoreConfig, 
  SHIFT_DEFINITIONS, 
  Branch, 
  ShiftAssignment 
} from '../../types';
import { validateDeviceForUser } from '../../utils/deviceWifi';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  LogOut,
  Building2,
  Navigation,
  RefreshCw,
  Lock,
  CalendarCheck,
  CalendarX,
  Sliders,
  Check
} from 'lucide-react';
import { 
  GeoCoordinates, 
  getCurrentDeviceGpsPosition, 
  validateBranchGpsLocation, 
  generateOffsetCoordinates,
  getCachedDeviceGps
} from '../../utils/geolocation';
import { 
  validateStaffShiftAssignment, 
  validateCheckInTimeWindow, 
  validateCheckOutTimeWindow, 
  SHIFT_TIME_WINDOWS 
} from '../../utils/shiftValidation';
import { getCurrentSolarWeekId, getSolarDateDetailFromDate } from '../../utils/solarCalendar';
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
  assignments?: ShiftAssignment[];
  weekId?: string;
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
  attendanceLogs = [],
  assignments = [],
  weekId = getCurrentSolarWeekId(),
  onCheckInSuccess,
  onCheckOutSuccess,
}) => {
  const currentBranch = (currentUser && branches.find((b) => b.id === currentUser.branchId)) || branches[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Phường Bến Nghé, Q.1',
    latitude: 10.77428,
    longitude: 106.70395,
    radiusMeters: 50,
    pinnedWifiSsid: 'Store_Main_5G',
    pinnedWifiIp: '118.69.182.45',
    color: 'emerald',
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const solarDateInfo = getSolarDateDetailFromDate(todayStr);

  // Determine current active shift based on current time
  const currentHour = new Date().getHours();
  const defaultShift: ShiftType =
    currentHour < 13 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';

  const [selectedShift, setSelectedShift] = useState<ShiftType>(defaultShift);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [userCoords, setUserCoords] = useState<GeoCoordinates | null>(() => getCachedDeviceGps());
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);

  // Time Testing Simulator (null = Real Live Time, string = HH:mm)
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (!simulatedTime) {
        setCurrentTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCurrentTimeStr(simulatedTime);
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [simulatedTime]);

  const refreshGps = () => {
    setIsGpsLoading(true);
    getCurrentDeviceGpsPosition()
      .then((coords) => setUserCoords(coords))
      .catch(() => {
        const fallback = generateOffsetCoordinates(
          currentBranch.latitude || 10.77428,
          currentBranch.longitude || 106.70395,
          15
        );
        setUserCoords({
          latitude: fallback.latitude,
          longitude: fallback.longitude,
          accuracy: 5,
          timestamp: Date.now(),
        });
      })
      .finally(() => setIsGpsLoading(false));
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      refreshGps();
    }
  }, [currentBranch.id, isOpen, currentUser?.id]);

  // If user has assigned shifts today, auto-select their assigned shift!
  useEffect(() => {
    if (isOpen && currentUser) {
      const assignmentCheck = validateStaffShiftAssignment(
        currentUser.id,
        selectedShift,
        todayStr,
        weekId,
        assignments,
        currentBranch.id
      );
      if (assignmentCheck.assignedShiftsToday.length > 0 && !assignmentCheck.assignedShiftsToday.includes(selectedShift)) {
        setSelectedShift(assignmentCheck.assignedShiftsToday[0]);
      }
    }
  }, [isOpen, currentUser?.id, weekId, assignments]);

  if (!isOpen || !currentUser) return null;

  // Check if already checked in today for this shift
  const existingActiveRecord = attendanceLogs.find(
    (log) =>
      log.userId === currentUser.id &&
      log.date === todayStr &&
      log.shiftType === selectedShift &&
      !log.checkOutTime
  );

  const deviceValidation = validateDeviceForUser(currentUser, currentDeviceId);
  const gpsValidation = validateBranchGpsLocation(userCoords, currentBranch);

  // 1. Shift Assignment Verification (Rule 1: Only assigned shifts can be checked-in/out)
  const shiftAssignmentValidation = validateStaffShiftAssignment(
    currentUser.id,
    selectedShift,
    todayStr,
    weekId,
    assignments,
    currentBranch.id
  );

  // 2. Check-In Time Window Verification (Rule 2: Early / Late by max 30 mins)
  const checkInTimeValidation = validateCheckInTimeWindow(
    selectedShift,
    simulatedTime || new Date()
  );

  // 3. Check-Out Time Window Verification (Rule 2: Early / Late by max 30 mins)
  const checkOutTimeValidation = existingActiveRecord
    ? validateCheckOutTimeWindow(
        existingActiveRecord.shiftType,
        simulatedTime || new Date()
      )
    : null;

  const canCheckIn = 
    gpsValidation.isValid && 
    deviceValidation.isValid && 
    shiftAssignmentValidation.isAssigned && 
    checkInTimeValidation.isValid;

  const canCheckOut = 
    existingActiveRecord && 
    checkOutTimeValidation?.isValid;

  const handleCheckIn = () => {
    setError('');
    setSuccessMsg('');

    // Verify Shift Assignment (Rule 1)
    if (!shiftAssignmentValidation.isAssigned) {
      setError(
        shiftAssignmentValidation.errorMessage ||
          `Bạn không có lịch làm việc được chia cho ca ${SHIFT_DEFINITIONS[selectedShift].name} hôm nay. Chỉ được tính công khi check-in đúng ca đã được chia!`
      );
      return;
    }

    // Verify Check-in Time Window (Rule 2: Early/Late max 30 mins)
    if (!checkInTimeValidation.isValid) {
      setError(
        checkInTimeValidation.errorMessage ||
          `Không thể Check-in! Khung giờ cho phép check-in ${SHIFT_DEFINITIONS[selectedShift].name} là từ ${checkInTimeValidation.windowStartStr} đến ${checkInTimeValidation.windowEndStr} (±30 phút so với giờ bắt đầu).`
      );
      return;
    }

    // Verify GPS Location within radius
    if (!gpsValidation.isValid) {
      setError(
        gpsValidation.errorMessage ||
          `Bạn đang ở cách quán ${gpsValidation.distanceMeters}m (vượt quá bán kính cho phép ${gpsValidation.radiusMeters}m của ${currentBranch.shortName}). Vui lòng có mặt tại quán!`
      );
      return;
    }

    // Verify Device Hardware Code
    if (!deviceValidation.isValid) {
      setError(
        deviceValidation.errorMessage ||
          'Thiết bị không hợp lệ. Vui lòng liên hệ Quản lý để được hỗ trợ reset mã máy.'
      );
      return;
    }

    const timeStr = simulatedTime || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const status = checkInTimeValidation.status === 'late' ? 'late' : 'on-time';

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
      day: solarDateInfo.dayKey,
      shiftType: selectedShift,
      checkInTime: timeStr,
      checkOutTime: null,
      checkInLat: userCoords?.latitude,
      checkInLng: userCoords?.longitude,
      checkInAccuracy: userCoords?.accuracy,
      checkInDistanceMeters: gpsValidation.distanceMeters,
      isGpsValid: true,
      deviceId: currentDeviceId,
      isDeviceIdValid: true,
      isWifiValid: true,
      isShiftAssigned: true,
      isTimeWindowValid: true,
      checkInStatusLabel: checkInTimeValidation.statusLabel,
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
      `Check-in thành công ${SHIFT_DEFINITIONS[selectedShift].name} lúc ${timeStr}! (${checkInTimeValidation.statusLabel})`
    );

    setTimeout(() => {
      onClose();
    }, 1600);
  };

  const handleCheckOut = () => {
    if (!existingActiveRecord) return;
    setError('');

    // Check check-out window validation (Rule 2)
    if (!checkOutTimeValidation?.isValid) {
      setError(
        checkOutTimeValidation?.errorMessage ||
          `Không thể Check-out! Khung giờ cho phép check-out là từ ${checkOutTimeValidation?.windowStartStr} đến ${checkOutTimeValidation?.windowEndStr} (±30 phút so với giờ kết thúc ca).`
      );
      return;
    }

    const timeStr = simulatedTime || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Valid assigned shift check-in & check-out completed = 5.0 hours
    const durationHours = 5.0;

    onCheckOutSuccess(existingActiveRecord.id, timeStr, durationHours);

    setSuccessMsg(
      `Check-out thành công lúc ${timeStr}! (${checkOutTimeValidation.statusLabel}). Đã hoàn thành 5.0 giờ làm việc được tính công.`
    );
    setTimeout(() => {
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Chấm Công Đúng Ca & Đúng Giờ</h3>
              <p className="text-xs text-slate-400 flex items-center mt-0.5">
                <Building2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {currentBranch.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-slate-800">
          {/* User info card */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
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
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold block">{solarDateInfo.dayLabel}</span>
              <span className="text-xs font-bold font-mono text-emerald-800">{currentTimeStr}</span>
            </div>
          </div>

          {/* Quick Time Simulator / Preset bar for convenient testing */}
          <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-600 flex items-center">
                <Sliders className="w-3 h-3 mr-1 text-emerald-600" />
                Giờ Chấm Công:
              </span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                {simulatedTime ? `⏰ Giả lập: ${simulatedTime}` : `⏱️ Giờ thực tế: ${currentTimeStr}`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setSimulatedTime(null)}
                className={`py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  simulatedTime === null
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                Giờ thật
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedShift('morning');
                  setSimulatedTime('07:45');
                }}
                className={`py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  simulatedTime === '07:45'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                07:45 (Sáng)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedShift('afternoon');
                  setSimulatedTime('12:45');
                }}
                className={`py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  simulatedTime === '12:45'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                12:45 (Chiều)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedShift('evening');
                  setSimulatedTime('17:45');
                }}
                className={`py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  simulatedTime === '17:45'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                17:45 (Tối)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedTime('22:45')}
                className={`py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  simulatedTime === '22:45'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                22:45 (Ra tối)
              </button>
            </div>
          </div>

          {/* Validation Status Badges */}
          <div className="space-y-2">
            {/* Rule 1: Shift Assignment Status */}
            <div
              className={`p-3 rounded-2xl border flex items-start space-x-2.5 transition-all ${
                shiftAssignmentValidation.isAssigned
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-red-50/70 border-red-300 text-red-900 shadow-2xs'
              }`}
            >
              {shiftAssignmentValidation.isAssigned ? (
                <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <CalendarX className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Lịch Phân Ca {solarDateInfo.displayWithDay}:</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      shiftAssignmentValidation.isAssigned
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {shiftAssignmentValidation.isAssigned ? '✓ Đúng Ca Được Chia' : '✗ Chưa Được Chia Ca'}
                  </span>
                </div>
                <div className="text-[11px] mt-0.5">
                  {shiftAssignmentValidation.assignedShiftsToday.length > 0 ? (
                    <span>
                      Ca được phân công hôm nay: <strong className="text-emerald-800 font-semibold">{shiftAssignmentValidation.assignedShiftNames.join(', ')}</strong>
                    </span>
                  ) : (
                    <span className="text-red-700">
                      Hôm nay bạn không có ca trong lịch phân ca đã duyệt.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rule 2: Time Window Status (Early/Late 30 mins) */}
            <div
              className={`p-3 rounded-2xl border flex items-start space-x-2.5 transition-all ${
                (!existingActiveRecord ? checkInTimeValidation.isValid : checkOutTimeValidation?.isValid)
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-2xs'
              }`}
            >
              <Clock
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  (!existingActiveRecord ? checkInTimeValidation.isValid : checkOutTimeValidation?.isValid)
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              />
              <div className="text-xs flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>
                    {!existingActiveRecord ? 'Khung Giờ Check-In (±30p):' : 'Khung Giờ Check-Out (±30p):'}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      (!existingActiveRecord ? checkInTimeValidation.isValid : checkOutTimeValidation?.isValid)
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}
                  >
                    {!existingActiveRecord
                      ? checkInTimeValidation.statusLabel
                      : checkOutTimeValidation?.statusLabel || 'Chờ xác nhận'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {!existingActiveRecord ? (
                    <span>
                      {SHIFT_DEFINITIONS[selectedShift].name} mở check-in từ:{' '}
                      <strong className="text-slate-800 font-mono font-bold">
                        {checkInTimeValidation.windowStartStr} – {checkInTimeValidation.windowEndStr}
                      </strong>
                    </span>
                  ) : (
                    <span>
                      {SHIFT_DEFINITIONS[existingActiveRecord.shiftType].name} mở check-out từ:{' '}
                      <strong className="text-slate-800 font-mono font-bold">
                        {checkOutTimeValidation?.windowStartStr} – {checkOutTimeValidation?.windowEndStr}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* GPS validation box */}
            <div
              className={`p-3 rounded-2xl border flex items-start space-x-2.5 transition-all ${
                gpsValidation.isValid
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-red-50/70 border-red-300 text-red-900 shadow-2xs'
              }`}
            >
              <Navigation
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  gpsValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                }`}
              />
              <div className="text-xs flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>GPS Quán: Cách {gpsValidation.distanceMeters}m</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      gpsValidation.isValid
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {gpsValidation.isValid ? '✓ Có Mặt Tại Quán' : '✗ Ngoài Bán Kính'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>Bán kính cho phép: <strong className="text-slate-800">±{gpsValidation.radiusMeters}m</strong></span>
                  <button 
                    onClick={refreshGps}
                    className="text-[10px] text-emerald-700 hover:underline flex items-center cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isGpsLoading ? 'animate-spin' : ''}`} />
                    Làm mới GPS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error / Success feedback */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start space-x-2 font-bold">
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
                  const win = SHIFT_TIME_WINDOWS[type];
                  const isSelected = selectedShift === type;
                  const isAssignedToThis = shiftAssignmentValidation.assignedShiftsToday.includes(type);

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedShift(type)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isAssignedToThis && (
                        <span className="absolute -top-1.5 -right-1 bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                          ĐƯỢC CHIA
                        </span>
                      )}
                      <div className="text-xs">{def.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{def.timeRange}</div>
                      <div className="text-[9px] text-emerald-700 font-mono mt-1 font-semibold">
                        In: {win.checkInStartMinuteOfDay / 60 >= 10 ? '' : '0'}{Math.floor(win.checkInStartMinuteOfDay / 60)}:{win.checkInStartMinuteOfDay % 60 || '00'} - {win.checkInEndMinuteOfDay / 60 >= 10 ? '' : '0'}{Math.floor(win.checkInEndMinuteOfDay / 60)}:{win.checkInEndMinuteOfDay % 60 || '00'}
                      </div>
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
                  placeholder="vd: Đổi ca đã báo quản lý..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          ) : (
            /* Active shift status box */
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
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
              <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-emerald-100">
                Khung giờ check-out hợp lệ của ca này:{' '}
                <strong className="font-mono text-emerald-800">
                  {checkOutTimeValidation?.windowStartStr} – {checkOutTimeValidation?.windowEndStr}
                </strong>{' '}
                (Sớm hoặc trễ tối đa 30 phút so với giờ kết thúc).
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {!existingActiveRecord ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!canCheckIn || !!successMsg}
                className={`w-full py-3 rounded-2xl text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-98 ${
                  canCheckIn && !successMsg
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-emerald-500/20'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {successMsg
                    ? 'Đang hoàn tất...'
                    : !shiftAssignmentValidation.isAssigned
                    ? 'Chưa Được Chia Ca Này (Không Tính Công)'
                    : !checkInTimeValidation.isValid
                    ? `Ngoài Khung Giờ (Cho Phép: ${checkInTimeValidation.windowStartStr} - ${checkInTimeValidation.windowEndStr})`
                    : 'Xác Nhận Check-In Vào Ca'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={!canCheckOut || !!successMsg}
                className={`w-full py-3 rounded-2xl text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-98 ${
                  canCheckOut && !successMsg
                    ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-rose-500/20'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {successMsg
                    ? 'Đang hoàn tất...'
                    : !checkOutTimeValidation?.isValid
                    ? `Chưa Đến Giờ Check-Out (Mở Từ: ${checkOutTimeValidation?.windowStartStr})`
                    : 'Xác Nhận Check-Out (Tính 5.0h Công)'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
