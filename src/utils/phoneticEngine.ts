// Mount AI Scholar - Real-time High Performance Phonetic Engine
// Designed for ultra-low latency dyslexic spelling assistance

export interface LocalWordDefinition {
  word: string;
  meaning: string;
  example: string;
  phoneticCode: string;
}

// Comprehensive dictionary of common French words with spelling difficulties
export const FRENCH_DICTIONARY: LocalWordDefinition[] = [
  { word: "chapeau", meaning: "Coiffure qui couvre la tête.", example: "Il met son chapeau avant de sortir.", phoneticCode: "" },
  { word: "bateau", meaning: "Embarcation de transport sur l'eau.", example: "Le bateau traverse le détroit de Gibraltar.", phoneticCode: "" },
  { word: "spectacle", meaning: "Représentation théâtrale, de danse ou de musique.", example: "Nous allons voir un spectacle ce soir.", phoneticCode: "" },
  { word: "magnifique", meaning: "Qui est d'une grande beauté.", example: "Le coucher de soleil sur Marrakech est magnifique.", phoneticCode: "" },
  { word: "ordinateur", meaning: "Machine électronique de traitement de l'information.", example: "Le Capitaine code sur son ordinateur portable.", phoneticCode: "" },
  { word: "bilingue", meaning: "Qui parle couramment deux langues.", example: "Il est bilingue en arabe et en français.", phoneticCode: "" },
  { word: "école", meaning: "Établissement où l'on donne un enseignement.", example: "Les élèves apprennent à lire à l'école.", phoneticCode: "" },
  { word: "physique", meaning: "Science qui étudie les propriétés de la matière.", example: "La physique explique le mouvement des planètes.", phoneticCode: "" },
  { word: "faute", meaning: "Manquement à une règle d'orthographe ou de calcul.", example: "L'intelligence artificielle aide à corriger chaque faute.", phoneticCode: "" },
  { word: "horloge", meaning: "Appareil qui indique l'heure.", example: "L'horloge du salon sonne toutes les heures.", phoneticCode: "" },
  { word: "temps", meaning: "Durée dans laquelle se déroulent les événements.", example: "Le temps passe très vite quand on code.", phoneticCode: "" },
  { word: "dyslexie", meaning: "Trouble de l'apprentissage de la lecture.", example: "Des outils adaptés permettent de surmonter la dyslexie.", phoneticCode: "" },
  { word: "étudiant", meaning: "Personne qui fait des études supérieures.", example: "L'étudiant prépare son examen avec attention.", phoneticCode: "" },
  { word: "programme", meaning: "Suite d'instructions exécutées par un ordinateur.", example: "Ce programme s'exécute en moins de deux millisecondes.", phoneticCode: "" },
  { word: "téléphone", meaning: "Appareil de communication à distance.", example: "Il utilise son téléphone pour appeler son mentor.", phoneticCode: "" },
  { word: "photographe", meaning: "Artiste qui prend des photos.", example: "Le photographe immortalise les paysages du Maroc.", phoneticCode: "" },
  { word: "effort", meaning: "Mobilisation de forces pour vaincre une difficulté.", example: "Chaque effort rapproche du succès.", phoneticCode: "" },
  { word: "affecter", meaning: "Toucher ou modifier l'état de quelque chose.", example: "La fatigue peut affecter la concentration.", phoneticCode: "" },
  { word: "accueil", meaning: "Action de recevoir quelqu'hui.", example: "L'école réserve un accueil chaleureux aux nouveaux.", phoneticCode: "" },
  { word: "arrêter", meaning: "Interrompre une action ou un mouvement.", example: "Il ne faut jamais s'arrêter d'apprendre.", phoneticCode: "" },
  { word: "aller", meaning: "Se déplacer vers un lieu.", example: "Il veut aller étudier dans la Silicon Valley.", phoneticCode: "" },
  { word: "habiter", meaning: "Avoir sa demeure dans un lieu.", example: "Il aime habiter au Maroc.", phoneticCode: "" },
  { word: "histoire", meaning: "Récit d'événements passés.", example: "L'histoire de la technologie est passionnante.", phoneticCode: "" },
  { word: "homme", meaning: "Être humain de sexe masculin.", example: "Cet homme est un ingénieur remarquable.", phoneticCode: "" },
  { word: "honneur", meaning: "Sentiment de dignité et de fierté.", example: "C'est un grand honneur de présenter ce projet.", phoneticCode: "" },
  { word: "horrible", meaning: "Qui cause de l'effroi ou du dégoût.", example: "C'est une horrible erreur de syntaxe.", phoneticCode: "" },
  { word: "hiver", meaning: "Saison la plus froide de l'année.", example: "L'hiver est doux dans la région de Casablanca.", phoneticCode: "" },
  { word: "horizon", meaning: "Ligne où la terre semble toucher le ciel.", example: "Le code ouvre de nouveaux horizons.", phoneticCode: "" },
  { word: "hôpital", meaning: "Établissement de soins médicaux.", example: "Les médecins travaillent jour et nuit à l'hôpital.", phoneticCode: "" },
  { word: "hôtel", meaning: "Établissement qui loge des voyageurs.", example: "La conférence se tient dans un grand hôtel.", phoneticCode: "" },
  { word: "huile", meaning: "Liquide gras insoluble dans l'eau.", example: "L'huile d'argan est une spécialité du Maroc.", phoneticCode: "" },
  { word: "huit", meaning: "Le nombre qui suit sept.", example: "Il y a huit modules de révision sur le hub.", phoneticCode: "" },
  { word: "erreur", meaning: "Action de se tromper.", example: "L'erreur est humaine, mais le compilateur la détecte.", phoneticCode: "" },
  { word: "exercice", meaning: "Activité pratique pour s'entraîner.", example: "Faire un exercice de phonétique tous les jours.", phoneticCode: "" },
  { word: "exemple", meaning: "Ce qui sert de modèle ou d'illustration.", example: "Voici un exemple d'application du modèle local.", phoneticCode: "" },
  { word: "compagnie", meaning: "Présence de quelqu'un ou entreprise.", example: "Il aime coder en compagnie de son IA.", phoneticCode: "" },
  { word: "campagne", meaning: "Grande étendue de pays plat hors des villes.", example: "Une promenade à la campagne fait du bien à l'esprit.", phoneticCode: "" },
  { word: "jambe", meaning: "Membre inférieur du corps humain.", example: "Il s'est blessé à la jambe en jouant au football.", phoneticCode: "" },
  { word: "ampoule", meaning: "Objet en verre produisant de la lumière.", example: "Il faut changer l'ampoule du bureau.", phoneticCode: "" },
  { word: "oncle", meaning: "Frère du père ou de la mère.", example: "Son oncle travaille dans le développement informatique.", phoneticCode: "" },
  { word: "rompre", meaning: "Casser ou mettre fin à un engagement.", example: "Il refuse de rompre le fil de sa réflexion.", phoneticCode: "" },
  { word: "combattre", meaning: "Lutter activement contre quelque chose.", example: "Les exercices aident à combattre les fautes.", phoneticCode: "" },
  { word: "tromper", meaning: "Induire en erreur ou commettre une méprise.", example: "On peut se tromper, l'essentiel est de corriger.", phoneticCode: "" },
  { word: "combien", meaning: "Indique la quantité ou le nombre.", example: "Combien de lignes de code as-tu écrites aujourd'hui ?", phoneticCode: "" },
  { word: "tomber", meaning: "Être entraîné vers le bas par son poids.", example: "La pluie commence à tomber sur la cour.", phoneticCode: "" },
  { word: "ombre", meaning: "Zone sombre privée de lumière.", example: "Il s'abrite à l'ombre du grand olivier.", phoneticCode: "" },
  { word: "sombre", meaning: "Qui est peu éclairé ou triste.", example: "L'interface offre un mode sombre très confortable.", phoneticCode: "" },
  { word: "écriture", meaning: "Représentation graphique de la parole.", example: "L'écriture cursive demande de la motricité.", phoneticCode: "" },
  { word: "lecture", meaning: "Action de déchiffrer un texte écrit.", example: "La lecture fluide s'acquiert par l'entraînement.", phoneticCode: "" },
  { word: "mathématiques", meaning: "Science des nombres et des figures géométriques.", example: "Les vecteurs sont un chapitre des mathématiques.", phoneticCode: "" },
  { word: "algorithme", meaning: "Suite d'instructions logiques pour résoudre un problème.", example: "L'algorithme de recommandation tourne en tâche de fond.", phoneticCode: "" },
  { word: "dictionnaire", meaning: "Recueil de mots avec leurs définitions.", example: "Le dictionnaire contient toutes les règles orthographiques.", phoneticCode: "" },
  { word: "grammaire", meaning: "Ensemble des règles d'une langue.", example: "La grammaire française est riche en accords.", phoneticCode: "" },
  { word: "orthographe", meaning: "Manière correcte d'écrire les mots.", example: "Une bonne orthographe donne confiance en soi.", phoneticCode: "" },
  { word: "phonétique", meaning: "Relatif aux sons de la parole.", example: "La transcription phonétique aide au décodage.", phoneticCode: "" },
  { word: "parole", meaning: "Faculté d'exprimer sa pensée par des mots.", example: "La synthèse vocale redonne vie à la parole écrite.", phoneticCode: "" },
  { word: "voix", meaning: "Sons produits par les cordes vocales.", example: "La voix de l'IA guide l'étudiant dyslexique.", phoneticCode: "" },
  { word: "apprentissage", meaning: "Fait d'acquérir une connaissance ou un savoir-faire.", example: "L'apprentissage de la programmation est une aventure.", phoneticCode: "" },
  { word: "intelligence", meaning: "Faculté de comprendre et d'analyser.", example: "L'intelligence artificielle soutient l'accessibilité scolaire.", phoneticCode: "" },
  { word: "système", meaning: "Ensemble ordonné d'éléments.", example: "Le système d'exploitation de Mount AI Scholar est prêt.", phoneticCode: "" },
  { word: "technologie", meaning: "Étude et application des techniques.", example: "La technologie doit être au service de l'inclusion.", phoneticCode: "" },
  { word: "environnement", meaning: "Cadre de vie ou milieu d'exécution.", example: "L'environnement de développement est configuré.", phoneticCode: "" },
  { word: "collège", meaning: "Établissement d'enseignement secondaire.", example: "Il est le premier de sa classe au collège.", phoneticCode: "" },
  { word: "classe", meaning: "Groupe d'élèves qui suivent le même enseignement.", example: "Toute sa classe utilise Mount AI Scholar.", phoneticCode: "" },
  { word: "camarade", meaning: "Compagnon d'école ou de travail.", example: "Il explique le fonctionnement du code à son camarade.", phoneticCode: "" },
  { word: "professeur", meaning: "Personne qui enseigne une matière.", example: "Le professeur encourage ses initiatives de programmation.", phoneticCode: "" },
  { word: "mémoire", meaning: "Faculté de conserver et de rappeler des souvenirs.", example: "La mémoire de travail est sollicitée par le décodage.", phoneticCode: "" },
  { word: "attention", meaning: "Concentration de l'esprit sur un objet.", example: "L'outil soulage l'attention nécessaire à la relecture.", phoneticCode: "" },
  { word: "cognitif", meaning: "Qui concerne les fonctions de la connaissance.", example: "L'aménagement cognitif facilite la réussite.", phoneticCode: "" },
  { word: "accessibilité", meaning: "Fait d'être accessible aux personnes handicapées.", example: "L'accessibilité numérique est un droit fondamental.", phoneticCode: "" },
  { word: "inclusion", meaning: "Fait d'intégrer tout individu dans la société.", example: "L'inclusion scolaire progresse grâce à l'IA.", phoneticCode: "" },
  { word: "réussite", meaning: "Succès d'une action.", example: "Votre réussite à l'examen est assurée.", phoneticCode: "" },
  { word: "travail", meaning: "Activité humaine ordonnée à la production.", example: "Le travail paie toujours dans la Silicon Valley.", phoneticCode: "" },
  { word: "génie", meaning: "Aptitude supérieure de l'esprit.", example: "L'architecture logicielle requiert de la rigueur et du génie.", phoneticCode: "" },
  { word: "créativité", meaning: "Pouvoir de création et d'invention.", example: "Le codage stimule la créativité chez les jeunes.", phoneticCode: "" },
  { word: "passion", meaning: "Amour très vif pour une activité.", example: "L'IA est sa passion absolue depuis plusieurs années.", phoneticCode: "" },
  { word: "futur", meaning: "Temps à venir.", example: "Le futur s'écrit ligne par ligne.", phoneticCode: "" },
  { word: "monde", meaning: "La Terre, l'univers ou la société.", example: "Il veut faire connaître sa technologie au monde entier.", phoneticCode: "" },
  { word: "partage", meaning: "Action de diviser ou de distribuer.", example: "Le partage des ressources favorise la collaboration.", phoneticCode: "" },
  { word: "aide", meaning: "Soutien ou assistance apporté.", example: "L'aide de l'IA est disponible 24 heures sur 24.", phoneticCode: "" },
  { word: "outil", meaning: "Instrument qui sert à travailler.", example: "Le clavier est l'outil de l'écrivain moderne.", phoneticCode: "" },
  { word: "facile", meaning: "Qui ne demande aucun effort.", example: "Avec ce prédicteur, écrire devient facile.", phoneticCode: "" },
  { word: "rapide", meaning: "Qui se déplace ou se fait avec vitesse.", example: "Ce script de correction est extrêmement rapide.", phoneticCode: "" },
  { word: "nouveau", meaning: "Qui existe depuis peu de temps.", example: "Il a installé un nouveau moteur d'inférence.", phoneticCode: "" },
  { word: "vitesse", meaning: "Rapidité du mouvement.", example: "La vitesse de calcul est de l'ordre de la microseconde.", phoneticCode: "" },
  { word: "latitude", meaning: "Distance par rapport à l'équateur ou liberté d'action.", example: "Il dispose d'une grande latitude dans ses choix techniques.", phoneticCode: "" },
  { word: "génération", meaning: "Action d'engendrer ou ensemble d'individus du même âge.", example: "La nouvelle génération d'agents d'IA change la donne.", phoneticCode: "" },
  { word: "langue", meaning: "Système d'expression propre à une communauté.", example: "La langue française s'apprend par l'écriture.", phoneticCode: "" },
  { word: "mot", meaning: "Unité de la langue parlée ou écrite.", example: "Chaque mot corrigé est un pas vers l'autonomie.", phoneticCode: "" },
  { word: "phrase", meaning: "Suite de mots ayant un sens complet.", example: "Il compose une phrase d'exemple pour s'entraîner.", phoneticCode: "" },
  { word: "texte", meaning: "Ensemble d'écrits formant un tout.", example: "Le texte de son email est enfin prêt.", phoneticCode: "" },
  { word: "message", meaning: "Communication transmise à quelqu'un.", example: "Il envoie un message d'encouragement à son équipe.", phoneticCode: "" },
  { word: "brouillon", meaning: "Premier état d'un écrit.", example: "Il crée un brouillon pour sauvegarder ses idées.", phoneticCode: "" },
  { word: "envoi", meaning: "Action d'expédier.", example: "L'envoi de l'email se fait via l'API sécurisée.", phoneticCode: "" },
  { word: "connexion", meaning: "Liaison établie entre deux systèmes.", example: "La connexion Gmail s'effectue en un clic.", phoneticCode: "" },
  { word: "compte", meaning: "Enregistrement des données d'un utilisateur.", example: "Il se connecte à son compte Google Workspace.", phoneticCode: "" }
];

// Calculate Levenshtein Distance
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// Convert word to simplified phonetic French representation
export function getPhoneticCodeFrench(word: string): string {
  let s = word.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .trim();

  if (!s) return "";

  // 1. Double letters reduction (except ss)
  s = s.replace(/([^s])\1+/g, "$1");

  // 2. Hard translations
  s = s.replace(/ph/g, "f");
  s = s.replace(/ain|ein|aim|eim/g, "in");
  s = s.replace(/an|am|en|em/g, "an");
  s = s.replace(/on|om/g, "on");
  s = s.replace(/oin/g, "oin");

  // 3. Vowels
  s = s.replace(/eau|au/g, "o");
  s = s.replace(/ai|ei|et|est/g, "e");
  s = s.replace(/y/g, "i");
  s = s.replace(/ou/g, "u");

  // 4. Consonants depending on letters
  s = s.replace(/c([eiy])/g, "s$1");
  s = s.replace(/c([aou])/g, "k$1");
  s = s.replace(/ç/g, "s");
  s = s.replace(/c$/g, "k");
  s = s.replace(/qu|k/g, "k");
  s = s.replace(/ch/g, "sh");

  s = s.replace(/g([eiy])/g, "j$1");
  s = s.replace(/g([aou])/g, "g$1");
  s = s.replace(/gu([eiy])/g, "g$1");

  // 5. Silent ending consonants for French spelling rules
  if (s.length > 2) {
    s = s.replace(/[stxdgp]$/g, "");
  }

  // Cleanup potential duplicates
  s = s.replace(/(.)\1+/g, "$1");

  return s;
}

// Pre-initialize dictionary phonetics
FRENCH_DICTIONARY.forEach(def => {
  def.phoneticCode = getPhoneticCodeFrench(def.word);
});

// Main low-latency local search function
export function findLocalPhoneticSuggestions(word: string): Array<{word: string, probability: string, meaning: string, example: string}> {
  const cleanWord = word.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!cleanWord) return [];

  const inputPhonetic = getPhoneticCodeFrench(cleanWord);

  // Compute metrics for all dictionary words
  const matches = FRENCH_DICTIONARY.map(entry => {
    // 1. Match phonetic codes
    const phoneticDistance = getLevenshteinDistance(inputPhonetic, entry.phoneticCode);
    
    // 2. Direct spelling distance
    const spellingDistance = getLevenshteinDistance(cleanWord, entry.word);

    // Let's create a combined score: lower is better
    // Direct phonetic match has highest weight
    let score = phoneticDistance * 2.5 + spellingDistance * 1.0;

    // Direct starting letter bonus
    if (cleanWord[0] === entry.word[0]) {
      score -= 1.0; // reward starting with same letter
    }

    // Exact phonetic match gives a major boost
    if (inputPhonetic === entry.phoneticCode) {
      score -= 5.0;
    }

    // Exact direct match means they typed it correctly, let's keep it but maybe rank it high
    if (cleanWord === entry.word) {
      score -= 10.0;
    }

    return {
      entry,
      phoneticDistance,
      spellingDistance,
      score
    };
  });

  // Sort by score ascending (lowest score is best match)
  const sorted = matches.sort((a, b) => a.score - b.score);

  // Filter out completely unrelated stuff and pick top 4
  const topMatches = sorted.slice(0, 4).map(m => {
    // Calculate a simulated match probability based on score
    let pct = 80;
    if (m.spellingDistance === 0) pct = 99;
    else if (m.phoneticDistance === 0) pct = 95;
    else {
      const maxLen = Math.max(cleanWord.length, m.entry.word.length);
      const accuracy = 1 - (m.phoneticDistance / maxLen);
      pct = Math.round(Math.max(50, Math.min(90, accuracy * 100)));
    }

    return {
      word: m.entry.word,
      probability: `${pct}%`,
      meaning: m.entry.meaning,
      example: m.entry.example
    };
  });

  return topMatches;
}

// Locate word boundary containing a cursor index
export interface ActiveWordBoundary {
  word: string;
  start: number;
  end: number;
}

export function getActiveWordAtCursor(text: string, cursorIndex: number): ActiveWordBoundary | null {
  if (!text) return null;
  
  // Find boundaries of the word containing cursorIndex
  let start = cursorIndex;
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start--;
  }
  
  let end = cursorIndex;
  while (end < text.length && !/\s/.test(text[end])) {
    end++;
  }
  
  const rawWord = text.slice(start, end);
  // Clean special characters only from the outer bounds, keeping inner chars if needed
  const word = rawWord.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"'’\n\r]+/, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’\n\r]+$/, "");
  
  if (!word || word.length < 2) return null;

  // Recalculate precise start/end after stripping punctuation
  const leftTrimDiff = rawWord.indexOf(word);
  const preciseStart = start + (leftTrimDiff >= 0 ? leftTrimDiff : 0);
  const preciseEnd = preciseStart + word.length;

  return { word, start: preciseStart, end: preciseEnd };
}
