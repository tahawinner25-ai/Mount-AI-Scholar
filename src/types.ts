export type MainViewType = 'hub' | 'dyslexia' | 'learning' | 'architecture' | 'history' | 'gtm' | 'phoneme-gravity' | 'voice-conversation' | 'phonetic-predictor' | 'phonetic-visualizer' | 'classroom' | 'workspace' | 'mentora' | 'sl2t';
export type LearningModeType = 'mindmap' | 'quiz' | 'exam' | 'presentation' | 'summary' | 'search' | 'Codex';
export type ArchSubTabType = 'visualizer' | 'cyber' | 'ledger' | 'google-deploy' | 'pwa-audit';
export type EngineStatusType = 'offline' | 'online';

export type HistoryItemType = 'pdf' | 'chat' | 'audio' | 'orbit' | 'mail' | 'summary' | 'quiz' | 'mindmap' | 'exam' | 'presentation';
export type HistoryFileExtension = '.pdf' | '.chat' | '.mp3' | '.orbit' | '.eml' | '.md' | '.quiz' | '.map' | '.exam' | '.pptx' | '.txt';

export interface HistoryItem {
  id: string;
  userId: string;
  type: HistoryItemType;
  fileExtension: HistoryFileExtension;
  title: string;
  mode?: LearningModeType | string;
  language: string;
  originalText: string;
  generatedContent: string;
  createdAt: any;
  metadata?: {
    fileSize?: number;
    fileName?: string;
    pageCount?: number;
    audioUrl?: string;
    audioBase64?: string;
    phonemes?: string[];
    word?: string;
    ipa?: string;
    mailData?: {
      to?: string;
      subject?: string;
      body?: string;
    };
    chatSessionId?: string;
    chatMessages?: any[];
    quizQuestions?: any[];
    mindmapData?: any;
    summaryKeyPoints?: string[];
    durationSeconds?: number;
    tags?: string[];
  };
}

