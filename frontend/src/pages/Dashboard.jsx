import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  Video, Film, CheckCircle, Clock, HardDrive, 
  ArrowUpRight, RefreshCw, BarChart2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export default function Dashboard({ setActivePage }) {
  const { API_URL, setSelectedVideo, addNotification } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videosList, setVideosList] = useState([]);

  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981'];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, videosRes] = await Promise.all([
        axios.get(`${API_URL}/analytics`),
        axios.get(`${API_URL}/videos`)
      ]);
      setStats(analyticsRes.data);
      setVideosList(videosRes.data);
    } catch (err) {
      console.error(err);
      addNotification('Failed to retrieve analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setActivePage('summary');
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 skeleton"></div>
          <div className="h-10 w-24 skeleton"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 skeleton rounded-2xl lg:col-span-2"></div>
          <div className="h-80 skeleton rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white glow-text">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of your video processing pipeline metrics</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="glass-btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Total Uploaded', val: stats?.total_videos, sub: 'Videos in library', icon: Video, color: 'text-indigo-400' },
          { label: 'Videos Processed', val: stats?.processed_videos, sub: 'AI parsing completed', icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Highlights Built', val: stats?.total_highlights, sub: 'Short clips generated', icon: Film, color: 'text-purple-400' },
          { label: 'Avg Process Time', val: `${stats?.average_processing_time}s`, sub: 'Speed per video', icon: Clock, color: 'text-amber-400' },
          { label: 'Storage Used', val: `${stats?.storage_used_mb} MB`, sub: 'Local directory space', icon: HardDrive, color: 'text-pink-400' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</span>
                  <div className="text-2xl font-bold text-white tracking-tight">{c.val}</div>
                </div>
                <div className={`p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-4 block">{c.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processing times & upload frequencies */}
        <div className="glass-card p-6 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Processing Speed & Upload frequency
            </h3>
            <span className="text-xs text-slate-400">Weekly Activity</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.upload_frequency}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="uploads" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Breakdown Chart */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-400" />
            Most Common Topics
          </h3>
          <div className="h-64 flex flex-col justify-between">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.common_topics}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="topic"
                  >
                    {stats?.common_topics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legends */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {stats?.common_topics.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="truncate">{t.topic} ({t.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Videos List */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-400" />
            Your Recent Videos
          </h3>
          <button onClick={() => setActivePage('upload')} className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-0.5">
            Add New Video <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {videosList.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
            <p className="text-sm">No videos uploaded yet. Head to the Upload page to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Uploaded On</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {videosList.slice(0, 5).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-200">{v.title}</td>
                    <td className="py-3.5 text-slate-400">{(v.file_size / (1024 * 1024)).toFixed(1)} MB</td>
                    <td className="py-3.5 text-slate-400">{Math.floor(v.duration / 60)}m {Math.floor(v.duration % 60)}s</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        v.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        v.status === 'processing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' :
                        v.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">{new Date(v.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleVideoSelect(v)}
                        disabled={v.status !== 'completed'}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                          v.status === 'completed'
                            ? 'text-brand-400 border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/15'
                            : 'text-slate-600 border-slate-800 bg-slate-900/40 cursor-not-allowed'
                        }`}
                      >
                        Open Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
