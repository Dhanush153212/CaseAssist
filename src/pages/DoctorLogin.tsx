import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight,
  AlertCircle, CheckCircle, HelpCircle, Shield, ArrowLeft
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function DoctorLogin() {
  const { loginWithCredentials, loginWithRole, setActiveView, users } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ sent: boolean; msg: string } | null>(null);

  // Available Preset Clinicians for Instant Demo
  const doctorPresets = users.filter(u => u.role === 'doctor' || u.role === 'Clinician');

  async function handleDoctorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your clinical email and password.');
      return;
    }

    setLoading(true);
    try {
      const success = await loginWithCredentials(email.trim(), password.trim());
      if (!success) {
        setErrorMsg('Invalid doctor credentials. Please verify your email or click a preset doctor account below.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ sent: false, msg: 'Please provide a valid institutional email.' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotStatus({
        sent: true,
        msg: `Password reset instructions dispatched to ${forgotEmail}. Please check your institutional inbox.`
      });
    } catch (err: any) {
      setForgotStatus({
        sent: false,
        msg: err.message || 'Could not send reset email. Contact the Hospital IT Administrator.'
      });
    }
  }

  function handleSelectPreset(preset: typeof doctorPresets[0]) {
    setEmail(preset.email);
    setPassword('DoctorPass2026!');
    loginWithRole('doctor', {
      id: preset.id,
      name: preset.name,
      email: preset.email,
      department: preset.department,
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in space-y-6">
      {/* Top back navigation */}
      <button
        onClick={() => setActiveView('gateway')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Gateway</span>
      </button>

      {/* Main Login Card */}
      <div className="card-box border-t-4 border-t-teal-700 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-sm">
            <Stethoscope className="w-8 h-8" />
          </div>
          <span className="ps-badge">Clinical Station &bull; Problem Statement 26047</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
            Doctor &amp; Clinician Sign In
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Authorized medical staff access to patient triage review queues, AI SOAP case summaries, and ABDM sandbox clinical sign-off.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Doctor Login Form */}
        <form onSubmit={handleDoctorSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text)] mb-1">
              Institutional Medical Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="dr.name@aiia.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-[var(--text)]">
                Clinician Password *
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-teal-700 font-bold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter clinical password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-9 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center text-sm py-3 shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Doctor Session...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In to Clinical Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* 1-Click Verified Clinician Quick Switchers */}
        <div className="pt-4 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>Verified Clinician Presets (Instant Demo)</span>
            <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-extrabold">Active</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {doctorPresets.slice(0, 4).map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleSelectPreset(doc)}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-teal-50/60 hover:border-teal-300 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <strong className="text-xs text-[var(--text)] block group-hover:text-teal-900">{doc.name}</strong>
                  <span className="text-[10px] text-[var(--text-muted)]">{doc.department || 'General Medicine'}</span>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-[var(--border)]">
                  Log in
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Security & Regulatory Notice */}
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong>Clinical Data Protection:</strong> Access is restricted to registered clinicians and medical officers. All clinical reviews, SOAP generation queries, and patient record modifications are audited in accordance with the <em>Digital Personal Data Protection (DPDP) Act 2023</em>.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-sm text-[var(--text)]">Reset Clinician Password</h3>
              </div>
              <button onClick={() => setShowForgotModal(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Enter your registered hospital email address. Firebase Authentication will dispatch a secure reset link to verify your clinical identity.
            </p>

            <form onSubmit={handleSendPasswordReset} className="space-y-3">
              <input
                type="email"
                required
                placeholder="doctor.name@aiia.gov.in"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="input-field text-sm"
              />

              {forgotStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  forgotStatus.sent ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {forgotStatus.sent ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{forgotStatus.msg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
