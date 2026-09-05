import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Eye, 
  GraduationCap, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Globe, 
  Lock, 
  Smartphone, 
  Laptop, 
  BookOpen, 
  Activity,
  Award,
  ChevronRight,
  ChevronDown,
  HandMetal,
  HelpCircle,
  WifiOff,
  Database,
  FileCheck,
  Clock
} from 'lucide-react';
import { isGuestLockedOut, getGuestLockoutRemainingMs, formatRemainingTime } from '../utils/guestManager';

import scholarIcon from '../assets/images/mount_ai_logo_1785927100930.jpg';
import desktopHubImg from '../assets/images/scholar_desktop_hub_1787943389838.jpg';
import desktopTutorImg from '../assets/images/scholar_desktop_tutor_1787943417933.jpg';
import mobileAppImg from '../assets/images/scholar_mobile_app_1787943402811.jpg';
import neuralArchImg from '../assets/images/pomelli_neural_architecture.png';

interface AppPresentationLandingProps {
  onGoToLogin: () => void;
  onDirectGuest?: () => void;
  onEnterApp?: () => void;
  isLoggedIn?: boolean;
}

export const AppPresentationLanding: React.FC<AppPresentationLandingProps> = ({ 
  onGoToLogin,
  onDirectGuest,
  onEnterApp,
  isLoggedIn = false
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'tutor' | 'mobile' | 'neural'>('hub');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [guestLocked, setGuestLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState("");

  useEffect(() => {
    const checkStatus = () => {
      const locked = isGuestLockedOut();
      setGuestLocked(locked);
      if (locked) {
        setLockoutCountdown(formatRemainingTime(getGuestLockoutRemainingMs()));
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const screenshots = [
    {
      id: 'hub',
      label: 'Central Hub & Dashboard',
      subtitle: 'Unified control across all learning modules',
      image: desktopHubImg,
      badge: 'Control Room',
      description: 'Access the complete suite at a glance: Phonetic Predictor, Interactive Tutor, SL2T Sign Language, and Classroom integration.'
    },
    {
      id: 'tutor',
      label: 'Cognitive Tutor & Dyslexia',
      subtitle: 'Real-time phoneme-grapheme realignment',
      image: desktopTutorImg,
      badge: 'Edge AI & Phonetics',
      description: 'Bionic accessibility tools, dynamic character spacing, visual letter mirror correction (b/d/p/q), and speech synthesis.'
    },
    {
      id: 'mobile',
      label: 'Mobile Interface & PWA',
      subtitle: 'Engineered for Chromebooks, tablets & smartphones',
      image: mobileAppImg,
      badge: 'ChromeOS & Android',
      description: 'Industrial-grade ultra-lightweight PWA optimized for school environments with comprehensive offline support.'
    },
    {
      id: 'neural',
      label: 'Local Neural Architecture',
      subtitle: 'Privacy by Design & On-Device Processing',
      image: neuralArchImg,
      badge: 'Zero-Latency Inference',
      description: 'Local ML pipeline ensuring absolute privacy for student data and instant responsiveness with zero cloud dependency.'
    }
  ];

  const currentScreenshot = screenshots.find(s => s.id === activeTab) || screenshots[0];

  const features = [
    {
      icon: Cpu,
      title: 'Local Zero-Latency Engine',
      desc: 'On-device inference powered by WebAssembly & Edge AI. Absolute privacy by design with no student data leaks.',
      color: 'from-blue-500 to-indigo-600',
      tag: 'Edge Computing'
    },
    {
      icon: Eye,
      title: 'Advanced Dyslexia Accessibility',
      desc: 'Bionic reading, phonological color coding, saccadic visual pacing guides, and letter inversion neutralization.',
      color: 'from-amber-500 to-orange-600',
      tag: 'Cognitive Aid'
    },
    {
      icon: HandMetal,
      title: 'SL2T - Sign Language Translation',
      desc: 'Real-time gesture recognition powered by computer vision (MediaPipe Vision AI) for deaf and hard-of-hearing inclusion.',
      color: 'from-purple-500 to-pink-600',
      tag: 'Computer Vision'
    },
    {
      icon: GraduationCap,
      title: 'Google Workspace & Classroom',
      desc: 'Native connectors to import homework, export structured lecture summaries to Google Docs, and synchronize learning roadmaps.',
      color: 'from-emerald-500 to-teal-600',
      tag: 'EdTech Bridge'
    }
  ];

  const faqItems = [
    {
      question: "How is student data privacy guaranteed (Privacy by Design)?",
      answer: "The application operates on an 'Edge-First' architecture. Analyzed text, phonological corrections, and learning exercises are processed directly on your local device via WebAssembly and Edge AI. No student data, uploaded PDF documents, or transcripts are ever used to train public AI models.",
      icon: Lock,
      badge: "100% Sovereign Privacy"
    },
    {
      question: "How does the Offline Mode (Offline & PWA) work?",
      answer: "Thanks to our industrial Service Worker and local IndexedDB database, all cognitive accessibility modules, phonetic rules, bionic reading models, and saved study materials remain fully operational without an internet connection. Once reconnected, data syncs smoothly.",
      icon: WifiOff,
      badge: "Zero Network Dependency"
    },
    {
      question: "What is Zero-Latency Neural Inference?",
      answer: "Unlike traditional platforms that route every keystroke to remote servers resulting in seconds of latency, Mount AI Scholar's local engine computes phonemic and saccadic segmentations in under 15 milliseconds for seamless visual comfort.",
      icon: Zap,
      badge: "Under 15ms"
    },
    {
      question: "Which devices and operating systems are supported?",
      answer: "The application is certified as an industrial-grade Progressive Web App (PWA). It is fully optimized for Google Chrome, Chromebooks (ChromeOS), Android tablets, iPadOS, and desktop operating systems (Windows, macOS, Linux).",
      icon: Laptop,
      badge: "Cross-Platform"
    },
    {
      question: "How does the app integrate with Google Classroom and Docs?",
      answer: "With built-in Google Workspace for Education connectors, you can import classroom assignments with one click, enhance them with cognitive filters (OpenDyslexic, syllable spacing), and export structured revision summaries directly to Google Docs.",
      icon: GraduationCap,
      badge: "Google Workspace Ready"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500/30 relative overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-blue-600/15 blur-[160px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-orange-600/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 blur-[160px] rounded-full mix-blend-screen" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.3)] overflow-hidden flex items-center justify-center">
            <img src={scholarIcon} alt="Mount AI Scholar" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-lg text-white">Mount AI: <span className="text-orange-500">Scholar</span></span>
              <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-mono font-bold rounded uppercase tracking-wider hidden sm:inline-block">Stealth EdTech</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Cognitive Learning Suite & On-Device AI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn && onEnterApp ? (
            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(249,115,22,0.4)] transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Accéder au Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              {onDirectGuest && (
                <button
                  onClick={guestLocked ? onGoToLogin : onDirectGuest}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition ${
                    guestLocked 
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/40' 
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                  title={guestLocked ? `Guest Mode locked for 24h (${lockoutCountdown})` : 'Guest Access 30 minutes'}
                >
                  {guestLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Guest Locked ({lockoutCountdown})</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Mode Invité (30 min)</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onGoToLogin}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(249,115,22,0.4)] transition hover:scale-105 active:scale-95"
              >
                <span>Connexion Google</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 border border-orange-500/30 rounded-full mb-6 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
          <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
          <span className="text-xs font-bold font-mono text-orange-300 uppercase tracking-widest">Next-Generation Cognitive Accessibility Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.15] uppercase drop-shadow-2xl">
          On-Device Artificial Intelligence Powering <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-blue-400 bg-clip-text text-transparent">Inclusive Learning</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl font-medium leading-relaxed">
          <strong className="text-white">Mount AI Scholar</strong> transforms reading, study revision, and cognitive accessibility (Dyslexia, Deafness, ADHD) with an embedded, lightning-fast, and secure neural engine.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {isLoggedIn && onEnterApp ? (
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-4.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-[0_15px_35px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 text-sm uppercase tracking-widest group cursor-pointer"
            >
              <span>Ouvrir le Hub & Dashboard</span>
              <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <>
              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-8 py-4.5 bg-gradient-to-r from-white via-slate-100 to-slate-200 hover:from-white hover:to-white text-slate-950 font-black rounded-2xl shadow-[0_15px_35px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 text-sm uppercase tracking-widest group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Lancer l'Application (Google Login)</span>
                <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
              </button>

              {onDirectGuest && (
                <button
                  onClick={guestLocked ? onGoToLogin : onDirectGuest}
                  className={`w-full sm:w-auto px-6 py-4.5 border text-slate-200 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-wider ${
                    guestLocked
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-900/40'
                      : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 hover:border-orange-500/50'
                  }`}
                >
                  {guestLocked ? (
                    <>
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>Mode Invité Verrouillé 24h ({lockoutCountdown})</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Mode Invité Démo (30 min)</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Security & Standard Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>100% Privacy by Design</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Zero-Latency On-Device</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Google Classroom Ready</span>
          </div>
        </div>
      </section>

      {/* Interactive Showcase & Screenshots Tabs */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest">Interface & Architecture</span>
              <h2 className="text-2xl font-black text-white tracking-tight">Explore Mount AI Scholar Workspaces</h2>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
              {screenshots.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id as any)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    activeTab === s.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{s.label.split('&')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Display Frame */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Frame */}
            <div className="lg:col-span-8 relative group rounded-2xl overflow-hidden border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-slate-950">
              <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-orange-300 uppercase tracking-wider">{currentScreenshot.badge}</span>
              </div>
              <img
                src={currentScreenshot.image}
                alt={currentScreenshot.label}
                className="w-full h-auto max-h-[480px] object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>

            {/* Details & CTA Column */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-5">
              <div className="p-2 w-fit rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">{currentScreenshot.label}</h3>
              <p className="text-xs font-mono text-orange-400/90 uppercase tracking-wider">{currentScreenshot.subtitle}</p>
              <p className="text-sm text-slate-300 leading-relaxed">{currentScreenshot.description}</p>

              <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3">
                <button
                  onClick={onGoToLogin}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                >
                  <span>Access This Module</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-500 font-mono text-center">Secure authentication via Google Account</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="text-center mb-10">
          <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">Technologies & Capabilities</span>
          <h2 className="text-3xl font-black text-white tracking-tight mt-1">Engineered for Academic & Inclusive Excellence</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/90 hover:border-slate-700 transition-all backdrop-blur-md relative overflow-hidden group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-xl bg-gradient-to-br ${feat.color} text-white shadow-lg shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{feat.title}</h3>
                      <span className="text-[9px] font-mono text-slate-400 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">{feat.tag}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-2">{feat.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic FAQ Accordion Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-mono font-bold text-blue-300 uppercase tracking-widest">Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">FAQ & Security Standards</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Discover how we protect student data and ensure reliable, zero-latency accessibility both online and offline.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((faq, index) => {
            const Icon = faq.icon;
            const isOpen = openFaqIndex === index;

            return (
              <div 
                key={index}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-slate-900/90 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 md:p-6 text-left flex items-center justify-between gap-4 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      isOpen ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-base md:text-lg font-bold transition-colors ${
                        isOpen ? 'text-orange-400' : 'text-white'
                      }`}>
                        {faq.question}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {faq.badge}
                      </span>
                    </div>
                  </div>

                  <div className={`p-2 rounded-full border transition-transform duration-300 ${
                    isOpen 
                      ? 'rotate-180 bg-orange-500/20 border-orange-500/40 text-orange-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 md:px-6 pb-6 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Founder Section - Exactly 2 sentences */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-500/30 backdrop-blur-xl relative overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.1)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-widest">Founder's Vision & System Architecture</span>
          </div>
          <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
            Engineered and architected by a 13-year-old tech prodigy certified by premier global AI programs and invited speaker at Devoxx Morocco, Mount AI Scholar embodies the new frontier of zero-latency cognitive accessibility. Its Edge-First architecture was forged to redefine global inclusive education by fusing local neural inference, uncompromised data privacy, and native bridges into leading learning tools.
          </p>
        </div>
      </section>

      {/* Final Bottom Banner / Launch App */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-20 text-center">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
            <img src={scholarIcon} alt="Mount AI" className="w-12 h-12 object-cover rounded-xl" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            Ready to explore <span className="text-orange-400">Mount AI Scholar</span> ?
          </h2>
          <p className="mt-3 text-slate-300 text-sm md:text-base max-w-xl">
            Sign in with your Google account to access the complete Hub, personalized study workspaces, and the cognitive learning arena.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 px-4 md:px-8 py-6 text-center text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>MOUNT AI SCHOLAR • STEALTH COGNITIVE PLATFORM • POWERED BY ON-DEVICE NEURAL NETWORKS</p>
          <p className="text-slate-400 font-medium">Créé par <strong className="text-orange-400 font-bold uppercase tracking-wider">Taha Dev Junior</strong></p>
        </div>
      </footer>
    </div>
  );
};

export default AppPresentationLanding;
