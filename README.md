# 🧠 Technical Architecture
The project is divided into two major architectural phases:

### 1. ML & Web Foundation (Current Phase)
Cross-platform web training and inference to prepare the models.
- **Web Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
- **Backend & Auth:** Node.js/Express, Firebase (Auth & Firestore).
- **ML Engine & API:** Python, FastAPI, **Google Gemma 4 (Local Edge Inference)**.
- **Search & Indexing:** Elasticsearch.

### 2. Apple Ecosystem (2027 WWDC Goal)
Native deployment with a spatial interface.
- **Environment:** iPadOS, visionOS.
- **Technologies:** SwiftUI, ARKit, CoreML (Porting Gemma 4 Edge to Apple Silicon)
- ## 🏆 Kaggle/DeepMind Hackathon: The Gemma 4 Advantage (Privacy by Design)
*Note to judges: The video demo focuses on the frontend UX, but the core cognitive engine relies on Gemma.*

Handling children's educational and cognitive data (Dyslexia tracking, voice analysis) involves highly sensitive PII. Sending this data to external Cloud LLM APIs is a privacy risk.

To solve this, Mount AI Scholar implements **Gemma 4 Edge Inference**:
1. **100% Local Processing:** The Presentation and Simplification Engine (`ml_engine_prototype.py`) runs Gemma 4 entirely locally.
2. **Privacy by Design:** By using Gemma 4 locally via Python, no biometric or cognitive data ever leaves the student's workstation. 
3. **Optimized for Neurodiversity:** Gemma 4 is instruction-tuned to break down complex texts into phoneme-friendly, dyslexia-adapted summaries without latency spikes.

*(Check `src/App.tsx` [lines 265-290] and `ml_engine_prototype.py` to see the local Edge AI routing).*
