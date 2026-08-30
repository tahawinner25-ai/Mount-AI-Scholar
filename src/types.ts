export type MainViewType = 'hub' | 'dyslexia' | 'learning' | 'architecture' | 'history' | 'gtm' | 'phoneme-gravity' | 'voice-conversation' | 'phonetic-predictor' | 'phonetic-visualizer' | 'classroom' | 'workspace' | 'mentora' | 'sl2t';
export type LearningModeType = 'mindmap' | 'quiz' | 'exam' | 'presentation' | 'summary' | 'search' | 'Codex';
export type ArchSubTabType = 'visualizer' | 'cyber' | 'ledger' | 'google-deploy' | 'pwa-audit';
export type EngineStatusType = 'offline' | 'online';

export interface HistoryItem {
  id: string;
  userId: string;
  mode: LearningModeType;
  language: string;
  originalText: string;
  generatedContent: string;
  createdAt: any;
}
