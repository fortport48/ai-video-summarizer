import React from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, AlertCircle, Info, Loader } from 'lucide-react';

export default function Toast() {
  const { notifications, removeNotification } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-indigo-400 animate-spin" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBgClass = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/40';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/40';
      case 'processing':
        return 'border-indigo-500/30 bg-indigo-950/40';
      default:
        return 'border-slate-700/50 bg-slate-900/60';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-x-0 ${getBgClass(
            n.type
          )}`}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
          <div className="flex-1 text-sm text-slate-200 font-medium leading-relaxed">
            {n.message}
          </div>
          <button
            onClick={() => removeNotification(n.id)}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
