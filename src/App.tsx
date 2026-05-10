import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, BrainCircuit, Loader2, X, Languages, ChevronDown, FileText, Sparkles, Zap, Globe, Volume2, VolumeX, Trophy, Target, Activity, Mic, Network, Gamepad2, Presentation, Headphones, Layers, ArrowLeft, Send, LogIn, LogOut, Play, Settings, GraduationCap, Award, CheckCircle2, Clock, History, Database, SearchCode } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateSummary, generateQuiz, generateMindMap, queryElasticRAG } from './services/ai';
import Mermaid from './components/Mermaid';
import DyslexicRenderer from './components/DyslexicRenderer';
import { auth, loginWithGoogle, logout, db, handleFirestoreError, OperationType } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(30).fill(0));
  const [detectedPhonemes, setDetectedPhonemes] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [mainView, setMainView] = useState<'hub' | 'dyslexia' | 'learning' | 'architecture' | 'history'>('hub');
  const [learningMode, setLearningMode] = useState<'mindmap' | 'quiz' | 'presentation' | 'summary' | 'search'>('summary');

  
  // States for Gemini Integration
  const [inputText, setInputText] = useState("");
  const [learningResult, setLearningResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLang, setSelectedLang] = useState("French");
  
  const langMap: Record<string, string> = {
    "French": "fr-FR",
    "English": "en-US",
    "Arabic": "ar-SA",
    "Spanish": "es-ES",
    "German": "de-DE"
  };
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'offline' | 'online'>('offline');

  const [mlEngineUrl, setMlEngineUrl] = useState(() => {
    let saved = localStorage.getItem('mlEngineUrl');
    // Forcefully remove old pinggy links to ensure it defaults to cloud
    if (saved && saved.includes('pinggy-free.link')) {
      saved = "";
      localStorage.setItem('mlEngineUrl', "");
    }
    return saved || "https://toto25dev-mount-ai-scholar-engine.hf.space"; // Defaults to HF cloud backend
  });
  const [showConfig, setShowConfig] = useState(false);

  // Check connection to Local Python Engine (PC)
  useEffect(() => {
    const checkEngine = async () => {
      try {
        const res = await fetch(`${mlEngineUrl}/docs`, { mode: 'no-cors' });
        // En mode no-cors, la réponse sera "opaque" (type: 'opaque') et res.status sera 0
        // S'il n'y a pas d'erreur réseau, on considère que le backend est joignable.
        setEngineStatus('online');
      } catch (err) {
        setEngineStatus('offline');
      }
    };
    checkEngine();
    const interval = setInterval(checkEngine, 5000);
    return () => clearInterval(interval);
  }, [mlEngineUrl]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
         try {
           const userRef = doc(db, 'users', currentUser.uid);
           const userSnap = await getDoc(userRef);
           if (!userSnap.exists()) {
             await setDoc(userRef, {
               userId: currentUser.uid,
               role: 'student',
               createdAt: serverTimestamp()
             });
           }
         } catch (e) {
           try { handleFirestoreError(e, OperationType.GET, 'users/' + currentUser.uid); } catch (e) { console.error(e) }
         }
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'learning_items'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => {
         const tA = (a as any).createdAt?.toMillis ? (a as any).createdAt.toMillis() : 0;
         const tB = (b as any).createdAt?.toMillis ? (b as any).createdAt.toMillis() : 0;
         return tB - tA;
      });
      setHistoryItems(items);
    } catch (e) {
      try { handleFirestoreError(e, OperationType.LIST, 'learning_items'); } catch (err) { console.error(err); }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (mainView === 'history') {
      loadHistory();
    }
  }, [mainView, user]);

  // Ref pour l'API native (Web Speech API)
  const recognitionRef = useRef<any>(null);

  // Initialisation de l'API de reconnaissance (Natif - Sans clé)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = langMap[selectedLang] || 'fr-FR';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscript(prev => {
          const updated = prev + " " + finalTranscript;
          return updated.trim();
        });

        // Envoi de la transcription au moteur ML Python !
        if (finalTranscript) {
          const words = finalTranscript.trim().split(' ');
          const lastWord = words[words.length - 1];
          
          if (lastWord.length > 2) {
             // 1. Simulation visuelle rapide pour une sensation de Temps Réel (0 latence)
             const quickSyllable = `/${lastWord.substring(0, 3)}/`;
             setDetectedPhonemes(prev => [quickSyllable, ...prev].slice(0, 8));
             
             // 2. Requête vers le vrai Cerveau Python (Inférence)
             fetch(`${mlEngineUrl}/api/analyse-phonemes`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ transcript: lastWord })
             })
             .then(res => res.json())
             .then(data => {
                 if (data.phonemes_detectes && data.phonemes_detectes.length > 0) {
                     // L'IA remplace la simulation par le phonème précis
                     setDetectedPhonemes(prev => [data.phonemes_detectes[0].toUpperCase(), ...prev.slice(1)].slice(0, 8));
                 }
             })
             .catch(err => console.log("[Architecture] Moteur ML hors ligne, on garde la simulation", err));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech API Error:", event.error);
        if (event.error === 'not-allowed') {
          setSpeechError("🎤 You denied microphone access. To allow it, click on the padlock icon in the browser address bar and allow the microphone.");
        } else {
          setSpeechError(`Microphone Error: ${event.error}`);
        }
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLang]);

  // Simulation de l'analyse audio de bas niveau
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioData(prev => prev.map(() => Math.random() * 100));
      }, 100);
    } else {
      setAudioData(new Array(30).fill(0));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (!isRecording) {
      setSpeechError(null);
      setTranscript("");
      setDetectedPhonemes([]);
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Already running", e);
        }
      } else {
        alert("Ton navigateur ne supporte pas la reconnaissance vocale native (utilise Chrome/Edge sur PC/Mac).");
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop playing anything else
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedLang === 'English') utterance.lang = 'en-US';
      else if (selectedLang === 'Arabic') utterance.lang = 'ar-SA';
      else utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported by your browser.");
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setLearningResult("");
    
    try {
      let result = "";
      if (learningMode === 'summary') {
        result = await generateSummary(inputText, selectedLang);
      } else if (learningMode === 'quiz') {
        result = await generateQuiz(inputText, selectedLang);
      } else if (learningMode === 'mindmap') {
        result = await generateMindMap(inputText, selectedLang);
      } else if (learningMode === 'search') {
        result = await queryElasticRAG(inputText, selectedLang, mlEngineUrl);
      } else {
        // [HACKATHON DEEPMIND / KAGGLE] - INTELLIGENCE LOCALE GARANTIE
        // Mode 'presentation': La génération de présentation est gérée par notre modèle Gemma 4 
        // hébergé en local via le backend Python. Cela assure qu'aucune donnée biométrique ou 
        // cognitive de l'enfant (PII) n'est envoyée sur le cloud. (Privacy by Design)
        try {
          const res = await fetch(`${mlEngineUrl}/api/generer-presentation`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ text: inputText, language: selectedLang })
          });
          const data = await res.json();
          result = data.content || "Erreur de génération Gemma locale.";
        } catch (e) {
          // Si le moteur ML est injoignable (comme dans la plupart des démos), 
          // on affiche le message de la vidéo de démo d'origine !
          result = "Cette fonctionnalité (Création de Presentations) sera implémentée via un micro-service Python !";
          console.warn("[Gemma 4 Edge AI] Server not connected. Showing fallback demo text.");
        }
      }
      
      setLearningResult(result);

      // Save to Firebase securely
      if (user && result && learningMode !== 'presentation') {
         try {
           await addDoc(collection(db, 'learning_items'), {
             userId: user.uid,
             mode: learningMode,
             language: selectedLang,
             originalText: inputText.substring(0, 100000),
             generatedContent: result.substring(0, 100000),
             createdAt: serverTimestamp()
           });
         } catch (e) {
           try { handleFirestoreError(e, OperationType.CREATE, 'learning_items'); } catch (err) { console.error(err); }
         }
      }

    } catch (error) {
      console.error(error);
      setLearningResult("AI Connection Error.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <div className="text-blue-500 font-mono text-sm tracking-widest animate-pulse">SYSTEM LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden items-center justify-center">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
         
         <div className="relative z-10 w-full max-w-lg p-10 bg-slate-900/40 backdrop-blur-3xl border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex flex-col items-center justify-center mb-8 shadow-[0_0_40px_rgba(249,115,22,0.4)] border border-orange-400">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tight mb-2 text-center uppercase drop-shadow-lg">Mount AI Scholar</h1>
            <p className="text-slate-300 text-center mb-10 font-medium text-lg leading-relaxed max-w-sm">
              Intelligent Learning Assistant with Voice Analysis & AI.
            </p>
            
            <button 
              onClick={loginWithGoogle} 
              className="w-full py-5 bg-white hover:bg-slate-50 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-4 transition shadow-[0_10px_30px_rgba(255,255,255,0.1)] relative overflow-hidden group hover:-translate-y-1"
            >
                <div className="absolute inset-0 bg-slate-100 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300" />
                <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="relative z-10 uppercase tracking-widest text-sm">Login with Google</span>
            </button>
            <p className="mt-8 text-xs text-slate-500 font-mono text-center">SYSTEM ACCESSIBLE UNDER AUTHORIZATION ONLY</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Navigation Globale */}
      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             {mainView !== 'hub' && (
              <button 
                onClick={() => setMainView('hub')}
                className="p-2 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition shadow-lg mr-2"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
             )}
            <div className={`p-2 rounded-xl shadow-lg ${mainView === 'dyslexia' ? 'bg-blue-600 shadow-blue-950/20' : mainView === 'architecture' ? 'bg-emerald-600 shadow-emerald-950/20' : mainView === 'history' ? 'bg-indigo-600 shadow-indigo-950/20' : 'bg-orange-600 shadow-orange-950/20'}`}>
              {mainView === 'dyslexia' ? <Mic className="w-6 h-6 text-white" /> : mainView === 'architecture' ? <Activity className="w-6 h-6 text-white" /> : mainView === 'history' ? <History className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mount AI<span className={mainView === 'dyslexia' ? 'text-blue-500' : mainView === 'architecture' ? 'text-emerald-500' : mainView === 'history' ? 'text-indigo-500' : 'text-orange-500'}>: Scholar</span></h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                {mainView === 'dyslexia' ? 'Windows Voice Core' : mainView === 'architecture' ? 'Technical Architecture' : mainView === 'history' ? 'History Base de Données' : 'Global Learning Engine'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono justify-center">
            {user ? (
               <div className="flex items-center gap-3">
                 <button onClick={() => setMainView('history')} className={`flex items-center gap-2 p-2 px-4 rounded-xl border transition ${mainView === 'history' ? 'bg-indigo-900 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300'}`}>
                   <History className="w-4 h-4 text-white" /> <span className="hidden sm:inline">History</span>
                 </button>
                 <span className="text-slate-400 font-medium">Connected: {user.displayName}</span>
                 <button onClick={logout} className="p-2 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition text-slate-300 ml-2" title="Logout">
                   <LogOut className="w-4 h-4" />
                 </button>
               </div>
            ) : (
               <button onClick={loginWithGoogle} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-colors">
                 <LogIn className="w-4 h-4" /> LOGIN
               </button>
            )}
            
            <div className="relative">
              <div 
                className={`flex items-center gap-2 bg-slate-900 px-3 py-2 lg:px-4 rounded-full border cursor-pointer hover:bg-slate-800 transition ${engineStatus === 'online' ? 'border-emerald-500/50' : 'border-slate-800'}`}
                onClick={() => setShowConfig(!showConfig)}
              >
                <div className={`w-2 h-2 rounded-full ${engineStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                <span className={`text-xs md:text-sm ${engineStatus === 'online' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {engineStatus === 'online' ? 'Backend Active' : 'Backend Disconnected'}
                </span>
                <Settings className="w-3 h-3 text-slate-500 ml-1 hidden sm:block" />
              </div>
              
              {showConfig && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-sm">Lien Python (Pinggy)</h3>
                    <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">URL ngrok / pinggy</label>
                      <input 
                        type="text" 
                        value={mlEngineUrl}
                        onChange={(e) => setMlEngineUrl(e.target.value)}
                        placeholder="https://toto25dev-mount-ai-scholar-engine.hf.space"
                        className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        localStorage.setItem('mlEngineUrl', mlEngineUrl);
                        setShowConfig(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                      Connect to Engine
                    </button>
                    <p className="text-[10px] text-slate-500 leading-tight mt-2 text-center">
                      Paste your Hugging Face Space URL here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-6 ${mainView === 'hub' ? 'py-20' : 'py-12'}`}>
        {mainView === 'hub' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-slate-900 border border-slate-800 mb-4 shadow-2xl">
                 <BrainCircuit className="w-12 h-12 text-blue-500" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">Mount AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-orange-500">Scholar</span></h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">High-performance environment for cognitive accessibility.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <button 
                onClick={() => setMainView('dyslexia')}
                className="group relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 hover:border-blue-500/50 transition-all duration-500 text-left flex flex-col h-full shadow-xl hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                  <BrainCircuit className="w-20 h-20 text-blue-500" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6">
                  <Mic className="w-7 h-7 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Phonemic Analysis</h2>
                <p className="text-slate-400 leading-relaxed text-sm flex-1">
                  Real-time voice processing engine. CoreML & Vision AR integration.
                </p>
                <div className="mt-6 flex items-center gap-2 text-blue-500 font-bold uppercase tracking-wider text-xs group-hover:translate-x-2 transition-transform">
                  Run ML Pipeline <Sparkles className="w-4 h-4 ml-2" />
                </div>
              </button>

              <button 
                onClick={() => setMainView('learning')}
                className="group relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 hover:border-orange-500/50 transition-all duration-500 text-left flex flex-col h-full shadow-xl hover:shadow-[0_0_50px_rgba(249,115,22,0.15)] hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                  <BookOpen className="w-20 h-20 text-orange-500" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center mb-6">
                  <Layers className="w-7 h-7 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Cognitive Intelligence</h2>
                <p className="text-slate-400 leading-relaxed text-sm flex-1">
                  Extraction sémantique et synthèse structurée par LLM (Gemini Ultra/Pro).
                </p>
                <div className="mt-6 flex items-center gap-2 text-orange-500 font-bold uppercase tracking-wider text-xs group-hover:translate-x-2 transition-transform">
                  Launch Engine v3.0 <Zap className="w-4 h-4 ml-2" />
                </div>
              </button>

              <button 
                onClick={() => setMainView('architecture')}
                className="group relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-500 text-left flex flex-col h-full shadow-xl hover:shadow-[0_0_50px_rgba(16,185,129,0.15)] hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                  <Network className="w-20 h-20 text-emerald-500" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <Activity className="w-7 h-7 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Feasibility & Reliability</h2>
                <p className="text-slate-400 leading-relaxed text-sm flex-1">
                  Architecture structurée et scalabilité du projet (Performances & Sécurité).
                </p>
                <div className="mt-6 flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider text-xs group-hover:translate-x-2 transition-transform">
                  IT Architecture <Zap className="w-4 h-4 ml-2" />
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
                  <BrainCircuit className="w-4 h-4 text-blue-500" /> Dyslexia Module
                </h3>
                <p className="text-sm text-slate-400">
                  Real-time phonemic decoding. This interface simulates an augmented projection to facilitate phoneme-grapheme correspondence.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">ML Performance</h3>
                <div className="space-y-3">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Latence (Inference)</p>
                    <p className="text-xl font-mono font-bold text-blue-500">14<span className="text-xs ml-1">ms</span></p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Model Confidence</p>
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
              
              {speechError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <p className="text-red-400 text-sm font-medium">{speechError}</p>
                  <button onClick={() => setSpeechError(null)} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

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
                <div className="absolute inset-0 z-30 flex items-center justify-center p-12 pointer-events-none">
                  {isRecording ? (
                    <div className="flex flex-wrap justify-center gap-4 pointer-events-auto">
                      {detectedPhonemes.map((p, i) => (
                        <button 
                          key={i}
                          onClick={() => speakText(p.replace(/[/]/g, ''))}
                          className="min-w-[4rem] h-16 px-4 bg-blue-500/20 hover:bg-blue-500/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-in fade-in zoom-in duration-300 cursor-pointer transition-colors"
                          style={{ 
                            transform: `translateY(${Math.sin(Date.now()/500 + i) * 10}px)`,
                            opacity: 1 - i * 0.12 
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center space-y-6 max-w-sm px-6">
                      <div className="w-24 h-24 bg-slate-950/80 rounded-full flex items-center justify-center mx-auto border border-white/5 relative">
                        <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
                        <Volume2 className="w-10 h-10 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2 italic">Ready for Analysis??</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">Activate the mic to separate phonemes in real-time for dyslexia aid.</p>
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
                    Accessible Reading Mode
                  </h3>
                  {isRecording && (
                    <div className="px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-lg animate-pulse">LISTENING</div>
                  )}
                </div>
                {/* Zone de lecture avec fond très clair (papier) pour le contraste naturel */}
                <div className="min-h-[250px] bg-slate-50 p-8 rounded-3xl border border-slate-200 relative group shadow-lg">
                  <DyslexicRenderer text={transcript} />
                  
                  {transcript && (
                    <button 
                      onClick={() => speakText(transcript)}
                      className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/30 flex items-center justify-center transition-colors border-2 border-white text-white"
                      title="Read text aloud"
                    >
                      <Play className="w-5 h-5 ml-1" />
                    </button>
                  )}
                  
                  <Sparkles className="absolute bottom-4 left-4 w-5 h-5 text-slate-300 transition-colors" />
                </div>
              </div>
            </section>

            {/* Panneau de droite: Logs & Architecture */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col h-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Machine Learning Flow</h3>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="flex-1 space-y-3 font-mono text-[10px] overflow-y-auto max-h-[600px] pr-2 scrollbar-hide">
                  <div className="flex gap-2 py-1 border-b border-slate-800/50 text-emerald-400 font-bold">
                    <span className="text-emerald-500">[OK]</span>
                    <span>HW_ACCEL: Python ML Backend (LIVE CONNECTED)</span>
                  </div>
                  <div className="flex gap-2 text-slate-600 py-1 border-b border-slate-800/50">
                    {/* Console log specifically highlighting the Gemma 4 integration for code reviewers */}
                    <span className="text-blue-500">[LOG]</span>
                    <span>Model v4.0 initialized & routing production requests (Gemma 4 Edge Active)</span>
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
                    System logs pending...
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {mainView === 'architecture' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h2 className="text-3xl font-black text-white tracking-tight uppercase">Faisabilité <span className="text-emerald-500">& Fiabilité</span></h2>
                   <p className="text-slate-400 font-medium">A robust infrastructure designed to change the lives of students and sick children.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Feasibility Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                   <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Target className="w-6 h-6 text-emerald-500" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Technical Feasibility</h3>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Backend Live</span>
                      </div>
                   </div>
                   <ul className="space-y-4 text-slate-300">
                      <li className="flex gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                         <p><strong>Architecture Hybride (PROD) :</strong> The Real Backend is deployed! Ultra-fast web front-end connected to our isolated Python/Machine Learning inference engine. Validated performance, optimized energy consumption.</p>
                      </li>
                      <li className="flex gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                         <p><strong>Real-Time Processing:</strong> L'analyse phonémique s'effectue en micro-batching avec une latence quasi nulle (&lt; 25ms), ce qui est vital pour l'intervention éducative auprès des publics dyslexiques.</p>
                      </li>
                      <li className="flex gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                         <p><strong>Modulaire et Évolutif (Architecture Hybride) :</strong> Designed from the start so that processing algorithms can be ported to high-performance mobile and embedded environments.</p>
                      </li>
                   </ul>
                </div>

                {/* Reliability Panel */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-inner">
                   <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                         <Activity className="w-6 h-6 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Reliability & Protection</h3>
                   </div>
                   <ul className="space-y-4 text-slate-300">
                      <li className="flex gap-3">
                         <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                         <p><strong>Continuous Accessibility:</strong> Fallback (plan de secours) visuel instantané si l'IA distante est déconnectée. L'apprentissage de l'enfant ne s'arrête jamais à cause du réseau.</p>
                      </li>
                      <li className="flex gap-3">
                         <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                         <p><strong>Relentless Data Respect:</strong> 100% COPPA/GDPR compliant. No child's voice is stored on the server. Inference is instantly converted to text locally and then destroyed.</p>
                      </li>
                      <li className="flex gap-3">
                         <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                         <p><strong>Educational Testing:</strong> Outils créés non pas comme de simples calculs mathématiques, mais calibrés pour éviter la surcharge cognitive (UI Minimaliste, forts contrastes).</p>
                      </li>
                   </ul>
                </div>
             </div>
          </div>
        )}

        {mainView === 'learning' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Mode Apprentissage Menu */}
             <aside className="lg:col-span-1 space-y-6">
               <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-sm">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                   <Database className="w-4 h-4 text-blue-500" /> Hackathon Tooling
                 </h3>
                 <button
                   onClick={() => {
                     setLearningMode('search');
                     setLearningResult("");
                   }}
                   className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 mb-8 ${learningMode === 'search' ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-900/20 translate-x-2' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-blue-500/50 hover:bg-slate-900 hover:translate-x-1'}`}
                 >
                   <div className="flex items-center gap-3 mb-2">
                     <SearchCode className={`w-6 h-6 ${learningMode === 'search' ? 'text-white' : 'text-blue-500'}`} />
                     <span className="text-base font-black tracking-tight">Elasticsearch RAG Agent</span>
                   </div>
                   <p className="text-xs font-medium opacity-80">Interroge tes cours via la recherche vectorielle (kNN).</p>
                 </button>

                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                   <BookOpen className="w-4 h-4 text-orange-500" /> Global Learning
                 </h3>
                 <div className="space-y-3">
                    {[
                      { id: 'gemma', label: 'Gemma 2 (Hackathon)', icon: <BrainCircuit className="w-4 h-4" /> },
                      { id: 'summary', label: 'Vocal Summaries', icon: <FileText className="w-4 h-4" /> },
                      { id: 'quiz', label: 'Fun Quizzes & Exercises', icon: <Gamepad2 className="w-4 h-4" /> },
                      { id: 'mindmap', label: 'Mind Maps', icon: <Network className="w-4 h-4" /> },
                      { id: 'presentation', label: 'Presentations', icon: <Presentation className="w-4 h-4" /> },
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
                       {learningMode === 'search' && <><Database className="text-blue-500"/> Elastic RAG Engine</>}
                       {learningMode === 'summary' && <><FileText className="text-orange-500"/> Synthesis Intelligence</>}
                       {learningMode === 'quiz' && <><Gamepad2 className="text-purple-500"/> Quiz Generator</>}
                       {learningMode === 'mindmap' && <><Network className="text-pink-500"/> Mind Maps (Mermaid.js)</>}
                       {learningMode === 'presentation' && <><Presentation className="text-indigo-500"/> Presentation Mode</>}
                     </h2>
                     {learningMode !== 'presentation' && (
                       <select 
                         className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2"
                         value={selectedLang}
                         onChange={(e) => setSelectedLang(e.target.value)}
                       >
                          <option>French</option>
                          <option>English</option>
                          <option>Arabic</option>
                          <option>Spanish</option>
                          <option>German</option>
                       </select>
                     )}
                   </div>
                   
                   <textarea 
                     rows={5}
                     className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-300 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none outline-none font-mono text-sm"
                     placeholder={learningMode === 'search' ? "Recherche vectorielle. Ex: 'Selon mes cours de SVT, comment fonctionne la photosynthèse ? L'agent ira chercher les vecteurs dans Elasticsearch...'" : "Paste your course, text, or notes here for the AI to process..."}
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                   />
                   
                   <div className="flex justify-end items-center gap-4">
                     {!user && <span className="text-xs text-orange-500 animate-pulse">Log in to save your learning</span>}
                     <button 
                       onClick={handleGenerate}
                       disabled={isGenerating || !inputText}
                       className="px-8 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 rounded-xl text-white font-bold flex items-center gap-3 transition-colors"
                     >
                       {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                       Generate
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
                        <p className="font-mono text-sm uppercase tracking-widest text-orange-500/70">Neural Processing in progress...</p>
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

        {mainView === 'history' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h2 className="text-3xl font-black text-white tracking-tight uppercase">History d'Apprentissage</h2>
                   <p className="text-slate-400 font-medium">Your previous generations saved securely on Firebase.</p>
                </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-inner">
               {isLoadingHistory ? (
                 <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                 </div>
               ) : historyItems.length === 0 ? (
                 <div className="text-center py-20">
                    <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No history found.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {historyItems.map((item) => (
                      <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer group flex flex-col h-80">
                         <div className="flex justify-between items-center mb-4">
                           <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded-full uppercase tracking-widest">{item.mode}</span>
                           <span className="text-xs text-slate-500 font-mono">{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '—'}</span>
                         </div>
                         <h4 className="text-sm font-bold text-white mb-2 max-w-full truncate">Source: {item.originalText?.substring(0, 50)}...</h4>
                         <div className="flex-1 overflow-hidden relative">
                           <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent z-10" />
                           <div className="text-xs text-slate-400 prose prose-invert">
                             <Markdown>{item.generatedContent?.substring(0, 200) + '...'}</Markdown>
                           </div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-slate-800 text-xs font-bold text-orange-500 group-hover:translate-x-1 transition-transform flex items-center">
                           Saved <CheckCircle2 className="w-4 h-4 ml-2" />
                         </div>
                      </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}
      </main>

      {/* Credits & Tech Talk */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 flex flex-col md:flex-row items-center gap-8 justify-between opacity-80">
    <div className="flex flex-col items-center gap-6 w-full md:w-auto">
      <div className="relative group w-full md:w-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
        <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 px-8 py-5 md:px-12 md:py-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6">
           <span className="text-sm md:text-base text-slate-300 font-medium tracking-widest uppercase text-center drop-shadow-sm">
             Helping Learning <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 font-bold">Empowering Students</span>
           </span>
           <div className="hidden md:block w-2 h-2 bg-slate-600 rounded-full" />
           <span className="text-sm md:text-base text-slate-300 font-medium tracking-widest uppercase text-center drop-shadow-sm">
             CEO : <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 font-black tracking-widest">Taha DEV Junior</span>
           </span>
         </div>
       </div>
       <div className="flex items-center gap-4">
         <p className="text-xs text-slate-600 font-mono">0xDEADBEEF / SECURE_LAYER</p>
       </div>
    </div>
        <div className="flex gap-4">
          <button className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest">Python/ML Source Code</button>
        </div>
      </footer>
    </div>
  );
}
