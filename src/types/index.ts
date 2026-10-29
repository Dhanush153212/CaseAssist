// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type CaseStatus =
  | 'Registered'
  | 'New'
  | 'Under Review'
  | 'Awaiting Tests'
  | 'Awaiting Clinical Review'
  | 'In Treatment'
  | 'Reviewed'
  | 'Follow-Up'
  | 'Completed'
  | 'Closed';

export type CasePriority = 'Low' | 'Normal' | 'Medium' | 'High' | 'Critical';

export type Department =
  | 'General Medicine'
  | 'Cardiology'
  | 'Orthopaedics'
  | 'Paediatrics'
  | 'Gynaecology'
  | 'Neurology'
  | 'Dermatology'
  | 'ENT'
  | 'Ophthalmology'
  | 'Psychiatry'
  | 'Oncology'
  | 'Nephrology'
  | 'Gastroenterology'
  | 'Pulmonology'
  | 'Endocrinology'
  | 'Emergency & Casualty'
  | 'Emergency Medicine'
  | 'Surgery'
  | 'Kayachikitsa (Ayurveda Internal Medicine)'
  | 'Shalya Tantra (Surgery)'
  | 'Panchakarma'
  | 'Prasuti & Stri Roga';

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export type UserRole = 'patient' | 'doctor' | 'superadmin' | 'triage' | 'Admin' | 'Clinician' | 'Reviewer';

// ─── Patient Information ──────────────────────────────────────────────────────

export interface PatientInfo {
  name: string;
  age: number;
  dateOfBirth: string;       // DD-MM-YYYY or YYYY-MM-DD
  gender: Gender;
  contactNumber: string;     // +91XXXXXXXXXX
  state: string;
  district: string;
  city: string;
  pinCode: string;
  hospitalRegNumber: string;
  abhaId?: string;
  uhid?: string;
}

// ─── Clinical Information ─────────────────────────────────────────────────────

export interface ClinicalInfo {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  department: Department;
  assignedClinician: string;
  initialObservations: string;
  severity?: number;         // 1-10 scale
}

// ─── Medical History ──────────────────────────────────────────────────────────

export interface MedicalHistory {
  existingConditions: string[];
  currentMedications: string[];
  allergies: string[];
  previousProcedures: string[];
  familyHistory: string;
}

// ─── Case Management ──────────────────────────────────────────────────────────

export interface CaseManagement {
  priority: CasePriority;
  assignedDepartment: Department;
  reviewStatus: CaseStatus;
  followUpDate: string;      // DD-MM-YYYY
  notes: string;
  nextActions: string;
}

// ─── Case Message (Patient-Doctor Communication) ───────────────────────────────

export interface CaseMessage {
  id: string;
  senderRole: 'patient' | 'doctor' | 'system' | 'superadmin';
  senderName: string;
  text: string;
  timestamp: string;
  formattedTime?: string;
}

// ─── Full Patient Case ────────────────────────────────────────────────────────

export interface PatientCase {
  id: string;                // CA-YYYY-XXXX or AIIA-MK-YYYY-XXXX
  
  // Top-level conveniences for universal access
  name: string;
  age: number;
  gender: Gender | string;
  contact: string;
  city: string;
  state?: string;
  department: Department | string;
  hospital: string;
  hospitalName: string;
  complaint: string;
  priority: CasePriority;
  status: CaseStatus;
  date: string;              // YYYY-MM-DD or DD-MM-YYYY
  
  // Nested structure
  patientInfo: PatientInfo;
  clinicalInfo: ClinicalInfo;
  medicalHistory: MedicalHistory;
  caseManagement: CaseManagement;
  
  // Metadata & Workflow
  createdAt: string;         // ISO
  updatedAt: string;         // ISO
  createdBy: string;
  reviewerNotes: string;
  doctorNotes?: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewedAt?: string;
  aiSummary?: string;
  source?: string;
  abhaId?: string;
  uhid?: string;
  
  // AYUSH Assessment fields (if applicable)
  ayushAssessment?: {
    prakriti?: string;
    agni?: string;
    koshtha?: string;
    vikriti?: string;
    nidra?: string;
    jihva?: string;
  };

  // Red-flag alerts
  hasEmergencyRedFlag?: boolean;
  emergencyFlags?: string[];

  // Child collections
  messages: CaseMessage[];
  testResults: TestResult[];
  activityLog: ActivityEntry[];
}

// ─── Test Results ─────────────────────────────────────────────────────────────

export interface TestResult {
  id: string;
  testName: string;
  result: string;
  date: string;
  orderedBy: string;
  status: 'Pending' | 'Completed' | 'Abnormal';
}

// ─── Activity Log Entry ───────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy?: string;
  userName?: string;
  userId?: string;
  role: UserRole | string;
  details: string;
  resourceId?: string;
  ip?: string;
}

// ─── Auth / User ──────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department | string;
  hospitalName?: string;
  avatarInitials: string;
  regNumber?: string;
  phone?: string;
  abhaId?: string;
  uhid?: string;
  status?: 'Active' | 'Inactive';
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalCases: number;
  newCases: number;
  awaitingReview: number;
  completed: number;
  highPriority: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface SystemSettings {
  hospitalName: string;
  hospitalType: string;
  city: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
  timezone: string;
  dateFormat: string;
  defaultDepartment: Department;
  enableAISummary: boolean;
  enableAuditLog: boolean;
  sessionTimeoutMinutes: number;
}
