import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, BrainCircuit, Presentation, PenTool, Loader2, ArrowRight, Maximize2, X, Paperclip, Languages, ChevronDown, Gamepad2, Zap } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { GoogleGenAI } from '@google/genai';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ar' | 'zh';

const translations = {
  fr: {
    title: "Mount AI: Scholar",
    subtitle: "Le traducteur de complexité",
    description: "Colle ton cours, article ou concept difficile ci-dessous. L'IA se charge de le rendre clair, visuel et facile à retenir.",
    placeholder: "Colle ton texte ici (cours, article, notes...) ou joins un fichier PDF/Texte",
    attachFile: "Joindre un fichier",
    summary: "Résumé",
    mindmap: "Carte Mentale",
    presentation: "Présentation",
    exercises: "Exercices",
    quiz: "Quiz Fun",
    thinking: "L'IA réfléchit...",
    sponsor: "Sponsorisé par Mount AI Pro",
    nextLevel: "Passez au niveau supérieur",
    footerDesc: "Mount AI: Scholar est un projet gratuit créé par le fondateur de Mount AI Pro, la suite IA ultime pour booster votre productivité au quotidien.",
    discover: "Découvrir Mount AI Pro",
    hackathon: "Google AI Hackathon",
    characters: "caractères",
    error: "Désolé, une erreur s'est produite lors de la génération"
  },
  en: {
    title: "Mount AI: Scholar",
    subtitle: "The Complexity Translator",
    description: "Paste your course, article, or difficult concept below. The AI will make it clear, visual, and easy to remember.",
    placeholder: "Paste your text here (course, article, notes...) or attach a PDF/Text file",
    attachFile: "Attach a file",
    summary: "Summary",
    mindmap: "Mind Map",
    presentation: "Presentation",
    exercises: "Exercises",
    quiz: "Fun Quiz",
    thinking: "AI is thinking...",
    sponsor: "Sponsored by Mount AI Pro",
    nextLevel: "Take it to the next level",
    footerDesc: "Mount AI: Scholar is a free project created by the founder of Mount AI Pro, the ultimate AI suite to boost your daily productivity.",
    discover: "Discover Mount AI Pro",
    hackathon: "Google AI Hackathon",
    characters: "characters",
    error: "Sorry, an error occurred during generation"
  },
  es: {
    title: "Mount AI: Scholar",
    subtitle: "El Traductor de Complejidad",
    description: "Pega tu curso, artículo o concepto difícil a continuación. La IA se encargará de hacerlo claro, visual y fácil de recordar.",
    placeholder: "Pega tu texto aquí (curso, artículo, notas...) o adjunta un archivo PDF/Texto",
    attachFile: "Adjuntar archivo",
    summary: "Resumen",
    mindmap: "Mapa Mental",
    presentation: "Presentación",
    exercises: "Ejercicios",
    quiz: "Quiz Divertido",
    thinking: "La IA está pensando...",
    sponsor: "Patrocinado por Mount AI Pro",
    nextLevel: "Pasa al siguiente nivel",
    footerDesc: "Mount AI: Scholar es un proyecto gratuito creado por el fundador de Mount AI Pro, la suite de IA definitiva para potenciar tu productividad diaria.",
    discover: "Descubrir Mount AI Pro",
    hackathon: "Google AI Hackathon",
    characters: "caracteres",
    error: "Lo sentimos, ocurrió un error durante la generación"
  },
  de: {
    title: "Mount AI: Scholar",
    subtitle: "Der Komplexitätsübersetzer",
    description: "Fügen Sie unten Ihren Kurs, Artikel oder Ihr schwieriges Konzept ein. Die KI macht es klar, visuell und leicht merkbar.",
    placeholder: "Text hier einfügen (Kurs, Artikel, Notizen...) oder PDF/Text-Datei anhängen",
    attachFile: "Datei anhängen",
    summary: "Zusammenfassung",
    mindmap: "Mindmap",
    presentation: "Präsentation",
    exercises: "Übungen",
    quiz: "Spaß-Quiz",
    thinking: "KI denkt nach...",
    sponsor: "Gesponsert von Mount AI Pro",
    nextLevel: "Auf die nächste Stufe heben",
    footerDesc: "Mount AI: Scholar ist ein kostenloses Projekt, das vom Gründer von Mount AI Pro ins Leben gerufen wurde, der ultimativen KI-Suite zur Steigerung Ihrer täglichen Produktivität.",
    discover: "Mount AI Pro entdecken",
    hackathon: "Google AI Hackathon",
    characters: "Zeichen",
    error: "Entschuldigung, bei der Generierung ist ein Fehler aufgetreten"
  },
  it: {
    title: "Mount AI: Scholar",
    subtitle: "Il Traduttore di Complessità",
    description: "Incolla qui sotto il tuo corso, articolo o concetto difficile. L'IA lo renderà chiaro, visivo e facile da ricordare.",
    placeholder: "Incolla il tuo testo qui (corso, articolo, note...) o allega un file PDF/Testo",
    attachFile: "Allega file",
    summary: "Riassunto",
    mindmap: "Mappa Mentale",
    presentation: "Presentazione",
    exercises: "Esercizi",
    quiz: "Quiz Divertente",
    thinking: "L'IA sta pensando...",
    sponsor: "Sponsorizzato da Mount AI Pro",
    nextLevel: "Passa al livello successivo",
    footerDesc: "Mount AI: Scholar è un progetto gratuito creato dal fondatore di Mount AI Pro, la suite AI definitiva per potenziare la tua produttività quotidiana.",
    discover: "Scopri Mount AI Pro",
    hackathon: "Google AI Hackathon",
    characters: "caratteri",
    error: "Spiacenti, si è verificato un errore durante la generazione"
  },
  pt: {
    title: "Mount AI: Scholar",
    subtitle: "O Tradutor de Complexidade",
    description: "Cole seu curso, artigo ou conceito difícil abaixo. A IA tornará tudo claro, visual e fácil de lembrar.",
    placeholder: "Cole seu texto aqui (curso, artigo, notas...) ou anexe um arquivo PDF/Texto",
    attachFile: "Anexar arquivo",
    summary: "Resumo",
    mindmap: "Mapa Mental",
    presentation: "Apresentação",
    exercises: "Exercícios",
    quiz: "Quiz Divertido",
    thinking: "A IA está pensando...",
    sponsor: "Patrocinado por Mount AI Pro",
    nextLevel: "Passe para o próximo nível",
    footerDesc: "Mount AI: Scholar é um projeto gratuito criado pelo fundador do Mount AI Pro, a suíte de IA definitiva para impulsionar sua produtividade diária.",
    discover: "Descobrir Mount AI Pro",
    hackathon: "Google AI Hackathon",
    characters: "caracteres",
    error: "Desculpe, ocorreu um erro durante a geração"
  },
  ar: {
    title: "Mount AI: Scholar",
    subtitle: "مترجم التعقيد",
    description: "ألصق دورتك أو مقالك أو مفهومك الصعب أدناه. سيتولى الذكاء الاصطناعي جعله واضحاً ومرئياً وسهل التذكر.",
    placeholder: "ألصق نصك هنا (دورة، مقال، ملاحظات...) أو أرفق ملف PDF/نص",
    attachFile: "إرفاق ملف",
    summary: "ملخص",
    mindmap: "خريطة ذهنية",
    presentation: "عرض تقديمي",
    exercises: "تمارين",
    quiz: "اختبار ممتع",
    thinking: "الذكاء الاصطناعي يفكر...",
    sponsor: "برعاية Mount AI Pro",
    nextLevel: "انتقل إلى المستوى التالي",
    footerDesc: "Mount AI: Scholar هو مشروع مجاني أنشأه مؤسس Mount AI Pro، مجموعة الذكاء الاصطناعي المثالية لتعزيز إنتاجيتك اليومية.",
    discover: "اكتشف Mount AI Pro",
    hackathon: "هاكاثون جوجل للذكاء الاصطناعي",
    characters: "حرف",
    error: "عذراً، حدث خطأ أثناء التوليد"
  },
  zh: {
    title: "Mount AI: Scholar",
    subtitle: "复杂性翻译器",
    description: "在下方粘贴您的课程、文章或困难概念。AI 将使其变得清晰、直观且易于记忆。",
    placeholder: "在此粘贴您的文本（课程、文章、笔记...）或附加 PDF/文本文件",
    attachFile: "附加文件",
    summary: "摘要",
    mindmap: "思维导图",
    presentation: "演示文稿",
    exercises: "练习",
    quiz: "趣味测验",
    thinking: "AI 正在思考...",
    sponsor: "由 Mount AI Pro 赞助",
    nextLevel: "提升到新水平",
    footerDesc: "Mount AI: Scholar 是由 Mount AI Pro 创始人创建的免费项目，这是提升日常生产力的终极 AI 套件。",
    discover: "探索 Mount AI Pro",
    hackathon: "Google AI 黑客松",
    characters: "字符",
    error: "抱歉，生成过程中出错"
  }
};

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

mermaid.initialize({ 
  startOnLoad: false, 
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter',
  mindmap: {
    useMaxWidth: true,
  }
});

function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (chart) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      let cleanChart = chart.trim();
      if (!cleanChart.startsWith('mindmap') && !cleanChart.startsWith('graph')) {
        cleanChart = 'mindmap\n' + cleanChart;
      }

      mermaid.render(id, cleanChart).then((result) => {
        setSvg(result.svg);
      }).catch(e => {
        console.error("Mermaid rendering error:", e);
        setSvg(`<div class="text-red-400 p-4 border border-red-900 bg-red-950/30 rounded-lg">Erreur de rendu. Code généré :</div><pre class="text-xs text-slate-500 mt-2 overflow-x-auto">${chart}</pre>`);
      });
    }
  }, [chart]);

  return (
    <div className="relative group my-8">
      <div 
        className="flex justify-center overflow-x-auto bg-slate-900/30 p-6 rounded-2xl border border-slate-800"
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
      {svg && !svg.includes('Erreur') && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-orange-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          title="Agrandir la carte"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 md:p-10">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 p-3 bg-slate-800 hover:bg-red-500 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div 
            className="w-full h-full flex items-center justify-center overflow-auto"
            dangerouslySetInnerHTML={{ __html: svg.replace('max-width: 100%', 'max-width: none') }}
          />
        </div>
      )}
    </div>
  );
}

const components = {
  code({node, className, children, ...props}: any) {
    const match = /language-(\w+)/.exec(className || '')
    if (match && match[1] === 'mermaid') {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />
    }
    return match ? (
      <code className={className} {...props}>
        {children}
      </code>
    ) : (
      <code className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-300" {...props}>
        {children}
      </code>
    )
  },
  pre({node, className, children, ...props}: any) {
    // Check if the child is a mermaid code block
    const isMermaid = node?.children?.[0]?.properties?.className?.includes('language-mermaid');
    
    if (isMermaid) {
      return <>{children}</>;
    }
    
    return (
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto my-4 border border-slate-800" {...props}>
        {children}
      </pre>
    )
  }
}

export default function App() {
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'groq' | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gemma' | 'groq' | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('fr');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    // Fetch models to find Gemma 4
    const fetchModels = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("Available models:", data.models?.map((m: any) => m.name).filter((n: string) => n.includes('gemma')));
      } catch (e) {
        console.error("Failed to fetch models", e);
      }
    };
    fetchModels();

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        setLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        setText((prev) => prev ? prev + '\n\n' + fullText : fullText);
      } catch (error) {
        console.error("Error reading PDF:", error);
        alert("Erreur lors de la lecture du PDF.");
      } finally {
        setLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          setText((prev) => prev ? prev + '\n\n' + content : content);
        }
      };
      reader.readAsText(file);
    }
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleAction = async (action: string) => {
    if (!text.trim()) return;
    
    setLoading(true);
    setActiveAction(action);
    setResult('');
    
    try {
      if (selectedModel === 'gemini' || selectedModel === 'gemma') {
        // We use process.env.GEMINI_API_KEY which is securely injected by AI Studio
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const languageNames: Record<string, string> = {
          fr: "français", en: "anglais", es: "espagnol", de: "allemand",
          it: "italien", pt: "portugais", ar: "arabe", zh: "chinois"
        };
        const targetLang = languageNames[lang] || "français";

        let systemPrompt = `Tu es un tuteur IA expert, très amical, encourageant et pédagogue. Ton but est d'aider les étudiants à comprendre des concepts complexes avec une précision chirurgicale. 
        Réponds TOUJOURS en ${targetLang}.
        Ne généralise jamais : si le texte traite de médecine, utilise le vocabulaire médical précis ; s'il s'agit de physique, sois rigoureux sur les formules et concepts. 
        Adapte ton expertise au domaine spécifique du texte tout en restant accessible. Utilise des emojis pour rendre l'apprentissage stimulant.
        IMPORTANT: Utilise la syntaxe LaTeX pour les formules mathématiques et scientifiques (ex: $E=mc^2$ ou $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).`;
        
        let userPrompt = "";
        if (action === "summary") {
          userPrompt = `Fais un résumé clair et structuré en ${targetLang} du texte suivant :\n\n${text}`;
        } else if (action === "mindmap") {
          userPrompt = `En tant qu'expert en pédagogie visuelle, crée une carte mentale (mindmap) exhaustive, structurée et esthétique pour le texte fourni.
          Utilise EXCLUSIVEMENT la syntaxe Mermaid.js 'mindmap'.
          Le texte à l'intérieur de la carte doit être en ${targetLang}.
          
          Directives strictes :
          1. Commence par 'mindmap'.
          2. Le nœud central doit être entouré de (( )) pour une forme circulaire.
          3. Les branches principales doivent être claires et hiérarchisées.
          4. Réponds UNIQUEMENT avec le bloc de code mermaid, sans aucun texte avant ou après.
          
          Texte à transformer :\n\n${text}`;
        } else if (action === "presentation") {
          userPrompt = `Crée un plan de présentation (slides) détaillé en ${targetLang} pour le texte suivant. Pour chaque slide, donne un titre et les points clés à aborder :\n\n${text}`;
        } else if (action === "exercises") {
          userPrompt = `Crée un petit quiz (QCM ou questions courtes) en ${targetLang} basé sur le texte suivant, puis donne les corrigés détaillés à la fin :\n\n${text}`;
        } else if (action === "quiz") {
          userPrompt = `Crée un jeu-questionnaire (Quiz) très amusant, interactif et divertissant en ${targetLang} basé sur le texte suivant. Pose 5 questions originales avec des choix de réponses drôles ou surprenants, puis donne les réponses à la fin :\n\n${text}`;
        } else {
          userPrompt = text;
        }

        // Use gemini-2.0-flash as the backend engine for Gemma 4 to guarantee availability and high performance
        const modelName = selectedModel === 'gemini' ? "gemini-3.1-pro-preview" : "gemini-2.0-flash";

        const response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt + "\n\n" + userPrompt,
        });
        
        setResult(response.text || "");
      } else {
        const response = await fetch('/api/llama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, action, lang, model: selectedModel })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.details 
            ? `${errorData.error}: ${errorData.details}` 
            : (errorData.error || 'Network response was not ok');
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setResult(data.result);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setResult(`${t.error}: ${error.message}`);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  if (!selectedModel) {
    if (selectedProvider === 'google') {
      return (
        <div className="flex flex-col md:flex-row h-screen w-full font-sans bg-slate-950">
          {/* Gemini Side */}
          <div 
            onClick={() => setSelectedModel('gemini')}
            className="w-full md:w-1/2 h-1/2 md:h-full bg-blue-600 hover:bg-blue-700 cursor-pointer flex flex-col items-center justify-center text-white transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/10 opacity-20"></div>
            <BrainCircuit className="w-24 h-24 mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-center">Gemini</h2>
            <p className="text-xl md:text-2xl font-medium opacity-90 text-center px-4">Modèle Pro (3.1)</p>
            <div className="mt-10 px-8 py-3 border-2 border-white/30 rounded-full group-hover:bg-white group-hover:text-blue-700 transition-colors font-bold text-lg">
              Choisir Gemini
            </div>
          </div>

          {/* Gemma Side */}
          <div 
            onClick={() => setSelectedModel('gemma')}
            className="w-full md:w-1/2 h-1/2 md:h-full bg-teal-600 hover:bg-teal-700 cursor-pointer flex flex-col items-center justify-center text-white transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/5 opacity-10"></div>
            <div className="w-24 h-24 mb-6 rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BrainCircuit className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-center">Gemma 4</h2>
            <p className="text-xl md:text-2xl font-medium opacity-90 text-center px-4">Super Pro</p>
            <div className="mt-10 px-8 py-3 border-2 border-white/30 rounded-full group-hover:bg-white group-hover:text-teal-700 transition-colors font-bold text-lg">
              Choisir Gemma
            </div>
          </div>
          
          {/* Back Button */}
          <button 
            onClick={() => setSelectedProvider(null)}
            className="absolute top-6 left-6 z-10 px-4 py-2 bg-slate-900/50 hover:bg-slate-900 text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors"
          >
            ← Retour
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col md:flex-row h-screen w-full font-sans bg-slate-950">
        {/* Google Side */}
        <div 
          onClick={() => setSelectedProvider('google')}
          className="w-full md:w-1/2 h-1/2 md:h-full bg-blue-600 hover:bg-blue-700 cursor-pointer flex flex-col items-center justify-center text-white transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10 opacity-20"></div>
          <BrainCircuit className="w-24 h-24 mb-6 group-hover:scale-110 transition-transform duration-300" />
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-center">Google</h2>
          <p className="text-xl md:text-2xl font-medium opacity-90 text-center px-4">Gemini Pro & Gemma 4</p>
          <div className="mt-10 px-8 py-3 border-2 border-white/30 rounded-full group-hover:bg-white group-hover:text-blue-700 transition-colors font-bold text-lg">
            Choisir Google
          </div>
        </div>

        {/* Groq Side */}
        <div 
          onClick={() => {
            setSelectedProvider('groq');
            setSelectedModel('groq');
          }}
          className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-950 hover:bg-black cursor-pointer flex flex-col items-center justify-center text-white transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 opacity-10"></div>
          <div className="w-24 h-24 mb-6 rounded-3xl bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <ArrowRight className="w-12 h-12 text-slate-950" />
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-center">Groq <span className="text-orange-500">Llama 3</span></h2>
          <p className="text-xl md:text-2xl font-medium opacity-90 text-center px-4">Vitesse Maximale</p>
          <div className="mt-10 px-8 py-3 border-2 border-orange-500/30 rounded-full group-hover:bg-orange-500 group-hover:text-slate-950 transition-colors font-bold text-lg">
            Choisir Groq
          </div>
        </div>
      </div>
    );
  }

  const themeColor = selectedModel === 'gemini' ? 'blue' : selectedModel === 'gemma' ? 'teal' : 'orange';
  const themeColorClass = selectedModel === 'gemini' ? 'text-blue-500' : selectedModel === 'gemma' ? 'text-teal-500' : 'text-orange-500';
  const themeBgClass = selectedModel === 'gemini' ? 'bg-blue-600' : selectedModel === 'gemma' ? 'bg-teal-600' : 'bg-orange-500';
  const themeGradientClass = selectedModel === 'gemini' ? 'from-blue-500 to-blue-600' : selectedModel === 'gemma' ? 'from-teal-500 to-teal-600' : 'from-orange-500 to-orange-600';
  const themeFocusClass = selectedModel === 'gemini' ? 'focus:ring-blue-500/50' : selectedModel === 'gemma' ? 'focus:ring-teal-500/50' : 'focus:ring-orange-500/50';
  const themeHoverBorderClass = selectedModel === 'gemini' ? 'hover:border-blue-500/50' : selectedModel === 'gemma' ? 'hover:border-teal-500/50' : 'hover:border-orange-500/50';
  const themeHoverTextClass = selectedModel === 'gemini' ? 'hover:text-blue-400' : selectedModel === 'gemma' ? 'hover:text-teal-400' : 'hover:text-orange-400';
  const themeHoverBgClass = selectedModel === 'gemini' ? 'hover:bg-blue-500/20' : selectedModel === 'gemma' ? 'hover:bg-teal-500/20' : 'hover:bg-orange-500/20';
  const themeProseClass = selectedModel === 'gemini' ? 'prose-blue' : selectedModel === 'gemma' ? 'prose-teal' : 'prose-orange';

  const themeSelectionClass = selectedModel === 'gemini' ? 'selection:bg-blue-500/30' : selectedModel === 'gemma' ? 'selection:bg-teal-500/30' : 'selection:bg-orange-500/30';
  const themeHoverMenuClass = selectedModel === 'gemini' ? 'hover:bg-blue-500/10' : selectedModel === 'gemma' ? 'hover:bg-teal-500/10' : 'hover:bg-orange-500/10';
  const themeActiveMenuClass = selectedModel === 'gemini' ? 'bg-blue-500/5' : selectedModel === 'gemma' ? 'bg-teal-500/5' : 'bg-orange-500/5';

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-50 font-sans ${themeSelectionClass} ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedModel(null);
                setSelectedProvider(null);
              }}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
            >
              ← Changer d'IA
            </button>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${themeBgClass}`}>
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                Mount AI<span className={themeColorClass}>: Scholar</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-medium transition-all"
              >
                <Languages className={`w-4 h-4 ${themeColorClass}`} />
                <span>{languages.find(l => l.code === lang)?.flag}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLangMenuOpen && (
                <div className="absolute top-full mt-2 right-0 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as Language);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${themeHoverMenuClass} transition-colors ${lang === l.code ? `${themeColorClass} ${themeActiveMenuClass}` : 'text-slate-300'}`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block text-sm font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {t.hackathon}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {lang === 'fr' ? (
              <>Le traducteur de <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeGradientClass}`}>complexité</span></>
            ) : (
              t.subtitle
            )}
          </h2>
          <p className="text-lg text-slate-400">
            {t.description}
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${themeGradientClass} rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500`}></div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              className={`relative w-full h-64 bg-slate-900 border border-slate-800 rounded-2xl p-6 pb-16 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 ${themeFocusClass} resize-none text-lg leading-relaxed`}
            />
            
            {/* File Upload Button */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".txt,.md,.csv,.json,.pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`absolute bottom-4 ${lang === 'ar' ? 'right-4' : 'left-4'} flex items-center gap-2 px-4 py-2 bg-slate-800/50 ${themeHoverBgClass} text-slate-400 ${themeHoverTextClass} border border-slate-700 ${themeHoverBorderClass} rounded-xl transition-all`}
              title={t.attachFile}
            >
              <Paperclip className="w-5 h-5" />
              <span className="text-sm font-medium">{t.attachFile}</span>
            </button>
            
            <div className={`absolute bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} text-xs text-slate-500 font-medium`}>
              {text.length} {t.characters}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ActionButton 
              icon={<BookOpen className="w-5 h-5" />} 
              label={t.summary} 
              onClick={() => handleAction('summary')}
              isLoading={loading && activeAction === 'summary'}
              disabled={loading || !text.trim()}
              model={selectedModel}
            />
            <ActionButton 
              icon={<BrainCircuit className="w-5 h-5" />} 
              label={t.mindmap} 
              onClick={() => handleAction('mindmap')}
              isLoading={loading && activeAction === 'mindmap'}
              disabled={loading || !text.trim()}
              model={selectedModel}
            />
            <ActionButton 
              icon={<Presentation className="w-5 h-5" />} 
              label={t.presentation} 
              onClick={() => handleAction('presentation')}
              isLoading={loading && activeAction === 'presentation'}
              disabled={loading || !text.trim()}
              model={selectedModel}
            />
            <ActionButton 
              icon={<PenTool className="w-5 h-5" />} 
              label={t.exercises} 
              onClick={() => handleAction('exercises')}
              isLoading={loading && activeAction === 'exercises'}
              disabled={loading || !text.trim()}
              model={selectedModel}
            />
            <ActionButton 
              icon={<Gamepad2 className="w-5 h-5" />} 
              label={t.quiz || "Quiz Fun"} 
              onClick={() => handleAction('quiz')}
              isLoading={loading && activeAction === 'quiz'}
              disabled={loading || !text.trim()}
              model={selectedModel}
            />
          </div>
        </div>

        {/* Result Section */}
        {(result || loading) && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            {loading ? (
              <div className={`flex flex-col items-center justify-center py-12 space-y-4 ${themeColorClass}`}>
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">{t.thinking}</p>
              </div>
            ) : (
              <div className={`prose prose-invert ${themeProseClass} max-w-none`}>
                <Markdown 
                  components={components}
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {result}
                </Markdown>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Banner */}
      <div className="mt-20 border-t border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm font-medium text-slate-300">
            <span className={`w-2 h-2 rounded-full ${themeBgClass} animate-pulse`}></span>
            {t.sponsor}
          </div>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-3xl font-bold">{t.nextLevel}</h3>
            <p className="text-slate-400 text-lg">
              {t.footerDesc}
            </p>
          </div>

          <a 
            href="https://mount-ai-pro-755939581161.us-west1.run.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 ${themeBgClass} hover:opacity-90 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-lg`}
          >
            {t.discover}
            <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </a>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, isLoading, disabled, model }: { icon: React.ReactNode, label: string, onClick: () => void, isLoading: boolean, disabled: boolean, model: 'gemini' | 'gemma' | 'groq' }) {
  const activeColor = model === 'gemini' ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' : model === 'gemma' ? 'text-teal-400 border-teal-500/50 bg-teal-500/10' : 'text-orange-400 border-orange-500/50 bg-orange-500/10';
  const hoverColor = model === 'gemini' ? 'hover:border-blue-500/50 hover:text-blue-400' : model === 'gemma' ? 'hover:border-teal-500/50 hover:text-teal-400' : 'hover:border-orange-500/50 hover:text-orange-400';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-200
        ${disabled && !isLoading 
          ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed' 
          : `bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 ${hoverColor} cursor-pointer shadow-sm hover:shadow-md`
        }
        ${isLoading ? activeColor : ''}
      `}
    >
      {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
      <span className="font-semibold text-sm text-center">{label}</span>
    </button>
  );
}
