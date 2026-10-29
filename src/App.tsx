import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import EmergencyBanner from './components/EmergencyBanner';
import GatewayLogin from './pages/GatewayLogin';
import PatientIntakeWizard from './pages/PatientIntakeWizard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorPortal from './pages/DoctorPortal';
import SplitView from './pages/SplitView';
import AdminPortal from './pages/AdminPortal';
import AISummaryView from './pages/AISummaryView';
import AnalyticsView from './pages/AnalyticsView';
import AuditLogView from './pages/AuditLogView';
import HelpAboutView from './pages/HelpAboutView';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { activeView, cases, loading } = useApp();
  const [dismissEmergency, setDismissEmergency] = useState(false);

  // Check for emergency flags across recent cases
  const recentCriticalCases = cases.filter(c => c.hasEmergencyRedFlag && c.status !== 'Completed');
  const allFlags = Array.from(new Set(recentCriticalCases.flatMap(c => c.emergencyFlags || [])));

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text)] transition-colors">
      {/* ── Emergency Red Flag Banner ── */}
      {!dismissEmergency && allFlags.length > 0 && (
        <EmergencyBanner flags={allFlags} onDismiss={() => setDismissEmergency(true)} />
      )}

      {/* ── Header ── */}
      <Header />

      {/* ── Main Dynamic Viewport ── */}
      <main className="flex-1 w-full pb-16">
        {loading && (
          <div className="max-w-md mx-auto my-8 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>Synchronizing with Google Cloud Firestore (caseassist-3625a)...</span>
          </div>
        )}

        {activeView === 'gateway' && <GatewayLogin />}
        {activeView === 'patient-intake' && <PatientIntakeWizard />}
        {activeView === 'patient-dashboard' && <PatientDashboard />}
        {activeView === 'clinical-queue' && <DoctorPortal />}
        {activeView === 'split-view' && <SplitView />}
        {activeView === 'admin' && <AdminPortal />}
        {activeView === 'ai-summary' && <AISummaryView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'audit' && <AuditLogView />}
        {activeView === 'help' && <HelpAboutView />}
      </main>

      {/* ── Global Institutional Footer ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-6 px-4 sm:px-6 text-center text-xs text-[var(--text-muted)] space-y-1">
        <div className="font-extrabold text-[var(--text)]">
          CaseAssist &bull; Smart Patient Information and Case Management System
        </div>
        <div>
          Ministry of AYUSH &bull; All India Institute of Ayurveda (AIIA) &bull; Problem Statement ID 26047
        </div>
        <div className="text-[11px] text-[var(--text-subtle)] pt-1">
          Compliant with Digital Personal Data Protection (DPDP) Act 2023 &amp; Ayushman Bharat Digital Mission (ABDM) FHIR R4 Standards
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}