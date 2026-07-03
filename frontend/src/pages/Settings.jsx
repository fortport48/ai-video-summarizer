import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Save, Key, Globe, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const { appSettings, updateSettings } = useApp();
  
  const [summaryLength, setSummaryLength] = useState(appSettings.summaryLength);
  const [highlightStyle, setHighlightStyle] = useState(appSettings.highlightStyle);
  const [language, setLanguage] = useState(appSettings.language);
  const [aiModel, setAiModel] = useState(appSettings.aiModel);

  // API Key fields
  const [hfToken, setHfToken] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      summaryLength,
      highlightStyle,
      language,
      aiModel
    });
    // In production, save keys to secure backend database or session storage.
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white glow-text">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure model configurations, API keys, and translation settings</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Settings options Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              General Preferences
            </h3>

            {/* Translation Language */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="glass-input bg-slate-950 text-slate-200"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Marathi">Marathi (मराठी)</option>
              </select>
            </div>

            {/* Default Summary length */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Default Summary Granularity</label>
              <select
                value={summaryLength}
                onChange={(e) => setSummaryLength(e.target.value)}
                className="glass-input bg-slate-950 text-slate-200"
              >
                <option value="short">Short (Bullet summary, concise)</option>
                <option value="medium">Medium (Standard overview and highlights)</option>
                <option value="detailed">Detailed (Deep semantic explanation & topics)</option>
              </select>
            </div>

            {/* Default Highlight Preset Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Highlight Style Preset</label>
              <select
                value={highlightStyle}
                onChange={(e) => setHighlightStyle(e.target.value)}
                className="glass-input bg-slate-950 text-slate-200"
              >
                <option value="Podcast">Podcast (Conversations & Key topics)</option>
                <option value="Educational">Educational (Formulas & Lectures)</option>
                <option value="Meeting">Meeting (Decisions & Action Items)</option>
                <option value="Sports">Sports (Fast action & High intensity)</option>
                <option value="Entertainment">Entertainment (Climax & Emotional peaks)</option>
              </select>
            </div>

            {/* default model selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preferred AI Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="glass-input bg-slate-950 text-slate-200"
              >
                <option value="Gemini">Gemini (Recommended - Google AI Studio)</option>
                <option value="GPT">GPT (OpenAI)</option>
                <option value="Llama">Llama (Hugging Face Free Inference)</option>
              </select>
            </div>

            <button type="submit" className="glass-btn-primary px-5 py-2.5 flex items-center gap-1.5 self-start">
              <Save className="w-4 h-4" />
              Save Configurations
            </button>
          </div>
        </div>

        {/* API keys column */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                API Integration Keys
              </h3>
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="text-slate-400 hover:text-slate-200"
              >
                {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Define your API keys here to override pipeline endpoints dynamically. Leave empty to use default offline mocks.
            </p>

            {/* Hugging Face */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hugging Face Token</label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="hf_••••••••••••••••••••••••"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                className="glass-input py-2 text-xs"
              />
            </div>

            {/* Gemini */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gemini Key (AI Studio)</label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="AIzaSy••••••••••••••••••••"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="glass-input py-2 text-xs"
              />
            </div>

            {/* OpenAI */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">OpenAI API Key</label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-proj-••••••••••••••••••••"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="glass-input py-2 text-xs"
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
