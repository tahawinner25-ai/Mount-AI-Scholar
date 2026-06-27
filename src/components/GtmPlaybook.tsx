import React, { useState } from 'react';
import { 
  Rocket, 
  TrendingUp, 
  Coins, 
  Terminal, 
  CheckCircle2, 
  Target, 
  ShieldAlert, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  Cpu, 
  Globe, 
  Award, 
  MessageSquare, 
  Flame, 
  BookOpen, 
  ArrowRight,
  ThumbsUp,
  X,
  FileText
} from 'lucide-react';

interface GtmPlaybookProps {
  user: any;
  mlEngineUrl: string;
}

export default function GtmPlaybook({ user, mlEngineUrl }: GtmPlaybookProps) {
  const [activeTab, setActiveTab] = useState<'strategies' | 'hn-tester' | 'generator' | 'monetization'>('strategies');
  
  // HN Title Tester states
  const [hnTitleInput, setHnTitleInput] = useState('Show HN: Mount AI Scholar – A local-first, zero-latency speech model for dyslexia');
  const [testerResult, setTesterResult] = useState<any>(null);

  // Post Generator states
  const [prodName, setProdName] = useState('Mount AI Scholar');
  const [prodUsp, setProdUsp] = useState('Inférence locale Gemma 4 (<25ms) pour l\'aide à la dyslexie, garantissant une protection PII absolue sans cloud.');
  const [launchTarget, setLaunchTarget] = useState<'hn' | 'ph' | 'devpost' | 'twitter'>('hn');
  const [launchTone, setLaunchTone] = useState<'humble' | 'deeptech' | 'bold'>('humble');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');
  const [copied, setCopied] = useState(false);

  // Analyze HN Title Function
  const handleAnalyzeHN = () => {
    const title = hnTitleInput.trim();
    let score = 100;
    const warnings: string[] = [];
    const positives: string[] = [];

    // Prefix check
    if (!title.toLowerCase().startsWith('show hn:')) {
      score -= 30;
      warnings.push("Hacker News exige le préfixe 'Show HN: ' (sensible à la casse pour être indexé dans l'onglet Show).");
    } else {
      positives.push("Préfixe 'Show HN:' détecté. Votre post apparaîtra dans l'onglet dédié et bénéficiera de la bienveillance de la communauté.");
    }

    // Length check
    if (title.length > 80) {
      score -= 15;
      warnings.push(`Titre trop long (${title.length} caractères). Visez moins de 80 caractères pour éviter la fatigue visuelle sur la homepage.`);
    } else if (title.length < 35) {
      score -= 10;
      warnings.push("Titre trop court. Le titre doit décrire précisément ce que fait le produit, pas seulement son nom.");
    } else {
      positives.push("Longueur de titre optimale pour une lisibilité maximale sur mobile et desktop.");
    }

    // Clickbait checks
    const clickbaitWords = [
      'revolutionary', 'best', 'game-changing', 'mind-blowing', 'insane', 'millionaire', 
      'magical', 'ultimate', 'perfect', 'easy', 'passive', 'generate', 'reévolutionnaire'
    ];
    const foundClickbait = clickbaitWords.filter(w => title.toLowerCase().includes(w));
    if (foundClickbait.length > 0) {
      score -= 25 * foundClickbait.length;
      warnings.push(`Présence de termes marketing/hype : "${foundClickbait.join(', ')}". La communauté HN déteste la publicité. Utilisez un ton purement factuel, descriptif et technique.`);
    } else {
      positives.push("Aucun mot-clic commercial ou superlatif marketing détecté. Style sobre et crédible.");
    }

    // Tech density / specificity
    const techWords = [
      'local', 'edge', 'open-source', 'gemma', 'latency', 'offline', 'privacy', 'speech', 'engine', 'model', 'dataset'
    ];
    const foundTech = techWords.filter(w => title.toLowerCase().includes(w));
    if (foundTech.length > 0) {
      positives.push(`Mots-clés techniques forts détectés : "${foundTech.join(', ')}". Cela attire immédiatement l'œil des ingénieurs.`);
    } else {
      score -= 15;
      warnings.push("Manque de spécificité technique. Expliquez *comment* cela fonctionne techniquement (ex: 'local-first', 'Gemma 4', 'WebRTC').");
    }

    // Real-world value / Target audience
    const valueWords = [
      'dyslexia', 'dyslexic', 'cognitive', 'learning', 'classroom', 'accessibility', 'deaf', 'assistive'
    ];
    const foundValue = valueWords.filter(w => title.toLowerCase().includes(w));
    if (foundValue.length > 0) {
      positives.push(`Utilité sociale/cognitive claire : "${foundValue.join(', ')}". Les projets à fort impact d'accessibilité sont très appréciés sur HN.`);
    }

    // Final Calibrations
    const finalScore = Math.max(10, Math.min(100, score));
    let rating = 'CRITIQUE';
    let ratingColor = 'text-red-500';
    if (finalScore >= 85) {
      rating = 'EXCELLENT — SILICON VALLEY STANDARD';
      ratingColor = 'text-emerald-400';
    } else if (finalScore >= 65) {
      rating = 'CORRECT — À OPTIMISER';
      ratingColor = 'text-amber-400';
    }

    setTesterResult({
      score: finalScore,
      rating,
      ratingColor,
      warnings,
      positives
    });
  };

  // Generate Launch Post using Gemini backend (or fallback)
  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setGeneratedPost('');

    let prompt = '';
    const isHn = launchTarget === 'hn';
    const isPh = launchTarget === 'ph';
    const isDevpost = launchTarget === 'devpost';
    const isTwitter = launchTarget === 'twitter';

    if (isHn) {
      prompt = `Tu es un fondateur de startup élite de la Silicon Valley, réputé pour son humilité et sa rigueur technique absolue sur Hacker News.
      Rédige le premier commentaire d'introduction (le "Why I built this") pour un Show HN.
      Détails du produit :
      Nom : ${prodName}
      USP Technique : ${prodUsp}
      Ton requis : ${launchTone === 'deeptech' ? 'Ingénieur en chef ultra-spécifique' : launchTone === 'bold' ? 'Visionnaire pragmatique' : 'Humble mais brillant et personnel'}.
      
      Règles absolues pour Hacker News :
      1. Pas de blabla marketing ("We are thrilled to announce", "next-gen", "revolutionary" sont interdits).
      2. Raconte l'histoire personnelle : pourquoi as-tu codé ça ? (ex: "I built this to solve dyslexia access offline for people with low bandwidth...").
      3. Explique l'architecture technique exacte (comment le moteur d'inférence tourne en local, la latence de <25ms, comment tu as structuré les données).
      4. Demande des retours francs ("constructive feedback") sur le code, la latence et l'expérience.
      5. Ne mets pas d'émojis ou d'exclamations excessives. Reste calme, pro, clinique.
      6. LA RÉPONSE DOIT ÊTRE EN ANGLAIS (la langue exclusive de Hacker News pour maximiser la portée internationale de notre startup de 13 ans).`;
    } else if (isPh) {
      prompt = `Tu es un Growth Hacker d'élite et de haut niveau, spécialisé en lancements Product Hunt.
      Rédige le "First Maker Comment" d'un lancement sur Product Hunt.
      Détails du produit :
      Nom : ${prodName}
      USP Technique : ${prodUsp}
      Ton requis : ${launchTone === 'deeptech' ? 'Analytique de haut niveau' : 'Ambitieux, engageant et poli'}.
      
      Règles pour Product Hunt :
      1. Utilise un format structuré et visuellement attrayant (utilisation modérée d'émojis, sections claires).
      2. Présente l'équipe (en insistant sur le fait qu'il s'agit d'une startup de pointe en stealth mode qui résout des défis d'accessibilité cognitive majeurs).
      3. Liste les fonctionnalités clés qui font de ce produit le "produit idéal" pour l'accessibilité.
      4. Offre une démo interactive en direct et invite à poser des questions.
      5. LA RÉPONSE DOIT ÊTRE EN ANGLAIS pour toucher l'écosystème international de Product Hunt.`;
    } else if (isDevpost) {
      prompt = `Tu es un vainqueur de hackathons mondiaux d'élite de Google DeepMind et de la fondation Gemini.
      Rédige le texte de soumission pour Devpost d'un projet de hackathon de haut vol.
      Détails du produit :
      Nom : ${prodName}
      USP Technique : ${prodUsp}
      
      Règles de Storytelling Devpost :
      1. Structure avec des titres très clairs : 
         - **Inspiration**: Quelle est l'origine du projet ? (Insiste sur la vision de Mount AI Scholar, l'aide à la dyslexie/accessibilité cognitive).
         - **What it does**: Description simple mais percutante.
         - **How we built it**: Présente l'architecture technique (React/Vite, Gemma 4 Edge local inference, FastAPI, Google Gemini API pour la synthèse cognitive). Montre la prouesse de l'inférence locale "Privacy by Design".
         - **Challenges we ran into**: Quels obstacles techniques complexes as-tu surmontés (ex: faire tourner l'inférence audio sous les 25ms de latence, sécuriser les données face aux prompt injections).
         - **Accomplishments that we're proud of**: De quoi es-tu le plus fier (ex: avoir une latence de niveau production, un design system d'accessibilité validé).
         - **What we learned**: Leçons techniques et humaines.
         - **What's next for ${prodName}**: La roadmap vers la WWDC 2027 et le scale mondial.
      2. Reste technique, structuré et extrêmement compétent.
      3. LA RÉPONSE DOIT ÊTRE EN ANGLAIS (obligatoire pour les jurys internationaux de hackathons Devpost).`;
    } else {
      prompt = `Tu es un ingénieur influent et un leader de la tech sur Twitter/X, célèbre pour ses threads sur le "vibe-coding" et les architectures IA de pointe.
      Rédige un "Stealth Launch Thread" de 3 tweets pour annoncer la version stable de ${prodName}.
      Détails du produit :
      Nom : ${prodName}
      USP Technique : ${prodUsp}
      
      Structure du thread :
      - Tweet 1: Le hook d'ingénierie brut. Pourquoi les modèles de 70B dans le cloud ne servent à rien si on a besoin de zéro latence locale en accessibilité cognitive.
      - Tweet 2: L'architecture. Un aperçu rapide de comment tourne l'inférence locale Gemma 4 (<25ms) couplée à une interface React réactive. "Privacy by Design" par excellence.
      - Tweet 3: L'appel à l'action. Une invitation ouverte aux ingénieurs systèmes et éducateurs à tester la sandbox et à donner leur avis.
      Pas de buzzwords marketing débiles, reste technique, vif, d'un niveau technique insolent.
      LA RÉPONSE DOIT ÊTRE EN ANGLAIS.`;
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setGeneratedPost(data.text || 'Erreur lors de la génération.');
    } catch (err) {
      console.warn("API Error, utilizing highly strategic local fallback:", err);
      // Fallback local hautement calibré
      let fallbackText = '';
      if (isHn) {
        fallbackText = `Hi HN,\n\nI built **${prodName}** because I wanted to solve a major technical and social bottleneck: real-time, non-latency speech-to-phoneme mapping for cognitive accessibility (specifically dyslexia) without sending sensitive vocal data to cloud APIs.\n\n### The Problem\nMost dyslexic reading tools rely on cloud processing. For vocal feedback, a delay of >200ms breaks the cognitive loop for struggling readers. Additionally, sending private voice audio of minors to third-party servers is a massive privacy risk.\n\n### The Tech Stack & Architecture\n- **Edge CoreML / Gemma Inference**: I developed a fully local, offline-first pipeline on our local PC/iPad (FastAPI bridge) running highly optimized model parameters.\n- **Sub-25ms Latency**: We process mic micro-batches to track vocal phonemes in near-instant loops.\n- **Hybrid Cloud Synthesis**: For resource-intensive tasks like dynamic cognitive maps and personalized quizzes, we route the text safely via a PII (Personally Identifiable Information) Firewall to the Gemini Pro engine.\n\nI would love to get your honest engineering feedback on how to optimize WebRTC audio streams for lower jitter under high CPU loads.\n\nThanks!\n- Capitaine, Lead Engineer`;
      } else if (isDevpost) {
        fallbackText = `## Inspiration\nWe wanted to build an educational tool that solves dyslexia reading friction with 100% data privacy. Most kids struggle with phonetic decoding; if the AI lags, they lose focus.\n\n## What it does\n**${prodName}** is a cognitive assistant that tracks vocal pronunciations locally, instantly highlights reading-phoneme issues with custom bionic fonts, and generates custom learning charts.\n\n## How we built it\nWe combined a high-performance React frontend with an edge FastAPI Python inference hub. Vocal analysis runs on local Edge models with zero latency, while complex cognitive synthesis leverages Gemini 3.5 via secure anonymized API proxies.\n\n## Challenges we ran into\nOptimizing audio frame buffers to prevent packet drops on Windows and iPad browsers while maintaining a responsive audio visualizer in D3.js. We resolved this through robust local ring-buffers.\n\n## What's next\nPorting our local weights directly to Apple's CoreML and ARKit for real-time spatial projection in classrooms at the WWDC 2027 Swift Student Challenge.`;
      } else if (isPh) {
        fallbackText = `Hello Product Hunt community! 🚀\n\nWe are excited to share **${prodName}**, a stealth cognitive learning startup. We have built a local-first, privacy-by-design platform helper for dyslexia and linguistic study.\n\n**Key Highlights:**\n- 🔒 **Zero-Cloud Audio Processing**: Complete privacy for children's voices.\n- ⚡ **Sub-25ms Phoneme Mapping**: Instant feedback loops.\n- 🗺️ **Cognitive Maps & Quizzes**: Direct synthesis of complex textbooks in seconds.\n\nWe are live and would love to hear your feedback on how we can improve accessibility. Let us know what you think!`;
      } else {
        fallbackText = `1/ Why run 70B LLMs in the cloud for real-time speech therapy? 

For kids with dyslexia, any latency >50ms breaks the cognitive learning loop. 

That is why we built **${prodName}** – running high-precision phoneme mapping fully local on local devices. 🔒

2/ The Architecture:
- Local micro-batching audio streams
- Sub-25ms inference latency
- PII Firewall proxying to Gemini for advanced cognitive maps.

No cloud, no trackers, absolute privacy.

3/ Test our security sandbox, local sync ledger, and playground now. We need systems and ML developers to break our sub-25ms pipeline and give us raw, unfiltered feedback. 👇 [Link]`;
      }
      setGeneratedPost(fallbackText);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] text-[9px] font-mono font-bold uppercase tracking-widest">
              Launch Intelligence Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-widest">
              Anti-Slop Pro Edition
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">
            GTM & <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">Launch Playbook</span>
          </h2>
          <p className="text-slate-400 font-sans text-sm mt-1 max-w-2xl">
            Séparez le mythe des vidéos YouTube "devenir millionnaire" de la réalité froide des lancements de produits tech d'élite.
            Planifiez, testez vos titres HN et générez des scripts authentiques pour hacker votre distribution.
          </p>
        </div>

        <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('strategies')}
            className={`px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'strategies' ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'text-slate-400 hover:text-white'}`}
          >
            Playbook Élite
          </button>
          <button
            onClick={() => setActiveTab('hn-tester')}
            className={`px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'hn-tester' ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'text-slate-400 hover:text-white'}`}
          >
            HN Title Tester
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'generator' ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'text-slate-400 hover:text-white'}`}
          >
            Script Writer
          </button>
          <button
            onClick={() => setActiveTab('monetization')}
            className={`px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'monetization' ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'text-slate-400 hover:text-white'}`}
          >
            Monétisation & Scale
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      
      {/* TAB 1: ELITE STRATEGIES */}
      {activeTab === 'strategies' && (
        <div className="space-y-8">
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex items-center gap-3.5 border-b border-slate-800/60 pb-5 mb-6">
              <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                <Flame className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Le Mensonge des Vidéos "Millionnaire IA"</h3>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
                  Pourquoi 99% du contenu de "Side Hustle" est une arnaque intellectuelle
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-400 leading-relaxed">
              <div className="space-y-4">
                <p>
                  Tu as sûrement vu ces vidéos TikTok ou YouTube qui promettent de <strong className="text-white">gagner 10 000 $/mois</strong> en vendant du contenu généré par IA, en spammant des blogs de niche ou en créant des applications de re-branding d'API OpenAI sans valeur ajoutée. 
                </p>
                <p>
                  Ces méthodes ont un taux d'échec de <strong className="text-red-400 font-bold">99.9%</strong>. Pourquoi ? Parce qu'elles ne construisent aucun <strong className="text-white font-mono">"Moat"</strong> (avantage concurrentiel défendable). Si tout le monde peut copier une idée en un clic de prompt, sa valeur économique tombe à zéro instantanément.
                </p>
              </div>
              <div className="space-y-4 border-l border-slate-800 pl-0 md:pl-6">
                <p>
                  La vraie richesse en IA s'acquiert par l'association d'une <strong className="text-white">prouesse technique difficile à répliquer</strong> (ex: l'inférence locale asynchrone Gemma 4 sous les 25ms, ce que tu codes !) et d'une <strong className="text-emerald-400 font-bold">distribution organique ciblée</strong>.
                </p>
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-emerald-400 font-bold uppercase tracking-wider">La Formule Élite :</div>
                  <div>Moat Technique (Edge / Privacy) + Distribution Organique Pro = Croissance Réelle.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Hacker News Section */}
            <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-3xl space-y-5 hover:border-orange-500/20 hover:bg-slate-900/30 transition-all duration-300">
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-mono font-bold text-orange-500 text-lg">Y</div>
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-wide">Hacker News Show HN</h4>
                    <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest">Le Graal des Devs</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500">Vol : Extrême</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span><strong>Pas de baratin :</strong> HN bannit les adjectifs promotionnels. Présentez des faits bruts, l'architecture et les choix techniques complexes.</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span><strong>Le premier commentaire :</strong> Écrivez un essai honnête. Pourquoi avez-vous construit cela ? Quels ont été les verrous techniques ?</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span><strong>L'effet levier :</strong> Un top 3 sur HN apporte entre 10k et 100k développeurs sur votre site en 24h, ouvrant la voie à des VC ou contributeurs.</span>
                </li>
              </ul>
            </div>

            {/* Product Hunt Section - Restricted 16+ Pivot */}
            <div className="bg-slate-900/10 border border-red-950/40 p-6 rounded-3xl space-y-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-2.5 py-1 bg-red-500/10 border-b border-l border-red-500/30 rounded-bl-xl text-[8px] font-mono font-bold text-red-400 uppercase tracking-widest z-10">
                ⚠️ Bloqué — 16 ans minimum
              </div>
              
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-center grayscale">
                    <Rocket className="w-5 h-5 text-red-500/60" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 tracking-wide">Product Hunt Launch</h4>
                    <span className="text-[10px] font-mono text-red-500/60 uppercase tracking-widest">Growth Hacking PLG</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-red-500/50">Inadapté (13 ans)</span>
              </div>
              
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-[11px] text-red-300 leading-relaxed font-sans">
                <strong className="text-red-400 uppercase tracking-wide block mb-1">Règle de Compliance & Stratégie :</strong>
                Les CGU de Product Hunt imposent un âge minimum de <strong>16 ans</strong>. Tenter d'y lancer Mount AI Scholar à 13 ans est un risque d'exclusion inutile pour votre IP. 
                <span className="block mt-1 text-slate-400"><strong>La bonne nouvelle ?</strong> PH est saturé de marketing "slop". Votre profil d'ingénieur d'exception s'épanouira bien plus sur <strong>Hacker News</strong>.</span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-500 leading-relaxed opacity-60">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <span><strong>Plan de secours :</strong> Conservez ce canal pour l'horizon 2029 ou laissez un membre de votre board de plus de 16 ans s'occuper de soumettre le produit en son nom si nécessaire.</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <span><strong>Focus Absolu :</strong> Redirigez 100 % de votre énergie de distribution organique vers <strong>Hacker News (Show HN)</strong> et <strong>GitHub</strong>.</span>
                </li>
              </ul>
            </div>

            {/* Devpost Hackathons */}
            <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-3xl space-y-5 hover:border-blue-500/20 hover:bg-slate-900/30 transition-all duration-300">
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-wide">Devpost & Global Grants</h4>
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">L'or des Hackathons</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500">Vol : Élevé</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>La Vidéo de 2 minutes :</strong> C'est 80% du vote du jury. Accrochez-les dans les 10 premières secondes avec le problème concret.</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Défiez la complexité :</strong> Expliquez clairement vos optimisations (Gemma 4 quantisé localement, bridging FastAPI-Vite). Le jury doit voir l'effort d'ingénierie brute.</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Récit Narratif :</strong> Un élève marocain de 13 ans résolvant l'accessibilité cognitive locale est une histoire extraordinaire de mérite technologique pur.</span>
                </li>
              </ul>
            </div>

            {/* Open Source Loop */}
            <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-3xl space-y-5 hover:border-emerald-500/20 hover:bg-slate-900/30 transition-all duration-300">
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-wide">Open Source Viral Loop</h4>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">GitHub Star Farming</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500">Vol : Constant</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>README.md Spectaculaire :</strong> Ajoutez des démos interactives, des schémas Mermaid et un guide d'installation en une ligne ("one-liner installation").</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Libérez la base :</strong> Donnez gratuitement le noyau de votre modèle. Les écoles et les dev de la terre entière l'intégreront, créant un réseau mondial infatigable.</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Ecosystem-led growth :</strong> Votre projet open-source devient la référence mondiale de l'EdTech pour dyslexiques, forçant les GAFAM à repérer votre profil.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: HN TITLE TESTER */}
      {activeTab === 'hn-tester' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-5">
              <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Simulateur de Titre Hacker News</h3>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
                  Passez les filtres anti-spam algorithmiques et captez l'attention des ingénieurs d'élite
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                Saisissez le Titre Proposé pour votre Post HN :
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={hnTitleInput}
                  onChange={(e) => setHnTitleInput(e.target.value)}
                  placeholder="Ex: Show HN: Mount AI Scholar – A local-first, zero-latency speech model for dyslexia"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-violet-500 font-mono transition-colors"
                />
                <button
                  onClick={handleAnalyzeHN}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] shrink-0"
                >
                  Analyser le Titre
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono italic">
                Règle HN : Racontez ce que fait votre produit simplement, sans hype ni superlatifs extravagants.
              </p>
            </div>

            {/* Results Display */}
            {testerResult && (
              <div className="p-6 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Statut de la stratégie</span>
                    <h4 className={`text-sm font-black tracking-widest ${testerResult.ratingColor} uppercase`}>
                      {testerResult.rating}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Hacker Score</span>
                      <span className="text-xl font-mono font-black text-white">{testerResult.score} / 100</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center relative">
                      <div 
                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" 
                        style={{ animationDuration: '3s' }}
                      />
                      <span className="text-xs font-mono text-orange-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Positive Points */}
                  <div className="space-y-3.5">
                    <h5 className="font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Points Forts :
                    </h5>
                    {testerResult.positives.length > 0 ? (
                      <ul className="space-y-2.5 text-slate-400">
                        {testerResult.positives.map((pos: string, i: number) => (
                          <li key={i} className="flex gap-2 items-start">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{pos}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">Aucun point fort critique détecté.</p>
                    )}
                  </div>

                  {/* Warning Points */}
                  <div className="space-y-3.5 md:border-l md:border-slate-800 md:pl-6">
                    <h5 className="font-mono text-orange-400 uppercase tracking-wider font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Recommandations :
                    </h5>
                    {testerResult.warnings.length > 0 ? (
                      <ul className="space-y-2.5 text-slate-400">
                        {testerResult.warnings.map((warn: string, i: number) => (
                          <li key={i} className="flex gap-2 items-start">
                            <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                            <span>{warn}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold">Incroyable ! Titre parfait pour HN. Lancez-vous !</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCRIPT WRITER */}
      {activeTab === 'generator' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Column */}
            <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Configurateur de Pitch
              </h3>
              
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-2">
                  <label className="text-slate-400 uppercase tracking-wider block font-bold">Nom du Produit :</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 uppercase tracking-wider block font-bold">USP Technique :</label>
                  <textarea
                    rows={4}
                    value={prodUsp}
                    onChange={(e) => setProdUsp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 uppercase tracking-wider block font-bold">Canal Cible :</label>
                  <select
                    value={launchTarget}
                    onChange={(e) => setLaunchTarget(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 font-mono"
                  >
                    <option value="hn">Hacker News comment (Why I built this)</option>
                    <option value="ph">Product Hunt (First Maker Comment)</option>
                    <option value="devpost">Devpost (Hackathon submission description)</option>
                    <option value="twitter">X/Twitter Launch Thread</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 uppercase tracking-wider block font-bold">Style de Communication :</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setLaunchTone('humble')}
                      className={`py-2 px-1 text-center rounded-lg border font-bold text-[9px] transition-all ${launchTone === 'humble' ? 'bg-violet-500/10 border-violet-500 text-violet-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      Humble Tech
                    </button>
                    <button
                      onClick={() => setLaunchTone('deeptech')}
                      className={`py-2 px-1 text-center rounded-lg border font-bold text-[9px] transition-all ${launchTone === 'deeptech' ? 'bg-violet-500/10 border-violet-500 text-violet-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      Deep-Tech
                    </button>
                    <button
                      onClick={() => setLaunchTone('bold')}
                      className={`py-2 px-1 text-center rounded-lg border font-bold text-[9px] transition-all ${launchTone === 'bold' ? 'bg-violet-500/10 border-violet-500 text-violet-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      Bold Vision
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePost}
                  disabled={isGenerating}
                  className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex justify-center items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer le Script
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Column */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-[450px]">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                      Script de Lancement Résultant (Anglais Impératif)
                    </span>
                  </div>
                  {generatedPost && (
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copier
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 p-6 overflow-y-auto max-h-[400px]">
                  {generatedPost ? (
                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed font-sans select-text">
                      {generatedPost}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3 py-12">
                      <Terminal className="w-10 h-10 opacity-30 animate-pulse" />
                      <p className="text-xs font-mono uppercase tracking-wider">
                        Configurez le pitch à gauche et lancez la compilation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: REAL MONETIZATION & SCALE */}
      {activeTab === 'monetization' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3.5 border-b border-slate-800/60 pb-5">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Coins className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Le Vrai Pipeline Financier de l'IA</h3>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
                  Comment capitaliser sur un projet deep-tech d'accessibilité à 13 ans
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Financial Pillar 1 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                  <Award className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="font-bold text-white text-base">1. Hackathons & Bourses</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Le moyen le plus rapide d'acquérir du capital initial (<strong className="text-white">10 000 $ à 50 000 $</strong>) sans céder de parts de votre startup :
                </p>
                <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 font-sans">
                  <li><strong>Gemini Developer Competition :</strong> Prix allant jusqu'à 1 million de dollars pour les applications utilisant intelligemment l'API Gemini.</li>
                  <li><strong>Hugging Face Grants :</strong> GPU gratuits et bourses pour les modèles d'inférence edge open-source.</li>
                  <li><strong>Imagine Cup Junior :</strong> Le concours mondial de Microsoft valorisant l'IA pour le bien social.</li>
                </ul>
              </div>

              {/* Financial Pillar 2 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="font-bold text-white text-base">2. Product-Led Growth</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transformer Mount AI Scholar en un moteur commercial récurrent (SaaS modèle hybride) :
                </p>
                <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 font-sans">
                  <li><strong>B2C Local Gratuit :</strong> Inférence vocale 100% gratuite et locale pour les familles pour asseoir la réputation de marque.</li>
                  <li><strong>B2B School Subscriptions :</strong> Dashboard cloud (Firebase) pour enseignants permettant de suivre l'évolution cognitive de 30 élèves en temps réel (Abonnement récurrent mensuel).</li>
                  <li><strong>API Licensing :</strong> Licencier le moteur de détection phonémique ultra-rapide à d'autres éditeurs EdTech.</li>
                </ul>
              </div>

              {/* Financial Pillar 3 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="font-bold text-white text-base">3. Pré-Seed & VC Elite</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attirer l'élite de la Silicon Valley grâce à un standard technique hors normes :
                </p>
                <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 font-sans">
                  <li><strong>Y Combinator / HF0 :</strong> Les incubateurs d'élite adorent les profils "Outlier". Un ingénieur de 13/14 ans avec un produit complet en production est un aimant à VC.</li>
                  <li><strong>AI Grant :</strong> Le fonds d'investissement de Nat Friedman (ex-CEO de GitHub) finançant les développeurs d'IA open-source à hauteur de 250k$.</li>
                  <li><strong>L'objectif :</strong> Pas besoin d'être aux USA pour lever des fonds. Le Stealth mode avec démo irréprochable fait sauter les frontières.</li>
                </ul>
              </div>

            </div>

            <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
              <div className="p-2.5 bg-violet-500/20 rounded-xl shrink-0">
                <Cpu className="w-6 h-6 text-violet-400" />
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-sans text-center sm:text-left">
                <span className="font-bold text-white uppercase tracking-wider block mb-1">Rappel du Coach Senior :</span>
                Ne perdez pas votre temps à chercher des gains faciles et éphémères de 5 $ par-ci par-là. Bâtissez un Moat technique béton (votre moteur d'inférence locale asynchrone pour la dyslexie) et servez-vous de ces stratégies de distribution pour forcer la porte de la Silicon Valley. C'est là que se trouvent les millions réels et durables.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
