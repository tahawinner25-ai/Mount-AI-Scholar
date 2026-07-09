import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Sparkles, 
  Activity, 
  AlertCircle, 
  MessageSquare,
  HelpCircle,
  Network
} from "lucide-react";
import { MainViewType } from "../../types";

interface VoiceConversationViewProps {
  onBack: () => void;
}

export default function VoiceConversationView({ onBack }: VoiceConversationViewProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "listening" | "speaking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string; id: string }[]>([]);
  const [currentSpeechText, setCurrentSpeechText] = useState<string>("");
  const [currentUserText, setCurrentUserText] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  // Track conversation for auto-scroll
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSpeechText, currentUserText]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const stopAndClearAllSources = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
  };

  const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const base64Encode = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const playAudioChunk = (base64: string) => {
    const outputAudioCtx = outputAudioCtxRef.current;
    if (!outputAudioCtx || outputAudioCtx.state === "suspended") return;

    try {
      // 1. Decode base64 to binary
      const binary = window.atob(base64);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // 2. Convert 16-bit signed PCM to Float32
      const view = new DataView(buffer);
      const numSamples = len / 2;
      const floatData = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const sample = view.getInt16(i * 2, true);
        floatData[i] = sample / (sample < 0 ? 0x8000 : 0x7FFF);
      }

      // 3. Create AudioBuffer (24kHz is Gemini Live's native output sample rate)
      const audioBuffer = outputAudioCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(floatData, 0);

      // 4. Schedule playback with overlap prevention (gapless output queuing)
      const source = outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioCtx.destination);

      const currentTime = outputAudioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05; // 50ms scheduling padding to prevent pops
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      setStatus("speaking");

      source.onended = () => {
        // Remove source from tracking list when finished
        activeSourcesRef.current = activeSourcesRef.current.filter(src => src !== source);
        if (activeSourcesRef.current.length === 0) {
          setStatus("connected");
        }
      };

    } catch (e) {
      console.error("Error processing audio chunk for playback:", e);
    }
  };

  const connect = async () => {
    try {
      setErrorMsg("");
      setStatus("connecting");

      // Initialize AudioContexts
      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputAudioCtx;
      outputAudioCtxRef.current = outputAudioCtx;

      // Access Mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Establish WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected to live proxy");
        setStatus("connected");
        setMessages([
          {
            sender: "ai",
            text: "Bonjour ! Je suis ton tuteur d'accessibilité en direct. Parle-moi et entraînons-nous ensemble.",
            id: "initial"
          }
        ]);

        // Start Mic Processing
        const source = inputAudioCtx.createMediaStreamSource(stream);
        const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const rawChannelData = e.inputBuffer.getChannelData(0);
            
            // Check for silence to update UI states between speaking
            const hasActivity = rawChannelData.some(sample => Math.abs(sample) > 0.02);
            if (hasActivity && status === "connected") {
              setStatus("listening");
            }

            const pcmBuffer = floatTo16BitPCM(rawChannelData);
            const base64Audio = base64Encode(pcmBuffer);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.error) {
            console.error("[WS Server Error]", msg.error);
            setErrorMsg(msg.error);
            setStatus("error");
            return;
          }

          if (msg.interrupted) {
            console.log("[WS] Gemini was interrupted by user speech.");
            stopAndClearAllSources();
            setStatus("listening");
            // Commit any current partial AI speech text as interrupted
            setCurrentSpeechText(prev => prev ? prev + "... (interrompu)" : "");
            return;
          }

          if (msg.transcriptInput) {
            setCurrentUserText(prev => prev + " " + msg.transcriptInput);
          }

          if (msg.transcriptOutput) {
            setCurrentSpeechText(prev => prev + msg.transcriptOutput);
          }

          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (e) => {
        console.error("WS error:", e);
        setErrorMsg("Connexion WebSocket interrompue ou refusée.");
        setStatus("error");
      };

      ws.onclose = (e) => {
        console.log("WS closed:", e);
        if (status !== "error") {
          setStatus("idle");
        }
      };

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setErrorMsg(err.message || "Impossible d'accéder au micro ou de démarrer la session.");
      setStatus("error");
    }
  };

  const disconnect = () => {
    setStatus("idle");
    stopAndClearAllSources();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Save final texts to message log if they exist
    if (currentUserText.trim()) {
      setMessages(prev => [...prev, { sender: "user", text: currentUserText.trim(), id: String(Date.now() - 1) }]);
      setCurrentUserText("");
    }
    if (currentSpeechText.trim()) {
      setMessages(prev => [...prev, { sender: "ai", text: currentSpeechText.trim(), id: String(Date.now()) }]);
      setCurrentSpeechText("");
    }
  };

  const handleToggleConnection = () => {
    if (status === "idle" || status === "error") {
      connect();
    } else {
      disconnect();
    }
  };

  // Helper to commit ongoing speech when state settles
  useEffect(() => {
    if (status === "connected" || status === "idle") {
      if (currentUserText.trim()) {
        setMessages(prev => [...prev, { sender: "user", text: currentUserText.trim(), id: String(Date.now() - 1) }]);
        setCurrentUserText("");
      }
      if (currentSpeechText.trim()) {
        setMessages(prev => [...prev, { sender: "ai", text: currentSpeechText.trim(), id: String(Date.now()) }]);
        setCurrentSpeechText("");
      }
    }
  }, [status]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
        <div>
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest mb-3 transition-colors bg-slate-900/60 hover:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Retour au Hub
          </button>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
            Real-time <span className="text-orange-500">Voice Assistant</span>
          </h2>
          <p className="text-slate-500 font-medium font-mono text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            Gemini Live API (3.1 Flash Live Preview) • Zero Latency Multimodal Conversational Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center gap-3.5 backdrop-blur-md">
            <div className={`w-2.5 h-2.5 rounded-full ${
              status === "connected" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" :
              status === "speaking" ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] animate-pulse" :
              status === "listening" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-ping" :
              status === "connecting" ? "bg-amber-500 animate-pulse" :
              status === "error" ? "bg-red-500" : "bg-slate-600"
            }`} />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">
              {status === "idle" && "Déconnecté"}
              {status === "connecting" && "Connexion en cours..."}
              {status === "connected" && "Connecté • Prêt"}
              {status === "listening" && "Gemini vous écoute..."}
              {status === "speaking" && "Gemini parle..."}
              {status === "error" && "Erreur"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Orb and Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col items-center justify-between min-h-[450px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px] pointer-events-none -translate-x-1/4 -translate-y-1/4" />
            
            <div className="text-center w-full z-10">
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-1">
                Acoustic Field
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Portail Vocal Actif
              </h3>
            </div>

            {/* Glowing Interactive Visualizer Orb */}
            <div className="relative w-48 h-48 flex items-center justify-center my-6 z-10">
              {/* Outer pulsing shadow layers */}
              <div className={`absolute inset-0 rounded-full transition-all duration-700 blur-[30px] opacity-30 ${
                status === "speaking" ? "bg-orange-500 scale-125" :
                status === "listening" ? "bg-blue-500 scale-115" :
                status === "connected" ? "bg-emerald-500 scale-100" :
                status === "connecting" ? "bg-amber-500 scale-105" :
                status === "error" ? "bg-red-500 scale-100" : "bg-slate-800 scale-90"
              }`} />

              <div className={`absolute inset-2 rounded-full transition-all duration-500 border border-white/5 flex items-center justify-center ${
                status === "speaking" ? "animate-spin duration-[4s]" :
                status === "listening" ? "animate-pulse" : ""
              }`}>
                <div className="w-full h-full rounded-full border border-dashed border-white/10" />
              </div>

              {/* Inner central sphere */}
              <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative border ${
                status === "speaking" ? "bg-gradient-to-tr from-orange-600 to-amber-500 border-orange-400 text-white" :
                status === "listening" ? "bg-gradient-to-tr from-blue-600 to-indigo-500 border-blue-400 text-white" :
                status === "connected" ? "bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400 text-white" :
                status === "connecting" ? "bg-gradient-to-tr from-amber-600 to-orange-500 border-amber-400 text-white animate-pulse" :
                status === "error" ? "bg-gradient-to-tr from-red-600 to-rose-500 border-red-400 text-white" :
                "bg-slate-950 border-slate-800 text-slate-500"
              }`}>
                {status === "speaking" && <Volume2 className="w-10 h-10 animate-bounce" />}
                {status === "listening" && <Activity className="w-10 h-10 animate-pulse" />}
                {status === "connected" && <Mic className="w-10 h-10 text-white" />}
                {status === "connecting" && <Network className="w-10 h-10 animate-spin" />}
                {status === "error" && <AlertCircle className="w-10 h-10 animate-shake" />}
                {status === "idle" && <MicOff className="w-10 h-10" />}

                {/* Status text label on sphere */}
                <span className="text-[9px] font-black uppercase tracking-widest mt-2 block font-mono">
                  {status === "speaking" && "DIFFUSION"}
                  {status === "listening" && "ÉCOUTE ACTIVE"}
                  {status === "connected" && "DISPO"}
                  {status === "connecting" && "SYNC..."}
                  {status === "error" && "ERREUR"}
                  {status === "idle" && "MUET"}
                </span>
              </div>
            </div>

            {/* Interaction Button */}
            <div className="w-full space-y-4 z-10">
              <button
                onClick={handleToggleConnection}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-3 border shadow-lg cursor-pointer ${
                  status === "idle" || status === "error"
                    ? "bg-white border-white text-black hover:bg-slate-200"
                    : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                }`}
              >
                {status === "idle" || status === "error" ? (
                  <>
                    <Mic className="w-4 h-4" />
                    Démarrer la Conversation
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    Arrêter & Raccrocher
                  </>
                )}
              </button>

              {status === "idle" && (
                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-mono">
                  Utilise le micro de ton PC/iPad pour interagir
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Live Transcripts & Conversations */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] p-6 md:p-8 flex-1 flex flex-col justify-between min-h-[450px]">
            
            {/* Box Header */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Fils de Transcription Direct
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[8px] font-mono font-black uppercase tracking-widest rounded-lg">
                Temps Réel
              </span>
            </div>

            {/* Chat Flow Container */}
            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-4 pr-2 scrollbar-thin">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  } animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1 font-black">
                    {m.sender === "user" ? "Vous" : "Gemini Live"}
                  </span>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-md ${
                    m.sender === "user"
                      ? "bg-slate-950 border border-slate-800 text-slate-200 rounded-tr-none"
                      : "bg-orange-500/10 border border-orange-500/20 text-orange-200 rounded-tl-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Streaming Content indicators */}
              {currentUserText && (
                <div className="flex flex-col items-end max-w-[85%] ml-auto animate-pulse">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1 font-black">Vous (Détection parole...)</span>
                  <div className="p-4 rounded-2xl text-xs bg-slate-950/60 border border-slate-800 text-slate-400 rounded-tr-none">
                    {currentUserText}
                  </div>
                </div>
              )}

              {currentSpeechText && (
                <div className="flex flex-col items-start max-w-[85%] mr-auto">
                  <span className="text-[8px] font-mono text-orange-500 uppercase tracking-widest mb-1 font-black">Gemini Live (Synthèse...)</span>
                  <div className="p-4 rounded-2xl text-xs bg-orange-500/5 border border-orange-500/10 text-orange-300 rounded-tl-none">
                    {currentSpeechText}
                  </div>
                </div>
              )}

              {messages.length === 0 && !currentUserText && !currentSpeechText && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-4 py-12">
                  <Volume2 className="w-8 h-8 opacity-25" />
                  <p className="text-xs max-w-sm leading-relaxed font-sans font-medium">
                    Aucune parole transmise pour le moment. Cliquez sur le bouton pour démarrer le canal audio bidirectionnel.
                  </p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="mt-4 p-4.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3.5 items-start">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-400 font-sans leading-relaxed">
                  <strong className="text-white font-bold uppercase tracking-widest text-[9px] block mb-0.5">Erreur de Flux</strong>
                  {errorMsg}
                </div>
              </div>
            )}

            {/* Suggestion tags to click/talk about */}
            <div className="mt-6 pt-4 border-t border-slate-800/60">
              <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-2">
                Idées de Sujets d'Entraînement
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Propose-moi un virelangue",
                  "Aide-moi à épeler spectacle",
                  "Comment prononcer le mot phonétique ?",
                  "Explique la dyslexie simplement"
                ].map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (status === "connected" && wsRef.current?.readyState === WebSocket.OPEN) {
                        // We can send text input too
                        wsRef.current.send(JSON.stringify({ text: topic }));
                        setMessages(prev => [...prev, { sender: "user", text: topic, id: String(Date.now() + i) }]);
                      }
                    }}
                    disabled={status !== "connected"}
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[10px] font-bold transition-all uppercase cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
