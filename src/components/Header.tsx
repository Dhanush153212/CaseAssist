import { useApp } from '../context/AppContext';
import {
  Activity, Shield, Stethoscope, User, LogOut, Moon, Sun,
  Globe, SplitSquareVertical, FileText, BarChart3, ScrollText
} from 'lucide-react';

export default function Header() {
  const {
    currentUser, role, activeView, setActiveView,
    theme, setTheme, language, setLanguage, logout,
  } = useApp();

  return (
    <header className="sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
      {/* ── Top Tricolor Border ── */}
      <div className="gov-strip" />

      {/* ── Main Header Row ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Brand & Emblem */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveView('gateway')}
          title="Return to Portal Gateway"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 border-2 border-teal-300 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
            ⚕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[var(--text)]">CaseAssist</span>
              <span className="ps-badge">PS 26047</span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
              <span className="text-teal-700 font-bold">Ministry of AYUSH</span>
              <span>&bull;</span>
              <span>All India Institute of Ayurveda (AIIA)</span>
            </div>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* User Session Profile Badge */}
          {currentUser && (
            <div className="inline-flex items-center gap-2 bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-full px-3 py-1 text-xs font-bold shadow-sm">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px] font-extrabold">
                {currentUser.avatarInitials || currentUser.role[0].toUpperCase()}
              </span>
              <span className="hidden md:inline text-[var(--text)]">{currentUser.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${
                role === 'doctor'
                  ? 'bg-teal-100 text-teal-800'
                  : role === 'superadmin'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {role === 'superadmin' ? 'Admin' : role}
              </span>
            </div>
          )}

          {/* Language Selector */}
          <div className="relative inline-flex items-center">
            <Globe className="w-4 h-4 text-[var(--text-muted)] absolute left-2 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] rounded-lg text-xs font-semibold pl-7 pr-2 py-1.5 outline-none cursor-pointer hover:border-[var(--ayush-teal)]"
              aria-label="Select Language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Toggle Dark / Light Theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Logout */}
          {currentUser && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
              title="Logout from active session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Institutional System Status Strip ── */}
      <div className="bg-[var(--surface-elevated)] border-t border-b border-[var(--border)] px-4 sm:px-6 py-1.5 text-[11px] font-medium text-[var(--text-muted)] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Engine: <strong className="text-[var(--text)]">Groq Qwen 3.8-27B</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ABDM Gateway: <strong className="text-[var(--text)]">Sandbox M1/M2/M3</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>DPDP Act 2023: <strong className="text-[var(--text)]">Audit Enforced</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span>Database: <strong className="text-[var(--text)]">Cloud Firestore (Active)</strong></span>
          <span>Node: <strong className="text-[var(--text)]">DELHI-OPD-01</strong></span>
        </div>
      </div>

      {/* ── Sub Navigation Bar for Active Portals ── */}
      <nav className="bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setActiveView('gateway')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'gateway'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Gateway</span>
        </button>

        <button
          onClick={() => setActiveView('patient-intake')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'patient-intake'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Patient Intake</span>
        </button>

        {/* Patient Dashboard */}
        {(role === 'patient' || role === 'superadmin' || !currentUser) && (
          <button
            onClick={() => setActiveView('patient-dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeView === 'patient-dashboard'
                ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Cases &amp; Chats</span>
          </button>
        )}

        {/* Clinical Review Queue */}
        {(role === 'doctor' || role === 'superadmin' || !currentUser) && (
          <button
            onClick={() => setActiveView('clinical-queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeView === 'clinical-queue'
                ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Clinical Review</span>
          </button>
        )}

        {/* Split View */}
        <button
          onClick={() => setActiveView('split-view')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'split-view'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span>Split View</span>
        </button>

        {/* AI Summary */}
        <button
          onClick={() => setActiveView('ai-summary')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'ai-summary'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>AI Summary &amp; Gaps</span>
        </button>

        {/* Admin Portal */}
        {(role === 'superadmin' || !currentUser) && (
          <button
            onClick={() => setActiveView('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeView === 'admin'
                ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin &amp; Users</span>
          </button>
        )}

        {/* Analytics */}
        <button
          onClick={() => setActiveView('analytics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'analytics'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        {/* Audit Log */}
        <button
          onClick={() => setActiveView('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'audit'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>

        {/* Help */}
        <button
          onClick={() => setActiveView('help')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'help'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <span>Help</span>
        </button>
      </nav>
    </header>
  );
}
