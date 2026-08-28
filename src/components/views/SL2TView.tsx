import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Hand,
  Sparkles,
  Camera,
  Activity,
  Shield,
  Layers,
  BrainCircuit,
  Volume2,
  CheckCircle2,
  BookOpen,
  Info,
  Download,
  Plus,
  Cpu,
  Video,
  HelpCircle,
  Mic,
  MicOff,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  Radio,
  Sliders
} from 'lucide-react';
import SL2TScanner from '../SL2TScanner';
import SignLibrary, { SignItem } from '../SignLibrary';
import SignQuiz from '../SignQuiz';
import { MainViewType } from '../../types';
import { SIGN_LANGUAGE_DICTIONARY } from '../../services/gestureRecognizer';
import { downloadPdfDocument } from '../../utils/pdfExport';

interface SL2TViewProps {
  setMainView: (view: MainViewType) => void;
  onAddToWorkspace?: (title: string, text: string) => void;
  user?: any;
}

export default function SL2TView({ setMainView, onAddToWorkspace, user }: SL2TViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'both' | 'scanner' | 'quiz' | 'library'>('both');
  const [detectedHistory, setDetectedHistory] = useState<Array<{ sign: string; meaning: string; time: string }>>([]);
  const [practiceSignNotice, setPracticeSignNotice] = useState<string | null>(null);

  // Hardware & Permissions Diagnostic States
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [cameraStatus, setCameraStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt' | 'active'>('unknown');
  const [micStatus, setMicStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt' | 'active'>('unknown');
  const [audioSynthStatus, setAudioSynthStatus] = useState<'ready' | 'unsupported'>('ready');
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [isTestingCamera, setIsTestingCamera] = useState<boolean>(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [diagnosticMsg, setDiagnosticMsg] = useState<string | null>(null);

  const testStreamRef = useRef<MediaStream | null>(null);
  const cameraTestStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check initial permissions if query API is supported
  useEffect(() => {
    // Check speech synthesis capability
    if (!('speechSynthesis' in window)) {
      setAudioSynthStatus('unsupported');
    }

    // Permission API query check
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((res) => {
          setCameraStatus(res.state as any);
          res.onchange = () => setCameraStatus(res.state as any);
        })
        .catch(() => {
          // Camera query not supported on all browsers
        });

      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((res) => {
          setMicStatus(res.state as any);
          res.onchange = () => setMicStatus(res.state as any);
        })
        .catch(() => {
          // Microphone query not supported on all browsers
        });
    }

    return () => {
      stopMicTest();
    };
  }, []);

  const handleSignDetected = (sign: string, meaning: string) => {
    const time = new Date().toLocaleTimeString();
    setDetectedHistory((prev) => [{ sign, meaning, time }, ...prev.slice(0, 19)]);
  };

  const handlePracticeSelected = (sign: SignItem) => {
    setPracticeSignNotice(`Signe sélectionné : ${sign.name} (${sign.symbol}) - Préparez votre geste devant la caméra !`);
    setActiveSubTab('both');
    // Scroll smoothly to scanner if not visible
    const scannerElem = document.getElementById('sl2t-scanner-root');
    if (scannerElem) {
      scannerElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportFullReport = () => {
    const historyText = detectedHistory
      .map((item) => `[${item.time}] ${item.sign} -> ${item.meaning}`)
      .join('\n');
    const fullText = `Transcription et Historique SL2T (Sign Language to Text)\nDate: ${new Date().toLocaleDateString()}\n\nHistorique des signes détectés :\n${historyText || 'Aucun signe détecté.'}`;
    downloadPdfDocument('Rapport Transcription SL2T - Mentora AI', fullText, 'MediaPipe SL2T');
  };

  // Hardware Test: Audio Synthesizer & Web Speech
  const handleTestAudioSynth = () => {
    if (!('speechSynthesis' in window)) {
      setDiagnosticMsg('La synthèse vocale Web Speech n\'est pas supportée par ce navigateur.');
      return;
    }
    setIsTestingAudio(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Test audio Mentora AI. Synthèse vocale et retour phonétique opérationnels.');
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.onend = () => {
      setIsTestingAudio(false);
      setDiagnosticMsg('Test audio réussi : Synthèse vocale française fonctionnelle.');
    };
    utterance.onerror = () => {
      setIsTestingAudio(false);
      setDiagnosticMsg('Erreur lors du test de synthèse vocale.');
    };
    window.speechSynthesis.speak(utterance);
  };

  // Hardware Test: Camera video stream authorization
  const handleTestCamera = async () => {
    if (isTestingCamera) {
      stopCameraTest();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      cameraTestStreamRef.current = stream;
      setCameraStatus('granted');
      setIsTestingCamera(true);
      const track = stream.getVideoTracks()[0];
      const settings = track ? track.getSettings() : null;
      const resInfo = settings?.width ? `${settings.width}x${settings.height}` : 'Flux actif';
      setDiagnosticMsg(`Caméra connectée avec succès (${track?.label || 'Webcam'} - ${resInfo}). Prête pour MediaPipe SL2T.`);
    } catch (err: any) {
      console.warn('Accès caméra refusé ou indisponible:', err?.message || err);
      setCameraStatus('denied');
      setDiagnosticMsg("Accès caméra refusé. Vérifiez les autorisations de votre navigateur ou activez la caméra dans les réglages de votre appareil.");
    }
  };

  const stopCameraTest = () => {
    if (cameraTestStreamRef.current) {
      cameraTestStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraTestStreamRef.current = null;
    }
    setIsTestingCamera(false);
  };

  // Hardware Test: Microphone audio stream & Level Analyzer
  const handleTestMicrophone = async () => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      testStreamRef.current = stream;
      setMicStatus('granted');
      setIsTestingMic(true);
      setDiagnosticMsg('Microphone connecté avec succès. Détection du niveau sonore en direct...');

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!testStreamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch (err: any) {
      console.warn('Accès micro non disponible ou refusé:', err?.message || err);
      setMicStatus('denied');
      setDiagnosticMsg("Accès au microphone refusé ou indisponible. Vérifiez les autorisations de votre navigateur ou de votre système d'exploitation.");
    }
  };

  const stopMicTest = () => {
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsTestingMic(false);
    setMicVolumeLevel(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-7xl mx-auto">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <button
            id="sl2t-back-to-hub-btn"
            onClick={() => setMainView('hub')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-slate-300 hover:text-white rounded-2xl transition-all duration-200 flex items-center gap-2 group shadow-sm cursor-pointer"
            title="Retour au Hub d'accueil"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline">Hub</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase">
                SL2T <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Langue des Signes</span>
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono rounded-full font-bold">
                MediaPipe Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Sign Language to Text (SL2T) • Inférence Vision Locale, Dictionnaire Visuel, Mini-Quiz & Traduction
            </p>
          </div>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('both')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'both'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Tout
            </button>
            <button
              onClick={() => setActiveSubTab('scanner')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'scanner'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Scanner Caméra
            </button>
            <button
              onClick={() => setActiveSubTab('quiz')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'quiz'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Mini-Quiz 4 Choix
            </button>
            <button
              onClick={() => setActiveSubTab('library')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'library'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> SignLibrary
            </button>
          </div>

          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`px-3 py-2 border font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              showDiagnostics
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Diagnostique des Autorisations & Matériel (Caméra, Micro, Audio)"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Matériel & Accès</span>
          </button>

          <button
            onClick={handleExportFullReport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Rapport PDF</span>
          </button>

          {onAddToWorkspace && (
            <button
              onClick={() => {
                const text = detectedHistory.map((d) => `${d.sign}: ${d.meaning}`).join(', ');
                onAddToWorkspace('Session SL2T - Langue des Signes', text || 'Session SL2T.');
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* Hardware & Permissions Diagnostic Drawer / Panel */}
      {showDiagnostics && (
        <div className="bg-slate-950/90 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Centre de Diagnostic • Autorisations Caméra & Audio (Edge AI)
              </h4>
            </div>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Camera Diagnostic */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                  <Camera className="w-4 h-4 text-emerald-400" /> Caméra / Vision
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-full font-bold ${
                    cameraStatus === 'granted' || cameraStatus === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : cameraStatus === 'denied'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isTestingCamera ? 'TEST EN COURS' : cameraStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Utilisé par MediaPipe Tasks pour le tracking 3D des 21 landmarks articulaires.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleTestCamera}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isTestingCamera
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isTestingCamera ? 'Arrêter Test' : 'Tester Caméra'}</span>
                </button>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                🔒 Inférence locale WebGPU / Wasm — aucun flux envoyé au cloud.
              </div>
            </div>

            {/* Microphone Diagnostic */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                  <Mic className="w-4 h-4 text-indigo-400" /> Microphone / Voix
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-full font-bold ${
                    micStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : micStatus === 'denied'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isTestingMic ? 'EN DIRECT' : micStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Utilisé pour l'interaction vocale et l'étalonnage phonétique.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleTestMicrophone}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isTestingMic
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isTestingMic ? 'Arrêter Test' : 'Tester Micro'}</span>
                </button>

                {isTestingMic && (
                  <div className="flex-1 bg-slate-950 rounded-lg h-3 overflow-hidden border border-slate-800 flex items-center p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded transition-all duration-75"
                      style={{ width: `${micVolumeLevel}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Audio Synthesis & Web Speech Diagnostic */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                  <Volume2 className="w-4 h-4 text-teal-400" /> Synthèse Vocale & Audio
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono rounded-full font-bold">
                  {audioSynthStatus === 'ready' ? 'OPÉRATIONNEL' : 'NON SUPPORTÉ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Génération de retours sonores haptiques et prononciation française des signes traduits.
              </p>
              <div className="pt-1">
                <button
                  onClick={handleTestAudioSynth}
                  disabled={isTestingAudio}
                  className="px-3 py-1.5 bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/40 text-teal-200 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isTestingAudio ? 'animate-pulse' : ''}`} />
                  <span>{isTestingAudio ? 'Émission en cours...' : 'Tester Haut-Parleur'}</span>
                </button>
              </div>
            </div>
          </div>

          {diagnosticMsg && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{diagnosticMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Practice selection notice if user clicked on a sign in library */}
      {practiceSignNotice && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-200 font-mono animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>{practiceSignNotice}</span>
          </div>
          <button
            onClick={() => setPracticeSignNotice(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-900/60 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Mini-Quiz Component (Active in 'both' or 'quiz') */}
      {(activeSubTab === 'both' || activeSubTab === 'quiz') && (
        <SignQuiz
          onSelectSignForPractice={handlePracticeSelected}
          onAddToWorkspace={onAddToWorkspace}
        />
      )}

      {/* 2. Main SL2T Scanner Component with Live Video & Sliders */}
      {(activeSubTab === 'both' || activeSubTab === 'scanner') && (
        <SL2TScanner
          onSignDetected={handleSignDetected}
          onAddToWorkspace={onAddToWorkspace}
        />
      )}

      {/* 3. Static Illustrated Sign Library (SignLibrary) */}
      {(activeSubTab === 'both' || activeSubTab === 'library') && (
        <SignLibrary
          onSelectSignForPractice={handlePracticeSelected}
          onAddToWorkspace={onAddToWorkspace}
        />
      )}

      {/* Technical Architecture & Session History Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Spécifications Edge AI & Conformité Privacy (SL2T)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Graphe MediaPipe Tasks Vision WebAssembly & Sécurité Zéro-Fuite
                  </p>
                </div>
              </div>

              {detectedHistory.length > 0 && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-mono">
                  {detectedHistory.length} signes enregistrés
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Inférence 100% On-Device
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Le flux vidéo est décodé localement dans le navigateur via WebAssembly et WebGPU. Aucune donnée biométrique n'est transmise.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 21 Landmarks 3D par Main
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Calcul géométrique tridimensionnel des angles articulaires des phalanges pour une précision chirurgicale des signes.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Conformité Éducation & LSF
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Pensé pour les salles de classe, élèves malentendants et dyslexiques pour fluidifier l'inclusion scolaire et l'accessibilité.
                </p>
              </div>
            </div>

            {/* Session History Feed */}
            {detectedHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-white">Flux Chronologique de la Session</span>
                  <span className="text-emerald-400">{detectedHistory.length} détections</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {detectedHistory.slice(0, 8).map((item, index) => (
                    <div
                      key={index}
                      className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">{item.time}</span>
                        <span className="text-white font-bold">{item.meaning}</span>
                      </div>
                      <span className="text-emerald-400 text-[10px]">{item.sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
