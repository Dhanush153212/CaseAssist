import { useMemo } from 'react';
import { ScrollText, Activity, User, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/helpers';
import type { UserRole } from '../types';

// ─── Role badge colours ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  Admin:      'bg-purple-100 text-purple-700',
  Clinician:  'bg-blue-100 text-blue-700',
  Reviewer:   'bg-amber-100 text-amber-700',
  patient:    'bg-sky-100 text-sky-700',
  doctor:     'bg-teal-100 text-teal-700',
  superadmin: 'bg-amber-100 text-amber-700',
  triage:     'bg-rose-100 text-rose-700',
};

// ─── Audit Log ────────────────────────────────────────────────────────────────

export default function AuditLog() {
  const { cases } = useApp();

  // Aggregate all activity entries from all cases
  const allEntries = useMemo(() => {
    const entries = cases.flatMap(c =>
      c.activityLog.map(a => ({
        ...a,
        caseId: c.id,
        patientName: c.patientInfo.name,
      })),
    );
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cases]);

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-navy-700" /> Activity Audit Log
        </h1>
        <p className="text-sm text-gray-500">{allEntries.length} recorded events across all cases</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { role: 'Admin', icon: Shield, count: allEntries.filter(e => e.role === 'Admin').length },
          { role: 'Clinician', icon: User, count: allEntries.filter(e => e.role === 'Clinician').length },
          { role: 'Reviewer', icon: Activity, count: allEntries.filter(e => e.role === 'Reviewer').length },
        ].map(({ role, icon: Icon, count }) => (
          <div key={role} className="stat-card">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${ROLE_COLORS[role as UserRole]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500">{role} Actions</p>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Event Log</h2>
        </div>
        {allEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ScrollText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b border-gray-100">
                  <th className="text-left py-3 px-5">Timestamp</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Case ID</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Patient</th>
                  <th className="text-left py-3 px-4 hidden sm:table-cell">Performed By</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allEntries.map(e => (
                  <tr key={e.id} className="table-row">
                    <td className="py-2.5 px-5 text-xs text-gray-500 font-mono whitespace-nowrap">
                      {formatDateTime(e.timestamp)}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-gray-800">{e.action}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-navy-700 font-semibold">{e.caseId}</td>
                    <td className="py-2.5 px-4 hidden md:table-cell text-gray-600 text-xs">{e.patientName}</td>
                    <td className="py-2.5 px-4 hidden sm:table-cell text-gray-600 text-xs">{e.performedBy}</td>
                    <td className="py-2.5 px-4">
                      <span className={`badge ${ROLE_COLORS[e.role]}`}>{e.role}</span>
                    </td>
                    <td className="py-2.5 px-4 hidden lg:table-cell text-xs text-gray-500 max-w-64 truncate">
                      {e.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
