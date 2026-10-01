import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  Scissors, Play, Download, Star, Video, 
  Trash2, AlertCircle, Clock, Check, Edit2, Film,
  Loader2, Sparkles, CheckCircle2
} from 'lucide-react';

export default function Highlights({ setActivePage }) {
  const { selectedVideo, API_URL, addNotification } = useApp();
  const [highlights, setHighlights] = useState([]);
  const [videoDetails, setVideoDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeClip, setActiveClip] = useState(null);

  // Edit highlight modal/state
  const [editingClip, setEditingClip] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchHighlights = async (isPoll = false) => {
    if (!selectedVideo) return;
    if (!isPoll) setLoading(true);
    try {
      const [highlightsRes, detailsRes] = await Promise.all([
        axios.get(`${API_URL}/videos/${selectedVideo.id}/highlights`),
        axios.get(`${API_URL}/videos/${selectedVideo.id}`)
      ]);
      
      setHighlights(highlightsRes.data);
      setVideoDetails(detailsRes.data);
      
      if (highlightsRes.data.length > 0 && !activeClip) {
        setActiveClip(highlightsRes.data[0]);
      }
    } catch (err) {
      console.error(err);
      if (!isPoll) addNotification('Failed to fetch highlights', 'error');
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, [selectedVideo]);

  // Polling loop when video is processing or pending
  useEffect(() => {
    if (!videoDetails || (videoDetails.status !== 'processing' && videoDetails.status !== 'pending')) {
      return;
    }

    const interval = setInterval(() => {
      fetchHighlights(true);
    }, 1000);

    return () => clearInterval(interval);
  }, [videoDetails?.status, selectedVideo]);

  const MEDIA_URL = API_URL.replace(/\/api\/?$/, '');

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
      const res = await axios.put(`${API_URL}/videos/highlights/${editingClip.id}`, {
        title: editTitle
      });
      setHighlights((prev) => prev.map((item) => item.id === editingClip.id ? res.data : item));
      if (activeClip?.id === editingClip.id) {
        setActiveClip(res.data);
      }
      setEditingClip(null);
      addNotification('Highlight details saved', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Failed to save highlight info', 'error');
    }
  };

  if (!selectedVideo) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-20 glass-card">
        <Scissors className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-float" />
        <h3 className="text-xl font-bold text-white">No Highlights Available</h3>
        <p className="text-slate-400 text-sm mt-2">Upload a video to extract AI highlight clips.</p>
        <button onClick={() => setActivePage && setActivePage('upload')} className="glass-btn-primary mt-6 mx-auto">
          Upload Video
        </button>
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

  // Processing Progress UI
  if (videoDetails?.status === 'processing' || videoDetails?.status === 'pending') {
    const steps = [
      { id: 1, name: 'Audio Track Extraction (FFmpeg)', min: 0, max: 29 },
      { id: 2, name: 'Speech-to-Text Transcription (Whisper)', min: 30, max: 39 },
      { id: 3, name: 'Frame Understanding (OpenCV & BLIP-2)', min: 40, max: 59 },
      { id: 4, name: 'Key Scene Detection (PySceneDetect)', min: 60, max: 74 },
      { id: 5, name: 'AI Summary & Key Moments (LLM)', min: 75, max: 84 },
      { id: 6, name: 'Clip Slicing & Reel Merging (FFmpeg)', min: 85, max: 100 },
    ];
    const currentProgress = typeof videoDetails?.progress_percent === 'number' ? videoDetails.progress_percent : 0;

    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 space-y-8 glass-card">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-xl shadow-purple-500/10">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-extrabold text-white glow-text">Extracting Highlights & Scene Clips</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Processing video <span className="text-slate-200 font-semibold">"{videoDetails.title}"</span> in real-time. Highlights will appear as soon as merging completes.
          </p>
        </div>

        {/* Live Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              {videoDetails.processing_stage || 'Clipping highlights...'}
            </span>
            <span className="text-purple-400">{currentProgress}%</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-brand-500 transition-all duration-500 rounded-full shadow-lg shadow-purple-500/50"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Step Breakdown */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Highlight Extraction Stages</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((st) => {
              const isDone = currentProgress > st.max;
              const isCurrent = currentProgress >= st.min && currentProgress <= st.max;
              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : isCurrent
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-md'
                      : 'bg-slate-950/30 border-slate-800/80 text-slate-500'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0"></div>
                  )}
                  <span className="font-medium truncate">{st.name}</span>
                </div>
              );
            })}
          </div>
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
                  src={`${MEDIA_URL}/highlights/${activeClip.filepath.split('/').pop().split('\\').pop()}`}
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
                      disabled={activeClip.is_consolidated}
                      className={`p-2.5 rounded-xl border transition-all ${
                        activeClip.is_favorite
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white'
                      } ${activeClip.is_consolidated ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <Star className="w-4.5 h-4.5" fill={activeClip.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => {
                        if (activeClip.is_consolidated) {
                          window.open(`${API_URL}/videos/${selectedVideo.id}/highlight-reel/download`, '_blank');
                          addNotification('Downloading merged highlight reel...', 'success');
                        } else {
                          handleDownload(activeClip);
                        }
                      }}
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

          {videoDetails?.highlight_filepath && (
            <div className="glass-card p-4 border border-brand-500/30 bg-brand-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
                  <Film className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Full Highlight Reel</h4>
                  <p className="text-[10px] text-slate-400 font-medium">All key moments merged</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveClip({
                      title: "Consolidated Highlight Reel",
                      duration: highlights.reduce((acc, curr) => acc + curr.duration, 0),
                      start_time: 0,
                      end_time: highlights.reduce((acc, curr) => acc + curr.duration, 0),
                      filepath: videoDetails.highlight_filepath,
                      is_consolidated: true,
                      importance_score: 9.5,
                      confidence_score: 0.95
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5" /> Play
                </button>
                <button
                  onClick={() => {
                    window.open(`${API_URL}/videos/${selectedVideo.id}/highlight-reel/download`, '_blank');
                    addNotification('Downloading merged highlight reel...', 'success');
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-350 hover:text-white transition-all flex items-center justify-center"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

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
