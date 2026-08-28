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

const COMMON_PDF_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0f172a;
  background-color: #ffffff;
  width: 780px;
  padding: 32px 36px;
  margin: 0 auto;
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
        ${subtitle || `Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Mount AI Scholar Core`}
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
    <span>Mount AI Scholar • Moteur Cognitif & Écosystème d'Étude</span>
    <span>Page Document d'Apprentissage • Imprimable</span>
  </div>
`;

/**
 * Standard General PDF exporter
 */
export async function downloadPdfDocument(title: string, content: string, badge?: string) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.setAttribute('style', `position: fixed; left: -9999px; top: 0; ${COMMON_PDF_STYLES}`);

  const formattedContent = content
    .replace(/\n\n+/g, '</p><p style="margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">')
    .replace(/\n/g, '<br/>');

  container.innerHTML = `
    ${HEADER_TEMPLATE(title, badge || 'MOUNT AI SCHOLAR • RAPPORT D\'ÉTUDE')}
    
    <div style="font-size: 12px; line-height: 1.65; color: #334155; background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
      <p style="margin-top: 0; margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">
        ${formattedContent}
      </p>
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_Mount_AI.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
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
  const container = document.createElement('div');
  container.setAttribute('style', `position: fixed; left: -9999px; top: 0; ${COMMON_PDF_STYLES}`);

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

  const paragraphs = data.summary
    .split(/\n\n+/)
    .filter(Boolean)
    .map(p => `<p style="margin-bottom: 10px; font-size: 11.5px; line-height: 1.6; color: #1e293b;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  container.innerHTML = `
    ${HEADER_TEMPLATE(data.title, data.badge || 'FICHE DE SYNTHÈSE & RÉVISION', data.sourceDoc ? `Document Source : ${data.sourceDoc}` : undefined)}
    
    ${keyPointsHtml}

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
      <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
        📖 Contenu Détaillé de la Synthèse
      </div>
      <div style="font-size: 11.5px; line-height: 1.65; color: #334155;">
        ${paragraphs}
      </div>
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `Synthese_${data.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
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
  const container = document.createElement('div');
  container.setAttribute('style', `position: fixed; left: -9999px; top: 0; ${COMMON_PDF_STYLES} width: 840px;`);

  // Build branch cards or node list
  let branchesHtml = '';

  if (data.branches && data.branches.length > 0) {
    branchesHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        ${data.branches.map((b, idx) => `
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
  }

  container.innerHTML = `
    ${HEADER_TEMPLATE(data.title, data.badge || 'CARTE MENTALE & RÉSEAU DE CONCEPTS', `Sujet : ${data.root || data.title} • Modèle Vectoriel Hiérarchisé`)}

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
      <div style="font-size: 11px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        🗺️ Structure Arborescente des Connaissances
      </div>

      ${branchesHtml}
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `Mindmap_${data.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
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
  const container = document.createElement('div');
  container.setAttribute('style', `position: fixed; left: -9999px; top: 0; ${COMMON_PDF_STYLES}`);

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
          ${q.options.map((opt, oIdx) => {
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

  container.innerHTML = `
    ${HEADER_TEMPLATE(data.title, data.badge || 'ÉVALUATION & QUIZ ADAPTATIF', data.score !== undefined && data.total !== undefined ? `Score : ${data.score}/${data.total} (${Math.round((data.score / data.total) * 100)}%) • Évaluation Mount AI` : `Sujet : ${data.topic || data.title}`)}

    <div style="margin-bottom: 16px;">
      ${questionsHtml}
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `Quiz_${data.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
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
  const container = document.createElement('div');
  container.setAttribute('style', `position: fixed; left: -9999px; top: 0; ${COMMON_PDF_STYLES}`);

  const formattedContent = content
    .replace(/\n\n+/g, '</p><p style="margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">')
    .replace(/\n/g, '<br/>');

  container.innerHTML = `
    ${HEADER_TEMPLATE(title, badge || 'MOUNT AI SCHOLAR • WORKSPACE DOCUMENT')}
    
    <div style="font-size: 12px; line-height: 1.65; color: #334155; background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
      <p style="margin-top: 0; margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: #334155;">
        ${formattedContent}
      </p>
    </div>

    ${FOOTER_TEMPLATE()}
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename: `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
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
}

