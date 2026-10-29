import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  User, Stethoscope, ClipboardList, Pill, History, CheckCircle,
  ChevronRight, ChevronLeft, AlertTriangle, Sparkles, Mic,
  Volume2, Plus, X, Send, Bot, RefreshCw
} from 'lucide-react';
import {
  calculateCompleteness, detectGaps, generateMemoryPrompts,
  checkEmergencyFlags, generateCaseId, normalizeCase
} from '../utils/helpers';
import { INDIAN_STATES, DEPARTMENTS } from '../data/seedData';
import type { PatientCase, Department, Gender } from '../types';

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

  // AI Intake Assistant Chat Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'Namaste! I am your AI Clinical Intake Assistant for Ministry of AYUSH & AIIA. What primary discomfort or health symptoms brings you to the hospital today?',
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
  }, [name, age, gender, dob, contact, city, state, district, pinCode, abhaId, uhid, complaint, duration, severity, department, symptoms, initialObservations, conditions, medications, allergies, nkdaConfirmed, procedures, familyHistory]);

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

  // Send AI Chat Message
  async function handleSendAiChat() {
    if (!userInput.trim()) return;
    const msg = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);

    // Auto-populate symptom or complaint if empty
    if (!complaint.trim()) {
      setComplaint(msg);
    } else if (!symptoms.includes(msg)) {
      setSymptoms(prev => [...prev, msg]);
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/intake-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: msg,
          history: chatMessages.map(m => ({ role: m.sender === 'bot' ? 'assistant' : 'user', content: m.text })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
        return;
      }
    } catch (_) {}

    // Fallback conversational logic
    setTimeout(() => {
      let reply = 'Thank you for sharing that. On a scale of 1 to 10, how severe would you rate this discomfort?';
      const lower = msg.toLowerCase();
      if (lower.includes('chest') && lower.includes('pain')) {
        reply = '[RED FLAG ALERT] Please notify the triage nurse immediately or proceed to Casualty. Are you experiencing pain spreading to your left arm or jaw?';
      } else if (lower.includes('month') || lower.includes('week') || lower.includes('day')) {
        reply = 'Noted the duration. Are you currently taking any prescription tablets or Ayurvedic medicines for this condition?';
        setDuration(msg);
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      setAiLoading(false);
    }, 600);
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

      {/* ── AI Intake Assistant Modal ── */}
      {showAiModal && (
        <div className="modal-overlay">
          <div className="modal-dialog max-w-xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-teal-800 text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">AI Clinical Intake Assistant</h3>
                  <span className="text-[10px] text-teal-200">Powered by Groq Qwen 3.8-27B &bull; Ministry of AYUSH</span>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 hover:bg-teal-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 overflow-y-auto max-h-[380px] space-y-3 bg-[var(--surface-elevated)] flex-1">
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
                    {msg.sender === 'user' ? 'Patient' : 'MediKiosk AI'}
                  </span>
                  <span>{msg.text}</span>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] italic">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI assistant is formulating clinical inquiry...</span>
                </div>
              )}
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
                placeholder={isListening ? 'Listening...' : 'Type symptoms or reply to AI...'}
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
                onClick={handleSendAiChat}
                className="p-2 rounded-full bg-teal-700 text-white hover:bg-teal-800 transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
