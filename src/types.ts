export type Role = 'manager' | 'staff';

export interface Branch {
  id: string; // e.g. 'cn_quan1', 'cn_phunhuan', 'cn_thuduc'
  name: string; // 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)'
  shortName: string; // 'Quận 1'
  address: string; // '128 Nguyễn Huệ, P. Bến Nghé, Q. 1, TP. HCM'
  phone: string; // '028 3822 1234'
  latitude: number; // Tọa độ Vĩ độ GPS của chi nhánh (vd: 10.77428)
  longitude: number; // Tọa độ Kinh độ GPS của chi nhánh (vd: 106.70395)
  radiusMeters: number; // Bán kính GPS cho phép chấm công quanh quán (vd: 50m, 30m - 100m)
  pinnedWifiIp: string; // Địa chỉ IP WiFi quán được ghim chính thức để chấm công (vd: 118.69.182.45)
  backupWifiIp?: string; // Địa chỉ IP WiFi phụ
  allowedWifiIps: string[]; // Danh sách các IP WiFi hợp lệ của chi nhánh
  pinnedWifiSsid: string; // WiFi SSID được ghim để chấm công
  backupWifiSsid?: string; // WiFi phụ
  availableWifis: string[]; // Danh sách các WiFi quét được tại chi nhánh để chọn ghim
  managerName?: string;
  status: 'active' | 'inactive';
}

export interface User {
  id: string; // Tên đăng nhập / ID người dùng (e.g. quanly01, tuan123)
  password?: string; // Mật khẩu đăng nhập
  name: string; // Họ và tên
  phone: string; // Số điện thoại
  email?: string; // Email (tùy chọn)
  role: Role;
  avatar: string;
  branchId: string; // Chi nhánh trực thuộc (e.g. 'cn_quan1')
  registeredDeviceId?: string | null; // Device ID registered on first check-in, only manager can reset
  hourlyRate: number; // VND per hour
  department?: string;
  status: 'active' | 'inactive';
}

export type ShiftType = 'morning' | 'afternoon' | 'evening';

export interface ShiftDefinition {
  id: ShiftType;
  name: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  durationHours: number;
}

export const SHIFT_DEFINITIONS: Record<ShiftType, ShiftDefinition> = {
  morning: {
    id: 'morning',
    name: 'Ca Sáng',
    timeRange: '08:00 - 13:00',
    startHour: 8,
    endHour: 13,
    durationHours: 5,
  },
  afternoon: {
    id: 'afternoon',
    name: 'Ca Chiều',
    timeRange: '13:00 - 18:00',
    startHour: 13,
    endHour: 18,
    durationHours: 5,
  },
  evening: {
    id: 'evening',
    name: 'Ca Tối',
    timeRange: '18:00 - 23:00',
    startHour: 18,
    endHour: 23,
    durationHours: 5,
  },
};

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayInfo {
  key: DayOfWeek;
  label: string;
  shortLabel: string;
  solarOffsetDays: number; // 0 for Mon, 1 for Tue, ..., 6 for Sun
}

export const DAYS_OF_WEEK: DayInfo[] = [
  { key: 'mon', label: 'Thứ 2', shortLabel: 'T2', solarOffsetDays: 0 },
  { key: 'tue', label: 'Thứ 3', shortLabel: 'T3', solarOffsetDays: 1 },
  { key: 'wed', label: 'Thứ 4', shortLabel: 'T4', solarOffsetDays: 2 },
  { key: 'thu', label: 'Thứ 5', shortLabel: 'T5', solarOffsetDays: 3 },
  { key: 'fri', label: 'Thứ 6', shortLabel: 'T6', solarOffsetDays: 4 },
  { key: 'sat', label: 'Thứ 7', shortLabel: 'T7', solarOffsetDays: 5 },
  { key: 'sun', label: 'Chủ Nhật', shortLabel: 'CN', solarOffsetDays: 6 },
];

export interface ShiftRegistration {
  id: string;
  userId: string;
  branchId: string; // Chi nhánh đăng ký ca
  weekId: string; // e.g. "2026-W35" (Dương lịch)
  day: DayOfWeek;
  shiftType: ShiftType;
  solarDate?: string; // YYYY-MM-DD
  createdAt: string;
}

export interface ShiftAssignment {
  id: string;
  branchId: string; // Chi nhánh áp dụng lịch chia ca
  weekId: string; // e.g. "2026-W35" (Dương lịch)
  day: DayOfWeek;
  shiftType: ShiftType;
  solarDate?: string; // YYYY-MM-DD (Dương lịch)
  assignedUserIds: string[]; // Minimum 2 for operation
  status: 'pending' | 'approved';
  notes?: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  branchId: string; // Chi nhánh chấm công
  branchName?: string;
  date: string; // YYYY-MM-DD (Dương lịch)
  solarDateFormatted?: string; // e.g. "24/08/2026"
  day: DayOfWeek;
  shiftType: ShiftType;
  checkInTime: string; // ISO or HH:mm
  checkOutTime?: string | null;
  // GPS Geolocation fields
  checkInLat?: number; // Tọa độ vĩ độ thực tế khi bấm chấm công
  checkInLng?: number; // Tọa độ kinh độ thực tế khi bấm chấm công
  checkInAccuracy?: number; // Độ chính xác GPS (mét)
  checkInDistanceMeters?: number; // Khoảng cách thực tế tới quán (mét)
  isGpsValid: boolean; // Đúng trong bán kính cho phép (30m - 50m)
  // Device ID & Fingerprint fields
  deviceId: string;
  isDeviceIdValid: boolean;
  deviceInfo?: string; // Tên dòng máy (vd: iPhone 15 Pro, Samsung Galaxy S24)
  // WiFi backup info
  wifiIp?: string; // Địa chỉ IP WiFi lúc chấm công (vd: 118.69.182.45)
  pinnedWifiIp?: string; // Địa chỉ IP WiFi được ghim của quán
  isIpValid?: boolean; // Khớp địa chỉ IP WiFi quán
  wifiSsid?: string;
  pinnedWifiSsid?: string;
  isWifiValid?: boolean;
  // Shift assignment and time window verification (±30 mins rule & assigned shifts only)
  isShiftAssigned?: boolean; // Đúng ca được chia trong lịch
  isTimeWindowValid?: boolean; // Khung giờ check-in/out hợp lệ (sớm/trễ tối đa 30p)
  checkInStatusLabel?: string;
  checkOutStatusLabel?: string;
  status: 'on-time' | 'late' | 'early-leave' | 'completed' | 'missed';
  workDurationHours?: number;
  notes?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  assignedToShift?: ShiftType;
  date: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  status: 'todo' | 'in-progress' | 'completed';
  createdBy: string;
  createdAt: string;
  checklists: { id: string; text: string; done: boolean }[];
}

export interface WifiStoreConfig {
  primaryIp?: string;
  primarySsid: string;
  secondarySsid?: string;
  allowedIps?: string[];
  allowedBssids: string[];
  requireExactMatch: boolean;
  storeName: string;
  address: string;
}

export interface RegistrationWeekControl {
  weekId: string; // e.g. "2026-W35"
  isOpen: boolean; // true = opened by manager, false = closed
  openedAt?: string;
  closedAt?: string;
  openedBy?: string;
  branchId?: string; // Tùy chọn theo chi nhánh hoặc chung
  notes?: string;
}
