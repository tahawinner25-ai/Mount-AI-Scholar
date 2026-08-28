import React, { useState, useEffect } from 'react';
import { 
  FileText, Eye, EyeOff, X, ChevronLeft, ChevronRight, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, BookOpen, CheckCircle, Search, Layers, FileCheck
} from 'lucide-react';
import { ParsedDocumentResult, formatBytes } from '../../services/documentParser';

interface PDFPreviewBannerProps {
  document: { fileName: string; text: string; size: number } | null;
  parsedResult: ParsedDocumentResult | null;
  onClearDocument?: () => void;
  onOpenStudio?: () => void;
  onStartAnalysis?: (selectedText?: string) => void;
}

export default function PDFPreviewBanner({
  document,
  parsedResult,
  onClearDocument,
  onOpenStudio,
  onStartAnalysis
}: PDFPreviewBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [activeTab, setActiveTab] = useState<'text' | 'chapters' | 'summary'>('text');

  // Split text into approximate pages or paragraphs for easy reading
  const totalPages = parsedResult?.totalPages || 1;
  const chapters = parsedResult?.chapters || [];

  // Reset page when document changes
  useEffect(() => {
    setActivePage(1);
    setSearchTerm('');
  }, [document?.fileName]);

  if (!document) return null;

  // Split text per page if possible
  const textPages = React.useMemo(() => {
    if (!document.text) return ['Aucun texte extrait'];
    // Try splitting by form feed or page separator if available, or approximate chunks
    const pages = document.text.split(/\f|\n--- Page \d+ ---\n/);
    if (pages.length > 1) return pages;

    // Fallback: chunk by ~2500 chars
    const chunks: string[] = [];
    const fullText = document.text;
    const chunkSize = Math.max(800, Math.ceil(fullText.length / totalPages));
    
    for (let i = 0; i < fullText.length; i += chunkSize) {
      chunks.push(fullText.slice(i, i + chunkSize));
    }
    return chunks.length > 0 ? chunks : [fullText];
  }, [document.text, totalPages]);

  const currentPageText = textPages[activePage - 1] || textPages[0] || '';

  // Filter text highlighting search
  const highlightSearch = (content: string) => {
    if (!searchTerm.trim()) return content;
    const parts = content.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900/95 via-violet-950/40 to-slate-900/95 border border-violet-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all duration-300 relative overflow-hidden">
      
      {/* Glow accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-violet-600/20 border border-violet-500/40 rounded-xl text-violet-300 shrink-0">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {parsedResult?.fileType?.toUpperCase() || 'DOCUMENT'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Prêt pour analyse
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatBytes(document.size)} • {totalPages} {totalPages > 1 ? 'pages' : 'page'} • {parsedResult?.totalWords ? `${parsedResult.totalWords.toLocaleString()} mots` : `${document.text.length} car.`}
              </span>
            </div>

            <h4 className="text-sm font-black text-white truncate max-w-md mt-0.5">
              {document.fileName}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isOpen 
                ? 'bg-violet-600 text-white border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.3)]' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-violet-500/50 hover:text-white'
            }`}
            title={isOpen ? "Masquer la prévisualisation" : "Prévisualiser le document avant analyse"}
          >
            {isOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-violet-400" />}
            <span>{isOpen ? 'Masquer Aperçu' : 'Prévisualiser'}</span>
          </button>

          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 text-violet-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Ouvrir dans le Studio Grand Document"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden md:inline">Studio</span>
            </button>
          )}

          {onStartAnalysis && (
            <button
              onClick={() => onStartAnalysis()}
              className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Lancer le tuteur IA sur ce document"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Analyser</span>
            </button>
          )}

          {onClearDocument && (
            <button
              onClick={onClearDocument}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              title="Fermer et retirer ce document"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Preview Modal / Drawer */}
      {isOpen && (
        <div className={`mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200 ${
          isExpanded ? 'fixed inset-4 z-50 bg-slate-950 border border-violet-500/50 rounded-3xl p-6 shadow-2xl flex flex-col' : ''
        }`}>
          
          {/* Modal Header Controls (Search, Pages, Tabs) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
            
            {/* View sub-tabs */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'text' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Texte Intégral ({textPages.length} p.)
              </button>
              {chapters.length > 0 && (
                <button
                  onClick={() => setActiveTab('chapters')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === 'chapters' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chapitres ({chapters.length})
                </button>
              )}
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'summary' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Structure & Métadonnées
              </button>
            </div>

            {/* Search within document */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher dans le texte..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Font & Fullscreen controls */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 gap-1">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${fontSize === 'sm' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                  title="Police compacte"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('md')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${fontSize === 'md' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                  title="Police normale"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${fontSize === 'lg' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                  title="Police agrandie"
                >
                  A+
                </button>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                title={isExpanded ? "Réduire" : "Plein écran"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Content Body */}
          {activeTab === 'text' && (
            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              {/* Pagination controls */}
              {textPages.length > 1 && (
                <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActivePage(prev => Math.max(1, prev - 1))}
                      disabled={activePage <= 1}
                      className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>Page <strong className="text-white">{activePage}</strong> sur {textPages.length}</span>
                    <button
                      onClick={() => setActivePage(prev => Math.min(textPages.length, prev + 1))}
                      disabled={activePage >= textPages.length}
                      className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500">
                    ~{currentPageText.length} caractères sur cette page
                  </span>
                </div>
              )}

              {/* Text viewer area */}
              <div className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto font-sans leading-relaxed text-slate-200 shadow-inner ${
                isExpanded ? 'flex-1 min-h-[400px]' : 'max-h-[320px]'
              } ${
                fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base leading-loose' : 'text-sm'
              }`}>
                <div className="whitespace-pre-wrap selection:bg-violet-600 selection:text-white">
                  {highlightSearch(currentPageText)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto ${isExpanded ? 'flex-1 max-h-none' : 'max-h-[320px]'}`}>
              {chapters.map((ch, idx) => (
                <div 
                  key={ch.id || idx}
                  className="p-3.5 bg-slate-950 border border-slate-800 hover:border-violet-500/40 rounded-xl space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300 font-mono">
                      {ch.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {ch.wordCount} mots
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {ch.content}
                  </p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        if (onStartAnalysis) onStartAnalysis(ch.content);
                      }}
                      className="text-[10px] font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1 font-bold"
                    >
                      <Sparkles className="w-3 h-3" /> Analyser ce chapitre
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className={`p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs overflow-y-auto ${isExpanded ? 'flex-1 max-h-none' : 'max-h-[320px]'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Nom Fichier</span>
                  <span className="font-bold text-white truncate block">{document.fileName}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Taille Réelle</span>
                  <span className="font-bold text-emerald-400 block">{formatBytes(document.size)}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Nombre de Pages</span>
                  <span className="font-bold text-violet-400 block">{totalPages} pages</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Volume Mots</span>
                  <span className="font-bold text-amber-400 block">{parsedResult?.totalWords?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 leading-relaxed text-[11px]">
                <strong className="text-white block mb-1">Moteur d'Extraction Cognitif :</strong>
                Document validé et découpé par le pipeline asynchrone sans figer l'application. Vous pouvez lancer le tuteur socratique, générer des leçons complètes, des quiz adaptatifs ou des cartes mentales directement depuis ce document.
              </div>
            </div>
          )}

          {/* Quick analysis launch footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> Document vérifié par l'élève
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Fermer
              </button>
              {onStartAnalysis && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onStartAnalysis();
                  }}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3 h-3" /> Lancer l'Analyse IA
                </button>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
