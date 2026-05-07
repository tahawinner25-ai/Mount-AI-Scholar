import { GoogleGenAI } from '@google/genai';

// initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSummary(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const prompt = `Tu es un professeur expert en sciences cognitives, spécialisé dans l'apprentissage optimisé.\n\nFais un résumé très clair, structuré avec des bullet points de ce texte pour un étudiant. Utilise des emojis pour le rendre visuel. Le résumé DOIT être rédigé dans la langue suivante: ${language}.\n\nTexte à résumer:\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || 'Erreur lors de la génération.';
  } catch (err) {
    console.error("Gemini API Error (Summary):", err);
    return "Désolé, l'IA a rencontré une erreur pendant la génération du résumé. Vérifie la console ou tes clés API.";
  }
}

export async function queryElasticRAG(query: string, language: string, backendUrl: string): Promise<string> {
  if (!query) return "";

  // 1. TENTATIVE VERS L'API PYTHON EN LOCAL (Le PC de l'utilisateur)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout allongé (15s) pour Tunnel Pinggy + ML Pipeline
    
    // Appel à FastAPI uvicorn (Mount AI Scholar Backend) via Tunnel Pinggy
    const res = await fetch(`${backendUrl}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, language }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return `📡 **RÉPONSE DU MOTEUR ELASTIC (via Python Local)** 📡\n\n${data.answer}\n\n*Sources vectorielles retenues par kNN :* ${data.sources.join(', ')}`;
    }
  } catch (backendErr) {
    console.log("Python Backend offline ou non atteignable. Fallback sur la simulation Gemini.");
  }

  // 2. FALLBACK DE SIMULATION (Si le serveur Uvicorn n'est pas lancé)
  const prompt = `L'utilisateur teste la fonctionnalité RAG (Retrieval-Augmented Generation) sur son environnement de développement.
Cependant, son serveur Python Elasticsearch local n'est pas atteignable pour le moment.

Tu vas SIMULER ce que le moteur RAG aurait répondu pour la requête : "${query}".
Rédige une réponse structurée en ${language}. 
Commence par une brève phrase disant que ceci est une **⚠️ Simulation (Backend Python hors ligne)**, puis donne l'information pertinente avec des bullet points.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || 'Erreur lors de la simulation RAG.';
  } catch (err) {
    console.error("Gemini API Error (RAG Simulation):", err);
    return "Erreur critique de connexion. Vérifie ton réseau et ton backend FastAPI.";
  }
}

export async function generateQuiz(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const prompt = `Génère un quiz de 3 questions à choix multiples (QCM) ludique basé sur le texte suivant. Pour chaque question, propose 3 options (A, B, C) et indique la bonne réponse à la fin avec une petite explication. Le quiz DOIT être rédigé dans la langue suivante: ${language}. Ton ton doit être encourageant et adapté à tous les apprenants.\n\nTexte:\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || 'Erreur lors de la génération du quiz.';
  } catch (err) {
    console.error("Gemini API Error (Quiz):", err);
    return "Erreur lors de la création du quiz.";
  }
}

export async function generateMindMap(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const prompt = `Crée un diagramme (mindmap ou graph TD) en syntaxe Mermaid.js pour résumer le texte suivant.
IMPORTANT : Ne renvoie strictement QUE le code Mermaid brut. N'inclus aucun texte avant ou après, pas de markdown \`\`\`mermaid.
Le graphe DOIT commencer directement par "graph TD" ou "mindmap".
Évite les caractères spéciaux (parenthèses, crochets, accolades) à l'intérieur du texte des noeuds.
Langue du diagramme : ${language}.
  
Texte :
${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    let code = response.text || '';
    
    // Essayer d'extraire depuis un bloc de code markdown
    const mdMatch = code.match(/```(?:mermaid)?\n?([\s\S]*?)```/);
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
    console.error("Gemini API Error (MindMap):", err);
    return "graph TD\n  A[Erreur de Connexion à l'IA]";
  }
}
