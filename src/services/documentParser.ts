import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { cacheDocument } from './indexedDb';

// Configure CDN worker for standard browser execution
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Could not load PDF.js worker Src from CDN:", e);
}

export interface DocumentParseProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  stage: 'reading' | 'parsing' | 'structuring' | 'completed' | 'error';
  message: string;
}

export interface DocumentChapter {
  id: number;
  title: string;
  pageNumber?: number;
  startPage?: number;
  endPage?: number;
  wordCount: number;
  content: string;
}

export interface ParsedDocumentResult {
  fileName: string;
  fileSize: number;
  fileSizeBytesFormatted: string;
  numPages: number;
  totalPages: number;
  fileType: string;
  totalWords: number;
  text: string;
  chapters: DocumentChapter[];
  isLargeDocument: boolean;
}

/**
 * Format bytes into human readable size
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Splits large textual content into manageable chunks for AI analysis without cutting words
 */
export function chunkDocumentText(text: string, maxChunkLength: number = 3500): string[] {
  if (text.length <= maxChunkLength) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk.length + para.length) > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + para;
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Extracts raw textual content from an uploaded PDF file with streaming progress for large files.
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: DocumentParseProgress) => void
): Promise<string> {
  try {
    if (onProgress) {
      onProgress({
        currentPage: 0,
        totalPages: 0,
        percent: 5,
        stage: 'reading',
        message: `Chargement du fichier (${formatBytes(file.size)})...`
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false,
      stopAtErrors: false
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    let fullText = "";

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(" ");

        fullText += `\n[--- Page ${pageNum} ---]\n` + pageText + "\n";
      } catch (pageErr) {
        console.warn(`Page ${pageNum} non analysable:`, pageErr);
        fullText += `\n[--- Page ${pageNum} : Texte non indexable ---]\n`;
      }

      if (onProgress) {
        const percent = Math.min(95, Math.round((pageNum / totalPages) * 90) + 5);
        onProgress({
          currentPage: pageNum,
          totalPages,
          percent,
          stage: 'parsing',
          message: `Extraction de la page ${pageNum} / ${totalPages} (${percent}%)...`
        });
      }

      // Yield thread every 5 pages so UI stays responsive on large 50+ page PDFs
      if (pageNum % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    if (onProgress) {
      onProgress({
        currentPage: totalPages,
        totalPages,
        percent: 100,
        stage: 'completed',
        message: `Document analysé avec succès (${totalPages} pages).`
      });
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF client-side extract failed:", error);
    if (onProgress) {
      onProgress({
        currentPage: 0,
        totalPages: 0,
        percent: 0,
        stage: 'error',
        message: `Échec du décodage du PDF: ${String(error)}`
      });
    }
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
 * Extracts raw textual content from PowerPoint (.pptx) or generic text files as fallback.
 */
export async function extractTextFromPPTX(file: File): Promise<string> {
  try {
    const text = await file.text();
    const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanText.length > 20) {
      return cleanText;
    }
    return `[Présentation PowerPoint : ${file.name}]\nContenu et diapositives prêts pour l'analyse par Mentora AI.`;
  } catch (error) {
    return `[Présentation PowerPoint : ${file.name}]`;
  }
}

/**
 * High level structured parser for documents (Large and normal)
 */
export async function parseStructuredDocument(
  file: File,
  onProgress?: (progress: DocumentParseProgress) => void
): Promise<ParsedDocumentResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  let rawText = "";
  let numPages = 1;

  if (ext === 'pdf') {
    rawText = await extractTextFromPDF(file, onProgress);
    const pageMatches = rawText.match(/\[--- Page \d+ ---\]/g);
    numPages = pageMatches ? pageMatches.length : 1;
  } else if (ext === 'docx') {
    rawText = await extractTextFromDocx(file);
    numPages = Math.max(1, Math.ceil(rawText.length / 2500));
  } else if (ext === 'pptx' || ext === 'ppt') {
    rawText = await extractTextFromPPTX(file);
    numPages = Math.max(1, Math.ceil(rawText.length / 1500));
  } else {
    rawText = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string || "").trim());
      reader.onerror = () => resolve(`[Fichier : ${file.name}]`);
      reader.readAsText(file);
    });
    numPages = Math.max(1, Math.ceil(rawText.length / 3000));
  }

  // Detect chapters / sections
  const chunks = chunkDocumentText(rawText, 4000);
  const chapters: DocumentChapter[] = chunks.map((chunk, idx) => {
    // Find heading or first line
    const firstLine = chunk.split('\n').find(l => l.trim().length > 3 && !l.includes('[--- Page')) || `Section ${idx + 1}`;
    const words = chunk.split(/\s+/).filter(Boolean).length;
    // Extract page number if available
    const pageMatch = chunk.match(/\[--- Page (\d+) ---\]/);
    const parsedPageNum = pageMatch ? parseInt(pageMatch[1], 10) : idx + 1;

    return {
      id: idx + 1,
      title: firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine,
      pageNumber: parsedPageNum,
      startPage: parsedPageNum,
      endPage: parsedPageNum,
      wordCount: words,
      content: chunk
    };
  });

  const totalWords = rawText.split(/\s+/).filter(Boolean).length;

  // Cache parsed document asynchronously into IndexedDB
  cacheDocument({
    name: file.name,
    size: file.size,
    type: ext || 'doc',
    text: rawText,
    chaptersCount: chapters.length
  }).catch(console.warn);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileSizeBytesFormatted: formatBytes(file.size),
    numPages,
    totalPages: numPages,
    fileType: ext || 'doc',
    totalWords,
    text: rawText,
    chapters,
    isLargeDocument: numPages > 5 || file.size > 2 * 1024 * 1024 || totalWords > 2500
  };
}

/**
 * Orchestrator to unpack uploaded educational media based on file formats
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: DocumentParseProgress) => void
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    return extractTextFromPDF(file, onProgress);
  } else if (ext === 'docx') {
    return extractTextFromDocx(file);
  } else if (ext === 'pptx' || ext === 'ppt') {
    return extractTextFromPPTX(file);
  } else if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'csv') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string || "").trim());
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  } else {
    // Attempt text reader fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = (e.target?.result as string || "").trim();
        resolve(res || `[Fichier importé : ${file.name}]`);
      };
      reader.onerror = () => resolve(`[Fichier importé : ${file.name}]`);
      reader.readAsText(file);
    });
  }
}

