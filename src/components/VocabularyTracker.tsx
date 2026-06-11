import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, Check, RefreshCw, Download } from 'lucide-react';
import { extractVocabulary } from '../services/ai';

interface VocabWord {
  word: string;
  definition: string;
}

interface VocabularyTrackerProps {
  text: string;
  language?: string;
}

export default function VocabularyTracker({ text, language = "French" }: VocabularyTrackerProps) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [acquired, setAcquired] = useState<Set<string>>(new Set());

  // Debounce the extraction so it doesn't fire constantly
  useEffect(() => {
    if (!text || text.length < 20) return;

    const timer = setTimeout(() => {
      loadVocab(text);
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [text, language]);

  const loadVocab = async (sourceText: string) => {
    setIsLoading(true);
    try {
      const resultStr = await extractVocabulary(sourceText, language);
      let parsed = [];
      try {
          // Try to clean markdown formatting
          const cleaned = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
      } catch (e) {
          console.error("Failed to parse JSON:", resultStr);
      }
      if (Array.isArray(parsed)) {
          // keep existing acquired state
          setWords(parsed);
      }
    } catch (error) {
      console.error("Vocabulary extraction error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAcquired = (word: string) => {
    setAcquired(prev => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  };

  const exportToAnki = () => {
    const toReview = words.filter(w => !acquired.has(w.word));
    if (toReview.length === 0) return;
    
    // Anki formatting (Word \t Definition)
    const content = toReview.map(w => `${w.word}\t${w.definition}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocab_anki_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!text || text.length < 20) return null;

  const toReviewCount = words.filter(w => !acquired.has(w.word)).length;

  return (
    <div className="bg-[#121626]/80 backdrop-blur-xl rounded-3xl border border-white/5 p-6 shadow-2xl mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Suivi de Vocabulaire
        </h3>
        <div className="flex items-center gap-3">
          {words.length > 0 && toReviewCount > 0 && (
            <button 
              onClick={exportToAnki}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30 transition-colors"
              title="Exporter pour Anki"
            >
              <Download className="w-3 h-3" /> Exporter Anki ({toReviewCount})
            </button>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> Extraction...
            </div>
          )}
        </div>
      </div>

      {words.length === 0 && !isLoading && (
        <p className="text-slate-400 text-sm">Aucun vocabulaire complexe détecté.</p>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {words.map((item, idx) => {
          const isAcquired = acquired.has(item.word);
          return (
            <div 
              key={idx}
              className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                isAcquired 
                ? 'bg-emerald-900/20 border-emerald-500/30' 
                : 'bg-[#0b0e17] border-white/5 hover:border-indigo-500/30'
              }`}
            >
              <div>
                <p className={`font-black text-lg ${isAcquired ? 'text-emerald-400' : 'text-white'}`}>
                  {item.word}
                </p>
                <p className="text-slate-400 text-xs mt-1">{item.definition}</p>
              </div>
              <button
                onClick={() => toggleAcquired(item.word)}
                className={`p-2 rounded-lg transition-colors border ${
                  isAcquired 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title={isAcquired ? "Marquer à réviser" : "Marquer comme acquis"}
              >
                {isAcquired ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
