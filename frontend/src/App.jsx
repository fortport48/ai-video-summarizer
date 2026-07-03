import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Summary from './pages/Summary';
import Highlights from './pages/Highlights';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

export default function App() {
  const { isAuthenticated, loadingUser } = useApp();
  const [activePage, setActivePage] = useState('dashboard');

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Loading Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        <Toast />
      </>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'upload':
        return <Upload setActivePage={setActivePage} />;
      case 'summary':
        return <Summary setActivePage={setActivePage} />;
      case 'highlights':
        return <Highlights />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/40 pb-16">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Toast />
    </div>
  );
}
