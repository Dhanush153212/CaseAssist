import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CaseStatus, CasePriority } from '../types';

// ─── Analytics Page ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<CaseStatus, string> = {
  'New':                      '#3b82f6',
  'Awaiting Clinical Review': '#f59e0b',
  'Reviewed':                 '#22c55e',
  'Registered':               '#0284c7',
  'Under Review':             '#eab308',
  'Awaiting Tests':           '#f97316',
  'In Treatment':             '#8b5cf6',
  'Follow-Up':                '#14b8a6',
  'Completed':                '#10b981',
  'Closed':                   '#9ca3af',
};

const PRIORITY_COLORS: Record<CasePriority, string> = {
  Low:      '#22c55e',
  Normal:   '#3b82f6',
  Medium:   '#f59e0b',
  High:     '#f97316',
  Critical: '#ef4444',
};

export default function Analytics() {
  const { cases } = useApp();

  // Department breakdown
  const deptData = useMemo(() => {
    const m: Record<string, number> = {};
    cases.forEach(c => { const d = c.clinicalInfo.department; m[d] = (m[d] ?? 0) + 1; });
    return Object.entries(m).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count);
  }, [cases]);

  // Status breakdown
  const statusData = useMemo(() => {
    const m: Partial<Record<CaseStatus, number>> = {};
    cases.forEach(c => { const s = c.caseManagement.reviewStatus; m[s] = (m[s] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name as CaseStatus] }));
  }, [cases]);

  // Priority breakdown
  const priorityData = useMemo(() => {
    const m: Partial<Record<CasePriority, number>> = {};
    cases.forEach(c => { const p = c.caseManagement.priority; m[p] = (m[p] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value, color: PRIORITY_COLORS[name as CasePriority] }));
  }, [cases]);

  // Hospital breakdown
  const hospitalData = useMemo(() => {
    const m: Record<string, number> = {};
    cases.forEach(c => {
      const h = c.hospitalName.split(',')[0];
      m[h] = (m[h] ?? 0) + 1;
    });
    return Object.entries(m).map(([hospital, count]) => ({ hospital, count })).sort((a, b) => b.count - a.count);
  }, [cases]);

  // State breakdown
  const stateData = useMemo(() => {
    const m: Record<string, number> = {};
    cases.forEach(c => { const s = c.patientInfo.state; m[s] = (m[s] ?? 0) + 1; });
    return Object.entries(m).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count);
  }, [cases]);

  // Age distribution
  const ageData = useMemo(() => {
    const buckets: Record<string, number> = {
      '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0,
    };
    cases.forEach(c => {
      const age = c.patientInfo.age;
      if (age <= 18)       buckets['0-18']++;
      else if (age <= 35)  buckets['19-35']++;
      else if (age <= 50)  buckets['36-50']++;
      else if (age <= 65)  buckets['51-65']++;
      else                 buckets['65+']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [cases]);

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-navy-700" /> Analytics
        </h1>
        <p className="text-sm text-gray-500">Case statistics and distribution insights</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Cases', value: cases.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Cases', value: cases.filter(c => !['Completed','Closed'].includes(c.caseManagement.reviewStatus)).length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Departments', value: new Set(cases.map(c => c.clinicalInfo.department)).size, icon: BarChart3, color: 'text-teal-600 bg-teal-50' },
          { label: 'Hospitals', value: new Set(cases.map(c => c.hospitalName)).size, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-2`}>
              <Icon className="w-4.5 h-4.5" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Department */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Cases by Department</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 70, right: 10, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} width={70} />
              <Tooltip formatter={(v) => [v ?? 0, 'Cases']} />
              <Bar dataKey="count" fill="#0f5ec0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Case Status Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v ?? 0, 'Cases']} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v ?? 0, 'Cases']} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Patient Age Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v ?? 0,  'Patients']} />
              <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hospital Table */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Cases by Hospital</h2>
          <div className="space-y-2">
            {hospitalData.map(({ hospital, count }) => (
              <div key={hospital} className="flex items-center gap-3">
                <div className="w-32 sm:w-40 text-xs text-gray-600 truncate shrink-0">{hospital}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-navy-600 rounded-full"
                    style={{ width: `${(count / cases.length) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* State Table */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Cases by State</h2>
          <div className="space-y-2">
            {stateData.map(({ state, count }) => (
              <div key={state} className="flex items-center gap-3">
                <div className="w-32 sm:w-40 text-xs text-gray-600 truncate shrink-0">{state}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${(count / cases.length) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
