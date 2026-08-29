import { WifiStoreConfig, User, Branch } from '../types';
import { 
  getRealDeviceHardwareMacSync, 
  scanDeviceHardwareProfile, 
  getCachedHardwareDeviceInfo, 
  HardwareDeviceInfo 
} from './deviceFingerprint';

const STORAGE_KEY_CLIENT_DEVICE = 'partflow_client_device_id';
const STORAGE_KEY_DEVICE_MAC = 'partflow_device_mac_address';
const STORAGE_KEY_SIMULATED_WIFI = 'partflow_simulated_wifi';
const STORAGE_KEY_SIMULATED_IP = 'partflow_simulated_ip';

/**
 * Tự động trích xuất Địa chỉ MAC phần cứng (Hardware MAC Address) từ điện thoại thực tế của nhân viên.
 * Định dạng chuẩn IEEE 802: XX:XX:XX:XX:XX:XX (ví dụ: D8:3B:BF:12:4A:89).
 * Được tính toán dựa trên WebGL GPU Chipset, màn hình, CPU Cores, và Web Cryptography SHA-256 Digest.
 */
export function getDeviceMacAddress(): string {
  return getRealDeviceHardwareMacSync();
}

// Giữ lại hàm tương thích ngược getClientDeviceId
export function getClientDeviceId(): string {
  return getRealDeviceHardwareMacSync();
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
  const cleanMac = newDeviceId.trim().toUpperCase();
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_DEVICE_MAC, cleanMac);
    localStorage.setItem(STORAGE_KEY_CLIENT_DEVICE, cleanMac);
    localStorage.setItem('partflow_hardware_device_mac', cleanMac);
  }
}

export function getSimulatedWifi(): string {
  const current = localStorage.getItem(STORAGE_KEY_SIMULATED_WIFI);
  return current || 'Store_Main_5G';
}

export function setSimulatedWifi(wifiSsid: string): void {
  localStorage.setItem(STORAGE_KEY_SIMULATED_WIFI, wifiSsid);
}

// IP Management & Real Detection
export function getSimulatedIp(): string {
  const current = localStorage.getItem(STORAGE_KEY_SIMULATED_IP);
  return current || '118.69.182.45';
}

export function setSimulatedIp(ip: string): void {
  if (ip && ip.trim()) {
    localStorage.setItem(STORAGE_KEY_SIMULATED_IP, ip.trim());
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
 * Tự động lấy trực tiếp địa chỉ IP mạng WiFi mà điện thoại đang kết nối
 * Gọi đồng thời qua nhiều dịch vụ IP uy tín để đảm bảo luôn lấy được nhanh nhất.
 */
export async function fetchCurrentPublicIp(): Promise<string> {
  const fetchWithTimeout = async (url: string, parser: (res: any) => Promise<string>): Promise<string> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2800);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) {
        return await parser(response);
      }
    } catch {
      clearTimeout(timer);
    }
    throw new Error('Timeout or Failed');
  };

  // Provider 1: ipify (Rất nhanh và chính xác)
  try {
    const ip1 = await fetchWithTimeout('https://api.ipify.org?format=json', async (r) => {
      const d = await r.json();
      return d.ip;
    });
    if (ip1 && isValidIpAddress(ip1)) {
      setSimulatedIp(ip1);
      return ip1;
    }
  } catch {}

  // Provider 2: api64.ipify.org (hỗ trợ cả IPv4 và IPv6)
  try {
    const ip2 = await fetchWithTimeout('https://api64.ipify.org?format=json', async (r) => {
      const d = await r.json();
      return d.ip;
    });
    if (ip2 && isValidIpAddress(ip2)) {
      setSimulatedIp(ip2);
      return ip2;
    }
  } catch {}

  // Provider 3: icanhazip.com (trả về IP dạng raw text)
  try {
    const ip3 = await fetchWithTimeout('https://icanhazip.com', async (r) => {
      const text = await r.text();
      return text.trim();
    });
    if (ip3 && isValidIpAddress(ip3)) {
      setSimulatedIp(ip3);
      return ip3;
    }
  } catch {}

  // Fallback: Trả về IP đã lưu trong bộ nhớ thiết bị
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
  const currentClean = (currentDeviceId || '').trim().toUpperCase();
  const registeredClean = (user.registeredDeviceId || '').trim().toUpperCase();

  if (!registeredClean) {
    // Lần đầu check-in: Địa chỉ MAC máy này sẽ được khóa vĩnh viễn với nhân viên
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
    errorMessage: `Địa chỉ MAC máy hiện tại (${currentClean}) không khớp với địa chỉ MAC máy đã đăng ký (${user.registeredDeviceId}). Mỗi nhân viên chỉ được sử dụng 1 điện thoại cá nhân. Liên hệ Quản lý để reset nếu bạn vừa đổi điện thoại.`,
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
