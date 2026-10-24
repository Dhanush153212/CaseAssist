import type { CaseStatus, CasePriority } from '../types';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns DD-MM-YYYY from an ISO string */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso; // Already formatted
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Returns DD-MM-YYYY HH:mm */
export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

/** Returns human-readable relative time */
export function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)  return 'Just now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ─── ID generator ─────────────────────────────────────────────────────────────

export function generateCaseId(existing: string[]): string {
  const year = new Date().getFullYear();
  let num = existing.length + 1;
  let id: string;
  do {
    id = `CA-${year}-${String(num).padStart(4, '0')}`;
    num++;
  } while (existing.includes(id));
  return id;
}

// ─── Badge colour maps ────────────────────────────────────────────────────────

export function statusBadgeClass(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    'Registered':      'bg-blue-100 text-blue-800',
    'Under Review':    'bg-yellow-100 text-yellow-800',
    'Awaiting Tests':  'bg-orange-100 text-orange-800',
    'In Treatment':    'bg-purple-100 text-purple-800',
    'Follow-Up':       'bg-teal-100 text-teal-800',
    'Completed':       'bg-green-100 text-green-800',
    'Closed':          'bg-gray-100 text-gray-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function priorityBadgeClass(priority: CasePriority): string {
  const map: Record<CasePriority, string> = {
    Low:      'bg-green-100 text-green-800',
    Normal:   'bg-blue-100 text-blue-800',
    High:     'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
  };
  return map[priority] ?? 'bg-gray-100 text-gray-600';
}

export function priorityDotClass(priority: CasePriority): string {
  const map: Record<CasePriority, string> = {
    Low:      'bg-green-500',
    Normal:   'bg-blue-500',
    High:     'bg-orange-500',
    Critical: 'bg-red-500',
  };
  return map[priority] ?? 'bg-gray-400';
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
