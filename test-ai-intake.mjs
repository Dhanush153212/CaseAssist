import {
  processIntakeMessage,
  recommendDepartment,
  detectEmergency,
  parsePatientInput
} from './src/services/aiSymptomEngine.ts';
import { CLINICIAN_DIRECTORY } from './src/data/seedData.ts';

console.log('--- CaseAssist AI Clinical Intake Assistant Test Suite ---\n');

let passCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// ── Test 1: Emergency Detection ──
console.log('\n--- 1. EMERGENCY DETECTION TESTS ---');
{
  const r1 = detectEmergency('I have severe crushing chest pain radiating to left arm and cannot breathe');
  assert(r1.isEmergency === true, 'Severe chest pain triggers emergency flag');
  assert(r1.flags.length > 0, 'Lists specific emergency red-flags');
  assert(r1.instructions.includes('108') || r1.instructions.includes('112'), 'Directs patient to call emergency 108/112');
  assert(r1.instructions.includes('DO NOT CONTINUE'), 'Instructs not to continue standard questionnaire');

  const r2 = detectEmergency('My grandfather has sudden facial drooping and slurred speech on right side');
  assert(r2.isEmergency === true, 'FAST stroke symptoms trigger emergency flag');

  const r3 = detectEmergency('Coughing up blood profusely since this morning');
  assert(r3.isEmergency === true, 'Severe bleeding / coughing blood triggers emergency flag');

  const rNormal = detectEmergency('I have mild back pain when sitting for long hours');
  assert(rNormal.isEmergency === false, 'Non-emergency mild back pain does not trigger emergency');
}

// ── Test 2: Conversational Follow-up and "I don't understand" ──
console.log('\n--- 2. CONVERSATIONAL SYMPTOM UNDERSTANDING & SIMPLIFICATION ---');
{
  const initialContext = {
    complaint: '',
    symptoms: [],
    duration: '',
    location: '',
    sensation: '',
    onset: '',
    progression: '',
    medications: [],
    allergies: [],
    conditions: [],
    familyHistory: '',
    currentInquiryStep: 0,
  };

  // User expresses confusion
  const resConfused = processIntakeMessage("I don't understand, what do you mean?", initialContext, [], CLINICIAN_DIRECTORY);
  assert(resConfused.reply.toLowerCase().includes('simple') || resConfused.reply.toLowerCase().includes('everyday'), 'Explains in simpler everyday language when patient does not understand');
  assert(!resConfused.reply.includes('1-10') && !resConfused.reply.includes('rate on a scale'), 'Never forces 1-10 numerical scale');

  // User describes initial symptoms in own words
  const res1 = processIntakeMessage("I've been suffering from an itchy red rash on my arms for 3 days", initialContext, [], CLINICIAN_DIRECTORY);
  assert(res1.context.duration === '3 days', 'Extracts duration "3 days"');
  assert(res1.context.location.includes('arm') || res1.context.location.includes('skin'), 'Extracts location (arm/skin)');
  assert(res1.context.symptoms.includes('rash') || res1.context.symptoms.includes('itching'), 'Extracts symptoms (rash/itching)');
  assert(!res1.reply.includes('1-10'), 'Does not force 1-10 scale in follow-up question');
}

// ── Test 3: Department Recommendations for all prompt categories ──
console.log('\n--- 3. SPECIALIST & DEPARTMENT RECOMMENDATIONS ---');

const testCases = [
  {
    category: 'Skin problems',
    prompt: 'I have severe red rash and intense itching with small blisters on my skin',
    expectedDept: 'Dermatology',
    cliniciansPresent: true,
  },
  {
    category: 'Eye problems',
    prompt: 'My right eye has painful redness, watery discharge and blurred vision for 2 days',
    expectedDept: 'Ophthalmology',
    cliniciansPresent: true,
  },
  {
    category: 'Dental problems',
    prompt: 'Severe toothache in upper molar and painful bleeding gums when chewing food',
    expectedDept: 'Dentistry',
    cliniciansPresent: false, // Rule 4: Do NOT invent fake doctors for Dentistry
  },
  {
    category: 'Bone and joint problems',
    prompt: 'Severe knee joint swelling and stiffness, painful to walk after sports injury',
    expectedDept: 'Orthopaedics',
    cliniciansPresent: true,
  },
  {
    category: 'Digestive problems',
    prompt: 'Burning stomach pain, severe acid reflux and indigestion after every meal for a week',
    expectedDept: 'Gastroenterology',
    cliniciansPresent: true,
  },
  {
    category: 'Heart-related symptoms',
    prompt: 'Frequent heart palpitations and irregular fluttering sensation in chest on exertion',
    expectedDept: 'Cardiology',
    cliniciansPresent: true,
  },
  {
    category: 'General symptoms',
    prompt: 'High fever, severe body ache, chills and general fatigue for past 2 days',
    expectedDept: 'General Medicine',
    cliniciansPresent: true,
  },
];

for (const tc of testCases) {
  const ctx = parsePatientInput(tc.prompt, {
    complaint: tc.prompt,
    symptoms: [],
    duration: '2 days',
    location: '',
    sensation: '',
    onset: '',
    progression: '',
    medications: [],
    allergies: [],
    conditions: [],
    familyHistory: '',
    currentInquiryStep: 3,
  });

  const rec = recommendDepartment(ctx, tc.prompt, CLINICIAN_DIRECTORY);

  assert(rec.department === tc.expectedDept, `${tc.category} → ${rec.department} (Expected ${tc.expectedDept})`);
  assert(Boolean(rec.reason && rec.reason.length > 10), `${tc.category} includes clinical reason: "${rec.reason.slice(0, 45)}..."`);
  assert(rec.influencingSymptoms.length > 0, `${tc.category} includes influencing symptoms: [${rec.influencingSymptoms.join(', ')}]`);
  assert(['Emergency', 'Urgent', 'Routine'].includes(rec.urgency), `${tc.category} has valid urgency: ${rec.urgency}`);

  if (tc.cliniciansPresent) {
    assert(rec.matchedClinicians && rec.matchedClinicians.length > 0, `${tc.category} displays real clinicians in directory: ${rec.matchedClinicians.join(', ')}`);
  } else {
    assert(!rec.matchedClinicians || rec.matchedClinicians.length === 0, `${tc.category} does NOT invent fake doctors when directory has none (Rule 4 compliant)`);
  }
}

console.log(`\n========================================`);
console.log(`Test Results: ${passCount} / ${totalCount} PASSED`);
if (passCount === totalCount) {
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
} else {
  console.error('SOME TESTS FAILED.');
}

