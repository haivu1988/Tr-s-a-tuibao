/**
 * GPS Geolocation & Radius Verification Engine
 * 
 * Chuẩn định vị Geolocation API theo tiêu chuẩn W3C / HTML5:
 * 1. Khai thác trực tiếp chip GPS phần cứng điện thoại (A-GPS, 4G/5G, WiFi Triangulation)
 * 2. Công thức Haversine tính khoảng cách hình cầu thực tế chuẩn mét (meters)
 * 3. Kiểm tra bán kính cho phép (30m - 50m quanh toạ độ quán)
 * 4. Chế độ kiểm thử (Simulator Mode) tiện dụng cho môi trường iFrame / Laptop
 */

import { Branch } from '../types';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // Sai số GPS theo mét (vd: ±5m, ±15m)
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface GpsValidationResult {
  isValid: boolean;
  distanceMeters: number;
  radiusMeters: number;
  userLat: number;
  userLng: number;
  accuracyMeters: number;
  status: 'within_radius' | 'out_of_radius' | 'permission_denied' | 'locating' | 'unavailable';
  statusText: string;
  errorMessage?: string;
}

const STORAGE_KEY_LAST_GPS = 'partflow_last_device_gps_coord';
const STORAGE_KEY_GPS_TEST_OFFSET = 'partflow_gps_test_offset_meters';

/**
 * Tính khoảng cách chuẩn xác theo mét giữa 2 toạ độ GPS bằng công thức Haversine
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371000; // Bán kính Trái Đất theo mét
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Làm tròn 1 chữ số thập phân
}

/**
 * Lấy toạ độ GPS chính xác từ phần cứng điện thoại (High Accuracy GPS)
 */
export function getCurrentDeviceGpsPosition(): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ Geolocation GPS'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GeoCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 10),
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp || Date.now(),
        };

        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_LAST_GPS, JSON.stringify(coords));
          }
        } catch {}

        resolve(coords);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true, // Yêu cầu chip GPS hoạt động tối đa
        timeout: 10000,           // Chờ 10 giây
        maximumAge: 0,            // Không dùng cache cũ
      }
    );
  });
}

/**
 * Theo dõi toạ độ GPS thời gian thực (Real-time Live Watch)
 */
export function watchDeviceGpsPosition(
  onPosition: (pos: GeoCoordinates) => void,
  onError: (err: GeolocationPositionError) => void
): number | null {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      const coords: GeoCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy || 10),
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp || Date.now(),
      };
      onPosition(coords);
    },
    (error) => {
      onError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 1000,
    }
  );
}

/**
 * Dừng theo dõi GPS
 */
export function clearGpsWatch(watchId: number | null): void {
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Lấy toạ độ GPS đã lưu gần nhất trong bộ nhớ
 */
export function getCachedDeviceGps(): GeoCoordinates | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_GPS);
    if (raw) return JSON.parse(raw) as GeoCoordinates;
  } catch {}
  return null;
}

/**
 * Xác thực xem toạ độ của nhân viên có nằm trong bán kính quán hay không
 */
export function validateBranchGpsLocation(
  userCoords: GeoCoordinates | null,
  branch: Branch
): GpsValidationResult {
  const branchLat = branch.latitude || 10.77428;
  const branchLng = branch.longitude || 106.70395;
  const radius = branch.radiusMeters || 50;

  if (!userCoords) {
    return {
      isValid: false,
      distanceMeters: 999,
      radiusMeters: radius,
      userLat: 0,
      userLng: 0,
      accuracyMeters: 0,
      status: 'locating',
      statusText: 'Đang định vị toạ độ GPS...',
      errorMessage: 'Chưa lấy được tín hiệu GPS từ điện thoại. Vui lòng bấm Cho phép khi trình duyệt yêu cầu vị trí.',
    };
  }

  const distance = calculateDistanceMeters(
    userCoords.latitude,
    userCoords.longitude,
    branchLat,
    branchLng
  );

  const isValid = distance <= radius;

  if (isValid) {
    return {
      isValid: true,
      distanceMeters: distance,
      radiusMeters: radius,
      userLat: userCoords.latitude,
      userLng: userCoords.longitude,
      accuracyMeters: userCoords.accuracy,
      status: 'within_radius',
      statusText: `✓ Hợp lệ: Bạn đang ở cách quán ${distance}m (Bán kính cho phép ${radius}m)`,
    };
  } else {
    return {
      isValid: false,
      distanceMeters: distance,
      radiusMeters: radius,
      userLat: userCoords.latitude,
      userLng: userCoords.longitude,
      accuracyMeters: userCoords.accuracy,
      status: 'out_of_radius',
      statusText: `✗ Ngoài phạm vi: Bạn đang cách quán ${distance}m (Bán kính cho phép tối đa ${radius}m)`,
      errorMessage: `Bạn đang ở cách quán ${distance}m (vượt quá bán kính cho phép ${radius}m của ${branch.shortName}). Vui lòng di chuyển đến đúng vị trí quán để điểm danh!`,
    };
  }
}

/**
 * Tạo toạ độ giả lập chính xác ở khoảng cách mong muốn quanh quán để hỗ trợ kiểm thử tiện lợi
 */
export function generateOffsetCoordinates(
  baseLat: number,
  baseLng: number,
  distanceMeters: number
): { latitude: number; longitude: number } {
  // 1 độ vĩ độ ~ 111,139 mét
  // 1 độ kinh độ ~ 111,139 * cos(lat)
  const latOffset = distanceMeters / 111139;
  const lngOffset = distanceMeters / (111139 * Math.cos((baseLat * Math.PI) / 180));

  return {
    latitude: baseLat + latOffset * 0.7,
    longitude: baseLng + lngOffset * 0.7,
  };
}
