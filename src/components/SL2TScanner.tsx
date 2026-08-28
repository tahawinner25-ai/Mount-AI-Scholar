import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Video,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Download,
  Plus,
  RefreshCw,
  Hand,
  Settings,
  Eye,
  Info,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import {
  GestureRecognizerTask,
  ClassificationItem,
  SIGN_LANGUAGE_DICTIONARY,
  getOrInitGestureRecognizer,
} from '../services/gestureRecognizer';
import { downloadPdfDocument } from '../utils/pdfExport';

interface SL2TScannerProps {
  onSignDetected?: (sign: string, meaning: string) => void;
  onAddToWorkspace?: (title: string, text: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export default function SL2TScanner({
  onSignDetected,
  onAddToWorkspace,
  isModal = false,
  onClose,
}: SL2TScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const testImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const taskRef = useRef<GestureRecognizerTask | null>(null);

  // States
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'image' | 'guide'>('video');

  // MediaPipe Confidence & Detection Sliders
  const [numHands, setNumHands] = useState(2);
  const [minDetectionConfidence, setMinDetectionConfidence] = useState(0.5);
  const [minPresenceConfidence, setMinPresenceConfidence] = useState(0.5);
  const [minTrackingConfidence, setMinTrackingConfidence] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // Results & Translation Stream
  const [currentItems, setCurrentItems] = useState<ClassificationItem[]>([]);
  const [translatedSentence, setTranslatedSentence] = useState<string[]>([]);
  const [lastDetectedSign, setLastDetectedSign] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  // Image Upload Test
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [imageResults, setImageResults] = useState<ClassificationItem[]>([]);

  // Speech & Feedback
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastAddTimestamp = useRef<number>(0);

  // Initialisation du modèle MediaPipe Tasks Vision
  useEffect(() => {
    let isMounted = true;

    async function initRecognizer() {
      setIsLoadingModel(true);
      setModelError(null);
      try {
        const task = await getOrInitGestureRecognizer({
          numHands,
          minHandDetectionConfidence: minDetectionConfidence,
          minHandPresenceConfidence: minPresenceConfidence,
          minTrackingConfidence: minTrackingConfidence,
          runningMode: activeTab === 'video' ? 'VIDEO' : 'IMAGE',
          onError: (err) => {
            if (isMounted) setModelError(err?.message || "Erreur de chargement du modèle.");
          },
        });

        if (isMounted) {
          taskRef.current = task;
          setIsLoadingModel(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsLoadingModel(false);
          setModelError(
            err?.message ||
              "Impossible de charger le modèle MediaPipe Gesture Recognizer. Vérifiez votre connexion internet."
          );
        }
      }
    }

    initRecognizer();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // Synchronisation des sliders avec le modèle
  const handleSliderChange = (
    key: 'numHands' | 'minDetectionConfidence' | 'minPresenceConfidence' | 'minTrackingConfidence',
    val: number
  ) => {
    if (key === 'numHands') setNumHands(val);
    if (key === 'minDetectionConfidence') setMinDetectionConfidence(val);
    if (key === 'minPresenceConfidence') setMinPresenceConfidence(val);
    if (key === 'minTrackingConfidence') setMinTrackingConfidence(val);

    if (taskRef.current) {
      taskRef.current.setOptions({
        numHands: key === 'numHands' ? val : numHands,
        minHandDetectionConfidence: key === 'minDetectionConfidence' ? val : minDetectionConfidence,
        minHandPresenceConfidence: key === 'minPresenceConfidence' ? val : minPresenceConfidence,
        minTrackingConfidence: key === 'minTrackingConfidence' ? val : minTrackingConfidence,
      });
    }
  };

  // Démarrage de la webcam avec gestion fine des autorisations et erreurs matérielles
  const startCamera = async () => {
    if (!taskRef.current) return;
    setModelError(null);

    try {
      await taskRef.current.setRunningMode('VIDEO');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          videoRef.current?.play();
          setIsRunning(true);
          startDetectionLoop();
        };
      }
    } catch (err: any) {
      console.warn('Accès caméra non autorisé ou indisponible:', err?.message || err);
      let friendlyMsg = "Accès à la caméra restreint par le système ou le navigateur.";
      const errMsg = (err?.message || '').toLowerCase();
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        errMsg.includes('permission denied') ||
        errMsg.includes('permission dismissed')
      ) {
        friendlyMsg = "L'accès à la caméra a été refusé par le système ou le navigateur. Vérifiez les autorisations de votre caméra ou testez avec l'onglet 'Test Photo'.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMsg = "Aucune caméra détectée sur cet appareil. Branchez une webcam ou utilisez le mode 'Test Photo'.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyMsg = "La caméra est occupée par une autre application (Meet, Teams, Zoom). Libérez la caméra et réessayez.";
      }
      setModelError(friendlyMsg);
      setIsRunning(false);
    }
  };

  // Arrêt de la webcam
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setIsRunning(false);
    setCurrentItems([]);
  };

  // Boucle de détection vidéo en direct à 60 FPS
  const startDetectionLoop = () => {
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const render = () => {
      if (!videoRef.current || !canvasRef.current || !taskRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const now = performance.now();
        const detectionResult = taskRef.current.detectForVideo(video, now, canvas);

        frameCount++;
        if (now - lastFpsUpdate >= 1000) {
          setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
          frameCount = 0;
          lastFpsUpdate = now;
        }

        if (detectionResult && detectionResult.items.length > 0) {
          setCurrentItems(detectionResult.items);
          const topItem = detectionResult.items[0];
          setConfidenceScore(Math.round(topItem.score * 100));

          if (topItem.categoryName && topItem.categoryName !== 'None') {
            setLastDetectedSign(topItem.categoryName);

            // Anti-rebond (debounce) : ajouter le signe au flux de traduction toutes les 1.2s max
            const nowTime = Date.now();
            if (nowTime - lastAddTimestamp.current > 1200) {
              lastAddTimestamp.current = nowTime;
              const signMeaning = topItem.frenchMeaning || topItem.categoryName;
              setTranslatedSentence((prev) => [...prev, signMeaning]);
              if (onSignDetected) {
                onSignDetected(topItem.categoryName, signMeaning);
              }
            }
          }
        } else {
          setCurrentItems([]);
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);
  };

  // Traitement d'une image statique de test
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskRef.current) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      setUploadedImageSrc(src);

      const img = new Image();
      img.src = src;
      img.onload = async () => {
        if (!taskRef.current) return;
        await taskRef.current.setRunningMode('IMAGE');
        if (imageCanvasRef.current) {
          const res = taskRef.current.detectImage(img, imageCanvasRef.current);
          if (res) {
            setImageResults(res.items);
            if (res.items.length > 0) {
              const top = res.items[0];
              const meaning = top.frenchMeaning || top.categoryName || '';
              setTranslatedSentence((prev) => [...prev, meaning]);
            }
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Synthèse vocale de la phrase traduite
  const speakTranslation = () => {
    const text = translatedSentence.join(' ');
    if (!text) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentSentenceText = translatedSentence.join(' ');

  return (
    <div
      id="sl2t-scanner-root"
      className={`bg-slate-950/90 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col ${
        isModal ? 'max-w-4xl w-full mx-auto' : 'w-full'
      }`}
    >
      {/* Header Bar */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-b border-emerald-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
            <Hand className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                SL2T • Sign Language to Text
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono rounded-full font-bold">
                MediaPipe Vision Task
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Reconnaissance des gestes et traduction de la langue des signes en temps réel (0-Leak Edge AI)
            </p>
          </div>
        </div>

        {/* Tab switcher & Settings toggle */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-1">
            <button
              id="sl2t-tab-video"
              onClick={() => {
                setActiveTab('video');
                if (!isRunning) startCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Caméra Live
            </button>
            <button
              id="sl2t-tab-image"
              onClick={() => {
                setActiveTab('image');
                stopCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Test Photo
            </button>
            <button
              id="sl2t-tab-guide"
              onClick={() => {
                setActiveTab('guide');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" /> Dictionnaire
            </button>
          </div>

          <button
            id="sl2t-toggle-settings"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              showSettings
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Paramètres de confiance MediaPipe"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Model Loader & Error Notification */}
      {isLoadingModel && (
        <div className="p-4 bg-indigo-950/60 border-b border-indigo-500/30 flex items-center justify-center gap-3 text-xs text-indigo-200 animate-pulse font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          Chargement du graphe neuronal MediaPipe Gesture Recognizer (WASM + GPU)...
        </div>
      )}

      {modelError && (
        <div className="p-4 bg-rose-950/60 border-b border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300 font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{modelError}</span>
          </div>
          <button
            onClick={() => {
              setModelError(null);
              startCamera();
            }}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-rose-200 cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* MediaPipe Parameters Drawer (Sliders) */}
      {showSettings && (
        <div className="p-5 bg-slate-900/95 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
          {/* Num Hands */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Nombre de Mains</span>
              <span id="num-hands-value" className="text-emerald-400 font-bold">{numHands}</span>
            </div>
            <input
              id="num-hands"
              type="range"
              min={1}
              max={4}
              step={1}
              value={numHands}
              onChange={(e) => handleSliderChange('numHands', parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Min Detection Confidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Seuil Détection</span>
              <span id="min-hand-detection-confidence-value" className="text-emerald-400 font-bold">
                {minDetectionConfidence}
              </span>
            </div>
            <input
              id="min-hand-detection-confidence"
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={minDetectionConfidence}
              onChange={(e) =>
                handleSliderChange('minDetectionConfidence', parseFloat(e.target.value))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Min Presence Confidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Seuil Présence</span>
              <span id="min-hand-presence-confidence-value" className="text-emerald-400 font-bold">
                {minPresenceConfidence}
              </span>
            </div>
            <input
              id="min-hand-presence-confidence"
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={minPresenceConfidence}
              onChange={(e) =>
                handleSliderChange('minPresenceConfidence', parseFloat(e.target.value))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Min Tracking Confidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Seuil Tracking</span>
              <span id="min-tracking-confidence-value" className="text-emerald-400 font-bold">
                {minTrackingConfidence}
              </span>
            </div>
            <input
              id="min-tracking-confidence"
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={minTrackingConfidence}
              onChange={(e) =>
                handleSliderChange('minTrackingConfidence', parseFloat(e.target.value))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Video / Image Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {activeTab === 'video' && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center shadow-inner group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
              />

              {!isRunning && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-emerald-400">
                    <Camera className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Flux Caméra En Attente
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Activez votre webcam pour démarrer la reconnaissance gestuelle MediaPipe et la détection des points de repère de la main.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      id="sl2t-start-camera-btn"
                      onClick={startCamera}
                      disabled={isLoadingModel}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <Video className="w-4 h-4" /> Démarrer la Caméra SL2T
                    </button>
                    {modelError && (
                      <button
                        onClick={() => {
                          setActiveTab('image');
                        }}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-4 h-4 text-emerald-400" /> Mode Test Photo
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Live Overlay HUD Info */}
              {isRunning && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>LIVE • {fps} FPS</span>
                </div>
              )}

              {isRunning && currentItems.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      {SIGN_LANGUAGE_DICTIONARY[currentItems[0].categoryName || '']?.icon || '🖐️'}
                    </span>
                    <div>
                      <div className="text-xs font-mono font-black text-emerald-300">
                        {currentItems[0].frenchMeaning || currentItems[0].categoryName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {currentItems[0].handedness} • Confiance : {Math.round(currentItems[0].score * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-150"
                      style={{ width: `${Math.round(currentItems[0].score * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[300px] flex items-center justify-center">
                {uploadedImageSrc ? (
                  <>
                    <img
                      ref={testImageRef}
                      src={uploadedImageSrc}
                      alt="Test Gesture"
                      className="max-h-[380px] w-auto object-contain"
                    />
                    <canvas
                      ref={imageCanvasRef}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  </>
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-mono">
                      Importez une photo d'une main effectuant un signe pour tester la détection statique.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center">
                <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Sélectionner une photo de signe</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4 max-h-[380px] overflow-y-auto">
              <h4 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" /> Dictionnaire & Gestes Reconnus par le Modèle
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(SIGN_LANGUAGE_DICTIONARY).map(([key, data]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3"
                  >
                    <span className="text-2xl">{data.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{data.fr}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{key}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{data.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Control Action Buttons */}
          {activeTab === 'video' && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                id="sl2t-toggle-camera-action"
                onClick={isRunning ? stopCamera : startCamera}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                }`}
              >
                {isRunning ? (
                  <>
                    <CameraOff className="w-4 h-4" /> Arrêter la Caméra
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Activer la Détection Caméra
                  </>
                )}
              </button>

              <span className="text-[10px] font-mono text-slate-500">
                MediaPipe GestureRecognizerTask • Inférence Locale
              </span>
            </div>
          )}
        </div>

        {/* Right: Real-time Translation Stream & Classification Results (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Classification Results Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-mono font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Résultats de Classification
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                {currentItems.length} main(s)
              </span>
            </div>

            <div id="classification-results" className="space-y-2 min-h-[90px]">
              {currentItems.length > 0 ? (
                currentItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950 border border-emerald-500/30 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {SIGN_LANGUAGE_DICTIONARY[item.categoryName || '']?.icon || '🖐️'}
                      </span>
                      <div>
                        <div className="text-xs font-mono font-bold text-white">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-emerald-300 font-mono">
                          {item.frenchMeaning}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {Math.round(item.score * 100)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 font-mono italic">
                  Présentez vos mains devant la caméra pour détecter des signes.
                </div>
              )}
            </div>
          </div>

          {/* Assembled Translated Sentence (SL2T Output) */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2 mb-3">
                <h4 className="text-xs font-mono font-black text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                  <Hand className="w-3.5 h-3.5 text-indigo-400" />
                  Phrase Traduite (SL2T Stream)
                </h4>
                {translatedSentence.length > 0 && (
                  <button
                    onClick={() => setTranslatedSentence([])}
                    className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Effacer
                  </button>
                )}
              </div>

              <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3.5 min-h-[90px] flex flex-wrap items-center gap-1.5">
                {translatedSentence.length > 0 ? (
                  translatedSentence.map((word, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 rounded-lg text-xs font-mono font-bold animate-in fade-in"
                    >
                      {word}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs font-mono italic">
                    Les mots détectés en langue des signes s'assembleront ici automatiquement...
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar (Speak, Export, Workspace) */}
            <div className="flex items-center justify-between pt-3 gap-2 flex-wrap">
              <button
                id="sl2t-speak-btn"
                onClick={speakTranslation}
                disabled={!currentSentenceText}
                className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 disabled:opacity-40 text-indigo-200 font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Lire la phrase traduite à haute voix"
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-indigo-400' : ''}`} />
                <span>{isSpeaking ? 'Lecture...' : 'Synthèse Vocale'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadPdfDocument(
                      'Transcription Langue des Signes (SL2T)',
                      currentSentenceText || 'Aucun signe détecté lors de cette session.',
                      'SL2T MediaPipe'
                    );
                  }}
                  disabled={!currentSentenceText}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-300 font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Télécharger la transcription en PDF"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF</span>
                </button>

                {onAddToWorkspace && (
                  <button
                    onClick={() => {
                      onAddToWorkspace(
                        'Transcription SL2T - Langue des Signes',
                        currentSentenceText || 'Session de reconnaissance SL2T.'
                      );
                    }}
                    disabled={!currentSentenceText}
                    className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-40 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Workspace</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
