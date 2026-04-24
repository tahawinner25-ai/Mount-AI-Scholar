import { GoogleGenAI } from '@google/genai';

// Polyfill for process.env in Vite if needed, though system instructions say to use it directly
const apiKey = typeof process !== 'undefined' && process.env.GEMINI_API_KEY 
  ? process.env.GEMINI_API_KEY 
  : import.meta.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export async function generateSummary(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const prompt = `Tu es un professeur expert en sciences cognitives, spécialisé dans l'apprentissage optimisé.\n\nFais un résumé très clair, structuré avec des bullet points de ce texte pour un étudiant. Utilise des emojis pour le rendre visuel. Le résumé DOIT être rédigé dans la langue suivante: ${language}.\n\nTexte à résumer:\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Erreur lors de la génération.';
  } catch (err) {
    console.error("Gemini API Error (Summary):", err);
    return "Désolé, l'IA a rencontré une erreur pendant la génération du résumé. Vérifie la console ou tes clés API.";
  }
}

export async function generateQuiz(text: string, language: string): Promise<string> {
  if (!text) return "";
  
  const prompt = `Génère un quiz de 3 questions à choix multiples (QCM) ludique basé sur le texte suivant. Pour chaque question, propose 3 options (A, B, C) et indique la bonne réponse à la fin avec une petite explication. Le quiz DOIT être rédigé dans la langue suivante: ${language}. Ton ton doit être encourageant et adapté à tous les apprenants.\n\nTexte:\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Erreur lors de la génération du quiz.';
  } catch (err) {
    console.error("Gemini API Error (Quiz):", err);
    return "Erreur lors de la création du quiz.";
  }
}
