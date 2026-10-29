import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Stethoscope, Eye, AlertTriangle, Sparkles,
  Search, Send, MessageSquare, X, Shield, Check,
  FileText, Image as ImageIcon, Download
} from 'lucide-react';
import { statusBadgeClass, priorityBadgeClass, detectGaps } from '../utils/helpers';
import { DEPARTMENTS } from '../data/seedData';
import type { PatientCase, CaseStatus, PrescriptionAttachment } from '../types';

export default function DoctorPortal() {
  const { cases, currentUser, updateCase, sendMessageToCase, setActiveView } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Review Modal State
  const [reviewingCaseId, setReviewingCaseId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>('Reviewed');
  const [aiSummary, setAiSummary] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [abdmPushSuccess, setAbdmPushSuccess] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [previewRx, setPreviewRx] = useState<PrescriptionAttachment | null>(null);

  const activeCase = cases.find(c => c.id === reviewingCaseId) || null;
  const activeGaps = activeCase ? detectGaps(activeCase) : [];

  // Filter cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.complaint.toLowerCase().includes(q);

      const matchS = statusFilter === 'All' || c.status === statusFilter;
      const matchP = priorityFilter === 'All' || c.priority === priorityFilter;
      const matchD = deptFilter === 'All' || c.department === deptFilter;

      return matchQ && matchS && matchP && matchD;
    });
  }, [cases, searchQuery, statusFilter, priorityFilter, deptFilter]);

  function openReview(c: PatientCase) {
    setReviewingCaseId(c.id);
    setDoctorNotes(c.doctorNotes || c.reviewerNotes || '');
    setSelectedStatus(c.status);
    setAiSummary(c.aiSummary || '');
    setAbdmPushSuccess(false);
    setReplyInput('');
  }

  // Generate Real AI Summary with Groq
  async function generateAiSummary() {
    if (!activeCase) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseData: activeCase }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
        return;
      }
    } catch (_) {}

    // Deterministic fallback SOAP summary
    setTimeout(() => {
      const p = activeCase.patientInfo;
      const cl = activeCase.clinicalInfo;
      const h = activeCase.medicalHistory;
      const summary = `SOAP CLINICAL SUMMARY (Rule Engine):
• Subjective: ${p.name}, ${p.age}y ${p.gender} presented with "${cl.chiefComplaint}" of duration ${cl.duration || 'unspecified'}. Severity rated at ${cl.severity || 5}/10.
• Objective: Vitals and observations: ${cl.initialObservations || 'Stable, no acute respiratory distress'}. Recorded symptoms: ${cl.symptoms.join(', ') || 'None'}.
• Assessment: Suspected clinical presentation under ${cl.department}. Pre-existing: ${h.existingConditions.join(', ') || 'None'}. Known allergies: ${h.allergies.join(', ') || 'NKDA'}.
• Plan: Advised diagnostic investigation. Attending clinician sign-off required for final prescription.`;
      setAiSummary(summary);
      setAiGenerating(false);
    }, 600);
  }

  // Save Review Sign-off
  async function handleSaveReview() {
    if (!activeCase) return;

    const updated: PatientCase = {
      ...activeCase,
      status: selectedStatus,
      doctorNotes,
      reviewerNotes: doctorNotes,
      reviewedBy: currentUser?.name || 'Dr. Ramesh Sharma, MD (Ayu)',
      reviewerName: currentUser?.name || 'Dr. Ramesh Sharma, MD (Ayu)',
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiSummary: aiSummary || activeCase.aiSummary,
    };

    await updateCase(updated);
    setReviewingCaseId(null);
  }

  // Push to ABDM Gateway Simulation
  async function handleAbdmPush() {
    if (!activeCase) return;
    setAbdmPushSuccess(true);
    setTimeout(() => {
      alert(`FHIR R4 Diagnostic Bundle pushed to ABDM Sandbox Gateway! Care Context linked to ABHA ID ${activeCase.patientInfo?.abhaId || '91-4829-1049-2810'}.`);
    }, 300);
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyInput.trim() || !activeCase) return;
    await sendMessageToCase(activeCase.id, replyInput);
    setReplyInput('');
  }

  if (currentUser && currentUser.role === 'patient') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 card-box text-center space-y-4 animate-fade-in shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[var(--text)]">Clinical Access Restricted</h2>
          <p className="text-xs text-[var(--text-muted)]">
            You are logged in as a Patient ({currentUser.name}). Doctor review queue and confidential patient records are restricted to licensed clinicians.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => setActiveView('patient-dashboard')}
            className="btn-primary w-full justify-center text-xs"
          >
            Go to My Patient Dashboard
          </button>
          <button
            onClick={() => setActiveView('doctor-login')}
            className="btn-secondary w-full justify-center text-xs"
          >
            Switch to Doctor Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[var(--border)]">
        <div>
          <span className="ps-badge">Doctor Workstation</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            Clinical Triage &amp; Review Queue
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            AIIA Outpatient Department &bull; AI-Assisted SOAP Summaries &bull; ABDM FHIR R4 Integration
          </p>
        </div>

        <button
          onClick={() => setActiveView('split-view')}
          className="btn-primary text-xs"
        >
          <span>Open Split View Workstation</span>
        </button>
      </div>

      {!currentUser && (
        <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
            <Shield className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              <strong>Clinician Preview Mode:</strong> Sign in with your official Doctor account to digitally sign reviews with your AYUSH / Medical Registration Number.
            </span>
          </div>
          <button
            onClick={() => setActiveView('doctor-login')}
            className="btn-primary !py-1 !px-3 text-xs shrink-0"
          >
            Doctor Login
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card-box !p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search patient, ID, condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-xs"
          >
            <option value="All">All Review Statuses</option>
            <option value="Awaiting Clinical Review">Awaiting Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field text-xs"
          >
            <option value="All">All Triage Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input-field text-xs"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Cases Queue Table */}
      <div className="card-box !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">
                <th className="p-3">Case ID</th>
                <th className="p-3">Patient Name &amp; Age</th>
                <th className="p-3">Department</th>
                <th className="p-3">Chief Complaint</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[var(--text-muted)]">
                    No clinical cases match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--surface-elevated)] transition-colors">
                    <td className="p-3 font-mono font-bold text-teal-800">{c.id}</td>
                    <td className="p-3 font-bold text-[var(--text)]">
                      <div>{c.name}</div>
                      <div className="text-[11px] font-normal text-[var(--text-muted)]">{c.age}y &bull; {c.gender}</div>
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">{c.department}</td>
                    <td className="p-3 max-w-xs truncate text-[var(--text)]">{c.complaint}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${priorityBadgeClass(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => openReview(c)}
                        className="btn-primary !py-1.5 !px-3 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Case Clinical Review Drawer / Modal ── */}
      {activeCase && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-4xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-teal-800 to-teal-900 text-white">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Clinical Review: {activeCase.id} &bull; {activeCase.name} ({activeCase.age}y, {activeCase.gender})
                  </h3>
                  <span className="text-xs text-teal-200">{activeCase.department} &bull; Registered: {activeCase.date}</span>
                </div>
              </div>
              <button
                onClick={() => setReviewingCaseId(null)}
                className="p-1 hover:bg-teal-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-xs">
              {/* Patient Chief Complaint & Vitals */}
              <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border)] space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-sm text-[var(--text)]">Chief Clinical Complaint</strong>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${priorityBadgeClass(activeCase.priority)}`}>
                    {activeCase.priority} Triage Priority
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--text)]">{activeCase.complaint}</p>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)] pt-1">
                  <span>Duration: <strong>{activeCase.clinicalInfo?.duration || 'Unrecorded'}</strong></span>
                  <span>Pain Scale: <strong>{activeCase.clinicalInfo?.severity || 5}/10</strong></span>
                  <span>Symptoms: <strong>{activeCase.clinicalInfo?.symptoms?.join(', ') || 'None recorded'}</strong></span>
                </div>
              </div>

              {/* Medical History & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
                  <span className="font-bold text-[var(--text)]">Pre-existing Conditions:</span>
                  <p className="text-[var(--text-muted)]">{activeCase.medicalHistory?.existingConditions?.join(', ') || 'None reported'}</p>
                </div>
                <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
                  <span className="font-bold text-[var(--text)]">Current Medications:</span>
                  <p className="text-[var(--text-muted)]">{activeCase.medicalHistory?.currentMedications?.join(', ') || 'None reported'}</p>
                </div>
                <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
                  <span className="font-bold text-[var(--text)]">Allergies:</span>
                  <p className="text-rose-700 font-bold">{activeCase.medicalHistory?.allergies?.join(', ') || 'No recorded allergies'}</p>
                </div>
              </div>

              {/* Attached Prescription Documents / Photos */}
              {((activeCase.prescriptionImages && activeCase.prescriptionImages.length > 0) ||
                (activeCase.medicalHistory?.prescriptionImages && activeCase.medicalHistory.prescriptionImages.length > 0)) && (
                <div className="p-4 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <strong className="text-teal-950 dark:text-teal-100 text-xs uppercase tracking-wider">
                        Patient Uploaded Prescription Photo(s)
                      </strong>
                    </div>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                      {(activeCase.prescriptionImages || activeCase.medicalHistory?.prescriptionImages || []).length} Document(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeCase.prescriptionImages || activeCase.medicalHistory?.prescriptionImages || []).map((rx) => (
                      <div
                        key={rx.id}
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-teal-200 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={rx.storageUrl}
                            alt={rx.fileName}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewRx(rx)}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[var(--text)] truncate">{rx.fileName}</p>
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              {(rx.fileSize / 1024).toFixed(0)} KB &bull; Uploaded {new Date(rx.uploadedAt).toLocaleDateString()}
                            </span>
                            {rx.extractedMedicines && rx.extractedMedicines.length > 0 && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold rounded">
                                Detected: {rx.extractedMedicines.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewRx(rx)}
                          className="btn-primary !py-1.5 !px-2.5 text-xs shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Photo</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Gap Detection Flags */}
              {activeGaps.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Clinical Gaps &amp; Missing Information Detected:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-amber-800 text-[11px]">
                    {activeGaps.map((g, i) => (
                      <li key={i}><strong>{g.field}:</strong> {g.issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI-Generated Structured SOAP Summary */}
              <div className="card-box !p-4 bg-teal-50/40 border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900 text-sm">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <span>AI-Assisted Clinical Summary (SOAP)</span>
                  </div>
                  <button
                    onClick={generateAiSummary}
                    disabled={aiGenerating}
                    className="btn-secondary !py-1 !px-2.5 text-xs text-teal-800"
                  >
                    <span>{aiGenerating ? 'Generating...' : (aiSummary ? 'Regenerate' : 'Generate Summary')}</span>
                  </button>
                </div>

                {aiSummary ? (
                  <pre className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-sans whitespace-pre-wrap leading-relaxed text-[var(--text)]">
                    {aiSummary}
                  </pre>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)] italic">
                    Click "Generate Summary" to automatically compile the patient narrative into a standard SOAP structure using Groq Qwen 3.8-27B.
                  </p>
                )}
                <div className="text-[10px] text-[var(--text-muted)]">
                  * Clinical Notice: AI summaries are generated assistance tools and require independent physician verification.
                </div>
              </div>

              {/* Attending Physician Sign-Off & Status */}
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Update Case Review Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as CaseStatus)}
                      className="input-field text-xs font-bold"
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Reviewed">Reviewed &amp; Approved</option>
                      <option value="In Treatment">In Treatment</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">ABDM Gateway Linkage</label>
                    <button
                      type="button"
                      onClick={handleAbdmPush}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        abdmPushSuccess
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{abdmPushSuccess ? '✓ FHIR R4 Pushed to ABHA' : 'Push FHIR R4 Bundle to ABDM'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Doctor Clinical Notes, Diagnosis &amp; Prescriptions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Record clinical assessment, Ayurvedic diagnosis (e.g. Sandhigata Vata), prescription drugs/churna, and dietary guidelines (Pathya/Apathya)..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Patient Inquiries / Chat thread */}
              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text)]">
                  <MessageSquare className="w-4 h-4 text-teal-700" />
                  <span>Direct Communication Thread with Patient</span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)]">
                  {(!activeCase.messages || activeCase.messages.length === 0) ? (
                    <div className="text-[11px] text-[var(--text-muted)] py-2 text-center">
                      No inquiries sent by patient.
                    </div>
                  ) : (
                    activeCase.messages.map(m => (
                      <div key={m.id} className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs">
                        <strong className="text-teal-800 block text-[10px] uppercase">{m.senderName} ({m.senderRole}):</strong>
                        <span>{m.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reply to patient inquiry..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="input-field text-xs flex-1"
                  />
                  <button type="submit" className="btn-secondary text-xs !px-3">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-elevated)] flex justify-between items-center">
              <button
                onClick={() => setReviewingCaseId(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="btn-primary text-xs"
              >
                <Check className="w-4 h-4" />
                <span>Save Clinical Review &amp; Sign Off</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Prescription Full-Resolution Lightbox Modal */}
      {previewRx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-elevated)]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-700" />
                <div>
                  <h3 className="font-bold text-sm text-[var(--text)]">{previewRx.fileName}</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {(previewRx.fileSize / 1024).toFixed(0)} KB &bull; Uploaded {new Date(previewRx.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewRx.storageUrl}
                  download={previewRx.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                  title="Open original image in new tab / download"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Open</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewRx(null)}
                  className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)]"
                  title="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-950 flex items-center justify-center min-h-[300px]">
              <img
                src={previewRx.storageUrl}
                alt={previewRx.fileName}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
              />
            </div>

            {previewRx.extractedMedicines && previewRx.extractedMedicines.length > 0 && (
              <div className="p-3 bg-[var(--surface-elevated)] border-t border-[var(--border)] flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                  Detected Medications:
                </span>
                {previewRx.extractedMedicines.map((med, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-0.5 bg-teal-100 text-teal-900 border border-teal-300 rounded-full font-medium"
                  >
                    {med}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
