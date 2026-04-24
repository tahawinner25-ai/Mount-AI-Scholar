import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, BrainCircuit, Loader2, X, Languages, ChevronDown, FileText, Sparkles, Zap, Volume2, VolumeX, Trophy, Target, Activity, Mic } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(30).fill(0));
  const [detectedPhonemes, setDetectedPhonemes] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [mode, setMode] = useState<'dyslexia' | 'deaf' | 'learning'>('dyslexia');
  
  // Simulation de l'analyse vocale en temps réel (CoreML Mock)
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        // Mock audio visualization data
        setAudioData(prev => prev.map(() => Math.random() * 100));
        
        // Simuler la détection de phonèmes aléatoires
        const phonemes = ["/ba/", "/ko/", "/ti/", "/sa/", "/re/"];
        if (Math.random() > 0.8) {
          const newPhoneme = phonemes[Math.floor(Math.random() * phonemes.length)];
          setDetectedPhonemes(prev => [newPhoneme, ...prev].slice(0, 8));
          
          // Append to mock transcript
          setTranscript(prev => (prev + " " + newPhoneme).trim().slice(-100));
        }
      }, 100);
    } else {
      setAudioData(new Array(30).fill(0));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTranscript("");
      setDetectedPhonemes([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-orange-500/30">
      {/* Navigation de l'Architecte */}
      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-600 shadow-lg shadow-orange-950/20">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mount AI<span className="text-orange-500">: Voice Core</span></h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">WWDC 2027 Prototype V1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className={`hidden md:flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800`}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
              <span className={isRecording ? 'text-red-400' : 'text-slate-500'}>
                {isRecording ? 'CORE_ML_ACTIVE' : 'READY_TO_BOOT'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Panneau de gauche: Contrôles & Modes */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Mode d'Analyse
            </h3>
            <div className="space-y-3">
              {[
                { id: 'dyslexia', label: 'Dyslexie', icon: <BrainCircuit className="w-4 h-4" />, desc: 'Décodage phonémique' },
                { id: 'deaf', label: 'Surdité', icon: <VolumeX className="w-4 h-4" />, desc: 'Visualisation sonore' },
                { id: 'learning', label: 'Apprentissage', icon: <BookOpen className="w-4 h-4" />, desc: 'Correction vocale' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${mode === m.id ? 'bg-orange-600 border-orange-500 text-white shadow-xl shadow-orange-900/20' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    {m.icon}
                    <span className="text-sm font-bold tracking-tight">{m.label}</span>
                  </div>
                  <p className={`text-[10px] ${mode === m.id ? 'text-orange-100' : 'text-slate-500'}`}>{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Performances Engine</h3>
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Latence (Inference)</p>
                <p className="text-xl font-mono font-bold text-orange-500">14<span className="text-xs ml-1">ms</span></p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Confiance Modèle</p>
                <div className="flex items-end justify-between">
                  <p className="text-xl font-mono font-bold text-emerald-500">98.2<span className="text-xs ml-1">%</span></p>
                  <div className="flex gap-0.5 h-4 items-end">
                    {[0.4, 0.6, 0.8, 1, 0.9].map((h, i) => (
                      <div key={i} className="w-1 bg-emerald-500 rounded-full" style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Section Centrale: Visualisation & AR Preview */}
        <section className="lg:col-span-6 space-y-8">
          {/* Virtual AR Viewport */}
          <div className="aspect-[4/3] bg-slate-900 rounded-[2.5rem] border border-slate-800 relative overflow-hidden group shadow-2xl">
            {/* Camera Simulation (Overlay) */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-40 mix-blend-screen group-hover:scale-105 transition-transform duration-[2000ms]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50 z-10" />
            
            {/* AR Elements - HUD */}
            <div className="absolute inset-0 z-20 p-8 pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                  <Target className="w-4 h-4 text-orange-500 animate-pulse" />
                  <div>
                    <p className="text-[10px] font-mono font-bold tracking-tighter text-white">TRACKING_STATUS: LOCKED</p>
                    <p className="text-[8px] font-mono text-slate-400">FPS: 60 | AR_V: 2.1</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-2/3" />
                   </div>
                   <p className="text-[8px] font-mono text-slate-400">SIGNAL: 88%</p>
                </div>
              </div>
            </div>

            {/* Virtual AR Syllables Floating */}
            <div className="absolute inset-0 z-30 flex items-center justify-center p-12">
              {isRecording ? (
                <div className="flex flex-wrap justify-center gap-4">
                  {detectedPhonemes.map((p, i) => (
                    <div 
                      key={i}
                      className="min-w-[4rem] h-16 px-4 bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-in fade-in zoom-in duration-300"
                      style={{ 
                        transform: `translateY(${Math.sin(Date.now()/500 + i) * 10}px)`,
                        opacity: 1 - i * 0.12 
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-6 max-w-sm px-6">
                  <div className="w-24 h-24 bg-slate-950/80 rounded-full flex items-center justify-center mx-auto border border-white/5 relative">
                    <div className="absolute inset-0 rounded-full border border-orange-500/20 animate-ping" />
                    <Volume2 className="w-10 h-10 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 italic">Prêt pour l'Impact ?</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">Appuie sur le bouton ci-dessous pour lancer l'analyse en temps réel et voir les phonèmes se matérialiser.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Visualizer & Record Button UI (Bottom Overlay) */}
            <div className="absolute bottom-8 inset-x-8 z-40 flex items-center justify-between bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/5">
              <div className="flex gap-1.5 items-center h-10 px-2 lg:flex hidden">
                {audioData.map((v, i) => (
                  <div 
                    key={i} 
                    className={`w-1 rounded-full transition-all duration-75 ${isRecording ? 'bg-orange-500' : 'bg-slate-700'}`}
                    style={{ height: `${Math.max(10, v)}%`, opacity: 0.2 + (v/100) }}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right lg:block hidden">
                   <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Engine Process</p>
                   <p className="text-xs font-bold text-orange-500 tracking-widest">{isRecording ? 'SYNCING...' : 'STANDBY'}</p>
                </div>
                <button 
                  onClick={toggleRecording}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${isRecording ? 'bg-red-500 hover:bg-red-600 ring-8 ring-red-500/10' : 'bg-orange-600 hover:bg-orange-500 ring-8 ring-orange-500/10 active:scale-90 scale-110'}`}
                >
                  {isRecording ? <VolumeX className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>
              </div>
            </div>
          </div>

          {/* Transcription Dashboard */}
          <div className="bg-slate-900/50 rounded-[2rem] border border-slate-800 p-8 space-y-6 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-orange-500" />
                </div>
                Transcription Intelligence
              </h3>
              {isRecording && (
                <div className="px-3 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-lg animate-pulse">LIVE</div>
              )}
            </div>
            <div className="min-h-[120px] bg-slate-950 p-8 rounded-3xl border border-slate-800/50 relative group">
              <p className={`text-xl font-medium leading-relaxed transition-colors duration-500 ${isRecording ? 'text-slate-100' : 'text-slate-500'}`}>
                {transcript || (
                  <span className="font-light italic tracking-tight">
                    Le moteur de reconnaissance attend une entrée audio...
                  </span>
                )}
              </p>
              <Sparkles className="absolute bottom-4 right-4 w-5 h-5 text-orange-500/30 group-hover:text-orange-500 transition-colors" />
            </div>
          </div>
        </section>

        {/* Panneau de droite: Logs & Architecture */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Flux CoreML</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex-1 space-y-3 font-mono text-[10px] overflow-y-auto max-h-[600px] pr-2 scrollbar-hide">
              <div className="flex gap-2 text-slate-600 py-1 border-b border-slate-800/50">
                <span className="text-emerald-500">[OK]</span>
                <span>HW_ACCEL: Apple Neural Engine (ANE)</span>
              </div>
              <div className="flex gap-2 text-slate-600 py-1 border-b border-slate-800/50">
                <span className="text-blue-500">[LOG]</span>
                <span>Model v2.4 loaded from local bundle</span>
              </div>
              <div className="flex gap-2 text-slate-600 py-1 border-b border-slate-800/50">
                <span className="text-blue-500">[LOG]</span>
                <span>Quantization: Float16</span>
              </div>
              {isRecording && (
                <>
                  <div className="flex gap-2 text-orange-500 py-1 border-b border-slate-800/50 animate-pulse">
                    <span>[BS]</span>
                    <span>Buffer: 2048 Samples</span>
                  </div>
                  <div className="flex flex-col gap-1 text-white bg-slate-950 p-2 rounded-lg mt-2 border border-slate-800">
                    <span className="text-slate-500">PHONEME_DET:</span>
                    <span className="text-sm font-bold text-orange-400">{detectedPhonemes[0] || '---'}</span>
                  </div>
                </>
              )}
              <div className="text-slate-700 py-4 text-center border-t border-slate-800 mt-4 italic">
                Logs système en attente...
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl border border-white/10 shadow-xl overflow-hidden relative group">
            <Trophy className="w-12 h-12 text-white/10 absolute -bottom-2 -right-2 transform group-hover:scale-150 transition-transform duration-500" />
            <h4 className="text-sm font-bold text-white mb-2">Objectif WWDC 2027</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              Ce dashboard simule l'intégration de CoreML et ARKit pour l'iPad. Chaque phonème détecté sera projeté en 3D dans l'espace physique.
            </p>
          </div>
        </aside>
      </main>

      {/* Credits & Tech Talk */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 flex flex-col md:flex-row items-center gap-8 justify-between opacity-80">
        <div className="flex items-center gap-4">
           <p className="text-xs text-slate-500 font-medium">DESIGNED BY COACH ARCHITECT FOR CAPITAINE</p>
           <div className="w-1 h-1 bg-slate-800 rounded-full" />
           <p className="text-xs text-slate-600 font-mono">0xDEADBEEF / SECURE_LAYER</p>
        </div>
        <div className="flex gap-4">
          <button className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest">Swift Implementation Plan</button>
        </div>
      </footer>
    </div>
  );
}
