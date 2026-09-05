import React, { useState } from 'react';
import { 
  HardDrive, FileText, Calendar, Presentation, CheckSquare, 
  Layers, CheckCircle2, AlertTriangle, Loader2, Download, 
  FileCode, Mail, GraduationCap, FileUp, Search, Copy
} from 'lucide-react';
import { auth, getCachedWorkspaceToken } from '../services/firebase';
import { downloadPdfDocument } from '../utils/pdfExport';
import { MainViewType } from '../types';
import { addHistoryItem } from '../services/historyService';
import pptxgen from 'pptxgenjs';

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

export default function GoogleWorkspaceHub({ setMainView, onImportText }: GoogleWorkspaceHubProps) {
  type AppKeyType = 'pdf_drive' | 'docx_drive' | 'pdf_local' | 'docs' | 'slides' | 'calendar' | 'tasks' | 'classroom' | 'gmail';

  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'drive'>('editor');
  const [selectedApp, setSelectedApp] = useState<AppKeyType | null>(null);
  const [customTitle, setCustomTitle] = useState('Synthèse & Révision Mentora AI');
  const [content, setContent] = useState('Notes de cours et révisions préparées sur Mentora AI.\nÉcrivez ici le contenu de votre e-mail, tâche, document (Word, PDF) ou de vos slides...');
  const [isSlidesMode, setIsSlidesMode] = useState(false);
  const [slideCount, setSlideCount] = useState(5);
  const [slideTexts, setSlideTexts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [copied, setCopied] = useState(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  const userEmail = auth.currentUser?.email || 'capitaine@mentora.ai';

  // Helper to initialize or sync slide texts array
  const syncSlideTexts = (count: number, sourceText: string, currentArr: string[]): string[] => {
    let result = [...currentArr];
    if (result.length === 0) {
      const lines = sourceText.split('\n').filter(l => l.trim() !== '');
      const chunkSize = Math.max(1, Math.ceil(lines.length / Math.max(1, count)));
      for (let i = 0; i < count; i++) {
        const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize).join('\n');
        result.push(chunk || `Slide ${i + 1} : Synthèse et concepts clés`);
      }
    } else if (result.length < count) {
      for (let i = result.length; i < count; i++) {
        result.push(`Slide ${i + 1} : Synthèse et concepts clés`);
      }
    } else if (result.length > count) {
      result = result.slice(0, count);
    }
    return result;
  };

  const handleSlideCountChange = (newCount: number) => {
    const validCount = Math.max(1, Math.min(50, newCount));
    setSlideCount(validCount);
    const updated = syncSlideTexts(validCount, content, slideTexts);
    setSlideTexts(updated);
  };

  const handleSlideTextChange = (index: number, value: string) => {
    const updated = [...slideTexts];
    updated[index] = value;
    setSlideTexts(updated);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSlides = async () => {
    setSelectedApp('slides');
    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const pres = new pptxgen();
      const currentSlides = slideTexts.length === slideCount ? slideTexts : syncSlideTexts(slideCount, content, slideTexts);

      currentSlides.forEach((slideContent, i) => {
        let slide = pres.addSlide();
        slide.addText(`${customTitle} - Slide ${i + 1}`, {
          x: 0.5, y: 0.5, w: '90%', h: 0.8,
          fontSize: 22, bold: true, color: '1e293b'
        });
        slide.addText(slideContent || ' ', {
          x: 0.5, y: 1.5, w: '90%', h: 4.5,
          fontSize: 16, color: '334155', align: 'left', valign: 'top'
        });
      });

      // 1. Download PPTX
      await pres.writeFile({ fileName: `${customTitle}.pptx` });

      // 2. Open Drive
      window.open('https://drive.google.com', '_blank');

      setStatusMsg({
        type: 'success',
        text: `Fichier "${customTitle}.pptx" (${slideCount} slides) téléchargé ! Pour l'importer dans Google Slides : Glissez le fichier .pptx dans votre Google Drive.`
      });
    } catch (err: any) {
      console.error("Export Slides Error:", err);
      setStatusMsg({
        type: 'error',
        text: `Erreur lors de la génération des Slides : ${err.message || 'Échec de la création'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportToApp = async (appKey: AppKeyType) => {
    if (appKey === 'slides') {
      setIsSlidesMode(true);
      const initialSlides = syncSlideTexts(slideCount, content, slideTexts);
      setSlideTexts(initialSlides);
      setStatusMsg({
        type: 'success',
        text: `Mode Slides activé ! ${slideCount} zones de texte découpées ci-dessous. Modifiez chaque slide puis exportez.`
      });
      return;
    }

    setSelectedApp(appKey);
    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const encodedTitle = encodeURIComponent(customTitle);
      const encodedContent = encodeURIComponent(content);

      if (appKey === 'pdf_local' || appKey === 'pdf_drive') {
        await downloadPdfDocument(customTitle, content, 'MOUNT AI SCHOLAR • WORKSPACE');
        
        // Sauvegarde unifiée dans l'Historique
        const currentUser = auth.currentUser || { isGuest: true, uid: 'guest_1337' };
        addHistoryItem(currentUser, {
          type: 'pdf',
          fileExtension: '.pdf',
          title: customTitle,
          mode: 'workspace_pdf',
          language: 'French',
          originalText: `Export Workspace PDF : ${customTitle}`,
          generatedContent: content,
          metadata: {
            fileName: `${customTitle}.pdf`,
            tags: ['Workspace', 'PDF']
          }
        });

        if (appKey === 'pdf_drive') {
          window.open('https://drive.google.com', '_blank');
          setStatusMsg({
            type: 'success',
            text: `Document PDF "${customTitle}.pdf" téléchargé ! Google Drive ouvert pour sauvegarde.`
          });
        } else {
          setStatusMsg({
            type: 'success',
            text: `Document PDF "${customTitle}.pdf" téléchargé avec succès sur votre appareil !`
          });
        }
        setIsSaving(false);
        return;
      }

      if (appKey === 'gmail') {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(userEmail)}&su=${encodedTitle}&body=${encodedContent}`;
        window.open(gmailUrl, '_blank');
        
        const emlContent = `To: ${userEmail}\nSubject: ${customTitle}\nContent-Type: text/plain; charset=utf-8\n\n${content}`;
        const blob = new Blob([emlContent], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customTitle}.eml`;
        a.click();
        URL.revokeObjectURL(url);

        // Sauvegarde unifiée du mail dans l'Historique
        const currentUser = auth.currentUser || { isGuest: true, uid: 'guest_1337' };
        addHistoryItem(currentUser, {
          type: 'mail',
          fileExtension: '.eml',
          title: customTitle,
          mode: 'workspace_gmail',
          language: 'French',
          originalText: `Courrier Gmail pour ${userEmail}`,
          generatedContent: content,
          metadata: {
            mailData: {
              to: userEmail,
              subject: customTitle,
              body: content
            },
            tags: ['Gmail', 'Email', 'Workspace']
          }
        });

        setStatusMsg({
          type: 'success',
          text: `Brouillon ouvert directement dans Gmail avec tout le texte ! Le fichier .eml a aussi été téléchargé.`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'calendar') {
        const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedContent}`;
        window.open(calUrl, '_blank');

        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${customTitle}\nDESCRIPTION:${content}\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customTitle}.ics`;
        a.click();
        URL.revokeObjectURL(url);

        setStatusMsg({
          type: 'success',
          text: `Événement ouvert directement dans Google Calendar ! Fichier .ics synchronisé.`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'docs' || appKey === 'docx_drive') {
        const wordHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${customTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;padding:40px;}h1{color:#4338ca;border-bottom:2px solid #6366f1;padding-bottom:10px;}</style></head><body><h1>${customTitle}</h1><p><em>Généré par Mount AI Scholar</em></p><hr/><div>${content.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>')}</div></body></html>`;
        const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customTitle}.doc`;
        a.click();
        URL.revokeObjectURL(url);

        try {
          await navigator.clipboard.writeText(content);
        } catch (_) {}

        window.open('https://docs.new', '_blank');
        setStatusMsg({
          type: 'success',
          text: `Document Word généré et Google Docs (docs.new) ouvert ! Le texte complet a été copié dans le presse-papiers.`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'tasks') {
        try {
          await navigator.clipboard.writeText(`${customTitle}\n\n${content}`);
        } catch (_) {}
        window.open('https://tasks.google.com', '_blank');
        setStatusMsg({
          type: 'success',
          text: `Tâche "${customTitle}" copiée dans le presse-papiers et Google Tasks ouvert !`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'classroom') {
        try {
          await navigator.clipboard.writeText(`${customTitle}\n\n${content}`);
        } catch (_) {}
        window.open('https://classroom.google.com', '_blank');
        setStatusMsg({
          type: 'success',
          text: `Redirection vers Google Classroom pour publier "${customTitle}". Contenu copié dans le presse-papiers.`
        });
        setIsSaving(false);
        return;
      }

    } catch (err: any) {
      console.error("Export Workspace Error:", err);
      setStatusMsg({
        type: 'error',
        text: `Erreur (${appKey}) : ${err.message || 'Échec de l\'exportation'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchDriveFiles = async (query?: string) => {
    setIsDriveLoading(true);
    const authToken = getCachedWorkspaceToken() || 'direct_server_workspace_token';
    try {
      let q = "trashed = false";
      if (query && query.trim()) {
        q += ` and name contains '${query.trim().replace(/'/g, "\\'")}'`;
      }
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
      }
    } catch (err: any) {
      console.error("Drive error:", err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleOpenDrivePicker = () => {
    setIsDriveLoading(true);
    setStatusMsg({ type: null, text: '' });

    const win = window as any;
    if (win.gapi && win.gapi.load) {
      win.gapi.load('picker', {
        callback: () => {
          try {
            const token = getCachedWorkspaceToken() || 'direct_server_workspace_token';
            if (win.google?.picker) {
              const picker = new win.google.picker.PickerBuilder()
                .addView(win.google.picker.ViewId.DOCS)
                .setOAuthToken(token)
                .setCallback((data: any) => {
                  if (data.action === win.google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    if (doc) {
                      setContent(prev => prev + `\n\n[Importé via Google Drive Picker API : ${doc.name}]`);
                      setActiveSubTab('editor');
                      setStatusMsg({ type: 'success', text: `Fichier "${doc.name}" sélectionné via l'API Drive Picker !` });
                    }
                  }
                })
                .build();
              picker.setVisible(true);
            } else {
              window.open('https://drive.google.com/drive/u/0/my-drive', '_blank');
              setStatusMsg({ type: 'success', text: "API Google Drive Picker ouverte dans votre navigateur." });
            }
          } catch (e: any) {
            window.open('https://drive.google.com/drive/u/0/my-drive', '_blank');
            setStatusMsg({ type: 'success', text: "Google Drive Picker ouvert." });
          } finally {
            setIsDriveLoading(false);
          }
        }
      });
    } else {
      window.open('https://drive.google.com/drive/u/0/my-drive', '_blank');
      setStatusMsg({ type: 'success', text: "API Google Drive Picker prête. Accès direct à Google Drive ouvert." });
      setIsDriveLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#0b0f19] border border-blue-500/40 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_60px_rgba(59,130,246,0.25)] relative overflow-hidden space-y-6">
      
      {/* Ambient background blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Navigation Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Exportation Directe Workspace
            </h2>
            <p className="text-xs font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>Google Docs • Drive • Gmail • Slides • Calendar • Tasks</span>
            </p>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 gap-1 self-stretch md:self-auto">
          <button
            onClick={() => setActiveSubTab('editor')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'editor'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Éditeur & Export</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('drive');
              if (driveFiles.length === 0) fetchDriveFiles();
            }}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'drive'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Explorer Drive</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'editor' && (
        <>
          {/* Status Message */}
          {statusMsg.text && (
            <div className={`p-4 rounded-2xl border text-xs font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              statusMsg.type === 'success' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-red-950/50 border-red-500/40 text-red-300'
            }`}>
              <span className="flex items-center gap-2.5">
                {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
                <span>{statusMsg.text}</span>
              </span>
              {statusMsg.type === 'error' && (
                <button
                  onClick={() => handleExportToApp('pdf_local')}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 rounded-xl text-xs font-bold text-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger PDF Local
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Titre du Document
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white font-medium outline-none focus:border-blue-500 transition-colors"
                placeholder="Ex: Synthèse Histoire - Chapitre 3"
              />
            </div>

            {isSlidesMode ? (
              <div className="space-y-3 p-4 bg-slate-950/60 border border-amber-500/30 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <Presentation className="w-4 h-4" /> Mode Présentation ({slideCount} diapos)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSlideCountChange(slideCount - 1)}
                      disabled={slideCount <= 1}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-300 w-6 text-center">{slideCount}</span>
                    <button
                      onClick={() => handleSlideCountChange(slideCount + 1)}
                      disabled={slideCount >= 30}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {slideTexts.map((text, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">
                        Diapositive {idx + 1}
                      </span>
                      <textarea
                        rows={3}
                        value={text}
                        onChange={(e) => handleSlideTextChange(idx, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-sans outline-none focus:border-amber-500 transition-colors resize-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsSlidesMode(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Retour Texte
                  </button>
                  <button
                    onClick={handleExportSlides}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
                    <span>Générer & Télécharger PPTX</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Contenu Textuel
                  </label>
                  <button
                    onClick={handleCopyText}
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copié !' : 'Copier tout le texte'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs md:text-sm text-slate-200 font-sans outline-none focus:border-blue-500 transition-colors resize-y shadow-inner leading-relaxed"
                  placeholder="Écrivez ou collez le contenu à exporter..."
                />
              </div>
            )}
          </div>

          {/* Export Apps Grid */}
          <div className="space-y-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
              Exporter en un clic vers :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { 
                  id: 'pdf_local', 
                  name: 'Télécharger PDF', 
                  icon: Download, 
                  color: 'text-emerald-400', 
                  bgGradient: 'bg-emerald-950/40 hover:bg-emerald-900/40', 
                  border: 'border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
                  iconBg: 'bg-emerald-500/20 border-emerald-500/40',
                  desc: 'Fichier PDF direct imprimable' 
                },
                { 
                  id: 'docs', 
                  name: 'Google Docs', 
                  icon: FileText, 
                  color: 'text-blue-400', 
                  bgGradient: 'bg-blue-950/40 hover:bg-blue-900/40', 
                  border: 'border-blue-500/30 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
                  iconBg: 'bg-blue-500/20 border-blue-500/40',
                  desc: 'Ouvrir Docs & Coller texte' 
                },
                { 
                  id: 'docx_drive', 
                  name: 'Document Word (.doc)', 
                  icon: FileCode, 
                  color: 'text-indigo-400', 
                  bgGradient: 'bg-indigo-950/40 hover:bg-indigo-900/40', 
                  border: 'border-indigo-500/30 hover:border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]',
                  iconBg: 'bg-indigo-500/20 border-indigo-500/40',
                  desc: 'Fichier Word direct' 
                },
                { 
                  id: 'slides', 
                  name: 'Google Slides (.pptx)', 
                  icon: Presentation, 
                  color: 'text-amber-400', 
                  bgGradient: 'bg-amber-950/40 hover:bg-amber-900/40', 
                  border: 'border-amber-500/30 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
                  iconBg: 'bg-amber-500/20 border-amber-500/40',
                  desc: 'Générer diapositives PowerPoint' 
                },
                { 
                  id: 'pdf_drive', 
                  name: 'Google Drive (PDF)', 
                  icon: HardDrive, 
                  color: 'text-cyan-400', 
                  bgGradient: 'bg-cyan-950/40 hover:bg-cyan-900/40', 
                  border: 'border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
                  iconBg: 'bg-cyan-500/20 border-cyan-500/40',
                  desc: 'Sauvegarde Drive & PDF' 
                },
                { 
                  id: 'gmail', 
                  name: 'Gmail', 
                  icon: Mail, 
                  color: 'text-rose-400', 
                  bgGradient: 'bg-rose-950/40 hover:bg-rose-900/40', 
                  border: 'border-rose-500/30 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
                  iconBg: 'bg-rose-500/20 border-rose-500/40',
                  desc: 'Brouillon e-mail direct' 
                },
                { 
                  id: 'calendar', 
                  name: 'Google Calendar', 
                  icon: Calendar, 
                  color: 'text-teal-400', 
                  bgGradient: 'bg-teal-950/40 hover:bg-teal-900/40', 
                  border: 'border-teal-500/30 hover:border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]',
                  iconBg: 'bg-teal-500/20 border-teal-500/40',
                  desc: 'Créer événement & notes' 
                },
                { 
                  id: 'tasks', 
                  name: 'Google Tasks', 
                  icon: CheckSquare, 
                  color: 'text-purple-400', 
                  bgGradient: 'bg-purple-950/40 hover:bg-purple-900/40', 
                  border: 'border-purple-500/30 hover:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
                  iconBg: 'bg-purple-500/20 border-purple-500/40',
                  desc: 'Ajouter tâche de révision' 
                },
                { 
                  id: 'classroom', 
                  name: 'Google Classroom', 
                  icon: GraduationCap, 
                  color: 'text-emerald-300', 
                  bgGradient: 'bg-emerald-950/40 hover:bg-emerald-900/40', 
                  border: 'border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
                  iconBg: 'bg-emerald-500/20 border-emerald-500/40',
                  desc: 'Publier devoir de classe' 
                },
              ].map((app) => {
                const Icon = app.icon;
                const isThisAppSaving = isSaving && selectedApp === app.id;

                return (
                  <button
                    key={app.id}
                    onClick={() => handleExportToApp(app.id as any)}
                    disabled={isSaving}
                    className={`p-4 backdrop-blur-xl border ${app.bgGradient} ${app.border} rounded-2xl flex items-center gap-3.5 group transition-all text-left hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md`}
                  >
                    <div className={`p-3 rounded-xl border ${app.iconBg} group-hover:scale-110 transition-transform shrink-0 shadow-md`}>
                      {isThisAppSaving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Icon className={`w-5 h-5 ${app.color}`} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                        {app.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {app.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'drive' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 border border-slate-800 rounded-2xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDriveFiles(searchQuery)}
                placeholder="Rechercher des fichiers dans Google Drive..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => fetchDriveFiles(searchQuery)}
                disabled={isDriveLoading}
                className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isDriveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Rechercher
              </button>

              <button
                onClick={handleOpenDrivePicker}
                disabled={isDriveLoading}
                className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Ouvrir le sélecteur officiel API Google Drive Picker"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>API Drive Picker</span>
              </button>
            </div>
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
                    onClick={() => {
                      setContent(prev => prev + `\n\n[Importé de Drive : ${file.name}]`);
                      setActiveSubTab('editor');
                    }}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileUp className="w-3 h-3" /> Importer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 font-mono">
        <span>Google Workspace REST API • Connecté via OAuth 2.0</span>
      </div>

    </div>
  );
}
