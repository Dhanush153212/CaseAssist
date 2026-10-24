import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PatientCase, AppUser, SystemSettings, ActivityEntry } from '../types';
import { SEED_CASES, DEFAULT_USER, DEFAULT_SETTINGS } from '../data/seedData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppContextValue {
  // Data
  cases: PatientCase[];
  currentUser: AppUser;
  settings: SystemSettings;
  isAuthenticated: boolean;

  // Actions
  addCase: (c: PatientCase) => void;
  updateCase: (c: PatientCase) => void;
  deleteCase: (id: string) => void;
  getCaseById: (id: string) => PatientCase | undefined;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateSettings: (s: SystemSettings) => void;
  addAuditEntry: (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  globalAuditLog: ActivityEntry[];
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  CASES: 'caseassist_cases',
  USER: 'caseassist_user',
  SETTINGS: 'caseassist_settings',
  AUTH: 'caseassist_auth',
  AUDIT: 'caseassist_audit',
} as const;

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<PatientCase[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CASES);
      return stored ? JSON.parse(stored) : SEED_CASES;
    } catch {
      return SEED_CASES;
    }
  });

  const [currentUser] = useState<AppUser>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });

  const [globalAuditLog, setGlobalAuditLog] = useState<ActivityEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(globalAuditLog));
  }, [globalAuditLog]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const addCase = useCallback((c: PatientCase) => {
    setCases(prev => [c, ...prev]);
  }, []);

  const updateCase = useCallback((updated: PatientCase) => {
    setCases(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  }, []);

  const deleteCase = useCallback((id: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCaseById = useCallback(
    (id: string) => cases.find(c => c.id === id),
    [cases],
  );

  const login = useCallback((email: string, _password: string): boolean => {
    // Prototype: accept any non-empty credentials
    if (email && _password) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    setIsAuthenticated(false);
  }, []);

  const updateSettings = useCallback((s: SystemSettings) => {
    setSettings(s);
  }, []);

  const addAuditEntry = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    const full: ActivityEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    };
    setGlobalAuditLog(prev => [full, ...prev]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        cases,
        currentUser,
        settings,
        isAuthenticated,
        addCase,
        updateCase,
        deleteCase,
        getCaseById,
        login,
        logout,
        updateSettings,
        addAuditEntry,
        globalAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
