import React, { useState, useEffect } from 'react';
import { 
  History, Loader2, CheckCircle2, Download, MessageSquare, 
  Volume2, VolumeX, Orbit, Mail, FileText, Search, Play, 
  Trash2, ExternalLink, Sparkles, Filter, Copy, Check, Eye,
  RefreshCw, Clock, ArrowRight, CornerDownLeft, Shield, AlertCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { HistoryItem, HistoryItemType, HistoryFileExtension, MainViewType } from '../../types';
import { 
  getHistoryItems, deleteHistoryItem, clearAllHistory, 
  downloadItemAsPdf, downloadItemAsMarkdown, downloadItemAsMail,
  resumeChatbotDiscussion
} from '../../services/historyService';

interface HistoryViewProps {
  user: any;
  setMainView: (view: MainViewType) => void;
  onSelectChatSession?: (session: any) => void;
  speakText?: (text: string) => void;
}

export default function HistoryView({ user, setMainView, onSelectChatSession, speakText }: HistoryViewProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);
  const [activePlayingAudioId, setActivePlayingAudioId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchItems = () => {
    setIsLoadingHistory(true);
    try {
      const items = getHistoryItems(user);
      setHistoryItems(items);
    } catch (e) {
      console.error("Échec de chargement de l'historique :", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const handleHistoryUpdate = () => fetchItems();
    window.addEventListener('mount_ai_history_updated', handleHistoryUpdate);
    return () => window.removeEventListener('mount_ai_history_updated', handleHistoryUpdate);
  }, [user]);

  // Filtrage intelligent des éléments
  const filteredItems = historyItems.filter(item => {
    const matchesType = selectedTypeFilter === 'all' 
      ? true 
      : (selectedTypeFilter === 'pdf' && (item.type === 'pdf' || item.fileExtension === '.pdf'))
      || (selectedTypeFilter === 'chat' && (item.type === 'chat' || item.fileExtension === '.chat'))
      || (selectedTypeFilter === 'audio' && (item.type === 'audio' || item.fileExtension === '.mp3'))
      || (selectedTypeFilter === 'orbit' && (item.type === 'orbit' || item.fileExtension === '.orbit'))
      || (selectedTypeFilter === 'mail' && (item.type === 'mail' || item.fileExtension === '.eml'))
      || (selectedTypeFilter === 'quiz' && (item.type === 'quiz' || item.type === 'exam' || item.fileExtension === '.quiz' || item.fileExtension === '.exam'))
      || (selectedTypeFilter === 'mindmap' && (item.type === 'mindmap' || item.fileExtension === '.map'));

    if (!matchesType) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.originalText?.toLowerCase().includes(query) ||
      item.generatedContent?.toLowerCase().includes(query) ||
      item.fileExtension?.toLowerCase().includes(query) ||
      item.metadata?.word?.toLowerCase().includes(query) ||
      item.metadata?.fileName?.toLowerCase().includes(query)
    );
  });

  // Action : Téléchargement PDF
  const handleDownloadPdf = (item: HistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadItemAsPdf(item);
  };

  // Action : Continuer la discussion avec le Chatbot
  const handleContinueDiscussion = (item: HistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resumeChatbotDiscussion(item);
    if (onSelectChatSession) {
      onSelectChatSession({
        id: item.metadata?.chatSessionId || `session_${item.id}`,
        title: item.title.replace('.chat', ''),
        messages: item.metadata?.chatMessages
      });
    }
    // Basculer sur la vue Cognitive Chatbot / Hub
    setMainView('learning');
  };

  // Action : Écouter / Jouer le son
  const handlePlayAudio = (item: HistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (activePlayingAudioId === item.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setActivePlayingAudioId(null);
      return;
    }

    const textToSpeak = item.originalText || item.metadata?.word || item.generatedContent;
    if (speakText) {
      speakText(textToSpeak);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/[*_#`]/g, ''));
      utterance.lang = item.language === 'English' ? 'en-GB' : item.language === 'Arabic' ? 'ar-SA' : 'fr-FR';
      utterance.onend = () => setActivePlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    }
    setActivePlayingAudioId(item.id);
  };

  // Action : Recharger l'Orbite Phonétique
  const handleOpenOrbit = (item: HistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.metadata?.word) {
      localStorage.setItem('active_orbit_preset_word', item.metadata.word);
    }
    setMainView('phoneme-gravity');
  };

  // Action : Copier le contenu d'un Mail ou texte
  const handleCopyContent = (item: HistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(item.generatedContent || item.originalText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action : Supprimer un élément
  const handleDelete = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(user, item.id);
    if (previewItem?.id === item.id) setPreviewItem(null);
  };

  // Badge d'extension couleur & icône
  const getExtensionBadge = (ext: HistoryFileExtension, type: HistoryItemType) => {
    switch (ext) {
      case '.pdf':
        return {
          label: '.PDF',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
          icon: FileText
        };
      case '.chat':
        return {
          label: '.CHAT',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]',
          icon: MessageSquare
        };
      case '.mp3':
        return {
          label: '.AUDIO',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
          icon: Volume2
        };
      case '.orbit':
        return {
          label: '.ORBIT',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
          icon: Orbit
        };
      case '.eml':
        return {
          label: '.MAIL',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
          icon: Mail
        };
      case '.quiz':
      case '.exam':
        return {
          label: '.QUIZ',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
          icon: Sparkles
        };
      case '.map':
        return {
          label: '.MAP',
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]',
          icon: Sparkles
        };
      default:
        return {
          label: ext.toUpperCase(),
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: FileText
        };
    }
  };

  // Compteurs par type
  const pdfCount = historyItems.filter(i => i.type === 'pdf' || i.fileExtension === '.pdf').length;
  const chatCount = historyItems.filter(i => i.type === 'chat' || i.fileExtension === '.chat').length;
  const audioCount = historyItems.filter(i => i.type === 'audio' || i.fileExtension === '.mp3').length;
  const orbitCount = historyItems.filter(i => i.type === 'orbit' || i.fileExtension === '.orbit').length;
  const mailCount = historyItems.filter(i => i.type === 'mail' || i.fileExtension === '.eml').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      
      {/* En-tête Supérieur */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                HISTORIQUE UNIFIÉ <span className="text-blue-500 font-mono text-xl uppercase tracking-wider">[{historyItems.length} Fichiers]</span>
              </h2>
              <p className="text-slate-400 font-mono text-xs mt-0.5">
                Centralisation et téléchargement de chaque PDF, réponse chatbot, audio, orbite et email généré.
              </p>
            </div>
          </div>
        </div>

        {/* Info Mode Invité vs Mode Connecté */}
        <div className="flex items-center gap-3 flex-wrap">
          {user?.isGuest ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono font-bold">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Stockage Invité Temporaire (30 min) • Téléchargement actif</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-mono font-bold">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Persistance Cloud Sécurisée • {user?.displayName || user?.email}</span>
            </div>
          )}

          {historyItems.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Êtes-vous sûr de vouloir effacer tout votre historique ?")) {
                  clearAllHistory(user);
                  setPreviewItem(null);
                }
              }}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Effacer tout l'historique"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de Recherche et Filtres par Extension */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Recherche textuelle */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre, extension (.pdf, .chat), mot-clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Statistiques Rapides */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-400" /> Filtres :
            </span>

            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                selectedTypeFilter === 'all'
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tous ({historyItems.length})
            </button>

            <button
              onClick={() => setSelectedTypeFilter('pdf')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedTypeFilter === 'pdf'
                  ? 'bg-rose-600 text-white border border-rose-400 shadow-md'
                  : 'bg-slate-950 text-rose-300 hover:bg-slate-800 border border-rose-500/30'
              }`}
            >
              <FileText className="w-3 h-3 text-rose-400" /> .PDF ({pdfCount})
            </button>

            <button
              onClick={() => setSelectedTypeFilter('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedTypeFilter === 'chat'
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-md'
                  : 'bg-slate-950 text-blue-300 hover:bg-slate-800 border border-blue-500/30'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-blue-400" /> .CHAT ({chatCount})
            </button>

            <button
              onClick={() => setSelectedTypeFilter('audio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedTypeFilter === 'audio'
                  ? 'bg-purple-600 text-white border border-purple-400 shadow-md'
                  : 'bg-slate-950 text-purple-300 hover:bg-slate-800 border border-purple-500/30'
              }`}
            >
              <Volume2 className="w-3 h-3 text-purple-400" /> .AUDIO ({audioCount})
            </button>

            <button
              onClick={() => setSelectedTypeFilter('orbit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedTypeFilter === 'orbit'
                  ? 'bg-cyan-600 text-white border border-cyan-400 shadow-md'
                  : 'bg-slate-950 text-cyan-300 hover:bg-slate-800 border border-cyan-500/30'
              }`}
            >
              <Orbit className="w-3 h-3 text-cyan-400" /> .ORBIT ({orbitCount})
            </button>

            <button
              onClick={() => setSelectedTypeFilter('mail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedTypeFilter === 'mail'
                  ? 'bg-amber-600 text-white border border-amber-400 shadow-md'
                  : 'bg-slate-950 text-amber-300 hover:bg-slate-800 border border-amber-500/30'
              }`}
            >
              <Mail className="w-3 h-3 text-amber-400" /> .MAIL ({mailCount})
            </button>
          </div>
        </div>
      </div>

      {/* Grille des Fichiers d'Historique */}
      <div className="bg-slate-950/60 rounded-3xl border border-slate-800/80 backdrop-blur-sm p-6 md:p-8 min-h-[480px]">
        {isLoadingHistory ? (
          <div className="flex flex-col justify-center items-center py-24 text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-mono text-slate-400">Chargement de votre coffre-fort d'historique...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Aucun fichier trouvé</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {searchQuery 
                ? `Aucun élément ne correspond à votre recherche "${searchQuery}".` 
                : "Chaque PDF importé, réponse d'assistant, audio synthétisé, orbite générée ou e-mail créé sera automatiquement sauvegardé ici avec son extension dédiée."}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setMainView('learning')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg cursor-pointer"
              >
                Générer un premier document
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const badge = getExtensionBadge(item.fileExtension, item.type);
              const BadgeIcon = badge.icon;
              const isAudioPlaying = activePlayingAudioId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setPreviewItem(item)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] transition-all cursor-pointer group flex flex-col justify-between h-[340px] relative overflow-hidden"
                >
                  {/* Top bar avec badge d'extension et date */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2.5 py-1 text-[11px] font-mono font-black rounded-lg border flex items-center gap-1.5 ${badge.bg}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                        <button
                          onClick={(e) => handleDelete(item, e)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer ce document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Titre avec extension */}
                    <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h4>

                    {/* Aperçu du contenu */}
                    <div className="text-xs text-slate-400 line-clamp-4 leading-relaxed font-sans mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      {item.type === 'mail' && item.metadata?.mailData?.subject ? (
                        <div>
                          <strong className="text-amber-300">Objet : {item.metadata.mailData.subject}</strong>
                          <p className="mt-1">{item.generatedContent}</p>
                        </div>
                      ) : item.type === 'orbit' && item.metadata?.phonemes ? (
                        <div>
                          <span className="text-cyan-300 font-mono font-bold">Phonèmes : {item.metadata.phonemes.join(' ')}</span>
                          <p className="mt-1">{item.originalText}</p>
                        </div>
                      ) : (
                        item.generatedContent?.substring(0, 160) || item.originalText?.substring(0, 160) || "Contenu archivé"
                      )}
                    </div>
                  </div>

                  {/* Barre d'Actions contextuelles en bas de carte */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-auto">
                    
                    {/* Action 1 : Spécifique au type */}
                    {item.type === 'pdf' || item.fileExtension === '.pdf' || item.type === 'summary' ? (
                      <button
                        onClick={(e) => handleDownloadPdf(item, e)}
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Retélécharger ce PDF officiel"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Retélécharger</span>
                      </button>
                    ) : item.type === 'chat' || item.fileExtension === '.chat' ? (
                      <button
                        onClick={(e) => handleContinueDiscussion(item, e)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Continuer cette discussion dans le Chatbot"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Continuer chat</span>
                      </button>
                    ) : item.type === 'audio' || item.fileExtension === '.mp3' ? (
                      <button
                        onClick={(e) => handlePlayAudio(item, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          isAudioPlaying
                            ? 'bg-purple-600 text-white border border-purple-400 animate-pulse'
                            : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40'
                        }`}
                        title="Écouter la synthèse vocale"
                      >
                        {isAudioPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isAudioPlaying ? 'Arrêter son' : 'Écouter son'}</span>
                      </button>
                    ) : item.type === 'orbit' || item.fileExtension === '.orbit' ? (
                      <button
                        onClick={(e) => handleOpenOrbit(item, e)}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Explorer cette orbite phonétique interactive"
                      >
                        <Orbit className="w-3.5 h-3.5" />
                        <span>Voir Orbite</span>
                      </button>
                    ) : item.type === 'mail' || item.fileExtension === '.eml' ? (
                      <button
                        onClick={(e) => handleCopyContent(item, e)}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Copier le contenu du mail"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copié !' : 'Copier mail'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDownloadPdf(item, e)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </button>
                    )}

                    {/* Action 2 : Visionner détails */}
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="text-xs font-mono font-bold text-slate-400 hover:text-white flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Ouvrir</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale de Visionnage & Téléchargement Complet */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fadeIn">
          <div className="bg-[#0f172a] border border-blue-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.3)] overflow-hidden">
            
            {/* Header Modale */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-mono font-black rounded-lg border ${getExtensionBadge(previewItem.fileExtension, previewItem.type).bg}`}>
                  {previewItem.fileExtension.toUpperCase()}
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">{previewItem.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                    <span>Langue : {previewItem.language}</span>
                    <span>•</span>
                    <span>Date : {new Date(previewItem.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenu Déroulant */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
              
              {/* Informations Spécifiques Mail */}
              {previewItem.type === 'mail' && previewItem.metadata?.mailData && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-mono text-amber-300">
                    <strong>À :</strong> {previewItem.metadata.mailData.to || "destinataire@ecole.com"}
                  </div>
                  <div className="text-xs font-mono text-amber-300">
                    <strong>Objet :</strong> {previewItem.metadata.mailData.subject || previewItem.title}
                  </div>
                </div>
              )}

              {/* Informations Spécifiques Orbite */}
              {previewItem.type === 'orbit' && previewItem.metadata?.phonemes && (
                <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider mb-1">
                      Particules & Phonèmes Orbitaux :
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {previewItem.metadata.phonemes.map((ph, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold rounded-lg text-xs">
                          {ph}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewItem(null);
                      handleOpenOrbit(previewItem);
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl font-mono flex items-center gap-2"
                  >
                    <Orbit className="w-4 h-4" /> Lancer l'Orbite
                  </button>
                </div>
              )}

              {/* Contexte / Requête Source */}
              {previewItem.originalText && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Source / Prompt Original :
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                    {previewItem.originalText}
                  </p>
                </div>
              )}

              {/* Contenu Généré Complet (Markdown) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Contenu Intégral Généré ({previewItem.fileExtension})</span>
                  <button
                    onClick={() => handleCopyContent(previewItem)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                  >
                    {copiedId === previewItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === previewItem.id ? 'Copié' : 'Copier texte'}</span>
                  </button>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                  <Markdown>{previewItem.generatedContent}</Markdown>
                </div>
              </div>
            </div>

            {/* Footer d'Actions */}
            <div className="p-5 border-t border-white/10 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadItemAsPdf(previewItem)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Télécharger .PDF
                </button>
                <button
                  onClick={() => downloadItemAsMarkdown(previewItem)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Télécharger .MD
                </button>
                {previewItem.type === 'mail' && (
                  <button
                    onClick={() => downloadItemAsMail(previewItem)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" /> Télécharger .EML
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {previewItem.type === 'chat' && (
                  <button
                    onClick={() => {
                      setPreviewItem(null);
                      handleContinueDiscussion(previewItem);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> Continuer discussion
                  </button>
                )}
                {(previewItem.type === 'audio' || previewItem.generatedContent) && (
                  <button
                    onClick={() => handlePlayAudio(previewItem)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Écouter audio
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
