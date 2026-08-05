import React, { useState, useEffect } from 'react';
import { 
  HardDrive, FileText, Calendar, Presentation, CheckSquare, 
  ExternalLink, RefreshCw, Plus, Search, Trash2, ArrowRight, 
  Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, Download, 
  Folder, Layers, LogOut, Loader2, FileUp, Filter, Eye, Check
} from 'lucide-react';
import { connectGoogleWorkspace, getCachedWorkspaceToken, auth } from '../services/firebase';
import { downloadPdfDocument } from '../utils/pdfExport';
import { MainViewType } from '../types';

interface GoogleWorkspaceHubProps {
  setMainView?: (view: MainViewType) => void;
  onImportText?: (text: string, destination: 'dyslexia' | 'learning' | 'phonetic') => void;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
}

interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export default function GoogleWorkspaceHub({ setMainView, onImportText }: GoogleWorkspaceHubProps) {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'drive' | 'docs' | 'calendar' | 'slides' | 'tasks'>('drive');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info' | null; text: string }>({ type: null, text: '' });

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [fileContentText, setFileContentText] = useState<string>('');

  // Docs state
  const [docTitle, setDocTitle] = useState('Note de Révision - Mentora AI');
  const [docBody, setDocBody] = useState('');

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventTitle, setEventTitle] = useState('Session de Révision - Mentora AI');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventDurationMinutes, setEventDurationMinutes] = useState('60');

  // Slides state
  const [slideTitle, setSlideTitle] = useState('Présentation Cognitique - Mentora AI');
  const [slideSubtitle, setSlideSubtitle] = useState('Synthèse de cours & carte mentale');

  // Tasks state
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('@default');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Confirmation Modal state for mutating operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const existingToken = getCachedWorkspaceToken();
    if (existingToken) {
      setToken(existingToken);
      fetchInitialData(existingToken);
    }
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMsg({ type: null, text: '' });
    try {
      const resToken = await connectGoogleWorkspace();
      if (resToken) {
        setToken(resToken);
        setStatusMsg({ type: 'success', text: 'Connexion Google Workspace établie avec succès !' });
        fetchInitialData(resToken);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: `Erreur de connexion : ${err.message || 'Échec d\'authentification'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = (authToken: string) => {
    fetchDriveFiles(authToken);
    fetchCalendarEvents(authToken);
    fetchTasks(authToken);
  };

  // --- GOOGLE DRIVE API ---
  const fetchDriveFiles = async (authToken: string, query?: string) => {
    setIsLoading(true);
    try {
      let q = "trashed = false";
      if (query && query.trim()) {
        q += ` and name contains '${query.trim().replace(/'/g, "\\'")}'`;
      }
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        setToken(null);
        setStatusMsg({ type: 'error', text: 'Jeton expiré. Veuillez vous reconnecter à Google Workspace.' });
        return;
      }
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
      }
    } catch (err: any) {
      console.error("Drive error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDriveFile = async (file: DriveFile) => {
    if (!token) return;
    setIsLoading(true);
    setSelectedFile(file);
    setFileContentText('');
    try {
      if (file.mimeType.includes('google-apps.document')) {
        // Export Google Doc as plain text
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
        const res = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const text = await res.text();
        setFileContentText(text);
        if (onImportText && text) {
          onImportText(text, 'dyslexia');
          setStatusMsg({ type: 'success', text: `Document "${file.name}" importé avec succès dans le lecteur Dyslexie !` });
        }
      } else {
        // Fetch standard file content
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const text = await res.text();
        setFileContentText(text);
        if (onImportText && text) {
          onImportText(text, 'dyslexia');
          setStatusMsg({ type: 'success', text: `Fichier "${file.name}" importé avec succès !` });
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Impossible de lire le contenu du fichier sélectionné.' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- GOOGLE DOCS API ---
  const handleCreateGoogleDoc = () => {
    if (!docTitle.trim() || !token) return;

    setConfirmModal({
      isOpen: true,
      title: "Créer un nouveau document Google Docs",
      description: `Vous allez créer le document Google Doc intitulé "${docTitle}" dans votre Google Drive.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
          // 1. Create empty document
          const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: docTitle })
          });
          const docData = await createRes.json();
          if (!createRes.ok) throw new Error(docData.error?.message || "Création échouée");

          const documentId = docData.documentId;

          // 2. Insert content if any
          if (docBody.trim()) {
            await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                requests: [
                  {
                    insertText: {
                      location: { index: 1 },
                      text: docBody
                    }
                  }
                ]
              })
            });
          }

          setStatusMsg({
            type: 'success',
            text: `Document Google Docs "${docTitle}" créé avec succès ! ID: ${documentId}`
          });
          setDocBody('');
          fetchDriveFiles(token);
        } catch (err: any) {
          console.error("Docs error:", err);
          setStatusMsg({ type: 'error', text: `Erreur lors de la création du document : ${err.message}` });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // --- GOOGLE CALENDAR API ---
  const fetchCalendarEvents = async (authToken: string) => {
    try {
      const now = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=15&orderBy=startTime&singleEvents=true`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const data = await res.json();
      if (data.items) {
        setCalendarEvents(data.items);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    }
  };

  const handleCreateCalendarEvent = () => {
    if (!eventTitle.trim() || !token) return;

    const startDateTime = new Date(`${eventDate}T09:00:00`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(eventDurationMinutes) * 60000);

    setConfirmModal({
      isOpen: true,
      title: "Programmer un événement Google Calendar",
      description: `Créer l'événement "${eventTitle}" le ${eventDate} de 09:00 à ${endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
          const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              summary: eventTitle,
              description: 'Session d\'étude et révision planifiée via Mentora AI Workspace Integration.',
              start: { dateTime: startDateTime.toISOString() },
              end: { dateTime: endDateTime.toISOString() }
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || "Création échouée");

          setStatusMsg({ type: 'success', text: `Événement "${eventTitle}" ajouté à votre calendrier Google !` });
          fetchCalendarEvents(token);
        } catch (err: any) {
          console.error(err);
          setStatusMsg({ type: 'error', text: `Erreur Calendar : ${err.message}` });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // --- GOOGLE SLIDES API ---
  const handleCreateSlidesPresentation = () => {
    if (!slideTitle.trim() || !token) return;

    setConfirmModal({
      isOpen: true,
      title: "Générer une présentation Google Slides",
      description: `Vous allez créer un nouveau support de cours Google Slides intitulé "${slideTitle}".`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
          // 1. Create presentation
          const res = await fetch('https://slides.googleapis.com/v1/presentations', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: slideTitle })
          });
          const slideData = await res.json();
          if (!res.ok) throw new Error(slideData.error?.message || "Création échouée");

          setStatusMsg({
            type: 'success',
            text: `Présentation Google Slides "${slideTitle}" créée dans Google Drive ! ID: ${slideData.presentationId}`
          });
          fetchDriveFiles(token);
        } catch (err: any) {
          console.error(err);
          setStatusMsg({ type: 'error', text: `Erreur Slides : ${err.message}` });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // --- GOOGLE TASKS API ---
  const fetchTasks = async (authToken: string) => {
    try {
      const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${selectedTaskListId}/tasks`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.items) {
        setTasks(data.items);
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    }
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !token) return;

    setConfirmModal({
      isOpen: true,
      title: "Ajouter une tâche Google Tasks",
      description: `Ajouter la tâche de révision "${newTaskTitle}" à votre liste Google Tasks ?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
          const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${selectedTaskListId}/tasks`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: newTaskTitle,
              notes: 'Créé via Mentora AI Workspace Integration'
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || "Création échouée");

          setStatusMsg({ type: 'success', text: `Tâche "${newTaskTitle}" ajoutée dans Google Tasks !` });
          setNewTaskTitle('');
          fetchTasks(token);
        } catch (err: any) {
          console.error(err);
          setStatusMsg({ type: 'error', text: `Erreur Tasks : ${err.message}` });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleToggleTaskStatus = (task: TaskItem) => {
    if (!token) return;
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';

    setConfirmModal({
      isOpen: true,
      title: task.status === 'completed' ? "Marquer comme non terminée ?" : "Valider la tâche ?",
      description: `Mettre à jour le statut de "${task.title}" dans Google Tasks.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await fetch(`https://www.googleapis.com/tasks/v1/lists/${selectedTaskListId}/tasks/${task.id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: nextStatus })
          });
          fetchTasks(token);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <div className="w-full bg-[#0a0d17] border border-blue-500/30 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] shrink-0">
            <Layers className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Hub Google Workspace Unifié
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> API Direct
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Drive • Docs • Calendar • Slides • Tasks • Picker • Intégration Native Mentora AI
            </p>
          </div>
        </div>

        {/* Auth status & Connection toggle */}
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-mono text-blue-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                {auth.currentUser?.email || 'Connecté à Google'}
              </span>
              <button
                onClick={() => { setToken(null); setStatusMsg({ type: 'info', text: 'Déconnecté de Google Workspace.' }); }}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>Se connecter à Google Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Status Message */}
      {statusMsg.text && (
        <div className={`p-4 rounded-2xl border mb-6 text-xs font-medium flex items-center justify-between relative z-10 ${
          statusMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' :
          statusMsg.type === 'error' ? 'bg-red-950/40 border-red-500/40 text-red-300' :
          'bg-blue-950/40 border-blue-500/40 text-blue-300'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg({ type: null, text: '' })} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Workspace Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800 scrollbar-none relative z-10">
        {[
          { id: 'drive', label: 'Google Drive & Picker', icon: HardDrive, color: 'text-blue-400' },
          { id: 'docs', label: 'Google Docs', icon: FileText, color: 'text-indigo-400' },
          { id: 'calendar', label: 'Google Calendar', icon: Calendar, color: 'text-emerald-400' },
          { id: 'slides', label: 'Google Slides', icon: Presentation, color: 'text-amber-400' },
          { id: 'tasks', label: 'Google Tasks', icon: CheckSquare, color: 'text-purple-400' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-2xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Views */}
      {!token ? (
        <div className="py-12 text-center space-y-6 bg-slate-950/40 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Connexion Google Workspace requise</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-sans mt-2">
              Connectez votre compte Google pour synchroniser vos fichiers Google Drive, notes Google Docs, agenda Calendar et tâches Google Tasks.
            </p>
          </div>

          {/* Guide Google App Unverified */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 text-left text-xs space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between gap-2 text-white font-bold">
              <span className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                🔒 Architecture Souveraine & Sécurité Client Directe
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono rounded border border-emerald-500/30">Zéro Risque</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Mount AI Scholar fonctionne en <span className="font-bold text-white">Privacy by Design</span>. Vos requêtes OAuth sont transmises sans passer par un serveur tiers.
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1 text-amber-200">
              <p className="font-bold text-[11px] text-amber-300">💡 Si Google affiche l'avertissement de projet Sandbox / Dev :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[10.5px]">
                <div className="p-2 bg-black/40 border border-amber-500/20 rounded-lg text-amber-200">
                  <span className="font-bold text-amber-400">Étape 1 :</span> Cliquez sur <span className="font-bold text-white underline">"Paramètres avancés"</span>
                </div>
                <div className="p-2 bg-black/40 border border-amber-500/20 rounded-lg text-amber-200">
                  <span className="font-bold text-amber-400">Étape 2 :</span> Cliquez sur <span className="font-bold text-emerald-300 underline">"Continuer vers Mount AI Scholar"</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>{isLoading ? 'Connexion...' : 'Autoriser l\'accès Google Workspace'}</span>
            </button>

            <button
              onClick={() => {
                downloadPdfDocument(
                  "Bilan & Synthèse Mount AI Scholar Workspace", 
                  "Synthèse cognitive et rapports d'apprentissage générés en mode hors-ligne par Mount AI Scholar.\n\nAccès direct et indépendant de Google Workspace.",
                  "PDF LOCAL MOUNT AI"
                );
              }}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exporter Bilan PDF Local</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10">

          {/* TAB 1: GOOGLE DRIVE & PICKER */}
          {activeTab === 'drive' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 border border-slate-800 rounded-2xl">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDriveFiles(token, searchQuery)}
                    placeholder="Rechercher dans Google Drive..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={() => fetchDriveFiles(token, searchQuery)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" /> Rechercher
                </button>
              </div>

              {/* Drive File Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-1">
                {driveFiles.map(file => (
                  <div
                    key={file.id}
                    className="p-4 bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl flex flex-col justify-between gap-3 group transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl shrink-0">
                        <HardDrive className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {file.mimeType.split('.').pop()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                      <button
                        onClick={() => handleImportDriveFile(file)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                      >
                        <FileUp className="w-3 h-3" /> Importer
                      </button>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-mono"
                        >
                          Google Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Imported text preview */}
              {selectedFile && fileContentText && (
                <div className="mt-6 p-5 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Contenu extrait de : {selectedFile.name}
                    </span>
                    <button
                      onClick={() => {
                        if (onImportText) onImportText(fileContentText, 'dyslexia');
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider"
                    >
                      Transférer au Lecteur Dyslexie
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 font-mono bg-slate-900 p-4 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {fileContentText.slice(0, 1000)}...
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> Créer une Note d'Étude sur Google Docs
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Titre du Document :</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Contenu / Notes de cours :</label>
                    <textarea
                      rows={6}
                      value={docBody}
                      onChange={(e) => setDocBody(e.target.value)}
                      placeholder="Saisissez ou collez vos notes de révision pour les exporter directement sur Google Docs..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none focus:border-indigo-500 transition-colors mt-1 font-mono resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleCreateGoogleDoc}
                      disabled={isLoading || !docTitle.trim()}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Exporter vers Google Docs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* Event creation form */}
              <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Planifier une Session de Révision
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Titre de la session :</label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Date :</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Durée (minutes) :</label>
                    <select
                      value={eventDurationMinutes}
                      onChange={(e) => setEventDurationMinutes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors mt-1"
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 heure</option>
                      <option value="120">2 heures</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreateCalendarEvent}
                    disabled={isLoading || !eventTitle.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg mt-2 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Ajouter à Google Calendar
                  </button>
                </div>
              </div>

              {/* Calendar events list */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Événements à venir sur Google Calendar
                </h3>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {calendarEvents.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-8 text-center">Aucun événement planifié pour le moment.</p>
                  ) : (
                    calendarEvents.map(evt => (
                      <div key={evt.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-white">{evt.summary}</h4>
                          <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                            {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : evt.start?.date}
                          </p>
                        </div>
                        {evt.htmlLink && (
                          <a
                            href={evt.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-white rounded-xl transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE SLIDES */}
          {activeTab === 'slides' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-amber-400" /> Générer un Support de Cours Google Slides
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Titre de la présentation :</label>
                    <input
                      type="text"
                      value={slideTitle}
                      onChange={(e) => setSlideTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition-colors mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Sous-titre / Thème :</label>
                    <input
                      type="text"
                      value={slideSubtitle}
                      onChange={(e) => setSlideSubtitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition-colors mt-1"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleCreateSlidesPresentation}
                      disabled={isLoading || !slideTitle.trim()}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Créer dans Google Slides
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-purple-400" /> Google Tasks - Liste de Devoirs & Révisions
                  </h3>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                      placeholder="Ajouter une nouvelle tâche..."
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors w-full sm:w-64"
                    />
                    <button
                      onClick={handleCreateTask}
                      disabled={!newTaskTitle.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shrink-0"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-8 text-center">Aucune tâche enregistrée dans votre Google Tasks.</p>
                  ) : (
                    tasks.map(tsk => {
                      const isDone = tsk.status === 'completed';
                      return (
                        <div
                          key={tsk.id}
                          className="p-3.5 bg-slate-950 border border-slate-800 hover:border-purple-500/30 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleTaskStatus(tsk)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                                isDone 
                                  ? 'bg-purple-600 border-purple-500 text-white' 
                                  : 'border-slate-700 hover:border-purple-400 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <span className={`text-xs font-medium ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                              {tsk.title}
                            </span>
                          </div>
                          {tsk.notes && <span className="text-[10px] text-slate-500 font-mono">{tsk.notes}</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Mandatory User Confirmation Modal for Destructive/Mutating Operations */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-blue-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.description}</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
              >
                Confirmer l'action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
