import type { Department, UrgencyLevel, DoctorRecommendation } from '../types';
import { CLINICIAN_DIRECTORY } from '../data/seedData';

// ─── Intake Conversation Context ─────────────────────────────────────────────

export interface PatientIntakeContext {
  complaint: string;
  symptoms: string[];
  duration: string;
  location: string;
  sensation: string;
  onset: string;
  progression: string;
  medications: string[];
  allergies: string[];
  conditions: string[];
  familyHistory: string;
  age?: number;
  gender?: string;
  currentInquiryStep: number;
}

export interface IntakeAnalysisResult {
  reply: string;
  isEmergency: boolean;
  emergencyFlags: string[];
  context: PatientIntakeContext;
  recommendation?: DoctorRecommendation;
  quickOptions: string[];
  readyForRecommendation: boolean;
}

// ─── Emergency Red-Flag Detection ────────────────────────────────────────────

export const EMERGENCY_RED_FLAGS = [
  {
    pattern: /chest pain|chest pressure|chest tightness|crushing chest|pain radiating to (left arm|jaw|neck)/i,
    label: 'Acute severe chest pain / potential cardiac crisis',
  },
  {
    pattern: /difficulty breathing|cannot breathe|can't breathe|shortness of breath|severe breathlessness|gasping|choking/i,
    label: 'Severe respiratory distress',
  },
  {
    pattern: /unconscious|loss of consciousness|passed out|fainted|blacked out|unresponsive|collapsed/i,
    label: 'Loss of consciousness / syncope',
  },
  {
    pattern: /facial drooping|slurred speech|speech slurred|arm weakness|sudden paralysis|numbness on one side|stroke/i,
    label: 'Signs of acute stroke (FAST protocol alert)',
  },
  {
    pattern: /coughing (up )?blood|vomiting blood|heavy bleeding|profuse bleeding|uncontrolled bleeding|hemorrhage/i,
    label: 'Severe internal / external bleeding',
  },
  {
    pattern: /throat (swelling|closing)|tongue (swelling|swollen)|cannot swallow and hives|anaphylaxis/i,
    label: 'Severe allergic anaphylaxis',
  },
  {
    pattern: /worst headache of (my )?life|thunderclap headache|sudden unbearable head pain/i,
    label: 'Acute neurological emergency / sudden severe headache',
  },
];

export function detectEmergency(text: string): {
  isEmergency: boolean;
  flags: string[];
  instructions: string;
} {
  const flags: string[] = [];
  for (const flag of EMERGENCY_RED_FLAGS) {
    if (flag.pattern.test(text)) {
      flags.push(flag.label);
    }
  }

  const isEmergency = flags.length > 0;
  const instructions = isEmergency
    ? `🚨 CRITICAL MEDICAL EMERGENCY ALERT:
Based on the symptoms you reported (${flags.join(', ')}), this may be a life-threatening medical emergency.
DO NOT CONTINUE THIS ROUTINE QUESTIONNAIRE.
Please call emergency medical services immediately (Dial 108 or 112) or proceed directly to the nearest hospital Emergency / Casualty department right now.`
    : '';

  return { isEmergency, flags, instructions };
}

// ─── Department Knowledge Base ───────────────────────────────────────────────

interface DepartmentRule {
  department: Department;
  specialistTitle: string;
  aliases: string[];
  keywords: RegExp;
  reason: string;
  defaultUrgency: UrgencyLevel;
}

export const DEPARTMENT_RULES: DepartmentRule[] = [
  {
    department: 'Emergency Medicine',
    specialistTitle: 'Emergency Physician / Casualty Team',
    aliases: ['Emergency & Casualty', 'Casualty', 'Emergency'],
    keywords: /chest pain|heart attack|cannot breathe|severe bleeding|unconscious|stroke|facial drooping|slurred speech|anaphylaxis|poisoning|severe trauma/i,
    reason: 'Emergency Medicine specialists provide immediate life-saving care for acute, unstable, and life-threatening medical conditions.',
    defaultUrgency: 'Emergency',
  },
  {
    department: 'Dermatology',
    specialistTitle: 'Dermatologist (Skin Specialist)',
    aliases: ['Skin', 'Skin OPD'],
    keywords: /skin|rash|itching|itchy|hives|urticaria|eczema|psoriasis|acne|pimples|boil|ringworm|fungal|dry skin|peeling|blister|dermatitis|mole|skin allergy|discoloration/i,
    reason: 'Dermatologists specialize in diseases of the skin, hair, and nails, including inflammatory rashes, allergic skin reactions, infections, and chronic dermatological conditions.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Ophthalmology',
    specialistTitle: 'Ophthalmologist (Eye Specialist)',
    aliases: ['Eye', 'Eye OPD', 'Vision'],
    keywords: /eye|vision|blurry|blurred|eye pain|redness in eye|discharge from eye|floaters|double vision|cataract|glaucoma|stye|conjunctivitis|watery eye|burning eye|blindness|loss of vision/i,
    reason: 'Ophthalmologists provide specialized medical and surgical care for vision problems, eye infections, ocular trauma, and refractive disorders.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Dentistry',
    specialistTitle: 'Dentist / Dental Surgeon',
    aliases: ['Dental', 'Tooth', 'Teeth'],
    keywords: /tooth|teeth|toothache|gum|gums|cavity|dental|bleeding gum|jaw pain|wisdom tooth|broken tooth|tooth sensitivity|tooth decay|swollen jaw|dental abscess|mouth ulcer/i,
    reason: 'Dentists specialize in oral health, treating dental pain, tooth decay, gum inflammation, oral infections, and structural disorders of the teeth and jaw.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Orthopaedics',
    specialistTitle: 'Orthopedic Specialist (Bone & Joint)',
    aliases: ['Orthopedics', 'Ortho', 'Bone and Joint', 'Musculoskeletal'],
    keywords: /bone|joint|knee|back pain|lower back|spine|shoulder|elbow|wrist|hip|ankle|arthritis|fracture|sprain|ligament|tendon|joint swelling|stiffness|difficulty walking|sciatica|slip disc/i,
    reason: 'Orthopedic specialists evaluate and treat musculoskeletal disorders, including joint inflammation, bone fractures, spine conditions, ligament tears, and arthritis.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Gastroenterology',
    specialistTitle: 'Gastroenterologist (Digestive Specialist)',
    aliases: ['GI', 'Digestive', 'Gastro'],
    keywords: /stomach|digestion|digestive|abdomen|abdominal|acid reflux|heartburn|gerd|nausea|vomiting|diarrhoea|diarrhea|constipation|bloating|indigestion|gas|gastritis|stomach cramps|stomach ulcer|jaundice|liver|acidity/i,
    reason: 'Gastroenterologists specialize in the digestive system, treating conditions of the stomach, intestines, esophagus, liver, gallbladder, and pancreas.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Cardiology',
    specialistTitle: 'Cardiologist (Heart Specialist)',
    aliases: ['Heart', 'Cardiac'],
    keywords: /heart|palpitations|irregular heart|fluttering|high blood pressure|hypertension|chest heaviness on exertion|cardiac/i,
    reason: 'Cardiologists specialize in evaluating disorders of the cardiovascular system, including heart rhythm, hypertension, coronary health, and cardiac performance.',
    defaultUrgency: 'Urgent',
  },
  {
    department: 'Pulmonology',
    specialistTitle: 'Pulmonologist (Chest & Lungs)',
    aliases: ['Chest Medicine', 'Lungs', 'Respiratory'],
    keywords: /lung|lungs|cough|persistent cough|chronic cough|asthma|wheezing|bronchitis|sputum|phlegm|chest congestion|smoker's cough|breathlessness on exertion/i,
    reason: 'Pulmonologists specialize in respiratory health, treating diseases of the lungs, bronchial airways, asthma, and chronic pulmonary disorders.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'ENT',
    specialistTitle: 'ENT Specialist (Otolaryngologist)',
    aliases: ['Ear Nose Throat', 'Otolaryngology'],
    keywords: /ear|earache|hearing loss|ringing in ear|tinnitus|throat|sore throat|tonsil|tonsillitis|sinus|sinusitis|nasal congestion|runny nose|hoarseness|loss of voice|vertigo|inner ear/i,
    reason: 'ENT specialists diagnose and manage conditions affecting the ears, nose, sinuses, throat, and balance mechanisms.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Neurology',
    specialistTitle: 'Neurologist (Brain & Nerves)',
    aliases: ['Neuro', 'Nerve'],
    keywords: /migraine|chronic headache|severe headache|dizziness|tremors|tingling|numbness in (hand|foot|leg|arm)|nerve pain|neuropathy|seizure|convulsion|memory loss/i,
    reason: 'Neurologists specialize in conditions affecting the brain, spinal cord, and peripheral nervous system.',
    defaultUrgency: 'Urgent',
  },
  {
    department: 'Paediatrics',
    specialistTitle: 'Paediatrician (Child Specialist)',
    aliases: ['Pediatrics', 'Child Health'],
    keywords: /child|baby|infant|toddler|kid|pediatric|paediatric/i,
    reason: 'Paediatricians provide specialized clinical care, developmental evaluations, and treatment for infants, children, and adolescents.',
    defaultUrgency: 'Urgent',
  },
  {
    department: 'Gynaecology',
    specialistTitle: 'Gynaecologist & Obstetrician',
    aliases: ['Gynecology', 'OBGYN', "Women's Health"],
    keywords: /period|menstrual|menstruation|pregnancy|pregnant|pelvic pain|vaginal|pcos|ovary|ovarian|uterus|uterine|cramps/i,
    reason: 'Gynaecologists specialize in female reproductive health, pregnancy care, menstrual disorders, and hormonal wellness.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Nephrology',
    specialistTitle: 'Nephrologist (Kidney Specialist)',
    aliases: ['Kidney', 'Renal'],
    keywords: /kidney|urine|burning (urination|micturition)|blood in urine|flank pain|kidney stone|foamy urine|reduced urination/i,
    reason: 'Nephrologists specialize in kidney health, urinary system filtration, kidney stones, and fluid-electrolyte balance.',
    defaultUrgency: 'Urgent',
  },
  {
    department: 'Psychiatry',
    specialistTitle: 'Psychiatrist (Mental Health)',
    aliases: ['Mental Health', 'Psychology'],
    keywords: /anxiety|depression|panic attack|insomnia|cannot sleep|mood swing|hallucination|stress|mental health/i,
    reason: 'Psychiatrists specialize in the diagnosis, treatment, and prevention of mental, emotional, and behavioral disorders.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Endocrinology',
    specialistTitle: 'Endocrinologist (Hormones & Diabetes)',
    aliases: ['Diabetes OPD', 'Thyroid'],
    keywords: /thyroid|diabetes|uncontrolled sugar|blood sugar|hormone|hormonal|unexplained weight loss|unexplained weight gain/i,
    reason: 'Endocrinologists specialize in glands and hormones, treating diabetes, thyroid disorders, and metabolic imbalances.',
    defaultUrgency: 'Routine',
  },
  {
    department: 'Surgery',
    specialistTitle: 'General Surgeon',
    aliases: ['General Surgery', 'Surgical'],
    keywords: /hernia|gallstone|gallbladder|appendicitis|abscess|wound|lump|swelling requiring surgery|cyst/i,
    reason: 'Surgeons evaluate and perform surgical procedures for structural defects, abdominal lesions, hernia, and soft tissue masses.',
    defaultUrgency: 'Urgent',
  },
  {
    department: 'General Medicine',
    specialistTitle: 'General Physician (Internal Medicine)',
    aliases: ['Internal Medicine', 'General OPD', 'Family Medicine'],
    keywords: /fever|high temperature|chills|cold|flu|viral|weakness|fatigue|body ache|headache|malaise|tiredness|general checkup|checkup/i,
    reason: 'General Medicine physicians provide comprehensive primary evaluations, acute infection management, systemic symptom investigation, and referral coordination.',
    defaultUrgency: 'Routine',
  },
];

// ─── Extract Clinical Context from User Text ─────────────────────────────────

export function parsePatientInput(text: string, current: PatientIntakeContext): PatientIntakeContext {
  const updated: PatientIntakeContext = { ...current };
  const lower = text.toLowerCase();

  // 1. Duration extraction
  const durationMatch = text.match(/(\d+\s*(?:days|day|weeks|week|months|month|years|year|hours|hour))|since\s+(?:yesterday|today|last\s+\w+)|for\s+(?:a\s+few\s+days|a\s+week|a\s+month)/i);
  if (durationMatch && !updated.duration) {
    updated.duration = durationMatch[0];
  } else if ((lower.includes('today') || lower.includes('started today')) && !updated.duration) {
    updated.duration = 'Started today';
  } else if (lower.includes('yesterday') && !updated.duration) {
    updated.duration = 'Since yesterday';
  }

  // 2. Location extraction
  const locationMap: Array<{ key: string; regex: RegExp }> = [
    { key: 'arm', regex: /\b(?:arm|arms)\b/i },
    { key: 'leg', regex: /\b(?:leg|legs)\b/i },
    { key: 'hand', regex: /\b(?:hand|hands)\b/i },
    { key: 'foot', regex: /\b(?:foot|feet)\b/i },
    { key: 'knee', regex: /\b(?:knee|knees)\b/i },
    { key: 'joint', regex: /\b(?:joint|joints)\b/i },
    { key: 'back', regex: /\b(?:back|lower back|spine)\b/i },
    { key: 'shoulder', regex: /\b(?:shoulder|shoulders)\b/i },
    { key: 'elbow', regex: /\b(?:elbow|elbows)\b/i },
    { key: 'wrist', regex: /\b(?:wrist|wrists)\b/i },
    { key: 'hip', regex: /\b(?:hip|hips)\b/i },
    { key: 'ankle', regex: /\b(?:ankle|ankles)\b/i },
    { key: 'neck', regex: /\b(?:neck)\b/i },
    { key: 'skin', regex: /\b(?:skin)\b/i },
    { key: 'face', regex: /\b(?:face)\b/i },
    { key: 'chest', regex: /\b(?:chest)\b/i },
    { key: 'stomach', regex: /\b(?:stomach|abdomen|tummy|belly)\b/i },
    { key: 'eye', regex: /\b(?:eye|eyes)\b/i },
    { key: 'tooth', regex: /\b(?:tooth|teeth)\b/i },
    { key: 'gum', regex: /\b(?:gum|gums)\b/i },
    { key: 'jaw', regex: /\b(?:jaw|jaws)\b/i },
    { key: 'ear', regex: /\b(?:ear|ears)\b/i },
    { key: 'throat', regex: /\b(?:throat)\b/i },
    { key: 'head', regex: /\b(?:head)\b/i },
    { key: 'pelvis', regex: /\b(?:pelvis|pelvic)\b/i },
  ];

  for (const loc of locationMap) {
    if (loc.regex.test(lower)) {
      if (!updated.location) updated.location = loc.key;
      else if (!updated.location.includes(loc.key)) updated.location += `, ${loc.key}`;
    }
  }

  // 3. Sensation / Character
  const sensations = ['sharp', 'dull', 'burning', 'throbbing', 'stabbing', 'stiff', 'aching', 'mild', 'severe', 'cramping', 'itching', 'tightness'];
  for (const sen of sensations) {
    if (new RegExp(`\\b${sen}\\b`, 'i').test(lower)) {
      if (!updated.sensation) updated.sensation = sen;
      else if (!updated.sensation.includes(sen)) updated.sensation += `, ${sen}`;
    }
  }

  // 4. Onset & Trigger
  if (lower.includes('sudden') || lower.includes('suddenly')) {
    updated.onset = 'Sudden onset';
  } else if (lower.includes('gradual') || lower.includes('slowly')) {
    updated.onset = 'Gradual onset';
  } else if (lower.includes('after eating') || lower.includes('after food')) {
    updated.onset = 'Triggered after meals';
  } else if (lower.includes('after injury') || lower.includes('after fall') || lower.includes('after playing') || lower.includes('fell')) {
    updated.onset = 'Started after physical strain / injury';
  }

  // 5. Progression
  if (lower.includes('getting worse') || lower.includes('worsening') || lower.includes('increased')) {
    updated.progression = 'Worsening';
  } else if (lower.includes('getting better') || lower.includes('improving')) {
    updated.progression = 'Improving';
  } else if (lower.includes('same') || lower.includes('unchanged')) {
    updated.progression = 'Unchanged';
  }

  // 6. Medications
  if (lower.includes('no medicine') || lower.includes('no daily') || lower.includes('none') || lower.includes('no tablets')) {
    // None
  } else if (lower.includes('paracetamol') || lower.includes('crocin') || lower.includes('pain') || lower.includes('metformin') || lower.includes('bp medicine') || lower.includes('insulin') || lower.includes('inhaler') || lower.includes('ointment')) {
    const medMatches = text.match(/(?:taking|on|use|prescribed)\s+([^,.]+)/i);
    const medName = medMatches ? medMatches[1].trim() : text;
    if (!updated.medications.includes(medName)) {
      updated.medications = [...updated.medications, medName];
    }
  }

  // 7. Allergies
  if (lower.includes('no allergy') || lower.includes('no known') || lower.includes('nkda')) {
    if (!updated.allergies.includes('No Known Drug Allergies (NKDA)')) {
      updated.allergies = ['No Known Drug Allergies (NKDA)'];
    }
  } else if (lower.includes('allergic to') || lower.includes('penicillin') || lower.includes('sulfa') || lower.includes('peanuts')) {
    const allergyMatch = text.match(/allergic to\s+([^,.]+)/i);
    const item = allergyMatch ? allergyMatch[1].trim() : text;
    if (!updated.allergies.includes(item)) {
      updated.allergies = [...updated.allergies, item];
    }
  }

  // 8. Existing Conditions
  if (lower.includes('diabet') || lower.includes('hypertension') || lower.includes('high bp') || lower.includes('asthma') || lower.includes('thyroid') || lower.includes('arthritis')) {
    const conditionsFound = ['Diabetes', 'Hypertension', 'Asthma', 'Thyroid', 'Arthritis'].filter(c => lower.includes(c.toLowerCase()));
    for (const c of conditionsFound) {
      if (!updated.conditions.includes(c)) {
        updated.conditions = [...updated.conditions, c];
      }
    }
  }

  // 9. Chief Complaint & Symptoms List
  if (!updated.complaint && text.length > 3) {
    updated.complaint = text;
  }

  // Extract symptom candidate phrases
  const symptomKeywords: Array<{ label: string; pattern: RegExp }> = [
    { label: 'fever', pattern: /\b(?:fever|high temperature|pyrexia)\b/i },
    { label: 'chills', pattern: /\b(?:chills|shivering)\b/i },
    { label: 'cough', pattern: /\b(?:cough|coughing)\b/i },
    { label: 'cold', pattern: /\b(?:cold|runny nose|sneezing)\b/i },
    { label: 'headache', pattern: /\b(?:headache|migraine)\b/i },
    { label: 'dizziness', pattern: /\b(?:dizziness|vertigo|dizzy|lightheaded)\b/i },
    { label: 'nausea', pattern: /\b(?:nausea|nauseous)\b/i },
    { label: 'vomiting', pattern: /\b(?:vomiting|vomit)\b/i },
    { label: 'diarrhea', pattern: /\b(?:diarrhea|diarrhoea|loose motion)\b/i },
    { label: 'constipation', pattern: /\b(?:constipation)\b/i },
    { label: 'acid reflux', pattern: /\b(?:acid reflux|heartburn|gerd|acidity)\b/i },
    { label: 'stomach pain', pattern: /\b(?:stomach (?:pain|ache)|abdominal pain|tummy ache)\b/i },
    { label: 'rash', pattern: /\b(?:rash|rashes|hives|spots|lesions)\b/i },
    { label: 'itching', pattern: /\b(?:itching|itchy|itch)\b/i },
    { label: 'knee pain', pattern: /\b(?:knee pain)\b/i },
    { label: 'back pain', pattern: /\b(?:back pain|backache)\b/i },
    { label: 'joint pain', pattern: /\b(?:joint pain)\b/i },
    { label: 'joint swelling', pattern: /\b(?:joint swelling)\b/i },
    { label: 'swelling', pattern: /\b(?:swelling|swollen|edema)\b/i },
    { label: 'stiffness', pattern: /\b(?:stiffness|stiff)\b/i },
    { label: 'toothache', pattern: /\b(?:toothache|tooth pain)\b/i },
    { label: 'gum bleeding', pattern: /\b(?:gum bleeding|bleeding gums)\b/i },
    { label: 'blurred vision', pattern: /\b(?:blurred vision|blurry vision)\b/i },
    { label: 'eye redness', pattern: /\b(?:eye redness|red eye|redness in eye)\b/i },
    { label: 'earache', pattern: /\b(?:earache|ear pain)\b/i },
    { label: 'sore throat', pattern: /\b(?:sore throat|throat pain)\b/i },
    { label: 'chest heaviness', pattern: /\b(?:chest heaviness|heaviness in chest)\b/i },
    { label: 'palpitations', pattern: /\b(?:palpitations|fluttering heart)\b/i },
    { label: 'fatigue', pattern: /\b(?:fatigue|tiredness|exhaustion)\b/i },
    { label: 'weakness', pattern: /\b(?:weakness|body weakness)\b/i },
    { label: 'burning urination', pattern: /\b(?:burning urination|burning when passing urine)\b/i },
    { label: 'loss of appetite', pattern: /\b(?:loss of appetite|not feeling hungry)\b/i },
  ];

  for (const s of symptomKeywords) {
    if (s.pattern.test(lower) && !updated.symptoms.includes(s.label)) {
      updated.symptoms = [...updated.symptoms, s.label];
    }
  }

  return updated;
}

// ─── Department Recommendation Engine ────────────────────────────────────────

export function recommendDepartment(
  context: PatientIntakeContext,
  allText: string,
  userDirectoryClinicians: Record<string, string[]> = CLINICIAN_DIRECTORY
): DoctorRecommendation {
  const combinedText = `${context.complaint} ${context.symptoms.join(' ')} ${context.location} ${context.sensation} ${allText}`.toLowerCase();

  // Check emergency first
  const emergencyCheck = detectEmergency(combinedText);
  if (emergencyCheck.isEmergency) {
    return {
      department: 'Emergency Medicine',
      departmentDisplay: 'Emergency Medicine & Casualty',
      specialistTitle: 'Emergency Physician / Casualty Triage',
      reason: 'Potentially life-threatening symptoms detected requiring immediate physical resuscitation and acute medical stabilization.',
      influencingSymptoms: emergencyCheck.flags,
      urgency: 'Emergency',
      matchedClinicians: userDirectoryClinicians['Emergency Medicine'] || ['Dr. Priya Menon'],
      isEmergency: true,
      emergencyWarning: emergencyCheck.instructions,
      timestamp: new Date().toISOString(),
    };
  }

  // Score each department based on keyword matching and context
  const scores: { rule: DepartmentRule; score: number; matchedWords: string[] }[] = [];

  for (const rule of DEPARTMENT_RULES) {
    if (rule.department === 'Emergency Medicine') continue; // Handled above

    let score = 0;
    const matchedWords: string[] = [];

    // Check keywords
    const regex = new RegExp(rule.keywords.source, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(combinedText)) !== null) {
      score += 3;
      if (!matchedWords.includes(match[0].toLowerCase())) {
        matchedWords.push(match[0].toLowerCase());
      }
    }

    // Check location match
    if (context.location && new RegExp(rule.keywords.source, 'gi').test(context.location)) {
      score += 4;
    }

    // Age heuristic: children under 14 should favor Paediatrics unless specialized
    if (context.age && context.age < 14 && rule.department === 'Paediatrics') {
      score += 5;
    }

    scores.push({ rule, score, matchedWords });
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);
  const bestMatch = scores[0];

  // If no specific match found, recommend General Medicine
  const selectedRule = (bestMatch && bestMatch.score > 0)
    ? bestMatch.rule
    : DEPARTMENT_RULES.find(r => r.department === 'General Medicine')!;

  const matchedKeywords = bestMatch && bestMatch.score > 0 ? bestMatch.matchedWords : ['general health symptoms'];

  // Determine Urgency
  let urgency: UrgencyLevel = selectedRule.defaultUrgency;
  if (
    combinedText.includes('severe') ||
    combinedText.includes('unbearable') ||
    combinedText.includes('high fever') ||
    combinedText.includes('103') ||
    combinedText.includes('104') ||
    combinedText.includes('acute') ||
    combinedText.includes('swelling rapidly') ||
    combinedText.includes('sudden loss')
  ) {
    urgency = 'Urgent';
  } else if (
    context.duration &&
    (context.duration.includes('month') || context.duration.includes('year') || context.duration.includes('weeks'))
  ) {
    urgency = 'Routine';
  }

  // Influencing symptoms formulation
  const influencingSymptoms: string[] = [];
  if (context.symptoms.length > 0) {
    influencingSymptoms.push(...context.symptoms.map(s => s.charAt(0).toUpperCase() + s.slice(1)));
  } else if (context.complaint) {
    influencingSymptoms.push(context.complaint);
  }
  if (context.location) {
    influencingSymptoms.push(`Affected area: ${context.location}`);
  }
  if (context.sensation) {
    influencingSymptoms.push(`Sensation: ${context.sensation}`);
  }
  if (context.duration) {
    influencingSymptoms.push(`Duration: ${context.duration}`);
  }
  if (matchedKeywords.length > 0 && influencingSymptoms.length === 0) {
    influencingSymptoms.push(...matchedKeywords);
  }

  // Real clinicians from actual directory (Do NOT invent doctors)
  const actualClinicians = userDirectoryClinicians[selectedRule.department] || [];

  return {
    department: selectedRule.department,
    departmentDisplay: selectedRule.department === 'Orthopaedics' ? 'Orthopaedics / Orthopedics' : selectedRule.department,
    specialistTitle: selectedRule.specialistTitle,
    reason: selectedRule.reason,
    influencingSymptoms: Array.from(new Set(influencingSymptoms)),
    urgency,
    matchedClinicians: actualClinicians,
    isEmergency: false,
    timestamp: new Date().toISOString(),
  };
}

// ─── Conversational Follow-up Inquiry Generator ───────────────────────────────

export interface InquiryStep {
  stepId: number;
  topicName: string;
  isSatisfied: (ctx: PatientIntakeContext) => boolean;
  question: (ctx: PatientIntakeContext) => string;
  simplifiedExplanation: (ctx: PatientIntakeContext) => string;
  quickOptions: (ctx: PatientIntakeContext) => string[];
}

export const INQUIRY_STEPS: InquiryStep[] = [
  {
    stepId: 0,
    topicName: 'Chief Complaint',
    isSatisfied: (ctx) => Boolean(ctx.complaint.trim() && ctx.complaint.length > 3),
    question: () => "Namaste! I am your AI Clinical Intake Assistant. In your own words, what primary health concern or symptom brought you in today?",
    simplifiedExplanation: () => "What problem or sickness is troubling you right now that you want the doctor to check?",
    quickOptions: () => ["Joint or back pain", "Stomach or digestion problem", "Skin rash or itching", "Eye or vision problem", "Toothache or dental issue", "Fever, cold, or body ache", "Heart or chest concern"]
  },
  {
    stepId: 1,
    topicName: 'Location & Sensation',
    isSatisfied: (ctx) => Boolean(ctx.location || ctx.sensation),
    question: () => `Could you describe where in your body you feel the discomfort, and does it feel sharp, dull, burning, aching, or stiff?`,
    simplifiedExplanation: () => "Where does it hurt, and what kind of feeling is it? For example: does it burn, throb, ache, or feel stiff?",
    quickOptions: () => ["Dull ache", "Sharp / Stabbing", "Burning sensation", "Throbbing / Stiff", "Mild discomfort"]
  },
  {
    stepId: 2,
    topicName: 'Duration & Onset',
    isSatisfied: (ctx) => Boolean(ctx.duration || ctx.onset),
    question: () => `Approximately when did this problem start, and did it come on suddenly or develop gradually over time?`,
    simplifiedExplanation: () => "How many days or weeks have you had this problem? Did it start all of a sudden, or little by little?",
    quickOptions: () => ["Started today", "2 to 3 days ago", "About 1 week ago", "2 to 3 weeks ago", "Chronic (over a month)", "Sudden after injury"]
  },
  {
    stepId: 3,
    topicName: 'Associated Symptoms',
    isSatisfied: (ctx) => ctx.symptoms.length >= 2 || ctx.progression !== '',
    question: () => `Have you noticed any other related symptoms, such as fever, swelling, nausea, headache, or difficulty with daily activities?`,
    simplifiedExplanation: () => "Are there any other problems happening at the same time, like fever, swelling, feeling sick to your stomach, or feeling very weak?",
    quickOptions: () => ["No other symptoms", "Mild fever or chills", "Visible swelling", "Nausea / loss of appetite", "Difficulty walking / moving", "Fatigue and tiredness"]
  },
  {
    stepId: 4,
    topicName: 'Medications & Health History',
    isSatisfied: (ctx) => ctx.medications.length > 0 || ctx.conditions.length > 0,
    question: () => `Are you currently taking any prescription tablets or daily medicines, and do you have any conditions like diabetes or high blood pressure?`,
    simplifiedExplanation: () => "Do you take any daily medicines or pills? And do you have sugar (diabetes), BP, or any other long-term condition?",
    quickOptions: () => ["No daily medicines", "Blood pressure medicine", "Diabetes medicine", "Pain relief tablets", "Ayurvedic medicines"]
  },
  {
    stepId: 5,
    topicName: 'Known Allergies',
    isSatisfied: (ctx) => ctx.allergies.length > 0,
    question: () => `Do you have any known allergies to medicines (such as penicillin or sulfa drugs) or foods?`,
    simplifiedExplanation: () => "Does any medicine or food give you a bad reaction, itching, swelling, or rash?",
    quickOptions: () => ["No known allergies (NKDA)", "Penicillin / antibiotics", "Sulfa drugs", "Food allergies", "I am not sure"]
  }
];

// ─── Main Conversational Engine Step Runner ──────────────────────────────────

export function processIntakeMessage(
  userMessage: string,
  currentContext: PatientIntakeContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  clinicianDirectory: Record<string, string[]> = CLINICIAN_DIRECTORY
): IntakeAnalysisResult {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();

  // 1. Emergency Detection Check
  const emergencyCheck = detectEmergency(trimmed);
  if (emergencyCheck.isEmergency) {
    const updatedContext = parsePatientInput(trimmed, currentContext);
    const rec = recommendDepartment(updatedContext, trimmed, clinicianDirectory);
    return {
      reply: emergencyCheck.instructions,
      isEmergency: true,
      emergencyFlags: emergencyCheck.flags,
      context: updatedContext,
      recommendation: rec,
      quickOptions: ["Dial Emergency 108 / 112", "Proceed to Casualty Ward", "Dismiss Alert"],
      readyForRecommendation: true,
    };
  }

  // 2. Parse Clinical Entities from User Input
  const updatedContext = parsePatientInput(trimmed, currentContext);

  // 3. Check if patient is asking for plain language / simpler explanation
  const isConfusion =
    lower.includes("don't understand") ||
    lower.includes("dont understand") ||
    lower.includes("what do you mean") ||
    lower.includes("too complicated") ||
    lower.includes("simpler") ||
    lower === 'what' ||
    lower === 'explain' ||
    lower.includes('explain simply');

  if (isConfusion) {
    const activeStep = INQUIRY_STEPS[Math.min(currentContext.currentInquiryStep, INQUIRY_STEPS.length - 1)];
    const explanation = activeStep.simplifiedExplanation(updatedContext);
    return {
      reply: `No problem at all! Let me explain in simple everyday words: ${explanation}`,
      isEmergency: false,
      emergencyFlags: [],
      context: updatedContext,
      quickOptions: [...activeStep.quickOptions(updatedContext), "Skip this question"],
      readyForRecommendation: false,
    };
  }

  // 4. Check if patient explicitly asks for doctor / department recommendation
  const asksForDoctor =
    /which doctor|what doctor|which specialist|what specialist|recommend a doctor|suggest a doctor|who should i see|which department|who should i consult/i.test(lower);

  // 5. Evaluate if we have sufficient clinical information
  // Sufficient information = has complaint/symptoms + at least 2 other key dimensions (location/duration/sensation/meds)
  const infoCount = [
    Boolean(updatedContext.complaint || updatedContext.symptoms.length > 0),
    Boolean(updatedContext.location),
    Boolean(updatedContext.duration),
    Boolean(updatedContext.sensation),
    Boolean(updatedContext.onset),
    Boolean(updatedContext.medications.length > 0 || updatedContext.conditions.length > 0),
  ].filter(Boolean).length;

  const hasSufficientInfo = infoCount >= 3 || updatedContext.currentInquiryStep >= 4;

  if (asksForDoctor || (hasSufficientInfo && updatedContext.currentInquiryStep >= 3)) {
    const recommendation = recommendDepartment(
      updatedContext,
      conversationHistory.map(h => h.content).join(' ') + ' ' + trimmed,
      clinicianDirectory
    );

    const docNameString = recommendation.matchedClinicians && recommendation.matchedClinicians.length > 0
      ? `Our hospital directory lists ${recommendation.matchedClinicians.join(' and ')} in this department.`
      : `An on-duty specialist from this department will be assigned during registration.`;

    const reply = `Based on your symptoms (${recommendation.influencingSymptoms.slice(0, 3).join(', ')}), I recommend consulting the **${recommendation.departmentDisplay || recommendation.department}** department (${recommendation.specialistTitle}).

${recommendation.reason}

${docNameString}
Suggested Urgency: **${recommendation.urgency}**.

*Note: This is an AI-assisted clinical triage recommendation, not a confirmed diagnosis or prescription. A qualified clinician must confirm your diagnosis upon consultation.*`;

    return {
      reply,
      isEmergency: false,
      emergencyFlags: [],
      context: { ...updatedContext, currentInquiryStep: 5 },
      recommendation,
      quickOptions: [`Proceed with ${recommendation.department}`, "Ask another symptom question", "Review Intake Summary"],
      readyForRecommendation: true,
    };
  }

  // 6. Find the next unsatisfied question
  let nextStepIdx = updatedContext.currentInquiryStep;
  // If the user said "skip" or "not sure", advance to next step
  if (lower.includes("skip") || lower.includes("not sure") || lower.includes("don't know") || lower.includes("dont know")) {
    nextStepIdx = Math.min(INQUIRY_STEPS.length - 1, nextStepIdx + 1);
  } else {
    // Advance to next unsatisfied step
    while (nextStepIdx < INQUIRY_STEPS.length && INQUIRY_STEPS[nextStepIdx].isSatisfied(updatedContext)) {
      nextStepIdx++;
    }
  }

  if (nextStepIdx >= INQUIRY_STEPS.length) {
    // All steps satisfied! Produce doctor recommendation
    const recommendation = recommendDepartment(
      updatedContext,
      conversationHistory.map(h => h.content).join(' ') + ' ' + trimmed,
      clinicianDirectory
    );

    const docNameString = recommendation.matchedClinicians && recommendation.matchedClinicians.length > 0
      ? `Our hospital directory lists ${recommendation.matchedClinicians.join(' and ')} in this department.`
      : `An on-duty specialist from this department will be assigned during registration.`;

    return {
      reply: `Thank you for sharing your symptoms and medical history. Based on your report, I recommend consulting the **${recommendation.departmentDisplay || recommendation.department}** department (${recommendation.specialistTitle}).

${recommendation.reason}

${docNameString}
Suggested Urgency: **${recommendation.urgency}**.`,
      isEmergency: false,
      emergencyFlags: [],
      context: { ...updatedContext, currentInquiryStep: nextStepIdx },
      recommendation,
      quickOptions: [`Proceed with ${recommendation.department}`, "Apply to Intake Form"],
      readyForRecommendation: true,
    };
  }

  // Ask the next question
  const nextStep = INQUIRY_STEPS[nextStepIdx];
  const questionText = nextStep.question(updatedContext);

  return {
    reply: `Thank you. ${questionText}`,
    isEmergency: false,
    emergencyFlags: [],
    context: { ...updatedContext, currentInquiryStep: nextStepIdx },
    quickOptions: [...nextStep.quickOptions(updatedContext), "I don't understand, explain simply", "Skip this question"],
    readyForRecommendation: false,
  };
}
