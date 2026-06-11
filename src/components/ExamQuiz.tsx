import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, XCircle, Printer, BookOpen, User, Eye, Sparkles, RefreshCw, RefreshCcw } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ExamQuizProps {
  customQuestions?: Question[];
  language?: string;
  onRestart?: () => void;
  originalTextContext?: string;
}

// Translations dictionary for dynamic UI elements
const translations: Record<string, Record<string, string>> = {
  french: {
    title: "Contrôle d'Évaluation Pédagogique",
    subtitle: "Royaume du Maroc — Académie de l'Éducation Cognitive",
    interactiveTab: "Mode Éléve (Interactif)",
    printableTab: "Fiche Officielle (PDF)",
    correctionTab: "Corrigé Enseignant",
    studentLabel: "Nom de l'élève",
    classLabel: "Classe / Niveau",
    dateLabel: "Date de session",
    institTitle: "ADMINISTRATION DE L'ENSEIGNEMENT — MOUNT AI SCHOLAR",
    scoreIndicator: "Score obtenu",
    validateBtn: "Valider les Réponses",
    restartBtn: "Recommencer l'Évaluation",
    downloadBtn: "Imprimer & Télécharger la Fiche (PDF)",
    explanations: "EXPLICATION PÉDAGOGIQUE",
    scoreOver: "Note d'examen",
    comments: "Observations pédagogiques et appréciations :",
    defaultTopic: "Littérature Française — Le Malade imaginaire & Le Roman de Renart",
    evaluationCriteria: "Barème & Critères d'Évaluation : 5 points par question exacte. Seuil d'excellence : 15/20."
  },
  english: {
    title: "Pedagogical Assessment Test",
    subtitle: "Mount AI Scholar Academy — Cognitive Evaluation Core",
    interactiveTab: "Student Mode (Interactive)",
    printableTab: "Official Worksheet (PDF)",
    correctionTab: "Teacher Answer Key",
    studentLabel: "Student Name",
    classLabel: "Grade / level",
    dateLabel: "Exam Date",
    institTitle: "MOUNT AI SCHOLAR EDUCATION BOARD — CORE EVALUATION",
    scoreIndicator: "Achieved Score",
    validateBtn: "Submit All Answers",
    restartBtn: "Restart Evaluation",
    downloadBtn: "Print & Save Worksheet (PDF)",
    explanations: "PEDAGOGICAL EXPLANATION",
    scoreOver: "Assessment Grade",
    comments: "Teacher remarks and qualitative feedback:",
    defaultTopic: "English Literature — Phonemic Awareness & Cognitive Methods",
    evaluationCriteria: "Grading Rubric: 5 points per correct response. Mastery Threshold: 15/20."
  },
  arabic: {
    title: "المراقبة المستمرة لمادة الفهم المعرفي",
    subtitle: "المملكة المغربية — أكاديمية ماونت آي للتعليم الذكي",
    interactiveTab: "فضاء التلميذ (تفاعلي)",
    printableTab: "الورقة الرسمية للامتحان (PDF)",
    correctionTab: "عناصر الإجابة والتصحيح",
    studentLabel: "اسم التلميذ الكامل",
    classLabel: "القسم / المستوى",
    dateLabel: "التاريخ",
    institTitle: "إدارة التقييم المعرفي والبرمجة — MOUNT AI SCHOLAR",
    scoreIndicator: "النتيجة المحصل عليها",
    validateBtn: "تأكيد الإجابات",
    restartBtn: "إعادة اجتياز الاختبار",
    downloadBtn: "تحميل ورقة الاختبار بصيغة PDF",
    explanations: "الشرح التربوي والدليل",
    scoreOver: "المعدل الإجمالي",
    comments: "ملاحظات المعلم وتوجيهاته البيداغوجية:",
    defaultTopic: "تقييم سياقي — مهارات الاستدراك والفهم القرائي والسمعي",
    evaluationCriteria: "معيار التنقيط: 5 نقاط لكل جواب صحيح. عتبة التحكم والتميز البيداغوجي: 15/20."
  },
  spanish: {
    title: "Evaluación Pedagógica del Estudiante",
    subtitle: "Academia Mount AI Scholar — Núcleo de Evaluación Cognitiva",
    interactiveTab: "Modo Estudiante (Interactivo)",
    printableTab: "Hoja de Examen Oficial (PDF)",
    correctionTab: "Clave de Corrección",
    studentLabel: "Nombre del estudiante",
    classLabel: "Curso / Nivel",
    dateLabel: "Fecha del examen",
    institTitle: "CONSEJO EDUCATIVO DE MOUNT AI SCHOLAR — REGISTRO",
    scoreIndicator: "Puntaje Obtenido",
    validateBtn: "Entregar Examen",
    restartBtn: "Reiniciar Evaluación",
    downloadBtn: "Guardar Hoja de Examen (PDF)",
    explanations: "EXPLICACIÓN PEDAGÓGICA",
    scoreOver: "Calificación Oficial",
    comments: "Comentarios y observaciones del evaluador:",
    defaultTopic: "Comprensión Lectora y correspondencia fonológica avanzada",
    evaluationCriteria: "Criterios: 5 puntos por pregunta correcta. Nivel de excelencia: 15/20."
  },
  german: {
    title: "Pädagogische Kontrollprüfung",
    subtitle: "Kognitive Lehrgänge — Mount AI Scholar Akademie",
    interactiveTab: "Schülermodus (Interaktiv)",
    printableTab: "Offizielles Arbeitsblatt (PDF)",
    correctionTab: "Lösungsschlüssel für Lehrkräfte",
    studentLabel: "Name des Schülers",
    classLabel: "Klasse / Stufe",
    dateLabel: "Prüfungsdatum",
    institTitle: "SCHULVERWALTUNG MOUNT AI SCHOLAR — PRÜFUNGSAUSRECHNUNG",
    scoreIndicator: "Erreichte Punktzahl",
    validateBtn: "Prüfung beenden",
    restartBtn: "Prüfung zurücksetzen",
    downloadBtn: "Prüfungsbogen herunterladen (PDF)",
    explanations: "PÄDAGOGISCHE ERLÄUTERUNG",
    scoreOver: "Prüfungsnote",
    comments: "Pädagogische Anmerkungen der Lehrkraft:",
    defaultTopic: "Kognitives Leseverständnis und phonologische Übungen",
    evaluationCriteria: "Bewertungskriterien: 5 Punkte pro korrekte Antwort. Exzellenzgrenze: 15/20."
  }
};

const defaultFrenchQuestions: Question[] = [
  {
    id: 1,
    question: "Dans « Le Malade imaginaire » de Molière, quel est le véritable but caché d'Argan lorsqu'il souhaite obstinément marier sa fille Angélique à Thomas Diafoirus ?",
    options: [
      "Assurer l'élévation sociale de sa famille en s'alliant à une dynastie de médecins parisiens réputés.",
      "Garantir le bonheur de sa fille en lui offrant un mari issu de la bourgeoisie intellectuelle et fortunée.",
      "Avoir un médecin et un apothicaire dans la famille pour s'assurer des soins constants, gratuits et à domicile.",
      "Récupérer l'héritage des Diafoirus pour éponger les dettes colossales générées par ses traitements."
    ],
    correctAnswer: 2,
    explanation: "Argan, hypocondriaque, ne pense qu'à sa propre santé. Il veut marier Angélique à Thomas Diafoirus uniquement pour avoir un médecin « sous la main » (Acte I, scène 5)."
  },
  {
    id: 2,
    question: "Quelle stratégie extrême Béralde et Toinette mettent-ils en place pour dessiller les yeux d'Argan sur la véritable nature de sa femme Béline et de sa fille Angélique ?",
    options: [
      "Ils font déguiser Toinette en médecin pour qu'elle diagnostique une maladie mortelle incurable.",
      "Ils lui demandent de faire semblant d'être totalement ruiné pour observer qui restera fidèlement à ses côtés.",
      "Ils lui conseillent de simuler sa propre mort pour scruter les véritables réactions affectives de son entourage.",
      "Ils interceptent de fausses lettres d'amour pour tester la jalousie et la loyauté de son entourage."
    ],
    correctAnswer: 2,
    explanation: "Toinette propose à Argan de faire le mort (Acte III, scènes 11 à 14). Cela révèle la cupidité joyeuse de Béline et le chagrin sincère d'Angélique."
  },
  {
    id: 3,
    question: "Dans « Le Roman de Renart », quelle ruse psychologique et physique Renart utilise-t-il magistralement pour dérober les harengs des marchands charretiers ?",
    options: [
      "Il se déguise en pèlerin égaré pour implorer la charité et détourne leur attention de la marchandise.",
      "Il s'allonge au milieu du chemin en simulant parfaitement la mort pour être ramassé et jeté sur la charrette.",
      "Il imite les cris d'une meute de loups affamés dans les fourrés pour faire fuir les marchands terrifiés.",
      "Il creuse une petite fosse couverte de branchages pour briser la roue de la charrette et piller la cargaison."
    ],
    correctAnswer: 1,
    explanation: "Renart fait le mort sur la route. Les marchands le jettent sur leur charrette pour récupérer sa fourrure, lui permettant ainsi de manger les harengs tranquillement."
  },
  {
    id: 4,
    question: "Quel trait de caractère, cyniquement exploité par Renart, définit le mieux Ysengrin le loup tout au long de l'œuvre médiévale ?",
    options: [
      "Une autorité majestueuse mais constamment trahie par une malchance aveugle.",
      "Une cruauté calculatrice et une intelligence stratégique presque égale à celle de Renart.",
      "Une naïveté aveuglée par la gloutonnerie et une force brute souvent tournée en ridicule.",
      "Une loyauté chevaleresque inébranlable envers le roi Noble, le rendant vulnérable aux tromperies."
    ],
    correctAnswer: 2,
    explanation: "Ysengrin est fort mais stupide et très gourmand. Renart exploite constamment sa bêtise et sa faim pour le piéger (comme lors de la pêche à la queue dans la glace)."
  }
];

export default function ExamQuiz({ customQuestions, language = "French", onRestart, originalTextContext }: ExamQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactive' | 'printable' | 'correction'>('interactive');
  
  // Local print form values
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [examDate, setExamDate] = useState(() => new Date().toLocaleDateString());
  const [isDownloading, setIsDownloading] = useState(false);

  // Normalize language for dict translation lookup
  const currentLangKey = language.toLowerCase();
  const tr = translations[currentLangKey] || translations.french;

  // Use customQuestions if supplied by the parent, otherwise render the classic hardcoded French questions
  const activeQuestions = customQuestions && customQuestions.length > 0 ? customQuestions : defaultFrenchQuestions;

  // Reset answer states on language or questions shift
  useEffect(() => {
    setSelectedAnswers({});
    setShowResults(false);
    setActiveTab('interactive');
  }, [customQuestions, language]);

  const handleSelect = (qId: number, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const calculateScore = () => {
    return activeQuestions.reduce((score, q) => {
      return score + (selectedAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  const roundedGradeOnTwenty = () => {
    const questionsLength = activeQuestions.length || 1;
    return Math.round((calculateScore() / questionsLength) * 20);
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    const element = document.getElementById('pedagogical-exam-sheet');
    if (!element) return;

    const opt: any = {
      margin:       0.4,
      filename:     `Controle_Cognitif_Mount_AI_${language.toUpperCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setIsDownloading(false);
      })
      .catch((err: any) => {
        console.error("PDF export failing:", err);
        setIsDownloading(false);
      });
  };

  const isRtl = currentLangKey === 'arabic';

  return (
    <div className={`space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header and Branding */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/15 pb-6 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-red-500/10 rounded-2xl border border-red-500/30 flex items-center justify-center shadow-md animate-pulse">
            <Target className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-red-500 tracking-[0.2em]">{tr.subtitle}</span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{tr.title}</h2>
          </div>
        </div>

        {/* Evaluation tab navigation bar */}
        <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl shrink-0">
          <button 
            type="button"
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'interactive' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            {tr.interactiveTab}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('printable')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'printable' ? 'bg-slate-850 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {tr.printableTab}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('correction')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'correction' ? 'bg-slate-850 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {tr.correctionTab}
          </button>
        </div>
      </div>

      {/* RENDER VIEW 1: INTERACTIVE MODE */}
      {activeTab === 'interactive' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {showResults && (
            <div className="bg-slate-950/80 border-[#ff4e00]/30 border-2 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-[80px] pointer-events-none translate-x-12 -translate-y-12" />
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-[#ff4e00]/10 rounded-2xl border border-[#ff4e00]/30 text-[#ff4e00] font-black shrink-0 text-center animate-pulse">
                    <span className="block text-[10px] uppercase tracking-widest font-bold font-mono">Note Finale</span>
                    <span className="text-4xl font-extrabold">{roundedGradeOnTwenty()}</span>
                    <span className="text-xs block text-slate-400 font-normal">/ 20</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Cadre Pédagogique National</h3>
                    <p className="text-xs text-slate-400 mt-1">Diagnostic cognitif automatique et évaluation des compétences phonologiques.</p>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono">Mention Académique</span>
                  <div className={`text-sm font-black uppercase mt-1 px-4 py-1.5 rounded-xl border ${
                    roundedGradeOnTwenty() >= 16 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
                    roundedGradeOnTwenty() >= 12 ? 'bg-blue-500/10 border-blue-500 text-blue-400' :
                    'bg-amber-500/10 border-amber-500 text-amber-400'
                  }`}>
                    {roundedGradeOnTwenty() >= 16 ? 'Excellent (Très Haut Niveau)' :
                     roundedGradeOnTwenty() >= 12 ? 'Bien Acquis (Niveau National)' :
                     'À consolider (Séances requises)'}
                  </div>
                </div>
              </div>

              {/* Competency Grids Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest font-mono">Maîtrise des Compétences Cognitives</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 1, name: "Lecture & Compréhension", desc: "Compréhension textuelle et extraction de sens implicite.", success: selectedAnswers[activeQuestions[0]?.id] === activeQuestions[0]?.correctAnswer },
                    { id: 2, name: "Structures Linguistiques", desc: "Adaptation de la grammaire et du lexique actif.", success: selectedAnswers[activeQuestions[1]?.id] === activeQuestions[1]?.correctAnswer },
                    { id: 3, name: "Déduction & Cohérence", desc: "Synthèse critique et corrélations phonologiques.", success: selectedAnswers[activeQuestions[2]?.id] === activeQuestions[2]?.correctAnswer },
                    { id: 4, name: "Application Active", desc: "Mémoire de travail et mise en œuvre des concepts.", success: selectedAnswers[activeQuestions[3]?.id] === activeQuestions[3]?.correctAnswer }
                  ].map(skill => (
                    <div key={skill.id} className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Compétence {skill.id}</span>
                        <p className="text-xs font-bold text-white">{skill.name}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{skill.desc}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border shrink-0 ${
                        skill.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        {skill.success ? 'Acquis' : 'À Renforcer'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualitative Observations & Action Plans */}
              <div className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-widest font-mono block">Remédiation Cognitive & Recommandations</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {roundedGradeOnTwenty() >= 16 ? (
                    "Félicitations, Capitaine ! Le pipeline phonologique et sémantique montre une fluidité absolue. La mémorisation à long terme est structurée. Aucun encombrement de la mémoire de travail à signaler. Poursuivre sur cette lancée pour les défis IA."
                  ) : roundedGradeOnTwenty() >= 12 ? (
                    "Excellent travail d'assimilation. Quelques légers décalages d'automatisation ont été isolés sur les questions de structure fine. Il est conseillé de revoir le support de synthèse rapide et de faire une session d'entraînement de 5 minutes dans l'Arène Cognitive."
                  ) : (
                    "Le score de contrôle indique que les liaisons phonème-graphème nécessitent un soutien d'encadrement pédagogique plus lourd. Privilégier les schémas de cartes neurales (Neural Maps) pour restructurer la hiérarchie logique avant de retenter l'évaluation."
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {activeQuestions.map((q, qIndex) => (
              <div key={q.id} className="space-y-4 bg-slate-950/40 border border-white/5 p-6 rounded-3xl">
                <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-red-500 font-extrabold text-lg">Q{qIndex + 1}.</span>
                  <h3 className="text-base font-bold text-white tracking-wide leading-relaxed">{q.question}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = selectedAnswers[q.id] === optIndex;
                    const isCorrect = q.correctAnswer === optIndex;
                    const showSuccess = showResults && isCorrect;
                    const showError = showResults && isSelected && !isCorrect;

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleSelect(q.id, optIndex)}
                        disabled={showResults}
                        className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-300 cursor-pointer text-sm
                          ${isSelected && !showResults ? 'bg-red-500/10 border-red-500 text-white font-semibold' : 'bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700 hover:bg-slate-900'}
                          ${showSuccess ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold' : ''}
                          ${showError ? 'bg-red-500/10 border-red-500 text-slate-400' : ''}
                          ${isRtl ? 'text-right flex-row-reverse' : 'text-left flex-row'}
                        `}
                      >
                        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0
                            ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-slate-700'}
                            ${showSuccess ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                            ${showError ? 'bg-red-500 border-red-500 text-white' : ''}
                          `}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span>{opt}</span>
                        </div>
                        
                        {showSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mx-2" />}
                        {showError && <XCircle className="w-5 h-5 text-red-500 shrink-0 mx-2" />}
                      </button>
                    );
                  })}
                </div>

                {showResults && (
                  <div className="p-4.5 bg-slate-900/60 rounded-2xl border border-white/5 mt-4">
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">
                      <span className="text-emerald-500 font-extrabold uppercase mr-1 tracking-wider">[{tr.explanations}]</span>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submittals or Action items */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            {showResults ? (
              <div className={`flex flex-col sm:flex-row items-center gap-6 w-full justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-white">
                    Score: <span className={calculateScore() >= activeQuestions.length / 2 ? 'text-emerald-500' : 'text-red-500'}>{calculateScore()}</span>/{activeQuestions.length}
                  </div>
                  <div className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl font-mono text-xs font-bold text-slate-300">
                    {tr.scoreOver} : {roundedGradeOnTwenty()}/20
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setSelectedAnswers({}); setShowResults(false); }} 
                    className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    {tr.restartBtn}
                  </button>
                  {onRestart && (
                    <button 
                      type="button"
                      onClick={onRestart}
                      className="px-5 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 border border-red-500/25"
                    >
                      <Sparkles className="w-4 h-4" />
                      Générer nouveau
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setShowResults(true)} 
                disabled={Object.keys(selectedAnswers).length < activeQuestions.length}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-30 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_25px_rgba(220,38,38,0.25)] disabled:shadow-none cursor-pointer"
              >
                {tr.validateBtn}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: OFFICIAL PRINTABLE WORKSHEET */}
      {activeTab === 'printable' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" /> Informations pour l'impression de la fiche
            </h4>
            <p className="text-xs text-slate-500">Configurez l'entête académique de l'élève avant de lancer le rendu imprimé.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder={tr.studentLabel}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500/50"
              />
              <input 
                type="text" 
                placeholder={tr.classLabel}
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500/50"
              />
              <input 
                type="text" 
                placeholder={tr.dateLabel}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          {/* PRINTABLE SHEET CONTAINER (White background, high contrast for clean physical printout) */}
          <div className="p-1 bg-white rounded-2xl overflow-hidden border border-slate-300/60 shadow-xl">
            <div id="pedagogical-exam-sheet" className="bg-white text-slate-900 p-10 font-sans text-left min-h-[850px] space-y-8" dir="ltr">
              
              {/* Institution Header */}
              <div className="border-b-4 border-double border-slate-800 pb-5 flex justify-between items-start">
                <div className="space-y-1.5 text-xs text-slate-600 font-serif">
                  <p className="font-extrabold text-[10px] tracking-wider text-slate-800 uppercase">{tr.institTitle}</p>
                  <p>Académie de l'Innovation Éducative</p>
                  <p>Moteur de traitement: Mount AI Scholar (Gemma Edge)</p>
                </div>
                <div className="text-right space-y-1.5 text-xs text-slate-600 font-serif">
                  <p className="font-extrabold text-[10px] tracking-wider text-slate-800">NOTE EXAMEN</p>
                  <div className="w-14 h-14 border-2 border-slate-700 rounded-full flex items-center justify-center mx-auto text-sm font-black text-slate-800">
                    / 20
                  </div>
                </div>
              </div>

              {/* Exam Title */}
              <div className="text-center space-y-2">
                <h1 className="text-xl font-extrabold tracking-wide uppercase text-slate-900 font-serif border-y-2 border-slate-200 py-3">{tr.title}</h1>
                <p className="text-[10px] text-slate-500 italic uppercase tracking-wider">{tr.subtitle}</p>
              </div>

              {/* Student Details Fields */}
              <div className="grid grid-cols-3 gap-6 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-serif font-semibold text-slate-700">
                <div>{tr.studentLabel} : <span className="text-slate-900 font-black tracking-wide underline decoration-dotted">{studentName || "...................................................."}</span></div>
                <div>{tr.classLabel} : <span className="text-slate-900 font-black underline decoration-dotted">{studentClass || ".........................................."}</span></div>
                <div>{tr.dateLabel} : <span className="text-slate-900 font-black underline decoration-dotted">{examDate || "....................."}</span></div>
              </div>

              {/* Context Block overview if available */}
              {originalTextContext && (
                <div className="border-l-4 border-slate-400 pl-4 bg-slate-50 py-3.5 pr-2 rounded text-[10px] text-slate-600 leading-relaxed font-serif max-h-[140px] overflow-hidden opacity-90 border-t border-b border-r border-slate-200">
                  <strong className="text-slate-800 uppercase tracking-widest text-[9px] block mb-1">Texte d'Étude & Contexte de l'Évaluation :</strong>
                  "{originalTextContext.length > 500 ? originalTextContext.substring(0, 500) + "..." : originalTextContext}"
                </div>
              )}

              {/* Checklist & evaluation criterion */}
              <div className="bg-slate-50 p-3 rounded-lg text-[9px] text-slate-500 font-mono leading-relaxed border border-slate-100">
                {tr.evaluationCriteria}
              </div>

              {/* Questions Section */}
              <div className="space-y-6">
                {activeQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-3 font-serif">
                    <h4 className="text-xs font-black text-slate-900"><span className="text-amber-800 mr-1.5 font-bold">Question {idx + 1}.</span> {q.question}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-medium pl-6 text-slate-700">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2.5 py-1">
                          <div className="w-3.5 h-3.5 border border-slate-400 rounded-sm bg-white" />
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Free Writing slot for physical handwriting */}
              <div className="pt-4 border-t border-slate-200 space-y-12">
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 font-serif">{tr.comments}</p>
                  <div className="border-b border-dashed border-slate-300 h-6 w-full" />
                  <div className="border-b border-dashed border-slate-300 h-6 w-full" />
                  <div className="border-b border-dashed border-slate-300 h-6 w-full" />
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                  <p>Fiche générée automatiquement par Mount AI Scholar — Confidentialité Client Absolue.</p>
                  <p>Signature Examinateur: _______________________</p>
                </div>
              </div>

            </div>
          </div>

          {/* Trigger Print option */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg cursor-pointer transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {isDownloading ? 'GÉNÉRATION DU PDF...' : tr.downloadBtn}
            </button>
          </div>
        </div>
      )}

      {/* RENDER VIEW 3: TEACHER SOLUTIONS KEY */}
      {activeTab === 'correction' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
            <BookOpen className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed font-mono">
              <strong className="text-amber-500 uppercase font-black block tracking-wider mb-1">GUIDE POUR L'ENSEIGNANT / TUTOR CORRECTION KEY</strong>
              Cette section est exclusive à l'examinateur. Elle fournit les réponses optimales attendues de l'apprenant, associées aux raisonnements analytiques issus d'indicateurs de sciences cognitives. Elle permet d'orienter les remédiations orthographiques ou phonologiques rapides.
            </div>
          </div>

          <div className="space-y-6 select-text">
            {activeQuestions.map((q, idx) => (
              <div key={q.id} className="bg-slate-950/60 border border-white/5 p-6 rounded-3xl space-y-4">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 font-black text-[10px] rounded border border-amber-500/20 uppercase">Q{idx + 1} Solution</span>
                  <p className="text-sm font-bold text-white tracking-wide">{q.question}</p>
                </div>

                <div className="space-y-2.5 pl-4 border-l-2 border-slate-800">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctAnswer === oIdx;
                    return (
                      <div 
                        key={oIdx} 
                        className={`p-3 rounded-xl text-xs flex items-center justify-between
                          ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold' : 'text-slate-400'}
                        `}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-900 rounded-xl p-4 border border-white/5 text-xs text-slate-300 font-mono leading-relaxed">
                  <span className="text-emerald-500 font-extrabold uppercase mr-1 tracking-wider">[{tr.explanations}]</span>
                  {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
