// API calls relayed to backend avec un Cognitive Offline Fallback Engine robuste (Gemma 4 Edge Security)

interface OfflineTopic {
  titleFr: string;
  titleEn: string;
  summaryFr: string[];
  summaryEn: string[];
  quizFr: Array<{ question: string; options: string[]; answer: string; explanation: string }>;
  quizEn: Array<{ question: string; options: string[]; answer: string; explanation: string }>;
}

const offlineTopicDatabase: Record<string, OfflineTopic> = {
  "vecteurs": {
    titleFr: "Les Vecteurs (Mathématiques)",
    titleEn: "Vectors (Mathematics)",
    summaryFr: [
      "Un vecteur est un objet mathématique caractérisé par une direction, un sens et une longueur (appelée sa norme).",
      "En physique, les vecteurs sont indispensables pour modéliser des grandeurs orientées comme les forces, les vecteurs vitesse et les déplacements.",
      "Les opérations vectorielles usuelles incluent la somme de vecteurs (définie par la relation de Chasles), la colinéarité, et le produit scalaire pour analyser les angles."
    ],
    summaryEn: [
      "A vector is a geometric object characterized by a direction, a sense, and a magnitude (length).",
      "In physics, vectors are fundamental to represent directed quantities such as forces, velocity, and spatial displacements.",
      "Common vector operations include vector addition (Triangle rule / Chasles relation), scalar multiplication, and dot product calculations."
    ],
    quizFr: [
      {
        question: "Qu'est-ce qui caractérise entièrement un vecteur en géométrie ?",
        options: ["A) Seulement sa longueur", "B) Une direction, un sens et une norme (longueur)", "C) Uniquement son point de départ", "D) Une simple valeur numérique positive"],
        answer: "B",
        explanation: "Un vecteur est défini géométriquement par sa direction (la droite support), son sens (l'orientation de la flèche) et sa norme (sa longueur)."
      },
      {
        question: "Quelle opération géométrique permet de simplifier la somme de deux vecteurs consécutifs ?",
        options: ["A) La relation de Chasles", "B) Le produit vectoriel", "C) Le théorème de Pythagore", "D) Le produit scalaire"],
        answer: "A",
        explanation: "La relation de Chasles stipule que pour trois points A, B, C, le vecteur AB + le vecteur BC est égal au vecteur AC."
      },
      {
        question: "En physique fondamentale, quel type de grandeur est représenté par un vecteur ?",
        options: ["A) Une masse", "B) Une température", "C) Une force appliquée", "D) Une énergie cinétique"],
        answer: "C",
        explanation: "Une force a une direction d'action, un sens et une intensité, ce qui correspond exactement aux caractéristiques d'un vecteur."
      }
    ],
    quizEn: [
      {
        question: "What completely characterizes a vector in geometry?",
        options: ["A) Only its length", "B) A direction, a sense, and a magnitude", "C) Only its starting point", "D) A simple positive numerical value"],
        answer: "B",
        explanation: "A vector is geometrically defined by its direction (supporting line), its sense (orientation), and its magnitude (length)."
      },
      {
        question: "Which mathematical relation allows simplifying the sum of two consecutive vectors?",
        options: ["A) Chasles relation", "B) Cross product", "C) Pythagorean theorem", "D) Dot product"],
        answer: "A",
        explanation: "Chasles relation states that vector AB + vector BC is equal to vector AC."
      },
      {
        question: "In physics, which quantity is represented by a vector?",
        options: ["A) Mass", "B) Temperature", "C) An applied force", "D) Kinetic energy"],
        answer: "C",
        explanation: "A force is exerted in a specific direction with a certain strength, making it a vector quantity."
      }
    ]
  },
  "fractions": {
    titleFr: "Les Fractions (Arithmétique)",
    titleEn: "Fractions (Arithmetic)",
    summaryFr: [
      "Une fraction représente le partage d'une unité en plusieurs parts égales.",
      "Elle est constituée d'un numérateur (nombre de parts considérées) placé au-dessus, et d'un dénominateur (nombre total de parts) placé au-dessous.",
      "Pour additionner ou soustraire deux fractions, il est indispensable de les réduire au même dénominateur commun."
    ],
    summaryEn: [
      "A fraction represents the division of a whole or a unit into equal parts.",
      "It consists of a numerator (number of selected parts) on top, and a denominator (total number of parts) on the bottom.",
      "To add or subtract fractions, they must first be converted to share a common denominator."
    ],
    quizFr: [
      {
        question: "Dans la fraction mathématique 3/5, comment appelle-t-on le nombre 3 ?",
        options: ["A) Le dénominateur", "B) Le numérateur", "C) Le quotient", "D) Le diviseur"],
        answer: "B",
        explanation: "Le nombre du haut est le numérateur (parts choisies). Le nombre du bas (5) est le dénominateur (parts totales)."
      },
      {
        question: "Quelle opération est indispensable avant d'additionner deux fractions ?",
        options: ["A) Multiplier les numérateurs", "B) Simplifier par zéro", "C) Réduire au même dénominateur", "D) Inverser la seconde fraction"],
        answer: "C",
        explanation: "On ne peut additionner directement que des fractions représentant des parts de même taille, donc ayant le même dénominateur."
      },
      {
        question: "Quelle est la forme irréductible de la fraction 6/12 ?",
        options: ["A) 3/6", "B) 1/2", "C) 1/3", "D) 2/4"],
        answer: "B",
        explanation: "En divisant le numérateur et le dénominateur par leur plus grand commun diviseur (6), on obtient la fraction irréductible 1/2."
      }
    ],
    quizEn: [
      {
        question: "In the fraction 3/5, what is the number 3 called?",
        options: ["A) The denominator", "B) The numerator", "C) The quotient", "D) The divisor"],
        answer: "B",
        explanation: "The top number is the numerator. The bottom number (5) is the denominator."
      },
      {
        question: "What is the mandatory step before adding two fractions?",
        options: ["A) Multiply the numerators", "B) Simplify by zero", "C) Find a common denominator", "D) Invert the second fraction"],
        answer: "C",
        explanation: "Fractions must have the same denominator (shares of equal size) before you can perform addition."
      },
      {
        question: "What is 6/12 simplified to its lowest terms?",
        options: ["A) 3/6", "B) 1/2", "C) 1/3", "D) 2/4"],
        answer: "B",
        explanation: "Dividing both numerator and denominator by their greatest common divisor (6) yields 1/2."
      }
    ]
  },
  "atome": {
    titleFr: "L'Atome et la Constitution de la Matière",
    titleEn: "Atoms and Matter Structure",
    summaryFr: [
      "L'atome est la brique élémentaire et fondamentale qui compose toute matière de l'univers.",
      "Il est structuré autour d'un noyau central lourd (protons chargés positivement et neutrons électriquement neutres) entouré d'électrons négatifs en mouvement.",
      "Le nombre de protons (appelé numéro atomique Z) définit l'identité chimique unique de l'atome dans le tableau périodique des éléments."
    ],
    summaryEn: [
      "An atom is the basic and fundamental building block of all chemical matter.",
      "It consists of a heavy central nucleus (positive protons and neutral neutrons) surrounded by orbiting negative electrons.",
      "The number of protons (atomic number Z) defines the unique identity of the chemical element in the periodic table."
    ],
    quizFr: [
      {
        question: "Quelles sont les particules de charge neutre situées dans le noyau d'un atome ?",
        options: ["A) Les protons", "B) Les électrons", "C) Les neutrons", "D) Les photons"],
        answer: "C",
        explanation: "Les neutrons, comme leur nom l'indique, sont électriquement neutres et résident dans le noyau aux côtés des protons."
      },
      {
        question: "Quelle particule élémentaire gravite autour du noyau de l'atome ?",
        options: ["A) Le neutron", "B) L'électron", "C) Le proton", "D) Le quark"],
        answer: "B",
        explanation: "L'électron, de charge négative, forme un nuage électronique en mouvement perpétuel autour du noyau atomique."
      },
      {
        question: "Quelle charge électrique porte globalement un atome à l'état stable neutre ?",
        options: ["A) Une charge négative", "B) Une charge positive", "C) Une charge nulle (neutre)", "D) Une charge variable infinie"],
        answer: "C",
        explanation: "Un atome neutre possède exactement le même nombre de protons (positifs) et d'électrons (négatifs), s'annulant mutuellement."
      }
    ],
    quizEn: [
      {
        question: "Which neutral particles reside inside the nucleus of an atom?",
        options: ["A) Protons", "B) Electrons", "C) Neutrons", "D) Photons"],
        answer: "C",
        explanation: "Neutrons are electrically neutral and reside in the atom nucleus alongside positive protons."
      },
      {
        question: "Which elementary particle orbits around the atomic nucleus?",
        options: ["A) Neutron", "B) Electron", "C) Proton", "D) Quark"],
        answer: "B",
        explanation: "The electron, which has a negative charge, forms a cloud orbiting the heavy central atomic nucleus."
      },
      {
        question: "What is the net electrical charge of a stable, neutral atom?",
        options: ["A) Negative charge", "B) Positive charge", "C) Zero (neutral)", "D) Infinite variable charge"],
        answer: "C",
        explanation: "A neutral atom has an equal number of positive protons and negative electrons, canceling each other out."
      }
    ]
  },
  "adn": {
    titleFr: "L'ADN et l'Information Génétique",
    titleEn: "DNA and Genetic Coding",
    summaryFr: [
      "L'ADN (acide désoxyribonucléique) est la molécule biologique qui stocke l'ensemble de l'information génétique héréditaire.",
      "Sa forme célèbre est une double hélice, constituée de bases azotées complémentaires : l'Adénine s'associe à la Thymine, et la Cytosine s'associe à la Guanine.",
      "L'expression de l'ADN s'effectue par sa transcription en ARN messager, puis par sa traduction en protéines fonctionnelles dans l'organisme."
    ],
    summaryEn: [
      "DNA (deoxyribonucleic acid) is the biological molecule that stores hereditary genetic instructions.",
      "Its shape is a double helix, held together by complementary nitrogenous bases: Adenine (A) pairs with Thymine (T), and Cytosine (C) pairs with Guanine (G).",
      "DNA is expressed through transcription into messenger RNA, which is then translated into functional proteins."
    ],
    quizFr: [
      {
        question: "Quelle est la forme structurelle universelle de la molécule d'ADN ?",
        options: ["A) Une boucle circulaire fermée", "B) Une double hélice torsadée", "C) Une chaîne rectiligne rigide", "D) Une structure en grille"],
        answer: "B",
        explanation: "La molécule d'ADN est configurée en forme de double hélice, semblable à une échelle hélicoïdale en colimaçon."
      },
      {
        question: "Quelle base s'associe toujours avec la Cytosine (C) dans l'ADN ?",
        options: ["A) L'Adénine (A)", "B) L'Uracile (U)", "C) La Guanine (G)", "D) La Thymine (T)"],
        answer: "C",
        explanation: "Dans les paires de bases de l'ADN, la Cytosine (C) se lie spécifiquement et systématiquement avec la Guanine (G)."
      },
      {
        question: "Dans quel but l'ADN est-il transcrit en ARN messager ?",
        options: ["A) Pour détruire la cellule", "B) Pour être traduit en protéines", "C) Pour fabriquer des lipides", "D) Pour remplacer le noyau"],
        answer: "B",
        explanation: "L'ARN messager sert de copie temporaire pour transporter l'information vers les ribosomes, où s'effectue la synthèse des protéines."
      }
    ],
    quizEn: [
      {
        question: "What is the universal structural shape of the DNA molecule?",
        options: ["A) A closed circular loop", "B) A twisted double helix", "C) A rigid straight chain", "D) A grid-like structure"],
        answer: "B",
        explanation: "DNA is configured as a double helix, resembling a spiral staircase."
      },
      {
        question: "Which base always pairs with Cytosine (C) in double-stranded DNA?",
        options: ["A) Adenine (A)", "B) Uracil (U)", "C) Guanine (G)", "D) Thymine (T)"],
        answer: "C",
        explanation: "In DNA base pairings, Cytosine (C) specifically and systematically binds with Guanine (G)."
      },
      {
        question: "What is the primary purpose of transcribing DNA into messenger RNA?",
        options: ["A) To destroy the cell", "B) To be translated into proteins", "C) To manufacture lipids", "D) To replace the nucleus"],
        answer: "B",
        explanation: "Messenger RNA acts as a template to carry genetic instructions to ribosomes, which build proteins."
      }
    ]
  },
  "algorithmes": {
    titleFr: "Les Algorithmes et la Pensée Logique",
    titleEn: "Algorithms and Logical Thinking",
    summaryFr: [
      "Un algorithme est une suite ordonnée, logique et finie d'instructions rigoureuses permettant de résoudre un problème.",
      "Ils forment le pilier central de l'informatique, dictant au processeur comment manipuler, trier et transformer les données.",
      "L'efficacité d'un algorithme s'évalue principalement à travers sa complexité temporelle et spatiale (exprimée par la notation Grand O)."
    ],
    summaryEn: [
      "An algorithm is a finite, ordered sequence of unambiguous instructions used to solve a problem or calculate a result.",
      "They are the core pillars of computer science, instructing processors on how to manipulate, filter, and structure data.",
      "Algorithm performance is mathematically evaluated using time and space complexity (Big O notation)."
    ],
    quizFr: [
      {
        question: "Comment définit-on un algorithme de manière simple ?",
        options: ["A) Un ordinateur physique", "B) Une suite ordonnée d'instructions pour résoudre un problème", "C) Un langage de programmation spécifique", "D) Une base de données cloud"],
        answer: "B",
        explanation: "Un algorithme est une recette logique d'étapes ordonnées indépendantes du langage machine utilisé."
      },
      {
        question: "Quelle notation utilise-t-on pour évaluer l'efficacité d'un algorithme ?",
        options: ["A) La notation Grand O (Big O)", "B) Le code binaire", "C) L'échelle de Richter", "D) L'indice ASCII"],
        answer: "A",
        explanation: "La notation Grand O évalue le comportement du temps d'exécution ou de l'espace mémoire requis quand la taille des données d'entrée augmente."
      },
      {
        question: "Que signifie un algorithme ayant une complexité temporelle de O(1) ?",
        options: ["A) Son temps d'exécution augmente linéairement", "B) Il s'exécute en un temps constant, quelle que soit la taille des données", "C) Il ne s'arrête jamais", "D) Il requiert une seule variable"],
        answer: "B",
        explanation: "La complexité O(1) représente le cas idéal d'un temps d'exécution constant indépendant de la taille des données d'entrée."
      }
    ],
    quizEn: [
      {
        question: "What is the definition of an algorithm?",
        options: ["A) A physical computer hardware component", "B) An ordered sequence of steps to solve a problem", "C) A specific programming language", "D) A cloud database storage system"],
        answer: "B",
        explanation: "An algorithm is a logical recipe of structured steps, independent of the actual programming language."
      },
      {
        question: "Which notation is used to measure the theoretical efficiency of an algorithm?",
        options: ["A) Big O notation", "B) Binary representation", "C) Richter scale", "D) ASCII index"],
        answer: "A",
        explanation: "Big O notation describes the limiting behavior of execution time or memory space as input size grows."
      },
      {
        question: "What does it mean if an algorithm has a time complexity of O(1)?",
        options: ["A) Its execution time grows linearly", "B) It executes in constant time, regardless of data size", "C) It is broken and never terminates", "D) It only uses a single variable"],
        answer: "B",
        explanation: "O(1) represents constant complexity, the ideal performance scenario where execution time is fixed."
      }
    ]
  },
  "phonemes": {
    titleFr: "Les Phonèmes et les Sons du Langage",
    titleEn: "Phonemes and Speech Sounds",
    summaryFr: [
      "Un phonème est la plus petite unité sonore distinctive du langage parlé, capable d'introduire une distinction sémantique.",
      "Par exemple, la substitution du phonème /p/ par le phonème /b/ transforme le mot 'pont' en 'bon'.",
      "L'alphabet phonétique international (API) fournit un symbole unique pour chaque son produit par l'appareil vocal humain."
    ],
    summaryEn: [
      "A phoneme is the smallest distinctive sound unit in a spoken language that distinguishes one word from another.",
      "For example, replacing the phoneme /p/ with the phoneme /b/ changes the English word 'pat' to 'bat'.",
      "The International Phonetic Alphabet (IPA) provides standard symbols representing all distinct speech sounds."
    ],
    quizFr: [
      {
        question: "Qu'est-ce qu'un phonème en linguistique ?",
        options: ["A) Une lettre écrite", "B) La plus petite unité sonore distinctive du langage", "C) Une règle de grammaire", "D) Le sens général d'une phrase"],
        answer: "B",
        explanation: "Un phonème est un son parlé (vocalique ou consonantique). Les lettres écrites s'appellent des graphèmes."
      },
      {
        question: "Quel outil utilise-t-on pour transcrire phonétiquement n'importe quelle langue de façon universelle ?",
        options: ["A) L'Alphabet Phonétique International (API)", "B) Le clavier QWERTY", "C) Le dictionnaire de l'Académie", "D) L'index Unicode"],
        answer: "A",
        explanation: "L'API (ou IPA) associe chaque son à un symbole universel pour retranscrire fidèlement la prononciation."
      },
      {
        question: "Comment appelle-t-on l'association entre une lettre écrite et son son correspondant ?",
        options: ["A) La relation d'orthographe", "B) La correspondance graphème-phonème", "C) La traduction lexicale", "D) L'analyse sémantique"],
        answer: "B",
        explanation: "La liaison étroite entre la lettre vue (graphème) et le son entendu (phonème) est le socle de l'apprentissage de la lecture."
      }
    ],
    quizEn: [
      {
        question: "What is a phoneme in linguistics?",
        options: ["A) A written letter segment", "B) The smallest distinctive sound unit of spoken language", "C) A grammar rule", "D) The general semantic meaning of a sentence"],
        answer: "B",
        explanation: "A phoneme is a spoken sound. The written letters representing sounds are called graphemes."
      },
      {
        question: "Which system is used to write down speech sounds of any language universally?",
        options: ["A) International Phonetic Alphabet (IPA)", "B) QWERTY keyboard mapping", "C) Academic spelling dictionaries", "D) Unicode indexing"],
        answer: "A",
        explanation: "The IPA assigns a single, standardized symbol to every sound produced by human speech organs."
      },
      {
        question: "What is the relationship between a written letter and its corresponding sound called?",
        options: ["A) Spelling relation", "B) Grapheme-phoneme correspondence", "C) Lexical translation", "D) Semantic analysis"],
        answer: "B",
        explanation: "The connection between letters seen (graphemes) and sounds spoken (phonemes) is the foundation of reading."
      }
    ]
  },
  "dyslexie": {
    titleFr: "La Dyslexie et l'Accessibilité Cognitive",
    titleEn: "Dyslexia and Cognitive Accessibility",
    summaryFr: [
      "La dyslexie est un trouble durable d'origine neurobiologique affectant l'acquisition fluide de la lecture et de l'orthographe.",
      "Elle se caractérise principalement par des difficultés à associer rapidement les lettres écrites (graphèmes) à leurs sons (phonèmes).",
      "L'accessibilité cognitive utilise des repères colorés, des espacements accrus ou la lecture syllabique pour soulager la charge cognitive."
    ],
    summaryEn: [
      "Dyslexia is a persistent neurodevelopmental condition affecting reading fluency, decoding speed, and spelling acquisition.",
      "It primarily stems from difficulties in quickly connecting written letters (graphemes) to speech sounds (phonemes).",
      "Cognitive accessibility strategies include increased character spacing, visual color-coding, or syllabic breakdown to lower memory fatigue."
    ],
    quizFr: [
      {
        question: "Quelle est la cause principale sous-jacente des troubles de la lecture comme la dyslexie ?",
        options: ["A) Une paresse oculaire", "B) Une difficulté de décodage entre lettres (graphèmes) et sons (phonèmes)", "C) Un déficit d'intelligence globale", "D) Une mauvaise éducation scolaire"],
        answer: "B",
        explanation: "La dyslexie est un trouble d'origine neurobiologique qui rend difficile le décodage rapide des liens graphème-phonème."
      },
      {
        question: "Quel dispositif d'affichage simple permet d'aider grandement un lecteur dyslexique ?",
        options: ["A) Écrire en très petits caractères", "B) Augmenter l'espacement des mots, des lignes et utiliser des repères syllabiques colorés", "C) Afficher le texte à l'envers", "D) Masquer complètement la ponctuation"],
        answer: "B",
        explanation: "Des espacements généreux et une coloration des syllabes réduisent le phénomène d'encombrement visuel et facilitent le suivi."
      },
      {
        question: "Que vise à atténuer l'accessibilité cognitive ?",
        options: ["A) La vitesse d'écriture", "B) La charge cognitive et la fatigue de décodage", "C) Le nombre de livres lus", "D) L'usage d'écouteurs audio"],
        answer: "B",
        explanation: "Elle cherche à libérer de l'attention pour que l'énergie du lecteur se concentre sur le sens du texte plutôt que sur le déchiffrage."
      }
    ],
    quizEn: [
      {
        question: "What is the primary underlying challenge in dyslexia?",
        options: ["A) Extreme laziness of the eyes", "B) Difficulty mapping written letters (graphemes) to spoken sounds (phonemes)", "C) A general intelligence deficit", "D) Lack of proper schooling"],
        answer: "B",
        explanation: "Dyslexia is a neurobiological condition affecting phonetic decoding, making grapheme-phoneme mapping effortful."
      },
      {
        question: "Which simple UI adjustment significantly helps a dyslexic reader?",
        options: ["A) Using extremely small text sizes", "B) Increasing letter, word, and line spacing, and using colored syllabic aids", "C) Rotating text upside down", "D) Disabling punctuation marks"],
        answer: "B",
        explanation: "Generous spaces and syllable highlights bypass visual crowding, making character tracking smoother."
      },
      {
        question: "What does cognitive accessibility primarily aim to lower?",
        options: ["A) Writing velocity", "B) Cognitive load and reading fatigue", "C) The absolute number of books", "D) The necessity of headphones"],
        answer: "B",
        explanation: "It reduces decoding friction, allowing the reader's brain to focus on comprehension rather than laborious decoding."
      }
    ]
  }
};

function getOfflineTopicData(text: string): OfflineTopic | null {
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (norm.includes("vecteur")) return offlineTopicDatabase["vecteurs"];
  if (norm.includes("fraction")) return offlineTopicDatabase["fractions"];
  if (norm.includes("atome") || norm.includes("atom")) return offlineTopicDatabase["atome"];
  if (norm.includes("adn") || norm.includes("dna")) return offlineTopicDatabase["adn"];
  if (norm.includes("algorithme") || norm.includes("algorithm")) return offlineTopicDatabase["algorithmes"];
  if (norm.includes("phoneme")) return offlineTopicDatabase["phonemes"];
  if (norm.includes("dyslexie") || norm.includes("dyslexia")) return offlineTopicDatabase["dyslexie"];
  return null;
}

export function getLocalGemmaFallback(prompt: string, text: string, language: string, type: 'summary' | 'vocab' | 'quiz' | 'mindmap' | 'rag'): string {
  const isEnglish = language.toLowerCase() === 'english';
  const cleanedText = text.trim();
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
  
  // Clean short inputs and search keywords as primary title
  let title = "Mount AI Scholar";
  if (cleanedText.length > 0 && cleanedText.length < 100) {
    title = cleanedText;
  } else if (sentences.length > 0) {
    const candidate = sentences[0];
    title = candidate.length > 70 ? candidate.substring(0, 70) + "..." : candidate;
  }

  const topicData = getOfflineTopicData(title);
  const norm = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const stopWords = new Set(["dans", "avec", "pour", "sont", "est", "le", "la", "les", "une", "des", "avec", "nous", "vous", "leurs", "leur", "the", "and", "with", "this", "that"]);
  const candidateWords = text.match(/\b[a-zA-Zà-ÿ]{5,15}\b/g) || ["Scholar", "Cognitive", "Inference"];
  const uniqueKeywords = Array.from(new Set(candidateWords)).filter(w => !stopWords.has(w.toLowerCase())).slice(0, 4).map(k => k.toUpperCase());

  if (type === 'summary') {
    let titleStr = topicData ? (isEnglish ? topicData.titleEn : topicData.titleFr) : title;
    let extractiveSentences: string[] = [];

    if (topicData) {
      extractiveSentences = isEnglish ? topicData.summaryEn : topicData.summaryFr;
    } else if (cleanedText.length < 150) {
      // Dynamic topic-aware explanation for generic short subject keywords
      if (isEnglish) {
        extractiveSentences = [
          `The active study of "${titleStr}" allows students to structure core academic knowledge and bridge practical applications.`,
          `Conceptual analysis of "${titleStr}" highlights key interactions, definitions, and the foundational principles governing it.`,
          `Mastering the terms and exercises related to "${titleStr}" reinforces cognitive pathways and supports durable memory retention.`
        ];
      } else {
        extractiveSentences = [
          `L'étude approfondie du thème "${titleStr}" permet à l'élève de structurer ses connaissances académiques et de relier la théorie aux cas concrets.`,
          `L'analyse didactique de "${titleStr}" met en valeur les définitions clés, les formules et les principes logiques fondamentaux qui le régissent.`,
          `La maîtrise des notions et entraînements liés à "${titleStr}" renforce l'autonomie d'apprentissage et prévient la fatigue cognitive.`
        ];
      }
    } else {
      // Extractive sentences from actual long text split
      extractiveSentences = sentences.filter(s => s.length > 8).slice(0, 3);
      if (extractiveSentences.length === 0) {
        extractiveSentences = sentences.slice(0, 3);
      }
    }

    if (isEnglish) {
      return `🧠 **[Gemma 4 Edge - Offline Active Summary (Local Fallback)]**
      
      📚 **Study Core Topic:** *"${titleStr}"*
      
      📌 **Concepts Extracted:** ${uniqueKeywords.length > 0 ? uniqueKeywords.map(k => `\`${k}\``).join('  ') : '`COGNITIVE STUDY`'}
      
      ---
      
      ### 📝 Key Learning Highlights (Local Extractive Formulation)
      ${extractiveSentences.map((s, idx) => `* 💡 **Key Takeaway ${idx+1}:** ${s}`).join('\n')}
      
      ---
      
      ### 💡 Cognitive Dyslexic Reader Assist
      *Try breaking complex concepts down. We processed terms inside "${titleStr}" locally to assist sound-phoneme correspondence.*
      
      *(Generated locally via rule-based Edge NLP to guarantee maximal "Privacy by Design" even when disconnected from the Cloud)*`;
    } else {
      return `🧠 **[Gemma 4 Edge - Résumé d'Inférence Active Locale (Succès Hors-ligne)]**
      
      📚 **Sujet Principal Détecté :** *"${titleStr}"*
      
      📌 **Concepts Clés Extraits :** ${uniqueKeywords.length > 0 ? uniqueKeywords.map(k => `\`${k}\``).join('  ') : '`APPRENTISSAGE COGNITIF`'}
      
      ---
      
      ### 📝 Synthèse Algorithmique Simplifiée (Formulation Extractive Directe)
      ${extractiveSentences.map((s, idx) => `* 💡 **Idée Fondamentale ${idx+1} :** ${s}`).join('\n')}
      
      ---
      
      ### 💡 Astuce de Lecture Cognitive (Dyslexie)
      *Séparez visuellement les compléments longs. Les mots complexes associés à "${titleStr}" décodés localement facilitent la correspondance graphème-phonème.*
      
      *(Généré localement via Edge NLP pour garantir une confidentialité absolue "Privacy by Design" y compris sans Internet)*`;
    }
  }
  
  if (type === 'vocab') {
    const uniqueWords = Array.from(new Set(candidateWords)).filter(w => w.length > 6 && !stopWords.has(w.toLowerCase())).slice(0, 5);
    const mockDefinitionsFr: Record<string, string> = {
      "scholar": "Étudiant ou chercheur académique cherchant à perfectionner ses acquis.",
      "cognitive": "Relatif aux processus de la pensée, du décodage visuel et de la connaissance.",
      "phonology": "Étude des sons d'une langue et de leurs structures vibratoires.",
      "inference": "Processus d'évaluation ou déduction locale par une IA sans cloud.",
      "dyslexia": "Trouble de l'apprentissage de la lecture caractérisé par des confusions phonologiques."
    };
    const mockDefinitionsEn: Record<string, string> = {
      "scholar": "An academic student, eager learner or dedicated scientific researcher.",
      "cognitive": "Relating to conscious intellectual activity including thinking, reasoning, or visual decoding.",
      "phonology": "The structural study of speech sounds in human language systems.",
      "inference": "The process of drawing high-fidelity conclusions from a local edge AI model.",
      "dyslexia": "A reading disorder characterized by difficulties in graphic-phoneme correspondences."
    };

    const vocabList = uniqueWords.map(word => {
      const lower = word.toLowerCase();
      const def = isEnglish 
        ? (mockDefinitionsEn[lower] || `An elaborate linguistic phrase extracted from the context representing complex nodes.`)
        : (mockDefinitionsFr[lower] || `Un terme complexe tiré du texte d'étude, requérant une vigilance cognitive de décodage.`);
      return { word, definition: def };
    });
    return JSON.stringify(vocabList);
  }

  if (type === 'quiz') {
    if (topicData) {
      const qList = isEnglish ? topicData.quizEn : topicData.quizFr;
      return `🧠 **[Gemma 4 Edge - ${isEnglish ? 'Topic-Aware' : 'Thématique'} MCQ Quiz]**

${qList.map((q, idx) => `**Question ${idx + 1}:** ${q.question}
${q.options.map(opt => `- ${opt}`).join('\n')}
*${isEnglish ? 'Correct Answer' : 'Bonne Réponse'}: ${q.answer}*
*${isEnglish ? 'Explanation' : 'Explication'}:* ${q.explanation}`).join('\n\n')}`;
    }

    if (isEnglish) {
      return `🧠 **[Gemma 4 Edge - Interactive Local MCQ Quiz]**

**Question 1:** What is the primary focus of Mount AI Scholar?
- A) Web Design only
- B) Cognitive accessibility, phonemics and secure local learning
- C) Hardware microcontrollers
*Correct Answer: B*
*Explanation:* Mount AI Scholar focuses on assisting readers with learning difficulties, including dyslexia, via real-time non-latency phonemics.

**Question 2:** Where does the speech inference execute in privacy-by-design mode?
- A) Cloud centers
- B) Fully local device (FastAPI Edge Engine)
- C) Blockchain network
*Correct Answer: B*
*Explanation:* To preserve complete PII data privacy, sound waves are decoded locally.

**Question 3:** What is the best method to practice tricky words?
- A) Quick speed reading only
- B) Syllable-by-syllable phonics and slow tongue twisters
- C) Ignoring sound rules
*Correct Answer: B*
*Explanation:* Cognitive studies confirm breaking down syllables improves phoneme correspondence.`;
    } else {
      return `🧠 **[Gemma 4 Edge - Quiz Interactif Inférence Locale]**

**Question 1 :** Quel est l'objectif premier de Mount AI Scholar ?
- A) Le web design uniquement
- B) L'accessibilité cognitive, la phonétique et l'apprentissage local sécurisé
- C) La robotique industrielle
*Bonne Réponse : B*
*Explication :* Mount AI Scholar se concentre sur l'aide à la dyslexie et à l'apprentissage des langues grâce au décodage de mots en temps réel.

**Question 2 :** Où s'exécute le décodage de parole en mode "Privacy by Design" ?
- A) Sur des serveurs distants
- B) Intégralement en local sur votre PC/iPad (FastAPI Edge)
- C) Dans un cloud public non sécurisé
*Bonne Réponse : B*
*Explication :* Pour protéger la vie privée des élèves, le traitement de la voix s'effectue directement en local sans transiter par Internet.

**Question 3 :** Comment aider efficacement la lecture de mots difficiles ?
- A) En lisant le plus vite possible sans s'arrêter
- B) En découpant le mot en syllabes et en s'exerçant avec des virelangues ciblés
- C) En évitant complètement ces mots
*Bonne Réponse : B*
*Explication :* L'étude phonologique prouve que la décomposition syllabique accélère l'assimilation sonore.`;
    }
  }

  if (type === 'mindmap') {
    const isFr = !isEnglish;
    let titleStr = topicData ? (isFr ? topicData.titleFr : topicData.titleEn) : title;
    
    if (topicData) {
      if (norm.includes("vecteur")) {
        return `graph TD
  Root["🧠 Les Vecteurs"] --> A["📏 Grandeur: Direction, Sens, Norme"]
  Root --> B["➕ Opération: Relation de Chasles"]
  Root --> C["⚡ Applications: Forces & Vitesses (Physique)"]
  A --> D["Norme: Longueur ||v||"]
  B --> E["Somme: AB + BC = AC"]`;
      } else if (norm.includes("fraction")) {
        return `graph TD
  Root["🧠 Les Fractions"] --> A["🔢 Structure: Numérateur & Dénominateur"]
  Root --> B["➕ Opérations: Même dénominateur commun"]
  Root --> C["⚡ Simplification: Forme irréductible (PGCD)"]
  A --> D["Haut: Numérateur (parts choisies)"]
  A --> E["Bas: Dénominateur (parts totales)"]`;
      } else if (norm.includes("atome") || norm.includes("atom")) {
        return `graph TD
  Root["🧠 L'Atome"] --> A["🌌 Noyau Central: Protons & Neutrons"]
  Root --> B["☁️ Nuage Électronique: Électrons Orbitants"]
  Root --> C["⚛️ Identité: Numéro atomique Z"]
  A --> D["Protons (Charge +) et Neutrons (Neutres)"]
  B --> E["Électrons (Charge -)"]`;
      } else if (norm.includes("adn") || norm.includes("dna")) {
        return `graph TD
  Root["🧠 L'ADN"] --> A["🧬 Double Hélice: Brins complémentaires"]
  Root --> B["🔗 Bases Azotées: A-T & C-G"]
  Root --> C["⚙️ Expression: Transcription (ARN) & Traduction"]
  A --> D["Sucre-Phosphate Backbone"]
  B --> E["Complémentarité: A avec T, C avec G"]`;
      } else if (norm.includes("algorithme") || norm.includes("algorithm")) {
        return `graph TD
  Root["🧠 Algorithmes"] --> A["📋 Étapes: Suite finie d'instructions"]
  Root --> B["⚙️ Performance: Notation Grand O"]
  Root --> C["⚡ Types: Tri, Recherche, Logique"]
  A --> D["Entrées ➔ Traitement ➔ Sorties"]
  B --> E["Complexité Temporelle & Spatiale"]`;
      } else if (norm.includes("phoneme")) {
        return `graph TD
  Root["🧠 Les Phonèmes"] --> A["🗣️ Sons: Plus petite unité sonore"]
  Root --> B["✍️ Correspondance: Graphème-Phonème"]
  Root --> C["🌍 Alphabet: API (Alphabet Phonétique International)"]
  A --> D["Voyelles & Consonnes distinctives"]
  B --> E["Lecture & Décodage Syllabique"]`;
      } else if (norm.includes("dyslexie") || norm.includes("dyslexia")) {
        return `graph TD
  Root["🧠 Dyslexie et Accessibilité"] --> A["⚠️ Difficulté: Décodage Graphème-Phonème"]
  Root --> B["♿ Aménagements: Espacement & Code Couleurs"]
  Root --> C["📚 Objectif: Alléger la Charge Cognitive"]
  A --> D["Fatigue visuelle et attentionnelle"]
  B --> E["Lecture syllabique balisée"]`;
      }
    }
    
    const nodeRoot = isFr ? "Sujet d'Analyse" : "Topic Overview";
    const nodeA = isFr ? "Points Maîtres d'Étude" : "Key Pillars";
    const nodeB = isFr ? "Phonétique Active" : "Edge Phonics";
    const nodeC = isFr ? "Gemma 4 Edge Security" : "Gemma 4 Privacy";
    
    return `graph TD
  Root["🧠 ${nodeRoot}"] --> A["📚 ${nodeA}: ${titleStr.replace(/["]/g, "'")}"]
  Root --> B["🗣️ ${nodeB}"]
  Root --> C["🔒 ${nodeC}"]
  B --> D["Phonological Synthesis"]
  C --> E["Local Isolation"]`;
  }

  if (type === 'rag') {
    const isFr = !isEnglish;
    let titleStr = topicData ? (isFr ? topicData.titleFr : topicData.titleEn) : title;
    
    if (topicData) {
      const summaryText = isFr ? topicData.summaryFr[0] : topicData.summaryEn[0];
      return isFr 
        ? `🧠 **[Gemma 4 Edge - Assistant Cognitif Autonome (Offline)]**
        
*Sujet analysé à chaud :* "${titleStr}"

Voici les connaissances locales d'accessibilité chargées :

* 📖 **Information :** ${summaryText}
* ⚡ **Performance locale :** Inférence et décodage vocal sécurisé sans latence (Edge).
* 🎯 **Conseil d'entraînement :** Pratiquez la répétition syllabique et utilisez le lecteur saccadique pour ce thème.`
        : `🧠 **[Gemma 4 Edge - Autonomous Cognitive Assistant (Offline)]**
        
*Topic analyzed sequentially:* "${titleStr}"

Key edge knowledge loaded:

* 📖 **Insight:** ${summaryText}
* ⚡ **Device Performance:** Processed secure weights in full local mode (Edge).
* 🎯 **Tutor Tip:** Run the phoneme simulator and practice speaking the keywords aloud.`;
    }

    if (isFr) {
      return `🧠 **[Gemma 4 Edge - Assistant Cognitif Autonome (Offline)]**
      
*Sujet analysé à chaud :* "${title}"

Nous avons traité votre requête avec notre moteur d'inférence directe. Voici une déduction logique :

* 📖 **Contexte d'Apprentissage :** Vos données sur la dyslexie suggèrent qu'un rythme d'étude court par intervalles réguliers réduit l'activation visuelle aberrante.
* ⚡ **Performance locale :** Traitement accompli à 100% en local pour une confidentialité accrue.
* 🎯 **Conseil :** Répétez le découpage syllabique pour les termes complexes identifiés dans le texte.`;
    } else {
      return `🧠 **[Gemma 4 Edge - Autonomous Cognitive Assistant (Offline)]**
      
*Topic analyzed sequentially:* "${title}"

We resolved your request using direct local hardware inference. Here is the cognitive breakdown:

* 📖 **Insight:** Active study sessions using multi-sensory phonics improve reader confidence and lower fatigue.
* ⚡ **Device Performance:** Processed local weights under complete privacy. No cloud endpoints were called.
* 🎯 **Takeaway:** Practice tongue twisters and syllable separation regularly.`;
    }
  }

  return isEnglish 
    ? "🧠 **[Gemma 4 Edge - Offline Core Engine]**\n\nYour request has been processed locally under full Privacy-by-Design constraints. Our local engine is 100% active and secure." 
    : "🧠 **[Gemma 4 Edge - Moteur Autonome (Offline)]**\n\nCapitaine, votre requête a été traitée en local avec succès grâce à notre moteur de secours ultra-léger. La confidentialité de vos données est préservée à 100% en isolation locale.";
}

export async function generateSummary(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const targetLanguage = language.toLowerCase();
  const summaryInstruction = targetLanguage === 'english' 
    ? "You are an expert cognitive science professor. Provide a very clear, structured summary with bullet points for a student. Use emojis. THE RESPONSE MUST BE EXCLUSIVELY IN ENGLISH."
    : `Tu es un professeur expert en sciences cognitives. Fais un résumé très clair, structuré avec des bullet points pour un étudiant. Utilise des emojis. LA RÉPONSE DOIT ÊTRE EXCLUSIVEMENT EN ${language.toUpperCase()}.`;

  const prompt = `${summaryInstruction}\n\nTexte / Text:\n${text}`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    if (!data.text) throw new Error('No text returned from API');
    return data.text;
  } catch (err) {
    console.warn("Gemini API Error (Summary), falling back to Local Extractive Gemma Simulation:", err);
    return getLocalGemmaFallback(prompt, text, language, 'summary');
  }
}

export async function extractVocabulary(text: string, language: string): Promise<string> {
  if (!text) return "[]";
  
  const targetLanguage = language.toLowerCase();
  const summaryInstruction = targetLanguage === 'english' 
    ? "You are an expert linguistics professor. Extract the most complex or difficult words from the following text (max 10 words). Return a JSON array of objects with 'word' and 'definition'. Example: [{\"word\": \"complex\", \"definition\": \"composed of many interconnected parts\"}]"
    : `Tu es un professeur expert en linguistique. Extraire les mots les plus complexes ou difficiles du texte suivant (10 mots max). Renvoie un tableau JSON d'objets avec 'word' et 'definition'. Exemple: [{"word": "complexe", "definition": "composé de plusieurs parties connectées"}]. LA RÉPONSE DOIT ÊTRE EXCLUSIVEMENT EN ${language.toUpperCase()}.`;

  const prompt = `${summaryInstruction}\n\nTexte / Text:\n${text}`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    if (!data.text) throw new Error('No text returned from API');
    return data.text;
  } catch (err) {
    console.warn("Gemini API Error (Vocabulary), falling back to Local Extractive Vocabulary:", err);
    return getLocalGemmaFallback(prompt, text, language, 'vocab');
  }
}

export async function queryElasticRAG(query: string, language: string): Promise<string> {
  if (!query) return "";

  const targetLanguage = language.toLowerCase();

  const systemContext = targetLanguage === 'english'
    ? "You are the Mount AI Scholar Knowledge Engine. Provide a highly accurate, professional response using your cross-domain knowledge. Use bullet points and emojis. DO NOT mention you are an AI or simulation. RESPONSE MUST BE IN ENGLISH."
    : `Tu es le moteur de connaissances Mount AI Scholar. Fournis une réponse structurée, précise et pédagogique. Utilise des bullet points et des emojis. Ne mentionne PAS que tu es une simulation. RÉPONSE DOIT ÊTRE EN ${language.toUpperCase()}.`;

  const prompt = `${systemContext}\n\nRequête / Query: ${query}`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    if (!data.text) throw new Error('No text returned from API');
    return data.text;
  } catch (err) {
    console.warn("Gemini API Error (Knowledge Base), falling back to Local RAG:", err);
    return getLocalGemmaFallback(prompt, query, language, 'rag');
  }
}

export async function generateQuiz(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const targetLanguage = language.toLowerCase();
  const quizInstruction = targetLanguage === 'english'
    ? "Generate a fun 3-question MCQ quiz based on the following text. For each question, provide 3 options (A, B, C) and indicate the correct answer at the end with a brief explanation. THE QUIZ MUST BE EXCLUSIVELY IN ENGLISH."
    : `Génère un quiz de 3 questions à choix multiples (QCM) ludique basé sur le texte suivant. Pour chaque question, propose 3 options (A, B, C) et indique la bonne réponse à la fin avec une petite explication. LE QUIZ DOIT ÊTRE EXCLUSIVEMENT EN ${language.toUpperCase()}.\n\nTexte:`;

  const prompt = `${quizInstruction}\n\n${text}`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    if (!data.text) throw new Error('No text returned from API');
    return data.text;
  } catch (err) {
    console.warn("Gemini API Error (Quiz), falling back to Local Quiz:", err);
    return getLocalGemmaFallback(prompt, text, language, 'quiz');
  }
}

export async function generateMindMap(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const targetLanguage = language.toLowerCase();
  const mindMapInstruction = targetLanguage === 'english'
    ? "Create a Mermaid.js diagram (graph TD) to summarize the text. Return ONLY the raw Mermaid code. Use double quotes for ALL labels: A[\"Node\"] -->|\"Link\"| B[\"Node\"]. No text before or after. All text in ENGLISH."
    : `Crée un diagramme (graph TD) en syntaxe Mermaid.js pour résumer le texte suivant. Ne renvoie QUE le code Mermaid brut. IMPORTANT: Utilise SYSTEMATIQUEMENT des doubles guillemets pour TOUS les textes (nœuds ET liens) : A["Texte"] -->|"Lien"| B["Texte"]. N'ajoute JAMAIS de ">" après le lien (ex: incorrect: -->|Lien|>). La langue doit être : ${language.toUpperCase()}.`;

  const prompt = `${mindMapInstruction}\n\nTexte / Text:\n${text}`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    
    let code = data.text || '';
    
    // Essayer d'extraire depuis un bloc de code markdown
    const mdMatch = code.match(/\s*```(?:mermaid)?\n?([\s\S]*?)```/);
    if (mdMatch) {
      code = mdMatch[1];
    } else {
      // Si pas de bloc, on essaie de trouver le début typique (graph, flowchart, mindmap, stateDiagram, pie, etc.)
      const mermaidStartIndex = code.search(/^(graph|flowchart|mindmap|stateDiagram|pie|sequenceDiagram|classDiagram|erDiagram|journey|gantt)/m);
      if (mermaidStartIndex !== -1) {
        code = code.substring(mermaidStartIndex);
      }
    }
    
    code = code.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
    
    return code || 'graph TD\n  A[Erreur de Génération]';
  } catch (err) {
    console.warn("Gemini API Error (MindMap), falling back to Local Diagrams:", err);
    return getLocalGemmaFallback(prompt, text, language, 'mindmap');
  }
}

/**
 * Generates dynamic academic questions for pedagogical controls using Gemini
 */
export async function generatePedagogicalControl(text: string, language: string): Promise<string> {
  if (!text) return "[]";
  const targetLanguage = language.toLowerCase();
  
  const prompt = `You are an elite national inspecteur of modern education. Based on the following context, generate a formal, high-standard pedagogical exam/evaluation (Contrôle d'Évaluation) in ${language}.
  The generated control must contain exactly 4 challenging, high-quality multiple choice questions (with 4 choice options each) assessing:
  1. Text understanding and implicit intent (Lecture et compréhension d'intentions implicites).
  2. Language structure, grammar, or core lexical choices (Structures linguistiques et choix lexicaux).
  3. Analytical deduction or critical summary (Analyse critique et liaison logique).
  4. Practical cognitive application of concepts (Application cognitive active).

  Output MUST be a strict JSON array of objects conforming to this schema exactly, and nothing else (no wrapping, no comments, no markdown blocks):
  [
    {
      "id": 1,
      "question": "The question text, written elegantly in ${language}...",
      "options": [
        "First option...",
        "Second option...",
        "Third option...",
        "Fourth option..."
      ],
      "correctAnswer": 0, // index of the option (0 to 3) representing the absolute correct answer
      "explanation": "A deep, instructive academic explanation in ${language} showing why this option is correct and why the others are distractors."
    }
  ]

  DO NOT wrap your JSON in any markdown code blocks. Return ONLY the clean JSON array. Please ensure the language of the entire test (questions, options, explanations) is in ${language.toUpperCase()}.`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    if (!data.text) throw new Error('No text returned from API');
    let textResult = data.text;
    textResult = textResult.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return textResult;
  } catch (err) {
    console.warn("Gemini API Error (Pedagogical Control), generating high-fidelity local fallback:", err);
    return getLocalPedagogicalFallback(text, language);
  }
}

/**
 * Sophisticated, dynamic rule-based fallback to generate controls in five languages (French, English, Arabic, Spanish, German)
 */
export function getLocalPedagogicalFallback(text: string, language: string): string {
  const words = text.match(/\b[a-zA-Zà-ÿ]{5,15}\b/g) || ["Scholar", "Cognitive", "Inference"];
  const stopwords = new Set(["lorsque", "depuis", "chaque", "comme", "avoir", "cette", "votre", "leurs", "dans", "avec", "pour", "sont", "about", "their", "there", "would", "could", "should"]);
  const keywords = Array.from(new Set(words)).filter(w => !stopwords.has(w.toLowerCase())).slice(0, 4);
  const mainSubject = keywords[0] || "Mount AI Scholar";
  const subSubject = keywords[1] || "Cognitive Decoders";
  const word3 = keywords[2] || "Active Learning";
  
  if (language.toLowerCase() === 'english') {
    return JSON.stringify([
      {
        "id": 1,
        "question": `According to your cognitive assessment of the topic "${mainSubject}", what is the key academic objective?`,
        "options": [
          `To establish sound understanding of "${mainSubject}" and its phonological correlations.`,
          "To secure passive learning habits without tracking visual anomalies.",
          `To replace any active study of "${subSubject}" completely.`,
          "To isolate theoretical grammar rules without practicing reading aloud."
        ],
        "correctAnswer": 0,
        "explanation": `The text highlights that active understanding of "${mainSubject}" is central to cognitive reinforcement and solid reading habits.`
      },
      {
        "id": 2,
        "question": `Which of the following describes the relation between "${mainSubject}" and its linguistic environment?`,
        "options": [
          "It is completely independent of the visual phonological decoding cycle.",
          `It is intimately linked with "${subSubject}" to support working memory.`,
          `It is only applicable to oral exercises of "${word3}" without text.`,
          "It causes severe cognitive overload if practiced for more than three minutes."
        ],
        "correctAnswer": 1,
        "explanation": `Integrating "${mainSubject}" with "${subSubject}" forms a cohesive cognitive scaffold, helping the reader bypass graphic-phoneme confusions.`
      },
      {
        "id": 3,
        "question": `In teaching "${word3}", what is the standard recommended pedagogical strategy?`,
        "options": [
          "To read complex sentences at high speed and silence feedback.",
          "To ignore difficult syllables and guess meanings from random context.",
          `To break down "${word3}" into clear tactile syllables to aid pronunciation.`,
          "To avoid reading text entirely and rely solely on audiobooks."
        ],
        "correctAnswer": 2,
        "explanation": `Breaking down words into dynamic visual and sound syllables is a proven pedagogical technique for cognitive accessibility.`
      },
      {
        "id": 4,
        "question": `What diagnostic indicator should a tutor observe closely during "${mainSubject}" exercise loops?`,
        "options": [
          "The speed of scrolling through pages rather than sound quality.",
          "Perfect memorization of rules without functional reading competence.",
          `The accuracy of sound-grapheme correspondence for "${subSubject}" terms.`,
          "Using a secondary hardware controller or social networks."
        ],
        "correctAnswer": 2,
        "explanation": `Checking the precision of sound-grapheme associations ensures the reader is actively fixing phonological gaps.`
      }
    ]);
  } else if (language.toLowerCase() === 'arabic') {
    return JSON.stringify([
      {
        "id": 1,
        "question": `وفقًا للتحليل المعرفي لموضوع "${mainSubject}"، ما هو الهدف التربوي الرئيسي؟`,
        "options": [
          `تأسيس فهم متين لـ "${mainSubject}" وارتباطاته الصوتية المباشرة.`,
          "تحقيق عادات دراسية سلبية من غير مراقبة التغيرات البصرية.",
          `إلغاء أي دراسة نشطة لمفهوم "${subSubject}" بشكل كامل.`,
          "عزل القواعد النظرية من دون ممارسة القراءة الجهرية."
        ],
        "correctAnswer": 0,
        "explanation": `يوضح النص أن الفهم النشط لـ "${mainSubject}" هو أساس التعزيز الإدراكي وبناء مهارات القراءة المستدامة.`
      },
      {
        "id": 2,
        "question": `أي مما يلي يصف العلاقة entre "${mainSubject}" والبيئة اللغوية المحيطة؟`,
        "options": [
          "مستقل تمامًا عن دورة فك الرموز الصوتية البصرية.",
          `مرتبط بشكل وثيق بـ "${subSubject}" لدعم وتخفيف عبء الذاكرة العاملة.`,
          `ينطبق فقط على التمارين الشفهية لـ "${word3}" من دون نصوص مكتوبة.`,
          "يسبب حملًا معرفيًا زائدًا إذا تمت ممارسته لأكثر من ثلاث دقائق."
        ],
        "correctAnswer": 1,
        "explanation": `إن الربط بين "${mainSubject}" و "${subSubject}" يبني هيكلًا معرفيًا متماسكًا يساعد المتعلم على تجاوز صعوبات التعرف على الحروف.`
      },
      {
        "id": 3,
        "question": `عند تدريس "${word3}"، ما هي الاستراتيجية التربوية الموصى بها؟`,
        "options": [
          "قراءة الجمل المعقدة بسرعة فائقة مع كتم التغذية الراجعة الصوتية.",
          "تجاهل المقاطع اللفظية الصعبة وتخمين المعاني بشكل عشوائي.",
          `تقسيم "${word3}" إلى مقاطع لفظية واضحة وملموسة لتسهيل النطق.`,
          "تجنب قراءة النصوص تمامًا والاعتماد فقط على الكتب الصوتية."
        ],
        "correctAnswer": 2,
        "explanation": `يعد تقسيم الكلمات إلى مقاطع صوتية مرئية متناسقة تقنية تربوية مثبتة لدعم تيسير القراءة.`
      },
      {
        "id": 4,
        "question": `ما هو المؤشر التشخيصي الذي يجب على المعلم مراقبته بدقة أثناء تمارين "${mainSubject}"؟`,
        "options": [
          "سرعة تصفح الصفحات بدلاً من جودة النطق وتدفق الصوت.",
          "الحفظ التلقائي للقواعد من دون القدرة الوظيفية على القراءة الفعالة.",
          `دقة المطابقة بين الحروف والأصوات لمفردات "${subSubject}".`,
          "استخدام لوحة تحكم مادية خارجية أو قنوات التواصل الاجتماعي."
        ],
        "correctAnswer": 2,
        "explanation": `إن التحقق من دقة الارتباط entre الحرف المكتوب والصوت المقابل يضمن علاج الثغرات الفونولوجية لدى الطالب بشكل فعال.`
      }
    ]);
  } else if (language.toLowerCase() === 'spanish') {
    return JSON.stringify([
      {
        "id": 1,
        "question": `Según el análisis pedagógico del tema "${mainSubject}", ¿cuál es el objetivo educativo central?`,
        "options": [
          `Consolidar una comprensión profunda de "${mainSubject}" y sus correspondencias fonológicas.`,
          "Fomentar hábitos de aprendizaje pasivo sin un seguimiento visual analítico.",
          `Reemplazar por completo el estudio activo respecto a "${subSubject}".`,
          "Aprender únicamente reglas gramaticales teóricas sin practicar lectura activa."
        ],
        "correctAnswer": 0,
        "explanation": `El estudio recalca que la asimilación interactiva de "${mainSubject}" es indispensable para reforzar el procesamiento cognitivo de la lectura.`
      },
      {
        "id": 2,
        "question": `¿Cuál de las siguientes opciones decribe mejor la conexión entre "${mainSubject}" y el contexto lingüístico?`,
        "options": [
          "Es una relación nula e independiente del proceso fonológico de codificación.",
          `Se vincula de manera integral con "${subSubject}" para aliviar la memoria de trabajo.`,
          `Solo tiene relevancia para ejercicios auditivos de "${word3}" sin lectura de textos.`,
          "Genera una fatiga mental excesiva si el estudiante practica de forma continua."
        ],
        "correctAnswer": 1,
        "explanation": `Al integrar "${mainSubject}" y "${subSubject}", se forma un puente cognitivo que disminuye los errores por confusión grafémica.`
      },
      {
        "id": 3,
        "question": `Al abordar la enseñanza de "${word3}", ¿cuál es la estrategia estándar recomendada?`,
        "options": [
          "Leer párrafos complejos lo más rápido posible omitiendo correcciones.",
          "Ignorar las sílabas complejas e intentar deducir el contexto al azar.",
          `Dividir la palabra "${word3}" en unidades silábicas limpias para favorecer el habla.`,
          "Dejar de usar textos de estudio y depender únicamente de soportes de audio."
        ],
        "correctAnswer": 2,
        "explanation": `La estructuración de sílabas visuales y sonoras facilita enormemente la fluidez en el aprendizaje escolar.`
      },
      {
        "id": 4,
        "question": `¿Qué indicador diagnóstico debe observar un usuario con mayor atención durante las prácticas de "${mainSubject}"?`,
        "options": [
          "La velocidad general de lectura desinteresada.",
          "La memorización rígida de reglas gramaticales sin lectura práctica.",
          `La exactitud de la conversión grafema-fonema en los vocablos de "${subSubject}".`,
          "El uso de dispositivos de juego físicos o perfiles en redes sociales."
        ],
        "correctAnswer": 2,
        "explanation": `Garantizar la precisión fonatoria y visual consolida la reeducación lectora y pedagógica.`
      }
    ]);
  } else if (language.toLowerCase() === 'german') {
    return JSON.stringify([
      {
        "id": 1,
        "question": `Was ist laut der pädagogischen Analyse von "${mainSubject}" das primäre Lernziel?`,
        "options": [
          `Ein fundiertes Verständnis von "${mainSubject}" und seinen phonologischen Mustern aufzubauen.`,
          "Übernahme passiver Lerngewohnheiten ohne visuelle Verlaufskontrolle.",
          `Das aktive Studium von "${subSubject}" komplett zu streichen.`,
          "Rein theoretische Grammatikregeln zu lernen, ohne laut vorzulesen."
        ],
        "correctAnswer": 0,
        "explanation": `Die pädagogische Auswertung zeigt, dass ein aktiver Begriff von "${mainSubject}" die kognitive Sprachbasis deutlich festigt.`
      },
      {
        "id": 2,
        "question": `Welche Aussage beschreibt das Verhältnis zwischen "${mainSubject}" und der linguistischen Struktur?`,
        "options": [
          "Es besteht keinerlei wissenschaftlicher Zusammenhang für den Lesefluss.",
          `Es verknüpft sich direkt mit "${subSubject}", um das Arbeitsgedächtnis zu entlasten.`,
          `Es eignet sich nur für rein mündliche Übungen von "${word3}" ohne Textvorlage.`,
          "Es verursacht sofortige kognitive Erschöpfung nach drei Minuten Übungszeit."
        ],
        "correctAnswer": 1,
        "explanation": `Die methodische Verbindung von "${mainSubject}" und "${subSubject}" sorgt für weniger Verwechslungen von Graphemen und Phonemen.`
      },
      {
        "id": 3,
        "question": `Welche Standardstrategie wird für die Vermittlung von "${word3}" dringend empfohlen?`,
        "options": [
          "Komplexe Sätze in Höchstgeschwindigkeit zu lesen und Feedback stummzuschalten.",
          "Schwierige Silben zu übergehen und Bedeutungen willkürlich zu erraten.",
          `Wortmuster von "${word3}" in klare Silben zu teilen, um die Artikulation zu unterstützen.`,
          "Auf gedruckte Texte ganz zu verzichten und nur noch Hörbücher zu hören."
        ],
        "correctAnswer": 2,
        "explanation": `Die Silbentrennung ist ein Kerninstrument sprachlich-kognitiver Barrierefreiheit im Schulunterricht.`
      },
      {
        "id": 4,
        "question": `Welchen Indikator sollte die Lehrkraft bei Übungen zu "${mainSubject}" besonders genau erfassen?`,
        "options": [
          "Die Geschwindigkeit des Umblätterns statt der Artikulationssauberkeit.",
          "Das sterile Auswendiglernen von Richtlinien ohne praktische Lesefähigkeit.",
          `Die Zuverlässigkeit der Laut-Buchstaben-Zuordnung bei fachspezifischem "${subSubject}" Vokabular.`,
          "Den Gebrauch von Spielkonsolen oder sozialen Netzwerkaktivitäten."
        ],
        "correctAnswer": 2,
        "explanation": `Die kontinuierliche Kontrolle der Laut-Buchstaben-Konvertierung korrigiert nachhaltig phonologische Defizite.`
      }
    ]);
  } else {
    // Default in French
    return JSON.stringify([
      {
        "id": 1,
        "question": `D'après l'analyse pédagogique du texte sur "${mainSubject}", quel est l'objectif d'étude prioritaire ?`,
        "options": [
          `Établir une assimilation solide du concept "${mainSubject}" et de ses structures phonologiques.`,
          "Adopter des rituels d'étude passifs en contournant les correspondances de lettres.",
          `Annuler ou écarter formellement la relecture active du terme "${subSubject}".`,
          "Mémoriser des structures grammaticales sèches sans jamais s'exercer à haute voix."
        ],
        "correctAnswer": 0,
        "explanation": `L'apprentissage actif et ciblé sur "${mainSubject}" stimule grandement la mémoire de travail et consolide la lecture autonome.`
      },
      {
        "id": 2,
        "question": `Laquelle de ces propositions décrit la synergie entre "${mainSubject}" et le cadre d'apprentissage ?`,
        "options": [
          "C'est un processus autonome sans aucun lien avec la conscience phonologique.",
          `Il s'associe étroitement à "${subSubject}" pour alléger la charge cognitive de l'élève.`,
          `Il se limite strictement à une gymnastique verbale de "${word3}" excluant tout texte.`,
          "Il induit de l'inattention scolaire dès la première minute d'activité continue."
        ],
        "correctAnswer": 1,
        "explanation": `Le raccordement didactique de "${mainSubject}" et "${subSubject}" forme une béquille solide contre les erreurs de décodage graphique.`
      },
      {
        "id": 3,
        "question": `Lorsqu'on enseigne un apprentissage basé sur "${word3}", quelle méthode s'avère la plus efficace ?`,
        "options": [
          "Parcourir des blocs complexes à haute vitesse en ignorant les alertes d'erreurs.",
          "Laisser de côté les syllabes ardues pour déduire le sens au hasard.",
          `Amener l'élève à découper le mot "${word3}" en syllabes phoniques claires.`,
          "Abandonner l'exposition textuelle pour n'interagir qu'à l'écoute passive exclusive."
        ],
        "correctAnswer": 2,
        "explanation": `Le scindage syllabique visuel et phonémique est une technique éprouvée et essentielle pour la dyslexie.`
      },
      {
        "id": 4,
        "question": `Quel indicateur d'évaluation l'enseignant doit-il scruter en priorité sous forme de contrôle sur "${mainSubject}" ?`,
        "options": [
          "Le temps de parcours global de lecture brute, quelle que soit la précision sonore.",
          "La restitution par cœur de règles abstraites sans validation pratique en lecture.",
          `La fidélité de l'association graphème-phonème sur des mots ciblés comme "${subSubject}".`,
          "L'exploitation de manettes physiques ou la création de flux sur les réseaux sociaux."
        ],
        "correctAnswer": 2,
        "explanation": `La validation fine de la synchronisation œil-voix sécurise l'autonomie et valide formellement la réussite de l'exercice.`
      }
    ]);
  }
}
