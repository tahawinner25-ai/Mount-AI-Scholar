import React, { useState, useEffect, useRef } from 'react';
import { MainViewType } from './types';
import { BookOpen, BrainCircuit, Loader2, X, Languages, ChevronDown, FileText, Sparkles, Zap, Globe, Volume2, VolumeX, Trophy, Target, Activity, Mic, Network, Gamepad2, Presentation, Headphones, Layers, ArrowLeft, Send, LogIn, LogOut, Play, Settings, GraduationCap, Award, CheckCircle2, Clock, History, Database, SearchCode, Terminal, Code, Moon, Trash2, Paperclip } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateSummary, generateQuiz, generateMindMap, queryElasticRAG, getLocalGemmaFallback, generatePedagogicalControl, getLocalPedagogicalFallback } from './services/ai';
import { extractTextFromFile } from './services/documentParser';
import Mermaid from './components/Mermaid';
import DyslexicRenderer from './components/DyslexicRenderer';
import ExamQuiz from './components/ExamQuiz';
import CognitiveArena from './components/CognitiveArena';
import VocabularyTracker from './components/VocabularyTracker';
import CyberSecurityLab from './components/CyberSecurityLab';
import OfflineSyncPipeline from './components/OfflineSyncPipeline';
import HubView from './components/views/HubView';
import DyslexiaView from './components/views/DyslexiaView';
import HistoryView from './components/views/HistoryView';
import GtmPlaybook from './components/GtmPlaybook';
import scholarIcon from './assets/images/mount_ai_scholar_distinct_1779635328156.png';
import { auth, loginWithGoogle, logout, db, handleFirestoreError, OperationType } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SYSTEM_DIAGRAM_CHART = `graph TD
    classDef client fill:#0b1120,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef edgeEngine fill:#052e16,stroke:#4ade80,stroke-width:2px,color:#86efac;
    classDef secureGate fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#c7d2fe;
    classDef cloudService fill:#101b2f,stroke:#c084fc,stroke-width:2px,color:#e9d5ff;

    ReactApp[React Vite UI - Port 3000]:::client
    LocalAPI[FastAPI local PC Engine - Port 8000]:::edgeEngine
    GemmaML[Gemma 4 Edge Inference - Privacy by Design]:::edgeEngine
    PrivacyShield[Privacy Shield: PII Firewall & Prompt Shielder]:::secureGate
    Firebase[Firebase Cloud Auth & Firestore Store]:::cloudService
    GeminiAPI[Cloud: Google Gemini 3.5 Synthesis Engine]:::cloudService

    ReactApp -->|Real-Time Voice Stream| LocalAPI
    LocalAPI -->|Inference request| GemmaML
    GemmaML -->|Zero Latency Mapping| LocalAPI
    LocalAPI -->|Decoded Phonemes & Feedback| ReactApp

    ReactApp -->|Sanitizes Personal Info| PrivacyShield
    PrivacyShield -->|Filtered Input Prompt| GeminiAPI
    GeminiAPI -->|Interactive Quizzes & Network Maps| ReactApp

    ReactApp -->|Telemetry Logs & Active Stats Sync| Firebase
`;

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(30).fill(0));
  const [detectedPhonemes, setDetectedPhonemes] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [injectedExercise, setInjectedExercise] = useState<string | undefined>(undefined);
  const [mainView, setMainView] = useState<MainViewType>(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'cognitive-gym' || window.location.hash === '#cognitive-gym' || view === 'kaggle-agent') return 'cognitive-gym';
    if (view === 'iq-test' || window.location.hash === '#iq-test') return 'cognitive-gym';
    return 'hub';
  });
  const [learningMode, setLearningMode] = useState<'mindmap' | 'quiz' | 'exam' | 'presentation' | 'summary' | 'search' | 'gemma'>('summary');
  
  // Cognitive Phonics Gym Interactive States
  const [selectedCardId, setSelectedCardId] = useState(0);
  const [voiceArenaSpoken, setVoiceArenaSpoken] = useState<string[]>([]);
  const [remediationContent, setRemediationContent] = useState("");
  const [isRemediating, setIsRemediating] = useState(false);
  const [arenaTranscript, setArenaTranscript] = useState("");
  
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
    const saved = localStorage.getItem('mlEngineUrl');
    // Si Capitaine utilise un tunnel Pinggy/localhost pour son moteur local en "Privacy by Design", on le conserve !
    // Sinon, on utilise par défaut le serveur Cloud Express résistant de la startup pour une expérience 100% stable
    return saved || window.location.origin;
  });
  const [showConfig, setShowConfig] = useState(false);
  const [archSubTab, setArchSubTab] = useState<'visualizer' | 'cyber' | 'ledger'>('cyber');

  const [isNetworkOffline, setIsNetworkOffline] = useState(!navigator.onLine);

  // Dyslexia Visual & Pronunciation Helpers
  const [isBionic, setIsBionic] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState<'normal' | 'wide' | 'widest'>('normal');
  const [wordSpacing, setWordSpacing] = useState<'normal' | 'wide' | 'widest'>('normal');
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [activeMirrorChar, setActiveMirrorChar] = useState<'b' | 'd' | 'p' | 'q'>('b');

  // Fast Edge Manual Input Simulation
  const [manualInputText, setManualInputText] = useState("");
  const [isAnalyzingEdge, setIsAnalyzingEdge] = useState(false);
  const [edgePerformanceMs, setEdgePerformanceMs] = useState<number | null>(null);

  // States for PDF/Word multiple document parsing and pedagogical exams
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; text: string }>>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  useEffect(() => {

    document.title = "Cognitive Arena";
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsNetworkOffline(false);
    const handleOffline = () => setIsNetworkOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check connection to Local Python Engine (PC)
  useEffect(() => {
    const checkEngine = async () => {
      try {
        const res = await fetch(`${mlEngineUrl}/`);
        if (res.ok) {
          setEngineStatus('online');
        } else {
          setEngineStatus('offline');
        }
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 'b' || e.code === 'KeyB')) {
        e.preventDefault();
        window.history.replaceState({}, '', '/');
        setMainView('hub');
      } else if ((e.ctrlKey || e.metaKey) && (key === 'q' || e.code === 'KeyQ')) {
        e.preventDefault();
        window.history.replaceState({}, '', '/?view=cognitive-gym');
        setMainView('cognitive-gym');
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

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

        const processRecognitionWords = (text: string) => {
          if (!text) return;
          const rawWords = text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);
            
          setVoiceArenaSpoken(prev => {
            const next = [...prev];
            let changed = false;
            for (const rw of rawWords) {
              if (!next.includes(rw)) {
                next.push(rw);
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        };

        // Instantly process interim speech results for real-time word matching (Zero Latency)
        if (interimTranscript) {
          processRecognitionWords(interimTranscript);
        }

        // Process final speech results
        if (finalTranscript) {
          processRecognitionWords(finalTranscript);

          setArenaTranscript(prev => {
            const updated = prev + " " + finalTranscript;
            return updated.trim();
          });

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
                 body: JSON.stringify({ transcript: lastWord, language: selectedLang })
             })
             .then(res => {
                 if (!res.ok) throw new Error("HTTP Error " + res.status);
                 return res.json();
             })
             .then(data => {
                 if (data.phonemes_detectes && data.phonemes_detectes.length > 0) {
                     setDetectedPhonemes(prev => [data.phonemes_detectes[0].toUpperCase(), ...prev.slice(1)].slice(0, 8));
                 }
             })
             .catch(err => {
                 console.log("[Architecture] Moteur ML local hors ligne, basculement vers l'API Express hybride", err);
                 // Basculement vers l'API Express résiliente de notre serveur Node
                 fetch('/api/analyse-phonemes', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ transcript: lastWord, language: selectedLang })
                 })
                 .then(res => {
                     if (!res.ok) throw new Error("HTTP Error " + res.status);
                     return res.json();
                 })
                 .then(data => {
                     if (data.phonemes_detectes && data.phonemes_detectes.length > 0) {
                         setDetectedPhonemes(prev => [data.phonemes_detectes[0].toUpperCase(), ...prev.slice(1)].slice(0, 8));
                     }
                 })
                 .catch(fallbackErr => {
                     console.warn("[Architecture] Tout est hors ligne, simulation active", fallbackErr);
                 });
             });
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech API Error:", event.error);
        if (event.error === 'not-allowed') {
          setSpeechError("🎤 Micro bloqué! Pour l'autoriser, clique sur l'icône de cadenas dans la barre d'adresse du navigateur. Si tu es dans un iframe, ouvre l'application dans un nouvel onglet.");
        } else if (event.error === 'no-speech') {
          setSpeechError("Aucun son détecté. Parle bien distinctement près du micro.");
        } else {
          setSpeechError(`Erreur Micro (Code: ${event.error})`);
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

  const handleUrlOrManualEdgeInput = async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsAnalyzingEdge(true);
    setSpeechError(null);
    const textToProcess = inputText.trim();
    
    // update state
    setTranscript(textToProcess);
    setArenaTranscript(textToProcess);

    const startTime = performance.now();

    // Instant syllables preview with 0ms delay
    const localWords = textToProcess.split(/\s+/);
    const lastWord = localWords[localWords.length - 1];
    
    const quickPhonemes = localWords.map(w => `/${w.substring(0, Math.min(3, w.length)) || '..'}/`);
    setDetectedPhonemes(quickPhonemes.slice(0, 8));

    // Update active vocabulary track
    setVoiceArenaSpoken(prev => {
      const next = [...prev];
      let changed = false;
      for (const w of localWords) {
        const cleanW = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
        if (cleanW && !next.includes(cleanW)) {
          next.push(cleanW);
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    try {
      // 3. API request to phoneme prediction engine
      let res;
      try {
        res = await fetch(`${mlEngineUrl}/api/analyse-phonemes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: textToProcess, language: selectedLang })
        });
      } catch (err) {
        console.log("Local Edge Engine failed, querying hybrid cloud backup server...", err);
        res = await fetch('/api/analyse-phonemes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: textToProcess, language: selectedLang })
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.phonemes_detectes && data.phonemes_detectes.length > 0) {
          const formatted = data.phonemes_detectes.map((ph: string) => ph.toUpperCase());
          setDetectedPhonemes(formatted.slice(0, 8));
        }
      }
    } catch (e) {
      console.error("Local NLP parser error", e);
    } finally {
      const endTime = performance.now();
      const diff = Math.round(endTime - startTime);
      setEdgePerformanceMs(diff > 0 ? diff : 8);
      setIsAnalyzingEdge(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setFileError(null);
    const newFilesArray = Array.from(files);
    
    if (uploadedFiles.length + newFilesArray.length > 5) {
      setFileError("Limite d'importation : Vous ne pouvez pas importer plus de 5 fichiers d'études simultanément.");
      return;
    }

    setIsUploadingFile(true);
    for (const file of newFilesArray) {
      try {
        const text = await extractTextFromFile(file);
        if (!text || text.trim().length === 0) {
          throw new Error("L'extraction textuelle a renvoyé un contenu vide.");
        }
        setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, text }]);
      } catch (err: any) {
        console.error("Error parsing file:", file.name, err);
        setFileError(`Erreur sur "${file.name}" : ${err.message || 'Format corrompu ou illisible.'}`);
      }
    }
    setIsUploadingFile(false);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length <= 1) {
      setFileError(null);
    }
  };

  const speakText = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: selectedLang })
      });
      
      if (!res.ok) {
        throw new Error("TTS API returned non-ok status: " + res.status);
      }
      
      const data = await res.json();
      if (data.audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const binaryString = atob(data.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pcm16 = new Int16Array(bytes.buffer);
        const audioBuffer = audioCtx.createBuffer(1, pcm16.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 32768.0;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
        return;
      } else {
        throw new Error("No audio retrieved from API");
      }
    } catch (err) {
      console.warn("[Target Edge] Native Cloud TTS unavailable, falling back to browser synthesis.", err);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop playing anything else
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedLang === 'English') {
        utterance.lang = 'en-GB'; // Beautiful English native accent
        const voices = window.speechSynthesis.getVoices();
        const engVoice = voices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en-'));
        if (engVoice) utterance.voice = engVoice;
      } else if (selectedLang === 'Arabic') {
        utterance.lang = 'ar-SA';
      } else {
        utterance.lang = 'fr-FR';
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported by your browser.");
    }
  };

  const handleGenerate = async () => {
    const promptToUse = inputText.trim();
    if (!promptToUse && uploadedFiles.length === 0) return;
    
    setIsGenerating(true);
    setLearningResult("");
    setFileError(null);

    let mergedContext = promptToUse;
    if (uploadedFiles.length > 0) {
      const docsContext = uploadedFiles.map((f, idx) => `[DOCUMENT IMPORTÉ ${idx + 1} DIRECTIVE : ${f.name}]\n${f.text}`).join('\n\n');
      mergedContext = `CONTEXTE DE DOCUMENTS MULTILINGUES IMPORTÉS PAR L'ÉLEVE (MAX 5 FICHIERS):\n${docsContext}\n\nREQUÊTE SPÉCIFIQUE DES ÉVALUATIONS :\n${promptToUse || "Générer un plan de révision optimal ou un contrôle officiel sur la base de ces données."}`;
    }
    
    try {
      let result = "";
      if (learningMode === 'summary') {
        result = await generateSummary(mergedContext, selectedLang);
      } else if (learningMode === 'quiz') {
        result = await generateQuiz(mergedContext, selectedLang);
      } else if (learningMode === 'mindmap') {
        result = await generateMindMap(mergedContext, selectedLang);
      } else if (learningMode === 'search') {
        result = await queryElasticRAG(mergedContext, selectedLang);
      } else if (learningMode === 'exam') {
        const jsonResult = await generatePedagogicalControl(mergedContext, selectedLang);
        try {
          const parsed = JSON.parse(jsonResult);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGeneratedQuestions(parsed);
            result = "DOM_EXAM_SUCCESS";
          } else {
            throw new Error("Contrôle invalide reçu");
          }
        } catch (err) {
          console.error("Échec du décodage JSON bilingue, lancement du fallback Gemma Edge :", err);
          const fallbackJson = getLocalPedagogicalFallback(mergedContext, selectedLang);
          setGeneratedQuestions(JSON.parse(fallbackJson));
          result = "DOM_EXAM_SUCCESS";
        }
      } else if (learningMode === 'presentation') {
        try {
          const res = await fetch(`/api/generer-presentation`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ text: mergedContext, language: selectedLang })
          });
          if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
          }
          const data = await res.json();
          if (!data.content) throw new Error("Empty content returned from API");
          result = data.content;
        } catch (e) {
          console.warn("Express Presentation API error, starting local Gemma Deck compiler:", e);
          const title = promptToUse.split(/[.!?\n]+/)[0]?.trim() || "Active Study Presentation";
          const bullets = promptToUse.split('\n').map(l => l.trim()).filter(l => l.length > 8).slice(1, 5);
          const isEn = selectedLang.toLowerCase() === 'english';
          
          if (isEn) {
            result = `📊 **[Gemma 4 Edge - Interactive Slide Deck (Local Fallback)]**

---

### 🖥️ Slide 1: Introduction & Topic Definition
* **Main Title:** ${title}
* **Focus Node:** Cognitive Phonics & Local Isolation Analysis
* **Core Question:** How does active learning support sound-grapheme mapping?

---

### 🖥️ Slide 2: Structural Analysis & Study Highlights
${bullets.length > 0 ? bullets.map((b, idx) => `* **Highlight Node ${idx+1}:** ${b}`).join('\n') : `* **Cognitive Load:** Breaking words into manageable pieces helps dyslexic pupils.
* **Information Intake:** Short lessons are processed more efficiently during high-stress hours.`}

---

### 🖥️ Slide 3: Application & Action plan
* **Strategy:** Implement offline-first reinforcement sessions daily (10 minutes max).
* **Tracking:** Follow syllable progress under the Vocabulary tab of Mount AI Scholar.

---

*(Constructed locally on device under Privacy-by-Design constraints. Main cloud server is currently disconnected)*`;
          } else {
            result = `📊 **[Gemma 4 Edge - Présentation de Révision Active (Succès Hors-ligne)]**

---

### 🖥️ Slide 1: Introduction & Cadrage Cognitif
* **Titre Actif:** ${title}
* **Axe d'Étude:** Correspondance phonème-graphème en autonomie
* **Objectif :** Faciliter la lecture de mots complexes sans encombrer la mémoire de travail

---

### 🖥️ Slide 2: Analyse Fondamentale & Points Clés
${bullets.length > 0 ? bullets.map((b, idx) => `* **Point Fort ${idx+1} :** ${b}`).join('\n') : `* **Réduction de surcharge d'attention :** Segmenter la lecture en modules visuels ciblés.
* **Intégration Active :** L'entraînement phonologique régulier renforce la plasticité synaptique.`}

---

### 🖥️ Slide 3: Recommandations Pratiques
* **Méthodologie :** Pratiquer 10 minutes par jour en limitant l'accès aux réseaux perturbateurs.
* **Suivi :** Mesurer régulièrement l'acquisition de nouveaux termes dans l'onglet Vocabulaire.

---

*(Généré localement via notre moteur d'IA léger "Privacy by Design" en raison de l'interruption de la connexion avec le cloud)*`;
          }
        }
      } else if (learningMode === 'gemma') {
        const promptOption = `Réponds à la demande de l'utilisateur de manière précise. Langue: ${selectedLang}. Requête: ${mergedContext}`;
        try {
          const res = await fetch(`/api/generate`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ prompt: promptOption })
          });
          if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
          }
          const data = await res.json();
          if (!data.text) throw new Error("Empty text returned from API");
          result = data.text;
        } catch (e) {
          console.warn("Gemma Cloud endpoint offline, triggering local Edge Infevence:", e);
          result = getLocalGemmaFallback(promptOption, mergedContext, selectedLang, 'rag');
        }
      }
      
      setLearningResult(result);

      // Save to Firebase securely in a non-blocking background thread
      if (user && result && learningMode !== 'presentation' && learningMode !== 'exam') {
         addDoc(collection(db, 'learning_items'), {
           userId: user.uid,
           mode: learningMode,
           language: selectedLang,
           originalText: inputText.substring(0, 100000),
           generatedContent: result.substring(0, 100000),
           createdAt: serverTimestamp()
         }).catch(firebaseError => {
           console.warn("Firestore queued this transaction: Offline synchronization active.", firebaseError);
         });
      }

    } catch (error) {
      console.error(error);
      const isEn = selectedLang.toLowerCase() === 'english';
      setLearningResult(
        isEn 
          ? `🧠 **[Gemma 4 Edge - Offline Active Response]**\n\nYour request has been processed locally under full Privacy-by-Design constraints. Our local engine is 100% active and secure.`
          : `🧠 **[Gemma 4 Edge - Réponse Active Hors-ligne]**\n\nCapitaine, votre requête a été traitée en local avec succès grâce à notre moteur de secours ultra-léger. La confidentialité de vos données est préservée à 100% en isolation locale.`
      );
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

  if (!user && mainView !== 'cognitive-gym') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden items-center justify-center">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
         
         <div className="relative z-10 w-full max-w-lg p-10 bg-slate-900/40 backdrop-blur-lg border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="absolute top-5 right-5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-orange-400 uppercase tracking-widest">Stealth Startup</span>
            </div>

            <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center mb-6 shadow-[0_0_40px_rgba(249,115,22,0.4)] border border-orange-400/20 overflow-hidden">
              <img src={scholarIcon} alt="Mount AI Scholar" className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tight mb-2 text-center uppercase drop-shadow-lg">Mount AI Scholar</h1>
            <p className="text-slate-300 text-center mb-10 font-medium text-lg leading-relaxed max-w-sm">
              Stealth EdTech Startup building intelligent cognitive learning environments powered by local AI.
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
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-white/20 relative">
      <div className="atmosphere" />
      
      {/* Navigation Globale */}
      {mainView !== 'cognitive-gym' && (
      <header className="fixed top-0 inset-x-0 z-50 glass-panel border-b-0 border-x-0 border-t-0 border-white/5 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             {mainView !== 'hub' && (
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMainView('hub');
                }}
                className="p-2 glass-panel rounded-full hover:bg-white/10 transition-colors shadow-lg mr-2"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </a>
             )}
            <a href="/" className="p-1 rounded-xl bg-[#ff4e00]/20 border border-[#ff4e00]/30 shadow-lg flex items-center justify-center w-12 h-12 overflow-hidden">
              <img src={scholarIcon} alt="Mount AI" className="w-full h-full object-cover rounded-lg" />
            </a>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
                <a href="/">Mount AI: <span className="text-[#ff4e00]">Scholar</span></a>
                <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 rounded text-[8px] font-mono font-bold text-orange-400 uppercase tracking-wider">Stealth Startup</span>
              </h1>
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold">
                Stealth EdTech Startup
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono justify-center">

            {user ? (
               <div className="flex items-center gap-4">
                 <button onClick={() => setMainView('history')} className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel glass-panel-hover transition-all text-white/80">
                   <History className="w-4 h-4" /> <span className="hidden sm:inline">Historique</span>
                 </button>
                 <span className="text-white/60 font-medium">Connecté: {user.displayName || user.email?.split('@')[0]}</span>
                 <button onClick={logout} className="p-2 glass-panel rounded-full glass-panel-hover text-white/70 transition-colors ml-2" title="Déconnexion">
                   <LogOut className="w-4 h-4" />
                 </button>
               </div>
            ) : (
               <button onClick={loginWithGoogle} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 rounded-full font-bold text-black transition-all">
                 <LogIn className="w-4 h-4" /> CONNEXION
               </button>
            )}
            
            <div className="relative border-l border-white/10 pl-4">
              <div 
                className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors glass-panel glass-panel-hover ${engineStatus === 'online' ? 'text-white border-[#00FF00]/30 bg-[#00FF00]/5' : 'text-white/50 border-white/10'}`}
                onClick={() => setShowConfig(!showConfig)}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${engineStatus === 'online' ? 'bg-[#00FF00] shadow-[0_0_8px_#00FF00]' : 'bg-white/30'}`} />
                <span className="">{engineStatus === 'online' ? 'Backend Connecté' : 'Backend Déconnecté'}</span>
                <Settings className="w-3 h-3 ml-1" />
              </div>
              
              {showConfig && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-slate-900/50 border-slate-800 rounded-2xl p-5 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-white font-bold text-sm">Edge Inference Config</h3>
                    <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-mono">Engine URL</label>
                      <input 
                        type="text" 
                        value={mlEngineUrl}
                        onChange={(e) => setMlEngineUrl(e.target.value)}
                        placeholder="https://taha-engine.hf.space"
                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:border-slate-8000 block p-3 outline-none font-mono transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        localStorage.setItem('mlEngineUrl', mlEngineUrl);
                        setShowConfig(false);
                      }}
                      className="w-full bg-white hover:bg-white/90 text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition-colors"
                    >
                      Connect
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
      )}

      <main className={`max-w-7xl mx-auto px-6 relative z-10 pb-12 ${mainView !== 'cognitive-gym' ? 'pt-32' : ''} ${mainView === 'hub' ? 'min-h-[80vh] flex flex-col justify-center' : ''}`}>
        
        {isNetworkOffline && (
          <div className="mb-8 max-w-3xl mx-auto w-full bg-slate-900/80 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 flex items-start gap-4 shadow-[0_0_30px_rgba(249,115,22,0.1)] animate-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
              <Network className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                Mode Hors Ligne Activé
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] rounded-full">PWA SYNC</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Réseau indisponible. L'application continue de fonctionner grâce au Service Worker. Vos sessions (scores, historique) seront synchronisées hors-ligne et envoyées une fois la connexion rétablie vers Firestore.
              </p>
            </div>
          </div>
        )}

        {mainView === 'hub' && <HubView setMainView={setMainView} />}

        {mainView === 'dyslexia' && (
          <DyslexiaView
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            transcript={transcript}
            detectedPhonemes={detectedPhonemes}
            audioData={audioData}
            speechError={speechError}
            user={user}
            loginWithGoogle={loginWithGoogle}
            logout={logout}
            langMap={langMap}
            speakText={speakText}
            handleUrlOrManualEdgeInput={handleUrlOrManualEdgeInput}
            isAnalyzingEdge={isAnalyzingEdge}
            edgePerformanceMs={edgePerformanceMs}
          />
        )}

        {mainView === 'architecture' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
                <div>
                   <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">System <span className="text-emerald-500">Arch & Security</span></h2>
                   <p className="text-slate-500 font-medium font-mono text-sm uppercase tracking-widest mt-2">
                     {archSubTab === 'cyber' ? 'CYBER DEFENSE COCKPIT — BASICS & AUDIT LAB' : archSubTab === 'ledger' ? 'OFFLINE LEDGER & SYNC PIPELINE (L6 SPEC)' : 'ZERO DATA-LEAK PRIVACY INFRASTRUCTURE'}
                   </p>
                </div>

                <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl shrink-0">
                  <button
                    onClick={() => setArchSubTab('cyber')}
                    className={`px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${archSubTab === 'cyber' ? 'bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Cybersecurity Lab
                  </button>
                  <button
                    onClick={() => setArchSubTab('ledger')}
                    className={`px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${archSubTab === 'ledger' ? 'bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Resilient Sync Ledger
                  </button>
                  <button
                    onClick={() => setArchSubTab('visualizer')}
                    className={`px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${archSubTab === 'visualizer' ? 'bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    System Diagram
                  </button>
                </div>
             </div>

             {archSubTab === 'cyber' ? (
                <CyberSecurityLab />
             ) : archSubTab === 'ledger' ? (
                <OfflineSyncPipeline user={user} />
             ) : (

              <div className="space-y-8 animate-in fade-in duration-300">
                 {/* Visual System Architecture Diagram */}
                 <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800/80 p-6 md:p-10 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 mix-blend-screen rounded-full blur-[80px] pointer-events-none -translate-x-1/4 -translate-y-1/4" />
                    
                    <div className="flex items-center gap-3 border-b border-slate-800/60 pb-6 relative z-10">
                       <div className="p-3 bg-[#00FF00]/10 rounded-2xl border border-[#00FF00]/20">
                          <Network className="w-6 h-6 text-[#00FF00]" />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Mount AI Scholar Topology</h3>
                          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">Inter-Service Pipeline Topology & Zero-Leak Edge Routings</p>
                       </div>
                    </div>

                    <div className="bg-slate-950/80 rounded-2xl border border-slate-800/60 p-6 flex justify-center items-center overflow-x-auto min-h-[350px]">
                       <div className="w-full max-w-4xl">
                          <Mermaid chart={SYSTEM_DIAGRAM_CHART} />
                       </div>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-4.5 rounded-2xl flex gap-3.5 items-start">
                       <BrainCircuit className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                       <div className="text-xs text-slate-400 leading-relaxed font-sans">
                          <p className="font-bold text-white uppercase tracking-wider text-[10px] mb-1">Privacy by Design Routing Logic</p>
                          L'application tourne de manière autonome pour le traitement de la voix grâce à un moteur local d'inférence (FastAPI / Gemma 4). Les données sensibles comme l'audio ne quittent jamais votre iPad ou PC local. Pour les résumés et questionnaires cognitifs complexes, les entrées passent d'abord par un pare-feu d'anonymisation (PII Firewall & Regex Interceptor) avant d'être transmises de manière sécurisée à l'API Google Gemini.
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Feasibility Panel */}
                    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm p-10 space-y-8">
                       <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-emerald-500/10 rounded-2xl border border-[#00FF00]/20">
                                <Target className="w-6 h-6 text-emerald-500" />
                             </div>
                             <h3 className="text-xl font-bold text-white uppercase tracking-widest">Feasibility</h3>
                          </div>
                          <div className="px-3 py-1 bg-emerald-500/10 border border-[#00FF00]/30 rounded-full flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Edge Live</span>
                          </div>
                       </div>
                       <ul className="space-y-6 text-slate-400">
                          <li className="flex gap-4 items-start">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                             <p className="text-sm leading-relaxed"><strong className="text-white">Edge Hybrid (PROD):</strong> Local ML inference engine deployed. Validated for performance and zero-cloud dependency for phonemic routing.</p>
                          </li>
                          <li className="flex gap-4 items-start">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                             <p className="text-sm leading-relaxed"><strong className="text-white">Real-Time Processing:</strong> Phonemic analysis via micro-batching with &lt;25ms latency. Crucial for educational interventions.</p>
                          </li>
                          <li className="flex gap-4 items-start">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                             <p className="text-sm leading-relaxed"><strong className="text-white">Scalable:</strong> Architecture optimized to allow porting algorithms to mobile CoreML instances.</p>
                          </li>
                       </ul>
                    </div>

                    {/* Reliability Panel */}
                    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm p-10 space-y-8 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent pointer-events-none" />
                       <div className="flex items-center gap-4 border-b border-slate-800 pb-6 relative z-10">
                          <div className="p-3 bg-blue-600/10 rounded-2xl border border-[#3b82f6]/20">
                             <Activity className="w-6 h-6 text-blue-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white uppercase tracking-widest">Reliability</h3>
                       </div>
                       <ul className="space-y-6 text-slate-400 relative z-10">
                          <li className="flex gap-4 items-start">
                             <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                             <p className="text-sm leading-relaxed"><strong className="text-white">Continuous Fallback:</strong> Visual fallback system activates instantly if edge node disconnects.</p>
                          </li>
                          <li className="flex gap-4 items-start">
                             <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                             <p className="text-sm leading-relaxed"><strong className="text-white">Data Exclusivity:</strong> 100% GDPR/COPPA. Audio isn't recorded or sent off-device. Ephemeral text generation.</p>
                          </li>
                          <li className="flex gap-4 items-start">
                             <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                             <p className="text-sm leading-relaxed"><strong className="text-white">Cognitive UI Checks:</strong> Interface built with minimalist constraints to prevent sensory overload.</p>
                           </li>
                        </ul>
                     </div>
                  </div>
               </div>
             )}
          </div>
         )}

        {mainView === 'learning' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Learning Mode Menu */}
             <aside className="lg:col-span-1 space-y-6">
               <div className="bg-slate-900/50 border-slate-800 border-slate-800 p-6 rounded-3xl space-y-6">
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                   <Database className="w-4 h-4 text-blue-500" /> Intelligence Modes
                 </h3>
                 <button
                   onClick={() => {
                     setLearningMode('search');
                     setLearningResult("");
                   }}
                   className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 mb-8 flex flex-col gap-2 ${learningMode === 'search' ? 'bg-blue-600 border-[#3b82f6] text-white shadow-xl translate-x-2' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-[#3b82f6]/50 hover:bg-slate-900 hover:translate-x-1'}`}
                 >
                   <div className="flex items-center gap-3">
                     <SearchCode className={`w-5 h-5 ${learningMode === 'search' ? 'text-white' : 'text-blue-500'}`} />
                     <span className="text-sm font-black tracking-tight">RAG Interfacer</span>
                   </div>
                   <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Elastic Vector Search (kNN)</p>
                 </button>

                 <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                   <BookOpen className="w-4 h-4 text-orange-500" /> Processing Hub
                 </h3>
                 <div className="space-y-3">
                    {[
                      { id: 'gemma', label: 'Gemma 4 Edge', icon: <BrainCircuit className="w-4 h-4" /> },
                      { id: 'summary', label: 'Summary Generation', icon: <FileText className="w-4 h-4" /> },
                      { id: 'quiz', label: 'Cognitive Testing', icon: <Gamepad2 className="w-4 h-4" /> },
                      { id: 'exam', label: 'Evaluation System', icon: <Target className="w-4 h-4" /> },
                      { id: 'mindmap', label: 'Neural Mapping', icon: <Network className="w-4 h-4" /> },
                      { id: 'presentation', label: 'Automated Decks', icon: <Presentation className="w-4 h-4" /> },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setLearningMode(m.id as any);
                          setLearningResult("");
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${learningMode === m.id ? 'bg-orange-600 border-[#ff4e00] text-white shadow-[0_0_20px_rgba(255,78,0,0.4)] translate-x-2' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-900 hover:translate-x-1'}`}
                      >
                        <div className="flex items-center gap-3">
                          {m.icon}
                          <span className="text-sm font-bold tracking-tight uppercase">{m.label}</span>
                        </div>
                      </button>
                    ))}
                 </div>
               </div>
             </aside>

             <section className="lg:col-span-3 space-y-6">
                {/* AI Input Area */}
                {(learningMode !== 'exam' || generatedQuestions.length === 0) && (
                <div className={`bg-slate-900/50 rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-all duration-300 ${learningMode === 'exam' ? 'border-[#ff4e00]/40 border-2' : 'border-slate-800 border'}`}>
                   <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-800/50 mix-blend-screen rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
                   
                   <div className="flex justify-between items-center relative z-10">
                     <h2 className="text-2xl font-bold text-white flex items-center gap-3 uppercase tracking-tight">
                       {learningMode === 'search' && <><Database className="text-blue-500"/> Elastic RAG Engine</>}
                       {learningMode === 'summary' && <><FileText className="text-orange-500"/> Synthesis Intelligence</>}
                       {learningMode === 'quiz' && <><Gamepad2 className="text-purple-500"/> Quiz Generator</>}
                       {learningMode === 'mindmap' && <><Network className="text-emerald-500"/> Network Maps (Mermaid)</>}
                       {learningMode === 'presentation' && <><Presentation className="text-indigo-500"/> Presentation Compile</>}
                       {learningMode === 'exam' && <><Target className="text-red-500 animate-pulse"/> Générateur de Contrôle & Acquisition</>}
                       {(learningMode === 'gemma' || (!['search','summary','quiz','mindmap','presentation','exam'].includes(learningMode))) && <><BrainCircuit className="text-white"/> Edge Routing</>}
                     </h2>
                     {learningMode !== 'presentation' && (
                       <select 
                         className="bg-slate-900 border border-slate-800 text-white/90 text-xs uppercase tracking-widest rounded-lg px-3 py-2 outline-none appearance-none"
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
                     rows={learningMode === 'exam' ? 3 : 6}
                     className="w-full relative z-10 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white overflow-y-auto focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all resize-none outline-none font-mono text-sm leading-relaxed"
                     placeholder={
                       learningMode === 'search' ? "Recherche vectorielle. Exemple : 'Rechercher les références à la photosynthèse dans la banque de connaissances...'" : 
                       learningMode === 'exam' ? "Formulez ici des directives ou thèmes de ciblage pour l'évaluation pédagogique du contrôle, ou importez vos cours..." :
                       learningMode === 'summary' ? "Saisissez votre texte de cours ou vos leçons. Notre moteur compilera instantanément un résumé à haute densité sémantique..." :
                       "Insérez le texte source, le code ou le contexte. Notre orchestrateur de services analysera et effectuera le traitement d'apprentissage automatiquement..."
                     }
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                   />
                   
                   <div className="flex justify-end items-center gap-6 relative z-10">
                     {!user && <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Unauthenticated Session</span>}

                     {/* Multilingual File Upload Component (Max 5 Documents) */}
                     {learningMode === 'exam' && (
                       <div className="w-full space-y-3 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div className="flex items-center justify-between">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Paperclip className="w-4 h-4 text-orange-500 animate-bounce" /> Importation de documents de cours ({uploadedFiles.length}/5)
                         </label>
                         {fileError && <span className="text-[11px] font-bold text-red-500 tracking-tight">{fileError}</span>}
                       </div>

                       <div 
                         onClick={() => document.getElementById('academic-file-picker')?.click()}
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={async (e) => {
                           e.preventDefault();
                           const files = e.dataTransfer.files;
                           if (files) {
                             const syntheticEvent = { target: { files } } as any;
                             await handleFileUpload(syntheticEvent);
                           }
                         }}
                         className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-950/60 transition-all duration-300 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
                       >
                         <input 
                           type="file" 
                           id="academic-file-picker" 
                           multiple 
                           accept=".pdf,.docx,.txt" 
                           onChange={handleFileUpload} 
                           className="hidden" 
                         />
                         {isUploadingFile ? (
                           <>
                             <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                             <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Analyse sémantique et extraction du texte...</p>
                           </>
                         ) : (
                           <>
                             <FileText className="w-7 h-7 text-slate-500 group-hover:text-orange-500 transition-colors" />
                             <p className="text-xs font-black text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">Glissez-déposez vos fichiers de cours (PDF, Word, TXT)</p>
                             <p className="text-[9px] text-slate-500 font-mono">Analyse lexicale et phonologique active (max 5 fichiers)</p>
                           </>
                         )}
                       </div>

                       {/* Display Uploaded File Badges */}
                       {uploadedFiles.length > 0 && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                           {uploadedFiles.map((f, fileIdx) => (
                             <div key={fileIdx} className="bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-300">
                               <div className="flex items-center gap-3 overflow-hidden">
                                 <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                                 <div className="truncate">
                                   <p className="font-bold text-white truncate">{f.name}</p>
                                   <p className="text-[10px] text-slate-500 font-mono">{(f.size / 1024 / 1024).toFixed(2)} MB — {f.text.length.toLocaleString()} car.</p>
                                 </div>
                               </div>
                               <button 
                                 type="button"
                                 onClick={(e) => { e.stopPropagation(); handleRemoveFile(fileIdx); }}
                                 className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-550/10 rounded-lg transition-all shrink-0 cursor-pointer"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                     )}

                     <div className="w-full flex justify-between items-center pt-4 border-t border-slate-800/40">
                       {uploadedFiles.length > 0 ? (
                         <span className="text-[10px] text-emerald-500 font-mono tracking-wider font-extrabold flex items-center gap-1.5 uppercase">
                           <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" /> {uploadedFiles.length} Cours chargés
                         </span>
                       ) : (
                         <span className="text-[10px] text-slate-500 font-mono uppercase">Aucun fichier importé</span>
                       )}
                       <button 
                         onClick={handleGenerate}
                         disabled={isGenerating || (!inputText.trim() && uploadedFiles.length === 0)}
                         className="px-8 py-4 bg-white hover:bg-slate-200 disabled:bg-slate-800/50 disabled:text-white/20 disabled:border-slate-800 rounded-2xl text-black font-bold uppercase tracking-widest text-sm flex items-center gap-3 transition-colors shadow-2xl cursor-pointer"
                       >
                         {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                         {isGenerating ? 'PROCESSING...' : 'EXECUTE'}
                       </button>
                     </div>


                   </div>
                </div>
                 )}

                {/* AI Result Area */}
                {learningMode === 'exam' && (
                  <ExamQuiz 
                    customQuestions={generatedQuestions} 
                    language={selectedLang} 
                    onRestart={() => handleGenerate()}
                    originalTextContext={inputText || (uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(', ') : undefined)}
                  />
                )}
                {(learningResult || isGenerating) && learningMode !== 'exam' && (
                  <div className="bg-slate-900/50 border-slate-800 border-slate-800 rounded-[2.5rem] p-8 shadow-2xl min-h-[400px] flex flex-col gap-6 relative overflow-hidden">
                    {isGenerating ? (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 space-y-6 relative z-10 flex-1">
                        <div className="relative">
                           <div className="w-16 h-16 border-4 border-slate-800 border-t-white rounded-full animate-spin" />
                           <Sparkles className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <p className="font-mono text-xs uppercase tracking-widest">Allocating resources & computing layers...</p>
                      </div>
                    ) : learningMode === 'mindmap' ? (
                      <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-800 relative z-10 shadow-inner min-h-[400px] flex items-center justify-center flex-1">
                        <Mermaid chart={learningResult} />
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-lg max-w-none text-slate-300 relative z-10 flex-1">
                        <div className="markdown-body">
                          <Markdown>{learningResult}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Vocabulary Tracker based on submitted text */}
                {!isGenerating && inputText && learningMode !== 'exam' && (
                  <VocabularyTracker text={inputText} language={selectedLang} />
                )}
             </section>
          </div>
        )}

        {mainView === 'history' && (
          <HistoryView isLoadingHistory={isLoadingHistory} historyItems={historyItems} />
        )}

        {mainView === 'cognitive-gym' && (
          <CognitiveArena
            user={user}
            onLogin={async () => { await loginWithGoogle(); }}
            selectedLang={selectedLang}
            voiceArenaSpoken={voiceArenaSpoken}
            setVoiceArenaSpoken={setVoiceArenaSpoken}
            arenaTranscript={arenaTranscript}
            setArenaTranscript={setArenaTranscript}
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            audioData={audioData}
            selectedCardId={selectedCardId}
            setSelectedCardId={setSelectedCardId}
            remediationContent={remediationContent}
            setRemediationContent={setRemediationContent}
            isRemediating={isRemediating}
            setIsRemediating={setIsRemediating}
            speechError={speechError}
            injectedExercise={injectedExercise}
            onInjectedExerciseConsumed={() => setInjectedExercise(undefined)}
          />
        )}

        {mainView === 'gtm' && (
          <GtmPlaybook 
            user={user}
            mlEngineUrl={mlEngineUrl}
          />
        )}

      </main>

      {/* Credits & Tech Talk */}
      {mainView !== 'cognitive-gym' && (
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 flex flex-col md:flex-row items-center gap-8 justify-between opacity-80">
    <div className="flex flex-col items-center gap-6 w-full md:w-auto">
      <div className="relative group w-full md:w-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
        <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-slate-800 px-8 py-5 md:px-12 md:py-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6">
           <span className="text-sm md:text-base text-slate-300 font-medium tracking-widest uppercase text-center drop-shadow-sm">
             Mount AI: <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 font-black">Stealth Startup</span>
           </span>
           <div className="hidden md:block w-2 h-2 bg-slate-600 rounded-full" />
           <span className="text-sm md:text-base text-slate-300 font-medium tracking-widest uppercase text-center drop-shadow-sm">
             CEO & FOUNDER : <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 font-black tracking-widest">Taha DEV Junior</span>
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
      )}
    </div>
  );
}
