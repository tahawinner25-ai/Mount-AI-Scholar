export type MainViewType = 'hub' | 'dyslexia' | 'learning' | 'architecture' | 'history' | 'cognitive-gym' | 'gtm' | 'phoneme-gravity' | 'voice-conversation' | 'phonetic-predictor' | 'classroom';
export type LearningModeType = 'mindmap' | 'quiz' | 'exam' | 'presentation' | 'summary' | 'search' | 'gemma';
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
