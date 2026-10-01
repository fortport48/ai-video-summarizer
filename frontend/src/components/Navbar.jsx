import React from 'react';
import { 
  Tv, UploadCloud, FileText, Scissors, Settings 
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const navItems = [
    { id: 'upload', label: 'Upload Video', icon: UploadCloud },
    { id: 'summary', label: 'AI Summary', icon: FileText },
    { id: 'highlights', label: 'Highlight Clip', icon: Scissors },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 shadow-md">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('upload')}>
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
    </nav>
  );
}
