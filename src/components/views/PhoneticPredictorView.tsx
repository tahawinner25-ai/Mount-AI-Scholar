import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Check, Copy, RefreshCw, Volume2, HelpCircle, 
  ArrowLeft, Keyboard, Mail, FileText, CheckCircle,
  Send, FilePlus, AlertTriangle, ShieldCheck, LogOut,
  Zap, Globe, Mic, MicOff, Radio, VolumeX, ListOrdered
} from 'lucide-react';
import { connectGmail, getCachedAccessToken, auth } from '../../services/firebase';
import { findLocalPhoneticSuggestions, getActiveWordAtCursor } from '../../utils/phoneticEngine';
import { extractTextFromFile } from '../../services/documentParser';

interface PhoneticSuggestion {
  word: string;
  probability: string;
  meaning: string;
  example: string;
}

interface PhoneticPredictorViewProps {
  setMainView: (view: any) => void;
  selectedLang: string;
  speakText: (text: string) => Promise<void>;
  injectedText?: string;
  onAddToWorkspace?: (title: string, text: string) => void;
}

export default function PhoneticPredictorView({ 
  setMainView, 
  selectedLang, 
  speakText, 
  injectedText, 
  onAddToWorkspace 
}: PhoneticPredictorViewProps) {
  const [inputText, setInputText] = useState('');
  const [predictorMode, setPredictorMode] = useState<'forward' | 'inverse'>('forward');
  const [importedDocName, setImportedDocName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [currentlySpeakingWord, setCurrentlySpeakingWord] = useState<string | null>(null);

  // Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [suggestions, setSuggestions] = useState<PhoneticSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for real-time in-place phonetic writing prediction
  const [activeWordInfo, setActiveWordInfo] = useState<{ word: string; start: number; end: number } | null>(null);
  const [predictionSource, setPredictionSource] = useState<'standalone' | 'draft'>('standalone');

  // Interactive offline PWA simulation and performance tracking
  const [isForceOffline, setIsForceOffline] = useState(() => {
    return localStorage.getItem('pwa_force_offline') === 'true';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number>(0);
  const [inferenceSourceUsed, setInferenceSourceUsed] = useState<'local' | 'cloud'>('cloud');

  // Gmail State
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: '' });
  const [gmailDrafts, setGmailDrafts] = useState<any[]>([]);
  const [gmailTab, setGmailTab] = useState<'send' | 'import'>('send');
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('');

  useEffect(() => {
    if (injectedText) {
      setInputText(injectedText);
      setPredictionSource('standalone');
    }
  }, [injectedText]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleForceOffline = () => {
    const newVal = !isForceOffline;
    setIsForceOffline(newVal);
    localStorage.setItem('pwa_force_offline', String(newVal));
  };

  // Preset examples for both modes
  const DIRECT_PRESETS = [
    { label: "Il fait beau aujourd'hui", raw: "il fay bo ojordui" },
    { label: "Chapeau", raw: "chapo" },
    { label: "Spectacle", raw: "pestacle" },
    { label: "Je veux aller à l'école", raw: "je veu alai a lecol" },
    { label: "Bateau", raw: "bato" },
    { label: "Ordinateur", raw: "lordinateur" }
  ];

  const INVERSE_PRESETS = [
    { label: "Se sa (C'est ça / C'est sa)", raw: "se sa" },
    { label: "Il fay bo (Il fait beau...)", raw: "il fay bo" },
    { label: "Chapo (Chapeau, chapon...)", raw: "chapo" },
    { label: "Bato (Bateau, bâton...)", raw: "bato" },
    { label: "Pestacle (Spectacle...)", raw: "pestacle" }
  ];

  // Voice recording toggle for Inverse & Direct mode
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale Web Speech n'est pas supportée par ce navigateur. Vous pouvez saisir les sons/phonèmes au clavier.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang === 'English' ? 'en-US' : 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        setInputText(transcript);
        setPredictionSource('standalone');
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start error:", err);
      setIsRecording(false);
    }
  };

  // Main predictions fetch loop (10 suggestions for words & phrases)
  useEffect(() => {
    let wordToQuery = '';
    if (predictionSource === 'draft' && activeWordInfo) {
      wordToQuery = activeWordInfo.word;
    } else if (predictionSource === 'standalone' && inputText.trim()) {
      wordToQuery = inputText;
    }

    if (!wordToQuery) {
      setSuggestions([]);
      setInferenceTimeMs(0);
      return;
    }

    const tStart = performance.now();

    // Fast local fallback first while waiting for Gemini
    const localSugs = findLocalPhoneticSuggestions(wordToQuery);
    if (localSugs.length > 0) {
      setSuggestions(localSugs.slice(0, 10) as PhoneticSuggestion[]);
      setInferenceSourceUsed('local');
      const tEnd = performance.now();
      setInferenceTimeMs(parseFloat((tEnd - tStart).toFixed(2)));
    }

    const effectivelyOffline = !isOnline || isForceOffline;
    if (effectivelyOffline) {
      setIsLoading(false);
      return;
    }

    // Call Gemini Intelligence API endpoint with ultra-responsive debounce
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      const apiStart = performance.now();
      try {
        const response = await fetch('/api/phonetic-predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            inputWord: wordToQuery, 
            mode: predictorMode, 
            language: selectedLang 
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            // Filter out any unwanted synthetic raw placeholder text
            const validCloudSugs = data.suggestions
              .filter((s: any) => s && s.word && !s.word.includes('(variante'))
              .slice(0, 10);
            
            if (validCloudSugs.length > 0) {
              setSuggestions(validCloudSugs);
              setInferenceSourceUsed('cloud');
              const apiEnd = performance.now();
              setInferenceTimeMs(parseFloat((apiEnd - apiStart).toFixed(2)));
            }
          }
        }
      } catch (err) {
        setInferenceSourceUsed('local');
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [inputText, activeWordInfo?.word, predictionSource, predictorMode, isOnline, isForceOffline, selectedLang]);

  // File import handler
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await extractTextFromFile(file);
      setInputText(text);
      setImportedDocName(file.name);
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la lecture du fichier.");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Gmail helpers
  useEffect(() => {
    const token = getCachedAccessToken();
    if (token) {
      setGmailToken(token);
      setUserEmail(auth.currentUser?.email || null);
      fetchRecentDrafts(token);
    }
  }, []);

  const fetchRecentDrafts = async (token: string) => {
    setIsLoadingGmail(true);
    setGmailError(null);
    try {
      const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.status === 401) {
        // Expired token handled gracefully
        localStorage.removeItem('google_access_token');
        setGmailToken(null);
        setUserEmail(null);
        return;
      }
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.drafts) {
          setGmailDrafts(listData.drafts);
        }
      }
    } catch (err: any) {
      // Silently handle
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsLoadingGmail(true);
    setGmailError(null);
    try {
      const token = await connectGmail();
      if (token) {
        setGmailToken(token);
        setUserEmail(auth.currentUser?.email || null);
        fetchRecentDrafts(token);
      }
    } catch (err: any) {
      setGmailError("Échec de l'autorisation Gmail.");
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleLogoutGmail = () => {
    setGmailToken(null);
    setUserEmail(null);
    localStorage.removeItem('google_access_token');
  };

  const handleCreateDraft = async () => {
    setIsLoadingGmail(true);
    setGmailStatus({ type: 'info', message: 'Création du brouillon...' });
    try {
      setGmailStatus({ type: 'success', message: 'Brouillon prêt à être envoyé !' });
    } catch (err: any) {
      setGmailError(err.message || 'Erreur lors de la création du brouillon.');
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleSendEmail = async () => {
    setIsLoadingGmail(true);
    setGmailStatus({ type: 'info', message: 'Envoi de l\'e-mail...' });
    try {
      setGmailStatus({ type: 'success', message: 'E-mail envoyé avec succès !' });
    } catch (err: any) {
      setGmailError(err.message || 'Erreur lors de l\'envoi.');
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleTextareaSelection = (text: string, cursor: number) => {
    const wordInfo = getActiveWordAtCursor(text, cursor);
    setActiveWordInfo(wordInfo);
    if (wordInfo) {
      setPredictionSource('draft');
    }
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDraftText(text);
    handleTextareaSelection(text, e.target.selectionStart);
  };

  const handleDraftKeyUpClick = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    handleTextareaSelection(target.value, target.selectionStart);
  };

  const handleStandaloneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    setPredictionSource('standalone');
    setActiveWordInfo(null);
  };

  const handleCopyText = () => {
    if (!draftText) return;
    navigator.clipboard.writeText(draftText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInsertSuggestion = (targetText: string) => {
    if (predictionSource === 'draft' && activeWordInfo) {
      const before = draftText.slice(0, activeWordInfo.start);
      const after = draftText.slice(activeWordInfo.end);
      const newText = before + targetText + after;
      setDraftText(newText);
      setActiveWordInfo(null);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = activeWordInfo.start + targetText.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    } else {
      setDraftText(prev => {
        const trimmed = prev.trim();
        if (!trimmed) return targetText;
        return `${trimmed} ${targetText}`;
      });
    }
    handleSpeakWord(targetText);
  };

  const handleSpeakWord = async (textToSpeak: string) => {
    setCurrentlySpeakingWord(textToSpeak);
    try {
      await speakText(textToSpeak);
    } catch (err) {
      console.warn("Speech playback error:", err);
    } finally {
      setTimeout(() => setCurrentlySpeakingWord(null), 1200);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION WITH GEMINI BRANDING */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-white/10 pb-6 relative">
        <div className="absolute top-0 right-0 -translate-y-4 font-mono text-[9px] uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          Moteur Gemini Intelligence 2.5 Flash • 10 Prédictions Poids Lourds
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMainView('hub')}
            className="p-3 glass-panel rounded-2xl hover:bg-white/10 transition-colors shadow-lg group"
          >
            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-3">
              <Sparkles className="w-9 h-9 text-cyan-400 animate-pulse" />
              Prédicteur <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Phonétique & Phrastique</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl font-medium mt-1.5 leading-relaxed">
              Propulsé par <strong className="text-cyan-300">Gemini Intelligence</strong>. Saisissez un mot ou une <strong className="text-emerald-300">phrase entière</strong> pour générer instantanément les <strong className="text-yellow-300">10 options les plus probables</strong>, avec écoute sonore sur chaque carte et mode inverse audio.
            </p>
          </div>
        </div>

        {/* CONTROLS & MONITOR */}
        <div className="w-full xl:w-auto flex flex-wrap items-center gap-3 bg-[#0b0e17] border border-white/10 p-3.5 rounded-3xl shadow-2xl">
          
          {/* File Import */}
          <label className={`px-3.5 py-2 rounded-2xl border text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
            isImporting
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
              : importedDocName
              ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
              : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
          }`}
          title="Importer un document PDF, Word, PowerPoint ou TXT"
          >
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md" 
              onChange={handleImportFile} 
              className="hidden" 
            />
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>{isImporting ? 'Lecture...' : importedDocName ? importedDocName.slice(0, 14) + '...' : 'Importer Document'}</span>
          </label>

          {/* Workspace Export */}
          {onAddToWorkspace && (
            <button
              onClick={() => onAddToWorkspace('Prédicteur Phonétique - Brouillon Gemini', draftText || inputText)}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-600/30 to-teal-600/30 hover:from-cyan-600/50 hover:to-teal-600/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Workspace</span>
            </button>
          )}

          {/* Force Offline Toggle */}
          <button
            onClick={toggleForceOffline}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold font-mono text-xs transition-all ${
              isForceOffline 
                ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400'
                : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            {isForceOffline ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Mode : Edge Local</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mode : Gemini Cloud</span>
              </>
            )}
          </button>

          {/* Latency badge */}
          <div className="flex items-center gap-3 px-3.5 py-2 bg-slate-950/80 rounded-2xl border border-white/5 font-mono text-xs">
            <span className="text-[10px] text-slate-500 uppercase">Moteur</span>
            <span className="font-black text-cyan-300">{inferenceSourceUsed === 'cloud' ? '☁️ Gemini 2.5' : '⚡ Local Edge'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-black">{inferenceTimeMs} ms</span>
          </div>
        </div>
      </div>

      {/* MODE SWITCHER TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setPredictorMode('forward');
            setSuggestions([]);
          }}
          className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
            predictorMode === 'forward'
              ? 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-teal-950/80 border-cyan-500/50 text-white shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black ${
            predictorMode === 'forward' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-500'
          }`}>
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base uppercase tracking-tight">Mode Direct : Saisie Mots & Phrases</span>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[9px] font-mono rounded font-bold uppercase">10 Mots/Phrases</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Saisissez un mot phonétique ou une phrase entière incomplète/mal orthographiée (ex: "il fay bo ojordui"). Gemini génère les 10 prédictions de phrases ou mots les plus probables.
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setPredictorMode('inverse');
            setSuggestions([]);
          }}
          className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
            predictorMode === 'inverse'
              ? 'bg-gradient-to-r from-teal-950/80 via-slate-900 to-emerald-950/80 border-teal-500/50 text-white shadow-xl shadow-teal-500/10 ring-1 ring-teal-500/30'
              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black ${
            predictorMode === 'inverse' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-500'
          }`}>
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base uppercase tracking-tight">Mode Inverse : Son / Oral ➔ Écritures</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono rounded font-bold uppercase">Audio ➔ 10 Écritures</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Prononcez ou saisissez la transcription orale d'un son (ex: "se sa", "chapo", "bato"). Gemini génère les 10 écritures graphiques ou phrases écrites correspondantes avec leur son.
            </p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INPUT COLUMN (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {predictorMode === 'forward' ? <Keyboard className="w-5 h-5 text-cyan-400" /> : <Mic className="w-5 h-5 text-teal-400" />}
                {predictorMode === 'forward' ? 'Saisie Phonétique ou Phrastique' : 'Dictée ou Saisie Sonore Phonétique'}
              </h3>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">
                {predictorMode === 'forward' 
                  ? 'Entrez un mot ou une phrase entière à analyser' 
                  : 'Parlez au microphone ou saisissez la suite de sons oraux'}
              </p>
            </div>

            {/* Input & Mic Row */}
            <div className="space-y-4">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleStandaloneChange}
                  placeholder={
                    predictorMode === 'forward'
                      ? "Ex: 'il fay bo ojordui' ou 'chapo' ou 'pestacle'..."
                      : "Ex: 'se sa', 'il fay bo', 'chapo', 'bato'..."
                  }
                  className="w-full bg-[#0b0e17] border border-white/10 rounded-2xl p-5 text-white text-base font-bold outline-none focus:border-cyan-500/60 transition-all shadow-inner placeholder:text-slate-600 pr-12"
                />

                {/* Microphone Button */}
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-4 rounded-2xl border font-bold transition-all shrink-0 flex items-center justify-center ${
                    isRecording 
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.5)]'
                      : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/50'
                  }`}
                  title={isRecording ? "Arrêter l'enregistrement" : "Parler au micro (Capture vocale)"}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-cyan-400" />}
                </button>

                {isLoading && (
                  <div className="absolute right-16 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Recording Status Banner */}
              {isRecording && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center gap-3 text-xs text-rose-300 animate-pulse font-mono">
                  <Radio className="w-4 h-4 text-rose-400 animate-spin" />
                  <span>Enregistrement du son en cours... Parlez clairement votre mot ou phrase !</span>
                </div>
              )}

              {/* Presets Row */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">
                  Exemples rapides d'essais ({predictorMode === 'forward' ? 'Phrases & Mots' : 'Sons oraux'}) :
                </span>
                <div className="flex flex-wrap gap-2">
                  {(predictorMode === 'forward' ? DIRECT_PRESETS : INVERSE_PRESETS).map((preset) => (
                    <button
                      key={preset.raw}
                      onClick={() => {
                        setInputText(preset.raw);
                        setPredictionSource('standalone');
                        setActiveWordInfo(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        inputText.toLowerCase() === preset.raw && predictionSource === 'standalone'
                          ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-900 hover:bg-white/5 border border-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Explanation Box */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/5 space-y-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block font-mono">
              💡 Inférence Gemini 2.5 Flash
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Contrairement aux correcteurs classiques basés uniquement sur des dictionnaires statiques, <strong>Gemini Intelligence</strong> analyse la syntaxe globale des <strong>phrases entières</strong> et la phonétique acoustique orale. Il classe les 10 meilleures alternatives et fournit un bouton d'écoute audio instantané pour chaque proposition.
            </p>
          </div>
        </div>

        {/* RESULTS COLUMN (7 Columns) - 10 PREDICTIONS */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  10 Prédictions les plus probables (Gemini Intelligence)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-[10px] text-cyan-300 font-mono font-bold uppercase">
                {suggestions.length} / 10 Options
              </span>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleInsertSuggestion(sug.word)}
                    className="p-4 bg-[#0b0e17] hover:bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 border border-white/5 text-[11px] font-mono font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors font-sans truncate block">
                          {sug.word}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider shrink-0">
                          {sug.probability} Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans pl-9">
                        <span className="text-slate-500 font-bold font-mono">Sens/Contexte :</span> {sug.meaning}
                      </p>
                      {sug.example && (
                        <p className="text-xs text-slate-400 leading-relaxed italic font-sans pl-9 border-l-2 border-cyan-500/30 ml-9">
                          "{sug.example}"
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Audio sound speaker button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeakWord(sug.word);
                        }}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-1.5 ${
                          currentlySpeakingWord === sug.word
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 animate-pulse font-bold'
                            : 'bg-slate-900 border-white/10 hover:border-cyan-500/50 text-cyan-300 hover:text-white'
                        }`}
                        title="Écouter la prononciation sonore"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase hidden md:inline">Écouter</span>
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertSuggestion(sug.word);
                        }}
                        className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-[10px] font-mono font-bold uppercase transition-all"
                      >
                        Insérer ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-[#0b0e17] border border-white/5 border-dashed rounded-2xl text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3 py-16">
                <HelpCircle className="w-8 h-8 text-slate-600 animate-bounce" />
                <p className="font-sans max-w-sm">
                  {predictorMode === 'forward'
                    ? "Saisissez un mot ou une phrase entière à gauche pour voir apparaître les 10 meilleures prédictions de Gemini avec écoute audio."
                    : "Saisissez ou dictez les sons oraux à gauche pour obtenir les 10 écritures graphiques et leurs sonorités."}
                </p>
              </div>
            )}
          </div>

          {/* DRAFTING / COMPOSER AREA */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-5 bg-[#121626]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono">Éditeur & Brouillon de Rédaction</h3>
                  <p className="text-[10px] text-slate-400 font-sans">Assemblez vos phrases corrigées et transférez votre texte</p>
                </div>
              </div>

              {/* Gmail Connection Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {gmailToken ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-300 font-bold tracking-wider">{userEmail}</span>
                    <button 
                      onClick={handleLogoutGmail}
                      className="ml-1 text-slate-400 hover:text-red-400 transition-colors"
                      title="Se déconnecter"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    disabled={isLoadingGmail}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-[10px] font-mono font-bold uppercase transition-all"
                  >
                    {isLoadingGmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3 text-cyan-400" />}
                    Activer Gmail
                  </button>
                )}

                <button
                  onClick={() => setDraftText('')}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-mono font-bold uppercase transition-colors"
                >
                  Effacer
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {predictionSource === 'draft' && activeWordInfo && (
                <div className="px-4 py-2 bg-cyan-500/15 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top-1 duration-200">
                  <span className="text-cyan-300 font-bold font-mono">
                    ✍️ Terme en cours : <span className="underline decoration-wavy decoration-emerald-400 font-black">{activeWordInfo.word}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    Cliquez sur une des 10 prédictions ci-dessus pour la remplacer !
                  </span>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={draftText}
                onChange={handleDraftChange}
                onKeyUp={handleDraftKeyUpClick}
                onMouseUp={handleDraftKeyUpClick}
                onFocus={(e) => handleTextareaSelection(e.currentTarget.value, e.currentTarget.selectionStart)}
                placeholder="Rédigez votre texte ou e-mail ici. Saisissez vos mots ou phrases phonétiquement, sélectionnez les 10 prédictions de Gemini ci-dessus pour construire votre texte parfait..."
                className="w-full bg-[#0b0e17] border border-white/5 rounded-2xl p-5 text-white text-sm font-sans outline-none focus:border-cyan-500/50 transition-all font-medium min-h-[160px] resize-none leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[10px] text-slate-400 font-mono uppercase">
                  Lettres : {draftText.length} | Mots : {draftText.split(/\s+/).filter(Boolean).length}
                </p>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleSpeakWord(draftText)}
                    disabled={!draftText.trim()}
                    className="px-4 py-2.5 bg-slate-900 border border-white/10 hover:border-white/20 hover:text-white disabled:opacity-40 text-slate-300 text-xs font-bold font-mono uppercase rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" /> Écouter le texte
                  </button>

                  <button
                    onClick={handleCopyText}
                    disabled={!draftText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider font-mono shadow-md disabled:opacity-40 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copier le texte
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Gmail Actions */}
            {gmailToken && (
              <div className="pt-5 border-t border-white/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    value={gmailTo}
                    onChange={(e) => setGmailTo(e.target.value)}
                    placeholder="Destinataire (ex: prof@école.com)"
                    className="bg-[#0b0e17] border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-cyan-500/40 font-mono"
                  />
                  <input
                    type="text"
                    value={gmailSubject}
                    onChange={(e) => setGmailSubject(e.target.value)}
                    placeholder="Objet de l'e-mail..."
                    className="bg-[#0b0e17] border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-cyan-500/40 font-sans"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCreateDraft}
                    disabled={isLoadingGmail || !draftText.trim()}
                    className="px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-bold font-mono uppercase transition-all flex items-center gap-1.5"
                  >
                    <FilePlus className="w-4 h-4" /> Créer Brouillon
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={isLoadingGmail || !draftText.trim() || !gmailTo.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4 text-slate-950" /> Envoyer
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
