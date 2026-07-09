import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Check, Copy, RefreshCw, Volume2, HelpCircle, 
  ArrowLeft, Keyboard, Mail, MessageSquare, Clipboard, FileText, CheckCircle,
  Send, FilePlus, ArrowDown, User, AlertTriangle, ShieldCheck, LogOut,
  Zap, Globe
} from 'lucide-react';
import { connectGmail, getCachedAccessToken, auth } from '../../services/firebase';
import { findLocalPhoneticSuggestions, getActiveWordAtCursor } from '../../utils/phoneticEngine';

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
}

export default function PhoneticPredictorView({ setMainView, selectedLang, speakText, injectedText }: PhoneticPredictorViewProps) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (injectedText) {
      setInputText(injectedText);
      setPredictionSource('standalone');
    }
  }, [injectedText]);
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
  const [inferenceSourceUsed, setInferenceSourceUsed] = useState<'local' | 'cloud'>('local');

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

  // --- GMAIL INTEGRATION STATES & HELPERS ---
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: '' });
  const [gmailDrafts, setGmailDrafts] = useState<any[]>([]);
  const [gmailTab, setGmailTab] = useState<'send' | 'import'>('send');
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('');

  // Auto load Gmail token if already authenticated in the turn
  useEffect(() => {
    const token = getCachedAccessToken();
    if (token) {
      setGmailToken(token);
      setUserEmail(auth.currentUser?.email || null);
      fetchRecentDrafts(token);
    }
  }, []);

  const decodeBase64Url = (base64UrlStr: string) => {
    let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      try {
        return atob(base64);
      } catch (err) {
        return '';
      }
    }
  };

  const getBodyText = (payload: any): string => {
    if (!payload) return '';
    if (payload.body && payload.body.data) {
      return decodeBase64Url(payload.body.data);
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          return decodeBase64Url(part.body.data);
        }
        if (part.parts) {
          const subText = getBodyText(part);
          if (subText) return subText;
        }
      }
    }
    return '';
  };

  const makeEmailRaw = (to: string, subject: string, body: string) => {
    const str = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      '',
      body
    ].join('\r\n');
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const fetchRecentDrafts = async (token: string) => {
    setIsLoadingGmail(true);
    setGmailError(null);
    try {
      const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!listRes.ok) {
        if (listRes.status === 401) {
          setGmailToken(null);
          throw new Error("Session Gmail expirée. Veuillez vous reconnecter.");
        }
        throw new Error(`Erreur lors de la récupération des brouillons (${listRes.status})`);
      }
      const listData = await listRes.json();
      if (listData.drafts && listData.drafts.length > 0) {
        const detailedDrafts = await Promise.all(
          listData.drafts.map(async (d: any) => {
            try {
              const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${d.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                const message = detailData.message;
                const headers = message.payload?.headers || [];
                const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Sans objet)';
                const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '(Sans destinataire)';
                const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
                const body = getBodyText(message.payload) || message.snippet || '';
                return {
                  id: d.id,
                  subject,
                  to,
                  date,
                  snippet: message.snippet || '',
                  body
                };
              }
            } catch (err) {
              console.error("Error loading single draft detail:", err);
            }
            return null;
          })
        );
        setGmailDrafts(detailedDrafts.filter(Boolean) as any[]);
      } else {
        setGmailDrafts([]);
      }
    } catch (err: any) {
      console.error("Error fetching drafts:", err);
      setGmailError(err.message || "Impossible de récupérer les brouillons.");
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
      console.error("Gmail authorization error:", err);
      setGmailError("Échec de l'autorisation Gmail.");
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!gmailToken) return;
    const confirmed = window.confirm(`Voulez-vous créer un nouveau brouillon dans votre compte Gmail avec ce texte ?`);
    if (!confirmed) return;

    setIsLoadingGmail(true);
    setGmailStatus({ type: 'info', message: 'Création du brouillon...' });
    try {
      const raw = makeEmailRaw(gmailTo, gmailSubject || 'Brouillon Mount AI Scholar', draftText);
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: { raw }
        })
      });
      if (!res.ok) {
        throw new Error(`Erreur lors de la création du brouillon (${res.status})`);
      }
      setGmailStatus({ type: 'success', message: 'Brouillon créé avec succès dans votre Gmail !' });
      fetchRecentDrafts(gmailToken);
    } catch (err: any) {
      console.error("Create draft error:", err);
      setGmailStatus({ type: 'error', message: err.message || 'Échec de la création.' });
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleSendEmail = async () => {
    if (!gmailToken) return;
    if (!gmailTo.trim()) {
      setGmailStatus({ type: 'error', message: 'Veuillez saisir un destinataire.' });
      return;
    }
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir envoyer cet e-mail à "${gmailTo}" ?`);
    if (!confirmed) return;

    setIsLoadingGmail(true);
    setGmailStatus({ type: 'info', message: "Envoi de l'e-mail..." });
    try {
      const raw = makeEmailRaw(gmailTo, gmailSubject || 'Message Mount AI Scholar', draftText);
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      if (!res.ok) {
        throw new Error(`Erreur lors de l'envoi (${res.status})`);
      }
      setGmailStatus({ type: 'success', message: 'E-mail envoyé avec succès !' });
      setGmailTo('');
      setGmailSubject('');
    } catch (err: any) {
      console.error("Send email error:", err);
      setGmailStatus({ type: 'error', message: err.message || "Échec de l'envoi." });
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleLogoutGmail = () => {
    setGmailToken(null);
    setUserEmail(null);
    setGmailDrafts([]);
    setGmailStatus({ type: null, message: '' });
  };

  // Common quick French dyslexic spelling errors for Instant Offline Response
  const PRESET_ERRORS = [
    { label: "Chapeau", raw: "chapo" },
    { label: "Bateau", raw: "bato" },
    { label: "Spectacle", raw: "pestacle" },
    { label: "Magnifique", raw: "magnyfyk" },
    { label: "Ordinateur", raw: "lordinateur" },
    { label: "Bilingue", raw: "bilinge" }
  ];

  // Real-time local-first multi-source prediction routine with background API correction
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

    // Phase 1: Zero-latency (0ms) client-side spelling suggestion resolver
    const localSugs = findLocalPhoneticSuggestions(wordToQuery);
    if (localSugs.length > 0) {
      setSuggestions(localSugs as PhoneticSuggestion[]);
      setInferenceSourceUsed('local');
      const tEnd = performance.now();
      setInferenceTimeMs(parseFloat((tEnd - tStart).toFixed(2)));
    }

    const effectivelyOffline = !isOnline || isForceOffline;

    // Phase 2: Background smart prediction using Gemini via Express server API (skipped if offline)
    if (effectivelyOffline) {
      setIsLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      const apiStart = performance.now();
      try {
        const response = await fetch('/api/phonetic-predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputWord: wordToQuery, language: selectedLang })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setInferenceSourceUsed('cloud');
            const apiEnd = performance.now();
            setInferenceTimeMs(parseFloat((apiEnd - apiStart).toFixed(2)));
          }
        }
      } catch (err) {
        console.warn("Background API prediction failed, relying entirely on local engine:", err);
        setInferenceSourceUsed('local');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [inputText, activeWordInfo?.word, predictionSource, isOnline, isForceOffline]);

  // Handler for text area changes & cursor repositioning
  const handleTextareaSelection = (text: string, cursor: number) => {
    const wordInfo = getActiveWordAtCursor(text, cursor);
    setActiveWordInfo(wordInfo);
    if (wordInfo) {
      setPredictionSource('draft');
      const localSugs = findLocalPhoneticSuggestions(wordInfo.word);
      setSuggestions(localSugs as PhoneticSuggestion[]);
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
    if (val.trim()) {
      const localSugs = findLocalPhoneticSuggestions(val);
      setSuggestions(localSugs as PhoneticSuggestion[]);
    } else {
      setSuggestions([]);
    }
  };

  const handleCopyText = () => {
    if (!draftText) return;
    navigator.clipboard.writeText(draftText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInsertSuggestion = (word: string) => {
    if (predictionSource === 'draft' && activeWordInfo) {
      const before = draftText.slice(0, activeWordInfo.start);
      const after = draftText.slice(activeWordInfo.end);
      
      const newText = before + word + after;
      setDraftText(newText);
      
      // Clear active word info to close prediction
      setActiveWordInfo(null);
      setSuggestions([]);

      // Focus back to textarea and move cursor right after the corrected word!
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = activeWordInfo.start + word.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    } else {
      // Standalone insertion (append)
      setDraftText(prev => {
        const trimmed = prev.trim();
        if (!trimmed) return word;
        return `${trimmed} ${word}`;
      });
    }
    speakText(word);
  };

  const handleSpeakSuggestion = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    speakText(word);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION WITH PWA DIAGNOSTIC BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-white/10 pb-8 relative">
        <div className="absolute top-0 right-0 -translate-y-4 font-mono text-[9px] uppercase tracking-widest text-emerald-400/80 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          PWA Autonome Active — Ready for Chromebooks
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMainView('hub')}
            className="p-3 glass-panel rounded-2xl hover:bg-white/10 transition-colors shadow-lg group"
          >
            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:translate-x-1 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
              Prédicteur <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">Phonétique</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl font-medium mt-1.5 leading-relaxed">
              Outil ultra-rapide de correction d'orthographe pour dyslexiques. Saisissez votre mot tel qu'il se prononce, l'IA suggère les probabilités du mot visé avec explications et exemples.
            </p>
          </div>
        </div>

        {/* PWA & OFFLINE COGNITIVE PANEL */}
        <div className="w-full xl:w-auto flex flex-wrap items-center gap-3 bg-[#0b0e17] border border-white/5 p-4 rounded-3xl shadow-2xl">
          {/* Real network status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 rounded-2xl border border-white/5 text-xs font-bold font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} inline-block`}></span>
            <span className="text-white/80">{isOnline ? 'Internet : Connecté' : 'Internet : Déconnecté'}</span>
          </div>

          {/* Execution Mode Toggle */}
          <button
            onClick={toggleForceOffline}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold font-mono text-xs transition-all ${
              isForceOffline 
                ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/5'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
            }`}
          >
            {isForceOffline ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Mode : Local Edge (Forcé)</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mode : Auto (Cloud + Edge)</span>
              </>
            )}
          </button>

          {/* Latency & Source Monitor */}
          <div className="flex items-center gap-4 px-3.5 py-2 bg-slate-950/80 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Moteur d'Inférence</span>
              <span className="text-xs font-black font-mono text-white">
                {isForceOffline || !isOnline ? '⚡ In-Browser Edge' : (inferenceSourceUsed === 'cloud' ? '☁️ Gemini Cloud' : '⚡ Local Fallback')}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Temps Réponse</span>
              <span className={`text-xs font-black font-mono ${inferenceTimeMs < 10 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {inferenceTimeMs > 0 ? `${inferenceTimeMs} ms` : '0.00 ms'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INPUT AND SUGGESTIONS (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-yellow-400" />
                Saisie Phonétique
              </h3>
              <p className="text-xs text-white/40 font-mono uppercase tracking-wider mt-1">
                Tapez le mot avec sa mauvaise orthographe
              </p>
            </div>

            {/* Input Box */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleStandaloneChange}
                  placeholder="Exemple: chapo, batos, pestacle..."
                  className="w-full bg-[#0b0e17] border border-white/5 rounded-2xl p-5 text-white text-base font-bold outline-none focus:border-yellow-500/50 transition-all shadow-inner placeholder:text-slate-700"
                />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Preset Errors Chips */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Tester des erreurs fréquentes :</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ERRORS.map((preset) => (
                    <button
                      key={preset.raw}
                      onClick={() => {
                        setInputText(preset.raw);
                        setPredictionSource('standalone');
                        setActiveWordInfo(null);
                        const localSugs = findLocalPhoneticSuggestions(preset.raw);
                        setSuggestions(localSugs as PhoneticSuggestion[]);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        inputText.toLowerCase() === preset.raw && predictionSource === 'standalone'
                          ? 'bg-yellow-500/15 border border-yellow-500/40 text-yellow-400'
                          : 'bg-slate-900 hover:bg-white/5 border border-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.label} ({preset.raw})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Theoretical Note Card */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/5 space-y-3">
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest block font-mono">Comment ça marche ?</span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Le prédicteur phonétique utilise notre réseau asynchrone d'inférence de façon à déduire par similarité acoustique et orthographique le mot ciblé. Il offre aux dyslexiques un outil de dactylographie assistée à latence minimale.
            </p>
          </div>
        </div>

        {/* RESULTS AND COMPOSE SPACE (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SUGGESTION LIST */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                {predictionSource === 'draft' && activeWordInfo 
                  ? `Suggestions pour "${activeWordInfo.word}"` 
                  : 'Suggestions de Correction'}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Latence: {isLoading ? 'Calcul...' : '0ms local'}</span>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleInsertSuggestion(sug.word)}
                    className="p-5 bg-[#0b0e17] hover:bg-white/[0.03] border border-white/5 hover:border-yellow-500/30 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-white group-hover:text-yellow-400 transition-colors uppercase font-mono">
                          {sug.word}
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          {sug.probability} Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        <span className="text-slate-500 font-bold font-mono">Signification:</span> {sug.meaning}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed italic font-sans pl-3 border-l-2 border-yellow-500/30">
                        "{sug.example}"
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleSpeakSuggestion(e, sug.word)}
                        className="p-3.5 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white transition-all"
                        title="Écouter le mot"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-bold text-yellow-400 group-hover:translate-x-1 transition-transform uppercase font-mono hidden sm:block">
                        Insérer ➔
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-[#0b0e17] border border-white/5 border-dashed rounded-2xl text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 py-12">
                <HelpCircle className="w-6 h-6 text-slate-600 animate-bounce" />
                <p className="font-sans">Saisissez un mot phonétique à gauche pour faire apparaître les suggestions et contextes de correction.</p>
              </div>
            )}
          </div>

          {/* DRAFTING/EMAIL SPACE (COMPOSE & COPY) */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-5 bg-[#121626]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono">Brouillon de Rédaction Rapide</h3>
                  <p className="text-[10px] text-slate-500 font-sans">Rédigez vos e-mails ou messages ici, puis connectez Gmail</p>
                </div>
              </div>

              {/* GMAIL CONNECTION INDICATOR */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {gmailToken ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-300 font-bold tracking-wider">{userEmail}</span>
                    <button 
                      onClick={handleLogoutGmail}
                      className="ml-1 text-slate-400 hover:text-red-400 transition-colors"
                      title="Se déconnecter de Gmail"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    disabled={isLoadingGmail}
                    className="gsi-material-button flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-xl text-[10px] font-mono font-bold uppercase transition-all duration-300 shadow-[0_0_15px_rgba(234,179,8,0.1)] active:scale-95"
                  >
                    {isLoadingGmail ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Mail className="w-3 h-3 text-yellow-400" />
                    )}
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
                <div className="px-4 py-2 bg-yellow-500/15 border border-yellow-500/30 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top-1 duration-200">
                  <span className="text-yellow-400 font-bold font-mono">
                    ✍️ Mot en cours d'écriture : <span className="underline decoration-wavy decoration-red-500 font-black">{activeWordInfo.word}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    Cliquez sur une suggestion ci-dessus pour la remplacer à la volée !
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
                placeholder="Écrivez votre e-mail ici. Saisissez vos mots phonétiquement (ex: 'chapo', 'bato', 'pestacle'), les suggestions s'affichent instantanément à la volée ci-dessus pour que vous puissiez les remplacer en un seul clic."
                className="w-full bg-[#0b0e17] border border-white/5 rounded-2xl p-5 text-white text-sm font-sans outline-none focus:border-yellow-500/50 transition-all font-medium min-h-[160px] resize-none leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[10px] text-slate-500 font-mono uppercase">
                  Lettres: {draftText.length} | Mots: {draftText.split(/\s+/).filter(Boolean).length}
                </p>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => speakText(draftText)}
                    disabled={!draftText.trim()}
                    className="px-4 py-2.5 bg-slate-900 border border-white/10 hover:border-white/20 hover:text-white disabled:opacity-40 text-slate-300 text-xs font-bold font-mono uppercase rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4" /> Écouter Brouillon
                  </button>

                  <button
                    onClick={handleCopyText}
                    disabled={!draftText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider font-mono shadow-md disabled:opacity-40 transition-all flex items-center gap-1.5 active:scale-95"
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

            {/* GMAIL API COMPARTMENT */}
            {gmailToken && (
              <div className="pt-6 border-t border-white/5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* TABS SELECTOR */}
                <div className="flex border-b border-white/5 pb-1 gap-4">
                  <button
                    onClick={() => setGmailTab('send')}
                    className={`pb-3 text-xs font-black uppercase tracking-wider font-mono transition-all border-b-2 ${
                      gmailTab === 'send'
                        ? 'border-yellow-500 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Envoyer & Créer
                  </button>
                  <button
                    onClick={() => {
                      setGmailTab('import');
                      fetchRecentDrafts(gmailToken);
                    }}
                    className={`pb-3 text-xs font-black uppercase tracking-wider font-mono transition-all border-b-2 flex items-center gap-2 ${
                      gmailTab === 'import'
                        ? 'border-yellow-500 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Importer un Brouillon
                    {gmailDrafts.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-[9px] font-bold text-yellow-400">
                        {gmailDrafts.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* NOTIFICATIONS & ERRORS */}
                {gmailStatus.message && (
                  <div className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
                    gmailStatus.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : gmailStatus.type === 'error'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{gmailStatus.message}</span>
                    </div>
                    <button 
                      onClick={() => setGmailStatus({ type: null, message: '' })}
                      className="text-[10px] uppercase font-bold hover:underline"
                    >
                      Fermer
                    </button>
                  </div>
                )}

                {gmailError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{gmailError}</span>
                  </div>
                )}

                {/* TAB CONTENT: SEND */}
                {gmailTab === 'send' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Destinataire (To) :</label>
                        <input
                          type="email"
                          value={gmailTo}
                          onChange={(e) => setGmailTo(e.target.value)}
                          placeholder="destinataire@exemple.com"
                          className="w-full bg-[#0b0e17] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-yellow-500/40 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Objet (Subject) :</label>
                        <input
                          type="text"
                          value={gmailSubject}
                          onChange={(e) => setGmailSubject(e.target.value)}
                          placeholder="Sujet de l'e-mail..."
                          className="w-full bg-[#0b0e17] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-yellow-500/40 transition-all font-sans font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={handleCreateDraft}
                        disabled={isLoadingGmail || !draftText.trim()}
                        className="px-4 py-2.5 rounded-xl border border-yellow-500/30 hover:bg-yellow-500/10 disabled:opacity-40 text-yellow-400 text-xs font-bold font-mono uppercase transition-all flex items-center gap-2"
                        title="Créer un brouillon dans Gmail"
                      >
                        {isLoadingGmail && gmailStatus.type === 'info' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FilePlus className="w-4 h-4" />
                        )}
                        Créer Brouillon Gmail
                      </button>

                      <button
                        onClick={handleSendEmail}
                        disabled={isLoadingGmail || !draftText.trim() || !gmailTo.trim()}
                        className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-yellow-500/10"
                        title="Envoyer l'e-mail directement"
                      >
                        {isLoadingGmail && gmailStatus.type === 'info' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-slate-950" />
                        )}
                        Envoyer par E-mail
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: IMPORT */}
                {gmailTab === 'import' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                        Brouillons récents détectés sur votre Gmail :
                      </span>
                      <button
                        onClick={() => fetchRecentDrafts(gmailToken)}
                        disabled={isLoadingGmail}
                        className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all hover:scale-105"
                        title="Rafraîchir la liste"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {isLoadingGmail && gmailDrafts.length === 0 ? (
                      <div className="flex items-center justify-center gap-2.5 py-8">
                        <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />
                        <span className="text-xs font-mono text-slate-400">Chargement des brouillons...</span>
                      </div>
                    ) : gmailDrafts.length > 0 ? (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {gmailDrafts.map((draft) => (
                          <div
                            key={draft.id}
                            className="p-4 bg-[#0b0e17] hover:bg-white/[0.02] border border-white/5 rounded-xl flex items-start justify-between gap-4 group transition-all"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white uppercase font-sans truncate block">
                                  {draft.subject}
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-800 border border-white/5 rounded text-[8px] font-mono text-slate-400 block shrink-0">
                                  ID: {draft.id.substring(0, 6)}...
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono">
                                À : {draft.to} | Date : {new Date(draft.date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-slate-400 leading-relaxed truncate font-sans">
                                {draft.snippet}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const confirmed = window.confirm(`Voulez-vous charger ce brouillon dans l'éditeur ? Cela remplacera votre texte actuel.`);
                                if (confirmed) {
                                  setDraftText(draft.body || draft.snippet);
                                  setGmailSubject(draft.subject !== '(Sans objet)' ? draft.subject : '');
                                  setGmailTo(draft.to !== '(Sans destinataire)' ? draft.to : '');
                                  setGmailTab('send');
                                }
                              }}
                              className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-slate-950 font-bold font-mono text-[10px] uppercase rounded-lg transition-all shrink-0 active:scale-95"
                            >
                              Charger
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-[#0b0e17] border border-white/5 border-dashed rounded-xl text-center text-slate-500 text-xs">
                        Aucun brouillon trouvé dans votre boîte de réception Gmail.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
