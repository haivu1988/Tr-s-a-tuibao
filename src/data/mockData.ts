import { 
  Branch, 
  User, 
  WifiStoreConfig, 
  ShiftRegistration, 
  ShiftAssignment, 
  AttendanceRecord, 
  TaskItem 
} from '../types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3822 1234',
    pinnedWifiIp: '118.69.182.45',
    backupWifiIp: '118.69.182.46',
    allowedWifiIps: ['118.69.182.45', '118.69.182.46', '192.168.1.1'],
    pinnedWifiSsid: 'Store_Main_5G',
    backupWifiSsid: 'Store_Staff_WiFi',
    availableWifis: ['Store_Main_5G', 'Store_Staff_WiFi', 'PartFlow_Q1_VIP', 'FPT_Q1_Fiber'],
    managerName: 'Trần Hoàng Nam',
    status: 'active',
  },
  {
    id: 'cn_phunhuan',
    name: 'Chi Nhánh 2 - Phú Nhuận (Phan Xích Long)',
    shortName: 'Phú Nhuận',
    address: '245 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh',
    phone: '028 3995 5678',
    pinnedWifiIp: '14.169.85.120',
    backupWifiIp: '14.169.85.121',
    allowedWifiIps: ['14.169.85.120', '14.169.85.121', '192.168.2.1'],
    pinnedWifiSsid: 'PartFlow_PhuNhuan_5G',
    backupWifiSsid: 'PhuNhuan_Staff_2.4G',
    availableWifis: ['PartFlow_PhuNhuan_5G', 'PhuNhuan_Staff_2.4G', 'Viettel_PN_Store', 'Coffee_PN_Guest'],
    managerName: 'Trần Hoàng Nam',
    status: 'active',
  },
  {
    id: 'cn_thuduc',
    name: 'Chi Nhánh 3 - TP. Thủ Đức (Võ Văn Ngân)',
    shortName: 'Thủ Đức',
    address: '98 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '028 3722 9999',
    pinnedWifiIp: '171.244.33.89',
    backupWifiIp: '171.244.33.90',
    allowedWifiIps: ['171.244.33.89', '171.244.33.90', '192.168.3.1'],
    pinnedWifiSsid: 'PartFlow_ThuDuc_Hub',
    backupWifiSsid: 'ThuDuc_Bar_WiFi',
    availableWifis: ['PartFlow_ThuDuc_Hub', 'ThuDuc_Bar_WiFi', 'VNPT_Fiber_ThuDuc', 'Student_Hub_Free'],
    managerName: 'Trần Hoàng Nam',
    status: 'active',
  },
];

export const INITIAL_USERS: User[] = [
  // Tài khoản Quản Lý Hệ Thống cố định
  {
    id: 'quanly01',
    password: '19021988',
    name: 'Quản Lý Hệ Thống',
    email: 'quanly@partflow.vn',
    phone: '0908 123 456',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    branchId: 'cn_quan1',
    registeredDeviceId: 'MacBook-Pro-Admin',
    hourlyRate: 60000,
    department: 'Ban Quản Lý Chi Nhánh',
    status: 'active',
  },
];

export const INITIAL_WIFI_CONFIG: WifiStoreConfig = {
  primaryIp: '118.69.182.45',
  primarySsid: 'Store_Main_5G',
  secondarySsid: 'Store_Staff_WiFi',
  allowedIps: ['118.69.182.45', '118.69.182.46'],
  allowedBssids: ['74:83:C2:88:1A:F0', '74:83:C2:88:1A:F1'],
  requireExactMatch: true,
  storeName: 'PartFlow Coffee & Tea - Chi Nhánh 1',
  address: '128 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
};

export const CURRENT_WEEK_ID = '2026-W35';

export const INITIAL_REGISTRATIONS: ShiftRegistration[] = [];

export const INITIAL_ASSIGNMENTS: ShiftAssignment[] = [];

export const INITIAL_ATTENDANCE_LOGS: AttendanceRecord[] = [];

// Local storage helper
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
  }
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}
