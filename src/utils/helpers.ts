import type { CaseStatus, CasePriority, PatientCase, Department, Gender } from '../types';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns DD-MM-YYYY from an ISO string */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso; // Already formatted
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Returns DD-MM-YYYY HH:mm */
export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

/** Returns human-readable relative time */
export function timeAgo(iso: string): string {
  if (!iso) return '—';
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ─── ID generator ─────────────────────────────────────────────────────────────

export function generateCaseId(existingIds: string[] = []): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  let id = `CA-${year}-${rand}`;
  while (existingIds.includes(id)) {
    id = `CA-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return id;
}

// ─── Case Normalizer (Bridges Flat & Nested Schema) ───────────────────────────

export function normalizeCase(raw: any): PatientCase {
  if (!raw) return createEmptyCase();

  const patientName = raw.patientInfo?.name || raw.name || 'Unnamed Patient';
  const patientAge = Number(raw.patientInfo?.age ?? raw.age ?? 0);
  const patientGender = (raw.patientInfo?.gender || raw.gender || 'Prefer not to say') as Gender;
  const patientContact = raw.patientInfo?.contactNumber || raw.contact || '+91 ';
  const patientCity = raw.patientInfo?.city || raw.city || 'Bengaluru';
  const patientState = raw.patientInfo?.state || raw.state || 'Karnataka';
  const patientDistrict = raw.patientInfo?.district || raw.district || patientCity;
  const patientPin = raw.patientInfo?.pinCode || raw.pinCode || '';
  const patientDob = raw.patientInfo?.dateOfBirth || raw.dateOfBirth || '';
  const patientHospitalReg = raw.patientInfo?.hospitalRegNumber || raw.regNumber || raw.uhid || '';

  const chiefComplaint = raw.clinicalInfo?.chiefComplaint || raw.complaint || '';
  const symptoms = Array.isArray(raw.clinicalInfo?.symptoms)
    ? raw.clinicalInfo.symptoms
    : Array.isArray(raw.symptoms) ? raw.symptoms : (chiefComplaint ? [chiefComplaint] : []);
  const duration = raw.clinicalInfo?.duration || raw.duration || '';
  const department = (raw.clinicalInfo?.department || raw.department || 'General Medicine') as Department;
  const assignedClinician = raw.clinicalInfo?.assignedClinician || raw.assignedClinician || raw.reviewerName || 'Dr. Ramesh Sharma';
  const initialObservations = raw.clinicalInfo?.initialObservations || raw.initialObservations || '';
  const severity = raw.clinicalInfo?.severity ?? (raw.hpi?.severity ? Number(raw.hpi.severity) : 5);

  const existingConditions = Array.isArray(raw.medicalHistory?.existingConditions)
    ? raw.medicalHistory.existingConditions
    : Array.isArray(raw.conditions) ? raw.conditions : [];
  const currentMedications = Array.isArray(raw.medicalHistory?.currentMedications)
    ? raw.medicalHistory.currentMedications
    : Array.isArray(raw.medications) ? raw.medications : [];
  const allergies = Array.isArray(raw.medicalHistory?.allergies)
    ? raw.medicalHistory.allergies
    : Array.isArray(raw.allergies) ? raw.allergies : [];
  const previousProcedures = Array.isArray(raw.medicalHistory?.previousProcedures)
    ? raw.medicalHistory.previousProcedures
    : Array.isArray(raw.surgeries) ? raw.surgeries : [];
  const familyHistory = raw.medicalHistory?.familyHistory || raw.familyHistory || '';

  const priority = (raw.caseManagement?.priority || raw.priority || 'Normal') as CasePriority;
  const status = (raw.caseManagement?.reviewStatus || raw.status || 'New') as CaseStatus;
  const followUpDate = raw.caseManagement?.followUpDate || raw.followUpDate || '';
  const notes = raw.caseManagement?.notes || raw.notes || raw.doctorNotes || '';
  const nextActions = raw.caseManagement?.nextActions || raw.nextActions || '';

  const emergencyCheck = checkEmergencyFlags(chiefComplaint, symptoms);

  return {
    id: raw.id || `CA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    name: patientName,
    age: patientAge,
    gender: patientGender,
    contact: patientContact,
    city: patientCity,
    state: patientState,
    department,
    hospital: raw.hospital || raw.hospitalName || 'All India Institute of Ayurveda (AIIA)',
    hospitalName: raw.hospitalName || raw.hospital || 'All India Institute of Ayurveda (AIIA)',
    complaint: chiefComplaint,
    priority,
    status,
    date: raw.date || new Date().toISOString().slice(0, 10),

    patientInfo: {
      name: patientName,
      age: patientAge,
      dateOfBirth: patientDob,
      gender: patientGender,
      contactNumber: patientContact,
      state: patientState,
      district: patientDistrict,
      city: patientCity,
      pinCode: patientPin,
      hospitalRegNumber: patientHospitalReg,
      abhaId: raw.abhaId || raw.patientInfo?.abhaId,
      uhid: raw.uhid || raw.patientInfo?.uhid,
    },
    clinicalInfo: {
      chiefComplaint,
      symptoms,
      duration,
      department,
      assignedClinician,
      initialObservations,
      severity,
    },
    medicalHistory: {
      existingConditions,
      currentMedications,
      allergies,
      previousProcedures,
      familyHistory,
    },
    caseManagement: {
      priority,
      assignedDepartment: department,
      reviewStatus: status,
      followUpDate,
      notes,
      nextActions,
    },

    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    createdBy: raw.createdBy || 'Patient Intake Kiosk',
    reviewerNotes: raw.reviewerNotes || raw.doctorNotes || '',
    doctorNotes: raw.doctorNotes || raw.reviewerNotes || '',
    reviewedBy: raw.reviewedBy || raw.reviewerName,
    reviewerName: raw.reviewerName || raw.reviewedBy,
    reviewedAt: raw.reviewedAt,
    aiSummary: raw.aiSummary,
    source: raw.source || 'Intake Assistant',
    abhaId: raw.abhaId || raw.patientInfo?.abhaId,
    uhid: raw.uhid || raw.patientInfo?.uhid,

    ayushAssessment: raw.ayushAssessment,
    hasEmergencyRedFlag: emergencyCheck.hasEmergency,
    emergencyFlags: emergencyCheck.flags,

    messages: Array.isArray(raw.messages) ? raw.messages : [],
    testResults: Array.isArray(raw.testResults) ? raw.testResults : [],
    activityLog: Array.isArray(raw.activityLog) ? raw.activityLog : [],
  };
}

export function createEmptyCase(): PatientCase {
  const now = new Date().toISOString();
  return {
    id: `CA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    age: 0,
    gender: 'Prefer not to say',
    contact: '+91 ',
    city: '',
    state: 'Karnataka',
    department: 'General Medicine',
    hospital: 'All India Institute of Ayurveda (AIIA)',
    hospitalName: 'All India Institute of Ayurveda (AIIA)',
    complaint: '',
    priority: 'Normal',
    status: 'New',
    date: now.slice(0, 10),

    patientInfo: {
      name: '',
      age: 0,
      dateOfBirth: '',
      gender: 'Prefer not to say',
      contactNumber: '+91 ',
      state: 'Karnataka',
      district: '',
      city: '',
      pinCode: '',
      hospitalRegNumber: '',
    },
    clinicalInfo: {
      chiefComplaint: '',
      symptoms: [],
      duration: '',
      department: 'General Medicine',
      assignedClinician: 'Dr. Ramesh Sharma',
      initialObservations: '',
      severity: 5,
    },
    medicalHistory: {
      existingConditions: [],
      currentMedications: [],
      allergies: [],
      previousProcedures: [],
      familyHistory: '',
    },
    caseManagement: {
      priority: 'Normal',
      assignedDepartment: 'General Medicine',
      reviewStatus: 'New',
      followUpDate: '',
      notes: '',
      nextActions: '',
    },
    createdAt: now,
    updatedAt: now,
    createdBy: 'Patient Kiosk',
    reviewerNotes: '',
    messages: [],
    testResults: [],
    activityLog: [],
  };
}

// ─── Completeness Scoring ─────────────────────────────────────────────────────

export function calculateCompleteness(c: Partial<PatientCase>): {
  score: number;
  items: { label: string; complete: boolean; step: number }[];
} {
  const p = c.patientInfo;
  const cl = c.clinicalInfo;
  const h = c.medicalHistory;

  const items = [
    { label: 'Patient full name', complete: Boolean(p?.name?.trim() || c.name?.trim()), step: 1 },
    { label: 'Age & Gender', complete: Boolean((p?.age && p.age > 0) || (c.age && c.age > 0)), step: 1 },
    { label: 'Valid Phone (+91)', complete: Boolean((p?.contactNumber && p.contactNumber.trim().length >= 10 && p.contactNumber !== '+91 ') || (c.contact && c.contact.length >= 10)), step: 1 },
    { label: 'State & City', complete: Boolean((p?.state && p?.city?.trim()) || (c.state && c.city?.trim())), step: 1 },
    { label: 'Chief clinical complaint', complete: Boolean(cl?.chiefComplaint?.trim() || c.complaint?.trim()), step: 2 },
    { label: 'Symptom duration', complete: Boolean(cl?.duration?.trim()), step: 2 },
    { label: 'Specific symptoms list', complete: Boolean(cl?.symptoms && cl.symptoms.length > 0), step: 2 },
    { label: 'Medical conditions recorded', complete: Boolean(h?.existingConditions && h.existingConditions.length > 0), step: 3 },
    { label: 'Current medications documented', complete: Boolean(h?.currentMedications && h.currentMedications.length > 0), step: 4 },
    { label: 'Allergies documented / confirmed', complete: Boolean(h?.allergies && h.allergies.length > 0), step: 4 },
    { label: 'Family history noted', complete: Boolean(h?.familyHistory?.trim()), step: 5 },
  ];

  const completed = items.filter(i => i.complete).length;
  const score = Math.round((completed / items.length) * 100);

  return { score, items };
}

// ─── Clinical Gap Detection ───────────────────────────────────────────────────

export interface ClinicalGap {
  field: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  step: number;
}

export function detectGaps(c: Partial<PatientCase>): ClinicalGap[] {
  const gaps: ClinicalGap[] = [];
  const p = c.patientInfo;
  const cl = c.clinicalInfo;
  const h = c.medicalHistory;

  if (!p?.name?.trim() && !c.name?.trim()) {
    gaps.push({ field: 'Patient Name', issue: 'Missing legal patient name for official healthcare records.', severity: 'critical', step: 1 });
  }
  if (!p?.dateOfBirth?.trim()) {
    gaps.push({ field: 'Date of Birth', issue: 'Date of birth missing; needed for age verification and drug dosing calculation.', severity: 'info', step: 1 });
  }
  if (!cl?.chiefComplaint?.trim() && !c.complaint?.trim()) {
    gaps.push({ field: 'Chief Complaint', issue: 'No primary reason for visit entered; triage cannot assign priority.', severity: 'critical', step: 2 });
  }
  if (!cl?.duration?.trim()) {
    gaps.push({ field: 'Symptom Duration', issue: 'Duration is unrecorded (acute vs chronic classification depends on duration).', severity: 'warning', step: 2 });
  }
  if (h && h.allergies.length === 0) {
    gaps.push({ field: 'Allergy Status', issue: 'Allergies not explicitly confirmed. Please confirm NKDA (No Known Drug Allergies).', severity: 'warning', step: 4 });
  }
  if (h && h.currentMedications.length === 0) {
    gaps.push({ field: 'Current Medications', issue: 'No active prescriptions recorded; potential drug interaction checks cannot run.', severity: 'info', step: 4 });
  }
  if (!h?.familyHistory?.trim()) {
    gaps.push({ field: 'Family History', issue: 'Hereditary cardiovascular/diabetic risk profile incomplete.', severity: 'info', step: 5 });
  }

  return gaps;
}

// ─── Patient Memory Prompts ───────────────────────────────────────────────────

export function generateMemoryPrompts(c: Partial<PatientCase>): string[] {
  const prompts: string[] = [];
  const cl = c.clinicalInfo;
  const h = c.medicalHistory;

  if (!cl?.duration?.trim()) {
    prompts.push('When did you first notice these symptoms? Did they start suddenly or gradually?');
  }
  if (!cl?.symptoms || cl.symptoms.length <= 1) {
    prompts.push('Are there any other sensations like fever, nausea, fatigue, or radiating ache?');
  }
  if (!h || h.currentMedications.length === 0) {
    prompts.push('Are you currently taking any daily medicines, Ayurvedic decoctions (Kadha), or pain relief tablets?');
  }
  if (!h || h.allergies.length === 0) {
    prompts.push('Have you ever had an allergic rash, swelling, or breathing difficulty after taking any drug or food?');
  }
  if (!h || !h.familyHistory?.trim()) {
    prompts.push('Do your parents or siblings have a history of heart disease, diabetes, hypertension, or asthma?');
  }

  return prompts;
}

// ─── Emergency Red-Flag Symptoms Checker ──────────────────────────────────────

export function checkEmergencyFlags(complaint: string = '', symptoms: string[] = []): {
  hasEmergency: boolean;
  flags: string[];
} {
  const text = `${complaint} ${symptoms.join(' ')}`.toLowerCase();
  const redFlags: string[] = [];

  if (text.includes('chest pain') || (text.includes('chest') && text.includes('pressure'))) {
    redFlags.push('Acute chest pain / possible cardiac event');
  }
  if (text.includes('shortness of breath') || text.includes('cannot breathe') || text.includes('dyspnea')) {
    redFlags.push('Severe respiratory distress');
  }
  if (text.includes('slurred speech') || text.includes('facial drooping') || text.includes('arm weakness')) {
    redFlags.push('Signs of acute stroke (FAST protocol alert)');
  }
  if (text.includes('unconscious') || text.includes('loss of consciousness') || text.includes('fainted')) {
    redFlags.push('Altered sensorium / syncope');
  }
  if (text.includes('heavy bleeding') || text.includes('profuse bleeding')) {
    redFlags.push('Severe hemorrhage');
  }

  return {
    hasEmergency: redFlags.length > 0,
    flags: redFlags,
  };
}

// ─── Badge colour maps ────────────────────────────────────────────────────────

export function statusBadgeClass(status: CaseStatus): string {
  const map: Record<string, string> = {
    'Registered':                 'bg-blue-100 text-blue-800 border border-blue-200',
    'New':                        'bg-sky-100 text-sky-800 border border-sky-200',
    'Under Review':               'bg-amber-100 text-amber-800 border border-amber-200',
    'Awaiting Tests':             'bg-orange-100 text-orange-800 border border-orange-200',
    'Awaiting Clinical Review':   'bg-amber-100 text-amber-800 border border-amber-200',
    'In Treatment':               'bg-purple-100 text-purple-800 border border-purple-200',
    'Reviewed':                   'bg-teal-100 text-teal-800 border border-teal-200',
    'Follow-Up':                  'bg-indigo-100 text-indigo-800 border border-indigo-200',
    'Completed':                  'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Closed':                     'bg-slate-100 text-slate-600 border border-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}

export function priorityBadgeClass(priority: CasePriority): string {
  const map: Record<string, string> = {
    Low:      'bg-emerald-100 text-emerald-800 border border-emerald-200',
    Normal:   'bg-blue-100 text-blue-800 border border-blue-200',
    Medium:   'bg-blue-100 text-blue-800 border border-blue-200',
    High:     'bg-amber-100 text-amber-800 border border-amber-200',
    Critical: 'bg-rose-100 text-rose-800 border border-rose-200',
  };
  return map[priority] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}

export function priorityDotClass(priority: CasePriority): string {
  const map: Record<string, string> = {
    Low:      'bg-emerald-500',
    Normal:   'bg-blue-500',
    Medium:   'bg-blue-500',
    High:     'bg-amber-500',
    Critical: 'bg-rose-500',
  };
  return map[priority] ?? 'bg-slate-400';
}

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
