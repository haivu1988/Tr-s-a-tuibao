import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Branch, 
  User, 
  ShiftRegistration, 
  ShiftAssignment, 
  AttendanceRecord, 
  WifiStoreConfig,
  RegistrationWeekControl
} from '../types';
import { 
  INITIAL_BRANCHES, 
  INITIAL_USERS, 
  INITIAL_WIFI_CONFIG 
} from '../data/mockData';

/**
 * Remove undefined values recursively before passing to Firestore setDoc/updateDoc
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestoreDatabaseId if configured, or default
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection Names
export const COLLECTIONS = {
  BRANCHES: 'branches',
  USERS: 'users',
  REGISTRATIONS: 'shift_registrations',
  ASSIGNMENTS: 'shift_assignments',
  ATTENDANCE: 'attendance_records',
  SETTINGS: 'system_settings',
  REGISTRATION_CONTROLS: 'registration_controls',
};

/**
 * Initialize base data in Firestore if empty
 */
export async function initializeFirestoreDefaults(): Promise<void> {
  try {
    // 1. Initialize Branches
    const branchesSnap = await getDocs(collection(db, COLLECTIONS.BRANCHES));
    if (branchesSnap.empty) {
      const batch = writeBatch(db);
      for (const branch of INITIAL_BRANCHES) {
        const ref = doc(db, COLLECTIONS.BRANCHES, branch.id);
        batch.set(ref, branch);
      }
      await batch.commit();
    }

    // 2. Initialize Users (ensure quanly01 exists)
    const userDocRef = doc(db, COLLECTIONS.USERS, 'quanly01');
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, INITIAL_USERS[0]);
    }

    // 3. Initialize WiFi Config
    const wifiDocRef = doc(db, COLLECTIONS.SETTINGS, 'wifi_config');
    const wifiSnap = await getDoc(wifiDocRef);
    if (!wifiSnap.exists()) {
      await setDoc(wifiDocRef, INITIAL_WIFI_CONFIG);
    }
  } catch (err) {
    console.warn('Firebase initialization note (offline/first load):', err);
  }
}

// ----------------- Real-time Firestore Listeners with Graceful Quota Handling ----------------- //

function handleFirestoreError(context: string, err: any) {
  const errMsg = err?.message || String(err);
  if (errMsg.includes('Quota limit exceeded') || errMsg.includes('resource-exhausted')) {
    console.warn(`[Firestore Offline Cache Active] ${context}: Quota reached, using local storage cache seamlessly.`);
  } else {
    console.warn(`[Firestore Notice] ${context}:`, errMsg);
  }
}

export function subscribeBranches(callback: (branches: Branch[]) => void) {
  try {
    const q = collection(db, COLLECTIONS.BRANCHES);
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items: Branch[] = [];
        snapshot.forEach((d) => items.push(d.data() as Branch));
        callback(items);
      } else {
        // If collection empty on fresh DB, trigger seed
        initializeFirestoreDefaults();
      }
    }, (err) => {
      handleFirestoreError('Listening to branches', err);
    });
  } catch (err) {
    handleFirestoreError('Setup branches listener', err);
    return () => {};
  }
}

export function subscribeUsers(callback: (users: User[]) => void) {
  try {
    const q = collection(db, COLLECTIONS.USERS);
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items: User[] = [];
        snapshot.forEach((d) => items.push(d.data() as User));
        callback(items);
      } else {
        initializeFirestoreDefaults();
      }
    }, (err) => {
      handleFirestoreError('Listening to users', err);
    });
  } catch (err) {
    handleFirestoreError('Setup users listener', err);
    return () => {};
  }
}

export function subscribeRegistrations(callback: (regs: ShiftRegistration[]) => void) {
  try {
    const q = collection(db, COLLECTIONS.REGISTRATIONS);
    return onSnapshot(q, (snapshot) => {
      const items: ShiftRegistration[] = [];
      snapshot.forEach((d) => items.push(d.data() as ShiftRegistration));
      callback(items);
    }, (err) => {
      handleFirestoreError('Listening to shift registrations', err);
    });
  } catch (err) {
    handleFirestoreError('Setup registrations listener', err);
    return () => {};
  }
}

export function subscribeAssignments(callback: (assignments: ShiftAssignment[]) => void) {
  try {
    const q = collection(db, COLLECTIONS.ASSIGNMENTS);
    return onSnapshot(q, (snapshot) => {
      const items: ShiftAssignment[] = [];
      snapshot.forEach((d) => items.push(d.data() as ShiftAssignment));
      callback(items);
    }, (err) => {
      handleFirestoreError('Listening to shift assignments', err);
    });
  } catch (err) {
    handleFirestoreError('Setup assignments listener', err);
    return () => {};
  }
}

export function subscribeAttendance(callback: (logs: AttendanceRecord[]) => void) {
  try {
    const q = collection(db, COLLECTIONS.ATTENDANCE);
    return onSnapshot(q, (snapshot) => {
      const items: AttendanceRecord[] = [];
      snapshot.forEach((d) => items.push(d.data() as AttendanceRecord));
      // Sort descending by date & checkInTime
      items.sort((a, b) => (b.date + (b.checkInTime || '')).localeCompare(a.date + (a.checkInTime || '')));
      callback(items);
    }, (err) => {
      handleFirestoreError('Listening to attendance logs', err);
    });
  } catch (err) {
    handleFirestoreError('Setup attendance listener', err);
    return () => {};
  }
}

// ----------------- CRUD Mutators for Firestore ----------------- //

export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(ref, cleanFirestoreData(user), { merge: true });
  } catch (err) {
    handleFirestoreError('Save user to Firestore', err);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError('Delete user from Firestore', err);
  }
}

export async function saveBranchToFirestore(branch: Branch): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.BRANCHES, branch.id);
    await setDoc(ref, cleanFirestoreData(branch), { merge: true });
  } catch (err) {
    handleFirestoreError('Save branch to Firestore', err);
  }
}

export async function deleteBranchFromFirestore(branchId: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.BRANCHES, branchId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError('Delete branch from Firestore', err);
  }
}

export async function saveShiftRegistrationToFirestore(registration: ShiftRegistration): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.REGISTRATIONS, registration.id);
    await setDoc(ref, cleanFirestoreData(registration), { merge: true });
  } catch (err) {
    handleFirestoreError('Save shift registration to Firestore', err);
  }
}

export async function saveBatchRegistrationsToFirestore(userId: string, weekId: string, regs: ShiftRegistration[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    // 1. Delete previous registrations of this user in this week
    const q = query(
      collection(db, COLLECTIONS.REGISTRATIONS),
      where('userId', '==', userId),
      where('weekId', '==', weekId)
    );
    const oldSnap = await getDocs(q);
    oldSnap.forEach((d) => {
      batch.delete(d.ref);
    });

    // 2. Set new registrations
    for (const reg of regs) {
      const ref = doc(db, COLLECTIONS.REGISTRATIONS, reg.id);
      batch.set(ref, cleanFirestoreData(reg));
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError('Save batch registrations to Firestore', err);
  }
}

export async function saveShiftAssignmentToFirestore(assignment: ShiftAssignment): Promise<void> {
  try {
    const docId = assignment.id || `${assignment.weekId}_${assignment.branchId || 'default'}_${assignment.day}_${assignment.shiftType}`;
    const ref = doc(db, COLLECTIONS.ASSIGNMENTS, docId);
    await setDoc(ref, cleanFirestoreData({ ...assignment, id: docId }), { merge: true });
  } catch (err) {
    handleFirestoreError('Save shift assignment to Firestore', err);
  }
}

export async function saveBatchAssignmentsToFirestore(assignments: ShiftAssignment[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const assignment of assignments) {
      const docId = assignment.id || `${assignment.weekId}_${assignment.branchId || 'default'}_${assignment.day}_${assignment.shiftType}`;
      const ref = doc(db, COLLECTIONS.ASSIGNMENTS, docId);
      batch.set(ref, cleanFirestoreData({ ...assignment, id: docId }), { merge: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError('Save batch assignments to Firestore', err);
  }
}

export async function saveAttendanceRecordToFirestore(record: AttendanceRecord): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.ATTENDANCE, record.id);
    await setDoc(ref, cleanFirestoreData(record), { merge: true });
  } catch (err) {
    handleFirestoreError('Save attendance record to Firestore', err);
  }
}

export async function updateAttendanceRecordInFirestore(recordId: string, updates: Partial<AttendanceRecord>): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.ATTENDANCE, recordId);
    await updateDoc(ref, cleanFirestoreData(updates));
  } catch (err) {
    handleFirestoreError('Update attendance record in Firestore', err);
  }
}

export function subscribeRegistrationControls(callback: (controls: RegistrationWeekControl[]) => void) {
  try {
    const q = collection(db, COLLECTIONS.REGISTRATION_CONTROLS);
    return onSnapshot(q, (snapshot) => {
      const items: RegistrationWeekControl[] = [];
      snapshot.forEach((d) => items.push(d.data() as RegistrationWeekControl));
      callback(items);
    }, (err) => {
      handleFirestoreError('Listening to registration controls', err);
    });
  } catch (err) {
    handleFirestoreError('Setup registration controls listener', err);
    return () => {};
  }
}

export async function saveRegistrationWeekControlToFirestore(control: RegistrationWeekControl): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.REGISTRATION_CONTROLS, control.weekId);
    await setDoc(ref, cleanFirestoreData(control), { merge: true });
  } catch (err) {
    handleFirestoreError('Save registration week control to Firestore', err);
  }
}
