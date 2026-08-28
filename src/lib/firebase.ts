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

// ----------------- Real-time Firestore Listeners ----------------- //

export function subscribeBranches(callback: (branches: Branch[]) => void) {
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
    console.error('Error listening to branches:', err);
  });
}

export function subscribeUsers(callback: (users: User[]) => void) {
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
    console.error('Error listening to users:', err);
  });
}

export function subscribeRegistrations(callback: (regs: ShiftRegistration[]) => void) {
  const q = collection(db, COLLECTIONS.REGISTRATIONS);
  return onSnapshot(q, (snapshot) => {
    const items: ShiftRegistration[] = [];
    snapshot.forEach((d) => items.push(d.data() as ShiftRegistration));
    callback(items);
  }, (err) => {
    console.error('Error listening to shift registrations:', err);
  });
}

export function subscribeAssignments(callback: (assignments: ShiftAssignment[]) => void) {
  const q = collection(db, COLLECTIONS.ASSIGNMENTS);
  return onSnapshot(q, (snapshot) => {
    const items: ShiftAssignment[] = [];
    snapshot.forEach((d) => items.push(d.data() as ShiftAssignment));
    callback(items);
  }, (err) => {
    console.error('Error listening to shift assignments:', err);
  });
}

export function subscribeAttendance(callback: (logs: AttendanceRecord[]) => void) {
  const q = collection(db, COLLECTIONS.ATTENDANCE);
  return onSnapshot(q, (snapshot) => {
    const items: AttendanceRecord[] = [];
    snapshot.forEach((d) => items.push(d.data() as AttendanceRecord));
    // Sort descending by date & checkInTime
    items.sort((a, b) => (b.date + (b.checkInTime || '')).localeCompare(a.date + (a.checkInTime || '')));
    callback(items);
  }, (err) => {
    console.error('Error listening to attendance logs:', err);
  });
}

// ----------------- CRUD Mutators for Firestore ----------------- //

export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(ref, user, { merge: true });
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
  }
}

export async function saveBranchToFirestore(branch: Branch): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.BRANCHES, branch.id);
    await setDoc(ref, branch, { merge: true });
  } catch (err) {
    console.error('Error saving branch to Firestore:', err);
  }
}

export async function deleteBranchFromFirestore(branchId: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.BRANCHES, branchId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('Error deleting branch from Firestore:', err);
  }
}

export async function saveShiftRegistrationToFirestore(registration: ShiftRegistration): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.REGISTRATIONS, registration.id);
    await setDoc(ref, registration, { merge: true });
  } catch (err) {
    console.error('Error saving shift registration:', err);
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
      batch.set(ref, reg);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error saving batch registrations:', err);
  }
}

export async function saveShiftAssignmentToFirestore(assignment: ShiftAssignment): Promise<void> {
  try {
    const docId = assignment.id || `${assignment.weekId}_${assignment.branchId || 'default'}_${assignment.day}_${assignment.shiftType}`;
    const ref = doc(db, COLLECTIONS.ASSIGNMENTS, docId);
    await setDoc(ref, { ...assignment, id: docId }, { merge: true });
  } catch (err) {
    console.error('Error saving shift assignment:', err);
  }
}

export async function saveBatchAssignmentsToFirestore(assignments: ShiftAssignment[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const assignment of assignments) {
      const docId = assignment.id || `${assignment.weekId}_${assignment.branchId || 'default'}_${assignment.day}_${assignment.shiftType}`;
      const ref = doc(db, COLLECTIONS.ASSIGNMENTS, docId);
      batch.set(ref, { ...assignment, id: docId }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving assignments:', err);
  }
}

export async function saveAttendanceRecordToFirestore(record: AttendanceRecord): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.ATTENDANCE, record.id);
    await setDoc(ref, record, { merge: true });
  } catch (err) {
    console.error('Error saving attendance record:', err);
  }
}

export async function updateAttendanceRecordInFirestore(recordId: string, updates: Partial<AttendanceRecord>): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.ATTENDANCE, recordId);
    await updateDoc(ref, updates);
  } catch (err) {
    console.error('Error updating attendance record:', err);
  }
}

export function subscribeRegistrationControls(callback: (controls: RegistrationWeekControl[]) => void) {
  const q = collection(db, COLLECTIONS.REGISTRATION_CONTROLS);
  return onSnapshot(q, (snapshot) => {
    const items: RegistrationWeekControl[] = [];
    snapshot.forEach((d) => items.push(d.data() as RegistrationWeekControl));
    callback(items);
  }, (err) => {
    console.error('Error listening to registration controls:', err);
  });
}

export async function saveRegistrationWeekControlToFirestore(control: RegistrationWeekControl): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.REGISTRATION_CONTROLS, control.weekId);
    await setDoc(ref, control, { merge: true });
  } catch (err) {
    console.error('Error saving registration week control:', err);
  }
}
