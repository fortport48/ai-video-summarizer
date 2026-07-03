import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { 
  FileText, Download, MessageSquare, Clock, Smile, 
  Brain, Send, ArrowLeftRight, CheckSquare, Search, Copy, Check 
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

  const fetchVideoDetails = async () => {
    if (!selectedVideo) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/videos/${selectedVideo.id}`);
      setVideoData(response.data);
      // Fetch initial chat logs from the video schema
      setChatMessages([
        { role: 'assistant', content: `Hello! I'm your RAG chat assistant for **"${response.data.title}"**. Ask me anything about the contents, transcripts, or decisions of this video.` }
      ]);
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch video details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
  }, [selectedVideo]);

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
      console.error(err);
      addNotification('Failed to query RAG assistant', 'error');
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
        <p className="text-slate-400 text-sm mt-2">Go back to the Dashboard or upload a new video to inspect AI summaries.</p>
        <button onClick={() => setActivePage('dashboard')} className="glass-btn-primary mt-6 mx-auto">
          Go to Dashboard
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
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
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
