# 🏔️ Mount AI Scholar

The ascent to educational excellence and cognitive accessibility.

## 🚀 Project Vision

**Mount AI Scholar** is a next-generation learning platform designed to adapt to neurodiversity. Whether it's overcoming the challenges of dyslexia through phoneme-grapheme correspondence or providing visual feedback for the deaf and hard of hearing, the AI engine adapts content in real-time.

**Ultimate Goal:** WWDC Swift Student Challenge 2027.

## 🧠 Technical Architecture

The project is divided into two major architectural phases:

### 1. ML & Web Foundation (Current Phase)
Cross-platform web training and inference to prepare the models.
* **Web Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
* **Backend & Auth:** Node.js/Express, Firebase (Auth & Firestore).
* **ML Engine & API:** Python, FastAPI, Hugging Face Transformers.
* **Search & Indexing:** Elasticsearch.

### 2. Apple Ecosystem (2027 Goal)
Native deployment with a spatial interface.
* **Environment:** iPadOS, visionOS.
* **Technologies:** SwiftUI, ARKit, CoreML (Python model porting).

## ✨ Key Features

*   **🎙️ Real-Time Voice Analyzer:** Listens and analyzes pronunciation to provide instant corrections.
*   **🧩 Dyslexia Mode:** Advanced visual decomposition of phonemes and graphemes to facilitate reading.
*   **👁️ Deafness Mode:** Visual translation of audio signals and frequencies.
*   **🌍 Multilingual:** Native support for 8 languages for revisions and quizzes.
*   **📊 Analytical Dashboard:** Tracks performance and learning progression via AI.

## 🛠️ Installation & Setup (Web Environment)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/mount-ai-scholar.git

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file based on .env.example with Firebase & Gemini keys

# 4. Start the development server
npm run dev
```

## 🔐 Security & Invariants
* Models securely hosted via FastAPI.
* Strict configuration of Firestore rules (`firestore.rules`) to protect student PII data.

---
*Push your limits. Secure the base.*

