import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Brain, Sparkles, BookOpen, Gamepad2, Network, 
  Send, Loader2, Globe, ExternalLink, RefreshCw, CheckCircle2, 
  HelpCircle, MessageSquare, ArrowRight, Layers, FileText, Zap, Lightbulb, Volume2
} from 'lucide-react';
import Markdown from 'react-markdown';
import Mermaid from './Mermaid';

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

interface CognitiveChatbotProps {
  selectedLang?: string;
  initialQuery?: string;
  onClose?: () => void;
}

const PRESET_TOPICS = [
  { label: "📖 Le Horla (Maupassant)", query: "Le Horla de Guy de Maupassant" },
  { label: "📐 Vecteurs (Mathématiques)", query: "Vecteurs mathématiques et physique" },
  { label: "🧬 ADN & Génétique", query: "Structure de l'ADN et synthèse des protéines" },
  { label: "⚛️ Physique Quantique", query: "Principes de la physique quantique" },
  { label: "🌍 Révolution Industrielle", query: "La Révolution Industrielle du XIXe siècle" }
];

export default function CognitiveChatbot({
  selectedLang = "French",
  initialQuery = "",
  onClose
}: CognitiveChatbotProps) {
  const [chatInput, setChatInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Chatbot State with embedded features directly in the message data
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour Capitaine ! Je suis ton **Chatbot Cognitif Intégré & Augmenté par Google Search**.\n\nTape le nom d'un livre (ex: **"Le Horla"**), d'un chapitre (ex: **"Vecteurs"**), ou n'importe quel sujet de cours. Je chercherai en direct sur Google et je pourrai te générer des **Résumés**, **Quiz Interactifs** et **Cartes Mentales** directement intégrés dans notre fil de discussion !`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Quiz interactive state per message: { messageId: { userAnswers: Record<index, answerStr>, showResults: boolean } }
  const [quizStates, setQuizStates] = useState<Record<string, { userAnswers: Record<number, string>; showResults: boolean }>>({});

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery, 'search');
    }
  }, [initialQuery]);

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
          language: selectedLang
        })
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Query failed");
      }

      return data;
    } catch (err) {
      console.error("API Query error:", err);
      throw err;
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

    // Create User Message
    let userPromptText = text;
    if (mode === 'summary') userPromptText = `📄 Donnes-moi un résumé complet et structuré de : "${effectiveTopic}"`;
    else if (mode === 'quiz') userPromptText = `🎯 Génères un Quiz interactif de 5 questions sur : "${effectiveTopic}"`;
    else if (mode === 'mindmap') userPromptText = `🗺️ Génères une Carte Mentale (Mindmap) visuelle sur : "${effectiveTopic}"`;

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
            responseText = `Voici ton **Quiz d'évaluation interactif** sur **"${effectiveTopic}"** basé sur les résultats Google Search en direct. Testes tes connaissances ci-dessous !`;
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
          responseText = `Voici la **Carte Mentale & Cartographie Neurale** pour **"${effectiveTopic}"** issue de la recherche Google en direct.`;
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

      setMessages(prev => [...prev, assistantMsg]);

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
        content: `Désolé Capitaine, une erreur s'est produite lors de la recherche Google pour **"${text}"**. Veuillez réanalyser ou vérifier la connexion.`,
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
      utterance.lang = selectedLang === 'English' ? 'en-US' : selectedLang === 'Arabic' ? 'ar-SA' : 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full bg-[#0a0d17] border border-blue-500/30 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden flex flex-col min-h-[700px]">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] shrink-0">
            <Globe className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Chatbot Cognitif & Moteur de Connaissances Google
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-full text-[10px] font-mono text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> Live Search Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Intelligence conversationnelle unifiée • Résumés • Quiz interactifs • Cartes mentales intégrés dans les réponses
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Topic Chips */}
      <div className="relative z-10 mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> Sujets Rapides :
        </span>
        {PRESET_TOPICS.map((pt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(pt.query, 'search')}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/50 rounded-full text-xs text-slate-300 hover:text-white font-medium whitespace-nowrap transition-all shrink-0"
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
                        '👤 Capitaine'
                      ) : (
                        <><Sparkles className="w-4 h-4 text-blue-400" /> Google Search Assistant</>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleSpeakText(msg.content)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-colors"
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
                            Quiz Interactif (5 Questions)
                          </h4>
                        </div>
                        {qState?.showResults && (
                          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-mono font-bold text-purple-300">
                            Score : {
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

                                  let btnClass = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";
                                  if (qState?.showResults) {
                                    if (isThisAnswerKey) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                                    else if (isThisSelected && !isThisAnswerKey) btnClass = "bg-red-500/20 border-red-500 text-red-300 font-bold";
                                  } else if (isThisSelected) {
                                    btnClass = "bg-purple-600 border-purple-400 text-white font-bold shadow-md";
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
                                  <strong>Explication : </strong> {q.explanation}
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
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg"
                          >
                            Valider mes réponses
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
                            Carte Mentale : {msg.mindmapData.root || msg.topicQuery}
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
                        <Globe className="w-3 h-3" /> Sources certifiées Google Search ({msg.sources.length})
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
                        className="px-3 py-1.5 bg-slate-950 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 rounded-lg text-xs text-blue-300 font-medium flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>📄 Résumé Détaillé</span>
                      </button>

                      <button
                        onClick={() => handleSendMessage(undefined, 'quiz', msg.topicQuery)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 rounded-lg text-xs text-purple-300 font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>🎯 Générer Quiz</span>
                      </button>

                      <button
                        onClick={() => handleSendMessage(undefined, 'mindmap', msg.topicQuery)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-emerald-600/20 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Network className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🗺️ Carte Mentale</span>
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
                {loadingAction === 'quiz' ? 'Génération du Quiz Google Search...' :
                 loadingAction === 'mindmap' ? 'Construction de la Carte Mentale...' :
                 loadingAction === 'summary' ? 'Rédaction du Résumé Détaillé...' :
                 'Recherche en direct sur Google Search en cours...'}
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
              placeholder="Posez n'importe quelle question ('Le Horla', 'Vecteurs', 'Théorème de Pythagore')..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !chatInput.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Envoyer</>}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-2">
            <span>💡 Astuce : Demandez directement "Résumé de...", "Quiz sur...", ou "Carte mentale de..."</span>
            <span>Google Search Grounded • Mentora AI</span>
          </div>
        </div>

      </div>

    </div>
  );
}
