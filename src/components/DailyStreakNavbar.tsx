import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Calendar, Sparkles, Zap, Shield, Check, Award, ChevronRight, X } from 'lucide-react';

interface DailyStreakNavbarProps {
  currentStreak?: number;
  onStreakUpdate?: (newStreak: number) => void;
}

const MILESTONES = [
  { days: 3, label: 'Apprenti Régulier', reward: '+50 XP', icon: '🥉' },
  { days: 7, label: 'Semaine d\'Or', reward: '+150 XP', icon: '🥈' },
  { days: 14, label: 'Maître de la Discipline', reward: '+300 XP', icon: '🥇' },
  { days: 21, label: 'Habitude Synaptique', reward: '+500 XP', icon: '🧠' },
  { days: 30, label: 'Prodige du Mois', reward: '+1000 XP', icon: '👑' },
  { days: 50, label: 'Légende Cognitive', reward: '+2500 XP', icon: '⚡' },
  { days: 100, label: 'Grand Maître Silicon Valley', reward: '+5000 XP', icon: '🌌' }
];

export default function DailyStreakNavbar({ currentStreak: initialStreak = 12, onStreakUpdate }: DailyStreakNavbarProps) {
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('mount_daily_streak');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return initialStreak;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isMilestoneCelebration, setIsMilestoneCelebration] = useState(false);
  const [celebratedMilestone, setCelebratedMilestone] = useState<typeof MILESTONES[0] | null>(null);
  const [checkedToday, setCheckedToday] = useState<boolean>(true);

  // Synchronize streak on mount and verify last activity date
  useEffect(() => {
    const lastActiveDate = localStorage.getItem('mount_last_active_date');
    const todayStr = new Date().toISOString().split('T')[0];

    if (!lastActiveDate) {
      localStorage.setItem('mount_last_active_date', todayStr);
      localStorage.setItem('mount_daily_streak', streak.toString());
      setCheckedToday(true);
    } else if (lastActiveDate !== todayStr) {
      const lastDate = new Date(lastActiveDate);
      const today = new Date(todayStr);
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day! Increment streak
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem('mount_daily_streak', newStreak.toString());
        localStorage.setItem('mount_last_active_date', todayStr);
        setCheckedToday(true);
        if (onStreakUpdate) onStreakUpdate(newStreak);

        // Check if reached milestone
        const hitMilestone = MILESTONES.find(m => m.days === newStreak);
        if (hitMilestone) {
          triggerMilestoneCelebration(hitMilestone);
        }
      } else if (diffDays > 1) {
        // More than 1 day missed, reset to 1
        setStreak(1);
        localStorage.setItem('mount_daily_streak', '1');
        localStorage.setItem('mount_last_active_date', todayStr);
        setCheckedToday(true);
        if (onStreakUpdate) onStreakUpdate(1);
      }
    }
  }, []);

  const triggerMilestoneCelebration = (milestone: typeof MILESTONES[0]) => {
    setCelebratedMilestone(milestone);
    setIsMilestoneCelebration(true);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Next milestone calculation
  const nextMilestone = MILESTONES.find(m => m.days > streak) || MILESTONES[MILESTONES.length - 1];
  const prevMilestoneDays = MILESTONES.filter(m => m.days <= streak).pop()?.days || 0;
  const progressPercent = Math.min(100, Math.round(((streak - prevMilestoneDays) / (nextMilestone.days - prevMilestoneDays)) * 100));

  // Current day of week (0 = Sun, 1 = Mon ... 6 = Sat)
  const currentDayIndex = new Date().getDay();
  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <>
      {/* NAVBAR STREAK BUTTON */}
      <button
        id="daily-streak-navbar-btn"
        onClick={() => setIsOpen(true)}
        className="relative group flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs font-mono transition-all duration-300 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 hover:from-amber-500/25 hover:via-orange-500/25 hover:to-rose-500/25 border border-orange-500/40 hover:border-orange-400 text-orange-300 hover:text-white shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] cursor-pointer active:scale-95"
        title="Daily Streak - Série de jours consécutifs d'apprentissage"
      >
        {/* Animated flame glow effect */}
        <span className="relative flex h-4 w-4 items-center justify-center">
          <Flame className="w-4 h-4 text-orange-400 group-hover:text-amber-300 transition-colors animate-bounce" />
          <span className="absolute -inset-1 rounded-full bg-orange-500/20 blur-sm animate-pulse" />
        </span>

        <span className="font-black tracking-tight text-white flex items-center gap-1">
          <span className="text-amber-400">{streak}</span>
          <span className="text-[10px] text-orange-300/90 uppercase">Jours</span>
        </span>

        {/* Multiplier Badge */}
        <span className="px-1.5 py-0.2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[9px] font-black rounded-md tracking-wider">
          🔥 STREAK
        </span>
      </button>

      {/* MODAL / POPOVER WITH STREAK DETAILS */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-slate-900 border border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(249,115,22,0.25)] space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 border border-orange-500/40 rounded-2xl text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                  <Flame className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Daily Streak • Série Active
                  </h3>
                  <p className="text-[11px] font-mono text-orange-400 uppercase tracking-widest">
                    Discipline & Régularité Cognitive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Streak Counter Block */}
            <div className="bg-gradient-to-br from-orange-950/40 via-slate-950 to-amber-950/40 border border-orange-500/30 rounded-2xl p-5 text-center relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/40 rounded-full text-orange-300 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Session Active d'Aujourd'hui Confirmée</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 tracking-tight">
                  {streak}
                </span>
                <div className="text-left">
                  <span className="block text-xs font-black uppercase text-white font-mono leading-none">Jours</span>
                  <span className="block text-[10px] text-orange-300 font-mono">Consécutifs</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Chaque jour d'entraînement active votre plasticité cérébrale et multiplie vos points d'expérience (XP) sur Mount AI Scholar !
              </p>
            </div>

            {/* 7-Day Visual Calendar Progress */}
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" /> Semaine en cours
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">7/7 Jours Validés</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {daysOfWeek.map((day, idx) => {
                  const isToday = idx === currentDayIndex;
                  return (
                    <div
                      key={day}
                      className={`p-2.5 rounded-xl text-center border transition-all ${
                        isToday
                          ? 'bg-orange-500/25 border-orange-400 text-white shadow-[0_0_12px_rgba(249,115,22,0.3)] ring-1 ring-orange-400'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="block text-[9px] font-mono text-slate-400 uppercase mb-1">{day}</span>
                      <div className="w-5 h-5 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestone Tracker */}
            <div className="space-y-3 relative z-10 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Prochain Palier : {nextMilestone.days} Jours ({nextMilestone.label})
                </span>
                <span className="text-amber-400 font-bold">{nextMilestone.reward}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Palier actuel : {prevMilestoneDays}j</span>
                <span>{nextMilestone.days - streak} jours restants</span>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-2 relative z-10">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Paliers de Récompenses
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
                {MILESTONES.map((m) => {
                  const isReached = streak >= m.days;
                  const isCurrentTarget = m.days === nextMilestone.days;

                  return (
                    <div
                      key={m.days}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono border transition-all ${
                        isReached
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : isCurrentTarget
                          ? 'bg-orange-950/30 border-orange-500/40 text-orange-300 font-bold'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{m.icon}</span>
                        <span>{m.days} Jours • {m.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{m.reward}</span>
                        {isReached && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 relative z-10">
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Streak Shield Actif 🛡️</span>
              </div>

              <button
                onClick={() => {
                  // Simulate trigger celebration for user preview
                  const currentOrNext = MILESTONES.find(m => m.days <= streak) || MILESTONES[0];
                  triggerMilestoneCelebration(currentOrNext);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                title="Tester l'animation de célébration de palier"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Célébrer Palier ✨</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CELEBRATION MODAL OVERLAY */}
      {isMilestoneCelebration && celebratedMilestone && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-400 rounded-3xl p-7 text-center space-y-5 shadow-[0_0_80px_rgba(245,158,11,0.5)] relative overflow-hidden">
            
            {/* Confetti Particles simulation */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-6 text-xl animate-bounce">🎉</div>
              <div className="absolute top-6 right-8 text-xl animate-pulse">⭐</div>
              <div className="absolute bottom-10 left-8 text-xl animate-bounce">🔥</div>
              <div className="absolute bottom-8 right-6 text-xl animate-pulse">✨</div>
            </div>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-pulse">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl">
                {celebratedMilestone.icon}
              </div>
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/50 rounded-full text-amber-300 text-[10px] font-mono font-black uppercase tracking-widest inline-block mb-2">
                Nouveau Palier Débloqué ! 🏆
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {celebratedMilestone.days} Jours Consécutifs
              </h3>
              <p className="text-sm text-amber-300 font-bold mt-1">
                « {celebratedMilestone.label} »
              </p>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-slate-200">
              <p className="font-mono text-amber-400 font-black text-sm">
                Récompense : {celebratedMilestone.reward}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Votre constance forge votre excellence cognitive. Continuez sur cette lancée !
              </p>
            </div>

            <button
              onClick={() => setIsMilestoneCelebration(false)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs uppercase tracking-widest font-mono rounded-xl transition-all shadow-xl cursor-pointer"
            >
              Continuer l'Apprentissage 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
}
