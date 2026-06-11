import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure CDN worker for standard browser execution
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Could not load PDF.js worker Src from CDN:", e);
}

/**
 * Extracts raw textual content from an uploaded PDF file.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF client-side extract failed:", error);
    // Graceful fallback reading raw buffers or returning an alternative explanation as text
    throw new Error(`Erreur lors du décodage du PDF "${file.name}": ` + String(error));
  }
}

/**
 * Extracts raw textual content from an uploaded .docx Word file.
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return (result.value || "").trim();
  } catch (error) {
    console.error("DOCX client-side extract failed:", error);
    throw new Error(`Erreur lors du décodage du document Word "${file.name}": ` + String(error));
  }
}

/**
 * Orchestrator to unpack uploaded educational media based on file formats
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    return extractTextFromPDF(file);
  } else if (ext === 'docx') {
    return extractTextFromDocx(file);
  } else if (ext === 'txt') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string || "").trim());
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  } else {
    throw new Error(`Format de fichier non pris en charge : .${ext}. Veuillez importer des documents PDF, Word (.docx) ou texte (.txt).`);
  }
}
