import React from 'react';

interface DyslexicRendererProps {
  text: string;
  isBionic?: boolean;
  letterSpacing?: 'normal' | 'wide' | 'widest';
  wordSpacing?: 'normal' | 'wide' | 'widest';
  dyslexicFont?: boolean;
}

export default function DyslexicRenderer({ 
  text, 
  isBionic = false, 
  letterSpacing = 'normal', 
  wordSpacing = 'normal', 
  dyslexicFont = false 
}: DyslexicRendererProps) {
  if (!text) {
    return (
      <span className={`font-medium italic tracking-widest text-slate-500 ${dyslexicFont ? 'font-mono' : ''}`}>
        Prêt... Le texte s'affichera ici avec une lisibilité maximale.
      </span>
    );
  }

  // Helper styles based on settings
  const getLetterSpacingClass = () => {
    if (letterSpacing === 'wide') return 'tracking-wide';
    if (letterSpacing === 'widest') return 'tracking-[0.18em]';
    return 'tracking-normal';
  };

  const getWordSpacingClass = () => {
    if (wordSpacing === 'wide') return 'mr-6 mb-4';
    if (wordSpacing === 'widest') return 'mr-10 mb-6';
    return 'mr-4 mb-3';
  };

  const getFontClass = () => {
    // Mimic OpenDyslexic weighted bottoms or spaced structure with custom typography settings
    if (dyslexicFont) return 'font-mono font-bold leading-relaxed tracking-wider text-white';
    return 'font-sans font-medium text-slate-100';
  };

  // Experte word parser supporting Bionic Reading and Syllabic highlight
  const renderWord = (word: string, wordIndex: number) => {
    if (!word) return null;

    // Handle symbols directly
    const wordClean = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (!wordClean) return <span key={wordIndex} className="mr-3 text-slate-500">{word}</span>;

    // 1. If Bionic reading is active
    if (isBionic) {
      const len = wordClean.length;
      const highlightCount = len === 1 ? 1 : len <= 3 ? 1 : Math.ceil(len * 0.45);
      const boldPart = wordClean.substring(0, highlightCount);
      const normalPart = word.substring(highlightCount);

      return (
        <span 
          key={wordIndex} 
          className={`inline-block ${getWordSpacingClass()} ${getLetterSpacingClass()} ${getFontClass()} bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-2xl shadow-md transition-all hover:bg-white/10`}
          style={{ textShadow: dyslexicFont ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}
        >
          <span className="text-indigo-400 font-extrabold uppercase tracking-wide">
            {boldPart}
          </span>
          <span className="opacity-80">
            {normalPart}
          </span>
        </span>
      );
    }

    // 2. Syllabic highlight (Default)
    const syllableRegex = /[^aeyuioœAEYUIOŒ]+[aeyuioœAEYUIOŒ]+|[aeyuioœAEYUIOŒ]+/g;
    let syllables = wordClean.match(syllableRegex) || [wordClean];

    let silentSuffix = "";
    const lowerWord = wordClean.toLowerCase();
    if (wordClean.length > 2) {
      if (lowerWord.endsWith('ent') && syllables.length > 1) { // Verb silent endings
        silentSuffix = wordClean.slice(-3);
        const remaining = wordClean.slice(0, -3);
        syllables = remaining.match(syllableRegex) || [remaining];
      } else if (/[e|s|t|x|z]$/.test(lowerWord)) {
        silentSuffix = wordClean.slice(-1);
        const remaining = wordClean.slice(0, -1);
        syllables = remaining.match(syllableRegex) || [remaining];
      }
    }

    // High contrast educational layout palette
    const colors = ["text-indigo-400", "text-emerald-400"];

    return (
      <span 
        key={wordIndex} 
        className={`inline-block ${getWordSpacingClass()} ${getLetterSpacingClass()} ${getFontClass()} bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-2xl shadow-md hover:bg-white/10 transition-all`}
        style={{ textShadow: dyslexicFont ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}
      >
        {syllables.map((syl, i) => (
          <span key={i} className={`font-black ${colors[i % colors.length]} tracking-widest`}>
            {syl}
          </span>
        ))}
        {silentSuffix && (
          <span className="font-semibold text-slate-500 tracking-wider">
            {silentSuffix}
          </span>
        )}
        {/* Append non-letter punctuation if any */}
        {word !== wordClean && (
          <span className="text-slate-500 font-bold ml-0.5">
            {word.slice(wordClean.length)}
          </span>
        )}
      </span>
    );
  };

  const words = text.split(/\s+/);

  return (
    <div className={`flex flex-wrap items-center leading-loose text-2xl md:text-3xl ${dyslexicFont ? 'line-height-[2.5]' : ''}`}>
      {words.map((word, index) => renderWord(word, index))}
    </div>
  );
}
