import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Eye, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, statusBadgeClass, priorityBadgeClass } from '../utils/helpers';
import type { CaseStatus } from '../types';

// ─── Clinical Review Queue ────────────────────────────────────────────────────

export default function ReviewQueue() {
  const { cases, updateCase, currentUser } = useApp();
  const navigate = useNavigate();
  const [reviewCase, setReviewCase] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<CaseStatus>('Under Review');
  const [submitted, setSubmitted] = useState(false);

  // Only show cases that need review
  const queue = cases.filter(c =>
    ['Registered', 'Under Review', 'Awaiting Tests', 'Awaiting Clinical Review'].includes(c.caseManagement.reviewStatus)
  ).sort((a, b) => {
    const pOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Normal: 2, Low: 3 };
    return (pOrder[a.caseManagement.priority] ?? 2) - (pOrder[b.caseManagement.priority] ?? 2);
  });

  const completedCases = cases.filter(c =>
    ['Completed', 'Closed', 'In Treatment', 'Follow-Up', 'Reviewed'].includes(c.caseManagement.reviewStatus)
  );

  function openReview(id: string) {
    const c = cases.find(x => x.id === id);
    if (c) setNewStatus(c.caseManagement.reviewStatus);
    setReviewCase(id);
    setNotes('');
    setSubmitted(false);
  }

  function submitReview() {
    if (!reviewCase) return;
    const c = cases.find(x => x.id === reviewCase);
    if (!c) return;

    const reviewerName = currentUser?.name || 'Dr. Ramesh Sharma, MD (Ayu)';
    const reviewerRole = currentUser?.role || 'doctor';

    const updated = {
      ...c,
      caseManagement: { ...c.caseManagement, reviewStatus: newStatus },
      reviewerNotes: notes,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityLog: [
        ...c.activityLog,
        {
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          action: 'Clinical Review Completed',
          performedBy: reviewerName,
          role: reviewerRole,
          details: `Status updated to "${newStatus}". Notes: ${notes || 'No notes added.'}`,
        },
      ],
    };
    updateCase(updated);
    setSubmitted(true);
    setTimeout(() => { setReviewCase(null); setSubmitted(false); }, 1500);
  }

  const reviewingCase = reviewCase ? cases.find(c => c.id === reviewCase) : null;

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600" /> Clinical Review Queue
          </h1>
          <p className="text-sm text-gray-500">{queue.length} cases awaiting review</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Review', count: queue.length, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
          { label: 'Critical/High',  count: queue.filter(c => ['Critical','High'].includes(c.caseManagement.priority)).length, color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
          { label: 'Reviewed Today', count: completedCases.filter(c => {
              const d = c.reviewedAt ? new Date(c.reviewedAt) : null;
              if (!d) return false;
              const today = new Date();
              return d.toDateString() === today.toDateString();
            }).length, color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className={`card !p-4 border ${color}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {/* ── Queue Table ────────────────────────────────────────────────────── */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Pending Cases</h2>
        </div>
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1">No cases awaiting review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b border-gray-100">
                  <th className="text-left py-3 px-5">Case ID</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Department</th>
                  <th className="text-left py-3 px-4 hidden sm:table-cell">Chief Complaint</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Priority</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Created</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queue.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="py-3 px-5">
                      <span className="font-mono text-xs font-semibold text-navy-700">{c.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{c.patientInfo.name}</p>
                      <p className="text-xs text-gray-500">{c.patientInfo.age}y · {c.patientInfo.gender}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-xs text-gray-600">{c.clinicalInfo.department}</td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <p className="text-xs text-gray-600 max-w-48 truncate">{c.clinicalInfo.chiefComplaint}</p>
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
                    <td className="py-3 px-4 hidden lg:table-cell text-xs text-gray-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/cases/${c.id}`)}
                          className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-md transition-colors"
                          title="View Case"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openReview(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-md hover:bg-amber-600 transition-colors"
                          id={`review-${c.id}`}
                        >
                          <ClipboardList className="w-3 h-3" /> Review
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

      {/* ── Review Modal ──────────────────────────────────────────────────── */}
      {reviewingCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
            {submitted ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Review Submitted</h3>
                <p className="text-sm text-gray-500 mt-1">{reviewCase}</p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Clinical Review</h3>
                    <p className="text-sm text-gray-500">{reviewingCase.id} — {reviewingCase.patientInfo.name}</p>
                  </div>
                </div>

                {/* Quick patient info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
                  <p><span className="text-gray-500">Complaint:</span> {reviewingCase.clinicalInfo.chiefComplaint}</p>
                  <p><span className="text-gray-500">Department:</span> {reviewingCase.clinicalInfo.department}</p>
                  <p><span className="text-gray-500">Clinician:</span> {reviewingCase.clinicalInfo.assignedClinician}</p>
                  <p><span className="text-gray-500">Priority:</span>
                    <span className={`badge ml-2 ${priorityBadgeClass(reviewingCase.caseManagement.priority)}`}>
                      {reviewingCase.caseManagement.priority}
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="input-label">Update Status</label>
                    <select
                      className="input-field"
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as CaseStatus)}
                      id="review-new-status"
                    >
                      {(['Under Review', 'Awaiting Tests', 'In Treatment', 'Follow-Up', 'Completed', 'Closed'] as CaseStatus[]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Reviewer Notes</label>
                    <textarea
                      className="input-field resize-none"
                      rows={4}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Enter clinical review findings, recommendations, or decisions…"
                      id="review-notes"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-5">
                  <button onClick={() => setReviewCase(null)} className="btn-secondary">Cancel</button>
                  <button onClick={submitReview} className="btn-teal" id="submit-review">
                    <CheckCircle className="w-4 h-4" /> Submit Review
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
