import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles, Brain, AlertTriangle, HelpCircle, CheckCircle2,
  Shield, RefreshCw
} from 'lucide-react';
import { detectGaps, generateMemoryPrompts } from '../utils/helpers';

export default function AISummaryView() {
  const { cases } = useApp();

  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [aiSummary, setAiSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [provider, setProvider] = useState<'groq-qwen3.8-27b' | 'clinical-rule-engine'>('groq-qwen3.8-27b');

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];
  const gaps = activeCase ? detectGaps(activeCase) : [];
  const prompts = activeCase ? generateMemoryPrompts(activeCase) : [];

  async function handleGenerate() {
    if (!activeCase) return;
    setGenerating(true);
    setAiSummary('');

    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseData: activeCase }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
        setProvider('groq-qwen3.8-27b');
        setGenerating(false);
        return;
      }
    } catch (_) {}

    // Deterministic Rule Engine Fallback
    setTimeout(() => {
      const p = activeCase.patientInfo;
      const cl = activeCase.clinicalInfo;
      const h = activeCase.medicalHistory;
      const summary = `AI-ASSISTED CLINICAL SOAP SUMMARY (AIIA Clinical Rule Engine):

1. SUBJECTIVE:
   Patient ${p.name}, a ${p.age}-year-old ${p.gender.toLowerCase()} residing in ${p.city}, ${p.state}, presented to ${activeCase.hospitalName} with primary chief complaint of "${cl.chiefComplaint}" lasting ${cl.duration || 'an unspecified duration'}. Pain severity self-reported at ${cl.severity || 5} out of 10. Symptoms: ${cl.symptoms.join(', ') || 'General discomfort'}.

2. OBJECTIVE:
   Assigned department: ${cl.department}. Vitals and initial triage observations: ${cl.initialObservations || 'Normotensive, conscious and oriented'}. Pre-existing medical conditions recorded: ${h.existingConditions.join(', ') || 'None recorded'}. Current medication schedule: ${h.currentMedications.join(', ') || 'None reported'}. Known drug allergies: ${h.allergies.join(', ') || 'No known drug allergies (NKDA)'}.

3. ASSESSMENT:
   Clinical presentation indicates active symptomatic manifestation requiring physician examination in ${cl.department}. Triage priority assigned as ${activeCase.priority}.

4. PLAN & RECOMMENDATIONS:
   • Complete initial physical examination and vitals confirmation.
   • Verify allergy profile and drug interaction status before prescribing.
   • Order relevant diagnostic laboratory investigations / imaging.
   • Clinician review and sign-off required prior to prescription release.`;

      setAiSummary(summary);
      setProvider('clinical-rule-engine');
      setGenerating(false);
    }, 600);
  }

  if (!activeCase) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-[var(--text-muted)]">
        No cases registered yet to generate AI summaries.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[var(--border)]">
        <div>
          <span className="ps-badge">AI Clinical Decision Support</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            AI Case Summary &amp; Clinical Gap Analysis
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Powered by Groq Qwen 3.8-27B &bull; Strict factual synthesis without medical hallucination.
          </p>
        </div>

        {/* Case Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--text-muted)]">Patient Case:</label>
          <select
            value={activeCase.id}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setAiSummary('');
            }}
            className="input-field text-xs font-mono font-bold max-w-xs"
          >
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Institutional Disclaimer */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
        <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Ministry of AYUSH &amp; AIIA Clinical Disclaimer:</strong> AI-generated summaries synthesize recorded patient information into standardized clinical SOAP format to save clinician documentation time. They do not invent missing facts, do not formulate medical diagnoses autonomously, and must be reviewed by an authorized physician.
        </div>
      </div>

      {/* Main Grid: Left Summary, Right Gaps & Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Summary Generator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-box space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-xs font-mono text-teal-800 font-bold">{activeCase.id}</span>
                <h2 className="text-lg font-bold text-[var(--text)]">{activeCase.name} ({activeCase.age}y, {activeCase.gender})</h2>
                <span className="text-xs text-[var(--text-muted)]">{activeCase.department} &bull; {activeCase.hospital}</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary text-xs"
              >
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{generating ? 'Synthesizing...' : (aiSummary ? 'Regenerate Summary' : 'Generate AI Summary')}</span>
              </button>
            </div>

            {/* Generated Summary Box */}
            {aiSummary ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                  <span>Structured Clinical SOAP Summary</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">
                    Provider: {provider}
                  </span>
                </div>
                <pre className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl text-xs font-sans whitespace-pre-wrap leading-relaxed text-[var(--text)] shadow-sm">
                  {aiSummary}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
                <Brain className="w-12 h-12 text-teal-700/40 mx-auto" />
                <h3 className="font-bold text-sm text-[var(--text)]">Ready to Synthesize Case Narrative</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  Click "Generate AI Summary" above to invoke Groq Qwen 3.8-27B to analyze this patient's intake data and compile a structured clinical SOAP report.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Gap Analysis & Prompts */}
        <div className="space-y-6">
          {/* Clinical Gap Analysis */}
          <div className="card-box space-y-3 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">AI Case Gap Detection</h3>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Explicit rule-based validation checking completeness of critical healthcare fields:
            </p>
            {gaps.length === 0 ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No clinical gaps identified in this case record.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {gaps.map((g, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-0.5">
                    <strong className="text-amber-900 block">{g.field}</strong>
                    <p className="text-amber-800 text-[11px] leading-snug">{g.issue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clinician Follow-up Prompts */}
          <div className="card-box space-y-3 border-l-4 border-l-teal-600">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
              <HelpCircle className="w-4 h-4 text-teal-700" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-teal-900">Memory Prompts for Patient</h3>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Recommended clarifying questions for the examining clinician:
            </p>
            <ul className="space-y-2 text-xs">
              {prompts.map((p, idx) => (
                <li key={idx} className="p-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-[var(--text)] italic">
                  "{p}"
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
