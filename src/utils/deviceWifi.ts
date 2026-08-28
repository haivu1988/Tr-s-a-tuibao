import { WifiStoreConfig, User, Branch } from '../types';

const STORAGE_KEY_CLIENT_DEVICE = 'partflow_client_device_id';
const STORAGE_KEY_SIMULATED_WIFI = 'partflow_simulated_wifi';
const STORAGE_KEY_SIMULATED_IP = 'partflow_simulated_ip';

// Generate a realistic device identifier if not present
export function getClientDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEY_CLIENT_DEVICE);
  if (!deviceId) {
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const deviceType = /iPhone|iPad/i.test(navigator.userAgent)
      ? 'iPhone'
      : /Android/i.test(navigator.userAgent)
      ? 'Galaxy'
      : 'Device';
    deviceId = `${deviceType}-${randomHex}-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(STORAGE_KEY_CLIENT_DEVICE, deviceId);
  }
  return deviceId;
}

export function setClientDeviceId(newDeviceId: string): void {
  localStorage.setItem(STORAGE_KEY_CLIENT_DEVICE, newDeviceId.trim());
}

export function getSimulatedWifi(): string {
  const current = localStorage.getItem(STORAGE_KEY_SIMULATED_WIFI);
  return current || 'Store_Main_5G';
}

export function setSimulatedWifi(wifiSsid: string): void {
  localStorage.setItem(STORAGE_KEY_SIMULATED_WIFI, wifiSsid);
}

// IP Management & Simulation
export function getSimulatedIp(): string {
  const current = localStorage.getItem(STORAGE_KEY_SIMULATED_IP);
  return current || '118.69.182.45';
}

export function setSimulatedIp(ip: string): void {
  localStorage.setItem(STORAGE_KEY_SIMULATED_IP, ip.trim());
}

// Validate basic IPv4 or IPv6 string
export function isValidIpAddress(ip: string): boolean {
  if (!ip) return false;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip.trim()) || ipv6Regex.test(ip.trim());
}

// Fetch real public client IP from ipify with timeout and graceful fallback
export async function fetchCurrentPublicIp(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) return data.ip;
    }
  } catch {
    // Fallback if network blocked or offline
  }
  return getSimulatedIp();
}

export interface DeviceValidationResult {
  isValid: boolean;
  isFirstRegistration: boolean;
  registeredDeviceId: string | null;
  currentDeviceId: string;
  errorMessage?: string;
}

export function validateDeviceForUser(user: User, currentDeviceId: string): DeviceValidationResult {
  if (!user.registeredDeviceId) {
    // First time check-in: this device ID will be locked to this employee
    return {
      isValid: true,
      isFirstRegistration: true,
      registeredDeviceId: null,
      currentDeviceId,
    };
  }

  if (user.registeredDeviceId === currentDeviceId) {
    return {
      isValid: true,
      isFirstRegistration: false,
      registeredDeviceId: user.registeredDeviceId,
      currentDeviceId,
    };
  }

  return {
    isValid: false,
    isFirstRegistration: false,
    registeredDeviceId: user.registeredDeviceId,
    currentDeviceId,
    errorMessage: `Mã máy (${currentDeviceId}) không khớp với mã máy đã đăng ký (${user.registeredDeviceId}). Chỉ Quản lý mới có quyền Reset mã máy.`,
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

// Validate IP for a specific branch
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
