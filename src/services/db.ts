import {
  collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PatientCase, AppUser, ActivityEntry } from '../types';
import { normalizeCase } from '../utils/helpers';
import { SEED_CASES } from '../data/seedData';

const CASES_COLLECTION = 'cases';
const USERS_COLLECTION = 'users';
const AUDIT_COLLECTION = 'auditLog';

const LOCAL_STORAGE_CASES_KEY = 'caseassist_cases_cache';
const LOCAL_STORAGE_USERS_KEY = 'caseassist_users_cache';
const LOCAL_STORAGE_AUDIT_KEY = 'caseassist_audit_cache';

// Preset Staff & Patient accounts for immediate testing
export const INITIAL_PRESET_USERS: AppUser[] = [
  {
    id: 'usr-doctor-01',
    name: 'Dr. Ramesh Sharma, MD (Ayu)',
    email: 'dr.sharma@aiia.gov.in',
    role: 'doctor',
    department: 'Kayachikitsa (Ayurveda Internal Medicine)',
    hospitalName: 'All India Institute of Ayurveda (AIIA)',
    regNumber: 'AYUSH-AIIA-DEL-8921',
    avatarInitials: 'RS',
    phone: '+91 98110 11223',
    status: 'Active',
  },
  {
    id: 'usr-doctor-02',
    name: 'Dr. Meenakshi Sundaram, MS (Ayu)',
    email: 'dr.meenakshi@aiia.gov.in',
    role: 'doctor',
    department: 'Shalya Tantra (Surgery)',
    hospitalName: 'All India Institute of Ayurveda (AIIA)',
    regNumber: 'AYUSH-AIIA-DEL-8922',
    avatarInitials: 'MS',
    phone: '+91 98110 33445',
    status: 'Active',
  },
  {
    id: 'usr-admin-01',
    name: 'AIIA Hospital Director / Super Administrator',
    email: 'director.admin@aiia.gov.in',
    role: 'superadmin',
    department: 'Hospital Administration & IT',
    hospitalName: 'All India Institute of Ayurveda (AIIA)',
    regNumber: 'AIIA-ADM-001',
    avatarInitials: 'HD',
    phone: '+91 11 2695 0401',
    status: 'Active',
  },
  {
    id: 'usr-patient-01',
    name: 'Rajesh Varma',
    email: 'rajesh.varma@gmail.com',
    role: 'patient',
    hospitalName: 'All India Institute of Ayurveda (AIIA)',
    abhaId: '91-4829-1049-2810',
    uhid: 'AIIA-MK-2026-1001',
    avatarInitials: 'RV',
    phone: '+91 98450 12345',
    status: 'Active',
  },
  {
    id: 'usr-patient-02',
    name: 'Sunita Devi',
    email: 'sunita.devi@gmail.com',
    role: 'patient',
    hospitalName: 'All India Institute of Ayurveda (AIIA)',
    abhaId: '91-3829-5829-1920',
    uhid: 'AIIA-MK-2026-1002',
    avatarInitials: 'SD',
    phone: '+91 97110 54321',
    status: 'Active',
  },
];

// ─── Cases API ────────────────────────────────────────────────────────────────

export async function fetchCasesFromDb(): Promise<PatientCase[]> {
  try {
    const colRef = collection(db, CASES_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: PatientCase[] = [];
      snap.forEach(d => {
        list.push(normalizeCase({ ...d.data(), id: d.id }));
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try {
        localStorage.setItem(LOCAL_STORAGE_CASES_KEY, JSON.stringify(list));
      } catch (_) {}
      return list;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking offline cache:', err);
  }

  // Fallback to local cache or seed cases
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_CASES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeCase);
      }
    }
  } catch (_) {}

  return SEED_CASES.map(normalizeCase);
}

export async function saveCaseToDb(c: PatientCase): Promise<void> {
  const normalized = normalizeCase(c);
  // Optimistically update localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_CASES_KEY);
    const list: PatientCase[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(x => x.id === normalized.id);
    if (idx >= 0) list[idx] = normalized;
    else list.unshift(normalized);
    localStorage.setItem(LOCAL_STORAGE_CASES_KEY, JSON.stringify(list));
  } catch (_) {}

  try {
    const docRef = doc(db, CASES_COLLECTION, normalized.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(normalized)), { merge: true });
  } catch (err) {
    console.error('Firestore save failed:', err);
  }
}

export async function deleteCaseFromDb(id: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_CASES_KEY);
    if (cached) {
      const list: PatientCase[] = JSON.parse(cached);
      localStorage.setItem(LOCAL_STORAGE_CASES_KEY, JSON.stringify(list.filter(c => c.id !== id)));
    }
  } catch (_) {}

  try {
    const docRef = doc(db, CASES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Firestore delete failed:', err);
  }
}

// ─── Users API ────────────────────────────────────────────────────────────────

export async function fetchUsersFromDb(): Promise<AppUser[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: AppUser[] = [];
      snap.forEach(d => {
        list.push({ ...(d.data() as AppUser), id: d.id });
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(list));
      } catch (_) {}
      return list;
    }
  } catch (err) {
    console.warn('Firestore users fetch failed:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  return INITIAL_PRESET_USERS;
}

export async function saveUserToDb(u: AppUser): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    const list: AppUser[] = cached ? JSON.parse(cached) : [...INITIAL_PRESET_USERS];
    const idx = list.findIndex(x => x.id === u.id || x.email === u.email);
    if (idx >= 0) list[idx] = u;
    else list.push(u);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(list));
  } catch (_) {}

  try {
    const docRef = doc(db, USERS_COLLECTION, u.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(u)), { merge: true });
  } catch (err) {
    console.error('Firestore user save failed:', err);
  }
}

// ─── Audit Log API ────────────────────────────────────────────────────────────

export async function fetchAuditLogFromDb(): Promise<ActivityEntry[]> {
  try {
    const colRef = collection(db, AUDIT_COLLECTION);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: ActivityEntry[] = [];
      snap.forEach(d => {
        list.push({ ...(d.data() as ActivityEntry), id: d.id });
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(list));
      } catch (_) {}
      return list;
    }
  } catch (err) {
    console.warn('Firestore audit fetch failed:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  return [
    {
      id: 'AUD-INIT-01',
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_STARTUP',
      performedBy: 'System Monitor',
      role: 'superadmin',
      details: 'CaseAssist Indian Healthcare Kiosk initialized. Cloud Firestore connected.',
    },
  ];
}

export async function recordAuditEvent(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): Promise<void> {
  const fullEntry: ActivityEntry = {
    ...entry,
    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    const list: ActivityEntry[] = cached ? JSON.parse(cached) : [];
    list.unshift(fullEntry);
    localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(list.slice(0, 200)));
  } catch (_) {}

  try {
    const docRef = doc(db, AUDIT_COLLECTION, fullEntry.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(fullEntry)));
  } catch (err) {
    console.error('Firestore audit write failed:', err);
  }
}

// ─── Auto-Seed Initial Data in Firestore ──────────────────────────────────────

export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, CASES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Seeding initial cases to Firestore...');
      for (const item of SEED_CASES) {
        const normalized = normalizeCase(item);
        await setDoc(doc(db, CASES_COLLECTION, normalized.id), JSON.parse(JSON.stringify(normalized)));
      }
    }

    const usersCol = collection(db, USERS_COLLECTION);
    const usersSnap = await getDocs(usersCol);
    if (usersSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      for (const u of INITIAL_PRESET_USERS) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), JSON.parse(JSON.stringify(u)));
      }
    }
  } catch (err) {
    console.warn('Auto-seed check error:', err);
  }
}
