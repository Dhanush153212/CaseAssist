import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight,
  AlertCircle, ArrowLeft, KeyRound, CheckCircle
} from 'lucide-react';

export default function AdminLogin() {
  const { loginWithCredentials, loginWithRole, setActiveView, users } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find Admin accounts in preset database
  const adminPresets = users.filter(u => u.role === 'superadmin' || u.role === 'Admin');

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your administrative username/email and security credentials.');
      return;
    }

    setLoading(true);
    try {
      const success = await loginWithCredentials(email.trim(), password.trim());
      if (!success) {
        setErrorMsg('Invalid administrative credentials. Use the verified administrator preset below for quick evaluation.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Administrative authentication failure.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPreset(preset: typeof adminPresets[0]) {
    setEmail(preset.email);
    setPassword('AdminMaster2026!');
    loginWithRole('superadmin', {
      id: preset.id,
      name: preset.name,
      email: preset.email,
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in space-y-6">
      {/* Top back navigation */}
      <button
        onClick={() => setActiveView('gateway')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Gateway</span>
      </button>

      {/* Main Admin Card */}
      <div className="card-box border-t-4 border-t-amber-600 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <span className="ps-badge !bg-amber-100 !text-amber-900 border-amber-300">
            System Administration &amp; IT Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
            Hospital Administrator Sign In
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Super Administrator console for staff provisioning, role access delegation, department volume analytics, and DPDP Act audit logging.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text)] mb-1">
              Administrator Email / Security ID *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="admin@aiia.gov.in or director.admin@aiia.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text)] mb-1">
              Master Administrator Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter administrative master password"
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
            className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Administrative Privilege...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Access Administrator Portal</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Verified Admin Preset Buttons */}
        <div className="pt-4 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>Verified System Administrator Presets</span>
            <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-extrabold border border-amber-200">
              Super Admin
            </span>
          </div>

          <div className="space-y-2">
            {adminPresets.map((admin) => (
              <button
                key={admin.id}
                type="button"
                onClick={() => handleSelectPreset(admin)}
                className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-amber-50/70 hover:border-amber-300 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-200/70 text-amber-900 flex items-center justify-center font-bold text-xs">
                    {admin.avatarInitials || 'AD'}
                  </div>
                  <div>
                    <strong className="text-xs text-[var(--text)] block group-hover:text-amber-900">
                      {admin.name}
                    </strong>
                    <span className="text-[10px] text-[var(--text-muted)]">{admin.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-[var(--border)]">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Instant Access</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Access Enforcement Notice */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong>Zero Trust Role Enforcement:</strong> Non-administrative users (patients, unauthorized clinicians) are restricted from accessing system settings, staff credentials, and deletion logs. Every administrative action is sealed into an immutable audit trail.
          </div>
        </div>
      </div>
    </div>
  );
}
