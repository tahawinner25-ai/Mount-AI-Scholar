import { GoogleGenAI } from '@google/genai';
async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(data);
  } catch(e) { console.error(e); }
}
run();
