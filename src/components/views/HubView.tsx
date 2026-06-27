import React from 'react';
import { BrainCircuit, BookOpen, Network, Mic, Layers, Activity, Apple, Sparkles, Shield, Rocket, Brain, Eye } from 'lucide-react';
import { MainViewType } from '../../types';
import scholarIcon from '../../assets/images/mount_ai_scholar_distinct_1779635328156.png';

interface HubViewProps {
  setMainView: (view: MainViewType) => void;
}

export default function HubView({ setMainView }: HubViewProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center space-y-6 relative flex flex-col items-center">
        <div className="px-4 py-1.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.15)] mb-4 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
          <span className="text-[10px] font-mono font-black text-[#8b5cf3] uppercase tracking-[0.2em]">Stealth EdTech Startup</span>
        </div>
        <div className="w-28 h-28 glass-panel rounded-3xl flex items-center justify-center mb-2 shadow-[0_0_50px_rgba(139,92,246,0.3)] backdrop-blur-xl hover:-translate-y-1 transition duration-500 overflow-hidden border border-[#8b5cf6]/30">
            <img src={scholarIcon} alt="Mount AI" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white relative z-10 drop-shadow-sm">
          Mount AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ff4e00]">Scholar</span>
        </h1>
        <p className="text-lg font-medium text-white/50 max-w-xl mx-auto mt-6 relative z-10">
          Moteur d'exécution local et asynchrone autonome conçu par notre startup de pointe pour révolutionner l'accessibilité cognitive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10 mt-6">
        <button 
          onClick={() => setMainView('dyslexia')}
          className="group glass-panel rounded-[2.5rem] p-8 hover:bg-white/5 border border-white/10 transition-all duration-300 text-left flex flex-col h-72 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <Eye className="w-32 h-32 text-[#3b82f6]" />
          </div>
          <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6 text-[#3b82f6]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Réalignement Cognitif</h2>
          <p className="text-white/50 text-sm leading-relaxed flex-1">
            Moteur de calibration saccadique d'attention, synesthésie graphémique et stabilisateurs miroirs spatiaux à base-lourde.
          </p>
        </button>

        <button 
          onClick={() => setMainView('learning')}
          className="group glass-panel rounded-[2.5rem] p-8 hover:bg-white/5 border border-white/10 transition-all duration-300 text-left flex flex-col h-72 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <BookOpen className="w-32 h-32 text-[#ff4e00]" />
          </div>
          <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6 text-[#ff4e00]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Intelligence Cognitive</h2>
          <p className="text-white/50 text-sm leading-relaxed flex-1">
            Extraction sémantique et synthèse structurée par LLM (Gemini Ultra/Pro).
          </p>
        </button>

        <button 
          onClick={() => setMainView('architecture')}
          className="group glass-panel rounded-[2.5rem] p-8 hover:bg-white/5 border border-white/10 transition-all duration-300 text-left flex flex-col h-72 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <Network className="w-32 h-32 text-[#00FF00]" />
          </div>
          <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6 text-[#00FF00]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Faisabilité & Fiabilité</h2>
          <p className="text-white/50 text-sm leading-relaxed flex-1">
            Architecture structurée et scalabilité du projet (Performances & Sécurité).
          </p>
        </button>

        <button 
          onClick={() => setMainView('gtm')}
          className="group glass-panel rounded-[2.5rem] p-8 hover:bg-white/5 border border-violet-500/30 hover:border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.06)] transition-all duration-300 text-left flex flex-col h-72 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <Rocket className="w-32 h-32 text-violet-500" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Rocket className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
            GTM & Launch Playbook 
            <span className="px-2 py-0.5 bg-violet-500/20 border border-violet-500/40 rounded text-[9px] font-mono text-violet-300 font-bold tracking-widest uppercase">Elite Growth</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed flex-1">
            Simulateur de distribution de pointe. Élaborez des stratégies de lancement virales réelles pour propulser votre produit (Hacker News, Product Hunt, Devpost, GitHub Open-Source).
          </p>
        </button>
      </div>
    </div>
  );
}
