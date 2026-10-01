import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { UploadCloud, FileVideo, Cpu, Eye, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Upload({ setActivePage }) {
  const { API_URL, addNotification, setSelectedVideo, appSettings } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  
  // Pipeline Settings
  const [model, setModel] = useState(appSettings.aiModel);
  const [style, setStyle] = useState(appSettings.highlightStyle);
  const [length, setLength] = useState(appSettings.summaryLength);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setupFile(e.target.files[0]);
    }
  };

  const setupFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      addNotification('Unsupported format. Please upload MP4, MOV, AVI, or MKV.', 'error');
      return;
    }
    
    // Check max 2GB limit
    if (selectedFile.size > 2 * 1024 * 1024 * 1024) {
      addNotification('File exceeds the 2GB limit.', 'error');
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name);
    setVideoPreview(URL.createObjectURL(selectedFile));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    addNotification('Uploading video. Please wait...', 'info');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      // 1. Upload Video File
      const uploadRes = await axios.post(`${API_URL}/videos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Scale upload progress from 10 to 90%
          setUploadProgress(10 + percentCompleted * 0.8);
        }
      });
      
      const dbVideo = uploadRes.data;
      setUploadProgress(95);
      addNotification('Upload successful! Starting AI analysis.', 'success');

      // 2. Trigger AI processing pipeline
      const processRes = await axios.post(
        `${API_URL}/videos/${dbVideo.id}/process?model=${model}&style=${style}&length=${length}`
      );
      
      setUploadProgress(100);
      addNotification('AI Processing Pipeline started in background.', 'success');
      
      // Auto redirect to Summary
      setTimeout(() => {
        setSelectedVideo(processRes.data);
        setActivePage('summary');
      }, 1500);

    } catch (err) {
      console.error('Upload/Process Error:', err);
      const detailedError = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to complete video pipeline creation.';
      addNotification(detailedError, 'error');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white glow-text">Upload Video</h1>
          <span className="text-xs font-mono bg-slate-800/80 text-brand-400 px-3 py-1 rounded-full border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            API: {API_URL}
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1">Submit long lectures, podcasts, or webinars to generate highlights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[350px] ${
                  dragActive 
                    ? 'border-brand-500 bg-brand-500/5 scale-[0.99] shadow-2xl' 
                    : 'border-slate-800 bg-slate-900/25 hover:border-brand-500/40 hover:bg-slate-850/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".mp4,.mov,.avi,.mkv"
                />
                <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-lg text-slate-400 mb-5">
                  <UploadCloud className="w-10 h-10 animate-float" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Drag and drop your video file</h3>
                <p className="text-sm text-slate-500 mt-2">MP4, MOV, AVI, MKV up to 2GB</p>
                <button
                  type="button"
                  className="glass-btn-secondary px-5 py-2 mt-6 text-sm"
                >
                  Select File
                </button>
              </div>
            ) : (
              <div className="glass-card p-6 space-y-5">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-xl text-brand-400">
                      <FileVideo className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 truncate max-w-sm">{file.name}</h4>
                      <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setVideoPreview(null); }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Clear File
                  </button>
                </div>

                {/* Video Preview */}
                {videoPreview && (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video relative group">
                    <video src={videoPreview} controls className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Video Title Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Video Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="glass-input"
                    placeholder="Enter project name..."
                  />
                </div>

                {/* Progress bar */}
                {isUploading && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Pipeline Progress</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full glass-btn-primary py-3.5 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Start AI Extraction
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Configuration settings sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <Cpu className="w-5 h-5 text-brand-400" />
              Pipeline Configuration
            </h3>

            {/* Model type */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">AI LLM Model</label>
              <div className="grid grid-cols-3 gap-2">
                {['Gemini', 'GPT', 'Llama'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      model === m 
                        ? 'bg-brand-500/15 border-brand-500 text-brand-400' 
                        : 'bg-slate-950/20 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlight Style */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Highlight Preset Style</label>
              <div className="grid grid-cols-2 gap-2">
                {['Podcast', 'Educational', 'Meeting', 'Sports', 'Entertainment'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStyle(st)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      style === st 
                        ? 'bg-brand-500/15 border-brand-500 text-brand-400' 
                        : 'bg-slate-950/20 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary length */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Summary Granularity</label>
              <div className="grid grid-cols-3 gap-2">
                {['short', 'medium', 'detailed'].map((ln) => (
                  <button
                    key={ln}
                    type="button"
                    onClick={() => setLength(ln)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      length === ln 
                        ? 'bg-brand-500/15 border-brand-500 text-brand-400' 
                        : 'bg-slate-950/20 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ln}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
