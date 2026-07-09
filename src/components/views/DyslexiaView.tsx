import React, { useRef, useState, useEffect } from 'react';
import { 
  Mic, Globe, LogIn, LogOut, Brain, Sparkles, CheckCircle2, 
  AlertTriangle, ArrowRight, RotateCcw, Volume2, VolumeX, 
  Play, Pause, X, Target, FileText, Headphones, Zap, GraduationCap, 
  Layers, Activity, BrainCircuit, Eye, Sliders, HelpCircle, ArrowLeftRight, RefreshCw
} from 'lucide-react';
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
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  langMap: Record<string, string>;
  speakText: (text: string) => Promise<void>;
  handleUrlOrManualEdgeInput: (text: string) => Promise<void>;
  isAnalyzingEdge: boolean;
  edgePerformanceMs: number;
  injectedExercise?: string;
}

// Preset texts for Saccadic Trainer
const PRESET_READING_TEXTS = [
  {
    title: "🔬 Exploration de l'Espace (Niveau Moyen)",
    lang: "French",
    text: "Le télescope spatial Hubble a capturé des images d'une galaxie spirale lointaine. Les astronomes étudient la naissance des étoiles dans ces nuages de gaz cosmiques géants pour comprendre les secrets de la création de notre propre univers."
  },
  {
    title: "🦁 La Fable du Lion (Niveau Facile)",
    lang: "French",
    text: "Un tout petit rat sauva un grand lion fatigué qui était prisonnier d'un filet de corde solide. Le lion comprit alors que même les plus petits amis peuvent s'avérer être d'une aide précieuse."
  },
  {
    title: "🌌 Quantum Physics (Advanced)",
    lang: "English",
    text: "Quantum mechanics dictates that subatomic particles exist in multiple probability states simultaneously until observed. This superposition collapse represents the fundamental frontier of modern computing architectures."
  }
];

export default function DyslexiaView({
  selectedLang, setSelectedLang,
  isRecording, toggleRecording,
  transcript, detectedPhonemes, audioData, speechError,
  user, loginWithGoogle, logout, langMap,
  speakText, handleUrlOrManualEdgeInput, isAnalyzingEdge, edgePerformanceMs,
  injectedExercise
}: DyslexiaViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active module switcher: 'saccadic' vs 'synesthesia' vs 'spatial-mirror'
  const [activeModule, setActiveModule] = useState<'saccadic' | 'synesthesia' | 'spatial-mirror'>('saccadic');

  // --- NOISE-ROBUST SIMPLIFICATION STATES ---
  const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [denoisedText, setDenoisedText] = useState('');
  const [simplifiedText, setSimplifiedText] = useState('');
  const [simpleWordsMapping, setSimpleWordsMapping] = useState<Array<{ difficult: string; simple: string }>>([]);

  const handleSimplifyNoisyText = async (textToSimplify: string) => {
    if (!textToSimplify.trim()) return;
    setIsSimplifying(true);
    try {
      const res = await fetch('/api/simplify-noisy-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSimplify, noiseLevel })
      });
      if (res.ok) {
        const data = await res.json();
        setDenoisedText(data.denoisedText || textToSimplify);
        setSimplifiedText(data.simplifiedText || textToSimplify);
        setSimpleWordsMapping(data.simpleWordsMapping || []);
      }
    } catch (err) {
      console.error("Error simplifying noisy text:", err);
    } finally {
      setIsSimplifying(false);
    }
  };

  // --- MODULE 1: SACCADIC TRAINER STATES ---
  const [readingText, setReadingText] = useState(PRESET_READING_TEXTS[0].text);

  useEffect(() => {
    if (injectedExercise) {
      setReadingText(injectedExercise);
    }
  }, [injectedExercise]);
  const [wpm, setWpm] = useState(120);
  const [isPlayingSaccade, setIsPlayingSaccade] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isolationFactor, setIsolationFactor] = useState(70); // Opacity reduction of surrounding text (0 to 100)
  const [saccadeStyle, setSaccadeStyle] = useState<'halo' | 'bionic' | 'curtain'>('halo');
  const [isAudioPacing, setIsAudioPacing] = useState(true);

  // Split reading text into words
  const words = readingText.split(/\s+/).filter(Boolean);

  // Web Audio Context for spatial sound pacers and letter-mirror frequency bursts
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Play a soft pacer tick
  const playPacerTick = (freq = 200, duration = 0.05, pan = 0) => {
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      // Pan audio
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, ctx.currentTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context failed to play pacer tick:", e);
    }
  };

  // Saccadic autopilot loop
  useEffect(() => {
    let timer: any = null;
    if (isPlayingSaccade) {
      const intervalMs = (60 * 1000) / wpm;
      timer = setInterval(() => {
        setActiveWordIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= words.length) {
            setIsPlayingSaccade(false);
            return 0;
          }
          // Play rhythmic tick sound to anchor visual jumps
          if (isAudioPacing) {
            const stereoPan = ((nextIndex / (words.length - 1)) * 2) - 1; // Pan sound from Left to Right as reading progresses
            playPacerTick(240, 0.06, stereoPan);
          }
          return nextIndex;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingSaccade, wpm, words.length, isAudioPacing]);

  // Handle Preset Selection
  const handlePresetText = (preset: typeof PRESET_READING_TEXTS[0]) => {
    setReadingText(preset.text);
    setActiveWordIndex(0);
    setIsPlayingSaccade(false);
  };

  const [manualInput, setManualInput] = useState("");

  // --- MODULE 2: GRAPHEME SYNESTHESIA STATES ---
  const [synInput, setSynInput] = useState("L'ordinateur de l'école est fantastique.");
  const [hoveredGrapheme, setHoveredGrapheme] = useState<{ grapheme: string; ipa: string; description: string } | null>(null);
  const [pulseActive, setPulseActive] = useState(false);

  // List of typical French graphemes (complex spelling groups)
  const FRENCH_GRAPHEMES = [
    { target: "eau", ipa: "/o/", color: "from-fuchsia-500 to-pink-500", desc: "Forme le son 'O' fermé (ex: chapeau, eau)." },
    { target: "au", ipa: "/o/", color: "from-pink-500 to-rose-500", desc: "Forme également le son 'O' (ex: jaune, chaud)." },
    { target: "oi", ipa: "/wa/", color: "from-amber-400 to-orange-500", desc: "Forme la diphtongue 'OUA' (ex: oiseau, roi)." },
    { target: "ai", ipa: "/ɛ/", color: "from-emerald-400 to-teal-500", desc: "Forme le son 'È' ouvert (ex: maison, pain)." },
    { target: "ei", ipa: "/ɛ/", color: "from-teal-400 to-cyan-500", desc: "Forme également le son 'È' (ex: neige, reine)." },
    { target: "ou", ipa: "/u/", color: "from-blue-500 to-indigo-500", desc: "Forme le son vocalique 'OU' (ex: loup, route)." },
    { target: "on", ipa: "/ɔ̃/", color: "from-indigo-500 to-violet-500", desc: "Son nasal rond 'ON' (ex: ballon, maison)." },
    { target: "an", ipa: "/ɑ̃/", color: "from-violet-500 to-purple-500", desc: "Son nasal ouvert 'AN' (ex: maman, volcan)." },
    { target: "en", ipa: "/ɑ̃/", color: "from-purple-500 to-pink-500", desc: "Son nasal identique à 'AN' (ex: vent, enfant)." },
    { target: "in", ipa: "/ɛ̃/", color: "from-yellow-400 to-amber-500", desc: "Son nasal pincé 'IN' (ex: sapin, lapin)." },
    { target: "ch", ipa: "/ʃ/", color: "from-red-500 to-orange-500", desc: "Consonne fricative post-alvéolaire 'CH' (ex: chat, chemin)." },
    { target: "ph", ipa: "/f/", color: "from-indigo-400 to-sky-500", desc: "Se prononce 'F' d'origine grecque (ex: photo, phare)." },
    { target: "gn", ipa: "/ɲ/", color: "from-rose-400 to-red-500", desc: "Consonne nasale palatale 'GNE' (ex: montagne, agneau)." },
    { target: "eu", ipa: "/ø/", color: "from-cyan-500 to-teal-500", desc: "Son 'EU' fermé ou ouvert (ex: feu, bleu)." },
    { target: "eur", ipa: "/œʁ/", color: "from-emerald-500 to-green-500", desc: "Suffixe commun vibrant (ex: ordinateur, fleurs)." },
    { target: "ng", ipa: "/ŋ/", color: "from-violet-400 to-indigo-600", desc: "Import d'origine étrangère nasale (ex: bilingue, parking)." }
  ];

  // Helper to parse input text into graphemic segments
  const parseTextToGraphemes = (text: string) => {
    // We parse the word sequentially, checking for grapheme overlaps
    let result: Array<{ text: string; isGrapheme: boolean; info?: typeof FRENCH_GRAPHEMES[0] }> = [];
    let i = 0;
    while (i < text.length) {
      let matched = false;
      // Try to match longest graphemes first
      const subString = text.substring(i);
      for (const g of FRENCH_GRAPHEMES) {
        if (subString.toLowerCase().startsWith(g.target)) {
          result.push({
            text: text.substring(i, i + g.target.length),
            isGrapheme: true,
            info: g
          });
          i += g.target.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result.push({
          text: text[i],
          isGrapheme: false
        });
        i++;
      }
    }
    return result;
  };


  // --- MODULE 3: SPATIAL MIRROR STATES ---
  const [activeMirror, setActiveMirror] = useState<'b' | 'd' | 'p' | 'q'>('b');
  const [bottomGravity, setBottomGravity] = useState(8); // heavy grounding base thickness (0 to 16px)
  const [extrusionShadow, setExtrusionShadow] = useState(4); // 3D-like depth protrusion (0 to 12)
  const [isMirrorRotating, setIsMirrorRotating] = useState(false);

  // Trigger high-fidelity spatial panned sound for mirror letters
  const playSpatialMirrorSound = (letter: 'b' | 'd' | 'p' | 'q') => {
    // b & p point to the right -> Sound triggers on Right Ear (+0.8)
    // d & q point to the left -> Sound triggers on Left Ear (-0.8)
    let pan = 0;
    let baseFreq = 220;
    
    if (letter === 'b') { pan = 0.8; baseFreq = 220; }
    else if (letter === 'd') { pan = -0.8; baseFreq = 330; }
    else if (letter === 'p') { pan = 0.6; baseFreq = 160; }
    else if (letter === 'q') { pan = -0.6; baseFreq = 440; }

    // Play synthesized stereo-panned sound
    playPacerTick(baseFreq, 0.25, pan);
    // Complementary TTS feedback
    speakText(letter === 'b' ? 'b' : letter === 'd' ? 'd' : letter === 'p' ? 'p' : 'qu');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8 relative">
        <div className="absolute top-0 right-0 -translate-y-4 font-mono text-[9px] uppercase tracking-widest text-[#8b5cf6]/60">
          Mount AI Scholar - Dynamic Cognitive Retraining
        </div>
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-3">
            <Brain className="w-10 h-10 text-indigo-400 animate-pulse" />
            Réalignement <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Cognitif</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-xl font-medium mt-1.5 leading-relaxed">
            Moteur de réapprentissage sensoriel et calibration d'attention pour la dyslexie. Bye bye les simples phonèmes textuels, place à l'alignement neuro-sensoriel interactif.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Globe className="w-4 h-4 text-white/40" />
            </div>
            <select 
              className="bg-[#121626]/80 border border-white/5 text-white text-xs font-bold uppercase tracking-widest rounded-xl pl-10 pr-10 py-3.5 outline-none appearance-none focus:border-indigo-500/50 transition-all cursor-pointer shadow-lg text-center"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {Object.keys(langMap).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          
          {user && (
            <button 
              onClick={logout}
              className="flex items-center justify-center w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors text-white shadow-lg"
              title="Deconnexion"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* MODULE CHANGER TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0d101f]/90 p-1.5 rounded-2xl border border-white/5 shadow-2xl relative">
        <button
          onClick={() => { setActiveModule('saccadic'); setIsPlayingSaccade(false); }}
          className={`py-3 px-4 rounded-xl text-xs uppercase tracking-wider font-black transition-all flex items-center justify-center gap-2.5 ${
            activeModule === 'saccadic'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>1. Calibreur Saccadique</span>
        </button>

        <button
          onClick={() => { setActiveModule('synesthesia'); setIsPlayingSaccade(false); }}
          className={`py-3 px-4 rounded-xl text-xs uppercase tracking-wider font-black transition-all flex items-center justify-center gap-2.5 ${
            activeModule === 'synesthesia'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Synesthésie Graphémique</span>
        </button>

        <button
          onClick={() => { setActiveModule('spatial-mirror'); setIsPlayingSaccade(false); }}
          className={`py-3 px-4 rounded-xl text-xs uppercase tracking-wider font-black transition-all flex items-center justify-center gap-2.5 ${
            activeModule === 'spatial-mirror'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>3. Stabilisateur Miroir Spatial</span>
        </button>
      </div>

      {/* --- MODULE 1: CALIBREUR SACCADIQUE (SACCADIC & BIONIC GYM) --- */}
      {activeModule === 'saccadic' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10" ref={containerRef}>
          
          {/* Controls Panel (5 Columns) */}
          <div className="xl:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400 animate-pulse" />
                  Paramètres de Saccade
                </h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-wider mt-1">
                  Ajustez les contraintes d'entraînement visuel
                </p>
              </div>

              {/* SLIDERS & CONFIGS */}
              <div className="space-y-5">
                {/* WPM (Speed) Slider */}
                <div className="space-y-2 bg-[#06080f]/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-blue-400">
                    <span>Vitesse de lecture (WPM)</span>
                    <span className="font-mono text-white bg-blue-500/15 px-2 py-0.5 rounded">{wpm} WPM</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="400"
                    step="10"
                    value={wpm}
                    onChange={(e) => setWpm(Number(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>DYS Facile (60)</span>
                    <span>Standard (180)</span>
                    <span>Super-Power (400)</span>
                  </div>
                </div>

                {/* Isolation Factor Slider */}
                <div className="space-y-2 bg-[#06080f]/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <span>Masquage des mots adjacents</span>
                    <span className="font-mono text-white bg-indigo-500/15 px-2 py-0.5 rounded">{isolationFactor}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="95"
                    step="5"
                    value={isolationFactor}
                    onChange={(e) => setIsolationFactor(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Texte Complet (0%)</span>
                    <span>Isolé (50%)</span>
                    <span>Masquage Total (95%)</span>
                  </div>
                  <p className="text-[10px] text-slate-400/70 italic mt-1 font-sans leading-relaxed">
                    Baisse la visibilité du texte périphérique pour éviter l'effet de superposition des mots (crowding).
                  </p>
                </div>

                {/* Guide Style Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-indigo-400 font-bold uppercase tracking-wider block">Mode de Focalisation Visuelle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'halo', label: 'Halo Néon', desc: 'Focus lumineux' },
                      { key: 'bionic', label: 'Bionique Bold', desc: 'Premières lettres' },
                      { key: 'curtain', label: 'Rideau Seul', desc: 'Isoler un mot' }
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        onClick={() => setSaccadeStyle(mode.key as any)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                          saccadeStyle === mode.key
                            ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                            : 'bg-slate-900/40 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{mode.label}</span>
                        <span className="text-[9px] opacity-40 font-normal">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound Synchronizer Toggle */}
                <div className="flex items-center justify-between bg-[#06080f]/50 p-4 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block text-white">Métronome Audio Rythmique</span>
                    <span className="text-[10px] text-slate-500 font-sans">Joue un signal spatial synchronisé à chaque mot</span>
                  </div>
                  <button
                    onClick={() => { initAudioCtx(); setIsAudioPacing(!isAudioPacing); }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 outline-none ${
                      isAudioPacing ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                      isAudioPacing ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* PLAYBACK CONTROLS */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    initAudioCtx();
                    setIsPlayingSaccade(!isPlayingSaccade);
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                    isPlayingSaccade
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/20'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20'
                  }`}
                >
                  {isPlayingSaccade ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" /> Pause Autopilot
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" /> Lancer Autopilot
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveWordIndex(0);
                    setIsPlayingSaccade(false);
                    playPacerTick(180, 0.1);
                  }}
                  className="px-4 bg-slate-900 border border-white/5 hover:border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                  title="Réinitialiser la lecture"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRESETS */}
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Bibliothèque de textes d'entraînement
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_READING_TEXTS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetText(preset)}
                    className="p-3.5 rounded-xl text-left border border-white/5 bg-slate-900/30 text-xs hover:bg-white/5 hover:text-white transition-all flex justify-between items-center group font-sans"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block group-hover:text-white transition-colors">{preset.title}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">{preset.lang}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 group-hover:text-white transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Saccadic Display Stage (7 Columns) */}
          <div className="xl:col-span-7 space-y-6">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl bg-slate-950/40 space-y-6 relative overflow-hidden min-h-[450px] flex flex-col justify-between">
              
              {/* HUD METADATA BAR */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider text-blue-400">Focalisation Saccadique</span>
                </div>
                <div>
                  <span>MOT : {activeWordIndex + 1} / {words.length}</span>
                </div>
              </div>

              {/* READING CANVAS STAGE */}
              <div className="flex-1 flex items-center justify-center py-6">
                <div className="max-w-2xl leading-[2.5] text-left select-none relative z-10 font-sans">
                  {words.map((word, index) => {
                    const isActive = index === activeWordIndex;
                    
                    // Style attributes based on parameters
                    let styleClass = "";
                    let inlineStyles: React.CSSProperties = {};

                    if (isActive) {
                      if (saccadeStyle === 'halo') {
                        styleClass = "bg-blue-500/20 text-blue-100 border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.4)] px-2.5 py-1.5 rounded-xl scale-110 font-black relative z-20";
                      } else if (saccadeStyle === 'bionic') {
                        styleClass = "text-white relative z-20 font-black scale-105 border-b-2 border-indigo-400";
                      } else {
                        // curtain (pure isolated word)
                        styleClass = "bg-[#1d4ed8]/30 text-white font-black px-3 py-1 rounded-xl scale-110";
                      }
                    } else {
                      // inactive word style influenced by isolationFactor
                      const opacityVal = isActive ? 1 : Math.max(0.05, 1 - (isolationFactor / 100));
                      const blurVal = isActive ? 0 : (isolationFactor / 25);
                      
                      inlineStyles = {
                        opacity: opacityVal,
                        filter: saccadeStyle === 'curtain' && !isActive ? `blur(${blurVal}px) opacity(0.01)` : `blur(${blurVal / 2}px)`,
                        transition: 'opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease'
                      };
                      styleClass = "text-slate-400 font-medium px-1 cursor-pointer hover:text-slate-200";
                    }

                    return (
                      <span
                        key={index}
                        onClick={() => {
                          setActiveWordIndex(index);
                          playPacerTick(260, 0.05);
                        }}
                        className={`inline-block mx-1.5 transition-all duration-150 ${styleClass}`}
                        style={inlineStyles}
                      >
                        {isActive && saccadeStyle === 'bionic' ? (
                          <>
                            <span className="text-[#3b82f6] font-extrabold shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                              {word.substring(0, Math.ceil(word.length / 2))}
                            </span>
                            <span className="opacity-70 font-medium">
                              {word.substring(Math.ceil(word.length / 2))}
                            </span>
                          </>
                        ) : (
                          word
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC PROGRESS ACCENT BAR */}
              <div className="bg-[#0b0e17] rounded-2xl p-4 border border-white/5 flex items-center justify-between font-mono text-xs">
                <div className="flex-1 mr-4 bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-200 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                    style={{ width: `${((activeWordIndex + 1) / words.length) * 100}%` }}
                  />
                </div>
                <span className="text-blue-400 font-black font-mono shrink-0">
                  {Math.round(((activeWordIndex + 1) / words.length) * 100)}% COMPLÉTÉ
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODULE 2: GRAPHEME SYNESTHESIA MATRICE (COMPILER & LEGEND) --- */}
      {activeModule === 'synesthesia' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Inputs Panel & Explainer (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400 animate-pulse" />
                  Analyseur Synesthésique
                </h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-wider mt-1">
                  Structurez le texte en clusters visuels mémorisables
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-purple-400 font-bold uppercase tracking-wider block">Texte Libre à Compiler</label>
                  <textarea
                    value={synInput}
                    onChange={(e) => setSynInput(e.target.value)}
                    placeholder="Saisissez du texte en Français..."
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl p-4 outline-none focus:border-purple-500 transition-colors font-mono min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setPulseActive(true);
                  playPacerTick(440, 0.15);
                  setTimeout(() => setPulseActive(false), 1000);
                }}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-yellow-300 animate-bounce" />
                Regrouper & Colorer la Graphie
              </button>

              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2 text-xs leading-relaxed text-slate-300">
                <span className="font-bold text-purple-400 block uppercase font-mono tracking-wider">Pourquoi la synesthésie visuelle ?</span>
                La dyslexie phonologique entrave l'association instantanée entre lettre et son (graphe-phonème). En colorant les regroupements de consonnes et voyelles complexes, nous offrons un point de fixation visuel qui court-circuite le dysfonctionnement d'assemblage lexical.
              </div>
            </div>

            {/* PRESET CHIPS */}
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-3">
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest block mb-1">Mots magiques de démonstration</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { word: "L'ordinateur est magnifique", desc: "Test eur, gn et eau" },
                  { word: "Un grand chapeau jaune", desc: "Test au, eau, ch" },
                  { word: "L'oiseau blanc voyage en montagne", desc: "Test oi, an, en, gn" },
                  { word: "Un sapin vert sous la neige", desc: "Test in, ei" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSynInput(item.word);
                      playPacerTick(350, 0.05);
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-white/5 text-slate-300 text-xs rounded-xl border border-white/5 transition-all hover:text-white"
                  >
                    {item.word}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visualization Board & Interactive Legend (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl bg-slate-950/40 space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="font-bold uppercase tracking-wider text-purple-400">Rendu Synesthésique Haute Résolution</span>
                </div>
                {hoveredGrapheme && (
                  <span className="text-yellow-400 animate-pulse font-bold">INFO ACTIVE</span>
                )}
              </div>

              {/* MAIN DYNAMIC CANVAS */}
              <div className={`p-8 bg-[#0b0e17] rounded-3xl border border-white/5 min-h-[160px] flex items-center justify-center transition-all ${pulseActive ? 'ring-2 ring-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.3)] scale-102' : ''}`}>
                <div className="text-3xl font-bold tracking-widest text-center leading-[2] font-sans flex flex-wrap justify-center gap-x-2">
                  {synInput.split(/\s+/).map((word, wordIdx) => {
                    const parsed = parseTextToGraphemes(word);
                    return (
                      <span key={wordIdx} className="inline-block whitespace-nowrap mx-1">
                        {parsed.map((segment, segIdx) => {
                          if (segment.isGrapheme && segment.info) {
                            const info = segment.info;
                            const isHovered = hoveredGrapheme?.grapheme.toLowerCase() === info.target.toLowerCase();
                            return (
                              <button
                                key={segIdx}
                                onMouseEnter={() => setHoveredGrapheme({
                                  grapheme: info.target,
                                  ipa: info.ipa,
                                  description: info.desc
                                })}
                                onMouseLeave={() => setHoveredGrapheme(null)}
                                onClick={() => {
                                  playPacerTick(400, 0.2);
                                  speakText(segment.text);
                                }}
                                className={`font-black uppercase bg-gradient-to-r ${info.color} bg-clip-text text-transparent hover:scale-115 transition-transform duration-200 cursor-help border-b border-dashed border-purple-500/40 pb-0.5 inline-block ${isHovered ? 'scale-110 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' : ''}`}
                                title={`${info.target} : ${info.ipa}`}
                              >
                                {segment.text}
                              </button>
                            );
                          }
                          return (
                            <span key={segIdx} className="text-slate-300 font-medium">
                              {segment.text}
                            </span>
                          );
                        })}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* COGNITIVE DOCKER DETAILS */}
              {hoveredGrapheme ? (
                <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-black text-xl text-purple-300 font-mono shrink-0 shadow-lg">
                    {hoveredGrapheme.ipa}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white uppercase font-mono tracking-wider">{hoveredGrapheme.grapheme}</span>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Phonème Associé</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1 font-sans">
                      {hoveredGrapheme.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-[#0b0e17] border border-white/5 border-dashed rounded-2xl text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 py-8">
                  <HelpCircle className="w-6 h-6 text-slate-600 animate-bounce" />
                  <p className="font-sans">Survolez un élément coloré dans le rendu de texte pour décrypter son mécanisme d'articulation cognitive.</p>
                </div>
              )}

              {/* VISUAL GRAPHEME REFERENCE LEGEND */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Légende des Alignements Graphémiques</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FRENCH_GRAPHEMES.slice(0, 8).map((g, idx) => (
                    <button
                      key={idx}
                      onMouseEnter={() => setHoveredGrapheme({
                        grapheme: g.target,
                        ipa: g.ipa,
                        description: g.desc
                      })}
                      onMouseLeave={() => setHoveredGrapheme(null)}
                      onClick={() => {
                        playPacerTick(380, 0.1);
                        speakText(g.target);
                      }}
                      className="p-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-left flex items-center gap-2 group transition-all"
                    >
                      <span className={`w-8 h-8 rounded-lg bg-gradient-to-r ${g.color} flex items-center justify-center text-xs font-black text-slate-950 shadow-inner shrink-0 uppercase font-mono`}>
                        {g.target}
                      </span>
                      <div className="min-w-0 font-mono">
                        <span className="text-[10px] text-white block font-black group-hover:text-purple-400 transition-colors uppercase">{g.target}</span>
                        <span className="text-[9px] text-slate-500 block">{g.ipa}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* --- MODULE 3: SPATIAL MIRROR LANDING (GROUNDING & 3D COORDINATES) --- */}
      {activeModule === 'spatial-mirror' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
          
          {/* Controls Panel (5 Columns) */}
          <div className="xl:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-pink-400 animate-pulse" />
                  Ajustements de Re-projection
                </h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-wider mt-1">
                  Stabilisez physiquement la géométrie des lettres
                </p>
              </div>

              {/* CONTROLS */}
              <div className="space-y-5">
                {/* Gravity Base Anchor Slider */}
                <div className="space-y-2 bg-[#06080f]/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <span>Gravité de Base (Ligne d'Ancrage)</span>
                    <span className="font-mono text-white bg-emerald-500/15 px-2 py-0.5 rounded">{bottomGravity}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="2"
                    value={bottomGravity}
                    onChange={(e) => setBottomGravity(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Léger (0px)</span>
                    <span>Recommandé (8px)</span>
                    <span>Poids Max (16px)</span>
                  </div>
                  <p className="text-[10px] text-slate-400/70 italic mt-1 font-sans leading-relaxed">
                    Ajoute un socle horizontal lourd au pied de la lettre pour empêcher la rotation mentale dans le cerveau.
                  </p>
                </div>

                {/* 3D Depth coordinates */}
                <div className="space-y-2 bg-[#06080f]/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-pink-400">
                    <span>Extrusion de Perspective 3D</span>
                    <span className="font-mono text-white bg-pink-500/15 px-2 py-0.5 rounded">Profondeur: {extrusionShadow}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={extrusionShadow}
                    onChange={(e) => setExtrusionShadow(Number(e.target.value))}
                    className="w-full accent-pink-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Plat 2D (0)</span>
                    <span>Relief (6)</span>
                    <span>Ombre Extrême (12)</span>
                  </div>
                  <p className="text-[10px] text-slate-400/70 italic mt-1 font-sans leading-relaxed">
                    Projette un volume tridimensionnel orienté vers la direction intrinsèque du ventre de la lettre pour ancrer sa spatialité.
                  </p>
                </div>

                {/* Stereo Pan audio explainer */}
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block font-mono">Binaural Left/Right Panner</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Pour l'apprentissage kinesthésique, l'écoute d'un signal binaural est couplée à l'orientation : les lettres tournées vers la droite (b, p) émettent à droite, celles vers la gauche (d, q) émettent à gauche.
                  </p>
                </div>
              </div>

              {/* DEMO SWITCHERS */}
              <div className="grid grid-cols-4 gap-2">
                {(['b', 'd', 'p', 'q'] as const).map((letter) => (
                  <button
                    key={letter}
                    onClick={() => {
                      setActiveMirror(letter);
                      playSpatialMirrorSound(letter);
                    }}
                    className={`py-3.5 rounded-2xl text-xl font-mono font-black border transition-all ${
                      activeMirror === letter
                        ? 'bg-pink-500/10 border-pink-500 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.25)] scale-105'
                        : 'bg-[#0b0e17] border-white/5 text-slate-500 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive 3D/Physical Letter Sandbox (7 Columns) */}
          <div className="xl:col-span-7 space-y-6">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl bg-slate-950/40 flex flex-col justify-between min-h-[450px] relative overflow-hidden">
              
              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-pink-500 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider text-pink-400">Ancre Graphto-Spatiale 3D</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                  <span className="text-white/80 uppercase font-black tracking-widest text-[10px]">Modèle Actif : {activeMirror.toUpperCase()}</span>
                </div>
              </div>

              {/* CENTRAL PHYSICAL BOX */}
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="relative flex flex-col items-center">
                  
                  {/* Letters Main Block */}
                  <div className="relative flex items-center justify-center h-44 w-44">
                    
                    {/* Shadow Projection Extrusions (rendered via dynamic text-shadows) */}
                    <span 
                      className={`text-[11rem] font-black font-mono tracking-normal leading-none select-none transition-all duration-300 text-white flex items-center justify-center`}
                      style={{
                        textShadow: extrusionShadow > 0 ? (
                          activeMirror === 'b' || activeMirror === 'p' 
                            ? `${extrusionShadow}px ${extrusionShadow/2}px 0px rgba(236, 72, 153, 0.4), ${extrusionShadow * 1.8}px ${extrusionShadow}px 0px rgba(99, 102, 241, 0.2)`
                            : `-${extrusionShadow}px ${extrusionShadow/2}px 0px rgba(59, 130, 246, 0.4), -${extrusionShadow * 1.8}px ${extrusionShadow}px 0px rgba(168, 85, 247, 0.2)`
                        ) : 'none',
                        transform: isMirrorRotating ? 'rotate(180deg)' : 'none'
                      }}
                    >
                      {activeMirror}
                    </span>

                    {/* Symmetrical Guide overlays */}
                    {activeMirror === 'b' && (
                      <div className="absolute right-6 top-[40%] w-10 h-10 rounded-full border border-dashed border-pink-400/50 pointer-events-none animate-pulse" title="Ventre à droite" />
                    )}
                    {activeMirror === 'd' && (
                      <div className="absolute left-6 top-[40%] w-10 h-10 rounded-full border border-dashed border-blue-400/50 pointer-events-none animate-pulse" title="Ventre à gauche" />
                    )}
                    {activeMirror === 'p' && (
                      <div className="absolute right-6 bottom-[10%] w-10 h-10 rounded-full border border-dashed border-pink-400/50 pointer-events-none animate-pulse" title="Boucle en haut à droite" />
                    )}
                    {activeMirror === 'q' && (
                      <div className="absolute left-6 bottom-[10%] w-10 h-10 rounded-full border border-dashed border-blue-400/50 pointer-events-none animate-pulse" title="Boucle en haut à gauche" />
                    )}

                  </div>

                  {/* BOTTOM HEAVY GRAVITY BASE BAR */}
                  {bottomGravity > 0 && (
                    <div 
                      className="bg-gradient-to-r from-emerald-500/80 via-teal-500/80 to-blue-500/80 rounded-full blur-[1px] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300"
                      style={{ 
                        height: `${bottomGravity}px`,
                        width: '160px',
                        marginTop: '-10px'
                      }}
                    />
                  )}

                </div>
              </div>

              {/* PLAY SOUND BUTTON */}
              <div className="bg-[#0b0e17] rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-slate-300 font-bold font-mono">
                    {activeMirror === 'b' && "B [bə] : la barre monte, le ventre gonfle à Droite ➔ Émet à Droite"}
                    {activeMirror === 'd' && "D [də] : la barre monte, le dos s'appuie à Gauche ➔ Émet à Gauche"}
                    {activeMirror === 'p' && "P [pə] : la queue descend, la tête regarde à Droite ➔ Émet à Droite"}
                    {activeMirror === 'q' && "Q [kə] : la queue descend, la tête regarde à Gauche ➔ Émet à Gauche"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    {activeMirror === 'b' || activeMirror === 'p' ? "Panoramique audio stéréo : 80% Oreille Droite" : "Panoramique audio stéréo : 80% Oreille Gauche"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsMirrorRotating(true);
                      playPacerTick(600, 0.1);
                      setTimeout(() => setIsMirrorRotating(false), 800);
                    }}
                    className="px-3.5 py-2.5 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-xl text-xs font-bold font-mono uppercase transition-all"
                    title="Simuler l'inversion"
                  >
                    Effet Rotation
                  </button>

                  <button 
                    onClick={() => playSpatialMirrorSound(activeMirror)}
                    className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-wider font-mono shadow-md shadow-pink-500/10 flex items-center gap-1.5 hover:scale-102 active:scale-98 transition-all"
                  >
                    <Volume2 className="w-4 h-4" /> Activer Ancre
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* FOOTER COCKPIT WITH STANDARD VOICE ASSISTED SANDBOX (FOR STABILITY) */}
      <div className="bg-[#121626]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Mic className="w-48 h-48 text-indigo-400" />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono">Microphone Temps Réel (Gemma Edge)</h3>
              <p className="text-[10px] text-slate-500 font-sans">Saisissez ou parlez pour alimenter l'interface d'alignement</p>
            </div>
          </div>
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/15 border border-red-500/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[9px] font-mono font-black text-red-400 uppercase tracking-widest">Enregistrement Actif</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (manualInput.trim()) {
                  handleUrlOrManualEdgeInput(manualInput);
                }
              }}
              className="flex items-center gap-2 bg-[#0b0e17] border border-white/5 focus-within:border-indigo-500/50 p-2 rounded-2xl shadow-inner relative transition-all"
            >
              <input 
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Tapez un mot ou une phrase à tester (Ex: ordinateur, spectacle, apprentissage...)"
                className="bg-transparent border-none outline-none text-white text-xs px-4 py-2.5 flex-1 font-mono placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={isAnalyzingEdge || !manualInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center gap-1 shrink-0"
              >
                {isAnalyzingEdge ? 'Analyse...' : 'Tester'}
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Mots rapides :</span>
              {["ordinateur", "bilingue", "synesthésie", "saccade", "spectacle", "simultanément"].map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setManualInput(w);
                    handleUrlOrManualEdgeInput(w);
                    if (activeModule === 'synesthesia') {
                      setSynInput(w);
                    }
                  }}
                  className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/5 active:scale-95 transition-all uppercase"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center md:justify-end gap-3">
            <button 
              onClick={toggleRecording}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl relative group ${
                isRecording 
                  ? 'bg-rose-600 hover:bg-rose-500 ring-4 ring-rose-500/30' 
                  : 'bg-indigo-600 hover:bg-indigo-500 ring-4 ring-indigo-500/30 scale-105 hover:scale-110 active:scale-95'
              }`}
            >
              {isRecording ? <VolumeX className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-950 border border-white/10 text-[9px] font-mono px-2 py-1 rounded-md text-white whitespace-nowrap">
                {isRecording ? 'Arrêter Enregistrement' : 'Lancer Écoute Temps Réel'}
              </span>
            </button>

            {transcript && (
              <button 
                onClick={() => speakText(transcript)}
                className="w-14 h-14 rounded-full bg-white text-black hover:bg-slate-200 ring-4 ring-white/10 flex items-center justify-center active:scale-95 transition-all"
                title="Prononcer le transcript entier"
              >
                <Volume2 className="w-6 h-6 text-black" />
              </button>
            )}
          </div>
        </div>

        {transcript && (
          <div className="p-4 bg-[#0b0e17] rounded-2xl border border-white/5 space-y-2 animate-in fade-in duration-300">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block font-mono">Dernier Transcript Intercepté :</span>
            <p className="text-sm font-sans text-slate-200 font-medium italic">"{transcript}"</p>
          </div>
        )}

        {/* INTEGRATED ACCESSIBILITY ADD-ON: NOISE-ROBUST SIMPLIFICATION */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                Filtrage Acoustique & Simplification Cognitive (Anti-Bruit)
              </h4>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                Corrigez les erreurs phonétiques dues au bruit ambiant et simplifiez les phrases en temps réel.
              </p>
            </div>

            {/* Noise level selector */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Bruit Ambiant :</span>
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setNoiseLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border transition-all ${
                    noiseLevel === lvl
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lvl === 'low' ? 'Faible (10dB)' : lvl === 'medium' ? 'Modéré (45dB)' : 'Élevé (80dB)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSimplifyNoisyText(transcript || manualInput || "Le grand frere fait son pestacle incroyable sur lordinateur simultanément.")}
              disabled={isSimplifying || (!transcript && !manualInput)}
              className="px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              {isSimplifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Filtrage & Simplification...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
                  Simplifier la Phrase Interceptée
                </>
              )}
            </button>
            {!transcript && !manualInput && (
              <span className="text-[10px] text-yellow-500/80 font-mono italic">
                * Saisissez ou prononcez un mot d'abord, ou cliquez pour tester un exemple pré-configuré.
              </span>
            )}
          </div>

          {/* Denoised & Simplified Output Section */}
          {(denoisedText || simplifiedText) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              {/* Denoised Card */}
              <div className="p-5 bg-[#0b0e17] border border-white/5 rounded-2xl space-y-2 relative">
                <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  Signal Épuré & Débruité
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2">
                  {denoisedText}
                </p>
                <button
                  onClick={() => speakText(denoisedText)}
                  className="absolute right-3 bottom-3 p-2 bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-white hover:scale-105 transition-all"
                  title="Écouter le texte épuré"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Simplified Card */}
              <div className="p-5 bg-[#0b0e17] border border-yellow-500/20 rounded-2xl space-y-2 relative shadow-[0_0_20px_rgba(234,179,8,0.03)]">
                <span className="text-[9px] font-mono font-black text-yellow-400 uppercase tracking-widest bg-yellow-500/10 px-2.5 py-0.5 rounded-full">
                  Version Simplifiée (Cognitive)
                </span>
                <p className="text-sm text-white leading-relaxed font-sans font-bold mt-2">
                  {simplifiedText}
                </p>
                <button
                  onClick={() => speakText(simplifiedText)}
                  className="absolute right-3 bottom-3 p-2 bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-white hover:scale-105 transition-all"
                  title="Écouter le texte simplifié"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mapping Badges */}
              {simpleWordsMapping.length > 0 && (
                <div className="md:col-span-2 p-4 bg-[#0a0c14] border border-white/5 rounded-2xl space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Glossaire des simplifications appliquées :</span>
                  <div className="flex flex-wrap gap-2">
                    {simpleWordsMapping.map((mapItem, mIdx) => (
                      <div key={mIdx} className="px-3 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-mono flex items-center gap-2">
                        <span className="text-red-400 font-bold line-through">{mapItem.difficult}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-emerald-400 font-black">{mapItem.simple}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
