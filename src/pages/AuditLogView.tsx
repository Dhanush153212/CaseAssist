import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Lock } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

export default function AuditLogView() {
  const { auditLog } = useApp();
  const [filterRole, setFilterRole] = useState('All');
  const [search, setSearch] = useState('');

  const filteredLogs = auditLog.filter(log => {
    const matchRole = filterRole === 'All' || log.role.toLowerCase() === filterRole.toLowerCase();
    const matchSearch = !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      (log.performedBy || log.userName || '').toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[var(--border)]">
        <div>
          <span className="ps-badge">Regulatory Compliance</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            DPDP Act 2023 &amp; System Audit Trail
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Immutable chronological logging of all clinical access, logins, case submissions, and doctor sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>DPDP Consent Enforcement Active</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-box !p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search audit actions, user, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !min-h-[36px] !py-1 text-xs pl-8"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[var(--text-muted)]">Role Filter:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-field !min-h-[36px] !py-1 text-xs"
            >
              <option value="All">All Roles</option>
              <option value="superadmin">Super Administrator</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
              <option value="system">System Gateway</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card-box !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">
                <th className="p-3">Event ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User &amp; Role</th>
                <th className="p-3">Action Tag</th>
                <th className="p-3">Activity Description</th>
                <th className="p-3">Resource / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[var(--text-muted)] font-sans">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--surface-elevated)] transition-colors">
                    <td className="p-3 font-bold text-teal-800">{log.id}</td>
                    <td className="p-3 text-[var(--text-muted)] font-sans text-[11px] whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-3 font-sans">
                      <strong className="text-[var(--text)] block">{log.performedBy || (log as any).userName || 'User'}</strong>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-extrabold ${
                        log.role === 'doctor' ? 'bg-teal-100 text-teal-800' :
                        log.role === 'superadmin' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] text-teal-700 font-extrabold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-[var(--text)] max-w-md">
                      {log.details}
                    </td>
                    <td className="p-3 text-[11px] text-[var(--text-muted)]">
                      {log.resourceId || log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
