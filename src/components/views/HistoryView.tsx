import React from 'react';
import { History, Loader2, CheckCircle2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { HistoryItem } from '../../types';

interface HistoryViewProps {
  isLoadingHistory: boolean;
  historyItems: HistoryItem[];
}

export default function HistoryView({ isLoadingHistory, historyItems }: HistoryViewProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">History <span className="text-blue-500">Logs</span></h2>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest mt-2">Secure remote persistence</p>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm p-10 min-h-[50vh]">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
          </div>
        ) : historyItems.length === 0 ? (
          <div className="text-center py-20">
            <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No history found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyItems.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 hover:border-white/30 transition-colors cursor-pointer group flex flex-col h-80 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <span className="px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-full uppercase tracking-widest backdrop-blur-md">{item.mode}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '—'}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2 max-w-full truncate relative z-10 opacity-90">Source: {item.originalText?.substring(0, 50)}...</h4>
                <div className="flex-1 overflow-hidden relative z-10">
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent z-10" />
                  <div className="text-xs text-slate-400 prose prose-invert">
                    <Markdown>{item.generatedContent?.substring(0, 200) + '...'}</Markdown>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] font-bold text-blue-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center relative z-10">
                  Saved <CheckCircle2 className="w-3 h-3 ml-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
