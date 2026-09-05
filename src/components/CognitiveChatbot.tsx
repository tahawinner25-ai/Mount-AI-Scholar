import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Brain, Sparkles, BookOpen, Gamepad2, Network, 
  Send, Loader2, Globe, ExternalLink, RefreshCw, CheckCircle2, 
  HelpCircle, MessageSquare, ArrowRight, Layers, FileText, Zap, Lightbulb, Volume2,
  History, Plus, Trash2, Clock, X, ChevronRight
} from 'lucide-react';
import Markdown from 'react-markdown';
import Mermaid from './Mermaid';
import { addHistoryItem } from '../services/historyService';
import { auth } from '../services/firebase';
import { generateLocalCognitiveResponse } from '../services/cognitiveFallback';


interface GroundedSource {
  title: string;
  url: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface MindmapBranch {
  name: string;
  icon?: string;
  description: string;
  subnodes: string[];
}

interface MindmapData {
  title: string;
  root: string;
  branches: MindmapBranch[];
  mermaid?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: GroundedSource[];
  searchQueries?: string[];
  quizQuestions?: QuizQuestion[];
  mindmapData?: MindmapData;
  timestamp: string;
  topicQuery?: string;
}

interface ChatSession {
  id: string;
  title: string;
  language: string;
  createdAt: string;
  messages: ChatMessage[];
  quizStates?: Record<string, { userAnswers: Record<number, string>; showResults: boolean }>;
}

interface CognitiveChatbotProps {
  selectedLang?: string;
  initialQuery?: string;
  onClose?: () => void;
}

const AVAILABLE_LANGUAGES = [
  { key: 'French', label: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
  { key: 'English', label: 'English', flag: '🇬🇧', locale: 'en-US' },
  { key: 'Spanish', label: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { key: 'German', label: 'Deutsch', flag: 'de-DE' }
];

const TRANSLATIONS: Record<string, {
  title: string;
  subtitle: string;
  welcome: string;
  quickTopicsTitle: string;
  presetTopics: Array<{ label: string; query: string }>;
  placeholder: string;
  send: string;
  userLabel: string;
  botLabel: string;
  sourcesLabel: string;
  actionSummary: string;
  actionQuiz: string;
  actionMindmap: string;
  quizTitle: string;
  quizScore: string;
  quizValidate: string;
  quizExplanation: string;
  mindmapTitle: string;
  tip: string;
  historyTitle: string;
  newChat: string;
  clearHistory: string;
  savedSessions: string;
  noHistory: string;
  loadingSearch: string;
  loadingSummary: string;
  loadingQuiz: string;
  loadingMindmap: string;
  errorMsg: (query: string) => string;
  summaryPrompt: (topic: string) => string;
  quizPrompt: (topic: string) => string;
  mindmapPrompt: (topic: string) => string;
  quizIntro: (topic: string) => string;
  mindmapIntro: (topic: string) => string;
}> = {
  French: {
    title: "Chatbot & Assistant Google Search",
    subtitle: "Conversations naturelles • 5 sources explorées • Résumés • Quiz • Mindmaps",
    welcome: `Salut Capitaine ! 🚀 Je suis ton assistant d'apprentissage intelligent connecté à **Google Search**.\n\nPose-moi n'importe quelle question sur un livre (ex: **"Le Horla"**), une notion de cours (ex: **"Les Vecteurs"**), ou un sujet d'actualité. J'explore systématiquement **5 sites de référence en direct** pour te répondre simplement, et je peux aussi te générer des **Résumés**, des **Quiz** et des **Cartes Mentales** en un clic !`,
    quickTopicsTitle: "Idées de recherche :",
    presetTopics: [
      { label: "📖 Le Horla (Maupassant)", query: "Le Horla de Guy de Maupassant" },
      { label: "📐 Vecteurs (Mathématiques)", query: "Vecteurs mathématiques et physique" },
      { label: "🧬 ADN & Génétique", query: "Structure de l'ADN et synthèse des protéines" },
      { label: "⚛️ Physique Quantique", query: "Principes de la physique quantique" },
      { label: "🌍 Révolution Industrielle", query: "La Révolution Industrielle du XIXe siècle" }
    ],
    placeholder: "Pose ta question ('Le Horla', 'Vecteurs', 'Théorème de Pythagore')...",
    send: "Envoyer",
    userLabel: "👤 Capitaine",
    botLabel: "Mentora AI (Google Search)",
    sourcesLabel: "5 Sources explorées sur le Web",
    actionSummary: "📄 Fiche de Résumé",
    actionQuiz: "🎯 Super Quiz (5 questions)",
    actionMindmap: "🗺️ Carte Mentale",
    quizTitle: "Quiz Interactif (5 Questions)",
    quizScore: "Score :",
    quizValidate: "Valider mes réponses",
    quizExplanation: "Explication :",
    mindmapTitle: "Carte Mentale :",
    tip: "💡 Astuce : Demande directement 'Résumé de...', 'Quiz sur...', ou 'Carte mentale de...'",
    historyTitle: "Historique des Discussions",
    newChat: "Nouveau Chat",
    clearHistory: "Effacer L'Historique",
    savedSessions: "Sessions Enregistrées",
    noHistory: "Aucune discussion enregistrée pour le moment.",
    loadingSearch: "Recherche en direct sur 5 sites via Google Search...",
    loadingSummary: "Rédaction de ta Fiche de Résumé détaillée...",
    loadingQuiz: "Génération de ton Quiz interactif...",
    loadingMindmap: "Construction de ta Carte Mentale visuelle...",
    errorMsg: (q) => `Oups, une petite coupure est survenue lors de la recherche sur Google pour **"${q}"**. On relance ?`,
    summaryPrompt: (topic) => `📄 Donne-moi un super résumé complet et clair de : "${topic}"`,
    quizPrompt: (topic) => `🎯 Fais-moi un Quiz interactif de 5 questions sur : "${topic}"`,
    mindmapPrompt: (topic) => `🗺️ Génère une Carte Mentale (Mindmap) visuelle sur : "${topic}"`,
    quizIntro: (topic) => `Voici ton **Quiz interactif** sur **"${topic}"** créé à partir des 5 sources trouvées sur Google. À toi de jouer !`,
    mindmapIntro: (topic) => `Voici ta **Carte Mentale** sur **"${topic}"** basée sur les 5 sources Google.`
  },
  English: {
    title: "Cognitive Chatbot & Google Knowledge Engine",
    subtitle: "Unified conversational AI • Summaries • Interactive Quizzes • Mindmaps",
    welcome: `Hello Captain! I am your **Integrated Cognitive Chatbot & Grounded by Google Search**.\n\nType the name of a book (e.g. **"The Horla"**), a topic (e.g. **"Vectors"**), or any study subject. I will search live on Google and generate **Summaries**, **Interactive Quizzes**, and **Mindmaps** directly within our discussion thread!`,
    quickTopicsTitle: "Quick Topics:",
    presetTopics: [
      { label: "📖 The Horla (Maupassant)", query: "The Horla by Guy de Maupassant" },
      { label: "📐 Vectors (Mathematics)", query: "Vectors in mathematics and physics" },
      { label: "🧬 DNA & Genetics", query: "DNA structure and protein synthesis" },
      { label: "⚛️ Quantum Physics", query: "Principles of quantum physics" },
      { label: "🌍 Industrial Revolution", query: "The 19th Century Industrial Revolution" }
    ],
    placeholder: "Ask any question ('The Horla', 'Vectors', 'Pythagorean Theorem')...",
    send: "Send",
    userLabel: "👤 Captain",
    botLabel: "Google Search Assistant",
    sourcesLabel: "Certified Google Search Sources",
    actionSummary: "📄 Detailed Summary",
    actionQuiz: "🎯 Generate Quiz",
    actionMindmap: "🗺️ Mindmap",
    quizTitle: "Interactive Quiz (5 Questions)",
    quizScore: "Score:",
    quizValidate: "Submit my answers",
    quizExplanation: "Explanation:",
    mindmapTitle: "Mindmap:",
    tip: "💡 Tip: Ask directly 'Summary of...', 'Quiz on...', or 'Mindmap of...'",
    historyTitle: "Discussion History",
    newChat: "New Chat",
    clearHistory: "Clear History",
    savedSessions: "Saved Sessions",
    noHistory: "No saved discussions yet.",
    loadingSearch: "Live Google Search in progress...",
    loadingSummary: "Writing Detailed Google Search Summary...",
    loadingQuiz: "Generating Google Search Quiz...",
    loadingMindmap: "Building Google Search Mindmap...",
    errorMsg: (q) => `Sorry Captain, an error occurred during Google Search for **"${q}"**. Please retry or check your connection.`,
    summaryPrompt: (topic) => `📄 Give me a comprehensive and structured summary of: "${topic}"`,
    quizPrompt: (topic) => `🎯 Generate an interactive 5-question Quiz on: "${topic}"`,
    mindmapPrompt: (topic) => `🗺️ Generate a visual Mindmap on: "${topic}"`,
    quizIntro: (topic) => `Here is your **Interactive Evaluation Quiz** on **"${topic}"** based on live Google Search results. Test your knowledge below!`,
    mindmapIntro: (topic) => `Here is the **Mindmap & Neural Cartography** for **"${topic}"** generated from live Google Search.`
  },
  Spanish: {
    title: "Chatbot Cognitivo y Motor de Conocimiento Google",
    subtitle: "Inteligencia conversacional unificada • Resúmenes • Cuestionarios • Mapas mentales",
    welcome: `¡Hola Capitán! Soy tu **Chatbot Cognitivo Integrado y Mejorado por Google Search**.\n\nEscribe el nombre de un libro (p. ej. **"El Horla"**), un tema (p. ej. **"Vectores"**), o cualquier asignatura. Buscaré en vivo en Google y podré generarte **Resúmenes**, **Cuestionarios Interactivos** y **Mapas Mentales** integrados directamente en nuestra conversación.`,
    quickTopicsTitle: "Temas Rápidos:",
    presetTopics: [
      { label: "📖 El Horla (Maupassant)", query: "El Horla de Guy de Maupassant" },
      { label: "📐 Vectores (Matemáticas)", query: "Vectores en matemáticas y física" },
      { label: "🧬 ADN y Genética", query: "Estructura del ADN y síntesis de proteínas" },
      { label: "⚛️ Física Cuántica", query: "Principios de la física cuántica" },
      { label: "🌍 Revolución Industrial", query: "La Revolución Industrial del siglo XIX" }
    ],
    placeholder: "Haz cualquier pregunta ('El Horla', 'Vectores', 'Teorema de Pitágoras')...",
    send: "Enviar",
    userLabel: "👤 Capitán",
    botLabel: "Asistente Google Search",
    sourcesLabel: "Fuentes certificadas de Google Search",
    actionSummary: "📄 Resumen Detallado",
    actionQuiz: "🎯 Generar Cuestionario",
    actionMindmap: "🗺️ Mapa Mental",
    quizTitle: "Cuestionario Interactivo (5 Preguntas)",
    quizScore: "Puntuación:",
    quizValidate: "Validar mis respuestas",
    quizExplanation: "Explicación:",
    mindmapTitle: "Mapa Mental:",
    tip: "💡 Consejo: Pide directamente 'Resumen de...', 'Cuestionario de...', o 'Mapa mental de...'",
    historyTitle: "Historial de Conversaciones",
    newChat: "Nueva Conversación",
    clearHistory: "Borrar Historial",
    savedSessions: "Sesiones Guardadas",
    noHistory: "Aún no hay conversaciones guardadas.",
    loadingSearch: "Búsqueda en vivo en Google Search en curso...",
    loadingSummary: "Redactando Resumen Detallado de Google Search...",
    loadingQuiz: "Generando Cuestionario de Google Search...",
    loadingMindmap: "Construyendo Mapa Mental de Google Search...",
    errorMsg: (q) => `Lo siento Capitán, ocurrió un error durante la búsqueda en Google para **"${q}"**. Revisa tu conexión e inténtalo de nuevo.`,
    summaryPrompt: (topic) => `📄 Dame un resumen completo y estructurado de: "${topic}"`,
    quizPrompt: (topic) => `🎯 Genera un cuestionario interactivo de 5 preguntas sobre: "${topic}"`,
    mindmapPrompt: (topic) => `🗺️ Genera un Mapa Mental visual sobre: "${topic}"`,
    quizIntro: (topic) => `Aquí tienes tu **Cuestionario de Evaluación Interactivo** sobre **"${topic}"** basado en resultados de Google Search en vivo. ¡Pon a prueba tus conocimientos a continuación!`,
    mindmapIntro: (topic) => `Aquí está el **Mapa Mental y Cartografía Neural** para **"${topic}"** generado desde la búsqueda en vivo de Google.`
  },
  German: {
    title: "Kognitiver Chatbot & Google Wissensmaschine",
    subtitle: "Vereinte Konversations-KI • Zusammenfassungen • Interaktive Quizze • Mindmaps",
    welcome: `Hallo Kapitän! Ich bin dein **Integrierter Kognitiver Chatbot & Unterstützt durch Google Suche**.\n\nGib den Namen eines Buches (z. B. **"Der Horla"**), eines Themas (z. B. **"Vektoren"**) oder eines beliebigen Lernstoffs ein. Ich suche live auf Google und erstelle dir **Zusammenfassungen**, **Interaktive Quizze** und **Mindmaps** direkt in unserem Chatverlauf!`,
    quickTopicsTitle: "Schnellthemen:",
    presetTopics: [
      { label: "📖 Der Horla (Maupassant)", query: "Der Horla von Guy de Maupassant" },
      { label: "📐 Vektoren (Mathematik)", query: "Vektoren in Mathematik und Physik" },
      { label: "🧬 DNA & Genetik", query: "DNA-Struktur und Proteinsynthese" },
      { label: "⚛️ Quantenphysik", query: "Grundlagen der Quantenphysik" },
      { label: "🌍 Industrielle Revolution", query: "Die Industrielle Revolution im 19. Jahrhundert" }
    ],
    placeholder: "Stelle eine beliebige Frage ('Der Horla', 'Vektoren', 'Satz des Pythagoras')...",
    send: "Senden",
    userLabel: "👤 Kapitän",
    botLabel: "Google Search Assistent",
    sourcesLabel: "Zertifizierte Google-Suche Quellen",
    actionSummary: "📄 Ausführliche Zusammenfassung",
    actionQuiz: "🎯 Quiz Generieren",
    actionMindmap: "🗺️ Mindmap",
    quizTitle: "Interaktives Quiz (5 Fragen)",
    quizScore: "Ergebnis:",
    quizValidate: "Antworten überprüfen",
    quizExplanation: "Erklärung:",
    mindmapTitle: "Mindmap:",
    tip: "💡 Tipp: Frage direkt nach 'Zusammenfassung von...', 'Quiz über...' oder 'Mindmap von...'",
    historyTitle: "Chat-Verlauf",
    newChat: "Neuer Chat",
    clearHistory: "Verlauf Löschen",
    savedSessions: "Gespeicherte Sitzungen",
    noHistory: "Noch keine gespeicherten Gespräche vorhanden.",
    loadingSearch: "Live-Google-Suche läuft...",
    loadingSummary: "Detaillierte Google-Suche Zusammenfassung wird erstellt...",
    loadingQuiz: "Google-Suche Quiz wird generiert...",
    loadingMindmap: "Google-Suche Mindmap wird erstellt...",
    errorMsg: (q) => `Entschuldigung Kapitän, bei der Google-Suche nach **"${q}"** ist ein Fehler aufgetreten. Bitte überprüfe deine Verbindung und versuche es erneut.`,
    summaryPrompt: (topic) => `📄 Gib mir eine umfassende und strukturierte Zusammenfassung von: "${topic}"`,
    quizPrompt: (topic) => `🎯 Erstelle ein interaktives Quiz mit 5 Fragen zu: "${topic}"`,
    mindmapPrompt: (topic) => `🗺️ Erstelle eine visuelle Mindmap zu: "${topic}"`,
    quizIntro: (topic) => `Hier ist dein **Interaktives Bewertungs-Quiz** zu **"${topic}"** basierend auf Live-Ergebnissen der Google-Suche. Teste dein Wissen unten!`,
    mindmapIntro: (topic) => `Hier ist die **Mindmap & Neuronale Kartografie** für **"${topic}"** aus der Live-Google-Suche.`
  }
};

const STORAGE_KEY = 'mount_ai_cognitive_chat_sessions_v2';

export default function CognitiveChatbot({
  selectedLang = "French",
  initialQuery = "",
  onClose
}: CognitiveChatbotProps) {
  const [currentLang, setCurrentLang] = useState<string>(selectedLang || "French");
  const [chatInput, setChatInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Helper to resolve translation object
  const getT = (langName: string) => {
    const key = Object.keys(TRANSLATIONS).find(k => k.toLowerCase() === langName.toLowerCase()) || "French";
    return TRANSLATIONS[key] || TRANSLATIONS.French;
  };

  const t = getT(currentLang);

  // Chat Sessions History State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to parse chat sessions from storage:", e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return Date.now().toString();
  });

  // Current Active Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: getT(selectedLang || "French").welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Quiz interactive state per message
  const [quizStates, setQuizStates] = useState<Record<string, { userAnswers: Record<number, string>; showResults: boolean }>>({});

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync prop changes
  useEffect(() => {
    if (selectedLang) {
      setCurrentLang(selectedLang);
    }
  }, [selectedLang]);

  // Handle language switch: update welcome message dynamically whenever language changes
  useEffect(() => {
    const newWelcome = getT(currentLang).welcome;
    setMessages(prev => {
      if (prev.length > 0 && prev[0].id === 'welcome') {
        return [
          {
            ...prev[0],
            content: newWelcome
          },
          ...prev.slice(1)
        ];
      }
      return prev;
    });
  }, [currentLang]);

  // Auto-save active session to sessions list and localStorage
  useEffect(() => {
    if (!activeSessionId) return;

    // Title from first user message or default
    const firstUserMsg = messages.find(m => m.role === 'user');
    const sessionTitle = firstUserMsg 
      ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '') 
      : `${t.title} (${currentLang})`;

    const currentSessionObj: ChatSession = {
      id: activeSessionId,
      title: sessionTitle,
      language: currentLang,
      createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      messages,
      quizStates
    };

    setSessions(prev => {
      const exists = prev.some(s => s.id === activeSessionId);
      let updated: ChatSession[];
      if (exists) {
        updated = prev.map(s => s.id === activeSessionId ? currentSessionObj : s);
      } else {
        updated = [currentSessionObj, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("Storage save error:", err);
      }
      return updated;
    });
  }, [messages, quizStates, activeSessionId, currentLang]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery, 'search');
    }
  }, [initialQuery]);

  const handleStartNewChat = () => {
    const newId = Date.now().toString();
    setActiveSessionId(newId);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setQuizStates({});
    setShowHistoryDrawer(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setQuizStates(session.quizStates || {});
    if (session.language) {
      setCurrentLang(session.language);
    }
    setShowHistoryDrawer(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (err) {
        console.warn("Storage save error:", err);
      }
      return filtered;
    });

    if (activeSessionId === sessionId) {
      handleStartNewChat();
    }
  };

  const handleClearAllHistory = () => {
    setSessions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Storage clear error:", e);
    }
    handleStartNewChat();
  };

  const executeApiQuery = async (queryText: string, mode: 'search' | 'summary' | 'quiz' | 'mindmap') => {
    setLoading(true);
    setLoadingAction(mode);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/cognitive-search-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          mode,
          chatHistory: historyPayload,
          language: currentLang
        })
      });

      if (!response.ok) {
        console.warn(`[CognitiveChatbot] API returned HTTP ${response.status}, switching to local cognitive engine.`);
        return generateLocalCognitiveResponse(queryText, mode, currentLang);
      }

      const data = await response.json();
      if (!data || !data.success) {
        console.warn("[CognitiveChatbot] API response non-success, using local fallback.");
        return generateLocalCognitiveResponse(queryText, mode, currentLang);
      }

      return data;
    } catch (err) {
      console.warn("[CognitiveChatbot] Network/API error, engaging high-speed local cognitive synthesizer:", err);
      return generateLocalCognitiveResponse(queryText, mode, currentLang);
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSendMessage = async (textToSend?: string, modeOverride?: 'search' | 'summary' | 'quiz' | 'mindmap', topicForContext?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || loading) return;

    const mode = modeOverride || 'search';
    const effectiveTopic = topicForContext || text;

    // Create User Message with appropriate language prompt label
    let userPromptText = text;
    if (mode === 'summary') userPromptText = t.summaryPrompt(effectiveTopic);
    else if (mode === 'quiz') userPromptText = t.quizPrompt(effectiveTopic);
    else if (mode === 'mindmap') userPromptText = t.mindmapPrompt(effectiveTopic);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userPromptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput("");

    try {
      const data = await executeApiQuery(effectiveTopic, mode);
      
      let parsedQuiz: QuizQuestion[] | undefined = undefined;
      let parsedMindmap: MindmapData | undefined = undefined;
      let responseText = data.text;

      if (mode === 'quiz') {
        try {
          let raw = data.text;
          if (raw.includes('```json')) raw = raw.split('```json')[1].split('```')[0].trim();
          else if (raw.includes('```')) raw = raw.split('```')[1].split('```')[0].trim();
          const parsed = JSON.parse(raw);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            parsedQuiz = parsed.questions;
            responseText = t.quizIntro(effectiveTopic);
          }
        } catch (e) {
          console.warn("Quiz JSON parse error:", e);
        }
      } else if (mode === 'mindmap') {
        try {
          let raw = data.text;
          if (raw.includes('```json')) raw = raw.split('```json')[1].split('```')[0].trim();
          else if (raw.includes('```')) raw = raw.split('```')[1].split('```')[0].trim();
          parsedMindmap = JSON.parse(raw);
          responseText = t.mindmapIntro(effectiveTopic);
        } catch (e) {
          console.warn("Mindmap JSON parse error:", e);
        }
      }

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: responseText,
        sources: data.sources || [],
        searchQueries: data.searchQueries || [],
        quizQuestions: parsedQuiz,
        mindmapData: parsedMindmap,
        topicQuery: effectiveTopic,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => {
        const next = [...prev, assistantMsg];
        
        // Sauvegarde unifiée dans l'Historique global de l'application
        try {
          const currentUser = auth.currentUser || { isGuest: true, uid: 'guest_1337' };
          let itemType: 'chat' | 'quiz' | 'mindmap' | 'summary' = 'chat';
          let extension: '.chat' | '.quiz' | '.map' | '.pdf' = '.chat';

          if (parsedQuiz) {
            itemType = 'quiz';
            extension = '.quiz';
          } else if (parsedMindmap) {
            itemType = 'mindmap';
            extension = '.map';
          } else if (mode === 'summary') {
            itemType = 'summary';
            extension = '.pdf';
          }

          addHistoryItem(currentUser, {
            type: itemType,
            fileExtension: extension,
            title: `${effectiveTopic.substring(0, 40)}`,
            mode,
            language: currentLang,
            originalText: userPromptText,
            generatedContent: responseText,
            metadata: {
              chatSessionId: activeSessionId || `session_${Date.now()}`,
              chatMessages: next,
              quizQuestions: parsedQuiz,
              mindmapData: parsedMindmap,
              tags: ['Chatbot', mode, currentLang]
            }
          });
        } catch (histErr) {
          console.warn("Échec de l'enregistrement dans l'historique universel :", histErr);
        }

        return next;
      });

      // Initialize quiz state if present
      if (parsedQuiz) {
        setQuizStates(prev => ({
          ...prev,
          [assistantMsgId]: { userAnswers: {}, showResults: false }
        }));
      }

    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t.errorMsg(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }
  };

  const handleSelectQuizOption = (messageId: string, qIndex: number, option: string) => {
    setQuizStates(prev => {
      const current = prev[messageId] || { userAnswers: {}, showResults: false };
      if (current.showResults) return prev;
      return {
        ...prev,
        [messageId]: {
          ...current,
          userAnswers: { ...current.userAnswers, [qIndex]: option }
        }
      };
    });
  };

  const handleValidateQuiz = (messageId: string) => {
    setQuizStates(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], showResults: true }
    }));
  };

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''));
      const foundLang = AVAILABLE_LANGUAGES.find(l => 
        l.key.toLowerCase() === currentLang.toLowerCase() ||
        l.label.toLowerCase() === currentLang.toLowerCase()
      );
      utterance.lang = foundLang?.locale || (currentLang === 'English' ? 'en-US' : currentLang === 'Spanish' ? 'es-ES' : currentLang === 'German' ? 'de-DE' : 'fr-FR');
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full bg-[#0a0d17] border border-blue-500/30 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden flex flex-col min-h-[720px]">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] shrink-0">
            <Globe className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {t.title}
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-[10px] font-mono text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> Live Search Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Header Actions: Language Switcher, History & Close */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
          {/* History Drawer Toggle Button */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl text-xs font-mono font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow-inner cursor-pointer"
            title={t.historyTitle}
          >
            <History className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">{t.historyTitle}</span>
            {sessions.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-[10px] font-bold text-blue-300">
                {sessions.length}
              </span>
            )}
          </button>

          {/* Language Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-1.5 hidden xl:flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-400" /> Lang :
            </span>
            {AVAILABLE_LANGUAGES.map((lang) => {
              const isActive = currentLang.toLowerCase() === lang.key.toLowerCase() ||
                currentLang.toLowerCase() === lang.label.toLowerCase() ||
                (currentLang.toLowerCase().includes('fren') && lang.key === 'French') ||
                (currentLang.toLowerCase().includes('engl') && lang.key === 'English') ||
                (currentLang.toLowerCase().includes('span') && lang.key === 'Spanish') ||
                (currentLang.toLowerCase().includes('germ') && lang.key === 'German');

              return (
                <button
                  key={lang.key}
                  onClick={() => setCurrentLang(lang.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/50 scale-105'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                  }`}
                  title={`Passer en ${lang.label}`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Fermer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* History Slide-Over Drawer */}
      {showHistoryDrawer && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 p-6 flex flex-col justify-between border border-blue-500/30 rounded-[2.5rem] animate-fadeIn">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{t.historyTitle}</h3>
                  <p className="text-xs text-slate-400 font-mono">{t.savedSessions}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleStartNewChat}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {t.newChat}
              </button>

              {sessions.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t.clearHistory}
                </button>
              )}
            </div>

            {/* Sessions List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {sessions.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-sm font-mono">
                  {t.noHistory}
                </div>
              ) : (
                sessions.map((sess) => {
                  const isCurrent = sess.id === activeSessionId;
                  const langObj = AVAILABLE_LANGUAGES.find(l => l.key.toLowerCase() === sess.language?.toLowerCase()) || AVAILABLE_LANGUAGES[0];

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg'
                          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <MessageSquare className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-blue-400' : 'text-slate-500'}`} />
                        <div className="truncate">
                          <h4 className="text-xs font-bold truncate text-white group-hover:text-blue-300 transition-colors">
                            {sess.title || 'Discussion Sans Titre'}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{langObj.flag} {langObj.label}</span>
                            <span>•</span>
                            <span>{sess.createdAt}</span>
                            <span>•</span>
                            <span>{sess.messages?.length || 0} msgs</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-300 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Supprimer la session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
            Mentora AI • Google Search Grounded Knowledge Base
          </div>
        </div>
      )}

      {/* Quick Topic Chips */}
      <div className="relative z-10 mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> {t.quickTopicsTitle}
        </span>
        {t.presetTopics.map((pt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(pt.query, 'search')}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/50 rounded-full text-xs text-slate-300 hover:text-white font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer"
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* Single Stream Unified Chat Container */}
      <div className="flex-1 relative z-10 flex flex-col justify-between bg-slate-950/60 border border-slate-800 rounded-3xl p-4 md:p-6 min-h-[500px]">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-6 max-h-[520px] pr-2">
          {messages.map((msg) => {
            const qState = quizStates[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`w-full max-w-[92%] md:max-w-[85%] rounded-3xl p-5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-xl border border-blue-400/30'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
                  }`}
                >
                  {/* Header info */}
                  <div className="flex items-center justify-between gap-4 mb-3 border-b border-white/10 pb-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest font-bold opacity-90 flex items-center gap-1.5">
                      {msg.role === 'user' ? (
                        t.userLabel
                      ) : (
                        <><Sparkles className="w-4 h-4 text-blue-400" /> {t.botLabel}</>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleSpeakText(msg.content)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Lecture vocale"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Message Content Markdown */}
                  <div className="prose prose-invert prose-sm max-w-none font-sans text-slate-200">
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {/* Embedded Interactive Quiz Widget */}
                  {msg.quizQuestions && msg.quizQuestions.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-purple-500/30 bg-purple-950/20 -mx-2 p-4 rounded-2xl border border-purple-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-5 h-5 text-purple-400" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            {t.quizTitle}
                          </h4>
                        </div>
                        {qState?.showResults && (
                          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-mono font-bold text-purple-300">
                            {t.quizScore} {
                              Math.round(
                                (msg.quizQuestions.filter((q, idx) => {
                                  const ans = qState.userAnswers[idx];
                                  return ans && ans.trim().toUpperCase().startsWith(q.answer.trim().toUpperCase());
                                }).length / msg.quizQuestions.length) * 100
                              )
                            }%
                          </span>
                        )}
                      </div>

                      <div className="space-y-5">
                        {msg.quizQuestions.map((q, idx) => {
                          const selected = qState?.userAnswers[idx];
                          const isCorrect = selected && selected.trim().toUpperCase().startsWith(q.answer.trim().toUpperCase());

                          return (
                            <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                              <p className="text-xs font-bold text-white flex items-start gap-2">
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono text-[10px]">Q{idx + 1}</span>
                                <span>{q.question}</span>
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                                {q.options.map((opt, oIdx) => {
                                  const isThisSelected = selected === opt;
                                  const isThisAnswerKey = opt.trim().toUpperCase().startsWith(q.answer.trim().toUpperCase());

                                  let btnClass = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer";
                                  if (qState?.showResults) {
                                    if (isThisAnswerKey) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                                    else if (isThisSelected && !isThisAnswerKey) btnClass = "bg-red-500/20 border-red-500 text-red-300 font-bold";
                                  } else if (isThisSelected) {
                                    btnClass = "bg-purple-600 border-purple-400 text-white font-bold shadow-md cursor-pointer";
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleSelectQuizOption(msg.id, idx, opt)}
                                      disabled={qState?.showResults}
                                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${btnClass}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {qState?.showResults && (
                                <div className={`p-2.5 rounded-lg text-xs leading-relaxed border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                                  <strong>{t.quizExplanation} </strong> {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {!qState?.showResults && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleValidateQuiz(msg.id)}
                            disabled={!qState || Object.keys(qState.userAnswers).length === 0}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg cursor-pointer"
                          >
                            {t.quizValidate}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Embedded Interactive Mindmap Widget */}
                  {msg.mindmapData && (
                    <div className="mt-5 pt-4 border-t border-emerald-500/30 bg-emerald-950/20 -mx-2 p-4 rounded-2xl border border-emerald-500/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Network className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            {t.mindmapTitle} {msg.mindmapData.root || msg.topicQuery}
                          </h4>
                        </div>
                      </div>

                      {/* Mermaid Diagram */}
                      {msg.mindmapData.mermaid && (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto flex justify-center">
                          <div className="w-full max-w-2xl">
                            <Mermaid chart={msg.mindmapData.mermaid} />
                          </div>
                        </div>
                      )}

                      {/* Mindmap Branch Cards */}
                      {msg.mindmapData.branches && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {msg.mindmapData.branches.map((b, bIdx) => (
                            <div key={bIdx} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{b.icon || '🧠'}</span>
                                <span>{b.name}</span>
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-snug">{b.description}</p>
                              {b.subnodes && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {b.subnodes.map((sub, sIdx) => (
                                    <span key={sIdx} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-300 font-mono">
                                      • {sub}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Google Search Grounding Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold mb-2 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {t.sourcesLabel} ({msg.sources.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-[11px] text-blue-300 flex items-center gap-1.5 transition-colors"
                          >
                            <span className="truncate max-w-[200px]">{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Embedded Quick Actions on Assistant Responses */}
                  {msg.role === 'assistant' && msg.id !== 'welcome' && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSendMessage(undefined, 'summary', msg.topicQuery)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 rounded-lg text-xs text-blue-300 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.actionSummary}</span>
                      </button>

                      <button
                        onClick={() => handleSendMessage(undefined, 'quiz', msg.topicQuery)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 rounded-lg text-xs text-purple-300 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>{t.actionQuiz}</span>
                      </button>

                      <button
                        onClick={() => handleSendMessage(undefined, 'mindmap', msg.topicQuery)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-emerald-600/20 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Network className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.actionMindmap}</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 p-4 bg-slate-900/80 border border-blue-500/30 rounded-2xl w-fit text-xs text-blue-400 font-mono animate-pulse shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>
                {loadingAction === 'quiz' ? t.loadingQuiz :
                 loadingAction === 'mindmap' ? t.loadingMindmap :
                 loadingAction === 'summary' ? t.loadingSummary :
                 t.loadingSearch}
              </span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.placeholder}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !chatInput.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shrink-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> {t.send}</>}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-2">
            <span>{t.tip}</span>
            <span>Google Search Grounded • Mentora AI</span>
          </div>
        </div>

      </div>

    </div>
  );
}
