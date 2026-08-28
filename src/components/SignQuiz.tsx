import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Volume2,
  RotateCcw,
  Trophy,
  ArrowRight,
  Hand,
  Flame,
  Award,
  Share2,
  Layers,
  Eye,
  Info,
  ShieldCheck,
  Video
} from 'lucide-react';
import { SIGN_LIBRARY_DATA, SignItem } from './SignLibrary';

interface SignQuizProps {
  onSelectSignForPractice?: (sign: SignItem) => void;
  onAddToWorkspace?: (title: string, text: string) => void;
}

interface QuizQuestion {
  targetSign: SignItem;
  options: SignItem[];
  userSelection: string | null;
  isCorrect: boolean | null;
}

export default function SignQuiz({
  onSelectSignForPractice,
  onAddToWorkspace,
}: SignQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'alphabet' | 'numbers' | 'common' | 'classroom'>('all');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Audio tone synthesizer for instant accessible feedback
  const playFeedbackSound = useCallback((success: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        // High pleasant major chord arpeggio
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Low gentle error tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.exponentialRampToValueAtTime(164.81, ctx.currentTime + 0.2); // E3
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio context might be restricted or unsupported
    }
  }, []);

  // Generate a random pool of 5 questions
  const generateQuestions = useCallback(() => {
    const pool = SIGN_LIBRARY_DATA.filter(
      (s) => categoryFilter === 'all' || s.category === categoryFilter
    );

    if (pool.length < 4) return;

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffled.slice(0, Math.min(6, shuffled.length));

    const generated: QuizQuestion[] = selectedTargets.map((target) => {
      // Pick 3 random distractors distinct from target
      const distractors = pool
        .filter((s) => s.id !== target.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [...distractors, target].sort(() => 0.5 - Math.random());

      return {
        targetSign: target,
        options,
        userSelection: null,
        isCorrect: null,
      };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setShowHint(false);
    setIsQuizCompleted(false);
  }, [categoryFilter]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  const currentQuestion = questions[currentIndex];

  // Speech pronunciation for question/answer
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // User submits an answer
  const handleSelectOption = (option: SignItem) => {
    if (!currentQuestion || currentQuestion.userSelection !== null) return;

    const isCorrect = option.id === currentQuestion.targetSign.id;
    playFeedbackSound(isCorrect);

    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex] = {
      ...currentQuestion,
      userSelection: option.id,
      isCorrect,
    };

    setQuestions(updatedQuestions);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  // Next Question or Complete
  const handleNext = () => {
    setShowHint(false);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const handleExportResults = () => {
    if (!onAddToWorkspace) return;
    const summary = `Résultat Mini-Quiz SL2T :\nScore : ${score}/${questions.length} (${Math.round(
      (score / questions.length) * 100
    )}%)\nMeilleure série : ${bestStreak} d'affilée\nCatégorie : ${categoryFilter.toUpperCase()}`;
    onAddToWorkspace('Certificat Mini-Quiz SL2T', summary);
  };

  if (!currentQuestion && !isQuizCompleted) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center space-y-4">
        <p className="text-slate-400 font-mono text-sm">Chargement du quiz interactif...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Mini-Quiz • Reconnaissance & Vérification Rapide
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono rounded-full font-bold">
                Test Visuel 4 Choix
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Identifiez le signe présenté pour renforcer vos réflexes avant l'inférence caméra
            </p>
          </div>
        </div>

        {/* Categories & Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400">Série :</span>
            <span className="text-amber-400 font-bold">{streak}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Score :</span>
            <span className="text-emerald-400 font-bold">
              {score}/{questions.length}
            </span>
          </div>

          <button
            onClick={generateQuestions}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Recommencer une nouvelle série aléatoire"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Selection Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Toutes Catégories' },
          { id: 'alphabet', label: 'Alphabet Dactylologique' },
          { id: 'numbers', label: 'Chiffres' },
          { id: 'common', label: 'Gestes Fréquents' },
          { id: 'classroom', label: 'Salle de Classe' },
        ].map((cat) => {
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Quiz Section */}
      {!isQuizCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Sign Visual Presentation (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800/90 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 relative shadow-inner">
            {/* Progress indicator */}
            <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
              <span>Question {currentIndex + 1} sur {questions.length}</span>
              <span className="px-2 py-0.5 bg-slate-900 rounded-full border border-slate-800 text-amber-400">
                {currentQuestion.targetSign.category.toUpperCase()}
              </span>
            </div>

            {/* Visual Icon / Symbol Display */}
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-950 border-2 border-amber-500/40 flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-in zoom-in-95 duration-300">
              <span>{currentQuestion.targetSign.symbol}</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Quel est ce signe / geste ?
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Observez la pose manuelle et choisissez la bonne réponse :
              </p>
            </div>

            {/* Hint Toggle */}
            <div className="w-full pt-2">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs font-mono text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Afficher un indice anatomique</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-2xl text-xs text-amber-200 font-mono text-left animate-in fade-in">
                  <div className="font-bold flex items-center gap-1 text-amber-300 mb-1">
                    <Info className="w-3.5 h-3.5" /> Indice de positionnement :
                  </div>
                  {currentQuestion.targetSign.fingerPosition}
                </div>
              )}
            </div>
          </div>

          {/* Right: 4 Choice Buttons + Post-Answer Feedback (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentQuestion.userSelection === option.id;
                const isCorrectOption = option.id === currentQuestion.targetSign.id;
                const hasAnswered = currentQuestion.userSelection !== null;

                let btnStyle = 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white';

                if (hasAnswered) {
                  if (isCorrectOption) {
                    btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold';
                  } else if (isSelected && !isCorrectOption) {
                    btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)] font-bold';
                  } else {
                    btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60';
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option)}
                    disabled={hasAnswered}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs text-slate-400 group-hover:text-white shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div>
                        <div className="text-sm font-bold">{option.name}</div>
                        {option.phonetic && (
                          <div className="text-[11px] font-mono text-slate-400">
                            {option.phonetic}
                          </div>
                        )}
                      </div>
                    </div>

                    {hasAnswered && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-in zoom-in" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 animate-in zoom-in" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Next Action */}
            {currentQuestion.userSelection !== null && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {currentQuestion.isCorrect ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Bravo ! Réponse exacte (+1 pt)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" /> Incorrect. La bonne réponse est : {currentQuestion.targetSign.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleSpeak(
                          `${currentQuestion.targetSign.name}. ${currentQuestion.targetSign.description}`
                        )
                      }
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                      title="Écouter la prononciation et la règle du signe"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Audio</span>
                    </button>

                    {onSelectSignForPractice && (
                      <button
                        onClick={() => onSelectSignForPractice(currentQuestion.targetSign)}
                        className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Tester ce signe immédiatement devant la caméra"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Tester au Scanner</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong>Description :</strong> {currentQuestion.targetSign.description}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>
                      {currentIndex + 1 < questions.length ? 'Question Suivante' : 'Voir mon Bilan'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Completion Screen */
        <div className="p-8 bg-slate-950/90 border border-emerald-500/30 rounded-3xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-black text-white">Série Terminée avec Succès !</h4>
            <p className="text-sm text-slate-300 font-mono max-w-md mx-auto">
              Votre maîtrise visuelle des signes LSF/ASL progresse rapidement.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-2xl font-black text-emerald-400">
                {score} / {questions.length}
              </div>
              <div className="text-[11px] font-mono text-slate-400">Score Final</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-2xl font-black text-amber-400">{bestStreak}</div>
              <div className="text-[11px] font-mono text-slate-400">Meilleure Série</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-2xl font-black text-indigo-400">
                {Math.round((score / questions.length) * 100)}%
              </div>
              <div className="text-[11px] font-mono text-slate-400">Précision Globale</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-4">
            <button
              onClick={generateQuestions}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Relancer une Série</span>
            </button>

            {onAddToWorkspace && (
              <button
                onClick={handleExportResults}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Exporter vers Workspace</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
