import React, { useState, useEffect } from 'react';
import { BrainCircuit, BookOpen, Network, Mic, Layers, Activity, Apple, Sparkles, Shield, Rocket, Brain, Eye, Orbit, Plus, Download, FileText, Globe, Hand, Video, X, Database, RefreshCw, HardDrive, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { MainViewType } from '../../types';
import scholarIcon from '../../assets/images/mount_ai_logo_1785927100930.jpg';
import { downloadPdfDocument } from '../../utils/pdfExport';
import { extractTextFromFile, parseStructuredDocument, ParsedDocumentResult } from '../../services/documentParser';
import { subscribeStorageStatus, getStorageStatus, StorageStatus } from '../../services/indexedDb';
import SL2TScanner from '../SL2TScanner';
import PDFPreviewBanner from './PDFPreviewBanner';

interface HubViewProps {
  setMainView: (view: MainViewType) => void;
  onAddToWorkspace?: (title: string, text: string) => void;
  user?: any;
}

export default function HubView({ setMainView, onAddToWorkspace, user }: HubViewProps) {
  const [importedDoc, setImportedDoc] = useState<{ name: string; size: number; text: string } | null>(null);
  const [parsedDocResult, setParsedDocResult] = useState<ParsedDocumentResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSl2tModalOpen, setIsSl2tModalOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(getStorageStatus());

  useEffect(() => {
    const unsubscribe = subscribeStorageStatus((status) => {
      setStorageStatus(status);
    });
    return unsubscribe;
  }, []);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const parsed = await parseStructuredDocument(file);
      setParsedDocResult(parsed);
      setImportedDoc({ name: file.name, size: file.size, text: parsed.text });
      if (onAddToWorkspace) {
        onAddToWorkspace(`Fichier Importé Hub - ${file.name}`, parsed.text);
      }
    } catch (err: any) {
      alert(err?.message || "Erreur lors du chargement du fichier.");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const cards = [
    {
      id: 'sl2t',
      title: 'SL2T - Langue des Signes',
      badge: 'MediaPipe Vision AI',
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      icon: Hand,
      description: 'Identification des signes et traduction gestuelle temps réel (SL2T) via MediaPipe Gesture Recognizer & Hand Landmarks.',
      exportTitle: 'SL2T - Transcription Langue des Signes',
      exportText: 'Transcription temps réel de la langue des signes générée par le moteur de vision MediaPipe Mentora AI.'
    },
    {
      id: 'dyslexia',
      title: 'Réalignement Cognitif',
      badge: 'Phonèmes & Synesthésie',
      color: 'text-[#3b82f6]',
      borderColor: 'border-white/10 hover:border-[#3b82f6]/50',
      icon: Eye,
      description: 'Moteur de calibration saccadique d\'attention, synesthésie graphémique et stabilisateurs miroirs spatiaux à base-lourde.',
      exportTitle: 'Réalignement Cognitif - Notes & Exercices Phonétiques',
      exportText: 'Exercices de réalignement cognitif pour la dyslexie et calibration saccadique d\'attention.'
    },
    {
      id: 'learning',
      title: 'Intelligence Cognitive',
      badge: 'Codex & LLM',
      color: 'text-[#ff4e00]',
      borderColor: 'border-white/10 hover:border-[#ff4e00]/50',
      icon: Layers,
      description: 'Extraction sémantique et synthèse structurée par LLM (GPT 5.6 / Codex).',
      exportTitle: 'Intelligence Cognitive - Fiche de Synthèse d\'Étude',
      exportText: 'Fiche de révision générée par le moteur d\'Intelligence Cognitive Mentora AI.'
    },
    {
      id: 'architecture',
      title: 'Faisabilité & Fiabilité',
      badge: 'PWA & Multi-threading',
      color: 'text-[#00FF00]',
      borderColor: 'border-white/10 hover:border-[#00FF00]/50',
      icon: Activity,
      description: 'Architecture structurée et scalabilité du projet (Performances & Sécurité).',
      exportTitle: 'Rapport d\'Architecture Technique & Sécurité',
      exportText: 'Spécifications techniques de la PWA et du pipeline d\'IA Mentora AI.'
    },
    {
      id: 'phonetic-predictor',
      title: 'Prédicteur Phonétique',
      badge: 'Elite AI Helper',
      color: 'text-yellow-400',
      borderColor: 'border-yellow-500/30 hover:border-yellow-500/50',
      icon: Sparkles,
      description: 'Moteur prédictif d\'orthographe à haute vélocité. Saisissez des mots phonétiques simplifiés et accédez aux probabilités lexicales.',
      exportTitle: 'Prédicteur Phonétique - Liste de Vocabulaire',
      exportText: 'Prédictions phonétiques et corrections orthographiques générées par Mentora AI.'
    },
    {
      id: 'workspace',
      title: 'Google Workspace Hub',
      badge: 'Full Workspace',
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/30 hover:border-indigo-500/50',
      icon: Layers,
      description: 'Connectez Google Drive, Docs, Calendar, Slides, Tasks, Classroom et Gmail. Importez vos documents de cours et gérez vos révisions.',
      exportTitle: 'Google Workspace Hub - Synthèse Globale',
      exportText: 'Ensemble des fichiers de cours et calendrier de révision connectés à Google Workspace.'
    },
    {
      id: 'mentora',
      title: 'Mount AI Tutor',
      badge: 'Adaptive Tutor',
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30 hover:border-purple-500/50',
      icon: Brain,
      description: 'Le mentor d\'apprentissage adaptatif socratique. Évaluez vos capacités, générez des cours interactifs sonores et créez des cartes mentales.',
      exportTitle: 'Mount AI Tutor - Résumé de Session Adaptative',
      exportText: 'Compte-rendu de la session d\'apprentissage socratique et évaluation des compétences.'
    }
  ];

  // Restreindre la carte "Faisabilité & Fiabilité" exclusivement à l'adresse du Capitaine (tahawinner25@gmail.com)
  const isMasterAdmin = Boolean(user && user.email && user.email.toLowerCase().trim() === 'tahawinner25@gmail.com');
  const visibleCards = cards.filter(c => c.id !== 'architecture' || isMasterAdmin);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center space-y-6 relative flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
          <div className="px-4 py-1.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.15)] shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
            <span className="text-[10px] font-mono font-black text-[#8b5cf3] uppercase tracking-[0.2em]">Stealth EdTech Startup</span>
          </div>

          {/* VISUAL INDEXEDDB STORAGE STATUS ICON & BADGE */}
          <div 
            className={`px-3.5 py-1.5 rounded-full border flex items-center gap-2 transition-all duration-300 font-mono text-[10px] font-bold shadow-lg ${
              storageStatus.state === 'syncing'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse'
                : !storageStatus.isOnline || storageStatus.state === 'cached'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}
            title={`IndexedDB Status: ${storageStatus.details} • ${storageStatus.itemCount} éléments mis en cache`}
          >
            {storageStatus.state === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="tracking-wider uppercase">Syncing IndexedDB...</span>
              </>
            ) : !storageStatus.isOnline || storageStatus.state === 'cached' ? (
              <>
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span className="tracking-wider uppercase">Cached ({storageStatus.itemCount} docs / AI)</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-[9px] rounded-full text-emerald-200">100% Offline</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span className="tracking-wider uppercase">IndexedDB Ready ({storageStatus.itemCount})</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </>
            )}
          </div>
        </div>

        <div className="w-28 h-28 glass-panel rounded-3xl flex items-center justify-center mb-2 shadow-[0_0_50px_rgba(139,92,246,0.3)] backdrop-blur-xl hover:-translate-y-1 transition duration-500 overflow-hidden border border-[#8b5cf6]/30">
            <img src={scholarIcon} alt="Mount AI" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white relative z-10 drop-shadow-sm">
          Mount AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ff4e00]">Scholar</span>
        </h1>
        <p className="text-lg font-medium text-white/50 max-w-xl mx-auto mt-6 relative z-10">
          Moteur d'exécution local et asynchrone autonome conçu par notre startup de pointe pour révolutionner l'accessibilité cognitive.
        </p>

        {/* HUB DOCUMENT IMPORT & WORKSPACE ACTION BAR */}
        <div className="mt-8 max-w-2xl mx-auto w-full p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xl relative z-10">
          <div className="flex items-center gap-3 overflow-hidden text-left">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-300 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                Importer un Cours / Document (PDF, Word, PPTX)
                {importedDoc && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-mono">
                    📄 {importedDoc.name}
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400">
                {importedDoc 
                  ? `Fichier chargé (${Math.round(importedDoc.size / 1024)} Ko, ${importedDoc.text.length} car.). Disponible hors ligne.`
                  : 'Chargez vos fichiers PDF, Word (.docx), PowerPoint (.pptx) pour alimenter la plateforme avec persistance IndexedDB.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setIsSl2tModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
              title="Ouvrir la fenêtre d'identification SL2T (Langue des Signes)"
            >
              <Hand className="w-4 h-4 text-emerald-200" />
              <span>Fenêtre SL2T 🖐️</span>
            </button>

            <label className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg ${
              isImporting
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                : importedDoc
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-amber-400/50'
            }`}
            title="Importer un fichier PDF, Word (.docx), PowerPoint (.pptx) ou Texte"
            >
              <input 
                type="file" 
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md" 
                onChange={handleImportFile} 
                className="hidden" 
              />
              <FileText className="w-4 h-4 text-amber-200" />
              <span>{isImporting ? 'Extraction...' : importedDoc ? 'Changer PDF/Word' : 'Importer PDF / Word / PPTX'}</span>
            </label>

            {onAddToWorkspace && importedDoc && (
              <button
                onClick={() => onAddToWorkspace(`Document Hub - ${importedDoc.name}`, importedDoc.text)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                title="Exporter vers Workspace"
              >
                <Globe className="w-3.5 h-3.5" /> Workspace
              </button>
            )}
          </div>
        </div>

        {/* PDF PREVIEW BANNER ON HUB */}
        {importedDoc && (
          <div className="mt-4 max-w-2xl mx-auto w-full text-left relative z-10">
            <PDFPreviewBanner
              document={{
                fileName: importedDoc.name,
                text: importedDoc.text,
                size: importedDoc.size
              }}
              parsedResult={parsedDocResult}
              onClearDocument={() => {
                setImportedDoc(null);
                setParsedDocResult(null);
              }}
              onStartAnalysis={() => {
                setMainView('mentora');
              }}
            />
          </div>
        )}
      </div>

      {/* SL2T POPUP / MODAL IDENTIFICATION WINDOW */}
      {isSl2tModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <SL2TScanner
              isModal={true}
              onClose={() => setIsSl2tModalOpen(false)}
              onAddToWorkspace={onAddToWorkspace}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10 mt-6">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.id}
              onClick={() => setMainView(card.id as MainViewType)}
              className={`group glass-panel rounded-[2.5rem] p-8 bg-slate-950/40 hover:bg-white/5 border ${card.borderColor} shadow-lg transition-all duration-300 text-left flex flex-col h-80 relative overflow-hidden cursor-pointer`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <Icon className={`w-32 h-32 ${card.color}`} />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl glass-panel border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono text-slate-300 font-bold tracking-widest uppercase">
                  {card.badge}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{card.title}</h2>
              <p className="text-white/50 text-xs leading-relaxed flex-1 mb-4">
                {card.description}
              </p>

              {/* Extension "Ajouter à Workspace" & Export PDF Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-400" /> Export Hub
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPdfDocument(card.exportTitle, card.exportText, card.badge);
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-[11px] flex items-center gap-1.5 border border-slate-700/60 transition-all hover:scale-105 active:scale-95 z-20"
                    title="Télécharger le document en format PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddToWorkspace) {
                        onAddToWorkspace(card.exportTitle, card.exportText);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-xl text-[11px] flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-blue-400/40 transition-all hover:scale-105 active:scale-95 z-20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const MainHubView = HubView;
