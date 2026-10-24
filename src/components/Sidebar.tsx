import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, Stethoscope, Brain,
  BarChart3, ScrollText, Settings, HelpCircle, LogOut, X, ChevronRight,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/' },
  { icon: Users,           label: 'Patient Cases',   path: '/cases' },
  { icon: ClipboardList,   label: 'Clinical Review', path: '/review' },
  { icon: Brain,           label: 'AI Summary',      path: '/ai-summary' },
  { icon: BarChart3,       label: 'Analytics',       path: '/analytics' },
  { icon: ScrollText,      label: 'Audit Log',       path: '/audit' },
];

const BOTTOM_ITEMS = [
  { icon: Settings,        label: 'Settings',        path: '/settings' },
  { icon: HelpCircle,      label: 'Help & About',    path: '/help' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 h-full w-64 z-40 flex flex-col',
          'bg-gradient-to-b from-navy-900 via-navy-800 to-navy-950',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        ].join(' ')}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">CaseAssist</p>
              <p className="text-blue-300 text-[10px] leading-tight mt-0.5">Smart Patient System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-blue-300 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Main Nav ─────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
            Main Menu
          </p>
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'sidebar-link',
                  isActive ? 'sidebar-link-active' : 'sidebar-link-inactive',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-4">
            <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
              System
            </p>
            {BOTTOM_ITEMS.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    'sidebar-link',
                    isActive ? 'sidebar-link-active' : 'sidebar-link-inactive',
                  ].join(' ')
                }
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── User Footer ──────────────────────────────────────────────────── */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{currentUser.name}</p>
              <p className="text-blue-300 text-[10px] truncate">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link sidebar-link-inactive w-full"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
