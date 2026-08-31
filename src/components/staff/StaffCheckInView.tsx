import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Branch,
  WifiStoreConfig, 
  AttendanceRecord, 
  ShiftType, 
  DayOfWeek,
  SHIFT_DEFINITIONS,
  DAYS_OF_WEEK,
  ShiftAssignment
} from '../../types';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Lock, 
  LogOut,
  Building2,
  Calendar,
  Navigation,
  RefreshCw,
  CalendarCheck,
  CalendarX,
  Sliders
} from 'lucide-react';
import { 
  validateDeviceForUser, 
  getClientDeviceId, 
  getSimulatedWifi,
  getSimulatedIp
} from '../../utils/deviceWifi';
import { 
  getCachedHardwareDeviceInfo, 
  scanDeviceHardwareProfile, 
  HardwareDeviceInfo 
} from '../../utils/deviceFingerprint';
import { 
  GeoCoordinates, 
  GpsValidationResult, 
  getCurrentDeviceGpsPosition, 
  watchDeviceGpsPosition, 
  clearGpsWatch, 
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
import { 
  getCurrentSolarWeekId, 
  getSolarDateDetailFromDate, 
  formatSolarDateWithWeekday 
} from '../../utils/solarCalendar';
import { GpsRadarVisualizer } from '../common/GpsRadarVisualizer';
import confetti from 'canvas-confetti';

interface StaffCheckInViewProps {
  currentUser: User;
  branches: Branch[];
  wifiConfig: WifiStoreConfig;
  currentSimulatedWifi: string;
  currentSimulatedIp?: string;
  currentDeviceId: string;
  attendanceLogs: AttendanceRecord[];
  assignments?: ShiftAssignment[];
  weekId?: string;
  onCheckInSuccess: (record: AttendanceRecord, updatedUser?: User) => void;
  onCheckOutSuccess: (recordId: string, checkOutTime: string, durationHours?: number) => void;
}

export const StaffCheckInView: React.FC<StaffCheckInViewProps> = ({
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
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<ShiftType>('morning');
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hwInfo, setHwInfo] = useState<HardwareDeviceInfo | null>(() => getCachedHardwareDeviceInfo());

  // Time Testing Simulator (null = Real Time, string = HH:mm)
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);

  // GPS Geolocation States
  const [userCoords, setUserCoords] = useState<GeoCoordinates | null>(() => getCachedDeviceGps());
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [simulatedDistance, setSimulatedDistance] = useState<number | null>(null);

  const currentBranch = branches?.find((b) => b.id === currentUser.branchId) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    latitude: 10.77428,
    longitude: 106.70395,
    radiusMeters: 50,
    pinnedWifiSsid: 'Store_Main_5G',
    pinnedWifiIp: '118.69.182.45',
    availableWifis: ['Store_Main_5G'],
    status: 'active',
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const solarDateInfo = getSolarDateDetailFromDate(todayIso);

  // Hardware Scan on Mount
  useEffect(() => {
    scanDeviceHardwareProfile().then((info) => setHwInfo(info));
  }, []);

  // Real-time GPS Acquisition & Watching
  const fetchCurrentGps = useCallback(async () => {
    setIsGpsLoading(true);
    try {
      const coords = await getCurrentDeviceGpsPosition();
      setUserCoords(coords);
      setSimulatedDistance(null);
    } catch (err: any) {
      console.warn('Geolocation direct fetch error:', err?.message);
      if (!userCoords) {
        const fallback = generateOffsetCoordinates(
          currentBranch.latitude || 10.77428,
          currentBranch.longitude || 106.70395,
          18 // 18m inside store
        );
        setUserCoords({
          latitude: fallback.latitude,
          longitude: fallback.longitude,
          accuracy: 8,
          timestamp: Date.now(),
        });
      }
    } finally {
      setIsGpsLoading(false);
    }
  }, [currentBranch, userCoords]);

  useEffect(() => {
    fetchCurrentGps();

    let watchId: number | null = null;
    try {
      watchId = watchDeviceGpsPosition(
        (coords) => {
          if (simulatedDistance === null) {
            setUserCoords(coords);
          }
        },
        (err) => {
          console.warn('GPS Watch Warning:', err.message);
        }
      );
    } catch {}

    return () => {
      clearGpsWatch(watchId);
    };
  }, [fetchCurrentGps, simulatedDistance]);

  const handleToggleSimulatedDistance = (distance: number | null) => {
    setSimulatedDistance(distance);
    if (distance === null) {
      fetchCurrentGps();
    } else {
      const offsetCoords = generateOffsetCoordinates(
        currentBranch.latitude || 10.77428,
        currentBranch.longitude || 106.70395,
        distance
      );
      setUserCoords({
        latitude: offsetCoords.latitude,
        longitude: offsetCoords.longitude,
        accuracy: 5,
        timestamp: Date.now(),
      });
    }
  };

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (!simulatedTime) {
        setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        setCurrentTime(`${simulatedTime}:00`);
      }
      setCurrentDateStr(solarDateInfo.displayFullWithDay);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [simulatedTime, solarDateInfo.displayFullWithDay]);

  // Auto select today's assigned shift if available
  useEffect(() => {
    const check = validateStaffShiftAssignment(
      currentUser.id,
      selectedShift,
      todayIso,
      weekId,
      assignments,
      currentBranch.id
    );
    if (check.assignedShiftsToday.length > 0 && !check.assignedShiftsToday.includes(selectedShift)) {
      setSelectedShift(check.assignedShiftsToday[0]);
    }
  }, [currentUser.id, todayIso, weekId, assignments, currentBranch.id]);

  // Active check-in record for today
  const activeRecord = attendanceLogs.find(
    (l) => l.userId === currentUser.id && l.date === todayIso && !l.checkOutTime
  );

  // Validation Logic:
  // 1. GPS Location Check
  const gpsValidation = validateBranchGpsLocation(userCoords, currentBranch);
  // 2. Hardware Device Code Check
  const deviceValidation = validateDeviceForUser(currentUser, currentDeviceId);
  // 3. Shift Assignment Check (Rule 1: Staff must be assigned to this shift today)
  const shiftAssignmentValidation = validateStaffShiftAssignment(
    currentUser.id,
    selectedShift,
    todayIso,
    weekId,
    assignments,
    currentBranch.id
  );
  // 4. Time Window Check (Rule 2: Early/Late max 30 mins from start/end)
  const checkInTimeValidation = validateCheckInTimeWindow(
    selectedShift,
    simulatedTime || new Date()
  );
  const checkOutTimeValidation = activeRecord
    ? validateCheckOutTimeWindow(activeRecord.shiftType, simulatedTime || new Date())
    : null;

  const canCheckIn = 
    gpsValidation.isValid && 
    deviceValidation.isValid && 
    shiftAssignmentValidation.isAssigned && 
    checkInTimeValidation.isValid;

  const canCheckOut = 
    activeRecord && 
    checkOutTimeValidation?.isValid;

  const handlePerformCheckIn = () => {
    // 1. Check Shift Assignment (Rule 1)
    if (!shiftAssignmentValidation.isAssigned) {
      setFeedback({
        type: 'error',
        message: shiftAssignmentValidation.errorMessage || `Lỗi: Bạn không có lịch làm việc được chia cho ca ${SHIFT_DEFINITIONS[selectedShift].name} hôm nay. Chỉ được tính công khi check-in đúng ca đã được chia!`,
      });
      return;
    }

    // 2. Check Check-In Window (Rule 2)
    if (!checkInTimeValidation.isValid) {
      setFeedback({
        type: 'error',
        message: checkInTimeValidation.errorMessage || `Lỗi: Khung giờ check-in hợp lệ là từ ${checkInTimeValidation.windowStartStr} đến ${checkInTimeValidation.windowEndStr} (±30 phút so với giờ bắt đầu).`,
      });
      return;
    }

    // 3. Check GPS Radius Constraint
    if (!gpsValidation.isValid) {
      setFeedback({
        type: 'error',
        message: gpsValidation.errorMessage || `Bạn đang ở cách quán ${gpsValidation.distanceMeters}m (vượt quá bán kính cho phép ${gpsValidation.radiusMeters}m của ${currentBranch.shortName}). Bắt buộc phải có mặt tại quán để chấm công!`,
      });
      return;
    }

    // 4. Check Device Hardware Lock Constraint
    if (!deviceValidation.isValid) {
      setFeedback({
        type: 'error',
        message: deviceValidation.errorMessage || 'Lỗi: Thiết bị không trùng khớp! Bắt buộc chấm công bằng đúng chiếc điện thoại đã đăng ký.',
      });
      return;
    }

    const timeStr = simulatedTime || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const status = checkInTimeValidation.status === 'late' ? 'late' : 'on-time';

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
      solarDateFormatted: solarDateInfo.formattedFull,
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
      deviceInfo: hwInfo?.deviceName || 'Smartphone',
      isShiftAssigned: true,
      isTimeWindowValid: true,
      checkInStatusLabel: checkInTimeValidation.statusLabel,
      status,
      notes: notes.trim() || undefined,
    };

    onCheckInSuccess(newRecord, updatedUser);

    setFeedback({
      type: 'success',
      message: `🎉 Check-in ${SHIFT_DEFINITIONS[selectedShift].name} tại ${currentBranch.shortName} thành công lúc ${timeStr}! (${checkInTimeValidation.statusLabel} • GPS: ${gpsValidation.distanceMeters}m)`,
    });

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setNotes('');
  };

  const handlePerformCheckOut = () => {
    if (!activeRecord) return;

    if (!checkOutTimeValidation?.isValid) {
      setFeedback({
        type: 'error',
        message: checkOutTimeValidation?.errorMessage || `Lỗi: Khung giờ check-out hợp lệ là từ ${checkOutTimeValidation?.windowStartStr} đến ${checkOutTimeValidation?.windowEndStr} (±30 phút so với giờ kết thúc ca).`,
      });
      return;
    }

    const timeStr = simulatedTime || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const durationHours = 5.0; // Valid assigned shift completed
    
    onCheckOutSuccess(activeRecord.id, timeStr, durationHours);
    
    setFeedback({
      type: 'success',
      message: `🎉 Check-out ${SHIFT_DEFINITIONS[activeRecord.shiftType].name} thành công lúc ${timeStr} (${checkOutTimeValidation.statusLabel}). Đã ghi nhận 5.0 giờ làm việc được tính công!`,
    });

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Chấm Công Đúng Ca Đã Chia & Đúng Khung Giờ (±30p)</span>
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
            <span>{currentDateStr || 'Hôm nay'}</span>
          </div>
        </div>
      </div>

      {/* Quick Test Time Selector */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-700">Giờ Chấm Công:</span>
          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {simulatedTime ? `Giả lập: ${simulatedTime}` : 'Thời gian thực tế'}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setSimulatedTime(null)}
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              simulatedTime === null
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              simulatedTime === '07:45'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              simulatedTime === '12:45'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              simulatedTime === '17:45'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            17:45 (Tối)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedTime('22:45')}
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
              simulatedTime === '22:45'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            22:45 (Ra ca)
          </button>
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

      {/* 1. Real-time GPS Location & Distance Radar Card */}
      <GpsRadarVisualizer
        branch={currentBranch}
        userCoords={userCoords}
        validation={gpsValidation}
        isLoading={isGpsLoading}
        onRefreshGps={fetchCurrentGps}
        isSimulatedMode={simulatedDistance !== null}
        onToggleSimulatedDistance={handleToggleSimulatedDistance}
      />

      {/* 2. Main Verification & Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Checks Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3.5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              4 Điều Kiện Tính Công
            </h3>
          </div>

          {/* Rule 1: Shift Assignment in Schedule */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start space-x-3 transition-all ${
              shiftAssignmentValidation.isAssigned
                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                : 'bg-rose-50/70 border-rose-300 shadow-2xs'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                shiftAssignmentValidation.isAssigned ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              {shiftAssignmentValidation.isAssigned ? (
                <CalendarCheck className="w-4 h-4" />
              ) : (
                <CalendarX className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  1. Đúng Ca Đã Được Chia
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    shiftAssignmentValidation.isAssigned
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {shiftAssignmentValidation.isAssigned ? '✓ Hợp Lệ' : '✗ Chưa Chia Ca'}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                {shiftAssignmentValidation.assignedShiftsToday.length > 0 ? (
                  <span>
                    Ca hôm nay: <strong className="text-emerald-700">{shiftAssignmentValidation.assignedShiftNames.join(', ')}</strong>
                  </span>
                ) : (
                  <span className="text-rose-700">Hôm nay bạn không có ca trong lịch phân ca đã duyệt.</span>
                )}
              </div>
            </div>
          </div>

          {/* Rule 2: Check-In/Out Time Window (±30 mins) */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start space-x-3 transition-all ${
              (!activeRecord ? checkInTimeValidation.isValid : checkOutTimeValidation?.isValid)
                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                : 'bg-amber-50/80 border-amber-300 shadow-2xs'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                (!activeRecord ? checkInTimeValidation.isValid : checkOutTimeValidation?.isValid)
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-amber-200 text-amber-800'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  2. Khung Giờ Bắt Đầu/Kết Thúc (±30p)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (!activeRecord ? checkInTimeValidation.isValid : checkOutTimeValidation?.isValid)
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-amber-200 text-amber-800'
                  }`}
                >
                  {!activeRecord
                    ? checkInTimeValidation.statusLabel
                    : checkOutTimeValidation?.statusLabel || 'Chờ'}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {!activeRecord ? (
                  <span>
                    {SHIFT_DEFINITIONS[selectedShift].name} mở check-in:{' '}
                    <strong className="font-mono text-emerald-800">
                      {checkInTimeValidation.windowStartStr} – {checkInTimeValidation.windowEndStr}
                    </strong>
                  </span>
                ) : (
                  <span>
                    {SHIFT_DEFINITIONS[activeRecord.shiftType].name} mở check-out:{' '}
                    <strong className="font-mono text-emerald-800">
                      {checkOutTimeValidation?.windowStartStr} – {checkOutTimeValidation?.windowEndStr}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Condition 3: GPS Radius */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start space-x-3 transition-all ${
              gpsValidation.isValid
                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                : 'bg-rose-50/70 border-rose-300 shadow-2xs'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                gpsValidation.isValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              <Navigation className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  3. Định Vị GPS Quán (±50m)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    gpsValidation.isValid
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {gpsValidation.isValid ? '✓ Có Mặt Tại Quán' : '✗ Ngoài Bán Kính'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">
                Khoảng cách: <span className={gpsValidation.isValid ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>{gpsValidation.distanceMeters}m</span> / {gpsValidation.radiusMeters}m
              </div>
            </div>
          </div>

          {/* Condition 4: Device Code */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start space-x-3 transition-all ${
              deviceValidation.isValid
                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                : 'bg-rose-50/70 border-rose-300 shadow-2xs'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                deviceValidation.isValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">4. Khóa Thiết Bị</span>
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
                    ? 'Khóa máy lần đầu'
                    : deviceValidation.isValid
                    ? '✓ Khớp Điện Thoại'
                    : '✗ Sai Điện Thoại'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">
                Mã máy: <strong className="text-emerald-800">{currentDeviceId}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Thực Hiện Chấm Công
              </h3>
              {activeRecord && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse">
                  ● Đang trong ca trực
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
                    const win = SHIFT_TIME_WINDOWS[type];
                    const selected = selectedShift === type;
                    const isAssigned = shiftAssignmentValidation.assignedShiftsToday.includes(type);

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedShift(type)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                          selected
                            ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-md scale-[1.02]'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isAssigned && (
                          <span className={`absolute -top-1.5 -right-1 text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs ${
                            selected ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                          }`}>
                            ĐƯỢC CHIA
                          </span>
                        )}
                        <div className="text-xs font-bold">{def.name}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${selected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {def.timeRange}
                        </div>
                        <div className={`text-[9px] font-mono mt-1 ${selected ? 'text-emerald-200 font-bold' : 'text-emerald-700'}`}>
                          Mở: {win.checkInWindowText.split(' ')[0]}
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
                    placeholder="VD: Đến sớm chuẩn bị quầy, bàn giao ca..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* If checked in, show current status */}
            {activeRecord && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="text-xs text-emerald-900">
                  Bạn đã Check-in ca <span className="font-bold">{SHIFT_DEFINITIONS[activeRecord.shiftType].name}</span> lúc:
                </div>
                <div className="text-2xl font-black font-mono text-emerald-800">
                  {activeRecord.checkInTime}
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  Khung giờ Check-out cho phép: <strong className="text-emerald-800">{checkOutTimeValidation?.windowStartStr} – {checkOutTimeValidation?.windowEndStr}</strong>
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
                disabled={!canCheckOut}
                className={`w-full py-3.5 font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 ${
                  canCheckOut
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {canCheckOut
                    ? 'Xác Nhận Check-out (Tính 5.0h Công)'
                    : `Chưa Đến Giờ Check-out (Mở Lúc ${checkOutTimeValidation?.windowStartStr})`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePerformCheckIn}
                disabled={!canCheckIn}
                className={`w-full py-3.5 font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 ${
                  canCheckIn
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {canCheckIn
                    ? 'Xác Nhận Check-in Ca Làm (Tính Công Chuẩn)'
                    : !shiftAssignmentValidation.isAssigned
                    ? 'Chưa Được Chia Ca Này (Không Tính Công)'
                    : !checkInTimeValidation.isValid
                    ? `Ngoài Khung Giờ (Cho Phép: ${checkInTimeValidation.windowStartStr} - ${checkInTimeValidation.windowEndStr})`
                    : !gpsValidation.isValid
                    ? `Chưa Hợp Lệ (Cách Quán ${gpsValidation.distanceMeters}m)`
                    : 'Chưa Khớp Thiết Bị Đăng Ký'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
