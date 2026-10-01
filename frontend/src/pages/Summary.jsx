import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  FileText, Download, MessageSquare, Clock, Smile, 
  Brain, Send, ArrowLeftRight, CheckSquare, Search, Copy, Check,
  Cpu, Loader2, Sparkles, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function Summary({ setActivePage }) {
  const { selectedVideo, API_URL, addNotification } = useApp();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Copy Transcript
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // AI Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  const fetchVideoDetails = async (isPoll = false) => {
    if (!selectedVideo) return;
    if (!isPoll) setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/videos/${selectedVideo.id}`);
      setVideoData(response.data);
      if (!isPoll) {
        setChatMessages([
          { role: 'assistant', content: `Hello! I'm your RAG chat assistant for **"${response.data.title}"**. Ask me anything about the contents, transcripts, or decisions of this video.` }
        ]);
      }
    } catch (err) {
      console.error(err);
      if (!isPoll) addNotification('Failed to fetch video details', 'error');
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
  }, [selectedVideo]);

  // Polling loop when video is processing or pending
  useEffect(() => {
    if (!videoData || (videoData.status !== 'processing' && videoData.status !== 'pending')) {
      return;
    }

    const interval = setInterval(() => {
      fetchVideoDetails(true);
    }, 1000);

    return () => clearInterval(interval);
  }, [videoData?.status, selectedVideo]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat/${videoData.id}`, {
        message: userMessage
      });
      setChatMessages((prev) => [...prev, response.data]);
    } catch (err) {
      console.error('RAG Error:', err);
      const detailMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to query RAG assistant.';
      addNotification(detailMsg, 'error');
      setChatMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: `⚠️ **RAG Query Error**: ${detailMsg}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!videoData?.transcript_segments) return;
    const fullText = videoData.transcript_segments.map(s => s.text).join(' ');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    addNotification('Transcript copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format) => {
    if (!videoData) return;
    window.open(`${API_URL}/videos/${videoData.id}/export/${format}`, '_blank');
    addNotification(`Exporting as ${format.toUpperCase()}...`, 'success');
  };

  if (!selectedVideo) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-20 glass-card">
        <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-float" />
        <h3 className="text-xl font-bold text-white">No Video Selected</h3>
        <p className="text-slate-400 text-sm mt-2">Upload a video to inspect AI summaries and transcripts.</p>
        <button onClick={() => setActivePage('upload')} className="glass-btn-primary mt-6 mx-auto">
          Upload Video
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 skeleton rounded-2xl"></div>
          <div className="h-60 skeleton rounded-2xl"></div>
        </div>
        <div className="h-[600px] skeleton rounded-2xl"></div>
      </div>
    );
  }

  // Processing Progress UI
  if (videoData?.status === 'processing' || videoData?.status === 'pending') {
    const steps = [
      { id: 1, name: 'Audio Track Extraction (FFmpeg)', min: 0, max: 29 },
      { id: 2, name: 'Speech-to-Text Transcription (Whisper)', min: 30, max: 39 },
      { id: 3, name: 'Frame Understanding (OpenCV & BLIP-2)', min: 40, max: 59 },
      { id: 4, name: 'Key Scene Detection (PySceneDetect)', min: 60, max: 74 },
      { id: 5, name: 'AI Summary & Key Moments (LLM)', min: 75, max: 84 },
      { id: 6, name: 'Clip Slicing & Reel Merging (FFmpeg)', min: 85, max: 100 },
    ];
    const currentProgress = typeof videoData?.progress_percent === 'number' ? videoData.progress_percent : 0;

    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 space-y-8 glass-card">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400 shadow-xl shadow-brand-500/10">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-extrabold text-white glow-text">AI Video Processing in Progress</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Analyzing <span className="text-slate-200 font-semibold">"{videoData.title}"</span> through our automated multimodal AI pipeline.
          </p>
        </div>

        {/* Live Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
              {videoData.processing_stage || 'Processing pipeline...'}
            </span>
            <span className="text-brand-400">{currentProgress}%</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 transition-all duration-500 rounded-full shadow-lg shadow-brand-500/50"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Step Breakdown */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Workflow Steps</h4>
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
                      ? 'bg-brand-500/15 border-brand-500/40 text-brand-300 shadow-md'
                      : 'bg-slate-950/30 border-slate-800/80 text-slate-500'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin flex-shrink-0" />
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

  // Failed State
  if (videoData?.status === 'failed') {
    return (
      <div className="p-8 max-w-xl mx-auto mt-20 glass-card text-center space-y-4 border border-red-500/30">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-white">Pipeline Execution Failed</h3>
        <p className="text-slate-400 text-sm">{videoData.error_message || 'An error occurred while processing the video pipeline.'}</p>
        <button onClick={() => setActivePage('upload')} className="glass-btn-primary mt-4 mx-auto">
          Try Uploading Again
        </button>
      </div>
    );
  }

  // Filter segments based on keyword search
  const filteredSegments = videoData?.transcript_segments?.filter(s =>
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header with Export Toggles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">AI Generated Summaries</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white glow-text">{videoData?.title}</h1>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2">
          {['markdown', 'pdf', 'docx', 'transcript', 'zip'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="glass-btn-secondary py-2 px-3 text-xs capitalize flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Summaries, bullet points, action items, transcript */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Reading Time</p>
                <p className="text-sm font-bold text-slate-200">{videoData?.reading_time || 2} min</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <Smile className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sentiment</p>
                <p className="text-sm font-bold text-slate-200">{videoData?.sentiment || 'Positive'}</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Topics</p>
                <p className="text-sm font-bold text-slate-200 truncate w-24">{videoData?.topics?.[0] || 'AI Tech'}</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <ArrowLeftRight className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Duration</p>
                <p className="text-sm font-bold text-slate-200">{Math.floor(videoData?.duration / 60)}m {Math.floor(videoData?.duration % 60)}s</p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Executive Summary</h3>
            <p className="text-slate-350 text-sm leading-relaxed">{videoData?.summary}</p>
          </div>

          {/* Key Insights & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Key Insights
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {videoData?.key_insights?.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                Action Items
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {videoData?.action_items?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Transcript Viewer with Search */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Transcript Viewer</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyTranscript}
                  className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Transcript Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search transcript by word/phrases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input pl-11 py-2 text-xs"
              />
            </div>

            {/* Timestamp List */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {filteredSegments.map((seg, i) => (
                <div key={seg.id || i} className="flex gap-4 items-start p-2.5 rounded-xl hover:bg-slate-800/20 transition-colors">
                  <span className="font-bold text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 flex-shrink-0 mt-0.5">
                    {Math.floor(seg.start_time / 60)}:{(seg.start_time % 60).toFixed(0).padStart(2, '0')}
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed">{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns - RAG Interactive Chat Drawer */}
        <div className="glass-card flex flex-col h-[600px] lg:h-auto overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
            <div className="p-2 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-sm">Ask AI Assistant</h4>
              <p className="text-[10px] text-emerald-400 font-bold">RAG Mode Active</p>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex mr-auto items-start max-w-[85%]">
                <div className="p-3 rounded-2xl text-xs bg-slate-800/80 border border-slate-700/50 text-slate-300 rounded-bl-none flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/60 flex gap-2">
            <input
              type="text"
              placeholder="Ask: 'What decisions were made?'"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="glass-input py-2 text-xs flex-1"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
