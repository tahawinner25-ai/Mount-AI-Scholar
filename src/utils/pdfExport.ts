import { jsPDF } from 'jspdf';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface MindmapBranchData {
  name: string;
  icon?: string;
  description: string;
  subnodes: string[];
}

export interface MindmapExportData {
  title: string;
  root?: string;
  nodes?: Array<{ id: string; label: string; details?: string; category?: string }>;
  edges?: Array<{ from: string; to: string }>;
  branches?: MindmapBranchData[];
  mermaid?: string;
  badge?: string;
}

export interface QuizQuestionData {
  id?: number | string;
  question?: string;
  text?: string;
  options: string[];
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
}

export interface QuizExportData {
  title: string;
  topic?: string;
  questions: QuizQuestionData[];
  score?: number;
  total?: number;
  badge?: string;
  date?: string;
}

export interface SummaryExportData {
  title: string;
  topic?: string;
  summary: string;
  keyPoints?: string[];
  sourceDoc?: string;
  badge?: string;
}

/**
 * Fallback direct PDF generator using jsPDF vector engine.
 * Guaranteed 100% reliable even in headless or restricted browser environments.
 */
function downloadPdfDirectVector(title: string, sections: { heading: string; lines: string[] }[], badge: string = 'MOUNT AI SCHOLAR') {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxLineWidth = pageWidth - (margin * 2);
  let cursorY = margin;

  // Header Banner
  doc.setFillColor(99, 102, 241); // indigo 500
  doc.rect(margin, cursorY, maxLineWidth, 3, 'F');
  cursorY += 16;

  // Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(99, 102, 241);
  doc.text(badge.toUpperCase(), margin, cursorY);
  cursorY += 16;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(title, maxLineWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += (titleLines.length * 20) + 6;

  // Date & Verification Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const dateStr = `Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Mount AI Scholar Core (Verified Study Sheet)`;
  doc.text(dateStr, margin, cursorY);
  cursorY += 16;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 20;

  // Content Sections
  sections.forEach(sec => {
    // Check page space for section heading
    if (cursorY > pageHeight - 80) {
      doc.addPage();
      cursorY = margin + 20;
    }

    if (sec.heading) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(sec.heading, margin, cursorY);
      cursorY += 16;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    sec.lines.forEach(rawText => {
      const wrappedLines = doc.splitTextToSize(rawText, maxLineWidth);
      wrappedLines.forEach((line: string) => {
        if (cursorY > pageHeight - 50) {
          doc.addPage();
          cursorY = margin + 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 14;
      });
      cursorY += 6;
    });

    cursorY += 10;
  });

  // Footer on each page
  const totalPages = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    doc.text(`Mount AI Scholar • Moteur Cognitif & Écosystème d'Étude • Page ${i}/${totalPages}`, margin, pageHeight - 16);
  }

  const cleanFilename = `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_Mount_AI.pdf`;
  doc.save(cleanFilename);
}

const COMMON_PDF_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0f172a;
  background-color: #ffffff;
  width: 780px;
  min-height: 400px;
  padding: 32px 36px;
  box-sizing: border-box;
  margin: 0;
  line-height: 1.5;
`;

const HEADER_TEMPLATE = (title: string, badge: string, subtitle?: string) => `
  <div style="border-bottom: 2px solid #6366f1; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
    <div style="max-width: 540px;">
      <div style="font-size: 10px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 3px;">
        ${badge}
      </div>
      <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.25;">
        ${title}
      </h1>
      <p style="font-size: 10px; color: #64748b; margin-top: 4px; margin-bottom: 0;">
        ${subtitle || `Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Mount AI Scholar Core (Gemini AI)`}
      </p>
    </div>
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; text-align: right; min-width: 140px;">
      <span style="font-size: 10px; font-weight: 800; color: #1e293b; display: block; letter-spacing: 0.5px;">MOUNT AI SCHOLAR</span>
      <span style="font-size: 8px; color: #64748b; font-family: monospace; text-transform: uppercase;">Verified Study Sheet</span>
    </div>
  </div>
`;

const FOOTER_TEMPLATE = () => `
  <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; font-family: monospace;">
    <span>Mount AI Scholar • Moteur Cognitif & Écosystème d'Étude (Gemini AI)</span>
    <span>Page Document d'Apprentissage • Imprimable</span>
  </div>
`;

/**
 * Helper to prepare a visible off-screen rendering element for html2canvas
 */
function createRenderContainer(htmlContent: string, customWidth?: string): HTMLDivElement {
  const container = document.createElement('div');
  // Use left: -10000px and top: 0 with opacity: 1 and visibility: visible so html2canvas renders all text & layout properly without producing blank canvas
  container.setAttribute('style', `position: absolute; left: -10000px; top: 0; z-index: -9999; visibility: visible; opacity: 1; pointer-events: none; ${COMMON_PDF_STYLES} ${customWidth ? `width: ${customWidth};` : ''}`);
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  return container;
}

/**
 * Standard General PDF exporter with automatic vector fallback
 */
export async function downloadPdfDocument(title: string, content: string, badge?: string) {
  const safeContent = content || 'Document sans contenu textuel spécifique.';

  const formattedContent = safeContent
    .replace(/\n\n+/g, '</p><p style="margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">')
    .replace(/\n/g, '<br/>');

  const html = `
    ${HEADER_TEMPLATE(title, badge || 'MOUNT AI SCHOLAR • RAPPORT D\'ÉTUDE')}
    
    <div style="font-size: 12px; line-height: 1.65; color: #334155; background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
      <p style="margin-top: 0; margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">
        ${formattedContent}
      </p>
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  const container = createRenderContainer(html);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_Mount_AI.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollY: 0, scrollX: 0 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.warn("[PDF EXPORT] html2pdf failed, switching to vector jsPDF engine:", err);
    const lines = safeContent.split('\n').filter(l => l.trim().length > 0);
    downloadPdfDirectVector(title, [{ heading: 'Contenu du Document', lines }], badge || 'MOUNT AI SCHOLAR');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Export Learning Summary & Revision Sheet to a clean, highly structured PDF
 */
export async function exportSummaryToPdf(data: SummaryExportData) {
  const keyPointsHtml = data.keyPoints && data.keyPoints.length > 0 ? `
    <div style="margin-bottom: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px;">
      <div style="font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
        💡 Points Clés & Mémorisation Rapide
      </div>
      <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: #1e3a8a; line-height: 1.5;">
        ${data.keyPoints.map(pt => `<li style="margin-bottom: 4px;">${pt}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const paragraphs = (data.summary || '')
    .split(/\n\n+/)
    .filter(Boolean)
    .map(p => `<p style="margin-bottom: 10px; font-size: 11.5px; line-height: 1.6; color: #1e293b;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const html = `
    ${HEADER_TEMPLATE(data.title, data.badge || 'FICHE DE SYNTHÈSE & RÉVISION', data.sourceDoc ? `Document Source : ${data.sourceDoc}` : undefined)}
    
    ${keyPointsHtml}

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
      <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
        📖 Contenu Détaillé de la Synthèse
      </div>
      <div style="font-size: 11.5px; line-height: 1.65; color: #334155;">
        ${paragraphs || '<p>Synthèse générale du cours et points méthodologiques.</p>'}
      </div>
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  const container = createRenderContainer(html);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `Synthese_${data.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollY: 0, scrollX: 0 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.warn("[PDF EXPORT] html2pdf failed, fallback to jsPDF:", err);
    const sections = [];
    if (data.keyPoints && data.keyPoints.length > 0) {
      sections.push({ heading: 'POINTS CLES', lines: data.keyPoints.map(p => `• ${p}`) });
    }
    const summaryLines = (data.summary || '').split('\n').filter(l => l.trim().length > 0);
    sections.push({ heading: 'SYNTHESE DU COURS', lines: summaryLines });
    downloadPdfDirectVector(data.title, sections, data.badge || 'FICHE DE SYNTHESE');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Export Mindmap / Concept Network to a clean printable PDF
 */
export async function exportMindmapToPdf(data: MindmapExportData) {
  // Build branch cards or node list
  let branchesHtml = '';

  if (data.branches && data.branches.length > 0) {
    branchesHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        ${data.branches.map((b) => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 12px; break-inside: avoid;">
            <div style="font-size: 12px; font-weight: 800; color: #1e1b4b; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>${b.icon || '🧠'}</span>
              <span>${b.name}</span>
            </div>
            <div style="font-size: 10.5px; color: #475569; margin-bottom: 8px; line-height: 1.4;">
              ${b.description}
            </div>
            ${b.subnodes && b.subnodes.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${b.subnodes.map(sub => `
                  <span style="font-size: 9px; font-weight: 600; background: #ede9fe; color: #6d28d9; padding: 2px 6px; border-radius: 4px; border: 1px solid #ddd6fe;">
                    • ${sub}
                  </span>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else if (data.nodes && data.nodes.length > 0) {
    const coreNodes = data.nodes.filter(n => n.category === 'core' || !n.category);
    const subNodes = data.nodes.filter(n => n.category !== 'core' && n.category);

    branchesHtml = `
      <div style="margin-bottom: 16px;">
        <div style="background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 8px; padding: 12px; margin-bottom: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; color: #6d28d9; text-transform: uppercase;">Nœud Central</div>
          <div style="font-size: 16px; font-weight: 900; color: #4c1d95; margin-top: 2px;">${coreNodes[0]?.label || data.root || data.title}</div>
          ${coreNodes[0]?.details ? `<div style="font-size: 10px; color: #5b21b6; margin-top: 4px;">${coreNodes[0].details}</div>` : ''}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${(subNodes.length > 0 ? subNodes : data.nodes.slice(1)).map((node, i) => `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; break-inside: avoid;">
              <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
                ${i + 1}. ${node.label}
              </div>
              <div style="font-size: 10px; color: #475569; line-height: 1.4;">
                ${node.details || 'Branche conceptuelle associée au modèle mental.'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    branchesHtml = `
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; color: #475569;">
        Représentation conceptuelle du sujet : ${data.root || data.title}
      </div>
    `;
  }

  const html = `
    ${HEADER_TEMPLATE(data.title, data.badge || 'CARTE MENTALE & RÉSEAU DE CONCEPTS', `Sujet Central : ${data.root || data.title}`)}

    ${branchesHtml}

    ${FOOTER_TEMPLATE()}
  `;

  const container = createRenderContainer(html, '840px');

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `Carte_Mentale_${data.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollY: 0, scrollX: 0 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.warn("[PDF EXPORT] html2pdf failed for mindmap, using jsPDF fallback:", err);
    const sections = [];
    if (data.nodes && data.nodes.length > 0) {
      sections.push({
        heading: 'NOEUDS CONCEPTUELS',
        lines: data.nodes.map((n, i) => `${i + 1}. ${n.label}${n.details ? ` : ${n.details}` : ''}`)
      });
    }
    if (data.branches && data.branches.length > 0) {
      data.branches.forEach(b => {
        sections.push({
          heading: b.name.toUpperCase(),
          lines: [b.description, ...(b.subnodes || []).map(s => `  - ${s}`)]
        });
      });
    }
    downloadPdfDirectVector(data.title, sections, data.badge || 'CARTE MENTALE');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Export Adaptive Quiz & Correction Sheet to a printable PDF
 */
export async function exportQuizToPdf(data: QuizExportData) {
  const questionsHtml = data.questions.map((q, idx) => {
    const qText = q.question || q.text || `Question ${idx + 1}`;
    const ansKey = q.answer || q.correctAnswer || '';

    return `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; break-inside: avoid;">
        <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
          <span style="background: #ede9fe; color: #6d28d9; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 6px;">Q${idx + 1}</span>
          ${qText}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
          ${q.options.map((opt) => {
            const isCorrect = ansKey && (opt.trim().toUpperCase().startsWith(ansKey.trim().toUpperCase()) || opt.trim() === ansKey.trim());
            return `
              <div style="font-size: 10px; padding: 6px 8px; border-radius: 6px; border: 1px solid ${isCorrect ? '#86efac' : '#e2e8f0'}; background: ${isCorrect ? '#f0fdf4' : '#ffffff'}; color: ${isCorrect ? '#166534' : '#334155'}; font-weight: ${isCorrect ? '700' : '500'};">
                ${opt} ${isCorrect ? '✓' : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${q.explanation ? `
          <div style="font-size: 9.5px; color: #475569; background: #ffffff; border-left: 3px solid #6366f1; padding: 4px 8px; border-radius: 0 4px 4px 0;">
            <strong>Explication :</strong> ${q.explanation}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const html = `
    ${HEADER_TEMPLATE(data.title, data.badge || 'ÉVALUATION & QUIZ ADAPTATIF', data.score !== undefined && data.total !== undefined ? `Score : ${data.score}/${data.total} (${Math.round((data.score / data.total) * 100)}%) • Évaluation Mount AI (Gemini AI)` : `Sujet : ${data.topic || data.title}`)}

    <div style="margin-bottom: 16px;">
      ${questionsHtml}
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  const container = createRenderContainer(html);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `Quiz_${data.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollY: 0, scrollX: 0 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.warn("[PDF EXPORT] html2pdf failed for quiz, using jsPDF fallback:", err);
    const sections = data.questions.map((q, idx) => {
      const qText = q.question || q.text || `Question ${idx + 1}`;
      const ans = q.answer || q.correctAnswer || '';
      return {
        heading: `QUESTION ${idx + 1}: ${qText}`,
        lines: [
          ...q.options.map(opt => `  - ${opt}`),
          ans ? `Bonne Réponse : ${ans}` : '',
          q.explanation ? `Explication : ${q.explanation}` : ''
        ].filter(Boolean)
      };
    });
    downloadPdfDirectVector(data.title, sections, data.badge || 'EVALUATION & QUIZ');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Generate PDF blob for uploading or sharing
 */
export async function generatePdfBlob(title: string, content: string, badge?: string): Promise<Blob> {
  const safeContent = content || 'Contenu du document';
  try {
    const formattedContent = safeContent
      .replace(/\n\n+/g, '</p><p style="margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">')
      .replace(/\n/g, '<br/>');

    const html = `
      ${HEADER_TEMPLATE(title, badge || 'MOUNT AI SCHOLAR • WORKSPACE DOCUMENT')}
      
      <div style="font-size: 12px; line-height: 1.65; color: #334155; background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
        <p style="margin-top: 0; margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">
          ${formattedContent}
        </p>
      </div>

      ${FOOTER_TEMPLATE()}
    `;

    const container = createRenderContainer(html);

    try {
      const opt = {
        margin: [0.35, 0.4, 0.35, 0.4],
        filename: `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollY: 0, scrollX: 0 },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      const pdfWorker = html2pdf().set(opt).from(container);
      const pdfBlob = await pdfWorker.output('blob');
      return pdfBlob;
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  } catch (e) {
    // Vector fallback blob
    const doc = new jsPDF();
    doc.text(title, 20, 20);
    const lines = doc.splitTextToSize(safeContent, 170);
    doc.text(lines, 20, 30);
    return doc.output('blob');
  }
}
