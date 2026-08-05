// @ts-ignore
import html2pdf from 'html2pdf.js';

export async function downloadPdfDocument(title: string, content: string, badge?: string) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '750px';
  container.style.padding = '36px 40px';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.color = '#0f172a';
  container.style.backgroundColor = '#ffffff';
  container.style.margin = '0 auto';

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  container.innerHTML = `
    <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
          ${badge || 'MOUNT AI SCHOLAR • RAPPORT D\'ÉTUDE'}
        </div>
        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2;">
          ${title}
        </h1>
        <p style="font-size: 11px; color: #64748b; margin-top: 6px;">
          Généré le ${dateStr} • Moteur Cognitif On-Device
        </p>
      </div>
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; text-align: right;">
        <span style="font-size: 10px; font-weight: bold; color: #1e293b; display: block;">MOUNT AI SCHOLAR</span>
        <span style="font-size: 8px; color: #64748b; font-family: monospace;">VERIFIED REPORT</span>
      </div>
    </div>

    <div style="font-size: 13px; line-height: 1.7; color: #334155; white-space: pre-wrap; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
${content}
    </div>

    <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace;">
      Mount AI Scholar • Suite Cognitif & Écosystème Google Workspace • Confidentiel (Stealth Mode)
    </div>
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: 0.4,
      filename: `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_Mount_AI_Scholar.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export async function generatePdfBlob(title: string, content: string, badge?: string): Promise<Blob> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '750px';
  container.style.padding = '36px 40px';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.color = '#0f172a';
  container.style.backgroundColor = '#ffffff';

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  container.innerHTML = `
    <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
          ${badge || 'MOUNT AI SCHOLAR • GOOGLE WORKSPACE EXPORT'}
        </div>
        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2;">
          ${title}
        </h1>
        <p style="font-size: 11px; color: #64748b; margin-top: 6px;">
          Généré le ${dateStr} • Exportation Google Drive
        </p>
      </div>
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; text-align: right;">
        <span style="font-size: 10px; font-weight: bold; color: #1e293b; display: block;">MOUNT AI SCHOLAR</span>
      </div>
    </div>

    <div style="font-size: 13px; line-height: 1.7; color: #334155; white-space: pre-wrap; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
${content}
    </div>

    <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace;">
      Mount AI Scholar • Document d'Étude Synchronisé
    </div>
  `;

  document.body.appendChild(container);

  try {
    const opt = {
      margin: 0.4,
      filename: `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
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
