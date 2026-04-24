import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, BrainCircuit, Loader2, X, Languages, ChevronDown, FileText, Sparkles, Zap, Volume2, VolumeX, Trophy, Target, Activity, Mic, Network, Gamepad2, Presentation, Headphones, Layers, ArrowLeft, Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateSummary, generateQuiz, generateMindMap } from './services/ai';
import Mermaid from './components/Mermaid';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(30).fill(0));
  const [detectedPhonemes, setDetectedPhonemes] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [mainView, setMainView] = useState<'hub' | 'dyslexia' | 'learning'>('hub');
  const [learningMode, setLearningMode] = useState<'mindmap' | 'quiz' | 'presentation' | 'summary'>('summary');
  
  // States for Gemini Integration
  const [inputText, setInputText] = useState("");
  const [learningResult, setLearningResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Français");
  
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

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setLearningResult("");
    
    try {
      if (learningMode === 'summary') {
        const result = await generateSummary(inputText, selectedLang);
        setLearningResult(result);
      } else if (learningMode === 'quiz') {
        const result = await generateQuiz(inputText, selectedLang);
        setLearningResult(result);
      } else if (learningMode === 'mindmap') {
        const result = await generateMindMap(inputText, selectedLang);
        setLearningResult(result);
      } else {
        setLearningResult("Cette fonctionnalité (Création de Présentations) sera implémentée via un micro-service Python !");
      }
    } catch (error) {
      setLearningResult("Erreur de connexion à l'IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Navigation de l'Architecte (Only show if not in hub) */}
      {mainView !== 'hub' && (
      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMainView('hub')}
              className="p-2 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition shadow-lg mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className={`p-2 rounded-xl shadow-lg ${mainView === 'dyslexia' ? 'bg-blue-600 shadow-blue-950/20' : 'bg-orange-600 shadow-orange-950/20'}`}>
              {mainView === 'dyslexia' ? <Mic className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mount AI<span className={mainView === 'dyslexia' ? 'text-blue-500' : 'text-orange-500'}>: Scholar</span></h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{mainView === 'dyslexia' ? 'Windows Voice Core' : 'Global Learning Engine'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono">
            {mainView === 'dyslexia' && (
              <div className={`hidden lg:flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800`}>
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
                <span className={isRecording ? 'text-red-400' : 'text-slate-500'}>
                  {isRecording ? 'ML_ENGINE_ACTIVE' : 'READY_TO_BOOT'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      <main className={`max-w-7xl mx-auto px-6 ${mainView === 'hub' ? 'py-20' : 'py-12'}`}>
        {mainView === 'hub' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-slate-900 border border-slate-800 mb-4 shadow-2xl">
                 <BrainCircuit className="w-12 h-12 text-blue-500" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">Mount AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-orange-500">Scholar</span></h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">Choisis ton environnement d'exécution principal.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <button 
                onClick={() => setMainView('dyslexia')}
                className="group relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 hover:border-blue-500/50 transition-all duration-500 text-left flex flex-col h-full shadow-xl hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                  <BrainCircuit className="w-48 h-48 text-blue-500" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-8">
                  <Mic className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Mode Dyslexie</h2>
                <p className="text-slate-400 leading-relaxed text-lg flex-1">
                  Reconnaissance phonémique en temps réel. Analyse vocale et simulation de projection spatiale AR pour aider au décodage lecture/voix.
                </p>
                <div className="mt-8 flex items-center gap-2 text-blue-500 font-bold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform">
                  Démarrer Pipeline IA <Sparkles className="w-4 h-4 ml-2" />
                </div>
              </button>

              <button 
                onClick={() => setMainView('learning')}
                className="group relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 hover:border-orange-500/50 transition-all duration-500 text-left flex flex-col h-full shadow-xl hover:shadow-[0_0_50px_rgba(249,115,22,0.15)] hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                  <BookOpen className="w-48 h-48 text-orange-500" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center mb-8">
                  <Layers className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Apprentissage Global</h2>
                <p className="text-slate-400 leading-relaxed text-lg flex-1">
                  Super-révisions multi-langues. Résumés intelligents, Quiz ludiques auto-générés, Cartes mentales et conception de présentations assistée par IA.
                </p>
                <div className="mt-8 flex items-center gap-2 text-orange-500 font-bold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform">
                  Démarrer Gemini Engine <Zap className="w-4 h-4 ml-2" />
                </div>
              </button>
            </div>
          </div>
        )}

        {mainView === 'dyslexia' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Panneau de gauche: Info & Stats Dyslexie */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-blue-500" /> Module Dyslexie
                </h3>
                <p className="text-sm text-slate-400">
                  Décodage phonémique en temps réel. Cette interface simule la vision ARKit de 2027 projetant les syllabes autour de l'utilisateur.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Performances ML</h3>
                <div className="space-y-3">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Latence (Inference)</p>
                    <p className="text-xl font-mono font-bold text-blue-500">14<span className="text-xs ml-1">ms</span></p>
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
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-30 mix-blend-screen group-hover:scale-105 transition-transform duration-[2000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50 z-10" />
                
                {/* AR Elements - HUD */}
                <div className="absolute inset-0 z-20 p-8 pointer-events-none">
                  <div className="flex justify-between items-start">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                      <Target className="w-4 h-4 text-blue-500 animate-pulse" />
                      <div>
                        <p className="text-[10px] font-mono font-bold tracking-tighter text-white">TRACKING_STATUS: LOCKED</p>
                        <p className="text-[8px] font-mono text-slate-400">FPS: 60 | AR_V: 2.1</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-2/3" />
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
                          className="min-w-[4rem] h-16 px-4 bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-in fade-in zoom-in duration-300"
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
                        <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
                        <Volume2 className="w-10 h-10 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2 italic">Prêt pour l'Analyse ?</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">Active le micro pour séparer les phonèmes en temps réel pour l'aide à la dyslexie.</p>
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
                        className={`w-1 rounded-full transition-all duration-75 ${isRecording ? 'bg-blue-500' : 'bg-slate-700'}`}
                        style={{ height: `${Math.max(10, v)}%`, opacity: 0.2 + (v/100) }}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right lg:block hidden">
                       <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Engine Process</p>
                       <p className="text-xs font-bold text-blue-500 tracking-widest">{isRecording ? 'SYNCING...' : 'STANDBY'}</p>
                    </div>
                    <button 
                      onClick={toggleRecording}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${isRecording ? 'bg-red-500 hover:bg-red-600 ring-8 ring-red-500/10' : 'bg-blue-600 hover:bg-blue-500 ring-8 ring-blue-500/10 active:scale-90 scale-110'}`}
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
                    <div className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                      <FileText className="w-3 h-3 text-blue-500" />
                    </div>
                    Transcription Intelligence
                  </h3>
                  {isRecording && (
                    <div className="px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-lg animate-pulse">LIVE</div>
                  )}
                </div>
                <div className="min-h-[120px] bg-slate-950 p-8 rounded-3xl border border-slate-800/50 relative group">
                  <p className={`text-xl font-medium leading-relaxed transition-colors duration-500 ${isRecording ? 'text-slate-100' : 'text-slate-500'}`}>
                    {transcript || (
                      <span className="font-light italic tracking-tight">
                        Le moteur de reconnaissance vocale attend...
                      </span>
                    )}
                  </p>
                  <Sparkles className="absolute bottom-4 right-4 w-5 h-5 text-blue-500/30 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            </section>

            {/* Panneau de droite: Logs & Architecture */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col h-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Flux Machine Learning</h3>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="flex-1 space-y-3 font-mono text-[10px] overflow-y-auto max-h-[600px] pr-2 scrollbar-hide">
                  <div className="flex gap-2 text-slate-600 py-1 border-b border-slate-800/50">
                    <span className="text-emerald-500">[OK]</span>
                    <span>HW_ACCEL: Python ML Backend (Simulated)</span>
                  </div>
                  <div className="flex gap-2 text-slate-600 py-1 border-b border-slate-800/50">
                    <span className="text-blue-500">[LOG]</span>
                    <span>Model v2.4 initialized for Web Preview</span>
                  </div>
                  {isRecording && (
                    <>
                      <div className="flex gap-2 text-blue-500 py-1 border-b border-slate-800/50 animate-pulse">
                        <span>[BS]</span>
                        <span>Buffer: 2048 Samples</span>
                      </div>
                      <div className="flex flex-col gap-1 text-white bg-slate-950 p-2 rounded-lg mt-2 border border-slate-800">
                        <span className="text-slate-500">PHONEME_DET:</span>
                        <span className="text-sm font-bold text-blue-400">{detectedPhonemes[0] || '---'}</span>
                      </div>
                    </>
                  )}
                  <div className="text-slate-700 py-4 text-center border-t border-slate-800 mt-4 italic">
                    Logs système en attente...
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
        {mainView === 'learning' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Mode Apprentissage Menu */}
             <aside className="lg:col-span-1 space-y-6">
               <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-sm">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <BookOpen className="w-4 h-4 text-orange-500" /> Apprentissage Global
                 </h3>
                 <div className="space-y-3">
                    {[
                      { id: 'summary', label: 'Résumés Vocaux', icon: <FileText className="w-4 h-4" /> },
                      { id: 'quiz', label: 'Quiz Fun & Exos', icon: <Gamepad2 className="w-4 h-4" /> },
                      { id: 'mindmap', label: 'Cartes Mentales', icon: <Network className="w-4 h-4" /> },
                      { id: 'presentation', label: 'Présentations', icon: <Presentation className="w-4 h-4" /> },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setLearningMode(m.id as any);
                          setLearningResult("");
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${learningMode === m.id ? 'bg-orange-600 border-orange-500 text-white shadow-xl shadow-orange-900/20 translate-x-2' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:translate-x-1'}`}
                      >
                        <div className="flex items-center gap-3">
                          {m.icon}
                          <span className="text-sm font-bold tracking-tight">{m.label}</span>
                        </div>
                      </button>
                    ))}
                 </div>
               </div>
             </aside>

             <section className="lg:col-span-3 space-y-6">
                {/* AI Input Area */}
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl flex flex-col gap-6">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                       {learningMode === 'summary' && <><FileText className="text-orange-500"/> Intelligence de Synthèse</>}
                       {learningMode === 'quiz' && <><Gamepad2 className="text-purple-500"/> Générateur de Quiz</>}
                       {learningMode === 'mindmap' && <><Network className="text-pink-500"/> Cartes Mentales (Mermaid.js)</>}
                       {learningMode === 'presentation' && <><Presentation className="text-indigo-500"/> Mode Présentation</>}
                     </h2>
                     {learningMode !== 'presentation' && (
                       <select 
                         className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2"
                         value={selectedLang}
                         onChange={(e) => setSelectedLang(e.target.value)}
                       >
                          <option>Français</option>
                          <option>Anglais</option>
                          <option>Arabe</option>
                          <option>Espagnol</option>
                          <option>Allemand</option>
                       </select>
                     )}
                   </div>
                   
                   <textarea 
                     rows={5}
                     className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-300 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none outline-none"
                     placeholder="Colle ton cours, ton texte ou tes notes ici pour que l'IA puisse travailler dessus..."
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                   />
                   
                   <div className="flex justify-end">
                     <button 
                       onClick={handleGenerate}
                       disabled={isGenerating || !inputText}
                       className="px-8 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 rounded-xl text-white font-bold flex items-center gap-3 transition-colors"
                     >
                       {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                       Générer
                     </button>
                   </div>
                </div>

                {/* AI Result Area */}
                {(learningResult || isGenerating) && (
                  <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 p-8 shadow-inner min-h-[300px]">
                    {isGenerating ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 space-y-4">
                        <div className="relative">
                           <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                           <Sparkles className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <p className="font-mono text-sm uppercase tracking-widest text-orange-500/70">Traitement Neural en cours...</p>
                      </div>
                    ) : learningMode === 'mindmap' ? (
                      <div className="w-full bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                        <Mermaid chart={learningResult} />
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-orange max-w-none text-slate-300">
                        <div className="markdown-body">
                          <Markdown>{learningResult}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </section>
          </div>
        )}
      </main>

      {/* Credits & Tech Talk */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 flex flex-col md:flex-row items-center gap-8 justify-between opacity-80">
        <div className="flex items-center gap-4">
           <p className="text-xs text-slate-500 font-medium">DESIGNED BY COACH ARCHITECT FOR CAPITAINE</p>
           <div className="w-1 h-1 bg-slate-800 rounded-full" />
           <p className="text-xs text-slate-600 font-mono">0xDEADBEEF / SECURE_LAYER</p>
        </div>
        <div className="flex gap-4">
          <button className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest">Python/ML Source Code</button>
        </div>
      </footer>
    </div>
  );
}
