import React, { useState, useEffect } from 'react';
import { X, LogIn, UserCheck, CreditCard, ShieldCheck, Sparkles, CheckCircle2, Zap, Star, ArrowRight, Lock, Clock } from 'lucide-react';
import { isGuestLockedOut, getGuestLockoutRemainingMs, formatRemainingTime } from '../utils/guestManager';

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_28EbJ33RDfwdfrk2lx0gw02";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
  onGuestLogin: () => void;
  onOpenStripeCheckout: () => void;
  userTier: 'free' | 'pro';
  userEmail?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  onGoogleLogin,
  onGuestLogin,
  onOpenStripeCheckout,
  userTier,
  userEmail
}: LoginModalProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedTabTier, setSelectedTabTier] = useState<'free' | 'pro'>(userTier);
  const [guestLocked, setGuestLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const checkLockout = () => {
      const locked = isGuestLockedOut();
      setGuestLocked(locked);
      if (locked) {
        const remaining = getGuestLockoutRemainingMs();
        setLockoutCountdown(formatRemainingTime(remaining));
      } else {
        setLockoutCountdown("");
      }
    };

    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoggingIn(true);
    try {
      await onGoogleLogin();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestAuth = () => {
    if (guestLocked) {
      alert(`⚠️ Guest Mode is temporarily locked for 24h following a completed session.\n\nRemaining time: ${lockoutCountdown}\n\nSign in with Google or subscribe to a plan to continue without interruption.`);
      return;
    }
    onGuestLogin();
    onClose();
  };

  const isCaptain = userEmail?.toLowerCase() === 'tahawinner25@gmail.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-[0_0_60px_rgba(139,92,246,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Accent Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Authentication & Plans</h3>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold rounded-full uppercase">
                  Mount AI Auth
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Free Tier (5/day) vs Paid Pro Tier (Unlimited) & Stripe Billing integration.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto scrollbar-thin">
          
          {/* Developer Email Badge if logged in as Captain */}
          {isCaptain && (
            <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl flex items-center gap-3 text-purple-200">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <strong className="text-white block font-black uppercase">Developer & CEO Account (tahawinner25@gmail.com)</strong>
                Lifetime Unlimited Pro Scholar access guaranteed at zero cost.
              </div>
            </div>
          )}

          {/* STEP 1: Choose Tier Preference (Free vs Paid Tier) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> 1. Select Access Plan :
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Standard: All users = Free Tier (5/day)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Option A: Formule Gratuite (Free Tier) */}
              <button
                type="button"
                onClick={() => setSelectedTabTier('free')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedTabTier === 'free'
                    ? 'bg-slate-900 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-500'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-mono font-bold rounded-lg uppercase">
                      Starter Plan
                    </span>
                    <span className="text-xs font-black text-emerald-400 font-mono">$0 / FREE</span>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase mb-1">Free Tier Plan</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Access all AI and phonetic modules with a cap of <strong>5 generations per day</strong>.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>✓ Google & Guest Sign In</span>
                  {selectedTabTier === 'free' && (
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  )}
                </div>
              </button>

              {/* Option B: Formule Pro Scholar (Paid Tier via Stripe) */}
              <button
                type="button"
                onClick={() => setSelectedTabTier('pro')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedTabTier === 'pro'
                    ? 'bg-slate-900 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-lg uppercase flex items-center gap-1">
                      <Star className="w-3 h-3 text-emerald-400" /> Stripe Extension
                    </span>
                    <span className="text-xs font-black text-emerald-400 font-mono">€19/mo • €190/yr</span>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase mb-1">Paid Plan (Pro Unlimited)</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    <strong>100% UNLIMITED</strong> access to Codex Edge Inference, Deep Elastic RAG & Google Workspace.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span>★ Stripe Server Verification</span>
                  {selectedTabTier === 'pro' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
              </button>

            </div>
          </div>

          {/* STRIPE EXTENSION INTEGRATION DIRECTLY IN LOGIN WINDOW */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h5 className="text-xs font-black text-white uppercase tracking-wider">Stripe Billing & Payment Extension</h5>
              </div>
              <span className="px-2 py-0.5 bg-black/50 text-emerald-300 text-[9px] font-mono rounded border border-emerald-500/30">
                Secure Checkout
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              To unlock Unlimited Pro access (Paid Tier), subscribe directly via the Stripe Checkout extension. Server checks automatically authenticate customer status on every session.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenStripeCheckout();
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Subscribe to Paid Tier (€19/month)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href={STRIPE_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
              >
                Direct Stripe Link ↗
              </a>
            </div>
          </div>

          {/* STEP 2: Login Options */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
              2. Sign In :
            </label>

            <div className="space-y-3">
              {/* Google Login Button */}
              <button
                onClick={handleGoogleAuth}
                disabled={isLoggingIn}
                className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 text-black font-extrabold text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isLoggingIn ? "Signing in with Google..." : "Sign in with Google"}</span>
              </button>

              {/* Guest Login Button with 30-min timer and 24h Lockout */}
              {guestLocked ? (
                <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Guest Mode Locked (24h)</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-200 font-mono font-bold text-[10px] rounded-full border border-rose-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400 animate-pulse" />
                      {lockoutCountdown || "24h 00m"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Your 30-minute guest session has ended. Guest mode is locked for 24 hours. Sign in with <strong>Google</strong> above to continue without interruption.
                  </p>
                  <button
                    disabled
                    className="w-full py-2.5 px-4 bg-slate-900/60 text-slate-500 font-bold text-xs rounded-xl border border-slate-800 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Guest Access Unavailable (Locked {lockoutCountdown})</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <button
                    onClick={handleGuestAuth}
                    className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-purple-200 font-extrabold text-sm rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.15)] group"
                  >
                    <UserCheck className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Continue as Guest (30-Minute Session)</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-mono">
                    ⏱️ 30-minute maximum session. Afterwards, returns to welcome landing with 24-hour lockout.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security & Rules Banner */}
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="text-slate-200">Security Rule:</strong> All accounts signing in via Google or Guest receive the <span className="text-emerald-400 font-bold">Free Tier (5/day)</span> by default. Only the Developer & CEO account (tahawinner25@gmail.com) or verified Stripe active subscribers receive Unlimited Pro status.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>Mount AI Scholar • https://mount-ai-scholar.ai.studio/</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
