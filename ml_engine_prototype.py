# ==========================================
# MOUNT AI SCHOLAR - MOTEUR ML (PROTOTYPE)
# ==========================================
# Cible : PC Windows (Entraînement / API)
# Lancement : uvicorn ml_engine_prototype:app --reload
# ==========================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

app = FastAPI(title="Mount AI Scholar - API Machine Learning")

# Configuration CORS pour autoriser l'application React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En développement, on autorise tout
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles de données pour l'API
class AudioData(BaseModel):
    transcript: str

class ContentData(BaseModel):
    text: str
    language: str

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "engine": "MountAI_Core_v1",
        "capabilities": ["phoneme_extraction", "nlp_synthesis"]
    }

@app.post("/api/analyse-phonemes")
async def analyse_phonemes(data: AudioData):
    """
    Ici, tu brancheras tes vrais modèles Python de traitement de la parole
    pour extraire des phonèmes complexes (pour l'aide à la dyslexie).
    """
    # Simulation du retour de l'IA Python
    words = data.transcript.split()
    phonemes = [f"/[{w[:2].lower()}]/" for w in words if len(w) > 1]
    
    return {
        "transcript": data.transcript, 
        "phonemes_detectes": phonemes,
        "processing_time_ms": 42
    }

@app.post("/api/generer-presentation")
async def generate_presentation(data: ContentData):
    """
    Service pour générer du contenu lourd.
    """
    return {
        "titre": "Présentation Générée par ML",
        "slides": [
            f"Sujet : {data.text[:30]}...",
            "Analyse automatique",
            "Conclusion IA"
        ]
    }
