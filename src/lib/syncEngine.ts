import { User, Branch, ShiftRegistration, ShiftAssignment, AttendanceRecord, RegistrationWeekControl } from '../types';

export interface OnlinePresence {
  userId: string;
  userName: string;
  role: 'manager' | 'staff';
  branchId: string;
  avatar?: string;
  lastSeen: number;
  deviceId?: string;
  isOnline: boolean;
}

export type SyncEventType = 
  | 'PRESENCE_HEARTBEAT'
  | 'SYNC_USERS'
  | 'SYNC_REGISTRATIONS'
  | 'SYNC_ASSIGNMENTS'
  | 'SYNC_ATTENDANCE'
  | 'SYNC_BRANCHES'
  | 'SYNC_REG_CONTROLS'
  | 'USER_LOGOUT'
  | 'QUOTA_STATUS_UPDATE';

export interface SyncMessage {
  type: SyncEventType;
  senderId?: string;
  timestamp: number;
  payload?: any;
}

const SYNC_CHANNEL_NAME = 'partflow_pro_realtime_sync_v1';
const PRESENCE_TIMEOUT_MS = 35000; // 35 seconds without heartbeat = offline

// In-memory presence map
const activePresenceMap = new Map<string, OnlinePresence>();
const presenceListeners = new Set<(presences: OnlinePresence[]) => void>();
const dataListeners = new Set<(event: SyncMessage) => void>();
const quotaListeners = new Set<(isExceeded: boolean, errorMsg?: string) => void>();

let broadcastChannel: BroadcastChannel | null = null;
let heartbeatInterval: any = null;
let cleanupInterval: any = null;
let currentLoggedUser: User | null = null;
let isQuotaExceededState = false;
let quotaErrorMessage = '';

export const FIRESTORE_DATABASE_URL = 'https://console.firebase.google.com/project/gen-lang-client-0390084277/firestore/databases/ai-studio-partflowproqunln-8b26b821-1b44-42e9-87c6-bdfe1f73e52e/data?openUpgradeDialog=true';

/**
 * Initialize BroadcastChannel and Storage event listeners
 */
export function initRealtimeSyncEngine() {
  if (typeof window === 'undefined') return;

  // 1. Setup BroadcastChannel if supported
  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
        handleIncomingSyncMessage(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not available, using localStorage fallback', e);
    }
  }

  // 2. Storage event listener fallback (for multi-tab / window sync)
  window.addEventListener('storage', (event) => {
    if (event.key === 'partflow_realtime_storage_event' && event.newValue) {
      try {
        const msg = JSON.parse(event.newValue) as SyncMessage;
        handleIncomingSyncMessage(msg);
      } catch {
        // ignore
      }
    }
  });

  // 3. Periodic cleanup of stale presence sessions
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [userId, pres] of activePresenceMap.entries()) {
        if (now - pres.lastSeen > PRESENCE_TIMEOUT_MS) {
          activePresenceMap.delete(userId);
          changed = true;
        }
      }
      if (changed) {
        notifyPresenceListeners();
      }
    }, 5000);
  }
}

/**
 * Handle incoming sync messages from other tabs or windows
 */
function handleIncomingSyncMessage(msg: SyncMessage) {
  if (!msg || !msg.type) return;

  if (msg.type === 'PRESENCE_HEARTBEAT' && msg.payload) {
    const p = msg.payload as OnlinePresence;
    activePresenceMap.set(p.userId, {
      ...p,
      lastSeen: Date.now(),
      isOnline: true,
    });
    notifyPresenceListeners();
  } else if (msg.type === 'USER_LOGOUT' && msg.payload?.userId) {
    activePresenceMap.delete(msg.payload.userId);
    notifyPresenceListeners();
  } else if (msg.type === 'QUOTA_STATUS_UPDATE') {
    isQuotaExceededState = !!msg.payload?.isExceeded;
    quotaErrorMessage = msg.payload?.errorMsg || '';
    quotaListeners.forEach((fn) => fn(isQuotaExceededState, quotaErrorMessage));
  } else {
    // Notify data listeners for state hydration
    dataListeners.forEach((fn) => fn(msg));
  }
}

/**
 * Dispatch message to other tabs/windows
 */
export function broadcastSyncMessage(type: SyncEventType, payload?: any) {
  const msg: SyncMessage = {
    type,
    senderId: currentLoggedUser?.id,
    timestamp: Date.now(),
    payload,
  };

  // Dispatch via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(msg);
    } catch {
      // ignore
    }
  }

  // Dispatch via localStorage for cross-window fallback
  try {
    localStorage.setItem('partflow_realtime_storage_event', JSON.stringify(msg));
  } catch {
    // ignore
  }

  // Also process self for presence if applicable
  if (type === 'PRESENCE_HEARTBEAT' && payload) {
    activePresenceMap.set(payload.userId, {
      ...payload,
      lastSeen: Date.now(),
      isOnline: true,
    });
    notifyPresenceListeners();
  }
}

/**
 * Start presence heartbeat for current logged in user
 */
export function startUserPresenceHeartbeat(user: User, deviceId?: string) {
  currentLoggedUser = user;
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  const sendHeartbeat = () => {
    if (!currentLoggedUser) return;
    const presence: OnlinePresence = {
      userId: currentLoggedUser.id,
      userName: currentLoggedUser.name,
      role: currentLoggedUser.role,
      branchId: currentLoggedUser.branchId,
      avatar: currentLoggedUser.avatar,
      lastSeen: Date.now(),
      deviceId: deviceId || currentLoggedUser.registeredDeviceId || undefined,
      isOnline: true,
    };
    broadcastSyncMessage('PRESENCE_HEARTBEAT', presence);
  };

  // Immediate first heartbeat
  sendHeartbeat();
  // Repeat every 10 seconds
  heartbeatInterval = setInterval(sendHeartbeat, 10000);
}

/**
 * Stop user presence heartbeat upon logout
 */
export function stopUserPresenceHeartbeat(userId?: string) {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  const idToRemove = userId || currentLoggedUser?.id;
  if (idToRemove) {
    activePresenceMap.delete(idToRemove);
    broadcastSyncMessage('USER_LOGOUT', { userId: idToRemove });
    notifyPresenceListeners();
  }
  currentLoggedUser = null;
}

/**
 * Subscribe to online presence changes
 */
export function subscribeToOnlinePresence(callback: (presences: OnlinePresence[]) => void) {
  presenceListeners.add(callback);
  callback(Array.from(activePresenceMap.values()));
  return () => {
    presenceListeners.delete(callback);
  };
}

function notifyPresenceListeners() {
  const list = Array.from(activePresenceMap.values());
  presenceListeners.forEach((fn) => fn(list));
}

/**
 * Subscribe to real-time data mutations broadcasted by other tabs/sessions
 */
export function subscribeToDataSync(callback: (event: SyncMessage) => void) {
  dataListeners.add(callback);
  return () => {
    dataListeners.delete(callback);
  };
}

/**
 * Report Quota Status from Firestore
 */
export function reportFirestoreQuotaStatus(isExceeded: boolean, errorMsg?: string) {
  if (isQuotaExceededState !== isExceeded) {
    isQuotaExceededState = isExceeded;
    quotaErrorMessage = errorMsg || '';
    broadcastSyncMessage('QUOTA_STATUS_UPDATE', { isExceeded, errorMsg });
    quotaListeners.forEach((fn) => fn(isExceeded, errorMsg));
  }
}

export function subscribeToQuotaStatus(callback: (isExceeded: boolean, errorMsg?: string) => void) {
  quotaListeners.add(callback);
  callback(isQuotaExceededState, quotaErrorMessage);
  return () => {
    quotaListeners.delete(callback);
  };
}

export function getOnlineUsers(): OnlinePresence[] {
  return Array.from(activePresenceMap.values());
}

export function isUserOnline(userId: string): boolean {
  const p = activePresenceMap.get(userId);
  if (!p) return false;
  return Date.now() - p.lastSeen <= PRESENCE_TIMEOUT_MS;
}
