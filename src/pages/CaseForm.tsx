import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Check, User, Stethoscope,
  ClipboardList, Settings, Eye, X, Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateCaseId } from '../utils/helpers';
import { INDIAN_STATES, DEPARTMENTS, CLINICIANS } from '../data/seedData';
import type {
  PatientCase, PatientInfo, ClinicalInfo, MedicalHistory,
  CaseManagement, CasePriority, CaseStatus, Department, Gender,
} from '../types';

// ─── Step Definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Patient Info',    icon: User },
  { id: 2, label: 'Clinical Info',  icon: Stethoscope },
  { id: 3, label: 'Medical History',icon: ClipboardList },
  { id: 4, label: 'Case Management',icon: Settings },
  { id: 5, label: 'Review',         icon: Eye },
];

// ─── Blank templates ──────────────────────────────────────────────────────────

function blankPatient(): PatientInfo {
  return {
    name: '', age: 0, dateOfBirth: '', gender: 'Male',
    contactNumber: '+91 ', state: '', district: '', city: '',
    pinCode: '', hospitalRegNumber: '',
  };
}

function blankClinical(): ClinicalInfo {
  return {
    chiefComplaint: '', symptoms: [], duration: '',
    department: 'General Medicine', assignedClinician: '', initialObservations: '',
  };
}

function blankHistory(): MedicalHistory {
  return {
    existingConditions: [], currentMedications: [],
    allergies: [], previousProcedures: [], familyHistory: '',
  };
}

function blankManagement(): CaseManagement {
  return {
    priority: 'Normal', assignedDepartment: 'General Medicine',
    reviewStatus: 'Registered', followUpDate: '',
    notes: '', nextActions: '',
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CaseForm() {
  const { id } = useParams();
  const { cases, addCase, updateCase, currentUser } = useApp();
  const navigate = useNavigate();

  const existing = id ? cases.find(c => c.id === id) : undefined;

  const [step, setStep] = useState(1);
  const [patient, setPatient]     = useState<PatientInfo>(existing?.patientInfo ?? blankPatient());
  const [clinical, setClinical]   = useState<ClinicalInfo>(existing?.clinicalInfo ?? blankClinical());
  const [history, setHistory]     = useState<MedicalHistory>(existing?.medicalHistory ?? blankHistory());
  const [mgmt, setMgmt]           = useState<CaseManagement>(existing?.caseManagement ?? blankManagement());
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [saved, setSaved]         = useState(false);
  const completenessItems = [
    { label: 'Patient information', complete: Boolean(patient.name.trim() && patient.age > 0 && patient.contactNumber.trim() !== '+91 ' && patient.state && patient.city.trim()) },
    { label: 'Clinical information', complete: Boolean(clinical.chiefComplaint.trim() && clinical.department && clinical.assignedClinician) },
    { label: 'Symptoms recorded', complete: clinical.symptoms.length > 0 },
    { label: 'Medical history recorded', complete: Boolean(history.existingConditions.length || history.currentMedications.length || history.allergies.length || history.previousProcedures.length || history.familyHistory.trim()) },
    { label: 'Case management', complete: Boolean(mgmt.priority && mgmt.assignedDepartment && mgmt.reviewStatus) },
  ];

  const completedItems = completenessItems.filter(item => item.complete).length;
  const completenessScore = Math.round((completedItems / completenessItems.length) * 100);
  const memoryPrompts = [
    !patient.dateOfBirth.trim() && 'Do you know the patient’s date of birth?',
    !clinical.duration.trim() && 'When did the symptoms start, and how long have they lasted?',
    clinical.symptoms.length === 0 && 'Are there any other symptoms to record?',
    history.allergies.length === 0 && 'Please confirm whether the patient has any known allergies.',
    history.currentMedications.length === 0 && 'Is the patient currently taking any medications?',
    !history.familyHistory.trim() && 'Is there any relevant family medical history?',
  ].filter((prompt): prompt is string => Boolean(prompt));

  // ── Tag-input helper ─────────────────────────────────────────────────────

  function TagInput({
    items, onAdd, onRemove, placeholder, id: inputId,
  }: {
    items: string[];
    onAdd: (v: string) => void;
    onRemove: (v: string) => void;
    placeholder: string;
    id: string;
  }) {
    const [val, setVal] = useState('');
    return (
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map(item => (
            <span key={item} className="inline-flex items-center gap-1 bg-navy-50 text-navy-700 text-xs px-2.5 py-1 rounded-full border border-navy-200">
              {item}
              <button onClick={() => onRemove(item)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            className="input-field"
            placeholder={placeholder}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ',') && val.trim()) {
                e.preventDefault();
                onAdd(val.trim());
                setVal('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
            className="btn-secondary !px-3"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add</p>
      </div>
    );
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!patient.name.trim())            errs.name = 'Patient name is required';
      if (!patient.age || patient.age < 0) errs.age  = 'Valid age is required';
      if (!patient.gender)                 errs.gender = 'Gender is required';
      if (!patient.contactNumber || patient.contactNumber === '+91 ')
                                           errs.contactNumber = 'Contact number is required';
      if (!patient.state)                  errs.state = 'State is required';
      if (!patient.city.trim())            errs.city  = 'City is required';
    }
    if (s === 2) {
      if (!clinical.chiefComplaint.trim()) errs.chiefComplaint = 'Chief complaint is required';
      if (!clinical.department)           errs.department = 'Department is required';
      if (!clinical.assignedClinician)    errs.assignedClinician = 'Clinician is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 5));
  }
  function prevStep() { setStep(s => Math.max(s - 1, 1)); setErrors({}); }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (existing) {
      const updated: PatientCase = {
        ...existing,
        patientInfo: patient,
        clinicalInfo: clinical,
        medicalHistory: history,
        caseManagement: mgmt,
        updatedAt: new Date().toISOString(),
      };
      updateCase(updated);
    } else {
      const newCase: PatientCase = {
        id: generateCaseId(cases.map(c => c.id)),
        patientInfo: patient,
        clinicalInfo: clinical,
        medicalHistory: history,
        caseManagement: mgmt,
        hospitalName: currentUser.hospitalName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.name,
        reviewerNotes: '',
        testResults: [],
        activityLog: [{
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          action: 'Case Created',
          performedBy: currentUser.name,
          role: currentUser.role,
          details: 'Case registered via 5-step form',
        }],
      };
      addCase(newCase);
    }
    setSaved(true);
    setTimeout(() => navigate('/cases'), 1500);
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {existing ? 'Case Updated' : 'Case Registered'} Successfully
        </h2>
        <p className="text-sm text-gray-500 mt-1">Redirecting to cases list…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {existing ? `Edit Case — ${existing.id}` : 'Register New Patient Case'}
        </h1>
        <p className="text-sm text-gray-500">
          {existing ? 'Update case details' : 'Complete all steps to register a new patient case'}
        </p>
      </div>

      {/* ── Step Progress ─────────────────────────────────────────────────── */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <div
                  className={[
                    'step-indicator transition-all duration-300',
                    done   ? 'bg-teal-500 text-white' :
                    active ? 'bg-navy-700 text-white ring-2 ring-navy-300' :
                             'bg-gray-100 text-gray-400',
                  ].join(' ')}
                >
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-navy-700' : done ? 'text-teal-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors duration-300 ${step > s.id ? 'bg-teal-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step Content ──────────────────────────────────────────────────── */}
      <div className="card">

        {/* Step 1: Patient Information */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Patient Information</h2>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-semibold text-gray-800">Case Completeness Score</h3>
    <span className="text-lg font-bold text-teal-700">{completenessScore}%</span>
  </div>
  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
    <div
      className="h-full rounded-full bg-teal-500 transition-all duration-300"
      style={{ width: `${completenessScore}%` }}
    />
  </div>
  <p className="text-sm text-gray-600 mt-2">
    {completedItems} of {completenessItems.length} case sections completed.
  </p>
  <ul className="mt-2 space-y-1">
    {completenessItems.map(item => (
      <li key={item.label} className="text-sm text-gray-700 flex items-center gap-2">
        <span>{item.complete ? '✓' : '○'}</span>
        {item.label}
      </li>
    ))}
  </ul>
</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="input-label">Full Name *</label>
                <input id="patient-name" className={`input-field ${errors.name ? 'border-red-400' : ''}`} value={patient.name}
                  onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Arun Kumar Sharma" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="input-label">Age *</label>
                <input id="patient-age" type="number" min={0} max={120} className={`input-field ${errors.age ? 'border-red-400' : ''}`} value={patient.age || ''}
                  onChange={e => setPatient(p => ({ ...p, age: Number(e.target.value) }))} placeholder="e.g. 45" />
                {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
              </div>
              <div>
                <label className="input-label">Date of Birth (DD-MM-YYYY)</label>
                <input id="patient-dob" className="input-field" value={patient.dateOfBirth}
                  onChange={e => setPatient(p => ({ ...p, dateOfBirth: e.target.value }))} placeholder="e.g. 15-08-1979" />
              </div>
              <div>
                <label className="input-label">Gender *</label>
                <select id="patient-gender" className={`input-field ${errors.gender ? 'border-red-400' : ''}`} value={patient.gender}
                  onChange={e => setPatient(p => ({ ...p, gender: e.target.value as Gender }))}>
                  {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Contact Number (+91) *</label>
                <input id="patient-contact" className={`input-field ${errors.contactNumber ? 'border-red-400' : ''}`} value={patient.contactNumber}
                  onChange={e => setPatient(p => ({ ...p, contactNumber: e.target.value }))} placeholder="+91 98765 43210" />
                {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
              </div>
              <div>
                <label className="input-label">State *</label>
                <select id="patient-state" className={`input-field ${errors.state ? 'border-red-400' : ''}`} value={patient.state}
                  onChange={e => setPatient(p => ({ ...p, state: e.target.value }))}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className="input-label">District</label>
                <input id="patient-district" className="input-field" value={patient.district}
                  onChange={e => setPatient(p => ({ ...p, district: e.target.value }))} placeholder="e.g. Bengaluru Urban" />
              </div>
              <div>
                <label className="input-label">City *</label>
                <input id="patient-city" className={`input-field ${errors.city ? 'border-red-400' : ''}`} value={patient.city}
                  onChange={e => setPatient(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Bengaluru" />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="input-label">PIN Code</label>
                <input id="patient-pin" className="input-field" value={patient.pinCode} maxLength={6}
                  onChange={e => setPatient(p => ({ ...p, pinCode: e.target.value }))} placeholder="e.g. 560001" />
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">Hospital / Patient Registration Number</label>
                <input id="patient-reg" className="input-field" value={patient.hospitalRegNumber}
                  onChange={e => setPatient(p => ({ ...p, hospitalRegNumber: e.target.value }))} placeholder="e.g. NIMH-2026-1234" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Clinical Information */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Clinical Information</h2>
            <div>
              <label className="input-label">Chief Complaint *</label>
              <textarea id="chief-complaint" rows={2} className={`input-field resize-none ${errors.chiefComplaint ? 'border-red-400' : ''}`}
                value={clinical.chiefComplaint}
                onChange={e => setClinical(c => ({ ...c, chiefComplaint: e.target.value }))}
                placeholder="e.g. Chest pain radiating to left arm" />
              {errors.chiefComplaint && <p className="text-xs text-red-500 mt-1">{errors.chiefComplaint}</p>}
            </div>
            <div>
              <label className="input-label">Symptoms</label>
              <TagInput
                id="symptoms-input"
                items={clinical.symptoms}
                onAdd={v => setClinical(c => ({ ...c, symptoms: [...c.symptoms, v] }))}
                onRemove={v => setClinical(c => ({ ...c, symptoms: c.symptoms.filter(s => s !== v) }))}
                placeholder="e.g. Fever, Headache"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Duration of Symptoms</label>
                <input id="duration" className="input-field" value={clinical.duration}
                  onChange={e => setClinical(c => ({ ...c, duration: e.target.value }))} placeholder="e.g. 3 days" />
              </div>
              <div>
                <label className="input-label">Department *</label>
                <select id="dept" className={`input-field ${errors.department ? 'border-red-400' : ''}`} value={clinical.department}
                  onChange={e => setClinical(c => ({ ...c, department: e.target.value as Department }))}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
              </div>
              <div>
                <label className="input-label">Assigned Clinician *</label>
                <select id="clinician" className={`input-field ${errors.assignedClinician ? 'border-red-400' : ''}`} value={clinical.assignedClinician}
                  onChange={e => setClinical(c => ({ ...c, assignedClinician: e.target.value }))}>
                  <option value="">Select Clinician</option>
                  {CLINICIANS.map(cl => <option key={cl}>{cl}</option>)}
                </select>
                {errors.assignedClinician && <p className="text-xs text-red-500 mt-1">{errors.assignedClinician}</p>}
              </div>
            </div>
            <div>
              <label className="input-label">Initial Observations</label>
              <textarea id="initial-obs" rows={3} className="input-field resize-none" value={clinical.initialObservations}
                onChange={e => setClinical(c => ({ ...c, initialObservations: e.target.value }))}
                placeholder="e.g. BP 130/80 mmHg, HR 88 bpm, Temperature 38.5°C…" />
            </div>
          </div>
        )}

        {/* Step 3: Medical History */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Medical History</h2>
            <div>
              <label className="input-label">Existing Medical Conditions</label>
              <TagInput id="conditions-input" items={history.existingConditions}
                onAdd={v => setHistory(h => ({ ...h, existingConditions: [...h.existingConditions, v] }))}
                onRemove={v => setHistory(h => ({ ...h, existingConditions: h.existingConditions.filter(x => x !== v) }))}
                placeholder="e.g. Type 2 Diabetes" />
            </div>
            <div>
              <label className="input-label">Current Medications</label>
              <TagInput id="medications-input" items={history.currentMedications}
                onAdd={v => setHistory(h => ({ ...h, currentMedications: [...h.currentMedications, v] }))}
                onRemove={v => setHistory(h => ({ ...h, currentMedications: h.currentMedications.filter(x => x !== v) }))}
                placeholder="e.g. Metformin 500mg BD" />
            </div>
            <div>
              <label className="input-label">Allergies</label>
              <TagInput id="allergies-input" items={history.allergies}
                onAdd={v => setHistory(h => ({ ...h, allergies: [...h.allergies, v] }))}
                onRemove={v => setHistory(h => ({ ...h, allergies: h.allergies.filter(x => x !== v) }))}
                placeholder="e.g. Penicillin" />
            </div>
            <div>
              <label className="input-label">Previous Procedures / Surgeries</label>
              <TagInput id="procedures-input" items={history.previousProcedures}
                onAdd={v => setHistory(h => ({ ...h, previousProcedures: [...h.previousProcedures, v] }))}
                onRemove={v => setHistory(h => ({ ...h, previousProcedures: h.previousProcedures.filter(x => x !== v) }))}
                placeholder="e.g. Appendectomy (2015)" />
            </div>
            <div>
              <label className="input-label">Relevant Family History</label>
              <textarea id="family-history" rows={3} className="input-field resize-none" value={history.familyHistory}
                onChange={e => setHistory(h => ({ ...h, familyHistory: e.target.value }))}
                placeholder="e.g. Father had coronary artery disease." />
            </div>
          </div>
        )}

        {/* Step 4: Case Management */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Case Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Priority</label>
                <select id="priority" className="input-field" value={mgmt.priority}
                  onChange={e => setMgmt(m => ({ ...m, priority: e.target.value as CasePriority }))}>
                  {(['Low', 'Normal', 'High', 'Critical'] as CasePriority[]).map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Assigned Department</label>
                <select id="assigned-dept" className="input-field" value={mgmt.assignedDepartment}
                  onChange={e => setMgmt(m => ({ ...m, assignedDepartment: e.target.value as Department }))}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Review Status</label>
                <select id="review-status" className="input-field" value={mgmt.reviewStatus}
                  onChange={e => setMgmt(m => ({ ...m, reviewStatus: e.target.value as CaseStatus }))}>
                  {(['Registered', 'Under Review', 'Awaiting Tests', 'In Treatment', 'Follow-Up', 'Completed', 'Closed'] as CaseStatus[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Follow-Up Date (DD-MM-YYYY)</label>
                <input id="followup-date" className="input-field" value={mgmt.followUpDate}
                  onChange={e => setMgmt(m => ({ ...m, followUpDate: e.target.value }))} placeholder="e.g. 15-11-2026" />
              </div>
            </div>
            <div>
              <label className="input-label">Case Notes</label>
              <textarea id="case-notes" rows={3} className="input-field resize-none" value={mgmt.notes}
                onChange={e => setMgmt(m => ({ ...m, notes: e.target.value }))}
                placeholder="Clinical notes, observations, treatment plan summary…" />
            </div>
            <div>
              <label className="input-label">Next Actions</label>
              <textarea id="next-actions" rows={2} className="input-field resize-none" value={mgmt.nextActions}
                onChange={e => setMgmt(m => ({ ...m, nextActions: e.target.value }))}
                placeholder="e.g. Order MRI, schedule follow-up, refer to cardiologist…" />
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Review &amp; Submit</h2>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-semibold text-gray-800">Case Completeness Score</h3>
    <span className="text-lg font-bold text-teal-700">{completenessScore}%</span>
  </div>
  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
    <div
      className="h-full rounded-full bg-teal-500 transition-all duration-300"
      style={{ width: `${completenessScore}%` }}
    />
  </div>
  <p className="text-sm text-gray-600 mt-2">
    {completedItems} of {completenessItems.length} case sections completed.
  </p>
  <ul className="mt-2 space-y-1">
    {completenessItems.map(item => (
      <li key={item.label} className="text-sm text-gray-700 flex items-center gap-2">
        <span>{item.complete ? '✓' : '○'}</span>
        {item.label}
      </li>
    ))}
  </ul>
</div>

<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mt-4">
  <h3 className="font-semibold text-gray-800 mb-2">Patient Memory Prompts</h3>
  <p className="text-sm text-gray-600 mb-3">
    Confirm these details with the patient before submitting.
  </p>
  {memoryPrompts.length > 0 ? (
    <ul className="space-y-2">
      {memoryPrompts.map(prompt => (
        <li key={prompt} className="text-sm text-gray-700">
          • {prompt}
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-teal-700">
      All listed reminder fields have been recorded.
    </p>
  )}
</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReviewSection title="Patient Information">
                <ReviewRow label="Name"    value={patient.name || '—'} />
                <ReviewRow label="Age"     value={patient.age ? `${patient.age} years` : '—'} />
                <ReviewRow label="Gender"  value={patient.gender} />
                <ReviewRow label="Contact" value={patient.contactNumber} />
                <ReviewRow label="City"    value={[patient.city, patient.state].filter(Boolean).join(', ') || '—'} />
                <ReviewRow label="PIN"     value={patient.pinCode || '—'} />
                <ReviewRow label="Reg No." value={patient.hospitalRegNumber || '—'} />
              </ReviewSection>
              <ReviewSection title="Clinical Information">
                <ReviewRow label="Complaint"   value={clinical.chiefComplaint || '—'} />
                <ReviewRow label="Duration"    value={clinical.duration || '—'} />
                <ReviewRow label="Department"  value={clinical.department} />
                <ReviewRow label="Clinician"   value={clinical.assignedClinician || '—'} />
                <ReviewRow label="Symptoms"    value={clinical.symptoms.join(', ') || '—'} />
              </ReviewSection>
              <ReviewSection title="Medical History">
                <ReviewRow label="Conditions"  value={history.existingConditions.join(', ') || 'None'} />
                <ReviewRow label="Medications" value={history.currentMedications.join(', ') || 'None'} />
                <ReviewRow label="Allergies"   value={history.allergies.join(', ') || 'None'} />
              </ReviewSection>
              <ReviewSection title="Case Management">
                <ReviewRow label="Priority"    value={mgmt.priority} />
                <ReviewRow label="Status"      value={mgmt.reviewStatus} />
                <ReviewRow label="Follow-Up"   value={mgmt.followUpDate || '—'} />
              </ReviewSection>
            </div>
            {/* Validation summary */}
            {(!patient.name || !patient.age || !clinical.chiefComplaint || !clinical.assignedClinician) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                ⚠ Some required fields may be missing. Please go back and complete them before submitting.
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={step === 1 ? () => navigate('/cases') : prevStep}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < 5 ? (
          <button onClick={nextStep} className="btn-primary" id={`form-next-${step}`}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-teal" id="form-submit">
            <Check className="w-4 h-4" />
            {existing ? 'Update Case' : 'Register Case'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="text-gray-500 min-w-20 shrink-0">{label}:</dt>
      <dd className="text-gray-800 font-medium break-words">{value}</dd>
    </div>
  );
}
