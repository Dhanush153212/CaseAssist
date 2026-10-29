import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  User, Stethoscope, ClipboardList, Pill, History, CheckCircle,
  ChevronRight, ChevronLeft, AlertTriangle, Sparkles, Mic,
  Volume2, Plus, X, Send, Bot, RefreshCw, UploadCloud, Camera,
  Image as ImageIcon, Trash2, Eye, ShieldAlert, CheckCircle2,
  FileText, Check
} from 'lucide-react';
import {
  calculateCompleteness, detectGaps, generateMemoryPrompts,
  checkEmergencyFlags, generateCaseId, normalizeCase
} from '../utils/helpers';
import { INDIAN_STATES, DEPARTMENTS } from '../data/seedData';
import type { PatientCase, Department, Gender, PrescriptionAttachment } from '../types';
import { uploadPrescriptionPhoto, validatePrescriptionFile } from '../services/storage';

export interface IntakeTopic {
  id: number;
  key: string;
  title: string;
  prompt: string;
  options: string[];
}

export const INTAKE_TOPICS: IntakeTopic[] = [
  {
    id: 0,
    key: 'complaint',
    title: 'Reason for Visit',
    prompt: 'What primary health concern or symptom brought you to the hospital today?',
    options: ['Joint / Back Pain', 'Digestive / Stomach Issue', 'Fever & Weakness', 'Skin Problem', 'Headache & Migraine', 'Other Health Concern']
  },
  {
    id: 1,
    key: 'sensation',
    title: 'Location & Sensation',
    prompt: 'Which part of your body is affected, and does the discomfort feel sharp, dull, burning, aching, or stiff?',
    options: ['Dull Ache', 'Sharp / Stabbing', 'Burning Sensation', 'Throbbing & Stiff', 'Mild Discomfort']
  },
  {
    id: 2,
    key: 'duration',
    title: 'Onset & Duration',
    prompt: 'Approximately when did you first notice this problem starting?',
    options: ['Started today', '2 to 3 days ago', 'About 1 week ago', '2 to 3 weeks ago', 'Chronic (months)']
  },
  {
    id: 3,
    key: 'timing',
    title: 'Continuous or Intermittent',
    prompt: 'Does this symptom trouble you continuously throughout the day, or does it come and go in waves?',
    options: ['Continuous all day', 'Comes and goes in waves', 'Worse in the morning', 'Worse in evening', 'Triggered after meals']
  },
  {
    id: 4,
    key: 'progression',
    title: 'Symptom Progression',
    prompt: 'Over the past few days, has your condition been getting better, worsening, or staying about the same?',
    options: ['Getting worse', 'Gradually improving', 'Staying unchanged', 'Fluctuating daily']
  },
  {
    id: 5,
    key: 'associated',
    title: 'Other Symptoms',
    prompt: 'Have you noticed any other related symptoms, such as fever, nausea, dizziness, fatigue, or disturbed sleep?',
    options: ['No other symptoms', 'Mild fever & chills', 'Nausea / loss of appetite', 'Fatigue & exhaustion', 'Difficulty sleeping']
  },
  {
    id: 6,
    key: 'medications',
    title: 'Current Medicines',
    prompt: 'Are you currently taking any prescription tablets, daily supplements, or Ayurvedic remedies?',
    options: ['No daily medicines', 'Blood pressure medicine', 'Diabetes tablets', 'Ayurvedic formulations', 'Pain relievers']
  },
  {
    id: 7,
    key: 'allergies',
    title: 'Known Allergies',
    prompt: 'Do you have any known allergies to medicines (such as penicillin or sulfa), foods, or herbs?',
    options: ['No known allergies (NKDA)', 'Penicillin / antibiotics', 'Sulfa drugs', 'Food allergy', 'I am not sure']
  },
  {
    id: 8,
    key: 'conditions',
    title: 'Existing Conditions',
    prompt: 'Have you previously been diagnosed with high blood pressure, diabetes, thyroid, asthma, or other conditions?',
    options: ['No chronic conditions', 'Diabetes (high sugar)', 'Hypertension (high BP)', 'Thyroid disorder', 'Asthma / respiratory']
  },
  {
    id: 9,
    key: 'surgeries',
    title: 'Past Surgeries & Illnesses',
    prompt: 'Have you had any previous major illnesses, hospitalizations, or surgical operations in the past?',
    options: ['No past surgeries', 'Appendectomy / gallbladder', 'Orthopedic surgery', 'Past hospitalization only', 'Prefer not to say']
  },
  {
    id: 10,
    key: 'family',
    title: 'Family Medical History',
    prompt: 'Is there any history of diabetes, heart conditions, arthritis, or asthma in your immediate family?',
    options: ['None known in family', 'Diabetes in family', 'Heart condition in family', 'Hypertension in family', 'Joint / arthritis in family']
  },
  {
    id: 11,
    key: 'additional',
    title: 'Additional Notes',
    prompt: 'Is there anything else about your daily routine, diet, or health you would like the doctor to know?',
    options: ['Everything covered', 'Have recent blood test reports', 'Vegetarian diet', 'High stress / desk job']
  },
];

const STEPS = [
  { id: 1, label: 'Demographics', icon: User },
  { id: 2, label: 'Symptoms & Vitals', icon: Stethoscope },
  { id: 3, label: 'Medical History', icon: ClipboardList },
  { id: 4, label: 'Medications & Allergies', icon: Pill },
  { id: 5, label: 'Procedures & Family', icon: History },
  { id: 6, label: 'Review & Consent', icon: CheckCircle },
];

export default function PatientIntakeWizard() {
  const { cases, addCase, setActiveView } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>(28);
  const [gender, setGender] = useState<Gender>('Male');
  const [dob, setDob] = useState('');
  const [contact, setContact] = useState('+91 98450 ');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [city, setCity] = useState('Bengaluru');
  const [pinCode, setPinCode] = useState('560001');
  const [abhaId, setAbhaId] = useState('91-4829-1049-2810');
  const [uhid, setUhid] = useState('AIIA-MK-2026-1001');

  // Clinical
  const [complaint, setComplaint] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState(5);
  const [department, setDepartment] = useState<Department>('General Medicine');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [initialObservations, setInitialObservations] = useState('');

  // Medical History
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');

  // Meds & Allergies
  const [medications, setMedications] = useState<string[]>([]);
  const [medInput, setMedInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [nkdaConfirmed, setNkdaConfirmed] = useState(false);

  // Procedures & Family
  const [procedures, setProcedures] = useState<string[]>([]);
  const [procedureInput, setProcedureInput] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');

  // Prescription Photo Upload
  const [prescriptionImages, setPrescriptionImages] = useState<PrescriptionAttachment[]>([]);
  const [uploadingRx, setUploadingRx] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rxError, setRxError] = useState('');
  const [previewRxModal, setPreviewRxModal] = useState<PrescriptionAttachment | null>(null);

  // AI Intake Assistant Chat Modal & Clinical Topics State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopicIndex, setAiTopicIndex] = useState(0);
  const [aiHistoryAnswers, setAiHistoryAnswers] = useState<Record<string, string>>({});
  const [showSummaryReview, setShowSummaryReview] = useState(false);
  const [isEmergencyDetected, setIsEmergencyDetected] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'Namaste! I am your AI Clinical Intake Assistant for Ministry of AYUSH & AIIA. What primary health concern or symptom brought you to the hospital today?',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Live Calculations
  const currentCaseDraft: Partial<PatientCase> = useMemo(() => {
    return {
      name,
      age: Number(age) || 0,
      gender,
      contact,
      city,
      state,
      department,
      complaint,
      prescriptionImages,
      patientInfo: {
        name,
        age: Number(age) || 0,
        gender,
        dateOfBirth: dob,
        contactNumber: contact,
        city,
        state,
        district,
        pinCode,
        hospitalRegNumber: uhid,
        abhaId,
        uhid,
      },
      clinicalInfo: {
        chiefComplaint: complaint,
        duration,
        symptoms,
        department,
        assignedClinician: 'Dr. Ramesh Sharma, MD (Ayu)',
        initialObservations,
        severity,
      },
      medicalHistory: {
        existingConditions: conditions,
        currentMedications: medications,
        allergies: nkdaConfirmed ? ['No Known Drug Allergies (NKDA)'] : allergies,
        previousProcedures: procedures,
        familyHistory,
        prescriptionImages,
      },
      caseManagement: {
        priority: severity >= 8 ? 'High' : 'Normal',
        assignedDepartment: department,
        reviewStatus: 'New',
        followUpDate: '',
        notes: '',
        nextActions: '',
      },
    };
  }, [name, age, gender, dob, contact, city, state, district, pinCode, abhaId, uhid, complaint, duration, severity, department, symptoms, initialObservations, conditions, medications, allergies, nkdaConfirmed, procedures, familyHistory, prescriptionImages]);

  const { score: completenessScore, items: completenessItems } = useMemo(() => calculateCompleteness(currentCaseDraft), [currentCaseDraft]);
  const gaps = useMemo(() => detectGaps(currentCaseDraft), [currentCaseDraft]);
  const memoryPrompts = useMemo(() => generateMemoryPrompts(currentCaseDraft), [currentCaseDraft]);
  const emergencyCheck = useMemo(() => checkEmergencyFlags(complaint, symptoms), [complaint, symptoms]);

  // Validation before proceeding
  function validateCurrentStep(): boolean {
    if (currentStep === 1) {
      if (!name.trim()) { alert('Please enter the patient legal name.'); return false; }
      if (!age || Number(age) <= 0) { alert('Please enter a valid patient age.'); return false; }
      if (!contact.trim() || contact.trim() === '+91 ') { alert('Please enter a valid phone number.'); return false; }
    } else if (currentStep === 2) {
      if (!complaint.trim()) { alert('Please record the primary chief complaint or reason for visit.'); return false; }
    }
    return true;
  }

  function handleNext() {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handlePrev() {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Submit Final Case
  async function handleSubmit() {
    if (!consentChecked) {
      alert('Please confirm the DPDP Act 2023 Digital Health Consent before final submission.');
      return;
    }

    setSubmitting(true);
    try {
      const generatedId = generateCaseId(cases.map(c => c.id));
      const finalCase = normalizeCase({
        ...currentCaseDraft,
        id: generatedId,
        hospital: 'All India Institute of Ayurveda (AIIA)',
        hospitalName: 'All India Institute of Ayurveda (AIIA)',
        status: 'Awaiting Clinical Review',
        priority: emergencyCheck.hasEmergency ? 'Critical' : (severity >= 8 ? 'High' : (severity <= 3 ? 'Low' : 'Medium')),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'Patient Kiosk Intake',
        messages: [],
        hasEmergencyRedFlag: emergencyCheck.hasEmergency,
        emergencyFlags: emergencyCheck.flags,
      });

      await addCase(finalCase);
      setSubmittedCaseId(generatedId);
    } catch (err: any) {
      alert('Submission error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Prescription Photo Upload Handlers ──
  async function handlePrescriptionFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setRxError('');
    const validation = validatePrescriptionFile(file);
    if (!validation.valid) {
      setRxError(validation.error || 'Invalid file format');
      return;
    }

    setUploadingRx(true);
    setUploadProgress(15);
    try {
      const attachment = await uploadPrescriptionPhoto(file, {
        onProgress: (pct) => setUploadProgress(pct),
      });
      setPrescriptionImages(prev => [...prev, attachment]);
      // If candidate medicines were detected, auto-add to medications list
      if (attachment.extractedMedicines && attachment.extractedMedicines.length > 0) {
        attachment.extractedMedicines.forEach(m => {
          if (!medications.includes(m)) {
            setMedications(prev => [...prev, m]);
          }
        });
      }
    } catch (err: any) {
      setRxError(err.message || 'Prescription photo upload failed');
    } finally {
      setUploadingRx(false);
      setUploadProgress(0);
      if (e.target) e.target.value = '';
    }
  }

  function handleRemovePrescription(id: string) {
    setPrescriptionImages(prev => prev.filter(img => img.id !== id));
  }

  // ── AI Intake Assistant Handlers ──
  async function handleSendAiChat(customText?: string) {
    const textToSend = (customText !== undefined ? customText : userInput).trim();
    if (!textToSend) return;
    setUserInput('');

    // Check emergency red flags
    const lower = textToSend.toLowerCase();
    const isEmerg = (lower.includes('chest') && (lower.includes('pain') || lower.includes('pressure'))) ||
      lower.includes('shortness of breath') || lower.includes('difficulty breathing') ||
      lower.includes('loss of consciousness') || lower.includes('coughing blood') ||
      lower.includes('stroke') || lower.includes('facial drooping');

    if (isEmerg) {
      setIsEmergencyDetected(true);
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }]);

    // Save answer to current clinical topic
    const currentTopic = INTAKE_TOPICS[aiTopicIndex];
    if (currentTopic) {
      setAiHistoryAnswers(prev => ({ ...prev, [currentTopic.key]: textToSend }));

      // Automatically sync relevant answers to wizard form state
      if (currentTopic.key === 'complaint' && !complaint) setComplaint(textToSend);
      if (currentTopic.key === 'duration' && !duration) setDuration(textToSend);
      if (currentTopic.key === 'sensation' && !symptoms.includes(textToSend)) setSymptoms(prev => [...prev, textToSend]);
      if (currentTopic.key === 'associated' && textToSend.toLowerCase() !== 'none' && !textToSend.toLowerCase().includes('no other')) {
        if (!symptoms.includes(textToSend)) setSymptoms(prev => [...prev, textToSend]);
      }
      if (currentTopic.key === 'medications' && !textToSend.toLowerCase().includes('no daily') && !textToSend.toLowerCase().includes('none')) {
        if (!medications.includes(textToSend)) setMedications(prev => [...prev, textToSend]);
      }
      if (currentTopic.key === 'allergies') {
        if (textToSend.toLowerCase().includes('no known') || textToSend.toLowerCase().includes('nkda')) {
          setNkdaConfirmed(true);
        } else if (!allergies.includes(textToSend) && textToSend.toLowerCase() !== 'none') {
          setAllergies(prev => [...prev, textToSend]);
        }
      }
      if (currentTopic.key === 'conditions' && !textToSend.toLowerCase().includes('no chronic') && !textToSend.toLowerCase().includes('none')) {
        if (!conditions.includes(textToSend)) setConditions(prev => [...prev, textToSend]);
      }
      if (currentTopic.key === 'family' && !familyHistory && !textToSend.toLowerCase().includes('none')) {
        setFamilyHistory(textToSend);
      }
    }

    // Handle "I don't understand" or confusion gracefully
    if (lower.includes("don't understand") || lower.includes("dont understand") || lower.includes("what do you mean") || lower === 'what' || lower === 'explain') {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `No worries at all! Let me rephrase more simply: In your own everyday words, what part of your body is troubling you right now, and does it feel sharp, dull, burning, or aching?`,
          }
        ]);
        setAiLoading(false);
      }, 400);
      return;
    }

    // Handle "I don't know" or "skip"
    if (lower.includes("don't know") || lower.includes("dont know") || lower === 'skip' || lower === 'not sure') {
      const nextIdx = aiTopicIndex + 1;
      if (nextIdx >= INTAKE_TOPICS.length) {
        setShowSummaryReview(true);
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Thank you! We have completed all clinical intake topics. You can now review your structured clinical summary below and apply it directly to your intake form.`,
          }
        ]);
        return;
      }
      setAiTopicIndex(nextIdx);
      const nextTopic = INTAKE_TOPICS[nextIdx];
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Understood, we can skip that. ${nextTopic.prompt}`,
        }
      ]);
      return;
    }

    // Call serverless intake assistant or fallback
    setAiLoading(true);
    try {
      const response = await fetch('/api/intake-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          topicIndex: aiTopicIndex,
          history: chatMessages.map(m => ({ role: m.sender === 'bot' ? 'assistant' : 'user', content: m.text })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
        if (data.isEmergency) {
          setIsEmergencyDetected(true);
        }
        const nextIdx = aiTopicIndex + 1;
        if (nextIdx < INTAKE_TOPICS.length) {
          setAiTopicIndex(nextIdx);
        } else {
          setShowSummaryReview(true);
        }
        setAiLoading(false);
        return;
      }
    } catch (_) {}

    // Deterministic Adaptive Advance
    setTimeout(() => {
      const nextIdx = aiTopicIndex + 1;
      if (nextIdx >= INTAKE_TOPICS.length) {
        setShowSummaryReview(true);
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Thank you for sharing your clinical history. I have organized your answers into a structured summary for the doctor. Please review the summary below and click "Apply to Intake Form".`,
          }
        ]);
      } else {
        setAiTopicIndex(nextIdx);
        const nextTopic = INTAKE_TOPICS[nextIdx];
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Noted. ${nextTopic.prompt}`,
          }
        ]);
      }
      setAiLoading(false);
    }, 400);
  }

  function handleSkipAiQuestion() {
    handleSendAiChat("Skip this question");
  }

  function handleApplySummaryToForm() {
    if (aiHistoryAnswers.complaint && !complaint) setComplaint(aiHistoryAnswers.complaint);
    if (aiHistoryAnswers.duration && !duration) setDuration(aiHistoryAnswers.duration);
    if (aiHistoryAnswers.sensation && !symptoms.includes(aiHistoryAnswers.sensation)) {
      setSymptoms(prev => [...prev, aiHistoryAnswers.sensation]);
    }
    if (aiHistoryAnswers.associated && !aiHistoryAnswers.associated.toLowerCase().includes('none')) {
      if (!symptoms.includes(aiHistoryAnswers.associated)) {
        setSymptoms(prev => [...prev, aiHistoryAnswers.associated]);
      }
    }
    if (aiHistoryAnswers.medications && !aiHistoryAnswers.medications.toLowerCase().includes('none')) {
      if (!medications.includes(aiHistoryAnswers.medications)) {
        setMedications(prev => [...prev, aiHistoryAnswers.medications]);
      }
    }
    if (aiHistoryAnswers.conditions && !aiHistoryAnswers.conditions.toLowerCase().includes('none')) {
      if (!conditions.includes(aiHistoryAnswers.conditions)) {
        setConditions(prev => [...prev, aiHistoryAnswers.conditions]);
      }
    }
    if (aiHistoryAnswers.allergies) {
      if (aiHistoryAnswers.allergies.toLowerCase().includes('no known') || aiHistoryAnswers.allergies.toLowerCase().includes('nkda')) {
        setNkdaConfirmed(true);
      } else if (!allergies.includes(aiHistoryAnswers.allergies)) {
        setAllergies(prev => [...prev, aiHistoryAnswers.allergies]);
      }
    }
    if (aiHistoryAnswers.family && !familyHistory && !aiHistoryAnswers.family.toLowerCase().includes('none')) {
      setFamilyHistory(aiHistoryAnswers.family);
    }
    setShowAiModal(false);
    alert('AI Clinical History successfully synchronized into your Intake Form!');
  }

  // Speech Recognition Simulation
  function handleToggleVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
    };

    recognition.start();
  }

  // Text-To-Speech
  function speakText(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  }

  // Success Screen
  if (submittedCaseId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <span className="ps-badge text-sm">Case Submitted Successfully</span>
          <h1 className="text-3xl font-black text-[var(--text)]">Case ID: {submittedCaseId}</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto">
            Your intake information has been securely registered in Cloud Firestore and linked with ABDM Care Context. It is now awaiting clinical review in the doctor's queue.
          </p>
        </div>

        <div className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl max-w-md mx-auto text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Patient:</span>
            <strong className="text-[var(--text)]">{name} ({age}y, {gender})</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Department:</span>
            <strong className="text-[var(--text)]">{department}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Completeness:</span>
            <strong className="text-teal-700">{completenessScore}% Complete</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Triage Status:</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Awaiting Review</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setActiveView('patient-dashboard')}
            className="btn-primary"
          >
            <span>View My Cases &amp; Chat with Doctor</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSubmittedCaseId(null);
              setCurrentStep(1);
              setComplaint('');
              setSymptoms([]);
            }}
            className="btn-secondary"
          >
            <span>Register Another Patient</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* ── Top Hero Bar with AI Assistant Trigger ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="ps-badge">Step {currentStep} of 6</span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Ministry of AYUSH &bull; AIIA Kiosk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] mt-1">Patient Guided Case Intake</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Intake Chat Trigger */}
          <button
            onClick={() => setShowAiModal(true)}
            className="btn-primary bg-gradient-to-r from-teal-700 to-emerald-800 text-xs shadow-md"
            title="Open Conversational AI Case-Taking Assistant"
          >
            <Bot className="w-4 h-4" />
            <span>Launch AI Intake Assistant</span>
          </button>
        </div>
      </div>

      {/* ── Stepper Navigation Bar ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => {
                if (step.id < currentStep || validateCurrentStep()) {
                  setCurrentStep(step.id);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-sm'
                  : isCompleted
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                isActive ? 'bg-teal-700 text-white' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {isCompleted ? '✓' : step.id}
              </span>
              <Icon className="w-3.5 h-3.5 hidden sm:inline" />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Layout: 2 Columns on Desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Steps (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-box">
            {/* ── STEP 1: DEMOGRAPHICS ── */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">1. Patient Identification &amp; Demographics</h2>
                    <p className="text-xs text-[var(--text-muted)]">Official institutional record and ABHA profile linkage.</p>
                  </div>
                  <button
                    onClick={() => speakText("Please enter the patient's full legal name, age, gender, and contact phone number.")}
                    className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg"
                    title="Audio guidance"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Full Name (as per Aadhaar / ID) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Varma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Age (Years) *</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="input-field"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Date of Birth (Optional)</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Phone Number (+91) *</label>
                    <input
                      type="text"
                      placeholder="+91 98450 XXXXX"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input-field"
                    >
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">City / Town</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">ABHA Address / ID</label>
                    <input
                      type="text"
                      placeholder="91-XXXX-XXXX-XXXX"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      className="input-field text-teal-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Hospital UHID / Reg. No.</label>
                    <input
                      type="text"
                      value={uhid}
                      onChange={(e) => setUhid(e.target.value)}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: SYMPTOMS & CLINICAL DETAILS ── */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">2. Clinical Presentation &amp; Symptoms</h2>
                    <p className="text-xs text-[var(--text-muted)]">Chief complaint, severity rating, and symptom mapping.</p>
                  </div>
                  <button
                    onClick={() => speakText("Please describe your primary reason for visiting the clinic today.")}
                    className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg"
                    title="Audio guidance"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">
                      Chief Complaint / Primary Health Issue *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe what symptoms you are feeling (e.g. Severe knee joint stiffness in morning, lower back pain, burning indigestion for 3 weeks...)"
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1">Duration of Problem</label>
                      <input
                        type="text"
                        placeholder="e.g. 3 days, 2 weeks, 6 months"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1">Assigned Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value as Department)}
                        className="input-field"
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Severity Slider */}
                  <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border)] space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[var(--text)]">Pain / Discomfort Severity Scale (1 - 10):</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-white text-xs font-black ${
                        severity >= 8 ? 'bg-rose-600' : severity >= 5 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}>
                        Level {severity} / 10 ({severity >= 8 ? 'Severe' : severity >= 5 ? 'Moderate' : 'Mild'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={severity}
                      onChange={(e) => setSeverity(Number(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-semibold">
                      <span>1: Barely Noticeable</span>
                      <span>5: Distracting Moderate</span>
                      <span>10: Unbearable / Severe</span>
                    </div>
                  </div>

                  {/* Symptom Tagging */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Specific Symptoms List</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add symptom (e.g. Headache, Joint swelling, Nausea, Insomnia)"
                        value={symptomInput}
                        onChange={(e) => setSymptomInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
                              setSymptoms([...symptoms, symptomInput.trim()]);
                              setSymptomInput('');
                            }
                          }
                        }}
                        className="input-field"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
                            setSymptoms([...symptoms, symptomInput.trim()]);
                            setSymptomInput('');
                          }
                        }}
                        className="btn-secondary !px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {symptoms.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          <span>{s}</span>
                          <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))} className="hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">
                      Initial Clinical Observations / Vitals
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BP 120/80 mmHg, Pulse 76 bpm, Temperature 98.6 F, conscious & oriented"
                      value={initialObservations}
                      onChange={(e) => setInitialObservations(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: MEDICAL HISTORY ── */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">3. Pre-existing Conditions &amp; Medical History</h2>
                    <p className="text-xs text-[var(--text-muted)]">Document long-term chronic conditions or previous diagnoses.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">Pre-existing Health Conditions</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma, Arthritis, Hypothyroidism"
                      value={conditionInput}
                      onChange={(e) => setConditionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (conditionInput.trim() && !conditions.includes(conditionInput.trim())) {
                            setConditions([...conditions, conditionInput.trim()]);
                            setConditionInput('');
                          }
                        }
                      }}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (conditionInput.trim() && !conditions.includes(conditionInput.trim())) {
                          setConditions([...conditions, conditionInput.trim()]);
                          setConditionInput('');
                        }
                      }}
                      className="btn-secondary !px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {conditions.map(c => (
                      <span key={c} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold">
                        <span>{c}</span>
                        <button onClick={() => setConditions(conditions.filter(x => x !== c))} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    <em>Clinical Notice:</em> An empty field will not be considered proof of absence of disease. Please actively document or confirm.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 4: MEDICATIONS & ALLERGIES ── */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">4. Current Medications &amp; Allergies</h2>
                    <p className="text-xs text-[var(--text-muted)]">Prescription medicines, over-the-counter drugs, AYUSH formulations, and adverse drug reactions.</p>
                  </div>
                </div>

                {/* Medications */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--text)]">Current Prescriptions &amp; Supplements</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Metformin 500mg, Amlodipine 5mg, Ashwagandha Churna"
                      value={medInput}
                      onChange={(e) => setMedInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (medInput.trim() && !medications.includes(medInput.trim())) {
                            setMedications([...medications, medInput.trim()]);
                            setMedInput('');
                          }
                        }
                      }}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (medInput.trim() && !medications.includes(medInput.trim())) {
                          setMedications([...medications, medInput.trim()]);
                          setMedInput('');
                        }
                      }}
                      className="btn-secondary !px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {medications.map(m => (
                      <span key={m} className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-full text-xs font-bold">
                        <span>{m}</span>
                        <button onClick={() => setMedications(medications.filter(x => x !== m))} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── Prescription Photo Upload Section ── */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[var(--text)]">Prescription Photo Upload</h3>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Attach prescription slips, doctor notes, or recent medicine packaging (JPG, PNG, WEBP &bull; Max 5MB).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Hidden File Picker */}
                      <input
                        type="file"
                        id="rx-file-input"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handlePrescriptionFileSelect}
                        className="hidden"
                      />
                      {/* Hidden Camera Input for Mobile */}
                      <input
                        type="file"
                        id="rx-camera-input"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePrescriptionFileSelect}
                        className="hidden"
                      />

                      <label
                        htmlFor="rx-file-input"
                        className="btn-primary !py-2 !px-3 text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Upload Prescription</span>
                      </label>

                      <label
                        htmlFor="rx-camera-input"
                        className="btn-secondary !py-2 !px-3 text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
                        title="Take a photo using device camera"
                      >
                        <Camera className="w-3.5 h-3.5 text-teal-700" />
                        <span>Take Photo</span>
                      </label>
                    </div>
                  </div>

                  {/* Upload Progress Bar */}
                  {uploadingRx && (
                    <div className="space-y-1.5 p-3 bg-white rounded-xl border border-teal-200 shadow-sm animate-pulse">
                      <div className="flex justify-between text-xs font-bold text-teal-900">
                        <span>Uploading Prescription...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-teal-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {rxError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{rxError}</span>
                    </div>
                  )}

                  {/* Attached Prescriptions List */}
                  {prescriptionImages.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-teal-900 block">
                        Attached Prescriptions ({prescriptionImages.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {prescriptionImages.map((rx) => (
                          <div
                            key={rx.id}
                            className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-teal-200 dark:border-teal-900 shadow-sm flex items-start justify-between gap-3"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <img
                                src={rx.storageUrl}
                                alt={rx.fileName}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setPreviewRxModal(rx)}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--text)] truncate">{rx.fileName}</p>
                                <span className="text-[10px] text-[var(--text-muted)] block">
                                  {(rx.fileSize / 1024).toFixed(0)} KB &bull; Attached
                                </span>
                                {rx.extractedMedicines && rx.extractedMedicines.length > 0 && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold">
                                    Detected: {rx.extractedMedicines.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewRxModal(rx)}
                                className="p-1.5 hover:bg-teal-50 text-teal-700 rounded-lg"
                                title="View full image"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePrescription(rx.id)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                                title="Remove prescription"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[11px] text-[var(--text-muted)]">
                      No prescription photos attached yet. You can upload an image or photograph of your physical prescription.
                    </div>
                  )}
                </div>

                {/* Allergies */}
                <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--text)]">Known Allergies</label>
                    <label className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nkdaConfirmed}
                        onChange={(e) => setNkdaConfirmed(e.target.checked)}
                        className="rounded text-emerald-600 accent-emerald-600"
                      />
                      <span>Confirmed: No Known Drug Allergies (NKDA)</span>
                    </label>
                  </div>

                  {!nkdaConfirmed && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, NSAIDs"
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
                              setAllergies([...allergies, allergyInput.trim()]);
                              setAllergyInput('');
                            }
                          }
                        }}
                        className="input-field"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
                            setAllergies([...allergies, allergyInput.trim()]);
                            setAllergyInput('');
                          }
                        }}
                        className="btn-secondary !px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {allergies.map(a => (
                      <span key={a} className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 rounded-full text-xs font-bold">
                        <span>{a}</span>
                        <button onClick={() => setAllergies(allergies.filter(x => x !== a))} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 5: PROCEDURES & FAMILY HISTORY ── */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">5. Previous Surgeries &amp; Family Medical History</h2>
                    <p className="text-xs text-[var(--text-muted)]">Past hospitalizations, operations, and hereditary health risk.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">Previous Surgeries or Procedures</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Appendectomy (2018), Knee Arthroscopy (2022)"
                      value={procedureInput}
                      onChange={(e) => setProcedureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (procedureInput.trim() && !procedures.includes(procedureInput.trim())) {
                            setProcedures([...procedures, procedureInput.trim()]);
                            setProcedureInput('');
                          }
                        }
                      }}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (procedureInput.trim() && !procedures.includes(procedureInput.trim())) {
                          setProcedures([...procedures, procedureInput.trim()]);
                          setProcedureInput('');
                        }
                      }}
                      className="btn-secondary !px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {procedures.map(p => (
                      <span key={p} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                        <span>{p}</span>
                        <button onClick={() => setProcedures(procedures.filter(x => x !== p))} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">Family Medical History</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Father had coronary artery disease at age 56. Mother has hypertension and osteoarthritis."
                    value={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 6: REVIEW & CONSENT ── */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">6. Case Verification &amp; DPDP Consent Submission</h2>
                    <p className="text-xs text-[var(--text-muted)]">Please review all entered details before finalizing submission.</p>
                  </div>
                </div>

                {/* Case Summary Preview Card */}
                <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-4 text-xs space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[var(--border)] pb-3">
                    <div>
                      <span className="text-[var(--text-muted)]">Patient Name:</span>
                      <strong className="block text-sm text-[var(--text)]">{name}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Age &amp; Gender:</span>
                      <strong className="block text-sm text-[var(--text)]">{age} years &bull; {gender}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Phone:</span>
                      <strong className="block text-sm text-[var(--text)]">{contact}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Location:</span>
                      <strong className="block text-sm text-[var(--text)]">{city}, {state}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-[var(--text-muted)]">Chief Complaint:</span>
                    <p className="font-bold text-[var(--text)] mt-0.5">{complaint || 'None specified'}</p>
                    <span className="text-[11px] text-[var(--text-muted)]">Duration: {duration || 'Unspecified'} &bull; Severity: {severity}/10</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]">
                    <div>
                      <span className="text-[var(--text-muted)]">Conditions:</span>
                      <p className="font-semibold text-[var(--text)]">{conditions.join(', ') || 'None reported'}</p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Medications:</span>
                      <p className="font-semibold text-[var(--text)]">{medications.join(', ') || 'None reported'}</p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Allergies:</span>
                      <p className="font-semibold text-[var(--text)]">{nkdaConfirmed ? 'NKDA (Confirmed)' : (allergies.join(', ') || 'None recorded')}</p>
                    </div>
                  </div>
                </div>

                {/* Consent & Compliance Checkbox */}
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 rounded text-teal-700 accent-teal-700"
                    />
                    <div className="text-xs text-teal-900 leading-relaxed font-medium">
                      <strong>DPDP Act 2023 &amp; ABDM Digital Health Consent:</strong> I confirm that the information provided is accurate to the best of my knowledge and grant consent for clinical intake review by All India Institute of Ayurveda clinicians.
                    </div>
                  </label>
                  <p className="text-[10px] text-teal-800/80 pl-6">
                    Disclaimer: This software assists clinical intake. It does not provide autonomous diagnosis or prescribe medications. In life-threatening emergencies, proceed directly to Casualty.
                  </p>
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border)] mt-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="btn-secondary disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-800 disabled:opacity-50"
                >
                  <span>{submitting ? 'Registering in Cloud Firestore...' : 'Submit Case to Clinical Queue'}</span>
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Completeness & AI Prompts (1 col) */}
        <div className="space-y-6">
          {/* Completeness Card */}
          <div className="card-box">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Completeness Score</span>
              <span className={`text-base font-black ${
                completenessScore >= 80 ? 'text-emerald-700' : completenessScore >= 50 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {completenessScore}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  completenessScore >= 80 ? 'bg-emerald-500' : completenessScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${completenessScore}%` }}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[var(--border)] text-xs">
              {completenessItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className={item.complete ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {item.label}
                  </span>
                  <span className={item.complete ? 'text-emerald-600 font-bold' : 'text-gray-400 font-bold'}>
                    {item.complete ? '✓' : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Gap Detection */}
          {gaps.length > 0 && (
            <div className="card-box border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800">Identified Information Gaps</h3>
              </div>
              <div className="space-y-2 text-xs">
                {gaps.slice(0, 4).map((g, idx) => (
                  <div key={idx} className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <strong className="text-amber-900 block">{g.field}</strong>
                    <span className="text-amber-800 text-[11px]">{g.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient Memory Prompts */}
          {memoryPrompts.length > 0 && (
            <div className="card-box border-l-4 border-l-teal-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-teal-800">Patient Memory Prompts</h3>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Ask the patient these questions to help recall vital clinical context:
              </p>
              <ul className="space-y-2 text-xs">
                {memoryPrompts.slice(0, 3).map((prompt, idx) => (
                  <li key={idx} className="p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] italic">
                    "{prompt}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Upgraded AI Clinical Intake Assistant Modal ── */}
      {showAiModal && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border)] bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-700 text-teal-100 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">AI Clinical Intake Assistant</h3>
                  <span className="text-[10px] text-teal-200">
                    Topic {Math.min(12, aiTopicIndex + 1)} of 12: {INTAKE_TOPICS[Math.min(11, aiTopicIndex)]?.title} &bull; Ministry of AYUSH
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 hover:bg-teal-700 rounded-lg text-teal-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Topic Progress Bar */}
            <div className="w-full bg-teal-950/30 h-1.5">
              <div
                className="bg-teal-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((aiTopicIndex + 1) / 12) * 100)}%` }}
              />
            </div>

            {/* Emergency Red-Flag Alert Banner */}
            {isEmergencyDetected && (
              <div className="p-3 bg-red-600 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>[SAFETY ALERT] Potential urgent symptoms detected. Please notify hospital triage immediately.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmergencyDetected(false)}
                  className="text-red-200 hover:text-white text-[11px] underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Chat Body */}
            <div className="p-4 overflow-y-auto space-y-3 bg-[var(--surface-elevated)] flex-1 min-h-[260px] max-h-[380px]">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'ml-auto bg-teal-700 text-white rounded-br-none'
                      : 'mr-auto bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-bl-none shadow-sm'
                  }`}
                >
                  <span className="text-[10px] opacity-70 font-bold uppercase mb-0.5">
                    {msg.sender === 'user' ? 'Patient' : 'Clinical Intake AI'}
                  </span>
                  <span>{msg.text}</span>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] italic">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Formulating clinical inquiry...</span>
                </div>
              )}
            </div>

            {/* Structured Clinical Summary Card (End of Intake) */}
            {showSummaryReview && (
              <div className="p-4 bg-emerald-50/80 border-t border-b border-emerald-200 space-y-3 max-h-[220px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Structured Clinical Intake Summary</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplySummaryToForm}
                    className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Intake Form</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <strong className="text-emerald-900 block">Chief Complaint:</strong>
                    <span>{aiHistoryAnswers.complaint || complaint || 'Not reported'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <strong className="text-emerald-900 block">Location &amp; Sensation:</strong>
                    <span>{aiHistoryAnswers.sensation || 'Described in consultation'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <strong className="text-emerald-900 block">Duration &amp; Timing:</strong>
                    <span>{aiHistoryAnswers.duration || duration || 'Recent'} &bull; {aiHistoryAnswers.timing || 'Variable'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <strong className="text-emerald-900 block">Progression:</strong>
                    <span>{aiHistoryAnswers.progression || 'Unchanged'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <strong className="text-emerald-900 block">Current Medications:</strong>
                    <span>{aiHistoryAnswers.medications || (medications.length ? medications.join(', ') : 'None reported')}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <strong className="text-emerald-900 block">Allergies:</strong>
                    <span>{aiHistoryAnswers.allergies || (nkdaConfirmed ? 'No Known Drug Allergies (NKDA)' : 'Unspecified')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Response Option Chips */}
            <div className="p-2.5 border-t border-[var(--border)] bg-[var(--surface-elevated)] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-semibold">
                <span>Suggested Quick Replies:</span>
                <button
                  type="button"
                  onClick={handleSkipAiQuestion}
                  className="text-teal-700 hover:underline font-bold text-[10px]"
                >
                  Skip this question &rarr;
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto">
                {INTAKE_TOPICS[Math.min(11, aiTopicIndex)]?.options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendAiChat(option)}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-[var(--border-strong)] hover:border-teal-600 hover:bg-teal-50 text-[11px] font-bold text-[var(--text)] transition-colors"
                  >
                    {option}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleSendAiChat("I don't understand, please explain simply")}
                  className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold hover:bg-amber-100 transition-colors"
                >
                  "I don't understand"
                </button>
              </div>
            </div>

            {/* Input Row */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2 rounded-full border transition-colors ${
                  isListening ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
                title="Dictate with voice"
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder={isListening ? 'Listening...' : 'Type symptoms or reply in your own words...'}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendAiChat();
                  }
                }}
                className="input-field text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => handleSendAiChat()}
                className="p-2 rounded-full bg-teal-700 text-white hover:bg-teal-800 transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prescription Lightbox Modal ── */}
      {previewRxModal && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-3xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--text)]">{previewRxModal.fileName}</h3>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {(previewRxModal.fileSize / 1024).toFixed(0)} KB &bull; Uploaded {new Date(previewRxModal.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewRxModal(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center bg-black/5 dark:bg-black/30 rounded-xl p-2 max-h-[60vh] overflow-auto">
              <img
                src={previewRxModal.storageUrl}
                alt={previewRxModal.fileName}
                className="max-h-[55vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            {previewRxModal.extractedMedicines && previewRxModal.extractedMedicines.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs">
                <strong>Candidate Medications Detected:</strong> {previewRxModal.extractedMedicines.join(', ')}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={previewRxModal.storageUrl}
                download={previewRxModal.fileName}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs"
              >
                Open Original
              </a>
              <button
                type="button"
                onClick={() => setPreviewRxModal(null)}
                className="btn-primary text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
