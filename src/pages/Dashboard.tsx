import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, Clock, CheckCircle, AlertTriangle, Plus, Eye,
  TrendingUp, MapPin, Activity, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatDate, timeAgo, statusBadgeClass, priorityBadgeClass } from '../utils/helpers';
import type { CaseStatus } from '../types';

// ─── Colour maps ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<CaseStatus, string> = {
  'Registered':     '#3b82f6',
  'Under Review':   '#f59e0b',
  'Awaiting Tests': '#f97316',
  'In Treatment':   '#8b5cf6',
  'Follow-Up':      '#14b8a6',
  'Completed':      '#22c55e',
  'Closed':         '#9ca3af',
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { cases } = useApp();
  const navigate = useNavigate();

  // ── Statistics ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return {
      total:          cases.length,
      newToday:       cases.filter(c => now - new Date(c.createdAt).getTime() < oneDayMs).length,
      awaitingReview: cases.filter(c => c.caseManagement.reviewStatus === 'Under Review' || c.caseManagement.reviewStatus === 'Awaiting Tests').length,
      completed:      cases.filter(c => ['Completed', 'Closed'].includes(c.caseManagement.reviewStatus)).length,
      highPriority:   cases.filter(c => ['High', 'Critical'].includes(c.caseManagement.priority) && !['Completed', 'Closed'].includes(c.caseManagement.reviewStatus)).length,
    };
  }, [cases]);

  // ── Chart: Status distribution ──────────────────────────────────────────

  const statusData = useMemo(() => {
    const counts: Partial<Record<CaseStatus, number>> = {};
    cases.forEach(c => {
      const s = c.caseManagement.reviewStatus;
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name as CaseStatus] ?? '#9ca3af',
    }));
  }, [cases]);

  // ── Chart: Department-wise ──────────────────────────────────────────────

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      const d = c.clinicalInfo.department;
      counts[d] = (counts[d] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([dept, count]) => ({ dept: dept.replace(' Medicine', '').replace('ology', '.'), count }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  // ── Recent cases ────────────────────────────────────────────────────────

  const recentCases = useMemo(
    () => [...cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [cases],
  );

  // ── Recent activity ─────────────────────────────────────────────────────

  const recentActivity = useMemo(() => {
    const all = cases.flatMap(c =>
      c.activityLog.map(a => ({ ...a, caseId: c.id, patientName: c.patientInfo.name })),
    );
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);
  }, [cases]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Smart Patient Information &amp; Case Management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/cases/new')}
            className="btn-teal"
            id="dashboard-new-case"
          >
            <Plus className="w-4 h-4" /> New Case
          </button>
          <button
            onClick={() => navigate('/cases')}
            className="btn-secondary"
            id="dashboard-view-cases"
          >
            <Eye className="w-4 h-4" /> View All Cases
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Total Cases"
          value={stats.total}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-teal-600" />}
          label="New Today"
          value={stats.newToday}
          bg="bg-teal-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          label="Awaiting Review"
          value={stats.awaitingReview}
          bg="bg-amber-50"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          label="Completed"
          value={stats.completed}
          bg="bg-green-50"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          label="High Priority"
          value={stats.highPriority}
          bg="bg-red-50"
          highlight
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Status Pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" /> Case Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'Cases']} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Bar */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-navy-600" /> Cases by Department
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'Cases']} />
              <Bar dataKey="count" fill="#0f5ec0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Cases Table */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-600" /> Recent Cases
            </h2>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b border-gray-100">
                  <th className="text-left py-2 pr-4">Case ID</th>
                  <th className="text-left py-2 pr-4">Patient</th>
                  <th className="text-left py-2 pr-4 hidden sm:table-cell">Department</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentCases.map(c => (
                  <tr
                    key={c.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-navy-700 font-medium">{c.id}</td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-900">{c.patientInfo.name}</p>
                      <p className="text-xs text-gray-500">{c.patientInfo.age}y · {c.patientInfo.gender}</p>
                    </td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell text-gray-600 text-xs">{c.clinicalInfo.department}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${statusBadgeClass(c.caseManagement.reviewStatus)}`}>
                        {c.caseManagement.reviewStatus}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`badge ${priorityBadgeClass(c.caseManagement.priority)}`}>
                        {c.caseManagement.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" /> Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map(a => (
              <div key={a.id} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-3 h-3 text-navy-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 leading-snug">
                    {a.action}
                    {' · '}
                    <span
                      className="text-navy-600 cursor-pointer hover:underline"
                      onClick={() => navigate(`/cases/${a.caseId}`)}
                    >
                      {a.caseId}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">{a.performedBy}</p>
                  <p className="text-[10px] text-gray-400">{timeAgo(a.timestamp)}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-saffron-500" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Register Patient',  icon: <Plus className="w-4 h-4" />,       path: '/cases/new',  color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
            { label: 'View All Cases',    icon: <Users className="w-4 h-4" />,       path: '/cases',      color: 'bg-navy-50 text-navy-700 hover:bg-navy-100 border-navy-200' },
            { label: 'Clinical Review',   icon: <Clock className="w-4 h-4" />,       path: '/review',     color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
            { label: 'AI Summary',        icon: <Activity className="w-4 h-4" />,    path: '/ai-summary', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
          ].map(({ label, icon, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all duration-200 ${color}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, bg, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card ${highlight && value > 0 ? 'ring-1 ring-red-200' : ''}`}>
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
