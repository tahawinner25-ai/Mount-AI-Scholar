import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Volume2,
  VolumeX,
  Hand,
  CheckCircle2,
  Layers,
  Eye,
  Info,
  ChevronRight,
  Download,
  Bookmark,
  Share2,
  HelpCircle
} from 'lucide-react';
import { downloadPdfDocument } from '../utils/pdfExport';

export interface SignItem {
  id: string;
  name: string;
  category: 'alphabet' | 'numbers' | 'common' | 'classroom';
  symbol: string;
  phonetic?: string;
  description: string;
  fingerPosition: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  tips: string;
  svgIconType?: 'fist' | 'open' | 'pointing' | 'peace' | 'ok' | 'thumb' | 'three' | 'four' | 'pinky';
}

export const SIGN_LIBRARY_DATA: SignItem[] = [
  // Alphabet
  {
    id: 'alpha-a',
    name: 'Lettre A',
    category: 'alphabet',
    symbol: '🅰️',
    phonetic: '/a/',
    description: 'Poing fermé avec le pouce plaqué verticalement contre l\'index.',
    fingerPosition: 'Tous les doigts repliés dans la paume, pouce dressé sur le côté extérieur.',
    difficulty: 'Débutant',
    tips: 'Ne placez pas le pouce par-dessus les doigts (sinon c\'est le S).',
    svgIconType: 'fist',
  },
  {
    id: 'alpha-b',
    name: 'Lettre B',
    category: 'alphabet',
    symbol: '🅱️',
    phonetic: '/b/',
    description: 'Quatre doigts tendus et joints vers le haut, le pouce plié sur la paume.',
    fingerPosition: 'Index, majeur, annulaire et auriculaire serrés vers le haut. Pouce replié.',
    difficulty: 'Débutant',
    tips: 'Gardez les doigts bien droits et collés les uns aux autres.',
    svgIconType: 'open',
  },
  {
    id: 'alpha-c',
    name: 'Lettre C',
    category: 'alphabet',
    symbol: '🅲',
    phonetic: '/k/ ou /s/',
    description: 'Main en forme d\'arc ou demi-cercle imitant la lettre C.',
    fingerPosition: 'Doigts incurvés vers le bas, pouce incurvé vers le haut formant un C.',
    difficulty: 'Débutant',
    tips: 'Visualisez la forme de la lettre C vue de profil.',
    svgIconType: 'open',
  },
  {
    id: 'alpha-d',
    name: 'Lettre D',
    category: 'alphabet',
    symbol: '🅳',
    phonetic: '/d/',
    description: 'Index pointé vers le haut, les autres doigts touchent le pouce pour former un cercle.',
    fingerPosition: 'Index droit vertical. Majeur, annulaire et auriculaire repliés touchant le pouce.',
    difficulty: 'Débutant',
    tips: 'Le cercle à la base forme le ventre du D et l\'index la barre verticale.',
    svgIconType: 'pointing',
  },
  {
    id: 'alpha-e',
    name: 'Lettre E',
    category: 'alphabet',
    symbol: '🅴',
    phonetic: '/ə/ ou /e/',
    description: 'Tous les doigts recourbés vers l\'intérieur, reposant sur le pouce replié.',
    fingerPosition: 'Les extrémités des 4 doigts touchent le bord supérieur du pouce.',
    difficulty: 'Débutant',
    tips: 'Veillez à ce que les doigts soient bien fléchis vers le pouce.',
    svgIconType: 'fist',
  },
  {
    id: 'alpha-f',
    name: 'Lettre F',
    category: 'alphabet',
    symbol: '🅵',
    phonetic: '/f/',
    description: 'Index et pouce forment un cercle, les trois autres doigts sont dressés et écartés.',
    fingerPosition: 'Pouce et index joints (signe OK), majeur, annulaire et auriculaire ouverts.',
    difficulty: 'Débutant',
    tips: 'Similaire au geste universel "OK" mais utilisé comme lettre F.',
    svgIconType: 'ok',
  },
  {
    id: 'alpha-i',
    name: 'Lettre I',
    category: 'alphabet',
    symbol: '🅸',
    phonetic: '/i/',
    description: 'Seul l\'auriculaire (petit doigt) est dressé verticalement, les autres repliés.',
    fingerPosition: 'Poing fermé avec le petit doigt tendu vers le haut, pouce retenant les autres.',
    difficulty: 'Débutant',
    tips: 'Le petit doigt fin symbolise la finesse du "i".',
    svgIconType: 'pinky',
  },
  {
    id: 'alpha-l',
    name: 'Lettre L',
    category: 'alphabet',
    symbol: '🅻',
    phonetic: '/l/',
    description: 'Index et pouce forment un angle droit parfait à 90°, imitant la lettre L.',
    fingerPosition: 'Pouce tendu horizontalement, index tendu verticalement, autres doigts repliés.',
    difficulty: 'Débutant',
    tips: 'Très facile à mémoriser car la main dessine directement la lettre L.',
    svgIconType: 'pointing',
  },
  {
    id: 'alpha-o',
    name: 'Lettre O',
    category: 'alphabet',
    symbol: '🅾️',
    phonetic: '/o/',
    description: 'Tous les doigts et le pouce se rejoignent pour former un cercle complet "O".',
    fingerPosition: 'Courbure harmonieuse de tous les doigts pour dessiner un ovale/cercle fermé.',
    difficulty: 'Débutant',
    tips: 'Assurez-vous qu\'il y a une ouverture visible au centre de la main.',
    svgIconType: 'fist',
  },
  {
    id: 'alpha-v',
    name: 'Lettre V',
    category: 'alphabet',
    symbol: '🆅',
    phonetic: '/v/',
    description: 'Index et majeur tendus et écartés en V (signe victoire).',
    fingerPosition: 'Index et majeur dressés en diagonale, pouce maintenant les deux autres doigts.',
    difficulty: 'Débutant',
    tips: 'Identique au signe de la paix / victoire.',
    svgIconType: 'peace',
  },

  // Chiffres
  {
    id: 'num-1',
    name: 'Chiffre 1',
    category: 'numbers',
    symbol: '1️⃣',
    phonetic: 'Un',
    description: 'Index levé vers le haut, paume vers l\'avant.',
    fingerPosition: 'Index tendu, pouce retenant majeur, annulaire et auriculaire.',
    difficulty: 'Débutant',
    tips: 'En LSF/ASL internationale, l\'index représente le 1.',
    svgIconType: 'pointing',
  },
  {
    id: 'num-2',
    name: 'Chiffre 2',
    category: 'numbers',
    symbol: '2️⃣',
    phonetic: 'Deux',
    description: 'Index et majeur levés vers le haut.',
    fingerPosition: 'Deux doigts verticaux joints ou légèrement écartés.',
    difficulty: 'Débutant',
    tips: 'Paume tournée vers l\'interlocuteur.',
    svgIconType: 'peace',
  },
  {
    id: 'num-3',
    name: 'Chiffre 3',
    category: 'numbers',
    symbol: '3️⃣',
    phonetic: 'Trois',
    description: 'Pouce, index et majeur déployés.',
    fingerPosition: 'Pouce sorti sur le côté, index et majeur levés, annulaire et auriculaire repliés.',
    difficulty: 'Intermédiaire',
    tips: 'Attention : en ASL, le 3 utilise le pouce + index + majeur.',
    svgIconType: 'three',
  },
  {
    id: 'num-4',
    name: 'Chiffre 4',
    category: 'numbers',
    symbol: '4️⃣',
    phonetic: 'Quatre',
    description: 'Quatre doigts levés et écartés, pouce replié sur la paume.',
    fingerPosition: 'Index, majeur, annulaire, auriculaire levés.',
    difficulty: 'Débutant',
    tips: 'Le pouce reste bien plaqué au creux de la main.',
    svgIconType: 'four',
  },
  {
    id: 'num-5',
    name: 'Chiffre 5',
    category: 'numbers',
    symbol: '5️⃣',
    phonetic: 'Cinq',
    description: 'Main entièrement ouverte avec les 5 doigts déployés.',
    fingerPosition: 'Tous les doigts et le pouce écartés au maximum.',
    difficulty: 'Débutant',
    tips: 'Geste très clair et universellement reconnu.',
    svgIconType: 'open',
  },

  // Gestes Fréquents & MediaPipe
  {
    id: 'gest-thumb-up',
    name: 'Oui / D\'accord / Bravo',
    category: 'common',
    symbol: '👍',
    phonetic: 'Oui / Valider',
    description: 'Pouce dressé vers le haut, main fermée.',
    fingerPosition: 'Poing fermé, pouce fermement orienté vers le ciel.',
    difficulty: 'Débutant',
    tips: 'Reconnu nativement par le modèle MediaPipe Gesture Recognizer.',
    svgIconType: 'thumb',
  },
  {
    id: 'gest-thumb-down',
    name: 'Non / Pas d\'accord',
    category: 'common',
    symbol: '👎',
    phonetic: 'Non / Désaccord',
    description: 'Pouce orienté vers le bas, main fermée.',
    fingerPosition: 'Poing fermé, pouce pointé fermement vers le sol.',
    difficulty: 'Débutant',
    tips: 'Geste universel de rejet ou de négation.',
    svgIconType: 'thumb',
  },
  {
    id: 'gest-hello',
    name: 'Bonjour / Salutation',
    category: 'common',
    symbol: '✋',
    phonetic: 'Bonjour',
    description: 'Paume ouverte face à l\'interlocuteur avec un léger balancement.',
    fingerPosition: 'Main ouverte, doigts joints ou décontractés.',
    difficulty: 'Débutant',
    tips: 'Un geste d\'accueil chaleureux et instinctif.',
    svgIconType: 'open',
  },
  {
    id: 'gest-love',
    name: 'Je t\'aime (I Love You)',
    category: 'common',
    symbol: '🤟',
    phonetic: 'Amour / Solidarité',
    description: 'Combinaison des lettres I, L et Y : Pouce + Index + Auriculaire tendus.',
    fingerPosition: 'Majeur et annulaire repliés dans la paume, les 3 autres doigts déployés.',
    difficulty: 'Débutant',
    tips: 'Le signe le plus célèbre de la communauté sourde mondiale.',
    svgIconType: 'pinky',
  },
  {
    id: 'gest-peace',
    name: 'Paix & Amitié',
    category: 'common',
    symbol: '✌️',
    phonetic: 'Paix / Deux',
    description: 'Index et majeur en V avec la paume vers l\'avant.',
    fingerPosition: 'V formé par index et majeur, paume visible.',
    difficulty: 'Débutant',
    tips: 'Idéal pour exprimer le calme et l\'harmonie.',
    svgIconType: 'peace',
  },

  // Salle de Classe & École (Classroom & Learning)
  {
    id: 'school-question',
    name: 'J\'ai une question',
    category: 'classroom',
    symbol: '🙋',
    phonetic: 'Question',
    description: 'Main levée avec l\'index dressé ou main ouverte à hauteur d\'épaule.',
    fingerPosition: 'Bras levé, index droit ou paume ouverte stable.',
    difficulty: 'Débutant',
    tips: 'Permet à l\'élève d\'interpeller discrètement le professeur.',
    svgIconType: 'pointing',
  },
  {
    id: 'school-understand',
    name: 'J\'ai compris',
    category: 'classroom',
    symbol: '💡',
    phonetic: 'Compris',
    description: 'Index touchant la tempe puis s\'ouvrant vers l\'avant en signe de clarté.',
    fingerPosition: 'Index part du front et avance avec un hochement de tête affirmatif.',
    difficulty: 'Intermédiaire',
    tips: 'Signale à l\'enseignant que la notion est acquise sans couper la parole.',
    svgIconType: 'pointing',
  },
  {
    id: 'school-repeat',
    name: 'Pouvez-vous répéter ?',
    category: 'classroom',
    symbol: '🔄',
    phonetic: 'Répéter',
    description: 'Mouvement circulaire doux de la main ouverte paume vers le haut.',
    fingerPosition: 'Main semi-ouverte dessinant une petite boucle dans l\'espace.',
    difficulty: 'Intermédiaire',
    tips: 'Très utile pour les élèves dyslexiques ou malentendants lors des consignes.',
    svgIconType: 'open',
  },
  {
    id: 'school-help',
    name: 'Besoin d\'aide',
    category: 'classroom',
    symbol: '🆘',
    phonetic: 'Aide-moi',
    description: 'Poing fermé pouce levé posé sur la paume ouverte de l\'autre main.',
    fingerPosition: 'Main dominante en pouce levé portée par la main inférieure.',
    difficulty: 'Intermédiaire',
    tips: 'Geste d\'entraide et de soutien mutuel.',
    svgIconType: 'thumb',
  },
];

interface SignLibraryProps {
  onSelectSignForPractice?: (sign: SignItem) => void;
  onAddToWorkspace?: (title: string, text: string) => void;
}

export default function SignLibrary({
  onSelectSignForPractice,
  onAddToWorkspace,
}: SignLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'alphabet' | 'numbers' | 'common' | 'classroom'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignModal, setSelectedSignModal] = useState<SignItem | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Filter logic
  const filteredSigns = SIGN_LIBRARY_DATA.filter((sign) => {
    const matchesCategory =
      selectedCategory === 'all' || sign.category === selectedCategory;
    const matchesSearch =
      sign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.fingerPosition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sign.phonetic && sign.phonetic.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Speech synthesis for learning phonetics / word pronunciation
  const handleSpeak = (sign: SignItem) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${sign.name}. ${sign.description}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.onstart = () => setSpeakingId(sign.id);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExportLibraryPdf = () => {
    const text = filteredSigns
      .map(
        (s) =>
          `• ${s.name} (${s.category.toUpperCase()}) : ${s.description}\n  Doigts : ${s.fingerPosition}\n  Conseil : ${s.tips}\n`
      )
      .join('\n');
    downloadPdfDocument(
      'Guide Pratique SignLibrary (LSF / ASL)',
      `GUIDE DE LA LANGUE DES SIGNES - MENTORA AI\nTotal signes répertoriés : ${filteredSigns.length}\n\n${text}`,
      'SignLibrary MediaPipe'
    );
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                SignLibrary • Dictionnaire & Bibliothèque Visuelle
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono rounded-full font-bold">
                {filteredSigns.length} signes
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Guide illustré dactylologique et gestuel pour préparer la détection en direct
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un signe, lettre, mot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl text-xs text-slate-200 font-mono focus:outline-none w-56 sm:w-64 transition-all"
            />
          </div>

          <button
            onClick={handleExportLibraryPdf}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exporter les fiches signes en PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF</span>
          </button>

          {onAddToWorkspace && (
            <button
              onClick={() => {
                const summary = filteredSigns.map((s) => `${s.name}: ${s.description}`).join('\n');
                onAddToWorkspace('SignLibrary - Fiches de Révision', summary);
              }}
              className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Tous les Signes', icon: Layers },
          { id: 'alphabet', label: 'Alphabet Dactylologique', icon: Hand },
          { id: 'numbers', label: 'Chiffres & Nombres', icon: Sparkles },
          { id: 'common', label: 'Gestes Fréquents & MediaPipe', icon: CheckCircle2 },
          { id: 'classroom', label: 'École & Salle de Classe', icon: BookOpen },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Sign Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSigns.map((sign) => {
          const isCurrentlySpeaking = speakingId === sign.id;
          return (
            <div
              key={sign.id}
              className="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between gap-4 group hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden"
            >
              {/* Top Row: Symbol & Category Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                    <span>{sign.symbol}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 rounded-full">
                      {sign.category.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {sign.difficulty}
                    </span>
                  </div>
                </div>

                {/* Sign Name & Phonetics */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {sign.name}
                    </h4>
                    {sign.phonetic && (
                      <span className="text-[11px] font-mono text-emerald-400/80">
                        {sign.phonetic}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {sign.description}
                  </p>
                </div>
              </div>

              {/* Finger Position Visual Tip */}
              <div className="p-2.5 bg-slate-900/90 border border-slate-800/60 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 font-bold">
                  <Hand className="w-3 h-3 text-emerald-400" /> Position des doigts :
                </div>
                <div className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                  {sign.fingerPosition}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 gap-2">
                <button
                  onClick={() => handleSpeak(sign)}
                  className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    isCurrentlySpeaking
                      ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Écouter la prononciation et la consigne"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedSignModal(sign)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>Détails</span>
                  </button>

                  {onSelectSignForPractice && (
                    <button
                      onClick={() => onSelectSignForPractice(sign)}
                      className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="S'entraîner à ce signe devant la caméra"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Scanner</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSigns.length === 0 && (
        <div className="text-center py-12 space-y-3 bg-slate-950/40 border border-slate-800 rounded-2xl">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-mono text-slate-400">
            Aucun signe ne correspond à votre recherche "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono rounded-xl cursor-pointer hover:bg-slate-800"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Detailed Modal for a Selected Sign */}
      {selectedSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedSignModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-4xl shadow-inner">
                {selectedSignModal.symbol}
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono rounded-full font-bold">
                  {selectedSignModal.category.toUpperCase()} • {selectedSignModal.difficulty}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedSignModal.name}
                </h3>
                {selectedSignModal.phonetic && (
                  <p className="text-xs font-mono text-emerald-400">
                    Phonème / Valeur : {selectedSignModal.phonetic}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-mono font-bold text-emerald-400">
                  Description du Mouvement :
                </div>
                <p className="leading-relaxed">{selectedSignModal.description}</p>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-mono font-bold text-indigo-400">
                  Configuration Anatomique des Doigts :
                </div>
                <p className="leading-relaxed">{selectedSignModal.fingerPosition}</p>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1">
                <div className="text-[11px] font-mono font-bold text-emerald-300">
                  Conseil d'Exécution & Détection IA :
                </div>
                <p className="leading-relaxed">{selectedSignModal.tips}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 gap-3">
              <button
                onClick={() => handleSpeak(selectedSignModal)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Prononciation</span>
              </button>

              <button
                onClick={() => {
                  if (onSelectSignForPractice) {
                    onSelectSignForPractice(selectedSignModal);
                  }
                  setSelectedSignModal(null);
                }}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Hand className="w-4 h-4" />
                <span>Tester au Scanner</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
