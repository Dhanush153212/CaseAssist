import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Plus, Eye, Pencil, Trash2, ChevronDown, X, Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, statusBadgeClass, priorityBadgeClass } from '../utils/helpers';
import type { CaseStatus, CasePriority, Department } from '../types';
import { DEPARTMENTS } from '../data/seedData';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: CaseStatus[] = [
  'Registered', 'Under Review', 'Awaiting Tests', 'In Treatment',
  'Follow-Up', 'Completed', 'Closed',
];
const PRIORITIES: CasePriority[] = ['Low', 'Normal', 'High', 'Critical'];

// ─── Cases List ───────────────────────────────────────────────────────────────

export default function CasesList() {
  const { cases, deleteCase } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery]         = useState(searchParams.get('q') ?? '');
  const [statusF, setStatusF]     = useState<CaseStatus | ''>('');
  const [priorityF, setPriorityF] = useState<CasePriority | ''>('');
  const [deptF, setDeptF]         = useState<Department | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return cases.filter(c => {
      const matchQ = !q ||
        c.patientInfo.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.hospitalName.toLowerCase().includes(q) ||
        c.clinicalInfo.assignedClinician.toLowerCase().includes(q);
      const matchS = !statusF   || c.caseManagement.reviewStatus === statusF;
      const matchP = !priorityF || c.caseManagement.priority === priorityF;
      const matchD = !deptF     || c.clinicalInfo.department === deptF;
      return matchQ && matchS && matchP && matchD;
    });
  }, [cases, query, statusF, priorityF, deptF]);

  function handleDelete(id: string) {
    deleteCase(id);
    setDeleteConfirm(null);
  }

  function clearFilters() {
    setQuery(''); setStatusF(''); setPriorityF(''); setDeptF('');
  }

  const hasFilters = query || statusF || priorityF || deptF;

  return (
    <div className="p-4 sm:p-6 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-navy-700" /> Patient Cases
          </h1>
          <p className="text-sm text-gray-500">{filtered.length} of {cases.length} cases</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={() => navigate('/cases/new')} className="btn-teal" id="cases-new-case">
            <Plus className="w-4 h-4" /> New Case
          </button>
        </div>
      </div>

      {/* ── Search + Filter Bar ───────────────────────────────────────────── */}
      <div className="card !p-3">
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-48 border border-gray-200 focus-within:border-navy-400 transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, case ID, clinician..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
              id="cases-search"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`btn-secondary ${showFilters || (statusF || priorityF || deptF) ? 'ring-1 ring-navy-300' : ''}`}
            id="cases-filter-toggle"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="input-label">Status</label>
              <select
                value={statusF}
                onChange={e => setStatusF(e.target.value as CaseStatus | '')}
                className="input-field"
                id="cases-filter-status"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Priority</label>
              <select
                value={priorityF}
                onChange={e => setPriorityF(e.target.value as CasePriority | '')}
                className="input-field"
                id="cases-filter-priority"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Department</label>
              <select
                value={deptF}
                onChange={e => setDeptF(e.target.value as Department | '')}
                className="input-field"
                id="cases-filter-dept"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Cases Table ───────────────────────────────────────────────────── */}
      <div className="card !p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No cases found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b border-gray-100">
                  <th className="text-left py-3 px-4">Case ID</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Hospital</th>
                  <th className="text-left py-3 px-4 hidden sm:table-cell">Department</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Priority</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Clinician</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Created</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-navy-700">{c.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{c.patientInfo.name}</p>
                      <p className="text-xs text-gray-500">{c.patientInfo.age}y · {c.patientInfo.gender}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="text-xs text-gray-600 max-w-36 truncate">{c.hospitalName}</p>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <p className="text-xs text-gray-600">{c.clinicalInfo.department}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${statusBadgeClass(c.caseManagement.reviewStatus)}`}>
                        {c.caseManagement.reviewStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${priorityBadgeClass(c.caseManagement.priority)}`}>
                        {c.caseManagement.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-xs text-gray-600">
                      {c.clinicalInfo.assignedClinician}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-xs text-gray-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/cases/${c.id}`)}
                          className="p-1.5 text-gray-500 hover:text-navy-700 hover:bg-navy-50 rounded-md transition-colors"
                          title="View"
                          id={`view-${c.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/cases/${c.id}/edit`)}
                          className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                          title="Edit"
                          id={`edit-${c.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                          id={`delete-${c.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Case</h3>
                <p className="text-sm text-gray-500">{deleteConfirm}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              This action cannot be undone. The case and all associated data will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger" id="confirm-delete">
                Delete Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
