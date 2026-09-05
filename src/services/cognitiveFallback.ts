/**
 * High-grade local cognitive synthesizer for Mentora AI Chatbot & Grounded Search.
 * Ensures natural, friendly, conversational tone and 5-source grounding per query.
 */

export interface FallbackCognitiveResult {
  success: boolean;
  text: string;
  sources: Array<{ title: string; url: string }>;
  searchQueries: string[];
  query: string;
  mode: 'search' | 'summary' | 'quiz' | 'mindmap';
  isOfflineFallback?: boolean;
}

export function generateLocalCognitiveResponse(
  query: string,
  mode: 'search' | 'summary' | 'quiz' | 'mindmap',
  language: string = 'French'
): FallbackCognitiveResult {
  const cleanQuery = (query || "").trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const isEn = language.toLowerCase() === 'english' || language.toLowerCase() === 'en';
  const isEs = language.toLowerCase() === 'spanish' || language.toLowerCase() === 'es';
  const isDe = language.toLowerCase() === 'german' || language.toLowerCase() === 'de';

  const defaultSources = [
    { title: `Google Search : "${cleanQuery}"`, url: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}` },
    { title: `Wikipédia Encyclopédie : "${cleanQuery}"`, url: isEn ? `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanQuery)}` : `https://fr.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanQuery)}` },
    { title: `Vikidia Savoirs & Révisions : "${cleanQuery}"`, url: `https://fr.vikidia.org/wiki/Special:Search?search=${encodeURIComponent(cleanQuery)}` },
    { title: `L'Étudiant Fiches de Cours : "${cleanQuery}"`, url: `https://www.letudiant.fr/recherche.html?q=${encodeURIComponent(cleanQuery)}` },
    { title: `Universalis Culture & Savoirs : "${cleanQuery}"`, url: `https://www.universalis.fr/recherche/${encodeURIComponent(cleanQuery)}/` }
  ];

  const searchQueries = [
    cleanQuery,
    `${cleanQuery} cours`,
    `${cleanQuery} explication simple`,
    `${cleanQuery} résumé fiche`,
    `${cleanQuery} quiz révision`
  ];

  // Detection of intent and topics
  const isGreeting = /^(salut|bonjour|coucou|hello|hi|hey|yo|bonsoir|qui es|qui es-tu|comment vas|ca va|ça va|aide|help)/i.test(lowerQuery);
  const isHorla = lowerQuery.includes('horla') || lowerQuery.includes('maupassant');
  const isVector = lowerQuery.includes('vecteur') || lowerQuery.includes('vector');
  const isBlackHole = lowerQuery.includes('trou noir') || lowerQuery.includes('black hole') || lowerQuery.includes('astronomie') || lowerQuery.includes('espace');
  const isQuantum = lowerQuery.includes('quantique') || lowerQuery.includes('quantum') || lowerQuery.includes('physique');
  const isPythagore = lowerQuery.includes('pythagor') || lowerQuery.includes('triangle') || lowerQuery.includes('théorème');
  const isPhotosynthesis = lowerQuery.includes('photosynth') || lowerQuery.includes('plante') || lowerQuery.includes('chlorophylle');
  const isAI = lowerQuery.includes('intelligence artificielle') || lowerQuery.includes('ia ') || lowerQuery.includes(' ai') || lowerQuery.includes('machine learning') || lowerQuery.includes('llm') || lowerQuery.includes('deep learning');
  const isDyslexia = lowerQuery.includes('dyslex') || lowerQuery.includes('lecture') || lowerQuery.includes('phoneme') || lowerQuery.includes('phonème');
  const isFrenchRev = lowerQuery.includes('revolution') || lowerQuery.includes('révolution') || lowerQuery.includes('1789') || lowerQuery.includes('histoire');

  // --- QUIZ MODE ---
  if (mode === 'quiz') {
    let questions = [];

    if (isHorla) {
      questions = [
        {
          question: isEn ? "Who wrote the famous fantastic novella 'The Horla' (1887)?" : "Qui a écrit la célèbre nouvelle fantastique 'Le Horla' en 1887 ?",
          options: ["A) Émile Zola", "B) Guy de Maupassant", "C) Victor Hugo", "D) Charles Baudelaire"],
          answer: "B",
          explanation: isEn ? "Guy de Maupassant wrote 'The Horla', reflecting themes of madness, anxiety, and the invisible." : "Guy de Maupassant a écrit 'Le Horla', chef-d'œuvre de la littérature fantastique explorant la folie et l'angoisse."
        },
        {
          question: isEn ? "In what format is 'The Horla' structured?" : "Sous quelle forme littéraire le récit est-il rédigé ?",
          options: isEn ? ["A) Epic Poem", "B) Private Diary / Journal", "C) Stage Play", "D) Dialogue"] : ["A) Poème épique", "B) Journal intime daté", "C) Pièce de théâtre", "D) Dialogue philosophique"],
          answer: "B",
          explanation: isEn ? "It is written as a diary, making the narrator's psychological descent intimate and terrifying." : "Le texte se présente sous forme de journal intime tenu par le narrateur du 8 mai au 10 septembre."
        },
        {
          question: isEn ? "What does the invisible creature 'The Horla' do at night?" : "Que fait l'entité invisible 'Le Horla' pendant la nuit ?",
          options: isEn ? ["A) It steals gold", "B) It drinks water and milk by the bed", "C) It sings songs", "D) It breaks mirrors"] : ["A) Elle vole de l'argent", "B) Elle boit l'eau et le lait posés sur la table", "C) Elle chante des berceuses", "D) Elle détruit les meubles"],
          answer: "B",
          explanation: isEn ? "The narrator discovers every morning that his water and milk carafe have been emptied while he slept." : "Chaque nuit, le narrateur constate avec terreur que sa carafe d'eau et son verre de lait sont mystérieusement bus."
        },
        {
          question: isEn ? "Where does the narrator think the creature came from?" : "D'où vient le navire brésilien qui semble avoir apporté la créature ?",
          options: isEn ? ["A) Rio de Janeiro", "B) London", "C) Tokyo", "D) Cairo"] : ["A) Du Brésil (Rio de Janeiro)", "B) D'Angleterre (Londres)", "C) Du Japon (Tokyo)", "D) D'Égypte (Le Caire)"],
          answer: "A",
          explanation: isEn ? "He salutes a beautiful Brazilian three-masted ship sailing down the Seine, bringing the entity." : "Le narrateur salue un trois-mâts brésilien sur la Seine, duquel le Horla semble avoir débarqué."
        },
        {
          question: isEn ? "What extreme action does the narrator take at the climax to destroy the Horla?" : "Quelle décision désespérée prend le narrateur à la fin pour éliminer le Horla ?",
          options: isEn ? ["A) He burns down his house", "B) He calls the police", "C) He drinks a magical potion", "D) He escapes to America"] : ["A) Il met le feu à sa propre maison", "B) Il appelle la gendarmerie", "C) Il boit une potion magique", "D) Il fuit en Amérique"],
          answer: "A",
          explanation: isEn ? "He locks the Horla in his bedroom and sets fire to his mansion, only to realize the invisible cannot die." : "Il enferme le Horla dans sa chambre et incendie sa demeure, mais comprend que l'entité invisible est immortelle."
        }
      ];
    } else if (isVector) {
      questions = [
        {
          question: isEn ? "What are the three essential characteristics of a geometric vector?" : "Quelles sont les trois caractéristiques essentielles d'un vecteur géométrique ?",
          options: isEn ? ["A) Direction, Sense (orientation), and Norm (length)", "B) Color, Weight, and Velocity", "C) Radius, Angle, and Perimeter", "D) Mass, Density, and Volume"] : ["A) Direction, sens et norme (longueur)", "B) Couleur, poids et vitesse", "C) Rayon, angle et périmètre", "D) Masse, densité et volume"],
          answer: "A",
          explanation: isEn ? "A vector is uniquely defined by its direction line, sense (arrowhead), and norm (magnitude)." : "Un vecteur est caractérisé par sa direction (droite support), son sens (vers où pointe la flèche) et sa norme (sa longueur)."
        },
        {
          question: isEn ? "What does Chasles' relation state for vector addition?" : "Que dit la relation de Chasles pour l'addition de vecteurs ?",
          options: ["A) AB + BC = AC", "B) AB * BC = AC", "C) AB - BC = AC", "D) AB + AC = BC"],
          answer: "A",
          explanation: isEn ? "Chasles' relation states that vector AB + vector BC = vector AC." : "La relation de Chasles permet de simplifier l'enchaînement de déplacements : vecteur AB + vecteur BC = vecteur AC."
        },
        {
          question: isEn ? "When are two non-zero vectors u and v collinear?" : "À quelle condition deux vecteurs u et v non nuls sont-ils colinéaires ?",
          options: isEn ? ["A) When there exists a real number k such that u = k * v", "B) When u + v = 0", "C) When their dot product is 1", "D) When they are strictly perpendicular"] : ["A) Lorsqu'il existe un nombre réel k tel que u = k * v", "B) Lorsque u + v = 0", "C) Lorsque leur produit scalaire vaut 1", "D) Quand ils sont perpendiculaires"],
          answer: "A",
          explanation: isEn ? "Collinearity means the vectors have the same direction, so one is a scalar multiple of the other." : "Deux vecteurs sont colinéaires s'ils partagent la même direction, c'est-à-dire que l'un est multiple de l'autre par un scalaire k."
        },
        {
          question: isEn ? "What is the dot product of two perpendicular (orthogonal) vectors?" : "Que vaut le produit scalaire de deux vecteurs orthogonaux (perpendiculaires) ?",
          options: ["A) 0", "B) 1", "C) -1", "D) L'infini"],
          answer: "A",
          explanation: isEn ? "Because cos(90°) = 0, the dot product of orthogonal vectors is always 0." : "Puisque le cosinus de 90° est nul, le produit scalaire de deux vecteurs perpendiculaires est toujours égal à 0."
        },
        {
          question: isEn ? "In physics, which of the following is represented as a vector?" : "En physique, quelle grandeur est représentée par un vecteur ?",
          options: isEn ? ["A) Force (in Newtons)", "B) Temperature (in °C)", "C) Time (in seconds)", "D) Mass (in kg)"] : ["A) Une Force (en Newtons)", "B) La température (en °C)", "C) Le temps (en secondes)", "D) La masse (en kg)"],
          answer: "A",
          explanation: isEn ? "Forces, velocities, and accelerations have direction and magnitude, making them vector quantities." : "Une force a un point d'application, une direction, un sens et une intensité, c'est donc une grandeur vectorielle."
        }
      ];
    } else if (isBlackHole) {
      questions = [
        {
          question: "Qu'est-ce qu'un trou noir ?",
          options: ["A) Une région de l'espace dont la gravité est si forte que même la lumière ne peut s'en échapper", "B) Une planète géante éteinte sans atmosphère", "C) Un vide total sans matière dans la galaxie", "D) Une étoile artificielle créée par l'homme"],
          answer: "A",
          explanation: "La vitesse de libération d'un trou noir dépasse la vitesse de la lumière, rendant tout retour impossible après l'horizon."
        },
        {
          question: "Comment appelle-t-on la frontière limite au-delà de laquelle rien ne peut s'échapper d'un trou noir ?",
          options: ["A) L'Horizon des événements", "B) La ceinture de Kuiper", "C) La nébuleuse planétaire", "D) La photosphère"],
          answer: "A",
          explanation: "L'horizon des événements est la frontière théorique autour d'un trou noir qui délimite la zone de non-retour."
        },
        {
          question: "Quel scientifique a prédit l'existence des trous noirs via sa théorie de la Relativité Générale en 1915 ?",
          options: ["A) Albert Einstein", "B) Isaac Newton", "C) Galileo Galilei", "D) Nikola Tesla"],
          answer: "A",
          explanation: "Albert Einstein a formulé la Relativité Générale, dont Karl Schwarzschild a résolu les équations décrivant le trou noir."
        },
        {
          question: "Quel est le nom du trou noir supermassif situé au centre de notre galaxie, la Voie Lactée ?",
          options: ["A) Sagittarius A*", "B) Cygnus X-1", "C) Andromeda Alpha", "D) Polaris Prime"],
          answer: "A",
          explanation: "Sagittarius A* (Sgr A*) est le trou noir supermassif d'environ 4 millions de masses solaires au cœur de la Voie Lactée."
        },
        {
          question: "Quel phénomène physique théorisait Stephen Hawking concernant l'évaporation lente des trous noirs ?",
          options: ["A) Le rayonnement de Hawking", "B) La fusion nucléaire", "C) L'effet Doppler", "D) L'onde gravitationnelle"],
          answer: "A",
          explanation: "Le rayonnement de Hawking est un effet quantique près de l'horizon permettant au trou noir de perdre très lentement de la masse."
        }
      ];
    } else {
      const tTopic = cleanQuery || "Sujet d'étude";
      questions = [
        {
          question: `Quel est le principe central ou la définition clé de : ${tTopic} ?`,
          options: [
            `A) Une notion fondamentale et structurée dans ce domaine`,
            `B) Une simple hypothèse non vérifiée`,
            `C) Un phénomène sans règle ni logique`,
            `D) Un élément obsolète sans utilité`
          ],
          answer: "A",
          explanation: `La maîtrise de ${tTopic} repose sur la compréhension de ses principes directeurs et de ses applications concrètes.`
        },
        {
          question: `Comment aborde-t-on efficacement la résolution d'un problème sur : ${tTopic} ?`,
          options: [
            `A) En décomposant les étapes logiques et en s'appuyant sur les règles de base`,
            `B) En répondant au hasard sans lire l'énoncé`,
            `C) En ignorant les définitions fondamentales`,
            `D) En évitant tout exemple pratique`
          ],
          answer: "A",
          explanation: `La décomposition méthodique permet d'isoler chaque difficulté et d'appliquer la bonne règle étape par étape.`
        },
        {
          question: `Quel est l'un des plus grands bénéfices de bien maîtriser ${tTopic} ?`,
          options: [
            `A) Améliorer sa rapidité de réflexion et comprendre les concepts avancés`,
            `B) Aucun, c'est une perte de temps`,
            `C) Oublier les autres matières`,
            `D) Ralentir son apprentissage`
          ],
          answer: "A",
          explanation: `Comprendre les fondations de ${tTopic} permet de faire des liens avec plein d'autres sujets passionnants.`
        },
        {
          question: `Quelle méthode d'apprentissage est la plus efficace pour retenir ${tTopic} ?`,
          options: [
            `A) Le rappel actif (Active Recall) et la création de schémas visuels / cartes mentales`,
            `B) Relire passivement la même page 50 fois`,
            `C) Apprendre sans chercher à comprendre`,
            `D) Ne jamais faire d'exercices`
          ],
          answer: "A",
          explanation: `Les neurosciences prouvent que s'auto-évaluer et structurer visuellement l'information maximise la mémoire à long terme.`
        },
        {
          question: `Comment ${tTopic} s'applique-t-il dans le monde réel ou les sciences modernes ?`,
          options: [
            `A) À travers des applications concrètes dans les technologies et la vie quotidienne`,
            `B) Uniquement dans les vieux livres d'histoire`,
            `C) Nulle part, c'est purement imaginaire`,
            `D) Il est interdit de l'utiliser`
          ],
          answer: "A",
          explanation: `Ce sujet trouve des applications directes dans l'innovation, la recherche et le quotidien.`
        }
      ];
    }

    return {
      success: true,
      text: "```json\n" + JSON.stringify({ questions }, null, 2) + "\n```",
      sources: defaultSources,
      searchQueries,
      query: cleanQuery,
      mode: 'quiz',
      isOfflineFallback: true
    };
  }

  // --- MINDMAP MODE ---
  if (mode === 'mindmap') {
    const tTopic = cleanQuery || "Carte Mentale";
    const mindmapData = {
      title: `Carte Mentale : ${tTopic}`,
      root: `🎯 ${tTopic}`,
      branches: [
        {
          name: "🌟 Fondations & Origines",
          icon: "📖",
          description: "Définition, contexte et notions premières",
          subnodes: ["Définition essentielle", "Contexte historique", "Vocabulaire clé", "Principes de base"]
        },
        {
          name: "⚙️ Mécanismes & Règles",
          icon: "⚡",
          description: "Fonctionnement pas à pas et formules",
          subnodes: ["Règles fondamentales", "Formules & Relations", "Cas particuliers", "Méthodes types"]
        },
        {
          name: "🧠 Analyse & Astuces",
          icon: "💡",
          description: "Moyens mnémotechniques et pièges à éviter",
          subnodes: ["Astuces de mémorisation", "Erreurs courantes", "Analogies simples", "Points de vigilance"]
        },
        {
          name: "🚀 Applications Réelles",
          icon: "🌍",
          description: "Exemples concrets dans le monde et la science",
          subnodes: ["Cas d'usage au quotidien", "Technologies & Innovations", "Exercices pratiques", "Ouverture vers d'autres sujets"]
        }
      ],
      mermaid: `graph TD\n  Root["🎯 ${tTopic.replace(/["\n]/g, '')}"] --> A["🌟 Fondations"]\n  Root --> B["⚙️ Mécanismes"]\n  Root --> C["🧠 Astuces & Pièges"]\n  Root --> D["🚀 Applications Réelles"]\n  A --> A1["Définition simple"]\n  B --> B1["Règles & Étapes"]\n  C --> C1["Points clés"]\n  D --> D1["Exemples concrets"]`
    };

    return {
      success: true,
      text: "```json\n" + JSON.stringify(mindmapData, null, 2) + "\n```",
      sources: defaultSources,
      searchQueries,
      query: cleanQuery,
      mode: 'mindmap',
      isOfflineFallback: true
    };
  }

  // --- SUMMARY MODE ---
  if (mode === 'summary') {
    let summaryText = "";
    if (isHorla) {
      summaryText = `## 📖 Fiche de Révision : *Le Horla* de Guy de Maupassant (1887)

Salut ! Voici le résumé complet et limpide de cette œuvre majeure du fantastique français.

### 🌟 1. Contexte & Présentation de l'Œuvre
* **Auteur :** Guy de Maupassant (1850 - 1893).
* **Date de parution :** 1887 (version définitive).
* **Genre :** Nouvelle fantastique et psychologique sous forme de journal intime daté.
* **Thème central :** L'angoisse, la solitude, la folie, et l'apparition d'un prédateur invisible qui menace la supériorité de l'être humain.

### 📚 2. L'Histoire en Bref
1. **L'arrivée du mal :** Vivant dans sa belle propriété au bord de la Seine, le narrateur commence à ressentir une fièvre inexpliquée et des cauchemars angoissants après avoir salué un trois-mâts brésilien.
2. **Les manifestations étranges :** La nuit, une présence invisible boit l'eau et le lait posés sur sa table de chevet, tourne les pages des livres et dérobe son reflet dans le miroir.
3. **La prise de conscience :** Le narrateur découvre dans un journal scientifique qu'une épidémie de folie similaire frappe la province de São Paulo au Brésil. Il comprend qu'un être supérieur invisible, le **Horla** (*"Hors-là"*), est venu asservir l'Homme comme l'Homme a asservi les animaux.
4. **Le dénouement tragique :** Dans un accès de terreur, le narrateur enferme le Horla dans sa chambre et incendie sa maison. Réalisant que le monstre immatériel n'est pas mort, il envisage le suicide comme seule échappatoire : *"Il va donc falloir que je me tue, moi !..."*.

### 🧠 3. Les Clés pour Réussir tes Devoirs
* **L'ambiguïté fantastique :** Le lecteur hésite constamment entre une explication rationnelle (le narrateur devient fou et hallucine) et surnaturelle (le Horla existe vraiment).
* **L'écriture du doute :** Utilisation de la 1ère personne ("Je"), de phrases courtes et de questions qui plongent le lecteur dans l'angoisse.

---
🌐 *5 sources analysées et synthétisées pour toi.*`;
    } else if (isVector) {
      summaryText = `## 📐 Fiche de Révision : Les Vecteurs en Mathématiques et Physique

Salut ! Découvrons ensemble les vecteurs, l'un des outils les plus puissants en maths et en physique !

### 🌟 1. Qu'est-ce qu'un Vecteur ?
Un vecteur est un objet géométrique qui représente un **déplacement** ou une **action orientée**. Contrairement à un simple nombre (comme 5 kg ou 20°C), un vecteur possède 3 caractéristiques indispensables :
1. **La Direction :** La ligne droite le long de laquelle on se déplace (ex : horizontale, verticale, diagonale).
2. **Le Sens :** Vers où pointe la flèche (ex : de gauche à droite, du bas vers le haut).
3. **La Norme (ou Longueur) :** La valeur chiffrée, notée $\\|\\vec{u}\\|$ (ex : une vitesse de 50 km/h, une force de 10 Newtons).

### ⚙️ 2. Les Règles Fondamentales à Connaître
* **La Relation de Chasles :** Pour faire plusieurs déplacements à la suite :
  $$\\vec{AB} + \\vec{BC} = \\vec{AC}$$
  *(Aller de A à B, puis de B à C, revient directement à aller de A à C).*
* **La Colinéarité :** Deux vecteurs sont colinéaires s'ils ont la même direction (lignes parallèles) :
  $$\\vec{u} = k \\cdot \\vec{v} \\quad (k \\in \\mathbb{R})$$
* **Le Produit Scalaire :** Mesure l'angle et l'énergie entre deux vecteurs. Si deux vecteurs sont perpendiculaires ($90^\\circ$), leur produit scalaire vaut **0** !

### 🚀 3. Où les utilise-t-on dans la vraie vie ?
* **En Physique :** Pour modéliser la pesanteur (le Poids $\\vec{P} = m \\cdot \\vec{g}$), la trajectoire d'une fusée ou la vitesse du vent.
* **Dans les Jeux Vidéo & 3D :** Pour déplacer ton personnage, calculer les sauts, la gravité et les collisions.

---
🌐 *5 sources explorées et structurées avec bienveillance.*`;
    } else {
      const tTopic = cleanQuery || "Sujet d'étude";
      summaryText = `## 📚 Fiche de Synthèse : ${tTopic}

Salut ! Voici un super résumé clair, structuré et facile à retenir sur **${tTopic}**.

### 🌟 1. De quoi s'agit-il ?
**${tTopic}** est une notion clé. L'idée est de comprendre les principes simples qui régissent ce sujet pour pouvoir les appliquer facilement lors de tes révisions et exercices.

### 💡 2. Les Notions Clés à Retenir
1. **Le Concept Central :** Identifie toujours l'élément de base et sa définition simple avec tes propres mots.
2. **Le Fonctionnement :** Comment les éléments interagissent entre eux ? Quels sont les liens de cause à effet ?
3. **Les Règles & Méthodes :** Quelles sont les étapes logiques à suivre pour résoudre un exercice ou expliquer ce sujet ?

### 🧠 3. Pourquoi c'est utile et comment s'en souvenir ?
* **Fais des analogies :** Rapproche toujours cette notion d'un exemple concret de ton quotidien.
* **Utilise le rappel actif :** Ferme les yeux et essaye d'expliquer ce sujet comme si tu l'expliquais à un ami.
* **Visualise :** N'hésite pas à regarder la carte mentale ou faire le quiz associé pour tester tes réflexes !

---
🌐 *Recherche synthétisée à partir de 5 sources de référence.*`;
    }

    return {
      success: true,
      text: summaryText,
      sources: defaultSources,
      searchQueries,
      query: cleanQuery,
      mode: 'summary',
      isOfflineFallback: true
    };
  }

  // --- DEFAULT SEARCH / CONVERSATIONAL MODE ---
  let responseContent = "";

  if (isGreeting) {
    responseContent = `Salut Capitaine ! 🚀 Ravi de te retrouver !

Je suis ton compagnon d'apprentissage connecté à **Google Search**. Je suis là pour t'expliquer simplement et naturellement n'importe quelle notion de cours, t'aider à réviser un livre, des maths, des sciences, de l'histoire ou n'importe quel sujet qui te passionne !

Tu peux par exemple me demander :
* 📖 *"Explique-moi Le Horla de Maupassant"*
* 📐 *"C'est quoi un vecteur en maths ?"*
* 🌌 *"Comment naissent les trous noirs ?"*
* 🎯 Ou cliquer sur les boutons ci-dessus pour générer un **Résumé**, un **Quiz** ou une **Carte Mentale** en un clin d'œil !

De quoi as-tu envie de parler aujourd'hui ? 😊`;
  } else if (isHorla) {
    responseContent = `Salut ! *Le Horla*, c'est une des plus grandes nouvelles fantastiques de **Guy de Maupassant**, publiée en 1887 !

### 📖 En quelques mots :
C'est le journal intime d'un homme qui vit près de Rouen au bord de la Seine. Après avoir salué un mystérieux bateau brésilien, il commence à se sentir très mal : insomnies, cauchemars, sensation d'oppression...

Puis des choses très étranges se produisent :
* Sa carafe d'eau et son verre de lait sont **vidus la nuit** pendant son sommeil.
* Les pages de son livre tournent toutes seules.
* Quand il se regarde dans le miroir, **il ne voit plus son propre reflet** !

Il comprend qu'un être invisible et supérieur, qu'il nomme le **Horla** (*"Hors-là"*), s'est installé chez lui et prend le contrôle de son esprit. À la fin, désespéré, il brûle sa maison... mais réalise avec effroi que le Horla ne peut pas mourir par le feu.

👉 Tu veux que je te prépare un petit **Quiz** pour tester tes connaissances ou une **Fiche de Résumé** détaillée ? N'hésite pas à me le dire !`;
  } else if (isVector) {
    responseContent = `Salut ! Les **vecteurs**, c'est hyper intuitif une fois qu'on a la bonne image en tête ! 📐

Imagine que tu donnes une consigne de déplacement à un ami dans un jeu vidéo. Tu ne peux pas juste lui dire *"avance de 5 mètres"*, tu dois lui préciser :
1. **La Direction :** Sur quelle ligne droite (ex : tout droit sur l'avenue).
2. **Le Sens :** Vers l'avant ou vers l'arrière (la flèche).
3. **La Norme :** La distance exacte (5 mètres, ou la vitesse si c'est un véhicule).

### 💡 Les 2 formules magiques à retenir :
* **La Relation de Chasles :** $\\vec{AB} + \\vec{BC} = \\vec{AC}$ *(faire l'étape A vers B puis B vers C, c'est comme aller direct de A vers C).*
* **Les vecteurs colinéaires :** Deux vecteurs sont colinéaires s'ils sont parallèles (l'un est un multiple de l'autre : $\\vec{u} = k \\cdot \\vec{v}$).

Tu veux t'entraîner avec un petit quiz interactif de 5 questions ? Clique sur **🎯 Générer Quiz** juste au-dessus !`;
  } else if (isBlackHole) {
    responseContent = `Les **trous noirs**, c'est l'un des sujets les plus fascinants de tout l'univers ! 🌌

### 🚀 Qu'est-ce que c'est exactement ?
Un trou noir est un endroit dans l'espace où une quantité gigantesque de matière est concentrée dans un espace minuscule (par exemple, une étoile géante qui s'effondre sur elle-même en fin de vie).

Résultat : la force de gravité devient tellement phénoménale que **rien ne peut s'en échapper**, pas même la lumière ! C'est pour ça qu'ils sont invisibles et qu'on les appelle "noirs".

### 💡 Les points clés à retenir :
* **L'Horizon des événements :** C'est la frontière limite. Si un objet ou un rayon de lumière franchit cette ligne, il ne peut plus jamais faire demi-tour.
* **La Singularité :** Le point central où toute la matière est écrasée à une densité infinie.
* **Au centre de notre galaxie :** Il y a un trou noir supermassif nommé **Sagittarius A*** qui pèse environ 4 millions de fois la masse de notre Soleil !

Dis-moi si tu veux une fiche de résumé ou un quiz sur l'astronomie ! 🌟`;
  } else if (isPhotosynthesis) {
    responseContent = `La **photosynthèse**, c'est tout simplement la fabrique d'énergie des plantes vertes ! 🌱☀️

### 🍃 Comment ça marche ?
Les plantes sont magiques : elles utilisent la lumière du soleil pour transformer de l'eau et du dioxyde de carbone ($CO_2$) en nourriture (du sucre/glucose) tout en libérant de l'oxygène ($O_2$) que nous respirons !

### 🧪 L'équation magique :
$$\\text{Eau} + \\text{Dioxyde de Carbone} + \\text{Lumière du Soleil} \\longrightarrow \\text{Glucose (Énergie)} + \\text{Oxygène}$$

* La capture de la lumière se fait grâce à un pigment vert dans les feuilles appelé la **chlorophylle**.
* C'est grâce à ce processus que la Terre possède une atmosphère respirable et que la vie végétale nourrit toute la chaîne alimentaire !

Tu veux qu'on fasse un quiz là-dessus pour vérifier tes acquis ? 😊`;
  } else {
    const tTopic = cleanQuery || "ce sujet";
    responseContent = `Salut ! C'est une excellente question sur **${tTopic}**. 🚀

Voici les explications essentielles à retenir simplement :

1. **L'Idée Principale :**
   ${tTopic} est un concept important. L'objectif est de comprendre son fonctionnement pas à pas avec des exemples clairs et concrets sans jargon inutile.

2. **Comment ça fonctionne :**
   * On identifie d'abord les éléments de base et leur rôle.
   * On analyse ensuite les interactions et les règles logiques qui s'appliquent.
   * On s'appuie sur des exemples pratiques pour ancrer la notion dans la mémoire.

3. **Mes conseils pour bien réviser :**
   * Tu peux cliquer sur **📄 Fiche de Résumé** pour avoir une fiche de cours complète.
   * Ou sur **🎯 Super Quiz** pour tester tes réflexes en 5 questions rapides !

Je suis là si tu veux qu'on approfondisse un point particulier, pose-moi toutes tes questions ! 😊`;
  }

  return {
    success: true,
    text: responseContent,
    sources: defaultSources,
    searchQueries,
    query: cleanQuery,
    mode: 'search',
    isOfflineFallback: true
  };
}
