import React, { useState, useEffect } from 'react';
import { MainViewType, ArchSubTabType } from './types';
import { 
  BookOpen, Brain, BrainCircuit, Loader2, X, Languages, ChevronDown, 
  FileText, Sparkles, Zap, Globe, Volume2, VolumeX, Trophy, Target, 
  Activity, Mic, Network, Gamepad2, Presentation, Headphones, Layers, 
  ArrowLeft, Send, LogIn, LogOut, Play, Settings, GraduationCap, Award, 
  CheckCircle2, Clock, History, Database, SearchCode, Terminal, Code, 
  Moon, Trash2, Paperclip, CreditCard, Download, FolderArchive, Hand, Lock,
  Shield, Orbit, Radio, Plus, User, Flame
} from 'lucide-react';
import { 
  startGuestSession, 
  expireGuestSession, 
  isGuestLockedOut, 
  isGuestSessionActive, 
  getGuestSessionRemainingMs, 
  getGuestLockoutRemainingMs, 
  formatRemainingTime 
} from './utils/guestManager';
import Markdown from 'react-markdown';
import { generateSummary, generateQuiz, generateMindMap, getLocalPedagogicalFallback } from './services/ai';
import { extractTextFromFile } from './services/documentParser';
import Mermaid from './components/Mermaid';
import ExamQuiz from './components/ExamQuiz';
import CyberSecurityLab from './components/CyberSecurityLab';
import OfflineSyncPipeline from './components/OfflineSyncPipeline';
import GoogleAcquisitionCenter from './components/GoogleAcquisitionCenter';
import PwaAudit from './components/PwaAudit';
import HubView from './components/views/HubView';
import DyslexiaView from './components/views/DyslexiaView';
import HistoryView from './components/views/HistoryView';
import GtmPlaybook from './components/GtmPlaybook';
import PhonemeOrbit from './components/PhonemeOrbit';
import VoiceConversationView from './components/views/VoiceConversationView';
import PhoneticPredictorView from './components/views/PhoneticPredictorView';
import GoogleClassroomHub from './components/GoogleClassroomHub';
import GoogleWorkspaceHub from './components/GoogleWorkspaceHub';
import AddToWorkspaceModal from './components/AddToWorkspaceModal';
import SubscriptionModal from './components/SubscriptionModal';
import LoginModal from './components/LoginModal';
import ProgressBadgesModal from './components/ProgressBadgesModal';
import DailyStreakNavbar from './components/DailyStreakNavbar';
import MentoraView from './components/views/MentoraView';
import SL2TView from './components/views/SL2TView';
import PhoneticVisualizerView from './components/views/PhoneticVisualizerView';
import { AppPresentationLanding } from './components/AppPresentationLanding';
import scholarIcon from './assets/images/mount_ai_logo_1785927100930.jpg';
import { auth, loginWithGoogle, logout } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addHistoryItem } from './services/historyService';

export default function App() {
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'pro'>(() => {
    return (localStorage.getItem('user_tier') as 'free' | 'pro') || 'free';
  });

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [workspaceExportTitle, setWorkspaceExportTitle] = useState("Mount AI Scholar - Notes & Synthèse");
  const [workspaceExportText, setWorkspaceExportText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(30).fill(0));
  const [detectedPhonemes, setDetectedPhonemes] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [injectedExercise, setInjectedExercise] = useState<string | undefined>(undefined);
  
  const [mainView, setMainView] = useState<MainViewType>(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'phoneme-gravity' || window.location.hash === '#phoneme-gravity') return 'phoneme-gravity';
    return 'hub';
  });
  
  const [learningMode, setLearningMode] = useState<'mindmap' | 'quiz' | 'exam' | 'summary'>('summary');
  const [inputText, setInputText] = useState("");
  const [learningResult, setLearningResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLang, setSelectedLang] = useState("French");
  
  const langMap: Record<string, string> = {
    "English": "en-US",
    "French": "fr-FR",
    "Arabic": "ar-SA",
    "Spanish": "es-ES",
    "German": "de-DE"
  };
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  const [user, setUser] = useState<any>(() => {
    if (isGuestSessionActive()) {
      return {
        uid: 'guest_1337',
        displayName: 'Invité (Session 30 min)',
        email: 'guest@mountai.scholar',
        isGuest: true
      };
    }
    return null;
  });

  const [archSubTab, setArchSubTab] = useState<ArchSubTabType>('cyber');
  const [guestRemainingMs, setGuestRemainingMs] = useState(0);

  // Monitor guest session & Firebase auth
  useEffect(() => {
    const monitorGuest = () => {
      if (user?.isGuest) {
        const remaining = getGuestSessionRemainingMs();
        setGuestRemainingMs(remaining);
        if (remaining <= 0) {
          expireGuestSession();
          setUser(null);
          setMainView('hub');
          alert("⏱️ Votre accès invité de 30 minutes est terminé !");
        }
      }
    };

    monitorGuest();
    const interval = setInterval(monitorGuest, 1000);
    return () => clearInterval(interval);
  }, [user?.isGuest]);

  useEffect(() => {
    if (user?.isGuest) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (user?.isGuest) return;
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [user?.isGuest]);

  const handleGlobalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await extractTextFromFile(file);
      setInputText(text);
      setInjectedExercise(text);

      const currentUser = user || { isGuest: true, uid: 'guest_1337' };
      addHistoryItem(currentUser, {
        type: 'pdf',
        fileExtension: '.pdf',
        title: file.name,
        mode: 'pdf_import',
        language: selectedLang,
        originalText: `Fichier importé : ${file.name} (${Math.round(file.size / 1024)} Ko)`,
        generatedContent: text,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          tags: ['Import', 'Document']
        }
      });
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la lecture du fichier.");
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    try {
      let res = '';
      if (learningMode === 'summary') {
        res = await generateSummary(inputText, selectedLang);
      } else if (learningMode === 'quiz') {
        res = await generateQuiz(inputText, selectedLang);
      } else if (learningMode === 'mindmap') {
        res = await generateMindMap(inputText, selectedLang);
      } else {
        res = await generateSummary(inputText, selectedLang);
      }
      setLearningResult(res);

      const currentUser = user || { isGuest: true, uid: 'guest_1337' };
      addHistoryItem(currentUser, {
        type: learningMode === 'quiz' ? 'quiz' : learningMode === 'mindmap' ? 'mindmap' : 'summary',
        fileExtension: learningMode === 'quiz' ? '.quiz' : learningMode === 'mindmap' ? '.map' : '.md',
        title: `${learningMode.toUpperCase()} - ${new Date().toLocaleTimeString()}`,
        mode: learningMode,
        language: selectedLang,
        originalText: inputText.slice(0, 300),
        generatedContent: res
      });
    } catch (err: any) {
      console.warn("AI generation fallback:", err);
      const fallback = getLocalPedagogicalFallback(inputText, selectedLang);
      setLearningResult(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const speakText = async (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[selectedLang] || 'fr-FR';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenWorkspaceExport = (title: string, text: string) => {
    setWorkspaceExportTitle(title);
    setWorkspaceExportText(text);
    setIsWorkspaceModalOpen(true);
  };

  const handleDirectGuest = () => {
    const res = startGuestSession();
    if (res.success) {
      setUser({
        uid: 'guest_1337',
        displayName: 'Invité (Session 30 min)',
        email: 'guest@mountai.scholar',
        isGuest: true
      });
      setIsLoginModalOpen(false);
    } else {
      alert("⏱️ Session invité verrouillée pendant 24h. Veuillez vous connecter avec Google.");
    }
  };

  // If user is not authenticated and has no active guest session, display the full Presentation Landing Page first
  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-orange-500/30 relative">
        <AppPresentationLanding 
          onGoToLogin={() => setIsLoginModalOpen(true)}
          onDirectGuest={handleDirectGuest}
        />
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          onGoogleLogin={async () => {
            const logged = await loginWithGoogle();
            if (logged) setUser(logged);
          }}
          onGuestLogin={handleDirectGuest}
          onOpenStripeCheckout={() => {
            setIsLoginModalOpen(false);
            setIsSubscriptionModalOpen(true);
          }}
          userTier={userTier}
          userEmail={user?.email}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-orange-500/30 relative">
      {/* Background Ambience & Glows */}
      <div className="atmosphere" />

      {/* Main Glassmorphism Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMainView('hub')}
              className="flex items-center gap-3 text-left group transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-blue-600 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                <img src={scholarIcon} alt="Mount AI" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-white">
                    Mount AI<span className="text-orange-500">: Scholar</span>
                  </span>
                  <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-mono font-bold rounded uppercase tracking-wider hidden sm:inline-block">
                    Stealth EdTech
                  </span>
                </div>
                <span className="block text-[10px] text-slate-400 font-mono tracking-wider">
                  Cognitive Learning Suite & On-Device AI
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Items (Glassmorphism Pill) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 p-1.5 rounded-2xl backdrop-blur-xl">
            {[
              { id: 'hub', label: 'Hub' },
              { id: 'presentation', label: 'Présentation & FAQ' },
              { id: 'sl2t', label: 'SL2T Sign' },
              { id: 'phonetic-visualizer', label: 'Visualiseur' },
              { id: 'dyslexia', label: 'Dyslexie' },
              { id: 'mentora', label: 'Tutor IA' },
              { id: 'learning', label: 'Synthèse' },
              { id: 'phonetic-predictor', label: 'Prédicteur' },
              { id: 'workspace', label: 'Workspace' },
              { id: 'classroom', label: 'Classroom' },
              { id: 'history', label: 'Historique' },
              { id: 'architecture', label: 'Architecture' },
            ].map(({ id, label }) => (
              <button 
                key={id}
                onClick={() => setMainView(id as MainViewType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mainView === id 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-slate-950 shadow-md shadow-orange-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* User & Actions Bar */}
          <div className="flex items-center gap-2.5">
            <DailyStreakNavbar />

            {/* Badges Modal trigger */}
            <button
              onClick={() => setIsBadgesModalOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 transition-all hover:scale-105"
              title="Trophées & Badges"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Add to Google Workspace Button */}
            <button
              onClick={() => handleOpenWorkspaceExport('Mount AI Scholar - Workspace', 'Notes & révisions synchronisées avec Google Workspace.')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all"
              title="Ajouter aux extensions Google Workspace"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Workspace</span>
            </button>

            {/* User Profile or Guest / Login */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs text-slate-200 font-bold max-w-[90px] truncate leading-tight">
                    {user.displayName || user.email || 'Utilisateur'}
                  </span>
                  {user.isGuest && (
                    <span className="text-[9px] text-amber-400 font-mono">
                      {formatRemainingTime(guestRemainingMs)}
                    </span>
                  )}
                </div>
                <button 
                  onClick={async () => {
                    if (user.isGuest) expireGuestSession();
                    await logout();
                    setUser(null);
                  }}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                  title="Déconnexion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connexion</span>
              </button>
            )}

            {/* Pro Upgrade Button */}
            <button 
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Pro Scholar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Glassmorphism Views */}
      <main className="flex-1 relative z-10 px-4 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        {mainView === 'hub' && (
          <HubView 
            setMainView={setMainView} 
            onAddToWorkspace={handleOpenWorkspaceExport}
            user={user}
          />
        )}

        {mainView === 'presentation' && (
          <AppPresentationLanding 
            isLoggedIn={true}
            onEnterApp={() => setMainView('hub')}
            onGoToLogin={() => setIsLoginModalOpen(true)}
            onDirectGuest={handleDirectGuest}
          />
        )}

        {mainView === 'dyslexia' && (
          <DyslexiaView 
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            isRecording={isRecording}
            toggleRecording={() => setIsRecording(!isRecording)}
            transcript={transcript}
            detectedPhonemes={detectedPhonemes}
            audioData={audioData}
            speechError={speechError}
            user={user}
            loginWithGoogle={loginWithGoogle}
            logout={logout}
            langMap={langMap}
            speakText={speakText}
            handleUrlOrManualEdgeInput={async (text) => setInputText(text)}
            isAnalyzingEdge={false}
            edgePerformanceMs={42}
            injectedExercise={injectedExercise}
            onAddToWorkspace={handleOpenWorkspaceExport}
          />
        )}

        {mainView === 'mentora' && (
          <MentoraView 
            setMainView={setMainView} 
            onAddToWorkspace={handleOpenWorkspaceExport} 
            user={user} 
          />
        )}

        {mainView === 'sl2t' && (
          <SL2TView 
            setMainView={setMainView} 
            onAddToWorkspace={handleOpenWorkspaceExport} 
            user={user}
          />
        )}

        {mainView === 'phonetic-visualizer' && (
          <PhoneticVisualizerView 
            setMainView={setMainView} 
            user={user} 
            onAddToWorkspace={handleOpenWorkspaceExport} 
          />
        )}

        {mainView === 'phonetic-predictor' && (
          <PhoneticPredictorView 
            setMainView={setMainView} 
            selectedLang={selectedLang} 
            speakText={speakText} 
            injectedText={inputText}
            onAddToWorkspace={handleOpenWorkspaceExport} 
          />
        )}

        {mainView === 'phoneme-gravity' && (
          <PhonemeOrbit 
            user={user}
            selectedLang={selectedLang}
            onBack={() => setMainView('hub')} 
          />
        )}

        {mainView === 'voice-conversation' && (
          <VoiceConversationView 
            onBack={() => setMainView('hub')} 
          />
        )}

        {mainView === 'learning' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-3xl backdrop-blur-2xl">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-orange-400" />
                  Studio d'Apprentissage & Synthèse Cognitive
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Importez vos cours volumineux (PDF, Word, PPTX) et générez des résumés, quiz interactifs et mindmaps en un clic.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl cursor-pointer text-xs font-bold transition-all">
                  <Paperclip className="w-4 h-4" />
                  <span>Importer un Document</span>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" 
                    className="hidden" 
                    onChange={handleGlobalFileUpload}
                  />
                </label>
                
                <select 
                  value={selectedLang} 
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none font-bold"
                >
                  <option value="French">Français</option>
                  <option value="English">English</option>
                  <option value="Arabic">العربية</option>
                  <option value="Spanish">Español</option>
                  <option value="German">Deutsch</option>
                </select>
              </div>
            </div>

            {/* Document Input & Modes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-400" />
                    Mode de Génération
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'summary', label: 'Résumé Express', icon: FileText },
                      { id: 'quiz', label: 'Quiz Interactif', icon: Target },
                      { id: 'mindmap', label: 'Mindmap Conceptuelle', icon: Network },
                      { id: 'exam', label: 'Contrôle & Barème', icon: Award }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setLearningMode(id as any)}
                        className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                          learningMode === id 
                            ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10' 
                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-bold">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs text-slate-400 font-bold">Contenu ou extrait du cours :</label>
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Collez votre cours ou importez un document ci-dessus..."
                      rows={8}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-orange-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !inputText.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Lancer la Synthèse Cognitive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Result Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass-panel p-6 rounded-3xl min-h-[480px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-orange-400 font-mono font-bold">
                          Résultat Structuré
                        </span>
                      </div>

                      {learningResult && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => speakText(learningResult)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            title="Écouter la synthèse"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenWorkspaceExport('Synthèse de Cours', learningResult)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Workspace</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {learningResult ? (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-300">
                        {learningMode === 'mindmap' && learningResult.includes('graph TD') ? (
                          <Mermaid chart={learningResult} />
                        ) : learningMode === 'quiz' ? (
                          <ExamQuiz language={selectedLang} originalTextContext={inputText} />
                        ) : (
                          <Markdown>{learningResult}</Markdown>
                        )}
                      </div>
                    ) : (
                      <div className="py-24 text-center space-y-3">
                        <div className="w-14 h-14 rounded-3xl glass-panel border border-white/10 flex items-center justify-center mx-auto text-slate-500 shadow-xl">
                          <Sparkles className="w-7 h-7 text-orange-400/60" />
                        </div>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto">
                          Sélectionnez un mode, collez ou importez votre contenu, et lancez la synthèse cognitive.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mainView === 'workspace' && (
          <GoogleWorkspaceHub setMainView={setMainView} />
        )}

        {mainView === 'classroom' && (
          <GoogleClassroomHub setMainView={setMainView} />
        )}

        {mainView === 'history' && (
          <HistoryView 
            user={user} 
            setMainView={setMainView} 
            speakText={speakText} 
          />
        )}

        {mainView === 'gtm' && (
          <GtmPlaybook 
            user={user}
            mlEngineUrl={window.location.origin}
          />
        )}

        {mainView === 'architecture' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <button 
                onClick={() => setArchSubTab('cyber')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  archSubTab === 'cyber' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                CyberSécurité & PII
              </button>
              <button 
                onClick={() => setArchSubTab('google-deploy')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  archSubTab === 'google-deploy' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Acquisition
              </button>
              <button 
                onClick={() => setArchSubTab('pwa-audit')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  archSubTab === 'pwa-audit' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Audit PWA & ChromeOS
              </button>
            </div>

            {archSubTab === 'cyber' && <CyberSecurityLab />}
            {archSubTab === 'google-deploy' && <GoogleAcquisitionCenter user={user} />}
            {archSubTab === 'pwa-audit' && <PwaAudit />}
          </div>
        )}
      </main>

      {/* Persistent Footer with Signature */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-slate-300 font-bold">Mount AI: Scholar</span>
            <span className="text-slate-600">|</span>
            <span>Écosystème Cognitif & On-Device AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Créé par <strong className="text-orange-400 font-black tracking-wide uppercase">Taha Dev Junior</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals & Extension Drawers */}
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen} 
        onClose={() => setIsSubscriptionModalOpen(false)} 
        userEmail={user?.email || "capitaine@mentora.ai"}
        currentTier={userTier} 
        onTierChange={(newTier) => {
          setUserTier(newTier);
          localStorage.setItem('user_tier', newTier);
        }}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onGoogleLogin={async () => {
          const logged = await loginWithGoogle();
          if (logged) setUser(logged);
        }}
        onGuestLogin={handleDirectGuest}
        onOpenStripeCheckout={() => {
          setIsLoginModalOpen(false);
          setIsSubscriptionModalOpen(true);
        }}
        userTier={userTier}
        userEmail={user?.email}
      />

      <ProgressBadgesModal 
        isOpen={isBadgesModalOpen} 
        onClose={() => setIsBadgesModalOpen(false)} 
      />

      <AddToWorkspaceModal 
        isOpen={isWorkspaceModalOpen} 
        onClose={() => setIsWorkspaceModalOpen(false)} 
        title={workspaceExportTitle} 
        textToSave={workspaceExportText} 
      />
    </div>
  );
}
