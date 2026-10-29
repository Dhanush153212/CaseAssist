import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserPlus, Users, Building2, Settings, Search, Save,
  ShieldAlert, Shield, Trash2, FileText, Download,
  Plus, CheckCircle2, AlertCircle, Activity,
  Lock, Check
} from 'lucide-react';
import { DEPARTMENTS } from '../data/seedData';
import type { AppUser, UserRole, Department, PatientCase } from '../types';

export default function AdminPortal() {
  const {
    users, addUser, updateUser, cases, deleteCase,
    settings, updateSettings, auditLog, addAuditEntry,
    currentUser, setActiveView
  } = useApp();

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'accounts' | 'cases' | 'departments' | 'security' | 'settings'>('accounts');

  // Staff Search & Modal
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('doctor');
  const [newDept, setNewDept] = useState<Department>('General Medicine');
  const [newReg, setNewReg] = useState('AYUSH-AIIA-DEL-');
  const [newPhone, setNewPhone] = useState('+91 ');

  // Department Management
  const [departmentList, setDepartmentList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('caseassist_custom_departments');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [...DEPARTMENTS];
  });
  const [newDeptInput, setNewDeptInput] = useState('');

  // Case Oversight & Deletion State
  const [caseSearch, setCaseSearch] = useState('');
  const [caseDeptFilter, setCaseDeptFilter] = useState('All');
  const [caseToDelete, setCaseToDelete] = useState<PatientCase | null>(null);
  const [deleteReason, setDeleteReason] = useState('Administrative record deduplication');

  // Audit filter & export
  const [auditSearch, setAuditSearch] = useState('');

  // System Settings local state
  const [hospitalName, setHospitalName] = useState(settings.hospitalName || 'All India Institute of Ayurveda (AIIA)');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || 'admin@aiia.gov.in');
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '+91-11-26950401');
  const [city, setCity] = useState(settings.city || 'New Delhi');
  const [state, setState] = useState(settings.state || 'Delhi');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(settings.sessionTimeoutMinutes || 30);
  const [enableAISummary, setEnableAISummary] = useState(settings.enableAISummary ?? true);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);

  // ── Zero-Trust Privilege Guard ──
  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 card-box text-center space-y-4 animate-fade-in shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[var(--text)]">Admin Privilege Required</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Institutional configuration and staff provisioning are strictly restricted to Super Administrators under Hospital Security &amp; DPDP Act guidelines.
          </p>
        </div>
        {currentUser ? (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl text-xs text-red-800">
            Currently authenticated as <strong>{currentUser.name}</strong> ({currentUser.role}). Please switch to an Administrator account.
          </div>
        ) : (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 rounded-xl text-xs text-teal-800">
            No active administrative session detected.
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => setActiveView('admin-login')}
            className="btn-primary w-full justify-center text-xs"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In with Super Admin Account</span>
          </button>
          <button
            onClick={() => setActiveView('gateway')}
            className="btn-secondary w-full justify-center text-xs"
          >
            <span>Return to Portal Gateway</span>
          </button>
        </div>
      </div>
    );
  }

  // ── KPI Metrics Calculation ──
  const totalCasesCount = cases.length;
  const pendingReviewsCount = cases.filter(c => c.status === 'Under Review' || c.status === 'Awaiting Clinical Review' || c.status === 'Registered').length;
  const staffDoctorsCount = users.filter(u => u.role === 'doctor').length;
  const activeStaffCount = users.filter(u => u.status !== 'Inactive').length;

  // ── Handlers ──
  const filteredUsers = users.filter(u => {
    const matchQuery =
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.regNumber && u.regNumber.toLowerCase().includes(searchUser.toLowerCase()));
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchQuery && matchRole;
  });

  const filteredCases = cases.filter(c => {
    const q = caseSearch.toLowerCase();
    const matchQ = !q ||
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.complaint.toLowerCase().includes(q);
    const matchD = caseDeptFilter === 'All' || c.department === caseDeptFilter;
    return matchQ && matchD;
  });

  const filteredAudits = auditLog.filter(a => {
    const q = auditSearch.toLowerCase();
    return !q ||
      a.action.toLowerCase().includes(q) ||
      a.details.toLowerCase().includes(q) ||
      (a.performedBy && a.performedBy.toLowerCase().includes(q)) ||
      (a.resourceId && a.resourceId.toLowerCase().includes(q));
  });

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('Please fill out staff name and official email.');
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
    await addAuditEntry(
      'ADMIN_CREATE_USER',
      `Super Admin created ${newRole} account for ${newUser.name} (${newUser.email}) in ${newDept}`,
      newUser.id
    );

    setShowAddUserModal(false);
    setNewName('');
    setNewEmail('');
  }

  async function toggleUserStatus(u: AppUser) {
    const nextStatus = u.status === 'Inactive' ? 'Active' : 'Inactive';
    await updateUser({ ...u, status: nextStatus });
    await addAuditEntry(
      'ADMIN_TOGGLE_USER_STATUS',
      `Staff ${u.name} (${u.email}) status changed to ${nextStatus}`,
      u.id
    );
  }

  async function handleRoleChange(u: AppUser, nextRole: UserRole) {
    if (u.id === currentUser?.id && nextRole !== 'superadmin') {
      alert('You cannot downgrade your own Super Admin account.');
      return;
    }
    await updateUser({ ...u, role: nextRole });
    await addAuditEntry(
      'ADMIN_USER_ROLE_MODIFIED',
      `Staff ${u.name} role changed from ${u.role} to ${nextRole}`,
      u.id
    );
  }

  function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    const clean = newDeptInput.trim();
    if (!clean) return;
    if (departmentList.includes(clean)) {
      alert('Department already exists in directory.');
      return;
    }
    const updated = [...departmentList, clean];
    setDepartmentList(updated);
    localStorage.setItem('caseassist_custom_departments', JSON.stringify(updated));
    addAuditEntry('ADMIN_ADD_DEPARTMENT', `Admin added new clinical department: ${clean}`);
    setNewDeptInput('');
  }

  function handleRemoveDepartment(deptName: string) {
    if (departmentList.length <= 1) {
      alert('At least one clinical department must remain registered.');
      return;
    }
    const hasCases = cases.some(c => c.department === deptName);
    if (hasCases) {
      if (!confirm(`Warning: There are active patient cases mapped to "${deptName}". Removing it may affect triage categorization. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Confirm removal of department "${deptName}"?`)) return;
    }

    const updated = departmentList.filter(d => d !== deptName);
    setDepartmentList(updated);
    localStorage.setItem('caseassist_custom_departments', JSON.stringify(updated));
    addAuditEntry('ADMIN_REMOVE_DEPARTMENT', `Admin unlisted clinical department: ${deptName}`);
  }

  async function handleConfirmDeleteCase() {
    if (!caseToDelete) return;
    await deleteCase(caseToDelete.id);
    await addAuditEntry(
      'ADMIN_PURGE_CASE',
      `Case ${caseToDelete.id} (${caseToDelete.name}) purged by Admin. Reason: ${deleteReason}`,
      caseToDelete.id
    );
    setCaseToDelete(null);
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({
      ...settings,
      hospitalName,
      contactEmail,
      contactPhone,
      city,
      state,
      sessionTimeoutMinutes: Number(sessionTimeoutMinutes),
      enableAISummary,
    });
    addAuditEntry(
      'ADMIN_SETTINGS_UPDATED',
      `Hospital system parameters updated by ${currentUser?.name || 'Super Administrator'}`
    );
    setSettingsSavedAlert(true);
    setTimeout(() => setSettingsSavedAlert(false), 3000);
  }

  function exportAuditTrailJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `caseassist-dpdp-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="ps-badge">Super Administrator Portal</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3" /> DPDP Act Enforced
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            Institutional Administration &amp; Governance
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            {hospitalName} &bull; User Provisioning &bull; Case Oversight &bull; Audit Trail &bull; System Configuration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('audit')}
            className="btn-secondary text-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Full DPDP Log</span>
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-primary text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* ── Operational KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-box !p-4 flex items-center justify-between bg-[var(--surface)]">
          <div>
            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Total Patient Cases</p>
            <p className="text-2xl font-black text-[var(--text)] mt-0.5">{totalCasesCount}</p>
            <span className="text-[10px] text-teal-700 font-semibold">Across all hospital units</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="card-box !p-4 flex items-center justify-between bg-[var(--surface)]">
          <div>
            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Pending Reviews</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingReviewsCount}</p>
            <span className="text-[10px] text-amber-700 font-semibold">Awaiting doctor sign-off</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="card-box !p-4 flex items-center justify-between bg-[var(--surface)]">
          <div>
            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Clinicians &amp; Staff</p>
            <p className="text-2xl font-black text-[var(--text)] mt-0.5">{staffDoctorsCount} / {users.length}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">{activeStaffCount} active accounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card-box !p-4 flex items-center justify-between bg-[var(--surface)]">
          <div>
            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Clinical Units</p>
            <p className="text-2xl font-black text-[var(--text)] mt-0.5">{departmentList.length}</p>
            <span className="text-[10px] text-purple-700 font-semibold">Specialty departments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-[var(--border)] gap-1 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'accounts'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 font-extrabold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff &amp; User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'cases'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 font-extrabold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Case Oversight ({cases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'departments'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 font-extrabold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department Directory ({departmentList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'security'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 font-extrabold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>DPDP Audit &amp; Security ({auditLog.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'settings'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 font-extrabold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Hospital Configuration</span>
        </button>
      </div>

      {/* ── TAB 1: Staff & User Management ── */}
      {activeTab === 'accounts' && (
        <div className="card-box !p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap bg-[var(--surface-elevated)]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, reg..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="input-field !min-h-[34px] !py-1 text-xs pl-8 w-60 sm:w-72"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field !min-h-[34px] !py-1 text-xs font-semibold"
              >
                <option value="All">All Roles</option>
                <option value="doctor">Doctors only</option>
                <option value="superadmin">Super Admins only</option>
                <option value="patient">Patients only</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="btn-primary !py-1.5 !px-3 text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">
                  <th className="p-3">Staff / User</th>
                  <th className="p-3">Role Assignment</th>
                  <th className="p-3">Clinical Unit</th>
                  <th className="p-3">Reg. Number</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[var(--text-muted)]">
                      No accounts found matching search parameters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--surface-elevated)] transition-colors">
                      <td className="p-3 font-bold text-[var(--text)]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0">
                            {u.avatarInitials || u.name[0]}
                          </span>
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[11px] font-normal text-[var(--text-muted)]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                          className="input-field !py-1 !px-2 text-xs font-bold w-32"
                        >
                          <option value="doctor">Doctor</option>
                          <option value="patient">Patient</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-3 text-[var(--text-muted)] truncate max-w-xs">{u.department || 'General Medicine'}</td>
                      <td className="p-3 font-mono text-[11px] text-[var(--text-muted)]">{u.regNumber || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          u.status === 'Inactive' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            u.status === 'Inactive'
                              ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          {u.status === 'Inactive' ? 'Activate Account' : 'Deactivate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Case Oversight ── */}
      {activeTab === 'cases' && (
        <div className="card-box !p-0 overflow-hidden space-y-0">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap bg-[var(--surface-elevated)]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search case ID, patient name, complaint..."
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  className="input-field !min-h-[34px] !py-1 text-xs pl-8 w-64 sm:w-80"
                />
              </div>

              <select
                value={caseDeptFilter}
                onChange={(e) => setCaseDeptFilter(e.target.value)}
                className="input-field !min-h-[34px] !py-1 text-xs"
              >
                <option value="All">All Departments</option>
                {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <span className="text-xs text-[var(--text-muted)] font-semibold">
              Showing {filteredCases.length} of {cases.length} cases
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Chief Complaint</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-[var(--text-muted)]">
                      No case records match query.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map(c => (
                    <tr key={c.id} className="hover:bg-[var(--surface-elevated)] transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-800">{c.id}</td>
                      <td className="p-3 font-bold text-[var(--text)]">
                        {c.name}
                        <span className="text-[10px] text-[var(--text-muted)] block font-normal">
                          {c.age}y &bull; {c.gender} &bull; {c.city || 'Delhi'}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--text-muted)]">{c.department}</td>
                      <td className="p-3 text-[var(--text)] max-w-xs truncate" title={c.complaint}>
                        {c.complaint}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                          c.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setCaseToDelete(c)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                          title="Purge case record (Admin Audit Required)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Department Directory ── */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card-box !p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-sm text-[var(--text)]">
                  Registered Clinical Specialties ({departmentList.length})
                </h3>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {departmentList.map(dept => {
                const count = cases.filter(c => c.department === dept).length;
                return (
                  <div key={dept} className="p-3.5 flex items-center justify-between hover:bg-[var(--surface-elevated)] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                        ⚕
                      </span>
                      <div>
                        <p className="font-bold text-xs text-[var(--text)]">{dept}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {count} active case(s) assigned
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveDepartment(dept)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors text-xs flex items-center gap-1"
                      title="Remove department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Remove</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-box space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <Plus className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-xs text-[var(--text)]">Add Clinical Specialty</h3>
              </div>

              <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Department / Specialty Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shalakiya Tantra (ENT & Eye)"
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                <button type="submit" className="btn-primary w-full justify-center text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Department</span>
                </button>
              </form>
            </div>

            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1 text-teal-900">
              <strong className="block text-[11px] uppercase tracking-wider font-extrabold">Notice on Directory:</strong>
              <p className="text-[11px] text-teal-800">
                Newly registered departments are immediately made available in the Patient Intake Kiosk, Case Management triage drop-downs, and Doctor queues.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: DPDP Audit & Security Monitoring ── */}
      {activeTab === 'security' && (
        <div className="card-box !p-0 overflow-hidden space-y-0">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap bg-[var(--surface-elevated)]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-700" />
              <h3 className="font-bold text-sm text-[var(--text)]">
                Digital Personal Data Protection (DPDP) Audit Trail
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter events, user, action..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="input-field !min-h-[34px] !py-1 text-xs pl-8 w-56"
                />
              </div>

              <button
                onClick={exportAuditTrailJson}
                className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                title="Export complete cryptographic audit trail as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit (JSON)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Actor / User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Details &amp; Security Context</th>
                  <th className="p-3">Resource ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[var(--text-muted)]">
                      No security audit events found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredAudits.slice(0, 50).map(a => (
                    <tr key={a.id} className="hover:bg-[var(--surface-elevated)] transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(a.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {a.action}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[var(--text)]">{a.performedBy || a.userName || 'System Actor'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 uppercase">
                          {a.role}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--text)] max-w-sm">{a.details}</td>
                      <td className="p-3 font-mono text-[11px] text-teal-800">{a.resourceId || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: Hospital Configuration ── */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl card-box space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Settings className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-sm text-[var(--text)]">Institutional Configuration &amp; Governance</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Customize institute parameters, AI assistance parameters, and security policies</p>
            </div>
          </div>

          {settingsSavedAlert && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Hospital and system parameters saved successfully to local state &amp; Firestore.</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Hospital / Institute Title *</label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Administrative Contact Email *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">State / UT</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Session Inactivity Timeout (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="aiSummaryToggle"
                  checked={enableAISummary}
                  onChange={(e) => setEnableAISummary(e.target.checked)}
                  className="w-4 h-4 accent-teal-700"
                />
                <label htmlFor="aiSummaryToggle" className="font-bold text-[var(--text)] cursor-pointer">
                  Enable AI Clinical SOAP Summaries (Groq Qwen Engine)
                </label>
              </div>
            </div>

            <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>Multi-Tenant Database:</span>
                <strong className="text-teal-700">Google Cloud Firestore</strong>
              </div>
              <div className="flex justify-between">
                <span>ABDM Integration Mode:</span>
                <strong className="text-emerald-700">ABDM Sandbox Milestone 1/2/3</strong>
              </div>
              <div className="flex justify-between">
                <span>Cryptographic Audit Logging:</span>
                <strong className="text-emerald-700">DPDP Act Compliant (Active)</strong>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary text-xs w-full sm:w-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save System Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* ── Purge Case Confirmation Modal ── */}
      {caseToDelete && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-md animate-fade-in">
            <div className="p-4 border-b border-rose-200 bg-rose-50 text-rose-900 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Confirm Case Purge (Admin Only)</span>
              </div>
              <button
                onClick={() => setCaseToDelete(null)}
                className="text-rose-700 hover:text-rose-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-[var(--text)]">
                You are about to permanently purge case record <strong className="font-mono text-rose-700">{caseToDelete.id}</strong> ({caseToDelete.name}).
              </p>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                Under the DPDP Act 2023, an immutable audit entry will be recorded with your administrator identity.
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Administrative Justification *</label>
                <input
                  type="text"
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setCaseToDelete(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCase}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Confirm Permanent Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Staff User Modal ── */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-lg animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-teal-800 text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm">Provision Staff Account</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 hover:bg-teal-700 rounded-lg transition-colors font-bold"
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
                    {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
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
