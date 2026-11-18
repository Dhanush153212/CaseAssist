import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarDays, Clock, CheckCircle,
  AlertCircle, XCircle
} from 'lucide-react';
import type { PatientCase, PatientFollowUp } from '../types';

export default function FollowUpManagement() {
  const { cases, currentUser, updateCase } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState('All');

  const followUps = useMemo(() => {
    return cases.flatMap((patient: PatientCase) =>
      (patient.followUps || []).map((followUp: PatientFollowUp) => ({
        ...followUp,
        patientId: patient.id,
        patientName: patient.name,
        department: patient.department
      }))
    ).filter(item => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(search.toLowerCase()) ||
        item.patientId.toLowerCase().includes(search.toLowerCase());

      return matchesSearch &&
        (filter === 'All' || item.status === filter);
    }).sort((a, b) =>
      a.scheduledDate.localeCompare(b.scheduledDate)
    );
  }, [cases, search, filter]);

  const scheduleFollowUp = async () => {
    if (!selectedCase || !date || !reason.trim()) {
      alert('Please select a patient, date and reason.');
      return;
    }

    const patient = cases.find(c => c.id === selectedCase);
    if (!patient) return;

    const newFollowUp: PatientFollowUp = {
      id: crypto.randomUUID(),
      scheduledDate: date,
      reason: reason.trim(),
      status: 'Scheduled',
      createdBy: currentUser?.name || 'Doctor',
      createdAt: new Date().toISOString()
    };

    await updateCase({
      ...patient,
      followUps: [...(patient.followUps || []), newFollowUp],
      updatedAt: new Date().toISOString()
    });

    setSelectedCase('');
    setDate('');
    setReason('');
    alert('Follow-up scheduled successfully.');
  };

  const updateFollowUpStatus = async (
    patientId: string,
    followUpId: string,
    status: PatientFollowUp['status']
  ) => {
    const patient = cases.find(c => c.id === patientId);
    if (!patient) return;

    const updatedFollowUps = (patient.followUps || []).map(item =>
      item.id === followUpId
        ? {
            ...item,
            status,
            completedAt: status === 'Completed'
              ? new Date().toISOString()
              : undefined
          }
        : item
    );

    await updateCase({
      ...patient,
      followUps: updatedFollowUps,
      updatedAt: new Date().toISOString()
    });
  };

  const counts = {
    Scheduled: followUps.filter(f => f.status === 'Scheduled').length,
    Completed: followUps.filter(f => f.status === 'Completed').length,
    Missed: followUps.filter(f => f.status === 'Missed').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Follow-up Management</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Schedule and track patient follow-up appointments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-box">
          <Clock className="text-blue-500" />
          <p>Scheduled</p>
          <h2 className="text-2xl font-bold">{counts.Scheduled}</h2>
        </div>
        <div className="card-box">
          <CheckCircle className="text-green-500" />
          <p>Completed</p>
          <h2 className="text-2xl font-bold">{counts.Completed}</h2>
        </div>
        <div className="card-box">
          <AlertCircle className="text-red-500" />
          <p>Missed</p>
          <h2 className="text-2xl font-bold">{counts.Missed}</h2>
        </div>
      </div>

      <div className="card-box space-y-4">
        <h2 className="font-bold text-lg">Schedule New Follow-up</h2>

        <select
          className="input-field w-full"
          value={selectedCase}
          onChange={e => setSelectedCase(e.target.value)}
        >
          <option value="">Select Patient</option>
          {cases.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.name} ({patient.id})
            </option>
          ))}
        </select>

        <input
          type="date"
          className="input-field w-full"
          min={new Date().toISOString().split('T')[0]}
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <textarea
          className="input-field w-full"
          placeholder="Reason for follow-up"
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />

        <button
          onClick={scheduleFollowUp}
          className="btn-primary"
        >
          <CalendarDays size={16} className="inline mr-2" />
          Schedule Follow-up
        </button>
      </div>

      <div className="card-box space-y-4">
        <h2 className="font-bold text-lg">Patient Follow-up Records</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input-field flex-1"
            placeholder="Search patient name or ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            className="input-field"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Scheduled</option>
            <option>Completed</option>
            <option>Missed</option>
            <option>Cancelled</option>
          </select>
        </div>

        {followUps.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No follow-up records found.
          </p>
        ) : (
          <div className="space-y-3">
            {followUps.map(item => (
              <div
                key={item.id}
                className="border border-[var(--border)] rounded-lg p-4 space-y-2"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{item.patientName}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.patientId} · {item.department}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {item.status}
                  </span>
                </div>

                <p className="text-sm">
                  <CalendarDays size={14} className="inline mr-1" />
                  {item.scheduledDate}
                </p>
                <p className="text-sm">{item.reason}</p>

                {item.status === 'Scheduled' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => updateFollowUpStatus(
                        item.patientId, item.id, 'Completed'
                      )}
                    >
                      <CheckCircle size={14} className="inline mr-1" />
                      Mark Completed
                    </button>

                    <button
                      className="btn-secondary text-xs"
                      onClick={() => updateFollowUpStatus(
                        item.patientId, item.id, 'Missed'
                      )}
                    >
                      <XCircle size={14} className="inline mr-1" />
                      Mark Missed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}