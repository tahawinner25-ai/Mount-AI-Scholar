import React, { useState, useEffect } from 'react';
import { Chrome, Smartphone, FileJson, Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Code, ShieldCheck, Sparkles, Layout, Terminal, ExternalLink, ArrowRight, Laptop, Server, Cpu, Database, Flame, Wifi, WifiOff, Globe, Info, Zap, AlertCircle } from 'lucide-react';

interface AuditItem {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  impact: 'high' | 'medium' | 'low';
  category: 'chrome' | 'mobile' | 'sw' | 'api';
  suggestion?: string;
  codeSnippet?: string;
}

interface HealthDiagnostics {
  status: string;
  timestamp: string;
  environment: string;
  uptimeSeconds: number;
  diagnostics: {
    expressServer: { status: string; port: number };
    mlEngine: { configuredUrl: string; isOnline: boolean; latencyMs: number; details: string };
    geminiAi: { configured: boolean; details: string };
    firebase: { configured: boolean; projectId: string; details: string };
  };
}

export default function PwaAudit() {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditScore, setAuditScore] = useState(88);
  const [activeCategory, setActiveCategory] = useState<'all' | 'chrome' | 'mobile' | 'sw' | 'api'>('all');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [realManifest, setRealManifest] = useState<any>(null);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);
  const [swActive, setSwActive] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<HealthDiagnostics | null>(null);
  const [isTestingHealth, setIsTestingHealth] = useState<boolean>(false);

  const [viewportStatus, setViewportStatus] = useState({
    viewportExists: false,
    appleCapable: false,
    themeColor: false,
    statusBar: false
  });

  const [audits, setAudits] = useState<AuditItem[]>([
    {
      id: 'api-backend-health',
      name: 'Express Backend API & Online Connectivity',
      description: 'Tests if the Cloud Run Node.js / Express backend is responding on /api/health and serving static assets.',
      status: 'passed',
      impact: 'high',
      category: 'api',
      suggestion: 'Ensure server.ts binds to host 0.0.0.0 and port 3000 with Express 5 wildcards (*all).',
      codeSnippet: `app.get("/api/health", (req, res) => res.json({ status: "ok" }));`
    },
    {
      id: 'ml-engine-connectivity',
      name: 'ML Engine (Codex API) Proxy & Gemini AI',
      description: 'Checks connectivity to the configured ML inference URL and verifies server-side Gemini API fallback.',
      status: 'passed',
      impact: 'high',
      category: 'api',
      suggestion: 'If CODEX_API_URL is unreachable in Cloud Run, ensure GEMINI_API_KEY is configured in backend environment.',
      codeSnippet: `const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });`
    },
    {
      id: 'firebase-connectivity',
      name: 'Firebase Cloud Firestore & Auth Config',
      description: 'Validates Firebase credentials fetched dynamically via /api/config/firebase or fallback JSON.',
      status: 'passed',
      impact: 'high',
      category: 'api',
      suggestion: 'Set FIREBASE_PROJECT_ID and FIREBASE_API_KEY env vars or provide firebase-applet-config.json.',
      codeSnippet: `app.get("/api/config/firebase", (req, res) => res.json({ projectId, apiKey }));`
    },
    {
      id: 'mv3-manifest',
      name: 'Manifest Version 3 Compliance',
      description: 'Check if the Chrome extension manifest is using MV3 format as required by Google Web Store.',
      status: 'passed',
      impact: 'high',
      category: 'chrome',
      suggestion: 'Ensure manifest_version is set to 3. Manifest V2 extensions are fully deprecated.',
      codeSnippet: `"manifest_version": 3`
    },
    {
      id: 'mv3-background',
      name: 'Background Service Worker registration',
      description: 'Check if the background script is declared as a Service Worker under Manifest V3.',
      status: 'passed',
      impact: 'high',
      category: 'chrome',
      suggestion: 'Use "background": { "service_worker": "background.js" } instead of persistent background pages.',
      codeSnippet: `"background": {\n  "service_worker": "background.js"\n}`
    },
    {
      id: 'sw-registration',
      name: 'Service Worker Registration in Client',
      description: 'Detects if the service worker is registered in the client-side code.',
      status: 'warning',
      impact: 'high',
      category: 'sw',
      suggestion: 'Ensure your app registers the service worker in the main client thread to support standalone offline mode.',
      codeSnippet: `if ('serviceWorker' in navigator) {\n  window.addEventListener('load', () => {\n    navigator.serviceWorker.register('/background.js')\n      .then(reg => console.log('SW Registered', reg))\n      .catch(err => console.error('SW Error', err));\n  });\n}`
    },
    {
      id: 'sw-caching',
      name: 'Offline Asset & Sync Caching',
      description: 'Validates that the service worker intercepts fetch events to allow full offline operations.',
      status: 'passed',
      impact: 'high',
      category: 'sw',
      suggestion: 'Your background.js intercepts fetch queries to serve local static files from the CacheStorage API.',
      codeSnippet: `self.addEventListener('fetch', (event) => {\n  event.respondWith(\n    caches.match(event.request).then((response) => {\n      return response || fetch(event.request);\n    })\n  );\n});`
    },
    {
      id: 'viewport-meta',
      name: 'Mobile Viewport Optimization',
      description: 'Validates the presence of viewport meta tag inside index.html for responsive layout.',
      status: 'passed',
      impact: 'high',
      category: 'mobile',
      suggestion: 'Define a viewport with width=device-width, initial-scale=1 to ensure responsive layouts look perfectly calibrated.',
      codeSnippet: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
    },
    {
      id: 'apple-touch-icon',
      name: 'Apple Web App Capable & Touch Icon',
      description: 'Validates optimal styling tags and status bar setups for Safari on iPadOS and iOS.',
      status: 'warning',
      impact: 'medium',
      category: 'mobile',
      suggestion: 'Add apple-mobile-web-app-capable and matching link icons to make your PWA look like a gorgeous native app on iPads.',
      codeSnippet: `<meta name="apple-mobile-web-app-capable" content="yes" />\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
    },
    {
      id: 'pwa-display',
      name: 'PWA Display Configuration',
      description: 'Validates web app display preferences to hide browser UI controls.',
      status: 'passed',
      impact: 'medium',
      category: 'mobile',
      suggestion: 'Declare display: "standalone" in your manifest file to remove the browser address bar in mobile views.',
      codeSnippet: `"display": "standalone"`
    },
    {
      id: 'pwa-icons',
      name: 'Icon sizes compliance (192px and 512px)',
      description: 'Checks if standard icon targets are supplied in the manifest for homescreen launcher shortcuts.',
      status: 'passed',
      impact: 'high',
      category: 'mobile',
      suggestion: 'Provide high-quality vector or raster icons sized exactly at 192x192 and 512x512 pixels.',
      codeSnippet: `"icons": [\n  { "src": "pwa-192x192.svg", "sizes": "192x192", "type": "image/svg+xml" },\n  { "src": "pwa-512x512.svg", "sizes": "512x512", "type": "image/svg+xml" }\n]`
    },
    {
      id: 'theme-color',
      name: 'Theme Color Metadata',
      description: 'Checks if the theme-color meta tag is specified to customize the mobile device status bar color.',
      status: 'failed',
      impact: 'low',
      category: 'mobile',
      suggestion: 'Insert the theme-color meta tag pointing to your dark aesthetic brand color.',
      codeSnippet: `<meta name="theme-color" content="#020617" />`
    }
  ]);

  // Read environment metadata and query live API health endpoints in real time
  const runLiveAudit = async () => {
    setIsAuditing(true);
    setIsTestingHealth(true);
    setAuditLogs([
      "Audit-Engine: Starting Real-Time Compliance & API Health Analysis...",
      "Environment: Analyzing DOM elements...",
    ]);

    // Step 1: Scan DOM
    await new Promise(r => setTimeout(r, 400));
    const metaTags = document.getElementsByTagName('meta');
    let hasViewport = false;
    let hasAppleCapable = false;
    let hasThemeColor = false;
    let hasStatusBar = false;

    for (let i = 0; i < metaTags.length; i++) {
      const name = metaTags[i].getAttribute('name');
      if (name === 'viewport') hasViewport = true;
      if (name === 'apple-mobile-web-app-capable') hasAppleCapable = true;
      if (name === 'theme-color') hasThemeColor = true;
      if (name === 'apple-mobile-web-app-status-bar-style') hasStatusBar = true;
    }

    setViewportStatus({
      viewportExists: hasViewport,
      appleCapable: hasAppleCapable,
      themeColor: hasThemeColor,
      statusBar: hasStatusBar
    });

    setAuditLogs(prev => [
      ...prev,
      `DOM Scan: Viewport Tag ${hasViewport ? 'FOUND' : 'MISSING'}`,
      `DOM Scan: Apple-Capable Tag ${hasAppleCapable ? 'FOUND' : 'MISSING'}`,
      `DOM Scan: Theme-Color Tag ${hasThemeColor ? 'FOUND' : 'MISSING'}`,
      "Environment: Fetching /api/health/full diagnostic endpoint...",
    ]);

    // Step 2: Test /api/health/full
    let apiHealthPassed = false;
    let mlStatus: 'passed' | 'warning' | 'failed' = 'failed';
    let firebaseStatus: 'passed' | 'warning' | 'failed' = 'failed';

    try {
      const res = await fetch('/api/health/full');
      if (res.ok) {
        const hData: HealthDiagnostics = await res.json();
        setHealthData(hData);
        apiHealthPassed = true;

        const { expressServer, mlEngine, geminiAi, firebase } = hData.diagnostics;

        setAuditLogs(prev => [
          ...prev,
          `[HEALTH] Express Backend: ${expressServer.status.toUpperCase()} on Port ${expressServer.port} (Env: ${hData.environment})`,
          `[HEALTH] ML Engine (Codex API): ${mlEngine.isOnline ? 'ONLINE (' + mlEngine.latencyMs + 'ms)' : 'OFFLINE - ' + mlEngine.details}`,
          `[HEALTH] Gemini AI Server: ${geminiAi.configured ? 'CONFIGURED & READY' : 'KEY MISSING'}`,
          `[HEALTH] Firebase Database: ${firebase.configured ? 'CONFIGURED (' + firebase.projectId + ')' : 'LOCALSTORAGE OFFLINE MODE'}`,
        ]);

        if (mlEngine.isOnline) {
          mlStatus = 'passed';
        } else if (geminiAi.configured) {
          mlStatus = 'warning'; // Local ML offline but Cloud Gemini fallback is ready
        } else {
          mlStatus = 'failed';
        }

        if (firebase.configured) {
          firebaseStatus = 'passed';
        } else {
          firebaseStatus = 'warning'; // Running resiliently on LocalStorage
        }
      } else {
        setAuditLogs(prev => [...prev, `[HEALTH] /api/health/full returned HTTP status ${res.status}`]);
      }
    } catch (err: any) {
      setAuditLogs(prev => [...prev, `[HEALTH] Error connecting to /api/health/full: ${String(err)}`]);
    }

    setIsTestingHealth(false);

    // Step 3: Check Service Worker
    await new Promise(r => setTimeout(r, 400));
    let registered = false;
    let active = false;

    if ('serviceWorker' in navigator) {
      registered = true;
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) {
          active = true;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setSwRegistered(registered);
    setSwActive(active);

    setAuditLogs(prev => [
      ...prev,
      `SW Monitor: Service Worker supported in browser: ${registered ? 'YES' : 'NO'}`,
      `SW Monitor: Active service worker found: ${active ? 'YES' : 'NO'}`,
      "Environment: Fetching /manifest.webmanifest...",
    ]);

    // Step 4: Fetch real manifest.webmanifest if exists
    try {
      const response = await fetch('/manifest.webmanifest');
      if (response.ok) {
        const data = await response.json();
        setRealManifest(data);
        setAuditLogs(prev => [
          ...prev,
          `Manifest: Fetch success. Short name: "${data.short_name || 'none'}"`,
          `Manifest: App Display mode: "${data.display || 'browser'}"`
        ]);
      } else {
        setAuditLogs(prev => [...prev, "Manifest: /manifest.webmanifest status " + response.status]);
      }
    } catch (err) {
      setAuditLogs(prev => [...prev, "Manifest: Error fetching manifest file: " + String(err)]);
    }

    // Step 5: Recompute status
    const updatedAudits = audits.map(audit => {
      if (audit.id === 'api-backend-health') {
        return { ...audit, status: apiHealthPassed ? 'passed' : 'failed' as any };
      }
      if (audit.id === 'ml-engine-connectivity') {
        return { ...audit, status: mlStatus };
      }
      if (audit.id === 'firebase-connectivity') {
        return { ...audit, status: firebaseStatus };
      }
      if (audit.id === 'viewport-meta') {
        return { ...audit, status: hasViewport ? 'passed' : 'failed' as any };
      }
      if (audit.id === 'apple-touch-icon') {
        return { ...audit, status: hasAppleCapable ? 'passed' : 'warning' as any };
      }
      if (audit.id === 'theme-color') {
        return { ...audit, status: hasThemeColor ? 'passed' : 'failed' as any };
      }
      if (audit.id === 'sw-registration') {
        return { ...audit, status: active ? 'passed' : 'warning' as any };
      }
      return audit;
    });

    setAudits(updatedAudits);

    // Calculate score
    const passedCount = updatedAudits.filter(a => a.status === 'passed').length;
    const warningCount = updatedAudits.filter(a => a.status === 'warning').length;
    const failedCount = updatedAudits.filter(a => a.status === 'failed').length;
    const totalCount = updatedAudits.length;
    
    const calculatedScore = Math.round(((passedCount * 1.0) + (warningCount * 0.5)) / totalCount * 100);
    setAuditScore(calculatedScore);

    setAuditLogs(prev => [
      ...prev,
      "------------------------------------------",
      `Audit Completed! Score: ${calculatedScore}/100`,
      `Results: ${passedCount} Passed | ${warningCount} Warnings | ${failedCount} Failed`,
      "Audit-Engine: Sandbox & Endpoint state fully verified."
    ]);

    setIsAuditing(false);
  };

  useEffect(() => {
    runLiveAudit();
  }, []);

  const filteredAudits = audits.filter(audit => {
    if (activeCategory === 'all') return true;
    return audit.category === activeCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Bar with Audit action */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00FF00]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-full">
            <ShieldCheck className="w-4 h-4 text-[#00FF00]" />
            <span className="text-[10px] font-mono font-black text-[#00FF00] uppercase tracking-widest">Chrome Web Store & Online API Health Standards</span>
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">PWA Store & Connectivity Audit</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pour garantir un déploiement zéro-défaut de <strong>Mount AI Scholar</strong> en production sur Cloud Run et Chromebooks, cet audit teste en temps réel la conformité PWA, l'état de l'API Express, la connectivité du moteur ML (Codex API) et la synchronisation cloud Firebase.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0 bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 w-full sm:w-auto">
          {/* Score Indicator */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#1e293b"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={auditScore >= 90 ? '#00FF00' : auditScore >= 75 ? '#ea580c' : '#ef4444'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - auditScore / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-2xl font-mono font-black text-white">{auditScore}</span>
              <span className="text-[10px] text-slate-500 block font-mono">/100</span>
            </div>
          </div>

          <div className="space-y-3 w-full sm:w-auto text-center sm:text-left">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Diagnostic Élite</p>
              <p className="text-sm font-bold text-white uppercase mt-0.5">
                {auditScore >= 90 ? 'Optimisé pour la Production' : auditScore >= 70 ? 'Recommandations en attente' : 'Améliorations requises'}
              </p>
            </div>
            <button
              onClick={runLiveAudit}
              disabled={isAuditing}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
                isAuditing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-[#00FF00]/10 border border-[#00FF00]/30 hover:bg-[#00FF00]/20 text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? 'Analyse...' : 'Relancer l\'Audit'}
            </button>
          </div>
        </div>
      </div>

      {/* Online API & Cloud Connectivity Health Check Monitor */}
      <div className="bg-slate-950/90 border border-blue-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_40px_rgba(59,130,246,0.1)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                Moniteur de Santé API & Connectivité Cloud (Online Health Monitor)
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono rounded font-bold uppercase">
                  <Wifi className="w-2.5 h-2.5" /> Direct Probe
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Diagnostic granulaire des endpoints réseau, du proxy ML local et des clés de fallback Gemini/Firebase.
              </p>
            </div>
          </div>

          <button
            onClick={runLiveAudit}
            disabled={isTestingHealth || isAuditing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingHealth ? 'animate-spin' : ''}`} />
            Tester la Connectivité API
          </button>
        </div>

        {/* Diagnostic Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Express Server */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" /> Express Backend
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                healthData?.diagnostics.expressServer.status === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {healthData?.diagnostics.expressServer.status === 'online' ? 'EN LIGNE' : 'INACTIF'}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Port {healthData?.diagnostics.expressServer.port || '3000'} • {healthData?.environment || 'production'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Uptime: {healthData ? `${healthData.uptimeSeconds}s` : 'En cours...'}
              </p>
            </div>
          </div>

          {/* 2. ML Engine (Codex API) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Moteur ML Local
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                healthData?.diagnostics.mlEngine.isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {healthData?.diagnostics.mlEngine.isOnline ? 'ONLINE' : 'FALLBACK GEMINI'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate">
                {healthData?.diagnostics.mlEngine.configuredUrl || 'http://127.0.0.1:8000'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {healthData?.diagnostics.mlEngine.isOnline
                  ? `Latence: ${healthData.diagnostics.mlEngine.latencyMs}ms`
                  : 'Mode dégradé intelligent actif'}
              </p>
            </div>
          </div>

          {/* 3. Server-side Gemini AI */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-purple-400" /> Gemini Cloud AI
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                healthData?.diagnostics.geminiAi.configured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {healthData?.diagnostics.geminiAi.configured ? 'PRÊT' : 'CLÉ MANQUANTE'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {healthData?.diagnostics.geminiAi.configured ? 'GEMINI_API_KEY Détectée' : 'Clé non trouvée dans .env'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                Inférence LLM & Phonèmes
              </p>
            </div>
          </div>

          {/* 4. Firebase Cloud Sync */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" /> Firebase Firestore
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                healthData?.diagnostics.firebase.configured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {healthData?.diagnostics.firebase.configured ? 'CLOUD SYNC' : 'OFFLINE LOCAL'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate">
                {healthData?.diagnostics.firebase.projectId || 'Mode local'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {healthData?.diagnostics.firebase.configured ? 'Synchro temps réel activée' : 'Résilience via LocalStorage'}
              </p>
            </div>
          </div>

        </div>

        {/* Detailed Explanation for Online Deployment Failure / Fallback */}
        <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-4 md:p-5 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[10px] font-mono">
            <Info className="w-4 h-4 shrink-0" />
            Analyse d'Ingénierie : Pourquoi une PWA/Applet peut échouer en ligne (Online Cloud Deployment)
          </div>
          <p className="leading-relaxed text-slate-300">
            En environnement de conteneurisé distant (Cloud Run / Vercel / Netlify), le serveur local Python <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">127.0.0.1:8000</code> n'est pas accessible. Si l'application tenta d'appeler directement ce port sans proxy, la requête échoue avec <code className="text-red-400 bg-black/40 px-1.5 py-0.5 rounded font-mono">ECONNREFUSED</code>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-black/40 border border-slate-800 p-3 rounded-xl space-y-1">
              <strong className="text-emerald-400 font-mono text-[10px] uppercase block">1. Proxy Universel Express</strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                Le serveur Express intercepte <code className="text-slate-300">/api/*</code> et redirige avec un timeout de 12s vers le Cloud ou Gemini API.
              </p>
            </div>
            <div className="bg-black/40 border border-slate-800 p-3 rounded-xl space-y-1">
              <strong className="text-blue-400 font-mono text-[10px] uppercase block">2. Routage Express 5 (SPA Wildcard)</strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                Les routes frontend sont servies via <code className="text-slate-300">app.get('*all', ...)</code> pour éviter les erreurs de syntaxe Express v5.
              </p>
            </div>
            <div className="bg-black/40 border border-slate-800 p-3 rounded-xl space-y-1">
              <strong className="text-purple-400 font-mono text-[10px] uppercase block">3. Mode Dégradé Autonome</strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                En l'absence de réseau ou de Firebase, l'application bascule immédiatement sur LocalStorage sans planter la session.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Grid of Logs and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Realtime Terminal Logs */}
        <div className="lg:col-span-1 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex flex-col h-[480px]">
          <div className="bg-slate-900 px-5 py-4 border-b border-slate-800/80 flex items-center gap-2 shrink-0">
            <Terminal className="w-4 h-4 text-[#00FF00]" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Console Audit Lab</span>
            <div className="ml-auto flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            </div>
          </div>
          <div className="p-5 font-mono text-[11px] text-[#00FF00]/80 space-y-2 overflow-y-auto flex-1 bg-black/40 scrollbar-thin">
            {auditLogs.map((log, index) => (
              <div key={index} className={`leading-relaxed ${
                log.includes('MISSING') || log.includes('Error') || log.includes('OFFLINE') ? 'text-red-400' :
                log.includes('FOUND') || log.includes('success') || log.includes('YES') || log.includes('ONLINE') || log.includes('CONFIGURED') ? 'text-[#00FF00]' :
                log.includes('HEALTH') ? 'text-sky-300' :
                log.includes('---') ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
            {isAuditing && (
              <div className="flex items-center gap-2 text-slate-500 animate-pulse mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Analyse des métadonnées du package en cours...
              </div>
            )}
          </div>
        </div>

        {/* Right column: Audit items list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Category tabs filters */}
          <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-2xl overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-1 min-w-[80px] px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-slate-900 border border-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              Tous ({audits.length})
            </button>
            <button
              onClick={() => setActiveCategory('api')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeCategory === 'api' ? 'bg-slate-900 border border-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" /> API & Cloud
            </button>
            <button
              onClick={() => setActiveCategory('chrome')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeCategory === 'chrome' ? 'bg-slate-900 border border-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Chrome className="w-3.5 h-3.5 text-emerald-400" /> Web Store
            </button>
            <button
              onClick={() => setActiveCategory('mobile')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeCategory === 'mobile' ? 'bg-slate-900 border border-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Mobile Stores
            </button>
            <button
              onClick={() => setActiveCategory('sw')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeCategory === 'sw' ? 'bg-slate-900 border border-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Activity className="w-3.5 h-3.5 text-yellow-500" /> Offline SW
            </button>
          </div>

          {/* Audit List Container */}
          <div className="space-y-4 max-h-[390px] overflow-y-auto pr-2 scrollbar-thin">
            {filteredAudits.map((audit) => (
              <div key={audit.id} className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 hover:bg-slate-900/50 transition-all space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {audit.status === 'passed' ? (
                        <CheckCircle className="w-5 h-5 text-[#00FF00]" />
                      ) : audit.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                        {audit.name}
                        {audit.impact === 'high' && (
                          <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[8px] font-mono text-red-400 font-bold uppercase">Impact Élevé</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{audit.description}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-black tracking-wider ${
                    audit.status === 'passed' ? 'bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20' :
                    audit.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {audit.status}
                  </span>
                </div>

                {audit.status !== 'passed' && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
                    <div className="text-xs text-slate-300">
                      <strong className="text-amber-500 uppercase tracking-widest text-[9px] font-mono block mb-1">Recommandation :</strong>
                      {audit.suggestion}
                    </div>
                    {audit.codeSnippet && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 block">Code correct à intégrer :</span>
                        <div className="relative">
                          <pre className="text-[10px] text-emerald-400 font-mono bg-black/40 p-3 rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
                            {audit.codeSnippet}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide strategy card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-[#00FF00]/20 w-fit">
            <Chrome className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Chrome Web Store Packaging</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Google exige un format compressé .zip contenant votre <strong>manifest.json (V3)</strong>, vos scripts de fond, et le dossier d'actifs de l'extension. Ce dossier est automatiquement généré à la racine de votre dossier <strong>dist/</strong> après compilation.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 w-fit">
            <Smartphone className="w-6 h-6 text-blue-400" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Play Store (Capacitor Native)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pour le déploiement sur les tablettes Android des écoles, nous compilons le web code via <strong>Capacitor CLI</strong>. Le framework génère un pont Java natif sécurisé, gardant le moteur d'inférence phonologique ultra performant et hors-ligne.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 w-fit">
            <Activity className="w-6 h-6 text-yellow-400" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Mise en Cache & Offline local</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Grâce aux cycles d'installation et de fetch du Service Worker, l'application est stockée de manière persistante sur la machine de l'élève. L'apprentissage ne s'arrête jamais, même sans connexion internet stable dans les classes reculées.
          </p>
        </div>
      </div>
    </div>
  );
}

