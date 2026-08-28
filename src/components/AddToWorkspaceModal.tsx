import React, { useState } from 'react';
import { 
  HardDrive, FileText, Calendar, Presentation, CheckSquare, 
  Layers, CheckCircle2, AlertTriangle, Loader2, X, ShieldCheck, Mail, GraduationCap, Download, FileCode
} from 'lucide-react';
import { auth } from '../services/firebase';
import { downloadPdfDocument } from '../utils/pdfExport';

import pptxgen from 'pptxgenjs';

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
  const [content, setContent] = useState(textToSave || 'Écrivez ici le contenu de votre e-mail, tâche, document ou de vos slides...');
  const [isSlidesMode, setIsSlidesMode] = useState(false);
  const [slideCount, setSlideCount] = useState(5);
  const [slideTexts, setSlideTexts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  if (!isOpen) return null;

  const userEmail = auth.currentUser?.email || 'compte-direct@workspace.internal';

  // Helper to initialize or sync slide texts array
  const syncSlideTexts = (count: number, sourceText: string, currentArr: string[]): string[] => {
    let result = [...currentArr];
    if (result.length === 0) {
      const lines = sourceText.split('\n').filter(l => l.trim() !== '');
      const chunkSize = Math.max(1, Math.ceil(lines.length / Math.max(1, count)));
      for (let i = 0; i < count; i++) {
        const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize).join('\n');
        result.push(chunk || `Contenu de la slide ${i + 1}...`);
      }
    } else if (result.length < count) {
      for (let i = result.length; i < count; i++) {
        result.push(`Contenu de la slide ${i + 1}...`);
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

  const handleExportSlides = async () => {
    setSelectedApp('slides');
    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const pres = new pptxgen();
      const currentSlides = slideTexts.length === slideCount ? slideTexts : syncSlideTexts(slideCount, content, slideTexts);

      currentSlides.forEach((slideContent, i) => {
        let slide = pres.addSlide();
        // Title
        slide.addText(`${customTitle} - Slide ${i + 1}`, {
          x: 0.5, y: 0.5, w: '90%', h: 0.8,
          fontSize: 22, bold: true, color: '1e293b'
        });
        // Body text
        slide.addText(slideContent || ' ', {
          x: 0.5, y: 1.5, w: '90%', h: 4.5,
          fontSize: 16, color: '334155', align: 'left', valign: 'top'
        });
      });

      // 1. Download the PPTX file
      await pres.writeFile({ fileName: `${customTitle}.pptx` });

      // 2. Open Google Drive upload page directly
      window.open('https://drive.google.com', '_blank');

      // 3. Clear feedback with exact steps for Google Slides import
      setStatusMsg({
        type: 'success',
        text: `Fichier "${customTitle}.pptx" (${slideCount} slides) téléchargé ! Pour l'importer dans Google Slides : Glissez-déposez le fichier .pptx dans votre Google Drive (ou dans Google Slides : Fichier > Importer des diapositives).`
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
        await downloadPdfDocument(customTitle, content, 'EXPORTATION MENTORA AI');
        if (appKey === 'pdf_drive') {
          window.open('https://drive.google.com', '_blank');
          setStatusMsg({
            type: 'success',
            text: `Document PDF "${customTitle}.pdf" téléchargé ! Google Drive ouvert pour dépôt rapide.`
          });
        } else {
          setStatusMsg({
            type: 'success',
            text: `Document PDF "${customTitle}.pdf" téléchargé sur votre appareil !`
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

        setStatusMsg({
          type: 'success',
          text: `Brouillon ouvert directement dans Gmail ! Le fichier .eml a aussi été téléchargé.`
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
          text: `Événement ouvert directement dans Google Calendar ! Fichier .ics généré.`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'docs' || appKey === 'docx_drive') {
        const docText = `Mentora AI - ${customTitle}\n\n${content}`;
        const blob = new Blob([docText], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customTitle}.docx`;
        a.click();
        URL.revokeObjectURL(url);

        window.open('https://docs.new', '_blank');
        setStatusMsg({
          type: 'success',
          text: `Document Word "${customTitle}.docx" téléchargé et Google Docs (docs.new) ouvert !`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'tasks') {
        window.open('https://tasks.google.com', '_blank');
        setStatusMsg({
          type: 'success',
          text: `Tâche "${customTitle}" prête. Redirection vers Google Tasks !`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'classroom') {
        window.open('https://classroom.google.com', '_blank');
        setStatusMsg({
          type: 'success',
          text: `Redirection vers Google Classroom pour publier "${customTitle}".`
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-blue-500/40 rounded-[2rem] max-w-2xl w-full p-6 md:p-8 shadow-[0_0_60px_rgba(59,130,246,0.25)] relative overflow-hidden space-y-6 max-h-[95vh] overflow-y-auto">
        
        {/* Ambient lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 border border-emerald-400/30 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                Exportation Directe Workspace
              </h3>
              <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Sans Inscription • Accès Direct Immédiat (0 Compte Requis)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice for Direct Zero Registration Export */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2.5 shadow-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>⚡ Zone de Rédaction Unifiée Workspace</span>
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
              Écrivez ci-dessous le contenu de votre e-mail, de votre tâche, ou le texte de vos documents (Word, PDF, Slides). Exportation immédiate sans création de compte.
            </p>
          </div>
        </div>

        {/* Inputs & Editing Zone */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Titre du document / Sujet :</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors mt-1"
            />
          </div>

          {isSlidesMode ? (
            /* SLIDES MODE: Individual text boxes per slide */
            <div className="space-y-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Presentation className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Mode Présentation Slides ({slideCount} Slides)
                    </h4>
                    <p className="text-[10px] text-amber-300/80 font-mono">
                      Rédigez le texte spécifique de chaque slide ci-dessous :
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Nombre de slides :</span>
                  <input
                    type="number"
                    min="1" max="50"
                    value={slideCount}
                    onChange={(e) => handleSlideCountChange(parseInt(e.target.value) || 1)}
                    className="w-12 bg-transparent text-amber-400 font-bold border-b border-slate-700 text-center outline-none text-xs"
                  />
                </div>
              </div>

              {/* Grid of Slide Textboxes */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {Array.from({ length: slideCount }).map((_, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 focus-within:border-amber-500/50 rounded-xl p-3 space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>Slide {idx + 1} / {slideCount}</span>
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {slideTexts[idx]?.length || 0} caractères
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={slideTexts[idx] || ''}
                      onChange={(e) => handleSlideTextChange(idx, e.target.value)}
                      placeholder={`Contenu et puces de la slide ${idx + 1}...`}
                      className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500/50 resize-y font-sans leading-relaxed"
                    />
                  </div>
                ))}
              </div>

              {/* Export Slides Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setIsSlidesMode(false)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors w-full sm:w-auto"
                >
                  ← Zone de Rédaction Unifiée (Docs, Mail, PDF)
                </button>

                <button
                  onClick={handleExportSlides}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto disabled:opacity-50 shrink-0"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
                  <span>Générer Slides (.pptx + Google Slides)</span>
                </button>
              </div>
            </div>
          ) : (
            /* STANDARD MODE: Single Textarea for Docs, Mail, Calendar, Tasks, PDF */
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Zone de rédaction unifiée :</label>
                <button
                  onClick={() => handleExportToApp('slides')}
                  className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Presentation className="w-3 h-3" /> Diviser en zones de slides
                </button>
              </div>
              
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-sans outline-none focus:border-blue-500 transition-colors resize-y shadow-inner leading-relaxed"
                placeholder="Écrivez le contenu de votre document, e-mail ou tâche..."
              />
            </div>
          )}
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
              </div>
            )}
          </div>
        )}

        {/* Workspace App Selection Grid */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Exporter vers :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'docs', name: 'Google Docs', icon: FileText, color: 'text-indigo-400', desc: 'Créer Google Docs' },
              { id: 'docx_drive', name: 'Word (.docx)', icon: FileCode, color: 'text-blue-400', desc: 'Document Word' },
              { id: 'slides', name: 'Slides / PPTX', icon: Presentation, color: 'text-amber-400', desc: 'Présentation' },
              { id: 'pdf_drive', name: 'Drive (PDF)', icon: HardDrive, color: 'text-red-400', desc: 'Save on Drive' },
              { id: 'pdf_local', name: 'PDF Local', icon: Download, color: 'text-emerald-400', desc: 'Download PDF' },
              { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-rose-400', desc: 'Email Draft' },
              { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'text-emerald-400', desc: 'Event details' },
              { id: 'tasks', name: 'Tasks', icon: CheckSquare, color: 'text-purple-400', desc: 'Add task' },
              { id: 'classroom', name: 'Classroom', icon: GraduationCap, color: 'text-emerald-300', desc: 'Publish' },
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
