import { HistoryItem, HistoryItemType, HistoryFileExtension } from '../types';
import { 
  downloadPdfDocument, 
  exportSummaryToPdf, 
  exportQuizToPdf, 
  exportMindmapToPdf, 
  SummaryExportData, 
  QuizExportData, 
  MindmapExportData 
} from '../utils/pdfExport';

const GUEST_STORAGE_KEY = 'guest_learning_items_v2';
const USER_STORAGE_PREFIX = 'user_learning_items_v2_';

/**
 * Récupère la clé de stockage selon le type d'utilisateur (Invité ou Authentifié)
 */
export function getHistoryStorageKey(user: any): string {
  if (!user || user.isGuest) {
    return GUEST_STORAGE_KEY;
  }
  return `${USER_STORAGE_PREFIX}${user.uid || 'unknown'}`;
}

/**
 * Récupère la liste complète des éléments de l'historique
 */
export function getHistoryItems(user: any): HistoryItem[] {
  try {
    const key = getHistoryStorageKey(user);
    const raw = localStorage.getItem(key);
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        return items;
      }
    }
    
    // Migration de secours depuis les anciennes versions de clés
    const legacyKey = user?.isGuest ? 'guest_learning_items' : (user?.uid ? `user_learning_items_${user.uid}` : null);
    if (legacyKey) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const legacyItems = JSON.parse(legacyRaw);
        if (Array.isArray(legacyItems)) {
          return legacyItems.map(legacyToNewHistoryItem);
        }
      }
    }
  } catch (e) {
    console.warn("Échec de la récupération de l'historique :", e);
  }
  return [];
}

/**
 * Convertit un ancien HistoryItem vers le format moderne avec extensions
 */
function legacyToNewHistoryItem(oldItem: any): HistoryItem {
  const mode = oldItem.mode || 'summary';
  let type: HistoryItemType = 'summary';
  let fileExtension: HistoryFileExtension = '.pdf';

  if (mode === 'quiz' || mode === 'exam') {
    type = 'quiz';
    fileExtension = '.quiz';
  } else if (mode === 'mindmap') {
    type = 'mindmap';
    fileExtension = '.map';
  } else if (mode === 'chat' || mode === 'search' || mode === 'Codex') {
    type = 'chat';
    fileExtension = '.chat';
  } else if (mode === 'orbit' || mode === 'phoneme') {
    type = 'orbit';
    fileExtension = '.orbit';
  } else if (mode === 'audio' || mode === 'voice') {
    type = 'audio';
    fileExtension = '.mp3';
  } else if (mode === 'mail' || mode === 'email') {
    type = 'mail';
    fileExtension = '.eml';
  }

  const title = oldItem.originalText?.split('\n')[0]?.substring(0, 60)?.trim() || `Document_${oldItem.id || Date.now()}${fileExtension}`;

  return {
    id: oldItem.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: oldItem.userId || 'guest',
    type,
    fileExtension,
    title,
    mode,
    language: oldItem.language || 'French',
    originalText: oldItem.originalText || '',
    generatedContent: oldItem.generatedContent || '',
    createdAt: oldItem.createdAt || new Date().toISOString(),
    metadata: {
      ...oldItem.metadata
    }
  };
}

/**
 * Détermine l'extension appropriée selon le type
 */
export function getExtensionForType(type: HistoryItemType): HistoryFileExtension {
  switch (type) {
    case 'pdf': return '.pdf';
    case 'chat': return '.chat';
    case 'audio': return '.mp3';
    case 'orbit': return '.orbit';
    case 'mail': return '.eml';
    case 'quiz': return '.quiz';
    case 'mindmap': return '.map';
    case 'exam': return '.exam';
    case 'presentation': return '.pptx';
    case 'summary':
    default:
      return '.pdf';
  }
}

/**
 * Enregistre un nouvel élément dans l'historique (Cloud & Local)
 */
export function addHistoryItem(
  user: any,
  itemData: {
    type: HistoryItemType;
    title: string;
    mode?: string;
    language?: string;
    originalText: string;
    generatedContent: string;
    fileExtension?: HistoryFileExtension;
    metadata?: HistoryItem['metadata'];
  }
): HistoryItem {
  const currentItems = getHistoryItems(user);
  const type = itemData.type;
  const fileExtension = itemData.fileExtension || getExtensionForType(type);

  // Formater un titre propre avec extension si absente
  let cleanTitle = itemData.title?.trim() || `Document_${Date.now()}`;
  if (!cleanTitle.endsWith(fileExtension)) {
    cleanTitle = `${cleanTitle}${fileExtension}`;
  }

  const newItem: HistoryItem = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user?.uid || (user?.isGuest ? 'guest_1337' : 'local_user'),
    type,
    fileExtension,
    title: cleanTitle,
    mode: itemData.mode || type,
    language: itemData.language || 'French',
    originalText: itemData.originalText || '',
    generatedContent: itemData.generatedContent || '',
    createdAt: new Date().toISOString(),
    metadata: itemData.metadata || {}
  };

  const updatedItems = [newItem, ...currentItems.filter(i => i.id !== newItem.id)].slice(0, 100);
  
  try {
    const key = getHistoryStorageKey(user);
    localStorage.setItem(key, JSON.stringify(updatedItems));
    
    // Déclencheur d'événement personnalisé pour mise à jour instantanée de l'interface
    window.dispatchEvent(new CustomEvent('mount_ai_history_updated', { detail: { item: newItem } }));
    console.log(`[HISTORIQUE] Élément enregistré avec succès : [${fileExtension}] ${cleanTitle}`);
  } catch (e) {
    console.warn("Échec de l'écriture dans l'historique LocalStorage:", e);
  }

  return newItem;
}

/**
 * Supprime un élément spécifique de l'historique
 */
export function deleteHistoryItem(user: any, itemId: string): void {
  const currentItems = getHistoryItems(user);
  const updatedItems = currentItems.filter(i => i.id !== itemId);
  try {
    const key = getHistoryStorageKey(user);
    localStorage.setItem(key, JSON.stringify(updatedItems));
    window.dispatchEvent(new CustomEvent('mount_ai_history_updated'));
  } catch (e) {
    console.warn("Échec de la suppression de l'élément d'historique:", e);
  }
}

/**
 * Efface l'ensemble de l'historique pour l'utilisateur actuel
 */
export function clearAllHistory(user: any): void {
  try {
    const key = getHistoryStorageKey(user);
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('mount_ai_history_updated'));
  } catch (e) {
    console.warn("Échec de la réinitialisation de l'historique:", e);
  }
}

/**
 * Téléchargement immédiat du PDF associé à un HistoryItem
 */
export function downloadItemAsPdf(item: HistoryItem): void {
  const cleanTitle = item.title.replace(/\.[^/.]+$/, "");
  
  if (item.type === 'quiz' || item.type === 'exam' || item.metadata?.quizQuestions) {
    const quizQuestions = item.metadata?.quizQuestions || [];
    const quizData: QuizExportData = {
      title: cleanTitle,
      topic: item.originalText.substring(0, 100) || "Évaluation Pédagogique",
      questions: quizQuestions.map((q: any, idx: number) => ({
        id: idx + 1,
        question: q.question || q.text || `Question ${idx + 1}`,
        options: q.options || [],
        answer: q.answer || q.correctAnswer || "",
        explanation: q.explanation || ""
      })),
      badge: "MOUNT AI SCHOLAR - ÉVALUATION OFFICIELLE"
    };
    exportQuizToPdf(quizData);
    return;
  }

  if (item.type === 'mindmap' || item.metadata?.mindmapData) {
    const mindmapData: MindmapExportData = item.metadata?.mindmapData || {
      title: cleanTitle,
      root: cleanTitle,
      branches: [
        {
          name: "Synthèse Principale",
          description: item.generatedContent.substring(0, 200),
          subnodes: ["Point 1", "Point 2", "Point 3"]
        }
      ]
    };
    exportMindmapToPdf(mindmapData);
    return;
  }

  // Format Résumé / PDF générique
  const lines = item.generatedContent.split('\n').filter(l => l.trim().length > 0);
  const summaryData: SummaryExportData = {
    title: cleanTitle,
    topic: item.originalText.substring(0, 100) || "Synthèse de Révision",
    summary: item.generatedContent,
    keyPoints: lines.slice(0, 8),
    badge: item.type === 'pdf' ? 'MOUNT AI SCHOLAR - DOCUMENT OFFICIEL' : 'MOUNT AI SCHOLAR - SYNTHÈSE DE COURS'
  };

  exportSummaryToPdf(summaryData);
}

/**
 * Téléchargement au format Texte / Markdown
 */
export function downloadItemAsMarkdown(item: HistoryItem): void {
  const content = `# ${item.title}\n\n**Type:** ${item.type.toUpperCase()} (${item.fileExtension})\n**Date:** ${new Date(item.createdAt).toLocaleString()}\n**Langue:** ${item.language}\n\n---\n\n## Source / Contexte\n${item.originalText}\n\n---\n\n## Contenu Généré\n${item.generatedContent}\n`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.title.replace(/\.[^/.]+$/, "")}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Téléchargement au format EML / Courrier
 */
export function downloadItemAsMail(item: HistoryItem): void {
  const mail = item.metadata?.mailData || {
    to: "destinataire@ecole.com",
    subject: item.title.replace(/\.[^/.]+$/, ""),
    body: item.generatedContent
  };
  
  const emlContent = `To: ${mail.to || 'contact@mentora.ai'}\nSubject: ${mail.subject || item.title}\nX-Mailer: Mount AI Scholar Mailer\nContent-Type: text/plain; charset=utf-8\n\n${mail.body || item.generatedContent}`;
  const blob = new Blob([emlContent], { type: 'message/rfc822;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.title.replace(/\.[^/.]+$/, "")}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restaure une discussion chatbot dans les sessions actives et bascule vers le Hub
 */
export function resumeChatbotDiscussion(item: HistoryItem): { sessionId: string; messages: any[] } {
  const sessionId = item.metadata?.chatSessionId || `session_resumed_${item.id}`;
  const messages = item.metadata?.chatMessages || [
    {
      id: 'resumed_user',
      role: 'user',
      content: item.originalText || item.title,
      timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'resumed_assistant',
      role: 'assistant',
      content: item.generatedContent,
      quizQuestions: item.metadata?.quizQuestions,
      mindmapData: item.metadata?.mindmapData,
      timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  try {
    const STORAGE_KEY = 'mount_ai_cognitive_chat_sessions_v2';
    const rawSessions = localStorage.getItem(STORAGE_KEY);
    let sessions: any[] = rawSessions ? JSON.parse(rawSessions) : [];

    const existingIdx = sessions.findIndex(s => s.id === sessionId);
    const sessionObj = {
      id: sessionId,
      title: item.title.replace('.chat', ''),
      language: item.language || 'French',
      createdAt: new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      messages
    };

    if (existingIdx >= 0) {
      sessions[existingIdx] = sessionObj;
    } else {
      sessions = [sessionObj, ...sessions];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    localStorage.setItem('active_cognitive_chat_session_id', sessionId);
  } catch (e) {
    console.warn("Échec de la persistance de la session de chat restaurée:", e);
  }

  return { sessionId, messages };
}
