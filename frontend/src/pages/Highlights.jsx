import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  Scissors, Play, Download, Star, Video, 
  Trash2, AlertCircle, Clock, Check, Edit2 
} from 'lucide-react';

export default function Highlights() {
  const { selectedVideo, API_URL, addNotification } = useApp();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClip, setActiveClip] = useState(null);

  // Edit highlight modal/state
  const [editingClip, setEditingClip] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchHighlights = async () => {
    if (!selectedVideo) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/videos/${selectedVideo.id}/highlights`);
      setHighlights(response.data);
      if (response.data.length > 0) {
        setActiveClip(response.data[0]);
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch highlights', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, [selectedVideo]);

  const handleFavoriteToggle = async (hl) => {
    try {
      const newFav = !hl.is_favorite;
      const res = await axios.post(`${API_URL}/videos/highlights/${hl.id}/favorite`, {
        is_favorite: newFav
      });
      setHighlights((prev) => prev.map((item) => item.id === hl.id ? res.data : item));
      if (activeClip?.id === hl.id) {
        setActiveClip(res.data);
      }
      addNotification(newFav ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Failed to update favorite status', 'error');
    }
  };

  const handleDownload = (hl) => {
    window.open(`${API_URL}/videos/highlights/${hl.id}/download`, '_blank');
    addNotification('Downloading highlight clip...', 'success');
  };

  const handleEditClick = (hl) => {
    setEditingClip(hl);
    setEditTitle(hl.title || '');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      // Offline/Mock title save, updates state local list
      setHighlights((prev) => prev.map((item) => {
        if (item.id === editingClip.id) {
          const updated = { ...item, title: editTitle };
          if (activeClip?.id === item.id) {
            setActiveClip(updated);
          }
          return updated;
        }
        return item;
      }));
      setEditingClip(null);
      addNotification('Highlight details saved', 'success');
    } catch (err) {
      addNotification('Failed to save highlight info', 'error');
    }
  };

  if (!selectedVideo) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-20 glass-card">
        <Scissors className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-float" />
        <h3 className="text-xl font-bold text-white">No Highlights Available</h3>
        <p className="text-slate-400 text-sm mt-2">Go back to the Dashboard or upload a new video to run the AI clipper.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[450px] skeleton rounded-2xl"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Timeline Clips & Moments</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white glow-text">AI Highlights Player</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Video Clip Player */}
        <div className="lg:col-span-2 space-y-6">
          {activeClip ? (
            <div className="glass-card overflow-hidden">
              <div className="aspect-video bg-black relative">
                {/* Resolve local path from backend Static Files mount */}
                <video
                  src={`http://localhost:8000/highlights/${activeClip.filepath.split('/').pop().split('\\').pop()}`}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Clip Details */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{activeClip.title || 'Untitled Moment'}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Duration: {activeClip.duration.toFixed(1)}s | Timestamps: {activeClip.start_time.toFixed(1)}s - {activeClip.end_time.toFixed(1)}s
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFavoriteToggle(activeClip)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        activeClip.is_favorite
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Star className="w-4.5 h-4.5" fill={activeClip.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleDownload(activeClip)}
                      className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 border border-brand-600 hover:border-brand-500 text-white transition-all"
                    >
                      <Download className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Importance Rating</p>
                    <div className="text-lg font-bold text-purple-400 mt-1">{activeClip.importance_score}/10</div>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Confidence</p>
                    <div className="text-lg font-bold text-emerald-400 mt-1">{(activeClip.confidence_score * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-20 text-center flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800">
              <Video className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
              <p>No active highlight clip rendering.</p>
            </div>
          )}
        </div>

        {/* Right column: Highlights Timeline List */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">Detected Moments</h3>

          {highlights.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No highlights extracted for this video.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {highlights.map((hl) => (
                <div
                  key={hl.id}
                  onClick={() => setActiveClip(hl)}
                  className={`glass-card p-4 flex gap-4 cursor-pointer transition-all border ${
                    activeClip?.id === hl.id
                      ? 'border-brand-500/60 bg-brand-500/5'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/10'
                  }`}
                >
                  <div className="w-12 h-12 bg-slate-800 border border-slate-750 flex items-center justify-center rounded-xl flex-shrink-0 text-brand-400">
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-slate-200 text-sm truncate">{hl.title || 'Highlight moment'}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(hl); }}
                        className="text-slate-500 hover:text-slate-350 p-0.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Timestamp: {hl.start_time.toFixed(1)}s - {hl.end_time.toFixed(1)}s ({hl.duration.toFixed(1)}s)
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                        Score: {hl.importance_score}
                      </span>
                      {hl.is_favorite && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5" fill="currentColor" /> Fav
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Moment Title Modal */}
      {editingClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full p-6 space-y-5 border border-slate-800">
            <h4 className="text-lg font-bold text-white">Edit Highlight Title</h4>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="glass-input text-sm"
                placeholder="Clip title"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingClip(null)}
                className="flex-1 glass-btn-secondary py-2 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 glass-btn-primary py-2 text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
