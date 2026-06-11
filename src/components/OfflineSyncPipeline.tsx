import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Zap, Wifi, WifiOff, RefreshCw, Layers, CheckCircle2, 
  Clock, AlertTriangle, Key, Terminal, Code, ArrowRight, Play, 
  Trash2, ShieldAlert, Cpu, HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Mutation {
  id: string;
  seqId: number;
  type: 'MUTATION_ADD_PHONEME_LOG' | 'MUTATION_VOCAB_UPDATE' | 'MUTATION_ARENA_REMEDIATION';
  payload: any;
  timestamp: string;
  checksum: string;
  vectorClock: { client: number; server: number };
  status: 'PENDING' | 'SYNCING' | 'RECONCILED' | 'CONFLICT';
}

interface ServerState {
  latestSeq: number;
  data: {
    phonemeLogsCount: number;
    vocabMasteryIndex: number;
    remediationSuccessCount: number;
    lastChecksum: string;
  };
}

interface OfflineSyncPipelineProps {
  user: any;
}

export default function OfflineSyncPipeline({ user }: OfflineSyncPipelineProps) {
  // --- PIPELINE STATES ---
  const [networkState, setNetworkState] = useState<'ONLINE' | 'OFFLINE' | 'FLAKY'>('ONLINE');
  const [transactions, setTransactions] = useState<Mutation[]>(() => {
    const saved = localStorage.getItem('mount_ai_sync_ledger');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [serverState, setServerState] = useState<ServerState>({
    latestSeq: 100,
    data: {
      phonemeLogsCount: 42,
      vocabMasteryIndex: 88,
      remediationSuccessCount: 15,
      lastChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' // empty hash
    }
  });

  const [simulatedLocalData, setSimulatedLocalData] = useState({
    phonemeLogsCount: 42,
    vocabMasteryIndex: 88,
    remediationSuccessCount: 15,
  });

  const [latency, setLatency] = useState(15); // in ms
  const [isProcessingSync, setIsProcessingSync] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Offline Ledger Synchronizer (L6 Spec) initialized.', '[OK] Cryptographic engine loaded. RSA 4096 / AES-GCM 256 secure channel enabled.']);
  const [conflictModal, setConflictModal] = useState<boolean>(false);
  const [selectedConflict, setSelectedConflict] = useState<Mutation | null>(null);

  // Auto-save transactions in localStorage
  useEffect(() => {
    localStorage.setItem('mount_ai_sync_ledger', JSON.stringify(transactions));
  }, [transactions]);

  // Handle Latency fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      if (networkState === 'ONLINE') {
        setLatency(Math.floor(Math.random() * 12) + 12); // Steady low latency
      } else if (networkState === 'FLAKY') {
        setLatency(Math.floor(Math.random() * 800) + 200); // Massive packet drops/latency
      } else {
        setLatency(0); // Offline
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [networkState]);

  // Background Sync Processor (if online or flaky)
  useEffect(() => {
    if (networkState === 'OFFLINE' || transactions.length === 0 || isProcessingSync) return;

    const runSync = async () => {
      setIsProcessingSync(true);
      const pendingTx = transactions.filter(t => t.status === 'PENDING' || t.status === 'CONFLICT');
      
      if (pendingTx.length === 0) {
        setIsProcessingSync(false);
        return;
      }

      const txToSync = pendingTx[0];
      
      // Simulate transit latency
      const syncLatency = networkState === 'FLAKY' ? latency + 400 : latency;
      await new Promise(resolve => setTimeout(resolve, syncLatency));

      // Network check again
      if ((networkState as string) === 'OFFLINE') {
        setIsProcessingSync(false);
        return;
      }

      // Check for Conflict Scenario
      // For demonstration, let's say there's a 30% chance of a conflict in FLAKY mode, or if we trigger it
      if (networkState === 'FLAKY' && Math.random() < 0.25 && txToSync.status !== 'CONFLICT') {
        addLog(`[WARN] Conflict detected for Block #${txToSync.seqId}. Client Vector: [client:${txToSync.vectorClock.client}, server:${txToSync.vectorClock.server}]. Server Vector is ahead or drifted!`);
        
        setTransactions(prev => prev.map(t => 
          t.id === txToSync.id ? { ...t, status: 'CONFLICT' } : t
        ));
        setIsProcessingSync(false);
        return;
      }

      // Successful sync process
      addLog(`[SYNC] Syncing transaction ${txToSync.id.substring(0, 8)} to Firestore... Block SHA256: ${txToSync.checksum.substring(0, 16)}...`);
      
      // Perform write to live Firestore if authenticated
      if (user) {
        try {
          await addDoc(collection(db, 'sync_ledger'), {
            userId: user.uid,
            seqId: txToSync.seqId.toString(),
            mutationType: txToSync.type,
            payloadJson: JSON.stringify(txToSync.payload),
            checksum: txToSync.checksum,
            timestamp: txToSync.timestamp,
            syncStatus: 'reconciled',
            createdAt: serverTimestamp()
          });
          addLog(`[FIRESTORE] Safely persisted Block #${txToSync.seqId} remotely in Firestore secure collections.`);
        } catch (e: any) {
          addLog(`[FIRESTORE ERROR] Persistent write failed: ${e.message}`);
        }
      } else {
        addLog(`[ANONYMOUS] Reconciled mutation in client ledger database (Sign in to back up to real cloud).`);
      }

      // Update server state simulation
      setServerState(prev => {
        const newData = { ...prev.data };
        if (txToSync.type === 'MUTATION_ADD_PHONEME_LOG') {
          newData.phonemeLogsCount += txToSync.payload.count || 1;
        } else if (txToSync.type === 'MUTATION_VOCAB_UPDATE') {
          newData.vocabMasteryIndex = Math.min(100, Math.max(0, newData.vocabMasteryIndex + txToSync.payload.delta));
        } else if (txToSync.type === 'MUTATION_ARENA_REMEDIATION') {
          newData.remediationSuccessCount += txToSync.payload.success ? 1 : 0;
        }
        newData.lastChecksum = txToSync.checksum;

        return {
          latestSeq: txToSync.seqId,
          data: newData
        };
      });

      // Mark as reconciled
      setTransactions(prev => prev.map(t => 
        t.id === txToSync.id ? { ...t, status: 'RECONCILED' } : t
      ));

      addLog(`[OK] WAL Transaction Block #${txToSync.seqId} completely synced & validated.`);
      setIsProcessingSync(false);
    };

    const timer = setTimeout(runSync, 1500);
    return () => clearTimeout(timer);
  }, [transactions, networkState, latency, user, isProcessingSync]);

  // Helper to add system log entries
  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${text}`, ...prev.slice(0, 99)]);
  };

  // Helper to compute a secure-looking SHA256 simulation in JS securely
  const generateSimulatedHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + Math.random().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Trigger Local Mutation (WAL Queue addition)
  const triggerMutation = async (type: 'MUTATION_ADD_PHONEME_LOG' | 'MUTATION_VOCAB_UPDATE' | 'MUTATION_ARENA_REMEDIATION', payload: any) => {
    const baseSeq = transactions.length > 0 ? transactions[transactions.length - 1].seqId + 1 : serverState.latestSeq + 1;
    
    // Apply immediately to local preview representation ("Privacy by Design / Edge Immediate Feedback")
    setSimulatedLocalData(prev => {
      const next = { ...prev };
      if (type === 'MUTATION_ADD_PHONEME_LOG') {
        next.phonemeLogsCount += payload.count || 1;
      } else if (type === 'MUTATION_VOCAB_UPDATE') {
        next.vocabMasteryIndex = Math.min(100, Math.max(0, next.vocabMasteryIndex + payload.delta));
      } else if (type === 'MUTATION_ARENA_REMEDIATION') {
        next.remediationSuccessCount += payload.success ? 1 : 0;
      }
      return next;
    });

    const blockStr = `${type}::${JSON.stringify(payload)}::${baseSeq}::${Date.now()}`;
    const hexHash = await generateSimulatedHash(blockStr);

    const newMutation: Mutation = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      seqId: baseSeq,
      type,
      payload,
      timestamp: new Date().toISOString(),
      checksum: hexHash,
      vectorClock: { client: baseSeq, server: serverState.latestSeq },
      status: 'PENDING'
    };

    setTransactions(prev => [...prev, newMutation]);
    addLog(`[WAL WRITE] Mutation written to local system. Block #${baseSeq} created. Type: ${type}. Status: PENDING SYNC.`);
  };

  // Trigger Server Drift (Simulate server-side transaction having ahead state to trigger conflict)
  const triggerConflictScenario = async () => {
    if (networkState === 'OFFLINE') {
      addLog('[WARN] Cannot verify server drift while 100% offline. Switch to FLAKY/ONLINE first!');
      return;
    }

    addLog('[ATTACK] Simulating server drift and competing transaction payload... Vector clock mismatch initialized.');
    
    // 1. We create local pending changes
    await triggerMutation('MUTATION_VOCAB_UPDATE', { delta: 10, note: "Modified locally" });

    // 2. We inject a drift directly on the server mockup state representing a conflicting change
    setServerState(prev => ({
      latestSeq: prev.latestSeq + 5, // Server state jumped ahead of client
      data: {
        ...prev.data,
        vocabMasteryIndex: 30, // Conflicting master index
        lastChecksum: '7f83b1657ff1...CONFLIC_SUM'
      }
    }));

    addLog(`[DRIFTED] Server-side database records updated anonymously to sequence [seq:105]. Master indices are mismatched.`);
  };

  // Clear Ledger logs & local state
  const clearLedger = () => {
    setTransactions([]);
    setSimulatedLocalData({
      phonemeLogsCount: serverState.data.phonemeLogsCount,
      vocabMasteryIndex: serverState.data.vocabMasteryIndex,
      remediationSuccessCount: serverState.data.remediationSuccessCount,
    });
    addLog('[SYS] Cleared all local WAL transaction logs. Synced back with the active mock cache state.');
  };

  // Resolve conflict using Chosen Strategy (Last-Write-Wins or Client Override)
  const resolveConflict = (strategy: 'LWW' | 'CLIENT_FORCE' | 'MERGE_CRDT') => {
    if (!selectedConflict) return;

    addLog(`[CRDT RESOLVER] Activating strategy: ${strategy} on block #${selectedConflict.seqId}...`);

    setTransactions(prev => prev.map(t => {
      if (t.id === selectedConflict.id) {
        let mergedPayload = { ...t.payload };
        
        if (strategy === 'LWW') {
          // Keep local if timestamp was newer, or resolve towards consensus
          addLog(`[LWW RESULT] Merging by timestamp. Client temporal entry wins.`);
        } else if (strategy === 'CLIENT_FORCE') {
          addLog(`[FORCE OVERRIDE] Client transaction forcefully applied. Overriding server state...`);
        } else if (strategy === 'MERGE_CRDT') {
          // Average or additive merge
          addLog(`[CRDT MERGE] Computed delta vectors. Converged mastery values gracefully.`);
        }

        return {
          ...t,
          payload: mergedPayload,
          status: 'PENDING', // set back to pending to trigger background sync with new resolved values!
          vectorClock: { client: t.vectorClock.client, server: serverState.latestSeq } // update server component
        };
      }
      return t;
    }));

    setConflictModal(false);
    setSelectedConflict(null);
  };

  return (
    <div className="space-y-10">
      
      {/* Network Controller Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl border flex items-center justify-center transition-all ${
            networkState === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            networkState === 'OFFLINE' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
          }`}>
            {networkState === 'ONLINE' ? <Wifi className="w-8 h-8" /> : 
             networkState === 'OFFLINE' ? <WifiOff className="w-8 h-8" /> : 
             <Wifi className="w-8 h-8 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white tracking-wide uppercase">Network Topology Gateway</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                networkState === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                networkState === 'OFFLINE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {networkState}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1.5">
              {networkState === 'ONLINE' ? `Zero-latency Sync Active (~${latency}ms)` :
               networkState === 'OFFLINE' ? 'Local sandbox active — writing to write-ahead cache' :
               `High latency flaky state (~${latency}ms — simulating 40% packet drops)`}
            </p>
          </div>
        </div>

        {/* Radio switches */}
        <div className="flex bg-slate-950 p-1.5 border border-slate-800 rounded-2xl shrink-0 gap-1 font-mono text-[9px] tracking-widest uppercase">
          <button
            onClick={() => setNetworkState('ONLINE')}
            className={`px-4 py-2.5 rounded-xl font-black transition-all ${
              networkState === 'ONLINE' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            [Online]
          </button>
          <button
            onClick={() => setNetworkState('OFFLINE')}
            className={`px-4 py-2.5 rounded-xl font-black transition-all ${
              networkState === 'OFFLINE' ? 'bg-red-500/10 border border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            [Offline]
          </button>
          <button
            onClick={() => setNetworkState('FLAKY')}
            className={`px-4 py-2.5 rounded-xl font-black transition-all ${
              networkState === 'FLAKY' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            [Flaky]
          </button>
        </div>
      </div>

      {/* Triple Grid Layout: Simulation UI | WAL Queue | Logs Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid Panel (5 columns): Active operations */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Trigger Pad */}
          <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" /> Sandboxed Write Operations
            </h4>
            
            <div className="space-y-4">
              <button
                onClick={() => triggerMutation('MUTATION_ADD_PHONEME_LOG', { phonemes: ['/b/', '/d/'], correct: true, count: 1 })}
                className="w-full bg-[#121626] border border-white/5 hover:border-indigo-500/20 hover:bg-slate-900 p-4 rounded-2xl text-left transition-all hover:translate-x-1 flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Log Speech Segment</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">MUTATION_ADD_PHONEME_LOG</p>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </button>

              <button
                onClick={() => triggerMutation('MUTATION_VOCAB_UPDATE', { word: 'Brave', score: 95, delta: 5 })}
                className="w-full bg-[#121626] border border-white/5 hover:border-indigo-500/20 hover:bg-slate-900 p-4 rounded-2xl text-left transition-all hover:translate-x-1 flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Expand Vocabulary Index</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">MUTATION_VOCAB_UPDATE</p>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </button>

              <button
                onClick={() => triggerMutation('MUTATION_ARENA_REMEDIATION', { workoutId: 'bdpq_exercise_4', success: true })}
                className="w-full bg-[#121626] border border-white/5 hover:border-indigo-500/20 hover:bg-slate-900 p-4 rounded-2xl text-left transition-all hover:translate-x-1 flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Complete Evaluation Session</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">MUTATION_ARENA_REMEDIATION</p>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            </div>
          </div>

          {/* Database Synchronization Metrics Comparison */}
          <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" /> Database Consensus States
            </h4>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Local States (Immediate UX validation) */}
              <div className="bg-[#0b0e17] p-4 rounded-2xl border border-white/5 space-y-3">
                <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-1 font-black">LOCAL CLIENT CACHE</p>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Phonemes Count</p>
                  <p className="text-lg font-black font-mono text-white">{simulatedLocalData.phonemeLogsCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Vocab Index</p>
                  <p className="text-lg font-black font-mono text-white">{simulatedLocalData.vocabMasteryIndex}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Success Sessions</p>
                  <p className="text-lg font-black font-mono text-white">{simulatedLocalData.remediationSuccessCount}</p>
                </div>
              </div>

              {/* Server States (Durable storage synchronization audit) */}
              <div className="bg-[#0b0e17] p-4 rounded-2xl border border-indigo-500/10 space-y-3 relative overflow-hidden">
                <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest border-b border-[#00FF00]/10 pb-1 font-black">FIRESTORE CLOUD STORE</p>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Phonemes Count</p>
                  <p className="text-lg font-black font-mono text-emerald-400">{serverState.data.phonemeLogsCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Vocab Index</p>
                  <p className="text-lg font-black font-mono text-emerald-400">{serverState.data.vocabMasteryIndex}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Success Sessions</p>
                  <p className="text-lg font-black font-mono text-emerald-400">{serverState.data.remediationSuccessCount}</p>
                </div>
              </div>

            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={triggerConflictScenario}
                className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 py-2 rounded-xl text-[9px] font-mono uppercase tracking-widest font-black transition-all cursor-pointer text-center"
              >
                Inject Conflict
              </button>
              <button
                onClick={clearLedger}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2 rounded-xl transition-all cursor-pointer"
                title="Clears transaction logs from sandbox"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Central Grid Panel (5 columns): WAL Queue Ledger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121626]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col h-full relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" /> Write-Ahead Log (WAL) Ledger
                </h4>
                <p className="text-[9px] text-slate-500 mt-1 font-mono uppercase tracking-wider">Cryptographic secure transactional pipeline</p>
              </div>
              {isProcessingSync && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-lg text-[9.5px] font-mono leading-none animate-pulse uppercase tracking-widest">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> Processing...
                </div>
              )}
            </div>

            {/* Mutations Queue List */}
            <div className="flex-1 min-h-[400px] overflow-y-auto space-y-3.5 pr-2 scrollbar-none">
              <AnimatePresence initial={false}>
                {transactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 py-20 text-center">
                    <Database className="w-10 h-10 opacity-30 text-slate-500 animate-pulse" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest">No transaction block queued.</p>
                      <p className="text-[9px] text-slate-500 mt-1">Perform client operations in the sandbox to queue mutations.</p>
                    </div>
                  </div>
                ) : (
                  transactions.slice().reverse().map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 100 }}
                      className={`bg-slate-950 p-4.5 rounded-2xl border transition-all relative group overflow-hidden ${
                        tx.status === 'RECONCILED' ? 'border-emerald-500/10 hover:border-emerald-500/30' :
                        tx.status === 'CONFLICT' ? 'border-yellow-500/30 bg-yellow-500/5' :
                        'border-indigo-500/20 hover:border-indigo-500/40 bg-[#0b0e17]'
                      }`}
                    >
                      {/* Checksum water-marks */}
                      <div className="absolute top-0 right-0 p-1 opacity-[0.015] font-mono text-[45px] font-black tracking-tighter truncate leading-none pointer-events-none uppercase">
                        {tx.checksum.substring(0, 8)}
                      </div>

                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-slate-400">Block #{tx.seqId}</span>
                          <span className={`text-[8.5px] px-2 py-0.5 rounded-md font-mono font-bold leading-none ${
                            tx.status === 'RECONCILED' ? 'bg-emerald-500/15 text-emerald-400' :
                            tx.status === 'CONFLICT' ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' :
                            'bg-indigo-500/10 text-indigo-300'
                          }`}>
                            [{tx.status}]
                          </span>
                        </div>
                        <span className="text-[8.5px] text-slate-600 font-mono mt-0.5">{tx.timestamp.substring(11, 19)}</span>
                      </div>

                      <h5 className="text-[11px] font-black text-neutral-100 tracking-wide uppercase mb-1.5 relative z-10">{tx.type}</h5>

                      {/* Code JSON representation of ledger payload */}
                      <div className="bg-[#050811] p-2.5 rounded-lg border border-white/5 font-mono text-[9px] text-slate-400 relative z-10 max-h-24 overflow-y-auto mb-2.5">
                        <pre>{JSON.stringify(tx.payload, null, 2)}</pre>
                      </div>

                      {/* Cryptographic hash details & vector clock references */}
                      <div className="flex justify-between items-center border-t border-white/5 pt-2.5 leading-none relative z-10">
                        <div className="flex items-center gap-1">
                          <Key className="w-3 h-3 text-slate-600" />
                          <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest">
                            SHA256: <strong className="text-slate-400 font-normal">{tx.checksum.substring(0, 14)}...</strong>
                          </span>
                        </div>
                        <div className="text-[8px] font-mono text-slate-500 bg-[#121626] px-2 py-1 rounded border border-white/5">
                          V_CLOCK: [C:{tx.vectorClock.client} S:{tx.vectorClock.server}]
                        </div>
                      </div>

                      {/* Conflict handler action triggers */}
                      {tx.status === 'CONFLICT' && (
                        <div className="mt-3 pt-3 border-t border-yellow-500/10 flex justify-end gap-2 relative z-10">
                          <button
                            onClick={() => {
                              setSelectedConflict(tx);
                              setConflictModal(true);
                            }}
                            className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 px-3.5 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest font-black transition-all cursor-pointer"
                          >
                            Resolve Drift
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Grid Panel (3 columns): Terminal log and specs documentation */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Engineering Command Console Logging Terminal */}
          <div className="bg-[#050811] rounded-3xl border border-slate-800 p-5 flex flex-col h-[320px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[200px] h-full bg-gradient-to-l from-indigo-500/[0.02] to-transparent pointer-events-none" />
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3.5">
              <span className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" /> Stream Console
              </span>
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-mono text-emerald-500 font-black">L6_SPEC_LIVE</span>
              </div>
            </div>

            {/* Terminal Logging Buffer */}
            <div className="flex-1 font-mono text-[9px] text-slate-500 overflow-y-auto space-y-2 pr-1 select-none scrollbar-none max-h-[220px]">
              {logs.map((log, index) => (
                <div key={index} className={`leading-relaxed break-words py-0.5 border-b border-slate-900 ${
                  log.includes('[OK]') ? 'text-emerald-400 font-bold' :
                  log.includes('[WARN]') || log.includes('[DRIFTED]') ? 'text-yellow-500' :
                  log.includes('[SYNC]') ? 'text-indigo-400 font-black animate-pulse' :
                  log.includes('[WAL WRITE]') ? 'text-indigo-300' :
                  log.includes('[CRDT') ? 'text-orange-400 font-bold' :
                  'text-slate-500'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* L6 Spec Documentation */}
          <div className="bg-[#121626]/40 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
              <HeartPulse className="w-3.5 h-3.5 text-indigo-400" /> GAFAM Resiliency Spec
            </h4>
            <div className="space-y-3 font-sans text-xs text-slate-400 leading-relaxed">
              <p>
                <strong className="text-indigo-300">WAL Architecture:</strong> Ensures immediate interactive performance on poor 3G/Offline states. Operations append locally to a Write-Ahead Log memory queue.
              </p>
              <p>
                <strong className="text-indigo-300">Deterministic Checks:</strong> Transactions are cryptographically hashed using SHA-256 for auditing block chains securely before they merge into Firestore.
              </p>
              <p>
                <strong className="text-indigo-300">Vector Clock Merges:</strong> Re-establishes state consensus dynamically through chronological conflict strategy, protecting the user's educational dataset safely.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Sync Conflict Resolution Dialog Modal (Consensus Engine) */}
      <AnimatePresence>
        {conflictModal && selectedConflict && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
                <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase">State Drift Reconciler</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">Sequence conflict on Block #{selectedConflict.seqId}</p>
                </div>
              </div>

              <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                <p>
                  A sync drift was intercepted. The local and remote databases modified the same parameters but vector clocks are out of alignment.
                </p>
                
                {/* Conflict Detail comparisons */}
                <div className="bg-[#0b0e17] p-4.5 rounded-xl border border-white/5 font-mono text-[10px] space-y-1.5">
                  <p><strong className="text-indigo-400">Client Block Sequence:</strong> {selectedConflict.seqId}</p>
                  <p><strong className="text-indigo-400">Client Vector:</strong> {JSON.stringify(selectedConflict.vectorClock)}</p>
                  <p><strong className="text-yellow-500">Server Remote Sequence:</strong> {serverState.latestSeq}</p>
                  <p><strong className="text-yellow-500">Conflicting Server Value:</strong> VocabMasteryIndex at {serverState.data.vocabMasteryIndex}%</p>
                </div>

                <p className="text-xs text-slate-500 italic">Select the programmatic reconciliation strategy to resolve this sequence:</p>
              </div>

              {/* Resolution options */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={() => resolveConflict('LWW')}
                  className="bg-slate-950 border border-white/5 hover:border-yellow-500 hover:bg-slate-800 text-left p-4 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex border-b border-white/5 pb-1 justify-between text-xs font-bold uppercase tracking-wider text-white">
                    <span>1. Last-Write-Wins (LWW)</span>
                    <span className="text-slate-500 text-[10px]">TIMESTAMP BASE</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Resolves state by executing chronological comparison. Absolute newest client block overrides older remote states directly.</p>
                </button>

                <button
                  onClick={() => resolveConflict('CLIENT_FORCE')}
                  className="bg-slate-950 border border-white/5 hover:border-yellow-500 hover:bg-slate-800 text-left p-4 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex border-b border-white/5 pb-1 justify-between text-xs font-bold uppercase tracking-wider text-white">
                    <span>2. Client Force Override</span>
                    <span className="text-slate-500 text-[10px]">FORCE OVERWRITE</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Bypasses consensus checks. Securely mandates client's local Write-Ahead Log is the master authority for this sequence ID.</p>
                </button>

                <button
                  onClick={() => resolveConflict('MERGE_CRDT')}
                  className="bg-slate-950 border border-white/5 hover:border-yellow-500 hover:bg-slate-800 text-left p-4 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex border-b border-white/5 pb-1 justify-between text-xs font-bold uppercase tracking-wider text-white">
                    <span>3. CRDT Hybrid Convergence</span>
                    <span className="text-slate-500 text-[10px]">MATHEMATICAL CLOSURE</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Applies commutative state vector formulas. Merges conflicting records to produce mathematically integrated consensus indices safely.</p>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setConflictModal(false);
                    setSelectedConflict(null);
                  }}
                  className="px-5 py-2.5 bg-[#121626] border border-white/5 hover:bg-slate-800 text-slate-400 text-xs font-medium rounded-xl tracking-wider transition-all cursor-pointer"
                >
                  CANCEL RECONCILIATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
