import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Sparkles, BookOpen, Gamepad2, Network, Activity, TrendingUp, 
  User, Award, Mic, Volume2, Play, Square, VolumeX, Plus, Trash2, 
  ArrowLeft, Send, CheckCircle2, AlertCircle, X, FileText, ChevronRight, 
  Info, Zap, Lightbulb, RefreshCw, Trophy, Target, Settings, History,
  LogIn, LogOut, Search, Copy, Download, ShieldCheck, Flame, Sliders,
  BarChart3, PieChart, Globe
} from 'lucide-react';
import { MainViewType } from '../../types';
import { 
  parseStructuredDocument, 
  extractTextFromFile, 
  DocumentParseProgress, 
  ParsedDocumentResult, 
  formatBytes,
  chunkDocumentText 
} from '../../services/documentParser';
import {
  exportSummaryToPdf,
  exportMindmapToPdf,
  exportQuizToPdf,
  downloadPdfDocument
} from '../../utils/pdfExport';
import PDFPreviewBanner from './PDFPreviewBanner';

// ========================================================
// SOUND ENGINE: Web Audio API Oscillator Orchestration
// ========================================================
const playSuccessSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    const now = ctx.currentTime;
    // Cheerful ascending major scale/chord to boost dopamine
    playTone(261.63, now, 0.25); // C4
    playTone(329.63, now + 0.08, 0.25); // E4
    playTone(392.00, now + 0.16, 0.25); // G4
    playTone(523.25, now + 0.24, 0.4); // C5
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
};

const playCorrectionSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle'; // Softer, comforting timbre
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    const now = ctx.currentTime;
    // Consoling, non-penalizing descending frequency
    playTone(220.00, now, 0.3); // A3
    playTone(196.00, now + 0.12, 0.4); // G3
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
};

interface MentoraViewProps {
  setMainView: (view: MainViewType) => void;
  user: any;
  onAddToWorkspace?: (title: string, text: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface MindmapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  category: 'core' | 'sub' | 'detail';
  details?: string;
}

interface MindmapEdge {
  from: string;
  to: string;
}

interface MentoraHistoryItem {
  id: string;
  type: 'lesson' | 'quiz' | 'chat' | 'mindmap';
  topic: string;
  date: string;
  summary: string;
  fullContent: string;
  score?: number;
}

export default function MentoraView({ setMainView, user, onAddToWorkspace }: MentoraViewProps) {
  // Document context state for Chatbot, Large PDF Analysis & Search
  const [chatDocument, setChatDocument] = useState<{ fileName: string; text: string; size: number } | null>(null);
  const [parsedDocResult, setParsedDocResult] = useState<ParsedDocumentResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<DocumentParseProgress | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null);

  const handleUploadChatDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDoc(true);
    setUploadProgress({
      currentPage: 0,
      totalPages: 0,
      percent: 5,
      stage: 'reading',
      message: `Initialisation de la lecture de ${file.name}...`
    });

    try {
      const result = await parseStructuredDocument(file, (p) => {
        setUploadProgress(p);
      });

      setParsedDocResult(result);
      setChatDocument({
        fileName: result.fileName,
        text: result.text,
        size: result.fileSize
      });
      playSuccessSound();
      if (result.isLargeDocument) {
        setActiveTab('doc-studio');
      }
    } catch (err: any) {
      alert(err?.message || "Erreur lors du chargement et du parsing du document.");
    } finally {
      setIsUploadingDoc(false);
      setUploadProgress(null);
      if (e.target) e.target.value = '';
    }
  };
  // State for tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'diagnostic' | 'lesson' | 'chat' | 'mindmap' | 'quiz' | 'doc-studio'>('dashboard');

  // Login Modal & Student Profile State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [studentProfile, setStudentProfile] = useState({
    name: user?.displayName || user?.email?.split('@')[0] || "Captain",
    level: 1,
    xp: 450,
    streak: 12,
    learningStyle: "Socratic Visual",
    levelCategory: "Intermediate",
    focusArea: "Science & Algorithms",
    hasCompletedDiagnostic: true,
    strengths: ["Deductive Reasoning", "Phonological Analysis", "Socratic Chunking"],
    weaknesses: ["Precision Under Pressure", "Calculation Speed"]
  });

  const [loginNameInput, setLoginNameInput] = useState(studentProfile.name);
  const [loginGradeInput, setLoginGradeInput] = useState(studentProfile.levelCategory);

  // Dedicated Mentora AI Authentication State
  const [mentoraAuthUser, setMentoraAuthUser] = useState<{ email: string; name: string } | null>(() => {
    const saved = localStorage.getItem('mentora_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return null;
  });
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>('signin');
  const [loginEmailInput, setLoginEmailInput] = useState("");
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");

  // Dedicated Mentora AI History State
  const [mentoraHistory, setMentoraHistory] = useState<MentoraHistoryItem[]>(() => {
    const saved = localStorage.getItem('mentora_history_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return [
      {
        id: 'init-1',
        type: 'lesson',
        topic: 'Atoms & The Periodic Table',
        date: 'Today 2:30 PM',
        summary: 'Structured synthesis of fundamental matter components: protons, neutrons, and electrons.',
        fullContent: 'Atoms constitute the fundamental building blocks of matter. Each atom possesses a massive nucleus composed of protons (positive charge) and neutrons (neutral charge), surrounded by an electron cloud.'
      },
      {
        id: 'init-2',
        type: 'quiz',
        topic: 'Fractions & Common Denominators',
        date: 'Today 3:10 PM',
        summary: 'Assimilation quiz on fractional operations and common denominators.',
        fullContent: 'Quiz completed with flying colors! Score: 2/2.',
        score: 100
      },
      {
        id: 'init-3',
        type: 'chat',
        topic: "Ohm's Law & Resistors",
        date: 'Today 4:00 PM',
        summary: 'Socratic dialogue on U = R * I relationship and hydraulic voltage analogy.',
        fullContent: 'Socratic Dialogue:\nUser: How do I calculate voltage?\nAssistant: Think of a water pipe under pressure...'
      }
    ];
  });

  const [historyFilter, setHistoryFilter] = useState<'all' | 'lesson' | 'quiz' | 'chat' | 'mindmap'>('all');
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const addHistoryItem = (type: 'lesson' | 'quiz' | 'chat' | 'mindmap', topic: string, content: string, score?: number) => {
    const newItem: MentoraHistoryItem = {
      id: `item-${Date.now()}`,
      type,
      topic,
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      summary: content.slice(0, 180) + (content.length > 180 ? '...' : ''),
      fullContent: content,
      score
    };
    setMentoraHistory(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem('mentora_history_v2', JSON.stringify(updated.slice(0, 50)));
      return updated;
    });
  };

  // Diagnostic questionnaire state
  const [diagnosticStep, setDiagnosticStep] = useState(0);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<string[]>([]);
  
  // Custom interactive SVG graph state
  const [mindmapQuery, setMindmapQuery] = useState("Photosynthesis");
  const [mindmapNodes, setMindmapNodes] = useState<MindmapNode[]>([
    { id: "1", label: "Photosynthesis", x: 250, y: 200, category: 'core', details: "Biological engine converting light energy into glucose." },
    { id: "2", label: "Light Phase", x: 130, y: 120, category: 'sub', details: "Photon capture inside the thylakoid membrane." },
    { id: "3", label: "Dark Phase", x: 370, y: 120, category: 'sub', details: "Calvin cycle fixing atmospheric CO2." },
    { id: "4", label: "Chloroplast", x: 130, y: 280, category: 'sub', details: "Host cell organelle containing thylakoids." },
    { id: "5", label: "O2 Production", x: 370, y: 280, category: 'sub', details: "Photolysis of water releasing oxygen." }
  ]);
  const [mindmapEdges, setMindmapEdges] = useState<MindmapEdge[]>([
    { from: "1", to: "2" },
    { from: "1", to: "3" },
    { from: "1", to: "4" },
    { from: "1", to: "5" }
  ]);
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);

  // Lesson Generation state
  const [lessonTopic, setLessonTopic] = useState("Atoms & The Periodic Table");
  const [lessonLevel, setLessonLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [lessonContent, setLessonContent] = useState("");
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [isReadingLesson, setIsReadingLesson] = useState(false);
  const [readingParagraphIndex, setReadingParagraphIndex] = useState<number | null>(null);

  // Audio & Voice Settings State
  const [autoVoiceNarration, setAutoVoiceNarration] = useState(true);
  const [voicePitch, setVoicePitch] = useState(1.05);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [standaloneWindow, setStandaloneWindow] = useState(false);
  const [embeddedQcmAnswers, setEmbeddedQcmAnswers] = useState<Record<string, { selectedOption: string; isCorrect: boolean }>>({});

  // Socratic Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello Captain! I am Mentora AI, your socratic study guide. I am programmed NEVER to give you direct answers, but to offer hints, analogies, and mini-quizzes so you can discover the answer yourself!\n\n[QCM]\nQuestion: What is the best approach when facing a difficult problem?\nA) Give up and look up the answer online\nB) Break down the problem into simple steps and reflect with a hint\nC) Wait doing nothing\nD) Guess randomly without analyzing\nAnswer: B) Break down the problem into simple steps and reflect with a hint\nExplanation: Socratic decomposition boosts synaptic agility and long-term retention!\n[/QCM]",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTypingChat, setIsTypingChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState("");

  // Deep Cognitive Analysis State (Giving AI sufficient time to analyze dossiers & chapters)
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [deepAnalysisStage, setDeepAnalysisStage] = useState<1 | 2 | 3>(1);
  const [deepAnalysisProgress, setDeepAnalysisProgress] = useState(0);
  const [deepAnalysisMsg, setDeepAnalysisMsg] = useState("");
  const [deepAnalysisTaskTitle, setDeepAnalysisTaskTitle] = useState("");
  const [deepAnalysisElapsedSec, setDeepAnalysisElapsedSec] = useState(0);
  const [voiceLang, setVoiceLang] = useState<'fr-FR' | 'en-US' | 'es-ES' | 'ar-SA'>('fr-FR');
  const [audioData, setAudioData] = useState<number[]>(new Array(16).fill(0));
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Equalizer animation effect during voice recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioData(prev => prev.map(() => Math.floor(15 + Math.random() * 85)));
      }, 90);
    } else {
      setAudioData(new Array(16).fill(0));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Quiz state
  const [quizTopic, setQuizTopic] = useState("Fractions");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([
    {
      id: 1,
      text: "In the fraction 4/7, what does the number 4 represent?",
      options: ["Denominator (total parts)", "Numerator (chosen parts)", "Decimal quotient", "Multiplier"],
      correctAnswer: "Numerator (chosen parts)",
      explanation: "The numerator is placed above the fraction line and represents the number of selected parts."
    },
    {
      id: 2,
      text: "To add 1/3 and 2/5, what is the ideal common denominator?",
      options: ["3", "5", "15", "8"],
      correctAnswer: "15",
      explanation: "The least common multiple of 3 and 5 is 3 * 5 = 15."
    }
  ]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizStreak, setQuizStreak] = useState(0);

  // Achievements state
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(['pioneer']);

  // Ref for auto-scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTypingChat]);

  // Load saved progress if available
  useEffect(() => {
    const saved = localStorage.getItem('mentora_profile');
    if (saved) {
      try {
        setStudentProfile(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load profile", e);
      }
    }
  }, []);

  const saveProfile = (newProfile: typeof studentProfile) => {
    setStudentProfile(newProfile);
    localStorage.setItem('mentora_profile', JSON.stringify(newProfile));
  };

  // ========================================================
  // TEXT TO SPEECH (TTS) SYSTEM WITH VOICE & SOUND
  // ========================================================
  const speakText = (text: string, msgId?: string, onEnd?: () => void) => {
    try {
      window.speechSynthesis.cancel();
      if (msgId) setSpeakingMessageId(msgId);
      
      // Clean up text for speech synthesis (strip QCM formatting for smooth listening)
      let spokenText = text.replace(/\[QCM\][\s\S]*?\[\/QCM\]/g, (match) => {
        const qMatch = match.match(/Question:\s*(.*)/i);
        return qMatch ? `\nMini QCM reflection question: ${qMatch[1]}` : "";
      });
      spokenText = spokenText.replace(/[*#`_\-[\]()]/g, '');

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'en-US';
      utterance.pitch = voicePitch;
      utterance.rate = voiceRate;
      
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      
      utterance.onend = () => {
        setSpeakingMessageId(null);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setSpeakingMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS narration error:", e);
      setSpeakingMessageId(null);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setIsReadingLesson(false);
    setReadingParagraphIndex(null);
  };

  // ========================================================
  // SPEECH TO TEXT (STT) SYSTEM (Modeled on DyslexiaView logic)
  // ========================================================
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("La reconnaissance vocale native n'est pas supportée par votre navigateur (utiliser Google Chrome ou Edge).");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { console.warn(e); }
      }
      setIsRecording(false);
      return;
    }

    setMicError("");
    setInterimTranscript("");
    setIsRecording(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        if (interimStr) {
          setInterimTranscript(interimStr);
        }

        if (finalStr) {
          setChatInput(prev => {
            const updated = (prev ? prev + " " : "") + finalStr.trim();
            return updated.trim();
          });
          setInterimTranscript("");
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Mentora Speech recognition status:", event.error);
        if (event.error === 'not-allowed') {
          setMicError("🎤 Micro non autorisé. Autorisez l'accès au micro via le cadenas de l'URL ou écrivez directement dans le chat.");
        } else if (event.error === 'no-speech') {
          setMicError("Aucun son détecté. Parlez bien distinctement près du micro.");
        } else if (event.error === 'aborted') {
          setMicError("");
        } else {
          setMicError(`Information Microphone (${event.error})`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition initialization notice:", err);
      setMicError("Reconnaissance vocale non disponible sur ce navigateur. Vous pouvez taper au clavier.");
      setIsRecording(false);
    }
  };

  const handleStopVoiceAndSend = (overrideExtraText?: string) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { console.warn(e); }
    }
    setIsRecording(false);
    
    const textToSend = ((chatInput ? chatInput + " " : "") + (overrideExtraText || interimTranscript || "")).trim();
    setInterimTranscript("");
    if (textToSend) {
      handleSendChat(textToSend);
    }
  };

  // ========================================================
  // HANDLERS: Diagnostic Questionnaire
  // ========================================================
  const diagnosticQuestions = [
    {
      title: "Learning Style",
      text: "What is your preferred learning style?",
      options: [
        { key: "A", label: "Visual (Mindmaps, interactive diagrams, color coding)", style: "Socratic Visual" },
        { key: "B", label: "Auditory (Step-by-step spoken explanations, active listening, synthetic voice)", style: "Socratic Auditory" },
        { key: "C", label: "Kinesthetic (Hands-on, typing, guessing, quizzes & mini-games)", style: "Kinesthetic Practical" }
      ]
    },
    {
      title: "Logical Reasoning",
      text: "Solve the following sequence: 2, 4, 8, 16, ... ?",
      options: [
        { key: "A", label: "20 (A simple arithmetic progression of +4/step)", score: 1 },
        { key: "B", label: "32 (A geometric progression multiplying by 2)", score: 3 },
        { key: "C", label: "64 (An exponential progression based on powers)", score: 2 }
      ]
    },
    {
      title: "Phonemic Analysis",
      text: "Which visual letter grouping produces the /o/ sound in 'boat'?",
      options: [
        { key: "A", label: "The 'bt' consonant group", score: 1 },
        { key: "B", label: "The 'oa' vowel combination", score: 3 },
        { key: "C", label: "The ending letter 't'", score: 1 }
      ]
    },
    {
      title: "Study Focus",
      text: "In which field of study do you want to focus your efforts?",
      options: [
        { key: "A", label: "Science & Algorithms (Chemistry, atoms, mathematics)", area: "Science" },
        { key: "B", label: "Languages & Phonetics (Phonemes, decoding, reading)", area: "Phonology" },
        { key: "C", label: "Cognitive Science & Learning (Memory, visual overload)", area: "Cognition" }
      ]
    },
    {
      title: "Didactic Level",
      text: "When facing a complex concept, which explanation method do you prefer?",
      options: [
        { key: "A", label: "A simple visual metaphor with no heavy formulas (Beginner Level)", cat: "Beginner" },
        { key: "B", label: "A balanced explanation with practice exercises (Intermediate Level)", cat: "Intermediate" },
        { key: "C", label: "A deep technical and theoretical description (Advanced Level)", cat: "Advanced" }
      ]
    }
  ];

  const handleDiagnosticAnswer = (optionKey: string) => {
    const nextAnswers = [...diagnosticAnswers, optionKey];
    setDiagnosticAnswers(nextAnswers);

    if (diagnosticStep < diagnosticQuestions.length - 1) {
      setDiagnosticStep(diagnosticStep + 1);
    } else {
      // Complete Diagnostic and process results
      let style = "Socratic Visual";
      let area = "General";
      let category = "Intermediate";
      let correctCount = 0;

      // Logic question check
      if (nextAnswers[1] === 'B') correctCount++;
      // Phoneme question check
      if (nextAnswers[2] === 'B') correctCount++;

      // Style Map
      if (nextAnswers[0] === 'A') style = "Socratic Visual";
      if (nextAnswers[0] === 'B') style = "Socratic Auditory";
      if (nextAnswers[0] === 'C') style = "Kinesthetic Practical";

      // Area Map
      if (nextAnswers[3] === 'A') area = "Science";
      if (nextAnswers[3] === 'B') area = "Phonology";
      if (nextAnswers[3] === 'C') area = "Cognition";

      // Level Category Map
      if (nextAnswers[4] === 'A') category = "Beginner";
      if (nextAnswers[4] === 'B') category = "Intermediate";
      if (nextAnswers[4] === 'C') category = "Advanced";

      const strengthsList = [];
      const weaknessesList = [];

      if (correctCount === 2) {
        strengthsList.push("Structured Reasoning", "Phonological Analysis");
      } else if (correctCount === 1) {
        strengthsList.push("Logical Analysis");
        weaknessesList.push("Phonetic Decoding");
      } else {
        weaknessesList.push("Logical Foundations", "Phonemic Mapping");
      }

      const updatedProfile = {
        ...studentProfile,
        xp: studentProfile.xp + 200,
        learningStyle: style,
        levelCategory: category,
        focusArea: area,
        hasCompletedDiagnostic: true,
        strengths: strengthsList.length > 0 ? strengthsList : ["Cognitive Curiosity"],
        weaknesses: weaknessesList.length > 0 ? weaknessesList : ["Rapid Precision"]
      };

      saveProfile(updatedProfile);
      playSuccessSound();

      if (!unlockedAchievements.includes('diagnostic')) {
        setUnlockedAchievements(prev => [...prev, 'diagnostic']);
      }

      // Generate a themed Roadmap based on selected focus
      const focusText = area === 'Science' ? "Molecules" : area === 'Phonology' ? "Syllables" : "Memory";
      setMindmapNodes([
        { id: "1", label: `Roadmap: ${area}`, x: 250, y: 150, category: 'core', details: `Personalized learning pathway oriented towards ${area}.` },
        { id: "2", label: "1. Diagnostic Complete", x: 100, y: 220, category: 'sub', details: "Calibrated live profile. Style identified as " + style },
        { id: "3", label: `2. Foundational Concept (${focusText})`, x: 250, y: 280, category: 'sub', details: "Introductory lesson with socratic assimilation questions." },
        { id: "4", label: "3. Practice Quiz", x: 400, y: 220, category: 'sub', details: "Interactive socratic evaluation series with haptic sound feedback." },
        { id: "5", label: "4. Synthesis & Mindmap", x: 250, y: 400, category: 'sub', details: "Neural visualization of interconnected ideas." }
      ]);
      setMindmapEdges([
        { from: "1", to: "2" },
        { from: "2", to: "3" },
        { from: "3", to: "4" },
        { from: "3", to: "5" }
      ]);

      // Move to dashboard and celebrate!
      setActiveTab('dashboard');
    }
  };

  // ========================================================
  // AI ACTIONS: Generate Custom Lessons via /api/generate
  // ========================================================
  const handleGenerateLesson = async () => {
    if (!lessonTopic.trim()) return;
    setIsGeneratingLesson(true);
    setLessonContent("");
    stopSpeaking();

    const depthPrompt = lessonLevel === 'beginner' 
      ? "Use extremely simple words, visual examples, no heavy theory, and short sentences."
      : lessonLevel === 'advanced'
      ? "Provide a high-level academic explanation, precise definitions, formulas, and complex structures."
      : "Provide concrete examples, clear explanations, and direct practical applications.";

    const prompt = `You are Mentora AI, an elite learning tutor. Generate a highly pedagogical, structured lesson on the following topic: "${lessonTopic}".
Target level: ${lessonLevel.toUpperCase()} (${depthPrompt}).
Language: English.
Structure the response with:
- A clear title
- A comprehensive introductory summary
- 3 detailed main thematic sections
- A concrete practical application or case study
- A final open socratic question to encourage deeper reflection.

Write elegantly with clear paragraphs separated by double line breaks. Do not use overly complex markdown.`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error("Generation error");
      const data = await response.json();
      if (!data.text) throw new Error("No text received");

      setLessonContent(data.text);
      
      // Update profile XP & history
      const updatedProfile = {
        ...studentProfile,
        xp: studentProfile.xp + 50
      };
      saveProfile(updatedProfile);
      addHistoryItem('lesson', lessonTopic, data.text);

    } catch (e) {
      console.error(e);
      // Fallback text if offline/error
      const fallback = `## ${lessonTopic} (${lessonLevel.toUpperCase()})

### 1. Concept Introduction
The topic "${lessonTopic}" forms an integral part of cognitive mastery. Understanding its foundations accelerates knowledge acquisition and synaptic agility.

### 2. Key Takeaways
* 💡 **Pillar 1:** Ordered structure and graphic clarity minimize visual clutter.
* 💡 **Pillar 2:** Spoken repetition and audio assistance support working memory connections.
* 💡 **Pillar 3:** Direct self-assessment through quizzes boosts long-term retention by over 40%.

### 3. Practical Application
Try sketching this concept as a network of connected bubbles or explaining it aloud in your own words.

*Socratic Question:* How do you think this topic connects with what you learned previously?`;
      
      setLessonContent(fallback);
      addHistoryItem('lesson', lessonTopic, fallback);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // TTS Read Lesson step-by-step
  const handleReadLesson = () => {
    if (isReadingLesson) {
      stopSpeaking();
      return;
    }

    if (!lessonContent) return;

    // Split text into paragraphs
    const paragraphs = lessonContent
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    if (paragraphs.length === 0) return;

    setIsReadingLesson(true);
    let currentIdx = 0;

    const readNext = () => {
      if (currentIdx >= paragraphs.length) {
        setIsReadingLesson(false);
        setReadingParagraphIndex(null);
        return;
      }

      setReadingParagraphIndex(currentIdx);
      speakText(paragraphs[currentIdx], undefined, () => {
        currentIdx++;
        readNext();
      });
    };

    readNext();
  };

  // ========================================================
  // AI ACTIONS: Socratic & Document Tutor Chat Interface
  // ========================================================
  const handleSendChat = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setChatInput("");
    setIsTypingChat(true);

    const isSummaryOrDirectRequest = /résume|resume|synthèse|synthese|summary|summarize|explique-moi ce document|analyse ce document|lis ce document|lire/i.test(textToSend);

    const docContextPrompt = chatDocument
      ? `\n\n[ATTACHED FILE SOURCE (${chatDocument.fileName})]:\n"""\n${chatDocument.text.slice(0, 16000)}\n"""\nBase your insights, summaries, socratic questions and explanations directly on the full content of this imported document!`
      : '';

    let socraticPrompt = "";
    if (isSummaryOrDirectRequest && chatDocument) {
      socraticPrompt = `You are Mentora AI, the elite educational AI Tutor powered by Gemini.
The student has imported the document "${chatDocument.fileName}" and is asking you to read, analyze, or summarize it.
${docContextPrompt}

LATEST STUDENT REQUEST: "${textToSend}"

MANDATORY RESPONSE STRUCTURE:
1. Clear, structured, and pedagogical Summary / Analysis of the document contents with key takeaways and concepts.
2. 3 essential takeaways highlighted with bullet points.
3. A concluding Socratic question and an optional mini QCM to test the student's assimilation:

[QCM]
Question: In this document, what is the core concept or key discovery?
A) Option A
B) Option B
C) Option C
D) Option D
Answer: A) Option A
Explanation: Socratic explanation.
[/QCM]

Respond clearly, with generous formatting, in the language matching the student's request (French or English).`;
    } else {
      socraticPrompt = `ABSOLUTE RULE: You are Mentora AI, the elite Socratic Mentor powered by Gemini.
You must guide the student to understand concepts deeply through socratic questioning, visual analogies, and progressive challenges.
${docContextPrompt}

MANDATORY RESPONSE STRUCTURE:
1. A dynamic compliment or encouraging remark.
2. An intuitive visual analogy or strategic hint explaining the problem.
3. A guiding question or step-by-step puzzle for the next step.
4. MANDATORILY include at the end of your response a QCM validation block in the exact format:

[QCM]
Question: What is the logical first step or deduction according to you?
A) Option A
B) Option B
C) Option C
D) Option D
Answer: B) Option B
Explanation: Caring and motivating socratic explanation.
[/QCM]

Message history:
${chatMessages.map(m => `${m.role === 'user' ? 'Student' : 'Mentora'}: ${m.content}`).join('\n')}

Latest student question: "${textToSend}"
Respond socratically, in clear English or French (matching user), concise and engaging:`;
    }

    const msgId = `msg-${Date.now()}`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: socraticPrompt })
      });

      if (!response.ok) throw new Error("Chat error");
      const data = await response.json();
      if (!data.text) throw new Error("No response received");

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, assistantMsg]);
      addHistoryItem('chat', textToSend.slice(0, 30), data.text);

      // Speak aloud if autoVoiceNarration is active
      if (autoVoiceNarration) {
        speakText(data.text, msgId);
      }

      // Unlock vocal badge if dictation used
      if (!unlockedAchievements.includes('vocal')) {
        setUnlockedAchievements(prev => [...prev, 'vocal']);
      }

    } catch (e) {
      console.error(e);
      let fallbackMsgContent = "";
      if (chatDocument && isSummaryOrDirectRequest) {
        const samplePoints = chatDocument.text.slice(0, 500).split('. ').filter(Boolean).slice(0, 3);
        fallbackMsgContent = `## 📄 Synthèse du document : ${chatDocument.fileName}\n\nJ'ai analysé votre document (**${formatBytes(chatDocument.size)}**, ~${chatDocument.text.length} caractères).\n\n### Points Clés Identifiés :\n${samplePoints.map(p => `* 💡 ${p.trim()}.`).join('\n')}\n\n[QCM]\nQuestion: Sur quel aspect souhaitez-vous approfondir votre étude ?\nA) Les concepts fondamentaux\nB) Les applications pratiques\nC) Générer un quiz de test\nAnswer: A) Les concepts fondamentaux\nExplanation: L'assimilation des bases est le levier principal de réussite cognitive.\n[/QCM]`;
      } else {
        fallbackMsgContent = `Great question Captain! I won't give you the direct answer because you have full potential to find it yourself.\n\nImagine this problem like a pyramid: instead of looking at the apex, let's focus on the first foundation block.\n\n[QCM]\nQuestion: In your opinion, where should we start to break down this topic?\nA) Analyze key terms and isolate the first variable\nB) Guess a random number\nC) Wait without taking action\nAnswer: A) Analyze key terms and isolate the first variable\nExplanation: Well done! Isolating problem components is the mark of great scientific minds.\n[/QCM]`;
      }
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: fallbackMsgContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      addHistoryItem('chat', textToSend.slice(0, 30), fallbackMsgContent);
      if (autoVoiceNarration) speakText(fallbackMsgContent, msgId);
    } finally {
      setIsTypingChat(false);
    }
  };

  // ========================================================
  // AI ACTIONS: Interactive Mindmap Generator (D3/SVG)
  // ========================================================
  const handleGenerateMindmap = async () => {
    if (!mindmapQuery.trim()) return;
    setIsGeneratingLesson(true);

    const prompt = `Generate a structured concept map JSON for the topic: "${mindmapQuery}".
Language: English.
The return format must be STRICTLY JSON with no markdown formatting around it, in the following format:
{
  "nodes": [
    {"id": "1", "label": "Main Topic", "category": "core", "details": "Short definition"},
    {"id": "2", "label": "Sub-concept A", "category": "sub", "details": "Details A"},
    {"id": "3", "label": "Sub-concept B", "category": "sub", "details": "Details B"},
    {"id": "4", "label": "Detail A1", "category": "detail", "details": "Precision A1"},
    {"id": "5", "label": "Detail B1", "category": "detail", "details": "Precision B1"}
  ],
  "edges": [
    {"from": "1", "to": "2"},
    {"from": "1", "to": "3"},
    {"from": "2", "to": "4"},
    {"from": "3", "to": "5"}
  ]
}`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error("Map error");
      const data = await response.json();
      
      // Attempt clean extraction of JSON block
      let rawJson = data.text.trim();
      if (rawJson.includes('```json')) {
        rawJson = rawJson.split('```json')[1].split('```')[0].trim();
      } else if (rawJson.includes('```')) {
        rawJson = rawJson.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(rawJson);
      
      // Calculate coordinates dynamically on a circular grid
      const nodesWithCoords = parsed.nodes.map((node: any, idx: number) => {
        let x = 250;
        let y = 200;
        if (node.category === 'core') {
          x = 250;
          y = 200;
        } else if (node.category === 'sub') {
          const angle = (idx * 2 * Math.PI) / (parsed.nodes.filter((n: any) => n.category === 'sub').length || 4);
          x = 250 + 130 * Math.cos(angle);
          y = 200 + 100 * Math.sin(angle);
        } else {
          const angle = (idx * 2 * Math.PI) / (parsed.nodes.length || 5) + 0.5;
          x = 250 + 200 * Math.cos(angle);
          y = 200 + 150 * Math.sin(angle);
        }
        return { ...node, x, y };
      });

      setMindmapNodes(nodesWithCoords);
      setMindmapEdges(parsed.edges);
      setSelectedNode(nodesWithCoords[0]);
      addHistoryItem('mindmap', mindmapQuery, `Generated concept map with ${nodesWithCoords.length} nodes.`);

      if (!unlockedAchievements.includes('map')) {
        setUnlockedAchievements(prev => [...prev, 'map']);
      }

    } catch (e) {
      console.warn("Failed to generate custom map, building local fallback map:", e);
      const words = mindmapQuery.split(' ');
      const mainWord = words[0] || "Concept";
      const fallbackNodes: MindmapNode[] = [
        { id: "1", label: mindmapQuery, x: 250, y: 200, category: 'core', details: `Structured study concept: ${mindmapQuery}` },
        { id: "2", label: "Origins & History", x: 130, y: 110, category: 'sub', details: "Where the concept of " + mainWord + " comes from and how it evolved." },
        { id: "3", label: "Theoretical Principles", x: 370, y: 110, category: 'sub', details: "Underlying mathematical axioms and core theories." },
        { id: "4", label: "Practical Applications", x: 130, y: 290, category: 'sub', details: "Concrete case studies and industrial uses of " + mainWord },
        { id: "5", label: "Limits & Edge Cases", x: 370, y: 290, category: 'sub', details: "Failure modes or exceptions to classical rules." }
      ];
      const fallbackEdges: MindmapEdge[] = [
        { from: "1", to: "2" },
        { from: "1", to: "3" },
        { from: "1", to: "4" },
        { from: "1", to: "5" }
      ];
      setMindmapNodes(fallbackNodes);
      setMindmapEdges(fallbackEdges);
      setSelectedNode(fallbackNodes[0]);
      addHistoryItem('mindmap', mindmapQuery, `Concept map generated for ${mindmapQuery}.`);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // ========================================================
  // AI ACTIONS: Adaptive Quiz & QCM
  // ========================================================
  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setIsGeneratingQuiz(true);
    setQuizAnswered(false);
    setSelectedQuizOption(null);
    setCurrentQuizIdx(0);

    const prompt = `Generate an adaptive quiz as a valid JSON array of 3 multiple-choice questions (QCM) on the topic: "${quizTopic}".
Language: English.
Each object in the JSON array must strictly follow this structure with no extra markdown text:
[
  {
    "id": 1,
    "text": "The question being asked?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Clear socratic explanation"
  }
]
Ensure progressive difficulty (Easy, Intermediate, Advanced).`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error("Quiz error");
      const data = await response.json();
      
      let rawJson = data.text.trim();
      if (rawJson.includes('```json')) {
        rawJson = rawJson.split('```json')[1].split('```')[0].trim();
      } else if (rawJson.includes('```')) {
        rawJson = rawJson.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuizQuestions(parsed);
      }
    } catch (e) {
      console.warn("Generating local fallback quiz:", e);
      setQuizQuestions([
        {
          id: 1,
          text: `What is the fundamental basis of studying "${quizTopic}"?`,
          options: ["Rote memorization", "Understanding concepts and active recall", "Ignoring foundations", "Raw machine translation"],
          correctAnswer: "Understanding concepts and active recall",
          explanation: "All cognitive sciences confirm that active learning with spaced repetition yields the highest neural retention rate."
        },
        {
          id: 2,
          text: `Why should learning about "${quizTopic}" be broken down into steps?`,
          options: ["To make the lesson longer", "To reduce working memory overload", "Because it looks better", "To avoid computer usage"],
          correctAnswer: "To reduce working memory overload",
          explanation: "Working memory can only hold a small number of simultaneous items (usually 4 to 7). Chunking prevents cognitive saturation."
        }
      ]);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectQuizOption = (option: string) => {
    if (quizAnswered) return;
    setSelectedQuizOption(option);
  };

  const handleVerifyQuizAnswer = () => {
    if (!selectedQuizOption || quizAnswered) return;

    const currentQ = quizQuestions[currentQuizIdx];
    const isCorrect = selectedQuizOption === currentQ.correctAnswer;

    setQuizAnswered(true);

    if (isCorrect) {
      playSuccessSound();
      setQuizScore(prev => prev + 1);
      setQuizStreak(prev => prev + 1);
      
      // Update student profile XP
      const addedXp = 40 + (quizStreak * 5); // streak multiplier
      const updatedProfile = {
        ...studentProfile,
        xp: studentProfile.xp + addedXp,
        streak: studentProfile.streak + 1
      };
      saveProfile(updatedProfile);

      // Check perfect score achievement
      if (currentQuizIdx === quizQuestions.length - 1 && quizScore + 1 === quizQuestions.length) {
        if (!unlockedAchievements.includes('perfect')) {
          setUnlockedAchievements(prev => [...prev, 'perfect']);
        }
      }
    } else {
      playCorrectionSound();
      setQuizStreak(0);
    }
  };

  const handleNextQuiz = () => {
    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(currentQuizIdx + 1);
      setSelectedQuizOption(null);
      setQuizAnswered(false);
    } else {
      // Quiz complete
      alert(`Quiz Finished! Score: ${quizScore}/${quizQuestions.length}`);
      addHistoryItem('quiz', quizTopic, `Quiz completed with score ${quizScore}/${quizQuestions.length}.`, Math.round((quizScore / quizQuestions.length) * 100));
      setQuizAnswered(false);
      setSelectedQuizOption(null);
      setCurrentQuizIdx(0);
      setQuizScore(0);
    }
  };

  // ========================================================
  // QCM PARSER HELPER FOR SOCRATIC CHAT EMBEDDED WIDGETS
  // ========================================================
  const parseQCMFromText = (text: string) => {
    const match = text.match(/\[QCM\]([\s\S]*?)\[\/QCM\]/i);
    if (!match) return { cleanText: text, qcm: null };

    const block = match[1];
    const cleanText = text.replace(/\[QCM\][\s\S]*?\[\/QCM\]/i, '').trim();

    const questionMatch = block.match(/Question:\s*(.*)/i);
    const optionsMatches = [...block.matchAll(/([A-D])\)\s*(.*)/g)];
    const answerMatch = block.match(/(?:Réponse|Answer):\s*(.*)/i);
    const expMatch = block.match(/(?:Explication|Explanation):\s*(.*)/i);

    if (questionMatch && optionsMatches.length >= 2) {
      const options = optionsMatches.map(m => ({
        letter: m[1],
        text: m[2].trim()
      }));
      const correctAnswerStr = answerMatch ? answerMatch[1].trim() : "";
      const explanation = expMatch ? expMatch[1].trim() : "Guided explanation by the socratic mentor.";

      return {
        cleanText,
        qcm: {
          question: questionMatch[1].trim(),
          options,
          correctAnswerStr,
          explanation
        }
      };
    }

    return { cleanText: text, qcm: null };
  };

  // ========================================================
  // PDF EXPORT HANDLERS (Summary, Mindmap, Quiz, Archives)
  // ========================================================
  const handleExportLessonPdf = async () => {
    if (!lessonContent) return;
    setIsExportingPdf(true);
    try {
      await exportSummaryToPdf({
        title: `Leçon : ${lessonTopic}`,
        topic: lessonTopic,
        summary: lessonContent,
        badge: `LEÇON NIVEAU ${lessonLevel.toUpperCase()}`,
        sourceDoc: chatDocument?.fileName
      });
      playSuccessSound();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'exportation PDF de la leçon.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportMindmapPdf = async () => {
    if (mindmapNodes.length === 0) return;
    setIsExportingPdf(true);
    try {
      await exportMindmapToPdf({
        title: `Carte Mentale : ${mindmapQuery}`,
        root: mindmapQuery,
        nodes: mindmapNodes,
        edges: mindmapEdges,
        badge: 'RÉSEAU CONCEPTUEL VECTORIEL'
      });
      playSuccessSound();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'exportation PDF de la carte mentale.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportQuizPdf = async () => {
    if (quizQuestions.length === 0) return;
    setIsExportingPdf(true);
    try {
      await exportQuizToPdf({
        title: `Quiz & Corrigé : ${quizTopic}`,
        topic: quizTopic,
        questions: quizQuestions,
        score: quizAnswered ? quizScore : undefined,
        total: quizQuestions.length,
        badge: 'ÉVALUATION & CORRIGÉ DÉTAILLÉ'
      });
      playSuccessSound();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'exportation PDF du quiz.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportHistoryItemPdf = async (item: MentoraHistoryItem) => {
    setIsExportingPdf(true);
    try {
      if (item.type === 'lesson') {
        await exportSummaryToPdf({
          title: `Leçon : ${item.topic}`,
          summary: item.fullContent,
          badge: 'ARCHIVE DE LEÇON'
        });
      } else if (item.type === 'mindmap') {
        await downloadPdfDocument(`Carte Mentale - ${item.topic}`, item.fullContent, 'CARTE MENTALE ARCHIVÉE');
      } else if (item.type === 'quiz') {
        await downloadPdfDocument(`Résultat Quiz - ${item.topic}`, item.fullContent, 'RÉSULTAT DE QUIZ ARCHIVÉ');
      } else {
        await downloadPdfDocument(`Dialogue Socratique - ${item.topic}`, item.fullContent, 'DIALOGUE SOCRATIQUE ARCHIVÉ');
      }
      playSuccessSound();
    } catch (e) {
      console.error(e);
      alert("Erreur lors du téléchargement du PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ========================================================
  // DEEP COGNITIVE ANALYSIS ENGINE (Dossiers, Documents & Chapters)
  // Multi-Phase Analysis: Sémantique -> Synthèse -> Structuration
  // ========================================================
  const runDeepDocumentAnalysis = async (
    sourceText: string,
    title: string,
    mode: 'lesson' | 'mindmap' | 'quiz' | 'all' = 'lesson'
  ) => {
    if (!sourceText.trim()) {
      alert("Le texte source est vide.");
      return;
    }

    setIsDeepAnalyzing(true);
    setDeepAnalysisTaskTitle(title);
    setDeepAnalysisStage(1);
    setDeepAnalysisProgress(15);
    setDeepAnalysisMsg("Phase 1/3 : Ingestion sémantique & extraction des axiomes clés...");
    setDeepAnalysisElapsedSec(0);

    // Dynamic timer for UI feedback and giving time to the AI analysis
    const timer = setInterval(() => {
      setDeepAnalysisElapsedSec(prev => prev + 1);
    }, 1000);

    const stage2Timer = setTimeout(() => {
      setDeepAnalysisStage(2);
      setDeepAnalysisProgress(55);
      setDeepAnalysisMsg("Phase 2/3 : Déduction socratique, synthèse conceptuelle & cartographie...");
    }, 1800);

    const stage3Timer = setTimeout(() => {
      setDeepAnalysisStage(3);
      setDeepAnalysisProgress(85);
      setDeepAnalysisMsg("Phase 3/3 : Validation pédagogique, formulation structurée & formats d'exportation...");
    }, 3800);

    try {
      const cleanSource = sourceText.slice(0, 16000); // Send rich context to the AI

      if (mode === 'lesson' || mode === 'all') {
        const lessonPrompt = `Tu es Mentora AI, le tuteur socratique et professeur de sciences cognitives le plus avancé.
Effectue une ANALYSE APPROFONDIE et génère une FICHE DE SYNTHÈSE PÉDAGOGIQUE MAÎTRESSE à partir du texte suivant :

TITRE DU DOSSIER : "${title}"

TEXTE SOURCE DU DOSSIER :
${cleanSource}

CONSIGNES DE STRUCTURATION OBLIGATOIRES (Markdown propre et soigné) :
1. ## 🎓 Grand Titre & Contexte Fondamental
2. ### 📌 1. Définitions & Axiomes Clés (avec explications limpides)
3. ### ⚙️ 2. Développement Analytique (3 sous-sections thématiques détaillant les mécanismes, formules ou principes logiques)
4. ### 💡 3. Applications Pratiques & Exemples Concrets
5. ### 🧠 4. Synthèse Mémorielle (3 points d'ancrage essentiels avec emojis)
6. ### ❓ 5. Défi Socratique & Question de Réflexion Ouverte

Rédige en français avec rigueur, clarté et bienveillance pédagogique.`;

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: lessonPrompt })
        });
        if (!res.ok) throw new Error("Erreur lors de la génération de la leçon.");
        const data = await res.json();
        const content = data.text || "Synthèse générée.";
        setLessonTopic(title);
        setLessonContent(content);
        addHistoryItem('lesson', title, content);
      }

      if (mode === 'mindmap' || mode === 'all') {
        const mindmapPrompt = `Tu es un expert en cartographie cognitive et cartographie conceptuelle.
Génère une structure de CARTE MENTALE CONCEPTUELLE (Mindmap) au format JSON STRICT pour le sujet : "${title}".
À partir du texte source :
${cleanSource.slice(0, 5000)}

Le format de retour doit être STRICTEMENT du JSON sans markdown autour :
{
  "nodes": [
    {"id": "1", "label": "Concept Principal", "category": "core", "details": "Définition maîtresse"},
    {"id": "2", "label": "Axe Majeur 1", "category": "sub", "details": "Détails essentiels 1"},
    {"id": "3", "label": "Axe Majeur 2", "category": "sub", "details": "Détails essentiels 2"},
    {"id": "4", "label": "Application / Exemple 1", "category": "detail", "details": "Détail d'application 1"},
    {"id": "5", "label": "Application / Exemple 2", "category": "detail", "details": "Détail d'application 2"},
    {"id": "6", "label": "Perspectives & Limites", "category": "sub", "details": "Ouverture réflexive"}
  ],
  "edges": [
    {"from": "1", "to": "2"},
    {"from": "1", "to": "3"},
    {"from": "2", "to": "4"},
    {"from": "3", "to": "5"},
    {"from": "1", "to": "6"}
  ]
}`;

        const resMap = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: mindmapPrompt })
        });
        if (resMap.ok) {
          const mapData = await resMap.json();
          let rawJson = mapData.text.trim();
          if (rawJson.includes('```json')) {
            rawJson = rawJson.split('```json')[1].split('```')[0].trim();
          } else if (rawJson.includes('```')) {
            rawJson = rawJson.split('```')[1].split('```')[0].trim();
          }
          const parsed = JSON.parse(rawJson);
          if (parsed && parsed.nodes) {
            const nodesWithCoords = parsed.nodes.map((node: any, idx: number) => {
              let x = 250;
              let y = 200;
              if (node.category === 'core') {
                x = 250;
                y = 200;
              } else if (node.category === 'sub') {
                const angle = (idx * 2 * Math.PI) / (parsed.nodes.filter((n: any) => n.category === 'sub').length || 4);
                x = 250 + 130 * Math.cos(angle);
                y = 200 + 100 * Math.sin(angle);
              } else {
                const angle = (idx * 2 * Math.PI) / (parsed.nodes.length || 5) + 0.5;
                x = 250 + 200 * Math.cos(angle);
                y = 200 + 150 * Math.sin(angle);
              }
              return { ...node, x, y };
            });
            setMindmapQuery(title);
            setMindmapNodes(nodesWithCoords);
            setMindmapEdges(parsed.edges || []);
            setSelectedNode(nodesWithCoords[0]);
            addHistoryItem('mindmap', title, `Mindmap générée pour ${title} (${nodesWithCoords.length} nœuds).`);
          }
        }
      }

      if (mode === 'quiz' || mode === 'all') {
        const quizPrompt = `Tu es un expert en évaluation formative et psychométrie pédagogique.
Génère un QUIZ ADAPTATIF de 4 questions QCM fondé STRICTEMENT sur le texte source suivant :

TITRE : "${title}"
TEXTE SOURCE :
${cleanSource.slice(0, 6000)}

Le format de retour doit être STRICTEMENT un tableau JSON valide sans markdown :
[
  {
    "id": 1,
    "text": "Question d'assimilation 1 ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Explication socratique claire de la réponse exacte et pourquoi les autres sont fausses."
  },
  {
    "id": 2,
    "text": "Question de compréhension 2 ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Explication socratique détaillée."
  },
  {
    "id": 3,
    "text": "Question d'application concrète 3 ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option C",
    "explanation": "Explication socratique détaillée."
  },
  {
    "id": 4,
    "text": "Question d'analyse avancée 4 ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option D",
    "explanation": "Explication socratique approfondie."
  }
]`;

        const resQuiz = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: quizPrompt })
        });
        if (resQuiz.ok) {
          const quizData = await resQuiz.json();
          let rawJson = quizData.text.trim();
          if (rawJson.includes('```json')) {
            rawJson = rawJson.split('```json')[1].split('```')[0].trim();
          } else if (rawJson.includes('```')) {
            rawJson = rawJson.split('```')[1].split('```')[0].trim();
          }
          const parsedQuiz = JSON.parse(rawJson);
          if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
            setQuizTopic(title);
            setQuizQuestions(parsedQuiz);
            setCurrentQuizIdx(0);
            setSelectedQuizOption(null);
            setQuizAnswered(false);
            addHistoryItem('quiz', title, `Quiz de ${parsedQuiz.length} questions généré pour ${title}.`);
          }
        }
      }

      setDeepAnalysisProgress(100);
      setDeepAnalysisMsg("Analyse cognitive terminée avec succès !");
      playSuccessSound();

      // Update student profile XP
      const updatedProfile = {
        ...studentProfile,
        xp: studentProfile.xp + 100
      };
      saveProfile(updatedProfile);

      // Route to destination tab
      if (mode === 'mindmap') {
        setActiveTab('mindmap');
      } else if (mode === 'quiz') {
        setActiveTab('quiz');
      } else {
        setActiveTab('lesson');
      }

    } catch (err) {
      console.error("Deep analysis error:", err);
      // Fallback generation
      if (mode === 'lesson' || mode === 'all') {
        const sampleText = sourceText.slice(0, 1500);
        const fallbackLesson = `## 📄 Synthèse Approfondie : ${title}\n\n### 1. Concepts Fondamentaux\nCe dossier aborde les points cardinaux suivants :\n\n${sampleText}\n\n### 2. Points Clés & Déductions\n* 💡 **Axiome 1 :** L'analyse continue et la lecture active consolident les synapses mémorielles.\n* 💡 **Axiome 2 :** La décomposition des idées complexes évite la surcharge cognitive.\n\n*Question Socratique :* Comment ce concept peut-il être appliqué pour résoudre un cas réel ?`;
        setLessonTopic(title);
        setLessonContent(fallbackLesson);
        setActiveTab('lesson');
      }
    } finally {
      clearInterval(timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      setIsDeepAnalyzing(false);
    }
  };

  const handleGenerateFromChapter = (chapter: any) => {
    runDeepDocumentAnalysis(chapter.content, `${chapter.title}`, 'lesson');
  };

  const handleGenerateMindmapFromChapter = (chapter: any) => {
    runDeepDocumentAnalysis(chapter.content, `${chapter.title}`, 'mindmap');
  };

  const handleGenerateQuizFromChapter = (chapter: any) => {
    runDeepDocumentAnalysis(chapter.content, `${chapter.title}`, 'quiz');
  };

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 ${
      standaloneWindow ? 'fixed inset-0 z-50 bg-slate-950 p-6 md:p-10 overflow-y-auto' : ''
    }`}>
      
      {/* HEADER SECTION WITH NAVIGATION & METRICS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setMainView('hub')}
              className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 px-3.5 py-1.5 rounded-xl transition-all shadow-md group cursor-pointer"
              title="Retourner au Hub principal"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
              <span>Retour au Hub</span>
            </button>
            <button
              onClick={() => setStandaloneWindow(!standaloneWindow)}
              className="flex items-center gap-1.5 text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              {standaloneWindow ? "Exit Studio Window Mode" : "🖥️ Dedicated Studio Window"}
            </button>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <button
              onClick={() => setMainView('hub')}
              className="p-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-2xl transition-all hover:scale-105 active:scale-95 text-purple-400 group shrink-0"
              title="Retourner au Hub principal"
            >
              <ArrowLeft className="w-6 h-6 text-purple-400 group-hover:-translate-x-1 transition-transform" />
            </button>
            <Brain className="w-10 h-10 text-violet-500 animate-pulse" />
            MOUNT <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500">AI SCHOLAR</span>
          </h2>
          <p className="text-slate-400 font-medium font-mono text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
            <span>Interactive & Audio Socratic Tutor</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">No Direct Answers • Pure Deduction</span>
          </p>
        </div>

        {/* Level, streak widget and Login Modal trigger */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl shrink-0">
          <button
            onClick={() => {
              setLoginNameInput(studentProfile.name);
              setLoginGradeInput(studentProfile.levelCategory);
              setAuthError("");
              setAuthSuccessMsg("");
              setShowLoginModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border border-violet-500/40 rounded-xl text-white font-bold text-xs transition-all shadow-lg hover:scale-105 cursor-pointer"
            title="Mount AI Student Authentication Portal"
          >
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <div className="text-left">
              <p className="text-[9px] font-mono text-violet-300 uppercase leading-none">
                {mentoraAuthUser ? "Mount Account" : "Mount AI Login"}
              </p>
              <p className="text-xs font-black text-white leading-tight">
                {mentoraAuthUser?.name || studentProfile.name}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <Trophy className="w-4 h-4 text-violet-400" />
            <div className="text-left">
              <p className="text-[10px] font-mono text-slate-500 uppercase">Level</p>
              <p className="text-xs font-black text-white">Lvl. {studentProfile.level} — {studentProfile.xp} XP</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <Zap className="w-4 h-4 text-orange-400 animate-bounce" />
            <div className="text-left">
              <p className="text-[10px] font-mono text-slate-500 uppercase">Streak</p>
              <p className="text-xs font-black text-white">🔥 {studentProfile.streak} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* VOICE & AUDIO CONTROL BANNER */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Synthetic Voice & Socratic Sound Effects
              {speakingMessageId && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] rounded font-mono animate-pulse">Reading aloud... 🔊</span>}
            </h4>
            <p className="text-[11px] text-slate-400">
              {autoVoiceNarration ? "The mentor automatically reads all socratic responses aloud." : "Auto-voice disabled. Click 🔊 to listen."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle Auto Voice Narration */}
          <button
            onClick={() => {
              setAutoVoiceNarration(!autoVoiceNarration);
              if (speakingMessageId) stopSpeaking();
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              autoVoiceNarration 
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
            }`}
          >
            {autoVoiceNarration ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
            <span>Auto Voice: {autoVoiceNarration ? 'ACTIVE' : 'MUTED'}</span>
          </button>

          {/* Test Sound Button */}
          <button
            onClick={playSuccessSound}
            className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 text-xs font-mono rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Test success sound"
          >
            🎵 Test Sound
          </button>

          {/* Stop Speech Button */}
          {speakingMessageId && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-2 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" /> Stop Voice
            </button>
          )}
        </div>
      </div>

      {/* GLOBAL MENTORA DOCUMENT IMPORT & WORKSPACE ACTION BAR */}
      <div className="p-5 bg-gradient-to-r from-violet-950/90 via-slate-900 to-indigo-950/90 border border-violet-500/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="p-3 bg-violet-500/20 rounded-2xl border border-violet-500/30 text-violet-300 shrink-0 shadow-lg">
            <FileText className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex flex-wrap items-center gap-2">
              <span>Grand Document & PDF Volumineux</span>
              {chatDocument && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-mono border border-emerald-500/30 flex items-center gap-1">
                  📄 {chatDocument.fileName} ({parsedDocResult?.totalPages || 1} p.)
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {chatDocument 
                ? `Extraction fluide (${formatBytes(chatDocument.size)}, ${chatDocument.text.length} car., ${parsedDocResult?.chapters.length || 1} chapitres). Découpé sans bloquer le navigateur.`
                : 'Importez des manuels entiers, sujets d\'examen ou cours volumineux (PDF, DOCX, PPTX) pour synthèses, cartes mentales & quiz instantanés.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <label className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg ${
            isUploadingDoc
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
              : chatDocument
              ? 'bg-violet-600/30 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:bg-violet-600/50'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-violet-400/50'
          }`}
          title="Importer un fichier PDF (même volumineux), Word (.docx), PowerPoint (.pptx) ou Texte"
          >
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md" 
              onChange={handleUploadChatDoc} 
              className="hidden" 
            />
            <FileText className="w-4 h-4 text-violet-200" />
            <span>{isUploadingDoc ? 'Traitement du PDF...' : chatDocument ? 'Remplacer Document' : 'Importer PDF / Word / PPTX'}</span>
          </label>

          {chatDocument && (
            <button
              onClick={() => setActiveTab('doc-studio')}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-violet-500/40 text-violet-300 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Ouvrir le studio d'analyse et découpage du document"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Studio Document</span>
            </button>
          )}

          {onAddToWorkspace && (
            <button
              onClick={() => {
                const exportContent = chatDocument 
                  ? chatDocument.text 
                  : `Mentor Socratique - Session de cours (${studentProfile.name})\nFocus: ${studentProfile.focusArea}\nNiveau: ${studentProfile.levelCategory}`;
                onAddToWorkspace(chatDocument ? `Document Source - ${chatDocument.fileName}` : 'Mentora AI - Bilan & Cours', exportContent);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg"
              title="Exporter vers Google Workspace"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* STREAMING PROGRESS BAR FOR HEAVY DOCUMENTS */}
      {uploadProgress && (
        <div className="p-4 bg-slate-900/95 border border-violet-500/60 rounded-2xl space-y-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-violet-300 font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
              {uploadProgress.message}
            </span>
            <span className="text-violet-300 font-bold bg-violet-950/80 px-2.5 py-0.5 rounded-lg border border-violet-500/40">
              {uploadProgress.percent}%
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-violet-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
              style={{ width: `${uploadProgress.percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>{uploadProgress.currentPage > 0 ? `Page ${uploadProgress.currentPage} / ${uploadProgress.totalPages}` : 'Découpage asynchrone non-bloquant...'}</span>
            <span className="text-emerald-400">⚡ Zero-Freeze Architecture</span>
          </div>
        </div>
      )}

      {/* PDF & DOCUMENT PREVIEW BANNER */}
      {chatDocument && (
        <PDFPreviewBanner
          document={chatDocument}
          parsedResult={parsedDocResult}
          onClearDocument={() => {
            setChatDocument(null);
            setParsedDocResult(null);
          }}
          onOpenStudio={() => setActiveTab('doc-studio')}
          onStartAnalysis={(selectedText) => {
            if (selectedText) {
              setChatInput(`Analyse et explique-moi en détail cet extrait : "${selectedText.slice(0, 300)}..."`);
            } else {
              setChatInput(`Bonjour ! Guide-moi pas à pas pour comprendre le document "${chatDocument.fileName}". Pose-moi une première question socratique pour tester mes connaissances.`);
            }
            setActiveTab('chat');
          }}
        />
      )}

      {/* DEEP COGNITIVE ANALYZER LIVE HUD (Giving AI adequate time to synthesize dossiers) */}
      {isDeepAnalyzing && (
        <div className="p-6 bg-gradient-to-r from-violet-950/90 via-slate-900/95 to-indigo-950/90 border border-violet-500/60 rounded-3xl space-y-4 shadow-[0_0_40px_rgba(139,92,246,0.25)] animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-violet-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Analyse Cognitive Approfondie en cours
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ⏱️ {deepAnalysisElapsedSec}s écoulées
                  </span>
                </div>
                <h4 className="text-sm font-black text-white tracking-tight mt-0.5">
                  {deepAnalysisTaskTitle}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-300 bg-violet-950/60 px-3 py-1.5 rounded-xl border border-violet-500/30">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
              <span>{deepAnalysisProgress}%</span>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-violet-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
              style={{ width: `${deepAnalysisProgress}%` }}
            />
          </div>

          {/* 3 Active Analysis Stages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 ${
              deepAnalysisStage >= 1
                ? 'bg-violet-900/30 border-violet-500/40 text-violet-200'
                : 'bg-slate-950/50 border-slate-800 text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${deepAnalysisStage === 1 ? 'bg-violet-400 animate-ping' : deepAnalysisStage > 1 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span className="text-[10px] uppercase tracking-wider font-bold">1. Ingestion Sémantique</span>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 ${
              deepAnalysisStage >= 2
                ? 'bg-purple-900/30 border-purple-500/40 text-purple-200'
                : 'bg-slate-950/50 border-slate-800 text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${deepAnalysisStage === 2 ? 'bg-purple-400 animate-ping' : deepAnalysisStage > 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span className="text-[10px] uppercase tracking-wider font-bold">2. Synthèse & Mindmap</span>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 ${
              deepAnalysisStage >= 3
                ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-950/50 border-slate-800 text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${deepAnalysisStage === 3 ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`} />
              <span className="text-[10px] uppercase tracking-wider font-bold">3. Structuration & Quiz</span>
            </div>
          </div>

          <p className="text-xs text-violet-300/90 font-mono italic">
            {deepAnalysisMsg}
          </p>
        </div>
      )}

      {/* MINIMALIST TAB NAVIGATION */}
      <div className="flex border-b border-slate-800 overflow-x-auto pb-px scrollbar-hide max-w-full">
        {[
          { id: 'dashboard', label: 'Dashboard & Stats', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'doc-studio', label: chatDocument ? `Studio Doc (${chatDocument.fileName.slice(0, 10)}...)` : 'Studio Document & PDF', icon: <FileText className="w-4 h-4" /> },
          { id: 'chat', label: 'Mentora Tutor', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'lesson', label: 'Lesson Generator', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'quiz', label: 'Quizzes & Tests', icon: <Gamepad2 className="w-4 h-4" /> },
          { id: 'mindmap', label: 'Mind Mapping', icon: <Network className="w-4 h-4" /> },
          { id: 'history', label: 'Mentora History', icon: <History className="w-4 h-4" /> },
          { id: 'diagnostic', label: 'Initial Diagnostic', icon: <Activity className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-5 py-4 border-b-2 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'border-violet-500 text-white bg-violet-500/5' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="min-h-[500px]">
        
        {/* TAB 1: STUDENT DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Column: Profile Card & Progress */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Student Overview Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-800 flex items-center justify-center text-white font-black text-2xl shadow-xl border border-violet-400/20">
                      {studentProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">{studentProfile.name}</h3>
                      <p className="text-xs font-mono text-violet-400 uppercase tracking-wider font-bold">
                        Style: {studentProfile.learningStyle}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Priority Focus</p>
                    <p className="text-sm font-bold text-white">{studentProfile.focusArea}</p>
                  </div>
                </div>

                {/* Progress bar to next level */}
                <div className="pt-6 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 uppercase font-bold">Level Progress</span>
                    <span className="text-white font-black">{studentProfile.xp} / 1000 XP</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-1000" 
                      style={{ width: `${Math.min((studentProfile.xp / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/60">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Target Level</p>
                    <p className="text-lg font-black text-white">{studentProfile.levelCategory}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Lessons Studied</p>
                    <p className="text-lg font-black text-white">{studentProfile.xp >= 600 ? "4" : "1"}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Audio Feedback</p>
                    <p className="text-lg font-black text-emerald-400">Active 🔊</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Initial Diagnostic</p>
                    <p className={`text-sm font-bold ${studentProfile.hasCompletedDiagnostic ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                      {studentProfile.hasCompletedDiagnostic ? "Completed" : "To Do ⚠️"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cognitive Diagnosis Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strengths Card */}
                <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Identified Cognitive Strengths
                  </h4>
                  {studentProfile.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {studentProfile.strengths.map((s, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Complete the Initial Diagnostic to map your cognitive strengths.
                    </p>
                  )}
                </div>

                {/* Weaknesses Card */}
                <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-500" /> Priority Improvement Areas
                  </h4>
                  {studentProfile.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {studentProfile.weaknesses.map((w, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-violet-400 shrink-0" /> {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Complete the Initial Diagnostic to identify your improvement areas.
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Right Column: Achievements & Badges */}
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Award className="w-5 h-5 text-yellow-500" /> Unlocked Achievements
                </h3>

                <div className="space-y-4">
                  {[
                    { id: 'pioneer', title: 'Socratic Pioneer', desc: 'First connection to the student tutor.', icon: '🎓', color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30' },
                    { id: 'diagnostic', title: 'Diagnostic Complete', desc: 'Completed full cognitive assessment.', icon: '⚡', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' },
                    { id: 'vocal', title: 'Vocal Pioneer', desc: 'Used active speech dictation.', icon: '🎙️', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30' },
                    { id: 'map', title: 'Network Architect', desc: 'Generated an interactive concept map.', icon: '🗺️', color: 'from-pink-500/20 to-pink-600/20 border-pink-500/30' },
                    { id: 'perfect', title: 'Perfect Score', desc: 'Achieved 100% score on an adaptive quiz.', icon: '🏆', color: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30' }
                  ].map((ach) => {
                    const isUnlocked = unlockedAchievements.includes(ach.id);
                    return (
                      <div 
                        key={ach.id} 
                        className={`p-4 rounded-2xl border flex gap-4 items-start transition-all duration-300 ${
                          isUnlocked 
                            ? `bg-gradient-to-r ${ach.color} text-white` 
                            : 'bg-slate-950/40 border-slate-900 opacity-40 grayscale'
                        }`}
                      >
                        <div className="text-2xl p-2 bg-black/20 rounded-xl">{ach.icon}</div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">{ach.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{ach.desc}</p>
                          {isUnlocked && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-black/30 rounded text-[8px] font-mono uppercase text-white tracking-widest font-bold">Unlocked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB: STUDIO GRAND DOCUMENT & ANALYSE PDF VOLUMINEUX */}
        {activeTab === 'doc-studio' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {chatDocument && parsedDocResult ? (
              <div className="space-y-8">
                {/* Document Overview Hero Banner */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-800/60">
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-gradient-to-tr from-violet-600 to-indigo-700 rounded-2xl text-white shadow-xl border border-violet-400/30 shrink-0">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {parsedDocResult.fileType.toUpperCase()}
                          </span>
                          {parsedDocResult.isLargeDocument && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ⚡ GRAND DOCUMENT (STREAMÉ)
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                          {parsedDocResult.fileName}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Extrait avec succès sans bloquer l'UI • Prêt pour génération et export PDF
                        </p>
                      </div>
                    </div>

                    {/* PDF Global Export & Deep AI Generation Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                      <button
                        onClick={() => runDeepDocumentAnalysis(parsedDocResult.text, parsedDocResult.fileName, 'all')}
                        disabled={isDeepAnalyzing}
                        className="px-4 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer animate-pulse"
                        title="Analyser tout le dossier en profondeur et générer fiche complète, mindmap et quiz avec temps d'analyse IA optimisé"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Analyse Approfondie Totale (Fiche + Map + Quiz)</span>
                      </button>

                      <button
                        onClick={async () => {
                          setIsExportingPdf(true);
                          try {
                            const sampleText = parsedDocResult.text.slice(0, 4000);
                            await exportSummaryToPdf({
                              title: `Synthèse Globale : ${parsedDocResult.fileName}`,
                              topic: parsedDocResult.fileName,
                              summary: `### Synthèse du Document\n\nCe document contient **${parsedDocResult.totalPages} pages** et **${parsedDocResult.totalWords.toLocaleString()} mots** répartis en **${parsedDocResult.chapters.length} sections principales**.\n\n#### Extrait Structuré\n\n${sampleText}`,
                              sourceDoc: parsedDocResult.fileName,
                              badge: 'SYNTHÈSE COMPLÈTE MENTORA'
                            });
                            playSuccessSound();
                          } catch (err) {
                            console.error(err);
                            alert("Erreur lors de l'export PDF.");
                          } finally {
                            setIsExportingPdf(false);
                          }
                        }}
                        disabled={isExportingPdf}
                        className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                        title="Exporter la synthèse complète au format PDF haute résolution"
                      >
                        {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        <span>Exporter Synthèse PDF</span>
                      </button>

                      {onAddToWorkspace && (
                        <button
                          onClick={() => {
                            onAddToWorkspace(
                              `Synthèse Globale : ${parsedDocResult.fileName}`,
                              `# Synthèse Globale du Document : ${parsedDocResult.fileName}\n\nPages : ${parsedDocResult.totalPages} | Mots : ${parsedDocResult.totalWords.toLocaleString()} | Chapitres : ${parsedDocResult.chapters.length}\n\n## Contenu\n${parsedDocResult.text.slice(0, 8000)}`
                            );
                          }}
                          className="px-3.5 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                          title="Exporter le document vers Google Workspace (Docs/Drive)"
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Workspace ↗</span>
                        </button>
                      )}

                      <button
                        onClick={() => runDeepDocumentAnalysis(parsedDocResult.text, parsedDocResult.fileName, 'lesson')}
                        disabled={isDeepAnalyzing}
                        className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                        title="Générer une leçon socratique complète à partir du dossier"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                        <span>Créer Leçon</span>
                      </button>

                      <button
                        onClick={() => runDeepDocumentAnalysis(parsedDocResult.text, parsedDocResult.fileName.replace(/\.[^/.]+$/, ""), 'mindmap')}
                        disabled={isDeepAnalyzing}
                        className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                        title="Générer une carte mentale conceptuelle à partir du dossier"
                      >
                        <Network className="w-3.5 h-3.5 text-purple-400" />
                        <span>Créer Mindmap</span>
                      </button>

                      <button
                        onClick={() => runDeepDocumentAnalysis(parsedDocResult.text, parsedDocResult.fileName.replace(/\.[^/.]+$/, ""), 'quiz')}
                        disabled={isDeepAnalyzing}
                        className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                        title="Générer un quiz QCM adaptatif à partir du dossier"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Créer Quiz</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Nombre de Pages</p>
                      <p className="text-xl font-black text-white mt-1">{parsedDocResult.totalPages} pages</p>
                    </div>
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Mots Extraits</p>
                      <p className="text-xl font-black text-emerald-400 mt-1">{parsedDocResult.totalWords.toLocaleString()} mots</p>
                    </div>
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sections / Chapitres</p>
                      <p className="text-xl font-black text-violet-400 mt-1">{parsedDocResult.chapters.length} sections</p>
                    </div>
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Taille du Fichier</p>
                      <p className="text-xl font-black text-slate-300 mt-1">{formatBytes(parsedDocResult.fileSize)}</p>
                    </div>
                  </div>
                </div>

                {/* Chapter Explorer & Section Inspector */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Chapter Index */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-400" /> Sommaire & Sections ({parsedDocResult.chapters.length})
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">Cliquer pour inspecter</span>
                    </div>

                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                      {parsedDocResult.chapters.map((chap, idx) => {
                        const isSelected = (selectedChapterIdx === idx) || (selectedChapterIdx === null && idx === 0);
                        return (
                          <div
                            key={chap.id}
                            onClick={() => setSelectedChapterIdx(idx)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-violet-950/50 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[9px] font-mono text-violet-400 font-bold uppercase">
                                Section {idx + 1}
                              </span>
                              {chap.pageNumber && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  Page {chap.pageNumber}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold line-clamp-2 leading-relaxed">
                              {chap.title}
                            </h5>
                            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                              <span>{chap.wordCount.toLocaleString()} mots</span>
                              <span>•</span>
                              <span>{chap.content.length.toLocaleString()} car.</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Selected Chapter Inspector & Direct Export */}
                  <div className="lg:col-span-2 space-y-4">
                    {(() => {
                      const activeChapter = parsedDocResult.chapters[selectedChapterIdx ?? 0] || parsedDocResult.chapters[0];
                      if (!activeChapter) return null;

                      return (
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-6 md:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/60">
                            <div>
                              <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-bold">
                                Section Inspectée {activeChapter.pageNumber ? `(Page ${activeChapter.pageNumber})` : ''}
                              </span>
                              <h4 className="text-lg font-black text-white mt-1">
                                {activeChapter.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => speakText(activeChapter.content.slice(0, 500))}
                                className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                                title="Écouter la lecture audio"
                              >
                                <Volume2 className="w-4 h-4 text-violet-400" />
                              </button>

                              <button
                                onClick={async () => {
                                  setIsExportingPdf(true);
                                  try {
                                    await exportSummaryToPdf({
                                      title: activeChapter.title,
                                      topic: activeChapter.title,
                                      summary: `### ${activeChapter.title}\n\n${activeChapter.content}`,
                                      sourceDoc: parsedDocResult.fileName,
                                      badge: `SECTION ${selectedChapterIdx ? selectedChapterIdx + 1 : 1} / ${parsedDocResult.chapters.length}`
                                    });
                                    playSuccessSound();
                                  } catch (e) {
                                    console.error(e);
                                    alert("Erreur lors de l'export PDF du chapitre.");
                                  } finally {
                                    setIsExportingPdf(false);
                                  }
                                }}
                                disabled={isExportingPdf}
                                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Exporter ce chapitre en PDF propre pour impression"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF Chapitre</span>
                              </button>

                              {onAddToWorkspace && (
                                <button
                                  onClick={() => {
                                    onAddToWorkspace(
                                      `${activeChapter.title} - ${parsedDocResult.fileName}`,
                                      `# ${activeChapter.title}\n\n**Source :** ${parsedDocResult.fileName} (Page ${activeChapter.pageNumber || 1})\n\n${activeChapter.content}`
                                    );
                                  }}
                                  className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                                  title="Exporter ce chapitre vers Google Workspace"
                                >
                                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Workspace ↗</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons for this chapter */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                              onClick={() => handleGenerateFromChapter(activeChapter)}
                              className="p-3 bg-slate-950 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/50 rounded-xl text-left transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 text-violet-400 mb-1">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase font-mono">Leçon & Fiche</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Transformer en cours socratique interactif
                              </p>
                            </button>

                            <button
                              onClick={() => handleGenerateMindmapFromChapter(activeChapter)}
                              className="p-3 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 text-purple-400 mb-1">
                                <Network className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase font-mono">Mindmap Visuelle</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Structurer les concepts et liens logiques
                              </p>
                            </button>

                            <button
                              onClick={() => handleGenerateQuizFromChapter(activeChapter)}
                              className="p-3 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                <Gamepad2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase font-mono">Quiz & Test</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Générer un QCM d'évaluation adaptatif
                              </p>
                            </button>
                          </div>

                          {/* Content Preview Container */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                              <span>Aperçu textuel du chapitre</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(activeChapter.content);
                                  alert("Texte du chapitre copié !");
                                }}
                                className="text-violet-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copier
                              </button>
                            </div>
                            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 max-h-[360px] overflow-y-auto text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                              {activeChapter.content}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              /* No document loaded - Empty state & Dropzone */
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-[2.5rem] p-12 text-center space-y-6 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-violet-500/10 border border-violet-500/30 rounded-3xl flex items-center justify-center mx-auto text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                  <FileText className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Studio Documents & PDF Volumineux</h3>
                  <p className="text-slate-400 text-xs font-sans mt-2 max-w-md mx-auto leading-relaxed">
                    Importez des manuels entiers, cours universitaires, rapports ou sujets d'examens (jusqu'à des centaines de pages).
                    L'algorithme découpe le document sans figer l'application et génère fiches, mindmaps et quiz exportables en PDF.
                  </p>
                </div>

                <div className="flex justify-center">
                  <label className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest font-mono rounded-2xl transition-all shadow-xl flex items-center gap-3 cursor-pointer">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md" 
                      onChange={handleUploadChatDoc} 
                      className="hidden" 
                    />
                    <FileText className="w-4 h-4" />
                    <span>Choisir un document (PDF, Word, PPTX)</span>
                  </label>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-slate-800/60 text-[11px] font-mono text-slate-500">
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">📄 PDF Multi-pages</span>
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">📝 Word (.docx)</span>
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">📊 PowerPoint (.pptx)</span>
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">🖨️ Export PDF Haute Qualité</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI DIAGNOSTIC ASSESSMENT */}
        {activeTab === 'diagnostic' && (
          <div className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            
            {studentProfile.hasCompletedDiagnostic ? (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Diagnostic Complete!</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Your study profile has been successfully calibrated on a socratic model. Your strengths and priority focus areas have been logged to your dashboard.
                </p>

                <div className="bg-slate-950/80 p-5 rounded-2xl max-w-sm mx-auto border border-slate-800 text-left space-y-3">
                  <p className="text-xs font-mono text-slate-400 uppercase tracking-widest text-center border-b border-slate-800 pb-2">Calculated Profile</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Cognitive style:</span>
                    <span className="text-violet-400 font-bold">{studentProfile.learningStyle}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Starting level:</span>
                    <span className="text-white font-bold">{studentProfile.levelCategory}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Study focus:</span>
                    <span className="text-white font-bold">{studentProfile.focusArea}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-6">
                  <button 
                    onClick={() => {
                      setDiagnosticStep(0);
                      setDiagnosticAnswers([]);
                      saveProfile({ ...studentProfile, hasCompletedDiagnostic: false });
                    }}
                    className="px-6 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs uppercase tracking-widest font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Retake Assessment
                  </button>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="px-6 py-3 bg-white hover:bg-slate-100 rounded-xl text-xs uppercase tracking-widest font-bold text-black transition-colors cursor-pointer"
                  >
                    View My Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header info */}
                <div className="border-b border-slate-800 pb-6">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-violet-400 uppercase tracking-wider font-bold">Socratic Profile Evaluation</span>
                    <span className="text-slate-500">Question {diagnosticStep + 1} / {diagnosticQuestions.length}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                    {diagnosticQuestions[diagnosticStep].title}
                  </h3>
                </div>

                {/* Question body */}
                <div className="space-y-6">
                  <p className="text-slate-300 text-lg font-medium leading-relaxed">
                    {diagnosticQuestions[diagnosticStep].text}
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {diagnosticQuestions[diagnosticStep].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDiagnosticAnswer(opt.key)}
                        className="w-full text-left p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-violet-500/50 hover:bg-violet-500/5 text-slate-300 hover:text-white transition-all duration-300 flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm font-medium leading-relaxed">{opt.label}</span>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 shrink-0 transition-all group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic info card */}
                <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl flex gap-3">
                  <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    The socratic tutor adapts explanations, exercises, and mini-games to match your strengths and decoding style.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: AI LESSON GENERATOR */}
        {activeTab === 'lesson' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Control Panel Column */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Settings className="w-4 h-4 text-violet-400" /> Inference Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-2 block">Lesson Topic</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-violet-500 transition-colors"
                      placeholder="E.g., Photosynthesis, Differential Equations..."
                      value={lessonTopic}
                      onChange={(e) => setLessonTopic(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-2 block">Explanation Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'beginner', label: 'Simple' },
                        { id: 'intermediate', label: 'Standard' },
                        { id: 'advanced', label: 'Advanced' }
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => setLessonLevel(lvl.id as any)}
                          className={`py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            lessonLevel === lvl.id 
                              ? 'bg-violet-500/10 border-violet-500 text-violet-400 font-extrabold shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateLesson}
                    disabled={isGeneratingLesson || !lessonTopic.trim()}
                    className="w-full py-4 bg-white hover:bg-slate-100 disabled:bg-slate-800/50 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGeneratingLesson ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Compiling...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Lesson
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Narrator Voice & PDF Export controls */}
              {lessonContent && (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-violet-400 animate-pulse" /> Actions & Exportation
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Écoutez la leçon lue à voix haute ou exportez-la au format PDF propre pour l'impression et vos révisions.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleReadLesson}
                      className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      {isReadingLesson ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isReadingLesson ? "Arrêter la voix" : "Écouter la Leçon"}
                    </button>

                    <button
                      onClick={handleExportLessonPdf}
                      disabled={isExportingPdf}
                      className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      title="Exporter la leçon au format PDF pour impression"
                    >
                      {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{isExportingPdf ? "Génération PDF..." : "Exporter en PDF 📄"}</span>
                    </button>

                    {onAddToWorkspace && (
                      <button
                        onClick={() => {
                          onAddToWorkspace(`Leçon : ${lessonTopic}`, lessonContent);
                        }}
                        className="w-full py-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                        title="Exporter la fiche de cours vers Google Workspace (Docs/Drive)"
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Exporter vers Workspace ↗</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Display Column */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-8 shadow-2xl min-h-[450px] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-slate-800/30 mix-blend-screen rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
                
                {isGeneratingLesson ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-6 my-auto">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-slate-800 border-t-violet-500 rounded-full animate-spin" />
                      <Brain className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="font-mono text-xs uppercase tracking-widest">Active Semantic Inference...</p>
                  </div>
                ) : lessonContent ? (
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-bold">Semantic Inference</span>
                        <span className="text-xs px-2.5 py-1 bg-violet-500/10 border border-violet-500/30 rounded text-violet-400 uppercase font-mono font-bold">Lvl: {lessonLevel}</span>
                      </div>
                      <button
                        onClick={handleExportLessonPdf}
                        disabled={isExportingPdf}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Télécharger la fiche de cours en PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>Télécharger PDF</span>
                      </button>
                    </div>

                    {/* Rendering split paragraphs for clear narration support */}
                    <div className="space-y-6 text-slate-300 text-sm md:text-base leading-relaxed">
                      {lessonContent.split(/\n\n+/).map((para, idx) => {
                        const isCurrentlyReading = readingParagraphIndex === idx;
                        return (
                          <p 
                            key={idx} 
                            className={`p-3 rounded-xl transition-all duration-300 ${
                              isCurrentlyReading 
                                ? 'bg-violet-500/10 border-l-4 border-violet-500 text-white font-medium pl-4 shadow-lg' 
                                : ''
                            }`}
                          >
                            {para}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-4 my-auto">
                    <BookOpen className="w-12 h-12 text-slate-700" />
                    <p className="text-sm font-mono text-slate-500 uppercase tracking-widest text-center">No lesson loaded. Enter a topic and click generate.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: MENTORA SOCRATIC TUTOR */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] shadow-2xl h-[640px] flex flex-col justify-between overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Header Action Bar: Dedicated Voice Command Button & Socratic Shortcuts */}
            <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              
              {/* Voice Command Button & Language Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`px-3.5 py-1.5 rounded-xl border font-bold text-[11px] font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isRecording
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse'
                      : 'bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border-violet-500/40 text-violet-200 hover:text-white'
                  }`}
                  title="Poser une question oralement au Mentor (Commande vocale temps réel)"
                >
                  <Mic className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-400 animate-bounce' : 'text-violet-400'}`} />
                  <span>{isRecording ? 'Écoute Active' : 'Commande Vocale 🎙️'}</span>
                  {isRecording && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                </button>

                {/* Speech Recognition Language Selector */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[10px] font-mono">
                  {([
                    { code: 'fr-FR', label: 'FR 🇫🇷' },
                    { code: 'en-US', label: 'EN 🇬🇧' },
                    { code: 'es-ES', label: 'ES 🇪🇸' },
                    { code: 'ar-SA', label: 'AR 🇲🇦' }
                  ] as const).map(item => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setVoiceLang(item.code)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                        voiceLang === item.code 
                          ? 'bg-violet-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={`Langue de reconnaissance vocale : ${item.label}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Socratic Prompt Shortcuts */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {chatDocument && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendChat(`Résume-moi en détail et de manière claire les points clés du document "${chatDocument.fileName}".`)}
                      className="px-2.5 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-200 transition-all font-mono text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" /> 📄 Résumer Document
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendChat(`Lis et analyse les concepts clés du document "${chatDocument.fileName}" puis pose-moi une première question de réflexion.`)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 transition-all font-mono text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap font-bold"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> 🔍 Analyser & Questionner
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleSendChat("Donne-moi un mini QCM pas à pas pour tester ma compréhension du concept actuel.")}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 transition-all font-mono text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Gamepad2 className="w-3.5 h-3.5" /> 🎲 QCM Guidé
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat("Donne-moi un indice visuel ou une métaphore intuitive sans me donner la solution brute.")}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all font-mono text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> 💡 Indice
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat("Peux-tu décomposer ce problème en 3 étapes logiques simples ?")}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 transition-all font-mono text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Target className="w-3.5 h-3.5" /> 🎯 3 Étapes
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 scrollbar-hide">
              {chatMessages.map((msg, idx) => {
                const msgId = `chat-msg-${idx}`;
                const { cleanText, qcm } = parseQCMFromText(msg.content);
                const isSpeakingThisMsg = speakingMessageId === msgId;
                const savedQcmAnswer = embeddedQcmAnswers[msgId];

                return (
                  <div 
                    key={idx} 
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                  >
                    {msg.role !== 'user' && (
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-lg">
                        <Brain className="w-4.5 h-4.5" />
                      </div>
                    )}

                    <div className="max-w-[85%] md:max-w-[78%] space-y-3">
                      {/* Message Bubble */}
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed relative group ${
                        msg.role === 'user' 
                          ? 'bg-violet-600 text-white rounded-tr-none' 
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}>
                        {/* Audio speak trigger button for assistant messages */}
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => {
                              if (isSpeakingThisMsg) {
                                stopSpeaking();
                              } else {
                                speakText(msg.content, msgId);
                              }
                            }}
                            className={`absolute top-3 right-3 p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isSpeakingThisMsg
                                ? 'bg-purple-500/30 border-purple-400 text-purple-300 animate-pulse'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Listen to socratic voice"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="pr-6 whitespace-pre-wrap font-sans">
                          {cleanText}
                        </div>

                        {/* EMBEDDED INTERACTIVE QCM CARD */}
                        {qcm && (
                          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-900/80 p-4 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Gamepad2 className="w-3.5 h-3.5" /> Mini-QCM Deduction
                              </span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                                +25 XP
                              </span>
                            </div>

                            <p className="text-xs font-bold text-white leading-relaxed">
                              {qcm.question}
                            </p>

                            <div className="grid grid-cols-1 gap-2">
                              {qcm.options.map((opt, oIdx) => {
                                const isSelected = savedQcmAnswer?.selectedOption === opt.letter;
                                const showResult = !!savedQcmAnswer;
                                const isCorrectOpt = qcm.correctAnswerStr.toLowerCase().includes(opt.letter.toLowerCase()) || qcm.correctAnswerStr.toLowerCase().includes(opt.text.toLowerCase());

                                return (
                                  <button
                                    key={oIdx}
                                    disabled={showResult}
                                    onClick={() => {
                                      const isCorrect = isCorrectOpt;
                                      setEmbeddedQcmAnswers(prev => ({
                                        ...prev,
                                        [msgId]: { selectedOption: opt.letter, isCorrect }
                                      }));

                                      if (isCorrect) {
                                        playSuccessSound();
                                        const updatedProfile = { ...studentProfile, xp: studentProfile.xp + 25 };
                                        saveProfile(updatedProfile);
                                      } else {
                                        playCorrectionSound();
                                      }
                                    }}
                                    className={`w-full text-left p-2.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                                      showResult
                                        ? isCorrectOpt
                                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                                          : isSelected
                                          ? 'bg-red-500/20 border-red-500/50 text-red-300 font-bold'
                                          : 'bg-slate-950 border-slate-800/50 text-slate-500'
                                        : 'bg-slate-950 hover:bg-purple-500/10 border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white'
                                    }`}
                                  >
                                    <span><strong className="text-purple-400 font-mono mr-1.5">{opt.letter})</strong> {opt.text}</span>
                                    {showResult && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                    {showResult && isSelected && !isCorrectOpt && <X className="w-4 h-4 text-red-400 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            {savedQcmAnswer && (
                              <div className={`p-3 rounded-lg text-[11px] font-sans leading-relaxed border ${
                                savedQcmAnswer.isCorrect 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              }`}>
                                <p className="font-bold mb-0.5">
                                  {savedQcmAnswer.isCorrect ? "🎉 Well done! Excellent deduction!" : "💡 Hint for correction:"}
                                </p>
                                <p className="text-[10px] opacity-90">{qcm.explanation}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <p className={`text-[9px] font-mono text-slate-500 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isTypingChat && (
                <div className="flex gap-4 justify-start">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 animate-pulse">
                    <Brain className="w-4.5 h-4.5" />
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[200px] flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form with File Upload (PDF/Word/PPTX) & Speech-to-Text Voice Dictation button */}
            <div className="p-4 md:p-6 bg-slate-950 border-t border-slate-800 flex flex-col gap-3 relative z-10">
              
              {/* Attached Document Badge & Workspace Export Bar */}
              {chatDocument && (
                <div className="flex items-center justify-between gap-2 p-2.5 bg-violet-950/60 border border-violet-500/40 rounded-xl animate-in fade-in">
                  <div className="flex items-center gap-2 overflow-hidden text-xs font-mono text-violet-300">
                    <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="font-bold truncate">{chatDocument.fileName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({Math.round(chatDocument.size / 1024)} Ko)</span>
                    <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-[9px] rounded-full uppercase font-bold">Document Source Actif</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToWorkspace && (
                      <button
                        type="button"
                        onClick={() => onAddToWorkspace(`Chatbot Document - ${chatDocument.fileName}`, chatDocument.text)}
                        className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                      >
                        <Globe className="w-3 h-3" /> Exporter Workspace
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setChatDocument(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                      title="Supprimer le document attaché"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {micError && (
                <div className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{micError}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setMicError("")}
                    className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {/* DEDICATED LIVE VOICE RECORDING & EQUALIZER PANEL (Zero Latency Experience) */}
              {isRecording && (
                <div className="p-4 bg-gradient-to-r from-rose-950/80 via-slate-900 to-purple-950/80 border border-rose-500/40 rounded-2xl flex flex-col gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                      </span>
                      <span className="text-xs font-mono font-black text-rose-300 uppercase tracking-wider">
                        Écoute Vocale Active • Langue: {voiceLang.split('-')[0].toUpperCase()}
                      </span>
                    </div>

                    {/* Animated Equalizer Waveform */}
                    <div className="flex items-center gap-1 h-6 px-3 bg-slate-950/80 rounded-xl border border-rose-500/30">
                      {audioData.map((val, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-gradient-to-t from-rose-500 via-purple-400 to-emerald-400 rounded-full transition-all duration-100"
                          style={{ height: `${Math.max(20, Math.min(100, val))}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Real-time transcribed text preview */}
                  <div className="bg-slate-950/90 border border-rose-500/20 rounded-xl p-3.5 text-xs text-slate-100 font-mono min-h-[46px] flex items-center">
                    {chatInput || interimTranscript ? (
                      <p className="leading-relaxed">
                        <span>{chatInput}</span>
                        {interimTranscript && (
                          <span className="text-rose-400 font-bold italic ml-1"> {interimTranscript}</span>
                        )}
                        <span className="inline-block w-1.5 h-3.5 bg-rose-400 ml-1.5 animate-pulse align-middle" />
                      </p>
                    ) : (
                      <span className="text-slate-400 italic">🎙️ Parlez naturellement... Posez votre question au Mentor en direct.</span>
                    )}
                  </div>

                  {/* Voice Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-400">
                      Cliquez sur "Envoyer" ou arrêtez le micro dès que vous avez fini de poser votre question.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e){}
                          setIsRecording(false);
                          setInterimTranscript("");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 text-slate-400" /> Arrêter l'écoute
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStopVoiceAndSend(interimTranscript)}
                        disabled={!chatInput.trim() && !interimTranscript.trim()}
                        className="px-4 py-1.5 bg-gradient-to-r from-violet-600 via-purple-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Envoyer la question orale 🚀
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 items-center">
                
                {/* File upload button (PDF, DOCX, PPTX, TXT) */}
                <label className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer ${
                  isUploadingDoc
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                    : chatDocument
                    ? 'bg-violet-600/30 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title="Importer un fichier PDF, Word (.docx), PowerPoint (.pptx) ou Texte"
                >
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md" 
                    onChange={handleUploadChatDoc} 
                    className="hidden" 
                  />
                  <FileText className="w-5 h-5" />
                </label>

                {/* Voice recording dictate button */}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer relative group ${
                    isRecording 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-pulse ring-2 ring-rose-500/50' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10'
                  }`}
                  title={isRecording ? "Arrêter la commande vocale" : "Poser une question à l'oral (Commande Vocale)"}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'text-rose-400' : ''}`} />
                  {isRecording && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                  )}
                </button>

                <input 
                  type="text" 
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-2xl px-5 py-4 text-white text-sm outline-none transition-colors font-sans min-w-0"
                  placeholder={
                    isUploadingDoc
                      ? "Extraction du fichier en cours..."
                      : isRecording 
                      ? `Écoute en cours (${voiceLang.split('-')[0].toUpperCase()})... Parlez maintenant.` 
                      : chatDocument
                      ? `Posez une question sur "${chatDocument.fileName}" (texte ou micro)...`
                      : "Posez votre question (au clavier ou au micro 🎙️)..."
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                  disabled={isUploadingDoc}
                />

                <button
                  type="button"
                  onClick={() => handleSendChat()}
                  disabled={!chatInput.trim() || isUploadingDoc}
                  className="p-4 bg-white hover:bg-slate-100 disabled:bg-slate-900 border border-transparent disabled:border-slate-800 text-black disabled:text-slate-500 rounded-2xl transition-all font-bold shrink-0 flex items-center justify-center cursor-pointer"
                  title="Envoyer la question au Mentor"
                >
                  <Send className="w-5 h-5" />
                </button>

              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider px-1">
                <span>Le Mentor ne donne jamais la réponse brute • Commande Vocale Temps Réel 🎙️ • Support PDF & Documents</span>
                {onAddToWorkspace && chatMessages.length > 0 && (
                  <button
                    onClick={() => {
                      const chatHistoryText = chatMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
                      onAddToWorkspace('Session Chatbot Google Search', chatHistoryText);
                    }}
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-bold lowercase hover:underline"
                  >
                    exporter la discussion vers workspace ↗
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: CONCEPT MAPPINGS (MINDMAPS) */}
        {activeTab === 'mindmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Search and control sidebar */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Network className="w-4 h-4 text-violet-400" /> Mapping Settings
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  Enter a study concept. Our system will structure a concept map and corresponding links.
                </p>

                <div className="space-y-3">
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl p-3 text-xs text-white outline-none font-mono transition-all"
                    placeholder="Map topic"
                    value={mindmapQuery}
                    onChange={(e) => setMindmapQuery(e.target.value)}
                  />

                  <button
                    onClick={handleGenerateMindmap}
                    disabled={isGeneratingLesson || !mindmapQuery.trim()}
                    className="w-full py-3 bg-white hover:bg-slate-100 disabled:bg-slate-800/50 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGeneratingLesson ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Generate Map
                  </button>

                  <button
                    onClick={handleExportMindmapPdf}
                    disabled={isExportingPdf || mindmapNodes.length === 0}
                    className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Exporter la carte mentale et ses liens conceptuels en PDF haute résolution"
                  >
                    {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Exporter en PDF 🗺️</span>
                  </button>

                  {onAddToWorkspace && mindmapNodes.length > 0 && (
                    <button
                      onClick={() => {
                        const mindmapText = `# Carte Mentale : ${mindmapQuery}\n\n## Nœuds Conceptuels\n` + 
                          mindmapNodes.map(n => `- **${n.label}** (${n.category}) : ${n.details || 'N/A'}`).join('\n') +
                          `\n\n## Liens Logiques\n` +
                          mindmapEdges.map(e => {
                            const from = mindmapNodes.find(n => n.id === e.from)?.label || e.from;
                            const to = mindmapNodes.find(n => n.id === e.to)?.label || e.to;
                            return `- ${from} ➔ ${to}`;
                          }).join('\n');
                        onAddToWorkspace(`Carte Mentale : ${mindmapQuery}`, mindmapText);
                      }}
                      className="w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      title="Exporter la structure de la carte mentale vers Google Workspace"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Workspace ↗</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Node Explanatory Detail Card */}
              {selectedNode && (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 space-y-3 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-black ${
                      selectedNode.category === 'core' 
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {selectedNode.category}
                    </span>
                    <button 
                      onClick={() => speakText(selectedNode.label + ". " + (selectedNode.details || ""))}
                      className="p-1 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors cursor-pointer"
                      title="Read description aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-white uppercase tracking-tight">{selectedNode.label}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{selectedNode.details || "No description available for this sub-concept."}</p>
                </div>
              )}
            </div>

            {/* Interactive Graph Canvas Column */}
            <div className="lg:col-span-3">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between min-h-[450px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                
                {/* SVG Interactive Node graph */}
                <div className="relative w-full overflow-hidden rounded-2xl flex items-center justify-center bg-slate-950 border border-slate-800/60 p-4 min-h-[380px]">
                  <svg className="w-full h-full min-h-[350px] max-w-lg" viewBox="0 0 500 450">
                    
                    {/* Draw Links/Edges */}
                    {mindmapEdges.map((edge, idx) => {
                      const fromNode = mindmapNodes.find(n => n.id === edge.from);
                      const toNode = mindmapNodes.find(n => n.id === edge.to);
                      if (!fromNode || !toNode) return null;
                      return (
                        <g key={idx}>
                          <line 
                            x1={fromNode.x} 
                            y1={fromNode.y} 
                            x2={toNode.x} 
                            y2={toNode.y} 
                            stroke="#5b21b6" 
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                            className="animate-pulse"
                          />
                          <circle 
                            cx={(fromNode.x + toNode.x) / 2} 
                            cy={(fromNode.y + toNode.y) / 2} 
                            r="2.5" 
                            fill="#8b5cf6" 
                          />
                        </g>
                      );
                    })}

                    {/* Draw Nodes */}
                    {mindmapNodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const isCore = node.category === 'core';
                      return (
                        <g 
                          key={node.id} 
                          onClick={() => setSelectedNode(node)}
                          className="cursor-pointer group select-none"
                        >
                          {/* Outer neon glow shadow for selection */}
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r={isCore ? "32" : "26"} 
                            fill={isSelected ? "rgba(139, 92, 246, 0.15)" : "rgba(30, 41, 59, 0.5)"} 
                            stroke={isSelected ? "#c084fc" : isCore ? "#8b5cf6" : "#475569"} 
                            strokeWidth={isSelected ? "2.5" : "1.5"}
                            className="transition-all duration-300 hover:stroke-violet-400"
                          />
                          
                          {/* Miniature inner core dot */}
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="4" 
                            fill={isCore ? "#c084fc" : "#60a5fa"} 
                          />

                          {/* Node label text split into lines if too long */}
                          <text 
                            x={node.x} 
                            y={node.y + (isCore ? 42 : 36)} 
                            fill={isSelected ? "#ffffff" : "#cbd5e1"} 
                            fontSize={isCore ? "11" : "9.5"}
                            fontWeight={isSelected || isCore ? "900" : "600"}
                            fontFamily="monospace"
                            letterSpacing="0.05em"
                            textAnchor="middle"
                            className="uppercase transition-colors group-hover:fill-white"
                          >
                            {node.label.length > 15 ? node.label.substring(0, 15) + "..." : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Canvas instructions eyebrow */}
                  <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-violet-400" /> Click bubbles to inspect them
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest text-center mt-3">
                  Vector neural model generated via secure asynchronous inference.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: ADAPTIVE EXAMS & QUIZZES */}
        {activeTab === 'quiz' && (
          <div className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-800/20 mix-blend-screen rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
            
            <div className="space-y-8">
              
              {/* Header Topic selection */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-violet-500" /> Knowledge Quiz
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">
                    Self-managed difficulty. XP multipliers active!
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                  <input 
                    type="text" 
                    className="bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    placeholder="Quiz topic"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                  />
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz || !quizTopic.trim()}
                    className="px-4 py-2 bg-white hover:bg-slate-100 disabled:bg-slate-800 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    {isGeneratingQuiz ? "Loading..." : "Start"}
                  </button>

                  {quizQuestions.length > 0 && (
                    <button
                      onClick={handleExportQuizPdf}
                      disabled={isExportingPdf}
                      className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      title="Exporter le quiz et son corrigé complet en PDF"
                    >
                      {isExportingPdf ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      <span>PDF Corrigé 📄</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quiz Body */}
              {quizQuestions.length > 0 ? (
                <div className="space-y-6">
                  
                  {/* Progress indicator */}
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">PROGRESS: {currentQuizIdx + 1} / {quizQuestions.length}</span>
                    <span className="text-violet-400 font-bold">🔥 STREAK: {quizStreak}</span>
                  </div>

                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-4">
                    <p className="text-white text-base font-semibold leading-relaxed">
                      {quizQuestions[currentQuizIdx].text}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizQuestions[currentQuizIdx].options.map((opt, idx) => {
                      const isSelected = selectedQuizOption === opt;
                      const isCorrect = opt === quizQuestions[currentQuizIdx].correctAnswer;
                      
                      let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";
                      if (isSelected) {
                        btnStyle = "bg-violet-500/10 border-violet-500 text-white shadow-lg";
                      }
                      if (quizAnswered) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
                        } else if (isSelected) {
                          btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                        } else {
                          btnStyle = "bg-slate-950 border-slate-900 text-slate-600 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectQuizOption(opt)}
                          disabled={quizAnswered}
                          className={`w-full text-left p-5 rounded-xl border transition-all duration-300 flex items-center justify-between group cursor-pointer ${btnStyle}`}
                        >
                          <span className="text-xs md:text-sm leading-relaxed">{opt}</span>
                          {quizAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                          {quizAnswered && isSelected && !isCorrect && <X className="w-5 h-5 text-red-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation and verification action panel */}
                  <div className="pt-4 flex flex-col gap-4">
                    
                    {quizAnswered && (
                      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-yellow-500" /> Socratic Analysis
                          </h4>
                          <button 
                            onClick={() => speakText(quizQuestions[currentQuizIdx].explanation)}
                            className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors cursor-pointer"
                            title="Listen to vocal explanation"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {quizQuestions[currentQuizIdx].explanation}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      {!quizAnswered ? (
                        <button
                          onClick={handleVerifyQuizAnswer}
                          disabled={!selectedQuizOption}
                          className="px-6 py-3 bg-white hover:bg-slate-100 disabled:bg-slate-800/40 text-black disabled:text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuiz}
                          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          {currentQuizIdx < quizQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 py-12 space-y-3">
                  <Gamepad2 className="w-12 h-12 text-slate-700" />
                  <p className="text-sm font-mono text-slate-500 uppercase tracking-widest text-center">No active quiz. Enter a topic to generate questions.</p>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 7: DEDICATED MENTORA AI HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter and Search Bar */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full md:w-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'lesson', label: '📖 Lessons' },
                  { id: 'quiz', label: '🧩 Quizzes' },
                  { id: 'chat', label: '💬 Chats' },
                  { id: 'mindmap', label: '🧠 Maps' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      historyFilter === f.id
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Clear History Button */}
              {mentoraHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Do you want to clear all Mentora AI history?")) {
                      setMentoraHistory([]);
                      localStorage.removeItem('mentora_history_v2');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 text-xs font-mono rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
              )}
            </div>

            {/* History Cards List */}
            {mentoraHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentoraHistory
                  .filter(item => historyFilter === 'all' || item.type === historyFilter)
                  .map((item) => {
                    const badgeColors = {
                      lesson: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                      quiz: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      chat: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                      mindmap: 'bg-pink-500/10 text-pink-400 border-pink-500/30'
                    };

                    const typeIcons = {
                      lesson: '📖 Lesson',
                      quiz: '🧩 Quiz',
                      chat: '💬 Dialogue',
                      mindmap: '🧠 Map'
                    };

                    return (
                      <div 
                        key={item.id}
                        className="bg-slate-900/40 border border-slate-800 hover:border-violet-500/50 p-6 rounded-[2rem] flex flex-col justify-between space-y-4 transition-all duration-300 hover:shadow-xl group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${badgeColors[item.type]}`}>
                              {typeIcons[item.type]}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{item.date}</span>
                          </div>

                          <h4 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                            {item.topic}
                          </h4>

                          <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3">
                            {item.summary}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => speakText(`Summary of session on ${item.topic}: ${item.summary}`)}
                              className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Listen to summary"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> Listen
                            </button>

                            <button
                              onClick={() => handleExportHistoryItemPdf(item)}
                              disabled={isExportingPdf}
                              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Exporter cet élément d'historique en PDF"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              if (item.type === 'lesson') {
                                setLessonTopic(item.topic);
                                setLessonContent(item.fullContent);
                                setActiveTab('lesson');
                              } else if (item.type === 'chat') {
                                setActiveTab('chat');
                              } else if (item.type === 'mindmap') {
                                setMindmapQuery(item.topic);
                                setActiveTab('mindmap');
                              } else {
                                setQuizTopic(item.topic);
                                setActiveTab('quiz');
                              }
                            }}
                            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            Reload <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800 rounded-[2rem] p-12 text-center space-y-4">
                <History className="w-12 h-12 text-slate-700 mx-auto" />
                <h4 className="text-lg font-bold text-white">No interaction history recorded</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
                  Interact with the Socratic tutor via Chatbot, Lesson Generator, or Quizzes to build your log.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* DEDICATED MENTORA AI LOGIN & ACCOUNT MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-800 border border-violet-500/40 flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-violet-300" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    Mount <span className="text-violet-400">AI Scholar</span> Login
                  </h3>
                  <p className="text-[10px] font-mono text-violet-300 uppercase tracking-widest font-bold">
                    Dedicated Socratic Student Portal
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setAuthError("");
                  setAuthSuccessMsg("");
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector Tabs: Sign In vs Create Account */}
            <div className="flex p-1 bg-slate-950 border border-slate-800/80 rounded-2xl">
              <button
                onClick={() => { setLoginMode('signin'); setAuthError(""); setAuthSuccessMsg(""); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  loginMode === 'signin'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setLoginMode('signup'); setAuthError(""); setAuthSuccessMsg(""); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  loginMode === 'signup'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Status messages */}
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* Logged in notification / Account active indicator */}
            {mentoraAuthUser && (
              <div className="bg-violet-500/10 border border-violet-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-violet-300 uppercase font-bold">Active Mentora Session</p>
                  <p className="text-sm font-black text-white">{mentoraAuthUser.name} ({mentoraAuthUser.email})</p>
                </div>
                <button
                  onClick={() => {
                    setMentoraAuthUser(null);
                    localStorage.removeItem('mentora_auth_user');
                    setAuthSuccessMsg("Signed out from Mentora AI.");
                  }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-red-300 text-xs font-mono rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}

            {/* SIGN IN FORM */}
            {loginMode === 'signin' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1.5 block">
                    Student ID / Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl p-3 text-sm text-white font-mono outline-none"
                    value={loginEmailInput}
                    onChange={(e) => setLoginEmailInput(e.target.value)}
                    placeholder="captain@mentora.ai"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1.5 block">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl p-3 text-sm text-white font-mono outline-none"
                    value={loginPasswordInput}
                    onChange={(e) => setLoginPasswordInput(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!loginEmailInput.trim()) {
                      setAuthError("Please enter your student email or ID.");
                      return;
                    }
                    const userName = loginEmailInput.split('@')[0] || "Captain";
                    const authUser = { email: loginEmailInput, name: userName };
                    setMentoraAuthUser(authUser);
                    localStorage.setItem('mentora_auth_user', JSON.stringify(authUser));

                    const updatedProfile = {
                      ...studentProfile,
                      name: userName
                    };
                    saveProfile(updatedProfile);
                    playSuccessSound();
                    setAuthSuccessMsg("Successfully signed in to Mentora AI!");
                    setTimeout(() => setShowLoginModal(false), 1000);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In to Mentora AI
                </button>
              </div>
            )}

            {/* CREATE ACCOUNT FORM */}
            {loginMode === 'signup' && (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1.5 block">
                    Full Student Name / Alias
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl p-3 text-sm text-white font-mono outline-none"
                    value={loginNameInput}
                    onChange={(e) => setLoginNameInput(e.target.value)}
                    placeholder="Captain"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1.5 block">
                    Student Email / ID
                  </label>
                  <input
                    type="email"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl p-3 text-sm text-white font-mono outline-none"
                    value={loginEmailInput}
                    onChange={(e) => setLoginEmailInput(e.target.value)}
                    placeholder="student@mentora.ai"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1.5 block">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl p-3 text-sm text-white font-mono outline-none"
                    value={loginPasswordInput}
                    onChange={(e) => setLoginPasswordInput(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1.5 block">
                    Study Level & Goal
                  </label>
                  <select
                    value={loginGradeInput}
                    onChange={(e) => setLoginGradeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl p-3 text-xs text-white font-mono outline-none"
                  >
                    <option value="Beginner">Beginner (Foundations & Clarity)</option>
                    <option value="Intermediate">Intermediate (Middle / High School)</option>
                    <option value="Advanced">Advanced (Higher Ed / Specialty)</option>
                    <option value="Autodidact">Autodidact & Tech Scholar</option>
                  </select>
                </div>

                {/* Voice Settings */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-400 font-bold flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Voice Speed ({voiceRate}x)
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.75" 
                    max="1.5" 
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />

                  <div className="flex justify-between items-center text-xs pt-2">
                    <span className="font-mono text-slate-400 font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" /> Voice Pitch ({voicePitch})
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.8" 
                    max="1.3" 
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => {
                    const studentName = loginNameInput.trim() || "Captain";
                    const studentEmail = loginEmailInput.trim() || `${studentName.toLowerCase()}@mentora.ai`;
                    const authUser = { email: studentEmail, name: studentName };
                    
                    setMentoraAuthUser(authUser);
                    localStorage.setItem('mentora_auth_user', JSON.stringify(authUser));

                    const updated = {
                      ...studentProfile,
                      name: studentName,
                      levelCategory: loginGradeInput
                    };
                    saveProfile(updated);
                    playSuccessSound();
                    setAuthSuccessMsg("Account created and connected to Mentora AI!");
                    setTimeout(() => setShowLoginModal(false), 1000);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" /> Create Mentora Account & Start
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
