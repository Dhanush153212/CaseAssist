import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, MessageSquare, Send, Stethoscope
} from 'lucide-react';
import { statusBadgeClass, priorityBadgeClass } from '../utils/helpers';

export default function PatientDashboard() {
  const { cases, currentUser, setActiveView, sendMessageToCase } = useApp();

  // Filter cases relevant to this patient
  const myCases = cases.filter(c => {
    if (!currentUser) return true;
    if (currentUser.role === 'superadmin') return true;
    return (
      (c.patientInfo?.name && currentUser.name && c.patientInfo.name.toLowerCase().includes(currentUser.name.toLowerCase())) ||
      (c.patientInfo?.contactNumber && currentUser.phone && c.patientInfo.contactNumber.includes(currentUser.phone)) ||
      (c.patientInfo?.abhaId && currentUser.abhaId && c.patientInfo.abhaId === currentUser.abhaId)
    );
  });

  const displayCases = myCases.length > 0 ? myCases : cases.slice(0, 3);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(displayCases[0]?.id || '');
  const [chatInput, setChatInput] = useState('');

  const selectedCase = cases.find(c => c.id === selectedCaseId) || displayCases[0];

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedCase) return;
    await sendMessageToCase(selectedCase.id, chatInput);
    setChatInput('');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[var(--border)]">
        <div>
          <span className="ps-badge">Patient Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            My Registered Cases &amp; Clinical Messages
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Active patient record overview &bull; Direct secure communication with AIIA clinicians.
          </p>
        </div>

        <button
          onClick={() => setActiveView('patient-intake')}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Case Intake</span>
        </button>
      </div>

      {/* Main Grid: Left Cases List, Right Details & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Case Records List */}
        <div className="card-box space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h2 className="text-sm font-bold text-[var(--text)]">Case Records ({displayCases.length})</h2>
            <span className="text-[11px] text-[var(--text-muted)]">Select to inspect</span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto">
            {displayCases.map(c => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50 border-teal-400 shadow-sm'
                      : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-mono text-teal-800">{c.id}</strong>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text)] mt-1 truncate">{c.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                    {c.complaint || c.clinicalInfo?.chiefComplaint}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border)]">
                    <span>{c.department}</span>
                    <span>{c.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Case Details & Secure Doctor Thread */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCase ? (
            <>
              {/* Case Summary Card */}
              <div className="card-box">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-mono text-[var(--text-muted)]">Case Record:</span>
                    <h2 className="text-xl font-extrabold text-[var(--text)]">{selectedCase.id}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadgeClass(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${priorityBadgeClass(selectedCase.priority)}`}>
                      {selectedCase.priority} Priority
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)]">Patient:</span>
                    <strong className="block text-[var(--text)] mt-0.5">{selectedCase.name} ({selectedCase.age}y)</strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Department:</span>
                    <strong className="block text-[var(--text)] mt-0.5">{selectedCase.department}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Hospital:</span>
                    <strong className="block text-[var(--text)] mt-0.5 truncate">{selectedCase.hospital}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Attending Doctor:</span>
                    <strong className="block text-teal-700 mt-0.5">{selectedCase.reviewerName || selectedCase.clinicalInfo?.assignedClinician}</strong>
                  </div>
                </div>

                <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-xs space-y-1">
                  <span className="font-bold text-[var(--text)]">Primary Chief Complaint:</span>
                  <p className="text-[var(--text-muted)]">{selectedCase.complaint}</p>
                </div>

                {/* Doctor Clinical Notes (if signed off) */}
                {selectedCase.doctorNotes && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <Stethoscope className="w-4 h-4" />
                      <span>Doctor Reviewer Notes &amp; Recommendations</span>
                    </div>
                    <p className="text-emerald-950 font-medium">{selectedCase.doctorNotes}</p>
                  </div>
                )}
              </div>

              {/* Secure Patient-Doctor Communication Thread */}
              <div className="card-box">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-700" />
                    <h3 className="font-bold text-sm text-[var(--text)]">Patient-Doctor Communication Thread</h3>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">Secured under DPDP Act 2023</span>
                </div>

                {/* Messages List */}
                <div className="space-y-3 max-h-[320px] overflow-y-auto p-2 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)]">
                  {(!selectedCase.messages || selectedCase.messages.length === 0) ? (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                      No inquiries sent yet. Use the message box below to ask your doctor a question regarding treatment or dosage.
                    </div>
                  ) : (
                    selectedCase.messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] p-3 rounded-2xl text-xs ${
                          msg.senderRole === 'patient'
                            ? 'ml-auto bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-br-none'
                            : 'mr-auto bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-bl-none shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-75 font-bold uppercase mb-1">
                          <span>{msg.senderName} ({msg.senderRole})</span>
                          <span>{msg.formattedTime || ''}</span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Type follow-up query to doctor..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="input-field text-xs flex-1"
                  />
                  <button
                    type="submit"
                    className="btn-primary text-xs !px-4"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="card-box text-center py-12 text-sm text-[var(--text-muted)]">
              No cases found. Click "New Case Intake" to register your first patient record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
