import React from 'react';

interface DyslexicRendererProps {
  text: string;
}

export default function DyslexicRenderer({ text }: DyslexicRendererProps) {
  if (!text) {
    return (
      <span className="font-light italic tracking-tight text-slate-500">
        Le moteur de reconnaissance vocale attend...
      </span>
    );
  }

  // Fonction experte pour parser les mots et générer le code couleur
  // - Les syllabes alterneront en couleur (ex: bleu / rouge)
  // - Les lettres muettes courantes en fin de mot (e, s, t, x, z) en gris.
  const renderWord = (word: string, wordIndex: number) => {
    if (!word) return null;

    // Regex très basique pour séparer les syllabes (voyeilles + consonnes).
    // Ceci est une approximation visuelle pour le prototype web. 
    // Sur ton PC python tu utiliseras NLTK ou un moteur NLP !
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

    // Couleurs alternées pour le contraste visuel (très utile pour la dyslexie)
    const colors = ["text-blue-400", "text-orange-400"];

    return (
      <span key={wordIndex} className="inline-block mr-2 mb-2 bg-slate-950/50 px-2 py-1 rounded-lg border border-slate-800/50">
        {syllables.map((syl, i) => (
          <span key={i} className={`font-bold ${colors[i % colors.length]}`}>
            {syl}
          </span>
        ))}
        {silentSuffix && (
          <span className="font-light text-slate-500 opacity-60">
            {silentSuffix}
          </span>
        )}
      </span>
    );
  };

  const words = text.split(/\s+/);

  return (
    <div className="flex flex-wrap items-center leading-loose text-2xl">
      {words.map((word, index) => renderWord(word, index))}
    </div>
  );
}
