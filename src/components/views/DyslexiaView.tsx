import React, { useRef } from 'react';
import { Mic, Globe, LogIn, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface DyslexiaViewProps {
  selectedLang: string;
  setSelectedLang: (val: string) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  transcript: string;
  detectedPhonemes: string[];
  audioData: number[];
  speechError: string | null;
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  langMap: Record<string, string>;
}

export default function DyslexiaView({
  selectedLang, setSelectedLang,
  isRecording, toggleRecording,
  transcript, detectedPhonemes, audioData, speechError,
  user, loginWithGoogle, logout, langMap
}: DyslexiaViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
            <Mic className="w-8 h-8 text-indigo-500" />
            {selectedLang === 'English' ? 'Phonemic Speech Analyzer' : 'Analyseur Phonémique'}
          </h2>
          <p className="text-indigo-400 font-mono text-sm uppercase tracking-widest mt-2 font-bold">
            Real-Time Edge Inference & Visual Mapping
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Globe className="w-4 h-4 text-white/40" />
            </div>
            <select 
              className="bg-slate-900 border border-slate-800 text-white/90 text-sm uppercase tracking-widest rounded-xl pl-10 pr-10 py-3 outline-none appearance-none focus:border-indigo-500/50 transition-colors shadow-lg"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {Object.keys(langMap).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={user ? logout : loginWithGoogle}
            className="flex items-center justify-center w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors text-white"
            title={user ? "Logout" : "Login"}
          >
            {user ? <LogOut className="w-5 h-5 text-red-400" /> : <LogIn className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10" ref={containerRef}>
        <div className="glass-panel p-6 rounded-[2rem] flex flex-col items-center justify-center min-h-[400px] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[300px] flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity duration-1000">
             <div className="flex items-center gap-1 w-full max-w-sm">
                {audioData.map((val, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-indigo-500 rounded-full transition-all duration-100 ease-out"
                    style={{ height: `${Math.max(4, val)}%` }}
                  />
                ))}
             </div>
          </div>
          
          <button 
            onClick={toggleRecording}
            className={`relative z-20 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 backdrop-blur-sm ${
              isRecording 
                ? 'bg-red-500/20 text-red-500 border-red-500/50 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-pulse' 
                : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:scale-105 hover:border-white/30'
            }`}
          >
            <Mic className={`w-12 h-12 transition-transform duration-500 ${isRecording ? 'scale-110' : ''}`} />
          </button>
          
          <p className="mt-8 relative z-20 text-white/50 uppercase tracking-widest text-xs font-bold font-mono">
            {isRecording ? (selectedLang === 'English' ? 'Awaiting Audio Input Stream...' : 'Analyse en cours...') : (selectedLang === 'English' ? 'Initialize Audio Channel' : 'Ouvrir le canal audio')}
          </p>
          
          {speechError && (
             <p className="mt-4 text-xs text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20 text-center max-w-sm font-mono">
                {speechError}
             </p>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-end">
          <div className="glass-panel rounded-3xl p-6 min-h-[200px] border border-white/10 shadow-xl flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-bl-xl border-b border-l border-indigo-500/20">
                Transcription Raw Buffer
             </div>
             <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Transcript</h3>
             <div className="flex-1 font-mono text-xl text-white/90 leading-relaxed pt-4">
                {transcript || <span className="text-white/20 italic">Awaiting speech buffer synthesis...</span>}
             </div>
          </div>
          
          <div className="glass-panel rounded-3xl p-6 min-h-[200px] border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)] bg-indigo-500/5 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-bl-xl border-b border-l border-emerald-500/20">
                CoreML Decoded Phonemes
             </div>
             <div className="flex items-center gap-2 mb-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-wider">Visual Mapping</h3>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             </div>
             <div className="flex-1 flex items-center justify-center flex-wrap gap-3 p-4">
                {detectedPhonemes.length > 0 ? detectedPhonemes.map((ph, i) => (
                  <div key={i} className={`px-6 py-4 rounded-2xl font-mono text-3xl font-black bg-white text-black shadow-xl animate-in zoom-in duration-300 ${i === 0 ? 'scale-110 shadow-[0_10px_40px_rgba(255,255,255,0.3)] ring-4 ring-indigo-500/50' : 'opacity-60 scale-90'}`}>
                    {ph}
                  </div>
                )) : (
                  <span className="font-mono text-white/20 text-sm uppercase tracking-widest">Inference idle... waiting for audio</span>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
