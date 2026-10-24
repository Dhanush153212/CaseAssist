// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type CaseStatus =
  | 'Registered'
  | 'Under Review'
  | 'Awaiting Tests'
  | 'In Treatment'
  | 'Follow-Up'
  | 'Completed'
  | 'Closed';

export type CasePriority = 'Low' | 'Normal' | 'High' | 'Critical';

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
  | 'Emergency Medicine'
  | 'Surgery';

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export type UserRole = 'Admin' | 'Clinician' | 'Reviewer';

// ─── Patient Information ──────────────────────────────────────────────────────

export interface PatientInfo {
  name: string;
  age: number;
  dateOfBirth: string;       // DD-MM-YYYY
  gender: Gender;
  contactNumber: string;     // +91XXXXXXXXXX
  state: string;
  district: string;
  city: string;
  pinCode: string;
  hospitalRegNumber: string;
}

// ─── Clinical Information ─────────────────────────────────────────────────────

export interface ClinicalInfo {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  department: Department;
  assignedClinician: string;
  initialObservations: string;
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

// ─── Full Patient Case ────────────────────────────────────────────────────────

export interface PatientCase {
  id: string;                // CA-YYYY-XXXX
  patientInfo: PatientInfo;
  clinicalInfo: ClinicalInfo;
  medicalHistory: MedicalHistory;
  caseManagement: CaseManagement;
  hospitalName: string;
  createdAt: string;         // ISO
  updatedAt: string;         // ISO
  createdBy: string;
  reviewerNotes: string;
  reviewedBy?: string;
  reviewedAt?: string;
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
  performedBy: string;
  role: UserRole;
  details: string;
}

// ─── Auth / User ──────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  hospitalName: string;
  avatarInitials: string;
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
