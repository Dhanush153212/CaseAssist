import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User, Stethoscope, Shield, ArrowRight, Sparkles,
  Lock, Mail, Key, AlertCircle
} from 'lucide-react';

export default function GatewayLogin() {
  const { cases, users, loginWithRole, loginWithCredentials, setActiveView } = useApp();

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDirectAuth, setShowDirectAuth] = useState(false);

  const awaitingReviewCount = cases.filter(c =>
    c.status === 'Under Review' || c.status === 'Awaiting Tests' || c.status === 'Awaiting Clinical Review'
  ).length;

  async function handleRealLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const success = await loginWithCredentials(authEmail, authPassword);
      if (!success) {
        setAuthError('Invalid credentials. You may also click any preset account below for immediate verification.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* ── Hero Section ── */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Smart Healthcare Management &bull; PS 26047</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
          Welcome to <span className="text-teal-700">CaseAssist</span> Healthcare Portal
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
          Integrated patient case-taking, AI-assisted SOAP summaries, clinical triage review, and ABHA FHIR interoperability for Indian healthcare institutions.
        </p>
      </div>

      {/* ── Quick Stats Ticker ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
        <div className="stat-card text-center">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Active Cases</span>
          <strong className="text-2xl font-black text-teal-700">{cases.length}</strong>
        </div>
        <div className="stat-card text-center">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Clinical Queue</span>
          <strong className="text-2xl font-black text-amber-600">{awaitingReviewCount}</strong>
        </div>
        <div className="stat-card text-center">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Verified Staff</span>
          <strong className="text-2xl font-black text-blue-600">{users.filter(u => u.role !== 'patient').length}</strong>
        </div>
        <div className="stat-card text-center">
          <span className="text-xs font-semibold text-[var(--text-muted)]">ABDM Gateway</span>
          <strong className="text-sm font-extrabold text-emerald-600 mt-1">Sandbox Live</strong>
        </div>
      </div>

      {/* ── Three Primary Portal Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Patient Portal */}
        <div className="card-box border-t-4 border-t-sky-500 hover:border-sky-600 hover:-translate-y-1 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-sm">
              <User className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700">Self-Service</span>
              <h2 className="text-xl font-extrabold text-[var(--text)]">Patient Portal</h2>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Fill multi-step guided intake forms, view case triage status, chat with doctors, and access digital case notes.
          </p>

          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => setActiveView('patient-intake')}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform"
            >
              <span>Start New Patient Intake</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => loginWithRole('patient', { name: 'Rajesh Varma', email: 'rajesh.varma@gmail.com' })}
              className="w-full bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span>Sign in as Rajesh Varma (Patient)</span>
            </button>
          </div>
        </div>

        {/* 2. Doctor / Clinician Portal */}
        <div className="card-box border-t-4 border-t-teal-600 hover:border-teal-700 hover:-translate-y-1 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-sm">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Clinical Station</span>
              <h2 className="text-xl font-extrabold text-[var(--text)]">Doctor Portal</h2>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Review triage queues, inspect AI-generated SOAP summaries, evaluate clinical gap analysis, and sign off cases.
          </p>

          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => loginWithRole('doctor', { name: 'Dr. Ramesh Sharma, MD (Ayu)', email: 'dr.sharma@aiia.gov.in' })}
              className="w-full bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform"
            >
              <span>Access Clinical Review Queue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveView('split-view')}
              className="w-full bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span>Open Split View Workstation</span>
            </button>
          </div>
        </div>

        {/* 3. Super Administrator Portal */}
        <div className="card-box border-t-4 border-t-amber-600 hover:border-amber-700 hover:-translate-y-1 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-sm">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Governance &amp; IT</span>
              <h2 className="text-xl font-extrabold text-[var(--text)]">Admin Portal</h2>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Manage staff accounts, assign clinician departments, inspect DPDP Act compliance audit logs, and view analytics.
          </p>

          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => loginWithRole('superadmin', { name: 'AIIA Hospital Director', email: 'director.admin@aiia.gov.in' })}
              className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform"
            >
              <span>Access Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveView('audit')}
              className="w-full bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span>Inspect DPDP Compliance Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Real Firebase Credentials Toggle / Form ── */}
      <div className="max-w-xl mx-auto card-box">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-sm text-[var(--text)]">Firebase Authentication Sign In</h3>
          </div>
          <button
            onClick={() => setShowDirectAuth(!showDirectAuth)}
            className="text-xs text-teal-700 font-bold hover:underline"
          >
            {showDirectAuth ? 'Hide Login Form' : 'Enter Custom Email & Password'}
          </button>
        </div>

        {showDirectAuth && (
          <form onSubmit={handleRealLogin} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@hospital.gov.in"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="input-field pl-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="input-field pl-9 text-sm"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In via Firebase Auth'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
