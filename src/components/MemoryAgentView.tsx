import React, { useState, useEffect } from 'react';
import { BrainCircuit, Activity, Sparkles, Loader2, Play, CheckCircle2, AlertTriangle, ChevronRight, RefreshCw, Layers } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  weight: number; // 0 to 1
  category: "Graphemic" | "Phonological" | "Focus";
  cx: number;
  cy: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface MemoryData {
  nodes: Node[];
  links: Link[];
  fatigueScore: number;
  predictedBlockage: string;
  customExercise: string;
}

interface MemoryAgentViewProps {
  user: any;
  currentMissed: string[];
  history: any[];
  onInjectCustomExercise: (text: string) => void;
}

export default function MemoryAgentView({
  user,
  currentMissed,
  history,
  onInjectCustomExercise
}: MemoryAgentViewProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | 'Graphemic' | 'Phonological' | 'Focus'>('All');

  // Trigger Sovereign Semantic Memory Graph update
  const fetchMemoryGraph = async (forcedNodeContext?: string) => {
    setIsLoading(true);
    setGenerationFeedback(null);
    try {
      // Collect common letter inversions based on missed words if none provided
      const detectedInversions: string[] = [];
      const missedStr = currentMissed.join(" ").toLowerCase();
      if (/[bd]/.test(missedStr)) detectedInversions.push("b/d");
      if (/[pq]/.test(missedStr)) detectedInversions.push("p/q");
      if (/[sz]/.test(missedStr) || missedStr.includes("ch")) detectedInversions.push("s/ch/j");

      const res = await fetch("/api/sovereign-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMissed: forcedNodeContext ? [forcedNodeContext] : currentMissed,
          currentInversions: detectedInversions,
          history: history.map(h => ({ accuracy: h.accuracy, title: h.title }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Match nodes with beautiful static SVG layout dimensions
        const nodePositions: Record<string, { cx: number; cy: number }> = {
          "graphemic-bd": { cx: 120, cy: 90 },
          "graphemic-pq": { cx: 280, cy: 90 },
          "phoneme-nasal": { cx: 340, cy: 200 },
          "phoneme-fricative": { cx: 280, cy: 310 },
          "glides-liquids": { cx: 120, cy: 310 },
          "neural-retention": { cx: 200, cy: 200 }
        };

        const updatedNodes = data.nodes.map((node: any) => ({
          ...node,
          cx: nodePositions[node.id]?.cx || 200,
          cy: nodePositions[node.id]?.cy || 200
        }));

        setMemoryData({
          ...data,
          nodes: updatedNodes
        });

        // Set the active node to high-fatigue node
        if (updatedNodes.length > 0) {
          const highNode = updatedNodes.reduce((prev: any, curr: any) => prev.weight > curr.weight ? prev : curr);
          setActiveNode(highNode);
        }
      } else {
        setGenerationFeedback("⚠️ Impossible de contacter le serveur de diagnostic cognitif. Repli local actif.");
      }
    } catch (e) {
      console.error(e);
      setGenerationFeedback("⚠️ Erreur de réseau temporaire dans l'analyse de mémoire neuronale.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoryGraph();
  }, [currentMissed, history]);

  if (!memoryData) {
    return (
      <div className="p-12 text-center bg-[#121626]/80 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#8b5cf6] animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-400">Construction du Graphe de Mémoire Sémantique Souverain...</p>
      </div>
    );
  }

  // Node color helper
  const getNodeColorClass = (weight: number) => {
    if (weight >= 0.7) return { border: 'border-orange-500', bg: 'bg-orange-500/10 hover:bg-orange-500/20', text: 'text-orange-400', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]' };
    if (weight >= 0.4) return { border: 'border-[#8b5cf6]', bg: 'bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20', text: 'text-[#c084fc]', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.2)]' };
    return { border: 'border-emerald-500', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' };
  };

  // Filtered nodes
  const filteredNodes = memoryData.nodes.filter(n => 
    selectedCategoryFilter === 'All' ? true : n.category === selectedCategoryFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      
      {/* Intro Bannière */}
      <div className="p-6 bg-gradient-to-r from-[#121626] to-[#0d101d] border border-white/5 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#8b5cf6]/10 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#a855f7] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-wider">Tuteur Cognitif Adaptatif — MemoryAgent 🇲🇦</h4>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 block">
              Moteur de rééducation prédictive propulsé par la <span className="text-[#a855f7] font-black">Sovereign API (Google Gemini Core)</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => fetchMemoryGraph()}
          disabled={isLoading}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[10px] font-bold uppercase rounded-xl transition-all flex items-center gap-2 whitespace-nowrap self-start md:self-auto shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser la Mémoire
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* COL 1: Le Graphe de Mémoire Sémantique SVG Animé */}
        <div className="xl:col-span-7 bg-[#121626]/80 border border-white/5 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl aspect-square md:aspect-[4/3] xl:aspect-auto">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#ff4e00]" /> Graphe de Mémoire Sémantique
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Visualisation vectorielle en temps réel de votre fatigue nerveuse locale</p>
              </div>
              <div className="flex bg-black/40 border border-white/5 rounded-lg p-0.5 text-[9px] font-mono text-slate-400">
                {(['All', 'Graphemic', 'Phonological', 'Focus'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategoryFilter(c)}
                    className={`px-2.5 py-1 rounded-md transition-all ${selectedCategoryFilter === c ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#c084fc]' : 'hover:text-white'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative w-full aspect-square md:aspect-[4/3] bg-black/35 rounded-[1.8rem] border border-white/5 overflow-hidden shadow-inner flex items-center justify-center p-2">
              <svg viewBox="0 0 400 400" className="w-full h-full max-w-[340px] md:max-w-none">
                <defs>
                  {/* Glowing filter for lines */}
                  <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Dot patterns */}
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Draw Links/Edges */}
                {memoryData.links.map((link, idx) => {
                  const srcNode = memoryData.nodes.find(n => n.id === link.source);
                  const tgtNode = memoryData.nodes.find(n => n.id === link.target);
                  if (!srcNode || !tgtNode) return null;

                  const isHighImpact = srcNode.weight > 0.6 || tgtNode.weight > 0.6;
                  const strokeColor = isHighImpact ? 'rgba(249,115,22,0.4)' : 'rgba(139,92,246,0.3)';
                  const glowFilter = isHighImpact ? 'url(#glow-orange)' : 'url(#glow-purple)';

                  return (
                    <g key={idx}>
                      <line
                        x1={srcNode.cx}
                        y1={srcNode.cy}
                        x2={tgtNode.cx}
                        y2={tgtNode.cy}
                        stroke={strokeColor}
                        strokeWidth={isHighImpact ? 3 : 2}
                        filter={glowFilter}
                        strokeDasharray={isHighImpact ? "4,4" : "none"}
                        className={isHighImpact ? "animate-[dash_10s_linear_infinite]" : ""}
                      />
                      {/* Flow particle */}
                      <circle r="2.5" fill={isHighImpact ? "#ff4e00" : "#a855f7"}>
                        <animateMotion
                          path={`M ${srcNode.cx},${srcNode.cy} L ${tgtNode.cx},${tgtNode.cy}`}
                          dur={`${4 - link.value}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  );
                })}

                {/* Draw Nodes */}
                {memoryData.nodes.map((node) => {
                  const colors = getNodeColorClass(node.weight);
                  const isFilteredOut = selectedCategoryFilter !== 'All' && node.category !== selectedCategoryFilter;
                  const isActive = activeNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setActiveNode(node)}
                      className={`cursor-pointer group transition-all duration-300 ${isFilteredOut ? 'opacity-20' : 'opacity-100'}`}
                    >
                      {/* Ripple pulsing animation for high hotspots */}
                      {node.weight >= 0.7 && (
                        <circle
                          cx={node.cx}
                          cy={node.cy}
                          r={isActive ? 25 : 20}
                          fill="none"
                          stroke="rgba(249,115,22,0.4)"
                          strokeWidth="2"
                        >
                          <animate attributeName="r" values="16;32;16" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={isActive ? 16 : 12}
                        fill={node.weight >= 0.7 ? "rgba(249,115,22,0.25)" : (node.weight >= 0.4 ? "rgba(139,92,246,0.25)" : "rgba(16,185,129,0.25)")}
                        stroke={node.weight >= 0.7 ? "#f97316" : (node.weight >= 0.4 ? "#a855f7" : "#10b981")}
                        strokeWidth={isActive ? 4 : 2}
                        className="transition-all duration-300"
                      />

                      {/* Node label backdrop to ensure legible overlapping text */}
                      <rect
                        x={node.cx - 50}
                        y={node.cy + (isActive ? 20 : 16)}
                        width={100}
                        height={14}
                        rx="4"
                        fill="rgba(7,9,15,0.75)"
                        className="pointer-events-none"
                      />

                      {/* Node Label text */}
                      <text
                        x={node.cx}
                        y={node.cy + (isActive ? 30 : 26)}
                        textAnchor="middle"
                        fill={isActive ? "#ffffff" : "#94a3b8"}
                        fontSize="7"
                        fontWeight={isActive ? "bold" : "normal"}
                        className="font-mono uppercase tracking-wider select-none pointer-events-none"
                      >
                        {node.id.replace("graphemic-", "").replace("phoneme-", "").toUpperCase()}
                      </text>

                      {/* Display weight inside node on hover */}
                      <text
                        x={node.cx}
                        y={node.cy + 2.5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="6"
                        fontWeight="black"
                        className="font-mono pointer-events-none"
                      >
                        {Math.round(node.weight * 100)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-slate-500 font-mono italic leading-relaxed text-center">
            💡 Conseil : Clique sur un nœud du réseau neuronal pour analyser son pourcentage de blocage et générer un exercice ciblé !
          </p>
        </div>

        {/* COL 2: Les Métriques d'Analyse et de Fatigue & Moteur d'Exercice Souverain */}
        <div className="xl:col-span-5 flex flex-col gap-6">

          {/* Stat de fatigue prédictive */}
          <div className="p-6 bg-[#121626]/80 border border-white/5 rounded-[2.5rem] space-y-4 backdrop-blur-md">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white border-b border-white/5 pb-3">Statut de Fatigue Cognitive</h4>
            
            <div className="flex items-center gap-6">
              {/* Circular Gauge */}
              <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke={memoryData.fatigueScore >= 70 ? "#ef4444" : (memoryData.fatigueScore >= 45 ? "#f97316" : "#10b981")}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - memoryData.fatigueScore / 100)}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-xl font-bold text-white">{memoryData.fatigueScore}</span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">FATIGUE</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <p className="text-sm font-bold text-white uppercase tracking-wide">
                  {memoryData.fatigueScore >= 70 ? '⚠️ Alerte Surcharge Cognitive' : (memoryData.fatigueScore >= 45 ? '⚡ Fatigue Réceptive Modérée' : '✨ Stabilité Attentionnelle Haute')}
                </p>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  Basé sur {history.length} entraînements récents et l'index de confusion des phonèmes.
                </p>
              </div>
            </div>

            {/* Diagnostic Box */}
            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${memoryData.fatigueScore >= 60 ? 'text-orange-400' : 'text-slate-500'}`} />
              <div className="text-sm font-sans text-slate-300">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block mb-1">Prédiction de Blocage :</span>
                {memoryData.predictedBlockage}
              </div>
            </div>
          </div>

          {/* Node Inspecteur & Workout Sovereign Builder */}
          <div className="p-6 bg-[#121626]/80 border border-white/5 rounded-[2.5rem] flex-1 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-[#a855f7] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" /> Focus : Nœud de Rééducation
                </span>
                {activeNode && (
                  <span className="text-[10px] bg-white/5 border border-white/5 text-purple-300 font-mono px-2 py-0.5 rounded uppercase">
                    {activeNode.category}
                  </span>
                )}
              </div>

              {activeNode ? (
                <div className="space-y-4 text-left">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-black text-white">{activeNode.label}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Coefficient de friction neuronale : {activeNode.weight}</p>
                    </div>
                    <span className={`text-2xl font-mono font-black ${getNodeColorClass(activeNode.weight).text}`}>
                      {Math.round(activeNode.weight * 100)}%
                    </span>
                  </div>

                  {/* Weight bar progress */}
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#f97316] rounded-full transition-all duration-500"
                      style={{ width: `${activeNode.weight * 100}%` }}
                    />
                  </div>

                  {/* Exercise Container heading */}
                  <div className="space-y-2 mt-4">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block font-bold">Exercice Généré par l'Agent Souverain :</span>
                    <div className="p-4 bg-black/60 border border-white/10 rounded-2xl">
                      <p className="text-sm font-medium text-white italic leading-relaxed">
                        "{memoryData.customExercise}"
                      </p>
                    </div>
                  </div>

                  {generationFeedback && (
                    <p className="text-[11px] font-mono text-[#ff4e00]">{generationFeedback}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 font-mono text-xs">
                  Aucun nœud sélectionné. Cliquez sur un point du graphe.
                </div>
              )}
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  if (memoryData?.customExercise) {
                    onInjectCustomExercise(memoryData.customExercise);
                  }
                }}
                disabled={!memoryData?.customExercise}
                className="w-full py-4.5 bg-gradient-to-r from-[#8b5cf6] to-[#ff4e00] hover:scale-[1.01] text-white font-black uppercase text-[10px] tracking-[0.2em] transition-all rounded-xl border border-white/15 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
              >
                <Play className="w-4 h-4 fill-current text-white" /> Injecter comme Phrase Active de l'Arène
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
