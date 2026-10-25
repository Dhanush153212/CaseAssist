import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Stethoscope, ClipboardList, Activity, TestTube,
  Pencil, Brain, CheckCircle, FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, formatDateTime, statusBadgeClass, priorityBadgeClass } from '../utils/helpers';

// ─── CaseDetail ───────────────────────────────────────────────────────────────

export default function CaseDetail() {
  const { id } = useParams();
  const { getCaseById } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tests' | 'activity'>('overview');

  const c = getCaseById(id!);

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <FileText className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-medium">Case not found</p>
        <button onClick={() => navigate('/cases')} className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Cases
        </button>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Overview',        icon: Stethoscope },
    { id: 'history',  label: 'Medical History', icon: ClipboardList },
    { id: 'tests',    label: 'Test Results',    icon: TestTube },
    { id: 'activity', label: 'Activity',        icon: Activity },
  ] as const;

  return (
    <div className="p-4 sm:p-6 space-y-4 animate-fade-in max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button onClick={() => navigate('/cases')} className="btn-secondary !px-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-mono">{c.id}</h1>
          <p className="text-sm text-gray-500">{c.hospitalName}</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={() => navigate(`/cases/${c.id}/edit`)} className="btn-secondary">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => navigate(`/ai-summary?case=${c.id}`)} className="btn-primary">
            <Brain className="w-4 h-4" /> AI Summary
          </button>
        </div>
      </div>

      {/* ── Patient Profile Card ───────────────────────────────────────────── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-xl font-bold shrink-0">
            {c.patientInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2 mb-1">
              <h2 className="text-lg font-semibold text-gray-900">{c.patientInfo.name}</h2>
              <span className={`badge ${statusBadgeClass(c.caseManagement.reviewStatus)}`}>
                {c.caseManagement.reviewStatus}
              </span>
              <span className={`badge ${priorityBadgeClass(c.caseManagement.priority)}`}>
                {c.caseManagement.priority} Priority
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>{c.patientInfo.age} yrs · {c.patientInfo.gender}</span>
              <span>{c.patientInfo.contactNumber}</span>
              <span>{c.patientInfo.city}, {c.patientInfo.state} — {c.patientInfo.pinCode}</span>
              <span>Reg: {c.patientInfo.hospitalRegNumber || '—'}</span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400 shrink-0">
            <p>Created: {formatDate(c.createdAt)}</p>
            <p>Updated: {formatDate(c.updatedAt)}</p>
            <p className="mt-1 text-gray-500 font-medium">By {c.createdBy}</p>
          </div>
        </div>

        {/* Quick info row */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {[
            { label: 'Department',   value: c.clinicalInfo.department },
            { label: 'Clinician',    value: c.clinicalInfo.assignedClinician },
            { label: 'Follow-Up',    value: c.caseManagement.followUpDate || '—' },
            { label: 'Priority',     value: c.caseManagement.priority },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {TABS.map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => setActiveTab(tid)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tid
                ? 'bg-white text-navy-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
            id={`tab-${tid}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" /> Clinical Details
            </h3>
            <dl className="space-y-2 text-sm">
              <InfoRow label="Chief Complaint"  value={c.clinicalInfo.chiefComplaint} />
              <InfoRow label="Symptoms"          value={c.clinicalInfo.symptoms.join(', ') || '—'} />
              <InfoRow label="Duration"          value={c.clinicalInfo.duration || '—'} />
              <InfoRow label="Initial Obs."      value={c.clinicalInfo.initialObservations || '—'} />
            </dl>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-navy-600" /> Case Notes &amp; Next Actions
            </h3>
            <dl className="space-y-2 text-sm">
              <InfoRow label="Notes"        value={c.caseManagement.notes || '—'} />
              <InfoRow label="Next Actions" value={c.caseManagement.nextActions || '—'} />
            </dl>
          </div>
          {c.reviewerNotes && (
            <div className="card sm:col-span-2 border-teal-200 bg-teal-50">
              <h3 className="text-sm font-semibold text-teal-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Reviewer Notes
                {c.reviewedBy && <span className="text-xs text-teal-600">— {c.reviewedBy} ({formatDate(c.reviewedAt ?? '')})</span>}
              </h3>
              <p className="text-sm text-teal-900">{c.reviewerNotes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Medical History</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <HistorySection label="Existing Conditions"   items={c.medicalHistory.existingConditions} />
            <HistorySection label="Current Medications"   items={c.medicalHistory.currentMedications} />
            <HistorySection label="Allergies"             items={c.medicalHistory.allergies} />
            <HistorySection label="Previous Procedures"   items={c.medicalHistory.previousProcedures} />
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Family History</p>
              <p className="text-gray-700">{c.medicalHistory.familyHistory || 'None recorded'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="card animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TestTube className="w-4 h-4 text-purple-600" /> Test Results ({c.testResults.length})
          </h3>
          {c.testResults.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No test results recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header border-b border-gray-100">
                    <th className="text-left py-2 pr-4">Test</th>
                    <th className="text-left py-2 pr-4">Result</th>
                    <th className="text-left py-2 pr-4">Ordered By</th>
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {c.testResults.map(t => (
                    <tr key={t.id} className="table-row">
                      <td className="py-2.5 pr-4 font-medium">{t.testName}</td>
                      <td className="py-2.5 pr-4 text-gray-600 max-w-xs truncate">{t.result}</td>
                      <td className="py-2.5 pr-4 text-gray-500 text-xs">{t.orderedBy}</td>
                      <td className="py-2.5 pr-4 text-gray-500 text-xs">{t.date}</td>
                      <td className="py-2.5">
                        <span className={`badge ${
                          t.status === 'Abnormal' ? 'bg-red-100 text-red-700' :
                          t.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity History</h3>
          {c.activityLog.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No activity recorded.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-4">
                {c.activityLog.map((a,) => (
                  <div key={a.id} className="flex gap-4 items-start relative">
                    <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-white shrink-0 z-10">
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium text-gray-800">{a.action}</p>
                      <p className="text-xs text-gray-500">{a.performedBy} · {a.role}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.details}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(a.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 font-medium">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  );
}

function HistorySection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">None recorded</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
