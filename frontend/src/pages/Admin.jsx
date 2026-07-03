import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  Users, Video, Terminal, Settings, Shield, 
  Trash2, Database, Key, ServerCrash, RefreshCw 
} from 'lucide-react';

export default function Admin() {
  const { API_URL, addNotification } = useApp();
  const [usersList, setUsersList] = useState([]);
  const [videosList, setVideosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemLogs, setSystemLogs] = useState([]);

  // Mock list of database jobs
  const [jobs, setJobs] = useState([
    { id: 'job-109', title: 'Deep Learning Lecture 1.mp4', status: 'completed', worker: 'worker-a', duration: '45s' },
    { id: 'job-110', title: 'Tech Podcast Ep 24.mov', status: 'completed', worker: 'worker-b', duration: '82s' },
    { id: 'job-111', title: 'Product Launch Q3.mkv', status: 'failed', worker: 'worker-a', duration: '12s' }
  ]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/videos`);
      setVideosList(response.data);
      
      // Mock Users list since User list API is secure
      setUsersList([
        { id: 1, username: 'admin', email: 'admin@vhighlights.ai', role: 'admin', joined: '2026-06-25' },
        { id: 2, username: 'rahul', email: 'rahul@vhighlights.ai', role: 'user', joined: '2026-07-02' },
        { id: 3, username: 'guest_user', email: 'guest@vhighlights.ai', role: 'user', joined: '2026-07-02' }
      ]);
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch admin stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    // Create live scrolling mock logs
    const logInterval = setInterval(() => {
      const logs = [
        'INFO:  [Worker-a] Audio extracted successfully. File size: 12.4MB',
        'INFO:  [Whisper API] Connection established. Beginning transcript segment indexing...',
        'DEBUG: [SQLAlchemy] Committing transcript segment to database for video_id=4',
        'INFO:  [LLM-Gemini] Analyzing transcript. Token count: 3,429 tokens',
        'INFO:  [FFmpeg] Slicing video clip at 12.4s to 24.8s. Codec copy mode active',
        'WARNING: [Database] Pool Recycle threshold close. Re-verifying pool connection...',
        'INFO:  [Exporter] Generated PDF report for video title: Demo Video'
      ];
      const randomLog = `[${new Date().toLocaleTimeString()}] ${logs[Math.floor(Math.random() * logs.length)]}`;
      setSystemLogs((prev) => [randomLog, ...prev.slice(0, 15)]);
    }, 3000);

    return () => clearInterval(logInterval);
  }, []);

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video and its highlights?')) return;
    try {
      await axios.delete(`${API_URL}/videos/${id}`);
      setVideosList((prev) => prev.filter((v) => v.id !== id));
      addNotification('Video deleted from database and system', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Failed to delete video', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-10 w-48 skeleton"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-60 skeleton rounded-2xl"></div>
          <div className="h-60 skeleton rounded-2xl"></div>
          <div className="h-60 skeleton rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white glow-text">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Manage users, files storage, active pipelines, and system monitors</p>
          </div>
        </div>
        <button onClick={fetchAdminData} className="glass-btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Panel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users Management */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Registered Users ({usersList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-2">Username</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Access Role</th>
                  <th className="pb-2">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/10">
                    <td className="py-3 font-semibold text-slate-200">{u.username}</td>
                    <td className="py-3 text-slate-400">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storage overview */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Storage Quota & Server
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 font-bold mb-1">
                <span>Disk Usage (uploads/)</span>
                <span>28% Used</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs pt-3">
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-500 block">Total Files size</span>
                <span className="text-slate-200 font-bold mt-1 block">42.5 MB</span>
              </div>
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-500 block">Highlights folder</span>
                <span className="text-slate-200 font-bold mt-1 block">18.9 MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video files database control */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-400" />
            Database Uploads & Processing Jobs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Filename</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-350">
                {videosList.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/10">
                    <td className="py-2.5 font-semibold text-slate-200 truncate max-w-[150px]">{v.title}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-[10px] truncate max-w-[120px]">{v.filename}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteVideo(v.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System log Stream */}
        <div className="glass-card p-6 space-y-4 flex flex-col h-[320px] lg:h-auto">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            Live System Log Terminal
          </h3>
          <div className="flex-1 bg-black/60 border border-slate-800 rounded-xl p-3.5 font-mono text-[10px] text-emerald-400 overflow-y-auto space-y-2 select-text">
            {systemLogs.length === 0 ? (
              <span className="text-slate-650">Booting log stream listener...</span>
            ) : (
              systemLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed break-all">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
