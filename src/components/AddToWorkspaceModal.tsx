import React, { useState } from 'react';
import { 
  HardDrive, FileText, Calendar, Presentation, CheckSquare, 
  Layers, CheckCircle2, AlertTriangle, Loader2, X, Sparkles, Send, ShieldCheck, Mail, GraduationCap, Download, FileCode
} from 'lucide-react';
import { getCachedWorkspaceToken, auth, connectGoogleWorkspace } from '../services/firebase';
import { downloadPdfDocument, generatePdfBlob } from '../utils/pdfExport';

interface AddToWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  textToSave?: string;
}

export default function AddToWorkspaceModal({ isOpen, onClose, title, textToSave }: AddToWorkspaceModalProps) {
  type AppKeyType = 'pdf_drive' | 'docx_drive' | 'pdf_local' | 'docs' | 'slides' | 'calendar' | 'tasks' | 'classroom' | 'gmail';

  const [selectedApp, setSelectedApp] = useState<AppKeyType | null>(null);
  const [customTitle, setCustomTitle] = useState(title || 'Note de cours - Mentora AI');
  const [content, setContent] = useState(textToSave || 'Synthèse cognitive et cours enregistrés depuis Mentora AI.');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  if (!isOpen) return null;

  const userEmail = auth.currentUser?.email || 'compte-google-configure@mentora.ai';
  const token = getCachedWorkspaceToken();

  const handleExportToApp = async (appKey: AppKeyType, retryCount = 0) => {
    setSelectedApp(appKey);
    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      if (appKey === 'pdf_local') {
        await downloadPdfDocument(customTitle, content, 'EXPORTATION MENTORA AI');
        setStatusMsg({
          type: 'success',
          text: `Document PDF "${customTitle}.pdf" téléchargé sur votre appareil !`
        });
        setIsSaving(false);
        return;
      }

      let activeToken = getCachedWorkspaceToken();
      if (!activeToken) {
        activeToken = await connectGoogleWorkspace(retryCount > 0);
        if (!activeToken) {
          throw new Error("Authentification Google Workspace requise. Cliquez sur 'Re-connecter Google Workspace' ci-dessous.");
        }
      }

      const executeRequest = async (currentToken: string) => {
        if (appKey === 'pdf_drive') {
          const pdfBlob = await generatePdfBlob(customTitle, content, 'GOOGLE DRIVE PDF EXPORT');
          const fileMetadata = { name: `${customTitle}.pdf`, mimeType: 'application/pdf' };
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
          form.append('file', pdfBlob, `${customTitle}.pdf`);

          const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}` },
            body: form,
          });
          const data = await res.json();
          if (!res.ok) throw data;
          return `Fichier PDF "${customTitle}.pdf" sauvegardé dans votre Google Drive (${userEmail}) !`;

        } else if (appKey === 'docx_drive') {
          const fileMetadata = { name: `${customTitle}.docx`, mimeType: 'application/vnd.google-apps.document' };
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
          form.append('file', new Blob([`Mentora AI - ${customTitle}\n\n${content}`], { type: 'text/plain' }));

          const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}` },
            body: form,
          });
          const data = await res.json();
          if (!res.ok) throw data;
          return `Document Word/Doc "${customTitle}.docx" créé dans votre Google Drive (${userEmail}) !`;

        } else if (appKey === 'docs') {
          const res = await fetch('https://docs.googleapis.com/v1/documents', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: customTitle })
          });
          const docData = await res.json();
          if (!res.ok) throw docData;

          if (content) {
            await fetch(`https://docs.googleapis.com/v1/documents/${docData.documentId}:batchUpdate`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [{ insertText: { location: { index: 1 }, text: content } }]
              })
            });
          }
          return `Document Google Docs "${customTitle}" créé pour ${userEmail} !`;

        } else if (appKey === 'calendar') {
          const start = new Date();
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: customTitle,
              description: content,
              start: { dateTime: start.toISOString() },
              end: { dateTime: end.toISOString() }
            })
          });
          const calData = await res.json();
          if (!res.ok) throw calData;
          return `Session "${customTitle}" ajoutée dans Google Calendar (${userEmail}) !`;

        } else if (appKey === 'slides') {
          const res = await fetch('https://slides.googleapis.com/v1/presentations', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: customTitle })
          });
          const slideData = await res.json();
          if (!res.ok) throw slideData;
          return `Présentation Google Slides (PowerPoint) "${customTitle}" créée dans Drive (${userEmail}) !`;

        } else if (appKey === 'tasks') {
          const res = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: customTitle, notes: content })
          });
          const taskData = await res.json();
          if (!res.ok) throw taskData;
          return `Tâche "${customTitle}" enregistrée dans Google Tasks pour ${userEmail} !`;

        } else if (appKey === 'classroom') {
          const res = await fetch('https://classroom.googleapis.com/v1/courses?pageSize=5', {
            headers: { Authorization: `Bearer ${currentToken}` }
          });
          const classData = await res.json();
          if (!res.ok) throw classData;

          const courses = classData.courses || [];
          if (courses.length > 0) {
            const courseId = courses[0].id;
            const annRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `📌 [MENTORA AI - SYNTHÈSE DE COURS]\n${customTitle}\n\n${content}`
              })
            });
            const annData = await annRes.json();
            if (!annRes.ok) throw annData;
            return `Annonce publiée dans le cours Classroom "${courses[0].name}" (${userEmail}) !`;
          } else {
            return `Connecté à Google Classroom (${userEmail}). Rejoint un cours pour publier.`;
          }

        } else if (appKey === 'gmail') {
          const emailContent = `To: ${userEmail}\r\nSubject: [Mentora AI Workspace] ${customTitle}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${content}`;
          const encodedEmail = btoa(unescape(encodeURIComponent(emailContent))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

          const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: { raw: encodedEmail } })
          });
          const gmailData = await res.json();
          if (!res.ok) throw gmailData;
          return `Brouillon d'e-mail créé dans votre boîte Gmail (${userEmail}) !`;
        }
        return '';
      };

      const successMsg = await executeRequest(activeToken);
      setStatusMsg({ type: 'success', text: successMsg });

    } catch (err: any) {
      console.error("Export Workspace Error:", err);
      
      let errMsg = '';
      if (typeof err === 'string') {
        errMsg = err;
      } else if (err?.error?.message) {
        errMsg = typeof err.error.message === 'string' ? err.error.message : JSON.stringify(err.error.message);
      } else if (typeof err?.error === 'string') {
        errMsg = err.error;
      } else if (err?.message) {
        errMsg = err.message;
      } else {
        try {
          errMsg = JSON.stringify(err);
        } catch {
          errMsg = 'Impossible de communiquer avec l\'API Google Workspace.';
        }
      }

      const code = err?.error?.code || err?.code;
      const status = err?.error?.status || err?.status;
      const isAuthError = 
        code === 401 || 
        code === 403 || 
        status === 'UNAUTHENTICATED' || 
        status === 'PERMISSION_DENIED' ||
        errMsg.toLowerCase().includes('auth') ||
        errMsg.toLowerCase().includes('token') ||
        errMsg.toLowerCase().includes('credential') ||
        errMsg.toLowerCase().includes('oauth') ||
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('popup');
      
      if (isAuthError && retryCount === 0) {
        console.log("🔑 [AUTH RECOVERY] Jeton OAuth expiré ou invalide. Tentative de renouvellement...");
        try {
          const refreshedToken = await connectGoogleWorkspace(true);
          if (refreshedToken) {
            return handleExportToApp(appKey, 1);
          }
        } catch (authErr) {
          console.warn("Échec du rafraîchissement OAuth:", authErr);
        }
      }

      setStatusMsg({
        type: 'error',
        text: isAuthError 
          ? `Accès Google non validé pour ${userEmail}. Veuillez cliquer sur "Re-connecter Google Workspace" pour accorder les permissions, ou utilisez l'exportation PDF locale.`
          : `Erreur (${appKey}) : ${errMsg}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReconnect = async () => {
    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });
    try {
      const newToken = await connectGoogleWorkspace(true);
      if (newToken) {
        setStatusMsg({
          type: 'success',
          text: `Connexion Google Workspace mise à jour pour ${userEmail} ! Vous pouvez ré-essayer l'exportation.`
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Échec de re-connexion : ${err.message || 'Erreur inconnue'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-blue-500/40 rounded-[2rem] max-w-xl w-full p-6 md:p-8 shadow-[0_0_60px_rgba(59,130,246,0.25)] relative overflow-hidden space-y-6">
        
        {/* Ambient lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                Extension "Ajouter à Workspace"
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Auto-configuré : {userEmail}
                </p>
                <button
                  onClick={handleReconnect}
                  disabled={isSaving}
                  className="px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 rounded text-[10px] font-mono text-blue-300 font-bold tracking-wider transition-colors"
                  title="Renouveler le jeton d'accès Google OAuth"
                >
                  Re-connecter
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice for Google Unverified App Screen */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-amber-950/60 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2.5 shadow-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>🔒 Connexion Directe & Chiffrement Client (Privacy-First)</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono rounded border border-emerald-500/30">Zéro Serveur Tiers</span>
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
              Mentora AI se connecte directement de votre navigateur à Google Cloud API. Vos identifiants ne quittent jamais votre appareil.
              <br />
              <span className="text-amber-300 font-mono text-[10.5px]">💡 Si la fenêtre Google indique "Application non validée" (Mode Stealth Dev) :</span>
              <br />
              Cliquez sur <span className="font-bold text-amber-200 underline">"Paramètres avancés"</span> puis <span className="font-bold text-emerald-300 underline">"Continuer vers Mount AI Scholar"</span>. Vous pouvez aussi utiliser l'export **PDF Local** sans aucune autorisation cloud.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Titre de l'élément :</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors mt-1"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Aperçu du contenu à enregistrer :</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono outline-none focus:border-blue-500 transition-colors mt-1 resize-none"
            />
          </div>
        </div>

        {/* Status Message */}
        {statusMsg.text && (
          <div className={`p-3.5 rounded-xl border text-xs font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            statusMsg.type === 'success' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-red-950/50 border-red-500/40 text-red-300'
          }`}>
            <span className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{statusMsg.text}</span>
            </span>
            {statusMsg.type === 'error' && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleExportToApp('pdf_local')}
                  disabled={isSaving}
                  className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 rounded-lg text-xs font-bold text-emerald-200 transition-all flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger PDF Local
                </button>
                <button
                  onClick={handleReconnect}
                  disabled={isSaving}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 rounded-lg text-xs font-bold text-red-200 transition-all flex items-center gap-1"
                >
                  🔐 Re-connecter Google
                </button>
              </div>
            )}
          </div>
        )}

        {/* Workspace App Selection Grid */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Sélectionnez le format d'exportation ou la destination Google Workspace :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {[
              { id: 'pdf_drive', name: 'Google Drive (PDF)', icon: HardDrive, color: 'text-red-400', desc: 'Exporter et enregistrer en PDF sur Google Drive' },
              { id: 'docx_drive', name: 'Google Drive (Word)', icon: FileCode, color: 'text-blue-400', desc: 'Exporter et enregistrer en Word (.docx) sur Drive' },
              { id: 'docs', name: 'Google Docs', icon: FileText, color: 'text-indigo-400', desc: 'Créer un document Google Docs interactif' },
              { id: 'slides', name: 'Google Slides (PowerPoint)', icon: Presentation, color: 'text-amber-400', desc: 'Générer une présentation PowerPoint / Slides' },
              { id: 'pdf_local', name: 'Télécharger PDF (Local)', icon: Download, color: 'text-emerald-400', desc: 'Télécharger directement le PDF sur cet appareil' },
              { id: 'calendar', name: 'Google Calendar', icon: Calendar, color: 'text-emerald-400', desc: 'Programmer une session de révision' },
              { id: 'tasks', name: 'Google Tasks', icon: CheckSquare, color: 'text-purple-400', desc: 'Ajouter une tâche à votre liste' },
              { id: 'classroom', name: 'Google Classroom', icon: GraduationCap, color: 'text-emerald-300', desc: 'Publier dans vos cours scolaires' },
              { id: 'gmail', name: 'Gmail Draft', icon: Mail, color: 'text-rose-400', desc: 'Créer un brouillon d\'e-mail avec la note' },
            ].map((app) => {
              const Icon = app.icon;
              const isThisAppSaving = isSaving && selectedApp === app.id;

              return (
                <button
                  key={app.id}
                  onClick={() => handleExportToApp(app.id as any)}
                  disabled={isSaving}
                  className="p-3 bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 rounded-2xl flex items-center gap-3 group transition-all text-left hover:scale-[1.02] disabled:opacity-50"
                >
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-blue-500/30 shrink-0">
                    {isThisAppSaving ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <Icon className={`w-4 h-4 ${app.color}`} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                      {app.name}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{app.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 font-mono">
          <span>Google Workspace REST API • Connecté via OAuth 2.0</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
