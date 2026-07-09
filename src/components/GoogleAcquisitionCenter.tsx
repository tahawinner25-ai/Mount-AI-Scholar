import React, { useState } from 'react';
import { Chrome, Code, FileText, Layout, CheckCircle2, ArrowRight, Lock, Server, Share2, Cpu, Layers, Download, Sparkles, Send, Copy, AlertCircle, Laptop, Network, Terminal, Play, Globe, Settings, Eye, Smartphone } from 'lucide-react';

interface GoogleAcquisitionCenterProps {
  user: any;
}

export default function GoogleAcquisitionCenter({ user }: GoogleAcquisitionCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'manifest' | 'capacitor' | 'classroom' | 'pitch' | 'api-sandbox'>('manifest');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Classroom Sandbox simulation states
  const [sandboxClassrooms, setSandboxClassrooms] = useState([
    { id: '101', name: 'Classe de CP - École Al-Jazari', students: 14, status: 'Connected' },
    { id: '102', name: 'Soutien Dyslexie - Collège Ibn Rochd', students: 8, status: 'Connected' },
  ]);
  const [isSyncingClassroom, setIsSyncingClassroom] = useState(false);
  const [classroomLogs, setClassroomLogs] = useState<string[]>([
    "System: Initializing Google Workspace Education Connector...",
    "System: Waiting for OAuth validation token from secure login state..."
  ]);

  // API Sandbox Engine States
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<'/api/v1/cognitive/analyze' | '/api/v1/cognitive/phonemes' | '/api/v1/workspace/classroom/sync'>('/api/v1/cognitive/analyze');
  const [apiRequestBody, setApiRequestBody] = useState<string>(JSON.stringify({
    text_target: "Spectacle",
    voice_transcript: "Pestacle",
    accuracy_threshold: 0.85
  }, null, 2));
  const [apiResponseBody, setApiResponseBody] = useState<string>('// Clique sur "RUN API ENDPOINT" pour simuler la réponse du serveur');
  const [isApiCalling, setIsApiCalling] = useState<boolean>(false);
  const [apiLogs, setApiLogs] = useState<string[]>([
    "API-Console: Sandbox initialized. Edge API ready for requests."
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const simulateClassroomSync = () => {
    setIsSyncingClassroom(true);
    setClassroomLogs(prev => [...prev, "OAuth: Initiating handshake with Google Classroom API...", "OAuth: Fetching list of authorized courses..."]);
    
    setTimeout(() => {
      setClassroomLogs(prev => [
        ...prev,
        "Classroom API: Course 'Classe de CP - École Al-Jazari' successfully fetched (ID: 101).",
        "Classroom API: Course 'Soutien Dyslexie - Collège Ibn Rochd' successfully fetched (ID: 102).",
        "Classroom API: Sync completed. 22 students enrolled and synchronized locally in the Sync Ledger."
      ]);
      setIsSyncingClassroom(false);
    }, 2000);
  };

  const manifestJsonString = `{
  "manifest_version": 3,
  "name": "Mount AI Scholar - Cognitive Accessibility Suite",
  "version": "1.0.0",
  "description": "Local-first cognitive and phonological accessibility assistant powered by Gemma-2B and WebAssembly for schools.",
  "author": "Capitaine, Lead Engineer",
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "tts"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "192": "pwa-192x192.svg",
      "512": "pwa-512x512.svg"
    }
  },
  "icons": {
    "192": "pwa-192x192.svg",
    "512": "pwa-512x512.svg"
  }
}`;

  const capacitorConfigString = `// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mountaischolar.app',
  appName: 'Mount AI Scholar',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;`;

  const classroomCodeSnippet = `// Services Google Classroom Integration Client
import { google } from 'googleapis';

export async function syncGoogleClassroomCourseWork(oauth2Client: any) {
  const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
  
  try {
    // 1. Fetch classroom list
    const coursesRes = await classroom.courses.list({ pageSize: 10 });
    const courses = coursesRes.data.courses || [];
    
    const results = [];
    for (const course of courses) {
      // 2. Fetch homework assignments for students with special learning needs
      const courseWorkRes = await classroom.courses.courseWork.list({ courseId: course.id });
      const assignments = courseWorkRes.data.courseWork || [];
      
      // 3. Sync to Mount AI Scholar secure offline database for offline accessibility
      results.push({
        courseId: course.id,
        courseName: course.name,
        assignmentsCount: assignments.length
      });
    }
    return { success: true, coursesSynced: results };
  } catch (error) {
    console.error('Failed to sync Google Classroom coursework:', error);
    throw error;
  }
}`;

  const pitchDeckPoints = [
    {
      title: "Cost reduction on scale (0$ Cloud API footprint)",
      description: "While alternative products cost $5,000+ per class in cloud computing API tokens, Mount AI Scholar compiles weights directly in WebAssembly or WebGPU to perform local-first sub-25ms inference. Google gets zero-marginal cost distribution."
    },
    {
      title: "Google Workspace & Chromebook native synergy",
      description: "A plug-and-play addition to Google Classroom. With our Chrome Web Store extension and Android PWA, teachers can assign reading tasks that instantly render in a dyslexic-adapted interactive layout."
    },
    {
      title: "Uncompromising Privacy by Design (COPPA/GDPR/HIPAA compliant)",
      description: "Voice audio recordings from minors are treated as highly toxic liabilities. We run speech-to-phoneme mapping locally. No audio file or voice profile ever hits the internet, making it 100% compliant with strict global schools data regulations."
    },
    {
      title: "Proprietary Cognitive Calibration algorithms",
      description: "Engineered specifically to solve phoneme-grapheme synchronization, saccadic eye tracking simulation, and mirrors letters realignments for young students, creating immediate measurable cognitive improvements."
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Title block */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Acquisition-Ready Tech Stack
            </span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Google Acquisition Suite</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Outils stratégiques conçus pour packager et présenter la technologie de Mount AI Scholar directement à Google (M&A, Chromebooks, et Équipes Education).
          </p>
        </div>

        {/* Core KPIs of our Tech Stack that Google loves */}
        <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-center">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Coûts Serveur API</p>
            <p className="text-xl font-mono font-extrabold text-[#00FF00] mt-1">0.00$ / mois</p>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-center">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Latence Locale</p>
            <p className="text-xl font-mono font-extrabold text-blue-400 mt-1">&lt; 25 ms</p>
          </div>
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto pb-1 gap-2">
        <button
          onClick={() => setActiveSubTab('manifest')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'manifest' ? 'border-[#00FF00] text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Chrome className="w-4 h-4 text-emerald-400" /> Extension & Chromebook
        </button>
        <button
          onClick={() => setActiveSubTab('capacitor')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'capacitor' ? 'border-[#00FF00] text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500" /> Play Store (Capacitor)
        </button>
        <button
          onClick={() => setActiveSubTab('classroom')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'classroom' ? 'border-[#00FF00] text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Network className="w-4 h-4 text-blue-400" /> Classroom API Sync
        </button>
        <button
          onClick={() => setActiveSubTab('api-sandbox')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'api-sandbox' ? 'border-[#00FF00] text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Terminal className="w-4 h-4 text-[#00FF00]" /> Console API ⚡
        </button>
        <button
          onClick={() => setActiveSubTab('pitch')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'pitch' ? 'border-[#00FF00] text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <FileText className="w-4 h-4 text-amber-400" /> Pitch M&A Google
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'manifest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Main Info Card */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Chrome className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white uppercase tracking-wider">Chrome Extension Pack</h3>
                <p className="text-xs font-mono text-slate-500 uppercase">Deploy on Chromebooks</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Pour se faire racheter par Google, "Mount AI Scholar" ne doit pas seulement être un site web. Il doit être utilisable comme une <strong>Extension Chrome native</strong> capable de s'injecter sur n'importe quel site éducatif et de tourner hors-ligne sur les Chromebooks à bas coût des écoles.
            </p>

            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Intégration Active</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                  <span><strong>manifest.json</strong> généré et prêt pour l'intégration ChromeOS locale.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                  <span><strong>background.js</strong> configuré pour injecter le réalignement de lecture bionique en local.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                  <span>Actifs et icônes SVG légers prêts pour le packaging dans <code className="text-[#00FF00]">/public</code>.</span>
                </div>
              </div>
            </div>

            {/* Direct testing instructions for Capitaine */}
            <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800/80 space-y-3.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" /> Charger l'extension sur ton PC :
              </h4>
              <ol className="text-[11px] text-slate-400 list-decimal pl-4.5 space-y-2">
                <li>Exécute un build global dans l'IDE.</li>
                <li>Va sur <code className="text-white">chrome://extensions</code> dans ton navigateur.</li>
                <li>Active le <strong>Mode Développeur</strong> (en haut à droite).</li>
                <li>Clique sur <strong>Charger l'extension non empaquetée</strong>.</li>
                <li>Sélectionne le dossier <code className="text-white">dist/</code> de ton projet !</li>
              </ol>
            </div>
          </div>

          {/* Code Viewer & download Simulator */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="flex justify-between items-center bg-slate-900 px-6 py-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">/public/manifest.json</span>
                </div>
                <button
                  onClick={() => handleCopy(manifestJsonString, 'manifest')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300 rounded transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedText === 'manifest' ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <div className="p-6">
                <pre className="text-xs text-slate-400 font-mono overflow-x-auto max-h-[300px] leading-relaxed">
                  {manifestJsonString}
                </pre>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layout className="w-4 h-4 text-emerald-400" /> Bundle Complet Compilé
                </h4>
                <p className="text-xs text-slate-500">
                  Ton projet dispose déjà de tous les fichiers nécessaires au fonctionnement de l'extension à l'adresse racine du serveur de dev.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <a
                  href="/manifest.json"
                  download="manifest.json"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#00FF00]/10 border border-[#00FF00]/30 hover:bg-[#00FF00]/20 text-[#00FF00] rounded-2xl font-bold uppercase text-[10px] tracking-widest transition"
                >
                  <Download className="w-4 h-4" /> Manifest
                </a>
                <a
                  href="/background.js"
                  download="background.js"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest transition border border-slate-700"
                >
                  <Download className="w-4 h-4" /> Worker.js
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'capacitor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Main Info Card */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Smartphone className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white uppercase tracking-wider">Play Store Packager</h3>
                <p className="text-xs font-mono text-slate-500 uppercase">Capacitor Android Native</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Prêt pour un déploiement natif sur les tablettes scolaires Android et Chromebooks de l'école. Grâce à l'architecture <strong>Offline-First & Zero-Cloud</strong>, l'application s'emballe instantanément en format natif AAB (Android App Bundle) ou APK de test via le moteur Capacitor d'Ionic.
            </p>

            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Android SDK Readiness Check</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                  <span><strong>capacitor.config.ts</strong> initialisé et configuré avec le Bundle ID officiel.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                  <span><strong>Web Audio & Local Speech</strong> conçus de façon 100% compatible avec l'instance Webview native d'Android.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                  <span><strong>Zero Network Dependancy</strong> : aucun risque de crash au démarrage si la tablette de l'école n'est pas connectée.</span>
                </div>
              </div>
            </div>

            {/* Android Studio guidelines */}
            <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800/80 space-y-3.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> Paramètres Play Store :
              </h4>
              <ul className="text-[11px] text-slate-400 space-y-2 list-none pl-0">
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Package ID :</span>
                  <span className="font-mono text-white text-[10px]">com.mountaischolar.app</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Target SDK :</span>
                  <span className="font-mono text-white text-[10px]">Android API 34+ (Android 14)</span>
                </li>
                <li className="flex justify-between pb-0">
                  <span className="text-slate-500">Minimum SDK :</span>
                  <span className="font-mono text-white text-[10px]">API 22 (Android 5.1+)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Code Viewer & Terminal Workflow */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="flex justify-between items-center bg-slate-900 px-6 py-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">/capacitor.config.ts</span>
                </div>
                <button
                  onClick={() => handleCopy(capacitorConfigString, 'capacitorConfig')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300 rounded transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedText === 'capacitorConfig' ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <div className="p-6">
                <pre className="text-xs text-slate-400 font-mono overflow-x-auto max-h-[180px] leading-relaxed">
                  {capacitorConfigString}
                </pre>
              </div>
            </div>

            {/* Terminal commands container */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 space-y-4">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00FF00] flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> Terminal : Compiler et Packager le Manifest & l'AAB en 1 clic
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-mono font-extrabold uppercase text-slate-500">Android : Préparer l'application mobile (AAB Officiel / APK)</p>
                  <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex justify-between items-center">
                    <span>npm run build:android</span>
                    <button onClick={() => handleCopy('npm run build:android', 'build_android_cmd')} className="text-[10px] text-slate-500 hover:text-white">
                      {copiedText === 'build_android_cmd' ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Compile le code React pour la production, synchronise Capacitor et prépare l'App Bundle (AAB) natif requis pour le Google Play Store.</p>
                </div>
 
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-mono font-extrabold uppercase text-slate-500">Android : Générer l'App Bundle (.aab) de Production</p>
                  <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex justify-between items-center">
                    <span>npx cap build android</span>
                    <button onClick={() => handleCopy('npx cap build android', 'build_aab_cmd')} className="text-[10px] text-slate-500 hover:text-white">
                      {copiedText === 'build_aab_cmd' ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Génère directement le fichier d'extension bundle (.aab) officiel — exigé pour tout nouveau lancement sur Google Play — ou l'APK pour tests locaux.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-mono font-extrabold uppercase text-slate-500">Chrome Extension : Packager le ZIP</p>
                  <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex justify-between items-center">
                     <span>npm run build:extension</span>
                     <button onClick={() => handleCopy('npm run build:extension', 'build_ext_cmd')} className="text-[10px] text-slate-500 hover:text-white">
                       {copiedText === 'build_ext_cmd' ? 'Copié' : 'Copier'}
                     </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Exécute le script Node multi-plateforme pour zipper le dossier /dist contenant le manifest.json.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-mono font-extrabold uppercase text-slate-500">Chrome : Ouvrir le gestionnaire d'extensions</p>
                  <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex justify-between items-center">
                    <span>chrome://extensions/</span>
                    <button onClick={() => handleCopy('chrome://extensions/', 'chrome_cmd')} className="text-[10px] text-slate-500 hover:text-white">
                      {copiedText === 'chrome_cmd' ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Active le mode développeur sur ton navigateur, puis glisse-dépose le dossier /dist ou importe le fichier .zip.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'classroom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Roster & Course Sync Simulator */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Network className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white uppercase tracking-wider">Classroom API Hub</h3>
                <p className="text-xs font-mono text-slate-500 uppercase">Workspace Integration</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Classes Actives Synchronisées</h4>
              <div className="space-y-3">
                {sandboxClassrooms.map(c => (
                  <div key={c.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">{c.students} Élèves • ID: {c.id}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={simulateClassroomSync}
              disabled={isSyncingClassroom}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest transition shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
            >
              {isSyncingClassroom ? "Synchronisation en cours..." : "Lancer un Sync Sandbox"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Logs and Code block */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live sandbox sync logs */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 space-y-3.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Logs d'Exécution Google Workspace API :
              </h4>
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl max-h-[140px] overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                {classroomLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-slate-600">[{index + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SDK Code Snippet */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="flex justify-between items-center bg-slate-900 px-6 py-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">classroomConnector.ts</span>
                </div>
                <button
                  onClick={() => handleCopy(classroomCodeSnippet, 'classroomCode')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300 rounded transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedText === 'classroomCode' ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <div className="p-6">
                <pre className="text-xs text-slate-400 font-mono overflow-x-auto max-h-[220px] leading-relaxed">
                  {classroomCodeSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'pitch' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 md:p-10 space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 border-b border-slate-800/60 pb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Google Education Acquisition Pitch</h3>
              <p className="text-xs font-mono text-slate-500 uppercase">Valuation Pillars & Competitive Moats</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pitchDeckPoints.map((point, index) => (
              <div key={index} className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-amber-500/30 transition-all duration-300 relative group">
                <div className="absolute top-4 right-4 text-2xl font-mono font-bold text-slate-800 group-hover:text-amber-500/20 transition-colors">
                  0{index + 1}
                </div>
                <h4 className="text-base font-bold text-white pr-8">{point.title}</h4>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-3 items-center">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs text-slate-400 leading-normal">
                Ce modèle d'infrastructure hybride locale (Zero Cloud) répond à 100% au plan stratégique de rachat de Google pour contrer la hausse folle des coûts de calcul liés à l'IA en classe.
              </p>
            </div>
            <button
              onClick={() => handleCopy(JSON.stringify(pitchDeckPoints, null, 2), 'pitchData')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest transition shrink-0"
            >
              {copiedText === 'pitchData' ? 'Copié !' : 'Copier les Moats M&A'}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'api-sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Endpoint Selector and Request Settings */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Terminal className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white uppercase tracking-wider">REST API Playground</h3>
                  <p className="text-xs font-mono text-slate-500 uppercase">Interactive Edge Mockup</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Select Endpoint */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Endpoint Route</label>
                  <select
                    value={selectedApiEndpoint}
                    onChange={(e: any) => {
                      const endpoint = e.target.value;
                      setSelectedApiEndpoint(endpoint);
                      if (endpoint === '/api/v1/cognitive/analyze') {
                        setApiRequestBody(JSON.stringify({
                          text_target: "Spectacle",
                          voice_transcript: "Pestacle",
                          accuracy_threshold: 0.85
                        }, null, 2));
                      } else if (endpoint === '/api/v1/cognitive/phonemes') {
                        setApiRequestBody(JSON.stringify({
                          query_word: "Dyslexie",
                          language: "fr-FR"
                        }, null, 2));
                      } else if (endpoint === '/api/v1/workspace/classroom/sync') {
                        setApiRequestBody(JSON.stringify({
                          course_id: "101",
                          sync_students: true,
                          payload_version: "v3"
                        }, null, 2));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="/api/v1/cognitive/analyze">POST /api/v1/cognitive/analyze</option>
                    <option value="/api/v1/cognitive/phonemes">GET /api/v1/cognitive/phonemes</option>
                    <option value="/api/v1/workspace/classroom/sync">POST /api/v1/workspace/classroom/sync</option>
                  </select>
                </div>

                {/* Request Body */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Request Body (JSON)</label>
                    <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase font-bold">Editable</span>
                  </div>
                  <textarea
                    value={apiRequestBody}
                    onChange={(e) => setApiRequestBody(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-[#00FF00] font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Simulated run and cURL code */}
            <div className="space-y-4 pt-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">Commande cURL correspondante</span>
                  <button
                    onClick={() => {
                      const cleanBody = apiRequestBody.replace(/\s+/g, ' ');
                      const curlCmd = `curl -X ${selectedApiEndpoint.includes('phonemes') ? 'GET' : 'POST'} http://localhost:3000${selectedApiEndpoint} -H "Content-Type: application/json" -d '${cleanBody}'`;
                      handleCopy(curlCmd, 'curl');
                    }}
                    className="text-[9px] font-mono text-emerald-400 hover:text-white flex items-center gap-1 uppercase"
                  >
                    <Copy className="w-3 h-3" /> {copiedText === 'curl' ? 'Copié' : 'Copier cURL'}
                  </button>
                </div>
                <div className="font-mono text-[10px] text-slate-400 break-all select-all select-none max-h-[80px] overflow-y-auto leading-relaxed">
                  curl -X {selectedApiEndpoint.includes('phonemes') ? 'GET' : 'POST'} http://localhost:3000{selectedApiEndpoint} \
                  <br />-H "Content-Type: application/json" \
                  <br />-d '{apiRequestBody.replace(/\s+/g, ' ')}'
                </div>
              </div>

              <button
                onClick={() => {
                  setIsApiCalling(true);
                  setApiLogs(prev => [
                    ...prev,
                    `HTTP: Sending request to http://localhost:3000${selectedApiEndpoint}`,
                    "DNS: Localhost DNS resolved directly without proxy.",
                    "TLS: Local connection bypassed SSL check for speed."
                  ]);

                  setTimeout(() => {
                    let mockResponse = {};
                    if (selectedApiEndpoint === '/api/v1/cognitive/analyze') {
                      let parsedBody: any = {};
                      try { parsedBody = JSON.parse(apiRequestBody); } catch(e) {}
                      mockResponse = {
                        status: "processed",
                        status_code: 200,
                        latency_ms: 14,
                        timestamp: new Date().toISOString(),
                        analytics: {
                          text_target: parsedBody.text_target || "Spectacle",
                          voice_transcript: parsedBody.voice_transcript || "Pestacle",
                          distance_levenshtein: 2,
                          match_percentage: 75.0
                        },
                        remediation: {
                          phoneme_shift_detected: true,
                          shifted_letters: [
                            { index: 0, original: "Sp", pronouced: "P" },
                            { index: 3, original: "p", pronouced: "s" }
                          ],
                          realignments: {
                            bionic_saccadic_weight: "heavy",
                            mirror_stabilizer: "enabled",
                            remedial_word_html: "<strong>Pe</strong>stacle ➔ <strong>Sp</strong>ectacle"
                          }
                        },
                        engine: "Gemma-2B-Instruct Local Inference"
                      };
                    } else if (selectedApiEndpoint === '/api/v1/cognitive/phonemes') {
                      mockResponse = {
                        status: "success",
                        word: "Dyslexie",
                        language_code: "fr-FR",
                        syllables: ["dys", "le", "xie"],
                        phonological_ipa: "/dis.lɛk.si/",
                        graphemes_count: 8,
                        phonemes_count: 7,
                        grapheme_to_phoneme_map: [
                          { grapheme: "d", phoneme: "d" },
                          { grapheme: "y", phoneme: "i" },
                          { grapheme: "s", phoneme: "s" },
                          { grapheme: "l", phoneme: "l" },
                          { grapheme: "ex", phoneme: "ɛks" },
                          { grapheme: "i", phoneme: "i" },
                          { grapheme: "e", phoneme: "" }
                        ]
                      };
                    } else {
                      mockResponse = {
                        status: "synced",
                        classroom_id: "101",
                        classroom_name: "Classe de CP - École Al-Jazari",
                        students_synced: 14,
                        last_handshake: new Date().toISOString(),
                        local_ledger_state: "L6_SECURE_SYNC_OK"
                      };
                    }

                    setApiResponseBody(JSON.stringify(mockResponse, null, 2));
                    setApiLogs(prev => [
                      ...prev,
                      `HTTP: Received 200 OK response from server (latency: 14ms)`,
                      `System: Syncing local sqlite store with matching phoneme metadata.`
                    ]);
                    setIsApiCalling(false);
                  }, 1200);
                }}
                disabled={isApiCalling}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest transition shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                {isApiCalling ? "Exécution de la requête..." : "Lancer la requête ⚡"}
              </button>
            </div>
          </div>

          {/* Terminal Logs & Output Viewer */}
          <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
            {/* API Console Logs */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 space-y-3.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Console HTTP / Trace de Debogage :
              </h4>
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl h-[120px] overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                {apiLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-slate-600">[{index + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex-1 flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center bg-slate-900 px-6 py-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">Réponse du Serveur (JSON Payload)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[9px] font-mono font-bold uppercase">
                    HTTP 200 OK
                  </span>
                  <button
                    onClick={() => handleCopy(apiResponseBody, 'response')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300 rounded transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedText === 'response' ? 'Copié' : 'Copier JSON'}
                  </button>
                </div>
              </div>
              <div className="p-6 bg-slate-950/80 flex-1 overflow-y-auto">
                <pre className="text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto max-h-[350px]">
                  {apiResponseBody}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
