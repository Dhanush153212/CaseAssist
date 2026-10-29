import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PatientCase, AppUser, SystemSettings, ActivityEntry, UserRole, CaseMessage } from '../types';
import { DEFAULT_SETTINGS } from '../data/seedData';
import {
  fetchCasesFromDb,
  saveCaseToDb,
  deleteCaseFromDb,
  fetchUsersFromDb,
  saveUserToDb,
  fetchAuditLogFromDb,
  recordAuditEvent,
  seedInitialDataIfEmpty,
  INITIAL_PRESET_USERS,
} from '../services/db';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export type AppView =
  | 'gateway'
  | 'patient-intake'
  | 'patient-dashboard'
  | 'doctor-login'
  | 'clinical-queue'
  | 'admin-login'
  | 'admin'
  | 'split-view'
  | 'ai-summary'
  | 'analytics'
  | 'audit'
  | 'settings'
  | 'help';

interface AppContextValue {
  cases: PatientCase[];
  currentUser: AppUser | null;
  role: UserRole;
  settings: SystemSettings;
  isAuthenticated: boolean;
  loading: boolean;
  activeView: AppView;
  theme: 'light' | 'dark';
  language: string;
  users: AppUser[];
  auditLog: ActivityEntry[];

  setActiveView: (view: AppView) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
  addCase: (c: PatientCase) => Promise<void>;
  updateCase: (c: PatientCase) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  getCaseById: (id: string) => PatientCase | undefined;
  loginWithRole: (role: UserRole, userObj?: Partial<AppUser>) => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addUser: (u: AppUser) => Promise<void>;
  updateUser: (u: AppUser) => Promise<void>;
  updateSettings: (s: SystemSettings) => void;
  addAuditEntry: (action: string, details: string, resourceId?: string) => Promise<void>;
  sendMessageToCase: (caseId: string, text: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_PRESET_USERS);
  const [auditLog, setAuditLog] = useState<ActivityEntry[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState<AppView>(() => {
    const saved = sessionStorage.getItem('caseassist_active_view');
    return (saved as AppView) || 'gateway';
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('caseassist_theme') as 'light' | 'dark') || 'light';
  });

  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('caseassist_lang') || 'en';
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('caseassist_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const role: UserRole = currentUser?.role || 'patient';
  const isAuthenticated = Boolean(currentUser);

  // Sync theme attribute to document HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('caseassist_theme', theme);
  }, [theme]);

  // Sync active view to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('caseassist_active_view', activeView);
  }, [activeView]);

  // Initial load: Fetch Firestore cases, users, audit logs + auto-seed
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await seedInitialDataIfEmpty();
      const [dbCases, dbUsers, dbAudits] = await Promise.all([
        fetchCasesFromDb(),
        fetchUsersFromDb(),
        fetchAuditLogFromDb(),
      ]);
      setCases(dbCases);
      setUsers(dbUsers);
      setAuditLog(dbAudits);
    } catch (err) {
      console.error('Error refreshing data from DB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && !currentUser) {
        // Find matching profile in users list
        const matched = users.find(u => u.email.toLowerCase() === (fbUser.email || '').toLowerCase());
        if (matched) {
          setCurrentUser(matched);
          sessionStorage.setItem('caseassist_user', JSON.stringify(matched));
        } else {
          const newProfile: AppUser = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Authenticated User',
            email: fbUser.email || '',
            role: 'patient',
            avatarInitials: (fbUser.displayName || fbUser.email || 'U').slice(0, 2).toUpperCase(),
            hospitalName: 'All India Institute of Ayurveda (AIIA)',
          };
          setCurrentUser(newProfile);
          sessionStorage.setItem('caseassist_user', JSON.stringify(newProfile));
          await saveUserToDb(newProfile);
        }
      }
    });

    return () => unsubscribe();
  }, [users, currentUser]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('caseassist_lang', lang);
  }, []);

  const addCase = useCallback(async (c: PatientCase) => {
    setCases(prev => [c, ...prev]);
    await saveCaseToDb(c);
    await recordAuditEvent({
      userId: currentUser?.id || 'kiosk-user',
      userName: currentUser?.name || c.name,
      role: currentUser?.role || 'patient',
      action: 'CASE_SUBMITTED',
      details: `New patient case ${c.id} created for ${c.name} (${c.department})`,
      resourceId: c.id,
    });
  }, [currentUser]);

  const updateCase = useCallback(async (c: PatientCase) => {
    setCases(prev => prev.map(item => item.id === c.id ? c : item));
    await saveCaseToDb(c);
    await recordAuditEvent({
      userId: currentUser?.id || 'staff-user',
      userName: currentUser?.name || 'Clinician',
      role: currentUser?.role || 'doctor',
      action: c.status === 'Reviewed' ? 'CLINICAL_REVIEW_SIGNED' : 'CASE_UPDATED',
      details: `Case ${c.id} status updated to "${c.status}". Notes: ${c.doctorNotes || c.reviewerNotes || 'None'}`,
      resourceId: c.id,
    });
  }, [currentUser]);

  const deleteCase = useCallback(async (id: string) => {
    setCases(prev => prev.filter(item => item.id !== id));
    await deleteCaseFromDb(id);
    await recordAuditEvent({
      userId: currentUser?.id || 'admin-user',
      userName: currentUser?.name || 'Administrator',
      role: currentUser?.role || 'superadmin',
      action: 'CASE_DELETED',
      details: `Case ${id} was removed from active clinical registry`,
      resourceId: id,
    });
  }, [currentUser]);

  const getCaseById = useCallback((id: string) => {
    return cases.find(c => c.id === id);
  }, [cases]);

  const sendMessageToCase = useCallback(async (caseId: string, text: string) => {
    if (!text.trim()) return;
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;

    const newMsg: CaseMessage = {
      id: `MSG-${Date.now()}`,
      senderRole: role === 'doctor' ? 'doctor' : (role === 'superadmin' ? 'superadmin' : 'patient'),
      senderName: currentUser?.name || 'Patient',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedCase: PatientCase = {
      ...targetCase,
      messages: [...(targetCase.messages || []), newMsg],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
  }, [cases, role, currentUser, updateCase]);

  // Login with Preset Role (Quick access for testing all 3 portals)
  const loginWithRole = useCallback(async (loginRole: UserRole, userObj?: Partial<AppUser>) => {
    const matched = users.find(u => u.role === loginRole) ||
      INITIAL_PRESET_USERS.find(u => u.role === loginRole) || {
        id: `usr-${loginRole}-${Date.now()}`,
        name: loginRole === 'doctor' ? 'Dr. Ramesh Sharma, MD (Ayu)' : (loginRole === 'superadmin' ? 'Hospital Director' : 'Rajesh Varma'),
        email: `${loginRole}@aiia.gov.in`,
        role: loginRole,
        avatarInitials: loginRole.slice(0, 2).toUpperCase(),
        hospitalName: 'All India Institute of Ayurveda (AIIA)',
        department: loginRole === 'doctor' ? 'Kayachikitsa (Ayurveda Internal Medicine)' : 'General',
      };

    const finalUser: AppUser = {
      ...matched,
      ...userObj,
      role: loginRole,
    };

    setCurrentUser(finalUser);
    sessionStorage.setItem('caseassist_user', JSON.stringify(finalUser));

    // Route directly to relevant portal
    if (loginRole === 'doctor') setActiveView('clinical-queue');
    else if (loginRole === 'superadmin') setActiveView('admin');
    else setActiveView('patient-dashboard');

    await recordAuditEvent({
      userId: finalUser.id,
      userName: finalUser.name,
      role: finalUser.role,
      action: 'USER_LOGIN',
      details: `User signed in as ${finalUser.role.toUpperCase()} (${finalUser.name})`,
    });
  }, [users]);

  // Login with Real Credentials (Firebase Auth)
  const loginWithCredentials = useCallback(async (email: string, pass: string): Promise<boolean> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        id: cred.user.uid,
        name: cred.user.displayName || email.split('@')[0],
        email: email,
        role: 'doctor' as UserRole,
        avatarInitials: (cred.user.displayName || email).slice(0, 2).toUpperCase(),
        hospitalName: 'All India Institute of Ayurveda (AIIA)',
      };
      setCurrentUser(matched);
      sessionStorage.setItem('caseassist_user', JSON.stringify(matched));
      if (matched.role === 'doctor') setActiveView('clinical-queue');
      else if (matched.role === 'superadmin') setActiveView('admin');
      else setActiveView('patient-dashboard');
      return true;
    } catch (err) {
      console.warn('Firebase signIn failed, checking local users database:', err);
      // Fallback check against preset user database
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
        sessionStorage.setItem('caseassist_user', JSON.stringify(matched));
        if (matched.role === 'doctor') setActiveView('clinical-queue');
        else if (matched.role === 'superadmin') setActiveView('admin');
        else setActiveView('patient-dashboard');
        return true;
      }
      return false;
    }
  }, [users]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (_) {}
    if (currentUser) {
      await recordAuditEvent({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: 'USER_LOGOUT',
        details: `User logged out from session`,
      });
    }
    setCurrentUser(null);
    sessionStorage.removeItem('caseassist_user');
    setActiveView('gateway');
  }, [currentUser]);

  const addUser = useCallback(async (u: AppUser) => {
    setUsers(prev => [u, ...prev]);
    await saveUserToDb(u);
    await recordAuditEvent({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrator',
      role: 'superadmin',
      action: 'USER_ACCOUNT_CREATED',
      details: `Added new user ${u.name} (${u.email}) with role: ${u.role}`,
    });
  }, [currentUser]);

  const updateUser = useCallback(async (u: AppUser) => {
    setUsers(prev => prev.map(item => item.id === u.id ? u : item));
    await saveUserToDb(u);
  }, []);

  const updateSettings = useCallback((s: SystemSettings) => {
    setSettings(s);
  }, []);

  const addAuditEntry = useCallback(async (action: string, details: string, resourceId?: string) => {
    const entry = {
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System',
      performedBy: currentUser?.name || 'System',
      role: currentUser?.role || 'system',
      action,
      details,
      resourceId,
    };
    await recordAuditEvent(entry);
    setAuditLog(prev => [{ ...entry, id: `AUD-${Date.now()}`, timestamp: new Date().toISOString() }, ...prev]);
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        cases,
        currentUser,
        role,
        settings,
        isAuthenticated,
        loading,
        activeView,
        theme,
        language,
        users,
        auditLog,
        setActiveView,
        setTheme,
        setLanguage,
        addCase,
        updateCase,
        deleteCase,
        getCaseById,
        loginWithRole,
        loginWithCredentials,
        logout,
        addUser,
        updateUser,
        updateSettings,
        addAuditEntry,
        sendMessageToCase,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
