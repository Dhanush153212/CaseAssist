import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, HeartPulse, Activity } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'Awaiting Clinical Review': '#f59e0b',
  'Under Review': '#f97316',
  'Reviewed': '#0d9488',
  'In Treatment': '#8b5cf6',
  'Completed': '#10b981',
  'New': '#3b82f6',
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High: '#f97316',
  Medium: '#0284c7',
  Normal: '#0284c7',
  Low: '#10b981',
};

export default function AnalyticsView() {
  const { cases } = useApp();

  // 1. Department Breakdown
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      const d = c.department.split('(')[0].trim();
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [cases]);

  // 2. Status Breakdown
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || '#64748b',
    }));
  }, [cases]);

  // 3. Priority Breakdown
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      counts[c.priority] = (counts[c.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: PRIORITY_COLORS[name] || '#64748b',
    }));
  }, [cases]);

  const criticalCount = cases.filter(c => c.priority === 'Critical').length;
  const reviewedCount = cases.filter(c => c.status === 'Reviewed' || c.status === 'Completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[var(--border)]">
        <div>
          <span className="ps-badge">Institutional Insights</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            Clinical Analytics &amp; Triage Volume
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            AIIA Outpatient Case Distribution &bull; Triage Severity Metrics &bull; Department Volume
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-teal-600">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Total Registered Cases</span>
          <strong className="text-2xl font-black text-[var(--text)]">{cases.length}</strong>
          <span className="text-[10px] text-[var(--text-muted)]">Across all hospital wards</span>
        </div>
        <div className="stat-card border-l-4 border-l-rose-600">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Critical Triage Flags</span>
          <strong className="text-2xl font-black text-rose-600">{criticalCount}</strong>
          <span className="text-[10px] text-rose-700 font-bold">Immediate attention</span>
        </div>
        <div className="stat-card border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Completed Reviews</span>
          <strong className="text-2xl font-black text-emerald-600">{reviewedCount}</strong>
          <span className="text-[10px] text-emerald-700 font-bold">Clinically signed off</span>
        </div>
        <div className="stat-card border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Avg Completeness</span>
          <strong className="text-2xl font-black text-blue-600">88%</strong>
          <span className="text-[10px] text-blue-700 font-bold">High documentation fidelity</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume Bar Chart */}
        <div className="card-box space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <BarChart3 className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-[var(--text)]">Case Volume by Department</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="card-box space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-[var(--text)]">Triage Severity Distribution</h2>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution */}
        <div className="card-box space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <Activity className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-[var(--text)]">Workflow Status Breakdown</h2>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
