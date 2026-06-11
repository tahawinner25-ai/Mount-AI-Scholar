# COGNITIVE ARENA - 3-MINUTE DEMO VIDEO SCRIPT
**Submission Track:** Google Cloud Rapid Agent Hackathon / Build with Gemini XPRIZE
**Speaker & Presenter:** Taha / CEO, Mount AI Scholar (Fast-paced, hyper-technical, Silicon Valley style)

---

## ⏱️ TIMELINE & VISUALS OVERVIEW

### 0:00 - 0:40 | The Problem & The Mission (Vibe: Apple Keynote Startup Pitch)
* **Visual:** Close-up on the Mount AI Scholar Dashboard showing the dark, elegant glassmorphism UI. Hover over the Cognitive Arena launcher. 
* **Audio / Voiceover:**
  > "Hello everyone. I’m Taha, CEO and Lead Architect at Mount AI Scholar. 
  > Over 10% of children worldwide wrestle with dyslexia, auditory processing disorders, and graphemephonological speech barriers. 
  > Current software is rigid, uninspired, and routinely leaks private audio records to cloud brokers. 
  > We designed **Cognitive Arena** to change this. 
  > It is a real-time, privacy-first cognitive simulator built on a highly optimized full-stack architecture that transforms corrective speech therapy into an active, low-latency visual training ground."

### 0:40 - 1:30 | Technical Architecture: Hybrid Edge & Resilient Orchestration
* **Visual:** Switch window to the "Analyse Phonémique" monitor. Show speaking into the mic. The Phoneme analysis panel dynamically parses words into International Phonetic Alphabet (IPA) representations.
* **Audio / Voiceover:**
  > "Let's talk engineering. Privacy-by-design is our core directive. 
  > In production, our primary engine is a quantized **Gemma 4 Edge Inference model** running locally via a high-performance Python FastAPI microservice. Under 25ms of latency, it computes token-level transcript alignment to protect children's voice data locally under strict COPPA compliance guidelines.
  > If the edge goes dark, our custom hybrid router reacts instantly. 
  > It hot-swaps to our server-side Node.js proxy, querying **Gemini 3.5 Flash** for deep linguistic transcript-to-IPA mapping, returning parsed phonemes within milliseconds.
  > We built similar fault-tolerant logic for Speech Synthesis: the UI streams highly custom sound-vibe configurations from Gemini’s TTS, and degrades gracefully to **native client-side Speech Synthesis** if API limits are saturated, maintaining 100% therapy uptime."

### 1:30 - 2:20 | Core Interactive Demo: Graphemic Remediation in the Arena
* **Visual:** Select the "Graphemic Confusion [b/d/p/q]" workout. Toggle speech capture. Read: *"The brave duck stepped on the pond"* but mispronounce *"duck"* as *"duck-t"*.
* **Audio / Voiceover:**
  > "Let’s run an active drill. Graphemic confusion of letter shapes like 'b', 'd', 'p', or 'q' is a hallmark of dyslexic reading.
  > As the student speaks, our real-time micro-batch processing engine highlights correctly spoken words of the sentence in vivid green.
  > Notice the mispronunciation I simulated. The engine flags it, updates the historic tracking state stored in Firestore, and allows the user to immediately initialize our **Adaptive Remediation Engine**.
  > Instantly, **Gemini** analyzes the phonological delta, isolates the custom sound barrier, generates targeted phonetic exercises, and creates rhythmic, custom tongue-twisters to unlock muscle memory."

### 2:20 - 2:45 | Intelligent Memory & Cognitive Search
* **Visual:** Navigate to the "Vocabulary Tracker" or a semantic RAG utility card. Perform a quick search or demonstrate the structured retrieval of past speech metrics.
* **Audio / Voiceover:**
  > "We also built an **Elasticsearch-inspired RAG pipeline**. 
  > Working alongside our secure storage schema, it enables teachers and speech therapists to query clinical speech databases using expressive natural language, instantly retrieving scientific reading exercises and customized remediation logs tailored to the child's exact history."

### 2:45 - 3:00 | The Master Plan: Porting to Apple & Spatial Computing
* **Visual:** Return to the central dashboard, highlighting the beautiful "Mount AI Scholar" distinct logo.
* **Audio / Voiceover:**
  > "This is just our starting line. This identical core pipeline is designed to be fully ported to Swift Playgrounds using **SwiftUI, CoreML, and ARKit** for our objective: WWDC Swift Student Challenge 2027.
  > True disruption is defined by the quality of the architecture we build today. 
  > Thank you, and let's keep compiling."
