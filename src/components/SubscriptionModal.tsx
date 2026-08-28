import React, { useState } from 'react';
import { X, Check, Zap, Shield, Sparkles, CreditCard, Lock, ExternalLink, Star, RefreshCw, Globe, Server, Database, CheckCircle2 } from 'lucide-react';

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_28EbJ33RDfwdfrk2lx0gw02";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentTier: 'free' | 'pro';
  onTierChange: (newTier: 'free' | 'pro') => void;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  userEmail = "capitaine@mentora.ai",
  currentTier,
  onTierChange
}: SubscriptionModalProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  if (!isOpen) return null;

  const toggleTestTier = () => {
    const nextTier = currentTier === 'pro' ? 'free' : 'pro';
    onTierChange(nextTier);
    localStorage.setItem('user_tier', nextTier);
  };

  const handlePayWithStripeLink = () => {
    window.open(STRIPE_PAYMENT_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-emerald-500/30 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Abonnement & Facturation Mentora AI</h3>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-full uppercase">
                  Paiement Sécurisé Stripe Checkout
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Abonnement officiel pour la suite d'accessibilité cognitive et d'apprentissage.
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

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto scrollbar-thin">
          
          {/* Active Status Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${currentTier === 'pro' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                <Star className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Statut Actuel du Compte</p>
                <p className="text-sm font-black text-white uppercase">
                  {currentTier === 'pro' ? 'Tier Pro Scholar (Abonnement Actif)' : 'Tier Free (Découverte Gratuit)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleTestTier}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                Simuler Statut ({currentTier === 'pro' ? 'Rétablir Free' : 'Activer Pro'})
              </button>
            </div>
          </div>

          {/* Billing Interval Switcher */}
          <div className="flex justify-center">
            <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl inline-flex items-center gap-2">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingInterval === 'month'
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Facturation Mensuelle (19€ / mois)
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingInterval === 'year'
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Facturation Annuelle (190€ / an)
                <span className="px-1.5 py-0.5 bg-black/30 text-emerald-200 font-mono text-[9px] rounded uppercase font-black">
                  -17% (2 Mois Offerts)
                </span>
              </button>
            </div>
          </div>

          {/* Tiers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TIER 1: FREE TIER */}
            <div className={`relative bg-slate-900/40 border ${currentTier === 'free' ? 'border-slate-600' : 'border-slate-800'} rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Gratuit / Découverte</span>
                    <h4 className="text-2xl font-black text-white mt-1">Free Tier</h4>
                  </div>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 font-mono text-xs font-bold rounded-xl border border-slate-700">
                    0 € / mois
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Pour découvrir les bases de l'accessibilité phonologique et tester l'interface sur de courts textes.
                </p>

                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Services Inclus (Free) :</span>
                  
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Diagnostics Phonétiques :</strong> 3 analyses quotidiennes.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Analyse de Documents :</strong> Synthèse de 2 PDF/Mammoth par jour.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Guide Socratique & Audio :</strong> Accompagnement pédagogique et vocal.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Visualiseur Dyslexique :</strong> Mode Bionic Reading & police OpenDyslexic.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>PWA Offline :</strong> Mode hors-ligne standard avec LocalStorage.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  disabled={currentTier === 'free'}
                  onClick={() => {
                    onTierChange('free');
                    localStorage.setItem('user_tier', 'free');
                  }}
                  className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                    currentTier === 'free'
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {currentTier === 'free' ? 'Plan Actuel' : 'Rétrograder vers Free'}
                </button>
              </div>
            </div>

            {/* TIER 2: PAID PRO SCHOLAR */}
            <div className={`relative bg-gradient-to-b from-slate-900 to-emerald-950/40 border-2 ${currentTier === 'pro' ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]' : 'border-emerald-500/50'} rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all`}>
              
              {/* Badge Popular */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-[10px] font-mono font-black rounded-full uppercase tracking-widest shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-black" /> Recommandé Capitaine CEO
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Pro Scholar & Enterprise</span>
                    <h4 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                      Pro Scholar
                      <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white font-mono">
                      {billingInterval === 'month' ? '19 €' : '190 €'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {billingInterval === 'month' ? '/ mois' : '/ an'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  Accès complet et illimité à toute la suite d'IA, le hub Google Workspace & les laboratoires de sécurité.
                </p>

                <div className="pt-2 border-t border-emerald-500/20 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Services Exclusifs Pro (Inclus) :</span>
                  
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>Génération & Traitement IA Illimités :</strong> Gemma & Gemini sans quota.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>IA Multilingue & Oralisation 8 Langues :</strong> Synthèse vocale illimitée.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-400 shrink-0" />
                      <span><strong>Google Workspace & Classroom Hub :</strong> Export instantané Gmail & Docs.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                      <span><strong>Laboratoire CyberSécurité & Audit PWA :</strong> Rapports de conformité M&A.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span><strong>Soins Cognitifs & RAG Profond :</strong> Analyse sémantique élastique.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Zero Data-Leak Shield :</strong> Filtrage automatique PII souverain.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-500/20">
                {currentTier === 'pro' ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                    <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Vous bénéficiez déjà de l'Abonnement Pro Scholar !
                    </p>
                  </div>
                ) : (
                  <a
                    href={STRIPE_PAYMENT_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    Souscrire sur Stripe
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

            </div>

          </div>

          {/* Stripe Direct Payment Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl text-center">
            <div className="max-w-xl mx-auto space-y-3">
              <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-2">
                <CreditCard className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Paiement Direct via Stripe Checkout</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Abonnez-vous en toute sécurité en accédant directement à la page de paiement officielle Stripe. Vos transactions sont protégées par les protocoles de sécurité de niveau bancaire de Stripe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
              <a
                href={STRIPE_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-[0_0_30px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Payer mon Abonnement via Stripe
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Page officielle Stripe HTTPS / SSL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Norme de sécurité PCI-DSS</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

