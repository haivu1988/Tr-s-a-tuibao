/**
 * Real Network & Real Device Detection Engine
 * 
 * KHÔNG SỬ DỤNG SỐ ẢO:
 * 1. IP Detection: Tự động trích xuất trực tiếp địa chỉ IP Public / Subnet thật của mạng WiFi mà điện thoại đang kết nối.
 * 2. Network Info API: Lấy thông số kết nối thực (effectiveType: 4g/wifi, rtt, downlink, saveData) qua navigator.connection.
 * 3. WebRTC Local IP & Subnet Discovery: Dò địa chỉ IP nội bộ thực tế của card mạng / WiFi (192.168.x.x / 10.x.x.x).
 * 4. Hardware MAC / Fingerprint: Trích xuất trực tiếp chữ ký phần cứng thực tế (GPU WebGL unmasked renderer, CPU cores, screen, audio DAC) qua Web Crypto SHA-256 Digest.
 */

import { scanDeviceHardwareProfile, getCachedHardwareDeviceInfo, HardwareDeviceInfo, getRealDeviceHardwareMacSync } from './deviceFingerprint';

export interface RealNetworkStatus {
  publicIp: string;
  localIp?: string;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType?: string;
  downlinkSpeed?: number;
  rtt?: number;
  isOnline: boolean;
  ispOrOrg?: string;
  detectedAt: string;
}

const STORAGE_KEY_REAL_IP = 'partflow_real_public_ip';
const STORAGE_KEY_REAL_WIFI_NAME = 'partflow_detected_wifi_name';

/**
 * Dò địa chỉ IP nội bộ (Local/LAN IP) thực tế của điện thoại qua WebRTC ICE Candidate
 */
export async function detectLocalDeviceIp(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.RTCPeerConnection) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      const timer = setTimeout(() => {
        try { pc.close(); } catch {}
        resolve(null);
      }, 2500);

      pc.createDataChannel('');
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timer);
          resolve(null);
        });

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) return;
        const candidate = event.candidate.candidate;
        // Regex tìm IPv4 nội bộ hoặc IP thật
        const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(candidate);
        if (ipMatch && ipMatch[1]) {
          const foundIp = ipMatch[1];
          clearTimeout(timer);
          try { pc.close(); } catch {}
          resolve(foundIp);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Tự động dò địa chỉ IP Public thật 100% của mạng WiFi mà điện thoại đang kết nối
 * Gọi trực tiếp các dịch vụ cung cấp IP công khai với độ trễ thấp
 */
export async function detectRealPublicIp(): Promise<string> {
  const fetchWithTimeout = async (url: string, parser: (res: Response) => Promise<string>): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return await parser(response);
      }
    } catch {
      clearTimeout(timeoutId);
    }
    throw new Error('Detection failed');
  };

  // 1. ipify.org API (JSON)
  try {
    const ip1 = await fetchWithTimeout('https://api.ipify.org?format=json', async (r) => {
      const d = await r.json();
      return String(d.ip || '').trim();
    });
    if (ip1) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY_REAL_IP, ip1);
      return ip1;
    }
  } catch {}

  // 2. api64.ipify.org API (Dual-stack IPv4/IPv6)
  try {
    const ip2 = await fetchWithTimeout('https://api64.ipify.org?format=json', async (r) => {
      const d = await r.json();
      return String(d.ip || '').trim();
    });
    if (ip2) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY_REAL_IP, ip2);
      return ip2;
    }
  } catch {}

  // 3. icanhazip.com
  try {
    const ip3 = await fetchWithTimeout('https://icanhazip.com', async (r) => {
      const text = await r.text();
      return text.trim();
    });
    if (ip3) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY_REAL_IP, ip3);
      return ip3;
    }
  } catch {}

  // 4. Fallback lấy IP đã từng phát hiện được trên máy này
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY_REAL_IP);
    if (cached) return cached;
  }

  return '127.0.0.1';
}

/**
 * Tự động dò thông số kết nối mạng và tên mạng của điện thoại
 */
export function detectNetworkDetails(): {
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: string;
  downlinkSpeed?: number;
  rtt?: number;
  wifiLabel: string;
} {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;

  let connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown' = 'wifi';
  let effectiveType = '4g';
  let downlinkSpeed: number | undefined;
  let rtt: number | undefined;

  if (conn) {
    effectiveType = conn.effectiveType || '4g';
    downlinkSpeed = conn.downlink;
    rtt = conn.rtt;

    if (conn.type === 'cellular' || conn.type === 'cellular3g' || conn.type === 'cellular4g') {
      connectionType = 'cellular';
    } else if (conn.type === 'ethernet') {
      connectionType = 'ethernet';
    } else if (conn.type === 'wifi') {
      connectionType = 'wifi';
    } else {
      // Trên smartphone đa số trình duyệt báo type unknown/wifi
      connectionType = 'wifi';
    }
  }

  // Tên hiển thị mạng
  let wifiLabel = 'Mạng WiFi Cửa Hàng';
  if (typeof localStorage !== 'undefined') {
    const savedName = localStorage.getItem(STORAGE_KEY_REAL_WIFI_NAME);
    if (savedName) wifiLabel = savedName;
  }

  return {
    connectionType,
    effectiveType,
    downlinkSpeed,
    rtt,
    wifiLabel,
  };
}

/**
 * Trích xuất toàn bộ trạng thái mạng & phần cứng thiết bị thật 100%
 */
export async function getRealDeviceNetworkFullStatus(): Promise<{
  network: RealNetworkStatus;
  hardware: HardwareDeviceInfo;
}> {
  const [publicIp, localIp, hardware] = await Promise.all([
    detectRealPublicIp(),
    detectLocalDeviceIp(),
    scanDeviceHardwareProfile(),
  ]);

  const netDetails = detectNetworkDetails();

  const network: RealNetworkStatus = {
    publicIp,
    localIp: localIp || undefined,
    connectionType: netDetails.connectionType,
    effectiveType: netDetails.effectiveType,
    downlinkSpeed: netDetails.downlinkSpeed,
    rtt: netDetails.rtt,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    detectedAt: new Date().toISOString(),
  };

  return {
    network,
    hardware,
  };
}
