import { WifiStoreConfig, User, Branch } from '../types';
import { 
  getRealDeviceHardwareKeySync,
  getRealDeviceHardwareMacSync, 
  scanDeviceHardwareProfile, 
  getCachedHardwareDeviceInfo, 
  HardwareDeviceInfo 
} from './deviceFingerprint';
import { 
  detectRealPublicIp, 
  detectLocalDeviceIp, 
  detectNetworkDetails, 
  getRealDeviceNetworkFullStatus 
} from './realDeviceDetection';

const STORAGE_KEY_CLIENT_DEVICE = 'partflow_client_device_id';
const STORAGE_KEY_HW_KEY = 'partflow_hardware_device_key';
const STORAGE_KEY_DETECTED_WIFI = 'partflow_detected_wifi_name';
const STORAGE_KEY_REAL_IP = 'partflow_real_public_ip';

/**
 * Tự động trích xuất Mã Máy Điện Thoại thực tế (Hardware Device Key) từ điện thoại nhân viên.
 * Định dạng: DEV-[THIẾT BỊ]-[4 KÝ TỰ]-[4 KÝ TỰ] (ví dụ: DEV-IPHONE-8F3A-C429, DEV-SAMSUNG-9B21-EE40).
 * Được tính toán dựa trên WebGL GPU Chipset, màn hình, CPU Cores, và Web Cryptography SHA-256 Digest.
 */
export function getDeviceHardwareKey(): string {
  return getRealDeviceHardwareKeySync();
}

export function getDeviceMacAddress(): string {
  return getRealDeviceHardwareKeySync();
}

// Lấy mã máy phần cứng của điện thoại hiện tại
export function getClientDeviceId(): string {
  return getRealDeviceHardwareKeySync();
}

/**
 * Trích xuất toàn bộ thông tin phần cứng sâu của điện thoại (Bất đồng bộ)
 */
export async function getDetailedDeviceHardwareProfile(): Promise<HardwareDeviceInfo> {
  return await scanDeviceHardwareProfile();
}

export function getCachedDeviceHardwareInfo(): HardwareDeviceInfo | null {
  return getCachedHardwareDeviceInfo();
}

export function setClientDeviceId(newDeviceId: string): void {
  const cleanKey = newDeviceId.trim().toUpperCase();
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CLIENT_DEVICE, cleanKey);
    localStorage.setItem(STORAGE_KEY_HW_KEY, cleanKey);
    localStorage.setItem('partflow_device_mac_address', cleanKey);
  }
}

export function getSimulatedWifi(): string {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_DETECTED_WIFI);
    if (saved) return saved;
  }
  return 'Mạng WiFi Cửa Hàng';
}

export function setSimulatedWifi(wifiSsid: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_DETECTED_WIFI, wifiSsid);
  }
}

// IP Management & Real Detection
export function getSimulatedIp(): string {
  if (typeof localStorage !== 'undefined') {
    const realCached = localStorage.getItem(STORAGE_KEY_REAL_IP);
    if (realCached) return realCached;
  }
  return '118.69.182.45';
}

export function setSimulatedIp(ip: string): void {
  if (ip && ip.trim() && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_REAL_IP, ip.trim());
  }
}

// Validate basic IPv4 or IPv6 string
export function isValidIpAddress(ip: string): boolean {
  if (!ip) return false;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip.trim()) || ipv6Regex.test(ip.trim());
}

/**
 * Tự động lấy trực tiếp địa chỉ IP mạng WiFi mà điện thoại đang kết nối thật 100%
 */
export async function fetchCurrentPublicIp(): Promise<string> {
  return await detectRealPublicIp();
}


export interface DeviceValidationResult {
  isValid: boolean;
  isFirstRegistration: boolean;
  registeredDeviceId: string | null;
  currentDeviceId: string;
  errorMessage?: string;
}

export function validateDeviceForUser(user: User, currentDeviceId: string): DeviceValidationResult {
  const currentClean = (currentDeviceId || '').trim().toUpperCase();
  const registeredClean = (user.registeredDeviceId || '').trim().toUpperCase();

  if (!registeredClean) {
    // Lần đầu check-in: Mã máy điện thoại này sẽ được khóa vĩnh viễn với nhân viên
    return {
      isValid: true,
      isFirstRegistration: true,
      registeredDeviceId: null,
      currentDeviceId: currentClean,
    };
  }

  if (registeredClean === currentClean) {
    return {
      isValid: true,
      isFirstRegistration: false,
      registeredDeviceId: user.registeredDeviceId || null,
      currentDeviceId: currentClean,
    };
  }

  return {
    isValid: false,
    isFirstRegistration: false,
    registeredDeviceId: user.registeredDeviceId || null,
    currentDeviceId: currentClean,
    errorMessage: `Mã máy hiện tại (${currentClean}) không khớp với Mã máy đã đăng ký (${user.registeredDeviceId}). Mỗi nhân viên chỉ được sử dụng đúng 1 chiếc điện thoại cá nhân chính chủ. Liên hệ Quản lý để mở khóa nếu bạn vừa đổi điện thoại.`,
  };
}

export interface WifiValidationResult {
  isValid: boolean;
  currentWifi: string;
  allowedWifis: string[];
  errorMessage?: string;
}

export function validateWifi(currentWifi: string, config: WifiStoreConfig): WifiValidationResult {
  const allowed = [config.primarySsid];
  if (config.secondarySsid) {
    allowed.push(config.secondarySsid);
  }

  const isMatch = allowed.some(
    (allowedWifi) => allowedWifi.trim().toLowerCase() === currentWifi.trim().toLowerCase()
  );

  if (isMatch) {
    return {
      isValid: true,
      currentWifi,
      allowedWifis: allowed,
    };
  }

  return {
    isValid: false,
    currentWifi,
    allowedWifis: allowed,
    errorMessage: `WiFi hiện tại "${currentWifi}" không thuộc danh sách WiFi cửa hàng (${allowed.join(' hoặc ')}). Bạn phải kết nối đúng WiFi để chấm công.`,
  };
}

export interface WifiIpValidationResult {
  isValid: boolean;
  currentIp: string;
  pinnedIp: string;
  allowedIps: string[];
  errorMessage?: string;
}

// Kiểm tra địa chỉ IP mạng WiFi của quán so với điện thoại
export function validateBranchWifiIp(currentIp: string, branch?: Branch): WifiIpValidationResult {
  if (!branch) {
    return {
      isValid: true,
      currentIp,
      pinnedIp: currentIp,
      allowedIps: [currentIp],
    };
  }

  const allowedIps = [branch.pinnedWifiIp || '118.69.182.45'];
  if (branch.backupWifiIp) {
    allowedIps.push(branch.backupWifiIp);
  }
  if (Array.isArray(branch.allowedWifiIps)) {
    branch.allowedWifiIps.forEach((ip) => {
      if (ip && !allowedIps.includes(ip)) allowedIps.push(ip);
    });
  }

  const curClean = (currentIp || '').trim();
  const isMatch = allowedIps.some((allowed) => allowed.trim() === curClean);

  if (isMatch) {
    return {
      isValid: true,
      currentIp: curClean,
      pinnedIp: branch.pinnedWifiIp,
      allowedIps,
    };
  }

  return {
    isValid: false,
    currentIp: curClean,
    pinnedIp: branch.pinnedWifiIp,
    allowedIps,
    errorMessage: `Địa chỉ IP WiFi hiện tại (${curClean || 'Chưa xác định'}) không trùng khớp với IP WiFi đã ghim của ${branch.shortName} (${branch.pinnedWifiIp}). Vui lòng kết nối đúng mạng WiFi của quán.`,
  };
}
