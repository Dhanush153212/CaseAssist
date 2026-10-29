import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserPlus, Users, Building2, Settings, Search, Save
} from 'lucide-react';
import { DEPARTMENTS } from '../data/seedData';
import type { AppUser, UserRole, Department } from '../types';

export default function AdminPortal() {
  const { users, addUser, updateUser, cases, settings, updateSettings, setActiveView } = useApp();

  const [searchUser, setSearchUser] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('doctor');
  const [newDept, setNewDept] = useState<Department>('Kayachikitsa (Ayurveda Internal Medicine)');
  const [newReg, setNewReg] = useState('AYUSH-AIIA-DEL-');
  const [newPhone, setNewPhone] = useState('+91 ');

  // System Settings local state
  const [hospitalName, setHospitalName] = useState(settings.hospitalName || 'All India Institute of Ayurveda (AIIA)');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || 'admin@aiia.gov.in');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('Please fill out user name and email.');
      return;
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      department: newDept,
      regNumber: newReg.trim(),
      phone: newPhone.trim(),
      hospitalName: hospitalName,
      avatarInitials: newName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
      status: 'Active',
    };

    await addUser(newUser);
    setShowAddUserModal(false);
    setNewName('');
    setNewEmail('');
  }

  async function toggleUserStatus(u: AppUser) {
    const nextStatus = u.status === 'Inactive' ? 'Active' : 'Inactive';
    await updateUser({ ...u, status: nextStatus });
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({
      ...settings,
      hospitalName,
      contactEmail,
    });
    alert('Hospital and system settings updated successfully.');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[var(--border)]">
        <div>
          <span className="ps-badge">Super Administrator Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            Hospital Administration &amp; Access Control
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            User role provisioning &bull; Department oversight &bull; Institutional configuration &bull; DPDP Compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('audit')}
            className="btn-secondary text-xs"
          >
            <span>View Full Audit Log</span>
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-primary text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff Account</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns for User Management & Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Staff & User Registry */}
        <div className="lg:col-span-2 card-box !p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap bg-[var(--surface-elevated)]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-[var(--text)]">Authorized Accounts ({users.length})</h2>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search staff, email, role..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="input-field !min-h-[34px] !py-1 text-xs pl-8 max-w-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">
                  <th className="p-3">Staff / User Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Reg. Number</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--surface-elevated)] transition-colors">
                    <td className="p-3 font-bold text-[var(--text)]">
                      <div>{u.name}</div>
                      <div className="text-[11px] font-normal text-[var(--text-muted)]">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        u.role === 'doctor'
                          ? 'bg-teal-100 text-teal-800'
                          : u.role === 'superadmin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-muted)] truncate max-w-xs">{u.department || 'General'}</td>
                    <td className="p-3 font-mono text-[11px] text-[var(--text-muted)]">{u.regNumber || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        u.status === 'Inactive' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className="text-xs font-bold text-teal-700 hover:underline"
                      >
                        {u.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Department Overview & System Settings */}
        <div className="space-y-6">
          {/* Departments breakdown */}
          <div className="card-box space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-[var(--text)]">Hospital Departments</h2>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
              {DEPARTMENTS.slice(0, 8).map(d => {
                const count = cases.filter(c => c.department === d).length;
                return (
                  <div key={d} className="flex justify-between items-center p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <span className="font-medium text-[var(--text)] truncate max-w-[180px]">{d}</span>
                    <span className="font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full text-[11px]">
                      {count} cases
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Settings Card */}
          <div className="card-box space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
              <Settings className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-[var(--text)]">System Configuration</h2>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Hospital / Institute Title</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Administrative Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="p-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Database Store:</span>
                  <strong className="text-teal-700">Cloud Firestore (Multi-tenant)</strong>
                </div>
                <div className="flex justify-between">
                  <span>AI Engine Provider:</span>
                  <strong className="text-teal-700">Groq Qwen 3.8-27B</strong>
                </div>
                <div className="flex justify-between">
                  <span>Audit Logging:</span>
                  <strong className="text-emerald-600">Active (DPDP Act)</strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary justify-center text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save System Settings</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-teal-800 text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm">Provision Staff / User Account</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 hover:bg-teal-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anand Kulkarni, MD"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@aiia.gov.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Assigned Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="input-field text-xs font-bold"
                  >
                    <option value="doctor">Doctor / Clinician</option>
                    <option value="patient">Patient</option>
                    <option value="superadmin">Super Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as Department)}
                    className="input-field text-xs"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">AYUSH / Medical Reg. No.</label>
                  <input
                    type="text"
                    value={newReg}
                    onChange={(e) => setNewReg(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
