import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, MicOff, Volume2, Sparkles, RefreshCw, Eye, 
  Layers, Download, Copy, Check, Play, Pause, Zap, 
  ArrowLeft, Camera, VideoOff, RotateCw, Orbit, Compass,
  Radio, Sliders, Maximize2, Activity, ShieldCheck, Flame, Info
} from 'lucide-react';
import { downloadPdfDocument } from '../../utils/pdfExport';
import { MainViewType } from '../../types';

interface PhoneticVisualizerViewProps {
  setMainView: (view: MainViewType) => void;
  user?: any;
  onAddToWorkspace?: (title: string, text: string) => void;
}

interface PhoneticToken {
  id: string;
  text: string;
  type: 'vowel' | 'consonant' | 'complex' | 'silent' | 'punct';
  ipa: string;
  isAnchor?: boolean;
  angle: number;
  radius: number;
  speed: number;
  ring: number; // 1 = inner, 2 = middle, 3 = outer
  size: number;
  freq: number;
}

interface AnalyzedWord {
  raw: string;
  syllables: {
    tokens: PhoneticToken[];
  }[];
}

const COMPLEX_DIGRAPHS: { [key: string]: { ipa: string; freq: number } } = {
  'eau': { ipa: '/o/', freq: 440 },
  'eaux': { ipa: '/o/', freq: 440 },
  'eux': { ipa: '/ø/', freq: 480 },
  'eur': { ipa: '/œʁ/', freq: 390 },
  'oin': { ipa: '/wɛ̃/', freq: 520 },
  'ien': { ipa: '/jɛ̃/', freq: 560 },
  'ion': { ipa: '/jɔ̃/', freq: 540 },
  'ail': { ipa: '/aj/', freq: 620 },
  'eil': { ipa: '/ɛj/', freq: 580 },
  'euil': { ipa: '/œj/', freq: 490 },
  'ouil': { ipa: '/uj/', freq: 430 },
  'ou': { ipa: '/u/', freq: 350 },
  'on': { ipa: '/ɔ̃/', freq: 380 },
  'in': { ipa: '/ɛ̃/', freq: 510 },
  'an': { ipa: '/ɑ̃/', freq: 360 },
  'en': { ipa: '/ɑ̃/', freq: 360 },
  'am': { ipa: '/ɑ̃/', freq: 360 },
  'em': { ipa: '/ɑ̃/', freq: 360 },
  'om': { ipa: '/ɔ̃/', freq: 380 },
  'im': { ipa: '/ɛ̃/', freq: 510 },
  'un': { ipa: '/œ̃/', freq: 470 },
  'um': { ipa: '/ɔm/', freq: 410 },
  'oi': { ipa: '/wa/', freq: 490 },
  'ai': { ipa: '/ɛ/', freq: 550 },
  'ei': { ipa: '/ɛ/', freq: 550 },
  'au': { ipa: '/o/', freq: 440 },
  'eu': { ipa: '/ø/', freq: 480 },
  'ch': { ipa: '/ʃ/', freq: 720 },
  'ph': { ipa: '/f/', freq: 680 },
  'gn': { ipa: '/ɲ/', freq: 610 },
  'th': { ipa: '/t/', freq: 590 },
  'gu': { ipa: '/ɡ/', freq: 320 },
  'qu': { ipa: '/k/', freq: 650 },
  'll': { ipa: '/j/', freq: 570 },
  'ss': { ipa: '/s/', freq: 800 },
  'tt': { ipa: '/t/', freq: 600 },
  'ff': { ipa: '/f/', freq: 680 },
  'pp': { ipa: '/p/', freq: 300 },
  'rr': { ipa: '/ʁ/', freq: 280 },
  'cc': { ipa: '/k/', freq: 650 },
  'ck': { ipa: '/k/', freq: 650 },
  'sh': { ipa: '/ʃ/', freq: 720 },
  'tch': { ipa: '/tʃ/', freq: 750 }
};

const VOWEL_IPAS: { [key: string]: { ipa: string; freq: number } } = {
  'a': { ipa: '/a/', freq: 440 },
  'à': { ipa: '/a/', freq: 440 },
  'â': { ipa: '/ɑ/', freq: 430 },
  'e': { ipa: '/ə/', freq: 500 },
  'é': { ipa: '/e/', freq: 550 },
  'è': { ipa: '/ɛ/', freq: 520 },
  'ê': { ipa: '/ɛ/', freq: 520 },
  'ë': { ipa: '/ɛ/', freq: 520 },
  'i': { ipa: '/i/', freq: 660 },
  'î': { ipa: '/i/', freq: 660 },
  'ï': { ipa: '/i/', freq: 660 },
  'o': { ipa: '/o/', freq: 392 },
  'ô': { ipa: '/o/', freq: 392 },
  'u': { ipa: '/y/', freq: 587 },
  'û': { ipa: '/y/', freq: 587 },
  'ù': { ipa: '/y/', freq: 587 },
  'ü': { ipa: '/y/', freq: 587 },
  'y': { ipa: '/i/', freq: 660 }
};

const CONSONANT_IPAS: { [key: string]: { ipa: string; freq: number } } = {
  'b': { ipa: '/b/', freq: 220 },
  'c': { ipa: '/k/', freq: 650 },
  'd': { ipa: '/d/', freq: 290 },
  'f': { ipa: '/f/', freq: 680 },
  'g': { ipa: '/ɡ/', freq: 310 },
  'h': { ipa: '/h/', freq: 200 },
  'j': { ipa: '/ʒ/', freq: 530 },
  'k': { ipa: '/k/', freq: 650 },
  'l': { ipa: '/l/', freq: 380 },
  'm': { ipa: '/m/', freq: 260 },
  'n': { ipa: '/n/', freq: 340 },
  'p': { ipa: '/p/', freq: 300 },
  'q': { ipa: '/k/', freq: 650 },
  'r': { ipa: '/ʁ/', freq: 270 },
  's': { ipa: '/s/', freq: 820 },
  't': { ipa: '/t/', freq: 590 },
  'v': { ipa: '/v/', freq: 410 },
  'w': { ipa: '/w/', freq: 330 },
  'x': { ipa: '/ks/', freq: 740 },
  'z': { ipa: '/z/', freq: 760 }
};

function decomposeTextToPhonemes(text: string): { words: AnalyzedWord[]; nodes: PhoneticToken[] } {
  const clean = text.trim();
  if (!clean) return { words: [], nodes: [] };

  const rawWords = clean.split(/\s+/).filter(w => w.length > 0);
  const allNodes: PhoneticToken[] = [];
  let tokenCounter = 0;

  const words: AnalyzedWord[] = rawWords.map((word, wordIdx) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
    if (!cleanWord) {
      return {
        raw: word,
        syllables: [{
          tokens: [{
            id: `tok-${tokenCounter++}`,
            text: word,
            type: 'punct',
            ipa: '',
            angle: Math.random() * Math.PI * 2,
            radius: 120,
            speed: 0.005,
            ring: 1,
            size: 20,
            freq: 300
          }]
        }]
      };
    }

    let mainPart = cleanWord;
    let silentEnding = '';
    const lowerClean = cleanWord.toLowerCase();

    if (cleanWord.length > 2) {
      if (lowerClean.endsWith('ent') && cleanWord.length > 4) {
        silentEnding = cleanWord.slice(-3);
        mainPart = cleanWord.slice(0, -3);
      } else if (/[es|e|s|t|d|x|z|p]$/.test(lowerClean) && !/^(et|est|le|ce|de|se|te|ne|me|un)$/i.test(cleanWord)) {
        silentEnding = cleanWord.slice(-1);
        mainPart = cleanWord.slice(0, -1);
      }
    }

    const sylRegex = /[^aeyuioœéèêëàâîïôûùüAEYUIOŒÉÈÊËÀÂÎÏÔÛÙÜ]*[aeyuioœéèêëàâîïôûùüAEYUIOŒÉÈÊËÀÂÎÏÔÛÙÜ]+(?:[^aeyuioœéèêëàâîïôûùüAEYUIOŒÉÈÊËÀÂÎÏÔÛÙÜ](?=[^aeyuioœéèêëàâîïôûùüAEYUIOŒÉÈÊËÀÂÎÏÔÛÙÜ]|$))?/gi;
    const rawSyllables = mainPart.match(sylRegex) || [mainPart];

    const syllables = rawSyllables.map((syl, sylIdx) => {
      const tokens: PhoneticToken[] = [];
      let i = 0;
      const sylLower = syl.toLowerCase();

      while (i < syl.length) {
        let matchedComplex = '';
        for (const d of Object.keys(COMPLEX_DIGRAPHS)) {
          if (sylLower.startsWith(d, i)) {
            if (d.length > matchedComplex.length) {
              matchedComplex = syl.substring(i, i + d.length);
            }
          }
        }

        if (matchedComplex) {
          const lowerD = matchedComplex.toLowerCase();
          const info = COMPLEX_DIGRAPHS[lowerD] || { ipa: `/${matchedComplex}/`, freq: 500 };
          const tok: PhoneticToken = {
            id: `tok-${tokenCounter++}`,
            text: matchedComplex,
            type: 'complex',
            ipa: info.ipa,
            isAnchor: sylIdx === 0 && i === 0,
            angle: (tokenCounter * 0.7) % (Math.PI * 2),
            radius: 220 + (tokenCounter % 3) * 20,
            speed: 0.008 + (tokenCounter % 4) * 0.002,
            ring: 3,
            size: 28,
            freq: info.freq
          };
          tokens.push(tok);
          allNodes.push(tok);
          i += matchedComplex.length;
          continue;
        }

        const char = syl[i];
        const charLower = char.toLowerCase();

        if (VOWEL_IPAS[charLower]) {
          const info = VOWEL_IPAS[charLower];
          const tok: PhoneticToken = {
            id: `tok-${tokenCounter++}`,
            text: char,
            type: 'vowel',
            ipa: info.ipa,
            isAnchor: sylIdx === 0 && i === 0,
            angle: (tokenCounter * 0.8) % (Math.PI * 2),
            radius: 110 + (tokenCounter % 3) * 15,
            speed: 0.012 + (tokenCounter % 3) * 0.003,
            ring: 1,
            size: 24,
            freq: info.freq
          };
          tokens.push(tok);
          allNodes.push(tok);
        } else if (CONSONANT_IPAS[charLower]) {
          const info = CONSONANT_IPAS[charLower];
          const tok: PhoneticToken = {
            id: `tok-${tokenCounter++}`,
            text: char,
            type: 'consonant',
            ipa: info.ipa,
            isAnchor: sylIdx === 0 && i === 0,
            angle: (tokenCounter * 0.6) % (Math.PI * 2),
            radius: 165 + (tokenCounter % 3) * 18,
            speed: 0.009 + (tokenCounter % 3) * 0.002,
            ring: 2,
            size: 24,
            freq: info.freq
          };
          tokens.push(tok);
          allNodes.push(tok);
        } else {
          const tok: PhoneticToken = {
            id: `tok-${tokenCounter++}`,
            text: char,
            type: 'punct',
            ipa: '',
            angle: (tokenCounter * 0.5) % (Math.PI * 2),
            radius: 90,
            speed: 0.005,
            ring: 1,
            size: 18,
            freq: 300
          };
          tokens.push(tok);
        }
        i++;
      }
      return { tokens };
    });

    if (silentEnding && syllables.length > 0) {
      const lastSyl = syllables[syllables.length - 1];
      const tok: PhoneticToken = {
        id: `tok-${tokenCounter++}`,
        text: silentEnding,
        type: 'silent',
        ipa: '∅',
        angle: (tokenCounter * 0.4) % (Math.PI * 2),
        radius: 270,
        speed: 0.004,
        ring: 3,
        size: 20,
        freq: 200
      };
      lastSyl.tokens.push(tok);
      allNodes.push(tok);
    }

    return { raw: word, syllables };
  });

  return { words, nodes: allNodes };
}

export default function PhoneticVisualizerView({ setMainView, user, onAddToWorkspace }: PhoneticVisualizerViewProps) {
  const [activeTab, setActiveTab] = useState<'orbital' | 'ar-camera' | 'synaesthesia'>('orbital');
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [transcript, setTranscript] = useState(
    "Mentora AI orchestre l'orbite des phonèmes pour illuminer la lecture dyslexique."
  );
  const [interimText, setInterimText] = useState("");
  const [activeLang, setActiveLang] = useState<'fr-FR' | 'en-US' | 'es-ES' | 'ar-SA'>('fr-FR');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.85);
  const [bionicSaccade, setBionicSaccade] = useState(true);
  const [orbitSpeedMultiplier, setOrbitSpeedMultiplier] = useState(1);
  const [tilt3D, setTilt3D] = useState<{ pitch: number; yaw: number }>({ pitch: 0.55, yaw: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhoneticToken | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const arCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const PRESETS = [
    { label: "🌟 Orbite Dyslexie", text: "L'orbite gravitationnelle des phonèmes stabilise la lecture saccadique." },
    { label: "⚡ Synesthésie Graphème", text: "Chaque voyelle, consonne et digraphe possède une résonance chromatique et fréquentielle." },
    { label: "🪐 Cluster Phonologique", text: "Spectacle symphonie crocodile papillon magnifique extraordinaire." },
    { label: "🇬🇧 English Orbit", text: "Bionic orbital visualizer accelerates phonological awareness in neurodivergent learners." }
  ];

  // Parse transcript into nodes & words
  const fullText = (transcript + (interimText ? " " + interimText : "")).trim();
  const { words: analyzedWords, nodes: phoneticNodes } = useMemo(() => {
    return decomposeTextToPhonemes(fullText || "Mentora AI");
  }, [fullText]);

  // Keep a mutable ref for animation loop
  const nodesStateRef = useRef<PhoneticToken[]>([]);
  useEffect(() => {
    nodesStateRef.current = phoneticNodes.map(n => ({ ...n }));
  }, [phoneticNodes]);

  // Play synthetic tone for a phoneme
  const playPhonemeTone = (freq: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {
      console.warn("Synth tone audio:", e);
    }
  };

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeLang;

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTrans = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + ' ';
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTrans) {
          setTranscript((prev) => (prev + " " + finalTrans).trim());
          // Play resonant entry sound
          playPhonemeTone(520);
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeLang, isListening]);

  // Audio Analyzer
  const startAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (err) {
      console.warn("Microphone access:", err);
    }
  };

  const stopAudioAnalyzer = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      stopAudioAnalyzer();
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = activeLang;
          recognitionRef.current.start();
        } catch (_) {}
      }
      startAudioAnalyzer();
    }
  };

  // Camera Management for AR Mode
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera init error:", err);
      setCameraError("Accès à la caméra restreint ou non disponible. Mode simulation holographique activé.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'ar-camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Main Canvas Render Loop (Orbital 3D & AR Overlay)
  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const dataArray = new Uint8Array(64);

    const render = () => {
      time += 0.02 * orbitSpeedMultiplier;

      // Read audio energy
      let currentAudioDb = 0;
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 64; i++) sum += dataArray[i];
        currentAudioDb = Math.min(100, Math.round((sum / 64 / 255) * 160));
        setAudioLevel(currentAudioDb);
      }

      const audioBoost = (currentAudioDb / 100) * 0.04;

      // 1. RENDER 3D ORBITAL CANVAS
      if (canvasRef.current && (activeTab === 'orbital' || activeTab === 'synaesthesia')) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const cx = width / 2;
          const cy = height / 2;

          ctx.clearRect(0, 0, width, height);

          // Starfield background
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, width, height);

          // Deep space radial nebula
          const nebula = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(cx, cy));
          nebula.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
          nebula.addColorStop(0.4, 'rgba(99, 102, 241, 0.08)');
          nebula.addColorStop(0.8, 'rgba(168, 85, 247, 0.03)');
          nebula.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
          ctx.fillStyle = nebula;
          ctx.fillRect(0, 0, width, height);

          // Perspective transformation parameters
          const pitch = tilt3D.pitch; // tilt angle (0 to 1)
          const yaw = tilt3D.yaw + time * 0.15; // slow continuous planetary precession

          // DRAW CONCENTRIC ORBITAL RINGS
          const rings = [
            { r: 115, color: 'rgba(34, 211, 238, 0.45)', label: 'R1 • Voyelles (Noyau)' },
            { r: 175, color: 'rgba(52, 211, 153, 0.40)', label: 'R2 • Consonnes (Attaques)' },
            { r: 235, color: 'rgba(217, 70, 239, 0.45)', label: 'R3 • Digraphes Complexes' },
            { r: 295, color: 'rgba(148, 163, 184, 0.25)', label: 'R4 • Lettres Muettes' }
          ];

          rings.forEach((ring, idx) => {
            const rx = ring.r;
            const ry = ring.r * pitch;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(yaw * 0.1);

            // Ring glow
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.restore();
          });

          // DRAW CENTRAL GRAVITATIONAL NUCLEUS
          const corePulse = 28 + Math.sin(time * 3) * 4 + (currentAudioDb / 100) * 14;
          const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, corePulse * 2.2);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, '#38bdf8');
          coreGrad.addColorStop(0.7, 'rgba(79, 70, 229, 0.6)');
          coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.beginPath();
          ctx.arc(cx, cy, corePulse * 2, 0, Math.PI * 2);
          ctx.fillStyle = coreGrad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx, cy, corePulse * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Center Label
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px "OpenDyslexic", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText("IPA", cx, cy);

          // UPDATE & DRAW PHONEME NODES
          const nodes = nodesStateRef.current;
          
          // Sort nodes by 3D Y depth so closer nodes draw on top
          const sortedNodes = nodes.map(node => {
            node.angle += (node.speed + audioBoost) * orbitSpeedMultiplier;
            const effR = node.radius + (currentAudioDb / 100) * 8;
            const x = Math.cos(node.angle + yaw) * effR;
            const y = Math.sin(node.angle + yaw) * effR * pitch;
            const z = Math.sin(node.angle + yaw); // Depth factor (-1 to +1)
            const scale = 0.75 + (z + 1) * 0.25; // Scale with perspective
            return {
              node,
              screenX: cx + x,
              screenY: cy + y,
              z,
              scale
            };
          }).sort((a, b) => a.z - b.z);

          sortedNodes.forEach(({ node, screenX, screenY, scale }) => {
            // Determine colors by type
            let color = '#38bdf8';
            let glow = 'rgba(56, 189, 248, 0.8)';
            let fillBg = 'rgba(15, 23, 42, 0.9)';

            if (node.type === 'vowel') {
              color = '#22d3ee';
              glow = 'rgba(34, 211, 238, 0.9)';
            } else if (node.type === 'consonant') {
              color = '#34d399';
              glow = 'rgba(52, 211, 153, 0.9)';
            } else if (node.type === 'complex') {
              color = '#f472b6';
              glow = 'rgba(244, 114, 182, 1)';
            } else if (node.type === 'silent') {
              color = '#94a3b8';
              glow = 'rgba(148, 163, 184, 0.5)';
            }

            const nodeRadius = (node.size * 0.55) * scale;

            // Gravitational trail line to center
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(screenX, screenY);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * scale})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Glow Aura
            ctx.beginPath();
            ctx.arc(screenX, screenY, nodeRadius * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.globalAlpha = 0.25 * scale;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Planet Node Circle
            ctx.beginPath();
            ctx.arc(screenX, screenY, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = fillBg;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 * scale;
            ctx.shadowColor = color;
            ctx.shadowBlur = 12 * scale;
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Text / Phoneme inside Node in OpenDyslexic font
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(14 * scale)}px "OpenDyslexic", "Atkinson Hyperlegible", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.text, screenX, screenY - 1);

            // Small IPA label below node
            if (node.ipa) {
              ctx.fillStyle = color;
              ctx.font = `${Math.round(9 * scale)}px monospace`;
              ctx.fillText(node.ipa, screenX, screenY + nodeRadius + 9 * scale);
            }
          });
        }
      }

      // 2. RENDER AR CAMERA HUD OVERLAY CANVAS
      if (arCanvasRef.current && activeTab === 'ar-camera') {
        const canvas = arCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const cx = width / 2;
          const cy = height / 2;

          ctx.clearRect(0, 0, width, height);

          // Holographic AR Grid Scan lines
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.lineWidth = 1;
          for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // AR Target Reticle / Speech Resonance Ring
          const reticlePulse = 85 + (currentAudioDb / 100) * 45;
          ctx.beginPath();
          ctx.arc(cx, cy + 20, reticlePulse, 0, Math.PI * 2);
          ctx.strokeStyle = currentAudioDb > 20 ? 'rgba(34, 211, 238, 0.9)' : 'rgba(99, 102, 241, 0.5)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 12]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Corner Holographic HUD brackets
          const margin = 25;
          const bracketLen = 30;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
          ctx.lineWidth = 3;

          // Top Left
          ctx.beginPath();
          ctx.moveTo(margin, margin + bracketLen);
          ctx.lineTo(margin, margin);
          ctx.lineTo(margin + bracketLen, margin);
          ctx.stroke();

          // Top Right
          ctx.beginPath();
          ctx.moveTo(width - margin - bracketLen, margin);
          ctx.lineTo(width - margin, margin);
          ctx.lineTo(width - margin, margin + bracketLen);
          ctx.stroke();

          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(margin, height - margin - bracketLen);
          ctx.lineTo(margin, height - margin);
          ctx.lineTo(margin + bracketLen, height - margin);
          ctx.stroke();

          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(width - margin - bracketLen, height - margin);
          ctx.lineTo(width - margin, height - margin);
          ctx.lineTo(width - margin, height - margin - bracketLen);
          ctx.stroke();

          // HUD Telemetry Text
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`AR PHONETIC HUD • ${activeLang}`, margin + 10, margin + 20);
          ctx.fillText(`AUDIO LEVEL: ${currentAudioDb} dB`, margin + 10, margin + 35);
          ctx.fillText(`NODES: ${phoneticNodes.length}`, margin + 10, margin + 50);

          // FLOATING AR SATELLITES (Phonemes orbiting the user's head)
          const nodes = nodesStateRef.current;
          nodes.forEach((node, idx) => {
            const angle = node.angle + time * 0.4 + (idx * 0.8);
            const radiusX = 170 + (idx % 3) * 45;
            const radiusY = 70 + (idx % 3) * 20;

            const px = cx + Math.cos(angle) * radiusX;
            const py = (cy + 20) + Math.sin(angle) * radiusY;

            let col = '#22d3ee';
            if (node.type === 'consonant') col = '#34d399';
            if (node.type === 'complex') col = '#f472b6';

            // AR Node Box
            ctx.save();
            ctx.translate(px, py);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-22, -18, 44, 36, 10);
            ctx.fill();
            ctx.stroke();

            // OpenDyslexic Letter
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px "OpenDyslexic", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.text, 0, -2);

            // Sub IPA
            if (node.ipa) {
              ctx.fillStyle = col;
              ctx.font = '9px monospace';
              ctx.fillText(node.ipa, 0, 10);
            }

            ctx.restore();
          });
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab, orbitSpeedMultiplier, tilt3D, phoneticNodes, activeLang]);

  // Handle Drag / Rotation of the 3D Orbit
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setTilt3D(prev => ({
      pitch: Math.max(0.15, Math.min(0.95, prev.pitch + dy * 0.003)),
      yaw: prev.yaw + dx * 0.006
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Text-To-Speech Playback
  const handleSpeak = () => {
    if (!transcript) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.lang = activeLang;
    utterance.rate = speechRate;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-12">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMainView('hub')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Retour au Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                Visualisation <span className="text-cyan-400">Phonétique & AR</span>
              </h2>
              <p className="text-slate-400 font-mono text-[11px] uppercase tracking-widest mt-0.5">
                Moteur Orbital 3D • Incrustation AR Caméra • Synesthésie OpenDyslexic
              </p>
            </div>
          </div>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('orbital')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'orbital'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Orbit className="w-4 h-4" />
              <span>Orbite 3D</span>
            </button>

            <button
              onClick={() => setActiveTab('ar-camera')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ar-camera'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg animate-pulse'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Mode AR Caméra</span>
            </button>

            <button
              onClick={() => setActiveTab('synaesthesia')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'synaesthesia'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Synesthésie</span>
            </button>
          </div>

          {/* Language Selector */}
          <select
            value={activeLang}
            onChange={(e) => setActiveLang(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="fr-FR">🇫🇷 Français</option>
            <option value="en-US">🇬🇧 English</option>
            <option value="es-ES">🇪🇸 Español</option>
            <option value="ar-SA">🇲🇦 Arabe (Phonétique)</option>
          </select>

          {/* Microphone Live Button */}
          <button
            onClick={toggleListening}
            className={`px-5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Arrêter Micro</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Microphone Direct 🎙️</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DIRECT TEXT INPUT & LIVE GENERATION STUDIO */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <label htmlFor="phonetic-text-input" className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span>Saisie de Texte Direct pour Orbite 3D & AR</span>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full text-[10px]">Temps Réel</span>
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-bold">
              {phoneticNodes.length} phonèmes en orbite
            </span>
            <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
              {analyzedWords.length} mots • {transcript.length} car.
            </span>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="phonetic-text-input"
            rows={2}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setInterimText("");
            }}
            className="w-full bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 focus:border-cyan-400 rounded-2xl p-4 text-base md:text-lg text-white font-opendyslexic outline-none transition-all resize-y leading-relaxed shadow-inner placeholder:text-slate-600 placeholder:font-sans"
            placeholder="Écrivez un mot, une phrase ou une formule ici pour générer instantanément l'orbite 3D des phonèmes..."
          />
          {transcript && (
            <button
              onClick={() => {
                setTranscript("");
                setInterimText("");
              }}
              className="absolute top-3 right-3 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-colors"
              title="Effacer le texte"
            >
              Effacer
            </button>
          )}
        </div>

        {/* QUICK PRESET BUTTONS & ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase shrink-0 font-bold mr-1">Exemples :</span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(p.text);
                  setInterimText("");
                  playPhonemeTone(440 + idx * 80);
                }}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-mono whitespace-nowrap transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const samples = [
                "L'intelligence spatiale permet aux esprits neurodivergents de voir les connexions invisibles.",
                "Orbite des graphèmes et décomposition phonétique en temps réel pour l'accessibilité scolaire.",
                "Chaque mot possède une géométrie sonore et une fréquence lumineuse singulière.",
                "La vision augmentée et l'OpenDyslexic transforment l'expérience d'apprentissage."
              ];
              const randomSample = samples[Math.floor(Math.random() * samples.length)];
              setTranscript(randomSample);
              setInterimText("");
              playPhonemeTone(580);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/50 hover:to-cyan-600/50 text-cyan-200 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            🎲 Aléatoire
          </button>
        </div>
      </div>

      {/* MAIN VIEW CONTAINER: 3D ORBITAL OR AR CAMERA */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.6)] min-h-[460px] md:min-h-[520px] flex items-center justify-center">
        
        {/* 1. ORBITAL 3D CANVAS */}
        {(activeTab === 'orbital' || activeTab === 'synaesthesia') && (
          <div className="relative w-full h-[460px] md:h-[520px] flex items-center justify-center select-none">
            <canvas
              ref={canvasRef}
              width={900}
              height={520}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-grab active:cursor-grabbing block"
            />

            {/* Floating 3D Controls Over Canvas */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-xs font-mono text-slate-300 space-y-2 pointer-events-auto shadow-xl">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
                <span className="font-bold text-white uppercase text-[10px]">Gravité Orbitale</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Glissez la souris pour faire pivoter l'orbite en 3D
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <span className="text-[10px]">Vitesse :</span>
                <button
                  onClick={() => setOrbitSpeedMultiplier(0.5)}
                  className={`px-2 py-0.5 rounded text-[10px] ${orbitSpeedMultiplier === 0.5 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
                >
                  0.5x
                </button>
                <button
                  onClick={() => setOrbitSpeedMultiplier(1)}
                  className={`px-2 py-0.5 rounded text-[10px] ${orbitSpeedMultiplier === 1 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => setOrbitSpeedMultiplier(2)}
                  className={`px-2 py-0.5 rounded text-[10px] ${orbitSpeedMultiplier === 2 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
                >
                  2x
                </button>
              </div>
            </div>

            {/* Orbital Rings Legend */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-center gap-3 bg-slate-950/85 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl text-[11px] font-mono shadow-xl pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                <span className="text-cyan-300 font-bold">R1 • Voyelles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span className="text-emerald-300 font-bold">R2 • Consonnes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(244,114,182,0.8)]" />
                <span className="text-fuchsia-300 font-bold">R3 • Digraphes Complexes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-slate-400 font-bold">R4 • Lettres Muettes</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. AR CAMERA HUD MODE */}
        {activeTab === 'ar-camera' && (
          <div className="relative w-full h-[460px] md:h-[520px] bg-slate-950 flex items-center justify-center overflow-hidden">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 filter brightness-90 contrast-110"
            />

            {/* AR Overlay Canvas */}
            <canvas
              ref={arCanvasRef}
              width={900}
              height={520}
              className="absolute inset-0 w-full h-full pointer-events-none block z-10"
            />

            {/* Camera Error / Fallback Banner */}
            {cameraError && (
              <div className="absolute top-4 left-4 right-4 bg-amber-950/90 border border-amber-500/50 p-3 rounded-2xl text-amber-200 text-xs font-mono z-20 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Bottom AR Control Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl text-xs font-mono z-20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-white font-bold uppercase tracking-wider">Vision AR Active</span>
              </div>
              <div className="text-cyan-300 font-mono">
                {phoneticNodes.length} phonèmes en orbite spatiale
              </div>
            </div>
          </div>
        )}

      </div>

      {/* OPENDYSLEXIC SYNAESTHESIA LIVE BREAKDOWN */}
      <div className="bg-slate-950 border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-tight">
              Transcription Synesthésique <span className="font-opendyslexic text-cyan-400">OpenDyslexic</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBionicSaccade(!bionicSaccade)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                bionicSaccade 
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Saccades Bioniques {bionicSaccade ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Rendered Words */}
        <div className="font-opendyslexic text-2xl md:text-4xl leading-[2.6] md:leading-[2.8] tracking-wider text-slate-100 flex flex-wrap items-center gap-y-6 gap-x-4">
          {analyzedWords.length > 0 ? (
            analyzedWords.map((analyzed, wordIdx) => (
              <span 
                key={wordIdx}
                className="inline-flex items-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-4 py-2 rounded-2xl shadow-lg transition-all duration-200 group hover:scale-105"
                style={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                }}
              >
                {analyzed.syllables.map((syllable, sylIdx) => (
                  <span key={sylIdx} className="inline-flex items-center">
                    {syllable.tokens.map((token, tokIdx) => {
                      let colorClass = 'text-slate-200';
                      if (token.type === 'vowel') colorClass = 'text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]';
                      if (token.type === 'consonant') colorClass = 'text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]';
                      if (token.type === 'complex') colorClass = 'text-fuchsia-300 font-extrabold drop-shadow-[0_0_12px_rgba(217,70,239,0.7)]';
                      if (token.type === 'silent') colorClass = 'text-slate-500 opacity-60';

                      const isBionicAnchor = bionicSaccade && token.isAnchor;

                      return (
                        <button
                          key={tokIdx}
                          onClick={() => playPhonemeTone(token.freq)}
                          className={`${colorClass} ${isBionicAnchor ? 'font-black underline decoration-cyan-400/60 decoration-2 underline-offset-4' : 'font-normal'} hover:scale-125 transition-transform cursor-pointer`}
                          title={`Phonème: ${token.text} (IPA: ${token.ipa}) - Cliquer pour écouter`}
                        >
                          {token.text}
                        </button>
                      );
                    })}
                    {sylIdx < analyzed.syllables.length - 1 && (
                      <span className="text-cyan-500/40 mx-1 text-sm font-sans font-bold select-none">•</span>
                    )}
                  </span>
                ))}
              </span>
            ))
          ) : (
            <span className="text-slate-600 font-sans italic text-base">
              Parlez au micro pour générer les phonèmes en temps réel...
            </span>
          )}
        </div>

        {/* ACTION TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          
          {/* TTS Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSpeak}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white shadow-lg animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingAudio ? 'Arrêter Audio' : 'Écouter (TTS)'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-mono text-slate-400">Vitesse :</span>
              <button
                onClick={() => setSpeechRate(0.7)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${speechRate === 0.7 ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
              >
                0.7x
              </button>
              <button
                onClick={() => setSpeechRate(0.9)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${speechRate === 0.9 ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
              >
                0.9x
              </button>
              <button
                onClick={() => setSpeechRate(1.0)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${speechRate === 1.0 ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
              >
                1.0x
              </button>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>

            <button
              onClick={() => downloadPdfDocument("Visualisation Phonétique & Orbite", transcript, "MOUNT AI • PHONETICS")}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            {onAddToWorkspace && (
              <button
                onClick={() => onAddToWorkspace("Visualisation Phonétique & Orbite 3D", transcript)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-400/40 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>+ Workspace</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* PHONETIC HARMONIC FREQUENCY & SPECTRAL METRICS */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2.5">
          <span className="uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Harmoniques & Anneaux Orbitaux Actifs :</span>
          </span>
          <span className="text-cyan-300">{phoneticNodes.length} phonèmes cartographiés</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">R1 • Voyelles</span>
            <span className="text-xl font-mono font-black text-cyan-300">
              {phoneticNodes.filter(n => n.type === 'vowel').length}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block">Noyau Résonant</span>
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">R2 • Consonnes</span>
            <span className="text-xl font-mono font-black text-emerald-300">
              {phoneticNodes.filter(n => n.type === 'consonant').length}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block">Attaques Saccadiques</span>
          </div>

          <div className="bg-slate-950/80 border border-fuchsia-500/20 rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-mono text-fuchsia-400 font-bold uppercase block">R3 • Digraphes</span>
            <span className="text-xl font-mono font-black text-fuchsia-300">
              {phoneticNodes.filter(n => n.type === 'complex').length}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block">Sélecteurs Complexes</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-700/40 rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">R4 • Muettes</span>
            <span className="text-xl font-mono font-black text-slate-300">
              {phoneticNodes.filter(n => n.type === 'silent' || n.type === 'punct').length}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block">Périphérie Stabilisée</span>
          </div>
        </div>
      </div>

    </div>
  );
}
