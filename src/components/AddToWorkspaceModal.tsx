import React, { useState, useEffect } from 'react';
import { 
  HardDrive, FileText, Calendar, Presentation, CheckSquare, 
  Layers, CheckCircle2, AlertTriangle, Loader2, X, Mail, GraduationCap, Download, FileCode, Copy
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
  const [content, setContent] = useState(textToSave || 'Notes de cours et révisions préparées sur Mentora AI.');
  const [isSlidesMode, setIsSlidesMode] = useState(false);
  const [slideCount, setSlideCount] = useState(5);
  const [slideTexts, setSlideTexts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [copied, setCopied] = useState(false);

  // Sync state whenever props change
  useEffect(() => {
    if (isOpen) {
      const activeTitle = title && title.trim().length > 0 ? title : 'Synthèse de cours - Mentora AI';
      const activeContent = textToSave && textToSave.trim().length > 0 
        ? textToSave 
        : 'Notes de cours, révisions et synthèse cognitive générées par Mount AI Scholar.';
      setCustomTitle(activeTitle);
      setContent(activeContent);
      setStatusMsg({ type: null, text: '' });
      setIsSlidesMode(false);
    }
  }, [isOpen, title, textToSave]);

  if (!isOpen) return null;

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
        slide.addText(`${customTitle} - Diapositive ${i + 1}`, {
          x: 0.5, y: 0.5, w: '90%', h: 0.8,
          fontSize: 22, bold: true, color: '1e293b'
        });
        slide.addText(slideContent || ' ', {
          x: 0.5, y: 1.5, w: '90%', h: 4.5,
          fontSize: 16, color: '334155', align: 'left', valign: 'top'
        });
      });

      // 1. Download the PPTX file
      await pres.writeFile({ fileName: `${customTitle}.pptx` });

      // 2. Open Google Drive upload page directly
      window.open('https://drive.google.com', '_blank');

      setStatusMsg({
        type: 'success',
        text: `Fichier "${customTitle}.pptx" (${slideCount} slides) téléchargé ! Pour Google Slides : glissez le fichier dans Google Drive.`
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
        text: `Mode Slides activé ! ${slideCount} zones de texte prêtes. Modifiez les slides puis cliquez sur "Générer & Exporter Présentation PPTX".`
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
        if (appKey === 'pdf_drive') {
          window.open('https://drive.google.com', '_blank');
          setStatusMsg({
            type: 'success',
            text: `Document PDF "${customTitle}.pdf" téléchargé ! Google Drive ouvert pour sauvegarde.`
          });
        } else {
          setStatusMsg({
            type: 'success',
            text: `Document PDF "${customTitle}.pdf" téléchargé directement avec succès !`
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
          text: `Brouillon ouvert directement dans Gmail avec le texte complet ! Fichier .eml téléchargé.`
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
          text: `Événement créé dans Google Calendar avec tout le contenu ! Fichier .ics synchronisé.`
        });
        setIsSaving(false);
        return;
      }

      if (appKey === 'docs' || appKey === 'docx_drive') {
        // Generate real HTML-based Word document with formatted paragraphs
        const wordHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${customTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;padding:40px;}h1{color:#4338ca;border-bottom:2px solid #6366f1;padding-bottom:10px;}</style></head><body><h1>${customTitle}</h1><p><em>Généré par Mount AI Scholar</em></p><hr/><div>${content.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>')}</div></body></html>`;
        const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customTitle}.doc`;
        a.click();
        URL.revokeObjectURL(url);

        // Copy text to clipboard so user can instantly paste in Google Docs
        try {
          await navigator.clipboard.writeText(content);
        } catch (_) {}

        window.open('https://docs.new', '_blank');
        setStatusMsg({
          type: 'success',
          text: `Document téléversable généré et Google Docs ouvert ! Le texte complet a aussi été copié dans votre presse-papiers (Ctrl+V pour coller).`
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
          text: `Redirection vers Google Classroom. Contenu copié pour publication rapide.`
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-white shadow-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Export Google Workspace & Documents
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Sauvegarde directe vers PDF, Google Docs, Drive, Slides & Gmail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Editor Area */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Titre du Document
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none focus:border-blue-500 transition-colors"
              placeholder="Titre du document..."
            />
          </div>

          {isSlidesMode ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Presentation className="w-3.5 h-3.5" /> Découpage Diapositives ({slideCount} slides)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSlideCountChange(slideCount - 1)}
                    disabled={slideCount <= 1}
                    className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300 w-6 text-center">{slideCount}</span>
                  <button
                    onClick={() => handleSlideCountChange(slideCount + 1)}
                    disabled={slideCount >= 30}
                    className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {slideTexts.map((text, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      Slide {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={text}
                      onChange={(e) => handleSlideTextChange(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-sans outline-none focus:border-amber-500 transition-colors resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsSlidesMode(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Retour Texte
                </button>
                <button
                  onClick={handleExportSlides}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5" />}
                  <span>Générer & Télécharger PPTX</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Contenu à Exporter
                </label>
                <button
                  onClick={handleCopyText}
                  className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copié !' : 'Copier texte'}</span>
                </button>
              </div>
              
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs md:text-sm text-slate-200 font-sans outline-none focus:border-blue-500 transition-colors resize-y shadow-inner leading-relaxed"
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
              { id: 'pdf_local', name: 'Télécharger PDF', icon: Download, color: 'text-emerald-400', desc: 'Fichier PDF direct' },
              { id: 'docs', name: 'Google Docs', icon: FileText, color: 'text-indigo-400', desc: 'Ouvrir Docs & Coller' },
              { id: 'docx_drive', name: 'Word (.doc)', icon: FileCode, color: 'text-blue-400', desc: 'Document Word direct' },
              { id: 'slides', name: 'Slides (.pptx)', icon: Presentation, color: 'text-amber-400', desc: 'Présentation PPTX' },
              { id: 'pdf_drive', name: 'Google Drive', icon: HardDrive, color: 'text-red-400', desc: 'Dépôt Drive & PDF' },
              { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-rose-400', desc: 'Brouillon e-mail' },
              { id: 'calendar', name: 'Google Calendar', icon: Calendar, color: 'text-emerald-400', desc: 'Événement & Notes' },
              { id: 'tasks', name: 'Google Tasks', icon: CheckSquare, color: 'text-purple-400', desc: 'Ajouter une tâche' },
              { id: 'classroom', name: 'Google Classroom', icon: GraduationCap, color: 'text-emerald-300', desc: 'Publier devoir' },
            ].map((app) => {
              const Icon = app.icon;
              const isThisAppSaving = isSaving && selectedApp === app.id;

              return (
                <button
                  key={app.id}
                  onClick={() => handleExportToApp(app.id as any)}
                  disabled={isSaving}
                  className="p-3 bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 rounded-2xl flex items-center gap-3 group transition-all text-left hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                >
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-blue-500/30 shrink-0">
                    {isThisAppSaving ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <Icon className={`w-4 h-4 ${app.color}`} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                      {app.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {app.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 font-mono">
          <span>Mount AI Scholar • Exportation Sécurisée Sans Fuite Cloud</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
