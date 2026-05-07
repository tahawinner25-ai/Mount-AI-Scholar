import React from 'react';

interface DyslexicRendererProps {
  text: string;
}

export default function DyslexicRenderer({ text }: DyslexicRendererProps) {
  if (!text) {
    return (
      <span className="font-medium italic tracking-widest text-slate-500">
        Prêt... Le texte s'affichera ici avec une lisibilité maximale.
      </span>
    );
  }

  // Fonction experte pour parser les mots et générer le code couleur
  // - Les syllabes alterneront en couleur (ex: bleu / rouge)
  // - Les lettres muettes courantes en fin de mot (e, s, t, x, z) en gris.
  const renderWord = (word: string, wordIndex: number) => {
    if (!word) return null;

    // Regex très basique pour séparer les syllabes (voyeilles + consonnes).
    const syllableRegex = /[^aeyuioœAEYUIOŒ]+[aeyuioœAEYUIOŒ]+|[aeyuioœAEYUIOŒ]+/g;
    let syllables = word.match(syllableRegex) || [word];

    // Vérification des lettres muettes typiques à la fin
    let silentSuffix = "";
    const lowerWord = word.toLowerCase();
    if (word.length > 2) {
      if (lowerWord.endsWith('ent') && syllables.length > 1) { // Souvent muet dans les verbes
        silentSuffix = word.slice(-3);
        const remaining = word.slice(0, -3);
        syllables = remaining.match(syllableRegex) || [remaining];
      } else if (/[e|s|t|x|z]$/.test(lowerWord)) {
        silentSuffix = word.slice(-1);
        const remaining = word.slice(0, -1);
        syllables = remaining.match(syllableRegex) || [remaining];
      }
    }

    // Couleurs alternées avec fort contraste adapté à la lecture (évite le rouge agressif)
    const colors = ["text-blue-700", "text-emerald-700"];

    return (
      <span key={wordIndex} className="inline-block mr-4 mb-4 bg-white px-3 py-2 rounded-xl border-2 border-slate-200 shadow-sm">
        {syllables.map((syl, i) => (
          <span key={i} className={`font-extrabold tracking-widest ${colors[i % colors.length]}`}>
            {syl}
          </span>
        ))}
        {silentSuffix && (
          <span className="font-medium tracking-widest text-slate-400 opacity-80">
            {silentSuffix}
          </span>
        )}
      </span>
    );
  };

  const words = text.split(/\s+/);

  return (
    <div className="flex flex-wrap items-center leading-loose text-4xl md:text-5xl font-sans">
      {words.map((word, index) => renderWord(word, index))}
    </div>
  );
}
