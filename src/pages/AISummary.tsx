import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Brain, Sparkles, AlertCircle, CheckCircle, HelpCircle, ArrowLeft,
  ClipboardList, User, Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { statusBadgeClass, priorityBadgeClass } from '../utils/helpers';
import type { PatientCase } from '../types';

// ─── Disclaimer banner ────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800">
        <strong>Demonstration Output Only.</strong> The AI summaries below are <em>simulated</em> based on
        the recorded case data. They are <strong>not</strong> medical diagnoses, clinical opinions, or
        treatment recommendations. Always consult qualified medical professionals for clinical decisions.
      </div>
    </div>
  );
}

// ─── Generate simulated summary ───────────────────────────────────────────────

function generateSummary(c: PatientCase) {
  const p = c.patientInfo;
  const cl = c.clinicalInfo;
  const h = c.medicalHistory;
  const m = c.caseManagement;

  const summary = `${p.name}, a ${p.age}-year-old ${p.gender.toLowerCase()} from ${p.city}, ${p.state}, presented to ${c.hospitalName} with the chief complaint of "${cl.chiefComplaint}" lasting ${cl.duration || 'an unspecified duration'}. The case has been assigned to the ${cl.department} department under the care of ${cl.assignedClinician}. Current case status is "${m.reviewStatus}" with a "${m.priority}" priority designation. ${h.existingConditions.length > 0 ? `The patient has a known history of ${h.existingConditions.join(', ')}.` : 'No significant pre-existing conditions are recorded.'} ${h.currentMedications.length > 0 ? `They are currently on ${h.currentMedications.join(', ')}.` : ''} ${h.allergies.length > 0 ? `Known allergies include ${h.allergies.join(', ')}.` : 'No known drug allergies.'} ${cl.initialObservations ? `Initial clinical observations: ${cl.initialObservations}` : ''}`;

  const missing: string[] = [];
  if (!cl.initialObservations)           missing.push('Initial clinical observations');
  if (c.testResults.length === 0)        missing.push('Diagnostic test results');
  if (!h.familyHistory)                  missing.push('Family history');
  if (!m.followUpDate)                   missing.push('Follow-up date');
  if (m.notes === '')                    missing.push('Case notes');
  if (cl.symptoms.length === 0)          missing.push('Symptom list');
  if (!p.dateOfBirth)                    missing.push('Date of birth');
  if (!p.hospitalRegNumber)             missing.push('Hospital registration number');

  const questions: string[] = [
    `What is the exact onset and progression of "${cl.chiefComplaint}"?`,
    `Are there any associated symptoms not yet recorded?`,
    h.existingConditions.length > 0
      ? `How well-controlled are the existing conditions (${h.existingConditions.join(', ')})?`
      : 'Are there any underlying conditions not yet documented?',
    h.currentMedications.length > 0
      ? `Has the patient been adherent to their current medications?`
      : 'Is the patient on any over-the-counter or herbal medications?',
    `Has the patient travelled recently or been exposed to any infectious agents?`,
    `Is there a relevant occupational or environmental exposure history?`,
    `What investigations are planned or currently awaited?`,
    `Has consent been obtained for all planned procedures?`,
  ];

  return { summary, missing, questions };
}

// ─── AI Summary Page ──────────────────────────────────────────────────────────

export default function AISummary() {
  const { cases } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselect = searchParams.get('case') ?? '';

  const [selectedId, setSelectedId] = useState(preselect);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(!!preselect);

  const selectedCase = useMemo(() => cases.find(c => c.id === selectedId), [cases, selectedId]);
  const result = useMemo(() => selectedCase ? generateSummary(selectedCase) : null, [selectedCase]);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1200);
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary !px-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" /> AI Case Summary
          </h1>
          <p className="text-sm text-gray-500">Simulated clinical case intelligence — demonstration only</p>
        </div>
      </div>

      <Disclaimer />

      {/* Case Selector */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Select a Case</h2>
        <div className="flex gap-3 flex-col sm:flex-row">
          <select
            className="input-field flex-1"
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setGenerated(false); }}
            id="ai-case-selector"
          >
            <option value="">— Select a patient case —</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.patientInfo.name} ({c.clinicalInfo.department})
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedId || generating}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            id="generate-summary"
          >
            {generating ? (
              <><span className="animate-pulse-soft">Generating…</span></>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Summary</>
            )}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {generating && (
        <div className="card space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      )}

      {/* Results */}
      {generated && !generating && selectedCase && result && (
        <div className="space-y-4 animate-fade-in">

          {/* Patient header */}
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg shrink-0">
              {selectedCase.patientInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{selectedCase.patientInfo.name}</p>
              <p className="text-sm text-gray-500">{selectedCase.id} · {selectedCase.clinicalInfo.department}</p>
            </div>
            <div className="flex gap-2">
              <span className={`badge ${statusBadgeClass(selectedCase.caseManagement.reviewStatus)}`}>
                {selectedCase.caseManagement.reviewStatus}
              </span>
              <span className={`badge ${priorityBadgeClass(selectedCase.caseManagement.priority)}`}>
                {selectedCase.caseManagement.priority}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="card border-purple-100">
            <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Case Summary
              <span className="ml-auto text-[10px] font-normal text-purple-400 uppercase tracking-wide">Simulated · Demo Only</span>
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
          </div>

          {/* Two-column: missing + questions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Missing Information */}
            <div className="card border-amber-100 bg-amber-50">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Missing / Unverified Information
              </h3>
              {result.missing.length === 0 ? (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" /> All key fields are recorded
                </div>
              ) : (
                <ul className="space-y-2">
                  {result.missing.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Suggested Questions */}
            <div className="card border-blue-100 bg-blue-50">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Suggested Clinical Questions
              </h3>
              <ul className="space-y-2">
                {result.questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                    <span className="text-blue-400 shrink-0 mt-0.5">Q{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer disclaimer */}
          <div className="text-xs text-gray-400 text-center py-2">
            This AI summary is for demonstration purposes only and does not constitute medical advice.
            All clinical decisions should be made by qualified healthcare professionals.
          </div>
        </div>
      )}
    </div>
  );
}
