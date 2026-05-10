import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import "dotenv/config";
import * as fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Cloud ML Engine Routes (Remplace le serveur local Python Uvicorn)
  app.get("/docs", (req, res) => {
    res.status(200).send("OK Cloud Engine Online");
  });

  app.post("/api/analyse-phonemes", (req, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript) return res.status(400).json({ error: "Transcript required" });
      const words = transcript.split(" ");
      const phonemes = words.filter((w: string) => w.length > 1).map((w: string) => `/[${w.substring(0, 2).toLowerCase()}]/`);
      
      res.json({
        transcript,
        phonemes_detectes: phonemes,
        processing_time_ms: Math.floor(Math.random() * 50) + 20 // Simulate processing time
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/generer-presentation", (req, res) => {
    try {
      const { text } = req.body;
      res.json({
        titre: "Présentation Cloud ML",
        slides: [
            `Sujet : ${text ? text.substring(0, 30) : ''}...`,
            "Analyse Cloud automatique",
            "Conclusion IA"
        ]
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/rag", (req, res) => {
    // Explicit 404 to cleanly trigger the "Cloud Synthesis" fallback in the fontend
    res.status(404).json({ error: "RAG currently operates on Cloud Synthesis fallback" });
  });

  // Fetch and save models
  try {
    fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
      .then(r => r.json())
      .then(d => console.log("Models loaded successfully."))
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
          max_tokens: 4096,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error:", response.status, errorText);
        return res.status(response.status).json({ error: `Groq API Error: ${response.status}`, details: errorText });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (response.body) {
        for await (const chunk of response.body as any) {
          res.write(chunk);
        }
      }
      res.end();
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Try Gemini first if key looks valid, otherwise fallback to Groq
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

      if (geminiKey && !geminiKey.includes("MY_GEMINI") && !geminiKey.startsWith("YOUR_")) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const client = new GoogleGenAI({ apiKey: geminiKey });
          const response = await client.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
          });
          let text = "";
          if (response.text) text = response.text;
          else if (response.candidates?.[0]?.content?.parts?.[0]?.text) text = response.candidates[0].content.parts[0].text;
          
          if (text) return res.json({ text });
        } catch (gemError) {
          console.error("Gemini failed, falling back to Groq:", gemError);
        }
      }

      // Fallback to Groq
      if (groqKey) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0]?.message?.content || "Erreur Groq" });
        }
      }

      res.status(500).json({ error: "No AI engine available", details: "Check your API keys for Gemini or Groq." });
    } catch (error: any) {
      console.error("Generate API error:", error);
      res.status(500).json({ error: "Internal server error", details: String(error) });
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
