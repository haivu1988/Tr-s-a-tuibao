import React, { useState, useEffect } from 'react';
import { 
  User, 
  Branch,
  WifiStoreConfig, 
  ShiftAssignment, 
  ShiftRegistration, 
  AttendanceRecord, 
  DayOfWeek, 
  ShiftType,
  RegistrationWeekControl
} from './types';
import { 
  INITIAL_BRANCHES, 
  INITIAL_USERS, 
  INITIAL_WIFI_CONFIG, 
  INITIAL_REGISTRATIONS, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_ATTENDANCE_LOGS, 
  INITIAL_REGISTRATION_CONTROLS,
  CURRENT_WEEK_ID, 
  loadFromStorage, 
  saveToStorage 
} from './data/mockData';
import { getCurrentSolarWeekId } from './utils/solarCalendar';
import { 
  getClientDeviceId, 
  getSimulatedWifi, 
  setClientDeviceId, 
  setSimulatedWifi,
  getSimulatedIp,
  setSimulatedIp,
  fetchCurrentPublicIp,
  getDeviceMacAddress
} from './utils/deviceWifi';
import {
  initializeFirestoreDefaults,
  subscribeBranches,
  subscribeUsers,
  subscribeRegistrations,
  subscribeAssignments,
  subscribeAttendance,
  subscribeRegistrationControls,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveBranchToFirestore,
  deleteBranchFromFirestore,
  saveShiftRegistrationToFirestore,
  saveBatchRegistrationsToFirestore,
  saveShiftAssignmentToFirestore,
  saveBatchAssignmentsToFirestore,
  saveAttendanceRecordToFirestore,
  updateAttendanceRecordInFirestore,
  saveRegistrationWeekControlToFirestore
} from './lib/firebase';
import {
  initRealtimeSyncEngine,
  startUserPresenceHeartbeat,
  stopUserPresenceHeartbeat,
  subscribeToOnlinePresence,
  subscribeToDataSync,
  subscribeToQuotaStatus,
  broadcastSyncMessage,
  OnlinePresence,
  FIRESTORE_DATABASE_URL
} from './lib/syncEngine';
import { AlertTriangle, ExternalLink, RefreshCw, X } from 'lucide-react';

// Layout components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';

// Manager views
import { ManagerDashboardView } from './components/manager/ManagerDashboardView';
import { ManagerStaffView } from './components/manager/ManagerStaffView';
import { ManagerScheduleView } from './components/manager/ManagerScheduleView';
import { ManagerAttendanceView } from './components/manager/ManagerAttendanceView';
import { ManagerReportsView } from './components/manager/ManagerReportsView';

// Manager modals
import { AutoScheduleModal } from './components/manager/AutoScheduleModal';
import { ShiftEditModal } from './components/manager/ShiftEditModal';
import { WifiSettingsModal } from './components/manager/WifiSettingsModal';
import { BranchManagementModal } from './components/manager/BranchManagementModal';

// Staff views
import { StaffDashboardView } from './components/staff/StaffDashboardView';
import { StaffCheckInView } from './components/staff/StaffCheckInView';
import { StaffRegisterView } from './components/staff/StaffRegisterView';
import { StaffScheduleView } from './components/staff/StaffScheduleView';
import { StaffReportsView } from './components/staff/StaffReportsView';

// Staff modals & Auth
import { CheckInModal } from './components/staff/CheckInModal';
import { AvatarModal } from './components/staff/AvatarModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthScreen } from './components/auth/AuthScreen';

const STORAGE_KEY_BRANCHES = 'partflow_branches_prod_v1';
const STORAGE_KEY_ACTIVE_BRANCH = 'partflow_active_branch_prod_v1';
const STORAGE_KEY_USERS = 'partflow_users_prod_v1';
const STORAGE_KEY_WIFI = 'partflow_wifi_config_prod_v1';
const STORAGE_KEY_REGS = 'partflow_registrations_prod_v1';
const STORAGE_KEY_ASSIGNMENTS = 'partflow_assignments_prod_v1';
const STORAGE_KEY_ATTENDANCE = 'partflow_attendance_prod_v1';
const STORAGE_KEY_REG_CONTROLS = 'partflow_reg_controls_prod_v1';
const STORAGE_KEY_CURRENT_USER = 'partflow_current_user_prod_v1';

export default function App() {
  // Branch State Initialization
  const [branches, setBranches] = useState<Branch[]>(() => {
    const loaded = loadFromStorage<Branch[]>(STORAGE_KEY_BRANCHES, INITIAL_BRANCHES);
    if (!Array.isArray(loaded) || loaded.length === 0) return INITIAL_BRANCHES;
    return loaded;
  });

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    const saved = loadFromStorage<string>(STORAGE_KEY_ACTIVE_BRANCH, 'cn_quan1');
    const list = loadFromStorage<Branch[]>(STORAGE_KEY_BRANCHES, INITIAL_BRANCHES);
    const validList = Array.isArray(list) && list.length > 0 ? list : INITIAL_BRANCHES;
    if (validList.some((b) => b.id === saved)) return saved;
    return validList[0]?.id || 'cn_quan1';
  });

  // State Initialization with local storage persistence & quanly01 safeguard
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadFromStorage<User[]>(STORAGE_KEY_USERS, INITIAL_USERS);
    const hasQuanLy01 = Array.isArray(loaded) && loaded.some((u) => u.id === 'quanly01');
    if (!hasQuanLy01) {
      const fixedManager: User = {
        id: 'quanly01',
        password: '19021988',
        name: 'Quản Lý Hệ Thống',
        email: 'quanly@partflow.vn',
        phone: '0908 123 456',
        role: 'manager',
        branchId: 'cn_quan1',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        registeredDeviceId: 'MacBook-Pro-Admin',
        hourlyRate: 60000,
        department: 'Ban Quản Lý Chi Nhánh',
        status: 'active',
      };
      return [fixedManager, ...(Array.isArray(loaded) ? loaded.filter((u) => u.id !== 'usr_manager' && !u.id.startsWith('usr_')) : [])];
    }
    return loaded;
  });

  // Always start at null so the Login / Register screen is ALWAYS the first screen when entering the app
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [wifiConfig, setWifiConfig] = useState<WifiStoreConfig>(() =>
    loadFromStorage(STORAGE_KEY_WIFI, INITIAL_WIFI_CONFIG)
  );

  const [weekId, setWeekId] = useState<string>(() => getCurrentSolarWeekId());

  const [registrations, setRegistrations] = useState<ShiftRegistration[]>(() =>
    loadFromStorage(STORAGE_KEY_REGS, INITIAL_REGISTRATIONS)
  );

  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() =>
    loadFromStorage(STORAGE_KEY_ASSIGNMENTS, INITIAL_ASSIGNMENTS)
  );

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(() =>
    loadFromStorage(STORAGE_KEY_ATTENDANCE, INITIAL_ATTENDANCE_LOGS)
  );

  const [registrationControls, setRegistrationControls] = useState<RegistrationWeekControl[]>(() =>
    loadFromStorage(STORAGE_KEY_REG_CONTROLS, INITIAL_REGISTRATION_CONTROLS)
  );

  // Real-time Online Presence & Quota States
  const [onlinePresences, setOnlinePresences] = useState<OnlinePresence[]>([]);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [showQuotaBanner, setShowQuotaBanner] = useState<boolean>(true);

  // Initialize Real-time Sync Engine & Cross-tab Event Listeners
  useEffect(() => {
    initRealtimeSyncEngine();

    const unsubPresence = subscribeToOnlinePresence((list) => {
      setOnlinePresences(list);
    });

    const unsubQuota = subscribeToQuotaStatus((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });

    const unsubDataSync = subscribeToDataSync((msg) => {
      if (msg.type === 'SYNC_USERS' && msg.payload) {
        setUsers(msg.payload);
        if (currentUser) {
          const fresh = (msg.payload as User[]).find((u) => u.id === currentUser.id);
          if (fresh) setCurrentUser(fresh);
        }
      } else if (msg.type === 'SYNC_REGISTRATIONS' && msg.payload) {
        setRegistrations(msg.payload);
      } else if (msg.type === 'SYNC_ASSIGNMENTS' && msg.payload) {
        setAssignments(msg.payload);
      } else if (msg.type === 'SYNC_ATTENDANCE' && msg.payload) {
        setAttendanceLogs(msg.payload);
      } else if (msg.type === 'SYNC_BRANCHES' && msg.payload) {
        setBranches(msg.payload);
      } else if (msg.type === 'SYNC_REG_CONTROLS' && msg.payload) {
        setRegistrationControls(msg.payload);
      }
    });

    return () => {
      unsubPresence();
      unsubQuota();
      unsubDataSync();
    };
  }, [currentUser]);

  // Firestore Real-Time Subscriptions Setup
  useEffect(() => {
    // 1. Initialize DB defaults if first run
    initializeFirestoreDefaults();

    // 2. Subscribe to Firestore Collections Realtime
    const unsubBranches = subscribeBranches((cloudBranches) => {
      if (cloudBranches && cloudBranches.length > 0) {
        setBranches(cloudBranches);
      }
    });

    const unsubUsers = subscribeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        // Sync currentUser if updated on server
        if (currentUser) {
          const freshCurrent = cloudUsers.find((u) => u.id === currentUser.id);
          if (freshCurrent) {
            setCurrentUser(freshCurrent);
          }
        }
      }
    });

    const unsubRegs = subscribeRegistrations((cloudRegs) => {
      setRegistrations(cloudRegs);
    });

    const unsubAssignments = subscribeAssignments((cloudAssignments) => {
      setAssignments(cloudAssignments);
    });

    const unsubAttendance = subscribeAttendance((cloudLogs) => {
      setAttendanceLogs(cloudLogs);
    });

    const unsubRegControls = subscribeRegistrationControls((cloudControls) => {
      if (cloudControls && cloudControls.length > 0) {
        setRegistrationControls(cloudControls);
      }
    });

    return () => {
      unsubBranches();
      unsubUsers();
      unsubRegs();
      unsubAssignments();
      unsubAttendance();
      unsubRegControls();
    };
  }, []);

  // Clear legacy stored session from localStorage on initial load
  useEffect(() => {
    try {
      localStorage.removeItem('partflow_current_user_prod_v1');
      localStorage.removeItem('partflow_current_user_v3');
      localStorage.removeItem('partflow_current_user_v2');
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } catch {
      // ignore
    }
  }, []);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    return currentUser?.role === 'manager' ? 'dashboard' : 'staff_dashboard';
  });

  // Mobile drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Device & WiFi Simulation state
  const [currentSimulatedWifi, setCurrentSimulatedWifiState] = useState<string>(() =>
    getSimulatedWifi()
  );
  const [currentSimulatedIp, setCurrentSimulatedIpState] = useState<string>(() =>
    getSimulatedIp()
  );
  const [currentDeviceId, setCurrentDeviceIdState] = useState<string>(() =>
    getClientDeviceId()
  );

  // Tự động nhận diện địa chỉ IP thực tế của mạng WiFi điện thoại đang kết nối
  useEffect(() => {
    fetchCurrentPublicIp().then((realIp) => {
      if (realIp) {
        setCurrentSimulatedIpState(realIp);
      }
    });
  }, []);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [isAutoScheduleModalOpen, setIsAutoScheduleModalOpen] = useState<boolean>(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState<boolean>(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [shiftEditState, setShiftEditState] = useState<{ isOpen: boolean; assignment: ShiftAssignment | null }>({
    isOpen: false,
    assignment: null,
  });

  // Save changes to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEY_BRANCHES, branches);
  }, [branches]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_ACTIVE_BRANCH, activeBranchId);
  }, [activeBranchId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_USERS, users);
  }, [users]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_WIFI, wifiConfig);
  }, [wifiConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_REGS, registrations);
  }, [registrations]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_ASSIGNMENTS, assignments);
  }, [assignments]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_ATTENDANCE, attendanceLogs);
  }, [attendanceLogs]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_REG_CONTROLS, registrationControls);
  }, [registrationControls]);

  // Heartbeat presence lifecycle for current logged in user
  useEffect(() => {
    if (currentUser) {
      startUserPresenceHeartbeat(currentUser, currentDeviceId);
    } else {
      stopUserPresenceHeartbeat();
    }
    return () => {
      stopUserPresenceHeartbeat();
    };
  }, [currentUser, currentDeviceId]);

  // Handler to toggle shift registration week open / close status
  const handleToggleRegistrationWeek = async (targetWeekId: string, isOpen: boolean) => {
    const existing = registrationControls.find((c) => c.weekId === targetWeekId);
    const updatedControl: RegistrationWeekControl = {
      weekId: targetWeekId,
      isOpen,
      openedAt: isOpen ? new Date().toISOString() : (existing?.openedAt || new Date().toISOString()),
      ...(existing?.closedAt ? { closedAt: existing.closedAt } : {}),
      ...(!isOpen ? { closedAt: new Date().toISOString() } : {}),
      openedBy: currentUser?.name || 'Quản Lý Hệ Thống',
      branchId: activeBranchId,
      notes: isOpen ? `Mở đăng ký ca cho ${targetWeekId}` : `Đóng đăng ký ca cho ${targetWeekId}`,
    };

    const nextControls = [
      ...registrationControls.filter((c) => c.weekId !== targetWeekId),
      updatedControl,
    ];

    setRegistrationControls(nextControls);
    saveToStorage(STORAGE_KEY_REG_CONTROLS, nextControls);
    broadcastSyncMessage('SYNC_REG_CONTROLS', nextControls);
    await saveRegistrationWeekControlToFirestore(updatedControl);
  };

  // Sync simulator changes
  const handleChangeSimulatedWifi = (ssid: string) => {
    setCurrentSimulatedWifiState(ssid);
    setSimulatedWifi(ssid);
  };

  const handleChangeSimulatedIp = (newIp: string) => {
    setCurrentSimulatedIpState(newIp);
    setSimulatedIp(newIp);
  };

  const handleChangeDeviceId = (newId: string) => {
    setCurrentDeviceIdState(newId);
    setClientDeviceId(newId);
  };

  // Branch Handlers
  const handleSelectBranch = (branchId: string) => {
    setActiveBranchId(branchId);
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      // Automatically switch simulated WiFi to the branch's pinned WiFi for convenient testing
      handleChangeSimulatedWifi(branch.pinnedWifiSsid);
    }
  };

  const handleSaveBranch = (savedBranch: Branch) => {
    setBranches((prev) => {
      const exists = prev.some((b) => b.id === savedBranch.id);
      const updatedList = exists
        ? prev.map((b) => (b.id === savedBranch.id ? savedBranch : b))
        : [...prev, savedBranch];
      broadcastSyncMessage('SYNC_BRANCHES', updatedList);
      return updatedList;
    });
    saveBranchToFirestore(savedBranch);
  };

  const handleDeleteBranch = (branchIdToDelete: string) => {
    if (branches.length <= 1) {
      alert('Hệ thống phải có ít nhất 1 chi nhánh hoạt động!');
      return;
    }
    const remainingBranches = branches.filter((b) => b.id !== branchIdToDelete);
    const fallbackBranchId = remainingBranches[0].id;

    // Move any staff from deleted branch to fallback branch
    setUsers((prev) => {
      const updatedUsers = prev.map((u) => {
        if (u.branchId === branchIdToDelete) {
          const updated = { ...u, branchId: fallbackBranchId };
          saveUserToFirestore(updated);
          return updated;
        }
        return u;
      });
      broadcastSyncMessage('SYNC_USERS', updatedUsers);
      return updatedUsers;
    });

    setBranches(remainingBranches);
    broadcastSyncMessage('SYNC_BRANCHES', remainingBranches);
    deleteBranchFromFirestore(branchIdToDelete);
    if (activeBranchId === branchIdToDelete) {
      setActiveBranchId(fallbackBranchId);
    }
  };

  const handleReassignStaffBranch = (userId: string, newBranchId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          const uUpdated = { ...u, branchId: newBranchId };
          saveUserToFirestore(uUpdated);
          return uUpdated;
        }
        return u;
      });
      broadcastSyncMessage('SYNC_USERS', updated);
      return updated;
    });
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, branchId: newBranchId } : null));
    }
  };

  const handlePinWifi = (branchId: string, wifiSsid: string) => {
    const targetBranch = branches.find((b) => b.id === branchId);
    if (targetBranch) {
      const updated = { ...targetBranch, pinnedWifiSsid: wifiSsid };
      saveBranchToFirestore(updated);
    }
    setBranches((prev) => {
      const nextBranches = prev.map((b) =>
        b.id === branchId ? { ...b, pinnedWifiSsid: wifiSsid } : b
      );
      broadcastSyncMessage('SYNC_BRANCHES', nextBranches);
      return nextBranches;
    });
  };

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    startUserPresenceHeartbeat(user, currentDeviceId);
    if (user.role === 'manager') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('staff_dashboard');
      if (user.branchId) {
        setActiveBranchId(user.branchId);
      }
    }
    setIsAuthModalOpen(false);
  };

  const handleRegister = (newUser: User) => {
    setUsers((prev) => {
      const updated = [...prev, newUser];
      broadcastSyncMessage('SYNC_USERS', updated);
      return updated;
    });
    saveUserToFirestore(newUser);
    setCurrentUser(newUser);
    startUserPresenceHeartbeat(newUser, currentDeviceId);
    if (newUser.role === 'manager') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('staff_dashboard');
      if (newUser.branchId) {
        setActiveBranchId(newUser.branchId);
      }
    }
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    if (currentUser) {
      stopUserPresenceHeartbeat(currentUser.id);
    }
    setCurrentUser(null);
    saveToStorage(STORAGE_KEY_CURRENT_USER, null);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    startUserPresenceHeartbeat(user, currentDeviceId);
    if (user.role === 'manager') {
      if (!['dashboard', 'schedule', 'attendance', 'reports'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else {
      if (user.branchId) {
        setActiveBranchId(user.branchId);
      }
      if (!['staff_dashboard', 'staff_checkin', 'staff_register', 'staff_schedule', 'staff_reports'].includes(activeTab)) {
        setActiveTab('staff_dashboard');
      }
    }
  };

  // Schedule Handlers
  const handleApplyAutoSchedule = (generatedAssignments: ShiftAssignment[]) => {
    // Merge new branch assignments with assignments of other branches
    setAssignments((prev) => {
      const otherBranchesAssignments = prev.filter(
        (a) => a.branchId && a.branchId !== activeBranchId
      );
      const nextAssignments = [...otherBranchesAssignments, ...generatedAssignments];
      broadcastSyncMessage('SYNC_ASSIGNMENTS', nextAssignments);
      return nextAssignments;
    });
    saveBatchAssignmentsToFirestore(generatedAssignments);
  };

  const handleSaveShiftAssignment = (updated: ShiftAssignment) => {
    saveShiftAssignmentToFirestore(updated);
    setAssignments((prev) => {
      const exists = prev.some(
        (item) =>
          item.weekId === updated.weekId &&
          item.day === updated.day &&
          item.shiftType === updated.shiftType &&
          item.branchId === updated.branchId
      );
      const nextAssignments = exists
        ? prev.map((item) =>
            item.weekId === updated.weekId &&
            item.day === updated.day &&
            item.shiftType === updated.shiftType &&
            item.branchId === updated.branchId
              ? updated
              : item
          )
        : [...prev, updated];
      broadcastSyncMessage('SYNC_ASSIGNMENTS', nextAssignments);
      return nextAssignments;
    });
  };

  const handleApproveAllShifts = () => {
    const approvedList: ShiftAssignment[] = [];
    setAssignments((prev) => {
      const nextAssignments = prev.map((item) => {
        if (item.weekId === weekId && (!item.branchId || item.branchId === activeBranchId)) {
          const approved: ShiftAssignment = { ...item, status: 'approved' };
          approvedList.push(approved);
          return approved;
        }
        return item;
      });
      broadcastSyncMessage('SYNC_ASSIGNMENTS', nextAssignments);
      return nextAssignments;
    });
    if (approvedList.length > 0) {
      saveBatchAssignmentsToFirestore(approvedList);
    }
  };

  // Attendance Handlers
  const handleCheckInSuccess = (newRecord: AttendanceRecord, updatedUser?: User) => {
    setAttendanceLogs((prev) => {
      const nextLogs = [newRecord, ...prev];
      broadcastSyncMessage('SYNC_ATTENDANCE', nextLogs);
      return nextLogs;
    });
    saveAttendanceRecordToFirestore(newRecord);
    if (updatedUser) {
      setUsers((prev) => {
        const nextUsers = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
        broadcastSyncMessage('SYNC_USERS', nextUsers);
        return nextUsers;
      });
      saveUserToFirestore(updatedUser);
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    }
  };

  const handleCheckOutSuccess = (recordId: string, checkOutTime: string, durationHours: number) => {
    setAttendanceLogs((prev) => {
      const nextLogs = prev.map((rec) => {
        if (rec.id === recordId) {
          return {
            ...rec,
            checkOutTime,
            workDurationHours: durationHours,
            status: 'completed',
          };
        }
        return rec;
      });
      broadcastSyncMessage('SYNC_ATTENDANCE', nextLogs);
      return nextLogs;
    });
    updateAttendanceRecordInFirestore(recordId, {
      checkOutTime,
      workDurationHours: durationHours,
      status: 'completed',
    });
  };

  const handleResetDevice = (userId: string) => {
    setUsers((prev) => {
      const nextUsers = prev.map((u) => {
        if (u.id === userId) {
          const reset = { ...u, registeredDeviceId: null };
          saveUserToFirestore(reset);
          return reset;
        }
        return u;
      });
      broadcastSyncMessage('SYNC_USERS', nextUsers);
      return nextUsers;
    });
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, registeredDeviceId: null } : null));
    }
  };

  const handleUpdateStaffHourlyRate = (userId: string, newRate: number) => {
    setUsers((prev) => {
      const nextUsers = prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, hourlyRate: newRate };
          saveUserToFirestore(updated);
          return updated;
        }
        return u;
      });
      broadcastSyncMessage('SYNC_USERS', nextUsers);
      return nextUsers;
    });
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, hourlyRate: newRate } : null));
    }
  };

  const handleAddStaff = (newStaff: User) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === newStaff.id);
      const nextUsers = exists
        ? prev.map((u) => (u.id === newStaff.id ? newStaff : u))
        : [...prev, newStaff];
      broadcastSyncMessage('SYNC_USERS', nextUsers);
      return nextUsers;
    });
    saveUserToFirestore(newStaff);
  };

  const handleDeleteStaff = (userId: string) => {
    setUsers((prev) => {
      const nextUsers = prev.filter((u) => u.id !== userId);
      broadcastSyncMessage('SYNC_USERS', nextUsers);
      return nextUsers;
    });
    deleteUserFromFirestore(userId);
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatar: newAvatarUrl };
    setCurrentUser(updatedUser);
    setUsers((prev) => {
      const nextUsers = prev.map((u) => (u.id === currentUser.id ? updatedUser : u));
      broadcastSyncMessage('SYNC_USERS', nextUsers);
      return nextUsers;
    });
    saveUserToFirestore(updatedUser);
  };

  const handleSaveStaffRegistrations = (newRegs: ShiftRegistration[]) => {
    setRegistrations(newRegs);
    broadcastSyncMessage('SYNC_REGISTRATIONS', newRegs);
    if (currentUser) {
      const myRegsThisWeek = newRegs.filter(
        (r) => r.userId === currentUser.id && r.weekId === weekId
      );
      saveBatchRegistrationsToFirestore(currentUser.id, weekId, myRegsThisWeek);
    }
  };

  // If user is not logged in, show the Login / Register screen as the primary entry point
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        allUsers={users}
        branches={branches}
        activeBranchId={activeBranchId}
        currentSimulatedWifi={currentSimulatedWifi}
      />
    );
  }

  return (
    <div className="h-screen w-full bg-slate-100 flex overflow-hidden font-sans antialiased text-slate-900">
      {/* Sidebar navigation (Desktop persistent + Mobile slide-over drawer) */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branches={branches}
        activeBranchId={activeBranchId}
        onSelectBranch={handleSelectBranch}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        wifiConfig={wifiConfig}
        currentSimulatedWifi={currentSimulatedWifi}
        currentDeviceId={currentDeviceId}
        onOpenWifiModal={() => setIsWifiModalOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Global Header */}
        <Header
          currentUser={currentUser}
          allUsers={users}
          onSelectUser={handleSelectUser}
          branches={branches}
          activeBranchId={activeBranchId}
          onSelectBranch={handleSelectBranch}
          onOpenBranchModal={() => setIsBranchModalOpen(true)}
          onOpenAutoScheduleModal={() => setIsAutoScheduleModalOpen(true)}
          onOpenCheckInModal={() => setIsCheckInModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          currentSimulatedWifi={currentSimulatedWifi}
          onChangeSimulatedWifi={handleChangeSimulatedWifi}
          currentSimulatedIp={currentSimulatedIp}
          onChangeSimulatedIp={handleChangeSimulatedIp}
          currentDeviceId={currentDeviceId}
          onChangeDeviceId={handleChangeDeviceId}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
          onlinePresences={onlinePresences}
          isQuotaExceeded={isQuotaExceeded}
        />

        {/* Quota Exceeded Notification Banner */}
        {isQuotaExceeded && showQuotaBanner && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between shadow-xs border-b border-amber-600/30 text-xs shrink-0 animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0 font-bold" />
              <div className="truncate">
                <span className="font-bold">Đã kích hoạt P2P Realtime Engine:</span> Cơ sở dữ liệu Cloud Firestore đạt hạn mức đọc gói miễn phí Spark. Dữ liệu đang được đồng bộ thời gian thực mượt mà qua mạng nội bộ và các tab.
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <a
                href={FIRESTORE_DATABASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1 shadow-2xs transition-colors"
              >
                <span>Nâng cấp Firestore</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowQuotaBanner(false)}
                title="Đóng thông báo"
                className="p-1 hover:bg-amber-600/30 rounded-md transition-colors cursor-pointer text-slate-950"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {/* MANAGER VIEWS */}
          {currentUser.role === 'manager' && (
            <>
              {activeTab === 'dashboard' && (
                <ManagerDashboardView
                  currentUser={currentUser}
                  allStaff={users}
                  branches={branches}
                  activeBranchId={activeBranchId}
                  onSelectBranch={handleSelectBranch}
                  onOpenBranchModal={() => setIsBranchModalOpen(true)}
                  weekId={weekId}
                  assignments={assignments}
                  attendanceLogs={attendanceLogs}
                  registrations={registrations}
                  wifiConfig={wifiConfig}
                  currentSimulatedWifi={currentSimulatedWifi}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenAutoSchedule={() => setIsAutoScheduleModalOpen(true)}
                  onOpenWifiModal={() => setIsWifiModalOpen(true)}
                  registrationControls={registrationControls}
                  onToggleRegistrationWeek={handleToggleRegistrationWeek}
                />
              )}

              {activeTab === 'staff_mgmt' && (
                <ManagerStaffView
                  allStaff={users}
                  branches={branches}
                  activeBranchId={activeBranchId}
                  onAddStaff={handleAddStaff}
                  onDeleteStaff={handleDeleteStaff}
                  onUpdateStaffHourlyRate={handleUpdateStaffHourlyRate}
                  onReassignStaffBranch={handleReassignStaffBranch}
                  onResetStaffDevice={handleResetDevice}
                  onlinePresences={onlinePresences}
                />
              )}

              {activeTab === 'schedule' && (
                <ManagerScheduleView
                  allStaff={users}
                  weekId={weekId}
                  onSelectWeek={setWeekId}
                  assignments={assignments}
                  registrations={registrations}
                  branches={branches}
                  activeBranchId={activeBranchId}
                  onSelectBranch={handleSelectBranch}
                  onOpenAutoSchedule={() => setIsAutoScheduleModalOpen(true)}
                  onEditAssignment={(assignment) => setShiftEditState({ isOpen: true, assignment })}
                  onApproveAll={handleApproveAllShifts}
                  registrationControls={registrationControls}
                  onToggleRegistrationWeek={handleToggleRegistrationWeek}
                />
              )}

              {activeTab === 'attendance' && (
                <ManagerAttendanceView
                  allStaff={users}
                  logs={attendanceLogs}
                  branches={branches}
                  activeBranchId={activeBranchId}
                  onSelectBranch={handleSelectBranch}
                  onResetDevice={handleResetDevice}
                  onOpenWifiModal={() => setIsWifiModalOpen(true)}
                />
              )}

              {activeTab === 'reports' && (
                <ManagerReportsView
                  weekId={weekId}
                  allStaff={users}
                  assignments={assignments}
                  attendanceLogs={attendanceLogs}
                  branches={branches}
                  activeBranchId={activeBranchId}
                  onSelectBranch={handleSelectBranch}
                  onUpdateStaffHourlyRate={handleUpdateStaffHourlyRate}
                />
              )}
            </>
          )}

          {/* STAFF VIEWS */}
          {currentUser.role === 'staff' && (
            <>
              {activeTab === 'staff_dashboard' && (
                <StaffDashboardView
                  currentUser={currentUser}
                  allStaff={users}
                  weekId={weekId}
                  assignments={assignments}
                  attendanceLogs={attendanceLogs}
                  registrations={registrations}
                  wifiConfig={wifiConfig}
                  currentSimulatedWifi={currentSimulatedWifi}
                  currentDeviceId={currentDeviceId}
                  branches={branches}
                  onOpenCheckInModal={() => setIsCheckInModalOpen(true)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onUpdateAvatar={handleUpdateAvatar}
                />
              )}

              {activeTab === 'staff_checkin' && (
                <StaffCheckInView
                  currentUser={currentUser}
                  branches={branches}
                  wifiConfig={wifiConfig}
                  currentSimulatedWifi={currentSimulatedWifi}
                  currentSimulatedIp={currentSimulatedIp}
                  currentDeviceId={currentDeviceId}
                  attendanceLogs={attendanceLogs}
                  assignments={assignments}
                  weekId={weekId}
                  onCheckInSuccess={handleCheckInSuccess}
                  onCheckOutSuccess={handleCheckOutSuccess}
                />
              )}

              {activeTab === 'staff_register' && (
                <StaffRegisterView
                  currentUser={currentUser}
                  branches={branches}
                  weekId={weekId}
                  onSelectWeek={setWeekId}
                  registrations={registrations}
                  onSaveRegistrations={handleSaveStaffRegistrations}
                />
              )}

              {activeTab === 'staff_schedule' && (
                <StaffScheduleView
                  currentUser={currentUser}
                  branches={branches}
                  allStaff={users}
                  weekId={weekId}
                  onSelectWeek={setWeekId}
                  assignments={assignments}
                />
              )}

              {activeTab === 'staff_reports' && (
                <StaffReportsView
                  currentUser={currentUser}
                  branches={branches}
                  attendanceLogs={attendanceLogs}
                />
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCheckInModal={() => setIsCheckInModalOpen(true)}
        />
      </div>

      {/* MODALS */}
      {/* 1. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        allUsers={users}
        branches={branches}
        activeBranchId={activeBranchId}
      />

      {/* 2. Branch Management Modal */}
      <BranchManagementModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        activeBranchId={activeBranchId}
        onSelectBranch={handleSelectBranch}
        onSaveBranch={handleSaveBranch}
        onDeleteBranch={handleDeleteBranch}
        allStaff={users}
        onReassignStaffBranch={handleReassignStaffBranch}
        onPinWifi={handlePinWifi}
        onUpdateStaffHourlyRate={handleUpdateStaffHourlyRate}
        onAddStaff={handleAddStaff}
        onDeleteStaff={handleDeleteStaff}
      />

      {/* 3. Auto Schedule Modal */}
      <AutoScheduleModal
        isOpen={isAutoScheduleModalOpen}
        onClose={() => setIsAutoScheduleModalOpen(false)}
        weekId={weekId}
        branch={branches.find((b) => b.id === activeBranchId) || branches[0]}
        staffList={users}
        registrations={registrations}
        onApplySchedule={handleApplyAutoSchedule}
      />

      {/* 4. Manual Shift Edit Modal */}
      <ShiftEditModal
        isOpen={shiftEditState.isOpen}
        onClose={() => setShiftEditState({ isOpen: false, assignment: null })}
        assignment={shiftEditState.assignment}
        branch={branches.find((b) => b.id === (shiftEditState.assignment?.branchId || activeBranchId))}
        allStaff={users}
        allAssignments={assignments}
        registrations={registrations}
        onSaveAssignment={handleSaveShiftAssignment}
      />

      {/* 5. WiFi Settings & Device ID Reset Modal */}
      <WifiSettingsModal
        isOpen={isWifiModalOpen}
        onClose={() => setIsWifiModalOpen(false)}
        branches={branches}
        activeBranchId={activeBranchId}
        onSelectBranch={handleSelectBranch}
        onPinWifi={handlePinWifi}
        onSaveBranch={handleSaveBranch}
        staffList={users}
        onResetDevice={handleResetDevice}
      />

      {/* 6. Quick Check-In Popup Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        currentUser={currentUser}
        branches={branches}
        wifiConfig={wifiConfig}
        currentSimulatedWifi={currentSimulatedWifi}
        currentSimulatedIp={currentSimulatedIp}
        currentDeviceId={currentDeviceId}
        attendanceLogs={attendanceLogs}
        assignments={assignments}
        weekId={weekId}
        onCheckInSuccess={handleCheckInSuccess}
        onCheckOutSuccess={handleCheckOutSuccess}
      />

      {/* 7. Avatar Modal */}
      {isAvatarModalOpen && currentUser && (
        <AvatarModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentUser={currentUser}
          onSaveAvatar={handleUpdateAvatar}
        />
      )}
    </div>
  );
}
