import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    require('fs').writeFileSync('key_log.txt', "GEMINI_API_KEY length: " + (process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'undefined'));
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Fetch and save models
  try {
    fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
      .then(r => r.json())
      .then(d => require('fs').writeFileSync('models.json', JSON.stringify(d, null, 2)))
      .catch(e => console.error(e));
  } catch (e) {}

  app.get("/api/models", async (req, res) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // API routes FIRST
  app.post("/api/llama", async (req, res) => {
    console.log("Received request for /api/llama", req.body.action, req.body.lang, req.body.model);
    try {
      const { text, action, lang, model } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const languageNames: Record<string, string> = {
        fr: "français",
        en: "anglais",
        es: "espagnol",
        de: "allemand",
        it: "italien",
        pt: "portugais",
        ar: "arabe",
        zh: "chinois"
      };

      const targetLang = languageNames[lang] || "français";

      let systemPrompt = `Tu es un tuteur IA expert, très amical, encourageant et pédagogue. Ton but est d'aider les étudiants à comprendre des concepts complexes avec une précision chirurgicale. 
      Réponds TOUJOURS en ${targetLang}.
      Ne généralise jamais : si le texte traite de médecine, utilise le vocabulaire médical précis ; s'il s'agit de physique, sois rigoureux sur les formules et concepts. 
      Adapte ton expertise au domaine spécifique du texte tout en restant accessible. Utilise des emojis pour rendre l'apprentissage stimulant.
      IMPORTANT: Utilise la syntaxe LaTeX pour les formules mathématiques et scientifiques (ex: $E=mc^2$ ou $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).`;
      
      let userPrompt = "";
      if (action === "summary") {
        userPrompt = `Fais un résumé clair et structuré en ${targetLang} du texte suivant :\n\n${text}`;
      } else if (action === "mindmap") {
        userPrompt = `En tant qu'expert en pédagogie visuelle, crée une carte mentale (mindmap) exhaustive, structurée et esthétique pour le texte fourni.
        Utilise EXCLUSIVEMENT la syntaxe Mermaid.js 'mindmap'.
        Le texte à l'intérieur de la carte doit être en ${targetLang}.
        
        Directives strictes :
        1. Commence par 'mindmap'.
        2. Le nœud central doit être entouré de (( )) pour une forme circulaire.
        3. Les branches principales doivent être claires et hiérarchisées.
        4. Réponds UNIQUEMENT avec le bloc de code mermaid, sans aucun texte avant ou après.
        
        Exemple de structure :
        \`\`\`mermaid
        mindmap
          root((Sujet))
            Branche 1
              Détail A
              Détail B
            Branche 2
              Détail C
        \`\`\`
        
        Texte à transformer :\n\n${text}`;
      } else if (action === "presentation") {
        userPrompt = `Crée un plan de présentation (slides) détaillé en ${targetLang} pour le texte suivant. Pour chaque slide, donne un titre et les points clés à aborder :\n\n${text}`;
      } else if (action === "exercises") {
        userPrompt = `Crée un petit quiz (QCM ou questions courtes) en ${targetLang} basé sur le texte suivant, puis donne les corrigés détaillés à la fin :\n\n${text}`;
      } else if (action === "quiz") {
        userPrompt = `Crée un jeu-questionnaire (Quiz) très amusant, interactif et divertissant en ${targetLang} basé sur le texte suivant. Pose 5 questions originales avec des choix de réponses drôles ou surprenants, puis donne les réponses à la fin :\n\n${text}`;
      } else {
        userPrompt = text;
      }

      const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        console.error("GROQ_API_KEY is not set in environment variables");
        return res.status(500).json({ error: "Server configuration error: API key missing" });
      }

      const groqModel = "llama-3.3-70b-versatile";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "LlamaLearn/1.0"
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error:", response.status, errorText);
        return res.status(response.status).json({ error: `Groq API Error: ${response.status}`, details: errorText });
      }

      const data = await response.json();
      console.log("Groq API Success");
      res.json({ result: data.choices[0].message.content });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
