import { useState } from 'react'; 
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { cases } = useApp();
  const navigate = useNavigate();

  const criticalCount = cases.filter(c => c.caseManagement.priority === 'Critical' && c.caseManagement.reviewStatus !== 'Completed' && c.caseManagement.reviewStatus !== 'Closed').length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center gap-4 shrink-0 shadow-sm z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 flex-1 max-w-sm border border-gray-200 focus-within:border-navy-400 focus-within:ring-1 focus-within:ring-navy-200 transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search cases, patients..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value;
                  if (q) navigate(`/cases?q=${encodeURIComponent(q)}`);
                }
              }}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" size={18} />
              {criticalCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {criticalCount}
                </span>
              )}
            </button>

            {/* Quick new case */}
            <button
              onClick={() => navigate('/cases/new')}
              className="btn-teal hidden sm:inline-flex"
              id="header-new-case"
            >
              <Plus className="w-4 h-4" />
              <span>New Case</span>
            </button>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
