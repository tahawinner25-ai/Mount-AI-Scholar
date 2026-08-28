import React, { useState, useEffect } from 'react';
import { 
  X, Trophy, Award, Star, Flame, Sparkles, ShieldCheck, Zap, Lock, 
  CheckCircle2, RefreshCw, Brain, Volume2, Globe, Layers, Eye, Target, ChevronRight
} from 'lucide-react';

export interface Badge {
  id: string;
  title: string;
  category: 'phonetic' | 'ai' | 'accessibility' | 'master';
  description: string;
  iconName: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 to 100
  requirementText: string;
  color: string;
}

const DEFAULT_BADGES: Badge[] = [
  {
    id: 'apprenti-cognitif',
    title: 'Apprenti Cognitif',
    category: 'phonetic',
    description: 'A démarré sa première session d\'analyse phonologique et de lecture adaptée.',
    iconName: 'Brain',
    xpReward: 150,
    unlocked: true,
    unlockedAt: 'Aujourd\'hui',
    progress: 100,
    requirementText: 'Effectuer 1 analyse phonétique',
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'maitre-phono',
    title: 'Maître Phono',
    category: 'phonetic',
    description: 'A maîtrisé 10 exercices de correspondance phonème-graphème sans latence.',
    iconName: 'Volume2',
    xpReward: 300,
    unlocked: false,
    progress: 70,
    requirementText: 'Compléter 10 exercices phono (7/10)',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'decodeur-bionique',
    title: 'Décodeur Bionique',
    category: 'accessibility',
    description: 'A activé la lecture bionique et l\'espacement dyslexique personnalisé.',
    iconName: 'Eye',
    xpReward: 200,
    unlocked: true,
    unlockedAt: 'Hier',
    progress: 100,
    requirementText: 'Activer le mode Bionic Reading',
    color: 'from-cyan-400 to-blue-500'
  },
  {
    id: 'pionnier-edge',
    title: 'Pionnier Edge AI',
    category: 'ai',
    description: 'A exécuté une inférence locale sous les contraintes Privacy-by-Design.',
    iconName: 'Zap',
    xpReward: 500,
    unlocked: true,
    unlockedAt: 'Aujourd\'hui',
    progress: 100,
    requirementText: 'Exécuter 1 requête localement',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'stratege-cognitif',
    title: 'Stratège Cognitif',
    category: 'ai',
    description: 'A généré 5 cartes mentales (Mindmaps) et questionnaires de synthèse.',
    iconName: 'Target',
    xpReward: 350,
    unlocked: false,
    progress: 60,
    requirementText: 'Générer 5 mindmaps & quiz (3/5)',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'champion-mots',
    title: 'Champion des Mots',
    category: 'phonetic',
    description: 'A enregistré et révisé 20 mots dans le suivi de vocabulaire personnel.',
    iconName: 'Award',
    xpReward: 250,
    unlocked: false,
    progress: 45,
    requirementText: 'Ajouter 20 mots au dictionnaire (9/20)',
    color: 'from-rose-500 to-pink-500'
  },
  {
    id: 'explorateur-workspace',
    title: 'Connecteur Workspace',
    category: 'accessibility',
    description: 'A synchronisé ses révisions avec Google Classroom & Docs.',
    iconName: 'Layers',
    xpReward: 400,
    unlocked: false,
    progress: 80,
    requirementText: 'Exporter 1 synthèse vers Google Workspace',
    color: 'from-yellow-400 to-amber-500'
  },
  {
    id: 'capitaine-ceo',
    title: 'Capitaine CEO',
    category: 'master',
    description: 'Badge d\'Élite : Maîtrise intégrale de la suite d\'accessibilité Mentora AI.',
    iconName: 'Crown',
    xpReward: 1000,
    unlocked: false,
    progress: 30,
    requirementText: 'Déverrouiller 6 autres badges de la plateforme',
    color: 'from-amber-400 via-rose-500 to-purple-600'
  }
];

interface ProgressBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProgressBadgesModal({ isOpen, onClose }: ProgressBadgesModalProps) {
  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('mentora_badges_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_BADGES;
      }
    }
    return DEFAULT_BADGES;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'phonetic' | 'ai' | 'accessibility' | 'master'>('all');
  const [streakDays, setStreakDays] = useState<number>(() => {
    return parseInt(localStorage.getItem('mentora_streak_days') || '7', 10);
  });
  const [unlockedToast, setUnlockedToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mentora_badges_v2', JSON.stringify(badges));
  }, [badges]);

  if (!isOpen) return null;

  // Calculate XP & Level
  const totalXp = badges.reduce((sum, b) => sum + (b.unlocked ? b.xpReward : Math.round((b.progress / 100) * (b.xpReward * 0.3))), 0);
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalBadges = badges.length;
  const unlockPercentage = Math.round((unlockedCount / totalBadges) * 100);

  // Level thresholds
  let currentLevel = 1;
  let levelTitle = 'Novice Cognitif';
  if (totalXp >= 1500) {
    currentLevel = 5;
    levelTitle = 'Capitaine CEO (Master Scholar)';
  } else if (totalXp >= 1000) {
    currentLevel = 4;
    levelTitle = 'Architecte Cognitif Senior';
  } else if (totalXp >= 600) {
    currentLevel = 3;
    levelTitle = 'Expert Phono & Edge AI';
  } else if (totalXp >= 300) {
    currentLevel = 2;
    levelTitle = 'Apprenti Phono Avancé';
  }

  const nextLevelXp = currentLevel === 1 ? 300 : currentLevel === 2 ? 600 : currentLevel === 3 ? 1000 : currentLevel === 4 ? 1500 : 2000;
  const levelProgress = Math.min(100, Math.round((totalXp / nextLevelXp) * 100));

  const toggleUnlockBadge = (id: string) => {
    setBadges(prev => prev.map(badge => {
      if (badge.id === id) {
        const nextState = !badge.unlocked;
        if (nextState) {
          setUnlockedToast(`🎉 Badge déverrouillé : "${badge.title}" (+${badge.xpReward} XP)`);
          setTimeout(() => setUnlockedToast(null), 3500);
        }
        return {
          ...badge,
          unlocked: nextState,
          progress: nextState ? 100 : badge.progress,
          unlockedAt: nextState ? 'À l\'instant' : undefined
        };
      }
      return badge;
    }));
  };

  const unlockAllBadges = () => {
    setBadges(prev => prev.map(b => ({ ...b, unlocked: true, progress: 100, unlockedAt: 'Débloqué' })));
    setUnlockedToast('🚀 Félicitations ! Tous les badges de progression ont été débloqués !');
    setTimeout(() => setUnlockedToast(null), 3500);
  };

  const resetBadges = () => {
    setBadges(DEFAULT_BADGES);
    localStorage.removeItem('mentora_badges_v2');
  };

  const filteredBadges = activeTab === 'all' 
    ? badges 
    : badges.filter(b => b.category === activeTab);

  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-6 h-6 ${unlocked ? 'text-white' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Brain': return <Brain className={className} />;
      case 'Volume2': return <Volume2 className={className} />;
      case 'Eye': return <Eye className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Layers': return <Layers className={className} />;
      default: return <Star className={className} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Toast Popup Notification */}
        {unlockedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 fill-black" />
            <span>{unlockedToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-black shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Badges de Progression & Accomplissements</h3>
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold rounded-full uppercase">
                  Système Gamifié
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Récompense des réussites en phonétique, accessibilité cognitive et inférence locale.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Stats Summary Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* User Level Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Niveau du Titulaire
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold rounded-full">
                Niveau {currentLevel}
              </span>
            </div>
            <div className="text-sm font-black text-white tracking-wide mb-2">
              {levelTitle}
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>{totalXp} XP accumulés</span>
                <span>{nextLevelXp} XP requis</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badges Unlock Progress */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Taux de Déverrouillage
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {unlockedCount} / {totalBadges} Badges
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight mb-1">
              {unlockPercentage}% <span className="text-xs font-normal text-slate-400">complétés</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${unlockPercentage}%` }}
              />
            </div>
          </div>

          {/* Daily Streak & Simulation Actions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                Série Régulière
              </span>
              <span className="text-xs font-mono font-bold text-orange-400">
                🔥 {streakDays} Jours
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={unlockAllBadges}
                className="flex-1 py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-[10px] uppercase rounded-xl transition-all"
              >
                Débloquer Tout
              </button>
              <button
                onClick={resetBadges}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono text-[10px] rounded-xl transition-all"
                title="Réinitialiser"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

        {/* Category Tabs Filter */}
        <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Tous les Badges', icon: Trophy },
            { id: 'phonetic', label: 'Phonétique & Dyslexie', icon: Volume2 },
            { id: 'ai', label: 'IA & Inférence Locale', icon: Zap },
            { id: 'accessibility', label: 'Accessibilité & Tools', icon: Eye },
            { id: 'master', label: 'Master Scholar', icon: Star },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive 
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Badges Grid View */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBadges.map(badge => (
              <div 
                key={badge.id}
                onClick={() => toggleUnlockBadge(badge.id)}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  badge.unlocked 
                    ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.08)]' 
                    : 'bg-slate-950/50 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                {/* Background Glow */}
                {badge.unlocked && (
                  <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${badge.color} opacity-20 blur-2xl group-hover:opacity-30 transition-all`} />
                )}

                <div className="flex items-start gap-4">
                  
                  {/* Badge Icon Shield */}
                  <div className={`relative p-3.5 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-lg ${
                    badge.unlocked 
                      ? `bg-gradient-to-br ${badge.color} text-white shadow-amber-500/20` 
                      : 'bg-slate-900 border border-slate-800 text-slate-600'
                  }`}>
                    {renderBadgeIcon(badge.iconName, badge.unlocked)}
                    
                    {!badge.unlocked && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 border border-slate-800 rounded-full text-slate-500">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2 truncate">
                        {badge.title}
                        {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg shrink-0">
                        +{badge.xpReward} XP
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      {badge.description}
                    </p>

                    {/* Progress Bar or Unlocked status */}
                    {badge.unlocked ? (
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 pt-2 border-t border-slate-800/80">
                        <span className="flex items-center gap-1 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Déverrouillé
                        </span>
                        <span className="text-slate-500">{badge.unlockedAt || 'Obtenu'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>{badge.requirementText}</span>
                          <span className="text-amber-400 font-bold">{badge.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all duration-300"
                            style={{ width: `${badge.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                <div className="mt-3 pt-2 text-[10px] font-mono text-slate-500 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Cliquer pour basculer le statut</span>
                  <ChevronRight className="w-3 h-3 text-amber-400" />
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Chaque activité réussie sur Mentora AI accumule de l'XP et déverrouille des compétences.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            Fermer le Panneau
          </button>
        </div>

      </div>
    </div>
  );
}
