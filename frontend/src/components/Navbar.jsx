import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Tv, LayoutDashboard, UploadCloud, FileText, Scissors, 
  MessageSquare, BarChart3, Settings, ShieldAlert, LogOut, Sun, Moon 
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { theme, toggleTheme, user, logout } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Video', icon: UploadCloud },
    { id: 'summary', label: 'AI Summary', icon: FileText },
    { id: 'highlights', label: 'Highlight Clip', icon: Scissors },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return (
    <nav className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 shadow-md">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Tv className="w-5.5 h-5.5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-400 bg-clip-text text-transparent">
          V-Highlights AI
        </span>
      </div>

      {/* Center Links */}
      <div className="hidden lg:flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Theme toggler */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-200">{user?.username}</span>
            <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-red-950/20 hover:text-red-400 border border-slate-700/50 hover:border-red-500/35 text-slate-400 transition-all duration-200"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
