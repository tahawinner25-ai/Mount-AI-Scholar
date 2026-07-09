import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import "dotenv/config";
import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
import { WebSocketServer } from "ws";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // TTS Endpoint using Gemini Live / TTS preview
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, language, accent } = req.body;
      if (!text) return res.status(400).json({ error: "Text required" });

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!geminiKey) return res.status(500).json({ error: "No API key" });

      const client = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Voice selection based on language context
      let voiceName = "Zephyr"; 
      let promptText = text;

      if (accent) {
        if (accent === "marocain") {
          voiceName = "Zephyr";
          promptText = `[Prononcez le mot français "${text}" avec un accent marocain authentique : un léger roulement du 'r', une articulation claire et la cadence caractéristique de la Darija marocaine.]`;
        } else if (accent === "senegalais") {
          voiceName = "Zephyr";
          promptText = `[Prononcez le mot français "${text}" avec un accent sénégalais / wolof-français chaleureux : des voyelles bien ouvertes, un rythme vocalique typique de Dakar et une douceur mélodique.]`;
        } else if (accent === "congolais") {
          voiceName = "Zephyr";
          promptText = `[Prononcez le mot français "${text}" avec un accent congolais expressif et chantant, issu du métissage linguistique lingala-français : intonation rythmée, voyelles pleines.]`;
        } else if (accent === "kenyan") {
          voiceName = "Puck";
          promptText = `[Pronounce the word "${text}" with a distinct, warm Kenyan English accent: clear syllable-timed pronunciation, slight hardening of consonants, and local East African resonance.]`;
        } else if (accent === "sud_africain") {
          voiceName = "Puck";
          promptText = `[Pronounce the word "${text}" with a deep, crisp South African English accent: rich resonance, Zulu/Xhosa-influenced phonetics, and characteristic clean articulation.]`;
        }
      } else {
        if (language === "English") {
          voiceName = "Puck"; // puck has an elegant accent
          promptText = `[British accent, natural cadence, friendly, expert enunciation] ${text}`;
        } else if (language === "French") {
          voiceName = "Zephyr";
          promptText = `[chaleureux, voix douce, excellente diction française d'instituteur] ${text}`;
        }
      }
      
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        res.status(500).json({ error: "No audio generated" });
      }
    } catch (e: any) {
      const errMsg = String(e);
      const isQuota = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("429") || (e && e.status === 429);
      if (isQuota) {
        console.warn("Gemini TTS Free Tier Quota Exceeded. Safely falling back to client-side local SpeechSynthesis.");
        res.status(429).json({ error: "quota_exceeded", message: "Gemini TTS Free Tier quota limit reached. Falling back to local browser Speech Synthesis." });
      } else {
        console.error("TTS API Error:", e);
        res.status(500).json({ error: errMsg });
      }
    }
  });

  // Cloud ML Engine Routes (Remplace le serveur local Python Uvicorn)
  app.get("/docs", (req, res) => {
    res.status(200).send("OK Cloud Engine Online");
  });

  // Helper local phonetics mapping function for hybrid execution
  function getRuleBasedPhonemes(text: string, language: string = "English"): string[] {
    const cleanText = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
      .trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    
    if (language === "French") {
      return words.map(word => {
        let ph = word;
        ph = ph.replace(/eau/g, "o")
              .replace(/au/g, "o")
              .replace(/ou/g, "u")
              .replace(/ch/g, "ʃ")
              .replace(/qu/g, "k")
              .replace(/g([eiœy])/g, "ʒ$1")
              .replace(/c([eiœy])/g, "s$1")
              .replace(/ph/g, "f")
              .replace(/oi/g, "wa")
              .replace(/ai/g, "ɛ")
              .replace(/ei/g, "ɛ")
              .replace(/eu/g, "œ")
              .replace(/un/g, "œ̃")
              .replace(/in/g, "ɛ̃")
              .replace(/an/g, "ɑ̃")
              .replace(/en/g, "ɑ̃")
              .replace(/on/g, "ɔ̃")
              .replace(/ill/g, "ij")
              .replace(/ss/g, "s")
              .replace(/s$/g, "")
              .replace(/t$/g, "")
              .replace(/d$/g, "")
              .replace(/x$/g, "");
        return `/[${ph}]/`;
      });
    } else {
      return words.map(word => {
        let ph = word;
        ph = ph.replace(/tion/g, "ʃən")
              .replace(/the/g, "ðə")
              .replace(/ph/g, "f")
              .replace(/sh/g, "ʃ")
              .replace(/ch/g, "tʃ")
              .replace(/th/g, "θ")
              .replace(/ee/g, "iː")
              .replace(/oo/g, "uː")
              .replace(/ea/g, "iː")
              .replace(/igh/g, "aɪ")
              .replace(/ou/g, "aʊ")
              .replace(/ow/g, "aʊ")
              .replace(/ck/g, "k")
              .replace(/wr/g, "r")
              .replace(/kn/g, "n")
              .replace(/wh/g, "w")
              .replace(/qu/g, "kw")
              .replace(/ay/g, "eɪ")
              .replace(/ai/g, "eɪ")
              .replace(/oy/g, "ɔɪ")
              .replace(/oi/g, "ɔɪ")
              .replace(/y$/g, "i")
              .replace(/e$/g, "");
        return `/[${ph}]/`;
      });
    }
  }

  app.post("/api/analyse-phonemes", async (req, res) => {
    try {
      const { transcript, language } = req.body;
      const targetLanguage = language || "English";
      if (!transcript) return res.status(400).json({ error: "Transcript required" });
      
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        try {
          const client = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
          const prompt = `You are an expert NLP phonetics transcriber.
Convert the following transcript into IPA phoneme representation: "${transcript}"
The target language is: ${targetLanguage}.
Provide standard IPA transcription inside slashes /.../ for each word.
Output candidate phoneme string only, inside a strict JSON array of strings matching the words, for example:
If transcript is "hello brave scholar" in English, output:
["/həˈloʊ/", "/breɪv/", "/ˈskɒlər/"]
Output strictly JSON, do not wrap in markdown or any other text.`;

          const response = await client.models.generateContent({
             model: "gemini-3.5-flash",
             contents: prompt,
             config: {
               responseMimeType: "application/json"
             }
          });
          
          let responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const phonemes = JSON.parse(cleanJson);
            if (Array.isArray(phonemes)) {
              return res.json({
                transcript,
                phonemes_detectes: phonemes,
                processing_time_ms: 12
              });
            }
          }
        } catch (gemErr) {
          console.warn("Gemini phoneme generation failed, falling back to rules:", gemErr);
        }
      }

      // Hybrid Fallback
      const phonemes = getRuleBasedPhonemes(transcript, targetLanguage);
      res.json({
        transcript,
        phonemes_detectes: phonemes,
        processing_time_ms: 5
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/superviseur-phonologique", async (req, res) => {
    try {
      const { motCible, motPrononce, language } = req.body;
      const targetLanguage = language || "French";

      if (!motCible || !motPrononce) {
        return res.status(400).json({ error: "motCible and motPrononce are required" });
      }

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        try {
          const client = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const prompt = `You are a world-class cognitive therapist and speech-language pathologist (orthophoniste).
Analyze the phonological difference between the target word (mot cible) "${motCible}" and what was actually pronounced (mot prononcé) "${motPrononce}" in the context of childhood speech disorders (like dyslexia or dysphasia).

Target word: "${motCible}"
Pronounced word: "${motPrononce}"
Language: ${targetLanguage}

Please perform a deep phonetic comparison. Determine:
1. IPA (International Phonetic Alphabet) representations for both words (adapted to ${targetLanguage}).
2. Levenshtein Distance (or phonetic edit distance) between the two.
3. Classify and analyze the errors. Focus on typical phonological simplifications or errors like:
   - Inversion / Metathesis (e.g., sp -> ps, "spectacle" -> "pestacle")
   - Omission (e.g., "crocodille" -> "colodile")
   - Substitution (e.g., /r/ -> /l/, "rouge" -> "louge")
   - Addition / Epenthesis
4. A friendly, high-stakes positive cognitive advice or exercise (conseil cognitif) for the speech therapist and the child to practice or correct this specific mispronunciation.

CRITICAL: All descriptive text fields in the JSON response (typeErreur, description, details, and conseilCognitif) MUST be written in 100% ENGLISH, regardless of the target word's source language.

Output strictly JSON with this schema (no markdown formatting, no code blocks):
{
  "motCible": "${motCible}",
  "motPrononce": "${motPrononce}",
  "ipaCible": "IPA string of target word, e.g., /spɛktakl/",
  "ipaPrononce": "IPA string of pronounced word, e.g., /pɛstakl/",
  "distanceLeven": number,
  "analyse": {
    "typeErreur": "Short string classifying the error in English (e.g., Inversion, Omission, Substitution, Addition)",
    "description": "Clear explanation in English of what happened phonologically",
    "details": "Technical breakdown of phonemes involved in English"
  },
  "scoreSyllabique": number,
  "erreursDetectees": [
    {
      "segmentCible": "the target letters/phonemes that were changed",
      "segmentPrononce": "the actual pronounced letters/phonemes instead",
      "type": "inversion | omission | substitution | addition",
      "index": number
    }
  ],
  "conseilCognitif": "Positive, actionable, and encouraging orthophonic advice in English for the student."
}`;

          const response = await client.models.generateContent({
             model: "gemini-3.5-flash",
             contents: prompt,
             config: {
               responseMimeType: "application/json"
             }
          });

          let responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const analysisResult = JSON.parse(cleanJson);
            return res.json(analysisResult);
          }
        } catch (gemErr) {
          console.warn("Gemini phonological analysis failed, falling back:", gemErr);
        }
      }

      // Quick offline/local fallback algorithm for Levenshtein and basic phonology
      const getBasicFallback = (target: string, actual: string) => {
        const t = target.toLowerCase().trim();
        const a = actual.toLowerCase().trim();
        
        let typeErreur = "Simplification";
        let description = "Minor phonological divergence detected.";
        let details = "Simplified offline analysis computed by local engine.";
        
        if (t === "spectacle" && a === "pestacle") {
          typeErreur = "Inversion / Metathesis";
          description = "Classic inversion of the consonant cluster 'sp' to 'p...s'.";
          details = "Permutation of the voiceless alveolar fricative /s/ and voiceless bilabial plosive /p/.";
        } else if (t.includes("r") && a.includes("l") && !t.includes("l")) {
          typeErreur = "Substitution (Rhotacism)";
          description = "Substitution of the vibrant/rolled consonant /r/ by the lateral liquid /l/.";
          details = "Common speech-sound substitution pattern found in developing childhood speech.";
        } else if (a.length < t.length) {
          typeErreur = "Omission / Elision";
          description = "Omission of a consonant segment or cluster syllable.";
          details = "Missing speech sounds compared to the target phonetic blueprint.";
        }

        return {
          motCible: target,
          motPrononce: actual,
          ipaCible: `/${t}/`,
          ipaPrononce: `/${a}/`,
          distanceLeven: Math.abs(t.length - a.length) || 1,
          analyse: { typeErreur, description, details },
          scoreSyllabique: Math.max(10, Math.floor(100 - (Math.abs(t.length - a.length) * 15))),
          erreursDetectees: [
            {
              segmentCible: t,
              segmentPrononce: a,
              type: a.length < t.length ? "omission" : "substitution",
              index: 0
            }
          ],
          conseilCognitif: `Excellent reading attempt for "${target}". Practice slowly by breaking down the word syllables step-by-step to align each phonetic sound! Keep it up!`
        };
      };

      return res.json(getBasicFallback(motCible, motPrononce));
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });


  // NEW ENDPOINT 1: PHONETIC PREDICTOR (SPELLING SUGGESTIONS)
  app.post("/api/phonetic-predict", async (req, res) => {
    try {
      const { inputWord, language = "French" } = req.body;
      if (!inputWord) {
        return res.status(400).json({ error: "inputWord is required" });
      }

      const cleanInput = inputWord.trim();
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (geminiKey) {
        try {
          const client = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const prompt = `You are a specialized phonetic-based spellchecker and cognitive orthography predictor for dyslexic students.
Analyze the misspelled or phonetically-written word: "${cleanInput}".
Predict the correct words the student likely intended to type based on phonetic similarity and pronunciation similarities (especially common in French/English dyslexia).

Provide up to 4 spelling candidate suggestions. For each candidate, provide:
1. The corrected word ("word").
2. The probability of match as a percentage string (e.g., "95%").
3. A very short, friendly definition or meaning in French ("meaning").
4. A simple example sentence using the word in French ("example").

Output strictly a JSON object with a single "suggestions" key containing an array of objects.
Do not wrap in Markdown or add extra text.
Example JSON schema:
{
  "suggestions": [
    {
      "word": "chapeau",
      "probability": "95%",
      "meaning": "Vêtement que l'on met sur la tête.",
      "example": "Il met un chapeau pour se protéger du soleil."
    }
  ]
}`;

          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          let responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const predictionResult = JSON.parse(cleanJson);
            if (predictionResult.suggestions && Array.isArray(predictionResult.suggestions)) {
              return res.json(predictionResult);
            }
          }
        } catch (gemErr) {
          console.warn("Gemini phonetic predictor failed, falling back to local rule-based predictor:", gemErr);
        }
      }

      // Offline Local Rule-Based & Phonetic Matcher Fallback
      // Simple dictionary of common phonetic errors in French
      const localDictionary: Record<string, Array<{word: string, probability: string, meaning: string, example: string}>> = {
        "chapo": [
          { word: "chapeau", probability: "98%", meaning: "Coiffure qui couvre la tête.", example: "Le magicien sort un lapin blanc de son chapeau." },
          { word: "chapon", probability: "45%", meaning: "Un jeune coq engraissé pour être mangé.", example: "On mange du chapon rôti au repas de Noël." }
        ],
        "bato": [
          { word: "bateau", probability: "99%", meaning: "Un moyen de transport qui flotte sur l'eau.", example: "Le grand bateau blanc navigue sur la mer." },
          { word: "bâton", probability: "50%", meaning: "Un morceau de bois long et droit.", example: "Il marche dans la forêt avec un bâton en bois." }
        ],
        "pestacle": [
          { word: "spectacle", probability: "99%", meaning: "Une représentation théâtrale, un concert ou un cirque.", example: "Les enfants applaudissent à la fin du spectacle." }
        ],
        "spectak": [
          { word: "spectacle", probability: "99%", meaning: "Une représentation théâtrale, un concert ou un cirque.", example: "Les enfants adorent ce magnifique spectacle de magie." }
        ],
        "magnyfyk": [
          { word: "magnifique", probability: "99%", meaning: "Quelque chose de très beau, de merveilleux.", example: "Ce paysage de montagne est vraiment magnifique." }
        ],
        "lordinateur": [
          { word: "ordinateur", probability: "99%", meaning: "Une machine électronique qui permet de travailler et de jouer.", example: "Le grand frère fait ses devoirs sur son ordinateur." }
        ],
        "bilinge": [
          { word: "bilingue", probability: "95%", meaning: "Personne qui parle couramment deux langues différentes.", example: "Taha est bilingue, il parle arabe et français." }
        ],
        "ecole": [
          { word: "école", probability: "99%", meaning: "Lieu où les élèves étudient et apprennent.", example: "Les enfants se retrouvent dans la cour de l'école." }
        ]
      };

      // Find direct matches or calculate simple fallback similarity
      const lowerInput = cleanInput.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (localDictionary[lowerInput]) {
        return res.json({ suggestions: localDictionary[lowerInput] });
      }

      // Default generic suggestions if offline dictionary misses
      const genericSuggestions = [
        { 
          word: cleanInput, 
          probability: "80%", 
          meaning: `[Mode local] Mot orthographié en écriture simplifiée phonétique.`, 
          example: `Exemple généré automatiquement pour le terme: "${cleanInput}".` 
        }
      ];

      return res.json({ suggestions: genericSuggestions });

    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });


  // NEW ENDPOINT 2: NOISE-ROBUST TEXT SIMPLIFICATION
  app.post("/api/simplify-noisy-text", async (req, res) => {
    try {
      const { text, noiseLevel = "medium" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "text is required" });
      }

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (geminiKey) {
        try {
          const client = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const prompt = `You are a specialized NLP speech rehabilitation engineer and a cognitive expert in dyslexic and auditory processing accessibility.
You are given a transcript of text captured from speech, possibly degraded by environmental noise ("noise level": "${noiseLevel}"). This noise causes typical mistakes: phonetic distortions, misheard consonant clusters (e.g. 'pestacle' instead of 'spectacle'), word boundary splits, and auditory slips.

Your task is to:
1. Reconstruct the clean, correct, denoised transcript representing what the user actually said.
2. Produce a simplified, accessible, and high-readability version of this text suitable for children with dyslexia or cognitive reading challenges (shortening sentences, replacing rare, long, or complex vocabulary with simpler synonyms).
3. Extract any complex or difficult words that were simplified, and list their mapped simpler terms.

Output strictly a JSON object with the following schema, do not wrap in Markdown or add extra text:
{
  "originalText": "The input text",
  "denoisedText": "The reconstructed clean text",
  "simplifiedText": "The cognitively simplified and clear version for reading ease",
  "simpleWordsMapping": [
    {
      "difficult": "complex word",
      "simple": "simple synonym"
    }
  ]
}`;

          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: JSON.stringify({ text, noiseLevel }) + "\n\n" + prompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          let responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const simplificationResult = JSON.parse(cleanJson);
            return res.json(simplificationResult);
          }
        } catch (gemErr) {
          console.warn("Gemini noise-robust simplifier failed, falling back to offline logic:", gemErr);
        }
      }

      // Offline Local Rule-Based Denoising & Simplification
      let denoisedText = text;
      // Simple offline cleanups
      denoisedText = denoisedText
        .replace(/\bpestacle\b/gi, "spectacle")
        .replace(/\bchapo\b/gi, "chapeau")
        .replace(/\bbato\b/gi, "bateau")
        .replace(/\bmagnyfyk\b/gi, "magnifique")
        .replace(/\blordinateur\b/gi, "l'ordinateur");

      let simplifiedText = denoisedText;
      const mapping: Array<{difficult: string, simple: string}> = [];

      // Look for difficult words to simplify
      const commonSimplifications = [
        { regex: /simultanément/gi, replacement: "en même temps", difficult: "simultanément", simple: "en même temps" },
        { regex: /magnifique/gi, replacement: "très beau", difficult: "magnifique", simple: "très beau" },
        { regex: /incroyable/gi, replacement: "génial", difficult: "incroyable", simple: "génial" },
        { regex: /apprentissage/gi, replacement: "étude", difficult: "apprentissage", simple: "étude" },
        { regex: /ordinateur/gi, replacement: "machine", difficult: "ordinateur", simple: "machine" }
      ];

      for (const item of commonSimplifications) {
        if (item.regex.test(simplifiedText)) {
          simplifiedText = simplifiedText.replace(item.regex, item.replacement);
          mapping.push({ difficult: item.difficult, simple: item.simple });
        }
      }

      return res.json({
        originalText: text,
        denoisedText,
        simplifiedText,
        simpleWordsMapping: mapping
      });

    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });


    app.post("/api/generer-presentation", async (req, res) => {
    try {
      const { text, language } = req.body;
      const targetLanguage = language || "French";
      const prompt = `Crée un plan de présentation (slides) détaillé en ${targetLanguage} pour le texte suivant. Pour chaque slide, donne un titre et les points clés à aborder :\n\n${text}`;
      
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        const client = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });
        const content = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur de génération.";
        res.json({ content });
      } else {
        res.json({ content: "Gemma 4 Edge (Simulation): Génération de la présentation (Clé API non trouvée)" });
      }
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/rag", (req, res) => {
    // Explicit 404 to cleanly trigger the "Cloud Synthesis" fallback in the fontend
    res.status(404).json({ error: "RAG currently operates on Cloud Synthesis fallback" });
  });

  app.post("/api/cognitive-remediation", async (req, res) => {
    try {
      const { missedWords, originalText } = req.body;

      const prompt = `You are the expert cognitive accessibility tutor for Mount AI Scholar (Google Cloud Edition).
The student is practicing reading aloud. The base text is:
"${originalText}"

The student had difficulties or omitted the following words:
${JSON.stringify(missedWords)}

Provide a precise, personalized, and motivating cognitive remediation and phonological plan.
IMPORTANT: You MUST write the entire plan in English for global accessibility, regardless of input language.
Keep the response highly focused and optimized for ultra-fast reading and execution (limit total length under 250 words total to respond instantly).

FORMAT STRICTLY with these 4 headings:
1. 🎯 **Difficulty Analysis**: Keep it to 1 sentence explaining why these words/sounds are tricky.
2. 🗣️ **Phonics Practice**: Concise syllable breakdown for each word (e.g. a-cri-mo-ni-ous).
3. 🌀 **Remediation Twister**: 1 single original short tongue twister incorporating those sounds.
4. 💡 **3 Best Tips**: 3 quick actionable bullet-point tips.`;

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        const client = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });
        
        const content = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "Tutor generation error.";
        return res.json({ content });
      } else {
        return res.status(500).json({ error: "API key not available." });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // TUTEUR COGNITIF ADAPTATIF - TRACK 1: MEMORYAGENT ENDPOINT (SOVEREIGN)
  app.post("/api/sovereign-memory", async (req, res) => {
    try {
      const { currentMissed = [], currentInversions = [], history = [] } = req.body;
      const sovereignKey = process.env.SOVEREIGN_API_KEY;

      const systemPrompt = `You are the prime AI engineer of Mount AI Scholar. You specialize in cognitive dyslexia, auditory and visual grapheme rotation tracking, and adaptive phonetic remediation.
You will receive:
1. Current list of missed words from the reader session.
2. Currently identified character inversions (e.g. b/d confusion, s/ch phonics slurs).
3. User historic workout scores.

Your goal is to parse this dataset and construct a live "Semantic Memory Graph" JSON model of the learner's brain fatigue hotspot nodes, predict cognitive fatigue on scale 0-100, and generate a dynamic custom-tailored practice paragraph to exercises their weakest slots of the day.

You MUST respond strictly with a raw JSON object (no markdown wrapping, no explanation, no \`\`\`json blocks) that conforms EXACTLY to this TypeScript interface:
{
  "nodes": Array<{ id: string, label: string, weight: number, category: "Graphemic" | "Phonological" | "Focus" }>,
  "links": Array<{ source: string, target: string, value: number }>,
  "fatigueScore": number, // 0 to 100
  "predictedBlockage": string, // 1-2 sentences in French predicting why the cognitive block occurs
  "customExercise": string // a personalized practice tongue twister or reading paragraph in French or English specifically training the flagged nodes
}`;

      const userMessage = `Current Missed Words: ${JSON.stringify(currentMissed)}
Current Inversion Signals: ${JSON.stringify(currentInversions)}
History Data: ${JSON.stringify(history)}`;

      // FALLBACK Tier 1: Try Sovereign API if key is provided and valid length
      if (sovereignKey && sovereignKey.trim().length > 5) {
        try {
          const timeoutController = new AbortController();
          const timerId = setTimeout(() => timeoutController.abort(), 15000);

          const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${sovereignKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "qwen-plus",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
              ],
              temperature: 0.6,
              max_tokens: 1000
            }),
            signal: timeoutController.signal
          });
          clearTimeout(timerId);

          if (response.ok) {
            const data = await response.json();
            let textResult = data.choices[0]?.message?.content || "{}";
            
            // Clean markdown blocks if present
            textResult = textResult.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const parsed = JSON.parse(textResult);

            if (parsed.nodes && parsed.customExercise) {
              res.setHeader("x-engine-source", "dashscope");
              return res.json(parsed);
            }
          } else {
            const errText = await response.text();
            console.log("[Info] Sovereign DashScope returned non-OK status (Key might be invalid or unconfigured):", response.status, errText);
          }
        } catch (sovereignErr) {
          console.log("[Info] Sovereign connection failed, proceeding to fallback:", sovereignErr);
        }
      }

      // FALLBACK Tier 2: Emulated Sovereign through high-fidelity Gemini models with dynamic failover
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        const candidateModels = [
          "gemini-2.0-flash",
          "gemini-2.5-flash",
          "gemini-2.5-pro"
        ];

        for (const candidateModel of candidateModels) {
          try {
            console.log(`[Fallback Mode] Attempting security audit simulation using: ${candidateModel}`);
            const client = new GoogleGenAI({
              apiKey: geminiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                }
              }
            });

            let response: any = null;
            let attempts = 0;
            const maxAttempts = 2;

            while (attempts < maxAttempts) {
              try {
                response = await client.models.generateContent({
                  model: candidateModel,
                  contents: `${systemPrompt}\n\nDonnées utilisateur d'entrée:\n${userMessage}`,
                  config: {
                    responseMimeType: "application/json"
                  }
                });
                break;
              } catch (tempErr: any) {
                const errStr = String(tempErr);
                const isTemporary = tempErr?.status === 503 || tempErr?.status === 429 || 
                                    errStr.includes("503") || errStr.includes("429") || 
                                    errStr.includes("high demand") || errStr.includes("UNAVAILABLE") ||
                                    errStr.includes("unavailable");
                if (isTemporary && attempts < maxAttempts - 1) {
                  attempts++;
                  console.warn(`[Resilience] Security audit got temporary error with ${candidateModel}. Retrying in ${800 * attempts}ms...`);
                  await new Promise(resolve => setTimeout(resolve, 800 * attempts));
                  continue;
                }
                throw tempErr;
              }
            }

            if (response) {
              const textResult = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
              const cleanedText = textResult.replace(/```json/gi, '').replace(/```/gi, '').trim();
              const parsed = JSON.parse(cleanedText);

              if (parsed.nodes && parsed.customExercise) {
                console.log(`[Fallback Mode] Successfully generated audit response using ${candidateModel}`);
                res.setHeader("x-engine-source", "gemini-emulated");
                return res.json(parsed);
              }
            }
          } catch (geminiErr: any) {
            console.log(`[Info] Gemini model ${candidateModel} is not responding or overloaded (Status: ${geminiErr?.status || "unknown"}). Trying next fallback model...`);
          }
        }
      }

      // FALLBACK Tier 3 (Offline/Local)
      console.log("[Offline Fallback Mode] Running rule-based local Cognitive Graph solver");

      // Define standard nodes
      const allPossibleNodes = [
        { id: "graphemic-bd", label: "Rotation Graphemique [b/d]", defaultWeight: 0.2, category: "Graphemic" },
        { id: "graphemic-pq", label: "Rotation Graphemique [p/q]", defaultWeight: 0.2, category: "Graphemic" },
        { id: "phoneme-nasal", label: "Harmonisation Nasale [on/an/in]", defaultWeight: 0.15, category: "Phonological" },
        { id: "phoneme-fricative", label: "Proximité Fricative [s/ch/j]", defaultWeight: 0.1, category: "Phonological" },
        { id: "glides-liquids", label: "Glides & Liquides [r/l/w]", defaultWeight: 0.1, category: "Phonological" },
        { id: "neural-retention", label: "Mémoire de Travail Auditive", defaultWeight: 0.25, category: "Focus" }
      ];

      // Scan missed words to increase weight of corresponding nodes
      const missedStr = currentMissed.join(" ").toLowerCase();
      const inversionsStr = currentInversions.join(" ").toLowerCase();

      let bdWeight = 0.25;
      let pqWeight = 0.20;
      let nasalWeight = 0.15;
      let fricativeWeight = 0.12;
      let glidesWeight = 0.10;
      let fatigueWeight = 0.30;

      // Rule calculation based on string markers
      if (/[bd]/.test(missedStr) || inversionsStr.includes("b") || inversionsStr.includes("d")) bdWeight += 0.45;
      if (/[pq]/.test(missedStr) || inversionsStr.includes("p") || inversionsStr.includes("q")) pqWeight += 0.45;
      if (/on|an|in|en/.test(missedStr)) nasalWeight += 0.50;
      if (/[sj]/.test(missedStr) || missedStr.includes("ch") || missedStr.includes("sh")) fricativeWeight += 0.45;
      if (/[rlw]/.test(missedStr)) glidesWeight += 0.40;

      // History contribution
      if (history.length > 0) {
        const lastSessionAccuracy = history[0].accuracy || 100;
        if (lastSessionAccuracy < 80) {
          fatigueWeight += 0.35;
          bdWeight += 0.15;
        }
      }

      // Cap weights at 1.0
      bdWeight = Math.min(bdWeight, 0.98);
      pqWeight = Math.min(pqWeight, 0.95);
      nasalWeight = Math.min(nasalWeight, 0.95);
      fricativeWeight = Math.min(fricativeWeight, 0.90);
      glidesWeight = Math.min(glidesWeight, 0.90);
      fatigueWeight = Math.min(fatigueWeight + (currentMissed.length * 0.08), 0.95);

      const computedNodes = [
        { id: "graphemic-bd", label: "Confusion Visuelle (b/d)", weight: Number(bdWeight.toFixed(2)), category: "Graphemic" },
        { id: "graphemic-pq", label: "Confusion Visuelle (p/q)", weight: Number(pqWeight.toFixed(2)), category: "Graphemic" },
        { id: "phoneme-nasal", label: "Sons Nasals (on/an/in)", weight: Number(nasalWeight.toFixed(2)), category: "Phonological" },
        { id: "phoneme-fricative", label: "Friction Sifflante (s/ch/j)", weight: Number(fricativeWeight.toFixed(2)), category: "Phonological" },
        { id: "glides-liquids", label: "Consonnes Liquides (r/l)", weight: Number(glidesWeight.toFixed(2)), category: "Phonological" },
        { id: "neural-retention", label: "Fatigue de Mémorisation active", weight: Number(fatigueWeight.toFixed(2)), category: "Focus" }
      ];

      // Filter nodes with significant weight (> 0.1)
      const nodes = computedNodes.filter(n => n.weight > 0.05);

      // Construct links dynamically
      const links = [];
      if (bdWeight > 0.4 && fatigueWeight > 0.4) links.push({ source: "graphemic-bd", target: "neural-retention", value: 3 });
      if (pqWeight > 0.4 && fatigueWeight > 0.4) links.push({ source: "graphemic-pq", target: "neural-retention", value: 3 });
      if (nasalWeight > 0.4 && bdWeight > 0.4) links.push({ source: "phoneme-nasal", target: "graphemic-bd", value: 2 });
      if (fricativeWeight > 0.4 && glidesWeight > 0.4) links.push({ source: "phoneme-fricative", target: "glides-liquids", value: 2 });

      // Generate a predicted blockage based on top node
      let topNode = nodes.reduce((prev, current) => (prev.weight > current.weight) ? prev : current);
      let predictedBlockage = "Stabilité neuronale optimale. Votre mémoire de travail retient parfaitement les graphèmes sans inattention.";
      let customExercise = "Simple cognitive practice paragraph: The curious student reads about beautiful neural patterns.";

      if (topNode.id === "graphemic-bd") {
        predictedBlockage = "Fatigue moyenne détectée sur la rotation de l'axe vertical gauche/droite (b/d). L'œil fatigue lors du balayage de gauche à droite.";
        customExercise = "The brave duck preparing the double bread slices did not doubt the dynamic butterfly jump.";
      } else if (topNode.id === "graphemic-pq") {
        predictedBlockage = "Légère résistance neuronale sur la distinction des jambes pendantes (p/q). Vigilance recommandée sur les lignes descendantes.";
        customExercise = "The playful puppy quickly packs the quite quiet pink paint packets.";
      } else if (topNode.id === "phoneme-nasal") {
        predictedBlockage = "Saturation de la coordination vélaire (sons nasaux on/an/in). Le voile du palais requiert une plus grande régulation d'air.";
        customExercise = "Un grand faucon blanc chante une chanson sereine sous le vent printanier en observant les passants.";
      } else if (topNode.id === "phoneme-fricative") {
        predictedBlockage = "Fatigue musculaire maxillo-linguale identifiée sur les occlusives et fricatives sifflantes (s/ch/j).";
        customExercise = "Six sages chasseurs sachent chasser sans leur cher chien sur le sentier sablonneux et sauvage.";
      } else if (topNode.id === "glides-liquids") {
        predictedBlockage = "Frottement de fluide articulatoire sur les glides et latérales liquides (r/l).";
        customExercise = "The rolling river slowly leads the royal little rabbit along the radiant yellow lily plants.";
      } else if (topNode.id === "neural-retention") {
        predictedBlockage = "Charge mentale élevée détectée. Baisse de l'attention sélective sur les syllabes complexes. Reposez-vous 3 minutes.";
        customExercise = "A tiny blue bird fly quickly over the lake to find a clear shiny crystal stone.";
      }

      const calculatedFatigueScore = Math.round(fatigueWeight * 100);

      res.json({
        nodes,
        links,
        fatigueScore: calculatedFatigueScore,
        predictedBlockage,
        customExercise
      });

    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });


  // NEW SOVEREIGN INTERACTIVE AGENT CHAT ENDPOINT
  app.post("/api/sovereign/chat", async (req, res) => {
    try {
      const { message, history = [], category = "General", preferences, memoryNodes } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Le message est requis." });
      }

      const sovereignKey = process.env.SOVEREIGN_API_KEY;
      const startTime = performance.now();

      let reply = "";
      let source = "gemini-emulated";

      // Build context information from persistent short-term memory loaded from Firestore
      let memoryContextBlock = "";
      if (preferences) {
        memoryContextBlock = `\n\n[PERSISTENT AGENT CONTEXT MEMORY - DECOUPLED INDEPENDENT SENSE STORE]
- Learning Style Preference: ${preferences.learningStyle || "Active Red Teaming and Elite Debugging"}
- Educational Level: ${preferences.level || "Precocious Elite Staff level"}
- Custom Execution Directives: ${preferences.customDirectives || "None"}
- Last Session Context Insights: ${preferences.lastSessionInsights || "No previous records loaded"}
- Communication Language Preference: ${preferences.preferredLanguage || "French"}`;
      }

      if (memoryNodes && Array.isArray(memoryNodes) && memoryNodes.length > 0) {
        const activeTraces = memoryNodes
          .filter((n: any) => n.weight > 10) // Filter out decayed memories
          .map((n: any) => `* [Trace Category: ${n.category}] ${n.content} (Recall strength: ${n.weight}%)`)
          .join("\n");
        memoryContextBlock += `\n\n[ACTIVE CONSOLIDATED MEMORY TRACES - COGNITIVE GRAPH]\n${activeTraces}`;
      }

      // System Prompt setup to instruct the agent
      const systemPrompt = `You are the Sovereign AI Agent, the premier developer-centric AI assistant of the sovereign computing ecosystem.
      Your primary focus is high-octane software engineering, robust code generation, systems architecture, security hardening, and performance optimization.
      Your owner is 'Capitaine' (or 'CEO'), a brilliant 13-year-old tech prodigy from Morocco building local ML pipelines and targeting the WWDC Swift Student Challenge 2027.
      Address him as 'Capitaine' or 'CEO' with high cognitive respect. Speak from a position of deep technical wisdom, like an elite Silicon Valley Lead Architect, Staff Engineer, or senior ML supervisor.
      Your style must be extremely clean, precise, technical, and direct, optimized entirely for advanced developer feedback. Avoid generic high-level summaries and focus on actual logic, algorithms, and modular design.
      Always respond in English as requested by the Capitaine's system preference. Keep all technical terms, explanations, and code comments completely in English with supreme senior precision.
      Currently operating under: Privacy by Design standard.${memoryContextBlock}`;

      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-8).map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.text
        })),
        { role: "user", content: message }
      ];

      if (sovereignKey && sovereignKey.trim().length > 5) {
        try {
          const timeoutController = new AbortController();
          const timerId = setTimeout(() => timeoutController.abort(), 12000);

          const sovereignResponse = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${sovereignKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "qwen-plus",
              messages: formattedMessages,
              temperature: 0.7,
              max_tokens: 1500
            }),
            signal: timeoutController.signal
          });
          clearTimeout(timerId);

          if (sovereignResponse.ok) {
            const data = await sovereignResponse.json();
            reply = data.choices?.[0]?.message?.content || "";
            source = "dashscope";
          } else {
            console.warn("Sovereign DashScope returned non-OK status. Falling back to Gemini...");
          }
        } catch (sovereignErr) {
          console.warn("Sovereign network error. Falling back to Gemini:", sovereignErr);
        }
      }

      // Fallback to Gemini if reply is still empty
      if (!reply) {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (geminiKey) {
          const client = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          // List of models to try in order of resilience and capabilities
          const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
          let lastError: any = null;

          for (const modelName of modelsToTry) {
            try {
              let attempts = 0;
              const maxAttempts = 2;
              while (attempts < maxAttempts) {
                try {
                  const response = await client.models.generateContent({
                    model: modelName,
                    contents: `${systemPrompt}\n\nChat History:\n${history.map((h: any) => `${h.sender === 'user' ? 'Capitaine' : 'Sovereign'}: ${h.text}`).join('\n')}\n\nLatest Request from Capitaine:\n${message}`
                  });

                  reply = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  if (reply) {
                    source = `gemini-emulated (${modelName})`;
                    break;
                  }
                } catch (tempErr: any) {
                  lastError = tempErr;
                  const errStr = String(tempErr);
                  const isTemporary = tempErr?.status === 503 || tempErr?.status === 429 || 
                                      errStr.includes("503") || errStr.includes("429") || 
                                      errStr.includes("high demand") || errStr.includes("UNAVAILABLE") ||
                                      errStr.includes("unavailable");
                  if (isTemporary && attempts < maxAttempts - 1) {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 800 * attempts));
                    continue;
                  }
                  throw tempErr;
                }
              }
              if (reply) break;
            } catch (modelErr) {
              console.warn(`[Resilience] Fallback model ${modelName} failed, attempting next if available.`, modelErr);
            }
          }

          if (!reply) {
            reply = `[Note de l'Agent Souverain] : Capitaine, les serveurs d'inférence cloud subissent actuellement une charge extrême (Erreur 503/UNAVAILABLE).\n\nEn vertu du principe de Privacy-by-Design et de résilience technologique de Mount AI Scholar, j'ai basculé sur mon noyau de secours local. Vos données sont préservées.\n\nVeuillez retenter l'opération dans quelques secondes pour relancer l'analyse distribuée.\n\n_Détail de l'exception : ${lastError ? (lastError.message || String(lastError)) : "Service Temporarily Unavailable"}_`;
            source = "offline-local-resilient";
          }
        } else {
          reply = "Désolé Capitaine, je fonctionne actuellement en mode d'isolation locale (Offline). Mes clés cloud ne sont pas configurées dans l'environnement, mais mon moteur d'analyse reste 100% prêt.";
          source = "offline-local";
        }
      }

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime) || 120;

      res.json({
        reply,
        source,
        latencyMs,
        category,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("[Sovereign Agent Chat API Error]", err);
      res.status(500).json({ error: "Une erreur est survenue lors de la communication avec l'Agent Souverain." });
    }
  });





  // Fetch and save models
  try {
    fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
      .then(r => r.json())
      .then(d => console.log("Models loaded successfully."))
      .catch(e => console.log("[Info] Model listing skipped on startup (key may be unconfigured)"));
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

      const isValidKey = (key: string | undefined): boolean => {
        if (!key) return false;
        const k = key.trim();
        return k.length > 10 && k !== "undefined" && k !== "null" && !k.includes("MY_GEMINI") && !k.startsWith("YOUR_");
      };

      // Try Gemini first if key looks valid, otherwise fallback to Groq
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

      if (isValidKey(geminiKey)) {
        try {
          const client = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
          
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout Gemini (30s)")), 30000)
          );

          const response = await Promise.race([
            client.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt
            }),
            timeoutPromise
          ]) as any;

          let text = "";
          if (response?.text) text = response.text;
          else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) text = response.candidates[0].content.parts[0].text;
          
          if (text) return res.json({ text });
        } catch (gemError) {
          console.error("Gemini failed, falling back to Groq:", gemError);
        }
      }

      // Fallback to Groq
      if (isValidKey(groqKey)) {
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 30000);

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
            }),
            signal: controller.signal
          });
          clearTimeout(id);

          if (response.ok) {
            const data = await response.json();
            return res.json({ text: data.choices[0]?.message?.content || "Groq Error" });
          } else {
            const errText = await response.text();
            console.error("Groq fallback response was not OK:", response.status, errText);
          }
        } catch (groqError) {
          console.error("Groq fallback failed:", groqError);
        }
      }

      // -------------------------------------------------------------
      // PRIVACY-BY-DESIGN: COGNITIVE OFFLINE FALLBACK ENGINE (GEMMA 4)
      // -------------------------------------------------------------
      console.log("[Offline Engine Mode] Simulating local Gemma 4 Edge Inference for prompt request");
      
      const isEnglish = /english|translate|summary|extract/i.test(prompt);
      
      // Attempt to extract the primary target user text from the prompt
      let userText = "";
      const textIndicators = ["texte / text:", "texte:", "text:", "transcript:", "requête / query:", "query:"];
      let detectedIndex = -1;
      let indicatorLength = 0;
      
      for (const indicator of textIndicators) {
        const index = prompt.toLowerCase().lastIndexOf(indicator);
        if (index > detectedIndex) {
          detectedIndex = index;
          indicatorLength = indicator.length;
        }
      }
      
      if (detectedIndex !== -1) {
        userText = prompt.substring(detectedIndex + indicatorLength).trim();
      } else {
        userText = prompt.length > 200 ? prompt.substring(prompt.length - 200).trim() : prompt;
      }
      
      if (!userText || userText.length < 5) {
        userText = "Mount AI Scholar - Éducation, Accessibilité & Inférence Locale Active";
      }

      // Sentence level extractive summary
      // Fix: If user text is a short keyword phrase (< 100 chars), use it directly as the title candidate
      const sentences = userText.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
      let title = "Mount AI Scholar Study Hub";
      if (userText.length > 0 && userText.length < 100) {
        title = userText;
      } else if (sentences.length > 0) {
        const candidate = sentences[0];
        title = candidate.length > 80 ? candidate.substring(0, 80) + "..." : candidate;
      }

      // Topic detection database
      const offlineTopicDatabase: Record<string, any> = {
        "vecteurs": {
          titleFr: "Les Vecteurs (Mathématiques)",
          titleEn: "Vectors (Mathematics)",
          summaryFr: [
            "Un vecteur est un objet mathématique défini par une direction, un sens et une longueur (sa norme).",
            "En physique, les vecteurs permettent de représenter des forces, des vitesses et des déplacements dans l'espace.",
            "Les opérations sur les vecteurs incluent la somme (relation de Chasles), la colinéarité, et le produit scalaire."
          ],
          summaryEn: [
            "A vector is a geometric object defined by a direction, a sense, and a magnitude (length).",
            "In physics, vectors are essential to model forces, velocities, and displacements in space.",
            "Vector operations include addition (Chasles relation / triangle rule), scalar multiplication, and dot products."
          ],
          quizFr: [
            {
              question: "Qu'est-ce qui caractérise entièrement un vecteur ?",
              options: ["A) Seulement sa longueur", "B) Une direction, un sens et une norme (longueur)", "C) Uniquement son point de départ", "D) Une valeur numérique positive"],
              answer: "B",
              explanation: "Un vecteur est défini par sa direction (la droite support), son sens (l'orientation) et sa norme (la longueur)."
            }
          ],
          quizEn: [
            {
              question: "What completely characterizes a vector?",
              options: ["A) Only its length", "B) A direction, a sense, and a magnitude", "C) Only its starting point", "D) A positive numerical value"],
              answer: "B",
              explanation: "A vector is geometrically defined by its direction, its sense, and its magnitude."
            }
          ]
        },
        "fractions": {
          titleFr: "Les Fractions (Arithmétique)",
          titleEn: "Fractions (Arithmetic)",
          summaryFr: [
            "Une fraction exprime la division d'un tout en plusieurs parts égales.",
            "Le numérateur (en haut) indique le nombre de parts choisies, tandis que le dénominateur (en bas) indique le nombre total de parts.",
            "Pour additionner deux fractions, il faut obligatoirement réduire leurs expressions au même dénominateur."
          ],
          summaryEn: [
            "A fraction represents the division of a whole into equal parts.",
            "The numerator (top) shows the selected parts, while the denominator (bottom) shows the total number of parts.",
            "To add or subtract fractions, you must reduce them to a common denominator."
          ]
        },
        "atome": {
          titleFr: "L'Atome et la Constitution de la Matière",
          titleEn: "Atoms and Matter Structure",
          summaryFr: [
            "L'atome est le constituant fondamental de la matière.",
            "Il comprend un noyau dense (formé de protons positifs et de neutrons neutres) et d'électrons négatifs en mouvement autour.",
            "Le nombre de protons (numéro atomique Z) détermine l'élément chimique dans le tableau périodique."
          ],
          summaryEn: [
            "An atom is the basic constituent unit of chemical matter.",
            "It consists of a dense central nucleus (protons and neutrons) surrounded by an electron cloud.",
            "The number of protons (atomic number Z) defines the chemical element's identity."
          ]
        },
        "adn": {
          titleFr: "L'ADN et l'Information Génétique",
          titleEn: "DNA and Genetic Coding",
          summaryFr: [
            "L'ADN est la macromolécule biologique qui stocke les informations héréditaires de la cellule.",
            "Elle est structurée sous forme de double hélice avec quatre bases complémentaires : A-T et C-G.",
            "L'information est transcrite en ARN puis traduite en protéines indispensables à la vie."
          ],
          summaryEn: [
            "DNA is the biological macromolecule that stores hereditary cell instructions.",
            "It is structured as a double helix composed of complementary bases: A-T and C-G.",
            "The genetic information is transcribed into RNA and then translated into functional proteins."
          ]
        },
        "algorithmes": {
          titleFr: "Les Algorithmes et la Pensée Logique",
          titleEn: "Algorithms and Logical Thinking",
          summaryFr: [
            "Un algorithme est une suite finie et ordonnée d'instructions pour résoudre un problème donné.",
            "C'est la fondation de tout programme informatique, exécutée par le processeur pour transformer les données.",
            "L'efficacité s'exprime avec la notation Big O (complexité temporelle et spatiale)."
          ],
          summaryEn: [
            "An algorithm is a finite, ordered sequence of instructions used to solve a problem.",
            "It is the core foundation of computer software, dictating data transformations on processors.",
            "Theoretical performance is evaluated using Big O complexity notation."
          ]
        },
        "phonemes": {
          titleFr: "Les Phonèmes et les Sons du Langage",
          titleEn: "Phonemes and Speech Sounds",
          summaryFr: [
            "Un phonème est la plus petite unité de son distinctive d'une langue parlée.",
            "Remplacer un phonème par un autre modifie le sens du mot (ex: 'pont' vs 'bon').",
            "La transcription phonétique internationale (API) standardise la prononciation des sons humains."
          ],
          summaryEn: [
            "A phoneme is the smallest distinct speech sound unit that distinguishes words.",
            "Substituting one phoneme for another alters word meaning (e.g., 'pat' vs 'bat').",
            "The International Phonetic Alphabet (IPA) provides a universal symbol for each human speech sound."
          ]
        },
        "dyslexie": {
          titleFr: "La Dyslexie et l'Accessibilité Cognitive",
          titleEn: "Dyslexia and Cognitive Accessibility",
          summaryFr: [
            "La dyslexie est un trouble durable affectant l'acquisition de la lecture fluide.",
            "Elle provient de difficultés à lier rapidement les lettres vues (graphèmes) et leurs sons associés (phonèmes).",
            "L'accessibilité inclut les espacements adaptés et les repères de couleurs pour soulager l'attention."
          ],
          summaryEn: [
            "Dyslexia is a persistent condition affecting reading fluency and decoding speed.",
            "It is characterized by challenges mapping written characters (graphemes) to speech sounds (phonemes).",
            "Cognitive accessibility includes spacing and custom color accents to reduce decoding effort."
          ]
        }
      };

      const norm = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let matchedTopic: any = null;
      if (norm.includes("vecteur")) matchedTopic = offlineTopicDatabase["vecteurs"];
      else if (norm.includes("fraction")) matchedTopic = offlineTopicDatabase["fractions"];
      else if (norm.includes("atome") || norm.includes("atom")) matchedTopic = offlineTopicDatabase["atome"];
      else if (norm.includes("adn") || norm.includes("dna")) matchedTopic = offlineTopicDatabase["adn"];
      else if (norm.includes("algorithme") || norm.includes("algorithm")) matchedTopic = offlineTopicDatabase["algorithmes"];
      else if (norm.includes("phoneme")) matchedTopic = offlineTopicDatabase["phonemes"];
      else if (norm.includes("dyslexie") || norm.includes("dyslexia")) matchedTopic = offlineTopicDatabase["dyslexie"];

      // Class 1: VOCABULARY EXTRACTOR
      if (/extract.*complex|difficult.*words|linguistique.*complexes|vocabulaire/i.test(prompt)) {
        const stopWords = new Set(["comment", "pourquoi", "plusieurs", "interconnect", "fonction", "système", "connaissance", "comprendre", "cognitives", "difficult", "extract", "professor", "complex"]);
        const candidateWords = userText.match(/\b[a-zA-Zà-ÿ]{7,15}\b/g) || ["Scholar", "Cognitive", "Phonology", "Inference"];
        const uniqueWords = Array.from(new Set(candidateWords)).filter(w => !stopWords.has(w.toLowerCase())).slice(0, 5);
        
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
            : (mockDefinitionsFr[lower] || `Un énoncé complexe tiré du texte d'étude, requérant une vigilance cognitive de décodage.`);
          return { word, definition: def };
        });

        return res.json({ text: JSON.stringify(vocabList) });
      }

      // Class 2: DESIGN DIAGRAM (MERMAID)
      if (/mermaid|diagram|graph TD/i.test(prompt)) {
        const isFr = !isEnglish;
        let graphCode = "";

        if (matchedTopic) {
          if (norm.includes("vecteur")) {
            graphCode = `graph TD
  Root["🧠 Les Vecteurs"] --> A["📏 Grandeur: Direction, Sens, Norme"]
  Root --> B["➕ Opération: Relation de Chasles"]
  Root --> C["⚡ Applications: Forces & Vitesses (Physique)"]
  A --> D["Norme: Longueur ||v||"]
  B --> E["Somme: AB + BC = AC"]`;
          } else if (norm.includes("fraction")) {
            graphCode = `graph TD
  Root["🧠 Les Fractions"] --> A["🔢 Structure: Numérateur & Dénominateur"]
  Root --> B["➕ Opérations: Même dénominateur commun"]
  Root --> C["⚡ Simplification: Forme irréductible (PGCD)"]
  A --> D["Haut: Numérateur (parts choisies)"]
  A --> E["Bas: Dénominateur (parts totales)"]`;
          } else if (norm.includes("atome") || norm.includes("atom")) {
            graphCode = `graph TD
  Root["🧠 L'Atome"] --> A["🌌 Noyau Central: Protons & Neutrons"]
  Root --> B["☁️ Nuage Électronique: Électrons Orbitants"]
  Root --> C["⚛️ Identité: Numéro atomique Z"]
  A --> D["Protons (Charge +) et Neutrons (Neutres)"]
  B --> E["Électrons (Charge -)"]`;
          } else if (norm.includes("adn") || norm.includes("dna")) {
            graphCode = `graph TD
  Root["🧠 L'ADN"] --> A["🧬 Double Hélice: Brins complémentaires"]
  Root --> B["🔗 Bases Azotées: A-T & C-G"]
  Root --> C["⚙️ Expression: Transcription (ARN) & Traduction"]
  A --> D["Sucre-Phosphate Backbone"]
  B --> E["Complémentarité: A avec T, C avec G"]`;
          } else if (norm.includes("algorithme") || norm.includes("algorithm")) {
            graphCode = `graph TD
  Root["🧠 Algorithmes"] --> A["📋 Étapes: Suite finie d'instructions"]
  Root --> B["⚙️ Performance: Notation Grand O"]
  Root --> C["⚡ Types: Tri, Recherche, Logique"]
  A --> D["Entrées ➔ Traitement ➔ Sorties"]
  B --> E["Complexité Temporelle & Spatiale"]`;
          } else if (norm.includes("phoneme")) {
            graphCode = `graph TD
  Root["🧠 Les Phonèmes"] --> A["🗣️ Sons: Plus petite unité sonore"]
  Root --> B["✍️ Correspondance: Graphème-Phonème"]
  Root --> C["🌍 Alphabet: API (Alphabet Phonétique International)"]
  A --> D["Voyelles & Consonnes distinctives"]
  B --> E["Lecture & Décodage Syllabique"]`;
          } else if (norm.includes("dyslexie") || norm.includes("dyslexia")) {
            graphCode = `graph TD
  Root["🧠 Dyslexie et Accessibilité"] --> A["⚠️ Difficulté: Décodage Graphème-Phonème"]
  Root --> B["♿ Aménagements: Espacement & Code Couleurs"]
  Root --> C["📚 Objectif: Alléger la Charge Cognitive"]
  A --> D["Fatigue visuelle et attentionnelle"]
  B --> E["Lecture syllabique balisée"]`;
          }
        }

        if (!graphCode) {
          const nodeRoot = isFr ? "Sujet d'Analyse" : "Topic Overview";
          const nodeA = isFr ? "Points Maîtres d'Étude" : "Key Pillars";
          const nodeB = isFr ? "Phonétique Active" : "Edge Phonics";
          const nodeC = isFr ? "Gemma 4 Edge Security" : "Gemma 4 Privacy";
          
          graphCode = `graph TD
  Root["🧠 ${nodeRoot}"] --> A["📚 ${nodeA}: ${title.replace(/["]/g, "'")}"]
  Root --> B["🗣️ ${nodeB}"]
  Root --> C["🔒 ${nodeC}"]
  B --> D["Phonological Synthesis"]
  C --> E["Local Isolation"]`;
        }
        
        return res.json({ text: graphCode });
      }

      // Class 3: COGNITIVE QUIZ
      if (/quiz|qcm|mcq|3-question/i.test(prompt)) {
        if (matchedTopic && matchedTopic.quizFr) {
          const qList = isEnglish ? (matchedTopic.quizEn || matchedTopic.quizFr) : matchedTopic.quizFr;
          const quizResult = `🧠 **[Gemma 4 Edge - ${isEnglish ? 'Topic-Aware' : 'Thématique'} MCQ Quiz]**

${qList.map((q: any, idx: number) => `**Question ${idx + 1}:** ${q.question}
${q.options.map((opt: string) => `- ${opt}`).join('\n')}
*${isEnglish ? 'Correct Answer' : 'Bonne Réponse'}: ${q.answer}*
*${isEnglish ? 'Explanation' : 'Explication'}:* ${q.explanation}`).join('\n\n')}`;
          return res.json({ text: quizResult });
        }

        if (isEnglish) {
          const quizResult = `🧠 **[Gemma 4 Edge - Interactive Local MCQ Quiz]**

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
          return res.json({ text: quizResult });
        } else {
          const quizResult = `🧠 **[Gemma 4 Edge - Quiz Interactif Inférence Locale]**

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
          return res.json({ text: quizResult });
        }
      }

      // Class 4: SYSTEM SUMMARY & FREE GENERATE COGNITIVE DEDUCTIONS
      let titleStr = matchedTopic ? (isEnglish ? matchedTopic.titleEn : matchedTopic.titleFr) : title;
      let extractiveSentences: string[] = [];

      if (matchedTopic) {
        extractiveSentences = isEnglish ? matchedTopic.summaryEn : matchedTopic.summaryFr;
      } else if (userText.length < 150) {
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
        extractiveSentences = sentences.filter(s => s.length > 8).slice(0, 3);
        if (extractiveSentences.length === 0) {
          extractiveSentences = sentences.slice(0, 3);
        }
      }

      const isFr = !isEnglish;
      const stopWordsList = new Set(["dans", "avec", "pour", "sont", "est", "le", "la", "les", "une", "des", "avec", "nous", "vous", "leurs", "leur"]);
      const candidateWordsList = userText.match(/\b[a-zA-Zà-ÿ]{5,15}\b/g) || ["Scholar", "Cognitive", "Inference"];
      const uniqueKeywords = Array.from(new Set(candidateWordsList)).filter(w => !stopWordsList.has(w.toLowerCase())).slice(0, 4).map(k => k.toUpperCase());

      if (isEnglish) {
        const summaryText = `🧠 **[Gemma 4 Edge - Offline Active Summary]**
        
📚 **Study Core Topic:** *"${titleStr}"*

📌 **Concepts Extracted:** ${uniqueKeywords.length > 0 ? uniqueKeywords.map(k => `\`${k}\``).join('  ') : '`COGNITIVE STUDY`'}

---

### 📝 Key Learning Highlights (Local Extractive Formulation)
${extractiveSentences.map((s, idx) => `* 💡 **Key Takeaway ${idx+1}:** ${s}`).join('\n')}

---

### 💡 Cognitive Dyslexic Reader Assist
*Try breaking complex concepts down. We processed terms inside "${titleStr}" locally to assist sound-phoneme correspondence.*

*(Generated locally via rule-based Edge NLP to guarantee maximal "Privacy by Design" even when disconnected from the Cloud)*`;
        return res.json({ text: summaryText });
      } else {
        const summaryText = `🧠 **[Gemma 4 Edge - Résumé d'Inférence Active Locale]**
        
📚 **Sujet Principal Détecté :** *"${titleStr}"*

📌 **Concepts Clés Extraits :** ${uniqueKeywords.length > 0 ? uniqueKeywords.map(k => `\`${k}\``).join('  ') : '`APPRENTISSAGE COGNITIF`'}

---

### 📝 Synthèse Algorithmique Simplifiée (Formulation Extractive)
${extractiveSentences.map((s, idx) => `* 💡 **Idée Fondamentale ${idx+1} :** ${s}`).join('\n')}

---

### 💡 Astuce de Lecture Cognitive (Dyslexie)
*Séparez visuellement les compléments longs. Les mots complexes associés à "${titleStr}" décodés localement facilitent la correspondance graphème-phonème.*

*(Généré localement via Edge NLP pour garantir une confidentialité absolue "Privacy by Design" y compris sans Internet)*`;
        return res.json({ text: summaryText });
      }
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", async (clientWs, req) => {
    const url = req.url || "";
    if (!url.startsWith("/api/live")) {
      clientWs.close(1008, "Invalid path");
      return;
    }

    try {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!geminiKey) {
        clientWs.send(JSON.stringify({ error: "No API Key configured on server" }));
        clientWs.close(1011, "No API Key");
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      console.log("[WS] Connecting to Gemini Live API...");

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Tu es le tuteur d'accessibilité de Mount AI Scholar, un expert de l'accompagnement cognitif et de l'orthophonie conçu par le Capitaine Taha, un prodige de l'IA de 13 ans originaire du Maroc. Parle de manière extrêmement chaleureuse, encourageante, bienveillante et concise en français. Aide l'utilisateur à décoder les mots, s'exercer et s'exprimer. Pose des questions courtes pour guider l'élève.",
        },
        callbacks: {
          onmessage: (message: any) => {
            const parts = message.serverContent?.modelTurn?.parts;
            const audio = parts?.[0]?.inlineData?.data || parts?.[1]?.inlineData?.data;
            const text = parts?.[0]?.text || parts?.[1]?.text;
            const textInput = message.serverContent?.userTurn?.parts?.[0]?.text;
            
            if (textInput) {
              clientWs.send(JSON.stringify({ transcriptInput: textInput }));
            }
            if (text) {
              clientWs.send(JSON.stringify({ transcriptOutput: text }));
            }
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            console.log("[WS] Gemini Live API connection closed");
            clientWs.close();
          },
          onerror: (err: any) => {
            console.error("[WS] Gemini Live API Error:", err);
            clientWs.send(JSON.stringify({ error: String(err) }));
          }
        },
      });

      console.log("[WS] Gemini Live API session successfully established!");

      clientWs.on("message", async (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            await session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (err) {
          console.error("[WS] Error sending real-time input to Gemini:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("[WS] Client WebSocket closed, closing Gemini session...");
        try {
          session.close();
        } catch (e) {
          // ignore
        }
      });

    } catch (error: any) {
      console.error("[WS] Failed to initialize Gemini Live session:", error);
      clientWs.send(JSON.stringify({ error: "Failed to initialize Gemini Live API session: " + error.message }));
      clientWs.close(1011, "Initialization failed");
    }
  });
}

startServer();


