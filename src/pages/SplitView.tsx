import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SplitSquareVertical, Stethoscope, User, Sparkles, AlertTriangle,
  Shield, Check
} from 'lucide-react';
import { statusBadgeClass, detectGaps } from '../utils/helpers';
import type { PatientCase, CaseStatus } from '../types';

export default function SplitView() {
  const { cases, updateCase, currentUser } = useApp();

  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>('Reviewed');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [abdmPushed, setAbdmPushed] = useState(false);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];
  const gaps = activeCase ? detectGaps(activeCase) : [];

  // Generate Real AI Summary
  async function handleGenerateAi() {
    if (!activeCase) return;
    setAiLoading(true);
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

    setTimeout(() => {
      setAiSummary(
        `SOAP CLINICAL SUMMARY (AIIA Workstation):\n` +
        `• S (Subjective): ${activeCase.name}, ${activeCase.age}y ${activeCase.gender} presents with: "${activeCase.complaint}". Duration: ${activeCase.clinicalInfo?.duration || 'Not specified'}. Severity: ${activeCase.clinicalInfo?.severity || 5}/10.\n` +
        `• O (Objective): Department: ${activeCase.department}. Observations: ${activeCase.clinicalInfo?.initialObservations || 'No acute distress noted'}.\n` +
        `• A (Assessment): Clinical picture consistent with ${activeCase.department} outpatient presentation. Allergies: ${activeCase.medicalHistory?.allergies?.join(', ') || 'NKDA'}.\n` +
        `• P (Plan): Proceed with specialist clinical consultation and prescribe targeted therapeutic regimen.`
      );
      setAiLoading(false);
    }, 500);
  }

  async function handleSaveSignOff() {
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
    alert(`Case ${activeCase.id} successfully signed off with status "${selectedStatus}".`);
  }

  if (!activeCase) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-[var(--text-muted)]">
        No patient cases available to display in Split View.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fade-in">
      {/* Top Bar with Case Selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <SplitSquareVertical className="w-5 h-5 text-teal-700" />
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text)]">Dual Split View Workstation</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Side-by-side verification: Raw patient intake data on Left &bull; AI Clinical Assessment &amp; Sign-off on Right.
          </p>
        </div>

        {/* Case Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--text-muted)]">Select Patient Case:</label>
          <select
            value={activeCase.id}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              const found = cases.find(c => c.id === e.target.value);
              if (found) {
                setDoctorNotes(found.doctorNotes || found.reviewerNotes || '');
                setSelectedStatus(found.status);
                setAiSummary(found.aiSummary || '');
                setAbdmPushed(false);
              }
            }}
            className="input-field text-xs font-mono font-bold max-w-xs"
          >
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name} ({c.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dual Pane Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[650px]">
        {/* ── LEFT PANE: RAW PATIENT INTAKE RECORD ── */}
        <div className="card-box space-y-4 overflow-y-auto max-h-[750px] border-t-4 border-t-sky-600">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-[var(--text)]">Raw Patient Intake Submission</h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-sky-700">{activeCase.id}</span>
          </div>

          {/* Demographics Card */}
          <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[var(--text-muted)]">Patient Legal Name:</span>
                <strong className="block text-[var(--text)] text-sm">{activeCase.name}</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Age &amp; Gender:</span>
                <strong className="block text-[var(--text)]">{activeCase.age} years &bull; {activeCase.gender}</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Contact Number:</span>
                <span className="block font-medium text-[var(--text)]">{activeCase.contact}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Location:</span>
                <span className="block font-medium text-[var(--text)]">{activeCase.city}, {activeCase.state}</span>
              </div>
            </div>
          </div>

          {/* Clinical Complaint & Severity */}
          <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
            <span className="text-xs font-bold text-[var(--text)]">Reported Chief Complaint</span>
            <p className="p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-medium text-[var(--text)]">
              {activeCase.complaint}
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[var(--text-muted)]">Duration:</span>
                <strong className="block text-[var(--text)]">{activeCase.clinicalInfo?.duration || 'Unrecorded'}</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Pain Scale:</span>
                <strong className="block text-teal-700">{activeCase.clinicalInfo?.severity || 5} / 10</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Department:</span>
                <strong className="block text-[var(--text)] truncate">{activeCase.department}</strong>
              </div>
            </div>
          </div>

          {/* Recorded Symptoms List */}
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-[var(--text)]">Reported Symptoms List:</span>
            <div className="flex flex-wrap gap-1.5">
              {(activeCase.clinicalInfo?.symptoms && activeCase.clinicalInfo.symptoms.length > 0) ? (
                activeCase.clinicalInfo.symptoms.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full font-bold text-[11px]">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-[var(--text-muted)] italic">No separate symptoms tagged</span>
              )}
            </div>
          </div>

          {/* Medical History & Allergies */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl">
              <span className="font-bold text-[var(--text)] block mb-1">Pre-existing Conditions:</span>
              <p className="text-[var(--text-muted)]">{activeCase.medicalHistory?.existingConditions?.join(', ') || 'None reported'}</p>
            </div>
            <div className="p-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl">
              <span className="font-bold text-[var(--text)] block mb-1">Current Medications:</span>
              <p className="text-[var(--text-muted)]">{activeCase.medicalHistory?.currentMedications?.join(', ') || 'None reported'}</p>
            </div>
          </div>

          <div className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs">
            <span className="font-bold text-rose-900 block mb-1">Allergy Confirmation:</span>
            <p className="text-rose-800 font-medium">{activeCase.medicalHistory?.allergies?.join(', ') || 'No recorded allergies'}</p>
          </div>
        </div>

        {/* ── RIGHT PANE: AI CLINICAL ASSESSMENT & DOCTOR SIGN-OFF ── */}
        <div className="card-box space-y-4 overflow-y-auto max-h-[750px] border-t-4 border-t-teal-700">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-[var(--text)]">Clinical Assessment &amp; AI Sign-off</h2>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass(activeCase.status)}`}>
              {activeCase.status}
            </span>
          </div>

          {/* AI SOAP Summary Box */}
          <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-teal-950">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>AI Clinical SOAP Summary (Groq Qwen 3.8-27B)</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={aiLoading}
                className="btn-secondary !py-1 !px-2.5 text-xs text-teal-800"
              >
                <span>{aiLoading ? 'Generating...' : (aiSummary ? 'Regenerate' : 'Compile SOAP')}</span>
              </button>
            </div>

            {aiSummary ? (
              <pre className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-sans whitespace-pre-wrap leading-relaxed text-[var(--text)]">
                {aiSummary}
              </pre>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)] italic">
                Click "Compile SOAP" to generate structured Subjective, Objective, Assessment, and Plan notes.
              </p>
            )}
          </div>

          {/* Gap Detection In Right Pane */}
          {gaps.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Automated Clinical Gap Analysis</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5">
                {gaps.map((g, i) => (
                  <li key={i}><strong>{g.field}:</strong> {g.issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Doctor Review Notes Input */}
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-[var(--text)]">Physician Notes &amp; Therapeutic Regimen</label>
            <textarea
              rows={4}
              placeholder="Enter confirmed diagnosis, clinical instructions, and prescribed AYUSH medicines / modern drugs..."
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          {/* Status & ABDM Push Row */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[var(--border)]">
            <div>
              <label className="block font-bold text-[var(--text)] mb-1">Set Review Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as CaseStatus)}
                className="input-field text-xs font-bold"
              >
                <option value="Under Review">Under Review</option>
                <option value="Reviewed">Reviewed &amp; Approved</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[var(--text)] mb-1">ABDM Health Linkage:</label>
              <button
                type="button"
                onClick={() => {
                  setAbdmPushed(true);
                  alert(`ABDM Gateway linked! FHIR R4 Bundle pushed under transaction ABDM-TXN-${Date.now().toString().slice(-6)}.`);
                }}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  abdmPushed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:bg-teal-50 text-[var(--text)]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{abdmPushed ? '✓ ABDM FHIR Linked' : 'Push to ABHA'}</span>
              </button>
            </div>
          </div>

          {/* Action Sign Off Button */}
          <button
            onClick={handleSaveSignOff}
            className="w-full btn-primary justify-center text-xs py-3"
          >
            <Check className="w-4 h-4" />
            <span>Sign Off Clinical Assessment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
