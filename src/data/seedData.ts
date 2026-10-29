import type {
  PatientCase,
  Department,
  ActivityEntry,
  TestResult,
  AppUser,
  SystemSettings,
} from '../types';
import { normalizeCase } from '../utils/helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

function makeActivity(
  action: string,
  performedBy: string,
  role: 'Admin' | 'Clinician' | 'Reviewer',
  details: string,
  daysAgo = 0,
): ActivityEntry {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: d.toISOString(),
    action,
    performedBy,
    role,
    details,
  };
}

function makeTest(
  testName: string,
  result: string,
  status: 'Pending' | 'Completed' | 'Abnormal',
  orderedBy: string,
): TestResult {
  return {
    id: Math.random().toString(36).slice(2),
    testName,
    result,
    date: '20-10-2026',
    orderedBy,
    status,
  };
}

// ─── Seed Cases ───────────────────────────────────────────────────────────────

const RAW_CASES: any[] = [
  // ── 1. Arun Kumar Sharma ─────────────────────────────────────────────────
  {
    id: 'CA-2026-0001',
    hospitalName: 'NIMHANS, Bengaluru',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdBy: 'Dr. Priya Menon',
    reviewerNotes: 'ECG confirmed mild ST elevation. Referred to cardiology.',
    reviewedBy: 'Dr. Rajesh Iyer',
    reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    patientInfo: {
      name: 'Arun Kumar Sharma',
      age: 54,
      dateOfBirth: '12-03-1972',
      gender: 'Male',
      contactNumber: '+91 98441 23456',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      city: 'Bengaluru',
      pinCode: '560001',
      hospitalRegNumber: 'NIMH-2026-4521',
    },
    clinicalInfo: {
      chiefComplaint: 'Chest pain radiating to left arm',
      symptoms: ['Chest pain', 'Shortness of breath', 'Diaphoresis', 'Nausea'],
      duration: '3 hours',
      department: 'Cardiology',
      assignedClinician: 'Dr. Rajesh Iyer',
      initialObservations: 'BP 150/95 mmHg, HR 98 bpm, O2 Sat 94%. ECG shows mild ST elevation.',
    },
    medicalHistory: {
      existingConditions: ['Type 2 Diabetes', 'Hypertension'],
      currentMedications: ['Metformin 500mg BD', 'Amlodipine 5mg OD'],
      allergies: ['Penicillin'],
      previousProcedures: ['Appendectomy (2008)'],
      familyHistory: 'Father had MI at age 58.',
    },
    caseManagement: {
      priority: 'Critical',
      assignedDepartment: 'Cardiology',
      reviewStatus: 'Under Review',
      followUpDate: '28-10-2026',
      notes: 'Patient admitted to CCU. Troponin levels being monitored.',
      nextActions: 'Echocardiogram, repeat ECG in 6 hours, cardiology consult.',
    },
    testResults: [
      makeTest('ECG', 'Mild ST elevation in leads II, III, aVF', 'Abnormal', 'Dr. Rajesh Iyer'),
      makeTest('Troponin I', 'Pending', 'Pending', 'Dr. Rajesh Iyer'),
      makeTest('CBC', 'WBC 11.2, Hb 13.4, Platelets 210k', 'Completed', 'Dr. Priya Menon'),
    ],
    activityLog: [
      makeActivity('Case Created', 'Dr. Priya Menon', 'Clinician', 'Case registered at Emergency Medicine', 5),
      makeActivity('Status Updated', 'Dr. Rajesh Iyer', 'Clinician', 'Status changed to Under Review', 4),
      makeActivity('Review Completed', 'Dr. Rajesh Iyer', 'Reviewer', 'Reviewer notes added', 2),
    ],
  },

  // ── 2. Lakshmi Devi Naidu ────────────────────────────────────────────────
  {
    id: 'CA-2026-0002',
    hospitalName: 'Government General Hospital, Vijayawada',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    createdBy: 'Dr. Meena Reddy',
    reviewerNotes: '',
    patientInfo: {
      name: 'Lakshmi Devi Naidu',
      age: 32,
      dateOfBirth: '08-07-1994',
      gender: 'Female',
      contactNumber: '+91 87654 32109',
      state: 'Andhra Pradesh',
      district: 'Krishna',
      city: 'Vijayawada',
      pinCode: '520001',
      hospitalRegNumber: 'GGH-2026-1187',
    },
    clinicalInfo: {
      chiefComplaint: 'High fever and body pain for 4 days',
      symptoms: ['High fever (103°F)', 'Severe body ache', 'Headache', 'Rash on arms'],
      duration: '4 days',
      department: 'General Medicine',
      assignedClinician: 'Dr. Meena Reddy',
      initialObservations: 'Temp 39.4°C, HR 102 bpm, BP 110/70 mmHg. Petechial rash noted.',
    },
    medicalHistory: {
      existingConditions: [],
      currentMedications: ['Paracetamol 650mg TDS (self-medicated)'],
      allergies: [],
      previousProcedures: ['C-section (2022)'],
      familyHistory: 'No significant family history.',
    },
    caseManagement: {
      priority: 'High',
      assignedDepartment: 'General Medicine',
      reviewStatus: 'Awaiting Tests',
      followUpDate: '25-10-2026',
      notes: 'Dengue NS1 antigen test ordered. IV fluids initiated.',
      nextActions: 'Await dengue test results, monitor platelet count daily.',
    },
    testResults: [
      makeTest('Dengue NS1 Antigen', 'Positive', 'Abnormal', 'Dr. Meena Reddy'),
      makeTest('Platelet Count', '95,000/µL', 'Abnormal', 'Dr. Meena Reddy'),
      makeTest('Complete Blood Count', 'Pending', 'Pending', 'Dr. Meena Reddy'),
    ],
    activityLog: [
      makeActivity('Case Created', 'Dr. Meena Reddy', 'Clinician', 'Registered in OPD', 3),
      makeActivity('Tests Ordered', 'Dr. Meena Reddy', 'Clinician', 'Dengue NS1, CBC ordered', 3),
      makeActivity('Status Updated', 'Dr. Meena Reddy', 'Clinician', 'Awaiting test results', 2),
    ],
  },

  // ── 3. Mohammed Faisal Khan ──────────────────────────────────────────────
  {
    id: 'CA-2026-0003',
    hospitalName: 'Yashoda Hospitals, Hyderabad',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdBy: 'Dr. Anand Kulkarni',
    reviewerNotes: 'MRI confirmed L4-L5 disc herniation. Conservative management initiated.',
    reviewedBy: 'Dr. Suresh Babu',
    reviewedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    patientInfo: {
      name: 'Mohammed Faisal Khan',
      age: 42,
      dateOfBirth: '15-11-1983',
      gender: 'Male',
      contactNumber: '+91 99887 56781',
      state: 'Telangana',
      district: 'Hyderabad',
      city: 'Hyderabad',
      pinCode: '500001',
      hospitalRegNumber: 'YH-2026-3302',
    },
    clinicalInfo: {
      chiefComplaint: 'Lower back pain radiating to right leg',
      symptoms: ['Lower back pain', 'Radiculopathy', 'Numbness in right foot', 'Difficulty walking'],
      duration: '3 weeks',
      department: 'Orthopaedics',
      assignedClinician: 'Dr. Anand Kulkarni',
      initialObservations: 'Positive SLR test on right. Reduced sensation L5 dermatomal distribution.',
    },
    medicalHistory: {
      existingConditions: ['Chronic back pain', 'Obesity (BMI 31)'],
      currentMedications: ['Diclofenac 50mg BD', 'Pantoprazole 40mg OD'],
      allergies: ['NSAIDs (mild GI distress)'],
      previousProcedures: [],
      familyHistory: 'Mother has degenerative disc disease.',
    },
    caseManagement: {
      priority: 'Normal',
      assignedDepartment: 'Orthopaedics',
      reviewStatus: 'In Treatment',
      followUpDate: '05-11-2026',
      notes: 'Physiotherapy sessions started. Pain score 6/10.',
      nextActions: 'Physiotherapy twice weekly, review MRI at next follow-up.',
    },
    testResults: [
      makeTest('Lumbar MRI', 'L4-L5 disc herniation with right foraminal narrowing', 'Abnormal', 'Dr. Anand Kulkarni'),
      makeTest('X-Ray Lumbar Spine', 'Mild spondylosis changes', 'Completed', 'Dr. Anand Kulkarni'),
    ],
    activityLog: [
      makeActivity('Case Created', 'Dr. Anand Kulkarni', 'Clinician', 'Outpatient case registered', 8),
      makeActivity('MRI Ordered', 'Dr. Anand Kulkarni', 'Clinician', 'MRI lumbar spine ordered', 7),
      makeActivity('Review Completed', 'Dr. Suresh Babu', 'Reviewer', 'Reviewed MRI findings', 3),
      makeActivity('Treatment Started', 'Dr. Anand Kulkarni', 'Clinician', 'Physiotherapy initiated', 1),
    ],
  },

  // ── 4. Priya Raghunathan ─────────────────────────────────────────────────
  {
    id: 'CA-2026-0004',
    hospitalName: 'Apollo Hospitals, Chennai',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: now(),
    createdBy: 'Dr. Kavitha Sundar',
    reviewerNotes: '',
    patientInfo: {
      name: 'Priya Raghunathan',
      age: 28,
      dateOfBirth: '22-04-1998',
      gender: 'Female',
      contactNumber: '+91 94441 87654',
      state: 'Tamil Nadu',
      district: 'Chennai',
      city: 'Chennai',
      pinCode: '600001',
      hospitalRegNumber: 'APL-2026-7891',
    },
    clinicalInfo: {
      chiefComplaint: 'Severe migraine with visual aura',
      symptoms: ['Throbbing headache', 'Visual aura', 'Photophobia', 'Nausea', 'Vomiting'],
      duration: '6 hours',
      department: 'Neurology',
      assignedClinician: 'Dr. Kavitha Sundar',
      initialObservations: 'GCS 15, pupils equal and reactive. No focal neurological deficits.',
    },
    medicalHistory: {
      existingConditions: ['Chronic migraine (diagnosed 2019)'],
      currentMedications: ['Topiramate 25mg OD (prophylaxis)', 'Sumatriptan 50mg PRN'],
      allergies: [],
      previousProcedures: [],
      familyHistory: 'Mother has migraines.',
    },
    caseManagement: {
      priority: 'High',
      assignedDepartment: 'Neurology',
      reviewStatus: 'Registered',
      followUpDate: '01-11-2026',
      notes: 'IV metoclopramide given for nausea. Resting in dark room.',
      nextActions: 'Review analgesic response in 2 hours. Consider CT head if no improvement.',
    },
    testResults: [],
    activityLog: [
      makeActivity('Case Created', 'Dr. Kavitha Sundar', 'Clinician', 'Emergency OPD registration', 1),
    ],
  },

  // ── 5. Ganesh Patil ──────────────────────────────────────────────────────
  {
    id: 'CA-2026-0005',
    hospitalName: 'Ruby Hall Clinic, Pune',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdBy: 'Dr. Supriya Deshpande',
    reviewerNotes: 'HbA1c 9.2% — poor glycaemic control. Insulin regimen adjusted.',
    reviewedBy: 'Dr. Nitin Joshi',
    reviewedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    patientInfo: {
      name: 'Ganesh Patil',
      age: 61,
      dateOfBirth: '30-09-1965',
      gender: 'Male',
      contactNumber: '+91 77889 12345',
      state: 'Maharashtra',
      district: 'Pune',
      city: 'Pune',
      pinCode: '411001',
      hospitalRegNumber: 'RHC-2026-2201',
    },
    clinicalInfo: {
      chiefComplaint: 'Uncontrolled blood sugar, fatigue',
      symptoms: ['Polydipsia', 'Polyuria', 'Fatigue', 'Blurred vision'],
      duration: '2 months',
      department: 'Endocrinology',
      assignedClinician: 'Dr. Supriya Deshpande',
      initialObservations: 'FBS 310 mg/dL, BP 140/88 mmHg, mild pedal oedema.',
    },
    medicalHistory: {
      existingConditions: ['Type 2 Diabetes (12 years)', 'CKD Stage 2', 'Dyslipidaemia'],
      currentMedications: ['Metformin 1g BD', 'Glimepiride 2mg OD', 'Atorvastatin 10mg OD', 'Losartan 50mg OD'],
      allergies: ['Sulfonamides'],
      previousProcedures: ['Coronary angiography (2020)'],
      familyHistory: 'Father — T2DM, hypertension. Brother — T2DM.',
    },
    caseManagement: {
      priority: 'High',
      assignedDepartment: 'Endocrinology',
      reviewStatus: 'Follow-Up',
      followUpDate: '10-11-2026',
      notes: 'Insulin glargine 10 units OD added. Dietary counselling done.',
      nextActions: 'Repeat HbA1c after 3 months. Ophthalmology referral for retinal screening.',
    },
    testResults: [
      makeTest('HbA1c', '9.2%', 'Abnormal', 'Dr. Supriya Deshpande'),
      makeTest('Fasting Blood Sugar', '310 mg/dL', 'Abnormal', 'Dr. Supriya Deshpande'),
      makeTest('Serum Creatinine', '1.4 mg/dL', 'Completed', 'Dr. Supriya Deshpande'),
      makeTest('Lipid Profile', 'Total Cholesterol 210, LDL 138', 'Abnormal', 'Dr. Supriya Deshpande'),
      makeTest('Urine Microalbumin', 'Pending', 'Pending', 'Dr. Nitin Joshi'),
    ],
    activityLog: [
      makeActivity('Case Created', 'Dr. Supriya Deshpande', 'Clinician', 'Endocrinology OPD', 15),
      makeActivity('Tests Ordered', 'Dr. Supriya Deshpande', 'Clinician', 'HbA1c, FBS, lipid profile', 14),
      makeActivity('Review Completed', 'Dr. Nitin Joshi', 'Reviewer', 'Insulin added, follow-up arranged', 5),
      makeActivity('Status Updated', 'Dr. Supriya Deshpande', 'Clinician', 'Follow-Up scheduled', 2),
    ],
  },

  // ── 6. Anjali Krishnaswamy ───────────────────────────────────────────────
  {
    id: 'CA-2026-0006',
    hospitalName: 'AIIMS, New Delhi',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    createdBy: 'Dr. Rohit Sharma',
    reviewerNotes: 'FNAC confirmed papillary carcinoma. Referred to oncosurgery.',
    reviewedBy: 'Dr. Shalini Gupta',
    reviewedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    patientInfo: {
      name: 'Anjali Krishnaswamy',
      age: 38,
      dateOfBirth: '14-06-1988',
      gender: 'Female',
      contactNumber: '+91 96320 78901',
      state: 'Delhi',
      district: 'South Delhi',
      city: 'New Delhi',
      pinCode: '110001',
      hospitalRegNumber: 'AIIMS-2026-8834',
    },
    clinicalInfo: {
      chiefComplaint: 'Painless neck swelling for 2 months',
      symptoms: ['Neck swelling', 'Mild dysphagia', 'Voice change'],
      duration: '2 months',
      department: 'Oncology',
      assignedClinician: 'Dr. Rohit Sharma',
      initialObservations: '2 cm right thyroid nodule, firm, non-tender. No cervical lymphadenopathy.',
    },
    medicalHistory: {
      existingConditions: ['Hypothyroidism'],
      currentMedications: ['Levothyroxine 50mcg OD'],
      allergies: [],
      previousProcedures: [],
      familyHistory: 'No family history of thyroid cancer.',
    },
    caseManagement: {
      priority: 'Critical',
      assignedDepartment: 'Oncology',
      reviewStatus: 'Completed',
      followUpDate: '01-11-2026',
      notes: 'Oncosurgery consultation done. Total thyroidectomy planned.',
      nextActions: 'Pre-operative workup, anaesthesia consult, date for surgery confirmed.',
    },
    testResults: [
      makeTest('Thyroid Ultrasound', 'Right lobe 2 cm hypoechoic nodule, TI-RADS 4', 'Abnormal', 'Dr. Rohit Sharma'),
      makeTest('FNAC Thyroid', 'Papillary thyroid carcinoma — Bethesda VI', 'Abnormal', 'Dr. Shalini Gupta'),
      makeTest('TSH', '8.2 mIU/L', 'Abnormal', 'Dr. Rohit Sharma'),
      makeTest('T3, T4', 'Within normal limits', 'Completed', 'Dr. Rohit Sharma'),
    ],
    activityLog: [
      makeActivity('Case Created', 'Dr. Rohit Sharma', 'Clinician', 'Outpatient thyroid clinic', 20),
      makeActivity('Review Completed', 'Dr. Shalini Gupta', 'Reviewer', 'FNAC result confirmed', 12),
      makeActivity('Status Updated', 'Dr. Rohit Sharma', 'Clinician', 'Case completed — pre-op', 10),
    ],
  },

  // ── 7. Ravi Shankar Gupta ────────────────────────────────────────────────
  {
    id: 'CA-2026-0007',
    hospitalName: 'Mysuru District Hospital, Mysuru',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 0.25 * 86400000).toISOString(),
    createdBy: 'Dr. Pooja Nagaraj',
    reviewerNotes: '',
    patientInfo: {
      name: 'Ravi Shankar Gupta',
      age: 7,
      dateOfBirth: '18-01-2019',
      gender: 'Male',
      contactNumber: '+91 88123 45678',
      state: 'Karnataka',
      district: 'Mysuru',
      city: 'Mysuru',
      pinCode: '570001',
      hospitalRegNumber: 'MDH-2026-0934',
    },
    clinicalInfo: {
      chiefComplaint: 'Wheezing and breathlessness',
      symptoms: ['Wheezing', 'Breathlessness', 'Cough', 'Chest tightness'],
      duration: '1 day',
      department: 'Paediatrics',
      assignedClinician: 'Dr. Pooja Nagaraj',
      initialObservations: 'SpO2 91%, mild intercostal retraction. Bilateral expiratory wheeze on auscultation.',
    },
    medicalHistory: {
      existingConditions: ['Bronchial asthma (diagnosed age 4)'],
      currentMedications: ['Salbutamol inhaler PRN', 'Budesonide inhaler BD'],
      allergies: ['Dust mites', 'Pet dander'],
      previousProcedures: [],
      familyHistory: 'Mother — bronchial asthma.',
    },
    caseManagement: {
      priority: 'High',
      assignedDepartment: 'Paediatrics',
      reviewStatus: 'Under Review',
      followUpDate: '27-10-2026',
      notes: 'Nebulisation with salbutamol given. SpO2 improved to 96%.',
      nextActions: 'Repeat nebulisation if needed. Admit if no improvement.',
    },
    testResults: [
      makeTest('Peak Flow Rate', '62% predicted', 'Abnormal', 'Dr. Pooja Nagaraj'),
      makeTest('Chest X-Ray', 'Hyperinflation, no consolidation', 'Completed', 'Dr. Pooja Nagaraj'),
    ],
    activityLog: [
      makeActivity('Case Created', 'Dr. Pooja Nagaraj', 'Clinician', 'Paediatric Emergency', 2),
      makeActivity('Nebulisation Given', 'Nurse Radha', 'Clinician', 'Salbutamol nebulisation', 2),
    ],
  },

  // ── 8. Sunita Rani Mishra ────────────────────────────────────────────────
  {
    id: 'CA-2026-0008',
    hospitalName: 'Manipal Hospital, Bengaluru',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdBy: 'Dr. Archana Bhat',
    reviewerNotes: 'Post-op recovery satisfactory. Discharged with follow-up.',
    reviewedBy: 'Dr. Archana Bhat',
    reviewedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    patientInfo: {
      name: 'Sunita Rani Mishra',
      age: 45,
      dateOfBirth: '03-02-1981',
      gender: 'Female',
      contactNumber: '+91 91234 56789',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      city: 'Bengaluru',
      pinCode: '560038',
      hospitalRegNumber: 'MH-2026-5512',
    },
    clinicalInfo: {
      chiefComplaint: 'Recurrent gallstone attacks',
      symptoms: ['Right upper quadrant pain', 'Nausea', 'Vomiting', 'Fatty food intolerance'],
      duration: '6 months',
      department: 'Surgery',
      assignedClinician: 'Dr. Archana Bhat',
      initialObservations: 'Positive Murphy\'s sign. USG abdomen confirmed cholelithiasis.',
    },
    medicalHistory: {
      existingConditions: ['Cholelithiasis', 'Obesity'],
      currentMedications: ['Antacids PRN'],
      allergies: [],
      previousProcedures: [],
      familyHistory: 'Sister had cholecystectomy.',
    },
    caseManagement: {
      priority: 'Normal',
      assignedDepartment: 'Surgery',
      reviewStatus: 'Closed',
      followUpDate: '10-12-2026',
      notes: 'Laparoscopic cholecystectomy done successfully on 17-10-2026.',
      nextActions: 'Wound check at follow-up. Resume normal diet gradually.',
    },
    testResults: [
      makeTest('Abdominal Ultrasound', 'Multiple gallstones, largest 1.8 cm', 'Abnormal', 'Dr. Archana Bhat'),
      makeTest('LFT', 'Mildly elevated Alkaline Phosphatase', 'Abnormal', 'Dr. Archana Bhat'),
      makeTest('PT/INR', 'INR 1.0 — Normal', 'Completed', 'Dr. Archana Bhat'),
    ],
    activityLog: [
      makeActivity('Case Created', 'Dr. Archana Bhat', 'Clinician', 'Surgery OPD', 30),
      makeActivity('Surgery Completed', 'Dr. Archana Bhat', 'Clinician', 'Lap cholecystectomy done', 5),
      makeActivity('Case Closed', 'Dr. Archana Bhat', 'Reviewer', 'Discharged', 5),
    ],
  },
];

export const SEED_CASES: PatientCase[] = RAW_CASES.map(normalizeCase);

// ─── Default User ─────────────────────────────────────────────────────────────

export const DEFAULT_USER: AppUser = {
  id: 'usr-001',
  name: 'Dr. Priya Menon',
  email: 'priya.menon@nimhans.ac.in',
  role: 'Admin',
  department: 'General Medicine',
  hospitalName: 'NIMHANS, Bengaluru',
  avatarInitials: 'PM',
};

// ─── Default Settings ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: SystemSettings = {
  hospitalName: 'NIMHANS, Bengaluru',
  hospitalType: 'Government Teaching Hospital',
  city: 'Bengaluru',
  state: 'Karnataka',
  contactEmail: 'admin@nimhans.ac.in',
  contactPhone: '+91 80 2699 5000',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD-MM-YYYY',
  defaultDepartment: 'General Medicine',
  enableAISummary: true,
  enableAuditLog: true,
  sessionTimeoutMinutes: 30,
};

// ─── Indian States ────────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar Islands', 'Dadra & Nagar Haveli', 'Lakshadweep',
];

export const DEPARTMENTS: Department[] = [
  'General Medicine', 'Cardiology', 'Orthopaedics', 'Paediatrics', 'Gynaecology',
  'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry', 'Oncology',
  'Nephrology', 'Gastroenterology', 'Pulmonology', 'Endocrinology',
  'Emergency Medicine', 'Surgery',
];

export const CLINICIANS = [
  'Dr. Priya Menon', 'Dr. Rajesh Iyer', 'Dr. Meena Reddy', 'Dr. Anand Kulkarni',
  'Dr. Kavitha Sundar', 'Dr. Supriya Deshpande', 'Dr. Rohit Sharma',
  'Dr. Pooja Nagaraj', 'Dr. Archana Bhat', 'Dr. Nitin Joshi', 'Dr. Suresh Babu',
  'Dr. Shalini Gupta',
];
