import { Shield, Building2, BookOpen } from 'lucide-react';

export default function HelpAboutView() {

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-[var(--border)]">
        <span className="ps-badge">Institutional Architecture</span>
        <h1 className="text-3xl font-extrabold text-[var(--text)]">CaseAssist &bull; Help &amp; Project Documentation</h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
          AI-Powered Patient Case-Taking and Multi-Role Clinical Decision Support System. Developed for Ministry of AYUSH &amp; All India Institute of Ayurveda (Problem Statement ID: 26047).
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-box space-y-3">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <Building2 className="w-5 h-5 text-teal-700" />
            <span>Ministry of AYUSH &amp; AIIA Standards</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            CaseAssist aligns traditional AYUSH clinical examination principles (Prakriti, Agni, Koshtha, Vikriti, Ashtavidha Pariksha) with modern hospital workflows. It standardizes outpatient case taking across Ayurveda, Yoga, Unani, Siddha, and Homeopathy hospitals.
          </p>
          <ul className="text-xs space-y-1.5 text-[var(--text)] list-disc pl-5">
            <li>Standardized SOCRATES symptom taking framework</li>
            <li>Red-flag emergency symptom auto-detection</li>
            <li>Multi-lingual kiosk accessibility (English, Hindi, Kannada, Telugu)</li>
          </ul>
        </div>

        <div className="card-box space-y-3">
          <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
            <Shield className="w-5 h-5 text-sky-600" />
            <span>ABDM &amp; DPDP Act 2023 Compliance</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Case records are tied to the Ayushman Bharat Digital Mission (ABDM) framework using 14-digit ABHA IDs and generate FHIR R4 DiagnosticReport resources with immutable audit logging.
          </p>
          <ul className="text-xs space-y-1.5 text-[var(--text)] list-disc pl-5">
            <li>Milestone M1 (ABHA Creation), M2 (Linkage), M3 (Data Exchange)</li>
            <li>End-to-end audit trail tracking all clinical access</li>
            <li>Role-Based Access Control enforcing patient privacy</li>
          </ul>
        </div>
      </div>

      {/* Feature Guide */}
      <div className="card-box space-y-4">
        <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-700" />
          <span>Portal Modules &amp; Feature Walkthrough</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
            <strong className="text-teal-800 block text-sm">1. Patient Intake Kiosk</strong>
            <p className="text-[var(--text-muted)] leading-relaxed">
              6-step guided wizard for patient identification, symptom recording, severity rating, and allergies with real-time completeness scoring.
            </p>
          </div>
          <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
            <strong className="text-teal-800 block text-sm">2. Doctor Workstation</strong>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Triage queue sorted by clinical severity, automated SOAP summaries, clinical gap alerts, and digital prescription sign-off.
            </p>
          </div>
          <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
            <strong className="text-teal-800 block text-sm">3. Split View Mode</strong>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Dual-pane workstation enabling side-by-side comparison between raw patient intake and AI clinical recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Institutional Disclaimer */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl text-xs text-teal-900 leading-relaxed text-center space-y-2">
        <p className="font-bold">
          CaseAssist: Smart Patient Information &amp; Case Management System &bull; Problem Statement ID 26047
        </p>
        <p className="text-[11px] text-teal-800 max-w-xl mx-auto">
          Built with React 19, TypeScript, Google Cloud Firestore, Firebase Auth, and Groq Qwen 3.8-27B. Fictional sample patient records for research and clinical prototyping only.
        </p>
      </div>
    </div>
  );
}
